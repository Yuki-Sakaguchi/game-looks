// game-looks-11 の題材「密林と古い遺跡」（31〜35）で使い回す部品。kit.js・retro.js のあとに読み、 const J = PACK_JUNGLE1(THREE, K, R)  として使う。
// 第 8 集の pack（pack-fantasy-wild.js の滝・つた、pack-ruins.js のつた・光のすじ）にない物だけを足す。決まりは retro.js と同じ（足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'）。
//
// ■ テクスチャ  J.tex.名前({ c, seed, … }) → THREE.Texture（抜き色つきは cut）
//   leaf { kind: 'banana'（細長くさけ目）/'monstera'（広く切れこみ）/'palm'（羽の形）/'fern'（小さな羽）/'strap'（細い帯。tip でさきの色）, c, tip }   32×64。根もとが下、さきが上
//   river { c, hi（さざ波の色）, m } → コマの並び（にごった川・夕やけの水。R.flip で送る）
//   wood { c }（くりぬき舟の木目と、ふちの赤白の帯）   fur { c }   face { c, skin }（さるの顔）   stone { c, moss 0〜1, seed }（こけむした石。64 ドット＝3 m）
//   glyph { c, moss, kind: 'face'（彫った顔）/'calm'（目を閉じた顔）/'band'（うずと段の彫り） }（彫りのある石。64×64）   feather { c, c2, c3 }（鳥の羽の絵。32×32）
// ■ 植物
//   J.plant({ kind, n, len, w, h（くきの高さ。0 で地面から）, c, tip, pitch, droop, seed, stem（くきの色） }) 大きな葉のかぶ（バナナ・モンステラ・しだ・パイナップル科の着生植物）
//   J.palm({ h, n, len, c, lean, seed }) やしの木   J.bigTree({ h, r, c, crown（かさの広さ）, bark, moss, seed, vines（つたの数）}) 板根のある大きな木（userData.perch = 枝の上の点の並び）
//   J.mangrove({ h, r, roots, c, seed }) 根の張ったマングローブ（原点は水面。根は水の下 .4 m まで）   J.liana(a, b, { sag, r, c }) 2 点のあいだに たれる太いつる
//   J.hang({ len, n, w, c, seed }) たれさがる こけ・気根（F.vine と同じ形で、色だけ自分で決められる）
// ■ 生きもの（どれも userData.dyn = true。位置と向きはページが決め、毎コマ ＿Pose で動かす）
//   J.monkey({ c, face, s }) と J.monkeyPose(さる, 'sit'/'hang'/'walk', t)   'hang' は原点が つかんでいる手（枝の下に置く）
//   J.parrot({ c, c2, c3, s }) と J.parrotPose(鳥, 'perch'/'fly', t)   長い尾の色あざやかな鳥（オウムのなかま）
//   J.heron({ c, s }) と J.heronPose(さぎ, 'stand'/'walk'/'fish'/'fly', t)   足と首の長い水鳥
//   J.hummer({ c, s }) と J.hummerPose(鳥, t)   花の前でとまって飛ぶ小さな鳥
// ■ 人の物・遺跡
//   J.canoe({ len, w, c }) くりぬきの細長い舟（前が +z。userData.seat(k) で座る高さ）   J.paddle({ len, c }) かい（にぎりが原点、-y へのびる）
//   J.idol({ kind: 'head'/'stele'/'seated', s, c, moss }) 石像（彫った顔の頭・彫りの石柱・すわった像）
//   J.pyramid({ tiers, w, top, th, stair, tex, carve, c, moss }) 階段ピラミッド（階段は +z。userData = { H（てっぺんの高さ）, stepY(z), front(y) }）
//   J.rainbow({ r, w, a }) にじ（加算の半円。原点が円の中心、+z 向き）
window.PACK_JUNGLE1 = (THREE, K, R) => {
  const { hash, mix, ramp, tone, Px, geo, parts, TR } = R, T = R.tex, PI = Math.PI, TAU = PI * 2, cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const cache = new Map(), def = (name, m, fn, cut = false) => (o = {}) => { const key = name + JSON.stringify(o); let t = cache.get(key); if (!t) cache.set(key, t = T.from(fn(o), { m: o.m || m, cut })); return t; };
  const tube = (G, pts, n = 5, o = {}) => { const V = pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), m = o.m || 1.5; let len = 0, prev = null;
    const rings = V.map((v, i) => { const t = V[Math.min(V.length - 1, i + 1)].clone().sub(V[Math.max(0, i - 1)]).normalize(), up = Math.abs(t.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0), a = up.clone().cross(t).normalize(), b = t.clone().cross(a), r = pts[i][3]; if (prev) len += v.distanceTo(prev); prev = v;
      return [[...Array(n + 1)].map((_, k) => { const q = k / n * TAU; return [v.x + (a.x * Math.cos(q) + b.x * Math.sin(q)) * r, v.y + (a.y * Math.cos(q) + b.y * Math.sin(q)) * r, v.z + (a.z * Math.cos(q) + b.z * Math.sin(q)) * r]; }), len / m]; });
    for (let i = 0; i < rings.length - 1; i++) { const [A, va] = rings[i], [B, vb] = rings[i + 1], c0 = o.c ? o.c(i) : 1, c1 = o.c ? o.c(i + 1) : 1; for (let k = 0; k < n; k++) G.quad(A[k], A[k + 1], B[k + 1], B[k], [k / n, va, (k + 1) / n, vb], [c0, c0, c1, c1]); } return G; };

  // ================= テクスチャ =================
  // 葉 1 枚。左半分が日の当たる明るい面、右半分が影。まん中に明るい すじ、ななめの葉脈、ふちに こい線
  const leaf = def('leaf', 1, (o = {}) => { const P = Px(32, 64), C = ramp(o.c || '#4a9a3a'), kind = o.kind || 'banana', sd = o.seed || 0, tipC = o.tip ? ramp(o.tip) : null; P.clip = true;
    const hwOf = t => kind === 'banana' ? 14.5 * Math.pow(Math.sin(PI * Math.pow(t, .75)), .55) : kind === 'monstera' ? 15.5 * Math.pow(Math.sin(PI * Math.min(1, t * 1.08)), .6) * (t < .08 ? .7 + t * 3 : 1) : kind === 'strap' ? 5 * Math.pow(Math.sin(PI * Math.min(1, t * .9 + .1)), .5) : 15 * Math.pow(Math.sin(PI * Math.min(1, t * 1.02)), .7);
    for (let y = 0; y < 64; y++) { const t = (63 - y) / 63, hw = hwOf(t);
      for (let x = 0; x < 32; x++) { const dx = x - 15.5, ax = Math.abs(dx); if (ax > hw) continue; let c, k = dx < 0 ? 3 : 2;
        if (kind === 'palm' || kind === 'fern') { const lf = kind === 'palm' ? 5 : 4, ph = ((y + ax * (kind === 'palm' ? .9 : .7)) % lf + lf) % lf; if (ax > 1.2 && ph >= lf - 1.4) continue; if (ax > 1.2 && ph < 1) k += 1; if (kind === 'fern' && ax > hw - 2 && hash(x, y, sd) < .4) continue; }
        if (kind === 'banana') { const tear = [12, 21, 30, 38, 47].find(r => Math.abs(y - r - (dx > 0 ? 3 : 0) + ax * .25) < .7 && hash(r, dx > 0 ? 1 : 2, sd) < .7); if (tear !== undefined && ax > 2.5) continue; if (((y + ax * .45) | 0) % 4 === 0 && ax > 1.5) k -= 1; }
        if (kind === 'monstera') { const sl = [10, 19, 28, 37, 46].some(r => Math.abs(y - r + ax * .55) < .8 && ax > hw * .45 && ax < hw - .2); if (sl) continue; if ([[22, 8], [31, 7], [40, 7], [14, 9]].some(([hy, hx]) => Math.hypot(y - hy, ax - hx) < 1.6)) continue; if (((y + ax * .55) | 0) % 9 === 0 && ax > 1.5) k -= 1; }
        if (kind === 'strap' && ax > 1) k += ((y + (dx < 0 ? 0 : 2)) % 6 < 1) ? 1 : 0;
        if (ax < 1) k = dx < 0 ? 5 : 4; else if (ax > hw - 1) k = dx < 0 ? 2 : 1;
        if (t < .12 && ax >= 1) k -= 1; if (hash(x, y, sd + 3) < .04 && ax > 1.5 && ax < hw - 1) k += 1;
        c = tone(C, k); if (tipC && t > .55) c = tone(tipC, k + (t > .8 ? 0 : -1)); P.set(x, y, c); } }
    return P; }, true);
  // くりぬき舟の木（u が舟の長さ、v が深さ。上のはし 8 ドットに 赤と白のぎざぎざの帯）
  const wood = def('wood', 2, (o = {}) => { const P = Px(32), C = ramp(o.c || '#8a5a34'), Rd = ramp(o.band || '#d0402a'), sd = o.seed || 0;
    P.each((x, y) => { const g = Math.sin(y * 1.7 + Math.sin(x * .35 + sd) * 1.4) * .5 + .5; let k = 2 + (g > .78 ? 1 : g < .2 ? -1 : 0); if (hash(x, y, sd) < .06) k += 1; return tone(C, k); });
    for (let x = 0; x < 32; x++) { P.set(x, 0, C[4]); P.set(x, 1, C[3]); for (let y = 2; y < 8; y++) { const z = Math.abs(((x + y * 1) % 8) - 4); P.set(x, y, y === 2 || y === 7 ? C[1] : z < 2 ? Rd[3] : '#f0e4c8'); } }
    for (const [x, y] of [[6, 18], [21, 25], [13, 13]]) { P.disc(x, y, 1.6, C[1]); P.set(x, y, C[0]); } return P; });
  const fur = def('fur', 1, (o = {}) => { const P = Px(16), C = ramp(o.c || '#8a5a34'); P.each((x, y) => tone(C, 2 + ((x * 3 + y * 5) % 7 < 2 ? 1 : 0) - ((x + y * 2) % 9 === 0 ? 1 : 0))); return P; });
  const face = def('face', 1, (o = {}) => { const P = Px(16), F = ramp(o.c || '#8a5a34'), S = ramp(o.skin || '#e8c49a'); P.fill(F[2]);
    P.bits(0, 2, ['....SSSSSSSS....', '..SSSSSSSSSSSS..', '.SSSSSSSSSSSSSS.', '.SSSkkSSSSkkSSS.', '.SSkwkSSSSkwkSS.', '.SSSkkSSSSkkSSS.', '..SSSSSddSSSSS..', '...SSSSSSSSSS...', '....SSkSSkSS....', '....SSSSSSSS....', '.....SmmmmS.....', '......SSSS......'], { S: S[3], k: '#2a1a1a', w: '#fff4e0', d: S[1], m: S[1] }); return P; });
  // こけむした石（大きな切り石のならび＋上からのこけ）
  const stone = def('stone', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#9a9684'), M = ramp(o.mc || '#5a8a3a'), sd = o.seed || 0, mo = o.moss ?? .5;
    for (let r = 0; r < 4; r++) { const off = r % 2 ? 11 : 0, ws = [22, 18, 24]; let x = off; for (let i = 0; x < 64 + off; i++) { const w = ws[(i + r + sd) % 3]; P.block(x, r * 16, w, 16, C, 2 + (hash(i, r, sd) < .3 ? 1 : 0) - (hash(i, r, sd + 1) < .2 ? 1 : 0), { round: true }); x += w; } }
    P.each((x, y, c) => { const n = Math.sin(x * .21 + sd) * .5 + Math.sin(y * .17 + x * .05) * .5, ny = (y % 16) / 16; if (n + (1 - ny) * .8 > 1.7 - mo * 1.4 || hash(x, y, sd + 5) < mo * .05) return tone(M, 2 + ((x + y) % 5 === 0 ? 1 : 0) + (ny < .15 ? 1 : 0)); if (hash(x, y, sd + 7) < .03) return tone(C, 1); }); return P; });
  // 彫りのある石（顔・閉じた目の顔・うずの段）。u のまん中 1/3 が正面
  const glyph = def('glyph', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#a8a088'), M = ramp(o.mc || '#5a8a3a'), sd = o.seed || 0, kind = o.kind || 'face', mo = o.moss ?? .4;
    P.each((x, y) => tone(C, 2 + (hash(x >> 1, y >> 1, sd) < .12 ? 1 : 0) - (hash(x, y, sd + 1) < .05 ? 1 : 0)));
    const cut = (x, y, w, h) => { P.rect(x, y, w, h, C[1]); for (let i = 0; i < w; i++) P.set(x + i, y + h, C[4]); for (let j = 0; j < h; j++) P.set(x + w, y + j, C[3]); P.rect(x, y, w, 1, C[0]); };
    for (let x = 0; x < 64; x += 8) { cut(x + 1, 3, 6, 1); cut(x + 2, 58, 4, 2); P.set(x + 4, 6, C[1]); }
    const fx = 22;   // 正面（u .34〜.66 ＝ x 22〜42）
    if (kind === 'band') { for (let r = 0; r < 3; r++) for (let x = 0; x < 64; x += 16) { const y0 = 12 + r * 15; cut(x + 2, y0, 12, 1); cut(x + 2, y0 + 10, 12, 1); P.disc(x + 8, y0 + 5.5, 3.5, C[1]); P.disc(x + 8, y0 + 5.5, 2.2, C[3]); P.disc(x + 9, y0 + 5, 1, C[1]); } }
    else { cut(fx - 1, 9, 22, 2); for (let i = 0; i < 4; i++) cut(fx + 1 + i * 5, 4, 3, 4);   // かんむり
      cut(fx + 1, 15, 7, 2); cut(fx + 13, 15, 7, 2);   // まゆ
      if (kind === 'calm') { cut(fx + 2, 22, 6, 1); cut(fx + 13, 22, 6, 1); P.rect(fx + 3, 23, 4, 1, C[0]); P.rect(fx + 14, 23, 4, 1, C[0]); }
      else { P.rect(fx + 2, 20, 6, 5, C[4]); P.rect(fx + 13, 20, 6, 5, C[4]); P.rect(fx + 4, 21, 3, 3, C[0]); P.rect(fx + 14, 21, 3, 3, C[0]); P.rect(fx + 2, 19, 6, 1, C[1]); P.rect(fx + 13, 19, 6, 1, C[1]); }
      P.rect(fx + 9, 19, 3, 11, C[3]); P.rect(fx + 11, 20, 1, 10, C[1]); P.rect(fx + 8, 29, 5, 2, C[1]);   // 鼻
      if (kind === 'calm') { cut(fx + 7, 36, 7, 1); } else { cut(fx + 5, 35, 11, 3); for (let i = 0; i < 5; i++) P.set(fx + 6 + i * 2, 36, C[4]); }
      for (const sx of [fx - 4, fx + 22]) { P.disc(sx + 1.5, 26, 3, C[1]); P.disc(sx + 1.5, 26, 1.6, C[3]); cut(sx, 31, 3, 10); }   // 耳かざり
      cut(fx + 3, 44, 15, 1); for (let i = 0; i < 3; i++) { P.disc(fx + 6 + i * 4.5, 50, 1.8, C[1]); }   // むねかざり
      for (let x = 0; x < 64; x++) if (x < fx - 6 || x > fx + 26) for (let r = 0; r < 3; r++) { const y0 = 14 + r * 14; if ((x + r * 3) % 10 < 7) { P.set(x, y0, C[1]); P.set(x, y0 + 8, C[1]); } if ((x + r * 3) % 10 === 3) for (let j = 1; j < 8; j++) P.set(x, y0 + j, C[1]); } }
    P.each((x, y, c) => { const n = Math.sin(x * .19 + sd * 2) * .5 + Math.sin(y * .13 + x * .07 + sd) * .5; if (n + (1 - y / 64) * 1.3 > 2.15 - mo * 1.6 || (y < 3 && hash(x, sd) < mo) || hash(x, y, sd + 9) < mo * .03) return tone(M, 2 + ((x * 3 + y) % 7 === 0 ? 1 : 0) - (y > 40 ? 1 : 0)); }); return P; });
  // にごった川・夕やけの水（R.tex.water のさざ波の白を hi の色にかえる）→ コマの並び（R.flip で送る）
  const river = (o = {}) => { const key = 'river' + JSON.stringify(o); let t = cache.get(key); if (!t) cache.set(key, t = [...Array(4)].map((_, f) => { const P = R.paint.water({ c: o.c || '#8a6a3c', seed: o.seed, frame: f, frames: 4 }), hi = o.hi || mix(o.c || '#8a6a3c', '#f0e0b0', .55); P.each((x, y, c) => c === '#ffffff' ? hi : undefined); return T.from(P, { m: o.m || 3 }); })); return t; };
  // 鳥の羽（左上 16×16：体、右上 16×16：つばさ（色の帯と羽のすじ）、下 32×16：長い尾）
  const feather = def('feather', 1, (o = {}) => { const P = Px(32), A = ramp(o.c || '#e0302a'), B = ramp(o.c2 || '#f0c030'), Cc = ramp(o.c3 || '#2a6ad8'), W = ramp(o.face || '#f4f0e8');
    P.each((x, y) => { if (y < 16 && x < 16) return tone(A, 3 + ((x + y * 3) % 5 === 0 ? 1 : 0) - (y > 12 ? 1 : 0));
      if (y < 16) { const u = x - 16, band = u < 5 ? A : u < 9 ? B : Cc; return tone(band, 3 - (y % 4 === 3 ? 1 : 0) + (y < 2 ? 1 : 0)); }
      const u = (y - 16) / 16; return tone(x < 4 ? Cc : x > 28 ? Cc : u < .6 ? A : Cc, 3 - (x % 4 === 0 ? 1 : 0) + (x < 2 ? 1 : 0)); });
    P.bits(10, 2, ['WWW', 'WkW', 'WWW'], { W: W[4], k: '#1a1a22' }); return P; });

  // ================= 植物 =================
  // 葉 1 枚（根もと p から yaw の向きへ、pitch で立ち上がり、droop だけ さきが下がる。まん中で少し折れる）
  const leafStrip = (G, p, yaw, pitch, len, w, droop, n = 4, fold = .18) => { const sy = Math.sin(yaw), cy = Math.cos(yaw), sx = [cy, 0, -sy]; let x = p[0], y = p[1], z = p[2], a = pitch;
    for (let i = 0; i < n; i++) { const l = len / n, nx = x + sy * Math.cos(a) * l, ny = y + Math.sin(a) * l, nz = z + cy * Math.cos(a) * l, k0 = i / n, k1 = (i + 1) / n, w0 = w / 2, f0 = w0 * fold, sh0 = .78 + k0 * .3, sh1 = .78 + k1 * .3;
      const L0 = [x - sx[0] * w0, y - f0, z - sx[2] * w0], R0 = [x + sx[0] * w0, y - f0, z + sx[2] * w0], L1 = [nx - sx[0] * w0, ny - f0, nz - sx[2] * w0], R1 = [nx + sx[0] * w0, ny - f0, nz + sx[2] * w0], M0 = [x, y, z], M1 = [nx, ny, nz];
      G.quad(L0, M0, M1, L1, [0, k0, .5, k1], [sh0, sh0, sh1, sh1]); G.quad(M0, R0, R1, M1, [.5, k0, 1, k1], [sh0 * .9, sh0 * .9, sh1 * .9, sh1 * .9]); x = nx; y = ny; z = nz; a -= droop / n; } };
  const LEAFDEF = { banana: [7, 2.6, .9, .9, 1.6], monstera: [7, 1.3, 1.1, .7, 1.2], palm: [9, 3.2, 1.3, .55, 1.9], fern: [10, 1.4, .6, .75, 1.7], strap: [12, .55, .2, 1.0, 1.4] };
  function plant(o = {}) { const kind = o.kind || 'banana', d = LEAFDEF[kind], n = o.n || d[0], len = o.len || d[1], w = o.w || d[2], h = o.h ?? (kind === 'banana' ? 1.6 : 0), sd = o.seed || 0, B = parts(), Lg = B.g(leaf({ kind, c: o.c || (kind === 'fern' ? '#4a8a3a' : '#4a9a3a'), tip: o.tip, seed: sd % 3 }), { side: true }).smooth(0);
    if (h > 0) B.g(T.bark({ c: o.stem || '#7a8a4a' })).smooth(1).loft(6, [[0, .16, .16, 0, .7], [h * .5, .12, .12, .5, .9], [h, .1, .1, 1, 1]], { cap: 'top' });
    for (let i = 0; i < n; i++) { const yaw = (i + hash(i, 1, sd) * .6) / n * TAU, pitch = (o.pitch ?? d[3]) + (hash(i, 2, sd) - .5) * .5, k = .75 + hash(i, 3, sd) * .4; leafStrip(Lg, [Math.sin(yaw) * .05, h + (kind === 'banana' ? -hash(i, 4, sd) * .3 : 0), Math.cos(yaw) * .05], yaw, pitch, len * k, w * k, (o.droop ?? d[4]) * (.8 + hash(i, 5, sd) * .4), kind === 'strap' ? 3 : 4); }
    return B.group(); }
  function palm(o = {}) { const h = o.h || 7, sd = o.seed || 0, lean = o.lean ?? .35, B = parts(), a = hash(sd, 1) * TAU, top = [Math.cos(a) * h * lean * .4, h, Math.sin(a) * h * lean * .4], pts = [];
    for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push([top[0] * k * k, h * k, top[2] * k * k, .2 - k * .07]); } tube(B.g(T.bark({ c: o.bark || '#9a8a6a' })).smooth(1), pts, 6, { m: .8 });
    const Lg = B.g(leaf({ kind: 'palm', c: o.c || '#5aa040', seed: sd % 3 }), { side: true }).smooth(0), n = o.n || 9; for (let i = 0; i < n; i++) { const yaw = (i + hash(i, 2, sd) * .5) / n * TAU; leafStrip(Lg, top, yaw, .5 + hash(i, 3, sd) * .4, (o.len || 3.4) * (.8 + hash(i, 4, sd) * .3), 1.4, 2.2, 5, .3); }
    const g = B.group(); g.userData.top = top; return g; }
  // 葉のかたまり（R.tree の かさと同じ作り：ふくらんだ筒＋ふちの抜き板）
  const crownLump = (B, lo, cx, cy, cz, rx, ry, sd) => { B.g(T.leaves({ ...lo, shape: 'tile' })).smooth(3 + Math.round(cx * 7 + cz * 3)).loft(7, [[-1, .35], [-.55, .85], [-.05, 1], [.45, .82], [.85, .42], [1, .05]].map(([t, r], i) => [cy + t * ry, r * rx * (1 + (hash(i, 1, sd) - .5) * .2), r * rx * (1 + (hash(i, 2, sd) - .5) * .2), (t + 1) * .5 * Math.max(1, Math.round(ry / 1.2)), .6 + (t + 1) * .27, cx, cz]), { ur: Math.max(2, Math.round(rx * 1.4)), rot: hash(cx, 5, sd) });
    const G = B.g(T.leaves({ ...lo, shape: 'blob' }), { side: true }).normal([0, 1, 0]); for (let i = 0; i < 2; i++) { const a = hash(i, 9, sd + cx) * .6 + i * PI / 2, ex = Math.cos(a) * rx * 1.5, ez = Math.sin(a) * rx * 1.5; G.quad([cx - ex, cy - ry * 1.3, cz - ez], [cx + ex, cy - ry * 1.3, cz + ez], [cx + ex, cy + ry * 1.4, cz + ez], [cx - ex, cy + ry * 1.4, cz - ez], [0, 0, 1, 1], [.66, .66, 1.1, 1.1]); } G.normal(null); };
  // つたの板（たれ下がる）
  const hangInto = (G, x, y, z, len, n, w, sd) => { for (let i = 0; i < n; i++) { const a = hash(i, 1, sd) * PI, ox = (hash(i, 2, sd) - .5) * w, oz = (hash(i, 3, sd) - .5) * w * .5, l = len * (.55 + hash(i, 4, sd) * .45), cx = Math.cos(a) * .2, cz = Math.sin(a) * .2; G.quad([x + ox - cx, y - l, z + oz - cz], [x + ox + cx, y - l, z + oz + cz], [x + ox + cx, y, z + oz + cz], [x + ox - cx, y, z + oz - cz], [0, 1 - l / 3, 1, 1], [.75, .75, 1, 1]); } };
  const vineT = def('vine', 1, (o = {}) => { const P = Px(16, 64), G = ramp(o.c || '#3f8a4a'), sd = o.seed || 0; P.clip = true;
    for (let s = 0; s < 3; s++) { const x0 = 3 + s * 5; for (let y = 0; y < 64; y++) { const x = x0 + Math.round(Math.sin(y * .2 + s * 2 + sd) * 1.2); if (y > 64 - (20 + hash(s, 1, sd) * 40)) continue; P.set(x, y, G[2]); if (y % 5 === s) { P.rect(x - 2, y, 2, 2, G[3]); P.set(x - 2, y, G[4]); } if (y % 5 === (s + 2) % 5) { P.rect(x + 1, y, 2, 2, G[2]); P.set(x + 2, y + 1, G[1]); } if (o.flowers && y % 13 === s * 3) { P.rect(x - 1, y, 3, 2, o.fc || '#f05a7a'); P.set(x, y, '#fff0c0'); } } } return P; }, true);
  function hang(o = {}) { const G = geo().normal([0, 1, 0]); hangInto(G, 0, 0, 0, o.len || 3, o.n || 3, o.w ?? .8, o.seed || 0); return G.mesh(vineT({ c: o.c, flowers: o.flowers, fc: o.fc, seed: (o.seed || 0) % 3 }), { side: true }); }
  function bigTree(o = {}) { const h = o.h || 16, r = o.r || .5, sd = o.seed || 0, B = parts(), bt = o.bark || T.bark({ c: o.barkC || '#8a7a64' }), lo = { c: o.c || '#3f7f3a', seed: sd % 3, flowers: o.flowers, fc: o.fc }, cr = o.crown || h * .32, perch = [];
    const star = { pts: [...Array(10)].map((_, k) => { const a = (k + .5) / 10 * TAU, rr = k % 2 ? .42 : 1; return [-Math.sin(a) * rr, -Math.cos(a) * rr]; }), u: [...Array(11)].map((_, k) => k / 10) };
    B.g(bt).smooth(1).loft(star, [[-.2, r * 3.4, r * 3.4, 0, .6], [h * .05, r * 2.1, r * 2.1, .3, .75], [h * .14, r * 1.15, r * 1.15, .8, .9]], { ur: 3, rot: hash(sd, 2) });
    const Tk = B.g(bt).smooth(2), lx = (hash(sd, 3) - .5) * h * .08, lz = (hash(sd, 4) - .5) * h * .08; Tk.loft(8, [[h * .1, r * 1.05, r * 1.05, 0, .8], [h * .4, r * .95, r * .95, h * .13, .9, lx * .3, lz * .3], [h * .72, r * .8, r * .8, h * .24, 1, lx, lz], [h * .82, r * .6, r * .6, h * .28, 1, lx, lz]], { ur: 2 });
    const nb = o.branches || 4; for (let b = 0; b < nb; b++) { const a = b / nb * TAU + hash(b, 5, sd), L = cr * (.7 + hash(b, 6, sd) * .4), y0 = h * (.6 + hash(b, 7, sd) * .14), ex = lx + Math.cos(a) * L, ez = lz + Math.sin(a) * L, ey = y0 + L * .38;
      tube(B.g(bt).smooth(0), [[lx, y0, lz, r * .5], [lx + Math.cos(a) * L * .5, y0 + L * .12, lz + Math.sin(a) * L * .5, r * .34], [ex, ey, ez, r * .2]], 5, { m: 1.5 }); perch.push([lx + Math.cos(a) * L * .45, y0 + L * .1 + r * .4, lz + Math.sin(a) * L * .45, a]);
      crownLump(B, lo, ex, ey + h * .04, ez, cr * (.45 + hash(b, 8, sd) * .15), h * .085, sd + b); }
    crownLump(B, lo, lx, h * .86, lz, cr * .6, h * .1, sd + 9);
    if (o.moss) { const Mg = B.g(T.grass({ c: '#5a9a3a' })).smooth(0); for (const p of perch) Mg.at(TR(p[0], p[1] - .05, p[2], -p[3])).loft(5, [[0, .3, .3, 0, .8], [.12, .22, .22, 1, 1]], { cap: 'top' }); Mg.at(null); }
    const nv = o.vines ?? 6; if (nv) { const Vg = B.g(vineT({ c: o.vineC || '#3f8a4a', flowers: o.vineFlowers, seed: sd % 3 }), { side: true }).normal([0, 1, 0]); for (let i = 0; i < nv; i++) { const p = perch[i % perch.length], k = .6 + hash(i, 11, sd) * .7, x = lx + (p[0] - lx) * k * 1.4, z = lz + (p[2] - lz) * k * 1.4; hangInto(Vg, x, p[1] + .2, z, (o.vineLen || h * .45) * (.6 + hash(i, 12, sd) * .5), 3, 1, sd + i); } }
    const g = B.group(); g.userData.perch = perch; g.userData.top = [lx, h, lz]; return g; }
  function mangrove(o = {}) { const h = o.h || 6, r = o.r || 2.6, sd = o.seed || 0, B = parts(), bt = T.bark({ c: o.barkC || '#7a6a5a' }), base = h * .28, Rg = B.g(bt).smooth(0), lo = { c: o.c || '#3a7040', seed: sd % 3 };
    for (let i = 0; i < (o.roots || 9); i++) { const a = i / (o.roots || 9) * TAU + hash(i, 1, sd) * .5, rr = r * (.6 + hash(i, 2, sd) * .5), y0 = base * (.55 + hash(i, 3, sd) * .5), ca = Math.cos(a), sa = Math.sin(a);
      tube(Rg, [[ca * .15, y0, sa * .15, .09], [ca * rr * .35, y0 + .35, sa * rr * .35, .08], [ca * rr * .75, y0 * .6, sa * rr * .75, .07], [ca * rr, -.4, sa * rr, .07]], 4, { m: 1 }); }
    const lean = (hash(sd, 4) - .5) * .8; B.g(bt).smooth(1).loft(6, [[base * .4, .22, .22, 0, .75], [h * .55, .17, .17, 1, .9, lean, 0], [h * .7, .12, .12, 1.5, 1, lean * 1.3, 0]], { ur: 1 });
    for (let i = 0; i < 4; i++) { const a = i * 1.7 + sd, d = r * (.25 + hash(i, 5, sd) * .35); crownLump(B, lo, lean + Math.cos(a) * d, h * (.72 + hash(i, 6, sd) * .14), Math.sin(a) * d, r * (.55 + hash(i, 7, sd) * .2), h * .1, sd + i); }
    return B.group(); }
  function liana(a, b, o = {}) { const G = geo().smooth(1), n = 8, pts = []; for (let i = 0; i <= n; i++) { const k = i / n; pts.push([a[0] + (b[0] - a[0]) * k + Math.sin(k * 9) * .08, a[1] + (b[1] - a[1]) * k - Math.sin(k * PI) * (o.sag ?? 2), a[2] + (b[2] - a[2]) * k, o.r || .07]); } tube(G, pts, 4, { m: 1 }); return G.mesh(T.bark({ c: o.c || '#6a6a4a' })); }

  // ================= 生きもの =================
  const rig = m => (G, parent, x, y, z) => { const me = new THREE.Mesh(G.build(), m); me.castShadow = true; const pv = new THREE.Group(); pv.position.set(x, y, z); pv.add(me); parent.add(pv); return pv; };
  function monkey(o = {}) { const s = o.s || 1, c = o.c || '#7a5234', B = new THREE.Group(), root = new THREE.Group(), Jm = {}, fm = R.mat(fur({ c }), { vc: true, smooth: true }), part = rig(fm), lim = (l, r0, r1) => geo().smooth(1).loft(5, [[-l, r1, r1, 0, .85], [-l * .5, (r0 + r1) / 2, (r0 + r1) / 2, .5, .95], [0, r0, r0, 1, 1]], { cap: 'both' });
    root.scale.setScalar(s); B.add(root); Jm.hips = new THREE.Group(); root.add(Jm.hips);
    Jm.body = part(geo().smooth(1).loft(7, [[0, .1, .085, 0, .85], [.1, .12, .1, .35, 1], [.22, .1, .085, .7, 1], [.3, .06, .06, 1, 1]], { cap: 'both' }), Jm.hips, 0, 0, 0);
    const Hd = geo().smooth(1).loft(7, [[-.02, .05, .05, 0, .85], [.05, .085, .08, .5, 1], [.12, .07, .07, .9, 1], [.15, .03, .03, 1, 1]], { cap: 'both' }); Hd.smooth(0).normal([0, 0, 1]).rect(0, 0, 1, 1); Jm.head = part(Hd, Jm.body, 0, .3, .01);
    const fq = geo().quad([-.08, -.01, .075], [.08, -.01, .075], [.08, .14, .06], [-.08, .14, .06]).mesh(R.mat(face({ c, skin: o.face }), { vc: true, smooth: true })); Jm.head.add(fq);
    for (const sx of [-1, 1]) { const e = geo().loft(5, [[0, .03, .012, 0], [.04, .02, .008, 1]], { cap: 'both' }).mesh(R.mat(face({ c, skin: o.face }), { vc: true })); e.position.set(sx * .085, .07, -.01); e.rotation.z = -sx * 1.3; Jm.head.children[0].add(e); }
    for (const [n, sx] of [['L', 1], ['R', -1]]) { Jm['arm' + n] = part(lim(.15, .035, .03), Jm.body, sx * .1, .25, 0); Jm['fore' + n] = part(lim(.15, .03, .03), Jm['arm' + n], 0, -.15, 0);
      Jm['leg' + n] = part(lim(.13, .045, .035), Jm.hips, sx * .07, .02, 0); Jm['shin' + n] = part(lim(.13, .035, .03), Jm['leg' + n], 0, -.13, 0); }
    const tl = geo().smooth(1); tube(tl, [...Array(9)].map((_, i) => { const k = i / 8; return [0, -k * .05 + Math.sin(k * 2.6) * .12, -k * .45, .025 - k * .012]; }), 4, { m: .4 }); Jm.tail = part(tl, Jm.hips, 0, .03, -.07);
    B.userData = { J: Jm, dyn: true, kind: 'monkey' }; B.userData.dyn = true; monkeyPose(B, 'sit', 0); return B; }
  function monkeyPose(m, pose, t) { const Jm = m.userData.J, sn = Math.sin, set = (j, x, y = 0, z = 0) => Jm[j].rotation.set(x, y, z);
    Jm.hips.position.set(0, 0, 0); Jm.hips.rotation.set(0, 0, 0); Jm.body.rotation.set(0, 0, 0); Jm.tail.rotation.set(0, 0, 0);
    if (pose === 'sit') { Jm.hips.position.y = .05; Jm.body.rotation.x = .1; set('legL', -1.5, 0, .3); set('legR', -1.5, 0, -.3); set('shinL', 1.9); set('shinR', 1.9); const sc = Math.max(0, sn(t * 1.3)) ; set('armL', -.5, 0, .2); set('foreL', -.8); set('armR', -.4 - sc * 1.9, 0, -.25); set('foreR', -1.6 - sc * .6); Jm.head.rotation.set(sn(t * .7) * .15, sn(t * .45) * .6, 0); Jm.tail.rotation.set(-1.3 + sn(t * 1.1) * .2, 0, 0); }
    else if (pose === 'hang') { const sw = sn(t * 1.6) * .35; Jm.hips.rotation.set(sw, 0, sn(t * .8) * .1); Jm.hips.position.set(0, -.58, 0); set('armL', -PI + .1, 0, -.15); set('foreL', 0); set('armR', -.3 + sn(t * 2.1) * .4, 0, -.5); set('foreR', -.6); set('legL', -.6 - sw, 0, .3); set('shinL', .9); set('legR', -.2 + sw, 0, -.2); set('shinR', .5); Jm.tail.rotation.set(.6 + sn(t * 1.3) * .3, 0, 0); Jm.head.rotation.set(-.2, sn(t * .6) * .5, 0); }
    else { const w = t * 7; Jm.hips.position.y = .2 + Math.abs(sn(w)) * .02; Jm.body.rotation.x = 1.25; set('armL', -1.25 + sn(w) * .5); set('armR', -1.25 - sn(w) * .5); set('foreL', 0); set('foreR', 0); set('legL', -sn(w) * .5); set('legR', sn(w) * .5); set('shinL', .2); set('shinR', .2); Jm.head.rotation.set(-1.0, 0, 0); Jm.tail.rotation.set(-.4, 0, 0); }
    if (pose === 'hang') { Jm.hips.updateMatrix(); } }
  function parrot(o = {}) { const s = o.s || 1, B = new THREE.Group(), root = new THREE.Group(), Jp = {}, t = feather(o), m = R.mat(t, { vc: true, smooth: true, side: true }), part = rig(m), W = 32; root.scale.setScalar(s); B.add(root);
    const Gb = geo().smooth(1).px(0, 0, 16, 16, W, W).at(TR(0, 0, 0, 0, PI / 2 - .35)).loft(6, [[-.04, .02, .02, 1], [.03, .06, .055, .75], [.12, .065, .06, .45], [.2, .045, .045, .2], [.24, .03, .03, 0]], { cap: 'both' });
    Gb.at(null).smooth(0).px(0, 16, 32, 16, W, W).normal([0, 1, 0]).quad([-.04, -.04, -.04], [.04, -.04, -.04], [.02, -.07, -.42], [-.02, -.07, -.42]); Jp.body = part(Gb, root, 0, .16, 0);
    const Gh = geo().smooth(1).px(0, 0, 16, 16, W, W).loft(6, [[-.03, .035, .035, 0], [.02, .045, .05, .5], [.06, .02, .02, 1]], { cap: 'both' }); const Bk = geo().smooth(0).px(28, 28, 2, 2, W, W); for (const [a, b] of [[[-.016, .015, .04], [.016, .015, .04]], [[.016, .015, .04], [0, -.02, .05]], [[0, -.02, .05], [-.016, .015, .04]]]) Bk.tri(a, b, [0, -.005, .085]);
    Jp.head = part(Gh, Jp.body, 0, .07, .2); Jp.head.add(new THREE.Mesh(Bk.build(), R.mat('#2a2a30', { vc: true })));
    const fq = geo().px(8, 0, 8, 8, W, W).normal([0, 0, 1]); for (const sx of [-1, 1]) fq.quad([sx * .046, -.01, .0], [sx * .046, -.01, .04], [sx * .046, .04, .04], [sx * .046, .04, .0]); Jp.head.add(new THREE.Mesh(fq.build(), R.mat(t, { vc: true, side: true })));
    for (const [n, sx] of [['wl', 1], ['wr', -1]]) Jp[n] = part(geo().px(16, 0, 16, 16, W, W).normal([0, 1, 0]).quad([0, 0, .06], [sx * .34, 0, .02], [sx * .3, 0, -.12], [0, 0, -.1], [0, 1, 1, 0], [1, .85, .85, 1]), Jp.body, sx * .05, .03, .06);
    B.userData = { J: Jp, dyn: true, kind: 'parrot' }; parrotPose(B, 'perch', 0); return B; }
  function parrotPose(p, pose, t) { const Jp = p.userData.J; if (pose === 'fly') { const f = Math.sin(t * 13); Jp.wl.visible = Jp.wr.visible = true; Jp.wl.rotation.z = f * .9; Jp.wr.rotation.z = -f * .9; Jp.body.rotation.x = .3; Jp.body.position.y = .16 - f * .015; Jp.head.rotation.x = -.2; }
    else { Jp.wl.visible = Jp.wr.visible = true; Jp.wl.rotation.set(-.15, 0, -1.35); Jp.wr.rotation.set(-.15, 0, 1.35); Jp.body.rotation.x = -.55; Jp.body.position.y = .16; Jp.head.rotation.set(.45 + Math.sin(t * .8) * .15, Math.sin(t * .5) * .7, 0); } }
  function heron(o = {}) { const s = o.s || 1, c = o.c || '#f4f0e8', B = new THREE.Group(), root = new THREE.Group(), Jh = {}, C = ramp(c), m = R.mat(T.from(Px(8).each((x, y) => tone(C, 3 + ((x + y * 2) % 5 === 0 ? 1 : 0) - (y > 5 ? 1 : 0))), { m: 1 }), { vc: true, smooth: true, side: true }), part = rig(m), lm = R.mat(o.leg || '#3a3a3a', { vc: true }), bm = R.mat(o.bill || '#e8b830', { vc: true });
    root.scale.setScalar(s); B.add(root); Jh.body = new THREE.Group(); Jh.body.position.y = .62; root.add(Jh.body);
    Jh.body.add(new THREE.Mesh(geo().smooth(1).at(TR(0, 0, 0, 0, PI / 2 - .5)).loft(6, [[-.24, .02, .02, 0, .8], [-.12, .08, .07, .3, .95], [.04, .09, .085, .6, 1], [.16, .05, .05, .9, 1], [.2, .03, .03, 1, 1]], { cap: 'both' }).build(), m));
    Jh.neck = new THREE.Group(); Jh.neck.position.set(0, .1, .14); Jh.body.add(Jh.neck); const nk = geo().smooth(1); tube(nk, [[0, 0, 0, .03], [0, .1, .06, .025], [0, .18, .02, .022], [0, .26, .05, .02]], 5, { m: 1 }); Jh.neck.add(new THREE.Mesh(nk.build(), m));
    Jh.head = new THREE.Group(); Jh.head.position.set(0, .26, .05); Jh.neck.add(Jh.head); Jh.head.add(new THREE.Mesh(geo().smooth(1).at(TR(0, 0, 0, 0, PI / 2)).loft(5, [[-.03, .02, .02, 0], [.0, .03, .03, .5], [.03, .02, .02, 1]], { cap: 'both' }).build(), m)); Jh.head.add(new THREE.Mesh(geo().at(TR(0, 0, .03, 0, PI / 2)).loft(4, [[0, .012, .008, 0], [.16, .001, .001, 1]], { cap: 'bot' }).build(), bm));
    for (const [n, sx] of [['L', 1], ['R', -1]]) { Jh['leg' + n] = new THREE.Group(); Jh['leg' + n].position.set(sx * .04, .64, 0); root.add(Jh['leg' + n]); Jh['leg' + n].add(new THREE.Mesh(geo().loft(4, [[-.64, .009, .009, 0], [0, .014, .014, 1]]).quad([-.005, -.64, .0], [.005, -.64, .0], [.005, -.64, .09], [-.005, -.64, .09]).build(), lm));
      Jh['w' + n] = part(geo().normal([0, 1, 0]).quad([0, 0, .14], [sx * .55, 0, .04], [sx * .5, 0, -.18], [0, 0, -.2], [0, 0, 1, 1], [1, .85, .85, 1]), Jh.body, sx * .06, .04, 0); }
    B.userData = { J: Jh, dyn: true, kind: 'heron' }; heronPose(B, 'stand', 0); return B; }
  function heronPose(h, pose, t) { const Jh = h.userData.J, fly = pose === 'fly'; Jh.wL.visible = Jh.wR.visible = fly; Jh.legL.rotation.set(0, 0, 0); Jh.legR.rotation.set(0, 0, 0); Jh.body.rotation.set(0, 0, 0); Jh.neck.rotation.set(0, 0, 0); Jh.head.rotation.set(0, 0, 0); Jh.body.position.y = .62;
    if (fly) { const f = Math.sin(t * 6); Jh.wL.rotation.z = f * .7; Jh.wR.rotation.z = -f * .7; Jh.body.rotation.x = .5; Jh.neck.rotation.x = .6; Jh.head.rotation.x = -.9; Jh.legL.rotation.x = Jh.legR.rotation.x = 1.4; Jh.legL.position.z = Jh.legR.position.z = -.1; return; }
    Jh.legL.position.z = Jh.legR.position.z = 0;
    if (pose === 'walk') { const w = t * 2.2; Jh.legL.rotation.x = Math.sin(w) * .35; Jh.legR.rotation.x = -Math.sin(w) * .35; Jh.neck.rotation.x = Math.sin(w * 2) * .12; Jh.head.rotation.x = -Math.sin(w * 2) * .12; }
    else if (pose === 'fish') { const k = Math.max(0, Math.sin(t * .9)) ** 6; Jh.body.rotation.x = .25 + k * .4; Jh.neck.rotation.x = .5 + k * 1.1; Jh.head.rotation.x = .3 + k * .5; }
    else { Jh.head.rotation.y = Math.sin(t * .4) * .6; Jh.neck.rotation.x = Math.sin(t * .3) * .08; } }
  function hummer(o = {}) { const s = o.s || 1, B = new THREE.Group(), root = new THREE.Group(), Jb = {}, C = ramp(o.c || '#2ab87a'), m = R.mat(T.from(Px(8).each((x, y) => y > 5 ? '#e84a6a' : tone(C, 3 + ((x + y) % 3 === 0 ? 1 : 0))), { m: 1 }), { vc: true, smooth: true, side: true }); root.scale.setScalar(s); B.add(root);
    root.add(new THREE.Mesh(geo().smooth(1).at(TR(0, 0, 0, 0, PI / 2 - .7)).loft(5, [[-.05, .006, .006, 0], [0, .018, .018, .6], [.035, .012, .012, 1]], { cap: 'both' }).loft(4, [[.035, .004, .004, 1], [.09, .001, .001, 1]]).build(), m));
    for (const [n, sx] of [['L', 1], ['R', -1]]) { Jb[n] = new THREE.Group(); Jb[n].add(new THREE.Mesh(geo().normal([0, 1, 0]).quad([0, 0, .01], [sx * .07, 0, .0], [sx * .06, 0, -.02], [0, 0, -.015]).build(), R.mat('#d8e8e0', { side: true }))); root.add(Jb[n]); }
    B.userData = { J: Jb, dyn: true }; return B; }
  function hummerPose(b, t) { const f = Math.sin(t * 60); b.userData.J.L.rotation.z = f * 1.1; b.userData.J.R.rotation.z = -f * 1.1; }

  // ================= 人の物・遺跡 =================
  function canoe(o = {}) { const len = o.len || 5.6, w = o.w || .78, n = 12, B = parts(), Ot = B.g(wood({ c: o.c, band: o.band })).smooth(1), In = B.g(wood({ c: mix(o.c || '#8a5a34', '#2a1a14', .35), band: mix(o.c || '#8a5a34', '#2a1a14', .3) })).smooth(1), dep = .34;
    const sec = u => { const sn = Math.pow(Math.sin(PI * cl(u, .001, .999)), .55), hw = w / 2 * sn, yt = dep + .1 * Math.pow(2 * u - 1, 4) * 1.6, d = dep * (.25 + .75 * Math.pow(Math.sin(PI * u), .35)); return [[-hw, yt], [-hw * .92, yt - d * .55], [-hw * .55, yt - d * .92], [0, yt - d], [hw * .55, yt - d * .92], [hw * .92, yt - d * .55], [hw, yt]]; }, V = [0, .45, .7, .82, 1].reverse();
    for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, z0 = (u0 - .5) * len, z1 = (u1 - .5) * len, A = sec(u0), Bq = sec(u1);
      for (let k = 0; k < 6; k++) { const vv = [1, .7, .45, .25, .45, .7, 1], sh = .7 + Math.abs(k - 2.5) * .08; Ot.quad([A[k + 1][0], A[k + 1][1], z0], [Bq[k + 1][0], Bq[k + 1][1], z1], [Bq[k][0], Bq[k][1], z1], [A[k][0], A[k][1], z0], [u0 * len / 2, vv[k + 1], u1 * len / 2, vv[k]], sh);
        const q = .85; In.quad([A[k][0] * q, A[k][1] + .02, z0], [Bq[k][0] * q, Bq[k][1] + .02, z1], [Bq[k + 1][0] * q, Bq[k + 1][1] + .02, z1], [A[k + 1][0] * q, A[k + 1][1] + .02, z0], [u0 * len / 2, .2, u1 * len / 2, .6], .75); }
      for (const e of [0, 6]) { const s = e ? 1 : -1; Ot.quad([A[e][0], A[e][1], z0], [Bq[e][0], Bq[e][1], z1], [Bq[e][0] * .85, Bq[e][1] + .02, z1], [A[e][0] * .85, A[e][1] + .02, z0], [u0, .95, u1, 1], 1.1); } }
    const Sd = B.g(T.planks({ c: '#a07a50' })); for (const z of [-len * .3, len * .02, len * .3]) Sd.box(w * .78, .05, .28, 0, dep - .14, z, { m: 1 });
    const g = B.group(); g.userData.seat = z => dep - .09; g.userData.len = len; return g; }
  function paddle(o = {}) { const L = o.len || 1.5, G = geo().smooth(1).loft(5, [[-L * .62, .022, .022, 0, .85], [0, .02, .02, 1, 1]], { cap: 'top' }).smooth(0).loft(6, [[-L, .02, .006, 0, .8], [-L * .97, .085, .014, .1, .9], [-L * .75, .09, .016, .6, 1], [-L * .62, .03, .014, 1, 1]], { cap: 'bot' }); return G.mesh(wood({ c: o.c || '#b08a5a' })); }
  function idol(o = {}) { const kind = o.kind || 'head', s = o.s || 1, c = o.c || '#a8a088', mo = o.moss ?? .45, sd = o.seed || 0, B = parts(), St = B.g(stone({ c, moss: mo, seed: sd })).smooth(0), SEC = { pts: [[0, -.95], [-.7, -.9], [-1, -.5], [-1, .5], [-.8, .95], [.8, .95], [1, .5], [1, -.5], [.7, -.9]], u: [0, .07, .16, .25, .34, .66, .75, .84, .93, 1] };
    if (kind === 'head') { const Gl = B.g(glyph({ c, moss: mo, kind: o.face || 'face', seed: sd })).smooth(1); St.loft(8, [[-.2, .95 * s, .9 * s, 0, .75], [.35 * s, .9 * s, .85 * s, .3, .9]], { cap: 'top', ur: 2 }); Gl.loft(SEC, [[.3 * s, .78 * s, .72 * s, 0, .8], [1.2 * s, .82 * s, .78 * s, .5, 1], [1.95 * s, .74 * s, .7 * s, 1, 1.05]], { cap: 'top' }); }
    else if (kind === 'stele') { const Gl = B.g(glyph({ c, moss: mo, kind: o.face || 'face', seed: sd })).smooth(0); Gl.loft(SEC, [[0, .62 * s, .3 * s, 0, .8], [2.6 * s, .58 * s, .28 * s, 1, 1.05]], { cap: 'top' }); St.loft(8, [[-.2, .85 * s, .5 * s, 0, .7], [.18 * s, .8 * s, .46 * s, .2, .9]], { cap: 'top' }); }
    else { St.loft(8, [[-.2, 1.1 * s, 1.1 * s, 0, .7], [.5 * s, 1.05 * s, 1.05 * s, .3, .9], [.6 * s, .95 * s, .95 * s, .35, 1]], { cap: 'top', ur: 2 });
      St.loft(SEC, [[.6 * s, .85 * s, .62 * s, 0, .8, 0, .05 * s], [.9 * s, .82 * s, .55 * s, .3, .95, 0, .05 * s], [1.0 * s, .55 * s, .4 * s, .4, 1, 0, 0]], { cap: 'top' });   // くんだ足
      St.loft(SEC, [[.9 * s, .48 * s, .32 * s, .2, .85], [1.45 * s, .52 * s, .34 * s, .6, 1], [1.75 * s, .44 * s, .3 * s, .9, 1], [1.82 * s, .2 * s, .18 * s, 1, 1]], { cap: 'top' });   // 胴
      for (const sx of [-1, 1]) tube(St, [[sx * .45 * s, 1.68 * s, 0, .11 * s], [sx * .55 * s, 1.3 * s, .08 * s, .1 * s], [sx * .32 * s, 1.0 * s, .35 * s, .09 * s]], 5, { m: 1 });   // うで（ひざの上で手を合わせる）
      B.g(glyph({ c, moss: mo, kind: 'calm', seed: sd })).smooth(1).loft(SEC, [[1.78 * s, .26 * s, .25 * s, 0, .85], [2.1 * s, .3 * s, .28 * s, .45, 1], [2.42 * s, .27 * s, .26 * s, .9, 1.05], [2.5 * s, .14 * s, .14 * s, 1, 1.05]], { cap: 'top' }); }
    return B.group(); }
  function pyramid(o = {}) { const n = o.tiers || 5, w0 = o.w || 24, wt = o.top || 8, th = o.th || 2.6, sw = o.stair || 4.4, H = n * th, B = parts(), tx = o.tex || stone({ c: o.c || '#a8a48c', moss: o.moss ?? .5 }), G = B.g(tx).smooth(0), S = B.g(o.stepTex || T.cobble({ kind: 'slab', c: o.c || '#a8a48c', moss: .4 })).smooth(0), Cv = B.g(o.carve || glyph({ c: o.c || '#a8a48c', kind: 'band', moss: .3 })).smooth(0);
    const wi = i => w0 - (w0 - wt) * i / n; for (let i = 0; i < n; i++) { const a = wi(i), b = wi(i + 1) + (a - wi(i + 1)) * .3; G.box(a, th * .82, a, 0, i * th, 0, { m: 3, taper: (a - (a - b) * .7) / a, top: false }); G.box(b, th * .18, b, 0, i * th + th * .82, 0, { m: 3 }); Cv.box(a * .985, th * .3, a * .985, 0, i * th + th * .3, 0, { m: 3, top: false, taper: .99 }); }
    const zf = y => wi(y / th) / 2, steps = Math.round(H / .32), rise = H / steps, z0 = w0 / 2 + 1.2, z1 = wt / 2, run = (z0 - z1) / steps;
    for (let k = 0; k < steps; k++) { const z = z0 - k * run; S.box(sw, rise, run + .02, 0, k * rise, z - run / 2, { m: 1.5, c0: .7, c1: 1.05 }); }
    for (const sx of [-1, 1]) { const x = sx * (sw / 2 + .3); G.quad([x - sx * .3, 0, z0 + .1], [x + sx * .3, 0, z0 + .1], [x + sx * .3, H + .3, z1], [x - sx * .3, H + .3, z1], [0, 0, 1, H / 3], 1.05); G.quad(sx > 0 ? [x + .3, 0, z0 + .1] : [x - .3, 0, z1], sx > 0 ? [x + .3, 0, z1] : [x - .3, 0, z0 + .1], sx > 0 ? [x + .3, H + .3, z1] : [x - .3, H + .3, z0 + .1], sx > 0 ? [x + .3, H + .3, z0 + .1] : [x - .3, H + .3, z1], [0, 0, 2, 1], .85);
      G.quad(sx > 0 ? [x + .3, 0, z0 + .1] : [x - .3, 0, z0 + .1], sx > 0 ? [x - .3, 0, z0 + .1] : [x + .3, 0, z0 + .1], [x - sx * .3 * sx * sx, .5, z0 + .1], [x + sx * .3 * sx * sx, .5, z0 + .1], [0, 0, .3, .2], .8); }
    // てっぺんの お堂（入口は暗い。屋根の上に すかしの かざり）
    const hw = wt * .36, hd = wt * .3, hh = th * 1.2, Dk = B.g(T.from(Px(8).fill('#1a1420'), { m: 1 }), { glow: true });
    Cv.box(hw * 2, hh, hd * 2, 0, H, -.3, { m: 3, top: false }); G.box(hw * 2.2, .4, hd * 2.2, 0, H + hh, -.3, { m: 3 }); Cv.box(hw * 1.3, th * .9, .5, 0, H + hh + .4, -.3, { m: 3, taper: [.8, 1] });
    Dk.quad([-.75, H, hd - .28], [.75, H, hd - .28], [.75, H + hh * .78, hd - .28], [-.75, H + hh * .78, hd - .28]);
    const g = B.group(); g.userData = { H, stepY: z => cl((z0 - z) / run, 0, steps) * rise, z0, z1, front: y => zf(y) }; return g; }
  function rainbow(o = {}) { const r = o.r || 8, w = o.w || 1.6, P = Px(1, 12), cs = ['#ff5a4a', '#ff9a3a', '#ffe04a', '#6ae05a', '#4aa0ff', '#8a6aff']; for (let i = 0; i < 12; i++) P.set(0, i, i < 1 || i > 10 ? '#000000' : cs[Math.floor((i - 1) / 10 * 6)]);
    const t = T.from(P, { m: 1 }), G = geo(), n = 20; for (let i = 0; i < n; i++) { const a0 = i / n * PI, a1 = (i + 1) / n * PI; G.quad([Math.cos(a0) * r, Math.sin(a0) * r, 0], [Math.cos(a1) * r, Math.sin(a1) * r, 0], [Math.cos(a1) * (r + w), Math.sin(a1) * (r + w), 0], [Math.cos(a0) * (r + w), Math.sin(a0) * (r + w), 0], [0, 0, 1, 1]); }
    const me = new THREE.Mesh(G.build(), new THREE.MeshBasicMaterial({ map: t, vertexColors: true, transparent: true, opacity: o.a ?? .32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); me.userData.dyn = true; return me; }

  return { tex: { river, leaf, wood, fur, face, stone, glyph, feather, vine: vineT }, tube, leafStrip, plant, palm, bigTree, mangrove, liana, hang, monkey, monkeyPose, parrot, parrotPose, heron, heronPose, hummer, hummerPose, canoe, paddle, idol, pyramid, rainbow };
};
