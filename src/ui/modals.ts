/* ==================== 弹层：规则 / 诗词感悟 / 灵魂契约 / 图鉴 / 档案 ====================
 * 术语全部取自 docs（见各表出处注释）。
 */
import { escapeHtml } from '../core/dom';
import { BEASTS } from '../data/beasts';
import { ROLE_DEFS, SIDE_NAME } from '../data/roles';
import { CONTRACT_DEFS, SOUL_BACKLASH_LETHAL } from '../data/contracts';
import { loadProfile, levelOf, levelProgress } from '../profile/profile';
import { LINGDI } from '../data/lingdi';
import { G } from '../game/state';

let rulesTab = 'basic';

export function show(id: string, on = true): void {
  const el = document.getElementById(id);
  if (el) el.style.display = on ? 'flex' : 'none';
}

export function openRules(): void {
  renderRules();
  show('rulesModal', true);
}
export function closeRules(): void {
  show('rulesModal', false);
}
export function switchRulesTab(tab: string): void {
  rulesTab = tab;
  document.querySelectorAll('.rule-tab').forEach((b) => {
    b.classList.toggle('active', (b as HTMLElement).dataset.tab === tab);
  });
  renderRules();
}

function renderRules(): void {
  const el = document.getElementById('rulesContent');
  if (!el) return;
  const bodies: Record<string, string> = {
    basic: `
      <p><b>回合流程</b>：判定（天劫 / 七星定身阵）→ 摸牌 2 → 出牌 → 弃牌（上限＝寿元）→ 回合末「闭关」。</p>
      <p><b>寿元</b>即生命（docs：练气寿 120、筑基 200、金丹 500、元婴 2000）。寿元耗尽即陨落，可用<b>灵丹</b>或<b>道心</b>自救。</p>
      <p><b>灵力</b>：由境界派生、回合回复，用于施法与悟道。<b>道心</b>：由悟道判定成功产出，可抵伤（2 抵 1）、当护身、自救、强化技能。</p>
      <p><b>阵营</b>（公开）：人类 / 兽类 / 魔修 / 鬼修，决定联合亲和与对抗加成。</p>
      <p><b>身份</b>（隐藏或公开）：决定个人胜利条件，与阵营构成双轴博弈。</p>`,
    roles: `
      <p>身份池分四方（docs：正道／外道／隐匿／公开高位），房主勾选后按人数自动配比。</p>
      ${['zhengdao', 'waidao', 'yinni', 'gaowei']
        .map((side) => {
          const list = ROLE_DEFS.filter((r) => r.side === side);
          return `<div class="rule-sec"><b>${escapeHtml(SIDE_NAME[side as keyof typeof SIDE_NAME])}</b>
            ${list.map((r) => `<div class="rule-row"><b>${escapeHtml(r.name)}</b>（${r.public ? '公开' : '隐藏'}）：${escapeHtml(r.desc)}</div>`).join('')}
          </div>`;
        })
        .join('')}
      <p class="rule-note">人数配比：外道 = floor((N−1)/2)、正道 = ceil((N−1)/4)、隐匿 = 余数（下限 1）。</p>`,
    cards: `
      <p><b>基本牌</b>：神通（含火系 / 雷系）、护身、灵丹、灵药、悟道。</p>
      <p><b>符篆类</b>：符篆（主类）＋ 阵法／法阵 ＋ 秘术 ＋ 灵魂契约。卡名取自 docs 技能目录，如储物袋、破阵符、万剑钻心、十方风火归元大阵、三木回心阵、命隐符、七星定身阵、天劫。</p>
      <p><b>法宝四槽</b>：本命法宝／法器（攻击距离）、护身（防具）、飞梭／灵舟（距离修正）、秘宝／重宝。</p>
      <p><b>判定</b>：天劫（延时伤害）、七星定身阵（持续锁定气机，跳过出牌）。</p>`,
    contract: `
      <p><b>灵魂契约</b>（docs/md/设定/灵魂契约.md）：本界天地法则级契约体系，监督者为<b>公正鬼</b>。</p>
      <p>签订：以<b>真名</b>录于<b>羊皮纸</b>；成立时灵魂感应「<b>凉风扫过</b>」；束缚称「<b>心头锁</b>」。</p>
      <p>违约：契约鬼以<b>尖头鬼影</b>现于违约者<b>印堂</b>之上，遭<b>灵魂反噬</b>。</p>
      <p class="rule-note">⚠ 平衡标定：docs 原文反噬「当场取命，无法抵抗」。为保留博弈性，默认设为重创（SOUL_BACKLASH_LETHAL = ${SOUL_BACKLASH_LETHAL}）；<b>公正鬼在场时升格为致命</b>，忠实其监督者职能。</p>
      ${CONTRACT_DEFS.map((c) => `<div class="rule-row"><b>${escapeHtml(c.name)}</b>：${escapeHtml(c.desc)}</div>`).join('')}`,
    realm: `
      <p><b>境界</b>（docs 修行体系）：练气 → 筑基 → 金丹 → 元婴 → 化神，每境分初期／中期／后期／大圆满，共 20 层。</p>
      <p><b>修为</b>三途径：悟道（主）、闭关（弃手牌换修为）、感悟（被动）。</p>
      <p><b>境界突破</b>须同时满足<b>修为阈值</b>与<b>灵地阶位门槛</b>：筑基一阶、金丹三阶、元婴五阶、化神七阶。灵地不足时提示所需阶位。</p>
      <p><b>灵根纯度</b>（docs 本命.md）：单灵根修为获取最速，双灵根基准，三灵根及以上最慢且失败时有心魔反噬。</p>
      <p><b>灵地名录</b>：${LINGDI.map((l) => `${escapeHtml(l.name)}（${l.tier} 阶）`).join('、')}</p>`,
  };
  el.innerHTML = bodies[rulesTab] ?? bodies.basic;
}

