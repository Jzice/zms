/* ==================== 势力（分层级 + 地域） ====================
 * docs 出处：docs/md/势力/势力列表.md「按大类 / 按地域 / 按体系」
 *   超级宗门：齐云派、大周书院、御兽门、天理门、明阳山、青莲剑宗、黑风谷、南林寺
 *   宗门：楚秦门、海楚门、南楚门、离火盟、摘星阁、流花宗、白沙帮、荷花观、流云宗、
 *         南疆御兽门、白山御兽门、桢林门、厚土盟、灵木盟、合欢宗、锐金盟、连水盟、
 *         白山剑派、幻剑门、丹盟、栖蒙派、定海宗、古剑门、燕归门、桑海门、瑛霞宗、泰阳门
 *   家族：罗家、宁家、奈文家、齐云楚家、熊家、敢家、魏家、齐云刑家/蓝家/陆家/蔡家/
 *         南宫家/田家/姜家/裴家、外海裴家、芩家、鲁家、蒯家、祁家、叶赫家、卢家、穆家、虢家
 *   附庸：碧湖宫、小魔渊、陵梁宗
 *   组织：黑手    联盟：反楚秦同盟、器符盟
 *   商会：天姥阁、青丹阁、万宝阁、灵药阁、广汇阁
 *   分支机构：东政外院、北政外院
 *   兽类/魔修/鬼修阵营以「蛮荒 / 魔修 / 鬼修」作为势力归类（docs 角色目录）
 */
import type { Power } from '../core/types';

export const TIER_NAME: Record<string, string> = {
  super: '超级宗门',
  sect: '宗门',
  family: '家族',
  vassal: '附庸',
  org: '组织',
  league: '联盟',
  guild: '商会',
  branch: '分支机构',
};

