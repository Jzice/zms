/* ==================== 身份池配置器与胜负结算 ====================
 * 身份由 RoleDef.goal 分类统一结算，避免为每种身份写分支。
 * 人数自适应配比：外道 = floor((N-1)/2)、正道 = ceil((N-1)/4)、隐匿 = 余数（下限 1）。
 * 公开高位方为可选替换项（势力称雄变体）。
 */
import type { Player, Camp } from '../core/types';
import { G } from './state';
import { ROLE_DEFS, ROLE_MAP, defaultEnabledRoles } from '../data/roles';
import { anyContractIntact } from './contract';

/** 按人数计算四方配比（掌门 1 + 正道 + 外道 + 隐匿 = N） */
export function roleQuota(n: number): { master: number; zhengdao: number; waidao: number; yinni: number } {
  const rest = Math.max(0, n - 1);
  let waidao = Math.floor(rest / 2);
  let zhengdao = Math.ceil(rest / 4);
  let yinni = rest - waidao - zhengdao;
  if (yinni < 1) {
    yinni = 1;
    const over = rest - waidao - zhengdao; // 负数
    // 从正道让出名额；正道不足则从外道让
    if (zhengdao > 0) zhengdao = Math.max(0, zhengdao + over);
    else waidao = Math.max(0, waidao + over);
  }
  return { master: n > 0 ? 1 : 0, zhengdao, waidao, yinni };
}

