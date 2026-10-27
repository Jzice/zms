/* ==================== 境界成长 ====================
 * docs 出处：docs/md/设定/修行体系.md
 *   五境 × 初期/中期/后期/大圆满 = 20 层
 *   进阶灵地门槛：筑基一阶 / 金丹三阶 / 元婴五阶 / 化神七阶
 *   本命越多、灵根越杂，吸纳灵气越慢（docs/md/设定/本命.md）
 *
 * 关键收敛点（避免收益散落导致状态不一致）：
 *   gainXiuwei()   —— 所有修为获取的唯一入口（含灵根纯度修正）
 *   canBreakthrough() —— 双前置条件判定（修为阈值 + 灵地阶位）
 *   breakthroughRealm() —— 突破收益集中结算
 */
import type { Player } from '../core/types';
import { G } from './state';
import { addLog } from './log';
import { charOf } from '../data/characters';
import { currentLayer, nextLayer, realmLabel, REALM_NAME, STAGE_NAME } from '../data/realms';
import { highestLingdiTier } from '../data/lingdi';
import { breakthroughVerse } from '../data/daoVerses';
import { skillOf } from '../data/skilldefs';

/** 灵根纯度修正：单灵根 +2 / 双灵根 0 / 三灵根及以上 −1 */
export function rootPurityMod(p: Player): number {
  const c = charOf(p.charId);
  if (!c) return 0;
  const n = c.spiritRoots.length;
  if (n <= 1) return 2;
  if (n === 2) return 0;
  return -1;
}

/** 修为获取唯一入口 */
export function gainXiuwei(p: Player, base: number, reason = '修行'): number {
  const gain = Math.max(0, base + (base > 0 ? rootPurityMod(p) : 0));
  p.xiuwei += gain;
  if (gain > 0) addLog(`${p.name}（${reason}）修为 +${gain}，当前 ${p.xiuwei}`, 'system');
  return gain;
}

/**
 * 突破前置判定（双条件 + 上限）
 * 返回不可突破的原因：'xiuwei' 修为不足 / 'lingdi' 灵地不足 / 'capped' 已至化神大圆满
 */
export function canBreakthrough(p: Player): {
  ok: boolean;
  reason?: 'xiuwei' | 'lingdi' | 'capped';
} {
  const next = nextLayer(p.realm, p.realmStage);
  if (!next) return { ok: false, reason: 'capped' };
  const layer = currentLayer(p.realm, p.realmStage);
  if (p.xiuwei < layer.xiuweiNeed) return { ok: false, reason: 'xiuwei' };
  // 跨境突破需要对应阶位灵地
  if (next.realm !== p.realm) {
    const need = layer.lingdiTierNeed ?? 0;
    if (highestLingdiTier(p.lingdi) < need) return { ok: false, reason: 'lingdi' };
  }
  return { ok: true };
}

/** 突破所需灵地阶位（跨境时有效，UI 提示用） */
export function requiredLingdiTier(p: Player): number {
  const layer = currentLayer(p.realm, p.realmStage);
  return layer.lingdiTierNeed ?? 0;
}

/**
 * 境界突破：收益集中结算
 *   寿元上限 +1 且当前寿元 +1（docs 寿元之增）
 *   灵力上限 +1（丹田灵力池扩大）
 *   开启本命天赋（awakenSkill）
 *   展示诗词感悟 + 战报
 */
export function breakthroughRealm(p: Player): boolean {
  const check = canBreakthrough(p);
  if (!check.ok) return false;
  const next = nextLayer(p.realm, p.realmStage);
  if (!next) return false;

  const from = realmLabel(p.realm, p.realmStage);
  const crossRealm = next.realm !== p.realm;

  p.realm = next.realm;
  p.realmStage = next.stage;
  p.xiuwei = 0;

  if (crossRealm) {
    p.maxHp += 1;
    p.hp = Math.min(p.maxHp, p.hp + 1);
  }
  // 灵力上限随层级提升
  const layer = currentLayer(p.realm, p.realmStage);
  p.lingli = Math.min(layer.lingliMax, p.lingli + 1);

  const to = realmLabel(p.realm, p.realmStage);
  addLog(`${p.name} 境界突破：${from} → ${to}`, 'breakthrough');

  // 本命天赋开启
  const c = charOf(p.charId);
  if (c?.awakenSkill) {
    try {
      const sk = skillOf(c.awakenSkill);
      addLog(`${p.name} 开启本命天赋【${sk.name}】`, 'breakthrough');
    } catch {
      /* 未登记则忽略 */
    }
  }

  // 诗词感悟（宣纸弹层）
  const verse = breakthroughVerse(p.realm, next.realm);
  if (verse) {
    void verse;
  }
  return true;
}

/** 突破时取得的诗词感悟（供 UI 弹层展示） */
export function verseForBreakthrough(p: Player) {
  return breakthroughVerse(p.realm, p.realm);
}

/** 回合开始灵力回复（地域加成） */
export function recoverLingli(p: Player): void {
  const layer = currentLayer(p.realm, p.realmStage);
  const c = charOf(p.charId);
  let bonus = 0;
  if (c && c.region === p.region) {
    // 本域势力额外回复
    bonus = 1;
  }
  p.lingli = Math.min(layer.lingliMax, p.lingli + 2 + bonus);
}

/** 寿元上限（跨境突破累计） */
export function maxHpOf(p: Player): number {
  return p.maxHp;
}

/** 显示用：境界 + 修为进度 */
export function realmProgress(p: Player): { label: string; cur: number; need: number } {
  const layer = currentLayer(p.realm, p.realmStage);
  return {
    label: `${REALM_NAME[p.realm]}${STAGE_NAME[p.realmStage]}`,
    cur: p.xiuwei,
    need: layer.xiuweiNeed,
  };
}

/** 灵力上限 */
export function lingliMax(p: Player): number {
  return currentLayer(p.realm, p.realmStage).lingliMax;
}

/** 全场最高寿元角色（结算「最佳」用） */
export function topXiuwei(): Player | undefined {
  const alive = G.players.filter((p) => p.alive);
  if (!alive.length) return undefined;
  return alive.reduce((a, b) => (b.xiuwei > a.xiuwei ? b : a));
}
