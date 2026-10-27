/* ==================== 掌门杀 · 领域类型 ====================
 * 术语全部取自 docs（《修真门派掌门路》设定库），严禁新造。
 * 关键不变量（移植自 learn_kill）：
 *   ① G 字段形状冻结 —— state_sync 直接序列化 G，客户端结构化解包；
 *   ② 新增字段一律「可空 + 增量追加」，保证联机前后兼容。
 */

/* ---------------- 阵营 / 势力 / 地域 ---------------- */

/** 阵营（公开，源自角色设定）：人类 / 兽类 / 魔修 / 鬼修 */
export type Camp = 'human' | 'beast' | 'moxiu' | 'guixiu';

/** 势力层级（docs 势力列表「按大类」）：超级宗门/宗门/家族/附庸/组织/联盟/商会/分支机构 */
export type PowerTier =
  | 'super'
  | 'sect'
  | 'family'
  | 'vassal'
  | 'org'
  | 'league'
  | 'guild'
  | 'branch';

/** 地域（docs 势力列表「按地域」）：白山/南疆/外海/齐云/跨区/跨界 */
export type Region = 'baishan' | 'nanjiang' | 'waihai' | 'qiyun' | 'kuaqu' | 'kuajie';

/** 决策选项（启发式枚举 / 大模型选择共用） */
export interface ChoiceOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  hint?: string;
}

export interface Power {
  id: string;
  name: string;
  tier: PowerTier;
  region: Region;
  camp: Camp;
}

/** 灵地（docs 修行体系「进阶必须 N 阶灵地」）：一至九阶 */
export interface Lingdi {
  id: string;
  name: string;
  tier: number; // 1~9
  region: Region;
}

/* ---------------- 身份池 ---------------- */

/** 身份所属方：正道 / 外道 / 隐匿 / 公开高位 */
export type RoleSide = 'zhengdao' | 'waidao' | 'yinni' | 'gaowei';

/** 胜利目标（结算按 goal 分类统一处理，避免为每种身份写分支） */
export type RoleGoal =
  | 'purgeAll' // 肃清外道与隐匿方（掌门）
  | 'guardMaster' // 护掌门（弟子/长老/客卿/执事）
  | 'killMaster' // 弑掌门（邪修/鬼修/魔修/兽类）
  | 'soloSurvive' // 独善其身 / 单挑独胜（散修/黑手）
  | 'upholdContract' // 监督灵魂契约（公正鬼）
  | 'powerHegemony' // 势力称雄（座主/老祖/界主）
  | 'holdLingdi'; // 守灵地 / 灵地最多（镇守/城主）

export interface RoleDef {
  id: string;
  name: string;
  side: RoleSide;
  campHint: Camp[];
  public: boolean;
  goal: RoleGoal;
  weight: number;
  defaultOn: boolean;
  desc: string;
}

/* ---------------- 境界 / 灵根 / 本命 ---------------- */

export type RealmId = 'lianqi' | 'zhuji' | 'jindan' | 'yuanying' | 'huashen';
/** 初期 / 中期 / 后期 / 大圆满（docs 修行体系） */
export type RealmStage = 'early' | 'mid' | 'late' | 'peak';

export interface RealmLayer {
  realm: RealmId;
  stage: RealmStage;
  lingliMax: number; // 灵力上限
  xiuweiNeed: number; // 突破到下一层所需修为
  lifespan: number; // 寿元（120/200/500/2000/10000）
  /** 突破到「下一境界」所需灵地阶位（docs：筑基一阶/金丹三阶/元婴五阶/化神七阶） */
  lingdiTierNeed?: number;
}

/** 性别 */
export type Gender = 'm' | 'f';

/** 灵根（docs 本命.md：灵根对应本命，越多越杂修炼越慢） */
export type SpiritRoot =
  | 'metal'
  | 'wood'
  | 'water'
  | 'fire'
  | 'earth'
  | 'sword'
  | 'thunder'
  | 'wind'
  | 'ice';

/* ---------------- 卡牌 ---------------- */

/**
 * 卡牌大类：
 *  basic 基本牌（神通/护身/灵丹/灵药/悟道）
 *  fu    符篆（含阵法·法阵、秘术）
 *  faqi  法宝（本命法宝·法器/护身/飞梭·灵舟/秘宝·重宝）
 *  lingdi 灵地
 */
export type CardType = 'basic' | 'fu' | 'faqi' | 'lingdi';

