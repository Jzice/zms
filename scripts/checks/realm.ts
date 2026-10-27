/* 境界成长与悟道判定检查：修为 / 灵根修正 / 灵地门槛 / 境界突破 */
import { G } from '../../src/game/state';
import { createPlayer } from '../../src/game/setup';
import { gainXiuwei, canBreakthrough, breakthroughRealm, rootPurityMod, lingliMax } from '../../src/game/realm';
import { canUseWudao, judgeWudao } from '../../src/game/wudao';
import { buildDeck } from '../../src/data/cards';
import { setSim } from '../../src/core/dom';
import { charOf } from '../../src/data/characters';
import { highestLingdiTier } from '../../src/data/lingdi';

export default async function run() {
  const fails: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) fails.push(msg);
    console.log(`${ok ? '✓' : '✗'} ${msg}`);
  };

  setSim(true);
  console.log('=== 灵根纯度修正 ===');
  G.players = [
    createPlayer(0, 'qixiu', 'master', '齐休', false), // 单灵根
    createPlayer(1, 'chuwuying', 'xiexiu', '楚无影', true), // 双灵根
  ];
  const single = G.players[0];
  const dual = G.players[1];
  const cs = charOf(single.charId);
  const cd = charOf(dual.charId);
  console.log(`齐休 灵根 ${cs?.spiritRoots.length} 系；楚无影 灵根 ${cd?.spiritRoots.length} 系`);
  check(rootPurityMod(single) === 2, `单灵根修正 = +2（实际 ${rootPurityMod(single)}）`);
  check(rootPurityMod(dual) === 0, `双灵根修正 = 0（实际 ${rootPurityMod(dual)}）`);

  console.log('\n=== 修为获取 ===');
  single.xiuwei = 0;
  gainXiuwei(single, 4);
  check(single.xiuwei === 6, `单灵根悟道修为 = 4+2 = 6（实际 ${single.xiuwei}）`);

  console.log('\n=== 悟道判定 ===');
  G.deck = buildDeck();
  G.discard = [];
  G.phase = 'play';
  single.lingli = 5;
  single.flags.wudaoUsed = false;
  const chk = canUseWudao(single);
  check(chk.ok, `悟道条件满足（${chk.reasons.join('、') || '无阻碍'}）`);

  const r = judgeWudao(single);
  check(!!r.judgeCard, '翻出判定牌');
  check(single.lingli === 4, '悟道消耗 1 灵力');
  check(single.flags.wudaoUsed, '本回合悟道已标记');
  console.log(
    `判定结果：${r.success ? '道心澄明' : '心魔滋生'}（修为 +${r.xiuweiGain}，道心 +${r.daoxinGain}）`,
  );

  console.log('\n=== 灵地门槛（境界突破第二前置条件） ===');
  const p = createPlayer(0, 'zhanjianfeng', 'dizi', '展剑锋', false); // 筑基
  // 置为「筑基大圆满」→ 下一层为「金丹初期」（跨境，需三阶灵地）
  p.realmStage = 'peak';
  console.log(`初始境界：${p.realm} ${p.realmStage}（下一层跨境至金丹）`);
  p.xiuwei = 999; // 修为充足
  p.lingdi = [];
  const noLingdi = canBreakthrough(p);
  check(!noLingdi.ok && noLingdi.reason === 'lingdi', `无灵地时跨境不可突破（原因 ${noLingdi.reason}）`);

  // 阶内突破不需要灵地（仅跨境需要）
  const p2 = createPlayer(1, 'zhanjianfeng', 'dizi', '展剑锋2', false);
  p2.xiuwei = 999;
  p2.lingdi = [];
  check(canBreakthrough(p2).ok, '阶内突破无需灵地');

  p.lingdi = ['siguoshan']; // 3 阶
  console.log(`占据灵地后最高阶位：${highestLingdiTier(p.lingdi)}`);
  const withLingdi = canBreakthrough(p);
  check(withLingdi.ok, `灵地达标后可跨境突破（${JSON.stringify(withLingdi)}）`);

  console.log('\n=== 境界突破 ===');
  const beforeHp = p.maxHp;
  const beforeLingli = lingliMax(p);
  const ok = breakthroughRealm(p);
  check(ok, '境界突破执行成功');
  console.log(`突破后：${p.realm} ${p.realmStage} ｜ 寿元上限 ${beforeHp} → ${p.maxHp} ｜ 灵力上限 ${beforeLingli} → ${lingliMax(p)}`);
  check(p.maxHp === beforeHp, '血量上限不随突破增长（三国杀内核）');
  check(p.xiuwei === 0, '突破后修为清零');

  return { fails };
}
