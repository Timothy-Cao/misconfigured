import { type LevelData } from '@/engine/types';
import communityLevel1001 from './community-1001';
import communityLevel1002 from './community-1002';
import communityLevel1003 from './community-1003';

export const builtInCommunityLevels: LevelData[] = [
  communityLevel1001,
  communityLevel1002,
  communityLevel1003,
];

export function getBuiltInCommunityLevel(id: number): LevelData | undefined {
  return builtInCommunityLevels.find(level => level.id === id);
}
