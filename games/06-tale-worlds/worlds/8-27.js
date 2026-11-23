// ワールド 8-27「廃工場の中の光」。もとは game-looks-8/27-factory-light.html（見るだけの場面）。
// のこぎり屋根の工場の中。天窓から光のすじが何本も落ち、光の当たる床に草と若い木が生える。さびた機械・ボイラー・天井クレーン。
// ゲームにするために足した物：かべ・はしら・機械・タンクの当たり判定（南のかべの大きな口から外の草地へ出られる）、乗れる機械と木箱の段、
// 工場に集まる人 8 人と しか、しらべられる物 4 つ、工場の敷地をかこむ さく。
TALE_WORLD('8-27', G => {
  const { THREE, K, R, T, TL, scene } = G, PK = PACK_RUINS(THREE, K, R), PT = PK.tex, { hash } = K, TR = R.TR, PI = Math.PI;
  scene.add(R.skyDome([[0, '#6aa6d8'], [.6, '#a8d4dc'], [.88, '#e6ecc8'], [1, '#fff2c4']], { r: 380 })); scene.fog = new THREE.Fog('#ead9b0', 46, 230);
  K.lights(scene, G.renderer, { sky: 0xfff0d8, ground: 0xc8a878, amb: 1.85, sun: 0xffdc9c, power: 2.2, range: 30, map: 2048, pos: [30, 48, 0] });
  const SUN = new THREE.Vector3(.5, .8, 0).normalize();

  // ---- 工場と、天窓から落ちる光。光の落ちる床の場所（POOL）を先に決める ----
  const FW = 48, FD = 30, FH = 8, RISE = 3, fac = PK.factory({ w: FW, d: FD, h: FH, teeth: 8, rise: RISE, open: .3, c: '#b8805e', holes: .6, peel: .5, seed: 1 }); fac.traverse(o => { if (o.isMesh) o.castShadow = false; }); scene.add(fac);
  const SY = FH + RISE / 2, DX = SY * SUN.x / SUN.y, DZ = SY * SUN.z / SUN.y, POOL = [[2, 2], [3, 1], [3, 3], [4, 2], [5, 1], [5, 3], [6, 2], [6, 0], [7, 3], [7, 1], [1, 1], [1, 3], [4, 4], [2, 0]].map(([k, j]) => [-FW / 2 + (k + 1) * 6 - DX, -12 + j * 6 - DZ]);
  const dyn = []; POOL.forEach(([x, z], i) => { const s = PK.shaft({ w: 3.8, h: SY, dx: DX, dz: DZ, a: .5, seed: i, c: '#ffe9a8' }); s.position.set(x, 0, z); scene.add(s); dyn.push(s); });
  // 工場のかべ（上には乗れない）。南のかべは まん中（x = ±7.2）が大きく ぬけていて、外の草地へ出られる。中の鉄骨のはしらは 6 m おき
  { const a = FW / 2, b = FD / 2, gap = .3 * a; G.box(0, -b, FW + .4, .4, -1, 12, 0, true); G.box(a, 0, .4, FD + .4, -1, 12, 0, true); G.box(-a, 0, .4, FD + .4, -1, 12, 0, true);
    G.box((-a - gap) / 2, b, a - gap, .4, -1, 12, 0, true); G.box((a + gap) / 2, b, a - gap, .4, -1, 12, 0, true); G.box(0, b, 2 * gap, .4, 5.4, 12, 0, true);
    for (let k = 1; k < 8; k++) for (let j = 1; j < 5; j++) G.circle(-a + k * 6, -b + j * 6, .35, -1, FH); }

  // ---- 地面：ひびわれた床（中）＋草（外と、中の光の当たる所）＋こけ ----
  const cl = v => Math.max(0, Math.min(1, v)), vn = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); return (hash(ix, iz) * (1 - sx) + hash(ix + 1, iz) * sx) * (1 - sz) + (hash(ix, iz + 1) * (1 - sx) + hash(ix + 1, iz + 1) * sx) * sz; };
  const inside = (x, z) => Math.abs(x) < FW / 2 && Math.abs(z) < FD / 2, pool = (x, z) => { let k = 0; for (const [px, pz] of POOL) k = Math.max(k, 1 - Math.hypot(x - px, (z - pz) * 1.25) / 3.4); return cl(k); }, GR = T.grass({ c: '#6cae4c', flowers: .3, fc: ['#ffffff', '#ffe27a'] });
  const land = R.ground({ w: 104, d: 88, cell: 2, layers: [PT.asphalt({ c: '#a48c72', line: 'none', grass: .5, m: 4 }), GR, PT.moss({ flowers: .5 })],
    mix: (x, z) => inside(x, z) ? [cl(pool(x, z) * 2.2 - .5 + (vn(x / 3, z / 3) - .5) * .8), cl((vn(x / 4 + 7, z / 4) - .62) * 6) * (1 - pool(x, z))] : [1, 0],
    shade: (x, z) => { if (!inside(x, z)) return [1, 1, .96]; const k = pool(x, z) ** .7; return [.76 + .6 * k, .72 + .56 * k, .68 + .3 * k]; } });
  scene.add(land.mesh); const outer = R.ground({ w: 704, d: 704, cell: 32, layers: [GR] }); outer.mesh.position.y = -.1; scene.add(outer.mesh);
  G.ground(() => 0); G.bounds(-36, 36, -26, 31);

  // ---- さびた機械。A＝はずみ車のついた旋盤、B＝ねかせたボイラー、C＝計器の箱 ----
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const BARE = PT.rust({ c: '#8e5c40', panel: 0, m: 1.5 }), GAUGE = PT.clock({}), SPOKE = PT.spoke({});
  function machine(kind, c, sd = 0) { const B = R.parts(), Gp = B.g(PT.rust({ paint: c, peel: .45, seed: sd % 2, m: 1.5 })), Gb = B.g(BARE).smooth(1), Gg = B.g(GAUGE, { offset: true }), Gs = B.g(SPOKE, { side: true });
    const dial = (x, y, z, s = .36) => Gg.quad([x - s / 2, y - s / 2, z], [x + s / 2, y - s / 2, z], [x + s / 2, y + s / 2, z], [x - s / 2, y + s / 2, z]);
    if (kind === 'A') { Gp.box(2.8, .8, 1, 0, 0, 0, { m: 1.5, c0: .78 }).box(.95, 1.05, .9, -.85, .8, 0, { m: 1.5, taper: .84 }).box(.55, .5, .6, .95, .8, 0, { m: 1.5, taper: .9 });
      Gb.at(TR(-.3, 1.22, 0, 0, 0, PI / 2)).loft(8, [[-.75, .11, .11, 0, .8], [.9, .11, .11, 1, 1]], { cap: 'both' }).at(TR(-.85, 0, -.2)).loft(6, [[1.8, .09, .09, 0, .9], [3.6, .09, .09, 1.2, 1], [3.9, .2, .2, 1.3, 1.05]], { cap: 'top' }).at(null);
      Gs.quad([-1.44, .55, -.65], [-1.44, .55, .65], [-1.44, 1.85, .65], [-1.44, 1.85, -.65]); dial(-.85, 1.35, .42); dial(.95, 1.05, .31, .26); }
    else if (kind === 'B') { Gp.smooth(2).at(TR(0, 1.2, 0, 0, 0, PI / 2)).loft(10, [[-1.6, .45, .45, 0, .78], [-1.35, .85, .85, .2, .9], [1.35, .85, .85, 1.8, 1], [1.6, .45, .45, 2, .9]], { cap: 'both', ur: 3 }).at(null).smooth(0);
      for (const x of [-1, 1]) Gb.at(null).smooth(0).box(.3, .5, 1.3, x, 0, 0, { m: 1.5, c0: .75, taper: [1, .7] }); Gb.smooth(1).loft(7, [[1.95, .17, .17, 0, .9], [5.2, .15, .15, 2, 1], [5.5, .26, .26, 2.2, 1.05]], { cap: 'top' });
      Gs.quad([.45, 1.75, .56], [1.15, 1.75, .56], [1.15, 2.45, .56], [.45, 2.45, .56]); dial(-.5, 1.3, .86, .42); }
    else { Gp.box(1.2, 1.75, .55, 0, 0, 0, { m: 1.5, c0: .78, taper: [1, .9] }); dial(-.28, 1.3, .27, .34); dial(.24, 1.3, .27, .34); dial(-.28, .86, .28, .22);
      B.g(PT.panel({ kind: 'dots', c: '#d8d0b8', c2: '#c8584a', peel: .5 }), { offset: true }).quad([-.04, .62, .285], [.5, .62, .285], [.5, 1, .285], [-.04, 1, .285]); Gb.loft(6, [[1.7, .07, .07, 0, .9], [2.6, .07, .07, .6, 1]], { cap: 'top' }); }
    return B.group(); }
  // 機械の当たり判定：見た目の段ごとの箱（上に乗れる）。A は台・頭・しっぽの 3 段、B はボイラーの胴（まん中のえんとつは乗れない）、C は計器の箱
  const wb = (x, z, ry, ox, oz, w, d, y1) => { const c = Math.cos(ry), s = Math.sin(ry); G.box(x + ox * c + oz * s, z - ox * s + oz * c, w, d, -1, y1, ry); };
  const mSolid = (k, x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry);
    if (k === 'A') { wb(x, z, ry, 0, 0, 2.8, 1, .8); wb(x, z, ry, -.85, 0, .95, .9, 1.85); wb(x, z, ry, .95, 0, .55, .6, 1.3); G.circle(x - .85 * c - .2 * s, z + .85 * s - .2 * c, .2, 1.8, 3.9); }
    else if (k === 'B') { wb(x, z, ry, 0, 0, 3.2, 1.6, 2.05); G.circle(x, z, .2, 2.0, 5.5); }
    else wb(x, z, ry, 0, 0, 1.2, .6, 1.75); };
  const MACH = [['A', '#e2b040', -19, -11.4, 0], ['C', '#9cc4c0', -15.6, -12.6, 0], ['B', '#c8d0b8', -9.5, -11.8, 0], ['A', '#7fb0a0', -2.5, -11.4, PI], ['C', '#e2b040', 1.2, -12.6, 0], ['B', '#e2b040', 6.8, -11.8, 0], ['A', '#c8d0b8', 13, -11.2, .1],
    ['B', '#9cc4c0', -17, 12.2, PI], ['C', '#c8d0b8', -11.6, 13, PI], ['A', '#e2b040', 10.5, 12, PI + .05], ['C', '#9cc4c0', 14.4, 13, PI], ['A', '#9cc4c0', -6.2, .3, PI / 2 + .2], ['C', '#e2b040', 6.2, -1.2, -.5]];
  MACH.forEach(([k, c, x, z, ry], i) => { put(machine(k, c, i), x, z, ry, 0, 'none'); mSolid(k, x, z, ry); });
  put(PK.tank({ r: 2, h: 4.4, c: '#d8d0b4', seed: 1 }), 20.4, -10.5, -PI / 2, 0, 'round'); put(PK.tank({ r: 1.6, h: 3.2, legs: 1.2, c: '#9cc4c0', seed: 2 }), 21, -5.2, -PI / 2, 0, 'round');
  put(PK.tank({ r: 1.5, h: 3.6, c: '#e2b040', seed: 3 }), 20.8, 11, -PI / 2, 0, 'round'); put(PK.tank({ r: 1.3, h: 2.4, c: '#d8d0b4' }), -21.2, 4.5, PI / 2, 0, 'round', { r: 1.3, top: 2.4 });
  // 天井クレーン（黄色い はり・台車・くさりと かぎ）と、かべの上を走る管
  { const B = R.parts(), Gx = B.g(PT.truss({ kind: 'beam', paint: '#e2b040' }), { side: true }), Gy = B.g(PT.rust({ paint: '#e2b040', peel: .4, panel: 0, m: 1.5 })), Gb = B.g(BARE).smooth(1), CX = 8, CZ = -2.5;
    for (const dx of [-.45, .45]) Gx.quad([CX + dx, 6, -14.6], [CX + dx, 6.75, -14.6], [CX + dx, 6.75, 14.6], [CX + dx, 6, 14.6], [0, 0, 1, 14]);
    for (const z of [-14.5, 14.5]) Gx.quad([-23.6, 5.55, z], [-23.6, 6, z], [23.6, 5.55 + .45, z], [23.6, 5.55, z], [0, 0, 1, 24]);
    Gy.box(1.5, .6, 1.3, CX, 6.2, CZ, { m: 1.5, c0: .8 }); Gb.at(TR(CX, 0, CZ)).loft(5, [[3.9, .035, .035, 0, .8], [6.2, .035, .035, 3, 1]]).at(null); Gy.box(.5, .5, .32, CX, 3.45, CZ, { m: 1.5, taper: .6, c0: 1, c1: .8 }); Gb.at(TR(CX, 3.1, CZ)).loft(5, [[0, .05, .05, 0, .8], [.38, .09, .05, .4, 1]], { cap: 'both' }).at(null);
    Gb.at(TR(0, 3.2, -14.45, 0, 0, PI / 2)).loft(7, [[-22, .17, .17, 0, .9], [22, .17, .17, 30, 1]]).at(TR(0, 4.2, 14.45, 0, 0, PI / 2)).loft(7, [[-22, .13, .13, 0, .9], [-8, .13, .13, 10, 1]]).at(null);
    for (const x of [-12.5, 4, 16]) Gb.at(TR(x, 0, -14.45)).loft(6, [[0, .12, .12, 0, .8], [3.2, .12, .12, 2, 1]]).at(null); fixed.push(B.group()); }
  // かべのつた（内がわ）と、はりからたれる つた
  for (const [x, z, ry, w, h, i] of [[-12, -14.82, 0, 9, 5, 0], [9, -14.82, 0, 12, 6, 1], [23.82, 3, -PI / 2, 9, 6, 2], [-23.82, -6, PI / 2, 9, 5, 3], [-18, 14.82, PI, 6, 5, 0], [18, 14.82, PI, 9, 5.5, 1]]) put(PK.ivy({ w, h, from: 'bottom', amount: .8, flowers: .5, seed: i }), x, z, ry, 0, 'none');
  for (const [x, z, w, i] of [[-6, -6, 6, 0], [6, 6, 6, 1], [12, -6, 3, 2], [-12, 6, 6, 3], [0, 0, 3, 1]]) put(PK.ivy({ w, h: 2.2, from: 'top', amount: .7, flowers: .4, seed: i }), x, z, PI / 2, FH - 2.2, 'none');
  // 光の当たる所に 若い木と草花。箱・ドラムかん・がれき
  POOL.forEach(([x, z], i) => { if (Math.abs(Math.abs(z) - 6) < 1) { put(PK.flowers({ n: 10, r: 1.5, seed: i, fc: ['#ffffff', '#ffe27a'], s: .6 }), x - .4, z + Math.sign(z) * 2.3, 0, 0, 'none'); return; } put(R.tree({ kind: i % 3 === 2 ? 'bush' : 'round', h: 2.8 + hash(i, 1) * 1.8, c: ['#6ab44c', '#7cbc50', '#58a84a'][i % 3], seed: i + 2 }), x + .3, z - .2, i, 0, i % 3 === 2 ? 'round' : 'trunk', i % 3 === 2 ? { pad: .6 } : undefined); put(PK.flowers({ n: 14, r: 2.3, seed: i, fc: [['#ffffff', '#ffe27a'], ['#ffd86a', '#ffffff'], ['#f8b8c8', '#ffffff']][i % 3], s: .7 }), x, z, 0, 0, 'none'); });
  for (let i = 0; i < 70; i++) { const x = (hash(i, 6) - .5) * 46, z = (hash(i, 7) - .5) * 28; if (pool(x, z) < .15 && hash(i, 9) > .35) continue; if (Math.abs(Math.abs(z) - 6) < 1) continue; put(R.tuft({ kind: ['grass', 'bush', 'grass', 'flower', 'reed'][i % 5], s: .55 + hash(i, 8) * .7, seed: i % 3, fc: ['#ffe27a', '#ffffff'] }), x, z, i, 0, 'none'); }
  [[-21, 9.5, .9], [-21.2, 10.6, .7], [-20.2, 10.2, .6], [16.5, -1, .8], [3.6, 12.8, .8], [4.4, 13.2, .6]].forEach(([x, z, s], i) => put(R.crate({ s, kind: ['slash', 'x', 'plain'][i % 3], c: '#b08a58' }), x, z, i * .5));
  // 足した：木箱の段。計器の箱（西の C）へ、ボイラー（B）の上へ、小さいタンクの上へ のぼれる
  [[-13.2, -11.2, 0], [-14.3, -12.3, 0], [-14.3, -12.3, .9], [-7.1, -10.7, 0], [-7.3, -11.8, 0], [-7.3, -11.8, .9], [-20.4, 7.5, 0], [-21.3, 6.5, 0], [-21.3, 6.5, .9]].forEach(([x, z, y], i) => put(R.crate({ s: .9, kind: ['slash', 'x', 'plain'][i % 3], c: i % 2 ? '#b08a58' : '#a07a4c' }), x, z, (i % 3) * .08, y));
  [[-5.6, 12.6, '#c8584a'], [-4.8, 13.1, '#5a8aa8'], [17.5, 12.4, '#e2b040'], [-22, -1.5, '#5a8aa8'], [17.2, -12.6, '#c8584a']].forEach(([x, z, c]) => put(R.barrel({ h: 1, r: .34, c }), x, z, 0, 0, 'round'));
  put(PK.rubble({ r: 1.8, h: .7, seed: 1 }), -21, -11.5, 0, 0, 'round', { pad: .7 }); put(PK.rubble({ r: 1.4, h: .5, seed: 2 }), -15.5, 1.5, 0, 0, 'round', { pad: .7 });
  put(PK.wreck({ kind: 'van', c: '#e2b040', seed: 3 }), 4, 21, .4); put(PK.chimney({ h: 24, r: 1.6, c: '#c8684e' }), -30, -20, 0, 0, 'round', { r: 1.8 });
  // 外の木と草
  for (let i = 0; i < 46; i++) { const a = hash(i, 1) * 6.283, r = 34 + hash(i, 2) * 26, x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r * .9; if (Math.abs(x) < 28 && Math.abs(z) < 19) continue; put(R.tree({ kind: ['round', 'round', 'tall'][i % 3], h: 6 + hash(i, 3) * 5, c: ['#4f9a48', '#62a84c', '#3f8a4e'][i % 3], seed: i }), x, z, i, 0, 'trunk'); }
  for (let i = 0; i < 40; i++) { const x = (hash(i, 4) - .5) * 80, z = (hash(i, 5) > .5 ? 1 : -1) * (16.5 + hash(i, 6) * 12); put(R.tuft({ kind: ['bush', 'grass', 'reed', 'flower'][i % 4], s: .8 + hash(i, 7), seed: i % 3 }), x, z, i, 0, 'none'); }
  // 足した：工場の敷地をかこむ さく（ここが敷地のはし）と、外の ベンチ・自転車
  for (const x of [-27, -9, 9, 27]) { put(PK.fence({ len: 18, seed: x, ivy: .7, lean: .08 }), x, 31.4, 0, 0, 'none'); put(PK.fence({ len: 18, seed: x + 1, ivy: .7, lean: -.08 }), x, -26.4, 0, 0, 'none'); }
  for (const z of [-17.5, 0, 17.5]) { put(PK.fence({ len: 17.5, seed: z + 3, ivy: .7, lean: .08 }), -36.4, z + 5, PI / 2, 0, 'none'); put(PK.fence({ len: 17.5, seed: z + 4, ivy: .7, lean: -.08 }), 36.4, z + 5, PI / 2, 0, 'none'); }
  put(PK.bench({ c: '#7fa8b8' }), -10, 18.5, PI); put(PK.bike({ c: '#d8503c', basket: 1 }), 9.5, 17.6, 1.2, 0, 'box', { pad: .1 });
  scene.add(R.merge(fixed));
  scene.add(R.backdrop({ c: '#6a9e64', haze: '#ead9b0', r: 240, y: -5, h: 34 }));
  for (let i = 0; i < 6; i++) { const c = R.cloud({ s: 40 + hash(i, 9) * 30, c: '#fffaf0', shade: '#e8d4b8', seed: i }), a = i * 1.05 + .3; c.position.set(Math.cos(a) * 220, 44 + hash(i, 10) * 30, Math.sin(a) * 220); c.lookAt(0, 20, 0); scene.add(c); }
  const motes = PK.motes({ n: 90, area: [18, 7, 14], c: '#fff0b8' }); scene.add(motes); dyn.push(motes);

  // ---- しらべられる物 ----
  G.sign(-15.6, 1.3, -12, { name: '計器の箱', lines: [['針は みんな、ゼロの所で とまっている。', 'ガラスの うらに、小さな くもが すを はっている。']] });
  G.sign(.06, 1, -4.4, { name: '光のすじ', lines: [['天窓の ぬけた所から、光が まっすぐ おりてくる。', '光の中で、ほこりが 金色に まっている。'], '光の当たる所にだけ、草と 若い木が 生えている。'] });
  G.sign(8, 1.2, -2.5, { name: '天井クレーン', lines: [['頭の上に、黄色い はりが わたしてある。', 'くさりの先の かぎが、ゆっくり ゆれている。']] });
  G.sign(0, 1.6, 15, { name: '工場の入口', lines: [['かべが 大きく くずれて、外の草地へ 出られる。', 'のこぎりの歯のような 屋根が、空に ならんでいる。']] });

  // ---- 工場に集まる人（TL.person。主人公と同じ 4.5 頭身の作り） ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'small', outfit: 'worker', hat: 'cap', hatC: '#5a6a7a', hair: 'center', bulk: 1.1, head: { hair: '#d8d8d8', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'mustache' }, colors: { pants: '#5a6a7a', scarf: '#e2b040' } }, -2.4, -9.6, PI - .3,
    { name: 'もと職人のおじいさん', lines: [['この旋盤はな、わしが 若いころ 毎日 回しておった。', 'はずみ車の 音が、工場じゅうに ひびいたもんじゃ。'], ['今は 光と 草の 住む所じゃな。', 'それも わるくない。']] });
  folk({ size: 'normal', hat: 'straw', hair: 'swept', head: { hair: '#c8643c', eye: '#3a7a5a', mouth: 'smile', blush: true }, colors: C('#b89c5c', '#f6eed8', '#6a5a48', '#5a8a6a') }, -9.4, 2.6, -.9,
    { name: 'カメラの探検家', lines: [['光のすじが いちばん きれいなのは、お昼すぎ なの。', 'ほら、いま ちょうど いい時間！'], ['前に 草の線路の 廃駅にも 行ったよ。', 'ひまわり畑と 止まった電車が すてきだった。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#5a8a6a', hair: 'center', head: { hair: '#5a3a2a', eye: '#4a6a3a', mouth: 'smile' }, colors: { tunic: '#6a8a5a', apron: '#f0e8d0' } }, 6.6, 2.2, PI * .8,
    { name: '若木を育てる人', lines: [['この木は、天窓から おちた たねが 育ったの。', 'わたしは 水を やりに 来てるだけ。'], '木が 屋根まで とどいたら、ここは 森に なるわね。'] });
  folk({ size: 'child', hat: 'cap', hatC: '#d8503c', hair: 'wolf', head: { hair: '#2a2a34', eye: '#3a5a8a', mouth: 'open', blush: true }, colors: C('#e2b040', '#c8584a', '#3a4a6a', '#9cc4c0') }, 0, 0, 0,
    { name: 'かけまわる子', path: loop([[-2.4, 3.6], [1.2, .8], [4.4, 3.4], [1.2, 5]]), speed: 2.6, lines: [['光の中に 入ると、あったかいんだよ！', 'つぎは あっちの光まで きょうそう！'], 'ボイラーの上に のぼってる子、こわくないのかなあ。'] });
  const topKid = folk({ size: 'child', outfit: 'worker', hat: 'straw', hair: 'swept', head: { hair: '#8a4a2a', eye: '#5a4a2a', mouth: 'smile', blush: true }, colors: { pants: '#3a6a5a', linen: '#f0e4c0' } }, -8.7, -11.9, 1.4,
    { name: 'ボイラーの上の子', lines: [['ここ、工場で いちばん 見晴らしが いいんだ！', '光のすじが ぜんぶ 見えるでしょ。'], ['木箱を 二つ のぼって、ジャンプ！ かんたんだよ。', '西の 計器の箱にも のぼれるよ。']] }, 2.05);
  topKid.idle = (t, o) => R.idle(o, t, Math.sin(t * .7) * .5);
  folk({ size: 'tall', outfit: 'worker', hat: 'kerchief', hatC: '#8a5a3a', hair: 'wolf', bulk: 1.12, head: { hair: '#3a2e2a', skin: '#c8885a', eyes: 'small', brow: 'thick', mouth: 'line', beard: 'stubble' }, colors: { pants: '#6a5a3a', scarf: '#c8584a' } }, 18.2, -7.6, -PI / 2,
    { name: 'くず鉄ひろい', lines: [['さびた 部品でも、みがけば まだ 使える。', 'もっていく先は、下町の スクラップ置き場さ。'], ['あそこは 子どもたちの 遊び場でな。', 'タイヤの ぶらんこが あるんだ。']] });
  folk({ size: 'normal', outfit: 'robe', hat: 'wizard', hatC: '#5a6a8a', hold: 'staff', hair: 'center', head: { hair: '#a8a8b8', eye: '#5a5a8a', eyes: 'small', mouth: 'line', beard: 'beard' }, colors: { tunic: '#5a6a8a', trim: '#e8d8a0' } }, 12.6, 6.2, PI / 2 + .6,
    { name: '光をしらべる学者', lines: [['光のすじは、どれも 同じ かたむき なのだ。', '日が うごけば、すじも ゆっくり うごく。'], 'のこぎり屋根は、北の光を 入れるための 形なのだよ。'] });
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'center', head: { hair: '#4a3a2a', skin: '#e0b088', eye: '#5a5a7a', brow: 'angry', mouth: 'line' }, colors: { metal: '#a8a090', tunic: '#6a7a5a' } }, -5.2, 16.6, .2,
    { name: '工場の番人', lines: [['ここは 古い工場だ。中は 自由に 見てまわって いいぞ。', 'ただし、クレーンの かぎには さわるなよ。'], '木箱の上で ころぶ子が 多くてな。気をつけるんだぞ。'] });
  // しか（親子）。親は話しかけると 顔を上げる
  const doe = PK.deer({ antlers: false, s: .9, c: '#d09860' }), fawn = PK.deer({ antlers: false, s: .58, c: '#d8a068' }); doe.position.set(1.2, 0, 3.2); doe.rotation.y = 2.2; scene.add(doe, fawn);
  G.npc(doe, { name: 'しか', r: .5, head: 1.2, lines: ['（しかは 草を はみながら、じっと こちらを見ている）', '（子じかが、母じかの うしろに かくれた）'], idle: t => PK.beastPose(doe, Math.sin(t * .25 + 1) > -.4 ? 'graze' : 'stand', t) });
  const flock = PK.flock({ n: 7, r: 8, h: 1.2, speed: .32, squash: .55, c: '#fff6e4', s: 1.3 }); flock.position.set(2, 6, -1); scene.add(flock); dyn.push(flock);
  for (const [x, z] of [POOL[2], POOL[5], POOL[3], POOL[0], POOL[7]]) { const b = PK.butterflies({ n: 6, area: [4.5, 2, 4], fc: ['#fff8d8', '#ffe27a', '#ffffff'] }); b.position.set(x, 0, z); scene.add(b); dyn.push(b); }
  const birds = [[3, 0, 2], [6.8, 2.06, -11.8], [-19.85, 1.86, -11.4], [-2, 0, 6.6], [2.5, 0, 5.2], [9, 0, 6.8], [-17, 2.06, 12.2], [13.4, 0, 6.2]].map(([x, y, z], i) => { const b = R.bird(i % 2 ? { c: '#f0ece4', neck: false } : { c: '#7a9ab8', belly: '#f4ead8' }); b.position.set(x, y, z); b.rotation.y = i * 2.1; b.userData.home = [x, y, z, i * 2.1]; b.userData.fly = -1; scene.add(b); return b; });

  // ---- はじめの場所・自動で歩く道・毎コマ ----
  G.spawn(-15, 6, PI / 2);
  G.tour([[-6, 7.6], [6, 7.6], [13.5, 5.6], [15, 2], [15, -3], [12, -6], [-4, -6], [-14.5, -5.8], [-20.5, -6], [-20.5, 0], [-15, -.5], [-9, 9.6], [-3, 11], [0, 18], [-3, 24], [-4, 20], [-4, 13], [-15, 6]]);
  G.tick((t, dt, P) => {
    fawn.position.set(-.4 + Math.sin(t * .3) * .5, 0, 4.4); fawn.rotation.y = 1.2 + Math.sin(t * .3) * .4; PK.beastPose(fawn, Math.sin(t * .3 + 1.5) > .3 ? 'walk' : 'stand', t * 6);
    motes.position.set(P.x + Math.sin(P.ry) * 3, .3, P.z + Math.cos(P.ry) * 3); for (const o of dyn) o.userData.tick(t);
    for (const b of birds) { const [hx, hy, hz, hr] = b.userData.home, dh = Math.hypot(P.x - hx, P.z - hz, (P.y - hy) * .5);
      if (b.userData.fly < 0) { R.birdPose(b, hy > 0 ? 'stand' : 'peck', t + hr * 3); if (dh < 2.8) b.userData.fly = 0; }
      else { const f = (b.userData.fly += dt); b.visible = f < 5; b.position.set(hx + Math.cos(hr) * f * 2.6, hy + Math.min(6, f * 2.4 - f * f * .1), hz + Math.sin(hr) * f * 2.6); b.rotation.y = Math.atan2(Math.cos(hr), Math.sin(hr)); R.birdPose(b, 'fly', t + hr);
        if (f > 5 && dh > 13) { b.userData.fly = -1; b.visible = true; b.position.set(hx, hy, hz); b.rotation.y = hr; } } } });
});
