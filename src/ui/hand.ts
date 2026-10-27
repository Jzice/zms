/* ==================== 手牌区 / 行动条 ====================
 * 手牌扇形排布，类型配色；【悟道】卡条件不足时置灰并提示缺失项。
 */
import type { Player, Card } from '../core/types';
import { G } from '../game/state';
import { escapeHtml } from '../core/dom';
import { subLabel, subColor } from '../data/cardCatalog';
import { canUseWudao } from '../game/wudao';
import { playCard, needDiscard, breakthroughHint, closeDoor } from '../game/actions';
import { canBreakthrough } from '../game/realm';
import { endHumanTurn } from '../game/loop';
import { activeSkillsOf, canUseSkill } from '../game/skillEngine';
import { useSkill } from '../game/skillEngine';
import { render } from './render';
import { sfx } from '../core/sound';

/** 本地玩家（非 AI） */
export function localPlayer(): Player | undefined {
  return G.players.find((p) => !p.ai) ?? G.players[0];
}

let selectedCard: number | null = null;

export function selectCard(cardId: number): void {
  selectedCard = selectedCard === cardId ? null : cardId;
  sfx('click');
  render();
}

export function selectedCardId(): number | null {
  return selectedCard;
}

export function renderHand(): void {
  const el = document.getElementById('handRow');
  if (!el) return;
  const p = localPlayer();
  if (!p) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = p.hand.map((c) => cardHtml(p, c)).join('');
}

function cardHtml(p: Player, c: Card): string {
  const isWudao = c.sub === 'wudao';
  let disabled = false;
  let tip = c.desc ?? '';
  if (isWudao) {
    const chk = canUseWudao(p);
    disabled = !chk.ok;
    if (disabled) tip = `无法打出：${chk.reasons.join('、')}`;
  }
  const sel = selectedCard === c.id;
  return `
  <div class="card ${sel ? 'card-sel' : ''} ${disabled ? 'card-disabled' : ''}"
       style="--c:${subColor(c.sub)}" title="${escapeHtml(tip)}"
       onclick="selectCard(${c.id})">
    <div class="card-name">${escapeHtml(c.name)}</div>
    <div class="card-sub">${escapeHtml(subLabel(c.sub))}</div>
  </div>`;
}

export function renderActionBtns(): void {
  const el = document.getElementById('actionBtns');
  if (!el) return;
  const p = localPlayer();
  if (!p || G.over) {
    el.innerHTML = '';
    return;
  }
  const isMyTurn = G.current === p.seat && G.phase === 'play';
  const parts: string[] = [];

  if (isMyTurn) {
    parts.push(`<button class="btn btn-accent" onclick="confirmPlay()">出牌</button>`);
    parts.push(`<button class="btn" onclick="doWudao()">悟道</button>`);
    parts.push(`<button class="btn" onclick="doCloseDoor()">闭关</button>`);
    parts.push(`<button class="btn" onclick="signContractUI()">立约</button>`);
    // 主动技
    for (const sk of activeSkillsOf(p)) {
      const ok = canUseSkill(p, sk).ok;
      parts.push(
        `<button class="btn btn-sm ${ok ? '' : 'btn-dis'}" onclick="useSkillUI('${sk}')">技</button>`,
      );
    }
    parts.push(`<button class="btn" onclick="endTurnUI()">结束回合</button>`);
  } else {
    parts.push(`<span class="wait-tip">等待其他修士行动…</span>`);
  }
  el.innerHTML = parts.join('');
}

export function renderActionHint(): void {
  const el = document.getElementById('actionHint');
  if (!el) return;
  const p = localPlayer();
  if (!p) return;
  const msgs: string[] = [];
  if (selectedCard) msgs.push('已选牌，点击座位选目标后「出牌」');
  if (needDiscard(p) > 0) msgs.push(`需弃 ${needDiscard(p)} 张（手牌上限 ${p.hp}）`);
  const chk = canBreakthrough(p);
  msgs.push(chk.ok ? '✦ 可境界突破' : `突破：${breakthroughHint(p)}`);
  el.innerHTML = msgs.map((m) => `<span class="hint-item">${escapeHtml(m)}</span>`).join('');
}

/** 出牌（选中牌 + 选中目标） */
export function confirmPlay(): void {
  const p = localPlayer();
  if (!p || selectedCard === null) return;
  const target = (window as unknown as { __zmsTarget?: number }).__zmsTarget;
  const card = p.hand.find((c) => c.id === selectedCard);
  if (!card) return;
  // 非目标型牌（灵丹/灵药/悟道/法宝/灵地）不需要目标
  const needTarget =
    card.sub === 'shengtong' || card.sub === 'huo' || card.sub === 'lei' || card.type === 'fu';
  const seat = needTarget ? target : undefined;
  if (needTarget && seat === undefined) return;
  const ok = playCard(p, selectedCard, seat);
  if (ok) {
    selectedCard = null;
    sfx('play');
  }
  render();
}

/** 直接悟道（手牌中的悟道卡） */
export function doWudao(): void {
  const p = localPlayer();
  if (!p) return;
  const card = p.hand.find((c) => c.sub === 'wudao');
  if (!card) return;
  playCard(p, card.id);
  render();
}

/** 闭关 */
export function doCloseDoor(): void {
  const p = localPlayer();
  if (!p) return;
  closeDoor(p);
  render();
}

/** 结束回合 */
export function endTurnUI(): void {
  endHumanTurn();
  render();
}

/** 发动主动技 */
export function useSkillUI(skillId: string): void {
  const p = localPlayer();
  if (!p) return;
  const target = (window as unknown as { __zmsTarget?: number }).__zmsTarget;
  useSkill(p, skillId, target);
  render();
}

/** 立约 */
export function signContractUI(): void {
  const p = localPlayer();
  if (!p) return;
  const target = (window as unknown as { __zmsTarget?: number }).__zmsTarget;
  const card = p.hand.find((c) => c.sub === 'linghunqiyue');
  if (!card || target === undefined) return;
  // 默认取第一条契约条款
  playCard(p, card.id, target, 'noattack');
  render();
}
