/* ==================== 动效层（DOM 动画，无依赖） ====================
 * 仙侠水墨 × learn_kill 动效体系：
 *   剑意突进 / 剑气斩击 / 伤害飘字 / 护体灵光 / 生机涟漪 / 五行判定翻牌 /
 *   摸弃飞牌 / 法术涟漪 / 符箓展开 / 阵法冲击 / 突破光柱 / 悟道金光 /
 *   心头锁 / 元神离体 / 结算横幅 / 胜利个性动画 / 全屏闪光
 *
 * 设计约束：
 *   - 全部经 push() 统一挂载到 #fxLayer，isSim() 下静默（无头冒烟不产生 DOM / 不阻塞）。
 *   - 仅做视觉，绝不改变任何结算逻辑；函数均为同步 void（不 await，避免卡流程）。
 *   - 术语用修真语汇：剑气 / 护体灵光 / 灵石 / 符箓 / 道心澄明 / 心魔滋生 / 破境 / 陨落。
 */
import type { Card } from '../core/types';
import { isSim, escapeHtml } from './dom';

type Point = { x: number; y: number };

function layer(): HTMLElement | null {
  return document.getElementById('fxLayer');
}

function sim(): boolean {
  return isSim();
}

function viewW(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 0;
}
function viewH(): number {
  return typeof window !== 'undefined' ? window.innerHeight : 0;
}

/** 座位锚点（座位卡中心）；无 DOM / 桩对象时回退到屏幕中心 */
export function seatAnchor(seat: number): Point & { el: HTMLElement | null } {
  const center = { x: viewW() / 2, y: viewH() / 2 };
  if (sim()) return { ...center, el: null };
  const el = document.getElementById('seat-' + seat) as HTMLElement | null;
  if (!el || typeof el.getBoundingClientRect !== 'function') return { ...center, el: null };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, el };
}

