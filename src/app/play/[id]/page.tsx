'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import { getLevel, TOTAL_LEVELS } from '@/levels';
import { useGameProgress } from '@/hooks/useGameProgress';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = Number(params.id);
  const level = getLevel(levelId);
  const { completeLevel } = useGameProgress();
  const [levelComplete, setLevelComplete] = useState(false);
  const [key, setKey] = useState(0); // force remount on restart

  const handleLevelComplete = useCallback(() => {
    completeLevel(levelId);
    setLevelComplete(true);
  }, [levelId, completeLevel]);

  const handleRestart = useCallback(() => {
    setLevelComplete(false);
    setKey(k => k + 1);
  }, []);

  const handleNextLevel = useCallback(() => {
    if (levelId < TOTAL_LEVELS) {
      setLevelComplete(false);
      router.push(`/play/${levelId + 1}`);
    } else {
      router.push('/levels');
    }
  }, [levelId, router]);

  if (!level) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Level not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        <GameCanvas key={key} level={level} onLevelComplete={handleLevelComplete} />
        <HUD
          levelId={levelId}
          levelComplete={levelComplete}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
        />
      </div>
    </main>
  );
}
