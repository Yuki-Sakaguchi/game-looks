// 第 10 集 09「ボス戦：コマンド式のターン制バトル」だけで使う部品。../game-looks-7/kit.js・retro.js のあとに読み、 const GB = BOSS_09(THREE, K, R)  として使う。
// 中身は 2 つ：(1) 動力炉を守る大きな機械の兵器（オリジナルの「ゴウロン」）と動き  (2) 床に出す攻撃の予告の輪。pack-battle.js は変えず、足りない物をここに置く。
//
// ■ 1. ボス ── const b = GB.make({ c（よろいの鉄の色）, s（大きさ） })   ずんぐりした かまの胴に、2 本の足、左うで（+x がわ）は大きなハサミ、右うで（−x がわ）は大砲。正面が +z、足もとが y=0
//   大きさ：頭のてっぺんまで 4.6 m、えんとつの先まで 5 m（5 頭身の人 1.4 m の 3.3 倍）、うでを入れた はば 5.4 m。三角形は 900 ほど
//   形は R.geo() の loft（こし・足・かまの胴・とびら 2 枚・肩・うで・ハサミ・砲身・頭・えんとつ・炉心）。テクスチャは手で打った 128×128 の 1 枚を 2 通り：
//     ふつう（青ねずの鉄板・リベット・さびのたれ・黄と黒のしま・自作の印）／熱をもった形態（板のつぎ目が だいだいに光る）
//   ねらえる部位は 3 つ：ほんたい（胴）・ハサミうで・ほううで。形態が変わると、胸のとびらが開いて「コア」（弱点）が見える
//   GB.pose(b, { t, acts: [{ name, k（0〜1） }, …], open（0〜1。胸のとびら）, look（頭の左右）, broken（大砲がこわれて うでが下がる） })   毎コマ呼ぶ。関節だけを書きかえる
//     acts の name：'claw'（ハサミをふり下ろす）'fire'（大砲をかまえる）'charge'（ちぢこまって力をためる）'slam'（両うでをふり上げて床をたたく）'flinch'（ひるむ）'open'（とびらが開くときの身ぶるい）'stagger'（よろめく）
//   b.userData.at('body'/'core'/'head'/'claw'/'cannon'/'muzzle'/'top'/'chimL'/'chimR'/'footL'/'footR', Vector3) → 世界の位置（数字・印・けむりを出す所）
//   b.userData.form(0/1)   形態（1 で熱をもった絵に入れかえ、目が赤くなる）      b.userData.wreck(true/false)   大砲の砲身が折れた形に入れかえる
//   b.userData.core   炉心の Mesh（光る材質。ページで scale を動かして脈を打たせる）
//
// ■ 2. 予告の輪 ── const w = GB.warn({ r: 3 }) → Mesh（床に置く赤い輪。加算）。w.userData.set(強さ 0〜1, t) で点めつ
window.BOSS_09 = (THREE, K, R) => {
  const { hash, mix, ramp, tone, Px, TR } = R, PI = Math.PI, GB = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = k => k * k * (3 - 2 * k), seg = (t, a, b) => ease(cl((t - a) / (b - a)));
  const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // ================= テクスチャ（128×128 の 1 枚に全部の部品） =================
  const REG = { hull: [0, 0, 128, 40], leg: [0, 40, 64, 24], arm: [64, 40, 32, 24], gun: [96, 40, 32, 40], claw: [0, 64, 24, 32], head: [24, 64, 64, 24], chim: [88, 80, 16, 32], core: [104, 80, 24, 24], cav: [0, 96, 32, 32], sho: [32, 96, 48, 24], stub: [80, 112, 24, 16], eye0: [104, 104, 24, 8], eye1: [104, 112, 24, 8] };
  function paint(c, hot) { const P = Px(128, 128), M = ramp(c), Dk = ramp(mix(c, '#221c38', .5)), Br = ramp('#c89a48'), Wn = ramp('#f0c030'), Ru = ramp('#a85a30'), Cl = ramp('#c4ccd8'), K0 = '#1a1828', BK = '#26222e', Cr = '#ece4cc', HOT = ['#fff0a0', '#ff9a30', '#d04a20']; P.clip = true;
    const reg = (r, f) => { for (let j = 0; j < r[3]; j++) for (let i = 0; i < r[2]; i++) { const v = f(i, j); if (v !== undefined) P.set(r[0] + i, r[1] + j, v); } };
    const seam = hot ? HOT[1] : K0, warm = (col, k) => hot ? mix(col, '#ff6a30', k) : col;
    // ---- 胴（よこは胴まわり。64 が正面、0 と 127 が背。上が えり、下が しまの帯） ----
    reg(REG.hull, (i, j) => {
      if (j >= 33) { const d = ((i + j) >> 2) & 1; return j === 33 ? K0 : j === 34 ? (d ? Wn[5] : '#4a4458') : j === 39 ? (d ? Wn[1] : K0) : d ? Wn[3] : BK; }
      if (j < 6) { const q = i % 8; if (j === 5) return seam; if (j === 0) return Dk[5]; if ((q === 3 || q === 4) && (j === 2 || j === 3)) return j === 2 && q === 3 ? Br[5] : Br[2]; return tone(Dk, 3 + (j < 2 ? 1 : 0)); }
      const row = Math.floor((j - 6) / 9), lj = (j - 6) % 9, ii = i + (row & 1) * 8, li = ii % 16, id = Math.floor(ii / 16) % 8, h = hash(id, row, 7);
      if (lj === 8 || li === 15) return seam;
      if ((li === 2 || li === 12) && (lj === 1 || lj === 6)) return M[5]; if ((li === 3 || li === 13) && (lj === 2 || lj === 7)) return M[0];
      if (h > .5 && li === 2 && lj > 1 && lj < 3 + h * 5) return Ru[2]; if (h > .5 && li === 3 && lj > 2 && lj < 1 + h * 5) return Ru[1];
      let k = 3 + (h > .7 ? 1 : h < .25 ? -1 : 0); if (lj === 0 || li === 0) k += 1; if (lj === 7 || li === 14) k -= 1; if ((i * 7 + j * 13) % 29 === 0) k -= 1;
      return warm(tone(M, k), lj === 7 || li === 14 || lj === 0 || li === 0 ? .4 : .08); });
    // わきの風ぬきの切れこみ（左右）と、自作の印（3 本の棒と三角）
    for (const x0 of [14, 102]) for (let j = 15; j < 25; j++) for (let i = 0; i < 12; i++) P.set(x0 + i, j, j % 3 === 0 ? K0 : j % 3 === 1 ? Dk[1] : M[5]);
    for (const x0 of [14, 102]) { for (let j = 14; j < 26; j++) { P.set(x0 - 1, j, K0); P.set(x0 + 12, j, K0); } for (let i = -1; i < 13; i++) { P.set(x0 + i, 14, K0); P.set(x0 + i, 25, Br[4]); } }
    for (const x0 of [34, 86]) { for (let b = 0; b < 3; b++) P.rect(x0 + b * 3, 17 + b, 2, 6 - b, Cr); for (let q = 0; q < 4; q++) P.rect(x0 + 10 - (q >> 1), 22 - q * 2, 1 + q, 1, Wn[4]); P.rect(x0 + 8, 23, 5, 1, Wn[4]); }
    // 胸のとびら（53〜74。まん中 63/64 が合わせ目）：しまのふち、明るい板、輪と三角の印、とっ手、ちょうつがい
    for (let j = 7; j <= 31; j++) for (let i = 53; i <= 74; i++) { const e = Math.min(i - 53, 74 - i, j - 7, 31 - j), d = ((i + j) >> 1) & 1;
      if (e === 0) P.set(i, j, K0); else if (e < 3) P.set(i, j, d ? Wn[e === 1 ? 4 : 3] : BK); else if (e === 3) P.set(i, j, K0); else { const dx = i - 63.5, dy = j - 19, r = Math.hypot(dx, dy * 1.05);
        let col = tone(M, 4 + (j < 13 ? 1 : 0) - (j > 26 ? 1 : 0) - ((i + j * 3) % 11 === 0 ? 1 : 0)); if (r > 5.2 && r < 7) col = Cr; else if (r < 4.4 && Math.abs(dx) < (dy + 4) * .55 && dy < 3) col = hot ? HOT[1] : Wn[4]; P.set(i, j, warm(col, .1)); } }
    for (let j = 7; j <= 31; j++) { P.set(63, j, seam); P.set(64, j, hot ? HOT[0] : M[1]); }
    for (const x0 of [60, 66]) P.rect(x0, 17, 2, 5, Br[4]); for (const x0 of [54, 73]) for (const y0 of [10, 27]) { P.rect(x0, y0, 2, 3, Br[5]); P.set(x0, y0 + 2, Br[1]); }
    for (const [x0, y0, x1, y1] of [[6, 10, 11, 14], [44, 27, 49, 30], [92, 9, 99, 12], [116, 20, 121, 28]]) { P.line(x0, y0, x1, y1, M[5]); P.line(x0, y0 + 1, x1, y1 + 1, M[0]); }
    // ---- こし・足（たてにピストンの棒、よこに帯） ----
    reg(REG.leg, (i, j) => { const q = i % 16, b = j % 8; if (b === 7) return K0; if (b === 0) return M[5]; if (q >= 6 && q <= 8) return q === 6 ? Br[5] : q === 7 ? Br[3] : Br[1]; if (q === 5 || q === 9) return K0;
      if ((q === 2 || q === 12) && b === 3) return M[5]; if ((q === 3 || q === 13) && b === 4) return M[0]; return warm(tone(Dk, 4 + (hash(i >> 4, j >> 3, 3) > .6 ? 1 : 0) - (b === 6 ? 1 : 0) - (q > 12 ? 1 : 0)), .1); });
    // ---- 上うで（じゃばらと、くだ） ----
    reg(REG.arm, (i, j) => { const b = j % 6; if (i >= 25 && i <= 30) return i === 25 || i === 30 ? K0 : tone(Br, i === 26 ? 5 : i === 27 ? 4 : i === 28 ? 2 : 1); return b === 5 ? K0 : tone(Dk, b === 0 ? 5 : b < 3 ? 4 : b === 3 ? 3 : 2); });
    // ---- 前うで・砲身（上が先。先に黒い口のふち → しまの輪 → 帯とリベット。先は熱で色がかわる） ----
    reg(REG.gun, (i, j) => { if (j < 3) return j === 0 ? BK : j === 1 ? K0 : Dk[2]; if (j < 9) { const d = ((i + j) >> 2) & 1; return j === 3 || j === 8 ? K0 : d ? Wn[4] : BK; }
      const b = (j - 9) % 10, q = i % 8; if (b === 9) return seam; if (b === 0) return M[5]; if (q === 3 && (b === 2 || b === 6)) return M[5]; if (q === 4 && (b === 3 || b === 7)) return M[0];
      const heat = cl(1 - (j - 9) / 12) * .5; return mix(tone(M, 3 + (q < 2 ? 1 : q > 5 ? -1 : 0) + (hash(i >> 3, j >> 3, 5) > .65 ? 1 : 0)), '#b46a52', heat); });
    // ---- ハサミの刃（上が先。左が明るい刃、まん中に みぞ、右にぎざぎざ、下に しんちゅうの帯） ----
    reg(REG.claw, (i, j) => { if (j >= 26) { const q = i % 6; return j === 26 ? K0 : j === 27 ? Br[5] : (q === 2 && j === 29) ? Br[5] : (q === 3 && j === 30) ? Br[0] : tone(Br, j === 31 ? 1 : 3); }
      if (i < 2) return Cl[5]; if (i < 4) return Cl[4]; if (i === 11) return Cl[1]; if (i === 12) return Cl[5]; if (i > 19) return (j % 6 < 3) ? K0 : Cl[1];
      return tone(Cl, 3 - (i > 15 ? 1 : 0) - ((i * 5 + j * 3) % 17 === 0 ? 1 : 0) + (j < 5 ? 1 : 0)); });
    P.line(6, 72, 9, 80, Cl[5]); P.line(15, 84, 17, 89, Cl[1]);
    // ---- 頭（よこは頭まわり。32 が正面）：上のふた、目のみぞ（まん中に光る目）、下に たて格子 ----
    reg(REG.head, (i, j) => { const f = Math.abs(i - 31.5);
      if (j < 4) return j === 3 ? K0 : (i % 8 === 3 && j === 1) ? Br[5] : tone(M, j === 0 ? 5 : 4);
      if (j >= 8 && j <= 14 && f < 19) { if (j === 8 || j === 14 || f > 17.5) return K0; if (f < 8.5 && j > 9 && j < 13) return hot ? (j === 11 ? '#ffe0c0' : '#ff5030') : (j === 11 ? '#e8ffff' : '#40d8f0'); return (i + j) % 2 ? '#2a2638' : BK; }
      if (j >= 16 && f < 11) return j === 16 || j === 23 ? K0 : i % 4 === 0 ? K0 : i % 4 === 1 ? M[5] : tone(Dk, 3);
      if (f > 24 && f < 29 && j > 9 && j < 15) return (f > 25 && f < 28 && j > 10 && j < 14) ? Br[4] : K0;
      if (j === 15) return K0; return warm(tone(M, 3 + (j < 8 ? 1 : 0) - (j > 20 ? 1 : 0) - ((i * 3 + j * 7) % 19 === 0 ? 1 : 0)), .12); });
    // ---- えんとつ（上が先。光るふち → すす → くだ） ----
    reg(REG.chim, (i, j) => { if (j < 2) return HOT[j]; if (j === 2) return HOT[2]; if (j < 9) return mix(BK, tone(Dk, 3), (j - 3) / 8); const b = (j - 9) % 8; return b === 7 ? K0 : tone(Dk, 3 + (i > 2 && i < 6 ? 2 : 0) - (i > 11 ? 1 : 0) + (b === 0 ? 1 : 0)); });
    // ---- 炉心（光る。たての おり と、よこの うねるひび） ----
    reg(REG.core, (i, j) => { const d = Math.abs(j - 11.5) / 12, w = Math.sin(i * .8 + j * .5) * 1.5; if (i % 6 === 0) return '#6a2a1c'; if (Math.abs(j - 6 - w) < .6 || Math.abs(j - 17 + w) < .6) return '#d04a20';
      return d < .22 ? '#fffbe0' : d < .45 ? '#ffe880' : d < .7 ? '#ffb040' : '#ff7a28'; });
    // ---- 胸の中（暗い機械：コイル・くだ・小さなあかり） ----
    reg(REG.cav, (i, j) => { const b = j % 6; if (i % 16 === 3 || i % 16 === 4) return i % 16 === 3 ? Br[3] : Br[1]; if (b === 0) return '#5a3a34'; if (b === 1) return '#3a2630';
      if ((i % 8 === 6) && b === 3) return (i + j) % 3 ? '#40d8f0' : '#ffb040'; return (i + j) % 2 ? '#2c2238' : '#221a2e'; });
    // ---- 肩（上が てっぺん。大きなボルトの輪、山形の しま、下に しんちゅうのふち） ----
    reg(REG.sho, (i, j) => { if (j >= 21) return j === 21 ? K0 : tone(Br, j === 22 ? 5 : 2); if (j < 5) return (i % 8 === 2 && j === 2) ? Br[5] : (i % 8 === 3 && j === 3) ? K0 : tone(M, j < 2 ? 5 : 4);
      if (j === 5) return seam; if (j > 9 && j < 17) { const v = Math.abs((i % 12) - 6) + (j - 10); return v % 6 < 3 ? Wn[3 + (j === 10 ? 1 : 0)] : BK; } if (j === 9 || j === 17) return K0;
      return warm(tone(M, 3 + ((i * 5 + j) % 13 === 0 ? -1 : 0) + (j < 9 ? 1 : -1)), .15); });
    // ---- 折れた砲身（上が折れ口：熱い だいだいの ぎざぎざ、下は すすけた鉄） ----
    reg(REG.stub, (i, j) => { const e = 2 + Math.round(hash(i >> 1, 3, 9) * 3); if (j < e) return j === e - 1 ? HOT[1] : HOT[0]; if (j === e) return HOT[2]; return (i * 3 + j * 5) % 7 === 0 ? Dk[2] : (i + j) % 2 ? BK : '#34303e'; });
    // ---- 目の光（光る材質ではる。0 が水色、1 が赤） ----
    for (const [r, a, b2] of [[REG.eye0, '#e8ffff', '#40d8f0'], [REG.eye1, '#fff0d0', '#ff4a28']]) reg(r, (i, j) => { const f = Math.abs(i - 11.5); return f < 3 && j > 1 && j < 6 ? a : f < 9 ? (j % 2 ? b2 : mix(b2, a, .35)) : mix(b2, '#201828', .5); });
    return P; }

  const texCache = new Map();
  GB.tex = c => { let t = texCache.get(c); if (!t) texCache.set(c, t = [0, 1].map(h => R.tex.from(paint(c, h), { m: 4 }))); return t; };

  // ================= 形 =================
  const L1 = .75, L2 = .85, SPL = .25, Q0 = .35, FOOT = .24, HIPX = 1.0;
  const hipY = q => .1 + Math.cos(SPL) * (L1 + L2) * Math.cos(q) + FOOT;
  GB.make = (o = {}) => { const c = o.c || '#6474a6', TX = GB.tex(c), s = o.s || 1, sw = [];
    const J = { root: new THREE.Group(), pt: {}, legs: [] }, g = J.root, px = (G, r) => G.px(r[0], r[1], r[2], r[3], 128, 128);
    const M0 = (side) => R.mat(TX[0], { vc: true, smooth: true, side }), M1 = (side) => R.mat(TX[1], { vc: true, smooth: true, side });
    const mesh = (G, side = false) => { const m = G.mesh(M0(side)); m.userData.side = side; sw.push(m); return m; };
    const cone = (G, r, m, len, rad, n = 4) => px(G, r).at(m).loft(n, [[0, rad, rad, 0, .85], [len * .6, rad * .6, rad * .6, .6, 1], [len, .02, .02, 1, 1.15]], { rot: 0 }).at(null);
    const ball = (G, r, m, rad, n = 6) => px(G, r).at(m).loft(n, [[-rad, .02, .02, 0, .75], [-rad * .6, rad * .8, rad * .8, .2, .9], [0, rad, rad, .5, 1], [rad * .6, rad * .8, rad * .8, .8, 1.05], [rad, .02, .02, 1, 1.1]], {}).at(null);
    J.move = grp(g); J.hips = grp(J.move, 0, hipY(Q0), 0); J.torso = grp(J.hips, 0, .15, 0);
    // こし
    { const G = R.geo().smooth(1); px(G, REG.leg).loft(8, [[-.5, .8, .7, 0, .75], [-.15, 1.2, 1.02, .5, .95], [.22, 1.36, 1.18, 1, 1]], { cap: 'bot', capUV: [.5, .1] }); J.hips.add(mesh(G)); }
    // 足 2 本（もも → すね → 足の甲と つめ）
    for (const sx of [1, -1]) { const root = grp(J.hips, sx * HIPX, -.1, 0); root.rotation.z = sx * SPL; const th = grp(root), sh = grp(th, 0, -L1, 0), ft = grp(sh, 0, -L2, 0);
      const Gt = R.geo().smooth(1); px(Gt, REG.leg).loft(6, [[-L1 - .1, .42, .46, 0, .85], [-L1 * .5, .5, .56, .5, 1], [.2, .54, .6, 1, 1]], {}); th.add(mesh(Gt));
      const Gs = R.geo().smooth(1); ball(Gs, REG.arm, TR(0, 0, 0), .42); px(Gs, REG.leg).loft(8, [[-L2, .62, .68, 0, .85], [-L2 * .55, .48, .52, .45, .95], [.05, .42, .46, 1, 1]], {}); sh.add(mesh(Gs));
      const Gf = R.geo().smooth(1); px(Gf, REG.gun).loft(8, [[-FOOT, .78, .95, .1, .8, 0, .15], [-.04, .7, .84, .3, 1, 0, .12], [.14, .5, .55, .45, 1.05]], { cap: 'both', capUV: [.5, .3] });
      Gf.smooth(2); for (const dx of [-.42, 0, .42]) cone(Gf, REG.claw, TR(dx, -FOOT + .08, .95, dx * .5, PI / 2 + .25, 0), .55, .16);
      ft.add(mesh(Gf)); J.legs.push({ sx, root, th, sh, ft }); J.pt[sx > 0 ? 'footL' : 'footR'] = grp(ft, 0, 0, .3); }
    // 胴（12 角。正面のまん中の 2 面は とびらなので、まん中の帯だけ ぬく）
    const RG = [[0, 1.3, 1.15, 0, .85], [.45, 1.7, 1.5, .225, 1], [1.15, 1.8, 1.6, .575, 1], [1.65, 1.6, 1.45, .825, 1.02], [2.0, 1.05, 1.0, 1, 1.05]];
    { const G = R.geo().smooth(1); px(G, REG.hull).loft(12, [RG[0], RG[1]], { rot: 0 }).loft(12, [RG[1], RG[2], RG[3]], { rot: 0, seg: [0, 5] }).loft(12, [RG[1], RG[2], RG[3]], { rot: 0, seg: [7, 12] }).loft(12, [RG[3], RG[4]], { rot: 0, cap: 'top', capUV: [.5, .95] });
      // 肩（左右の まるい おおい）と、背の えんとつ 2 本
      for (const sx of [-1, 1]) { px(G, REG.sho).at(TR(sx * 1.85, 1.3, 0)).loft(8, [[0, .5, .58, 0, .85], [.32, .76, .8, .45, 1], [.66, .62, .66, .8, 1.05], [.88, .2, .2, .96, 1.1]], { cap: 'top', capUV: [.5, .93] }).at(null);
        px(G, REG.chim).at(TR(sx * .68, 1.45, -1.0, 0, -.42, 0)).loft(6, [[0, .3, .3, 0, .9], [1.5, .25, .25, .9, 1], [1.62, .31, .31, 1, 1.1]], { cap: 'top', capUV: [.5, .82] }).at(null); }
      J.torso.add(mesh(G)); J.pt.chimL = grp(J.torso, .68, 2.95, -1.7); J.pt.chimR = grp(J.torso, -.68, 2.95, -1.7); }
    // 胸の中（おくのかべ・左右・上下）と炉心
    { const G = R.geo(), A = [-.9, .45, 1.3], B2 = [.9, .45, 1.3], Cc = [.9, 1.65, 1.26], D = [-.9, 1.65, 1.26], a = [-.72, .5, .55], b = [.72, .5, .55], c2 = [.72, 1.6, .55], d = [-.72, 1.6, .55];
      px(G, REG.cav).quad(a, b, c2, d, [0, 0, 1, 1], .9).quad(A, a, d, D, [0, 0, .5, 1], .6).quad(b, B2, Cc, c2, [.5, 0, 1, 1], .6).quad(A, B2, b, a, [0, 0, 1, .4], .5).quad(d, c2, Cc, D, [0, .6, 1, 1], .7);
      J.torso.add(G.mesh(R.mat(TX[0], { glow: true })));
      const Gc = R.geo().smooth(1); ball(Gc, REG.core, TR(0, 0, 0), .44, 8); J.core = Gc.mesh(R.mat(TX[0], { glow: true })); J.core.position.set(0, 1.05, .98); J.torso.add(J.core);
      const Gk = R.geo().smooth(2); for (const sy of [-1, 1]) cone(Gk, REG.claw, TR(0, 1.05 + sy * .62, .98, 0, 0, sy > 0 ? PI : 0), .34, .2, 5); J.torso.add(mesh(Gk)); }
    // とびら 2 枚（ちょうつがいは左右の外がわ。内がわも見えるので両面）
    J.doors = [-1, 1].map(sx => { const hx = sx * .9, hz = 1.386, dr = grp(J.torso, hx, 0, hz), G = R.geo().smooth(1); px(G, REG.hull).at(TR(-hx, 0, -hz)).loft(12, [RG[1], RG[2], RG[3]], { rot: 0, seg: sx < 0 ? [5, 6] : [6, 7] }).at(null); dr.add(mesh(G, true)); return dr; });
    // 頭（8 角。正面は平ら）と、目の光、左右の はいきの つの、アンテナ
    { const hd = J.head = grp(J.torso, 0, 2.0, .2), G = R.geo().smooth(1); px(G, REG.head).loft(8, [[-.12, .8, .76, 0, .9], [.25, .86, .8, .45, 1], [.5, .7, .68, .8, 1.02], [.68, .34, .34, .96, 1.08]], { cap: 'top', capUV: [.5, .93] });
      G.smooth(2); for (const sx of [-1, 1]) cone(G, REG.chim, TR(sx * .66, .3, -.1, 0, -.55, -sx * .6), .95, .17, 5); cone(G, REG.claw, TR(.28, .6, -.25, 0, -.2, 0), .9, .05, 3); hd.add(mesh(G));
      J.eyes = [REG.eye0, REG.eye1].map((r, i) => { const Ge = R.geo(); px(Ge, r).quad([-.31, .2, .772], [.31, .2, .772], [.31, .37, .722], [-.31, .37, .722]); const m = Ge.mesh(R.mat(TX[0], { glow: true })); m.visible = i === 0; hd.add(m); return m; });
      J.pt.head = grp(hd, 0, .3, .8); J.pt.top = grp(hd, 0, .9, 0); }
    // 左うで（+x）：上うで → ひじ → 太い前うで → ハサミ 2 枚
    { const ar = J.armL = grp(J.torso, 1.95, 1.62, 0), fo = J.foreL = grp(ar, 0, -1.05, 0), G = R.geo().smooth(1); px(G, REG.arm).loft(6, [[-1.05, .3, .3, 0, .9], [.12, .36, .36, 1, 1]], {}); ar.add(mesh(G));
      const Gf = R.geo().smooth(1); ball(Gf, REG.leg, TR(0, 0, 0), .4); px(Gf, REG.gun).loft(8, [[-1.25, .5, .5, .82, .85], [-1.0, .58, .58, .7, 1], [-.3, .44, .44, .3, 1], [.1, .36, .36, 0, 1]], { cap: 'bot', capUV: [.5, .98] }); fo.add(mesh(Gf));
      J.pinch = [1, -1].map(sz => { const p = grp(fo, 0, -1.2, sz * .24), Gp = R.geo().smooth(0); px(Gp, REG.claw).loft(4, [[-1.2, .04, .04, 1, 1.15, 0, -sz * .26], [-.8, .1, .17, .68, 1.05, 0, -sz * .06], [-.35, .13, .24, .32, 1, 0, sz * .04], [.08, .14, .22, 0, .9]], { rot: .5, cap: 'bot' }); p.add(mesh(Gp, true)); p.userData.sz = sz; return p; });
      J.pt.claw = grp(fo, 0, -1.5, 0); }
    // 右うで（−x）：上うで → ひじ → 砲の もと → 砲身（こわれると 折れ口に入れかえ）
    { const ar = J.armR = grp(J.torso, -1.95, 1.62, 0), fo = J.foreR = grp(ar, 0, -1.05, 0), G = R.geo().smooth(1); px(G, REG.arm).loft(6, [[-1.05, .3, .3, 0, .9], [.12, .36, .36, 1, 1]], {}); ar.add(mesh(G));
      const Gf = R.geo().smooth(1); ball(Gf, REG.leg, TR(0, 0, 0), .4); px(Gf, REG.gun).loft(8, [[-.95, .5, .5, .5, .9], [-.5, .6, .6, .3, 1], [.1, .38, .38, 0, 1]], {}); fo.add(mesh(Gf));
      const Gb = R.geo().smooth(1); px(Gb, REG.gun).loft(8, [[-2.05, .34, .34, 1, .7], [-2.0, .47, .47, .96, 1], [-1.72, .47, .47, .84, 1], [-1.66, .38, .38, .8, .95], [-.95, .42, .42, .5, 1]], { cap: 'bot', capUV: [.5, .995] }); J.barrel = mesh(Gb); fo.add(J.barrel);
      const Gs = R.geo().smooth(0); px(Gs, REG.stub).loft(8, [[-1.3, .3, .38, 1, 1.1, .06, 0], [-.95, .44, .44, 0, .9]], { cap: 'bot', capUV: [.5, .3] }); J.stub = mesh(Gs, true); J.stub.visible = false; fo.add(J.stub);
      J.pt.cannon = grp(fo, 0, -1.1, 0); J.pt.muzzle = grp(fo, 0, -2.1, 0); }
    J.pt.body = grp(J.torso, 0, 1.0, 1.7); J.pt.core = grp(J.torso, 0, 1.05, 1.25);
    g.scale.setScalar(s);
    g.userData = { kind: 'boss09', J, dyn: true, h: 4.6 * s, c: {}, core: J.core, at: (name, v) => (J.pt[name] || J.torso).getWorldPosition(v),
      form: n => { for (const m of sw) m.material = (n ? M1 : M0)(m.userData.side); J.eyes[0].visible = !n; J.eyes[1].visible = !!n; },
      wreck: on => { J.barrel.visible = !on; J.stub.visible = !!on; } };
    g.traverse(n => { if (n.isMesh) n.frustumCulled = false; }); GB.pose(g, {}); return g; };

  // ================= 動き =================
  const ACT = {
    // ハサミをふり下ろす：体をひねって うでを引き、ふみこんで たたきつける
    claw: (c, k) => { const w = seg(k, 0, .34) * (1 - seg(k, .36, .5)), a = seg(k, .38, .5) * (1 - seg(k, .68, 1));
      c.twist += w * .45 - a * .5; c.aL[0] += w * 1.1 - a * .6; c.aL[2] += w * .5 + a * .1; c.fL += -w * .7 + a * .45; c.pin = .25 + w * .65 - a * .15; c.lean += -w * .12 + a * .4; c.sq += a * .22; c.dz += a * .5 - w * .15; c.hx += a * .2; },
    // 大砲をかまえる：うでを水平に上げる（うつ時の はねかえりは recoil）
    fire: (c, k, t, o) => { const a = seg(k, 0, .25) * (1 - seg(k, .8, 1)); c.aR[0] += -a * 1.05 - (o.recoil || 0) * .2; c.fR += a * .45 + (o.recoil || 0) * .2; c.twist += a * .2; c.lean -= (o.recoil || 0) * .06; },
    // 力をためる：ひざを落として うでを引きつけ、こまかく ふるえる
    charge: (c, k, t) => { const a = seg(k, 0, .15) * (1 - seg(k, .92, 1)); c.sq += a * .28; c.lean += a * .16; c.aL[0] += a * .25; c.aL[2] += a * .12; c.fL -= a * .85; c.aR[0] += a * .25; c.aR[2] -= a * .12; c.fR -= a * .85; c.hx += a * .3; c.pin = .25 + a * .5 * (.5 + .5 * Math.sin(t * 9)); c.sh += a * (.012 + .03 * k); },
    // 床をたたく：両うでを高くふり上げ、体ごと落として たたきつける
    slam: (c, k) => { const up = seg(k, 0, .36) * (1 - seg(k, .4, .5)), dn = seg(k, .41, .5) * (1 - seg(k, .7, 1));
      c.aL[0] += -up * 2.3 - dn * .95; c.aR[0] += -up * 2.3 - dn * .95; c.aL[2] += up * .35; c.aR[2] -= up * .35; c.fL += up * .5 + dn * .35; c.fR += up * .4 + dn * .25; c.lean += -up * .25 + dn * .42; c.sq += -up * .12 + dn * .42; c.hx += -up * .25 + dn * .3; c.pin = .25 + up * .6; c.dz += dn * .35; },
    // ひるむ：のけぞって、頭とうでが ゆれる
    flinch: (c, k, t) => { const a = Math.sin(seg(k, 0, .2) * PI / 2) * (1 - seg(k, .45, 1)); c.lean -= a * .3; c.twist -= a * .3; c.dz -= a * .45; c.hy += Math.sin(t * 24) * .3 * a; c.aL[2] += a * .55; c.aR[2] -= a * .4; c.aL[0] += a * .5; c.fL -= a * .3; c.sh += a * .03; c.sq += a * .1; },
    // とびらが開くときの身ぶるい：胸をそらし、うでを左右に開く
    open: (c, k, t) => { const a = seg(k, 0, .25) * (1 - seg(k, .8, 1)); c.lean -= a * .2; c.aL[2] += a * .7; c.aR[2] -= a * .7; c.aL[0] += a * .3; c.aR[0] += a * .3; c.fL -= a * .4; c.hx -= a * .3; c.sq += a * .08; c.sh += a * .035 * (1 - k); c.pin = .25 + a * .7; },
    // よろめく：大きくのけぞり、ひざが落ちて うでが たれる
    stagger: (c, k, t) => { const a = Math.sin(seg(k, 0, .12) * PI / 2) * (1 - seg(k, .6, 1)), wob = Math.sin(t * 5.5) * a; c.lean -= a * .42; c.sq += a * .3; c.dz -= a * .7; c.roll += wob * .12; c.hy += wob * .5; c.hx += a * .35; c.aL = [c.aL[0] * (1 - a) + .35 * a, 0, c.aL[2] + a * .3]; c.fL = c.fL * (1 - a) - .2 * a; c.aR[0] += a * .4; c.sh += a * .03 * (1 - k); c.pin = .25 + a * .6; } };
  GB.acts = Object.keys(ACT);

  GB.pose = (g, o = {}) => { const J = g.userData.J, c = g.userData.c, t = o.t || 0, br = Math.sin(t * 1.5);
    c.sq = .02 + br * .015; c.lean = .04; c.twist = Math.sin(t * .6) * .05; c.roll = 0; c.dz = 0; c.sh = 0; c.hy = (o.look || 0) + Math.sin(t * .8) * .12; c.hx = .05;
    c.aL = [-.42 + br * .04, 0, .14]; c.fL = -.75 - br * .05; c.pin = .25 + Math.max(0, Math.sin(t * 2.1)) * .2; c.aR = [-.36 - br * .04, 0, -.14]; c.fR = -.62 + br * .04;
    if (o.broken) { c.aR = [.12 + Math.sin(t * 2.3) * .04, 0, -.2]; c.fR = -.18; }
    for (const a of o.acts || []) if (ACT[a.name] && a.k > 0 && a.k < 1 && !(o.broken && a.name === 'fire')) ACT[a.name](c, a.k, t, a);
    const q = cl(Q0 + c.sq, .05, 1.1), sx = Math.sin(t * 47) * c.sh, sz = Math.sin(t * 61) * c.sh;
    J.hips.position.set(sx, hipY(q), c.dz * .4 + sz); J.hips.rotation.set(0, 0, 0);
    for (const L of J.legs) { L.th.rotation.x = -q - c.dz * .12; L.sh.rotation.x = 2 * q; L.ft.rotation.set(-q + c.dz * .12, 0, -L.sx * SPL); }
    J.torso.position.set(0, .15, c.dz * .6); J.torso.rotation.set(c.lean, c.twist, c.roll);
    J.head.rotation.set(c.hx, c.hy, 0);
    J.armL.rotation.set(c.aL[0], c.aL[1], c.aL[2]); J.foreL.rotation.x = c.fL; for (const p of J.pinch) p.rotation.x = p.userData.sz * c.pin;
    J.armR.rotation.set(c.aR[0], c.aR[1], c.aR[2]); J.foreR.rotation.x = c.fR;
    const op = cl(o.open || 0); J.doors[0].rotation.y = -op * 1.95; J.doors[1].rotation.y = op * 1.95;
    g.updateMatrixWorld(true); };

  // ================= 攻撃の予告の輪（床に置く。赤いしまの輪と、内がわの うすい赤） =================
  let warnT = null;
  GB.warn = (o = {}) => { const r = o.r || 3;
    if (!warnT) { const P = Px(64); P.each((x, y) => { const dx = x - 31.5, dy = y - 31.5, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (d > 31) return '#000000'; if (d > 27) return Math.floor((a / PI + 1) * 12) % 2 ? '#ff5a3a' : '#7a1408'; if (d > 25.5) return '#ffd0a0';
        if (d > 16 && d < 18) return Math.floor((a / PI + 1) * 20) % 2 ? '#c03020' : '#000000'; return ((x + y) % 4 === 0) ? '#5a1810' : '#280806'; }); warnT = R.tex.from(P, {}); }
    const G = R.geo(), n = 6; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x0 = -1 + 2 * i / n, x1 = -1 + 2 * (i + 1) / n, z0 = -1 + 2 * j / n, z1 = -1 + 2 * (j + 1) / n; G.quad([x0 * r, 0, z1 * r], [x1 * r, 0, z1 * r], [x1 * r, 0, z0 * r], [x0 * r, 0, z0 * r], [i / n, 1 - (j + 1) / n, (i + 1) / n, 1 - j / n]); }
    const m = new THREE.Mesh(G.build(), new THREE.MeshBasicMaterial({ map: warnT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.position.y = .05; m.visible = false; m.userData.dyn = true; m.renderOrder = 5;
    m.userData.set = (k, t) => { m.visible = k > .01; m.material.opacity = cl(k) * (.55 + .45 * Math.sin(t * (6 + k * 10))); m.rotation.y = t * .5; };
    return m; };
  return GB; };
