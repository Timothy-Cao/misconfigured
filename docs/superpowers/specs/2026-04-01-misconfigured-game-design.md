# Misconfigured — Game Design Spec

## Overview

Misconfigured is a single-player 2D top-down puzzle-action game where the player controls 4 characters simultaneously with one set of WASD controls. The twist: each character's controls are rotated differently (0°, 90°, 180°, 270°), so pressing W moves them in different directions. The challenge is navigating all 4 characters through hazards to reach goal zones.

**Platform:** Web (Next.js on Vercel)
**Tech:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, HTML5 Canvas
**Scope:** 25 levels (initially empty placeholders)

## Visual Style

- **Black** void/walls surrounding the room
- **Light peachy wood** (`#e8c9a0`) floor tiles
- **Grid-based** room shapes and wall placement; movement is free/continuous
- Subtle grid lines on floor for spatial reference
- Clean, minimal aesthetic

### Tile Colors

| Tile       | Color     | Hex       |
|------------|-----------|-----------|
| Void/Wall  | Black     | `#000000` |
| Floor      | Peach     | `#e8c9a0` |
| Kill zone  | Red       | `#ff3333` |
| Goal       | Green     | `#4ade80` |
| Checkpoint | Yellow    | `#facc15` |

### Characters

4 colored squares with a directional arrow indicating their "up" direction:

| Player | Color   | Hex       | Rotation | W maps to |
|--------|---------|-----------|----------|-----------|
| 1      | Red     | `#e94560` | 0°       | Up        |
| 2      | Teal    | `#4ecdc4` | 90° CW   | Right     |
| 3      | Yellow  | `#ffe66d` | 180°     | Down      |
| 4      | Purple  | `#a855f7` | 270° CW  | Left      |

Character size: 70% of one grid tile. Arrow overlay (dark, semi-transparent) points in the character's "up" direction.

## Game Mechanics

### Movement

- WASD controls all 4 characters simultaneously
- Each character has a rotation offset that remaps the input:
  - **0°:** W=up, A=left, S=down, D=right
  - **90°:** W=right, A=up, S=left, D=down
  - **180°:** W=down, A=right, S=up, D=left
  - **270°:** W=left, A=down, S=right, D=up
- Continuous movement while key is held (not grid-snapped)
- Medium pace — responsive but not twitchy
- Multiple keys can be held simultaneously for diagonal movement
- Per-axis wall collision: hitting a wall on X does not block Y movement

### Death and Respawn

- Touching a kill zone (red) kills only that character
- Other characters remain in place, unaffected
- Dead character respawns at the last yellow checkpoint that specific character touched
- If no checkpoint was touched, respawns at their level start position

### Checkpoints

- Per-character tracking: each character has their own checkpoint state
- Touching a yellow tile saves that position as that character's respawn point
- Checkpoints persist until level restart or level change

### Win Condition

- Every green goal tile must have at least one character on it simultaneously
- If there are N green tiles, at least N characters must be positioned on them at the same time
- Remaining characters just need to be alive (not currently on a kill zone)
- Level completes immediately when the condition is met

## Level System

### Level Data Format

Each level is a TypeScript object:

```typescript
interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  grid: number[][]; // 0=void, 1=floor, 2=kill, 3=goal, 4=checkpoint
  players: {
    startX: number;
    startY: number;
    rotation: 0 | 1 | 2 | 3;
  }[];
}
```

- Grid dimensions can vary per level
- 25 levels total, initially empty placeholders (floor rectangle with walls, 4 players in corners, 1 goal)
- Levels unlocked sequentially — completing level N unlocks N+1
- Progress saved to `localStorage`

### Level Select Screen

- Grid of 25 numbered tiles
- Locked levels greyed out
- Completed levels show a checkmark
- Current/unlocked level highlighted

## Architecture

### Rendering: HTML5 Canvas

- Canvas element for all game rendering (grid, characters, effects)
- `requestAnimationFrame` game loop, independent of React render cycle
- React manages UI outside the canvas (menus, HUD overlays)

### Project Structure

```
src/
  app/
    page.tsx                # Title/home screen
    levels/
      page.tsx              # Level select grid
    play/[id]/
      page.tsx              # Gameplay page, mounts canvas
  engine/
    GameEngine.ts           # Core game loop, state management
    physics.ts              # Movement, collision detection
    types.ts                # Tile types, player types, level data interface
    input.ts                # Keyboard input handler (WASD remapping)
    renderer.ts             # Canvas drawing (grid, players, effects)
  levels/
    index.ts                # Level registry, exports all levels
    level-01.ts             # Level 1 data
    ...                     # level-02.ts through level-25.ts
  components/
    GameCanvas.tsx           # React wrapper for canvas + engine
    LevelSelect.tsx          # Level grid component
    HUD.tsx                 # In-game overlay (level #, restart, back)
  hooks/
    useGameProgress.ts      # localStorage read/write for unlocked levels
```

### Key Boundaries

- **`engine/`** — Pure TypeScript, no React. Receives a canvas element and level data, runs independently. Testable in isolation.
- **`components/`** — Bridges React and the engine. `GameCanvas` creates the engine instance, passes the canvas ref, and handles lifecycle (start/stop/cleanup).
- **`levels/`** — Pure data, no logic. Each file exports a `LevelData` object.
- **`hooks/`** — React hooks for persistence (localStorage).

### In-Game UI (React overlay, not canvas)

- Level number display in corner
- Restart button (R key shortcut)
- Back to level select button

## Deployment

- Vercel deployment via Next.js
- Static export possible (no server-side features needed)
- No backend or database required — all state is client-side localStorage
