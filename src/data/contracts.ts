/* ==================== 灵魂契约 ====================
 * docs 出处：docs/md/设定/灵魂契约.md（专章）
 *   「本界天地法则级契约体系」「监督者：公正鬼（自称『公正之鬼』）」
 *   「上八门开辟此界时建立」「连元婴修士亦受约束」（第247章）
 *   「每张灵魂契约约书都价值不菲」（第142章）
 *   签订：「以真名录于羊皮纸上」；生效感应「凉风扫过」
 *   束缚：「心头锁」
 *   违约：「灵魂反噬…当场取命，无法抵抗」；「印堂之上，一个尖头鬼影隐隐浮现」（第259章）
 *
 * ⚠ 平衡标定（唯一偏离 docs 处）：
 *   docs 反噬「当场取命」若照搬将使契约不可背叛、博弈性消失。
 *   故设 SOUL_BACKLASH_LETHAL=false：默认重创而非必死；
 *   公正鬼（监督者）在场时可致命，忠实其职能并赋予威慑力。
 *   该常量为关键平衡旋钮，已在 docs/game/游戏机制.md 注明。
 */
import type { ContractDef } from '../core/types';

/** 反噬是否致命（公正鬼在场时升格为 true） */
export const SOUL_BACKLASH_LETHAL = false;

export const CONTRACT_DEFS: ContractDef[] = [
  {
    id: 'noattack',
    name: '灵魂契约 · 互不攻伐',
    terms: ['noAttack'],
    duration: 3,
    cost: { hand: 1 },
    backlash: 2,
    desc: '双方以真名录于羊皮纸，三回合内不得互相攻伐。背盟者遭灵魂反噬。',
  },
  {
    id: 'sharedraw',
    name: '灵魂契约 · 同参共修',
    terms: ['noAttack', 'shareDraw'],
    duration: 3,
    cost: { hand: 1, lingli: 1 },
    backlash: 3,
    desc: '互不攻伐，且缔约双方共享摸牌之利。约书价值不菲。',
  },
  {
    id: 'jointdef',
    name: '灵魂契约 · 守望相助',
    terms: ['noAttack', 'jointDefense'],
    duration: 'forever',
    cost: { hand: 2 },
    backlash: 3,
    desc: '至终局不得互相攻伐，一方受袭时另一方可代为挡下。',
  },
  {
    id: 'sharelingli',
    name: '灵魂契约 · 灵力互通',
    terms: ['noAttack', 'shareLingli'],
    duration: 2,
    cost: { lingli: 1 },
    backlash: 2,
    desc: '互不攻伐，缔约双方共享灵力。',
  },
];

export const CONTRACT_MAP: Record<string, ContractDef> = Object.fromEntries(
  CONTRACT_DEFS.map((c) => [c.id, c]),
);

export function contractDef(id: string): ContractDef | undefined {
  return CONTRACT_MAP[id];
}