export const POWERS: Power[] = [
  /* 超级宗门 */
  { id: 'qiyunpai', name: '齐云派', tier: 'super', region: 'qiyun', camp: 'human' },
  { id: 'dazhoushuyuan', name: '大周书院', tier: 'super', region: 'baishan', camp: 'human' },
  { id: 'yushoumen', name: '御兽门', tier: 'super', region: 'nanjiang', camp: 'human' },
  { id: 'tianlimen', name: '天理门', tier: 'super', region: 'kuaqu', camp: 'human' },
  { id: 'mingyangshan', name: '明阳山', tier: 'super', region: 'kuaqu', camp: 'human' },
  { id: 'qinglianjianzong', name: '青莲剑宗', tier: 'super', region: 'kuaqu', camp: 'human' },
  { id: 'heifenggu', name: '黑风谷', tier: 'super', region: 'baishan', camp: 'human' },
  { id: 'nanlinsi', name: '南林寺', tier: 'super', region: 'kuaqu', camp: 'human' },

  /* 宗门 */
  { id: 'chuqinmen', name: '楚秦门', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'haichumen', name: '海楚门', tier: 'sect', region: 'waihai', camp: 'human' },
  { id: 'nanchumen', name: '南楚门', tier: 'sect', region: 'nanjiang', camp: 'human' },
  { id: 'lihuomeng', name: '离火盟', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'zhaixingge', name: '摘星阁', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'liuhuazong', name: '流花宗', tier: 'sect', region: 'qiyun', camp: 'human' },
  { id: 'hehuaguan', name: '荷花观', tier: 'sect', region: 'qiyun', camp: 'human' },
  { id: 'liuyunzong', name: '流云宗', tier: 'sect', region: 'qiyun', camp: 'human' },
  { id: 'nanjiangyushou', name: '南疆御兽门', tier: 'sect', region: 'nanjiang', camp: 'human' },
  { id: 'baishanyushou', name: '白山御兽门', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'danmeng', name: '丹盟', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'lingshumeng', name: '灵木盟', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'dinghaizong', name: '定海宗', tier: 'sect', region: 'waihai', camp: 'human' },
  { id: 'qimengpai', name: '栖蒙派', tier: 'sect', region: 'qiyun', camp: 'human' },
  { id: 'gujianmen', name: '古剑门', tier: 'sect', region: 'baishan', camp: 'human' },

  /* 家族 */
  { id: 'luojia', name: '罗家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'ningjia', name: '宁家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'qiyunchujia', name: '齐云楚家', tier: 'family', region: 'qiyun', camp: 'human' },
  { id: 'xiongjia', name: '熊家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'weijia', name: '魏家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'qiyunxingjia', name: '齐云刑家', tier: 'family', region: 'qiyun', camp: 'human' },
  { id: 'qiyunlanjia', name: '齐云蓝家', tier: 'family', region: 'qiyun', camp: 'human' },
  { id: 'qiyunlujia', name: '齐云陆家', tier: 'family', region: 'qiyun', camp: 'human' },
  { id: 'qiyuncaijia', name: '齐云蔡家', tier: 'family', region: 'qiyun', camp: 'human' },
  { id: 'qiyunpeijia', name: '齐云裴家', tier: 'family', region: 'qiyun', camp: 'human' },
  { id: 'qiyunnangongjia', name: '齐云南宫家', tier: 'family', region: 'qiyun', camp: 'human' },
  { id: 'qijia', name: '空曲山祁家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'yehejia', name: '叶赫家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'ganshi', name: '敢家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'naiwen', name: '奈文家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'longjia', name: '龙家', tier: 'family', region: 'baishan', camp: 'human' },
  { id: 'lianwumeng', name: '连水盟', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'ruijinmeng', name: '锐金盟', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'houshanmeng', name: '厚土盟', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'sanxiong', name: '白沙帮', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'shandumen', name: '山都门', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'gujiangge', name: '古剑阁', tier: 'sect', region: 'baishan', camp: 'human' },
  { id: 'sanxiu', name: '散修', tier: 'vassal', region: 'baishan', camp: 'human' },
  { id: 'mingjia', name: '明家', tier: 'family', region: 'waihai', camp: 'human' },
  { id: 'wailuojia', name: '外海骆家', tier: 'family', region: 'waihai', camp: 'human' },
  { id: 'qiyunjiangjia', name: '齐云姜家', tier: 'family', region: 'qiyun', camp: 'human' },
  { id: 'waihaipeijia', name: '外海裴家', tier: 'family', region: 'waihai', camp: 'human' },
  { id: 'qinjia', name: '芩家', tier: 'family', region: 'waihai', camp: 'human' },
  { id: 'huojia', name: '霍家', tier: 'family', region: 'nanjiang', camp: 'human' },

  /* 附庸 */
  { id: 'bihugong', name: '碧湖宫', tier: 'vassal', region: 'qiyun', camp: 'human' },
  { id: 'xiaomoyuan', name: '小魔渊', tier: 'vassal', region: 'qiyun', camp: 'human' },
  { id: 'lingliangzong', name: '陵梁宗', tier: 'vassal', region: 'baishan', camp: 'human' },

  /* 组织 / 联盟 / 商会 / 分支机构 */
  { id: 'heishou', name: '黑手', tier: 'org', region: 'kuajie', camp: 'human' },
  { id: 'fanchuqintongmeng', name: '反楚秦同盟', tier: 'league', region: 'baishan', camp: 'human' },
  { id: 'qifumeng', name: '器符盟', tier: 'league', region: 'baishan', camp: 'human' },
  { id: 'tianmuge', name: '天姥阁', tier: 'guild', region: 'kuaqu', camp: 'human' },
  { id: 'wanbaoge', name: '万宝阁', tier: 'guild', region: 'kuaqu', camp: 'human' },
  { id: 'lingyaoge', name: '灵药阁', tier: 'guild', region: 'kuaqu', camp: 'human' },
  { id: 'dongzhenwaiyuan', name: '东政外院', tier: 'branch', region: 'baishan', camp: 'human' },

  /* 非人类阵营势力 */
  { id: 'manhuang', name: '蛮荒', tier: 'sect', region: 'nanjiang', camp: 'beast' },
  { id: 'moxiu', name: '魔修', tier: 'sect', region: 'baishan', camp: 'moxiu' },
  { id: 'guixiu', name: '鬼修', tier: 'sect', region: 'waihai', camp: 'guixiu' },
];

export const POWER_MAP: Record<string, Power> = Object.fromEntries(
  POWERS.map((p) => [p.id, p]),
);

export function powerName(id: string): string {
  return POWER_MAP[id]?.name ?? id;
}
export function powersOfTier(tier: string): Power[] {
  return POWERS.filter((p) => p.tier === tier);
}
