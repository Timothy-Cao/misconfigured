# Misconfigured Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2D top-down puzzle game where one WASD input controls 4 characters with rotated control mappings, deployed on Vercel.

**Architecture:** Next.js App Router for pages/routing, pure TypeScript game engine rendering to HTML5 Canvas via requestAnimationFrame, React for UI overlays (HUD, menus). Engine has zero React dependencies and communicates through a thin React wrapper component.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, HTML5 Canvas, Vitest for testing

**Spec:** `docs/superpowers/specs/2026-04-01-misconfigured-game-design.md`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

Expected: Project scaffolded with `src/app/` structure, `package.json` with next/react deps.

- [ ] **Step 2: Install Vitest**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Add test script to package.json**

Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Strip default Next.js boilerplate**

Replace `src/app/page.tsx` with:
```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <h1 className="text-4xl font-bold text-white">Misconfigured</h1>
    </main>
  );
}
```

Replace `src/app/layout.tsx` with:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Misconfigured',
  description: 'A puzzle game where one input controls four characters',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black">{children}</body>
    </html>
  );
}
```

Replace `src/app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  overflow: hidden;
}
```

- [ ] **Step 6: Verify it runs**

Run: `npm run dev` (check it starts without errors, visit localhost:3000, see "Misconfigured" title)
Run: `npm run build` (check it builds without errors)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and Vitest"
```

---

### Task 2: Engine Types

**Files:**
- Create: `src/engine/types.ts`

- [ ] **Step 1: Define all game types**

Create `src/engine/types.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat: define engine types, tile constants, and color palette"
```

---

### Task 3: Input Handler

**Files:**
- Create: `src/engine/input.ts`, `src/engine/__tests__/input.test.ts`

- [ ] **Step 1: Write failing tests for input remapping**

Create `src/engine/__tests__/input.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { remapInput } from '../input';

describe('remapInput', () => {
  it('rotation 0: W=up, A=left, S=down, D=right', () => {
    expect(remapInput({ w: true, a: false, s: false, d: false }, 0)).toEqual({ dx: 0, dy: -1 });
    expect(remapInput({ w: false, a: true, s: false, d: false }, 0)).toEqual({ dx: -1, dy: 0 });
    expect(remapInput({ w: false, a: false, s: true, d: false }, 0)).toEqual({ dx: 0, dy: 1 });
    expect(remapInput({ w: false, a: false, s: false, d: true }, 0)).toEqual({ dx: 1, dy: 0 });
  });

  it('rotation 1 (90° CW): W=right, A=up, S=left, D=down', () => {
    expect(remapInput({ w: true, a: false, s: false, d: false }, 1)).toEqual({ dx: 1, dy: 0 });
    expect(remapInput({ w: false, a: true, s: false, d: false }, 1)).toEqual({ dx: 0, dy: -1 });
    expect(remapInput({ w: false, a: false, s: true, d: false }, 1)).toEqual({ dx: -1, dy: 0 });
    expect(remapInput({ w: false, a: false, s: false, d: true }, 1)).toEqual({ dx: 0, dy: 1 });
  });

  it('rotation 2 (180°): W=down, A=right, S=up, D=left', () => {
    expect(remapInput({ w: true, a: false, s: false, d: false }, 2)).toEqual({ dx: 0, dy: 1 });
    expect(remapInput({ w: false, a: true, s: false, d: false }, 2)).toEqual({ dx: 1, dy: 0 });
    expect(remapInput({ w: false, a: false, s: true, d: false }, 2)).toEqual({ dx: 0, dy: -1 });
    expect(remapInput({ w: false, a: false, s: false, d: true }, 2)).toEqual({ dx: -1, dy: 0 });
  });

  it('rotation 3 (270° CW): W=left, A=down, S=right, D=up', () => {
    expect(remapInput({ w: true, a: false, s: false, d: false }, 3)).toEqual({ dx: -1, dy: 0 });
    expect(remapInput({ w: false, a: true, s: false, d: false }, 3)).toEqual({ dx: 0, dy: 1 });
    expect(remapInput({ w: false, a: false, s: true, d: false }, 3)).toEqual({ dx: 1, dy: 0 });
    expect(remapInput({ w: false, a: false, s: false, d: true }, 3)).toEqual({ dx: 0, dy: -1 });
  });

  it('diagonal: W+D with rotation 0 = up-right', () => {
    expect(remapInput({ w: true, a: false, s: false, d: true }, 0)).toEqual({ dx: 1, dy: -1 });
  });

  it('opposing keys cancel: W+S = no movement', () => {
    expect(remapInput({ w: true, a: false, s: true, d: false }, 0)).toEqual({ dx: 0, dy: 0 });
  });

  it('no keys = no movement', () => {
    expect(remapInput({ w: false, a: false, s: false, d: false }, 0)).toEqual({ dx: 0, dy: 0 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/input.test.ts`
