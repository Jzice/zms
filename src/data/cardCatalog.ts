/* ==================== 卡牌目录（命名与文案） ====================
 * 术语强制对照表（全部取自 docs，禁止新造）：
 *   杀 → 神通（docs：楚红裳「万丈天火…本命神通」）
 *   闪 → 护身（docs：陆云「以莲花先天之气护身」）
 *   桃 → 灵丹（docs：法宝列表「三才培元丹…增进修为」）
 *   酒 → 灵药（docs：蒋鸿苦「灵药阁…灵草专卖之权」）
 *   锦囊 → 符篆（docs：营造力士「类别=符篆」）＋ 阵法/法阵 ＋ 秘术
 *   装备 → 本命法宝/法器、护身、飞梭/灵舟、秘宝/重宝
 *   判定 → 天劫、七星定身阵
 *   契约 → 灵魂契约
 */
import type { CardSub } from '../core/types';

export const SUB_LABEL: Record<CardSub, string> = {
  shengtong: '神通',
  huo: '火系神通',
  lei: '雷系神通',
  hushen: '护身',
  lingdan: '灵丹',
  lingyao: '灵药',
  wudao: '悟道',
  fuzhuan: '符篆',
  zhenfa: '阵法',
  mishu: '秘术',
  linghunqiyue: '灵魂契约',
  benmingfaqi: '本命法宝',
  fangju: '护身',
  feisuo: '飞梭',
  mibao: '秘宝',
  tianjie: '天劫',
  qixingdinggshen: '七星定身阵',
};

/** 类型配色（仙侠水墨 · 玉青鎏金） */
export const SUB_COLOR: Record<CardSub, string> = {
  shengtong: '#C0392B',
  huo: '#E67E22',
  lei: '#8E44AD',
  hushen: '#3FB6A8',
  lingdan: '#27AE60',
  lingyao: '#D4AF37',
  wudao: '#4A90D9',
  fuzhuan: '#4A90D9',
  zhenfa: '#5FAE7E',
  mishu: '#8E44AD',
  linghunqiyue: '#D4AF37',
  benmingfaqi: '#D4AF37',
  fangju: '#3FB6A8',
  feisuo: '#4A90D9',
  mibao: '#D4AF37',
  tianjie: '#8E44AD',
  qixingdinggshen: '#5FAE7E',
};

export function subLabel(sub: CardSub): string {
  return SUB_LABEL[sub] ?? sub;
}
export function subColor(sub: CardSub): string {
  return SUB_COLOR[sub] ?? '#888';
}

/** 基本牌子类（神通的三种形态） */
export const SHENGTONG_SUBS: CardSub[] = ['shengtong', 'huo', 'lei'];

/** 法宝四槽（docs：本命法宝/法器、护身、飞梭/灵舟、秘宝/重宝） */
export const EQUIP_SLOTS: CardSub[] = ['benmingfaqi', 'fangju', 'feisuo', 'mibao'];

export const EQUIP_SLOT_LABEL: Record<string, string> = {
  benmingfaqi: '本命法宝',
  fangju: '护身',
  feisuo: '飞梭',
  mibao: '秘宝',
};
