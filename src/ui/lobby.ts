/* ==================== 大厅 ====================
 * 阵营 / 地域 / 势力层级树 / 角色网格 / 伴兽面板 / 身份池勾选 / 人数配比
 * SELECTED_* 状态由本模块单独持有（learn_kill 不变量 ④）
 */
import type { Camp, Region } from '../core/types';
import { escapeHtml } from '../core/dom';
import { CAMPS } from '../data/camps';
import { REGIONS } from '../data/regions';
import { POWERS, TIER_NAME } from '../data/powers';
import { CHARACTERS, charOf, needsBeast } from '../data/characters';
import { BEASTS, beastPoolFor } from '../data/beasts';
import { ROLE_DEFS, SIDE_NAME, SIDE_COLOR } from '../data/roles';
import { roleQuota } from '../game/roles';
import { render } from './render';

/* ---------------- 选择状态（本模块所有） ---------------- */
let selCamp: Camp | 'all' = 'all';
let selRegion: Region | 'all' = 'all';
let selChar: string | null = null;
let selBeast: Record<string, string> = {};
let enabledRoles: string[] = ROLE_DEFS.filter((r) => r.defaultOn).map((r) => r.id);

export function getSelections() {
  return { selCamp, selRegion, selChar, selBeast, enabledRoles };
}
export function setSelChar(id: string): void {
  selChar = id;
  render();
}
export function setSelCamp(c: string): void {
  selCamp = c as Camp | 'all';
  render();
}
export function setSelRegion(r: string): void {
  selRegion = r as Region | 'all';
  render();
}
export function setSelBeast(charId: string, beastId: string): void {
  selBeast[charId] = beastId;
  render();
}
export function toggleRole(id: string): void {
  if (id === 'master') return; // 掌门必备
  if (enabledRoles.includes(id)) enabledRoles = enabledRoles.filter((x) => x !== id);
  else enabledRoles.push(id);
  render();
}
export function playerCount(): number {
  const el = document.getElementById('countSlider') as HTMLInputElement | null;
  return Number(el?.value ?? 6);
}

/* ---------------- 渲染 ---------------- */

export function renderLobby(): void {
  renderCampPicker();
  renderRegionPicker();
  renderPowerTree();
  renderCharGrid();
  renderBeastPanel();
  renderRolePool();
  renderCountHint();
}

function renderCampPicker(): void {
  const el = document.getElementById('campPicker');
  if (!el) return;
  const items = [{ id: 'all', name: '全部' }, ...CAMPS];
  el.innerHTML = items
    .map((c) => {
      const color = c.id === 'all' ? '#888' : (c as { color?: string }).color ?? '#888';
      return `<button class="opt-btn ${selCamp === c.id ? 'active' : ''}" style="--c:${color}"
        onclick="setSelCamp('${c.id}')">${escapeHtml(c.name)}</button>`;
    })
    .join('');
}

function renderRegionPicker(): void {
  const el = document.getElementById('regionPicker');
  if (!el) return;
  const items = [{ id: 'all', name: '全部地域' }, ...REGIONS];
  el.innerHTML = items
    .map(
      (r) =>
        `<button class="opt-btn opt-sm ${selRegion === r.id ? 'active' : ''}" onclick="setSelRegion('${r.id}')">${escapeHtml(r.name)}</button>`,
    )
    .join('');
}

function renderPowerTree(): void {
  const el = document.getElementById('powerTree');
  if (!el) return;
  const tiers = ['super', 'sect', 'family', 'vassal'];
  el.innerHTML = tiers
    .map((t) => {
      const list = POWERS.filter(
        (p) =>
          p.tier === t &&
          (selCamp === 'all' || p.camp === selCamp) &&
          (selRegion === 'all' || p.region === selRegion),
      );
      if (!list.length) return '';
      return `<div class="power-tier"><span class="pt-label">${escapeHtml(TIER_NAME[t] ?? t)}</span>
        <span class="pt-list">${list
          .map((p) => `<span class="pt-item">${escapeHtml(p.name)}</span>`)
          .join('')}</span></div>`;
    })
    .join('');
}

function filteredChars() {
  return CHARACTERS.filter(
    (c) =>
      (selCamp === 'all' || c.camp === selCamp) &&
      (selRegion === 'all' || c.region === selRegion),
  );
}

