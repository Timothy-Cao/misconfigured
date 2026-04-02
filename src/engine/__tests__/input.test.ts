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
