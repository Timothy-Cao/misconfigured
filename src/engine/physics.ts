import { TileType, type TileTypeValue, type LevelData, type PlayerState, PLAYER_SIZE_RATIO } from './types';

export function getTileAt(level: LevelData, col: number, row: number): TileTypeValue {
  if (row < 0 || row >= level.height || col < 0 || col >= level.width) {
    return TileType.VOID;
  }
  return level.grid[row][col] as TileTypeValue;
}

export function isWalkable(tile: TileTypeValue): boolean {
  return tile !== TileType.VOID;
}

export function getTileAtPixel(level: LevelData, px: number, py: number, tileSize: number): TileTypeValue {
  const col = Math.floor(px / tileSize);
  const row = Math.floor(py / tileSize);
  return getTileAt(level, col, row);
}

function canOccupy(level: LevelData, cx: number, cy: number, halfSize: number, tileSize: number): boolean {
  const corners = [
    [cx - halfSize, cy - halfSize],
    [cx + halfSize - 0.01, cy - halfSize],
    [cx - halfSize, cy + halfSize - 0.01],
    [cx + halfSize - 0.01, cy + halfSize - 0.01],
  ];
  for (const [px, py] of corners) {
    if (!isWalkable(getTileAtPixel(level, px, py, tileSize))) {
      return false;
    }
  }
  return true;
}

export function movePlayer(
  player: PlayerState,
  dx: number,
  dy: number,
  speed: number,
  dt: number,
  level: LevelData,
  tileSize: number,
): PlayerState {
  if (!player.alive) return player;

  const halfSize = (tileSize * PLAYER_SIZE_RATIO) / 2;
  let { x, y } = player;

  if (dx !== 0) {
    const newX = x + dx * speed * dt;
    if (canOccupy(level, newX, y, halfSize, tileSize)) {
      x = newX;
    }
  }

  if (dy !== 0) {
    const newY = y + dy * speed * dt;
    if (canOccupy(level, x, newY, halfSize, tileSize)) {
      y = newY;
    }
  }

  return { ...player, x, y };
}

export function getPlayerTile(player: PlayerState, tileSize: number): { col: number; row: number } {
  return {
    col: Math.floor(player.x / tileSize),
    row: Math.floor(player.y / tileSize),
  };
}
