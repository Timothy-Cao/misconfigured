import { type LevelBestScore } from '@/lib/supabase-best-scores';

export type { LevelBestScore };

export async function fetchLevelBestScoresFromApi(hashes: string[]): Promise<Map<string, LevelBestScore>> {
  const uniqueHashes = Array.from(new Set(hashes.filter(Boolean)));
  if (uniqueHashes.length === 0) return new Map();

  const params = new URLSearchParams();
  for (const hash of uniqueHashes) {
    params.append('hash', hash);
  }

  const response = await fetch(`/api/level-best-scores?${params.toString()}`, { cache: 'no-store' });
  const data = await response.json() as { scores?: LevelBestScore[]; warning?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error || data.warning || 'Failed to load level best scores.');
  }

  return new Map((data.scores ?? []).map(score => [score.levelHash, score]));
}

export async function submitLevelBestScoreToApi(input: {
  levelHash: string;
  moves: number;
  source?: string | null;
  sourceLevelId?: number | null;
  levelName?: string | null;
}): Promise<{ score: LevelBestScore; improved: boolean } | null> {
  const response = await fetch('/api/level-best-scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await response.json() as {
    score?: LevelBestScore;
    improved?: boolean;
    error?: string;
  };

  if (!response.ok || !data.score) {
    return null;
  }

  return {
    score: data.score,
    improved: Boolean(data.improved),
  };
}
