import { type LevelData } from '@/engine/types';

export async function fetchCampaignOverrideFromApi(id: number): Promise<LevelData | undefined> {
  const response = await fetch(`/api/campaign-overrides/${id}`, { cache: 'no-store' });
  if (response.status === 404) {
    return undefined;
  }

  const data = await response.json() as { level?: LevelData; error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load campaign override.');
  }

  return data.level;
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

  return data.level;
}

export async function fetchCampaignOverrideIdsFromApi(): Promise<number[]> {
  const response = await fetch('/api/campaign-overrides', { cache: 'no-store' });
  const data = await response.json() as { ids?: number[]; warning?: string };
  if (!response.ok) {
    throw new Error(data.warning || 'Failed to load campaign override list.');
  }
  return data.ids ?? [];
}
