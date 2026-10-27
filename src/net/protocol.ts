/* ==================== 联机协议 ====================
 * 扩展 NetMessage 联合类型即可新增联机功能。
 * 房主权威：state_sync 直接下发 G，客户端结构化解包。
 * ⚠ G 字段形状冻结，新增字段一律「可空 + 增量追加」。
 */
import type { NetMessage } from '../core/types';

export type { NetMessage };

export const SYNC_DEBOUNCE_MS = 80;
/** 6 位房间号 */
export const ROOM_CODE_LEN = 6;
export const PEER_PREFIX = 'zms-';

export function roomCodeOf(peerId: string): string {
  return peerId.startsWith(PEER_PREFIX) ? peerId.slice(PEER_PREFIX.length) : peerId;
}

export function peerIdOf(code: string): string {
  return code.startsWith(PEER_PREFIX) ? code : PEER_PREFIX + code;
}

export function randomRoomCode(): string {
  let s = '';
  for (let i = 0; i < ROOM_CODE_LEN; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export function encode(msg: NetMessage): string {
  return JSON.stringify(msg);
}

export function decode(raw: unknown): NetMessage | null {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as NetMessage;
  } catch {
    return null;
  }
}
