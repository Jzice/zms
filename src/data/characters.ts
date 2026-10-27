/* ==================== 角色（120 名） ====================
 * 全部取自 docs（《修真门派掌门路》设定库），字段：
 *   阵营 / 势力 / 势力层级 / 地域 / 境界 / 灵根 / 本命 / 大道 / 寿元 / 技能 / 伴兽池
 *
 * 出处主要来源：
 *   docs/md/角色/齐云/（60 份）、楚秦门/（69 份）、白山/（49 份）、御兽门/（18 份）、蛮荒/（14 份）
 *   docs/md/角色/化神总览.md、魔修/README.md、鬼修/README.md、散修/README.md
 *   docs/md/势力/README.md（按卷角色列表）、势力列表.md
 *
 * 说明：少数角色档案未详载「本命/大道/灵根」者，此处标注「未明确」，
 *       灵根按设定库既有五行取值分配（不新造术语）。
 */
import type { Character, Camp, RealmId, SpiritRoot, Gender } from '../core/types';
import { skillsOf } from './skilldefs';
import { POWER_MAP } from './powers';

interface CharInit {
  id: string;
  name: string;
  title: string;
  camp: Camp;
  power: string;
  region?: string;
  realm: RealmId;
  roots?: SpiritRoot[];
  benming?: string;
  dao?: string;
  gender?: Gender;
  hp?: number;
  avatar?: string;
  skills?: string[];
  beastPool?: string[];
  awaken?: string;
}

const DEFAULT_AVATAR: Record<RealmId, string> = {
  lianqi: '🌱',
  zhuji: '🗡️',
  jindan: '🎭',
  yuanying: '🧙',
  huashen: '👑',
};

/**
 * 战斗血量基线（三国杀内核：3–4 点体力，化神不再多给）。
 * 注意：此处是「战斗血量」，与 docs 修行体系里的「寿元 120/200/500/2000」不是同一量纲；
 * 寿元仅作为境界设定文案（realms.lifespan），不参与伤害与手牌上限计算。
 */
const HP_BASE: Record<RealmId, number> = {
  lianqi: 3,
  zhuji: 3,
  jindan: 4,
  yuanying: 4,
  huashen: 4,
};

function c(init: CharInit): Character {
  const power = POWER_MAP[init.power];
  return {
    id: init.id,
    name: init.name,
    title: init.title,
    camp: init.camp,
    power: init.power,
    powerTier: power?.tier ?? 'sect',
    region: (init.region ?? power?.region ?? 'baishan') as Character['region'],
    realm: init.realm,
    spiritRoots: init.roots ?? ['metal'],
    benming: init.benming ?? '未明确',
    dao: init.dao,
    gender: init.gender ?? 'm',
    hp: init.hp ?? HP_BASE[init.realm],
    avatar: init.avatar ?? DEFAULT_AVATAR[init.realm],
    skills: skillsOf(init.skills ?? ['tongmingshenshi']),
    beastPool: init.beastPool,
    awakenSkill: init.awaken,
  };
}

