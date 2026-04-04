type SfxId =
  | 'uiHover'
  | 'uiClick'
  | 'move'
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

const SFX: Record<SfxId, SfxDef> = {
  uiHover: { kind: 'tone', type: 'sine', freq: 920, freq2: 980, duration: 0.035, gain: 0.03, cooldown: 80 },
  uiClick: { kind: 'tone', type: 'triangle', freq: 520, freq2: 420, duration: 0.06, gain: 0.04, cooldown: 80 },
  move: { kind: 'tone', type: 'triangle', freq: 220, freq2: 260, duration: 0.07, gain: 0.06, cooldown: 50 },
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

class SfxEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastPlayed = new Map<SfxId, number>();

  private canUseAudio(): boolean {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  }

  private ensureContext(): AudioContext | null {
    if (!this.canUseAudio()) return null;
    if (!this.ctx) {
      const Ctx = (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.12;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  play(id: SfxId): void {
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

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(def.gain, now + attack);
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
}

const engine = new SfxEngine();

export function playSfx(id: SfxId): void {
  engine.play(id);
}
