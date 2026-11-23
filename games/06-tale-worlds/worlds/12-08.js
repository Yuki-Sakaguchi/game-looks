// ワールド 12-08「ブリキのおもちゃの町」。もとは game-looks-12/08-tin-toy-town.html（見るだけの場面）。
// 絵本の昼。何もかもブリキでできた おもちゃの町。家のかべで ぜんまいのねじが回り、ブリキの汽車が線路をかけぬけ、奥には 回るこまの塔。遠くの丘には 山より大きな ねじ。
// ゲームにするために足した物：家・木・こまの塔の当たり判定、走る汽車（ぶつかると おしのけられる）、町をかこむ ブリキの柵、のぼれる つみ木の山、
// 行進する おもちゃの兵隊（隊長と話せる）、話せる町の人 7 人、しらべられる物 4 つ、あめの屋台。
TALE_WORLD('12-08', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), FW = PACK_FWILD(THREE, K, R), B = PACK_BOOK2(THREE, K, R), { hash } = K, PI = Math.PI;
  scene.add(R.skyDome([[0, '#d86aa8'], [.5, '#f0a0c0'], [.85, '#f8d8d0'], [1, '#fff0c8']], { r: 600 })); scene.fog = new THREE.Fog('#f8d8d0', 140, 760);
  K.lights(scene, G.renderer, { sky: 0xffe0f0, ground: 0xc8a888, amb: 1.4, sun: 0xfff4e0, power: 2.4, range: 36, pos: [-22, 58, 40] });
  const TIN = (c, kind = 'plain', c2, o = {}) => B.tex.tin({ c, kind, c2, ...o });

  // ---- 地面：手前はブリキの市松の道、そのうしろに線路、奥は みどりのフェルトの原っぱ ----
  const H = (x, z) => z < -26 ? Math.sin(x * .05) * 1.5 * Math.min(1, (-z - 26) / 30) : 0;
  const land = R.ground({ w: 200, d: 160, cell: 2, cz: -40, H,
    layers: [T.grass({ c: '#7ac058', flowers: .2, fc: ['#ffffff', '#f8d040'] }), TIN('#d84030', 'check', '#f8ecd0', { m: 3 }), T.dirt({ c: '#a89078', pebbles: .8 })],
    mix: (x, z) => [Math.abs(z) < 2.6 || (Math.abs(x - 12.5) < 1.3 && z < -2 && z > -24) ? 1 : 0, Math.abs(z + 5.5) < 1.6 ? 1 : 0] });
  scene.add(land.mesh); G.ground(H); G.bounds(-32.5, 50.5, -60.5, 4.3);
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };

  // ---- 線路（ブリキのレールと まくら木）。汽車はこの上を走る ----
  { const Gm = R.geo().smooth(1); for (const dz of [-.5, .5]) FW.tube(Gm, [[-400, .12, -5.5 + dz, .06], [400, .12, -5.5 + dz, .06]], 5, { m: 2 }); fixed.push(Gm.mesh(R.tex.metal({ c: '#c8ccd8' })));
    const Pl = R.geo(); for (let x = -200; x < 200; x += .9) Pl.box(.3, .1, 1.6, x, 0, -5.5, { m: 1 }); fixed.push(Pl.mesh(T.planks({ c: '#8a5a3a' }))); }

  // ---- 家：ブリキのゆがんだ家。かべから ぜんまいのねじが出て、くるくる回る ----
  const WALLS = [TIN('#3a6ac0', 'dots', '#f0c040'), TIN('#f0c040', 'plain'), TIN('#d84030', 'stripe', '#f8ecd0'), TIN('#58a8a0', 'dots', '#f8ecd0'), TIN('#f8ecd0', 'stripe', '#3a6ac0')];
  const ROOFS = [TIN('#d84030', 'stripe', '#f0c040'), TIN('#3a6ac0', 'plain'), TIN('#f0c040', 'check', '#d84030'), TIN('#58a8a0', 'stripe', '#f8ecd0')];
  const keys = [];
  [[-26, -12], [-19, -13], [-12, -11.5], [-5, -13], [2, -12], [9, -12.5], [16, -11.5], [23, -13], [30, -12], [37, -12.5], [44, -12], [-9, -20], [5, -21], [20, -20], [34, -21]].forEach(([x, z], i) => {
    const h = 3 + hash(i, 1) * 1.6 + (z < -18 ? 1.2 : 0), w = 3.2 + hash(i, 2), d = 3, ln = (hash(i, 3) - .5) * 1.4, ry = (hash(i, 6) - .5) * .3;
    put(B.house({ w, d, h, lean: ln, bulge: .14, roofH: 1.8 + hash(i, 4) * 2, roofLean: -ln, wall: WALLS[i % 5], roof: ROOFS[i % 4], wins: 2, chimney: hash(i, 5) > .5, brick: TIN('#8a8c98'), seed: i }), x, z, ry, 0, 'none');
    G.box(x, z, w + .4, d + .4, -1, 30, ry, true);
    if (z > -15) { const kg = new THREE.Group(), k = B.key({ s: .7, c: '#f0c040' }); k.rotation.x = PI / 2; kg.add(k); kg.position.set(x + ln * .3 + (hash(i, 7) - .5), h * .42, z + d / 2 * 1.14); scene.add(kg); keys.push([kg, i % 2 ? 1 : -1, 1.2 + hash(i, 8)]); } });
  for (const [x, z] of [[-15.5, -9], [5.5, -9], [26.5, -9], [-29, -9]]) put(F.flag({ kind: 'pennant', pole: 4, w: 1.4, h: .7, c: '#3a6ac0', c2: '#f0c040' }), x, z, 0, 0, 'trunk', { r: .12 });
  for (let i = 0; i < 14; i++) { const x = -40 + i * 7 + hash(i, 2) * 3, z = -27 - hash(i, 3) * 8; put(R.tree({ kind: 'round', h: 3.4 + hash(i, 1) * 2, c: i % 2 ? '#5aa848' : '#7ac058', seed: i }), x, z, i, H(x, z), 'trunk'); }
  for (let i = 0; i < 18; i++) put(R.tuft({ kind: 'flower', s: .7, fc: ['#f8d040', '#ffffff', '#d84030'], seed: i % 3 }), -30 + i * 4.3, 3.4 + hash(i, 1) * .6, i, 0, 'none');
  // 足した：町をかこむ ブリキの柵（赤と白の板。ここが町のはし）
  { const fen = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 4); for (let k = 0; k < n; k++) { const a = (k + .5) / n, x = x0 + (x1 - x0) * a, z = z0 + (z1 - z0) * a; put(R.fence({ len: L / n, kind: 'picket', h: .9, c: k % 2 ? '#d84030' : '#f8ecd0' }), x, z, Math.atan2(z1 - z0, x1 - x0) * -1, H(x, z) - .05, 'none'); } };
    fen(-33, 4.8, 51, 4.8); fen(-33, -61, 51, -61); fen(-33, -61, -33, 4.8); fen(51, -61, 51, 4.8); }
  // 足した：あめの屋台、ベンチ、ブリキの木箱
  put(R.stall({ c: '#3a6ac0', c2: '#f8ecd0', fc: ['#f8a8c0', '#f0c040', '#ffffff'] }), -6.5, -8.6, 0);
  put(R.bench({ c: '#d84030' }), 20, 3.4, PI); put(R.bench({ c: '#3a6ac0' }), -14, 3.4, PI);
  for (const [x, z, r] of [[31.6, -8.4, .3], [32.3, -9.2, 1.1], [36.4, -8.6, .7]]) put(R.crate({ s: .8, c: '#c8a060' }), x, z, r);

  // ---- 足した：つみ木の山（ブリキの つみ木を 3 だん。てっぺんから町と こまの塔が見わたせる） ----
  { const S = 1.2, BH = .9, x0 = -23.4, z0 = -8.4, cs = [['#d84030', 'dots', '#f0c040'], ['#3a6ac0', 'stripe', '#f8ecd0'], ['#f0c040', 'check', '#d84030'], ['#58a8a0', 'dots', '#f8ecd0'], ['#f8ecd0', 'stripe', '#d84030'], ['#d84030', 'plain']];
    let n = 0; for (let c = 0; c < 3; c++) { for (let k = 0; k <= c; k++) { const Gb = R.geo(); Gb.box(S, BH, S, 0, 0, 0, { m: 1.2 }); const me = Gb.mesh(TIN(...cs[n++ % 6])); me.position.set(x0 + c * S, k * BH, z0 + (k % 2 ? .06 : -.04)); me.rotation.y = (hash(c, k) - .5) * .12; fixed.push(me); }
      G.box(x0 + c * S, z0, S, S, -1, (c + 1) * BH, 0); }
    put(F.flag({ kind: 'pennant', pole: 1.8, w: .9, h: .45, c: '#f0c040', c2: '#d84030' }), x0 + 2 * S + .4, z0 - .4, 0, 3 * BH, 'none');
    G.sign(x0 + 2 * S, 3 * BH + .3, z0 + .3, { name: 'つみ木の てっぺん', lines: [['町じゅうの ねじが、くるくる 回っているのが 見える。', 'こまの塔は、ここからでも 見あげるほど 大きい。']] }); }
  scene.add(R.merge(fixed));

  // ---- こまの塔（ブリキのこま。しまの胴に窓。ゆっくり回り、首をふる）。先っぽの まわりだけ当たる ----
  const top = new THREE.Group(); top.position.set(14, H(14, -50), -50); top.scale.setScalar(1.6); scene.add(top); G.circle(14, -50, 2.7, -9, 99);
  { const P = R.parts(), body = P.g(TIN('#d84030', 'stripe', '#f8ecd0', { m: 4 })).smooth(1);
    body.loft(16, [[0, .3, .3, 0, .7], [3, 4, 4, .8, .85], [8, 9, 9, 1.8, 1], [10.5, 9.4, 9.4, 2.2, 1.05], [12.5, 7, 7, 2.6, 1.05], [15, 3, 3, 3.2, 1]], { ur: 6 });
    P.g(TIN('#3a6ac0', 'dots', '#f0c040', { m: 2 })).smooth(1).loft(12, [[14.6, 3.2, 3.2, 0, .95], [15.4, 3.4, 3.4, .5, 1.05], [16, 1.4, 1.4, 1, 1]], { ur: 4 }).loft(8, [[15.8, 1.2, 1.2, 0, 1], [24, 1, 1, 4, 1]], { ur: 2 });
    P.g(TIN('#f0c040', 'plain')).smooth(1).loft(10, [[23.6, 1.3, 1.3, 0, .9], [24.8, 2, 2, .5, 1.05], [26, 1.4, 1.4, .9, 1.1], [26.6, .2, .2, 1, 1.1]], { cap: 'top', ur: 2 });
    const W = P.g(TIN('#3a6ac0', 'window', '#f8ecd0'), { offset: true, side: true }); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2, r = 9.5, c = Math.cos(a), s = Math.sin(a); W.quad([c * r - s * 1.2, 9, s * r + c * 1.2], [c * r + s * 1.2, 9, s * r - c * 1.2], [c * r + s * 1.2, 11.4, s * r - c * 1.2], [c * r - s * 1.2, 11.4, s * r + c * 1.2], [0, 0, 1, 1]); }
    top.add(P.group()); }
  // ---- 遠くの丘に ささった、山より大きな ぜんまいのねじ ----
  const giant = B.key({ s: 58, c: '#e0b040' }); giant.position.set(-42, -4, -230); scene.add(giant);
  scene.add(R.backdrop({ c: '#b88ab0', haze: '#f8d0d8', r: 380, h: 40, y: -4, rep: 3 }));
  const clouds = []; for (let k = 0; k < 8; k++) { const c = B.puff({ s: 14 + hash(k, 1) * 10, n: 4, c: '#fff4f8', seed: k }); c.position.set(-160 + k * 48 + hash(k, 2) * 20, 40 + hash(k, 3) * 40, -220 - hash(k, 4) * 80); scene.add(c); clouds.push(c); }

  // ---- ブリキの汽車（ぜんまいの機関車と、荷台 2 両）。右から左へ走り、ぶつかると おしのけられる ----
  const train = new THREE.Group(); scene.add(train);
  { const boiler = R.geo().smooth(1).loft(12, [[-.3, .58, .58, 0, .9], [2.1, .58, .58, 1.6, 1], [2.25, .66, .66, 1.7, 1.05], [2.35, .5, .5, 1.8, 1]], { ur: 2, cap: 'top' }).mesh(TIN('#d84030', 'stripe', '#f0c040')); boiler.geometry.rotateZ(-PI / 2); boiler.position.set(0, 1.15, 0); train.add(boiler);
    const cab = R.geo(); cab.box(1.3, 1.7, 1.4, -.95, .5, 0, { m: 1.5 }); train.add(cab.mesh(TIN('#3a6ac0', 'window', '#f0c040')));
    const cr = R.geo().smooth(1).loft(4, [[2.2, .9, .95, 0, 1], [2.45, .7, .7, 1, 1.1]], { cap: 'top', ur: 2 }); cr.tint(1); const crm = cr.mesh(TIN('#d84030')); crm.position.set(-.95, 0, 0); train.add(crm);
    const ch = R.geo().smooth(1).loft(8, [[1.6, .17, .17, 0, .9], [2.3, .15, .15, .7, 1], [2.55, .3, .3, 1, 1.1]], { ur: 2 }).mesh(TIN('#2a2a3a')); ch.position.x = 1.6; train.add(ch);
    const base = R.geo(); base.box(4.2, .35, 1.2, .3, .35, 0, { m: 1 }); train.add(base.mesh(TIN('#2a2a3a', 'plain')));
    const cars = []; for (let c = 0; c < 2; c++) { const x0 = -3.6 - c * 3.2, Gc = R.geo(); Gc.box(2.8, .9, 1.3, x0, .45, 0, { m: 1.4 }); train.add(Gc.mesh(TIN(c ? '#f0c040' : '#58a8a0', 'check', '#f8ecd0')));
      for (let k = 0; k < 3; k++) { const ball = R.geo().smooth(1).loft(8, [[-.35, .08, .08, 0, .8], [-.2, .3, .3, .3, 1], [.1, .35, .35, .6, 1.05], [.33, .15, .15, 1, 1.1]], { cap: 'top', ur: 2 }).mesh(TIN(['#d84030', '#3a6ac0', '#f0c040'][(k + c) % 3], 'stripe', '#f8ecd0')); ball.position.set(x0 - .8 + k * .8, 1.55, (k - 1) * .2); train.add(ball); } cars.push(x0); }
    const wheels = []; for (const x of [1.6, .5, -.8, ...cars.flatMap(x0 => [x0 - .9, x0 + .9])]) for (const sz of [-1, 1]) { const w = R.geo().smooth(0).loft(10, [[-.06, .32, .32, 0, .9], [.06, .32, .32, .3, 1]], { cap: 'both', capRect: true }).mesh(R.tex.wheel({ kind: 'wood', c: '#d84030' })); w.geometry.rotateX(PI / 2); w.position.set(x, .34, sz * .62); train.add(w); wheels.push(w); }
    const kg = B.key({ s: .55, c: '#f0c040' }); kg.position.set(-.95, 2.4, 0); train.add(kg); train.userData = { wheels, key: kg }; }
  const trainBox = G.box(0, -5.5, 10.8, 1.5, 0, 2.6, 0, true);
  const smoke = [...Array(6)].map((_, k) => { const p = B.puff({ s: .9, n: 2, c: '#ffffff', seed: k }); scene.add(p); return p; });

  // ---- しらべられる物 ----
  G.sign(12.5, 1.2, -46.6, { name: 'こまの塔', lines: [['とがった先 1 本で、ずっと 回りつづけている。', 'ぜんまいが きれたら……と思うと、すこし こわい。']] });
  G.sign(-29, 1.4, -8.6, { name: '線路の札', lines: [['「汽車に ちゅうい。', 'ブリキの汽車は 止まれません」']] });
  G.sign(-31.6, 1.2, -59.6, { name: '遠くの大きなねじ', head: .8, lines: [['丘に ささった ねじが、ゆっくり 回っている。', 'この町ぜんぶを 動かす ぜんまいなのかもしれない。']] });

  // ---- 町の人（TL.person。主人公と同じ 4.5 頭身の作り） ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d) => { const p = TL.person(o); p.position.set(x, H(x, z), z); p.rotation.y = ry; scene.add(p); return [p, G.npc(p, d)]; };
  const backKey = (p, s = .22) => { const kg = B.key({ s, c: '#c8ccd8' }); kg.rotation.x = -PI / 2; const kw = new THREE.Group(); kw.add(kg); kw.position.set(0, .22, -.2); p.userData.J.torso.add(kw); p.userData.key = kw; return kw; };
  const busby = (p, c) => { const ud = p.userData, b0 = ud.build; ud.build = { head: ud.headH, hw: .47 }; try { B.busby(p, { c }); } finally { ud.build = b0; } };
  // おもちゃの兵隊の行進（隊長と 4 人。道を ぐるりと回る。隊長に話しかけると、みんな止まる）
  const PAR = new THREE.CatmullRomCurve3([[-24, -2.1], [40, -2.1], [41.6, -.2], [40, 1.7], [-24, 1.7], [-25.6, -.2]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal'), PL = PAR.getLength();
  const SOL = { size: 'tall', outfit: 'guard', hold: 'spear', hair: 'center', bulk: 1.04, head: { hair: '#3a2a20', skin: '#f0c49c', eyes: 'big', mouth: 'line', blush: true }, colors: { tunic: '#d84030', metal: '#f0c040', pants: '#2a3a7a', boot: '#1a1a28', glove: '#f8f8f0', scarf: '#f8f8f0', belt: '#f8f8f0' } };
  const [capt, captN] = folk({ ...SOL, hold: 'staff', colors: { ...SOL.colors, tunic: '#3a6ac0' } }, -10, -2.1, PI / 2,
    { name: 'おもちゃの兵隊の 隊長', idle: () => {}, lines: [['ぜんたーい、止まれ！', '……やあ、旅の人。われらは 町を まもる ブリキの兵隊だ。'], ['せなかの ねじが 止まるまで、行進を つづけるのだ。', '止まったら？ 町の子が また 巻いてくれる。'], ['こまの塔の 番人どのに、あいさつは したか？']] });
  busby(capt, '#f8f8f0'); backKey(capt);
  const parade = [capt, ...[1, 2, 3, 4].map(() => { const p = TL.person(SOL); busby(p, '#2a2430'); backKey(p); scene.add(p); return p; })];
  let pu = 0;
  const [sentry] = folk({ ...SOL, colors: { ...SOL.colors, tunic: '#58a8a0' } }, 12.5, -9.6, 0,
    { name: 'ふみきりの 見はり兵', lines: [['汽車が 来るぞ！ 線路の上で 止まっては いけない。', 'ブリキの汽車は ブレーキが ないのだ。'], ['奥の こまの塔へ行くなら、この道を まっすぐだ。']] });
  busby(sentry, '#2a2430'); backKey(sentry);
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#f0c040', hair: 'wolf', bulk: 1.08, head: { hair: '#6a4a2a', skin: '#e0b088', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#f8ecd0', pants: '#3a6ac0', scarf: '#d84030' } }, 3.2, -9.6, -.3,
    { name: 'ねじ巻きの職人', lines: [['毎朝、町じゅうの ねじを 巻いて まわるのが しごとさ。', 'ぜんぶで 百と八つ。'], ['あの 大きな ねじかい？', 'あれは だれにも 巻けない。じぶんで 回っているんだ。']] });
  folk({ size: 'child', hat: 'beret', hatC: '#d84030', hair: 'swept', head: { hair: '#e8a040', eye: '#3a6a9a', mouth: 'open', blush: true }, colors: C('#4aa858', '#f8ecd0', '#3a6ac0', '#f0c040') }, 0, 0, 0,
    { name: 'ねじを 回す子', path: new THREE.CatmullRomCurve3([[-3, -7.6], [1, -7.4], [1, -9.4], [-3, -9.6]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal'), speed: 2.4, lines: [['兵隊さんの ねじを 巻くのは、ぼくの やくめ！', 'たくさん 巻くと、走るんだよ。'], 'つみ木の山の てっぺんには、旗が 立ってるんだ。'] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#f8a8c0', hair: 'center', head: { hair: '#8a3a4a', eye: '#6a4a8a', mouth: 'smile', blush: true }, colors: { tunic: '#f0a0c0', apron: '#fff4f8' } }, -6.5, -9.7, 0,
    { name: 'あめ屋さん', lines: [['ブリキの かんに 入った あめは いかが？', 'ふると、からころ 鳴るのよ。'], ['いちばん 人気は、空色の あめ。', 'なめると、空を泳ぐ くじらの 夢が 見られるんですって。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'wizard', hatC: '#d84030', hold: 'staff', hair: 'center', head: { hair: '#e8e8e8', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#3a6ac0', trim: '#f0c040' } }, 9.6, -44.6, -2.3,
    { name: 'こまの塔の 番人', lines: [['ふぉふぉ。この こまは、町が できた日から 回っておる。', 'わしの しごとは、見まもることだけじゃ。'], ['こまが ふらふら しはじめたら、わしを よんでおくれ。', '……まあ、まだ百年は だいじょうぶじゃろう。']] });
  folk({ size: 'tall', hat: 'straw', hair: 'swept', head: { hair: '#2a2a34', eye: '#4a6a4a', mouth: 'smile' }, colors: C('#a8894e', '#6c4a34', '#56637a', '#3a6ac0') }, 20.6, 2.2, PI * .85,
    { name: '旅の おもちゃ売り', lines: [['いろんな 世界を まわって、おもちゃを 売っているんだ。', 'ここは 仕入れに ちょうどいい。'], ['大樹の 根もとの村の 子どもたちは、ブリキの鳥が 大すきでね。'], ['霧の上の 城下町では、兵隊の 人形が よく売れる。', 'ほんものの 衛兵さんが いるからかな。']] });
  const birds = [...Array(5)].map((_, k) => { const b = R.bird({ c: ['#3a6ac0', '#f0c040', '#d84030'][k % 3], belly: '#f8ecd0', s: 1.6 }); scene.add(b); return b; });

  // ---- はじめの場所：道のまん中から、こまの塔のほうを見る ----
  G.spawn(8, 2.4, PI - .12);
  G.tour([[12.5, -1], [12.5, -16], [13.2, -30], [10.6, -42], [17, -45], [13.4, -30], [12.5, -16], [12.5, -3], [-6, .2], [-21.5, -1], [-21, -7.2], [-6, 1.8]]);
  const march = (s, ph) => { const a = Math.sin(ph), J = s.userData.J; R.walk(s, ph, 1); J.shinL.rotation.x = J.shinR.rotation.x = .05; J.legL.rotation.x = -Math.max(0, a) * .9; J.legR.rotation.x = -Math.max(0, -a) * .9; J.armL.rotation.set(-Math.max(0, -a) * .8, 0, .1); J.armR.rotation.set(-.5, 0, -.1); J.foreR.rotation.x = -.9; J.torso.rotation.set(0, 0, 0); };
  G.tick((t, dt, P) => {
    // 兵隊：かたい足で行進（ひざを曲げず、うでは まっすぐ）。背中のねじが回る。隊長と話しているあいだは みんな止まる
    const stop = !!captN.talk; if (!stop) pu = (pu + dt * 1.15 / PL) % 1;
    parade.forEach((s, k) => { const u = ((pu - k * 1.3 / PL) % 1 + 1) % 1, p = PAR.getPointAt(u), tg = PAR.getTangentAt(u), ph = t * 5.2;
      if (k === 0 && stop) { s.userData.key.rotation.z = -t * 3; return; }
      s.position.set(p.x, H(p.x, p.z) + (stop ? 0 : Math.abs(Math.sin(ph)) * .06), p.z); s.rotation.y = Math.atan2(tg.x, tg.z); if (stop) MOstand(s, t); else march(s, ph); s.userData.key.rotation.z = -t * 3; });
    sentry.userData.key.rotation.z = -t * 2;
    // 汽車：右から左へ かけぬける（120 m を くり返す）
    const tx = 62 - (t * 4.2 + 30) % 124; train.position.set(tx, .12 + Math.abs(Math.sin(t * 13)) * .03, -5.5); trainBox.x = tx - 2.8; train.userData.wheels.forEach(w => w.rotation.z = t * 4.2 / .32); train.userData.key.rotation.y = t * 4;
    smoke.forEach((p, k) => { const q = ((t * 1.2 + k / 6) % 1); p.position.set(tx + 1.6 + q * 2.5, 2.6 + q * 2.4, -5.5); p.scale.setScalar(.4 + q * 1.4); });
    keys.forEach(([kg, d, sp]) => kg.rotation.z = d * t * sp);
    top.rotation.y = t * .9; top.rotation.z = Math.sin(t * .7) * .05; top.rotation.x = Math.cos(t * .7) * .05;
    giant.rotation.y = t * .12; clouds.forEach((c, k) => { c.position.x += dt * (1 + k % 3); if (c.position.x > 260) c.position.x -= 520; });
    birds.forEach((b, k) => { const a = t * .5 + k * 1.3, r = 9 + k * 2; b.position.set(8 + Math.cos(a) * r, 11 + k * 1.5 + Math.sin(t + k) * .6, -22 + Math.sin(a) * 6); b.rotation.y = -a; R.birdPose(b, 'fly', t * .8 + k); });
    F.tick(t); });
  const MOstand = (s, t) => G.MO.play(s, 'stand', t);
});
