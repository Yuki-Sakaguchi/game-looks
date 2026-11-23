// 第 10 集 11「ロックオンして撃つアクション RPG のボス戦」用の、遺跡を守る大きな からくり「トコヌシ」。kit.js・retro.js のあとに読み、 const B11 = BOSS_11(THREE, K, R)  として使う。
// ■ 形：高さ 8 m ほど（5 頭身の人の 6 倍）。03 の小さな機械（つぼ形の体・ひとつ目・鳥の足）の親玉。砂色の石の板と、にぶい金の帯、青緑のうめこみ。
//   部位は 4 つ：ひざの光る輪（左右）、まぶたの板が開く ひとつ目（閉じていても細いすき間から光がもれる）、おなかの とびらの奥のコア（開いたときだけ見える）。肩の筒は小さい機械の出口。
//   すべて R.geo() の loft（輪をつないだ筒）と、手で打った 128 ドットの絵 1 枚。箱は使わない。足もとが y=0、正面が +z。
// ■ 使い方
//   const boss = B11.make({ c: 石の色, c2: 金物の色, c3: うめこみの色, s: 1 });   scene.add(boss);
//   B11.pose(boss, { t（秒）, ph（歩きの位相）, walk（0〜1）, eye（0〜1 まぶたの開き）, core（0〜1 とびらの開き）, crouch（0〜1 しゃがむ）, down（0〜1 くずれ落ちる）, brk（0〜1 左（+x）のひざが折れる）,
//                    lean（前へたおす）, roll（横へたおす）, shake（0〜1 ふるえ）, look（体を左右へ） });
//   boss.userData = { J（関節と部位。eyeA / coreA / kneeL / kneeR / podL / podR は、ねらう位置の Object3D）, glow: { eye, core, aux, kneeL, kneeR }（光る材質。color を変えて色と強さを動かす）, h }
//   位置と向き（boss.position / rotation）は自分で動かす。足が着くのは、左が ph = π/2、右が ph = 3π/2 のとき。
window.BOSS_11 = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, B11 = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // ---- 絵（128×128 の 1 枚）----
  //   体の帯 0,0 128×56 ／ 足の板 0,56 64×32 ／ 目 64,56 32×32 ／ コア 96,56 32×32 ／ まぶたの板 0,88 64×32 ／ 足さき 64,88 32×32 ／ 光の色 96,88 16×16 ／ 暗い穴 112,88 16×16 ／ 風ぬき 96,104 32×16 ／ 金の帯 0,120 128×8
  const paint = o => { const P = Px(128), M = ramp(o.c || '#d9c48e', 6, { contrast: .95 }), Bz = ramp(o.c2 || '#b07a2c'), Tl = ramp(o.c3 || '#2f9a98'), Dk = ramp('#40344e'), K0 = '#1c1626', RV = '#fff4d0'; P.clip = true;
    const FRET = ['#######.#######.', '#.....#.#.....#.', '#.###.#.#.###.#.', '#.#...#.#...#.#.', '#.#####.#####.#.', '................'];
    // 体の帯：上から、金のふち → 小さな板（びょう）→ 青緑のうめこみ（かぎ形のもよう）→ 大きな板（丸い彫り・ひび・欠け）→ 金のすそ
    for (let y = 0; y < 56; y++) for (let x = 0; x < 128; x++) { const n = tn(x, y, 8, 8, 128, 64, 3); let c;
      if (y < 6) c = y === 0 ? Bz[5] : y === 5 ? K0 : tone(Bz, 3 + (x % 8 === 0 ? -2 : x % 8 === 1 ? 1 : 0) + (y === 1 ? 1 : 0));
      else if (y < 20) { const q = x % 16, k = 3 + (hash(x >> 4, 1, 2) > .6 ? 1 : 0); c = q === 0 ? K0 : q === 1 || y === 6 ? tone(M, k + 1) : q === 15 ? tone(M, k - 1) : y === 19 ? tone(M, k - 2) : tone(M, k + (n > .72 ? 1 : n < .28 && ((x + y) & 1) ? -1 : 0)); if ((q === 3 || q === 12) && (y === 8 || y === 16)) c = RV; if ((q === 3 || q === 12) && (y === 9 || y === 17)) c = tone(M, 1); }
      else if (y < 28) c = y === 20 || y === 27 ? K0 : FRET[y - 21][x % 16] === '#' ? tone(Tl, 5) : tone(Tl, y === 21 ? 1 : 2);
      else if (y < 46) { const q = (x + 8) % 32, id = Math.floor((x + 8) / 32) % 4, k = [3, 2, 3, 4][id]; c = q === 0 ? K0 : q === 1 || y === 28 ? tone(M, k + 1) : q === 31 ? tone(M, k - 1) : y === 45 ? tone(M, k - 2) : tone(M, k + (n > .7 ? 1 : n < .3 && ((x + y) & 1) ? -1 : 0)); if ((q === 3 || q === 28) && (y === 31 || y === 42)) c = RV; }
      else c = y === 46 ? K0 : y === 47 ? Bz[5] : x % 8 < 5 ? tone(Bz, 2 + (x % 8 === 0 ? 1 : 0) - (y > 52 ? 1 : 0)) : K0;
      P.set(x, y, c); }
    for (let id = 0; id < 4; id++) { const cx = id * 32 + 8, cy = 37, k = [3, 2, 3, 4][id];
      for (let a = 0; a < 40; a++) { const q = a / 40 * PI * 2; P.set(cx + Math.round(Math.cos(q) * 5) + 1, cy + Math.round(Math.sin(q) * 5) + 1, tone(M, k + 2)); } for (let a = 0; a < 40; a++) { const q = a / 40 * PI * 2; P.set(cx + Math.round(Math.cos(q) * 5), cy + Math.round(Math.sin(q) * 5), tone(M, 0)); }
      P.bits(cx - 2, cy - 2, ['..t..', '.ttt.', 'ttwtt', '.ttt.', '..t..'], { t: tone(Tl, 3), w: tone(Tl, 5) });
      if (id % 2) { let x = cx + 9; for (let y = 29; y < 44; y++) { if (hash(x, y, 8) > .55) x += hash(x, y, 9) > .5 ? 1 : -1; P.set(x, y, tone(M, 0)); P.set(x + 1, y, tone(M, k + 2)); if (y > 38 && hash(y, id, 2) > .6) break; } }
      else { P.rect(cx + 20, 43, 3, 2, tone(M, 0)); P.set(cx + 19, 44, tone(M, 1)); P.rect(cx - 15, 29, 2, 2, tone(M, 0)); }
      for (let j = 0; j < 4 + id; j++) P.set(cx - 9 + (j & 1), 20 + 8 + 1 + j, tone(M, k - 1)); }
    // 足の板：よこのつぎ目、金の帯、青緑のすじ
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { let c = tone(M, 3 + [-1, 0, 0, 1, 1, 0, 0, -1][(x >> 1) & 7] * .9); if (y % 8 === 0) c = K0; else if (y % 8 === 1) c = tone(M, 5); else if (y % 8 === 7) c = tone(M, 1);
      if (x % 32 >= 14 && x % 32 < 18 && y % 8 > 1) c = tone(Tl, x % 32 === 14 ? 5 : x % 32 === 17 ? 1 : 3); if (y < 3) c = tone(Bz, y === 0 ? 5 : 3); if (y > 28) c = y === 29 ? K0 : tone(Bz, y === 30 ? 4 : 2); if (x % 16 === 6 && y % 8 === 4) c = RV; P.set(x, 56 + y, c); }
    // 目（白っぽく打ち、材質の色で光の色にする）：白いひとみ、放射のすじ、暗い輪
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = x - 15.5, dy = y - 15.5, d = Math.hypot(dx, dy), a = Math.floor((Math.atan2(dy, dx) + PI) / PI * 8);
      P.set(64 + x, 56 + y, d < 3.2 ? '#ffffff' : d < 6 ? '#ececec' : d < 7.2 ? '#3a3a3a' : d < 10.6 ? (a & 1 ? '#d4d4d4' : '#9c9c9c') : d < 12 ? '#2c2c2c' : d < 14 ? '#b4b4b4' : '#161616'); } P.rect(64 + 10, 56 + 10, 2, 2, '#ffffff');
    // コア：ひし形の石と、まわりの輪
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = x - 15.5, dy = y - 15.5, d = Math.hypot(dx, dy), m = Math.abs(dx) + Math.abs(dy);
      P.set(96 + x, 56 + y, m < 4 ? '#ffffff' : m < 9.5 ? ((dx < 0) !== (dy < 0) ? '#e4e4e4' : '#bcbcbc') : m < 11 ? '#4a4a4a' : d < 12.4 ? '#262626' : d < 14.2 ? ((x + y) % 4 < 2 ? '#c8c8c8' : '#909090') : '#161616'); }
    // まぶた・とびらの板：よこのすじの入った砂色の板（上下のふちは金物）。まん中に青緑の山形
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { let c = y % 6 === 0 ? K0 : y % 6 === 1 ? M[5] : tone(M, 3 - (y % 6 > 3 ? 1 : 0) + (x % 16 === 0 ? -2 : x % 16 === 1 ? 1 : 0)); if (y >= 28) c = y === 28 ? K0 : tone(Bz, y === 29 ? 5 : 3); if (y < 2) c = tone(Bz, y === 0 ? 5 : 3); if (x % 16 === 8 && y % 6 === 3) c = RV; P.set(x, 88 + y, c); }
    for (let i = -6; i <= 6; i++) for (let w = 0; w < 3; w++) P.set(32 + i, 88 + 8 + Math.abs(i) + w, tone(Tl, w === 0 ? 5 : w === 1 ? 3 : 1));
    // 足さき：金物のうろこ。上の 1 段は つめの白
    for (let by = 0; by < 4; by++) for (let bx = 0; bx < 4; bx++) P.block(64 + bx * 8, 88 + by * 8, 8, 8, by < 1 ? M : Bz, by < 1 ? 4 : [2, 3, 2, 3][(bx + by) % 4]);
    // 光の色／暗い穴／風ぬき
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { P.set(96 + x, 88 + y, (x + y) % 5 === 0 ? '#c4c4c4' : '#f6f6f6'); P.set(112 + x, 88 + y, y % 4 === 0 ? K0 : tone(Dk, y % 4 === 1 ? 3 : 1)); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) P.set(96 + x, 104 + y, y % 3 === 0 ? K0 : x % 8 === 0 ? tone(Dk, 4) : tone(Dk, y % 3 === 1 ? 3 : 2));
    // 金の帯：上のふちの光、切りこみ、びょう
    for (let y = 0; y < 8; y++) for (let x = 0; x < 128; x++) { let c = y === 0 ? Bz[5] : y < 3 ? Bz[4] : y < 6 ? tone(Bz, 3) : y === 6 ? Bz[2] : K0; if (y === 4 && x % 8 < 4) c = Bz[1]; if (y === 3 && x % 8 < 4) c = Bz[5]; if (x % 16 === 6 && y === 2) c = RV; P.set(x, 120 + y, c); }
    return T.from(P, { m: 1 }); };

  B11.make = (o = {}) => { const s = o.s || 1, t = paint(o), g = new THREE.Group(), J = { root: new THREE.Group() }, grp = (p, x = 0, y = 0, z = 0) => { const q = new THREE.Group(); q.position.set(x, y, z); p.add(q); return q; };
    const px = (G, x, y, w, h) => G.px(x, y, w, h, 128, 128), glowM = k => R.mat(t, { glow: true, side: true, color: '#fffff' + k });
    const glow = { eye: glowM('f'), core: glowM('e'), aux: glowM('d'), kneeL: glowM('c'), kneeR: glowM('b') };
    g.add(J.root); J.root.scale.setScalar(s); J.body = grp(J.root, 0, 4.6, 0); J.body.rotation.order = 'YXZ';
    // 体：つぼ形の殻、こしの金の帯、目のわく、おなかのコアのわく、肩の筒、頭のかざり、背中のえんとつ
    const G = R.geo().smooth(1); px(G, 0, 0, 128, 56).loft(12, [[-1.9, .9, .85, 0, .6], [-1.45, 1.75, 1.65, .16, .78], [-.5, 2.35, 2.2, .42, .95], [.5, 2.45, 2.3, .64, 1.05], [1.3, 2.05, 1.95, .82, 1.1], [1.9, 1.3, 1.25, .93, 1.12], [2.2, .55, .55, 1, 1.15]], { cap: 'both', ur: 2 });
    px(G, 0, 120, 128, 8).loft(12, [[-.62, 2.4, 2.25, 0, .85], [-.45, 2.56, 2.4, .5, 1.05], [-.28, 2.46, 2.3, 1, 1.1]], { ur: 3 });
    G.smooth(2).at(TR(0, .55, 1.72, 0, PI / 2, 0)); px(G, 0, 120, 128, 8).loft(10, [[0, 1.3, 1.3, 0, .8], [.78, 1.24, 1.24, .6, 1], [.98, 1.02, 1.02, 1, 1.12]], {}); px(G, 112, 88, 16, 16).loft(10, [[.9, 1.02, 1.02, 0, .8], [.92, .01, .01, 1, .6]], {});
    G.at(TR(0, -1.05, 1.42, 0, PI / 2 + .5, 0)); px(G, 0, 120, 128, 8).loft(8, [[0, .9, .9, 0, .8], [.6, .84, .84, .7, 1], [.74, .7, .7, 1, 1.1]], {}); px(G, 112, 88, 16, 16).loft(8, [[.68, .7, .7, 0, .7], [.7, .01, .01, 1, .6]], {});
    for (const sx of [-1, 1]) { G.smooth(3).at(TR(sx * 1.95, .75, -.1, 0, 0, -sx * 1.05)); px(G, 0, 56, 64, 32).loft(8, [[0, .7, .7, 0, .75], [.5, .88, .88, .35, 1], [1.25, .84, .84, .8, 1.05], [1.45, .64, .64, 1, .9]], {}); px(G, 96, 104, 32, 16).loft(8, [[1.45, .64, .64, 0, 1], [1.3, .01, .01, 1, .7]], {});
      G.smooth(0).at(TR(sx * 1.1, 1.75, -.3, 0, -.2, -sx * .55)); px(G, 0, 88, 64, 32).loft(4, [[0, .42, .62, 0, .85], [.9, .3, .44, .5, 1], [1.6, .04, .1, 1, 1.12]], { cap: 'top' });
      G.at(TR(sx * .75, 1.2, -1.5, 0, -.6, 0)); px(G, 0, 56, 64, 32).loft(6, [[0, .3, .3, 0, .75], [1.1, .36, .36, 1, 1]], {}); px(G, 96, 104, 32, 16).loft(6, [[1.1, .36, .36, 0, 1], [1, .01, .01, 1, .6]], {}); }
    G.smooth(4).at(TR(0, 2.15, 0)); px(G, 0, 120, 128, 8).loft(8, [[0, .78, .78, 0, .9], [.28, .6, .6, 1, 1.1]], { cap: 'top' }); px(G, 0, 56, 64, 32).loft(4, [[.28, .13, .13, 0, .9], [1.05, .05, .05, 1, 1.1]], {}); G.at(null);
    J.body.add(G.mesh(t));
    // 光る所：目、コア、肩の筒の口、頭の先
    const Ge = R.geo(); px(Ge, 64, 56, 32, 32).at(TR(0, .55, 2.66, 0, PI / 2, 0)).loft(10, [[0, .98, .98, 0], [.03, .94, .94, 1]], { cap: 'top', capRect: true }); J.eyeM = Ge.mesh(glow.eye); J.eyeM.castShadow = false; J.body.add(J.eyeM); J.eyeA = grp(J.body, 0, .55, 2.75);
    const AX = [0, -Math.sin(.5), Math.cos(.5)], cp = [0, -1.05 + AX[1] * .7, 1.42 + AX[2] * .7], Gc = R.geo(); px(Gc, 96, 56, 32, 32).at(TR(cp[0], cp[1], cp[2], 0, PI / 2 + .5, 0)).loft(8, [[0, .68, .68, 0], [.03, .64, .64, 1]], { cap: 'top', capRect: true }); J.coreM = Gc.mesh(glow.core); J.coreM.castShadow = false; J.body.add(J.coreM); J.coreA = grp(J.body, cp[0], cp[1] - .05, cp[2] + .1);
    const Ga = R.geo(); px(Ga, 96, 88, 16, 16); for (const sx of [-1, 1]) Ga.at(TR(sx * 1.95, .75, -.1, 0, 0, -sx * 1.05)).loft(8, [[1.46, .62, .62, 0], [1.47, .46, .46, 1]], {}); Ga.at(TR(0, 2.15, 0)).loft(4, [[1.05, .01, .01, 0], [1.2, .17, .17, .5], [1.36, .01, .01, 1]], {}); const aux = Ga.mesh(glow.aux); aux.castShadow = false; J.body.add(aux);
    for (const [n, sx] of [['L', 1], ['R', -1]]) J['pod' + n] = grp(J.body, sx * (1.95 + Math.sin(1.05) * 1.5), .75 + Math.cos(1.05) * 1.5, -.1);
    // まぶた（上下の半円の板。たてにちぢんで開く）と、コアのとびら（左右の半円の板。よこにちぢんで開く）
    const half = (flip) => { const Gl = R.geo(), n = 6, r = 1.02; px(Gl, 0, 88, 64, 32); for (let k = 0; k < n; k++) { const a = k / n * PI, b = (k + 1) / n * PI, xa = Math.cos(a) * r, xb = Math.cos(b) * r, ya = Math.sin(a) * r, yb = Math.sin(b) * r, u0 = (xb + r) / (2 * r), u1 = (xa + r) / (2 * r);
      if (!flip) Gl.quad([xb, -r, 0], [xa, -r, 0], [xa, ya - r, 0], [xb, yb - r, 0], [u0, 0, u1, 1]); else Gl.quad([xb, r - yb, 0], [xa, r - ya, 0], [xa, r, 0], [xb, r, 0], [u0, 1, u1, 0]); } return Gl.mesh(t, { side: true }); };
    J.lidU = grp(J.body, 0, .55 + 1.02, 2.72); J.lidU.add(half(false)); J.lidD = grp(J.body, 0, .55 - 1.02, 2.72); J.lidD.add(half(true));
    J.hatch = grp(J.body, cp[0] + AX[0] * .06, cp[1] + AX[1] * .06, cp[2] + AX[2] * .06); J.hatch.rotation.x = .5;
    for (const [n, sx] of [['L', 1], ['R', -1]]) { const d = J['door' + n] = grp(J.hatch, sx * .72, 0, 0), Gd = R.geo(), m = 5, r = .72; px(Gd, 0, 88, 64, 32); for (let k = 0; k < m; k++) { const a = -PI / 2 + k / m * PI, b = -PI / 2 + (k + 1) / m * PI; Gd.quad([-sx * r, Math.sin(a) * r, 0], [-sx * r + sx * Math.cos(a) * r, Math.sin(a) * r, 0], [-sx * r + sx * Math.cos(b) * r, Math.sin(b) * r, 0], [-sx * r, Math.sin(b) * r, 0], [.5, k / m, 1, (k + 1) / m]); } d.add(Gd.mesh(t, { side: true })); }
    // 足：こしの玉 → もも → ひざ（光る輪）→ すね → 3 本づめの足さき
    for (const [n, sx] of [['L', 1], ['R', -1]]) { const hip = J['hip' + n] = grp(J.root, sx * 1.9, 3.5, -.1), kn = J['knee' + n] = grp(hip, 0, -2, 0), ft = J['foot' + n] = grp(kn, 0, -2.2, 0);
      const Gh = R.geo().smooth(1); px(Gh, 0, 88, 64, 32).loft(8, [[-.7, .3, .3, 0, .7], [-.4, .72, .72, .25, .9], [0, .88, .88, .5, 1], [.4, .72, .72, .75, 1.1], [.7, .3, .3, 1, 1.12]], { cap: 'both' }); px(Gh.smooth(0), 0, 56, 64, 32).loft(6, [[-2, .36, .42, 0, .82], [-1, .5, .6, .5, 1], [-.3, .55, .6, 1, 1]], {}); hip.add(Gh.mesh(t));
      const Gk = R.geo().smooth(1).at(TR(0, 0, 0, 0, 0, PI / 2)); px(Gk, 0, 120, 128, 8).loft(8, [[-.58, .56, .56, 0, .85], [.58, .56, .56, 1, 1.05]], { cap: 'both' }); Gk.smooth(0).at(null); px(Gk, 0, 56, 64, 32).loft(6, [[-2.2, .3, .34, 0, .8], [-1.2, .44, .52, .5, 1], [-.3, .4, .46, 1, 1]], {}); kn.add(Gk.mesh(t));
      const Gg = R.geo().at(TR(0, 0, 0, 0, 0, PI / 2)); px(Gg, 96, 88, 16, 16).loft(8, [[-.2, .6, .6, 0], [.2, .6, .6, 1]], {}); px(Gg, 64, 56, 32, 32).loft(8, [[.59, .46, .46, 0], [.62, .4, .4, 1]], { cap: 'top', capRect: true }).loft(8, [[-.62, .4, .4, 0], [-.59, .46, .46, 1]], { cap: 'bot', capRect: true }); const gm = Gg.mesh(glow['knee' + n]); gm.castShadow = false; kn.add(gm);
      const Gf = R.geo().smooth(1); px(Gf, 64, 88, 32, 32).loft(8, [[-.45, .8, 1, 0, .7, 0, .15], [-.1, .62, .78, .6, 1, 0, .1], [.12, .36, .42, .74, 1.05]], { cap: 'both' }); Gf.smooth(0);
      for (const [x, z, ry] of [[-.45, .7, -.4], [.45, .7, .4], [0, -.75, PI]]) Gf.at(TR(x, -.28, z, ry, PI / 2 + .12, 0)).loft(4, [[0, .24, .2, .1, .9], [.7, .17, .14, .7, 1], [1.1, .03, .03, 1, 1.15]], {}); ft.add(Gf.mesh(t)); }
    g.userData = { kind: 'boss11', J, s, h: 8 * s, glow }; B11.pose(g, {}); return g; };

  // 足の形：d（0 立つ 〜 1.3 くずれる）から、こしの高さ・ももの角度・ひざの角度を出す
  const leg = d => { const a1 = .9 + .5 * d, a2 = .6 + .5 * d; return { hip: -a1, knee: a1 + a2, y: 2 * Math.cos(a1) + 2.2 * Math.cos(a2) + .45 }; };
  B11.pose = (g, p = {}) => { const J = g.userData.J, t = p.t || 0, ph = p.ph || 0, w = p.walk || 0, cr = p.crouch || 0, dn = p.down || 0, br = p.brk || 0, sh = p.shake || 0; let hy = 0;
    for (const [n, sg] of [['L', 1], ['R', -1]]) { const a = Math.sin(ph) * sg * w, lift = Math.max(0, Math.cos(ph) * sg) * w, d = cl(cr * .9 + dn * 1.3 + (n === 'L' ? br * .75 : br * .15), 0, 1.3), L = leg(d), hip = J['hip' + n], kn = J['knee' + n];
      hip.rotation.x = L.hip + a * .3 - lift * .22; kn.rotation.x = L.knee + lift * .5; J['foot' + n].rotation.x = -(hip.rotation.x + kn.rotation.x); hip.position.y = L.y + lift * .25; hy += L.y / 2; }
    const bob = Math.abs(Math.sin(ph)) * .12 * w + Math.sin(t * 1.6) * .05 * (1 - dn);
    J.body.position.set(Math.sin(t * 47) * .07 * sh, hy + 1.1 + bob - dn * .35, Math.sin(t * 39) * .05 * sh);
    J.body.rotation.set((p.lean || 0) + dn * .28 + Math.sin(ph * 2) * .02 * w, p.look || 0, (p.roll || 0) - br * .2 + Math.sin(ph) * .05 * w + Math.sin(t * 53) * .03 * sh);
    const e = cl(p.eye || 0), c = cl(p.core || 0); J.lidU.scale.y = J.lidD.scale.y = .88 - e * .76; J.doorL.scale.x = J.doorR.scale.x = 1 - c * .9; J.coreM.visible = c > .02; };
  return B11; };
