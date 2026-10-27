/* ==================== 主题系统：光线模式 × 配色风格 ====================
 * 借鉴 learn_kill：body 上挂 data-mode（day/night/dusk）× data-theme（配色），
 * 由 CSS 变量驱动；选择持久化于 profile（localStorage）。首帧兜底在 index.html 内联执行，
 * 避免整页重载时闪现无主题状态。
 */
import type { Profile } from '../profile/profile';
import { loadProfile, saveProfile } from '../profile/profile';
import { render } from './render';

export type ThemeMode = 'day' | 'night' | 'dusk';
export type ThemeStyle = 'jade' | 'gold' | 'azure' | 'purple' | 'red' | 'green';

const MODES: ThemeMode[] = ['day', 'night', 'dusk'];
const STYLES: ThemeStyle[] = ['jade', 'gold', 'azure', 'purple', 'red', 'green'];

const MODE_LABELS: Record<ThemeMode, string> = {
  day: '☀️ 白昼',
  night: '🌙 夜幕',
  dusk: '🌇 黄昏',
};
const STYLE_LABELS: Record<ThemeStyle, { name: string; sw: string }> = {
  jade: { name: '玉青', sw: '#3fb6a8' },
  gold: { name: '鎏金', sw: '#d4af37' },
  azure: { name: '黛蓝', sw: '#4a90d9' },
  purple: { name: '紫宸', sw: '#9b6bd6' },
  red: { name: '赤焰', sw: '#d65a4a' },
  green: { name: '雪松', sw: '#5fb87a' },
};

/** 应用主题到 body（首帧 / 切换 / 载入均调用） */
export function applyTheme(): void {
  const p = loadProfile();
  const m: ThemeMode = MODES.includes(p.themeMode) ? p.themeMode : 'night';
  const s: ThemeStyle = STYLES.includes(p.themeStyle) ? p.themeStyle : 'jade';
  if (document.body) {
    document.body.setAttribute('data-mode', m);
    document.body.setAttribute('data-theme', s);
  }
}

function set<K extends keyof Profile>(k: K, v: Profile[K]): void {
  const p = loadProfile();
  p[k] = v;
  saveProfile(p);
}

export function openThemePanel(): void {
  renderThemePanel();
  document.getElementById('themePanel')?.classList.add('show');
}
export function closeThemePanel(): void {
  document.getElementById('themePanel')?.classList.remove('show');
}
export function setThemeMode(m: ThemeMode): void {
  set('themeMode', m);
  applyTheme();
  renderThemePanel();
}
export function setThemeStyle(s: ThemeStyle): void {
  set('themeStyle', s);
  applyTheme();
  renderThemePanel();
  render();
}

/** 渲染主题设置弹窗内容 */
export function renderThemePanel(): void {
  const p = loadProfile();
  const box = document.getElementById('themePanel');
  if (!box) return;
  const modeBtns = MODES.map(
    (m) => `<button class="opt-btn theme-mode ${p.themeMode === m ? 'active' : ''}" onclick="setThemeMode('${m}')">${MODE_LABELS[m]}</button>`,
  ).join('');
  const styleBtns = STYLES.map(
    (s) =>
      `<button class="opt-btn theme-style ${p.themeStyle === s ? 'active' : ''}" onclick="setThemeStyle('${s}')"><i class="sw" style="--sw:${STYLE_LABELS[s].sw}"></i>${STYLE_LABELS[s].name}</button>`,
  ).join('');
  box.innerHTML = `
    <div class="theme-head">🎨 主题设置 <span style="font-size:9px;color:var(--muted)">点击切换</span><button class="theme-close" onclick="closeThemePanel()" title="关闭">✕</button></div>
    <div class="theme-sec-label">光线模式</div>
    <div class="theme-modes">${modeBtns}</div>
    <div class="theme-sec-label">配色风格（仙侠）</div>
    <div class="theme-styles">${styleBtns}</div>`;
}
