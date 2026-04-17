import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';
import { PUBLIC_READ_CACHE_TTL_MS } from '@/lib/public-cache';
import { TtlCache } from '@/lib/ttl-cache';

export interface LevelBestScore {
  levelHash: string;
  bestMoves: number;
  source: string | null;
  sourceLevelId: number | null;
  levelName: string | null;
  playerUserId: string | null;
  playerDisplayName: string | null;
  solutionMoves: string | null;
  achievedAt: string | null;
}

interface LevelBestScoreRow {
  level_hash: string;
  best_moves: number;
  source: string | null;
  source_level_id: number | null;
  level_name: string | null;
  player_user_id: string | null;
  player_display_name: string | null;
  solution_moves?: string | null;
  achieved_at: string | null;
}

const levelBestScoreCache = new TtlCache<LevelBestScore | null>(PUBLIC_READ_CACHE_TTL_MS);

function mapRow(row: LevelBestScoreRow): LevelBestScore {
  return {
    levelHash: row.level_hash,
    bestMoves: Number(row.best_moves),
    source: row.source,
    sourceLevelId: row.source_level_id == null ? null : Number(row.source_level_id),
    levelName: row.level_name,
    playerUserId: row.player_user_id,
    playerDisplayName: row.player_display_name,
    solutionMoves: row.solution_moves ?? null,
    achievedAt: row.achieved_at,
  };
}

function cloneScore(score: LevelBestScore): LevelBestScore {
  return { ...score };
}

export function invalidateLevelBestScoreCache(levelHash?: string): void {
  if (!levelHash) {
    levelBestScoreCache.clear();
    return;
  }

  levelBestScoreCache.delete(levelHash);
}

function isMissingSolutionMovesColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const maybeError = error as { code?: unknown; message?: unknown };
  const message = typeof maybeError.message === 'string' ? maybeError.message : '';
  return message.includes('solution_moves') && (
    maybeError.code === 'PGRST204' ||
    /column|schema cache|does not exist/i.test(message)
  );
}

export async function listLevelBestScoresFromSupabase(hashes: string[]): Promise<LevelBestScore[]> {
  const uniqueHashes = Array.from(new Set(hashes.map(hash => hash.trim()).filter(Boolean)));
  if (uniqueHashes.length === 0) return [];

  const cachedScores = new Map<string, LevelBestScore>();
  const missingHashes: string[] = [];
  for (const hash of uniqueHashes) {
    const cached = levelBestScoreCache.get(hash);
    if (cached === undefined) {
      missingHashes.push(hash);
      continue;
    }

    if (cached) {
      cachedScores.set(hash, cloneScore(cached));
    }
  }

  if (missingHashes.length === 0) {
    return Array.from(cachedScores.values());
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('level_best_scores')
    .select('level_hash,best_moves,source,source_level_id,level_name,player_user_id,player_display_name,solution_moves,achieved_at')
    .in('level_hash', missingHashes);

  if (error) {
    if (isMissingSolutionMovesColumn(error)) {
      const { data: fallbackData, error: fallbackError } = await admin
        .from('level_best_scores')
        .select('level_hash,best_moves,source,source_level_id,level_name,player_user_id,player_display_name,achieved_at')
        .in('level_hash', missingHashes);

      if (fallbackError) {
        throw fallbackError instanceof Error ? fallbackError : new Error('Failed to load level best scores.');
      }

      const rows = (fallbackData ?? []).map(row => mapRow(row as LevelBestScoreRow));
      const fetchedHashes = new Set(rows.map(row => row.levelHash));
      for (const row of rows) {
        levelBestScoreCache.set(row.levelHash, row);
        cachedScores.set(row.levelHash, cloneScore(row));
      }
      for (const hash of missingHashes) {
        if (!fetchedHashes.has(hash)) {
          levelBestScoreCache.set(hash, null);
        }
      }
      return Array.from(cachedScores.values());
    }
    throw error instanceof Error ? error : new Error('Failed to load level best scores.');
  }

  const rows = (data ?? []).map(row => mapRow(row as LevelBestScoreRow));
  const fetchedHashes = new Set(rows.map(row => row.levelHash));
  for (const row of rows) {
    levelBestScoreCache.set(row.levelHash, row);
    cachedScores.set(row.levelHash, cloneScore(row));
  }
  for (const hash of missingHashes) {
    if (!fetchedHashes.has(hash)) {
      levelBestScoreCache.set(hash, null);
    }
  }

  return Array.from(cachedScores.values());
}

export async function submitLevelBestScoreToSupabase(input: {
  levelHash: string;
  moves: number;
  solutionMoves?: string | null;
  source?: string | null;
  sourceLevelId?: number | null;
  levelName?: string | null;
  playerUserId?: string | null;
  playerDisplayName?: string | null;
}): Promise<{ score: LevelBestScore; improved: boolean }> {
  const bestMoves = Math.max(0, Math.floor(input.moves));
  const admin = getSupabaseAdminClient();
  const withSolutionColumn = input.solutionMoves != null;
  const selectColumns = withSolutionColumn
    ? 'level_hash,best_moves,source,source_level_id,level_name,player_user_id,player_display_name,solution_moves,achieved_at'
    : 'level_hash,best_moves,source,source_level_id,level_name,player_user_id,player_display_name,achieved_at';

  const { data: existingData, error: existingError } = await admin
    .from('level_best_scores')
    .select(selectColumns)
    .eq('level_hash', input.levelHash)
    .limit(1);

  if (existingError) {
    if (withSolutionColumn && isMissingSolutionMovesColumn(existingError)) {
      return submitLevelBestScoreToSupabase({ ...input, solutionMoves: null });
    }
    throw existingError instanceof Error ? existingError : new Error('Failed to load current level best score.');
  }

  const existingRows = (existingData ?? []) as unknown as LevelBestScoreRow[];
  const existing = existingRows[0] ?? null;
  if (
    existing &&
    (
      Number(existing.best_moves) < bestMoves ||
      (Number(existing.best_moves) === bestMoves && (existing.solution_moves || !input.solutionMoves))
    )
  ) {
    const score = mapRow(existing);
    levelBestScoreCache.set(score.levelHash, score);
    return { score, improved: false };
  }

  const upsertRow: Record<string, unknown> = {
    level_hash: input.levelHash,
    best_moves: bestMoves,
    source: input.source ?? null,
    source_level_id: input.sourceLevelId ?? null,
    level_name: input.levelName ?? null,
    player_user_id: input.playerUserId ?? null,
    player_display_name: input.playerDisplayName ?? null,
    achieved_at: new Date().toISOString(),
  };
  if (input.solutionMoves != null) {
    upsertRow.solution_moves = input.solutionMoves;
  }

  const { data, error } = await admin
    .from('level_best_scores')
    .upsert(upsertRow, {
      onConflict: 'level_hash',
    })
    .select(selectColumns)
    .limit(1);

  if (error) {
    if (withSolutionColumn && isMissingSolutionMovesColumn(error)) {
      return submitLevelBestScoreToSupabase({ ...input, solutionMoves: null });
    }
    throw error instanceof Error ? error : new Error('Failed to save level best score.');
  }

  const rows = (data ?? []) as unknown as LevelBestScoreRow[];
  const row = rows[0];
  if (!row) {
    throw new Error('Level best score save returned no data.');
  }

  const score = mapRow(row);
  levelBestScoreCache.set(score.levelHash, score);
  return { score, improved: !existing || Number(existing.best_moves) > bestMoves };
}
