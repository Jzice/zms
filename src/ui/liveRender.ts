/* ==================== 实时重绘调度 ====================
 * 背景：game 层（loop / turn / ai / damage）不调用 render()，AI 回合期间 UI 会冻结在
 * 玩家最后一次操作的渲染帧上 —— 表现为「当前玩家高亮固定在本座」（其实是停在旧帧）。
 *
 * 方案：以 ~120ms 轮询状态签名，只有发生变化才 render()，让座位高亮、状态栏、
 * 血量 / 手牌 / 战报在 AI 回合也能实时跟随 G.current。
 *
 * 守卫（不打断用户）：
 *   - 不在对局界面时不重绘
 *   - 输入框 / 文本域聚焦时不重绘（避免打断聊天输入）
 *   - 全屏弹层或下拉面板打开时不重绘；跳过时不更新签名，关闭后下一 tick 自动补渲
 */
import { G } from '../game/state';
import { render } from './render';

const TICK_MS = 120;

/** 全屏弹层（通过 display 切换） */
const OVERLAY_IDS = [
  'verseModal',
  'contractModal',
  'markModal',
  'settleModal',
  'rulesModal',
  'codexModal',
  'profileModal',
  'confirmModal',
];
/** 下拉 / 侧栏面板（通过 .show 切换） */
const PANEL_IDS = ['notifyPanel', 'themePanel', 'llmSettingsModal'];

let lastSig = '';
let timer: ReturnType<typeof setInterval> | null = null;

/** 状态签名：覆盖 UI 可见的所有关键字段 */
function sig(): string {
  const ps = G.players
    .map(
      (p) =>
        `${p.seat},${p.hp},${p.alive ? 1 : 0},${p.hand.length},${p.lingli},${p.daoxin},${p.xiuwei},${p.realm},${p.heartLock ? 1 : 0}`,
    )
    .join('|');
  const lastLogT = G.logs.length ? G.logs[G.logs.length - 1].t : 0;
  const lastChatT = G.chat.length ? G.chat[G.chat.length - 1].t : 0;
  return [
    G.turn,
    G.current,
    G.phase,
    G.over ? 1 : 0,
    G.deck.length,
    G.discard.length,
    G.logs.length,
    lastLogT,
    G.chat.length,
    lastChatT,
    G.thinkingSeat ?? -1,
    G.shengtongUsed,
    G.settle ? 1 : 0,
    G.winners.length,
    ps,
  ].join('#');
}

/** 是否应暂停重绘 */
function blocked(): boolean {
  const ae = document.activeElement as HTMLElement | null;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return true;
  for (const id of OVERLAY_IDS) {
    const el = document.getElementById(id);
    if (el && getComputedStyle(el).display !== 'none') return true;
  }
  for (const id of PANEL_IDS) {
    if (document.getElementById(id)?.classList.contains('show')) return true;
  }
  return false;
}

export function initLiveRender(): void {
  if (timer) return;
  timer = setInterval(() => {
    if (!G.started) return;
    if (!document.getElementById('screenGame')?.classList.contains('active')) return;
    if (blocked()) return;
    const s = sig();
    if (s === lastSig) return;
    lastSig = s;
    render();
  }, TICK_MS);
}
