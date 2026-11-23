// ワールド 11-41「時計塔の町」。もとは game-looks-11/41-clock-tower-town.html（見るだけの場面）。
// 蒸気と歯車の町の昼。石だたみの広場の奥に、真ちゅうの歯車をむき出しにした れんがの時計塔。屋根の上を銅のパイプが走り、ところどころで蒸気をふく。
// ゲームにするために足した物：家・塔・小物の当たり判定、塔の大歯車の前の鉄の見はり台と階段（のぼれる）、つみ上げた木箱、
// 広場の手前をふさぐ家なみと鉄の門、塔のうしろの鉄の柵、話せる人 8 人とねこ、しらべられる物 4 つ。
TALE_WORLD('11-41', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), C = PACK_CITY(THREE, K, R), S = PACK_STEAM1(THREE, K, R), { hash } = K, PI = Math.PI;
  scene.add(R.skyDome([[0, '#3f7cc8'], [.55, '#86b8e4'], [.9, '#d8e8ec'], [1, '#f4ecd4']], { r: 400 })); scene.fog = new THREE.Fog('#d8dcd8', 50, 230);
  K.lights(scene, G.renderer, { sky: 0xd8e4f4, ground: 0x9a7a60, amb: 1.4, sun: 0xfff0d0, power: 2.4, range: 34, pos: [-27, 43, 30] });

  // ---- 地面：まん中が丸石の広場、ふちに れんがの歩道、家の前は板石（もとのまま） ----
  const land = R.ground({ w: 150, d: 140, cell: 2, cz: -14, layers: [T.cobble({ c: '#b4a48a', moss: .1 }), T.brickFloor({ c: '#a86a50' }), T.cobble({ kind: 'slab', c: '#9a8e80' })],
    mix: (x, z) => { const e = Math.max(Math.abs(x) - 22, -z - 29, z - 7); return [e > 0 && e < 3 ? 1 : 0, e >= 3 ? 1 : 0]; } });
  scene.add(land.mesh); G.bounds(-25.6, 25.6, -31, 13.4);

  // ---- 時計塔：れんがの胴に、緑青のとんがり屋根。正面の下に、かみあう真ちゅうの歯車 ----
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const BR = [T.brick({ c: '#a8583c' }), T.brick({ c: '#b86a48', seed: 2 }), T.brick({ c: '#8e4a3a', seed: 3 }), T.brick({ c: '#c07a56', seed: 4 })];
  const TW = [3, -27]; put(F.clockTower({ w: 6, h: 31, stone: BR[2], roof: '#4f8f80', time: 2.4, flag: { c: '#c8963a', crest: 'sun', cc: '#4a3a30' } }), TW[0], TW[1]); G.box(TW[0], TW[1], 6.8, 6.8, -1, 60, 0, true);
  const G1 = [[-1.1, 6.2, 2.3, .35], [1.7, 9.4, 1.4], [2.2, 4.1, 1, 0], [-2.1, 10.4, .8]], gears = [];
  { const sp = .35; G1.forEach(([gx, gy, r], k) => { const g = S.gear({ r, c: k % 2 ? '#d8a84a' : '#c8963a', speed: k === 0 ? sp : -sp * 2.3 / r * (k === 3 ? -1 : 1), phase: k * .4, th: .3 }); g.position.set(TW[0] + gx, gy, TW[1] + 3.25 + (k % 2) * .25); scene.add(g); gears.push(g); }); }
  G.sign(TW[0] - .4, 1.2, TW[1] + 3.6, { name: '塔の銘板', lines: [['「この時計は 蒸気の力で 時をきざむ」', '「一秒も くるわせるべからず」と ほってある。']] });

  // ---- 足した：大歯車の前の 鉄の見はり台（高さ 2 m）と、右がわの鉄の階段。下は くぐれる ----
  { const IRON = C.tex.plate({ c: '#5a5e70', n: 2 }), Gb = R.geo(), y = 2, x0 = -1.2, x1 = 9.4, z0 = -23.2, z1 = -21.6;
    Gb.box(x1 - x0, .2, z1 - z0, (x0 + x1) / 2, y - .2, (z0 + z1) / 2, { m: 2 }); for (const [px, pz] of [[x0 + .15, z1 - .15], [7.6, z1 - .15], [x0 + .15, z0 + .15], [x1 - .15, z0 + .15]]) Gb.box(.16, y - .2, .16, px, 0, pz, { m: 2 });
    const me = Gb.mesh(IRON); fixed.push(me); G.box((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y - .2, y); G.circle(x0 + .15, z1 - .15, .14, -1, y - .2); G.circle(7.6, z1 - .15, .14, -1, y - .2);
    const Rl = R.geo(); Rl.quad([x0, y, z1], [7.8, y, z1], [7.8, y + .95, z1], [x0, y + .95, z1], [0, 0, 9, 1]).quad([x0, y, z0], [x0, y, z1], [x0, y + .95, z1], [x0, y + .95, z0], [0, 0, 1.6, 1]).quad([x1, y, z1], [x1, y, z0], [x1, y + .95, z0], [x1, y + .95, z1], [0, 0, 1.6, 1]);
    fixed.push(Rl.mesh(F.tex.rail({ kind: 'iron' }), { side: true })); G.box((x0 + 7.8) / 2, z1, 7.8 - x0, .12, y, y + 1.4, 0, true); G.box(x0, (z0 + z1) / 2, .12, z1 - z0, y, y + 1.4, 0, true); G.box(x1, (z0 + z1) / 2, .12, z1 - z0, y, y + 1.4, 0, true);
    const n = 9, d = 3, sz = z1 + d / 2; put(F.stairs({ w: 1.6, h: y, d, n, tex: IRON, rail: 'iron' }), 8.6, sz, 0, 0);
    for (let i = 0; i < n; i++) G.box(8.6, sz + d / 2 - (i + .5) * d / n, 1.6, d / n, -1, (i + 1) * y / n);
    G.sign(-.2, y + 1.6, z0 + .3, { name: '大歯車', lines: [['目の前で、大人の 背たけより大きな 歯車が ゆっくり回る。', 'ごとり、ごとり……。油と 鉄の においがする。']] }); }

  // ---- 家：れんがの 2〜3 階建て。スレートの屋根、えんとつ、店のひさし（当たり判定は かべの大きさ） ----
  const SLATE = [F.tex.slate({ c: '#5a6478', c2: '#6a7488' }), F.tex.slate({ c: '#4f8f80', c2: '#6aa898', seed: 2 }), T.roof({ kind: 'slate', c: '#6a5a5a' })];
  const winP = T.window({ bars: 'cross', curtain: '#f0e4cc', frame: '#3a3a44', box: true }), winA = T.window({ bars: 'grid', arch: 1, curtain: '#c8d8e0', frame: '#4a3a30' }), DOOR = T.door({ style: 'panel', c: '#3a5a50' }), DOOR2 = T.door({ style: 'glass', c: '#6a3a2c' });
  const AW = [T.fabric({ c: '#c8963a', c2: '#f0e4cc', pattern: 'stripe', scallop: 1 }), T.fabric({ c: '#4f8f80', c2: '#e8e0cc', pattern: 'stripe', scallop: 1 }), T.fabric({ c: '#a8443a', c2: '#f0e4cc', pattern: 'stripe', scallop: 1 })];
  const row = (pts, ry, s0 = 0) => pts.forEach(([x, z, w], j) => { const i = j + s0, h2 = 2.6 + (i % 2) * .4, hs = R.house({ w, d: 6, h: 3.2, h2, wall: BR[i % 4], wall2: BR[(i + 1) % 4], roof: SLATE[i % 3], pitch: .75, eave: .5, ridge: 'x', door: i % 2 ? DOOR : DOOR2, win: i % 2 ? winP : winA, chimney: true, awning: i % 3 === 1 ? AW[i % 3] : undefined, seed: i, wins: { f: 2, b: 1, l: 1, r: 1 }, wins2: { f: 3, b: 1, l: 1, r: 1 } });
    put(hs, x, z, ry); G.box(x, z, w + .2, 6.2, -1, 30, ry, true); });
  row([[-27, -34, 7], [-19.5, -35, 7.4], [-12, -34.5, 6.6], [12, -34.5, 6.8], [19.5, -35, 7.4], [27, -34, 7], [34, -34.5, 6.5]], 0);
  row([[29, -21, 7], [29.5, -13.5, 7.2], [29, -6, 6.6], [29.5, 1.5, 7.4], [29, 9, 7]], -PI / 2);
  row([[-29, -21, 7], [-29.5, -13.5, 7.2], [-29, -6, 6.6], [-29.5, 1.5, 7.4]], PI / 2);
  row([[18, 17, 7], [25, 16.5, 7], [11, 17, 6.6]], PI);
  // 足した：広場の手前と左のかどの家（広場をかこむ）。まん中の通りは 鉄の門で とじている
  row([[-29, 9, 7]], PI / 2, 5); row([[-25.5, 17, 7], [-18.2, 16.6, 7.4], [-10.8, 17, 7], [-3.6, 16.8, 6.8]], PI, 2);
  { const g = F.gate({ w: 7.6, h: 6, d: 1.4, aw: 4.4, ah: 4.6, stone: BR[0], door: 'portcullis', open: 0, arch: 'round', crest: 'sun' }); put(g, 3.9, 15.4, PI); G.box(3.9, 15.4, 7.6, 1.6, -1, 30, 0, true);
    G.sign(3.9, 1.4, 14.4, { name: '町の門', lines: [['鉄の格子が おりている。', '「蒸気機関車の 発車時刻まで あかない」と はり紙がある。']] }); }
  // 2 列め（すきまから地平が見えないように、高めの家を奥にならべる）
  [[-30, -46], [-21, -47], [-12, -46.5], [-3, -47.5], [6, -46], [15, -47], [24, -46.5], [33, -47], [42, -40], [42, -30], [42, -20], [-41, -40], [-41, -30]].forEach(([x, z], i) => put(R.house({ w: 8.4, d: 7, h: 4, h2: 4 + (i % 3), wall: BR[(i + 2) % 4], roof: SLATE[(i + 1) % 3], pitch: .8, ridge: i % 2 ? 'z' : 'x', chimney: true, seed: i + 20, win: winP, wins: { f: 3, b: 0, l: 1, r: 1 }, wins2: { f: 3, b: 0, l: 1, r: 1 } }), x, z, Math.abs(x) > 40 ? -Math.sign(x) * PI / 2 : 0));
  [[-41, -20], [-41, -8], [-41, 4], [-30, 26], [-18, 27], [-6, 26.5], [6, 27], [18, 27], [30, 26.5], [42, 0], [42, 12]].forEach(([x, z], i) => put(R.house({ w: 8.4, d: 7, h: 4, h2: 4 + (i % 3), wall: BR[(i + 1) % 4], roof: SLATE[i % 3], pitch: .8, ridge: i % 2 ? 'z' : 'x', chimney: true, seed: i + 40, win: winP, wins: { f: 3, b: 0, l: 1, r: 1 }, wins2: { f: 3, b: 0, l: 1, r: 1 } }), x, z, Math.abs(x) > 40 ? -Math.sign(x) * PI / 2 : PI));
  // 塔のうしろの すきまは 鉄の柵（ここから先は 工場の敷地）
  for (const [x, len] of [[-4.5, 8.2], [7.45, 2.3]]) put(R.fence({ len, kind: 'iron', h: 1.3 }), x, -31.4, 0);

  // ---- 屋根の上を走る銅のパイプ（家から塔へ、塔から家へ）と、蒸気の口（もとのまま） ----
  const PIPE = { c: '#b8703a', joint: 2.2 }, vents = [];
  const pipe = (pts, r = .2, o = PIPE) => fixed.push(C.pipe(pts, r, { ...o, bend: .8 }));
  pipe([[-26, 9.2, -32], [-12, 9.2, -32], [-12, 11, -27], [TW[0] - 3.2, 11, -27]]); pipe([[TW[0] + 3.2, 12, -26], [12, 12, -26], [12, 9.6, -32], [27, 9.6, -32], [27, 9.6, -21], [27, 9.2, 2]], .24);
  pipe([[-26.5, 8.6, -31], [-26.5, 8.6, -6], [-24, 8.6, -6]], .14, { c: '#8a8e98', joint: 1.6 }); pipe([[26.4, 8.4, -30.6], [26.4, 8.4, 6]], .14, { c: '#c8963a', joint: 1.6 });
  for (const [x, y, z, s] of [[-12, 11.4, -29, 1], [12, 12.4, -28, 1.2], [27, 10, -12, 1], [-26.5, 9, -18, .8], [26.4, 8.8, -3, .8]]) { fixed.push(C.valve({ r: .26 }).translateX(x).translateY(y - .25).translateZ(z)); const st = C.steam({ n: 8, r: .7 * s, rise: 3.6 * s, a: .62, speed: .3, wind: [1.2, .2] }); st.position.set(x, y, z); scene.add(st); vents.push(st); }
  // 足した：広場の地面に、蒸気をふく 小さな機械（さわると あたたかい）
  { const g = C.generator({ c: '#6a5a4a' }); put(g, -21.2, -26.4, .5, 0, 'box'); const st = C.steam({ n: 6, r: .4, rise: 2.4, a: .55, speed: .35, wind: [.6, .2] }); const v = g.userData.vent || [0, 1.6, 0]; st.position.set(-21.2 + (v[0] ?? v.x ?? 0), (v[1] ?? v.y ?? 1.6), -26.4 + (v[2] ?? v.z ?? 0)); scene.add(st);
    G.sign(-21.2, 1, -25.2, { name: '蒸気の機械', lines: [['しゅうしゅうと 白い蒸気を ふいている。', 'さわると ほんのり あたたかい。'], ['横の 小さな圧力計の 針が、', 'ぷるぷる ふるえている。']] }); }

  // ---- 広場の小物：ガス灯、ベンチ、噴水、屋台、樽と木箱、花だん ----
  for (const [x, z] of [[-14, -10], [-4, 1], [8, 1], [18, -10], [-12, -22], [16, -22]]) put(R.lamp({ h: 3.4, c: '#2e3a3a' }), x, z, 0, 0, 'trunk', { r: .16 });
  put(R.bench({ c: '#6a4a34' }), -8, -15, .3, 0, 'box'); const fon = R.fountain({ r: 2.2, stone: T.stone({ c: '#b0a490' }), water: '#5aa8c8' }); fon.position.set(-3, 0, -16); scene.add(fon); G.circle(-3, -16, 2.45, -1, .56); G.circle(-3, -16, .55, -1, 2.3); put(R.bench({ c: '#6a4a34' }), 13, -15.5, -.3, 0, 'box');
  G.sign(-3, .6, -13.4, { name: '噴水', lines: [['水の中で、小さな 歯車が くるくる回っている。', '水の力で 回る、おもちゃの 水車らしい。']] });
  put(R.stall({ c: '#a8443a', c2: '#f0e4cc', fc: ['#e8c040', '#c84a3a', '#6aa04a'] }), 21, -11, -PI / 2 + .2, 0, 'box'); put(R.stall({ c: '#4f8f80', c2: '#f0e4cc', fc: ['#e8a060', '#f0e0a0'] }), -19, -14, PI / 2 - .2, 0, 'box');
  for (const [a, b] of [[[-26, 6.5, -31], [TW[0] - 3, 9, -24]], [[TW[0] + 3, 9, -24], [26, 6.5, -24]]]) fixed.push(F.bunting({ from: a, to: b, n: Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) * 1.3), cs: ['#c8963a', '#a8443a', '#4f8f80', '#f0e4cc'], sag: 1.2 }));
  [[22, -15], [22.8, -15.8], [-20, -17], [-20.6, -18]].forEach(([x, z], j) => put(j % 2 ? R.crate({ c: '#8a6a44' }) : R.barrel({ c: '#7a5a3a' }), x, z, j, 0, j % 2 ? 'box' : 'round'));
  for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; put(R.tuft({ kind: 'flower', s: 1.2 }), TW[0] + Math.cos(a) * 5.4, TW[1] + 4 + Math.sin(a) * 1.4); }
  put(C.tank({ r: 1.1, h: 2.4, c: '#8a5a3a' }), 23, -27, 0, 0, 'round'); put(S.chimney({ r: .9, h: 16 }), -22, -42); put(S.chimney({ r: .8, h: 13, tex: BR[0] }), 30, -44);
  // 足した：荷おろし場の 木箱の山（ぴょんぴょん のぼれる。てっぺんから広場を見わたせる）
  [[18.6, -26.6, 0, .9], [19.5, -26.6, 0, .9], [19.5, -27.5, 0, .9], [18.6, -27.5, 0, .9], [19.5, -27.5, .9, .9], [18.6, -27.5, .9, .9], [19.05, -27.5, 1.8, .9]].forEach(([x, z, y, s], i) => put(R.crate({ s, kind: i % 2 ? 'x' : 'slash', c: i % 3 ? '#8a6a44' : '#9a7a50' }), x, z, i * .15, y, 'box'));
  put(R.barrel({ c: '#7a5a3a' }), 17.6, -25.8, 0, 0, 'round');
  scene.add(R.merge(fixed));
  scene.add(R.backdrop({ c: '#7a8aa8', haze: '#d8e0e8', r: 170, h: 44, y: -2, rep: 3 }), R.backdrop({ c: '#98a8c0', haze: '#e4ecf0', r: 280, h: 80, y: -4, seed: 4 }));
  for (let k = 0; k < 7; k++) { const c = R.cloud({ s: 16 + hash(k, 9) * 12, c: '#ffffff', shade: '#b8c8e0' }); c.position.set((hash(k, 7) - .5) * 340, 80 + hash(k, 8) * 40, -150 - hash(k, 6) * 150); scene.add(c); }
  const chim = C.steam({ n: 10, r: 1.4, rise: 9, a: .5, speed: .16, c: '#d8d4dc', wind: [5, 1] }); chim.position.set(-22, 16, -42); scene.add(chim);

  // ---- 町の人（TL.person。主人公と同じ 4.5 頭身の作り）。役ごとの服と帽子で見分ける ----
  const Cl = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#4a3a30', hair: 'wolf', bulk: 1.12, head: { hair: '#5a4a3a', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'beard' }, colors: { pants: '#3a4a5a', linen: '#d8c8a8', scarf: '#c8963a', brass: '#d8a84a' } }, 1.6, -22.5, .2,
    { name: '時計塔の機械工', lines: [['よう、のぼってきたか。', 'この大歯車は、町じゅうの パイプの 蒸気で 回ってるんだ。'], ['一日に いちど、歯に 油を さす。', 'さぼると、町の時計が ぜんぶ くるうからな。'], ['霧の朝には、川に かかる 鉄橋まで 鐘の音が とどくそうだ。']] }, 2);
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'center', head: { hair: '#3a2e2a', skin: '#e0b088', brow: 'angry', mouth: 'line', beard: 'mustache' }, colors: { tunic: '#3a5a50', metal: '#c8963a', scarf: '#a8443a' } }, -2.4, -22.4, .3,
    { name: '時計塔の番人', lines: [['塔の中へは 入れないよ。', '中は 歯車だらけで、あぶないからね。'], ['歯車を 近くで 見たいなら、右の 鉄の階段から 見はり台へ どうぞ。', '手すりから 身をのりだしちゃ だめだぞ。']] });
  folk({ size: 'normal', hat: 'beret', hatC: '#7a3a4a', hair: 'center', head: { hair: '#3a2a28', skin: '#f0c49c', eye: '#6a4a5a', mouth: 'smile' }, colors: Cl('#7a3a4a', '#4a3a3a', '#5a4a4a', '#f0e4cc', { linen: '#f0e4cc' }) }, 0, 0, 0,
    { name: 'かいもの帰りの ご婦人', path: loop([[-18, -7.8], [16, -7.8], [16, -7.2], [-18, -7.2]]), speed: 1, lines: [['あら、旅の方？', 'この町の時計は、王都の時計より 正確なのよ。'], '屋台の あんずパイ、もう 食べた？'] });
  folk({ size: 'tall', hat: 'cap', hatC: '#3a3a4a', hold: 'staff', hair: 'swept', head: { hair: '#5a5050', skin: '#e8b890', eyes: 'small', mouth: 'line', beard: 'mustache' }, colors: Cl('#3a3a4a', '#6a5a4a', '#4a4450', '#e8dcc0') }, 0, 0, 0,
    { name: 'ステッキの紳士', path: loop([[14, -12.2], [-16, -12.2], [-16, -11.6], [14, -11.6]]), speed: .8, u: .3, lines: [['ふむ。今日も 時計塔は 正午ぴったりに 鳴ったな。', 'わたしは 毎日 時計を 合わせに 来るのだよ。'], ['北の 砂の谷に、巨大な像が すわっているそうだ。', '蒸気船で 川をくだって、ずっと先だがね。']] });
  folk({ size: 'normal', hat: 'straw', hair: 'swept', head: { hair: '#c88a4a', skin: '#f0c49c', eye: '#4a7a6a', mouth: 'smile', blush: true }, colors: Cl('#4f8f80', '#c8963a', '#6a5a4a', '#f0e8d8') }, 0, 0, 0,
    { name: '郵便の むすめ', path: loop([[-3, -12.4], [.6, -16], [-3, -19.6], [-6.6, -16]]), speed: 1.4, lines: [['手紙を とどけるところなの。', 'この町の 手紙は、パイプの中を 蒸気で とんでいくのよ。'], 'うそじゃないわ。屋根の上の 銅のパイプ、見たでしょ？'] });
  folk({ size: 'normal', outfit: 'worker', hat: 'kerchief', hatC: '#c8853a', hair: 'wolf', head: { hair: '#2a2228', skin: '#d8a070', eyes: 'small', mouth: 'open' }, colors: { pants: '#8a6a3a', linen: '#d8c8a8', scarf: '#c8853a' } }, 0, 0, 0,
    { name: '見習いの職人', path: loop([[-19, -27.6], [-2, -27.6], [-2, -26.8], [-19, -26.8]]), speed: 1.2, u: .6, lines: [['親方に たのまれた ねじを とどけるんだ。', '……あれ、どの 箱だったっけ。'], ['荷おろし場の 木箱の山、てっぺんまで のぼれるんだぜ。', '親方には ないしょな。']] });
  folk({ size: 'child', hat: 'cap', hatC: '#e8a43a', hair: 'swept', head: { hair: '#8a4a2a', skin: '#f0c49c', mouth: 'open', blush: true }, colors: Cl('#e8a43a', '#6a4a3a', '#5a4a3a', '#f8f0e0') }, 0, 0, 0,
    { name: 'はとを追う子', path: loop([[8.6, -10], [6, -7.6], [3.4, -10], [6, -12.4]]), speed: 2.4, lines: [['はとさん、まって〜！', '……また にげられた。'], 'ぼく 大きくなったら、時計塔の 機械工に なるんだ！'] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#a8443a', hair: 'center', head: { hair: '#5a3a2a', skin: '#e8b890', mouth: 'smile' }, colors: { tunic: '#a8443a', apron: '#f0ece0' } }, 22.2, -11.4, -PI / 2 + .2,
    { name: 'くだもの屋の おかみさん', r: .3, lines: [['いらっしゃい！ 南の 果樹園の あんずだよ。', '蒸気機関車で けさ とどいたばかり。'], 'あんずパイも あるよ。ひとつ どうだい？'] });
  folk({ size: 'small', hat: 'cap', hatC: '#5a4a3a', hold: 'staff', hair: 'center', head: { hair: '#c8c0b8', skin: '#e0b088', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: Cl('#5a4a3a', '#3a3a4a', '#4a4450', '#d8d0c0') }, -8.2, -14, .3,
    { name: 'ベンチの おじいさん', lines: [['わしが 子どもの ころは、この広場に 時計なんぞ なかった。', '日時計で じゅうぶん だったんじゃ。'], ['今では、町の だれもが 時計を 見て 走りまわっておる。', 'たまには すわって、はとでも ながめれば よいのにのう。']] });
  // ねこ（屋台の台の上。話しかけると ないて、すわりなおす）
  const cat = R.cat({ c: '#4a4448', belly: '#d8d0c8' }); cat.position.set(-18.4, .85, -14.3); cat.rotation.y = .6; scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃあ。', '……ごろごろ。', 'にゃ？'], idle: t => R.catPose(cat, 'sit', t) });
  // はと：地面でついばむ群れ（主人公が近づくと飛びたつ）と、塔のまわりを回る群れ
  const pig = o => { const b = R.bird({ c: '#8a8c9c', belly: '#b8b8c8', neck: true, s: 1.6, ...o }); scene.add(b); return b; };
  const flock = [...Array(9)].map((_, k) => ({ b: pig(), x: -15 + hash(k, 1) * 9 + (k > 5 ? 12 : 0), z: -4.4 + (hash(k, 2) - .5) * 3.4, ry: hash(k, 3) * 6 }));
  const ring = [...Array(6)].map((_, k) => pig({ c: k % 2 ? '#9a9aa8' : '#7a7c8c' }));

  // ---- 毎コマ ----
  G.spawn(3, 9, PI);
  G.tour([[3, 2], [-8, -8], [-12, -12.5], [-8, -19.5], [2, -19], [8.6, -17], [8.6, -22.4], [4, -22.6], [0, -22.6], [8.6, -21.8], [8.6, -16], [17.4, -24.2], [18.6, -26.4], [19.05, -27.3], [16, -16], [20, -4], [10, 4], [0, 6]]);
  G.tick(() => G.cam.rotateX(innerWidth < innerHeight ? .26 : .2));
  G.tick((t, dt, P) => {
    // 地面のはと：主人公が 3 m より近いと、ぱっと飛びあがる
    flock.forEach((g, k) => { const d = Math.hypot(g.x - P.x, g.z - P.z), up = Math.max(0, 3.2 - d), y = up * 1.6 + (up > 0 ? Math.sin(t * 9 + k) * .1 : 0);
      g.b.position.set(g.x + (up > 0 ? (g.x - P.x) * up * .25 : 0), y, g.z - up * .6); g.b.rotation.y = up > 0 ? Math.atan2(g.x - P.x, -1) : g.ry + Math.sin(t * .5 + k) * .6; R.birdPose(g.b, up > .05 ? 'fly' : 'peck', t + k); });
    ring.forEach((b, k) => { const a = t * .35 + k * 1.05, r = 8 + (k % 3) * 2; b.position.set(TW[0] + Math.cos(a) * r, 20 + (k % 3) * 2 + Math.sin(t + k) * .5, TW[1] + Math.sin(a) * r); b.rotation.y = -a; R.birdPose(b, 'fly', t * .6 + k); });
    fon.userData.tick(t); S.tick(t); F.tick(t); C.update(t, G.cam); });
});
