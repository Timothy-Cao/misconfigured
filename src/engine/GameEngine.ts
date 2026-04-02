import { type LevelData, type GameState, type PlayerState, COLORS, PLAYER_SPEED, TileType } from './types';
import { InputManager, remapInput } from './input';
import { movePlayer, getPlayerTile } from './physics';
import { render } from './renderer';

export function createInitialState(level: LevelData, tileSize: number): GameState {
  const players = level.players.map((p, i) => ({
    x: (p.startX + 0.5) * tileSize,
    y: (p.startY + 0.5) * tileSize,
    alive: true,
    checkpointX: (p.startX + 0.5) * tileSize,
    checkpointY: (p.startY + 0.5) * tileSize,
    rotation: p.rotation,
    color: COLORS.players[i],
  })) as [PlayerState, PlayerState, PlayerState, PlayerState];

  return { players, levelComplete: false, tileSize };
}

export function checkKillZones(state: GameState, level: LevelData, tileSize: number): void {
  for (const player of state.players) {
    if (!player.alive) continue;
    const { col, row } = getPlayerTile(player, tileSize);
    if (level.grid[row]?.[col] === TileType.KILL) {
      // Respawn at checkpoint
      player.x = player.checkpointX;
      player.y = player.checkpointY;
    }
  }
}

export function checkCheckpoints(state: GameState, level: LevelData, tileSize: number): void {
  for (const player of state.players) {
    if (!player.alive) continue;
    const { col, row } = getPlayerTile(player, tileSize);
    if (level.grid[row]?.[col] === TileType.CHECKPOINT) {
      player.checkpointX = player.x;
      player.checkpointY = player.y;
    }
  }
}

export function checkWinCondition(state: GameState, level: LevelData, tileSize: number): boolean {
  // Find all goal tiles
  const goals: { col: number; row: number }[] = [];
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      if (level.grid[row][col] === TileType.GOAL) {
        goals.push({ col, row });
      }
    }
  }

  if (goals.length === 0) return false;

  // Each goal must have at least one alive player on it
  for (const goal of goals) {
    const covered = state.players.some(p => {
      if (!p.alive) return false;
      const pt = getPlayerTile(p, tileSize);
      return pt.col === goal.col && pt.row === goal.row;
    });
    if (!covered) return false;
  }

  return true;
}

export interface GameEngineCallbacks {
  onLevelComplete?: () => void;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private level: LevelData;
  private state: GameState;
  private input: InputManager;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private callbacks: GameEngineCallbacks;

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelData,
    tileSize: number,
    callbacks: GameEngineCallbacks = {},
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.level = level;
    this.state = createInitialState(level, tileSize);
    this.input = new InputManager();
    this.callbacks = callbacks;

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
    this.state = createInitialState(this.level, this.state.tileSize);
  }

  private loop = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = now;

    if (!this.state.levelComplete) {
      this.update(dt);
    }

    render(this.ctx, this.level, this.state);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const keys = this.input.getKeys();
    const { tileSize } = this.state;

    // Move each player
    for (let i = 0; i < 4; i++) {
      const move = remapInput(keys, this.state.players[i].rotation);
      this.state.players[i] = movePlayer(
        this.state.players[i],
        move.dx, move.dy,
        PLAYER_SPEED, dt,
        this.level, tileSize,
      );
    }

    // Check checkpoints before kill zones (so touching both saves then kills)
    checkCheckpoints(this.state, this.level, tileSize);
    checkKillZones(this.state, this.level, tileSize);

    // Check win
    if (checkWinCondition(this.state, this.level, tileSize)) {
      this.state.levelComplete = true;
      this.callbacks.onLevelComplete?.();
    }
  }
}
