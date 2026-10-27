/* ==================== 大模型接管：Prompt 构造 ====================
 * 一次决策的上下文由以下各段拼装：
 *   system ：角色设定 + 输出契约 + 进攻倾向纠偏 + 身份目标
 *   user   ：① 自身视角（私有信息）② 他人视角（公开信息 + 距离与可攻击标记）
 *            ③ 信念摘要（对各座位身份方的推断概率，来自 aibrain）④ 恩怨摘要 ⑤ 近期战报
 *            ⑥ 决策引导语 + 枚举选项 + 输出格式要求
 *
 * 信息不对称是硬约束：② 中绝不泄露他人手牌内容与未揭示身份。
 * 上下文为「无状态全量重述」——不保留多轮对话，跨回合记忆由 ③④⑤ 显式注入。
 */
import type { Card, ChoiceOption, Player } from '../core/types';
import { G } from '../game/state';
import { ROLE_MAP, SIDE_NAME } from '../data/roles';
import { skillOf } from '../data/skilldefs';
import { charOf } from '../data/characters';
import { POWER_MAP } from '../data/powers';
import { attackRange, distanceTo, canTargetShengtong } from '../game/rules';
import { beliefProbs, grudgeOf } from '../game/aibrain';
import type { LlmDecisionKind, LlmMessage } from './types';

const SIDE_OBJ: Record<string, string> = {
  zhengdao: '正道方（掌门/弟子/长老/客卿/执事，目标：肃清外道与隐匿方，护掌门）',
  waidao: '外道方（邪修/鬼修/魔修/兽类，目标：弑掌门，或势大独胜）',
  yinni: '隐匿方（散修/黑手/公正鬼，目标：独善其身/单挑独胜，或监督灵魂契约）',
  gaowei: '公开高位方（座主/老祖/镇守/界主/城主，目标：势力称雄或守灵地）',
};

const HISTORY_LINES = 12;
const BELIEF_MIN = 0.15;

function pubRole(p: Player): string {
  if (p.rolePublic) return ROLE_MAP[p.role]?.name ?? p.role;
  return '隐藏（未亮明）';
}

function selfView(idx: number): string {
  const p = G.players[idx];
  const c = charOf(p.charId);
  const hand = p.hand
    .map((c) => `「${c.name}」${c.suit}${c.num}${c.sub ? `[${c.sub}]` : ''}`)
    .join('、');
  const eq: string[] = [];
  for (const k of Object.keys(p.equips)) {
    const e = p.equips[k as keyof typeof p.equips];
    if (e) eq.push(e.name);
  }
  const skills = (c?.skills ?? []).map((s) => s.name).join('、') || '无';
  const roleTxt = `${ROLE_MAP[p.role]?.name ?? p.role}（${SIDE_OBJ[ROLE_MAP[p.role]?.side ?? 'zhengdao'] ?? ''}）`;
  return [
    `【你】${p.name}（${c?.name ?? '—'} · ${POWER_MAP[p.power]?.name ?? p.power} · ${c?.title ?? ''}）`,
    `身份：${roleTxt}`,
    `境界：${p.realm}${p.realmStage}　寿元：${p.hp}/${p.maxHp}　修为：${p.xiuwei}　灵力：${p.lingli}　道心：${p.daoxin}`,
    `手牌数：${p.hand.length}　已占据灵地：${(p.lingdi ?? []).length}`,
    `装备：${eq.length ? eq.join('，') : '无'}`,
    `技能：${skills}`,
    `手牌：${hand || '（空）'}`,
  ].join('\n');
}

