/* ==================== 灵兽图鉴（兼伴兽池与兽类可玩角色） ====================
 * docs 出处：docs/md/角色/蛮荒/README.md（古兽/灵兽索引）
 *   docs/md/设定/虾驼兽.md；docs/md/角色/楚秦门/03.金丹/齐休.md（本命赤尻马猴）
 *   docs/md/角色/御兽门/（喀尔威明伴兽金冠孔雀、玉鹤无形鹤、化神老妪之玉兔）
 *   docs/md/技能/（七彩幻珑蛇、异瞳金丝猴）
 *
 * 同一数据三用途：灵兽图鉴 / 御兽门伴兽池 / 兽类可玩角色（ALLOW_BEAST_AS_CHARACTER）
 */
import type { BeastDef, SpiritRoot } from '../core/types';

/** 兽类是否可作为独立可玩角色 */
export const ALLOW_BEAST_AS_CHARACTER = true;

export const BEASTS: BeastDef[] = [
  {
    id: 'xingshi',
    name: '醒狮',
    attr: 'beast',
    tier: '化神古兽',
    hp: 4,
    avatar: '🦁',
    desc: '化神元犼，醒狮谷之主，学习能力极强，能受霍鹳教导。',
    camp: 'beast',
    passive: { name: '狮吼', desc: '你的攻击范围 +1。', effects: [{ k: 'rangeMod', n: 1 }] },
    active: {
      id: 'xingshi_roar',
      name: '狮吼示威',
      desc: '消耗 1 道心，对所有其他角色各造成 1 点伤害。',
      effects: [{ k: 'damage', n: 1 }],
      daoxinCost: 1,
    },
  },
  {
    id: 'manniu',
    name: '蛮牛',
    attr: 'earth',
    tier: '化神古兽',
    hp: 4,
    avatar: '🐂',
    desc: '化神古兽，蛮牛荒原之主，老狮子七次大战无法收服。',
    camp: 'beast',
    passive: { name: '蛮体', desc: '你受到的伤害减少 1 点。', effects: [{ k: 'reduceDamage', n: 1 }] },
  },
  {
    id: 'lanfeng',
    name: '蓝凤异蝶',
    attr: 'wind',
    tier: '化神古兽',
    hp: 3,
    avatar: '🦋',
    desc: '化神古兽，五阶灵地之主，被老狮子南征收服。',
    camp: 'beast',
    passive: { name: '蝶翼', desc: '你与其他角色的距离 -1。', effects: [{ k: 'distMod', n: -1 }] },
    active: {
      id: 'lanfeng_wing',
      name: '异蝶迷风',
      desc: '消耗 1 道心，摸 2 张牌。',
      effects: [{ k: 'draw', n: 2 }],
      daoxinCost: 1,
    },
  },
  {
    id: 'moyunlie',
    name: '摩云鬣',
    attr: 'wind',
    tier: '元婴级古兽',
    hp: 3,
    avatar: '🐗',
    desc: '元婴级古兽，把守摩云山峡谷，后建为摩云城。',
    camp: 'beast',
    passive: { name: '守隘', desc: '其他角色到你的距离 +1。', effects: [{ k: 'distMod', n: 1 }] },
  },
  {
    id: 'fengxiaoxiong',
    name: '风枭熊兽',
    attr: 'wind',
    tier: '元婴级古兽',
    hp: 3,
    avatar: '🐻',
    desc: '元婴级古兽，半熊半枭。',
    camp: 'beast',
    passive: { name: '枭爪', desc: '你的攻击范围 +1。', effects: [{ k: 'rangeMod', n: 1 }] },
  },
  {
    id: 'shishenbenlei',
    name: '狮身奔雷兽',
    attr: 'thunder',
    tier: '元婴级古兽',
    hp: 3,
    avatar: '⚡',
    desc: '元婴级古兽，罡风层雷电古兽。',
    camp: 'beast',
    active: {
      id: 'benlei_bolt',
      name: '奔雷',
      desc: '消耗 1 道心，对一名其他角色造成 1 点雷系伤害。',
      effects: [{ k: 'damage', n: 1, type: 'thunder' }],
      daoxinCost: 1,
    },
  },
  {
    id: 'heishazhu',
    name: '黑煞硬背猪',
    attr: 'earth',
    tier: '元婴级古兽',
    hp: 3,
    avatar: '🐖',
    desc: '元婴级古兽，被御兽门重点捕捉。',
    camp: 'beast',
    passive: { name: '硬背', desc: '你受到的伤害减少 1 点。', effects: [{ k: 'reduceDamage', n: 1 }] },
  },
  {
    id: 'renmianwen',
    name: '人面纹蛇',
    attr: 'water',
    tier: '元婴级灵兽',
    hp: 2,
    avatar: '🐍',
    desc: '元婴级灵兽，赵瑶之友。',
    camp: 'beast',
    passive: { name: '灵纹', desc: '摸牌阶段多摸 1 张。', effects: [{ k: 'draw', n: 1 }] },
  },
  {
    id: 'sichitianying',
    name: '四翅天鹰',
    attr: 'wind',
    tier: '金丹圆满古兽',
    hp: 2,
    avatar: '🦅',
    desc: '金丹圆满古兽，赵瑶骑伴。',
    camp: 'beast',
    passive: { name: '天翔', desc: '你与其他角色的距离 -1。', effects: [{ k: 'distMod', n: -1 }] },
  },
  {
    id: 'xiaohei',
    name: '小黑',
    attr: 'beast',
    tier: '三阶灵兽',
    hp: 1,
    avatar: '🐕‍🦺',
    desc: '三阶灵兽，赵瑶伙伴。',
    camp: 'beast',
    passive: { name: '随行', desc: '手牌上限 +1。', effects: [{ k: 'handLimit', n: 1 }] },
  },
  {
    id: 'xiatuoshou',
    name: '虾驼兽',
    attr: 'earth',
    tier: '三阶灵兽',
    hp: 1,
    avatar: '🦐',
    desc: '御兽门兽船配送，挖矿效率远超凡人；「死也是死兽类，再买就是了」。',
    camp: 'beast',
    passive: { name: '耐役', desc: '回合开始时获得 1 点修为。', effects: [{ k: 'xiuwei', n: 1 }] },
  },
  {
    id: 'jinguankongque',
    name: '金冠孔雀',
    attr: 'fire',
    tier: '化神古兽',
    hp: 3,
    avatar: '🦚',
    desc: '喀尔威明伴兽（月峰与狮巢之主）。',
    camp: 'beast',
    ownerOnly: 'kaerweiming',
    passive: { name: '金冠', desc: '你的攻击范围 +1，且受到的伤害减少 1 点。', effects: [{ k: 'rangeMod', n: 1 }, { k: 'reduceDamage', n: 1 }] },
  },
  {
    id: 'wuxinghe',
    name: '无形鹤',
    attr: 'wind',
    tier: '五阶伴兽',
    hp: 2,
    avatar: '🕊️',
    desc: '玉鹤本命代征之物，五阶；后被玉鹤亲手格杀以悟清风大道。',
    camp: 'beast',
    ownerOnly: 'yuhe',
    passive: { name: '清风无形', desc: '你受到的伤害减少 1 点。', effects: [{ k: 'reduceDamage', n: 1 }] },
    active: {
      id: 'wuxinghe_wind',
      name: '大道清风',
      desc: '消耗 1 道心，获得 2 点修为。',
      effects: [{ k: 'xiuwei', n: 2 }],
      daoxinCost: 1,
    },
  },
  {
    id: 'chikemaohou',
    name: '赤尻马猴',
    attr: 'beast',
    tier: '本命之物',
    hp: 2,
    avatar: '🐒',
    desc: '齐休识海本命之物；结婴时会短暂失去与它的联系。',
    camp: 'beast',
    ownerOnly: 'qixiu',
    passive: { name: '明己', desc: '回合开始时获得 1 点修为。', effects: [{ k: 'xiuwei', n: 1 }] },
  },
  {
    id: 'yutu',
    name: '玉兔',
    attr: 'wood',
    tier: '化神灵兽',
    hp: 3,
    avatar: '🐇',
    desc: '化神老妪所有，后为小魔渊新主人，将魔气之地改造为正道路数。',
    camp: 'beast',
    passive: { name: '正道灵兔', desc: '摸牌阶段多摸 1 张。', effects: [{ k: 'draw', n: 1 }] },
  },
  {
    id: 'qicaihuanlong',
    name: '七彩幻珑蛇',
    attr: 'water',
    tier: '金丹级灵兽',
    hp: 2,
    avatar: '🌈',
    desc: '幻珑真意所化，与齐休身法传承相关。',
    camp: 'beast',
    passive: { name: '幻珑', desc: '你的攻击范围 +1。', effects: [{ k: 'rangeMod', n: 1 }] },
  },
];

export const BEAST_MAP: Record<string, BeastDef> = Object.fromEntries(
  BEASTS.map((b) => [b.id, b]),
);

export function beastDef(id: string): BeastDef | undefined {
  return BEAST_MAP[id];
}

/** 默认伴兽池（未指定 ownerOnly 的灵兽） */
export function defaultBeastPool(): string[] {
  return BEASTS.filter((b) => !b.ownerOnly).map((b) => b.id);
}

/** 某角色可选的伴兽（专属池 + 默认池） */
export function beastPoolFor(charId: string, extra?: string[]): string[] {
  const owned = BEASTS.filter((b) => b.ownerOnly === charId).map((b) => b.id);
  const pool = [...owned, ...(extra ?? []), ...defaultBeastPool()];
  return Array.from(new Set(pool));
}
