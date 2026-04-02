'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { getCommunityLevels, getNextCommunityLevelId } from '@/levels';
import { verifyAdminPassword } from '@/lib/admin';

export default function CommunityPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [levels, setLevels] = useState(getCommunityLevels);

  const handleUnlock = useCallback(async () => {
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      setError('Invalid admin password');
      return;
    }

    setLevels(getCommunityLevels());
    setUnlocked(true);
    setError('');
  }, [password]);

  const nextCommunityLevelId = levels.length > 0 ? getNextCommunityLevelId() : 1001;

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-cyan-500/5 blur-[100px]" />

      {!unlocked ? (
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent mb-2">
            Community Levels
          </h1>
          <p className="text-white/35 text-sm mb-5">
            Enter the admin password to browse and test community level slots.
          </p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleUnlock}
            className="w-full mt-3 px-4 py-2 rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 transition-all duration-200"
          >
            Unlock
          </button>
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          <Link
            href="/"
            className="inline-block mt-4 text-white/30 hover:text-white/70 text-sm transition-colors duration-300"
          >
            &larr; Back to Title
          </Link>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-4xl">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
                Community Levels
              </h1>
              <p className="text-white/35 text-sm mt-1">
                Saved community slots live above the built-in campaign range.
              </p>
            </div>
            <Link
              href="/editor"
              className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all duration-200"
            >
              Open Editor
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="text-white/45 text-sm">
                {levels.length > 0
                  ? `${levels.length} community level${levels.length === 1 ? '' : 's'} available`
                  : 'No community levels saved yet'}
              </p>
              <p className="text-white/25 text-xs">
                Next suggested slot: {nextCommunityLevelId}
              </p>
            </div>

            {levels.length > 0 ? (
              <div className="grid gap-3">
                {levels.map(level => (
                  <div
                    key={level.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                  >
                    <div>
                      <p className="text-white font-medium">{level.name}</p>
                      <p className="text-white/35 text-xs">
                        Community {level.id} · {level.width}x{level.height}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/play/${level.id}`}
                        className="px-3 py-1.5 rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 transition-all duration-200 text-sm"
                      >
                        Play
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/30 text-sm">
                Save a level to a community slot from the editor publish tab to populate this page.
              </p>
            )}
          </div>

          <Link
            href="/"
            className="inline-block mt-6 text-white/30 hover:text-white/70 text-sm transition-colors duration-300"
          >
            &larr; Back to Title
          </Link>
        </div>
      )}
    </main>
  );
}
