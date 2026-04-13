'use client';

import { useEffect, useState } from 'react';
import { getSfxVolume, playSfx, setSfxVolume, subscribeToSfxVolume } from '@/engine/sfx';

export default function AudioSettings() {
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(() => Math.round(getSfxVolume() * 100));

  useEffect(() => {
    return subscribeToSfxVolume((nextVolume) => {
      setVolume(Math.round(nextVolume * 100));
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[70]" data-no-global-swipe>
      {open && (
        <div className="mb-3 w-64 rounded-3xl border border-white/10 bg-[#12121a]/96 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                Audio
              </p>
              <p className="mt-1 text-sm text-white/75">
                Sound Effects
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-sm font-mono text-white/80">
              {volume}%
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={(event) => {
              const nextVolume = Number(event.target.value);
              setVolume(nextVolume);
              setSfxVolume(nextVolume / 100);
            }}
            onPointerUp={() => playSfx('uiHover')}
            className="w-full accent-amber-300"
            aria-label="Adjust sound effects volume"
          />

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setSfxVolume(0);
                playSfx('uiClick');
              }}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition-all duration-200 hover:bg-white/[0.08] hover:text-white"
            >
              Mute
            </button>
            <button
              type="button"
              onClick={() => {
                setSfxVolume(DEFAULT_RESET_VOLUME);
                playSfx('uiClick');
              }}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition-all duration-200 hover:bg-white/[0.08] hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          playSfx('uiClick');
        }}
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#12121a]/92 text-lg text-white/80 shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-[#1a1a24] hover:text-white"
        aria-label="Open audio settings"
      >
        <span aria-hidden="true">S</span>
      </button>
    </div>
  );
}

const DEFAULT_RESET_VOLUME = 60 / 100;
