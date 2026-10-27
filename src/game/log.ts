/* ==================== 战报日志 ====================
 * 单一模块所有权：playLog 只经此处的 mutator 修改（learn_kill 不变量 ④）
 */
import type { LogEntry } from '../core/types';
import { G } from './state';

const MAX_LOG = 100;

export function addLog(
  text: string,
  kind: LogEntry['kind'] = 'normal',
  seat?: number,
): void {
  G.logs.push({ t: Date.now(), text, kind, seat });
  if (G.logs.length > MAX_LOG) G.logs.splice(0, G.logs.length - MAX_LOG);
}

export function resetLogs(): void {
  G.logs = [];
}

/** 供 UI 渲染（倒序最新在上） */
export function logsDesc(): LogEntry[] {
  return [...G.logs].reverse();
}
