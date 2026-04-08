import { getCurrentAuthUser } from '@/lib/auth';
import {
  deleteOwnedCommunityLevelFromSupabase,
  getAccessibleCommunityLevelFromSupabase,
  setOwnedCommunityLevelPublishedInSupabase,
} from '@/lib/supabase-community';
import { getBuiltInCommunityLevel } from '@/levels/community-levels';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return Response.json({ error: 'Invalid community level id.' }, { status: 400 });
  }

  const builtInLevel = getBuiltInCommunityLevel(numericId);
  if (builtInLevel) {
    return Response.json({
      level: {
        ...builtInLevel,
        grid: builtInLevel.grid.map(row => [...row]),
        players: builtInLevel.players.map(player => ({ ...player })),
      },
    });
  }

  try {
    const user = await getCurrentAuthUser();
    const record = await getAccessibleCommunityLevelFromSupabase(numericId, user?.id ?? null);
    if (!record) {
      return Response.json({ error: 'Community level not found.' }, { status: 404 });
    }

    return Response.json({
      level: record.level,
      summary: {
        id: record.id,
        name: record.name,
        width: record.width,
        height: record.height,
        isPublished: record.isPublished,
        updatedAt: record.updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load community level.';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return Response.json({ error: 'Invalid community level id.' }, { status: 400 });
  }

  if (getBuiltInCommunityLevel(numericId)) {
    return Response.json({ error: 'Built-in community levels cannot be edited.' }, { status: 400 });
  }

  const user = await getCurrentAuthUser();
  if (!user) {
    return Response.json({ error: 'Sign in with Google to manage your cloud maps.' }, { status: 401 });
  }

  try {
    const { isPublished } = await request.json() as { isPublished?: boolean };
    if (typeof isPublished !== 'boolean') {
      return Response.json({ error: 'Missing publication status.' }, { status: 400 });
    }

    const summary = await setOwnedCommunityLevelPublishedInSupabase(user.id, numericId, isPublished, user.isAdmin);
    return Response.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update publication status.';
    const status = /own|publish up to/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return Response.json({ error: 'Invalid community level id.' }, { status: 400 });
  }

  if (getBuiltInCommunityLevel(numericId)) {
    return Response.json({ error: 'The built-in community level cannot be deleted.' }, { status: 400 });
  }

  const user = await getCurrentAuthUser();
  if (!user) {
    return Response.json({ error: 'Sign in with Google to delete your cloud maps.' }, { status: 401 });
  }

  try {
    await deleteOwnedCommunityLevelFromSupabase(user.id, numericId);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete cloud map.';
    const status = /own/i.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
