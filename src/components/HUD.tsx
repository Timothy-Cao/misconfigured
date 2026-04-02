'use client';

import Link from 'next/link';

interface HUDProps {
  levelId: number;
  levelComplete: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
}

export default function HUD({ levelId, levelComplete, onRestart, onNextLevel }: HUDProps) {
  return (
    <>
      {/* Top bar */}
      <div className="absolute top-4 left-4 flex gap-4 items-center">
        <Link
          href="/levels"
          className="text-white/60 hover:text-white text-sm px-3 py-1 border border-white/20 rounded"
        >
          Back
        </Link>
        <span className="text-white/80 text-sm font-mono">Level {levelId}</span>
      </div>

      <div className="absolute top-4 right-4">
        <button
          onClick={onRestart}
          className="text-white/60 hover:text-white text-sm px-3 py-1 border border-white/20 rounded"
        >
          Restart (R)
        </button>
      </div>

      {/* Level complete overlay */}
      {levelComplete && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Level Complete!</h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onNextLevel}
                className="px-6 py-2 bg-green-500 text-white rounded font-semibold hover:bg-green-400"
              >
                Next Level
              </button>
              <Link
                href="/levels"
                className="px-6 py-2 border border-white/40 text-white rounded hover:bg-white/10"
              >
                Level Select
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
