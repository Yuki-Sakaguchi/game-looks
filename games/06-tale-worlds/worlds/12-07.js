// ワールド 12-07「空を泳ぐくじらの町」。もとは game-looks-12/07-whale-sky-town.html（見るだけの場面）。
// 絵本の昼。雲の海の上を泳ぐ 長さ 140 m の青いくじら。その背中に草と石だたみの土がのり、かたむいた家・風車・木の小さな町がある。うしろで大きな尾が上下し、遠くにも くじらが 2 頭。
// ゲームにするために足した物：家・風車・木の当たり判定、背中のはしの柵、のぼれる木の見はり台、話せる町の人 8 人とねこ、しらべられる物 4 つ、屋台・井戸・ベンチ・たる。
// くじらの体は もとの場面と同じく その場で泳ぐ（尾とひれだけ動き、雲の海が うしろへ流れる）ので、背中の町は止まった足場のまま歩ける。
TALE_WORLD('12-07', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), B = PACK_BOOK2(THREE, K, R), { hash } = K, PI = Math.PI;
  G.cam.far = 1600; G.cam.updateProjectionMatrix();
  scene.add(R.skyDome([[0, '#2a9ac8'], [.45, '#5ac8c8'], [.8, '#c8ecc0'], [1, '#fff4b0']], { r: 1400 })); scene.fog = new THREE.Fog('#f0f0c8', 260, 1300);
  K.lights(scene, G.renderer, { sky: 0xd8f0ff, ground: 0xf0e8c8, amb: 1.45, sun: 0xfff4d8, power: 2.3, range: 40, pos: [28, 64, 40] });

  // ---- くじらの皮：上は藍に明るい点、横は ふじつぼ、腹はクリームのすじ（もとの場面のまま） ----
  const skin = (() => { const P = R.Px(128, 64), A = R.ramp('#3a5aa0', 6, { contrast: .8 }), W = R.ramp('#f4ecd8', 6, { contrast: .6 }), Bc = R.ramp('#c8c0b0');
    P.each((x, y) => { const u = x / 128, belly = Math.abs(u - .5) < .17, edge = Math.abs(Math.abs(u - .5) - .17) < .02; if (belly) return (x % 6 === 0) ? W[1] : (x % 6 === 1) ? W[4] : W[3]; if (edge) return A[1];
      const n = K.hash(x >> 2, y >> 2, 3); return n > .82 ? A[2] : u > .25 && u < .75 ? A[2 + (n > .4 ? 1 : 0)] : n < .15 ? A[4] : A[3]; });
    for (let k = 0; k < 60; k++) { const x = Math.floor(hash(k, 1) * 128), y = Math.floor(hash(k, 2) * 64), u = x / 128; if (Math.abs(u - .5) < .2) continue; const side = Math.abs(u - .5) < .3; if (side) P.bits(x, y, ['.bb.', 'bccb', '.bb.'], { b: Bc[2], c: Bc[4] }); else { P.set(x, y, A[5]); P.set(x + 1, y, A[4]); } }
    return T.from(P, { m: 1 }); })();
  const eyeT = (() => { const P = R.Px(16), W = '#f8f4e8', D = '#1a2040'; P.disc(8, 8, 7, '#2a3a70'); P.disc(8, 8, 5.6, W); P.disc(7.5, 8.5, 3.8, D); P.set(6, 7, '#ffffff'); P.set(7, 7, '#ffffff'); P.set(6, 6, '#ffffff'); for (let i = 2; i < 14; i++) P.set(i, 2 - Math.round(Math.sin(i / 13 * PI) * 1), '#1a2a58'); return T.from(P, { m: 1, cut: true }); })();

  // ---- くじら（体の輪：[尾からの z, 半はば, 半高さ, 中心の高さ]）。尾びれと胸びれは動く ----
  const PROF = [[0, 2.4, 2.8, 36], [8, 4, 4.5, 26], [22, 9, 9, 10], [46, 19, 14, 0], [72, 23, 16.5, 0], [98, 23, 16.5, -1], [118, 20, 15, -2], [130, 15, 12.5, -3], [138, 8, 8, -4], [141, 1, 1.5, -4]];
  const prof = z => { for (let i = 0; i < PROF.length - 1; i++) { const a = PROF[i], b = PROF[i + 1]; if (z <= b[0] || i === PROF.length - 2) { const k = Math.max(0, Math.min(1, (z - a[0]) / (b[0] - a[0]))), s = k * k * (3 - 2 * k) * .5 + k * .5; return [a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s, a[3] + (b[3] - a[3]) * s]; } } };
  const whale = (s = 1) => { const g = new THREE.Group(), S16 = Math.cos(PI / 16), Gm = R.geo().smooth(1);
    Gm.loft(16, PROF.map(([z, hw, hh, cy], i) => [z, hw / S16, hh / S16, z / 20, [.8, .85, .95, 1, 1, 1, 1, .95, .9, .85][i], 0, -cy]), { ur: 1, rot: .5 });
    const body = Gm.mesh(skin); body.geometry.rotateX(PI / 2); body.castShadow = s > .9; g.add(body);
    for (const sx of [-1, 1]) { const [hw, hh, cy] = prof(128), E = R.geo().normal([sx, 0, 0]); E.quad([sx * hw * .93, cy + hh * .05 - 1.6, 128 + 1.8 * sx], [sx * hw * .93, cy + hh * .05 - 1.6, 128 - 1.8 * sx], [sx * hw * .9, cy + hh * .05 + 1.6, 128 - 1.8 * sx], [sx * hw * .9, cy + hh * .05 + 1.6, 128 + 1.8 * sx]); const e = E.mesh(eyeT, { offset: true }); e.castShadow = false; g.add(e); }
    const fl = new THREE.Group(); fl.position.set(0, 36, 1); fl.scale.setScalar(1.35); g.add(fl);
    { const G2 = R.geo(), pts = [[0, 0], [5, -2.5], [12, -4.5], [20, -4], [17, -7.5], [11, -10.5], [5, -10], [0, -6.5]], th = .6;
      for (const sx of [-1, 1]) { const P = pts.map(([x, z]) => [x * sx, z]); for (let i = 1; i < P.length - 1; i++) for (const up of [1, -1]) { const a = [P[0][0], up * th, P[0][1]], b = [P[i][0], up * th * .3, P[i][1]], c = [P[i + 1][0], up * th * .3, P[i + 1][1]]; const U = q => [.04 + Math.abs(q[0]) / 19 * .16, -q[1] / 8]; (up * sx > 0) ? G2.tri(a, c, b, [.04, 0], U(P[i + 1]), U(P[i])) : G2.tri(a, b, c, [.04, 0], U(P[i]), U(P[i + 1])); } } fl.add(G2.mesh(skin, { side: true })); }
    const fins = [-1, 1].map(sx => { const p = new THREE.Group(), [hw, , cy] = prof(100); p.position.set(sx * hw * .92, cy - 4, 100); g.add(p); const G3 = R.geo(), L = 34;
      for (let i = 0; i < 6; i++) { const a = i / 6, b = (i + 1) / 6, wa = 5 * (1 - a * .6), wb = 5 * (1 - b * .6); G3.quad([sx * L * a, -L * a * .35, wa * .5], [sx * L * b, -L * b * .35, wb * .5], [sx * L * b, -L * b * .35, -wb * .5], [sx * L * a, -L * a * .35, -wa * .5], [.5 - .1, a * 2, .5 + .1, b * 2]); }
      p.add(G3.mesh(skin, { side: true })); return [p, sx]; });
    g.scale.setScalar(s); g.userData.tick = t => { fl.rotation.x = 1.05 + Math.sin(t * .55) * .22; fins.forEach(([p, sx]) => { p.rotation.z = sx * Math.sin(t * .55 + 1) * .16; p.rotation.y = -sx * .3; }); }; return g; };
  const big = whale(1); scene.add(big);

  // ---- 背中の町：くじらの背の形にそった土（草と石だたみ）。道は右のふちぞい ----
  const PX = z => 8.2 + Math.sin(z * .07) * .7;
  const topY = (x, z) => { const [hw, hh, cy] = prof(z); const S = Math.cos(PI / 16); return cy + hh / S * Math.sqrt(Math.max(0, 1 - (x * S / hw) ** 2)); };
  const H = (x, z) => topY(Math.max(-14, Math.min(14, x)), Math.max(44, Math.min(117, z))) + .08 - (Math.abs(x) > 13.5 || z < 45 || z > 116 ? .6 : 0);
  const land = R.ground({ w: 30, d: 74, cell: 1.5, cz: 80, H,
    layers: [T.grass({ c: '#6aa858', flowers: .25, fc: ['#ffffff', '#ffd860', '#f8a8c0'] }), T.cobble({ c: '#d8c8a8', kind: 'round' })], mix: (x, z) => [Math.abs(x - PX(z)) < 1.7 || (Math.abs(x + 3.2 + Math.sin(z * .05)) < 1.3) || (Math.abs(x) < .9 && z > 48 && z < 114) ? 1 : 0, 0] });
  scene.add(land.mesh); G.ground(H); G.bounds(-12.9, 12.0, 46.6, 115.2);

  const fixed = [], put = (o, x, z, ry = 0, y = topY(x, z) - .25, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  // ---- かたむいた家（もとの 16 けん）。当たり判定は かべの大きさの箱 ----
  const WALL = [T.plaster({ c: '#f4e4c0' }), T.plaster({ c: '#f8d0c0', seed: 2, frame: 'box', wood: '#8a5a3a' }), T.boards({ c: '#a8d0e0' }), T.plaster({ c: '#f8f0a8', seed: 4 })];
  const ROOF = [T.shingle({ c: '#d0483a' }), T.roof({ c: '#e8a040', kind: 'scale' }), T.shingle({ c: '#3a6ab0', seed: 2 }), T.roof({ c: '#c84a6a', kind: 'wave' })];
  [[2.5, 50], [-3.5, 54], [3, 60], [-2.5, 66], [2.8, 74], [-3.8, 78], [3.2, 86], [-2.8, 92], [2.6, 100], [-3.6, 104], [3, 112], [-9.5, 60], [-10, 72], [-9, 86], [-10.5, 98], [-9.5, 110]].forEach(([x, z], i) => {
    const h = 3.6 + hash(i, 1) * 3.4 + (Math.abs(x) > 9 ? 1.5 : 0), ln = (hash(i, 2) - .5) * 1.6, w = 3 + hash(i, 3) * 1.4, ry = x > 0 && x < 4 ? PI / 2 + (hash(i, 7) - .5) * .4 : x > 0 ? -PI / 2 : PI / 2;
    put(B.house({ w, d: 3.2, h, lean: ln, bulge: .1 + hash(i, 4) * .1, roofH: 2.6 + hash(i, 5) * 3, roofLean: -ln * 1.6 + (hash(i, 6) - .5), wall: WALL[i % 4], roof: ROOF[(i + 1) % 4], wins: 2, seed: i }), x, z, ry, undefined, 'none');
    G.box(x, z, w + .4, 3.6, 0, 80, ry, true); });
  put(F.windmill({ h: 7, stone: T.plaster({ c: '#f0e8d8' }), roof: '#3a6ab0', c: '#f8f0e0', speed: .8 }), -9.5, 50, PI / 2 + .3, undefined, 'none'); G.circle(-9.5, 50, 2.1, 0, 80);
  for (const [x, z, k] of [[5.6, 57, 0], [-6.4, 82, 1], [5.4, 80, 2], [-6.6, 104, 0], [5.8, 107, 1], [-6, 66, 2], [-12.4, 78, 0], [-12.4, 92, 2]]) put(R.tree({ kind: k === 2 ? 'pine' : 'round', h: 4 + hash(x, z) * 2, c: ['#4a9a4a', '#6aa848', '#3a8a5a'][k], flowers: k === 1 ? .4 : 0, fc: ['#ffffff'], seed: k }), x, z, x, undefined, 'trunk');
  for (const z of [58, 74, 90, 106]) put(R.lamp({ h: 3, c: '#3a4a6a' }), 5.6, z + 3, 0, undefined, 'trunk', { r: .16 });
  // 柵：右は もとの白い柵（その外は空）。左と前後にも同じ柵を足して、背中のはしが わかるように
  for (let z = 46; z < 116; z += 3.6) put(R.fence({ len: 3.6, kind: 'picket', h: .9, c: '#f4ecd8' }), 12.4, z + 1.8, PI / 2, topY(12.4, z + 1.8) - .1, 'none');
  for (let z = 46; z < 116; z += 3.6) put(R.fence({ len: 3.6, kind: 'picket', h: .9, c: '#f4ecd8' }), -13.3, z + 1.8, PI / 2, topY(-13.3, z + 1.8) - .1, 'none');
  for (let x = -13.3; x < 12.4; x += 3.6) for (const z of [46.1, 115.7]) { const len = Math.min(3.6, 12.4 - x); put(R.fence({ len, kind: 'picket', h: .9, c: '#f4ecd8' }), x + len / 2, z, 0, topY(x + len / 2, z) - .1, 'none'); }
  for (let i = 0; i < 34; i++) { const z = 48 + hash(i, 1) * 66, x = hash(i, 2) > .3 ? 10 + hash(i, 3) * 2 : -12 + hash(i, 3) * 6; put(R.tuft({ kind: i % 3 ? 'flower' : 'grass', s: .8, seed: i % 3 }), x, z, i, undefined, 'none'); }
  for (const z of [55, 101]) for (const sx of [-1, 1]) put(F.flag({ kind: 'pennant', pole: 4.5, w: 1.6, h: .8, c: sx > 0 ? '#d0483a' : '#f8f0a8', c2: '#3a6ab0' }), sx * 12.8, z, 0, undefined, 'none');
  scene.add(...[[63, 5], [88, 5.4]].map(([z, y]) => F.bunting({ from: [3, topY(3, z) + y, z], to: [12.4, topY(12.4, z) + y - 1, z + 1], n: 12, sag: 1, cs: ['#d0483a', '#f8f0a8', '#3a6ab0', '#e8a040'] })));

  // ---- 足した：くだもの屋台、井戸、ベンチ、たると木箱、花のはち ----
  put(R.stall({ c: '#d0483a', fc: ['#e8a040', '#f8d860', '#d0483a'] }), 5.5, 68, PI / 2);
  put(R.well(), -6, 95.5, .4, undefined, 'round', { pad: .85 });
  put(R.bench({ c: '#8a5a3a' }), 11.3, 84, PI / 2);
  put(R.bench({ c: '#8a5a3a' }), 11.3, 96, PI / 2);
  for (const [x, z, k] of [[6.9, 66.2, 0], [4.3, 70.6, 1], [-1.3, 58, 0], [1.1, 96.2, 1], [-7.6, 88.6, 2], [6.8, 112.6, 2], [-0.9, 106.5, 0]]) {
    if (k === 0) { put(R.barrel({ c: '#9a6a44' }), x, z, x, undefined, 'round'); put(R.barrel({ h: .7, r: .3, c: '#8a5a3a' }), x + .2, z + .75, z, undefined, 'round'); }
    if (k === 1) { put(R.crate({ s: .7 }), x, z, .4); put(R.crate({ s: .5, kind: 'x', c: '#a8885a' }), x, z, 1.1, topY(x, z) - .25 + .7, 'none'); }
    if (k === 2) { put(R.barrel({ h: .5, r: .34, c: '#c8945a' }), x, z, 0, undefined, 'round'); put(R.tree({ kind: 'bush', h: .7, flowers: .8, fc: ['#d0483a', '#f8d860', '#ffffff'], seed: x }), x, z, 0, topY(x, z) + .2, 'none'); } }

  // ---- 足した：木の見はり台（右のふち。階段で 2.4 m の床へ。柵のむこうの雲の海と、遠くのくじらが よく見える） ----
  const LX = 11.1, LZ = 67.6, LB = H(10.4, 68), LT = LB + 2.4;
  { const pl = T.planks({ c: '#9a6a44' }), G2 = R.geo();
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { G2.box(.16, 2.4, .16, sx * .82, -.4, sz * 1.82, { m: 2, top: false }); G.circle(LX + sx * .82, LZ + sz * 1.82, .14, LB - 1, LT - .25); }
    G2.box(1.9, .22, 4, 0, 2.18, 0, { m: 2 }); const me = G2.mesh(pl); me.position.set(LX, LB, LZ); fixed.push(me); G.box(LX, LZ, 1.9, 4, LT - .22, LT, 0);
    put(F.stairs({ w: 1.5, h: 2.4, d: 3, n: 6, tex: pl }), LX, LZ + 3.5, 0, LB, 'none');
    for (let k = 0; k < 6; k++) G.box(LX, LZ + 5 - (k + .5) * .5, 1.5, .5, LB - 2, LB + (k + 1) * .4, 0);
    put(R.fence({ len: 4, kind: 'rail', h: .8, c: '#8a5a3a' }), LX + .92, LZ, PI / 2, LT, 'none'); G.box(LX + 1, LZ, .14, 4, LT, LT + .9, 0);
    put(R.fence({ len: 1.9, kind: 'rail', h: .8, c: '#8a5a3a' }), LX, LZ - 2, 0, LT, 'none'); G.box(LX, LZ - 2.05, 1.9, .14, LT, LT + .9, 0);
    G.sign(LX + .6, LT + .2, LZ - .6, { name: '見はり台', lines: [['柵のむこうは、いちめんの 雲の海。', 'ずっと遠くを、べつの くじらが 泳いでいる。'], ['ここに立つと、くじらの 大きな息が 足から つたわってくる。']] }); }
  scene.add(R.merge(fixed));

  // ---- 雲の海（ずっと下。もこもこを ならべ、うしろへ流す）と、空の雲 ----
  const sea = R.ground({ w: 2400, d: 2400, cell: 40, cz: -400, H: () => -62, layers: [B.tex.puff({ c: '#fff0d8', m: 24 })] }); scene.add(sea.mesh);
  const seaPuffs = []; for (let r = 0; r < 24; r++) for (let c = 0; c < 18; c++) { const x = -800 + c * 95 + (r % 2) * 45 + hash(c, r % 4) * 30, z = -1300 + r * 70; if (Math.abs(x) < 60 && z > -20 && z < 170) continue; const p = B.puff({ s: 46 + hash(c, r % 4, 2) * 30, n: 3, c: (c + r) % 3 ? '#fff4e0' : '#f8e8d0', seed: (c + r % 4) % 7, flat: .2 }); p.position.set(x, -64, z); p.rotation.y = hash(c, r % 4, 3) * 6; seaPuffs.push(p); }
  const seaG = R.merge(seaPuffs); scene.add(seaG);
  const sky = []; for (let k = 0; k < 10; k++) { const p = B.puff({ s: 18 + hash(k, 1) * 16, n: 5, c: '#ffffff', seed: k }), a = -1.5 + hash(k, 2) * 3, r = 180 + hash(k, 3) * 300; p.position.set(Math.sin(a) * r, 10 + hash(k, 4) * 60, 60 - Math.cos(a) * r); scene.add(p); sky.push([p, p.position.z]); }
  // ---- 遠くを泳ぐ くじら（ゆっくり行き来する） ----
  const far = [[.7, 120, -4, -250, -.6], [.5, 300, 30, -480, -.35], [.4, -200, 30, -520, .3]].map(([s, x, y, z, ry]) => { const w = whale(s); w.position.set(x, y, z); w.rotation.y = ry; scene.add(w); return [w, x, y, z, ry, s]; });

  // ---- しらべられる物 ----
  G.sign(PX(113) + 1.4, topY(10, 113) + .8, 113.4, { name: '町の入口の札', lines: [['「くじらの背の町へ ようこそ」', '「くじらが ねがえりをうつ日は、外に出ないこと」']] });
  G.sign(-6, topY(-6, 95.5) + .8, 94.4, { name: '井戸', lines: [['のぞくと、ずっと下で 水が ゆれている。', 'くじらの 体の中の 水なのだろうか……'], ['つめたくて、すこし しょっぱい水だ。']] });
  G.sign(0, topY(0, 47) + .8, 47.2, { name: 'くじらの尾', lines: [['柵のむこうで、大きな尾が ゆっくり上下している。', '尾が 空をたたくたびに、町が すこし前へ進む。']] });

  // ---- 町の人（TL.person。主人公と同じ 4.5 頭身の作り） ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y) => { const p = TL.person(o); p.position.set(x, y ?? H(x, z), z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#3a6ab0', hair: 'center', head: { hair: '#8a4a2a', eye: '#4a6a9a', mouth: 'smile', blush: true }, colors: { tunic: '#3a6ab0', apron: '#f8f0e0' } }, 0, 0, 0,
    { name: 'かごを持った おかみさん', path: loop([[7.3, 52], [7.6, 80], [7.3, 110], [9.4, 110], [9.2, 80], [9.3, 52]]), speed: 1, lines: [['今日は 風が いいねえ。', 'せんたく物が すぐ かわくよ。'], ['くじらの背では、雨は 下から ふってくるんだよ。', '……うそうそ。雲の上だから、雨は めったに ないの。']] });
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#d0483a', hair: 'center', bulk: 1.06, head: { hair: '#c8c0b0', skin: '#e8b890', eyes: 'small', mouth: 'smile', beard: 'mustache' }, colors: { linen: '#f0e8d0', pants: '#4a4a5a', scarf: '#6a8a4a' } }, 10.6, 88.2, PI / 2,
    { name: '雲の海を ながめる おじいさん', lines: [['わしは この町で 生まれて、七十年。', 'くじらの背から おりたことは いちども ない。'], ['下の雲の海の そのまた下には、地面が あるそうじゃ。', '……ほんとうかのう。'], 'ベンチに すわって、くじらの 鼻歌を 聞くのが 日課でな。'] });
  folk({ size: 'small', hair: 'wolf', head: { hair: '#e8c070', eye: '#3a7a5a', mouth: 'smile', blush: true }, colors: C('#d0483a', '#fff4d8', '#6a5a7a', '#f8f0a8', { linen: '#fff4d8' }) }, .2, 81.2, PI * .9,
    { name: 'リボンの女の子', lines: [['あのね、くじらさんには 名前が あるの。', 'でも、ないしょ。'], ['風車の おにいさんは、くじらの きげんが わかるんだって。'], 'おねがいごとは、尾びれに むかって 言うと かなうのよ。'] });
  folk({ size: 'child', outfit: 'worker', hat: 'cap', hatC: '#3a6ab0', hair: 'wolf', head: { hair: '#2a2a3a', eye: '#5a3a2a', mouth: 'open' }, colors: { linen: '#f8f0a8', pants: '#3a6ab0' } }, 0, 0, 0,
    { name: '走りまわる子', path: loop([[-5, 70.2], [-3.2, 72], [-5, 73.8], [-6.8, 72]]), speed: 2.8, lines: [['くじらの 鼻の あなまで、きょうそうだ！', '……あ、柵より むこうは 行っちゃ だめなんだった。'], '見はり台に のぼると、遠くの くじらが 見えるよ！'] });
  folk({ size: 'normal', outfit: 'worker', hat: 'straw', hair: 'swept', head: { hair: '#5a3a22', skin: '#d8a070', eye: '#5a4a2a', mouth: 'smile' }, colors: { linen: '#f4ecd8', pants: '#6a5a3a', scarf: '#3a6ab0' } }, -7.4, 51.6, PI / 2 + .4,
    { name: '風車の番人', lines: [['この風車は、くじらの 息の風で 回っているんだ。', '粉を ひいて、町じゅうの パンになる。'], ['羽根が 速く回る日は、くじらの きげんが いい日さ。'], '風車の かげで ひるねを すると、とても よく ねむれるよ。'] });
  folk({ size: 'tall', outfit: 'robe', hat: 'wizard', hatC: '#3a3a6a', hold: 'staff', hair: 'center', head: { hair: '#4a4a5a', eye: '#4a6aa0', eyes: 'small', brow: 'thick', mouth: 'line' }, colors: { tunic: '#4a5a9a', trim: '#f8d860' } }, LX - .2, LZ - .8, PI / 2 + .3,
    { name: 'くじらの声を聞く 学者', lines: [['しっ……。いま、くじらが 歌っている。', 'ふかく ひくい声で、遠くの なかまを よんでいるんだ。'], ['わたしは くじらの ことばを しらべている。', '「あした は 晴れ」……と 言ったような 気がする。'], 'ほかの くじらの背にも、町が あるのかもしれないね。'] }, LT);
  folk({ size: 'normal', outfit: 'apron', hat: 'straw', hair: 'center', head: { hair: '#7a3a2a', eye: '#6a4a2a', mouth: 'smile', blush: true }, colors: { tunic: '#e8a040', apron: '#fff4f0' } }, 4.3, 68.4, PI / 2,
    { name: 'くだもの屋さん', lines: [['いらっしゃい！ 雲いちごは いかが？', '雲の海の上で そだつ、ふわふわの いちごだよ。'], ['くじらの背では、くだものが 甘くなるの。', 'お日さまに 近いからかしら。']] });
  folk({ size: 'normal', hat: 'beret', hatC: '#3a6ab0', hair: 'swept', head: { hair: '#c8843a', eye: '#3a7ac8', mouth: 'open' }, colors: C('#f08a2a', '#6a3a2a', '#3a5aa0', '#fff4d8') }, -.1, 96.2, -PI * .1,
    { name: '旅の絵かき', lines: [['この町を 絵に かいているんだ。', 'でも くじらが 大きすぎて、紙に おさまらない。'], ['ここへ来る前は、ブリキの おもちゃの町に いたよ。', 'ねじを 巻くと、町じゅうが 動きだすんだ。'], ['霧の海に うかぶ 城下町も、きれいだったなあ。', '飛空艇に のれば、どこへでも 行けるよ。']] });
  // ねこ（柵の上の あたたかい所で すわっている）
  const cat = R.cat({ c: '#f0a860', belly: '#fff4e0' }); cat.position.set(10.6, H(10.6, 79), 79); cat.rotation.y = .9; scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃあ。', '……ごろごろ。', 'にゃ？（下の雲を じっと 見ている）'], idle: t => R.catPose(cat, 'sit', t) });
  const gulls = [...Array(7)].map(() => { const b = R.bird({ c: '#f8f8f0', belly: '#ffffff', s: 2.2 }); scene.add(b); return b; });

  // ---- はじめの場所：町の入口（頭がわ）から、尾のほうへ ----
  G.spawn(PX(112), 112, PI + .12);
  G.tour([[PX(100), 100], [PX(86), 86], [PX(76), 76], [6.6, 63], [0, 62], [-1.5, 71], [0, 82], [-.3, 97], [6.6, 99], [PX(108), 108]]);
  G.tick((t, dt, P) => {
    big.userData.tick(t); far.forEach(([w, x0, y0, z0, ry], k) => { const s = Math.sin(t * .01 + k) * 160; w.position.set(x0 + Math.sin(ry) * s, y0 + Math.sin(t * .4 + k) * 2, z0 + Math.cos(ry) * s); w.userData.tick(t + k * 2); });
    seaG.position.z = -((t * 7) % 280); sea.mesh.position.z = -400 - ((t * 7) % 48);
    sky.forEach(([p, z0]) => { p.position.z = z0 - ((t * 7) % 900); });
    gulls.forEach((b, k) => { const a = t * .35 + k * .9, r = 14 + (k % 3) * 6; b.position.set(14 + Math.cos(a) * r, 22 + (k % 3) * 4 + Math.sin(t * 1.3 + k) * .8, 64 + Math.sin(a) * r * .8); b.rotation.y = -a; R.birdPose(b, 'fly', t * .7 + k); });
    F.tick(t); });
});
