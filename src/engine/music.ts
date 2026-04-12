const MUSIC_VOLUME_KEY = 'misconfigured-music-volume';
const DEFAULT_MUSIC_VOLUME = 0.2;

const volumeListeners = new Set<(volume: number) => void>();
const activationListeners = new Set<(active: boolean) => void>();

let musicVolume = DEFAULT_MUSIC_VOLUME;
let musicActivated = false;
let initialized = false;

function notifyVolume(): void {
  for (const listener of volumeListeners) {
    listener(musicVolume);
  }
}

function notifyActivation(): void {
  for (const listener of activationListeners) {
    listener(musicActivated);
  }
}

function initializeFromStorage(): void {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;

  try {
    const raw = window.localStorage.getItem(MUSIC_VOLUME_KEY);
    if (raw !== null) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        musicVolume = Math.max(0, Math.min(1, parsed));
      }
    }
  } catch {
    // Ignore storage failures and keep defaults.
  }
}

export function getMusicVolume(): number {
  initializeFromStorage();
  return musicVolume;
}

export function setMusicVolume(volume: number): void {
  initializeFromStorage();
  musicVolume = Math.max(0, Math.min(1, volume));

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
    } catch {
      // Ignore storage failures; volume still updates for this session.
    }
  }

  notifyVolume();
}

export function subscribeToMusicVolume(listener: (volume: number) => void): () => void {
  initializeFromStorage();
  volumeListeners.add(listener);
  listener(musicVolume);
  return () => {
    volumeListeners.delete(listener);
  };
}

export function isMusicActivated(): boolean {
  return musicActivated;
}

export function activateMusicPlayback(): void {
  if (musicActivated) {
    return;
  }

  musicActivated = true;
  notifyActivation();
}

export function subscribeToMusicActivation(listener: (active: boolean) => void): () => void {
  activationListeners.add(listener);
  listener(musicActivated);
  return () => {
    activationListeners.delete(listener);
  };
}
