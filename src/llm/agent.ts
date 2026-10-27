/* ==================== 大模型接管：决策路由 ====================
 * 把大模型作为「决策提供者」插入现有 AI 决策链：
 *  - 仅在座位 aiMode==='llm' 且配置可用时调用模型；
 *  - 任何异常/超时/非法输出都 try/catch 后回退原启发式，保证零死锁；
 *  - 模型过慢（响应接近超时）同样计入坏决策，累计达阈值即降级，避免「AI 长时间不出牌」；
 *  - 模型结果经二次校验（选项必须存在）后再交引擎执行。
 */
import type { ChoiceOption } from '../core/types';
import { G } from '../game/state';
import { addLog } from '../game/log';
import { render } from '../ui/render';
import { callLlm, parseJsonSafe } from './client';
import { buildDecisionMessages, buildPlanMessages } from './prompts';
import { llmReady, llmDebug, getLlmConfig } from './config';
import type { LlmConfig, LlmDecisionKind } from './types';

export { llmReady } from './config';

/** 坏决策降级阈值（累计权重） */
const BAD_LIMIT = 3;
/** 座位 → 坏决策累计权重（本局有效，新对局由 resetLlmFailStreak 清空） */
const badStreak = new Map<number, number>();

export function resetLlmFailStreak(): void {
  badStreak.clear();
}

/** 该座位单步决策「过慢」阈值：响应时间接近超时即视为过慢（至少 4s，至多不超过超时本身） */
function slowMs(): number {
  const c = getLlmConfig();
  return Math.max(4000, Math.round(c.timeoutMs * 0.6));
}

function noteOk(idx: number): void {
  badStreak.set(idx, 0);
}

function noteFail(idx: number): void {
  bump(idx, 1);
}

function noteSlow(idx: number): void {
  bump(idx, 2);
}

function bump(idx: number, w: number): void {
  const n = (badStreak.get(idx) || 0) + w;
  badStreak.set(idx, n);
  if (n < BAD_LIMIT) return;
  demoteLlmSeat(idx);
}

/** 把某座位本局降回启发式 AI（连续坏决策达到阈值时调用，杜绝反复空等） */
export function demoteLlmSeat(idx: number): void {
  const p = G.players[idx];
  if (!p || p.aiMode !== 'llm') return;
  p.aiMode = 'heuristic';
  badStreak.set(idx, 0);
  addLog(`🤖[LLM·座位${idx}] 大模型决策过慢/失败过多 → 本局改用启发式 AI`, 'system');
  try {
    render();
  } catch {
    /* 渲染失败不阻塞 */
  }
}

/** 在「思考中」状态下执行模型调用（设置/清除 G.thinkingSeat 触发 UI 指示） */
async function withThinking<T>(idx: number, fn: () => Promise<T>): Promise<T> {
  G.thinkingSeat = idx;
  try {
    render();
  } catch {
    /* 渲染失败不阻塞决策 */
  }
  try {
    return await fn();
  } finally {
    if (G.thinkingSeat === idx) {
      G.thinkingSeat = null;
      try {
        render();
      } catch {
        /* ignore */
      }
    }
  }
}

async function callTimed(
  idx: number,
  messages: Parameters<typeof callLlm>[0],
  cfg?: LlmConfig,
): Promise<[string, number]> {
  const t0 = Date.now();
  const text = await withThinking(idx, () => callLlm(messages, cfg));
  return [text, Date.now() - t0];
}

function tempForKind(kind: LlmDecisionKind): number {
  switch (kind) {
    case 'discard':
    case 'shan':
    case 'rescue':
    case 'save':
    case 'counter':
      return 0.3;
    case 'play':
    case 'target':
      return 0.8;
    default:
      return 0.5;
  }
}

function instructionFor(kind: LlmDecisionKind): string {
  switch (kind) {
    case 'play':
      return '出牌阶段：选择你要执行的动作（或结束出牌）。只要手中有【神通】且存在标注「✅在你攻击范围内」的敌对角色，应优先出【神通】打击；技能/法宝需满足条件才能发动。优先顺序建议：发动关键技能 → 装备法宝 → 灵丹/悟道增益 → 攻击敌方。';
    case 'target':
      return '选择一个目标座位（value 为座位号，-1 表示取消/不选择）。出【神通】或符篆时务必选定一名敌对角色，不要选 -1 取消；若只能选到友方请改选其他动作或直接结束。';
    case 'discard':
      return '弃牌阶段：手牌超出寿元上限须弃置。优先弃掉符篆与法宝外的多余牌，保留【护身】【神通】【灵丹】等攻防牌。';
    default:
      return '请选择一项。';
  }
}

