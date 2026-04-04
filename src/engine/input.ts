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
  private pendingAction: BufferedAction | null = null;
  private heldActions = new Map<BufferedAction, number>();
  private pressOrder = 0;

  private toBufferedAction(key: string): BufferedAction | null {
    switch (key) {
      case 'w':
      case 'arrowup':
        return 'W';
      case 'a':
      case 'arrowleft':
        return 'A';
      case 's':
      case 'arrowdown':
        return 'S';
      case 'd':
      case 'arrowright':
        return 'D';
      default:
        return null;
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const action = this.toBufferedAction(e.key.toLowerCase());
    if (!action) return;
    e.preventDefault();
    if (e.repeat) return;
    this.heldActions.set(action, this.pressOrder++);
    this.enqueue(action);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const action = this.toBufferedAction(e.key.toLowerCase());
    if (!action) return;
    e.preventDefault();
    this.heldActions.delete(action);
  };

  private enqueue(action: BufferedAction) {
    // Keep only the latest single pending keyboard action.
    this.pendingAction = action;
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
    const action = this.pendingAction;
    this.pendingAction = null;
    return action;
  }

  getHeldAction(): BufferedAction | null {
    let latestAction: BufferedAction | null = null;
    let latestOrder = -1;

    for (const [action, order] of this.heldActions) {
      if (order > latestOrder) {
        latestOrder = order;
        latestAction = action;
      }
    }

    return latestAction;
  }

  reset() {
    this.pendingAction = null;
    this.heldActions.clear();
    this.pressOrder = 0;
  }
}
