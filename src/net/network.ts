/* ==================== 联机：房主权威同步 ====================
 * 房主运行游戏循环并广播 state_sync（80ms 防抖）；
 * 远程玩家的选择经 choice_request / choice_response 回传房主执行。
 * 掉线 / 退出自动转 AI；对局进行中可加入并接管 AI 席位。
 */
import type { NetMessage, RoomMember, G as GameState } from '../core/types';
import { createPeer } from '#peer';
import type { Peer, DataConnection } from '../types/peerjs';
import {
  SYNC_DEBOUNCE_MS,
  encode,
  decode,
  randomRoomCode,
  peerIdOf,
  roomCodeOf,
} from './protocol';
import { G } from '../game/state';
import { addLog } from '../game/log';
import { pushChat } from '../game/chat';
import { handleChoice } from '../game/choice';

export type NetRole = 'none' | 'host' | 'guest';

interface Net {
  role: NetRole;
  peer: Peer | null;
  code: string;
  conns: Map<string, DataConnection>;
  hostConn: DataConnection | null;
  members: RoomMember[];
  onSync?: () => void;
}

export const NET: Net = {
  role: 'none',
  peer: null,
  code: '',
  conns: new Map(),
  hostConn: null,
  members: [],
};

let syncTimer: number | null = null;

function ensurePeer(): Peer {
  if (NET.peer) return NET.peer;
  NET.peer = createPeer();
  NET.peer.on('error', (e) => addLog(`联机错误：${String(e)}`, 'system'));
  return NET.peer;
}

/* ---------------- 房主 ---------------- */

export function hostCreateRoom(): Promise<string> {
  const code = randomRoomCode();
  const p = createPeer(peerIdOf(code));
  NET.peer = p;
  NET.role = 'host';
  NET.code = code;
  NET.conns = new Map();
  NET.members = [];
  return new Promise((resolve, reject) => {
    p.on('open', () => {
      addLog(`房间已创建：${code}`, 'system');
      resolve(code);
    });
    p.on('error', (e) => reject(e));
    p.on('connection', (conn) => {
      conn.on('open', () => {
        NET.conns.set(conn.peer, conn);
      });
      conn.on('data', (raw) => onHostData(conn, raw));
      conn.on('close', () => {
        NET.conns.delete(conn.peer);
        // 掉线 → 该席位转 AI
        const m = NET.members.find((x) => x.peerId === conn.peer);
        if (m) {
          const pl = G.players[m.seat];
          if (pl) {
            pl.ai = true;
            addLog(`${pl.name} 掉线，转由 AI 接管`, 'system');
          }
          NET.members = NET.members.filter((x) => x.peerId !== conn.peer);
        }
        broadcastState();
      });
    });
  });
}

function onHostData(conn: DataConnection, raw: unknown): void {
  const msg = decode(raw);
  if (!msg) return;
  switch (msg.t) {
    case 'hello': {
      // 分配席位：优先接管 AI 席位
      let seat = NET.members.find((m) => m.peerId === conn.peer)?.seat;
      if (seat === undefined) {
        const free = G.players.find((p) => p.ai && !NET.members.some((m) => m.seat === p.seat));
        seat = free?.seat ?? G.players.length;
        NET.members.push({ seat, name: msg.name, charId: '', peerId: conn.peer, ready: false });
      }
      const pl = G.players[seat];
      if (pl) {
        pl.ai = false;
        pl.name = msg.name;
        pl.peerId = conn.peer;
      }
      sendTo(conn, {
        t: 'room_state',
        players: NET.members,
        roles: G.enabledRoles,
        started: G.started,
      });
      broadcastState();
      break;
    }
    case 'seat_taken': {
      const m = NET.members.find((x) => x.peerId === conn.peer);
      if (m) {
        m.charId = msg.charId;
        m.name = msg.name;
      }
      const pl = G.players.find((p) => p.peerId === conn.peer);
      if (pl && msg.charId) pl.charId = msg.charId;
      broadcastState();
      break;
    }
    case 'choice_response':
      handleChoice(msg.value);
      break;
    case 'chat':
      pushChat(msg.seat, msg.name, msg.text);
      broadcastState();
      break;
    case 'leave': {
      NET.members = NET.members.filter((x) => x.peerId !== conn.peer);
      const pl = G.players[msg.seat];
      if (pl) pl.ai = true;
      broadcastState();
      break;
    }
    default:
      break;
  }
}

