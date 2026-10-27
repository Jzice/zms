/* ==================== 诗词感悟 ====================
 * docs 出处：
 *   docs/md/设定/修行体系.md「修行语录」
 *   docs/md/角色/楚秦门/03.金丹/齐休.md「重要诗词感悟（原文实录）」「境界突破感悟」
 *   docs/md/设定/本命代征.md（第583章《玉鹤论大道》）
 *   docs/md/角色/齐云/02.筑基/楚庄媛.md（第502章）
 *   docs/md/设定/上八门.md（截教/阐教法则）
 *
 * 两类：
 *   insight       —— 悟道判定成功时的箴言
 *   breakthrough  —— 境界突破时的进阶诗词（宣纸弹层）
 *
 * ⚠ 标注「游戏原创」的条目为 docs 原文不足处的补充，与 docs 出处条目分区标记、不得混同。
 */
import type { DaoVerse } from '../core/types';

export const DAO_VERSES: DaoVerse[] = [
  /* ---------- 悟道箴言（insight，docs 出处） ---------- */
  {
    id: 'v_qingjing',
    text: '清静，无为，如明月独照，狂风过岗，我自不动，一切随缘。',
    source: '第64章 · 齐休冲击练气三层',
    kind: 'insight',
  },
  {
    id: 'v_yingyuan',
    text: '元婴，元婴，直到元婴修士，才能初窥到人生初为婴儿时，那一丝大道真意的门径；我现下筑基，才是刚刚起步，这才哪到哪啊！',
    source: '第150章 · 再战天引山',
    kind: 'insight',
  },
  {
    id: 'v_zhenyi',
    text: '传说初生时的婴儿，天命之中，在第一声啼哭之前，便带有一丝大道真意，藏于瞳孔，随后便风消云散，无处所寻。',
    source: '第150章 · 再战天引山',
    kind: 'insight',
  },
  {
    id: 'v_wuxinghe',
    text: '鹤既是道？清风无形。无形之鹤，正是大道清风啊！',
    source: '第583章 · 玉鹤论大道',
    kind: 'insight',
  },
  {
    id: 'v_youjiaowulei',
    text: '有教无类。',
    source: '第691章 · 截教法则（御兽门）',
    kind: 'insight',
  },
  {
    id: 'v_chanjiao',
    text: '人分高下，物定品阶。',
    source: '第692章 · 阐教法则（青莲剑宗）',
    kind: 'insight',
  },
  {
    id: 'v_mingyun',
    text: '上绝天地之机，下断阴阳之系。',
    source: 'docs/md/角色/齐云/04.元婴/冯甄.md · 命运大道',
    kind: 'insight',
  },
  {
    id: 'v_shengsi',
    text: '生死大梦，寂灭无痕。',
    source: '第502章 · 楚庄媛碧湖宫赴死',
    kind: 'insight',
  },
  {
    id: 'v_buzai',
    text: '二十多年都过来了，失败又如何？',
    source: '第64章 · 双本命天赋',
    kind: 'insight',
  },
  {
    id: 'v_dadao',
    text: '大道富贵，人生一场，总归逃不掉身死虚无。',
    source: '第291章 · 齐休黄粱一梦后确立丹论',
    kind: 'insight',
  },
  {
    id: 'v_qinsin',
    text: '挚爱尽皆随风逝，人生辛苦为谁忙？',
    source: '第291章 · 齐休结丹前道心失守',
    kind: 'insight',
  },
  {
    id: 'v_huanlong',
    text: '此步一踏，生死难料。',
    source: '第149章 · 齐休仙林坳闭关冲击筑基',
    kind: 'insight',
  },
  {
    id: 'v_wuqing',
    text: '今时今日，我已看透所谓正邪忠奸之别，唯无情人无烦忧。',
    source: 'docs/md/角色/御兽门/04.元婴/玉鹤.md · 清心寡欲',
    kind: 'insight',
  },
  {
    id: 'v_shasheng',
    text: '世间许多事，唯「杀」字一法可解。',
    source: 'docs/md/角色/齐云/04.元婴/楚问.md',
    kind: 'insight',
  },
  {
    id: 'v_lingli',
    text: '肉体与灵力越强，灵魂精神就必须同时变强，大道走得越远，这几样就越容易因为失衡，而造成根本性的灾难。',
    source: '第450章 · 终于有小得',
    kind: 'insight',
  },

  /* ---------- 进阶诗词（breakthrough，docs 出处） ---------- */
  {
    id: 'b_lianqi3',
    text: '二十余年未摸到进阶的关窍，终于有了突破的可能；事到临头，心里不由升起一阵患得患失的识碍。',
    source: '第64章 · 齐休练气三层',
    kind: 'breakthrough',
    realmFrom: 'lianqi',
    realmTo: 'lianqi',
  },
  {
    id: 'b_zhuji',
    text: '回顾二十年辛苦挣扎出的雄厚家业，将随身多年的筑基丹抛入口中，眼角流过一滴清泪，终于进入深层次的冥想。',
    source: '第149章 · 齐休筑基',
    kind: 'breakthrough',
    realmFrom: 'lianqi',
    realmTo: 'zhuji',
  },
  {
    id: 'b_jindan',
    text: '醒后观海门潮生潮灭，明心见性，逐一否定诸般假道，最终确立丹论。',
    source: '第291章 · 齐休海门岛结丹',
    kind: 'breakthrough',
    realmFrom: 'zhuji',
    realmTo: 'jindan',
  },
  {
    id: 'b_yuanying',
    text: '灵力入识海，冲霄十二楼，上泝泥丸宫；这是修行中最危险、最步步惊心的旅途之一。',
    source: '第450章 / 第546章 · 结婴之道',
    kind: 'breakthrough',
    realmFrom: 'jindan',
    realmTo: 'yuanying',
  },
  {
    id: 'b_jindan8',
    text: '一梦近一甲子，修为从金丹六层升至金丹八层。大道艰难，还是太慢！',
    source: '第646章 · 齐休楚恩山深层冥想',
    kind: 'breakthrough',
    realmFrom: 'jindan',
    realmTo: 'jindan',
  },
  {
    id: 'b_huashen',
    text: '结婴便是摆脱肉体凡胎，锻造仙家躯壳的第一步；灵力冲霄，破障直达识海。',
    source: '第546章 · 下一场开辟',
    kind: 'breakthrough',
    realmFrom: 'yuanying',
    realmTo: 'huashen',
  },
  {
    id: 'b_guyao',
    text: '万物皆可截取大道生机，不论出身根骨。',
    source: '第691章 · 截教火种播散',
    kind: 'breakthrough',
    realmFrom: 'lianqi',
    realmTo: 'zhuji',
  },
  {
    id: 'b_shouyuan',
    text: '练气寿一百二十岁，筑基两百岁，金丹五百岁，元婴两千岁——寿元之增，即是大道之进。',
    source: 'docs/md/设定/修行体系.md',
    kind: 'breakthrough',
    realmFrom: 'lianqi',
    realmTo: 'zhuji',
  },

  /* ---------- 游戏原创（docs 出处不足处的补充，明确标记） ---------- */
  {
    id: 'o_1',
    text: '一念不起，万境不生；道心既明，心魔自退。',
    source: '游戏原创',
    kind: 'insight',
  },
  {
    id: 'o_2',
    text: '丹田灵力如池，盈而后溢，溢而后通，通而后达。',
    source: '游戏原创',
    kind: 'insight',
  },
  {
    id: 'o_3',
    text: '灵根纯粹者，一日千里；灵根驳杂者，步步维艰。',
    source: '游戏原创',
    kind: 'insight',
  },
  {
    id: 'o_4',
    text: '守得心头锁，方得契约全；一念背盟，鬼影随身。',
    source: '游戏原创',
    kind: 'insight',
  },
  {
    id: 'o_5',
    text: '灵地之阶，定境界之途；无地可用，纵有修为亦难突破。',
    source: '游戏原创',
    kind: 'breakthrough',
    realmFrom: 'zhuji',
    realmTo: 'jindan',
  },
  {
    id: 'o_6',
    text: '破境如破障，气运福缘各占其一，道心修为居其大半。',
    source: '游戏原创',
    kind: 'breakthrough',
    realmFrom: 'jindan',
    realmTo: 'yuanying',
  },
];

export function versesOfKind(kind: 'insight' | 'breakthrough'): DaoVerse[] {
  return DAO_VERSES.filter((v) => v.kind === kind);
}

/** 按「当前境界 → 目标境界」匹配进阶诗词，匹配不到则回退到通用条目 */
export function breakthroughVerse(realmFrom: string, realmTo: string): DaoVerse {
  const exact = DAO_VERSES.filter(
    (v) => v.kind === 'breakthrough' && v.realmFrom === realmFrom && v.realmTo === realmTo,
  );
  if (exact.length) return exact[Math.floor(Math.random() * exact.length)];
  const any = versesOfKind('breakthrough');
  return any[Math.floor(Math.random() * any.length)];
}

export function randomInsight(): DaoVerse {
  const list = versesOfKind('insight');
  return list[Math.floor(Math.random() * list.length)];
}
