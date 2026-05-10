import { type LevelData } from '@/engine/types';
import { getCurrentAuthUser } from '@/lib/auth';
import { type CommunityLevelListItem, listPublishedCommunityLevelItemsFromSupabase, saveOwnedCommunityLevelInSupabase } from '@/lib/supabase-community';
import { builtInCommunityLevels, getBuiltInCommunityLevel } from '@/levels/community-levels';
import { getPublicReadCacheHeaders } from '@/lib/public-cache';
import { validateLevelData, sanitizeLevelData } from '@/lib/validate-level';

export const dynamic = 'force-dynamic';

function mergeBuiltInCommunityLevels(levels: CommunityLevelListItem[]): CommunityLevelListItem[] {
  const byId = new Map<number, CommunityLevelListItem>();
  for (const builtInLevel of builtInCommunityLevels) {
    byId.set(builtInLevel.id, {
      ...builtInLevel,
      grid: builtInLevel.grid.map(row => [...row]),
      players: builtInLevel.players.map(player => ({ ...player })),
      creatorInitials: 'MI',
      creatorName: 'Misconfigured',
      isBuiltIn: true,
    });
  }

  for (const level of levels) {
    byId.set(level.id, level);
  }

  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

export async function GET() {
  try {
    const levels = await listPublishedCommunityLevelItemsFromSupabase();
    return Response.json({ levels: mergeBuiltInCommunityLevels(levels) }, {
      headers: getPublicReadCacheHeaders(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load community levels.';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return Response.json({ error: 'Sign in with Google to save cloud maps.' }, { status: 401 });
    }

    const { level, id, isPublished } = await request.json() as {
      level?: LevelData;
      id?: number | null;
      isPublished?: boolean;
    };

    const validationError = validateLevelData(level);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    if (id != null && (!Number.isFinite(id) || getBuiltInCommunityLevel(Number(id)))) {
      return Response.json({ error: 'Invalid cloud map id.' }, { status: 400 });
    }

    const saved = await saveOwnedCommunityLevelInSupabase({
      id: id != null ? Number(id) : null,
      ownerId: user.id,
      isAdmin: user.isAdmin,
      level: sanitizeLevelData(level as LevelData),
      isPublished: Boolean(isPublished),
    });

    return Response.json({
      level: saved.level,
      summary: {
        id: saved.id,
        name: saved.name,
        width: saved.width,
        height: saved.height,
        isPublished: saved.isPublished,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save cloud map.';
    const status = /sign in/i.test(message) ? 401 : /own|publish up to/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
