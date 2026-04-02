import { TileType, COLORS, PLAYER_SIZE_RATIO, type LevelData, type PlayerState, type GameState } from './types';

const ARROW_ANGLES: Record<number, number> = {
  0: -Math.PI / 2,  // up
  1: 0,              // right
  2: Math.PI / 2,    // down
  3: Math.PI,        // left
};

export function render(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  state: GameState,
): void {
  const { tileSize } = state;
  const width = level.width * tileSize;
  const height = level.height * tileSize;

  // Clear
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, width, height);

  // Draw tiles
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      const tile = level.grid[row][col];
      let color: string | null = null;

      switch (tile) {
        case TileType.FLOOR: color = COLORS.floor; break;
        case TileType.KILL: color = COLORS.kill; break;
        case TileType.GOAL: color = COLORS.goal; break;
        case TileType.CHECKPOINT: color = COLORS.checkpoint; break;
        default: continue; // void — already black
      }

      ctx.fillStyle = color;
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

      // Grid lines on walkable tiles
      ctx.strokeStyle = COLORS.gridLine;
      ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }
  }

  // Draw players
  const size = tileSize * PLAYER_SIZE_RATIO;
  for (const player of state.players) {
    if (!player.alive) continue;

    // Square
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - size / 2, player.y - size / 2, size, size);

    // Directional arrow
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(ARROW_ANGLES[player.rotation]);
    const arrowSize = size * 0.3;
    ctx.beginPath();
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize * 0.5, -arrowSize * 0.6);
    ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    ctx.restore();
  }
}
