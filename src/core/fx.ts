/* ==================== 动效层（DOM 动画，无依赖） ====================
 * 仙侠水墨：水墨晕染 / 鎏金护体 / 灵光崩散 / 突破金光 / 凉风扫过 / 尖头鬼影
 */
import { isSim } from './dom';

function layer(): HTMLElement | null {
  return document.getElementById('fxLayer');
}

function push(el: HTMLElement, life: number): void {
  const l = layer();
  if (!l) return;
  l.appendChild(el);
  if (isSim()) {
    el.remove();
    return;
  }
  setTimeout(() => el.remove(), life);
}

/** 水墨晕染：在目标元素中心扩散一团墨色圆 */
export function inkBurst(target: HTMLElement | null, color = 'rgba(63,182,168,.55)'): void {
  if (!target) return;
  const r = target.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'fx-ink';
  d.style.left = `${r.left + r.width / 2}px`;
  d.style.top = `${r.top + r.height / 2}px`;
  d.style.setProperty('--fx-color', color);
  push(d, 700);
}

/** 鎏金护体：目标外圈金色光环闪动 */
export function goldGuard(target: HTMLElement | null): void {
  if (!target) return;
  const r = target.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'fx-gold';
  d.style.left = `${r.left + r.width / 2}px`;
  d.style.top = `${r.top + r.height / 2}px`;
  push(d, 800);
}

/** 灵光崩散（伴兽溃散） */
export function spiritShatter(target: HTMLElement | null): void {
  if (!target) return;
  const r = target.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'fx-particle';
    p.style.left = `${r.left + r.width / 2}px`;
    p.style.top = `${r.top + r.height / 2}px`;
    const ang = (Math.PI * 2 * i) / 8;
    p.style.setProperty('--dx', `${Math.cos(ang) * 40}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * 40}px`);
    push(p, 900);
  }
}

/** 突破金光（境界突破） */
export function breakthroughGlow(target: HTMLElement | null): void {
  if (!target) return;
  const r = target.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'fx-breakthrough';
  d.style.left = `${r.left + r.width / 2}px`;
  d.style.top = `${r.top + r.height / 2}px`;
  push(d, 1100);
}

/** 凉风扫过（灵魂契约成立）：一道青白流光横贯两点 */
export function coolBreeze(a: HTMLElement | null, b: HTMLElement | null): void {
  if (!a || !b) return;
  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'fx-breeze';
  const x1 = ra.left + ra.width / 2;
  const y1 = ra.top + ra.height / 2;
  const x2 = rb.left + rb.width / 2;
  const y2 = rb.top + rb.height / 2;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  d.style.left = `${x1}px`;
  d.style.top = `${y1}px`;
  d.style.width = `${len}px`;
  d.style.transform = `rotate(${ang}deg)`;
  push(d, 1000);
}

/** 尖头鬼影（灵魂反噬）：自印堂（头像上方）浮现 */
export function ghostShadow(target: HTMLElement | null): void {
  if (!target) return;
  const r = target.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'fx-ghost';
  d.textContent = '👻';
  d.style.left = `${r.left + r.width / 2}px`;
  d.style.top = `${r.top + r.height * 0.22}px`;
  push(d, 1200);
}

/** 飘字（修为/道心变化） */
export function floatText(target: HTMLElement | null, text: string, color = '#3FB6A8'): void {
  if (!target) return;
  const r = target.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'fx-float';
  d.textContent = text;
  d.style.left = `${r.left + r.width / 2}px`;
  d.style.top = `${r.top}px`;
  d.style.color = color;
  push(d, 1000);
}

/** 震屏轻颤 */
export function shake(): void {
  if (isSim()) return;
  const el = document.getElementById('screenGame');
  if (!el) return;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 320);
}
