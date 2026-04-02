import { TileType, type TileTypeValue, type LevelData, type PlayerState, isDoor, doorNumber, isToggleBlock, toggleNumber, isOneWay, oneWayOrientation } from './types';

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
    if (!activePlates || !toggledSwitches) return false;
    const n = doorNumber(tile);
    return activePlates.has(n) || toggledSwitches.has(n);
  }
  if (isToggleBlock(tile)) {
    if (!activePlates || !toggledSwitches) return false;
    const n = toggleNumber(tile);
    return activePlates.has(n) || toggledSwitches.has(n);
  }
  if (tile === TileType.CRUMBLE && crumbledTiles && col !== undefined && row !== undefined) {
    return !crumbledTiles.has(`${row},${col}`);
  }
  return true;
}

/**
 * Check if a player can move to target tile (grid-based).
 * Returns true if the tile is walkable, not occupied by another player,
 * and directional-path axis rules are satisfied.
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

  const moveDx = targetCol - fromCol;
  const moveDy = targetRow - fromRow;

  // Directional path tiles only allow travel along their axis, both entering and exiting.
  const currentTile = getTileAt(level, fromCol, fromRow);
  if (isOneWay(currentTile)) {
    const orientation = oneWayOrientation(currentTile);
    const movingAlongCurrentAxis = orientation === 0 ? moveDx === 0 : moveDy === 0;
    if (!movingAlongCurrentAxis) {
      return false;
    }
  }

  if (isOneWay(tile)) {
    const orientation = oneWayOrientation(tile);
    const movingAlongTargetAxis = orientation === 0 ? moveDx === 0 : moveDy === 0;
    if (!movingAlongTargetAxis) {
      return false;
    }
  }

  // Check if another player occupies the target tile (finished/animating-out players don't block)
  for (let i = 0; i < allPlayers.length; i++) {
    if (i === selfIndex || !allPlayers[i].alive || allPlayers[i].finished || allPlayers[i].absorbTimer > 0 || allPlayers[i].deathTimer > 0) continue;
    // Locked-on-goal players block their tile
    if (allPlayers[i].col === targetCol && allPlayers[i].row === targetRow) {
      return false;
    }
  }

  return true;
}
