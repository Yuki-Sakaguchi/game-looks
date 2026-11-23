// ワールド 12-23「上層への貨物エレベーター」。もとは game-looks-12/23-freight-lift-to-upper.html（見るだけの場面）。
// 昼。むき出しの鉄の貨物エレベーターが、鉄骨の塔にそって 下層から上へのぼる。下には けむりにかすむ つぎはぎの屋根の海、行く手の上には 白く光る上の都市。
// ゲームにするために足した物：屋根の海から 28 m の高さにある 鉄の荷あげ場（ここを歩く）、乗ると のぼる・くだる かご（動く足場）と、30 m 上の 中つぎの踊り場、
// かごが いない間に とじる しま模様の柵、荷あげ場の木箱の山、話せる人 9 人（かごに乗る係の人をふくむ）、しらべられる物 4 つ。見上げる構図を保つため、カメラを少し上へ向ける。
TALE_WORLD('12-23', G => {
  const { THREE, K, R, T, TL, scene } = G, C = PACK_CITY(THREE, K, R), U = PACK_UNDER1(THREE, K, R, C), X = C.tex, { hash } = K, PI = Math.PI, HAZE = '#b8a07c';
  G.cam.far = 2000; G.cam.updateProjectionMatrix();
  scene.add(R.skyDome([[0, '#4a80c8'], [.45, '#8ab4e0'], [.78, '#d8dcd0'], [1, '#d0b890']], { r: 1500 })); scene.fog = new THREE.Fog(HAZE, 60, 1700);
  K.lights(scene, G.renderer, { sky: 0xd0e0ff, ground: 0x9a7a58, amb: 1.6, sun: 0xfff0d0, power: 2.2, range: 26, pos: [-21, 45, -33] });
  // 荷あげ場の床が y=0。屋根の海は LOW m 下（もとの場面の かごの はじめの高さ）
  const LOW = 28, LH = 30, TH = 400;

  // ---- 下：屋根の海（つぎはぎの家を いくつか作り、まねて ならべる） ----
  const VAR = [...Array(12)].map((_, i) => C.shack({ w: 4.5 + hash(i, 1) * 3, d: 4.5 + hash(i, 2) * 2, floors: 1 + Math.floor(hash(i, 3) * 3.5), seed: i + 7, shop: ['door', 'shutter', 'window', 'noren'][i % 4], lit: .1, awning: i % 3 ? 'tin' : false, laundry: i % 3 === 0, tank: i % 4 === 1, antenna: i % 3 === 2 }));
  const land = R.ground({ w: 1400, d: 1400, cell: 20, layers: [X.tin({ c: '#8a6a50', rust: .7 }), T.dirt({ c: '#7a6a5a' })], mix: (x, z) => [hash(Math.round(x / 40), Math.round(z / 40)) > .5 ? 1 : 0, 0] }); land.mesh.position.y = -LOW; scene.add(land.mesh);
  { const list = []; for (let k = 0; k < 520; k++) { const a = (hash(k, 1) - .5) * 2.6 + .1, d = 12 + 520 * Math.pow(hash(k, 2), 1.5), x = Math.sin(a) * d, z = Math.cos(a) * d; if (Math.abs(x) < 13 && Math.abs(z) < 13) continue;
      const v = VAR[k % 12].clone(); v.position.set(x, -LOW, z); v.rotation.y = Math.round(hash(k, 3) * 4) * PI / 2 + (hash(k, 4) - .5) * .3; v.scale.setScalar(d > 200 ? 1.6 : 1); list.push(v); }
    for (let k = 0; k < 10; k++) { const a = (hash(k, 7) - .5) * 2, d = 60 + hash(k, 8) * 300, tk = C.tank({ r: 4 + hash(k, 9) * 3, h: 10 + hash(k, 10) * 10, c: C.PAL[k % 4] }); tk.position.set(Math.sin(a) * d, -LOW, Math.cos(a) * d); list.push(tk); }
    scene.add(R.merge(list)); }
  { const bd = C.backdrop({ r: 700, h: 70, y: -2, haze: HAZE, c: '#6a5a50' }); bd.position.y -= LOW + 40; scene.add(bd); }
  // 屋根の海から立つ けむり
  for (let k = 0; k < 6; k++) { const s = C.steam({ r: 5, rise: 40, n: 8, spread: .5, speed: .12, c: '#d8ccb8', a: .4 }); const a = (hash(k, 11) - .5) * 1.8, d = 70 + hash(k, 12) * 260; s.position.set(Math.sin(a) * d, 12 - LOW, Math.cos(a) * d); scene.add(s); }

  // ---- 上：日をあびる上の都市（行く手の上）と、それを支える柱 ----
  const city = U.city({ r: 200, n: 26, seed: 3, hmin: 50, hmax: 220, emissive: '#3a3428', plate: { th: 24, cone: 1.8, pipes: 30, lamps: false } }); city.position.set(-60, 270 - LOW, 720); scene.add(city);
  scene.add(R.merge([[-190, 600, 14], [90, 590, 13], [-60, 880, 16]].map(([x, z, r], i) => { const p = C.pillar({ r, h: 230, seed: i, c: '#7a7690', emissive: '#2a2630', lm: 40 }); p.position.set(x, -LOW, z); return p; })));

  // ---- エレベーターの鉄骨の塔（屋根の海から立つ。動かない） ----
  const TW = 6;
  { const B = R.parts(), Gd = B.g(X.girder({ c: '#7a5a48', kind: 'x' }), { side: true }), Pl = B.g(X.plate({ c: '#6a5a58', n: 2 }));
    for (let y = 0; y < TH; y += 4) for (let k = 0; k < 4; k++) { const s0 = [[-1, -1], [1, -1], [1, 1], [-1, 1]][k], s1 = [[1, -1], [1, 1], [-1, 1], [-1, -1]][k], P0 = [s0[0] * TW / 2, -6.2 + s0[1] * TW / 2], P1 = [s1[0] * TW / 2, -6.2 + s1[1] * TW / 2];
      Gd.quad([P0[0], y, P0[1]], [P1[0], y, P1[1]], [P1[0], y + 4, P1[1]], [P0[0], y + 4, P0[1]], [0, 0, 3, 2]); }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) Pl.box(.45, TH, .45, sx * TW / 2, 0, -6.2 + sz * TW / 2, { m: 3 });
    const tw = B.group(); tw.position.y = -LOW; scene.add(tw); }
  G.box(0, -6.2, TW + .5, TW + .5, -1, TH, 0, true);

  // ---- 足した：鉄の荷あげ場（y=0）。鉄板の床、ふちの金網、屋根の海へ下りる柱、受付の小屋、荷物 ----
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const DX = 9.8, DZ0 = -11, DZ1 = 9.8;
  { const Gd = R.geo(); Gd.box(DX * 2, .5, DZ1 - DZ0, 0, -.5, (DZ0 + DZ1) / 2, { m: 3 }); fixed.push(Gd.mesh(X.plate({ c: '#7a6e64', n: 3 })));
    const Gw = R.geo(); Gw.box(6.4, .02, 5.6, 0, 0, 0, { m: 3 }); fixed.push(Gw.mesh(X.plate({ c: '#8a7a5a', n: 2, warn: true })));
    const Gp = R.geo(); for (const [x, z] of [[-9, -10], [9, -10], [-9, 9], [9, 9], [-9, -.5], [9, -.5]]) Gp.box(.6, LOW, .6, x, -LOW, z, { m: 3 }); fixed.push(Gp.mesh(X.plate({ c: '#5a4e4a', n: 2 })));
    for (const z of [9, -10]) put(C.beam({ len: 18, h: .5, w: .4, c: '#6a4a3a' }), 0, z, 0, -LOW / 2); }
  G.ground(() => 0); G.bounds(-DX + .3, DX - .3, DZ0 + .3, DZ1 - .3);
  for (const [x, z, len, ry] of [[0, DZ1, DX * 2, 0], [0, DZ0, DX * 2, 0], [-DX, (DZ0 + DZ1) / 2, DZ1 - DZ0, PI / 2], [DX, (DZ0 + DZ1) / 2, DZ1 - DZ0, PI / 2]]) { put(C.fence({ len, h: 1.15, kind: 'mesh', c: '#8a7a6a' }), x, z, ry); G.box(x, z, len, .12, 0, 1.25, ry, true); }
  put(C.shack({ w: 4, d: 3.2, floors: 1, seed: 21, shop: 'window', lit: .2, awning: 'tin', antenna: true }), -7.4, -6.4, PI / 2); G.box(-7.4, -6.4, 4.3, 3.4, -1, 4, PI / 2, true);
  put(C.tank({ r: .8, h: 1.8, kind: 'v', c: '#4f8f88', legs: true }), 7.6, -8.6, 0, 0, 'round', { r: .9 });
  // 荷物（ドラムかん・たる・タイヤ）と、のぼれる木箱の山（3 段。いちばん上から 屋根の海を見下ろせる）
  [[6.2, 7.6, 'd'], [7, 7.9, 'd'], [8.4, 3, 'b'], [8.5, 2, 'b'], [-8.5, 1.5, 't'], [5, -9.8, 'd'], [-3.8, -9.9, 'b']].forEach(([x, z, k], i) => put(k === 'd' ? C.drum({ c: C.PAL[i % 4], mark: 'band' }) : k === 'b' ? R.barrel({ h: .9 }) : C.tires({ n: 3 }), x, z, i, 0, 'round'));
  [[-6.6, 7.4, 0, 1], [-5.6, 7.5, 0, .9], [-7.6, 7.3, 0, .9], [-6.1, 7.4, 1, .9], [-7.1, 7.3, .9, .9], [-6.6, 7.3, 1.85, .9]].forEach(([x, z, y, s], i) => put(R.crate({ s, kind: i % 2 ? 'x' : 'slash' }), x, z, i * .15, y, 'box'));
  scene.add(R.merge(fixed));

  // ---- 足した：30 m 上の 中つぎの踊り場（塔の前に はり出す。かごが ここで止まる） ----
  { const F2 = [], Gd = R.geo(); Gd.box(8.4, .4, 6.6, 0, LH - .4, 6.1, { m: 3 }); F2.push(Gd.mesh(X.plate({ c: '#7a6e64', n: 3 })));
    for (const sx of [-1, 1]) { const b = C.beam({ len: 12.6, h: .5, w: .4, c: '#6a4a3a' }); b.position.set(sx * 3.65, LH - .9, 3.1); b.rotation.y = PI / 2; F2.push(b); }
    for (const [x, z, len, ry] of [[-4.2, 6.1, 6.6, PI / 2], [4.2, 6.1, 6.6, PI / 2], [0, 9.4, 8.4, 0], [-3.7, 2.8, 1, 0], [3.7, 2.8, 1, 0]]) { const f = C.fence({ len, h: 1.15, kind: 'mesh', c: '#8a7a6a' }); f.position.set(x, LH, z); f.rotation.y = ry; F2.push(f); G.box(x, z, len, .12, LH, LH + 1.25, ry, true); }
    const bn = R.bench({ w: 1.6 }); bn.position.set(-2.2, LH, 8.6); bn.rotation.y = PI; F2.push(bn);
    const cr = R.crate({ s: .8 }); cr.position.set(3.2, LH, 8.5); cr.rotation.y = .3; F2.push(cr); const cr2 = R.crate({ s: .6, kind: 'x' }); cr2.position.set(3.4, LH + .8, 8.5); F2.push(cr2);
    scene.add(R.merge(F2)); }
  G.box(0, 6.1, 8.4, 6.6, LH - .4, LH, 0); G.box(-2.2, 8.6, 1.6, .5, LH, LH + .45, 0); G.box(3.2, 8.5, .8, .8, LH, LH + .8, .3); G.box(3.4, 8.5, .6, .6, LH, LH + 1.4, 0);

  // ---- かご（動く足場）。見た目は もとの場面のまま、前だけ あけた。当たりの箱は かごといっしょに上下する ----
  const cage = new THREE.Group(); scene.add(cage);
  { const B = R.parts(), P = B.g(X.plate({ c: '#7a6a60', n: 2, warn: true })), Gd = B.g(X.girder({ c: '#8a5a40' }), { side: true }), Ms = B.g(X.mesh({}), { side: true });
    P.box(6.4, .35, 5.6, 0, -.35, 0, { m: 3, bottom: true });
    for (const [x, z] of [[-3.1, -2.7], [3.1, -2.7], [-3.1, 2.7], [3.1, 2.7]]) P.box(.22, 4.4, .22, x, 0, z, { m: 3 });
    P.box(6.6, .3, .3, 0, 4.4, -2.7, { m: 3 }); P.box(6.6, .3, .3, 0, 4.4, 2.7, { m: 3 }); P.box(.3, .3, 5.6, 0, 4.6, 0, { m: 3 });
    Ms.quad([-3.1, 0, -2.7], [3.1, 0, -2.7], [3.1, 1.2, -2.7], [-3.1, 1.2, -2.7], [0, 0, 6, 1.2]); Ms.quad([3.1, 0, -2.7], [3.1, 0, 2.7], [3.1, 1.2, 2.7], [3.1, 1.2, -2.7], [0, 0, 5.4, 1.2]); Ms.quad([-3.1, 0, 2.7], [-3.1, 0, -2.7], [-3.1, 1.2, -2.7], [-3.1, 1.2, 2.7], [0, 0, 5.4, 1.2]);
    Gd.quad([-3.1, 4.1, -2.7], [3.1, 4.1, -2.7], [3.1, 4.4, -2.7], [-3.1, 4.4, -2.7], [0, 0, 4, .3]);
    cage.add(B.group());
    for (const [o, x, z, ry] of [[R.crate({ s: .8 }), -2.2, -1.8, .2], [R.crate({ s: .6, kind: 'x' }), -2.2, -.9, -.1], [C.drum({ c: C.PAL[0] }), 2.3, -1.9, 0], [C.drum({ c: C.PAL[2], mark: 'band' }), 1.6, -2.1, 0], [C.tires({ n: 2 }), 2.4, -.8, 0]]) { o.position.set(x, 0, z); o.rotation.y = ry; cage.add(o); }
    const lamp = C.signal({ h: .1, cs: ['#ffb030'], blink: true }); lamp.position.set(3.1, 4.5, 2.7); cage.add(lamp);
    const P2 = R.parts(); P2.g(X.panel({})).box(.5, 1.1, .35, 0, 0, 0, { m: 1 }); const pn = P2.group(); pn.position.set(-2.9, 0, .6); cage.add(pn); }
  cage.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.6, 4.6, 0), new THREE.Vector3(-.6, 400, 0), new THREE.Vector3(.6, 4.6, 0), new THREE.Vector3(.6, 400, 0)]), new THREE.LineBasicMaterial({ color: '#3a3038' })));
  const weight = new THREE.Group(); { const B = R.parts(); B.g(X.plate({ c: '#5a5a6a', warn: true })).box(2.4, 3, 1.4, 0, 0, 0, { m: 3, bottom: true }); weight.add(B.group()); } scene.add(weight);
  // かごの当たり：[x, z, はば, おく, 下, 上, かべ]（かごの床からの高さ）
  const ride = [[0, 0, 6.4, 5.6, -.4, 0, false], [0, -2.75, 6.4, .14, 0, 1.25, true], [-3.15, 0, .14, 5.6, 0, 1.25, true], [3.15, 0, .14, 5.6, 0, 1.25, true],
    [-2.2, -1.8, .8, .8, 0, .8, false], [-2.2, -.9, .6, .6, 0, .6, false], [2.3, -1.9, .6, .6, 0, .9, false], [1.6, -2.1, .6, .6, 0, .9, false], [2.4, -.8, .8, .8, 0, .4, false], [-2.9, .6, .5, .35, 0, 1.1, true]]
    .map(([x, z, w, d, a, b, wall]) => ({ b: G.box(x, z, w, d, a, b, 0, wall), a, h: b }));
  // かごが いない階の 入口をふさぐ しま模様の柵（かごが 2 m より近いと上がる。乗っている人を押し出さないように）。見た目の横木と、見えない かべ
  const bar = y => { const Gb = R.geo(); Gb.box(6.4, .16, .16, 0, 0, 0, { m: 2 }); const m = Gb.mesh(X.plate({ c: '#c8a040', n: 1, warn: true })); m.position.set(0, y + 1, 3.05); scene.add(m); return m; };
  // 見えない かべは あいた形で作り、毎コマの G.tick で高さを決める（はじめのコマで かごの中の人を押し出さないように）
  const gates = [{ y: 0, m: bar(0), b: G.box(0, 0, 6.4, 5.8, -99, -98, 0, true) }, { y: LH, m: bar(LH), b: G.box(0, 0, 6.4, 5.8, -99, -98, 0, true) }];

  // ---- 人（TL.person） ----
  const folk = (o, x, y, z, ry, d) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const op = folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#5a6a4a', hair: 'center', head: { hair: '#8a8a8a', skin: '#d8a878', eyes: 'small', mouth: 'line', beard: 'stubble' }, colors: { linen: '#d8c8a8', pants: '#4a4a5a', scarf: '#7a5a3a' } }, -2.35, 0, .6, PI / 2 + .3,
    { name: 'かご係のおじさん', lines: [['のるなら、かごの まん中に 立っててくれ。', 'あとは かってに のぼって、かってに おりる。'], ['上の踊り場で 少し止まる。', 'そこから先は、通行証が ないと 行けないんだ。'], 'ワイヤーが 鳴る音で、天気が 分かるのさ。今日は 晴れだ。'] });
  folk({ size: 'normal', outfit: 'traveler', hair: 'swept', head: { hair: '#5a3424', skin: '#f0c49c', eye: '#4a6a9a', mouth: 'open', blush: true }, colors: { tunic: '#3a6ab0', vest: '#a8743a', pants: '#3a6ab0', scarf: '#e8c040' } }, 3, 0, 4.4, -PI * .8,
    { name: '荷を背負った娘', lines: [['この荷物、上の踊り場まで とどけるの。', 'かごに 乗るのは はじめてで、どきどきする。'], ['上の都市の 白い塔、ここから見ても まぶしいね。', 'いつか 中を 歩いてみたいな。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#4f8f88', hair: 'center', head: { hair: '#3a2a22', skin: '#e8b890', eye: '#8a4a6a', mouth: 'smile' }, colors: { tunic: '#8a5a3a', apron: '#eee6d4' } }, -5.4, 0, -6.2, PI / 2,
    { name: '受付のおかみさん', lines: [['荷物は ここで 重さを はかってね。', '人は……まあ、だいたい 六十キロね。'], ['かごは のぼって、止まって、おりて、止まって。', 'ずっと その くりかえしよ。']] });
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#a8743a', hair: 'wolf', bulk: 1.12, head: { hair: '#6a4a2a', skin: '#a8704a', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#d8ccb0', pants: '#5a4a3a', scarf: '#c2453a' } }, 0, 0, 0, 0,
    { name: '荷運びの男', path: loop([[4.6, 6.6], [7.8, 4.8], [8, -2.4], [6.4, -6.8], [4.4, -3], [4.2, 2.6]]), speed: 1.1, lines: [['下の市場から 荷を かついで 階段 千段だ。', 'かごが あるのは ここからだけでな。'], '木箱の 山に のぼってみな。屋根の海が 足の下だ。'] });
  folk({ size: 'child', outfit: 'traveler', hat: 'cap', hatC: '#c2453a', hair: 'wolf', head: { hair: '#2a2a34', eye: '#3a7a5a', mouth: 'open', blush: true }, colors: { tunic: '#c2453a', vest: '#f4e8c8', pants: '#5a4a3a', scarf: '#4f8f88' } }, 1.6, 0, 8.6, 0,
    { name: '手をふる子', lines: [['おーい！ おーい！', '……上の人、ぜんぜん 気づいてくれない。'], ['あの けむりの下に、ぼくの家が あるんだよ。', 'どれだか 分かる？ ぼくも 分かんない！']] });
  folk({ size: 'small', outfit: 'robe', hold: 'staff', hair: 'center', head: { hair: '#e8e8e8', skin: '#d8a878', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'beard' }, colors: { tunic: '#6a5a4a', trim: '#d8ccb0' } }, 6.6, 0, -9.4, -PI / 2 - .4,
    { name: 'はとに えさをやる じいさん', lines: [['ほっほ、はとは 上にも 下にも 自由に 行ける。', 'うらやましいのう。'], ['わしは 若いころ、この塔を 組みたてた。', 'てっぺんまで 四百メートル。風が 強かったわい。']] });
  folk({ size: 'normal', outfit: 'worker', hat: 'kerchief', hatC: '#c8a040', hair: 'swept', head: { hair: '#8a5a3a', skin: '#c8906a', eye: '#6a4a2a', mouth: 'smile' }, colors: { linen: '#e8dcc0', pants: '#4f6a6a', scarf: '#b05a4a' } }, -5, 0, 6, PI / 2 + .6,
    { name: 'ひと休みの荷運び', lines: [['ふう、ちょっと休けい。', 'この木箱、中身は 下の町の なべと やかんさ。'], ['上の都市でも、やかんは 下の町の物が いちばん 長もちするって。', 'ちょっと うれしいだろ。']] });
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'center', head: { hair: '#3a2e2a', skin: '#e0b088', eye: '#5a5a7a', brow: 'angry', mouth: 'line' }, colors: { metal: '#d8c890', tunic: '#e8e4d8' } }, -2.4, LH, 7.6, PI / 6,
    { name: '踊り場の見張り', lines: [['ここから先は、上の都市の 通行証が いる。', '……持っていないなら、ながめだけ 楽しんでいけ。'], ['ここに 立っていると、下の けむりと 上の光の まん中にいる 気がする。', 'どちらの 人間でも ないみたいにな。']] });
  folk({ size: 'tall', outfit: 'robe', hat: 'hood', hatC: '#f2ede0', hair: 'swept', head: { hair: '#e8d8a0', skin: '#f4d8c0', eye: '#3a7ac8', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#f2ede0', trim: '#e8b848', belt: '#e8b848' } }, 2.2, LH, 6.8, PI * .9,
    { name: '上の都市の書記', lines: [['下から 来たのですか？ 遠い道のりを。', 'わたしは 荷の目録を つけに おりてきたのです。'], ['上の都市は きれいですが、少し しずかすぎます。', '下の 市場の にぎやかさが、ときどき うらやましい。']] });

  // ---- しらべられる物 ----
  G.sign(-3.6, 1, 3.4, { name: '運行の案内板', lines: [['「のぼり・くだり かわりばんこ。止まるのは 下と 中つぎの 踊り場」', '「柵が 上がるまで 待つこと」']] });
  G.sign(-3, 1, 9.3, { name: '屋根の海', lines: [['足の下 ずっと、さびた トタンの 屋根が つづく。', 'あちこちから 白い けむりが 立ちのぼっている。']] });
  G.sign(0, LH + 1, 9.1, { name: '中つぎの踊り場からの ながめ', lines: [['白い塔の都市が、さっきより ずっと近い。', '金の かざりが、日をあびて ちかちか光っている。']] });
  const panel = G.sign(-2.9, 1.1, .6, { name: 'かごの操作盤', lines: [['赤い ボタンと、緑の ボタン。', '……かご係のおじさんが、さわるなと 目で言っている。']] });

  // ---- はとと、空を回る鳥 ----
  const birds = [...Array(7)].map(() => { const b = R.bird({ c: '#8a8a98', belly: '#e8e4dc', s: 1.3 }); scene.add(b); return b; });
  const doves = [[5.6, -9.6], [5.9, -8.8], [5.2, -9], [6.2, -10.1]].map(([x, z], i) => { const b = R.bird({ c: '#a8a8b8', belly: '#e8e4dc', neck: true }); b.position.set(x, 0, z); b.rotation.y = i * 1.7; scene.add(b); return b; });

  // ---- はじめの場所（かごの中。上の都市を見上げる）と、自動で歩く道（荷あげ場をめぐる） ----
  G.spawn(.2, 1.2, 0);
  G.tour([[.2, 4.6], [5.4, 5.6], [8, .6], [7.6, -5.4], [4.2, -10.2], [-4.2, -10.2], [-8.2, -3], [-8.6, 3.6], [-4, 5.2], [-1.4, 7.8], [3.6, 8.4], [5.4, 3.6]]);

  // ---- 毎コマ：かごの上下（下で 7 秒 → 11 秒で のぼる → 上で 7 秒 → 11 秒で おりる）、柵、おもり、鳥 ----
  // ?lift=秒 で かごの時計を進める（確かめる用）
  const L0 = +(new URLSearchParams(location.search).get('lift') || 0), WAIT = 7, MOVE = 11, PER = 2 * (WAIT + MOVE), ss = k => k * k * (3 - 2 * k), lift = t => { const s = t % PER; return s < WAIT ? 0 : s < WAIT + MOVE ? LH * ss((s - WAIT) / MOVE) : s < 2 * WAIT + MOVE ? LH : LH * (1 - ss((s - 2 * WAIT - MOVE) / MOVE)); };
  G.tick((t, dt, P) => {
    G.cam.rotateX(innerWidth < innerHeight ? .12 : .18);
    const y = lift(t + L0); cage.position.y = y; weight.position.set(1.6, TH - 20 - LOW - (y + LOW) * .9, -6.2);
    for (const r of ride) { r.b.y0 = y + r.a; r.b.y1 = y + r.h; }
    op.o.position.y = y; panel.o.position.y = y + 1.1;
    for (const g of gates) { const here = Math.abs(y - g.y) < 2; g.b.y0 = here ? -99 : g.y; g.b.y1 = here ? -98 : g.y + 1.25; g.m.position.y += ((here ? g.y + 2.6 : g.y + 1) - g.m.position.y) * Math.min(1, dt * 4); g.m.visible = Math.abs(P.y - g.y) < 8; }
    birds.forEach((b, i) => { const a = t * .35 + i * .9; b.position.set(Math.sin(a) * 16 - 2, 14 + i * 2.2 + Math.sin(a * 1.7 + i) * 2.5, Math.cos(a) * 10 + 18); b.rotation.y = a + PI / 2; R.birdPose(b, 'fly', t * 4 + i); });
    doves.forEach((b, i) => R.birdPose(b, 'peck', t + i * 1.3));
    C.update(t, G.cam); });
});
