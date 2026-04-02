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
  it('creates 4 players at correct grid positions', () => {
    const state = createInitialState(testLevel, TILE);
    expect(state.players).toHaveLength(4);
    // Player 0 at grid (1,1)
    expect(state.players[0].col).toBe(1);
    expect(state.players[0].row).toBe(1);
    expect(state.players[0].rotation).toBe(0);
    expect(state.players[0].color).toBe('#ff9a56');
    expect(state.players[0].alive).toBe(true);
    expect(state.players[0].animProgress).toBe(1);
  });
});

describe('checkKillZones', () => {
  it('kills player standing on kill tile and respawns at checkpoint', () => {
    const state = createInitialState(testLevel, TILE);
    // Move player 0 to kill zone (col 2, row 2)
    state.players[0].col = 2;
    state.players[0].row = 2;
    checkKillZones(state, testLevel);
    // Should respawn at start (no checkpoint touched)
    expect(state.players[0].col).toBe(1);
    expect(state.players[0].row).toBe(1);
  });

  it('respawns at checkpoint if one was touched', () => {
    const state = createInitialState(testLevel, TILE);
    // Set checkpoint for player 0
    state.players[0].checkpointCol = 3;
    state.players[0].checkpointRow = 1;
    // Move to kill zone
    state.players[0].col = 2;
    state.players[0].row = 2;
    checkKillZones(state, testLevel);
    expect(state.players[0].col).toBe(3);
    expect(state.players[0].row).toBe(1);
  });

  it('does not affect players not on kill tiles', () => {
    const state = createInitialState(testLevel, TILE);
    const origCol = state.players[0].col;
    checkKillZones(state, testLevel);
    expect(state.players[0].col).toBe(origCol);
  });
});

describe('checkCheckpoints', () => {
  it('updates checkpoint when player touches yellow tile', () => {
    const state = createInitialState(testLevel, TILE);
    // Move player 0 to checkpoint tile (col 3, row 1)
    state.players[0].col = 3;
    state.players[0].row = 1;
    checkCheckpoints(state, testLevel);
    expect(state.players[0].checkpointCol).toBe(3);
    expect(state.players[0].checkpointRow).toBe(1);
  });
});

// Level with 4 goal tiles for win condition tests
const fourGoalLevel: LevelData = {
  id: 0,
  name: 'test-4goal',
  width: 6,
  height: 6,
  grid: [
    [0, 0, 0, 0, 0, 0],
    [0, 3, 1, 1, 3, 0],
    [0, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 0],
    [0, 3, 1, 1, 3, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 2, startY: 2, rotation: 0 },
    { startX: 3, startY: 2, rotation: 1 },
    { startX: 2, startY: 3, rotation: 2 },
    { startX: 3, startY: 3, rotation: 3 },
  ],
};

describe('checkWinCondition', () => {
  it('returns true when all 4 players locked on goals', () => {
    const state = createInitialState(fourGoalLevel, TILE);
    // Move each player onto a different goal and lock them
    state.players[0].col = 1; state.players[0].row = 1; state.players[0].lockedOnGoal = true;
    state.players[1].col = 4; state.players[1].row = 1; state.players[1].lockedOnGoal = true;
    state.players[2].col = 1; state.players[2].row = 4; state.players[2].lockedOnGoal = true;
    state.players[3].col = 4; state.players[3].row = 4; state.players[3].lockedOnGoal = true;
    expect(checkWinCondition(state, fourGoalLevel)).toBe(true);
  });

  it('returns false when not all players are on goals', () => {
    const state = createInitialState(fourGoalLevel, TILE);
    // Only 3 players on goals, player 0 stays on floor
    state.players[1].col = 4; state.players[1].row = 1;
    state.players[2].col = 1; state.players[2].row = 4;
    state.players[3].col = 4; state.players[3].row = 4;
    expect(checkWinCondition(state, fourGoalLevel)).toBe(false);
  });

  it('returns false when goals are not all covered', () => {
    const state = createInitialState(testLevel, TILE);
    // testLevel has 1 goal — can never have all 4 players on goals
    state.players[3].col = 3;
    state.players[3].row = 3;
    expect(checkWinCondition(state, testLevel)).toBe(false);
  });

  it('tracks playersOnGoals count correctly', () => {
    const state = createInitialState(fourGoalLevel, TILE);
    state.players[0].col = 1; state.players[0].row = 1; state.players[0].lockedOnGoal = true;
    state.players[1].col = 4; state.players[1].row = 1; state.players[1].lockedOnGoal = true;
    checkWinCondition(state, fourGoalLevel);
    expect(state.playersOnGoals).toBe(2);
  });
});
