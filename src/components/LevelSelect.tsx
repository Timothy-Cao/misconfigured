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

type Difficulty = 'tutorial' | 'easy' | 'medium' | 'hard';

const DIFFICULTY_LEGEND: Array<{ key: Difficulty; label: string; swatchClassName: string }> = [
  { key: 'tutorial', label: 'Tutorial', swatchClassName: 'bg-white' },
  { key: 'easy', label: 'Easy', swatchClassName: 'bg-emerald-400' },
  { key: 'medium', label: 'Medium', swatchClassName: 'bg-amber-300' },
  { key: 'hard', label: 'Hard', swatchClassName: 'bg-red-400' },
];

const DIFFICULTY_CARD_CLASS: Record<Difficulty, string> = {
  tutorial: 'ring-white/35',
  easy: 'ring-emerald-400/45',
  medium: 'ring-amber-300/50',
  hard: 'ring-red-400/55',
};

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  tutorial: 'border-white/20 bg-white/10 text-white/75',
  easy: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100/80',
  medium: 'border-amber-300/35 bg-amber-400/10 text-amber-100/85',
  hard: 'border-red-300/40 bg-red-400/10 text-red-100/90',
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

export default function LevelSelect() {
  const { progress, isUnlocked } = useGameProgress();
  const [serverOverrides, setServerOverrides] = useState<Set<number>>(new Set());
  const [overrideLevels, setOverrideLevels] = useState<Map<number, LevelData>>(new Map());
  const [bestScores, setBestScores] = useState<Map<string, LevelBestScore>>(new Map());
  const [showBestSolutions, setShowBestSolutions] = useState(readStoredShowBestSolutions);

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
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <button
          type="button"
          onClick={toggleBestSolutions}
          className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all duration-200 ${
            showBestSolutions
              ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
              : 'border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/75'
          }`}
        >
          {showBestSolutions ? 'Showing Best Solutions' : 'Show Best Solutions'}
        </button>
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
                className={`relative flex min-h-[132px] flex-col justify-between rounded-2xl bg-white/[0.03] p-2 text-white/15 cursor-not-allowed border border-white/[0.04] ring-1 ${DIFFICULTY_CARD_CLASS[difficulty]} select-none`}
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
              className={`relative flex min-h-[148px] flex-col justify-between gap-2 rounded-2xl p-2 transition-all duration-300 border ring-1 ${DIFFICULTY_CARD_CLASS[difficulty]} select-none ${
                showBestSolutions && hasBestSolution
                  ? 'bg-cyan-500/10 text-cyan-100 border-cyan-300/25 hover:bg-cyan-500/18 hover:border-cyan-200/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                  : completed
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 hover:shadow-[0_0_20px_rgba(74,222,128,0.1)]'
                    : 'bg-white/[0.06] text-white/80 border-white/10 hover:bg-white/[0.12] hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]'
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
              aria-label={showBestSolutions && hasBestSolution ? `Show best solution for level ${id}` : `Play level ${id}`}
            >
              {level && <LevelThumbnail level={level} className="h-20 w-full sm:h-24" />}
              <span className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${DIFFICULTY_BADGE_CLASS[difficulty]}`}>
                {difficulty === 'tutorial' ? 'Tut' : difficulty}
              </span>
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
                  showBestSolutions
                    ? hasBestSolution
                      ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                      : 'border-white/10 bg-black/20 text-white/25'
                    : bestScore
                      ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100/80'
                      : 'border-white/10 bg-black/20 text-white/25'
                }`}>
                  {showBestSolutions
                    ? (hasBestSolution ? 'Best Solution' : 'No Solution')
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
