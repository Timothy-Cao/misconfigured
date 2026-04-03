import { type LevelData, type GameState, type PlayerState, type PushableBlock, COLORS, TileType, STEP_INTERVAL, ANIM_DURATION, isPressurePlate, pressurePlateNumber, isToggleSwitch, toggleNumber, isConveyor, conveyorDirection, isRotationTile, rotationTileCW, isRepaintStation, repaintRotation, DIR_DX, DIR_DY, type Rotation } from './types';

import { InputManager, remapInput } from './input';
import { getTileAt, isWalkable, canMoveTo } from './physics';
import { render } from './renderer';

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
    deathTimer: 0,
    stickyCharges: 0,
  }));

  const startingLives = level.lives ?? 1;

  return {
    players,
    levelComplete: false,
    tileSize,
    time: 0,
    settledUnits: 0,
    completionTime: 0,
    occupiedGoals: new Set(),
    pushableBlocks: collectPushableBlocks(level),
    activePlates: new Set(),
    crumbledTiles: new Set(),
    toggledSwitches: new Set(),
    teleportCharges: new Map(),
    livesRemaining: startingLives,
    maxLives: startingLives,
    gameOver: false,
    collectedLifeTiles: new Set(),
  };
}

export function checkKillZones(state: GameState, level: LevelData): void {
  for (const player of state.players) {
    if (!player.alive) continue;
    const tile = level.grid[player.row]?.[player.col];
    if (tile === TileType.KILL || (tile === TileType.CRUMBLE && state.crumbledTiles.has(`${player.row},${player.col}`))) {
      if (player.deathTimer === 0) {
        player.deathTimer = 0.001;
        player.sliding = false;
        player.slideDx = 0;
        player.slideDy = 0;
      }
    }
  }
}

/** Resolves completed death animations. Returns true if a life was consumed. */
function resolveDeaths(state: GameState): boolean {
  let lifeLost = false;
  for (const player of state.players) {
    if (player.deathTimer < 1) continue;

    // Consume a life
    state.livesRemaining = Math.max(0, state.livesRemaining - 1);
    lifeLost = true;

    if (state.livesRemaining <= 0) {
      state.gameOver = true;
      // Don't respawn — leave the player in death state
      player.deathTimer = 1;
      continue;
    }

    player.col = player.checkpointCol;
    player.row = player.checkpointRow;
    player.prevCol = player.col;
    player.prevRow = player.row;
    player.animProgress = 1;
    player.sliding = false;
    player.slideDx = 0;
    player.slideDy = 0;
    player.deathTimer = 0;
    player.lockedOnGoal = false;
    player.absorbTimer = 0;
    player.stickyCharges = 0;
  }
  return lifeLost;
}

function setPlayerIdentity(player: PlayerState, rotation: Rotation): void {
  player.rotation = rotation;
  player.color = COLORS.players[rotation];
}

export function updateRepaintStations(state: GameState, level: LevelData): void {
  for (const player of state.players) {
    if (!player.alive || player.finished || player.deathTimer > 0) continue;
    const tile = level.grid[player.row]?.[player.col];
    if (tile !== undefined && isRepaintStation(tile)) {
      setPlayerIdentity(player, repaintRotation(tile));
    }
  }
}

export function updateStickyPads(state: GameState, level: LevelData, prevPositions: { col: number; row: number }[]): void {
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i];
    if (!player.alive || player.finished || player.deathTimer > 0) continue;
    const prev = prevPositions[i];
    const tile = level.grid[player.row]?.[player.col];
    const enteredTile = (prev.col !== player.col || prev.row !== player.row) && tile === TileType.STICKY;
    if (enteredTile) {
      player.stickyCharges = 1;
    }
  }
}

function checkLifePickups(state: GameState, level: LevelData): boolean {
  let collected = false;
  for (const player of state.players) {
    if (!player.alive || player.finished || player.lockedOnGoal || player.deathTimer > 0) continue;
    const key = `${player.row},${player.col}`;
    const tile = level.grid[player.row]?.[player.col];
    if (tile === TileType.LIFE_PICKUP && !state.collectedLifeTiles.has(key)) {
      state.collectedLifeTiles.add(key);
      state.livesRemaining++;
      state.maxLives++;
      level.grid[player.row][player.col] = TileType.FLOOR;
      collected = true;
    }
  }
  return collected;
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
  state.activePlates = getActivePlates(state, level);
}

