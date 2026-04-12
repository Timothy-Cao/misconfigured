type SfxId =
  | 'uiHover'
  | 'uiClick'
  | 'levelFinish'
  | 'move'
  | 'rotate'
  | 'bump'
  | 'push'
  | 'plate'
  | 'switch'
  | 'doorOpen'
  | 'doorClose'
  | 'ice'
  | 'conveyor'
  | 'crumble'
  | 'reverse'
  | 'repaint'
  | 'filter'
  | 'checkpoint'
  | 'goal'
  | 'blackhole'
  | 'death'
  | 'life'
  | 'sticky';

interface SfxDef {
  kind: 'tone' | 'noise';
  type?: OscillatorType;
  freq?: number;
  freq2?: number;
  duration: number;
  gain: number;
  attack?: number;
  decay?: number;
  cooldown: number;
}

interface SampleDef {
  kind: 'sample';
  src: string;
  volume: number;
  cooldown: number;
}

const SFX_VOLUME_KEY = 'misconfigured-sfx-volume';
const DEFAULT_SFX_VOLUME = 0.35;
const SFX_OUTPUT_BOOST = 2.2;
const volumeListeners = new Set<(volume: number) => void>();

const SFX: Record<Exclude<SfxId, 'levelFinish'>, SfxDef> = {
  uiHover: { kind: 'tone', type: 'sine', freq: 920, freq2: 980, duration: 0.035, gain: 0.03, cooldown: 80 },
  uiClick: { kind: 'tone', type: 'triangle', freq: 520, freq2: 420, duration: 0.06, gain: 0.04, cooldown: 80 },
  move: { kind: 'tone', type: 'triangle', freq: 220, freq2: 260, duration: 0.07, gain: 0.075, cooldown: 50 },
  rotate: { kind: 'tone', type: 'triangle', freq: 480, freq2: 720, duration: 0.09, gain: 0.06, cooldown: 100 },
  bump: { kind: 'tone', type: 'square', freq: 140, freq2: 110, duration: 0.09, gain: 0.07, cooldown: 90 },
  push: { kind: 'tone', type: 'sawtooth', freq: 170, freq2: 120, duration: 0.12, gain: 0.08, cooldown: 120 },
  plate: { kind: 'tone', type: 'sine', freq: 520, freq2: 420, duration: 0.08, gain: 0.06, cooldown: 80 },
  switch: { kind: 'tone', type: 'square', freq: 700, freq2: 520, duration: 0.08, gain: 0.06, cooldown: 120 },
  doorOpen: { kind: 'tone', type: 'sawtooth', freq: 260, freq2: 360, duration: 0.16, gain: 0.07, cooldown: 140 },
  doorClose: { kind: 'tone', type: 'sawtooth', freq: 360, freq2: 220, duration: 0.16, gain: 0.07, cooldown: 140 },
  ice: { kind: 'tone', type: 'triangle', freq: 820, freq2: 620, duration: 0.06, gain: 0.05, cooldown: 90 },
  conveyor: { kind: 'tone', type: 'square', freq: 280, freq2: 240, duration: 0.06, gain: 0.04, cooldown: 120 },
  crumble: { kind: 'noise', duration: 0.14, gain: 0.08, cooldown: 160 },
  reverse: { kind: 'tone', type: 'triangle', freq: 560, freq2: 760, duration: 0.1, gain: 0.06, cooldown: 160 },
  repaint: { kind: 'tone', type: 'sine', freq: 780, freq2: 520, duration: 0.12, gain: 0.06, cooldown: 160 },
  filter: { kind: 'tone', type: 'sine', freq: 640, freq2: 520, duration: 0.08, gain: 0.05, cooldown: 160 },
  checkpoint: { kind: 'tone', type: 'triangle', freq: 520, freq2: 680, duration: 0.12, gain: 0.06, cooldown: 200 },
  goal: { kind: 'tone', type: 'triangle', freq: 640, freq2: 820, duration: 0.14, gain: 0.07, cooldown: 220 },
  blackhole: { kind: 'tone', type: 'sine', freq: 220, freq2: 120, duration: 0.2, gain: 0.07, cooldown: 240 },
  death: { kind: 'noise', duration: 0.18, gain: 0.09, cooldown: 220 },
  life: { kind: 'tone', type: 'sine', freq: 880, freq2: 1040, duration: 0.14, gain: 0.07, cooldown: 240 },
  sticky: { kind: 'tone', type: 'square', freq: 180, freq2: 140, duration: 0.08, gain: 0.06, cooldown: 160 },
};

const SAMPLE_SFX: Record<'levelFinish', SampleDef> = {
  levelFinish: {
    kind: 'sample',
    src: '/level_finish.mp3',
    volume: 0.55,
    cooldown: 600,
  },
};

class SfxEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastPlayed = new Map<SfxId, number>();
  private volume = DEFAULT_SFX_VOLUME;

  private canUseAudio(): boolean {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  }

  private ensureContext(): AudioContext | null {
    if (!this.canUseAudio()) return null;
    this.getVolume();
    if (!this.ctx) {
      const Ctx = (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  play(id: SfxId): void {
    if (id === 'levelFinish') {
      this.playSample(id);
      return;
    }

    const def = SFX[id];
    const nowMs = performance.now();
    const last = this.lastPlayed.get(id) ?? 0;
    if (nowMs - last < def.cooldown) return;
    this.lastPlayed.set(id, nowMs);

    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;

    const now = ctx.currentTime;
    const attack = def.attack ?? 0.01;
    const decay = def.decay ?? def.duration;
    const boostedGain = Math.min(0.35, def.gain * SFX_OUTPUT_BOOST);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(boostedGain, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    gain.connect(this.master);

    if (def.kind === 'noise') {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * def.duration, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      src.start(now);
      src.stop(now + def.duration);
      return;
    }

    const osc = ctx.createOscillator();
    osc.type = def.type ?? 'sine';
    if (def.freq) {
      osc.frequency.setValueAtTime(def.freq, now);
    }
    if (def.freq2) {
      osc.frequency.exponentialRampToValueAtTime(def.freq2, now + def.duration);
    }
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + def.duration);
  }

  private playSample(id: 'levelFinish'): void {
    const def = SAMPLE_SFX[id];
    const nowMs = performance.now();
    const last = this.lastPlayed.get(id) ?? 0;
    if (nowMs - last < def.cooldown) return;
    this.lastPlayed.set(id, nowMs);

    if (typeof window === 'undefined') {
      return;
    }

    const audio = new Audio(def.src);
    audio.volume = Math.max(0, Math.min(1, this.getVolume() * def.volume));
    void audio.play().catch(() => {});
  }

  getVolume(): number {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(SFX_VOLUME_KEY);
      if (raw !== null) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          this.volume = Math.max(0, Math.min(1, parsed));
        }
      }
    }
    return this.volume;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SFX_VOLUME_KEY, String(this.volume));
    }
    if (this.master) {
      this.master.gain.value = this.volume;
    }
    for (const listener of volumeListeners) {
      listener(this.volume);
    }
  }
}

const engine = new SfxEngine();

export function playSfx(id: SfxId): void {
  engine.play(id);
}

export function getSfxVolume(): number {
  return engine.getVolume();
}

export function setSfxVolume(volume: number): void {
  engine.setVolume(volume);
}

export function subscribeToSfxVolume(listener: (volume: number) => void): () => void {
  volumeListeners.add(listener);
  listener(engine.getVolume());
  return () => {
    volumeListeners.delete(listener);
  };
}
