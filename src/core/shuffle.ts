/* ==================== 洗牌 / 抽牌 ==================== */
import type { Card } from './types';

/** Fisher–Yates 洗牌（原地） */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 从牌堆顶取 n 张；牌堆不足时自动把弃牌堆洗回（与三国杀一致） */
export function drawCards(deck: Card[], discard: Card[], n: number): Card[] {
  const out: Card[] = [];
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck.push(...shuffle(discard.splice(0, discard.length)));
    }
    const c = deck.shift();
    if (c) out.push(c);
  }
  return out;
}

/** 翻一张判定牌（悟道即时判定用；牌堆空则返回 null） */
export function flipJudge(deck: Card[], discard: Card[]): Card | null {
  if (deck.length === 0) {
    if (discard.length === 0) return null;
    deck.push(...shuffle(discard.splice(0, discard.length)));
  }
  const c = deck.shift();
  if (!c) return null;
  discard.push(c);
  return c;
}

/** 判定牌是否红色（♥♦）：悟道「道心澄明」 */
export function isRed(c: Card): boolean {
  return c.suit === '♥' || c.suit === '♦';
}

/** 花色 → 五行（docs 灵根：金木水火土） */
export const SUIT_ELEMENT: Record<string, string> = {
  '♠': 'water',
  '♥': 'fire',
  '♣': 'wood',
  '♦': 'metal',
};
