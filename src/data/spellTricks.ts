/* ==================== 符篆 / 阵法 / 秘术 ====================
 * docs 出处：docs/md/技能/（41 项真实技能/法器/阵法/符篆名称）
 *   docs/md/物事/法阵/法阵列表.md；docs/md/设定/灵魂契约.md
 * 卡名一律使用 docs 真实名称，禁止新造。
 */
import type { CardSub } from '../core/types';

export interface TrickDef {
  /** 卡牌名（docs 真实名称） */
  name: string;
  sub: CardSub;
  /** 牌堆张数 */
  count: number;
  desc: string;
  /** docs 出处 */
  source: string;
}

export const TRICKS: TrickDef[] = [
  {
    name: '储物袋',
    sub: 'fuzhuan',
    count: 4,
    desc: '摸 2 张牌。（对应「无中生有」）',
    source: 'docs/md/技能/储物袋.md',
  },
  {
    name: '破阵符',
    sub: 'fuzhuan',
    count: 6,
    desc: '弃置一名其他角色的一张牌。（对应「过河拆桥」）',
    source: 'docs/raw/第023卷「高阶破阵符的制作之法」',
  },
  {
    name: '心生蜂云剑',
    sub: 'fuzhuan',
    count: 5,
    desc: '获得一名其他角色的一张牌。（对应「顺手牵羊」）',
    source: 'docs/md/技能/心生蜂云剑.md',
  },
  {
    name: '幻影夺心刺',
    sub: 'mishu',
    count: 3,
    desc: '与一名其他角色斗法，败者受 1 点伤害。（对应「决斗」）',
    source: 'docs/md/技能/幻影夺心刺.md',
  },
  {
    name: '十方风火归元大阵',
    sub: 'zhenfa',
    count: 3,
    desc: '所有其他角色须打出神通，否则受 1 点伤害。（对应「南蛮入侵」）',
    source: 'docs/md/技能/十方风火归元大阵.md',
  },
  {
    name: '万剑钻心',
    sub: 'zhenfa',
    count: 1,
    desc: '所有其他角色须打出护身，否则受 1 点伤害。（对应「万箭齐发」）',
    source: 'docs/md/技能/万剑钻心.md',
  },
  {
    name: '三木回心阵',
    sub: 'zhenfa',
    count: 1,
    desc: '所有角色各回复 1 点寿元。（对应「桃园结义」）',
    source: 'docs/md/技能/三木回心阵.md',
  },
  {
    name: '命隐符',
    sub: 'fuzhuan',
    count: 4,
    desc: '抵消一张符篆/阵法/秘术的效果。（对应「无懈可击」）',
    source: 'docs/md/技能/命隐符.md',
  },
  {
    name: '七星定身阵',
    sub: 'zhenfa',
    count: 3,
    desc: '延时判定：判定牌不为红桃则跳过出牌阶段。（对应「乐不思蜀」）',
    source: 'docs/md/技能/七星定身阵.md「持续锁定气机」',
  },
  {
    name: '天劫',
    sub: 'zhenfa',
    count: 2,
    desc: '延时判定：判定牌为黑桃 2-9 则受 3 点雷系伤害。（对应「闪电」）',
    source: 'docs/md/势力/本届势力.md「天劫难渡」',
  },
  {
    name: '银甲乐傀',
    sub: 'mishu',
    count: 2,
    desc: '令一名其他角色对另一名角色使用神通。（对应「借刀杀人」）',
    source: 'docs/md/技能/银甲乐傀.md',
  },
  {
    name: '青灵石蒲团',
    sub: 'fuzhuan',
    count: 2,
    desc: '所有角色各摸 1 张牌。（对应「五谷丰登」）',
    source: 'docs/md/技能/青灵石蒲团.md',
  },
  {
    name: '乌茎泽兰',
    sub: 'zhenfa',
    count: 6,
    desc: '横置/重置角色，传导伤害。（对应「铁索连环」）',
    source: 'docs/md/技能/乌茎泽兰.md',
  },
  {
    name: '碧火幽魂刀',
    sub: 'mishu',
    count: 3,
    desc: '展示手牌，令一名角色受 1 点火系伤害。（对应「火攻」）',
    source: 'docs/md/技能/碧火幽魂刀.md',
  },
  {
    name: '灵魂契约',
    sub: 'linghunqiyue',
    count: 4,
    desc: '以真名录于羊皮纸，与一名其他角色立约；背盟者遭灵魂反噬。',
    source: 'docs/md/设定/灵魂契约.md',
  },
];

export const TRICK_MAP: Record<string, TrickDef> = Object.fromEntries(
  TRICKS.map((t) => [t.name, t]),
);

/** 总张数（牌堆构成断言用） */
export function trickTotal(): number {
  return TRICKS.reduce((s, t) => s + t.count, 0);
}
