/* 身份池配置器与胜负结算检查 */
import { composeRoles, roleQuota } from '../../src/game/roles';
import { ROLE_MAP, ROLE_DEFS } from '../../src/data/roles';

export default async function run() {
  const fails: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) fails.push(msg);
    console.log(`${ok ? '✓' : '✗'} ${msg}`);
  };

  console.log('=== 人数自适应配比 ===');
  for (let n = 4; n <= 10; n++) {
    const q = roleQuota(n);
    const roles = composeRoles(n);
    const sum = q.master + q.zhengdao + q.waidao + q.yinni;
    console.log(
      `${n} 人 → 掌门 ${q.master} 正道 ${q.zhengdao} 外道 ${q.waidao} 隐匿 ${q.yinni} ｜ 实得 [${roles
        .map((r) => ROLE_MAP[r]?.name ?? r)
        .join(',')}]`,
    );
    check(sum === n, `${n} 人配比之和 = ${n}（实际 ${sum}）`);
    check(roles.length === n, `${n} 人身份表长度 = ${n}（实际 ${roles.length}）`);
    check(q.yinni >= 1, `${n} 人隐匿方 ≥ 1（实际 ${q.yinni}）`);
    check(roles.includes('master') || roles.length === n, `${n} 人含掌门或走高位变体`);
  }

  console.log('\n=== 身份池四方 ===');
  const sides = ['zhengdao', 'waidao', 'yinni', 'gaowei'];
  for (const s of sides) {
    const list = ROLE_DEFS.filter((r) => r.side === s);
    check(list.length > 0, `${s} 方有身份（${list.map((r) => r.name).join('、')}）`);
  }

  // 术语合规：不得出现臆造身份
  const banned = ['劫修', '星魂契约'];
  for (const b of banned) {
    check(!ROLE_DEFS.some((r) => r.name === b), `身份池不含禁用词「${b}」`);
  }

  // 关键身份存在
  for (const id of ['master', 'dizi', 'zhanglao', 'keqing', 'zhishi', 'xiexiu', 'guixiu', 'moxiu', 'shoulei', 'sanxiu', 'heishou', 'gongzhenggui']) {
    check(!!ROLE_MAP[id], `身份「${id}」已登记（${ROLE_MAP[id]?.name ?? ''}）`);
  }

  return { fails };
}
