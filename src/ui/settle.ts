/* ==================== 结算 ====================
 * 对齐 learn_kill：胜利演出（按阵营个性动画）+ 本人名片 + 统计卡 + 战绩表。
 */
import { escapeHtml } from '../core/dom';
import { G } from '../game/state';
import { show } from './modals';
import { charOf } from '../data/characters';
import { realmLabel } from '../data/realms';
import { highestLingdiTier } from '../data/lingdi';
import { campName } from '../data/camps';
import { ROLE_MAP } from '../data/roles';
import { victoryFx } from '../core/fx';
import { sfx } from '../core/sound';

/** 结算特效只播一次（render 会多次调用 renderSettle） */
let fxSettle: unknown = null;

/** 本地玩家视角的胜利阵营 → 个性动画 */
function winnerCamp(win: boolean, side?: string): 'zhengdao' | 'waidao' | 'yinni' | 'lose' {
  if (!win) return 'lose';
  if (side === 'waidao') return 'waidao';
  if (side === 'yinni') return 'yinni';
  return 'zhengdao';
}

function heroSub(camp: 'zhengdao' | 'waidao' | 'yinni' | 'lose'): string {
  switch (camp) {
    case 'zhengdao':
      return '正道昌明，掌门肃清四方';
    case 'waidao':
      return '邪焰滔天，掌门之位易主';
    case 'yinni':
      return '鹬蚌相争，渔翁得利';
    default:
      return '胜败乃兵家常事，再接再厉';
  }
}

export function renderSettle(): void {
  const s = G.settle;
  if (!s) return;
  const title = document.getElementById('settleTitle');
  const body = document.getElementById('settleBody');
  if (title) title.textContent = s.title;
  if (!body) return;

  const me = G.players.find((p) => !p.ai) ?? G.players[0];
  const win = !!me && s.winners.includes(me.seat);
  const side = me ? ROLE_MAP[me.role]?.side : undefined;
  const camp = winnerCamp(win, side);
  const meChar = me ? charOf(me.charId) : undefined;
  const meRole = me ? ROLE_MAP[me.role] : undefined;
  const meTier = me ? highestLingdiTier(me.lingdi) : 0;

  const winnerNames = s.winners
    .map((w) => G.players.find((p) => p.seat === w)?.name ?? `#${w}`)
    .join('、');

  const rows = G.players
    .map((p) => {
      const c = charOf(p.charId);
      const role = ROLE_MAP[p.role];
      const tier = highestLingdiTier(p.lingdi);
      const isMe = me?.seat === p.seat;
      const revealed = p.rolePublic || !p.alive || G.over;
      return `<tr class="${isMe ? 'me' : ''}">
        <td>${c?.avatar ?? '🧙'} ${escapeHtml(p.name)}${isMe ? ' <span class="sd-me">我</span>' : ''}</td>
        <td>${revealed ? escapeHtml(role?.name ?? p.role) : '<span style="color:var(--muted)">？？</span>'}</td>
        <td>${escapeHtml(campName(p.camp))}</td>
        <td>${escapeHtml(realmLabel(p.realm, p.realmStage))}</td>
        <td>${tier ? `${tier} 阶` : '—'}</td>
        <td>${Math.max(0, p.hp)}/${p.maxHp}</td>
        <td>${p.alive ? '<span style="color:#5fe08a">存活</span>' : '<span style="color:#c96">陨落</span>'}</td>
      </tr>`;
    })
    .join('');

  body.innerHTML = `
    <div id="settleHero" class="settle-hero ${camp}">
      <div class="sh-text">
        <div class="sh-title">${win ? '胜利' : '败北'}</div>
        <div class="sh-sub">${escapeHtml(s.title)} · ${escapeHtml(heroSub(camp))}</div>
      </div>
    </div>
    <div class="settle-idcard">
      <span class="si-av">${meChar?.avatar ?? '🧙'}</span>
      <span class="si-main">
        <span class="si-name">${escapeHtml(me?.name ?? '本座')}</span>
        <span class="si-role">${escapeHtml(meRole?.name ?? '')} · ${escapeHtml(me ? campName(me.camp) : '')} · ${escapeHtml(meChar?.name ?? '')}</span>
      </span>
      <span class="si-result ${win ? 'win' : 'lose'}">${win ? '本方获胜' : '本方落败'}</span>
    </div>
    <div class="settle-stats">
      <div class="ss-cell"><b>${me ? `${Math.max(0, me.hp)}/${me.maxHp}` : '—'}</b><span>寿元</span></div>
      <div class="ss-cell"><b>${me ? escapeHtml(realmLabel(me.realm, me.realmStage)) : '—'}</b><span>境界</span></div>
      <div class="ss-cell"><b>${meTier || 0}</b><span>灵地阶位</span></div>
      <div class="ss-cell"><b>${me ? me.contracts.length : 0}</b><span>灵魂契约</span></div>
    </div>
    <div class="settle-score">胜者：${escapeHtml(winnerNames || '无人')}</div>
    ${s.campHonor.length ? `<div class="settle-ach">${s.campHonor.map((c) => `<span class="sd-ach">${escapeHtml(campName(c))} 功勋</span>`).join('')}</div>` : ''}
    <div class="rule-section" style="margin-top:8px"><h4>📜 结算摘要</h4>
      <div class="st-lines">${s.lines.map((l) => `<div class="st-line">${escapeHtml(l)}</div>`).join('')}</div>
    </div>
    <div class="rule-section"><h4>📋 本局战绩</h4>
      <table class="settle-table">
        <thead><tr><th>玩家</th><th>身份</th><th>阵营</th><th>境界</th><th>灵地</th><th>寿元</th><th>状态</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  show('settleModal', true);

  if (fxSettle !== s) {
    fxSettle = s;
    sfx(win ? 'win' : 'lose');
    victoryFx(camp, 'settleHero');
  }
}

export function closeSettle(): void {
  show('settleModal', false);
  fxSettle = null;
}
