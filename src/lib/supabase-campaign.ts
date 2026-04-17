import { type LevelData } from '@/engine/types';
import { cloneLevelData } from '@/lib/level-clone';
import { PUBLIC_READ_CACHE_TTL_MS } from '@/lib/public-cache';
import { TtlCache } from '@/lib/ttl-cache';

interface CampaignOverrideRow {
  id: number;
  name: string;
  width: number;
  height: number;
  grid: number[][];
  players: LevelData['players'];
  lives: number | null;
  max_moves: number | null;
}

interface CampaignOverrideIdRow {
  id: number;
}

const campaignOverrideListCache = new TtlCache<LevelData[]>(PUBLIC_READ_CACHE_TTL_MS);
const campaignOverrideByIdCache = new TtlCache<LevelData | null>(PUBLIC_READ_CACHE_TTL_MS);
const campaignOverrideIdsCache = new TtlCache<number[]>(PUBLIC_READ_CACHE_TTL_MS);

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  return { url, serviceRoleKey };
}

function isMissingMaxMovesColumn(error: unknown): boolean {
  return error instanceof Error && /max_moves/i.test(error.message) && /column/i.test(error.message);
}

function mapRowToLevel(row: CampaignOverrideRow): LevelData {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    grid: row.grid.map(r => [...r]),
    players: row.players.map(player => ({ ...player })),
    lives: row.lives ?? 1,
    maxMoves: row.max_moves && row.max_moves > 0 ? row.max_moves : undefined,
  };
}

function cloneLevels(levels: LevelData[]): LevelData[] {
  return levels.map(cloneLevelData);
}

export function invalidateCampaignSupabaseCache(id?: number): void {
  campaignOverrideListCache.clear();
  campaignOverrideIdsCache.clear();

  if (id == null) {
    campaignOverrideByIdCache.clear();
    return;
  }

  campaignOverrideByIdCache.delete(String(id));
}

async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed with ${response.status}`);
  }

  return response;
}

export async function getCampaignOverrideFromSupabase(id: number): Promise<LevelData | undefined> {
  const cached = campaignOverrideByIdCache.get(String(id));
  if (cached !== undefined) {
    return cached ? cloneLevelData(cached) : undefined;
  }

  try {
    const response = await supabaseRequest(
      `/rest/v1/campaign_overrides?select=id,name,width,height,grid,players,lives,max_moves&id=eq.${id}&limit=1`,
    );
    const rows = (await response.json()) as CampaignOverrideRow[];
    const row = rows[0];
    const level = row ? mapRowToLevel(row) : undefined;
    campaignOverrideByIdCache.set(String(id), level ?? null);
    return level ? cloneLevelData(level) : undefined;
  } catch (error) {
    if (!isMissingMaxMovesColumn(error)) throw error;
    const response = await supabaseRequest(
      `/rest/v1/campaign_overrides?select=id,name,width,height,grid,players,lives&id=eq.${id}&limit=1`,
    );
    const rows = (await response.json()) as CampaignOverrideRow[];
    const row = rows[0];
    const level = row ? mapRowToLevel(row) : undefined;
    campaignOverrideByIdCache.set(String(id), level ?? null);
    return level ? cloneLevelData(level) : undefined;
  }
}

export async function listCampaignOverrideIdsFromSupabase(): Promise<number[]> {
  const cached = campaignOverrideIdsCache.get('all');
  if (cached !== undefined) {
    return [...cached];
  }

  try {
    const response = await supabaseRequest('/rest/v1/campaign_overrides?select=id');
    const rows = (await response.json()) as CampaignOverrideIdRow[];
    const ids = rows.map(row => row.id).filter(id => Number.isFinite(id));
    campaignOverrideIdsCache.set('all', ids);
    return [...ids];
  } catch (error) {
    if (!isMissingMaxMovesColumn(error)) throw error;
    const response = await supabaseRequest('/rest/v1/campaign_overrides?select=id');
    const rows = (await response.json()) as CampaignOverrideIdRow[];
    const ids = rows.map(row => row.id).filter(id => Number.isFinite(id));
    campaignOverrideIdsCache.set('all', ids);
    return [...ids];
  }
}

export async function listCampaignOverridesFromSupabase(): Promise<LevelData[]> {
  const cached = campaignOverrideListCache.get('all');
  if (cached !== undefined) {
    return cloneLevels(cached);
  }

  try {
    const response = await supabaseRequest(
      '/rest/v1/campaign_overrides?select=id,name,width,height,grid,players,lives,max_moves&order=id.asc',
    );
    const rows = (await response.json()) as CampaignOverrideRow[];
    const levels = rows.map(mapRowToLevel);
    campaignOverrideListCache.set('all', levels);
    for (const level of levels) {
      campaignOverrideByIdCache.set(String(level.id), level);
    }
    campaignOverrideIdsCache.set('all', levels.map(level => level.id));
    return cloneLevels(levels);
  } catch (error) {
    if (!isMissingMaxMovesColumn(error)) throw error;
    const response = await supabaseRequest(
      '/rest/v1/campaign_overrides?select=id,name,width,height,grid,players,lives&order=id.asc',
    );
    const rows = (await response.json()) as CampaignOverrideRow[];
    const levels = rows.map(mapRowToLevel);
    campaignOverrideListCache.set('all', levels);
    for (const level of levels) {
      campaignOverrideByIdCache.set(String(level.id), level);
    }
    campaignOverrideIdsCache.set('all', levels.map(level => level.id));
    return cloneLevels(levels);
  }
}

export async function upsertCampaignOverrideInSupabase(level: LevelData): Promise<LevelData> {
  try {
    const response = await supabaseRequest('/rest/v1/campaign_overrides', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: level.id,
        name: level.name,
        width: level.width,
        height: level.height,
        grid: level.grid,
        players: level.players,
        lives: level.lives ?? 1,
        max_moves: level.maxMoves ?? null,
      }),
    });

    const rows = (await response.json()) as CampaignOverrideRow[];
    const row = rows[0];
    if (!row) {
      throw new Error('Supabase did not return the saved campaign override.');
    }

    const savedLevel = mapRowToLevel(row);
    invalidateCampaignSupabaseCache(level.id);
    campaignOverrideByIdCache.set(String(savedLevel.id), savedLevel);
    return cloneLevelData(savedLevel);
  } catch (error) {
    if (!isMissingMaxMovesColumn(error)) throw error;
    const response = await supabaseRequest('/rest/v1/campaign_overrides', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        id: level.id,
        name: level.name,
        width: level.width,
        height: level.height,
        grid: level.grid,
        players: level.players,
        lives: level.lives ?? 1,
      }),
    });

    const rows = (await response.json()) as CampaignOverrideRow[];
    const row = rows[0];
    if (!row) {
      throw new Error('Supabase did not return the saved campaign override.');
    }

    const savedLevel = mapRowToLevel(row);
    invalidateCampaignSupabaseCache(level.id);
    campaignOverrideByIdCache.set(String(savedLevel.id), savedLevel);
    return cloneLevelData(savedLevel);
  }
}
