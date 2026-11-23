// 第 12 集「白い電脳世界」（41〜45）で使い回す部品。game-looks-7 の kit.js・retro.js と game-looks-8 の pack-fantasy-wild.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), FW = PACK_FWILD(THREE, K, R), CY = PACK_CYBER1(THREE, K, R, FW);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。決まりも同じ（足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'）。
// ■ 考え方：白とうすい灰の世界。白がとばないよう、もとの色は「少し灰をおびた白」にして、目地・面取り・かげを 青むらさき寄りの段で打つ。
//   差し色はうすいミント・水色・もも・レモン（CY.AC）。光る物（線・窓の板・記号）だけが、明るい色で光る。ブラウン管の bloom は .12 ほどに下げて使う。
// ■ 動く物は作ったときに CY.live に入る。毎コマ CY.tick(t) を 1 回呼べば全部動く（R.merge に入れない物だけ。動く物には userData.dyn = true）。
//
// ■ テクスチャ  CY.tex.名前({ … }) → THREE.Texture（同じ引数なら同じ物）
//   floor { c, ac, kind: 'tile'（4×4 の板）/'ring'（同心の輪の板。広場）/'path'（光の目地の通路）, seed }   床。64 ドット＝4 m
//   panel { c, ac, kind: 'win'（窓の列）/'fin'（たてのひれ）/'band'（光る帯）, seed }   塔やかべの面。64 ドット＝6 m
//   under { c, ac, seed }   浮かぶ島の下がわ（白い結晶の岩と光の回路）
//   screen { ac, kind: 'map'/'list'/'icon'/'chart'/'face'/'wave', seed }   窓のように浮かぶ板の画面（64×40。字は書かず、記号と棒と点）
//   glyph { kind, c }   記号 16×16（抜き）。kind: 'star' 'heart' 'diamond' 'ring' 'plus' 'note' 'tri' 'arrow' 'drop' 'paw' 'fish' 'moon'
//   beam { c }   光の線（加算。よこに流れる点線）   fur { c, c2 }   耳・しっぽの毛（16×16）
// ■ 物
//   CY.avatar({ …R.actor の引数, ears: 'cat'/'fox'/'bunny'/'bear'/'horn'/'antenna', earC, earIn, tail: 'cat'/'fox'/'bunny'/'dragon', tailC, icon: glyph の kind, iconC, ring: 色 }) → R.actor
//     いろいろな姿のアバター（5 頭身の toon に、動物の耳・しっぽ・頭の上の記号・頭の輪）。しっぽと記号は CY.tick で動く
//   CY.board({ w, h, ac, kind（screen の kind）, seed, stand: 足の長さ（0 で浮かぶ） }) → Group   窓のように浮かぶ板（わくと光る画面。ゆっくり上下）
//   CY.island({ r, h, seed, top（床のテクスチャ）, ac, rim: true }) → Group   浮かぶ島（原点は上の面のまん中。ふちに光る輪）
//   CY.tower({ kind: 'slab'/'round'/'twist'/'spire'/'stack'/'halo', h, r, c, ac, seed, m（かべの絵 1 枚が何 m か。遠くの大きな塔は 20 ほどに） }) → Group   巨大な塔（userData.h）
//   CY.line(点の列 [[x,y,z],…], { c, w, speed, rep, add }) → Mesh   光の線（十字の帯で流れる。白い地では加算だと消えるので、既定はふつうの光る色。add: true で加算）
//   CY.pod({ c, ac, s }) → Group   空を行く小さな乗りもの（+z が前。うしろに光の尾）
//   CY.glyphSprite(kind, c, s) → Sprite   いつもこちらを向く記号（加算）
//   CY.halo(色, 大きさ, 濃さ) → Sprite   にじみ（FW.halo と同じ）
window.PACK_CYBER1 = (THREE, K, R, FW) => {
  const { hash } = K, T = R.tex, TR = R.TR, PI = Math.PI, TAU = PI * 2, CY = { live: [] };
  FW = FW || window.PACK_FWILD(THREE, K, R);
  const AC = CY.AC = { mint: '#6fd8c0', sky: '#78b4f0', pink: '#f08cb8', lemon: '#f0d468', lilac: '#a898f0', peach: '#f8b088' };
  const WH = CY.WH = '#e4e6ee';   // もとの白（少し灰をおびた白。そのまま白くするととぶ）
  const cache = new Map(), mk = (name, fn) => (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) { t = fn(o); cache.set(k, t); } return t; };
  const tex = CY.tex = {};

  // ---- 床：面取りした白い板。目地は青むらさきの細い線、ところどころに光の点と回路 ----
  tex.floor = mk('floor', (o) => { const P = R.Px(64), A = R.ramp(o.c || WH, 7, { contrast: .55 }), Q = R.ramp(o.ac || AC.sky, 6), sd = o.seed || 0, kind = o.kind || 'tile';
    P.each((x, y) => { const n = hash(x >> 2, y >> 2, sd); return n > .9 ? A[5] : n < .12 ? A[3] : A[4]; });
    if (kind === 'ring') { for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const tx = x % 32, ty = y % 32; P.set(x, y, (tx + ty) % 2 ? A[4] : A[4]); } }
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = i * 16, y = j * 16, lv = hash(i, j, sd + 3) > .7 ? 3 : 4; P.block(x, y, 16, 16, A, lv, { hi: 1, lo: 1 }); P.rect(x + 1, y + 1, 14, 14, hash(i, j, sd + 4) > .5 ? A[lv] : A[lv]);
      for (let k = 2; k < 14; k++) { P.set(x + 1, y + k, A[6]); P.set(x + k, y + 1, A[6]); P.set(x + 14, y + k, A[2]); P.set(x + k, y + 14, A[2]); }
      P.set(x, y, A[1]); for (let k = 0; k < 16; k++) { P.set(x + k, y + 15, A[1]); P.set(x + 15, y + k, A[1]); }
      const r = hash(i, j, sd + 5);
      if (kind === 'path' && j % 2 === 0) { for (let k = 2; k < 14; k++) P.set(x + k, y + 8, k % 3 ? Q[4] : Q[5]); }
      else if (r > .78) { P.rect(x + 4, y + 4, 8, 8, A[3]); P.rect(x + 5, y + 5, 6, 6, A[5]); P.rect(x + 7, y + 7, 2, 2, Q[4]); }            // まん中の くぼみと光
      else if (r > .55) { const yy = y + 4 + Math.floor(hash(i, j, sd + 6) * 7); P.line(x + 3, yy, x + 9, yy, A[2]); P.line(x + 9, yy, x + 12, yy + 3, A[2]); P.set(x + 3, yy, Q[3]); P.set(x + 12, yy + 3, Q[4]); P.set(x + 12, yy + 4, A[2]); }   // 回路の線
      else if (r > .45) { P.set(x + 3, y + 3, Q[4]); P.set(x + 12, y + 3, Q[4]); P.set(x + 3, y + 12, Q[4]); P.set(x + 12, y + 12, Q[4]); } }
    if (kind === 'ring') for (let k = 0; k < 64; k++) { P.set(k, 31, Q[3]); P.set(k, 32, Q[5]); P.set(k, 33, Q[3]); }   // 輪の光の目地（R.ground の mix と合わせて使う）
    return T.from(P, { m: o.m || 4 }); });

  // ---- 塔のかべ：白い板のはり合わせ。窓の列・ひれ・光る帯 ----
  tex.panel = mk('panel', (o) => { const P = R.Px(64), A = R.ramp(o.c || WH, 7, { contrast: .6 }), G = R.ramp(o.glass || '#9cb4d8', 6, { contrast: .8 }), Q = R.ramp(o.ac || AC.mint, 6), sd = o.seed || 0, kind = o.kind || 'win';
    P.each((x, y) => (hash(x >> 3, y >> 3, sd) > .85 ? A[3] : A[4]));
    for (let x = 0; x < 64; x += 8) for (let y = 0; y < 64; y++) { P.set(x, y, A[1]); P.set(x + 1, y, A[5]); P.set(x + 7, y, A[2]); }   // たての板の目地
    for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x++) { P.set(x, y, A[1]); P.set(x, y + 1, A[6]); P.set(x, y + 15, A[2]); }   // 階のつぎ目
    if (kind === 'win') for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x += 8) { const lit = hash(x, y, sd + 2) > .8; P.rect(x + 2, y + 5, 5, 7, lit ? Q[5] : G[2]); P.rect(x + 2, y + 5, 5, 1, G[0]); P.rect(x + 2, y + 6, 1, 6, G[1]); if (!lit) { P.set(x + 5, y + 7, G[4]); P.set(x + 4, y + 8, G[4]); P.set(x + 3, y + 9, G[3]); } P.rect(x + 2, y + 12, 5, 1, A[6]); }
    if (kind === 'fin') for (let x = 0; x < 64; x += 16) for (let y = 0; y < 64; y++) { P.set(x + 3, y, A[6]); P.set(x + 4, y, A[5]); P.set(x + 5, y, A[2]); P.set(x + 6, y, A[1]); if (y % 16 === 8) { P.set(x + 9, y, Q[4]); P.set(x + 10, y, Q[5]); } }
    if (kind === 'band') for (let y = 0; y < 64; y += 16) for (let x = 0; x < 64; x++) { P.set(x, y + 7, Q[3]); P.set(x, y + 8, (x >> 2) % 3 ? Q[5] : '#ffffff'); P.set(x, y + 9, Q[3]); P.set(x, y + 10, A[2]); }
    for (let k = 0; k < 10; k++) { const x = Math.floor(hash(k, 4, sd) * 60), y = Math.floor(hash(k, 5, sd) * 60); P.set(x, y, A[2]); P.set(x + 1, y, A[3]); }   // 小さなしみ
    return T.from(P, { m: o.m || 6 }); });

  // ---- 島の下がわ：白い結晶の岩。ななめの割れ目と、光る回路のすじ ----
  tex.under = mk('under', (o) => { const P = R.Px(64), A = R.ramp(o.c || '#d4d6e2', 7, { contrast: .8 }), Q = R.ramp(o.ac || AC.sky, 6), sd = o.seed || 0;
    P.each((x, y) => { const c = Math.floor((x + y * .5 + hash(x >> 3, y >> 4, sd) * 8) / 9), f = (x + y * .5 + hash(x >> 3, y >> 4, sd) * 8) % 9; return f < 1 ? A[1] : f < 2 ? A[5] : f > 7 ? A[2] : (c + (y >> 4)) % 3 === 0 ? A[3] : A[4]; });
    for (let k = 0; k < 4; k++) { let x = Math.floor(hash(k, 1, sd) * 64), y = 0; while (y < 64) { P.set(x - 1, y, Q[2]); P.set(x, y, Q[5]); P.set(x + 1, y, Q[3]); y++; if (hash(x, y, sd + k) > .82) { for (let i = 0; i < 4; i++) { x++; P.set(x, y, Q[4]); } P.set(x + 1, y, Q[5]); } } }
    return T.from(P, { m: o.m || 5 }); });

  // ---- 雲の海：もこもこの丸いかたまりを重ね、下の半分に青むらさきの影（R.ground の layers に。64 ドット＝16 m） ----
  tex.cloudsea = mk('cloudsea', (o) => { const P = R.Px(64), A = R.ramp(o.c || '#eceaf2', 7, { contrast: .7 }), sd = o.seed || 0; P.each(() => A[3]);
    const puffs = []; for (let k = 0; k < 26; k++) puffs.push([hash(k, 1, sd) * 64, hash(k, 2, sd) * 64, 4 + hash(k, 3, sd) * 7]);
    puffs.sort((a, b) => a[1] - b[1]);
    for (const [cx, cy, r] of puffs) for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const dx = x + .5 - cx, dy = y + .5 - cy, d = Math.hypot(dx, dy) / r; if (d > 1) continue; const l = -dx * .5 - dy * .8; P.set(x, y, d > .86 ? A[1] : l > r * .45 ? A[6] : l > r * .1 ? A[5] : l > -r * .3 ? A[4] : A[2]); }
    return T.from(P, { m: o.m || 16 }); });

  // ---- データの川：うすい水色の地に、流れの向き（v）へのびる光のすじと、四角い粒（光る材質ではり、offset.y を送って流す。64 ドット＝4 m） ----
  tex.river = mk('river', (o) => { const P = R.Px(64), A = R.ramp(o.c || '#9cc8ec', 7, { contrast: .8 }), Q = R.ramp(o.ac || AC.mint, 6), sd = o.seed || 0;
    P.each((x, y) => { const n = Math.sin(x * .35 + Math.sin(y * .1 * Math.PI * 2 / 6.4) * 2) ; return n > .7 ? A[4] : n < -.6 ? A[2] : A[3]; });
    for (let k = 0; k < 14; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64), L = 6 + Math.floor(hash(k, 3, sd) * 16), c = k % 3 ? A[6] : Q[5]; for (let i = 0; i < L; i++) { P.set(x, y + i, i < 2 ? '#ffffff' : c); if (i > L - 4) P.set(x, y + i, A[5]); } }
    for (let k = 0; k < 22; k++) { const x = Math.floor(hash(k, 5, sd) * 62), y = Math.floor(hash(k, 6, sd) * 62), c = [Q[5], A[6], AC.pink, '#ffffff'][k % 4]; P.rect(x, y, 2, 2, c); P.set(x + 2, y + 1, A[1]); P.set(x + 1, y + 2, A[1]); }
    for (let k = 0; k < 18; k++) { const x = Math.floor(hash(k, 8, sd) * 64), y = Math.floor(hash(k, 9, sd) * 64); P.set(x, y, A[0]); P.set(x + 1, y, A[1]); }
    return T.from(P, { m: o.m || 4 }); });

  // ---- 浮かぶ板の画面（64×40）。うすい地に、差し色の見出しの帯・記号・棒・点。字は書かない ----
  tex.screen = mk('screen', (o) => { const P = R.Px(64, 40), Q = R.ramp(o.ac || AC.sky, 6), A = R.ramp('#eef2f8', 6, { contrast: .5 }), sd = o.seed || 0, kind = o.kind || 'list'; P.clip = true;
    P.each((x, y) => ((x + y) % 2 ? A[4] : A[5])); P.rect(0, 0, 64, 7, Q[3]); P.rect(0, 6, 64, 1, Q[2]); for (let x = 2; x < 30; x += 4) P.rect(x, 2, 3, 3, x < 10 ? '#ffffff' : Q[5]); P.rect(56, 2, 3, 3, '#ffffff'); P.rect(51, 2, 3, 3, Q[5]);
    const ink = Q[1], mid = Q[2];
    if (kind === 'list') for (let r = 0; r < 5; r++) { const y = 10 + r * 6; P.rect(3, y, 4, 4, r % 2 ? Q[4] : AC.pink); P.rect(10, y + 1, 18 + Math.floor(hash(r, 1, sd) * 22), 2, r === 1 ? ink : mid); }
    if (kind === 'chart') { for (let i = 0; i < 9; i++) { const h = 6 + Math.floor(hash(i, 2, sd) * 20); P.rect(4 + i * 6, 36 - h, 4, h, i % 3 === 1 ? AC.pink : Q[3]); P.rect(4 + i * 6, 36 - h, 4, 1, Q[5]); } P.rect(2, 36, 60, 1, ink); }
    if (kind === 'map') { for (let y = 9; y < 38; y++) for (let x = 2; x < 62; x++) if ((x % 8 === 0) || (y % 8 === 1)) P.set(x, y, Q[4]); P.disc(22, 22, 6, Q[2]); P.disc(22, 22, 4, Q[4]); P.disc(44, 28, 5, AC.mint); P.line(22, 22, 44, 28, ink); P.disc(38, 15, 2, AC.pink); }
    if (kind === 'icon') for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const x = 5 + c * 15, y = 11 + r * 14, cc = [Q[3], AC.pink, AC.mint, AC.lemon][(r * 4 + c) % 4]; P.rect(x, y, 10, 10, cc); P.rect(x, y, 10, 1, '#ffffff'); P.rect(x + 3, y + 3, 4, 4, '#ffffff'); }
    if (kind === 'wave') for (let x = 2; x < 62; x++) { const y = 23 + Math.round(Math.sin(x * .3 + sd) * 7 * Math.sin(x * .05 + 1)); P.set(x, y, ink); P.set(x, y + 1, mid); P.set(x, 23, x % 2 ? Q[4] : null); }
    if (kind === 'face') { P.disc(32, 24, 12, AC.lemon); P.disc(32, 24, 10, '#fff4c8'); P.rect(27, 20, 2, 4, ink); P.rect(36, 20, 2, 4, ink); P.line(27, 28, 30, 30, ink); P.line(30, 30, 34, 30, ink); P.line(34, 30, 37, 28, ink); P.rect(24, 26, 3, 2, AC.pink); P.rect(38, 26, 3, 2, AC.pink); }
    for (let x = 0; x < 64; x++) { P.set(x, 39, Q[1]); } for (let y = 0; y < 40; y++) { P.set(0, y, Q[1]); P.set(63, y, Q[1]); }
    return T.from(P, { m: 1 }); });

  // ---- 記号（16×16、抜き）。白いふちどり＋差し色。頭の上・花火・魚 ----
  const GLY = {
    star: ['.......#........', '......###.......', '......###.......', '.....#####......', '#################', '.###########....', '..#########.....', '...#######......', '...#######......', '..####.####.....', '..###...###.....', '.##.......##....'],
    heart: ['..###...###.....', '.#####.#####....', '#############...', '#############...', '#############...', '.###########....', '..#########.....', '...#######......', '....#####.......', '.....###........', '......#.........'],
    diamond: ['.....#.....', '....###....', '...#####...', '..#######..', '.#########.', '###########', '.#########.', '..#######..', '...#####...', '....###....', '.....#.....'],
    ring: ['....#####....', '..#########..', '.####...####.', '.###.....###.', '###.......###', '###.......###', '###.......###', '.###.....###.', '.####...####.', '..#########..', '....#####....'],
    plus: ['....###....', '....###....', '....###....', '###########', '###########', '###########', '....###....', '....###....', '....###....'],
    note: ['......######', '......######', '......##..##', '......##..##', '......##..##', '......##..##', '..####..####', '.#####.#####', '.#####.#####', '..###...###.'],
    tri: ['.....#.....', '....###....', '....###....', '...#####...', '...#####...', '..#######..', '..#######..', '.#########.', '###########'],
    arrow: ['....#....', '...###...', '..#####..', '.#######.', '#########', '...###...', '...###...', '...###...', '...###...'],
    drop: ['....#....', '....#....', '...###...', '..#####..', '.#######.', '#########', '#########', '.#######.', '..#####..'],
    paw: ['.##...##.', '####.####', '.##...##.', '##.....##', '##.###.##', '..#####..', '.#######.', '.#######.', '..##.##..'],
    fish: ['....####.....##', '..########..###', '.###########.##', '#.##########.#.', '############...', '.###########.#.', '..########..###', '....####.....##'],
    moon: ['...#####..', '.####.....', '####......', '###.......', '###.......', '###.......', '####......', '.####.....', '...#####..'] };
  tex.glyph = mk('glyph', (o) => { const P = R.Px(16), rows = GLY[o.kind || 'star'], Q = R.ramp(o.c || AC.pink, 6), h = rows.length, w = Math.max(...rows.map(r => r.length)), ox = Math.floor((16 - w) / 2), oy = Math.floor((16 - h) / 2); P.clip = true;
    const on = (x, y) => rows[y] && rows[y][x] === '#';
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) { if (on(x, y)) continue; let n = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (on(x + dx, y + dy)) n = true; if (n) P.set(ox + x, oy + y, '#ffffff'); }   // 白いふち
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) P.set(ox + x, oy + y, !on(x, y - 1) || !on(x - 1, y) ? Q[5] : !on(x, y + 1) || !on(x + 1, y) ? Q[2] : Q[3]);
    if (o.kind === 'fish') { P.set(ox + 3, oy + 3, '#3a3a5a'); }
    return T.from(P, { m: 1, cut: true }); });

  // ---- 光の線：よこに流れる点の列（加算で使う 32×8） ----
  tex.beam = mk('beam', (o) => { const P = R.Px(32, 8), Q = R.ramp(o.c || AC.sky, 6); P.clip = true;
    for (let x = 0; x < 32; x++) { const k = x < 12 ? x / 12 : 0; const c = k > .7 ? '#ffffff' : k > .3 ? Q[5] : k > 0 ? Q[4] : Q[2]; P.set(x, 3, c); P.set(x, 4, c); if (k > .3) { P.set(x, 2, Q[3]); P.set(x, 5, Q[3]); } else { P.set(x, 2, Q[1]); P.set(x, 5, Q[1]); } P.set(x, 1, Q[0]); P.set(x, 6, Q[0]); }
    const t = T.from(P, { m: 1 }); return t; });

  tex.fur = mk('fur', (o) => { const P = R.Px(16), A = R.ramp(o.c || '#f0e8e0', 6, { contrast: .7 }), B = R.ramp(o.c2 || '#f4b0c4', 6, { contrast: .6 });
    P.each((x, y) => (x < 8 ? (hash(x, y >> 1, 3) > .7 ? A[2] : (x + y) % 5 === 0 ? A[4] : A[3]) : (x === 8 || x === 15 ? A[2] : y < 3 ? A[3] : B[3 + (hash(x, y, 1) > .7 ? 1 : 0)])));
    for (let x = 0; x < 8; x++) { P.set(x, 0, A[5]); P.set(x, 15, A[1]); }
    return T.from(P, { m: 1 }); });

  // ---- 光る材質 ----
  const glow = (t, o) => FW.glowMat(t, o), add = (t, o = {}) => FW.glowMat(t, { add: true, ...o });
  CY.halo = (c, s, a) => FW.halo(c, s, a);
  CY.glyphSprite = (kind, c, s = .3, o = {}) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.glyph({ kind, c }), alphaTest: .5, fog: o.fog ?? true, depthWrite: true })); sp.scale.setScalar(s); return sp; };

  // ---- アバター：toon に、耳・しっぽ・頭の上の記号・頭の輪 ----
  CY.avatar = (o = {}) => { const a = R.actor({ build: 'toon', ...o }), J = a.userData.J, Hd = .285 * (o.s || 1) / (o.s || 1), HW = Hd * .47;
    const ft = tex.fur({ c: o.earC || o.hair || '#f0e8e0', c2: o.earIn || '#f4b0c4' }), m = R.mat(ft, { vc: true, side: true }), G = R.geo();
    const out = [0, 0, 8 / 16, 1], inn = [9 / 16, 0, 15 / 16, 1];
    const ear = (sx, kind) => { const x = sx * HW * .62, y = Hd * .98;
      if (kind === 'cat' || kind === 'fox') { const L = kind === 'fox' ? .17 : .11, W = kind === 'fox' ? .065 : .055, b0 = [x - W, y - .01, .005], b1 = [x + W, y - .01, .005], bb = [x, y - .02, -.05], tip = [x + sx * .03, y + L, -.012];
        G.rect(...inn).tri(sx > 0 ? b0 : b1, sx > 0 ? b1 : b0, tip, [0, 0], [1, 0], [.5, 1]); G.rect(...out).tri(b1, bb, tip, [0, 0], [1, 0], [.5, 1], .8).tri(bb, b0, tip, [0, 0], [1, 0], [.5, 1], .8).tri(sx > 0 ? b1 : b0, sx > 0 ? b0 : b1, tip, [0, 0], [1, 0], [.5, 1], .7); }
      if (kind === 'bunny') { G.at(TR(x * .8, y - .02, -.01, sx * .1, -.15, -sx * .12)); G.rect(...out).loft(5, [[0, .028, .018, 0, .9], [.12, .036, .02, .5, 1], [.27, .026, .014, .9, 1], [.3, .004, .004, 1, 1]], {}); G.rect(...inn).quad([-.02, .03, .021], [.02, .03, .021], [.018, .24, .016], [-.018, .24, .016]); G.at(null); }
      if (kind === 'bear') { G.at(TR(x * 1.05, y - .03, -.02, 0, PI / 2)); G.rect(...out).loft(7, [[-.015, .045, .045, 0, .9], [.015, .045, .045, 1, 1]], { cap: 'both' }); G.rect(...inn).loft(7, [[.016, .028, .028, 0, 1], [.018, .028, .028, 1, 1]], { cap: 'top' }); G.at(null); }
      if (kind === 'horn') { G.at(TR(x * .8, y - .03, .01, 0, -.3, -sx * .35)); G.rect(...out).loft(5, [[0, .025, .025, 0, 1], [.09, .015, .015, .6, 1.05], [.13, .002, .002, 1, 1.1]], {}); G.at(null); }
      if (kind === 'antenna') { G.at(TR(x * .7, y - .01, 0, 0, 0, -sx * .25)); G.rect(...out).loft(4, [[0, .008, .008, 0, 1], [.16, .008, .008, 1, 1]], {}).at(null); } };
    if (o.ears) { ear(-1, o.ears); ear(1, o.ears); const em = new THREE.Mesh(G.build(), m); em.castShadow = true; J.head.add(em);
      if (o.ears === 'antenna') for (const sx of [-1, 1]) { const b = CY.glyphSprite('diamond', o.iconC || AC.mint, .07); b.position.set(sx * HW * .62 + sx * .04, Hd * .98 + .16, 0); J.head.add(b); } }
    if (o.tail) { const tg = R.geo(), k = o.tail, tm = R.mat(tex.fur({ c: o.tailC || o.earC || o.hair || '#f0e8e0', c2: o.tailTip || '#ffffff' }), { vc: true, smooth: true }), pv = new THREE.Group();
      if (k === 'bunny') tg.rect(...inn).loft(6, [[-.05, .01, .01, 0, .9], [-.02, .06, .06, .3, 1], [.04, .055, .055, .7, 1.05], [.07, .01, .01, 1, 1]], {});
      else { const pts = k === 'fox' ? [[0, 0, 0, .03], [0, -.02, -.08, .075], [0, .03, -.2, .09], [0, .12, -.3, .07], [0, .2, -.33, .01]] : k === 'dragon' ? [[0, 0, 0, .06], [0, -.1, -.14, .05], [0, -.18, -.3, .035], [0, -.2, -.45, .01]] : [[0, 0, 0, .018], [0, -.06, -.1, .016], [0, .02, -.22, .016], [0, .16, -.27, .015], [0, .26, -.22, .012]];
        tg.rect(...out); FW.tube(tg, pts, 5, { cap: true, m: .5, up: [1, 0, 0] }); }
      const tme = new THREE.Mesh(tg.build(), tm); tme.castShadow = true; pv.add(tme); pv.position.set(0, -.02, -.09); J.hips.add(pv); a.userData.tail = pv; }
    if (o.icon) { const sp = CY.glyphSprite(o.icon, o.iconC || AC.pink, .26); sp.position.y = a.userData.height + .3; a.add(sp); a.userData.icon = sp; }
    if (o.ring) { const rg = R.geo(); for (let k = 0; k < 10; k++) { const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU, r0 = HW * 1.3, r1 = HW * 1.55; rg.quad([Math.cos(a0) * r0, 0, Math.sin(a0) * r0], [Math.cos(a1) * r0, 0, Math.sin(a1) * r0], [Math.cos(a1) * r1, 0, Math.sin(a1) * r1], [Math.cos(a0) * r1, 0, Math.sin(a0) * r1]); }
      const rm = new THREE.Mesh(rg.build(), glow(tex.beam({ c: o.ring }), { side: true })); rm.position.y = Hd * 1.25; J.head.add(rm); }
    const ph = hash(o.seed || 0, 9) * 7; CY.live.push(t => { if (a.userData.tail) { a.userData.tail.rotation.y = Math.sin(t * 2.2 + ph) * .35; a.userData.tail.rotation.x = Math.sin(t * 1.3 + ph) * .1; } if (a.userData.icon) { a.userData.icon.position.y = a.userData.height + .3 + Math.sin(t * 2 + ph) * .04; a.userData.icon.material.rotation = Math.sin(t * 1.5 + ph) * .2; } });
    return a; };

  // ---- 窓のように浮かぶ板 ----
  CY.board = (o = {}) => { const w = o.w || 2.4, h = o.h || w * .625, d = .06, ac = o.ac || AC.sky, g = new THREE.Group(), B = R.parts(), F = B.g(tex.panel({ kind: 'band', ac, c: '#dfe2ec' })), b = .07;
    F.box(w + b * 2, b, d * 2, 0, -h / 2 - b, 0); F.box(w + b * 2, b, d * 2, 0, h / 2, 0); F.box(b, h, d * 2, -w / 2 - b / 2, -h / 2, 0); F.box(b, h, d * 2, w / 2 + b / 2, -h / 2, 0);
    if (o.stand) { F.box(.08, o.stand, .08, 0, -h / 2 - b - o.stand, 0); }
    const frame = B.group(); const sG = R.geo().quad([-w / 2, -h / 2, .01], [w / 2, -h / 2, .01], [w / 2, h / 2, .01], [-w / 2, h / 2, .01]).quad([w / 2, -h / 2, -.01], [-w / 2, -h / 2, -.01], [-w / 2, h / 2, -.01], [w / 2, h / 2, -.01]);
    const scr = new THREE.Mesh(sG.build(), glow(tex.screen({ ac, kind: o.kind, seed: o.seed }), { side: false })); const inner = new THREE.Group(); inner.add(frame, scr); g.add(inner); inner.userData.dyn = true; g.userData.dyn = true;
    const ph = hash(o.seed || 0, 3) * 6, y0 = 0; if (!o.stand) CY.live.push(t => { inner.position.y = y0 + Math.sin(t * .8 + ph) * .08; inner.rotation.y = Math.sin(t * .4 + ph) * .04; });
    return g; };

  // ---- 浮かぶ島 ----
  CY.island = (o = {}) => { const r = o.r || 6, h = o.h || r * 1.2, sd = o.seed || 0, n = 12, B = R.parts(), top = o.top || tex.floor({ seed: sd }), mt = top.userData.m || 4, Gt = B.g(top), Gu = B.g(tex.under({ ac: o.ac, seed: sd, c: o.underC || '#d8dcf0' })), rr = k => r * (1 + (hash(k % n, 1, sd) - .5) * .12);
    const P = k => { const a = k / n * TAU; return [Math.sin(a) * rr(k), 0, Math.cos(a) * rr(k)]; };
    for (let k = 0; k < n; k++) { const p0 = P(k), p1 = P(k + 1); Gt.tri([0, 0, 0], p0, p1, [.5, .5], [.5 + p0[0] / mt, .5 + p0[2] / mt], [.5 + p1[0] / mt, .5 + p1[2] / mt]); }   // 上の面
    const rings = [[0, 1, 1.05], [-.35, 1.02, 1.05], [-.9, .96, 1], [-h * .3, .8, .95], [-h * .55, .52, .9], [-h * .8, .24, .86], [-h, .02, .82]];
    for (let i = 0; i < rings.length - 1; i++) { const [y0, s0, c0] = rings[i], [y1, s1, c1] = rings[i + 1]; for (let k = 0; k < n; k++) { const j = (q, kk) => (hash(kk % n, i + q, sd + 5) - .5) * .32 * (i > 1 ? 1 : 0), q0 = P(k), q1 = P(k + 1), a = [q0[0] * (s0 + j(0, k)), y0, q0[2] * (s0 + j(0, k))], b = [q1[0] * (s0 + j(0, k + 1)), y0, q1[2] * (s0 + j(0, k + 1))], c = [q1[0] * (s1 + j(1, k + 1)), y1, q1[2] * (s1 + j(1, k + 1))], d = [q0[0] * (s1 + j(1, k)), y1, q0[2] * (s1 + j(1, k))];
      Gu.quad(a, b, c, d, [k / n * 4, y0 / 5, (k + 1) / n * 4, y1 / 5], [c0, c0, c1, c1]); } }
    const g = B.group();
    if (o.rim !== false) { const rg = R.geo(); for (let k = 0; k < n; k++) { const p0 = P(k), p1 = P(k + 1), e = 1.03; rg.quad([p0[0] * e, -.2, p0[2] * e], [p1[0] * e, -.2, p1[2] * e], [p1[0] * e, -.05, p1[2] * e], [p0[0] * e, -.05, p0[2] * e], [0, 0, 1, 1]); } g.add(new THREE.Mesh(rg.build(), glow(tex.beam({ c: o.ac || AC.sky }), { side: true }))); }
    g.userData.r = r; return g; };

  // ---- 塔：手で置く輪（ねじれ・ずれつき）をつなぐ ----
  const prism = (G, rings, n, o = {}) => { const m = o.m || 6, ur = o.ur || Math.max(1, Math.round(rings[0][1] * 2 * PI / m)), off = o.off ?? .5;
    const pt = (rg, k) => { const a = (k + off) / n * TAU + (rg[3] || 0); return [Math.sin(a) * rg[1] + (rg[4] || 0), rg[0], Math.cos(a) * rg[2] + (rg[5] || 0)]; };
    for (let i = 0; i < rings.length - 1; i++) { const A = rings[i], Bq = rings[i + 1]; for (let k = 0; k < n; k++) G.quad(pt(A, k), pt(A, k + 1), pt(Bq, k + 1), pt(Bq, k), [k / n * ur, A[0] / m, (k + 1) / n * ur, Bq[0] / m], o.c ? o.c(i) : 1); }
    if (o.cap) { const L = rings[rings.length - 1], c = [L[4] || 0, L[0], L[5] || 0]; for (let k = 0; k < n; k++) G.tri(pt(L, k), pt(L, k + 1), c, [0, 0], [.2, 0], [.1, .2]); }
    return G; };
  CY.prism = prism;
  CY.tower = (o = {}) => { const h = o.h || 60, r = o.r || 6, sd = o.seed || 0, ac = o.ac || AC.mint, kind = o.kind || 'slab', B = R.parts(), c = o.c || WH, tm = o.m || 6, Gw = B.g(tex.panel({ kind: 'win', ac, c, seed: sd, m: tm })), Gf = B.g(tex.panel({ kind: 'fin', ac, c, seed: sd + 1, m: tm })), Gb = B.g(tex.panel({ kind: 'band', ac, c, seed: sd + 2, m: tm })), g = new THREE.Group(), lt = [], prism = (G, rs, n, q = {}) => CY.prism(G, rs, n, { m: tm, ...q });
    if (kind === 'slab') { prism(Gw, [[0, r, r * .7], [h * .7, r * .92, r * .64], [h, r * .8, r * .56]], 4, {}); prism(Gb, [[h, r * .82, r * .58], [h + 3, r * .82, r * .58]], 4, {}); prism(Gf, [[h + 3, r * .6, r * .4], [h * 1.12, r * .3, r * .2]], 4, { cap: true }); lt.push(h * 1.12); }
    if (kind === 'round') { const n = 10; let y = 0; for (let s = 0; s < 4; s++) { const k = 1 - s * .16, hh = h * (s === 0 ? .4 : .2); prism(s % 2 ? Gf : Gw, [[y, r * k, r * k], [y + hh, r * k * .97, r * k * .97]], n, {}); prism(Gb, [[y + hh, r * k * 1.08, r * k * 1.08], [y + hh + 1.4, r * k * 1.08, r * k * 1.08]], n, {}); y += hh + 1.4; } prism(Gf, [[y, r * .3, r * .3], [y + 8, .2, .2]], 6, {}); lt.push(y + 8); }
    if (kind === 'twist') { const rs = []; for (let i = 0; i <= 8; i++) { const k = i / 8; rs.push([k * h, r * (1 - k * .45), r * (1 - k * .45), k * 1.4]); } prism(Gw, rs, 5, {}); prism(Gf, [[h, r * .55, r * .55, 1.4], [h + 6, .3, .3, 1.6]], 5, {}); lt.push(h + 6); }
    if (kind === 'spire') { prism(Gf, [[0, r, r], [h * .25, r * .8, r * .8], [h * .8, r * .25, r * .25], [h, .2, .2]], 6, {}); for (const [y, s] of [[h * .3, 1.6], [h * .5, 1.2], [h * .68, .8]]) prism(Gb, [[y, r * s, r * s], [y + 1.2, r * s, r * s]], 12, {}); lt.push(h); }
    if (kind === 'stack') { let y = 0; for (let s = 0; s < 6; s++) { const w = r * (1.1 - s * .1) * (.8 + hash(s, 1, sd) * .4), hh = h / 6 * (.7 + hash(s, 2, sd) * .4), ox = (hash(s, 3, sd) - .5) * r * .5, oz = (hash(s, 4, sd) - .5) * r * .5, rot = hash(s, 5, sd) * 1.2; prism(s % 2 ? Gf : Gw, [[y, w, w * .8, rot, ox, oz], [y + hh, w, w * .8, rot, ox, oz]], 4, { cap: true }); y += hh + (s < 5 ? h * .02 : 0); } lt.push(y); }
    if (kind === 'halo') { prism(Gw, [[0, r, r], [h, r * .7, r * .7]], 8, {}); prism(Gf, [[h, r * .7, r * .7], [h + 4, r * .3, r * .3]], 8, { cap: true }); lt.push(h + 4); }
    g.add(B.group());
    if (kind === 'halo' || kind === 'spire') { const ringH = kind === 'halo' ? h * .82 : h * .58, rr = kind === 'halo' ? r * 2.4 : r * 2, rg = R.geo(); for (let k = 0; k < 24; k++) { const a0 = k / 24 * TAU, a1 = (k + 1) / 24 * TAU; rg.quad([Math.cos(a0) * rr, 0, Math.sin(a0) * rr], [Math.cos(a1) * rr, 0, Math.sin(a1) * rr], [Math.cos(a1) * rr, 1.2, Math.sin(a1) * rr], [Math.cos(a0) * rr, 1.2, Math.sin(a0) * rr], [0, 0, 6, 1]); }
      const ring = new THREE.Mesh(rg.build(), glow(tex.beam({ c: ac }), { side: true })); ring.position.y = ringH; ring.userData.dyn = true; g.add(ring); CY.live.push(t => { ring.rotation.y = t * .1; ring.position.y = ringH + Math.sin(t * .5 + sd) * .6; }); }
    for (const y of lt) { const hl = CY.halo(ac, 6, .5); hl.position.y = y; g.add(hl); }
    g.userData.h = lt[0]; return g; };

  // ---- 光の線（十字の帯。加算で流れる） ----
  CY.line = (pts, o = {}) => { const w = o.w || .3, tx = tex.beam({ c: o.c || AC.sky }).clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; const G = R.geo(), rep = o.rep || 4; let L = 0;
    for (let i = 0; i < pts.length - 1; i++) { const a = new THREE.Vector3(...pts[i]), b = new THREE.Vector3(...pts[i + 1]), d = b.clone().sub(a), len = d.length(); d.normalize(); const up = Math.abs(d.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0), s1 = d.clone().cross(up).normalize().multiplyScalar(w / 2), s2 = d.clone().cross(s1).normalize().multiplyScalar(w / 2), u0 = L / rep, u1 = (L + len) / rep;
      for (const s of [s1, s2]) G.quad(a.clone().sub(s).toArray(), b.clone().sub(s).toArray(), b.clone().add(s).toArray(), a.clone().add(s).toArray(), [u0, 0, u1, 1]); L += len; }
    const me = new THREE.Mesh(G.build(), o.add ? add(tx, { own: true, opacity: o.a ?? 1 }) : glow(tx, { own: true, cut: true })); me.userData.dyn = true; me.frustumCulled = false; const sp = o.speed ?? 1.5; CY.live.push(t => { tx.offset.x = -t * sp / rep; }); return me; };

  // ---- 空を行く小さな乗りもの ----
  CY.pod = (o = {}) => { const s = o.s || 1, c = o.c || WH, ac = o.ac || AC.sky, B = R.parts(), Gb = B.g(tex.panel({ kind: 'fin', ac, c, m: 2 })), Gw = B.g(tex.panel({ kind: 'win', ac, c, m: 1.5 })), RX = TR(0, 0, 0, 0, PI / 2), g = new THREE.Group();
    Gb.at(RX); prism(Gb, [[-1.6 * s, .2 * s, .2 * s], [-1.2 * s, .55 * s, .45 * s], [.4 * s, .62 * s, .5 * s], [1.3 * s, .4 * s, .35 * s], [1.7 * s, .05 * s, .05 * s]], 8, { m: 2 }); Gb.at(null);
    Gw.at(TR(0, .3 * s, 0, 0, PI / 2)); prism(Gw, [[-.6 * s, .2 * s, .3 * s], [.6 * s, .25 * s, .35 * s], [1 * s, .05 * s, .1 * s]], 6, { m: 1.5 }); Gw.at(null);
    for (const sx of [-1, 1]) Gb.quad([sx * .5 * s, 0, -.6 * s], [sx * 1.6 * s, -.05 * s, -1.1 * s], [sx * 1.4 * s, .02 * s, -.4 * s], [sx * .5 * s, .05 * s, .3 * s]);
    g.add(B.group()); const tail = CY.halo(ac, 2.2 * s, .8); tail.position.z = -1.8 * s; g.add(tail); return g; };

  CY.tick = (t) => { for (const f of CY.live) f(t); };
  return CY;
};
