// ワールド 8-25「廃駅と草の線路」。もとは game-looks-8/25-abandoned-station.html（見るだけの場面）。
// 夏の昼の、人のいなくなった小さな駅。草にうもれた線路の先に入道雲、左に止まったままの電車、右に屋根のぬけたホーム、ひまわり畑。
// ゲームにするために足した物：ホーム・電車・駅舎・小物の当たり判定、ホームへの段、電車の屋根へのぼれる木箱の山、
// 駅に通う人たち 8 人とねこ、しらべられる物 4 つ、線路の両はしの車止めと、まわりのさく。
TALE_WORLD('8-25', G => {
  const { THREE, K, R, T, TL, scene } = G, PK = PACK_RUINS(THREE, K, R), PT = PK.tex, { hash } = K;
  scene.add(R.skyDome([[0, '#1c64cc'], [.5, '#3f94e6'], [.86, '#8cc8f2'], [1, '#dcf2ec']], { r: 380 })); scene.fog = new THREE.Fog('#c8e6dc', 60, 260);
  K.lights(scene, G.renderer, { sky: 0xcfe4ff, ground: 0x9cc084, amb: 1.6, sun: 0xfff4d8, power: 2.6, range: 34, map: 2048, pos: [25, 50, 20] });

  // ---- 地面：草（花つき）＋草にうもれた線路 2 本（x = ±1.5）＋ふみあとの土 ----
  const cl = v => Math.max(0, Math.min(1, v)), vn = (x, z) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); return (hash(ix, iz) * (1 - sx) + hash(ix + 1, iz) * sx) * (1 - sz) + (hash(ix, iz + 1) * (1 - sx) + hash(ix + 1, iz + 1) * sx) * sz; };
  const GR = T.grass({ c: '#62ac4a', flowers: .28, fc: ['#ffffff', '#ffe27a', '#f4a0b8'] });
  const land = R.ground({ w: 132, d: 168, cell: 2, cz: -14, layers: [GR, PT.rail({ grass: .9 }), T.dirt({ c: '#b89a6c' })],
    mix: (x, z) => [Math.abs(x) < 3 ? cl(.5 + (.7 - vn(x / 2.2 + 9, z / 3.6)) * 7) : 0, Math.abs(x) < 3 ? 0 : cl(.5 + (vn(x / 3 + 5, z / 4) * 1.5 - .2 - Math.abs(x + 6.6)) * 1.6) * .9 + (x > 8.6 && x < 15 && z < 4 && z > -22 ? cl(vn(x / 2, z / 2) * 2.4 - .8) : 0)],
    shade: (x, z) => { const k = cl(1 - Math.abs(x) / 7); return [.95 + .09 * k, .97 + .06 * k, .92 + .04 * k]; } });
  scene.add(land.mesh); const outer = R.ground({ w: 704, d: 704, cell: 32, layers: [GR] }); outer.mesh.position.y = -.1; scene.add(outer.mesh);
  G.ground(() => 0); G.bounds(-25, 21, -50, 33);

  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  // ---- ホーム：こけた敷石の台、さびた柱、波板の屋根は ところどころ ぬけて はりだけが残る ----
  const X0 = 3.4, X1 = 8.6, XC = 6, ZA = 4, NB = 7, PH = 1;
  { const B = R.parts(), Gc = B.g(PT.concrete({ c: '#c6c0ae', moss: .5, crack: .5 })), Gt = B.g(T.cobble({ kind: 'slab', c: '#cdc6b0', moss: .55 })), Gw = B.g(PT.rust({ wave: 1, paint: '#ecdfbe', peel: .5, panel: 0 }), { side: true }), Gx = B.g(PT.truss({ kind: 'beam', paint: '#6aa696' }), { side: true }), Gi = B.g(PT.ivy({ amount: .75, flowers: .5, fc: ['#ffffff', '#ffe27a'] }), { side: true });
    for (let k = 0; k < NB; k++) { const z = ZA - k * 6, z1 = z - 6;
      Gc.box(X1 - X0, PH, 6, XC, 0, z - 3, { m: 3, top: false, c0: .8 }); Gt.quad([X0, PH, z], [X1, PH, z], [X1, PH, z1], [X0, PH, z1], [0, k * 2, (X1 - X0) / 3, k * 2 + 2]);
      Gc.box(.5, .12, 6, X0 + .22, PH - .04, z - 3, { m: 3 });
      if (k > 0) Gx.quad([X0 - .2, PH + 3, z], [X0 - .2, PH + 3.45, z], [X1 + .2, PH + 3.45, z], [X1 + .2, PH + 3, z], [0, 0, 1, 4]);
      if (k > 0 && k < NB - 1) Gx.quad([XC, PH + 3.25, z], [XC, PH + 3.8, z], [XC, PH + 3.8, z1], [XC, PH + 3.25, z1], [0, 0, 1, 4]);
      if (k > 0 && k < NB - 1) for (const s of [-1, 1]) { if (hash(k, s + 2, 5) < .42) continue;
        const xe = XC + s * 3.1, ye = PH + 3.05, yc = PH + 3.85, za = z - (hash(k, s, 7) < .3 ? 1.5 : 0); Gw.quad([xe, ye, za], [xe, ye, z1], [XC, yc, z1], [XC, yc, za], [0, 0, (za - z1) / 2, 1.6], [.85, .85, 1.05, 1.05]);
        if (hash(k, s, 9) < .7) Gi.quad([xe, ye - 1.5, za], [xe, ye - 1.5, z1], [xe, ye + .05, z1], [xe, ye + .05, za], [k * .6, .5, k * .6 + (za - z1) / 3, 1]); } }
    Gw.quad([X0 + .3, PH + .02, -13.2], [X0 + .3, PH + .02, -16.8], [XC - .2, PH + 2.2, -16.6], [XC - .2, PH + 2.2, -13.4], [0, 0, 1.8, 1.6], [.8, .8, 1, 1]);
    fixed.push(B.group());
    for (let k = 1; k < NB; k++) { const Gp = R.geo().smooth(1).loft(5, [[PH, .14, .14, 0, .8], [PH + 3.1, .1, .1, 2, 1]]); put(Gp.mesh(PT.rust({ paint: '#6aa696', peel: .5, panel: 0, m: 1.5 })), XC, ZA - k * 6, 0, 0, 'trunk', { r: .18 }); } }
  // ホームの台（上に乗れる）と、落ちて柱にもたれた屋根の板（その下は通れない）
  G.box(XC, ZA - NB * 3, X1 - X0, NB * 6, -1, PH); G.box((X0 + .3 + XC - .2) / 2, -15, XC - X0 - .5, 3.6, PH, PH + 2.2, 0, true);
  // ホームへ上がる段（4 段。-z へ上がる）
  put(PK.steps({ w: 3.4, n: 4, rise: .25, run: .5, tex: PT.concrete({ c: '#c6c0ae', moss: .6 }) }), XC, ZA + 2, 0, 0, 'none');
  for (let k = 0; k < 4; k++) G.box(XC, ZA + 2 - k * .5 - .25, 3.4, .5, -1, (k + 1) * .25);
  put(PK.billboard({ kind: 'stripe', c: '#f0e8d0', c2: '#3f7fb4', w: 3, h: 1.05, legs: 1.5, seed: 1, lean: .05 }), 5.2, -.6, -.55, PH, 'wall', { pad: .05 });
  put(PK.billboard({ kind: 'wave', c2: '#3f7fb4', w: 2.2, h: .8, legs: 1.4, seed: 2, lean: -.12, peel: .6 }), 7.6, -27, -.9, PH, 'wall');
  put(PK.bench({ c: '#7fa8b8' }), 7.4, -7, -Math.PI / 2, PH); put(PK.bench({ c: '#7fa8b8', broken: 1 }), 7.4, -19.5, -Math.PI / 2 + .12, PH);
  put(PK.vending({ c: '#e8dcc0', seed: 2, lean: .08 }), 7.9, -10.6, -Math.PI / 2, PH, 'wall');
  put(PK.kiosk({ seed: 2, c: '#f0e4c4', c2: '#d8503c', kind: 'sun', w: 2.6, d: 1.8 }), 6.6, -31.5, -Math.PI / 2, PH, 'wall');
  put(PK.fence({ len: 18, seed: 1, ivy: .8, lean: .12 }), 8.9, -22, Math.PI / 2, 0, 'wall');
  // 駅舎（木の板ばり）と、うらの水のタンク
  put(R.house({ w: 7, d: 5, h: 3, wall: T.boards({ c: '#e6d8b4' }), roof: T.roof({ c: '#c0584a', moss: .6 }), roofKind: 'gable', ridge: 'z', door: T.door({ style: 'glass' }), win: T.window({ bars: 'grid', curtain: false }), seed: 3 }), 13, -5, -Math.PI / 2, 0, 'none');
  G.box(13, -5, 7.3, 5.3, -1, 9, -Math.PI / 2, true);
  put(PK.tank({ r: 1.3, h: 2.2, legs: 2.6, c: '#d8d0b4' }), 14.5, 4.5, 0, 0, 'round'); put(PK.ivy({ w: 6, h: 2.6, from: 'bottom', amount: .8, flowers: .5 }), 9.45, -5, -Math.PI / 2, 0, 'none');

  // ---- 止まったままの電車（クリームと赤）・信号・架線の柱 ----
  put(PK.coach({ kind: 'train', c: '#efe4c2', c2: '#d8503c', seed: 1 }), -1.5, -10.5, 0); put(PK.coach({ kind: 'train', c: '#efe4c2', c2: '#d8503c', seed: 2 }), -1.56, -26.3, .012);
  const TOP = 3.65;   // 電車の屋根の高さ
  put(PK.signal({ h: 4.6, arm: 0, lean: 1.36, leanX: .1, seed: 1 }), -3.6, 4.5, -Math.PI / 2 + .25, 0, 'none'); put(PK.signal({ h: 4.4, arm: 0, lean: .14, leanX: -.06, seed: 2, walk: 1 }), 3.9, 9.5, 0, 0, 'trunk', { r: .15 }); put(PK.signal({ h: 5, arm: 1.6, lean: -.2, seed: 3 }), -4.3, -40, 0, 0, 'trunk', { r: .15 });
  const poles = [[-4.6, 22, .06], [-4.7, -2, -.1], [-4.6, -34, .12], [-4.6, -62, -.05]].map(([x, z, ln], i) => put(PK.pole({ h: 7.5, lean: ln, leanX: (i % 2 - .5) * .1, seed: i, trans: false }), x, z, 0, 0, 'trunk', { r: .16 }));
  put(PK.sign({ kind: 'warn', lean: .24 }), 3.7, 16, 0, 0, 'trunk', { r: .1 }); put(PK.sign({ kind: 'plate', lean: -.2, seed: 1 }), -3.8, 14.5, .3, 0, 'trunk', { r: .1 });
  put(PK.rubble({ r: 1.6, h: .6, seed: 2 }), 4.6, 22, 0, 0, 'round', { pad: .75 }); put(PK.wreck({ kind: 'van', c: '#7fb0c4', seed: 2 }), 13.5, 13, .5);
  // 足した：電車の横に積まれた木箱（ぴょんぴょん のぼると、電車の屋根に乗れる）
  [[-4.5, -6.6, 0, .9], [-3.6, -6.8, 0, .9], [-3.6, -6.8, .9, .9], [-3.6, -7.8, 0, .9], [-3.6, -7.8, .9, .9], [-3.6, -7.8, 1.8, .9], [-4.4, -7.9, 0, .8]].forEach(([x, z, y, s], i) => put(R.crate({ s, kind: i % 2 ? 'x' : 'slash', c: i % 3 ? '#b08a58' : '#9a7a50' }), x, z, i * .15, y));
  // 足した：線路の両はしの車止め（ここで線路が終わる）と、まわりのさく
  { const st = T.planks({ c: '#8a5a3a' }), G2 = R.geo(); for (const [x, z] of [[-1.5, -48.6], [1.5, -48.6], [-1.5, 31.6], [1.5, 31.6]]) { G2.box(2.2, .8, .5, x, .3, z, { m: 2 }); G2.box(.25, 1.1, .25, x - .8, 0, z, { m: 2 }); G2.box(.25, 1.1, .25, x + .8, 0, z, { m: 2 }); G.box(x, z, 2.3, .6, -1, 1.1); }
    const me = G2.mesh(st); fixed.push(me); }
  put(PK.rubble({ r: 2.2, h: .9, seed: 4 }), -5.5, -48.5, 0, 0, 'none'); put(PK.rubble({ r: 2, h: .8, seed: 5 }), 5.6, -48.8, 0, 0, 'none'); put(PK.rubble({ r: 1.8, h: .7, seed: 6 }), 6, 31.8, 0, 0, 'none');
  for (const z of [-11, -32]) put(PK.fence({ len: 20, seed: 3, ivy: .7, lean: -.1 }), -25.2, z, Math.PI / 2, 0, 'none');
  put(PK.fence({ len: 16, seed: 4, ivy: .7, lean: .1 }), 21.2, 10, Math.PI / 2, 0, 'none'); put(PK.fence({ len: 16, seed: 5, ivy: .7, lean: .1 }), 21.2, -26, Math.PI / 2, 0, 'none');
  for (const x of [-15, 12]) put(PK.fence({ len: 18, seed: 6, ivy: .8 }), x, 33.4, 0, 0, 'none');
  for (const x of [-15, 13]) put(PK.fence({ len: 18, seed: 7, ivy: .8 }), x, -50.4, 0, 0, 'none');

  // ---- ひまわり（32×64 の絵。十字の板）と、木・草花 ----
  const sunTex = (() => { const P = R.Px(32, 64), Gn = R.ramp('#4f9a3c'), Y = R.ramp('#f8c828'), Br = R.ramp('#7a4a26'); P.clip = true;
    for (let y = 20; y < 64; y++) { P.set(15, y, Gn[2]); P.set(16, y, Gn[3]); if (y % 9 === 0) P.set(15, y, Gn[1]); }
    for (const [cx, cy, s] of [[9, 36, -1], [22, 43, 1], [10, 52, -1], [21, 29, 1]]) for (let i = 0; i < 7; i++) for (let j = -2; j <= 2; j++) if (Math.abs(j) <= Math.min(i, 6 - i) * .8 + .5) P.set(cx + s * (i - 3), cy + j + (i - 3) * -.4, j < 0 ? Gn[4] : j === 0 ? Gn[1] : Gn[3]);
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, px = 16 + Math.cos(a) * 7.6, py = 12 + Math.sin(a) * 7.6; P.disc(px, py, 2.7, k % 2 ? Y[3] : Y[4]); P.set(px + Math.cos(a) * 2, py + Math.sin(a) * 2, Y[5]); }
    P.disc(16, 12, 6.2, Y[2]); P.disc(16, 12, 4.8, Br[2]); P.disc(15, 11, 3, Br[3]); for (const [x, y] of [[17, 13], [13, 13], [18, 10], [16, 15], [15, 12]]) P.set(x, y, Br[1]); P.set(13, 9, Br[4]);
    return T.from(P, { m: 1, cut: true }); })();
  { const Gs = R.geo().normal([.2, 1, .3]), add = (x, z, s, a) => { for (const b of [a, a + Math.PI / 2]) { const cx = Math.cos(b) * s * .25, cz = Math.sin(b) * s * .25; Gs.quad([x - cx, 0, z - cz], [x + cx, 0, z + cz], [x + cx, s, z + cz], [x - cx, s, z - cz], [0, 0, 1, 1], [.8, .8, 1.06, 1.06]); } };
    for (let i = 0; i < 230; i++) { const col = i % 10, row = Math.floor(i / 10), x = -8.6 - col * 1.25 + (hash(i, 1) - .5) * .7, z = 20 - row * 2.6 + (hash(i, 2) - .5) * 1.4; add(x, z, 1.7 + hash(i, 3) * .7, hash(i, 4) * .5 - .2); }
    for (let i = 0; i < 40; i++) { const x = 4.2 + hash(i, 5) * 5.6, z = 7.2 + hash(i, 6) * 20; if (Math.hypot(x - 4.6, z - 22) < 2 || (x > 4.2 && x < 7.8 && z < 9)) continue; add(x, z, 1.5 + hash(i, 7) * .8, hash(i, 8) * .5); }
    for (const [x, z] of [[-4.2, 9], [-3.9, 1], [-4.9, -6], [-4.1, -15.5], [3.5, 14], [-4.6, 15.5], [-3.7, 12], [8.2, -1.2], [-4.4, -21], [3.4, 7.6], [-4, -27], [3.3, -38], [-3.8, -44]]) add(x, z, 1.9, x);
    const m = Gs.mesh(sunTex, { side: true }); m.castShadow = false; scene.add(m); }
  for (let i = 0; i < 34; i++) { const a = hash(i, 1) * 6.283, r = 36 + hash(i, 2) * 26, x = Math.cos(a) * r * 1.1, z = Math.sin(a) * r - 10; if (Math.abs(x) < 9 || (x < -8 && x > -25 && z > -42)) continue; put(R.tree({ kind: ['round', 'round', 'tall', 'round'][i % 4], h: 6 + hash(i, 3) * 4.5, c: ['#3f9446', '#4fa24a', '#358a4e'][i % 3], seed: i }), x, z, i, 0, 'trunk'); }
  [[10.5, 6.5, 6.5], [18, -14, 7.5], [11, -27, 6], [-7.5, 26, 6], [9.5, 27, 5.5]].forEach(([x, z, h], i) => put(R.tree({ h, c: '#4a9e48', seed: 50 + i }), x, z, i, 0, 'trunk'));
  const FC = [['#ffffff', '#ffe27a'], ['#f4a0b8', '#ffffff'], ['#b8c8f6', '#ffffff'], ['#ffd86a', '#ffffff']];
  for (let i = 0; i < 26; i++) { const z = 26 - i * 3.4 + hash(i, 4) * 1.5, s = i % 2 ? 1 : -1; if (s > 0 && z < ZA + 1 && z > ZA - NB * 6) continue; if (s < 0 && z < -1 && z > -36) continue; put(PK.flowers({ n: 10, r: 1.3, seed: i, fc: FC[i % 4], s: .75 }), s * (3.9 + hash(i, 5) * 1.2) + (s < 0 ? 0 : .3), z, 0, 0, 'none'); }
  for (let i = 0; i < 24; i++) put(PK.flowers({ n: 7, r: .8, seed: i + 30, fc: FC[i % 4], s: .5, kinds: ['flower', 'grass'] }), (i % 3 - 1) * 1.5 + (hash(i, 6) - .5) * .8 + (i % 3 === 2 ? -.6 : 0), 14 - i * 3.4, 0, 0, 'none');
  for (let i = 0; i < 80; i++) { const x = (hash(i, 6) - .5) * 60, z = (hash(i, 7) - .5) * 110 - 14; if (Math.abs(x) < 3.2 || (x > X0 - .4 && x < 16 && z < ZA + 3 && z > -40) || (x < -8 && x > -22 && z > -42 && z < 22)) continue; put(R.tuft({ kind: ['grass', 'bush', 'reed', 'flower', 'grass'][i % 5], s: .7 + hash(i, 8) * .8, seed: i % 3, fc: ['#ffffff', '#ffe27a'] }), x, z, i, 0, 'none'); }
  for (const [x, z] of [[4.6, -5], [5, -17.5], [7.8, -24], [4.4, -29]]) put(R.tuft({ kind: 'grass', s: .7, seed: 1 }), x, z, x, PH, 'none');
  // 足した：ひまわり畑の わきの 麦わらの束と、かかしの代わりの 古い看板。駅舎の前の 植木ばち
  for (const [x, z] of [[-7.4, 10.5], [-7.6, -4], [-7.2, -24]]) put(R.barrel({ h: .7, r: .42, c: '#c8a058' }), x, z, x, 0, 'round');
  for (const [x, z] of [[9.6, -1.6], [9.6, -8.4]]) { put(R.barrel({ h: .5, r: .32, c: '#9a6a44' }), x, z, 0, 0, 'round'); put(R.tree({ kind: 'bush', h: .7, flowers: .8, fc: ['#f8c828', '#ffffff'], seed: z }), x, z, 0, .45, 'none'); }
  scene.add(R.merge(fixed));
  scene.updateMatrixWorld(); const tip = (o, i) => { o.updateMatrixWorld(); return o.localToWorld(new THREE.Vector3(...o.userData.tips[i])).toArray(); };
  for (let i = 0; i < 3; i++) scene.add(PK.wire(tip(poles[i], 0), tip(poles[i + 1], 0), { sag: 1.5 + i * .5 })); scene.add(PK.wire(tip(poles[1], 1), [-3.2, 3.7, -8], { sag: .8 }));

  // ---- 空と遠景：山なみと、線路の先に立つ入道雲 ----
  scene.add(R.backdrop({ c: '#4f9a6a', haze: '#c8e6dc', r: 250, y: -5, h: 36 }));
  const clouds = []; for (const [a, y, s, sd] of [[-1.62, 34, 150, 1], [-1.52, 66, 104, 2], [-1.68, 92, 74, 3], [-1.57, 112, 46, 4], [-1.05, 30, 110, 5], [-1.0, 54, 70, 6], [-2.25, 32, 120, 7], [-2.2, 60, 76, 8], [-2.3, 80, 44, 9], [.3, 52, 60, 2], [1.4, 60, 70, 4], [2.6, 48, 64, 6]]) { const c = R.cloud({ s, c: '#ffffff', shade: '#b8d2f0', seed: sd }); c.position.set(Math.cos(a) * 300, y, Math.sin(a) * 300); c.lookAt(0, y * .6, 0); c.userData.a = a; scene.add(c); clouds.push(c); }

  // ---- しらべられる物 ----
  G.sign(5.2, PH + 1.2, .2, { name: '駅名の看板', lines: [['ペンキが はげて、駅の名前は もう読めない。', 'しまの模様だけが、夏の光に のこっている。']] });
  G.sign(-1.5, 1.2, -2.6, { name: '止まった電車', lines: [['クリームと赤の電車。まどガラスに つたが のびている。', '運転席には、だれかが わすれた 麦わら帽子。'], 'いつから ここに 止まっているのだろう。'] });
  G.sign(12.6, 1.2, -1.9, { name: '駅舎のとびら', lines: [['ガラスの とびらには かぎが かかっている。', '中の かべに、古い時刻表が はってあるのが見える。'], ['時刻表の いちばん下の行だけ、赤い字で 書きこみがある。', '「さいごの電車、夏の日ぐれ」']] });
  G.sign(-9, 1, 8, { name: 'ひまわり畑', lines: [['人の背より高い ひまわりが、みんな 線路のほうを向いている。', '電車が来るのを まっているみたいだ。']] });

  // ---- 駅に通う人たち（TL.person。主人公と同じ 4.5 頭身の作り） ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'small', hat: 'cap', hatC: '#34507a', hair: 'center', head: { hair: '#e0e0e0', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'mustache' }, colors: C('#34507a', '#2a3a5a', '#2a3448', '#e0a83a', { brass: '#e0c060' }) }, 5.6, -7, Math.PI / 2 - .4,
    { name: 'もとの駅長さん', lines: [['やあ、旅の人。きっぷは いらんよ。', 'この駅には もう、電車は 来ないからね。'], ['わしは 毎朝 ここへ来て、ホームを はいておる。', 'くせ というのは、なかなか ぬけんものじゃ。'], '電車の屋根に のぼる子が いてな。木箱を 積んだのは、きっと あの子じゃ。'] }, PH);
  folk({ size: 'small', outfit: 'apron', hat: 'straw', hair: 'center', head: { hair: '#a8a098', skin: '#e0b088', eyes: 'small', mouth: 'smile', blush: true }, colors: { tunic: '#c8607a', apron: '#f4ecdc' } }, -10.4, 3.2, Math.PI / 2,
    { name: 'ひまわり畑の おばあさん', lines: [['この畑はね、線路が とまってから 植えたのよ。', '電車の かわりに、夏が 来るように。'], 'たねは 秋に とれるの。また 来てちょうだいね。'] });
  folk({ size: 'child', hat: 'straw', hair: 'wolf', head: { hair: '#2a2a34', eye: '#3a7a5a', mouth: 'open', blush: true }, colors: C('#f6f0e0', '#d8503c', '#3c68a4', '#f0c84a') }, 0, 0, 0,
    { name: '虫とりの子', path: loop([[-3.4, 12], [-3.4, -1], [-6.2, -4], [-6.4, 10]]), speed: 2.2, lines: [['ちょうちょ、まって〜！', '……あ、にげちゃった。'], ['ねえねえ、電車の屋根の上って すずしいんだよ。', '木箱を ぴょんぴょん のぼるの！']] });
  folk({ size: 'normal', hat: 'beret', hatC: '#3f7fb4', hair: 'swept', head: { hair: '#c8843a', eye: '#4a6a9a', eyes: 'small', mouth: 'smile' }, colors: C('#e8dcc0', '#7a5a3a', '#5a4a3c', '#d8503c') }, 4.3, 12.6, -Math.PI * .85,
    { name: '絵かきの旅人', lines: [['草に うもれた線路と、入道雲。', 'この夏、いちばん かきたい けしきなんだ。'], ['前に 城下町の 大通りも かいたよ。', '青い屋根の お城が あってね、にぎやかで よかった。']] });
  folk({ size: 'tall', hair: 'wolf', head: { hair: '#4a3428', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'line', beard: 'stubble' }, colors: C('#6a7a5a', '#8a5a3a', '#4a4a3c', '#c8a04a') }, 0, 0, 0,
    { name: '線路を歩く旅人', path: loop([[1.5, 28], [1.5, -44], [1.2, -45], [1.2, 28]]), speed: 1.1, u: .3, lines: [['線路の上を 歩いていけば、まいごに ならない。', 'それが 旅の こつさ。'], ['この先の まちには、光が ふる 古い工場が あるらしい。', '天窓から 光のすじが 何本も おちて、木が 生えているそうだ。']] });
  folk({ size: 'normal', outfit: 'robe', hat: 'hood', hatC: '#5a7a5a', hair: 'center', head: { hair: '#5a3a2a', eye: '#3a6a5a', eyes: 'small', mouth: 'line' }, colors: { tunic: '#6a8a6a', trim: '#e8d8a0' } }, 11.2, 2.2, -.4,
    { name: '草花をしらべる学者', lines: [['ふむ。まくら木の あいだにも、七しゅるいの 花がある。', '人が いなくなると、草は すぐに もどってくるのだ。'], 'タンクの かげの こけは、とくに めずらしい。さわらないでくれたまえ。'] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#d8503c', hair: 'swept', head: { hair: '#3a2a22', eye: '#8a4a6a', mouth: 'smile', blush: true }, colors: { tunic: '#e8c84a', apron: '#fff4f0' } }, 5.2, -30.4, Math.PI / 2 + .3,
    { name: '売店のあとの むすめ', lines: [['ここは むかし、母さんの 売店だったの。', '夏は つめたい ラムネが よく 売れたんだって。'], ['あたしは ときどき、ここで お茶を いれるの。', '旅の人が 来ると、うれしくて。']] }, PH);
  const roofKid = folk({ size: 'child', outfit: 'worker', hat: 'cap', hatC: '#d8503c', hair: 'swept', head: { hair: '#7a4a28', eye: '#3a5a8a', mouth: 'smile', blush: true }, colors: { pants: '#3a4a7a', linen: '#f0e4c0' } }, -1.5, -12.5, .4,
    { name: '屋根の上の子', lines: [['えへへ、のぼって来られたんだ！', 'ここ、ぼくの ひみつの 見はり場なの。'], ['ほら、線路の ずっと先。入道雲が お城みたいでしょ。', 'あの雲の下まで、いつか 歩いて いくんだ。']] }, TOP);
  roofKid.idle = (t, o) => { R.idle(o, t, Math.sin(t * .6) * .5); };
  // ねこ（ホームのベンチの上。話しかけると ないて、すわりなおす）
  const cat = R.cat({ c: '#e8e2d4', belly: '#ffffff' }); cat.position.set(7.4, PH + .48, -7.2); cat.rotation.y = -1.9; scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃあ。', '……すぴー。（ねている）', 'にゃ？'], idle: t => R.catPose(cat, 'sit', t) });

  // ---- 鳥・ちょう ----
  const flock = PK.flock({ n: 6, r: 12, h: 3, speed: .26, squash: .5 }); flock.position.set(-2, 13, -22); scene.add(flock);
  const bfs = [[1.5, 4], [-4.5, 1], [4.5, 12], [1.2, -8], [-6.5, -12], [1.6, -22], [-12, 6]].map(([x, z]) => { const b = PK.butterflies({ n: 5, area: [5, 1.4, 5], fc: ['#ffffff', '#ffe27a', '#f4a0b8'] }); b.position.set(x, 0, z); scene.add(b); return b; });
  const birds = [[1.1, .12, .5], [2, .12, -1.2], [1.3, 0, -9], [-1.2, TOP + .03, -5.5], [-1.9, TOP + .03, -6.6], [7.3, PH + 2.5, -2.2], [.9, .12, -19], [2, 0, -27]].map(([x, y, z], i) => { const b = R.bird(i % 3 === 0 ? { c: '#f0ece4', neck: false } : i % 3 === 1 ? { c: '#6f92c4', belly: '#f4ead8' } : {}); b.position.set(x, y, z); b.rotation.y = i * 2.1; b.userData.home = [x, y, z, i * 2.1]; b.userData.fly = -1; scene.add(b); return b; });

  // ---- はじめの場所・自動で歩く道・毎コマ ----
  G.spawn(1.5, 26, Math.PI);
  G.tour([[1.5, 14], [1.5, -6], [1.5, -34], [-1.2, -44], [-5.6, -38], [-6.4, -16], [-6.4, 6], [-4, 20], [2, 22], [5.6, 9], [6, 6.6], [6.2, 3.4], [7.6, 1.2], [7.5, -4], [4.4, -5.5], [4.4, -11], [2, -12]]);
  G.tick((t, dt, P) => {
    flock.userData.tick(t); for (const b of bfs) b.userData.tick(t);
    for (const c of clouds) { const a = c.userData.a + t * .0012; c.position.x = Math.cos(a) * 300; c.position.z = Math.sin(a) * 300; }
    for (const b of birds) { const [hx, hy, hz, hr] = b.userData.home, dh = Math.hypot(P.x - hx, P.z - hz, (P.y - hy) * .5);
      if (b.userData.fly < 0) { R.birdPose(b, hy > .5 ? 'stand' : 'peck', t + hr * 3); if (dh < 2.8) b.userData.fly = 0; }
      else { const f = (b.userData.fly += dt); b.visible = f < 5; b.position.set(hx + Math.cos(hr) * f * 3.2, hy + Math.min(8, f * 2.6 - f * f * .1), hz + Math.sin(hr) * f * 3.2); b.rotation.y = Math.atan2(Math.cos(hr), Math.sin(hr)); R.birdPose(b, 'fly', t + hr);
        if (f > 5 && dh > 15) { b.userData.fly = -1; b.visible = true; b.position.set(hx, hy, hz); b.rotation.y = hr; } } } });
});
