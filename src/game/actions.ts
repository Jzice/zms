/* ==================== 卡牌结算 ====================
 * 基本牌：神通（火/雷系）、护身、灵丹、灵药、悟道
 * 符篆类：符篆 / 阵法 / 秘术 / 灵魂契约
 * 法宝四槽：本命法宝·法器 / 护身 / 飞梭·灵舟 / 秘宝·重宝
 * 灵地：占据后提供灵地阶位
 */
import type { Player, Card, CardSub } from '../core/types';
import { G, drawN } from './state';
import { addLog } from './log';
import { applyDamage, heal } from './damage';
import { canTargetShengtong, handLimit, canPlayShengtong } from './rules';
import { judgeWudao, canUseWudao } from './wudao';
import { signContract, canSign } from './contract';
import { breakthroughRealm, canBreakthrough, requiredLingdiTier } from './realm';
import { lingdiTierOf } from '../data/cards';
import { sfx } from '../core/sound';
import {
  floatText,
  attackLunge,
  swordSlash,
  shieldRing,
  trickCast,
  aoeWave,
  equipFx,
  wudaoGlow,
  breakthroughPillar,
  judgeFlip,
  playCardFx,
} from '../core/fx';

/** 符篆 / 阵法 / 秘术 → 音效 */
const TRICK_SND: Record<string, Parameters<typeof sfx>[0]> = {
  十方风火归元大阵: 'trick_aoe',
  万剑钻心: 'trick_aoe',
  三木回心阵: 'trick_heal',
  七星定身阵: 'trick_delay',
  天劫: 'trick_delay',
  破阵符: 'trick_steal',
  心生蜂云剑: 'trick_steal',
  幻影夺心刺: 'duel',
};

/** 灵药：本回合神通伤害 +1（简化：直接额外回复 1 灵力并记录） */
export function playLingyao(p: Player): void {
  p.lingli += 1;
  sfx('lingyao');
  addLog(`${p.name} 服用灵药，灵力 +1`, 'system');
}

/** 神通：指定目标，对方须打出护身 */
export function playShengtong(p: Player, card: Card, targetSeat: number): boolean {
  if (!canPlayShengtong()) return false;
  const target = G.players.find((x) => x.seat === targetSeat);
  if (!target || !canTargetShengtong(p, target)) return false;
  G.shengtongUsed += 1;
  sfx('shengtong');
  attackLunge(p.seat);
  const shieldIdx = target.hand.findIndex((c) => c.sub === 'hushen');
  if (shieldIdx >= 0) {
    const shield = target.hand.splice(shieldIdx, 1)[0];
    G.discard.push(shield);
    addLog(`${target.name} 打出【护身】，挡下 ${p.name} 的神通`, 'system');
    sfx('hushen');
    shieldRing(target.seat);
    return true;
  }
  const dmg = 1 + (card.sub === 'huo' || card.sub === 'lei' ? 1 : 0);
  swordSlash(target.seat, card.sub === 'huo' ? 'fire' : card.sub === 'lei' ? 'thunder' : 'normal');
  applyDamage(target, dmg, card.damageType ?? 'normal', p);
  return true;
}

/** 灵丹：回复 1 点寿元 */
export function playLingdan(p: Player, targetSeat?: number): void {
  const t = targetSeat !== undefined ? G.players.find((x) => x.seat === targetSeat) : p;
  if (!t) return;
  heal(t, 1);
  p.xiuwei += 1; // 感悟：服用灵丹
  sfx('lingdan');
  addLog(`${p.name} 以灵丹为 ${t.name} 回复寿元（感悟 +1）`, 'system');
}

/** 法宝：装备到对应槽（被替换的旧装备进入弃牌堆，避免重复换装循环） */
export function equipFaqi(p: Player, card: Card): void {
  const slot = card.sub as CardSub;
  const old = p.equips[slot];
  if (old) {
    delete p.equips[slot];
    G.discard.push(old);
    addLog(`${p.name} 卸下【${old.name}】`, 'system');
  }
  p.equips[slot] = card;
  addLog(`${p.name} 装备【${card.name}】`, 'system');
  sfx('equip');
  equipFx(p.seat, card.name);
}

/** 灵地：占据 */
export function occupyLingdi(p: Player, card: Card): void {
  const id = card.name;
  if (!p.lingdi.includes(id)) p.lingdi.push(id);
  addLog(`${p.name} 占据灵地【${id}】（${lingdiTierOf(id)} 阶）`, 'system');
  floatText(document.getElementById(`seat-${p.seat}`), `灵地 ${lingdiTierOf(id)} 阶`, '#C8A24A');
}

