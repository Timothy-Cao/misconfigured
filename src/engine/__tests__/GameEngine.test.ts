import { describe, it, expect, vi } from 'vitest';
import {
  createInitialState,
  checkKillZones,
  checkCheckpoints,
  checkWinCondition,
  updateRepaintStations,
  updateStickyPads,
  GameEngine,
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
  it('creates all configured units at correct grid positions', () => {
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

  it('initializes move limit tracking from the level data', () => {
    const state = createInitialState({ ...testLevel, maxMoves: 7 }, TILE);
    expect(state.movesUsed).toBe(0);
    expect(state.maxMoves).toBe(7);
    expect(state.outOfMoves).toBe(false);
    expect(state.gameOverReason).toBeNull();
  });
});

describe('checkKillZones', () => {
  it('starts death animation when player stands on kill tile', () => {
    const state = createInitialState(testLevel, TILE);
    // Move player 0 to kill zone (col 2, row 2)
    state.players[0].col = 2;
    state.players[0].row = 2;
    checkKillZones(state, testLevel);
    expect(state.players[0].col).toBe(2);
    expect(state.players[0].row).toBe(2);
    expect(state.players[0].deathTimer).toBeGreaterThan(0);
  });

  it('does not overwrite an in-progress death animation', () => {
    const state = createInitialState(testLevel, TILE);
    state.players[0].col = 2;
    state.players[0].row = 2;
    state.players[0].deathTimer = 0.5;
    checkKillZones(state, testLevel);
    expect(state.players[0].deathTimer).toBe(0.5);
  });

  it('does not affect players not on kill tiles', () => {
    const state = createInitialState(testLevel, TILE);
    const origCol = state.players[0].col;
    checkKillZones(state, testLevel);
    expect(state.players[0].col).toBe(origCol);
    expect(state.players[0].deathTimer).toBe(0);
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

describe('identity and sticky tiles', () => {
  it('repaint stations rewrite the player identity to the station color', () => {
    const level: LevelData = {
      ...testLevel,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 84, 1, 4, 0],
        [0, 1, 2, 1, 0],
        [0, 1, 1, 3, 0],
        [0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
    };
    const state = createInitialState(level, TILE);
    updateRepaintStations(state, level);
    expect(state.players[0].rotation).toBe(1);
    expect(state.players[0].color).toBe('#4ecdc4');
  });

  it('sticky pads arm a single skipped future input when entered', () => {
    const level: LevelData = {
      ...testLevel,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 4, 0],
        [0, 1, TileType.STICKY, 1, 0],
        [0, 1, 1, 3, 0],
        [0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
    };
    const state = createInitialState(level, TILE);
    const prevPositions = [{ col: 1, row: 1 }];
    state.players[0].col = 2;
    state.players[0].row = 2;
    updateStickyPads(state, level, prevPositions);
    expect(state.players[0].stickyCharges).toBe(1);
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
  it('returns true when all units are settled on goals', () => {
    const state = createInitialState(fourGoalLevel, TILE);
    // Move each player onto a different goal and lock them
    state.players[0].col = 1; state.players[0].row = 1; state.players[0].lockedOnGoal = true;
    state.players[1].col = 4; state.players[1].row = 1; state.players[1].lockedOnGoal = true;
    state.players[2].col = 1; state.players[2].row = 4; state.players[2].lockedOnGoal = true;
    state.players[3].col = 4; state.players[3].row = 4; state.players[3].lockedOnGoal = true;
    expect(checkWinCondition(state)).toBe(true);
  });

  it('returns false when not all players are on goals', () => {
    const state = createInitialState(fourGoalLevel, TILE);
    // Only 3 players on goals, player 0 stays on floor
    state.players[1].col = 4; state.players[1].row = 1;
    state.players[2].col = 1; state.players[2].row = 4;
    state.players[3].col = 4; state.players[3].row = 4;
    expect(checkWinCondition(state)).toBe(false);
  });

  it('returns false when any unit is still unsettled', () => {
    const state = createInitialState(testLevel, TILE);
    state.players[3].col = 3;
    state.players[3].row = 3;
    expect(checkWinCondition(state)).toBe(false);
  });

  it('tracks settled unit count correctly', () => {
    const state = createInitialState(fourGoalLevel, TILE);
    state.players[0].col = 1; state.players[0].row = 1; state.players[0].lockedOnGoal = true;
    state.players[1].col = 4; state.players[1].row = 1; state.players[1].lockedOnGoal = true;
    checkWinCondition(state);
    expect(state.settledUnits).toBe(2);
  });
});

describe('move limits', () => {
  it('counts only manual inputs that change gameplay state', () => {
    const level: LevelData = {
      id: 99,
      name: 'move-limit-test',
      width: 5,
      height: 5,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
      maxMoves: 1,
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'W' | 'A' | 'S' | 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'W' });
    update(0.016);
    expect(getState().movesUsed).toBe(0);
    expect(getState().gameOver).toBe(false);

    update(0.5);
    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.1);
    expect(getState().movesUsed).toBe(1);
    expect(getState().outOfMoves).toBe(true);
    expect(getState().gameOver).toBe(false);

    update(0.2);
    expect(getState().gameOver).toBe(false);

    update(0.3);
    expect(getState().gameOver).toBe(false);

    update(0.2);
    expect(getState().gameOver).toBe(true);
    expect(getState().gameOverReason).toBe('moves');
  });

  it('lets conveyor-driven board motion resolve before ending the round out of moves', () => {
    const level: LevelData = {
      id: 101,
      name: 'move-limit-conveyor-settle',
      width: 6,
      height: 5,
      grid: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 31, 3, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
      maxMoves: 1,
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'W' | 'A' | 'S' | 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.5);
    expect(getState().movesUsed).toBe(1);
    expect(getState().outOfMoves).toBe(true);
    expect(getState().players[0].col).toBe(2);
    expect(getState().gameOver).toBe(false);

    update(0.1);
    expect(getState().gameOver).toBe(false);

    update(0.4);
    expect(getState().players[0].col).toBe(3);
    expect(getState().gameOver).toBe(false);

    update(0.1);
    expect(getState().levelComplete).toBe(true);
    expect(getState().gameOver).toBe(false);
  });

  it('does not accept or buffer new manual input until the previous motion is settled', () => {
    const level: LevelData = {
      id: 100,
      name: 'input-settle-test',
      width: 5,
      height: 5,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'W' | 'A' | 'S' | 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.5);
    expect(getState().players[0].col).toBe(2);
    expect(getState().movesUsed).toBe(1);

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.05);
    expect(getState().players[0].col).toBe(2);

    update(0.45);
    expect(getState().players[0].col).toBe(2);

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.5);
    expect(getState().players[0].col).toBe(3);
    expect(getState().movesUsed).toBe(2);
  });

  it('can replay scripted moves with passive conveyor beats', () => {
    const level: LevelData = {
      id: 102,
      name: 'replay-script-test',
      width: 6,
      height: 5,
      grid: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 31, 1, 3, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
    };

    const passiveSteps: string[] = [];
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(
      canvas,
      level,
      TILE,
      { onPassiveReplayStep: () => passiveSteps.push('.') },
      { replayScript: 'D.D' },
    );
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    update(0.5);
    expect(getState().players[0].col).toBe(2);
    expect(getState().movesUsed).toBe(1);

    update(0.5);
    expect(getState().players[0].col).toBe(3);
    expect(passiveSteps).toEqual(['.']);

    update(0.5);
    expect(getState().players[0].col).toBe(4);
    expect(getState().movesUsed).toBe(2);

    update(0.2);
    expect(getState().levelComplete).toBe(true);
  });
});

describe('movement edge cases', () => {
  it('blocks stepping onto a door that closes when leaving its plate', () => {
    const level: LevelData = {
      id: 200,
      name: 'door-close-test',
      width: 5,
      height: 3,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 10, 20, 1, 0],
        [0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.2);
    expect(getState().players[0].col).toBe(1);
    expect(getState().players[0].row).toBe(1);
  });

  it('lets a line of units advance together when the front unit moves away', () => {
    const level: LevelData = {
      id: 201,
      name: 'line-move-test',
      width: 6,
      height: 3,
      grid: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      players: [
        { startX: 1, startY: 1, rotation: 0 },
        { startX: 2, startY: 1, rotation: 0 },
      ],
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.2);
    const state = getState();
    expect(state.players[0].col).toBe(2);
    expect(state.players[1].col).toBe(3);
  });
});

describe('restart behavior', () => {
  it('restores collected life pickups so they can be collected again after restart', () => {
    const level: LevelData = {
      id: 202,
      name: 'life-restart-test',
      width: 5,
      height: 5,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, TileType.LIFE_PICKUP, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
      lives: 1,
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.5);
    expect(getState().livesRemaining).toBe(2);
    expect(level.grid[1][2]).toBe(TileType.LIFE_PICKUP);

    engine.restart();
    expect(getState().livesRemaining).toBe(1);

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.5);
    expect(getState().livesRemaining).toBe(2);
  });
});

describe('undo behavior', () => {
  it('reverts counted manual moves back through prior settled states', () => {
    const level: LevelData = {
      id: 203,
      name: 'undo-basic',
      width: 6,
      height: 3,
      grid: [
        [0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.5);
    update(0.5);
    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.5);
    update(0.5);

    expect(getState().players[0].col).toBe(3);
    expect(getState().movesUsed).toBe(2);

    expect(engine.undo()).toBe(true);
    expect(getState().players[0].col).toBe(2);
    expect(getState().movesUsed).toBe(1);

    expect(engine.undo()).toBe(true);
    expect(getState().players[0].col).toBe(1);
    expect(getState().movesUsed).toBe(0);

    expect(engine.undo()).toBe(false);
  });

  it('caps undo history at the last three counted moves', () => {
    const level: LevelData = {
      id: 204,
      name: 'undo-cap',
      width: 8,
      height: 3,
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    for (let i = 0; i < 4; i += 1) {
      enqueueManualInput({ kind: 'key', key: 'D' });
      update(0.5);
      update(0.5);
    }

    expect(getState().players[0].col).toBe(5);
    expect(getState().movesUsed).toBe(4);

    expect(engine.undo()).toBe(true);
    expect(engine.undo()).toBe(true);
    expect(engine.undo()).toBe(true);
    expect(getState().players[0].col).toBe(2);
    expect(getState().movesUsed).toBe(1);

    expect(engine.undo()).toBe(false);
    expect(getState().players[0].col).toBe(2);
    expect(getState().movesUsed).toBe(1);
  });

  it('restores pickup and move-limit state when undoing the last counted move', () => {
    const level: LevelData = {
      id: 205,
      name: 'undo-pickup',
      width: 5,
      height: 3,
      grid: [
        [0, 0, 0, 0, 0],
        [0, 1, TileType.LIFE_PICKUP, 1, 0],
        [0, 0, 0, 0, 0],
      ],
      players: [{ startX: 1, startY: 1, rotation: 0 }],
      lives: 1,
      maxMoves: 1,
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'D' });
    update(0.5);
    update(0.5);

    expect(getState().livesRemaining).toBe(2);
    expect(getState().movesUsed).toBe(1);
    expect(getState().outOfMoves).toBe(true);

    expect(engine.undo()).toBe(true);
    expect(getState().players[0].col).toBe(1);
    expect(getState().livesRemaining).toBe(1);
    expect(getState().maxLives).toBe(1);
    expect(getState().movesUsed).toBe(0);
    expect(getState().outOfMoves).toBe(false);
    expect(getState().collectedLifeTiles.size).toBe(0);
  });
});

describe('black hole settling', () => {
  it('still accepts manual input for remaining units after one unit finishes in a black hole', () => {
    const level: LevelData = {
      id: 102,
      name: 'black-hole-continue',
      width: 6,
      height: 6,
      grid: [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, TileType.BLACKHOLE, 0, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      players: [
        { startX: 2, startY: 3, rotation: 0 },
        { startX: 3, startY: 4, rotation: 0 },
      ],
    };

    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
    const engine = new GameEngine(canvas, level, TILE, {});
    const enqueueManualInput = (engine as unknown as { enqueueManualInput: (input: { kind: 'key'; key: 'W' | 'A' | 'S' | 'D' }) => void }).enqueueManualInput.bind(engine);
    const update = (engine as unknown as { update: (dt: number) => void }).update.bind(engine);
    const getState = () => (engine as unknown as { state: ReturnType<typeof createInitialState> }).state;

    enqueueManualInput({ kind: 'key', key: 'W' });
    update(0.5);
    update(0.6);
    expect(getState().players[0].finished).toBe(true);

    enqueueManualInput({ kind: 'key', key: 'W' });
    update(0.5);
    expect(getState().players[1].row).toBe(3);
  });
});
