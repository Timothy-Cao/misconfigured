'use client';

import { useEffect, useState } from 'react';
import { remapInput, type BufferedAction } from '@/engine/input';
import { COLORS, type Rotation } from '@/engine/types';

type DemoUnit = {
  id: string;
  rotation: Rotation;
  baseX: number;
  baseY: number;
};

type DemoPosition = {
  x: number;
  y: number;
};

const CELL_SIZE = 18;
const STEP_INTERVAL_MS = 780;
const INPUT_LOOP: Array<BufferedAction | '.'> = [
  'W', '.', '.', '.', 'W', '.', '.', '.',
  'D', '.', '.', 'A', '.', '.', 'S', '.', '.', 'S', '.', '.', 'A', '.', '.', 'D',
];

const DEMO_UNITS: DemoUnit[] = [
  { id: 'left-up', rotation: 0, baseX: -136, baseY: -8 },
  { id: 'right-right', rotation: 1, baseX: 136, baseY: -54 },
  { id: 'right-down', rotation: 2, baseX: 164, baseY: 42 },
];

const ROTATION_ICON: Record<Rotation, string> = {
  0: '↑',
  1: '→',
  2: '↓',
  3: '←',
};

function createInitialPositions(): Record<string, DemoPosition> {
  return Object.fromEntries(DEMO_UNITS.map((unit) => [unit.id, { x: 0, y: 0 }]));
}

export default function MenuLinkedUnits() {
  const [positions, setPositions] = useState<Record<string, DemoPosition>>(createInitialPositions);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateVisibility = () => {
      setVisible(!media.matches);
    };

    updateVisibility();
    media.addEventListener('change', updateVisibility);
    return () => {
      media.removeEventListener('change', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let stepIndex = 0;
    const timer = window.setInterval(() => {
      const action = INPUT_LOOP[stepIndex] ?? '.';
      stepIndex = (stepIndex + 1) % INPUT_LOOP.length;

      if (action === '.') {
        return;
      }

      setPositions((current) => {
        const next: Record<string, DemoPosition> = { ...current };
        for (const unit of DEMO_UNITS) {
          const move = remapInput(
            {
              w: action === 'W',
              a: action === 'A',
              s: action === 'S',
              d: action === 'D',
            },
            unit.rotation,
          );

          next[unit.id] = {
            x: (current[unit.id]?.x ?? 0) + move.dx,
            y: (current[unit.id]?.y ?? 0) + move.dy,
          };
        }
        return next;
      });
    }, STEP_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [visible]);

  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      {DEMO_UNITS.map((unit) => {
        const position = positions[unit.id] ?? { x: 0, y: 0 };
        const color = COLORS.players[unit.rotation];
        return (
          <div
            key={unit.id}
            className="absolute left-1/2 top-1/2 transition-transform duration-500 ease-out"
            style={{
              transform: `translate(calc(-50% + ${unit.baseX + position.x * CELL_SIZE}px), calc(-50% + ${unit.baseY + position.y * CELL_SIZE}px))`,
            }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl border text-base font-black text-white/88 shadow-[0_0_24px_rgba(255,255,255,0.08)] backdrop-blur-sm"
              style={{
                backgroundColor: `${color}22`,
                borderColor: `${color}66`,
                boxShadow: `0 0 22px ${color}33`,
              }}
            >
              <span
                style={{
                  color,
                  textShadow: `0 0 14px ${color}55`,
                }}
              >
                {ROTATION_ICON[unit.rotation]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
