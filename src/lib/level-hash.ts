import { type LevelData } from '@/engine/types';

function stableLevelPayload(level: LevelData) {
  return {
    width: level.width,
    height: level.height,
    grid: level.grid,
    players: level.players.map(player => ({
      startX: player.startX,
      startY: player.startY,
      rotation: player.rotation,
    })),
    lives: level.lives ?? 1,
    maxMoves: level.maxMoves ?? null,
  };
}

function cyrb53Hash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return hash.toString(16).padStart(14, '0');
}

export function getLevelHash(level: LevelData): string {
  return cyrb53Hash(JSON.stringify(stableLevelPayload(level)));
}
