import { type LevelData } from '@/engine/types';
import { verifyCommunityPassword } from '@/lib/admin';
import { deleteCommunityLevelFromSupabase, listCommunityLevelsFromSupabase, upsertCommunityLevelInSupabase } from '@/lib/supabase-community';
import { builtInCommunityLevels, getBuiltInCommunityLevel } from '@/levels/community-levels';

export const dynamic = 'force-dynamic';

function mergeBuiltInCommunityLevels(levels: LevelData[]): LevelData[] {
  const byId = new Map<number, LevelData>();
  for (const builtInLevel of builtInCommunityLevels) {
    byId.set(builtInLevel.id, {
      ...builtInLevel,
      grid: builtInLevel.grid.map(row => [...row]),
      players: builtInLevel.players.map(player => ({ ...player })),
    });
  }

  for (const level of levels) {
    byId.set(level.id, level);
  }

  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

export async function GET() {
  try {
    const levels = await listCommunityLevelsFromSupabase();
    return Response.json({ levels: mergeBuiltInCommunityLevels(levels) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load community levels.';
    return Response.json(
      {
        levels: mergeBuiltInCommunityLevels([]),
        warning: message,
      },
      { status: 200 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { level, password } = await request.json() as { level?: LevelData; password?: string };

    if (!level || typeof level !== 'object') {
      return Response.json({ error: 'Missing level payload.' }, { status: 400 });
    }

    if (!(await verifyCommunityPassword(password ?? ''))) {
      return Response.json({ error: 'Invalid community password.' }, { status: 401 });
    }

    const savedLevel = await upsertCommunityLevelInSupabase(level);
    return Response.json({ level: savedLevel });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save community level.';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id, password } = await request.json() as { id?: number; password?: string };

    if (!Number.isFinite(id)) {
      return Response.json({ error: 'Missing community level id.' }, { status: 400 });
    }

    const numericId = Number(id);

    if (getBuiltInCommunityLevel(numericId)) {
      return Response.json({ error: 'The built-in community level cannot be deleted.' }, { status: 400 });
    }

    if (!(await verifyCommunityPassword(password ?? ''))) {
      return Response.json({ error: 'Invalid community password.' }, { status: 401 });
    }

    await deleteCommunityLevelFromSupabase(numericId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete community level.';
    return Response.json({ error: message }, { status: 500 });
  }
}
