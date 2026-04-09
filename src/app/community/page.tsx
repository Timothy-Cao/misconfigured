'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCommunityLevelsFromApi } from '@/lib/community-api';
import { type CommunityLevelListItem } from '@/lib/supabase-community';
import { type AuthUserSummary } from '@/lib/auth';

export default function CommunityPage() {
  const router = useRouter();
  const [levels, setLevels] = useState<CommunityLevelListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<AuthUserSummary | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    function goHome() {
      router.push('/');
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        goHome();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadLevels() {
      try {
        const [nextLevels, authResponse] = await Promise.all([
          fetchCommunityLevelsFromApi(),
          fetch('/api/auth/me', { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        const authData = await authResponse.json() as { user?: AuthUserSummary | null };
        setLevels(nextLevels);
        setViewer(authData.user ?? null);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load community levels.');
      }
    }

    loadLevels();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdminDelete(level: CommunityLevelListItem) {
    if (!viewer?.isAdmin || level.isBuiltIn) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${level.name}" (Community ${level.id}) from the community database?\n\nThis cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(level.id);
      const response = await fetch(`/api/community-levels/${level.id}`, {
        method: 'DELETE',
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete community level.');
      }
      setLevels(current => current.filter(item => item.id !== level.id));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to delete community level.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-[#0a0a0f] flex flex-col items-center p-6 sm:min-h-[calc(100svh-5rem)] sm:p-8 lg:p-10 relative overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[110px]" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6 animate-[fadeInUp_0.6s_ease-out]">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
            Community Levels
          </h1>
          <p className="text-white/35 text-sm sm:text-base mt-1">
            Browse published player-made maps and built-in inspiration pieces. Manage your own private and published maps from My Maps.
          </p>
          <p className="text-white/20 text-xs sm:text-sm mt-2">Press Esc to go back.</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <p className="text-white/45 text-sm sm:text-base">
              {levels.length > 0
                ? `${levels.length} community level${levels.length === 1 ? '' : 's'} available`
                : 'No community levels saved yet'}
            </p>
            <p className="text-white/25 text-xs sm:text-sm">Published maps only. Use My Maps to manage your own levels.</p>
          </div>

          {loadError && (
            <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
              {loadError}
            </p>
          )}

          {levels.length > 0 ? (
            <div className="grid gap-3">
              {levels.map(level => (
                <div
                  key={level.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black uppercase tracking-[0.12em] text-white/75">
                      {level.creatorInitials ?? '??'}
                    </div>
                    <div>
                    <p className="text-white text-base sm:text-lg font-medium">{level.name}</p>
                    <p className="text-white/35 text-xs sm:text-sm">
                      Community {level.id} - {level.width}x{level.height}
                    </p>
                    <p className="mt-1 text-white/28 text-[11px] uppercase tracking-[0.16em] sm:text-xs">
                      {level.creatorName ?? 'Unknown creator'}
                    </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <Link
                      href={`/play/${level.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 transition-all duration-200 text-sm sm:text-base"
                    >
                      Play
                    </Link>
                    {viewer?.isAdmin && !level.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => void handleAdminDelete(level)}
                        disabled={deletingId === level.id}
                        className="inline-flex items-center justify-center rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition-all duration-200 hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === level.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm sm:text-base">
              Publish one of your cloud maps from the editor or My Maps to populate this page.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
