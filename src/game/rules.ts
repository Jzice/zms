/* ==================== 规则原语：距离 / 射程 / 手牌上限 ====================
 * 沿用三国杀内核（距离环形计算、武器射程、手牌上限 = 寿元），
 * 阵营与地域只在此处叠加修正，不散落各处。
 */
import type { Player, Character, ContractTerm } from '../core/types';
import { G } from './state';
import { REGION_MAP } from '../data/regions';
import { charOf } from '../data/characters';
import { weaponRange } from '../data/cards';
import { CONTRACT_MAP } from '../data/contracts';
import { passiveMod } from './skillEngine';

/** 环形座位距离（相邻为 1） */
export function baseDistance(a: number, b: number): number {
  const n = G.players.length || 1;
  const d = Math.abs(a - b) % n;
  return Math.min(d, n - d);
}

/** 玩家 a 到玩家 b 的实际距离（含飞梭 / 护身法宝 / 地域 / 被动修正） */
export function distanceTo(a: Player, b: Player): number {
  let d = baseDistance(a.seat, b.seat);
  // 飞梭 / 灵舟：距离 -1
  if (a.equips.feisuo) d -= 1;
  // 目标护身法宝（清风法袍绣风罩）：到他的距离 +1
  if (b.equips.fangju) d += 1;
  // 地域修正（本域势力更近）
  const ca = charOf(a.charId);
  if (ca) {
    const r = REGION_MAP[ca.region];
    if (r) d += r.distMod;
  }
  // 被动 trait（技能 / 伴兽）
  d += passiveMod(a, 'distMod');
  return Math.max(1, d);
}

/** 攻击射程（本命法宝/法器决定，默认 1） */
export function attackRange(p: Player): number {
  let r = 1;
  const w = p.equips.benmingfaqi;
  if (w) r = weaponRange(w.name);
  r += passiveMod(p, 'rangeMod');
  return Math.max(1, r);
}

/** 能否以神通指定目标 */
export function canTargetShengtong(from: Player, to: Player): boolean {
  if (!to.alive || to.seat === from.seat) return false;
  // 灵魂契约「互不攻伐」：缔约双方不得互相指定
  if (hasTerm(from, to, 'noAttack')) return false;
  return distanceTo(from, to) <= attackRange(from);
}

/** 手牌上限 = 寿元（三国杀内核）+ 被动修正 */
export function handLimit(p: Player): number {
  let n = p.hp;
  if (p.equips.mibao) n += 1; // 秘宝：手牌上限 +1
  n += passiveMod(p, 'handLimit');
  return Math.max(0, n);
}

/** 缔约双方是否含某条款 */
export function hasTerm(a: Player, b: Player, term: string): boolean {
  return a.contracts.some(
    (c) =>
      !c.broken &&
      c.parties.includes(b.seat) &&
      (CONTRACT_MAP[c.defId]?.terms ?? []).includes(term as ContractTerm),
  );
}

/** 角色基础信息（带兜底） */
export function characterOf(p: Player): Character | undefined {
  return charOf(p.charId);
}

/** 本域势力判定（地域加成用） */
export function isHomeRegion(p: Player): boolean {
  const c = characterOf(p);
  if (!c) return false;
  return c.region === p.region;
}
