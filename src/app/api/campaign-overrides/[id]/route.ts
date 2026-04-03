import { verifyAdminPassword } from '@/lib/admin';
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
    const { level, password } = await request.json() as { level?: LevelData; password?: string };
    if (!level || typeof level !== 'object') {
      return Response.json({ error: 'Missing level payload.' }, { status: 400 });
    }

    if (!(await verifyAdminPassword(password ?? ''))) {
      return Response.json({ error: 'Invalid admin password.' }, { status: 401 });
    }

    const savedLevel = await upsertCampaignOverrideInSupabase({ ...level, id: numericId });
    return Response.json({ level: savedLevel });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save campaign override.';
    return Response.json({ error: message }, { status: 500 });
  }
}
