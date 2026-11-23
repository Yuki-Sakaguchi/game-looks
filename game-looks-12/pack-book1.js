// game-looks-12「絵本の世界」（01〜05）の追加の部品。kit.js・retro.js のあとに読み、 const B1 = PACK_BOOK1(THREE, K, R)  として使う。
// 作り方は retro.js と同じ（少ない面＋手で打ったドット絵のテクスチャ）。家や木は箱を組まず、R.house・R.tree を B1.warp でぐにゃりとゆがめて使う。
//
// ■ テクスチャ  B1.tex.名前({ c, seed, m, … }) → THREE.Texture（同じ引数なら同じ物）
//   お菓子：candy { c, c2, w }（ななめのしま。筒にまくと らせん）  swirl { cs: [色…] }（うずまきのぺろぺろキャンディの面・抜き）  cookie { c, chip }（クッキーの面）  cookieEdge { c }（クッキーのふち）
//           cake { cream, sponge, jam, seed }（ケーキの横。上にたれたクリーム・スポンジ・ジャムの層。v 0〜1 を 1 段にはる）  cream { c, sp }（上のクリーム。sp: false でスプリンクルなし）
//           wafer { c }（ワッフルの道）  sugarGround { c, sp }（スプリンクルをちらした地面）  ginger { c, icing }（ジンジャーブレッドのかべ）  choco { c }（板チョコの屋根）  jelly { c }（グミ・砂糖つぶ）
//   お茶：porcelain { c, blue, gold, inner }（白い磁器。v 0〜1 で上が金のふち）  silver { c }（ぎんのスプーン）  sugar（角砂糖の 1 面）
//   本：page { c, ink, seed }（文字の行の紙）  pageEdge { c }（紙のたばの小口）  cover { c, gold }（革の表紙）  spine { c, gold, seed }（本の背 32×64）  glyphs { c }（文字の川）  ribbon { c }（しおりのリボン 16×64・抜き）
//   布と道具：rubber { c }（長ぐつのゴム）  tread { c }（くつ底）  patch { cs: [色…], seed }（つぎはぎの布。ぬい目つき）  button { c }（ボタン・抜き）  thread { c }（糸）  thimble { c }（指ぬき）  plastic { c }
//   balloonSkin { c, c2 }（風船のゴム）
//
// ■ 形
//   B1.warp(物, { lean: [x, z], twist, bulge, pinch, wave, sy, seed, step }) → ゆがめた Group（R.house や R.tree をまず作り、面を細かく割ってから曲げる）
//   B1.tube(G, [[x, y, z, 半径], …], 角の数, { m, ur, up }) 曲がった管（R.geo() に足す）
//   B1.lollipop({ h, r, cs, seed })  ぺろぺろキャンディの木    B1.caneLamp({ h, c, light })  キャンディのしまの街灯（つり下げたグミのあかり）
//   B1.cookie({ r, th, c, seed })  クッキー（たてに立つ円盤。正面が +z）    B1.cake({ tiers: [[半径, 高さ], …], cream, sponge, jam, berries, candles })  段のケーキ（userData.flames）
//   B1.gumdrop({ r, c })  グミのしげみ    B1.balloon({ r, c, c2, len })  風船（userData.tick(t)。ひもの下はしが原点）
//   動く物は  B1.tick(t)  を毎コマ 1 回。
window.PACK_BOOK1 = (THREE, K, R) => {
  const { hash, mix, ramp, tn, Px, geo, parts, TR } = R, T = R.tex, PI = Math.PI, TAU = PI * 2, cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const X = {}, cache = new Map(), ticks = [];
  const def = (name, m, fn, cut = false) => { X[name] = (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) { t = T.from(fn(o), { m: o.m || m, cut }); cache.set(k, t); } return t; }; };

  // ================= テクスチャ：お菓子 =================
  def('candy', 1, o => { const P = Px(32), A = ramp(o.c || '#e23a4e'), W = ramp(o.c2 || '#fff2ea', 6, { contrast: .45 }), wd = o.w ?? 11;
    P.each((x, y) => { const b = (x + y) % 32; if (b < wd) return b < 2 ? A[4] : b >= wd - 2 ? A[1] : hash(x >> 1, y >> 1, 3) > .9 ? A[2] : A[3];
      if (o.thin !== false && b >= 20 && b < 22) return b === 20 ? A[4] : A[2];
      return b < wd + 2 ? W[2] : b > 29 ? W[3] : hash(x, y, 5) > .96 ? '#ffffff' : W[4]; }); return P; });
  def('swirl', 2, o => { const P = Px(64), cs = (o.cs || ['#f04a6a', '#fff4ea', '#5ac0e0', '#fff4ea']).map(c => ramp(c)); P.clip = true;
    P.each((x, y) => { const dx = x + .5 - 32, dy = y + .5 - 32, d = Math.hypot(dx, dy); if (d > 31.6) return null; const a = Math.atan2(dy, dx), k = (a / TAU + 1 + d / 16) * cs.length, i = Math.floor(k) % cs.length, f = k - Math.floor(k), A = cs[i];
      if (d > 29.8) return A[1]; if (d < 2.2) return A[4]; return f < .1 ? A[4] : f > .9 ? A[2] : (dx + dy < -14 && d < 24 && f > .3 && f < .55) ? A[5] : A[3]; }); return P; }, true);
  def('cookie', 2, o => { const P = Px(64), A = ramp(o.c || '#d0924e'), C = ramp(o.chip || '#5a3424'), sd = o.seed || 0;
    P.each((x, y) => { const d = Math.hypot(x + .5 - 32, y + .5 - 32), n = tn(x, y, 8, 8, 64, 64, sd) * .6 + tn(x, y, 4, 4, 64, 64, sd + 2) * .4; return d > 30 ? A[1] : d > 27.5 ? (n > .5 ? A[2] : A[1]) : n > .64 ? A[4] : n < .34 ? A[2] : A[3]; });
    for (let k = 0; k < 6; k++) { let x = 32 + (hash(k, 1, sd) - .5) * 36, y = 32 + (hash(k, 2, sd) - .5) * 36; for (let i = 0; i < 7; i++) { P.set(x, y, A[1]); x += hash(k, i, sd + 3) > .5 ? 1 : 0; y += 1; } }   // ひび
    for (let k = 0; k < 14; k++) { const a = hash(k, 4, sd) * TAU, r = Math.sqrt(hash(k, 5, sd)) * 22, x = Math.round(32 + Math.cos(a) * r), y = Math.round(32 + Math.sin(a) * r);
      P.bits(x - 2, y - 1, ['.dd.', 'dmmd', 'dmhd', '.dd.', '..s.'], { d: C[1], m: C[2], h: C[4], s: A[1] }); }   // チョコのつぶ
    for (let k = 0; k < 9; k++) { const x = 18 + (k % 3) * 14, y = 18 + Math.floor(k / 3) * 14; P.set(x, y, A[1]); P.set(x + 1, y, A[1]); P.set(x, y + 1, A[5]); }   // 焼くまえにつついた穴
    for (let k = 0; k < 16; k++) P.set(10 + hash(k, 8, sd) * 44, 10 + hash(k, 9, sd) * 44, '#fff4dc');   // 砂糖のきらめき
    return P; });
  def('cookieEdge', 1, o => { const P = Px(32), A = ramp(o.c || '#d0924e'); P.each((x, y) => { const n = tn(x, y, 4, 4, 32, 32, 3); return y < 2 ? A[1] : y > 29 ? A[1] : n > .66 ? A[4] : n < .3 ? A[1] : hash(x, y, 2) > .85 ? A[2] : A[3]; }); return P; });
  def('cake', 3, o => { const P = Px(64), Cr = ramp(o.cream || '#fff0f2', 6, { contrast: .55 }), Sp = ramp(o.sponge || '#f2c878'), J = ramp(o.jam || '#d83a5a'), sd = o.seed || 0;
    const drips = [...Array(9)].map((_, k) => [k * 7 + hash(k, 1, sd) * 4, 4 + hash(k, 2, sd) * 14, 2 + hash(k, 3, sd) * 1.5]);
    const edge = x => { let e = 9 + Math.round(Math.sin(x / 64 * TAU * 3 + sd) * 1.2); for (const [cx, L, w] of drips) { const dx = Math.min(Math.abs(x - cx), 64 - Math.abs(x - cx)); if (dx < w) e = Math.max(e, Math.round(9 + L * Math.sqrt(1 - (dx / w) ** 2))); } return e; };
    P.each((x, y) => { const e = edge(x), n = tn(x, y, 8, 4, 64, 64, sd + 4);
      if (y < e) return y === e - 1 ? Cr[1] : y === e - 2 ? Cr[2] : y < 2 ? Cr[5] : (x + 1) % 7 === 0 && y < e - 3 ? Cr[5] : Cr[4];
      if (y === e) return Sp[1];
      if (y >= 34 && y < 39) return y === 34 ? J[4] : y === 38 ? J[1] : hash(x, y, sd) > .8 ? J[4] : J[2];
      if (y >= 39 && y < 43) return y === 39 ? Cr[2] : Cr[3];
      if (y > 61) return Sp[1];
      return hash(x, y, sd + 7) > .92 ? Sp[1] : hash(x, y, sd + 8) > .9 ? Sp[5] : n > .62 ? Sp[4] : n < .32 ? Sp[2] : Sp[3]; });
    for (let k = 0; k < 5; k++) { const x = hash(k, 9, sd) * 64, y = 36; P.disc(x, y, 1.6, J[0]); P.set(x - 1, y - 1, '#ffd0d8'); }   // ジャムのいちごのつぶ
    return P; });
  def('cream', 3, o => { const P = Px(64), Cr = ramp(o.c || '#fff0f4', 6, { contrast: .5 }), sp = o.sp === false ? [] : (o.sp || ['#f05a7a', '#5ac8e8', '#f8d050', '#8ad070', '#b080e0']), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 16, 16, 64, 64, sd), w = Math.sin((x + y * .5) / 64 * TAU * 4 + n * 5); return w > .88 ? Cr[5] : w < -.84 ? Cr[2] : w < -.6 ? Cr[3] : Cr[4]; });
    for (let k = 0; k < 44 && sp.length; k++) { const x = hash(k, 1, sd) * 64, y = hash(k, 2, sd) * 64, c = sp[k % sp.length]; if (k % 3 === 0) { P.set(x, y, c); P.set(x + 1, y, c); P.set(x + 2, y, c); } else if (k % 3 === 1) { P.set(x, y, c); P.set(x, y + 1, c); P.set(x, y + 2, c); } else { P.set(x, y, c); P.set(x + 1, y + 1, c); } P.set(x + 1, y + 2, Cr[1]); }
    return P; });
  def('wafer', 1.5, o => { const P = Px(32), A = ramp(o.c || '#e0b070'); P.each((x, y) => { const i = x % 8, j = y % 8; if (i === 0 || j === 0) return hash(x >> 3, y >> 3, 2) > .85 ? A[3] : A[4]; if (i === 1 || j === 1) return A[5]; if (i === 7 || j === 7) return A[1]; return i === 6 || j === 6 ? A[2] : hash(x, y, 4) > .9 ? A[4] : A[3]; }); return P; });
  def('sugarGround', 3, o => { const P = Px(64), A = ramp(o.c || '#a8e0c0'), sp = o.sp || ['#f05a7a', '#5a9ae8', '#f8d050', '#ffffff', '#b070e0'], sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 16, 8, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 3) * .4; return n > .64 ? A[4] : n > .6 ? ((x + y) & 1 ? A[4] : A[3]) : n < .36 ? A[2] : A[3]; });
    for (let k = 0; k < 30; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64), c = sp[k % sp.length], d = k % 3; for (let i = 0; i < 3; i++) P.set(x + (d === 1 ? 0 : i), y + (d === 0 ? 0 : i), c); P.set(x + (d === 1 ? 1 : 0), y + (d === 0 ? 1 : 3), A[1]); }
    for (let k = 0; k < 18; k++) P.set(hash(k, 5, sd) * 64, hash(k, 6, sd) * 64, A[5]);
    return P; });
  def('ginger', 3, o => { const P = Px(64), A = ramp(o.c || '#b8743e'), I = ramp(o.icing || '#fff8f0', 6, { contrast: .4 });
    P.each((x, y) => { const n = tn(x, y, 8, 8, 64, 64, 5); return n > .66 ? A[4] : n < .3 ? A[2] : hash(x, y, 6) > .93 ? A[1] : A[3]; });
    for (const y0 of [4, 58]) for (let x = 0; x < 64; x++) { const yy = y0 + Math.round(Math.abs(((x % 8) - 4)) / 2) - 1; P.set(x, yy, I[4]); P.set(x, yy + 1, I[2]); P.set(x, yy + 2, A[1]); }   // ぎざぎざのアイシング
    for (let x = 4; x < 64; x += 8) { P.set(x, 10, I[4]); P.set(x, 11, I[2]); P.set(x, 53, I[4]); P.set(x, 54, I[2]); }
    for (let k = 0; k < 4; k++) { const x = 8 + k * 16, y = 30; P.set(x, y, '#f05a7a'); P.set(x + 1, y, '#f05a7a'); P.set(x, y + 1, '#a02a4a'); P.set(x + 8, y + 2, '#5ac0e0'); P.set(x + 8, y + 3, '#2a6a9a'); }   // かざりのつぶ
    return P; });
  def('choco', 2, o => { const P = Px(64), A = ramp(o.c || '#6a3a24'); P.fill(A[1]); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { P.block(i * 16 + 1, j * 16 + 1, 14, 14, A, 3, { hi: 2, lo: 2 }); P.rect(i * 16 + 4, j * 16 + 4, 8, 8, A[2]); P.rect(i * 16 + 4, j * 16 + 4, 8, 1, A[1]); P.rect(i * 16 + 4, j * 16 + 4, 1, 8, A[1]); P.rect(i * 16 + 5, j * 16 + 11, 7, 1, A[4]); }
    for (let k = 0; k < 10; k++) P.set(hash(k, 1) * 64, hash(k, 2) * 64, A[5]); return P; });
  def('jelly', 1, o => { const P = Px(32), A = ramp(o.c || '#f05a7a', 6, { contrast: 1.1 }); P.each((x, y) => { const n = tn(x, y, 8, 8, 32, 32, 3), h = hash(x, y, 4); return h > .9 ? '#ffffff' : h > .82 ? A[5] : h < .06 ? A[1] : n > .6 ? A[4] : n < .35 ? A[2] : A[3]; }); return P; });

  // ================= テクスチャ：お茶 =================
  def('porcelain', 4, o => { const P = Px(64), W = ramp(o.c || '#f4f2ec', 6, { contrast: .4, cool: .62 }), B = ramp(o.blue || '#3a5ab0'), G = ramp(o.gold || '#d8a838');
    P.each((x, y) => { const n = tn(x, y, 32, 16, 64, 64, 1); return n > .68 ? W[4] : n < .3 ? W[2] : W[3]; });
    P.rect(0, 0, 64, 1, G[5]); P.rect(0, 1, 64, 2, G[3]); P.rect(0, 3, 64, 1, G[1]);
    P.rect(0, 6, 64, 1, B[2]);
    if (!o.inner) { for (let k = 0; k < 4; k++) { const cx = 8 + k * 16, cy = 15; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU - PI / 2; P.disc(cx + Math.cos(a) * 3.2, cy + Math.sin(a) * 3.2, 2.2, B[3]); } P.disc(cx, cy, 1.6, G[4]); P.set(cx - 2, cy - 4, B[5]);
        P.line(cx + 5, cy + 1, cx + 11, cy - 1, B[1]); P.set(cx + 7, cy - 1, B[2]); P.set(cx + 9, cy + 1, B[2]); P.set(cx + 8, cy - 2, B[2]); }   // 青い花と葉のつる
      P.rect(0, 24, 64, 1, B[2]); P.rect(0, 25, 64, 1, B[4]);
      for (let k = 0; k < 10; k++) { const x = (k * 13 + 5) % 64, y = 32 + (k * 7) % 22; P.set(x, y, B[3]); P.set(x - 1, y, B[4]); P.set(x + 1, y, B[4]); P.set(x, y - 1, B[4]); P.set(x, y + 1, B[4]); }
      P.rect(0, 59, 64, 1, G[3]); P.rect(0, 60, 64, 1, G[1]); }
    else { for (let x = 0; x < 64; x += 4) P.set(x, 8, B[3]); }
    return P; });
  def('silver', 1, o => { const P = Px(32), M = ramp(o.c || '#b8bccc', 6, { contrast: 1.1 }); P.each((x, y) => { const s = ((x * 2 + y + Math.round(Math.sin(y / 32 * TAU) * 3)) % 32 + 32) % 32; return s < 2 ? '#ffffff' : s < 4 ? M[5] : s < 12 ? M[4] : s < 20 ? M[3] : s < 26 ? M[2] : M[3]; }); return P; });
  def('sugar', 1, o => { const P = Px(32), W = ramp(o.c || '#f4f4fa', 6, { contrast: .55, cool: .62 }); P.each((x, y) => { const e = Math.min(x, y, 31 - x, 31 - y), h = hash(x, y, 7); if (e === 0) return x === 0 || y === 0 ? W[5] : W[1]; if (e === 1) return W[4]; return h > .9 ? '#ffffff' : h < .08 ? W[1] : h < .22 ? W[2] : tn(x, y, 8, 8, 32, 32, 2) > .6 ? W[4] : W[3]; }); return P; });

  // ================= テクスチャ：本 =================
  const GLY = [['xxx', 'x.x', 'xxx', 'x..'], ['x.x', 'xxx', 'x.x', 'x.x'], ['xx.', 'x.x', 'xx.', 'x.x'], ['.x.', 'x.x', 'xxx', 'x.x'], ['xxx', '.x.', '.x.', 'xxx'], ['x..', 'x..', 'x..', 'xxx'], ['xxx', 'x..', 'xx.', 'xxx'], ['x.x', '.x.', 'x.x', 'x.x'], ['.xx', 'x..', '.x.', 'xx.'], ['xxx', '..x', '.x.', 'x..']];
  const glyph = (P, x, y, i, c) => P.bits(x, y, GLY[i % GLY.length], { x: c });
  def('page', 2, o => { const P = Px(64), W = ramp(o.c || '#f4ead0', 6, { contrast: .5 }), I = ramp(o.ink || '#3a3450'), sd = o.seed || 0;
    P.each((x, y) => tn(x, y, 32, 16, 64, 64, sd) > .66 ? W[4] : hash(x >> 1, y >> 1, sd) > .97 ? W[2] : W[3]);
    for (let row = 0; row < 8; row++) { const y0 = 2 + row * 8; let x = 1; while (x < 61) { const wl = 2 + Math.floor(hash(x, row, sd) * 5); for (let c = 0; c < wl && x < 61; c++) { glyph(P, x, y0, Math.floor(hash(x, row * 7, sd + 1) * 10), I[hash(x, row, sd + 2) > .85 ? 2 : 1]); x += 4; } x += 3; } }
    if (o.pic !== false) { const x0 = 36, y0 = 18; P.rect(x0, y0, 22, 18, W[5]); for (let i = 0; i < 22; i++) { P.set(x0 + i, y0, I[2]); P.set(x0 + i, y0 + 17, I[2]); } for (let j = 0; j < 18; j++) { P.set(x0, y0 + j, I[2]); P.set(x0 + 21, y0 + j, I[2]); }
      P.line(x0 + 2, y0 + 15, x0 + 8, y0 + 6, '#c85a4a'); P.line(x0 + 8, y0 + 6, x0 + 13, y0 + 15, '#c85a4a'); P.line(x0 + 10, y0 + 15, x0 + 15, y0 + 9, '#4a8a5a'); P.line(x0 + 15, y0 + 9, x0 + 20, y0 + 15, '#4a8a5a'); P.disc(x0 + 17, y0 + 4, 2, '#f0b040'); }   // 小さなさし絵（山と日）
    return P; });
  def('pageEdge', 1, o => { const P = Px(32), W = ramp(o.c || '#f0e4c4', 6, { contrast: .6 }); P.each((x, y) => { const h = hash(y, 0, 3); return y % 2 ? (h > .8 ? W[1] : W[2]) : (hash(x >> 3, y, 4) > .9 ? W[3] : W[4]); }); return P; });
  def('cover', 4, o => { const P = Px(64), A = ramp(o.c || '#a8343a'), G = ramp(o.gold || '#e0b048');
    P.each((x, y) => { const n = tn(x, y, 8, 8, 64, 64, 2); return n > .66 ? A[4] : n < .3 ? A[2] : hash(x, y, 3) > .94 ? A[1] : A[3]; });
    for (let i = 4; i < 60; i++) { P.set(i, 4, G[4]); P.set(i, 59, G[2]); P.set(4, i, G[4]); P.set(59, i, G[2]); P.set(i, 7, G[3]); P.set(7, i, G[3]); P.set(i, 56, G[3]); P.set(56, i, G[3]); }
    for (const [cx, cy] of [[10, 10], [53, 10], [10, 53], [53, 53], [32, 32]]) { const r = cx === 32 ? 6 : 2; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (Math.abs(i) + Math.abs(j) <= r) P.set(cx + i, cy + j, Math.abs(i) + Math.abs(j) === r ? G[1] : G[4]); }
    return P; });
  def('spine', 3, o => { const P = Px(32, 64), A = ramp(o.c || '#3a5a9a'), G = ramp(o.gold || '#e0b048'), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 8, 8, 32, 64, sd); return x < 2 ? A[1] : x > 29 ? A[1] : x < 5 ? A[2] : x > 22 && x < 26 ? A[4] : n > .66 ? A[4] : A[3]; });
    for (const y0 of [3, 10, 53, 59]) { P.rect(0, y0, 32, 2, G[3]); P.rect(0, y0, 32, 1, G[5]); P.rect(0, y0 + 2, 32, 1, A[1]); }
    P.rect(7, 18, 18, 28, A[1]); P.rect(8, 19, 16, 26, A[2]); for (let k = 0; k < 5; k++) glyph(P, 14, 21 + k * 5, Math.floor(hash(k, sd) * 10), G[4]);
    return P; });
  def('glyphs', 2, o => { const P = Px(64), A = ramp(o.c || '#3a4ab0'), cs = o.cs || ['#ffe070', '#ffffff', '#f8a0c0', '#a0f0e0'];
    P.each((x, y) => { const w = Math.sin(x / 64 * TAU * 2 + Math.sin(y / 64 * TAU * 3) * 1.5), n = tn(x, y, 16, 8, 64, 64, 4); return w > .9 ? A[5] : w > .75 ? A[4] : n < .3 ? A[2] : A[3]; });
    for (let k = 0; k < 22; k++) { const x = Math.floor(hash(k, 1) * 60), y = Math.floor(hash(k, 2) * 60), i = Math.floor(hash(k, 3) * 10); glyph(P, x + 1, y + 1, i, A[1]); glyph(P, x, y, i, cs[k % cs.length]); }
    return P; });
  def('ribbon', 1, o => { const P = Px(16, 64), A = ramp(o.c || '#d83a4a'); P.clip = true; P.each((x, y) => { const notch = y > 52 && Math.abs(x - 7.5) < (y - 52) * .7; if (notch) return null; return x < 1 ? A[1] : x > 14 ? A[1] : x < 3 ? A[2] : x > 5 && x < 8 ? A[5] : x < 10 ? A[4] : A[3]; }); return P; }, true);

  // ================= テクスチャ：布と道具 =================
  def('rubber', 3, o => { const P = Px(64), A = ramp(o.c || '#d83a30', 6, { contrast: 1.1 }); P.each((x, y) => { const n = tn(x, y, 16, 16, 64, 64, 2); if (x >= 10 && x < 15) return x === 10 || x === 14 ? A[4] : A[5]; if (x === 42 || x === 43) return A[4]; return n > .7 ? A[4] : n < .26 ? A[2] : A[3]; });
    for (let k = 0; k < 8; k++) { const x = hash(k, 1) * 64, y = 40 + hash(k, 2) * 22; P.set(x, y, '#8a6a4a'); P.set(x + 1, y, '#6a5040'); P.set(x, y + 1, '#6a5040'); }   // 小さな どろはね
    return P; });
  def('tread', 1, o => { const P = Px(32), A = ramp(o.c || '#3a3440'); P.each((x, y) => { const i = x % 8, j = (y + (x >> 3) % 2 * 4) % 8; return i > 0 && i < 6 && j > 0 && j < 4 ? (j === 1 ? A[4] : A[3]) : i === 6 || j === 4 ? A[0] : A[1]; }); return P; });
  def('patch', 4, o => { const P = Px(64), cs = o.cs || ['#e0705a', '#f0c060', '#6ab0a0', '#7a8ad0', '#e8a0b0', '#a8c870'], sd = o.seed || 0, st = o.stitch || '#fff4e0';
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const A = ramp(cs[Math.floor(hash(i, j, sd) * cs.length)]), kind = Math.floor(hash(i, j, sd + 1) * 5), x0 = i * 16, y0 = j * 16;
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let t = hash(x, y, sd + i * 4 + j) > .93 ? 2 : 3;
        if (kind === 1) t = ((x >> 2) + (y >> 2)) & 1 ? 4 : 2; else if (kind === 2) t = x % 4 < 2 ? 4 : 3; else if (kind === 3) t = ((x % 6) - 2.5) ** 2 + ((y % 6) - 2.5) ** 2 < 3 ? 5 : 3; else if (kind === 4) t = (x + (y % 8 < 4 ? y % 4 : 4 - y % 4)) % 6 < 2 ? 4 : 2;
        if (x === 0 || y === 0) t = Math.min(5, t + 1); if (x === 15 || y === 15) t = 0; P.set(x0 + x, y0 + y, A[t]); }
      for (let k = 2; k < 14; k += 3) { P.set(x0 + k, y0 + 2, st); P.set(x0 + k + 1, y0 + 2, st); P.set(x0 + 2, y0 + k, st); P.set(x0 + 2, y0 + k + 1, st); P.set(x0 + k, y0 + 3, A[1]); P.set(x0 + 3, y0 + k, A[1]); } }   // ぬい目
    return P; });
  def('button', 1, o => { const P = Px(32), A = ramp(o.c || '#e85a6a'), th = o.thread || '#fff4e0'; P.clip = true;
    P.each((x, y) => { const dx = x + .5 - 16, dy = y + .5 - 16, d = Math.hypot(dx, dy); if (d > 15.5) return null; if (d > 13) return dx + dy < 0 ? A[5] : A[1]; if (d > 11.5) return dx + dy < 0 ? A[2] : A[4]; return hash(x, y, 1) > .9 ? A[4] : A[3]; });
    for (const [x, y] of [[12, 12], [19, 12], [12, 19], [19, 19]]) { P.disc(x + .5, y + .5, 2.3, A[0]); P.set(x + 1, y + 2, A[4]); }
    P.line(13, 13, 19, 19, th); P.line(19, 13, 13, 19, th); P.line(14, 13, 20, 19, mix(th, A[1], .4)); return P; }, true);
  def('thread', .5, o => { const P = Px(16, 32), A = ramp(o.c || '#5a8ae0'); P.each((x, y) => { const s = (x + y) % 6; return x % 4 === 3 ? A[1] : s < 2 ? A[5] : s < 4 ? A[3] : A[2]; }); return P; });
  def('thimble', 1, o => { const P = Px(32), M = ramp(o.c || '#c8b070', 6, { contrast: 1.05 }); P.each((x, y) => { const i = (x + ((y >> 2) & 1) * 2) % 4, j = y % 4; return i === 1 && j === 1 ? M[0] : i === 2 && j === 2 ? M[5] : (x % 32 < 5 ? M[4] : x % 32 > 26 ? M[2] : M[3]); }); return P; });
  def('plastic', 1, o => { const P = Px(16), A = ramp(o.c || '#e85a3a', 6, { contrast: 1.1 }); P.each((x, y) => x === 3 || x === 4 ? A[5] : x === 5 ? A[4] : x > 12 ? A[2] : A[3]); return P; });
  def('balloonSkin', 1, o => { const P = Px(32), A = ramp(o.c || '#f05a6a', 6, { contrast: 1.1 }), B = o.c2 ? ramp(o.c2) : null; P.each((x, y) => { if (x % 16 === 0) return A[1]; if (B && x % 16 > 9) return x % 16 === 10 ? B[4] : B[3]; return x % 16 === 3 || x % 16 === 4 ? A[5] : x % 16 === 5 ? A[4] : A[3]; }); return P; });

  // ================= 形の道具 =================
  // 面を細かく割る（ゆがめても まっすぐな辺が残らないように）。いちばん長い辺を半分に切っていく。となりの三角形とも同じ点で切れるので、すきまはできない
  function subdiv(g, L) { const names = Object.keys(g.attributes), A = names.map(n => g.attributes[n]), pi = names.indexOf('position'), n = A[pi].count, tris = [], out = [];
    const vtx = i => A.map(a => Array.from(a.array.slice(i * a.itemSize, (i + 1) * a.itemSize))), mid = (p, q) => p.map((arr, j) => arr.map((v, c) => (v + q[j][c]) / 2)), d = (p, q) => Math.hypot(p[pi][0] - q[pi][0], p[pi][1] - q[pi][1], p[pi][2] - q[pi][2]);
    for (let i = 0; i < n; i += 3) tris.push([vtx(i), vtx(i + 1), vtx(i + 2)]);
    while (tris.length) { const t = tris.pop(), e = [d(t[0], t[1]), d(t[1], t[2]), d(t[2], t[0])], m = Math.max(...e); if (m <= L || out.length > 60000) { out.push(t); continue; } const k = e.indexOf(m), a = t[k], b = t[(k + 1) % 3], c = t[(k + 2) % 3], q = mid(a, b); tris.push([a, q, c], [q, b, c]); }
    const ng = new THREE.BufferGeometry(); names.forEach((nm, j) => { const s = A[j].itemSize, arr = new Float32Array(out.length * 3 * s); let o = 0; for (const t of out) for (const v of t) { arr.set(v[j], o); o += s; } ng.setAttribute(nm, new THREE.BufferAttribute(arr, s)); }); return ng; }
  // R.house や R.tree をゆがめる。高さ（0〜1）にそって、かたむき・ねじれ・ふくらみ・すぼまり・波うち
  function warp(obj, o = {}) { const g0 = R.merge([obj]), out = new THREE.Group(), box = new THREE.Box3().setFromObject(g0), h = o.h || Math.max(.1, box.max.y), sd = o.seed || 0, step = o.step || .7;
    const lean = o.lean || [0, 0], tw = o.twist || 0, bu = o.bulge || 0, pinch = o.pinch || 0, wave = o.wave || 0, sy = o.sy || 1, v = new THREE.Vector3();
    const f = (x, y, z) => { const t = cl(y / h, 0, 1.4), s = (1 + bu * Math.sin(PI * Math.min(t, 1))) * (1 - pinch * t), a = tw * t, ca = Math.cos(a), sa = Math.sin(a), X = x * s, Z = z * s;
      return [X * ca - Z * sa + lean[0] * h * t * t + wave * Math.sin(t * PI * 2 + sd) * h * .06, y * sy, X * sa + Z * ca + lean[1] * h * t * t + wave * Math.cos(t * PI * 1.6 + sd * 2) * h * .04]; };
    g0.traverse(m => { if (!m.isMesh) return; const g = subdiv(m.geometry, step), P = g.attributes.position; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const q = f(v.x, v.y, v.z); P.setXYZ(i, q[0], q[1], q[2]); } g.computeVertexNormals();
      const me = new THREE.Mesh(g, m.material); me.castShadow = m.castShadow; me.receiveShadow = true; out.add(me); });
    out.userData = { ...obj.userData, top: f(0, h, 0) }; return out; }
  // 曲がった管。pts = [[x, y, z, 半径], …]
  function tube(G, pts, n = 6, o = {}) { const up = new THREE.Vector3(...(o.up || [0, 1, 0])); let v = 0, prevS = null; const rg = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      let s = new THREE.Vector3().crossVectors(t, up); if (s.lengthSq() < 1e-4) s = prevS ? prevS.clone() : new THREE.Vector3(1, 0, 0); s.normalize(); if (prevS && s.dot(prevS) < 0) s.negate(); prevS = s; const u = new THREE.Vector3().crossVectors(s, t).normalize();
      if (i) v += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]) / (o.m || 1); return { p, s, u, v }; });
    const q = (r, k) => { const a = k / n * TAU, c = Math.cos(a), s = Math.sin(a), rr = r.p[3]; return [r.p[0] + (c * r.s.x + s * r.u.x) * rr, r.p[1] + (c * r.s.y + s * r.u.y) * rr, r.p[2] + (c * r.s.z + s * r.u.z) * rr]; }, ur = o.ur || 1;
    for (let i = 0; i < rg.length - 1; i++) for (let k = 0; k < n; k++) G.quad(q(rg[i], k), q(rg[i], k + 1), q(rg[i + 1], k + 1), q(rg[i + 1], k), [k / n * ur, rg[i].v, (k + 1) / n * ur, rg[i + 1].v]);
    return G; }
  // 円盤（上向き）。uv は世界の大きさで m ごとにくり返す
  const disc = (G, r, y, n = 16, m = 3, cx = 0, cz = 0) => { for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, p0 = [cx + Math.cos(a0) * r, y, cz - Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, y, cz - Math.sin(a1) * r];
    G.tri([cx, y, cz], p0, p1, [cx / m, -cz / m], [p0[0] / m, -p0[2] / m], [p1[0] / m, -p1[2] / m]); } return G; };

  // ================= 形 =================
  function lollipop(o = {}) { const h = o.h || 4, r = o.r || 1.2, B = parts(), sd = o.seed || 0;
    B.g(X.candy({ c: '#f4ece4', c2: '#fffaf4', thin: false })).smooth(1).loft(5, [[0, .09, .09, 0, .8], [h - r * .5, .07, .07, h, 1]], {});
    B.g(X.swirl({ cs: o.cs })).at(TR(0, h, -.12, 0, PI / 2)).loft(16, [[0, r, r, 0, 1], [.24, r, r, .2, 1]], { cap: 'both', capRect: true, rot: 0 }).at(null);
    const g = B.group(); g.userData.top = h + r; return g; }
  function caneLamp(o = {}) { const h = o.h || 3.6, B = parts(), G = B.g(X.candy({ c: o.c || '#e23a4e' })).smooth(1), pts = [];
    for (let i = 0; i <= 6; i++) pts.push([0, i / 6 * h, 0, .1]); for (let i = 1; i <= 8; i++) { const a = i / 8 * PI; pts.push([(1 - Math.cos(a)) * .45, h + Math.sin(a) * .45, 0, .1]); }
    tube(G, pts, 6, { m: .5, ur: 1 }); B.g(X.candy({ c: o.c || '#e23a4e' })).loft(6, [[0, .2, .2, 0, .8], [.25, .16, .16, .3, 1]], { cap: 'top' });
    const lx = .9, ly = h - .5, jel = R.mat(X.jelly({ c: o.lc || '#ffd060' }), { vc: true, glow: true, smooth: true }); B.g(jel).loft(8, [[ly - .3, .05, .05, 0, 1], [ly - .2, .22, .22, .2, 1], [ly, .3, .3, .5, 1], [ly + .2, .2, .2, .8, 1], [ly + .3, .04, .04, 1, 1]], { cap: 'both', rot: 0 }).at(null);
    const tg = B.g(X.candy({ c: o.c || '#e23a4e' })); tg.loft(4, [[ly + .3, .02, .02, 0, 1], [h - .05, .02, .02, .5, 1]].map(r => [r[0], r[1], r[2], r[3], r[4], lx, 0]));
    const g = B.group(); if (o.light) { const L = new THREE.PointLight(o.lc || '#ffd060', o.power ?? 6, o.range ?? 7, 1.6); L.position.set(lx, ly, 0); L.userData.dyn = true; g.add(L); } g.userData.lamp = [lx, ly, 0]; return g; }
  function cookie(o = {}) { const r = o.r || 3, th = o.th || r * .18, B = parts();
    B.g(X.cookieEdge({ c: o.c })).at(TR(0, 0, 0, 0, PI / 2)).loft(16, [[-th / 2, r * .97, r * .97, 0, .85], [-th * .3, r, r, .25, 1], [th * .3, r, r, .75, 1], [th / 2, r * .97, r * .97, 1, .9]], { ur: Math.max(2, Math.round(TAU * r / 2)) }).at(null);
    B.g(X.cookie({ c: o.c, seed: o.seed })).at(TR(0, 0, 0, 0, PI / 2)).loft(16, [[th / 2, r * .97, r * .97, 0, 1]], { cap: 'top', capRect: true }).loft(16, [[-th / 2, r * .97, r * .97, 0, .9]], { cap: 'bot', capRect: true }).at(null);
    return B.group(); }
  function gumdrop(o = {}) { const r = o.r || .8, G = geo().smooth(1); G.loft(8, [[0, r, r, 0, .75], [r * .5, r * .94, r * .94, .4, .95], [r * .9, r * .62, r * .62, .8, 1.05], [r * 1.1, r * .24, r * .24, 1, 1.1]], { cap: 'top', ur: 2 }); return G.mesh(X.jelly({ c: o.c })); }
  function cake(o = {}) { const tiers = o.tiers || [[30, 14], [22, 12], [14, 10]], B = parts(), sd = o.seed || 0; let y = 0; const flames = [];
    tiers.forEach(([r, h], i) => { const ur = Math.max(2, Math.round(TAU * r / (h * 1.1))); B.g(X.cake({ cream: o.cream, sponge: o.sponge, jam: o.jam, seed: sd + i })).loft(20, [[y, r, r, 0, .85], [y + h, r, r, 1, 1.05]], { ur });
      B.g(X.cream({ c: o.cream, seed: sd + i })).loft(20, [[y + h, r, r, 0, 1.05], [y + h + r * .03, r * .96, r * .96, .05, 1.1]], { ur }); disc(B.g(X.cream({ c: o.cream, seed: sd + i })), r * .96, y + h + r * .03, 20, Math.max(3, r / 4));
      if (o.berries !== false) { const nB = Math.max(6, Math.round(r * .5)), Bg = B.g(X.jelly({ c: '#e02a40' })).smooth(2); for (let k = 0; k < nB; k++) { const a = k / nB * TAU + i, bx = Math.cos(a) * r * .86, bz = Math.sin(a) * r * .86, s = Math.max(.6, r * .07), y0 = y + h + r * .03;
        Bg.loft(6, [[y0, s * .7, s * .7, 0, .8, bx, bz], [y0 + s * .7, s * .8, s * .8, .5, 1, bx, bz], [y0 + s * 1.6, .05, .05, 1, 1.1, bx, bz]], { cap: 'top' });
        B.g(X.cream({ c: o.cream, sp: false })).loft(6, [[y0, s * .9, s * .9, 0, 1, bx + Math.cos(a + PI / nB) * s * 1.4, bz + Math.sin(a + PI / nB) * s * 1.4], [y0 + s * .8, s * .5, s * .5, .4, 1.05, bx + Math.cos(a + PI / nB) * s * 1.4, bz + Math.sin(a + PI / nB) * s * 1.4], [y0 + s * 1.5, .05, .05, 1, 1.1, bx + Math.cos(a + PI / nB) * s * 1.4, bz + Math.sin(a + PI / nB) * s * 1.4]], { cap: 'top', rot: .2 }); } }
      y += h + r * .03; });
    if (o.candles) { const r = tiers[tiers.length - 1][0], n = o.candles; for (let k = 0; k < n; k++) { const a = k / n * TAU + .3, cx = Math.cos(a) * r * .5, cz = Math.sin(a) * r * .5, ch = r * .5, cr = r * .06; B.g(X.candy({ c: ['#5ac0e0', '#f05a7a', '#f8d050'][k % 3], w: 12 })).loft(6, [[y, cr, cr, 0, .9, cx, cz], [y + ch, cr, cr, ch / cr / 3, 1, cx, cz]], { cap: 'top', ur: 1 }); flames.push([cx, y + ch + cr * 1.6, cz, cr]); } }
    const g = B.group(); for (const [x, fy, z, cr] of flames) { const f = new THREE.Mesh(new THREE.OctahedronGeometry(cr * 1.3, 0), new THREE.MeshBasicMaterial({ color: '#ffd870', fog: false })); f.scale.set(.7, 1.6, .7); f.position.set(x, fy, z); f.userData.dyn = true; g.add(f); }
    g.userData.top = y; g.userData.flames = g.children.filter(c => c.userData.dyn); ticks.push(t => g.userData.flames.forEach((f, i) => { f.scale.y = 1.6 + Math.sin(t * 9 + i * 2) * .25; })); return g; }
  function balloon(o = {}) { const r = o.r || .5, len = o.len || 2.2, g = new THREE.Group(), body = new THREE.Group(), B = parts(), sd = o.seed || 0;
    B.g(X.balloonSkin({ c: o.c, c2: o.c2 })).smooth(1).loft(10, [[len, .04, .04, 0, .8], [len + r * .25, r * .45, r * .45, .1, .85], [len + r * .9, r * .92, r * .92, .4, 1], [len + r * 1.55, r, r, .7, 1.05], [len + r * 2.1, r * .7, r * .7, .9, 1.1], [len + r * 2.3, .04, .04, 1, 1.1]], { cap: 'top', ur: 2 });
    B.g(X.balloonSkin({ c: o.c })).loft(5, [[len - .08, .05, .05, 0, .8], [len + .02, .07, .07, 1, 1]], {});
    const Gs = B.g(R.mat('#f4f0e8', { vc: true, side: true })); for (let i = 0; i < 6; i++) { const y0 = i / 6 * len, y1 = (i + 1) / 6 * len, x0 = Math.sin(i * 1.3) * .06, x1 = Math.sin((i + 1) * 1.3) * .06; Gs.quad([x0 - .012, y0, 0], [x0 + .012, y0, 0], [x1 + .012, y1, 0], [x1 - .012, y1, 0]); }
    body.add(B.group()); g.add(body); body.userData.dyn = true; g.userData.tick = t => { body.rotation.z = Math.sin(t * 1.1 + sd) * .12; body.rotation.x = Math.cos(t * .9 + sd * 2) * .08; }; ticks.push(g.userData.tick); return g; }

  const tick = t => { for (const f of ticks) f(t); };
  return { tex: X, subdiv, warp, tube, disc, lollipop, caneLamp, cookie, gumdrop, cake, balloon, tick, GLY, glyph };
};
