/* ==================== 灵魂契约 ====================
 * docs 出处：docs/md/设定/灵魂契约.md
 *   天地法则级契约体系；监督者公正鬼（自称「公正之鬼」）
 *   签订：以真名录于羊皮纸；生效感应「凉风扫过」；束缚称「心头锁」
 *   违约：契约鬼以尖头鬼影现于违约者印堂之上，遭灵魂反噬
 *
 * ⚠ 平衡标定（唯一偏离 docs 处）：
 *   docs 反噬「当场取命，无法抵抗」若照搬将使契约不可背叛、博弈性消失。
 *   故 SOUL_BACKLASH_LETHAL=false 默认重创；公正鬼在场（监督者）时升格为致命。
 */
import type { Player, ContractState } from '../core/types';
import { G } from './state';
import { addLog } from './log';
import { CONTRACT_MAP, SOUL_BACKLASH_LETHAL } from '../data/contracts';
import { coolBreeze, heartLock, ghostShadow } from '../core/fx';
import { sfx } from '../core/sound';
import { roleDef } from '../data/roles';

let CID = 1;

/** 公正鬼是否在场（契约监督者） */
export function hasGongzhenggui(): boolean {
  return G.players.some((p) => p.alive && p.role === 'gongzhenggui');
}

/** 公正鬼监督：加重背盟代价 + 看破隐匿身份 */
export function gongzhengguiOversees(): { heavierBacklash: boolean; seeThrough: boolean } {
  const on = hasGongzhenggui();
  return { heavierBacklash: on, seeThrough: on };
}

export function canSign(a: Player, b: Player): { ok: boolean; reason?: string } {
  if (!a.alive || !b.alive) return { ok: false, reason: '目标已陨落' };
  if (a.seat === b.seat) return { ok: false, reason: '不能与自己立约' };
  const existing = a.contracts.find(
    (c) => !c.broken && c.parties.includes(b.seat),
  );
  if (existing) return { ok: false, reason: '已与该角色立约' };
  return { ok: true };
}

/**
 * 立约：双方以真名录于羊皮纸，成立时感应「凉风扫过」，带「心头锁」标记。
 * 立约须留真名 → 对方掌握你的真名（暴露阵营/势力信息）。
 */
export function signContract(a: Player, b: Player, defId: string): ContractState | null {
  const def = CONTRACT_MAP[defId];
  if (!def) return null;
  const chk = canSign(a, b);
  if (!chk.ok) return null;

  // 约书价值不菲：支付代价
  if (def.cost.hand) {
    for (let i = 0; i < def.cost.hand; i++) {
      if (a.hand.length === 0) return null;
      a.hand.pop();
    }
  }
  if (def.cost.lingli) {
    if (a.lingli < def.cost.lingli) return null;
    a.lingli -= def.cost.lingli;
  }

  const expire = def.duration === 'forever' ? -1 : G.turn + def.duration;
  const c: ContractState = {
    id: `c${CID++}`,
    defId,
    parties: [a.seat, b.seat],
    signedTurn: G.turn,
    expireTurn: expire,
    broken: false,
  };
  a.contracts.push({ ...c });
  b.contracts.push({ ...c });

  // 心头锁：契约束缚标记
  a.heartLock = true;
  b.heartLock = true;
  // 真名暴露
  if (!b.trueNameKnown.includes(a.seat)) b.trueNameKnown.push(a.seat);
  if (!a.trueNameKnown.includes(b.seat)) a.trueNameKnown.push(b.seat);

  addLog(
    `${a.name} 与 ${b.name} 以真名录于羊皮纸，立【${def.name}】；凉风扫过，心头锁成。`,
    'contract',
  );
  // 视觉：凉风扫过（青白流光横贯双方）+ 心头锁落下
  sfx('contract');
  coolBreeze(document.getElementById(`seat-${a.seat}`), document.getElementById(`seat-${b.seat}`));
  heartLock(a.seat);
  heartLock(b.seat);
  return c;
}

/**
 * 背盟 → 灵魂反噬：契约鬼以尖头鬼影现于违约者印堂之上。
 * 全部反噬结算集中于此单一函数，不得散落。
 */
export function breakContract(contractId: string, breaker: Player): void {
  const c = breaker.contracts.find((x) => x.id === contractId && !x.broken);
  if (!c) return;
  const def = CONTRACT_MAP[c.defId];
  if (!def) return;

  c.broken = true;
  c.brokenBy = breaker.seat;

  // 同步对方契约状态
  for (const seat of c.parties) {
    const p = G.players.find((x) => x.seat === seat);
    if (!p) continue;
    const pc = p.contracts.find((x) => x.id === contractId);
    if (pc) {
      pc.broken = true;
      pc.brokenBy = breaker.seat;
    }
  }

  // 视觉：契约鬼以尖头鬼影现于违约者印堂之上
  sfx('backlash');
  ghostShadow(document.getElementById(`seat-${breaker.seat}`));

  const oversees = gongzhengguiOversees();
  const lethal = SOUL_BACKLASH_LETHAL || oversees.heavierBacklash;
  const amount = def.backlash + (oversees.heavierBacklash ? 1 : 0);

  addLog(
    `${breaker.name} 背弃【${def.name}】！印堂之上尖头鬼影浮现——灵魂反噬${
      oversees.heavierBacklash ? '（公正鬼监督，反噬加重）' : ''
    }。`,
    'backlash',
  );

  // 道心清零（道心失守）
  breaker.daoxin = 0;
  // 弃手牌
  if (breaker.hand.length > 0) {
    const drop = Math.min(2, breaker.hand.length);
    breaker.hand.splice(0, drop);
  }

  if (lethal) {
    // 公正鬼在场：忠实 docs「当场取命」
    breaker.hp = 0;
    breaker.alive = false;
    addLog(`${breaker.name} 寿元耗尽，陨落。`, 'backlash');
  } else {
    // 默认重创（平衡标定）
    breaker.hp = Math.max(1, breaker.hp - amount);
  }
}

/** 清理过期的契约 */
export function expireContracts(p: Player): void {
  p.contracts = p.contracts.filter((c) => c.expireTurn === -1 || c.expireTurn > G.turn);
  if (!p.contracts.some((c) => !c.broken)) p.heartLock = false;
}

/** 公正鬼胜利判定用：全场是否存在未被背盟破坏的契约 */
export function anyContractIntact(): boolean {
  return G.players.some((p) => p.contracts.some((c) => !c.broken));
}

/** 契约履行情况（结算展示） */
export function contractSummary(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of G.players) {
    for (const c of p.contracts) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      const def = CONTRACT_MAP[c.defId];
      const names = c.parties
        .map((s) => G.players.find((x) => x.seat === s)?.name ?? `#${s}`)
        .join(' 与 ');
      out.push(
        `【${def?.name ?? c.defId}】${names} —— ${c.broken ? '已背盟（灵魂反噬）' : '履约完好'}`,
      );
    }
  }
  return out;
}

/** 某角色是否为公正鬼（UI 与 AI 用） */
export function isGongzhenggui(p: Player): boolean {
  const r = roleDef(p.role);
  return r?.id === 'gongzhenggui';
}
