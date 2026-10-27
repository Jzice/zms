/* ==================== AI 对手（双机制：启发式 + 大模型接管） ====================
 * 启发式路径：enumerateActions 按优先级枚举当前可行动作，取首位执行（原 aiStep 行为）。
 * 大模型路径：若座位 aiMode==='llm' 且配置可用，把动作枚举交给大模型选择（llmChooseAction），
 *             失败/超时时自动回退启发式，保证零死锁（详见 llm/agent.ts）。
 *
 * 敌我识别：优先攻击「异阵营」且非缔约方角色（见 bestTarget）。
 */
import type { Player, Card, ChoiceOption } from '../core/types';
import { G } from './state';
import { playCard, closeDoor } from './actions';
import { canUseWudao } from './wudao';
import { canUseSkill, useSkill, applyEffects } from './skillEngine';
import { canUseBeastSkill, useBeastSkill } from './beasts';
import { canSign } from './contract';
import { canTargetShengtong } from './rules';
import { CONTRACT_DEFS } from '../data/contracts';
import { charOf } from '../data/characters';
import { campOf } from './setup';
import { addLog } from './log';
import { sleep } from '../core/dom';
import { noteAttack } from './aibrain';
import { llmReady, llmChooseAction, llmPlanActions } from '../llm/agent';

export type AiAction = ChoiceOption;

/** 敌对度评分（越高越优先攻击） */
function hostility(self: Player, other: Player): number {
  if (!other.alive || other.seat === self.seat) return -1;
  let s = 0;
  const myCamp = campOf(self);
  if (myCamp && campOf(other) !== myCamp) s += 2;
  s += (other.maxHp - other.hp) * 0.5;
  if (self.contracts.some((c) => !c.broken && c.parties.includes(other.seat))) return -1;
  return s;
}

export function bestTarget(self: Player): Player | undefined {
  let best: Player | undefined;
  let bs = 0;
  for (const p of G.players) {
    const s = hostility(self, p);
    if (s > bs && canTargetShengtong(self, p)) {
      bs = s;
      best = p;
    }
  }
  return best;
}

/** 枚举当前可行动作（按优先级），供启发式取首位 / 大模型选择 */
export function enumerateActions(p: Player): AiAction[] {
  const acts: AiAction[] = [];
  const c = charOf(p.charId);

  // ① 濒死自救：灵丹
  if (p.hp <= 1) {
    const dan = p.hand.find((x) => x.sub === 'lingdan');
    if (dan) acts.push({ value: `lingdan:${dan.id}:${p.seat}`, label: '灵丹·自救' });
  }

  // ② 伴兽主动技
  if (canUseBeastSkill(p).ok) acts.push({ value: 'beast', label: '伴兽技' });

  // ③ 悟道
  const wudao = p.hand.find((x) => x.sub === 'wudao');
  if (wudao && canUseWudao(p).ok) acts.push({ value: `wudao:${wudao.id}`, label: '悟道' });

  // ④ 占据灵地
  const lingdi = p.hand.find((x) => x.type === 'lingdi');
  if (lingdi) acts.push({ value: `lingdi:${lingdi.id}`, label: '占据灵地' });

  // ⑤ 装备法宝
  const faqi = p.hand.find((x) => x.type === 'faqi');
  if (faqi) acts.push({ value: `faqi:${faqi.id}`, label: `装备·${faqi.name}` });

  // ⑥ 主动技
  for (const sk of c?.skills ?? []) {
    if (sk.kind !== 'active') continue;
    if (canUseSkill(p, sk.id).ok) {
      const t = bestTarget(p);
      acts.push({ value: `skill:${sk.id}:${t?.seat ?? -1}`, label: `技能·${sk.name}` });
    }
  }

  // ⑦ 神通攻击（取最佳目标）
  const shengtong = p.hand.find((x) => x.sub === 'shengtong' || x.sub === 'huo' || x.sub === 'lei');
  if (shengtong) {
    const t = bestTarget(p);
    if (t) acts.push({ value: `shengtong:${shengtong.id}:${t.seat}`, label: `神通·${shengtong.name}` });
  }

  // ⑧ 符篆 / 阵法 / 秘术
  const trick = p.hand.find((x) => x.type === 'fu' && x.sub !== 'linghunqiyue');
  if (trick) {
    const t = bestTarget(p);
    if (t) acts.push({ value: `trick:${trick.id}:${t.seat}`, label: `符篆·${trick.name}` });
  }

  // ⑨ 灵魂契约：与同阵营且未缔约者立约
  const contractCard = p.hand.find((x) => x.sub === 'linghunqiyue');
  if (contractCard) {
    const ally = G.players.find(
      (o) => o.alive && o.seat !== p.seat && campOf(o) === campOf(p) && canSign(p, o).ok,
    );
    if (ally) {
      const def = CONTRACT_DEFS[Math.floor(Math.random() * CONTRACT_DEFS.length)];
      acts.push({ value: `contract:${contractCard.id}:${ally.seat}:${def.id}`, label: '灵魂契约' });
    }
  }

  // ⑩ 灵药 / 灵丹增益
  const buff = p.hand.find((x) => x.sub === 'lingyao' || (x.sub === 'lingdan' && p.hp > 1));
  if (buff && p.hp < p.maxHp) {
    if (buff.sub === 'lingdan') acts.push({ value: `lingdan:${buff.id}:${p.seat}`, label: '灵丹·益气' });
    else acts.push({ value: `lingyao:${buff.id}`, label: '灵药·增威' });
  }

  // 终端：闭关 / 结束
  acts.push({ value: 'close', label: '闭关' });
  acts.push({ value: 'end', label: '结束出牌' });
  return acts;
}