/** 符篆 / 阵法 / 秘术 效果 */
export function playTrick(p: Player, card: Card, targetSeat?: number): boolean {
  const target = targetSeat !== undefined ? G.players.find((x) => x.seat === targetSeat) : undefined;
  sfx(TRICK_SND[card.name] ?? 'trick');
  switch (card.name) {
    case '储物袋':
      drawN(p, 2);
      addLog(`${p.name} 使用【储物袋】，摸 2 张牌`, 'system');
      trickCast(p.seat, card.name, '#2bbfa8');
      return true;
    case '破阵符':
      if (!target || target.hand.length === 0) return false;
      target.hand.pop();
      addLog(`${p.name} 以【破阵符】弃置 ${target.name} 一张牌`, 'system');
      trickCast(target.seat, card.name, '#7ab8ff');
      return true;
    case '心生蜂云剑':
      if (!target || target.hand.length === 0) return false;
      {
        const taken = target.hand.pop();
        if (taken) p.hand.push(taken);
      }
      addLog(`${p.name} 以【心生蜂云剑】取得 ${target.name} 一张牌`, 'system');
      trickCast(target.seat, card.name, '#b57fff');
      return true;
    case '幻影夺心刺': {
      if (!target) return false;
      // 斗法：双方轮弃神通，简化为各弃 1 张神通，不足者受伤
      const pa = p.hand.findIndex((c) => c.sub === 'shengtong' || c.sub === 'huo' || c.sub === 'lei');
      const pb = target.hand.findIndex((c) => c.sub === 'shengtong' || c.sub === 'huo' || c.sub === 'lei');
      if (pa < 0 && pb < 0) return true;
      if (pa >= 0) p.hand.splice(pa, 1);
      if (pb >= 0) target.hand.splice(pb, 1);
      if (pa < 0) applyDamage(p, 1, 'normal', target);
      else if (pb < 0) applyDamage(target, 1, 'normal', p);
      addLog(`${p.name} 与 ${target.name} 斗法`, 'system');
      trickCast(target.seat, card.name, '#9b59b6');
      return true;
    }
    case '十方风火归元大阵':
      for (const other of G.players) {
        if (other.seat === p.seat || !other.alive) continue;
        const idx = other.hand.findIndex((c) => c.sub === 'shengtong' || c.sub === 'huo' || c.sub === 'lei');
        if (idx >= 0) other.hand.splice(idx, 1);
        else applyDamage(other, 1, 'fire', p);
      }
      addLog(`${p.name} 布下【十方风火归元大阵】`, 'system');
      aoeWave(
        p.seat,
        G.players.filter((o) => o.seat !== p.seat && o.alive).map((o) => o.seat),
        '#ff7a3c',
      );
      return true;
    case '万剑钻心':
      for (const other of G.players) {
        if (other.seat === p.seat || !other.alive) continue;
        const idx = other.hand.findIndex((c) => c.sub === 'hushen');
        if (idx >= 0) other.hand.splice(idx, 1);
        else applyDamage(other, 1, 'normal', p);
      }
      addLog(`${p.name} 施展【万剑钻心】`, 'system');
      aoeWave(
        p.seat,
        G.players.filter((o) => o.seat !== p.seat && o.alive).map((o) => o.seat),
        '#cfd8e3',
      );
      return true;
    case '三木回心阵':
      for (const other of G.players) if (other.alive) heal(other, 1);
      addLog(`${p.name} 布下【三木回心阵】，众人回寿`, 'system');
      aoeWave(
        p.seat,
        G.players.filter((o) => o.alive).map((o) => o.seat),
        '#5fd07a',
      );
      return true;
    case '命隐符':
      addLog(`${p.name} 祭出【命隐符】，抵消一次符篆`, 'system');
      return true;
    case '青灵石蒲团':
      for (const other of G.players) if (other.alive) drawN(other, 1);
      addLog(`${p.name} 以【青灵石蒲团】普惠众人`, 'system');
      return true;
    case '碧火幽魂刀':
      if (!target) return false;
      swordSlash(target.seat, 'fire');
      applyDamage(target, 1, 'fire', p);
      addLog(`${p.name} 以【碧火幽魂刀】攻 ${target.name}`, 'system');
      return true;
    case '银甲乐傀':
      addLog(`${p.name} 驱使【银甲乐傀】`, 'system');
      return true;
    case '乌茎泽兰':
      addLog(`${p.name} 布下【乌茎泽兰】`, 'system');
      return true;
    default:
      trickCast(target?.seat ?? p.seat, card.name);
      return true;
  }
}

