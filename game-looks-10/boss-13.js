// 第 10 集 13「巨大な像によじのぼって戦う：ボス戦」用の部品。kit.js・retro.js・pack-sea.js のあとに読み、 const BS = BOSS13(THREE, K, R, S)  として使う。
// ■ 焼き物の海へび「カケツギ」：長さ 85 m ほど。白い焼き物のうろこ（あい色の絵つけ）の節が 14 こ、青銅の輪でつながる（節ごとに動く置き物のつくり）。
//   割れを金でついだ「金つぎ」のすじが体じゅうにあり、とくに大きな 3 か所（背のまん中・首・ひたい）が弱点として光る。背にはさんご、横には ひれ板がならぶ。
//   形はすべて R.geo() の loft と板。箱は使わない。節の中の向きは  x = 横、y = 頭のほう、z = 背。
//   const boss = BS.serpent({ c: 焼き物の色, blue: 絵つけの色, gold: 金つぎの色 });   scene.add(boss);
//   BS.pose(boss, spine, { t, flap, nod, yaw, glow: [a, b, c] });   spine(s, v) は「頭の先から s m うしろ」の背骨の位置を v に入れ、その所のひねり（ラジアン）を返す関数
//   BS.frame(spine, s, F) → F = { p, T（頭のほう）, U（背）, S（横）}   BS.rad(s) → 体の半径   boss.userData = { head, segs, glows: [板 3 つ], WEAK: [47.5, 22.5, 3.6] }
// ■ 乗り物のけもの「ミズハネ」：水の上を泳ぐ、長い耳びれの けもの（長さ 3.6 m）。くらと たづな つき。正面 +z、水面が y=0。
//   const m = BS.mount({ c, belly, cloth });   BS.mountPose(m, t, { swim: 0〜1, leap: 0〜1 });   m.userData.seat = くらの上の位置 [x, y, z]
window.BOSS13 = (THREE, K, R, S) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, BS = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const RAD = [[0, 3.3], [10, 3.5], [20, 3.9], [34, 4.6], [50, 4.2], [64, 2.9], [74, 1.7], [84, .7]];
  BS.rad = s => { if (s <= 0) return RAD[0][1]; for (let i = 0; i < RAD.length - 1; i++) { const [s0, r0] = RAD[i], [s1, r1] = RAD[i + 1]; if (s < s1) return r0 + (r1 - r0) * (s - s0) / (s1 - s0); } return RAD[RAD.length - 1][1]; };
  BS.WEAK = [47.5, 22.5, 3.6];

  // ---- 焼き物のうろこ（くり返し 64×64）：重なる半円のうろこ、あい色のふちと中の線、うろこごとの点、金つぎのすじ、細かいひび ----
  const scaleTex = (c, blue, gold) => {
    const P = Px(64), W = ramp(c, 6, { contrast: .8 }), Bl = ramp(blue), G = ramp(gold);
    P.each((x, y) => {
      const row = y >> 4, yy = y & 15, xx = (x + (row & 1) * 8) & 15, d = Math.hypot(xx - 7.5, (yy - 4) * 1.02), n = tn(x, y, 8, 8, 64, 64, 2);
      if (d > 9.6) return W[yy > 12 ? 1 : 2];
      if (d > 8.4 && yy > 5) return Bl[xx < 7 ? 2 : 1];
      if (d > 7.4 && yy > 5) return W[5];
      if (d > 5.6 && d < 6.5 && yy > 6) return Bl[4];
      if (Math.hypot(xx - 7.5, yy - 5.5) < 1.7) return Bl[3];
      if (yy < 2) return W[2];
      if (n > .74) return W[5];
      if (n < .24 && ((x + y) & 1)) return W[3];
      return W[4];
    });
    // 細かいひび（かん入）
    for (let i = 0; i < 9; i++) { let x = Math.floor(hash(i, 1, 5) * 64), y = Math.floor(hash(i, 2, 5) * 64); for (let j = 0; j < 7; j++) { P.set(x, y, W[2]); x += hash(i, j, 6) > .5 ? 1 : 0; y += hash(i, j, 7) > .35 ? 1 : -1; } }
    // 金つぎ：ぎざぎざの太いすじ（左に光、右に影）。左右・上下のはしで つながる
    const seam = pts => { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; P.line(x0 + 1, y0 + 1, x1 + 1, y1 + 1, W[1]); P.line(x0, y0, x1, y1, G[3]); P.line(x0, y0 - 1, x1, y1 - 1, G[i & 1 ? 5 : 4]); } };
    seam([[0, 21], [9, 27], [17, 19], [28, 24], [37, 33], [49, 26], [57, 28], [64, 21]]);
    seam([[41, 0], [44, 9], [39, 17], [34, 24]]); seam([[37, 33], [33, 44], [38, 52], [41, 64]]);
    for (const [x, y] of [[17, 19], [37, 33], [49, 26]]) { P.disc(x + .5, y + .5, 1.8, G[3]); P.set(x, y, G[5]); }
    return T.from(P, { m: 4.8 });
  };
  // ---- 青銅の輪（64×16）：緑青のしみ、びょう、上のふちの光 ----
  const bandTex = gold => {
    const P = Px(64, 16), Z = ramp('#4f8a7c'), Br = ramp('#a06a34'), G = ramp(gold);
    P.each((x, y) => { const n = tn(x, y, 8, 8, 64, 16, 3); if (y === 0) return Br[5]; if (y === 1) return Br[4]; if (y >= 14) return Br[y === 15 ? 0 : 1]; return n > .52 ? Z[n > .72 ? 4 : 3] : Br[n < .25 ? 2 : 3]; });
    for (let i = 0; i < 8; i++) { const x = i * 8 + 3; P.disc(x + 1, 7.5, 2.2, Br[1]); P.disc(x + 1, 7, 1.6, G[3]); P.set(x, 6, G[5]); }
    return T.from(P, { m: 2.4 });
  };
  // ---- ひれ板（64×64・抜き）：左のまん中がつけ根。放射のすじ、あい色のしまと点、金のふち、波形のへり ----
  const finTex = (c, blue, gold) => {
    const P = Px(64), W = ramp(c, 6, { contrast: .8 }), Bl = ramp(blue), G = ramp(gold); P.clip = true;
    P.each((x, y) => {
      const dx = x + 6, dy = y - 31.5, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), lim = 67 - Math.abs(Math.sin(a * 6.5)) * 6;
      if (Math.abs(a) > .78 - (r < 16 ? (16 - r) * .025 : 0) || r > lim) return null;
      const ph = (a * 6.5 / PI + 40.5) % 1, rib = Math.abs(ph - .5);
      if (r > lim - 3) return G[r > lim - 1.2 ? 2 : r > lim - 2 ? 4 : 5];
      if (rib < .07) return Bl[1];
      if (rib < .12) return W[2];
      if (r > 44 && r < 50) return Bl[rib < .3 ? 2 : 3];
      if (r > 51 && r < 53) return Bl[4];
      if (r > 24 && r < 26.5) return Bl[3];
      if (r > 30 && r < 40 && rib > .38 && ((Math.floor(r) % 5) < 2)) return Bl[3];
      if (r < 12) return G[3 + ((x + y) & 1)];
      if (r < 13.5) return G[1];
      return W[rib > .34 ? 5 : a > .2 ? 3 : 4];
    });
    return T.from(P, { m: 1, cut: true });
  };
  // ---- 頭（128×64）：よこは体のまわり（まん中 64 が背、0 と 127 が腹）、たては上が口先・下が首。大きな目、まゆ、口のぎざぎざ、ひたいの波もよう、首のうろこ ----
  const headTex = (c, blue, gold) => {
    const P = Px(128, 64), W = ramp(c, 6, { contrast: .8 }), Bl = ramp(blue), G = ramp(gold), Rd = ramp('#d8503c'); P.clip = true;
    P.each((x, y) => { const n = tn(x, y, 8, 8, 128, 64, 4), ax = Math.abs(x - 63.5);
      if (y > 48) { const row = (y - 49) >> 3, yy = (y - 49) & 7, xx = (x + (row & 1) * 6) % 12, d = Math.hypot(xx - 5.5, yy - 1.5); return d > 6.4 ? W[2] : d > 5.2 && yy > 2 ? Bl[2] : d < 1.3 ? Bl[3] : W[4]; }
      if (ax > 56) return W[2];
      return W[n > .7 ? 5 : n < .25 && ((x + y) & 1) ? 3 : 4]; });
    P.rect(0, 46, 128, 1, G[5]); P.rect(0, 47, 128, 1, G[3]); P.rect(0, 48, 128, 1, G[1]);
    // ひたいの波もよう（同心の半円が 3 段）
    for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) { const cx = 63.5 + i * 11 + (j & 1) * 5.5, cy = 43 - j * 6; if (Math.abs(cx - 63.5) > 14) continue; for (let a = 0; a <= 40; a++) { const an = PI + a / 40 * PI; for (const [rr, col] of [[5.4, Bl[1]], [3.6, Bl[3]], [1.8, Bl[2]]]) P.set(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, col); } }
    P.rect(62, 6, 3, 16, Bl[3]); P.rect(63, 4, 1, 20, Bl[1]); for (let k = 0; k < 4; k++) { P.rect(59, 8 + k * 4, 9, 1, Bl[2]); }
    for (const sx of [-1, 1]) { const ex = 63.5 + sx * 27, ey = 25;
      // 目：あい色の太いふち、白目、金のひとみ、黒目、白い点。うしろに目じりの赤、上に ななめのまゆ
      P.disc(ex + .5, ey + .5, 8.6, Bl[1]); P.disc(ex + .5, ey + .5, 7, '#fff8e4'); P.disc(ex + .5, ey - .5, 5.2, G[4]); P.disc(ex + .5, ey - .5, 4.2, G[3]); P.rect(ex - 3, ey - 2, 8, 3, '#141a3a'); P.rect(ex - 1, ey - 3, 4, 5, '#141a3a'); P.rect(ex - sx * 2, ey - 3, 2, 2, '#ffffff');
      for (let k = 0; k < 16; k++) { const bx = ex - sx * (10 + k * .1), by = ey - 9 + k * 1.1; P.rect(bx - 1, by, 3, 2, Bl[1]); }
      for (let k = 0; k < 6; k++) P.rect(ex + sx * (3 + k) - 1, ey + 9 + k, 3, 2, Rd[k < 4 ? 3 : 4]);
      // 鼻のあな、ひげの根もとの金の輪、口の線（腹がわ）と きば
      P.rect(63.5 + sx * 9 - 1, 4, 3, 4, Bl[1]); P.disc(63.5 + sx * 22 + .5, 9.5, 3.4, G[2]); P.disc(63.5 + sx * 22 + .5, 9.5, 2.2, G[4]);
      const mx = 63.5 + sx * 48; for (let y = 1; y < 38; y++) { P.rect(Math.min(mx, mx + sx), y, 2, 1, Bl[0]); P.set(mx + sx * 2, y, Bl[2]); if (y % 6 < 4 && y < 34) { const w = 4 - (y % 6); for (let q = 1; q <= w; q++) P.set(mx - sx * q, y, '#fff8e4'); } else P.set(mx - sx, y, Bl[3]); }
      // ほおの金つぎ
      let x = ex + sx * 5, y = 34; for (let k = 0; k < 20; k++) { P.rect(Math.min(x, x + 1), y, 2, 1, G[3]); P.set(x, y - 1, G[5]); x += sx * (hash(k, 3, 2) > .4 ? 1 : 0); y += hash(k, 4, 2) > .7 ? -1 : 1; if (y > 45) break; } }
    return T.from(P, { m: 1 });
  };
  // ---- 弱点の光（32×32・抜き。光る材質ではる）：まん中から走る金つぎの大きな割れ ----
  const glowTex = () => {
    const P = Px(32), A = '#ffffff', Bc = '#ffe9a0', C = '#ffc040'; P.clip = true;
    for (let i = 0; i < 7; i++) { let a = i / 7 * PI * 2 + hash(i, 1, 9) * .5, x = 15.5, y = 15.5; for (let k = 0; k < 15; k++) { const w = k < 5 ? 1 : 0; P.rect(x - w, y - w, 1 + w * 2, 1 + w * 2, k < 6 ? Bc : C); P.set(x, y, k < 9 ? A : Bc); if (k % 4 === 3) a += (hash(i, k, 8) - .5) * 1.5; x += Math.cos(a) * 1.05; y += Math.sin(a) * 1.05; if (k === 8 && i % 2) { let bx = x, by = y; const b = a + 1; for (let q = 0; q < 5; q++) { P.set(bx, by, C); bx += Math.cos(b); by += Math.sin(b); } } } }
    P.disc(16, 16, 4.2, Bc); P.disc(16, 16, 2.8, A);
    for (let a = 0; a < 40; a++) { const an = a / 40 * PI * 2; if (a % 5 < 3) P.set(16 + Math.cos(an) * 14.4, 16 + Math.sin(an) * 14.4, C); }
    return T.from(P, { m: 1, cut: true });
  };

  BS.serpent = (o = {}) => {
    const c = o.c || '#ece6d6', blue = o.blue || '#2f50a8', gold = o.gold || '#dca43a';
    const tS = scaleTex(c, blue, gold), tB = bandTex(gold), tF = finTex(c, blue, gold), tH = headTex(c, blue, gold), tG = glowTex();
    const mFin = R.mat(tF, { vc: true, cut: true, side: true }), g = new THREE.Group(), segs = [], fins = [], glows = [];
    const glowMesh = (parent, build) => { const G = R.geo(); build(G); const m = new THREE.Mesh(G.build(), new THREE.MeshBasicMaterial({ map: tG, alphaTest: .5, fog: false, side: THREE.DoubleSide })); m.castShadow = false; parent.add(m); return m; };
    // 背に沿ってはる光の板（4 枚に割って丸みに合わせる）
    const patch = (G, r, y0, half, w) => { for (let k = 0; k < 4; k++) { const a0 = -w + k * w / 2, a1 = a0 + w / 2, p = (a, y) => [Math.sin(a) * r, y, Math.cos(a) * r]; G.quad(p(a0, y0 - half), p(a1, y0 - half), p(a1, y0 + half), p(a0, y0 + half), [k / 4, 0, (k + 1) / 4, 1]); } };
    const fin = (parent, sx, x, y, z, len, wid, i, tilt = .25) => { const p = new THREE.Group(); p.position.set(x, y, z); const G = R.geo().normal([0, 0, 1]); G.quad([0, -wid * .5 - .2, 0], [sx * len, -wid * .9, 0], [sx * len, wid * .1, 0], [0, wid * .5 - .2, 0], sx > 0 ? [0, 0, 1, 1] : [0, 1, 1, 0]); const m = new THREE.Mesh(G.build(), mFin); m.castShadow = true; p.add(m); parent.add(p); fins.push({ p, sx, i, tilt }); return p; };
    // ---- 体の節 14 こ ----
    for (let i = 0; i < 14; i++) {
      const s0 = 12.5 + i * 5, sg = new THREE.Group(), G = R.geo().smooth(1), Gb = R.geo().smooth(2), rr = y => BS.rad(s0 - y), r0 = rr(0), ur = Math.max(2, Math.round(r0 * 6.28 / 4.8));
      G.loft(10, [[-3.05, rr(-3) * .84, 0, .8], [-1.7, rr(-1.7) * .99, .27, .95], [1.1, rr(1.1) * 1.03, .86, 1], [2.45, rr(2.4) * 1.06, 1.14, 1.04]].map(([y, r, v, b]) => [y, r, r * .95, v, b]), { ur, cap: i === 13 ? 'bot' : undefined, capUV: [.5, .5] });
      Gb.loft(10, [[2.2, rr(2.2) * 1.085, rr(2.2) * 1.03, 0, .9], [3.1, rr(3) * 1.1, rr(3) * 1.045, 1, 1.05]], { ur: Math.max(3, Math.round(r0 * 6.28 / 2.4)) });
      sg.add(G.mesh(tS), Gb.mesh(tB));
      if (i < 12) for (const sx of [1, -1]) fin(sg, sx, sx * Math.sin(1.2) * r0 * .93, .4, Math.cos(1.2) * r0 * .93, 2.1 + r0 * .5, 3.4, i, .34);
      // さんご（背のまん中は主役の通り道なので あける）
      const cor = [];
      for (let k = 0; k < 3; k++) { if (hash(i, k, 3) < .3 || i > 11) continue; const side = hash(i, k, 4) > .5 ? 1 : -1, a = side * (.62 + hash(i, k, 5) * .5), y = -2 + hash(i, k, 6) * 3.4, r = BS.rad(s0 - y) * .96, kind = ['branch', 'finger', 'fan', 'tube'][Math.floor(hash(i, k, 7) * 4)];
        const m = S.coral({ kind, s: 1.1 + hash(i, k, 8) * .9, c: ['#f0705a', '#e86aa0', '#f4a03c'][Math.floor(hash(i, k, 9) * 3)], seed: i * 3 + k }); m.position.set(Math.sin(a) * r, y, Math.cos(a) * r * .95); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sin(a), 0, Math.cos(a))); m.rotateY(hash(i, k, 2) * 6); cor.push(m); }
      if (cor.length) sg.add(R.merge(cor));
      if (i === 7 || i === 2) glows[i === 7 ? 0 : 1] = glowMesh(sg, G2 => patch(G2, r0 * 1.0 + .14, 0, 2.4, .56));
      if (i === 13) { const Gv = R.geo().normal([1, 0, 0]); for (const sz of [1, -1]) Gv.quad([0, -2.2, 0], [0, -8.4, sz * 4.4], [0, -4.6, sz * 4.8], [0, -2, sz * .6], [0, .2, 1, .8]); const mv = new THREE.Mesh(Gv.build(), mFin); mv.castShadow = true; sg.add(mv); }
      g.add(sg); segs.push(sg);
    }
    // ---- 頭：口先のとがった ひらたい頭。うしろに立つ とさか、左右の耳びれ、長いひげ 2 本 ----
    const head = new THREE.Group();
    { const G = R.geo().smooth(1), RH = [[-6.2, 3.5, 3.25, 1, 0], [-3.4, 4.6, 3.9, 1, 0], [-.6, 4.8, 3.7, 1, -.1], [2, 3.9, 2.9, 1.02, -.4], [4.4, 3.1, 2.1, 1.04, -.8], [6.2, 2.5, 1.5, 1.05, -1.1], [7.4, 1.3, .8, 1.06, -1.3]];
      G.loft(10, RH.map(([y, rx, rz, b, oz]) => [y, rx, rz, (y + 6.2) / 13.6, b, 0, oz]), { ur: 1, cap: 'top', capUV: [.5, .99] });
      const Gb = R.geo().smooth(2); Gb.loft(10, [[-6.9, 3.6, 3.3, 0, .9], [-5.9, 3.75, 3.45, 1, 1.05]], { ur: 9 });
      // ひげ（金の細い筒。口先の横から うしろへ流れる）
      for (const sx of [1, -1]) { Gb.at(TR(sx * 2.6, 5.2, -1.2, 0, 0, 0)); Gb.loft(5, [[0, .2, .2, 0, 1, 0, 0], [-2.5, .17, .17, 1, 1, sx * 2.6, -.8], [-6, .12, .12, 2, 1, sx * 4.6, -2.2], [-10, .04, .04, 3, .9, sx * 5.2, -1.6]], { ur: 1 }); Gb.at(null); }
      head.add(G.mesh(tH), Gb.mesh(tB));
      const Gc = R.geo().normal([1, 0, .2]); Gc.quad([0, 1.6, 3.1], [0, -6.6, 3], [0, -8.6, 8.6], [0, .4, 6.2], [0, 0, 1, 1]); const mc = new THREE.Mesh(Gc.build(), mFin); mc.castShadow = true; head.add(mc);
      const ears = [1, -1].map(sx => fin(head, sx, sx * 4.2, -2.4, 1.2, 6.2, 5, -3, .5));
      glows[2] = glowMesh(head, G2 => patch(G2, 3.72, 3.2, 2, .52)); glows[2].position.z = -.42; glows[2].rotation.x = .16;
      head.userData.ears = ears; }
    g.add(head);
    g.userData = { head, segs, fins, glows, WEAK: BS.WEAK };
    return g;
  };

  // 背骨の関数から、s の所の向きを作る
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), tU = new THREE.Vector3(), tS = new THREE.Vector3(), m4 = new THREE.Matrix4();
  BS.frame = (spine, s, F) => {
    spine(s - .6, pa); spine(s + .6, pb); const roll = spine(s, F.p);
    F.T.copy(pa).sub(pb).normalize(); tS.crossVectors(F.T, UP).normalize(); tU.crossVectors(tS, F.T);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    F.U.copy(tU).multiplyScalar(cr).addScaledVector(tS, sr); F.S.copy(tS).multiplyScalar(cr).addScaledVector(tU, -sr);
    return F;
  };
  BS.newFrame = () => ({ p: new THREE.Vector3(), T: new THREE.Vector3(), U: new THREE.Vector3(), S: new THREE.Vector3() });
  const FR = BS.newFrame();
  BS.pose = (g, spine, o = {}) => {
    const { t = 0, flap = 1, nod = 0, yaw = 0, glow = [1, 0, 0] } = o, D = g.userData;
    D.segs.forEach((sg, i) => { BS.frame(spine, 12.5 + i * 5, FR); sg.position.copy(FR.p); sg.quaternion.setFromRotationMatrix(m4.makeBasis(FR.S, FR.T, FR.U)); });
    BS.frame(spine, 4.4, FR); D.head.position.copy(FR.p); D.head.quaternion.setFromRotationMatrix(m4.makeBasis(FR.S, FR.T, FR.U)); D.head.rotateX(nod); D.head.rotateZ(yaw);
    for (const f of D.fins) f.p.rotation.y = -f.sx * (f.tilt + Math.sin(t * 1.7 - f.i * .6) * .24 * flap);
    D.glows.forEach((m, i) => { const k = cl(glow[i] || 0, 0, 1.6); m.visible = k > .02; m.material.color.setRGB(Math.min(1, .2 + k * .8), Math.min(1, .16 + k * .78), Math.min(1, .1 + k * .7)); });
  };

  // ================= 乗り物のけもの「ミズハネ」 =================
  // 絵（64×64・抜き）：上 32 段＝体の毛（左右のはしが背、まん中が腹）、左下＝顔、右下＝ひれ
  const mountTex = (c, belly) => {
    const P = Px(64), F = ramp(c), Be = ramp(belly), K0 = mix(c, '#101828', .7); P.clip = true;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const ax = Math.abs(x - 31.5), n = tn(x, y, 8, 8, 64, 32, 5);
      let col = ax < 9 ? Be[n > .6 ? 5 : 4] : ax < 11 ? Be[3 - ((x + y) & 1)] : F[3 + (n > .68 ? 1 : n < .26 ? -1 : 0)];
      if (ax > 26) col = F[1 + ((x + y * 2) % 5 === 0 ? 1 : 0)];
      if (ax > 12 && ax < 25 && Math.hypot(((x + (y >> 3 & 1) * 5) % 10) - 5, (y % 8) - 4) < 1.9) col = Be[4];
      P.set(x, y, col); }
    // 顔（0,32 32×32）：よこは頭のまわり（まん中 16 が鼻すじ…のうら＝あご）。左右のはしが ひたい
    for (let y = 32; y < 64; y++) for (let x = 0; x < 32; x++) { const ax = Math.abs(x - 15.5); P.set(x, y, ax < 6 ? Be[4] : F[ax > 13 ? 2 : 3]); }
    for (const ex of [6, 25]) { P.disc(ex + .5, 47.5, 3.2, K0); P.disc(ex + .5, 47.5, 2.3, '#18203a'); P.set(ex, 46, '#ffffff'); P.set(ex + 1, 46, '#ffffff'); P.rect(ex - 2, 43, 5, 1, F[1]); }
    P.rect(0, 34, 3, 3, K0); P.rect(29, 34, 3, 3, K0); P.rect(10, 36, 12, 1, K0); for (const x of [8, 10, 21, 23]) P.set(x, 39, K0);
    // ひれ（32,32 32×32）：つけ根が左。水かきの すじ
    for (let y = 32; y < 64; y++) for (let x = 32; x < 64; x++) { const dx = x - 30, dy = y - 47.5, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy); if (Math.abs(a) > .62 || r > 31 - Math.abs(Math.sin(a * 6)) * 3) { P.set(x, y, null); continue; } const rib = Math.abs(((a * 6 / PI + 20.5) % 1) - .5); P.set(x, y, rib < .12 ? F[1] : r > 24 ? Be[3] : F[rib > .3 ? 4 : 3]); }
    return T.from(P, { m: 1, cut: true });
  };
  BS.mount = (o = {}) => {
    const c = o.c || '#3f8f96', belly = o.belly || '#f2e6c8', t = mountTex(c, belly), m = R.mat(t, { vc: true, smooth: true, cut: true, side: true }), g = new THREE.Group(), J = {};
    const piv = (p, x = 0, y = 0, z = 0) => { const q = new THREE.Group(); q.position.set(x, y, z); p.add(q); return q; };
    const LZ = TR(0, 0, 0, 0, PI / 2, 0), W = 64;
    J.body = piv(g, 0, .2, 0);
    { const G = R.geo().smooth(1).px(0, 0, 64, 32, W, W).at(LZ); G.loft(8, [[-1.9, .1, .08, 0, .8], [-1.3, .4, .32, .3, .9], [-.4, .66, .58, .75, 1], [.5, .64, .56, 1.2, 1], [1.25, .44, .42, 1.6, 1]], { cap: 'both', capUV: [.5, .5] }); G.at(null); J.body.add(G.mesh(m)); }
    // くら（主役の国の布）と腹の帯
    { const ct = T.fabric({ c: o.cloth || '#c8402c', c2: '#f0c860', pattern: 'stripe' }), G = R.geo().smooth(1).at(LZ); G.loft(8, [[-.55, .7, .62, 0, .9], [.35, .68, .6, 1, 1]], { seg: [0, 3], ur: 1 }).loft(8, [[-.55, .7, .62, 0, .9], [.35, .68, .6, 1, 1]], { seg: [5, 8], ur: 1 }); G.at(null);
      const G2 = R.geo().smooth(0); G2.at(TR(0, .56, -.1, 0, 0, 0)).loft(6, [[0, .3, .36, 0, .8], [.1, .27, .33, .4, 1], [.14, .12, .2, .6, 1.05]], { cap: 'top' }).at(null); J.body.add(G.mesh(ct, { side: true }), G2.mesh(T.fabric({ c: '#7a4a2c', pattern: 'plain' }))); }
    // 首と頭（前へのびる）。長い耳びれ 2 枚
    J.head = piv(J.body, 0, .16, 1.05);
    { const G = R.geo().smooth(1).px(0, 0, 64, 32, W, W); G.loft(8, [[-.15, .4, .4, 0, .95, 0, -.1], [.3, .3, .3, .4, 1, 0, .12]], {});
      G.px(0, 32, 32, 32, W, W).at(TR(0, .5, .2, 0, PI / 2 - .5, 0)).loft(8, [[-.42, .26, .25, 0, 1], [-.1, .34, .31, .4, 1], [.3, .28, .24, .75, 1], [.62, .14, .12, 1, 1]], { cap: 'both', capUV: [.5, .9] }).at(null); J.head.add(G.mesh(m));
      J.ears = [1, -1].map(sx => { const p = piv(J.head, sx * .22, .78, .12), Ge = R.geo().normal([0, .3, 1]).px(32, 32, 32, 32, W, W); Ge.quad([0, -.12, 0], [sx * .25, .1, -.5], [sx * .5, .62, -.95], [sx * .08, .3, -.1], [0, .2, 1, .8]); p.add(Ge.mesh(m)); return p; }); }
    // 尾びれ（よこに広い板）と、前の水かき 2 枚
    J.tail = piv(J.body, 0, 0, -1.8); { const G = R.geo().normal([0, 1, 0]).px(32, 32, 32, 32, W, W); G.quad([-.1, 0, .1], [-.85, 0, -1.1], [.85, 0, -1.1], [.1, 0, .1], [0, 0, 1, 1]); J.tail.add(G.mesh(m)); }
    J.fl = [1, -1].map(sx => { const p = piv(J.body, sx * .52, -.2, .55), G = R.geo().normal([0, 1, 0]).px(32, 32, 32, 32, W, W); G.quad([0, 0, .2], [sx * .2, 0, -.3], [sx * .95, 0, -.5], [sx * .5, 0, .25], [0, 0, 1, 1]); p.add(G.mesh(m)); return p; });
    g.userData = { J, seat: [0, .88, -.1], dyn: true };
    BS.mountPose(g, 0, {}); return g;
  };
  BS.mountPose = (g, t, o = {}) => { const J = g.userData.J, sw = o.swim ?? 1, lp = o.leap || 0, f = Math.sin(t * 7);
    J.body.position.y = .2 + Math.sin(t * 3.5) * .05 * sw; J.body.rotation.x = Math.sin(t * 3.5 + 1) * .05 * sw - lp * .1;
    J.head.rotation.x = -.1 + Math.sin(t * 3.5 + .6) * .06 - lp * .25; J.tail.rotation.x = f * .5 * sw + lp * .5; J.ears.forEach((p, i) => { p.rotation.x = -.25 * sw - lp * .3 + Math.sin(t * 9 + i) * .05; });
    J.fl.forEach((p, i) => { const sx = i ? -1 : 1; p.rotation.z = sx * (-.5 + Math.sin(t * 7 + i * PI) * .45 * sw - lp * .5); p.rotation.x = Math.sin(t * 7 + i * PI + 1) * .3 * sw; }); };
  return BS;
};
