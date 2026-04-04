'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { TOTAL_LEVELS, getLocalCampaignOverride } from '@/levels';
import { fetchCampaignOverrideIdsFromApi } from '@/lib/campaign-api';

export default function LevelSelect() {
  const { progress, isUnlocked } = useGameProgress();
  const [serverOverrides, setServerOverrides] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function loadOverrides() {
      try {
        const ids = await fetchCampaignOverrideIdsFromApi();
        if (cancelled) return;
        setServerOverrides(new Set(ids));
      } catch {
        if (cancelled) return;
        setServerOverrides(new Set());
      }
    }
    loadOverrides();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-4 max-w-[720px] mx-auto">
      {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
        const id = i + 1;
        const unlocked = isUnlocked(id);
        const completed = progress.completedLevels.includes(id);
        const hasLocalOverride = Boolean(getLocalCampaignOverride(id));
        const hasServerOverride = serverOverrides.has(id);
        const showLocalBackupWarning = hasLocalOverride && !hasServerOverride;

        if (!unlocked) {
          return (
            <div
              key={id}
              className="relative aspect-square min-h-[64px] sm:min-h-[78px] flex items-center justify-center rounded-xl bg-white/[0.03] text-white/15 font-mono text-lg sm:text-2xl cursor-not-allowed border border-white/[0.04] select-none"
              style={{ animationDelay: `${i * 30}ms` }}
              aria-label={`Level ${id} locked`}
            >
              {id}
            </div>
          );
        }

        return (
          <Link
            key={id}
            href={`/play/${id}`}
            className={`relative aspect-square min-h-[64px] sm:min-h-[78px] flex items-center justify-center rounded-xl font-mono text-lg sm:text-2xl transition-all duration-300 border select-none ${
              completed
                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 hover:shadow-[0_0_20px_rgba(74,222,128,0.1)]'
                : 'bg-white/[0.06] text-white/80 border-white/10 hover:bg-white/[0.12] hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]'
            }`}
            style={{ animationDelay: `${i * 30}ms` }}
            aria-label={`Play level ${id}`}
          >
            {showLocalBackupWarning && (
              <span className="absolute top-2 right-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-amber-200/80">
                Backup
              </span>
            )}
            {completed ? '✓' : id}
          </Link>
        );
      })}
    </div>
  );
}
