// 灵魂契约冒烟：npm run smoke:contract
import { main } from './smoke-lib.mjs';

await main('scripts/checks/contract.ts', 'smoke-contract');
