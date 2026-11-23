// ワールド 12-16「森の旅芸人の祭り」。もとは game-looks-12/16-traveling-circus-forest.html（見るだけの場面）。
// 夜の森の広場に 旅芸人の一座。赤白しまの大テント、ほろ馬車、ちょうちんのつな、たき火、木の舞台でお手玉をする芸人と 見物の村人。
// ゲームにするために足した物：テント・舞台・馬車・木・たき火の当たり判定、舞台へのぼる木の段、森の小道の入口の門と たおれ木（ここが はし）。
// 一座と村の人 9 人と犬（とんがり帽子の芸人・おどり子・座長・占い師・手品師・語り部 など、服で役が分かる）、見物の人 8 人、しらべられる物 4 つ。
TALE_WORLD('12-16', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), FW = PACK_FWILD(THREE, K, R), D = PACK_DARK(THREE, K, R), { hash } = K, PI = Math.PI, TAU = PI * 2;
  scene.add(R.skyDome([[0, '#0c0e30'], [.5, '#1c2460'], [.85, '#3a3a78'], [1, '#6a4a7a']], { r: 380 })); scene.fog = new THREE.Fog('#2a2a58', 40, 190); G.renderer.setClearColor('#2a2a58');
  K.lights(scene, G.renderer, { sky: 0x8a90e0, ground: 0x6a4a40, amb: 1.35, sun: 0xa8b0f0, power: .8, range: 30, pos: [-20, 40, -30] });
  scene.add(K.stars(220, 360, 1.3));

  // ---- 広場（まん中 PC）と、森から来る小道。たき火・テントの口・舞台・ちょうちんの下を明るく焼きこむ ----
  const PC = [0, -22], TENT = [0, -46], STAGE = [-10, -23], FIRE = [6, -14], SRY = .85, LIT = [];
  LIT.push({ x: FIRE[0], z: FIRE[1], r: 9, c: '#ffa040', k: 1.4 }, { x: TENT[0], z: TENT[1] + 14, r: 10, c: '#ffb060', k: 1 }, { x: STAGE[0] - 2, z: STAGE[1], r: 8, c: '#ffc070', k: 1.1 }, { x: 0, z: -22, r: 16, c: '#ff9a60', k: .5 });
  for (let z = 12; z > -8; z -= 4) LIT.push({ x: 2.5, z, r: 4, c: '#ffb060', k: .55 });
  const pathX = z => z > -6 ? Math.sin(z * .12) * 2.5 : 0;
  const land = R.ground({ w: 160, d: 160, cell: 2, cz: -20, layers: [T.grass({ c: '#3e5e48', flowers: .08, fc: ['#f0e8c8'] }), T.dirt({ c: '#9a7a5a', pebbles: .5 }), T.dirt({ c: '#6a5a48' })],
    mix: (x, z) => [Math.hypot(x - PC[0], z - PC[1]) < 17 + Math.sin(Math.atan2(z - PC[1], x) * 5) * 1.5 || Math.abs(x - pathX(z)) < 1.4 ? 1 : 0, Math.hypot(x - PC[0], z - PC[1]) < 19 && Math.hypot(x - PC[0], z - PC[1]) > 16.5 ? .6 : 0],
    shade: D.lightShade(LIT, [.5, .52, .78]) }); scene.add(land.mesh);
  G.bounds(-21, 21, -37, 15.2);
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };

  // ---- 森：広場を高い木がかこむ。手前の小道の両がわにも ----
  for (let k = 0; k < 110; k++) { const a = hash(k, 1) * TAU, d = 24 + hash(k, 2) * 46, x = PC[0] + Math.cos(a) * d, z = PC[1] + Math.sin(a) * d * 1.1; if (Math.abs(x - pathX(z)) < 7 && z > -12) continue; if (z > 30) continue;
    put(R.tree({ kind: k % 3 ? 'pine' : 'tall', h: 10 + hash(k, 3) * 9, c: ['#1e3a3e', '#24443a', '#1c3248'][k % 3], seed: k }), x, z, k, 0, 'trunk'); }
  for (let k = 0; k < 40; k++) { const z = 18 - hash(k, 4) * 28, sx = k % 2 ? 1 : -1, x = pathX(z) + sx * (3 + hash(k, 5) * 4); put(k % 3 ? R.tuft({ kind: k % 2 ? 'bush' : 'flower', s: 1, seed: k % 3 }) : R.rock({ s: .35 + hash(k, 6) * .35, c: '#5a5a70', moss: .5, seed: k }), x, z, k, 0, k % 3 ? 'none' : 'round'); }
  // 足した：小道の両わきの木（森のふち。ここから外へは出られない）
  for (let k = 0; k < 14; k++) { const z = 14 - k * 2.1, sx = k % 2 ? 1 : -1, x = pathX(z) + sx * (8.5 + hash(k, 21) * 3); put(R.tree({ kind: k % 3 ? 'pine' : 'tall', h: 9 + hash(k, 22) * 6, c: ['#1e3a3e', '#24443a', '#1c3248'][k % 3], seed: k + 200 }), x, z, k, 0, 'trunk'); }

  // ---- 大きなテント：赤白しまの かべ、とがった屋根 2 つ、ふちの ひだ飾り、てっぺんの旗。入口から中のあかり ----
  const TENTS = [[0, 0, 12, 5.5, 19], [-17, 4, 6.5, 4, 11]];
  { const B = R.parts(), Wl = B.g(T.fabric({ pattern: 'stripe', c: '#c8302e', c2: '#f4e8d0', w: 8 }), { emissive: '#4a1a10' }), Rf = B.g(T.fabric({ pattern: 'stripe', c: '#c8302e', c2: '#f4e8d0', w: 8 }), { emissive: '#3a1408' }),
      Sc = B.g(T.fabric({ pattern: 'stripe', c: '#e8b830', c2: '#3a5aa8', w: 4, scallop: true }), { side: true, emissive: '#3a2a08' }), Pl = B.g(T.bark({ c: '#6a4a34' }));
    for (const [x, z, r, wh, h] of TENTS) { const n = 16, ur = Math.round(r * 1.2);
      Wl.loft(n, [[0, r, r, 0, .85, x, z], [wh, r, r, 1, 1, x, z]], { ur, seg: [0, n] });
      Rf.loft(n, [[wh, r * 1.04, r * 1.04, 0, 1, x, z], [wh + (h - wh) * .45, r * .55, r * .55, .5, 1.05, x, z], [h, .3, .3, 1, 1.15, x, z]], { ur, cap: 'top' });
      Sc.loft(n, [[wh - 1.1, r * 1.08, r * 1.08, 0, 1, x, z], [wh + .05, r * 1.06, r * 1.06, 1, 1, x, z]], { ur: ur * 2 });
      Pl.loft(5, [[h - .2, .14, .14, 0, .9, x, z], [h + 2.4, .08, .08, 2, 1, x, z]], { cap: 'top' });
      put(F.flag({ kind: 'pennant', w: 2.6, h: .7, pole: 0, c: '#e8b830', c2: '#3a5aa8' }), x, TENT[1] + z, 0, h + 1.7);
      G.circle(TENT[0] + x, TENT[1] + z, r + .2, -1, 30);
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, ex = x + Math.cos(a) * (r + 3.5), ez = z + Math.sin(a) * (r + 3.5); Pl.loft(4, [[0, .1, .1, 0, .9, ex, ez], [1, .06, .06, .5, 1, ex, ez]], { cap: 'top' }); B.g(F.tex.rope(), { side: true }).quad([ex, 1, ez], [ex + .05, 1, ez], [x + Math.cos(a) * r * 1.04 + .05, wh, z + Math.sin(a) * r * 1.04], [x + Math.cos(a) * r * 1.04, wh, z + Math.sin(a) * r * 1.04], [0, 0, 1, 4]); G.circle(TENT[0] + ex, TENT[1] + ez, .14, -1, 1); } }
    const g = B.group(); g.position.set(TENT[0], 0, TENT[1]); fixed.push(g); }
  // 入口：まき上げた布と、中のあかり（光る面）
  { const r = 12, ex = TENT[0], ez = TENT[1] + r - .02, Gq = R.geo(); Gq.quad([-2, 0, 0], [2, 0, 0], [2, 4.2, 0], [-2, 4.2, 0], [0, 0, 1, 1]); const m = Gq.mesh(T.window({ lit: 1, glass: '#ffc070', curtain: '#ffe0a0', bars: 'none', arch: 1, h: 48, frame: '#7a2a20' }), { glow: true }); m.position.set(ex, 0, ez + .1); scene.add(m);
    const h1 = D.halo({ c: '#ffb050', r: 7, k: .6 }); h1.position.set(ex, 2.2, ez + 1); scene.add(h1);
    for (const sx of [-1, 1]) put(F.flag({ kind: 'drape', w: 1.3, h: 4.4, c: '#c8302e', c2: '#e8b830', crest: 'star', cc: '#e8b830' }), ex + sx * 2.6, ez + .3, 0, 4.6);
    G.sign(0, 1.6, -33.7, { name: '大テントの入口', lines: [['中は 見物の人で ぎっしりだ。', '「月が てっぺんに来たら、空中ぶらんこの はじまり はじまり」'], '入口の すきまから、太鼓の音と わらい声が もれてくる。'] }); }

  // ---- 舞台：木の台、うしろの幕、両わきの旗、前のろうそく。足した：左わきに のぼる木の段 ----
  const at = (lx, lz) => [STAGE[0] + lx * Math.cos(SRY) + lz * Math.sin(SRY), STAGE[1] - lx * Math.sin(SRY) + lz * Math.cos(SRY)];
  { const B = R.parts(), Pl = B.g(T.planks({ c: '#8a6440' })), Cu = B.g(T.fabric({ pattern: 'plain', c: '#b03a7a' }), { side: true, emissive: '#3a1028' }), Sc = B.g(T.fabric({ pattern: 'stripe', c: '#e8b830', c2: '#c8302e', w: 4, scallop: true }), { side: true }), Bk = B.g(T.bark({ c: '#5a4030' }));
    Pl.box(8, 1.2, 5, 0, 0, 0, { m: 2 }); for (const [x, z] of [[-3.7, -2.3], [3.7, -2.3]]) Bk.loft(5, [[1.2, .16, .16, 0, .9, x, z], [6, .14, .14, 3, 1, x, z]], { cap: 'top' });
    for (let i = 0; i < 8; i++) { const x0 = -3.7 + i * 7.4 / 8, x1 = x0 + 7.4 / 8, d = i % 2 ? .25 : 0; Cu.quad([x0, 1.2, -2.3 + d], [x1, 1.2, -2.3 + (.25 - d)], [x1, 5.4, -2.3 + (.25 - d)], [x0, 5.4, -2.3 + d], [i / 4, 0, (i + 1) / 4, 2.2]); }
    Sc.quad([-3.9, 4.6, -2.0], [3.9, 4.6, -2.0], [3.9, 5.8, -2.0], [-3.9, 5.8, -2.0], [0, 0, 4, 1]);
    Pl.box(.7, .4, 1.4, -5.05, 0, -.9, { m: 2 }).box(.7, .8, 1.4, -4.35, 0, -.9, { m: 2 });   // 足した：木の段（.4 m ずつ）
    const g = B.group(); g.position.set(STAGE[0], 0, STAGE[1]); g.rotation.y = SRY; fixed.push(g);
    g.updateMatrixWorld(); for (const x of [-3, -1.5, 0, 1.5, 3]) { const p = new THREE.Vector3(x, 1.2, 2.2).applyMatrix4(g.matrixWorld); const c = D.candles({ n: 1, h: .24, light: false }); c.position.copy(p); scene.add(c); const h = D.halo({ c: '#ffc070', r: .8, k: .6 }); h.position.set(p.x, p.y + .4, p.z); scene.add(h); }
    for (const sx of [-1, 1]) { const p = new THREE.Vector3(sx * 4.3, 0, 1.6).applyMatrix4(g.matrixWorld); put(F.flag({ kind: 'banner', w: .8, h: 2.2, pole: 5, c: sx < 0 ? '#3a5aa8' : '#e8b830', crest: 'moon', cc: '#f8f0d8' }), p.x, p.z, 0, 0, 'trunk', { r: .14 }); }
    G.box(STAGE[0], STAGE[1], 8, 5, -1, 1.2, SRY); { const [x, z] = at(0, -2.3); G.box(x, z, 8, .5, 1.2, 7, SRY, true); }
    { const [x, z] = at(-5.05, -.9); G.box(x, z, .7, 1.4, -1, .4, SRY); } { const [x, z] = at(-4.35, -.9); G.box(x, z, .7, 1.4, -1, .8, SRY); }
    for (const sx of [-1, 1]) { const [x, z] = at(sx * 3.7, -2.3); G.circle(x, z, .2, -1, 7); }
    { const [x, z] = at(0, 2.9); G.sign(x, .8, z, { name: '舞台の口上の板', lines: [['「森の一座、今宵かぎりの 大興行！」', '「お手玉、おどり、手品に 占い。見物は ただ」'], '板のすみに「ぶたいに のぼらないでください」と 小さく書いてある。'] }); } }

  // ---- ほろ馬車（旅芸人の家）と、つないだ ちょうちんのつな ----
  const CARTS = [[-16, -32, .9, '#3a7a6a'], [17, -36, -.8, '#3a5aa8'], [-20, -16, 1.6, '#e8b830'], [21, -8, -1.9, '#8a3a7a']];
  for (const [x, z, ry, c] of CARTS) put(F.wagon({ cover: c, load: 'barrels', c: '#8a5a3a' }), x, z, ry, 0, 'wall');
  const LANT = [], ROPES = [[[-16, 4.2, -30], [0, 6, -34]], [[0, 6, -34], [17, 4.2, -34]], [[-20, 3.6, -16], [-7, 5, -26]], [[-7, 5, -26], [8, 5, -26]], [[8, 5, -26], [21, 3.6, -8]], [[-20, 3.6, -16], [-6, 4, -6]], [[6, 4, -6], [21, 3.6, -8]], [[-6, 4, -6], [6, 4, -6]]];
  for (const [x, z] of [[-6, -6], [6, -6], [-7, -26], [8, -26], [0, -34]]) { put(R.geo().loft(5, [[0, .12, .12, 0, .8], [(x === 0 ? 6 : z < -20 ? 5 : 4) + .2, .1, .1, 3, 1]], { cap: 'top' }).mesh(T.bark({ c: '#5a4030' })), x, z); G.circle(x, z, .16, -1, 6); }
  { const Rp = R.geo(); for (const [a, b] of ROPES) { const n = 9, pt = u => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * PI) * .8, a[2] + (b[2] - a[2]) * u];
      for (let i = 0; i < n; i++) { const p0 = pt(i / n), p1 = pt((i + 1) / n), dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], L = Math.hypot(dx, dy, dz); Rp.at(R.TR(p0[0], p0[1], p0[2], Math.atan2(dx, dz), Math.acos(dy / L))).loft(3, [[0, .02, .02, 0, 1], [L, .02, .02, 1, 1]], {}).at(null); if (i) LANT.push(pt(i / n)); } }
    fixed.push(Rp.mesh(T.bark({ c: '#3a2a24' }))); }
  const LC = ['#ff6a4a', '#ffd060', '#7ad0ff', '#ff9ad0', '#a8f070'];
  { const Gl = R.geo(); LANT.forEach(([x, y, z]) => { Gl.tint(1).loft(6, [[y - .5, .1, .1, 0, 1, x, z], [y - .38, .2, .2, .3, 1, x, z], [y - .2, .2, .2, .7, 1, x, z], [y - .1, .08, .08, 1, 1, x, z]], { cap: 'both' }); });
    const lm = new THREE.Mesh(Gl.build(), R.mat(T.fabric({ pattern: 'plain', c: '#ffe8c0' }), { glow: true, vc: true })); scene.add(lm);
    LANT.forEach(([x, y, z], i) => { const h = D.halo({ c: LC[i % 5], r: 1.2, k: .7 }); h.position.set(x, y - .3, z); scene.add(h); }); }

  // ---- たき火：まるた、石の輪、火。まわりに すわる丸太 ----
  { const B = R.parts(), Bk = B.g(T.bark({ c: '#6a4a34' })); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; Bk.at(R.TR(FIRE[0], .12, FIRE[1], a, PI / 2 - .35)).loft(5, [[-.1, .1, .1, 0, .8], [.9, .08, .08, 1, 1]], {}).at(null); }
    for (const a of [.3, 2.3, 4.3]) { Bk.at(R.TR(FIRE[0] + Math.cos(a) * 3, .25, FIRE[1] + Math.sin(a) * 3, -a, PI / 2)).loft(6, [[-1.2, .26, .26, 0, .9], [1.2, .26, .26, 1, 1]], { cap: 'both' }).at(null); G.box(FIRE[0] + Math.cos(a) * 3, FIRE[1] + Math.sin(a) * 3, .5, 2.4, -1, .5, -a); }
    fixed.push(B.group()); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; put(R.rock({ s: .35, c: '#6a6478', seed: k }), FIRE[0] + Math.cos(a) * .95, FIRE[1] + Math.sin(a) * .95, k); }
    G.circle(FIRE[0], FIRE[1], 1.25, -1, 3);
    G.sign(FIRE[0], .6, FIRE[1] + 1.3, { name: 'たき火', lines: [['ぱちぱちと 火の粉が 夜空へ のぼっていく。', 'あたたかい。'], 'だれかが 木の実を あぶっているらしい。いいにおいだ。'] }); }
  const flame = D.flame({ s: 2.4 }); flame.position.set(FIRE[0], .05, FIRE[1]); scene.add(flame);
  const fh = D.halo({ c: '#ff9040', r: 6, k: .8 }); fh.position.set(FIRE[0], 1.2, FIRE[1]); scene.add(fh);
  const sparks = D.flakes({ kind: 'ember', n: 24, box: [1.4, 3.5, 1.4] }); sparks.position.set(FIRE[0], 0, FIRE[1]); scene.add(sparks);
  scene.add(D.pools([{ p: [FIRE[0], 0, FIRE[1]], r: 5, c: '#ff9a48', k: .5 }, { p: [TENT[0], 0, TENT[1] + 14], r: 5, c: '#ffb060', k: .4 }]));

  // ---- 足した：小道の入口の門（ちょうちんと三角旗）と、うしろの たおれ木（ここが はし） ----
  { const gz = 7, gx = pathX(gz), Bk = R.geo();
    for (const sx of [-1, 1]) { Bk.loft(5, [[0, .14, .14, 0, .8, gx + sx * 2.2, gz], [4.2, .11, .11, 3, 1, gx + sx * 2.2, gz]], { cap: 'top' }); G.circle(gx + sx * 2.2, gz, .18, -1, 5); }
    Bk.at(R.TR(gx - 2.4, 4, gz, PI / 2, PI / 2)).loft(5, [[0, .1, .1, 0, .9], [4.8, .1, .1, 2, 1]], { cap: 'both' }).at(null); fixed.push(Bk.mesh(T.bark({ c: '#5a4030' })));
    fixed.push(F.bunting({ from: [gx - 2.2, 3.7, gz], to: [gx + 2.2, 3.7, gz], n: 7, cs: ['#c8302e', '#e8b830', '#3a5aa8', '#f4e8d0'] }));
    put(F.flag({ kind: 'banner', w: .7, h: 1.4, pole: 0, c: '#c8302e', c2: '#e8b830', crest: 'star', cc: '#e8b830' }), gx - 1.2, gz, 0, 3.9); put(F.flag({ kind: 'banner', w: .7, h: 1.4, pole: 0, c: '#3a5aa8', c2: '#e8b830', crest: 'moon', cc: '#f8f0d8' }), gx + 1.2, gz, 0, 3.9);
    G.sign(gx + 2.7, 1.2, gz, { name: '入口の立てふだ', lines: [['「旅芸人の一座 森の広場に 三晩だけ」', '「ちょうちんの明かりを たどって どうぞ」']] });
    const lz = 15, lx = pathX(lz), Lg = R.geo(); Lg.at(R.TR(lx, .35, lz, PI / 2, PI / 2)).loft(7, [[-5, .38, .38, 0, .9], [5, .32, .32, 3, 1]], { cap: 'both' }).at(null); fixed.push(Lg.mesh(T.bark({ c: '#5a4434' }))); G.box(lx, lz, 10, .8, -1, .7, 0);
    for (let k = 0; k < 5; k++) put(R.tuft({ kind: 'bush', s: 1.3, seed: k }), lx - 4 + k * 2, lz + .9, k); }
  // 足した：馬車のわきの 木箱と たる
  put(R.crate({ s: .9, kind: 'x' }), -17.6, -19.6, .3, 0, 'box'); put(R.barrel({ c: '#6a4a34' }), -18.6, -18.4, 0, 0, 'round'); put(R.crate({ s: .8 }), 15, -33, .5, 0, 'box');
  scene.add(R.merge(fixed));
  scene.add(R.backdrop({ c: '#141a38', haze: '#2a2a58', r: 300, h: 40, y: -4 }));

  // ---- ほたる ----
  const bugs = [...Array(14)].map(() => { const b = FW.bug({ s: .8, c: '#d8ff70' }); scene.add(b); return b; });

  // ---- 人（TL.person。主人公と同じ 4.5 頭身の作り）。芸人は とんがり帽子や派手な服、村の人は むぎわら帽子や前かけ ----
  const person = (o, x, z, ry, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return p; };
  const folk = (o, x, z, ry, d, y) => G.npc(person(o, x, z, ry, y), d);
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const SY = 1.2, sg = new THREE.Vector3(0, SY, .4).applyAxisAngle(new THREE.Vector3(0, 1, 0), SRY).add(new THREE.Vector3(STAGE[0], 0, STAGE[1])), SF = [Math.sin(SRY), Math.cos(SRY)];
  const facePC = (x, z) => Math.atan2(PC[0] - x, PC[1] - z);
  // お手玉の芸人：赤い とんがり帽子に、黄と赤の服
  const juggle = (t, o) => { const J = o.userData.J; R.idle(o, t, 0); J.armL.rotation.set(-1.1 + Math.sin(t * 6) * .25, 0, .3); J.armR.rotation.set(-1.1 - Math.sin(t * 6) * .25, 0, -.3); J.foreL.rotation.x = J.foreR.rotation.x = -.6; };
  const jug = folk({ size: 'normal', hat: 'wizard', hatC: '#c8302e', hair: 'wolf', head: { hair: '#e86a3a', eyes: 'big', mouth: 'open', blush: true }, colors: { tunic: '#e8b830', vest: '#c8302e', linen: '#f4e8d0', pants: '#3a5aa8', boot: '#c8302e', scarf: '#3a5aa8', trim: '#c8302e' } }, sg.x, sg.z, facePC(sg.x, sg.z),
    { name: 'お手玉の芸人', idle: juggle, lines: [['ほい、ほい、ほいっと！', '玉が 三つなら、目は 六つ ほしいところさ。'], ['このとんがり帽子かい？ 一座の 道化の しるしさ。', 'これを かぶると、ふしぎと 手が 早くなる。'], '舞台の わきに 木の段がある。のぼって 近くで見るかい？'] }, SY);
  const balls = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.11, 0), R.mat(T.fabric({ pattern: 'check', c: ['#ff5a4a', '#5ac0ff', '#f0e060'][i], c2: '#ffffff', w: 4 }), { glow: true })); scene.add(m); return m; });
  // おどり子：舞台の上を くるくる回る（足もとの高さは 舞台の上）
  const dancer = folk({ size: 'normal', outfit: 'robe', hair: 'center', head: { hair: '#2a2228', eyes: 'big', mouth: 'smile', blush: true }, colors: { tunic: '#c8302e', trim: '#e8b830', belt: '#e8b830', scarf: '#e8b830' } }, sg.x, sg.z, 0,
    { name: 'おどり子', path: loop([0, 1, 2, 3, 4, 5].map(i => [sg.x + .5 + Math.cos(i / 6 * TAU) * 1.4, sg.z + Math.sin(i / 6 * TAU) * 1.2])), speed: 1.2, lines: [['ららら、くるりん。', '目が回らないかって？ 回るのは 世界のほうよ。'], ['霧の王国の 図書館の塔には、おどりの本も あるんですって。', 'いつか 読みに 行きたいわ。']] }, SY);
  dancer.flyY = SY;
  // 座長：大テントの入口の前。黒いベストに 赤い上着、ひげ
  folk({ size: 'tall', hat: 'beret', hatC: '#1e1e2a', hair: 'center', bulk: 1.1, head: { hair: '#3a2a24', skin: '#e0b088', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'mustache' }, colors: { tunic: '#c8302e', vest: '#1e1e2a', linen: '#f4e8d0', pants: '#1e1e2a', boot: '#3a2a24', scarf: '#e8b830', trim: '#e8b830' } }, 3.2, -32.4, .1,
    { name: '一座の座長', lines: [['ようこそ、森の一座へ！', '今宵の 大テントは 満員御礼でございます。'], ['わが一座は、北の がけの港から 船で来たのです。', '馬車ごと 空を わたるのは、なかなか ゆかいですよ。'], '次の祭りは、ネオンの 港町で ひらく つもりです。'] });
  // 占い師：小さなテントの前。深い フードで 顔が かげる
  folk({ size: 'small', outfit: 'robe', hat: 'hood', hatC: '#3a2a5a', hair: 'center', head: { hair: '#c8c0d8', eyes: 'small', mouth: 'line' }, colors: { tunic: '#3a2a5a', trim: '#c8a8f0', scarf: '#6a3a8a' } }, -11.8, -35.2, facePC(-11.8, -35.2),
    { name: '占い師', lines: [['……あなたの 行く先に、大きな塔が 見える。', '本の においが する塔よ。'], ['星が言っている。', '「ちょうちんの 青い玉の下で、よいことが ある」……かもしれない。'], 'お代は いらないわ。森の夜は、ただで 占う きまりなの。'] });
  // 手品師：舞台の 右わき。紺の とんがり帽子と ローブ、つえ
  folk({ size: 'tall', outfit: 'robe', hat: 'wizard', hatC: '#2a3a7a', hold: 'staff', hair: 'swept', head: { hair: '#d8d8e0', eye: '#5a8ac8', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#2a3a7a', trim: '#e8b830', belt: '#e8b830' } }, -3.8, -16.2, facePC(-3.8, -16.2) + .6,
    { name: '手品師', lines: [['このつえを ひとふりすると……', 'ほら、ちょうちんの色が 変わった！ ……ように 見えたろう？'], ['手品の たねは、ひとつも ない。', '……とは 言わないでおこう。']] });
  // たき火の語り部（話しかけると 立ち上がる）と、すわっている 見物の人
  const sitPose = p => { const J = p.userData.J; J.legL.rotation.x = J.legR.rotation.x = -1.45; J.shinL.rotation.x = J.shinR.rotation.x = 1.5; J.armL.rotation.x = -.8; J.foreL.rotation.x = -1; J.armR.rotation.x = -.8; J.foreR.rotation.x = -1; };
  const sitAt = a => { const x = FIRE[0] + Math.cos(a) * 3, z = FIRE[1] + Math.sin(a) * 3; return [x, z, Math.atan2(FIRE[0] - x, FIRE[1] - z)]; };
  { const [x, z, ry] = sitAt(.3), o = { size: 'small', outfit: 'robe', hair: 'center', head: { hair: '#e8e8e8', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'beard' }, colors: { tunic: '#6a5a3a', trim: '#c8a060' } }, p = TL.person(o), y = .55 - p.userData.hipY;
    p.position.set(x, Math.max(0, y), z); p.rotation.y = ry; scene.add(p);
    G.npc(p, { name: 'たき火の語り部', idle: (t, o2) => { R.idle(o2, t, Math.sin(t * .4) * .3); sitPose(o2); }, lines: [['むかし むかし、空に くじらが 泳いでおった。', 'その背中には、小さな町が のっておったそうな。'], ['……そのくじらは 今も、どこかの空を 泳いでおる。', 'わしは そう 信じておるよ。']] }); }
  const sitters = [[2.3, { size: 'normal', hat: 'beret', hatC: '#8a3a5a', hair: 'swept', head: { hair: '#4a3a30', mouth: 'smile', blush: true }, colors: { tunic: '#8a3a5a', vest: '#e8d8b0', pants: '#3a3a44' } }], [4.3, { size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#6a7a3a', hair: 'wolf', head: { hair: '#4a3a30', mouth: 'smile' }, colors: { linen: '#6a7a3a', pants: '#3a3a44' } }]].map(([a, o]) => { const [x, z, ry] = sitAt(a), p = TL.person(o); p.position.set(x, Math.max(0, .55 - p.userData.hipY), z); p.rotation.y = ry; scene.add(p); return p; });
  // 見物の村人（話せるのは むぎわら帽子の おじさん）と、まわりの見物の人
  const crowd = [];
  const CROWD = [{ hat: 'kerchief', hatC: '#c87a3a', tunic: '#4a7a5a' }, { hat: 'straw', tunic: '#c87a3a', outfit: 'apron' }, { tunic: '#5a5a9a' }, { tunic: '#8a4a3a', hat: 'cap', hatC: '#4a3a30' }, { size: 'child', tunic: '#e8d8b0' }, { tunic: '#6a3a6a', outfit: 'apron' }, { tunic: '#3a6a8a', hat: 'kerchief', hatC: '#e8b830' }, { tunic: '#a83a4a' }, { size: 'child', tunic: '#7a8a4a', hat: 'beret', hatC: '#c8302e' }, { tunic: '#d88aa8', hat: 'straw' }];
  CROWD.forEach((c, i) => { const u = ((i % 5) - 2) * 1.5 + (i > 4 ? .7 : 0) + (hash(i, 3) - .5) * .5, d = 5 + (i > 4 ? 1.8 : 0) + hash(i, 4) * .5, x = sg.x + SF[0] * d + SF[1] * u, z = sg.z + SF[1] * d - SF[0] * u, ry = Math.atan2(sg.x - x, sg.z - z);
    const o = { size: c.size || (i % 4 === 3 ? 'tall' : 'normal'), outfit: c.outfit, hat: c.hat, hatC: c.hatC, hair: ['swept', 'center', 'wolf'][i % 3], head: { hair: ['#3a2a24', '#6a4a3a', '#2a2228'][i % 3], mouth: i % 2 ? 'open' : 'smile', blush: i % 2 === 0, beard: i === 3 ? 'beard' : undefined }, colors: { tunic: c.tunic, vest: '#f0e4c8', pants: '#4a3a34' } };
    if (i === 1) { folk({ ...o, size: 'tall', outfit: 'worker', hat: 'straw', head: { hair: '#7a6a5a', skin: '#d8a070', eyes: 'small', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#c87a3a', pants: '#5a4a3a' } }, x, z, ry,
      { name: '見物の 村のおじさん', lines: [['いやあ、一年に いちどの たのしみだよ。', '畑しごとの つかれが ふっとぶ。'], ['うちの むすこが、一座に 入りたいと 言いだしてね。', '……まあ、気持ちは わかるよ。']] }); return; }
    const p = person(o, x, z, ry); p.userData.ry0 = ry; crowd.push(p); });
  // 村の子（小道と広場を かけまわる）
  folk({ size: 'child', hat: 'cap', hatC: '#e8b830', hair: 'wolf', head: { hair: '#4a3a30', eye: '#3a7a5a', mouth: 'open', blush: true }, colors: { tunic: '#6a8a3a', vest: '#c85a3a', pants: '#4a3a34', scarf: '#e8b830' } }, 0, 0, 0,
    { name: '村の子', path: loop([[1.2, 4], [-.6, -8], [-3, -14], [2, -19], [5, -9], [2.8, 2]]), speed: 2.6, lines: [['お手玉の人、すごいんだよ！', '玉が 空中で とまって 見えるの！'], ['ぼくね、大きくなったら 一座に 入るんだ。', 'でも とうちゃんには ないしょ。']] });
  // 馬車の番の人：作業着に 前かけ
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#3a7a6a', hair: 'center', head: { hair: '#c8603a', eye: '#4a6a9a', mouth: 'smile' }, colors: { tunic: '#3a7a6a', apron: '#e8d8b0' } }, -16.6, -18.2, .9,
    { name: '衣装係の おねえさん', lines: [['この馬車は、ぜんぶ 衣装と 小道具よ。', 'とんがり帽子だけで、二十も あるの。'], 'ほつれた ところを、夜のうちに ぬっておかなくちゃ。'] });
  // 一座の犬（たき火のまわりを ぐるぐる）
  const dog = R.cat({ c: '#c8a070', belly: '#f0e4c8', s: 1.4 }); scene.add(dog);
  G.npc(dog, { name: '一座の犬', r: .3, head: .45, path: loop([0, 1, 2, 3, 4, 5, 6, 7].map(i => [FIRE[0] + Math.cos(i / 8 * TAU) * 4.6, FIRE[1] + Math.sin(i / 8 * TAU) * 4.6])), speed: 2.3, idle: t => R.catPose(dog, 'walk', t * 1.4), lines: ['わん！', '……（しっぽを ぶんぶん ふっている）', 'くぅん。'] });

  // ---- あかり（たき火・舞台・主人公のまわり） ----
  const pl = new THREE.PointLight('#ffa050', 22, 16, 1.4); pl.position.set(FIRE[0], 1.4, FIRE[1]); scene.add(pl);
  const pl2 = new THREE.PointLight('#ffc080', 40, 16, 1.3); pl2.position.set(sg.x + SF[0] * 3, 4, sg.z + SF[1] * 3); scene.add(pl2);
  const pl3 = new THREE.PointLight('#ffd0a0', 6, 7, 1.5); scene.add(pl3);

  // ---- はじめの場所と 自動で歩く道 ----
  G.spawn(pathX(12.5), 12.5, PI);
  G.tour([[pathX(7), 6], [0, -4], [1.4, -10], [2, -18.5], [9.6, -20], [3, -29], [-2, -30], [-6.5, -28], [-11, -32.5], [-9, -17], [-2, -12], [pathX(4), 4], [pathX(12), 12]]);

  // ---- 毎コマ：お手玉、見物の人、すわる人、ほたる、火 ----
  G.tick((t, dt, P) => {
    { const o = jug.o, fwd = new THREE.Vector3(Math.sin(o.rotation.y), 0, Math.cos(o.rotation.y)), side = new THREE.Vector3(fwd.z, 0, -fwd.x), on = !jug.talk;
      balls.forEach((b, i) => { const ph = (t * 1.5 + i / 3) % 1, s = Math.cos(ph * TAU) * .32, h = on ? Math.sin(ph * PI) * 1.1 : .1 * i; b.position.set(o.position.x + fwd.x * .45 + side.x * s, SY + 1.15 + h, o.position.z + fwd.z * .45 + side.z * s); }); }
    crowd.forEach((p, i) => { const J = p.userData.J, ch = Math.max(0, Math.sin(t * 2 + i * 1.7)); R.idle(p, t + i, Math.sin(t * .3 + i) * .2); if (i % 3 === 0) { J.armL.rotation.set(-2.4 * ch, 0, .3); J.armR.rotation.set(-2.4 * ch, 0, -.3); } else if (i % 3 === 1) { J.armL.rotation.set(-1.2, 0, .5 + Math.sin(t * 8 + i) * .2); J.armR.rotation.set(-1.2, 0, -.5 - Math.sin(t * 8 + i) * .2); J.foreL.rotation.x = J.foreR.rotation.x = -1.2; } p.position.y = Math.abs(Math.sin(t * 4 + i)) * .06 * (i % 3 === 0 ? 1 : 0); });
    sitters.forEach((p, i) => { R.idle(p, t + i * 2, Math.sin(t * .4 + i * 2) * .4); sitPose(p); if (i === 0) p.userData.J.armR.rotation.x = -.8 + Math.sin(t * 7) * .2; });
    bugs.forEach((b, i) => { const a = t * .3 + i * .9; b.position.set(P.x + Math.sin(a + i) * (4 + i % 4), 1 + Math.sin(t * .7 + i) * .8 + (i % 3) * .6, P.z - 3 + Math.cos(a * 1.3) * 5); b.rotation.y = a; FW.bugPose(b, t + i); });
    pl3.position.set(P.x + 1, P.y + 2.5, P.z - 1);
    fh.material.opacity = .7 + Math.sin(t * 9) * .08 + Math.sin(t * 13) * .05; pl.intensity = 22 + Math.sin(t * 11) * 3;
    F.tick(t); D.tick(t, G.cam); });
});
