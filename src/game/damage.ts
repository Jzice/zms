/* ==================== 伤害链 ====================
 * 结算顺序（与计划一致，伴兽承伤只插在此唯一位置）：
 *   法宝合计 −1 → 被动减伤 → 保底 1 伤 → 道心（每回合限 1 次）
 *   → 【伴兽承伤】 → 本体扣寿元 → 濒死
 *
 * ⚠ 不得在 dyingPhase / dealDamage 重复承伤（避免双重扣血）。
 * ⚠ 平衡标定（对齐三国杀）：法宝/被动不得把普通伤害完全抹平，平减保底 1 点；
 *   仅「道心」可完全抵挡（每回合限 1 次）。
 */
import type { Player, DamageType } from '../core/types';
import { G } from './state';
import { addLog } from './log';
import { beastAbsorb } from './beasts';
import { passiveMod } from './skillEngine';
import { sfx } from '../core/sound';
import { hitShake, damageFloat, healGlow, deathFx, screenFlash, shake } from '../core/fx';
import { ROLE_MAP } from '../data/roles';

/** 造成 1 点伤害后的濒死结算 */
export function dyingPhase(p: Player): void {
  if (p.hp > 0 || !p.alive) return;
  addLog(`${p.name} 濒死，需灵丹或道心自救`, 'system');
  // 道心自救
  if (p.daoxin >= 1) {
    p.daoxin -= 1;
    p.hp = 1;
    addLog(`${p.name} 以道心稳住心神，寿元回复至 1`, 'heal', p.seat);
    return;
  }
  // 灵丹自救
  const idx = p.hand.findIndex((c) => c.sub === 'lingdan');
  if (idx >= 0) {
    p.hand.splice(idx, 1);
    p.hp = 1;
    addLog(`${p.name} 服下灵丹，寿元回复至 1`, 'heal', p.seat);
    return;
  }
  p.alive = false;
  addLog(`${p.name} 寿元耗尽，陨落。`, 'damage', p.seat);
  deathFx(p.seat, ROLE_MAP[p.role]?.name ?? p.role);
  sfx('death');
}

/**
 * 应用伤害（唯一入口）
 * @returns 实际扣减的寿元
 */
export function applyDamage(
  target: Player,
  amount: number,
  type: DamageType = 'normal',
  source?: Player,
): number {
  if (!target.alive || amount <= 0) return 0;

  let dmg = amount;

  // ① 法宝减伤：护身法宝 + 秘宝合计最多 −1（两者不叠加）
  if (target.equips.fangju || target.equips.mibao) dmg -= 1;

  // ② 被动减伤（技能 / 伴兽 trait）
  dmg -= passiveMod(target, 'reduceDamage');

  // ③ 平减保底 1 伤：法宝与被动不得把伤害完全抹平（道心方可完全抵挡）
  if (dmg < 1) dmg = 1;

  // ④ 道心抵挡（2 抵 1，每回合限 1 次）
  if (!target.flags.daoxinGuardUsed && target.daoxin >= 2 && dmg > 0) {
    const use = Math.min(target.daoxin, dmg * 2);
    const blocked = Math.floor(use / 2);
    target.daoxin -= blocked * 2;
    dmg -= blocked;
    if (blocked > 0) {
      target.flags.daoxinGuardUsed = true;
      addLog(`${target.name} 以道心抵挡 ${blocked} 点伤害`, 'damage', target.seat);
    }
  }

  if (dmg <= 0) {
    addLog(`${target.name} 以道心完全抵挡，未受实质损伤`, 'damage', target.seat);
    return 0;
  }

  // ④ 伴兽替主承伤（唯一插入点）
  const absorbed = beastAbsorb(target, dmg);
  dmg -= absorbed;

  if (dmg <= 0) return 0;

  // ⑤ 本体扣寿元
  target.hp -= dmg;
  target.flags.hurtThisTurn = true;
  const typeName = type === 'fire' ? '火系' : type === 'thunder' ? '雷系' : '';
  addLog(
    `${source ? source.name + ' 对 ' : ''}${target.name} 造成 ${dmg} 点${typeName}伤害，寿元剩 ${Math.max(0, target.hp)}`,
    'damage',
    target.seat,
  );
  sfx('hit');

  // 视觉：受击震颤 + 扣血飘字；火 / 雷系额外全屏闪光与震屏
  hitShake(target.seat);
  damageFloat(target.seat, dmg);
  if (type === 'fire' || type === 'thunder') {
    screenFlash(type === 'thunder' ? 'rgba(120,170,255,.24)' : 'rgba(255,120,60,.20)');
    shake();
  }

  // ⑥ 濒死
  if (target.hp <= 0) dyingPhase(target);
  return dmg;
}

/** 灵丹回复 */
export function heal(p: Player, n: number): number {
  const before = p.hp;
  p.hp = Math.min(p.maxHp, p.hp + n);
  const got = p.hp - before;
  if (got > 0) {
    addLog(`${p.name} 回复 ${got} 点寿元`, 'heal', p.seat);
    sfx('heal');
    healGlow(p.seat);
  }
  return got;
}

/** 检查全局是否结束（交给 loop 判定） */
export function anyAlive(): Player[] {
  return G.players.filter((p) => p.alive);
}
