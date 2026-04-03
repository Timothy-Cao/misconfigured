import { type Rotation, type MoveVector } from './types';

export type BufferedAction = 'W' | 'A' | 'S' | 'D';

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
  private queue: BufferedAction[] = [];

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
      if (e.repeat) return;
      this.enqueue(key.toUpperCase() as BufferedAction);
    }
  };

  private onKeyUp = () => {};

  private enqueue(action: BufferedAction) {
    if (this.queue.length === 0) {
      this.queue.push(action);
      return;
    }

    if (this.queue.length === 1) {
      this.queue.push(action);
      return;
    }

    // Keep only a single buffered follow-up action.
    this.queue[1] = action;
  }

  attach() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  consumeAction(): BufferedAction | null {
    return this.queue.shift() ?? null;
  }

  reset() {
    this.queue = [];
  }
}
