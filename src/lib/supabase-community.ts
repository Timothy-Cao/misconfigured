import { type LevelData } from '@/engine/types';

interface CommunityLevelRow {
  id: number;
  name: string;
  width: number;
  height: number;
  grid: number[][];
  players: LevelData['players'];
  lives: number | null;
  created_at?: string;
  updated_at?: string;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase environment variables are missing.');
  }

  return { url, serviceRoleKey };
}

function mapRowToLevel(row: CommunityLevelRow): LevelData {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    grid: row.grid.map(r => [...r]),
    players: row.players.map(player => ({ ...player })),
    lives: row.lives ?? 1,
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

export async function listCommunityLevelsFromSupabase(): Promise<LevelData[]> {
  const response = await supabaseRequest(
    '/rest/v1/community_levels?select=id,name,width,height,grid,players,lives&order=id.asc',
  );
  const rows = (await response.json()) as CommunityLevelRow[];
  return rows.map(mapRowToLevel);
}

export async function getCommunityLevelFromSupabase(id: number): Promise<LevelData | undefined> {
  const response = await supabaseRequest(
    `/rest/v1/community_levels?select=id,name,width,height,grid,players,lives&id=eq.${id}&limit=1`,
  );
  const rows = (await response.json()) as CommunityLevelRow[];
  const row = rows[0];
  return row ? mapRowToLevel(row) : undefined;
}

export async function upsertCommunityLevelInSupabase(level: LevelData): Promise<LevelData> {
  const response = await supabaseRequest('/rest/v1/community_levels', {
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

  const rows = (await response.json()) as CommunityLevelRow[];
  const row = rows[0];
  if (!row) {
    throw new Error('Supabase did not return the saved level.');
  }

  return mapRowToLevel(row);
}
