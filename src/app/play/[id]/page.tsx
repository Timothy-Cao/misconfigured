'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import { COMMUNITY_LEVEL_START_ID, getBuiltInLevel, getCommunityLevel, getLocalCampaignOverride, TOTAL_LEVELS } from '@/levels';
import { useGameProgress } from '@/hooks/useGameProgress';
import { type LevelData } from '@/engine/types';
import { type BufferedAction } from '@/engine/input';
import { fetchCampaignOverrideFromApi } from '@/lib/campaign-api';
import { fetchCommunityLevelFromApi } from '@/lib/community-api';
import { fetchLevelBestScoresFromApi, submitLevelBestScoreToApi } from '@/lib/best-score-api';
import { getLevelHash } from '@/lib/level-hash';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = Number(params.id);
  const builtInCampaignLevel = useMemo(
    () => (levelId < COMMUNITY_LEVEL_START_ID ? getBuiltInLevel(levelId) : undefined),
    [levelId],
  );
  const localCommunityLevel = useMemo(
    () => (levelId >= COMMUNITY_LEVEL_START_ID ? getCommunityLevel(levelId) : undefined),
    [levelId],
  );
  const localOverride = useMemo(
    () => (levelId < COMMUNITY_LEVEL_START_ID ? getLocalCampaignOverride(levelId) : undefined),
    [levelId],
  );
  const [remoteLevel, setRemoteLevel] = useState<LevelData | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isCampaignLevel = levelId < COMMUNITY_LEVEL_START_ID;
  const isRemoteLoading = remoteLevel === undefined;
  const { completeLevel, isUnlocked } = useGameProgress();
  const [levelComplete, setLevelComplete] = useState(false);
  const [settledUnits, setSettledUnits] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [key, setKey] = useState(0);
  const [lives, setLives] = useState(1);
  const [maxLives, setMaxLives] = useState(1);
  const [movesUsed, setMovesUsed] = useState(0);
  const [maxMoves, setMaxMoves] = useState<number | null>(null);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'lives' | 'moves' | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const movesUsedRef = useRef(0);
  const solutionMovesRef = useRef<BufferedAction[]>([]);
  const usingLocalCampaignBackup = isCampaignLevel && !!loadError && !!localOverride;
  const level = isCampaignLevel
    ? (remoteLevel === undefined
      ? undefined
      : (remoteLevel ?? (usingLocalCampaignBackup ? localOverride : builtInCampaignLevel)))
    : (remoteLevel ?? localCommunityLevel ?? undefined);
  const levelHash = useMemo(() => level ? getLevelHash(level) : null, [level]);

  useEffect(() => {
    let cancelled = false;

    async function loadLevel() {
      setRemoteLevel(undefined);
      setLoadError(null);

      try {
        const nextLevel = levelId < COMMUNITY_LEVEL_START_ID
          ? await fetchCampaignOverrideFromApi(levelId)
          : await fetchCommunityLevelFromApi(levelId);
        if (cancelled) return;
        const resolvedLevel = levelId < COMMUNITY_LEVEL_START_ID
          ? (nextLevel ?? builtInCampaignLevel)
          : (nextLevel ?? localCommunityLevel);
        const startingLives = resolvedLevel?.lives ?? 1;
        setRemoteLevel(nextLevel ?? null);
        setLives(startingLives);
        setMaxLives(startingLives);
        setMovesUsed(0);
        movesUsedRef.current = 0;
        solutionMovesRef.current = [];
        setMaxMoves(resolvedLevel?.maxMoves ?? null);
        setBestMoves(null);
        setIsNewBest(false);
        setGameOver(false);
        setGameOverReason(null);
        if (levelId < COMMUNITY_LEVEL_START_ID) {
          setLoadError(null);
        } else {
          setLoadError(nextLevel ? null : 'Level not found');
        }
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load level.');
      }
    }

    loadLevel();
    return () => {
      cancelled = true;
    };
  }, [builtInCampaignLevel, levelId, localCommunityLevel]);

  useEffect(() => {
    let cancelled = false;
    async function loadBestScore() {
      if (!levelHash) {
        setBestMoves(null);
        setIsNewBest(false);
        return;
      }
      try {
        const scores = await fetchLevelBestScoresFromApi([levelHash]);
        if (cancelled) return;
        setBestMoves(scores.get(levelHash)?.bestMoves ?? null);
        setIsNewBest(false);
      } catch {
        if (cancelled) return;
        setBestMoves(null);
        setIsNewBest(false);
      }
    }
    loadBestScore();
    return () => {
      cancelled = true;
    };
  }, [levelHash]);

  const handleLevelComplete = useCallback((time: number) => {
    completeLevel(levelId);
    setLevelComplete(true);
    setCompletionTime(time);
    if (levelHash && level) {
      const finalMoves = movesUsedRef.current;
      const solutionMoves = solutionMovesRef.current.join('');
      void submitLevelBestScoreToApi({
        levelHash,
        moves: finalMoves,
        solutionMoves,
        source: isCampaignLevel ? 'campaign' : 'community',
        sourceLevelId: levelId,
        levelName: level.name,
      }).then(result => {
        if (!result) return;
        setBestMoves(result.score.bestMoves);
        setIsNewBest(result.improved);
      });
    }
  }, [completeLevel, isCampaignLevel, level, levelHash, levelId]);

  const handleProgressUpdate = useCallback((settled: number) => {
    setSettledUnits(settled);
  }, []);

  const handleLivesUpdate = useCallback((newLives: number, newMaxLives: number) => {
    setLives(newLives);
    setMaxLives(newMaxLives);
  }, []);

  const handleMovesUpdate = useCallback((nextMovesUsed: number, nextMaxMoves: number | null) => {
    movesUsedRef.current = nextMovesUsed;
    if (nextMovesUsed === 0) {
      solutionMovesRef.current = [];
    }
    setMovesUsed(nextMovesUsed);
    setMaxMoves(nextMaxMoves);
  }, []);

  const handleCountedMove = useCallback((move: BufferedAction) => {
    solutionMovesRef.current = [...solutionMovesRef.current, move];
  }, []);

  const handleGameOver = useCallback((reason: 'lives' | 'moves') => {
    setGameOver(true);
    setGameOverReason(reason);
  }, []);

  const handleRestart = useCallback(() => {
    const startingLives = level?.lives ?? 1;
    setLevelComplete(false);
    setSettledUnits(0);
    setCompletionTime(0);
    setLives(startingLives);
    setMaxLives(startingLives);
    setMovesUsed(0);
    movesUsedRef.current = 0;
    solutionMovesRef.current = [];
    setMaxMoves(level?.maxMoves ?? null);
    setIsNewBest(false);
    setGameOver(false);
    setGameOverReason(null);
    setKey(k => k + 1);
  }, [level]);

  const handleToggleSimulationSpeed = useCallback(() => {
    setSimulationSpeed(current => current === 1 ? 2 : 1);
  }, []);

  const handleNextLevel = useCallback(() => {
    if (levelId < TOTAL_LEVELS) {
      setLevelComplete(false);
      setSettledUnits(0);
      setCompletionTime(0);
      setMovesUsed(0);
      movesUsedRef.current = 0;
      solutionMovesRef.current = [];
      setMaxMoves(null);
      setBestMoves(null);
      setIsNewBest(false);
      setGameOver(false);
      setGameOverReason(null);
      router.push(`/play/${levelId + 1}`);
    } else {
      router.push('/levels');
    }
  }, [levelId, router]);

  const handlePreviousLevel = useCallback(() => {
    if (levelId > 1) {
      setLevelComplete(false);
      setSettledUnits(0);
      setCompletionTime(0);
      setMovesUsed(0);
      movesUsedRef.current = 0;
      solutionMovesRef.current = [];
      setMaxMoves(null);
      setBestMoves(null);
      setIsNewBest(false);
      setGameOver(false);
      setGameOverReason(null);
      router.push(`/play/${levelId - 1}`);
    } else {
      router.push('/levels');
    }
  }, [levelId, router]);

  const canGoPrevious = isCampaignLevel && levelId > 1 && isUnlocked(levelId - 1);
  const canGoNext = isCampaignLevel && levelId < TOTAL_LEVELS && isUnlocked(levelId + 1);
  const sourceLabel = isCampaignLevel
    ? (usingLocalCampaignBackup ? 'Local Backup Warning' : undefined)
    : undefined;
  const returnPath = isCampaignLevel ? '/levels' : '/community';

  useEffect(() => {
    function goBack() {
      router.push(returnPath);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        goBack();
        return;
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        handleRestart();
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        if (levelComplete) {
          event.preventDefault();
          handleNextLevel();
          return;
        }
        if (gameOver) {
          event.preventDefault();
          if (canGoNext) {
            handleNextLevel();
          } else {
            handleRestart();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, gameOver, handleNextLevel, handleRestart, levelComplete, returnPath, router]);

  if (!level) {
    return (
      <main className="min-h-[calc(100svh-4rem)] bg-[#0a0a0f] flex items-center justify-center px-6 sm:min-h-[calc(100svh-5rem)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-6 text-center">
          <p className="text-white/40 font-mono">
            {isRemoteLoading ? 'Loading level...' : (loadError ?? 'Level not found')}
          </p>
          {!isRemoteLoading && (
            <button
              onClick={() => {
                router.push(returnPath);
              }}
              className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.08] hover:text-white transition-all duration-200"
            >
              Go Back
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-[#0a0a0f] flex flex-col items-center gap-4 relative overflow-x-hidden px-3 py-4 sm:min-h-[calc(100svh-5rem)] sm:px-4 sm:py-5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
      <div className="w-full max-w-5xl animate-[fadeIn_0.4s_ease-out]">
        <HUD
          levelId={levelId}
          levelName={level.name}
          sourceLabel={sourceLabel}
          levelComplete={levelComplete}
          settledUnits={settledUnits}
          totalUnits={level.players.length}
          completionTime={completionTime}
          lives={lives}
          maxLives={maxLives}
          movesUsed={movesUsed}
          maxMoves={maxMoves}
          bestMoves={bestMoves}
          isNewBest={isNewBest}
          gameOver={gameOver}
          gameOverReason={gameOverReason}
          canGoNext={canGoNext}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
          simulationSpeed={simulationSpeed}
          onToggleSimulationSpeed={handleToggleSimulationSpeed}
          showOverlays={false}
        />
      </div>
      <div className="flex w-full max-w-6xl flex-1 min-h-0 flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out]">
        <div className="flex w-full flex-1 min-h-0 items-center justify-center gap-2 sm:gap-4">
          {canGoPrevious && (
            <button
              onClick={handlePreviousLevel}
              aria-label={`Go to level ${levelId - 1}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-white/75 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:h-14 sm:w-14 sm:text-2xl"
            >
              ←
            </button>
          )}
          {!canGoPrevious && isCampaignLevel && <div className="hidden h-12 w-12 shrink-0 sm:block sm:h-14 sm:w-14" />}

          <div className="relative flex flex-1 min-h-0 min-w-0 self-stretch items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center">
              <GameCanvas
                key={key}
                level={level}
                onLevelComplete={handleLevelComplete}
                onProgressUpdate={handleProgressUpdate}
                onGameOver={handleGameOver}
                onLivesUpdate={handleLivesUpdate}
                onMovesUpdate={handleMovesUpdate}
                onCountedMove={handleCountedMove}
                autoRestartOnGameOver={false}
                captureGlobalMobileSwipes
                simulationSpeed={simulationSpeed}
              />
              <HUD
                levelId={levelId}
                levelName={level.name}
                sourceLabel={sourceLabel}
                levelComplete={levelComplete}
                settledUnits={settledUnits}
                totalUnits={level.players.length}
                completionTime={completionTime}
                lives={lives}
                maxLives={maxLives}
                movesUsed={movesUsed}
                maxMoves={maxMoves}
                bestMoves={bestMoves}
                isNewBest={isNewBest}
                gameOver={gameOver}
                gameOverReason={gameOverReason}
                canGoNext={canGoNext}
                onRestart={handleRestart}
                onNextLevel={handleNextLevel}
                simulationSpeed={simulationSpeed}
                showBar={false}
              />
            </div>
          </div>

          {canGoNext && (
            <button
              onClick={handleNextLevel}
              aria-label={`Go to level ${levelId + 1}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-white/75 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:h-14 sm:w-14 sm:text-2xl"
            >
              →
            </button>
          )}
          {!canGoNext && isCampaignLevel && <div className="hidden h-12 w-12 shrink-0 sm:block sm:h-14 sm:w-14" />}
        </div>
        {maxMoves !== null && (
          <div
            className={`rounded-2xl border px-5 py-3 text-center font-mono font-black tracking-[0.18em] shadow-[0_0_24px_rgba(0,0,0,0.25)] sm:px-8 sm:py-4 sm:text-4xl ${
              movesUsed >= maxMoves
                ? 'border-red-400/40 bg-red-500/15 text-red-200'
                : 'border-amber-300/40 bg-amber-500/15 text-amber-100'
            } text-2xl`}
          >
            MOVES {movesUsed}/{maxMoves}
          </div>
        )}
      </div>
    </main>
  );
}
