'use client';

import Link from 'next/link';

interface HUDProps {
  levelId: number;
  levelName?: string;
  levelComplete: boolean;
  settledUnits: number;
  totalUnits: number;
  completionTime: number;
  lives: number;
  maxLives: number;
  gameOver: boolean;
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

export default function HUD({ levelId, levelName, levelComplete, settledUnits, totalUnits, completionTime, lives, maxLives, gameOver, onRestart, onNextLevel }: HUDProps) {
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
            <span className={`text-xs font-mono tracking-wider transition-colors duration-300 ${
              settledUnits === totalUnits ? 'text-green-400' : 'text-white/40'
            }`}>
              Settled {settledUnits}/{totalUnits}
            </span>
          </div>

          {/* Lives display */}
          <div className="flex items-center gap-1">
            {maxLives <= 3 ? (
              // Show individual hearts
              Array.from({ length: maxLives }, (_, i) => (
                <span
                  key={i}
                  className={`text-sm transition-all duration-300 ${
                    i < lives ? 'opacity-100 scale-100' : 'opacity-25 scale-90'
                  }`}
                  style={{ color: i < lives ? '#ff5064' : 'rgba(255,255,255,0.3)' }}
                >
                  {i < lives ? '\u2764' : '\u2661'}
                </span>
              ))
            ) : (
              // Compact display
              <span className="flex items-center gap-1 text-xs font-mono">
                <span style={{ color: '#ff5064' }}>{'\u2764'}</span>
                <span className={`tracking-wider ${lives <= 1 ? 'text-red-400' : 'text-white/50'}`}>
                  x{lives}
                </span>
              </span>
            )}
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

      {/* Game over overlay */}
      {gameOver && !levelComplete && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.4s_ease-out]">
          <div className="text-center animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
            <div className="text-red-400 text-sm font-mono tracking-widest uppercase mb-2 animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
              Game Over
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
              No Lives Left
            </h2>
            <p className="text-white/40 font-mono text-sm mb-8 animate-[fadeInUp_0.5s_ease-out_0.25s_both]">
              {displayName}
            </p>
            <div className="flex gap-3 justify-center animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
              <button
                onClick={onRestart}
                className="px-8 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:from-red-400 hover:to-orange-400 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              >
                Try Again
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
