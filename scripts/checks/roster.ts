/* 角色名册检查：数量 / 唯一性 / 引用完整性 / 术语合规 */
import { CHARACTERS, charOf } from '../../src/data/characters';
import { SKILL_MAP } from '../../src/data/skilldefs';
import { buildDeck } from '../../src/data/cards';
import { POWER_MAP } from '../../src/data/powers';
import { BEAST_MAP } from '../../src/data/beasts';
import { REGION_MAP } from '../../src/data/regions';

export default async function run() {
  const fails: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) fails.push(msg);
    console.log(`${ok ? '✓' : '✗'} ${msg}`);
  };

  console.log('=== 角色名册 ===');
  check(CHARACTERS.length === 116, `角色总数 = 116（实际 ${CHARACTERS.length}）`);
  const removed = ['qizhangmen', 'qindezhao', 'zijiaojindan_c', 'xuemo'];
  for (const id of removed) {
    check(!CHARACTERS.some((c) => c.id === id), `已移除边缘/误置角色：${id}`);
  }
  check(CHARACTERS.find((c) => c.id === 'jiangyan')?.power === 'sanxiu', '姜炎归属散修（power=sanxiu，非鬼修）');
  check(!CHARACTERS.some((c) => c.id === 'jiangyan' && c.camp === 'guixiu'), '姜炎已移出鬼修');

  // 血魔井应为法宝道具（cards），而非角色
  const CARD_DEFS = buildDeck();
  check(CARD_DEFS.some((c) => c.name === '血魔井' && c.type === 'faqi'), '血魔井已作为法宝道具存在');

  // 唯一性
  const ids = CHARACTERS.map((c) => c.id);
  const names = CHARACTERS.map((c) => c.name);
  const dupId = ids.filter((v, i) => ids.indexOf(v) !== i);
  const dupName = names.filter((v, i) => names.indexOf(v) !== i);
  check(dupId.length === 0, `id 唯一（重复：${dupId.join(',') || '无'}）`);
  check(dupName.length === 0, `姓名唯一（重复：${dupName.join(',') || '无'}）`);

  // 引用完整性
  let badSkill: string[] = [];
  let badPower: string[] = [];
  let badRegion: string[] = [];
  let badBeast: string[] = [];
  let badPool: string[] = [];
  for (const c of CHARACTERS) {
    for (const s of c.skills) if (!SKILL_MAP[s.id]) badSkill.push(`${c.name}→${s.id}`);
    if (!POWER_MAP[c.power]) badPower.push(`${c.name}→${c.power}`);
    if (!REGION_MAP[c.region]) badRegion.push(`${c.name}→${c.region}`);
    if (c.awakenSkill && !SKILL_MAP[c.awakenSkill]) badSkill.push(`${c.name}→${c.awakenSkill}`);
    for (const b of c.beastPool ?? []) {
      if (!BEAST_MAP[b]) badBeast.push(`${c.name}→${b}`);
      else if (BEAST_MAP[b].ownerOnly && BEAST_MAP[b].ownerOnly !== c.id)
        badPool.push(`${c.name}→${b}(专属 ${BEAST_MAP[b].ownerOnly})`);
    }
  }
  check(badSkill.length === 0, `技能引用全部已登记（未登记：${badSkill.join(',') || '无'}）`);
  check(badPower.length === 0, `势力引用全部存在（缺失：${badPower.join(',') || '无'}）`);
  check(badRegion.length === 0, `地域引用全部存在（缺失：${badRegion.join(',') || '无'}）`);
  check(badBeast.length === 0, `伴兽引用全部存在（缺失：${badBeast.join(',') || '无'}）`);
  check(badPool.length === 0, `伴兽专属限定匹配（冲突：${badPool.join(',') || '无'}）`);

  // 阵营分布
  const camps: Record<string, number> = {};
  const realms: Record<string, number> = {};
  for (const c of CHARACTERS) {
    camps[c.camp] = (camps[c.camp] ?? 0) + 1;
    realms[c.realm] = (realms[c.realm] ?? 0) + 1;
  }
  console.log('阵营分布：', JSON.stringify(camps));
  console.log('境界分布：', JSON.stringify(realms));
  check(Object.keys(camps).length === 4, `四阵营齐备（${Object.keys(camps).join('、')}）`);
  const minCount: Record<string, number> = { human: 5, beast: 5, moxiu: 5, guixiu: 4 };
  for (const k of Object.keys(minCount))
    check((camps[k] ?? 0) >= minCount[k], `${k} 阵营 ≥ ${minCount[k]} 人（实际 ${camps[k] ?? 0}）`);

  // 御兽门角色必须带伴兽池
  const yushou = CHARACTERS.filter((c) => c.power === 'yushoumen');
  check(
    yushou.every((c) => (c.beastPool?.length ?? 0) > 0),
    `御兽门 ${yushou.length} 人均带伴兽池`,
  );

  // 术语合规
  const banned = ['劫修', '星魂契约', '气血', '灵识', '灵酒', '遁光', '符箓'];
  const hits = CHARACTERS.filter((c) =>
    banned.some((b) => c.name.includes(b) || c.title.includes(b) || c.benming.includes(b)),
  );
  check(hits.length === 0, `无禁用术语（命中：${hits.map((c) => c.name).join(',') || '无'}）`);

  // 关键角色存在
  for (const id of ['qixiu', 'jiangyan', 'wangu', 'gongzhenggui', 'xuedao', 'kaerweiming'])
    check(!!charOf(id), `关键角色「${id}」存在`);

  console.log('\n=== 名册一览 ===');
  console.log(
    CHARACTERS.map((c) => `${c.name}(${c.camp}/${c.realm})`).join('、'),
  );

  return { fails };
}
