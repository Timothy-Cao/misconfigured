import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../input';

describe('InputManager buffering', () => {
  let manager: InputManager;

  beforeEach(() => {
    manager = new InputManager();
    manager.attach();
  });

  afterEach(() => {
    manager.detach();
  });

  it('queues manual inputs in order', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    expect(manager.consumeAction()).toBe('W');
    expect(manager.consumeAction()).toBe('A');
    expect(manager.consumeAction()).toBeNull();
  });

  it('keeps only one buffered follow-up input beyond the next action', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));

    expect(manager.consumeAction()).toBe('W');
    expect(manager.consumeAction()).toBe('D');
    expect(manager.consumeAction()).toBeNull();
  });

  it('ignores auto-repeat keydown events', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', repeat: true }));

    expect(manager.consumeAction()).toBe('W');
    expect(manager.consumeAction()).toBeNull();
  });
});