/** 基本牌子类的中文键（术语取自 docs） */
export type CardSub =
  // 基本牌
  | 'shengtong' // 神通（原「杀」）
  | 'huo' // 火系神通
  | 'lei' // 雷系神通
  | 'hushen' // 护身（原「闪」）
  | 'lingdan' // 灵丹（原「桃」）
  | 'lingyao' // 灵药（原「酒」）
  | 'wudao' // 悟道（新增，判定型）
  // 符篆
  | 'fuzhuan' // 符篆
  | 'zhenfa' // 阵法 / 法阵
  | 'mishu' // 秘术
  | 'linghunqiyue' // 灵魂契约
  // 法宝
  | 'benmingfaqi' // 本命法宝 / 法器（攻击距离）
  | 'fangju' // 护身（防具）
  | 'feisuo' // 飞梭 / 灵舟（距离修正）
  | 'mibao' // 秘宝 / 重宝
  // 判定
  | 'tianjie' // 天劫
  | 'qixingdinggshen'; // 七星定身阵

export type Suit = '♠' | '♥' | '♣' | '♦';
export type DamageType = 'normal' | 'fire' | 'thunder';

export interface Card {
  id: number;
  name: string;
  type: CardType;
  sub: CardSub;
  suit: Suit;
  num: string | number;
  desc?: string;
  damageType?: DamageType;
}

/* ---------------- 技能效果原语 ---------------- */

/** 技能/伴兽被动共用的效果原语（skillEngine 统一分派，避免各写结算分支） */
export type SkillE =
  | { k: 'draw'; n: number }
  | { k: 'damage'; n: number; type?: DamageType }
  | { k: 'heal'; n: number }
  | { k: 'xiuwei'; n: number }
  | { k: 'lingli'; n: number }
  | { k: 'daoxin'; n: number }
  | { k: 'discard'; n: number }
  | { k: 'distMod'; n: number }
  | { k: 'rangeMod'; n: number }
  | { k: 'reduceDamage'; n: number }
  | { k: 'shield'; n: number }
  | { k: 'handLimit'; n: number }
  | { k: 'lingdiTier'; n: number };

/** 技能定义（时机 + 费用 + 限制 + 效果原语） */
export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  /** 主动 / 触发 / 锁定 / 本命天赋 */
  kind: 'active' | 'trigger' | 'passive' | 'benming';
  cost?: { lingli?: number; daoxin?: number; hand?: number };
  /** 每回合限一次 */
  oncePerTurn?: boolean;
  effects: SkillE[];
}

/* ---------------- 灵兽 / 伴兽 ---------------- */

export interface BeastDef {
  id: string;
  name: string;
  attr: SpiritRoot | 'beast';
  tier: string; // 三阶灵兽 / 金丹级 / 元婴级 / 化神古兽
  hp: number;
  avatar: string;
  desc: string;
  camp: 'beast';
  passive?: { name: string; desc: string; effects: SkillE[] };
  active?: {
    id: string;
    name: string;
    desc: string;
    effects: SkillE[];
    daoxinCost?: number;
  };
  /** 限定主人角色 id（如金冠孔雀仅喀尔威明） */
  ownerOnly?: string;
}

export interface BeastState {
  id: string;
  hp: number;
  maxHp: number;
  broken: boolean;
}

/* ---------------- 灵魂契约 ---------------- */

/** 契约条款类型（docs 灵魂契约.md） */
export type ContractTerm =
  | 'noAttack' // 互不攻击
  | 'shareDraw' // 共享摸牌
  | 'shareLingli' // 共享灵力
  | 'jointDefense'; // 共同御敌

export interface ContractDef {
  id: string;
  name: string; // 灵魂契约
  terms: ContractTerm[];
  duration: number | 'forever'; // 期限（回合数或至终局）
  cost: { hand?: number; lingli?: number }; // 约书价值不菲
  backlash: number; // 灵魂反噬强度
  desc: string;
}

export interface ContractState {
  id: string;
  defId: string;
  parties: number[];
  signedTurn: number;
  expireTurn: number; // -1 表示 forever
  broken: boolean;
  brokenBy?: number;
}

/* ---------------- 角色 ---------------- */

export interface Character {
  id: string;
  name: string;
  title: string; // 道号 / 称号
  camp: Camp;
  power: string; // 势力 id
  powerTier: PowerTier;
  region: Region;
  realm: RealmId; // 初始境界（上限 = 本境大圆满）
  spiritRoots: SpiritRoot[]; // 灵根数组（长度 = 灵根数 = 本命数）
  benming: string; // 本命
  dao?: string; // 大道（清风大道 / 全知大道 …）
  gender: Gender;
  hp: number; // 寿元
  avatar: string;
  skills: SkillDef[];
  /** 仅御兽门角色：可选伴兽白名单 */
  beastPool?: string[];
  /** 境界突破时开启的本命天赋 */
  awakenSkill?: string;
}

