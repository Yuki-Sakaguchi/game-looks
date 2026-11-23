// ワールド 12-30「下層の屋上と上層の花火」。もとは game-looks-12/30-rooftop-upper-fireworks.html（見るだけの場面）。
// 夜。下層の古い建物の屋上に、近所の人々が集まって空を見上げる。ずっと向こう、空にうかぶ上の都市の 白と金の塔の上で 花火があがり、光だけが ここまで とどく。
// ゲームにするために足した物：らんかん・物置・水そう・植木の当たり判定（らんかんの上には乗れる）、うしろの らんかん、となりの少し低い屋上と わたり板、
// となりの屋上の 木の見晴らし台（階段で のぼれる）、話せる人 10 人とねこ、しらべられる物 4 つ。花火を見上げる構図を保つため、カメラを少し上へ向ける。
TALE_WORLD('12-30', G => {
  const { THREE, K, R, T, TL, scene } = G, C = PACK_CITY(THREE, K, R), F = PACK_FTOWN(THREE, K, R), U = PACK_UNDER2(THREE, K, R), X = C.tex, { hash } = K, PI = Math.PI, HAZE = '#2a2444';
  G.cam.far = 1200; G.cam.updateProjectionMatrix();
  scene.add(R.skyDome([[0, '#080a20'], [.55, '#141634'], [.85, '#2a2850'], [1, '#4a3a5a']], { r: 1100 })); scene.fog = new THREE.Fog(HAZE, 40, 260);
  K.lights(scene, G.renderer, { sky: 0x8a8ad0, ground: 0x4a3a40, amb: 1.2, sun: 0xc0c8ff, power: .5, range: 20, pos: [12, 36, -16] });
  // 星
  { const p = []; for (let i = 0; i < 260; i++) { const a = hash(i, 1) * PI * 2, e = .25 + hash(i, 2) * 1.2; p.push(Math.cos(a) * Math.cos(e) * 900, Math.sin(e) * 900, Math.sin(a) * Math.cos(e) * 900); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#c8d0ff', size: 1.5, sizeAttenuation: false, fog: false }))); }

  // ---- 屋上（y = 0）：コンクリートと鉄板の床、ひくい らんかん（前のはしは z = -6.6）、物置、水そう、アンテナ ----
  const NY = -.9, NX0 = 10.4, NX1 = 19.6, BZ0 = -1.5, BZ1 = -.5;
  const lights = [{ x: -2, z: -1, r: 5, c: '#ffb060', k: .6 }, { x: 3, z: 1.5, r: 4.5, c: '#ffb060', k: .5 }];
  const land = R.ground({ w: 18, d: 14, cell: 1, cz: -.5, layers: [X.conc({ c: '#7a7a84' }), X.plate({ c: '#6a6a7a', n: 2, rust: .6 }), X.tile({ c: '#8a6a5a', c2: '#6a5a4a', check: true })], mix: (x, z) => [hash(Math.round(x / 3), Math.round(z / 3)) > .7 ? 1 : 0, x > 4 && z > 0 ? 1 : 0], shade: C.lightShade(lights, [.4, .4, .55]) });
  scene.add(land.mesh);
  // 地面の高さ：この屋上は 0、となりの屋上は NY。あいだの わたり板は ゆるい坂
  G.ground((x, z) => x < 9.4 ? 0 : x > NX0 ? NY : NY * (x - 9.4) / (NX0 - 9.4)); G.bounds(-8.7, NX1 - .3, -6.3, 6);
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  // らんかん（上に乗れる）。右の らんかんは、わたり板の所であける。うしろの らんかんは足した
  { const Gm = R.geo(), par = (w, d, x, z, y = 0) => { Gm.box(w, .9, d, x, y, z, { m: 2 }); G.box(x, z, w, d, y - 1, y + .9, 0); };
    par(18, .35, 0, -6.6); par(.35, 13.4, -9, -.5); par(18.35, .35, 0, 6.3); par(.35, BZ0 + 7.2, 9, (BZ0 - 7.2) / 2); par(.35, 6.4 - BZ1, 9, (BZ1 + 6.4) / 2);
    par(NX1 - NX0, .35, (NX0 + NX1) / 2, -6.6, NY); par(NX1 - NX0, .35, (NX0 + NX1) / 2, 6.3, NY); par(.35, 13.4, NX1, -.5, NY); par(.35, BZ0 + 7.2, NX0, (BZ0 - 7.2) / 2, NY); par(.35, 6.4 - BZ1, NX0, (BZ1 + 6.4) / 2, NY);
    fixed.push(Gm.mesh(X.conc({ c: '#8a8690' }))); }
  // 建物のすき間（わたり板のほかは 見えない かべ）
  G.box(9.8, (BZ0 - 7.2) / 2, 1.2, BZ0 + 7.2, -5, 3, 0, true); G.box(9.8, (BZ1 + 6.4) / 2, 1.2, 6.4 - BZ1, -5, 3, 0, true);
  { const Gm = R.geo(); Gm.box(18.4, .12, .5, 0, -9.5, -6.7, { m: 2 }); for (let y = -9; y < 0; y += 3) Gm.box(18.4, 2.6, .2, 0, y, -6.62, { m: 3 }); for (let y = -9; y < NY; y += 3) Gm.box(NX1 - NX0 + .4, Math.min(2.6, NY - y), .2, (NX0 + NX1) / 2, y, -6.62, { m: 3 }); fixed.push(Gm.mesh(X.tin({ c: '#6a5a5a', rust: .6 }))); }   // 建物の前のかべ（屋上の下）
  // 足した：となりの屋上（少し低い。床は鉄板とタイル）と、わたり板
  { const Gm = R.geo(); Gm.box(NX1 - NX0, .4, 13.4, (NX0 + NX1) / 2, NY - .4, -.5, { m: 3 }); fixed.push(Gm.mesh(X.plate({ c: '#5e5e70', n: 2, rust: .7 })));
    const Gp = R.geo(); Gp.box(.9, 12, 13.4, 9.8, -12.9, -.5, { m: 3 }); fixed.push(Gp.mesh(X.conc({ c: '#3a3848' })));
    const pl = R.geo(); pl.box(1.4, .08, 1.1, 0, 0, 0, { m: 1 }); const plank = pl.mesh(T.planks({ c: '#8a6a4a' })); plank.position.set(9.85, NY / 2 - .06, (BZ0 + BZ1) / 2); plank.rotation.z = Math.atan2(-NY, 1.1); fixed.push(plank); }
  put(C.tank({ r: 1.1, h: 2, kind: 'v', c: '#4f8f88', legs: true }), 6.6, 4.2, 0, 0, 'round', { r: 1.15 }); put(C.acbox({ fan: true }), 7.6, -3.6, -PI / 2, 0, 'box');
  put(C.shack({ w: 4, d: 3, floors: 1, seed: 5, lit: 1, shop: 'door', antenna: true }), -6, 4.4, 0); G.box(-6, 4.4, 4.2, 3.2, -1, 4, 0, true);
  // 植木：たる・ドラムかん・木箱に草花
  for (const [x, z, k, s] of [[-7.8, -5.4, 'flower', 1], [-6.6, -5.5, 'bush', 1.2], [7.8, -5.4, 'flower', .9], [4.8, -5.5, 'grass', 1], [-8, 1.5, 'bush', 1.3], [8, 1, 'flower', 1], [-3, 5.6, 'grass', 1], [1.6, 5.6, 'flower', 1.1]]) {
    const pot = (x + z) % 2 > 0 ? R.barrel({ h: .6, r: .32, c: '#7a5a40' }) : C.drum({ c: ['#b5603c', '#4f8f88', '#c8a04a'][Math.abs(Math.round(x)) % 3], mark: 'none', h: .5, r: .3 }); put(pot, x, z, 0, 0, 'round', { r: .34 }); put(R.tuft({ kind: k, s }), x, z, x, .55); }
  put(R.tree({ kind: 'bush', h: 2.2, c: '#4a7a4a', seed: 3 }), -7.8, -2.4, 0, 0, 'round', { r: .6 }); put(R.bench({ w: 1.6 }), -4.2, -4.6, 0, 0, 'box'); put(R.crate({ s: .5 }), 3.4, -4.9, .4, 0, 'box'); put(R.crate({ s: .4, kind: 'x' }), 3.9, -5, .9, .5, 'box');
  // 足した：となりの屋上の物（植木、はと小屋ふうの木箱の山、ベンチ）と、木の見晴らし台
  for (const [x, z, k] of [[18.8, -5.6, 'flower'], [12, -5.6, 'grass'], [18.8, 5.4, 'bush'], [14.5, 5.5, 'flower']]) { put(R.barrel({ h: .6, r: .32, c: '#7a5a40' }), x, z, 0, NY, 'round', { r: .34 }); put(R.tuft({ kind: k, s: 1 }), x, z, x, NY + .55); }
  [[13.2, -3.6, 0, .9], [14.1, -3.7, 0, .9], [13.6, -3.6, .9, .9]].forEach(([x, z, y, s], i) => put(R.crate({ s, kind: i % 2 ? 'x' : 'slash', c: '#8a7a5a' }), x, z, i * .2, NY + y, 'box'));
  put(R.bench({ w: 1.6 }), 17, -4.8, 0, NY, 'box');
  const DY = 1.8, DXc = 16.9, DZc = 2.6;
  { const Gd = R.geo(); Gd.box(3, .2, 3, DXc, DY - .2, DZc, { m: 2 }); for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) Gd.box(.2, DY - NY - .2, .2, DXc + sx * 1.35, NY, DZc + sz * 1.35, { m: 2 }); fixed.push(Gd.mesh(T.planks({ c: '#7a5a3e' })));
    G.box(DXc, DZc, 3, 3, DY - .3, DY, 0); for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) G.circle(DXc + sx * 1.35, DZc + sz * 1.35, .15, NY - .1, DY - .3);
    for (const [x, z, len, ry] of [[DXc, DZc - 1.45, 3, 0], [DXc, DZc + 1.45, 3, 0], [DXc + 1.45, DZc, 3, PI / 2]]) { put(R.fence({ len, h: 1, kind: 'rail' }), x, z, ry, DY); G.box(x, z, len, .1, DY, DY + 1.05, ry, true); }
    const run = 3.1, h = DY - NY, x0 = DXc - 1.5 - 1 - run, s = C.stairs({ h, run, w: .9, c: '#6a5a50', rail: 'both' }); s.position.set(x0, NY, DZc); fixed.push(s);
    const n = Math.ceil(h / .38); for (let i = 0; i < n; i++) G.box(x0 + (i + .5) * run / n, DZc, run / n + .02, .9, NY - .5, NY + h * (i + 1) / n, 0);
    G.box(x0 + run + .5, DZc, 1, .9, NY - .5, DY, 0); for (const sz of [-1, 1]) G.box(x0 + run / 2, DZc + sz * .47, run, .06, NY + .3, DY + 1, 0, true);
    fixed.push(C.lanterns([DXc - 1.4, DY + 3, DZc - 1.4], [DXc + 1.4, DY + 3, DZc + 1.4], { n: 4, sag: .3, kinds: ['red', 'yellow'] }));
    for (const [x, z] of [[DXc - 1.4, DZc - 1.4], [DXc + 1.4, DZc + 1.4]]) put(R.geo().box(.12, 3.1, .12, 0, 0, 0, { m: 2 }).mesh(T.planks({ c: '#6a4a3a' })), x, z, 0, DY, 'none'); }
  // まわりの屋根（下に見える下町）
  for (let i = 0; i < 40; i++) { const a = hash(i, 1) * PI * 2, d = 16 + hash(i, 2) * 70, x = Math.cos(a) * d, z = Math.sin(a) * d - 10; if (z > -8 && Math.abs(x) < 26) continue; put(C.shack({ w: 5 + hash(i, 3) * 3, d: 5, floors: 2 + Math.floor(hash(i, 4) * 3), seed: i, lit: .5, laundry: i % 2 === 0, antenna: i % 3 === 0, tank: i % 4 === 1 }), x, z, hash(i, 5) * PI, -14 + hash(i, 6) * 6); }
  scene.add(R.merge(fixed));
  scene.add(C.backdrop({ r: 240, h: 40, y: -30, haze: HAZE }));
  // せんたく物のひも（風でゆれる）と、ちょうちんの列
  const LAUN = X.laundry(), wash = [[-8.6, 2.3, -2.6, -3.4, -.6], [3.6, 2.4, -1.4, 8.6, -3.2], [11, 1.5, 4.8, 15, 5.6]].map(([x0, y, z0, x1, z1]) => { const g = new THREE.Group(), Gm = R.geo(), len = Math.hypot(x1 - x0, z1 - z0); Gm.quad([0, -.75, 0], [len, -.75, 0], [len, 0, 0], [0, 0, 0], [0, 0, len / 3, 1]); g.add(Gm.mesh(LAUN, { side: true })); g.position.set(x0, y, z0); g.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(g); return g; });
  scene.add(C.lanterns([-8.7, 2.7, -5.6], [-8.7, 2.9, 5], { n: 8, sag: .6, kinds: ['red', 'white'] }), C.lanterns([8.7, 2.7, -5.6], [8.7, 2.9, 5], { n: 8, sag: .6, kinds: ['yellow', 'red'] }));
  const lant = new THREE.PointLight('#ffb060', 9, 12, 1.4); lant.position.set(-1, 2.6, -3); scene.add(lant);
  const lant2 = new THREE.PointLight('#ffb060', 6, 9, 1.4); lant2.position.set(DXc, DY + 2, DZc); scene.add(lant2);

  // ---- 上の都市と花火（はるか向こう。台の上の白と金の塔。その上で花火が開く） ----
  const UP = [-30, -380]; { const up = U.upper({ r: 150, y: 50, th: 30, towers: 20, tall: .55, glow: true, tint: .66, haze: '#8a80b0', hazeK: .16, seed: 11, hang: 8, dotSize: 2 }); up.position.set(UP[0], -40, UP[1]); scene.add(up);
    const h = U.halo({ c: '#ffe8b8', r: 190, k: .12 }); h.position.set(UP[0], 120, UP[1] - 40); scene.add(h); }
  const fw = U.fireworks({ n: 6, center: [UP[0] + 20, 175, UP[1] + 60], spread: [340, 60, 60], per: 4.4, R0: 38, size: 4.4, cs: [['#ff7aa8', '#ffe0f0'], ['#7ae0ff', '#e0fbff'], ['#ffd060', '#fff4c0'], ['#ffffff', '#fff8e0'], ['#a8ff90', '#f0ffe0'], ['#ff9a50', '#fff0d0']] }); scene.add(fw);
  const flashL = new THREE.DirectionalLight('#ffd8e8', 0); flashL.position.set(0, 40, -100); scene.add(flashL);
  const pl = new THREE.PointLight('#ffffff', 0, 30, 1.2); pl.position.set(0, 10, -14); scene.add(pl);

  // ---- 屋上の人（TL.person）。花火を見上げる ----
  const folk = (o, x, z, ry, d, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const girl = folk({ size: 'normal', hair: 'center', head: { hair: '#3a2a20', skin: '#f0c8a0', eye: '#4a6a9a', mouth: 'smile', blush: true }, colors: { tunic: '#4f8f88', vest: '#3a3a4a', pants: '#3a3a4a', scarf: '#f0e4c8' } }, -2.4, -4.8, PI + .2,
    { name: '花火を待つ娘', lines: [['見て、また あがった！ 今のは もも色！', '……となりの人、ちゃんと 見てた？'], ['上の都市の 祭りの夜は、ここが いちばんの 特等席なの。', 'お金も いらないしね。']] });
  folk({ size: 'normal', hair: 'wolf', head: { hair: '#2a2228', skin: '#d8a878', eyes: 'small', mouth: 'smile', beard: 'stubble' }, colors: { tunic: '#c8a04a', vest: '#e8dcc0', pants: '#4a4a5a', scarf: '#7a5a3a' } }, -1.5, -4.9, PI - .1,
    { name: 'となりの男', lines: [['……べつに、あの子と 来たわけじゃ ない。', 'たまたま となりに 立っただけだ。'], '花火の音は、光から ずいぶん おくれて とどくんだ。遠いからな。'] });
  const dad = folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#b5603c', hair: 'wolf', bulk: 1.1, head: { hair: '#5a3a28', skin: '#c8906a', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#e8dcc0', pants: '#5a6a8a', scarf: '#b5603c' } }, -5.6, -4.4, PI + .3,
    { name: '肩車のお父さん', lines: [['よーし、高いだろう！', 'ちゃんと つかまってろよ。'], ['いつか この子を、上の都市の 祭りに つれていきたいんだ。', '……ま、今年も ここからだけどな。']] });
  const kid = TL.person({ size: 'child', hair: 'swept', head: { hair: '#5a3a28', eye: '#3a7a5a', mouth: 'open', blush: true }, colors: { tunic: '#d8402c', vest: '#f0e4c8', pants: '#3a3a4a', scarf: '#f0c040' } }); dad.o.userData.J.torso.add(kid); kid.position.set(0, .62, .02);
  folk({ size: 'normal', outfit: 'apron', hair: 'center', head: { hair: '#8a8a8a', skin: '#e8b890', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#8a5a7a', apron: '#e8d8c0' } }, 4.2, -4.6, PI - .2,
    { name: 'お団子のおばさん', lines: [['花火には、ふかし いもが 合うのよ。', 'ほら、あたたかいうちに。……あら、もう ないわ。'], '上の都市の人は、花火を 下から 見たことが ないんですって。かわいそうにね。'] });
  const jumper = folk({ size: 'child', hair: 'center', head: { hair: '#6a3a24', eye: '#8a4a6a', mouth: 'open', blush: true }, colors: { tunic: '#e8c040', vest: '#c8402e', pants: '#c8402e', scarf: '#4f8f88' } }, 4.8, -4.4, PI - .3,
    { name: 'はねる子', lines: [['ぴょん！ ぴょん！ とどくかな！', '……とどかない！'], ['ねえ、となりの屋上の 見晴らし台、のぼった？', '花火に いちばん 近いんだよ！']] });
  const gramps = folk({ size: 'small', outfit: 'robe', hair: 'center', head: { hair: '#e8e8e8', skin: '#d8a878', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'beard' }, colors: { tunic: '#6a5a4a', trim: '#d8ccb0' } }, 6, -3, PI - .5,
    { name: 'いすの じいさん', lines: [['わしは もう 立って 見るのは つらくてのう。', 'それでも 毎年、ここで 見とる。'], ['昔は、下の町でも 花火を あげたもんじゃ。', '小さくて、けむりばかりでな。……あれも よかった。']] }, .22);
  folk({ size: 'normal', hair: 'swept', head: { hair: '#2a2228', skin: '#f0c49c', eye: '#5a5a7a', mouth: 'smile' }, colors: { tunic: '#e8e0cc', vest: '#4f8f88', pants: '#3a4a5a', scarf: '#c8402e' } }, -.2, -3.2, PI,
    { name: 'せんたく物の 持ち主', lines: [['あ、そのシャツ わたしの。', '花火の夜に 干しっぱなしなのは ないしょね。'], '今夜は 建物じゅうの人が、みんな この屋上に いるのよ。'] });
  const boy = folk({ size: 'child', outfit: 'traveler', hair: 'wolf', head: { hair: '#2a2228', eye: '#3a7ac8', mouth: 'open', blush: true }, colors: { tunic: '#c8402e', vest: '#f0e4c8', pants: '#3a3a4a', scarf: '#f0c040' } }, 1.6, -6.45, PI,
    { name: 'らんかんの少年', lines: [['ここ、ぼくの 席だからね。', 'らんかんに すわると、足の下が すうすうするんだ。'], ['いつか 空の都市の 塔の上から、下を 見てみたい。', 'ここが どんな 光に 見えるのかな。']] }, .52);
  folk({ size: 'tall', outfit: 'worker', hat: 'kerchief', hatC: '#4f8f88', hair: 'center', head: { hair: '#3a2a22', skin: '#a8704a', eyes: 'small', mouth: 'line' }, colors: { linen: '#d8ccb0', pants: '#4f6a6a', scarf: '#c8a04a' } }, 13.6, -2.6, PI / 2 + .6,
    { name: 'はと飼いの おじさん', lines: [['しっ、はとが ねている。', '花火の夜は、ちょっと そわそわしてるがな。'], ['ここの はとは、上の都市まで 手紙を とどけるんだ。', '上の人は、返事を あまり くれないけどな。']] }, NY);
  folk({ size: 'normal', outfit: 'robe', hat: 'hood', hatC: '#3a3458', hair: 'swept', head: { hair: '#c8843a', skin: '#e8c0a0', eye: '#8a5aa8', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#4a3e7a', trim: '#e0c070' } }, DXc - .4, DZc - .6, PI + .4,
    { name: '見晴らし台の 旅の人', lines: [['ここが 花火に いちばん 近い場所。', '……と言っても、手は とどかないけれどね。'], ['昼間に 貨物エレベーターで、中つぎの 踊り場まで 行ってみた。', 'それでも 都市は まだ ずっと 上だった。']] }, DY);
  const cat = R.cat({ c: '#3a3a44', belly: '#e8e4dc' }); cat.position.set(-.6, .9, -6.55); cat.rotation.y = PI; scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃ。', '（花火が あがるたびに、耳だけ ぴくりと動く）', 'ごろごろ……。'], idle: t => R.catPose(cat, 'sit', t) });
  const stool = F.stool(); stool.position.set(6, 0, -2.8); scene.add(stool); G.solid(stool, 'none');

  // ---- しらべられる物 ----
  G.sign(-.2, 1, -6.3, { name: '空の都市', lines: [['ずっと向こうの空に、白い塔の都市が うかんでいる。', 'その上で 花火が開くたび、ここまで 光だけが とどく。']] });
  G.sign(6.6, 1, 3, { name: '水そう', lines: [['屋上の 水そう。たたくと、ぼわんと ひびく。', 'だれかが 小さく「はなび」と ほっている。']] });
  G.sign(-3.8, 1, 4.4, { name: '物置', lines: [['トタンの 物置。屋根の アンテナが 夜空に のびている。', 'すき間から、なべと ほうきが 見える。']] });
  G.sign(DXc + .8, DY + 1, DZc + 1, { name: '見晴らし台からの ながめ', lines: [['下町の屋根が、ちょうちんの光で 点々と ともっている。', '上の光と 下の光。どちらも きれいだ。']] });

  // ---- はじめの場所（人々の うしろ。塔と花火のほうを向く）と、自動で歩く道 ----
  G.spawn(1.2, 2.2, PI);
  G.tour([[1.2, -1.6], [-3, -2.6], [-5.2, -1], [-3.4, 1.6], [2, 1], [7, -1], [9.8, -1], [12, -1], [11, 2.6], [15, 2.6], [17, 2.6], [14.6, 2.6], [10.9, 2.6], [12, -1], [9.6, -1], [5, 2.4]]);

  // ---- 毎コマ：花火の光、すわる・はねる・肩車のポーズ、せんたく物 ----
  G.tick((t, dt, P) => {
    G.cam.rotateX(innerWidth < innerHeight ? .2 : .24);
    const flash = fw.userData.flash || 0; pl.intensity = flash * 30; flashL.intensity = flash * 1.6;
    { const J = boy.o.userData.J; if (!boy.talk) { J.head.rotation.x = -.45; } J.legL.rotation.x = J.legR.rotation.x = -1.5; J.shinL.rotation.x = 1.2 + Math.sin(t * 2.4) * .25; J.shinR.rotation.x = 1.2 + Math.sin(t * 2.4 + 1.6) * .25; if (flash > .4 && !boy.talk) J.armR.rotation.set(-2.6, 0, -.3); }
    { const J = gramps.o.userData.J; J.legL.rotation.x = J.legR.rotation.x = -1.4; J.shinL.rotation.x = J.shinR.rotation.x = 1.4; if (!gramps.talk) J.head.rotation.x = -.4; }
    { const J = dad.o.userData.J; if (!dad.talk) J.head.rotation.x = -.4; J.armL.rotation.set(-2.6, 0, .5); J.armR.rotation.set(-2.6, 0, -.5); J.foreL.rotation.x = J.foreR.rotation.x = -.6; }
    { const J = kid.userData.J; R.idle(kid, t, 0); J.legL.rotation.set(-1.4, 0, .5); J.legR.rotation.set(-1.4, 0, -.5); J.shinL.rotation.x = J.shinR.rotation.x = 1.2; J.armL.rotation.set(-2.8 - Math.sin(t * 5) * .2, 0, .3); J.armR.rotation.set(-2.8 + Math.sin(t * 5) * .2, 0, -.3); J.head.rotation.x = -.4; }
    { const J = jumper.o.userData.J, k = jumper.talk ? 0 : Math.abs(Math.sin(t * 3.2)); jumper.o.position.y = k * .25; if (!jumper.talk) { J.armL.rotation.set(-2.6, 0, .4); J.armR.rotation.set(-2.6, 0, -.4); J.shinL.rotation.x = J.shinR.rotation.x = (1 - k) * .6; } }
    { const J = girl.o.userData.J; if (!girl.talk) { J.head.rotation.x = -.4; const k = Math.max(0, Math.sin(t * .7)); J.armR.rotation.set(-1.6 - k * 1.2, 0, -.2); } }
    wash.forEach((g, i) => { g.children[0].rotation.x = Math.sin(t * 1.6 + i) * .18; });
    U.update(t); C.update(t, G.cam); if (F.tick) F.tick(t); });
});
