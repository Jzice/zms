/* 牌堆构成检查（纯数据层，无 DOM 依赖） */
import { buildDeck, deckStats } from '../../src/data/cards';
import { TRICKS } from '../../src/data/spellTricks';

export default async function run() {
  const fails: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) fails.push(msg);
    console.log(`${ok ? '✓' : '✗'} ${msg}`);
  };

  const deck = buildDeck();
  const s = deckStats(deck);

  console.log('=== 牌堆构成 ===');
  console.log(JSON.stringify(s, null, 2));

  // 构成分解：基础 58（神通30/护身15/灵丹8/灵药5）+ 悟道 8 + 符篆类 49（含灵魂契约 4）
  //           + 法宝 12 + 灵地 10 = 137
  check(s.total === 138, `总张数 = 138（实际 ${s.total}）`);
  check(s.shengtong === 30, `神通（含火/雷系）= 30（实际 ${s.shengtong}）`);
  check(s.hushen === 15, `护身 = 15（实际 ${s.hushen}）`);
  check(s.lingdan === 8, `灵丹 = 8（实际 ${s.lingdan}）`);
  check(s.lingyao === 5, `灵药 = 5（实际 ${s.lingyao}）`);
  check(s.wudao === 8, `悟道 = 8（实际 ${s.wudao}）`);
  check(s.tricks > 0, `符篆/阵法/秘术 > 0（实际 ${s.tricks}）`);
  check(s.equips > 0, `法宝 > 0（实际 ${s.equips}）`);
  check(s.lingdi > 0, `灵地 > 0（实际 ${s.lingdi}）`);

  // 术语合规：不得出现三国杀术语与臆造词
  const names = new Set(deck.map((c) => c.name));
  const banned = ['杀', '闪', '桃', '酒', '锦囊', '无中生有', '过河拆桥', '迷魂阵', '星魂契约', '劫修'];
  for (const b of banned) {
    check(!names.has(b), `牌名不含禁用词「${b}」`);
  }

  // 灵魂契约卡存在
  check(TRICKS.some((t) => t.name === '灵魂契约'), '牌堆含【灵魂契约】');

  console.log(`\n卡牌名清单：${Array.from(names).join('、')}`);
  return { fails };
}
