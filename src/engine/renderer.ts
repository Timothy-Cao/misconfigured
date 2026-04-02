import { TileType, COLORS, PLAYER_SIZE_RATIO, type LevelData, type GameState, isPressurePlate, pressurePlateNumber, isDoor, doorNumber, isToggleSwitch, isToggleBlock, toggleNumber, isConveyor, conveyorDirection, isOneWay, oneWayDirection, isRotationTile, rotationTileCW, DIR_DX, DIR_DY } from './types';

const ARROW_ANGLES: Record<number, number> = {
  0: -Math.PI / 2,
  1: 0,
  2: Math.PI / 2,
  3: Math.PI,
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function getTileColor(tile: number, time: number, isOccupiedGoal: boolean, activePlates: Set<number>, toggledSwitches: Set<number>, isCrumbled: boolean): string | null {
  if (isPressurePlate(tile)) {
    const n = pressurePlateNumber(tile);
    const active = activePlates.has(n);
    if (active) {
      const pulse = 0.7 + 0.3 * Math.sin(time * 5);
      return `rgb(${Math.round(60 + 40 * pulse)}, ${Math.round(180 + 40 * pulse)}, ${Math.round(200 + 55 * pulse)})`;
    }
    return '#1a2a3a';
  }
  if (isDoor(tile)) {
    const n = doorNumber(tile);
    const open = activePlates.has(n) || toggledSwitches.has(n);
    if (open) return '#1a1a2e';
    return '#2a2040';
  }
  if (isToggleSwitch(tile)) {
    const n = toggleNumber(tile);
    const active = toggledSwitches.has(n);
    if (active) {
      const pulse = 0.7 + 0.3 * Math.sin(time * 4);
      return `rgb(${Math.round(220 + 35 * pulse)}, ${Math.round(140 + 40 * pulse)}, ${Math.round(60 + 30 * pulse)})`;
    }
    return '#2a2018';
  }
  if (isToggleBlock(tile)) {
    const n = toggleNumber(tile);
    const open = activePlates.has(n) || toggledSwitches.has(n);
    if (open) return '#1a1a2e';
    return '#2a2040';
  }
  if (tile === TileType.BLACKHOLE) {
    const pulse = 0.6 + 0.4 * Math.sin(time * 2);
    const g = Math.round(120 + 40 * pulse);
    return `rgb(20, ${g}, 50)`;
  }
  if (isConveyor(tile)) return '#1a1a2e';
  if (isOneWay(tile)) return '#1a1a2e';
  if (isRotationTile(tile)) return '#1e1a2e';

  switch (tile) {
    case TileType.FLOOR: return '#1a1a2e';
    case TileType.KILL: {
      const pulse = 0.7 + 0.3 * Math.sin(time * 3);
      const r = Math.round(180 * pulse);
      return `rgb(${r}, 30, 30)`;
    }
    case TileType.GOAL: {
      if (isOccupiedGoal) {
        const flash = 0.7 + 0.3 * Math.sin(time * 8);
        const g = Math.round(200 + 55 * flash);
        const b = Math.round(120 + 60 * flash);
        return `rgb(60, ${g}, ${b})`;
      }
      const pulse = 0.6 + 0.4 * Math.sin(time * 2);
      const g = Math.round(160 + 60 * pulse);
      return `rgb(40, ${g}, 80)`;
    }
    case TileType.CHECKPOINT: {
      const pulse = 0.7 + 0.3 * Math.sin(time * 2.5);
      const r = Math.round(200 + 55 * pulse);
      const g = Math.round(170 + 50 * pulse);
      return `rgb(${r}, ${g}, 40)`;
    }
    case TileType.PUSHABLE: return '#5a4a3a';
    case TileType.ICE: return '#1a2a3a';
    case TileType.MUD: return '#2a1a10';
    case TileType.CRUMBLE: return isCrumbled ? null : '#2a2020';
    case TileType.REVERSE: return '#2a1a2e';
    case TileType.LIFE_PICKUP: return '#1a1a2e';
    default: return null;
  }
}

function drawBrickPattern(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const rows = 3;
  const brickH = s / rows;
  const brickW = s / 2;
  ctx.strokeStyle = 'rgba(180,140,100,0.4)';
  ctx.lineWidth = 1;

  for (let r = 0; r < rows; r++) {
    const by = y + r * brickH;
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + s, by);
    ctx.stroke();
    const offset = r % 2 === 0 ? 0 : brickW / 2;
    for (let c = 0; c <= 2; c++) {
      const bx = x + offset + c * brickW;
      if (bx > x && bx < x + s) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + brickH);
        ctx.stroke();
      }
    }
  }
}