/** 房主广播状态快照（80ms 防抖） */
export function broadcastState(): void {
  if (NET.role !== 'host') return;
  if (syncTimer !== null) return;
  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    const msg: NetMessage = { t: 'state_sync', state: snapshot() };
    for (const conn of NET.conns.values()) sendTo(conn, msg);
  }, SYNC_DEBOUNCE_MS);
}

function snapshot(): GameState {
  return JSON.parse(JSON.stringify(G)) as GameState;
}

function sendTo(conn: DataConnection, msg: NetMessage): void {
  try {
    conn.send(encode(msg));
  } catch {
    /* 连接已断开则忽略 */
  }
}

export function hostStart(): void {
  const msg: NetMessage = { t: 'start', state: snapshot() };
  for (const conn of NET.conns.values()) sendTo(conn, msg);
  broadcastState();
}

/* ---------------- 加入方 ---------------- */

export function joinRoom(code: string, name: string): Promise<void> {
  const p = ensurePeer();
  NET.role = 'guest';
  NET.code = code;
  return new Promise((resolve, reject) => {
    p.on('open', () => {
      const conn = p.connect(peerIdOf(code), { reliable: true });
      NET.hostConn = conn;
      conn.on('open', () => {
        sendTo(conn, { t: 'hello', name });
        addLog(`已加入房间 ${code}`, 'system');
        resolve();
      });
      conn.on('data', (raw) => onClientData(raw));
      conn.on('error', (e) => reject(e));
    });
    p.on('error', (e) => reject(e));
  });
}

function onClientData(raw: unknown): void {
  const msg = decode(raw);
  if (!msg) return;
  switch (msg.t) {
    case 'room_state':
      NET.members = msg.players;
      break;
    case 'start':
    case 'state_sync':
      // 客户端只读渲染
      Object.assign(G, msg.state);
      NET.onSync?.();
      break;
    case 'choice_request':
      // 由 UI 展示并由玩家操作后回传
      G.pending = msg.choice;
      NET.onSync?.();
      break;
    case 'chat':
      pushChat(msg.seat, msg.name, msg.text);
      NET.onSync?.();
      break;
    default:
      break;
  }
}

/** 加入方：选择角色 */
export function guestTakeSeat(seat: number, charId: string, name: string): void {
  const conn = NET.hostConn;
  if (!conn) return;
  sendTo(conn, { t: 'seat_taken', seat, name, charId });
}

/** 加入方：回传选择 */
export function guestChoice(value: number | 'pass'): void {
  const conn = NET.hostConn;
  if (!conn) return;
  sendTo(conn, { t: 'choice_response', value });
}

export function guestChat(seat: number, name: string, text: string): void {
  const conn = NET.hostConn;
  if (!conn) return;
  sendTo(conn, { t: 'chat', seat, name, text });
}

/* ---------------- 通用 ---------------- */

export function leaveRoom(): void {
  const seat = G.players.find((p) => p.peerId && NET.role === 'guest')?.seat;
  if (NET.role === 'guest' && NET.hostConn && seat !== undefined) {
    sendTo(NET.hostConn, { t: 'leave', seat });
  }
  NET.peer?.destroy();
  NET.peer = null;
  NET.role = 'none';
  NET.conns = new Map();
  NET.hostConn = null;
  NET.members = [];
}

export function roomCode(): string {
  return NET.code ? roomCodeOf(NET.code) : '';
}

export function isHost(): boolean {
  return NET.role === 'host';
}
export function isGuest(): boolean {
  return NET.role === 'guest';
}
