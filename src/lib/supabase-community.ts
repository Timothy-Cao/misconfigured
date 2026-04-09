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

export interface CommunityLevelListItem extends LevelData {
  creatorInitials: string | null;
  creatorName: string | null;
  isBuiltIn: boolean;
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

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
}

export interface OwnedCommunityLevelRecord extends OwnedCommunityLevelSummary {
  level: LevelData;
  ownerId: string | null;
  createdAt: string | null;
}

export interface SaveOwnedCommunityLevelInput {
  id?: number | null;
  ownerId: string;
  isAdmin?: boolean;
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

function getCreatorInitials(name: string | null, email: string | null): string | null {
  const source = (name?.trim() || email?.trim() || '').trim();
  if (!source) return null;

  const words = source
    .replace(/[@._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return null;
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function getSupabaseErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; details?: unknown; code?: unknown };
    const parts = [
      typeof maybeError.message === 'string' ? maybeError.message : null,
      typeof maybeError.details === 'string' ? maybeError.details : null,
      typeof maybeError.code === 'string' ? `code ${maybeError.code}` : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  return fallback;
}

async function selectRows(query: PromiseLike<{ data: CommunityLevelRow[] | null; error: unknown }>): Promise<CommunityLevelRow[]> {
  const { data, error } = await query;
  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Supabase query failed.'));
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

export async function listPublishedCommunityLevelItemsFromSupabase(): Promise<CommunityLevelListItem[]> {
  const admin = getSupabaseAdminClient();
  const rows = await selectRows(
    admin
      .from('community_levels')
      .select('id,owner_id,name,width,height,grid,players,lives,max_moves,is_published,created_at,updated_at')
      .eq('is_published', true)
      .order('id', { ascending: true }),
  );

  const ownerIds = Array.from(new Set(
    rows.map(row => row.owner_id).filter((ownerId): ownerId is string => Boolean(ownerId)),
  ));

  let profileMap = new Map<string, ProfileRow>();
  if (ownerIds.length > 0) {
    const { data, error } = await admin
      .from('profiles')
      .select('id,display_name,email')
      .in('id', ownerIds);

    if (error) {
      throw new Error(getSupabaseErrorMessage(error, 'Failed to load community creator profiles.'));
    }

    profileMap = new Map((data ?? []).map(profile => [profile.id, profile as ProfileRow]));
  }

  return rows.map((row) => {
    const profile = row.owner_id ? profileMap.get(row.owner_id) ?? null : null;
    return {
      ...mapRowToLevel(row),
      creatorInitials: getCreatorInitials(profile?.display_name ?? null, profile?.email ?? null),
      creatorName: profile?.display_name ?? profile?.email ?? null,
      isBuiltIn: false,
    };
  });
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

async function ensurePublishedLimit(ownerId: string, nextPublished: boolean, existingId?: number | null, isAdmin = false): Promise<void> {
  if (!nextPublished || isAdmin) {
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
    throw new Error(getSupabaseErrorMessage(error, 'Failed to check published map limit.'));
  }

  if ((count ?? 0) >= MAX_PUBLISHED_COMMUNITY_LEVELS) {
    throw new Error(`You can publish up to ${MAX_PUBLISHED_COMMUNITY_LEVELS} community maps at a time.`);
  }
}

export async function saveOwnedCommunityLevelInSupabase(input: SaveOwnedCommunityLevelInput): Promise<OwnedCommunityLevelRecord> {
  const { id, ownerId, isAdmin = false, level, isPublished } = input;
  const admin = getSupabaseAdminClient();

  if (id != null) {
    const existing = await getOwnedCommunityLevelRowFromSupabase(id, ownerId);
    if (!existing) {
      throw new Error('You can only update your own cloud maps.');
    }

    const alreadyPublished = Boolean(existing.is_published);
    if (!alreadyPublished || !isPublished) {
      await ensurePublishedLimit(ownerId, isPublished, id, isAdmin);
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
      throw new Error(getSupabaseErrorMessage(error, 'Failed to update cloud map.'));
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Cloud map update returned no data.');
    }

    return mapRowToOwnedRecord(row as CommunityLevelRow);
  }

  await ensurePublishedLimit(ownerId, isPublished, null, isAdmin);

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
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create cloud map.'));
  }

  const row = data?.[0];
  if (!row) {
    throw new Error('Cloud map creation returned no data.');
  }

  return mapRowToOwnedRecord(row as CommunityLevelRow);
}

export async function setOwnedCommunityLevelPublishedInSupabase(ownerId: string, id: number, isPublished: boolean, isAdmin = false): Promise<OwnedCommunityLevelSummary> {
  const existing = await getOwnedCommunityLevelRowFromSupabase(id, ownerId);
  if (!existing) {
    throw new Error('You can only manage your own cloud maps.');
  }

  if (!existing.is_published || !isPublished) {
    await ensurePublishedLimit(ownerId, isPublished, id, isAdmin);
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
    throw new Error(getSupabaseErrorMessage(error, 'Failed to update publication status.'));
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
    throw new Error(getSupabaseErrorMessage(error, 'Failed to delete cloud map.'));
  }
}

export async function deleteCommunityLevelFromSupabase(requesterId: string, id: number, isAdmin = false): Promise<void> {
  const admin = getSupabaseAdminClient();

  if (isAdmin) {
    const { data, error } = await admin
      .from('community_levels')
      .select('id')
      .eq('id', id)
      .limit(1);

    if (error) {
      throw new Error(getSupabaseErrorMessage(error, 'Failed to load community level for deletion.'));
    }

    if (!data || data.length === 0) {
      throw new Error('Community level not found.');
    }

    const { error: deleteError } = await admin
      .from('community_levels')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(getSupabaseErrorMessage(deleteError, 'Failed to delete cloud map.'));
    }

    return;
  }

  await deleteOwnedCommunityLevelFromSupabase(requesterId, id);
}
