'use client';

import { useRef, useEffect, useState } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { type LevelData } from '@/engine/types';

const BASE_TILE_SIZE = 40;

interface GameCanvasProps {
  level: LevelData;
  onLevelComplete: (completionTime: number) => void;
  onProgressUpdate?: (settledUnits: number) => void;
  onGameOver?: () => void;
  onLivesUpdate?: (lives: number, maxLives: number) => void;
}

export default function GameCanvas({ level, onLevelComplete, onProgressUpdate, onGameOver, onLivesUpdate }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [scale, setScale] = useState(1);

  // Compute scale so the canvas fills available space without distorting
  useEffect(() => {
    function computeScale() {
      const maxW = window.innerWidth * 0.9;
      const maxH = window.innerHeight * 0.85;
      const nativeW = level.width * BASE_TILE_SIZE;
      const nativeH = level.height * BASE_TILE_SIZE;
      const s = Math.min(maxW / nativeW, maxH / nativeH, 2.5); // cap at 2.5x
      setScale(Math.max(1, s));
    }
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [level.width, level.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, level, BASE_TILE_SIZE, {
      onLevelComplete,
      onProgressUpdate,
      onGameOver,
      onLivesUpdate,
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
  }, [level, onLevelComplete, onProgressUpdate, onGameOver, onLivesUpdate]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = performance.now() - start.time;
    const distance = Math.hypot(dx, dy);

    if (elapsed > 320 || distance < 24) return;

    event.preventDefault();

    if (Math.abs(dx) > Math.abs(dy)) {
      engineRef.current?.queueSwipe(dx > 0 ? 1 : -1, 0);
    } else {
      engineRef.current?.queueSwipe(0, dy > 0 ? 1 : -1);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="block rounded-xl overflow-hidden"
      style={{
        width: level.width * BASE_TILE_SIZE * scale,
        height: level.height * BASE_TILE_SIZE * scale,
        boxShadow: '0 0 60px rgba(168, 85, 247, 0.08), 0 0 120px rgba(0, 0, 0, 0.5)',
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="block origin-top-left"
        style={{
          imageRendering: 'pixelated',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}
