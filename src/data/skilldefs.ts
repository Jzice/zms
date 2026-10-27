/* ==================== 技能登记表 ====================
 * 技能名全部取自 docs：
 *   docs/md/技能/（41 项真实技能/法器/阵法/符篆名称）
 *   本命天赋取自 docs/md/角色/楚秦门/03.金丹/齐休.md（【不在算中】【明己心】【料敌机先】）
 * 技能以「时机 + 费用 + 限制 + 效果原语」声明式建模，
 * 由 skillEngine 统一分派 SkillE，避免各写结算分支。
 */
import type { SkillDef } from '../core/types';

const defs: SkillDef[] = [
  /* ---------- 攻击类 ---------- */
  {
    id: 'wanjianzuanxin',
    name: '万剑钻心',
    desc: '出牌阶段，弃 1 张手牌，对一名其他角色造成 1 点伤害。',
    kind: 'active',
    cost: { hand: 1 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1 }],
  },
  {
    id: 'wajiaoyundao',
    name: '洼角云刀',
    desc: '三阶极品法器。出牌阶段，消耗 1 灵力，对一名其他角色造成 1 点伤害。',
    kind: 'active',
    cost: { lingli: 1 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1 }],
  },
  {
    id: 'bilinzhan',
    name: '碧磷斩',
    desc: '法术。出牌阶段，消耗 1 灵力，对一名其他角色造成 1 点火系伤害。',
    kind: 'active',
    cost: { lingli: 1 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1, type: 'fire' }],
  },
  {
    id: 'jiuhanbihuo',
    name: '极寒碧火诀',
    desc: '道法功法。出牌阶段，消耗 1 灵力，对一名其他角色造成 1 点雷系伤害。',
    kind: 'active',
    cost: { lingli: 1 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1, type: 'thunder' }],
  },
  {
    id: 'huanyingduoxin',
    name: '幻影夺心刺',
    desc: '出牌阶段，弃 2 张手牌，对一名其他角色造成 1 点伤害。',
    kind: 'active',
    cost: { hand: 2 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1 }],
  },
  {
    id: 'leiyinruti',
    name: '雷音入体',
    desc: '秘法功法。出牌阶段，消耗 2 灵力，对一名其他角色造成 1 点雷系伤害。',
    kind: 'active',
    cost: { lingli: 2 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1, type: 'thunder' }],
  },
  {
    id: 'qijianzhanyuan',
    name: '七剑斩元星',
    desc: '楚问剑阵招式。出牌阶段，消耗 2 灵力，对一名其他角色造成 1 点伤害并摸 1 张牌。',
    kind: 'active',
    cost: { lingli: 2 },
    oncePerTurn: true,
    effects: [
      { k: 'damage', n: 1 },
      { k: 'draw', n: 1 },
    ],
  },
  {
    id: 'yijianbihuan',
    name: '一剑碧环星',
    desc: '剑阵招式。出牌阶段，弃 1 张手牌，对一名其他角色造成 1 点伤害。',
    kind: 'active',
    cost: { hand: 1 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1 }],
  },
  {
    id: 'wanwuguishazhen',
    name: '万物归沙阵',
    desc: '大阵。出牌阶段，消耗 3 灵力，对所有其他角色各造成 1 点伤害。',
    kind: 'active',
    cost: { lingli: 3 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1 }],
  },

  /* ---------- 恢复 / 修为类 ---------- */
  {
    id: 'zhujidan',
    name: '筑基丹',
    desc: '出牌阶段，弃 1 张手牌，回复 1 点寿元。',
    kind: 'active',
    cost: { hand: 1 },
    oncePerTurn: true,
    effects: [{ k: 'heal', n: 1 }],
  },
  {
    id: 'lingta',
    name: '玲珑塔',
    desc: '齐休参悟之物。出牌阶段，消耗 1 灵力，获得 2 点修为。',
    kind: 'active',
    cost: { lingli: 1 },
    oncePerTurn: true,
    effects: [{ k: 'xiuwei', n: 2 }],
  },
  {
    id: 'qingshi',
    name: '青灵石蒲团',
    desc: '出牌阶段，获得 1 点修为并回复 1 点灵力。',
    kind: 'active',
    oncePerTurn: true,
    effects: [
      { k: 'xiuwei', n: 1 },
      { k: 'lingli', n: 1 },
    ],
  },
  {
    id: 'wannianrongmu',
    name: '万年榕木心',
    desc: '灵物。出牌阶段，消耗 1 灵力，回复 1 点寿元并获得 1 点修为。',
    kind: 'active',
    cost: { lingli: 1 },
    oncePerTurn: true,
    effects: [
      { k: 'heal', n: 1 },
      { k: 'xiuwei', n: 1 },
    ],
  },
  {
    id: 'chuwudai',
    name: '储物袋',
    desc: '出牌阶段，摸 1 张牌。',
    kind: 'active',
    oncePerTurn: true,
    effects: [{ k: 'draw', n: 1 }],
  },

  /* ---------- 防御 / 被动类 ---------- */
  {
    id: 'tongmingshenshi',
    name: '通明身识',
    desc: '锁定：你受到的伤害减少 1 点（至少 1）。',
    kind: 'passive',
    effects: [{ k: 'reduceDamage', n: 1 }],
  },
  {
    id: 'qianhuannichang',
    name: '千幻霓裳',
    desc: '替身法器。锁定：手牌上限 +1。',
    kind: 'passive',
    effects: [{ k: 'handLimit', n: 1 }],
  },
  {
    id: 'qingfengfapao',
    name: '清风法袍',
    desc: '法器道袍，绣风罩符阵。锁定：其他角色到你的距离 +1。',
    kind: 'passive',
    effects: [{ k: 'distMod', n: 1 }],
  },
  {
    id: 'lingshuiyujue',
    name: '灵水玉玦',
    desc: '法器。锁定：你与其他角色的距离 -1。',
    kind: 'passive',
    effects: [{ k: 'distMod', n: -1 }],
  },
  {
    id: 'linghoushenfa',
    name: '灵猴身法',
    desc: '身法传承。锁定：你的攻击范围 +1。',
    kind: 'passive',
    effects: [{ k: 'rangeMod', n: 1 }],
  },
  {
    id: 'houmianjinshen',
    name: '猴面金身法像',
    desc: '锁定：回合开始时获得 1 点灵力。',
    kind: 'passive',
    effects: [{ k: 'lingli', n: 1 }],
  },
  {
    id: 'qixingdingshen',
    name: '七星定身阵',
    desc: '剑阵，持续锁定气机。出牌阶段，消耗 2 灵力，令一名其他角色弃 2 张手牌。',
    kind: 'active',
    cost: { lingli: 2 },
    oncePerTurn: true,
    effects: [{ k: 'discard', n: 2 }],
  },
  {
    id: 'mingyinfu',
    name: '命隐符',
    desc: '隔绝命运探查。锁定：你的手牌上限 +1，且不受秘术类指定。',
    kind: 'passive',
    effects: [{ k: 'handLimit', n: 1 }],
  },
  {
    id: 'mingyanshu',
    name: '命演术',
    desc: '南宫家秘术。出牌阶段，消耗 1 道心，摸 2 张牌。',
    kind: 'active',
    cost: { daoxin: 1 },
    oncePerTurn: true,
    effects: [{ k: 'draw', n: 2 }],
  },
  {
    id: 'qijiaolinglongxin',
    name: '七窍玲珑心',
    desc: '锁定：你受到的伤害减少 1 点，且摸牌阶段多摸 1 张。',
    kind: 'passive',
    effects: [
      { k: 'reduceDamage', n: 1 },
      { k: 'draw', n: 1 },
    ],
  },
  {
    id: 'liushuiputi',
    name: '流水菩提串',
    desc: '法器。锁定：回合开始时获得 1 点道心。',
    kind: 'passive',
    effects: [{ k: 'daoxin', n: 1 }],
  },

  /* ---------- 坐骑 / 灵地 ---------- */
  {
    id: 'yimuyufengsuo',
    name: '乙木御风梭',
    desc: '三阶极品飞行法器，可搭载多人。锁定：你与其他角色的距离 -1。',
    kind: 'passive',
    effects: [{ k: 'distMod', n: -1 }],
  },

  /* ---------- 本命天赋（docs 齐休：不在算中 / 明己心 / 料敌机先） ---------- */
  {
    id: 'buzaisuanzhong',
    name: '不在算中',
    desc: '本命天赋：不能被命运之术预测演算。锁定：你受到的伤害减少 1 点。',
    kind: 'benming',
    effects: [{ k: 'reduceDamage', n: 1 }],
  },
  {
    id: 'mingjixin',
    name: '明己心',
    desc: '本命天赋：谨守本心。锁定：回合开始时获得 1 点灵力。',
    kind: 'benming',
    effects: [{ k: 'lingli', n: 1 }],
  },
  {
    id: 'liaodijixian',
    name: '料敌机先',
    desc: '本命天赋：料敌于先。锁定：你的攻击范围 +1，且摸牌阶段多摸 1 张。',
    kind: 'benming',
    effects: [
      { k: 'rangeMod', n: 1 },
      { k: 'draw', n: 1 },
    ],
  },
  {
    id: 'chikemaohou',
    name: '赤尻马猴',
    desc: '本命：齐休识海本命之物。锁定：回合开始时获得 1 点修为。',
    kind: 'benming',
    effects: [{ k: 'xiuwei', n: 1 }],
  },
  {
    id: 'quanzhi',
    name: '全知大道',
    desc: '本命天赋：活在当下的全知。锁定：摸牌阶段多摸 1 张。',
    kind: 'benming',
    effects: [{ k: 'draw', n: 1 }],
  },

  /* ---------- 扩充：法宝 / 阵法 / 身法（均取自 docs 真实名称） ---------- */
  {
    id: 'linghuxianxia',
    name: '灵狐剑匣',
    desc: '本命法宝。锁定：你的攻击范围 +1，且出牌阶段可多出 1 次神通。',
    kind: 'passive',
    effects: [{ k: 'rangeMod', n: 1 }],
  },
  {
    id: 'shuangzhuzhuanxinqu',
    name: '双珠转心壶',
    desc: '本命法宝。锁定：回合开始时获得 1 点道心。',
    kind: 'passive',
    effects: [{ k: 'daoxin', n: 1 }],
  },
  {
    id: 'xingdun',
    name: '星遁',
    desc: '秦长风一脉身法。锁定：你与其他角色的距离 -1。',
    kind: 'passive',
    effects: [{ k: 'distMod', n: -1 }],
  },
  {
    id: 'qicaihuanlongshe',
    name: '七彩幻珑蛇',
    desc: '幻珑真意所化。锁定：摸牌阶段多摸 1 张。',
    kind: 'passive',
    effects: [{ k: 'draw', n: 1 }],
  },
  {
    id: 'yitongjinsihou',
    name: '异瞳金丝猴',
    desc: '异瞳之瞳。锁定：你受到的伤害减少 1 点。',
    kind: 'passive',
    effects: [{ k: 'reduceDamage', n: 1 }],
  },
  {
    id: 'yinjiakua',
    name: '银甲乐傀',
    desc: '乐傀秘术。锁定：回合开始时获得 1 点灵力。',
    kind: 'passive',
    effects: [{ k: 'lingli', n: 1 }],
  },
  {
    id: 'guangkai',
    name: '广开道德金光大阵',
    desc: '大阵。出牌阶段，消耗 3 灵力，令所有角色各摸 1 张牌。',
    kind: 'active',
    cost: { lingli: 3 },
    oncePerTurn: true,
    effects: [{ k: 'draw', n: 1 }],
  },
  {
    id: 'bafang',
    name: '八方不动多宝阵',
    desc: '大阵。出牌阶段，消耗 2 灵力，获得 2 点护盾。',
    kind: 'active',
    cost: { lingli: 2 },
    oncePerTurn: true,
    effects: [{ k: 'shield', n: 2 }],
  },
  {
    id: 'fanwuxing',
    name: '反五行大阵',
    desc: '大阵。锁定：其他角色到你的距离 +1。',
    kind: 'passive',
    effects: [{ k: 'distMod', n: 1 }],
  },
  {
    id: 'sanmuhuixin',
    name: '三木回心阵',
    desc: '阵法。出牌阶段，消耗 1 灵力，回复 1 点寿元。',
    kind: 'active',
    cost: { lingli: 1 },
    oncePerTurn: true,
    effects: [{ k: 'heal', n: 1 }],
  },
  {
    id: 'yingzaolishi',
    name: '营造力士',
    desc: '符篆。出牌阶段，弃 1 张手牌，对一名其他角色造成 1 点伤害。',
    kind: 'active',
    cost: { hand: 1 },
    oncePerTurn: true,
    effects: [{ k: 'damage', n: 1 }],
  },
  {
    id: 'wuchenlian',
    name: '乌茎泽兰',
    desc: '阵法。锁定：手牌上限 +1。',
    kind: 'passive',
    effects: [{ k: 'handLimit', n: 1 }],
  },
  {
    id: 'hongyuzhenpan',
    name: '红玉阵盘',
    desc: '阵盘秘宝。锁定：回合开始时获得 1 点灵力。',
    kind: 'passive',
    effects: [{ k: 'lingli', n: 1 }],
  },
  {
    id: 'yinhefeng',
    name: '银盒封',
    desc: '奇门。锁定：摸牌阶段多摸 1 张。',
    kind: 'passive',
    effects: [{ k: 'draw', n: 1 }],
  },
  {
    id: 'yinxue',
    name: '银血',
    desc: '血影邪功。锁定：回合开始时获得 1 点修为。',
    kind: 'passive',
    effects: [{ k: 'xiuwei', n: 1 }],
  },
  {
    id: 'shaxue',
    name: '杀道',
    desc: '以杀证道。锁定：出牌阶段可多出 1 次神通。',
    kind: 'passive',
    effects: [{ k: 'rangeMod', n: 1 }],
  },
  {
    id: 'moyunzao',
    name: '摩云鬣之躯',
    desc: '古兽之躯。锁定：你受到的伤害减少 1 点。',
    kind: 'passive',
    effects: [{ k: 'reduceDamage', n: 1 }],
  },
  {
    id: 'fengxi',
    name: '风息归土',
    desc: '古兽吐息。锁定：你与其他角色的距离 -1。',
    kind: 'passive',
    effects: [{ k: 'distMod', n: -1 }],
  },
  {
    id: 'shizhen',
    name: '狮身奔雷',
    desc: '罡风层雷电古兽。锁定：你的攻击范围 +1。',
    kind: 'passive',
    effects: [{ k: 'rangeMod', n: 1 }],
  },
  {
    id: 'yinxingshan',
    name: '银象山古象',
    desc: '化神古象。锁定：手牌上限 +2。',
    kind: 'passive',
    effects: [{ k: 'handLimit', n: 2 }],
  },
  {
    id: 'xiaoheixia',
    name: '小黑',
    desc: '三阶灵兽，随行护主。锁定：手牌上限 +1。',
    kind: 'passive',
    effects: [{ k: 'handLimit', n: 1 }],
  },
  {
    id: 'youlin',
    name: '幽冥锁链',
    desc: '鬼修手段。锁定：你的攻击范围 +1。',
    kind: 'passive',
    effects: [{ k: 'rangeMod', n: 1 }],
  },
  {
    id: 'mingxin',
    name: '明心',
    desc: '儒门心法。锁定：回合开始时获得 1 点道心。',
    kind: 'passive',
    effects: [{ k: 'daoxin', n: 1 }],
  },
  {
    id: 'ziwei',
    name: '紫薇斗数',
    desc: '术数。锁定：摸牌阶段多摸 1 张。',
    kind: 'passive',
    effects: [{ k: 'draw', n: 1 }],
  },
];

export const SKILL_MAP: Record<string, SkillDef> = Object.fromEntries(
  defs.map((d) => [d.id, d]),
);

/** 取技能定义（一人一面，登记表引用） */
export function skillOf(id: string): SkillDef {
  const d = SKILL_MAP[id];
  if (!d) throw new Error(`未登记的技能：${id}`);
  return d;
}

export function skillsOf(ids: string[]): SkillDef[] {
  return ids.filter((i) => SKILL_MAP[i]).map((i) => SKILL_MAP[i]);
}
