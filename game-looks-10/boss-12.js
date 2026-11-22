// 第 10 集 12「ダンジョンを進む剣のアクションのボス戦」用の、地底の水の広間の主「イワガマ」（岩の大ガエル）。kit.js・retro.js のあとに読み、 const B12 = BOSS_12(THREE, K, R)  として使う。
// ■ 形：すわった高さ 5 m・はば 7 m ほど（s = 1 のとき。5 頭身の人の 4 倍前後）。ひびの入った青緑の岩のはだに、明るい いぼと こいしま。おなかと のどは うす黄色。
//   頭の上に 2 つの大きな目（光る）、開く下あご（中が赤く光る）と のびる舌、ふくらむ のどのふくろ（だいだいに光る）、背中の水晶（光る。いかると のびる）。
//   すべて R.geo() の loft（輪をつないだ筒）と、手で打った 128 ドットの絵 1 枚。箱は使わない。足もとが y=0、正面が +z。
// ■ 使い方
//   const boss = B12.make({ c: 岩の色, belly: おなかの色, s: 1 });   scene.add(boss);
//   B12.pose(boss, { t（秒）, mouth（0〜1 口の開き）, sac（0〜1 のどのふくらみ）, eye（0〜1 目の開き）, cry（0〜1 水晶ののび）, squash（0〜1 しゃがむ）, leg（0〜1 うしろ足をのばす）, lean（うしろへそる）, shake（0〜1）, tongue（舌の長さ m）, aim（舌の向き） });
//   boss.userData = { J（関節と部位。headA / mouthA / sacA は ねらう位置の Object3D）, mat（体の材質。color で色をかける）, glow: { eye, mouth, sac, cry }（光る材質）, h }
window.BOSS_12 = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, B12 = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // ---- 絵（128×128）：はだ 0,0 128×64（よこは体のひと回り。左右のはしが背中、まん中が おなか）／おなか 0,64 64×32 ／ 目 64,64 32×32 ／ 口の中 96,64 32×32 ／ 手足 0,96 64×32 ／ 水晶 64,96 32×32 ／ のど 96,96 32×32
  const paint = o => { const P = Px(128), M = ramp(o.c || '#3f8a86', 6, { contrast: 1 }), Be = ramp(o.belly || '#f0dc98'), K0 = '#12202c', WART = '#a8f4d0'; P.clip = true;
    // 岩の板：ずらした格子の点からの近さで板に分け、境目を暗いひびに、左上のふちを明るく
    const cell = (x, y, W, H, n) => { let d1 = 1e9, d2 = 1e9, id = 0; const gx = W / n, gy = H / Math.max(1, Math.round(n * H / W)), ny = Math.round(H / gy), ix = Math.floor(x / gx), iy = Math.floor(y / gy); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = ix + i, cy = iy + j, wx = ((cx % n) + n) % n, wy = ((cy % ny) + ny) % ny, px = (cx + .2 + hash(wx, wy, 3) * .6) * gx, py = (cy + .2 + hash(wx, wy, 4) * .6) * gy, d = Math.hypot(x - px, (y - py) * 1.15); if (d < d1) { d2 = d1; d1 = d; id = wx + wy * 17; } else if (d < d2) d2 = d; } return { e: d2 - d1, id }; };
    for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) { const v = cell(x, y, 128, 64, 9), bx = Math.abs(x - 64), n = tn(x, y, 8, 8, 128, 64, 5), stripe = Math.sin(y * .42 + Math.sin(x * .2) * 1.5) > .55 && bx > 30; let c;
      if (bx < 22 + Math.sin(y * .5) * 2) { c = tone(Be, 3 + (y % 9 === 0 ? -2 : y % 9 === 1 ? 1 : 0) + (n > .75 ? 1 : 0)); if (hash(x, y, 7) > .97) c = tone(Be, 1); }
      else if (bx < 25 + Math.sin(y * .5) * 2) c = K0;
      else { const k = 2 + (hash(v.id, 2) > .5 ? 1 : 0) - (stripe ? 1 : 0); c = v.e < 1.1 ? K0 : v.e < 2.4 && cell(x - 1, y - 1, 128, 64, 9).id !== v.id ? tone(M, k + 2) : tone(M, k + (n > .7 ? 1 : n < .28 && ((x + y) & 1) ? -1 : 0)); }
      P.set(x, y, c); }
    for (let i = 0; i < 46; i++) { const x = Math.floor(hash(i, 1, 9) * 128), y = 2 + Math.floor(hash(i, 2, 9) * 60); if (Math.abs(x - 64) < 30) continue; const r = hash(i, 3, 9) > .6 ? 2 : 1; P.disc(x + .5, y + .5, r + 1.2, K0); P.disc(x + .5, y + .5, r + .2, WART); P.set(x - (r > 1 ? 1 : 0), y - (r > 1 ? 1 : 0), '#ffffff'); }
    // おなか・下あご：よこのしわと、そばかす。上の 2 段は くちびるの暗い線
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { let c = tone(Be, 3 + (y % 7 === 0 ? -2 : y % 7 === 1 ? 1 : 0) + (tn(x, y, 8, 8, 64, 32, 2) > .7 ? 1 : 0)); if (hash(x, y, 11) > .965) c = tone(Be, 1); if (y > 28) c = y === 29 ? K0 : tone(M, 2); P.set(x, 64 + y, c); }
    // 目：金色の ひとみに、よこ長の黒い切れこみ。まわりは こい輪
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = x - 15.5, dy = y - 15.5, d = Math.hypot(dx, dy); P.set(64 + x, 64 + y, d > 15 ? K0 : d > 13 ? '#7a3a10' : Math.abs(dy) < 3.2 - Math.abs(dx) * .22 && Math.abs(dx) < 10 ? '#1a1010' : d > 10.5 ? '#f08a20' : (x + y) % 5 === 0 ? '#fff0a0' : '#ffd040'); } P.rect(64 + 8, 64 + 7, 3, 2, '#ffffff'); P.set(64 + 21, 64 + 22, '#fff4c0');
    // 口の中：赤から暗い奥へ。上あごの すじ
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - 15.5, (y - 15.5) * 1.3); P.set(96 + x, 64 + y, d < 5 ? '#4a1028' : d < 9 ? '#a02a3a' : d < 13 ? ((x + y) % 4 === 0 ? '#ff9a7a' : '#e8584a') : x % 4 === 0 ? '#c8443a' : '#f07a5a'); }
    // 手足：岩の板のつづき。先は明るい指、よこのしわ
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const v = cell(x, y, 64, 32, 5), n = tn(x, y, 8, 8, 64, 32, 6), k = y < 7 ? 4 : 3; let c = v.e < 1 ? K0 : tone(M, k + (n > .7 ? 1 : n < .3 && ((x + y) & 1) ? -1 : 0)); if (y < 5) c = y === 4 ? K0 : tone(Be, 3 + (x % 8 === 0 ? -2 : 0)); if (y % 10 === 9 && y > 6) c = tone(M, 1); P.set(x, 96 + y, c); }
    // 水晶：ななめの面の明暗
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const f = ((x + y * 2) >> 3) & 3; P.set(64 + x, 96 + y, (x * 3 + y) % 16 === 0 ? '#ffffff' : ['#e8ffff', '#8ae8ff', '#4ab8e8', '#b8f4ff'][f]); }
    // のどのふくろ：だいだいの地に、明るい すじ
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const n = tn(x, y, 8, 8, 32, 32, 9); P.set(96 + x, 96 + y, (x % 8 === 0 || (y + (x >> 3) * 3) % 11 === 0) ? '#fff0b0' : n > .65 ? '#ffc060' : n < .3 ? '#e8782a' : '#ffa040'); }
    return T.from(P, { m: 1 }); };

  B12.make = (o = {}) => { const s = o.s || 1, t = paint(o), g = new THREE.Group(), J = { root: new THREE.Group() }, grp = (p, x = 0, y = 0, z = 0) => { const q = new THREE.Group(); q.position.set(x, y, z); p.add(q); return q; };
    const px = (G, x, y, w, h) => G.px(x, y, w, h, 128, 128), glowM = k => R.mat(t, { glow: true, side: true, color: '#fffff' + k }), glow = { eye: glowM('f'), mouth: glowM('e'), sac: glowM('d'), cry: glowM('c') }, mat = R.mat(t, { vc: true, smooth: true, color: '#fffffe' });
    g.add(J.root); J.root.scale.setScalar(s); J.body = grp(J.root, 0, 0, 0); const Z = TR(0, 2, 0, 0, PI / 2, 0);
    // 体：うしろが低く、頭が高い だえんの筒（+z が鼻先）。前足は体といっしょ
    const G = R.geo().smooth(1).at(Z); px(G, 0, 0, 128, 64).loft(12, [[-3, .5, .4, 0, .7, 0, .5], [-2.3, 2.1, 1.3, .15, .85, 0, .3], [-1, 3, 1.9, .4, 1, 0, 0], [.5, 2.9, 1.85, .65, 1.05, 0, -.3], [1.7, 2.5, 1.5, .85, 1.1, 0, -.6], [2.5, 1.9, 1, .97, 1.12, 0, -.75], [2.75, 1.2, .55, 1, 1.1, 0, -.8]], { cap: 'both' });
    for (const sx of [-1, 1]) { G.smooth(2).at(TR(sx * 2.95, 0, 2.1, sx * .3, -.3, sx * .32)); px(G, 0, 96, 64, 32).loft(7, [[.15, .5, .55, 0, .8], [1, .52, .55, .45, .95], [2.3, .8, .75, 1, 1.05]], {}); G.at(TR(sx * 2.95, 0, 2.2, sx * .3)).loft(7, [[0, .85, .95, 0, .7, 0, .2], [.3, .6, .7, .2, 1, 0, .1], [.42, .3, .3, .3, 1.05]], { cap: 'both' });
      for (const a of [-.5, 0, .5]) G.smooth(0).at(TR(sx * 2.95, .12, 2.5, sx * .3 + a, PI / 2 + .08, 0)).loft(4, [[0, .22, .14, .3, .9], [.75, .2, .1, .1, 1.05], [1, .28, .12, 0, 1.15]], { cap: 'top' });
      // 目のふくらみ
      G.smooth(3).at(TR(sx * 1.3, 3.55, 1.25)); px(G, 0, 0, 128, 64).rect(.72 + sx * .02, .2, .98, .8).loft(8, [[-.5, .55, .6, 0, .9], [0, .92, .95, .4, 1.05], [.5, .85, .85, .8, 1.12], [.85, .4, .4, 1, 1.15]], { cap: 'top' }); }
    G.at(null); const bm = new THREE.Mesh(G.build(), mat); bm.castShadow = bm.receiveShadow = true; J.body.add(bm);
    // うしろ足（たたんだ もも・すね・長い足さき）。こしの関節で うしろへのびる
    for (const [n, sx] of [['L', 1], ['R', -1]]) { const hip = J['hip' + n] = grp(J.body, sx * 2.5, 1.35, -1.5), Gl = R.geo().smooth(1); px(Gl, 0, 96, 64, 32);
      Gl.at(TR(0, 0, 0, sx * .5, PI / 2 - .25, 0)).loft(8, [[-.3, .7, .7, 1, .8], [.4, 1, .95, .8, 1], [1.4, .85, .75, .5, 1.05], [2.5, .5, .45, .3, 1]], { cap: 'both' });
      Gl.smooth(2).at(TR(sx * 1.3, .7, 2.1, sx * .25 + PI, PI / 2 + .3, 0)).loft(7, [[-.2, .5, .46, .35, .9], [2.3, .34, .3, .3, .8]], { cap: 'both' });
      Gl.smooth(0).at(TR(sx * .75, -1.2, .1, sx * .45, PI / 2, 0)).loft(6, [[-.2, .36, .2, .3, .8], [1.2, .5, .17, .15, 1], [2.3, .8, .13, .02, 1.1]], { cap: 'both' }); const m = new THREE.Mesh(Gl.build(), mat); m.castShadow = true; hip.add(m); }
    // 下あご（うしろのはしを軸に下へ開く）と、口の中の光・舌
    J.jaw = grp(J.body, 0, 2.15, 1.15); { const Gj = R.geo().smooth(1).at(TR(0, 0, 0, 0, PI / 2, 0)); px(Gj, 0, 64, 64, 32).loft(10, [[-.2, 2.3, .5, 0, .8, 0, .35], [.8, 2.4, .62, .4, 1, 0, .3], [1.45, 1.95, .5, .8, 1.05, 0, .2], [1.75, 1.2, .3, 1, 1.05, 0, .1]], { cap: 'both' }); const m = new THREE.Mesh(Gj.build(), mat); m.castShadow = true; J.jaw.add(m); }
    { const Gm = R.geo().at(TR(0, 2.1, 2.2, 0, PI / 2 + .25, 0)); px(Gm, 96, 64, 32, 32).loft(10, [[0, 1.75, .6, 0], [.3, 1.5, .5, 1]], { cap: 'top', capRect: true }); J.mouthM = Gm.mesh(glow.mouth); J.mouthM.castShadow = false; J.body.add(J.mouthM); J.mouthA = grp(J.body, 0, 2.2, 2.9);
      J.tongue = grp(J.body, 0, 2.05, 2.3); const Gt = R.geo().at(TR(0, 0, 0, 0, PI / 2, 0)); px(Gt, 96, 64, 32, 32).rect(.76, .3, .98, .45).loft(6, [[0, .3, .2, 0], [.9, .26, .18, .8], [.94, .5, .34, .9], [1, .3, .2, 1]], { cap: 'top' }); const tm = Gt.mesh(glow.mouth); tm.castShadow = false; J.tongue.add(tm); }
    // 目（光る）・のどのふくろ（光る）・背中の水晶（光る）
    for (const [n, sx] of [['L', 1], ['R', -1]]) { const e = J['eye' + n] = grp(J.body, sx * 1.55, 3.85, 1.95), Ge = R.geo().at(TR(0, 0, 0, sx * .5, PI / 2 - .15, 0)); px(Ge, 64, 64, 32, 32).loft(10, [[0, .68, .68, 0], [.05, .62, .62, 1]], { cap: 'top', capRect: true }); const m = Ge.mesh(glow.eye); m.castShadow = false; e.add(m); }
    J.sac = grp(J.body, 0, 1.25, 2.05); { const Gs = R.geo().smooth(1); px(Gs, 96, 96, 32, 32).loft(9, [[-.95, .3, .3, 0], [-.6, .95, .9, .25], [0, 1.25, 1.15, .5], [.6, .95, .9, .75], [.95, .3, .3, 1]], { cap: 'both' }); const m = Gs.mesh(glow.sac); m.castShadow = false; J.sac.add(m); } J.sacA = grp(J.body, 0, 1.3, 3.2); J.headA = grp(J.body, 0, 3.3, 2.5);
    J.cry = grp(J.body, 0, 3.55, -.5); { const Gc = R.geo().smooth(0); px(Gc, 64, 96, 32, 32); for (const [x, z, h, rx, rz] of [[0, .9, 1.7, -.15, 0], [-.95, .3, 1.4, -.2, .3], [.95, .3, 1.4, -.2, -.3], [0, -.5, 2.3, -.3, 0], [-1.3, -1, 1.5, -.45, .4], [1.3, -1, 1.5, -.45, -.4], [0, -1.7, 1.6, -.6, 0]]) Gc.at(TR(x, -.35 - Math.abs(x) * .25 - Math.max(0, -z) * .22, z, hash(x, z) * 3, rx, rz)).loft(5, [[0, .42, .42, 0, .8], [h * .6, .32, .32, .6, 1], [h, .02, .02, 1, 1.2]], {}); const m = Gc.mesh(glow.cry); m.castShadow = false; J.cry.add(m); }
    g.userData = { kind: 'boss12', J, s, h: 5 * s, glow, mat }; B12.pose(g, {}); return g; };

  B12.pose = (g, p = {}) => { const J = g.userData.J, t = p.t || 0, sq = p.squash || 0, sh = p.shake || 0, br = Math.sin(t * 1.7) * .012, e = cl(p.eye ?? 1), sac = cl(p.sac || 0), lg = cl(p.leg || 0);
    J.body.position.set(Math.sin(t * 47) * .08 * sh, 0, Math.sin(t * 39) * .06 * sh); J.body.scale.set(1 + sq * .08 - br, 1 - sq * .2 + br * 2, 1 + sq * .05); J.body.rotation.set(-(p.lean || 0), 0, Math.sin(t * 53) * .025 * sh);
    J.jaw.rotation.x = cl(p.mouth || 0) * .6 + sac * .04 * Math.sin(t * 7); J.mouthM.visible = (p.mouth || 0) > .05; J.eyeL.scale.y = J.eyeR.scale.y = .12 + e * .88;
    J.sac.scale.setScalar(.55 + sac * (.6 + Math.sin(t * 5) * .1)); J.cry.scale.setScalar(.62 + cl(p.cry || 0) * .6); J.hipL.rotation.x = J.hipR.rotation.x = lg * .9;
    const tl = p.tongue || 0; J.tongue.visible = tl > .05; J.tongue.scale.set(1, 1, Math.max(.05, tl / g.userData.s)); J.tongue.rotation.set(.12, p.aim || 0, 0); };
  return B12; };
