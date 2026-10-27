/* ==================== 技能效果原语执行 ====================
 * SkillE 由 skillEngine 统一分派，避免各写结算分支。
 * 被动修正（distMod / rangeMod / reduceDamage / handLimit）汇总后供 rules 读取。
 */
import type { Player, SkillE } from '../core/types';
import { G } from './state';
import { drawN } from './state';
import { applyDamage, heal } from './damage';
import { beastPassiveEffects } from './beasts';
import { charOf } from '../data/characters';
import { SKILL_MAP } from '../data/skilldefs';
import { addLog } from './log';
import { skillRipple, playHint } from '../core/fx';

/** 汇总某角色的被动修正值 */
export function passiveMod(p: Player, key: 'distMod' | 'rangeMod' | 'reduceDamage' | 'handLimit'): number {
  let n = 0;
  const c = charOf(p.charId);
  const skills = c?.skills ?? [];
  // 本命天赋：仅在境界突破后开启（简化：默认已开启，突破时追加 awakenSkill）
  for (const s of skills) {
    if (s.kind !== 'passive' && s.kind !== 'benming') continue;
    for (const e of s.effects) if (e.k === key) n += e.n;
  }
  // 伴兽被动（溃散后自动失效）
  for (const e of beastPassiveEffects(p)) if (e.k === key) n += e.n;
  return n;
}

/** 执行一组效果原语 */
export function applyEffects(actor: Player, effects: SkillE[], targetSeat?: number): void {
  const target =
    targetSeat !== undefined ? G.players.find((p) => p.seat === targetSeat) : undefined;
  for (const e of effects) {
    switch (e.k) {
      case 'draw':
        drawN(actor, e.n);
        break;
      case 'damage':
        if (target) applyDamage(target, e.n, e.type, actor);
        break;
      case 'heal':
        heal(actor, e.n);
        break;
      case 'xiuwei':
        actor.xiuwei += e.n;
        break;
      case 'lingli':
        actor.lingli += e.n;
        break;
      case 'daoxin':
        actor.daoxin += e.n;
        break;
      case 'discard':
        if (target) target.hand.splice(0, Math.min(e.n, target.hand.length));
        break;
      case 'distMod':
      case 'rangeMod':
      case 'reduceDamage':
      case 'handLimit':
      case 'shield':
        // 被动类由 passiveMod 汇总，此处不即时生效
        break;
      case 'lingdiTier':
        break;
    }
  }
}

/** 主动技是否可发动 */
export function canUseSkill(p: Player, skillId: string): { ok: boolean; reason?: string } {
  const def = SKILL_MAP[skillId];
  if (!def) return { ok: false, reason: '技能未登记' };
  if (def.kind !== 'active') return { ok: false, reason: '非主动技' };
  if (def.oncePerTurn && (p.flags.skillUse[skillId] ?? 0) >= 1)
    return { ok: false, reason: '本回合已发动' };
  const cost = def.cost ?? {};
  if (cost.lingli && p.lingli < cost.lingli) return { ok: false, reason: `灵力不足 ${cost.lingli}` };
  if (cost.daoxin && p.daoxin < cost.daoxin) return { ok: false, reason: `道心不足 ${cost.daoxin}` };
  if (cost.hand && p.hand.length < cost.hand) return { ok: false, reason: `手牌不足 ${cost.hand}` };
  return { ok: true };
}

/** 发动主动技（二选一：普通发动 / 耗道心强化发动） */
export function useSkill(p: Player, skillId: string, targetSeat?: number, boost = false): boolean {
  const chk = canUseSkill(p, skillId);
  if (!chk.ok) return false;
  const def = SKILL_MAP[skillId];
  if (!def) return false;
  const cost = def.cost ?? {};
  if (cost.lingli) p.lingli -= cost.lingli;
  if (cost.daoxin) p.daoxin -= cost.daoxin;
  if (cost.hand) p.hand.splice(0, Math.min(cost.hand, p.hand.length));
  if (boost) {
    // 耗 1 道心强化：效果翻倍（伤害/摸牌类）
    if (p.daoxin >= 1) {
      p.daoxin -= 1;
      addLog(`${p.name} 消耗道心强化【${def.name}】`, 'system');
    }
  }
  p.flags.skillUse[skillId] = (p.flags.skillUse[skillId] ?? 0) + 1;
  addLog(`${p.name} 发动【${def.name}】`, 'system');
  skillRipple(p.seat);
  playHint(def.name, def.desc ?? '主动技');
  applyEffects(p, def.effects, targetSeat);
  return true;
}

/** 角色可用主动技列表 */
export function activeSkillsOf(p: Player): string[] {
  const c = charOf(p.charId);
  return (c?.skills ?? []).filter((s) => s.kind === 'active').map((s) => s.id);
}

/**
 * 回合开始：结算本命天赋 / 被动中的持续性产出（灵力 / 道心 / 修为）。
 * 只处理这三类，摸牌类由摸牌阶段统一处理，避免重复。
 */
export function applyTurnStart(p: Player): void {
  const c = charOf(p.charId);
  for (const s of c?.skills ?? []) {
    if (s.kind !== 'passive' && s.kind !== 'benming') continue;
    for (const e of s.effects) {
      if (e.k === 'lingli') p.lingli += e.n;
      else if (e.k === 'daoxin') p.daoxin += e.n;
      else if (e.k === 'xiuwei') p.xiuwei += e.n;
    }
  }
  // 伴兽被动产出（溃散后失效）
  for (const e of beastPassiveEffects(p)) {
    if (e.k === 'lingli') p.lingli += e.n;
    else if (e.k === 'daoxin') p.daoxin += e.n;
    else if (e.k === 'xiuwei') p.xiuwei += e.n;
  }
}
