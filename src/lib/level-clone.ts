import { type LevelData } from '@/engine/types';

export function cloneLevelData(level: LevelData): LevelData {
  return {
    ...level,
    grid: level.grid.map(row => [...row]),
    players: level.players.map(player => ({ ...player })),
  };
}
