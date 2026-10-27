/* ==================== 聊天 ====================
 * 单一模块所有权：chatMessages 只经此处 mutator 修改。
 */
import type { ChatMsg } from '../core/types';
import { G } from './state';

const MAX_CHAT = 60;

export function pushChat(seat: number, name: string, text: string): void {
  if (!text.trim()) return;
  G.chat.push({ seat, name, text: text.slice(0, 40), t: Date.now() });
  if (G.chat.length > MAX_CHAT) G.chat.splice(0, G.chat.length - MAX_CHAT);
}

export function chatList(): ChatMsg[] {
  return G.chat;
}
