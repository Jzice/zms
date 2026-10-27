// 验证 dist 产物：单文件完整性 + PeerJS 双模式差异
// 同时作为 CI 门禁：关键项不满足时以非零退出码失败
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '..', 'dist');
if (!fs.existsSync(dist)) {
  console.error('[verify-dist] 没有 dist/ 目录，请先执行 npm run build');
  process.exit(1);
}
const files = fs
  .readdirSync(dist)
  .filter((f) => f.toLowerCase().endsWith('.html'))
  .sort();

if (files.length === 0) {
  console.error('[verify-dist] dist/ 下没有 HTML 产物，请先执行 npm run build');
  process.exit(1);
}

const failures = [];

for (const f of files) {
  const s = fs.readFileSync(path.join(dist, f), 'utf8');
  const extScripts = s.match(/<script[^>]+src="[^"]+"/g) || [];
  const extLinks = s.match(/<link[^>]+href="[^"]+"/g) || [];
  const isBundled = f.includes('bundled');
  const hasCdnTag = s.includes('unpkg.com/peerjs');
  const hasInlineScript = /<script[^>]*>[\s\S]{5000,}<\/script>/.test(s);
  const title = (s.match(/<title>(.*?)<\/title>/) || [])[1];

  console.log('===', f, `(${(s.length / 1024).toFixed(1)} KB) ===`);
  console.log('  peerjs CDN tag :', hasCdnTag);
  // 产物中 <style> 可能带属性（如 type="text/css"），用开标签前缀判断
  console.log('  inline <style> :', /<style[\s>]/.test(s));
  console.log('  inline <script>(big):', hasInlineScript);
  console.log('  external scripts:', extScripts.length ? extScripts.join(' | ') : '(none)');
  console.log('  external links  :', extLinks.length ? extLinks.join(' | ') : '(none)');
  console.log('  title           :', title);
  console.log('  screenLobby     :', s.includes('screenLobby'));
  console.log('  掌门杀标记      :', s.includes('掌门杀'));
  console.log('  灵魂契约        :', s.includes('灵魂契约'));
  console.log('  灵地            :', s.includes('灵地'));

  const check = (ok, msg) => {
    if (!ok) failures.push(`${f}: ${msg}`);
  };
  check(!!title, '缺少 <title>');
  check(hasInlineScript, '未内联脚本，产物不是自包含单文件');
  check(extLinks.length === 0, `存在外部样式引用：${extLinks.join(' | ')}`);
  const allowedExtScripts = isBundled ? 0 : extScripts.length;
  check(
    extScripts.length === allowedExtScripts,
    `外链脚本数量异常（bundled=0，cdn=1）实际 ${extScripts.length}`,
  );
  check(hasCdnTag === !isBundled, isBundled ? 'bundled 产物不应含 peerjs CDN 标签' : 'CDN 产物缺少 peerjs CDN 标签');
  check(s.includes('screenLobby'), '缺少界面标记，产物可能不完整');
  check(s.includes('灵魂契约') && s.includes('灵地'), '缺少玩法标记（灵魂契约/灵地）');
}

if (failures.length) {
  console.error('\n[verify-dist] 校验失败：');
  failures.forEach((x) => console.error('  ✗ ' + x));
  process.exit(1);
}
console.log('\n[verify-dist] 全部产物通过自包含单文件校验');
