import { type LevelData, type GameState, type PlayerState, type PushableBlock, COLORS, TileType, STEP_INTERVAL, ANIM_DURATION, INPUT_COOLDOWN, INPUT_BUFFER_WINDOW, isPressurePlate, pressurePlateNumber, isToggleSwitch, toggleNumber, isConveyor, conveyorDirection, isRotationTile, rotationTileCW, isRepaintStation, repaintRotation, isColorFilter, isControlledWall, isControlledWallOpen, DIR_DX, DIR_DY, type Rotation } from './types';

import { InputManager, remapInput, type BufferedAction, type ReplayAction } from './input';
import { getTileAt, isWalkable, canMoveTo } from './physics';
import { render } from './renderer';
import { playSfx } from './sfx';

function cloneLevelData(level: LevelData): LevelData {
  return {
    ...level,
    grid: level.grid.map(row => [...row]),
    players: level.players.map(player => ({ ...player })),
  };
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
    movesUsed: 0,
    maxMoves: level.maxMoves && level.maxMoves > 0 ? level.maxMoves : null,
    outOfMoves: false,
    gameOverReason: null,
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
      state.gameOverReason = 'lives';
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
function updateToggleSwitches(state: GameState, level: LevelData): boolean {
  let toggled = false;
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
        toggled = true;
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

  return toggled;
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

function countOpenDoors(level: LevelData, activePlates: Set<number>, toggledSwitches: Set<number>): number {
  let count = 0;
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      const tile = level.grid[row][col];
      if (!isControlledWall(tile)) continue;
      if (isControlledWallOpen(tile, activePlates, toggledSwitches)) {
        count += 1;
      }
    }
  }
  return count;
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
  onPush?: () => void,
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
    const pushed = tryPushBlock(level, state, targetCol, targetRow, dx, dy);
    if (pushed) onPush?.();
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
  onGameOver?: (reason: 'lives' | 'moves') => void;
  onLivesUpdate?: (lives: number, maxLives: number) => void;
  onMovesUpdate?: (movesUsed: number, maxMoves: number | null) => void;
  onCountedMove?: (move: BufferedAction) => void;
  onPassiveReplayStep?: () => void;
}

interface GameEngineOptions {
  speedMultiplier?: number;
  replayScript?: string | null;
}

interface PendingMove {
  index: number;
  dx: number;
  dy: number;
  source: 'input' | 'swipe' | 'slide' | 'conveyor';
  order: number;
}

type QueuedManualInputBase =
  | { kind: 'key'; key: BufferedAction }
  | { kind: 'swipe'; dx: number; dy: number };

type QueuedManualInput = QueuedManualInputBase & { expiresAt: number };

function manualInputToBufferedAction(input: QueuedManualInputBase): BufferedAction {
  if (input.kind === 'key') return input.key;
  if (Math.abs(input.dx) > Math.abs(input.dy)) return input.dx > 0 ? 'D' : 'A';
  return input.dy > 0 ? 'S' : 'W';
}

