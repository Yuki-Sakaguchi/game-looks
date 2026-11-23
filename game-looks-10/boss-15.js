// 第 10 集 15「自由度の高いターン制 RPG のボス戦」用の、花と骨の大きな鳥「ムクロバナ」。kit.js・retro.js のあとに読み、 const BS = BOSS_15(THREE, K, R)  として使う。
// ■ 形：高さ 11 m ほど（s = 1 のとき。5 頭身の人の 8 倍。場面では s = .85 で 6.8 倍）。骨だけの鳥に、つたと花がからんでいる。
//   あばらのかご（すきまは抜き。中に光る「花のしん」＝弱点が見える）、ふしのある長い首、くちばしの大きな頭の骨、3 つに折れる つばさの骨と、そこから下がる葉の羽、扇の尾、かぎづめの足。
//   すべて R.geo() の loft（輪をつないだ筒）と、抜き色つきの板。箱は使わない。テクスチャは手で打った 64 ドット（骨・あばら・羽・頭の骨・花のふさ・しん）。足もとが y=0、正面が +z。
// ■ 2 つの姿：第 1 の姿は「つぼみ」（羽は青緑の葉と白いつぼみ、つばさを半分たたんで肩をいからせる、しんは青白い）。第 2 の姿は「まんかい」（羽が赤むらさきと だいだいの花びらになって光り、つばさを広げ、しんは金色）。
// ■ 使い方
//   const boss = BS.make({ s: .85, bone: 骨の色 });   scene.add(boss);
//   BS.pose(boss, { t（秒）, open（0〜1 つばさを広げる）, flap（0〜1 はばたきの大きさ）, rear（0〜1 のけぞる）, peck（0〜1 頭をつき出す）, hurt（0〜1 ひるむ）, jaw（0〜1 口をあける）, look（首を左右）, crouch（0〜1 かがむ）, glow（0〜1 しんの光） });
//   BS.form(boss, 0 か 1)   姿を切りかえる（材質のさしかえ。形は pose の open で変える）
//   boss.userData = { J（関節）, h, core（しん。getWorldPosition で弱点の位置）, form }
//   位置と向き（boss.position / rotation）は自分で動かす。
window.BOSS_15 = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, BS = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = k => k * k * (3 - 2 * k);

  // ---- 骨：たてのすじ、16 ドットごとの ふし（上が光り、下が影）、ひび、こけと小さな葉 ----
  const boneTex = c => { const P = Px(64), M = ramp(c, 6, { contrast: .95 }), V = ramp('#5c9a6a');
    P.each((x, y) => { const n = tn(x, y, 8, 16, 64, 64, 3), j = y % 16; let t = 3 + (n > .68 ? 1 : n < .3 ? -1 : 0);
      if (j === 0) t = 0; else if (j === 1) t = 5; else if (j === 2) t = 4; else if (j === 15) t = 1; else if (j === 14) t = 2; else if (x % 16 === 0 && hash(x, y >> 4, 1) > .3) t = 1; else if (x % 16 === 1 && hash(x - 1, y >> 4, 1) > .3) t = 5;
      return tone(M, t); });
    for (let k = 0; k < 7; k++) { let x = Math.floor(hash(k, 1, 4) * 64), y = Math.floor(hash(k, 2, 4) * 64); const len = 6 + Math.floor(hash(k, 3, 4) * 6); for (let i = 0; i < len; i++) { P.set(x, y, M[0]); P.set(x + 1, y, M[5]); y++; if (hash(k, i, 5) > .5) x += hash(k, i, 6) > .5 ? 1 : -1; } }
    for (let k = 0; k < 12; k++) { const x = Math.floor(hash(k, 7, 4) * 64), y = Math.floor(hash(k, 8, 4) * 64); P.set(x, y, V[3]); P.set(x + 1, y, V[2]); P.set(x, y + 1, V[1]); P.set(x + 1, y + 1, V[4]); if (k % 3 === 0) { P.set(x + 2, y, V[4]); P.set(x - 1, y + 1, V[2]); } }
    return T.from(P, { m: 2 }); };
  // ---- あばら（抜き）：8 ドットの骨と 8 ドットのすきま。x=0 が背骨と胸の骨。骨から つたが下がり、先に つぼみ（まんかいでは花） ----
  const ribTex = (c, bloom) => { const P = Px(64), M = ramp(c, 6, { contrast: .95 }), V = ramp('#4a8a66'), FL = bloom ? ['#ff5a9a', '#ffd040', '#fff0f4'] : ['#f0e0d8', '#c8e0c8', '#f0e0d8'];
    P.each((x, y) => { const n = tn(x, y, 8, 8, 64, 64, 2);
      if (x < 4 || x > 59) { const k = y % 8; return tone(M, k === 0 ? 0 : k === 1 ? 5 : k === 7 ? 1 : (x === 3 || x === 60) ? 1 : 3 + (n > .7 ? 1 : 0)); }
      const sag = Math.round(Math.sin(x / 64 * PI) * 3), j = (((y - sag) % 16) + 16) % 16; if (j > 7) return null;
      return tone(M, j === 0 || j === 7 ? 0 : j === 1 ? 5 : j === 2 ? 4 : j === 6 ? 1 : 3 + (n > .7 ? 1 : n < .25 ? -1 : 0)); });
    for (let k = 0; k < 10; k++) { const x = 7 + k * 5 + Math.floor(hash(k, 1, 9) * 3), y0 = (k % 4) * 16 + 7 + Math.round(Math.sin(x / 64 * PI) * 3), len = 5 + Math.floor(hash(k, 2, 9) * 9);
      for (let i = 0; i < len; i++) { const xx = x + Math.round(Math.sin(i * .7 + k) * 1); P.set(xx, y0 + i, V[2 + (i & 1)]); if (i % 3 === 1) P.set(xx + (i & 2 ? 1 : -1), y0 + i, V[4]); }
      const fx = x + Math.round(Math.sin(len * .7 + k)), fy = y0 + len, c1 = FL[k % 3];
      if (bloom) { P.bits(fx - 2, fy - 1, ['.c.c.', 'ccycc', '.cyc.', 'ccycc', '.c.c.'], { c: c1, y: c1 === '#ffd040' ? '#f08020' : '#ffe060' }); } else P.bits(fx - 1, fy, ['.c.', 'ccc', 'cgc', '.g.'], { c: c1, g: V[1] }); }
    return T.from(P, { m: 1, cut: true }); };
  // ---- 羽（抜き）：上が骨のつけ根、下が先。8 枚ならぶ。つぼみ＝青緑の葉、まんかい＝赤むらさきと だいだいの花びら＋花 ----
  const featherTex = bloom => { const P = Px(64), A = ramp(bloom ? '#d02e68' : '#3f8a7a'), B2 = ramp(bloom ? '#f47a24' : '#6ab08a'), Q = ramp('#efe6cc'); P.clip = true;
    for (let f = 0; f < 8; f++) { const x0 = f * 8, len = 40 + Math.floor(hash(f, 1, 2) * 23), C = f & 1 ? B2 : A;
      for (let y = 0; y < len; y++) { const k = y / len, hw = k < .1 ? 1.2 + k * 26 : k > .78 ? 3.8 * (1 - k) / .22 + .3 : 3.8;
        for (let i = 0; i < 8; i++) { const d = Math.abs(i + .5 - 4); if (d > hw) continue; const edge = d > hw - 1; P.set(x0 + i, y, edge ? C[1] : tone(C, 3 + (i < 4 ? 1 : 0) + (k > .62 ? 1 : 0) - ((y + i * 2) % 6 === 0 ? 1 : 0))); }
        if (y < len - 3) P.set(x0 + 4, y, y < len * .5 ? Q[4] : C[5]); }
      for (const q of [.22, .58]) { const fy = Math.floor(len * q) + (f % 3);
        if (bloom) P.bits(x0 + 1, fy, ['.w.w.', 'wwyww', '.yoy.', 'wwyww', '.w.w.'], { w: f & 1 ? '#fff0f4' : '#ffe890', y: '#ffe060', o: '#f08020' }); else if (q < .5 || f % 2) P.bits(x0 + 2, fy, ['.p.', 'ppp', 'pgp', '.g.'], { p: '#f4e4dc', g: '#2f6a5a' }); } }
    return T.from(P, { m: 1, cut: true }); };
  // ---- 頭の骨：左右対称（x=0 と 63 が頭のてっぺんの線、x=31・32 が下の線）。上半分（y<32）がくちばし、下半分が頭。目のくぼみ、ひび、くちばしの年輪 ----
  const skullTex = c => { const P = Px(64), M = ramp(c, 6, { contrast: .95 }), Hn = ramp('#d89a3a'), DK = '#2a1838'; P.clip = true;
    const sym = f => { for (let y = 0; y < 64; y++) for (let a = 0; a < 32; a++) { const col = f(a, y); if (col) { P.set(a, y, col); P.set(63 - a, y, col); } } };
    sym((a, y) => { const n = tn(a, y, 8, 8, 32, 64, 5);
      if (y < 31) { let t = 3 + (a < 2 ? 2 : a < 9 ? 1 : a > 25 ? -2 : a > 20 ? -1 : 0); if (y % 7 === 6) t -= 1; if (y < 7) t -= 2; else if (y < 10 && ((a + y) & 1)) t -= 1; if (n > .74) t += 1; return tone(Hn, t); }
      if (y < 35) return y === 31 ? Hn[0] : y === 32 ? M[5] : y === 33 ? M[2] : M[1];
      let t = 3 + (a < 3 ? 1 : a > 26 ? -2 : a > 22 ? -1 : 0) + (n > .7 ? 1 : n < .26 ? -1 : 0); if (y > 60) t -= 2; return tone(M, t); });
    // 目のくぼみ（こい紫。上にまゆの骨の光）、鼻のあな、歯のようなぎざぎざ
    sym((a, y) => { const d = Math.hypot(a - 15, (y - 45) * .95); if (d < 5) return d < 3.4 ? '#160c20' : DK; if (d < 6.2) return y < 45 ? M[5] : M[1];
      if (y > 26 && y < 30 && a > 6 && a < 10) return Hn[0]; if (y > 36 && y < 60 && a >= 29 && (y % 4 < 2)) return M[0]; if (y > 4 && y < 31 && a === 28) return Hn[0]; return null; });
    // ひび
    for (let k = 0; k < 5; k++) { let a = 1 + Math.floor(hash(k, 1, 6) * 9), y = 37 + Math.floor(hash(k, 2, 6) * 12); for (let i = 0; i < 9; i++) { for (const x of [a, 63 - a]) { if (k % 2 && x > 32) continue; P.set(x, y, M[0]); P.set(x + 1, y, M[5]); } y++; if (hash(k, i, 7) > .45) a += 1; } }
    return T.from(P, { m: 1 }); };
  // ---- 花のふさ（抜き。32 ドット）：下から くきが のび、先に つぼみ（まんかいでは花） ----
  const tuftTex = bloom => { const P = Px(32), V = ramp('#3f8a66'), FL = ['#ff5a9a', '#fff0f4', '#ffd040']; P.clip = true;
    for (let s = 0; s < 7; s++) { const x = 3 + s * 4 + Math.floor(hash(s, 1, 1) * 2), h = 13 + Math.floor(hash(s, 2, 1) * 13); let xx = x;
      for (let j = 0; j < h; j++) { xx = x + Math.round(Math.sin(j * .4 + s)); P.set(xx, 31 - j, V[2 + (j & 1)]); if (j % 5 === 2) { P.set(xx + 1, 31 - j, V[4]); P.set(xx + 2, 30 - j, V[3]); } if (j % 5 === 4) { P.set(xx - 1, 31 - j, V[4]); P.set(xx - 2, 30 - j, V[1]); } }
      const c1 = FL[s % 3]; if (bloom) P.bits(xx - 2, 29 - h, ['.c.c.', 'ccycc', '.cyc.', 'ccycc', '.c.c.'], { c: c1, y: c1 === '#ffd040' ? '#f08020' : '#ffe060' }); else P.bits(xx - 1, 29 - h, ['.c.', 'ccc', 'cgc'], { c: '#f4e4dc', g: V[1] }); }
    return T.from(P, { m: 1, cut: true }); };
  // ---- 花のしん（弱点。光る材質）：花びらの輪が重なる。まん中が白 ----
  const coreTex = bloom => { const P = Px(32), A = bloom ? ['#fff8c0', '#ffd040', '#ff8a3a', '#e8407a'] : ['#f4fff8', '#a8f0e0', '#58c8c0', '#3a8aa8'];
    P.each((x, y) => { const u = (x % 16) - 7.5, v = (y % 16) - 7.5, d = Math.hypot(u, v), a = Math.atan2(v, u), pet = Math.cos(a * 5) * 1.6; return d < 2.2 ? '#ffffff' : d < 4.6 + pet * .5 ? A[0] : d < 6.6 + pet ? A[1] : d < 8.6 + pet ? A[2] : A[3]; });
    return T.from(P, { m: 1 }); };

  BS.make = (o = {}) => { const bone = o.bone || '#e6dcc0', s = o.s || 1;
    const tB = boneTex(bone), tS = skullTex(bone), M2 = (a, b, q = {}) => [R.mat(a, { vc: true, smooth: true, ...q }), R.mat(b, { vc: true, smooth: true, ...q })];
    const mRib = M2(ribTex(bone, 0), ribTex(bone, 1), { side: true }), mFea = [R.mat(featherTex(0), { vc: true, smooth: true, side: true }), R.mat(featherTex(1), { vc: true, side: true, glow: true })], mTuf = [R.mat(tuftTex(0), { vc: true, smooth: true, side: true }), R.mat(tuftTex(1), { vc: true, side: true, glow: true })];
    const mCore = [new THREE.MeshBasicMaterial({ map: coreTex(0), fog: false }), new THREE.MeshBasicMaterial({ map: coreTex(1), fog: false })], mEye = new THREE.MeshBasicMaterial({ color: '#8af0e0', fog: false, side: THREE.DoubleSide });
    const grp = (p, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (p) p.add(g); return g; };
    const J = { root: new THREE.Group() }, swap = [];
    const done = (j, G, t) => { if (!G.count()) return null; const m = G.mesh(t); j.add(m); return m; }, done2 = (j, G, ms, shadow = true) => { if (!G.count()) return null; const m = G.mesh(ms[0]); m.castShadow = shadow; j.add(m); swap.push([m, ms]); return m; };
    const bn = (G, n, rings, q = {}) => G.loft(n, rings.map(([y, rx, rz, cc = 1, ox = 0, oz = 0]) => [y, rx, rz ?? rx, y / 2, cc, ox, oz]), { ur: 1, ...q });
    J.root.scale.setScalar(s);
    // 体：あばらのかご（すきまから中が見える）。下に こしの骨、上に かたの骨。前へかたむく
    J.body = grp(J.root, 0, 4.5, 0);
    { const G = R.geo().smooth(1), Gb = R.geo().smooth(1), RB = [[-1.9, .6, .7, .7], [-1.1, 1.55, 1.7, .82], [.1, 2, 2.15, .95], [1.3, 1.8, 1.85, 1.02], [2.1, 1.15, 1.15, 1.08], [2.5, .6, .6, 1.1]];
      G.loft(10, RB.map(([y, rx, rz, cc]) => [y, rx, rz, (y + 1.9) / 4.4, cc]), { ur: 2 });
      bn(Gb, 6, [[-2.5, .3, .3, .7], [-2, .75, .85, .82], [-1.4, 1.25, 1.4, .95], [-1.25, .9, 1, 1]], { cap: 'both' }); bn(Gb, 6, [[2.05, 1.2, 1.2, .95], [2.45, .8, .8, 1.02], [2.95, .5, .5, 1.08]], { cap: 'both' });
      done2(J.body, G, mRib); done(J.body, Gb, tB); }
    // 花のしん（弱点）
    J.core = grp(J.body, 0, .2, .15);
    { const G = R.geo().smooth(1); G.loft(6, [[-1.05, .05, .05, 0], [-.7, .78, .78, .25], [0, 1.08, 1.08, .5], [.7, .78, .78, .75], [1.05, .05, .05, 1]], { ur: 3 }); const m = new THREE.Mesh(G.build(), mCore[0]); J.core.add(m); swap.push([m, mCore]); }
    // 首もとの花のえり
    { const G = R.geo().smooth(2); G.loft(8, [[2.25, 1.15, 1.15, 0, .85], [3.25, 2.05, 2.05, 1, 1.1]], { ur: 4 }); done2(J.body, G, mTuf, false); }
    // 首：ふしの ならぶ骨が 3 本つながる
    const neckSeg = j => { const G = R.geo().smooth(1); bn(G, 6, [[-.1, .5, .5, .85], [.18, .36, .36, .9], [.42, .5, .5, 1], [.66, .34, .34, .92], [.9, .47, .47, 1], [1.1, .33, .33, .95], [1.3, .42, .42, 1.05]], {}); done(j, G, tB); };
    J.neck1 = grp(J.body, 0, 2.6, .3); neckSeg(J.neck1); J.neck2 = grp(J.neck1, 0, 1.25, 0); neckSeg(J.neck2); J.neck3 = grp(J.neck2, 0, 1.25, 0); neckSeg(J.neck3);
    // 頭：頭の骨（+z へのびる loft）。かぎ形のくちばし、下あご、光る目、花のとさか
    J.head = grp(J.neck3, 0, 1.3, 0);
    { const G = R.geo().smooth(1).at(TR(0, 0, 0, 0, PI / 2, 0)); G.loft(8, [[-.85, .3, .3, 0, .8], [-.45, .72, .64, .1, .92], [.2, .82, .72, .3, 1], [.75, .64, .56, .44, 1.02], [1.1, .44, .42, .5, 1.05, 0, .04], [1.9, .31, .29, .72, 1.05, 0, .14], [2.5, .17, .15, .9, 1, 0, .4], [2.85, .03, .03, 1, .9, 0, .78]], { cap: 'bot', capUV: [.5, .02] }); done(J.head, G, tS);
      J.jaw = grp(J.head, 0, -.42, .55); const Gj = R.geo().smooth(1).at(TR(0, 0, 0, 0, PI / 2, 0)).rect(0, .52, 1, .98); Gj.loft(6, [[0, .46, .2, 0, .8], [.9, .3, .14, .5, .9], [1.75, .1, .07, 1, .85, 0, -.08]], { cap: 'both', capUV: [.5, .1] }); done(J.jaw, Gj, tS);
      const Ge = R.geo(); for (const sx of [1, -1]) Ge.quad([sx * .8, -.22, .5], [sx * .8, -.22, -.02], [sx * .8, .26, -.02], [sx * .8, .26, .5]); J.eyes = new THREE.Mesh(Ge.build(), mEye); J.head.add(J.eyes);
      const Gt = R.geo(); for (const a of [-.55, 0, .55]) Gt.at(TR(0, .5, -.1, 0, -.2, a)).quad([0, 0, -.9], [0, 0, .9], [0, 1.5, .9], [0, 1.5, -.9]); J.crest = done2(J.head, Gt, mTuf, false); }
    for (const [n, sx] of [['L', 1], ['R', -1]]) {
      // つばさ：3 本の骨と、そこから下がる羽の板
      const W1 = J['wing' + n] = grp(J.body, sx * 1.5, 1.6, -.3), W2 = J['wing' + n + '2'] = grp(W1, sx * 2, 0, 0), W3 = J['wing' + n + '3'] = grp(W2, sx * 2.4, 0, 0), along = TR(0, 0, 0, 0, 0, -sx * PI / 2);
      const sheet = (G, len, drop, sway, u0) => G.quad([0, -drop, -.04], [sx * (len + sway), -drop, -.04], [sx * len, 0, -.04], [0, 0, -.04], sx > 0 ? [u0, 0, u0 + len / 4.4, 1] : [u0 + len / 4.4, 0, u0, 1], [.85, .85, 1.05, 1.05]);
      { const G = R.geo().smooth(1).at(along), Gf = R.geo(); bn(G, 5, [[-.2, .36, .36, .9], [.3, .22, .22, .95], [1.7, .18, .18, 1], [2.05, .3, .3, 1.05]], { cap: 'both' }); sheet(Gf, 2, 2.7, .5, 0); done(W1, G, tB); done2(W1, Gf, mFea); }
      { const G = R.geo().smooth(1).at(along), Gf = R.geo(); bn(G, 5, [[-.1, .3, .3, .9], [.3, .19, .19, .95], [2.1, .15, .15, 1], [2.45, .26, .26, 1.05]], { cap: 'both' }); sheet(Gf, 2.4, 3.3, .9, .12); done(W2, G, tB); done2(W2, Gf, mFea); }
      { const G = R.geo().smooth(1).at(along), Gf = R.geo(); bn(G, 5, [[-.1, .26, .26, .9], [.4, .15, .15, .95], [1.5, .1, .1, 1], [2, .03, .03, 1.05]], { cap: 'both' }); sheet(Gf, 1.9, 3.5, 1.7, .3); done(W3, G, tB); done2(W3, Gf, mFea); }
      // 足：もも・すね・かぎづめ（前に 3 本、うしろに 1 本）
      const Lg = J['leg' + n] = grp(J.root, sx * 1.15, 3.2, -.3), Sh = J['shin' + n] = grp(Lg, 0, -1.7, 0), Ft = J['foot' + n] = grp(Sh, 0, -1.8, 0);
      { const G = R.geo().smooth(1), Gf = R.geo().smooth(2); bn(G, 5, [[-1.75, .27, .27, .8], [-1.5, .36, .36, .85], [-.9, .34, .38, .92], [0, .5, .56, 1], [.35, .3, .3, 1]], { cap: 'both' }); Gf.loft(6, [[.2, .45, .5, 1, 1], [-1.15, .82, .9, .45, .9]], { ur: 1 }); done(Lg, G, tB); done2(Lg, Gf, mFea, false); }
      { const G = R.geo().smooth(1); bn(G, 5, [[-1.85, .2, .2, .8], [-1.55, .3, .3, .85], [-.4, .19, .19, .95], [.1, .3, .3, 1]], { cap: 'both' }); done(Sh, G, tB); }
      { const G = R.geo().smooth(1); for (const [ry, len] of [[0, 1.5], [.55, 1.3], [-.55, 1.3], [PI, .9]]) { G.at(TR(0, 0, 0, ry, PI / 2 - .12, 0)); bn(G, 4, [[0, .22, .17, .85], [len * .6, .15, .12, 1], [len * .85, .1, .09, 1.05, 0, .05], [len, .02, .02, .7, 0, .3]], {}); } done(Ft, G, tB); } }
    // 尾：扇のように ひらく長い羽
    J.tail = grp(J.body, 0, -1.6, -1.2);
    { const G = R.geo(); for (const a of [-.9, -.45, 0, .45, .9]) { G.at(TR(0, 0, 0, a, 1.05, 0)); G.quad([-.62, -4.4 + Math.abs(a) * .8, 0], [.62, -4.4 + Math.abs(a) * .8, 0], [.5, 0, 0], [-.5, 0, 0], [.125 * (2 + Math.round(a * 2)), 0, .125 * (5 + Math.round(a * 2)), 1], [.8, .8, 1, 1]); } done2(J.tail, G, mFea); }
    const g = new THREE.Group(); g.add(J.root); g.userData = { J, h: 11.2 * s, core: J.core, swap, form: 0, s };
    BS.pose(g, {}); return g; };

  BS.form = (g, k) => { g.userData.form = k; for (const [m, ms] of g.userData.swap) m.material = ms[k]; g.userData.J.eyes.material.color.set(k ? '#ffd040' : '#8af0e0'); };

  BS.pose = (g, p = {}) => { const J = g.userData.J, { t = 0, open = 0, flap = 0, rear = 0, peck = 0, hurt = 0, jaw = 0, look = 0, crouch = 0, glow = 0 } = p, br = Math.sin(t * 1.4), o = ease(cl(open)), sh = Math.sin(t * 31) * hurt;
    J.body.position.y = 4.5 + br * .06 - crouch * .55 + rear * .25; J.body.rotation.set(.35 - rear * .5 + peck * .35 - hurt * .22 + crouch * .2, look * .25, Math.sin(t * .7) * .03 + sh * .04);
    J.neck1.rotation.set(-.75 + br * .04 + rear * .3 - peck * .15 - hurt * .3 + crouch * .2, look * .35, sh * .05); J.neck2.rotation.set(.3 + peck * .5 - rear * .15 + crouch * .3, look * .3, 0); J.neck3.rotation.set(.5 + peck * .55 + br * .05 - rear * .35 + crouch * .2, 0, 0);
    J.head.rotation.set(peck * .3 - rear * .5 + hurt * .35 + Math.sin(t * .9) * .05, look * .5, Math.sin(t * 1.1) * .06 + sh * .08); J.jaw.rotation.x = .1 + jaw * .62;
    for (const [n, s] of [['L', 1], ['R', -1]]) { const f = Math.sin(t * 5.2 + (s > 0 ? 0 : .35)) * flap;
      J['wing' + n].rotation.set(0, s * (.4 * (1 - o) - .1 * o), s * (.2 + o * .2 + f * .3 + br * .03 - hurt * .2)); J['wing' + n + '2'].rotation.set(0, 0, s * (-1.15 + o * .95 + f * .28)); J['wing' + n + '3'].rotation.set(0, 0, s * (-.9 + o * .7 + f * .3));
      const th = -.6 - crouch * .28 + rear * .12, sn = 1 + crouch * .55 - rear * .2; J['leg' + n].rotation.x = th; J['shin' + n].rotation.x = sn; J['foot' + n].rotation.x = -(th + sn); }
    J.tail.rotation.x = -.15 + br * .04 + rear * .3 - o * .3; J.core.scale.setScalar(1 + Math.sin(t * 4) * .05 + glow * .22); J.core.rotation.y = t * .6;
    if (J.crest) J.crest.scale.setScalar(g.userData.form ? 1.25 : .9); };
  return BS;
};
