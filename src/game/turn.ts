/* ==================== 回合阶段 ====================
 * 判定（天劫 / 七星定身阵）→ 摸牌 2 → 出牌 → 弃牌（上限 = 寿元）→ 回合末「闭关」
 *
 * 回合级状态（灵力回复、悟道每回合限一次、闭关标记）挂在 Player.flags，
 * 在 resetTurnState() 回合初清零（learn_kill 不变量：不新增 G 顶层字段）。
 */
import type { Player } from '../core/types';
import { G, drawN } from './state';
import { addLog } from './log';
import { recoverLingli, breakthroughRealm, canBreakthrough } from './realm';
import { applyTurnStart } from './skillEngine';
import { needDiscard, closeDoor } from './actions';
import { expireContracts } from './contract';
import { handLimit } from './rules';
import { sleep } from '../core/dom';
import { drawFly, discardFly } from '../core/fx';

/** 回合初状态重置 */
export function resetTurnState(p: Player): void {
  p.flags.wudaoUsed = false;
  p.flags.hurtThisTurn = false;
  p.flags.closedDoor = false;
  p.flags.daoxinGuardUsed = false;
  p.flags.skillUse = {};
}

/** 判定阶段（延时判定牌：天劫 / 七星定身阵）——简化实现，保留阶段 */
export function judgePhase(p: Player): void {
  G.phase = 'judge';
  // 延时判定在此结算；当前版本未引入判定区，保留阶段供扩展
}

/** 摸牌阶段 */
export function drawPhase(p: Player): void {
  G.phase = 'draw';
  drawN(p, 2);
  addLog(`${p.name} 摸 2 张牌`, 'system');
  drawFly(p.seat, 2);
}

/** 弃牌阶段 */
export async function discardPhase(p: Player): Promise<void> {
  G.phase = 'discard';
  let guard = 0;
  let dropped = 0;
  while (needDiscard(p) > 0 && guard++ < 20) {
    if (!p.ai) {
      // 本地玩家：等待 UI 弃牌（简化为自动弃最早一张以避免卡死）
      await sleep(120);
    }
    const drop = p.hand.shift();
    if (drop) {
      G.discard.push(drop);
      dropped++;
    }
  }
  if (dropped > 0) discardFly(p.seat);
}

/** 回合末「闭关」（可选：弃全部手牌换修为） */
export function tryCloseDoor(p: Player): boolean {
  if (p.flags.closedDoor || p.hand.length === 0) return false;
  closeDoor(p);
  if (canBreakthrough(p).ok) breakthroughRealm(p);
  return true;
}

/** 回合开始（供 loop 调用） */
export async function beginTurn(p: Player): Promise<void> {
  resetTurnState(p);
  applyTurnStart(p);
  recoverLingli(p);
  expireContracts(p);
  addLog(`—— 第 ${G.turn} 回合：${p.name} ——`, 'system');
  judgePhase(p);
  await sleep(150);
  drawPhase(p);
  await sleep(150);
  G.phase = 'play';
  G.shengtongUsed = 0;
}

/** 回合结束 */
export async function endTurn(p: Player): Promise<void> {
  // 自动闭关（AI）或等待玩家选择
  if (p.ai) {
    // AI：手牌较少或灵力低时闭关
    if (p.hand.length <= 1 || p.lingli === 0) tryCloseDoor(p);
  }
  await discardPhase(p);
  if (canBreakthrough(p).ok) {
    breakthroughRealm(p);
  }
  G.phase = 'over';
  addLog(`${p.name} 结束回合（手牌上限 ${handLimit(p)}）`, 'system');
}
