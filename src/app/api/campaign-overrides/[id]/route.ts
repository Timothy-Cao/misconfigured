import { getCurrentAuthUser } from '@/lib/auth';
import { getCampaignOverrideFromSupabase, upsertCampaignOverrideInSupabase } from '@/lib/supabase-campaign';
import { type LevelData } from '@/engine/types';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return Response.json({ error: 'Invalid campaign level id.' }, { status: 400 });
  }

  try {
    const level = await getCampaignOverrideFromSupabase(numericId);
    if (!level) {
      return Response.json({ error: 'Campaign override not found.' }, { status: 404 });
    }

    return Response.json({ level });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load campaign override.';
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return Response.json({ error: 'Invalid campaign level id.' }, { status: 400 });
  }

  try {
    const user = await getCurrentAuthUser();
    if (!user?.isAdmin) {
      return Response.json({ error: 'Admin sign-in required to edit campaign levels.' }, { status: 401 });
    }

    const { level } = await request.json() as { level?: LevelData };
    if (!level || typeof level !== 'object') {
      return Response.json({ error: 'Missing level payload.' }, { status: 400 });
    }

    const savedLevel = await upsertCampaignOverrideInSupabase({ ...level, id: numericId });
    return Response.json({ level: savedLevel });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save campaign override.';
    return Response.json({ error: message }, { status: 500 });
  }
}