/** Draw a diagonal cross pattern for void tiles */
function drawVoidPattern(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  const step = s / 4;
  for (let i = 0; i <= 4; i++) {
    // Diagonal lines
    ctx.beginPath();
    ctx.moveTo(x + i * step, y);
    ctx.lineTo(x, y + i * step);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s - i * step, y + s);
    ctx.lineTo(x + s, y + s - i * step);
    ctx.stroke();
  }
}

/** Draw ice crystal pattern */
function drawIcePattern(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, time: number): void {
  const shimmer = 0.15 + 0.1 * Math.sin(time * 2);
  ctx.strokeStyle = `rgba(150,220,255,${shimmer})`;
  ctx.lineWidth = 1;
  const r = s * 0.3;
  // Draw a 6-pointed sparkle
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + time * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.stroke();
  }
}

export function render(
  ctx: CanvasRenderingContext2D,
  level: LevelData,
  state: GameState,
): void {
  const { tileSize, time, occupiedGoals, activePlates, crumbledTiles, toggledSwitches } = state;
  const width = level.width * tileSize;
  const height = level.height * tileSize;
  const gap = 2;
  const radius = 4;

  // Pre-compute fonts once per frame
  const skullFont = `${tileSize * 0.7}px sans-serif`;
  const iconFont = `${tileSize * 0.4}px sans-serif`;
  const plateFont = `bold ${tileSize * 0.45}px monospace`;
  const doorFont = `bold ${tileSize * 0.4}px monospace`;
  const smallFont = `${tileSize * 0.3}px sans-serif`;

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);

  // Draw void pattern on background for void tiles
  for (let row = 0; row < level.height; row++) {
    for (let col = 0; col < level.width; col++) {
      const tile = level.grid[row][col];
      const x = col * tileSize + gap;
      const y = row * tileSize + gap;
      const s = tileSize - gap * 2;

      if (tile === TileType.VOID) {
        // Dark void with crosshatch pattern
        roundRect(ctx, x, y, s, s, radius);
        ctx.fillStyle = '#050508';
        ctx.fill();
        drawVoidPattern(ctx, x, y, s);
        continue;
      }

      // Check if this is a crumbled tile
      const isCrumbled = tile === TileType.CRUMBLE && crumbledTiles.has(`${row},${col}`);
      if (isCrumbled) {
        // Draw as void with cracked appearance
        roundRect(ctx, x, y, s, s, radius);
        ctx.fillStyle = '#050508';
        ctx.fill();
        drawVoidPattern(ctx, x, y, s);
        // Add crack lines
        ctx.strokeStyle = 'rgba(160,80,60,0.15)';
        ctx.lineWidth = 1;
        const cx = x + s / 2;
        const cy = y + s / 2;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.3, cy - s * 0.2);
        ctx.lineTo(cx + s * 0.1, cy + s * 0.3);
        ctx.moveTo(cx + s * 0.2, cy - s * 0.3);
        ctx.lineTo(cx - s * 0.1, cy + s * 0.2);
        ctx.stroke();
        continue;
      }

      const isOccupiedGoal = tile === TileType.GOAL && occupiedGoals.has(`${row},${col}`);
      const color = getTileColor(tile, time, isOccupiedGoal, activePlates, toggledSwitches, isCrumbled);
      if (!color) continue;

      // Glow for special tiles
      if (tile === TileType.GOAL || tile === TileType.KILL || tile === TileType.BLACKHOLE || (isPressurePlate(tile) && activePlates.has(pressurePlateNumber(tile))) || tile === TileType.ICE) {
        ctx.save();
        if (isOccupiedGoal) {
          ctx.shadowColor = '#88ffcc';
          ctx.shadowBlur = 16 + 6 * Math.sin(time * 8);
        } else if (isPressurePlate(tile)) {
          ctx.shadowColor = '#55ccee';
          ctx.shadowBlur = 10 + 4 * Math.sin(time * 5);
        } else if (tile === TileType.ICE) {
          ctx.shadowColor = '#66ccff';
          ctx.shadowBlur = 4 + 2 * Math.sin(time * 2);
        } else if (tile === TileType.BLACKHOLE) {
          ctx.shadowColor = '#22cc66';
          ctx.shadowBlur = 12 + 6 * Math.sin(time * 2);
        } else {
          ctx.shadowColor = tile === TileType.GOAL ? '#4ade80' : '#ff3333';
          ctx.shadowBlur = 8 + 4 * Math.sin(time * 3);
        }
        roundRect(ctx, x, y, s, s, radius);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      } else {
        roundRect(ctx, x, y, s, s, radius);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Floor highlight
      if (tile === TileType.FLOOR) {
        roundRect(ctx, x, y, s, s, radius);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const cx = col * tileSize + tileSize / 2;
      const cy = row * tileSize + tileSize / 2;

      // Kill zone skull (large)
      if (tile === TileType.KILL) {
        const iconAlpha = 0.3 + 0.15 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(255,255,255,${iconAlpha})`;
        ctx.font = skullFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', cx, cy + 1);
      }

      // Goal star
      if (tile === TileType.GOAL) {
        const iconAlpha = isOccupiedGoal ? 0.6 + 0.3 * Math.sin(time * 8) : 0.3 + 0.15 * Math.sin(time * 2);
        ctx.fillStyle = `rgba(255,255,255,${iconAlpha})`;
        ctx.font = iconFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', cx, cy + 1);
      }

      // Black hole goal — spinning vortex
      if (tile === TileType.BLACKHOLE) {
        // Dark center circle
        const bhRadius = s * 0.22;
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        // Spinning ring
        ctx.beginPath();
        ctx.arc(cx, cy, bhRadius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100,255,150,${0.3 + 0.2 * Math.sin(time * 3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Spiral arms
        for (let k = 0; k < 3; k++) {
          const baseAngle = time * 2 + (k * Math.PI * 2) / 3;
          ctx.beginPath();
          for (let t2 = 0; t2 < 1; t2 += 0.05) {
            const r = bhRadius + t2 * s * 0.2;
            const a = baseAngle + t2 * 2;
            const sx = cx + Math.cos(a) * r;
            const sy = cy + Math.sin(a) * r;
            if (t2 === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.strokeStyle = `rgba(100,255,150,${0.15 * (1 - 0)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Pushable block — brick pattern
      if (tile === TileType.PUSHABLE) {
        drawBrickPattern(ctx, x, y, s);
      }

      // Ice — crystal sparkle
      if (tile === TileType.ICE) {
        drawIcePattern(ctx, cx, cy, s, time);
      }

      // Mud — wavy lines
      if (tile === TileType.MUD) {
        ctx.strokeStyle = 'rgba(120,80,40,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const ly = y + s * 0.25 + i * s * 0.25;
          ctx.beginPath();
          for (let px = 0; px <= s; px += 2) {
            const wy = ly + Math.sin((px + time * 20) * 0.15) * 2;
            if (px === 0) ctx.moveTo(x + px, wy);
            else ctx.lineTo(x + px, wy);
          }
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = smallFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('~', cx, cy);
      }

      // Crumble — cracked lines (before it crumbles)
      if (tile === TileType.CRUMBLE && !isCrumbled) {
        ctx.strokeStyle = 'rgba(255,200,150,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + s * 0.2, y + s * 0.3);
        ctx.lineTo(cx, cy);
        ctx.lineTo(x + s * 0.8, y + s * 0.2);
        ctx.moveTo(cx, cy);
        ctx.lineTo(x + s * 0.3, y + s * 0.8);
        ctx.moveTo(cx, cy);
        ctx.lineTo(x + s * 0.75, y + s * 0.7);
        ctx.stroke();
        // Dot in center
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,200,150,0.25)';
        ctx.fill();
      }

      // Reverse — swirl arrows
      if (tile === TileType.REVERSE) {
        const pulse = 0.2 + 0.1 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(200,100,255,${pulse})`;
        ctx.font = iconFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⟲', cx, cy + 1);
      }

      // Pressure plate — number
      if (isPressurePlate(tile)) {
        const n = pressurePlateNumber(tile);
        const active = activePlates.has(n);
        ctx.fillStyle = active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)';
        ctx.font = plateFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), cx, cy + 1);

        ctx.fillStyle = active ? 'rgba(100,220,255,0.6)' : 'rgba(100,150,200,0.2)';
        roundRect(ctx, x + s * 0.15, y + s - 4, s * 0.7, 3, 1);
        ctx.fill();
      }

      // Door — number and dotted outline when closed
      if (isDoor(tile)) {
        const n = doorNumber(tile);
        const open = activePlates.has(n) || toggledSwitches.has(n);

        if (!open) {
          ctx.save();
          ctx.strokeStyle = 'rgba(160,120,220,0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          roundRect(ctx, x + 1, y + 1, s - 2, s - 2, radius - 1);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        ctx.fillStyle = open ? 'rgba(255,255,255,0.15)' : 'rgba(160,120,220,0.5)';
        ctx.font = doorFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), cx, cy + 1);
      }

      // Toggle switch — number with circle indicator
      if (isToggleSwitch(tile)) {
        const n = toggleNumber(tile);
        const active = toggledSwitches.has(n);
        ctx.fillStyle = active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)';
        ctx.font = plateFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), cx, cy + 1);

        // Circle around number
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = active ? 'rgba(255,180,60,0.6)' : 'rgba(255,180,60,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Toggle block — number and X pattern when solid
      if (isToggleBlock(tile)) {
        const n = toggleNumber(tile);
        const open = activePlates.has(n) || toggledSwitches.has(n);

        if (!open) {
          // Legacy toggle-block tiles render like closed doors
          ctx.strokeStyle = 'rgba(160,120,220,0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + s - 4, y + s - 4);
          ctx.moveTo(x + s - 4, y + 4);
          ctx.lineTo(x + 4, y + s - 4);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = open ? 'rgba(255,255,255,0.15)' : 'rgba(160,120,220,0.5)';
        ctx.font = doorFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), cx, cy + 1);
      }

      // Conveyor belt — animated directional arrows
      if (isConveyor(tile)) {
        const dir = conveyorDirection(tile);
        const dx = DIR_DX[dir];
        const dy = DIR_DY[dir];
        ctx.strokeStyle = 'rgba(100,200,255,0.35)';
        ctx.lineWidth = 2;
        const flow = (time * 1.8) % 1;
        const spacing = s * 0.28;
        const travel = s * 0.56;
        const arrowLen = s * 0.13;
        // Draw a denser wrapped chevron stream so the belt motion loops cleanly.
        for (let k = -2; k <= 2; k++) {
          const offset = (k + flow) * spacing;
          if (offset < -travel || offset > travel) continue;
          const ax = cx + dx * offset;
          const ay = cy + dy * offset;
          ctx.beginPath();
          ctx.moveTo(ax - dy * arrowLen - dx * arrowLen, ay + dx * arrowLen - dy * arrowLen);
          ctx.lineTo(ax + dx * arrowLen * 0.5, ay + dy * arrowLen * 0.5);
          ctx.lineTo(ax + dy * arrowLen - dx * arrowLen, ay - dx * arrowLen - dy * arrowLen);
          ctx.stroke();
        }
      }
      if (isOneWay(tile)) {
        const dir = oneWayDirection(tile);
        const dx = DIR_DX[dir];
        const dy = DIR_DY[dir];
        // Arrow shows which direction you can enter FROM
        const arrowLen = s * 0.25;
        // Draw arrow pointing INTO the tile (from the entry direction)
        const startX = cx - dx * s * 0.35;
        const startY = cy - dy * s * 0.35;
        const endX = cx + dx * s * 0.15;
        const endY = cy + dy * s * 0.15;
        ctx.strokeStyle = 'rgba(255,220,100,0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - dx * arrowLen + dy * arrowLen * 0.5, endY - dy * arrowLen - dx * arrowLen * 0.5);
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - dx * arrowLen - dy * arrowLen * 0.5, endY - dy * arrowLen + dx * arrowLen * 0.5);
        ctx.stroke();
        // Border line on the opposite side (blocked entry)
        const blockX = cx + dx * s * 0.45;
        const blockY = cy + dy * s * 0.45;
        ctx.strokeStyle = 'rgba(255,100,100,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(blockX - dy * s * 0.4, blockY + dx * s * 0.4);
        ctx.lineTo(blockX + dy * s * 0.4, blockY - dx * s * 0.4);
        ctx.stroke();
      }

      // Rotation tile — CW or CCW indicator
      if (isRotationTile(tile)) {
        const cw = rotationTileCW(tile);
        const pulse = 0.25 + 0.1 * Math.sin(time * 3);
        ctx.fillStyle = `rgba(180,120,255,${pulse})`;
        ctx.font = `bold ${Math.max(16, s * 0.52)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cw ? '\u21BB' : '\u21BA', cx, cy + 1);
      }

      // Life pickup heart
      if (tile === TileType.LIFE_PICKUP) {
        const pulse = 0.7 + 0.3 * Math.sin(time * 3);
        const heartScale = 0.9 + 0.1 * Math.sin(time * 3);
        ctx.save();
        ctx.translate(cx, cy + 1);
        ctx.scale(heartScale, heartScale);
        ctx.fillStyle = `rgba(255, 80, 100, ${pulse})`;
        ctx.font = `${Math.max(14, s * 0.5)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2764', 0, 0);
        ctx.restore();
        // Subtle glow
        const glowAlpha = 0.08 + 0.06 * Math.sin(time * 3);
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 80, 100, ${glowAlpha})`;
        ctx.fill();
      }

      // Checkpoint sparkle dots
      if (tile === TileType.CHECKPOINT) {
        for (let k = 0; k < 3; k++) {
          const angle = time * 1.5 + (k * Math.PI * 2) / 3;
          const dist = tileSize * 0.2;
          const sx = cx + Math.cos(angle) * dist;
          const sy = cy + Math.sin(angle) * dist;
          const alpha = 0.4 + 0.4 * Math.sin(time * 4 + k);
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 230, 100, ${alpha})`;
          ctx.fill();
        }
      }
    }
  }

  // Draw players with animation interpolation
  const size = tileSize * PLAYER_SIZE_RATIO;
  const playerRadius = 6;

  for (const player of state.players) {
    if (!player.alive || player.finished) continue;

    // Interpolate between previous and current grid position
    const t = player.animProgress;
    const interpCol = player.prevCol + (player.col - player.prevCol) * t;
    const interpRow = player.prevRow + (player.row - player.prevRow) * t;
    const centerX = (interpCol + 0.5) * tileSize;
    const centerY = (interpRow + 0.5) * tileSize;

    // Player color matches their current rotation direction
    const directionColor = COLORS.players[player.rotation];

    // Black hole absorption animation — shrink + spin
    if (player.absorbTimer > 0) {
      const at = player.absorbTimer;
      const scale = 1 - at * 0.9; // shrink to 10%
      const spin = at * Math.PI * 4; // spin 2 full rotations
      const alpha = 1 - at * 0.8;
      const s = size * scale;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(centerX, centerY);
      ctx.rotate(spin);

      ctx.shadowColor = '#22cc66';
      ctx.shadowBlur = 8 + 12 * at;
      roundRect(ctx, -s / 2, -s / 2, s, s, playerRadius * scale);
      ctx.fillStyle = directionColor;
      ctx.fill();

      // Arrow
      const as2 = s * 0.28;
      ctx.rotate(ARROW_ANGLES[player.rotation]);
      ctx.beginPath();
      ctx.moveTo(as2, 0);
      ctx.lineTo(-as2 * 0.5, -as2 * 0.7);
      ctx.lineTo(-as2 * 0.5, as2 * 0.7);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${0.7 * alpha})`;
      ctx.fill();

      ctx.restore();
      continue;
    }

    // Kill-tile death animation — collapse + red flare
    if (player.deathTimer > 0) {
      const dt = player.deathTimer;
      const scale = 1 - dt * 0.75;
      const spin = dt * Math.PI * 2;
      const alpha = 1 - dt * 0.9;
      const s = size * scale;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(centerX, centerY);
      ctx.rotate(spin);

      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 10 + 14 * dt;
      roundRect(ctx, -s / 2, -s / 2, s, s, playerRadius * scale);
      ctx.fillStyle = directionColor;
      ctx.fill();

      const burstRadius = size * (0.35 + dt * 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, burstRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 90, 90, ${0.55 * alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      const as2 = s * 0.28;
      ctx.rotate(ARROW_ANGLES[player.rotation]);
      ctx.beginPath();
      ctx.moveTo(as2, 0);
      ctx.lineTo(-as2 * 0.5, -as2 * 0.7);
      ctx.lineTo(-as2 * 0.5, as2 * 0.7);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${0.65 * alpha})`;
      ctx.fill();

      ctx.restore();
      continue;
    }

    const px = centerX - size / 2;
    const py = centerY - size / 2;

    // Locked on goal — extra glow
    if (player.lockedOnGoal) {
      ctx.save();
      ctx.shadowColor = directionColor;
      ctx.shadowBlur = 20 + 8 * Math.sin(time * 3);
      roundRect(ctx, px, py, size, size, playerRadius);
      ctx.fillStyle = directionColor;
      ctx.fill();
      ctx.restore();

      // Bright highlight
      roundRect(ctx, px + 1, py + 1, size - 2, size - 2, playerRadius - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fill();

      // Pulsing green border to show locked
      ctx.save();
      ctx.strokeStyle = `rgba(74,222,128,${0.4 + 0.3 * Math.sin(time * 4)})`;
      ctx.lineWidth = 2;
      roundRect(ctx, px - 1, py - 1, size + 2, size + 2, playerRadius + 1);
      ctx.stroke();
      ctx.restore();

      // Arrow
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(ARROW_ANGLES[player.rotation]);
      const arrowSize = size * 0.28;
      ctx.beginPath();
      ctx.moveTo(arrowSize, 0);
      ctx.lineTo(-arrowSize * 0.5, -arrowSize * 0.7);
      ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.7);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      ctx.restore();
      continue;
    }

    ctx.save();
    ctx.shadowColor = directionColor;
    ctx.shadowBlur = 12 + 3 * Math.sin(time * 4);
    roundRect(ctx, px, py, size, size, playerRadius);
    ctx.fillStyle = directionColor;
    ctx.fill();
    ctx.restore();

    roundRect(ctx, px + 1, py + 1, size - 2, size - 2, playerRadius - 1);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();

    // Reversed indicator — pulsing border
    if (player.reversed) {
      ctx.save();
      ctx.strokeStyle = `rgba(200,100,255,${0.4 + 0.3 * Math.sin(time * 6)})`;
      ctx.lineWidth = 2;
      roundRect(ctx, px - 1, py - 1, size + 2, size + 2, playerRadius + 1);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(ARROW_ANGLES[player.rotation]);
    const arrowSize = size * 0.28;
    ctx.beginPath();
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize * 0.5, -arrowSize * 0.7);
    ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.7);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ctx.restore();
  }
}