/* ---------------- 玩家 / 全局状态 ---------------- */

export interface PlayerFlags {
  /** 本回合是否已使用【悟道】 */
  wudaoUsed: boolean;
  /** 本回合是否受伤（闭关被打断判定） */
  hurtThisTurn: boolean;
  /** 本回合是否已闭关 */
  closedDoor: boolean;
  /** 本回合已发动技能次数（key = skillId 或 beast_<id>） */
  skillUse: Record<string, number>;
}

export interface Player {
  seat: number;
  name: string;
  /** 是否为 AI */
  ai: boolean;
  /** AI 决策模式：'heuristic'=启发式，'llm'=大模型接管（仅 ai=true 生效） */
  aiMode?: 'heuristic' | 'llm';
  /** 联机 peerId（联机席位） */
  peerId?: string;
  charId: string;
  camp: Camp;
  power: string;
  region: Region;
  role: string; // RoleDef.id
  rolePublic: boolean;
  /** 寿元（血量） */
  hp: number;
  maxHp: number;
  hand: Card[];
  equips: Partial<Record<CardSub, Card>>;
  /** 修为 */
  xiuwei: number;
  realm: RealmId;
  realmStage: RealmStage;
  /** 灵力（境界派生、回合回复的施法资源） */
  lingli: number;
  /** 道心（悟道产出，可抵伤/当护身/自救） */
  daoxin: number;
  /** 占据的灵地（提供灵地阶位） */
  lingdi: string[];
  /** 伴兽（仅御兽门） */
  beast?: BeastState;
  /** 灵魂契约 */
  contracts: ContractState[];
  /** 心头锁（契约束缚标记） */
  heartLock: boolean;
  /** 真名已被哪些座位掌握 */
  trueNameKnown: number[];
  alive: boolean;
  flags: PlayerFlags;
}

export interface LogEntry {
  t: number;
  text: string;
  kind?: 'normal' | 'breakthrough' | 'backlash' | 'contract' | 'system';
}

export interface ChatMsg {
  seat: number;
  name: string;
  text: string;
  t: number;
}

/** 全局状态对象（顶层 render() 全量重绘的唯一数据源） */
export interface G {
  players: Player[];
  deck: Card[];
  discard: Card[];
  /** 当前回合座位 */
  current: number;
  turn: number;
  phase: 'judge' | 'draw' | 'play' | 'discard' | 'over';
  /** 出牌阶段已使用的神通次数 */
  shengtongUsed: number;
  started: boolean;
  over: boolean;
  winners: number[];
  /** 身份池启用子集 */
  enabledRoles: string[];
  logs: LogEntry[];
  chat: ChatMsg[];
  /** 待选择的交互（Promise 桥） */
  pending: PendingChoice | null;
  /** 大模型思考中座位（UI 指示用，不随结算逻辑使用） */
  thinkingSeat: number | null;
  /** 结算摘要 */
  settle: SettleInfo | null;
}

export interface SettleInfo {
  winners: number[];
  campHonor: Camp[];
  title: string;
  lines: string[];
}

export type PendingChoice =
  | { kind: 'card'; prompt: string; options: number[]; seat: number }
  | { kind: 'target'; prompt: string; options: number[]; seat: number }
  | { kind: 'confirm'; prompt: string; seat: number }
  | { kind: 'hushen'; prompt: string; seat: number }
  | { kind: 'lingdan'; prompt: string; seat: number }
  | { kind: 'wudao'; prompt: string; seat: number };

/* ---------------- 联机协议 ---------------- */

export type NetMessage =
  | { t: 'hello'; name: string }
  | { t: 'room_state'; players: RoomMember[]; roles: string[]; started: boolean }
  | { t: 'seat_taken'; seat: number; name: string; charId: string }
  | { t: 'start'; state: G }
  | { t: 'state_sync'; state: G }
  | { t: 'choice_request'; seat: number; choice: PendingChoice }
  | { t: 'choice_response'; value: number | 'pass' }
  | { t: 'chat'; seat: number; name: string; text: string }
  | { t: 'leave'; seat: number };

export interface RoomMember {
  seat: number;
  name: string;
  charId: string;
  peerId: string;
  ready: boolean;
}

/* ---------------- 诗词感悟 ---------------- */

export interface DaoVerse {
  id: string;
  text: string;
  source: string;
  kind: 'insight' | 'breakthrough';
  realmFrom?: string;
  realmTo?: string;
}
