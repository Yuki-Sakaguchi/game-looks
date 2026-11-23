// game-looks-11 の追加の部品「密林と古い遺跡」（36〜40 で使う）。kit.js・retro.js・game-looks-8/pack-fantasy-wild.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), F = PACK_FWILD(THREE, K, R), J = PACK_JUNGLE2(THREE, K, R, F);   として使う。
// ■ 決まり：retro.js と同じ（足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'。1 色から 6 段）。動く物は userData.tick(t, …) を毎コマ呼ぶ。
//
// ■ テクスチャ  J.tex.名前({ c, c2, seed, … })   leaf { holes 0〜1（さけめ）, yellow }（はばの広い葉。抜き。下が付け根）   frond（シダの葉。抜き）
//   petal { c2（付け根の色）, spots }（花びら。抜き）   heart { c2 }（花のまん中。花粉の点）   wing { c2（目玉もようの色）, edge }（ちょうの羽 1 枚。抜き。左はしが体）
//   face { c, moss, look: 'calm'/'open' }（石の顔の正面。64×64）   monkey { c, face }（さるの毛と顔）   ring（波紋。抜き）
// ■ 植物
//   J.tree({ h: 14, r: .5, c（幹）, leaf（葉）, seed, roots: 5（板根）, crown: 3（かさの数）, vines: 5, lean }) → Group   密林の高い木（板根・まがった幹・平たいかさ・たれたつる）。userData.crown = [[x, y, z, r], …]
//   J.fern({ s: 1, c, n: 9, seed }) → Mesh   シダ（弓なりの葉が放射に）   J.bigLeaf({ s: 1, c, n: 5, seed, holes, upright }) → Mesh   大きな葉の草（クワズイモ・バショウのような）
//   J.liana([x,y,z], [x,y,z], { sag: 1.5, r: .06, c, leaf }) → Mesh   2 点のあいだに たれる つる
//   J.flower({ h: 5, r: 1.6, n: 6, c, c2, heart, stem, tilt: .5, kind: 'open'/'cup'/'bell', seed }) → Group   巨大な花（userData.head は花の首。ゆらすときに回す）
// ■ 石の顔   J.stoneFace({ s: 1, c, moss, look, roots: 5, rootC, seed }) → Group   木の根にからまれた巨大な石の顔（高さ 6 m × s）。userData = { h, top: [x,y,z] }
// ■ 生きもの
//   J.monkey({ s: 1, c, face }) と J.monkeyPose(さる, 'sit'/'walk'/'eat'/'hang'/'look', t)   さる（すわって .5 m ほど × s）
//   J.butterfly({ s: 1, c, c2 }) と J.butterflyPose(ちょう, t)   大きなちょう（はね はば .5 m × s）
//   J.eyes({ c: '#ffe060', s: .2, gap: .16, seed }) → Group   暗がりの光る目（ときどき まばたき）。userData.tick(t)
// ■ 水   J.ripples({ n: 40, box: [w, d], y: 0, r: .8, life: 1.4, c, a }) → Mesh   雨の波紋（加算の輪）。userData.tick(t, cx, cz)。userData.emit(x, z) で 1 つ足す（歩く足もと）
window.PACK_JUNGLE2 = (THREE, K, R, F) => {
  const { hash, mix, ramp, tone, tn, Px, geo, parts, TR, mat } = R, T = R.tex, PI = Math.PI, TAU = PI * 2, J = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), tube = F.tube;

  // ================= 1. テクスチャ =================
  const paint = {}, tex = {}, cache = new Map();
  const def = (name, m, fn, cut = false) => { paint[name] = fn; tex[name] = (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) cache.set(k, t = T.from(fn(o), { m: o.m || m, cut, name: 'jungle.' + name })); return t; }; };
  // はばの広い葉（32×64。下が付け根、上が先）。中すじ・横すじ・ふちの光・左右で明るさ・ところどころ黄ばみ・さけめ
  def('leaf', 1, (o = {}) => { const P = Px(32, 64), C = ramp(o.c || '#3f8a44'), Y = ramp(o.yellow || '#a8b040'), sd = o.seed || 0, holes = o.holes || 0; P.clip = true;
    for (let y = 0; y < 64; y++) { const s = (63 - y) / 63, hw = 15 * Math.pow(Math.sin(PI * Math.min(1, s * 1.02)), .75) * (s < .12 ? .6 + s * 3.3 : 1);
      for (let x = 0; x < 32; x++) { const dx = x - 15.5, ad = Math.abs(dx); if (ad > hw) continue;
        const slit = holes && ad > 3 && hash(Math.floor((y + ad * .55) / 5), dx > 0 ? 1 : 2, sd) < holes && (y + Math.floor(ad * .55)) % 5 === 0; if (slit) continue;
        let c = tone(C, dx < 0 ? 3 : 2); if (ad > hw - 1.2) c = dx < 0 ? C[4] : C[1]; else if ((y + Math.floor(ad * .6)) % 6 === 0 && ad > 1.5) c = dx < 0 ? C[2] : C[1];
        if (tn(x, y, 6, 10, 32, 64, sd + 3) > .78 && ad > 2) c = tone(Y, dx < 0 ? 3 : 2); if (ad < 1) c = C[5]; else if (ad < 1.6) c = C[4]; P.set(x, y, c); } }
    return P; }, true);
  // シダの葉（32×64）。まん中の軸から、小さな葉が左右へ ななめに出る。先ほど短い
  def('frond', 1, (o = {}) => { const P = Px(32, 64), C = ramp(o.c || '#4a9a48'), sd = o.seed || 0; P.clip = true;
    for (let y = 2; y < 64; y++) { const s = (63 - y) / 63, L = 14.5 * Math.sin(PI * Math.min(1, .08 + s * .95)) ** .6; if (y % 4 < 3) for (let side = -1; side <= 1; side += 2) for (let k = 1; k <= L; k++) { const yy = y - Math.floor(k * .45) + (y % 4 === 2 ? 1 : 0); P.set(15.5 + side * k, yy, y % 4 === 0 ? C[4] : k > L - 1.5 ? C[1] : tone(C, side < 0 ? 3 : 2)); } P.set(15, y, C[1]); P.set(16, y, C[2]); }
    return P; }, true);
  // 花びら（32×64。下が付け根）。付け根の色 c2 から先の色 c へ。すじと、ふちの光。spots で付け根に点
  def('petal', 1, (o = {}) => { const P = Px(32, 64), C = ramp(o.c || '#f070a0'), B = ramp(o.c2 || '#fff0a0'), sd = o.seed || 0; P.clip = true;
    for (let y = 0; y < 64; y++) { const s = (63 - y) / 63, hw = 15.5 * (s < .72 ? .3 + .7 * Math.sin(s / .72 * PI / 2) : Math.sqrt(Math.max(0, 1 - ((s - .72) / .29) ** 2)));
      for (let x = 0; x < 32; x++) { const dx = x - 15.5, ad = Math.abs(dx); if (ad > hw) continue; const k = s + (hash(x, y, sd) - .5) * .12, base = k < .28;
        let c = base ? tone(B, k < .14 ? 4 : 3) : tone(C, 3 - (k < .4 ? 1 : 0) + (ad < hw * .4 ? 1 : 0)); if (Math.round(dx * (1.2 - s * .4)) % 5 === 0 && s > .1 && s < .85 && ad > 1) c = base ? B[2] : C[2]; if (ad > hw - 1.1) c = s > .5 ? C[5] : C[4];
        if (o.spots && s > .12 && s < .42 && hash(x >> 1, y >> 1, sd + 4) > .82) c = mix(o.spots, C[1], .2); P.set(x, y, c); } }
    return P; }, true);
  // 花のまん中（32×32）。花粉の点と、輪
  def('heart', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#f0c040'), D2 = ramp(o.c2 || '#c86a2a'); P.each((x, y) => { const r = Math.hypot(x - 15.5, y - 15.5); return r < 5 ? tone(D2, 2 + ((x + y) % 3 === 0 ? 1 : 0)) : r < 6.2 ? D2[1] : (x * 7 + y * 3) % 5 === 0 ? C[5] : (x + y * 2) % 4 === 0 ? C[2] : C[3]; }); return P; });
  // ちょうの羽 1 枚（32×32。左はしが体。上が まえばね、下が うしろばね）。黒いふちに白い点、目玉もよう
  def('wing', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#58a8f0'), E = ramp(o.edge || '#2a2a48'), G = ramp(o.c2 || '#ffd860'); P.clip = true;
    P.each((x, y) => { const f = ((x - 1) / 30) ** 2 + ((y - 10) / 10) ** 2, h = ((x - 1) / 20) ** 2 + ((y - 22) / 9.5) ** 2, inF = f < 1 && y < 20, inH = h < 1 && y > 12; if (!inF && !inH) return null; const e = inF ? f : h;
      if (e > .72) return (x + y) % 5 === 0 && e < .9 ? '#f8f4e8' : E[2]; if (inF && Math.hypot(x - 17, y - 9) < 3.2) return Math.hypot(x - 17, y - 9) < 1.6 ? E[1] : G[4]; if (inH && Math.hypot(x - 10, y - 23) < 2.6) return G[3];
      return x < 3 ? E[3] : (Math.round(Math.atan2(y - (inF ? 14 : 18), x) * 6) % 3 === 0 && e > .2) ? C[2] : tone(C, 3 + (e < .3 ? 1 : 0)); }); return P; }, true);
  // 石の顔の正面（64×64 ＝ 顔の正面 1 枚）。ひたいの帯の彫り、まゆ、おだやかな目、太い鼻、厚いくちびる、こけ、ひび
  def('face', 1, (o = {}) => { const P = Px(64), C = ramp(o.c || '#a8a088'), M = ramp(o.mossC || '#5e8a44'), sd = o.seed || 0, moss = o.moss ?? .45, open = o.look === 'open';
    P.each((x, y) => tone(C, 3 + (tn(x, y, 8, 8, 64, 64, sd) > .62 ? 1 : 0) - (tn(x, y, 5, 9, 64, 64, sd + 2) > .7 ? 1 : 0)));
    for (const yy of [3, 9]) { P.rect(0, yy, 64, 1, C[1]); P.rect(0, yy + 1, 64, 1, C[4]); } for (let x = 2; x < 64; x += 8) { P.bits(x, 5, ['.##.', '#..#', '.##.'], { '#': C[1] }); }   // ひたいの帯
    const hz = (x0, y0, w, up) => { for (let i = 0; i < w; i++) { const k = (i - w / 2) / (w / 2), yy = y0 + Math.round(k * k * (up ? 2 : -2)); P.set(x0 + i, yy, C[0]); P.set(x0 + i, yy - 1, C[5]); } };
    for (const ex of [19, 45]) { hz(ex - 8, 18, 16, true);   // まゆ（上が光、下がかげ）
      if (open) { for (let i = -6; i <= 6; i++) { const hh = Math.round(Math.sqrt(36 - i * i) * .55); for (let j = -hh; j <= hh; j++) P.set(ex + i, 25 + j, j < 0 ? C[1] : C[2]); P.set(ex + i, 25 - hh - 1, C[0]); P.set(ex + i, 25 + hh + 1, C[5]); } P.rect(ex - 1, 24, 3, 3, C[0]); }
      else { for (let i = -6; i <= 6; i++) { const yy = 25 + Math.round((i * i) / 18); P.set(ex + i, yy, C[0]); P.set(ex + i, yy + 1, C[1]); P.set(ex + i, yy - 1, C[4]); } for (let i = -5; i <= 5; i += 2) P.set(ex + i, 28 + (Math.abs(i) > 3 ? 0 : 1), C[2]); } }
    for (let y = 20; y < 41; y++) { const w = 3 + (y - 20) * .2; P.set(32 - w - 1, y, C[1]); P.set(32 + w, y, C[0]); P.set(32 + w + 1, y, C[1]); for (let x = Math.ceil(32 - w); x < 32 + w; x++) if (x > 32) P.set(x, y, C[2]); }   // 鼻（右がかげ）
    P.rect(26, 41, 13, 1, C[1]); P.bits(26, 39, ['##.......##', '.##.....##.'], { '#': C[0] });
    for (let i = -11; i <= 11; i++) { const yy = 48 + Math.round(-(i * i) / 60); P.set(32 + i, yy - 2, C[4]); P.set(32 + i, yy - 1, C[3]); P.set(32 + i, yy, C[0]); P.set(32 + i, yy + 1, C[1]); P.set(32 + i, yy + 2, C[2]); P.set(32 + i, yy + 3, C[4]); }   // くちびる（あいだが こい線）
    for (let i = -6; i <= 6; i++) P.set(32 + i, 56, C[1]);   // あご
    let cx = 6 + hash(sd, 3) * 10; for (let y = 10; y < 40; y++) { P.set(cx, y, C[0]); cx += hash(y, sd, 4) > .6 ? (hash(y, sd, 5) > .5 ? 1 : -1) : 0; }   // ひび
    P.each((x, y, c) => { const g = tn(x, y, 7, 7, 64, 64, sd + 6) + (y < 3 ? .4 : 0) + (x < 5 || x > 58 ? .25 : 0) + (y > 58 ? .3 : 0); return g > 1.25 - moss * .6 && hash(x, y, sd) > .2 ? tone(M, 2 + Math.floor(hash(x, y, 9) * 2.4) - (y % 3 === 0 ? 1 : 0)) : undefined; });
    return P; });
  // さるの毛と顔（32×32）。左半分＝毛（毛のすじ）、右上＝顔（明るいはだ・目・鼻・口）、右下＝むね
  def('monkey', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#8a5a3a'), S = ramp(o.face || '#e8c098');
    P.each((x, y) => x < 16 ? tone(C, 2 + ((x * 3 + y * 2) % 5 === 0 ? 1 : 0) - ((x + y * 3) % 7 === 0 ? 1 : 0)) : y >= 16 ? tone(C, 3 + ((x + y) % 4 === 0 ? 1 : 0)) : tone(C, 2));
    P.disc(23.5, 8, 6.6, S[3]); P.disc(23.5, 10, 4.6, S[4]); P.rect(17, 2, 14, 2, C[1]);
    P.bits(19, 5, ['##...##', '#k...k#', '.......', '..nnn..', '.......', '..mmm..'], { '#': '#2a1a18', k: '#ffffff', n: S[1], m: '#7a3a34' }); return P; });
  // 花のくき（16×32）。たてのすじと、ところどころの うぶ毛の点
  def('stalk', 1.5, (o = {}) => { const P = Px(16, 32), C = ramp(o.c || '#6ab04e'), sd = o.seed || 0; P.each((x, y) => { const b = [2, 3, 3, 4, 4, 3, 3, 2, 2, 1, 2, 2, 3, 3, 2, 2][x]; return x % 4 === 1 && hash(x, y >> 2, sd) > .3 ? C[b - 1 < 0 ? 0 : b - 1] : hash(x, y, sd + 2) > .95 ? C[5] : C[b]; }); return P; });
  // 波紋の輪（32×32。抜き）
  def('ring', 1, () => { const P = Px(32); P.clip = true; P.each((x, y) => { const r = Math.hypot(x - 15.5, y - 15.5); return r > 13.2 && r < 15.4 ? '#ffffff' : r > 11 && r < 12 && (x + y) % 2 ? '#a0a8b8' : null; }); return P; }, true);
  J.tex = tex; J.paint = paint;

  // ================= 2. 形の道具 =================
  // 葉 1 枚（rect の板を、中すじで 2 つ折り。付け根 b、向き a（よこ）、立ち上がり p、長さ L、はば W、たれ dr（先がさがる m）、おり fold（ふちが上がる量）、seg 段）
  const blade = (G, b, a, p, L, W, dr = 0, fold = .15, seg = 3, sh = [1, .82]) => { const d = [Math.sin(a) * Math.cos(p), Math.sin(p), Math.cos(a) * Math.cos(p)], sd = [Math.cos(a), 0, -Math.sin(a)];
    const M = s => [b[0] + d[0] * L * s, b[1] + d[1] * L * s - dr * s * s, b[2] + d[2] * L * s], E = (s, k) => { const m = M(s), w = W / 2 * (s < .1 ? .5 + s * 5 : 1); return [m[0] + sd[0] * w * k, m[1] + fold * w, m[2] + sd[2] * w * k]; };
    for (let i = 0; i < seg; i++) { const s0 = i / seg, s1 = (i + 1) / seg; G.quad(E(s0, -1), M(s0), M(s1), E(s1, -1), [0, s0, .5, s1], sh[0]); G.quad(M(s0), E(s0, 1), E(s1, 1), M(s1), [.5, s0, 1, s1], sh[1]); } return G; };
  J.blade = blade;

  // ---- 密林の高い木 ----
  function tree(o = {}) { const h = o.h || 14, r = o.r || h * .036, sd = o.seed || 0, B = parts(), bark = o.tex || T.bark({ c: o.c || '#6a5a4a' }), Bk = B.g(bark).smooth(1), lean = o.lean ?? .12;
    const lx = (hash(sd, 1) - .5) * h * lean * 2, lz = (hash(sd, 2) - .5) * h * lean * 2, tp = k => [lx * k * k + Math.sin(k * 4 + sd) * r * .8, k * h, lz * k * k + Math.cos(k * 3 + sd) * r * .6];
    const trunk = []; for (let i = 0; i <= 5; i++) { const k = i / 5; trunk.push([...tp(k), r * (1.25 - k * .5)]); } tube(Bk, trunk, 6, { m: 2.2 });
    const nr = o.roots ?? 5; for (let k = 0; k < nr; k++) { const a = (k + hash(k, 3, sd) * .5) / nr * TAU, ca = Math.cos(a), sa = Math.sin(a), L = r * (3 + hash(k, 4, sd) * 2.2);   // 板根（ひれのように広がる）
      tube(Bk, [[ca * r * .4, h * .16, sa * r * .4, r * .32], [ca * r * 1.1, h * .07, sa * r * 1.1, r * .32], [ca * L * .55, h * .02 + .15, sa * L * .55, r * .22], [ca * L, -.1, sa * L, r * .08]], 4, { m: 2 }); }
    const nc = o.crown ?? 3, top = tp(1), crown = [], leafT = T.leaves({ c: o.leaf || '#3f7a3e', shape: 'tile', seed: sd % 3 }), fr = T.leaves({ c: o.leaf || '#3f7a3e', shape: 'fringe', seed: sd % 3 }), Lf = B.g(leafT).smooth(2), Fr = B.g(fr, { side: true });
    for (let k = 0; k < nc; k++) { const a = k / nc * TAU + hash(k, 5, sd) * 1.4, d = k ? h * (.16 + hash(k, 6, sd) * .1) : 0, rx = h * (k ? .18 + hash(k, 7, sd) * .07 : .24), ry = rx * .38, cx = top[0] + Math.cos(a) * d, cz = top[2] + Math.sin(a) * d, cy = top[1] - (k ? h * (.04 + hash(k, 8, sd) * .12) : -h * .02);
      if (k) tube(Bk, [[top[0], top[1] - h * .14, top[2], r * .55], [(top[0] + cx) / 2, (top[1] + cy) / 2 - h * .02, (top[2] + cz) / 2, r * .4], [cx, cy - ry * .3, cz, r * .25]], 5, { m: 2 });
      const rings = [[-.5, .35], [-.28, .92], [0, 1], [.3, .8], [.48, .42], [.56, .05]].map(([t, q], i) => [cy + t * ry * 2, q * rx * (1 + (hash(i, k, sd) - .5) * .18), q * rx * (1 + (hash(i, k + 3, sd) - .5) * .18), (t + .5) * 1.6, .62 + (t + .5) * .45, cx, cz]);
      Lf.loft(8, rings, { ur: Math.max(2, Math.round(rx * .9)), rot: hash(k, 9, sd), cap: 'both' }); Fr.loft(8, [[cy - ry * .45, rx * .97, rx * .97, 1, .7, cx, cz], [cy - ry * .45 - h * .09, rx * .9, rx * .9, 0, .55, cx, cz]], { ur: Math.max(3, Math.round(rx * 1.4)), rot: hash(k, 9, sd) });
      crown.push([cx, cy, cz, rx]); }
    const g = B.group(), nv = o.vines ?? 5;   // たれたつる
    for (let k = 0; k < nv; k++) { const c = crown[k % crown.length], a = hash(k, 11, sd) * TAU, v = F.vine({ len: h * (.25 + hash(k, 12, sd) * .3), n: 3, w: 1, c: o.vineC || '#4a8a3a', seed: k + sd, flowers: o.flowers }); v.position.set(c[0] + Math.cos(a) * c[3] * .8, c[1] - c[3] * .3, c[2] + Math.sin(a) * c[3] * .8); g.add(v); }
    g.userData.crown = crown; g.userData.h = h; return g; }
  J.tree = tree;

  // ---- シダ ----
  J.fern = (o = {}) => { const s = o.s || 1, n = o.n || 9, sd = o.seed || 0, G = geo(); for (let k = 0; k < n; k++) { const a = (k + hash(k, 1, sd) * .6) / n * TAU, L = s * (1 + hash(k, 2, sd) * .5), p = .7 + hash(k, 3, sd) * .5; blade(G, [0, .05, 0], a, p, L, s * .55, L * (.9 + hash(k, 4, sd) * .4), .06, 4, [1, .85]); } return G.mesh(tex.frond({ c: o.c, seed: sd % 2 }), { side: true }); };
  // ---- 大きな葉の草（くき＋はばの広い葉） ----
  J.bigLeaf = (o = {}) => { const s = o.s || 1, n = o.n || 5, sd = o.seed || 0, B = parts(), St = B.g(T.bark({ c: o.stemC || '#5a8a3a' })).smooth(1), Lf = B.g(tex.leaf({ c: o.c, holes: o.holes, seed: sd % 3 }), { side: true });
    for (let k = 0; k < n; k++) { const a = (k + hash(k, 1, sd) * .7) / n * TAU, hh = s * (.5 + hash(k, 2, sd) * .6) * (o.upright ? 1.8 : 1), out = s * (.25 + hash(k, 5, sd) * .2), tip = [Math.sin(a) * out, hh, Math.cos(a) * out];
      tube(St, [[0, 0, 0, s * .035], [tip[0] * .5, hh * .6, tip[2] * .5, s * .03], [...tip, s * .02]], 4, {}); blade(Lf, tip, a, o.upright ? .9 : .25 + hash(k, 3, sd) * .3, s * (o.upright ? 1.6 : 1.05), s * (o.upright ? .55 : .8), s * (o.upright ? .5 : .35), .12, 3); }
    return B.group(); };
  // ---- 2 点のあいだに たれる つる ----
  J.liana = (a, b, o = {}) => { const sag = o.sag ?? 1.5, n = 8, pts = [], G = geo().smooth(1); for (let i = 0; i <= n; i++) { const k = i / n; pts.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - sag * 4 * k * (1 - k), a[2] + (b[2] - a[2]) * k, o.r || .06]); } tube(G, pts, 4, { m: 1 });
    const me = G.mesh(T.bark({ c: o.c || '#5a6a3a' })); if (o.leaf === false) return me; const L = geo(); for (let i = 1; i < n; i++) if (hash(i, 3, a[0]) > .3) { const p = pts[i]; blade(L, [p[0], p[1], p[2]], hash(i, 4) * TAU, -.6, .32, .2, .08, .05, 1); } const g = new THREE.Group(); g.add(me, L.mesh(tex.leaf({ c: o.leafC || '#4a9a44' }), { side: true })); return g; };

  // ---- 巨大な花 ----
  J.flower = (o = {}) => { const h = o.h || 5, r = o.r || h * .32, n = o.n || 6, sd = o.seed || 0, kind = o.kind || 'open', B = parts(), St = B.g(tex.stalk({ c: o.stem || '#6ab04e' })).smooth(1), g = new THREE.Group(), head = new THREE.Group();
    const bend = [(hash(sd, 1) - .5) * h * .25, (hash(sd, 2) - .5) * h * .1]; tube(St, [[0, 0, 0, h * .028], [bend[0] * .3, h * .4, bend[1] * .3, h * .024], [bend[0], h * .8, bend[1], h * .02], [bend[0] * 1.1, h, bend[1] + h * .03, h * .018]], 5, { m: 2 });
    const Lv = B.g(tex.leaf({ c: o.leaf || '#4aa048', seed: sd % 3 }), { side: true }); for (let k = 0; k < 3; k++) { const y = h * (.22 + k * .18), a = k * 2.3 + sd; blade(Lv, [bend[0] * (y / h) * .5, y, bend[1] * (y / h) * .5], a, .35, h * (.32 - k * .05), h * .15, h * .1, .1, 3); }
    g.add(B.group());
    const H = parts(), Pt = H.g(tex.petal({ c: o.c, c2: o.c2, spots: o.spots, seed: sd % 2 }), { side: true }), cupP = kind === 'cup' ? 1.0 : kind === 'bell' ? -.5 : .35, drP = kind === 'bell' ? -r * .1 : kind === 'cup' ? -r * .1 : r * .25;
    for (let k = 0; k < n; k++) blade(Pt, [0, 0, 0], k / n * TAU, cupP, r, r * (kind === 'bell' ? .62 : .78), drP, kind === 'bell' ? -.05 : .2, 3, [1, .88]);
    if (kind !== 'bell') for (let k = 0; k < n; k++) blade(Pt, [0, .03, 0], (k + .5) / n * TAU, cupP + .45, r * .6, r * .55, r * .05, .2, 2, [1.06, .95]);
    const Hc = H.g(tex.heart({ c: o.heart || '#f8d048', c2: o.heart2 })).smooth(1); Hc.loft(8, [[-.02, r * .2, r * .2, 0, .9], [r * .1, r * .2, r * .2, .2, 1], [r * .16, r * .12, r * .12, .5, 1.05]], { cap: 'top', capRect: true });
    head.add(H.group()); head.position.set(bend[0] * 1.1, h, bend[1] + h * .03); head.rotation.set(o.tilt ?? .5, 0, 0, 'YXZ'); g.add(head); g.userData.head = head; g.userData.h = h; return g; };

  // ---- 木の根にからまれた巨大な石の顔 ----
  J.stoneFace = (o = {}) => { const s = o.s || 1, sd = o.seed || 0, Hh = 6 * s, W = 2.3 * s, Dp = 2.1 * s, B = parts(), c = o.c || '#a8a088';
    const side = F.tex ? (o.side || T.stone({ c, moss: .6, seed: sd })) : T.stone({ c }), Sd = B.g(side).smooth(0);
    const SEC = { pts: [[-.62, -1], [-1, -.5], [-1, .55], [-.78, 1], [.78, 1], [1, .55], [1, -.5], [.62, -1]], u: [0, .12, .3, .45, .55, .7, .88, 1, 1] };
    Sd.loft(SEC, [[-.6, W * 1.02, Dp, 0, .7], [Hh * .3, W, Dp * .98, 1.5, .9], [Hh * .78, W * 1.04, Dp, 3.2, 1], [Hh * .9, W * .98, Dp * .94, 3.6, 1.05]], { ur: 4, cap: 'top' });
    const fz = Dp + .02 * s, fw = W * .78, Fc = B.g(tex.face({ c, moss: o.moss, look: o.look, seed: sd })), ridge = .32 * s, y0 = Hh * .02, y1 = Hh * .88;   // 顔の正面（まん中の すじが少し前へ出る）
    for (const [x0, x1, u0, u1, k] of [[-fw, 0, 0, .5, 1], [0, fw, .5, 1, .84]]) { const z0 = x0 ? fz : fz + ridge, z1 = x1 ? fz : fz + ridge; Fc.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [u0, 0, u1, 1], k); }
    const Cr = B.g(o.crownT || T.stone({ c: mix(c, '#c8a868', .3), seed: sd + 1 })).smooth(0);   // かんむりの帯と耳かざり
    Cr.loft(SEC, [[Hh * .86, W * 1.1, Dp * 1.08, 0, .85], [Hh * 1.0, W * 1.12, Dp * 1.1, .5, 1.05], [Hh * 1.0, W * .8, Dp * .78, .6, 1.1]], { ur: 6, cap: 'top' });
    for (const sx of [-1, 1]) Cr.at(TR(sx * W * 1.02, Hh * .5, Dp * .3, 0, 0, sx * PI / 2)).loft(8, [[-.1 * s, .55 * s, .55 * s, 0, .8], [.25 * s, .5 * s, .5 * s, .3, 1], [.3 * s, .3 * s, .3 * s, .5, 1.1]], { cap: 'top' }).at(null);
    const Rt = B.g(T.bark({ c: o.rootC || '#6a5a48' })).smooth(1), nr = o.roots ?? 5;   // 根：うしろの上からかぶさり、横を通って地面へ
    for (let k = 0; k < nr; k++) { const sx = k % 2 ? 1 : -1, q = hash(k, 3, sd), x0 = sx * W * (.2 + q * .6), rr = (.13 + hash(k, 4, sd) * .1) * s;
      tube(Rt, [[x0 * .4, Hh * 1.4 + q * s, -Dp * 1.4, rr * 1.2], [x0 * .7, Hh * 1.04, -Dp * .5, rr], [x0 * 1.05 + sx * .2 * s, Hh * .95, Dp * (.2 + q * .5), rr], [sx * (W + .15 * s), Hh * (.6 - q * .2), Dp * (.6 + q * .3), rr], [sx * (W + .3 * s), Hh * .2, Dp * (.4 + q * .6), rr * .9], [sx * (W + .9 * s + q * s), -.1, Dp * (.9 + q), rr * .6]], 5, { m: 1.5 }); }
    if (o.chinRoot !== false) tube(Rt, [[-W * 1.05, Hh * .3, Dp * .7, .14 * s], [-W * .5, Hh * .08, Dp + .3 * s, .15 * s], [W * .2, Hh * .02, Dp + .2 * s, .13 * s], [W * .9, -.1, Dp + .6 * s, .1 * s]], 5, { m: 1.5 });
    const g = B.group(); for (let k = 0; k < 3; k++) { const v = F.vine({ len: Hh * (.3 + hash(k, 8, sd) * .3), n: 3, w: .8 * s, seed: k + sd, c: '#4a8a3a', flowers: o.flowers }); v.position.set((k - 1) * W * .8, Hh * 1.02, Dp * .9); g.add(v); }
    g.userData = { h: Hh * 1.0, top: [0, Hh * 1.0, 0], w: W, d: Dp }; return g; };

  // ================= 3. 生きもの =================
  const rig = m => (G, parent, x, y, z) => { const me = new THREE.Mesh(G.build(), m); me.castShadow = true; const pv = new THREE.Group(); pv.position.set(x, y, z); pv.add(me); parent.add(pv); return pv; };
  const FW = TR(0, 0, 0, 0, PI / 2);
  J.monkey = (o = {}) => { const s = o.s || 1, m = mat(tex.monkey({ c: o.c, face: o.face }), { vc: true, smooth: true }), g = new THREE.Group(), root = new THREE.Group(), Jn = {}, part = rig(m); root.scale.setScalar(s); g.add(root);
    Jn.body = part(geo().smooth(1).px(0, 0, 16, 32, 32, 32).loft(6, [[0, .085, .075, 0, .85], [.1, .1, .09, .35], [.22, .085, .075, .75], [.27, .05, .045, 1]], { cap: 'both', rot: 0 }).px(16, 16, 16, 16, 32, 32).quad([-.06, .04, .088], [.06, .04, .088], [.05, .2, .078], [-.05, .2, .078]), root, 0, .16, 0);
    const Gh = geo().smooth(1).px(0, 0, 16, 16, 32, 32).loft(6, [[-.02, .05, .05, 0, .85], [.04, .085, .08, .4], [.1, .08, .075, .8], [.14, .03, .03, 1]], { cap: 'both', rot: 0 });
    Gh.smooth(0).px(16, 0, 16, 16, 32, 32).quad([-.075, -.005, .072], [.075, -.005, .072], [.07, .125, .066], [-.07, .125, .066]).px(17, 10, 6, 5, 32, 32).box(.06, .04, .05, 0, .0, .07, { taper: [.8, .8] });
    for (const sx of [-1, 1]) Gh.px(20, 2, 4, 4, 32, 32).quad([sx * .075, .03, .01], [sx * .12, .03, .0], [sx * .12, .09, .0], [sx * .075, .09, .01]);
    Jn.head = part(Gh, Jn.body, 0, .27, .01);
    const limb = (parent, x, y, z, L, r) => part(geo().smooth(1).px(0, 8, 8, 16, 32, 32).loft(4, [[-L, r * .8, r * .8, 0, .85], [-L * .5, r, r, .5], [0, r * 1.1, r * 1.1, 1]], { cap: 'bot' }), parent, x, y, z);
    Jn.armL = limb(Jn.body, .09, .22, 0, .26, .026); Jn.armR = limb(Jn.body, -.09, .22, 0, .26, .026); Jn.legL = limb(root, .06, .17, 0, .2, .032); Jn.legR = limb(root, -.06, .17, 0, .2, .032);
    const Gt = geo().smooth(1).px(0, 0, 8, 32, 32, 32); tube(Gt, [[0, 0, 0, .02], [0, .05, -.15, .018], [0, .2, -.26, .016], [0, .34, -.2, .013], [0, .36, -.1, .008]], 4, {}); Jn.tail = part(Gt, root, 0, .17, -.07);
    g.userData = { J: Jn, kind: 'monkey' }; J.monkeyPose(g, 'sit', 0); return g; };
  J.monkeyPose = (g, pose, t) => { const Jn = g.userData.J, a = Math.sin(t), rt = g.children[0];
    rt.position.set(0, 0, 0); rt.rotation.set(0, 0, 0); Jn.body.position.set(0, .16, 0); Jn.tail.rotation.set(0, 0, Math.sin(t * .7) * .3); Jn.head.rotation.set(0, Math.sin(t * .4) * .6, 0);
    if (pose === 'walk') { const w = Math.sin(t * 2); Jn.body.position.set(0, .2, -.08); Jn.body.rotation.set(1.25, 0, 0); Jn.head.rotation.set(-1.1, Math.sin(t * .3) * .3, 0); Jn.armL.rotation.set(-.15 + w * .5, 0, 0); Jn.armR.rotation.set(-.15 - w * .5, 0, 0); Jn.legL.rotation.set(-w * .5, 0, 0); Jn.legR.rotation.set(w * .5, 0, 0); Jn.legL.position.set(.06, .2, -.12); Jn.legR.position.set(-.06, .2, -.12); Jn.tail.position.set(0, .2, -.16); Jn.tail.rotation.set(-.4, 0, Math.sin(t) * .2); rt.position.y = Math.abs(w) * .02; return; }
    Jn.legL.position.set(.06, .17, 0); Jn.legR.position.set(-.06, .17, 0); Jn.tail.position.set(0, .17, -.07);
    if (pose === 'hang') { rt.position.y = -.69; Jn.body.rotation.set(Math.sin(t * 1.3) * .1, 0, 0); Jn.armL.rotation.set(PI - .1, 0, -.15); Jn.armR.rotation.set(PI - .1, 0, .15); Jn.legL.rotation.set(.3 + Math.sin(t * 2) * .2, 0, .1); Jn.legR.rotation.set(.3 - Math.sin(t * 2) * .2, 0, -.1); Jn.tail.rotation.set(-.6, 0, Math.sin(t) * .4); return; }
    Jn.body.position.set(0, .1, 0); Jn.body.rotation.set(-.15, 0, 0); Jn.legL.position.set(.07, .12, .02); Jn.legR.position.set(-.07, .12, .02); Jn.legL.rotation.set(-1.35, 0, -.2); Jn.legR.rotation.set(-1.35, 0, .2); Jn.tail.position.set(0, .08, -.08); Jn.tail.rotation.set(-1.3, 0, Math.sin(t * .6) * .4);
    Jn.armL.rotation.set(-.5, 0, -.2); Jn.armR.rotation.set(-.5, 0, .2);
    if (pose === 'eat') { Jn.armR.rotation.set(-2.2 + Math.sin(t * 3) * .2, 0, .5); Jn.head.rotation.set(.15 + Math.sin(t * 6) * .05, 0, 0); }
    if (pose === 'look') { Jn.armL.rotation.set(-2.6, 0, .4); Jn.head.rotation.set(-.2, Math.sin(t * .8) * .9, 0); } };

  J.butterfly = (o = {}) => { const s = o.s || 1, wt = tex.wing({ c: o.c, c2: o.c2, edge: o.edge }), wm = mat(wt, { vc: true, side: true, cut: true }), g = new THREE.Group(), root = new THREE.Group(), Jn = {}; root.scale.setScalar(s); g.add(root);
    const bm = mat(tex.monkey({ c: o.body || '#4a3a48' }), { vc: true, smooth: true }); root.add(new THREE.Mesh(geo().smooth(1).at(FW).loft(4, [[-.12, .008, .008, 0], [-.04, .02, .02, .3], [.06, .018, .018, .8], [.09, .012, .012, 1]], { cap: 'both' }).build(), bm));
    for (const [nm, sx] of [['wl', 1], ['wr', -1]]) { const pv = new THREE.Group(), G = geo().normal([0, 1, 0]); G.quad([0, 0, .1], [sx * .27, 0, .1], [sx * .27, 0, -.17], [0, 0, -.17], sx > 0 ? [0, 1, 1, 0] : [0, 1, 1, 0]); const me = new THREE.Mesh(G.build(), wm); if (sx < 0) me.scale.x = 1; pv.add(me); root.add(pv); Jn[nm] = pv; }
    g.userData = { J: Jn, ph: hash(o.seed || 0, 3) * TAU }; return g; };
  J.butterflyPose = (g, t) => { const Jn = g.userData.J, f = Math.abs(Math.sin(t * 7 + g.userData.ph)); Jn.wl.rotation.z = .15 + f * 1.1; Jn.wr.rotation.z = -.15 - f * 1.1; g.children[0].position.y = f * .05; };

  // 光る目 1 つの絵（16×8。アーモンド形。まん中ほど明るい）
  def('eye', 1, (o = {}) => { const P = Px(16, 8), C = ramp(o.c || '#ffe060'); P.clip = true; P.each((x, y) => { const dx = (x - 7.5) / 7.5, dy = (y - 3.5) / 3.5, e = dx * dx + dy * dy * (1 + dx * dx * 2); if (e > 1) return null; return Math.abs(x - 7.5) < 1.2 && Math.abs(y - 3.5) < 2.6 ? '#201810' : e < .35 ? '#fffff0' : e < .7 ? C[5] : C[3]; }); return P; }, true);
  J.eyes = (o = {}) => { const g = new THREE.Group(), s = o.s || .2, gap = o.gap || s * 1.1, sd = o.seed || 0, list = [], em = new THREE.SpriteMaterial({ map: tex.eye({ c: o.c }), fog: false, depthWrite: false, transparent: true });
    for (const sx of [-1, 1]) { const h = F.halo(o.c || '#ffe060', s * 4, .55), c = new THREE.Sprite(em); h.material.fog = false; h.position.x = c.position.x = sx * gap / 2; c.position.y = .01; g.add(h, c); list.push([h, s * 4], [c, s]); }
    g.userData.dyn = true; g.userData.tick = t => { const p = (t + hash(sd, 1) * 9) % (4 + hash(sd, 2) * 4), open = p > .18 && !(Math.sin(t * .3 + sd) > .93), k = open ? 1 : .08; for (const [sp, b] of list) sp.scale.set(b, b * (sp.material === em ? .5 : 1) * k, 1); }; return g; };

  // ================= 4. 水の波紋 =================
  J.ripples = (o = {}) => { const n = o.n || 40, [bw, bd] = o.box || [16, 16], r0 = o.r || .8, life = o.life || 1.4, extra = 12, N = n + extra, G = new THREE.BufferGeometry(), pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), col = new Float32Array(N * 12), idx = [];
    for (let i = 0; i < N; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2); }
    G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); G.setAttribute('color', new THREE.BufferAttribute(col, 3)); G.setIndex(idx);
    const m = new THREE.MeshBasicMaterial({ map: tex.ring(), color: o.c || '#b8c8e8', vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true }), me = new THREE.Mesh(G, m); me.frustumCulled = false; me.userData.dyn = true; me.renderOrder = 3;
    const y = o.y ?? 0, a = o.a ?? .8, em = [...Array(extra)].map(() => [0, 0, -99]); let ei = 0;
    const put = (i, x, z, rr, k) => { const q = i * 12; pos.set([x - rr, y, z - rr, x + rr, y, z - rr, x + rr, y, z + rr, x - rr, y, z + rr], q); for (let v = 0; v < 12; v++) col[q + v] = k; };
    me.userData.emit = (x, z, tm) => { em[ei] = [x, z, tm]; ei = (ei + 1) % extra; };
    me.userData.tick = (t, cx = 0, cz = 0) => { for (let i = 0; i < n; i++) { const ph = hash(i, 7) * life, cyc = Math.floor((t + ph) / life), f = ((t + ph) % life) / life, x = cx + (hash(i, cyc, 1) - .5) * bw, z = cz + (hash(i, cyc, 2) - .5) * bd; put(i, x, z, r0 * (.15 + f * (.6 + hash(i, cyc, 3) * .6)), a * (1 - f) * (1 - f)); }
      for (let j = 0; j < extra; j++) { const [x, z, t0] = em[j], f = (t - t0) / (life * 1.3); put(n + j, x, z, f < 0 || f > 1 ? 0 : r0 * (o.wake ?? .7) * (.3 + f * 1.4), f < 0 || f > 1 ? 0 : a * .8 * (1 - f)); }
      G.attributes.position.needsUpdate = G.attributes.color.needsUpdate = true; };
    me.userData.tick(0); return me; };
  return J;
};
