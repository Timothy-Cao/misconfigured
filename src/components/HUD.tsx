'use client';

interface HUDProps {
  levelId: number;
  levelName?: string;
  sourceLabel?: string;
  levelComplete: boolean;
  settledUnits: number;
  totalUnits: number;
  completionTime: number;
  lives: number;
  maxLives: number;
  movesUsed: number;
  maxMoves: number | null;
  gameOver: boolean;
  gameOverReason: 'lives' | 'moves' | null;
  canGoNext: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
  showBar?: boolean;
  showOverlays?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return m > 0
    ? `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
    : `${s}.${String(ms).padStart(2, '0')}s`;
}

export default function HUD({ levelId, levelName, sourceLabel, levelComplete, settledUnits, totalUnits, completionTime, lives, maxLives, movesUsed, maxMoves, gameOver, gameOverReason, canGoNext, onRestart, onNextLevel, showBar = true, showOverlays = true }: HUDProps) {
  const displayName = levelName || `Level ${String(levelId).padStart(2, '0')}`;
  const keyHint = levelComplete
    ? 'Esc back, R restart, Enter or Space next'
    : gameOver
      ? (canGoNext ? 'Esc back, R restart, Enter or Space next' : 'Esc back, R restart, Enter or Space retry')
      : 'Esc back, R restart';

  return (
    <>
      {showBar && (
        <div className="w-full px-2 sm:px-1">
          <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3 backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onRestart}
                  className="text-white/55 hover:text-white text-xs px-3 py-2 border border-white/10 rounded-lg hover:border-white/25 hover:bg-white/5 transition-all duration-200"
                >
                  Restart
                  <span className="ml-1.5 text-white/20 text-[10px] hidden sm:inline">R</span>
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex flex-col gap-1 sm:gap-0 sm:flex-row sm:items-center sm:gap-3">
                    <span className="text-center text-sm font-mono tracking-wider text-white/70 sm:text-left">
                      {displayName}
                    </span>
                    {sourceLabel && (
                      <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/45">
                        {sourceLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-end">
                    <span className={`text-xs font-mono tracking-wider transition-colors duration-300 ${
                      settledUnits === totalUnits ? 'text-green-400' : 'text-white/40'
                    }`}>
                      Settled {settledUnits}/{totalUnits}
                    </span>

                    {maxMoves !== null && (
                      <span className={`text-xs font-mono tracking-wider transition-colors duration-300 ${
                        movesUsed >= maxMoves ? 'text-red-400' : 'text-white/40'
                      }`}>
                        Move Limit {movesUsed}/{maxMoves}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {maxLives <= 3 ? (
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
                        <span className="flex items-center gap-1 text-xs font-mono">
                          <span style={{ color: '#ff5064' }}>{'\u2764'}</span>
                          <span className={`tracking-wider ${lives <= 1 ? 'text-red-400' : 'text-white/50'}`}>
                            Lives {lives}/{maxLives}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                  {maxMoves !== null && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-200/70">
                      Move Limit
                    </span>
                  )}
                  <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-rose-200/70">
                    Lives
                  </span>
                </div>
                <p className="text-center text-[10px] uppercase tracking-[0.18em] text-white/20 sm:text-right">
                  {keyHint}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOverlays && maxMoves !== null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center text-5xl sm:text-7xl font-black tracking-[0.25em] text-white/10 whitespace-nowrap">
            MOVES {movesUsed}/{maxMoves}
          </div>
        </div>
      )}

      {showOverlays && gameOver && !levelComplete && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.4s_ease-out]">
          <div className="px-5 text-center animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
            <div className="text-red-400 text-sm font-mono tracking-widest uppercase mb-2 animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
              Game Over
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
              {gameOverReason === 'moves' ? 'Out of Moves' : 'No Lives Left'}
            </h2>
            <p className="text-white/40 font-mono text-sm mb-8 animate-[fadeInUp_0.5s_ease-out_0.25s_both]">
              {displayName}
            </p>
            <div className="flex flex-col gap-3 justify-center sm:flex-row animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
              <button
                onClick={onRestart}
                className="px-8 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:from-red-400 hover:to-orange-400 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              >
                Try Again
                <span className="ml-1.5 text-[11px] text-white/70">R</span>
              </button>
              {canGoNext && (
                <button
                  onClick={onNextLevel}
                  className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]"
                >
                  Next Level
                  <span className="ml-1.5 text-[11px] text-white/70">Enter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showOverlays && levelComplete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-[fadeIn_0.4s_ease-out]">
          <div className="px-5 text-center animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
            <div className="text-5xl font-black bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text text-transparent mb-2 animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
              Clear!
            </div>
            <h2 className="text-xl font-mono text-white/55 mb-3">
              {displayName}
            </h2>
            <p className="text-white/50 font-mono text-lg mb-8 animate-[fadeInUp_0.5s_ease-out_0.25s_both]">
              {formatTime(completionTime)}
            </p>
            <div className="flex flex-col gap-3 justify-center sm:flex-row animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
              <button
                onClick={onRestart}
                className="px-6 py-2.5 border border-white/15 text-white/70 rounded-lg hover:bg-white/5 hover:border-white/25 transition-all duration-200"
              >
                Restart
              </button>
              <button
                onClick={onNextLevel}
                className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-400 hover:to-emerald-400 transition-all duration-300 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)]"
              >
                Next Level
                <span className="ml-1.5 text-[11px] text-white/70">Enter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
