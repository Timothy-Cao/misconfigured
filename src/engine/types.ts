// Tile types used in level grid arrays
export const TileType = {
  VOID: 0,
  FLOOR: 1,
  KILL: 2,
  GOAL: 3,
  CHECKPOINT: 4,
  PUSHABLE: 5,
  ICE: 6,
  MUD: 7,
  CRUMBLE: 8,
  REVERSE: 9,
  // Pressure plates: 10-18 (plate number = tileValue - 9, i.e. 10=plate1, 18=plate9)
  // Doors: 20-28 (door number = tileValue - 19, i.e. 20=door1, 28=door9)
  // Conveyor belts: 30-33 (direction: 30=up, 31=right, 32=down, 33=left)
  // One-way tiles: 34-37 (enterable from: 34=up, 35=right, 36=down, 37=left)
  // Rotation tiles: 38=CW, 39=CCW
  // Teleporters A: 40-48, B: 50-58 (numbered 1-9, paired by number)
  // Toggle switches: 60-68, Toggle blocks: 70-78 (numbered 1-9)
  BLACKHOLE: 80,
} as const;

export type TileTypeValue = number;

// Pressure plate helpers
export function isPressurePlate(tile: number): boolean { return tile >= 10 && tile <= 18; }
export function pressurePlateNumber(tile: number): number { return tile - 9; }
export function pressurePlateTile(n: number): number { return n + 9; }

// Door helpers
export function isDoor(tile: number): boolean { return tile >= 20 && tile <= 28; }
export function doorNumber(tile: number): number { return tile - 19; }
export function doorTile(n: number): number { return n + 19; }

// Conveyor helpers (direction 0=up, 1=right, 2=down, 3=left)
export function isConveyor(tile: number): boolean { return tile >= 30 && tile <= 33; }
export function conveyorDirection(tile: number): number { return tile - 30; }
export function conveyorTile(dir: number): number { return dir + 30; }

// One-way helpers (enterable from direction 0=up, 1=right, 2=down, 3=left)
export function isOneWay(tile: number): boolean { return tile >= 34 && tile <= 37; }
export function oneWayDirection(tile: number): number { return tile - 34; }
export function oneWayTile(dir: number): number { return dir + 34; }

// Rotation tile helpers
export function isRotationTile(tile: number): boolean { return tile === 38 || tile === 39; }
export function rotationTileCW(tile: number): boolean { return tile === 38; }

// Teleporter helpers
export function isTeleporterA(tile: number): boolean { return tile >= 40 && tile <= 48; }
export function isTeleporterB(tile: number): boolean { return tile >= 50 && tile <= 58; }
export function isTeleporter(tile: number): boolean { return isTeleporterA(tile) || isTeleporterB(tile); }
export function teleporterNumber(tile: number): number { return isTeleporterA(tile) ? tile - 39 : tile - 49; }
export function teleporterATile(n: number): number { return n + 39; }
export function teleporterBTile(n: number): number { return n + 49; }

// Toggle helpers
export function isToggleSwitch(tile: number): boolean { return tile >= 60 && tile <= 68; }
export function isToggleBlock(tile: number): boolean { return tile >= 70 && tile <= 78; }
export function toggleNumber(tile: number): number { return isToggleSwitch(tile) ? tile - 59 : tile - 69; }
export function toggleSwitchTile(n: number): number { return n + 59; }
export function toggleBlockTile(n: number): number { return n + 69; }

// Direction vectors for conveyor/one-way (0=up, 1=right, 2=down, 3=left)
export const DIR_DX = [0, 1, 0, -1] as const;
export const DIR_DY = [-1, 0, 1, 0] as const;

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
  players: PlayerStart[];
}

export interface PlayerState {
  col: number; // grid column
  row: number; // grid row
  prevCol: number; // previous grid position (for animation)
  prevRow: number;
  animProgress: number; // 0..1 interpolation from prev to current position
  alive: boolean;
  checkpointCol: number; // respawn grid position
  checkpointRow: number;
  rotation: Rotation;
  color: string;
  reversed: boolean; // true when standing on a reverse tile
  sliding: boolean;  // true when sliding on ice
  slideDx: number;   // ice slide direction
  slideDy: number;
  finished: boolean; // true when absorbed by black hole goal
  lockedOnGoal: boolean; // true when locked onto a regular goal
  absorbTimer: number; // 0..1 animation progress for black hole absorption
}

export interface PushableBlock {
  col: number;
  row: number;
  underTile: number; // tile underneath the block (revealed when block moves)
}

export interface GameState {
  players: PlayerState[];
  levelComplete: boolean;
  tileSize: number;
  time: number;
  playersOnGoals: number;
  totalGoals: number;
  completionTime: number;
  occupiedGoals: Set<string>;
  pushableBlocks: PushableBlock[];
  /** Set of plate numbers (1-9) that currently have a player on them */
  activePlates: Set<number>;
  /** Set of "row,col" positions for crumbled tiles */
  crumbledTiles: Set<string>;
  /** Set of toggle numbers (1-9) that are currently toggled on */
  toggledSwitches: Set<number>;
  /** Map of player index -> teleport charge time (seconds on teleporter) */
  teleportCharges: Map<number, number>;
}

// Input direction after rotation is applied
export interface MoveVector {
  dx: number;
  dy: number;
}

// Colors
export const COLORS = {
  void: '#000000',
  floor: '#e8c9a0',
  kill: '#ff3333',
  goal: '#4ade80',
  checkpoint: '#facc15',
  players: ['#ff9a56', '#4ecdc4', '#3b82f6', '#a855f7'] as const,
  gridLine: 'rgba(0,0,0,0.08)',
} as const;

// Fixed direction per player index (color = direction identity)
// Orange=Up, Cyan=Right, Blue=Down, Purple=Left
export const PLAYER_DIRECTIONS: readonly Rotation[] = [0, 1, 2, 3] as const;

// Gameplay constants
export const PLAYER_SIZE_RATIO = 0.85;
export const STEP_INTERVAL = 0.12; // seconds between grid steps when holding a key
export const ANIM_DURATION = 0.1; // seconds for move animation
export const TELEPORT_CHARGE_TIME = 1.0; // seconds to charge teleport