function renderCharGrid(): void {
  const el = document.getElementById('charGrid');
  const hint = document.getElementById('charHint');
  const preview = document.getElementById('charPreview');
  if (!el) return;
  const list = filteredChars();
  if (hint) hint.textContent = `（共 ${list.length} 名）`;
  el.innerHTML = list
    .map((c) => {
      const roots = c.spiritRoots.length;
      return `<div class="char-card ${selChar === c.id ? 'sel' : ''}" onclick="setSelChar('${c.id}')">
        <div class="cc-avatar">${c.avatar}</div>
        <div class="cc-name">${escapeHtml(c.name)}</div>
        <div class="cc-title">${escapeHtml(c.title)}</div>
        <div class="cc-roots" title="灵根 ${roots} 系">${'●'.repeat(Math.min(3, roots))}</div>
        ${needsBeast(c) ? '<div class="cc-beast">兽</div>' : ''}
      </div>`;
    })
    .join('');
  if (preview && selChar) {
    const c = charOf(selChar);
    if (c) {
      preview.innerHTML = `
        <div class="cp-head">${c.avatar} <b>${escapeHtml(c.name)}</b> · ${escapeHtml(c.title)}</div>
        <div class="cp-row">阵营：${escapeHtml(c.camp)} ｜ 势力：${escapeHtml(c.power)} ｜ 地域：${escapeHtml(c.region)}</div>
        <div class="cp-row">境界：${escapeHtml(c.realm)} ｜ 本命：${escapeHtml(c.benming)}${c.dao ? ` ｜ 大道：${escapeHtml(c.dao)}` : ''}</div>
        <div class="cp-row">灵根：${c.spiritRoots.length} 系（${escapeHtml(c.spiritRoots.join('/'))}）</div>
        <div class="cp-skills">${c.skills
          .map((s) => `<span class="sk">${escapeHtml(s.name)}：${escapeHtml(s.desc)}</span>`)
          .join('')}</div>`;
    }
  }
}

function renderBeastPanel(): void {
  const panel = document.getElementById('beastPanel');
  const row = document.getElementById('beastRow');
  if (!panel || !row) return;
  const c = selChar ? charOf(selChar) : undefined;
  if (!c || !needsBeast(c)) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = '';
  const pool = beastPoolFor(c.id, c.beastPool);
  const list = BEASTS.filter((b) => pool.includes(b.id));
  row.innerHTML = list
    .map((b) => {
      const on = selBeast[c.id] === b.id;
      return `<div class="beast-card ${on ? 'sel' : ''}" onclick="setSelBeast('${c.id}','${b.id}')">
        <div class="bc-av">${b.avatar}</div>
        <div class="bc-name">${escapeHtml(b.name)}</div>
        <div class="bc-tier">${escapeHtml(b.tier)} ｜ 寿 ${b.hp}</div>
        ${b.passive ? `<div class="bc-p">${escapeHtml(b.passive.name)}：${escapeHtml(b.passive.desc)}</div>` : ''}
      </div>`;
    })
    .join('');
}

function renderRolePool(): void {
  const el = document.getElementById('rolePool');
  if (!el) return;
  const sides: (keyof typeof SIDE_NAME)[] = ['zhengdao', 'waidao', 'yinni', 'gaowei'];
  el.innerHTML = sides
    .map((side) => {
      const list = ROLE_DEFS.filter((r) => r.side === side);
      return `<div class="role-side" style="--sc:${SIDE_COLOR[side]}">
        <div class="rs-head">${escapeHtml(SIDE_NAME[side])}</div>
        <div class="rs-list">${list
          .map(
            (r) =>
              `<div class="role-chip ${enabledRoles.includes(r.id) ? 'on' : ''} ${r.id === 'master' ? 'locked' : ''}"
                onclick="toggleRole('${r.id}')" title="${escapeHtml(r.desc)}">
                <b>${escapeHtml(r.name)}</b><span>${r.public ? '公开' : '隐藏'}</span></div>`,
          )
          .join('')}</div>
      </div>`;
    })
    .join('');
}

function renderCountHint(): void {
  const el = document.getElementById('roleQuotaHint');
  const val = document.getElementById('countValue');
  const n = playerCount();
  if (val) val.textContent = `${n} 人`;
  if (!el) return;
  const q = roleQuota(n);
  el.textContent = `当前 ${n} 人自动配比 → 掌门 ${q.master} · 正道 ${q.zhengdao} · 外道 ${q.waidao} · 隐匿 ${q.yinni}`;
}
