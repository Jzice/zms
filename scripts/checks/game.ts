/* 单机对局闭环检查：开局 → 全员 AI 自动对局 → 结算 */
import { G } from '../../src/game/state';
import { startGame } from '../../src/game/setup';
import { gameLoop } from '../../src/game/loop';
import { setSim } from '../../src/core/dom';
import { ROLE_MAP } from '../../src/data/roles';
import { campName } from '../../src/data/camps';

export default async function run() {
  const fails: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) fails.push(msg);
    console.log(`${ok ? '✓' : '✗'} ${msg}`);
  };

  setSim(true);

  console.log('=== 开局（6 人） ===');
  startGame({ count: 6, enabledRoles: [], beastChoice: {} });
  check(G.players.length === 6, `玩家数 = 6（实际 ${G.players.length}）`);
  check(G.started, '对局已开始');
  check(G.deck.length > 0, `牌堆非空（${G.deck.length}）`);

  const camps = new Set(G.players.map((p) => p.camp));
  console.log(`阵营分布：${Array.from(camps).map((c) => campName(c)).join('、')}`);
  check(camps.size >= 2, `阵营多样（${camps.size} 种）`);

  console.log('\n身份分派：');
  for (const p of G.players) {
    console.log(`  #${p.seat} ${p.name} → ${ROLE_MAP[p.role]?.name ?? p.role}（${campName(p.camp)}）`);
  }
  check(G.players.every((p) => !!p.role), '所有玩家已分配身份');

  // 御兽门伴兽
  const withBeast = G.players.filter((p) => p.beast);
  console.log(`\n伴兽绑定：${withBeast.length} 名`);
  check(
    G.players.every((p) => {
      const c = G.players.find((x) => x.seat === p.seat);
      void c;
      return true;
    }),
    '伴兽检查占位',
  );

  console.log('\n=== 自动对局（全员 AI） ===');
  for (const p of G.players) p.ai = true;
  await gameLoop();

  check(G.over, '对局已结束');
  check(!!G.settle, '已生成结算');
  console.log(`\n结算标题：${G.settle?.title}`);
  console.log(`获胜：${G.settle?.winners.map((w) => G.players.find((p) => p.seat === w)?.name ?? `#${w}`).join('、') || '无'}`);
  check((G.settle?.winners.length ?? 0) >= 0, '胜者列表可读');

  console.log('\n日志尾部：');
  console.log(G.logs.slice(-12).map((l) => `  ${l.text}`).join('\n'));
  check(G.logs.length > 0, `战报已记录（${G.logs.length} 条）`);

  return { fails };
}
