import { type LevelData } from '@/engine/types';

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
  try {
    const response = await supabaseRequest(
      `/rest/v1/campaign_overrides?select=id,name,width,height,grid,players,lives,max_moves&id=eq.${id}&limit=1`,
    );
    const rows = (await response.json()) as CampaignOverrideRow[];
    const row = rows[0];
    return row ? mapRowToLevel(row) : undefined;
  } catch (error) {
    if (!isMissingMaxMovesColumn(error)) throw error;
    const response = await supabaseRequest(
      `/rest/v1/campaign_overrides?select=id,name,width,height,grid,players,lives&id=eq.${id}&limit=1`,
    );
    const rows = (await response.json()) as CampaignOverrideRow[];
    const row = rows[0];
    return row ? mapRowToLevel(row) : undefined;
  }
}

export async function listCampaignOverrideIdsFromSupabase(): Promise<number[]> {
  try {
    const response = await supabaseRequest('/rest/v1/campaign_overrides?select=id');
    const rows = (await response.json()) as CampaignOverrideIdRow[];
    return rows.map(row => row.id).filter(id => Number.isFinite(id));
  } catch (error) {
    if (!isMissingMaxMovesColumn(error)) throw error;
    const response = await supabaseRequest('/rest/v1/campaign_overrides?select=id');
    const rows = (await response.json()) as CampaignOverrideIdRow[];
    return rows.map(row => row.id).filter(id => Number.isFinite(id));
  }
}

export async function listCampaignOverridesFromSupabase(): Promise<LevelData[]> {
  try {
    const response = await supabaseRequest(
      '/rest/v1/campaign_overrides?select=id,name,width,height,grid,players,lives,max_moves&order=id.asc',
    );
    const rows = (await response.json()) as CampaignOverrideRow[];
    return rows.map(mapRowToLevel);
  } catch (error) {
    if (!isMissingMaxMovesColumn(error)) throw error;
    const response = await supabaseRequest(
      '/rest/v1/campaign_overrides?select=id,name,width,height,grid,players,lives&order=id.asc',
    );
    const rows = (await response.json()) as CampaignOverrideRow[];
    return rows.map(mapRowToLevel);
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

    return mapRowToLevel(row);
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

    return mapRowToLevel(row);
  }
}