Expected: FAIL — `remapInput` not found.

- [ ] **Step 3: Implement input handler**

Create `src/engine/input.ts`:
```typescript
import { type Rotation, type MoveVector } from './types';

export interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

// Rotation maps: for each rotation, what direction does each key produce?
// Each entry is [dx, dy]. Indexed by rotation (0-3).
// Order within each rotation: [W, A, S, D]
const ROTATION_MAP: Record<Rotation, [number, number][]> = {
  0: [[0, -1], [-1, 0], [0, 1], [1, 0]],    // normal
  1: [[1, 0], [0, -1], [-1, 0], [0, 1]],     // 90° CW
  2: [[0, 1], [1, 0], [0, -1], [-1, 0]],     // 180°
  3: [[-1, 0], [0, 1], [1, 0], [0, -1]],     // 270° CW
};

export function remapInput(keys: KeyState, rotation: Rotation): MoveVector {
  const map = ROTATION_MAP[rotation];
  const pressed = [keys.w, keys.a, keys.s, keys.d];

  let dx = 0;
  let dy = 0;
  for (let i = 0; i < 4; i++) {
    if (pressed[i]) {
      dx += map[i][0];
      dy += map[i][1];
    }
  }

  // Clamp to -1..1 (handles opposing keys and diagonals)
  dx = Math.max(-1, Math.min(1, dx));
  dy = Math.max(-1, Math.min(1, dy));

  return { dx, dy };
}

/**
 * Tracks currently pressed keys. Attach to window keydown/keyup.
 */
export class InputManager {
  private keys: KeyState = { w: false, a: false, s: false, d: false };

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key in this.keys) {
      this.keys[key as keyof KeyState] = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key in this.keys) {
      this.keys[key as keyof KeyState] = false;
    }
  };

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  getKeys(): KeyState {
    return { ...this.keys };
  }

  reset() {
    this.keys = { w: false, a: false, s: false, d: false };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/input.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/input.ts src/engine/__tests__/input.test.ts
git commit -m "feat: input handler with WASD rotation remapping"
```

---

### Task 4: Physics — Collision Detection

**Files:**
- Create: `src/engine/physics.ts`, `src/engine/__tests__/physics.test.ts`

- [ ] **Step 1: Write failing tests for collision and tile queries**

