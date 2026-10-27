/* ==================== 灵地 ====================
 * docs 出处：
 *   docs/md/设定/修行体系.md「进阶必须一阶灵地（筑基）／三阶（金丹）／五阶（元婴）／七阶（化神）／九阶（炼虚）」
 *   灵地名录取自 docs 各山门/城池条目：黑河峰、楚恩城、思过山、碧湖宫、仙林坳、
 *   海门岛、摩云城、铁风群岛、醒狮谷、蛮牛荒原、银象山、酆水城、小魔渊、南楚城
 *
 * 机制：境界突破须同时满足「修为阈值」与「灵地阶位门槛」。
 */
import type { Lingdi } from '../core/types';

export const LINGDI: Lingdi[] = [
  { id: 'heihefeng', name: '黑河峰', tier: 1, region: 'baishan' },
  { id: 'chuuencheng', name: '楚恩城', tier: 2, region: 'baishan' },
  { id: 'siguoshan', name: '思过山', tier: 3, region: 'baishan' },
  { id: 'xianlinao', name: '仙林坳', tier: 2, region: 'baishan' },
  { id: 'bihugong', name: '碧湖宫', tier: 3, region: 'qiyun' },
  { id: 'xiaomoyuan', name: '小魔渊', tier: 3, region: 'qiyun' },
  { id: 'nanchucheng', name: '南楚城', tier: 2, region: 'nanjiang' },
  { id: 'haimendao', name: '海门岛', tier: 4, region: 'waihai' },
  { id: 'fengshuicheng', name: '酆水城', tier: 4, region: 'waihai' },
  { id: 'moyuncheng', name: '摩云城', tier: 4, region: 'nanjiang' },
  { id: 'tiefengqundao', name: '铁风群岛', tier: 5, region: 'waihai' },
  { id: 'yinxiangshan', name: '银象山', tier: 4, region: 'nanjiang' },
  { id: 'ningshougu', name: '醒狮谷', tier: 5, region: 'nanjiang' },
  { id: 'manniuhuangyuan', name: '蛮牛荒原', tier: 5, region: 'nanjiang' },
  { id: 'qijiemijing', name: '七阶秘境', tier: 7, region: 'kuajie' },
];

export const LINGDI_MAP: Record<string, Lingdi> = Object.fromEntries(
  LINGDI.map((l) => [l.id, l]),
);

/** 境界突破所需灵地阶位（docs 修行体系） */
export const REALM_LINGDI_NEED: Record<string, number> = {
  zhuji: 1, // 筑基
  jindan: 3, // 金丹
  yuanying: 5, // 元婴
  huashen: 7, // 化神
};

/** 玩家已占据灵地中的最高阶位 */
export function highestLingdiTier(ids: string[]): number {
  let best = 0;
  for (const id of ids) {
    const l = LINGDI_MAP[id];
    if (l && l.tier > best) best = l.tier;
  }
  return best;
}

export function lingdiName(id: string): string {
  return LINGDI_MAP[id]?.name ?? id;
}
