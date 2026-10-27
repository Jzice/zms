// 单机对局闭环冒烟：npm run smoke
import { main } from './smoke-lib.mjs';

await main('scripts/checks/game.ts', 'smoke');