Create `src/engine/__tests__/physics.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getTileAt, isWalkable, movePlayer } from '../physics';
import { TileType, type LevelData, type PlayerState } from '../types';

// Minimal 5x5 test level:
// 0 0 0 0 0
// 0 1 1 1 0
// 0 1 2 1 0
// 0 1 1 3 0
// 0 0 0 0 0
const testLevel: LevelData = {
  id: 0,
  name: 'test',
  width: 5,
  height: 5,
  grid: [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 1, 2, 1, 0],
    [0, 1, 1, 3, 0],
    [0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 1, rotation: 0 },
    { startX: 3, startY: 1, rotation: 1 },
    { startX: 1, startY: 3, rotation: 2 },
    { startX: 3, startY: 3, rotation: 3 },
  ],
};

const TILE = 40;

describe('getTileAt', () => {
  it('returns correct tile type for grid coordinates', () => {
    expect(getTileAt(testLevel, 0, 0)).toBe(TileType.VOID);
    expect(getTileAt(testLevel, 1, 1)).toBe(TileType.FLOOR);
    expect(getTileAt(testLevel, 2, 2)).toBe(TileType.KILL);
    expect(getTileAt(testLevel, 3, 3)).toBe(TileType.GOAL);
  });

  it('returns VOID for out-of-bounds', () => {
    expect(getTileAt(testLevel, -1, 0)).toBe(TileType.VOID);
    expect(getTileAt(testLevel, 5, 5)).toBe(TileType.VOID);
  });
});

describe('isWalkable', () => {
  it('floor, kill, goal, checkpoint are walkable', () => {
    expect(isWalkable(TileType.FLOOR)).toBe(true);
    expect(isWalkable(TileType.KILL)).toBe(true);
    expect(isWalkable(TileType.GOAL)).toBe(true);
    expect(isWalkable(TileType.CHECKPOINT)).toBe(true);
  });

  it('void is not walkable', () => {
    expect(isWalkable(TileType.VOID)).toBe(false);
  });
});

describe('movePlayer', () => {
  const makePlayer = (x: number, y: number): PlayerState => ({
    x, y, alive: true,
    checkpointX: x, checkpointY: y,
    rotation: 0, color: '#e94560',
  });

  it('moves player by velocity * dt on open floor', () => {
    // Player at center of tile (1,1), moving right
    const p = makePlayer(1.5 * TILE, 1.5 * TILE);
    const result = movePlayer(p, 1, 0, 200, 0.016, testLevel, TILE);
    expect(result.x).toBeGreaterThan(p.x);
    expect(result.y).toBe(p.y);
  });

  it('stops player at wall boundary on X axis', () => {
    // Player near right wall (tile 3 is floor, tile 4 is void)
    // Place player almost at the right edge of tile 3
    const p = makePlayer(3.9 * TILE, 1.5 * TILE);
    const result = movePlayer(p, 1, 0, 200, 0.1, testLevel, TILE);
    // Should not enter tile 4 (void)
    const halfSize = TILE * 0.7 / 2;
    expect(result.x + halfSize).toBeLessThanOrEqual(4 * TILE);
  });

  it('allows Y movement when X is blocked', () => {
    // Player at right edge, moving right+down
    const p = makePlayer(3.9 * TILE, 1.5 * TILE);
    const result = movePlayer(p, 1, 1, 200, 0.016, testLevel, TILE);
    // X blocked, but Y should move
    expect(result.y).toBeGreaterThan(p.y);
  });

  it('does not move dead player', () => {
    const p = makePlayer(1.5 * TILE, 1.5 * TILE);
    p.alive = false;
    const result = movePlayer(p, 1, 0, 200, 0.016, testLevel, TILE);
    expect(result.x).toBe(p.x);
    expect(result.y).toBe(p.y);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/physics.test.ts`
Expected: FAIL — functions not found.

- [ ] **Step 3: Implement physics**

Create `src/engine/physics.ts`:
```typescript
import { TileType, type TileTypeValue, type LevelData, type PlayerState, PLAYER_SIZE_RATIO } from './types';

/**
 * Get the tile type at grid coordinates (col, row).
 * Returns VOID for out-of-bounds.
 */
export function getTileAt(level: LevelData, col: number, row: number): TileTypeValue {
  if (row < 0 || row >= level.height || col < 0 || col >= level.width) {
    return TileType.VOID;
  }
  return level.grid[row][col] as TileTypeValue;
}

/**
 * Can a player walk on this tile type?
 */
export function isWalkable(tile: TileTypeValue): boolean {
  return tile !== TileType.VOID;
}

/**
 * Get the tile type at a pixel position.
 */
export function getTileAtPixel(level: LevelData, px: number, py: number, tileSize: number): TileTypeValue {
  const col = Math.floor(px / tileSize);
  const row = Math.floor(py / tileSize);
  return getTileAt(level, col, row);
}

/**
 * Check if a rectangular area (player bounds) is fully within walkable tiles.
 */
function canOccupy(level: LevelData, cx: number, cy: number, halfSize: number, tileSize: number): boolean {
  // Check all 4 corners of the player bounding box
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

/**
 * Move a player with per-axis wall collision.
 * Returns a new PlayerState with updated position (does not mutate input).
 */
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

  // Try X movement
  if (dx !== 0) {
    const newX = x + dx * speed * dt;
    if (canOccupy(level, newX, y, halfSize, tileSize)) {
      x = newX;
    }
  }

  // Try Y movement independently
  if (dy !== 0) {
    const newY = y + dy * speed * dt;
    if (canOccupy(level, x, newY, halfSize, tileSize)) {
      y = newY;
    }
  }

  return { ...player, x, y };
}

/**
 * Get the tile the player's center is on.
 */
export function getPlayerTile(player: PlayerState, tileSize: number): { col: number; row: number } {
  return {
    col: Math.floor(player.x / tileSize),
    row: Math.floor(player.y / tileSize),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/physics.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/physics.ts src/engine/__tests__/physics.test.ts
git commit -m "feat: physics with per-axis wall collision"
```

