/* ==================== 仙侠音效（WebAudio 振荡器合成，无外部资源） ====================
 * 参考 learn_kill 的多音符序列音效体系，改用五声音阶（宫商角徵羽）与
 * 「古琴 / 编钟 / 剑鸣 / 风铃 / 法阵」音色，贴合修真气质。
 *
 * 约束：
 *   - 纯合成，零资源，bundled 单文件可离线；
 *   - isSim() 下静默（无头冒烟不产生音频）；
 *   - 对外仅暴露 sfx() / setSound() / isSoundOn()。
 */
import { isSim } from './dom';

export type SfxKind =
  | 'click'
  | 'toggle'
  /* 基本牌 */
  | 'draw'
  | 'play'
  | 'shengtong'
  | 'hushen'
  | 'lingdan'
  | 'lingyao'
  | 'discard'
  | 'equip'
  /* 符篆 / 阵法 / 秘术 */
  | 'trick'
  | 'trick_aoe'
  | 'trick_heal'
  | 'trick_delay'
  | 'trick_steal'
  | 'duel'
  /* 技能 / 成长 */
  | 'skill'
  | 'skill_fail'
  | 'wudao'
  | 'breakthrough'
  | 'backlash'
  | 'contract'
  /* 状态 */
  | 'hit'
  | 'heal'
  | 'judge'
  | 'death'
  | 'turn'
  | 'win'
  | 'lose';

let ctx: AudioContext | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        enabled = false;
        return null;
      }
      ctx = new Ctor();
    } catch {
      enabled = false;
      return null;
    }
  }
  if (ctx.state === 'suspended') {
    try {
      ctx.resume();
    } catch {
      /* ignore */
    }
  }
  return ctx;
}

/** 单音：频率 / 时长 / 波形 / 音量 / 延迟 */
function note(c: AudioContext, freq: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** 琶音：一串音符 */
function seq(c: AudioContext, freqs: number[], step: number, dur: number, type: OscillatorType, vol: number): void {
  freqs.forEach((f, i) => note(c, f, dur, type, vol, i * step));
}

export function setSound(on: boolean): void {
  enabled = !!on;
  if (enabled) ac();
}

export function isSoundOn(): boolean {
  return enabled;
}

export function sfx(kind: SfxKind): void {
  if (!enabled || isSim()) return;
  const c = ac();
  if (!c) return;
  try {
    const N = (f: number, d: number, tp: OscillatorType = 'sine', v = 0.1, delay = 0): void =>
      note(c, f, d, tp, v, delay);
    const S = (fs: number[], step: number, d: number, tp: OscillatorType = 'sine', v = 0.1): void =>
      seq(c, fs, step, d, tp, v);

    switch (kind) {
      /* ---------- 界面 ---------- */
      case 'click':
        N(880, 0.05, 'triangle', 0.05);
        break;
      case 'toggle':
        S([660, 990], 0.05, 0.08, 'triangle', 0.06);
        break;

      /* ---------- 基本牌 ---------- */
      case 'draw':
        S([1175, 1568], 0.045, 0.1, 'sine', 0.06);
        break;
      case 'play':
        S([523, 784], 0.05, 0.12, 'triangle', 0.1);
        break;
      case 'shengtong':
        // 剑鸣：低频压迫 + 金属泛音
        N(150, 0.3, 'sawtooth', 0.16);
        S([880, 1175, 1568], 0.045, 0.16, 'triangle', 0.07);
        break;
      case 'hushen':
        // 护体灵光：风铃式泛音簇
        S([1568, 2093, 2637], 0.05, 0.32, 'sine', 0.05);
        break;
      case 'lingdan':
        // 灵丹回春：琴音上行
        S([523, 659, 784], 0.075, 0.28, 'sine', 0.09);
        break;
      case 'lingyao':
        S([392, 523, 659], 0.07, 0.26, 'triangle', 0.09);
        break;
      case 'discard':
        N(300, 0.12, 'triangle', 0.06);
        N(200, 0.1, 'sine', 0.04, 0.06);
        break;
      case 'equip':
        // 法宝入槽：编钟三击
        S([523, 784, 1046], 0.06, 0.22, 'square', 0.055);
        break;

      /* ---------- 符篆 / 阵法 / 秘术 ---------- */
      case 'trick':
        S([784, 1046, 1318], 0.06, 0.24, 'triangle', 0.08);
        break;
      case 'trick_aoe':
        // 阵法冲击：低频轰鸣 + 上行扫频
        N(90, 0.45, 'sawtooth', 0.2);
        S([330, 440, 587, 784], 0.07, 0.3, 'sawtooth', 0.07);
        break;
      case 'trick_heal':
        S([523, 587, 659, 784, 880], 0.08, 0.4, 'sine', 0.08);
        break;
      case 'trick_delay':
        // 天劫 / 定身：悬疑下行
        S([880, 740, 622, 523], 0.09, 0.3, 'triangle', 0.07);
        break;
      case 'trick_steal':
        S([1046, 784, 1046], 0.05, 0.16, 'square', 0.05);
        break;
      case 'duel':
        // 斗法：交替咄咄逼人
        S([440, 494, 440, 494], 0.09, 0.22, 'square', 0.06);
        break;

      /* ---------- 技能 / 成长 ---------- */
      case 'skill':
        N(280, 0.45, 'sawtooth', 0.08);
        N(560, 0.3, 'triangle', 0.05, 0.05);
        break;
      case 'skill_fail':
        S([440, 330, 247], 0.08, 0.24, 'triangle', 0.07);
        break;
      case 'wudao':
        // 悟道：五声音阶上行，空灵
        S([523, 587, 659, 784, 880], 0.085, 0.36, 'sine', 0.08);
        break;
      case 'breakthrough':
        // 破境：钟磬齐鸣
        S([392, 523, 659, 784, 1046, 1318], 0.11, 0.5, 'triangle', 0.09);
        break;
      case 'backlash':
        N(120, 0.5, 'sawtooth', 0.16);
        N(60, 0.55, 'square', 0.1, 0.05);
        break;
      case 'contract':
        // 立约：凉风掠过，古朴而幽微
        S([440, 554, 659, 554], 0.11, 0.34, 'sine', 0.07);
        break;

      /* ---------- 状态 ---------- */
      case 'hit':
        N(180, 0.28, 'square', 0.16);
        N(90, 0.3, 'sine', 0.11);
        break;
      case 'heal':
        S([659, 784, 988], 0.07, 0.3, 'sine', 0.07);
        break;
      case 'judge':
        S([1046, 1318], 0.05, 0.18, 'sine', 0.06);
        break;
      case 'death':
        // 陨落：钟声渐远
        S([392, 330, 262, 196], 0.13, 0.55, 'sine', 0.1);
        break;
      case 'turn':
        // 回合开始：一声磬
        N(587, 0.14, 'sine', 0.045);
        N(784, 0.14, 'sine', 0.035, 0.09);
        break;
      case 'win':
        S([523, 659, 784, 1046], 0.12, 0.5, 'triangle', 0.09);
        break;
      case 'lose':
        S([523, 466, 392, 311], 0.14, 0.55, 'sine', 0.09);
        break;
    }
  } catch {
    /* 音频不可用时静默降级 */
  }
}
