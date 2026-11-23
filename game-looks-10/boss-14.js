// 第 10 集 14「固定カメラのホラー：ボス戦」用の部品。kit.js・retro.js のあとに読み、 const BM = BOSS14(THREE, K, R)  として使う。
// ■ 古いボイラーの機械人形「カマモリ」：高さ 5.8 m（人の 4 倍）。びょう打ちの鉄のかまの胴、圧力計の目が 2 つの丸い頭、えんとつ、銅の管の長いうでと はさみの手、短い足。
//   胸に たき口のとびら（下にひらく）。ひらくと、中の赤く光る しん（弱点）が見える。形は R.geo() の loft と板（箱は使わない）。足もとが y=0、正面が +z。
//   const boss = BM.make({ c: 鉄の色, pipe: 銅の色 });   scene.add(boss);
//   BM.pose(boss, { t, ph（歩きの位相）, walk: 0〜1, slam: 0〜1（右うでを上げる）, hit: 0〜1（ふり下ろす）, stagger: 0〜1, open: 0〜1（とびら）, kneel: 0〜1, core: 0〜1.5（しんの光）, eye: 0〜1（目の光）, rage: 0〜1 });
//   boss.userData = { J（関節）, core: [0, 2.9, 1.5]（しんの位置）, top: 5.8, stack: [x, y, z]（えんとつの先） }
window.BOSS14 = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, BM = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  // ---- びょう打ちの鉄板（64×64・くり返し）：3 段の板、つぎ目のかげ、上のふちの光、びょうの列、たれる さび ----
  const ironTex = c => { const P = Px(64), M = ramp(c, 6, { contrast: .9 }), Ru = ramp('#b0602c');
    for (let row = 0; row < 3; row++) { const y0 = row * 21 + (row === 2 ? 1 : 0), h = row === 2 ? 22 : 21, off = row & 1 ? 16 : 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < 64; x++) { const q = (x + off) & 31, n = tn(x, y0 + y, 8, 8, 64, 64, 3 + row); let t = 2 + (n > .66 ? 1 : n < .28 ? -1 : 0);
        if (y === 0 || q === 0) t = 0; else if (y === 1 || q === 1) t = 4; else if (y === h - 1 || q === 31) t = 1;
        P.set(x, y0 + y, tone(M, t)); }
      for (let x = 0; x < 64; x += 8) { const q = x + 4 - off / 4; P.rect(q, y0 + 3, 2, 2, M[1]); P.set(q, y0 + 3, M[5]); P.rect(q, y0 + h - 5, 2, 2, M[1]); P.set(q, y0 + h - 5, M[5]);
        if (hash(x, row, 4) > .45) { const len = 3 + Math.floor(hash(x, row, 5) * 9); for (let j = 0; j < len; j++) P.set(q + (j > 3 && hash(j, x, 2) > .6 ? 1 : 0), y0 + 5 + j, Ru[j < 2 ? 3 : j > len - 3 ? 1 : 2]); } } }
    P.each((x, y, c0) => { const n = tn(x, y, 16, 16, 64, 64, 9); if (n > .78 && ((x + y) & 1)) return Ru[2]; if (n > .86) return Ru[1]; });
    return T.from(P, { m: 2.4 }); };
  // ---- 銅の管（32×32・くり返し。よこが管のまわり、たてが長さ）：明るいすじ、つぎ手の輪、緑青 ----
  const pipeTex = c => { const P = Px(32), M = ramp(c, 6), Z = ramp('#4f9a86');
    P.each((x, y) => { const q = y & 15, n = tn(x, y, 8, 8, 32, 32, 2); if (q === 0) return M[0]; if (q === 1 || q === 3) return M[5]; if (q === 2) return M[3]; if (q === 4) return M[1]; if (n > .74) return Z[n > .84 ? 4 : 3]; return M[x % 16 < 3 ? 5 : x % 16 < 7 ? 4 : x % 16 > 12 ? 2 : 3]; });
    return T.from(P, { m: 1 }); };
  // ---- 顔と たき口の絵（64×64・抜き）：左上＝圧力計、右上＝たき口のとびら（格子）、左下＝光るしん、右下＝よろい戸（口） ----
  const partTex = () => { const P = Px(64), Br = ramp('#c89a48'), I = ramp('#4a5560'), K0 = '#14161e'; P.clip = true;
    P.each((x, y) => { if (x < 32 && y < 32) { const d = Math.hypot(x - 15.5, y - 15.5), a = Math.atan2(y - 15.5, x - 15.5); if (d > 15.5) return null; if (d > 12.5) return Br[d > 14.5 ? 1 : d > 13.5 ? 4 : 3]; if (d > 11.5) return K0; if (d > 9 && d < 11 && Math.abs(((a / PI * 6 + 12) % 1) - .5) > .36 && y < 22) return K0; return y > 22 ? '#d8d0b8' : '#f4eedc'; }
      if (x >= 32 && y < 32) { const u = x - 32, e = Math.min(u, y, 31 - u, 31 - y); if (e < 3) return I[e === 0 ? 0 : e === 1 ? 5 : 3]; if (e === 3) return K0; const q = (u - 4) % 5; return q < 2 ? I[q ? 2 : 4] : (y % 9 === 4 ? I[2] : mix('#ff7a2a', K0, .35 + .4 * Math.abs(y - 16) / 16)); }
      if (x < 32 && y >= 32) { const d = Math.hypot(x - 15.5, y - 47.5), a = Math.atan2(y - 47.5, x - 15.5), w = Math.sin(a * 5 + d * .9); if (d > 15) return null; if (d > 13.5) return K0; if (d < 4) return '#ffffff'; if (d < 7) return w > 0 ? '#fff4b0' : '#ffd060'; if (d < 11) return w > .2 ? '#ffb040' : '#ff7a2a'; return w > 0 ? '#e8501c' : '#a82c14'; }
      const v = y - 32, e = Math.min(x - 32, v, 63 - x, 31 - v); if (e < 2) return I[e ? 4 : 0]; return (v % 6) < 2 ? K0 : (v % 6) === 2 ? I[5] : I[2]; });
    // 圧力計の針
    P.line(15, 16, 22, 8, '#c8302c'); P.line(16, 16, 23, 8, '#c8302c'); P.disc(15.5, 16, 1.8, K0);
    return T.from(P, { m: 1, cut: true }); };

  BM.make = (o = {}) => { const c = o.c || '#56646c', pc = o.pipe || '#b8703c', tI = ironTex(c), tP = pipeTex(pc), tX = partTex(), g = new THREE.Group(), J = {};
    const grp = (p, x = 0, y = 0, z = 0) => { const q = new THREE.Group(); q.position.set(x, y, z); p.add(q); return q; };
    const mGlow = () => new THREE.MeshBasicMaterial({ map: tX, alphaTest: .5, fog: false });
    const iron = (G, n, rings, q = {}) => G.loft(n, rings.map(([y, rx, rz, b = 1, ox = 0, oz = 0]) => [y, rx, rz ?? rx, y / 2.4, b, ox, oz]), { ur: Math.max(1, Math.round(rings[0][1] * 6.28 / 2.4)), ...q });
    const pipe = (G, n, rings, q = {}) => G.loft(n, rings.map(([y, r, b = 1, ox = 0, oz = 0]) => [y, r, r, y, b, ox, oz]), { ur: 1, ...q });
    J.root = grp(g); J.hips = grp(J.root, 0, 1.5, 0);
    // 胴：ふくらんだ かま。上にすぼまる肩、下に腰の輪
    J.body = grp(J.hips);
    { const G = R.geo().smooth(1), Gp = R.geo().smooth(1);
      iron(G, 10, [[-.25, .95, .85, .7], [.3, 1.5, 1.3, .85], [1.5, 1.78, 1.52, 1], [2.6, 1.66, 1.44, 1.03], [3.2, 1.15, 1.02, 1.05], [3.35, .7, .66, 1.05]], { cap: 'both', capUV: [.5, .5] });
      pipe(Gp, 10, [[.2, 1.5, .85], [.42, 1.56, 1]], { ur: 6 }); pipe(Gp, 10, [[2.5, 1.7, .9], [2.72, 1.72, 1.05]], { ur: 6 });
      // 背中の管とタンク
      for (const sx of [1, -1]) { Gp.at(TR(sx * .7, .5, -1.25, 0, -.12, 0)); pipe(Gp, 6, [[0, .2, .85], [1.6, .2, 1], [2.3, .2, 1, 0, .5], [2.5, .14, 1, 0, .75]]); Gp.at(null); }
      G.at(TR(0, .9, -1.5, 0, 0, 0)); iron(G, 8, [[0, .5, .4, .8], [.3, .62, .5, .9], [1.3, .62, .5, 1], [1.6, .4, .3, 1.05]], { cap: 'both', capUV: [.5, .5], ur: 1 }); G.at(null);
      J.body.add(G.mesh(tI), Gp.mesh(tP));
      // たき口の わく（口のよろい戸は その下）と、光るしん
      const Gx = R.geo().normal([0, .1, 1]); Gx.px(32, 32, 32, 32, 64, 64).quad([-.55, .35, 1.36], [.55, .35, 1.36], [.5, .82, 1.5], [-.5, .82, 1.5]); const mx = Gx.mesh(R.mat(tX, { vc: true, cut: true })); J.body.add(mx);
      const Gc = R.geo(); Gc.px(0, 32, 32, 32, 64, 64).quad([-.62, .92, 1.5], [.62, .92, 1.5], [.62, 2.16, 1.46], [-.62, 2.16, 1.46]); J.core = Gc.mesh(mGlow()); J.core.castShadow = false; J.body.add(J.core);
      J.door = grp(J.body, 0, .9, 1.56); const Gd = R.geo().normal([0, 0, 1]); Gd.px(32, 0, 32, 32, 64, 64).quad([-.7, 0, 0], [.7, 0, 0], [.7, 1.32, -.06], [-.7, 1.32, -.06]); J.door.add(Gd.mesh(R.mat(tX, { vc: true, cut: true, side: true }))); }
    // 頭：丸いふた。圧力計の目が 2 つ、えんとつ（ななめ）
    J.head = grp(J.body, 0, 3.3, .1);
    { const G = R.geo().smooth(1), Gp = R.geo().smooth(1); iron(G, 8, [[-.1, .7, .7, .85], [.25, .82, .8, 1], [.7, .74, .72, 1.03], [1.02, .42, .42, 1.06], [1.12, .1, .1, 1.08]], { cap: 'top', capUV: [.5, .5], ur: 2 });
      pipe(Gp, 8, [[.1, .86, .9], [.24, .86, 1.05]], { ur: 4 }); Gp.at(TR(-.36, .8, -.3, 0, -.2, .25)); pipe(Gp, 6, [[0, .2, .85], [.9, .2, 1], [1.02, .27, 1.05], [1.2, .27, .9]]); Gp.at(null);
      J.head.add(G.mesh(tI), Gp.mesh(tP));
      const Ge = R.geo(); for (const sx of [1, -1]) Ge.px(0, 0, 32, 32, 64, 64).at(TR(sx * .36, .5, .74, sx * .34, -.08, 0)).quad([-.27, -.27, 0], [.27, -.27, 0], [.27, .27, 0], [-.27, .27, 0]).at(null); J.eyes = Ge.mesh(mGlow()); J.eyes.castShadow = false; J.head.add(J.eyes); }
    for (const [n, sx] of [['L', 1], ['R', -1]]) {
      // うで：肩の玉、銅の管の上うで、ひじの輪、先が太い前うで、はさみの手
      const A = J['arm' + n] = grp(J.body, sx * 1.72, 2.75, 0), Fo = J['fore' + n] = grp(A, sx * .25, -1.75, 0);
      { const G = R.geo().smooth(1), Gp = R.geo().smooth(1); iron(G, 8, [[-.45, .3, .3, .8], [-.15, .52, .52, .95], [.2, .52, .52, 1.03], [.48, .28, .28, 1.06]], { cap: 'both', capUV: [.5, .5], ur: 1 });
        pipe(Gp, 6, [[-1.75, .22, .85, sx * .25, 0], [-.3, .24, 1, 0, 0]]); A.add(G.mesh(tI), Gp.mesh(tP)); }
      { const G = R.geo().smooth(1), Gp = R.geo().smooth(1); iron(G, 8, [[-.3, .3, .3, .85], [0, .36, .36, 1], [.26, .28, .28, 1.04]], { cap: 'both', capUV: [.5, .5], ur: 1 });
        pipe(Gp, 6, [[-1.7, .34, .85], [-1.2, .3, .95], [-.2, .22, 1]]); iron(G, 8, [[-2.05, .3, .3, .8], [-1.66, .42, .42, 1]], { cap: 'both', capUV: [.5, .5], ur: 1 });
        for (const k of [1, -1]) { G.at(TR(0, -2.0, k * .2, 0, k * .5, 0)); iron(G, 5, [[0, .13, .1, 1], [-.5, .11, .08, .95, 0, 0], [-.85, .04, .04, .9, 0, -k * .22]], { ur: 1 }); G.at(null); }
        Fo.add(G.mesh(tI), Gp.mesh(tP)); }
      // 足：短い もも、太い すね、広い足
      const Lg = J['leg' + n] = grp(J.hips, sx * .82, -.1, 0), Sh = J['shin' + n] = grp(Lg, 0, -.6, 0);
      { const Gp = R.geo().smooth(1); pipe(Gp, 6, [[-.62, .26, .85], [.1, .3, 1]]); Lg.add(Gp.mesh(tP)); }
      { const G = R.geo().smooth(1); iron(G, 8, [[-.8, .62, .78, .75, 0, .12], [-.62, .5, .56, .9, 0, .06], [-.1, .4, .4, 1], [.12, .3, .3, 1.04]], { cap: 'both', capUV: [.5, .5], ur: 1 }); Sh.add(G.mesh(tI)); } }
    g.userData = { J, core: [0, 2.9, 1.5], top: 5.8, stack: [-.7, 5.9, -.3] };
    BM.pose(g, {}); return g; };

  BM.pose = (g, p = {}) => { const J = g.userData.J, { t = 0, ph = 0, walk = 0, slam = 0, hit = 0, stagger = 0, open = 0, kneel = 0, core = 0, eye = 1, rage = 0 } = p, a = Math.sin(ph), b = Math.cos(ph), sh = Math.sin(t * 17) * stagger, br = Math.sin(t * 1.3);
    J.hips.position.y = 1.5 - Math.abs(a) * .08 * walk - kneel * .55; J.hips.rotation.set(0, a * .1 * walk, a * .06 * walk + sh * .03);
    J.body.rotation.set(.1 + br * .02 - stagger * .28 + kneel * .42 + hit * .35 + rage * .08, sh * .05 - slam * .25 + hit * .3, sh * .04);
    J.head.rotation.set(-.05 + kneel * .5 - stagger * .2 + Math.sin(t * 23) * .04 * rage, Math.sin(t * .8) * .15 * (1 - kneel) + sh * .2, sh * .1);
    for (const [n, s] of [['L', 1], ['R', -1]]) { const sw = a * s, lift = Math.max(0, b * s) * walk;
      J['leg' + n].rotation.set(-sw * .32 * walk - lift * .2 - kneel * .9, 0, 0); J['shin' + n].rotation.set(lift * .5 + kneel * 1.5, 0, 0);
      const up = n === 'R' ? slam * (1 - hit) : 0, dn = n === 'R' ? hit : 0;
      J['arm' + n].rotation.set(-.12 + sw * .22 * walk - up * 2.7 - dn * 1.25 - stagger * (.5 + .3 * Math.sin(t * 9 + s)) + kneel * .35, 0, s * (.1 + stagger * .35 + up * .15));
      J['fore' + n].rotation.set(-.3 - up * .5 - dn * .2 - stagger * .5 - kneel * .5 - rage * .3, 0, 0); }
    J.door.rotation.x = open * 1.9;
    const k = cl(core, 0, 1.5); J.core.material.color.setRGB(Math.min(1, .16 + k * .9), Math.min(1, .1 + k * .85), Math.min(1, .08 + k * .8));
    const e = cl(eye); J.eyes.material.color.setRGB(.25 + e * .75, (.25 + e * .75) * (1 - rage * .6), (.25 + e * .7) * (1 - rage * .75)); };
  return BM;
};