function parseReplayScript(script: string | null | undefined): ReplayAction[] {
  if (!script) return [];
  return script
    .toUpperCase()
    .split('')
    .filter((action): action is ReplayAction => (
      action === 'W' ||
      action === 'A' ||
      action === 'S' ||
      action === 'D' ||
      action === '.'
    ));
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
  /** Manual input cooldown so movement stays deliberate instead of spammy */
  private inputCooldownRemaining: number = 0;
  /** A single follow-up manual input can be buffered once the board is settled */
  private queuedManualInput: QueuedManualInput | null = null;
  /** Conveyor ticks start after the first counted move and repeat every cooldown interval */
  private conveyorTicksArmed: boolean = false;
  private conveyorTickRemaining: number = INPUT_COOLDOWN;
  /** After running out of moves, only fail once the board has remained unchanged for a full beat */
  private outOfMovesStillnessTime: number = 0;
  private outOfMovesSnapshot: string | null = null;
  private speedMultiplier: number;
  private replayActions: ReplayAction[];
  private replayIndex: number = 0;
  private replayWaitingForConveyorTick: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelData,
    tileSize: number,
    callbacks: GameEngineCallbacks = {},
    options: GameEngineOptions = {},
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.level = cloneLevelData(level);
    this.originalGrid = this.level.grid.map(r => [...r]);
    this.state = createInitialState(this.level, tileSize);
    this.input = new InputManager();
    this.callbacks = callbacks;
    this.stepTimers = Array(this.level.players.length).fill(0);
    this.speedMultiplier = Math.max(0.25, options.speedMultiplier ?? 1);
    this.replayActions = parseReplayScript(options.replayScript);

    canvas.width = this.level.width * tileSize;
    canvas.height = this.level.height * tileSize;
  }

  private isReplayMode(): boolean {
    return this.replayActions.length > 0;
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.25, multiplier);
  }

  start(): void {
    if (!this.isReplayMode()) {
      this.input.attach();
    }
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
    this.inputCooldownRemaining = 0;
    this.queuedManualInput = null;
    this.conveyorTicksArmed = false;
    this.conveyorTickRemaining = INPUT_COOLDOWN;
    this.outOfMovesStillnessTime = 0;
    this.outOfMovesSnapshot = null;
    this.replayIndex = 0;
    this.replayWaitingForConveyorTick = false;
    this.input.reset();
    toggleCooldown.clear();
    rotationCooldown.clear();
  }

  queueSwipe(dx: number, dy: number): void {
    if (this.isReplayMode()) return;
    if (dx === 0 && dy === 0) return;
    this.enqueueManualInput({ kind: 'swipe', dx, dy });
  }

  private queueNextReplayActionIfReady(boardSettledForManualInput: boolean): void {
    if (
      !this.isReplayMode() ||
      this.replayWaitingForConveyorTick ||
      this.replayIndex >= this.replayActions.length ||
      this.queuedManualInput ||
      this.state.outOfMoves ||
      !boardSettledForManualInput ||
      this.inputCooldownRemaining > 0
    ) {
      return;
    }

    const action = this.replayActions[this.replayIndex];
    this.replayIndex += 1;

    if (action === '.') {
      if (this.conveyorTicksArmed) {
        this.replayWaitingForConveyorTick = true;
      }
      return;
    }

    this.queuedManualInput = {
      kind: 'key',
      key: action,
      expiresAt: this.elapsed + INPUT_BUFFER_WINDOW,
    };
  }

  private getBoardSettleRemaining(): number {
    let remaining = 0;

    for (const player of this.state.players) {
      if (!player.alive || player.finished || player.lockedOnGoal) continue;
      if (player.sliding || player.absorbTimer > 0 || player.deathTimer > 0) {
        return Number.POSITIVE_INFINITY;
      }
      if (player.animProgress < 1) {
        remaining = Math.max(remaining, (1 - player.animProgress) * ANIM_DURATION);
      }
    }

    return remaining;
  }

  private getManualInputReadyIn(): number {
    return Math.max(this.inputCooldownRemaining, this.getBoardSettleRemaining());
  }

  private enqueueManualInput(input: QueuedManualInputBase): void {
    if (this.state.outOfMoves) {
      return;
    }

    if (this.getManualInputReadyIn() > INPUT_BUFFER_WINDOW) {
      return;
    }

    this.queuedManualInput = {
      ...input,
      expiresAt: this.elapsed + INPUT_BUFFER_WINDOW,
    };
  }

  private isBoardSettledForManualInput(): boolean {
    return this.state.players.every((player) => (
      (player.finished || player.lockedOnGoal || (
      player.animProgress >= 1 &&
      !player.sliding &&
      player.absorbTimer === 0 &&
      player.deathTimer === 0
      ))
    ));
  }

  private loop = (now: number): void => {
    const realDt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const dt = realDt * this.speedMultiplier;
    this.elapsed += dt;
    this.state.time = this.elapsed;

    if (!this.state.levelComplete && !this.state.gameOver) {
      this.update(dt);
    }

    render(this.ctx, this.level, this.state);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private getMoveTrackingSnapshot(): string {
    const players = this.state.players.map(player => [
      player.col,
      player.row,
      player.rotation,
      player.alive ? 1 : 0,
      player.reversed ? 1 : 0,
      player.sliding ? 1 : 0,
      player.slideDx,
      player.slideDy,
      player.finished ? 1 : 0,
      player.lockedOnGoal ? 1 : 0,
      player.absorbTimer > 0 ? 1 : 0,
      player.deathTimer > 0 ? 1 : 0,
      player.stickyCharges,
      player.checkpointCol,
      player.checkpointRow,
    ]);
    const blocks = this.state.pushableBlocks.map(block => [block.col, block.row, block.underTile]);
    return JSON.stringify({
      players,
      blocks,
      activePlates: Array.from(this.state.activePlates).sort((a, b) => a - b),
      crumbledTiles: Array.from(this.state.crumbledTiles).sort(),
      toggledSwitches: Array.from(this.state.toggledSwitches).sort((a, b) => a - b),
      livesRemaining: this.state.livesRemaining,
      maxLives: this.state.maxLives,
      collectedLifeTiles: Array.from(this.state.collectedLifeTiles).sort(),
    });
  }

  private update(dt: number): void {
    this.inputCooldownRemaining = Math.max(0, this.inputCooldownRemaining - dt);
    if (this.conveyorTicksArmed) {
      this.conveyorTickRemaining = Math.max(0, this.conveyorTickRemaining - dt);
    }

    // Update pressure plates and toggles BEFORE movement
    const prevActivePlates = new Set(this.state.activePlates);
    const prevToggles = new Set(this.state.toggledSwitches);
    const prevOpenDoors = countOpenDoors(this.level, prevActivePlates, prevToggles);
    const prevReversed = this.state.players.map(p => p.reversed);
    const prevRotations = this.state.players.map(p => p.rotation);
    const prevCheckpoint = this.state.players.map(p => ({ col: p.checkpointCol, row: p.checkpointRow }));
    const prevDeathTimers = this.state.players.map(p => p.deathTimer);
    const prevAbsorbTimers = this.state.players.map(p => p.absorbTimer);
    const prevLockedGoals = this.state.players.map(p => p.lockedOnGoal);

    updatePressurePlates(this.state, this.level);
    const toggledThisUpdate = updateToggleSwitches(this.state, this.level);

    // Advance animation progress for all players
    for (const player of this.state.players) {
      if (player.animProgress < 1) {
        player.animProgress = Math.min(1, player.animProgress + dt / ANIM_DURATION);
      }
    }

    const boardSettledForManualInput = this.isBoardSettledForManualInput();
    if (this.isReplayMode()) {
      this.queueNextReplayActionIfReady(boardSettledForManualInput);
    } else {
      let nextKey: BufferedAction | null;
      let latestKeyboardInput: BufferedAction | null = null;
      while ((nextKey = this.input.consumeAction()) !== null) {
        latestKeyboardInput = nextKey;
      }
      if (!latestKeyboardInput) {
        latestKeyboardInput = this.input.getHeldAction();
      }
      if (boardSettledForManualInput && latestKeyboardInput) {
        this.enqueueManualInput({ kind: 'key', key: latestKeyboardInput });
      }
    }
    if (this.queuedManualInput && this.queuedManualInput.expiresAt < this.elapsed) {
      this.queuedManualInput = null;
    }
    if (this.state.outOfMoves) {
      this.queuedManualInput = null;
    }

    const acceptedManualInput = !this.state.outOfMoves &&
      boardSettledForManualInput &&
      this.inputCooldownRemaining <= 0 &&
      this.queuedManualInput !== null &&
      this.queuedManualInput.expiresAt >= this.elapsed
      ? this.queuedManualInput
      : null;
    if (acceptedManualInput) {
      this.queuedManualInput = null;
      this.inputCooldownRemaining = INPUT_COOLDOWN;
    }

    const pendingMoves: PendingMove[] = [];
    const moveSnapshotBefore = acceptedManualInput ? this.getMoveTrackingSnapshot() : null;
    const movedThisUpdate = new Set<number>();
    let pushedThisUpdate = false;
    let movedByManual = false;
    let movedByConveyor = false;
    let movedBySlide = false;
    let iceStarted = false;
    let filterEntered = false;
    let stickyEntered = false;

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

      let move = { dx: 0, dy: 0 };
      if (acceptedManualInput?.kind === 'swipe') {
        move = remapInput(
          {
            w: acceptedManualInput.dy < 0,
            a: acceptedManualInput.dx < 0,
            s: acceptedManualInput.dy > 0,
            d: acceptedManualInput.dx > 0,
          },
          player.rotation,
        );
      } else if (acceptedManualInput?.kind === 'key') {
        move = remapInput(
          {
            w: acceptedManualInput.key === 'W',
            a: acceptedManualInput.key === 'A',
            s: acceptedManualInput.key === 'S',
            d: acceptedManualInput.key === 'D',
          },
          player.rotation,
        );
      }

      // Reverse controls if on reverse tile
      if (player.reversed) {
        move = { dx: -move.dx, dy: -move.dy };
      }

      const hasInput = move.dx !== 0 || move.dy !== 0;
      if (player.stickyCharges > 0 && hasInput) {
        player.stickyCharges--;
        this.stepTimers[i] = 0;
        continue;
      }

      if (hasInput) {
        const sdx = move.dx !== 0 ? (move.dx > 0 ? 1 : -1) : 0;
        let sdy = move.dy !== 0 ? (move.dy > 0 ? 1 : -1) : 0;
        if (sdx !== 0 && sdy !== 0) sdy = 0;

        pendingMoves.push({
          index: i,
          dx: sdx,
          dy: sdy,
          source: acceptedManualInput?.kind === 'swipe' ? 'swipe' : 'input',
          order: pendingMoves.length,
        });
      }
    }

    pendingMoves.sort((a, b) => comparePendingMoves(a, b, this.state));

    for (const pending of pendingMoves) {
      const player = this.state.players[pending.index];
      if (!player || !player.alive || player.finished || player.lockedOnGoal || player.absorbTimer > 0 || player.deathTimer > 0) {
        continue;
      }

      const moved = stepPlayer(
        player,
        pending.dx,
        pending.dy,
        pending.index,
        this.state,
        this.level,
        () => { pushedThisUpdate = true; },
      );
      if (!moved) {
        if (pending.source === 'slide') {
          player.sliding = false;
          player.slideDx = 0;
          player.slideDy = 0;
        }
        continue;
      }

      movedThisUpdate.add(pending.index);
      if (pending.source === 'input' || pending.source === 'swipe') movedByManual = true;
      if (pending.source === 'slide') movedBySlide = true;
      const newTile = this.level.grid[player.row]?.[player.col];
      if ((pending.source === 'input' || pending.source === 'swipe') && newTile === TileType.ICE) {
        player.sliding = true;
        player.slideDx = pending.dx;
        player.slideDy = pending.dy;
        this.stepTimers[pending.index] = 0;
        iceStarted = true;
      }
      if (newTile === TileType.STICKY) stickyEntered = true;
      if (newTile !== undefined && isColorFilter(newTile)) filterEntered = true;
    }

    const conveyorTickDue = this.conveyorTicksArmed && this.conveyorTickRemaining <= 0;
    if (conveyorTickDue) {
      const conveyorMoves: PendingMove[] = [];
      for (let i = 0; i < this.state.players.length; i++) {
        const player = this.state.players[i];
        if (
          movedThisUpdate.has(i) ||
          !player ||
          !player.alive ||
          player.finished ||
          player.lockedOnGoal ||
          player.absorbTimer > 0 ||
          player.deathTimer > 0 ||
          player.sliding ||
          player.animProgress < 1
        ) {
          continue;
        }

        const convTile = this.level.grid[player.row]?.[player.col];
        if (convTile !== undefined && isConveyor(convTile)) {
          const dir = conveyorDirection(convTile);
          conveyorMoves.push({
            index: i,
            dx: DIR_DX[dir],
            dy: DIR_DY[dir],
            source: 'conveyor',
            order: conveyorMoves.length,
          });
        }
      }

      conveyorMoves.sort((a, b) => comparePendingMoves(a, b, this.state));

      for (const pending of conveyorMoves) {
        const player = this.state.players[pending.index];
        if (!player || !player.alive || player.finished || player.lockedOnGoal || player.absorbTimer > 0 || player.deathTimer > 0) {
          continue;
        }

        const moved = stepPlayer(
          player,
          pending.dx,
          pending.dy,
          pending.index,
          this.state,
          this.level,
          () => { pushedThisUpdate = true; },
        );
        if (!moved) {
          continue;
        }

        movedByConveyor = true;
        const newTile = this.level.grid[player.row]?.[player.col];
        if (newTile === TileType.ICE) {
          player.sliding = true;
          player.slideDx = pending.dx;
          player.slideDy = pending.dy;
          this.stepTimers[pending.index] = 0;
          iceStarted = true;
        }
        if (newTile === TileType.STICKY) stickyEntered = true;
        if (newTile !== undefined && isColorFilter(newTile)) filterEntered = true;
      }

      if (this.replayWaitingForConveyorTick) {
        this.replayWaitingForConveyorTick = false;
      }
      if (!acceptedManualInput && movedByConveyor) {
        this.callbacks.onPassiveReplayStep?.();
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
    const prevCrumbleCount = this.state.crumbledTiles.size;
    updateCrumbleTiles(this.state, this.level, prevPositions);
    checkCheckpoints(this.state, this.level);
    checkKillZones(this.state, this.level);
    const lifeLost = resolveDeaths(this.state);
    if (lifeLost) {
      this.callbacks.onLivesUpdate?.(this.state.livesRemaining, this.state.maxLives);
      if (this.state.gameOver) {
        this.callbacks.onGameOver?.('lives');
      }
    }

    // Check life pickups
    const lifeCollected = checkLifePickups(this.state, this.level);
    if (lifeCollected) {
      this.callbacks.onLivesUpdate?.(this.state.livesRemaining, this.state.maxLives);
    }

    // Re-update pressure plates after movement
    updatePressurePlates(this.state, this.level);

    const postOpenDoors = countOpenDoors(this.level, this.state.activePlates, this.state.toggledSwitches);
    const plateChanged = prevActivePlates.size !== this.state.activePlates.size ||
      Array.from(this.state.activePlates).some(n => !prevActivePlates.has(n));
    const doorOpened = postOpenDoors > prevOpenDoors;
    const doorClosed = postOpenDoors < prevOpenDoors;
    const reverseTriggered = this.state.players.some((p, i) => !prevReversed[i] && p.reversed);
    const repaintTriggered = this.state.players.some((p, i) => {
      if (p.rotation === prevRotations[i]) return false;
      const tile = this.level.grid[p.row]?.[p.col];
      return tile !== undefined && isRepaintStation(tile);
    });
    const checkpointTriggered = this.state.players.some((p, i) => {
      const prev = prevCheckpoint[i];
      return (p.checkpointCol !== prev.col || p.checkpointRow !== prev.row);
    });
    const blackholeTriggered = this.state.players.some((p, i) => prevAbsorbTimers[i] === 0 && p.absorbTimer > 0);
    const goalTriggered = this.state.players.some((p, i) => !prevLockedGoals[i] && p.lockedOnGoal);
    const deathTriggered = this.state.players.some((p, i) => prevDeathTimers[i] === 0 && p.deathTimer > 0);
    const crumbleTriggered = this.state.crumbledTiles.size > prevCrumbleCount;
    const bumpTriggered = Boolean(acceptedManualInput && movedThisUpdate.size === 0);

    const manualMoveChangedState = acceptedManualInput && moveSnapshotBefore !== this.getMoveTrackingSnapshot();
    if (manualMoveChangedState) {
      this.state.movesUsed += 1;
      this.callbacks.onMovesUpdate?.(this.state.movesUsed, this.state.maxMoves);
      this.callbacks.onCountedMove?.(manualInputToBufferedAction(acceptedManualInput));
      this.conveyorTicksArmed = true;
      this.conveyorTickRemaining = INPUT_COOLDOWN;
      if (this.state.maxMoves !== null && this.state.movesUsed >= this.state.maxMoves) {
        this.state.outOfMoves = true;
      }
    } else if (this.conveyorTicksArmed && this.conveyorTickRemaining <= 0) {
      this.conveyorTickRemaining = INPUT_COOLDOWN;
    }

    // Only check win after all player animations have finished
    const allAnimsDone = this.state.players.every(p => p.animProgress >= 1);
    if (allAnimsDone && !this.state.gameOver && checkWinCondition(this.state)) {
      this.state.levelComplete = true;
      this.state.completionTime = this.elapsed;
      this.callbacks.onLevelComplete?.(this.elapsed);
    }

    if (
      this.state.outOfMoves &&
      !this.state.levelComplete &&
      !this.state.gameOver &&
      allAnimsDone
    ) {
      const currentSnapshot = this.getMoveTrackingSnapshot();
      if (currentSnapshot !== this.outOfMovesSnapshot) {
        this.outOfMovesSnapshot = currentSnapshot;
        this.outOfMovesStillnessTime = 0;
      } else {
        this.outOfMovesStillnessTime += dt;
      }
    } else {
      this.outOfMovesSnapshot = null;
      this.outOfMovesStillnessTime = 0;
    }

    if (
      allAnimsDone &&
      !this.state.levelComplete &&
      !this.state.gameOver &&
      this.state.outOfMoves &&
      this.outOfMovesStillnessTime >= INPUT_COOLDOWN
    ) {
      this.state.gameOver = true;
      this.state.gameOverReason = 'moves';
      this.callbacks.onGameOver?.('moves');
    }

    // Sound effects
    if (movedByManual) playSfx('move');
    if (bumpTriggered) playSfx('bump');
    if (pushedThisUpdate) playSfx('push');
    if (plateChanged) playSfx('plate');
    if (toggledThisUpdate) playSfx('switch');
    if (doorOpened) playSfx('doorOpen');
    if (doorClosed) playSfx('doorClose');
    if (iceStarted) playSfx('ice');
    if (movedByConveyor) playSfx('conveyor');
    if (movedBySlide) playSfx('ice');
    if (crumbleTriggered) playSfx('crumble');
    if (reverseTriggered) playSfx('reverse');
    if (repaintTriggered) playSfx('repaint');
    if (filterEntered) playSfx('filter');
    if (checkpointTriggered) playSfx('checkpoint');
    if (goalTriggered) playSfx('goal');
    if (blackholeTriggered) playSfx('blackhole');
    if (deathTriggered) playSfx('death');
    if (lifeCollected) playSfx('life');
    if (stickyEntered) playSfx('sticky');

    this.callbacks.onProgressUpdate?.(this.state.settledUnits);
  }
}
