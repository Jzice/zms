/* ==================== 牌桌：座位环 / 状态条 ====================
 * 座位展示：头像、寿元环、身份角标、阵营色环、势力徽章、
 *          法宝四槽、伴兽徽标、境界修为进度、灵地阶位、灵力球与道心球。
 */
import type { Player } from '../core/types';
import { G } from '../game/state';
import { escapeHtml } from '../core/dom';
import { charOf } from '../data/characters';
import { campColor, campName } from '../data/camps';
import { powerName } from '../data/powers';
import { ROLE_MAP, SIDE_COLOR } from '../data/roles';
import { realmProgress, lingliMax } from '../game/realm';
import { highestLingdiTier } from '../data/lingdi';
import { BEAST_MAP } from '../data/beasts';
import { isPublicRole } from '../game/roles';
import { render } from './render';

const PHASE_NAME: Record<string, string> = {
  judge: '判定',
  draw: '摸牌',
  play: '出牌',
  discard: '弃牌',
  over: '结束',
};

export function renderStatusBar(): void {
  const t = document.getElementById('gsTurn');
  const ph = document.getElementById('gsPhase');
  const r = document.getElementById('gsRole');
  const c = document.getElementById('gsConn');
  if (t) t.textContent = `回合：${G.turn}`;
  if (ph) ph.textContent = `阶段：${PHASE_NAME[G.phase] ?? G.phase}`;
  const p = G.players[G.current];
  if (r && p) r.textContent = `当前：${p.name}`;
  if (c) c.textContent = G.over ? '已结束' : '';
}

export function renderSeats(): void {
  const ring = document.getElementById('seatRing');
  if (!ring) return;
  ring.innerHTML = G.players.map((p) => seatHtml(p)).join('');
  const deck = document.getElementById('deckCount');
  const disc = document.getElementById('discardCount');
  if (deck) deck.textContent = String(G.deck.length);
  if (disc) disc.textContent = String(G.discard.length);
}

function seatHtml(p: Player): string {
  const c = charOf(p.charId);
  const role = ROLE_MAP[p.role];
  const side = role?.side ?? 'zhengdao';
  const isCur = G.current === p.seat && !G.over;
  const showRole = isPublicRole(p) || !p.alive || G.over;
  const prog = realmProgress(p);
  const lmax = lingliMax(p);
  const tier = highestLingdiTier(p.lingdi);
  const beast = p.beast ? BEAST_MAP[p.beast.id] : undefined;

  // 牌桌坐标：座位沿椭圆环排布（大屏生效；小屏由 CSS !important 覆盖为列表流）
  const n = G.players.length;
  const ang = Math.PI / 2 + (p.seat / Math.max(1, n)) * Math.PI * 2;
  const sx = (50 + 38 * Math.cos(ang)).toFixed(2);
  const sy = (50 + 36 * Math.sin(ang)).toFixed(2);

  return `
  <div class="seat ${isCur ? 'seat-cur' : ''} ${p.alive ? '' : 'seat-dead'} ${G.thinkingSeat === p.seat ? 'seat-thinking' : ''}"
       id="seat-${p.seat}" style="--camp:${campColor(p.camp)};--side:${SIDE_COLOR[side]};left:${sx}%;top:${sy}%"
       onclick="clickSeat(${p.seat})">
    <div class="seat-avatar">${c?.avatar ?? '🧙'}${G.thinkingSeat === p.seat ? '<span class="seat-think" title="大模型深思中">💭</span>' : ''}</div>
    <div class="seat-name">${escapeHtml(p.name)}</div>
    <div class="seat-char">${escapeHtml(c?.name ?? '')}<span class="seat-power">${escapeHtml(powerName(p.power))}</span></div>
    <div class="seat-hp" title="寿元">寿 <b>${p.hp}</b>/${p.maxHp}</div>
    <div class="seat-realm">${escapeHtml(prog.label)} <span class="rp">${prog.cur}/${prog.need}</span></div>
    <div class="seat-res">
      <span class="orb orb-lingli" title="灵力">灵 ${p.lingli}/${lmax}</span>
      <span class="orb orb-daoxin" title="道心">道 ${p.daoxin}</span>
      ${tier ? `<span class="orb orb-lingdi" title="灵地阶位">地 ${tier}阶</span>` : ''}
    </div>
    <div class="seat-camp" title="${escapeHtml(campName(p.camp))}">${escapeHtml(campName(p.camp))}</div>
    <div class="seat-role ${showRole ? '' : 'role-hidden'}">
      ${showRole ? escapeHtml(role?.name ?? p.role) : '？？'}
    </div>
    ${p.heartLock ? '<div class="seat-lock" title="心头锁：灵魂契约束缚">🔒</div>' : ''}
    ${beast ? `<div class="seat-beast ${p.beast?.broken ? 'beast-broken' : ''}" title="${escapeHtml(beast.name)}">${beast.avatar}<span>${p.beast?.hp ?? 0}</span></div>` : ''}
    <div class="seat-equips">${equipHtml(p)}</div>
    <div class="seat-handcount">✋ ${p.hand.length}</div>
  </div>`;
}

function equipHtml(p: Player): string {
  const slots: [string, string][] = [
    ['benmingfaqi', '本命法宝'],
    ['fangju', '护身'],
    ['feisuo', '飞梭'],
    ['mibao', '秘宝'],
  ];
  return slots
    .map(([k, label]) => {
      const card = p.equips[k as never] as { name?: string } | undefined;
      return `<span class="eq ${card ? 'eq-on' : ''}" title="${escapeHtml(label)}">${card ? escapeHtml(card.name ?? '') : label[0]}</span>`;
    })
    .join('');
}

/** 点击座位（选目标 / 查看） */
export function clickSeat(seat: number): void {
  const el = document.getElementById(`seat-${seat}`);
  if (!el) return;
  // 标记当前选中的目标，供出牌使用
  document.querySelectorAll('.seat').forEach((s) => s.classList.remove('seat-target'));
  el.classList.add('seat-target');
  (window as unknown as { __zmsTarget?: number }).__zmsTarget = seat;
  render();
}
