/* ==================== 入口：唯一副作用模块 ====================
 * 挂载 window 全局（模板 onclick）→ 初始化序列 → 启动。
 * ⚠ 仅本模块允许顶层副作用；其余模块顶层禁止副作用（learn_kill 不变量 ③）。
 */
import './style.css';

import { G, resetG } from './game/state';
import { render, setScreen } from './ui/render';
import { renderLobby, getSelections, playerCount } from './ui/lobby';
import {
  selectCard,
  confirmPlay,
  doWudao,
  doCloseDoor,
  endTurnUI,
  useSkillUI,
  signContractUI,
  localPlayer,
} from './ui/hand';
import { clickSeat } from './ui/playzone';
import {
  openRules,
  closeRules,
  openCodex,
  closeCodex,
  openProfile,
  closeProfile,
  closeVerse,
  closeContractModal,
  closeMarkMenu,
  switchRulesTab,
} from './ui/modals';
import { closeSettle } from './ui/settle';
import {
  setSelCamp,
  setSelRegion,
  setSelChar,
  setSelBeast,
  toggleRole,
} from './ui/lobby';
import { startGame, applyLlmModes } from './game/setup';
import { gameLoop } from './game/loop';
import { setSound, isSoundOn } from './core/sound';
import { togglePanel } from './core/dom';
import { pushChat } from './game/chat';
import { setRoleMark } from './game/marks';
import { loadProfile, saveProfile, recordGame } from './profile/profile';
import { createRoom, join, startNetGame, roomCodeText, currentRoom } from './net/rooms';
import { isHost } from './net/network';
import { broadcastState } from './net/network';
import { ROLE_MAP } from './data/roles';
import { campName } from './data/camps';
import { applyTheme, openThemePanel, closeThemePanel, setThemeMode, setThemeStyle } from './ui/theme';
import {
  openLlmSettings,
  closeLlmSettings,
  renderLlmSetupPanel,
  llmSetProvider,
  llmSetEnabled,
  llmSetTakeoverAll,
  llmSetDebug,
  llmToggleSeat,
  llmSetField,
  llmTestConn,
} from './ui/llmSettings';

/* ---------------- 顶栏 / 弹层 ---------------- */

window.toggleSound = function (): void {
  const p = loadProfile();
  p.sound = !p.sound;
  saveProfile(p);
  setSound(p.sound);
  const btn = document.getElementById('soundToggle');
  if (btn) btn.textContent = p.sound ? '🔊' : '🔇';
};
window.openRules = openRules;
window.closeRules = closeRules;
window.openCodex = openCodex;
window.closeCodex = closeCodex;
window.openProfile = openProfile;
window.closeProfile = closeProfile;
window.closeVerse = closeVerse;
window.closeContractModal = closeContractModal;
window.closeMarkMenu = closeMarkMenu;
window.closeSettle = closeSettle;
window.switchRulesTab = switchRulesTab;
window.togglePanel = togglePanel;

window.setRoleMarkUI = function (seat: number, roleId: string): void {
  setRoleMark(seat, roleId);
  closeMarkMenu();
  render();
};

/* ---------------- 大厅 ---------------- */

window.setSelCamp = setSelCamp;
window.setSelRegion = setSelRegion;
window.setSelChar = setSelChar;
window.setSelBeast = setSelBeast;
window.toggleRole = toggleRole;

/* ---------------- 牌桌 ---------------- */

window.clickSeat = clickSeat;
window.selectCard = selectCard;
window.confirmPlay = confirmPlay;
window.doWudao = doWudao;
window.doCloseDoor = doCloseDoor;
window.endTurnUI = endTurnUI;
window.useSkillUI = useSkillUI;
window.signContractUI = signContractUI;

/* ---------------- 主题 / 大模型设置 ---------------- */
window.openThemePanel = openThemePanel;
window.closeThemePanel = closeThemePanel;
window.setThemeMode = setThemeMode as (m: 'day' | 'night' | 'dusk') => void;
window.setThemeStyle = setThemeStyle as (s: 'jade' | 'gold' | 'azure' | 'purple' | 'red' | 'green') => void;
window.openLlmSettings = openLlmSettings;
window.closeLlmSettings = closeLlmSettings;
window.llmSetProvider = llmSetProvider;
window.llmSetEnabled = llmSetEnabled;
window.llmSetTakeoverAll = llmSetTakeoverAll;
window.llmSetDebug = llmSetDebug;
window.llmToggleSeat = llmToggleSeat;
window.llmSetField = llmSetField;
window.llmTestConn = llmTestConn;

/* ---------------- 对局流程 ---------------- */

