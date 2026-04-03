'use client';

import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseBrowserEnv, getSupabaseBrowserEnv } from './env';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  if (!browserClient) {
    const { url, anonKey } = getSupabaseBrowserEnv();
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}
