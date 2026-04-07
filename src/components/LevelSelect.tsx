'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { TOTAL_LEVELS, getBuiltInLevel, getLocalCampaignOverride } from '@/levels';
import { fetchCampaignOverrideFromApi, fetchCampaignOverrideIdsFromApi } from '@/lib/campaign-api';
import { fetchLevelBestScoresFromApi, type LevelBestScore } from '@/lib/best-score-api';
import { getLevelHash } from '@/lib/level-hash';
import LevelThumbnail from '@/components/LevelThumbnail';
import { type LevelData } from '@/engine/types';

export default function LevelSelect() {
  const { progress, isUnlocked } = useGameProgress();
  const [serverOverrides, setServerOverrides] = useState<Set<number>>(new Set());
  const [overrideLevels, setOverrideLevels] = useState<Map<number, LevelData>>(new Map());
  const [bestScores, setBestScores] = useState<Map<string, LevelBestScore>>(new Map());
  const [showBestReplays, setShowBestReplays] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadOverrides() {
      try {
        const ids = await fetchCampaignOverrideIdsFromApi();
        if (cancelled) return;
        setServerOverrides(new Set(ids));
        const entries = await Promise.all(
          ids.map(async id => [id, await fetchCampaignOverrideFromApi(id)] as const),
        );
        if (cancelled) return;
        setOverrideLevels(new Map(entries.flatMap(([id, level]) => level ? [[id, level] as const] : [])));
      } catch {
        if (cancelled) return;
        setServerOverrides(new Set());
        setOverrideLevels(new Map());
      }
    }
    loadOverrides();
    return () => {
      cancelled = true;
    };
  }, []);

  const levelCards = useMemo(() => {
    return Array.from({ length: TOTAL_LEVELS }, (_, i) => {
      const id = i + 1;
      const level = overrideLevels.get(id) ?? getLocalCampaignOverride(id) ?? getBuiltInLevel(id);
      const hash = level ? getLevelHash(level) : null;
      return { id, level, hash };
    });
  }, [overrideLevels]);

  const levelHashKey = useMemo(
    () => levelCards.map(card => card.hash).filter(Boolean).join(','),
    [levelCards],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadBestScores() {
      const hashes = levelCards.map(card => card.hash).filter((hash): hash is string => Boolean(hash));
      try {
        const scores = await fetchLevelBestScoresFromApi(hashes);
        if (!cancelled) {
          setBestScores(scores);
        }
      } catch {
        if (!cancelled) {
          setBestScores(new Map());
        }
      }
    }
    loadBestScores();
    return () => {
      cancelled = true;
    };
  }, [levelCards, levelHashKey]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowBestReplays(value => !value)}
          className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all duration-200 ${
            showBestReplays
              ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
              : 'border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/75'
          }`}
        >
          {showBestReplays ? 'Showing Replays' : 'Show Replays'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {levelCards.map(({ id, level, hash }, i) => {
          const unlocked = isUnlocked(id);
          const completed = progress.completedLevels.includes(id);
          const hasLocalOverride = Boolean(getLocalCampaignOverride(id));
          const hasServerOverride = serverOverrides.has(id);
          const showLocalBackupWarning = hasLocalOverride && !hasServerOverride;
          const bestScore = hash ? bestScores.get(hash) : undefined;
          const hasBestReplay = Boolean(bestScore?.solutionMoves);
          const cardHref = showBestReplays && hasBestReplay ? `/play/${id}?replay=best` : `/play/${id}`;

          if (!unlocked) {
            return (
              <div
                key={id}
                className="relative flex min-h-[132px] flex-col justify-between rounded-2xl bg-white/[0.03] p-2 text-white/15 cursor-not-allowed border border-white/[0.04] select-none"
                style={{ animationDelay: `${i * 30}ms` }}
                aria-label={`Level ${id} locked`}
              >
                {level && <LevelThumbnail level={level} className="h-20 w-full opacity-30" />}
                <span className="font-mono text-lg">{id}</span>
              </div>
            );
          }

          return (
            <Link
              key={id}
              href={cardHref}
              className={`relative flex min-h-[148px] flex-col justify-between gap-2 rounded-2xl p-2 transition-all duration-300 border select-none ${
                showBestReplays && hasBestReplay
                  ? 'bg-cyan-500/10 text-cyan-100 border-cyan-300/25 hover:bg-cyan-500/18 hover:border-cyan-200/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                  : completed
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 hover:shadow-[0_0_20px_rgba(74,222,128,0.1)]'
                    : 'bg-white/[0.06] text-white/80 border-white/10 hover:bg-white/[0.12] hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]'
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
              aria-label={showBestReplays && hasBestReplay ? `Replay best solution for level ${id}` : `Play level ${id}`}
            >
              {level && <LevelThumbnail level={level} className="h-20 w-full sm:h-24" />}
              {showLocalBackupWarning && (
                <span className="absolute top-2 right-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-amber-200/80">
                  Backup
                </span>
              )}
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-lg leading-none sm:text-xl">
                    {completed ? '✓' : id}
                  </div>
                  <div className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-white/35">
                    {level?.name ?? `Level ${id}`}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                  showBestReplays
                    ? hasBestReplay
                      ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                      : 'border-white/10 bg-black/20 text-white/25'
                    : bestScore
                      ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100/80'
                      : 'border-white/10 bg-black/20 text-white/25'
                }`}>
                  {showBestReplays
                    ? (hasBestReplay ? 'Replay' : 'No Replay')
                    : (bestScore ? `Best ${bestScore.bestMoves}` : 'No Best')}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
