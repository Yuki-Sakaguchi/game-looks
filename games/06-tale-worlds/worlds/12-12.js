// ワールド 12-12「大樹の根もとの村」。もとは game-looks-12/12-world-tree-village.html（見るだけの場面）。
// 真昼。雲までとどく巨大な木の根もとに村。地をはう太い根が道の上でアーチになり、根のあいだに まるい屋根の家、幹にはりついた家どうしを つり橋がむすぶ。葉のすきまから光のすじ。
// ゲームにするために足した物：家・根・幹の当たり判定、根のアーチの上を歩ける足場（手前のアーチは左の根もとから、奥のアーチは木箱をふみ台に）、
// 奥のアーチのてっぺんから 幹の家（まん中の床）へ わたる つり橋（もとは道の上で切れていた橋を、アーチにつないだ）、村をかこむ木の柵、
// 話せる村の人 8 人、しらべられる物 4 つ、木箱・たる・花。
TALE_WORLD('12-12', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), FW = PACK_FWILD(THREE, K, R), PK = PACK_RUINS(THREE, K, R), RM = PACK_REALM1(THREE, K, R, F), { hash } = K, PI = Math.PI;
  scene.add(R.skyDome([[0, '#2e6ac0'], [.5, '#5a9ae0'], [.85, '#a8d4f0'], [1, '#e8f0e0']], { r: 650 })); scene.fog = new THREE.Fog('#c8e0d8', 120, 900);
  K.lights(scene, G.renderer, { sky: 0xd8f0ff, ground: 0x8aa868, amb: 1.6, sun: 0xfff4d8, power: 2.5, range: 40, pos: [28, 68, 32] });

  // ---- 地面：草地に土の道（大樹へまっすぐ）。大樹のまわりは こけ ----
  const TR0 = 34;
  const H = (x, z) => { const d = Math.hypot(x, z); return Math.sin(x * .05) * Math.cos(z * .04) * 1.2 + Math.max(0, TR0 + 20 - d) * .06; };
  const land = R.ground({ w: 260, d: 280, cell: 2, cz: 60, H, layers: [T.grass({ c: '#5a9a4a', flowers: .25, fc: ['#f8f0d8', '#f4d050', '#f0a0b0'] }), T.dirt({ c: '#a8845a', pebbles: .5 }), PK.tex.moss({ flowers: .2 })],
    mix: (x, z) => [Math.abs(x + Math.sin(z * .05) * 2) < 2.2 && z > TR0 - 4 ? 1 : 0, Math.hypot(x, z) < TR0 + 14 ? 1 : 0] });
  scene.add(land.mesh); G.ground(H); G.bounds(-40, 40, 24, 118);
  const fixed = [], put = (o, x, z, ry = 0, y = H(x, z), kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  // 根や枝の管にそって、乗れる円柱をならべる（上を歩ける。下は くぐれる）。pts は FW.tube と同じ [x, y, z, 半径]（点のあいだは まっすぐ）
  const walkTube = pts => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / .3));
    for (let s = 0; s < n; s++) { const q = s / n, x = a[0] + (b[0] - a[0]) * q, y = a[1] + (b[1] - a[1]) * q, z = a[2] + (b[2] - a[2]) * q, r = a[3] + (b[3] - a[3]) * q; if (y + r * .95 < H(x, z) + .05) continue; G.circle(x, z, r * .6, y - r, y + r * .95); } } };

  // ---- 大樹：根もとが広がる幹、空へ のびる枝、空をおおう葉むら ----
  const BARK = T.bark({ c: '#86644a' }), BARK2 = T.bark({ c: '#7a5a44', seed: 3 }), LEAF = T.leaves({ c: '#4a8a4a', flowers: .05, fc: ['#f8f0c8'] }), LEAF2 = T.leaves({ c: '#5a9a52', seed: 2 });
  const arches = [];
  { const B = R.parts(), Bk = B.g(BARK).smooth(1), sec = FW.blobSec(16, 4, .14), ring = (y, r, v, c) => [y, r, r, v, c];
    Bk.loft(sec, [ring(-2, TR0 * 1.25, 0, .7), ring(8, TR0, 3, .8), ring(30, TR0 * .78, 10, .9), ring(90, TR0 * .66, 30, 1), ring(170, TR0 * .56, 56, 1.05), ring(240, TR0 * .4, 80, 1.1), ring(290, 4, 96, 1.1)], { ur: 64 });
    const Bt = B.g(BARK2).smooth(2);
    for (let k = 0; k < 9; k++) { const a = k / 9 * 2 * PI + .3, y0 = 140 + hash(k, 1) * 80, L = 90 + hash(k, 2) * 60, r0 = 7 + hash(k, 3) * 4, pts = []; for (let s = 0; s <= 4; s++) { const q = s / 4, rr = TR0 * .55 + L * q; pts.push([Math.cos(a) * rr, y0 + L * (q * .35 + q * q * .25), Math.sin(a) * rr, r0 * (1 - q * .8)]); } FW.tube(Bt, pts, 7, { m: 4, ur: 8 }); }
    // 根：幹から放射に地をはう根と、道の上をまたぐ根のアーチ（どちらも上を歩ける）
    for (let k = 0; k < 11; k++) { const a = k / 11 * 2 * PI + .15; if (Math.abs(((a - PI / 2 + PI) % (2 * PI)) - PI) < .25) continue; const L = 60 + hash(k, 5) * 40, r0 = 4.5 + hash(k, 6) * 2, pts = []; for (let s = 0; s <= 5; s++) { const q = s / 5, rr = TR0 * .8 + L * q, bend = Math.sin(q * 3 + k) * .08; pts.push([Math.cos(a + bend) * rr, 10 * (1 - q) ** 1.6 + Math.sin(q * PI) * 3 - 1.5, Math.sin(a + bend) * rr, r0 * (1 - q * .75)]); } FW.tube(Bk, pts, 8, { m: 3, ur: 8, c: i => .8 + i * .03 }); walkTube(pts); }
    for (const [z, sp, h, r] of [[84, 26, 15, 2.4], [56, 36, 21, 3]]) { const pts = []; for (let s = 0; s <= 8; s++) { const q = s / 8, x = (q - .5) * sp * 2; pts.push([x, Math.sin(q * PI) * h - 2 + Math.sin(q * 7) * .6, z + Math.sin(q * PI * 2) * 3, r * (1.25 - Math.sin(q * PI) * .4)]); } FW.tube(Bk, pts, 8, { m: 3, ur: 6 }); walkTube(pts); arches.push(pts); }
    fixed.push(B.group());
    const Lf = R.parts();
    for (let k = 0; k < 16; k++) { const a = k / 16 * 2 * PI + hash(k, 7), rr = 40 + hash(k, 8) * 110, y = 200 + hash(k, 9) * 90 + rr * .2, s = 46 + hash(k, 10) * 34, sec = FW.blobSec(10, k, .2);
      Lf.g(k % 3 ? LEAF : LEAF2).smooth(10 + k).at(R.TR(Math.cos(a) * rr, y, Math.sin(a) * rr, a)).loft(sec, [[-s * .45, .05, .05, 0, .5], [-s * .35, s * .65, s * .6, .3, .55], [0, s, s * .9, 1, .8], [s * .3, s * .8, s * .75, 1.6, 1], [s * .5, .05, .05, 2, 1.05]], { ur: 4 }).at(null); }
    scene.add(Lf.group()); }
  // 幹の当たり：根もとの広がり（上は乗れるが、のぼる道はない）と、上のほう
  G.circle(0, 0, TR0 * 1.17, -9, 8); G.circle(0, 0, TR0 * .75, 8, 400);

  // ---- 村：根のあいだの まるい屋根の家、幹にはりつく家、つり橋、旗 ----
  const WALL = [T.plaster({ c: '#f0e4c8', frame: 'cross', wood: '#6a4a34' }), T.boards({ c: '#b08a5a' }), T.plaster({ c: '#e8dcc0', seed: 3 })], ROOF = [T.thatch({ c: '#d88a3a' }), T.shingle({ c: '#c8683a' }), T.thatch({ c: '#c8a050', seed: 2 })], smokeAt = [];
  const house = (x, z, i, s = 1, y) => { const r = (1.9 + hash(i, 1) * .7) * s, hs = RM.roundHouse({ r, h: 2.3 + hash(i, 2) * .8, wall: WALL[i % 3], roof: ROOF[i % 3], chimney: i % 2 === 0, lit: .2, bell: .8 }); put(hs, x, z, Math.atan2(-x, -z) + PI + (hash(i, 3) - .5) * .5, y, 'none');
    const y0 = y ?? H(x, z); G.circle(x, z, r + .15, y0 - 1, y0 + 6.5);
    if (hs.userData.smoke) { const v = hs.userData.smoke.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), hs.rotation.y); smokeAt.push([x + v.x, hs.position.y + v.y, z + v.z]); } return hs; };
  [[-9, 104], [8.5, 98], [-11, 84], [10, 80], [-8, 64], [9, 58], [-22, 92], [22, 70], [-20, 60], [18, 110], [-26, 112], [28, 92]].forEach(([x, z], i) => house(x, z, i));
  const decks = [];
  for (let k = 0; k < 7; k++) { const a = PI / 2 + (k - 3) * .3, y = 22 + (k % 3) * 13 + hash(k, 4) * 5, rr = TR0 * .78 + 4.4, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    const Gd = R.geo(); Gd.loft(10, [[-.5, 5.6, 5.6, 0, .8], [0, 5.6, 5.6, .3, 1]], { cap: 'top', ur: 6 }); put(Gd.mesh(T.planks({ c: '#9a7448' })), x, z, 0, y, 'none'); G.circle(x, z, 5.6, y - .5, y);
    const Gs = R.geo(); for (const s of [-1, 1]) FW.tube(Gs, [[x + Math.cos(a + s * .5) * 4.5, y - .4, z + Math.sin(a + s * .5) * 4.5, .3], [Math.cos(a) * TR0 * .76, y - 7, Math.sin(a) * TR0 * .76, .35]], 4, {}); fixed.push(Gs.mesh(T.planks({ c: '#6a4a34' })));
    house(x, z, k + 20, 1.25, y); decks.push([x, y, z]); }
  for (let k = 0; k < decks.length - 1; k++) { const a = decks[k], b = decks[k + 1]; put(F.ropeBridge({ from: [a[0], a[1], a[2]], to: [b[0], b[1], b[2]], w: 1.1, sag: 1.6 }), 0, 0, 0, 0, 'none'); }
  // 奥のアーチのてっぺん → まん中の幹の家（decks[3]）のつり橋。上を歩ける（両がわの綱は かべ）
  { const D = decks[3], top = arches[1][4], end = [top[0], top[1] + top[3] * .95, top[2] - 1.2], br = F.ropeBridge({ from: [D[0], D[1], D[2]], to: end, w: 1.3, sag: 1.2 }); put(br, 0, 0, 0, 0, 'none');
    const at = br.userData.at, n = 40, k0 = 5.2 / Math.hypot(end[0] - D[0], end[2] - D[2]);
    for (let i = 0; i < n; i++) { const k1 = k0 + (1 - k0) * i / n, k2 = k0 + (1 - k0) * (i + 1) / n, p = at(k1), q = at(k2), mx = (p[0] + q[0]) / 2, mz = (p[2] + q[2]) / 2, dx = q[0] - p[0], dz = q[2] - p[2], L = Math.hypot(dx, dz), ry = Math.atan2(dx, dz), top2 = Math.max(p[1], q[1]);
      G.box(mx, mz, 1.3, L + .05, top2 - .4, top2, ry); for (const s of [-1, 1]) G.box(mx + Math.cos(ry) * s * .72, mz - Math.sin(ry) * s * .72, .12, L + .05, top2, top2 + 1.3, ry, true); }
    // 幹の家の床のふち（つり橋の口だけ あける）
    for (let j = 0; j < 18; j++) { const a = j / 18 * 2 * PI, cx = D[0] + Math.cos(a) * 5.5, cz = D[2] + Math.sin(a) * 5.5; if (Math.abs(Math.atan2(Math.sin(a - PI / 2), Math.cos(a - PI / 2))) < .3) continue; G.box(cx, cz, 2, .2, D[1], D[1] + 1.2, PI / 2 - a, true); }
    put(R.fence({ len: 3, kind: 'rail', h: .9, c: '#6a4a34' }), D[0] - 3.4, D[2] + 4.3, .7, D[1], 'none'); put(R.fence({ len: 3, kind: 'rail', h: .9, c: '#6a4a34' }), D[0] + 3.4, D[2] + 4.3, -.7, D[1], 'none');
    G.sign(D[0] + 1.6, D[1] + .5, D[2] + 4.2, { name: '幹の家の 床', lines: [['見おろすと、村の 屋根が 木の実のように 小さい。', '上を見ると、葉の天井が 空を かくしている。']] }); }
  for (const [x, z, c] of [[-4, 90, '#e8843a'], [4, 76, '#f0e4c8'], [-4, 62, '#e8843a'], [4, 104, '#f0e4c8']]) put(F.flag({ kind: 'banner', w: .8, h: 2.2, pole: 4.4, c, c2: '#4a8a4a', crest: 'tree', cc: '#4a7a3a' }), x, z, 0, undefined, 'trunk', { r: .12 });
  for (const [x, z] of [[-3.2, 98], [3.2, 86], [-3.2, 70], [3.2, 56]]) put(R.lamp({ h: 2.6, c: '#4a3a30' }), x, z, 0, undefined, 'trunk', { r: .16 });
  for (let i = 0; i < 40; i++) { const a = hash(i, 1) * 2 * PI, rr = TR0 + 10 + hash(i, 2) * 90, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (Math.abs(x) < 30 && z > 40) continue; if (i % 4) put(R.tree({ kind: i % 3 ? 'round' : 'tall', h: 6 + hash(i, 3) * 5, c: '#4a8a4a', seed: i }), x, z, i, undefined, 'trunk'); else put(R.rock({ s: 1.2 + hash(i, 4), moss: .6, seed: i }), x, z, i, undefined, 'round', { pad: .7 }); }
  for (let i = 0; i < 50; i++) { const x = (hash(i, 6) - .5) * 60, z = 50 + hash(i, 7) * 70; if (Math.abs(x) < 3) continue; put(R.tuft({ kind: ['grass', 'flower', 'bush'][i % 3], s: .7 + hash(i, 8) * .4, seed: i % 3 }), x, z, i, undefined, 'none'); }
  for (let i = 0; i < 6; i++) put(R.barrel({ c: '#7a5a3a' }), (i % 2 ? 1 : -1) * (3.6 + hash(i, 1)), 60 + i * 8, 0, undefined, 'round');
  // 足した：村をかこむ木の柵（左右と うしろ）
  { const fen = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / 4); for (let k = 0; k < n; k++) { const q = (k + .5) / n, x = x0 + (x1 - x0) * q, z = z0 + (z1 - z0) * q; put(R.fence({ len: L / n, kind: 'rail', h: 1, c: '#7a5a3a' }), x, z, -Math.atan2(z1 - z0, x1 - x0), H(x, z) - .05, 'none'); } };
    fen(-40.6, 24, -40.6, 118.6); fen(40.6, 24, 40.6, 118.6); fen(-40.6, 24, -31.4, 24); fen(31.4, 24, 40.6, 24); fen(-40.6, 118.6, -2.4, 118.6); fen(2.4, 118.6, 40.6, 118.6);
    for (const sx of [-1, 1]) put(F.flag({ kind: 'banner', w: .7, h: 1.8, pole: 3.4, c: '#e8843a', c2: '#4a8a4a', crest: 'tree', cc: '#4a7a3a' }), sx * 2.6, 118.6, 0, undefined, 'trunk', { r: .12 });
    G.box(0, 119.4, 5, .4, -9, 9, 0, true); }
  // 足した：奥のアーチの左の根もとに、ふみ台の木箱
  { const [fx0, , fz0] = arches[1][0]; put(R.crate({ s: .8 }), fx0 - 2.8, fz0 + .4, .3); put(R.crate({ s: .7, kind: 'x' }), fx0 - 3.7, fz0 + 1.2, .9);
    G.sign(fx0 - 3.2, H(fx0 - 3, fz0) + .8, fz0 - .6, { name: '根のアーチ', lines: [['大きな根が、道の上を にじのように またいでいる。', '木箱を ふみ台にすれば、上に のぼれそうだ。']] }); }
  for (const [x, z] of [[-5.4, 100.6], [5.6, 94], [-5.6, 72.6], [12.6, 62]]) { put(R.barrel({ h: .5, r: .34, c: '#9a6a44' }), x, z, 0, undefined, 'round'); put(R.tree({ kind: 'bush', h: .7, flowers: .8, fc: ['#f0a0b0', '#f4d050', '#ffffff'], seed: x }), x, z, 0, H(x, z) + .45, 'none'); }
  put(R.well(), 4.6, 66.4, .3, undefined, 'round', { pad: .85 });
  scene.add(R.merge(fixed));
  for (let k = 0; k < 10; k++) { const c = R.cloud({ s: 70 + hash(k, 9) * 60, c: '#ffffff', shade: '#b8d0e8', seed: k }), a = hash(k, 3) * 2 * PI; c.position.set(Math.cos(a) * 560, 120 + hash(k, 8) * 140, Math.sin(a) * 560); c.lookAt(0, 150, 0); scene.add(c); }
  scene.add(R.backdrop({ c: '#5a8a8a', haze: '#c8e0d8', r: 700, h: 70, y: -2, rep: 3 }));

  // ---- 光のすじ・光の粒・鳥 ----
  const shafts = [[-14, 80, 7], [10, 66, 6], [-2, 50, 9], [16, 96, 5]].map(([x, z, w], i) => { const sh = PK.shaft({ w: w * 1.5, h: 120, dx: 30, dz: 40, a: .22, c: '#fff4c8', seed: i }); sh.position.set(x, H(x, z), z); scene.add(sh); return sh; });
  const motes = PK.motes({ n: 40, area: [20, 8, 40], c: '#fff8d0', size: 1, a: .6 }); motes.position.set(0, 1, 80); scene.add(motes);
  const flock = PK.flock({ n: 9, r: 26, h: 8, c: '#f4f0e8', s: 2.2, speed: .25 }); flock.position.set(0, 60, 30); scene.add(flock);

  // ---- しらべられる物 ----
  G.sign(0, H(0, 45) + 1.2, 44.4, { name: '大樹の幹', head: 1, lines: [['見あげても、てっぺんは 葉に かくれて 見えない。', '木の皮の みぞだけで、人が 歩けそうなほど 深い。'], ['手を あてると、ずっと おくで 水の流れる音がする。']] });
  G.sign(-.2, H(0, 116) + 1.2, 117.6, { name: '村の門', lines: [['「大樹の根もとの村 ─ 木を きずつけないこと」', '門の外は、ずっと 森が つづいている。']] });
  G.sign(4.6, H(4.6, 66.4) + .8, 67.6, { name: '井戸', lines: [['大樹の根が すいあげた 水が、ここに わいている。', 'あまくて、すこし 木の かおりがする。']] });

  // ---- 村の人（TL.person。主人公と同じ 4.5 頭身の作り） ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y) => { const p = TL.person(o); p.position.set(x, y ?? H(x, z), z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const lane = (x, z0, z1) => new THREE.CatmullRomCurve3([[x, z0], [x, z1], [x + .7, z1], [x + .7, z0]].map(([a, b]) => new THREE.Vector3(a, 0, b)), true, 'centripetal');
  folk({ size: 'small', outfit: 'robe', hold: 'staff', hair: 'center', head: { hair: '#e8e8e8', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#6a8a4a', trim: '#e8dcc0' } }, -4.6, 88.6, .9,
    { name: '大樹の長老', lines: [['ようこそ、大樹の根もとの村へ。', 'この木は、世界が できたころから 立っておる。'], ['大樹の葉は、雨を ためて 村に くばってくれる。', 'わしらは そのお礼に、根の まわりを そうじするのじゃ。'], ['霧の上の 城下町からも、飛空艇で 葉を もらいに 来る者がおる。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#e8843a', hair: 'center', head: { hair: '#d8b060', eye: '#4a7a4a', mouth: 'smile', blush: true }, colors: { tunic: '#e8843a', apron: '#f4ecd8' } }, 0, 0, 0,
    { name: '木の実あつめの むすめ', path: lane(-1.6, 58, 110), speed: .9, lines: [['大樹の 木の実は、ひとつで 三日 おなかが いっぱいに なるの。', 'でも、なかなか 落ちてこないのよ。'], '幹の家に 住んでる おばあさんは、木の実の パイが 上手なの。'] });
  folk({ size: 'child', hair: 'wolf', head: { hair: '#3a2a20', eye: '#5a4a2a', mouth: 'open' }, colors: C('#f0d060', '#4a6a8a', '#4a6a8a', '#e8843a') }, 0, 0, 0,
    { name: '根っこの上の子', path: new THREE.CatmullRomCurve3([[-16, 70], [-10, 74], [-14, 78], [-19, 74]].map(([a, b]) => new THREE.Vector3(a, 0, b)), true, 'centripetal'), speed: 2.6, lines: [['手前の 根のアーチは、左の はしから 歩いて のぼれるよ！', 'てっぺんで 下を見ると、足が すくむんだ。'], ['奥の 大きな アーチの上から、幹の家まで つり橋が あるんだって。']] });
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#4a8a4a', hair: 'wolf', bulk: 1.1, head: { hair: '#5a4a3a', skin: '#c8885a', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#f0e4cc', pants: '#4a5a4a', scarf: '#8a6a4a' } }, 0, 0, 0,
    { name: '荷運びの おじさん', path: lane(1.2, 62, 114), speed: 1.1, u: .5, lines: [['落ちた枝を ひろって、まきに するんだ。', '大樹の枝は 一本で 冬じゅう もつ。'], ['ブリキの おもちゃの町へ、まきを 売りに 行ったことがある。', 'ねじで 動く 汽車に のせてもらったよ。']] });
  folk({ size: 'normal', outfit: 'robe', hat: 'hood', hatC: '#4a7a3a', hair: 'swept', head: { hair: '#4a3a2a', eye: '#4a7a4a', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#4a7a3a', trim: '#e8dcc0' } }, -15.4, 89, -1.2,
    { name: '薬草つみの 人', lines: [['根の かげには、めずらしい 薬草が はえるんだ。', '光のすじが あたる所にしか 生えない 花もある。'], ['葉のすきまから おりる 光は、正午が いちばん 太いよ。']] });
  folk({ size: 'tall', hat: 'straw', hair: 'swept', head: { hair: '#c8843a', eye: '#3a6a9a', mouth: 'smile' }, colors: C('#3a7aa8', '#6a4a34', '#5a4a3a', '#f4ece0') }, 6, 108.6, PI * .9,
    { name: '旅の 地図かき', lines: [['世界じゅうの 地図を かいているんだ。', 'でも、この木の 高さだけは はかれない。'], ['空を泳ぐ くじらの 背中にも、小さな 町が あるそうだよ。', '地図に のせたいけど、くじらは じっとしてくれないからね。']] });
  folk({ size: 'small', outfit: 'apron', hat: 'kerchief', hatC: '#f0e4c8', hair: 'center', head: { hair: '#e0e0e0', eyes: 'small', mouth: 'smile', blush: true }, colors: { tunic: '#c8683a', apron: '#f4ecd8' } }, decks[3][0] - 2.8, decks[3][2] + 3.4, PI * .85,
    { name: '幹の家の おばあさん', lines: [['まあまあ、こんな 高い所まで よく来たね。', 'つり橋は こわくなかったかい？'], ['ここからは、村じゅうが 見わたせるのさ。', 'まいばん、木の実の パイを やいて みんなに くばるんだよ。']] }, decks[3][1]);
  folk({ size: 'normal', outfit: 'guard', hat: 'hood', hatC: '#5a6a4a', hold: 'spear', hair: 'center', head: { hair: '#3a2a20', eye: '#4a5a3a', brow: 'angry', mouth: 'line' }, colors: { tunic: '#5a6a4a', metal: '#8a8070', scarf: '#e8843a' } }, -2.4, 116.2, PI,
    { name: '門の 見はり', lines: [['村の門は、いつでも ひらいている。', 'でも、森の おくへは ひとりで 行かないことだ。'], ['森の 奥には、根が 迷路のように からまった 所がある。']] });

  // ---- はじめの場所：村の門から、大樹を見あげる ----
  G.spawn(0, 112, PI);
  G.tour([[.6, 98], [-.6, 86], [-1.6, 72], [-1, 62], [-12, 52], [-30, 57], [-30, 72], [-24, 80], [-6, 76], [.4, 92], [3, 108]]);
  const fx = K.fx(scene, 60); let sm = 0;
  G.tick((t, dt, P) => {
    flock.userData.tick(t); motes.userData.tick(t); shafts.forEach(s => s.userData.tick?.(t)); F.tick(t);
    if ((sm += dt) > .5) { sm = 0; for (const s of smokeAt) if (Math.hypot(s[0] - P.x, s[2] - P.z) < 60) fx.emit('smoke', s[0], s[1], s[2], { size: .5, life: 3.6, vy: .7, vx: .2, grow: 1.6, spread: .1, tint: '#f4f0e8' }); }
    fx.update(dt); });
});
