import { type LevelData } from '@/engine/types';

const MIN_SIZE = 4;
const MAX_SIZE = 20;
const MAX_TILE_VALUE = 108;
const MAX_PLAYERS = 8;
const MAX_NAME_LENGTH = 100;
const MAX_MOVES_LIMIT = 9999;
const MAX_LIVES = 99;

export function validateLevelData(level: unknown): string | null {
  if (!level || typeof level !== 'object') {
    return 'Missing level payload.';
  }

  const l = level as Record<string, unknown>;

  if (typeof l.name !== 'string' || l.name.trim().length === 0) {
    return 'Level name is required.';
  }
  if (l.name.length > MAX_NAME_LENGTH) {
    return `Level name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  if (!Number.isInteger(l.width) || (l.width as number) < MIN_SIZE || (l.width as number) > MAX_SIZE) {
    return `Width must be an integer between ${MIN_SIZE} and ${MAX_SIZE}.`;
  }
  if (!Number.isInteger(l.height) || (l.height as number) < MIN_SIZE || (l.height as number) > MAX_SIZE) {
    return `Height must be an integer between ${MIN_SIZE} and ${MAX_SIZE}.`;
  }

  const width = l.width as number;
  const height = l.height as number;

  if (!Array.isArray(l.grid) || l.grid.length !== height) {
    return `Grid must have exactly ${height} rows.`;
  }
  for (let r = 0; r < height; r++) {
    const row = l.grid[r];
    if (!Array.isArray(row) || row.length !== width) {
      return `Grid row ${r} must have exactly ${width} columns.`;
    }
    for (let c = 0; c < width; c++) {
      const tile = row[c];
      if (!Number.isInteger(tile) || tile < 0 || tile > MAX_TILE_VALUE) {
        return `Invalid tile value ${tile} at row ${r}, column ${c}.`;
      }
    }
  }

  if (!Array.isArray(l.players) || l.players.length < 1) {
    return 'At least one player spawn is required.';
  }
  if (l.players.length > MAX_PLAYERS) {
    return `At most ${MAX_PLAYERS} player spawns are allowed.`;
  }

  const positions = new Set<string>();
  for (let i = 0; i < l.players.length; i++) {
    const p = l.players[i];
    if (!p || typeof p !== 'object') {
      return `Player ${i + 1} is invalid.`;
    }
    const { startX, startY, rotation } = p as Record<string, unknown>;
    if (!Number.isInteger(startX) || (startX as number) < 0 || (startX as number) >= width) {
      return `Player ${i + 1} startX is out of bounds.`;
    }
    if (!Number.isInteger(startY) || (startY as number) < 0 || (startY as number) >= height) {
      return `Player ${i + 1} startY is out of bounds.`;
    }
    if (rotation !== 0 && rotation !== 1 && rotation !== 2 && rotation !== 3) {
      return `Player ${i + 1} has an invalid rotation.`;
    }
    const key = `${startX},${startY}`;
    if (positions.has(key)) {
      return `Players ${i + 1} shares a position with another player.`;
    }
    positions.add(key);
  }

  if (l.lives !== undefined && l.lives !== null) {
    if (!Number.isInteger(l.lives) || (l.lives as number) < 1 || (l.lives as number) > MAX_LIVES) {
      return `Lives must be an integer between 1 and ${MAX_LIVES}.`;
    }
  }

  if (l.maxMoves !== undefined && l.maxMoves !== null) {
    if (!Number.isInteger(l.maxMoves) || (l.maxMoves as number) < 1 || (l.maxMoves as number) > MAX_MOVES_LIMIT) {
      return `Max moves must be an integer between 1 and ${MAX_MOVES_LIMIT}.`;
    }
  }

  return null;
}

export function sanitizeLevelData(level: LevelData): LevelData {
  return {
    id: level.id,
    name: level.name.trim(),
    width: level.width,
    height: level.height,
    grid: level.grid.map(row => row.map(Number)),
    players: level.players.map(p => ({
      startX: p.startX,
      startY: p.startY,
      rotation: p.rotation,
    })),
    ...(level.lives != null ? { lives: level.lives } : {}),
    ...(level.maxMoves != null ? { maxMoves: level.maxMoves } : {}),
  };
}
