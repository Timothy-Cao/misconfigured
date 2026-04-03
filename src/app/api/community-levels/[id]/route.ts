import communityLevel1001 from '@/levels/community-1001';
import { verifyCommunityPassword } from '@/lib/admin';
import { deleteCommunityLevelFromSupabase, getCommunityLevelFromSupabase } from '@/lib/supabase-community';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return Response.json({ error: 'Invalid community level id.' }, { status: 400 });
  }

  if (numericId === communityLevel1001.id) {
    return Response.json({
      level: {
        ...communityLevel1001,
        grid: communityLevel1001.grid.map(row => [...row]),
        players: communityLevel1001.players.map(player => ({ ...player })),
      },
    });
  }

  try {
    const level = await getCommunityLevelFromSupabase(numericId);
    if (!level) {
      return Response.json({ error: 'Community level not found.' }, { status: 404 });
    }

    return Response.json({ level });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load community level.';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return Response.json({ error: 'Invalid community level id.' }, { status: 400 });
  }

  if (numericId === communityLevel1001.id) {
    return Response.json({ error: 'The built-in community level cannot be deleted.' }, { status: 400 });
  }

  try {
    const { password } = await request.json() as { password?: string };

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
