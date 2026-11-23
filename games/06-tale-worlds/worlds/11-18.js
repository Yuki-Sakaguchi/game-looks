// ワールド 11-18「巨像の谷」。もとは game-looks-11/18-giant-statue-valley.html（見るだけの場面）。
// 真昼の砂岩の深い谷。両がわのがけに、目を閉じてすわる巨大な像が 2 対。谷のつきあたりには、いちばん大きな像。
// ゲームにするために足した物：像・台座・アーチ・柱・岩の当たり判定、大きな像の足もとへのぼる石だん（台座の上と、像の足の上に乗れる）、
// 像のくずれた石のふみ台、南のくずれた門とがれき（谷のはし）、旅のテントとらくだ、石灯ろう、話せる人 8 人、しらべられる物 4 つ。
TALE_WORLD('11-18', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), FW = PACK_FWILD(THREE, K, R), PK = PACK_RUINS(THREE, K, R), SD = PACK_SAND2(THREE, K, R), { hash } = K, PI = Math.PI;
  scene.add(R.skyDome([[0, '#2a64c0'], [.5, '#5a9ae0'], [.85, '#a8d0f0'], [1, '#f0e8d0']], { r: 400 })); scene.fog = new THREE.Fog('#e8d8bc', 90, 380);
  K.lights(scene, G.renderer, { sky: 0xcce0ff, ground: 0xd8a878, amb: 1.5, sun: 0xfff0d0, power: 2.6, range: 40, pos: [30, 45, 27] });

  // ---- 谷：まん中の細い道、両がわは がけへ上がる砂とがれき（もとのまま） ----
  const sm = (a, b, v) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  const W = 13, H = (x, z) => sm(3, W - 1, Math.abs(x)) * 2.4 + Math.sin(z * .15 + x) * .15;
  const land = R.ground({ w: 60, d: 200, cell: 2, cz: -50, H, layers: [T.sand({ c: '#d8b07a' }), T.dirt({ c: '#b89068', pebbles: .5 }), PK.tex.rubble({ brick: 0, grass: .15 })],
    mix: (x, z) => [Math.abs(x) < 1.6 ? 1 : 0, sm(6, 9, Math.abs(x)) * .8] }); scene.add(land.mesh);
  G.ground(H); G.bounds(-11.6, 11.6, -95, 14);
  const fixed = [], put = (o, x, z, ry = 0, y = H(x, z), kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const ROCK = F.tex.sandstone({ c: '#b87a58' });
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) { const z = 20 - k * 20; put(FW.cliff({ w: 22, h: 40 + hash(k, sx) * 10, d: 3, lean: .08, seed: k + (sx > 0 ? 9 : 0), tex: ROCK, top: T.sand({ c: '#d8b07a' }) }), sx * (W + 1.5), z, -sx * PI / 2, 0); }

  // ---- 巨大な座像（もとの場面の手打ちの絵：顔・衣・台座の彫り） ----
  const SKIN = '#f0d0a0', face = (() => { const P = R.Px(32, 40), A = R.ramp(SKIN, 6, { contrast: .7 }), dk = R.ramp('#8a5a40'), mo = R.ramp('#7a9a58');
    P.each((x, y) => hash(x >> 1, y >> 1, 7) > .86 ? A[2] : hash(x, y, 8) > .7 ? A[4] : A[3]);
    P.rect(0, 0, 32, 7, A[2]); for (let x = 0; x < 32; x += 3) P.rect(x, 1, 1, 5, A[1]); P.rect(0, 6, 32, 1, A[1]);
    for (const sx of [-1, 1]) { const cx = 16 + sx * 7; for (let i = -4; i <= 4; i++) P.set(cx + i, 12 - Math.round(Math.cos(i / 4) * 2), A[1]);
      for (let i = -4; i <= 4; i++) P.set(cx + i, 11 - Math.round(Math.cos(i / 4) * 2), A[0]);
      for (let i = -3; i <= 3; i++) { const yy = 17 + Math.round(Math.abs(i) * .4); P.set(cx + i, yy, dk[0]); P.set(cx + i, yy + 1, dk[1]); P.set(cx + i, yy - 1, A[5]); P.set(cx + i, yy - 2, A[2]); } P.set(cx - 4, 17, dk[1]); P.set(cx + 4, 17, dk[1]); }
    for (let y = 13; y < 26; y++) { P.set(15, y, A[5]); P.set(16, y, A[4]); P.set(17, y, A[1]); P.set(18, y, A[2]); } P.rect(13, 25, 7, 1, A[1]); P.rect(14, 26, 5, 1, A[2]); P.set(13, 24, A[2]); P.set(19, 24, A[2]);
    P.rect(12, 29, 9, 1, dk[0]); P.rect(13, 30, 7, 1, dk[2]); P.rect(14, 28, 5, 1, A[4]); P.set(11, 28, A[2]); P.set(21, 28, A[2]);
    P.rect(13, 34, 7, 1, A[2]); for (let y = 7; y < 40; y++) { P.set(0, y, A[1]); P.set(1, y, A[2]); P.set(31, y, A[1]); P.set(30, y, A[2]); } for (let y = 20; y < 40; y++) if (hash(y, 3) > .55) P.set(5 + Math.round(Math.sin(y * .6) * 1), y, A[1]);
    P.line(26, 3, 28, 15, A[1]); P.line(28, 15, 25, 22, A[1]); for (let k = 0; k < 16; k++) P.set(2 + (k * 7) % 6, 34 + (k % 6), mo[(k % 3) + 2]);
    return T.from(P, { m: 1 }); })();
  const robe = (() => { const P = R.Px(64), A = R.ramp('#ecc898', 6, { contrast: .8 }), B = R.ramp('#b87858'), mo = R.ramp('#7a9a58');
    P.each((x, y) => { const f = (x + Math.sin(y * .1) * 6) % 12; return f < 1 ? A[1] : f < 2 ? A[2] : f > 9 ? A[4] : hash(x >> 2, y >> 2, 3) > .8 ? A[2] : A[3]; });
    for (let x = 0; x < 64; x++) { P.set(x, 54, B[1]); P.set(x, 63, B[1]); P.set(x, 55, B[4]); for (let y = 56; y < 63; y++) P.set(x, y, ((x + (y - 56) * 2) % 8 < 3) ? B[2] : B[3]); }
    for (let k = 0; k < 30; k++) { const x = hash(k, 1) * 64, y = hash(k, 2) * 50; P.set(x, y, mo[3]); P.set(x + 1, y, mo[2]); P.set(x, y + 1, mo[4]); }
    P.line(40, 0, 44, 20, A[0]); P.line(44, 20, 41, 33, A[0]); return T.from(P, { m: 4 }); })();
  const statue = (s, hand) => { const B = R.parts(), Rb = B.g(robe).smooth(1), Sk = B.g(T.from((() => { const P = R.Px(32), A = R.ramp(SKIN, 6, { contrast: .6 }); P.each((x, y) => hash(x >> 1, y, 4) > .8 ? A[2] : A[3]); return P; })(), { m: 2 })).smooth(1), Ped = B.g(PK.tex.ancient({ kind: 'carve', c: '#c89870', moss: .3 })), Fc = B.g(face), L = (G2, rings, o) => G2.loft(8, rings.map(r => [r[0] * s, r[1] * s, r[2] * s, r[3], r[4] ?? 1, (r[5] || 0) * s, (r[6] || 0) * s]), o);
    Ped.box(10 * s, 3 * s, 8 * s, 0, 0, 0, { m: 3 }); Ped.box(10.6 * s, .5 * s, 8.6 * s, 0, 3 * s, 0, { m: 3 });
    L(Rb, [[3.5, 3.6, 2.6, 0, .8], [6, 3.2, 2.3, .3], [9.5, 2.7, 1.8, .55], [12.5, 3.2, 2, .75, 1.05], [14.6, 3.4, 1.9, .9, 1.05], [16.4, 1.4, 1.1, 1, .95]], { cap: 'top' });
    for (const sx of [-1, 1]) { Rb.at(R.TR(sx * 1.9 * s, 4.4 * s, -.6 * s, 0, PI / 2)).loft(7, [[0, 1.4 * s, 1.5 * s, 0, .9], [4 * s, 1.25 * s, 1.35 * s, 1, 1]], { cap: 'top' }).at(null);
      L(Rb, [[3.5, 1.5, 1.5, 0, .75, sx * 1.9, 3.3], [7, 1.15, 1.15, .6, .95, sx * 1.9, 3.4], [9.6, 1.45, 1.5, 1, 1, sx * 1.9, 3.4]], { cap: 'top' });
      L(Sk, [[3.5, 1, 1.7, 0, .9, sx * 1.9, 4.3], [4.1, .9, 1.3, 1, 1, sx * 1.9, 4.6]], { cap: 'top' });
      L(Rb, [[15.6, 1, 1, 1, 1, sx * 3.6, -.2], [12.4, .95, .95, .5, .95, sx * 3.9, .3], [10.6, .85, .85, 0, .9, sx * 3.5, 1.9]], {});
      if (sx === hand) L(Sk, [[10.6, .75, .75, 0, .95, sx * 3.5, 1.9], [11.2, .6, .6, .5, 1, sx * 3.1, 4.6], [12.8, .55, .7, 1, 1.05, sx * 2.9, 5.3]], { cap: 'top' });
      else L(Sk, [[10.6, .75, .75, 0, .95, sx * 3.5, 1.9], [10.4, .65, .65, .5, 1, sx * 2.6, 4.3], [9.9, .9, .7, 1, 1.05, sx * 2.2, 5.1]], { cap: 'top' }); }
    L(Sk, [[16, .9, .9, 0, .9], [17.2, .95, .9, 1, 1]], {});
    const hy = 17.1 * s, hw = 1.65 * s, hd = 1.5 * s, top = 21.4 * s; Sk.loft(8, [[hy, hw * .8, hd * .8, 0, .9], [hy + 1.4 * s, hw, hd, .4, 1], [top - .4 * s, hw * .98, hd, .9, 1.05], [top + .2 * s, hw * .5, hd * .5, 1, 1.1]], { cap: 'top' });
    Fc.quad([-hw * .86, hy + .1 * s, hd * .98], [hw * .86, hy + .1 * s, hd * .98], [hw * .86, top - .2 * s, hd * .98], [-hw * .86, top - .2 * s, hd * .98]);
    Ped.loft(8, [[top - .7 * s, hw * 1.05, hd * 1.05, 0, 1], [top + 1.6 * s, hw * .7, hd * .7, .7, 1.05], [top + 3 * s, .25 * s, .25 * s, 1, 1.1]], { cap: 'top' });
    for (const sx of [-1, 1]) Sk.at(R.TR(sx * hw * 1.02, hy + 1.5 * s, 0, sx * PI / 2)).loft(4, [[-1 * s, .3 * s, .2 * s, 0, .9], [.8 * s, .45 * s, .25 * s, 1, 1]], { cap: 'both' }).at(null);
    return B.group(); };
  // 像の当たり判定：台座は上に乗れる、足先は台座から 1 段上の ふみ台、胴とすねは乗れない かべ。L＝像の向きの位置を世界の位置へ
  const statueSolid = (x, z, ry, s) => { const c = Math.cos(ry), sn = Math.sin(ry), L = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
    G.box(x, z, 10.6 * s, 8.6 * s, -9, 3.5 * s, ry);
    for (const sx of [-1, 1]) { const [fx, fz] = L(sx * 1.9 * s, 4.5 * s); G.box(fx, fz, 2 * s, 3.2 * s, -9, 4.15 * s, ry); const [kx, kz] = L(sx * 1.9 * s, 3.2 * s); G.circle(kx, kz, 1.35 * s, 3.5 * s, 10 * s); }
    const [bx, bz] = L(0, .2 * s); G.box(bx, bz, 7.4 * s, 5.6 * s, 3.5 * s, 24 * s, ry, true); };
  const STAT = [[-1, -18, 1], [1, -40, -1], [-1, -62, -1], [1, -76, 1]], BIG = 1.35, BZ = -96;
  put(statue(BIG, 1), 0, BZ, 0, 0); statueSolid(0, BZ, 0, BIG);
  put(FW.cliff({ w: 60, h: 46, d: 3, lean: .05, seed: 30, tex: ROCK, top: T.sand({ c: '#d8b07a' }) }), 0, -104, 0, 0);
  const NICHE = PK.tex.ancient({ kind: 'block', c: '#8a5a48', moss: .2 });
  STAT.forEach(([sx, z, hand], i) => { const x = sx * (W - 3.2), ry = -sx * PI / 2 + sx * .55, c = Math.cos(ry), sn = Math.sin(ry); put(statue(.72, hand), x, z, ry, 0); statueSolid(x, z, ry, .72);
    const G2 = R.geo().tint(.55); G2.box(13, 21, 1, 0, 0, -4.2, { m: 3 }); put(G2.mesh(NICHE), x, z, ry, 0); G.box(x - 4.2 * sn, z - 4.2 * c, 13, 1.2, -9, 30, ry, true);
    put(PK.arch({ w: 12.5, h: 19, thick: 1.8, d: 2.4, c: '#c88a60', moss: .2, seed: i }), x, z, ry, 0);
    for (const k of [-1, 1]) G.box(x + k * 7.15 * c, z - k * 7.15 * sn, 1.8, 2.4, -9, 30, ry, true); });

  // ---- 大きな像の足もとへ上がる石だん（台座の上 4.7 m。像の足の上にも乗れる） ----
  { const n = 16, run = .55, top = 3.5 * BIG, z0 = BZ + 5.8 + n * run, y0 = H(0, z0) - .05, rise = (top - y0) / n;
    put(PK.steps({ w: 5, n, rise, run, c: '#c89870', base: 1.5, seed: 1 }), 0, z0, 0, y0);
    for (let k = 0; k < n; k++) G.box(0, z0 - (k + .5) * run, 5, run, -9, y0 + (k + 1) * rise);
    for (const sx of [-1, 1]) { put(F.stoneLantern({ h: 1.9, lit: true }), sx * 3.6, z0 + .8, 0, H(sx * 3.6, z0 + .8), 'round', { r: .4 }); put(R.tuft({ kind: 'flower', s: 1 }), sx * 3, z0 + 2, sx, H(sx * 3, z0 + 2)); }
    G.sign(0, top + .3, BZ + 6.4, { name: '台座の碑文', lines: [['古い文字が ほってある。', '「ねむる者の 夢が、この谷を まもる」'], ['ほかの文字は すり切れて 読めない。', 'でも、だれかが 新しい花を そなえていった。']] });
    G.sign(0, top + 1.2, BZ + 4.2, { name: '大きな像の足', lines: [['足の指 1 本が、きみの 背たけより大きい。', '見上げると、顔は 空の中だ。']] }); }

  // ---- 像のひざもとの ふみ台（くずれた石のかたまり）。1 つめの像の台座へ のぼれる ----
  { const st = PK.tex.ancient({ kind: 'block', c: '#c89870', moss: .3 }), x0 = -5.6, z0 = -13.2, g0 = H(x0, z0), Gs = R.geo();
    [[0, 0, .5], [-.9, -1, 1.05], [-1.7, -2, 1.6]].forEach(([dx, dz, h], k) => { Gs.box(1.2, h + .4, 1.2, dx, -.4, dz, { m: 3 }); G.box(x0 + dx, z0 + dz, 1.2, 1.2, -9, g0 + h); });
    const me = Gs.mesh(st); me.position.set(x0, g0, z0); me.rotation.y = .2; fixed.push(me);
    G.sign(-6.6, 2.6, -16.4, { name: '像のひざもと', lines: [['見上げると、とじた目が ほほえんでいる。', 'ひざの上で 小鳥が ついばんでいる。']] }); }

  // ---- 道の物：がれき、こわれた柱、石灯ろう（足した）、旅のテント（足した） ----
  for (let i = 0; i < 30; i++) { const z = 15 - hash(i, 1) * 120, sx = i % 2 ? 1 : -1, x = sx * (3.5 + hash(i, 2) * 5), s = .5 + hash(i, 3) * 1.2; if (z < -84 && Math.abs(x) < 8) continue; put(i % 3 ? R.rock({ s, c: '#c89870', seed: i }) : R.tuft({ kind: 'bush', s: .7, seed: i % 3 }), x, z, i, H(x, z), i % 3 ? 'round' : 'none', { pad: .8 }); }
  for (const z of [-6, -28, -54]) put(PK.column({ h: 3.2, r: .35, c: '#d8b088', broken: hash(z, 1) * .5, seed: 2, ivy: 0 }), z % 4 ? 2.4 : -2.4, z, 0, H(z % 4 ? 2.4 : -2.4, z), 'round', { r: .45 });
  for (const [x, z] of [[-2.6, -44], [2.6, -66]]) put(F.stoneLantern({ h: 1.6, lit: true }), x, z, 0, H(x, z), 'round', { r: .35 });
  put(SD.tent({ w: 2.6, d: 3, h: 1.9, c: '#c8682e', c2: '#f0d890' }), 7.2, 4.5, -2.1, H(7.2, 4.5), 'box', { pad: .2 });
  const camel = SD.camel({ c: '#c8a070', c2: '#3a6aa8', saddle: true }); put(camel, 5.4, 7.6, -.4, H(5.4, 7.6), 'round', { r: .9 }); fixed.pop(); scene.add(camel);
  put(R.crate({ s: .7, c: '#9a6a44' }), 8.4, 6.6, .4, H(8.4, 6.6), 'box'); put(R.barrel({ h: .8, r: .3, c: '#8a5a3a' }), 6.4, 2.6, 0, H(6.4, 2.6), 'round');
  // ---- 谷の南のはし：くずれた門と、道をふさぐ がれき（ここから先へは行けない） ----
  put(PK.arch({ w: 15, h: 13, thick: 2, d: 3, c: '#c88a60', moss: .2, broken: .35, seed: 4 }), 0, 17.5, 0, 0);
  for (const sx of [-1, 1]) G.box(sx * 8.5, 17.5, 2, 3, -9, 30, 0, true);
  [[-4, 18.4, 3.2, 1.6], [1.2, 19, 3.8, 2], [5.6, 18.2, 2.6, 1.3]].forEach(([x, z, r, h], i) => put(PK.rubble({ r, h, seed: i, grass: .1, c: '#c89870' }), x, z, i, H(x, z)));
  put(PK.column({ h: 5, r: .5, c: '#d8b088', broken: .6, seed: 3, ivy: 0 }), -2.4, 15.6, 0, H(-2.4, 15.6), 'round', { r: .55 });
  G.sign(0, 1.2, 15.2, { name: 'くずれた門', lines: [['大きな石が 道をふさいでいる。', 'ここから先へは もどれないようだ。']] });
  scene.add(R.merge(fixed));
  const flags = [[-28, 12], [-50, 13]].map(([z, y]) => { const b = F.bunting({ from: [-(W - 1), y, z], to: [W - 1, y + 2, z - 4], n: 14, sag: 2.5, cs: ['#3a8a5a', '#f0d070', '#c8453a', '#f4ecd8', '#3a6aa8'] }); scene.add(b); return b; });

  // ---- 光のすじ（がけの上から谷へ）、ただよう光の粒、鳥 ----
  const shafts = [[-2, -16, 4], [3, -36, 3.4], [-1, -60, 3], [1, -84, 3.6]].map(([x, z, w], i) => { const sh = PK.shaft({ w, h: 30, dx: -10, dz: -6, a: .16, c: '#fff0c8', seed: i }); sh.position.set(x, 0, z); scene.add(sh); return sh; });
  const motes = PK.motes({ n: 30, area: [6, 4, 24], c: '#fff6d0', size: 1, a: .5 }); motes.position.set(0, .3, -30); scene.add(motes);
  const birds = PK.flock({ n: 7, r: 9, h: 4, c: '#f4ecdc', s: 1.8, speed: .3 }); birds.position.set(0, 30, -40); scene.add(birds);
  const sparrows = [0, 1, 2].map(i => { const b = R.bird({ c: '#8a6a4a', belly: '#e8d8b8', s: .9 }); scene.add(b); return b; });

  // ---- 谷の人（TL.person。主人公と同じ 4.5 頭身の作り）。服の色・帽子・かみ型で見分ける ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d) => { const p = TL.person(o); p.position.set(x, H(x, z), z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const pilgrim = folk({ size: 'tall', outfit: 'robe', hat: 'hood', hatC: '#b85a2a', hold: 'staff', hair: 'center', head: { hair: '#5a4a40', skin: '#d8a070', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#c8682e', trim: '#f0d890', scarf: '#f0d890' } }, 0, 0, 0,
    { name: '巡礼のおぼうさん', path: loop([[-1.2, 10], [-1.6, -30], [-1.2, -72], [1.2, -72], [1.6, -30], [1.2, 10]]), speed: .8, u: .08, lines: [['しずかに……。', '像たちは、ねむりながら 谷を見まもっておる。'], ['わしは ろばと、谷のおくの 大きな像まで 歩いておる。', '一年に 一度の おまいりじゃ。'], 'あせらず 歩けば、谷は いつまでも そこにある。'] });
  const donkey = PK.beast({ kind: 'horse', c: '#8a7a6a', c2: '#c8682e', s: .75 }); scene.add(donkey);
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'wolf', head: { hair: '#3a2e2a', skin: '#c8885a', brow: 'angry', mouth: 'line' }, colors: { tunic: '#3a6a5a', metal: '#c8a060', scarf: '#c8453a' } }, -2.4, 11.6, PI,
    { name: '谷の番人', lines: [['南の門は、むかしの 地ゆれで くずれてしまった。', 'もう ここから 外へは 出られんよ。'], ['谷のおくの いちばん大きな像には、石だんで 足もとまで のぼれる。', 'ばちが あたらんように、そっとな。']] });
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#8a6a4a', hair: 'wolf', bulk: 1.1, head: { hair: '#4a3428', skin: '#c88a5a', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { pants: '#6a5a4a', linen: '#e8d8b8', scarf: '#3a6aa8' } }, 4.6, -34.4, -2.3,
    { name: '石工', lines: [['ひびを 少しずつ うめているんだ。', 'この像は、おれの ひいじいさんの代から 直してる。'], '像の 顔だけは さわっちゃいけない。それが 谷の きまりさ。'] });
  folk({ size: 'normal', outfit: 'robe', hat: 'wizard', hatC: '#3a5a7a', hair: 'center', head: { hair: '#c8c0b0', skin: '#f0c49c', eye: '#4a6a9a', eyes: 'small', mouth: 'line', beard: 'mustache' }, colors: { tunic: '#3a5a7a', trim: '#e0c070' } }, -4.8, -58.4, 1.4,
    { name: '像を調べる学者', lines: [['この像の 手の形を見てごらん。', '手のひらを 上に向けた像と、ひざに置いた像が ならんでいる。'], ['「たずねる者」と「こたえる者」だと、わたしは 考えている。', '……まだ だれも みとめてくれないがね。'], ['東の がけには、家が 段になって はりついた 村がある。', 'はしごで 上り下りするそうだよ。']] });
  folk({ size: 'normal', hat: 'straw', hair: 'swept', head: { hair: '#2a2228', skin: '#b8784a', eye: '#3a5a4a', mouth: 'smile' }, colors: C('#3a6aa8', '#c8682e', '#e8dcc0', '#f0d070') }, 6.6, 5.4, -1.9,
    { name: '旅の商人', lines: [['やあ、いい日よりだね。', 'らくだが つかれたから、ここで ひと休みさ。'], ['この先の 砂の海を こえると、塩の湖がある。', '空が 地面に うつって、まるで 鏡の上を 歩くようだよ。'], 'テントの中は のぞいちゃだめだよ。売りものが 散らかってるんだ。'] });
  folk({ size: 'normal', hat: 'beret', hatC: '#3a8a5a', hair: 'center', head: { hair: '#c8843a', eye: '#4a6a9a', mouth: 'open', blush: true }, colors: C('#f0e4c8', '#3a8a5a', '#6a5a4a', '#c8453a') }, 4.2, -21.6, -2.6,
    { name: '絵かき', lines: [['しーっ、いま 光が いちばん きれいなんだ。', 'がけの上から さしこむ すじを 描いてる。'], ['像の顔は、時間で 表情が かわる。', '朝は ねむそう、昼は ほほえんで見えるんだ。']] });
  folk({ size: 'child', hat: 'kerchief', hatC: '#3a8a5a', hair: 'wolf', head: { hair: '#3a2420', skin: '#d8a070', eye: '#6a4a2a', mouth: 'open', blush: true }, colors: C('#e8b040', '#6a3a2a', '#6a3a2a', '#3a6ab0') }, 0, 0, 0,
    { name: '谷の子', path: loop([[-3.4, -10], [-5.2, -14.4], [-3.4, -18.6], [-1.6, -14.4]]), speed: 2.2, lines: [['小鳥を つかまえたいの！', '……でも、像の ひざの上に にげちゃうんだ。'], ['あそこの 石のかたまりを ぴょんぴょん のぼると、像の台にのれるよ！', 'おかあさんには ないしょね。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'kerchief', hatC: '#c8453a', hair: 'center', head: { hair: '#e8e8e8', skin: '#e0b088', eyes: 'closed', mouth: 'smile' }, colors: { tunic: '#8a4a6a', trim: '#f0d890' } }, 2.6, -79.6, PI - .3,
    { name: '花をそなえる おばあさん', lines: [['まいにち、この大きな像に 花を そなえに来るの。', 'もう 五十年に なるかしら。'], ['この谷の像は、だれが ほったのか だれも知らないのよ。', 'でも、みんな やさしい顔を しているでしょう。'], 'あなたの 旅が 無事でありますように。'] });

  // ---- 毎コマ：ろばは おぼうさんの うしろを ついて歩く。小鳥は像のひざ、光のすじと鳥 ----
  G.spawn(0, 11, PI);
  G.tour([[0, 6], [-2.6, -12], [-5.6, -13.2], [-7.4, -15.4], [-3, -20], [1.4, -34], [-1, -50], [2, -64], [0, -74], [0, -82], [0, -87.2], [4.4, -89], [4.6, -86], [3, -78], [-1, -40], [0, -6]]);
  let lastU = 0;
  // カメラ：土台が主人公へ向けたあと、少しだけ上を向ける（主人公は画面の下のほうに、像の顔と空が入る）
  G.tick(() => G.cam.rotateX(innerWidth < innerHeight ? .25 : .19));
  G.tick((t, dt, P) => {
    const n = pilgrim, path = n.path, back = 1.9 / path.getLength(), u = (n.u - back + 1) % 1, p = path.getPointAt(u), tg = path.getTangentAt(u), moving = n.u !== lastU; lastU = n.u;
    donkey.position.set(p.x, H(p.x, p.z), p.z); donkey.rotation.y = Math.atan2(tg.x, tg.z); PK.beastPose(donkey, moving ? 'walk' : 'stand', t * 3.4);
    sparrows.forEach((b, i) => { const st = STAT[0], bx = st[0] * (W - 3.2) + 1.6, bz = st[1] + (i - 1) * .8 + 1.4; b.position.set(bx, 7.05, bz); b.rotation.y = i * 2; R.birdPose(b, 'peck', t * 1.3 + i * 1.7); });
    SD.camelPose(camel, 'rest', t);
    birds.userData.tick(t); motes.userData.tick(t); shafts.forEach(s => s.userData.tick?.(t)); F.tick(t); });
});
