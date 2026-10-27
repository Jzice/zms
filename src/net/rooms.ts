/* ==================== 房间管理（建房 / 加入 / 离开 / 关闭） ====================
 * 薄封装：实际连接逻辑在 network.ts。
 */
import {
  hostCreateRoom,
  joinRoom,
  leaveRoom,
  roomCode,
  isHost,
  isGuest,
  hostStart,
} from './network';
import { addLog } from '../game/log';

export interface RoomInfo {
  code: string;
  host: boolean;
}

let info: RoomInfo | null = null;

export async function createRoom(): Promise<RoomInfo> {
  const code = await hostCreateRoom();
  info = { code, host: true };
  return info;
}

export async function join(code: string, name: string): Promise<RoomInfo> {
  const clean = code.trim();
  if (clean.length !== 6) throw new Error('房间号须为 6 位');
  await joinRoom(clean, name);
  info = { code: clean, host: false };
  return info;
}

export function closeRoom(): void {
  if (!info) return;
  leaveRoom();
  addLog('房间已关闭', 'system');
  info = null;
}

export function currentRoom(): RoomInfo | null {
  return info;
}

export function roomCodeText(): string {
  return info?.code ?? roomCode() ?? '';
}

export function startNetGame(): void {
  if (isHost()) hostStart();
}

export { isHost, isGuest };
