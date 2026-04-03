import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';
import { listOwnedCommunityLevelsFromSupabase } from '@/lib/supabase-community';
import { hasSupabaseBrowserEnv, hasSupabaseServerEnv } from '@/lib/supabase/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface AuthUserSummary {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export interface OwnedCloudLevelSummary {
  id: number;
  name: string;
  width: number;
  height: number;
  isPublished: boolean;
  updatedAt: string | null;
}

function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSupabaseAuthReady(): boolean {
  return hasSupabaseBrowserEnv();
}

export async function getCurrentAuthUser(): Promise<AuthUserSummary | null> {
  if (!hasSupabaseBrowserEnv()) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const displayName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : null;

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : null;

  const isAdmin = Boolean(
    user.email && parseAdminEmails().includes(user.email.toLowerCase()),
  );

  return {
    id: user.id,
    email: user.email ?? null,
    displayName,
    avatarUrl,
    isAdmin,
  };
}

export async function syncProfileForCurrentUser(): Promise<void> {
  if (!hasSupabaseServerEnv()) {
    return;
  }

  const user = await getCurrentAuthUser();
  if (!user) {
    return;
  }

  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        is_admin: user.isAdmin,
      }, {
        onConflict: 'id',
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to sync profile row:', error);
  }
}

export async function listOwnedCloudLevels(): Promise<{
  user: AuthUserSummary | null;
  levels: OwnedCloudLevelSummary[];
  warning: string | null;
}> {
  const user = await getCurrentAuthUser();
  if (!user) {
    return { user: null, levels: [], warning: null };
  }

  try {
    const levels = await listOwnedCommunityLevelsFromSupabase(user.id);
    return { user, levels, warning: null };
  } catch (error) {
    const warning = error instanceof Error ? error.message : 'Failed to load cloud maps.';
    return { user, levels: [], warning };
  }
}

export async function getGoogleAuthRedirectPath(nextPath?: string | null): Promise<string> {
  const candidate = nextPath?.trim();
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/';
  }
  return candidate;
}
