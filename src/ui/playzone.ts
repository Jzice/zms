/* ==================== 牌桌：座位环 / 状态条 ====================
 * 座位卡结构对齐 learn_kill 的 .p-card：
 *   阵营图标 / 头像+名牌+身份 / 徽标（心头锁·伴兽·灵地阶位）/ 寿元宝石 /
 *   法宝四槽 / 法宝名 / 灵力道心判定行 / 底部（境界 + 手牌堆）
 * 大屏座位沿椭圆环绝对定位；小屏由 CSS !important 覆盖为横滚列表（与 learn_kill 一致）。
 */
import type { Player } from '../core/types';
import { G } from '../game/state';
import { escapeHtml } from '../core/dom';
import { charOf } from '../data/characters';
import { campColor, campName } from '../data/camps';
import { ROLE_MAP, SIDE_COLOR } from '../data/roles';
import { realmProgress, lingliMax } from '../game/realm';
import { highestLingdiTier } from '../data/lingdi';
import { BEAST_MAP } from '../data/beasts';
import { isPublicRole } from '../game/roles';
import { ROLE_MARKS } from '../game/marks';
import { render } from './render';

const PHASE_NAME: Record<string, string> = {
  judge: '判定',
  draw: '摸牌',
  play: '出牌',
  discard: '弃牌',
  over: '结束',
};

/** 阵营图标（docs 四方：人类 / 兽类 / 魔修 / 鬼修） */
const CAMP_EMOJI: Record<string, string> = {
  human: '🧑',
  beast: '🐾',
  moxiu: '🔥',
  guixiu: '👻',
};

/** 法宝四槽：槽位 / 图标 / 名称 */
const EQUIP_SLOTS: Array<[string, string, string]> = [
  ['benmingfaqi', '🗡️', '本命法宝'],
  ['fangju', '🛡️', '护身'],
  ['feisuo', '⛵', '飞梭·灵舟'],
  ['mibao', '💠', '秘宝·重宝'],
];