function pick(ids: string[]): string | undefined {
  if (!ids.length) return undefined;
  // 按权重抽签
  const pool: string[] = [];
  for (const id of ids) {
    const d = ROLE_MAP[id];
    if (!d) continue;
    const w = Math.max(1, d.weight);
    for (let i = 0; i < w; i++) pool.push(id);
  }
  if (!pool.length) return ids[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 生成身份表（长度 = count）。
 * enabled 为空时回退到默认启用子集。
 */
export function composeRoles(count: number, enabled: string[] = []): string[] {
  let set = enabled.length ? enabled : defaultEnabledRoles();
  // 掌门必备
  if (!set.includes('master')) set = ['master', ...set];
  const q = roleQuota(count);
  const byside = (side: string) =>
    ROLE_DEFS.filter((r) => r.side === side && set.includes(r.id)).map((r) => r.id);

  const out: string[] = [];
  for (let i = 0; i < q.master; i++) out.push('master');

  // 正道席位（不含掌门）
  for (let i = 0; i < q.zhengdao; i++) {
    const id = pick(byside('zhengdao').filter((x) => x !== 'master')) ?? 'dizi';
    out.push(id);
  }
  for (let i = 0; i < q.waidao; i++) {
    const list = byside('waidao');
    out.push(list.length ? pick(list)! : 'xiexiu');
  }
  for (let i = 0; i < q.yinni; i++) {
    const list = byside('yinni');
    out.push(list.length ? pick(list)! : 'sanxiu');
  }
  // 公开高位：启用时替换掌门位（势力称雄变体）
  const gaowei = byside('gaowei');
  if (gaowei.length) {
    // 仅当勾选了公开高位身份才启用变体：把掌门位替换为座主/老祖等
    const idx = out.indexOf('master');
    if (idx >= 0) out[idx] = pick(gaowei)!;
  }
  return out.slice(0, count);
}

/** 身份公开的玩家（掌门 / 公开高位方） */
export function isPublicRole(p: Player): boolean {
  const d = ROLE_MAP[p.role];
  return !!d?.public;
}

/**
 * 胜负统一结算。
 * 返回获胜座位与阵营功勋。
 */
export function settleRoles(timeout = false): { winners: number[]; campHonor: Camp[]; title: string } {
  const alive = G.players.filter((p) => p.alive);
  const sideOf = (p: Player) => ROLE_MAP[p.role]?.side ?? 'zhengdao';
  const master = alive.find((p) => ROLE_MAP[p.role]?.id === 'master');
  const waidaoAlive = alive.filter((p) => sideOf(p) === 'waidao');
  const yinniAlive = alive.filter((p) => sideOf(p) === 'yinni');
  const gaoweiAlive = alive.filter((p) => sideOf(p) === 'gaowei');

  const winners: number[] = [];
  let title = '尘埃落定';

  // 回合耗尽：以存活势力对比裁定（掌门存活则正道守成，否则外道得势）
  if (timeout) {
    const foes = waidaoAlive.length + yinniAlive.length;
    if (master && foes === 0) {
      winners.push(master.seat);
      for (const p of alive) {
        const d = ROLE_MAP[p.role];
        if (d?.goal === 'guardMaster' && !winners.includes(p.seat)) winners.push(p.seat);
      }
      title = '正道胜';
    } else if (master) {
      // 掌门尚存：正道守成
      winners.push(master.seat);
      for (const p of alive) {
        const d = ROLE_MAP[p.role];
        if (d?.goal === 'guardMaster' && !winners.includes(p.seat)) winners.push(p.seat);
      }
      title = '正道守成';
    } else {
      for (const p of [...waidaoAlive, ...yinniAlive])
        if (!winners.includes(p.seat)) winners.push(p.seat);
      title = '外道得势';
    }
  }

  // ① 公开高位方：势力称雄 / 守灵地
  if (gaoweiAlive.length) {
    for (const p of gaoweiAlive) {
      const d = ROLE_MAP[p.role];
      if (d?.goal === 'holdLingdi') {
        const best = G.players.reduce((a, b) => (b.lingdi.length > a.lingdi.length ? b : a));
        if (best.seat === p.seat) winners.push(p.seat);
      } else if (d?.goal === 'powerHegemony') {
        // 本势力存活最多
        const cnt = (power: string) =>
          alive.filter((x) => x.power === power).length;
        const best = alive.reduce((a, b) => (cnt(b.power) > cnt(a.power) ? b : a));
        if (best.power === p.power) winners.push(p.seat);
      }
    }
    if (winners.length) title = '势力称雄';
  }

  // ② 掌门肃清：外道与隐匿皆灭且掌门存活
  if (master && waidaoAlive.length === 0 && yinniAlive.length === 0) {
    if (!winners.includes(master.seat)) winners.push(master.seat);
    for (const p of alive) {
      const d = ROLE_MAP[p.role];
      if (d?.goal === 'guardMaster' && !winners.includes(p.seat)) winners.push(p.seat);
    }
    title = '正道胜';
  }

  // ③ 外道弑掌门
  if (!master) {
    for (const p of waidaoAlive) if (!winners.includes(p.seat)) winners.push(p.seat);
    if (waidaoAlive.length) title = '外道胜';
  }

  // ④ 隐匿独胜：仅剩一人且为隐匿方
  if (alive.length === 1 && yinniAlive.length === 1) {
    const p = alive[0];
    if (!winners.includes(p.seat)) winners.push(p.seat);
    title = '隐匿独胜';
  }

  // ⑤ 公正鬼：终局存活且灵魂契约未被背盟破坏
  for (const p of alive) {
    const d = ROLE_MAP[p.role];
    if (d?.goal === 'upholdContract' && anyContractIntact()) {
      if (!winners.includes(p.seat)) winners.push(p.seat);
      title = '灵魂契约得全';
    }
  }

  // 阵营功勋：存活最多的阵营
  const campHonor: Camp[] = [];
  if (alive.length) {
    const byCamp = new Map<Camp, number>();
    for (const p of alive) byCamp.set(p.camp, (byCamp.get(p.camp) ?? 0) + 1);
    let best: Camp | undefined;
    let bestN = 0;
    for (const [c, n] of byCamp) {
      if (n > bestN) {
        bestN = n;
        best = c;
      }
    }
    if (best) campHonor.push(best);
  }

  return { winners, campHonor, title };
}

/** 身份揭晓文本（结算展示） */
export function roleRevealLines(): string[] {
  return G.players.map((p) => {
    const d = ROLE_MAP[p.role];
    return `#${p.seat} ${p.name} —— ${d?.name ?? p.role}${p.alive ? '' : '（已陨落）'}`;
  });
}
