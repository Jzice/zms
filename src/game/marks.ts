/* ==================== 身份标记 ====================
 * 玩家对其他角色身份的猜测标记（ROLE_MARKS 单一模块所有权）。
 */
import { G } from './state';

/** seat -> 被标记的身份 id */
export const ROLE_MARKS: Record<number, string> = {};

export function setRoleMark(seat: number, roleId: string): void {
  ROLE_MARKS[seat] = roleId;
}

export function clearRoleMarks(): void {
  for (const k of Object.keys(ROLE_MARKS)) delete (ROLE_MARKS as Record<string, string>)[k];
}

export function resetMarks(): void {
  clearRoleMarks();
  void G;
}
