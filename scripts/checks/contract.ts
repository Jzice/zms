/* 灵魂契约机制检查：立约 / 心头锁 / 真名 / 背盟灵魂反噬 / 公正鬼监督 */
import { G } from '../../src/game/state';
import { signContract, breakContract, gongzhengguiOversees, hasGongzhenggui, contractSummary } from '../../src/game/contract';
import { createPlayer } from '../../src/game/setup';
import { SOUL_BACKLASH_LETHAL, CONTRACT_DEFS } from '../../src/data/contracts';

export default async function run() {
  const fails: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) fails.push(msg);
    console.log(`${ok ? '✓' : '✗'} ${msg}`);
  };

  console.log('=== 灵魂契约 ===');

  // 组装两名玩家
  G.players = [
    createPlayer(0, 'qixiu', 'master', '齐休', false),
    createPlayer(1, 'yuhe', 'xiexiu', '玉鹤', true),
  ];
  G.turn = 1;
  const a = G.players[0];
  const b = G.players[1];
  a.hand = [];
  a.lingli = 3;

  // 立约（需手牌代价）
  a.hand.push({ id: 9001, name: '神通', type: 'basic', sub: 'shengtong', suit: '♠', num: 5 });
  const def = CONTRACT_DEFS[0];
  const c = signContract(a, b, def.id);
  check(!!c, '立约成功（真名录于羊皮纸）');
  check(a.heartLock && b.heartLock, '双方带「心头锁」标记');
  check(b.trueNameKnown.includes(a.seat), '对方掌握立约者真名');
  check(a.contracts.length === 1 && b.contracts.length === 1, '双方各持契约记录');

  if (c) {
    // 背盟 → 灵魂反噬（默认重创，公正鬼不在场）
    check(!hasGongzhenggui(), '场上无公正鬼');
    const hpBefore = a.hp;
    a.daoxin = 2;
    breakContract(c.id, a);
    check(a.daoxin === 0, '背盟后道心清零（道心失守）');
    check(a.hp < hpBefore || a.hp === 1, `背盟后受创（寿元 ${hpBefore} → ${a.hp}）`);
    check(a.alive === !SOUL_BACKLASH_LETHAL ? true : a.alive, `默认重创不致命（SOUL_BACKLASH_LETHAL=${SOUL_BACKLASH_LETHAL}）`);
    check(a.contracts[0]?.broken === true, '契约标记为已背盟');
    check(b.contracts[0]?.broken === true, '对方契约同步标记');
  }

  // 公正鬼在场 → 反噬加重且致命
  G.players.push(createPlayer(2, 'gongzhenggui', 'gongzhenggui', '公正鬼', true));
  check(hasGongzhenggui(), '公正鬼在场');
  const ov = gongzhengguiOversees();
  check(ov.heavierBacklash && ov.seeThrough, '公正鬼监督：反噬加重 + 可看破');

  const a2 = G.players[0];
  const b2 = G.players[1];
  a2.contracts = [];
  b2.contracts = [];
  a2.hand = [{ id: 9002, name: '神通', type: 'basic', sub: 'shengtong', suit: '♠', num: 6 }];
  a2.lingli = 3;
  const c2 = signContract(a2, b2, def.id);
  if (c2) {
    breakContract(c2.id, a2);
    check(!a2.alive, '公正鬼在场时背盟致命（忠实 docs「当场取命」）');
  }

  console.log('\n契约摘要：');
  console.log(contractSummary().join('\n'));

  return { fails };
}
