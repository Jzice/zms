/* ==================== 顶层渲染 ====================
 * 单一 render() 全量重绘（与 learn_kill 一致，无框架）。
 */
import { G } from '../game/state';
import { logsDesc } from '../game/log';
import { chatList } from '../game/chat';
import { renderLobby } from './lobby';
import { renderSeats, renderStatusBar } from './playzone';
import { renderHand, renderActionBtns, renderActionHint } from './hand';
import { renderSettle } from './settle';
import { pendingChoice } from '../game/choice';
import { escapeHtml } from '../core/dom';
import { charOf } from '../data/characters';

/** 战报条目类型 → 颜色类（对齐 learn_kill 的 play-log-item） */
const LOG_CLS: Record<string, string> = {
  system: 'sys',
  backlash: 'dmg',
  contract: 'hl',
  breakthrough: 'reward',
};

function hhmm(t: number): string {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function avatarOf(seat: number): string {
  const p = G.players.find((x) => x.seat === seat);
  return p ? (charOf(p.charId)?.avatar ?? '🧙') : '🧙';
}

let screen: 'lobby' | 'setup' | 'game' = 'lobby';

export function setScreen(s: 'lobby' | 'setup' | 'game'): void {
  screen = s;
  const l = document.getElementById('screenLobby');
  const st = document.getElementById('screenSetup');
  const g = document.getElementById('screenGame');
  if (l) l.classList.toggle('active', s === 'lobby');
  if (st) st.classList.toggle('active', s === 'setup');
  if (g) g.classList.toggle('active', s === 'game');
  const tb = document.getElementById('topBar');
  if (tb) tb.classList.toggle('in-game', s === 'game');
}

export function currentScreen(): 'lobby' | 'setup' | 'game' {
  return screen;
}

export function render(): void {
  renderTopBar();
  if (screen === 'lobby' || screen === 'setup') {
    renderLobby();
    return;
  }
  renderStatusBar();
  renderSeats();
  renderHand();
  renderActionBtns();
  renderActionHint();
  renderLogs();
  renderChat();
  renderPending();
  if (G.settle) renderSettle();
}

function renderTopBar(): void {
  const lv = document.getElementById('tbLevel');
  const sc = document.getElementById('tbScore');
  const pb = document.getElementById('tbProgress');
  const nm = document.getElementById('tbName');
  const av = document.getElementById('tbAvatar');
  // 档案由 profile 模块注入，此处仅做兜底
  void lv;
  void sc;
  void pb;
  void nm;
  void av;
  const ver = document.getElementById('tbVersion');
  if (ver) ver.textContent = ` v${__APP_VERSION__}`;
}

function renderLogs(): void {
  const el = document.getElementById('playLogList');
  const badge = document.getElementById('playLogBadge');
  if (!el) return;
  const items = logsDesc().slice(0, 60);
  el.innerHTML = items
    .map((l) => {
      const cls = LOG_CLS[l.kind ?? 'normal'] ?? '';
      return `<div class="play-log-item ${cls}"><span class="pl-time">${hhmm(l.t)}</span>${escapeHtml(l.text)}</div>`;
    })
    .join('');
  if (badge) badge.textContent = String(G.logs.length);
}

function renderChat(): void {
  const el = document.getElementById('chatList');
  if (!el) return;
  const meSeat = G.players.find((p) => !p.ai)?.seat;
  el.innerHTML = chatList()
    .slice(-40)
    .map((c) => {
      const self = meSeat !== undefined && c.seat === meSeat;
      return `<div class="chat-msg${self ? ' self' : ''}">
        <div class="cm-who">
          <span class="cm-avatar">${avatarOf(c.seat)}</span>
          <span class="cm-meta"><span class="cm-name">${escapeHtml(c.name)}</span></span>
        </div>
        <div class="cm-bubble">${escapeHtml(c.text)}</div>
      </div>`;
    })
    .join('');
  el.scrollTop = el.scrollHeight;
}

/** 待处理选择（护身 / 灵丹 / 目标选择等） */
function renderPending(): void {
  const hint = document.getElementById('actionHint');
  if (!hint) return;
  const p = pendingChoice();
  if (!p) return;
  const map: Record<string, string> = {
    card: '请选择一张牌',
    target: '请选择目标',
    confirm: '请确认',
    hushen: '是否打出【护身】？',
    lingdan: '是否使用【灵丹】？',
    wudao: '是否悟道？',
  };
  hint.innerHTML = `<span class="hint-pending">${escapeHtml(p.prompt || map[p.kind] || '请选择')}</span>`;
}
