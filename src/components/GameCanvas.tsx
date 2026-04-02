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
