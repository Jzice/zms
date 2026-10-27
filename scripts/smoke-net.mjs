// 联机协议冒烟（离线可验证部分：房间号 / 编解码 / 快照序列化）：npm run smoke:net
// 真实 P2P 连接需在浏览器中验证，此处不断言网络可达性。
import { main } from './smoke-lib.mjs';

await main('scripts/checks/net.ts', 'smoke-net');
