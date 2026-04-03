import { type LevelData } from '@/engine/types';

export const builtInCommunityLevels: LevelData[] = [];

export function getBuiltInCommunityLevel(id: number): LevelData | undefined {
  return builtInCommunityLevels.find(level => level.id === id);
}
