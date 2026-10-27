/* ==================== 对局组装 ====================
 * 玩家组装 + 身份分配 + 伴兽绑定 + 初始境界/修为/灵力。
 */
import type { Player, Card } from '../core/types';
import { G } from './state';
import { addLog } from './log';
import { pushSystem } from './chat';
import { buildDeck } from '../data/cards';
import { charOf, CHARACTERS, needsBeast } from '../data/characters';
import { beastPoolFor, beastDef } from '../data/beasts';
import { composeRoles } from './roles';
import { bindBeast } from './beasts';
import { CAMPS } from '../data/camps';
import { POWER_MAP } from '../data/powers';
import { currentLayer } from '../data/realms';
import { drawN } from './state';
import { llmEnabledForSeat } from '../llm/config';
import { resetLlmFailStreak } from '../llm/agent';
import { resetBrain } from './aibrain';

/** 角色阵营（campOf）——AI 敌我识别用 */
export function campOf(p: Player): string {
  return p.camp;
}

function emptyFlags(): Player['flags'] {
  return {
    wudaoUsed: false,
    hurtThisTurn: false,
    closedDoor: false,
    daoxinGuardUsed: false,
    skillUse: {},
  };
}

export function createPlayer(
  seat: number,
  charId: string,
  role: string,
  name: string,
  ai: boolean,
): Player {
  const c = charOf(charId) ?? CHARACTERS[0];
  const layer = currentLayer(c.realm, 'early');
  // 三国杀内核：主公（本作「掌门」）公开身份，体力上限 +1
  const baseHp = c.hp + (role === 'master' ? 1 : 0);
  return {
    seat,
    name,
    ai,
    charId: c.id,
    camp: c.camp,
    power: c.power,
    region: c.region,
    role,
    rolePublic: false,
    hp: baseHp,
    maxHp: baseHp,
    hand: [],
    equips: {},
    xiuwei: 0,
    realm: c.realm,
    realmStage: 'early',
    lingli: layer.lingliMax,
    daoxin: 0,
    lingdi: [],
    beast: undefined,
    contracts: [],
    heartLock: false,
    trueNameKnown: [],
    alive: true,
    flags: emptyFlags(),
  };
}

export interface GameConfig {
  count: number;
  enabledRoles: string[];
  /** 本地玩家角色 id（其余空位由 AI 补齐） */
  myCharId?: string;
  myName?: string;
  /** 御兽门角色的伴兽选择：charId -> beastId */
  beastChoice?: Record<string, string>;
}

/** 随机角色池（覆盖各阵营，保证阵营多样） */
function pickChars(count: number): string[] {
  const byCamp = new Map<string, string[]>();
  for (const c of CHARACTERS) {
    const arr = byCamp.get(c.camp) ?? [];
    arr.push(c.id);
    byCamp.set(c.camp, arr);
  }
  const camps = CAMPS.map((c) => c.id);
  const out: string[] = [];
  let i = 0;
  while (out.length < count) {
    const camp = camps[i % camps.length];
    const pool = (byCamp.get(camp) ?? []).filter((x) => !out.includes(x));
    if (pool.length) out.push(pool[Math.floor(Math.random() * pool.length)]);
    i++;
    if (i > count * 8) break;
  }
  // 不足则用全表补齐
  const rest = CHARACTERS.map((c) => c.id).filter((x) => !out.includes(x));
  while (out.length < count && rest.length) {
    out.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
  }
  return out.slice(0, count);
}

/** 组装并开局 */
export function startGame(cfg: GameConfig): void {
  G.players = [];
  G.deck = [];
  G.discard = [];
  G.logs = [];
  G.chat = [];
  G.turn = 0;
  G.current = 0;
  G.shengtongUsed = 0;
  G.started = true;
  G.over = false;
  G.winners = [];
  G.settle = null;
  G.enabledRoles = cfg.enabledRoles;

  const charIds = pickChars(cfg.count);
  if (cfg.myCharId) charIds[0] = cfg.myCharId;

  const roles = composeRoles(cfg.count, cfg.enabledRoles);

  for (let i = 0; i < cfg.count; i++) {
    const isMe = i === 0;
    const p = createPlayer(
      i,
      charIds[i],
      roles[i] ?? 'dizi',
      isMe ? cfg.myName || '本座' : `修士${i}`,
      !isMe,
    );
    G.players.push(p);
  }

  // 大模型接管：依据配置标记各 AI 座位的决策模式（'llm' / 'heuristic'）
  resetLlmFailStreak();
  resetBrain();
  applyLlmModes();

  // 身份公开性
  for (const p of G.players) {
    const def = G.enabledRoles.length ? p.role : p.role;
    void def;
    p.rolePublic = p.role === 'master' || p.role === 'zuozhu' || p.role === 'laozu' ||
      p.role === 'zhenshou' || p.role === 'jiezhu' || p.role === 'chengzhu';
  }

  // 伴兽绑定（御兽门角色必须择一）
  for (const p of G.players) {
    const c = charOf(p.charId);
    if (!c || !needsBeast(c)) continue;
    const chosen = cfg.beastChoice?.[c.id];
    const pool = beastPoolFor(c.id, c.beastPool);
    const id = chosen && beastDef(chosen) ? chosen : pool[Math.floor(Math.random() * pool.length)];
    if (id) bindBeast(p, id);
  }

  // 牌堆
  const deck: Card[] = buildDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  G.deck = deck;

  // 初始手牌 4 张
  for (const p of G.players) drawN(p, 4);

  addLog(`对局开始：${cfg.count} 人，身份已分派`, 'system');
  pushSystem(`对局开始：${cfg.count} 人，身份已分派`);
  for (const p of G.players) {
    const c = charOf(p.charId);
    const power = POWER_MAP[p.power]?.name ?? p.power;
    addLog(`#${p.seat} ${p.name} —— ${c?.name}（${power}）`, 'system');
  }
}

/**
 * 依据当前大模型配置，实时刷新所有 AI 座位的 aiMode（'llm' / 'heuristic'）。
 * 单机/联机（房主侧）通用：房主跑循环时据此切换启发式/大模型决策。
 */
export function applyLlmModes(): void {
  G.players.forEach((p, i) => {
    if (p.ai) p.aiMode = llmEnabledForSeat(i) ? 'llm' : 'heuristic';
  });
}

/** 检查是否有御兽门角色需要选伴兽（大厅提示用） */
export function pendingBeastSelection(cfg: GameConfig): string[] {
  const out: string[] = [];
  const charIds = cfg.myCharId ? [cfg.myCharId] : [];
  for (const id of charIds) {
    const c = charOf(id);
    if (c && needsBeast(c)) out.push(c.id);
  }
  return out;
}
