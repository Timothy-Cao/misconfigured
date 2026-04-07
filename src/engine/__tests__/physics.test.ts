import { describe, it, expect } from 'vitest';
import { getTileAt, isWalkable, canMoveTo } from '../physics';
import { TileType, openDoorTile, type LevelData, type PlayerState } from '../types';

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

  it('pushable is not walkable', () => {
    expect(isWalkable(TileType.PUSHABLE)).toBe(false);
  });

  it('supports controlled walls that start closed or open', () => {
    const noPlates = new Set<number>();
    const noToggles = new Set<number>();
    const plateOne = new Set([1]);
    const toggleOne = new Set([1]);

    expect(isWalkable(20, noPlates, noToggles)).toBe(false);
    expect(isWalkable(20, plateOne, noToggles)).toBe(true);
    expect(isWalkable(openDoorTile(1), noPlates, noToggles)).toBe(true);
    expect(isWalkable(openDoorTile(1), plateOne, noToggles)).toBe(false);
    expect(isWalkable(openDoorTile(1), plateOne, toggleOne)).toBe(true);
  });
});

const makePlayer = (col: number, row: number): PlayerState => ({
  col, row, prevCol: col, prevRow: row, animProgress: 1,
  alive: true,
  checkpointCol: col, checkpointRow: row,
  rotation: 0, color: '#ff9a56',
  reversed: false, sliding: false, slideDx: 0, slideDy: 0, finished: false, lockedOnGoal: false, absorbTimer: 0, deathTimer: 0, stickyCharges: 0,
});

describe('canMoveTo', () => {
  it('allows movement to walkable floor tile', () => {
    const players = [makePlayer(1, 1), makePlayer(3, 1), makePlayer(1, 3), makePlayer(3, 3)];
    // Move from (1,1) to (2,1) — floor tile
    expect(canMoveTo(testLevel, 2, 1, 1, 1, 0, players)).toBe(true);
  });

  it('blocks movement into void tile', () => {
    const players = [makePlayer(1, 1), makePlayer(3, 1), makePlayer(1, 3), makePlayer(3, 3)];
    // Move from (1,1) to (0,1) — void tile
    expect(canMoveTo(testLevel, 0, 1, 1, 1, 0, players)).toBe(false);
  });

  it('blocks movement into tile occupied by another player', () => {
    const players = [makePlayer(1, 1), makePlayer(2, 1), makePlayer(1, 3), makePlayer(3, 3)];
    // Move from (1,1) to (2,1) — occupied by player 1
    expect(canMoveTo(testLevel, 2, 1, 1, 1, 0, players)).toBe(false);
  });

  it('allows movement to goal tile', () => {
    const players = [makePlayer(3, 2), makePlayer(3, 1), makePlayer(1, 3), makePlayer(3, 3)];
    // Move from (3,2) to (3,3) — goal tile, but player 3 is there
    expect(canMoveTo(testLevel, 3, 3, 3, 2, 0, players)).toBe(false);
    // Move player 3 away first
    players[3] = makePlayer(1, 3);
    players[3].col = 2; // move player 3 somewhere else
    // Now (3,3) is free
    expect(canMoveTo(testLevel, 3, 3, 3, 2, 0, [players[0], players[1], players[2], makePlayer(2, 3)])).toBe(true);
  });

  it('does not count dead players as obstacles', () => {
    const players = [makePlayer(1, 1), makePlayer(2, 1), makePlayer(1, 3), makePlayer(3, 3)];
    players[1].alive = false;
    // Move from (1,1) to (2,1) — dead player there, should be allowed
    expect(canMoveTo(testLevel, 2, 1, 1, 1, 0, players)).toBe(true);
  });

  it('allows entering a vertical path tile from above or below', () => {
    const players = [makePlayer(2, 1), makePlayer(4, 4), makePlayer(4, 3), makePlayer(3, 4)];
    const level: LevelData = {
      ...testLevel,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 34, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
      ],
    };
    expect(canMoveTo(level, 2, 2, 2, 1, 0, players)).toBe(true);
    expect(canMoveTo(level, 2, 2, 2, 3, 0, [makePlayer(2, 3), players[1], players[2], players[3]])).toBe(true);
  });

  it('blocks entering a vertical path tile from the side', () => {
    const players = [makePlayer(1, 2), makePlayer(4, 4), makePlayer(4, 3), makePlayer(3, 4)];
    const level: LevelData = {
      ...testLevel,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 34, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
      ],
    };
    expect(canMoveTo(level, 2, 2, 1, 2, 0, players)).toBe(false);
  });

  it('blocks exiting a vertical path tile sideways', () => {
    const players = [makePlayer(2, 2), makePlayer(4, 4), makePlayer(4, 3), makePlayer(3, 4)];
    const level: LevelData = {
      ...testLevel,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 34, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
      ],
    };
    expect(canMoveTo(level, 3, 2, 2, 2, 0, players)).toBe(false);
  });

  it('allows horizontal travel through a horizontal path tile', () => {
    const players = [makePlayer(1, 2), makePlayer(4, 4), makePlayer(4, 3), makePlayer(3, 4)];
    const level: LevelData = {
      ...testLevel,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 35, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
      ],
    };
    expect(canMoveTo(level, 2, 2, 1, 2, 0, players)).toBe(true);
  });

  it('blocks entering a color filter with the wrong identity', () => {
    const players = [makePlayer(1, 2), makePlayer(4, 4), makePlayer(4, 3), makePlayer(3, 4)];
    const level: LevelData = {
      ...testLevel,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 91, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
      ],
    };
    expect(canMoveTo(level, 2, 2, 1, 2, 0, players)).toBe(false);
  });

  it('allows entering a color filter with the matching identity', () => {
    const player = makePlayer(1, 2);
    player.rotation = 1;
    player.color = '#4ecdc4';
    const players = [player, makePlayer(4, 4), makePlayer(4, 3), makePlayer(3, 4)];
    const level: LevelData = {
      ...testLevel,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 91, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
      ],
    };
    expect(canMoveTo(level, 2, 2, 1, 2, 0, players)).toBe(true);
  });
});
