import { type LevelData, type GameState, type PlayerState, type PushableBlock, COLORS, PLAYER_SIZE_RATIO, TileType, STEP_INTERVAL, ANIM_DURATION, isPressurePlate, pressurePlateNumber, isDoor, doorNumber, isToggleSwitch, toggleNumber, isConveyor, conveyorDirection, isRotationTile, rotationTileCW, DIR_DX, DIR_DY, type Rotation } from './types';

import { InputManager, remapInput } from './input';
import { getTileAt, isWalkable, canMoveTo } from './physics';
import { render } from './renderer';

export function countGoals(level: LevelData): number {
  let count = 0;
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      if (level.grid[row][col] === TileType.GOAL) count++;
    }
  }
  return count;
}

function collectPushableBlocks(level: LevelData): PushableBlock[] {
  const blocks: PushableBlock[] = [];
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      if (level.grid[row][col] === TileType.PUSHABLE) {
        blocks.push({ col, row, underTile: TileType.FLOOR });
      }
    }
  }
  return blocks;
}

export function createInitialState(level: LevelData, tileSize: number): GameState {
  const players = level.players.map((p) => ({
    col: p.startX,
    row: p.startY,
    prevCol: p.startX,
    prevRow: p.startY,
    animProgress: 1, // fully arrived
    alive: true,
    checkpointCol: p.startX,
    checkpointRow: p.startY,
    rotation: p.rotation,
    color: COLORS.players[p.rotation],
    reversed: false,
    sliding: false,
    slideDx: 0,
    slideDy: 0,
    finished: false,
    lockedOnGoal: false,
    absorbTimer: 0,
  }));

  return {
    players,
    levelComplete: false,
    tileSize,
    time: 0,
    playersOnGoals: 0,
    totalGoals: countGoals(level),
    completionTime: 0,
    occupiedGoals: new Set(),
    pushableBlocks: collectPushableBlocks(level),
    activePlates: new Set(),
    crumbledTiles: new Set(),
    toggledSwitches: new Set(),
    teleportCharges: new Map(),
  };
}

export function checkKillZones(state: GameState, level: LevelData): void {
  for (const player of state.players) {
    if (!player.alive) continue;
    const tile = level.grid[player.row]?.[player.col];
    if (tile === TileType.KILL || (tile === TileType.CRUMBLE && state.crumbledTiles.has(`${player.row},${player.col}`))) {
      player.col = player.checkpointCol;
      player.row = player.checkpointRow;
      player.prevCol = player.col;
      player.prevRow = player.row;
      player.animProgress = 1;
      player.sliding = false;
    }
  }
}

export function checkCheckpoints(state: GameState, level: LevelData): void {
  for (const player of state.players) {
    if (!player.alive) continue;
    if (level.grid[player.row]?.[player.col] === TileType.CHECKPOINT) {
      player.checkpointCol = player.col;
      player.checkpointRow = player.row;
    }
  }
}

/**
 * Track crumbling floors. When a player leaves a crumble tile, it becomes void.
 */
function updateCrumbleTiles(state: GameState, level: LevelData, prevPositions: { col: number; row: number }[]): void {
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i];
    if (!player.alive) continue;
    const prev = prevPositions[i];

    if (prev.col !== player.col || prev.row !== player.row) {
      const prevTile = level.grid[prev.row]?.[prev.col];
      if (prevTile === TileType.CRUMBLE) {
        const key = `${prev.row},${prev.col}`;
        if (!state.crumbledTiles.has(key)) {
          const otherOnTile = state.players.some((p, j) => {
            if (j === i || !p.alive) return false;
            return p.col === prev.col && p.row === prev.row;
          });
          if (!otherOnTile) {
            state.crumbledTiles.add(key);
          }
        }
      }
    }
  }
}

/**
 * Update reverse status for players on reverse tiles.
 */
function updateReverseTiles(state: GameState, level: LevelData): void {
  for (const player of state.players) {
    if (!player.alive) continue;
    const tile = level.grid[player.row]?.[player.col];
    player.reversed = tile === TileType.REVERSE;
  }
}

/**
 * Update which pressure plates are active.
 */