function getActivePlates(
  state: GameState,
  level: LevelData,
  movedPlayerIndex?: number,
  movedPlayerCol?: number,
  movedPlayerRow?: number,
): Set<number> {
  const active = new Set<number>();
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i];
    if (!player.alive) continue;
    const playerCol = i === movedPlayerIndex && movedPlayerCol !== undefined ? movedPlayerCol : player.col;
    const playerRow = i === movedPlayerIndex && movedPlayerRow !== undefined ? movedPlayerRow : player.row;
    const tile = level.grid[playerRow]?.[playerCol];
    if (tile !== undefined && isPressurePlate(tile)) {
      active.add(pressurePlateNumber(tile));
    }
  }
  for (const block of state.pushableBlocks) {
    if (isPressurePlate(block.underTile)) {
      active.add(pressurePlateNumber(block.underTile));
    }
  }
  return active;
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
      setPlayerIdentity(player, ((player.rotation + 1) % 4) as Rotation);
    } else {
      setPlayerIdentity(player, ((player.rotation + 3) % 4) as Rotation);
    }
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

export function checkWinCondition(state: GameState): boolean {
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
  }

  state.settledUnits = playersSettled;
  state.occupiedGoals = occupied;

  return state.players.length > 0 && playersSettled === state.players.length;
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

  const currentActivePlates = getActivePlates(state, level);
  state.activePlates = currentActivePlates;
  const projectedActivePlates = getActivePlates(state, level, selfIndex, targetCol, targetRow);

  if (!canMoveTo(level, targetCol, targetRow, player.col, player.row, selfIndex, state.players, projectedActivePlates, state.toggledSwitches, state.crumbledTiles)) {
    return false;
  }

  // Move
  player.prevCol = player.col;
  player.prevRow = player.row;
  player.col = targetCol;
  player.row = targetRow;
  player.animProgress = 0;
  state.activePlates = projectedActivePlates;
  return true;
}

export interface GameEngineCallbacks {
  onLevelComplete?: (completionTime: number) => void;
  onProgressUpdate?: (settledUnits: number) => void;
  onGameOver?: () => void;
  onLivesUpdate?: (lives: number, maxLives: number) => void;
}

interface PendingMove {
  index: number;
  dx: number;
  dy: number;
  source: 'input' | 'swipe' | 'slide' | 'conveyor';
  order: number;
}

