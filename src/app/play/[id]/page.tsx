'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useMemo, useEffect } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import { COMMUNITY_LEVEL_START_ID, getLevel, TOTAL_LEVELS } from '@/levels';
import { useGameProgress } from '@/hooks/useGameProgress';
import { type LevelData } from '@/engine/types';
import { fetchCampaignOverrideFromApi } from '@/lib/campaign-api';
import { fetchCommunityLevelFromApi } from '@/lib/community-api';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = Number(params.id);
  const localLevel = useMemo(() => (levelId < COMMUNITY_LEVEL_START_ID ? getLevel(levelId) : undefined), [levelId]);
  const [remoteLevel, setRemoteLevel] = useState<LevelData | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isCampaignLevel = levelId < COMMUNITY_LEVEL_START_ID;
  const isRemoteLoading = remoteLevel === undefined;
  const level = isCampaignLevel
    ? (remoteLevel === undefined ? undefined : (remoteLevel ?? localLevel))
    : remoteLevel ?? undefined;
  const { completeLevel } = useGameProgress();
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

  if (!level) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-white/40 font-mono">
          {isRemoteLoading ? 'Loading level...' : (loadError ?? 'Level not found')}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
      <div className="relative animate-[fadeIn_0.4s_ease-out]">
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
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
        />
      </div>
    </main>
  );
}
