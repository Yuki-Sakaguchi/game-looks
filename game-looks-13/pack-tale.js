// 第 13 集の部品集「昔の家庭用ゲーム機のファンタジー RPG ふうの人」。kit.js と retro.js（第 7 集）のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), TL = PACK_TALE(THREE, K, R)  として使う。
// retro.js は道具（R.geo の loft、R.Px で打つドット絵、R.mat、R.ramp、R.crt）として読むだけで、中は変えない。
// 頭だけは、持ち主が決めた R.actor の anime の顔を そのまま借りる（R.actor を はげ頭で呼んで頭の関節を取り出す。R.actor 自体は変えない）。かみは この部品集で作る。
//
// ■ 考え方（docs/taste.md の「昔の家庭用ゲーム機のファンタジー RPG の人と敵」）
//   ・ふつうの人は 4.5 頭身、背の高い人は 5 頭身（持ち主が決めた）。小がらな人・子どもは 4・3.5 頭身。頭・手・足が大きく、胴は小さい。
//   ・形は体ではなく服で決める：ふくらんだ肩のそで、広がるそで口（手ぶくろの口）、広がる上着のすそ、だぶついたズボン、折り返しの大きなブーツ、首のスカーフ。
//   ・布のしわ・縫い目・つぎ当て・よごれは、128×128 の 1 枚に手で打つ。色はくすんだ中間色に、赤や青の差し色。
//   ・かみは R.actor の物を使わず、ここで作る（頭にかぶせた殻の ふちを ぎざぎざに切る）。主人公は流し前がみ。ほかのかみ型は ほかの人に使う。
//
// ■ 人を作る
//   TL.person('hero')                 見本の人物（TL.CAST）を id で作る
//   TL.person({ ...TL.cast('hero'), hair: 'wolf' })   見本の人物の一部だけ変える
//   TL.person({ size, heads, hair, face, head: { …頭の引数 }, colors: { …服の色 }, bulk })  → Group（正面 +z、足もとが y=0）
//     size  … 'normal'（4.5 頭身。既定）/ 'tall'（5 頭身。背の高い人）/ 'small'（4 頭身）/ 'child'（3.5 頭身）。heads で数を直接わたしてもよい（3.5〜5）
//     hair  … 'swept'（流し前がみ）/ 'center'（長めのセンター分け）/ 'wolf'（ウルフ）。くわしくは HAIRS
//     face  … 'anime'（R.actor のいまの顔）/ 'small'（目を小さめに打ちなおした顔）
//     head  … R.actor の頭の引数（skin, hair＝かみの色, eye, eyes, brow, mouth, beard, blush）。かみ型は上の hair で決める
//     colors … 服の色（tunic 上着, vest ベスト, linen そで, glove 手ぶくろ, pants ズボン, boot ブーツ, scarf スカーフ, belt, brass 金具, trim 刺しゅう）
//     bulk  … 体のはばの倍率（がっしり 1.1、ほっそり .92）。tall は 1.06 が既定
//     関節は R.actor と同じ名前（hips, torso, head, armL, foreL, armR, foreR, legL, shinL, legR, shinR, cape）なので、R.walk / R.idle / retro-motions.js がそのまま使える
//     userData: { J, hipY, height, heads, headH, tris, skirt, build: { thigh, shin }, kind: 'tale', id }
//   TL.CAST   見本の人物の一覧 [{ id, name, role, o }]。いまは主人公だけ（仲間は段階 3 で足す）
//   TL.SIZES  { normal: 4.5, tall: 5, small: 4, child: 3.5 }
//   TL.hero(o) は TL.person({ ...主人公, ...o }) の短い書き方（段階 1 の調整室のため）
window.PACK_TALE = (THREE, K, R) => {
  const { hash, mix, ramp, Px } = R;

  // ---- テクスチャ：遠くで小さくなっても輪郭線と目が消えないよう、縮小版は「2×2 のうち いちばん多い色」で作る（R.actor と同じ考え） ----
  function majorityMips(c0) {
    const lv = [c0]; let src = c0;
    while (src.width > 8 && src.height > 8) {
      const w = src.width >> 1, h = src.height >> 1, a = src.getContext('2d').getImageData(0, 0, src.width, src.height).data, dst = document.createElement('canvas'); dst.width = w; dst.height = h;
      const g = dst.getContext('2d'), im = g.createImageData(w, h), b = im.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const cs = [0, 1, 2, 3].map(i => ((y * 2 + (i >> 1)) * src.width + x * 2 + (i & 1)) * 4), key = i => (a[i] << 16) | (a[i + 1] << 8) | a[i + 2], lum = i => a[i] * .3 + a[i + 1] * .6 + a[i + 2] * .1;
        let best = cs[0], bn = 0; for (const i of cs) { const n = cs.filter(j => key(j) === key(i)).length; if (n > bn || (n === bn && lum(i) < lum(best))) { bn = n; best = i; } }
        const o = (y * w + x) * 4; b[o] = a[best]; b[o + 1] = a[best + 1]; b[o + 2] = a[best + 2]; b[o + 3] = 255; }
      g.putImageData(im, 0, 0); lv.push(dst); src = dst; }
    return lv; }
  function pixTex(canvas) { const lv = majorityMips(canvas), t = new THREE.CanvasTexture(lv[0]); t.mipmaps = lv; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapNearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.userData = { m: 1, cut: false, w: canvas.width, h: canvas.height, name: 'tale' }; return t; }

  // ---- 断面：点の並び（後ろ→左→前→右）から、まわりの長さに合わせた u を作る ----
  const sec = pts => { const n = pts.length, L = [0]; for (let k = 0; k < n; k++) { const a = pts[k], b = pts[(k + 1) % n]; L.push(L[k] + Math.hypot(b[0] - a[0], b[1] - a[1])); } return { pts, u: L.map(v => v / L[n]) }; };
  const SB = sec([[0, -1], [-.7, -.86], [-1, -.2], [-.9, .55], [-.45, .95], [.45, .95], [.9, .55], [1, -.2], [.7, -.86]]);   // 胴・すそ（正面が広い）
  const S6 = sec([[0, -1], [-.87, -.5], [-.87, .5], [0, 1], [.87, .5], [.87, -.5]]);                                         // うで・足
  const SH = sec([[0, -1], [-.8, -.6], [-1, .2], [-.5, 1], [.5, 1], [1, .2], [.8, -.6]]);                                       // 手（手の甲が前）
  const SK = sec([[-.55, -1], [-1, -.45], [-1, .4], [-.6, 1], [.6, 1], [1, .4], [1, -.45], [.55, -1]]);                         // ブーツ（つま先が丸く、かかとが平ら）

  // ---- 見本の人物。体つき・かみ・顔・服の色の組み合わせで 1 人を決める（オリジナルの人物） ----
  const SIZES = { normal: 4.5, tall: 5, small: 4, child: 3.5 };
  const BODY_COLORS = { tunic: '#a8894e', vest: '#6c4a34', linen: '#d6cbb0', glove: '#8a6646', pants: '#56637a', boot: '#74482e', scarf: '#b0392e', belt: '#4a3428', brass: '#c8a040', trim: '#e6dcc0' };
  const CAST = [
    { id: 'hero', name: 'ユウリ', role: '主人公。見習いの旅の剣士', o: { size: 'normal', hair: 'swept', face: 'anime',
      head: { hair: '#6e3e26', skin: '#f0c49c', eye: '#4a7a5a', eyes: 'big', brow: 'flat', mouth: 'smile' }, colors: { ...BODY_COLORS } } },
  ];
  const cast = id => (CAST.find(c => c.id === id) || CAST[0]).o;
  const HERO = { head: CAST[0].o.head, colors: CAST[0].o.colors };   // 段階 1 の書き方のなごり（調整室が使う）

  // ---- 体のテクスチャ（128×128。上の行が 上・頭がわ）。区画:
  //   胴     0..127 ×   0..39   x=64 が正面。ベスト・ひも・ベルト・上着
  //   すそ   0..127 ×  40..55   上着のすそ。ひだ・ふちの刺しゅう・よごれ・つぎ当て
  //   そで   0..63  ×  56..79   ふくらんだ肩のそで（亜麻の布、ひだ、赤いひも）
  //   前うで 64..127 ×  56..79   上＝下に着たそでのたるみ、下＝手ぶくろの広い口
  //   手     0..31  ×  80..95   手ぶくろ（上＝手くび、下＝指先）
  //   ズボン 32..95  ×  80..103  上の半分＝もも、下の半分＝すね
  //   スカーフ 96..127 × 80..103
  //   ブーツ 0..63  × 104..127  上＝折り返し、下＝くつ底。x=32 がつま先
  //   小物   64..127 × 104..127  さや・つか・金具・ふくろ
  function paintBody(c) {
    const P = Px(128, 128); P.clip = true;
    const Tn = ramp(c.tunic), V = ramp(c.vest), L = ramp(c.linen), G = ramp(c.glove), Pn = ramp(c.pants), B = ramp(c.boot), Sc = ramp(c.scarf), Bl = ramp(c.belt), Au = ramp(c.brass), Cr = ramp(c.trim), DIRT = '#5e4e3a';
    const px = P.set, hl = (x0, x1, y, col) => { for (let x = x0; x <= x1; x++) px(x, y, col); }, vl = (x, y0, y1, col) => { for (let y = y0; y <= y1; y++) px(x, y, col); };
    const side = (x, w) => { const u = (x + .5) / w; return Math.abs(u - .25) < .07 || Math.abs(u - .75) < .07 ? -1 : Math.abs(u - .5) < .12 ? 1 : 0; };   // わきは暗く、正面は明るく
    const dirt = (x, y, k) => { const q = P.get(x, y); if (q) px(x, y, mix(q, DIRT, k)); };

    // ---- 胴：革のベスト。前が開いて、上着とひもが見える ----
    for (let y = 0; y < 40; y++) for (let x = 0; x < 128; x++) px(x, y, V[3 + side(x, 128)]);
    for (let x = 0; x < 128; x++) { px(x, 0, V[5]); px(x, 1, V[4]); px(x, 2, V[4]); }
    for (const sx of [32, 96]) vl(sx, 3, 26, V[1]);                                               // わきの縫い目
    for (let y = 3; y < 27; y++) { px(0, y, V[1]); px(127, y, y % 3 ? V[2] : V[4]); }               // 背中のまん中の縫い目
    for (let i = 0; i < 26; i++) { const x = Math.floor(hash(i, 1, 3) * 128), y = 4 + Math.floor(hash(i, 2, 3) * 21); if (Math.abs(x - 64) < 12) continue; px(x, y, V[4]); if (hash(i, 3, 3) > .5) px(x + 1, y, V[2]); }   // すれた所
    for (let i = 0; i < 5; i++) { const x = Math.floor(hash(i, 4, 3) * 100) + 14, y = 6 + Math.floor(hash(i, 5, 3) * 16); if (Math.abs(x - 64) < 14) continue; P.rect(x, y, 2, 1, V[2]); px(x + 1, y + 1, V[2]); }   // しみ
    for (let i = 0; i < 6; i++) { const y = 5 + i * 4; hl(4 + (i % 2) * 3, 10 + (i % 2) * 3, y, V[2]); hl(118 - (i % 2) * 3, 124 - (i % 2) * 3, y, V[2]); }   // 背中のしわ
    for (let y = 0; y < 27; y++) { const w = Math.round(4 + y * .2);                                 // 前のあき（下へ広がる）
      for (let x = 64 - w; x < 64 + w; x++) px(x, y, Tn[(x - 64 + 64) % 5 === 0 ? 2 : 3]);
      px(63 - w, y, V[0]); px(64 + w, y, V[0]); px(62 - w, y, V[5]); px(65 + w, y, V[4]); if (y % 3 === 1) { px(60 - w, y, V[4]); px(67 + w, y, V[4]); } }
    for (let y = 2; y < 22; y += 4) { for (let k = 0; k < 4; k++) { const w = Math.round(4 + (y + k) * .2) - 1; px(64 - w + k * 2, y + k, Bl[1]); px(63 + w - k * 2, y + k, Bl[1]); } px(63, y + 2, Bl[2]); px(64, y + 2, Bl[3]); }   // ひも（ばってん）
    P.rect(60, 0, 8, 2, Tn[4]); hl(59, 68, 2, Tn[2]);                                               // えり
    // ベルト（27..31）と バックル
    for (let x = 0; x < 128; x++) { px(x, 27, Bl[0]); px(x, 28, Bl[4]); px(x, 29, Bl[3]); px(x, 30, Bl[3]); px(x, 31, Bl[0]); if (x % 11 === 5) { px(x, 29, Au[4]); px(x, 30, Au[2]); } }
    P.rect(59, 26, 10, 7, Au[3]); hl(59, 68, 26, Au[5]); hl(59, 68, 32, Au[1]); vl(58, 26, 32, Au[0]); vl(69, 26, 32, Au[0]); P.rect(61, 28, 6, 3, Bl[2]); vl(63, 28, 30, Au[4]);
    // ベルトの下の上着（32..39）。たてのひだ
    for (let y = 32; y < 40; y++) for (let x = 0; x < 128; x++) { const k = x % 12; px(x, y, Tn[k === 0 ? 1 : k === 1 ? 2 : k < 5 ? 4 : 3 + Math.min(0, side(x, 128))]); }

    // ---- すそ（40..55）：ひだ。下ほど広がる ----
    for (let y = 40; y < 56; y++) for (let x = 0; x < 128; x++) { const k = (x + Math.round((y - 40) * .25)) % 16; let t = k === 0 ? 1 : k === 1 ? 2 : k < 6 ? 4 : k > 12 ? 2 : 3; if (y === 40) t = 1; px(x, y, Tn[t]); }
    for (let x = 0; x < 128; x++) { px(x, 48, Tn[1]); px(x, 49, Sc[4]); for (let y = 50; y < 54; y++) px(x, y, Sc[2]); px(x, 54, Sc[0]); px(x, 55, Tn[0]);   // ふちの刺しゅう帯
      const z = (x % 6); px(x, 51 + (z < 3 ? z : 5 - z) - 1, Cr[4]); if (x % 6 === 0) px(x, 52, Cr[3]); }
    for (let y = 41; y < 48; y++) for (let x = 0; x < 128; x++) if (hash(x, y, 11) < (y - 41) * .05) dirt(x, y, .35);   // 下へ行くほど よごれ
    for (let x = 0; x < 128; x++) if (hash(x, 7, 12) < .35) dirt(x, 53, .45);
    P.rect(14, 41, 11, 6, L[3]); for (let x = 14; x < 25; x++) { px(x, 41, x % 2 ? Bl[1] : L[2]); px(x, 46, x % 2 ? Bl[1] : L[2]); } for (let y = 41; y < 47; y++) { px(14, y, y % 2 ? Bl[1] : L[2]); px(24, y, y % 2 ? Bl[1] : L[2]); } px(17, 43, L[4]); px(20, 44, L[1]);   // うしろの つぎ当て

    // ---- そで（0..63 × 56..79）：ふくらんだ亜麻の布。上でつまみ、下でしぼる ----
    for (let y = 56; y < 80; y++) for (let x = 0; x < 64; x++) { const j = y - 56, k = (x + (j < 12 ? 0 : 1)) % 8, sd = side(x, 64);
      let t = k === 0 ? 1 : k === 1 ? 2 : k === 3 || k === 4 ? 4 : 3; if (k === 4 && j > 4 && j < 16) t = 5; t += sd < 0 ? -1 : 0; px(x, y, L[Math.max(0, t)]); }
    for (let x = 0; x < 64; x++) { px(x, 56, V[1]); px(x, 57, L[2]); }
    for (let x = 0; x < 64; x++) { px(x, 73, L[1]); px(x, 74, Sc[4]); px(x, 75, Sc[3]); px(x, 76, Sc[3]); px(x, 77, Sc[1]); px(x, 78, L[3]); px(x, 79, L[1]); }   // そで口の赤いひも
    for (let i = 0; i < 10; i++) dirt(Math.floor(hash(i, 1, 21) * 64), 66 + Math.floor(hash(i, 2, 21) * 6), .25);

    // ---- 前うで（64..127 × 56..79）：下に着たそでのたるみ → 手ぶくろの広い口 ----
    for (let y = 56; y < 64; y++) for (let x = 64; x < 128; x++) { const k = (x + (y % 2) * 2) % 6; px(x, y, L[k === 0 ? 2 : y % 3 === 0 ? 2 : k === 3 ? 4 : 3]); }
    for (let y = 64; y < 80; y++) for (let x = 64; x < 128; x++) px(x, y, G[3 + side(x - 64, 64)]);
    for (let x = 64; x < 128; x++) { px(x, 64, G[0]); px(x, 65, G[5]); px(x, 66, G[4]); if (x % 3) px(x, 68, G[1]); px(x, 72, Bl[0]); px(x, 73, Bl[3]); px(x, 74, Bl[0]); px(x, 79, G[1]); }
    P.rect(92, 71, 4, 5, Au[3]); px(92, 71, Au[5]); px(95, 75, Au[1]);
    for (let i = 0; i < 12; i++) px(64 + Math.floor(hash(i, 1, 31) * 64), 67 + Math.floor(hash(i, 2, 31) * 11), hash(i, 3, 31) > .5 ? G[4] : G[2]);

    // ---- 手（0..31 × 80..95） ----
    for (let y = 80; y < 96; y++) for (let x = 0; x < 32; x++) { const j = y - 80; let t = 3 + side(x, 32); if (j === 6) t = 4; if (j === 7) t = 5; if (j > 8 && x % 4 === 1) t = 1; if (j > 13) t = 2; px(x, y, G[t]); }
    for (let x = 0; x < 32; x++) { px(x, 80, G[1]); if (x % 4 === 2) px(x, 87, G[2]); }

    // ---- ズボン（32..95 × 80..103）：だぶついた布。ななめのしわ、ひざのつぎ当て、すねのたるみ ----
    for (let y = 80; y < 104; y++) for (let x = 32; x < 96; x++) { const j = y - 80, xx = x - 32, sd = side(xx, 64); let t = 3 + sd;
      if (j < 12) { const k = (xx + j * .7) % 13; if (k < 1) t = 1; else if (k < 2.2) t = 4; } else { const k = (xx - j * .6 + 40) % 11; if (k < 1) t = 1; else if (k < 2) t = 4; }
      if (j === 0) t = 1; if (j > 19) t = (j + (xx % 4 < 2 ? 1 : 0)) % 2 ? 2 : 4; px(x, y, Pn[Math.max(0, Math.min(5, t))]); }
    { const C = ramp(mix(c.pants, c.linen, .35)); P.rect(58, 92, 12, 6, C[3]); for (let x = 58; x < 70; x++) { px(x, 92, x % 2 ? C[1] : C[4]); px(x, 97, x % 2 ? C[1] : C[2]); } for (let y = 92; y < 98; y++) { px(58, y, y % 2 ? C[1] : C[4]); px(69, y, y % 2 ? C[1] : C[2]); } px(62, 94, C[4]); px(66, 95, C[2]); }
    for (let i = 0; i < 18; i++) dirt(32 + Math.floor(hash(i, 1, 41) * 64), 94 + Math.floor(hash(i, 2, 41) * 10), .3);

    // ---- スカーフ（96..127 × 80..103）：赤い毛の布。しまと、すそのふさ ----
    for (let y = 80; y < 104; y++) for (let x = 96; x < 128; x++) { const k = x % 8, j = y - 80; let col = Sc[k === 0 ? 1 : k < 3 ? 4 : k > 6 ? 2 : 3]; if (j % 9 === 4) col = Sc[1]; if (j % 9 === 5) col = Cr[3]; if (j > 20) col = (x % 2) ? Sc[2] : (j === 23 ? null : Sc[4]); if (col) px(x, y, col); else px(x, y, Sc[0]); }

    // ---- ブーツ（0..63 × 104..127）：折り返し → 革のつつ → くつ ----
    for (let y = 104; y < 128; y++) for (let x = 0; x < 64; x++) px(x, y, B[3 + side(x, 64)]);
    for (let x = 0; x < 64; x++) { px(x, 104, B[5]); px(x, 105, B[4]); px(x, 106, B[4]); px(x, 107, B[3]); px(x, 108, B[0]); if (x % 4 === 0) px(x, 106, B[2]);   // 折り返し
      px(x, 111, Bl[0]); px(x, 112, Bl[3]); px(x, 113, Bl[0]);                                                                 // ベルト
      px(x, 115, B[1]); if (x % 5 === 2) px(x, 116, B[1]);                                                                      // 足くびのしわ
      px(x, 123, B[2]); px(x, 124, Bl[1]); for (let y = 125; y < 128; y++) px(x, y, Bl[0]); }                                  // くつ底
    P.rect(46, 110, 4, 4, Au[3]); px(46, 110, Au[5]); px(49, 113, Au[1]); P.rect(14, 110, 4, 4, Au[3]); px(14, 110, Au[5]);
    for (let y = 117; y < 123; y++) for (let x = 24; x < 41; x++) { const d = Math.abs(x - 32); if (d < 8 - (122 - y) * .6) px(x, y, B[d < 3 && y < 121 ? 5 : 4]); }   // つま先の光
    for (let i = 0; i < 14; i++) px(Math.floor(hash(i, 1, 51) * 64), 109 + Math.floor(hash(i, 2, 51) * 13), hash(i, 3, 51) > .5 ? B[4] : B[1]);
    for (let x = 0; x < 64; x++) if (hash(x, 5, 52) < .5) dirt(x, 122, .4);

    // ---- 小物（64..127 × 104..127）：さや（64..79）、つか（80..95）、金具（96..111）、ふくろ（112..127） ----
    for (let y = 104; y < 128; y++) { for (let x = 64; x < 80; x++) { const k = x - 64; px(x, y, y > 121 ? Au[k < 4 ? 5 : k > 11 ? 1 : 3] : Bl[k < 3 ? 4 : k > 12 ? 1 : (y % 7 === 0 ? 1 : 3)]); }
      for (let x = 80; x < 96; x++) px(x, y, ((x + y) % 4) < 2 ? Bl[1] : L[3]);
      for (let x = 96; x < 112; x++) { const k = x - 96; px(x, y, Au[k < 4 ? 5 : k > 11 ? 1 : (y % 6 === 0 ? 2 : 3)]); }
      for (let x = 112; x < 128; x++) { const k = x - 112, j = y - 104; px(x, y, j < 6 ? V[j === 5 ? 0 : 4] : V[k < 3 ? 4 : k > 12 ? 1 : 3]); } }
    P.rect(118, 110, 4, 3, Au[3]);
    return P; }

  // ---- 'small' の顔：R.actor の頭のテクスチャを写し、目のまわりを肌の色でぬりなおして、小さめの目を打つ ----
  //   anime の顔は 頭のテクスチャの上 48 行に、正面から平らにはってある（x=64 がまん中、目は まん中から 7〜20 ドット、行 12〜24）
  const EYES_SMALL = ['..kkkkkkkk.', '.kkkddddkkk', '.kwdhhpdwk.', '..wdhppdw..', '..wippppw..', '...wiiiw...', '....lll....'];
  function smallEyes(headPivot, eye) {
    const me = headPivot.children[0], old = me.material, src = old.map.mipmaps?.[0] || old.map.image, c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0); const im = g.getImageData(0, 0, c.width, c.height), d = im.data, W = c.width;
    const get = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; }, put = (x, y, rgb) => { const i = (y * W + x) * 4; d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; };
    const hex = s => { const n = parseInt(s.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
    for (let x = 40; x < 88; x++) { const skin = get(x, 28); for (let y = 11; y < 26; y++) put(x, y, skin); }
    const E = ramp(eye), skin = get(64, 28), k = mix('#' + skin.map(v => v.toString(16).padStart(2, '0')).join(''), '#2a1a22', .78);
    const cmap = { k, w: '#ffffff', i: E[4], d: E[2], p: '#1c1828', h: '#ffffff', l: mix('#' + skin.map(v => v.toString(16).padStart(2, '0')).join(''), '#7a3a34', .45) };
    for (const sg of [-1, 1]) EYES_SMALL.forEach((row, j) => [...row].forEach((ch, i) => { if (!cmap[ch]) return; const dd = 8 + i; put(sg < 0 ? 63 - dd : 64 + dd, 15 + j, hex(cmap[ch])); }));
    g.putImageData(im, 0, 0); const t = pixTex(c), m = old.clone(); m.map = t; m.onBeforeCompile = old.onBeforeCompile; m.customProgramCacheKey = old.customProgramCacheKey; me.material = m; }

  // ---- かみ（R.actor のとがった束はやめ、ここで作る）。頭は R.actor の はげ頭を借り、その上に「殻」と「束」をかぶせる ----
  //   数は頭の大きさで割った値: x＝頭の半はば、y＝あご 0 〜 てっぺん 1、z＝顔の前 +1 〜 後頭部 −1。θ は頭のまわりの角度（0＝正面、＋が左手がわ＝+x）
  //   束は 3 点（根もと・なか・先）の曲線にそって、平たいひし形の断面を先細りにつないだ物。先は とがらせず 小さく残す
  const PROF = [[.25, .9], [.45, 1], [.6, .99], [.75, .94], [.9, .7], [1, .12]];   // 高さごとの頭の太さ
  const prof = y => { if (y <= PROF[0][0]) return PROF[0][1]; for (let i = 0; i < PROF.length - 1; i++) { const [a, ra] = PROF[i], [b, rb] = PROF[i + 1]; if (y <= b) return ra + (rb - ra) * (y - a) / (b - a); } return .1; };
  const D2R = Math.PI / 180, on = (th, y, k = 1.1) => { const a = th * D2R, r = prof(y) * k; return [Math.sin(a) * r, y, Math.cos(a) * r]; };   // 殻の上の点
  // かみ型。かみは「頭にかぶせた 1 枚の殻」で、その下のふちを ぎざぎざに切って 前がみ・横がみ・えりあしにする（初期の 3D ゲーム機の人のかみの作り方）。
  //   edge: [[θ, ふちの高さ], …]（θ は −180〜180。ふちの線）、jag: ぎざぎざの深さ、sweep: 先が流れる向きと量（度）、flare: えりあしが外へはねる量、vol: ふくらみ
  //   locks: 殻の外に足す大きな束 [根もと, なか, 先, はば, あつみ]（シルエットを作る数本だけ）
  const mirror = ([a, b, c, w, t]) => [[a, b, c, w, t], [[-a[0], a[1], a[2]], [-b[0], b[1], b[2]], [-c[0], c[1], c[2]], w, t]];   // 左右に 1 本ずつ
  const HAIRS = {
    // 流し前がみ：左の分け目から右へ流れる前がみ。ほおにかかる横がみ、短めのえりあし。頭のうしろが少しふくらむ
    swept: { name: '流し前がみ', edge: [[-180, .24], [-120, .26], [-95, .3], [-78, .3], [-62, .5], [-35, .56], [-5, .6], [22, .66], [34, .72], [52, .6], [66, .46], [80, .32], [95, .3], [120, .26], [180, .24]], jag: .11, sweep: -30, flare: .08, vol: 1.04,
      locks: [[[.1, 1.04, .3], [.2, 1.26, .12], [.1, 1.3, -.14], .06, .035], [[.3, 1.02, .55], [-.1, 1.12, .82], [-.55, .9, 1.0], .3, .1], [[-.5, .98, -.2], [-.86, .96, -.62], [-1.0, .72, -.9], .3, .1], [[.5, .98, -.2], [.86, .94, -.64], [1.0, .7, -.92], .28, .1]] },
    // 長めのセンター分け：まん中で分けた前がみが、ほおを囲むように左右へ下りる。えりあしは首まで
    center: { name: '長めのセンター分け', edge: [[-180, .1], [-120, .12], [-90, .14], [-72, .2], [-55, .42], [-28, .56], [-8, .74], [0, .86], [8, .74], [28, .56], [55, .42], [72, .2], [90, .14], [120, .12], [180, .1]], jag: .08, sweep: 'out', flare: .04, vol: 1.02, locks: [...mirror([[-.2, 1.03, .5], [-.55, 1.04, .62], [-.85, .78, .74], .26, .09]), ...mirror([[-.45, .98, -.3], [-.8, .9, -.7], [-.9, .55, -.98], .3, .1])] },
    // ウルフ：上は うしろへ立ち上がり、前がみは ぎざぎざ、えりあしは長く外へはねる
    wolf: { name: 'ウルフ', edge: [[-180, -.02], [-140, .06], [-105, .26], [-80, .36], [-55, .56], [-22, .6], [0, .56], [22, .62], [55, .56], [80, .36], [105, .26], [140, .06], [180, -.02]], jag: .15, sweep: 8, flare: .22, vol: 1.07,
      locks: [[[0, 1.04, .45], [0, 1.14, -.15], [-.04, 1.0, -.9], .36, .12], ...mirror([[-.42, 1.0, .38], [-.68, 1.06, -.22], [-.86, .9, -.86], .3, .11])] },
  };
  const edgeY = (E, th) => { for (let i = 0; i < E.length - 1; i++) { const [a, ya] = E[i], [b, yb] = E[i + 1]; if (th <= b) return ya + (yb - ya) * (th - a) / (b - a || 1); } return E[E.length - 1][1]; };
  function paintHair(col) { const P = Px(64, 64), H = ramp(col);   // かみのテクスチャ：よこ＝まわり、たて＝てっぺん(上)→毛先(下)。ふぞろいな すじ、上から 1/3 あたりの つやの帯（頭をぐるりと回る輪）（すじに沿ってとぎれる）、毛先は少し暗く
    const cut = []; for (let x = 0, k = 0; x < 64; k++) { cut.push(x); x += 4 + Math.floor(hash(k, 1, 81) * 6); }
    P.each((x, y) => { const s0 = cut.filter(c => c <= x).pop(), i = cut.indexOf(s0), w = (cut[i + 1] ?? 64) - s0, f = (x - s0) / w, lit = hash(i, 2, 81);
      let t = f < .18 ? 2 : f > .7 && lit > .45 ? 4 : 3; if (lit < .2 && f < .4) t = 2;
      const b0 = 22 + Math.floor(hash(i, 3, 81) * 5), b1 = b0 + 3 + Math.floor(hash(i, 4, 81) * 4); if (y >= b0 && y <= b1 && f > .2 && f < .85) t = (y === b0 || y === b1 || lit < .35) ? 4 : 5;
      if (y > 50) t = Math.min(t, 3); if (y > 58 && f < .4) t = 2; if (y < 2) t = 2; return H[t]; }); return P; }
  const hairTexCache = new Map();
  function hairMesh(style, col, dim) {
    const S = HAIRS[style] || HAIRS.swept, { hx, hy, zc, hd } = dim, M = p => [p[0] * hx, p[1] * hy, zc + p[2] * hd], cen = [0, .5 * hy, zc];
    let t = hairTexCache.get(col); if (!t) { t = pixTex(paintHair(col).canvas()); hairTexCache.set(col, t); }
    const G = R.geo().smooth(0), sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nz = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    // 殻：36 本のたての線 × 7 段（上ほど ひと回り大きく、頭のてっぺんが つきぬけないように）。いちばん下の段が ふちの線（1 本おきに さらに下げて ぎざぎざの先にする）。先ほど sweep の向きへ流す
    const NC = 36, rowsS = [0, .16, .36, .58, .76, .9, 1], kk = S.vol * 1.1, grid = [], JG = [1.25, .55, .95, .7];   // ぎざぎざは 4 本ごとに 長・短・中・短（そろえない）
    for (let c = 0; c <= NC; c++) { const th = -180 + c * 360 / NC, tip = c % 2 === 0, y0 = edgeY(S.edge, th) - (tip ? S.jag * JG[(c / 2) % 4] * (.85 + .3 * hash(c, 3, 71)) : -S.jag * .15), col = [];
      for (const r of rowsS) { const y = y0 + (.965 - y0) * r, sw = S.sweep === 'out' ? Math.sign(th) * Math.min(12, Math.abs(th) * .35) : S.sweep, back = Math.max(0, -Math.cos(th * D2R)), fl = (1 - r) ** 2 * (S.flare * back + (Math.abs(th) < 70 ? .05 : .02)),
          p = on(th + sw * (1 - r) ** 1.5, y, kk * (1 + fl) * (1 + .1 * r * r) * (r > 0 && r < 1 ? 1 + (hash(c, r * 10, 72) - .5) * .06 : 1)); col.push({ p: M(p), v: .1 + r * .86 }); }
      grid.push(col); }
    G.smooth(1);
    for (let c = 0; c < NC; c++) for (let r = 0; r < rowsS.length - 1; r++) { const a = grid[c][r], b = grid[c + 1][r], cc = grid[c + 1][r + 1], d = grid[c][r + 1], u0 = c / NC * 2, u1 = (c + 1) / NC * 2;
      G.quad(a.p, b.p, cc.p, d.p, [u0, a.v, u1, d.v], [.84 + .04 * r, .84 + .04 * r, .88 + .04 * r, .88 + .04 * r]); }
    const topP = M([0, 1.07 + .04 * (S.vol - 1), -.08]); for (let c = 0; c < NC; c++) { const a = grid[c][rowsS.length - 1], b = grid[c + 1][rowsS.length - 1]; G.tri(a.p, b.p, topP, [c / NC * 2, .98], [(c + 1) / NC * 2, .98], [(c + .5) / NC * 2, 1], 1.04); }
    G.smooth(0);
    // 束
    for (const [p0, p1, p2, w, th] of S.locks) { const A = M(p0), B = M(p1), C = M(p2), n = 5, rings = [];
      for (let i = 0; i <= n; i++) { const u = i / n, P = add(add([A[0] * (1 - u) ** 2, A[1] * (1 - u) ** 2, A[2] * (1 - u) ** 2], B, 2 * u * (1 - u)), C, u * u), T = nz(add(sub(B, A), sub(C, B), 2 * u - 0)), N0 = nz(sub(P, cen)), Sd = nz(cr(T, N0)), N = nz(cr(Sd, T)), ww = w * hx * (1 - Math.pow(u, 1.7) * .9) * (u < .15 ? .8 + u * 1.3 : 1), tt = th * hx * (1 - u * .7);
        rings.push({ P: [add(P, Sd, ww), add(P, N, tt), add(P, Sd, -ww), add(P, N, -tt * .35)], v: 1 - u }); }
      for (let i = 0; i < n; i++) { const a = rings[i], b = rings[i + 1]; for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4, br = k === 1 || k === 0 ? 1.04 : .82; G.quad(b.P[k], b.P[k2], a.P[k2], a.P[k], [k / 4, b.v, (k + 1) / 4, a.v], br); } } }
    const me = G.mesh(t, { side: true }); me.castShadow = true; return me; }

  // ---- 体を組む ----
  const texCache = new Map();
  function person(o = {}) { const id = typeof o === 'string' ? o : o.id; if (typeof o === 'string') o = { ...cast(o), id };
    const N = o.heads ?? SIZES[o.size || 'normal'] ?? 4.5, face = o.face || 'anime', c = { ...BODY_COLORS, ...(o.colors || {}) }, ho = { ...CAST[0].o.head, ...(o.head || {}) }, BK = o.bulk ?? (N >= 5 ? 1.06 : 1);
    // 頭：R.actor の anime の頭を借りる（帽子なし）。頭の関節（ピボット）ごと取り出す
    const src = R.actor({ build: 'toon', ...ho, hairStyle: 'bald', bangs: 'none', hat: 'none', cloth: 'tunic' }), head0 = src.userData.J.head; head0.parent.remove(head0); head0.position.set(0, 0, 0); head0.updateMatrixWorld(true);
    if (face === 'small') smallEyes(head0, ho.eye);
    const hb = new THREE.Box3().setFromObject(head0), dim = { hx: Math.max(-hb.min.x, hb.max.x) * 1.02, hy: hb.max.y, zc: (hb.max.z + hb.min.z) / 2, hd: (hb.max.z - hb.min.z) / 2 };
    const hair = hairMesh(o.hair || 'swept', ho.hair, dim);
    const Ht = dim.hy * 1.1;                                                           // あごの先から、かみのかたまりのてっぺんまで（はねた束の先は数えない）
    const key = JSON.stringify(c); let t = texCache.get(key); if (!t) { t = pixTex(paintBody(c).canvas()); texCache.set(key, t); }
    const m = R.mat(t, { vc: true, smooth: true }), m2 = R.mat(t, { vc: true, smooth: true, side: true }), W = 128, Hh = 128, h = Ht;   // 長さは h（頭の高さ）を 1 とした数で書く
    // 頭身から長さを決める：あごの高さ = (N−1)h。そのうち足（また下）が 50〜60%（4.5 頭身で 58%、5 頭身で 60%）
    const chinY = (N - 1) * h, hipY = chinY * (.5 + Math.min(1, N - 3.5) * .08 + Math.max(0, N - 4.5) * .04), neck = .06 * h, T = chinY - neck - hipY, ank = .22 * h, legL = hipY - ank, TH = legL * .47, SN = legL * .53;
    const g = new THREE.Group(), J = {}, v3 = new THREE.Vector3(); let tris = 0;
    const SOFT = .45, part = (G, parent, x, y, z, mm = m, rz = 0) => { const ge = G.build(), nr = ge.attributes.normal; for (let i = 0; i < nr.count; i++) { v3.set(nr.getX(i), nr.getY(i), nr.getZ(i)).multiplyScalar(1 - SOFT); v3.y += SOFT; v3.normalize(); nr.setXYZ(i, v3.x, v3.y, v3.z); } tris += G.count(); const me = new THREE.Mesh(ge, mm); me.castShadow = me.receiveShadow = true; me.rotation.z = rz; const pv = new THREE.Group(); pv.position.set(x, y, z); pv.add(me); parent.add(pv); return pv; };
    const geo = () => R.geo().smooth(0);
    J.hips = new THREE.Group(); J.hips.position.y = hipY; g.add(J.hips);

    // 胴：小さい。肩はばは頭のはばより せまい
    const Gt = geo().px(0, 0, 128, 40, W, Hh).loft(SB, [[0, .21 * h, .19 * h, 0, .85], [.18 * T, .25 * h, .22 * h, .2, .95], [.42 * T, .26 * h, .225 * h, .35, 1], [.75 * T, .31 * h, .26 * h, .8, 1, 0, .01 * h], [.93 * T, .33 * h, .24 * h, .95, 1], [T, .16 * h, .14 * h, 1, .95]], { cap: 'top', capUV: [.5, .99] });
    // すそ：腰から ももの半ばまで広がる上着（両面）
    const Gk = geo().px(0, 40, 128, 16, W, Hh).loft(SB, [[-.44 * h, .47 * h, .4 * h, 0, .82], [-.1 * h, .37 * h, .31 * h, .45, .92], [.34 * T, .275 * h, .24 * h, 1, 1]]);
    // スカーフ：首に巻いた厚い輪（あごの下まで。首をかくす）
    const Gs = geo().px(96, 80, 32, 16, W, Hh).loft(S6, [[T - .05 * h, .26 * h, .21 * h, 0, .85], [T + .03 * h, .25 * h, .2 * h, .4, 1, 0, .01 * h], [T + neck + .06 * h, .19 * h, .17 * h, 1, 1, 0, .01 * h]], { cap: 'top', capUV: [.5, .5] });
    Gt.add(Gs);
    // ふくろ（右の腰）と さや（左の腰。ななめに下げる）
    Gt.px(112, 104, 16, 24, W, Hh).at(R.TR(-.28 * h, .3 * T, .06 * h, -.5)).loft(S6, [[-.2 * h, .05 * h, .04 * h, 0, .8], [-.08 * h, .09 * h, .07 * h, .5, 1], [.04 * h, .075 * h, .06 * h, .8, 1], [.07 * h, .05 * h, .04 * h, 1, 1]], { cap: 'both' }).at(null);
    Gt.at(R.TR(.3 * h, .36 * T, .02 * h, 0, .3, .12));
    Gt.px(64, 104, 16, 24, W, Hh).loft(R.ngon(4, 0), [[-.95 * h, .012 * h, .045 * h, 0, .8], [-.2 * h, .035 * h, .07 * h, .85, 1], [0, .035 * h, .07 * h, 1, 1]], { cap: 'bot' });
    Gt.px(96, 104, 16, 24, W, Hh).loft(R.ngon(4, 0), [[0, .04 * h, .1 * h, 0, .9], [.05 * h, .04 * h, .1 * h, 1, 1]], { cap: 'top' });
    Gt.px(80, 104, 16, 24, W, Hh).loft(S6, [[.05 * h, .035 * h, .035 * h, 0, .9], [.36 * h, .03 * h, .03 * h, 1, 1]]);
    Gt.px(96, 104, 16, 24, W, Hh).loft(S6, [[.36 * h, .05 * h, .05 * h, 0, 1], [.43 * h, .03 * h, .03 * h, 1, 1.1]], { cap: 'top' }).at(null);
    J.torso = part(Gt, J.hips, 0, 0, 0);
    const hemP = part(Gk, J.torso, 0, 0, 0, m2);

    // スカーフのはし（背中に 2 本。cape の関節で ゆれる）
    { const hold = new THREE.Group(), Gc = R.geo().normal([0, .2, 1]).px(96, 80, 32, 24, W, Hh); hold.rotation.y = Math.PI; hold.position.set(-.05 * h, T + .02 * h, -.23 * h); J.torso.add(hold);
      for (const [x0, L, w] of [[-.06, .66, .1], [.1, .48, .08]]) Gc.quad([(x0 - w) * h, -L * h, .06 * h], [(x0 + w) * h, -L * h, .06 * h], [(x0 + w * .8) * h, 0, 0], [(x0 - w * .8) * h, 0, 0], [x0 < 0 ? 0 : .5, 0, x0 < 0 ? .5 : 1, 1], [.8, .8, 1, 1]);
      J.cape = part(Gc, hold, 0, 0, 0, m2); }

    // 頭
    J.head = new THREE.Group(); J.head.position.set(0, T + neck, .01 * h); J.head.add(head0, hair); J.torso.add(J.head);

    // うで：ふくらんだそで → 下に着たそで → 広い口の手ぶくろ → 大きな手
    const U = .3 * h + .15 * T, F = .27 * h + .15 * T, HL = .46 * h;
    for (const [n, sx] of [['L', 1], ['R', -1]]) { const sp = sx * .2;
      const Ga = geo().px(0, 56, 64, 24, W, Hh).loft(S6, [[-U, .11 * h, .11 * h, 0, .82], [-U * .8, .19 * h, .19 * h, .2, .95], [-U * .42, .215 * h, .215 * h, .55, 1], [-U * .08, .18 * h, .19 * h, .9, 1], [.07 * h, .1 * h, .11 * h, 1, 1.05]], { cap: 'top', capUV: [.5, .95] });
      J['arm' + n] = part(Ga, J.torso, sx * .31 * h, .88 * T, 0, m, sp);
      const Gf = geo().px(64, 56, 64, 24, W, Hh).loft(S6, [[-F, .17 * h, .17 * h, 0, .8], [-F * .62, .12 * h, .12 * h, .45, 1], [-F * .55, .1 * h, .1 * h, .62, .92], [-F * .22, .11 * h, .11 * h, .8, 1], [0, .11 * h, .11 * h, 1, 1]], { cap: 'bot', capUV: [.5, .02] });
      Gf.px(0, 80, 32, 16, W, Hh).loft(SH, [[-F - HL, .045 * h, .08 * h, 0, .82], [-F - HL * .72, .075 * h, .135 * h, .3, .95], [-F - HL * .35, .08 * h, .145 * h, .65, 1], [-F + .02 * h, .065 * h, .11 * h, 1, 1]], { cap: 'bot', capUV: [.5, .05] });
      Gf.at(R.TR(0, -F - HL * .3, .11 * h, 0, .35)).loft(S6, [[-.22 * h, .03 * h, .035 * h, 0, .9], [0, .045 * h, .05 * h, 1, 1]], { cap: 'bot', capUV: [.5, .1] }).at(null);   // 親指
      J['fore' + n] = part(Gf, J['arm' + n], Math.sin(sp) * U, -Math.cos(sp) * U, 0, m, sp);
      // 足：だぶついたズボン → 折り返しの大きなブーツ
      const ls = sx * .04, Gl = geo().px(32, 80, 64, 12, W, Hh).loft(S6, [[-TH, .16 * h, .17 * h, 0, .9], [-TH * .5, .19 * h, .19 * h, .5, 1], [.04 * h, .17 * h, .17 * h, 1, 1]]);
      J['leg' + n] = part(Gl, J.hips, sx * .13 * h, 0, 0, m, ls);
      const Gn = geo().px(32, 92, 64, 12, W, Hh).loft(S6, [[-SN, .12 * h, .12 * h, 0, .85], [-SN * .62, .18 * h, .18 * h, .35, .95], [-SN * .3, .165 * h, .165 * h, .7, 1], [0, .16 * h, .16 * h, 1, 1]]);
      const by = -SN - ank;   // くつ底
      Gn.px(0, 104, 64, 24, W, Hh).loft(SK, [[by, .17 * h, .38 * h, 0, .65, 0, .11 * h], [by + .11 * h, .18 * h, .39 * h, .2, .85, 0, .11 * h], [by + .21 * h, .16 * h, .25 * h, .42, 1, 0, .05 * h], [by + .36 * h, .15 * h, .16 * h, .65, 1], [by + .47 * h, .19 * h, .2 * h, .85, 1.02], [by + .55 * h, .23 * h, .24 * h, 1, 1.06]], { cap: 'bot', capUV: [.5, .02] });
      J['shin' + n] = part(Gn, J['leg' + n], Math.sin(ls) * TH, -Math.cos(ls) * TH, 0, m, ls); }

    if (BK !== 1) { for (const pv of [J.torso, hemP, J.armL, J.armR, J.foreL, J.foreR, J.legL, J.legR, J.shinL, J.shinR]) pv.children[0].scale.set(BK, 1, BK);   // 体のはば（bulk）
      for (const n of ['armL', 'armR', 'legL', 'legR']) J[n].position.x *= BK; }
    const height = chinY + Ht;
    g.userData = { J, hipY, height, heads: height / Ht, headH: Ht, tris: tris + (head0.children[0].geometry.attributes.position.count + hair.geometry.attributes.position.count) / 3, skirt: .15, build: { thigh: TH, shin: SN }, kind: 'tale', id };
    return g; }
  const hero = (o = {}) => person({ ...cast('hero'), id: 'hero', ...o });

  return { person, hero, cast, CAST, SIZES, HERO, HAIRS, paintBody, pixTex, sec, SB, S6, SH, SK };
};
