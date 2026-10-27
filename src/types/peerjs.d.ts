/* PeerJS 最小类型声明（覆盖 window.Peer 与 module 'peerjs' 两种供给模式） */

export interface PeerConnectOptions {
  reliable?: boolean;
  metadata?: unknown;
}

export interface DataConnection {
  peer: string;
  open: boolean;
  on(event: 'open', cb: () => void): void;
  on(event: 'data', cb: (data: unknown) => void): void;
  on(event: 'close', cb: () => void): void;
  on(event: 'error', cb: (err: unknown) => void): void;
  send(data: unknown): void;
  close(): void;
}

export interface Peer {
  id: string;
  on(event: 'open', cb: (id: string) => void): void;
  on(event: 'connection', cb: (conn: DataConnection) => void): void;
  on(event: 'error', cb: (err: unknown) => void): void;
  on(event: 'disconnected', cb: () => void): void;
  on(event: 'close', cb: () => void): void;
  connect(id: string, opts?: PeerConnectOptions): DataConnection;
  destroy(): void;
  reconnect(): void;
}

export interface PeerOptions {
  debug?: number;
  host?: string;
  port?: number;
  path?: string;
  secure?: boolean;
  config?: unknown;
}

declare global {
  interface Window {
    Peer?: {
      new (id?: string, opts?: PeerOptions): Peer;
    };
  }
}