export function updatePressurePlates(state: GameState, level: LevelData): void {
  const active = new Set<number>();
  for (const player of state.players) {
    if (!player.alive) continue;
    const tile = level.grid[player.row]?.[player.col];
    if (tile !== undefined && isPressurePlate(tile)) {
      active.add(pressurePlateNumber(tile));
    }
  }
  for (const block of state.pushableBlocks) {
    if (isPressurePlate(block.underTile)) {
      active.add(pressurePlateNumber(block.underTile));
    }
  }
  state.activePlates = active;
}

/**
 * Update toggle switches — toggle state when a player steps on one.
 */
const toggleCooldown = new Set<string>();
function updateToggleSwitches(state: GameState, level: LevelData): void {
  for (const player of state.players) {
    if (!player.alive) continue;
    const tile = level.grid[player.row]?.[player.col];
    if (tile !== undefined && isToggleSwitch(tile)) {
      const key = `${player.row},${player.col}`;
      if (!toggleCooldown.has(key)) {
        const n = toggleNumber(tile);
        if (state.toggledSwitches.has(n)) {
          state.toggledSwitches.delete(n);
        } else {
          state.toggledSwitches.add(n);
        }
        toggleCooldown.add(key);
      }
    }
  }

  for (const key of toggleCooldown) {
    const [r, c] = key.split(',').map(Number);
    const occupied = state.players.some(p => {
      if (!p.alive) return false;
      return p.col === c && p.row === r;
    });
    if (!occupied) toggleCooldown.delete(key);
  }
}

/**
 * Handle rotation tiles. Only triggers once per entry.
 */
const rotationCooldown = new Set<string>();
function updateRotationTiles(state: GameState, level: LevelData): void {
  for (let pi = 0; pi < state.players.length; pi++) {
    const player = state.players[pi];
    if (!player.alive) continue;
    const tile = level.grid[player.row]?.[player.col];
    if (tile === undefined || !isRotationTile(tile)) continue;

    const key = `${player.row},${player.col},${pi}`;
    if (rotationCooldown.has(key)) continue;

    const cw = rotationTileCW(tile);
    if (cw) {
      player.rotation = ((player.rotation + 1) % 4) as Rotation;
    } else {
      player.rotation = ((player.rotation + 3) % 4) as Rotation;
    }
    player.color = COLORS.players[player.rotation];
    rotationCooldown.add(key);
  }

  for (const key of rotationCooldown) {
    const parts = key.split(',').map(Number);
    const r = parts[0], c = parts[1], pi = parts[2];
    const p = state.players[pi];
    if (!p || !p.alive) { rotationCooldown.delete(key); continue; }
    if (p.col !== c || p.row !== r) rotationCooldown.delete(key);
  }
}

export function checkWinCondition(state: GameState, level: LevelData): boolean {
  const goals: { col: number; row: number }[] = [];
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      if (level.grid[row][col] === TileType.GOAL) {
        goals.push({ col, row });
      }
    }
  }

  let playersSettled = 0;
  const occupied = new Set<string>();

  for (const p of state.players) {
    if (!p.alive) continue;
    if (p.finished) {
      playersSettled++;
      continue;
    }
    if (p.lockedOnGoal) {
      playersSettled++;
      occupied.add(`${p.row},${p.col}`);
      continue;
    }
    // Still absorbing doesn't count yet
    if (p.absorbTimer > 0) continue;
    const isOnGoal = goals.some(g => g.col === p.col && g.row === p.row);
    if (isOnGoal) {
      occupied.add(`${p.row},${p.col}`);
    }
  }

  state.playersOnGoals = playersSettled;
  state.occupiedGoals = occupied;

  return playersSettled === state.players.length;
}

function tryPushBlock(
  level: LevelData,
  state: GameState,
  blockCol: number,
  blockRow: number,
  dx: number,
  dy: number,
): boolean {
  const destCol = blockCol + dx;
  const destRow = blockRow + dy;

  const destTile = getTileAt(level, destCol, destRow);
  if (!isWalkable(destTile, state.activePlates, state.toggledSwitches, state.crumbledTiles, destCol, destRow)) return false;

  const hasBlockAtDest = state.pushableBlocks.some(b => b.col === destCol && b.row === destRow);
  if (hasBlockAtDest) return false;

  for (const p of state.players) {
    if (!p.alive) continue;
    if (p.col === destCol && p.row === destRow) return false;
  }

  const block = state.pushableBlocks.find(b => b.col === blockCol && b.row === blockRow);
  if (!block) return false;

  level.grid[blockRow][blockCol] = block.underTile;
  block.underTile = level.grid[destRow][destCol];
  level.grid[destRow][destCol] = TileType.PUSHABLE;

  block.col = destCol;
  block.row = destRow;

  return true;
}

