/* ==================== 游戏主循环 ====================
 * 房主权威：房主运行循环并广播 state_sync（80ms 防抖）。
 * 客户端只读渲染，不本地推演。
 */
import type { Player } from '../core/types';
import { G } from './state';
import { addLog } from './log';
import { beginTurn, endTurn } from './turn';
import { aiPlay } from './ai';
import { settleRoles, roleRevealLines } from './roles';
import { contractSummary } from './contract';
import { sleep } from '../core/dom';
import { sfx } from '../core/sound';

let running = false;
/** 本地玩家是否已请求结束回合（UI 调用 endHumanTurn） */
let humanDone = false;
/** 回合上限（防止无人可杀时对局无限推进） */
const MAX_TURNS = 80;

export function isRunning(): boolean {
  return running;
}

/** UI：结束本地玩家回合 */
export function endHumanTurn(): void {
  humanDone = true;
}

/** 下一名存活玩家 */
function nextPlayer(): void {
  const n = G.players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (G.current + i) % n;
    if (G.players[idx]?.alive) {
      G.current = idx;
      G.turn += 1;
      return;
    }
  }
}

/** 结束判定 + 结算 */
export function checkEnd(): boolean {
  if (G.over) return true;
  const alive = G.players.filter((p) => p.alive);
  if (alive.length <= 1) {
    finish();
    return true;
  }
  const masterAlive = alive.some((p) => p.role === 'master');
  const others = alive.filter((p) => p.role !== 'master');
  // 掌门阵亡 或 外道隐匿皆灭
  if (!masterAlive) {
    finish();
    return true;
  }
  if (others.length === 0) {
    finish();
    return true;
  }
  return false;
}

function finish(timeout = false): void {
  const r = settleRoles(timeout);
  G.over = true;
  G.winners = r.winners;
  G.phase = 'over';
  running = false;
  const lines = [
    ...roleRevealLines(),
    ...contractSummary(),
    `获胜：${r.winners.map((s) => G.players.find((p) => p.seat === s)?.name ?? `#${s}`).join('、') || '无人'}`,
  ];
  G.settle = { winners: r.winners, campHonor: r.campHonor, title: r.title, lines };
  addLog(`本局结束 —— ${r.title}`, 'system');
  sfx(r.winners.length ? 'win' : 'lose');
}

/** 主循环 */
export async function gameLoop(): Promise<void> {
  if (running) return;
  running = true;
  G.turn = 1;
  G.current = 0;

  let guard = 0;
  let timeout = false;
  while (!G.over && guard++ < 500) {
    if (G.turn > MAX_TURNS) {
      timeout = true;
      break; // 达到回合上限则强制结算
    }
    const p: Player | undefined = G.players[G.current];
    if (!p) break;
    if (!p.alive) {
      nextPlayer();
      continue;
    }

    await beginTurn(p);
    await sleep(200);

    if (p.ai) {
      await aiPlay(p);
    } else {
      // 本地玩家：等待 UI 操作后结束回合
      humanDone = false;
      let wait = 0;
      while (!humanDone && !G.over && wait++ < 600) {
        await sleep(200);
      }
    }

    await endTurn(p);
    await sleep(150);

    if (checkEnd()) break;
    nextPlayer();
  }
  if (!G.over) finish(timeout || G.turn > MAX_TURNS);
}
