// 第 10 集 10「ボス戦：大きな竜を狩るアクション」だけで使う部品。../game-looks-7/kit.js・retro.js のあとに読み、 const BD = BOSS_10(THREE, K, R)  として使う。
// 中身は 3 つ：(1) 嵐の岩場にすむ古い雷の竜（オリジナルの「ナルカミヌシ」）と動き  (2) 据え付けの大きな弓（バリスタ）  (3) 落とし穴。作り方は giant-dragon.js を手本にしたが、形もテクスチャも別に作った。
//
// ■ 1. 竜 ── const d = BD.make({ c（はだ）, belly, mane（たてがみ）, glow（いなずまの もよう） })   つばさのない四つ足。太い首に たてがみ、うしろへ流れる 2 本の角と鼻先の刃、背に雷の結晶、むちのような長い尾の先に ふたまたの刃。正面が +z、足もとが y=0
//   大きさ：かたの高さ 3.6 m、頭の高さ 5 m ほど（5 頭身の人 1.4 m の 3.5 倍。頭を低く前へ出すので、足もとから見ても頭が見える）、鼻から尾の先まで 24 m ほど。三角形は 1000 ほど
//   形は R.geo() の loft（胴・首 2 節・頭・あご・尾 6 節・足 4 本・角）と三角（たてがみ・ほおのとげ・尾の刃）。テクスチャは手で打った 2 枚 × 2 通り（ふだん／怒り）：
//     はだ 128×64（背は重なる よろいの板、わきは なめらかな皮に いなずまの もよう、腹は白い板）／部品 128×128（頭・あご・足・角・たてがみ・結晶・尾の刃・切り口）
//   BD.pose(d, { t, walk（歩きの位相）, walkAmt, look: [左右, 上下], rage（0〜1。怒り：体を低くかまえ、息と尾が速くなる）, sink（0〜1。落とし穴に前半分がはまる）, acts: [{ name, k }, …] })
//     acts の name：'roar'（ほえる）'swipe'（前足をふり上げて たたきつける）'bite'（かみつく）'flinch'（ひるむ）'spin'（体ごと回って尾をふる）'charge'（頭を上げて雷をためる）'down'（頭を地面に落として のびる）
//   d.userData.at('head'/'mouth'/'chest'/'back'/'tail'/'tip'/'legFL'/'legFR'/'legBL'/'legBR'/'hornL', Vector3) → 世界の位置
//   d.userData.rage(true/false)   怒りの絵に入れかえる（もようと結晶が光る）      d.userData.cutTail(true/false)   尾の先（刃のある 2 節）を切り落とした形にする
//   BD.tailPiece(d) → 切れた尾の先（地面に置く Group。根もとが原点、先が −z）
//
// ■ 2. バリスタ ── const b = BD.ballista() → Group（台が y=0、うつ向きが +z）。b.userData.top（左右に回る上の部分）, .arm（上下にかたむく）, .bolt（つがえた大矢。うったら visible=false）, .muzzle（矢の先の位置を取る Group）, .pull(0〜1)（弓をひく）
// ■ 3. 落とし穴 ── const p = BD.pit({ r: 4 }) → Group。p.userData.open(0〜1)（0 は草とあみで かくした ふた、1 で黒い穴）
// ■ 4. 予告の輪 ── const w = BD.warn({ r: 2.4 }) → Mesh（地面の赤い輪。加算）。w.userData.set(強さ 0〜1, t)
window.BOSS_10 = (THREE, K, R) => {
  const { hash, mix, ramp, tone, Px, TR } = R, PI = Math.PI, BD = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = k => k * k * (3 - 2 * k), seg = (t, a, b) => ease(cl((t - a) / (b - a)));
  const AX = TR(0, 0, 0, 0, PI / 2, 0), AXB = TR(0, 0, 0, PI, PI / 2, 0);
  const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // ================= テクスチャ =================
  // よろいの板 1 枚（16×8）。1 段ごとに半分ずらす。返すのは明るさの段（−9 はふちの線）
  const plateK = (x, y) => { const row = Math.floor(y / 8), lx = (((x + (row & 1) * 8) % 16) + 16) % 16, ly = ((y % 8) + 8) % 8; if (ly === 7 || lx === 15 || (ly === 6 && (lx < 2 || lx > 12))) return -9; return (ly === 0 ? 2 : ly === 1 ? 1 : ly === 6 ? -1 : 0) + (lx === 0 ? 1 : lx === 14 ? -1 : 0) + (hash(Math.floor((x + (row & 1) * 8) / 16) & 7, row, 5) > .6 ? 1 : 0); };
  // はだ（128×64）：よこは胴まわり（0 と 127 が背、64 が腹）、たては体にそってくり返す
  function paintSkin(c, belly, glow, rage) { const P = Px(128, 64), M = ramp(c), Dk = ramp(mix(c, '#141838', .55)), Bl = ramp(belly), K0 = mix(M[0], '#080818', .5), ST = rage ? '#fffbd0' : glow, HA = rage ? '#ffd848' : mix(glow, c, .55);
    P.each((x, y) => { const ax = Math.abs(x - 63.5), j = y & 7;
      if (ax < 13) { let k = j === 0 ? 5 : j === 7 ? 0 : j < 3 ? 4 : 3; if (ax > 9) k--; if (j > 1 && j < 6 && (x * 5 + (y >> 3) * 3) % 13 === 0) k--; return k <= 0 ? K0 : tone(Bl, k); }
      if (ax < 14) return K0;
      if (ax > 41) { const k = plateK(x, y); return k === -9 ? K0 : tone(Dk, 3 + k); }
      if (ax > 40) return K0;
      let k = 3 + (ax < 22 ? 1 : 0) - (ax > 34 ? 1 : 0); if ((x * 3 + y * 5) % 7 === 0) k--; if ((x + y * 2) % 9 === 0) k++; return tone(M, k); });
    // わきの いなずまの もよう（ぎざぎざの線。下にこい線、まわりに うすい光）
    for (const sx of [-1, 1]) for (const y0 of [2, 34]) { const pts = [[39, 0], [32, 6], [35, 9], [26, 15], [29, 18], [17, 25]], X = a => Math.round(63.5 + sx * a);
      for (let i = 0; i + 1 < pts.length; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[i + 1]; for (const [dx, dy, col] of [[0, 2, K0], [1, 0, HA], [-1, 0, HA], [0, -1, HA], [0, 0, ST], [0, 1, ST]]) P.line(X(a0) + dx, y0 + b0 + dy, X(a1) + dx, y0 + b1 + dy, col); }
      for (let i = 0; i + 1 < pts.length; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[i + 1]; P.line(X(a0), y0 + b0, X(a1), y0 + b1, ST); P.line(X(a0), y0 + b0 + 1, X(a1), y0 + b1 + 1, ST); } }
    for (const [x0, y0, x1, y1] of [[20, 44, 26, 52], [100, 12, 104, 22]]) { P.line(x0 + 1, y0, x1 + 1, y1, K0); P.line(x0, y0, x1, y1, '#c8d4f0'); }
    return P; }

  const REG = { head: [0, 0, 64, 32], jaw: [64, 0, 64, 24], legA: [0, 32, 48, 22], legB: [0, 54, 48, 16], legC: [0, 70, 48, 10], horn: [0, 80, 32, 24], mane: [32, 80, 16, 24], crys: [48, 80, 16, 24], blade: [64, 80, 32, 24], stump: [96, 80, 16, 16] };
  function paintParts(c, belly, mane, glow, rage) { const P = Px(128, 128), M = ramp(c), Dk = ramp(mix(c, '#141838', .55)), Bl = ramp(belly), Hn = ramp('#d8d0e0'), Mn = ramp(mane), K0 = mix(M[0], '#080818', .5), ST = rage ? '#fffbd0' : glow, HA = rage ? '#ffd848' : mix(glow, c, .5), EYE = rage ? '#fff6a0' : '#8af0ff'; P.clip = true;
    const reg = (r, f) => { for (let j = 0; j < r[3]; j++) for (let i = 0; i < r[2]; i++) { const v = f(i, j); if (v !== undefined) P.set(r[0] + i, r[1] + j, v); } };
    const pl = (i, j, Z, add = 0) => { const k = plateK(i, j); return k === -9 ? K0 : tone(Z, 3 + k + add); };
    // 頭（上が鼻先、下が首がわ。よこは 0 と 63 がてっぺん、27〜36 が上あごの内がわ）
    reg(REG.head, (i, j) => { const m = i < 32 ? i : 63 - i;
      if (m >= 27) return j % 4 === 0 ? '#9a8ac8' : m === 27 ? '#2a1c4a' : '#5a4a8a';
      if (m === 26) return K0;
      if (m < 5) return j % 5 === 4 ? K0 : tone(Dk, 3 + (j % 5 === 0 ? 2 : 0) - (m === 4 ? 1 : 0));
      if (m > 19) return tone(M, 4 - ((i + j * 3) % 7 === 0 ? 1 : 0) + (j % 6 === 0 ? 1 : 0));
      return pl(m * 2, j, Dk, 1); });
    for (const mx of [x => x, x => 63 - x]) {
      for (let j = 1; j < 30; j += 3) { P.set(mx(25), j, Hn[5]); P.set(mx(24), j, Hn[4]); P.set(mx(25), j + 1, Hn[2]); }
      for (let j = 16; j <= 24; j++) for (let m = 9; m <= 18; m++) { const e = (j - 16) + (m - 9) * .4; if (e > 1.5 && e < 9.5) P.set(mx(m), j, K0); }
      for (let j = 18; j <= 22; j++) for (let m = 11; m <= 16; m++) if (Math.abs(j - 20) + Math.abs(m - 13.5) * .7 < 3.2) P.set(mx(m), j, Math.abs(m - 13.5) < 1 ? '#101020' : EYE);
      P.set(mx(12), 19, '#ffffff');
      for (let j = 13; j <= 26; j++) { P.set(mx(8), j, Dk[1]); P.set(mx(7), j, M[5]); }
      P.rect(Math.min(mx(6), mx(7)), 3, 2, 2, K0); P.set(mx(5), 3, M[5]);
      for (const [a0, b0, a1, b1] of [[6, 27, 11, 23], [11, 23, 9, 20], [9, 20, 14, 14]]) { P.line(mx(a0), b0 + 1, mx(a1), b1 + 1, HA); P.line(mx(a0), b0, mx(a1), b1, ST); }
    }
    // あご（上が先。よこは 0 と 63 が口の中、32 が下）
    reg(REG.jaw, (i, j) => { const m = i < 32 ? i : 63 - i;
      if (m < 5) return (j + m) % 5 === 0 ? '#8a7ac0' : '#b0a0e0';
      if (m < 13) return j % 4 === 1 ? '#7a6ab0' : m === 5 ? '#2a1c4a' : '#5a4a8a';
      if (m === 13) return K0;
      if (m < 23) return tone(M, 4 - ((i + j) % 5 === 0 ? 1 : 0));
      const q = j % 4; return m === 23 ? K0 : tone(Bl, q === 0 ? 5 : q === 3 ? 1 : 3); });
    for (const mx of [x => 64 + x, x => 127 - x]) for (let j = 2; j < 22; j += 3) { P.set(mx(12), j, Hn[5]); P.set(mx(11), j, Hn[4]); P.set(mx(12), j + 1, Hn[3]); }
    // 足（よこは 24 が前。前に白い板のすじ、まわりは よろいの板と いなずま）
    const leg = (r, sd) => reg(r, (i, j) => { const f = Math.abs(i - 23.5), q = (j + r[1]) % 6;
      if (f < 5) return q === 5 ? K0 : tone(Bl, 3 + (q === 0 ? 2 : q === 4 ? -1 : 0) - (f > 3 ? 1 : 0));
      if (f < 6) return K0; return f > 15 ? pl(i, j + r[1], Dk) : tone(M, 3 + ((i * 3 + j * 5 + sd) % 7 === 0 ? -1 : 0) + (q === 0 ? 1 : 0)); });
    leg(REG.legA, 0); leg(REG.legB, 3); leg(REG.legC, 5);
    for (const x0 of [9, 38]) { P.line(x0, 35, x0 + 3, 41, ST); P.line(x0 + 3, 41, x0, 45, ST); P.line(x0, 45, x0 + 2, 52, ST); P.line(x0 + 1, 36, x0 + 4, 42, HA); }
    // 角・きば・つめ（上が先。白むらさきに、こい輪）
    reg(REG.horn, (i, j) => { let k = 4 - (i > 20 ? 1 : 0) + (i < 9 && i > 2 ? 1 : 0) - (j % 5 === 4 ? 2 : 0) - (j > 19 ? 1 : 0); if (j < 4) return rage ? ST : Hn[5]; return tone(Hn, k); });
    // たてがみ（上が先。白い毛の束に、むらさきの先。たての毛すじ）
    reg(REG.mane, (i, j) => j < 4 ? (rage ? ST : '#b89af0') : j < 7 ? Mn[5] : tone(Mn, 4 - (i % 3 === 0 ? 2 : 0) - (j > 18 ? 1 : 0) - (i === 0 || i === 15 ? 1 : 0)));
    // 背の結晶（上が先。ふだんは くすんだ青、怒ると白く光る）
    reg(REG.crys, (i, j) => { const f = Math.abs(i - 7.5), v = (i + j * 2) % 8 < 2; if (rage) return f < 2 ? '#ffffff' : v ? '#fffbd0' : j % 6 === 0 ? '#ffd848' : '#fff090'; return f < 2 ? '#9ac8e8' : v ? '#6a9ad0' : j % 6 === 0 ? '#2a3a7a' : '#4a6ab0'; });
    // 尾の先の刃（ふたまたの ひれ。抜き色つき。上がふち）
    reg(REG.blade, (i, j) => { const e = 23 - Math.abs(Math.sin(PI * (i + .5) / 32)) * 9 - (Math.abs(i - 15.5) < 3 ? 5 - Math.abs(i - 15.5) * 1.6 : 0); if (j > e) return null; if (j > e - 1.5) return rage ? ST : '#b89af0'; if (j < 2) return Dk[1]; return (i % 5 === 0) ? Mn[2] : tone(Mn, 4 - (j < 6 ? 1 : 0)); });
    // 尾の切り口（うすい青の輪。こわくしない）
    reg(REG.stump, (i, j) => { const d = Math.hypot(i - 7.5, j - 7.5); return d < 2.5 ? '#e8f0ff' : d < 5 ? '#a8b8e0' : d < 6.2 ? '#6a7ab8' : Dk[2]; });
    return P; }

  const texCache = new Map();
  BD.tex = (c, belly, mane, glow) => { const key = [c, belly, mane, glow].join(); let t = texCache.get(key); if (!t) texCache.set(key, t = { skin: [0, 1].map(r => R.tex.from(paintSkin(c, belly, glow, r), { m: 6 })), parts: [0, 1].map(r => R.tex.from(paintParts(c, belly, mane, glow, r), { cut: true })) }); return t; };

  // ================= 形 =================
  const H0 = 3.3, L1 = 1.75, L2 = 1.6, ANK = .5, LN = 2, LT = 2.2;
  const HS = { pts: [[0, -1], [-.75, -.75], [-1, -.05], [-.8, .4], [0, .45], [.8, .4], [1, -.05], [.75, -.75]], u: [0, .14, .3, .42, .5, .58, .7, .86, 1] };
  const JS = { pts: [[0, -.25], [-.85, -.4], [-1, 0], [-.7, .8], [0, 1], [.7, .8], [1, 0], [.85, -.4]], u: [0, .1, .2, .36, .5, .64, .8, .9, 1] };
  const TAIL0 = [-.2, -.16, -.02, .12, .16, .12], TAILLOW = [-.5, -.12, .3, .2, .1, .05];
  const LEGS = [['FL', 1.75, -.75, 2.6, true, 0], ['BR', -1.45, -.55, -2.9, false, .1], ['FR', -1.75, -.75, 2.6, true, .5], ['BL', 1.45, -.55, -2.9, false, .6]];
  BD.make = (o = {}) => { const c = o.c || '#3c4c96', belly = o.belly || '#c4cce0', mane = o.mane || '#ece4f4', glow = o.glow || '#6ad8f0', TX = BD.tex(c, belly, mane, glow);
    const J = { root: new THREE.Group(), neck: [], tail: [], legs: [], pt: {} }, g = J.root, px = (G, r) => G.px(r[0], r[1], r[2], r[3], 128, 128), sk = [], pa = [], gl = [];
    const mS = G => { const m = G.mesh(TX.skin[0]); sk.push(m); return m; }, mP = G => { const m = G.mesh(TX.parts[0]); pa.push(m); return m; }, mG = G => { const m = G.mesh(R.mat(TX.parts[0], { glow: true })); gl.push(m); return m; };
    J.move = grp(g); J.body = grp(J.move, 0, H0, 0);
    // たてがみ・背びれ 1 枚（x=0 の面に立つ三角）
    const fin = (G, r, z0, len, y, hgt, dir = 1, lean = .5) => { px(G, r).normal([0, 1, .2 * dir]); G.tri([0, y - .1, z0], [0, y - .1, z0 + len * dir], [0, y + hgt, z0 + len * lean * dir - hgt * .35], [0, 0], [1, 0], [.5, 1]); G.normal(null); };
    const cone = (G, r, m, len, rad, n = 4, bend = 0) => { px(G, r).at(m).loft(n, [[0, rad, rad, 0, .85], [len * .4, rad * .78, rad * .78, .4, 1, 0, bend * .25], [len * .75, rad * .45, rad * .45, .75, 1.05, 0, bend * .65], [len, .015, .015, 1, 1.15, 0, bend]], { rot: 0 }).at(null); };
    // 胴（前が深い胸、うしろは細い腰）
    { const TOR = [[-3.8, .85, .9, 0, .85, 0, -.5], [-2.7, 1.3, 1.35, .19, .95, 0, -.3], [-.8, 1.4, 1.45, .5, 1, 0, 0], [1.2, 1.85, 2, .84, 1, 0, .15], [2.8, 1.95, 2.1, 1.1, 1, 0, .1], [4, 1.3, 1.45, 1.3, .95, 0, -.45]];
      J.body.add(mS(R.geo().smooth(1).at(AX).loft(10, TOR, { rot: 0, cap: 'both' })));
      const Gp = R.geo(); for (const [z, y, h] of [[2.9, 2.05, 1.9], [2, 1.95, 1.6], [1.1, 1.8, 1.2]]) fin(Gp, REG.mane, z, 1.3, y, h, 1); J.body.add(mP(Gp));
      // 背の雷の結晶（光る材質。怒ると白く光る）
      const Gc = R.geo().smooth(2); for (const [z, y, h, a] of [[.3, 1.5, 1.7, -.25], [-.9, 1.42, 1.4, -.35], [-2, 1.4, 1.1, -.45], [-3, 1.25, .8, -.5]]) for (const sx of [-.28, .28]) cone(Gc, REG.crys, TR(sx, y - .15, z, 0, a, -sx * .9), h, .3, 4);
      J.body.add(mG(Gc)); J.pt.back = grp(J.body, 0, 2.4, -.5); }
    const tube = (r0, r1, len, v0, vs, ax) => R.geo().smooth(1).at(ax).loft(8, [[-.4, r0 * .97, r0 * 1.08, v0, 1], [len * .5, (r0 + r1) / 2, (r0 + r1) / 2 * 1.1, v0 + vs * .55, 1], [len + .12, r1, r1 * 1.08, v0 + vs, 1]], { rot: 0 }).at(null);
    // 首 2 節（太く短い）と、高い たてがみ
    { const NR = [1.3, 1.08, .92]; let p = J.body;
      for (let i = 0; i < 2; i++) { const n = grp(p, 0, i ? 0 : .55, i ? LN : 3.7); n.add(mS(tube(NR[i], NR[i + 1], LN, i * .8, .8, AX))); const Gp = R.geo(); fin(Gp, REG.mane, .1, 1.1, NR[i] * 1.02, 2.3 - i * .3, 1); fin(Gp, REG.mane, 1.1, 1.1, NR[i + 1] * 1.08, 2.1 - i * .3, 1); n.add(mP(Gp)); J.neck.push(n); p = n; } }
    // 頭・あご・角
    { const hd = J.head = grp(J.neck[1], 0, 0, LN), G = R.geo().smooth(1);
      px(G, REG.head).at(AX).loft(HS, [[-.6, .85, .8, 0, .9], [.3, 1.35, 1.02, .22, 1, 0, -.05], [1.3, 1.15, .85, .5, 1], [2.3, .8, .6, .75, 1, 0, .1], [3, .52, .4, .93, 1, 0, .22], [3.35, .22, .2, 1, .9, 0, .36]], { cap: 'both' }).at(null);
      // ほおの とげ（左右 3 本ずつ、うしろへ開く）・上の きば
      G.smooth(0); for (const sx of [-1, 1]) { px(G, REG.horn).normal([sx, .3, -.2]); for (const [z, y, l] of [[.5, .1, 1.5], [.3, -.3, 1.2], [.1, -.65, .9]]) G.tri([sx * 1.15, y - .22, z + .3], [sx * 1.15, y + .22, z + .3], [sx * (1.25 + l * .55), y + .1, z - l], [0, 0], [1, 0], [.5, 1]);
        px(G, REG.horn).normal([sx, .1, .3]); for (const [z, w, l] of [[1.6, .95, .36], [2.2, .74, .42], [2.75, .56, .34], [3.1, .4, .5]]) G.tri([sx * w * .86, -.28, z - .15 * sx], [sx * w * .86, -.28, z + .15 * sx], [sx * w * .8, -.28 - l, z], [0, 0], [1, 0], [.5, 1]); G.normal(null); }
      // うしろへ流れて先がはね上がる 2 本の角、鼻先の刃、頭の たてがみ
      G.smooth(2); for (const sx of [-1, 1]) cone(G, REG.horn, TR(sx * .72, .62, -.1, -sx * .3, -1.75, 0), 3.4, .36, 5, -1.3);
      px(G, REG.horn).normal([1, .2, 0]); G.tri([0, .3, 1.9], [0, .25, 3.1], [0, 1.25, 2.3], [0, 0], [1, 0], [.5, 1]); G.normal(null); fin(G, REG.mane, -.5, 1.2, .78, 1.9, 1, .2);
      hd.add(mP(G));
      // 光る目
      { const Ge = R.geo(); for (const sx of [-1, 1]) { const q = (dz, up) => [sx * (.99 - up * .1), .5 + up * .2, 1.0 + dz * .42]; Ge.px(sx < 0 ? 9 : 45, 16, 10, 9, 128, 128); if (sx < 0) Ge.quad(q(-1, 1), q(-1, -1), q(1, -1), q(1, 1)); else Ge.quad(q(-1, -1), q(-1, 1), q(1, 1), q(1, -1)); } hd.add(mG(Ge)); }
      const jw = J.jaw = grp(hd, 0, -.35, -.1), Gj = R.geo().smooth(1);
      px(Gj, REG.jaw).at(AX).loft(JS, [[0, .95, .5, 0, .9, 0, .25], [1.5, .88, .42, .45, 1, 0, .2], [2.6, .56, .3, .82, 1, 0, .15], [3.15, .28, .2, 1, .95, 0, .1]], { cap: 'both' }).at(null);
      Gj.smooth(0); for (const sx of [-1, 1]) { px(Gj, REG.horn).normal([sx, .2, .3]); for (const [z, w, l] of [[1.3, .76, .3], [2.1, .58, .36], [2.8, .36, .46]]) Gj.tri([sx * w, -.02, z + .14 * sx], [sx * w, -.02, z - .14 * sx], [sx * w * .96, -.02 + l, z], [0, 0], [1, 0], [.5, 1]); Gj.normal(null); }
      jw.add(mP(Gj)); J.pt.mouth = grp(hd, 0, -.5, 3.1); J.pt.head = grp(hd, 0, .5, 1.6); J.pt.hornL = grp(hd, 1.1, 1.8, -2.4); }
    J.pt.chest = grp(J.body, 0, -1, 3.6);
    // 尾 6 節（長いむち）。先の 2 節と刃は、切り落とせる
    { const RT = [.9, .7, .52, .38, .27, .18, .1]; let p = J.body; J.tailTip = [];
      for (let i = 0; i < 6; i++) { const s = grp(p, 0, i ? 0 : .1, i ? -LT : -3.6), m = mS(tube(RT[i], RT[i + 1], LT, 1.4 + i * 1.1, 1.1, AXB)); s.add(m);
        const Gp = R.geo(); fin(Gp, REG.mane, -.3, 1, RT[i] * 1.02, .8 - i * .1, -1); const mf = mP(Gp); s.add(mf); if (i >= 4) J.tailTip.push(m, mf); J.tail.push(s); p = s; }
      const e = J.tail[5], G = R.geo(); px(G, REG.blade); for (const sy of [-1, 1]) G.quad([0, 0, -1.6], [0, 0, -4.4], [0, sy * 2.1, -5], [0, sy * 2.1, -2.4], sy > 0 ? [0, 0, 1, 1] : [1, 0, 0, 1]); const mb = G.mesh(R.mat(TX.parts[0], { vc: true, smooth: true, cut: true, side: true })); pa.push(mb); mb.userData.cutSide = true; e.add(mb); J.tailTip.push(mb);
      const Gs = R.geo(); px(Gs, REG.stump).at(AXB).loft(8, [[-.3, RT[4] * 1.05, RT[4] * 1.1, .5, 1], [-.28, .01, .01, .5, 1]], { capRect: true, cap: 'bot' }).at(null); J.stump = mP(Gs); J.stump.visible = false; J.tail[4].add(J.stump);
      J.pt.tail = grp(J.tail[2], 0, .3, -1.2); J.pt.tip = grp(J.tail[4], 0, 0, -1); }
    // 足 4 本（もも → すね → 足の甲と 3 本のつめ。ひじに とげ）
    for (const [name, hx, hy, hz, front, off] of LEGS) { const root = grp(J.move), th = grp(root), sh = grp(th, 0, -L1, 0), ft = grp(sh, 0, -L2, 0), sx = Math.sign(hx), k = front ? 1.1 : 1;
      th.add(mP(px(R.geo().smooth(1), REG.legA).loft(8, [[-L1 - .15, .5, .58, 0, .88], [-L1 * .5, .7 * k, .9 * k, .5, 1], [.3, .85 * k, 1.1 * k, .88, 1], [1, .45, .6, 1, .95]], { rot: 0, cap: 'top' })));
      const Gs = px(R.geo().smooth(1), REG.legB).loft(8, [[-L2 - .1, .46, .52, 0, .88], [-L2 * .7, .36, .42, .26, .95], [-.3, .52, .64, .85, 1], [.25, .54, .66, 1, 1]], { rot: 0 });
      Gs.smooth(2); cone(Gs, REG.horn, TR(0, -.1, front ? -.55 : .55, 0, front ? -2 : 2, 0), 1.1, .18, 4, front ? .3 : -.3); sh.add(mP(Gs));
      const Gf = px(R.geo().smooth(1), REG.legC).at(TR(0, -.1, 0, 0, PI / 2, 0)).loft(8, [[-.7, .42, .3, 0, .85, 0, .1], [.2, .74, .44, .45, 1], [1.2, .86, .3, 1, 1, 0, .12]], { rot: 0, cap: 'both' }).at(null);
      Gf.smooth(2); for (const dx of [-.55, 0, .55]) cone(Gf, REG.horn, TR(dx, -.26, 1.1, dx * .3, PI / 2 + .3, 0), .9, .2); ft.add(mP(Gf));
      J.legs.push({ name, root, th, sh, ft, front, off, hip: new THREE.Vector3(hx, hy, hz), foot: new THREE.Vector3(hx * 1.25, 0, hz + (front ? .5 : -.2)) }); J.pt['leg' + name] = grp(sh, sx * .4, -.5, .3); }
    const MP = (k, m) => m.userData.cutSide ? R.mat(TX.parts[k], { vc: true, smooth: true, cut: true, side: true }) : R.mat(TX.parts[k], { vc: true, smooth: true });
    g.userData = { kind: 'boss10', J, dyn: true, h: 5, cycle: 3.4 / .7, c: {}, at: (name, v) => (J.pt[name] || J.body).getWorldPosition(v),
      rage: on => { const k = on ? 1 : 0; for (const m of sk) m.material = R.mat(TX.skin[k], { vc: true, smooth: true, ...(on ? { emissive: '#101c40' } : {}) }); for (const m of pa) m.material = MP(k, m); for (const m of gl) m.material = R.mat(TX.parts[k], { glow: true }); },
      cutTail: on => { for (const m of J.tailTip) m.visible = !on; J.stump.visible = !!on; } };
    g.traverse(n => { if (n.isMesh) n.frustumCulled = false; }); BD.pose(g, {}); return g; };
  // 切れた尾の先（2 節と刃）。根もとが原点、先が −z
  BD.tailPiece = d => { const J = d.userData.J, TX = { s: J.tail[4].children[0].material, p: J.tail[5].children.find(m => m.userData.cutSide).material }, g = new THREE.Group();
    g.add(new THREE.Mesh(R.geo().smooth(1).at(AXB).loft(8, [[0, .28, .3, 0, 1], [2.2, .19, .2, .5, 1], [4.4, .1, .1, 1, 1]], { rot: 0, cap: 'bot' }).build(), TX.s));
    const G = R.geo(); G.px(REG.blade[0], REG.blade[1], REG.blade[2], REG.blade[3], 128, 128); for (const sy of [-1, 1]) G.quad([0, 0, -3.8], [0, 0, -6.6], [0, sy * 2.1, -7.2], [0, sy * 2.1, -4.6], sy > 0 ? [0, 0, 1, 1] : [1, 0, 0, 1]); g.add(new THREE.Mesh(G.build(), TX.p)); g.userData.dyn = true; return g; };

  // ================= 動き =================
  const lerpA = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const ACT = {
    // ほえる：首をちぢめてから頭をつき出し、口を大きくあける。たてがみごと体がふるえる
    roar: (c, k, t) => { const w = seg(k, 0, .18) * (1 - seg(k, .18, .3)), a = seg(k, .2, .32) * (1 - seg(k, .84, 1)), sh = Math.sin(t * 43) * .025 * a;
      c.n[0] += w * .2 - a * .35; c.n[1] += w * .2 - a * .3; c.hx += w * .3 - a * .35 + sh; c.hz += sh * 2; c.jaw += a * .85; c.bp += w * .06 - a * .1; c.by += -w * .3 + a * .15; c.lookK *= 1 - Math.max(a, w) * .85; for (let i = 0; i < 6; i++) c.tx[i] += a * .12; },
    // 前足をたたきつける：体を引いて左の前足を高く上げ、ふみこんで ふり下ろす
    swipe: (c, k) => { const w = seg(k, 0, .4) * (1 - seg(k, .44, .52)), a = seg(k, .45, .52) * (1 - seg(k, .7, 1));
      c.lift.FL += w * 2.6; c.fz.FL += w * .6 + a * 1.9; c.bz += -w * .7 + a * 1.1; c.bp += -w * .12 + a * .14; c.br += w * .1 - a * .08; c.by += w * .25 - a * .4; c.n[0] += -w * .15 + a * .3; c.hx += w * .2; c.jaw += w * .4; c.lookK *= 1 - a * .5; },
    // かみつく：首を引いてから、地面の高さまで頭をふりおろす
    bite: (c, k, t, o) => { const w = seg(k, 0, .3) * (1 - seg(k, .34, .46)), a = seg(k, .36, .47) * (1 - seg(k, .56, .8)), d = o.depth ?? 1;
      c.n[0] += -w * .25 + a * .75 * d; c.n[1] += -w * .2 + a * .5 * d; c.hx += w * .3 - a * .8 * d; c.jaw += w * .55 + a * (k < .5 ? .6 : .12); c.by -= a * .5; c.bp += a * .15 - w * .04; c.bz += a * 1 - w * .4; },
    // ひるむ：頭をはね上げて横へそらし、前足が うく
    flinch: (c, k, t) => { const a = Math.sin(seg(k, 0, .2) * PI / 2) * (1 - seg(k, .5, 1)), sh = Math.sin(t * 38) * (1 - k) * .03;
      c.n[0] -= a * .4; c.n[1] -= a * .35; c.hx += a * .45; c.ny += a * .7; c.hz += a * .4 + sh; c.jaw += a * .6; c.bz -= a * 1.4; c.br += a * .1 + sh; c.by -= a * .2; c.bp -= a * .1; c.lift.FL += a * 1.2; c.fz.FL += a * .8; c.lookK *= 1 - a; for (let i = 0; i < 6; i++) { c.tx[i] += a * .14; c.ty[i] += Math.sin(t * 9 - i) * .1 * a; } },
    // 尾をふる：尾を低くのばし、体ごと 1 回転する
    spin: (c, k) => { const w = seg(k, 0, .25), sp = seg(k, .28, .78), a = w * (1 - seg(k, .82, 1));
      c.spin = sp * PI * 2; c.tx = lerpA(c.tx, TAILLOW, a); for (let i = 0; i < 6; i++) c.ty[i] = c.ty[i] * (1 - a) - (.24 * w * (1 - sp) + .28 * Math.sin(sp * PI)) * (i ? 1 : .6) + .2 * seg(k, .7, .84) * (1 - seg(k, .84, 1));
      c.by -= a * .35; c.n[0] += a * .3; c.hx -= a * .3; c.br += Math.sin(sp * PI) * .07; c.step = Math.max(c.step, Math.sin(sp * PI)); c.stepPh += sp * 3; c.lookK *= 1 - a; },
    // 雷をためる：四つ足をふんばり、頭を空へ向けて ふるえる
    charge: (c, k, t) => { const a = seg(k, 0, .2) * (1 - seg(k, .85, 1)), sh = Math.sin(t * 41) * .02 * a; c.n[0] -= a * .45; c.n[1] -= a * .4; c.hx -= a * .1 - sh; c.jaw += a * .5; c.by -= a * .35; c.bp -= a * .1; c.br += sh; c.lookK *= 1 - a; for (let i = 0; i < 6; i++) c.tx[i] += a * .22; },
    // のびる：足を折って腹をつけ、頭を地面に落とす
    down: (c, k, t) => { const a = seg(k, 0, .12) * (1 - seg(k, .85, 1)); c.by -= a * 1.5; c.bp += a * .05; c.br += a * .12; c.n[0] += a * .5; c.n[1] += a * .08; c.hx -= a * .55; c.hz += a * .5; c.jaw += a * (.25 + Math.sin(t * 3) * .08); c.lookK *= 1 - a; c.tx = lerpA(c.tx, [-.1, .05, .1, .05, 0, 0], a); for (let i = 0; i < 6; i++) c.ty[i] *= 1 - a * .7; } };
  BD.acts = Object.keys(ACT);

  const v = new THREE.Vector3();
  BD.pose = (g, o = {}) => { const J = g.userData.J, c = g.userData.c, t = o.t || 0, amt = cl(o.walkAmt ?? 0), ph = o.walk || 0, rg = cl(o.rage || 0), sk = cl(o.sink || 0), br = Math.sin(t * (1.3 + rg * 2.2));
    // 1. ふだんの姿（頭を低く前へ。怒ると さらに低くかまえ、息と尾が速い）
    c.by = br * (.07 + rg * .05) + Math.sin(ph * PI * 4) * .1 * amt - rg * .3; c.bz = 0; c.bp = rg * .05; c.br = Math.sin(ph * PI * 2) * .035 * amt; c.spin = 0; c.step = 0; c.stepPh = 0; c.lookK = 1;
    c.n = [-.2 + br * .02 + rg * .1, .02 + rg * .08]; c.ny = 0; c.hx = .3 - br * .03 - rg * .12; c.hz = 0; c.jaw = .05 + Math.max(0, Math.sin(t * .9)) * .06 + rg * (.18 + Math.max(0, br) * .12);
    c.tx = [...TAIL0]; c.ty = TAIL0.map((_, i) => Math.sin(t * (.8 + rg * 2.4) - i * .7) * (.13 + rg * .16) + Math.sin(ph * PI * 2 - i * .5) * .08 * amt);
    c.lift = { FL: 0, FR: 0, BL: 0, BR: 0 }; c.fz = { FL: 0, FR: 0, BL: 0, BR: 0 };
    // 2. 技の動きを重ねる
    for (const a of o.acts || []) if (ACT[a.name] && a.k > 0 && a.k < 1) ACT[a.name](c, a.k, t, a);
    if (o.look) { c.ny += o.look[0] * c.lookK; c.hx += (o.look[1] || 0) * c.lookK; }
    // 落とし穴：前半分が しずみ、頭と前足で もがく
    if (sk > 0) { const st = Math.sin(t * 7) * sk; c.by -= sk * 1.1; c.bp += sk * .34; c.bz += sk * .6; c.n[0] -= sk * .2; c.n[1] -= sk * .1 - st * .08; c.hx -= sk * .1; c.ny += st * .25; c.jaw += sk * .45; c.br += st * .05; c.lift.FL += sk * (1.2 + st * .9); c.lift.FR += sk * (1.2 - st * .9); c.fz.FL += sk * 1.2; c.fz.FR += sk * 1.2; c.tx = lerpA(c.tx, [-.84, 0, .25, .25, 0, 0], sk); for (let i = 0; i < 6; i++) c.ty[i] = c.ty[i] * (1 - sk * .92) + Math.sin(t * 3 - i * .6) * .035 * sk; }
    // 3. 関節へ
    J.move.rotation.y = c.spin; J.body.position.set(0, H0 + c.by, c.bz); J.body.rotation.set(c.bp, 0, c.br);
    const ns = Math.sin(t * (.55 + rg * .9)) * .22 * c.lookK; J.neck.forEach((n, i) => n.rotation.set(c.n[i], c.ny * .35 + ns * [1, -.5][i], 0)); J.head.rotation.set(c.hx, c.ny * .3 + ns * .3, c.hz); J.jaw.rotation.x = c.jaw;
    J.tail.forEach((s, i) => s.rotation.set(c.tx[i], c.ty[i], 0));
    // 4. 足：足の先を地面に置き、こしからの 2 本の骨の角度を決める
    const stride = 3.4 * amt, stepK = Math.max(amt, c.step);
    for (const L of J.legs) { const p = (((ph + c.stepPh + L.off) % 1) + 1) % 1, st = p < .7, u = (p - .7) / .3, fz = stride * (st ? .5 - p / .7 : -.5 + u) + c.fz[L.name], lift = (st ? 0 : Math.sin(u * PI) * .95 * stepK) + c.lift[L.name] - (L.front ? sk * 1.6 : 0);
      v.copy(L.hip).applyEuler(J.body.rotation).add(J.body.position);
      const dx = L.foot.x - v.x, dy = ANK + lift - v.y, dz = L.foot.z + fz - v.z, th = Math.atan2(dx, -dy), dn = Math.hypot(dx, dy), d = cl(Math.hypot(dn, dz), .7, L1 + L2 - .02), phi = Math.atan2(dz, dn);
      const al = Math.acos(cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), kn = Math.acos(cl((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1)), s = L.front ? -1 : 1;
      L.root.position.copy(v); L.root.rotation.z = th; L.th.rotation.x = -(phi + s * al); L.sh.rotation.x = s * (PI - kn); L.ft.rotation.set(-(L.th.rotation.x + L.sh.rotation.x) + lift * .3, 0, -th); }
    g.updateMatrixWorld(true); };

  // ================= バリスタ（据え付けの大きな弓） =================
  let balT = null;
  BD.ballista = () => { if (!balT) { const P = Px(64, 32), W = ramp('#8a6238'), I = ramp('#7c8498'), Ro = ramp('#d8c898');
      P.each((x, y) => { if (x < 32) { const b = y % 8; return b === 7 ? W[0] : tone(W, 3 + (b === 0 ? 1 : 0) - ((x * 5 + (y >> 3) * 11) % 13 < 2 ? 1 : 0) + (x % 16 === 3 ? 1 : 0)); }
        if (x < 48) { const b = y % 8; return b === 7 ? I[0] : (x % 8 === 3 && b === 3) ? I[5] : tone(I, 3 + (b === 0 ? 2 : 0) - (x > 43 ? 1 : 0)); }
        return y < 16 ? ((x + y) % 4 < 2 ? Ro[4] : Ro[2]) : y < 20 ? '#e8ecf4' : tone(I, 4 - ((y - 20) >> 2)); }); balT = R.tex.from(P, {}); }
    const WD = G => G.px(0, 0, 32, 32, 64, 32), IR = G => G.px(32, 0, 16, 32, 64, 32), RP = G => G.px(48, 0, 16, 16, 64, 32), TP = G => G.px(48, 16, 16, 16, 64, 32), g = new THREE.Group(), beam = (G, m, len, w, h) => G.at(m).loft(4, [[0, w, h, 0, .85], [len, w, h, 1, 1]], { cap: 'both' }).at(null);
    // 台（3 本あしと、まん中の柱）
    { const G = R.geo().smooth(0); WD(G); for (let i = 0; i < 3; i++) { const a = i * PI * 2 / 3 + .5; beam(G, TR(Math.sin(a) * 1.3, 0, Math.cos(a) * 1.3, a + PI, -.95, 0), 1.75, .13, .13); } beam(G, TR(0, 0, 0), 1.25, .2, .2); IR(G).loft(8, [[1.15, .34, .34, 0, .9], [1.3, .34, .34, 1, 1]], { cap: 'both' }); g.add(G.mesh(balT)); }
    const top = grp(g, 0, 1.3, 0), arm = grp(top, 0, .12, 0);
    // 上（うつ向きに長い台木・左右の弓のうで・つる・まき上げ機）
    { const G = R.geo().smooth(0); WD(G); beam(G, TR(0, 0, -1.5, 0, PI / 2, 0), 3.6, .16, .12); for (const sx of [-1, 1]) { beam(G, TR(sx * .12, .1, 1.5, sx * 1.1, PI / 2, 0), 1.2, .09, .1); beam(G, TR(sx * 1.19, .1, 2.04, sx * 1.75, PI / 2, 0), 1.1, .07, .08); }
      IR(G); beam(G, TR(-.3, .05, -1.2, PI / 2, PI / 2, 0), .6, .09, .09); for (const z of [1.5, .2]) G.loft(4, [[-.05, .2, .1, 0], [.14, .2, .1, 1]], { cap: 'both' }).at(TR(0, 0, z)).loft(4, [[-.05, .2, .1, 0], [.14, .2, .1, 1]], { cap: 'both' }).at(null); arm.add(G.mesh(balT)); }
    const str = [-1, 1].map(sx => { const G = R.geo(); RP(G); beam(G, TR(0, 0, 0, 0, PI / 2, 0), 1, .02, .02); const m = G.mesh(balT); m.position.set(sx * 2.27, .1, 1.84); arm.add(m); return m; });
    const Gb = R.geo().smooth(0); WD(Gb); beam(Gb, TR(0, .16, -1, 0, PI / 2, 0), 2.9, .05, .05); TP(Gb).at(TR(0, .16, 1.9, 0, PI / 2, 0)).loft(4, [[0, .14, .05, 1, 1], [.7, .01, .01, 0, 1.1]], { cap: 'bot' }).at(null); const bolt = Gb.mesh(balT); arm.add(bolt);
    const muzzle = grp(arm, 0, .16, 2.6), nock = new THREE.Vector3();
    g.userData = { top, arm, bolt, muzzle, dyn: true, pull: k => { nock.set(0, .1, 1.5 - k * 1.9); for (const [i, m] of str.entries()) { const sx = i ? 1 : -1, dx = -sx * 2.27, dz = nock.z - 1.84, len = Math.hypot(dx, dz); m.scale.z = len; m.rotation.y = Math.atan2(dx, dz); } bolt.position.z = -k * 1.7 + .9; } };
    g.userData.pull(0); return g; };

  // ================= 落とし穴 =================
  let pitT = null;
  BD.pit = (o = {}) => { const r = o.r || 4;
    if (!pitT) { const P = Px(64, 128), D = ramp('#7a6a58'), Gn = ramp('#5a7a4a'); P.clip = true;
      // 上：黒い穴（ふちは くずれた土）  下：草とあみの ふた
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const d = Math.hypot(x - 31.5, y - 31.5), a = Math.atan2(y - 31.5, x - 31.5), e = 26 + Math.sin(a * 7) * 2 + Math.sin(a * 13 + 1) * 1.5;
        P.set(x, y, d > e + 4 ? null : d > e + 2 ? D[4] : d > e ? D[2] : d > e - 3 ? D[0] : d > e - 8 ? '#1c1620' : '#0c0a12');
        P.set(x, 64 + y, d > e + 3 ? null : (x % 8 === 0 || y % 8 === 0) ? '#c8b078' : (x + y) % 8 === 4 || (x - y + 64) % 8 === 4 ? '#a89060' : tone(Gn, 2 + ((x * 3 + y * 7) % 5 === 0 ? 2 : (x + y * 3) % 4 === 0 ? 1 : 0))); }
      pitT = R.tex.from(P, { cut: true }); }
    const mk = v0 => { const G = R.geo(), n = 6; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x0 = -1 + 2 * i / n, x1 = -1 + 2 * (i + 1) / n, z0 = -1 + 2 * j / n, z1 = -1 + 2 * (j + 1) / n; G.rect(i / n, v0 + (1 - (j + 1) / n) * .5, (i + 1) / n, v0 + (1 - j / n) * .5).quad([x0 * r, 0, z1 * r], [x1 * r, 0, z1 * r], [x1 * r, 0, z0 * r], [x0 * r, 0, z0 * r]); } return G.mesh(R.mat(pitT, { cut: true, offset: true })); };
    const g = new THREE.Group(), hole = mk(.5), lid = mk(0); hole.position.y = .06; lid.position.y = .09; hole.castShadow = lid.castShadow = false; g.add(hole, lid); g.userData = { dyn: true, open: k => { hole.visible = k > .02; lid.visible = k < .98; lid.scale.setScalar(1 - k * .6); lid.position.y = .09 - k * .5; } }; g.userData.open(0); return g; };
  // ================= 攻撃の予告の輪（地面に置く。赤いしまの輪） =================
  let warnT = null;
  BD.warn = (o = {}) => { const r = o.r || 2.4;
    if (!warnT) { const P = Px(64); P.each((x, y) => { const dx = x - 31.5, dy = y - 31.5, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (d > 31) return '#000000'; if (d > 26) return Math.floor((a / PI + 1) * 10) % 2 ? '#ff5a3a' : '#7a1408'; if (d > 24.5) return '#ffe0b0';
        if (d < 5) return '#ff8a5a'; return ((x + y) % 4 === 0) ? '#6a1c10' : '#2c0806'; }); warnT = R.tex.from(P, {}); }
    const G = R.geo(), n = 4; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x0 = -1 + 2 * i / n, x1 = -1 + 2 * (i + 1) / n, z0 = -1 + 2 * j / n, z1 = -1 + 2 * (j + 1) / n; G.quad([x0 * r, 0, z1 * r], [x1 * r, 0, z1 * r], [x1 * r, 0, z0 * r], [x0 * r, 0, z0 * r], [i / n, 1 - (j + 1) / n, (i + 1) / n, 1 - j / n]); }
    const m = new THREE.Mesh(G.build(), new THREE.MeshBasicMaterial({ map: warnT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.position.y = .08; m.visible = false; m.userData.dyn = true; m.renderOrder = 5;
    m.userData.set = (k, t) => { m.visible = k > .01; m.material.opacity = cl(k) * (.6 + .4 * Math.sin(t * (7 + k * 12))); m.rotation.y = t * .7; };
    return m; };
  return BD; };
