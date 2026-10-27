/* PeerJS CDN 模式：读取 index.html 注入的全局 window.Peer
 * 产物体积最小，联机需联网。
 */
import type { Peer, PeerOptions } from '../types/peerjs';

export function createPeer(id?: string, opts?: PeerOptions): Peer {
  const Ctor = window.Peer;
  if (!Ctor) throw new Error('PeerJS 未加载（CDN 模式需要联网）');
  return new Ctor(id, opts);
}
