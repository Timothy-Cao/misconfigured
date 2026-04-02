import { describe, it, expect } from 'vitest';
import { getTileAt, isWalkable, movePlayer } from '../physics';
import { TileType, type LevelData, type PlayerState } from '../types';

// Minimal 5x5 test level:
const testLevel: LevelData = {
  id: 0,
  name: 'test',
  width: 5,
  height: 5,
  grid: [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 2, 1, 0],
    [0, 1, 1, 3, 0],
    [0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 1, rotation: 0 },
    { startX: 3, startY: 1, rotation: 1 },
    { startX: 1, startY: 3, rotation: 2 },
    { startX: 3, startY: 3, rotation: 3 },
  ],
};

const TILE = 40;

describe('getTileAt', () => {
  it('returns correct tile type for grid coordinates', () => {
    expect(getTileAt(testLevel, 0, 0)).toBe(TileType.VOID);
    expect(getTileAt(testLevel, 1, 1)).toBe(TileType.FLOOR);
    expect(getTileAt(testLevel, 2, 2)).toBe(TileType.KILL);
    expect(getTileAt(testLevel, 3, 3)).toBe(TileType.GOAL);
  });

  it('returns VOID for out-of-bounds', () => {
    expect(getTileAt(testLevel, -1, 0)).toBe(TileType.VOID);
    expect(getTileAt(testLevel, 5, 5)).toBe(TileType.VOID);
  });
});

describe('isWalkable', () => {
  it('floor, kill, goal, checkpoint are walkable', () => {
    expect(isWalkable(TileType.FLOOR)).toBe(true);
    expect(isWalkable(TileType.KILL)).toBe(true);
    expect(isWalkable(TileType.GOAL)).toBe(true);
    expect(isWalkable(TileType.CHECKPOINT)).toBe(true);
  });

  it('void is not walkable', () => {
    expect(isWalkable(TileType.VOID)).toBe(false);
  });
});

describe('movePlayer', () => {
  const makePlayer = (x: number, y: number): PlayerState => ({
    x, y, alive: true,
    checkpointX: x, checkpointY: y,
    rotation: 0, color: '#e94560',
  });

  it('moves player by velocity * dt on open floor', () => {
    const p = makePlayer(1.5 * TILE, 1.5 * TILE);
    const result = movePlayer(p, 1, 0, 200, 0.016, testLevel, TILE);
    expect(result.x).toBeGreaterThan(p.x);
    expect(result.y).toBe(p.y);
  });

  it('stops player at wall boundary on X axis', () => {
    // Player near right edge of tile 3 but still valid (center at 3.5*TILE)
    // halfSize = 14, so right edge at 140+14=154, within tile 3
    const p = makePlayer(3.5 * TILE, 1.5 * TILE);
    const result = movePlayer(p, 1, 0, 200, 0.5, testLevel, TILE);
    const halfSize = TILE * 0.7 / 2;
    // Should not enter tile 4 (void)
    expect(result.x + halfSize).toBeLessThanOrEqual(4 * TILE);
  });

  it('allows Y movement when X is blocked', () => {
    // Player at right edge of walkable area, moving right+down
    // X should be blocked (already near wall), Y should still move
    const halfSize = TILE * 0.7 / 2;
    // Place player so right edge is at wall boundary (can't move right)
    const p = makePlayer(4 * TILE - halfSize - 0.01, 1.5 * TILE);
    const result = movePlayer(p, 1, 1, 200, 0.016, testLevel, TILE);
    // X blocked, but Y should move
    expect(result.x).toBeCloseTo(p.x, 0); // X barely moves or stays
    expect(result.y).toBeGreaterThan(p.y);
  });

  it('does not move dead player', () => {
    const p = makePlayer(1.5 * TILE, 1.5 * TILE);
    p.alive = false;
    const result = movePlayer(p, 1, 0, 200, 0.016, testLevel, TILE);
    expect(result.x).toBe(p.x);
    expect(result.y).toBe(p.y);
  });
});
