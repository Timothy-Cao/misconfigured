import { type LevelData } from '@/engine/types';
import { type OwnedCloudLevelSummary } from '@/lib/auth';
import { type CommunityLevelListItem } from '@/lib/supabase-community';
import { cloneLevelData } from '@/lib/level-clone';
import { PUBLIC_READ_CACHE_TTL_MS } from '@/lib/public-cache';
import { TtlCache } from '@/lib/ttl-cache';

interface SaveCommunityLevelResponse {
  level?: LevelData;
  summary?: OwnedCloudLevelSummary;
  error?: string;
}

const publishedCommunityLevelsCache = new TtlCache<CommunityLevelListItem[]>(PUBLIC_READ_CACHE_TTL_MS);

function cloneCommunityLevelListItem(level: CommunityLevelListItem): CommunityLevelListItem {
  return {
    ...cloneLevelData(level),
    creatorInitials: level.creatorInitials,
    creatorName: level.creatorName,
    isBuiltIn: level.isBuiltIn,
  };
}

function invalidateCommunityListApiCache(): void {
  publishedCommunityLevelsCache.clear();
}

export async function fetchCommunityLevelsFromApi(): Promise<CommunityLevelListItem[]> {
  const cached = publishedCommunityLevelsCache.get('published');
  if (cached !== undefined) {
    return cached.map(cloneCommunityLevelListItem);
  }

  const response = await fetch('/api/community-levels');
  const data = await response.json() as { levels?: CommunityLevelListItem[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load community levels.');
  }

  const levels = data.levels ?? [];
  publishedCommunityLevelsCache.set('published', levels);
  return levels.map(cloneCommunityLevelListItem);
}

export async function fetchCommunityLevelFromApi(id: number): Promise<LevelData | undefined> {
  const response = await fetch(`/api/community-levels/${id}`, { cache: 'no-store' });
  if (response.status === 404) {
    return undefined;
  }

  const data = await response.json() as { level?: LevelData; error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load community level.');
  }

  return data.level;
}

export async function fetchOwnedCloudLevelsFromApi(): Promise<OwnedCloudLevelSummary[]> {
  const response = await fetch('/api/my-maps', { cache: 'no-store' });
  const data = await response.json() as { levels?: OwnedCloudLevelSummary[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load your cloud maps.');
  }

  return data.levels ?? [];
}

export async function saveOwnedCommunityLevelToApi(options: {
  level: LevelData;
  id?: number | null;
  isPublished: boolean;
}): Promise<{ level: LevelData; summary: OwnedCloudLevelSummary }> {
  const response = await fetch('/api/community-levels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  const data = await response.json() as SaveCommunityLevelResponse;
  if (!response.ok || !data.level || !data.summary) {
    throw new Error(data.error || 'Failed to save cloud map.');
  }

  invalidateCommunityListApiCache();
  return {
    level: data.level,
    summary: data.summary,
  };
}

export async function setCommunityLevelPublishedInApi(id: number, isPublished: boolean): Promise<OwnedCloudLevelSummary> {
  const response = await fetch(`/api/community-levels/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isPublished }),
  });

  const data = await response.json() as { summary?: OwnedCloudLevelSummary; error?: string };
  if (!response.ok || !data.summary) {
    throw new Error(data.error || 'Failed to update publication status.');
  }

  invalidateCommunityListApiCache();
  return data.summary;
}

export async function deleteOwnedCommunityLevelFromApi(id: number): Promise<void> {
  const response = await fetch(`/api/community-levels/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json() as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete cloud map.');
  }

  invalidateCommunityListApiCache();
}
