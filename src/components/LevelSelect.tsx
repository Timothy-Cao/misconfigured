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

const SHOW_BEST_SOLUTIONS_STORAGE_KEY = 'misconfigured:show-best-solutions';

type Difficulty = 'tutorial' | 'easy' | 'medium' | 'hard' | 'impossible';

const DIFFICULTY_LEGEND: Array<{ key: Difficulty; label: string; swatchClassName: string }> = [
  { key: 'tutorial', label: 'Tutorial', swatchClassName: 'bg-white' },
  { key: 'easy', label: 'Easy', swatchClassName: 'bg-emerald-400' },
  { key: 'medium', label: 'Medium', swatchClassName: 'bg-amber-300' },
  { key: 'hard', label: 'Hard', swatchClassName: 'bg-red-400' },
  { key: 'impossible', label: 'Impossible', swatchClassName: 'bg-black ring-1 ring-white/25' },
];

const DIFFICULTY_CARD_CLASS: Record<Difficulty, string> = {
  tutorial: 'border-white/20 bg-white/[0.08] ring-white/35 hover:border-white/35 hover:bg-white/[0.13]',
  easy: 'border-emerald-300/25 bg-emerald-500/[0.12] ring-emerald-300/45 hover:border-emerald-200/45 hover:bg-emerald-400/[0.18]',
  medium: 'border-amber-300/30 bg-amber-400/[0.14] ring-amber-300/50 hover:border-amber-200/50 hover:bg-amber-300/[0.20]',
  hard: 'border-red-300/35 bg-red-500/[0.14] ring-red-300/55 hover:border-red-200/55 hover:bg-red-400/[0.20]',
  impossible: 'border-white/10 bg-black/70 ring-white/20 hover:border-white/20 hover:bg-black/80',
};

function getCampaignDifficulty(levelId: number, levelName?: string): Difficulty {
  if (levelName === 'Skating Rink') return 'medium';
  if (levelName === 'Rotation Station 2') return 'easy';
  if (levelId >= 1 && levelId <= 7) return 'tutorial';
  if (levelId >= 8 && levelId <= 15) return 'easy';
  if (levelId >= 16 && levelId <= 21) return 'medium';
  return 'hard';
}

function readStoredShowBestSolutions(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(SHOW_BEST_SOLUTIONS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

type LevelSelectProps = {
  onSolutionModeChange?: (enabled: boolean) => void;
};

export default function LevelSelect({ onSolutionModeChange }: LevelSelectProps) {
  const { progress, isUnlocked } = useGameProgress();
  const [serverOverrides, setServerOverrides] = useState<Set<number>>(new Set());
  const [overrideLevels, setOverrideLevels] = useState<Map<number, LevelData>>(new Map());
  const [bestScores, setBestScores] = useState<Map<string, LevelBestScore>>(new Map());
  const [showBestSolutions, setShowBestSolutions] = useState(readStoredShowBestSolutions);

  useEffect(() => {
    onSolutionModeChange?.(showBestSolutions);
  }, [onSolutionModeChange, showBestSolutions]);

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

  const toggleBestSolutions = () => {
    setShowBestSolutions(value => {
      const next = !value;
      try {
        window.localStorage.setItem(SHOW_BEST_SOLUTIONS_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage failures; the toggle still works for this session.
      }
      return next;
    });
  };

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
    <div className="mx-auto max-w-5xl p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Campaign Standard
            </h1>
          </div>
          <button
            type="button"
            onClick={toggleBestSolutions}
            aria-pressed={showBestSolutions}
            aria-label={`Switch to ${showBestSolutions ? 'play' : 'solution'} mode`}
            className={`flex w-fit items-center gap-2 rounded-2xl border px-2 py-2 text-xs font-black uppercase tracking-[0.16em] transition-all duration-200 ${
              showBestSolutions
                ? 'border-cyan-300/45 bg-cyan-400/15 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.08)]'
                : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/85'
            }`}
          >
            <span className={`rounded-xl px-3 py-1.5 transition-all ${
              showBestSolutions ? 'text-white/40' : 'bg-white/90 text-black'
            }`}>
              Play
            </span>
            <span className={`rounded-xl px-3 py-1.5 transition-all ${
              showBestSolutions ? 'bg-cyan-200 text-black' : 'text-white/40'
            }`}>
              Solution
            </span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="mr-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Difficulty
          </span>
          {DIFFICULTY_LEGEND.map(item => (
            <span
              key={item.key}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${item.swatchClassName}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {levelCards.map(({ id, level, hash }, i) => {
          const unlocked = isUnlocked(id);
          const completed = progress.completedLevels.includes(id);
          const difficulty = getCampaignDifficulty(id, level?.name);
          const hasLocalOverride = Boolean(getLocalCampaignOverride(id));
          const hasServerOverride = serverOverrides.has(id);
          const showLocalBackupWarning = hasLocalOverride && !hasServerOverride;
          const bestScore = hash ? bestScores.get(hash) : undefined;
          const hasBestSolution = Boolean(bestScore?.solutionMoves);
          const cardHref = showBestSolutions && hasBestSolution ? `/play/${id}?replay=best` : `/play/${id}`;

          if (!unlocked) {
            return (
              <div
                key={id}
                className={`relative flex min-h-[132px] flex-col justify-between rounded-2xl p-2 text-white/20 cursor-not-allowed border ring-1 ${DIFFICULTY_CARD_CLASS[difficulty]} select-none`}
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
              className={`relative flex min-h-[148px] flex-col justify-between gap-2 rounded-2xl p-2 text-white/85 transition-all duration-300 border ring-1 ${DIFFICULTY_CARD_CLASS[difficulty]} hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] select-none`}
              style={{ animationDelay: `${i * 30}ms` }}
              aria-label={showBestSolutions && hasBestSolution ? `Show best solution for level ${id}` : `Play level ${id}`}
            >
              {level && <LevelThumbnail level={level} className="h-20 w-full sm:h-24" />}
              {showLocalBackupWarning && (
                <span className="absolute top-2 right-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-amber-200/80">
                  Backup
                </span>
              )}
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-lg leading-none sm:text-xl">
                    <span className={completed ? 'text-green-200' : 'text-white/90'}>
                      {completed ? '✓' : id}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-white/35">
                    {level?.name ?? `Level ${id}`}
                  </div>
                </div>
                {showBestSolutions && (
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                    hasBestSolution
                      ? 'border-white/25 bg-white/15 text-white'
                      : 'border-white/10 bg-black/20 text-white/25'
                  }`}>
                    {hasBestSolution ? `${bestScore?.bestMoves ?? ''} moves` : 'No Solution'}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
