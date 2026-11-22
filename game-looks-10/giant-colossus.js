// 第 10 集 05「巨大な像によじのぼって戦う」用の、動く石の巨人「コケオイ」。kit.js・retro.js のあとに読み、 const GC = GIANT_COLOSSUS(THREE, K, R)  として使う。
// ■ 形：高さ 32 m ほど（5 頭身の人の 23 倍）。前かがみの胴、地面にとどく長いうで、ラッパのように広がる足。背中には立て石の列、頭には折れた石柱が 2 本。
//   石の所は「大きな切り石の目地・ひび・こけ」、つかまれる所（足の外がわ・背中・頭のうしろ）は「毛」のテクスチャ。頭のてっぺんに光る弱点のもよう。
//   すべて R.geo() の loft（輪をつないだ筒）。箱は使わない。足もとが y=0、正面が +z。
// ■ 使い方
//   const col = GC.make({ c: 石の色, moss: こけの色, fur: 毛の色, eye: 光の色 });   scene.add(col);
//   GC.pose(col, { ph（歩きの位相）, walk（0〜1 歩きの大きさ）, t（秒）, look（首を左右）, nod（首を下へ）, shake（0〜1 体をふる）, rear（0〜1 のけぞる）, glow（0〜1.5 弱点の光） });
//   col.userData = { J（関節）, h, hipY, stride（位相 2π で進む長さ m）, sigil（弱点の光る板）, eyes, top: [x, y, z]（頭の関節の中の、てっぺんの位置） }
//   位置と向き（col.position / rotation）は自分で動かす。足が着くのは、左が ph = π/2、右が ph = 3π/2 のとき。
window.GIANT_COLOSSUS = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, GC = {}, VS = 8, VF = 4;
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // ---- 石：大きな切り石（4 段）。目地のかげ、上のふちの光、ひび、上からたれるこけ ----
  const stoneTex = (c, mossC) => { const P = Px(64), M = ramp(c, 6, { contrast: .95 }), S = ramp(mossC);
    const rows = [[0, 15, [0, 22, 40]], [15, 18, [10, 34, 52]], [33, 13, [4, 20, 44]], [46, 18, [14, 30, 56]]];
    for (const [y0, h, xs] of rows) xs.forEach((x0, i) => { const w = ((xs[(i + 1) % xs.length] - x0 + 64) % 64) || 64, k = 2 + (hash(x0, y0, 3) > .5 ? 1 : 0), sd = (x0 + y0 * 7) % 9;
      for (let j = 0; j < h; j++) for (let q = 0; q < w; q++) { const x = x0 + q, y = y0 + j, n = tn(x, y, 8, 8, 64, 64, sd); let t = k;
        if (j === 0 || q === 0) t = 0; else if (j === 1 || q === 1) t = k + 1; else if (j === h - 1 || q === w - 1) t = k - 1; else if (n > .68) t = k + 1; else if (n < .3 && ((x + y) & 1)) t = k - 1;
        P.set(x, y, tone(M, t)); }
      // かどの欠け
      if (hash(x0, y0, 5) > .4) { P.rect(x0 + w - 3, y0 + 1, 3, 2, M[0]); P.set(x0 + w - 4, y0 + 1, M[1]); P.set(x0 + w - 3, y0 + 3, tone(M, k + 1)); }
      // ひび（ぎざぎざの線と、となりの光）
      if (hash(x0, y0, 6) > .35) { let cx = x0 + 4 + Math.floor(hash(x0, y0, 7) * (w - 8)); for (let j = 2; j < h - 2; j++) { if (hash(cx, j, 8) > .55) cx += hash(cx, j, 9) > .5 ? 1 : -1; P.set(cx, y0 + j, M[0]); P.set(cx + 1, y0 + j, tone(M, k + 1)); if (j > h * .6 && hash(j, x0, 2) > .6) break; } }
      // こけ：目地の上から たれる
      for (let q = 1; q < w; q++) { const x = x0 + q, len = Math.floor((hash(x >> 1, y0, 11) - .35) * 9); for (let j = 0; j < len; j++) P.set(x, y0 + j, S[j === 0 ? 1 : j >= len - 1 ? 4 : 2 + ((x + j) & 1)]); } });
    // こけの大きなかたまり
    P.each((x, y) => { const n = tn(x, y, 16, 16, 64, 64, 4); if (n > .74) return S[n > .84 ? 3 : 2 + ((x + y) & 1)]; if (n > .7 && ((x + y) & 1)) return S[1]; });
    return T.from(P, { m: VS }); };
  // ---- 毛：4 段に重なる房。先が明るく、根もとが暗い ----
  const furTex = c => { const P = Px(64), F = ramp(c, 6); P.fill(F[1]);
    for (let tier = 0; tier < 4; tier++) for (let x = 0; x < 64; x++) { const len = 13 + Math.floor(hash(x >> 1, tier, 5) * 8), y0 = tier * 16 + Math.floor(hash(x >> 2, tier, 8) * 4);
      for (let j = 0; j < len; j++) { const k = j / len; P.set(x, y0 + j, tone(F, ((x >> 1) & 1 ? 2 : 3) + (k > .72 ? 1 : k < .22 ? -1.2 : 0) + (hash(x >> 1, tier, 2) > .78 ? 1 : 0))); }
      P.set(x, y0 + len, F[0]); if (hash(x, tier, 3) > .5) P.set(x, y0 + len + 1, F[0]); }
    return T.from(P, { m: VF }); };
  // ---- 彫りの絵：顔（0,0 32×32）／かざり帯（0,32 64×12）／足のつま石（0,44 64×20） ----
  const carveTex = (c, mossC, eye) => { const P = Px(64), M = ramp(c, 6, { contrast: .95 }), S = ramp(mossC), K0 = M[0]; P.clip = true;
    // 顔：切り石の面に、まるい 2 つのくぼみ（奥が光る）、ひたいのたての線、口のかわりの 5 本のみぞ
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const n = tn(x, y, 8, 8, 32, 32, 2), jt = y === 21 || (y < 21 && (x === 5 || x === 26)) || (y > 21 && (x === 10 || x === 21)); P.set(x, y, jt ? M[1] : tone(M, 3 + (n > .7 ? 1 : n < .28 && ((x + y) & 1) ? -1 : 0))); }
    P.rect(0, 0, 32, 3, M[1]); P.rect(0, 3, 32, 1, M[4]); for (let x = 0; x < 32; x++) { const len = Math.floor(hash(x >> 1, 4, 1) * 5); for (let j = 0; j < len; j++) P.set(x, j, S[j === len - 1 ? 4 : 2 + ((x + j) & 1)]); }
    P.rect(15, 5, 1, 15, M[5]); P.rect(16, 5, 1, 15, M[1]);
    for (const ex of [8.5, 23.5]) { P.disc(ex, 12.5, 5.5, M[1]); P.disc(ex, 12.5, 4.6, K0); P.disc(ex, 13, 3, mix(eye, '#0c1820', .55)); P.disc(ex, 13, 1.6, eye); P.set(ex - 1, 12, '#ffffff'); for (let a = 0; a < 5; a++) P.set(ex - 4 + a * 2, 7, M[5]); }
    P.line(27, 15, 29, 20, K0); P.line(29, 20, 27, 26, K0); P.line(28, 15, 30, 20, M[5]);
    for (let i = 0; i < 5; i++) { P.rect(5 + i * 5, 24, 2, 6, K0); P.rect(7 + i * 5, 24, 1, 6, M[5]); }
    P.rect(0, 31, 32, 1, M[1]);
    // 光る色の見本
    P.rect(32, 0, 32, 32, eye);
    // かざり帯：上下のふちと、かぎ形のくり返し
    for (let x = 0; x < 64; x++) { for (let y = 32; y < 44; y++) P.set(x, y, tone(M, 2 + ((x >> 3) & 1 ? 0 : 1))); P.set(x, 32, M[5]); P.set(x, 33, K0); P.set(x, 42, K0); P.set(x, 43, M[1]); }
    for (let i = 0; i < 8; i++) { const x = i * 8; P.rect(x + 1, 35, 6, 1, K0); P.rect(x + 1, 35, 1, 5, K0); P.rect(x + 1, 40, 4, 1, K0); P.rect(x + 4, 37, 1, 3, K0); P.rect(x + 2, 36, 5, 1, M[5]); P.rect(x + 2, 36, 1, 4, M[5]); }
    // つま石：たてに長い石が ならぶ（上が丸く、すきまが暗い）
    for (let i = 0; i < 8; i++) { const x = i * 8, k = 2 + (i * 5 % 3 === 0 ? 1 : 0); for (let y = 44; y < 64; y++) for (let q = 0; q < 8; q++) { const n = tn(x + q, y, 8, 8, 64, 64, 6); P.set(x + q, y, q === 0 || y === 44 ? K0 : q === 1 || y === 45 ? tone(M, k + 1) : q === 7 ? tone(M, k - 1) : y > 60 ? M[1] : tone(M, k + (n > .7 ? 1 : 0))); }
      P.set(x + 1, 45, K0); P.set(x + 7, 45, K0); for (let j = 0; j < Math.floor(hash(i, 3, 3) * 6); j++) P.set(x + 3 + (j & 1), 46 + j, S[2 + (j & 1)]); }
    return T.from(P, { m: 1 }); };
  // ---- 弱点のもよう（抜き。光る材質ではる）：二重の輪、ひし形、4 本のすじ、まん中の白 ----
  const sigilTex = eye => { const P = Px(32), W = '#ffffff', E2 = mix(eye, '#ffffff', .5); P.clip = true;
    P.each((x, y) => { const d = Math.hypot(x - 15.5, y - 15.5), ax = Math.abs(x - 15.5), ay = Math.abs(y - 15.5); if (d < 3) return W; if (d > 12 && d < 14.2) return d < 13 ? E2 : eye; if (d > 6.6 && d < 8) return eye; if (Math.abs(ax + ay - 10.5) < .8) return E2; if ((ax < 1 || ay < 1) && d < 12 && d > 3.6) return ((x + y) & 1) ? eye : E2; return null; });
    return T.from(P, { m: 1, cut: true }); };

  // ---- 目の奥の光（抜き。顔と同じ割りで重ねる） ----
  const eyeTex = eye => { const P = Px(32); P.clip = true; for (const ex of [8.5, 23.5]) { P.disc(ex, 13, 3, mix(eye, '#103038', .45)); P.disc(ex, 13, 1.7, eye); P.set(ex - 1, 12, '#ffffff'); } return T.from(P, { m: 1, cut: true }); };
  GC.make = (o = {}) => { const c = o.c || '#8f8878', mossC = o.moss || '#5c7c48', furC = o.fur || '#8a8446', eye = o.eye || '#7af0e0';
    const tS = stoneTex(c, mossC), tF = furTex(furC), tC = carveTex(c, mossC, eye), tG = sigilTex(eye), mGlow = new THREE.MeshBasicMaterial({ map: tG, alphaTest: .5, fog: false }), mEye = new THREE.MeshBasicMaterial({ map: eyeTex(eye), alphaTest: .5, fog: false });
    const grp = (p, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (p) p.add(g); return g; };
    // 石の筒：輪は [y, 半径x, 半径z, 明るさ, ずれx, ずれz]。テクスチャは 8 m で 1 枚
    const st = (G, n, rings, q = {}) => G.loft(n, rings.map(([y, rx, rz, cc = 1, ox = 0, oz = 0]) => [y, rx, rz ?? rx, y / VS, cc, ox, oz]), { ur: Math.max(1, Math.round(rings.reduce((a, r) => a + r[1], 0) / rings.length * 6.28 / VS)), ...q });
    // 毛の帯：石の筒の外がわに、k 面ぶんだけ かぶせる（off は はじまりの頂点）
    const fur = (G, n, rings, off, k, grow = 1.05) => G.loft(n, rings.map(([y, rx, rz, cc = 1, ox = 0, oz = 0]) => [y, rx * grow + .1, (rz ?? rx) * grow + .1, y / VF, cc * 1.05, ox, oz]), { rot: off, seg: [0, k], ur: Math.max(1, Math.round(rings[0][1] * 6.28 / VF)) });
    // かざり帯
    const band = (G, n, y, rx, rz, h = 1.1) => G.px(0, 32, 64, 12, 64, 64).loft(n, [[y, rx + .12, rz + .12, 0, .95], [y + h, rx + .12, rz + .12, 1, 1.05]], {});
    const J = { root: new THREE.Group() }, HIP = 12, parts = [];
    const done = (j, ...gs) => { for (const [G, t] of gs) if (G.count()) { const m = G.mesh(t); j.add(m); parts.push(m); } };
    J.move = grp(J.root); J.hips = grp(J.move, 0, HIP + 1.2, 0);
    // 腰
    { const G = R.geo().smooth(0), Gc = R.geo().smooth(0); st(G, 8, [[-3.2, 3, 2.5, .7], [-1.4, 5.6, 3.9, .86], [1.4, 6, 4.3, 1], [3.4, 5.1, 3.8, 1.05]], { cap: 'both' }); band(Gc, 8, .9, 6, 4.3, 1.3); done(J.hips, [G, tS], [Gc, tC]); }
    // 胴（前かがみ）。背中は毛、背すじの両がわに立て石
    J.torso = grp(J.hips, 0, 2.2, 0);
    { const G = R.geo().smooth(0), Gf = R.geo().smooth(1), Gc = R.geo().smooth(0), RB = [[0, 5, 3.7, .8], [4, 6.6, 4.7, .92], [9, 8.6, 5.4, 1], [12.6, 8, 5.2, 1.05, 0, .4], [15.2, 4.6, 3.8, 1.1, 0, 1.3]];
      st(G, 10, RB, { cap: 'top' }); fur(Gf, 10, RB, 7.5, 5); band(Gc, 10, 4.6, 6.9, 4.9, 1.4);
      for (const [y, sx, hh] of [[3.2, 1, 2.6], [6, -1, 3.4], [8.8, 1, 4.2], [11.4, -1, 3], [5.4, 1, 1.6], [10.6, 1, 2.2], [8, -1, 1.4]]) { const rz = y < 4 ? 3.7 + y * .25 : y < 9 ? 4.7 + (y - 4) * .14 : 5.4 - (y - 9) * .06;
        G.at(TR(sx * (3.3 + hash(y, sx, 1) * 1.5), y, -rz * .93, sx * .2, -PI / 2 + .5, 0)); st(G, 5, [[-.6, .95, .6, .8], [hh * .7, .8, .5, 1], [hh, .35, .3, 1.1, .2 * sx, 0]], { cap: 'top', ur: 1 }); G.at(null); }
      done(J.torso, [G, tS], [Gf, tF], [Gc, tC]); }
    // 頭：8 角の石のかたまり。正面 3 面に顔、うしろは毛、てっぺんに弱点。左右に長さのちがう折れた石柱
    J.head = grp(J.torso, 0, 14.8, 1.9);
    { const G = R.geo().smooth(0), Gf = R.geo().smooth(1), Gc = R.geo().smooth(0), Ge = R.geo(), Gg = R.geo(), RH = [[-1.4, 2.5, 2.3, .78], [.6, 3.4, 3.1, .95], [3.6, 3.6, 3.3, 1.05], [4.8, 3.1, 2.9, 1.1]];
      st(G, 8, RH, { cap: 'top' }); fur(Gf, 8, RH.slice(1), 6.5, 3, 1.04);
      Gc.px(0, 0, 32, 32, 64, 64).loft(8, [[.5, 3.47, 3.17, 0, .95], [3.6, 3.67, 3.37, .8, 1.05], [4.8, 3.17, 2.97, 1, 1.08]], { rot: 2.5, seg: [0, 3], ur: 8 / 3 });
      for (const [sx, hh, r] of [[1, 5.2, .75], [-1, 2.3, .85]]) { G.at(TR(sx * 3.1, 2.6, -.4, 0, 0, -sx * .38)); st(G, 6, [[-.5, r * 1.2, r * 1.2, .85], [hh * .5, r, r, 1], [hh, r * .8, r * .8, 1.08, sx * .15, 0], [hh + .5, r * .3, r * .3, 1.1, sx * .3, .1]], { cap: 'top', ur: 1 }); G.at(null); band(Gc.at(TR(sx * 3.1, 2.6, -.4, 0, 0, -sx * .38)), 6, hh * .35, r, r, .7); Gc.at(null); }
      Ge.loft(8, [[.5, 3.5, 3.2, 0], [3.6, 3.7, 3.4, .8], [4.8, 3.2, 3, 1]], { rot: 2.5, seg: [0, 3], ur: 8 / 3 });
      Gg.at(TR(0, 4.86, 0, 0, -PI / 2, 0)).quad([-2.5, -2.4, 0], [2.5, -2.4, 0], [2.5, 2.4, 0], [-2.5, 2.4, 0]).at(null);
      done(J.head, [G, tS], [Gf, tF], [Gc, tC]); J.eyes = Ge.mesh(mEye); J.sigil = Gg.mesh(mGlow); J.sigil.castShadow = J.eyes.castShadow = false; J.head.add(J.eyes, J.sigil); }
    for (const [n, sx] of [['L', 1], ['R', -1]]) {
      // うで：肩の石の丸屋根（上に毛）、上うで、ひじの帯、先が太い前うで（こぶしは つま石の帯）
      const A = J['arm' + n] = grp(J.torso, sx * 8.5, 11.2, .3), Fo = J['fore' + n] = grp(A, 0, -10, 0);
      { const G = R.geo().smooth(0), Gf = R.geo().smooth(1), Gc = R.geo().smooth(0), RS = [[-1.6, 2.7, 2.7, .85], [.6, 3.5, 3.5, 1], [2.1, 2.8, 2.8, 1.06], [2.9, 1.1, 1.1, 1.1]];
        st(G, 8, RS, { cap: 'top' }); fur(Gf, 8, RS.slice(1), sx > 0 ? 3.5 : 7.5, 5, 1.03); st(G, 8, [[-10, 1.9, 1.9, .8], [-5, 2.3, 2.3, .92], [-1.2, 2.6, 2.6, 1]], {}); band(Gc, 8, -10.4, 2.05, 2.05, 1.2); done(A, [G, tS], [Gf, tF], [Gc, tC]); }
      { const G = R.geo().smooth(0), Gc = R.geo().smooth(0); st(G, 8, [[-10.2, 3.2, 3.4, .86], [-6, 2.5, 2.6, .94], [0, 1.9, 1.9, 1]], {}); Gc.px(0, 44, 64, 20, 64, 64).loft(8, [[-12.4, 2.7, 2.9, 0, .8], [-10.2, 3.3, 3.5, 1, 1]], { cap: 'bot', capUV: [.5, .05] }); done(Fo, [G, tS], [Gc, tC]); }
      // 足：もも、ひざの帯、ラッパのように広がるすね。外がわに毛（ここをのぼる）
      const Lg = J['leg' + n] = grp(J.hips, sx * 3.5, -1.2, 0), Sh = J['shin' + n] = grp(Lg, 0, -6.2, 0), off = sx > 0 ? 4.5 : .5;
      { const G = R.geo().smooth(0), Gf = R.geo().smooth(1), RT = [[-6.4, 2.1, 2.2, .82], [-3, 2.6, 2.7, .94], [.6, 2.9, 3, 1]]; st(G, 8, RT, {}); fur(Gf, 8, RT, off, 3); done(Lg, [G, tS], [Gf, tF]); }
      { const G = R.geo().smooth(0), Gf = R.geo().smooth(1), Gc = R.geo().smooth(0), RL = [[-4.1, 2.75, 2.8, .86, 0, .2], [-2.6, 2.2, 2.2, .92], [.4, 2.35, 2.35, 1]];
        st(G, 8, RL, { cap: 'top' }); fur(Gf, 8, RL, off, 3); Gc.px(0, 44, 64, 20, 64, 64).loft(8, [[-5.8, 3.4, 3.8, 0, .78, 0, .5], [-4.1, 2.8, 2.9, 1, 1, 0, .2]], { cap: 'bot', capUV: [.5, .05] }); band(Gc, 8, -.5, 2.4, 2.4, 1.1); done(Sh, [G, tS], [Gf, tF], [Gc, tC]); } }
    const g = new THREE.Group(); g.add(J.root); g.userData = { J, h: 32, hipY: HIP + 1.2, stride: 13.2, sigil: J.sigil, eyes: J.eyes, top: [0, 4.9, 0], parts };
    GC.pose(g, {}); return g; };

  GC.pose = (g, p = {}) => { const J = g.userData.J, { ph = 0, walk = 0, t = 0, look = 0, nod = 0, shake = 0, rear = 0, glow = .6 } = p, a = Math.sin(ph), b = Math.cos(ph), A = .27 * walk, HY = g.userData.hipY, br = Math.sin(t * .9);
    const sh1 = Math.sin(t * 4.6) * shake, sh2 = Math.sin(t * 3.1 + 1) * shake;
    J.hips.position.y = HY - .42 * walk * a * a - Math.abs(sh1) * .5; J.hips.rotation.set(0, a * .07 * walk + sh2 * .14, a * .035 * walk);
    J.torso.rotation.set(.55 + br * .015 - rear * .34 + Math.abs(sh2) * .1, -a * .1 * walk + sh2 * .34, sh1 * .2);
    J.head.rotation.set(-.4 + nod - rear * .3, look, Math.sin(t * 5.3) * .14 * shake);
    for (const [n, s] of [['L', 1], ['R', -1]]) { const sw = a * s, lift = Math.max(0, b * s) * walk;
      J['leg' + n].rotation.set(-A * sw - lift * .16, 0, 0); J['shin' + n].rotation.set(lift * .5, 0, 0);
      J['arm' + n].rotation.set(-.62 + sw * .24 * walk - rear * 1.15 + br * .02 * s, 0, s * (.07 + shake * .34 * (.55 + .45 * Math.sin(t * 4.6 + s * 1.3)) + rear * .3));
      J['fore' + n].rotation.set(-.14 - Math.max(0, -sw) * .2 * walk - rear * .7 - shake * .3, 0, 0); }
    const k = cl(glow, 0, 1.6); J.sigil.material.color.setRGB(Math.min(1, .25 + k * .75), Math.min(1, .3 + k * .7), Math.min(1, .3 + k * .7)); J.sigil.scale.setScalar(1 + Math.max(0, k - 1) * .5); };
  return GC;
};