---

### Task 5: Renderer

**Files:**
- Create: `src/engine/renderer.ts`

No TDD for this — rendering is visual output, best verified by eye.

- [ ] **Step 1: Implement the renderer**

Create `src/engine/renderer.ts`:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/renderer.ts
git commit -m "feat: canvas renderer for grid, tiles, and players"
```

---

### Task 6: Game Engine

**Files:**
- Create: `src/engine/GameEngine.ts`, `src/engine/__tests__/GameEngine.test.ts`

- [ ] **Step 1: Write failing tests for game state logic**

Create `src/engine/__tests__/GameEngine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  checkKillZones,
  checkCheckpoints,
  checkWinCondition,
} from '../GameEngine';
import { TileType, type LevelData } from '../types';

// 5x5 test level with kill, goal, checkpoint
const testLevel: LevelData = {
  id: 0,
  name: 'test',
  width: 5,
  height: 5,
  grid: [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 4, 0],
    [0, 1, 2, 1, 0],
    [0, 1, 1, 3, 0],
    [0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 1, rotation: 0 },
    { startX: 3, startY: 1, rotation: 1 },
    { startX: 1, startY: 3, rotation: 2 },
    { startX: 3, startY: 3, rotation: 3 },
  ],
};

const TILE = 40;

describe('createInitialState', () => {
  it('creates 4 players at correct pixel positions', () => {
    const state = createInitialState(testLevel, TILE);
    expect(state.players).toHaveLength(4);
    // Player 0 at grid (1,1) → pixel center (1.5*40, 1.5*40)
    expect(state.players[0].x).toBe(60);
    expect(state.players[0].y).toBe(60);
    expect(state.players[0].rotation).toBe(0);
    expect(state.players[0].color).toBe('#e94560');
    expect(state.players[0].alive).toBe(true);
  });
});

describe('checkKillZones', () => {
  it('kills player standing on kill tile and respawns at checkpoint', () => {
    const state = createInitialState(testLevel, TILE);
    // Move player 0 to kill zone center (col 2, row 2)
    state.players[0].x = 2.5 * TILE;
    state.players[0].y = 2.5 * TILE;
    checkKillZones(state, testLevel, TILE);
    // Should respawn at start (no checkpoint touched)
    expect(state.players[0].x).toBe(1.5 * TILE);
    expect(state.players[0].y).toBe(1.5 * TILE);
  });

  it('respawns at checkpoint if one was touched', () => {
    const state = createInitialState(testLevel, TILE);
    // Set checkpoint for player 0
    state.players[0].checkpointX = 3.5 * TILE;
    state.players[0].checkpointY = 1.5 * TILE;
    // Move to kill zone
    state.players[0].x = 2.5 * TILE;
    state.players[0].y = 2.5 * TILE;
    checkKillZones(state, testLevel, TILE);
    expect(state.players[0].x).toBe(3.5 * TILE);
    expect(state.players[0].y).toBe(1.5 * TILE);
  });

  it('does not affect players not on kill tiles', () => {
    const state = createInitialState(testLevel, TILE);
    const origX = state.players[0].x;
    checkKillZones(state, testLevel, TILE);
    expect(state.players[0].x).toBe(origX);
  });
});

describe('checkCheckpoints', () => {
  it('updates checkpoint when player touches yellow tile', () => {
    const state = createInitialState(testLevel, TILE);
    // Move player 0 to checkpoint tile (col 3, row 1)
    state.players[0].x = 3.5 * TILE;
    state.players[0].y = 1.5 * TILE;
    checkCheckpoints(state, testLevel, TILE);
    expect(state.players[0].checkpointX).toBe(3.5 * TILE);
    expect(state.players[0].checkpointY).toBe(1.5 * TILE);
  });
});

