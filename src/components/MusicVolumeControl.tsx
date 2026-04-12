'use client';

import { useEffect, useState } from 'react';
import {
  activateMusicPlayback,
  getMusicVolume,
  isMusicActivated,
  setMusicVolume,
  subscribeToMusicActivation,
  subscribeToMusicVolume,
} from '@/engine/music';

export default function MusicVolumeControl() {
  const [volume, setVolume] = useState(() => Math.round(getMusicVolume() * 100));
  const [activated, setActivated] = useState(() => isMusicActivated());

  useEffect(() => {
    const unsubscribeVolume = subscribeToMusicVolume((nextVolume) => {
      setVolume(Math.round(nextVolume * 100));
    });
    const unsubscribeActivation = subscribeToMusicActivation((nextActivated) => {
      setActivated(nextActivated);
    });

    return () => {
      unsubscribeVolume();
      unsubscribeActivation();
    };
  }, []);

  return (
    <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
            Music
          </p>
          <p className="mt-1 text-sm text-white/70 sm:text-base">
            Background soundtrack
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
          setMusicVolume(nextVolume / 100);
          if (!activated && nextVolume > 0) {
            activateMusicPlayback();
          }
        }}
        className="w-full accent-cyan-300"
        aria-label="Adjust music volume"
      />

      <p className="mt-3 text-left text-xs text-white/30">
        Loops both soundtrack tracks across the whole site. Default volume is quiet at 20%.
      </p>
    </div>
  );
}
