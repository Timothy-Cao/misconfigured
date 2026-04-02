import { TileType, type TileTypeValue, type LevelData, type PlayerState, isDoor, doorNumber, isToggleBlock, toggleNumber, isOneWay, oneWayDirection, DIR_DX, DIR_DY } from './types';

export function getTileAt(level: LevelData, col: number, row: number): TileTypeValue {
  if (row < 0 || row >= level.height || col < 0 || col >= level.width) {
    return TileType.VOID;
  }
  return level.grid[row][col] as TileTypeValue;
}

export function isWalkable(tile: TileTypeValue, activePlates?: Set<number>, toggledSwitches?: Set<number>, crumbledTiles?: Set<string>, col?: number, row?: number): boolean {
  if (tile === TileType.VOID) return false;
  if (tile === TileType.PUSHABLE) return false;
  if (isDoor(tile)) {
    if (!activePlates) return false;
    return activePlates.has(doorNumber(tile));
  }
  if (isToggleBlock(tile)) {
    if (!toggledSwitches) return false;
    return toggledSwitches.has(toggleNumber(tile));
  }
  if (tile === TileType.CRUMBLE && crumbledTiles && col !== undefined && row !== undefined) {
    return !crumbledTiles.has(`${row},${col}`);
  }
  return true;
}

/**
 * Check if a player can move to target tile (grid-based).
 * Returns true if the tile is walkable, not occupied by another player,
 * and one-way entry rules are satisfied.
 */
export function canMoveTo(
  level: LevelData,
  targetCol: number,
  targetRow: number,
  fromCol: number,
  fromRow: number,
  selfIndex: number,
  allPlayers: PlayerState[],
  activePlates?: Set<number>,
  toggledSwitches?: Set<number>,
  crumbledTiles?: Set<string>,
): boolean {
  const tile = getTileAt(level, targetCol, targetRow);

  // Basic walkability
  if (!isWalkable(tile, activePlates, toggledSwitches, crumbledTiles, targetCol, targetRow)) {
    return false;
  }

  // One-way entry check
  if (isOneWay(tile)) {
    const dir = oneWayDirection(tile);
    const allowedDx = DIR_DX[dir];
    const allowedDy = DIR_DY[dir];
    const moveDx = targetCol - fromCol;
    const moveDy = targetRow - fromRow;
    // Player must be coming FROM the allowed direction
    // dir=0 (from up): player moves down (dy=1), so allowedDy=-1, moveDy must be 1 (opposite)
    if (moveDx !== -allowedDx || moveDy !== -allowedDy) {
      return false;
    }
  }

  // Check if another player occupies the target tile (finished/absorbing players don't block)
  for (let i = 0; i < allPlayers.length; i++) {
    if (i === selfIndex || !allPlayers[i].alive || allPlayers[i].finished || allPlayers[i].absorbTimer > 0) continue;
    // Locked-on-goal players block their tile
    if (allPlayers[i].col === targetCol && allPlayers[i].row === targetRow) {
      return false;
    }
  }

  return true;
}