/* ---------------- 诗词感悟 / 悟道弹层 ---------------- */

export function showVerse(opts: {
  title: string;
  text: string;
  source: string;
  extra?: string;
}): void {
  const t = document.getElementById('verseTitle');
  const b = document.getElementById('verseBody');
  if (t) t.textContent = opts.title;
  if (b) {
    b.innerHTML = `
      <div class="verse-text">${escapeHtml(opts.text)}</div>
      <div class="verse-source">—— ${escapeHtml(opts.source)}</div>
      ${opts.extra ? `<div class="verse-extra">${escapeHtml(opts.extra)}</div>` : ''}`;
  }
  show('verseModal', true);
}
export function closeVerse(): void {
  show('verseModal', false);
}

/* ---------------- 灵魂契约弹层 ---------------- */

export function showContractModal(text: string): void {
  const b = document.getElementById('contractBody');
  if (b) b.innerHTML = `<div class="contract-text">${escapeHtml(text)}</div>`;
  show('contractModal', true);
}
export function closeContractModal(): void {
  show('contractModal', false);
}

/* ---------------- 灵兽图鉴 ---------------- */

export function openCodex(): void {
  const b = document.getElementById('codexBody');
  if (b) {
    b.innerHTML = `<div class="codex-grid">${BEASTS.map(
      (x) => `<div class="codex-card">
        <div class="cx-av">${x.avatar}</div>
        <div class="cx-name">${escapeHtml(x.name)}</div>
        <div class="cx-tier">${escapeHtml(x.tier)} ｜ 寿 ${x.hp}</div>
        <div class="cx-desc">${escapeHtml(x.desc)}</div>
        ${x.passive ? `<div class="cx-p">被动【${escapeHtml(x.passive.name)}】${escapeHtml(x.passive.desc)}</div>` : ''}
        ${x.active ? `<div class="cx-a">主动【${escapeHtml(x.active.name)}】${escapeHtml(x.active.desc)}</div>` : ''}
      </div>`,
    ).join('')}</div>`;
  }
  show('codexModal', true);
}
export function closeCodex(): void {
  show('codexModal', false);
}

/* ---------------- 档案 ---------------- */

export function openProfile(): void {
  const p = loadProfile();
  const b = document.getElementById('profileBody');
  if (b) {
    b.innerHTML = `
      <div class="pf-head">${p.avatar} ${escapeHtml(p.name)}</div>
      <div class="pf-row">段位：<b>${levelOf(p.score)}</b> ｜ 积分：<b>${p.score}</b></div>
      <div class="pf-bar"><span style="width:${levelProgress(p.score)}%"></span></div>
      <div class="pf-row">对局 ${p.games} 场 ｜ 胜 ${p.wins} 场</div>
      <div class="pf-row">分阵营胜场：${Object.entries(p.campWins).map(([k, v]) => `${escapeHtml(k)} ${v}`).join('、') || '—'}</div>
      <div class="pf-row">分势力胜场：${Object.entries(p.powerWins).map(([k, v]) => `${escapeHtml(k)} ${v}`).join('、') || '—'}</div>`;
  }
  show('profileModal', true);
}
export function closeProfile(): void {
  show('profileModal', false);
}

/* ---------------- 标记 ---------------- */

export function openMarkMenu(seat: number): void {
  const t = document.getElementById('markTargetName');
  const o = document.getElementById('markOptions');
  const p = G.players.find((x) => x.seat === seat);
  if (t) t.textContent = p?.name ?? `#${seat}`;
  if (o) {
    o.innerHTML = ROLE_DEFS.map(
      (r) => `<button class="mark-btn" onclick="setRoleMarkUI(${seat},'${r.id}')">${escapeHtml(r.name)}</button>`,
    ).join('');
  }
  show('markModal', true);
}
export function closeMarkMenu(): void {
  show('markModal', false);
}
