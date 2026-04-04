import { listCampaignOverrideIdsFromSupabase } from '@/lib/supabase-campaign';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ids = await listCampaignOverrideIdsFromSupabase();
    return Response.json({ ids });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load campaign override list.';
    return Response.json({ ids: [], warning: message }, { status: 200 });
  }
}
