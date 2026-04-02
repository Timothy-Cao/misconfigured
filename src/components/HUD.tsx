'use client';

import Link from 'next/link';
import { COLORS } from '@/engine/types';

interface HUDProps {
  levelId: number;
  levelName?: string;
  levelComplete: boolean;
  playersOnGoals: number;
  completionTime: number;
  onRestart: () => void;
  onNextLevel: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return m > 0
    ? `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
    : `${s}.${String(ms).padStart(2, '0')}s`;
}

export default function HUD({ levelId, levelName, levelComplete, playersOnGoals, completionTime, onRestart, onNextLevel }: HUDProps) {
  const displayName = levelName || `Level ${String(levelId).padStart(2, '0')}`;

  return (
    <>
      {/* Header bar — positioned above the canvas */}
      <div className="absolute -top-11 left-0 right-0 flex items-center justify-between px-1">
        <div className="flex gap-2 items-center">
          <Link
            href="/"
            className="text-white/40 hover:text-white text-xs px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/25 hover:bg-white/5 transition-all duration-200 backdrop-blur-sm"
          >
            Menu
          </Link>
          <Link
            href="/levels"
            className="text-white/40 hover:text-white text-xs px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/25 hover:bg-white/5 transition-all duration-200 backdrop-blur-sm"
          >
            Levels
          </Link>
        </div>

        <span className="text-white/60 text-sm font-mono tracking-wider">
          {displayName}
        </span>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm transition-all duration-300"
                  style={{
                    backgroundColor: i < playersOnGoals ? COLORS.players[i] : 'rgba(255,255,255,0.08)',
                    boxShadow: i < playersOnGoals ? `0 0 8px ${COLORS.players[i]}60` : 'none',
                  }}
                />
              ))}
            </div>
            <span className={`text-xs font-mono tracking-wider transition-colors duration-300 ${
              playersOnGoals === 4 ? 'text-green-400' : 'text-white/40'
            }`}>
              {playersOnGoals}/4
            </span>
          </div>

          <button
            onClick={onRestart}
            className="text-white/40 hover:text-white text-xs px-3 py-1.5 border border-white/10 rounded-lg hover:border-white/25 hover:bg-white/5 transition-all duration-200 backdrop-blur-sm"
          >
            Restart
            <span className="ml-1.5 text-white/20 text-[10px]">R</span>
          </button>
        </div>
      </div>

      {/* Level complete overlay */}
      {levelComplete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.4s_ease-out]">
          <div className="text-center animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
            <div className="text-green-400 text-sm font-mono tracking-widest uppercase mb-2 animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
              Complete
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text text-transparent mb-2">
              {displayName}
            </h2>
            <p className="text-white/50 font-mono text-lg mb-8 animate-[fadeInUp_0.5s_ease-out_0.25s_both]">
              {formatTime(completionTime)}
            </p>
            <div className="flex gap-3 justify-center animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
              <button
                onClick={onNextLevel}
                className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]"
              >
                Next Level
              </button>
              <Link
                href="/levels"
                className="px-6 py-2.5 border border-white/15 text-white/70 rounded-lg hover:bg-white/5 hover:border-white/25 transition-all duration-200"
              >
                Levels
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
