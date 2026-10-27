/* ==================== 地域 ====================
 * docs 出处：docs/md/势力/势力列表.md「按地域」
 *   白山 / 南疆 / 外海 / 齐云 / 跨区 / 跨界
 * 地域作为第二维度叠加于势力层级之上，并提供本域势力增益。
 */
import type { Region } from '../core/types';

export interface RegionDef {
  id: Region;
  name: string;
  desc: string;
  /** 本域势力角色每回合额外灵力回复 */
  lingliBonus: number;
  /** 本域势力角色距离修正（负值=更近） */
  distMod: number;
}

export const REGIONS: RegionDef[] = [
  {
    id: 'baishan',
    name: '白山',
    desc: '楚秦门、罗家、宁家、魏家、白山御兽门、丹盟等所在',
    lingliBonus: 1,
    distMod: 0,
  },
  {
    id: 'nanjiang',
    name: '南疆',
    desc: '南楚门、南疆御兽门所在，御兽门飞地',
    lingliBonus: 1,
    distMod: -1,
  },
  {
    id: 'waihai',
    name: '外海',
    desc: '海楚门、外海裴家、芩家、定海宗、外海骆家',
    lingliBonus: 0,
    distMod: 1,
  },
  {
    id: 'qiyun',
    name: '齐云',
    desc: '齐云楚家、流花宗、荷花观、流云宗与齐云各大家族',
    lingliBonus: 1,
    distMod: 0,
  },
  {
    id: 'kuaqu',
    name: '跨区',
    desc: '天姥阁、青丹阁、万宝阁、灵药阁、广汇阁等跨区商会',
    lingliBonus: 0,
    distMod: 0,
  },
  {
    id: 'kuajie',
    name: '跨界',
    desc: '齐云派、大周书院、御兽门、黑手',
    lingliBonus: 1,
    distMod: 0,
  },
];

export const REGION_MAP: Record<Region, RegionDef> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
) as Record<Region, RegionDef>;

export function regionName(id: Region): string {
  return REGION_MAP[id]?.name ?? id;
}
