// 浏览器 UI 冒烟：加载构建产物，验证大厅渲染、开局、牌桌渲染且无控制台错误
// 使用 bundled 产物（完全自包含，file:// 可直接打开）
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '..', 'dist');
const files = fs.readdirSync(dist).filter((f) => f.toLowerCase().endsWith('.html'));
const bundled = files.find((f) => f.includes('bundled')) ?? files[0];
if (!bundled) {
  console.error('[smoke-ui] dist/ 下没有 HTML 产物，请先 npm run build');
  process.exit(1);
}
const url = 'file:///' + path.join(dist, bundled).replace(/\\/g, '/');

const fails = [];
const check = (ok, msg) => {
  if (!ok) fails.push(msg);
  console.log(`${ok ? '✓' : '✗'} ${msg}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

console.log(`=== 加载 ${bundled} ===`);
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(600);

console.log('\n=== 大厅渲染 ===');
const lobby = await page.evaluate(() => {
  const g = (id) => document.getElementById(id);
  return {
    lobbyActive: !!g('screenLobby')?.classList.contains('active'),
    campCount: g('campPicker')?.children.length ?? 0,
    regionCount: g('regionPicker')?.children.length ?? 0,
    charCount: g('charGrid')?.children.length ?? 0,
    powerTiers: g('powerTree')?.children.length ?? 0,
    roleSides: g('rolePool')?.children.length ?? 0,
    title: document.title,
  };
});
console.log(JSON.stringify(lobby, null, 2));
check(lobby.lobbyActive, '大厅为当前激活界面');
check(lobby.campCount >= 5, `阵营筛选已渲染（${lobby.campCount} 项）`);
check(lobby.regionCount >= 7, `地域筛选已渲染（${lobby.regionCount} 项）`);
check(lobby.charCount > 10, `角色网格已渲染（${lobby.charCount} 名）`);
check(lobby.powerTiers >= 4, `势力层级树已渲染（${lobby.powerTiers} 层）`);
check(lobby.roleSides === 4, `身份池四方已渲染（${lobby.roleSides} 方）`);

console.log('\n=== 两屏流程（主界面 → 对局设置 → 返回） ===');
const setupFlow = await page.evaluate(() => {
  window.enterSetup('single');
  const setupActive = !!document.getElementById('screenSetup')?.classList.contains('active');
  const lobbyHidden = !document.getElementById('screenLobby')?.classList.contains('active');
  const title = document.getElementById('setupTitle')?.textContent ?? '';
  const netHidden = document.getElementById('netPanel')?.style.display === 'none';
  const chars = document.getElementById('charGrid')?.children.length ?? 0;
  window.enterSetup('net');
  const netShown = document.getElementById('netPanel')?.style.display !== 'none';
  const netTitle = document.getElementById('setupTitle')?.textContent ?? '';
  window.backToLobby();
  const backLobby = !!document.getElementById('screenLobby')?.classList.contains('active');
  return { setupActive, lobbyHidden, title, netHidden, chars, netShown, netTitle, backLobby };
});
check(setupFlow.setupActive && setupFlow.lobbyHidden, '第一屏 → 第二屏切换生效');
check(setupFlow.chars > 10, `第二屏角色网格已渲染（${setupFlow.chars} 名）`);
check(setupFlow.title.includes('单机'), `第二屏标题随模式变化（${setupFlow.title}）`);
check(setupFlow.netHidden, '单机模式下隐藏联机配置面板');
check(setupFlow.netShown && setupFlow.netTitle.includes('联机'), '联机模式下显示联机面板且标题联动');
check(setupFlow.backLobby, '第二屏可返回第一屏');

console.log('\n=== 主题 / 大模型面板 ===');
const themeOk = await page.evaluate(() => {
  window.openThemePanel();
  const tp = document.getElementById('themePanel');
  const hasBtns = !!tp && tp.classList.contains('show') && tp.querySelectorAll('.opt-btn').length >= 6;
  window.setThemeMode('day');
  window.setThemeStyle('gold');
  const mode = document.body.getAttribute('data-mode');
  const style = document.body.getAttribute('data-theme');
  window.closeThemePanel();
  return { hasBtns, mode, style };
});
check(themeOk.hasBtns, '主题面板可展开且含配色选项');
check(themeOk.mode === 'day' && themeOk.style === 'gold', `主题切换生效（mode=${themeOk.mode}, style=${themeOk.style}）`);

const llmOk = await page.evaluate(() => {
  window.openLlmSettings();
  const b = document.getElementById('llmSettingsBody');
  const ok = !!b && b.innerHTML.length > 50;
  window.closeLlmSettings();
  return ok;
});
check(llmOk, '大模型设置面板可展开且内容已填充');

console.log('\n=== 响应式（移动端视口） ===');
await page.setViewportSize({ width: 390, height: 800 });
await page.waitForTimeout(300);
const mob = await page.evaluate(() => ({
  lobbyActive: !!document.getElementById('screenLobby')?.classList.contains('active'),
  chars: document.getElementById('charGrid')?.children.length ?? 0,
}));
check(mob.lobbyActive, '移动端视口下大厅仍激活');
check(mob.chars > 10, `移动端角色网格仍渲染（${mob.chars} 名）`);
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(200);

console.log('\n=== 开局（6 人） ===');
await page.evaluate(() => window.__zmsStart(6));
await page.waitForTimeout(1500);

const game = await page.evaluate(() => {
  const g = (id) => document.getElementById(id);
  return {
    gameActive: !!g('screenGame')?.classList.contains('active'),
    seats: g('seatRing')?.children.length ?? 0,
    hand: g('handRow')?.children.length ?? 0,
    logs: g('playLogList')?.children.length ?? 0,
    deck: g('deckCount')?.textContent ?? '',
    snapshot: window.__zmsSnapshot?.(),
  };
});
console.log(`座位 ${game.seats} ｜ 手牌 ${game.hand} ｜ 战报 ${game.logs} ｜ 牌堆 ${game.deck}`);
check(game.gameActive, '对局界面为当前激活界面');
check(game.seats === 6, `座位渲染 6 个（实际 ${game.seats}）`);
check(game.hand > 0, `手牌区已渲染（${game.hand} 张）`);
check(game.logs > 0, `战报已渲染（${game.logs} 条）`);
check(!!game.snapshot, '调试快照可用');

console.log('\n=== 闭关二次确认 ===');
const closeCfm = await page.evaluate(() => {
  const before = document.querySelectorAll('#handRow .card').length;
  const btn = [...document.querySelectorAll('#actionBtns .btn')].find((b) => b.textContent?.includes('闭关'));
  btn?.click();
  const modal = document.getElementById('confirmModal');
  return {
    hasBtn: !!btn,
    before,
    open: modal ? getComputedStyle(modal).display !== 'none' : false,
    hand: document.querySelectorAll('#handRow .card').length,
  };
});
await page.evaluate(() => window.closeConfirm());
const closeAfter = await page.evaluate(() => document.querySelectorAll('#handRow .card').length);
check(closeCfm.hasBtn, '出牌阶段存在「闭关(弃手牌)」按钮');
check(
  closeCfm.open && closeCfm.hand === closeCfm.before && closeAfter === closeCfm.before,
  `闭关需二次确认，取消不丢手牌（${closeCfm.before} 张）`,
);

console.log('\n=== 标记 / 卡牌态 ===');
const uiBits = await page.evaluate(() => {
  const markBtns = document.querySelectorAll('.p-mark-btn').length;
  window.setRoleMarkUI(1, 'master');
  const lbl = document.querySelector('#seat-1 .p-mark-label');
  const marked = document.querySelector('#seat-1 .p-card')?.classList.contains('role-marked') ?? false;
  const cardTag = document.querySelector('.card.trick-tag, .card.equip-tag') ? true : false;
  return { markBtns, lbl: lbl?.textContent ?? '', marked, cardTag };
});
check(uiBits.markBtns >= 5, `座位卡标记按钮已渲染（${uiBits.markBtns} 个，自身除外）`);
check(uiBits.lbl === '掌门' && uiBits.marked, `身份标记生效并显示标签（${uiBits.lbl}）`);
void uiBits.cardTag;

const logUi = await page.evaluate(() => ({
  av: document.querySelectorAll('.play-log-item .pl-av').length,
  sys: document.querySelectorAll('.chat-msg.sys').length,
}));
check(logUi.av > 0, `战报头像已渲染（${logUi.av} 条带头像）`);
check(logUi.sys > 0, `系统消息气泡已渲染（${logUi.sys} 条）`);

console.log('\n=== 牌桌 / 列表模式 ===');
const desk = await page.evaluate(() => {
  const s = document.querySelector('#seatRing .seat');
  const ring = document.getElementById('seatRing');
  return {
    pos: s ? getComputedStyle(s).position : '',
    hasInlineXY: !!s && s.style.left !== '' && s.style.top !== '',
    ringPos: ring ? getComputedStyle(ring).position : '',
  };
});
check(desk.pos === 'absolute', `大屏为牌桌模式（座位绝对定位，实际 ${desk.pos}）`);
check(desk.hasInlineXY, '座位携带牌桌坐标 left/top');
check(desk.ringPos === 'absolute', `座位环为绝对容器（实际 ${desk.ringPos}）`);

// 座位卡不因悬停而位移；当前行动者以 .p-card.turn 金光标识
const seatBox1 = await (await page.$('#seatRing .seat')).boundingBox();
await page.hover('#seatRing .seat');
await page.waitForTimeout(220);
const seatBox2 = await (await page.$('#seatRing .seat')).boundingBox();
check(
  Math.abs((seatBox2?.y ?? 0) - (seatBox1?.y ?? 0)) < 1 && Math.abs((seatBox2?.x ?? 0) - (seatBox1?.x ?? 0)) < 1,
  '座位卡无悬停跳动（仅手牌保留悬停抬升）',
);
const turnGlow = await page.evaluate(() => !!document.querySelector('.p-card.turn'));
check(turnGlow, '当前行动者以金光高亮标识');

await page.setViewportSize({ width: 390, height: 800 });
await page.waitForTimeout(300);
const mobMode = await page.evaluate(() => {
  const s = document.querySelector('#seatRing .seat');
  return { pos: s ? getComputedStyle(s).position : '' };
});
check(mobMode.pos === 'static', `小屏为列表模式（座位静态流，实际 ${mobMode.pos}）`);
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(200);

console.log('\n=== 控制台错误 ===');
if (errors.length) {
  errors.slice(0, 10).forEach((e) => console.log('  ! ' + e));
}
check(errors.length === 0, `无控制台错误（实际 ${errors.length} 条）`);

await browser.close();

if (fails.length) {
  console.error('\n[smoke-ui] 失败项：');
  fails.forEach((f) => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('\n[smoke-ui] 浏览器 UI 冒烟全部通过');
