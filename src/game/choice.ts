/* ==================== 本地 / 远程选择 Promise 桥 ====================
 * 房主权威：房主发起 choose_request → 客户端回传 choice_response。
 * 单机（AI 或本地玩家）走同一接口的本地分支。
 */
import type { PendingChoice } from '../core/types';
import { G } from './state';

let resolver: ((v: number | 'pass') => void) | null = null;

/** 房主发起一次选择等待 */
export function askChoice(choice: PendingChoice): Promise<number | 'pass'> {
  G.pending = choice;
  return new Promise<number | 'pass'>((resolve) => {
    resolver = resolve;
  });
}

/** UI 或联机回传结果（main.ts 挂载到 window） */
export function handleChoice(value: number | 'pass'): void {
  const r = resolver;
  resolver = null;
  G.pending = null;
  if (r) r(value);
}

/** 是否有待处理的选择 */
export function hasPending(): boolean {
  return !!G.pending;
}

/** 当前待处理选择（UI 渲染用） */
export function pendingChoice(): PendingChoice | null {
  return G.pending;
}

/** 联机：客户端收到 choice_request 后由玩家操作，再回传（此处仅记录） */
export function onRemoteChoiceRequest(choice: PendingChoice): void {
  G.pending = choice;
}