function launchGame(count: number): void {
  const { selChar, selBeast, enabledRoles } = getSelections();
  startGame({
    count,
    enabledRoles,
    myCharId: selChar ?? undefined,
    beastChoice: selBeast,
  });
  setScreen('game');
  render();
  void gameLoop();
}

window.startSingle = function (): void {
  launchGame(playerCount());
};

window.createRoomUI = async function (): Promise<void> {
  try {
    const info = await createRoom();
    const el = document.getElementById('roomInfo');
    if (el) el.textContent = `房间号：${info.code}（你是房主）`;
    const btn = document.getElementById('netStartBtn');
    if (btn) btn.style.display = '';
  } catch (e) {
    const el = document.getElementById('roomInfo');
    if (el) el.textContent = `创建失败：${String(e)}`;
  }
};

window.joinRoomUI = async function (): Promise<void> {
  const input = document.getElementById('joinCode') as HTMLInputElement | null;
  const code = input?.value?.trim() ?? '';
  const el = document.getElementById('roomInfo');
  try {
    const p = loadProfile();
    const info = await join(code, p.name);
    if (el) el.textContent = `已加入房间 ${info.code}`;
  } catch (e) {
    if (el) el.textContent = `加入失败：${String(e)}`;
  }
};

window.startNetUI = function (): void {
  if (!isHost()) return;
  const { selChar, selBeast, enabledRoles } = getSelections();
  startGame({
    count: playerCount(),
    enabledRoles,
    myCharId: selChar ?? undefined,
    beastChoice: selBeast,
  });
  startNetGame();
  setScreen('game');
  render();
  void gameLoop();
};

window.againGame = function (): void {
  closeSettle();
  resetG();
  launchGame(playerCount());
};

window.backToLobby = function (): void {
  closeSettle();
  resetG();
  setScreen('lobby');
  renderLobby();
};

window.exitGame = function (): void {
  resetG();
  setScreen('lobby');
  renderLobby();
};

window.sendChat = function (): void {
  const input = document.getElementById('chatInput') as HTMLInputElement | null;
  const text = input?.value ?? '';
  if (!text.trim()) return;
  const p = localPlayer();
  pushChat(p?.seat ?? 0, p?.name ?? '本座', text);
  if (input) input.value = '';
  render();
};

/* ---------------- 调试钩子（冒烟脚本驱动） ---------------- */

window.__zmsSnapshot = function (): unknown {
  return {
    players: G.players.map((p) => ({
      seat: p.seat,
      name: p.name,
      role: p.role,
      roleName: ROLE_MAP[p.role]?.name ?? p.role,
      camp: p.camp,
      hp: p.hp,
      xiuwei: p.xiuwei,
      realm: p.realm,
      lingli: p.lingli,
      daoxin: p.daoxin,
      lingdi: p.lingdi,
      hand: p.hand.length,
      beast: p.beast,
      contracts: p.contracts.length,
      alive: p.alive,
    })),
    over: G.over,
    winners: G.winners,
    turn: G.turn,
    deck: G.deck.length,
    discard: G.discard.length,
    settle: G.settle,
  };
};

window.__zmsStart = function (count = 6): void {
  launchGame(count);
};

window.__zmsMakeAllAI = function (): void {
  for (const p of G.players) p.ai = true;
  render();
};

/* ---------------- 初始化序列 ---------------- */

function syncTopBar(): void {
  const p = loadProfile();
  const lv = document.getElementById('tbLevel');
  const sc = document.getElementById('tbScore');
  const pb = document.getElementById('tbProgress');
  const nm = document.getElementById('tbName');
  const av = document.getElementById('tbAvatar');
  const st = document.getElementById('soundToggle');
  if (nm) nm.textContent = p.name;
  if (av) av.textContent = p.avatar;
  if (st) st.textContent = p.sound ? '🔊' : '🔇';
  if (lv) lv.textContent = '';
  if (sc) sc.textContent = `${p.score} 分`;
  if (pb) pb.style.width = '';
  setSound(p.sound);
  void isSoundOn;
}

function init(): void {
  applyTheme();
  syncTopBar();
  setScreen('lobby');
  renderLobby();
  renderLlmSetupPanel();
  render();

  // 人数滑块联动
  const slider = document.getElementById('countSlider');
  slider?.addEventListener('input', () => renderLobby());

  // 房主：状态变化广播
  setInterval(() => {
    if (isHost() && G.started) broadcastState();
  }, 1000);
}

init();

/* 结算后记录档案 */
window.addEventListener('beforeunload', () => {
  /* 无需处理 */
});

/** 结算时记录战绩（供外部调用） */
export function recordResult(): void {
  const p = localPlayer();
  if (!p || !G.settle) return;
  const win = G.settle.winners.includes(p.seat);
  recordGame(win, p.camp, p.power, 120);
  void campName;
  void roomCodeText;
  void currentRoom;
}
