'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type Session, type User } from '@supabase/supabase-js';
import { type AuthUserSummary } from '@/lib/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { hasSupabaseBrowserEnv } from '@/lib/supabase/env';

interface AuthControlsProps {
  initialUser?: AuthUserSummary | null;
  className?: string;
}

function mapSupabaseUser(user: User): AuthUserSummary {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name
          : null,
    avatarUrl:
      typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : null,
    isAdmin: false,
  };
}

export default function AuthControls({ initialUser = null, className }: AuthControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUserSummary | null>(initialUser);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let mounted = true;

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!mounted) return;
      const nextUser = data.user;
      if (!nextUser) {
        setUser(null);
        return;
      }
      setUser(mapSupabaseUser(nextUser));
    });

    const { data } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      const nextUser = session?.user;
      setUser(nextUser ? mapSupabaseUser(nextUser) : null);
      startTransition(() => {
        router.refresh();
      });
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  async function handleSignIn() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const origin = window.location.origin;
    const next = pathname || '/';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    startTransition(() => {
      router.refresh();
    });
  }

  if (!hasSupabaseBrowserEnv()) {
    return (
      <div className={className}>
        <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/35">
          Sign-in unavailable
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={className}>
        <button
          onClick={() => void handleSignIn()}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300 disabled:opacity-60"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`.trim()}>
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-sm">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs text-white/60">
            {(user.displayName ?? user.email ?? '?').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-medium text-white/80">
            {user.displayName ?? user.email ?? 'Signed in'}
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.2em] text-white/35">
            {user.isAdmin ? 'Admin' : 'Signed in'}
          </p>
        </div>
      </div>
      <button
        onClick={() => void handleSignOut()}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-200 disabled:opacity-60"
      >
        Sign out
      </button>
    </div>
  );
}
