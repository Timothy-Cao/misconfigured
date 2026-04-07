import { type LevelData } from '@/engine/types';
import { MAX_PUBLISHED_COMMUNITY_LEVELS } from '@/lib/community-limits';
import { getSupabaseAdminClient } from '@/lib/supabase/admin-client';

export interface OwnedCommunityLevelSummary {
  id: number;
  name: string;
  width: number;
  height: number;
  isPublished: boolean;
  updatedAt: string | null;
}

interface CommunityLevelRow {
  id: number;
  owner_id: string | null;
  name: string;
  width: number;
  height: number;
  grid: number[][];
  players: LevelData['players'];
  lives: number | null;
  max_moves: number | null;
  is_published: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface OwnedCommunityLevelRecord extends OwnedCommunityLevelSummary {
  level: LevelData;
  ownerId: string | null;
  createdAt: string | null;
}

export interface SaveOwnedCommunityLevelInput {
  id?: number | null;
  ownerId: string;
  level: LevelData;
  isPublished: boolean;
}

function mapRowToLevel(row: CommunityLevelRow): LevelData {
  return {
    id: Number(row.id),
    name: row.name,
    width: Number(row.width),
    height: Number(row.height),
    grid: row.grid.map(r => [...r]),
    players: row.players.map(player => ({ ...player })),
    lives: row.lives ?? 1,
    maxMoves: row.max_moves && row.max_moves > 0 ? row.max_moves : undefined,
  };
}

function mapRowToOwnedRecord(row: CommunityLevelRow): OwnedCommunityLevelRecord {
  return {
    id: Number(row.id),
    name: row.name,
    width: Number(row.width),
    height: Number(row.height),
    isPublished: Boolean(row.is_published),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    ownerId: typeof row.owner_id === 'string' ? row.owner_id : null,
    level: mapRowToLevel(row),
  };
}

function mapRowToOwnedSummary(row: CommunityLevelRow): OwnedCommunityLevelSummary {
  return {
    id: Number(row.id),
    name: row.name,
    width: Number(row.width),
    height: Number(row.height),
    isPublished: Boolean(row.is_published),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
}

async function selectRows(query: PromiseLike<{ data: CommunityLevelRow[] | null; error: unknown }>): Promise<CommunityLevelRow[]> {
  const { data, error } = await query;
  if (error) {
    throw error instanceof Error ? error : new Error('Supabase query failed.');
  }
  return data ?? [];
}

export async function listPublishedCommunityLevelsFromSupabase(): Promise<LevelData[]> {
  const admin = getSupabaseAdminClient();
  const rows = await selectRows(
    admin
      .from('community_levels')
      .select('id,owner_id,name,width,height,grid,players,lives,max_moves,is_published,created_at,updated_at')
      .eq('is_published', true)
      .order('id', { ascending: true }),
  );
  return rows.map(mapRowToLevel);
}

export async function listOwnedCommunityLevelsFromSupabase(ownerId: string): Promise<OwnedCommunityLevelSummary[]> {
  const admin = getSupabaseAdminClient();

  const rows = await selectRows(
    admin
      .from('community_levels')
      .select('id,owner_id,name,width,height,grid,players,lives,max_moves,is_published,created_at,updated_at')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false }),
  );

  return rows.map(mapRowToOwnedSummary);
}

export async function getOwnedCommunityLevelSummaryFromSupabase(id: number, ownerId: string): Promise<OwnedCommunityLevelSummary | null> {
  const row = await getOwnedCommunityLevelRowFromSupabase(id, ownerId);
  return row ? mapRowToOwnedSummary(row) : null;
}

async function getOwnedCommunityLevelRowFromSupabase(id: number, ownerId: string): Promise<CommunityLevelRow | null> {
  const admin = getSupabaseAdminClient();
  const rows = await selectRows(
    admin
      .from('community_levels')
      .select('id,owner_id,name,width,height,grid,players,lives,max_moves,is_published,created_at,updated_at')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .limit(1),
  );

  return rows[0] ?? null;
}

export async function getAccessibleCommunityLevelFromSupabase(id: number, viewerId: string | null): Promise<OwnedCommunityLevelRecord | null> {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from('community_levels')
    .select('id,owner_id,name,width,height,grid,players,lives,max_moves,is_published,created_at,updated_at')
    .eq('id', id)
    .limit(1);

  if (viewerId) {
    query = query.or(`is_published.eq.true,owner_id.eq.${viewerId}`);
  } else {
    query = query.eq('is_published', true);
  }

  const rows = await selectRows(query);
  const row = rows[0];
  return row ? mapRowToOwnedRecord(row) : null;
}

