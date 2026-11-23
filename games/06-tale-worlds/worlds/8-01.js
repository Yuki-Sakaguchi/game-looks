// ワールド 8-01「城下町の大通り」。もとは game-looks-8/01-castle-town-avenue.html（見るだけの場面）。
// 石だたみの大通りの先に、青いとんがり屋根の城。両がわに木組みの家と店、噴水の広場。
// ゲームにするために足した物：家・城・小物の当たり判定、のぼれる木箱と見晴らし台への石段、話せる町の人 11 人とねこ、しらべられる看板。
// 町の人は第 13 集の人（TL.person）で、主人公と同じ 4.5 頭身の作り。服の色・かみ型・背たけで見分ける。
TALE_WORLD('8-01', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), { hash } = K;
  scene.add(R.skyDome([[0, '#2a64c8'], [.45, '#5a9ce4'], [.8, '#a8d4f2'], [1, '#e4f2f8']], { r: 400 })); scene.fog = new THREE.Fog('#cfe4f2', 60, 260);
  K.lights(scene, G.renderer, { sky: 0xc4d8ff, ground: 0xb8a890, amb: 1.55, sun: 0xfff0d0, power: 2.7, range: 30, pos: [33, 37, 34] });

  // ---- 地面：敷石の大通り＋れんがのふち＋まわりの草。城のほうへ ゆるく上がる ----
  const PZ = -30, CZ = -62, CY = 3, sstep = (a, b, v) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); }, H = (x, z) => CY * sstep(-40, -54, z);
  const town = (x, z) => Math.min(z > -26 && z < 26 ? Math.abs(x) - 5 : 99, Math.hypot(x, z - PZ) - 10.5, z < PZ && z > CZ - 4 ? Math.abs(x) - 3.6 : 99);
  const land = R.ground({ w: 130, d: 150, cell: 2, cz: -24, H, layers: [T.cobble({ kind: 'slab', c: '#b9ad98' }), T.brickFloor({ c: '#b87858' }), T.grass({ c: '#62a44e', flowers: .2 })],
    mix: (x, z) => { const t = town(x, z), r = Math.hypot(x, z - PZ); return [(t > -1.1 && t < 0) || Math.abs(r - 4.6) < .9 ? 1 : 0, Math.max(0, Math.min(1, .5 + t / 3))]; } });
  scene.add(land.mesh); G.ground(H); G.bounds(-26, 26, -68, 27);

  const fixed = [], smokes = [], put = (o, x, z, ry = 0, y = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  // ---- 家と店（もとの 5 通り）。当たり判定は かべの大きさの箱（ひさしや看板の下は歩ける） ----
  const win = T.window({ curtain: '#f0e4c8' }), winS = T.window({ shutters: 1, box: 1 }), winA = T.window({ h: 48, arch: 1, bars: 'grid' });
  const KIND = [
    { w: 7, d: 6, h2: 2.6, wall: T.stone({ c: '#a8a090' }), wall2: T.plaster({ frame: 'cross' }), roof: T.roof({ c: '#c8603a' }), chimney: true, sign: T.sign({ kind: 'mug' }), win },
    { w: 6, d: 5.6, h2: 2.5, wall: T.plaster({ frame: 'box', c: '#f0e2c4' }), wall2: T.plaster({ frame: 'diag', c: '#f0e2c4' }), roof: T.roof({ c: '#b8483a' }), ridge: 'z', awning: T.fabric({ scallop: 1 }), win: winS, sign: T.sign({ kind: 'bread' }) },
    { w: 5.4, d: 5.4, h: 3, h2: 2.7, jut: .3, wall: T.brick({ c: '#b87a58' }), wall2: T.plaster({ frame: 'cross', c: '#ecd8b8' }), roof: T.roof({ kind: 'slate', c: '#a8553a' }), win: winA, door: T.door({ arch: 1 }), sign: T.sign({ kind: 'sword' }) },
    { w: 6.6, d: 5.6, h2: 2.4, wall: T.stone({ c: '#b0a694' }), wall2: T.plaster({ frame: 'box' }), roof: T.roof({ c: '#d0703c' }), awning: T.fabric({ scallop: 1, c: '#3f72b0' }), win, chimney: { x: -1.8 }, door: T.door({ style: 'panel', c: '#4a7a6a' }) },
    { w: 5.8, d: 5.6, h2: 2.6, jut: .25, wall: T.plaster({ frame: 'beam', c: '#ead6b4' }), wall2: T.plaster({ frame: 'diag', c: '#ead6b4' }), roof: T.roof({ c: '#b8483a' }), ridge: 'z', win: winS, sign: T.sign({ kind: 'potion' }), door: T.door({ c: '#6e4a6a' }) }];
  const SHOP = ['よろずや「のみの市」', 'パン屋「こむぎ亭」', '武具屋「かなとこ」', '宿屋「青いとびら」', 'くすり屋「すずらん」'];
  const addHouse = (k, x, z, ry, i) => { const h = put(R.house({ ...KIND[k], seed: i }), x, z, ry, 0, 'none'); G.box(x, z, KIND[k].w + .3, KIND[k].d + .3, -1, 9, ry, true); if (KIND[k].chimney) { const c = KIND[k].chimney === true ? {} : KIND[k].chimney; h.updateMatrixWorld(); smokes.push(h.localToWorld(new THREE.Vector3(c.x ?? KIND[k].w * .24, h.userData.top + .9, -KIND[k].d * .18))); } return h; };
  [22, 14.6, 7.4, 0, -7.4, -14.8].forEach((z, i) => { const kl = [0, 2, 1, 4, 3, 2][i], kr = [3, 1, 4, 0, 2, 1][i]; addHouse(kl, -(5.5 + KIND[kl].d / 2), z, Math.PI / 2, i); addHouse(kr, 5.5 + KIND[kr].d / 2, z - .6, -Math.PI / 2, i + 10);
    if (i < 4) { G.sign(-5.3, 1.3, z, { name: '看板', lines: [SHOP[kl]] }); G.sign(5.3, 1.3, z - .6, { name: '看板', lines: [SHOP[kr]] }); } });
  [52, 90, 128, 232, 270, 308].forEach((deg, i) => { const k = [1, 3, 0, 4, 2, 0][i], a = deg * Math.PI / 180, r = 11 + KIND[k].d / 2; addHouse(k, Math.sin(a) * r, PZ + Math.cos(a) * r, a + Math.PI, 20 + i); });

  // ---- 城、時計塔、のぼり、三角の旗 ----
  const castle = F.castle({ s: 1.55, roof: F.tex.slate({ c: '#3f66b4' }), stone: F.tex.ashlar({ c: '#b8b2a4' }), c: '#c8453a', crest: 'sun' }); put(castle, 0, CZ, 0, CY, 'wall', { pad: .4 });
  G.sign(0, CY + 1.2, CZ + 6.2, { name: '城の門', lines: [['かたく とざされた門に、太陽の紋章が ほってある。', '「王のゆるしなき者、ここを通るべからず」']] });
  put(F.clockTower({ h: 13, roof: '#3f66b4', stone: F.tex.ashlar({ c: '#b8b2a4' }), flag: { c: '#c8453a', crest: 'crown' } }), -13.5, PZ + 9.5, .7, 0, 'wall');
  [[-4.4, 18, 0], [4.4, 10.5, 1], [-4.4, 3.6, 2], [4.4, -4, 0], [-4.4, -11, 1], [4.4, -18.6, 2]].forEach(([x, z, k]) => put(F.flag({ kind: 'banner', c: ['#c8453a', '#34507a', '#e0a83a'][k], crest: ['sun', 'star', 'crown'][k], cc: k === 2 ? '#7a3a2a' : undefined, c2: k === 2 ? '#7a3a2a' : undefined }), x, z, x < 0 ? .5 : Math.PI - .5, 0, 'trunk', { r: .12 }));
  for (const [z, y] of [[14, 6.2], [-3, 6.4], [-19, 6]]) fixed.push(F.bunting({ from: [-5.6, y, z], to: [5.6, y + .3, z - 1], n: 11 }));
  for (const sx of [-1, 1]) { put(F.flag({ kind: 'banner', c: '#c8453a', pole: 4.4 }), sx * 4.2, CZ + 9, 0, H(0, CZ + 9), 'trunk', { r: .12 }); put(R.tree({ h: 7, seed: sx }), sx * (sx < 0 ? 16 : 9), -44, 0, H(0, -44), 'trunk'); put(R.tree({ kind: 'tall', h: 8, c: '#3f8a52', seed: sx + 3 }), sx * 12, -52, 0, H(0, -52), 'trunk'); }

  // ---- 噴水・屋台・小物・木 ----
  const fountain = R.fountain({ r: 2.2 }); fountain.position.set(0, 0, PZ); scene.add(fountain); G.circle(0, PZ, 2.45, -1, .56); G.circle(0, PZ, .55, -1, 2.3);
  G.sign(0, .6, PZ + 2.6, { name: '噴水', lines: [['水の底に、銅貨が たくさんしずんでいる。', 'ねがいごとを して投げこむ ならわしらしい。']] });
  for (const [x, z] of [[-4.5, 11], [4.5, 0], [-4.5, -7.4], [4.5, -14.6], [-6.5, PZ - 6], [6.5, PZ + 6]]) put(R.lamp(), x, z, 0, 0, 'trunk', { r: .16 });
  put(R.stall({ c: '#e0a83a' }), -3.6, -3.4, Math.PI / 2); put(R.stall({ c: '#3f72b0', seed: 2, fc: ['#e8a84a', '#c07a30', '#f2d24a'] }), 6.8, PZ - 3.4, -1.9);
  put(R.stall({ c: '#c8453a', seed: 5, fc: ['#f7b8d0', '#ffffff', '#f2d24a'] }), 3.4, 18.5, -Math.PI / 2);   // 足した：花の屋台
  put(F.wagon({ load: 'barrels' }), 3.3, 15.6, .25); put(R.bench(), -6.6, PZ + 2, Math.PI / 2); put(R.bench(), 5.2, PZ + 6.8, -2.3);
  [[4.2, 7.5, 0], [-4.2, 14.2, 1], [4.3, -8.6, 2], [-4.3, -17.5, 0], [4.2, -21.5, 3], [-4.1, 6.6, 3], [4.2, 3, 1]].forEach(([x, z, k], i) => {
    if (k === 0) { put(R.barrel(), x, z, i, 0, 'round'); put(R.barrel({ h: .8, r: .32 }), x, z + .8, 1, 0, 'round'); }
    if (k === 1) { put(R.crate(), x, z, .3); put(R.crate({ s: .55, kind: 'x', c: '#8a9a6a' }), x, z + .1, .9, .8, 'none'); }
    if (k === 2) put(R.tree({ kind: 'bush', h: 1.1, flowers: .6, fc: ['#f7b8d0', '#ffffff'], seed: i }), x, z, 0, 0, 'round', { pad: .7 });
    if (k === 3) { put(R.crate({ s: .7 }), x, z, 1.1); put(R.tuft({ kind: 'flower', s: .8 }), x, z - .9, i, 0, 'none'); } });
  // 足した：木箱の山（ぴょんぴょん のぼれる）。いちばん上から 宿屋のひさしの上が見える
  [[-4.3, 1.2, 0, .9], [-4.3, 2.1, .9, .9], [-4.35, 2.1, 0, .9], [-4.4, 3.0, 1.8, .9], [-4.4, 3.0, .9, .9], [-4.4, 3.0, 0, .9]].forEach(([x, z, y, s], i) => put(R.crate({ s, kind: i % 2 ? 'x' : 'slash' }), x, z, i * .2, y));
  // 足した：城へのぼる坂の左に、石だんと見晴らし台（大通り・噴水・城を見わたせる）
  { const st = T.stone({ c: '#b8b2a4' }), x0 = -6.4, z0 = -47.5, base = H(0, z0) - .3, G2 = R.geo();
    [.55, 1.05, 1.55, 2.05, 2.55].forEach((h, k) => { G2.box(1, h, 1.6, -k, 0, 0, { m: 2 }); G.box(x0 - k, z0, 1, 1.6, -9, base + h, 0); });
    G2.box(3.4, 2.55, 4.2, -6.2, 0, 0, { m: 2 }); G.box(x0 - 6.2, z0, 3.4, 4.2, -9, base + 2.55, 0); const me = G2.mesh(st); me.position.set(x0, base, z0); fixed.push(me);
    put(R.fence({ len: 4, kind: 'iron' }), x0 - 7.8, z0, Math.PI / 2, base + 2.55, 'none'); G.box(x0 - 7.9, z0, .2, 4.2, base + 2.4, base + 3.6, 0);
    G.sign(x0 - 7.2, base + 2.55, z0 + 1.2, { name: '見晴らし台', lines: [['大通りの ずっと先まで見わたせる。', '城の屋根の青が、空の青と ならんでいる。']] }); }
  // 足した：花のはち
  for (const [x, z] of [[-5.1, 9.6], [5.1, 5.2], [-5.1, -4.2], [5.1, -11.5]]) { put(R.barrel({ h: .5, r: .34, c: '#9a6a44' }), x, z, 0, 0, 'round'); put(R.tree({ kind: 'bush', h: .7, flowers: .8, fc: ['#e8505a', '#f2d24a', '#ffffff'], seed: x * 3 + z }), x, z, 0, .45, 'none'); }
  for (let i = 0; i < 40; i++) { const x = (hash(i, 1) - .5) * 110, z = 24 - hash(i, 2) * 96; if (town(x, z) < 12 || (Math.abs(x) < 26 && z < -50)) continue; put(R.tree({ kind: ['round', 'round', 'tall', 'pine'][i % 4], h: 5 + hash(i, 3) * 4, c: i % 3 ? '#4f9a48' : '#3f8a52', seed: i }), x, z, i, H(x, z), 'trunk'); }
  for (const [x, z, h] of [[-8.5, PZ - 7.5, 6], [9, PZ - 7, 5.5], [-9.5, PZ + 4.8, 5]]) put(R.tree({ h, seed: x }), x, z, x, 0, 'trunk');
  // 足した：町の南の門と城壁（ここが町のはし。門は とじている）
  { const st = F.tex.ashlar({ c: '#b8b2a4' }); put(F.gate({ w: 7, h: 7, d: 2.4, stone: st, door: 'wood', open: 0, crest: 'sun' }), 0, 27.5, Math.PI);
    for (const sx of [-1, 1]) put(F.wall({ len: 21, h: 5, stone: st }), sx * 14, 27.5, 0);
    G.sign(0, 1.4, 26.1, { name: '南の門', lines: [['大きな木のとびらは、かたく とじている。', '「夜明けから 日ぐれまで ひらく」と書いてある。……今は とじている？']] }); }
  scene.add(R.merge(fixed));
  scene.add(R.backdrop({ c: '#5a8a9a', haze: '#d4e8f2', r: 300, y: -6 }));
  for (let i = 0; i < 9; i++) { const c = R.cloud({ s: 40 + hash(i, 8) * 30, c: '#ffffff', shade: '#b8d0ec', seed: i }), a = i * .7 + .3; c.position.set(Math.cos(a) * 250, 50 + hash(i, 9) * 50, Math.sin(a) * 250 - 30); c.lookAt(0, 30, -20); scene.add(c); }

  // ---- 町の人（TL.person。主人公と同じ 4.5 頭身の作り）。服の色・かみ型・背たけで見分ける ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d) => { const p = TL.person(o); p.position.set(x, H(x, z), z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'tall', hair: 'wolf', head: { hair: '#3a2e2a', skin: '#e0b088', eye: '#5a5a7a', brow: 'angry', mouth: 'line' }, colors: C('#4a5a8a', '#7a8494', '#3a3e52', '#c8a040', { glove: '#6a7080', boot: '#4a4a54' }) }, 0, 0, 0,
    { name: '見回りの衛兵', path: loop([[-2, 20], [-2, -18], [2, -18], [2, 20]]), speed: 1.2, lines: [['今日も 大通りは へいわだ。', 'あやしい者を見たら、すぐ 知らせてくれ。'], '噴水の広場は、夕方になると 人でいっぱいになる。', ['城の門は、王のおふれが出るまで あかないぞ。']] });
  for (const sx of [-1, 1]) folk({ size: 'tall', hair: 'center', head: { hair: sx < 0 ? '#4a3a2a' : '#7a5a3a', skin: sx < 0 ? '#f0c49c' : '#d8a070', eyes: 'big', brow: 'angry', mouth: 'line' }, colors: C('#4a5a8a', '#8a94a8', '#3a3e52', '#c8453a', { glove: '#6a7080', boot: '#4a4a54' }) }, sx * 3.4, CZ + 6.6, 0,
    { name: '門番', lines: sx < 0 ? [['ここから先は 城だ。', '用のない者は 通せない。']] : ['……となりの門番は まじめすぎて、つかれるよ。', ['城の中には 大きな図書室が あるらしい。', 'おれも 入ったことはないがね。']] });
  folk({ size: 'normal', hair: 'center', head: { hair: '#9a9088', skin: '#e8b890', eyes: 'small', mouth: 'smile', beard: 'mustache' }, colors: C('#8a5a3a', '#5a4a3a', '#5a5a48', '#e0a83a') }, -4.9, -3.4, Math.PI / 2,
    { name: '果物売りのおじさん', r: .3, lines: [['いらっしゃい！ 今朝もぎたての りんごだよ。', '旅の人には、ひとつ おまけだ。'], 'うちの りんごは、城の料理番も 買いに来るんだ。'] });
  folk({ size: 'normal', hair: 'swept', head: { hair: '#c8843a', eye: '#4a6a9a', mouth: 'smile', blush: true }, colors: C('#c2586a', '#7a4a5a', '#6a5a7a', '#f0e4c0', { linen: '#f4ecdc' }) }, 0, 0, 0,
    { name: '買い物の人', path: loop([[1.4, 12], [1.4, -16], [3.2, -24], [-3.2, -24], [-1.4, -16], [-1.4, 12]]), speed: .9, u: .5, lines: [['パン屋の 木の実パンが 売りきれちゃって……', 'あしたは もっと早く来なきゃ。'], '花の屋台の おねえさんとは、小さいころからの ともだちなの。'] });
  folk({ size: 'child', hair: 'wolf', head: { hair: '#2a2a34', eye: '#3a7a5a', mouth: 'open' }, colors: C('#e0a83a', '#3a4a7a', '#3a4a7a', '#c8453a') }, 0, 0, 0,
    { name: '町の子', path: loop([[4.1, PZ], [0, PZ + 4.1], [-4.1, PZ], [0, PZ - 4.1]]), speed: 3, lines: [['つかまえてごらんよ！', '……あれ、おにごっこじゃ ないの？'], ['見晴らし台の上、のぼったことある？', '城へのぼる坂の 左の石だんから 行けるんだよ！'], '木箱の山の てっぺんは、ひみつの 見はり場なんだ。'] });
  folk({ size: 'small', hair: 'center', head: { hair: '#e8e8e8', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: C('#6a5a9a', '#4a3e6a', '#4a4058', '#e8d8a0') }, -6.1, PZ + 2, Math.PI / 2 + .3,
    { name: '長老', lines: [['ふぉふぉ、旅のお方かな。', 'この噴水は、町ができたときから ずっと わいておる。'], ['むかし この町には、空を飛ぶ船が 毎日のように来ておった。', '今は 発着場も しずかになったのう。'], 'わしの若いころは、あの時計塔の上まで 走ってのぼったものじゃ。'] });
  folk({ size: 'normal', hair: 'swept', head: { hair: '#d8b060', eye: '#3a7ac8', eyes: 'small', mouth: 'open' }, colors: C('#3a8a6a', '#a8553a', '#5a4a3c', '#e0c040') }, 2.6, PZ + 4.8, Math.PI * .8,
    { name: '吟遊詩人', lines: [['♪ 青い屋根の 城の上 ／ 風がはこぶ 鐘の音 ♪', '……どうだい、新しい歌なんだ。'], ['遠くの国には、空を泳ぐ くじらの上に 町があるそうだ。', 'いつか 歌にしたいね。']] });
  folk({ size: 'normal', hair: 'center', head: { hair: '#5a2a2a', eye: '#8a4a6a', mouth: 'smile', blush: true }, colors: C('#e8c8d8', '#c8453a', '#7a5a6a', '#f2d24a', { linen: '#fff4f0' }) }, 4.4, 18.5, -Math.PI / 2,
    { name: '花の屋台の人', lines: [['いらっしゃいませ。', '今日は 赤いバラと、白いすずらんが きれいよ。'], '城の庭師さんが、たまに 苗を わけてくれるの。'] });
  folk({ size: 'tall', hair: 'wolf', head: { hair: '#6a4a2a', skin: '#c8885a', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: C('#7a6a4a', '#5a4030', '#4a4a3a', '#3f72b0') }, 1.6, 14.6, .6,
    { name: '荷車の商人', lines: [['たるの中は、南の村の ぶどう酒だ。', '宿屋に とどけるところさ。'], ['飛空艇の発着場まで 行くなら、北の門を出て 丘をこえるんだ。', '……今は ワールドの地図から 行けるんだっけ？']] });
  folk({ size: 'small', hair: 'swept', head: { hair: '#3a2a22', eye: '#6a4a2a', mouth: 'smile', blush: true }, colors: C('#f0c84a', '#c8553a', '#6a5a4a', '#3f72b0') }, -2.2, -2.6, -1.2,
    { name: 'おつかいの子', lines: [['りんごを 三つと、パンを ひとつ。', '……あと、なんだっけ？'], 'あ、ミルクだ！ ありがとう！'] });
  // ねこ（話しかけると ないて、すわりなおす）
  const cat = R.cat({ c: '#e8e4dc', plain: 1 }); cat.position.set(4.2, .8, 7.5); cat.rotation.y = -1.9; scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃあ。', '……ごろごろ。', 'にゃ？'], idle: t => R.catPose(cat, 'sit', t) });
  const birds = [[-1.6, PZ + 4.6], [.4, PZ + 5.2], [1.8, PZ + 4.2], [-3.2, -12], [-2.4, -12.8], [2.6, 1.5]].map(([x, z], i) => { const b = R.bird(i % 3 === 2 ? { c: '#e8e4dc', neck: false } : {}); b.position.set(x, 0, z); b.rotation.y = i * 2.1; b.userData.home = [x, z, i * 2.1]; b.userData.fly = -1; scene.add(b); return b; });

  // ---- 毎コマ：旗・時計・噴水・けむり、鳥は主人公が近づくと飛ぶ ----
  const fx = K.fx(scene, 60); let sm = 0, sp = 0;
  G.spawn(0, 24, Math.PI); G.tour([[-1, 14], [-1.6, -16], [-5.4, -26], [-4, -34.5], [0, -36.2], [4.5, -33], [5.6, -26], [1.8, -16], [1.6, 12], [0, 22]]);
  G.tick((t, dt, P) => {
    for (const b of birds) { const [hx, hz, hr] = b.userData.home, dh = Math.hypot(P.x - hx, P.z - hz);
      if (b.userData.fly < 0) { R.birdPose(b, 'peck', t + hr * 3); if (dh < 2.6) b.userData.fly = 0; }
      else { const f = (b.userData.fly += dt); b.visible = f < 5; b.position.set(hx + Math.cos(hr) * f * 3.2, Math.min(8, f * 2.8 - f * f * .12), hz + Math.sin(hr) * f * 3.2); b.rotation.y = Math.atan2(Math.cos(hr), Math.sin(hr)); R.birdPose(b, 'fly', t + hr); if (f > 5 && dh > 14) { b.userData.fly = -1; b.visible = true; b.position.set(hx, 0, hz); b.rotation.y = hr; } } }
    F.tick(t); fountain.userData.tick(t); if ((sp += dt) > .09) { sp = 0; const a = Math.random() * 6.283; fx.emit('splash', Math.cos(a) * .9, .5, PZ + Math.sin(a) * .9, { size: .5, life: .5, vy: .5, grow: .6 }); }
    if ((sm += dt) > .6) { sm = 0; for (const s of smokes) if (Math.hypot(s.x - P.x, s.z - P.z) < 50) fx.emit('smoke', s.x, s.y, s.z, { size: .5, life: 3.2, vy: .8, vx: .3, grow: 1.5, spread: .12, tint: '#f0f0f0' }); }
    fx.update(dt); });
});