/** 灵魂契约卡：立约 */
export function playContract(p: Player, card: Card, targetSeat: number, defId: string): boolean {
  const target = G.players.find((x) => x.seat === targetSeat);
  if (!target) return false;
  const chk = canSign(p, target);
  if (!chk.ok) return false;
  const c = signContract(p, target, defId);
  if (c) sfx('contract');
  return !!c;
}

/** 悟道卡：判定 */
export function playWudao(p: Player): boolean {
  const chk = canUseWudao(p);
  if (!chk.ok) return false;
  const r = judgeWudao(p);
  if (r.judgeCard) judgeFlip(p.seat, r.judgeCard);
  wudaoGlow(p.seat, r.success);
  if (r.success) {
    sfx('wudao');
    floatText(document.getElementById(`seat-${p.seat}`), `修为 +${r.xiuweiGain} 道心 +${r.daoxinGain}`);
    // 悟道成功且满足条件 → 境界突破
    if (canBreakthrough(p).ok) {
      breakthroughRealm(p);
      breakthroughPillar(p.seat);
      sfx('breakthrough');
    }
  } else {
    sfx('skill_fail');
    floatText(document.getElementById(`seat-${p.seat}`), `修为 +${r.xiuweiGain}`, '#B8B0A0');
  }
  return true;
}

/** 出牌结算（内部） */
function playCardInner(p: Player, cardId: number, targetSeat?: number, extra?: string): boolean {
  const idx = p.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) return false;
  const card = p.hand[idx];

  switch (card.type) {
    case 'basic':
      if (card.sub === 'shengtong' || card.sub === 'huo' || card.sub === 'lei') {
        if (targetSeat === undefined) return false;
        if (!playShengtong(p, card, targetSeat)) return false;
      } else if (card.sub === 'lingdan') {
        playLingdan(p, targetSeat);
      } else if (card.sub === 'lingyao') {
        playLingyao(p);
      } else if (card.sub === 'wudao') {
        if (!playWudao(p)) return false;
      } else if (card.sub === 'hushen') {
        return false; // 护身不主动打出
      }
      break;
    case 'fu':
      if (card.sub === 'linghunqiyue') {
        if (targetSeat === undefined || !extra) return false;
        if (!playContract(p, card, targetSeat, extra)) return false;
      } else {
        if (!playTrick(p, card, targetSeat)) return false;
      }
      break;
    case 'faqi':
      // 装备牌留在装备区，不进弃牌堆
      p.hand.splice(idx, 1);
      equipFaqi(p, card);
      return true;
    case 'lingdi':
      occupyLingdi(p, card);
      break;
  }

  p.hand.splice(idx, 1);
  G.discard.push(card);
  return true;
}

/** 出牌总入口：结算成功后，将打出之牌浮现于牌桌中央（出牌区） */
export function playCard(p: Player, cardId: number, targetSeat?: number, extra?: string): boolean {
  const card = p.hand.find((c) => c.id === cardId);
  const ok = playCardInner(p, cardId, targetSeat, extra);
  if (ok && card) playCardFx(p.seat, card, p.name);
  return ok;
}

/** 弃牌阶段：超出手牌上限需弃 */
export function needDiscard(p: Player): number {
  return Math.max(0, p.hand.length - handLimit(p));
}

/** 闭关修炼：弃置全部手牌换修为（回合末可选） */
export function closeDoor(p: Player): void {
  const n = p.hand.length;
  p.hand.splice(0, n);
  G.discard.push(...[]);
  p.xiuwei += 3 + (p.flags.hurtThisTurn ? -1 : 0);
  p.flags.closedDoor = true;
  addLog(
    `${p.name} 闭关修炼，弃 ${n} 张手牌${p.flags.hurtThisTurn ? '（被打断，修为 -1）' : ''}`,
    'system',
  );
}

/** 突破提示（灵地不足时） */
export function breakthroughHint(p: Player): string {
  const chk = canBreakthrough(p);
  if (chk.reason === 'lingdi') return `需 ${requiredLingdiTier(p)} 阶灵地方可突破`;
  if (chk.reason === 'xiuwei') return '修为不足';
  if (chk.reason === 'capped') return '已至化神大圆满';
  return '可突破';
}
