/* ==================== 伴兽运行时 / 兽类角色 ====================
 * docs 出处：docs/md/角色/蛮荒/README.md；docs/md/角色/御兽门/
 *   喀尔威明伴兽金冠孔雀、玉鹤无形鹤、化神老妪之玉兔
 *
 * 承伤插在 applyDamage() 唯一位置（护盾 → 道心之后、本体扣寿元之前），
 * 伴兽不作为可选目标，不进入目标选择。
 */
import type { Player, BeastState, SkillE } from '../core/types';
import { addLog } from './log';
import { beastDef, BEAST_MAP } from '../data/beasts';
import { spiritShatter } from '../core/fx';

/** 绑定伴兽（御兽门角色开局时调用） */
export function bindBeast(p: Player, beastId: string): boolean {
  const def = beastDef(beastId);
  if (!def) return false;
  if (def.ownerOnly && def.ownerOnly !== p.charId) return false;
  p.beast = { id: def.id, hp: def.hp, maxHp: def.hp, broken: false };
  addLog(`${p.name} 伴有【${def.name}】（${def.tier}）`, 'system');
  return true;
}

/** 伴兽是否有效（未溃散） */
export function beastActive(p: Player): boolean {
  return !!p.beast && !p.beast.broken && p.beast.hp > 0;
}

/**
 * 伴兽替主承伤：返回实际吸收的伤害量。
 * 归零则「灵兽溃散」——主动技与被动永久失效，主人存活。
 */
export function beastAbsorb(p: Player, incoming: number): number {
  if (!beastActive(p) || !p.beast || incoming <= 0) return 0;
  const take = Math.min(incoming, p.beast.hp);
  p.beast.hp -= take;
  if (p.beast.hp <= 0) {
    p.beast.broken = true;
    const def = BEAST_MAP[p.beast.id];
    addLog(`${p.name} 的【${def?.name ?? p.beast.id}】灵光崩散——灵兽溃散！`, 'backlash');
    spiritShatter(document.getElementById(`seat-${p.seat}`));
  } else {
    const def = BEAST_MAP[p.beast.id];
    addLog(`【${def?.name ?? p.beast.id}】替 ${p.name} 承受 ${take} 点伤害`, 'system');
  }
  return take;
}

/** 伴兽被动效果汇总（溃散后失效） */
export function beastPassiveEffects(p: Player): SkillE[] {
  if (!beastActive(p) || !p.beast) return [];
  const def = BEAST_MAP[p.beast.id];
  return def?.passive?.effects ?? [];
}

/** 伴兽主动技：每回合限一次，溃散后不可发动 */
export function canUseBeastSkill(p: Player): { ok: boolean; reason?: string } {
  if (!p.beast) return { ok: false, reason: '无伴兽' };
  if (p.beast.broken) return { ok: false, reason: '灵兽已溃散' };
  const def = BEAST_MAP[p.beast.id];
  if (!def?.active) return { ok: false, reason: '伴兽无主动技' };
  const key = `beast_${def.id}`;
  if ((p.flags.skillUse[key] ?? 0) >= 1) return { ok: false, reason: '本回合已发动' };
  const cost = def.active.daoxinCost ?? 0;
  if (p.daoxin < cost) return { ok: false, reason: `道心不足 ${cost}` };
  return { ok: true };
}

/** 发动伴兽主动技（效果由 skillEngine 分派） */
export function useBeastSkill(p: Player): SkillE[] | null {
  const chk = canUseBeastSkill(p);
  if (!chk.ok || !p.beast) return null;
  const def = BEAST_MAP[p.beast.id];
  if (!def?.active) return null;
  const cost = def.active.daoxinCost ?? 0;
  p.daoxin -= cost;
  p.flags.skillUse[`beast_${def.id}`] = (p.flags.skillUse[`beast_${def.id}`] ?? 0) + 1;
  addLog(`${p.name} 的伴兽施展【${def.active.name}】`, 'system');
  return def.active.effects;
}