function othersView(idx: number): string {
  const me = G.players[idx];
  const range = attackRange(me);
  const lines: string[] = [];
  for (let i = 0; i < G.players.length; i++) {
    if (i === idx) continue;
    const p = G.players[i];
    if (!p.alive) {
      lines.push(`座位${i} ${p.name}：已陨落`);
      continue;
    }
    const eq: string[] = [];
    for (const k of Object.keys(p.equips)) {
      const e = p.equips[k as keyof typeof p.equips];
      if (e) eq.push(e.name);
    }
    const role = p.rolePublic ? `身份:${ROLE_MAP[p.role]?.name ?? p.role}` : '身份:隐藏';
    const d = distanceTo(G.players[idx], p);
    const reach = canTargetShengtong(me, p)
      ? `✅在你神通范围内（你的攻击范围${range}，距离${d}）`
      : `✖超出神通范围（你的攻击范围${range}，距离${d}）`;
    lines.push(
      `座位${i} ${p.name}（${POWER_MAP[p.power]?.name ?? p.power}）寿元:${p.hp}/${p.maxHp} 手牌数:${p.hand.length} 装备:${eq.join(',') || '无'} ${role} 距离:${d} ${reach}`,
    );
  }
  return lines.join('\n');
}

function beliefView(idx: number): string {
  const lines: string[] = [];
  for (let i = 0; i < G.players.length; i++) {
    if (i === idx) continue;
    const p = G.players[i];
    if (!p.alive || p.rolePublic) continue;
    const pr = beliefProbs(idx, i);
    const top = (['zhengdao', 'waidao', 'yinni', 'gaowei'] as const)
      .map((k) => ({ k, v: pr[k] }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 2)
      .filter((x) => x.v >= BELIEF_MIN);
    if (!top.length) continue;
    const txt = top.map((x) => `${SIDE_NAME[x.k]} ${Math.round(x.v * 100)}%`).join(' / ');
    lines.push(`  座位${i} ${p.name}：疑似 ${txt}`);
  }
  if (!lines.length) return '';
  return '你的身份推断（依据近期行为观察，不是确定事实）：\n' + lines.join('\n');
}

function grudgeView(idx: number): string {
  const parts: string[] = [];
  for (let i = 0; i < G.players.length; i++) {
    if (i === idx) continue;
    const g = grudgeOf(idx, i);
    if (!g) continue;
    parts.push(`${G.players[i].name}（座位${i}）攻击过你${g}次`);
  }
  if (!parts.length) return '';
  return '恩怨：' + parts.join('；') + '。';
}

function historyView(): string {
  const lines: string[] = [];
  for (const l of G.logs) {
    if (l.kind === 'system' && l.text.includes('🤖[LLM')) continue;
    if (l.text) lines.push(l.text);
  }
  const recent = lines.slice(-HISTORY_LINES);
  if (!recent.length) return '';
  return '近期战报（按时间顺序）：\n' + recent.map((t) => '  ' + t).join('\n');
}

function situationView(idx: number): string {
  const segs = [selfView(idx), '其他角色：\n' + othersView(idx), beliefView(idx), grudgeView(idx), historyView()].filter(
    Boolean,
  );
  return segs.join('\n\n');
}

/* ----------------- 提示词增强层 ----------------- */

const RULE_REF =
  '【基本牌】神通:对神通范围内目标造成1点伤害,每回合限1张(本命法宝连弩除外);' +
  '护身:抵消一次神通或属性攻击;灵丹:回复1点寿元(濒死可自救);' +
  '灵药:本回合下一张神通伤害+1(每回合限一次);悟道:判定(红=道心澄明修为+4,黑=心魔滋生)。\n' +
  '【符篆】符篆/阵法/秘术:多为指定目标或全场效果,按名识意。\n' +
  '【法宝】本命法宝决定攻击范围与特效;护身法宝减伤/免疫;飞梭缩短你到别人的距离;秘宝重宝有奇效。\n' +
  '【灵地】占据灵地可提升势力与突破所需阶位。';

const EVAL_PRINCIPLES =
  '【决策准则】1)优先推进身份目标:打击敌对阵营、保护己方;' +
  '2)出牌先攻击/控场,后防御/补牌;3)保留防御牌(护身/灵丹),非必要不弃;' +
  '4)残血敌方优先击杀;5)误伤友方代价高,出范围攻击/指定目标前先确认阵营关系。';

const CARD_HINT: Record<string, string> = {
  shengtong: '对神通范围内一名目标造成1点伤害(每回合限1张)',
  huo: '火系神通:造成1点火属性伤害(可触发连环)',
  lei: '雷系神通:造成1点雷属性伤害(可触发连环)',
  hushen: '抵消一次神通或属性攻击',
  lingdan: '回复1点寿元;濒死时可自救',
  lingyao: '本回合下一张神通伤害+1(每回合限一次)',
  wudao: '判定:红=道心澄明(修为+4),黑=心魔滋生',
  fuzhuan: '符篆:多为指定目标或全场效果',
  zhenfa: '阵法/法阵:范围或持续效果',
  mishu: '秘术:特殊效果',
  linghunqiyue: '灵魂契约:与友方立约共享资源',
  benmingfaqi: '本命法宝/法器:装备后改变攻击范围或特效',
  fangju: '护身法宝:减伤/免疫',
  feisuo: '飞梭/灵舟:改变距离',
  mibao: '秘宝/重宝:强力特效',
  tianjie: '天劫:判定,黑桃2-9受3雷伤',
  qixingdinggshen: '七星定身阵:判定,非红桃则跳过出牌阶段',
};

function cardById(id: number): Card | undefined {
  for (const p of G.players) {
    const inHand = p.hand.find((c) => c.id === id);
    if (inHand) return inHand;
    for (const k of Object.keys(p.equips)) {
      const e = p.equips[k as keyof typeof p.equips];
      if (e && e.id === id) return e;
    }
  }
  return [...G.discard, ...G.deck].find((c) => c.id === id);
}

/** 根据动作 value 推导一句话语义注解 */
function deriveHint(value: string | number, _label: string): string {
  const s = String(value);
  if (s.startsWith('shengtong:')) {
    const c = cardById(Number(s.split(':')[1]));
    return c?.damageType === 'fire' ? '火属性神通:造成1点火属性伤害' : c?.damageType === 'thunder' ? '雷属性神通:造成1点雷属性伤害' : CARD_HINT.shengtong;
  }
  if (s.startsWith('trick:')) {
    const c = cardById(Number(s.split(':')[1]));
    const sub = c?.sub || '';
    return sub && CARD_HINT[sub] ? `符篆/阵法:${CARD_HINT[sub]}` : '使用一张符篆/阵法';
  }
  if (s.startsWith('skill:')) {
    const id = s.slice('skill:'.length).split(':')[0];
    const d = skillOf(id);
    return d?.desc ? `技能:${d.desc}` : '发动主动技能';
  }
  if (s.startsWith('wudao:')) return `【悟道】:${CARD_HINT.wudao}`;
  if (s.startsWith('lingdi:')) return '占据灵地';
  if (s.startsWith('faqi:')) {
    const c = cardById(Number(s.split(':')[1]));
    const sub = c?.sub || '';
    return sub && CARD_HINT[sub] ? `法宝:${CARD_HINT[sub]}` : '装备法宝';
  }
  if (s.startsWith('beast')) return '发动伴兽主动技';
  if (s.startsWith('lingdan:')) return `【灵丹】:${CARD_HINT.lingdan}`;
  if (s.startsWith('lingyao:')) return `【灵药】:${CARD_HINT.lingyao}`;
  if (s.startsWith('contract:')) return '与友方立灵魂契约';
  if (s === 'end') return '结束出牌阶段(停止行动)';
  if (s === 'close') return '闭关:弃手牌换修为(回合末)';
  if (s === 'skip') return '不采取行动';
  if (/^\d+$/.test(s)) {
    const c = cardById(Number(s));
    if (c) return `手牌:${c.name}`;
  }
  return '';
}

const SYSTEM_BASE =
  '你是桌游《掌门杀》（三国杀-like 修真身份局）中一名由大模型驱动的 AI 玩家。' +
  '请基于当前局面与你的身份目标，做出最合理的决策。' +
  '你只能在给出的「可选动作」列表里选择，严格按要求的 JSON 格式输出，不要输出多余文字。' +
  '【进攻倾向】不要过度保守：只要手牌中有【神通】且攻击范围内存在敌对阵营（身份目标中的敌人）角色，' +
  '就应优先出【神通】打击，推进你的阵营目标；仅在确实没有任何收益（无牌可出 / 所有动作都会损害自己）时才选择「结束出牌」。' +
  '出【神通】后还需指定一名敌对角色为目标，请务必完成这一步，不要中途取消。';

const FORMAT_EXAMPLES =
  '【输出格式示例】\n' +
  '· 要出某张神通（选项 value 为 "shengtong_417_2"）→ {"choice":"shengtong_417_2"}\n' +
  '· 要结束出牌（选项 value 为 "end"）→ {"choice":"end"}\n' +
  '· 要选择座位 2 为目标 → {"choice":"shengtong_417_2"}（value 中段即目标座位）\n' +
  'value 必须与「可选动作」列表中的某一项完全一致。\n' +
  '【情境示例】若你手牌有神通,且座位2是敌对外道并标注「✅在你神通范围内」,应优先选择对应 shengtong_* 而非结束出牌;' +
  '若可选目标只能是友方则勿误伤,改选其他动作或结束出牌。';

export function buildDecisionMessages(
  idx: number,
  kind: LlmDecisionKind,
  opts: ChoiceOption[],
  instruction: string,
): LlmMessage[] {
  const p = G.players[idx];
  const side = ROLE_MAP[p.role]?.side ?? 'zhengdao';
  const roleHint = `你的身份目标：${SIDE_OBJ[side] ?? '隐藏'}。优先保护自己阵营、打击敌对阵营。`;
  const enumOpts = opts
    .map((o, i) => {
      const h = deriveHint(o.value, o.label);
      return `${i + 1}. [value=${JSON.stringify(o.value)}] ${o.label}${h ? ` — ${h}` : ''}${o.disabled ? '（当前不可用）' : ''}`;
    })
    .join('\n');
  const user =
    `${situationView(idx)}\n\n` +
    `【决策】${instruction}\n` +
    `可选动作（只能选其一，value 为内部标识，每行后为该动作的效果说明）：\n${enumOpts}\n\n` +
    `请只输出 JSON：{"choice": <某一个 value>}。不要解释。`;
  return [
    {
      role: 'system',
      content: SYSTEM_BASE + '\n' + FORMAT_EXAMPLES + '\n' + EVAL_PRINCIPLES + '\n' + roleHint + '\n' + RULE_REF + '\n（提示词版本 ' + PROMPT_VER + '）',
    },
    { role: 'user', content: user },
  ];
}

export function buildPlanMessages(idx: number, opts: ChoiceOption[], maxSteps: number): LlmMessage[] {
  const p = G.players[idx];
  const side = ROLE_MAP[p.role]?.side ?? 'zhengdao';
  const roleHint = `你的身份目标：${SIDE_OBJ[side] ?? '隐藏'}。优先保护自己阵营、打击敌对阵营。`;
  const enumOpts = opts
    .map((o, i) => {
      const h = deriveHint(o.value, o.label);
      return `${i + 1}. [value=${JSON.stringify(o.value)}] ${o.label}${h ? ` — ${h}` : ''}${o.disabled ? '（当前不可用）' : ''}`;
    })
    .join('\n');
  const user =
    `${situationView(idx)}\n\n` +
    `【决策】出牌阶段：请一次性规划本回合你打算依次执行的动作序列（最多 ${maxSteps} 步）。\n` +
    `注意：执行过程中手牌与局面会变化，若某步届时已不可用会被自动跳过。\n` +
    `可选动作（value 为内部标识）：\n${enumOpts}\n\n` +
    `请只输出 JSON：{"actions": [<value1>, <value2>, ...]}（最多 ${maxSteps} 项）；` +
    `若打算直接结束出牌，输出 {"actions":["end"]}。不要解释。`;
  return [
    {
      role: 'system',
      content: SYSTEM_BASE + '\n' + FORMAT_EXAMPLES + '\n' + EVAL_PRINCIPLES + '\n' + roleHint + '\n' + RULE_REF + '\n（提示词版本 ' + PROMPT_VER + '）',
    },
    { role: 'user', content: user },
  ];
}

export const PROMPT_VER = '1.0.0';
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__PROMPT_VER__ = PROMPT_VER;
}
