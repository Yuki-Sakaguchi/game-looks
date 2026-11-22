// 第 10 集 02「大きな竜を狩るアクション」だけで使う部品。../game-looks-7/kit.js・retro.js のあとに読み、 const GD = GIANT_DRAGON(THREE, K, R)  として使う。
// 中身は 3 つ：(1) 大きな竜（オリジナルの「アカガネリュウ」）と動き  (2) 火のいき  (3) 狩人のつち。pack-battle.js は変えず、足りない物をここに置く。
//
// ■ 1. 竜 ── const d = GD.make({ c（うろこ）, belly（腹）, wing（つばさのまく）, eye })   四つ足＋つばさ、長い首と尾、尾の先に とげのこぶ。正面が +z、足もとが y=0
//   大きさ：かたの高さ 4.4 m、頭の高さ 11 m ほど（5 頭身の人 1.4 m の 8 倍）、鼻から尾の先まで 30 m ほど。三角形は 1100 ほど
//   形は R.geo() の loft（胴・首 3 節・頭・あご・尾 5 節・足 4 本・つばさの骨）と三角（まく・背びれ・きば）。テクスチャは手で打った 3 枚：
//     はだ 128×64（うろこ・腹の板・背のくらいしま・古いきず。たてにくり返す）／部品 128×128（頭・あご・足・角・背びれ・骨・こぶ）／つばさのまく 80×48（すじ・目玉もよう・ふちの切れこみ）
//   GD.pose(d, { t, walk（歩きの位相。1 でひとめぐり）, walkAmt（0〜1）, look: [左右, 上下]（首の向き）, low（0〜1。首を下げて足もとをのぞく）, acts: [{ name, k（0〜1） }, …] })   毎コマ呼ぶ。関節だけを書きかえる
//     d.position / d.rotation はページで決め、そのあとに GD.pose を呼ぶ（中で行列を新しくするので、すぐ d.userData.at が使える）
//     acts の name：'roar'（ほえる）'tail'（体ごと 1 回転して尾をふる）'fire'（火をはく）'bite'（かみつく）'flinch'（ひるむ）。どれも k=0 と 1 で ふだんの姿にもどる。fire は { aim（首の向き）, sweep（左右にふる はば） } も取れる
//     歩きは足の先を地面に置く計算（2 本の骨の IK）。位相をページで「進んだ長さ ÷ d.userData.cycle」にすると、足がすべらない
//   d.userData.at('head'/'mouth'/'chest'/'wingL'/'wingR'/'tail'/'club'/'legFL'/'legFR'/'legBL'/'legBR', Vector3) → 世界の位置（数字を出す所・火の出口）
//   d.userData.damage('head'/'wing'/'tail', true/false)   部位のきずの段階（頭：左の角が折れ、目の上に切りきず／つばさ：まくに穴とさけ目／尾：切りきずと、こぶのとげが欠ける）
//
// ■ 2. 火のいき ── const br = GD.breath(scene, [B.spriteTex.flame(0), flame(1), flame(2)])   br.emit(出口, 向き, dt)（はいている間 毎コマ）  br.update(dt)（毎コマ）  br.clear()
//   板（Sprite）の数は はじめに決めた数のまま（あかりは持たない。光らせるのはページの PointLight）
//
// ■ 3. つち ── GD.hammer({ c, c2, s }) → Group（にぎる所が原点、頭は +y）。pack-battle.js の B.arm(人, つち) でそのまま持たせられる
window.GIANT_DRAGON = (THREE, K, R) => {
  const { hash, mix, ramp, tone, Px, TR } = R, PI = Math.PI, GD = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = k => k * k * (3 - 2 * k), seg = (t, a, b) => ease(cl((t - a) / (b - a)));
  const AX = TR(0, 0, 0, 0, PI / 2, 0), AXB = TR(0, 0, 0, PI, PI / 2, 0);
  const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const MT = t => R.mat(t, { vc: true, smooth: true });

  // ================= テクスチャ =================
  // うろこ 1 枚（8×8）。H・h が光、d が影、K がふちの線。1 段ごとに半分ずらして ならべる
  const SC = ['mHhhhhmm', 'hhhmmmmd', 'hmmmmmmd', 'mmmmmmmd', 'mmmmmmdd', 'dmmmmmdK', 'KdmmmdKK', 'KKdddKKK'], SCV = { H: 2, h: 1, m: 0, d: -1, K: -4 };
  const scaleK = (x, y) => { const row = Math.floor(y / 8), lx = (((x + (row & 1) * 4) % 8) + 8) % 8, ly = ((y % 8) + 8) % 8; return SCV[SC[ly][lx]]; };
  const scaleId = (x, y) => { const row = Math.floor(y / 8); return [Math.floor((x + (row & 1) * 4) / 8), row]; };
  const SCARC = ['#f6b8a8', '#b8464a'];

  // はだ（128×64）：よこは胴まわり（0 と 127 が背、64 が腹）、たては体にそってくり返す
  function paintSkin(c, belly, scar) { const P = Px(128, 64), M = ramp(c), Bl = ramp(belly), Dk = ramp(mix(c, '#2a1838', .62)), K0 = mix(M[0], '#140818', .5), Sp = mix(c, belly, .62);
    P.each((x, y) => { const ax = Math.abs(x - 63.5), j = y & 7, bw = 13 + (j < 4 ? 1 : 0);
      if (ax < bw) { let k = j === 0 ? 5 : j === 1 ? 4 : j < 5 ? 3 : j < 7 ? 2 : 0; if (ax > bw - 3 && k > 0) k--; if (j > 1 && j < 6 && (x * 7 + (y >> 3) * 5) % 11 === 0) k--; return tone(Bl, k); }
      if (ax < bw + 1) return K0;
      const [ci, cj] = scaleId(x, y), h = hash(ci & 15, cj, 3), dy = Math.abs((y % 32) - 16), dark = ax > 55 || dy < 8.5 - (64 - ax) * .24;
      let k = 3 + scaleK(x, y) + (h > .72 ? 1 : h < .22 ? -1 : 0); if (ax < bw + 9) k += 1;
      if (!dark && h > .9 && k === 3 && ax > 30) return Sp;
      return k <= 0 ? K0 : tone(dark ? Dk : M, Math.min(5, k)); });
    const slash = (x0, y0, x1, y1) => { P.line(x0 + 1, y0, x1 + 1, y1, K0); P.line(x0, y0, x1, y1, SCARC[0]); P.line(x0, y0 + 1, x1, y1 + 1, SCARC[1]); };
    slash(94, 50, 100, 60); slash(30, 20, 33, 27);
    if (scar) for (const [a, b] of [[18, 4], [25, 2], [32, 7]]) { slash(a, b, a + 13, b + 24); slash(127 - a, b + 30, 114 - a, b + 54); }
    return P; }

  // 部品（128×128）：頭・あご・足・角・背びれ・つばさの骨・尾のこぶ
  const REG = { head: [0, 0, 64, 32], jaw: [64, 0, 64, 24], legA: [0, 32, 48, 22], legB: [0, 54, 48, 16], legC: [0, 70, 48, 10], horn: [0, 80, 32, 24], plate: [32, 80, 16, 24], bone: [0, 104, 32, 24], club: [32, 104, 32, 24] };
  function paintParts(c, belly, wing, eye, scar) { const P = Px(128, 128), M = ramp(c), Bl = ramp(belly), Dk = ramp(mix(c, '#2a1838', .62)), Ch = ramp(mix(c, belly, .45)), Hn = ramp('#e6dcc0'), K0 = mix(M[0], '#140818', .5); P.clip = true;
    const reg = (r, f) => { for (let j = 0; j < r[3]; j++) for (let i = 0; i < r[2]; i++) { const v = f(i, j); if (v !== undefined) P.set(r[0] + i, r[1] + j, v); } };
    const sc = (i, j, Z, sd, add = 0) => { const [ci, cj] = scaleId(i, j), h = hash(ci, cj, sd), k = 3 + scaleK(i, j) + (h > .7 ? 1 : h < .2 ? -1 : 0) + add; return k <= 0 ? K0 : tone(Z, Math.min(5, k)); };
    // 頭（上が鼻先、下が首がわ。よこは 0 と 63 がてっぺん、27〜36 が上あごの内がわ）
    reg(REG.head, (i, j) => { const m = i < 32 ? i : 63 - i;
      if (m >= 27) return j % 4 === 0 ? '#c85a5a' : m === 27 ? '#5a1424' : '#8a2434';
      if (m === 26) return K0;
      if (m < 4) { const q = j % 4, k = 3 + (q === 0 ? 2 : q === 3 ? -2 : 0) + (m === 3 ? -1 : 0); return tone(Dk, k); }
      return sc(m, j, m > 19 ? Ch : M, 9, m === 4 ? -1 : 0); });
    for (const mx of [x => x, x => 63 - x]) {
      for (let j = 1; j < 30; j += 4) { P.set(mx(25), j, Hn[5]); P.set(mx(24), j, Hn[4]); P.set(mx(23), j, Hn[4]); P.set(mx(25), j + 1, Hn[4]); P.set(mx(24), j + 1, Hn[2]); P.set(mx(25), j + 2, Hn[2]); }
      for (let j = 15; j <= 23; j++) for (let m = 10; m <= 17; m++) { const cn = (j === 15 || j === 23) && (m === 10 || m === 17); if (!cn) P.set(mx(m), j, K0); }
      for (let j = 16; j <= 22; j++) for (let m = 11; m <= 16; m++) P.set(mx(m), j, (j === 16 || j === 22) && (m === 11 || m === 16) ? K0 : m > 14 ? mix(eye, '#c85a20', .45) : eye);
      for (let m = 11; m <= 16; m++) P.set(mx(m), 19, '#100810'); P.set(mx(13), 18, '#100810'); P.set(mx(14), 18, '#100810'); P.set(mx(13), 20, '#100810'); P.set(mx(14), 20, '#100810'); P.set(mx(12), 17, '#ffffff'); P.set(mx(12), 21, mix(eye, '#ffffff', .6));
      for (let j = 12; j <= 25; j++) { P.set(mx(9), j, Dk[1]); P.set(mx(8), j, j < 22 ? Dk[2] : Dk[1]); P.set(mx(7), j, M[5]); }
      for (let j = 15; j <= 23; j++) P.set(mx(18), j, M[1]);
      P.rect(Math.min(mx(5), mx(6)), 3, 2, 2, K0); P.set(mx(4), 3, M[5]); P.set(mx(4), 4, M[5]);
    }
    P.line(40, 6, 44, 11, SCARC[0]); P.line(41, 6, 45, 11, K0);
    if (scar) { P.line(57, 9, 43, 26, SCARC[0]); P.line(58, 9, 44, 26, K0); P.line(56, 9, 42, 26, SCARC[1]); P.line(60, 13, 50, 27, SCARC[0]); P.line(61, 13, 51, 27, K0); for (let j = 16; j <= 22; j++) for (let m = 11; m <= 16; m++) if (P.get(63 - m, j) !== SCARC[0]) P.set(63 - m, j, j === 19 || j === 20 ? '#100810' : Dk[2]);
      for (let k = 0; k < 14; k++) P.set(54 + Math.floor(hash(k, 1, 5) * 9), 27 + Math.floor(hash(k, 2, 5) * 5), k % 3 ? SCARC[0] : K0); }
    // あご（上が先。よこは 0 と 63 が口の中、32 が下）
    reg(REG.jaw, (i, j) => { const m = i < 32 ? i : 63 - i;
      if (m < 5) return (j + m) % 5 === 0 ? '#c85a6a' : '#e8808a';
      if (m < 13) return j % 4 === 1 ? '#b84a54' : m === 5 ? '#5a1424' : '#8a2434';
      if (m === 13) return K0;
      if (m < 23) return sc(m, j, Ch, 12);
      const q = j % 4; return m === 23 ? K0 : tone(Bl, q === 0 ? 5 : q === 3 ? 1 : 3 - ((i * 5 + j) % 9 === 0 ? 1 : 0)); });
    for (const mx of [x => 64 + x, x => 127 - x]) for (let j = 2; j < 22; j += 4) { P.set(mx(12), j, Hn[5]); P.set(mx(11), j, Hn[4]); P.set(mx(12), j + 1, Hn[3]); }
    // 足（よこは 24 が前。上＝もも、中＝すね、下＝足の甲）
    const leg = (r, sd) => reg(r, (i, j) => { const f = Math.abs(i - 23.5), q = (j + r[1]) % 6;
      if (f < 6) return q === 5 ? K0 : tone(Dk, 3 + (q === 0 ? 2 : q === 4 ? -1 : 0) + (f > 4 ? -1 : 0));
      if (f < 7) return K0;
      return sc(i, j + r[1], M, sd, (i < 5 || i > 42 ? -1 : 0) + (j < 2 && r === REG.legA ? -1 : 0)); });
    leg(REG.legA, 20); leg(REG.legB, 21); leg(REG.legC, 22); reg([0, 68, 48, 2], (i, j) => j ? K0 : tone(Bl, 3 + (i % 6 < 3 ? 1 : 0)));
    // 角・きば・つめ（上が先、下が根もと）
    reg(REG.horn, (i, j) => { let k = 4 - (i > 20 ? 1 : 0) + (i < 9 && i > 2 ? 1 : 0) - (j % 4 === 3 ? 2 : 0) - (j > 18 ? 1 : 0) - (j > 21 ? 1 : 0); if (j < 4) k = 5; return tone(Hn, k); });
    P.line(12, 86, 15, 96, Hn[1]); P.line(24, 90, 22, 99, Hn[1]);
    // 背びれ（上が先。ふちが明るい）
    { const W = ramp(wing); reg(REG.plate, (i, j) => j < 3 ? W[4] : j < 5 ? W[3] : (i === 0 || i === 15) ? Dk[5] : tone(Dk, 4 - Math.floor(j / 6) - (i % 4 === 0 ? 1 : 0))); }
    // つばさの骨（こまかい うろこ）
    reg(REG.bone, (i, j) => { const q = ((i >> 2) + (j >> 2)) & 1, e = (i & 3) === 3 || (j & 3) === 3; return e ? Dk[1] : tone(Dk, q ? 4 : 3) ; });
    reg([0, 104, 32, 2], () => Dk[5]);
    // 尾のこぶ（岩のような板と、ひび）
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) P.block(32 + i * 8, 104 + j * 8, 8, 8, Dk, 3 + ((i + j) & 1), { round: true });
    P.line(36, 108, 44, 118, K0); P.line(50, 106, 54, 114, K0); P.line(57, 116, 62, 124, Dk[5]);
    return P; }

  // つばさのまく（80×48）：上が骨、下がふち（まん中が切れこむ）。すじ、目玉もよう。きずの段では穴とさけ目
  function paintWing(c, wing, scar) { const P = Px(80, 48), W = ramp(wing), V0 = mix(W[1], c, .5), RIM = mix(W[0], c, .5); P.clip = true;
    const edge = x => 47 - Math.pow(Math.sin(PI * (x + .5) / 80), .8) * 10;
    P.each((x, y) => { const e = edge(x); if (y > e) return null; if (y > e - 1.2) return RIM; let k = 3; if (y < 5) k = y < 2 ? 1 : 2; if (y > e - 4) k = 2;
      const n = R.tn(x, y, 16, 16, 80, 48, 6); if (n > .64) k += 1; else if (n < .3 && ((x + y) & 1)) k -= 1; return tone(W, k); });
    for (const [x1, y1] of [[79, 10], [66, 36], [40, 40], [16, 38]]) P.line(0, 0, x1, y1, V0);
    for (const [x1, y1] of [[52, 28], [30, 30]]) P.line(79, 0, x1, y1, V0);
    for (const [cx, cy, r] of [[44, 22, 5.5], [20, 26, 3.6]]) { P.disc(cx, cy, r, mix(c, '#3a1020', .3)); P.disc(cx, cy, r - 1.4, W[5]); P.disc(cx, cy, r - 3, '#3a1428'); }
    for (let x = 0; x < 80; x++) { const e = edge(x); if (e < 46 && ((x >> 1) & 1)) P.set(x, Math.floor(e - 2), W[4]); }
    if (scar) { const hole = (cx, cy, r) => { P.disc(cx, cy, r + 1.2, RIM); P.disc(cx, cy, r, null); };
      hole(28, 14, 3.4); hole(60, 20, 4.4); hole(12, 30, 2.6); for (let y = 24; y < 48; y++) { const w = (y - 24) / 5; for (let x = Math.floor(36 - w); x <= 36 + w; x++) P.set(x, y, null); P.set(Math.floor(36 - w) - 1, y, RIM); P.set(Math.floor(36 + w) + 1, y, RIM); } }
    return P; }

  const texCache = new Map();
  const texes = (c, belly, wing, eye) => { const key = [c, belly, wing, eye].join(); let t = texCache.get(key);
    if (!t) texCache.set(key, t = { skin: [0, 1].map(s => R.tex.from(paintSkin(c, belly, s), { m: 6 })), parts: [0, 1].map(s => R.tex.from(paintParts(c, belly, wing, eye, s), { cut: true })), wing: [0, 1].map(s => R.tex.from(paintWing(c, wing, s), { cut: true })) }); return t; };
  GD.tex = texes;

  // ================= 形 =================
  const H0 = 4.4, L1 = 2.1, L2 = 1.8, ANK = .55, LN = 2.25, LT = 2.3, LU = 3.4, LF = 4.2;
  const HS = { pts: [[0, -1], [-.7, -.8], [-1, -.1], [-.85, .35], [0, .42], [.85, .35], [1, -.1], [.7, -.8]], u: [0, .14, .3, .42, .5, .58, .7, .86, 1] };
  const JS = { pts: [[0, -.25], [-.85, -.4], [-1, 0], [-.7, .8], [0, 1], [.7, .8], [1, 0], [.85, -.4]], u: [0, .1, .2, .36, .5, .64, .8, .9, 1] };
  const FOLD = [.75, .7, -2, 1.2, .8, -1.2], SPREAD = [.55, -.05, -.3, .1, 0, -1.35], TAIL0 = [-.32, -.14, .06, .2, .24], TAILLOW = [-.75, -.2, .65, .3, .1];
  const LEGS = [['FL', 1.9, -.5, 2.7, true, 0], ['BR', -1.8, -.4, -2.9, false, .1], ['FR', -1.9, -.5, 2.7, true, .5], ['BL', 1.8, -.4, -2.9, false, .6]];

  GD.make = (o = {}) => { const c = o.c || '#b8482e', belly = o.belly || '#f0d8a0', wing = o.wing || '#e8a03a', eye = o.eye || '#ffe060', TX = texes(c, belly, wing, eye);
    const J = { root: new THREE.Group(), neck: [], tail: [], legs: [], wings: {}, pt: {} }, g = J.root, px = (G, r) => G.px(r[0], r[1], r[2], r[3], 128, 128), sw = { head: [], tail: [], wing: [] };
    J.move = grp(g); J.body = grp(J.move, 0, H0, 0);
    // 背びれ 1 枚（x=0 の面に立つ三角）。dir は +1 で +z へ、−1 で −z へ ならぶ
    const fin = (G, z0, len, y, hgt, dir = 1) => { px(G, REG.plate).normal([0, 1, .2 * dir]); G.tri([0, y - .1, z0], [0, y - .1, z0 + len * dir], [0, y + hgt, z0 + len * .3 * dir], [0, 0], [1, 0], [.5, 1]); G.normal(null); };
    const cone = (G, m, len, r, n = 4) => { px(G, REG.horn).at(m).loft(n, [[0, r, r, 0, .85], [len * .55, r * .6, r * .6, .55, 1], [len, .015, .015, 1, 1.15]], { rot: 0 }).at(null); };
    // 胴
    { const TOR = [[-4.2, .95, .95, 0, .85, 0, -.3], [-3, 1.7, 1.6, .19, .95, 0, -.1], [-1, 2, 1.9, .5, 1, 0, .2], [1.2, 2.2, 2.1, .84, 1, 0, .1], [3, 1.8, 1.8, 1.12, 1, 0, -.3], [4.3, 1.2, 1.25, 1.32, .95, 0, -.9]];
      J.body.add(R.geo().smooth(1).at(AX).loft(10, TOR, { rot: 0, cap: 'both' }).mesh(TX.skin[0]));
      const Gp = R.geo(); for (const [z, y, h] of [[-3.6, 1.6, .9], [-2.2, 1.72, 1.2], [-.7, 1.78, 1.45], [.9, 1.95, 1.6], [2.5, 2.08, 1.4]]) fin(Gp, z, 1.35, y, h); J.body.add(Gp.mesh(TX.parts[0])); }
    const tube = (r0, r1, len, v0, vs, ax) => R.geo().smooth(1).at(ax).loft(8, [[-.4, r0 * .97, r0 * 1.08, v0, 1], [len * .5, (r0 + r1) / 2, (r0 + r1) / 2 * 1.1, v0 + vs * .55, 1], [len + .12, r1, r1 * 1.08, v0 + vs, 1]], { rot: 0 }).at(null);
    // 首 3 節
    { const NR = [1.2, .98, .84, .74]; let p = J.body;
      for (let i = 0; i < 3; i++) { const n = grp(p, 0, i ? 0 : .9, i ? LN : 4); n.add(tube(NR[i], NR[i + 1], LN, i * .85, .85, AX).mesh(TX.skin[0])); const Gp = R.geo(); fin(Gp, .1, 1.05, NR[i] * 1.05, 1 - i * .12); fin(Gp, 1.4, 1, NR[i + 1] * 1.1, .9 - i * .12); n.add(Gp.mesh(TX.parts[0])); J.neck.push(n); p = n; } }
    // 頭・あご・角・きば
    { const hd = J.head = grp(J.neck[2], 0, 0, LN), G = R.geo().smooth(1);
      px(G, REG.head).at(AX).loft(HS, [[-.5, .7, .7, 0, .9], [.4, 1.2, 1, .25, 1, 0, -.05], [1.4, 1.05, .8, .5, 1], [2.5, .75, .55, .78, 1, 0, .08], [3.3, .58, .42, .95, 1, 0, .1], [3.65, .3, .22, 1, .92, 0, .15]], { cap: 'both' }).at(null);
      G.smooth(0); for (const sx of [-1, 1]) { px(G, REG.horn).normal([sx, .1, .3]); for (const [z, w, l] of [[1.5, 1.02, .34], [2.05, .86, .4], [2.6, .72, .34], [3.05, .62, .5], [3.4, .46, .42]]) G.tri([sx * w * .86, -.3, z - .15 * sx], [sx * w * .86, -.3, z + .15 * sx], [sx * w * .8, -.3 - l, z], [0, 0], [1, 0], [.5, 1]); G.normal(null); }
      G.smooth(2); cone(G, TR(-.65, .72, -.1, .42, -1.05, 0), 3.1, .38, 5); cone(G, TR(0, .42, 3, 0, .55, 0), .95, .2);
      for (const sx of [-1, 1]) { cone(G, TR(sx * 1, .2, .1, -sx * .95, -1.35, 0), 1.6, .25); cone(G, TR(sx * .95, -.2, .5, -sx * 1.25, -1.5, 0), 1, .18); }
      const m = G.mesh(TX.parts[0]); hd.add(m); sw.head.push(m);
      // 光る目（頭の絵の目の所を、光に関係なく光る板でもう 1 度はる）
      { const Ge = R.geo(); for (const sx of [-1, 1]) { const q = (dz, up) => [sx * (.97 - up * .11), .49 + up * .2, .96 + dz * .4]; Ge.px(sx < 0 ? 10 : 46, 15, 8, 9, 128, 128); if (sx < 0) Ge.quad(q(-1, 1), q(-1, -1), q(1, -1), q(1, 1)); else Ge.quad(q(-1, -1), q(-1, 1), q(1, 1), q(1, -1)); }
        J.eyes = Ge.mesh(R.mat(TX.parts[0], { glow: true })); hd.add(J.eyes); }
      const Gh = R.geo().smooth(2); cone(Gh, TR(.65, .72, -.1, -.42, -1.05, 0), 3.1, .38, 5); J.hornFull = Gh.mesh(TX.parts[0]);
      const Gs = R.geo().smooth(0); px(Gs, REG.horn).at(TR(.65, .72, -.1, -.42, -1.05, 0)).loft(5, [[0, .38, .38, 0, .85], [.8, .33, .33, .3, 1], [1.05, .2, .26, .4, .8, .06, 0]], { rot: 0, cap: 'top' }).at(null); J.hornStub = Gs.mesh(TX.parts[1]); J.hornStub.visible = false; hd.add(J.hornFull, J.hornStub);
      const jw = J.jaw = grp(hd, 0, -.35, -.1), Gj = R.geo().smooth(1);
      px(Gj, REG.jaw).at(AX).loft(JS, [[0, .95, .5, 0, .9, 0, .25], [1.5, .9, .42, .45, 1, 0, .2], [2.8, .62, .3, .82, 1, 0, .15], [3.5, .34, .2, 1, .95, 0, .1]], { cap: 'both' }).at(null);
      Gj.smooth(0); for (const sx of [-1, 1]) { px(Gj, REG.horn).normal([sx, .2, .3]); for (const [z, w, l] of [[1.3, .78, .3], [2.2, .6, .34], [3.05, .4, .42]]) Gj.tri([sx * w, -.02, z + .14 * sx], [sx * w, -.02, z - .14 * sx], [sx * w * .96, -.02 + l, z], [0, 0], [1, 0], [.5, 1]); Gj.normal(null); }
      const mj = Gj.mesh(TX.parts[0]); jw.add(mj); sw.head.push(mj); J.pt.mouth = grp(hd, 0, -.55, 3.3); J.pt.head = grp(hd, 0, .5, 1.8); J.pt.hornL = grp(hd, 1.2, 2, -1.6); }
    J.pt.chest = grp(J.body, 0, -1, 3.6);
    // 尾 5 節と、先のこぶ
    { const RT = [.95, .76, .58, .43, .3, .2]; let p = J.body;
      for (let i = 0; i < 5; i++) { const s = grp(p, 0, i ? 0 : .25, i ? -LT : -3.9), m = tube(RT[i], RT[i + 1], LT, 1.4 + i * 1.1, 1.1, AXB).mesh(TX.skin[0]); s.add(m); if (i > 0 && i < 4) sw.tail.push(m);
        const Gp = R.geo(); fin(Gp, -.2, .9, RT[i] * 1.02, .85 - i * .13, -1); fin(Gp, -1.3, .85, RT[i + 1] * 1.08, .75 - i * .13, -1); s.add(Gp.mesh(TX.parts[0])); J.tail.push(s); p = s; }
      const e = J.tail[4], G = R.geo().smooth(1); px(G, REG.club).at(TR(0, 0, 0, PI, PI / 2, 0)).loft(6, [[1.9, .22, .22, 0, .85], [2.5, .62, .5, .4, 1], [3.05, .56, .46, .75, 1], [3.5, .1, .1, 1, .9]], { rot: 0, cap: 'top' }).at(null);
      G.smooth(2); cone(G, TR(.45, 0, -2.5, 0, 0, -PI / 2 - .2), .95, .2); cone(G, TR(-.45, 0, -3, 0, 0, PI / 2 - .2), .95, .2); cone(G, TR(0, 0, -3.4, 0, -PI / 2, 0), .8, .16); e.add(G.mesh(TX.parts[0]));
      const G2 = R.geo().smooth(2); cone(G2, TR(-.45, 0, -2.5, 0, 0, PI / 2 + .2), .95, .2); cone(G2, TR(.45, 0, -3, 0, 0, -PI / 2 + .2), .95, .2); cone(G2, TR(0, .4, -2.75, 0, -.3, 0), .85, .2); J.clubSpikes = G2.mesh(TX.parts[0]); e.add(J.clubSpikes);
      J.pt.tail = grp(J.tail[2], 0, .3, -1.2); J.pt.club = grp(e, 0, 0, -2.8); }
    // 足 4 本（こし → もも → すね → 足の甲）
    for (const [name, hx, hy, hz, front, off] of LEGS) { const root = grp(J.move), th = grp(root), sh = grp(th, 0, -L1, 0), ft = grp(sh, 0, -L2, 0), sx = Math.sign(hx), k = front ? 1 : 1.12;
      th.add(px(R.geo().smooth(1), REG.legA).loft(8, [[-L1 - .15, .6, .68, 0, .88], [-L1 * .5, .8 * k, .98 * k, .5, 1], [.3, .95 * k, 1.2 * k, .88, 1], [1, .5, .7, 1, .95]], { rot: 0, cap: 'top' }).mesh(TX.parts[0]));
      const Gs = px(R.geo().smooth(1), REG.legB).loft(8, [[-L2 - .1, .52, .58, 0, .88], [-L2 * .72, .4, .46, .26, .95], [-.3, .6, .72, .85, 1], [.25, .62, .74, 1, 1]], { rot: 0 });
      Gs.smooth(2); cone(Gs, TR(0, -.1, front ? -.6 : .6, 0, front ? -2 : 2, 0), .9, .2); sh.add(Gs.mesh(TX.parts[0]));
      const Gf = px(R.geo().smooth(1), REG.legC).at(TR(0, -.1, 0, 0, PI / 2, 0)).loft(8, [[-.75, .45, .3, 0, .85, 0, .1], [.2, .78, .45, .45, 1], [1.25, .88, .3, 1, 1, 0, .12]], { rot: 0, cap: 'both' }).at(null);
      Gf.smooth(2); for (const dx of [-.55, 0, .55]) cone(Gf, TR(dx, -.28, 1.15, dx * .3, PI / 2 + .3, 0), .8, .2); cone(Gf, TR(-sx * .5, -.25, -.6, -sx * 2.6, PI / 2 + .2, 0), .5, .15); ft.add(Gf.mesh(TX.parts[0]));
      J.legs.push({ name, root, th, sh, ft, front, off, hip: new THREE.Vector3(hx, hy, hz), foot: new THREE.Vector3(hx * 1.3, 0, hz + (front ? .6 : -.2)) }); J.pt['leg' + name] = grp(sh, sx * .5, -.6, .3); }
    // つばさ（右は左を鏡うつしにした物）。骨は +x へのび、まくは −z へ下がる
    for (const [name, sx] of [['L', 1], ['R', -1]]) { const side = grp(J.body); side.scale.x = sx; const rt = grp(side, 1.3, 1.5, 1.9); rt.rotation.order = 'YZX'; const fo = grp(rt, LU, 0, 0), hn = grp(fo, LF, 0, 0), XB = TR(0, 0, 0, 0, 0, -PI / 2), mem = [];
      const bone = (len, r0, r1, m = XB) => px(R.geo().smooth(1), REG.bone).at(m).loft(5, [[-.3, r0, r0, 0, .9], [len * .5, (r0 + r1) / 2, (r0 + r1) / 2, .5, 1], [len + .12, r1 * 1.15, r1 * 1.15, 1, 1.05]], { rot: 0 }).at(null);
      const pane = (...q) => { const G = R.geo().normal([0, 1, 0]); if (q.length === 4) G.quad(...q, [0, 0, 1, 1]); else for (let i = 0; i + 1 < q.length - 1; i++) G.tri(q[i + 1], q[i], q[q.length - 1], [0, 0], [1, 0], [.5, 1]); const m = G.mesh(TX.wing[0]); mem.push(m); sw.wing.push(m); return m; };
      rt.add(bone(LU, .42, .3).mesh(TX.parts[0]), pane([0, -.5, -3], [LU, -.1, -3.6], [LU, 0, 0], [0, 0, 0]));
      const Gfo = bone(LF, .3, .2); Gfo.smooth(2); cone(Gfo, TR(LF, 0, .1, 0, PI / 2, 0), .9, .16); fo.add(Gfo.mesh(TX.parts[0]), pane([0, -.1, -3.6], [LF, 0, -3.6], [LF, 0, 0], [0, 0, 0]));
      const FG = [[4.8, .08], [4.3, .62], [3.9, 1.15]], tips = FG.map(([l, a]) => [Math.cos(a) * l, 0, -Math.sin(a) * l]), Gh = R.geo().smooth(1);
      for (const [l, a] of FG) px(Gh, REG.bone).at(TR(0, 0, 0, a, 0, -PI / 2)).loft(4, [[0, .14, .14, 0, .95], [l, .04, .04, 1, 1.05]], { rot: 0 }).at(null);
      hn.add(Gh.mesh(TX.parts[0]), pane(tips[0], tips[1], tips[2], [0, 0, -3.6], [0, 0, 0]));
      J.wings[name] = { rt, fo, hn }; J.pt['wing' + name] = grp(fo, LF * .5, 0, -1.8); }
    g.userData = { kind: 'giantDragon', J, dyn: true, h: 11, cycle: 3.2 / .7, c: {}, at: (name, v) => (J.pt[name] || J.body).getWorldPosition(v),
      damage: (part, on = true) => { const k = on ? 1 : 0; if (part === 'head') { for (const m of sw.head) m.material = MT(TX.parts[k]); J.eyes.material = R.mat(TX.parts[k], { glow: true }); J.hornFull.visible = !on; J.hornStub.visible = on; } else if (part === 'wing') { for (const m of sw.wing) m.material = MT(TX.wing[k]); } else if (part === 'tail') { for (const m of sw.tail) m.material = MT(TX.skin[k]); J.clubSpikes.visible = !on; } } };
    g.traverse(n => { if (n.isMesh) n.frustumCulled = false; }); GD.pose(g, {}); return g; };

  // ================= 動き =================
  const lerpA = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const ACT = {
    // ほえる：いちど首をちぢめ、頭をつき出して口を大きくあけ、つばさを広げる
    roar: (c, k, t) => { const w = seg(k, 0, .18) * (1 - seg(k, .18, .3)), a = seg(k, .2, .32) * (1 - seg(k, .84, 1)), sh = Math.sin(t * 43) * .025 * a;
      c.n[0] += w * .12 - a * .1; c.n[1] += w * .15 - a * .15; c.n[2] += w * .12 - a * .1; c.hx += w * .3 - a * .45 + sh; c.hz += sh * 2; c.jaw += a * .85; c.bp += w * .05 - a * .12; c.by += -w * .3 + a * .2; c.lookK *= 1 - Math.max(a, w) * .85;
      for (const s of ['L', 'R']) { c.w[s] = lerpA(c.w[s], SPREAD, a); c.w[s][0] += Math.sin(t * 9 + (s === 'L' ? 0 : .5)) * .05 * a; } for (let i = 0; i < 5; i++) c.tx[i] += a * .1; },
    // 尾をふる：尾を低くのばし、体ごと 1 回転する
    tail: (c, k, t) => { const w = seg(k, 0, .25), sp = seg(k, .28, .78), a = w * (1 - seg(k, .82, 1));
      c.spin = sp * PI * 2; c.tx = lerpA(c.tx, TAILLOW, a); for (let i = 0; i < 5; i++) c.ty[i] = c.ty[i] * (1 - a) - (.26 * w * (1 - sp) + .3 * Math.sin(sp * PI)) * (i ? 1 : .6) + .22 * seg(k, .7, .84) * (1 - seg(k, .84, 1));
      c.by -= a * .3; c.n[0] += a * .3; c.n[1] += a * .15; c.hx -= a * .35; c.br += Math.sin(sp * PI) * .07; c.step = Math.max(c.step, Math.sin(sp * PI)); c.stepPh += sp * 3; c.lookK *= 1 - a;
      for (const s of ['L', 'R']) c.w[s] = lerpA(c.w[s], SPREAD, a * .3); },
    // 火をはく：胸をふくらませて息をすい、頭を下げて左右にふりながら はく
    fire: (c, k, t, o) => { const inh = seg(k, 0, .2) * (1 - seg(k, .22, .32)), a = seg(k, .24, .34) * (1 - seg(k, .86, 1)), sw = (seg(k, .3, .86) - .5) * 2, sh = Math.sin(t * 37) * .012 * a;
      c.n[0] += -inh * .15 + a * .34; c.n[1] += -inh * .2 + a * .22; c.n[2] += -inh * .2 + a * .1; c.hx += -inh * .3 - a * .2 + sh; c.jaw += inh * .12 + a * .72; c.ny += a * ((o.aim ?? 0) + sw * (o.sweep ?? .5)); c.by += inh * .2 - a * .4; c.bp += a * .1 - inh * .05; c.lookK *= 1 - Math.max(a, inh);
      for (const s of ['L', 'R']) c.w[s] = lerpA(c.w[s], SPREAD, a * .35 + inh * .2); },
    // かみつく：首を引いてから、地面の高さまで頭をふりおろす
    bite: (c, k, t, o) => { const w = seg(k, 0, .3) * (1 - seg(k, .34, .46)), a = seg(k, .36, .47) * (1 - seg(k, .56, .8)), d = o.depth ?? 1;
      c.n[0] += -w * .2 + a * 1.2 * d; c.n[1] += -w * .2 + a * .4 * d; c.n[2] += w * .1 - a * .3 * d; c.hx += w * .3 - a * 1.1 * d; c.jaw += w * .55 + a * (k < .5 ? .6 : .12); c.by -= a * .5; c.bp += a * .15 - w * .04; c.bz += a * 1 - w * .4; },
    // ひるむ：頭をはね上げて横へそらし、体を引いて前足を上げる
    flinch: (c, k, t) => { const a = Math.sin(seg(k, 0, .2) * PI / 2) * (1 - seg(k, .5, 1)), sh = Math.sin(t * 38) * (1 - k) * .03;
      c.n[0] -= a * .25; c.n[1] -= a * .3; c.n[2] -= a * .25; c.hx += a * .45; c.ny += a * .75; c.hz += a * .45 + sh; c.jaw += a * .6; c.bz -= a * 1.7; c.br += a * .1 + sh; c.by -= a * .25; c.bp -= a * .09; c.lift.FL += a * 1.4; c.fz.FL += a * .9; c.lookK *= 1 - a;
      for (const s of ['L', 'R']) { c.w[s] = lerpA(c.w[s], SPREAD, a * .7); c.w[s][0] += Math.sin(t * 16) * .12 * a; } for (let i = 0; i < 5; i++) { c.tx[i] += a * .16; c.ty[i] += Math.sin(t * 9 - i) * .1 * a; } } };
  GD.acts = Object.keys(ACT);

  const v = new THREE.Vector3();
  GD.pose = (g, o = {}) => { const J = g.userData.J, c = g.userData.c, t = o.t || 0, amt = cl(o.walkAmt ?? 0), ph = o.walk || 0, br = Math.sin(t * 1.3);
    // 1. ふだんの姿（息をする・尾がゆれる・歩く）
    c.by = br * .07 + Math.sin(ph * PI * 4) * .1 * amt; c.bz = 0; c.bp = 0; c.br = Math.sin(ph * PI * 2) * .035 * amt; c.spin = 0; c.step = 0; c.stepPh = 0; c.lookK = 1;
    c.n = [-.88 + br * .02, -.42, .4]; c.ny = 0; c.hx = .9 - br * .03; c.hz = 0; c.jaw = .05 + Math.max(0, Math.sin(t * .9)) * .06;
    c.tx = [...TAIL0]; c.ty = TAIL0.map((_, i) => Math.sin(t * .8 - i * .7) * .13 + Math.sin(ph * PI * 2 - i * .5) * .08 * amt);
    c.w = { L: [...FOLD], R: [...FOLD] }; c.w.L[0] += br * .03; c.w.R[0] += br * .03; c.lift = { FL: 0, FR: 0, BL: 0, BR: 0 }; c.fz = { FL: 0, FR: 0, BL: 0, BR: 0 };
    // 2. 技の動きを重ねる
    for (const a of o.acts || []) if (ACT[a.name] && a.k > 0 && a.k < 1) ACT[a.name](c, a.k, t, a);
    if (o.look) { c.ny += o.look[0] * c.lookK; c.hx += (o.look[1] || 0) * c.lookK; }
    if (o.low) { const q = o.low * c.lookK; c.n[0] += q * .42; c.n[1] += q * .3; c.n[2] += q * .1; c.hx -= q * .5; }
    // 3. 関節へ
    J.move.rotation.y = c.spin; J.body.position.set(0, H0 + c.by, c.bz); J.body.rotation.set(c.bp, 0, c.br);
    const ns = Math.sin(t * .55) * .24 * c.lookK; J.neck.forEach((n, i) => n.rotation.set(c.n[i], c.ny * [.2, .25, .25][i] + ns * [1, -.4, -.9][i], 0)); J.head.rotation.set(c.hx, c.ny * .3 + ns * .3, c.hz); J.jaw.rotation.x = c.jaw;
    J.tail.forEach((s, i) => s.rotation.set(c.tx[i], c.ty[i], 0));
    for (const s of ['L', 'R']) { const W = J.wings[s], w = c.w[s]; W.rt.rotation.set(w[5], w[1], w[0]); W.fo.rotation.z = w[2]; W.hn.rotation.set(0, w[4], w[3]); }
    // 4. 足：足の先を地面に置き、こしからの 2 本の骨の角度を決める
    const stride = 3.2 * amt, stepK = Math.max(amt, c.step);
    for (const L of J.legs) { const p = (((ph + c.stepPh + L.off) % 1) + 1) % 1, st = p < .7, u = (p - .7) / .3, fz = stride * (st ? .5 - p / .7 : -.5 + u) + c.fz[L.name], lift = (st ? 0 : Math.sin(u * PI) * .95 * stepK) + c.lift[L.name];
      v.copy(L.hip).applyEuler(J.body.rotation).add(J.body.position);
      const dx = L.foot.x - v.x, dy = ANK + lift - v.y, dz = L.foot.z + fz - v.z, th = Math.atan2(dx, -dy), dn = Math.hypot(dx, dy), d = cl(Math.hypot(dn, dz), .7, L1 + L2 - .02), phi = Math.atan2(dz, dn);
      const al = Math.acos(cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), kn = Math.acos(cl((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1)), s = L.front ? -1 : 1;
      L.root.position.copy(v); L.root.rotation.z = th; L.th.rotation.x = -(phi + s * al); L.sh.rotation.x = s * (PI - kn); L.ft.rotation.set(-(L.th.rotation.x + L.sh.rotation.x) + lift * .3, 0, -th); }
    g.updateMatrixWorld(true); };

  // ================= 火のいき =================
  GD.breath = (scene, texs, o = {}) => { const n = o.n || 48, ps = [], col = new THREE.Color(), C0 = new THREE.Color('#fff6c8'), C1 = new THREE.Color('#ff9a30'), C2 = new THREE.Color('#b0281c'); let cur = 0, acc = 0, sd = 0;
    for (let i = 0; i < n; i++) { const m = new THREE.SpriteMaterial({ map: texs[i % texs.length], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), s = new THREE.Sprite(m); s.visible = false; s.userData.dyn = true; scene.add(s); ps.push({ s, v: new THREE.Vector3(), age: 0, life: 1, r: 0 }); }
    return { emit(from, dir, dt, rate = 70) { acc += dt * rate; while (acc >= 1) { acc -= 1; sd++; const p = ps[cur++ % n], r = k => hash(sd, k, 31) - .5; p.age = 0; p.life = .5 + hash(sd, 1, 32) * .3; p.r = hash(sd, 2, 33) * 6;
          p.s.position.copy(from).addScaledVector(dir, hash(sd, 3, 34) * 1.2); p.v.copy(dir).multiplyScalar(19 + r(4) * 7); p.v.x += r(5) * 5; p.v.y += r(6) * 4; p.v.z += r(7) * 5; p.s.visible = true; } },
      update(dt) { for (const p of ps) { if (!p.s.visible) continue; p.age += dt; const k = p.age / p.life; if (k >= 1) { p.s.visible = false; continue; }
          p.s.position.addScaledVector(p.v, dt); p.v.multiplyScalar(1 - dt * 1.1); if (p.s.position.y < .5) { p.s.position.y = .5; p.v.y = Math.abs(p.v.y) * .3 + 2; }
          const z = .9 + k * 4.4; p.s.scale.set(z, z * 1.25, 1); p.s.material.rotation = p.r + k * 1.5; if (k < .35) col.copy(C0).lerp(C1, k / .35); else col.copy(C1).lerp(C2, (k - .35) / .65); p.s.material.color.copy(col); p.s.material.opacity = k > .65 ? (1 - k) / .35 : 1; } },
      clear() { for (const p of ps) p.s.visible = false; acc = 0; } }; };

  // ================= 狩人のつち =================
  let hamT = null;
  GD.hammer = (o = {}) => { const c = o.c || '#8a8e9c', c2 = o.c2 || '#7a5234', s = o.s || 1;
    if (!hamT) { const P = Px(32), M = ramp(c), Wd = ramp(c2), Go = ramp('#d8a838'); P.clip = true;
      for (let y = 0; y < 32; y++) for (let x = 0; x < 8; x++) P.set(x, y, y % 6 === 5 ? Wd[1] : tone(Wd, 3 + (x < 2 ? 1 : x > 5 ? -1 : 0) - ((x + y * 3) % 7 === 0 ? 1 : 0)));
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) P.block(8 + i * 8, j * 8, 8, 8, M, 3 + ((i + j) & 1), {}); for (const [x, y] of [[10, 2], [20, 5], [28, 11], [13, 12]]) { P.set(x, y, M[5]); P.set(x + 1, y + 1, M[0]); }
      for (let y = 16; y < 24; y++) for (let x = 8; x < 32; x++) P.set(x, y, y === 16 ? Go[5] : y === 23 ? Go[1] : tone(Go, 3 + ((x >> 2) & 1)));
      for (let y = 24; y < 32; y++) for (let x = 8; x < 32; x++) P.set(x, y, tone(M, y < 26 ? 5 : y > 29 ? 1 : 3 - ((x + y) % 5 === 0 ? 1 : 0))); hamT = R.tex.from(P, {}); }
    const G = R.geo().smooth(0); G.px(0, 0, 8, 32, 32, 32).loft(5, [[-.32, .03, .03, 0, .8], [.92, .026, .026, 1, 1]], { cap: 'both' });
    G.px(8, 16, 24, 8, 32, 32).loft(6, [[.7, .05, .05, 0], [.98, .05, .05, 1]], {});
    G.px(8, 0, 24, 16, 32, 32).at(TR(0, .84, 0, 0, 0, -PI / 2)).loft(6, [[-.3, .12, .12, 0, .8], [-.26, .16, .16, .06, 1], [-.08, .13, .13, .4, 1], [.08, .13, .13, .6, 1], [.26, .16, .16, .94, 1], [.3, .12, .12, 1, .8]], { cap: 'both' }).at(null);
    G.px(8, 24, 24, 8, 32, 32).loft(4, [[.96, .06, .06, 0], [1.12, .004, .004, 1, 1.2]], {});
    const g = new THREE.Group(); g.add(G.mesh(hamT)); g.scale.setScalar(s); g.userData = { kind: 'hammer', rx: PI / 2 - .1, ry: 0, rz: 0, hand: 'R', y: 0, dyn: true, tip: .9 }; return g; };
  return GD; };
