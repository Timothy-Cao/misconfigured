'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCommunityLevels, getNextCommunityLevelId } from '@/levels';

export default function CommunityPage() {
  const router = useRouter();
  const levels = useMemo(() => getCommunityLevels(), []);
  const nextCommunityLevelId = levels.length > 0 ? getNextCommunityLevelId() : 1001;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        router.push('/');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[110px]" />

      <div className="relative z-10 w-full max-w-5xl rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
              Community Levels
            </h1>
            <p className="text-white/35 text-sm sm:text-base mt-1">
              Community play is open. Uploading or overriding slots from the editor still requires the admin password.
            </p>
            <p className="text-white/20 text-xs sm:text-sm mt-2">Press Esc to return to the title.</p>
          </div>
          <Link
            href="/editor"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white/75 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-200"
          >
            Open Editor
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <p className="text-white/45 text-sm sm:text-base">
              {levels.length > 0
                ? `${levels.length} community level${levels.length === 1 ? '' : 's'} available`
                : 'No community levels saved yet'}
            </p>
            <p className="text-white/25 text-xs sm:text-sm">
              Next suggested slot: {nextCommunityLevelId}
            </p>
          </div>

          {levels.length > 0 ? (
            <div className="grid gap-3">
              {levels.map(level => (
                <div
                  key={level.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4"
                >
                  <div>
                    <p className="text-white text-base sm:text-lg font-medium">{level.name}</p>
                    <p className="text-white/35 text-xs sm:text-sm">
                      Community {level.id} - {level.width}x{level.height}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/play/${level.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 transition-all duration-200 text-sm sm:text-base"
                    >
                      Play
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm sm:text-base">
              Save a level to a community slot from the editor publish tab to populate this page.
            </p>
          )}
        </div>
      </div>

      <Link
        href="/"
        className="relative z-10 mt-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm sm:text-base text-white/75 hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300"
      >
        Back to Title
      </Link>
    </main>
  );
}
