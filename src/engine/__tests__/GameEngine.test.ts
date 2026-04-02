import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  checkKillZones,
  checkCheckpoints,
  checkWinCondition,
} from '../GameEngine';
import { TileType, type LevelData } from '../types';

// 5x5 test level with kill, goal, checkpoint
const testLevel: LevelData = {
  id: 0,
  name: 'test',
  width: 5,
  height: 5,
  grid: [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 4, 0],
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

describe('createInitialState', () => {
  it('creates 4 players at correct pixel positions', () => {
    const state = createInitialState(testLevel, TILE);
    expect(state.players).toHaveLength(4);
    // Player 0 at grid (1,1) -> pixel center (1.5*40, 1.5*40)
    expect(state.players[0].x).toBe(60);
    expect(state.players[0].y).toBe(60);
    expect(state.players[0].rotation).toBe(0);
    expect(state.players[0].color).toBe('#e94560');
    expect(state.players[0].alive).toBe(true);
  });
});

describe('checkKillZones', () => {
  it('kills player standing on kill tile and respawns at checkpoint', () => {
    const state = createInitialState(testLevel, TILE);
    // Move player 0 to kill zone center (col 2, row 2)
    state.players[0].x = 2.5 * TILE;
    state.players[0].y = 2.5 * TILE;
    checkKillZones(state, testLevel, TILE);
    // Should respawn at start (no checkpoint touched)
    expect(state.players[0].x).toBe(1.5 * TILE);
    expect(state.players[0].y).toBe(1.5 * TILE);
  });

  it('respawns at checkpoint if one was touched', () => {
    const state = createInitialState(testLevel, TILE);
    // Set checkpoint for player 0
    state.players[0].checkpointX = 3.5 * TILE;
    state.players[0].checkpointY = 1.5 * TILE;
    // Move to kill zone
    state.players[0].x = 2.5 * TILE;
    state.players[0].y = 2.5 * TILE;
    checkKillZones(state, testLevel, TILE);
    expect(state.players[0].x).toBe(3.5 * TILE);
    expect(state.players[0].y).toBe(1.5 * TILE);
  });

  it('does not affect players not on kill tiles', () => {
    const state = createInitialState(testLevel, TILE);
    const origX = state.players[0].x;
    checkKillZones(state, testLevel, TILE);
    expect(state.players[0].x).toBe(origX);
  });
});

describe('checkCheckpoints', () => {
  it('updates checkpoint when player touches yellow tile', () => {
    const state = createInitialState(testLevel, TILE);
    // Move player 0 to checkpoint tile (col 3, row 1)
    state.players[0].x = 3.5 * TILE;
    state.players[0].y = 1.5 * TILE;
    checkCheckpoints(state, testLevel, TILE);
    expect(state.players[0].checkpointX).toBe(3.5 * TILE);
    expect(state.players[0].checkpointY).toBe(1.5 * TILE);
  });
});

describe('checkWinCondition', () => {
  it('returns true when all goals are covered', () => {
    const state = createInitialState(testLevel, TILE);
    // Only one goal at (3,3). Move player 3 onto it.
    state.players[3].x = 3.5 * TILE;
    state.players[3].y = 3.5 * TILE;
    expect(checkWinCondition(state, testLevel, TILE)).toBe(true);
  });

  it('returns false when goals are not covered', () => {
    const state = createInitialState(testLevel, TILE);
    // Move player 3 off the goal tile so no one covers it
    state.players[3].x = 1.5 * TILE;
    state.players[3].y = 3.5 * TILE;
    expect(checkWinCondition(state, testLevel, TILE)).toBe(false);
  });
});
