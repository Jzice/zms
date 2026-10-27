/* ==================== 牌堆构建 ====================
 * 基本牌：神通（火系/雷系）、护身、灵丹、灵药、悟道
 * 符篆类：符篆 / 阵法 / 秘术 / 灵魂契约（取自 spellTricks.ts）
 * 法宝四槽：本命法宝·法器 / 护身 / 飞梭·灵舟 / 秘宝·重宝
 * 灵地：提供灵地阶位，为境界突破的第二前置条件
 *
 * 构成对齐三国杀基础 125 张 + 【悟道】8 张 = 133 张（smoke-cards 断言）。
 */
import type { Card, CardSub, CardType, Suit } from '../core/types';
import { TRICKS } from './spellTricks';

let CID = 0;

export function resetCardIds(): void {
  CID = 0;
}

export function C(
  name: string,
  type: CardType,
  sub: CardSub,
  suit: Suit,
  num: string | number,
  extra: Partial<Card> = {},
): Card {
  return { id: ++CID, name, type, sub, suit, num, ...extra };
}

const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];

/** 法宝（装备）定义：名称取自 docs 法宝列表 / 技能目录 */
const EQUIPS: { name: string; sub: CardSub; desc: string }[] = [
  { name: '通明幻镜', sub: 'benmingfaqi', desc: '齐休本命法宝，攻击范围 2' },
  { name: '洼角云刀', sub: 'benmingfaqi', desc: '三阶极品法器，攻击范围 3' },
  { name: '七芯蝎尾夺', sub: 'benmingfaqi', desc: '楚夺本命法宝，攻击范围 1' },
  { name: '伪无形剑', sub: 'benmingfaqi', desc: '无形无影，攻击范围 2' },
  { name: '青铜长戟', sub: 'benmingfaqi', desc: '英伯本命法宝，攻击范围 3' },
  { name: '红云宫装', sub: 'fangju', desc: '楚红裳本命法宝（护身）' },
  { name: '清风法袍', sub: 'fangju', desc: '法器道袍，绣风罩符阵（护身）' },
  { name: '千幻霓裳', sub: 'fangju', desc: '替身法器（护身）' },
  { name: '乙木御风梭', sub: 'feisuo', desc: '三阶极品飞行法器，距离 -1' },
  { name: '风阵灵舟', sub: 'feisuo', desc: '一阶中品飞行法器，距离 -1' },
  { name: '星雪秘蛇胸针', sub: 'mibao', desc: '五阶器灵，星遁配合' },
  { name: '红玉阵盘', sub: 'mibao', desc: '阵盘秘宝' },
  { name: '血魔井', sub: 'mibao', desc: '醒狮谷魔物所化重宝：回合开始时获得 1 点道心，亦可作道具夺取。' },
];

/** 灵地：占据后提供灵地阶位 */
const LINGDI_CARDS: { name: string; tier: number }[] = [
  { name: '黑河峰', tier: 1 },
  { name: '仙林坳', tier: 2 },
  { name: '楚恩城', tier: 2 },
  { name: '思过山', tier: 3 },
  { name: '碧湖宫', tier: 3 },
  { name: '海门岛', tier: 4 },
  { name: '摩云城', tier: 4 },
  { name: '醒狮谷', tier: 5 },
  { name: '铁风群岛', tier: 5 },
  { name: '七阶秘境', tier: 7 },
];

export interface DeckStats {
  total: number;
  shengtong: number;
  hushen: number;
  lingdan: number;
  lingyao: number;
  wudao: number;
  tricks: number;
  equips: number;
  lingdi: number;
}

export function buildDeck(): Card[] {
  resetCardIds();
  const d: Card[] = [];

  // 神通 30（普通 20 + 火系 5 + 雷系 5）
  for (let i = 0; i < 20; i++)
    d.push(C('神通', 'basic', 'shengtong', SUITS[i % 4], (i % 13) + 1, { damageType: 'normal' }));
  for (let i = 0; i < 5; i++)
    d.push(C('火系神通', 'basic', 'huo', i % 2 ? '♦' : '♥', (i % 13) + 1, { damageType: 'fire' }));
  for (let i = 0; i < 5; i++)
    d.push(C('雷系神通', 'basic', 'lei', i % 2 ? '♣' : '♠', (i % 13) + 1, { damageType: 'thunder' }));

  // 护身 15 / 灵丹 8 / 灵药 5
  for (let i = 0; i < 15; i++) d.push(C('护身', 'basic', 'hushen', SUITS[i % 4], (i % 13) + 1));
  for (let i = 0; i < 8; i++) d.push(C('灵丹', 'basic', 'lingdan', SUITS[i % 4], (i % 13) + 1));
  for (let i = 0; i < 5; i++) d.push(C('灵药', 'basic', 'lingyao', SUITS[i % 4], (i % 13) + 1));

  // 悟道 8（判定型基本牌）
  for (let i = 0; i < 8; i++)
    d.push(
      C('悟道', 'basic', 'wudao', SUITS[i % 4], (i % 13) + 1, {
        desc: '以判定牌悟道：红色「道心澄明」，黑色「心魔滋生」。',
      }),
    );

  // 符篆 / 阵法 / 秘术 / 灵魂契约
  for (const t of TRICKS) {
    for (let i = 0; i < t.count; i++) {
      d.push(C(t.name, 'fu', t.sub, SUITS[i % 4], (i % 13) + 1, { desc: t.desc }));
    }
  }

  // 法宝（装备）
  for (const e of EQUIPS) {
    d.push(C(e.name, 'faqi', e.sub, SUITS[d.length % 4], (d.length % 13) + 1, { desc: e.desc }));
  }

  // 灵地
  for (const l of LINGDI_CARDS) {
    d.push(
      C(l.name, 'lingdi', 'lingdi' as CardSub, SUITS[d.length % 4], (d.length % 13) + 1, {
        desc: `${l.tier} 阶灵地：占据后可满足境界突破的灵地门槛。`,
      }),
    );
  }

  return d;
}

export function deckStats(deck: Card[]): DeckStats {
  const s: DeckStats = {
    total: deck.length,
    shengtong: 0,
    hushen: 0,
    lingdan: 0,
    lingyao: 0,
    wudao: 0,
    tricks: 0,
    equips: 0,
    lingdi: 0,
  };
  for (const c of deck) {
    if (c.sub === 'shengtong' || c.sub === 'huo' || c.sub === 'lei') s.shengtong++;
    else if (c.sub === 'hushen') s.hushen++;
    else if (c.sub === 'lingdan') s.lingdan++;
    else if (c.sub === 'lingyao') s.lingyao++;
    else if (c.sub === 'wudao') s.wudao++;
    else if (c.type === 'fu') s.tricks++;
    else if (c.type === 'faqi') s.equips++;
    else if (c.type === 'lingdi') s.lingdi++;
  }
  return s;
}

/** 灵地卡名 → 阶位 */
export function lingdiTierOf(cardName: string): number {
  const hit = LINGDI_CARDS.find((l) => l.name === cardName);
  return hit?.tier ?? 0;
}

/** 法宝攻击范围（本命法宝/法器） */
export function weaponRange(cardName: string): number {
  const map: Record<string, number> = {
    通明幻镜: 2,
    洼角云刀: 3,
    七芯蝎尾夺: 1,
    伪无形剑: 2,
    青铜长戟: 3,
  };
  return map[cardName] ?? 1;
}
