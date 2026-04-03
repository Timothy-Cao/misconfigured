import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerEnv } from './env';

export function getSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
