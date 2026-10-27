/* 联机协议检查（离线可验证部分）：房间号 / 消息编解码 / 状态快照序列化
 * 真实的 P2P 连接需要浏览器与 PeerJS 服务，不在此处断言。
 */
import { randomRoomCode, peerIdOf, roomCodeOf, encode, decode, ROOM_CODE_LEN } from '../../src/net/protocol';
import { G } from '../../src/game/state';
import { startGame } from '../../src/game/setup';
import { setSim } from '../../src/core/dom';

export default async function run() {
  const fails: string[] = [];
  const check = (ok: boolean, msg: string) => {
    if (!ok) fails.push(msg);
    console.log(`${ok ? '✓' : '✗'} ${msg}`);
  };

  setSim(true);
  console.log('=== 房间号 ===');
  const code = randomRoomCode();
  check(code.length === ROOM_CODE_LEN, `房间号为 ${ROOM_CODE_LEN} 位（实际 ${code.length}：${code}）`);
  check(/^\d+$/.test(code), '房间号为纯数字');
  check(roomCodeOf(peerIdOf(code)) === code, '房间号 ↔ peerId 互转一致');

  console.log('\n=== 消息编解码 ===');
  const msg = { t: 'state_sync' as const, state: { players: [] } as never };
  const raw = encode(msg);
  const back = decode(raw);
  check(!!back && back.t === 'state_sync', 'state_sync 消息编解码往返一致');
  check(decode(123) === null, '非字符串负载被拒绝');
  check(decode('{bad json') === null, '非法 JSON 被拒绝');

  console.log('\n=== 状态快照可序列化（state_sync 依赖） ===');
  startGame({ count: 6, enabledRoles: [], beastChoice: {} });
  let snapshotOk = true;
  let size = 0;
  try {
    const s = JSON.stringify(G);
    size = s.length;
    const parsed = JSON.parse(s);
    snapshotOk = Array.isArray(parsed.players) && parsed.players.length === 6;
  } catch (e) {
    snapshotOk = false;
    console.log('  序列化异常：', String(e));
  }
  check(snapshotOk, `G 可 JSON 序列化且玩家数正确（快照 ${(size / 1024).toFixed(1)} KB）`);

  // 新增字段均为可序列化类型（不含函数 / undefined 循环）
  const p = G.players[0];
  const fields = ['camp', 'power', 'region', 'role', 'xiuwei', 'realm', 'realmStage', 'lingli', 'daoxin', 'lingdi', 'contracts', 'heartLock', 'trueNameKnown'];
  for (const f of fields) {
    const v = (p as unknown as Record<string, unknown>)[f];
    check(v !== undefined, `Player.${f} 已初始化（${JSON.stringify(v)?.slice(0, 40)}）`);
  }

  // beast 为可选字段（仅御兽门角色绑定），未绑定时为 undefined，序列化仍安全
  const beasts = G.players.filter((x) => x.beast);
  check(
    G.players.every((x) => x.beast === undefined || typeof x.beast.id === 'string'),
    'beast 字段：未绑定为 undefined，已绑定含 id',
  );
  console.log(`伴兽绑定人数：${beasts.length}（仅御兽门角色）`);

  return { fails };
}