function comparePendingMoves(a: PendingMove, b: PendingMove, state: GameState): number {
  if (a.dx === b.dx && a.dy === b.dy) {
    const playerA = state.players[a.index];
    const playerB = state.players[b.index];
    if (a.dx > 0) return playerB.col - playerA.col;
    if (a.dx < 0) return playerA.col - playerB.col;
    if (a.dy > 0) return playerB.row - playerA.row;
    if (a.dy < 0) return playerA.row - playerB.row;
  }

  return a.order - b.order;
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
  /** One-shot mobile swipe input consumed on the next update */
  private queuedSwipe: { dx: number; dy: number } | null = null;

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
    this.queuedSwipe = null;
    toggleCooldown.clear();
    rotationCooldown.clear();
  }

  queueSwipe(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    this.queuedSwipe = { dx, dy };
  }

  private loop = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.elapsed += dt;
    this.state.time = this.elapsed;

    if (!this.state.levelComplete && !this.state.gameOver) {
      this.update(dt);
    }

    render(this.ctx, this.level, this.state);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const keys = this.input.getKeys();
    const swipeInput = this.queuedSwipe;
    this.queuedSwipe = null;
    const pendingMoves: PendingMove[] = [];

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
      if (!player.alive || player.finished || player.lockedOnGoal || player.absorbTimer > 0 || player.deathTimer > 0) continue;

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
            pendingMoves.push({
              index: i,
              dx: player.slideDx,
              dy: player.slideDy,
              source: 'slide',
              order: pendingMoves.length,
            });
          }
        }
        continue;
      }

      let move = swipeInput
        ? remapInput(
            {
              w: swipeInput.dy < 0,
              a: swipeInput.dx < 0,
              s: swipeInput.dy > 0,
              d: swipeInput.dx > 0,
            },
            player.rotation,
          )
        : remapInput(keys, player.rotation);

      // Reverse controls if on reverse tile
      if (player.reversed) {
        move = { dx: -move.dx, dy: -move.dy };
      }

      const hasInput = move.dx !== 0 || move.dy !== 0;
      let queuedMoveThisTick = false;

      if (player.stickyCharges > 0 && hasInput) {
        player.stickyCharges--;
        this.stepTimers[i] = 0;
        this.firstStep[i] = true;
        continue;
      }

      if (hasInput) {
        if (swipeInput) {
          const sdx = move.dx !== 0 ? (move.dx > 0 ? 1 : -1) : 0;
          const sdy = move.dy !== 0 ? (move.dy > 0 ? 1 : -1) : 0;
          pendingMoves.push({
            index: i,
            dx: sdx,
            dy: sdy,
            source: 'swipe',
            order: pendingMoves.length,
          });
          queuedMoveThisTick = true;
          continue;
        }

        this.stepTimers[i] += dt;
        const interval = this.firstStep[i] ? 0 : STEP_INTERVAL;
        if (this.stepTimers[i] >= interval) {
          this.stepTimers[i] -= Math.max(interval, STEP_INTERVAL);
          // Normalize to single axis (prefer horizontal if both pressed)
          const sdx = move.dx !== 0 ? (move.dx > 0 ? 1 : -1) : 0;
          let sdy = move.dy !== 0 ? (move.dy > 0 ? 1 : -1) : 0;
          if (sdx !== 0 && sdy !== 0) sdy = 0;

          pendingMoves.push({
            index: i,
            dx: sdx,
            dy: sdy,
            source: 'input',
            order: pendingMoves.length,
          });
          queuedMoveThisTick = true;
        }
      } else {
        this.stepTimers[i] = 0;
        this.firstStep[i] = true;
      }

      // Conveyor belt push (one step per interval, separate from player input)
      const convTile = this.level.grid[player.row]?.[player.col];
      if (!queuedMoveThisTick && convTile !== undefined && isConveyor(convTile) && !player.sliding) {
        // Conveyors push continuously — use a sub-timer approach
        // We'll just push once per step interval if not already stepping
        // For simplicity, push if the player's animation is complete
        if (player.animProgress >= 1) {
          const dir = conveyorDirection(convTile);
          pendingMoves.push({
            index: i,
            dx: DIR_DX[dir],
            dy: DIR_DY[dir],
            source: 'conveyor',
            order: pendingMoves.length,
          });
        }
      }
    }

    pendingMoves.sort((a, b) => comparePendingMoves(a, b, this.state));

    for (const pending of pendingMoves) {
      const player = this.state.players[pending.index];
      if (!player || !player.alive || player.finished || player.lockedOnGoal || player.absorbTimer > 0 || player.deathTimer > 0) {
        continue;
      }

      const moved = stepPlayer(player, pending.dx, pending.dy, pending.index, this.state, this.level);
      if (!moved) {
        if (pending.source === 'slide') {
          player.sliding = false;
          player.slideDx = 0;
          player.slideDy = 0;
        }
        continue;
      }

      if (pending.source === 'input' || pending.source === 'swipe') {
        this.firstStep[pending.index] = false;
      }

      const newTile = this.level.grid[player.row]?.[player.col];
      if ((pending.source === 'input' || pending.source === 'swipe') && newTile === TileType.ICE) {
        player.sliding = true;
        player.slideDx = pending.dx;
        player.slideDy = pending.dy;
        this.stepTimers[pending.index] = 0;
      }
    }

    // Black hole absorption — start absorb animation when landing on black hole
    for (const player of this.state.players) {
      if (!player.alive || player.finished || player.deathTimer > 0) continue;
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

    for (const player of this.state.players) {
      if (player.deathTimer > 0) {
        player.deathTimer = Math.min(1, player.deathTimer + dt / 0.35);
      }
    }

    // Update tile-based effects
    updateReverseTiles(this.state, this.level);
    updateRotationTiles(this.state, this.level);
    updateRepaintStations(this.state, this.level);
    updateStickyPads(this.state, this.level, prevPositions);
    updateCrumbleTiles(this.state, this.level, prevPositions);
    checkCheckpoints(this.state, this.level);
    checkKillZones(this.state, this.level);
    const lifeLost = resolveDeaths(this.state);
    if (lifeLost) {
      this.callbacks.onLivesUpdate?.(this.state.livesRemaining, this.state.maxLives);
      if (this.state.gameOver) {
        this.callbacks.onGameOver?.();
      }
    }

    // Check life pickups
    const lifeCollected = checkLifePickups(this.state, this.level);
    if (lifeCollected) {
      this.callbacks.onLivesUpdate?.(this.state.livesRemaining, this.state.maxLives);
    }

    // Re-update pressure plates after movement
    updatePressurePlates(this.state, this.level);

    // Only check win after all player animations have finished
    const allAnimsDone = this.state.players.every(p => p.animProgress >= 1);
    if (allAnimsDone && !this.state.gameOver && checkWinCondition(this.state)) {
      this.state.levelComplete = true;
      this.state.completionTime = this.elapsed;
      this.callbacks.onLevelComplete?.(this.elapsed);
    }

    this.callbacks.onProgressUpdate?.(this.state.settledUnits);
  }
}
