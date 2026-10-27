/* PeerJS bundled 模式：npm 包打进产物，可离线联机 */
import Peer from 'peerjs';
import type { Peer as PeerType, PeerOptions } from '../types/peerjs';

export function createPeer(id?: string, opts?: PeerOptions): PeerType {
  return new Peer(id ?? '', opts) as unknown as PeerType;
}