/**
 * Try to step a player one tile in (dx, dy) direction.
 * Returns true if the step was taken.
 */
function stepPlayer(
  player: PlayerState,
  dx: number,
  dy: number,
  selfIndex: number,
  state: GameState,
  level: LevelData,
): boolean {
  if (!player.alive || (dx === 0 && dy === 0)) return false;
  // Only allow cardinal movement (no diagonals)
  if (dx !== 0 && dy !== 0) {
    // Prefer horizontal
    dy = 0;
  }

  const targetCol = player.col + dx;
  const targetRow = player.row + dy;

  // Try pushing a block first
  if (level.grid[targetRow]?.[targetCol] === TileType.PUSHABLE) {
    tryPushBlock(level, state, targetCol, targetRow, dx, dy);
  }

  if (!canMoveTo(level, targetCol, targetRow, player.col, player.row, selfIndex, state.players, state.activePlates, state.toggledSwitches, state.crumbledTiles)) {
    return false;
  }

  // Move
  player.prevCol = player.col;
  player.prevRow = player.row;
  player.col = targetCol;
  player.row = targetRow;
  player.animProgress = 0;
  return true;
}

export interface GameEngineCallbacks {
  onLevelComplete?: (completionTime: number) => void;
  onProgressUpdate?: (playersOnGoals: number) => void;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private level: LevelData;
  private state: GameState;
  private input: InputManager;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private callbacks: GameEngineCallbacks;
  private elapsed: number = 0;
  private originalGrid: number[][];
  /** Time since last step for each player (for hold-to-walk) */
  private stepTimers: number[];
  /** Whether each player has taken their first step (for initial delay) */
  private firstStep: boolean[];

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelData,
    tileSize: number,
    callbacks: GameEngineCallbacks = {},
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.level = level;
    this.originalGrid = level.grid.map(r => [...r]);
    this.state = createInitialState(level, tileSize);
    this.input = new InputManager();
    this.callbacks = callbacks;
    this.stepTimers = Array(level.players.length).fill(0);
    this.firstStep = Array(level.players.length).fill(true);

