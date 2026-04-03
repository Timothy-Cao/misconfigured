import { type LevelData } from '@/engine/types';

export async function fetchCommunityLevelsFromApi(): Promise<LevelData[]> {
  const response = await fetch('/api/community-levels', { cache: 'no-store' });
  const data = await response.json() as { levels?: LevelData[]; warning?: string };

  if (!response.ok) {
    throw new Error(data.warning || 'Failed to load community levels.');
  }

  return data.levels ?? [];
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

export async function saveCommunityLevelToApi(level: LevelData, password: string): Promise<LevelData> {
  const response = await fetch('/api/community-levels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ level, password }),
  });

  const data = await response.json() as { level?: LevelData; error?: string };
  if (!response.ok || !data.level) {
    throw new Error(data.error || 'Failed to save community level.');
  }

  return data.level;
}

export async function deleteCommunityLevelFromApi(id: number, password: string): Promise<void> {
  const response = await fetch(`/api/community-levels/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json() as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete community level.');
  }
}
