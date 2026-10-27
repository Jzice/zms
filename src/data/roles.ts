/* ==================== 身份池（四方对抗） ====================
 * 全部取自 docs，严禁新造。方名出处：
 *   正道 — 「明家以儒门正道立身」「姜焕乃我齐云正道元婴」「正道宗门在正气坊与黑风谷对峙」
 *   外道 — 势力列表按体系「外道：敢家 | 黑风谷 | 魏家」；屠风「黑风谷，外道宗门」
 *   隐匿 — 通明身识.md「一次性解决伪装、防御、隐匿等需求」
 *
 * 配置器 composeRoles(人数, 启用子集) 按人数自适应配比，维持博弈均衡。
 */
import type { RoleDef, RoleSide, Camp } from '../core/types';

export const SIDE_NAME: Record<RoleSide, string> = {
  zhengdao: '正道',
  waidao: '外道',
  yinni: '隐匿',
  gaowei: '公开高位',
};

export const SIDE_COLOR: Record<RoleSide, string> = {
  zhengdao: '#3FB6A8',
  waidao: '#C0392B',
  yinni: '#5FAE7E',
  gaowei: '#D4AF37',
};

const ALL: Camp[] = ['human', 'beast', 'moxiu', 'guixiu'];

export const ROLE_DEFS: RoleDef[] = [
  /* ---------- 正道（正统方：人类各门派势力） ---------- */
  {
    id: 'master',
    name: '掌门',
    side: 'zhengdao',
    campHint: ['human', 'beast'],
    public: true,
    goal: 'purgeAll',
    weight: 0,
    defaultOn: true,
    desc: '公开身份。肃清全部外道与隐匿方，且自身存活即胜。',
  },
  {
    id: 'dizi',
    name: '弟子',
    side: 'zhengdao',
    campHint: ['human'],
    public: false,
    goal: 'guardMaster',
    weight: 3,
    defaultOn: true,
    desc: '护掌门周全，正道胜则胜。',
  },
  {
    id: 'zhanglao',
    name: '长老',
    side: 'zhengdao',
    campHint: ['human'],
    public: false,
    goal: 'guardMaster',
    weight: 2,
    defaultOn: true,
    desc: '护掌门周全；自身存活至终局额外计功。',
  },
  {
    id: 'keqing',
    name: '客卿',
    side: 'zhengdao',
    campHint: ALL,
    public: false,
    goal: 'guardMaster',
    weight: 1,
    defaultOn: false,
    desc: '外来之宾，掌门存活至终局即胜。',
  },
  {
    id: 'zhishi',
    name: '执事',
    side: 'zhengdao',
    campHint: ['human'],
    public: false,
    goal: 'guardMaster',
    weight: 1,
    defaultOn: false,
    desc: '掌理庶务，护掌门并有资源增益。',
  },

  /* ---------- 外道（敌对方） ---------- */
  {
    id: 'xiexiu',
    name: '邪修',
    side: 'waidao',
    campHint: ALL,
    public: false,
    goal: 'killMaster',
    weight: 3,
    defaultOn: true,
    desc: '弑掌门夺权。',
  },
  {
    id: 'guixiu',
    name: '鬼修',
    side: 'waidao',
    campHint: ['guixiu'],
    public: false,
    goal: 'killMaster',
    weight: 2,
    defaultOn: true,
    desc: '鬼道一脉，参与弑掌门。',
  },
  {
    id: 'moxiu',
    name: '魔修',
    side: 'waidao',
    campHint: ['moxiu'],
    public: false,
    goal: 'killMaster',
    weight: 2,
    defaultOn: true,
    desc: '魔道一脉，参与弑掌门。',
  },
  {
    id: 'shoulei',
    name: '兽类',
    side: 'waidao',
    campHint: ['beast'],
    public: false,
    goal: 'killMaster',
    weight: 2,
    defaultOn: true,
    desc: '蛮荒古兽灵兽，与正道争夺灵地、弑掌门。',
  },

  /* ---------- 隐匿方 ---------- */
  {
    id: 'sanxiu',
    name: '散修',
    side: 'yinni',
    campHint: ALL,
    public: false,
    goal: 'soloSurvive',
    weight: 2,
    defaultOn: true,
    desc: '独善其身，存活至终局即胜。',
  },
  {
    id: 'heishou',
    name: '黑手',
    side: 'yinni',
    campHint: ['human'],
    public: false,
    goal: 'soloSurvive',
    weight: 2,
    defaultOn: true,
    desc: '潜伏各门派，隐匿到最后与掌门单挑独胜。',
  },
  {
    id: 'gongzhenggui',
    name: '公正鬼',
    side: 'yinni',
    campHint: ['guixiu'],
    public: false,
    goal: 'upholdContract',
    weight: 1,
    defaultOn: false,
    desc: '灵魂契约监督者：终局存活且契约未被背盟破坏即独胜；在场时背盟反噬加重，且可看破隐匿。',
  },

  /* ---------- 公开高位方（势力称雄变体，可选替换项） ---------- */
  {
    id: 'zuozhu',
    name: '座主',
    side: 'gaowei',
    campHint: ['human'],
    public: true,
    goal: 'powerHegemony',
    weight: 1,
    defaultOn: false,
    desc: '公开高位。本势力称雄即胜。',
  },
  {
    id: 'laozu',
    name: '老祖',
    side: 'gaowei',
    campHint: ['human', 'beast'],
    public: true,
    goal: 'powerHegemony',
    weight: 1,
    defaultOn: false,
    desc: '公开高位。本族／本门独存即胜。',
  },
  {
    id: 'zhenshou',
    name: '镇守',
    side: 'gaowei',
    campHint: ALL,
    public: true,
    goal: 'holdLingdi',
    weight: 1,
    defaultOn: false,
    desc: '公开高位。守住灵地／山门至终局即胜。',
  },
  {
    id: 'jiezhu',
    name: '界主',
    side: 'gaowei',
    campHint: ['human'],
    public: true,
    goal: 'powerHegemony',
    weight: 1,
    defaultOn: false,
    desc: '公开高位。维持秩序，存活至终局即胜。',
  },
  {
    id: 'chengzhu',
    name: '城主',
    side: 'gaowei',
    campHint: ['human', 'beast'],
    public: true,
    goal: 'holdLingdi',
    weight: 1,
    defaultOn: false,
    desc: '公开高位。终局占据灵地最多者胜。',
  },
];

export const ROLE_MAP: Record<string, RoleDef> = Object.fromEntries(
  ROLE_DEFS.map((r) => [r.id, r]),
);

export function roleName(id: string): string {
  return ROLE_MAP[id]?.name ?? id;
}
export function roleDef(id: string): RoleDef | undefined {
  return ROLE_MAP[id];
}
export function rolesOfSide(side: RoleSide): RoleDef[] {
  return ROLE_DEFS.filter((r) => r.side === side);
}
export function defaultEnabledRoles(): string[] {
  return ROLE_DEFS.filter((r) => r.defaultOn).map((r) => r.id);
}
