// ゲーム 06「ものがたりの世界をめぐる」のワールドを確かめる道具。絵は cap.mjs で撮り、こちらは遊べるかを見る。
//   node tools/tale-check.mjs 8-01
//   1) ページのエラー（pageerror と console.error）を数える
//   2) 話せる人・物の数を数え、全員に順に話しかけて（ページを最後まで送って）、エラーが出ないか見る
//   3) ?auto=1 で 8 秒歩かせ、主人公が どれだけ動いたか（3 m 未満なら閉じこめられている。重い機械では道のりが へるので、ゆるめにしてある）、地面より下へ落ちていないかを見る
//   4) はじめの場所が、かべの箱の中に入っていないかを見る
// 終了コード: 問題がなければ 0、あれば 1
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..'), id = process.argv[2];
if (!id) { console.error('使い方: node tools/tale-check.mjs <ワールドの id（例 8-01）>'); process.exit(2); }
let chromium = null; for (const from of [HERE + '/', REPO + '/', '/']) { try { chromium = createRequire(from)('playwright').chromium; break; } catch { /* 次 */ } }
const local3 = path.join(HERE, 'node_modules/three/build/three.module.js');
const srv = http.createServer((q, r) => { const p = path.join(REPO, decodeURIComponent(q.url.split('?')[0])); try { const b = fs.readFileSync(p); r.writeHead(200, { 'content-type': p.endsWith('.js') || p.endsWith('.mjs') ? 'text/javascript' : 'text/html; charset=utf-8' }); r.end(b); } catch { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok)); const port = srv.address().port;
const br = await chromium.launch(); let bad = 0; const errs = [];
// 0) 行のうしろの // コメントのあとに、処理が書かれていないか（コメントのあとは消えるので、何度もこれで壊れた）
for (const f of ['games/06-tale-worlds/core.js', `games/06-tale-worlds/worlds/${id}.js`, 'game-looks-13/pack-tale.js']) { const src = fs.existsSync(path.join(REPO, f)) ? fs.readFileSync(path.join(REPO, f), 'utf8') : '';
  src.split('\n').forEach((l, i) => { const m = l.match(/[;{})\]]\s*\/\/(.*)$/); if (m && !/https?:/.test(l) && /(;|\{|\})\s*(const|let|if|for|return|[A-Za-z_$][\w$.]*\s*(\+=|-=|=(?!=)|\())/.test(m[1])) errs.push(`コメントのあとに処理がある: ${f}:${i + 1}`); }); }
async function open(qs) {
  const pg = await br.newPage({ viewport: { width: 960, height: 600 } });
  if (fs.existsSync(local3)) await pg.route('**/three.module.js', rt => rt.fulfill({ path: local3, contentType: 'text/javascript' }));
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push('console.error: ' + m.text()); if (m.type() === 'warning' && /村人の動きでエラー/.test(m.text())) errs.push('warn: ' + m.text()); });
  await pg.goto(`http://127.0.0.1:${port}/games/06-tale-worlds/index.html?dev=1&w=${id}&${qs}`);
  await pg.waitForFunction(() => window.__tale && window.__tale.state && window.__tale.npcs, null, { timeout: 60000 }); await pg.waitForTimeout(800); return pg; }
try {
  // 2) 話す
  let pg = await open('at=0,0,0&noauto=1');
  const info = await pg.evaluate(() => { const G = window.__tale; return { n: G.npcs.length, people: G.npcs.filter(n => !n.thing).length, things: G.npcs.filter(n => n.thing).length, title: document.title }; });
  console.log(`話せる人 ${info.people}、しらべる物 ${info.things}`);
  for (let i = 0; i < info.n; i++) {
    await pg.evaluate(i => { const G = window.__tale, c = G.npcs[i], s = G.state, p = c.o.position; s.x = p.x; s.z = p.z + 1.1; s.y = p.y; s.ry = Math.PI; s.ground = true; s.vy = 0; }, i);
    await pg.waitForTimeout(150); for (let k = 0; k < 8; k++) { await pg.evaluate(() => window.__tale.act()); await pg.waitForTimeout(60); }
  }
  await pg.waitForTimeout(300); await pg.close();
  // 4) はじめの場所 と 3) 自動で歩く
  pg = await open('auto=1');
  const s0 = await pg.evaluate(() => { const G = window.__tale, s = G.state; return { x: s.x, y: s.y, z: s.z, inWall: G.dbg(s.x, s.z).some(b => b.hx !== undefined && b.y0 < s.y + 1 && b.y1 > s.y + .45 && (() => { const dx = s.x - b.x, dz = s.z - b.z, lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c; return Math.abs(lx) < b.hx && Math.abs(lz) < b.hz; })()) }; });
  if (s0.inWall) { bad++; console.log('× はじめの場所が かべの箱の中にある'); }
  let path0 = 0, prev = s0, minY = 99; for (let i = 0; i < 16; i++) { await pg.waitForTimeout(500); const s = await pg.evaluate(() => { const t = window.__tale.state; return { x: t.x, y: t.y, z: t.z }; }); path0 += Math.hypot(s.x - prev.x, s.z - prev.z); minY = Math.min(minY, s.y - 0); prev = s; }
  console.log(`8 秒で歩いた道のり ${path0.toFixed(1)} m（はじめ ${s0.x.toFixed(1)}, ${s0.y.toFixed(1)}, ${s0.z.toFixed(1)} → いま ${prev.x.toFixed(1)}, ${prev.y.toFixed(1)}, ${prev.z.toFixed(1)}）`);
  if (path0 < 3) { bad++; console.log('× 主人公があまり動かない（閉じこめられている／道 G.tour が かべにぶつかる）'); }
  if (minY < -5) { bad++; console.log('× 主人公が下へ落ちた（地面 G.ground か 足場の箱がない所がある）'); }
  await pg.close();
} catch (e) { bad++; errs.push('道具のエラー: ' + e.message); }
for (const e of [...new Set(errs)]) console.log('× ' + e); bad += errs.length;
console.log(bad ? `問題 ${bad} 件` : '問題なし'); await br.close(); srv.close(); process.exit(bad ? 1 : 0);
