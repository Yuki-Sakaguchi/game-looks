// 第 12 集の題材「白い電脳世界」（46〜50）の追加の部品（pack）。../game-looks-7/kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), CY = PACK_CYBER2(THREE, K, R);   として使う。
//
// ■ 考え方：白とうすい灰の世界。白がブラウン管でとばないよう、地の色は #e0e2ec くらいまでにおさえ、うすい青むらさきの目地と影、白いふちの光で面を読ませる。
//   差し色は うすい水色・もも・レモン・わかば。光る物（窓の板・光の線・記号）だけを明るくする。ブラウン管の bloom は .15 ほどに下げると、白がにじみすぎない。
// ■ 決まり：retro.js と同じ（足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'）。動く物は CY.live に入る。毎コマ CY.tick(t) を 1 回。
//
// ■ テクスチャ  CY.tex.名前(o) → THREE.Texture（同じ引数なら同じ物）。CY.paint.名前(o) は R.Px を返す
//   tile { c, line, accent: [色…], n（1 枚の中の板の数。2/4）, seed, glow（目地を光らせる色） }   床の板（目地・ふちの光・内のみぞ・小さな記号と回路）
//   under { c, light }   浮かぶ島の下がわ（地層の横すじと、ぽつぽつ光る点）
//   wall { c, glass, accent, seed, lit 0〜1 }   白い建物のかべ（板のつぎ目と、横長の窓の帯。64 ドット＝1 階 3 m）
//   board { kind: 'list'/'icons'/'graph'/'map'/'face'/'score'/'text'/'blank', c（わく）, bg, ink, seed, score: [a, b] }   浮かぶ窓の板（64×48。光る材質で使う）
//   sym { kind: 'star'/'heart'/'note'/'diamond'/'excl'/'ring'/'plus'/'cross'/'drop'/'arrow'/'quest'/'moon', c }   記号（16×16。抜き）
//   skyline { c, haze, lit, seed }   遠くの塔の町なみ（128×64。抜き）   beam   光の線の芯（加算で使う）   fur { c, c2 }   耳・しっぽの毛
// ■ 形
//   CY.isle({ r, depth, n, top, side, rim（色。ふちの光の帯）, seed })   浮かぶ島（上の面が y=0）。上は板の床、下はすぼまる段
//   CY.tower({ r, h, n, tex, steps, spire, c（光の色）, ledge, glow（かべを光に関係なく見せる。夜の窓あかり） })   白い塔（段ごとに細くなる筒と、光の帯、先の光）。userData.top
//   CY.board({ w, h, kind, c, bg, ink, seed, score, opacity, frame })   浮かぶ窓の板（+z 向き。下のまん中が原点）。userData.face ＝ 光る面
//   CY.lines([[a, b], …], { w, c, k, mode: 'flat'/'up'/'cross', fog })   光の線（加算）
//   CY.packets(点の列, { n, c, s, speed, loop })   線にそって流れる光の粒（userData.tick）
//   CY.backdrop({ r, h, y, c, haze, lit, rep, seed })   遠くの塔の町なみの輪
//   CY.wear(actor, 種類, o)   'ears' { kind: 'cat'/'fox'/'rabbit'/'bear', c, c2 }   'tail' { kind: 'cat'/'fox'/'rabbit', c, c2 }   'halo' { c }   'mark' { kind, c, s }（頭の上の記号）
//     しっぽと記号は自分でゆれる（CY.tick）。どれも この場面のための自作の形で、特定の作品のアバターではない
// ■ 毎コマ：CY.tick(t)
window.PACK_CYBER2 = (THREE, K, R) => {
  const { hash } = K, PI = Math.PI, ramp = R.ramp, mix = R.mix, Px = R.Px, tn = R.tn, CY = { tex: {}, paint: {}, live: [] };
  const cache = new Map(), def = (name, m, fn, cut = false) => { CY.paint[name] = fn; CY.tex[name] = (o = {}) => { const key = name + JSON.stringify(o); let t = cache.get(key); if (!t) { t = R.tex.from(fn(o), { m: o.m || m, cut }); cache.set(key, t); } return t; }; };
  const snap = R.mat('#ffffff').onBeforeCompile;
  CY.tick = t => { for (const f of CY.live) f(t); };
  const ACC = ['#7ad0ec', '#f2a0c4', '#eed070', '#9ad88a'];

  // ================= テクスチャ =================
  // 床の板。n×n 枚の板。目地はこい青むらさき、上と左のふちに白い光、下と右に影。板の中に うすいみぞの四角、ところどころに差し色の小さな記号と回路の線
  def('tile', 3, (o = {}) => { const P = Px(64), A = ramp(o.c || '#e0e2ec', 6, { contrast: .5 }), L = ramp(o.line || '#9aa0c0', 6, { contrast: .7 }), ac = o.accent || ACC, sd = o.seed || 0, n = o.n || 2, s = 64 / n, gl = o.glow;
    P.each((x, y) => { const i = Math.floor(x / s), j = Math.floor(y / s), lx = x % s, ly = y % s, tw = hash(i, j, sd) > .7;
      if (lx === 0 || ly === 0) return gl || L[2];
      if (lx === 1 || ly === 1) return A[5];
      if (lx === s - 1 || ly === s - 1) return A[1];
      if (lx === s - 2 || ly === s - 2) return A[2];
      const v = tn(x, y, 32, 32, 64, 64, sd) + (lx + ly < s * .6 ? .12 : 0); return tw ? (v > .62 ? A[4] : A[3]) : (v > .7 ? A[4] : v < .3 ? A[2] : A[3]); });
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x0 = i * s, y0 = j * s, r = hash(i, j, sd + 3), in4 = Math.max(4, Math.round(s * .22));
      if (r < .45) { for (let k = in4; k < s - in4; k++) { P.set(x0 + k, y0 + in4, A[2]); P.set(x0 + k, y0 + in4 + 1, A[5]); P.set(x0 + k, y0 + s - in4, A[2]); P.set(x0 + in4, y0 + k, A[2]); P.set(x0 + in4 + 1, y0 + k, A[5]); P.set(x0 + s - in4, y0 + k, A[2]); } }   // うすいみぞの四角
      if (r > .55 && r < .8) { const c = ac[Math.floor(hash(i, j, sd + 5) * ac.length)], C = ramp(c), x = x0 + 4, y = y0 + 4; P.rect(x, y, 3, 3, C[3]); P.set(x, y, C[5]); P.set(x + 2, y + 2, C[1]); P.rect(x + 4, y + 1, 4, 1, A[2]); }   // 差し色の小さな目印
      if (r > .8) { let x = x0 + 3 + Math.floor(hash(i, j, sd + 6) * (s - 8)), y = y0 + s - 4; const C = ramp(ac[(((i + j + sd) % ac.length) + ac.length) % ac.length]); for (let k = 0; k < s * .5; k++) { P.set(x, y, A[2]); P.set(x + 1, y, A[4]); y--; if (k === Math.floor(s * .25)) for (let q = 0; q < 5; q++) { P.set(x + q, y, A[2]); } } P.rect(x - 1, y - 1, 3, 3, C[2]); P.set(x, y, C[4]); }   // 回路の線
    }
    return P; });
  // 浮かぶ島の下がわ。うすい灰むらさきの段に横のすじ。ところどころ光る点
  def('under', 3, (o = {}) => { const P = Px(64), A = ramp(o.c || '#d6d8e8', 6, { contrast: .5 }), Lc = ramp(o.light || '#7ad0ec'), sd = o.seed || 0;
    P.each((x, y) => { const b = (y + Math.round(tn(x, 0, 16, 1, 64, 1, sd) * 4)) % 16; if (b === 0) return A[5]; if (b === 1) return A[4]; if (b === 15) return A[1]; const v = tn(x, y, 16, 8, 64, 64, sd + 2); return v > .65 ? A[3] : v < .3 ? A[1] : A[2]; });
    for (let k = 0; k < 12; k++) { const x = Math.floor(hash(k, 1, sd) * 60), y = Math.floor(hash(k, 2, sd) * 60); if (k % 3 === 0) { P.rect(x, y, 2, 2, Lc[4]); P.set(x, y, Lc[5]); } else P.set(x, y, A[5]); }
    for (let x = 0; x < 64; x += 8) for (let y = 4; y < 64; y += 16) if (hash(x, y, sd + 4) > .5) { P.rect(x, y, 1, 6, A[1]); P.rect(x + 1, y, 1, 6, A[4]); }
    return P; });
  // 白い建物のかべ。1 階 3 m（64 ドット）の中に、上の帯・横長の窓・下の板。窓は うすい水色のガラスに、ふちの光と映りこみ
  def('wall', 3, (o = {}) => { const P = Px(64), A = ramp(o.c || '#e0e2ec', 6, { contrast: .55 }), G = ramp(o.glass || '#a8d4ea', 6, { contrast: .7 }), Ac = ramp(o.accent || '#7ad0ec'), sd = o.seed || 0, lit = o.lit ?? .3, Y = ramp('#f8e8a8');
    P.each((x, y) => { const lx = x % 16; if (y === 0) return A[5]; if (y === 63) return A[1]; if (y >= 18 && y < 40) return null; if (lx === 0) return A[2]; if (lx === 1) return A[5]; const v = tn(x, y, 32, 16, 64, 64, sd); return y < 18 ? (y === 16 ? A[2] : y === 17 ? A[1] : v > .6 ? A[4] : A[3]) : (y === 40 ? A[5] : y === 41 ? A[4] : y === 62 ? A[2] : v > .66 ? A[4] : A[3]); });
    for (let w = 0; w < 4; w++) { const x0 = w * 16, on = hash(w, 1, sd) < lit; for (let y = 18; y < 40; y++) for (let x = x0; x < x0 + 16; x++) { const lx = x - x0, ly = y - 18; let c = lx < 2 || lx > 13 ? A[3] : ly < 2 ? A[1] : ly > 19 ? A[4] : on ? (ly < 6 ? Y[5] : (lx + ly) % 7 < 2 ? Y[5] : Y[4]) : ((lx - ly + 40) % 11 < 2 ? G[5] : ly < 8 ? G[2] : G[3]); if (lx === 2 && ly > 1 && ly < 20) c = on ? Y[3] : G[1]; P.set(x, y, c); } }   // 窓（ともる窓は うすい黄）
    for (let x = 4; x < 64; x += 16) if (hash(x, 3, sd) > .5) { P.rect(x, 9, 6, 2, Ac[3]); P.set(x, 9, Ac[5]); }   // 上の帯の小さな光
    return P; });
  // 浮かぶ窓の板（64×48）。わく・上の帯（3 つの点）・中身
  const DIG = { 0: ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'], 1: ['.x.', 'xx.', '.x.', '.x.', 'xxx'], 2: ['xxx', '..x', 'xxx', 'x..', 'xxx'], 3: ['xxx', '..x', 'xxx', '..x', 'xxx'], 4: ['x.x', 'x.x', 'xxx', '..x', '..x'], 5: ['xxx', 'x..', 'xxx', '..x', 'xxx'], 6: ['xxx', 'x..', 'xxx', 'x.x', 'xxx'], 7: ['xxx', '..x', '.x.', '.x.', '.x.'], 8: ['xxx', 'x.x', 'xxx', 'x.x', 'xxx'], 9: ['xxx', 'x.x', 'xxx', '..x', 'xxx'], '-': ['...', '...', 'xxx', '...', '...'], ':': ['...', '.x.', '...', '.x.', '...'] };
  CY.digits = (P, str, x, y, sc, c) => { for (const ch of String(str)) { const g = DIG[ch]; if (g) g.forEach((row, j) => [...row].forEach((q, i) => { if (q === 'x') P.rect(x + i * sc, y + j * sc, sc, sc, c); })); x += 4 * sc; } };
  def('board', 2, (o = {}) => { const P = Px(64, 48), C = ramp(o.c || '#7ad0ec'), B = ramp(o.bg || '#e8f2fa', 6, { contrast: .5 }), I = ramp(o.ink || '#5a6aa0'), sd = o.seed || 0, kd = o.kind || 'list', ac = ACC;
    P.each((x, y) => (x < 2 || y < 2 || x > 61 || y > 45) ? (x === 0 || y === 0 || x === 63 || y === 47 ? C[1] : C[4]) : y < 9 ? (y === 8 ? C[1] : y === 2 ? C[5] : C[3]) : ((x + y * 3) % 23 === 0 ? B[4] : B[3]));
    for (let k = 0; k < 3; k++) { P.rect(52 - k * 5, 4, 3, 3, [C[5], ramp('#f8e090')[4], ramp('#f4a8c8')[4]][k]); } P.rect(5, 4, 14, 2, C[5]);
    const ln = (x, y, w, c) => P.rect(x, y, w, 2, c);
    if (kd === 'list') for (let j = 0; j < 5; j++) { const y = 13 + j * 6, c = ramp(ac[(j + sd) % 4]); P.rect(6, y, 3, 3, c[2]); P.set(6, y, c[4]); ln(12, y + 1, 14 + Math.floor(hash(j, 1, sd) * 32), I[j === 1 ? 4 : 2]); }
    else if (kd === 'icons') for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { const x = 6 + i * 14, y = 13 + j * 16, c = ramp(ac[(i + j * 2 + sd) % 4]); P.rect(x, y, 11, 11, c[3]); P.rect(x, y, 11, 1, c[5]); P.rect(x, y + 10, 11, 1, c[1]); P.rect(x + 3, y + 3, 5, 5, c[(i + j) % 2 ? 5 : 1]); }
    else if (kd === 'graph') { ln(6, 41, 52, I[1]); for (let i = 0; i < 8; i++) { const h = 6 + Math.floor((hash(i, 2, sd) * .6 + i / 10) * 22), c = ramp(ac[i % 4]); P.rect(8 + i * 6, 41 - h, 4, h, c[3]); P.rect(8 + i * 6, 41 - h, 4, 1, c[5]); P.rect(11 + i * 6, 41 - h, 1, h, c[1]); } }
    else if (kd === 'map') { for (let x = 6; x < 58; x += 8) P.rect(x, 11, 1, 32, B[1]); for (let y = 11; y < 44; y += 8) P.rect(4, y, 56, 1, B[1]); let x = 8, y = 38; const c = ramp(ac[1]); for (let k = 0; k < 40; k++) { P.rect(x, y, 2, 2, c[2]); if (k % 2) x += 1; else y -= hash(k, 3, sd) > .4 ? 1 : 0; } P.disc(x + 1, y, 3, c[3]); P.set(x, y - 1, c[5]); }
    else if (kd === 'face') { const c = ramp(ac[sd % 4]); P.disc(16, 27, 9, c[3]); P.disc(14, 25, 5, c[4]); P.rect(12, 26, 2, 3, I[0]); P.rect(19, 26, 2, 3, I[0]); P.rect(14, 31, 5, 1, I[1]); P.bits(7, 14, ['x......x', 'xx....xx'], { x: c[2] }); for (let j = 0; j < 4; j++) ln(30, 16 + j * 6, 10 + Math.floor(hash(j, 4, sd) * 18), I[j ? 2 : 4]); }
    else if (kd === 'score') { const [a, b] = o.score || [3, 2], c1 = ramp(o.c1 || '#f08aac'), c2 = ramp(o.c2 || '#5ab8e8'); P.rect(4, 12, 26, 30, c1[2]); P.rect(34, 12, 26, 30, c2[2]); P.rect(4, 12, 26, 2, c1[4]); P.rect(34, 12, 26, 2, c2[4]); CY.digits(P, a, 9, 17, 4, '#ffffff'); CY.digits(P, b, 40, 17, 4, '#ffffff'); P.rect(31, 24, 2, 2, I[2]); P.rect(31, 30, 2, 2, I[2]); }
    else if (kd === 'text') for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) { if (hash(i, j, sd + 7) > .82) continue; const x = 6 + i * 4, y = 12 + j * 5, q = Math.floor(hash(i, j, sd + 8) * 4); P.bits(x, y, [['xxx', 'x.x', 'xx.'], ['x.x', 'xxx', '..x'], ['xx.', '.xx', 'xx.'], ['x..', 'xxx', 'x.x']][q], { x: I[j === 0 ? 0 : 2] }); }
    return P; });
  // 記号（16×16。抜き）。o = 色、h ＝ 光、d ＝ かげ
  const SYM = {
    star: ['.......o.......', '......oxo......', '.....oxhxo.....', 'ooooooxhxoooooo', 'oxxxxxxhxxxxxxo', '.oxxxxxxxxxxxo.', '..oxxxxxxxxxo..', '...oxxxxxxxo...', '...oxxxdxxxo...', '..oxxxdodxxxo..', '..oxxdo.odxxo..', '.oxdo.....odxo.', '.ooo.......ooo.'],
    heart: ['..ooo...ooo..', '.oxhxo.oxxxo.', 'oxhxxxoxxxxxo', 'oxxxxxxxxxxxo', 'oxxxxxxxxxxdo', '.oxxxxxxxxdo.', '..oxxxxxxdo..', '...oxxxxdo...', '....oxxdo....', '.....oxo.....', '......o......'],
    note: ['....oooooo', '....oxhhxo', '....oxooxo', '....oxo.oo', '....oxo...', '....oxo...', '.oooxxo...', 'oxhxxxo...', 'oxxxxdo...', '.oxxdo....', '..ooo.....'],
    diamond: ['.....o.....', '....oxo....', '...oxhxo...', '..oxhxxxo..', '.oxhxxxxxo.', 'oxxxxxxxxdo', '.oxxxxxxdo.', '..oxxxxdo..', '...oxxdo...', '....odo....', '.....o.....'],
    excl: ['.oooo.', 'oxhhxo', 'oxhxxo', 'oxxxxo', '.oxxo.', '.oxxo.', '.oxdo.', '..oo..', '......', '.oooo.', '.oxxo.', '.oooo.'],
    quest: ['..oooo..', '.oxhhxo.', 'oxxooxxo', 'oxo..oxo', '.o..oxxo', '...oxxo.', '..oxxo..', '..oxo...', '..ooo...', '........', '..ooo...', '..oxo...', '..ooo...'],
    ring: ['...ooooo...', '..oxhhhxo..', '.oxxoooxxo.', 'oxxo...oxxo', 'oxo.....oxo', 'oxo.....oxo', 'oxo.....oxo', 'oxxo...oxdo', '.oxxoooxdo.', '..oxxxddo..', '...ooooo...'],
    plus: ['...ooo...', '...oho...', '...oxo...', 'ooooxoooo', 'ohhxxxxxo', 'ooooxoooo', '...oxo...', '...odo...', '...ooo...'],
    cross: ['oo.....oo', 'oho...oxo', '.oxo.oxo.', '..oxoxo..', '...oxo...', '..oxoxo..', '.oxo.oxo.', 'oxo...odo', 'oo.....oo'],
    drop: ['....o....', '...oho...', '...oxo...', '..oxhxo..', '.oxhxxxo.', 'oxhxxxxxo', 'oxxxxxxdo', 'oxxxxxxdo', '.oxxxxdo.', '..ooooo..'],
    arrow: ['....o....', '...oxo...', '..oxhxo..', '.oxhxxxo.', 'oooxxxooo', '..oxxxo..', '..oxxxo..', '..oxxdo..', '..oxxdo..', '..ooooo..'],
    moon: ['...oooo..', '..oxhxo..', '.oxhxo...', 'oxhxo....', 'oxxo.....', 'oxxo.....', 'oxxxo....', '.oxxxooo.', '..oxxxxxo', '...ooooo.'] };
  def('sym', .75, (o = {}) => { const P = Px(16); P.clip = true; const rows = SYM[o.kind] || SYM.star, C = ramp(o.c || '#f2a0c4'), ox = Math.floor((16 - rows[0].length) / 2), oy = Math.floor((16 - rows.length) / 2); P.bits(ox, oy, rows, { o: o.edge || C[1], x: C[3], h: C[5], d: C[2] }); return P; }, true);
  // 遠くの塔の町なみ（抜き）。塔は うすいむらさき灰で、窓の点が ならぶ
  def('skyline', 120, (o = {}) => { const P = Px(128, 64); P.clip = true; const c = o.c || '#c0c2d8', hz = o.haze || '#eef0f6', sd = o.seed || 0, lit = o.lit || '#ffffff', L = [mix(c, hz, .6), mix(c, hz, .3), c];
    for (let k = 0; k < 3; k++) { let x = 0; while (x < 128) { const w = 3 + Math.floor(hash(x, k, sd) * [8, 6, 5][k]), h = [16, 26, 36][k] + Math.floor(hash(x, k + 9, sd) * [10, 16, 24][k]) + (hash(x, k + 3, sd) > .9 ? 14 : 0), top = 63 - h, sp = hash(x, k + 5, sd) > .7;
      for (let i = 0; i < w && x + i < 128; i++) for (let y = top; y < 64; y++) { const lx = i, ly = y - top; P.set(x + i, y, ly === 0 ? mix(L[k], '#ffffff', .4) : lx === 0 ? mix(L[k], '#ffffff', .2) : (k === 2 && lx % 2 === 1 && ly % 3 === 1 && hash(x + i, y, sd) > .55) ? lit : L[k]); }
      if (sp) { const cx = x + Math.floor(w / 2); for (let y = top - 6; y < top; y++) P.set(cx, y, L[k]); P.set(cx, top - 7, lit); }
      x += w + (k === 2 ? 1 + Math.floor(hash(x, 7, sd) * 4) : 0); } }
    return P; }, true);
  def('beam', 1, () => { const P = Px(16, 4); P.each(x => { const v = Math.max(0, 1 - Math.abs(x - 7.5) / 8), q = Math.round(255 * Math.pow(v, 1.4)); return '#' + [q, q, q].map(n => n.toString(16).padStart(2, '0')).join(''); }); return P; });
  def('fur', .5, (o = {}) => { const P = Px(16), A = ramp(o.c || '#f4f0f4', 6, { contrast: .6 }); P.each((x, y) => ((x + (y >> 1)) % 4 === 0 ? A[2] : (x * 3 + y) % 7 === 0 ? A[4] : A[3])); return P; });

  // ================= 形 =================
  const secN = (n, sd, jit = .12) => ({ pts: [...Array(n)].map((_, k) => { const a = (k + .5) / n * 2 * PI, rr = 1 + (hash(k, sd, 3) - .5) * 2 * jit; return [-Math.sin(a) * rr, -Math.cos(a) * rr]; }), u: [...Array(n + 1)].map((_, k) => k / n) });
  const fan = (G, sec, r, y, m) => { const n = sec.pts.length; for (let k = 0; k < n; k++) { const a = sec.pts[k], b = sec.pts[(k + 1) % n], A = [a[0] * r, y, a[1] * r], B = [b[0] * r, y, b[1] * r]; G.tri(B, A, [0, y, 0], [B[0] / m, -B[2] / m], [A[0] / m, -A[2] / m], [0, 0]); } };
  CY.isle = (o = {}) => { const r = o.r || 6, dp = o.depth ?? r * .9, n = o.n || 10, sd = o.seed || 0, sec = secN(n, sd), Bp = R.parts(), top = o.top || CY.tex.tile({ seed: sd }), side = o.side || CY.tex.under({ seed: sd }), ur = Math.max(1, Math.round(2 * PI * r / 3));
    fan(Bp.g(top), sec, r, 0, top.userData.m || 3);
    Bp.g(CY.tex.tile({ n: 4, c: '#d8dae6', seed: sd + 1 })).loft(sec, [[-.45, r * 1.0, r * 1.0, 0, .85], [0, r, r, .15, 1]], { ur });   // ふちの板
    Bp.g(side, { emissive: o.lift || '#4a4c62' }).loft(sec, [[-dp, r * .06, r * .06, -dp / 3, .8], [-dp * .72, r * .34, r * .34, -dp * .72 / 3, .86], [-dp * .45, r * .62, r * .62, -dp * .45 / 3, .92], [-dp * .2, r * .86, r * .86, -dp * .2 / 3, .97], [-.45, r * .98, r * .98, 0, 1]], { ur });
    const g = Bp.group(); if (o.rim) { const Gr = R.geo(); Gr.loft(sec, [[-.42, r * 1.012, r * 1.012, 0], [-.3, r * 1.012, r * 1.012, 1]], { ur: n }); const me = new THREE.Mesh(Gr.build(), R.mat(CY.tex.beam(), { glow: true, color: o.rim })); g.add(me); }
    g.userData.r = r; return g; };
  CY.tower = (o = {}) => { const r = o.r || 4, h = o.h || 40, n = o.n || 8, st = o.steps || 3, t = o.tex || CY.tex.wall({ seed: o.seed || 0 }), Bp = R.parts(), W = Bp.g(t, o.glow ? { glow: true } : {}), Lg = Bp.g(CY.tex.tile({ n: 4, seed: 3 })), c = o.c || '#7ad0ec', Gl = Bp.g(CY.tex.beam(), { glow: true, color: c }), sec = R.ngon(n, .5);
    let y = 0, rr = r; for (let i = 0; i < st; i++) { const hh = h / st * (i === 0 ? 1.15 : .92), r2 = rr * .94, ur = Math.max(1, Math.round(2 * PI * rr / 3 / 1.2)); W.loft(sec, [[y, rr, rr, y / 3, .95], [y + hh, r2, r2, (y + hh) / 3, 1.05]], { ur });
      if (o.ledge !== false) { Lg.loft(sec, [[y + hh - .3, r2 * 1.12, r2 * 1.12, 0, .8], [y + hh, r2 * 1.12, r2 * 1.12, .1, 1]], { cap: 'top', capRect: true, ur: 4 }); Gl.loft(sec, [[y + hh - .6, r2 * 1.01, r2 * 1.01, 0], [y + hh - .35, r2 * 1.01, r2 * 1.01, 1]], { ur: n }); }
      y += hh; rr = r2 * .74; }
    if (o.spire !== false) { W.loft(sec, [[y, rr * .9, rr * .9, 0, 1], [y + h * .14, rr * .12, rr * .12, 1, 1.1]], { ur: 1 }); Gl.loft(6, [[y + h * .14, .5, .5, 0], [y + h * .14 + 1.6, .02, .02, 1]], {}).loft(6, [[y + h * .14 - 1.2, .02, .02, 0], [y + h * .14, .5, .5, 1]], {}); y += h * .14 + 1.6; }
    const g = Bp.group(); g.userData.top = y; return g; };
  CY.board = (o = {}) => { const w = o.w || 2, h = o.h || 1.5, g = new THREE.Group(), t = CY.tex.board({ kind: o.kind, c: o.c, bg: o.bg, ink: o.ink, seed: o.seed, score: o.score, c1: o.c1, c2: o.c2 }), G = R.geo();
    G.quad([-w / 2, 0, 0], [w / 2, 0, 0], [w / 2, h, 0], [-w / 2, h, 0]); let m;
    if (o.opacity != null && o.opacity < 1) { m = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: o.opacity, side: THREE.DoubleSide, depthWrite: false, vertexColors: true }); m.onBeforeCompile = snap; } else m = R.mat(t, { glow: true, side: true, vc: true });
    const face = new THREE.Mesh(G.build(), m); g.add(face); g.userData.face = face;
    if (o.frame !== false && !(o.opacity < 1)) { const F = R.geo(); F.quad([w / 2, 0, -.04], [-w / 2, 0, -.04], [-w / 2, h, -.04], [w / 2, h, -.04], [0, 0, w / 2, h / 2], .85); g.add(F.mesh(CY.tex.tile({ n: 4, c: '#d4d6e2', seed: 9 }))); }
    return g; };
  CY.lines = (segs, o = {}) => { const G = R.geo(), w = o.w || .12, mode = o.mode || 'flat', v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), s = new THREE.Vector3();
    for (const [a, b] of segs) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B); v.subVectors(B, A).normalize();
      const add = side => { const p0 = A.clone().addScaledVector(side, -w / 2), p1 = A.clone().addScaledVector(side, w / 2), p2 = B.clone().addScaledVector(side, w / 2), p3 = B.clone().addScaledVector(side, -w / 2); G.quad(p0.toArray(), p1.toArray(), p2.toArray(), p3.toArray(), [0, 0, 1, len]); };
      if (mode !== 'up') { s.crossVectors(v, up); if (s.lengthSq() < 1e-4) s.set(1, 0, 0); s.normalize(); add(s.clone()); }
      if (mode !== 'flat') { s.crossVectors(v, up); if (s.lengthSq() < 1e-4) s.set(1, 0, 0); const u2 = new THREE.Vector3().crossVectors(s, v).normalize(); add(u2); } }
    const m = new THREE.MeshBasicMaterial({ map: CY.tex.beam(), color: o.c || '#7ad0ec', transparent: true, opacity: o.k ?? 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: o.fog ?? true, vertexColors: true }); m.onBeforeCompile = snap;
    const me = new THREE.Mesh(G.build(), m); me.renderOrder = 2; return me; };
  CY.packets = (pts, o = {}) => { const n = o.n || 6, V = pts.map(p => new THREE.Vector3(...p)), acc = [0]; for (let i = 1; i < V.length; i++) acc.push(acc[i - 1] + V[i].distanceTo(V[i - 1])); const L = acc[acc.length - 1];
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pt = new THREE.Points(geo, new THREE.PointsMaterial({ color: o.c || '#ffffff', size: o.s || .35, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: o.fog ?? true })); pt.frustumCulled = false;
    const at = d => { d = o.loop === false ? Math.min(L, d) : ((d % L) + L) % L; let i = 1; while (i < acc.length - 1 && acc[i] < d) i++; const k = (d - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1); return V[i - 1].clone().lerp(V[i], k); };
    const tick = t => { for (let i = 0; i < n; i++) { const p = at(t * (o.speed || 6) + i / n * L + (o.off || 0)); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; } geo.attributes.position.needsUpdate = true; };
    tick(0); pt.userData = { tick, dyn: true, at, len: L }; CY.live.push(tick); return pt; };
  CY.backdrop = (o = {}) => { const r = o.r || 300, h = o.h || r * .3, t = CY.tex.skyline({ c: o.c, haze: o.haze, lit: o.lit, seed: o.seed }), g = new THREE.CylinderGeometry(r, r, h, 32, 1, true), u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setX(i, u.getX(i) * (o.rep || 5));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, alphaTest: .5, side: THREE.BackSide, fog: false, color: o.tint || '#ffffff' })); m.position.y = (o.y ?? -1) + h / 2; return m; };

  // ================= アバターの付けもの（R.actor の関節に付ける） =================
  const tube = (G, pts, rs, N = 5) => { const V = pts.map(p => new THREE.Vector3(...p)), X = new THREE.Vector3(1, 0, 0), rings = [];
    for (let i = 0; i < V.length; i++) { const t = V[Math.min(V.length - 1, i + 1)].clone().sub(V[Math.max(0, i - 1)]).normalize(), nn = new THREE.Vector3().crossVectors(t, X).normalize(), ring = []; for (let k = 0; k <= N; k++) { const a = k / N * 2 * PI; ring.push(V[i].clone().addScaledVector(X, Math.cos(a) * rs[i]).addScaledVector(nn, Math.sin(a) * rs[i]).toArray()); } rings.push(ring); }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < N; k++) G.quad(rings[i][k], rings[i][k + 1], rings[i + 1][k + 1], rings[i + 1][k], [k / N, i / (rings.length - 1), (k + 1) / N, (i + 1) / (rings.length - 1)], [.85 + .15 * Math.cos(k / N * 2 * PI), .85 + .15 * Math.cos((k + 1) / N * 2 * PI), .85 + .15 * Math.cos((k + 1) / N * 2 * PI), .85 + .15 * Math.cos(k / N * 2 * PI)]);
    const e = V[V.length - 1]; return G; };
  CY.wear = (actor, kind, o = {}) => { const J = actor.userData.J, D = actor.userData.build, Hd = D.head, HW = D.hw * Hd, Bp = R.parts(), g = new THREE.Group(), c = o.c || '#f4f0f4', c2 = o.c2 || '#f4b0c8';
    if (kind === 'ears') { const k = o.kind || 'cat', dims = { cat: [.42, .26, .28, .62], fox: [.55, .3, .2, .6], rabbit: [1.05, .15, .08, .4], bear: [.2, .2, .5, .7] }[k] || [.42, .26, .28, .62], [eh, eb, tilt, ex] = dims, O = Bp.g(CY.tex.fur({ c })), In = Bp.g(CY.tex.fur({ c: c2 }));
      for (const sx of [-1, 1]) { const M = R.TR(sx * HW * ex, Hd * .9, -.04 * HW, 0, k === 'rabbit' ? -.25 : 0, -sx * tilt); O.at(M); In.at(M);
        if (k === 'bear') { O.loft(6, [[0, eb * HW, eb * HW * .6, 0, .9], [eh * Hd * .6, eb * HW * 1.05, eb * HW * .62, .6, 1], [eh * Hd, eb * HW * .5, eb * HW * .4, 1, 1.05]], { cap: 'top' }); In.at(R.TR(sx * HW * ex, Hd * .9, -.04 * HW + eb * HW * .62, 0, 0, -sx * tilt)).loft(6, [[eh * Hd * .15, eb * HW * .6, .01, 0, 1], [eh * Hd * .75, eb * HW * .5, .01, 1, 1]], {}); }
        else { O.loft(4, [[0, eb * HW, eb * HW * .45, 0, .9], [eh * Hd * (k === 'rabbit' ? .75 : .5), eb * HW * (k === 'rabbit' ? 1.05 : .62), eb * HW * .3, .6, 1], [eh * Hd, .01, .01, 1, 1.05]], { rot: 0 }); In.tri([-eb * HW * .55, eh * Hd * .12, eb * HW * .3], [eb * HW * .55, eh * Hd * .12, eb * HW * .3], [0, eh * Hd * .82, eb * HW * .2]); } }
      O.at(null); In.at(null); Bp.group().children.forEach(m => g.add(m)); J.head.add(g); }
    else if (kind === 'tail') { const k = o.kind || 'cat', O = Bp.g(CY.tex.fur({ c })), Tp = Bp.g(CY.tex.fur({ c: c2 })), z0 = -D.hipD * 1.0, y0 = -.02;
      if (k === 'rabbit') { O.at(R.TR(0, y0, z0 - .03)).loft(6, [[-.06, .02, .02, 0, .8], [-.03, .075, .075, .3, 1], [.04, .07, .07, .7, 1.05], [.07, .02, .02, 1, 1.1]], { cap: 'top' }).at(null); }
      else if (k === 'fox') { tube(O, [[0, y0, z0], [0, y0 - .06, z0 - .12], [0, y0 - .06, z0 - .26], [0, y0 + .02, z0 - .4]], [.04, .09, .11, .09], 6); tube(Tp, [[0, y0 + .02, z0 - .4], [0, y0 + .1, z0 - .5], [0, y0 + .2, z0 - .53]], [.09, .06, .01], 6); }
      else { tube(O, [[0, y0, z0], [0, y0 - .05, z0 - .14], [0, y0 + .02, z0 - .3], [0, y0 + .2, z0 - .38], [0, y0 + .36, z0 - .34]], [.032, .03, .028, .026, .02], 5); tube(Tp, [[0, y0 + .36, z0 - .34], [0, y0 + .44, z0 - .28]], [.02, .005], 5); }
      const pv = new THREE.Group(); pv.position.set(0, 0, 0); Bp.group().children.forEach(m => pv.add(m)); g.add(pv); J.hips.add(g); const ph = hash(actor.id, 3) * 6;
      CY.live.push(t => { pv.rotation.y = Math.sin(t * (k === 'cat' ? 2.2 : 3) + ph) * (k === 'rabbit' ? .1 : .35); pv.rotation.x = Math.sin(t * 1.3 + ph) * .08; }); }
    else if (kind === 'halo') { const r1 = HW * 1.0, r2 = HW * .78, G = R.geo(), n = 12, y = Hd * 1.32; for (let i = 0; i < n; i++) { const a0 = i / n * 2 * PI, a1 = (i + 1) / n * 2 * PI; G.quad([Math.cos(a0) * r2, y, Math.sin(a0) * r2], [Math.cos(a0) * r1, y, Math.sin(a0) * r1], [Math.cos(a1) * r1, y, Math.sin(a1) * r1], [Math.cos(a1) * r2, y, Math.sin(a1) * r2], [0, 0, 1, 1]); }
      const m = new THREE.MeshBasicMaterial({ map: CY.tex.beam(), color: o.c || '#f8e070', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }); m.onBeforeCompile = snap; g.add(new THREE.Mesh(G.build(), m)); J.head.add(g); const ph = hash(actor.id, 5) * 6; CY.live.push(t => { g.position.y = Math.sin(t * 2 + ph) * .015; g.rotation.y = t * .8; }); }
    else if (kind === 'mark') { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: CY.tex.sym({ kind: o.kind || 'star', c: o.c }), alphaTest: .5, fog: true })), s = o.s || .3; sp.scale.set(s, s, 1); g.add(sp); g.position.y = Hd * 1.75; J.head.add(g); const ph = hash(actor.id, 7) * 6; CY.live.push(t => { sp.position.y = Math.sin(t * 2.4 + ph) * .04; }); g.userData.sprite = sp; }
    return g; };
  return CY;
};
