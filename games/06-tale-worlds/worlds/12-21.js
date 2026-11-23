// ワールド 12-21「見上げる下層の市場」。もとは game-looks-12/21-under-market-looking-up.html（見るだけの場面）。
// 夕方、人であふれる下層の市場。頭の上を 上の都市をのせた巨大な台の裏がおおい、その切れ目の向こうに 白と金の塔の都市と しずむ夕日がのぞく。
// ゲームにするために足した物：店・屋台・荷物の当たり判定、通りの両はしの トタンのさく、通りをまたぐ 木の わたり橋（鉄の階段で のぼれる）、
// 話せる市場の人 9 人とねこ、しらべられる物 4 つ、行き交う人ごみ（主人公と同じ作りの人）。見上げる構図を保つため、カメラの見る点を少し上げる。
TALE_WORLD('12-21', G => {
  const { THREE, K, R, T, TL, scene } = G, C = PACK_CITY(THREE, K, R), U = PACK_UNDER1(THREE, K, R, C), X = C.tex, L = C.LIGHT, { hash } = K, PI = Math.PI, HAZE = '#c07a7a';
  G.cam.far = 2000; G.cam.updateProjectionMatrix();
  scene.add(R.skyDome([[0, '#3a2c68'], [.45, '#8a4a7a'], [.78, '#e07868'], [.92, '#ffb070'], [1, '#ffe0a0']], { r: 1500 })); scene.fog = new THREE.Fog(HAZE, 60, 1700);
  K.lights(scene, G.renderer, { sky: 0xa090d0, ground: 0x8a5a50, amb: 1.6, sun: 0xffb080, power: 1.1, range: 30, pos: [6, 28, -60] });
  // 夕日（塔のあいだに しずむ）
  { const s = new THREE.Mesh(new THREE.CircleGeometry(40, 20), new THREE.MeshBasicMaterial({ color: '#ffe8a8', fog: false })); s.position.set(-110, 430, -1400); scene.add(s); const hl = C.halo({ c: '#ff9a60', r: 150, k: .5 }); hl.position.copy(s.position); scene.add(hl); }

  // ---- 市場の通り（-z へのびる）。店とあかりの一覧 ----
  const LOTS = [], lights = [], WD = [4.6, 5.4, 4.2, 6, 4.8];
  for (const s of [-1, 1]) for (let z = 24, i = 0; z > -90; i++) { const w = WD[(i + (s > 0 ? 2 : 0)) % 5]; LOTS.push({ z: z - w / 2, s, w, i: LOTS.length }); z -= w + .3; }
  for (const l of LOTS) lights.push({ x: l.s * 3.2, z: l.z, r: 5, c: L.bulb, k: .75 }, { x: l.s * 2.4, z: l.z + 1, r: 3.4, c: [L.pink, L.cyan, L.amber][l.i % 3], k: .4 });
  for (let z = 20; z > -86; z -= 7) lights.push({ x: 0, z, r: 4.4, c: '#ff9a4a', k: .4 });
  const land = R.ground({ w: 40, d: 230, cell: 1.5, cz: -40, layers: [X.asphalt({ wet: .3, c: '#5a5064' }), X.conc({ c: '#9a8c84' }), X.plate({ c: '#70708a', n: 2 })],
    mix: (x, z) => [Math.abs(x) > 3.3 ? 1 : 0, Math.abs(x) < 3 && hash(Math.round(x / 3), Math.round(z / 5)) > .8 ? 1 : 0], shade: C.lightShade(lights, [.6, .52, .62]) }); scene.add(land.mesh);
  G.ground(() => 0); G.bounds(-3.15, 3.15, -77, 20.8);

  // ---- 店：つぎはぎの家（2〜4 階）。のれん・店先・ほろ、ネオン、せんたく物。当たりは かべの箱（ほろの下は歩ける） ----
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const KIND = ['noren', 'open', 'window', 'noren', 'open', 'shutter'], ICON = ['cup', 'fish', 'bottle', 'moon', 'star', 'wave', 'gear', 'heart'];
  for (const { z, s, w, i } of LOTS) { const fl = 2 + Math.floor(hash(i, 3) * 2.5), kind = KIND[i % 6];
    put(C.shack({ w, d: 4.6, floors: fl, seed: i + 3, shop: kind, shopC: ['#2f4a8a', '#b8302a', '#2f7a5a', '#6a3a7a'][i % 4], goods: ['food', 'goods', 'parts'][i % 3], lit: .8, awning: kind === 'shutter' ? false : ['#c2453a', 'tin', '#2f7a8a', '#c8a04a'][i % 4], laundry: i % 3 === 1, antenna: i % 4 === 2, tank: i % 5 === 3,
      sign: i % 2 ? { kind: ICON[i % 8], c: [L.pink, L.cyan, L.amber][i % 3], c2: L.amber, shape: ['tall', 'sq'][i % 2], side: s, flicker: i % 7 === 3 } : false }), s * 5.6, z, s > 0 ? -PI / 2 : PI / 2);
    G.box(s * 5.6, z, w + .3, 4.6, -1, 16, s > 0 ? -PI / 2 : PI / 2, true); }
  // 通りの屋台（湯気）と荷物
  const YT = [[-2.05, -4, '#c2453a'], [2.1, -12, '#2f7a8a'], [-2.05, -21, '#c8a04a'], [2.1, -30, '#c2453a'], [-2.05, -40, '#2f7a8a'], [2.1, -52, '#c8a04a']];
  YT.forEach(([x, z, c], i) => { put(C.yatai({ c, kind: ['wave', 'ring', 'dots'][i % 3], noren: ['#2f4a8a', '#b8302a', '#2f7a5a'][i % 3], seed: i }), x, z, x > 0 ? -PI / 2 : PI / 2); G.box(x, z, 1.15, 2.3, -1, 1.1, 0, true); });
  for (let k = 0; k < 14; k++) { const z = 10 - k * 6.5, x = (k % 2 ? 1 : -1) * (3.4 + hash(k, 1) * .4); put([R.crate({ s: .6, kind: 'x' }), C.drum({ c: C.PAL[k % 3] }), R.barrel({ h: .9 }), C.tires({ n: 2 })][k % 4], x, z + 2.5, k, 0, k % 4 === 0 ? 'box' : 'round'); }
  // 通りをわたる裸電球・ちょうちん・布の旗
  for (let z = 18, k = 0; z > -86; z -= 7, k++) { fixed.push(C.bulbs([-3.4, 5.4 + (k % 2) * .6, z], [3.4, 5.4, z - 1], { n: 6, sag: .7, cs: k % 3 ? [L.bulb] : [L.bulb, L.pink, L.bulb, L.cyan] }));
    if (k % 2) fixed.push(C.lanterns([-3.4, 6.6, z - 3.5], [3.4, 6.8, z - 3.5], { n: 5, sag: .8, kinds: ['red', 'white'] })); }
  // 頭の上の配管（通りにそって・横切って）
  fixed.push(C.pipe([[-4.2, 9.4, 30], [-4.2, 9.4, -95]], .4, { c: '#6e7890', joint: 6 }), C.pipe([[4, 10.6, 30], [4, 10.6, -95]], .3, { c: C.PAL[0], joint: 5, band: '#e8e4d8' }));
  for (const z of [6, -26, -58]) fixed.push(C.pipe([[-30, 13, z], [-6, 13, z], [-4, 11, z], [4, 11, z], [6, 14, z], [30, 14, z]], .5, { c: C.PAL[1], joint: 5, bend: 1.2 }));

  // ---- 足した：通りの両はしの トタンのさく（ここで市場が終わる。奥は工事中、手前は荷物置き場） ----
  for (const [z, ry] of [[21.3, 0], [-77.6, PI]]) { put(C.fence({ len: 7, h: 2.2, kind: 'tin' }), 0, z, ry); put(R.crate({ s: .8 }), -1.6, z + (ry ? .9 : -.9), .3, 0, 'box'); put(C.drum({ c: C.PAL[1] }), 2, z + (ry ? .8 : -.8), 0, 0, 'round'); }
  // ---- 足した：通りをまたぐ 木の わたり橋（高さ 3.6 m）と、両がわの鉄の階段 ----
  const BZ = -43.6, BY = 3.6;
  const stair = (x0, z0, ry, base, h, run) => { const s = C.stairs({ h, run, w: .9, c: '#6a6478', rail: 'both' }); s.position.set(x0, base, z0); s.rotation.y = ry; fixed.push(s);
    const n = Math.ceil(h / .38), c = Math.cos(ry), sn = Math.sin(ry);
    for (let i = 0; i < n; i++) { const lx = (i + .5) * run / n; G.box(x0 + c * lx, z0 - sn * lx, run / n + .02, .9, base - .5, base + h * (i + 1) / n, ry); }
    G.box(x0 + c * (run + .5), z0 - sn * (run + .5), 1, .9, base - .5, base + h, ry);
    for (const sz of [-1, 1]) G.box(x0 + c * run / 2 - sn * sz * .47, z0 - sn * run / 2 - c * sz * .47, run, .06, base + .3, base + h + 1, ry, true); };
  stair(2.72, BZ + 4.6, PI / 2, 0, BY, 4.1); stair(-2.72, BZ - 4.6, -PI / 2, 0, BY, 4.1);
  { const Gb = R.geo(); Gb.box(6.5, .2, 1.1, 0, BY - .2, BZ, { m: 2 }); fixed.push(Gb.mesh(T.planks({ c: '#8a6a4a' }))); G.box(0, BZ, 6.5, 1.1, BY - .22, BY, 0);
    const bm = C.beam({ len: 7.2, h: .3, w: .25, c: '#5a5468' }); bm.position.set(0, BY - .5, BZ); fixed.push(bm);
    for (const [sz, x0, x1] of [[1, -3.2, 2.25], [-1, -2.25, 3.2]]) { const f = C.fence({ len: x1 - x0, h: 1, kind: 'mesh' }); f.position.set((x0 + x1) / 2, BY, BZ + sz * .55); fixed.push(f); G.box((x0 + x1) / 2, BZ + sz * .56, x1 - x0, .08, BY, BY + 1.05, 0, true); }
    fixed.push(C.lanterns([-3.2, BY + 2.9, BZ], [3.2, BY + 2.9, BZ], { n: 5, sag: .3, kinds: ['yellow', 'red'] })); }
  scene.add(R.merge(fixed));

  // ---- 上：頭の上をおおう巨大な台（下の面 y=40）。-z のはしで切れ、その向こうに上の都市 ----
  const SY = 40, EDGE = -34;
  const HOLES = [[0, -12], [-24, 6], [22, -26]], hole = (x, z) => HOLES.some(([hx, hz]) => Math.abs(x - hx) < 5 && Math.abs(z - hz) < 5);
  const slab = U.slab({ w: 240, d: 150, th: 9, cell: 10, edge: 'b', glow: '#9a8098', hole: (x, z) => hole(x, z + (EDGE + 75)) }); slab.position.set(0, SY, EDGE + 75); scene.add(slab);
  for (const [x, z] of HOLES) { const s = C.shaft({ w: 8, h: SY, a: .22, lean: .08, c: '#ffc890' }); s.position.set(x, 0, z); scene.add(s); }
  // 台からたれる配管と、そのはしの あかり
  { const P = []; for (let k = 0; k < 26; k++) { const x = (hash(k, 1) - .5) * 120, z = EDGE + 4 + hash(k, 2) * 120, len = 4 + hash(k, 3) * 10; if (Math.abs(x) < 9) continue; P.push(C.pipe([[x, SY + 1, z], [x, SY - len, z], ...(k % 3 ? [] : [[x + 3, SY - len - 2, z]])], .3 + hash(k, 4) * .35, { c: ['#6e7890', '#a85a30', '#5a5e78'][k % 3], joint: 4 })); } scene.add(R.merge(P)); }
  scene.add(U.lights([...Array(24)].map((_, k) => [-110 + k * 9.6, SY - .6, EDGE - .4]), { c: '#fff0c8', r: .7 }));
  // 台を支える巨大な柱（通りの左右の奥）
  scene.add(R.merge([[-34, -20, 5], [36, 8, 5.5], [-40, 40, 5]].map(([x, z, r], i) => { const p = C.pillar({ r, h: SY + .5, seed: i, c: '#6c6890', emissive: '#3a2a48', lm: 40 }); p.position.set(x, 0, z); return p; })));
  // 上の都市：遠くの高い台の上の 白い塔の群れ（夕日を受ける）
  const city = U.city({ r: 120, n: 22, seed: 4, hmin: 50, hmax: 230, glow: '#ffe4cc', light: [.4, .5, .8], plate: { th: 14, pipes: 18, lampC: '#ffe8b0' } }); city.position.set(-20, 150, -520); scene.add(city);
  const city2 = U.city({ r: 70, n: 10, seed: 9, hmin: 40, hmax: 150, glow: '#f8d0c0', light: [.4, .5, .8], plate: { th: 9, pipes: 10 } }); city2.position.set(230, 120, -440); scene.add(city2);
  scene.add(C.backdrop({ r: 300, h: 50, y: -2, haze: '#a06070', c: '#4a3850' }));
  // 上の都市から下へ のびる 光る索道のケーブルと、それを行き来する ゴンドラの あかり
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(60, 0, -150), new THREE.Vector3(30, 140, -420)]), new THREE.LineBasicMaterial({ color: '#2a2030' })));
  const gond = U.lights([[0, 0, 0], [0, 0, 0]], { c: '#fff4d0', r: 1.4 }); scene.add(gond);
  const crows = [0, 1, 2, 3, 4].map(() => { const b = R.bird({ c: '#3a3040', belly: '#5a4a5a', s: 1.6 }); scene.add(b); return b; });
  YT.forEach(([x, z]) => { const s = C.steam({ r: .4, rise: 2.2, n: 7, c: '#ffe8d8', a: .45 }); s.position.set(x, 1.3, z); scene.add(s); });
  const follow = new THREE.PointLight('#ffb468', 8, 9, 1.4); scene.add(follow);

  // ---- 市場の人（TL.person。主人公と同じ 4.5 頭身の作り）。役で服を変える ----
  const folk = (o, x, z, ry, d) => { const p = TL.person(o); p.position.set(x, 0, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const side = x => (x > 0 ? -PI / 2 : PI / 2);
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#c2453a', hair: 'center', head: { hair: '#5a2a2a', skin: '#e8b890', eye: '#8a4a6a', mouth: 'smile', blush: true }, colors: { tunic: '#6a4a6a', apron: '#f0e8d8' } }, -3.0, -4, side(-1),
    { name: '団子屋のおかみさん', lines: [['いらっしゃい！ 焼きたての 団子だよ。', 'たれは 三代 つぎたしてるんだ。'], ['上の都市の人も、こっそり 買いに来るのさ。', 'あっちの お菓子は きれいだけど、味が うすいって。']] });
  folk({ size: 'tall', outfit: 'apron', hat: 'kerchief', hatC: '#2f7a8a', hair: 'wolf', bulk: 1.1, head: { hair: '#3a2a24', skin: '#c8906a', eyes: 'small', brow: 'thick', mouth: 'open', beard: 'mustache' }, colors: { tunic: '#8a5a3a', apron: '#e8e0cc' } }, 3.05, -12, side(1),
    { name: '焼き魚の おやじ', lines: [['へい らっしゃい！ 今朝 とれた 川魚だ。', '……川？ 下層の 下にも 川が あるのさ。'], 'けむりが 目にしみる？ それが うまさの あかしよ。'] });
  folk({ size: 'normal', outfit: 'apron', hat: 'straw', hair: 'swept', head: { hair: '#c8843a', skin: '#f0c8a0', eye: '#4a6a9a', mouth: 'smile', blush: true }, colors: { tunic: '#3f7a6a', apron: '#f4ecdc' } }, -3.0, -21, side(-1),
    { name: 'くだもの売りの娘', lines: [['もも、りんご、それから 上から落ちてきた ふしぎな実！', '……最後のは 売りものじゃ ないよ。'], ['あの台の 穴から、夕方だけ 光が さすの。', 'その時間が いちばん 売れるんだ。']] });
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#5a6a8a', hair: 'wolf', bulk: 1.12, head: { hair: '#6a4a2a', skin: '#a8704a', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#d8ccb0', pants: '#5a4a3a', scarf: '#b05a4a' } }, 0, 0, 0,
    { name: '荷運びの男', path: loop([[-1.6, 16], [-1.4, -70], [1.4, -70], [1.6, 16]]), speed: 1.2, u: .2, lines: [['どいた どいた！ ……おっと、すまん。', 'この荷は 上の都市への 貨物エレベーター行きさ。'], '通りの奥の わたり橋に のぼると、上の都市が よく見えるぞ。'] });
  folk({ size: 'child', outfit: 'traveler', hat: 'cap', hatC: '#c8402e', hair: 'wolf', head: { hair: '#2a2a34', eye: '#3a7a5a', mouth: 'open', blush: true }, colors: { tunic: '#c8a04a', vest: '#6a4a3a', pants: '#3a4a7a', scarf: '#4f8f88' } }, 0, 0, 0,
    { name: '走り回る子', path: loop([[1.2, 4], [-1.3, 0], [1.1, -6], [-1.2, -11], [-.2, -15], [1.4, -9], [-.8, -2]]), speed: 3.2, lines: [['ねえねえ、カラス 見た？', 'あいつら、台の裏に 巣を 作ってるんだよ！'], 'わたり橋の上から 手を ふると、上の人が ふりかえして くれるかも！'] });
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'center', head: { hair: '#3a2e2a', skin: '#e0b088', eye: '#5a5a7a', brow: 'angry', mouth: 'line' }, colors: { metal: '#8a8aa0', tunic: '#5a3a4a' } }, 0, 0, 0,
    { name: '市場の見回り', path: loop([[.8, 12], [.6, -62], [-.6, -62], [-.8, 12]]), speed: 1, u: .6, lines: [['市場では スリに 気をつけろ。', '夕方は 人が 多いからな。'], ['あの柱の 一本一本に、上の都市の 重さが のっている。', '……考えると ねむれなくなるぞ。']] });
  folk({ size: 'normal', outfit: 'robe', hat: 'hood', hatC: '#4a3a5a', hair: 'center', head: { hair: '#8a8a8a', skin: '#e8c0a0', eyes: 'small', eye: '#8a5aa8', mouth: 'smile' }, colors: { tunic: '#5a4a6a', trim: '#e8c060' } }, -2.75, -33.4, PI / 2 + .4,
    { name: 'うらない師', lines: [['あなたの 行く先…… 見えますよ。', 'たくさんの 世界を めぐる すがたが。'], ['くじらの 空を泳ぐ町、星の降る 草原……', 'ふふ、当たっても はずれても お代は いりません。']] });
  folk({ size: 'small', outfit: 'traveler', hold: 'staff', hair: 'center', head: { hair: '#e8e8e8', skin: '#d8a878', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#6a5a4a', vest: '#4a3a3a', pants: '#4a4a5a', scarf: '#b05a4a' } }, 2.6, 7.2, -PI / 2 - .5,
    { name: '年よりの なんでも屋', lines: [['わしが 若いころ、あの台は まだ 半分しか なかった。', '空が 広かったのう。'], ['今は 穴から のぞく 空が 宝物じゃ。', 'それも わるくない。']] });
  folk({ size: 'normal', outfit: 'traveler', hat: 'beret', hatC: '#3f5a7a', hair: 'swept', head: { hair: '#3a2420', skin: '#f0c49c', eye: '#3a7ac8', mouth: 'open' }, colors: { tunic: '#c8a04a', vest: '#3f5a7a', pants: '#4a3a44', scarf: '#d8402e' } }, -1.2, BZ, PI,
    { name: '見上げる旅人', lines: [['ここからだと、上の都市の 塔が 金色に 光って見える。', 'いつか あそこへ 行ってみたい。'], ['上へ行く 貨物エレベーターが あるらしい。', '荷物に まぎれれば……なんてね。']] }).o.position.y = BY;
  // ねこ（通りを とことこ歩く）
  const cat = R.cat({ c: '#e8a050', belly: '#f4ecd8' }); scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, path: loop([[-2.9, 18], [-2.9, -60], [-2.4, -60], [-2.4, 18]]), speed: .7, lines: ['にゃあ。', '（魚のにおいの ほうを、じっと 見ている）', 'にゃ？'], idle: t => R.catPose(cat, 'walk', t * 8) });

  // ---- 行き交う人ごみ（話さない。主人公と同じ作りの人） ----
  const TOPS = ['#5a6a8a', '#8a5a3a', '#3f7a6a', '#a8743a', '#6a4a6a', '#7a7a5a', '#b05a4a'], HAIR = ['#2a2a34', '#6a3a2a', '#8a6a4a', '#b8b4b0', '#3a2a24'], HS = ['swept', 'center', 'wolf'];
  const crowd = [...Array(14)].map((_, i) => { const p = TL.person({ size: i % 6 === 5 ? 'child' : i % 4 === 3 ? 'tall' : 'normal', hair: HS[i % 3], hat: [undefined, 'cap', undefined, 'kerchief', 'beret', undefined, 'straw'][i % 7], outfit: ['traveler', 'worker', 'apron', 'traveler', 'robe'][i % 5],
      head: { hair: HAIR[i % 5], skin: ['#e8b890', '#c8906a', '#f0c8a0', '#a8704a'][i % 4], mouth: ['smile', 'line', 'open'][i % 3] }, colors: { tunic: TOPS[i % 7], vest: TOPS[(i + 3) % 7], pants: ['#4a4a5a', '#5a4a3a', '#3a4a5a'][i % 3], scarf: TOPS[(i + 2) % 7], linen: '#e8dcc0' } }); scene.add(p);
    return { p, lane: (hash(i, 1) - .5) * 4.2, dir: i % 3 ? 1 : -1, sp: .8 + hash(i, 2) * .5, ph: hash(i, 3) * 120, kid: i % 6 === 5 }; });

  // ---- しらべられる物 ----
  G.sign(0, BY + 1.2, BZ - .3, { name: 'わたり橋からの ながめ', lines: [['頭の上の 鉄の台が、ここで ぷつりと切れている。', 'その先に、夕日をあびた 白い塔の都市が うかぶ。']] });
  G.sign(-3.05, 1.4, 1.2, { name: 'はり紙', lines: [['「上層 見学ツアー 中止のおしらせ」', 'その下に だれかが 小さく「またね」と 書いている。']] });
  G.sign(0, .3, -12, { name: '台の穴からの光', lines: [['頭の上の 台の 穴から、夕日の すじが 落ちてくる。', 'その光の中だけ、ほこりが 金色に 光っている。']] });
  G.sign(0, 1, -76.6, { name: 'トタンのさく', lines: [['「この先 工事中」', 'すき間から、さらに 暗い 下の町が 見える。']] });

  // ---- はじめの場所と、自動で歩く道 ----
  // 見上げる構図：カメラの見る点を少し上げる（主人公は画面の下へ、上の都市が画面に入る）
  G.camera({ lookUp: 1.0 });
  G.spawn(.4, 14, PI);
  G.tour([[.4, 8], [-1.2, -8], [1.2, -24], [1.3, -36], [2.72, -38.4], [2.72, BZ], [-2.6, BZ], [-2.72, BZ - 4.6], [-.4, -58], [.2, -70], [-1.5, -50], [-1, -30], [0, -4], [.4, 14]]);

  // ---- 毎コマ：人ごみ・カラス・ゴンドラ・ネオン。見上げる構図は G.camera の lookUp で ----
  G.tick((t, dt, P) => {
    follow.position.set(P.x, P.y + 2.8, P.z + 1);
    crowd.forEach((c, i) => { const p = c.p, sp = c.sp * (c.kid ? 1.8 : 1), u = ((t * sp + c.ph) % 92), zz = c.dir > 0 ? 18 - u : -74 + u; let lx = c.lane; if (Math.abs(zz - P.z) < 2.5 && Math.abs(lx - P.x) < .9) lx += lx > P.x ? .9 : -.9;
      p.position.set(lx, 0, zz); p.rotation.y = c.dir > 0 ? PI : 0; R.walk(p, t * sp * 4.4 + i, c.kid ? 1.2 : .8); });
    crows.forEach((b, i) => { const a = t * .25 + i * 1.3; b.position.set(Math.sin(a) * 26 + (i - 2) * 6, SY - 6 - i * 1.4 + Math.sin(a * 2) * 1.5, EDGE - 10 + Math.cos(a) * 14); b.rotation.y = a + PI / 2; R.birdPose(b, 'fly', t * 3 + i); });
    for (let k = 0; k < 2; k++) { const u = ((t * .03 + k * .5) % 1); gond.userData.set(k, 60 - 30 * u, 140 * u, -150 - 270 * u); }
    C.update(t, G.cam); });
});
