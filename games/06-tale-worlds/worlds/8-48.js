// ワールド 8-48「スクラップ置き場」。もとは game-looks-8/48-scrapyard-kids.html（見るだけの場面）。
// 鉄の都市の下町の スクラップ置き場。鉄くずとタイヤの山が子どもたちの遊び場で、手作りの旗が立つ。天井の大きなすき間から上の層の光が落ちる。
// ゲームにするために足した物：鉄くずの山は段々の当たり判定で てっぺんまで歩いてのぼれる。タイヤの山・トラック・コンテナにも乗れる（木箱の段つき）。
// 遊ぶ子どもと 置き場の人 9 人、ねこ、しらべられる物 4 つ、まわりのフェンスを足して かこんだ。
TALE_WORLD('8-48', G => {
  const { THREE, K, R, T, TL, scene } = G, C = PACK_CITY(THREE, K, R), X = C.tex, { hash } = K, PI = Math.PI;
  const HAZE = '#d6c4a2', RED = '#d8402c', BLUE = '#2f6ac8', YEL = '#f0c020', GRN = '#3aa050', IRON = ['#7a5a48', '#8a6a50', '#6a5a52', '#9a7a58', '#5e5048'];
  scene.background = new THREE.Color(HAZE); scene.add(C.dome({ r: 420, c: '#7a6a5a', haze: HAZE, lights: ['#fff4d0', '#ffe0a0'] }), C.backdrop({ r: 210, h: 40, y: -3, c: '#7a6252', haze: HAZE })); scene.fog = new THREE.Fog(HAZE, 34, 180);
  K.lights(scene, G.renderer, { sky: 0xfff0d8, ground: 0x8a705a, amb: 1.55, sun: 0xfff0c8, power: 1.5, range: 30, pos: [13, 48, 10] });

  // ---- 地面：こげ茶の土と、鉄板・草。上からの広い光を焼きこむ ----
  const OPEN = (x, z) => Math.abs(x - 12) < 16.1 && Math.abs(z + 2) < 12.1;   // 天井のすき間
  const lights = [{ x: 4, z: -2, r: 15, c: '#fff0c0', k: .55 }, { x: 18, z: -1, r: 15, c: '#fff0c0', k: .55 }, { x: 11, z: 5, r: 12, c: '#fff0c0', k: .4 }];
  const land = R.ground({ w: 170, d: 110, cell: 2, layers: [T.dirt({ c: '#7a5e48', pebbles: .8 }), X.plate({ c: '#8a7868', n: 2, rust: .8 }), T.grass({ c: '#6aa04a', flowers: .3 })], mix: (x, z) => [hash(Math.round(x / 4), Math.round(z / 4)) > .8 ? 1 : 0, Math.sin(x * .23) * Math.cos(z * .31) > .55 ? 1 : 0], shade: C.lightShade(lights, [.74, .7, .66]) });
  scene.add(land.mesh); G.ground(() => 0); G.bounds(-15.6, 43, -16.2, 13.6);

  // ---- 鉄くずの山・タイヤ・こわれたトラック・コンテナ・ドラムかん・フェンス ----
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  // 鉄くずの山の当たり判定：高さ 0.38 m ずつの段（同じ中心の円柱）を重ね、すそから てっぺんまで歩いてのぼれるようにする。r(y) は山の形（C.scrap の loft）の半径
  const mound = (x, z, s, y0 = 0) => { const P = [[0, 1.05], [.22, .865], [.46, .54], [.62, .19]], h = s * .62, n = Math.ceil(h / .38), r = y => { const k = y / s; for (let i = 1; i < P.length; i++) if (k <= P[i][0]) { const a = P[i - 1], b = P[i], f = (k - a[0]) / (b[0] - a[0]); return s * (a[1] + (b[1] - a[1]) * f); } return s * .19; };
    for (let i = 0; i < n; i++) { const y1 = h * (i + 1) / n; G.circle(x, z, Math.max(.35, r(y1 - h / n * .5)), -1, y0 + y1); } };
  // [x, z, 大きさ]：山の てっぺんは 高さ 大きさ×.62
  const MOUNDS = [[7, -6.2, 4.4], [17.5, 4.6, 3], [-1, -7.5, 2.6], [25, -6, 3.4], [2, 6.5, 2], [31, 5, 2.4], [-9, 5.5, 2.8], [14, -12, 3], [38, -3, 3.6], [-12, -5, 2]];
  MOUNDS.forEach(([x, z, s], i) => { put(C.scrap({ s, seed: i, cs: [...IRON, '#b5603c', '#4f8f88', '#c8a04a'] }), x, z, i * 1.3, 0, 'none'); mound(x, z, s); });
  put(C.scrap({ s: 2.2, seed: 12, cs: [...IRON, '#b5603c', '#c8a04a'] }), 7, -6.2, 5.14, 1.5, 'none'); mound(7, -6.2, 2.2, 1.5);   // まん中の山は 2 段
  for (const [x, z, n, k] of [[4.5, -1.6, 4, 'stack'], [5.3, -2.2, 2, 'stack'], [12.5, 2.6, 3, 'pile'], [21, 1.5, 5, 'stack'], [21.8, 2.2, 3, 'stack'], [-3, 2.6, 3, 'pile'], [28, -1.5, 4, 'stack'], [15, -2, 2, 'pile'], [-6, -2.4, 3, 'stack']]) put(C.tires({ n, kind: k, seed: x }), x, z, x, 0, 'round', { pad: .8 });
  { const tr = C.truck({ c: '#c8a04a', load: 'crates', seed: 2 }), g = new THREE.Group(); tr.rotation.z = -.07; tr.rotation.x = .05; tr.position.y = -.12; g.add(tr); put(g, 6.5, 4.2, 2.7, 0, 'box', { pad: .1 }); const t2 = C.truck({ c: '#5a8ab0', load: 'none', seed: 5 }), g2 = new THREE.Group(); t2.rotation.z = .1; t2.position.y = -.2; g2.add(t2); put(g2, 30, -9.5, .5, 0, 'box', { pad: .1 }); }
  put(C.container({ c: '#8a5a3c', len: 6 }), -9, -11, .2); put(C.container({ c: '#5a7a70', len: 6 }), -8.6, -10.8, .1, 2.45); put(C.container({ c: '#9a7a48', len: 6 }), 24, 11, -.3);
  put(C.containerHouse({ n: 3, seed: 4, lit: .6 }), 40, 9, -1.1, 0, 'wall');
  for (const [x, z, c, m] of [[1.2, -2.6, RED, 'band'], [1.9, -3, '#8a6a50', 'none'], [10.5, 3.2, BLUE, 'diamond'], [23.5, -1.2, YEL, 'band'], [16, -7.4, '#6a5a52', 'none'], [-4.5, 4.8, GRN, 'band']]) put(C.drum({ c, mark: m }), x, z, x, 0, 'round');
  put(R.crate({ s: .7 }), 13.6, 6.6, .3); put(R.crate({ s: .5, kind: 'x' }), 14.3, 6.2, .8); put(C.trike({ c: RED, load: 'drum' }), 19, -3.4, 2.2); put(C.bike({ c: BLUE }), 1.5, 4.6, 1.2, 0, 'box', { pad: .2 }); put(C.moto({ c: '#8a6a50' }), 27.5, 2.4, .6, 0, 'box', { pad: .1 });
  for (const [x, z, len, ry, k] of [[10, -17, 30, 0, 'tin'], [-17, -2, 22, PI / 2, 'tin'], [10, 14.5, 26, 0, 'mesh'], [44, -8, 14, PI / 2 + .1, 'tin']]) put(C.fence({ len, h: 2.1, kind: k, cs: ['#8a5a3c', '#7a6a58', '#9a7a48', '#5a7a70'], seed: x }), x, z, ry, 0, 'none');
  // 足した：フェンスの すき間を ふさぐ（ここが置き場のはし）
  for (const [x, z, len, ry, k] of [[-11, -17, 12, 0, 'tin'], [32, -17, 14, 0, 'tin'], [-17, 12, 6, PI / 2, 'mesh'], [-10, 14.5, 14, 0, 'mesh'], [33, 14.5, 20, 0, 'mesh'], [44.2, 6, 15, PI / 2, 'tin']]) put(C.fence({ len, h: 2.1, kind: k, cs: ['#8a5a3c', '#7a6a58', '#9a7a48', '#5a7a70'], seed: x + 7 }), x, z, ry, 0, 'none');
  // 足した：木箱の段（コンテナの上へ のぼれる）と、山のふもとの 木箱・ドラムかん
  [[19.7, 8.7, 0], [20.3, 9.85, 0], [20.3, 9.85, .9]].forEach(([x, z, y], i) => put(R.crate({ s: .9, kind: ['slash', 'x', 'plain'][i % 3], c: '#9a7a50' }), x, z, .2 - .3 * i, y));
  [[-6.6, -9.2, 0], [-6.9, -8.2, 0]].forEach(([x, z, y], i) => put(R.crate({ s: .8, kind: i ? 'x' : 'plain', c: '#8a6a48' }), x, z, .4, y));
  for (const [x, z, c] of [[33.6, -1.2, BLUE], [34.2, -.4, RED]]) put(C.drum({ c, mark: 'band' }), x, z, x, 0, 'round');
  for (let i = 0; i < 44; i++) { const x = -14 + hash(i, 1) * 56, z = -15 + hash(i, 2) * 28; if (Math.abs(z) < 1.5 || MOUNDS.some(([mx, mz, s]) => Math.hypot(x - mx, z - mz) < s * 1.1)) continue; put(R.tuft({ kind: ['grass', 'flower', 'grass'][i % 3], s: .7 + hash(i, 3) * .5 }), x, z, hash(i, 4) * 6, 0, 'none'); }
  put(R.tree({ kind: 'round', h: 4.6, c: '#5a9a4a', seed: 2 }), -13, 9.5, 0, 0, 'trunk'); put(R.tree({ kind: 'bush', h: 2.6, c: '#5a9a4a', seed: 5 }), 34, 11, 0, 0, 'round', { pad: .6 });

  // ---- クレーンの骨組み（鉄骨のトラスを立てる）と、タイヤのぶらんこ ----
  const CR = [22, -10.5], JIB = 12, TIP = [CR[0] - 9.2, 10.2, CR[1] + 5.3];
  { const tower = C.truss({ len: 11, h: 1.3, w: 1.3, c: '#8a6a44' }); tower.rotation.z = PI / 2; tower.position.set(CR[0] + .65, 5.5, CR[1]); fixed.push(tower);
    const jib = C.truss({ len: JIB + 3, h: 1, w: .8, c: '#c8a04a' }); jib.rotation.y = PI + .52; jib.position.set(CR[0] - 4.2, 10, CR[1] + 2.4); fixed.push(jib);
    const Gc = R.geo(); Gc.box(2.2, .5, 2.2, CR[0], 0, CR[1], { m: 3, taper: .9 }); Gc.box(1.5, 1.3, 1.5, CR[0] + 2.6, 9.4, CR[1] - 1.5, { m: 3 }); fixed.push(Gc.mesh(X.plate({ c: '#8a6a44', rust: .8 })), C.pipe([[CR[0], 12.6, CR[1]], TIP.map((v, i) => i === 1 ? v + .9 : v)], .04, { c: '#5a5048', joint: 0 }), C.pipe([[CR[0], 11, CR[1]], [CR[0], 12.7, CR[1]]], .1, { c: '#8a6a44', joint: 0 }));
    G.box(CR[0], CR[1], 2.2, 2.2, -1, .5); G.box(CR[0], CR[1], 1.4, 1.4, .4, 12, 0, true); }
  const swing = new THREE.Group(); { const Gs = R.geo(); Gs.box(.05, 8.2, .05, 0, -8.2, 0, { m: 1 }); swing.add(Gs.mesh(T.metal({ c: '#a89878' }))); const ty = C.tires({ n: 1, r: .5 }); ty.rotation.x = PI / 2; ty.position.set(0, -8.5, -.1); swing.add(ty); swing.position.set(...TIP); scene.add(swing); }

  // ---- 手作りの旗（さおと、ゆれる布）。山のてっぺん・クレーン・フェンスに ----
  const flags = [], flag = (x, y, z, h, c, c2, pat, w = 1.2) => { const g = new THREE.Group(), P = R.geo(); P.box(.07, h, .07, 0, 0, 0, { m: 2 }); g.add(P.mesh(T.planks({ c: '#b08a5a' }))); const F = R.geo(), n = 4, fh = w * .62; for (let i = 0; i < n; i++) F.quad([i * w / n, 0, 0], [(i + 1) * w / n, 0, 0], [(i + 1) * w / n, fh, Math.sin(i + 1) * .08], [i * w / n, fh, Math.sin(i) * .08], [i / n, 0, (i + 1) / n, 1], 1 - (i % 2) * .12);
    const m = F.mesh(T.fabric({ c, c2, pattern: pat, m: w }), { side: true }); m.position.y = h - fh - .04; g.add(m); g.userData.cloth = m; g.position.set(x, y, z); scene.add(g); flags.push(g); return g; };
  flag(7.6, 2.75, -6.5, 2.8, RED, '#fff4dc', 'stripe', 1.9); flag(17.5, 1.7, 4.6, 1.9, YEL, BLUE, 'check'); flag(25, 1.95, -6, 2, GRN, '#fff4dc', 'stripe'); flag(-1, 1.5, -7.5, 1.7, BLUE, '#fff4dc', 'check', 1); flag(CR[0], 12.7, CR[1], 1.6, RED, YEL, 'check', 1.4); flag(38, 2.1, -3, 1.8, YEL, '#fff4dc', 'stripe');
  for (const [x, z, y] of [[7.6, -6.5, 2.75], [17.5, 4.6, 1.7], [25, -6, 1.95], [-1, -7.5, 1.5], [38, -3, 2.1]]) G.circle(x, z, .1, y, y + 2.6);   // 旗ざお
  { const P = R.Px(32, 8); P.clip = true; [RED, YEL, BLUE, GRN].forEach((c, i) => { const M = R.ramp(c); for (let y = 1; y < 8; y++) for (let x = 0; x < 8; x++) if (Math.abs(x - 3.5) < (8 - y) * .5) P.set(i * 8 + x, y, x < 3 ? M[4] : M[3]); }); P.rect(0, 0, 32, 1, '#5a5048'); const bt = T.from(P, { m: 2, cut: true }), Gb = R.geo();
    for (const [a, b] of [[[7.6, 5.4, -6.5], [17.5, 3.5, 4.6]], [[7.6, 5.4, -6.5], [-1, 3.1, -7.5]], [[7.6, 5.4, -6.5], [25, 3.8, -6]]]) for (let i = 0, n = 7; i < n; i++) { const p = k => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - Math.sin(k * PI) * 1.1, a[2] + (b[2] - a[2]) * k], p0 = p(i / n), p1 = p((i + 1) / n); Gb.quad([p0[0], p0[1] - .5, p0[2]], [p1[0], p1[1] - .5, p1[2]], p1, p0, [0, 0, 2, 1]); } fixed.push(Gb.mesh(bt, { side: true })); }
  scene.add(R.merge(fixed));

  // ---- 天井（大きなすき間と、またぐ鉄骨）・ひろい光のすじ・遠くの柱 ----
  scene.add(C.ceiling({ w: 256, d: 144, y: 18, cx: 8, c: '#6a5a50', leak: .8, hole: OPEN }));
  { const tr = []; for (const x of [0, 8, 16, 24]) { const t = C.truss({ len: 24, h: 1.6, w: 1.2, c: '#6a5a50' }); t.rotation.y = PI / 2; t.position.set(x, 17.2, -2); tr.push(t); } scene.add(R.merge(tr)); }
  [[3, -3, 13, .05], [15, -6, 12, -.04], [21, 2, 13, .06], [9, 5, 10, -.06]].forEach(([x, z, w, lean], i) => { const s = C.shaft({ w, h: 18.5, c: '#fff2c8', a: .2, lean, n: 3, rot: i * .7 }); s.position.set(x, 0, z); scene.add(s); });
  scene.add(R.merge([[60, -20, 6], [-50, 10, 6], [46, 46, 5.5], [0, -58, 6], [-34, -44, 5]].map(([x, z, r], i) => { const p = C.pillar({ r, h: 18.4, seed: i, c: '#8a7260', emissive: '#4a382c', lm: 60 }); p.position.set(x, 0, z); return p; })));

  // ---- しらべられる物 ----
  G.sign(7.2, 3.2, -6.1, { name: '手作りの旗', lines: [['シーツを 切って ぬった旗だ。', 'すみに 小さく「ここは ぼくらの城」と ししゅうがある。']] });
  G.sign(TIP[0], 1.2, TIP[2] + .6, { name: 'タイヤのぶらんこ', lines: [['クレーンの先から、ながい つなで タイヤが つるしてある。', 'ゆらすと、天井の すき間まで とどきそうだ。']] });
  G.sign(CR[0] - 1.3, 1, CR[1] + 1.2, { name: 'クレーン', lines: [['さびた 鉄骨の クレーン。もう 動かない。', 'てっぺんにも、赤い旗が ゆれている。']] });
  G.sign(13, 1, -1.2, { name: '天井のすき間', lines: [['見上げると、鉄の天井に 大きな穴が あいている。', '上の層の 光が、ここだけ ひろく おちてくる。']] });

  // ---- 遊ぶ子どもと、置き場の人（TL.person） ----
  const CC = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const ell = (cx, cz, rx, rz, ph = 0) => new THREE.CatmullRomCurve3([...Array(10)].map((_, i) => { const a = i / 10 * PI * 2 + ph; return new THREE.Vector3(cx + Math.cos(a) * rx, 0, cz + Math.sin(a) * rz); }), true, 'centripetal');
  const topKid = folk({ size: 'child', hair: 'center', head: { hair: '#8a4a2a', eye: '#4a6a9a', mouth: 'open', blush: true }, colors: CC(YEL, '#fff4dc', BLUE, RED) }, 6.8, -5.9, -2.2,
    { name: '山の上の子', lines: [['ここが あたしたちの 城の てっぺん！', 'ひろい ところから、ゆっくり のぼれば だいじょうぶ。'], ['旗の ひもは、三つの 山に つながってるの。', 'ぜんぶ あたしが むすんだんだよ。']] }, 2.8);
  topKid.idle = (t, o) => { R.idle(o, t, Math.sin(t * .8) * .4); const J = o.userData.J; J.armR.rotation.set(-2.7 + Math.sin(t * 4) * .3, 0, -.3); J.armL.rotation.set(-2.7 - Math.sin(t * 4) * .3, 0, .3); o.position.y = 2.8 + Math.abs(Math.sin(t * 4)) * .12; };
  const tireKid = folk({ size: 'child', outfit: 'worker', hair: 'wolf', head: { hair: '#c8743a', eye: '#3a7a5a', mouth: 'smile' }, colors: { pants: GRN, linen: '#fff4dc', scarf: YEL } }, 4.5, -1.6, -2.4,
    { name: 'タイヤの上の子', lines: [['タイヤの 上って、ちょっと はねるんだよ。', 'ジャンプして のってみて！'], 'あのトラックの 荷台にも のれるよ。ないしょだけど。'] }, .88);
  tireKid.idle = (t, o) => { R.idle(o, t + 1, Math.sin(t * .6) * .5); o.userData.J.armR.rotation.x = -2.4 + Math.sin(t * 3) * .3; };
  folk({ size: 'child', hair: 'swept', head: { hair: '#4a3428', eye: '#5a4a2a', mouth: 'open', blush: true }, colors: CC(BLUE, '#fff4dc', '#6a5a4a', YEL) }, 0, 0, 0,
    { name: 'おにごっこの子', path: ell(7, 1.4, 4.6, 2.2, 1.2), speed: 3, lines: [['まてまて〜！', '……あっ、ごめん、人ちがい！'], 'つかまえたら、つぎは きみが おにだよ！'] });
  folk({ size: 'child', hat: 'kerchief', hatC: '#e86a9a', hair: 'center', head: { hair: '#2a2a34', eye: '#8a4a6a', mouth: 'open', blush: true }, colors: CC('#e86a9a', '#fff4dc', '#6a5a7a', GRN) }, 0, 0, 0,
    { name: 'にげる子', path: ell(7, 1.4, 4.3, 2.1, 1.8), speed: 3, lines: [['きゃー、こないで〜！', '……あれ、おにじゃ ないの？'], 'ここは 天井の 穴から 光が くるから、ずっと 明るいの。'] });
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#6a7a8a', hair: 'wolf', bulk: 1.15, head: { hair: '#8a8a8a', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'mustache' }, colors: { pants: '#6a7a8a', scarf: '#c8a04a' } }, 28.6, -8.2, -2.2,
    { name: '鉄くず屋の親方', lines: [['よう。ここの 鉄くずは ぜんぶ、おれの 売り物さ。', 'だが 子どもらの 城だけは、売らねえ ことにしてる。'], ['工場の 廃墟から、まだ 使える 部品が とどくんだ。', '光の ふる工場さ。いっぺん 見てみな。']] });
  folk({ size: 'normal', outfit: 'worker', hat: 'beret', hatC: '#c8a04a', hair: 'swept', head: { hair: '#3a2a22', eye: '#4a6a9a', eyes: 'small', mouth: 'smile' }, colors: { pants: '#4a5a7a', scarf: '#4f8f88' } }, 9.6, 6.6, -2.6,
    { name: '部品をさがす技師', lines: [['歯車の 大きさが ぴったり あう物が、なかなか なくて。', '時計塔の 修理に つかうの。'], 'この トラック、エンジンは まだ 生きてるかも しれない。'] });
  folk({ size: 'small', outfit: 'apron', hat: 'kerchief', hatC: BLUE, hair: 'center', head: { hair: '#c8c0b8', skin: '#e0b088', eyes: 'closed', mouth: 'smile' }, colors: { tunic: '#8a5a3c', apron: '#f0e4c8' } }, 36.6, 6.2, -2.2,
    { name: 'コンテナの家の おばあさん', lines: [['あの子たちの 旗は、わたしの 古い シーツなのよ。', 'よく ぬえてるでしょう。'], ['夜になると、霧の 高架下に 屋台が 一けん 出るの。', 'あったかい おつゆが おいしいのよ。']] });
  folk({ size: 'child', hat: 'cap', hatC: RED, hair: 'wolf', head: { hair: '#2a2a34', eye: '#3a5a8a', mouth: 'line' }, colors: CC(GRN, '#c8a04a', '#3a4a6a', '#fff4dc') }, TIP[0] - 1.6, TIP[2] + 1.2, PI * .8,
    { name: 'ぶらんこ まちの子', lines: [['ぶらんこの 順番、まってるんだ。', '……でも だれも 乗ってないね？'], 'ゆれてるのは、風の せいかなあ。'] });
  folk({ size: 'tall', hat: 'straw', hair: 'center', head: { hair: '#5a3a2a', skin: '#c8885a', eyes: 'small', mouth: 'smile', beard: 'stubble' }, colors: CC('#7a8a5a', '#8a5a3a', '#5a4a3c', '#d8402c') }, 18.2, -5.4, .5,
    { name: '三輪車の運び屋', lines: [['ドラムかんを とどけに 来たんだ。', '帰りは 空っぽで 楽ちんさ。'], ['草の線路の 廃駅まで、この車で 行ったことが ある。', 'ひまわりが 背より 高かったぞ。']] });
  // ねこ（ドラムかんの上。話しかけると ないて、すわりなおす）と、歩くねこ
  const cat = R.cat({ c: '#f0ece4', belly: '#ffffff', plain: 1 }); cat.position.set(5.3, .44, -2.2); cat.rotation.y = 2.2; scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃ。', '……ふぁあ。（あくびをした）', 'にゃーん。'], idle: t => R.catPose(cat, 'sit', t) });
  const cat2 = R.cat({ c: '#e8a050', belly: '#f4ecd8' }); scene.add(cat2);
  const birds = [[11.5, -.8, 1], [12.2, -1.3, 3], [12.8, -.5, 5]].map(([x, z, ry]) => { const b = R.bird({ c: '#a8a098', s: 1.1 }); b.position.set(x, 0, z); b.rotation.y = ry; b.userData.home = [x, z, ry]; b.userData.fly = -1; scene.add(b); return b; }), fly = [0, 1].map(() => { const b = R.bird({ c: '#fff4dc', s: 1.2 }); scene.add(b); return b; });
  const spark = C.sparks({ n: 14, every: 1.4, c: '#ffe08a', power: .8 }); spark.position.set(29.3, .9, -8.8); scene.add(spark);

  // ---- はじめの場所・自動で歩く道・毎コマ ----
  G.spawn(-5, 0, PI / 2);
  G.tour([[2.8, -1], [6.4, -5], [10, -.5], [20, 0], [29, -.5], [31, 7], [20, 8.6], [12, 9.6], [4, 9.6], [-4, 8], [-9, 1], [-5, 0]]);
  G.tick((t, dt, P) => {
    flags.forEach((f, i) => { f.userData.cloth.rotation.y = Math.sin(t * 2.2 + i * 1.3) * .4 + Math.sin(t * 5 + i) * .1; f.rotation.z = Math.sin(t * 1.1 + i) * .03; });
    swing.rotation.z = Math.sin(t * 1.3) * .16; swing.rotation.x = Math.cos(t * 1.1) * .08;
    const cu = (t * .8 / 26 + .1) % 1; cat2.position.set(2 + cu * 26, 0, 2.2); cat2.rotation.y = PI / 2; R.catPose(cat2, 'walk', t * 9);
    for (const b of birds) { const [hx, hz, hr] = b.userData.home, dh = Math.hypot(P.x - hx, P.z - hz);
      if (b.userData.fly < 0) { R.birdPose(b, 'peck', t + hr * .7); if (dh < 2.6) b.userData.fly = 0; }
      else { const f = (b.userData.fly += dt); b.visible = f < 5; b.position.set(hx + Math.cos(hr) * f * 3, Math.min(8, f * 2.6 - f * f * .1), hz + Math.sin(hr) * f * 3); b.rotation.y = Math.atan2(Math.cos(hr), Math.sin(hr)); R.birdPose(b, 'fly', t + hr); if (f > 5 && dh > 12) { b.userData.fly = -1; b.visible = true; b.position.set(hx, 0, hz); b.rotation.y = hr; } } }
    fly.forEach((b, i) => { const a = t * .45 + i * 2; b.position.set(12 + Math.cos(a) * (10 + i * 2), 10 + Math.sin(t * .8 + i), -2 + Math.sin(a) * 7); b.rotation.y = -a; R.birdPose(b, 'fly', t + i); });
    C.update(t, G.cam); });
});
