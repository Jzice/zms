/* ==================== AI 大脑：信念推断 + 博弈策略 ====================
 * 纯逻辑模块：仅依赖 state/rules/types（无动作依赖，避免 damage→ai→actions 循环导入）。
 * 模块级状态不放入 G，不随联机 state_sync 同步——AI 的「心思」不泄露给客户端。
 *
 * 设计（博弈论框架，移植自 learn_kill 并适配掌门杀身份方）：
 *  1. 信念推断：AI 不再上帝视角读真实身份，而是维护对每个玩家的身份方（正道/外道/隐匿/公开高位）
 *     的对数得分（softmax 归一化）。通过观察「谁攻击了谁」更新信念；公开身份（掌门/老祖等）直接锚定。
 *  2. 身份动态策略：AI 知道自己的身份方（合法信息），按身份方采用不同混合策略——
 *     - 正道：攻击疑似外道/隐匿，回避己方（护掌门）；
 *     - 外道：掌门（明置）为首要目标；
 *     - 隐匿：按两方期望兵力「拉偏架」维持均衡，残局亮剑；
 *     - 公开高位：依目标（势力称雄/守灵地）择优。
 *  3. 恩怨（谁攻击过我→记仇，谁救过我→感恩）参与评分（互惠性）。
 */
import type { Player } from '../core/types';
import { G } from './state';
import { ROLE_MAP } from '../data/roles';

type SideKey = 'zhengdao' | 'waidao' | 'yinni' | 'gaowei';
const SIDES: SideKey[] = ['zhengdao', 'waidao', 'yinni', 'gaowei'];
const CLAMP = 5;

/** beliefs[观察者][目标] = 身份方对数得分（softmax 归一化后为信念概率） */
const beliefs = new Map<number, Map<number, Record<SideKey, number>>>();
const grudges = new Map<number, Map<number, number>>();
const favors = new Map<number, Map<number, number>>();
let aiTurns = 0;

function blank(): Record<SideKey, number> {
  return { zhengdao: 0, waidao: 0, yinni: 0, gaowei: 0 };
}

function clampScores(s: Record<SideKey, number>): void {
  for (const k of SIDES) s[k] = Math.max(-CLAMP, Math.min(CLAMP, s[k]));
}

/** 目标真实身份方（仅当公开身份时可靠） */
function revealedSide(t: Player): SideKey | null {
  if (!t.rolePublic) return null;
  return (ROLE_MAP[t.role]?.side as SideKey) ?? null;
}

function ensure(o: number, t: number): Record<SideKey, number> {
  let m = beliefs.get(o);
  if (!m) {
    m = new Map();
    beliefs.set(o, m);
  }
  let s = m.get(t);
  if (!s) {
    s = blank();
    const ts = revealedSide(G.players[t]);
    if (ts) {
      s = blank();
      s[ts] = CLAMP;
      for (const k of SIDES) if (k !== ts) s[k] = -CLAMP;
    }
    m.set(t, s);
  }
  return s;
}

export function beliefProbs(o: number, t: number): Record<SideKey, number> {
  const tp = G.players[t];
  const out = blank();
  if (!tp) return out;
  const rs = revealedSide(tp);
  if (rs) {
    out[rs] = 1;
    return out;
  }
  const s = ensure(o, t);
  let max = -Infinity;
  for (const k of SIDES) max = Math.max(max, s[k]);
  let sum = 0;
  for (const k of SIDES) {
    out[k] = Math.exp(s[k] - max);
    sum += out[k];
  }
  for (const k of SIDES) out[k] /= sum;
  return out;
}

function aliveAIs(): number[] {
  const arr: number[] = [];
  G.players.forEach((p, i) => {
    if (p.alive && p.ai) arr.push(i);
  });
  return arr;
}

function addGrudge(victim: number, attacker: number): void {
  let m = grudges.get(victim);
  if (!m) {
    m = new Map();
    grudges.set(victim, m);
  }
  m.set(attacker, (m.get(attacker) || 0) + 1);
}

export function grudgeOf(o: number, t: number): number {
  return grudges.get(o)?.get(t) || 0;
}

/** 事件：src 攻击了 tgt —— 所有存活 AI 观察并更新对 src 的信念；受害者记仇 */
export function noteAttack(src: number, tgt: number): void {
  if (src < 0 || src === tgt || !G.players[src] || !G.players[tgt]) return;
  addGrudge(tgt, src);
  const tSide = revealedSide(G.players[tgt]);
  for (const o of aliveAIs()) {
    if (o === src) continue;
    const b = ensure(o, src);
    if (tSide) {
      // 敢打公开身份者 → 极可能是其对立阵营
      b[tSide] -= 2.2;
      for (const k of SIDES) if (k !== tSide) b[k] += 0.7;
    } else {
      // 打疑似某方者：攻击方不太可能与之同阵营
      const tp = beliefProbs(o, tgt);
      for (const k of SIDES) {
        if (tp[k] >= 0.5) b[k] -= 1.1;
        else b[k] += 0.3;
      }
    }
    clampScores(b);
  }
}

/** AI 回合计数（近似轮次推进） */
export function noteAiTurn(): void {
  aiTurns++;
}

export function resetBrain(): void {
  beliefs.clear();
  grudges.clear();
  favors.clear();
  aiTurns = 0;
}

/** 选择攻击目标（博弈式目标评分）。无明显敌意目标时按概率观望返回 -1（低暴露策略）。 */
export function pickAiTarget(idx: number): number {
  const p = G.players[idx];
  if (!p?.alive) return -1;
  const mySide = (ROLE_MAP[p.role]?.side as SideKey) ?? 'zhengdao';
  // 正道 vs 外道/隐匿为对立；公开高位按目标而异；隐匿最复杂（拉偏架）
  const cands: { i: number; score: number }[] = [];
  for (let i = 0; i < G.players.length; i++) {
    if (i === idx || !G.players[i].alive) continue;
    const t = G.players[i];
    const P = beliefProbs(idx, i);
    const g = grudgeOf(idx, i);
    let s: number;
    if (mySide === 'zhengdao') {
      // 正道：攻击疑似外道/隐匿，坚决回避己方
      s = P.waidao + P.yinni + g * 0.8 - P.zhengdao * 1.5 - P.gaowei * 0.2;
    } else if (mySide === 'waidao') {
      // 外道：掌门（公开=gaowei/zhengdao明置）为首要目标
      s = P.zhengdao * 1.5 + P.gaowei * 1.2 - P.waidao * 1.4 + g * 0.8;
    } else if (mySide === 'yinni') {
      // 隐匿：残局前拉偏架——打当前占优方
      const strength = P.zhengdao + P.waidao + P.gaowei;
      s = (0.5 - strength) * 2 + g * 0.6;
    } else {
      // 公开高位：依目标择优（简单起见攻最强疑似对手）
      s = Math.max(P.waidao, P.zhengdao, P.yinni) * 0.8 + g * 0.5;
    }
    s += t.maxHp && t.hp <= 1 ? 1.2 : 0; // 残血优先击杀
    cands.push({ i, score: s });
  }
  if (!cands.length) return -1;
  cands.sort((a, b) => b.score - a.score);
  const best = cands[0];
  if (best.score < 0.2 && Math.random() > 0.25) return -1;
  return best.i;
}
