import {
  TileType,
  type LevelData,
  pressurePlateTile,
  doorTile,
  toggleSwitchTile,
  conveyorTile,
  oneWayTile,
} from '@/engine/types';

const V = TileType.VOID;
const F = TileType.FLOOR;
const K = TileType.KILL;
const G = TileType.GOAL;
const C = TileType.CHECKPOINT;
const P = TileType.PUSHABLE;
const I = TileType.ICE;
const M = TileType.MUD;
const CR = TileType.CRUMBLE;
const R = TileType.REVERSE;
const BH = TileType.BLACKHOLE;

function makeGrid(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array(width).fill(V));
}

function setTile(grid: number[][], col: number, row: number, tile: number): void {
  grid[row][col] = tile;
}

function fillRect(grid: number[][], left: number, top: number, right: number, bottom: number, tile: number): void {
  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      grid[row][col] = tile;
    }
  }
}

const grid = makeGrid(14, 14);

fillRect(grid, 1, 1, 6, 3, F);
fillRect(grid, 7, 2, 10, 2, F);
fillRect(grid, 10, 3, 10, 4, F);
fillRect(grid, 7, 4, 9, 4, F);
fillRect(grid, 3, 5, 7, 5, F);
fillRect(grid, 3, 6, 4, 6, F);
fillRect(grid, 7, 6, 11, 6, F);
fillRect(grid, 4, 7, 11, 7, F);
fillRect(grid, 5, 8, 10, 8, K);

setTile(grid, 3, 2, P);
setTile(grid, 5, 2, pressurePlateTile(1));
setTile(grid, 6, 2, doorTile(1));

setTile(grid, 7, 2, C);
setTile(grid, 8, 2, toggleSwitchTile(1));
setTile(grid, 9, 2, doorTile(1));
setTile(grid, 10, 2, R);
setTile(grid, 10, 3, oneWayTile(0));
setTile(grid, 10, 4, 38);
setTile(grid, 9, 4, conveyorTile(3));
setTile(grid, 8, 4, conveyorTile(3));
setTile(grid, 7, 4, conveyorTile(2));

setTile(grid, 6, 5, I);
setTile(grid, 5, 5, I);
setTile(grid, 4, 5, I);
setTile(grid, 3, 6, M);
setTile(grid, 4, 6, 39);
setTile(grid, 4, 7, CR);
setTile(grid, 5, 7, C);
setTile(grid, 6, 7, P);
setTile(grid, 8, 7, pressurePlateTile(2));
setTile(grid, 8, 6, doorTile(2));
setTile(grid, 9, 7, K);
setTile(grid, 10, 7, K);
setTile(grid, 11, 7, BH);

setTile(grid, 12, 12, G);

const level: LevelData = {
  id: 1001,
  name: 'Clockwork Bastion',
  width: 14,
  height: 14,
  grid,
  players: [
    { startX: 2, startY: 2, rotation: 0 },
    { startX: 12, startY: 12, rotation: 1 },
  ],
};

export default level;
