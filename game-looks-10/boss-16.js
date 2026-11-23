// 第 10 集 16「仲間と戦うアクション RPG のボス戦」用の、大きなあやつり人形「ポルカだんちょう」。kit.js・retro.js のあとに読み、 const BP = BOSS_16(THREE, K, R)  として使う。
// ■ 形：シルクハットのてっぺんまで 9 m ほど（5 頭身の人の 6.4 倍）。空にうかぶ十字の木から糸でつられた、サーカスの団長の人形。
//   しまの上着の胴（すそが広がる）、大きな丸い木の頭（描いた顔：光る目・赤い鼻・ぬい目の口・ほおの星）、シルクハット、ひだのえり、
//   玉の関節でつながる長いうでと白い手ぶくろ、ひし形もようの足と先のまがったくつ、背中のぜんまいのかぎ、胸の光るハート（弱点）。
//   すべて R.geo() の loft（輪をつないだ筒）と抜き色つきの板。箱は使わない。テクスチャは手で打った 64 ドット。足もとが y=0、正面が +z。
// ■ 使い方
//   const boss = BP.make({ s: 1 });  scene.add(boss);
//   BP.pose(boss, { t, armL: [前後, 開き, ひじ], armR: [前後, 開き, ひじ], lean（前へたおす）, drop（体を下げる m）, limp（0〜1 糸がゆるんで だらり）, head: [x, y, z], spin（体を回す）, kick（足のゆれ）, glow（0〜1 ハートの光） });
//     うでの「前後」は マイナスで前・上へ（-3 ほどで真上）、「開き」は横へ、「ひじ」はマイナスで曲がる
//   boss.userData = { J（関節）, h, heart（弱点。getWorldPosition）, handL, handR（手。getWorldPosition）, head }
window.BOSS_16 = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, BP = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // ---- 上着：赤とクリームの たてじま。x=0（前と背のまん中）に こんの合わせと金ボタン。こんのえり・ベルト、すそに金のぎざぎざ ----
  const coatTex = () => { const P = Px(64), A = ramp('#d8443a'), C = ramp('#f4e6c4'), N = ramp('#2a3478'), G = ramp('#f0c040');
    P.each((x, y) => { const s = (x >> 3) & 1, i = x & 7, M = s ? C : A, n = tn(x, y, 8, 16, 64, 64, 2); let t = i === 0 ? 1 : i === 1 ? 4.6 : i === 7 ? 2 : 3 + (n > .72 ? 1 : n < .22 ? -1 : 0);
      if (y < 7) return tone(N, y === 6 ? 1 : y === 0 ? 5 : 3 + (i === 1 ? 1 : 0)); if (y >= 36 && y < 42) return tone(N, y === 36 ? 5 : y === 41 ? 1 : 3);
      if (y > 57) { const z = (x + (y - 58) * 1) % 8; return y === 58 ? G[5] : tone(G, z < 4 ? 4 : 2); } return tone(M, t); });
    for (let y = 0; y < 64; y++) for (const x of [0, 1, 2, 61, 62, 63]) P.set(x, y, tone(N, x === 2 || x === 61 ? 1 : 3)); P.rect(62, 36, 2, 6, G[4]); P.rect(0, 36, 3, 6, G[4]); P.rect(0, 37, 2, 4, G[2]); P.set(63, 37, G[5]);
    for (let y = 11; y < 56; y += 11) if (y < 34 || y > 44) { P.rect(63, y, 1, 3, G[4]); P.rect(0, y, 2, 3, G[4]); P.set(0, y, G[5]); P.set(1, y + 2, G[1]); P.set(63, y + 2, G[1]); }
    for (let k = 0; k < 8; k++) { const x = 6 + Math.floor(hash(k, 1, 3) * 50), y = 10 + Math.floor(hash(k, 2, 3) * 42); P.set(x, y, '#8a2a2a'); P.set(x + 1, y + 1, '#fff6e0'); }
    return T.from(P, { m: 2 }); };
  // ---- うで：赤と白の よこじま。上と下のはしに 金の輪とびょう ----
  const armTex = (a, b) => { const P = Px(64), A = ramp(a), C = ramp(b), G = ramp('#f0c040');
    P.each((x, y) => { const s = (y >> 3) & 1, j = y & 7, M = s ? C : A, n = tn(x, y, 16, 8, 64, 64, 4), side = x % 32; let t = j === 0 ? 4.6 : j === 7 ? 1 : 3 + (n > .7 ? 1 : 0); t += side < 6 ? 1 : side > 24 ? -1.2 : 0;
      if (y < 4 || y > 59) return (x % 8 === 3 && (y === 1 || y === 62)) ? G[1] : tone(G, y === 0 || y === 60 ? 5 : y === 3 || y === 63 ? 1 : 3 + (side < 6 ? 1 : 0)); return tone(M, t); });
    for (let k = 0; k < 6; k++) { const x = Math.floor(hash(k, 4, 1) * 64), y = 6 + Math.floor(hash(k, 5, 1) * 50); P.set(x, y, '#b08a5a'); P.set(x + 1, y, '#b08a5a'); P.set(x, y + 1, '#7a5a3a'); }
    return T.from(P, { m: 2 }); };
  // ---- 足：青緑と黄の ひし形もよう（道化のタイツ） ----
  const legTex = () => { const P = Px(64), A = ramp('#2aa8a0'), C = ramp('#ffd040'), G = ramp('#f0c040');
    P.each((x, y) => { const u = (x + y) & 15, v = (x - y + 64) & 15, s = (((x + y) >> 4) + ((x - y + 64) >> 4)) & 1, M = s ? C : A, side = x % 32; let t = u === 0 || v === 0 ? 1 : u === 1 || v === 1 ? 4.5 : 3; t += side < 6 ? 1 : side > 24 ? -1.2 : 0;
      if (y < 4 || y > 59) return tone(G, y === 0 || y === 60 ? 5 : y === 3 || y === 63 ? 1 : 3); return tone(M, t); });
    return T.from(P, { m: 2 }); };
  // ---- 頭：木の玉に描いた顔（x=32 が正面）。うしろと上は むらさきの まき毛。光る目は別の板 ----
  const faceTex = () => { const P = Px(64), W = ramp('#f4dfb8'), Hc = ramp('#7a3ab8'), Rd = ramp('#e0483a'); P.clip = true;
    P.each((x, y) => { const n = tn(x, y, 16, 8, 64, 64, 6), back = Math.min(x, 63 - x), hair = back < 13 - Math.max(0, y - 40) * .2 || y < 9 + Math.round(Math.sin(x * .8) * 2);
      if (hair) { const c = Math.sin(x * .9 + Math.sin(y * .5) * 2.2) + Math.sin(y * .8); return tone(Hc, 3 + (c > .9 ? 1.4 : c < -.9 ? -1.4 : 0) - (y > 50 ? 1 : 0)); }
      let t = 3 + (n > .7 ? .6 : 0) + (y < 16 ? 1 : y > 52 ? -1.5 : 0) + (x < 18 || x > 46 ? -1 : 0); if ((y % 9 === 4) && n > .45 && n < .6) t -= 1; return tone(W, t); });
    for (const ex of [23.5, 40.5]) { P.disc(ex, 27, 6.6, '#3a2440'); P.disc(ex, 27.4, 5.5, '#fffdf0'); P.disc(ex, 28, 3.6, '#ffc820'); P.disc(ex, 28.2, 1.9, '#201028'); P.set(ex - 2, 26, '#ffffff'); P.set(ex - 1, 25, '#ffffff'); for (let i = -6; i <= 6; i++) P.set(ex + i, 20 - Math.round((ex < 32 ? i : -i) * .28), '#3a2440'); }
    for (const cx of [17.5, 46.5]) { P.disc(cx, 38, 3.4, Rd[4]); P.disc(cx, 38, 2.2, '#ff8a8a'); }
    P.bits(13, 30, ['..y..', '.yyy.', 'yyyyy', '.yyy.', 'y...y'], { y: '#ffd040' });
    for (let x = 19; x <= 45; x++) { const c = Math.round(Math.pow(Math.abs(x - 32) / 13, 2) * -5) + 46; P.set(x, c - 1, '#3a2440'); for (let j = 0; j < 4; j++) P.set(x, c + j, (x % 3 === 0) ? '#3a2440' : j === 0 ? '#ffffff' : '#f0e8d8'); P.set(x, c + 4, '#3a2440'); P.set(x, c + 5, Rd[2]); }
    for (const x of [19, 45]) for (let y = 42; y < 60; y++) { P.set(x, y, '#5a3a30'); P.set(x + (x < 32 ? 1 : -1), y, W[5]); }
    for (let x = 14; x < 50; x++) if (x % 2) P.set(x, 61, W[1]);
    return T.from(P, { m: 1 }); };
  // ---- シルクハット：こいむらさき。金の帯と星 ----
  const hatTex = () => { const P = Px(64), Hc = ramp('#3a2470'), G = ramp('#f0c040');
    P.each((x, y) => { const side = x % 32, n = tn(x, y, 8, 16, 64, 64, 8); let t = 3 + (side < 5 ? 1.5 : side < 10 ? .7 : side > 24 ? -1.3 : 0) + (n > .75 ? .6 : 0); if (y >= 44 && y < 54) return tone(G, y === 44 ? 5 : y === 53 ? 1 : 3 + (side < 6 ? 1 : 0)); if (y < 2) t += 1.5; if (y > 60) t -= 1; return tone(Hc, t); });
    for (const x0 of [14, 46]) P.bits(x0, 45, ['...r...', '...r...', 'rrrrrrr', '.rrrrr.', '.rr.rr.', 'r.....r'], { r: '#e0483a' });
    return T.from(P, { m: 1 }); };
  // ---- 手ぶくろ：白。ぬい目 3 本と 赤いそで口 ----
  const gloveTex = () => { const P = Px(32), W = ramp('#f4f0e8'), Rd = ramp('#e0483a');
    P.each((x, y) => { if (y > 25) return tone(Rd, y === 26 ? 5 : y === 31 ? 1 : 3 + (x % 16 < 4 ? 1 : 0)); const side = x % 16; let t = 3.4 + (side < 4 ? 1 : side > 12 ? -1.2 : 0); if ((x % 8 === 4) && y > 4 && y < 20) t = 1; return tone(W, t); });
    return T.from(P, { m: 1 }); };
  // ---- ひだのえり（抜き）：白い三角のならび。先に金の玉 ----
  const ruffTex = () => { const P = Px(32), W = ramp('#fff8ea'); P.clip = true;
    for (let x = 0; x < 32; x++) { const i = x & 7, len = 30 - Math.abs(i - 3.5) * 5; for (let y = 0; y < len; y++) P.set(x, 31 - y, tone(W, i < 3 ? 4 : i > 5 ? 2 : 3 + (y > len - 3 ? -2 : 0))); if (i === 3 || i === 4) { P.set(x, 31 - Math.floor(len), '#f0c040'); P.set(x, 30 - Math.floor(len), '#fff0a0'); } }
    return T.from(P, { m: 1, cut: true }); };
  // ---- 抜きの小さな絵：ハート（弱点）と、ぜんまいのかぎ ----
  const heartTex = () => { const P = Px(16); P.clip = true; P.bits(0, 1, ['..kkk....kkk..', '.kwwrk..krrrk.', 'kwwrrrkkrrrrrk', 'kwrrrrrrrrrrrk', 'krrrrrrrrrrrrk', 'krrrrrrrrrrrdk', '.krrrrrrrrrdk.', '..krrrrrrrdk..', '...krrrrrdk...', '....krrrdk....', '.....krdk.....', '......kk......'], { k: '#fff0f4', w: '#ffffff', r: '#ff4a7a', d: '#c8204a' }); return T.from(P, { m: 1, cut: true }); };
  const keyTex = () => { const P = Px(32), G = ramp('#f0c040'); P.clip = true; for (const cx of [8.5, 22.5]) for (let y = 2; y < 22; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x + .5 - cx, y + .5 - 12); if (d < 8 && d > 4) P.set(x, y, tone(G, d > 7 ? 1 : d < 5 ? 2 : x < cx ? 4.5 : 3)); }
    for (let y = 12; y < 32; y++) for (let x = 13; x < 18; x++) P.set(x, y, tone(G, x === 13 ? 5 : x === 17 ? 1 : 3)); return T.from(P, { m: 1, cut: true }); };

  BP.make = (o = {}) => { const s = o.s || 1, tCoat = coatTex(), tArm = armTex('#e0483a', '#fff4e0'), tLeg = legTex(), tFace = faceTex(), tHat = hatTex(), tGlove = gloveTex(), tWood = T.planks({ c: '#b8834a' });
    const grp = (p, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); if (p) p.add(g); return g; }, done = (j, G, t, q) => { const m = G.mesh(t, q); j.add(m); return m; };
    const J = { root: new THREE.Group() }; J.root.scale.setScalar(s); J.hang = grp(J.root, 0, 0, 0);
    // 胴：すそが広がる上着。胸に光るハート、背中に ぜんまいのかぎ
    J.body = grp(J.hang, 0, 3.9, 0);
    { const G = R.geo().smooth(1); G.loft(10, [[-1.45, 1.45, 1.3, 1, .8], [-1.1, 1.15, 1.02, .9, .88], [-.4, .92, .82, .62, .95], [.7, 1.2, 1, .28, 1.02], [1.45, 1.02, .82, .1, 1.06], [1.8, .4, .36, 0, 1.1]], { ur: 2, cap: 'both', capUV: [.5, .01] }); done(J.body, G, tCoat);
      const Gh = R.geo(); Gh.quad([-.42, .35, 1.02], [.42, .35, 1.02], [.42, 1.15, .98], [-.42, 1.15, .98]); J.heart = new THREE.Mesh(Gh.build(), new THREE.MeshBasicMaterial({ map: heartTex(), alphaTest: .5, fog: false, side: THREE.DoubleSide })); J.body.add(J.heart);
      J.key = grp(J.body, 0, .5, -.95); const Gk = R.geo(); Gk.quad([-.75, 0, 0], [.75, 0, 0], [.75, 1.5, 0], [-.75, 1.5, 0]); const km = Gk.mesh(keyTex(), { side: true }); km.rotation.x = -PI / 2; J.key.add(km); }
    // 頭：木の玉・赤い鼻・ひだのえり・シルクハット
    J.head = grp(J.body, 0, 1.75, 0);
    { const G = R.geo().smooth(1), RH = [[.05, .5, 0], [.3, .92, .1], [.75, 1.1, .3], [1.25, 1.12, .52], [1.7, .98, .74], [2.02, .62, .9], [2.15, .05, 1]]; G.loft(10, RH.map(([y, r, v]) => [y, r, r * .96, 1 - v, .85 + v * .25]), { ur: 1 }); done(J.head, G, tFace);
      const Gn = R.geo().smooth(1).at(TR(0, 1.02, 1.02, 0, PI / 2, 0)); Gn.loft(6, [[-.1, .2, .2, 0, .9], [.12, .27, .27, .3, 1.05], [.34, .2, .2, .6, 1.1], [.44, .04, .04, 1, 1.2]], {}); done(J.head, Gn, T.from((() => { const P = Px(8), Rr = ramp('#e83a3a'); P.each((x, y) => tone(Rr, y < 3 ? 2 : y < 6 ? 3 : 5)); return P; })(), { m: 1 }));
      const Ge = R.geo(); for (const sx of [-1, 1]) Ge.quad([sx * .37 - .13, 1.12, 1.085], [sx * .37 + .13, 1.12, 1.085], [sx * .37 + .13, 1.38, 1.07], [sx * .37 - .13, 1.38, 1.07]); J.eyes = new THREE.Mesh(Ge.build(), new THREE.MeshBasicMaterial({ color: '#ffd020', fog: false })); J.head.add(J.eyes);
      const Gr = R.geo().smooth(2); Gr.loft(10, [[.32, .5, .5, 1, 1], [-.12, 1.5, 1.4, 0, .95]], { ur: 5 }); done(J.head, Gr, ruffTex(), { side: true });
      J.hat = grp(J.head, 0, 2.02, -.05); const Gt = R.geo().smooth(1); Gt.loft(10, [[0, 1.2, 1.2, .98, .8], [.1, 1.25, 1.25, .92, 1], [.14, .72, .72, .86, .9], [1.25, .8, .8, .1, 1.05], [1.3, .05, .05, 0, 1.1]], { ur: 2 }); done(J.hat, Gt, tHat); J.hat.rotation.set(-.08, 0, .14); }
    for (const [n, sx] of [['L', 1], ['R', -1]]) {
      // うで：かたの玉 → 上うで → ひじの玉 → 前うで → 大きな手ぶくろ
      const A = J['arm' + n] = grp(J.body, sx * 1.22, 1.25, 0), Fo = J['fore' + n] = grp(A, 0, -1.7, 0), Hd = J['hand' + n] = grp(Fo, 0, -1.6, 0);
      { const G = R.geo().smooth(1); G.loft(6, [[-.36, .05, .05, 0, .85], [-.2, .34, .34, .03, .95], [.1, .4, .4, .03, 1.05], [.34, .05, .05, 0, 1.1]], {}); G.loft(6, [[-1.62, .22, .22, 1, .85], [-.9, .27, .27, .5, .95], [-.2, .24, .24, .06, 1]], { ur: 2 }); done(A, G, tArm); }
      { const G = R.geo().smooth(1); G.loft(6, [[-.3, .05, .05, 0, .85], [-.15, .3, .3, .03, .95], [.12, .3, .3, .03, 1.05], [.3, .05, .05, 0, 1.1]], {}); G.loft(6, [[-1.55, .3, .3, 1, .85], [-.8, .24, .24, .5, .95], [-.2, .2, .2, .06, 1]], { ur: 2 }); done(Fo, G, tArm); }
      { const G = R.geo().smooth(1); G.loft(6, [[-.95, .3, .16, 0, .85], [-.6, .58, .24, .4, 1], [-.1, .5, .26, .8, 1.02], [.12, .36, .34, 1, 1.05]], { cap: 'both', ur: 2 }); for (const [fx, fl] of [[-.38, .5], [-.13, .62], [.13, .6], [.38, .46]]) G.at(TR(fx, -.9, 0, 0, 0, fx * -.25)).loft(4, [[-fl, .06, .07, 0, .85], [-fl * .5, .12, .12, .3, .95], [.08, .13, .13, .6, 1]], { cap: 'bot' }); G.at(TR(sx * -.56, -.3, .05, 0, 0, sx * -1)).loft(4, [[-.5, .06, .07, 0, .85], [-.2, .13, .13, .3, .95], [.1, .14, .14, .6, 1]], { cap: 'bot' }).at(null); done(Hd, G, tGlove); }
      // 足：もも → ひざの玉 → すね → 先のまがった くつ
      const Lg = J['leg' + n] = grp(J.body, sx * .52, -1.25, 0), Sh = J['shin' + n] = grp(Lg, 0, -1.25, 0);
      { const G = R.geo().smooth(1); G.loft(6, [[-1.2, .25, .25, 1, .85], [-.5, .32, .32, .45, .95], [.2, .3, .3, .06, 1]], { ur: 2 }); G.loft(6, [[-1.5, .05, .05, 0, .85], [-1.36, .3, .3, .03, .95], [-1.12, .3, .3, .03, 1.05], [-.98, .05, .05, 0, 1.1]], {}); done(Lg, G, tLeg); }
      { const G = R.geo().smooth(1), Gs = R.geo().smooth(1); G.loft(6, [[-1.2, .2, .2, 1, .85], [-.6, .3, .3, .5, .95], [-.1, .22, .22, .06, 1]], { ur: 2 }); done(Sh, G, tLeg);
        Gs.at(TR(0, -1.32, -.25, 0, PI / 2, 0)).loft(6, [[-.15, .22, .2, 0, .8], [.3, .36, .26, .3, .95], [.9, .3, .2, .6, 1.02], [1.35, .14, .12, .8, 1.05, 0, -.14], [1.6, .04, .04, 1, 1.1, 0, -.42]], { cap: 'bot' }).at(null); done(Sh, Gs, T.from((() => { const P = Px(16), Rr = ramp('#e0483a'), G2 = ramp('#f0c040'); P.each((x, y) => y < 3 ? tone(G2, 4) : tone(Rr, (x % 8 < 2 ? 5 : x % 8 > 5 ? 2 : 3))); return P; })(), { m: 1 })); } }
    // 空の十字の木と、5 本の糸（頭・両手・両ひざ）
    J.cross = grp(J.root, 0, 12.4, 0); { const G = R.geo().smooth(0); for (const ry of [.5, .5 + PI / 2]) G.at(TR(0, 0, 0, ry, 0, PI / 2)).loft(4, [[-2.9, .16, .1, 0, .85], [2.9, .16, .1, 4, 1]], { cap: 'both', rot: 0 }); G.at(null); done(J.cross, G, tWood); }
    const g = new THREE.Group(); g.add(J.root);
    const ends = [[J.hat, 0, 1.3, 0, 0, 0], [J.handL, 0, 0, 0, 2.3, 1.4], [J.handR, 0, 0, 0, -2.3, 1.4], [J.shinL, 0, .1, .2, 1.6, -1.9], [J.shinR, 0, .1, .2, -1.6, -1.9]], lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(ends.length * 6), 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#fff4d8', fog: false })); lines.frustumCulled = false; lines.userData.dyn = true; g.add(lines);
    g.userData = { J, h: 9.2 * s, heart: J.heart, handL: J.handL, handR: J.handR, head: J.head, ends, lines, s };
    BP.pose(g, {}); return g; };

  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  BP.pose = (g, p = {}) => { const U = g.userData, J = U.J, { t = 0, armL = [-.25, .45, -.7], armR = [-.25, .45, -.7], lean = 0, drop = 0, limp = 0, head = [0, 0, 0], spin = 0, kick = 0, glow = 0 } = p, sw = Math.sin(t * 1.3), sw2 = Math.sin(t * 1.9 + 1), lp = limp;
    J.hang.position.set(sw * .12, .35 + sw2 * .1 - drop - lp * 1.1, 0); J.hang.rotation.set(lean + lp * .35, spin, sw * .03 + lp * .12);
    J.body.rotation.set(sw2 * .03, 0, -sw * .04); J.head.rotation.set(head[0] + sw2 * .05 + lp * .55, head[1], head[2] + sw * .07 + lp * .3); J.key.rotation.z = t * 2.5;
    for (const [n, s, a] of [['L', 1, armL], ['R', -1, armR]]) { const jig = Math.sin(t * 2.3 + (s > 0 ? 0 : 1.7)) * .08;
      J['arm' + n].rotation.set(a[0] * (1 - lp) + jig + lp * .1, 0, s * (a[1] * (1 - lp) + lp * .12)); J['fore' + n].rotation.set(a[2] * (1 - lp) - lp * .15 + jig, 0, 0); J['hand' + n].rotation.set(-.2 + jig * 2, 0, 0);
      const k = Math.sin(t * 2.1 + (s > 0 ? .6 : 2.4)); J['leg' + n].rotation.set(-.12 + k * (.14 + kick * .5) - lp * .5, 0, s * .06); J['shin' + n].rotation.set(.25 + Math.max(0, k) * (.3 + kick * .5) + lp * .9, 0, 0); }
    J.cross.rotation.set(sw2 * .05, t * .15 + spin, sw * .08); J.cross.position.y = 12.4 - lp * .6; J.heart.scale.setScalar(1 + Math.sin(t * 5) * .06 + glow * .35);
    // 糸：十字の木のはしから、頭・手・ひざへ（ゆるんだときは たるむ先を少し下へ）
    g.updateMatrixWorld(true); const pos = U.lines.geometry.attributes.position;
    U.ends.forEach(([j, ox, oy, oz, cx, cz], i) => { v1.set(ox, oy, oz); j.localToWorld(v1); g.worldToLocal(v1); v2.set(cx, 0, cz); J.cross.localToWorld(v2); g.worldToLocal(v2); pos.setXYZ(i * 2, v1.x, v1.y, v1.z); pos.setXYZ(i * 2 + 1, v2.x, v2.y, v2.z); }); pos.needsUpdate = true; };
  return BP;
};
