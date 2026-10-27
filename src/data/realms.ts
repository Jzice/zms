/* ==================== 境界 ====================
 * docs 出处：docs/md/设定/修行体系.md
 *   五境：练气（寿 120）、筑基（寿 200）、金丹（寿 500）、元婴（寿 2000）、化神（寿约万载）
 *   每境分 初期（1-3 层）/ 中期（4-7 层）/ 后期（8-10 层）/ 大圆满（10 层）
 *   进阶灵地：筑基一阶 / 金丹三阶 / 元婴五阶 / 化神七阶
 *
 * 采用 20 层级扁平表驱动，避免运行时推导歧义。
 */
import type { RealmId, RealmStage, RealmLayer } from '../core/types';
import { REALM_LINGDI_NEED } from './lingdi';

export const REALM_ORDER: RealmId[] = ['lianqi', 'zhuji', 'jindan', 'yuanying', 'huashen'];
export const STAGE_ORDER: RealmStage[] = ['early', 'mid', 'late', 'peak'];

export const REALM_NAME: Record<RealmId, string> = {
  lianqi: '练气',
  zhuji: '筑基',
  jindan: '金丹',
  yuanying: '元婴',
  huashen: '化神',
};

export const STAGE_NAME: Record<RealmStage, string> = {
  early: '初期',
  mid: '中期',
  late: '后期',
  peak: '大圆满',
};

/** 基础寿元（docs 修行体系） */
const LIFESPAN: Record<RealmId, number> = {
  lianqi: 120,
  zhuji: 200,
  jindan: 500,
  yuanying: 2000,
  huashen: 10000,
};

/**
 * 20 层级表：[灵力上限, 突破到下一层所需修为]
 * 数值为平衡旋钮，集中于此处可单点调参。
 */
const TABLE: Record<RealmId, Record<RealmStage, [number, number]>> = {
  lianqi: { early: [2, 8], mid: [2, 10], late: [3, 12], peak: [3, 16] },
  zhuji: { early: [3, 14], mid: [3, 18], late: [4, 22], peak: [4, 28] },
  jindan: { early: [4, 22], mid: [4, 28], late: [5, 34], peak: [5, 42] },
  yuanying: { early: [5, 34], mid: [5, 42], late: [6, 50], peak: [6, 60] },
  huashen: { early: [6, 50], mid: [6, 60], late: [7, 70], peak: [7, 85] },
};

export const REALM_LAYERS: RealmLayer[] = REALM_ORDER.flatMap((realm) =>
  STAGE_ORDER.map((stage) => {
    const [lingliMax, xiuweiNeed] = TABLE[realm][stage];
    const next = nextLayer(realm, stage);
    return {
      realm,
      stage,
      lingliMax,
      xiuweiNeed,
      lifespan: LIFESPAN[realm],
      // 跨境时才需要对应阶位灵地
      lingdiTierNeed: next && next.realm !== realm ? REALM_LINGDI_NEED[next.realm] : undefined,
    } satisfies RealmLayer;
  }),
);

export function layerIndex(realm: RealmId, stage: RealmStage): number {
  return REALM_LAYERS.findIndex((l) => l.realm === realm && l.stage === stage);
}

export function currentLayer(realm: RealmId, stage: RealmStage): RealmLayer {
  const i = layerIndex(realm, stage);
  return REALM_LAYERS[i] ?? REALM_LAYERS[0];
}

/** 下一层（已是化神大圆满则返回 null） */
export function nextLayer(
  realm: RealmId,
  stage: RealmStage,
): { realm: RealmId; stage: RealmStage } | null {
  const ri = REALM_ORDER.indexOf(realm);
  const si = STAGE_ORDER.indexOf(stage);
  if (si < STAGE_ORDER.length - 1) return { realm, stage: STAGE_ORDER[si + 1] };
  if (ri < REALM_ORDER.length - 1) return { realm: REALM_ORDER[ri + 1], stage: 'early' };
  return null;
}

export function realmLabel(realm: RealmId, stage: RealmStage): string {
  return `${REALM_NAME[realm]}${STAGE_NAME[stage]}`;
}
