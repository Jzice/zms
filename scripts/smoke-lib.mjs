// 冒烟基础设施：用 esbuild 把 TS 检查脚本打包为 ESM 后在 Node 中运行。
// 提供最小 DOM / localStorage 桩，使依赖 document 的模块（fx / actions / ui）也能在无头环境下加载。
import esbuild from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** 安装最小浏览器桩 */
export function installDomStub() {
  const el = () => ({
    style: { setProperty() {}, width: '' },
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    dataset: {},
    appendChild() {},
    remove() {},
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
    removeChild() {},
  });

  const doc = {
    body: el(),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => el(),
    addEventListener() {},
  };

  const store = new Map();
  const ls = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };

  globalThis.document = doc;
  globalThis.localStorage = ls;
  if (!globalThis.window) {
    globalThis.window = {
      document: doc,
      localStorage: ls,
      addEventListener() {},
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
    };
  }
  // 注意：Node 18+ 的 navigator 为只读 getter，不做赋值
}

/**
 * 运行一个 TS 检查脚本（相对于仓库根目录的路径）。
 * 脚本需导出默认 async 函数，返回 { fails: string[] } 或直接抛错。
 */
export async function runCheck(entryRel) {
  installDomStub();
  const root = path.resolve(import.meta.dirname, '..');
  const entry = path.resolve(root, entryRel);
  const out = path.join(os.tmpdir(), `zms-check-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    outfile: out,
    logLevel: 'silent',
    define: { '__APP_VERSION__': '"0.0.0-smoke"' },
  });
  try {
    const mod = await import(`file://${out}`);
    const fn = mod.default;
    if (typeof fn !== 'function') throw new Error('检查脚本需导出默认函数');
    return await fn();
  } finally {
    try {
      fs.unlinkSync(out);
    } catch {
      /* 忽略清理失败 */
    }
  }
}

/** 统一的主入口包装 */
export async function main(entryRel, name) {
  try {
    const res = await runCheck(entryRel);
    const fails = Array.isArray(res?.fails) ? res.fails : [];
    if (fails.length) {
      console.error(`\n[${name}] 失败项：`);
      fails.forEach((f) => console.error('  ✗ ' + f));
      process.exit(1);
    }
    console.log(`\n[${name}] 全部检查通过`);
  } catch (e) {
    console.error(`\n[${name}] 执行异常：`, e);
    process.exit(1);
  }
}
