// 角色名册冒烟：npm run smoke:roster
import { main } from './smoke-lib.mjs';

await main('scripts/checks/roster.ts', 'smoke-roster');
