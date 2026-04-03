import { type LevelData } from '@/engine/types';
import communityLevel1001 from './community-1001';

export const builtInCommunityLevels: LevelData[] = [communityLevel1001];

export function getBuiltInCommunityLevel(id: number): LevelData | undefined {
  return builtInCommunityLevels.find(level => level.id === id);
}
