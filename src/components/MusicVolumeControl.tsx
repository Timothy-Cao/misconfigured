'use client';

import { useEffect, useState } from 'react';
import { getSfxVolume, setSfxVolume, subscribeToSfxVolume } from '@/engine/sfx';
import {
  activateMusicPlayback,
  getMusicVolume,
  isMusicActivated,
  setMusicVolume,
  subscribeToMusicActivation,
  subscribeToMusicVolume,
} from '@/engine/music';

export default function MusicVolumeControl() {
  const [musicVolume, setMusicVolumeState] = useState(() => Math.round(getMusicVolume() * 100));
  const [sfxVolume, setSfxVolumeState] = useState(() => Math.round(getSfxVolume() * 100));
  const [activated, setActivated] = useState(() => isMusicActivated());

  useEffect(() => {
    const unsubscribeMusicVolume = subscribeToMusicVolume((nextVolume) => {
      setMusicVolumeState(Math.round(nextVolume * 100));
    });
    const unsubscribeSfxVolume = subscribeToSfxVolume((nextVolume) => {
      setSfxVolumeState(Math.round(nextVolume * 100));
    });
    const unsubscribeActivation = subscribeToMusicActivation((nextActivated) => {
      setActivated(nextActivated);
    });

    return () => {
      unsubscribeMusicVolume();
      unsubscribeSfxVolume();
      unsubscribeActivation();
    };
  }, []);

  return (
    <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 sm:px-5">
      <div className="space-y-4">
        <div>
          <div className="mb-2 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              Music
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={musicVolume}
            onChange={(event) => {
              const nextVolume = Number(event.target.value);
              setMusicVolumeState(nextVolume);
              setMusicVolume(nextVolume / 100);
              if (!activated && nextVolume > 0) {
                activateMusicPlayback();
              }
            }}
            className="w-full accent-cyan-300"
            aria-label="Adjust music volume"
          />
        </div>

        <div>
          <div className="mb-2 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              SFX
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={sfxVolume}
            onChange={(event) => {
              const nextVolume = Number(event.target.value);
              setSfxVolumeState(nextVolume);
              setSfxVolume(nextVolume / 100);
            }}
            className="w-full accent-amber-300"
            aria-label="Adjust sound effects volume"
          />
        </div>
      </div>
    </div>
  );
}