async function ensurePublishedLimit(ownerId: string, nextPublished: boolean, existingId?: number | null): Promise<void> {
  if (!nextPublished) {
    return;
  }

  const admin = getSupabaseAdminClient();
  let query = admin
    .from('community_levels')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .eq('is_published', true);

  if (existingId) {
    query = query.neq('id', existingId);
  }

  const { count, error } = await query;
  if (error) {
    throw error instanceof Error ? error : new Error('Failed to check published map limit.');
  }

  if ((count ?? 0) >= MAX_PUBLISHED_COMMUNITY_LEVELS) {
    throw new Error(`You can publish up to ${MAX_PUBLISHED_COMMUNITY_LEVELS} community maps at a time.`);
  }
}

export async function saveOwnedCommunityLevelInSupabase(input: SaveOwnedCommunityLevelInput): Promise<OwnedCommunityLevelRecord> {
  const { id, ownerId, level, isPublished } = input;
  const admin = getSupabaseAdminClient();

  if (id != null) {
    const existing = await getOwnedCommunityLevelRowFromSupabase(id, ownerId);
    if (!existing) {
      throw new Error('You can only update your own cloud maps.');
    }

    const alreadyPublished = Boolean(existing.is_published);
    if (!alreadyPublished || !isPublished) {
      await ensurePublishedLimit(ownerId, isPublished, id);
    }

    const { data, error } = await admin
      .from('community_levels')
      .update({
        name: level.name,
        width: level.width,
        height: level.height,
        grid: level.grid,
        players: level.players,
        lives: level.lives ?? 1,
        max_moves: level.maxMoves ?? null,
        is_published: isPublished,
      })
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('id,owner_id,name,width,height,grid,players,lives,max_moves,is_published,created_at,updated_at')
      .limit(1);

    if (error) {
      throw error instanceof Error ? error : new Error('Failed to update cloud map.');
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Cloud map update returned no data.');
    }

    return mapRowToOwnedRecord(row as CommunityLevelRow);
  }

  await ensurePublishedLimit(ownerId, isPublished);

  const { data, error } = await admin
    .from('community_levels')
    .insert({
      owner_id: ownerId,
      name: level.name,
      width: level.width,
      height: level.height,
      grid: level.grid,
      players: level.players,
      lives: level.lives ?? 1,
      max_moves: level.maxMoves ?? null,
      is_published: isPublished,
    })
    .select('id,owner_id,name,width,height,grid,players,lives,max_moves,is_published,created_at,updated_at')
    .limit(1);

  if (error) {
    throw error instanceof Error ? error : new Error('Failed to create cloud map.');
  }

  const row = data?.[0];
  if (!row) {
    throw new Error('Cloud map creation returned no data.');
  }

  return mapRowToOwnedRecord(row as CommunityLevelRow);
}

export async function setOwnedCommunityLevelPublishedInSupabase(ownerId: string, id: number, isPublished: boolean): Promise<OwnedCommunityLevelSummary> {
  const existing = await getOwnedCommunityLevelRowFromSupabase(id, ownerId);
  if (!existing) {
    throw new Error('You can only manage your own cloud maps.');
  }

  if (!existing.is_published || !isPublished) {
    await ensurePublishedLimit(ownerId, isPublished, id);
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('community_levels')
    .update({
      is_published: isPublished,
    })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('id,owner_id,name,width,height,grid,players,lives,max_moves,is_published,created_at,updated_at')
    .limit(1);

  if (error) {
    throw error instanceof Error ? error : new Error('Failed to update publication status.');
  }

  const row = data?.[0];
  if (!row) {
    throw new Error('Publication update returned no data.');
  }

  return mapRowToOwnedSummary(row as CommunityLevelRow);
}

export async function deleteOwnedCommunityLevelFromSupabase(ownerId: string, id: number): Promise<void> {
  const existing = await getOwnedCommunityLevelRowFromSupabase(id, ownerId);
  if (!existing) {
    throw new Error('You can only delete your own cloud maps.');
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from('community_levels')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId);

  if (error) {
    throw error instanceof Error ? error : new Error('Failed to delete cloud map.');
  }
}
