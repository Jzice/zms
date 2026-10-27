/* ==================== 全局状态 ====================
 * 单一状态对象 G + 顶层 render() 全量重绘（与 learn_kill 一致）。
 * ⚠ 不变量：G 字段形状冻结 —— state_sync 直接序列化 G，客户端结构化解包。
 *   新增字段一律「可空 + 增量追加」。
 */
import type { G as GameState, Player, Card } from '../core/types';

export const G: GameState = {
  players: [],
  deck: [],
  discard: [],
  current: 0,
  turn: 0,
  phase: 'over',
  shengtongUsed: 0,
  started: false,
  over: false,
  winners: [],
  enabledRoles: [],
  logs: [],
  chat: [],
  pending: null,
  thinkingSeat: null,
  settle: null,
};

export function resetG(): void {
  G.players = [];
  G.deck = [];
  G.discard = [];
  G.current = 0;
  G.turn = 0;
  G.phase = 'over';
  G.shengtongUsed = 0;
  G.started = false;
  G.over = false;
  G.winners = [];
  G.enabledRoles = [];
  G.logs = [];
  G.chat = [];
  G.pending = null;
  G.thinkingSeat = null;
  G.settle = null;
}

export function cur(): Player {
  return G.players[G.current];
}

export function me(): Player | undefined {
  return G.players.find((p) => !p.ai && p.peerId === undefined) ?? G.players[0];
}

export function alivePlayers(): Player[] {
  return G.players.filter((p) => p.alive);
}

export function seatOf(p: Player): number {
  return p.seat;
}

export function drawN(p: Player, n: number): Card[] {
  const got: Card[] = [];
  for (let i = 0; i < n; i++) {
    if (G.deck.length === 0) {
      if (G.discard.length === 0) break;
      // 弃牌堆洗回牌堆
      for (let j = G.discard.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [G.discard[j], G.discard[k]] = [G.discard[k], G.discard[j]];
      }
      G.deck.push(...G.discard.splice(0, G.discard.length));
    }
    const c = G.deck.shift();
    if (c) {
      p.hand.push(c);
      got.push(c);
    }
  }
  return got;
}

/** 房主权威：由房主计算后整体下发 */
export function applySync(s: GameState): void {
  G.players = s.players;
  G.deck = s.deck;
  G.discard = s.discard;
  G.current = s.current;
  G.turn = s.turn;
  G.phase = s.phase;
  G.shengtongUsed = s.shengtongUsed;
  G.started = s.started;
  G.over = s.over;
  G.winners = s.winners;
  G.enabledRoles = s.enabledRoles;
  G.logs = s.logs;
  G.chat = s.chat;
  G.pending = s.pending;
  G.settle = s.settle;
}
