// 第 12 集「上と下の鉄の都市」（21〜25）の部品。../game-looks-7/kit.js・retro.js・../game-looks-8/pack-city.js のあとに読み、
//   const C = PACK_CITY(THREE, K, R), U = PACK_UNDER1(THREE, K, R, C);   として使う。
// 下の町（さびた鉄・つぎはぎ・屋台）は pack-city.js（C.）にまかせ、ここには「手のとどかない上の都市」の物を置く：
//   白い大理石と金のかざり、光る窓の塔、その都市をのせる巨大な台（下から見ると、配管のたれた鉄の裏）、大理石の手すりと柱。
//
// ■ テクスチャ  U.tex.名前({ c, seed, m, … }) → THREE.Texture（同じ引数なら同じ物）
//   marble { c, vein }（大理石の切り石。うすい青ねずの石目）   flute { c }（たてに みぞの入った柱）   facade { c, lit, win, gold }（塔のかべ：アーチ窓 2 つ × 2 階と、金の帯）
//   gold { c, kind: 'plain'/'band' }（金。ななめの照り。band は輪の かざり帯）   under { c, lamps }（台の裏：鉄板・太いはり・小さなあかり）
//   rim { c }（台のふち：下が鉄、上が大理石と金の帯）   rail { c }（大理石の手すり。抜き）   tile { c, c2 }（白と金の しき石）
//
// ■ 形（足もとが y=0、正面が +z、大きさは m）
//   U.tower({ h: 40, r: 4, seed, cap: 'spire'/'dome'/'needle'/'crown', tiers: 3, glow（光に関係なく光らせる色。夜の冷たい白）, emissive }) → Group   白い塔（だんだんに細る 8 角の胴、金の帯、金の屋根）
//   U.plate({ r: 60, th: 6, n: 24, c, cone: 2.4（裏の深さ ÷ th）, pipes: 12, lamps: true, emissive, top: true }) → Group   丸い巨大な台（上の面が y=0。裏は鉄の さかさの円すい、ふちは大理石と金）
//   U.city({ r: 50, n: 14, seed, hmin: 20, hmax: 70, glow, emissive, plate: { … } }) → Group   台と、その上の塔の群れ（遠景用。userData.top ＝ 台の上の面の高さ 0）
//   U.slab({ w: 120, d: 60, th: 4, cell: 8, edge: 'f'（ふちを見せる面。'f' は +z）, c, emissive, glow（光に関係なく この色で見せる。下から見上げる裏を くっきり） }) → Group   四角い巨大な台（頭の上をおおう。下の面が y=0）
//   U.column({ h: 6, r: .45 })   大理石の柱（金の柱頭）   U.balustrade({ len: 10, h: 1.1 })   大理石の手すり（x の向き）
//   U.facet(物, [光の向き], 暗い面の明るさ)   glow の面に向きで明暗をつける（U.tower は glow のとき自動。light で向き）
//   U.lights(pts, { c, r }) → Group   光の点（スプライト）の群れ。userData.pts を動かして使う（柱を登るあかり など）
window.PACK_UNDER1 = (THREE, K, R, C) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, U = {}, tx = {}, cache = new Map();
  const def = (name, m, fn, cut = false) => { tx[name] = (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) cache.set(k, t = T.from(fn(o), { m: o.m || m, cut })); return t; }; };
  const gg = (B, t, o) => B.g(t, o).at(null).tint(1).rect(0, 0, 1, 1).smooth(0).normal(null);
  U.tex = tx;
  const GOLD = '#d8a032';

  // ================= テクスチャ =================
  // 大理石の切り石（32×16 ドットの石を段ちがいに。1 枚 3 m）。石ごとに白さがちがい、うすい石目が ななめに走る
  def('marble', 3, (o = {}) => { const P = Px(64), M = ramp(o.c || '#ece4d4', 6, { contrast: .5 }), V = ramp(o.vein || '#98a0bc', 6, { contrast: .7 }), sd = o.seed || 0;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { const x0 = i * 32 - (j & 1 ? 16 : 0), t = hash(i, j, sd) > .55 ? 4 : 3; P.block(x0, j * 16, 32, 16, M, t, { hi: 1, lo: 2 });
      for (let y = 1; y < 15; y++) for (let x = 1; x < 31; x++) { const X = x0 + x, Y = j * 16 + y, n = tn(X, Y, 16, 8, 64, 64, sd + 3); if (n > .7) P.set(X, Y, tone(M, t + 1)); else if (n < .28 && ((X + Y) & 1)) P.set(X, Y, tone(M, t - 1)); } }
    for (let k = 0; k < 4; k++) { let x = hash(k, 1, sd) * 64; const y0 = Math.floor(hash(k, 2, sd) * 64), len = 14 + Math.floor(hash(k, 3, sd) * 26), dx = hash(k, 4, sd) > .5 ? .6 : -.6;
      for (let q = 0; q < len; q++) { x += dx + Math.sin(q * .5 + k) * .7; P.set(x, y0 + q, q % 5 === 2 ? V[3] : V[4]); if (q % 3 === 0) P.set(x + 1, y0 + q, M[3]); } }
    return P; });
  // たてに みぞの入った柱（64 ドットで 1 周 8 本のみぞ）
  def('flute', 2, (o = {}) => { const P = Px(64), M = ramp(o.c || '#eee6d6', 6, { contrast: .6 }), sd = o.seed || 0;
    P.each((x, y) => { const r = x % 8, t = r === 0 ? 1 : r === 1 ? 2 : r === 7 ? 5 : r < 4 ? 3 : 4; return tone(M, tn(x, y, 8, 16, 64, 64, sd) > .72 ? t - 1 : t); }); return P; });
  // 塔のかべ（64 ドット＝6 m。アーチ窓 2 つ × 2 階、階ごとに白と金の帯、窓のあいだに付け柱）
  def('facade', 6, (o = {}) => { const P = Px(64), M = ramp(o.c || '#f0e8d8', 6, { contrast: .55 }), G = ramp(o.gold || GOLD), W = o.lit ? ramp(o.win || '#ffe6a8', 6, { contrast: .5 }) : ramp(o.win || '#7684a8', 6, { contrast: .8 }), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 16, 16, 64, 64, sd); return n > .66 ? M[4] : n < .3 && ((x + y) & 1) ? M[2] : M[3]; });
    for (let f = 0; f < 2; f++) { const y0 = f * 32;
      P.rect(0, y0, 64, 1, M[5]); P.rect(0, y0 + 1, 64, 1, G[4]); P.rect(0, y0 + 2, 64, 1, G[2]); P.rect(0, y0 + 3, 64, 1, M[1]); for (let x = 1; x < 64; x += 4) P.set(x, y0 + 1, G[5]);
      for (const px of [0, 31]) { P.rect(px, y0 + 4, 3, 28, M[4]); P.rect(px + 2, y0 + 4, 1, 28, M[2]); P.rect(px + 3, y0 + 4, 1, 28, M[1]); }
      for (let c = 0; c < 2; c++) { const cx = c * 32 + 17, wx = cx - 5, wy = y0 + 9, ww = 10, wh = 17;
        for (let yy = -2; yy < wh + 2; yy++) for (let xx = -2; xx < ww + 2; xx++) { const ax = xx - ww / 2 + .5, ay = yy - 5; if (ay < 0 && ax * ax + ay * ay > 36) continue; P.set(wx + xx, wy + yy, xx < 0 || yy < 0 ? M[5] : M[1]); }
        for (let yy = 0; yy < wh; yy++) for (let xx = 0; xx < ww; xx++) { const ax = xx - ww / 2 + .5, ay = yy - 5; if (ay < 0 && ax * ax + ay * ay > 20) continue;
          let t = o.lit ? (yy < 6 ? 5 : yy < 11 ? 4 : 3) : (yy < 4 ? 4 : ((xx + yy) % 7 === 0 ? 4 : 2)); if (xx === 4 || xx === 5) t = -1; if (yy === 10) t = -1;
          P.set(wx + xx, wy + yy, t < 0 ? M[o.lit ? 2 : 4] : W[t]); }
        P.rect(cx - 1, wy - 3, 3, 2, G[4]); P.set(cx, wy - 3, G[5]); P.rect(wx - 3, wy + wh + 1, ww + 6, 1, M[5]); P.rect(wx - 3, wy + wh + 2, ww + 6, 1, M[1]); } }
    return P; });
  // 金。ななめの照りと、うすい打ち出しの模様。band は上下のふちと 輪のかざり
  def('gold', 1.5, (o = {}) => { const P = Px(32), G = ramp(o.c || GOLD, 6, { contrast: 1.05 }), sd = o.seed || 0;
    P.each((x, y) => { const s = (x + y * .5 + 64) % 16; return s < 1.5 ? G[5] : s < 3.5 ? G[4] : tn(x, y, 8, 8, 32, 32, sd) > .62 ? G[3] : (x + y) % 9 === 0 ? G[1] : G[2]; });
    if (o.kind === 'band') { P.rect(0, 0, 32, 2, G[5]); P.rect(0, 2, 32, 1, G[1]); P.rect(0, 29, 32, 1, G[4]); P.rect(0, 30, 32, 2, G[0]);
      for (const cx of [8, 24]) { P.disc(cx, 16, 7, G[1]); P.disc(cx, 16, 6, G[4]); P.disc(cx - .5, 15.5, 4, G[3]); P.disc(cx, 16, 2, G[1]); P.set(cx - 3, 12, G[5]); P.set(cx - 2, 11, G[5]); } for (let y = 6; y < 26; y++) { P.set(16, y, G[1]); P.set(0, y, G[1]); } }
    return P; });
  // 台の裏：鉄板とリベット（pack-city の plate）に、太い十字のはりと、点々の小さなあかり
  def('under', 8, (o = {}) => { const c = o.c || '#4e4e6c', P = C.paint.plate({ c, n: 2, rust: .6, seed: o.seed || 0 }), M = ramp(c, 6, { contrast: .85 }), Lc = o.lamp || '#ffd890', sd = o.seed || 0;
    for (let k = 0; k < 64; k++) for (const [q, t] of [[29, 1], [30, 4], [31, 3], [32, 2], [33, 1], [34, 0]]) { P.set(k, q, M[t]); P.set(q, k, M[t]); }
    for (let k = 2; k < 64; k += 6) { P.set(k, 31, M[5]); P.set(31, k, M[5]); }
    if (o.lamps !== false) for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (hash(i, j, sd + 4) < .35) { const x = i * 16 + 6, y = j * 16 + 7; P.rect(x, y, 2, 1, Lc); P.set(x, y + 1, mix(Lc, M[1], .5)); P.set(x + 1, y + 1, mix(Lc, M[1], .5)); }
    return P; });
  // 台のふち（64×64＝6 m。下の 2/5 が さびた鉄、まん中に金の帯、上が大理石の石がき）
  def('rim', 6, (o = {}) => { const P = Px(64), M = ramp(o.c || '#ece4d4', 6, { contrast: .5 }), I = ramp('#545470', 6, { contrast: .85 }), G = ramp(GOLD), Ru = ramp('#a85a30'), sd = o.seed || 0;
    P.each((x, y) => { if (y >= 38) { const r = (x + 2) % 16, t = r === 0 ? 1 : r === 1 ? 4 : 3, drip = hash(x >> 1, 3, sd) < .3 && y < 38 + hash(x >> 1, 4, sd) * 22; return drip ? tone(Ru, 2 + ((x + y) & 1)) : tone(I, tn(x, y, 8, 8, 64, 64, sd) > .68 ? t - 1 : t); }
      if (y >= 30) return y === 30 ? G[5] : y === 37 ? G[0] : (x % 8 === 3 && y > 31 && y < 36) ? G[1] : (y === 31 ? G[4] : G[3]);
      const row = Math.floor(y / 10), xx = (x + (row & 1) * 11) % 22, yy = y % 10; return yy === 9 || xx === 21 ? M[1] : yy === 0 || xx === 0 ? M[5] : tn(x, y, 8, 8, 64, 64, sd + row) > .7 ? M[4] : M[3]; });
    for (let x = 0; x < 64; x++) if (hash(x >> 2, 9, sd) < .4) P.set(x, 38, Ru[1]); return P; });
  // 大理石の手すり（32×32＝1.5 m、抜き）。上の かさ木、つぼの形の小柱 4 本、下の台
  def('rail', 1.5, (o = {}) => { const P = Px(32), M = ramp(o.c || '#eee6d6', 6, { contrast: .6 }), G = ramp(GOLD); P.clip = true;
    for (let x = 0; x < 32; x++) { P.set(x, 2, M[5]); P.set(x, 3, M[4]); P.set(x, 4, M[4]); P.set(x, 5, M[3]); P.set(x, 6, M[1]); P.set(x, 26, M[5]); for (let y = 27; y < 31; y++) P.set(x, y, M[3]); P.set(x, 31, M[1]); if (x % 8 === 4) P.set(x, 4, G[4]); }
    for (let k = 0; k < 4; k++) { const cx = k * 8 + 4; for (let y = 7; y < 26; y++) { const u = (y - 7) / 19, w = Math.round(1.2 + Math.sin(u * PI * .95 + .1) * 1.8 - (u < .15 ? .0 : 0)); for (let i = -w; i <= w; i++) P.set(cx + i, y, i === -w ? M[5] : i === w ? M[1] : i > 0 ? M[2] : M[4]); } P.rect(cx - 2, 7, 5, 1, M[4]); P.rect(cx - 2, 25, 5, 1, M[2]); }
    return P; }, true);
  // 白と金の しき石（大通り。1 枚 3 m）
  def('tile', 3, (o = {}) => { const P = Px(64), M = ramp(o.c || '#ebe3d2', 6, { contrast: .5 }), M2 = ramp(o.c2 || '#c8c0b8', 6, { contrast: .55 }), G = ramp(GOLD), sd = o.seed || 0;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const odd = (i + j) & 1, R0 = odd ? M2 : M, t = 3 + (hash(i, j, sd) > .6 ? 1 : 0); P.block(i * 16, j * 16, 16, 16, R0, t, { lo: 2 });
      for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) if (tn(i * 16 + x, j * 16 + y, 8, 8, 64, 64, sd + 1) > .72) P.set(i * 16 + x, j * 16 + y, tone(R0, t + 1)); }
    for (let k = 0; k < 64; k++) { P.set(k, 0, G[3]); P.set(0, k, G[3]); P.set(k, 32, G[2]); P.set(32, k, G[2]); }
    for (const [x, y] of [[0, 0], [32, 0], [0, 32], [32, 32]]) { P.disc(x + .5, y + .5, 2.6, G[2]); P.set(x, y, G[5]); P.set(x - 1, y - 1, G[4]); }
    return P; });
  const haloT = (() => { let t = null; return () => { if (t) return t; const P = Px(16); P.clip = true; P.each((x, y) => { const d = Math.hypot(x - 7.5, y - 7.5); return d < 2.5 ? '#ffffff' : d < 4.5 ? '#c8c8c8' : d < 7 && ((x + y) & 1) ? '#707070' : null; }); return t = T.from(P, { cut: false }); }; })();

  // 光に関係なく光る材質（glow）の面に、向きで明るさの差をつける（遠くの白い塔が、のっぺりした かげ絵にならないように）
  const facet = (g, L = [-.55, .35, .75], lo = .62) => { const l = new THREE.Vector3(...L).normalize(), n = new THREE.Vector3();
    g.traverse(m => { if (!m.isMesh || !m.material.isMeshBasicMaterial || m.material.blending === THREE.AdditiveBlending) return; const a = m.geometry.attributes; if (!a.color || !a.normal) return;
      for (let i = 0; i < a.count; i++) { n.fromBufferAttribute(a.normal, i); const k = lo + (1 - lo) * Math.max(0, n.dot(l)) + (n.y > .5 ? .1 : 0); a.setXYZ(i, a.getX(i) * k, a.getY(i) * k, a.getZ(i) * k); } a.color.needsUpdate = true; }); return g; };
  U.facet = facet;

  // ================= 形 =================
  const mo = o => o.glow ? { glow: true, color: o.glow } : o.emissive ? { emissive: o.emissive } : {};
  // 白い塔。だんだんに細る 8 角の胴（tiers 段）、段ごとに金の帯、金の屋根。窓の絵は facade
  U.tower = (o = {}) => { const h = o.h || 40, r = o.r || 4, sd = o.seed || 0, tiers = o.tiers || 3, B = R.parts(), lit = !!o.glow, F = gg(B, tx.facade({ lit, seed: sd % 3, win: o.win }), mo(o)), Gd = gg(B, tx.gold({ seed: sd % 2 }), o.glow ? { glow: true, color: mix(o.glow, '#ffd890', .5) } : mo(o)), Gb = gg(B, tx.gold({ kind: 'band' }), o.glow ? { glow: true, color: o.glow } : mo(o)), Mb = gg(B, tx.marble({ seed: sd % 3 }), mo(o));
    const body = h * (o.cap === 'needle' ? .7 : .78); let y = 0, rr = r;
    Mb.loft(8, [[0, rr * 1.25, rr * 1.25, 0, .85], [h * .03, rr * 1.2, rr * 1.2, h * .03 / 3, 1]], { cap: 'top', ur: Math.max(2, Math.round(r * 2)) });
    for (let k = 0; k < tiers; k++) { const th = body / tiers * (k === 0 ? 1.25 : k === tiers - 1 ? .8 : .95), r1 = rr * (.92 - hash(sd, k) * .05), ur = Math.max(1, Math.round(2 * PI * rr / 6 / 2)) * 2;
      F.loft(8, [[y, rr, rr, y / 6, .9], [y + th, r1, r1, (y + th) / 6, 1.05]], { ur });
      Gb.loft(8, [[y + th, r1 * 1.08, r1 * 1.08, 0, 1], [y + th + Math.max(.6, r * .2), r1 * 1.08, r1 * 1.08, 1, 1.1]], { cap: 'top', ur: ur * 2 });
      y += th + Math.max(.6, r * .2); rr = r1 * (.8 - hash(sd, k, 2) * .06); }
    const cap = o.cap || ['spire', 'dome', 'needle', 'crown'][sd % 4], top = h - y;
    if (cap === 'dome') Gd.smooth(1).loft(12, [[y, rr * 1.05, rr * 1.05, 0], [y + top * .22, rr * 1.12, rr * 1.12, .3], [y + top * .42, rr * .9, rr * .9, .6], [y + top * .55, rr * .5, rr * .5, .8], [y + top * .62, rr * .14, rr * .14, .9], [y + top, .05, .05, 1]], { cap: 'top', ur: 4 });
    else if (cap === 'crown') { Gd.loft(8, [[y, rr, rr, 0], [y + top * .25, rr * 1.15, rr * 1.15, .4]], { cap: 'top', ur: 4 }); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; Gd.loft(4, [[y + top * .25, rr * .18, rr * .18, 0, 1, Math.sin(a) * rr * .95, Math.cos(a) * rr * .95], [y + top * .5, .03, .03, 1, 1.1, Math.sin(a) * rr * .95, Math.cos(a) * rr * .95]], {}); } Gd.loft(8, [[y + top * .25, rr * .5, rr * .5, 0], [y + top, .04, .04, 1]], { ur: 2 }); }
    else Gd.loft(8, [[y, rr * 1.02, rr * 1.02, 0], [y + top * (cap === 'needle' ? .1 : .35), rr * (cap === 'needle' ? .6 : .55), rr * (cap === 'needle' ? .6 : .55), .5], [y + top, .04, .04, 1]], { ur: 3 });
    const g = B.group(); if (o.glow) facet(g, o.light); g.userData.top = h; return g; };

  // 丸い巨大な台。上の面が y=0。裏はさかさの円すい（鉄板とはり）、ふちは大理石と金。裏から配管と あかりが たれる
  U.plate = (o = {}) => { const r = o.r || 60, th = o.th || 6, n = o.n || 24, cone = o.cone ?? 2.4, B = R.parts(), em = mo(o), Ut = tx.under({ c: o.c, seed: o.seed }), Ug = gg(B, Ut, em), Rm = gg(B, tx.rim({ seed: o.seed }), o.rimGlow ? { glow: true, color: o.rimGlow } : em), sd = o.seed || 0;
    const per = 2 * PI * r, ur = Math.max(2, Math.round(per / 8 / 4)) * 4;
    Ug.loft(n, [[-th * cone, r * .12, r * .12, 0, .7], [-th * cone * .7, r * .45, r * .45, 4, .8], [-th * 1.15, r * .86, r * .86, 7, .9], [-th * .75, r * .985, r * .985, 8, 1]], { cap: 'bot', ur, rot: 0 });
    Rm.loft(n, [[-th * .75, r, r, 0, .85], [0, r, r, 1, 1.05]], { ur: Math.max(4, Math.round(per / 6)) });
    if (o.top !== false) gg(B, tx.tile({}), em).loft(n, [[0, r, r, 0], [0, r, r, 0]], { cap: 'top', capUV: [.5, .5], ur: 1 });
    const g = B.group();
    if (o.pipes ?? 12) { const PB = []; for (let k = 0; k < (o.pipes ?? 12); k++) { const a = hash(k, 1, sd) * PI * 2, d = r * (.3 + hash(k, 2, sd) * .55), x = Math.sin(a) * d, z = Math.cos(a) * d, y0 = -th * cone * (1 - d / r) * .95 - th * .3, len = th * (.6 + hash(k, 3, sd) * 2.2);
        PB.push(C.pipe([[x, y0 + 1, z], [x, y0 - len, z]], .25 + hash(k, 4, sd) * r * .012, { c: ['#6e7890', '#a85a30', '#5a5e78'][k % 3], joint: 4 })); } g.add(R.merge(PB)); }
    if (o.lamps !== false) { const pts = []; for (let k = 0; k < n * 2; k++) { const a = (k + .5) / (n * 2) * PI * 2; pts.push([Math.sin(a) * r * 1.01, -th * .55, Math.cos(a) * r * 1.01]); } g.add(U.lights(pts, { c: o.lampC || '#fff0c8', r: o.lampR || Math.max(.5, r * .012) })); }
    g.userData.th = th; return g; };

  // 台と、その上の塔の群れ（遠景用）。まん中ほど高い塔。台の上の面が y=0
  U.city = (o = {}) => { const r = o.r || 50, n = o.n || 14, sd = o.seed || 0, g = new THREE.Group(), hmin = o.hmin || 20, hmax = o.hmax || 70, list = [];
    g.add(U.plate({ r, th: r * .12, seed: sd, emissive: o.emissive, ...(o.plate || {}) }));
    for (let k = 0; k < n; k++) { const a = hash(k, 1, sd) * PI * 2, d = k === 0 ? 0 : r * (.15 + hash(k, 2, sd) * .7), c = 1 - d / r, h = hmin + (hmax - hmin) * (k === 0 ? 1 : c * (.5 + hash(k, 3, sd) * .6)), t = U.tower({ h, r: h * (.07 + hash(k, 4, sd) * .03), seed: sd + k, glow: o.glow, light: o.light, emissive: o.emissive, tiers: h > hmax * .6 ? 3 : 2 });
      t.position.set(Math.sin(a) * d, 0, Math.cos(a) * d); list.push(t); }
    // 低い白い建物の帯（ふちの近く）
    const B = R.parts(), F = gg(B, tx.facade({ lit: !!o.glow, seed: sd % 3 }), mo(o)), Gb = gg(B, tx.gold({ kind: 'band' }), mo(o));
    for (let k = 0; k < (o.low ?? 18); k++) { const a = (k + hash(k, 7, sd) * .5) / (o.low ?? 18) * PI * 2, d = r * (.78 + hash(k, 8, sd) * .1), w = r * (.09 + hash(k, 9, sd) * .06), hh = r * (.08 + hash(k, 10, sd) * .1);
      F.at(TR(Math.sin(a) * d, 0, Math.cos(a) * d, a)).box(w, hh, w * .8, 0, 0, 0, { m: 6 }); Gb.at(TR(Math.sin(a) * d, 0, Math.cos(a) * d, a)).box(w * 1.06, w * .08, w * .86, 0, hh, 0, { m: 1.5 }); }
    const low = B.group(); if (o.glow) facet(low, o.light); list.push(low); g.add(R.merge(list)); g.userData.top = 0; return g; };

  // 四角い巨大な台（頭の上をおおう）。下の面が y=0、上の面が y=th。edge に書いた面（'f' 前 +z / 'b' / 'l' / 'r'）は ふちの絵を出す
  U.slab = (o = {}) => { const w = o.w || 120, d = o.d || 60, th = o.th || 4, cell = o.cell || 8, B = R.parts(), em = mo(o), Ug = gg(B, tx.under({ c: o.c, seed: o.seed, lamps: o.lamps }), em), Rm = gg(B, tx.rim({ seed: o.seed }), em), Ip = gg(B, C.tex.plate({ c: mix(o.c || '#4e4e6c', '#000000', .15) }), em), nx = Math.round(w / cell), nz = Math.round(d / cell), r = cell / 8;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x0 = -w / 2 + i * cell, z0 = -d / 2 + j * cell, x1 = x0 + cell, z1 = z0 + cell; if (o.hole && o.hole((x0 + x1) / 2, (z0 + z1) / 2)) continue; Ug.tint(.78 + hash(i, j, o.seed || 0) * .3).quad([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [i * r, j * r, (i + 1) * r, (j + 1) * r]); }
    Ug.tint(1);
    const E = o.edge || 'f', sides = { f: [[-w / 2, d / 2], [w / 2, d / 2]], b: [[w / 2, -d / 2], [-w / 2, -d / 2]], r: [[w / 2, d / 2], [w / 2, -d / 2]], l: [[-w / 2, -d / 2], [-w / 2, d / 2]] };
    for (const k of 'fbrl') { const [a, b] = sides[k], len = Math.hypot(b[0] - a[0], b[1] - a[1]), G = E.includes(k) ? Rm : Ip; for (let s = 0; s < len - .01; s += cell) { const t0 = s / len, t1 = Math.min(len, s + cell) / len, p = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const A = p(t0), Bq = p(t1); G.quad([A[0], 0, A[1]], [Bq[0], 0, Bq[1]], [Bq[0], th, Bq[1]], [A[0], th, A[1]], E.includes(k) ? [s / 6, 0, (s + cell) / 6, th / 6] : [0, 0, cell / 3, th / 3]); } }
    // はり（下の面から さがる太い鉄骨）
    if (o.beams !== false) { Ip.tint(.8); for (let x = -w / 2 + cell * 2; x < w / 2; x += cell * 2) Ip.box(1, 1.4, d, x, -1.4, 0, { m: 3, bottom: true, top: false }); Ip.tint(.7); for (let z = -d / 2 + cell * 2; z < d / 2; z += cell * 3) Ip.box(w, .9, .8, 0, -.9, z, { m: 3, bottom: true, top: false }); Ip.tint(1); }
    const g = B.group(); g.traverse(m => { m.castShadow = false; }); return g; };

  U.column = (o = {}) => { const h = o.h || 6, r = o.r || .45, B = R.parts(), Fl = gg(B, tx.flute({}), mo(o)).smooth(1), Gd = gg(B, tx.gold({}), mo(o)), Mb = gg(B, tx.marble({}), mo(o));
    Mb.box(r * 3, r * .8, r * 3, 0, 0, 0, { m: 3 }); Gd.loft(12, [[r * .8, r * 1.3, r * 1.3, 0], [r * 1.1, r * 1.15, r * 1.15, .3]], { ur: 2 });
    Fl.loft(12, [[r * 1.1, r, r, 0], [h - r * 1.5, r * .9, r * .9, (h - r * 2.6) / 2]], { ur: 1 });
    Gd.loft(12, [[h - r * 1.5, r * .95, r * .95, 0], [h - r * .9, r * 1.35, r * 1.35, .4], [h - r * .6, r * 1.5, r * 1.5, .6]], { ur: 2 }); Mb.box(r * 3.3, r * .6, r * 3.3, 0, h - r * .6, 0, { m: 3 });
    return B.group(); };
  U.balustrade = (o = {}) => { const len = o.len || 10, h = o.h || 1.1, B = R.parts(), Rl = gg(B, tx.rail({}), { side: true, ...mo(o) }), Mb = gg(B, tx.marble({}), mo(o)), Gd = gg(B, tx.gold({}), mo(o));
    Rl.quad([-len / 2, 0, 0], [len / 2, 0, 0], [len / 2, h, 0], [-len / 2, h, 0], [0, 0, len / (h * 1.0), 1]);
    Mb.box(len, .12, .34, 0, h - .04, 0, { m: 3 }); for (let x = -len / 2; x <= len / 2 + .01; x += Math.max(2, len / Math.round(len / 4))) { Mb.box(.4, h + .1, .4, x, 0, 0, { m: 3 }); Gd.at(TR(x, 0, 0)).loft(8, [[h + .06, .14, .14, 0], [h + .22, .12, .12, .5], [h + .34, .02, .02, 1]], {}).at(null); }
    return B.group(); };

  // 光の点の群れ（加算のスプライト 1 つずつ）。動かすときは g.userData.set(i, x, y, z, 明るさ)
  U.lights = (pts, o = {}) => { const g = new THREE.Group(), mat = new THREE.SpriteMaterial({ map: haloT(), color: o.c || '#fff0c8', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: o.fog ?? false, opacity: o.k ?? .9 });
    for (const p of pts) { const s = new THREE.Sprite(mat); s.position.set(...p); s.scale.setScalar((o.r || .5) * 2); g.add(s); }
    g.userData.dyn = true; g.userData.set = (i, x, y, z, s) => { const q = g.children[i]; q.position.set(x, y, z); if (s !== undefined) q.scale.setScalar((o.r || .5) * 2 * s); }; return g; };
  return U; };
