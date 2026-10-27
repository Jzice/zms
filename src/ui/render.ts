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
  damage: 'dmg',
  backlash: 'dmg',
  heal: 'heal',
  skill: 'skill',
  reward: 'reward',
  breakthrough: 'reward',
  contract: 'hl',
  faction: 'faction',
};

function hhmm(t: number): string {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 战报富文本：牌名高亮 + 关键词着色（learn_kill 同款视觉） */
function fmtLog(text: string): string {
  let s = escapeHtml(text);
  s = s.replace(/【([^】]+)】/g, '<span class="pl-card">【$1】</span>');
  const kw: Array<[RegExp, string]> = [
    [/(受到|损失|伤害|陨落|焚身|反噬|弃置)/g, 'lkw-dmg'],
    [/(回复|回春|回寿|治疗|稳心|生机)/g, 'lkw-heal'],
    [/(发动|使用|打出|施展|装备|占据|祭出)/g, 'lkw-skill'],
    [/(契约|立约|心头锁|真名)/g, 'lkw-hl'],
    [/(突破|破境|感悟|修为|道心)/g, 'lkw-reward'],
  ];
  for (const [re, cls] of kw) s = s.replace(re, `<b class="${cls}">$1</b>`);
  return s;
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
  const nc = document.getElementById('netChatPanel');
  if (nc) nc.classList.toggle('show', s === 'game');
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
  renderNotify();
  renderPending();
  if (G.settle) renderSettle();
}

/* ---------------- 聊天 / 通知未读计数（面板打开时清零） ---------------- */

let chatSeen = 0;
let notifySeen = 0;

export function markChatSeen(): void {
  chatSeen = chatList().length;
}

export function markNotifySeen(): void {
  notifySeen = G.logs.length;
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
      const av = l.seat !== undefined ? `<span class="pl-av">${avatarOf(l.seat)}</span>` : '';
      return `<div class="play-log-item ${cls}">${av}<span class="pl-main"><span class="pl-time">${hhmm(l.t)}</span>${fmtLog(l.text)}</span></div>`;
    })
    .join('');
  if (badge) badge.textContent = String(G.logs.length);
}

function chatHtml(): string {
  const meSeat = G.players.find((p) => !p.ai)?.seat;
  return chatList()
    .slice(-40)
    .map((c) => {
      if (c.system) return `<div class="chat-msg sys"><div class="cm-bubble">📢 ${escapeHtml(c.text)}</div></div>`;
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
}

function renderChat(): void {
  const html = chatHtml();
  for (const id of ['chatList', 'netChatList']) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
  }
  const list = chatList();
  const unread = Math.max(0, list.length - chatSeen);
  const badge = document.getElementById('netChatBadge');
  const latest = document.getElementById('netChatLatest');
  if (badge) {
    badge.textContent = String(unread);
    badge.classList.toggle('show', unread > 0);
  }
  if (latest) {
    const last = list[list.length - 1];
    latest.textContent = last ? `${last.name}：${last.text}` : '';
  }
}

function renderNotify(): void {
  const el = document.getElementById('notifyList');
  if (!el) return;
  const items = logsDesc().slice(0, 20);
  el.innerHTML = items.length
    ? items
        .map((l) => {
          const ic =
            l.kind === 'contract' ? '📜' : l.kind === 'backlash' ? '💥' : l.kind === 'breakthrough' ? '✦' : '·';
          return `<div class="notify-item"><span class="ni-icon">${ic}</span><span class="ni-text">${escapeHtml(l.text)}</span></div>`;
        })
        .join('')
    : '<div class="notify-empty">暂无消息</div>';
  const unread = Math.max(0, G.logs.length - notifySeen);
  const badge = document.getElementById('notifyBadge');
  if (badge) {
    badge.textContent = String(unread);
    badge.classList.toggle('show', unread > 0);
  }
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
