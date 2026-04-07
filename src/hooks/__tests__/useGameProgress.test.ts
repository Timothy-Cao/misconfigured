import { describe, it, expect, beforeEach } from 'vitest';
import { getProgress, saveProgress, isLevelUnlocked, type GameProgress } from '../useGameProgress';

beforeEach(() => {
  localStorage.clear();
});

describe('getProgress', () => {
  it('returns default progress when nothing saved', () => {
    const progress = getProgress();
    expect(progress.completedLevels).toEqual([]);
    expect(progress.currentLevel).toBe(1);
  });

  it('returns saved progress', () => {
    const saved: GameProgress = { completedLevels: [1, 2, 3], currentLevel: 4 };
    localStorage.setItem('misconfigured-progress', JSON.stringify(saved));
    const progress = getProgress();
    expect(progress.completedLevels).toEqual([1, 2, 3]);
    expect(progress.currentLevel).toBe(4);
  });
});

describe('saveProgress', () => {
  it('persists to localStorage', () => {
    saveProgress({ completedLevels: [1], currentLevel: 2 });
    const raw = localStorage.getItem('misconfigured-progress');
    expect(JSON.parse(raw!)).toEqual({ completedLevels: [1], currentLevel: 2 });
  });
});

describe('isLevelUnlocked', () => {
  it('level 1 is always unlocked', () => {
    expect(isLevelUnlocked(1, { completedLevels: [], currentLevel: 1 })).toBe(true);
  });

  it('later levels are unlocked even when there is no progress', () => {
    expect(isLevelUnlocked(25, { completedLevels: [], currentLevel: 1 })).toBe(true);
  });

  it('keeps levels unlocked regardless of saved progress frontier', () => {
    expect(isLevelUnlocked(4, { completedLevels: [1, 2, 3], currentLevel: 4 })).toBe(true);
    expect(isLevelUnlocked(5, { completedLevels: [1, 2, 3], currentLevel: 4 })).toBe(true);
  });

  it('unlocks the next level after the previous one is completed', () => {
    expect(isLevelUnlocked(5, { completedLevels: [1, 2, 3, 4], currentLevel: 4 })).toBe(true);
  });
});
