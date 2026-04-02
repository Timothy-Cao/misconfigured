// Tile types used in level grid arrays
export const TileType = {
  VOID: 0,
  FLOOR: 1,
  KILL: 2,
  GOAL: 3,
  CHECKPOINT: 4,
} as const;

export type TileTypeValue = (typeof TileType)[keyof typeof TileType];

// Rotation: 0=normal, 1=90°CW, 2=180°, 3=270°CW
export type Rotation = 0 | 1 | 2 | 3;

export interface PlayerStart {
  startX: number; // grid column
  startY: number; // grid row
  rotation: Rotation;
}

export interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  grid: number[][]; // TileTypeValue[][]
  players: [PlayerStart, PlayerStart, PlayerStart, PlayerStart];
}

export interface PlayerState {
  x: number; // pixel position (center)
  y: number;
  alive: boolean;
  checkpointX: number; // respawn position (pixels)
  checkpointY: number;
  rotation: Rotation;
  color: string;
}

export interface GameState {
  players: [PlayerState, PlayerState, PlayerState, PlayerState];
  levelComplete: boolean;
  tileSize: number;
}

// Input direction after rotation is applied
export interface MoveVector {
  dx: number; // -1, 0, or 1
  dy: number; // -1, 0, or 1
}

// Colors from the spec
export const COLORS = {
  void: '#000000',
  floor: '#e8c9a0',
  kill: '#ff3333',
  goal: '#4ade80',
  checkpoint: '#facc15',
  players: ['#e94560', '#4ecdc4', '#ffe66d', '#a855f7'] as const,
  gridLine: 'rgba(0,0,0,0.08)',
} as const;

// Gameplay constants
export const PLAYER_SIZE_RATIO = 0.7; // fraction of tile size
export const PLAYER_SPEED = 200; // pixels per second
