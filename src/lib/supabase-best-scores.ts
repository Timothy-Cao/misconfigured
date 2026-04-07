import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';

export interface LevelBestScore {
  levelHash: string;
  bestMoves: number;
  source: string | null;
  sourceLevelId: number | null;
  levelName: string | null;
  playerUserId: string | null;
  playerDisplayName: string | null;
  achievedAt: string | null;
}

export interface UserLevelBestScore {
  userId: string;
  levelHash: string;
  bestMoves: number;
  source: string | null;
  sourceLevelId: number | null;
  levelName: string | null;
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
  achieved_at: string | null;
}

interface UserLevelBestScoreRow {
  user_id: string;
  level_hash: string;
  best_moves: number;
  source: string | null;
  source_level_id: number | null;
  level_name: string | null;
  achieved_at: string | null;
}

function mapRow(row: LevelBestScoreRow): LevelBestScore {
  return {
    levelHash: row.level_hash,
    bestMoves: Number(row.best_moves),
    source: row.source,
    sourceLevelId: row.source_level_id == null ? null : Number(row.source_level_id),
    levelName: row.level_name,
    playerUserId: row.player_user_id,
    playerDisplayName: row.player_display_name,
    achievedAt: row.achieved_at,
  };
}

function mapUserRow(row: UserLevelBestScoreRow): UserLevelBestScore {
  return {
    userId: row.user_id,
    levelHash: row.level_hash,
    bestMoves: Number(row.best_moves),
    source: row.source,
    sourceLevelId: row.source_level_id == null ? null : Number(row.source_level_id),
    levelName: row.level_name,
    achievedAt: row.achieved_at,
  };
}

export async function listLevelBestScoresFromSupabase(hashes: string[]): Promise<LevelBestScore[]> {
  const uniqueHashes = Array.from(new Set(hashes.map(hash => hash.trim()).filter(Boolean)));
  if (uniqueHashes.length === 0) return [];

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('level_best_scores')
    .select('level_hash,best_moves,source,source_level_id,level_name,player_user_id,player_display_name,achieved_at')
    .in('level_hash', uniqueHashes);

  if (error) {
    throw error instanceof Error ? error : new Error('Failed to load level best scores.');
  }

  return (data ?? []).map(row => mapRow(row as LevelBestScoreRow));
}

export async function submitLevelBestScoreToSupabase(input: {
  levelHash: string;
  moves: number;
  source?: string | null;
  sourceLevelId?: number | null;
  levelName?: string | null;
  playerUserId?: string | null;
  playerDisplayName?: string | null;
}): Promise<{ score: LevelBestScore; improved: boolean }> {
  const bestMoves = Math.max(0, Math.floor(input.moves));
  const admin = getSupabaseAdminClient();

  const { data: existingData, error: existingError } = await admin
    .from('level_best_scores')
    .select('level_hash,best_moves,source,source_level_id,level_name,player_user_id,player_display_name,achieved_at')
    .eq('level_hash', input.levelHash)
    .limit(1);

  if (existingError) {
    throw existingError instanceof Error ? existingError : new Error('Failed to load current level best score.');
  }

  const existing = (existingData?.[0] as LevelBestScoreRow | undefined) ?? null;
  if (existing && Number(existing.best_moves) <= bestMoves) {
    return { score: mapRow(existing), improved: false };
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('level_best_scores')
    .upsert({
      level_hash: input.levelHash,
      best_moves: bestMoves,
      source: input.source ?? null,
      source_level_id: input.sourceLevelId ?? null,
      level_name: input.levelName ?? null,
      player_user_id: input.playerUserId ?? null,
      player_display_name: input.playerDisplayName ?? null,
      achieved_at: now,
    }, {
      onConflict: 'level_hash',
    })
    .select('level_hash,best_moves,source,source_level_id,level_name,player_user_id,player_display_name,achieved_at')
    .limit(1);

  if (error) {
    throw error instanceof Error ? error : new Error('Failed to save level best score.');
  }

  const row = data?.[0] as LevelBestScoreRow | undefined;
  if (!row) {
    throw new Error('Level best score save returned no data.');
  }

  return { score: mapRow(row), improved: true };
}

export async function submitUserLevelBestScoreToSupabase(input: {
  userId: string;
  levelHash: string;
  moves: number;
  source?: string | null;
  sourceLevelId?: number | null;
  levelName?: string | null;
}): Promise<{ score: UserLevelBestScore; improved: boolean }> {
  const bestMoves = Math.max(0, Math.floor(input.moves));
  const admin = getSupabaseAdminClient();

  const { data: existingData, error: existingError } = await admin
    .from('user_level_best_scores')
    .select('user_id,level_hash,best_moves,source,source_level_id,level_name,achieved_at')
    .eq('user_id', input.userId)
    .eq('level_hash', input.levelHash)
    .limit(1);

  if (existingError) {
    throw existingError instanceof Error ? existingError : new Error('Failed to load current user level best score.');
  }

  const existing = (existingData?.[0] as UserLevelBestScoreRow | undefined) ?? null;
  if (existing && Number(existing.best_moves) <= bestMoves) {
    return { score: mapUserRow(existing), improved: false };
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('user_level_best_scores')
    .upsert({
      user_id: input.userId,
      level_hash: input.levelHash,
      best_moves: bestMoves,
      source: input.source ?? null,
      source_level_id: input.sourceLevelId ?? null,
      level_name: input.levelName ?? null,
      achieved_at: now,
    }, {
      onConflict: 'user_id,level_hash',
    })
    .select('user_id,level_hash,best_moves,source,source_level_id,level_name,achieved_at')
    .limit(1);

  if (error) {
    throw error instanceof Error ? error : new Error('Failed to save user level best score.');
  }

  const row = data?.[0] as UserLevelBestScoreRow | undefined;
  if (!row) {
    throw new Error('User level best score save returned no data.');
  }

  return { score: mapUserRow(row), improved: true };
}
