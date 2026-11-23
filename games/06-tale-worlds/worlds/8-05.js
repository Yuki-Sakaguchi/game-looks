// ワールド 8-05「樹上の町」。もとは game-looks-8/05-treetop-village.html（見るだけの場面）。
// 大きな木の上の床に わらぶきの丸い小屋がのり、つり橋でつながる。葉のあいだから光がさし、ずっと下に森の木のてっぺんが見える。
// ゲームにするために足した物：床・つり橋の足場と手すり（見た目の床にそろえた）、下の森へおりて また のぼれる らせん階段、話せる住人 8 人、しらべられる物 3 つ。
// 床から落ちても、下の森を歩いて らせん階段から もどれる。
TALE_WORLD('8-05', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), { hash } = K;
  scene.add(R.skyDome([[0, '#6aa4c8'], [.45, '#a8d4c8'], [.8, '#d8ecc0'], [1, '#f0f4c8']], { r: 320 })); scene.fog = new THREE.Fog('#b4d8a8', 26, 150);
  K.lights(scene, G.renderer, { sky: 0xd8f0c8, ground: 0x6a8a58, amb: 1.6, sun: 0xfff4c8, power: 2.6, range: 30, pos: [24, 48, 27] });

  // ---- 下の森：暗めの草の地面（歩ける） ----
  const land = R.ground({ w: 220, d: 220, cell: 4, layers: [T.grass({ c: '#3f7a4a', flowers: .1 }), T.dirt({ c: '#6a6a4a' })], mix: (x, z) => [Math.sin(x * .11) * Math.cos(z * .13) > .5 ? 1 : 0, 0], shade: () => .82 }); scene.add(land.mesh);
  G.ground(() => 0); G.bounds(-24, 32, -22, 34);
  const fixed = [], put = (o, x, y, z, ry = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };

  // ---- 木の上の小屋 5 つ。床の手すりの切れ目（正面と、その右となり）へ つり橋をかける ----
  const Q = Math.SQRT1_2, HS = [   // [x, z, 床の高さ, 床の半径, 向き]
    [0, 16, 9, 3, Math.PI], [0, 0, 11, 3.2, 0], [9.2, 9.2, 10, 3, Math.PI], [9.2, -3.8, 12.5, 2.5, 0], [-9.2, 6.8, 7.5, 2.5, Math.PI / 4]];
  const ROOFS = ['#c8a658', '#b89448', '#c8a658', '#a88a4a', '#b89448'];
  HS.forEach(([x, z, h, r, ry], i) => { const tr = 1.25 + (i === 1 ? .25 : 0); put(F.treeHouse({ h, r, trunk: tr, roof: T.thatch({ c: ROOFS[i] }), lit: i !== 2, seed: i, leaf: i % 2 ? '#4f9a48' : '#5aa850' }), x, 0, z, ry, 'none');
    G.circle(x, z, r * .97, h - .3, h); G.circle(x, z, r * .6, h - .2, h + 4.5); G.circle(x, z, tr * 1.3, -1, h - .4);   // 床・小屋のかべ・幹
    // 床の手すり：八角形の 8 辺のうち、正面と その右となり（つり橋・階段の口）を あけて、のこりを かべにする
    for (let k = 2; k < 8; k++) { const a = ry + k * Math.PI / 4, d = r * .93; G.box(x + Math.sin(a) * d, z + Math.cos(a) * d, r * .78, .2, h + .05, h + 1.2, a - Math.PI / 2, true); } });
  const edge = (i, dx, dz, k = .924) => [HS[i][0] + dx * HS[i][3] * k, HS[i][2], HS[i][1] + dz * HS[i][3] * k];
  const BR = [[0, [0, -1], 1, [0, 1]], [1, [Q, Q], 2, [-Q, -Q]], [2, [0, -1], 3, [0, 1]], [0, [-Q, -Q], 4, [Q, Q]]].map(([a, da, b, db]) => { const g = F.ropeBridge({ from: edge(a, ...da), to: edge(b, ...db), w: 1.3, sag: .45 }); fixed.push(g); return g; });
  // つり橋の足場（板の高さにそろえた うすい箱を 14 枚）と、両がわの綱の手すり
  for (const b of BR) { const N = 14; for (let i = 0; i < N; i++) { const p = b.userData.at(i / N), q = b.userData.at((i + 1) / N), mx = (p[0] + q[0]) / 2, mz = (p[2] + q[2]) / 2, my = Math.max(p[1], q[1]), L = Math.hypot(q[0] - p[0], q[2] - p[2]), ry = Math.atan2(q[0] - p[0], q[2] - p[2]);
    G.box(mx, mz, 1.3, L + .12, my - .3, my, ry); for (const s of [-1, 1]) G.box(mx + Math.cos(ry) * s * .72, mz - Math.sin(ry) * s * .72, .14, L + .12, my + .05, my + 1.1, ry, true); } }
  put(F.ladder({ h: 12.6, kind: 'rope', w: .7 }), 9.2 + 2.45, 0, -3.8, Math.PI / 2, 'none'); put(F.ladder({ h: 2.1, w: .6 }), 1.9, 11, -.2, Math.PI / 2, 'none');
  const lamps = []; HS.forEach(([x, z, h, r, ry], i) => { for (const a of [-.75, .75, Math.PI]) { const l = F.hangLamp({ drop: .35, light: (i === 1 && a < 0) || (i === 0 && a > 0 && a < 1) || (i === 2 && a < 0), power: 9, range: 7 }), q = r * .6 * 1.3; l.position.set(x + Math.sin(ry + a) * q, h + 2.35, z + Math.cos(ry + a) * q); scene.add(l); lamps.push(l); } });
  [[0, 1.2, 0], [1, -1.6, 1], [2, 2.3, 2], [1, 2.6, 0], [3, 2.2, 1], [4, -1.4, 2]].forEach(([i, a, k]) => { const [x, z, h, r, ry] = HS[i], px = x + Math.sin(ry + a) * r * .8, pz = z + Math.cos(ry + a) * r * .8;
    if (k === 0) put(R.barrel({ h: .8, r: .3 }), px, h, pz, 0, 'round');
    if (k === 1) { put(R.crate({ s: .6 }), px, h, pz, .4); put(R.crate({ s: .4, kind: 'x', c: '#8a9a6a' }), px, h + .6, pz, .9); }
    if (k === 2) put(R.tree({ kind: 'bush', h: .8, flowers: .6, fc: ['#f6dc5a', '#ffffff'], seed: i }), px, h, pz, 0, 'round', { pad: .6 }); });
  // 足した：小屋 0 の床に 小さな たる 2 つ
  { const [x, z, h, r, ry] = HS[0]; for (const a of [-1.2, -1.9]) put(R.barrel({ h: .6, r: .26, c: '#8a6a44' }), x + Math.sin(ry + a) * r * .8, h, z + Math.cos(ry + a) * r * .8, a, 'round'); }

  // ---- 足した：らせん階段。小屋 4 の幹のまわりを 下の森から 床まで ひとまわり半（板を 20 枚、1 段 0.375 m） ----
  { const [x, z, h] = HS[4], N = 20, pl = T.planks({ c: '#8a6440', w: 8 });
    for (let i = 1; i <= N; i++) { const a = Math.PI / 2 + (N - i) * .3, y = h * i / N, g2 = R.geo(); g2.box(2.6, .14, .9, 0, -.14, 0, { m: 1.5 }); const me = g2.mesh(pl), rc = 2.45; me.position.set(x + Math.sin(a) * rc, y, z + Math.cos(a) * rc); me.rotation.y = a - Math.PI / 2; fixed.push(me);
      G.box(x + Math.sin(a) * 2.85, z + Math.cos(a) * 2.85, 1.7, 1, y - .2, y, a - Math.PI / 2); } }
  // ---- まわりの大きな木（幹だけ下から上までのび、上に葉のかたまり）と、下の森 ----
  const bark = T.bark(), BIG = [], LINKS = [[0, 1], [1, 2], [2, 3], [0, 4]], segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], k = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * k, z - a[1] - dz * k); };
  for (let i = 0; i < 22; i++) { const a = i * 2.4 + .3, r = 17 + hash(i, 1) * 34, x = 4 + Math.cos(a) * r, z = 6 + Math.sin(a) * r, tr = 1.3 + hash(i, 2) * 1.3, h = 22 + hash(i, 3) * 10; if (HS.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 8) || LINKS.some(([a, b]) => segD(x, z, HS[a], HS[b]) < 7.5)) continue; BIG.push([x, z]);
    put(R.geo().loft(7, [[0, tr * 1.6, tr * 1.6, 0, .6], [1.6, tr * 1.05, tr * 1.05, .6, .8], [h, tr * .7, tr * .7, h / 2.6, 1]], { ur: 3 }).mesh(bark), x, 0, z, i, 'trunk', { r: tr * 1.3 }); const lf = R.tree({ h: 7, c: ['#4f9a48', '#3f8a4c', '#5aa850'][i % 3], seed: i }); lf.scale.setScalar(2.2 + hash(i, 4) * .8); put(lf, x, h - 7, z, i, 'none'); }
  for (let i = 0; i < 190; i++) { const x = (hash(i, 11) - .5) * 120 + 4, z = (hash(i, 12) - .5) * 120 + 6; if (HS.some(([hx, hz], k) => Math.hypot(x - hx, z - hz) < (k === 4 ? 4.6 : 2.6)) || BIG.some(([bx, bz]) => Math.hypot(x - bx, z - bz) < 3)) continue; put(R.tree({ kind: ['round', 'round', 'pine', 'tall'][i % 4], h: 4.5 + hash(i, 13) * 3.5, c: ['#3f8a5a', '#2f7a58', '#4a9460'][i % 3], seed: i }), x, 0, z, i, 'trunk'); }
  for (let i = 0; i < 40; i++) { const x = (hash(i, 21) - .5) * 60 + 4, z = (hash(i, 22) - .5) * 60 + 6; put(R.tuft({ kind: ['bush', 'flower', 'grass'][i % 3], s: 1 + hash(i, 23), seed: i % 3 }), x, 0, z, i, 'none'); }
  // 足した：階段の下の 切り株と きのこ
  put(R.rock({ s: .9, seed: 3 }), -5.4, 0, 4.2, 0, 'round', { pad: .7 }); for (let i = 0; i < 6; i++) put(R.tuft({ kind: 'flower', s: .7, seed: i % 3 }), -5.8 + hash(i, 41) * 2.4, 0, 2.8 + hash(i, 42) * 2.4, i, 'none');
  scene.add(R.merge(fixed));
  scene.add(R.backdrop({ c: '#3f7a5a', haze: '#c8e4b0', r: 150, h: 60, y: -4, rep: 3 }));

  // ---- 光のつぶ（葉のあいだの光の中をただよう。ドット絵の板をカメラへ向ける） ----
  const moteT = (() => { const P = R.Px(8); P.disc(3.5, 3.5, 3, '#fff4a8'); P.disc(3.5, 3.5, 1.6, '#ffffff'); return T.from(P, { m: 1, cut: true }); })(), moteM = R.mat(moteT, { glow: true, cut: true, fog: false });
  const motes = [...Array(26)].map((_, i) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(.14, .14), moteM); o.userData.p = [(hash(i, 31) - .5) * 30 + 4, 8 + hash(i, 32) * 8, (hash(i, 33) - .5) * 30 + 7, i * 1.3]; scene.add(o); return o; });

  // ---- しらべる物 ----
  G.sign(9.2 + Q * 2.3, 12.6, -3.8 + Q * 2.3, { name: 'いちばん高い床', lines: [['森の木のてっぺんが、\n緑の海のように つづいている。', '遠くの空に、白い鳥のむれが 見える。']] });
  G.sign(-5.4, .6, 4.2, { name: '苔むした切り株', lines: [['大きな切り株に、\n年輪が 数えきれないほど ある。', 'まわりに 小さな白い花が さいている。']] });
  G.sign(1.9, 11.8, -.2, { name: 'みじかい はしご', lines: [['屋根のふちへ のびる はしご。', '屋根の 草を ふきかえる\nときに 使うらしい。']] });

  // ---- 住人（TL.person。主人公と同じ 4.5 頭身の作り）。森の色の服 ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const on = (i, a, turn = 0) => { const [x, z, h, r, ry] = HS[i]; return [x + Math.sin(ry + a) * r * .8, z + Math.cos(ry + a) * r * .8, ry + a + turn, h]; };
  const folk = (o, [x, z, ry, y], d) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  folk({ size: 'small', outfit: 'robe', hold: 'staff', hair: 'center', head: { hair: '#e8e8e0', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#5a7a5a', trim: '#e8d8a0' } }, on(1, -1.5),
    { name: '木の長老', lines: [['よう来なすった。ここは 木の上の町じゃ。', 'わしらは 木を切らず、\n木に すまわせてもらっておる。'], ['この大木は、わしの ひいじいさんの\nころから ここにある。'], '夜になると ランタンが ともって、\n森が 星空のようになるぞ。'] });
  folk({ size: 'child', hair: 'wolf', head: { hair: '#c8743a', eye: '#4a8a4a', mouth: 'open', blush: true }, colors: C('#e8c860', '#7a5a3a', '#5a7a4a', '#f4f0e8') }, on(0, 1.7, .6),
    { name: '木の上の子', lines: [['下の森に おりたこと ある？', '小屋 4 の 幹のまわりに、\nらせん階段が あるんだよ。'], 'つり橋は、\nゆらゆらするのが たのしいんだ！'] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#c85a8a', hair: 'center', head: { hair: '#8a5a34', mouth: 'smile', blush: true }, colors: { tunic: '#7ab068', apron: '#f4ecd0' } }, on(3, -1.4, Math.PI),
    { name: '薬草ほしの人', lines: [['いちばん高い この床は、\n日あたりが いいの。', '薬草が よく かわくのよ。'], ['城下町の くすり屋さんに、\n毎月 とどけているの。', '「すずらん」って お店よ。']] });
  folk({ size: 'normal', hair: 'swept', head: { hair: '#e8dcb0', eye: '#4a8a4a', eyes: 'small', mouth: 'smile' }, colors: C('#d8a43a', '#3f7a4a', '#6a4a34', '#3f7a4a', { glove: '#7a5a3a' }) }, on(2, 2.6, Math.PI),
    { name: '弓の見はり番', lines: [['この床から、\n森の入口を 見はっているんだ。', 'いまのところ、\nこわい けものは 来ていない。'], ['夜の草原には、\n星を見る塔が 立っているそうだ。', '星が 落ちてくる 夜も あるらしい。']] });
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#6a4a2a', hair: 'wolf', bulk: 1.1, head: { hair: '#4a6a3a', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#e8dcc0', pants: '#5a6a4a', scarf: '#8a6a44' } }, on(4, -.6, 0),
    { name: '大工の親方', lines: [['この らせん階段は、おれが 作ったんだ。', '一段ずつ、幹に 板を さしこんである。'], 'つり橋の 綱は、\n毎年 春に 取りかえるんだぞ。'] });
  folk({ size: 'small', hat: 'hood', hatC: '#6a8a4a', hair: 'center', head: { hair: '#5a3a22', eye: '#6a4a2a', mouth: 'smile' }, colors: C('#8a6a44', '#5a7a4a', '#5a4a3a', '#c8a040') }, [-4.4, 1.6, -.6, 0],
    { name: 'きのこ採り', lines: [['下の森は うす暗いけど、\nきのこが たくさん とれるの。', '赤い かさのは、食べちゃ だめよ。'], '上に もどるときは、\nあの らせん階段を のぼってね。'] });
  // つり橋を行き来する 2 人（G.tick で動かす。話しかけると止まる）
  const walkers = [[BR[2], .09, 0], [BR[3], .075, .4]].map(([b, sp, ph], i) => ({ b, sp, ph, n: folk(i === 0
    ? { size: 'normal', outfit: 'apron', hair: 'center', head: { hair: '#8a5a34', mouth: 'smile' }, colors: { tunic: '#c87a4a', apron: '#f4ecd0' } }
    : { size: 'tall', outfit: 'worker', hat: 'kerchief', hatC: '#5a6a4a', hair: 'wolf', head: { hair: '#4a6a3a', skin: '#d8a070', mouth: 'line' }, colors: { linen: '#c8b888', pants: '#5a6a4a' } }, [...b.userData.at(.5).filter((_, k) => k !== 1), 0, b.userData.at(.5)[1]],
    i === 0 ? { name: '木の実売り', lines: [['くるみと くりは いかが？', 'つり橋を わたって、\n毎日 売り歩いて いるの。'], '橋の まん中で 下を 見ちゃ だめよ。\n足が すくむから。'] }
      : { name: '水くみの男', lines: [['下の 泉から、水を はこんで いるんだ。', 'のぼり下りは 足に こたえるよ。'], ['雲の上の 発着場から 来た 船乗りが、\nここの 水は うまいって さ。']] }) }));
  const birds = [0, 1, 2, 3, 4].map(i => { const b = R.bird({ c: ['#e8a83a', '#4a8ac8', '#f4f0e8'][i % 3], belly: '#fff4d8', neck: false, s: 1.3 }); scene.add(b); return b; });
  const perch = [[1, 2.2], [2, -2.4], [0, -2]].map(([i, a], k) => { const b = R.bird({ c: k % 2 ? '#c8503c' : '#4a8ac8', belly: '#fff4d8', neck: false, s: 1.2 }), [x, z, h, r, ry] = HS[i]; b.position.set(x + Math.sin(ry + a) * r * .97, h + .95, z + Math.cos(ry + a) * r * .97); b.rotation.y = ry + a + Math.PI; scene.add(b); return b; });

  // ---- はじめの場所と、自動で歩く道（小屋 0 → つり橋 → 小屋 1 → つり橋 → 小屋 2 → もどる） ----
  const ring = (i, a) => { const [x, z, h, r, ry] = HS[i]; return [x + Math.sin(ry + a) * r * .8, z + Math.cos(ry + a) * r * .8]; };
  G.spawn(0, 13.8, Math.PI);
  G.tour([[0, 13.6], [0, 8], [0, 2.4], ring(1, Math.PI / 4), [4.6, 4.6], ring(2, Math.PI / 4), ring(2, Math.PI / 2), ring(2, Math.PI * .75), ring(2, Math.PI / 2), ring(2, Math.PI / 4), [4.6, 4.6], ring(1, Math.PI / 4), [0, 2.4], [0, 8], [0, 13.6]]);
  G.tick((t, dt, P) => {
    for (const w of walkers) { if (w.n.talk) continue; const f = (t * w.sp + w.ph) % 1, go = f < .5, k = .06 + (go ? f * 2 : 2 - f * 2) * .88, a = w.b.userData.at(k), c = w.b.userData.at(k + (go ? .02 : -.02)); w.n.o.position.set(a[0], a[1], a[2]); w.n.o.rotation.y = Math.atan2(c[0] - a[0], c[2] - a[2]); R.walk(w.n.o, t * 5.2 + w.ph * 9, .8); }
    birds.forEach((b, i) => { const a = t * (.34 + i * .05) + i * 1.5, r = 7 + i * 2.5; b.position.set(4 + Math.cos(a) * r, 13 + i * 1.2 + Math.sin(t * .8 + i) * 1.4, 7 + Math.sin(a) * r); b.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); R.birdPose(b, 'fly', t * .5 + i); }); perch.forEach((b, i) => R.birdPose(b, i ? 'peck' : 'stand', t + i * 2));
    motes.forEach(o => { const [x, y, z, ph] = o.userData.p; o.position.set(x + Math.sin(t * .3 + ph) * 1.2, y + Math.sin(t * .5 + ph * 2) * .8, z + Math.cos(t * .27 + ph) * 1.2); o.quaternion.copy(G.cam.quaternion); });
    lamps.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.4 + i) * .08; });
    F.tick(t); });
});