    canvas.width = level.width * tileSize;
    canvas.height = level.height * tileSize;
  }

  start(): void {
    this.input.attach();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.input.detach();
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  restart(): void {
    this.level.grid = this.originalGrid.map(r => [...r]);
    this.state = createInitialState(this.level, this.state.tileSize);
    this.elapsed = 0;
    this.stepTimers = Array(this.state.players.length).fill(0);
    this.firstStep = Array(this.state.players.length).fill(true);
    toggleCooldown.clear();
    rotationCooldown.clear();
  }

  private loop = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.elapsed += dt;
    this.state.time = this.elapsed;

    if (!this.state.levelComplete) {
      this.update(dt);
    }

    render(this.ctx, this.level, this.state);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const keys = this.input.getKeys();

    // Update pressure plates and toggles BEFORE movement
    updatePressurePlates(this.state, this.level);
    updateToggleSwitches(this.state, this.level);

    // Advance animation progress for all players
    for (const player of this.state.players) {
      if (player.animProgress < 1) {
        player.animProgress = Math.min(1, player.animProgress + dt / ANIM_DURATION);
      }
    }

    // Store previous positions for crumble detection
    const prevPositions = this.state.players.map(p => ({ col: p.col, row: p.row }));

    for (let i = 0; i < this.state.players.length; i++) {
      const player = this.state.players[i];
      if (!player.alive || player.finished || player.lockedOnGoal || player.absorbTimer > 0) continue;

      // Ice sliding overrides normal input
      if (player.sliding) {
        this.stepTimers[i] += dt;
        if (this.stepTimers[i] >= STEP_INTERVAL) {
          this.stepTimers[i] -= STEP_INTERVAL;
          const tile = this.level.grid[player.row]?.[player.col];
          if (tile !== TileType.ICE) {
            player.sliding = false;
            player.slideDx = 0;
            player.slideDy = 0;
          } else {
            const moved = stepPlayer(player, player.slideDx, player.slideDy, i, this.state, this.level);
            if (!moved) {
              player.sliding = false;
              player.slideDx = 0;
              player.slideDy = 0;
            }
          }
        }
        continue;
      }

      let move = remapInput(keys, player.rotation);

      // Reverse controls if on reverse tile
      if (player.reversed) {
        move = { dx: -move.dx, dy: -move.dy };
      }

      const hasInput = move.dx !== 0 || move.dy !== 0;

      if (hasInput) {
        this.stepTimers[i] += dt;
        const interval = this.firstStep[i] ? 0 : STEP_INTERVAL;
        if (this.stepTimers[i] >= interval) {
          this.stepTimers[i] -= Math.max(interval, STEP_INTERVAL);
          // Normalize to single axis (prefer horizontal if both pressed)
          let sdx = move.dx !== 0 ? (move.dx > 0 ? 1 : -1) : 0;
          let sdy = move.dy !== 0 ? (move.dy > 0 ? 1 : -1) : 0;
          if (sdx !== 0 && sdy !== 0) sdy = 0;

          const moved = stepPlayer(player, sdx, sdy, i, this.state, this.level);
          if (moved) {
            this.firstStep[i] = false;
            // Check if player just entered ice
            const newTile = this.level.grid[player.row]?.[player.col];
            if (newTile === TileType.ICE) {
              player.sliding = true;
              player.slideDx = sdx;
              player.slideDy = sdy;
              this.stepTimers[i] = 0;
            }
          }
        }
      } else {
        this.stepTimers[i] = 0;
        this.firstStep[i] = true;
      }

      // Conveyor belt push (one step per interval, separate from player input)
      const convTile = this.level.grid[player.row]?.[player.col];
      if (convTile !== undefined && isConveyor(convTile) && !player.sliding) {
        // Conveyors push continuously — use a sub-timer approach
        // We'll just push once per step interval if not already stepping
        // For simplicity, push if the player's animation is complete
        if (player.animProgress >= 1) {
          const dir = conveyorDirection(convTile);
          stepPlayer(player, DIR_DX[dir], DIR_DY[dir], i, this.state, this.level);
        }
      }
    }

    // Black hole absorption — start absorb animation when landing on black hole
    for (const player of this.state.players) {
      if (!player.alive || player.finished) continue;
      if (player.animProgress >= 1) {
        const tile = this.level.grid[player.row]?.[player.col];
        if (tile === TileType.BLACKHOLE && player.absorbTimer === 0) {
          player.absorbTimer = 0.001; // start absorption
        }
        // Lock onto regular goal
        if (tile === TileType.GOAL && !player.lockedOnGoal) {
          player.lockedOnGoal = true;
        }
      }
    }

    // Advance absorb animation
    for (const player of this.state.players) {
      if (player.absorbTimer > 0 && !player.finished) {
        player.absorbTimer = Math.min(1, player.absorbTimer + dt / 0.5); // 0.5s absorption
        if (player.absorbTimer >= 1) {
          player.finished = true;
        }
      }
    }

    // Update tile-based effects
    updateReverseTiles(this.state, this.level);
    updateRotationTiles(this.state, this.level);
    updateCrumbleTiles(this.state, this.level, prevPositions);
    checkCheckpoints(this.state, this.level);
    checkKillZones(this.state, this.level);

    // Re-update pressure plates after movement
    updatePressurePlates(this.state, this.level);

    // Only check win after all player animations have finished
    const allAnimsDone = this.state.players.every(p => p.animProgress >= 1);
    if (allAnimsDone && checkWinCondition(this.state, this.level)) {
      this.state.levelComplete = true;
      this.state.completionTime = this.elapsed;
      this.callbacks.onLevelComplete?.(this.elapsed);
    }

    this.callbacks.onProgressUpdate?.(this.state.playersOnGoals);
  }
}
