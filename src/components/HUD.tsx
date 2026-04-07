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
  bestMoves?: number | null;
  isNewBest?: boolean;
  gameOver: boolean;
  gameOverReason: 'lives' | 'moves' | null;
  canGoNext: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
  simulationSpeed?: number;
  nextSimulationSpeed?: number;
  onToggleSimulationSpeed?: () => void;
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

export default function HUD({ levelId, levelName, sourceLabel, levelComplete, settledUnits, totalUnits, completionTime, lives, maxLives, movesUsed, maxMoves, bestMoves = null, isNewBest = false, gameOver, gameOverReason, canGoNext, onRestart, onNextLevel, simulationSpeed = 1, nextSimulationSpeed, onToggleSimulationSpeed, showBar = true, showOverlays = true }: HUDProps) {
  const displayName = levelName || `Level ${String(levelId).padStart(2, '0')}`;
  const nextSpeedLabel = `${(nextSimulationSpeed ?? (simulationSpeed > 1 ? 1 : 2)).toFixed(0)}x`;
  const isWarningSource = sourceLabel?.toLowerCase().includes('warning') ?? false;
  const doneAccentClass = settledUnits === totalUnits
    ? 'border-green-400/40 bg-green-500/12 text-green-300'
    : 'border-amber-400/40 bg-amber-500/12 text-amber-200';
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <div className="flex justify-start">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRestart}
                    className="text-white/55 hover:text-white text-xs px-3 py-2 border border-white/10 rounded-lg hover:border-white/25 hover:bg-white/5 transition-all duration-200"
                  >
                    Restart
                  </button>
                  {onToggleSimulationSpeed && (
                    <button
                      onClick={onToggleSimulationSpeed}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] shadow-sm transition-all duration-200 ${
                        simulationSpeed > 1
                          ? 'border-cyan-300/55 bg-cyan-400/20 text-cyan-50 shadow-cyan-500/10 hover:bg-cyan-400/28'
                          : 'border-amber-200/30 bg-amber-400/10 text-amber-100/80 hover:border-amber-200/45 hover:bg-amber-400/16 hover:text-amber-50'
                      }`}
                      aria-label={`Set simulation speed to ${nextSpeedLabel}`}
                    >
                      <span className="text-white/40">Speed</span>
                      <span>{simulationSpeed.toFixed(0)}x</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 flex-col items-center gap-2">
                <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <span className="truncate text-center text-lg font-black tracking-[0.08em] text-white/90 sm:text-2xl lg:text-3xl">
                    {displayName}
                  </span>
                  {maxMoves === null && (
                    <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/28 sm:text-xs">
                      Moves {movesUsed}
                    </span>
                  )}
                  <span className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] sm:text-sm ${doneAccentClass}`}>
                    Done {settledUnits}/{totalUnits}
                  </span>
                  {maxMoves !== null && (
                    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs ${
                      movesUsed >= maxMoves
                        ? 'border-red-400/40 bg-red-500/12 text-red-200'
                        : 'border-amber-400/30 bg-amber-500/10 text-amber-200/80'
                    }`}>
                      Moves {movesUsed}/{maxMoves}
                    </span>
                  )}
                  {bestMoves !== null && (
                    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] sm:text-xs ${
                      isNewBest
                        ? 'border-cyan-300/50 bg-cyan-400/15 text-cyan-100'
                        : 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100/70'
                    }`}>
                      {isNewBest ? 'New Best' : `Best ${bestMoves}`}
                    </span>
                  )}
                </div>
                {sourceLabel && (
                  <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                    isWarningSource
                      ? 'border-amber-400/40 bg-amber-500/10 text-amber-200/80'
                      : 'border-white/10 bg-white/[0.04] text-white/45'
                  }`}>
                    {sourceLabel}
                  </span>
                )}
                <p className="text-center text-[10px] uppercase tracking-[0.18em] text-white/20">
                  {keyHint}
                </p>
              </div>

              <div className="flex justify-center sm:justify-end">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {maxLives <= 4 ? (
                    Array.from({ length: maxLives }, (_, i) => (
                      <span
                        key={i}
                        className={`text-2xl transition-all duration-300 sm:text-3xl ${
                          i < lives ? 'opacity-100 scale-100' : 'opacity-25 scale-90'
                        }`}
                        style={{ color: i < lives ? '#ff5064' : 'rgba(255,255,255,0.3)' }}
                      >
                        {i < lives ? '\u2764' : '\u2661'}
                      </span>
                    ))
                  ) : (
                    <span className={`flex items-center gap-2 text-lg font-black tracking-[0.08em] sm:text-2xl ${
                      lives <= 1 ? 'text-red-300' : 'text-white/80'
                    }`}>
                      <span style={{ color: '#ff5064' }}>{'\u2764'}</span>
                      <span>{lives}/{maxLives}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
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
            <p className={`-mt-5 mb-8 text-sm font-black uppercase tracking-[0.2em] ${
              isNewBest ? 'text-cyan-200' : 'text-white/35'
            }`}>
              {bestMoves !== null
                ? isNewBest
                  ? `New best: ${bestMoves} moves`
                  : `Best: ${bestMoves} moves`
                : `${movesUsed} moves`}
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
