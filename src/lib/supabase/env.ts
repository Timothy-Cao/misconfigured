export interface SupabaseBrowserEnv {
  url: string;
  anonKey: string;
}

export interface SupabaseServerEnv extends SupabaseBrowserEnv {
  serviceRoleKey: string;
}

export function hasSupabaseBrowserEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasSupabaseServerEnv(): boolean {
  return hasSupabaseBrowserEnv() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseBrowserEnv(): SupabaseBrowserEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase browser environment variables are missing.');
  }

  return { url, anonKey };
}

export function getSupabaseServerEnv(): SupabaseServerEnv {
  const { url, anonKey } = getSupabaseBrowserEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Supabase service role key is missing.');
  }

  return { url, anonKey, serviceRoleKey };
}
