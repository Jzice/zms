/* ==================== 仙侠音效（WebAudio 振荡器，无外部资源） ==================== */

let ctx: AudioContext | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function setSound(on: boolean): void {
  enabled = on;
}
export function isSoundOn(): boolean {
  return enabled;
}

type ToneKind = 'play' | 'hit' | 'heal' | 'wudao' | 'breakthrough' | 'backlash' | 'win' | 'lose' | 'click';

const TONES: Record<ToneKind, { f: number; d: number; type: OscillatorType; g: number }> = {
  play: { f: 520, d: 0.09, type: 'triangle', g: 0.06 },
  hit: { f: 150, d: 0.16, type: 'sawtooth', g: 0.08 },
  heal: { f: 680, d: 0.18, type: 'sine', g: 0.06 },
  wudao: { f: 880, d: 0.3, type: 'sine', g: 0.05 },
  breakthrough: { f: 1040, d: 0.4, type: 'triangle', g: 0.08 },
  backlash: { f: 90, d: 0.35, type: 'square', g: 0.09 },
  win: { f: 780, d: 0.5, type: 'triangle', g: 0.08 },
  lose: { f: 180, d: 0.5, type: 'sine', g: 0.08 },
  click: { f: 660, d: 0.05, type: 'sine', g: 0.04 },
};

export function sfx(kind: ToneKind): void {
  if (!enabled) return;
  const a = ac();
  if (!a) return;
  try {
    const t = TONES[kind];
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = t.type;
    osc.frequency.value = t.f;
    gain.gain.setValueAtTime(t.g, a.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t.d);
    osc.connect(gain).connect(a.destination);
    osc.start();
    osc.stop(a.currentTime + t.d);
  } catch {
    /* 音频不可用时静默降级 */
  }
}
