'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'misconfigured-progress';

export interface GameProgress {
  completedLevels: number[];
  currentLevel: number;
}

const DEFAULT_PROGRESS: GameProgress = {
  completedLevels: [],
  currentLevel: 1,
};

export function getProgress(): GameProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return JSON.parse(raw) as GameProgress;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: GameProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isLevelUnlocked(levelId: number, progress: GameProgress): boolean {
  if (levelId === 1) return true;
  return progress.completedLevels.includes(levelId - 1);
}

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(getProgress);

  const completeLevel = useCallback((levelId: number) => {
    setProgress(prev => {
      const completed = prev.completedLevels.includes(levelId)
        ? prev.completedLevels
        : [...prev.completedLevels, levelId];
      const next = {
        completedLevels: completed,
        currentLevel: Math.max(prev.currentLevel, levelId + 1),
      };
      saveProgress(next);
      return next;
    });
  }, []);

  return { progress, completeLevel, isUnlocked: (id: number) => isLevelUnlocked(id, progress) };
}
