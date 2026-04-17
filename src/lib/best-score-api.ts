import { type LevelBestScore } from '@/lib/supabase-best-scores';
import { PUBLIC_READ_CACHE_TTL_MS } from '@/lib/public-cache';
import { TtlCache } from '@/lib/ttl-cache';

export type { LevelBestScore };

const levelBestScoreClientCache = new TtlCache<LevelBestScore | null>(PUBLIC_READ_CACHE_TTL_MS);

export async function fetchLevelBestScoresFromApi(hashes: string[]): Promise<Map<string, LevelBestScore>> {
  const uniqueHashes = Array.from(new Set(hashes.filter(Boolean)));
  if (uniqueHashes.length === 0) return new Map();

  const scores = new Map<string, LevelBestScore>();
  const missingHashes: string[] = [];
  for (const hash of uniqueHashes) {
    const cached = levelBestScoreClientCache.get(hash);
    if (cached === undefined) {
      missingHashes.push(hash);
      continue;
    }

    if (cached) {
      scores.set(hash, { ...cached });
    }
  }

  if (missingHashes.length === 0) {
    return scores;
  }

  const params = new URLSearchParams();
  for (const hash of missingHashes) {
    params.append('hash', hash);
  }

  const response = await fetch(`/api/level-best-scores?${params.toString()}`);
  const data = await response.json() as { scores?: LevelBestScore[]; warning?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error || data.warning || 'Failed to load level best scores.');
  }

  const fetchedScores = data.scores ?? [];
  const fetchedHashes = new Set(fetchedScores.map(score => score.levelHash));
  for (const score of fetchedScores) {
    levelBestScoreClientCache.set(score.levelHash, score);
    scores.set(score.levelHash, { ...score });
  }
  for (const hash of missingHashes) {
    if (!fetchedHashes.has(hash)) {
      levelBestScoreClientCache.set(hash, null);
    }
  }

  return scores;
}

export async function submitLevelBestScoreToApi(input: {
  levelHash: string;
  moves: number;
  solutionMoves?: string | null;
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

  levelBestScoreClientCache.set(input.levelHash, data.score);

  return {
    score: data.score,
    improved: Boolean(data.improved),
  };
}
