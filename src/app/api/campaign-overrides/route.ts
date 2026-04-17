import { listCampaignOverrideIdsFromSupabase } from '@/lib/supabase-campaign';
import { getPublicReadCacheHeaders } from '@/lib/public-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ids = await listCampaignOverrideIdsFromSupabase();
    return Response.json({ ids }, {
      headers: getPublicReadCacheHeaders(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load campaign override list.';
    return Response.json({ ids: [], warning: message }, { status: 200 });
  }
}
