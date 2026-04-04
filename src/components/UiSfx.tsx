'use client';

import { useEffect, useRef } from 'react';
import { playSfx } from '@/engine/sfx';

const HOVER_SELECTOR = 'button, a, [role="button"], [data-sfx-hover]';
const CLICK_SELECTOR = 'button, a, [role="button"], [data-sfx-click]';

export default function UiSfx() {
  const lastHoverRef = useRef<string | null>(null);
  const hoverCooldownRef = useRef<number>(0);

  useEffect(() => {
    function shouldIgnore(target: Element | null): boolean {
      if (!target) return true;
      const element = target.closest(HOVER_SELECTOR);
      if (!element) return true;
      if (element.hasAttribute('disabled')) return true;
      return false;
    }

    function onPointerOver(event: PointerEvent) {
      const target = event.target as Element | null;
      if (shouldIgnore(target)) return;
      const element = (target as Element).closest(HOVER_SELECTOR);
      if (!element) return;

      const key = `${element.tagName}-${element.textContent ?? ''}-${element.getAttribute('href') ?? ''}`;
      const now = performance.now();
      if (lastHoverRef.current === key && now - hoverCooldownRef.current < 120) return;
      lastHoverRef.current = key;
      hoverCooldownRef.current = now;
      playSfx('uiHover');
    }

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const element = target?.closest(CLICK_SELECTOR);
      if (!element || element.hasAttribute('disabled')) return;
      playSfx('uiClick');
    }

    window.addEventListener('pointerover', onPointerOver);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('pointerover', onPointerOver);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return null;
}