export function renderStatusBar(): void {
  const t = document.getElementById('gsTurn');
  const ph = document.getElementById('gsPhase');
  const r = document.getElementById('gsRole');
  const c = document.getElementById('gsConn');
  if (t) t.textContent = `回合：${G.turn}`;
  if (ph) ph.textContent = G.over || G.phase === 'over' ? '' : `阶段：${PHASE_NAME[G.phase] ?? G.phase}`;
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

function equipOf(p: Player, key: string): { name?: string } | undefined {
  return (p.equips as Record<string, { name?: string } | undefined>)[key];
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
  const isSelf = !p.ai;

  // 牌桌坐标：座位沿椭圆环排布（0 号本座在正下方）
  const n = Math.max(1, G.players.length);
  const ang = Math.PI / 2 + (p.seat / n) * Math.PI * 2;
  const sx = (50 + 40 * Math.cos(ang)).toFixed(2);
  const sy = (50 + 37 * Math.sin(ang)).toFixed(2);

  // 寿元宝石：按真实血量上限离散显示（3–4 颗，三国杀内核）
  const total = Math.max(1, p.maxHp);
  const low = p.hp > 0 && p.hp <= Math.ceil(total * 0.3);
  const gems = Array.from({ length: total }, (_, i) => {
    const on = i < p.hp;
    return `<i class="hp-gem${on ? '' : ' empty'}${on && low ? ' low' : ''}"></i>`;
  }).join('');

  // 徽标行：心头锁 / 伴兽 / 灵地阶位
  const badges: string[] = [];
  if (p.heartLock) badges.push('<span class="badge badge-reveal" title="心头锁：灵魂契约束缚">🔒</span>');
  if (beast)
    badges.push(
      `<span class="badge badge-shield" title="${escapeHtml(beast.name)} 寿 ${p.beast?.hp ?? 0}${p.beast?.broken ? '（已溃散）' : ''}">${beast.avatar}${p.beast?.hp ?? 0}</span>`,
    );
  if (tier) badges.push(`<span class="badge badge-combo" title="灵地阶位">地${tier}</span>`);

  // 法宝四槽
  const slots = EQUIP_SLOTS.map(([k, icon, label]) => {
    const card = equipOf(p, k);
    const short = card?.name ? card.name.slice(0, 1) : '';
    return `<span class="equip-slot${card ? ' filled' : ''}" title="${escapeHtml(label)}${card?.name ? `：${escapeHtml(card.name)}` : ''}"><span class="eq-icon">${icon}</span><span class="eq-short">${escapeHtml(short)}</span></span>`;
  }).join('');
  const eqNames = EQUIP_SLOTS.map(([k]) => equipOf(p, k)?.name)
    .filter(Boolean)
    .join('·');

  const roleText = showRole ? (role?.name ?? p.role) : '？？';
  const roleColor = showRole ? (SIDE_COLOR[side] ?? 'var(--muted)') : 'var(--muted)';

  // 身份标记（玩家手动标注的身份猜测）
  const markId = ROLE_MARKS[p.seat];
  const markDef = markId ? ROLE_MAP[markId] : undefined;
  const markColor = markDef ? (SIDE_COLOR[markDef.side] ?? 'var(--gold)') : 'var(--gold)';

  return `
  <div class="seat${isCur ? ' seat-cur' : ''}" id="seat-${p.seat}"
       style="--faction-color:${campColor(p.camp)};--side:${SIDE_COLOR[side]};left:${sx}%;top:${sy}%"
       onclick="clickSeat(${p.seat})">
    <div class="p-card${isCur ? ' turn' : ''}${p.alive ? '' : ' dead'}${isSelf ? ' is-self' : ''}${markDef ? ' role-marked' : ''}${G.thinkingSeat === p.seat ? ' thinking' : ''}">
      <span class="faction-icon" title="${escapeHtml(campName(p.camp))}">${CAMP_EMOJI[p.camp] ?? '🧑'}</span>
      ${isSelf ? '' : `<button class="p-mark-btn" title="标记身份" onclick="event.stopPropagation();openMarkMenu(${p.seat})">🏷</button>`}
      ${markDef ? `<span class="p-mark-label" style="color:${markColor}">${escapeHtml(markDef.name)}</span>` : ''}
      <div class="pheader">
        <div class="pavatar">${c?.avatar ?? '🧙'}</div>
        <div class="pname-block">
          <div class="pname">${isCur ? '<span class="turn-arrow">▶</span>' : ''}${escapeHtml(p.name)}</div>
          <div class="prole" style="color:${roleColor}">${escapeHtml(roleText)}</div>
        </div>
      </div>
      <div class="p-badges">${badges.join('')}${G.thinkingSeat === p.seat ? '<span class="seat-thinking">深思</span>' : ''}</div>
      <div class="php-bar" title="寿元 ${p.hp}/${p.maxHp}">${gems}</div>
      <div class="pequip-slots">${slots}</div>
      <div class="pequip-names">${escapeHtml(eqNames)}</div>
      <div class="pjudge-row">
        <span class="judge-tag" title="灵力">灵 ${p.lingli}/${lmax}</span>
        <span class="judge-tag" title="道心">道 ${p.daoxin}</span>
      </div>
      <div class="pfooter">
        <span class="pf-realm" title="境界">${escapeHtml(prog.label)}</span>
        <span class="hand-pile" title="手牌 ${p.hand.length} 张">
          <span class="mini-card"></span><span class="mini-card"></span><span class="mini-card"></span>
          <span class="hand-count">${p.hand.length}</span>
        </span>
      </div>
    </div>
  </div>`;
}

/** 点击座位（选目标 / 查看） */
export function clickSeat(seat: number): void {
  const el = document.getElementById(`seat-${seat}`);
  if (!el) return;
  document.querySelectorAll('.seat').forEach((s) => s.classList.remove('seat-targetable'));
  el.classList.add('seat-targetable');
  (window as unknown as { __zmsTarget?: number }).__zmsTarget = seat;
  render();
}
