import { TOTAL_LEVELS, getBuiltInLevel } from '@/levels';
import { type LevelData } from '@/engine/types';
import { listCampaignOverridesFromSupabase } from '@/lib/supabase-campaign';

export const dynamic = 'force-dynamic';

function cloneLevel(level: LevelData): LevelData {
  return {
    ...level,
    grid: level.grid.map(row => [...row]),
    players: level.players.map(player => ({ ...player })),
  };
}

function buildCampaignSnapshot(overrides: LevelData[]) {
  const overrideMap = new Map(overrides.map(level => [level.id, level]));
  const levels: LevelData[] = [];

  for (let id = 1; id <= TOTAL_LEVELS; id += 1) {
    const level = overrideMap.get(id) ?? getBuiltInLevel(id);
    if (level) {
      levels.push(cloneLevel(level));
    }
  }

  return {
    levels,
    overrideIds: Array.from(overrideMap.keys()).sort((a, b) => a - b),
  };
}

export async function GET() {
  try {
    const overrides = await listCampaignOverridesFromSupabase();
    return Response.json(buildCampaignSnapshot(overrides));
  } catch (error) {
    const fallbackLevels: LevelData[] = [];
    for (let id = 1; id <= TOTAL_LEVELS; id += 1) {
      const level = getBuiltInLevel(id);
      if (level) {
        fallbackLevels.push(cloneLevel(level));
      }
    }

    const message = error instanceof Error ? error.message : 'Failed to load campaign snapshot.';
    return Response.json({ levels: fallbackLevels, overrideIds: [], warning: message }, { status: 200 });
  }
}
