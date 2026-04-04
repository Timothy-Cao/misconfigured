import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getGoogleAuthRedirectPath, syncProfileForCurrentUser } from '@/lib/auth';
import { hasSupabaseBrowserEnv, getSupabaseBrowserEnv } from '@/lib/supabase/env';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = await getGoogleAuthRedirectPath(requestUrl.searchParams.get('next'));

  if (!hasSupabaseBrowserEnv() || !code) {
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseBrowserEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.exchangeCodeForSession(code);
  await syncProfileForCurrentUser();

  return NextResponse.redirect(new URL(nextPath, request.url));
}
