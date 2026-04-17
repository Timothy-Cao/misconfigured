import { type LevelData } from '@/engine/types';
import { cloneLevelData } from '@/lib/level-clone';
import { PUBLIC_READ_CACHE_TTL_MS } from '@/lib/public-cache';
import { TtlCache } from '@/lib/ttl-cache';

type CampaignSnapshot = {
  levels: Map<number, LevelData>;
  overrideIds: Set<number>;
};

const campaignSnapshotCache = new TtlCache<CampaignSnapshot>(PUBLIC_READ_CACHE_TTL_MS);
const campaignOverrideCache = new TtlCache<LevelData | null>(PUBLIC_READ_CACHE_TTL_MS);
const campaignOverrideIdsCache = new TtlCache<number[]>(PUBLIC_READ_CACHE_TTL_MS);

function cloneCampaignSnapshot(snapshot: CampaignSnapshot): CampaignSnapshot {
  return {
    levels: new Map(Array.from(snapshot.levels.entries(), ([id, level]) => [id, cloneLevelData(level)])),
    overrideIds: new Set(snapshot.overrideIds),
  };
}

export function invalidateCampaignApiCache(id?: number): void {
  campaignSnapshotCache.clear();
  campaignOverrideIdsCache.clear();

  if (id == null) {
    campaignOverrideCache.clear();
    return;
  }

  campaignOverrideCache.delete(String(id));
}

export async function fetchCampaignSnapshotFromApi(): Promise<{
  levels: Map<number, LevelData>;
  overrideIds: Set<number>;
}> {
  const cached = campaignSnapshotCache.get('snapshot');
  if (cached) {
    return cloneCampaignSnapshot(cached);
  }

  const response = await fetch('/api/campaign-snapshot');
  const data = await response.json() as { levels?: LevelData[]; overrideIds?: number[]; error?: string; warning?: string };

  if (!response.ok) {
    throw new Error(data.error || data.warning || 'Failed to load campaign snapshot.');
  }

  const snapshot = {
    levels: new Map((data.levels ?? []).map(level => [level.id, level])),
    overrideIds: new Set((data.overrideIds ?? []).filter(id => Number.isFinite(id))),
  };
  campaignSnapshotCache.set('snapshot', snapshot);
  return cloneCampaignSnapshot(snapshot);
}

export async function fetchCampaignOverrideFromApi(id: number): Promise<LevelData | undefined> {
  const cached = campaignOverrideCache.get(String(id));
  if (cached !== undefined) {
    return cached ? cloneLevelData(cached) : undefined;
  }

  const response = await fetch(`/api/campaign-overrides/${id}`);
  if (response.status === 404) {
    campaignOverrideCache.set(String(id), null);
    return undefined;
  }

  const data = await response.json() as { level?: LevelData; error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load campaign override.');
  }

  campaignOverrideCache.set(String(id), data.level ?? null);
  return data.level ? cloneLevelData(data.level) : undefined;
}

export async function saveCampaignOverrideToApi(id: number, level: LevelData): Promise<LevelData> {
  const response = await fetch(`/api/campaign-overrides/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ level }),
  });

  const data = await response.json() as { level?: LevelData; error?: string };
  if (!response.ok || !data.level) {
    throw new Error(data.error || 'Failed to save campaign override.');
  }

  invalidateCampaignApiCache(id);
  campaignOverrideCache.set(String(id), data.level);
  return cloneLevelData(data.level);
}

export async function fetchCampaignOverrideIdsFromApi(): Promise<number[]> {
  const cached = campaignOverrideIdsCache.get('ids');
  if (cached !== undefined) {
    return [...cached];
  }

  const response = await fetch('/api/campaign-overrides');
  const data = await response.json() as { ids?: number[]; warning?: string };
  if (!response.ok) {
    throw new Error(data.warning || 'Failed to load campaign override list.');
  }

  const ids = data.ids ?? [];
  campaignOverrideIdsCache.set('ids', ids);
  return [...ids];
}
