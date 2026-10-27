/* ==================== 结算 ====================
 * 展示：胜负横幅、身份揭晓、灵魂契约履行情况、阵营功勋、境界达成与灵地占据。
 */
import { escapeHtml } from '../core/dom';
import { G } from '../game/state';
import { show } from './modals';
import { charOf } from '../data/characters';
import { realmLabel } from '../data/realms';
import { highestLingdiTier } from '../data/lingdi';
import { campName } from '../data/camps';
import { ROLE_MAP } from '../data/roles';
import { resultBanner, victoryFx } from '../core/fx';

/** 结算特效只播一次（render 会多次调用 renderSettle） */
let fxSettle: unknown = null;

export function renderSettle(): void {
  const s = G.settle;
  if (!s) return;
  const title = document.getElementById('settleTitle');
  const body = document.getElementById('settleBody');
  if (title) title.textContent = s.title;
  if (!body) return;

  const winnerNames = s.winners
    .map((w) => G.players.find((p) => p.seat === w)?.name ?? `#${w}`)
    .join('、');

  const rows = G.players
    .map((p) => {
      const c = charOf(p.charId);
      const tier = highestLingdiTier(p.lingdi);
      return `<div class="st-row ${p.alive ? '' : 'st-dead'}">
        <span class="st-seat">#${p.seat}</span>
        <span class="st-name">${escapeHtml(p.name)}</span>
        <span class="st-char">${escapeHtml(c?.name ?? '')}</span>
        <span class="st-camp">${escapeHtml(campName(p.camp))}</span>
        <span class="st-realm">${escapeHtml(realmLabel(p.realm, p.realmStage))}</span>
        <span class="st-lingdi">${tier ? `灵地 ${tier} 阶` : '—'}</span>
        <span class="st-hp">寿 ${p.hp}/${p.maxHp}</span>
        <span class="st-win">${s.winners.includes(p.seat) ? '胜' : ''}</span>
      </div>`;
    })
    .join('');

  body.innerHTML = `
    <div class="st-winner">🏆 ${escapeHtml(winnerNames || '无人')}</div>
    ${s.campHonor.length ? `<div class="st-honor">阵营功勋：${s.campHonor.map((c) => escapeHtml(campName(c))).join('、')}</div>` : ''}
    <div class="st-lines">${s.lines.map((l) => `<div class="st-line">${escapeHtml(l)}</div>`).join('')}</div>
    <div class="st-table">${rows}</div>`;
  show('settleModal', true);

  if (fxSettle !== s) {
    fxSettle = s;
    const me = G.players.find((p) => !p.ai);
    const win = !!me && s.winners.includes(me.seat);
    resultBanner(s.title, win);
    if (win && me) {
      const side = ROLE_MAP[me.role]?.side;
      victoryFx(side === 'waidao' ? 'waidao' : side === 'yinni' ? 'yinni' : 'zhengdao');
    } else {
      victoryFx('lose');
    }
  }
}

export function closeSettle(): void {
  show('settleModal', false);
  fxSettle = null;
}
