// ページを開いて確かめる道具。ルックを足したら、これでエラーと絵を見てからサムネイルを作る。
//
// 使い方（リポジトリの直下で）:
//   node tools/cap.mjs check game-looks-7/01-hill-village-walk.html
//       横長（1000×625）とたて長（390×844）で開き、エラーを数えて、tools/out/ に絵を出す。
//       名前-sheet.jpg が 1 枚にまとめた絵（左上＝開始 2.5 秒、左下＝6.5 秒、右＝たて長）。細部は 名前-wide.png で見る。
//       エラーが 1 つでもあれば、終了コードが 1 になる。
//   node tools/cap.mjs gif game-looks-7/01-hill-village-walk.html game-looks-7/thumbs/01.gif
//       左下の説明（#cap）と HUD を消し、開始 2.5 秒から 3 秒間を、320×200・8fps の GIF にする。
//       600 KB をこえるときは、色数を 64 → 48 → 32 と減らして作りなおす。
//   ページ名のうしろに ?a=1 などの引数をつけてもよい（"game-looks-7/retro-sheet.html?p=tex" のように引用符でかこむ）。
//
// 用意する物:
//   ・playwright（Chromium つき）と ffmpeg。Claude Code のクラウドの環境には入っている。
//   ・three.js の CDN に届かない環境では、いちど  npm i --prefix tools three@0.160.0  を走らせる（tools/node_modules は .gitignore に入れてある）。
//     入っていれば、CDN の代わりにそれを読む。
//
// しくみ: ページの時計（requestAnimationFrame と performance.now）を仮想の時計に差しかえ、1/60 秒ずつ手で進める。
//   だから描画がおそい環境でも、いつも同じ時刻の同じ絵が撮れる。絵を撮らないコマは WebGL の描く命令を止めて早く進める。
//   このため、ページは時間を rAF の引数か performance.now() から取ること（setInterval / setTimeout で動かすと進まない）。
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'out');
const [mode, rel, outArg] = process.argv.slice(2);
if (!['check', 'gif'].includes(mode) || !rel || (mode === 'gif' && !outArg)) { console.error('使い方: node tools/cap.mjs check <ページ.html> ／ node tools/cap.mjs gif <ページ.html> <出力.gif>'); process.exit(2); }

let chromium = null;
for (const from of [HERE + '/', REPO + '/', '/']) { try { chromium = createRequire(from)('playwright').chromium; break; } catch { /* 次をためす */ } }
if (!chromium) { console.error('playwright が見つかりません。npm i --prefix tools playwright && npx --prefix tools playwright install chromium を走らせてください'); process.exit(2); }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.gif': 'image/gif', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(REPO, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(REPO) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(fs.readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const THREE_DIR = path.join(HERE, 'node_modules/three'), CDN = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\//;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function open(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.setDefaultTimeout(0);
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('requestfailed', r => errs.push('requestfailed: ' + r.url()));
  if (fs.existsSync(THREE_DIR)) await page.route(CDN, route => {       // 手元に three があれば、CDN の代わりに読ませる
    const f = path.join(THREE_DIR, route.request().url().replace(CDN, ''));
    if (fs.existsSync(f)) route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(f), headers: { 'access-control-allow-origin': '*' } });
    else route.fulfill({ status: 404, body: '' });
  });
  await page.addInitScript(() => {
    // 仮想の時計。rAF は __step() を呼んだときだけ進む（1 回 = 1/60 秒）
    let now = 0, q = [], id = 0; const D0 = Date.now();
    performance.now = () => now; Date.now = () => D0 + now;
    window.requestAnimationFrame = f => { q.push([++id, f]); return id; };
    window.cancelAnimationFrame = i => { q = q.filter(e => e[0] !== i); };
    window.__skip = false;
    for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) if (C) for (const m of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'drawRangeElements', 'clear']) { const f = C.prototype[m]; if (f) C.prototype[m] = function (...a) { if (!window.__skip) return f.apply(this, a); }; }
    // n コマ進める。最後の draw コマだけ絵を描く
    window.__step = (n, draw = 2) => { for (let k = 0; k < n; k++) { window.__skip = k < n - draw; now += 1000 / 60; const cur = q; q = []; for (const [, f] of cur) f(now); } window.__skip = false; };
  });
  await page.goto(base + rel);
  await page.waitForTimeout(600);
  return { page, errs, ctx };
}
const name = path.basename(rel.split('?')[0], '.html') + (rel.includes('?') ? '_' + rel.split('?')[1].replace(/[^\w.-]+/g, '_') : '');
fs.mkdirSync(OUT, { recursive: true });

if (mode === 'check') {
  let bad = 0; const o = n => path.join(OUT, `${name}-${n}`);
  for (const [tag, w, h] of [['wide', 1000, 625], ['tall', 390, 844]]) {
    const { page, errs, ctx } = await open(w, h);
    await page.evaluate(() => __step(150));                                  // 開始 2.5 秒
    await page.screenshot({ path: o(tag + '.png') });
    if (tag === 'wide') { await page.evaluate(() => __step(240)); await page.screenshot({ path: o('wide-later.png') }); }   // 6.5 秒
    console.log(`[${tag === 'wide' ? '横長' : 'たて長'}] エラー ${errs.length}`);
    for (const e of errs) console.log('   ' + e);
    bad += errs.length; await ctx.close();
  }
  await browser.close(); server.close();
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', o('wide.png'), '-i', o('wide-later.png'), '-i', o('tall.png'), '-filter_complex', '[0]scale=800:500[a];[1]scale=800:500[b];[a][b]vstack[l];[2]scale=462:1000[r];[l][r]hstack', '-q:v', '4', o('sheet.jpg')]);
  console.log('まとめの絵（左上＝2.5 秒／左下＝6.5 秒／右＝たて長）: ' + path.relative(REPO, o('sheet.jpg')));
  process.exit(bad ? 1 : 0);
} else {
  const { page, errs, ctx } = await open(640, 400);
  await page.addStyleTag({ content: '#cap,.hud,#hud{display:none!important}' });
  await page.evaluate(() => __step(150));
  const dir = fs.mkdtempSync(path.join(OUT, 'frames-'));
  for (let i = 0; i < 24; i++) { await page.evaluate(n => __step(n, 1), i % 2 ? 8 : 7); await page.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}.png`) }); }
  await ctx.close(); await browser.close(); server.close();
  const out = path.resolve(outArg); let kb = 0, colors = 0;
  for (colors of [64, 48, 32]) {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '8', '-i', path.join(dir, 'f%03d.png'), '-vf', `scale=320:200:flags=lanczos,split[a][b];[a]palettegen=max_colors=${colors}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, out]);
    kb = Math.round(fs.statSync(out).size / 1024); if (kb <= 600) break;
  }
  fs.rmSync(dir, { recursive: true });
  console.log(`GIF: ${path.relative(REPO, out)}  ${kb} KB（${colors} 色）  エラー ${errs.length}`);
  for (const e of errs) console.log('   ' + e);
  process.exit(errs.length ? 1 : 0);
}