/** 执行一个动作；返回是否「继续出牌」（true=继续，false=停手） */
export function executeAction(p: Player, value: string): boolean {
  if (value === 'end') return false;
  if (value === 'close') {
    closeDoor(p);
    return false;
  }
  const [head, a, b] = value.split(':');
  const id = Number(a);
  const tgt = b !== undefined ? Number(b) : undefined;
  switch (head) {
    case 'beast': {
      const eff = useBeastSkill(p);
      if (eff) {
        const t = bestTarget(p);
        applyEffects(p, eff, t?.seat);
      }
      return true;
    }
    case 'wudao':
      playCard(p, id);
      return true;
    case 'lingdi':
      playCard(p, id);
      return true;
    case 'faqi':
      playCard(p, id);
      return true;
    case 'shengtong':
      if (tgt !== undefined && tgt >= 0) noteAttack(p.seat, tgt);
      playCard(p, id, tgt);
      return true;
    case 'trick':
      if (tgt !== undefined && tgt >= 0) noteAttack(p.seat, tgt);
      playCard(p, id, tgt);
      return true;
    case 'skill': {
      const t = tgt !== undefined && tgt >= 0 ? tgt : undefined;
      useSkill(p, a, t);
      return true;
    }
    case 'lingdan':
      playCard(p, id, tgt ?? p.seat);
      return true;
    case 'lingyao':
      playCard(p, id, p.seat);
      return true;
    case 'contract': {
      const ally = Number(b);
      const defId = value.split(':')[3];
      playCard(p, id, ally, defId);
      addLog(`${p.name} 向 ${G.players[ally]?.name ?? '友方'} 提出立约`, 'contract');
      return true;
    }
    default:
      return false;
  }
}

/** 单步启发式决策，返回是否继续 */
export function aiStep(p: Player): boolean {
  const acts = enumerateActions(p);
  const a = acts.find((x) => !x.disabled);
  if (!a) return false;
  if (a.value === 'end') return false;
  if (a.value === 'close') {
    executeAction(p, 'close');
    return false;
  }
  return executeAction(p, String(a.value));
}

/** AI 出牌主循环（双机制入口） */
export async function aiPlay(p: Player): Promise<void> {
  // 大模型接管路径
  if (p.aiMode === 'llm' && llmReady()) {
    let guard = 0;
    let plan: (string | number)[] | null = null;
    let planIdx = 0;
    while (G.phase === 'play' && p.alive && guard++ < 16) {
      await sleep(120);
      const acts = enumerateActions(p);
      if (!acts.length) break;
      let v: string | number | null = null;
      // 优先消费回合规划
      if (plan && planIdx < plan.length) {
        const pv = plan[planIdx++];
        const f = acts.find((x) => x.value === pv);
        if (f && !f.disabled) v = f.value;
      }
      if (v === null) {
        if (plan === null && guard === 1) {
          const seq = await llmPlanActions(p.seat, acts, 6);
          plan = seq;
          planIdx = 0;
          if (seq && seq.length) {
            const f = acts.find((x) => x.value === seq[0]);
            if (f && !f.disabled) v = f.value;
          }
        }
        if (v === null) v = await llmChooseAction(p.seat, acts, 'play');
      }
      if (v === null) {
        // 大模型无有效选择 → 回退启发式单步后继续（或结束）
        return heuristicLoop(p);
      }
      if (v === 'end') break;
      if (v === 'close') {
        executeAction(p, 'close');
        break;
      }
      if (!executeAction(p, String(v))) break;
    }
    return;
  }
  // 启发式路径
  return heuristicLoop(p);
}

async function heuristicLoop(p: Player): Promise<void> {
  let guard = 0;
  while (G.phase === 'play' && p.alive && guard++ < 12) {
    await sleep(160);
    if (aiStep(p)) continue;
    break;
  }
}

/** AI 台词（docs 风格，按境界与阵营） */
export function aiLine(p: Player): string {
  const c = charOf(p.charId);
  const realm = c?.realm ?? 'lianqi';
  const lines: Record<string, string[]> = {
    lianqi: ['大道艰难，还需苦修。', '灵气稀薄，慢慢来吧。'],
    zhuji: ['筑基已成，可图金丹。', '此番闭关，必有斩获。'],
    jindan: ['金丹在握，何惧一战。', '丹论既定，道途已明。'],
    yuanying: ['元婴既成，寿元两千。', '此界英豪，不过如此。'],
    huashen: ['化神之下，皆为蝼蚁。', '大道在前，汝且退下。'],
  };
  const arr = lines[realm] ?? lines.lianqi;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 判断某卡是否为 AI 眼中的高价值牌 */
export function cardValue(_p: Player, card: Card): number {
  switch (card.sub) {
    case 'wudao':
      return 5;
    case 'lingdan':
      return 4;
    case 'shengtong':
    case 'huo':
    case 'lei':
      return 3;
    case 'hushen':
      return 3;
    case 'lingyao':
      return 2;
    default:
      return card.type === 'faqi' || card.type === 'lingdi' ? 4 : 2;
  }
}
