'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useMemo, useEffect } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import { COMMUNITY_LEVEL_START_ID, getLevel, getLocalCampaignOverride, TOTAL_LEVELS } from '@/levels';
import { useGameProgress } from '@/hooks/useGameProgress';
import { type LevelData } from '@/engine/types';
import { fetchCampaignOverrideFromApi } from '@/lib/campaign-api';
import { fetchCommunityLevelFromApi } from '@/lib/community-api';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = Number(params.id);
  const localLevel = useMemo(() => (levelId < COMMUNITY_LEVEL_START_ID ? getLevel(levelId) : undefined), [levelId]);
  const localOverride = useMemo(
    () => (levelId < COMMUNITY_LEVEL_START_ID ? getLocalCampaignOverride(levelId) : undefined),
    [levelId],
  );
  const [remoteLevel, setRemoteLevel] = useState<LevelData | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isCampaignLevel = levelId < COMMUNITY_LEVEL_START_ID;
  const isRemoteLoading = remoteLevel === undefined;
  const level = isCampaignLevel
    ? (remoteLevel === undefined ? undefined : (remoteLevel ?? localLevel))
    : remoteLevel ?? undefined;
  const { completeLevel, isUnlocked } = useGameProgress();
  const [levelComplete, setLevelComplete] = useState(false);
  const [settledUnits, setSettledUnits] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [key, setKey] = useState(0);
  const [lives, setLives] = useState(1);
  const [maxLives, setMaxLives] = useState(1);
  const [movesUsed, setMovesUsed] = useState(0);
  const [maxMoves, setMaxMoves] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'lives' | 'moves' | null>(null);

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
        const resolvedLevel = levelId < COMMUNITY_LEVEL_START_ID ? (nextLevel ?? localLevel) : nextLevel;
        const startingLives = resolvedLevel?.lives ?? 1;
        setRemoteLevel(nextLevel ?? null);
        setLives(startingLives);
        setMaxLives(startingLives);
        setMovesUsed(0);
        setMaxMoves(resolvedLevel?.maxMoves ?? null);
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
  }, [levelId, localLevel]);

  const handleLevelComplete = useCallback((time: number) => {
    completeLevel(levelId);
    setLevelComplete(true);
    setCompletionTime(time);
  }, [levelId, completeLevel]);

  const handleProgressUpdate = useCallback((settled: number) => {
    setSettledUnits(settled);
  }, []);

  const handleLivesUpdate = useCallback((newLives: number, newMaxLives: number) => {
    setLives(newLives);
    setMaxLives(newMaxLives);
  }, []);

  const handleMovesUpdate = useCallback((nextMovesUsed: number, nextMaxMoves: number | null) => {
    setMovesUsed(nextMovesUsed);
    setMaxMoves(nextMaxMoves);
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
    setMaxMoves(level?.maxMoves ?? null);
    setGameOver(false);
    setGameOverReason(null);
    setKey(k => k + 1);
  }, [level]);

  const handleNextLevel = useCallback(() => {
    if (levelId < TOTAL_LEVELS) {
      setLevelComplete(false);
      setSettledUnits(0);
      setCompletionTime(0);
      setMovesUsed(0);
      setMaxMoves(null);
      setGameOver(false);
      setGameOverReason(null);
      router.push(`/play/${levelId + 1}`);
    } else {
      router.push('/levels');
    }
  }, [levelId, router]);

  const canGoNext = isCampaignLevel && levelId < TOTAL_LEVELS && isUnlocked(levelId + 1);
  const sourceLabel = isCampaignLevel
    ? (remoteLevel ? 'Campaign Override (Server)' : (localOverride ? 'Campaign Override (Local)' : 'Campaign'))
    : 'Community';
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
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
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
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4 relative overflow-hidden px-3 py-6 sm:px-4 sm:py-8">
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
          gameOver={gameOver}
          gameOverReason={gameOverReason}
          canGoNext={canGoNext}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
          showOverlays={false}
        />
      </div>
      <div className="flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out]">
        <div className="relative">
          <GameCanvas
            key={key}
            level={level}
            onLevelComplete={handleLevelComplete}
            onProgressUpdate={handleProgressUpdate}
            onGameOver={handleGameOver}
            onLivesUpdate={handleLivesUpdate}
            onMovesUpdate={handleMovesUpdate}
            autoRestartOnGameOver={false}
            captureGlobalMobileSwipes
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
            gameOver={gameOver}
            gameOverReason={gameOverReason}
            canGoNext={canGoNext}
            onRestart={handleRestart}
            onNextLevel={handleNextLevel}
            showBar={false}
          />
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
