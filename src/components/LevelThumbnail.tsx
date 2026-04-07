'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createInitialState } from '@/engine/GameEngine';
import { render } from '@/engine/renderer';
import { type LevelData } from '@/engine/types';
import { getLevelHash } from '@/lib/level-hash';

interface LevelThumbnailProps {
  level: LevelData;
  className?: string;
}

function cloneLevel(level: LevelData): LevelData {
  return {
    ...level,
    grid: level.grid.map(row => [...row]),
    players: level.players.map(player => ({ ...player })),
  };
}

export default function LevelThumbnail({ level, className = '' }: LevelThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelHash = useMemo(() => getLevelHash(level), [level]);
  const tileSize = useMemo(() => {
    const maxDimension = Math.max(level.width, level.height, 1);
    return Math.max(10, Math.floor(180 / maxDimension));
  }, [level.height, level.width]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLevel = cloneLevel(level);
    const state = createInitialState(renderLevel, tileSize);
    canvas.width = renderLevel.width * tileSize;
    canvas.height = renderLevel.height * tileSize;
    render(ctx, renderLevel, state);
  }, [level, levelHash, tileSize]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f] shadow-inner ${className}`}
      style={{ aspectRatio: `${level.width} / ${level.height}` }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
      />
    </div>
  );
}
