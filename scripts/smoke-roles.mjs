// 身份池与人数配比冒烟：npm run smoke:roles
import { main } from './smoke-lib.mjs';

await main('scripts/checks/roles.ts', 'smoke-roles');
