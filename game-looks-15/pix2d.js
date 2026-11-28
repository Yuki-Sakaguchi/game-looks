// 第 15 集の部品集「ドット絵の 2D ゲーム」（テイスト C）。three.js は使わず、Canvas 2D で描く。
//   const P = PIX2D({ machine: 'fc' | 'sfc' | 'gb' })
//
// ■ 考え方：昔の家庭用ゲーム機の「しばり」を、この部品集の側で守らせる。場面を書く人は「何の素材の、何段めの明るさか」だけを打ち、
//   色にするのは機械ごとの決まりにまかせる。だから同じ場面が、3 つの機械の見た目で出せる。
//   fc（ファミコンふう）  : 256×240。色は 54 色の表からだけ。タイルは「黒＋素材の 3 色」、人は「黒・はだ・服」の 3 色。かげ・半透明なし
//   sfc（スーファミふう） : 256×224。素材ごとに 8 段（5 ビットずつの色）。段のさかいに中間の色をはさみ、面に点々のむらを打つ。半透明のかげ・雲のかげ
//   gb（ゲームボーイふう）: 160×144。緑がかった 4 段だけ。液晶のドットのすきまと、うすい残像
//
// ■ 打つ：const S = P.surface(w, h)   S.set(x, y, 素材, 段 0〜3)   S.rect / S.disc / S.line / S.each(f)   段 0 はりんかく（いちばん暗い）、3 がいちばん明るい
//   S.toCanvas() → 機械の色にした canvas（ためておく）。素材は P.MATS の名前（下の MATS）か、P.mat(名前, '#rrggbb', { gb: 明るさのずれ })で足す
// ■ 人：P.sprite(行の配列, { hair, cloth, pants, skin, boot }) → canvas。行の文字 k=りんかく s=はだ S=はだのかげ h=かみ H=かみの光 c=服 C=服のかげ p=ズボン b=くつ w=白
// ■ 画面：P.ctx（粗い絵。P.W×P.H）に描き、毎コマの最後に P.present(t)。仕上げ（ブラウン管 / 液晶）と拡大は P.present がやる
// ■ 文字と窓：P.window(x, y, w, h)、P.text(文字, x, y, 色の段)、P.talk(名前, 文, 出す字の数, { y })（下の会話の窓）。文字は端末のゴシックを その機械の大きさで打ち、ぼかしを切る
// ■ 時計：P.loop((t, dt) => { … })。時間は requestAnimationFrame から取る（tools/cap.mjs で撮れるように）
window.PIX2D = (o = {}) => {
  const M = o.machine || 'fc', P = { machine: M };
  P.W = M === 'gb' ? 160 : 256; P.H = M === 'gb' ? 144 : M === 'fc' ? 240 : 224;
  const hash = (a, b = 0, s = 0) => { const n = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
  P.hash = hash;
  const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }, hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const toHsl = c => { const [r, g, b] = rgb(c).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h / 6, s, l]; };
  const fromHsl = (h, s, l) => { h = ((h % 1) + 1) % 1; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); }; return hex([f(0), f(8), f(4)]); };
  // 1 色から 8 段（暗い→明るい。影は青むらさきへ、光は黄へ少しずらす）
  function ramp8(base) { const [h, s, l] = toHsl(base), out = [];
    for (let i = 0; i < 8; i++) { const t = i / 7, d = t - .55; let H = h, S = s, L;
      if (d < 0) { const k = -d / .55; L = l * (1 - .72 * k); H = h + ((((.7 - h + 1.5) % 1) - .5) * .18 * k); S = Math.min(1, s * (1 + .15 * k)); }
      else { const k = d / .45; L = l + (1 - l) * .6 * k; H = h + ((((.13 - h + 1.5) % 1) - .5) * .15 * k); S = s * (1 - .3 * k); }
      out.push(fromHsl(H, S, L)); } return out; }
  // ---- ファミコンふうの 54 色（よく知られた色の並びに近い、この部品集の表） ----
  const FCPAL = ['#7c7c7c', '#0000fc', '#0000bc', '#4428bc', '#940084', '#a80020', '#a81000', '#881400', '#503000', '#007800', '#006800', '#005800', '#004058', '#000000',
    '#bcbcbc', '#0078f8', '#0058f8', '#6844fc', '#d800cc', '#e40058', '#f83800', '#e45c10', '#ac7c00', '#00b800', '#00a800', '#00a844', '#008888',
    '#f8f8f8', '#3cbcfc', '#6888fc', '#9878f8', '#f878f8', '#f85898', '#f87858', '#fca044', '#f8b800', '#b8f818', '#58d854', '#58f898', '#00e8d8', '#787878',
    '#fcfcfc', '#a4e4fc', '#b8b8f8', '#d8b8f8', '#f8b8f8', '#f8a4c0', '#f0d0b0', '#fce0a8', '#f8d878', '#d8f878', '#b8f8b8', '#b8f8d8', '#00fcfc', '#d8d8d8'];
  // 人の目に近い色の近さ（赤の平均で重みを変える）
  const near = (c, list) => { const a = rgb(c); let best = list[0], bd = 1e9; for (const q of list) { const b = rgb(q), rm = (a[0] + b[0]) / 2, d = (2 + rm / 256) * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + (2 + (255 - rm) / 256) * (a[2] - b[2]) ** 2; if (d < bd) { bd = d; best = q; } } return best; };
  const GB = ['#0f380f', '#306230', '#8bac0f', '#c4cfa1'];
  // ---- 素材。base＝もとの色、gb＝ゲームボーイで明るさを何段ずらすか、fc0＝ファミコンで段 0 を黒にしない（水・空など）----
  const MATS = {};
  P.mat = (name, base, opt = {}) => { if (MATS[name]) return MATS[name]; const R = ramp8(base); let fc;
    if (M === 'fc') { const c3 = [near(R[1], FCPAL), near(R[3], FCPAL), near(R[6], FCPAL)]; if (c3[1] === c3[0]) c3[0] = near(R[1], FCPAL.filter(c => c !== c3[1])); if (c3[2] === c3[1]) c3[2] = near(R[7], FCPAL.filter(c => c !== c3[1])); fc = [opt.fc0 ? near(R[1], FCPAL) : '#000000', ...c3]; }
    MATS[name] = { R, fc, gb: opt.gb || 0, idx: Object.keys(MATS).length }; return MATS[name]; };
  P.MATS = MATS;
  [['outline', '#20182a'], ['grass', '#5aa846'], ['grassD', '#3f8a3c'], ['path', '#d8b880', { gb: 1 }], ['dirt', '#a8784c'], ['water', '#3c8ce0', { fc0: 1 }], ['wood', '#a06a3c'], ['roof', '#c84a3a'], ['roofB', '#3c64b4'],
   ['wall', '#ecdcb8', { gb: 1 }], ['stone', '#a09c98', { gb: 1 }], ['leaf', '#3c9a48'], ['trunk', '#7a5032'], ['red', '#e0404c'], ['yellow', '#f0d040', { gb: 1 }], ['white', '#f4f4f0', { gb: 1 }], ['crop', '#78b040'], ['skin', '#f4c8a0', { gb: 1 }], ['ink', '#2a2838']]
    .forEach(([n, c, op]) => P.mat(n, c, op));
  const matByIdx = () => Object.values(MATS);
  // 素材と段 → 色。sfc は 8 段の [1,3,5,7] を基本にし、detail で ±1
  const color = (m, lv, dt = 0) => { if (M === 'gb') return GB[Math.max(0, Math.min(3, lv + m.gb))]; if (M === 'fc') return m.fc[lv]; const i = Math.max(0, Math.min(7, [0, 2, 4, 6][lv] + dt)); return m.R[i]; };
  P.color = (name, lv) => color(MATS[name], lv);
  // ---- 打つ板 ----
  P.surface = (w, h) => { const mat = new Int16Array(w * h).fill(-1), lv = new Int8Array(w * h), S = { w, h };
    const L = matByIdx;
    S.set = (x, y, m, l) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; if (m === null) { mat[y * w + x] = -1; return; } mat[y * w + x] = (typeof m === 'string' ? MATS[m] : m).idx; lv[y * w + x] = Math.max(0, Math.min(3, l)); };
    S.get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? null : mat[y * w + x] < 0 ? null : { m: L()[mat[y * w + x]], l: lv[y * w + x] };
    S.rect = (x, y, rw, rh, m, l) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) S.set(x + i, y + j, m, l); };
    S.disc = (cx, cy, rx, ry, m, l) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1) S.set(x, y, m, typeof l === 'function' ? l(x, y) : l); };
    S.line = (x0, y0, x1, y1, m, l) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) S.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), m, l); };
    S.each = f => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const r = f(x, y); if (r) S.set(x, y, r[0], r[1]); } };
    // まわりに りんかく（段 0）を付ける（物の外がわ 1 ドット）
    S.outline = (m = 'outline') => { const add = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mat[y * w + x] < 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const q = S.get(x + a, y + b); return q && q.m.idx !== MATS[m].idx; })) add.push([x, y]); for (const [x, y] of add) S.set(x, y, m, 0); };
    S.toCanvas = (seed = 0) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data, ms = L();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = y * w + x; if (mat[k] < 0) continue; const m = ms[mat[k]], l = lv[k]; let dt = 0;
        if (M === 'sfc') {   // スーファミふう：段のさかいに中間の色、面に うすい むら、りんかくは素材の いちばん暗い色
          if (l > 0) { let up = false, dn = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (x + a >= 0 && y + b >= 0 && x + a < w && y + b < h) ? k + a + b * w : -1; if (q < 0 || mat[q] !== mat[k]) continue; if (lv[q] > l) up = true; if (lv[q] < l && lv[q] > 0) dn = true; } if (up && !dn) dt = 1; else if (dn && !up) dt = -1; }
          if (!dt && l > 0 && hash(x, y, seed + m.idx) < .1) dt = hash(x, y, seed + 3) < .5 ? -1 : 1; if (l === 0) dt = m.idx === MATS.outline.idx ? 0 : -1; }
        const [r, g2, b] = rgb(color(m, l, dt)); d[k * 4] = r; d[k * 4 + 1] = g2; d[k * 4 + 2] = b; d[k * 4 + 3] = 255; }
      g.putImageData(im, 0, 0); return c; };
    return S; };

  // ---- 人のスプライト ----
  const SPRITE_MAP = { k: ['outline', 0], s: ['skin', 2], S: ['skin', 1], h: ['hair', 1], H: ['hair', 3], c: ['cloth', 2], C: ['cloth', 1], p: ['pants', 2], b: ['boot', 1], w: ['white', 3] };
  const FC_SPRITE = { k: 0, s: 1, S: 1, h: 0, H: 2, c: 2, C: 2, p: 2, b: 0, w: 1 };   // ファミコンふうは 3 色：黒・はだ・服（かみは黒、光だけ服の色）
  const sprCache = new Map();
  P.sprite = (rows, cols) => { const key = rows.join('|') + JSON.stringify(cols) + M; if (sprCache.has(key)) return sprCache.get(key);
    const S = P.surface(rows[0].length, rows.length), tmp = {}; for (const r of ['hair', 'cloth', 'pants', 'boot']) tmp[r] = P.mat('_' + r + cols[r], cols[r] || '#6a4a3a'); tmp.skin = cols.skin ? P.mat('_skin' + cols.skin, cols.skin, { gb: 1 }) : MATS.skin;
    const fcCols = M === 'fc' ? ['#000000', near(cols.skin || '#f4c8a0', FCPAL), near(cols.cloth || '#3c64b4', FCPAL)] : null;
    rows.forEach((row, y) => [...row].forEach((ch, x) => { const e = SPRITE_MAP[ch]; if (!e) return; const m = e[0] === 'outline' || e[0] === 'white' ? MATS[e[0]] : tmp[e[0]]; S.set(x, y, m, e[1]); }));
    let c = S.toCanvas(7);
    if (M === 'fc') { const g = c.getContext('2d'), im = g.getImageData(0, 0, c.width, c.height), d = im.data; rows.forEach((row, y) => [...row].forEach((ch, x) => { if (FC_SPRITE[ch] === undefined) return; const [r, g2, b] = rgb(fcCols[FC_SPRITE[ch]]), k = (y * c.width + x) * 4; d[k] = r; d[k + 1] = g2; d[k + 2] = b; })); g.putImageData(im, 0, 0); }
    sprCache.set(key, c); return c; };
  P.flip = c => { const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const g = f.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f; };

  // ---- 画面 ----
  const low = document.createElement('canvas'); low.width = P.W; low.height = P.H; const ctx = low.getContext('2d'); ctx.imageSmoothingEnabled = false; P.ctx = ctx; P.canvas = low;
  const ghost = document.createElement('canvas'); ghost.width = P.W; ghost.height = P.H; const gctx = ghost.getContext('2d');
  const out = document.createElement('canvas'); out.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;display:block'; document.body.prepend(out); const octx = out.getContext('2d');
  let sc = 1, ox = 0, oy = 0, scan = null, vig = null, grid = null;
  // 拡大：液晶（gb）はドットのすきまを出すので整数倍。ブラウン管（fc・sfc）は画面いっぱい
  function resize() { const dpr = Math.min(devicePixelRatio || 1, 2); out.width = Math.round(innerWidth * dpr); out.height = Math.round(innerHeight * dpr);
    const f = Math.min(out.width / P.W, out.height / P.H); sc = M === 'gb' && f >= 2 ? Math.floor(f) : f; ox = Math.round((out.width - P.W * sc) / 2); oy = Math.round((out.height - P.H * sc) / 2);
    const s2 = Math.max(1, Math.round(sc)); scan = document.createElement('canvas'); scan.width = 4; scan.height = s2; const sg = scan.getContext('2d'); if (s2 >= 3) { sg.fillStyle = 'rgba(0,0,0,.28)'; sg.fillRect(0, s2 - 1, 4, 1); if (s2 >= 5) { sg.fillStyle = 'rgba(0,0,0,.12)'; sg.fillRect(0, s2 - 2, 4, 1); } }
    grid = document.createElement('canvas'); grid.width = s2; grid.height = s2; const gg = grid.getContext('2d'); if (s2 >= 3) { gg.fillStyle = 'rgba(30,50,20,.16)'; gg.fillRect(s2 - 1, 0, 1, s2); gg.fillRect(0, s2 - 1, s2, 1); }
    vig = null; }
  addEventListener('resize', resize); resize();
  P.present = () => { const W = P.W * sc, H = P.H * sc; octx.fillStyle = M === 'gb' ? '#3a4232' : '#08080c'; octx.fillRect(0, 0, out.width, out.height);
    octx.imageSmoothingEnabled = false;
    if (M === 'gb') { gctx.globalAlpha = .62; gctx.drawImage(low, 0, 0); gctx.globalAlpha = 1; octx.drawImage(ghost, ox, oy, W, H); octx.fillStyle = octx.createPattern(grid, 'repeat'); octx.save(); octx.translate(ox, oy); octx.fillRect(0, 0, W, H); octx.restore(); return; }
    octx.drawImage(low, ox, oy, W, H);
    // ブラウン管：横のにじみ（なめらかに広げた絵を うすく重ねる）、走査線、すみの暗がり。強くしすぎない
    octx.imageSmoothingEnabled = true; octx.globalAlpha = .28; octx.drawImage(low, ox + sc * .5, oy, W, H); octx.drawImage(low, ox - sc * .5, oy, W, H); octx.globalAlpha = 1;
    if (scan.height >= 3) { octx.fillStyle = octx.createPattern(scan, 'repeat'); octx.save(); octx.translate(ox, oy); octx.fillRect(0, 0, W, H); octx.restore(); }
    if (!vig) { vig = octx.createRadialGradient(out.width / 2, out.height / 2, Math.min(W, H) * .35, out.width / 2, out.height / 2, Math.max(W, H) * .75); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.35)'); }
    octx.fillStyle = vig; octx.fillRect(ox, oy, W, H); };

  // ---- 文字：端末のゴシックを その機械の大きさで打ち、半分より濃い所だけを残す（ぼかしなし） ----
  const FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","YuGothic","Meiryo","Noto Sans JP","Noto Sans CJK JP","IPAGothic","IPAPGothic",sans-serif';
  P.FS = M === 'gb' ? 10 : 12;
  const glyphs = new Map();
  function glyph(s, col) { const key = s + col; let g = glyphs.get(key); if (g) return g; const m = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); m.font = `${P.FS}px ${FONT}`; const w = Math.ceil(m.measureText(s).width) + 2, h = P.FS + 4; m.canvas.width = w; m.canvas.height = h; m.font = `${P.FS}px ${FONT}`; m.textBaseline = 'top'; m.fillStyle = '#fff'; m.fillText(s, 0, 1);
    const im = m.getImageData(0, 0, w, h), d = im.data, [r, g2, b] = rgb(col); for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= 115) { d[i] = r; d[i + 1] = g2; d[i + 2] = b; d[i + 3] = 255; } else d[i + 3] = 0; } m.putImageData(im, 0, 0); glyphs.set(key, m.canvas); return m.canvas; }
  P.textWidth = s => { const m = document.createElement('canvas').getContext('2d'); m.font = `${P.FS}px ${FONT}`; return Math.ceil(m.measureText(s).width); };
  // 窓の色：fc＝黒に白い 2 本線、sfc＝深い青のグラデーションに明るいふち（少しすける）、gb＝いちばん明るい色に黒いふち
  const WIN = { fc: { bg: '#000000', fg: '#fcfcfc', name: '#fcfcfc', b1: '#fcfcfc', b2: '#000000' }, sfc: { bg: ['#28307c', '#10143c'], fg: '#f8f8f8', name: '#f8e088', b1: '#e8e8f0', b2: '#787898' }, gb: { bg: GB[3], fg: GB[0], name: GB[0], b1: GB[0], b2: GB[3] } }[M];
  P.text = (s, x, y, col) => ctx.drawImage(glyph(s, col || WIN.fg), Math.round(x), Math.round(y));
  P.window = (x, y, w, h) => { x = Math.round(x); y = Math.round(y);
    if (M === 'sfc') { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, WIN.bg[0]); g.addColorStop(1, WIN.bg[1]); ctx.globalAlpha = .92; ctx.fillStyle = g; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.globalAlpha = 1;
      ctx.fillStyle = WIN.b2; ctx.fillRect(x + 1, y, w - 2, 1); ctx.fillRect(x + 1, y + h - 1, w - 2, 1); ctx.fillRect(x, y + 1, 1, h - 2); ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
      ctx.fillStyle = WIN.b1; ctx.fillRect(x + 2, y + 1, w - 4, 1); ctx.fillRect(x + 1, y + 2, 1, h - 4); ctx.fillStyle = '#a8a8c8'; ctx.fillRect(x + 2, y + h - 2, w - 4, 1); ctx.fillRect(x + w - 2, y + 2, 1, h - 4); return; }
    ctx.fillStyle = WIN.bg; ctx.fillRect(x, y, w, h); ctx.fillStyle = WIN.b1; ctx.fillRect(x + 2, y + 2, w - 4, 1); ctx.fillRect(x + 2, y + h - 3, w - 4, 1); ctx.fillRect(x + 2, y + 2, 1, h - 4); ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
    if (M === 'fc') { ctx.fillStyle = WIN.bg; for (const [a, b] of [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]]) ctx.fillRect(x + a, y + b, 1, 1); } else { ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h); } };
  // 会話の窓（画面の下）。文は かな多めで短く。shown＝出す字の数
  P.talk = (name, line, shown, op = {}) => { const pad = M === 'gb' ? 6 : 8, w = P.W - (M === 'gb' ? 8 : 16), lh = P.FS + (M === 'gb' ? 2 : 4), lines = []; let cur = '';
    for (const ch of line) { if (ch === '\n' || (P.textWidth(cur + ch) > w - pad * 2 && cur)) { lines.push(cur); cur = ch === '\n' ? '' : ch; } else cur += ch; } lines.push(cur);
    const ML = M === 'gb' ? 2 : 4, sn = M === 'gb' ? 0 : 1, rows = Math.min(lines.length, ML - sn);   // ゲームボーイふうは 2 行の窓（名前は文の前に「」で）。うち出しが進むと 行が上へ送られる
    let typed = [], n = shown; for (const l of lines) { if (n <= 0) break; typed.push(l.slice(0, n)); n -= l.length; } if (M === 'gb' && name && typed.length) typed[0] = typed[0];
    const vis = typed.slice(Math.max(0, typed.length - rows)), h = pad * 2 + lh * (rows + sn) - 2, x = (P.W - w) / 2, y = op.y ?? P.H - h - (M === 'gb' ? 2 : 8); P.window(x, y, w, h); let yy = y + pad - 1;
    if (name && sn) { P.text(name, x + pad, yy, WIN.name); yy += lh; } for (const l of vis) { P.text(l, x + pad, yy); yy += lh; }
    if (shown >= [...line].length && Math.floor(performance.now() / 300) % 2) { ctx.fillStyle = WIN.fg; const ax = x + w - pad - 3, ay = y + h - pad - 2; ctx.fillRect(ax, ay, 5, 1); ctx.fillRect(ax + 1, ay + 1, 3, 1); ctx.fillRect(ax + 2, ay + 2, 1, 1); } };
  P.loop = f => { let last = performance.now(), t = 0; const step = now => { const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now; t += dt; f(t, dt); requestAnimationFrame(step); }; requestAnimationFrame(step); };
  P.GB = GB; P.ramp8 = ramp8; return P;
};
