/* ==================== 阵营 ====================
 * docs 出处：
 *   人类 — docs/md/势力/势力列表.md（按大类：宗门/家族/商会/联盟/组织）
 *   兽类 — docs/md/角色/蛮荒/README.md「大量高阶古兽、灵兽和凶兽」
 *           docs/md/设定/虾驼兽.md「死也是死兽类」
 *   魔修 — docs/md/角色/魔修/
 *   鬼修 — docs/md/角色/鬼修/；本届势力.md「酆水城…有一座鬼修山门」
 */
import type { Camp } from '../core/types';

export interface CampDef {
  id: Camp;
  name: string;
  desc: string;
  /** 主色（阵营色环） */
  color: string;
  avatar: string;
}

export const CAMPS: CampDef[] = [
  { id: 'human', name: '人类', desc: '各门派势力，正道所系', color: '#3FB6A8', avatar: '🧑' },
  { id: 'beast', name: '兽类', desc: '古兽与灵兽，蛮荒所出', color: '#C8A24A', avatar: '🦁' },
  { id: 'moxiu', name: '魔修', desc: '魔道修士，正道不容', color: '#C0392B', avatar: '🔥' },
  { id: 'guixiu', name: '鬼修', desc: '鬼道修士，幽冥所居', color: '#5FAE7E', avatar: '👻' },
];

export const CAMP_MAP: Record<Camp, CampDef> = Object.fromEntries(
  CAMPS.map((c) => [c.id, c]),
) as Record<Camp, CampDef>;

export function campName(id: Camp): string {
  return CAMP_MAP[id]?.name ?? id;
}
export function campColor(id: Camp): string {
  return CAMP_MAP[id]?.color ?? '#888';
}