function dbg(idx: number, tag: string, info: string): void {
  if (!llmDebug()) return;
  addLog(`🤖[LLM·座位${idx}] ${tag}: ${info}`, 'system');
}

/**
 * 让模型在给定合法选项中做一次选择。
 * 成功返回选项 value；任何失败返回 null（由调用方回退启发式）。
 */
export async function llmChooseAction(
  idx: number,
  opts: ChoiceOption[],
  kind: LlmDecisionKind,
): Promise<string | number | null> {
  if (!llmReady()) {
    dbg(idx, '未就绪', `kind=${kind}，回退 null`);
    return null;
  }
  const valid = opts.filter((o) => !o.disabled);
  if (!valid.length) {
    dbg(idx, '无合法选项', `kind=${kind}`);
    return null;
  }
  const messages = buildDecisionMessages(idx, kind, opts, instructionFor(kind));
  const cfg = { ...getLlmConfig(), temperature: tempForKind(kind) };
  try {
    const [text, ms] = await callTimed(idx, messages, cfg);
    const j = parseJsonSafe<{ choice?: string | number }>(text);
    if (!j || j.choice === undefined) {
      dbg(idx, '解析失败', `kind=${kind} 原始输出=${JSON.stringify((text || '').slice(0, 200))}`);
      noteFail(idx);
      return null;
    }
    const v = j.choice;
    const found = valid.find((o) => String(o.value) === String(v) || o.value === v);
    if (found) {
      dbg(idx, '已选择', `kind=${kind} → ${JSON.stringify(found.value)}（${found.label}）`);
      if (ms >= slowMs()) noteSlow(idx);
      else noteOk(idx);
      return found.value;
    }
    if (String(v) === 'skip' || v === -1) {
      const cancel = opts.find((o) => o.value === -1 || String(o.value) === 'skip' || String(o.value) === 'end');
      dbg(idx, '选择取消', `kind=${kind} 模型返回 ${JSON.stringify(v)} → ${cancel ? JSON.stringify(cancel.value) : 'null'}`);
      if (!cancel) {
        noteFail(idx);
        return null;
      }
      if (ms >= slowMs()) noteSlow(idx);
      else noteOk(idx);
      return cancel.value;
    }
    dbg(idx, '非法选择', `kind=${kind} 模型返回 ${JSON.stringify(v)} 不在合法选项中`);
    noteFail(idx);
    return null;
  } catch (e) {
    dbg(idx, '调用异常', `kind=${kind} ${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`);
    noteFail(idx);
    return null;
  }
}

/**
 * 出牌阶段的一次性规划：让模型给出多步动作序列。
 * 返回值已过滤为「当前合法选项」并保持模型给出的顺序；任何失败返回 null（由调用方回退单步决策）。
 */
export async function llmPlanActions(
  idx: number,
  opts: ChoiceOption[],
  maxSteps: number,
): Promise<(string | number)[] | null> {
  if (!llmReady()) return null;
  const valid = opts.filter((o) => !o.disabled);
  if (!valid.length) return null;
  try {
    const cfg = { ...getLlmConfig(), temperature: 0.7 };
    const [text, ms] = await callTimed(idx, buildPlanMessages(idx, opts, maxSteps), cfg);
    const j = parseJsonSafe<{ actions?: (string | number)[] }>(text);
    const raw = j?.actions;
    if (!Array.isArray(raw) || !raw.length) {
      dbg(idx, '规划解析失败', `原始输出=${JSON.stringify((text || '').slice(0, 200))}`);
      noteFail(idx);
      return null;
    }
    const out: (string | number)[] = [];
    for (const v of raw) {
      const found = valid.find((o) => String(o.value) === String(v) || o.value === v);
      if (found) out.push(found.value);
      if (out.length >= maxSteps) break;
    }
    if (!out.length) {
      dbg(idx, '规划无有效动作', `模型返回=${JSON.stringify(raw.slice(0, 6))}`);
      noteFail(idx);
      return null;
    }
    dbg(idx, '回合规划', out.map((v) => JSON.stringify(v)).join(' → '));
    if (ms >= slowMs()) noteSlow(idx);
    else noteOk(idx);
    return out;
  } catch (e) {
    dbg(idx, '规划异常', `${(e instanceof Error ? e.message : String(e)).slice(0, 200)}`);
    noteFail(idx);
    return null;
  }
}