function elAnchor(target: HTMLElement | null): Point {
  const center = { x: viewW() / 2, y: viewH() / 2 };
  if (!target || typeof target.getBoundingClientRect !== 'function') return center;
  const r = target.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** 统一挂载：cls 类名、锚点、存活毫秒、可选 HTML、锚点偏移 */
function push(cls: string, at: Point, life: number, html = '', dx = 0, dy = 0): HTMLElement | null {
  const l = layer();
  if (!l || sim()) return null;
  const d = document.createElement('div');
  d.className = cls;
  d.style.left = `${at.x + dx}px`;
  d.style.top = `${at.y + dy}px`;
  if (html) d.innerHTML = html;
  l.appendChild(d);
  setTimeout(() => d.remove(), life);
  return d;
}

/* ==================== 座位卡自身动作 ==================== */

/** 剑意突进：攻击者座位卡前倾 */
export function attackLunge(seat: number): void {
  if (sim()) return;
  const a = seatAnchor(seat);
  const card = a.el?.querySelector<HTMLElement>('.p-card') ?? a.el;
  if (!card) return;
  card.classList.remove('fx-lunge');
  void card.offsetWidth;
  card.classList.add('fx-lunge');
  setTimeout(() => card.classList.remove('fx-lunge'), 470);
}

/** 受击震颤：座位卡抖动 + 血光 */
export function hitShake(seat: number): void {
  if (sim()) return;
  const a = seatAnchor(seat);
  const card = a.el?.querySelector<HTMLElement>('.p-card') ?? a.el;
  if (!card) return;
  card.classList.remove('fx-hit');
  void card.offsetWidth;
  card.classList.add('fx-hit');
  setTimeout(() => card.classList.remove('fx-hit'), 540);
}

/* ==================== 核心战斗特效 ==================== */

/** 剑气斩击：斜向剑光 + 元素字（剑 / 炎 / 雷） */
export function swordSlash(seat: number, kind: 'normal' | 'fire' | 'thunder' = 'normal'): void {
  const a = seatAnchor(seat);
  const word = kind === 'fire' ? '炎' : kind === 'thunder' ? '雷' : '剑';
  const d = push(`fx-slash fx-slash-${kind}`, a, 780, `<span class="fs-word">${word}</span>`, -44, -50);
  if (d) d.style.setProperty('--fx-tilt', `${-34 + Math.random() * 22}deg`);
}

/** 伤害飘字（血色扣血） */
export function damageFloat(seat: number, n: number): void {
  if (n <= 0) return;
  push('fx-dmg', seatAnchor(seat), 1000, `-${n}`);
}

/** 护体灵光（打出护身）：金青灵罩 + 「护」字 */
export function shieldRing(seat: number): void {
  const a = seatAnchor(seat);
  push('fx-shield', a, 780, '', -58, -58);
  push('fx-shield-word', a, 950, '护');
}

/** 生机涟漪（灵丹 / 回寿）：青绿光晕 + 「回春」 */
export function healGlow(seat: number): void {
  const a = seatAnchor(seat);
  push('fx-heal', a, 900, '', -48, -48);
  push('fx-heal-word', a, 1050, '回春');
}

/** 五行判定翻牌：♠水 ♥火 ♣木 ♦金；红=道心澄明、黑=心魔滋生 */
export function judgeFlip(seat: number, card: Card): void {
  const a = seatAnchor(seat);
  const red = card.suit === '♥' || card.suit === '♦';
  const elem = card.suit === '♥' ? '火' : card.suit === '♠' ? '水' : card.suit === '♣' ? '木' : '金';
  push(
    `fx-judge ${red ? 'is-red' : 'is-black'}`,
    a,
    1050,
    `<span class="fj-suit">${card.suit}</span><span class="fj-num">${card.num}</span><span class="fj-name">${card.name}</span><span class="fj-elem">${elem}</span>`,
    -34,
    -52,
  );
}

/** 摸牌：牌堆飞向座位 */
export function drawFly(seat: number, n: number): void {
  if (sim()) return;
  const l = layer();
  if (!l) return;
  const pile = document.querySelector<HTMLElement>('.pile-stack');
  const from: Point = pile
    ? (() => {
        const r = pile.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()
    : { x: viewW() / 2, y: viewH() * 0.42 };
  const to = seatAnchor(seat);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  for (let i = 0; i < Math.min(n, 4); i++) {
    const e = document.createElement('div');
    e.className = 'fx-fly fx-fly-draw';
    e.style.left = `${from.x - 16}px`;
    e.style.top = `${from.y - 22}px`;
    l.appendChild(e);
    e.animate(
      [
        { transform: 'translate(0,0) scale(.6) rotate(-10deg)', opacity: 0 },
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, offset: 0.2 },
        { transform: `translate(${dx}px,${dy}px) scale(.45) rotate(200deg)`, opacity: 0.1 },
      ],
      { duration: 560, delay: i * 90, easing: 'cubic-bezier(.45,.05,.65,.95)', fill: 'forwards' },
    );
    setTimeout(() => e.remove(), 640 + i * 90);
  }
}

/** 弃牌：座位飞向弃牌堆 */
export function discardFly(seat: number): void {
  if (sim()) return;
  const l = layer();
  if (!l) return;
  const from = seatAnchor(seat);
  const piles = document.querySelectorAll<HTMLElement>('.pile-stack');
  const last = piles[piles.length - 1];
  const to: Point = last
    ? (() => {
        const r = last.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()
    : { x: viewW() - 80, y: viewH() * 0.45 };
  const e = document.createElement('div');
  e.className = 'fx-fly fx-fly-discard';
  e.style.left = `${from.x - 16}px`;
  e.style.top = `${from.y - 22}px`;
  l.appendChild(e);
  e.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(.4) rotate(-180deg)`, opacity: 0.12 },
    ],
    { duration: 460, easing: 'ease-in', fill: 'forwards' },
  );
  setTimeout(() => e.remove(), 520);
}

/** 法术涟漪（主动技 / 秘术） */
export function skillRipple(seat: number, color = '#b57fff'): void {
  const a = seatAnchor(seat);
  const d = push('fx-ripple', a, 920, '', -76, -76);
  if (d) d.style.setProperty('--fx-color', color);
}

/** 符箓展开：符纸 + 旋转阵纹 */
export function trickCast(seat: number, name: string, color = '#b57fff'): void {
  const a = seatAnchor(seat);
  push(
    'fx-trick',
    a,
    1040,
    `<span class="ft-ring" style="border-color:${color}"></span>` +
      `<span class="ft-card" style="border-color:${color}"><b>符</b><i>${name}</i></span>`,
  );
}

/** 阵法冲击波（群攻）：自施法者扩散 + 各目标依次震颤 */
export function aoeWave(fromSeat: number, targets: number[], color = '#e74c3c'): void {
  if (sim()) return;
  const l = layer();
  if (!l) return;
  const from = seatAnchor(fromSeat);
  const w = document.createElement('div');
  w.className = 'fx-aoe';
  w.style.left = `${from.x}px`;
  w.style.top = `${from.y}px`;
  w.style.setProperty('--fx-color', color);
  l.appendChild(w);
  w.animate(
    [
      { transform: 'translate(-50%,-50%) scale(.1)', opacity: 0.9 },
      { transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0 },
    ],
    { duration: 700, easing: 'ease-out', fill: 'forwards' },
  );
  setTimeout(() => w.remove(), 740);
  targets.forEach((s, i) => setTimeout(() => hitShake(s), 120 + i * 90));
}

/** 境界突破：金光柱 + 旋转光轮 + 「破境」 */
export function breakthroughPillar(seat: number): void {
  const a = seatAnchor(seat);
  push(
    'fx-pillar',
    a,
    1500,
    '<span class="fp-beam"></span><span class="fp-rays"></span><span class="fp-word">破境</span>',
    -90,
    -130,
  );
}

/** 悟道结果：金光明澈 / 灰雾心魔 */
export function wudaoGlow(seat: number, ok: boolean): void {
  const a = seatAnchor(seat);
  push(ok ? 'fx-wudao' : 'fx-xinmo', a, 1200, '', -62, -62);
  push(ok ? 'fx-wudao-word' : 'fx-xinmo-word', a, 1250, ok ? '道心澄明' : '心魔滋生', 0, -46);
}

/** 心头锁（契约成立）：锁扣落下 + 微光 */
export function heartLock(seat: number): void {
  push('fx-lock', seatAnchor(seat), 1300, '🔒', 0, -12);
}

/** 元神离体（陨落）：灰雾 + 身份揭示 */
export function deathFx(seat: number, roleText: string): void {
  const a = seatAnchor(seat);
  push(
    'fx-death',
    a,
    1600,
    `<span class="fd-title">陨落</span>` + (roleText ? `<span class="fd-role">${roleText}</span>` : ''),
    -84,
    -42,
  );
}

/** 装备入槽 */
export function equipFx(seat: number, name: string): void {
  push('fx-equip', seatAnchor(seat), 900, name);
}

/** 出牌区：把刚打出的牌浮现在牌桌中央（最多 4 张，2.2s 后淡出） */
export function playCardFx(seat: number, card: Card, ownerName: string): void {
  const zone = document.getElementById('playZoneCards');
  if (!zone || sim()) return;
  zone.querySelector('.play-zone-empty')?.remove();
  const isRed = card.suit === '♥' || card.suit === '♦';
  const tag = card.type === 'fu' ? 'trick' : card.type === 'faqi' ? 'equip' : isRed ? 'red' : '';
  const at = seatAnchor(seat);
  const e = document.createElement('div');
  e.className = `play-card ${tag}`;
  const faction = at.el?.style.getPropertyValue('--faction-color') ?? '';
  if (faction) e.style.borderColor = faction;
  e.innerHTML =
    `<span class="pcsuit">${card.suit}</span>` +
    `<span class="pcnum">${card.num}</span>` +
    `<span class="pcname">${escapeHtml(card.name)}</span>` +
    `<span class="pcowner">${escapeHtml(ownerName)}</span>`;
  while (zone.querySelectorAll('.play-card').length >= 4) zone.querySelector('.play-card')?.remove();
  zone.appendChild(e);
  setTimeout(() => {
    e.classList.add('fade-out');
    setTimeout(() => {
      e.remove();
      if (!zone.querySelectorAll('.play-card').length) {
        zone.innerHTML = '<div class="play-zone-label">出 牌 区</div><span class="play-zone-empty">— 牌桌中央 —</span>';
      }
    }, 420);
  }, 2200);
}

/** 全屏闪光（雷劫 / 大招） */
export function screenFlash(color = 'rgba(255,255,255,.35)'): void {
  const l = layer();
  if (!l || sim()) return;
  const d = document.createElement('div');
  d.className = 'fx-flash';
  d.style.background = `radial-gradient(circle at 50% 42%, ${color}, transparent 70%)`;
  l.appendChild(d);
  setTimeout(() => d.remove(), 540);
}

/** 结算横幅（胜 / 负） */
export function resultBanner(text: string, win: boolean): void {
  const l = layer();
  if (!l || sim()) return;
  const el = document.createElement('div');
  el.className = `fx-banner ${win ? 'win' : 'lose'}`;
  el.innerHTML = `<span class="fb-icon">${win ? '🏆' : '💤'}</span><span class="fb-text">${text}</span>`;
  l.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

/** 胜利个性动画：正道金光 / 外道血焰 / 隐匿紫雾 / 败北灰碎片 */
export function victoryFx(kind: 'zhengdao' | 'waidao' | 'yinni' | 'lose', mountId = 'fxLayer'): void {
  const l = document.getElementById(mountId) ?? layer();
  if (!l || sim()) return;
  const wrap = document.createElement('div');
  wrap.className = `fx-vic fx-vic-${kind}`;
  if (kind === 'zhengdao')
    wrap.innerHTML = '<span class="fv-beam"></span><span class="fv-rays"></span><span class="fv-icon">☯</span><span class="fv-word">正道昌明</span>';
  else if (kind === 'waidao')
    wrap.innerHTML = '<span class="fv-boom b1"></span><span class="fv-boom b2"></span><span class="fv-icon">🔥</span><span class="fv-word">邪焰滔天</span>';
  else if (kind === 'yinni')
    wrap.innerHTML = '<span class="fv-smoke"></span><span class="fv-icon">🦊</span><span class="fv-word">渔翁得利</span>';
  else
    wrap.innerHTML = '<span class="fv-shard s1"></span><span class="fv-shard s2"></span><span class="fv-shard s3"></span><span class="fv-icon">💔</span><span class="fv-word">道消身陨</span>';
  l.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4200);
}

/* ==================== 兼容旧接口（保留语义，逐步由新特效替代） ==================== */

/** 水墨晕染 */
export function inkBurst(target: HTMLElement | null, color = 'rgba(63,182,168,.55)'): void {
  const a = elAnchor(target);
  const d = push('fx-ink', a, 720);
  if (d) d.style.setProperty('--fx-color', color);
}

/** 鎏金护体 */
export function goldGuard(target: HTMLElement | null): void {
  push('fx-gold', elAnchor(target), 820);
}

/** 灵光崩散（伴兽溃散） */
export function spiritShatter(target: HTMLElement | null): void {
  if (sim()) return;
  const a = elAnchor(target);
  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI * 2 * i) / 8;
    const d = push('fx-particle', a, 940);
    if (d) {
      d.style.setProperty('--dx', `${Math.cos(ang) * 44}px`);
      d.style.setProperty('--dy', `${Math.sin(ang) * 44}px`);
    }
  }
}

/** 突破金光（旧接口 → 复用破境光柱） */
export function breakthroughGlow(target: HTMLElement | null): void {
  const a = elAnchor(target);
  push('fx-breakthrough', a, 1120);
}

/** 凉风扫过（灵魂契约成立）：青白流光横贯两点 */
export function coolBreeze(a: HTMLElement | null, b: HTMLElement | null): void {
  if (sim() || !a || !b) return;
  if (typeof a.getBoundingClientRect !== 'function' || typeof b.getBoundingClientRect !== 'function') return;
  const l = layer();
  if (!l) return;
  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  const x1 = ra.left + ra.width / 2;
  const y1 = ra.top + ra.height / 2;
  const x2 = rb.left + rb.width / 2;
  const y2 = rb.top + rb.height / 2;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const d = document.createElement('div');
  d.className = 'fx-breeze';
  d.style.left = `${x1}px`;
  d.style.top = `${y1}px`;
  d.style.width = `${len}px`;
  d.style.transform = `rotate(${ang}deg)`;
  l.appendChild(d);
  setTimeout(() => d.remove(), 1000);
}

/** 尖头鬼影（灵魂反噬） */
export function ghostShadow(target: HTMLElement | null): void {
  push('fx-ghost', elAnchor(target), 1250, '👻');
}

/** 飘字（修为 / 道心 / 灵地） */
export function floatText(target: HTMLElement | null, text: string, color = '#3FB6A8'): void {
  const a = elAnchor(target);
  const d = push('fx-float', a, 1050, '', 0, -24);
  if (d) {
    d.textContent = text;
    d.style.color = color;
  }
}

/** 震屏轻颤 */
export function shake(): void {
  if (sim()) return;
  const el = document.getElementById('screenGame');
  if (!el) return;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 320);
}
