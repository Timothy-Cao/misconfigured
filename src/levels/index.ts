import { type LevelData } from '@/engine/types';
import level01 from './level-01';
import level02 from './level-02';
import level03 from './level-03';
import level04 from './level-04';
import level05 from './level-05';
import level06 from './level-06';
import level07 from './level-07';
import level08 from './level-08';
import level09 from './level-09';
import level10 from './level-10';
import level11 from './level-11';
import level12 from './level-12';
import level13 from './level-13';
import level14 from './level-14';
import level15 from './level-15';
import level16 from './level-16';
import level17 from './level-17';
import level18 from './level-18';
import level19 from './level-19';
import level20 from './level-20';
import level21 from './level-21';
import level22 from './level-22';
import level23 from './level-23';
import level24 from './level-24';
import level25 from './level-25';
import { builtInCommunityLevels } from './community-levels';

const builtInLevels: LevelData[] = [
  level01, level02, level03, level04, level05,
  level06, level07, level08, level09, level10,
  level11, level12, level13, level14, level15,
  level16, level17, level18, level19, level20,
  level21, level22, level23, level24, level25,
];

const CAMPAIGN_OVERRIDE_VERSION = 2;
const CUSTOM_LEVELS_KEY = `misconfigured-custom-levels-v${CAMPAIGN_OVERRIDE_VERSION}`;
const COMMUNITY_LEVELS_KEY = 'misconfigured-community-levels';
export const COMMUNITY_LEVEL_START_ID = 1001;
const LEVEL_BACKUP_VERSION = 1;

export interface LocalLevelBackup {
  version: number;
  exportedAt: string;
  campaignOverrides: Record<string, LevelData>;
  communityLevels: Record<string, LevelData>;
}

function cloneLevel(level: LevelData): LevelData {
  return {
    ...level,
    grid: level.grid.map(row => [...row]),
    players: level.players.map(player => ({ ...player })) as LevelData['players'],
  };
}

function getCustomLevels(): Record<string, LevelData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_LEVELS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getCommunityLevelsRecord(): Record<string, LevelData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(COMMUNITY_LEVELS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getMergedCommunityLevelsRecord(): Record<string, LevelData> {
  const builtIn = Object.fromEntries(
    builtInCommunityLevels.map(level => [String(level.id), cloneLevel(level)]),
  );
  return {
    ...builtIn,
    ...getCommunityLevelsRecord(),
  };
}

export function saveCustomLevel(id: number, level: LevelData): void {
  const custom = getCustomLevels();
  custom[String(id)] = cloneLevel(level);
  localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(custom));
}

export function saveCommunityLevel(id: number, level: LevelData): void {
  const community = getCommunityLevelsRecord();
  community[String(id)] = cloneLevel(level);
  localStorage.setItem(COMMUNITY_LEVELS_KEY, JSON.stringify(community));
}

export function deleteCommunityLevel(id: number): void {
  const community = getCommunityLevelsRecord();
  delete community[String(id)];
  localStorage.setItem(COMMUNITY_LEVELS_KEY, JSON.stringify(community));
}

export function exportLocalLevelBackup(): LocalLevelBackup {
  return {
    version: LEVEL_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    campaignOverrides: Object.fromEntries(
      Object.entries(getCustomLevels()).map(([id, level]) => [id, cloneLevel(level)]),
    ),
    communityLevels: Object.fromEntries(
      Object.entries(getCommunityLevelsRecord()).map(([id, level]) => [id, cloneLevel(level)]),
    ),
  };
}

export function importLocalLevelBackup(rawBackup: unknown): { campaignCount: number; communityCount: number } {
  if (!rawBackup || typeof rawBackup !== 'object') {
    throw new Error('Backup payload must be an object.');
  }

  const backup = rawBackup as Partial<LocalLevelBackup>;
  const campaignOverrides = backup.campaignOverrides;
  const communityLevels = backup.communityLevels;

  if (!campaignOverrides || typeof campaignOverrides !== 'object') {
    throw new Error('Backup is missing campaign overrides.');
  }
  if (!communityLevels || typeof communityLevels !== 'object') {
    throw new Error('Backup is missing community levels.');
  }

  const nextCampaignOverrides = Object.fromEntries(
    Object.entries(campaignOverrides).map(([id, level]) => [id, cloneLevel(level as LevelData)]),
  );
  const nextCommunityLevels = Object.fromEntries(
    Object.entries(communityLevels).map(([id, level]) => [id, cloneLevel(level as LevelData)]),
  );

  localStorage.setItem(CUSTOM_LEVELS_KEY, JSON.stringify(nextCampaignOverrides));
  localStorage.setItem(COMMUNITY_LEVELS_KEY, JSON.stringify(nextCommunityLevels));

  return {
    campaignCount: Object.keys(nextCampaignOverrides).length,
    communityCount: Object.keys(nextCommunityLevels).length,
  };
}

export function getCommunityLevels(): LevelData[] {
  return Object.values(getMergedCommunityLevelsRecord())
    .map(level => cloneLevel(level))
    .sort((a, b) => a.id - b.id);
}

export function getCommunityLevel(id: number): LevelData | undefined {
  const level = getMergedCommunityLevelsRecord()[String(id)];
  return level ? cloneLevel(level) : undefined;
}

export function getNextCommunityLevelId(): number {
  const ids = Object.keys(getMergedCommunityLevelsRecord())
    .map(Number)
    .filter(id => Number.isFinite(id));
  if (ids.length === 0) return COMMUNITY_LEVEL_START_ID;
  return Math.max(COMMUNITY_LEVEL_START_ID, ...ids) + 1;
}

export const levels: LevelData[] = builtInLevels;

export function getLevel(id: number): LevelData | undefined {
  // Custom levels override built-in
  const custom = getCustomLevels();
  if (custom[String(id)]) return cloneLevel(custom[String(id)]);

  const community = getMergedCommunityLevelsRecord();
  if (community[String(id)]) return cloneLevel(community[String(id)]);

  const builtIn = builtInLevels.find(l => l.id === id);
  return builtIn ? cloneLevel(builtIn) : undefined;
}

export const TOTAL_LEVELS = builtInLevels.length;