export const CHARACTERS: Character[] = [
  /* ==================== 楚秦门（24） ==================== */
  c({ id: 'qixiu', name: '齐休', title: '楚秦门掌门', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['water'], benming: '赤尻马猴', dao: '全知大道', avatar: '🧙', skills: ['buzaisuanzhong', 'mingjixin', 'lingta'], awaken: 'liaodijixian' }),
  c({ id: 'gutan', name: '顾叹', title: '楚秦门代掌门', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['wood', 'earth'], avatar: '📜', skills: ['qijiaolinglongxin', 'chuwudai'] }),
  c({ id: 'chuwuying', name: '楚无影', title: '万影阁主', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['water', 'wind'], benming: '影木妖', avatar: '🌑', skills: ['huanyingduoxin', 'yijianbihuan'] }),
  c({ id: 'qinzhangfeng', name: '秦长风', title: '参宿星之道', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['metal'], benming: '星之无垠', avatar: '✨', skills: ['xingdun', 'linghoushenfa'] }),
  c({ id: 'zhanjianfeng', name: '展剑锋', title: '楚秦门剑修', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['metal'], benming: '剑意', avatar: '⚔️', skills: ['wanjianzuanxin'] }),
  c({ id: 'qizhuang', name: '齐妆', title: '灵狐剑匣', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['metal', 'wood'], benming: '匣中万剑', gender: 'f', avatar: '🗡️', skills: ['linghuxianxia', 'wanjianzuanxin'] }),
  c({ id: 'duoluosen', name: '多罗森', title: '楚秦门丹师', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['fire', 'wood'], benming: '丹火', avatar: '⚗️', skills: ['zhujidan', 'wannianrongmu'] }),
  c({ id: 'zhanchou', name: '展仇', title: '双珠转心壶', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['water', 'earth'], benming: '黑河水', avatar: '🏺', skills: ['shuangzhuzhuanxinqu', 'bilinzhan'] }),
  c({ id: 'weiminjiang', name: '魏敏娘', title: '齐休之妻', camp: 'human', power: 'weijia', region: 'baishan', realm: 'lianqi', roots: ['water'], gender: 'f', avatar: '🌸', skills: ['qingshi'] }),
  c({ id: 'qinlieer', name: '秦烈儿', title: '楚秦门开山祖师', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['fire'], avatar: '🔥', skills: ['bilinzhan', 'houmianjinshen'] }),
  c({ id: 'baixiaosheng', name: '白晓生', title: '楚秦门修士', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['wood'], avatar: '📗', skills: ['qingshi', 'tongmingshenshi'] }),
  c({ id: 'qinweiyu', name: '秦唯喻', title: '楚秦门弟子', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['water'], gender: 'f', avatar: '💧', skills: ['lingta', 'qijiaolinglongxin'] }),
  c({ id: 'luohanben', name: '罗汉犇', title: '楚秦门谋主', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['earth', 'metal'], avatar: '🧠', skills: ['mingyanshu', 'mingyinfu'] }),
  c({ id: 'mojianxin', name: '莫剑心', title: '伪无形剑', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['metal'], avatar: '🗡️', skills: ['wajiaoyundao', 'linghoushenfa'] }),
  c({ id: 'wudaoben', name: '邬道本', title: '楚秦门修士', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['earth'], avatar: '🪨', skills: ['fanwuxing', 'tongmingshenshi'] }),
  c({ id: 'luman', name: '陆蔓', title: '楚秦门修士', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['wood'], gender: 'f', avatar: '🌿', skills: ['wannianrongmu', 'chuwudai'] }),
  c({ id: 'liuguang', name: '柳光', title: '楚秦门修士', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'zhuji', roots: ['fire', 'water'], avatar: '💡', skills: ['bilinzhan', 'qingshi'] }),
  c({ id: 'xiongdai', name: '熊黛儿', title: '齐休之妻·北烈山熊氏', camp: 'human', power: 'xiongjia', region: 'baishan', realm: 'lianqi', roots: ['earth'], gender: 'f', avatar: '🐻', skills: ['tongmingshenshi'] }),
  c({ id: 'yaoqing', name: '姚青', title: '楚秦门金丹', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['metal', 'wind'], avatar: '🎯', skills: ['qijianzhanyuan', 'linghoushenfa'] }),
  c({ id: 'mingzhen', name: '明真', title: '楚秦门金丹', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['water', 'wood'], gender: 'f', avatar: '☯️', skills: ['mingyanshu', 'qijiaolinglongxin'] }),
  c({ id: 'huanghe', name: '黄和', title: '楚秦门四灵根弟子', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'lianqi', roots: ['metal', 'wood', 'water', 'fire'], avatar: '🌫️', skills: ['qingshi'] }),
  c({ id: 'guoze', name: '郭泽', title: '楚秦门金丹', camp: 'human', power: 'chuqinmen', region: 'baishan', realm: 'jindan', roots: ['earth', 'water'], avatar: '📘', skills: ['bafang', 'chuwudai'] }),

  /* ==================== 齐云派及诸家（20） ==================== */
  c({ id: 'luyunzi', name: '陆云子', title: '齐云派掌门', camp: 'human', power: 'qiyunpai', region: 'qiyun', realm: 'yuanying', roots: ['wood', 'water'], benming: '莲花先天之气', avatar: '🪷', skills: ['qijiaolinglongxin', 'liushuiputi'] }),
  c({ id: 'luyun', name: '陆云', title: '齐云修士', camp: 'human', power: 'qiyunpai', region: 'qiyun', realm: 'yuanying', roots: ['wood'], avatar: '🌫️', skills: ['mingyanshu', 'tongmingshenshi'] }),
  c({ id: 'lukong', name: '陆崆', title: '齐云元婴', camp: 'human', power: 'qiyunpai', region: 'qiyun', realm: 'yuanying', roots: ['metal', 'wind'], avatar: '⛰️', skills: ['qijianzhanyuan', 'wanjianzuanxin'] }),
  c({ id: 'caiyuan', name: '蔡渊', title: '齐云蔡家元婴', camp: 'human', power: 'qiyuncaijia', region: 'qiyun', realm: 'yuanying', roots: ['water', 'earth'], avatar: '🌊', skills: ['lingshuiyujue', 'bafang'] }),
  c({ id: 'peigong', name: '裴恭', title: '齐云裴家元婴', camp: 'human', power: 'qiyunpeijia', region: 'qiyun', realm: 'yuanying', roots: ['metal'], avatar: '🎁', skills: ['hongyuzhenpan', 'wanjianzuanxin'] }),
  c({ id: 'peiwen', name: '裴雯', title: '白山三盟元婴', camp: 'human', power: 'qiyunpeijia', region: 'qiyun', realm: 'yuanying', roots: ['wood', 'water'], gender: 'f', avatar: '💠', skills: ['wannianrongmu', 'sanmuhuixin'] }),
  c({ id: 'peishuang', name: '裴双', title: '齐云裴家金丹', camp: 'human', power: 'qiyunpeijia', region: 'qiyun', realm: 'jindan', roots: ['metal'], gender: 'f', avatar: '🪐', skills: ['qianhuannichang'] }),
  c({ id: 'gaoguangsheng', name: '高广盛', title: '器符盟元婴', camp: 'human', power: 'qifumeng', region: 'baishan', realm: 'yuanying', roots: ['earth', 'metal'], avatar: '🏺', skills: ['yingzaolishi', 'wuchenlian'] }),
  c({ id: 'tengyuanqi', name: '滕远旗', title: '齐云滕家元婴', camp: 'human', power: 'qiyunpai', region: 'qiyun', realm: 'yuanying', roots: ['fire'], avatar: '🚩', skills: ['bilinzhan', 'leiyinruti'] }),
  c({ id: 'lanli', name: '蓝隶', title: '齐云蓝家元婴', camp: 'human', power: 'qiyunlanjia', region: 'qiyun', realm: 'yuanying', roots: ['water'], avatar: '🔷', skills: ['lingshuiyujue', 'mingyanshu'] }),
  c({ id: 'chushentong', name: '楚神通', title: '齐云楚家元婴', camp: 'human', power: 'qiyunchujia', region: 'qiyun', realm: 'yuanying', roots: ['metal', 'thunder'], avatar: '⚡', skills: ['qijianzhanyuan', 'leiyinruti'] }),
  c({ id: 'jiangmingling', name: '姜明玲', title: '齐云姜家金丹', camp: 'human', power: 'qiyunjiangjia', region: 'qiyun', realm: 'jindan', roots: ['fire'], gender: 'f', avatar: '🌺', skills: ['bilinzhan', 'chuwudai'] }),
  c({ id: 'kanlin', name: '阚林', title: '散修·有识人之术', camp: 'human', power: 'sanxiu', region: 'baishan', realm: 'zhuji', roots: ['metal', 'wood'], avatar: '🔮', skills: ['mingyanshu', 'mingyinfu'] }),
  c({ id: 'chushencang', name: '楚神苍', title: '齐云楚家金丹', camp: 'human', power: 'qiyunchujia', region: 'qiyun', realm: 'jindan', roots: ['fire'], avatar: '☄️', skills: ['bilinzhan', 'houmianjinshen'] }),
  c({ id: 'chuqingyu', name: '楚青玉', title: '南楚门金丹', camp: 'human', power: 'nanchumen', region: 'nanjiang', realm: 'jindan', roots: ['wood'], gender: 'f', avatar: '💚', skills: ['sanmuhuixin', 'wanjianzuanxin'] }),
  c({ id: 'keshan', name: '克山一剑', title: '散修剑修', camp: 'human', power: 'sanxiu', region: 'baishan', realm: 'zhuji', roots: ['metal'], avatar: '🗡️', skills: ['wanjianzuanxin', 'yijianbihuan'] }),
  c({ id: 'huxu', name: '狐诩', title: '齐云金丹', camp: 'human', power: 'qiyunpai', region: 'qiyun', realm: 'jindan', roots: ['wind'], avatar: '🦊', skills: ['qianhuannichang', 'linghoushenfa'] }),
  c({ id: 'nangongli', name: '南宫利', title: '齐云南宫家筑基', camp: 'human', power: 'qiyunnangongjia', region: 'qiyun', realm: 'zhuji', roots: ['metal'], avatar: '🎴', skills: ['wajiaoyundao', 'chuwudai'] }),

  /* ==================== 楚家 / 南楚（8） ==================== */
  c({ id: 'chuhongshang', name: '楚红裳', title: '南楚掌门', camp: 'human', power: 'nanchumen', region: 'nanjiang', realm: 'yuanying', roots: ['fire'], benming: '九天不灭炼火霓裳', dao: '火之不灭大道', gender: 'f', avatar: '🔥', skills: ['bilinzhan', 'qianhuannichang'] }),
  c({ id: 'chuwen', name: '楚问', title: '七剑星阵', camp: 'human', power: 'qiyunchujia', region: 'qiyun', realm: 'yuanying', roots: ['metal'], benming: '七星剑鞘', avatar: '🌟', skills: ['qijianzhanyuan', 'wanjianzuanxin'] }),
  c({ id: 'chuzhen', name: '楚震', title: '齐云元婴后期', camp: 'human', power: 'qiyunchujia', region: 'qiyun', realm: 'yuanying', roots: ['metal', 'fire'], avatar: '🏔️', skills: ['wanjianzuanxin', 'houmianjinshen'] }),
  c({ id: 'chuduo', name: '楚夺', title: '七芯蝎尾夺', camp: 'human', power: 'qiyunchujia', region: 'qiyun', realm: 'jindan', roots: ['water', 'fire'], benming: '寒毒', avatar: '🦂', skills: ['wajiaoyundao', 'bilinzhan'] }),
  c({ id: 'chuzhuangyuan', name: '楚庄媛', title: '南楚门女修', camp: 'human', power: 'nanchumen', region: 'nanjiang', realm: 'zhuji', roots: ['wood', 'water'], gender: 'f', avatar: '🦊', skills: ['yimuyufengsuo', 'chuwudai'] }),
  c({ id: 'xingjian', name: '刑剑', title: '齐云执法峰', camp: 'human', power: 'qiyunxingjia', region: 'qiyun', realm: 'jindan', roots: ['metal'], benming: '执法剑意', avatar: '⚖️', skills: ['wanjianzuanxin', 'linghoushenfa'] }),
  c({ id: 'nangongzhi', name: '南宫止', title: '齐云南宫家元婴', camp: 'human', power: 'qiyunnangongjia', region: 'qiyun', realm: 'yuanying', roots: ['wood'], avatar: '🌿', skills: ['wannianrongmu', 'zhujidan'] }),
  c({ id: 'jianghuan', name: '姜焕', title: '齐云姜家元婴', camp: 'human', power: 'qiyunjiangjia', region: 'qiyun', realm: 'yuanying', roots: ['fire'], avatar: '🕯️', skills: ['bilinzhan', 'qingshi'] }),

  /* ==================== 白山（22） ==================== */
  c({ id: 'chaiguan', name: '柴冠', title: '灵木盟老祖', camp: 'human', power: 'lingshumeng', region: 'baishan', realm: 'yuanying', roots: ['wood'], avatar: '🌳', skills: ['wannianrongmu', 'sanmuhuixin'] }),
  c({ id: 'chaiyi', name: '柴艺', title: '灵木盟金丹', camp: 'human', power: 'lingshumeng', region: 'baishan', realm: 'jindan', roots: ['wood', 'water'], gender: 'f', avatar: '🍀', skills: ['wannianrongmu', 'chuwudai'] }),
  c({ id: 'gumeng', name: '古熔', title: '丹盟炼器大师', camp: 'human', power: 'danmeng', region: 'baishan', realm: 'jindan', roots: ['fire'], avatar: '🔥', skills: ['zhujidan', 'wannianrongmu'] }),
  c({ id: 'yingbo', name: '英伯', title: '丹盟金丹', camp: 'human', power: 'danmeng', region: 'baishan', realm: 'jindan', roots: ['fire', 'metal'], avatar: '⚱️', skills: ['zhujidan', 'wajiaoyundao'] }),
  c({ id: 'sikoushou', name: '司空寿', title: '白山金丹', camp: 'human', power: 'qiyunpai', region: 'baishan', realm: 'jindan', roots: ['earth'], avatar: '🪨', skills: ['fanwuxing', 'tongmingshenshi'] }),
  c({ id: 'sikongzhou', name: '司空宙', title: '摘星阁元婴', camp: 'human', power: 'zhaixingge', region: 'baishan', realm: 'yuanying', roots: ['metal'], benming: '星辰本命', dao: '星空大道', avatar: '🌌', skills: ['qixingdingshen', 'mingyanshu'] }),
  c({ id: 'hantianqing', name: '韩天青', title: '白山元婴', camp: 'human', power: 'qifumeng', region: 'baishan', realm: 'yuanying', roots: ['wind', 'water'], avatar: '🍃', skills: ['linghoushenfa', 'wanjianzuanxin'] }),
  c({ id: 'hanping', name: '韩平', title: '白山金丹', camp: 'human', power: 'qifumeng', region: 'baishan', realm: 'jindan', roots: ['earth'], avatar: '🛡️', skills: ['bafang', 'chuwudai'] }),
  c({ id: 'kuaitong', name: '蒯通', title: '器符盟金丹', camp: 'human', power: 'qifumeng', region: 'baishan', realm: 'jindan', roots: ['metal', 'fire'], avatar: '🎲', skills: ['yingzaolishi', 'wuchenlian'] }),
  c({ id: 'kualiangwen', name: '蒯量文', title: '器符盟筑基', camp: 'human', power: 'qifumeng', region: 'baishan', realm: 'zhuji', roots: ['metal'], avatar: '📐', skills: ['yingzaolishi', 'chuwudai'] }),
  c({ id: 'langjigao', name: '郎季高', title: '白山金丹', camp: 'human', power: 'lianwumeng', region: 'baishan', realm: 'jindan', roots: ['fire', 'wind'], avatar: '🎭', skills: ['wajiaoyundao', 'linghoushenfa'] }),
  c({ id: 'fayin', name: '法引', title: '白山金丹', camp: 'human', power: 'lianwumeng', region: 'baishan', realm: 'jindan', roots: ['water'], avatar: '🕮', skills: ['qixingdingshen', 'mingyanshu'] }),
  c({ id: 'yannanxing', name: '燕南行', title: '白山金丹', camp: 'human', power: 'lianwumeng', region: 'baishan', realm: 'jindan', roots: ['metal'], avatar: '🗺️', skills: ['wanjianzuanxin', 'chuwudai'] }),
  c({ id: 'yanmuyun', name: '燕沐云', title: '白山金丹', camp: 'human', power: 'lianwumeng', region: 'baishan', realm: 'jindan', roots: ['wind'], gender: 'f', avatar: '☁️', skills: ['linghoushenfa', 'chuwudai'] }),
  c({ id: 'meisusu', name: '梅素素', title: '白山金丹', camp: 'human', power: 'lianwumeng', region: 'baishan', realm: 'jindan', roots: ['wood', 'water'], gender: 'f', avatar: '🌸', skills: ['sanmuhuixin', 'wanjianzuanxin'] }),
  c({ id: 'shuijunying', name: '水珺影', title: '白山金丹', camp: 'human', power: 'lianwumeng', region: 'baishan', realm: 'jindan', roots: ['water'], gender: 'f', avatar: '💧', skills: ['lingshuiyujue', 'qingfengfapao'] }),
  c({ id: 'xiaoxuan', name: '萧选', title: '白山金丹', camp: 'human', power: 'danmeng', region: 'baishan', realm: 'jindan', roots: ['metal', 'fire'], avatar: '🖋️', skills: ['mingyanshu', 'wajiaoyundao'] }),
  c({ id: 'zhongxingmei', name: '中行媚', title: '白山金丹', camp: 'human', power: 'lianwumeng', region: 'baishan', realm: 'jindan', roots: ['wood'], gender: 'f', avatar: '🎐', skills: ['chuwudai', 'wannianrongmu'] }),
  c({ id: 'zhongxingjun', name: '中行隽', title: '白山金丹', camp: 'human', power: 'lianwumeng', region: 'baishan', realm: 'jindan', roots: ['metal'], avatar: '📜', skills: ['chuwudai', 'wanjianzuanxin'] }),
  c({ id: 'yehetu', name: '叶赫图', title: '山都新主人', camp: 'human', power: 'yehejia', region: 'baishan', realm: 'jindan', roots: ['fire', 'earth'], avatar: '🏔️', skills: ['bilinzhan', 'wanjianzuanxin'] }),
  c({ id: 'qibingyan', name: '祁冰燕', title: '空曲山祁家金丹', camp: 'human', power: 'qijia', region: 'baishan', realm: 'jindan', roots: ['ice', 'water'], gender: 'f', avatar: '❄️', skills: ['qijiaolinglongxin', 'bafang'] }),
  c({ id: 'xiongfuting', name: '熊甫亭', title: '白山熊家', camp: 'human', power: 'xiongjia', region: 'baishan', realm: 'zhuji', roots: ['earth'], avatar: '🐻', skills: ['houmianjinshen', 'tongmingshenshi'] }),

  /* ==================== 御兽门（14） ==================== */
  c({ id: 'kaerweiming', name: '喀尔威明', title: '月峰与狮巢之主', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'huashen', roots: ['fire'], benming: '金冠孔雀', avatar: '🦚', skills: ['wajiaoyundao', 'houmianjinshen'], beastPool: ['jinguankongque', 'xingshi', 'lanfeng'] }),
  c({ id: 'yuhe', name: '玉鹤', title: '清风大道', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'yuanying', roots: ['wind'], benming: '九头玉种', dao: '清风大道', avatar: '🕊️', skills: ['qingfengfapao', 'lingshuiyujue'], beastPool: ['wuxinghe', 'sichitianying', 'lanfeng'] }),
  c({ id: 'huoguan', name: '霍鹳', title: '五虎拍门', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'yuanying', roots: ['wind', 'earth'], avatar: '🦢', skills: ['huanyingduoxin', 'yimuyufengsuo'], beastPool: ['moyunlie', 'fengxiaoxiong', 'heishazhu'] }),
  c({ id: 'huowu', name: '霍武', title: '御兽门霍家金丹', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'jindan', roots: ['metal'], avatar: '🛡️', skills: ['wanjianzuanxin'], beastPool: ['heishazhu', 'xiaohei', 'xiatuoshou'] }),
  c({ id: 'huobai', name: '霍白', title: '御兽门霍家金丹', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'jindan', roots: ['earth', 'water'], avatar: '🤍', skills: ['wajiaoyundao', 'chuwudai'], beastPool: ['moyunlie', 'xiatuoshou', 'xiaohei'] }),
  c({ id: 'zhaoelian', name: '赵恶廉', title: '御兽门金丹', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'jindan', roots: ['earth', 'fire'], avatar: '🐊', skills: ['wajiaoyundao', 'bilinzhan'], beastPool: ['heishazhu', 'renmianwen', 'moyunlie'] }),
  c({ id: 'lechuan', name: '乐川', title: '南疆御兽门元婴', camp: 'human', power: 'nanjiangyushou', region: 'nanjiang', realm: 'yuanying', roots: ['wood', 'water'], avatar: '🐘', skills: ['wannianrongmu', 'qijiaolinglongxin'], beastPool: ['manniu', 'yutu', 'xiatuoshou'] }),
  c({ id: 'fengxu', name: '丰绪', title: '海门岛元婴', camp: 'human', power: 'yushoumen', region: 'waihai', realm: 'yuanying', roots: ['water'], avatar: '🐋', skills: ['lingshuiyujue', 'jiuhanbihuo'], beastPool: ['qicaihuanlong', 'renmianwen', 'shishenbenlei'] }),
  c({ id: 'laozhong', name: '老种', title: '摩云鬣一族', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'yuanying', roots: ['earth'], benming: '摩云鬣', avatar: '🐗', skills: ['houmianjinshen', 'wajiaoyundao'], beastPool: ['moyunlie', 'heishazhu', 'xiatuoshou'] }),
  c({ id: 'huashenlaoyu', name: '化神老妪', title: '玉兔主人', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'huashen', roots: ['wood'], avatar: '👵', skills: ['liushuiputi', 'qijiaolinglongxin'], beastPool: ['yutu', 'lanfeng', 'xiatuoshou'] }),
  c({ id: 'yushoumenzhenshou', name: '御兽门镇守', title: '御兽门镇守', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'huashen', roots: ['metal', 'earth'], avatar: '🏯', skills: ['bafang', 'wanjianzuanxin'], beastPool: ['xingshi', 'manniu', 'heishazhu'] }),
  c({ id: 'ditianpu', name: '狄天普', title: '御兽门元婴', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'yuanying', roots: ['wind', 'fire'], avatar: '🦅', skills: ['linghoushenfa', 'leiyinruti'], beastPool: ['fengxiaoxiong', 'shishenbenlei', 'sichitianying'] }),
  c({ id: 'xiyu', name: '希钰', title: '御兽门金丹', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'jindan', roots: ['metal', 'wind'], gender: 'f', avatar: '💠', skills: ['yimuyufengsuo', 'chuwudai'], beastPool: ['qicaihuanlong', 'xiaohei', 'xiatuoshou'] }),
  c({ id: 'shiwangqi', name: '史万奇', title: '御兽门元婴', camp: 'human', power: 'yushoumen', region: 'nanjiang', realm: 'yuanying', roots: ['wood', 'metal'], avatar: '🦏', skills: ['yimuyufengsuo', 'huanyingduoxin'], beastPool: ['moyunlie', 'fengxiaoxiong', 'renmianwen'] }),

  /* ==================== 其他人类（6） ==================== */
  c({ id: 'jiyuliang', name: '姬羽梁', title: '大周书院巡察使', camp: 'human', power: 'dazhoushuyuan', region: 'baishan', realm: 'yuanying', roots: ['wood', 'earth'], benming: '儒门正气', avatar: '📖', skills: ['qixingdingshen', 'mingyinfu'] }),
  c({ id: 'guigu', name: '归古', title: '大周书院界主', camp: 'human', power: 'dazhoushuyuan', region: 'baishan', realm: 'huashen', roots: ['earth'], avatar: '🌐', skills: ['wanwuguishazhen', 'qijiaolinglongxin'] }),
  c({ id: 'kurong', name: '枯荣', title: '南林寺化神', camp: 'human', power: 'nanlinsi', region: 'kuaqu', realm: 'huashen', roots: ['wood'], benming: '枯荣之道', avatar: '🧘', skills: ['liushuiputi', 'qijiaolinglongxin'] }),
  c({ id: 'miaoqing', name: '妙清', title: '南林寺金丹', camp: 'human', power: 'nanlinsi', region: 'kuaqu', realm: 'jindan', roots: ['water'], gender: 'f', avatar: '🪔', skills: ['lingta', 'zhujidan'] }),
  c({ id: 'niefengzi', name: '聂疯子', title: '青莲剑宗化神', camp: 'human', power: 'qinglianjianzong', region: 'kuaqu', realm: 'huashen', roots: ['metal'], benming: '剑遁金丹', avatar: '🗡️', skills: ['wanjianzuanxin', 'houmianjinshen'] }),
  c({ id: 'tufeng', name: '屠风', title: '黑风谷创派祖师', camp: 'human', power: 'heifenggu', region: 'baishan', realm: 'huashen', roots: ['wind', 'fire'], benming: '万法门一脉', avatar: '🌪️', skills: ['wanwuguishazhen', 'leiyinruti'] }),

  /* ==================== 兽类（15） ==================== */
  c({ id: 'xingshi_c', name: '醒狮', title: '醒狮谷之主', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'huashen', roots: ['earth'], benming: '元犼', avatar: '🦁', skills: ['houmianjinshen', 'wanwuguishazhen'] }),
  c({ id: 'manniu_c', name: '蛮牛', title: '蛮牛荒原之主', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'huashen', roots: ['earth'], benming: '古兽之躯', avatar: '🐂', skills: ['tongmingshenshi', 'houmianjinshen'] }),
  c({ id: 'lanfeng_c', name: '蓝凤异蝶', title: '五阶灵地之主', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'huashen', roots: ['wind'], benming: '古兽', gender: 'f', avatar: '🦋', skills: ['yimuyufengsuo', 'chuwudai'] }),
  c({ id: 'yinxingshan_c', name: '银象山古象', title: '银象山化神古象', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'huashen', roots: ['earth'], benming: '古象', avatar: '🐘', skills: ['yinxingshan', 'houmianjinshen'] }),
  c({ id: 'fengxiaoxiong_c', name: '风枭熊兽', title: '半熊半枭', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'yuanying', roots: ['wind'], benming: '古兽', avatar: '🐻', skills: ['linghoushenfa', 'wajiaoyundao'] }),
  c({ id: 'moyunlie_c', name: '摩云鬣', title: '摩云山峡谷古兽', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'yuanying', roots: ['wind', 'earth'], benming: '古兽', avatar: '🐗', skills: ['moyunzao', 'wajiaoyundao'] }),
  c({ id: 'fengxi_c', name: '风息归土兽', title: '元婴级古兽', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'yuanying', roots: ['wind', 'earth'], benming: '古兽', avatar: '🐕', skills: ['fengxi', 'chuwudai'] }),
  c({ id: 'shishenbenlei_c', name: '狮身奔雷兽', title: '罡风层雷电古兽', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'yuanying', roots: ['thunder'], benming: '古兽', avatar: '⚡', skills: ['shizhen', 'leiyinruti'] }),
  c({ id: 'heishazhu_c', name: '黑煞硬背猪', title: '御兽门重点捕捉', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'yuanying', roots: ['earth'], benming: '古兽', avatar: '🐖', skills: ['moyunzao', 'chuwudai'] }),
  c({ id: 'renmianwen_c', name: '人面纹蛇', title: '赵瑶之友', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'yuanying', roots: ['water'], benming: '灵兽', gender: 'f', avatar: '🐍', skills: ['lingshuiyujue', 'chuwudai'] }),
  c({ id: 'sichitianying_c', name: '四翅天鹰', title: '赵瑶骑伴', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'jindan', roots: ['wind'], benming: '古兽', avatar: '🦅', skills: ['yimuyufengsuo', 'huanyingduoxin'] }),
  c({ id: 'xiaohei_c', name: '小黑', title: '赵瑶伙伴', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'lianqi', roots: ['earth'], benming: '灵兽', avatar: '🐕‍🦺', skills: ['xiaoheixia', 'qingshi'] }),
  c({ id: 'xiatuoshou_c', name: '虾驼兽', title: '挖矿灵兽', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'lianqi', roots: ['earth'], benming: '灵兽', avatar: '🦐', skills: ['qingshi', 'chuwudai'] }),
  c({ id: 'yutu_c', name: '玉兔', title: '小魔渊之主', camp: 'beast', power: 'manhuang', region: 'nanjiang', realm: 'huashen', roots: ['wood'], benming: '化神灵兽', gender: 'f', avatar: '🐇', skills: ['liushuiputi', 'qijiaolinglongxin'] }),

  /* ==================== 魔修（8） ==================== */
  c({ id: 'xuedao', name: '血刀', title: '血影邪修', camp: 'moxiu', power: 'moxiu', region: 'baishan', realm: 'jindan', roots: ['fire', 'metal'], benming: '血影', avatar: '🔪', skills: ['yinxue', 'huanyingduoxin'] }),
  c({ id: 'heyu_mx', name: '何玉', title: '神傀秘术', camp: 'moxiu', power: 'moxiu', region: 'baishan', realm: 'jindan', roots: ['wood', 'water'], benming: '神傀', gender: 'f', avatar: '🎭', skills: ['qianhuannichang', 'mingyinfu'] }),
  c({ id: 'zhaoyao', name: '赵瑶', title: '杀道魔修', camp: 'moxiu', power: 'moxiu', region: 'nanjiang', realm: 'zhuji', roots: ['fire', 'metal'], benming: '未明确', gender: 'f', avatar: '🗡️', skills: ['shaxue', 'wanjianzuanxin'] }),
  c({ id: 'shanuo', name: '沙诺', title: '堕入魔道', camp: 'moxiu', power: 'moxiu', region: 'waihai', realm: 'jindan', roots: ['fire', 'earth'], avatar: '🌪️', skills: ['bilinzhan', 'shaxue'] }),
  c({ id: 'huohu_mx', name: '霍虎', title: '入魔', camp: 'moxiu', power: 'moxiu', region: 'nanjiang', realm: 'zhuji', roots: ['wind', 'earth'], avatar: '🐅', skills: ['shaxue', 'huanyingduoxin'] }),
  c({ id: 'naiwenlin', name: '奈文霖', title: '病气入魔', camp: 'moxiu', power: 'moxiu', region: 'baishan', realm: 'lianqi', roots: ['wood', 'water'], avatar: '🥀', skills: ['yinxue', 'qingshi'] }),
  c({ id: 'yaner', name: '妍儿', title: '入魔散修', camp: 'moxiu', power: 'moxiu', region: 'baishan', realm: 'zhuji', roots: ['fire', 'wood'], gender: 'f', avatar: '🌹', skills: ['yinxue', 'shaxue'] }),

  /* ==================== 鬼修（4） ==================== */
  c({ id: 'wangu', name: '万骨', title: '精细鬼·空间大能', camp: 'guixiu', power: 'guixiu', region: 'waihai', realm: 'jindan', roots: ['water', 'fire'], benming: '白骨', avatar: '💀', skills: ['youlin', 'wanwuguishazhen'] }),
  c({ id: 'gongzhenggui', name: '公正鬼', title: '灵魂契约监督者', camp: 'guixiu', power: 'guixiu', region: 'waihai', realm: 'huashen', roots: ['water'], benming: '公正之鬼', avatar: '👻', skills: ['mingyanshu', 'qijiaolinglongxin'] }),
  c({ id: 'beidingshenshan', name: '北丁申山鬼修', title: '白骨大军之主', camp: 'guixiu', power: 'guixiu', region: 'waihai', realm: 'jindan', roots: ['water', 'wind'], benming: '鬼物', avatar: '🌫️', skills: ['huanyingduoxin', 'mingyinfu'] }),
  c({ id: 'fengshui', name: '酆水城主', title: '鬼修山门之主', camp: 'guixiu', power: 'guixiu', region: 'waihai', realm: 'yuanying', roots: ['water'], avatar: '🏯', skills: ['lingshuiyujue', 'qixingdingshen'] }),
  c({ id: 'jiangyan', name: '姜炎', title: '姜家叛逆·散修', camp: 'human', power: 'sanxiu', region: 'baishan', realm: 'jindan', roots: ['fire'], avatar: '🔥', skills: ['bilinzhan', 'wanwuguishazhen'] }),
];

export const CHAR_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

export function charOf(id: string): Character | undefined {
  return CHAR_MAP[id];
}

/** 门派是否御兽门（须择伴兽） */
export function needsBeast(c: Character): boolean {
  return Array.isArray(c.beastPool) && c.beastPool.length > 0;
}

export function charsOfCamp(camp: string): Character[] {
  return CHARACTERS.filter((c) => c.camp === camp);
}
