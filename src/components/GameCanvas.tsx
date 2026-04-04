'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '@/engine/GameEngine';
import { type LevelData } from '@/engine/types';

const BASE_TILE_SIZE = 40;
const MIN_SCALE = 0.35;
const MAX_SCALE = 2.5;

interface GameCanvasProps {
  level: LevelData;
  onLevelComplete: (completionTime: number) => void;
  onProgressUpdate?: (settledUnits: number) => void;
  onGameOver?: (reason: 'lives' | 'moves') => void;
  onLivesUpdate?: (lives: number, maxLives: number) => void;
  onMovesUpdate?: (movesUsed: number, maxMoves: number | null) => void;
  autoRestartOnGameOver?: boolean;
  captureGlobalMobileSwipes?: boolean;
  simulationSpeed?: number;
}

export default function GameCanvas({
  level,
  onLevelComplete,
  onProgressUpdate,
  onGameOver,
  onLivesUpdate,
  onMovesUpdate,
  autoRestartOnGameOver = true,
  captureGlobalMobileSwipes = false,
  simulationSpeed = 1,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const onLevelCompleteRef = useRef(onLevelComplete);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onGameOverRef = useRef(onGameOver);
  const onLivesUpdateRef = useRef(onLivesUpdate);
  const onMovesUpdateRef = useRef(onMovesUpdate);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const clearTimeoutRef = useRef<number | null>(null);
  const restartHideTimeoutRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);
  const [showClearFlash, setShowClearFlash] = useState(false);
  const [showRestartFlash, setShowRestartFlash] = useState(false);
  const [restartFlashKey, setRestartFlashKey] = useState(0);

  const queueSwipeFromDelta = useCallback((dx: number, dy: number) => {
    if (Math.abs(dx) > Math.abs(dy)) {
      engineRef.current?.queueSwipe(dx > 0 ? 1 : -1, 0);
    } else {
      engineRef.current?.queueSwipe(0, dy > 0 ? 1 : -1);
    }
  }, []);

  const recordTouchStart = useCallback((x: number, y: number) => {
    touchStartRef.current = {
      x,
      y,
      time: performance.now(),
    };
  }, []);

  const handleTouchFinish = useCallback((x: number, y: number) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return false;

    const dx = x - start.x;
    const dy = y - start.y;
    const elapsed = performance.now() - start.time;
    const distance = Math.hypot(dx, dy);

    if (elapsed > 320 || distance < 24) {
      return false;
    }

    queueSwipeFromDelta(dx, dy);
    return true;
  }, [queueSwipeFromDelta]);

  useEffect(() => {
    onLevelCompleteRef.current = onLevelComplete;
  }, [onLevelComplete]);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    onLivesUpdateRef.current = onLivesUpdate;
  }, [onLivesUpdate]);

  useEffect(() => {
    onMovesUpdateRef.current = onMovesUpdate;
  }, [onMovesUpdate]);

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current !== null) {
        window.clearTimeout(clearTimeoutRef.current);
      }
      if (restartHideTimeoutRef.current !== null) {
        window.clearTimeout(restartHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!captureGlobalMobileSwipes) {
      return;
    }

    const isProbablyMobile =
      window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

    if (!isProbablyMobile) {
      return;
    }

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest('button, a, input, select, textarea, label, [role="button"], [data-no-global-swipe]')
      );

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) {
        return;
      }

      const touch = event.touches[0];
      recordTouchStart(touch.clientX, touch.clientY);
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.changedTouches.length !== 1 || isInteractiveTarget(event.target)) {
        touchStartRef.current = null;
        return;
      }

      const touch = event.changedTouches[0];
      const handled = handleTouchFinish(touch.clientX, touch.clientY);
      if (handled) {
        event.preventDefault();
      }
    };

    const onTouchCancel = () => {
      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchCancel);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [captureGlobalMobileSwipes, handleTouchFinish, recordTouchStart]);

  // Compute scale so the canvas fills available space without distorting
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const parent = wrapper?.parentElement;
    if (!wrapper || !parent) {
      return;
    }

    function computeScale() {
      const currentWrapper = wrapperRef.current;
      if (!currentWrapper) {
        return;
      }
      const parentElement = currentWrapper.parentElement;
      if (!parentElement) {
        return;
      }
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const parentRect = parentElement.getBoundingClientRect();
      const horizontalPadding = 8;
      const verticalPadding = 12;
      const measuredParentWidth = parentElement.clientWidth;
      const measuredParentHeight = parentElement.clientHeight;
      const maxW = Math.max(
        BASE_TILE_SIZE,
        Math.min(measuredParentWidth || viewportWidth, viewportWidth) - horizontalPadding * 2,
      );
      const maxH = Math.max(
        BASE_TILE_SIZE,
        (
          measuredParentHeight > BASE_TILE_SIZE
            ? measuredParentHeight
            : viewportHeight - Math.max(parentRect.top, 0)
        ) - verticalPadding * 2,
      );
      const nativeW = level.width * BASE_TILE_SIZE;
      const nativeH = level.height * BASE_TILE_SIZE;
      const nextScale = Math.min(maxW / nativeW, maxH / nativeH, MAX_SCALE);
      setScale(Math.max(MIN_SCALE, nextScale));
    }

    computeScale();
    window.addEventListener('resize', computeScale);
    window.visualViewport?.addEventListener('resize', computeScale);
    window.visualViewport?.addEventListener('scroll', computeScale);

    const resizeObserver = new ResizeObserver(() => computeScale());
    resizeObserver.observe(parent);

    return () => {
      window.removeEventListener('resize', computeScale);
      window.visualViewport?.removeEventListener('resize', computeScale);
      window.visualViewport?.removeEventListener('scroll', computeScale);
      resizeObserver.disconnect();
    };
  }, [level.width, level.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, level, BASE_TILE_SIZE, {
      onLevelComplete: (completionTime) => {
        setShowClearFlash(true);
        if (clearTimeoutRef.current !== null) {
          window.clearTimeout(clearTimeoutRef.current);
        }
        clearTimeoutRef.current = window.setTimeout(() => {
          setShowClearFlash(false);
          clearTimeoutRef.current = null;
        }, 900);
        onLevelCompleteRef.current(completionTime);
      },
      onProgressUpdate: onProgressUpdateRef.current,
      onGameOver: (reason) => {
        if (!autoRestartOnGameOver) {
          onGameOverRef.current?.(reason);
          return;
        }

        engine.restart();
        onProgressUpdateRef.current?.(0);
        const startingLives = level.lives ?? 1;
        onLivesUpdateRef.current?.(startingLives, startingLives);
        onMovesUpdateRef.current?.(0, level.maxMoves ?? null);

        setShowRestartFlash(true);
        setRestartFlashKey(current => current + 1);
        if (restartHideTimeoutRef.current !== null) {
          window.clearTimeout(restartHideTimeoutRef.current);
        }

        restartHideTimeoutRef.current = window.setTimeout(() => {
          setShowRestartFlash(false);
          restartHideTimeoutRef.current = null;
        }, 3000);
      },
      onLivesUpdate: (lives, maxLives) => onLivesUpdateRef.current?.(lives, maxLives),
      onMovesUpdate: (movesUsed, maxMoves) => onMovesUpdateRef.current?.(movesUsed, maxMoves),
    }, {
      speedMultiplier: simulationSpeed,
    });
    engineRef.current = engine;
    engine.start();
    onMovesUpdateRef.current?.(0, level.maxMoves ?? null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        engine.restart();
        onProgressUpdateRef.current?.(0);
        const startingLives = level.lives ?? 1;
        onLivesUpdateRef.current?.(startingLives, startingLives);
        onMovesUpdateRef.current?.(0, level.maxMoves ?? null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      engine.stop();
      window.removeEventListener('keydown', handleKeyDown);
      engineRef.current = null;
    };
  }, [autoRestartOnGameOver, level, simulationSpeed]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    recordTouchStart(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const handled = handleTouchFinish(touch.clientX, touch.clientY);
    if (handled) {
      event.preventDefault();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative block rounded-xl overflow-hidden"
      style={{
        width: level.width * BASE_TILE_SIZE * scale,
        height: level.height * BASE_TILE_SIZE * scale,
        boxShadow: '0 0 60px rgba(168, 85, 247, 0.08), 0 0 120px rgba(0, 0, 0, 0.5)',
        touchAction: 'none',
      }}
      onTouchStart={captureGlobalMobileSwipes ? undefined : handleTouchStart}
      onTouchEnd={captureGlobalMobileSwipes ? undefined : handleTouchEnd}
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
      {showClearFlash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
          <div className="animate-[fadeIn_0.18s_ease-out]">
            <div className="rounded-2xl border border-green-300/20 bg-black/45 px-8 py-5 backdrop-blur-sm shadow-[0_0_30px_rgba(74,222,128,0.18)]">
              <div className="text-center text-4xl sm:text-5xl font-black tracking-wide text-transparent bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text">
                Clear!
              </div>
            </div>
          </div>
        </div>
      )}
      {showRestartFlash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            key={restartFlashKey}
            className="text-center animate-[levelTitleFade_3s_ease-in-out_forwards]"
          >
            <div className="text-3xl sm:text-4xl font-black text-white/35 drop-shadow-[0_0_18px_rgba(255,255,255,0.16)]">
              {level.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
