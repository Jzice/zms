/* ==================== 悟道（【悟道】卡判定） ====================
 * 打出【悟道】卡 → 翻牌堆顶一张即时判定（复用判定原语，不进判定区）
 *   红色（♥♦）→「道心澄明」成功：修为 +4、道心 +1、展示诗词感悟、可触发境界突破
 *   黑色（♠♣）→「心魔滋生」失败：修为 +1
 *
 * 灵根纯度修正（docs/md/设定/本命.md：本命越多、灵根越杂，吸纳灵气越慢）：
 *   花色↔五行：♠水 ♥火 ♣木 ♦金
 *   单灵根：命中灵根花色 → 结果翻转（黑变红），期望 ≈75%
 *   双灵根：命中 → 成功时修为 +1（不翻转）
 *   三灵根及以上：命中无加成，且失败时弃 1 张手牌（心魔反噬）
 *
 * 条件与判定各自集中，便于单点调参。
 */
import type { Player, Card, DaoVerse } from '../core/types';
import { G } from './state';
import { addLog } from './log';
import { charOf } from '../data/characters';
import { SUIT_ELEMENT } from '../core/shuffle';
import { randomInsight } from '../data/daoVerses';
import { canBreakthrough } from './realm';

/** 五项使用条件（不满足则卡牌置灰并提示缺失项） */
export function canUseWudao(p: Player): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (G.phase !== 'play') reasons.push('需在出牌阶段');
  if (p.lingli < 1) reasons.push('灵力不足 1');
  if (p.flags.wudaoUsed) reasons.push('本回合已悟道');
  const chk = canBreakthrough(p);
  if (chk.reason === 'capped') reasons.push('已至化神大圆满，无法再进');
  if (G.deck.length === 0 && G.discard.length === 0) reasons.push('牌堆与弃牌堆皆空');
  return { ok: reasons.length === 0, reasons };
}

export interface WudaoResult {
  success: boolean;
  judgeCard: Card | null;
  xiuweiGain: number;
  daoxinGain: number;
  discardPenalty: number;
  verse?: DaoVerse;
  /** 灵根是否命中（UI 展示「道心纯粹」） */
  rootHit: boolean;
}

/** 翻一张判定牌（牌堆空则先用弃牌堆洗回） */
function flip(): Card | null {
  if (G.deck.length === 0) {
    if (G.discard.length === 0) return null;
    for (let j = G.discard.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [G.discard[j], G.discard[k]] = [G.discard[k], G.discard[j]];
    }
    G.deck.push(...G.discard.splice(0, G.discard.length));
  }
  const c = G.deck.shift();
  if (!c) return null;
  G.discard.push(c);
  return c;
}

/** 判定牌花色是否命中角色灵根 */
function rootHit(p: Player, card: Card): boolean {
  const c = charOf(p.charId);
  if (!c) return false;
  const el = SUIT_ELEMENT[card.suit];
  if (!el) return false;
  return c.spiritRoots.includes(el as never);
}

/** 执行悟道判定并结算 */
export function judgeWudao(p: Player): WudaoResult {
  const card = flip();
  p.lingli -= 1;
  p.flags.wudaoUsed = true;

  if (!card) {
    return { success: false, judgeCard: null, xiuweiGain: 0, daoxinGain: 0, discardPenalty: 0, rootHit: false };
  }

  const isRed = card.suit === '♥' || card.suit === '♦';
  const hit = rootHit(p, card);
  const c = charOf(p.charId);
  const rootCount = c?.spiritRoots.length ?? 2;

  let success = isRed;
  let extraXiuwei = 0;
  let penalty = 0;

  if (rootCount <= 1 && hit) {
    // 单灵根：命中则翻转
    success = !success;
  } else if (rootCount === 2 && hit && success) {
    // 双灵根：命中且成功 → 额外修为
    extraXiuwei = 1;
  } else if (rootCount >= 3 && !success) {
    // 三灵根及以上：失败 → 心魔反噬，弃 1 张手牌
    penalty = 1;
  }

  const xiuweiGain = success ? 4 + extraXiuwei : 1;
  const daoxinGain = success ? 1 : 0;

  p.xiuwei += xiuweiGain;
  if (daoxinGain) p.daoxin += daoxinGain;
  if (penalty > 0 && p.hand.length > 0) {
    p.hand.pop();
  }

  addLog(
    success
      ? `${p.name} 悟道：道心澄明，修为 +${xiuweiGain}，道心 +${daoxinGain}`
      : `${p.name} 悟道：心魔滋生，修为 +${xiuweiGain}${penalty ? '，心魔反噬弃 1 张' : ''}`,
    success ? 'breakthrough' : 'system',
  );

  const verse = success ? randomInsight() : undefined;
  return { success, judgeCard: card, xiuweiGain, daoxinGain, discardPenalty: penalty, verse, rootHit: hit };
}

/** 悟道成功后若满足突破条件则突破（由调用方决定时机） */
export function tryBreakAfterWudao(p: Player): boolean {
  return canBreakthrough(p).ok;
}