describe('checkWinCondition', () => {
  it('returns true when all goals are covered', () => {
    const state = createInitialState(testLevel, TILE);
    // Only one goal at (3,3). Move player 3 onto it.
    state.players[3].x = 3.5 * TILE;
    state.players[3].y = 3.5 * TILE;
    expect(checkWinCondition(state, testLevel, TILE)).toBe(true);
  });

  it('returns false when goals are not covered', () => {
    const state = createInitialState(testLevel, TILE);
    expect(checkWinCondition(state, testLevel, TILE)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/GameEngine.test.ts`
Expected: FAIL — functions not found.

- [ ] **Step 3: Implement GameEngine**

Create `src/engine/GameEngine.ts`:
```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/GameEngine.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/GameEngine.ts src/engine/__tests__/GameEngine.test.ts
git commit -m "feat: game engine with state management, kill/checkpoint/win logic"
```

---

### Task 7: Level Data (25 Placeholder Levels)

**Files:**
- Create: `src/levels/index.ts`, `src/levels/level-01.ts` through `src/levels/level-25.ts`

- [ ] **Step 1: Create level 1 as the template**

Create `src/levels/level-01.ts`:
```typescript
import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: 1,
  name: 'Level 1',
  width: 12,
  height: 10,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 1, rotation: 0 },
    { startX: 10, startY: 1, rotation: 1 },
    { startX: 1, startY: 8, rotation: 2 },
    { startX: 10, startY: 8, rotation: 3 },
  ],
};

export default level;
```

- [ ] **Step 2: Generate levels 2-25 as placeholders**

Each file `src/levels/level-NN.ts` follows the same pattern as level 1 but with `id: N` and `name: 'Level N'`. Use a script or manually create them. All placeholder levels are identical grids — they will be designed later.

Run (generates all 25 files):
```bash
for i in $(seq 2 25); do
  num=$(printf "%02d" $i)
  cat > "src/levels/level-${num}.ts" << LEVELEOF
import { type LevelData } from '@/engine/types';

const level: LevelData = {
  id: ${i},
  name: 'Level ${i}',
  width: 12,
  height: 10,
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  players: [
    { startX: 1, startY: 1, rotation: 0 },
    { startX: 10, startY: 1, rotation: 1 },
    { startX: 1, startY: 8, rotation: 2 },
    { startX: 10, startY: 8, rotation: 3 },
  ],
};

export default level;
LEVELEOF
done
```

- [ ] **Step 3: Create level registry**

Create `src/levels/index.ts`:
```typescript
import { type LevelData } from '@/engine/types';
import level01 from './level-01';
import level02 from './level-02';
import level03 from './level-03';
import level04 from './level-04';
import level05 from './level-05';
import level06 from './level-06';
import level07 from './level-07';
import level08 from './level-08';
import level09 from './level-09';
import level10 from './level-10';
import level11 from './level-11';
import level12 from './level-12';
import level13 from './level-13';
import level14 from './level-14';
import level15 from './level-15';
import level16 from './level-16';
import level17 from './level-17';
import level18 from './level-18';
import level19 from './level-19';
import level20 from './level-20';
import level21 from './level-21';
import level22 from './level-22';
import level23 from './level-23';
import level24 from './level-24';
import level25 from './level-25';

export const levels: LevelData[] = [
  level01, level02, level03, level04, level05,
  level06, level07, level08, level09, level10,
  level11, level12, level13, level14, level15,
  level16, level17, level18, level19, level20,
  level21, level22, level23, level24, level25,
];

export function getLevel(id: number): LevelData | undefined {
  return levels.find(l => l.id === id);
}

export const TOTAL_LEVELS = levels.length;
```

- [ ] **Step 4: Commit**

```bash
git add src/levels/
git commit -m "feat: 25 placeholder levels with registry"
```

---

### Task 8: Game Progress Hook

**Files:**
- Create: `src/hooks/useGameProgress.ts`, `src/hooks/__tests__/useGameProgress.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/hooks/__tests__/useGameProgress.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getProgress, saveProgress, isLevelUnlocked, type GameProgress } from '../useGameProgress';

beforeEach(() => {
  localStorage.clear();
});

describe('getProgress', () => {
  it('returns default progress when nothing saved', () => {
    const progress = getProgress();
    expect(progress.completedLevels).toEqual([]);
    expect(progress.currentLevel).toBe(1);
  });

  it('returns saved progress', () => {
    const saved: GameProgress = { completedLevels: [1, 2, 3], currentLevel: 4 };
    localStorage.setItem('misconfigured-progress', JSON.stringify(saved));
    const progress = getProgress();
    expect(progress.completedLevels).toEqual([1, 2, 3]);
    expect(progress.currentLevel).toBe(4);
  });
});

describe('saveProgress', () => {
  it('persists to localStorage', () => {
    saveProgress({ completedLevels: [1], currentLevel: 2 });
    const raw = localStorage.getItem('misconfigured-progress');
    expect(JSON.parse(raw!)).toEqual({ completedLevels: [1], currentLevel: 2 });
  });
});

describe('isLevelUnlocked', () => {
  it('level 1 is always unlocked', () => {
    expect(isLevelUnlocked(1, { completedLevels: [], currentLevel: 1 })).toBe(true);
  });

  it('level N+1 is unlocked if N is completed', () => {
    expect(isLevelUnlocked(4, { completedLevels: [1, 2, 3], currentLevel: 4 })).toBe(true);
  });

  it('level N+2 is locked if N+1 not completed', () => {
    expect(isLevelUnlocked(5, { completedLevels: [1, 2, 3], currentLevel: 4 })).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/__tests__/useGameProgress.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement progress utilities and hook**

Create `src/hooks/useGameProgress.ts`:
```typescript
'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'misconfigured-progress';

export interface GameProgress {
  completedLevels: number[];
  currentLevel: number;
}

const DEFAULT_PROGRESS: GameProgress = {
  completedLevels: [],
  currentLevel: 1,
};

export function getProgress(): GameProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return JSON.parse(raw) as GameProgress;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: GameProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isLevelUnlocked(levelId: number, progress: GameProgress): boolean {
  if (levelId === 1) return true;
  return progress.completedLevels.includes(levelId - 1);
}

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(getProgress);

  const completeLevel = useCallback((levelId: number) => {
    setProgress(prev => {
      const completed = prev.completedLevels.includes(levelId)
        ? prev.completedLevels
        : [...prev.completedLevels, levelId];
      const next = {
        completedLevels: completed,
        currentLevel: Math.max(prev.currentLevel, levelId + 1),
      };
      saveProgress(next);
      return next;
    });
  }, []);

  return { progress, completeLevel, isUnlocked: (id: number) => isLevelUnlocked(id, progress) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/__tests__/useGameProgress.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGameProgress.ts src/hooks/__tests__/useGameProgress.test.ts
git commit -m "feat: game progress persistence with localStorage"
```

---

### Task 9: React Components — GameCanvas, HUD

**Files:**
- Create: `src/components/GameCanvas.tsx`, `src/components/HUD.tsx`

- [ ] **Step 1: Create GameCanvas wrapper**

Create `src/components/GameCanvas.tsx`:
```tsx
'use client';

import { useRef, useEffect } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { type LevelData } from '@/engine/types';

const TILE_SIZE = 40;

interface GameCanvasProps {
  level: LevelData;
  onLevelComplete: () => void;
}

export default function GameCanvas({ level, onLevelComplete }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, level, TILE_SIZE, {
      onLevelComplete,
    });
    engineRef.current = engine;
    engine.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        engine.restart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      engine.stop();
      window.removeEventListener('keydown', handleKeyDown);
      engineRef.current = null;
    };
  }, [level, onLevelComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{
        imageRendering: 'pixelated',
      }}
    />
  );
}
```

- [ ] **Step 2: Create HUD overlay**

Create `src/components/HUD.tsx`:
```tsx
'use client';

import Link from 'next/link';

interface HUDProps {
  levelId: number;
  levelComplete: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
}

export default function HUD({ levelId, levelComplete, onRestart, onNextLevel }: HUDProps) {
  return (
    <>
      {/* Top bar */}
      <div className="absolute top-4 left-4 flex gap-4 items-center">
        <Link
          href="/levels"
          className="text-white/60 hover:text-white text-sm px-3 py-1 border border-white/20 rounded"
        >
          Back
        </Link>
        <span className="text-white/80 text-sm font-mono">Level {levelId}</span>
      </div>

      <div className="absolute top-4 right-4">
        <button
          onClick={onRestart}
          className="text-white/60 hover:text-white text-sm px-3 py-1 border border-white/20 rounded"
        >
          Restart (R)
        </button>
      </div>

      {/* Level complete overlay */}
      {levelComplete && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Level Complete!</h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onNextLevel}
                className="px-6 py-2 bg-green-500 text-white rounded font-semibold hover:bg-green-400"
              >
                Next Level
              </button>
              <Link
                href="/levels"
                className="px-6 py-2 border border-white/40 text-white rounded hover:bg-white/10"
              >
                Level Select
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/GameCanvas.tsx src/components/HUD.tsx
git commit -m "feat: GameCanvas React wrapper and HUD overlay"
```

---

### Task 10: React Components — LevelSelect

**Files:**
- Create: `src/components/LevelSelect.tsx`

- [ ] **Step 1: Create LevelSelect component**

Create `src/components/LevelSelect.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useGameProgress } from '@/hooks/useGameProgress';
import { TOTAL_LEVELS } from '@/levels';

export default function LevelSelect() {
  const { progress, isUnlocked } = useGameProgress();

  return (
    <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
      {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
        const id = i + 1;
        const unlocked = isUnlocked(id);
        const completed = progress.completedLevels.includes(id);

        if (!unlocked) {
          return (
            <div
              key={id}
              className="aspect-square flex items-center justify-center rounded bg-white/5 text-white/20 font-mono text-lg cursor-not-allowed"
            >
              {id}
            </div>
          );
        }

        return (
          <Link
            key={id}
            href={`/play/${id}`}
            className={`aspect-square flex items-center justify-center rounded font-mono text-lg transition-colors ${
              completed
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            {completed ? '✓' : id}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LevelSelect.tsx
git commit -m "feat: level select grid with progress tracking"
```

---

### Task 11: App Pages

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/levels/page.tsx`, `src/app/play/[id]/page.tsx`

- [ ] **Step 1: Update home page**

Replace `src/app/page.tsx`:
```tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-2">Misconfigured</h1>
        <p className="text-white/50 text-sm">One input. Four characters. Different directions.</p>
      </div>
      <Link
        href="/levels"
        className="px-8 py-3 bg-white/10 text-white rounded-lg text-lg font-semibold border border-white/20 hover:bg-white/20 transition-colors"
      >
        Play
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Create levels page**

Create `src/app/levels/page.tsx`:
```tsx
import Link from 'next/link';
import LevelSelect from '@/components/LevelSelect';

export default function LevelsPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-1">Select Level</h1>
        <p className="text-white/40 text-sm">Complete levels to unlock the next</p>
      </div>
      <LevelSelect />
      <Link href="/" className="text-white/40 hover:text-white text-sm">
        Back to Title
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Create play page**

Create `src/app/play/[id]/page.tsx`:
```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import { getLevel, TOTAL_LEVELS } from '@/levels';
import { useGameProgress } from '@/hooks/useGameProgress';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = Number(params.id);
  const level = getLevel(levelId);
  const { completeLevel } = useGameProgress();
  const [levelComplete, setLevelComplete] = useState(false);
  const [key, setKey] = useState(0); // force remount on restart

  const handleLevelComplete = useCallback(() => {
    completeLevel(levelId);
    setLevelComplete(true);
  }, [levelId, completeLevel]);

  const handleRestart = useCallback(() => {
    setLevelComplete(false);
    setKey(k => k + 1);
  }, []);

  const handleNextLevel = useCallback(() => {
    if (levelId < TOTAL_LEVELS) {
      setLevelComplete(false);
      router.push(`/play/${levelId + 1}`);
    } else {
      router.push('/levels');
    }
  }, [levelId, router]);

  if (!level) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Level not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        <GameCanvas key={key} level={level} onLevelComplete={handleLevelComplete} />
        <HUD
          levelId={levelId}
          levelComplete={levelComplete}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify app works end to end**

Run: `npm run dev`
1. Visit localhost:3000 — see title screen with "Play" button
2. Click Play → level select grid appears, level 1 unlocked
3. Click level 1 → game canvas renders, 4 colored squares visible
4. Press WASD — all 4 characters move in different directions
5. Navigate a character to the green tile → "Level Complete!" overlay appears
6. Run `npm run build` — no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: app pages — home, level select, gameplay"
```

---

### Task 12: Final Integration and Build Verification

**Files:**
- No new files — verification only

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Build for production**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Commit any fixes if needed**

Only if steps 1-2 surfaced issues.
