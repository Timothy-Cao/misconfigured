'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import { getLevel, TOTAL_LEVELS } from '@/levels';
import { useGameProgress } from '@/hooks/useGameProgress';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = Number(params.id);
  const level = useMemo(() => getLevel(levelId), [levelId]);
  const { completeLevel } = useGameProgress();
  const [levelComplete, setLevelComplete] = useState(false);
  const [settledUnits, setSettledUnits] = useState(0);
  const [completionTime, setCompletionTime] = useState(0);
  const [key, setKey] = useState(0);
  const startingLives = level?.lives ?? 1;
  const [lives, setLives] = useState(startingLives);
  const [maxLives, setMaxLives] = useState(startingLives);

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

  const handleRestart = useCallback(() => {
    setLevelComplete(false);
    setSettledUnits(0);
    setCompletionTime(0);
    setLives(startingLives);
    setMaxLives(startingLives);
    setKey(k => k + 1);
  }, [startingLives]);

  const handleNextLevel = useCallback(() => {
    if (levelId < TOTAL_LEVELS) {
      setLevelComplete(false);
      setSettledUnits(0);
      setCompletionTime(0);
      router.push(`/play/${levelId + 1}`);
    } else {
      router.push('/levels');
    }
  }, [levelId, router]);

  if (!level) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-white/40 font-mono">Level not found</p>
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
          onLivesUpdate={handleLivesUpdate}
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
          gameOver={false}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
        />
      </div>
    </main>
  );
}
