'use client';

import { useEffect, useRef, useState } from 'react';
import {
  activateMusicPlayback,
  getAppliedMusicVolume,
  isMusicActivated,
  subscribeToMusicActivation,
  subscribeToMusicVolume,
} from '@/engine/music';

const PLAYLIST = ['/neon%20puzzle%201.mp3', '/neon%20puzzle%202.mp3'] as const;

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef(0);
  const intentionalPauseRef = useRef(false);
  const [activated, setActivated] = useState(() => isMusicActivated());

  useEffect(() => {
    return subscribeToMusicVolume((volume) => {
      if (audioRef.current) {
        audioRef.current.volume = volume * 0.25;
      }
    });
  }, []);

  useEffect(() => {
    return subscribeToMusicActivation((nextActivated) => {
      setActivated(nextActivated);
    });
  }, []);

  useEffect(() => {
    function unlockPlayback() {
      activateMusicPlayback();
    }

    window.addEventListener('pointerdown', unlockPlayback, { passive: true });
    window.addEventListener('keydown', unlockPlayback);
    window.addEventListener('touchstart', unlockPlayback, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlockPlayback);
      window.removeEventListener('keydown', unlockPlayback);
      window.removeEventListener('touchstart', unlockPlayback);
    };
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }
    const player = audioElement;

    player.volume = getAppliedMusicVolume();
    player.src = PLAYLIST[trackIndexRef.current] ?? PLAYLIST[0];

    function handleEnded() {
      trackIndexRef.current = (trackIndexRef.current + 1) % PLAYLIST.length;
      player.src = PLAYLIST[trackIndexRef.current] ?? PLAYLIST[0];
      if (activated) {
        void player.play().catch(() => {});
      }
    }

    player.addEventListener('ended', handleEnded);

    return () => {
      player.removeEventListener('ended', handleEnded);
    };
  }, [activated]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activated) {
      return;
    }

    audio.volume = getAppliedMusicVolume();
    void audio.play().catch(() => {});
  }, [activated]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const player = audio;

    function resumeIfActive() {
      if (!activated || document.visibilityState !== 'visible') {
        return;
      }

      intentionalPauseRef.current = false;
      player.volume = getAppliedMusicVolume();
      void player.play().catch(() => {});
    }

    function pauseForInactivity() {
      intentionalPauseRef.current = true;
      player.pause();
    }

    function syncPlaybackToPageState() {
      if (document.visibilityState === 'hidden') {
        pauseForInactivity();
        return;
      }

      resumeIfActive();
    }

    function handlePageHide() {
      pauseForInactivity();
    }

    function handleUnexpectedPause() {
      if (intentionalPauseRef.current) {
        intentionalPauseRef.current = false;
        return;
      }

      if (document.visibilityState !== 'visible') {
        return;
      }

      window.setTimeout(() => {
        resumeIfActive();
      }, 0);
    }

    document.addEventListener('visibilitychange', syncPlaybackToPageState);
    window.addEventListener('pageshow', resumeIfActive);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', resumeIfActive);
    player.addEventListener('pause', handleUnexpectedPause);

    return () => {
      document.removeEventListener('visibilitychange', syncPlaybackToPageState);
      window.removeEventListener('pageshow', resumeIfActive);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', resumeIfActive);
      player.removeEventListener('pause', handleUnexpectedPause);
    };
  }, [activated]);

  return <audio ref={audioRef} preload="auto" aria-hidden="true" hidden />;
}
