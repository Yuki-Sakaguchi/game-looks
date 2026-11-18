window.RETRO = (THREE, K) => {
  // ================= 1. 色とドット絵の道具 =================
  const hash = (a, b = 0, s = 0) => { const n = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const rgb = c => { if (typeof c !== 'string') return c; let s = c.replace('#', ''); if (s.length === 3) s = s.replace(/./g, '$&$&'); const n = parseInt(s, 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hex = c => typeof c === 'string' ? c : '#' + c.map(v => cl(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  const toHsl = c => { const [r, g, b] = rgb(c).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l]; const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h / 6, s, l]; };
  const fromHsl = (h, s, l) => { h = ((h % 1) + 1) % 1; s = cl(s); l = cl(l); const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); }; return hex([f(0), f(8), f(4)]); };
  const lerpHue = (a, b, t) => a + ((((b - a + 1.5) % 1) + 1) % 1 - .5) * t;
  const mix = (a, b, t) => { a = rgb(a); b = rgb(b); return hex(a.map((v, i) => v + (b[i] - v) * t)); };
  // 1 つの色から、暗い→明るいの n 段（既定 6 段。3 番めが元の色）を作る。影は青むらさきへ、光は黄へ色あいを少しずらす（ドット絵の色の作り方）
  function ramp(base, n = 6, o = {}) { const [h, s, l] = toHsl(base), pv = o.pivot ?? .6, kc = o.contrast ?? 1, out = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1); let H, S, L;
      if (t < pv) { const k = (pv - t) / pv; L = l * (1 - .6 * k * kc); S = Math.max(Math.min(s * (1 + .12 * k), s * (1 - Math.abs(2 * l - 1)) * (1 + .3 * k) / Math.max(.05, 1 - Math.abs(2 * L - 1))), .1 * k); H = s < .03 ? (o.cool ?? .72) : lerpHue(h, o.cool ?? .72, .2 * k); }
      else { const k = (t - pv) / (1 - pv); L = l + (1 - l) * .62 * k * kc; S = Math.max(s * (1 - .28 * k), s < .03 ? .06 * k : 0); H = s < .03 ? (o.warm ?? .13) : lerpHue(h, o.warm ?? .13, .16 * k); }
      out.push(fromHsl(H, S, L)); } return out; }
  const tone = (R, i) => R[cl(Math.round(i), 0, R.length - 1)];
  // くり返せる なめらかな乱数（cx×cy ドットごとの格子。W×H ドットで 1 周する）
  const tn = (x, y, cx, cy, W, H, s = 0) => { const fx = x / cx, fy = y / cy, ix = Math.floor(fx), iy = Math.floor(fy), nx = Math.round(W / cx), ny = Math.round(H / cy), sm = v => v * v * (3 - 2 * v), u = sm(fx - ix), v = sm(fy - iy), g = (i, j) => hash(((i % nx) + nx) % nx, ((j % ny) + ny) % ny, s + 17); return (g(ix, iy) * (1 - u) + g(ix + 1, iy) * u) * (1 - v) + (g(ix, iy + 1) * (1 - u) + g(ix + 1, iy + 1) * u) * v; };
  // くり返せるボロノイ（石・岩のかたち）。size ドットの中に n×n 個の点。sq を上げるとセルが四角に近づく
  const voro = (x, y, size, n, jit, seed, sq = 0) => { const cs = size / n, gx = Math.floor(x / cs), gy = Math.floor(y / cs); let b1 = 1e9, b2 = 1e9, id = 0, bx = 0, by = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = gx + i, cy = gy + j, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n, px = (cx + .5 + (hash(wx, wy, seed) - .5) * jit) * cs, py = (cy + .5 + (hash(wx, wy, seed + 9) - .5) * jit) * cs, ax = x + .5 - px, ay = y + .5 - py, d = Math.hypot(ax, ay) * (1 - sq) + Math.max(Math.abs(ax), Math.abs(ay)) * sq; if (d < b1) { b2 = b1; b1 = d; id = wy * n + wx; bx = ax; by = ay; } else if (d < b2) b2 = d; }
    return { id, d1: b1, d2: b2, dx: bx, dy: by }; };

  // ドット絵を打つ板。色は '#rrggbb'、null は抜き（すきとおる）。clip=false のときは はみ出た分が反対側に回る（くり返し模様用）
  function Px(w, h = w) { const d = new Array(w * h).fill(null), P = { w, h, d, clip: false };
    const ix = (x, y) => (((y % h) + h) % h) * w + (((x % w) + w) % w);
    P.set = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (c === undefined || (P.clip && (x < 0 || y < 0 || x >= w || y >= h))) return; d[ix(x, y)] = c; };
    P.get = (x, y) => { x = Math.floor(x); y = Math.floor(y); return P.clip && (x < 0 || y < 0 || x >= w || y >= h) ? null : d[ix(x, y)]; };
    P.rect = (x, y, rw, rh, c) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) P.set(x + i, y + j, c); };
    P.fill = c => { d.fill(c); return P; };
    P.each = f => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = f(x, y, d[y * w + x]); if (v !== undefined) d[y * w + x] = v; } return P; };
    P.line = (x0, y0, x1, y1, c) => { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let k = 0; k < 400; k++) { P.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
    P.disc = (cx, cy, r, c) => { for (let j = Math.floor(cy - r); j <= cy + r; j++) for (let i = Math.floor(cx - r); i <= cx + r; i++) if ((i + .5 - cx) ** 2 + (j + .5 - cy) ** 2 < r * r) P.set(i, j, c); };
    P.blit = (Q, x, y) => { for (let j = 0; j < Q.h; j++) for (let i = 0; i < Q.w; i++) { const c = Q.d[j * Q.w + i]; if (c !== null) P.set(x + i, y + j, c); } };
    // ふちに光と影のついた四角（れんが・石・板の 1 枚）。R は ramp、t は面の段。round でかどを 1 ドット落とす
    P.block = (x, y, bw, bh, R, t, o = {}) => { for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) { const e0 = i === 0 || j === 0, e1 = i === bw - 1 || j === bh - 1, cn = (i === 0 || i === bw - 1) && (j === 0 || j === bh - 1); if (o.round && cn) continue; P.set(x + i, y + j, tone(R, e0 && e1 ? t : e0 ? t + (o.hi ?? 1) : e1 ? t - (o.lo ?? 1) : t)); } };
    // 文字の並びで小さな絵を置く。map = { 文字: 色 }
    P.bits = (x, y, rows, map) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (map[ch] !== undefined) P.set(x + i, y + j, map[ch]); }));
    P.mul = (x, y, f) => { const c = P.get(x, y); if (c) P.set(x, y, hex(rgb(c).map(v => v * f))); };
    P.canvas = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h); for (let i = 0; i < w * h; i++) { const q = d[i]; if (q) { const [r, gg, b] = rgb(q); im.data[i * 4] = r; im.data[i * 4 + 1] = gg; im.data[i * 4 + 2] = b; im.data[i * 4 + 3] = 255; } } g.putImageData(im, 0, 0); return c; };
    return P; }

  // ================= 2. テクスチャの絵（T.名前(o) が Px を返す） =================
  const T = {}, META = {};   // META[名前] = { m: 1 枚が何メートルか, cut: 抜き色つきか }
  const tex = {}, texCache = new Map();   // R.tex.名前(o) → THREE.Texture（同じ引数なら同じ物を返す）
  const def = (name, m, fn, cut = false) => { T[name] = fn; META[name] = { m, cut }; tex[name] = (o = {}) => { const key = name + JSON.stringify(o); let t = texCache.get(key); if (!t) { const M = META[name], c = M.cutIf ? !!M.cutIf(o) : M.cut; t = toTex(T[name](o), { m: o.m || M.m, cut: c, name }); texCache.set(key, t); } return t; }; };

  // ---- 地面 ----
  def('grass', 3, (o = {}) => { const P = Px(64), G0 = ramp(o.c || '#5f9c4c'), G = [G0[1], G0[2], mix(G0[2], G0[3], .55), G0[3], mix(G0[3], G0[4], .5), G0[4], G0[5]], sd = o.seed || 0, lv = new Int8Array(4096);   // 7 段（3 が元の色）
    P.each((x, y) => { const n = tn(x, y, 16, 8, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 3) * .4, t = n > .6 ? 4 : n < .4 ? 2 : 3; lv[y * 64 + x] = t; return G[t]; });
    const st = [['l...l', '.l.l.', '.lml.', '.ddd.'], ['..l..', 'l.l..', '.lm.l', '.lml.', '..dd.'], ['l.l', '.l.', '.d.'], ['l', 'm', 'd'], ['.l.', 'l.l', 'ld.']];
    for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) { const r = hash(i, j, sd + 1); if (r > (o.blades ?? .78)) continue; const x = Math.floor(i * 6.4 + hash(i, j, sd + 2) * 5), y = Math.floor(j * 6.4 + hash(i, j, sd + 4) * 5), b = lv[(y & 63) * 64 + (x & 63)], k = Math.floor(r * 131) % 9; P.bits(x, y, st[k < 2 ? 0 : k < 4 ? 1 : k < 6 ? 2 : k < 8 ? 3 : 4], { l: G[b + 2], m: G[b + 1], d: G[b - 2] }); }
    const fc = o.fc || ['#ffffff', '#ffe27a', '#f7a8c4'], fl = o.flowers ?? .12;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const r = hash(i, j, sd + 7); if (r > fl) continue; const x = i * 8 + 2 + Math.floor(hash(i, j, sd + 8) * 5), y = j * 8 + 2 + Math.floor(hash(i, j, sd + 9) * 5), c = fc[Math.floor(r / fl * fc.length) % fc.length];
      if (hash(i, j, sd + 10) > .45) { P.set(x, y - 1, c); P.set(x - 1, y, c); P.set(x + 1, y, c); P.set(x, y + 1, c); P.set(x, y, '#f2b23a'); P.set(x + 1, y + 1, G[0]); P.set(x, y + 2, G[0]); } else { P.set(x, y, c); P.set(x + 1, y, mix(c, G[2], .25)); P.set(x, y + 1, G[0]); } }
    return P; });

  def('dirt', 3, (o = {}) => { const P = Px(64), D0 = ramp(o.c || '#a07c56'), D = [D0[1], D0[2], mix(D0[2], D0[3], .55), D0[3], mix(D0[3], D0[4], .5), D0[4]], S = ramp(o.stone || '#a8a296'), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 16, 8, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 3) * .4; return D[n > .6 ? 4 : n < .38 ? 2 : 3]; });
    for (let k = 0; k < 9; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64), len = 4 + Math.floor(hash(k, 3, sd) * 6); for (let i = 0; i < len; i++) { const yy = y + (i > len / 2 ? 1 : 0); P.set(x + i, yy, D[i % 5 === 4 ? 2 : 1]); P.set(x + i, yy + 1, D[5]); } }   // わだち・ひび
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { if (hash(i, j, sd + 5) > (o.pebbles ?? .6)) continue; const x = i * 16 + Math.floor(hash(i, j, sd + 6) * 13), y = j * 16 + Math.floor(hash(i, j, sd + 7) * 13), big = hash(i, j, sd + 8) > .5;
      if (big) { P.bits(x, y, ['.hh.', 'hmmd', '.dd.'], { h: S[5], m: S[3], d: S[2] }); P.set(x + 1, y + 3, D[0]); P.set(x + 2, y + 3, D[0]); P.set(x + 3, y + 3, D[0]); } else { P.set(x, y, S[4]); P.set(x + 1, y, S[3]); P.set(x, y + 1, D[0]); P.set(x + 1, y + 1, D[0]); } }
    for (let k = 0; k < 22; k++) { const x = Math.floor(hash(k, 11, sd) * 64), y = Math.floor(hash(k, 12, sd) * 64); P.set(x, y, D[5]); P.set(x + 1, y, D[5]); P.set(x + 1, y + 1, D[1]); }
    return P; });

  def('sand', 3, (o = {}) => { const P = Px(64), S0 = ramp(o.c || '#e6d2a0'), S = [S0[1], S0[2], mix(S0[2], S0[3], .5), S0[3], mix(S0[3], S0[4], .5), S0[4]], sd = o.seed || 0;
    P.each((x, y) => { const w = y + Math.sin(x / 64 * Math.PI * 4 + tn(x, y, 16, 16, 64, 64, sd) * 3) * 2.5 + tn(x, y, 32, 32, 64, 64, sd + 2) * 8, b = ((w % 16) + 16) % 16, brk = tn(x, y, 8, 8, 64, 64, sd + 9) > .3; return b < 1 && brk ? S[5] : b < 2 ? S[4] : b >= 14 && b < 15 && brk ? S[2] : b >= 13 ? ((x + y) & 1 ? S[2] : S[3]) : (tn(x, y, 16, 8, 64, 64, sd + 5) > .62 ? S[4] : S[3]); });
    for (let k = 0; k < 7; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64); if (k % 2) { P.set(x, y, '#fff8ea'); P.set(x + 1, y, '#f4c8b8'); P.set(x, y + 1, S[0]); P.set(x + 1, y + 1, S[0]); } else { P.set(x, y, S[1]); P.set(x + 1, y, S[2]); } }
    return P; });

  def('snow', 3, (o = {}) => { const P = Px(64), W0 = ramp(o.c || '#e4ecf6', 6, { cool: .62 }), W = [W0[2], mix(W0[2], W0[3], .5), W0[3], mix(W0[3], W0[4], .5), W0[4], W0[5]], sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 32, 16, 64, 64, sd) * .6 + tn(x, y, 16, 8, 64, 64, sd + 3) * .4, ch = (x + y) & 1; return n > .7 ? W[1] : n > .66 ? (ch ? W[1] : W[2]) : n > .58 ? W[2] : n > .54 ? (ch ? W[2] : W[3]) : n < .3 ? (n < .26 || ch ? W[5] : W[4]) : n < .42 ? W[4] : W[3]; });
    for (let k = 0; k < 14; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64); P.set(x, y, '#ffffff'); if (k % 3 === 0) { P.set(x - 1, y, W[5]); P.set(x + 1, y, W[5]); P.set(x, y - 1, W[5]); P.set(x, y + 1, W[5]); } }
    return P; });

  // 石だたみ。kind: 'round'（丸い石をしきつめる）/ 'slab'（四角い敷石）。moss で目地に草
  def('cobble', 3, (o = {}) => { const P = Px(64), R = ramp(o.c || '#a39a8c'), sd = o.seed || 0, n = o.n || 7, G = ramp(o.mossC || '#6f9a4e');
    if (o.kind === 'slab') { let y = 0; for (const [r, hh] of [16, 13, 19, 16].entries()) { let x = Math.floor(hash(r, 0, sd) * 20); const x0 = x; while (x < x0 + 64) { let bw = 12 + Math.floor(hash(r, x, sd + 1) * 16); if (x0 + 64 - (x + bw) < 9) bw = x0 + 64 - x; const t = [3, 3, 2, 4, 3][Math.floor(hash(r, x, sd + 2) * 5)]; P.rect(x, y, bw, hh, R[0]); P.block(x, y, bw - 1, hh - 1, R, t, { round: true });
            if (hash(r, x, sd + 3) > .55) { const cx = x + 2 + Math.floor(hash(r, x, sd + 4) * (bw - 7)), cy = y + 2 + Math.floor(hash(r, x, sd + 5) * (hh - 6)); P.set(cx, cy, R[t - 1]); P.set(cx + 1, cy + 1, R[t - 1]); P.set(cx + 2, cy + 1, R[t - 1]); P.set(cx + 1, cy + 2, R[t + 1]); }
            if (hash(r, x, sd + 6) > .7) P.set(x + bw - 2, y + hh - 2, R[0]); x += bw; } y += hh; } }
    else P.each((x, y) => { const v = voro(x, y, 64, n, o.jit ?? .62, sd, .45), e = (v.d2 - v.d1) / 2, t = [3, 3, 2, 4, 3, 3, 2][Math.floor(hash(v.id, 3, sd) * 7)], dir = (v.dx + v.dy) / (v.d1 + .01);
        if (e < .75) return R[0]; if (e < 1.5) return dir > .25 ? R[1] : tone(R, t + 1); if (e < 2.4 && dir < -.5) return tone(R, t + 1); if (e < 2.2 && dir > .7) return tone(R, t - 1);
        return hash(x, y, sd + v.id) > .95 ? tone(R, t - 1) : R[t]; });
    if (o.moss) P.each((x, y, c) => (c === R[0] && tn(x, y, 16, 16, 64, 64, sd + 20) < o.moss * .8) ? (hash(x, y, sd) > .5 ? G[3] : G[2]) : undefined);
    return P; });

  // れんが敷き（2 枚ずつ たて・よこに組む）
  def('brickFloor', 3, (o = {}) => { const P = Px(64), R = ramp(o.c || '#b4694a'), M = o.mortar || mix(R[1], '#5a5048', .5), sd = o.seed || 0; P.fill(M);
    for (let by = 0; by < 4; by++) for (let bx = 0; bx < 4; bx++) for (let k = 0; k < 2; k++) { const hz = (bx + by) % 2 === 0, x = bx * 16 + (hz ? 0 : k * 8), y = by * 16 + (hz ? k * 8 : 0), bw = hz ? 15 : 7, bh = hz ? 7 : 15, r = hash(bx * 2 + k, by, sd), t = [3, 3, 2, 4, 3, 3][Math.floor(r * 6)], RR = hash(bx, by * 2 + k, sd + 4) > .88 ? ramp(mix(o.c || '#b4694a', '#6a4a5a', .45)) : R; P.block(x, y, bw, bh, RR, t);
        if (r > .7) { const px = x + 2 + Math.floor(hash(bx, by, sd + k) * (bw - 4)), py = y + 2 + Math.floor(hash(bx, by, sd + 5 + k) * (bh - 4)); P.set(px, py, RR[t - 1]); P.set(px + 1, py, RR[t - 1]); P.set(px + 1, py + 1, RR[t + 1]); }
        if (r < .12) P.set(x + bw - 1, y + bh - 1, M); }
    return P; });

  // 板。dir: 'h'（よこ向き。床）/ 'v'（たて向き。板ばりのかべ）。w = 板のはば（ドット）、len = つぎ目の間かく
  const wood = (o = {}) => { const S = o.size || 64, P = Px(S), R = ramp(o.c || '#a97c50'), sd = o.seed || 0, w = o.w || 8, len = o.len || 32, v = o.dir === 'v', put = (x, y, c) => v ? P.set(y, x, c) : P.set(x, y, c);
    for (let r = 0; r * w < S; r++) { const y0 = r * w, t = (o.soft ? [3, 3, 2, 3, 3, 4, 3] : [3, 3, 2, 4, 3])[Math.floor(hash(r, 1, sd) * (o.soft ? 7 : 5))], jo = Math.floor(hash(r, 2, sd) * len), g1 = 2 + Math.floor(hash(r, 3, sd) * (w - 4)), kn = hash(r, 4, sd) > .7 ? Math.floor(hash(r, 5, sd) * S) : -99;
      for (let x = 0; x < S; x++) { for (let j = 0; j < w; j++) put(x, y0 + j, j === 0 ? tone(R, t + 1) : j === w - 1 ? R[0] : j === w - 2 ? tone(R, t - 1) : R[t]);
        const wob = Math.round(tn(x, r * 8, 16, 8, S, 64, sd) * 2 - 1); if (tn(x, r * 8, 8, 8, S, 64, sd + 9) > .42) put(x, y0 + cl(g1 + wob, 1, w - 3), tone(R, t - 1)); if (w > 6 && tn(x, r * 8, 8, 8, S, 64, sd + 13) > .62) put(x, y0 + cl(g1 + 2 + wob, 1, w - 3) , tone(R, t + 1));
        if (((x - jo) % len + len) % len === 0) { for (let j = 0; j < w - 1; j++) { put(x, y0 + j, R[0]); put(x + 1, y0 + j, tone(R, t + 1)); } if (o.nails !== false) { put(x + 3, y0 + (w >> 1), R[0]); put(x + 3, y0 + (w >> 1) - 1, tone(R, t + 2)); put(x - 3, y0 + (w >> 1), R[0]); put(x - 3, y0 + (w >> 1) - 1, tone(R, t + 2)); } } }
      if (kn >= 0 && w >= 6) { const ky = y0 + (w >> 1) - 1; for (const [dx, dy, c] of [[0, 0, R[1]], [1, 0, R[0]], [2, 0, R[1]], [0, 1, R[1]], [1, 1, R[2]], [2, 1, R[1]], [-1, 0, tone(R, t - 1)], [3, 1, tone(R, t - 1)], [1, -1, tone(R, t - 1)]]) put(kn + dx, ky + dy, c); } }
    return P; };
  def('planks', 3, o => wood({ dir: 'h', ...o }));
  def('boards', 3, o => wood({ dir: 'v', c: '#8f6a4a', len: 9999, soft: 1, ...o }));

  // 道路（アスファルト）。line: 'none' / 'center'（まん中の破線）/ 'edge'（両はしの白線）/ 'both' / 'zebra'（横断歩道）。よこ 64 ドット＝道のはば
  def('road', 6, (o = {}) => { const P = Px(64), A0 = ramp(o.c || '#5c5a66'), A = [A0[1], A0[2], mix(A0[2], A0[3], .5), A0[3], mix(A0[3], A0[4], .45), A0[4]], sd = o.seed || 0, L = o.lineC || '#e8e4d4', Y = o.centerC || '#e8c24a';
    P.each((x, y) => { const n = tn(x, y, 16, 16, 64, 64, sd), h2 = hash(x >> 1, y >> 1, sd), h1 = hash(x, y, sd + 2); return h2 > .965 ? A[4] : h1 > .955 ? A[2] : n > .64 ? A[2] : n < .3 ? A[4] : A[3]; });
    let cx = 20, cy = 0; for (let k = 0; k < 64; k++) { P.set(cx, cy, A[0]); if (k % 3 === 0) P.set(cx + 1, cy, A[5]); cy++; cx += hash(k, 5, sd) > .62 ? 1 : hash(k, 6, sd) > .7 ? -1 : 0; }
    for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) P.set(44 + i, 40 + j, (i === 0 || j === 0) ? A[5] : (i === 8 || j === 5) ? A[0] : A[2]);
    const worn = (x, y, c) => { const n = tn(x, y, 8, 8, 64, 64, sd + 31); if (n < .9) P.set(x, y, n > .8 ? mix(c, A[3], .4) : c); }, ln = o.line || 'none';
    if (ln === 'edge' || ln === 'both') for (let y = 0; y < 64; y++) for (const x of [3, 4, 59, 60]) worn(x, y, L);
    if (ln === 'center' || ln === 'both') for (let y = 6; y < 38; y++) for (const x of [31, 32]) worn(x, y, Y);
    if (ln === 'zebra') for (let y = 8; y < 56; y++) for (let x = 0; x < 64; x++) if ((x >> 3) % 2 === 0) worn(x, y, L);
    return P; });

  // 水。frame（0〜frames−1）でさざ波がのびちぢみする。R.tex.water(o) は全部のコマの並びを返す
  def('water', 3, (o = {}) => { const P = Px(64), W = ramp(o.c || '#3f8fc0', 6, { warm: .5 }), sd = o.seed || 0, f = o.frame || 0, nf = o.frames || 4;
    P.each((x, y) => { const n = tn(x, y, 16, 8, 64, 64, sd) * .6 + tn(x, y, 32, 16, 64, 64, sd + 5) * .4; return n > .6 ? mix(W[3], W[4], .4) : n < .36 ? W[2] : n < .42 && ((x + y) & 1) ? W[2] : W[3]; });
    for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { const k = i + j * 4, ph = (f + Math.floor(hash(k, 3, sd) * nf)) % nf, a = Math.sin(ph / nf * Math.PI * 2), x = i * 16 + Math.floor(hash(k, 1, sd) * 12) + (j % 2) * 8, y = j * 8 + 2 + Math.floor(hash(k, 2, sd) * 4), len = Math.round(5 + hash(k, 4, sd) * 5 + a * 2.5); if (hash(k, 5, sd) > .8) continue;
        for (let q = 0; q < len; q++) { const up = q === 0 || q === len - 1 ? -1 : 0; P.set(x + q - (len >> 1), y + up, a > .5 && q > 1 && q < len - 2 ? '#ffffff' : W[5]); if (q > 0 && q < len - 1) P.set(x + q - (len >> 1), y + 1, W[4]); if (q > 1 && q < len - 1 && k % 2) P.set(x + q - (len >> 1) + 1, y + 2, W[2]); } }
    return P; });

  // ---- かべ ----
  def('brick', 3, (o = {}) => { const P = Px(64), base = o.c || '#b25a40', R = ramp(base), B2 = ramp(mix(base, '#5a3a4a', .4)), B3 = ramp(mix(base, '#e0a070', .35)), Mr = ramp(o.mortar || mix(base, '#8f8478', .78)), sd = o.seed || 0;
    for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const x = k * 16 + (r % 2) * 8, y = r * 8, h1 = hash(k, r, sd), RR = h1 > .9 ? B2 : h1 < .1 ? B3 : R; let t = [3, 3, 3, 2, 4, 3][Math.floor(hash(k, r, sd + 1) * 6)]; if (tn(x, y, 16, 16, 64, 64, sd + 2) > .68) t--;
        P.rect(x, y, 16, 8, Mr[2]); for (let i = 0; i < 16; i++) P.set(x + i, y + 7, Mr[1]); P.set(x + 15, y, Mr[3]); P.block(x, y, 15, 7, RR, t);
        const h2 = hash(k, r, sd + 3); if (h2 > .86) { P.set(x, y, Mr[2]); P.set(x + 1, y, tone(RR, t + 1)); P.set(x, y + 1, tone(RR, t + 1)); } else if (h2 < .1) { P.set(x + 14, y + 6, Mr[1]); P.set(x + 13, y + 6, Mr[1]); }
        const h3 = hash(k, r, sd + 4), px = x + 3 + Math.floor(hash(k, r, sd + 5) * 8), py = y + 2 + Math.floor(hash(k, r, sd + 6) * 3); if (h3 > .7) { P.set(px, py, tone(RR, t - 1)); P.set(px + 1, py, tone(RR, t - 1)); P.set(px + 1, py + 1, tone(RR, t + 1)); } else if (h3 < .25) { P.set(px, py, tone(RR, t + 1)); P.set(px + 1, py, tone(RR, t + 1)); P.set(px + 2, py, tone(RR, t + 1)); } }
    return P; });

  // 石づみ。moss（0〜1）で下のかどに こけ
  def('stone', 3, (o = {}) => { const P = Px(64), R = ramp(o.c || '#9c958a'), M = o.mortar || R[0], G = ramp(o.mossC || '#6f9a4e'), sd = o.seed || 0; P.fill(M); let y = 0;
    for (const [r, hh] of [11, 10, 11, 10, 11, 11].entries()) { let x = Math.floor(hash(r, 0, sd) * 24); const x0 = x; while (x < x0 + 64) { let bw = 9 + Math.floor(hash(r, x, sd + 1) * 13); if (x0 + 64 - (x + bw) < 8) bw = x0 + 64 - x; const t = [3, 3, 2, 4, 3, 2][Math.floor(hash(r, x, sd + 2) * 6)]; P.block(x, y, bw - 1, hh - 1, R, t, { round: true });
        for (let i = 2; i < bw - 4; i++) if (tn(x + i, y, 8, 8, 64, 64, sd + r) > .55) P.set(x + i, y + 2, tone(R, t + 1));
        const h3 = hash(r, x, sd + 3); if (h3 > .68) { const cx = x + 2 + Math.floor(hash(r, x, sd + 4) * (bw - 6)); P.set(cx, y + 4, tone(R, t - 1)); P.set(cx + 1, y + 5, tone(R, t - 1)); P.set(cx + 1, y + 6, tone(R, t - 1)); P.set(cx + 2, y + 6, tone(R, t + 1)); } else if (h3 < .2) P.rect(x + bw - 3, y + hh - 3, 2, 2, M);
        if (o.moss && hash(r, x, sd + 7) < o.moss) { const mw = 3 + Math.floor(hash(r, x, sd + 8) * 4); for (let i = 0; i < mw; i++) { P.set(x + i, y + hh - 2, G[i % 3 === 1 ? 4 : 3]); if (i < mw - 1 && i % 2 === 0) P.set(x + i, y + hh - 3, G[3]); P.set(x + i, y + hh - 1, G[2]); } } x += bw; } y += hh; }
    return P; });

  // しっくい＋木組み。frame: 'none' / 'box'（下に梁、左に柱）/ 'cross'（＋ばってん）/ 'diag'（＋ななめ 1 本）/ 'beam'（梁だけ）。wood が木の色。patch でれんがののぞく はがれ
  def('plaster', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#eadcbc', 6, { contrast: .7 }), W = ramp(o.wood || '#6e4b34'), sd = o.seed || 0, fr = o.frame || 'none', B = ramp(o.brickC || '#b25a40');
    P.each((x, y) => { const n = tn(x, y, 16, 16, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 3) * .4; return n > .66 ? C[4] : n < .3 ? C[2] : C[3]; });
    for (let k = 0; k < 3; k++) { let x = 10 + Math.floor(hash(k, 1, sd) * 44), y = 8 + Math.floor(hash(k, 2, sd) * 40); const len = 5 + Math.floor(hash(k, 3, sd) * 7); for (let i = 0; i < len; i++) { P.set(x, y, C[2]); P.set(x + 1, y, C[4]); y++; x += hash(k, i, sd + 4) > .6 ? 1 : hash(k, i, sd + 5) > .75 ? -1 : 0; } }
    for (let k = 0; k < 10; k++) { const x = Math.floor(hash(k, 6, sd) * 64), y = Math.floor(hash(k, 7, sd) * 64); P.set(x, y, C[4]); P.set(x + 1, y, C[4]); P.set(x + 2, y + 1, C[4]); P.set(x + 1, y + 1, C[2]); }
    if (o.patch) { const x = 30 + Math.floor(hash(1, 8, sd) * 14), y = 34 + Math.floor(hash(1, 9, sd) * 10); for (const [dx, dy, bw] of [[1, 0, 6], [8, 0, 4], [0, 4, 3], [4, 4, 6], [11, 4, 3], [2, 8, 5], [8, 8, 4]]) { P.rect(x + dx - 1, y + dy - 1, bw + 2, 5, C[1]); } for (const [dx, dy, bw] of [[1, 0, 6], [8, 0, 4], [0, 4, 3], [4, 4, 6], [11, 4, 3], [2, 8, 5], [8, 8, 4]]) P.block(x + dx, y + dy, bw, 3, B, 3); }
    const beamH = (y, hh) => { for (let x = 0; x < 64; x++) for (let j = 0; j < hh; j++) P.set(x, y + j, j === 0 ? W[4] : j === hh - 1 ? W[1] : (tn(x, j, 8, 2, 64, 8, sd + y) > .6 ? W[2] : W[3])); for (let x = 0; x < 64; x++) P.set(x, y + hh, C[2]); };
    const beamV = (x, ww) => { for (let y = 0; y < 64; y++) for (let i = 0; i < ww; i++) P.set(x + i, y, i === 0 ? W[4] : i === ww - 1 ? W[1] : (tn(i, y, 2, 8, 8, 64, sd + x) > .6 ? W[2] : W[3])); for (let y = 0; y < 64; y++) P.set(x + ww, y, C[2]); };
    const beamD = (x0, y0, x1, y1) => { for (let k = -2; k <= 2; k++) P.line(x0, y0 + k, x1, y1 + k, k === -2 ? W[4] : k === 2 ? W[1] : (k === 0 ? W[2] : W[3])); P.line(x0, y0 + 3, x1, y1 + 3, C[2]); };
    if (fr === 'cross') { beamD(5, 2, 63, 56); beamD(5, 56, 63, 2); } if (fr === 'diag') beamD(5, 54, 63, 4);
    if (fr !== 'none') beamH(58, 6); if (fr === 'box' || fr === 'cross' || fr === 'diag') { beamV(0, 6); for (const [x, y] of [[2, 60], [3, 4]]) { P.set(x, y, W[0]); P.set(x + 1, y, W[5]); } }
    return P; });

  def('concrete', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#a8a8a2', 6, { contrast: .75 }), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 32, 32, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 3) * .4; return n > .62 ? C[4] : n < .33 ? C[2] : C[3]; });
    for (let k = 0; k < 7; k++) { const x = Math.floor(hash(k, 1, sd) * 64), len = 10 + Math.floor(hash(k, 2, sd) * 26), w2 = 1 + (k % 2); for (let y = 1; y < len; y++) for (let i = 0; i < w2; i++) if (y < len * .6 || ((x + i + y) & 1)) P.set(x + i, y, C[2]); }
    for (const s of [0, 32]) { for (let i = 0; i < 64; i++) { P.set(i, s, C[1]); P.set(i, s + 1, C[4]); P.set(s, i, C[1]); P.set(s + 1, i, C[4]); } }
    for (const y of [9, 24, 41, 56]) for (const x of [8, 24, 40, 56]) { P.set(x, y, C[1]); P.set(x + 1, y, C[1]); P.set(x, y + 1, C[1]); P.set(x + 1, y + 1, C[2]); P.set(x + 2, y + 1, C[5]); P.set(x + 1, y + 2, C[5]); }
    return P; });

  // シャッター（1 枚で 1 つ分。上下にはくり返さない）。c は板の色
  def('shutter', 3, (o = {}) => { const P = Px(64), S = ramp(o.c || '#a9b0b4'), D = ramp(o.rail || '#5a626a'), Ru = ramp('#a8663c'), sd = o.seed || 0;
    P.each((x, y) => [S[5], S[4], S[3], S[1]][y % 4]);
    P.each((x, y, c) => { const n = tn(x, y, 8, 16, 64, 64, sd) + (y / 64) * .35; return n > 1.02 && y % 4 !== 0 ? (hash(x, y, sd) > .5 ? Ru[3] : Ru[2]) : (tn(x, y, 4, 32, 64, 64, sd + 4) > .78 && y % 4 === 1) ? S[3] : undefined; });
    for (let y = 0; y < 64; y++) { P.bits(0, y, ['132'], { 1: D[4], 2: D[1], 3: D[3] }); P.bits(61, y, ['132'], { 1: D[4], 2: D[1], 3: D[3] }); }
    for (let x = 3; x < 61; x++) for (let j = 0; j < 6; j++) P.set(x, 58 + j, j === 0 ? D[5] : j === 5 ? D[0] : D[3]);
    P.rect(27, 60, 10, 2, D[0]); for (let i = 0; i < 10; i++) P.set(27 + i, 62, D[5]); P.rect(8, 60, 3, 3, D[1]); P.set(9, 61, '#e8c24a');
    return P; });

  // 窓（抜き色つきの 1 枚）。h: 32 / 48、lit: 夜のあかり、curtain: 色 か false、bars: 'cross' / 'grid' / 'none'、arch: 上を丸く、shutters: 両わきのよろい戸（はば 48 になる）、box: 下の花の箱、frame: わくの色
  def('window', 1, (o = {}) => { const hh = o.h || 32, sh = o.shutters ? 8 : 0, w = 32 + sh * 2, P = Px(w, hh), F = ramp(o.frame || '#7a5236'), Gl = ramp(o.glass || '#3d5a78', 6, { warm: .5 }), Lt = ['#c4621e', '#e8892c', '#f6b446', '#fbdc80', '#fff4c4'], x0 = sh, bx = o.box ? 7 : 0, top = 0, bot = hh - bx; P.clip = true;
    const cw = o.curtain === false ? null : (o.curtain === true || !o.curtain ? '#efe6d2' : o.curtain), Cu = cw && ramp(o.lit ? mix(cw, '#f2a850', .45) : cw);
    P.block(x0, top, 32, bot - top - 3, F, 3); P.block(x0 + 1, top + 1, 30, bot - top - 5, F, 2, { hi: 1, lo: 1 });
    const gx0 = x0 + 3, gx1 = x0 + 28, gy0 = top + 3, gy1 = bot - 7, gh = gy1 - gy0 + 1;
    for (let y = gy0; y <= gy1; y++) for (let x = gx0; x <= gx1; x++) { const u = (x - gx0) / 25, v = (y - gy0) / (gh - 1); let c;
      if (o.lit) { const d = Math.hypot((u - .5) * .6, (v - .7) * 1.1); c = Lt[d < .2 ? 4 : d < .38 ? 3 : d < .56 ? ((x + y) & 1 && d > .5 ? 1 : 2) : 1]; if (v < .1) c = Lt[0]; }
      else { const s = (x - gx0) + (y - gy0), b = ((s % 22) + 22) % 22; c = b === 9 || b === 10 ? Gl[4] : b === 13 ? Gl[3] : v < .22 ? Gl[1] : v > .75 ? Gl[3] : Gl[2]; }
      if (y === gy0 || x === gx0) c = o.lit ? Lt[0] : Gl[0]; P.set(x, y, c); }
    if (Cu) for (let y = gy0; y <= gy1; y++) { const v = (y - gy0) / (gh - 1), cwd = Math.round(v < .68 ? 9 - 6 * Math.sin(Math.min(1, v / .68) * Math.PI / 2) : 3 + (v - .68) * 9); for (let i = 0; i < cwd; i++) { const c = i === cwd - 1 ? Cu[2] : (i % 3 === 1 ? Cu[4] : i % 3 === 2 ? Cu[2] : Cu[3]); P.set(gx0 + i, y, c); P.set(gx1 - i, y, c); } if (Math.abs(v - .68) < .04) { for (let i = 0; i < 3; i++) { P.set(gx0 + i, y, Cu[1]); P.set(gx1 - i, y, Cu[1]); } } }
    if (Cu) for (let x = gx0; x <= gx1; x++) { P.set(x, gy0, Cu[2]); P.set(x, gy0 + 1, (x & 1) ? Cu[4] : Cu[3]); P.set(x, gy0 + 2, ((x + 1) % 4 < 2) ? Cu[3] : Cu[2]); }
    const bars = o.bars || 'cross'; if (bars !== 'none') { const vs = bars === 'grid' ? [gx0 + 8, gx0 + 17] : [x0 + 15], hs = bars === 'grid' ? [gy0 + Math.round(gh / 3), gy0 + Math.round(gh * 2 / 3)] : [gy0 + Math.round(gh * .45)]; for (const x of vs) for (let y = gy0; y <= gy1; y++) { P.set(x, y, F[4]); P.set(x + 1, y, F[2]); } for (const y of hs) for (let x = gx0; x <= gx1; x++) { P.set(x, y, F[4]); P.set(x, y + 1, F[1]); } }
    for (let x = x0; x < x0 + 32; x++) { P.set(x, bot - 3, F[5]); P.set(x, bot - 2, F[3]); P.set(x, bot - 1, F[1]); } P.set(x0, bot - 3, null); P.set(x0 + 31, bot - 3, null);
    if (o.arch) { for (let y = 0; y < 9; y++) for (let x = 0; x < 32; x++) { const d = ((x + .5 - 16) / 16) ** 2 + ((y + .5 - 9) / 9) ** 2; if (d > 1) P.set(x0 + x, y, null); else if (d > .74) P.set(x0 + x, y, d > .88 ? F[4] : F[2]); } }
    if (sh) for (const sx of [0, w - sh]) { const S = ramp(o.shutterC || '#4f7a5c'); P.block(sx, top, sh, bot - 3, S, 3); for (let y = top + 2; y < bot - 5; y++) for (let x = 1; x < sh - 1; x++) P.set(sx + x, y, y % 3 === 0 ? S[1] : y % 3 === 1 ? S[4] : S[3]); for (let x = 1; x < sh - 1; x++) P.set(sx + x, top + Math.round((bot - 3) / 2), S[2]); }
    if (o.box) { const B = ramp(o.boxC || '#8a5a3a'), Gn = ramp('#4f8a48'), fc = o.fc || ['#f06a5a', '#ffd86a', '#f6a8c8']; for (let x = 1; x < w - 1; x++) for (let j = 0; j < 5; j++) P.set(x, hh - 5 + j, j === 0 ? B[4] : j === 4 ? B[1] : (x % 6 === 0 ? B[2] : B[3]));
      for (let x = 1; x < w - 1; x++) { const hgt = 2 + Math.floor(hash(x, 1, o.seed || 0) * 4); for (let j = 0; j < hgt; j++) P.set(x, hh - 6 - j, j === hgt - 1 ? Gn[4] : (x + j) % 3 === 0 ? Gn[2] : Gn[3]); }
      for (let k = 0; k < Math.floor(w / 4); k++) { const x = 2 + k * 4 + Math.floor(hash(k, 2, o.seed || 0) * 2), y = hh - 8 - Math.floor(hash(k, 3, o.seed || 0) * 3), c = fc[k % fc.length]; P.set(x, y, c); P.set(x + 1, y, c); P.set(x, y + 1, c); P.set(x + 1, y + 1, mix(c, '#803040', .35)); } }
    return P; }, true);

  // 窓のあるかべ（くり返せる 1 枚。大きな面にはると窓がならぶ）。wall = かべの名前、wallO = その引数、あとは window と同じ引数
  def('windowWall', 3, (o = {}) => { const P = T[o.wall || 'brick']({ ...(o.wallO || {}) }), Wn = T.window({ ...o, shutters: false, box: false }), R = ramp(o.lintel || '#b8b0a2'), x = 16, y = Math.round((64 - Wn.h) / 2) - 2;
    for (let i = -2; i < 34; i++) { for (let j = 0; j < 4; j++) P.set(x + i, y - 4 + j, j === 0 ? R[5] : j === 3 ? R[1] : (i % 9 === 8 ? R[2] : R[3])); P.mul(x + i, y + Wn.h, .72); P.mul(x + i, y + Wn.h + 1, .86); }
    for (let j = 0; j < Wn.h; j++) P.mul(x + 32, y + j, .8); P.blit(Wn, x, y); return P; });

  // 扉（32×64 ＝ 1 m × 2 m。抜き色つき）。style: 'plank'（板と鉄の帯）/ 'panel'（かまち戸。上に小窓）/ 'glass'（店のガラス戸）。arch で上を丸く、lit で窓が明るい
  def('door', 1, (o = {}) => { const P = Px(32, 64), D = ramp(o.c || '#8a5c3a'), F = ramp(o.frame || '#5e4030'), I = ramp('#4a4c58'), St = ramp(o.step || '#aaa294'), st = o.style || 'plank', glass = o.lit ? ['#c4621e', '#f6b446', '#fbdc80', '#fff4c4'] : ramp(o.glass || '#3d5a78').slice(1, 5); P.clip = true;
    P.block(0, 0, 32, 61, F, 3); P.block(1, 1, 30, 60, F, 2);
    for (let x = 3; x < 29; x++) for (let y = 3; y < 61; y++) { const pl = Math.floor((x - 3) / 6.5), px = (x - 3) - Math.round(pl * 6.5), t = [3, 2, 3, 4][pl % 4]; let c = px === 0 ? D[1] : px === 1 ? tone(D, t + 1) : D[t]; if (px > 1 && tn(x, y, 2, 16, 32, 64, 3) > .7) c = tone(D, t - 1); if (y === 3 || x === 3) c = D[0]; P.set(x, y, c); }
    if (st === 'plank') { for (const y of [12, 46]) { for (let x = 3; x < 24; x++) { P.set(x, y, I[4]); P.set(x, y + 1, I[3]); P.set(x, y + 2, I[1]); if (x % 5 === 0) P.set(x, y + 1, I[5]); } P.set(24, y + 1, I[3]); P.set(25, y + 1, I[3]); P.set(24, y, I[3]); P.set(24, y + 2, I[1]); for (let x = 3; x < 25; x++) P.mul(x, y + 3, .75); }
      P.bits(22, 30, ['.hh.', 'h..d', 'h..d', '.dd.'], { h: I[5], d: I[2] }); P.set(23, 36, I[0]); P.set(23, 37, I[0]); }
    else { const pan = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P.set(x + i, y + j, i === 0 || j === 0 ? D[1] : i === w - 1 || j === h - 1 ? D[5] : (i === 1 || j === 1) ? D[2] : (i === w - 2 || j === h - 2) ? D[4] : D[3]); };
      const win = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P.set(x + i, y + j, i === 0 || j === 0 ? F[0] : (((i + j) % 11 === 5 || (i + j) % 11 === 6) && !o.lit) ? glass[3] : glass[j < h * .3 ? 0 : j > h * .7 ? 2 : 1]); for (let j = 0; j < h; j++) { P.set(x + (w >> 1), y + j, F[4]); } for (let i = 0; i < w; i++) P.set(x + i, y + (h >> 1), F[4]); };
      for (let x = 3; x < 29; x++) for (let y = 3; y < 61; y++) P.set(x, y, (x === 3 || y === 3) ? D[1] : tn(x, y, 2, 16, 32, 64, 5) > .72 ? D[2] : D[3]);
      if (st === 'glass') { win(6, 7, 20, 34); pan(6, 45, 20, 13); } else { win(7, 7, 18, 13); pan(6, 24, 9, 15); pan(17, 24, 9, 15); pan(6, 42, 9, 16); pan(17, 42, 9, 16); }
      P.bits(24, 39, ['hh', 'hd', 'dd'], { h: '#f2d27a', d: '#a8782a' }); }
    for (let x = 0; x < 32; x++) { P.set(x, 61, St[5]); P.set(x, 62, x % 11 === 10 ? St[2] : St[3]); P.set(x, 63, St[1]); }
    if (o.arch) for (let y = 0; y < 12; y++) for (let x = 0; x < 32; x++) { const d = ((x + .5 - 16) / 16) ** 2 + ((y + .5 - 12) / 12) ** 2; if (d > 1) P.set(x, y, null); else if (d > .8) P.set(x, y, d > .9 ? F[4] : F[2]); }
    return P; }, true);

  // ---- 屋根 ----  kind: 'scale'（うろこ形のかわら）/ 'wave'（丸がわら。たての畝）/ 'slate'（平たい板がわら）
  def('roof', 3, (o = {}) => { const P = Px(64), base = o.c || '#b8553c', R = ramp(base), R2 = ramp(mix(base, '#4a3a50', .35)), G = ramp('#6f9a4e'), sd = o.seed || 0, kind = o.kind || 'scale';
    if (kind === 'wave') { P.each((x, y) => { const cx = x % 8, t = [1, 3, 4, 5, 4, 3, 2, 0][cx], r = Math.floor(y / 16), yy = y % 16, v = hash(x >> 3, r, sd); let c = tone(R, t - (v > .8 ? 1 : 0)); if (yy === 15) c = cx === 0 || cx === 7 ? R[0] : R[1]; else if (yy === 14 && cx > 0 && cx < 7) c = tone(R, t + 1); else if (yy === 0 && cx > 0 && cx < 7) c = tone(R, t - 1); return c; }); }
    else if (kind === 'slate') { for (let r = 0; r < 8; r++) { let x = Math.floor(hash(r, 0, sd) * 12); const x0 = x; while (x < x0 + 64) { let bw = 8 + Math.floor(hash(r, x, sd + 1) * 7); if (x0 + 64 - (x + bw) < 6) bw = x0 + 64 - x; const t = [3, 3, 2, 4, 3][Math.floor(hash(r, x, sd + 2) * 5)], RR = hash(r, x, sd + 3) > .85 ? R2 : R; for (let j = 0; j < 8; j++) for (let i = 0; i < bw; i++) P.set(x + i, r * 8 + j, i === bw - 1 ? RR[0] : j === 0 ? RR[1] : j === 1 ? tone(RR, t - 1) : j === 7 ? tone(RR, t + 1) : (i === 0 ? tone(RR, t + 1) : RR[t])); x += bw; } } }
    else { const yb = [4, 5, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 5, 4]; for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const x = k * 16 + (r % 2) * 8, y = r * 8, h1 = hash(k, r, sd), RR = h1 > .88 ? R2 : R, t = [3, 3, 4, 3, 2, 3][Math.floor(hash(k, r, sd + 1) * 6)], ms = o.moss && hash(k, r, sd + 5) < o.moss;
        for (let j = 0; j < 8; j++) for (let i = 0; i < 16; i++) { const b = yb[i]; let c = j > b ? R[1] : j === b ? RR[0] : (j === b - 1 && i > 1 && i < 14) ? tone(RR, t + 1) : j === 0 ? tone(RR, t - 1) : (i === 0 ? tone(RR, t - 1) : i === 1 && j < 4 ? tone(RR, t + 1) : RR[t]); if (ms && j < b - 1 && j < 5 && hash(i >> 1, j, sd + k + r) > .4) c = G[j < 2 ? 2 : 3]; P.set(x + i, y + j, c); } } }
    return P; });

  // 板ぶき
  def('shingle', 3, (o = {}) => { const P = Px(64), R = ramp(o.c || '#8a6f58'), sd = o.seed || 0; P.fill(R[0]);
    for (let r = 0; r < 8; r++) { let x = Math.floor(hash(r, 0, sd) * 10); const x0 = x; while (x < x0 + 64) { let bw = 5 + Math.floor(hash(r, x, sd + 1) * 7); if (x0 + 64 - (x + bw) < 5) bw = x0 + 64 - x; const t = [3, 2, 4, 3, 3][Math.floor(hash(r, x, sd + 2) * 5)], lg = hash(r, x, sd + 3) > .6 ? 1 : 0;
        for (let j = 0; j < 8 + lg; j++) for (let i = 0; i < bw - 1; i++) { const g = hash(x + i, r, sd + 4); P.set(x + i, r * 8 + j, j === 0 ? R[1] : j === 1 ? tone(R, t - 1) : j === 7 + lg ? tone(R, t + 1) : g > .84 ? tone(R, t - 1) : g < .1 ? tone(R, t + 1) : R[t]); } x += bw; } }
    return P; });

  // わらぶき
  def('thatch', 3, (o = {}) => { const P = Px(64), R = ramp(o.c || '#c8a65c'), sd = o.seed || 0;
    P.each((x, y) => { const off = Math.floor(hash(x, 0, sd) * 9), seg = Math.floor((y + off) / 9), t = [2, 3, 3, 4, 4, 3, 5, 3][Math.floor(hash(x, seg, sd + 1) * 8)], ly = (y + Math.floor(hash(x, 7, sd) * 3)) % 16; return ly === 15 ? R[1] : ly === 14 ? (hash(x, y, sd) > .4 ? R[1] : R[2]) : ly === 0 ? R[2] : ly === 1 ? tone(R, t - 1) : ly === 13 ? tone(R, t + 1) : R[t]; });
    return P; });

  // ---- 自然 ----
  def('bark', 1.5, (o = {}) => { const P = Px(32, 64), B = ramp(o.c || '#6f5238'), sd = o.seed || 0;
    P.each((x, y) => { const wx = x + (tn(x, y, 8, 16, 32, 64, sd + 5) - .5) * 5, n = tn(wx, y, 4, 32, 32, 64, sd) * .7 + tn(wx, y, 2, 8, 32, 64, sd + 2) * .3; return n < .3 ? B[1] : n < .44 ? B[2] : n < .68 ? B[3] : n < .86 ? mix(B[3], B[4], .6) : B[4]; });
    for (let k = 0; k < 5; k++) { const x = Math.floor(hash(k, 1, sd) * 32), y = Math.floor(hash(k, 2, sd) * 64); P.set(x, y, B[0]); P.set(x + 1, y, B[0]); P.set(x + 2, y, B[1]); P.set(x, y + 1, B[5]); P.set(x + 1, y + 1, B[4]); }
    return P; });

  // 葉のしげみ。shape: 'tile'（すきまのない くり返し模様。葉のかたまりの面にはる）/ 'blob'（丸いかたまりの切りぬき。板にはる）/ 'fringe'（上はつまり、下がギザギザに垂れる。よこにくり返せる）
  // flowers（0〜1）と fc で花や実をつけられる
  def('leaves', 3, (o = {}) => { const S = 64, P = Px(S), G = ramp(o.c || '#4f8f48'), sd = o.seed || 0, sh = o.shape || 'tile', cl2 = [];
    const put = (x, y, c) => { if (y < 0 || y >= S || (sh === 'blob' && (x < 0 || x >= S))) return; P.d[y * S + ((x % S) + S) % S] = c; };
    if (sh === 'tile') { P.fill(G[1]); for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) for (const oy of [-S, 0, S]) cl2.push([i * 9.14 + hash(i, j, sd) * 6, j * 9.14 + hash(i, j, sd + 1) * 6 + oy, 5.5 + hash(i, j, sd + 2) * 3, 0]); }
    else if (sh === 'blob') { for (let k = 0; k < 46; k++) { const a = hash(k, 1, sd) * 6.283, rr = Math.sqrt(hash(k, 2, sd)) * 21, x = 32 + Math.cos(a) * rr, y = 33 + Math.sin(a) * rr * .92; cl2.push([x, y, 5 + hash(k, 3, sd) * 4 - rr * .06, (-(x - 32) - (y - 32) * 1.2) / 30]); } P.disc(32, 33, 17, G[1]); }
    else { for (let y = 0; y < 26; y++) for (let x = 0; x < S; x++) put(x, y, G[1]); for (let j = 0; j < 6; j++) for (let i = 0; i < 8; i++) { const y = j < 3 ? 3 + j * 9 + hash(i, j, sd + 1) * 5 : 30 + (j - 3) * 8 + hash(i, j, sd + 1) * 6; if (j >= 3 && hash(i, j, sd + 4) > [.75, .5, .28][j - 3]) continue; cl2.push([i * 8 + hash(i, j, sd) * 6, y, j < 3 ? 6 + hash(i, j, sd + 2) * 2.5 : 5.5 - (j - 3) * 1 + hash(i, j, sd + 2) * 2, j < 3 ? 0 : -.25 * (j - 2)]); } }
    cl2.sort((a, b) => a[1] - b[1]);
    for (const [cx, cy, r, lt] of cl2) for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) { const dx = x + .5 - cx, dy = y + .5 - cy, ang = Math.atan2(dy, dx), rr = r + (hash(Math.floor(ang * 2.2 + 9), Math.floor(cx), sd + 7) - .5) * 2.2, d = Math.hypot(dx, dy); if (d > rr) continue; const rel = (dx + dy * 1.35) / r, lf = ((x + y * 2) % 5 === 0) || ((x * 2 + y) % 7 === 0); let t = rel < -.75 ? 5 : rel < -.3 ? 4 : rel < .45 ? 3 : 2; if (lf && t > 2) t--; if (d > rr - 1.1 && rel > -.2) t = 1; t += lt > .3 ? 0 : lt < -.3 ? -1 : 0; if (lt < -.3 && t === 4) t = 3; put(x, y, G[cl(t, 1, 5)]); }
    if (o.flowers) { const fc = o.fc || ['#f7b8d0', '#ffffff']; for (let k = 0; k < 70 * o.flowers; k++) { const x = Math.floor(hash(k, 1, sd + 50) * (S - 2)), y = Math.floor(hash(k, 2, sd + 50) * (S - 2)); if (P.d[y * S + x] === null || P.d[y * S + x] === G[1] || P.d[(y + 1) * S + x + 1] === null) continue; const c = fc[k % fc.length]; put(x, y, c); put(x + 1, y, c); put(x, y + 1, mix(c, G[1], .3)); } }
    return P; }, false);
  META.leaves.cutIf = o => o && o.shape && o.shape !== 'tile';

  // 草のふさ（32×32 の切りぬき）。kind: 'grass' / 'flower' / 'reed'（がま）/ 'wheat'（麦）/ 'bush'（低いしげみ）
  def('tuft', 1, (o = {}) => { const P = Px(32), kind = o.kind || 'grass', G = ramp(o.c || (kind === 'wheat' ? '#d2b050' : '#5f9c4c')), sd = o.seed || 0; P.clip = true;
    if (kind === 'bush') { const L = T.leaves({ shape: 'blob', c: o.c || '#4f8f48', seed: sd, flowers: o.flowers, fc: o.fc }); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const c = L.get(x * 2 + (y & 1), 8 + y * 1.7); if (c && y > 4) P.set(x, y, c); } for (let x = 6; x < 26; x++) if (P.get(x, 30)) P.set(x, 31, G[0]); return P; }
    const n = kind === 'reed' ? 7 : 11, tall = kind === 'reed' || kind === 'wheat' ? 27 : 19, tips = [];
    for (let k = 0; k < n; k++) { const bx = 16 + (k - (n - 1) / 2) * (kind === 'reed' ? 1.6 : 1.2) + (hash(k, 1, sd) - .5) * 2, lean = (k - (n - 1) / 2) * (kind === 'grass' || kind === 'flower' ? 1.7 : .7) + (hash(k, 2, sd) - .5) * 4, ht = tall * (.55 + hash(k, 3, sd) * .45), back = k % 3 === 0;
      for (let s = 0; s <= ht; s++) { const u = s / ht, x = bx + lean * u * u, y = 31 - s; P.set(x, y, s < 3 ? G[1] : back ? G[2] : u > .7 ? G[5] : (k % 2 ? G[4] : G[3])); if (s < ht * .5 && !back) P.set(x + 1, y, G[2]); } tips.push([Math.round(bx + lean), 31 - Math.round(ht)]); }
    if (kind === 'flower') { const fc = o.fc || ['#f06a5a', '#ffd86a', '#ffffff', '#c89af0']; tips.forEach(([x, y], k) => { if (k % 3 !== 1) return; const c = fc[(k + sd) % fc.length]; P.bits(x - 1, y - 2, [' c ', 'cyc', ' c '], { c, y: '#f2b23a' }); P.set(x + 1, y, mix(c, '#604050', .35)); }); }
    if (kind === 'reed') tips.forEach(([x, y], k) => { if (k % 2) return; for (let j = 0; j < 6; j++) { P.set(x, y + 2 + j, '#7a4a2c'); P.set(x + 1, y + 2 + j, j < 5 ? '#a8683c' : '#5a3420'); } });
    if (kind === 'wheat') tips.forEach(([x, y]) => { for (let j = 0; j < 6; j++) { P.set(x, y + j, G[5]); P.set(x + (j & 1 ? 1 : -1), y + j, G[4]); } });
    return P; }, true);

  // 岩はだ
  def('rock', 3, (o = {}) => { const P = Px(64), R = ramp(o.c || '#8f8a84'), G = ramp(o.mossC || '#6f9a4e'), sd = o.seed || 0;
    P.each((x, y) => { const v = voro(x, y, 64, 4, .9, sd), e = (v.d2 - v.d1) / 2, t = [3, 2, 4, 3, 2, 4, 3][Math.floor(hash(v.id, 3, sd) * 7)], dir = (v.dx + v.dy * 1.4) / (v.d1 + .01);
      if (e < .7) return R[1]; if (e < 1.6) return dir > 0 ? R[0] : tone(R, t + 1); if (dir < -.9 && e < 5) return tone(R, t + 1); if (dir > 1 && e < 4) return tone(R, t - 1);
      const n = tn(x, y, 8, 8, 64, 64, sd + v.id); return n > .72 ? tone(R, t + 1) : n < .22 ? tone(R, t - 1) : R[t]; });
    if (o.moss) P.each((x, y) => tn(x, y, 16, 16, 64, 64, sd + 8) < o.moss * .55 ? G[hash(x, y, sd) > .6 ? 4 : hash(x, y, sd) > .25 ? 3 : 2] : undefined);
    return P; });

  // ---- 小物 ----
  // 木箱（32×32）。kind: 'slash'（ななめの補強 1 本）/ 'x' / 'plain'
  def('crate', 1, (o = {}) => { const P = Px(32), W = ramp(o.c || '#b08a56'), sd = o.seed || 0, kind = o.kind || 'slash'; P.clip = true;
    for (let k = 0; k < 4; k++) { const x = 4 + k * 6, t = [3, 2, 3, 4][(k + sd) % 4]; for (let y = 4; y < 28; y++) for (let i = 0; i < 6; i++) P.set(x + i, y, i === 0 ? tone(W, t + 1) : i === 5 ? W[0] : (tn(x + i, y, 2, 8, 32, 32, sd) > .68 ? tone(W, t - 1) : W[t])); }
    const dg = (x0, y0, x1, y1) => { for (let k = -2; k <= 2; k++) P.line(x0, y0 + k, x1, y1 + k, k === -2 ? W[5] : k === 2 ? W[1] : W[4]); P.line(x0, y0 + 3, x1, y1 + 3, W[1]); };
    if (kind !== 'plain') dg(4, 25, 27, 6); if (kind === 'x') dg(4, 6, 27, 25);
    for (let i = 0; i < 32; i++) for (let j = 0; j < 4; j++) { const c = j === 0 ? W[5] : j === 3 ? W[1] : (tn(i, j, 8, 2, 32, 4, sd + 3) > .6 ? W[3] : W[4]); P.set(i, j, c); P.set(i, 28 + j, c); P.set(j, i, j === 0 ? W[5] : j === 3 ? W[1] : W[4]); P.set(28 + j, i, j === 0 ? W[5] : j === 3 ? W[1] : W[4]); }
    for (let i = 4; i < 28; i++) { P.set(i, 4, W[1]); P.set(4, i, W[1]); }
    for (const [x, y] of [[1, 1], [29, 1], [1, 29], [29, 29]]) { P.set(x, y, W[0]); P.set(x + 1, y, W[2]); P.set(x, y + 1, '#f4e8c8'); }
    return P; });

  // たる（64×32：左半分＝わき（よこにくり返す）、右半分＝ふた）
  def('barrel', 1, (o = {}) => { const P = Px(64, 32), W = ramp(o.c || '#a8743c'), I = ramp(o.hoop || '#5c5e68'), sd = o.seed || 0; P.clip = true;
    for (let x = 0; x < 32; x++) for (let y = 0; y < 32; y++) { const k = x >> 2, i = x & 3, t = [3, 2, 3, 4, 3, 3, 2, 4][k] - (y < 3 || y > 28 ? 1 : 0); P.set(x, y, i === 0 ? W[1] : i === 1 ? tone(W, t + 1) : (hash(k, y >> 2, sd) > .78 ? tone(W, t - 1) : W[t])); }
    for (const y of [5, 24]) for (let x = 0; x < 32; x++) { P.set(x, y, I[5]); P.set(x, y + 1, I[3]); P.set(x, y + 2, I[1]); P.mul(x, y + 3, .7); if (x % 8 === 3) P.set(x, y + 1, I[5]); }
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x + .5 - 16, y + .5 - 16), k = y / 5 | 0, j = y % 5; P.set(32 + x, y, d > 15.5 ? W[1] : d > 13 ? (x + y < 32 ? I[4] : I[2]) : d > 12 ? W[0] : j === 0 ? W[1] : j === 1 ? W[4] : (hash(x >> 2, k, sd + 3) > .7 ? W[2] : W[3])); }
    P.set(32 + 20, 11, W[0]); P.set(32 + 21, 11, W[0]); P.set(32 + 20, 12, W[5]);
    return P; });

  // 看板（64×32）。kind: 'mug'（宿・酒場）/ 'sword'（武器）/ 'potion'（薬）/ 'bread'（パン）/ 'star' / 'blank'。c = 板の色
  const ICON = { mug: [['...www......', '..wwwwww....', '.yyyyyyy.bb.', '.yhyyyyy.b.b', '.yhyyyyy...b', '.yhyyyyy...b', '.yyyyyyy.b.b', '.yyyyyyy.bb.', '.ddddddd....'], { w: '#fff8e4', y: '#f2b23a', h: '#ffe08a', b: '#f4e8c8', d: '#a8682a' }],
    sword: [['.........ss', '........sws', '.......sws.', '......sws..', '.....sws...', '.g..sws....', '..gsws.....', '..bgg......', '.bb.g......', 'bb.........'], { s: '#c8d0d8', w: '#ffffff', g: '#f2c24a', b: '#7a4a2a' }],
    potion: [['...kkkk...', '....gg....', '....gg....', '...gggg...', '..gwpppg..', '.gwpppppg.', '.gpppppqg.', '.gppppqqg.', '..gggggg..'], { k: '#b8845a', g: '#e8f4f0', p: '#e8506a', q: '#b02a50', w: '#ffc8d0' }],
    bread: [['...oooooo...', '.ooyyhyyhoo.', 'oyyhyyhyyhyo', 'oyhyyhyyhyyo', 'obyyyyyyyybo', '.obbbbbbbbo.', '..oooooooo..'], { o: '#8a5220', y: '#e8a84a', h: '#ffd88a', b: '#c07a30' }],
    star: [['.....y.....', '....yhy....', '....yhy....', 'yyyyyhyyyyy', '.yhhhhyyyd.', '..yhyyyyd..', '..yhyyydd..', '.yyyd.yydd.', '.ydd...ydd.'], { y: '#f8d04a', h: '#fff4b0', d: '#c8922a' }] };
  def('sign', 1, (o = {}) => { const P = Px(64, 32), W = ramp(o.c || '#b89460'), F = ramp(o.frame || '#5e4030'), sd = o.seed || 0; P.clip = true;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const j = y % 8, t = [3, 4, 3, 2][(y >> 3) % 4]; P.set(x, y, j === 0 ? W[1] : j === 1 ? tone(W, t + 1) : (tn(x, y, 8, 2, 64, 32, sd) > .66 ? tone(W, t - 1) : W[t])); }
    for (let i = 0; i < 64; i++) for (let j = 0; j < 3; j++) { const c = F[j === 0 ? 4 : j === 2 ? 1 : 3]; if (i < 32) { P.set(j, i, c); P.set(61 + j, i, c); } P.set(i, j, c); P.set(i, 29 + j, c); }
    for (const [x, y] of [[0, 0], [63, 0], [0, 31], [63, 31]]) P.set(x, y, null); for (const [x, y] of [[4, 4], [58, 4], [4, 26], [58, 26]]) { P.set(x, y, F[0]); P.set(x + 1, y, '#f4e8c8'); }
    const ic = ICON[o.kind || 'mug']; if (ic) { const [rows, map] = ic, w = rows[0].length, x = 32 - w, y = 16 - rows.length; for (const pass of [0, 1]) for (let j = 0; j < rows.length; j++) for (let i = 0; i < w; i++) if (rows[j][i] !== '.') P.rect(x + i * 2 + (pass ? 0 : 1), y + j * 2 + (pass ? 0 : 1), 2, 2, pass ? map[rows[j][i]] : W[0]); }
    return P; }, true);

  // 標識（32×32 の切りぬき）。kind: 'no'（赤い丸）/ 'arrow'（青地に矢印）/ 'warn'（黄のひし形）/ 'stop'（赤い八角）/ 'plate'（文字の札）
  def('roadSign', .7, (o = {}) => { const P = Px(32), kind = o.kind || 'no'; P.clip = true;
    P.each((x, y) => { const dx = x + .5 - 16, dy = y + .5 - 16, d = Math.hypot(dx, dy), m = Math.abs(dx) + Math.abs(dy), q = Math.max(Math.abs(dx), Math.abs(dy), m * .72), hi = dx + dy < -8;
      if (kind === 'no') return d > 15 ? null : d > 14 ? '#6a1a20' : d > 10 ? (hi ? '#f06a5a' : '#d83a34') : (Math.abs(dy) < 2 && Math.abs(dx) < 8 ? '#d83a34' : hi ? '#ffffff' : '#ece8dc');
      if (kind === 'arrow') { const ar = (Math.abs(dx) < 2 && dy > -4 && dy < 9) || (dy <= -1 && dy > -9 && Math.abs(dx) < (dy + 9) * .9); return d > 15 ? null : d > 14 ? '#16305a' : ar ? '#ffffff' : hi ? '#4a8ae0' : '#2a62c0'; }
      if (kind === 'warn') return m > 15.5 ? null : m > 14 ? '#3a3020' : m > 12.5 ? '#f8e27a' : ((Math.abs(dx) < 1.5 && dy > -7 && dy < 2) || (Math.abs(dx) < 1.5 && dy > 4 && dy < 7)) ? '#2a2420' : hi ? '#f8d44a' : '#eebc2a';
      if (kind === 'stop') return q > 15 ? null : q > 14 ? '#6a1a20' : q > 12.5 ? '#ffffff' : (Math.abs(dy) < 2.5 && Math.abs(dx) < 9) ? '#ffffff' : hi ? '#f06a5a' : '#d83a34';
      const in2 = x > 0 && x < 31 && y > 8 && y < 23; return !in2 ? null : (x === 1 || x === 30 || y === 9 || y === 22) ? '#16305a' : (x === 2 || y === 10) ? '#6aa0e8' : ((y === 13 || y === 14) && x > 5 && x < 26 && x % 5 !== 0) || ((y === 17 || y === 18) && x > 5 && x < 20 && x % 4 !== 0) ? '#ffffff' : '#2a62c0'; });
    return P; }, true);

  // 布（32×32。くり返せる）。pattern: 'stripe' / 'check' / 'plain'。c と c2 の 2 色。scallop で下のふちを波形に切る（ひさし・旗）
  def('fabric', 1, (o = {}) => { const P = Px(32), A = ramp(o.c || '#d8503c'), B = ramp(o.c2 || '#f4ead2'), pt = o.pattern || 'stripe', w = o.w || 8;
    P.each((x, y) => { const k = Math.floor(x / w), i = x % w, R = pt === 'plain' ? A : pt === 'check' ? ((k + Math.floor(y / w)) % 2 ? B : A) : (k % 2 ? B : A); let t = i === 0 ? 4 : i === w - 1 ? 2 : 3; if (pt === 'plain') t = ((x + y * 3) % 7 === 0) ? 2 : (x % 8 === 0 ? 4 : 3); if (y % 16 === 15) t--; if (y % 16 === 0) t++; return tone(R, t); });
    if (o.scallop) { P.clip = true; for (let x = 0; x < 32; x++) { const i = x % 8, cut = [3, 1, 0, 0, 0, 0, 1, 3][i]; for (let j = 0; j < cut; j++) P.set(x, 31 - j, null); const yb = 31 - cut, c = P.get(x, yb); if (c) { P.mul(x, yb, .62); P.mul(x, yb - 1, .85); } } }
    return P; });
  META.fabric.cutIf = o => o && o.scallop;

  // 雲（64×32 の切りぬき）
  def('cloud', 8, (o = {}) => { const P = Px(64, 32), c = o.c || '#ffffff', s = o.shade || '#c4d2ea', sd = o.seed || 0, cs = [[13, 21, 8], [25, 15, 11], [40, 13, 12], [52, 20, 9], [33, 22, 10]]; P.clip = true;
    P.each((x, y) => { if (y > 27) return null; let in1 = 0, lit = 0; for (const [cx, cy, r] of cs) { const d = Math.hypot(x + .5 - cx - (hash(cx, 1, sd) - .5) * 4, y + .5 - cy); if (d < r) { in1 = 1; if (y < cy + r * .15 && d < r - 1.5) lit = Math.max(lit, 1); if (y < cy - r * .1 && x < cx) lit = 2; } } if (!in1) return null; const m = mix(c, s, .5); return lit === 2 ? c : lit === 1 ? ((x + y) & 1 || y < 14 ? c : m) : y > 24 ? s : ((x + y) & 1 ? m : s); });
    return P; }, true);

  // 街灯・ランタンのガラス（16×16。光る材質にはる）
  def('lamp', .4, (o = {}) => { const P = Px(16), F = ramp(o.frame || '#3a3a44'), Lt = o.cold ? ['#7aa8d8', '#a8d0f0', '#d8f0ff', '#ffffff'] : ['#e8892c', '#f6b446', '#fbdc80', '#fff8d8'];
    P.each((x, y) => { const d = Math.hypot(x - 7.5, y - 8.5); return (x === 0 || x === 15 || y === 0 || y === 15) ? F[y === 0 ? 4 : 2] : (x === 7 || x === 8) && false ? F[2] : d < 3 ? Lt[3] : d < 5 ? Lt[2] : d < 7.5 ? Lt[1] : Lt[0]; });
    return P; });

  // ---- 人（128×64 の 1 枚に、頭・胴・そで・足・かみ・手・くつ・持ち物をまとめる。R.person が使う） ----
  // skin, hair, top（服）, top2（さし色）, bottom（ズボン・すそ）, belt, shoe, acc（帽子・かばん）
  // face: 0〜7（顔の組み合わせ）または eyes: 'anime'/'dot'/'closed'/'sleepy'、mouth: 'smile'/'line'/'open'/'small'/'beard'/'mustache'、eye（ひとみの色）、blush
  // hairStyle: 'short'/'bangs'/'part'/'long'/'bob'/'bald'、cloth: 'shirt'/'tunic'/'vest'/'apron'/'jacket'/'stripe'/'robe'、sleeve: 'long'/'short'、skirt>0 でこしから下が服の色、boots, shorts
  const FACES = [['anime', 'smile', 'short'], ['dot', 'small', 'bangs'], ['anime', 'line', 'part'], ['closed', 'smile', 'long'], ['dot', 'mustache', 'short'], ['anime', 'open', 'bob'], ['sleepy', 'beard', 'bald'], ['anime', 'small', 'long']];
  def('person', 1, (o = {}) => { const P = Px(128, 64), sd = o.seed || 0; P.clip = true;
    const Sk = ramp(o.skin || '#f0c49c', 6, { cool: .99 }), Hr = ramp(o.hair || '#5c3c28'), C = ramp(o.top || '#3f7ab8'), C2 = ramp(o.top2 || '#f0e6d0'), Bt = ramp(o.bottom || '#5a4a3c'), Bl = ramp(o.belt || '#6a4428'), Sh = ramp(o.shoe || '#5a3a26'), Ac = ramp(o.acc || '#9a6a3c');
    const fk = FACES[(o.face || 0) % FACES.length], eyes = o.eyes || fk[0], mouth = o.mouth || fk[1], hs = o.hairStyle || fk[2], long = hs === 'long' || hs === 'bob', eyeC = o.eye || '#3a5a8a', DK = '#2a2028';
    // 頭（0..63 × 0..31）。よこは頭をぐるりと 1 周（まん中の x=32 が顔の正面、両はしが後ろ）。上の行がつむじ
    P.rect(0, 0, 64, 32, Sk[3]);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const a = Math.abs(x - 32); let c = Sk[3]; if (x > 42 && a < 22) c = Sk[2]; if (a < 7 && y > 11 && y < 15) c = Sk[4]; if (x < 27 && x > 22 && y > 18 && y < 23) c = Sk[4]; if (y > 28) c = Sk[2]; if (y > 29 && a > 5) c = Sk[1]; if (a >= 22) c = Sk[2]; P.set(x, y, c); }
    const hl = x => { const a = Math.abs(x - 32); if (hs === 'bald') return a > 24 ? 22 : a > 12 ? 14 - (24 - a) * .9 : 3; if (a > 24) return long ? 40 : 23; if (a > 18) return long ? 40 : hs === 'bob' ? 40 : 15 + (a - 18) * .7; if (a > 10) return (hs === 'bangs' ? 14 : 12) + (a - 10) * .35 + (long ? (a - 10) * 1.6 : 0);
      if (hs === 'bangs') return 13 + ((x >> 1) % 2); if (hs === 'part') return 9 + Math.abs(x - 28) * .45; if (hs === 'long') return 10 + Math.abs(x - 32) * .25; if (hs === 'bob') return 13 + ((x + 1 >> 1) % 3 === 0 ? 1 : 0); return 10 + ((x >> 1) % 3 === 0 ? 1 : 0) + a * .12; };
    for (let x = 0; x < 64; x++) { const e = Math.round(hl(x)); for (let y = 0; y < Math.min(32, e); y++) { let c = Hr[3]; const zz = 5 + ((x >> 1) % 2); if (y === zz || y === zz + 1) c = Hr[y === zz ? 5 : 4]; else if (y < 3) c = Hr[4]; else if (x % 5 === 0 && y > 8) c = Hr[2]; else if (x % 5 === 2 && y > 12) c = Hr[4]; if (y === e - 1 && e < 32) c = Hr[1]; P.set(x, y, c); } if (e < 31) P.set(x, e, Sk[2]); }
    if (!long) for (const ex of [10, 52]) { P.bits(ex, 16, ['.ss', 'sds', 'sds', '.s.'], { s: Sk[3], d: Sk[1] }); P.set(ex + 1, 16, Sk[4]); }
    for (const ex of [26, 36]) { const b = hs === 'bald' ? Hr[4] : Hr[1];
      if (eyes === 'anime') { P.bits(ex, 16, ['ddd', 'wdi', 'jii'], { d: DK, w: '#ffffff', i: eyeC, j: mix(eyeC, '#ffffff', .45) }); P.set(ex + (ex < 32 ? -1 : 3), 16, DK); }
      else if (eyes === 'dot') { P.bits(ex, 17, ['wd', 'dd'], { d: DK, w: '#ffffff' }); if (ex > 32) P.bits(ex + 1, 17, ['wd', 'dd'], { d: DK, w: '#ffffff' }), P.set(ex, 17, Sk[3]), P.set(ex, 18, Sk[3]); }
      else if (eyes === 'closed') P.bits(ex, 17, ['.d.', 'd.d'], { d: DK }); else P.bits(ex, 17, ['ddd', '.d.'], { d: DK });
      for (let i = 0; i < 3; i++) P.set(ex + i, 14, b); }
    if (o.blush !== false) { const bc = mix(o.skin || '#f0c49c', '#f0787a', .5); for (const bx of [23, 39]) { P.set(bx, 20, bc); P.set(bx + 1, 21, bc); P.set(bx + 2, 20, bc); P.set(bx + 1, 20, mix(bc, Sk[3], .5)); } }
    P.set(33, 20, Sk[2]); P.set(33, 21, Sk[2]); P.set(32, 21, Sk[2]); P.set(31, 20, Sk[4]);
    const MC = '#b0524a';
    if (mouth === 'smile') { for (let x = 29; x <= 35; x++) P.set(x, 25, MC); P.set(28, 24, MC); P.set(36, 24, MC); for (let x = 30; x <= 34; x++) P.set(x, 26, Sk[2]); }
    else if (mouth === 'line') { for (let x = 30; x <= 34; x++) P.set(x, 25, mix(MC, Sk[1], .5)); }
    else if (mouth === 'open') { P.rect(30, 24, 5, 3, '#7a2a30'); for (let x = 30; x < 35; x++) P.set(x, 24, '#ffffff'); P.set(32, 26, '#e87a7a'); }
    else if (mouth === 'small') { P.set(31, 25, MC); P.set(32, 25, MC); P.set(33, 25, MC); P.set(32, 26, Sk[2]); }
    else if (mouth === 'mustache') { for (let x = 27; x <= 37; x++) { P.set(x, 23, Hr[x % 3 ? 3 : 4]); if (Math.abs(x - 32) > 2) P.set(x, 24, Hr[2]); } P.set(26, 24, Hr[2]); P.set(38, 24, Hr[2]); for (let x = 31; x <= 33; x++) P.set(x, 26, MC); }
    else if (mouth === 'beard') { for (let y = 21; y < 32; y++) for (let x = 14; x < 51; x++) { const a = Math.abs(x - 32); if (y > 22 + (a < 6 ? 0 : -1) - (a > 12 ? (a - 12) * .6 : 0) && !(a < 5 && y < 24)) P.set(x, y, y > 29 ? Hr[2] : (x + y) % 4 === 0 ? Hr[5] : x % 3 === 0 ? Hr[3] : Hr[4]); } for (let x = 30; x <= 34; x++) P.set(x, 25, MC); }
    // 胴（0..63 × 32..63）。上の行＝えり、17〜19 行＝ベルト、その下＝こし・すそ
    const cs = o.cloth || 'shirt', oy = 32, skirt = o.skirt || 0, lowR = skirt ? (o.skirtC ? ramp(o.skirtC) : C) : Bt;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const a = Math.abs(x - 32), front = a < 11, side = a >= 18 && a < 24, back = a >= 24; let R = C, t = 3;
      if (cs === 'stripe') R = (y >> 2) % 2 ? C2 : C; if (cs === 'vest' && a < 5) R = C2;
      if (y < 2) t = 4; if (side && y > 2) t = 2; if (x > 40 && x < 44) t = 2; if (x > 22 && x < 25 && y > 3 && y < 9 && (x + y) % 2) t = 4;
      if (back && (a === 27 || a === 28) && y > 5 && y < 13) t = 2; if (x === 0 || x === 63) t = 4; if (a > 13 && a < 17 && (y + a) % 9 < 2 && y > 6 && y < 16) t = 2;
      if (y > 19) { R = lowR; t = 3; if (skirt || cs === 'robe') { const f = (x + 2) % 6; t = f === 0 ? 2 : f === 1 ? 4 : 3; if (y > 28) { R = C2; t = y === 29 ? 4 : y === 31 ? 2 : 3; } } else { if (y === 20) t = 2; if ((a === 8 || a === 9) && y > 21 && y < 26) t = 2; if (a === 0 && y > 21) t = 2; if (back && a > 26 && a < 30 && y > 22 && y < 27) t = (y === 23 || a === 27) ? 2 : 3; } }
      P.set(x, oy + y, tone(R, t)); }
    const TP = (x, y, c) => P.set(x, oy + y, c);
    if (cs !== 'robe' || true) for (let x = 0; x < 64; x++) { TP(x, 17, Bl[4]); TP(x, 18, Bl[3]); TP(x, 19, Bl[1]); if (x % 6 === 3 && Math.abs(x - 32) > 4) TP(x, 18, Bl[1]); }
    if (cs === 'jacket') { for (let x = 0; x < 64; x++) { TP(x, 17, tone(C, x % 2 ? 2 : 3)); TP(x, 18, tone(C, x % 2 ? 2 : 3)); TP(x, 19, C[1]); } for (let y = 0; y < 17; y++) { TP(32, y, '#d8dce0'); TP(33, y, C[1]); } for (const s of [-1, 1]) { for (let i = 0; i < 5; i++) { TP(32 + s * (4 + i), 12, C[1]); TP(32 + s * (4 + i), 13, C[4]); } for (let j = 0; j < 4; j++) { TP(32 + s * (2 + j), j, C[5]); TP(32 + s * (3 + j), j, C[4]); TP(32 + s * (4 + j), j, C[1]); } } }
    else { P.bits(30, oy + 16, ['.ggg.', 'gh.hg', 'g...g', 'gh.hg', '.ddd.'], { g: '#f2d27a', h: '#fff4c0', d: '#a8782a' });
      if (cs === 'shirt' || cs === 'stripe' || cs === 'vest') { const K2 = cs === 'vest' ? C2 : C; for (let j = 0; j < 4; j++) { for (const s of [-1, 1]) { TP(32 + s * (1 + j) + (s < 0 ? 0 : 0), j, tone(K2, 5)); TP(32 + s * (2 + j), j, tone(K2, 5)); TP(32 + s * (3 + j), j + 1, tone(K2, 1)); } } TP(32, 0, Sk[3]); TP(31, 0, Sk[3]); TP(33, 0, Sk[3]); TP(32, 1, Sk[2]); for (const y of [5, 9, 13]) { TP(32, y, '#fff8e8'); TP(32, y + 1, tone(K2, 1)); } for (let y = 3; y < 17; y++) if (y % 4 !== 1 && y % 4 !== 2) TP(33, y, tone(K2, 2)); }
      if (cs === 'vest') for (let y = 0; y < 17; y++) { TP(27, y, C[1]); TP(37, y, C[1]); TP(26, y, C[4]); TP(38, y, C[4]); }
      if (cs === 'tunic' || cs === 'robe') { for (let j = 0; j < 7; j++) { const hw = Math.max(0, 3 - (j >> 1)); for (let i = -hw; i <= hw; i++) TP(32 + i, j, j < 2 ? Sk[3] : Sk[2]); TP(32 - hw - 1, j, C2[4]); TP(32 + hw + 1, j, C2[3]); TP(32 - hw - 2, j, C2[3]); TP(32 + hw + 2, j, C2[2]); } for (const y of [2, 4, 6]) { TP(31, y, Bl[2]); TP(33, y, Bl[2]); TP(32, y + 1, Bl[2]); } if (cs === 'robe') for (let y = 8; y < 32; y++) if (y < 17 || y > 19) { TP(31, y, C2[4]); TP(32, y, C2[3]); TP(33, y, C2[2]); } }
      if (cs === 'apron') { const A = ramp(o.apron || '#f4efe2'); for (let y = 3; y < 32; y++) { if (y >= 17 && y <= 19) continue; const hw = y < 17 ? 6 : 9; for (let i = -hw; i <= hw; i++) TP(32 + i, y, i === -hw ? A[5] : i === hw ? A[1] : (y > 19 && (i + 20) % 5 === 0) ? A[2] : y === 3 || y === 20 ? A[5] : y === 30 ? A[2] : A[3]); } for (let y = 0; y < 3; y++) { TP(27 + y, y, A[3]); TP(37 - y, y, A[3]); } P.block(29, oy + 23, 7, 5, A, 3, { hi: -1, lo: 1 }); for (let x = 0; x < 64; x++) if (Math.abs(x - 32) > 9) { TP(x, 18, A[3]); } TP(32, 0, Sk[3]); TP(31, 0, Sk[3]); TP(33, 0, Sk[3]); } }
    // そで（64..95 × 0..31）。上＝かた、下＝手くび
    const SlR = cs === 'vest' ? C2 : C, short = o.sleeve === 'short';
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { let R = SlR, t = [3, 3, 4, 3, 3, 2, 3, 3][x >> 2 & 7]; if (cs === 'stripe') R = (y >> 2) % 2 ? C2 : C; if (y < 2) t = 4; if (y > 12 && y < 18 && (x + y * 2) % 7 < 2) t = 2; if (y === 15) t = Math.min(t, 2);
      if (short && y > 9) { R = Sk; t = (x >> 2 & 7) === 5 ? 2 : (x >> 2 & 7) === 2 ? 4 : 3; if (y === 10) t = 1; } else if (!short) { if (y > 24 && y < 28) { R = cs === 'jacket' ? C : C2; t = y === 25 ? 5 : y === 27 ? 2 : 4; } if (y >= 28) { R = Sk; t = y === 28 ? 1 : 3; } if (y === 24) t = 1; } else if (y === 9) t = 1; else if (y === 8) t = 5;
      P.set(64 + x, y, tone(R, t)); }
    // 足（96..127 × 0..31）。上＝もも、下＝足くび
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const k = x >> 2 & 7; let R = Bt, t = k === 5 ? 2 : k === 2 ? 4 : 3; if (y > 11 && y < 17 && (x + y * 3) % 8 < 2) t = 2; if (y === 14 && k > 0 && k < 4) t = 4;
      if (o.shorts && y > 9) { R = Sk; if (y === 10) t = 1; if (y > 23) { R = ramp('#f0ece0'); t = y === 24 ? 5 : (x % 3 === 0 ? 2 : 3); } }
      if (o.boots && y > 17) { R = Sh; t = y === 18 ? 5 : y === 19 ? 4 : k === 5 ? 2 : 3; if (y === 17) t = 1; if (k === 2 && y > 20 && y % 3 === 0) t = 5; } else if (!o.shorts && y > 28) t = y === 29 ? 2 : 1;
      P.set(96 + x, y, tone(R, t)); }
    // かみの毛のたば（64..95 × 32..63）
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const zz = 6 + ((x >> 1) % 2), w2 = Math.round(tn(x, y, 8, 16, 32, 32, sd) * 2); let c = Hr[3]; if (y === zz || y === zz + 1) c = Hr[y === zz ? 5 : 4]; else if ((x + w2) % 5 === 0) c = Hr[2]; else if ((x + w2) % 5 === 2 && y > 10) c = Hr[4]; if (y > 28) c = Hr[y > 30 || x % 3 === 0 ? 1 : 2]; if (y < 2) c = Hr[4]; P.set(64 + x, 32 + y, c); }
    // 手（96..111 × 32..47）、くつ（112..127 × 32..47）、持ち物・帽子（96..127 × 48..63）
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { P.set(96 + x, 32 + y, y < 2 ? Sk[4] : (y > 9 && x % 4 === 3) ? Sk[1] : x > 11 ? Sk[2] : x < 3 ? Sk[4] : Sk[3]); P.set(112 + x, 32 + y, y > 12 ? Sh[0] : y === 12 ? Sh[5] : y < 2 ? Sh[4] : x < 4 ? Sh[4] : x > 12 ? Sh[2] : Sh[3]); }
    for (const y of [3, 6]) { P.set(118, 32 + y, Sh[5]); P.set(119, 32 + y, Sh[5]); P.set(120, 32 + y, Sh[5]); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) { let t = y === 0 ? 5 : y === 15 ? 1 : (x === 6 || x === 25) ? 2 : (x === 7 || x === 24) ? 4 : 3; if (y === 8) t = 1; if (y === 9) t = 4; if ((y === 2 || y === 13) && x % 2) t = 5; P.set(96 + x, 48 + y, tone(Ac, t)); }
    P.bits(110, 54, ['gggg', 'g..g', 'g..g', 'gddg'], { g: '#f2d27a', d: '#a8782a' });
    return P; });

  // ================= 3. テクスチャにする・材質 =================
  const cfg = { filter: 'mip', aniso: 4 };   // 'mip'＝遠くはなめらかにまとめる（ちらつかない）/ 'nearest'＝遠くもドットのまま（ちらつく。より古い感じ）
  function toTex(P, meta = {}) { const t = new THREE.CanvasTexture(P.canvas ? P.canvas() : P), mip = cfg.filter === 'mip' && !meta.cut; t.magFilter = THREE.NearestFilter; t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter; t.generateMipmaps = mip; if (mip) t.anisotropy = cfg.aniso; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.userData = { m: meta.m || 2, cut: !!meta.cut, w: P.w, h: P.h, name: meta.name }; return t; }
  const water1 = tex.water; tex.water = (o = {}) => { const n = o.frames || 4; return [...Array(n)].map((_, i) => water1({ ...o, frames: n, frame: i })); };
  tex.from = (P, meta = {}) => toTex(P, meta);   // 自分で打った Px をテクスチャにする。meta = { m, cut }

  // 材質。tex を はり、頂点をドットの位置に丸める（ふるえ）。o = { cut（抜き色で切りぬく。テクスチャが抜き色つきなら自動）, glow（光に関係なく光る）, vc（頂点の色を使う。R.geo で作った形は自動）,
  //   color（かける色）, side（両面）, smooth（面をなめらかに）, fog, emissive, offset（かべの絵が奥の面とちらつくとき true） }
  const U = { snap: { value: new THREE.Vector2(160, 100) } };
  const snapPatch = sh => { sh.uniforms.rSnap = U.snap; sh.vertexShader = 'uniform vec2 rSnap;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nif(rSnap.x>0.){gl_Position.xy=floor(gl_Position.xy/gl_Position.w*rSnap+.5)/rSnap*gl_Position.w;}'); };
  const matCache = new Map();
  function mat(t, o = {}) { if (typeof t === 'string') { o = { ...o, color: t }; t = null; } const key = (t ? t.uuid : '-') + JSON.stringify(o); let m = matCache.get(key); if (m) return m;
    const cut = o.cut ?? (t ? t.userData.cut : false), p = { map: t || null, color: o.color || '#ffffff', vertexColors: !!o.vc, alphaTest: cut ? .5 : 0, side: (o.side ?? cut) ? THREE.DoubleSide : THREE.FrontSide, fog: o.fog !== false };
    if (o.offset) { p.polygonOffset = true; p.polygonOffsetFactor = -2; p.polygonOffsetUnits = -2; }
    m = o.glow ? new THREE.MeshBasicMaterial(p) : new THREE.MeshLambertMaterial({ ...p, flatShading: !o.smooth, emissive: o.emissive || '#000000' }); m.onBeforeCompile = snapPatch; matCache.set(key, m); return m; }

  // ================= 4. ブラウン管の仕上げ =================
  // const crt = R.crt(renderer, { ... }); onResize(crt.resize); 毎コマ crt.render(scene, cam, t)。
  //   width  320   粗い絵の横のドット数（よこ長のとき）       tall   .62  たて長のときは width×tall ドット
  //   levels 24    色の段の数（R・G・B それぞれ）              dither 1    段の境目を点の並びで混ぜる強さ
  //   blur   1     横方向のにじみ（0 でくっきり）              bleed  1    色のにじみと色ずれ
  //   scan   .3    走査線の濃さ                                 bloom  .35  明るい所のにじみ
  //   curve  .05   画面の丸み                                   vignette .3 すみの暗がり
  //   mask   .1    蛍光体の粒                                   noise  .012 かすかなざらつき
  //   jitter 1     頂点のふるえ（0 で止める。2 でもっと粗く）   bright 1    全体の明るさ
  // crt.set({ ... }) であとから変えられる
  function crt(renderer, o = {}) {
    const p = { width: 320, tall: .62, levels: 24, dither: 1, blur: 1, bleed: 1, scan: .3, bloom: .35, curve: .05, vignette: .3, mask: .1, noise: .012, jitter: 1, bright: 1, ...o };
    const RT = (f, depth) => new THREE.WebGLRenderTarget(4, 4, { minFilter: f, magFilter: f, depthBuffer: !!depth });
    const rtA = RT(THREE.NearestFilter, true), rtB = RT(THREE.LinearFilter), rtG = RT(THREE.LinearFilter), rtH = RT(THREE.LinearFilter);
    const u = { tA: { value: rtA.texture }, tB: { value: rtB.texture }, tG: { value: rtG.texture }, tH: { value: rtH.texture }, size: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2() }, scale: { value: 3 }, time: { value: 0 }, dir: { value: new THREE.Vector2() } };
    for (const k of ['levels', 'dither', 'blur', 'bleed', 'scan', 'bloom', 'curve', 'vignette', 'mask', 'noise', 'bright']) u[k] = { value: p[k] };
    const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', HEAD = 'precision highp float;uniform sampler2D tA,tB,tG,tH;uniform vec2 size,res,dir;uniform float scale,time,levels,dither,blur,bleed,scan,bloom,curve,vignette,mask,noise,bright;varying vec2 vUv;\n';
    const SM = body => new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: HEAD + body, depthTest: false, depthWrite: false });
    // (1) 色の段を落として、点の並びで混ぜる
    const mQ = SM(`float bayer(vec2 p){vec2 a=mod(p,2.),b=mod(floor(p/2.),2.);float x=(a.y<.5)?(a.x<.5?0.:2.):(a.x<.5?3.:1.);float y=(b.y<.5)?(b.x<.5?0.:2.):(b.x<.5?3.:1.);return (x*4.+y)/16.;}
void main(){vec2 q=floor(vUv*size);vec3 c=pow(max(texture2D(tA,(q+.5)/size).rgb,0.),vec3(1./2.2));c=floor(c*levels+.5+(bayer(q)-.47)*dither)/levels;gl_FragColor=vec4(c,1.);}`);
    // (2) 明るい所だけを取り出して、横・たてにぼかす
    const mH = SM(`void main(){vec3 s=vec3(0.);float ws=0.;for(int i=-4;i<=4;i++){float w=exp(-float(i*i)/7.);vec3 c=texture2D(tB,vUv+vec2(float(i)*1.6/size.x,0.)).rgb;float m=max(c.r,max(c.g,c.b));s+=c*smoothstep(.5,.95,m)*w;ws+=w;}gl_FragColor=vec4(s/ws,1.);}`);
    const mV = SM(`void main(){vec3 s=vec3(0.);float ws=0.;for(int i=-4;i<=4;i++){float w=exp(-float(i*i)/7.);s+=texture2D(tG,vUv+vec2(0.,float(i)*1.6/size.y)).rgb*w;ws+=w;}gl_FragColor=vec4(s/ws,1.);}`);
    // (3) ブラウン管に映す
    const mC = SM(`float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 cc=vUv-.5,an=cc*res/max(res.x,res.y)*2.;float r2=dot(an,an);vec2 w=cc*(1.+curve*r2)/(1.+curve);vec2 su=w+.5;
vec2 p=(w*res)/scale+size*.5;   // 粗い絵のドットの座標（まん中は 1 ドット＝画面の scale ドット）
float iy=floor(p.y-.5),fy=p.y-.5-iy;fy=smoothstep(.2,.8,fy);float v=(iy+.5+fy)/size.y;
float x0=floor(p.x)+.5;float sn=.3+.3*blur,sw=.45+.8*bleed,sh=.3*bleed;vec3 cn=vec3(0.),cw=vec3(0.),wn=vec3(0.);float wl=0.;
for(int i=-3;i<=3;i++){float xi=x0+float(i),d=xi-p.x;vec3 c=texture2D(tB,vec2(xi/size.x,v)).rgb;float a=exp(-d*d/(2.*sn*sn));cn+=c*a;wl+=a;vec3 dd=vec3(d+sh,d,d-sh);vec3 b=exp(-dd*dd/(2.*sw*sw));cw+=c*b;wn+=b;}
cn/=wl;cw/=wn;vec3 L=vec3(.3,.59,.11);vec3 col=mix(cn,cw+(dot(cn,L)-dot(cw,L)),min(1.,bleed));
col+=texture2D(tH,su).rgb*bloom;
float lum=dot(col,L);float ph=scale<2.5?.25:0.;float sl=.5+.5*cos(6.2832*(fract(gl_FragCoord.y/scale+ph)-.5));float sa=scan*(1.-.55*lum)*smoothstep(1.2,2.,scale);col*=(1.-sa*(1.-sl))*(1.+sa*.42);
float mx=mod(gl_FragCoord.x,3.);vec3 mk=vec3(mx<1.?1.:0.,(mx>=1.&&mx<2.)?1.:0.,mx>=2.?1.:0.);col*=1.+mask*(mk*1.5-.5);
col*=1.-vignette*smoothstep(.5,2.,r2)*.9;col+=(h(gl_FragCoord.xy+fract(time)*91.)-.5)*noise;
vec2 e=smoothstep(vec2(0.),vec2(1.5*scale)/res,.5-abs(w));vec2 cr=max(abs(w)*res-(res*.5-vec2(6.*scale)),0.);float rc=1.-smoothstep(6.*scale-1.5,6.*scale,length(cr));
gl_FragColor=vec4(col*bright*e.x*e.y*mix(1.,rc,step(.0001,curve)),1.);}`);
    const ps = new THREE.Scene(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mQ), pc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); quad.frustumCulled = false; ps.add(quad);
    const pass = (m, rt) => { quad.material = m; renderer.setRenderTarget(rt); renderer.render(ps, pc); };
    const api = { u, p, low: { w: 320, h: 200, scale: 3 },
      resize(w, h) { const pr = renderer.getPixelRatio(), bw = Math.round(w * pr), bh = Math.round(h * pr), tw = w < h ? p.width * p.tall : p.width, sc = Math.max(1, Math.round(bw / tw)), rw = Math.ceil(bw / sc), rh = Math.ceil(bh / sc);
        rtA.setSize(rw, rh); rtB.setSize(rw, rh); rtG.setSize(Math.ceil(rw / 2), Math.ceil(rh / 2)); rtH.setSize(Math.ceil(rw / 2), Math.ceil(rh / 2)); u.size.value.set(rw, rh); u.res.value.set(bw, bh); u.scale.value = sc; api.low = { w: rw, h: rh, scale: sc };
        if (p.jitter > 0) U.snap.value.set(rw / 2 / p.jitter, rh / 2 / p.jitter); else U.snap.value.set(0, 0); },
      set(q) { Object.assign(p, q); for (const k in q) if (u[k] && k !== 'size') u[k].value = q[k]; if ('jitter' in q || 'width' in q || 'tall' in q) api.resize(innerWidth, innerHeight); },
      render(scene, cam, t = 0) { u.time.value = t; renderer.setRenderTarget(rtA); renderer.render(scene, cam); pass(mQ, rtB); if (p.bloom > 0) { pass(mH, rtG); pass(mV, rtH); } pass(mC, null); } };
    return api; }

  // ================= 5. 形を作る道具 =================
  // 置き場所の行列。TR(x, y, z, ry, rx, rz, s)
  const TR = (x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s));
  // n 角形の断面（上から見て、後ろ→左→前→右→後ろの順。u は 0→1）。off=.5 で前後が平らな面、0 で前後がかど
  const ngon = (n, off = .5) => ({ pts: [...Array(n)].map((_, k) => { const a = (k + off) / n * Math.PI * 2; return [-Math.sin(a), -Math.cos(a)]; }), u: [...Array(n + 1)].map((_, k) => k / n) });
  // 頭・胴用の断面（前の面が広い。顔や服の正面の絵がゆがまずに入る）
  const SEC9 = { pts: [[0, -.96], [-.62, -.9], [-1, -.4], [-1, .35], [-.6, .9], [.6, .9], [1, .35], [1, -.4], [.62, -.9]], u: [0, .06, .13, .22, .34, .66, .78, .87, .94, 1] };
  // 形を 1 つずつ足していく入れ物。面は少なく、UV と頂点の色（かけ算の明るさ）つき。
  //   g.rect(u0,v0,u1,v1) / g.px(x,y,w,h,W,H)：このあとの形がテクスチャのどの部分を使うか    g.tint(明るさ または [r,g,b])    g.at(行列)：このあとの形の置き場所    g.smooth(番号)：なめらかにつなぐ組（0 で面ごとにかくかく）
  //   g.quad(a,b,c,d, [u0,v0,u1,v1], 明るさ)   a=左下 b=右下 c=右上 d=左上（外から見て）。明るさは数 か [a,b,c,d]
  //   g.tri(a,b,c, ua,ub,uc, 明るさ)
  //   g.box(w,h,d, x,y,z, { m（1 枚が何 m か。指定するとくり返してはる）, top, bottom（上・下の面を作るか）, taper（上のすぼまり）, c0, c1（下・上の明るさ） })   y は底
  //   g.loft(断面, [[y, 半径x, 半径z, v, 明るさ, ずれx, ずれz], ...], { cap: 'top'/'bot'/'both', capUV, ur（よこのくり返し）, seg: [k0,k1], rot })   輪をつないだ筒（先細り・ふくらみ）。断面は数（n 角形）か ngon / SEC9
  //   g.mesh(テクスチャ か 材質, 材質の引数) → Mesh     g.build() → BufferGeometry
  function geo() {
    const pos = [], uv = [], col = [], sg = [], fx = [], G = {}; let M = null, S = 0, N = null, UV = [0, 0, 1, 1], C = [1, 1, 1]; const v3 = new THREE.Vector3();
    const put = (p, u, v, c = 1) => { if (M) { v3.set(p[0], p[1], p[2]).applyMatrix4(M); pos.push(v3.x, v3.y, v3.z); } else pos.push(p[0], p[1], p[2]); uv.push(UV[0] + u * (UV[2] - UV[0]), UV[1] + v * (UV[3] - UV[1])); if (typeof c === 'number') col.push(c * C[0], c * C[1], c * C[2]); else col.push(c[0] * C[0], c[1] * C[1], c[2] * C[2]); sg.push(S); if (N && M) { v3.set(N[0], N[1], N[2]).transformDirection(M); fx.push([v3.x, v3.y, v3.z]); } else fx.push(N); };
    G.at = m => { M = m || null; return G; }; G.smooth = n => { S = n; return G; }; G.normal = n => { N = n || null; return G; }; G.rect = (u0 = 0, v0 = 0, u1 = 1, v1 = 1) => { UV = [u0, v0, u1, v1]; return G; };
    G.px = (x, y, w, h, W, H) => G.rect(x / W, 1 - (y + h) / H, (x + w) / W, 1 - y / H); G.tint = c => { C = typeof c === 'number' ? [c, c, c] : (c || [1, 1, 1]); return G; };
    G.tri = (a, b, c, ua = [0, 0], ub = [1, 0], uc = [.5, 1], cs = 1) => { const k = typeof cs === 'number' || typeof cs[0] !== 'number' && false ? [cs, cs, cs] : cs; put(a, ua[0], ua[1], k[0]); put(b, ub[0], ub[1], k[1]); put(c, uc[0], uc[1], k[2]); return G; };
    G.quad = (a, b, c, d, r = [0, 0, 1, 1], cs = 1) => { const k = typeof cs === 'number' ? [cs, cs, cs, cs] : cs; put(a, r[0], r[1], k[0]); put(b, r[2], r[1], k[1]); put(c, r[2], r[3], k[2]); put(a, r[0], r[1], k[0]); put(c, r[2], r[3], k[2]); put(d, r[0], r[3], k[3]); return G; };
    G.box = (w, h, d, x = 0, y = 0, z = 0, o = {}) => { const tx = o.taper ? (o.taper[0] ?? o.taper) : 1, tz = o.taper ? (o.taper[1] ?? o.taper) : 1, a = w / 2, b = d / 2, c0 = o.c0 ?? 1, c1 = o.c1 ?? 1, cs = [c0, c0, c1, c1], m = o.m, R = (len, ht) => o.uv || (m ? [0, 0, len / m, ht / m] : [0, 0, 1, 1]);
      const p = (sx, sy, sz) => [x + sx * a * (sy ? tx : 1), y + sy * h, z + sz * b * (sy ? tz : 1)];
      G.quad(p(-1, 0, 1), p(1, 0, 1), p(1, 1, 1), p(-1, 1, 1), R(w, h), cs); G.quad(p(1, 0, -1), p(-1, 0, -1), p(-1, 1, -1), p(1, 1, -1), R(w, h), cs); G.quad(p(1, 0, 1), p(1, 0, -1), p(1, 1, -1), p(1, 1, 1), R(d, h), cs); G.quad(p(-1, 0, -1), p(-1, 0, 1), p(-1, 1, 1), p(-1, 1, -1), R(d, h), cs);
      if (o.top !== false) G.quad(p(-1, 1, 1), p(1, 1, 1), p(1, 1, -1), p(-1, 1, -1), o.topUV || (m ? [0, 0, w / m, d / m] : [0, 0, 1, 1]), c1); if (o.bottom) G.quad(p(-1, 0, -1), p(1, 0, -1), p(1, 0, 1), p(-1, 0, 1), o.topUV || [0, 0, 1, 1], c0 * .7); return G; };
    G.loft = (sec, rings, o = {}) => { const sc = typeof sec === 'number' ? ngon(sec, o.rot ?? .5) : sec, n = sc.pts.length, ur = o.ur || 1, k0 = o.seg ? o.seg[0] : 0, k1 = o.seg ? o.seg[1] : n;
      const P = (r, k) => { const q = sc.pts[k % n]; return [q[0] * r[1] + (r[5] || 0), r[0], q[1] * (r[2] ?? r[1]) + (r[6] || 0)]; }, Uk = k => sc.u[k] * ur, cv = r => r[4] ?? 1;
      for (let i = 0; i < rings.length - 1; i++) { const a = rings[i], b = rings[i + 1]; for (let k = k0; k < k1; k++) { const p0 = P(a, k), p1 = P(a, k + 1), p2 = P(b, k + 1), p3 = P(b, k); put(p0, Uk(k), a[3], cv(a)); put(p1, Uk(k + 1), a[3], cv(a)); put(p2, Uk(k + 1), b[3], cv(b)); put(p0, Uk(k), a[3], cv(a)); put(p2, Uk(k + 1), b[3], cv(b)); put(p3, Uk(k), b[3], cv(b)); } }
      const cap = (r, top) => { const c = [r[5] || 0, r[0] + (o.capH && top ? o.capH : 0), r[6] || 0], cu = k => o.capRect ? [.5 + sc.pts[k % n][0] * .5, .5 + sc.pts[k % n][1] * .5] : (o.capUV || [.5, r[3]]), cc = o.capRect ? [.5, .5] : (o.capUV || [.5, r[3]]); for (let k = 0; k < n; k++) { const a = P(r, k), b = P(r, k + 1); if (top) { put(a, ...cu(k), cv(r)); put(b, ...cu(k + 1), cv(r)); put(c, ...cc, cv(r)); } else { put(b, ...cu(k + 1), cv(r)); put(a, ...cu(k), cv(r)); put(c, ...cc, cv(r)); } } };
      if (o.cap === 'top' || o.cap === 'both') cap(rings[rings.length - 1], true); if (o.cap === 'bot' || o.cap === 'both') cap(rings[0], false); return G; };
    G.add = (g2, m) => { const q = g2._raw(), old = M; M = m || null; const s0 = S; for (let i = 0; i < q.pos.length / 3; i++) { S = q.sg[i] ? q.sg[i] + 1000 * (G._n = (G._n || 1)) : 0; const n0 = N; N = q.fx[i]; const u0 = UV; UV = [0, 0, 1, 1]; const c0 = C; C = [1, 1, 1]; put([q.pos[i * 3], q.pos[i * 3 + 1], q.pos[i * 3 + 2]], q.uv[i * 2], q.uv[i * 2 + 1], [q.col[i * 3], q.col[i * 3 + 1], q.col[i * 3 + 2]]); N = n0; UV = u0; C = c0; } G._n++; M = old; S = s0; return G; };
    G._raw = () => ({ pos, uv, col, sg, fx }); G.count = () => pos.length / 9;
    G.build = () => { const n = pos.length / 3, nor = new Float32Array(n * 3), acc = new Map(), fn = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      for (let i = 0; i < n; i += 3) { a.fromArray(pos, i * 3); b.fromArray(pos, i * 3 + 3); c.fromArray(pos, i * 3 + 6); b.sub(a); c.sub(a); b.cross(c); fn.push(b.x, b.y, b.z);
        for (let k = 0; k < 3; k++) { const j = i + k; if (sg[j]) { const key = sg[j] + '|' + Math.round(pos[j * 3] * 500) + '|' + Math.round(pos[j * 3 + 1] * 500) + '|' + Math.round(pos[j * 3 + 2] * 500); let q = acc.get(key); if (!q) acc.set(key, q = [0, 0, 0]); q[0] += b.x; q[1] += b.y; q[2] += b.z; sg[j] = key; } } }
      for (let i = 0; i < n; i++) { const f = Math.floor(i / 3) * 3; let x = fn[f], y = fn[f + 1], z = fn[f + 2]; if (fx[i]) [x, y, z] = fx[i]; else if (sg[i]) [x, y, z] = acc.get(sg[i]); const l = Math.hypot(x, y, z) || 1; nor[i * 3] = x / l; nor[i * 3 + 1] = y / l; nor[i * 3 + 2] = z / l; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; };
    G.mesh = (t, o = {}) => { const m = t && t.isMaterial ? t : mat(t, { vc: true, smooth: true, ...o }), me = new THREE.Mesh(G.build(), m); me.castShadow = !m.isMeshBasicMaterial; me.receiveShadow = true; return me; };
    return G; }
  // いくつかの材質にまたがる物を作るとき用。B.g(テクスチャ, 材質の引数) がその材質の入れ物を返し、B.group() で Group にまとめる
  function parts() { const map = new Map(), B = {}; B.g = (t, o = {}) => { const m = t && t.isMaterial ? t : mat(t, { vc: true, smooth: true, ...o }); let g = map.get(m); if (!g) map.set(m, g = geo()); return g; };
    B.group = () => { const gp = new THREE.Group(); for (const [m, g] of map) if (g.count()) { const me = new THREE.Mesh(g.build(), m); me.castShadow = !m.isMeshBasicMaterial; me.receiveShadow = true; gp.add(me); } return gp; }; return B; }

  // 動かない物をまとめて、材質ごとに 1 つの Mesh にする（描く回数がへって軽くなる）。userData.dyn = true の物（動く物・あかり）はそのまま残す
  function merge(list) { const out = new THREE.Group(), by = new Map(), keep = [], objs = Array.isArray(list) ? list : [list];
    const walk = n => { if (n.userData.dyn || n.isLight || n.isSprite || n.isPoints) { keep.push(n); return; } if (n.isMesh) { const a = n.geometry.attributes; if (!n.geometry.index && a.color && a.uv && a.normal) { let q = by.get(n.material); if (!q) by.set(n.material, q = []); q.push(n); } else { keep.push(n); return; } } for (const c of n.children) walk(c); };
    for (const ob of objs) { ob.updateMatrixWorld(true); walk(ob); }
    for (const n of keep) { const m = n.matrixWorld.clone(); out.add(n); m.decompose(n.position, n.quaternion, n.scale); }
    for (const [m, arr] of by) { let cnt = 0; for (const q of arr) cnt += q.geometry.attributes.position.count; const P = new Float32Array(cnt * 3), Nn = new Float32Array(cnt * 3), Uv = new Float32Array(cnt * 2), Cc = new Float32Array(cnt * 3), v = new THREE.Vector3(), nm = new THREE.Matrix3(); let o = 0;
      for (const q of arr) { const a = q.geometry.attributes, k = a.position.count; nm.getNormalMatrix(q.matrixWorld); for (let i = 0; i < k; i++) { v.fromBufferAttribute(a.position, i).applyMatrix4(q.matrixWorld); v.toArray(P, (o + i) * 3); v.fromBufferAttribute(a.normal, i).applyMatrix3(nm).normalize(); v.toArray(Nn, (o + i) * 3); } Uv.set(a.uv.array, o * 2); Cc.set(a.color.array, o * 3); o += k; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setAttribute('uv', new THREE.BufferAttribute(Uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); const me = new THREE.Mesh(g, m); me.castShadow = arr[0].castShadow; me.receiveShadow = arr[0].receiveShadow; out.add(me); }
    return out; }

  // ================= 6. 地面 =================
  // テクスチャをくり返しはった地面。3 枚までのテクスチャを、頂点ごとの重みでまぜる（境目はドットのギザギザと影つき）
  //   w, d（広さ m）, cell（ます目 m。既定 2）, H(x,z)（高さ）, layers: [下地, 2 枚め, 3 枚め], mix(x,z) → [2 枚めの重み, 3 枚めの重み]（0〜1。.5 が境目）,
  //   shade(x,z) → 明るさ（数 か [r,g,b]。影やあかりを地面に焼きこむ）
  // 返すもの：{ mesh, follow(cx, cz)（広い世界で、主役の下へ送りなおす）, mat }
  function ground(o = {}) { const w = o.w || o.size || 80, d = o.d || o.size || 80, cell = o.cell || 2, nx = Math.round(w / cell), nz = Math.round(d / cell), H = o.H || (() => 0), L = o.layers || [tex.grass()], m = L[0].userData.m || 2;
    const g = new THREE.PlaneGeometry(nx * cell, nz * cell, nx, nz); g.rotateX(-Math.PI / 2); const P = g.attributes.position, n = P.count, base = P.array.slice(), uvA = g.attributes.uv, col = new Float32Array(n * 3).fill(1), mx = new Float32Array(n * 2);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('rmix', new THREE.BufferAttribute(mx, 2));
    const mt = new THREE.MeshLambertMaterial({ map: L[0], vertexColors: true }), u2 = { map2: { value: L[1] || L[0] }, map3: { value: L[2] || L[0] }, rScale: { value: new THREE.Vector2(m / ((L[1] || L[0]).userData.m || 2), m / ((L[2] || L[0]).userData.m || 2)) } };
    mt.onBeforeCompile = sh => { snapPatch(sh); Object.assign(sh.uniforms, u2); sh.vertexShader = 'attribute vec2 rmix;varying vec2 vMix;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvMix=rmix;');
      sh.fragmentShader = `uniform sampler2D map2,map3;uniform vec2 rScale;varying vec2 vMix;float rH(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float rVN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rH(i),rH(i+vec2(1.,0.)),f.x),mix(rH(i+vec2(0.,1.)),rH(i+vec2(1.,1.)),f.x),f.y);}\n` + sh.fragmentShader.replace('#include <map_fragment>', `vec2 tq=floor(vMapUv*64.);float nB=rH(tq),t1=.5+(rVN(tq/9.)-.5)*.7+(nB-.5)*.2,t2=.5+(rVN(tq/9.+31.)-.5)*.7+(nB-.5)*.2;
vec4 cA=texture2D(map,vMapUv),cB=texture2D(map2,vMapUv*rScale.x),cC=texture2D(map3,vMapUv*rScale.y);
float eB=smoothstep(t1-.16,t1,vMix.x)*(1.-step(t1,vMix.x)),eC=smoothstep(t2-.16,t2,vMix.y)*(1.-step(t2,vMix.y));
vec4 sampledDiffuseColor=mix(cA*(1.-.28*eB),cB,step(t1,vMix.x));sampledDiffuseColor=mix(sampledDiffuseColor*(1.-.28*eC),cC,step(t2,vMix.y));diffuseColor*=sampledDiffuseColor;`); };
    mt.customProgramCacheKey = () => 'retro-ground';
    const mesh = new THREE.Mesh(g, mt); mesh.receiveShadow = true; mesh.frustumCulled = false; let px = null, pz = null;
    function follow(cx = 0, cz = 0) { const sx = Math.round(cx / cell) * cell, sz = Math.round(cz / cell) * cell; if (sx === px && sz === pz) return; px = sx; pz = sz;
      for (let i = 0; i < n; i++) { const x = base[i * 3] + sx, z = base[i * 3 + 2] + sz; P.array[i * 3 + 1] = H(x, z); uvA.array[i * 2] = x / m; uvA.array[i * 2 + 1] = -z / m; if (o.mix) { const q = o.mix(x, z); mx[i * 2] = q[0] || 0; mx[i * 2 + 1] = q[1] || 0; } if (o.shade) { const s = o.shade(x, z); if (typeof s === 'number') col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = s; else { col[i * 3] = s[0]; col[i * 3 + 1] = s[1]; col[i * 3 + 2] = s[2]; } } }
      P.needsUpdate = uvA.needsUpdate = true; g.attributes.color.needsUpdate = g.attributes.rmix.needsUpdate = true; g.computeVertexNormals(); mesh.position.set(sx, 0, sz); }
    follow(o.cx || 0, o.cz || 0); return { mesh, follow, mat: mt }; }
  // 道や川のような、帯の形の面（点の列にそって はる）。pts: [[x,y,z], ...]、wd（はば）、テクスチャは進む向きにくり返す
  function strip(pts, wd, t, o = {}) { const G = geo(), m = t.userData.m || 2; let v = 0; const side = i => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1; return [-dz / l * wd / 2, dx / l * wd / 2]; };
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], sa = side(i), sb = side(i + 1), len = Math.hypot(b[0] - a[0], b[2] - a[2]), v1 = v + len / m, y = o.lift ?? .03; G.quad([a[0] - sa[0], a[1] + y, a[2] - sa[1]], [a[0] + sa[0], a[1] + y, a[2] + sa[1]], [b[0] + sb[0], b[1] + y, b[2] + sb[1]], [b[0] - sb[0], b[1] + y, b[2] - sb[1]], [0, v, o.ur || 1, v1]); v = v1; }
    const me = G.mesh(t, { offset: true, ...(o.mat || {}) }); me.castShadow = false; return me; }
  // 足もとの丸い影（影の地図を使わない場面用）
  let blobT = null; function blob(r = .5, a = .45) { if (!blobT) { const P = Px(16); P.clip = true; P.each((x, y) => { const d = Math.hypot(x - 7.5, y - 7.5); return d < 5 ? '#000000' : d < 7.5 && ((x + y) & 1) ? '#000000' : null; }); blobT = toTex(P, { cut: true }); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: blobT, alphaTest: .5, color: '#000000', transparent: true, opacity: a, depthWrite: false })); m.material.onBeforeCompile = snapPatch; m.rotation.x = -Math.PI / 2; m.position.y = .04; m.renderOrder = 1; return m; }
  // 水のコマ送り。frames = R.tex.water()、毎コマ flip(材質, frames, t, 1 秒のコマ数)
  const flip = (m, frames, t, fps = 5) => { const f = frames[Math.floor(t * fps) % frames.length]; if (m.map !== f) { m.map = f; } };

  // ================= 7. 家 =================
  // かべの 4 つの向き（f=前(+z) r=右(+x) b=後ろ l=左）。s はかべにそった位置、e は外へのうき
  const SIDE = { f: [1, 0, 0, 1], r: [0, -1, 1, 0], b: [-1, 0, 0, -1], l: [0, 1, -1, 0] };
  const wpt = (sd, hw, hd, s, y, e = 0) => { const [rx, rz, nx, nz] = SIDE[sd], off = (sd === 'f' || sd === 'b' ? hd : hw) + e; return [rx * s + nx * off, y, rz * s + nz * off]; };
  const wallQ = (G, sd, hw, hd, s0, s1, y0, y1, r, cs, e = 0) => G.quad(wpt(sd, hw, hd, s0, y0, e), wpt(sd, hw, hd, s1, y0, e), wpt(sd, hw, hd, s1, y1, e), wpt(sd, hw, hd, s0, y1, e), r, cs);
  // R.house({ ... }) → Group（正面は +z、足もとが y=0）
  //   w, d（はば・奥行き）  h（1 階の高さ 2.8）  h2（2 階の高さ。0 で平屋）  jut（2 階のせり出し .25）
  //   wall, wall2（1 階・2 階のかべのテクスチャ）  base（土台の石。false でなし）  roof（屋根のテクスチャ）  trim（のき・帯の木）
  //   roofKind: 'gable'（切妻）/ 'hip'（寄棟。正方形なら とんがり屋根）/ 'flat'（陸屋根）   ridge: 'x'（正面にのきが来る）/ 'z'（正面に三角のかべ）  pitch（屋根のこうばい .85）  eave（のきの出 .5）
  //   door（扉のテクスチャ。false でなし）  doorX（正面での左右の位置）  win（窓のテクスチャ）  winLit（あかりのついた窓のテクスチャ）  lit（0〜1：あかりのついた窓の割合）
  //   wins: { f, r, b, l }（1 階の窓の数。数 か 位置の並び。省くと自動）  wins2（2 階）  chimney（true か { x, z }）  sign（つり看板のテクスチャ）  signX   awning（ひさしの布のテクスチャ）  awningW  seed
  function house(o = {}) { const w = o.w || 6, d = o.d || 5, h1 = o.h || 2.8, h2 = o.h2 || 0, jut = h2 ? (o.jut ?? .25) : 0, B = parts(), sd = o.seed || 0, H = h1 + h2, hw = w / 2, hd = d / 2, tw = hw + jut, td = hd + jut;
    const wallT = o.wall || tex.brick(), wall2T = o.wall2 || wallT, roofT = o.roof || tex.roof(), trimT = o.trim || tex.planks({ c: '#6e4b34' }), baseT = o.base === undefined ? tex.stone() : o.base, bh = baseT ? (o.baseH ?? .45) : 0;
    const kind = o.roofKind || 'gable', axis = o.ridge || 'x', pitch = o.pitch ?? .85, eave = o.eave ?? .5, mW = wallT.userData.m, mW2 = wall2T.userData.m, mT = trimT.userData.m;
    const ring = (G, a, b, y0, y1, m, c0, c1, e = 0) => { for (const s of 'frbl') { const L = s === 'f' || s === 'b' ? a : b; wallQ(G, s, a, b, -L, L, y0, y1, [0, 0, Math.max(1, Math.round(2 * L / m)), (y1 - y0) / m], [c0, c0, c1, c1], e); } };   // よこは きりのよい枚数にのばす。たては下のはしから
    ring(B.g(wallT), hw, hd, 0, h1, mW, .78, 1); if (baseT) ring(B.g(baseT), hw + .06, hd + .06, 0, bh, baseT.userData.m, .72, .95), B.g(baseT).quad([-hw - .06, bh, hd + .06], [hw + .06, bh, hd + .06], [hw + .06, bh, -hd - .06], [-hw - .06, bh, -hd - .06], [0, 0, w / 2, .1], .9);
    if (h2) { ring(B.g(wall2T), tw, td, h1, H, mW2, .9, 1); const T2 = B.g(trimT); ring(T2, tw + .04, td + .04, h1 - .12, h1 + .1, mT, .8, .95); T2.quad([-tw, h1 - .12, -td], [tw, h1 - .12, -td], [tw, h1 - .12, td], [-tw, h1 - .12, td], [0, 0, w / mT, d / mT], .5); }
    // 屋根
    const Rf = B.g(roofT), Tr = B.g(trimT), mR = roofT.userData.m, th = .1;
    const gable = (a, b) => { const yr = H + b * pitch, ze = b + eave, ye = H - eave * pitch, X = a + eave * .6, sl = Math.hypot(ze, yr - ye), r = [0, 0, 2 * X / mR, sl / mR];
      for (const s of [1, -1]) { Rf.quad([-X * s, ye, ze * s], [X * s, ye, ze * s], [X * s, yr, 0], [-X * s, yr, 0], r, [.9, .9, 1.06, 1.06]); Tr.quad([X * s, ye - th, ze * s], [-X * s, ye - th, ze * s], [-X * s, yr - th, 0], [X * s, yr - th, 0], [0, 0, 2 * X / mT, sl / mT], .45);
        Tr.quad([-X * s, ye - th - .04, ze * s], [X * s, ye - th - .04, ze * s], [X * s, ye + .02, ze * s], [-X * s, ye + .02, ze * s], [0, 0, 2 * X / mT, .12], .95);
        for (const q of [1, -1]) { const p = [[X * q, ye - th - .04, ze * s], [X * q, yr - th - .04, 0], [X * q, yr + .03, 0], [X * q, ye + .03, ze * s]]; if (q * s > 0) Tr.quad(p[0], p[1], p[2], p[3], [0, 0, sl / mT, .12], .9); else Tr.quad(p[1], p[0], p[3], p[2], [0, 0, sl / mT, .12], .9); } }
      Rf.tint(.62).box(2 * X + .04, .1, .2, 0, yr - .03, 0, { m: mR }).tint(1);
      const Gw = B.g(wall2T); for (const s of [1, -1]) Gw.tri([a * s, H, b * s], [a * s, H, -b * s], [a * s, yr - .02, 0], [0, h2 ? h2 / mW2 : h1 / mW2], [Math.max(1, Math.round(2 * b / mW2)), h2 ? h2 / mW2 : h1 / mW2], [Math.max(1, Math.round(2 * b / mW2)) / 2, (h2 || h1) / mW2 + (yr - H) / mW2], [1, 1, .92]); return yr; };
    const hip = (a, b) => { const yr = H + b * pitch, Xe = a + eave, Ze = b + eave, ye = H - eave * pitch, rl = a - b, sl = Math.hypot(Ze, yr - ye), U = 2 * Xe / mR, V = sl / mR;
      for (const s of [1, -1]) { Rf.tri([-Xe * s, ye, Ze * s], [Xe * s, ye, Ze * s], [rl * s, yr, 0], [0, 0], [U, 0], [(Xe + rl) / mR, V], [.9, .9, 1.06]); if (rl > .01) Rf.tri([-Xe * s, ye, Ze * s], [rl * s, yr, 0], [-rl * s, yr, 0], [0, 0], [(Xe + rl) / mR, V], [(Xe - rl) / mR, V], [.9, 1.06, 1.06]);
        Rf.tri([Xe * s, ye, Ze * s], [Xe * s, ye, -Ze * s], [rl * s, yr, 0], [0, 0], [2 * Ze / mR, 0], [Ze / mR, V], [.8, .8, .96]); }
      for (const s of 'frbl') wallQ(Tr, s, Xe, Ze, s === 'f' || s === 'b' ? -Xe : -Ze, s === 'f' || s === 'b' ? Xe : Ze, ye - th - .04, ye + .02, [0, 0, 2, .12], .95); Tr.quad([-Xe, ye - th, -Ze], [Xe, ye - th, -Ze], [Xe, ye - th, Ze], [-Xe, ye - th, Ze], [0, 0, 2, 2], .45); return yr; };
    let top = H; const rot = (kind === 'gable' && axis === 'z') || (kind === 'hip' && td > tw + .01) ? TR(0, 0, 0, Math.PI / 2) : null; Rf.at(rot); Tr.at(rot); B.g(wall2T).at(rot);
    if (kind === 'gable') top = rot ? gable(td, tw) : gable(tw, td); else if (kind === 'hip') top = rot ? hip(td, tw) : hip(tw, td);
    else { Rf.at(null); Rf.box(2 * tw + .3, .3, 2 * td + .3, 0, H - .05, 0, { m: mR, c0: .8 }); top = H + .25; }
    Rf.at(null); Tr.at(null); B.g(wall2T).at(null);
    // 窓と扉（かべの少し外にうかせてはる）
    const winT = o.win || tex.window(), litT = o.winLit || winT, ww = winT.userData.w / 32 * .95, wh = winT.userData.h / 32 * .95, lit = o.lit || 0, doorT = o.door === undefined ? tex.door() : o.door, dx = o.doorX ?? 0, dW = 1.05 * (o.doorS || 1), dH = 2.1 * (o.doorS || 1);
    const Wn = B.g(winT, { offset: true }), Wl = B.g(litT, { offset: true, glow: true }), slots = (L, n, avoid) => { const out = []; if (Array.isArray(n)) return n; if (n === undefined) n = Math.max(0, Math.floor((2 * L - .6) / 2.1)); for (let k = 0; k < n; k++) { const s = (k + .5) / n * 2 * L - L; if (avoid === undefined || Math.abs(s - avoid) > (dW + ww) / 2 + .15) out.push(s); } return out; };
    const putWins = (a, b, y, cfgW, floor) => { let k = 0; for (const s of 'frbl') { const L = s === 'f' || s === 'b' ? a : b; for (const p of slots(L, cfgW && cfgW[s], floor === 1 && s === 'f' && doorT ? dx : undefined)) { const G = hash(k++, floor * 7 + s.charCodeAt(0), sd) < lit ? Wl : Wn; wallQ(G, s, a, b, p - ww / 2, p + ww / 2, y, y + wh, [0, 0, 1, 1], 1, .04); } } };
    putWins(hw, hd, Math.max(bh + .35, 1.0), o.wins, 1); if (h2) putWins(tw, td, h1 + Math.max(.45, (h2 - wh) / 2), o.wins2, 2);
    if (doorT) wallQ(B.g(doorT, { offset: true }), 'f', hw, hd, dx - dW / 2, dx + dW / 2, 0, dH, [0, 0, 1, 1], 1, .09);
    if (o.chimney) { const c = o.chimney === true ? {} : o.chimney, cx = c.x ?? w * .24, cz = c.z ?? -d * .18, G = B.g(c.tex || tex.brick({ c: '#9a6a58' })), ct = top + (c.h ?? .7); G.box(.62, ct - H, .62, cx, H, cz, { m: 1.6, taper: .88, c0: .85, top: false }); B.g(tex.stone()).box(.74, .13, .74, cx, ct, cz, { m: 3 }); B.g(mat('#1a1418', { vc: true })).quad([cx - .2, ct + .135, cz + .2], [cx + .2, ct + .135, cz + .2], [cx + .2, ct + .135, cz - .2], [cx - .2, ct + .135, cz - .2]); }
    if (o.sign) { const sx = o.signX ?? (dx + dW / 2 + .75), y = Math.min(h1 - .25, 2.55), z0 = hd + (h2 ? jut : 0); Tr.at(null).box(.07, .07, 1.0, sx, y, z0 + .5, { m: mT }); const S = B.g(o.sign, { side: true }); S.quad([sx, y - .62, z0 + .15], [sx, y - .62, z0 + 1.0], [sx, y - .12, z0 + 1.0], [sx, y - .12, z0 + .15]); Tr.box(.03, .14, .03, sx, y - .13, z0 + .3, {}); Tr.box(.03, .14, .03, sx, y - .13, z0 + .85, {}); }
    if (o.awning) { const aw = o.awningW || 2.4, ax = o.awningX ?? dx, y = Math.min(h1 - .1, 2.75), z0 = hd + .05, A = B.g(o.awning, { side: true }), n = Math.max(1, Math.round(aw)); A.quad([ax - aw / 2, y - .45, z0 + 1.0], [ax + aw / 2, y - .45, z0 + 1.0], [ax + aw / 2, y, z0], [ax - aw / 2, y, z0], [0, .3, n, 1], [.95, .95, 1.05, 1.05]); A.quad([ax - aw / 2, y - .72, z0 + 1.0], [ax + aw / 2, y - .72, z0 + 1.0], [ax + aw / 2, y - .45, z0 + 1.0], [ax - aw / 2, y - .45, z0 + 1.0], [0, 0, n, .28], .88); }
    const gp = B.group(); gp.userData = { w, d, h: H, top }; return gp; }

  // ================= 8. 木と小物 =================
  def('metal', .5, (o = {}) => { const P = Px(16), M = ramp(o.c || '#4a4c58'); P.each((x, y) => (y === 2 || y === 13) && x % 4 === 1 ? M[0] : (y === 2 || y === 13) && x % 4 === 2 ? M[5] : M[[3, 4, 5, 4, 3, 3, 2, 1][x & 7]]); return P; });
  // さく（32×32 の切りぬき。よこにくり返す）。kind: 'picket'（とがった板）/ 'rail'（くいと横木）/ 'iron'（鉄の細いさく）
  def('fence', 1, (o = {}) => { const P = Px(32), kind = o.kind || 'picket', W = ramp(o.c || (kind === 'iron' ? '#3a3c48' : kind === 'rail' ? '#8f6a4a' : '#e6dcc8'));
    P.each((x, y) => { if (kind === 'picket') { const i = x % 8, tip = i === 3 ? 3 : (i === 2 || i === 4) ? 4 : (i === 1 || i === 5) ? 6 : 99; if (i >= 1 && i <= 5 && y >= tip) return i === 1 ? W[4] : i === 5 ? W[1] : (y % 9 === 4 ? W[2] : W[3]); if ((y >= 11 && y <= 13) || (y >= 23 && y <= 25)) return y === 11 || y === 23 ? W[2] : y === 13 || y === 25 ? W[0] : W[1]; return null; }
      if (kind === 'rail') { const i = x % 16; if (i < 4 && y >= 5) return y === 5 ? W[5] : i === 0 ? W[4] : i === 3 ? W[1] : W[3]; if ((y >= 10 && y <= 13) || (y >= 21 && y <= 24)) return y === 10 || y === 21 ? W[5] : y === 13 || y === 24 ? W[1] : ((x + y) % 7 === 0 ? W[2] : W[3]); return null; }
      const i = x % 4; if (i === 1 && y >= 3) return y < 6 ? W[4] : W[3]; if (i === 2 && y >= 5) return W[1]; if ((i === 0 || i === 2) && y === 5) return W[3]; if (y === 9 || y === 27) return W[4]; if (y === 10 || y === 28) return W[1]; return null; });
    return P; }, true);
  // 落ちる水（16×32 の切りぬき。たてにくり返す。offset.y を動かして流す）
  def('fall', .5, (o = {}) => { const P = Px(16, 32), W = ramp(o.c || '#8cc8ec'); P.each((x, y) => { const h1 = hash(x, 0, 3), ph = (y + Math.floor(h1 * 32)) % 16; if (h1 < .25) return null; return ph < 9 ? (h1 > .7 ? '#ffffff' : W[5]) : ph < 12 ? W[4] : null; }); return P; }, true);
  // 売り物（32×32。木の盆にくだものが並ぶ）
  def('goods', 1, (o = {}) => { const P = Px(32), W = ramp('#a8804e'), cs = o.fc || ['#e2503c', '#f2a23a', '#8ab84a', '#f2d24a']; P.each((x, y) => (x < 2 || x > 29 || y < 2 || y > 29) ? W[x < 2 || y < 2 ? 4 : 1] : W[2]);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const R = ramp(cs[(i + j * 2 + (o.seed || 0)) % cs.length]), cx = 7 + i * 9, cy = 7 + j * 9; P.disc(cx + .5, cy + 1, 4.4, W[0]); P.disc(cx, cy, 4.2, R[3]); P.disc(cx - .8, cy - .8, 2.6, R[4]); P.set(cx - 2, cy - 2, '#ffffff'); P.set(cx + 2, cy + 2, R[2]); P.set(cx + 1, cy + 3, R[2]); P.set(cx, cy - 4, '#5a3a20'); } return P; });
  // 車輪（32×32 の切りぬき）。kind: 'wood'（荷車）/ 'car'
  def('wheel', 1, (o = {}) => { const P = Px(32), kind = o.kind || 'wood', W = ramp(o.c || '#8a6238'), I = ramp('#4a4c58'); P.clip = true;
    P.each((x, y) => { const dx = x + .5 - 16, dy = y + .5 - 16, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), hi = dx + dy < 0; if (d > 15.5) return null;
      if (kind === 'car') return d > 9.5 ? (d > 14 ? '#1c1c24' : (Math.floor(a * 4 + 13) % 2 ? '#2a2a34' : '#34343e')) : d > 8.5 ? I[1] : d < 2.5 ? I[2] : (Math.abs(Math.sin(a * 2.5)) > .8 && d > 4) ? I[1] : hi ? I[5] : I[4];
      if (d > 14.3) return I[hi ? 4 : 2]; if (d > 11.5) return W[hi ? 4 : 2]; if (d < 3.5) return d < 1.5 ? I[1] : W[hi ? 5 : 3]; const sp = Math.abs(Math.sin(a * 4)); return sp < .28 ? W[hi ? 4 : 3] : sp < .4 ? W[1] : null; }); return P; }, true);

  // 木。kind: 'round'（広葉樹）/ 'pine'（針葉樹）/ 'tall'（ほそ長い木）/ 'bush'（幹のない しげみ）。h（高さ）、c（葉の色）、flowers（0〜1）と fc（花の色）、bark（幹のテクスチャ）、seed
  function tree(o = {}) { const kind = o.kind || 'round', h = o.h || (kind === 'bush' ? 1.2 : 5), sd = o.seed || 0, B = parts(), barkT = o.bark || tex.bark(), lc = o.c || (kind === 'pine' ? '#2f6f56' : '#4f8f48'), lo = { c: lc, flowers: o.flowers, fc: o.fc, seed: sd % 3 };
    const trunk = (ht, r) => B.g(barkT).smooth(1).loft(5, [[0, r * 1.7, r * 1.7, 0, .75], [ht * .12, r * 1.1, r * 1.1, ht * .06, .85], [ht * .8, r * .85, r * .85, ht * .4, 1], [ht, r * .6, r * .6, ht * .5, 1]], { ur: 1 });
    if (kind === 'pine') { trunk(h * .3, h * .035); const G = B.g(tex.leaves({ ...lo, shape: 'fringe' }), { side: true }).smooth(2); for (let k = 0; k < 4; k++) { const y0 = h * (.16 + k * .19), r = h * (.25 - k * .048), t = y0 + h * .36; G.loft(6, [[y0, r, r, .02, .7], [y0 + (t - y0) * .5, r * .48, r * .48, .6, .95], [t, .02, .02, 1, 1.12]], { ur: 2, rot: k * .5 }); } return B.group(); }
    const lump = (cx, cy, cz, rx, ry, n = 7) => { const G = B.g(tex.leaves({ ...lo, shape: 'tile' })).smooth(3 + cx), rings = [[-1, .3], [-.62, .8], [-.12, 1], [.42, .86], [.82, .5], [1, .04]].map(([t, r], i) => [cy + t * ry, r * rx * (1 + (hash(i, 1, sd + cx) - .5) * .16), r * rx * (1 + (hash(i, 2, sd + cx) - .5) * .16), (t + 1) * .5 * Math.max(1, Math.round(ry / 1.2)), .6 + (t + 1) * .28, cx + (hash(i, 3, sd) - .5) * rx * .16, cz + (hash(i, 4, sd) - .5) * rx * .16]); G.loft(n, rings, { ur: Math.max(2, Math.round(rx * 1.6)), rot: hash(cx, 5, sd) }); };
    const cards = (cy, rx, ry, k = 2) => { const G = B.g(tex.leaves({ ...lo, shape: 'blob' }), { side: true }).normal([0, 1, 0]); for (let i = 0; i < k; i++) { const a = hash(i, 9, sd) * .6 + i * Math.PI / k, cx = Math.cos(a) * rx * 1.28, cz = Math.sin(a) * rx * 1.28; G.quad([-cx, cy - ry * 1.22, -cz], [cx, cy - ry * 1.22, cz], [cx, cy + ry * 1.3, cz], [-cx, cy + ry * 1.3, -cz], [0, 0, 1, 1], [.66, .66, 1.1, 1.1]); } G.normal(null); };
    if (kind === 'bush') { lump(0, h * .42, 0, h * .62, h * .5, 6); cards(h * .45, h * .62, h * .5); return B.group(); }
    if (kind === 'tall') { trunk(h * .3, h * .03); lump(0, h * .6, 0, h * .15, h * .42, 6); cards(h * .6, h * .15, h * .4); return B.group(); }
    const R0 = h * .3; trunk(h * .52, h * .042); lump(0, h * .7, 0, R0, h * .27); const a = hash(1, 7, sd) * 6.28; lump(Math.cos(a) * R0 * .72, h * .56, Math.sin(a) * R0 * .72, R0 * .62, h * .17, 6); cards(h * .69, R0, h * .27, 2); return B.group(); }

  // たる（h, r, c）・木箱（s, c, kind）
  function barrel(o = {}) { const h = o.h || .95, r = o.r || .36, t = tex.barrel({ c: o.c }), G = geo().smooth(1).rect(0, 0, .5, 1).loft(8, [[0, r * .8, r * .8, 0, .7], [h * .22, r * .96, r * .96, .22, .9], [h * .5, r, r, .5, 1], [h * .78, r * .96, r * .96, .78, 1], [h, r * .8, r * .8, 1, 1]]).smooth(0).rect(.5, 0, 1, 1).loft(8, [[h - .03, r * .78, r * .78, 0, 1]], { cap: 'top', capRect: true }); return G.mesh(t); }
  function crate(o = {}) { const s = o.s || .8, t = tex.crate({ c: o.c, kind: o.kind }); return geo().box(s, s, s, 0, 0, 0, { c0: .8 }).mesh(t); }
  // 岩（s 大きさ, c, moss, seed）
  function rock(o = {}) { const s = o.s || 1, sd = o.seed || 0, t = tex.rock({ c: o.c, moss: o.moss }), j = (i, k) => 1 + (hash(i, k, sd) - .5) * .5; return geo().loft(6, [[0, s * .95 * j(0, 1), s * .9 * j(0, 2), 0, .7], [s * .28, s * 1.05 * j(1, 1), s * 1.0 * j(1, 2), .3, .92, s * .08 * j(1, 3), 0], [s * .62, s * .72 * j(2, 1), s * .68 * j(2, 2), .62, 1.05, s * .1, s * .06], [s * .8, s * .3, s * .3, .85, 1.1, s * .12, s * .04]], { cap: 'top', ur: 2, rot: hash(3, 3, sd) }).mesh(t); }
  // 草のふさ（板を十字に組む）。kind は R.tex.tuft と同じ、s 大きさ
  function tuft(o = {}) { const s = o.s || .7, t = tex.tuft({ kind: o.kind, c: o.c, fc: o.fc, seed: o.seed, flowers: o.flowers }), G = geo().normal([0, 1, 0]); for (const a of [.4, .4 + Math.PI / 2]) { const cx = Math.cos(a) * s / 2, cz = Math.sin(a) * s / 2; G.quad([-cx, 0, -cz], [cx, 0, cz], [cx, s, cz], [-cx, s, -cz], [0, 0, 1, 1], [.75, .75, 1.05, 1.05]); } const m = G.mesh(t); m.castShadow = false; return m; }
  // 街灯。h（高さ）、arm（うでの長さ。0 で柱の上にのる）、light（true で PointLight つき。userData.light）、cold（青白い光）、c（鉄の色）
  function lamp(o = {}) { const h = o.h || 3.2, arm = o.arm ?? 0, B = parts(), M = B.g(tex.metal({ c: o.c })).smooth(1); M.loft(6, [[0, .2, .2, 0, .8], [.12, .17, .17, .2, 1], [.3, .075, .075, .5, 1], [h * .86, .05, .05, 4, 1], [h * .88, .09, .09, 4.2, 1], [h * .9, .045, .045, 4.4, 1]], { cap: 'top' });
    const lx = arm, ly = arm ? h * .8 : h * .9; if (arm) { M.smooth(0).box(arm + .1, .05, .05, arm / 2, h * .88, 0, {}); M.box(.03, .12, .03, arm, h * .88 - .12, 0, {}); }
    B.g(tex.lamp({ cold: o.cold }), { glow: true }).loft(4, [[ly, .1, .1, 0], [ly + .3, .16, .16, 1]], { rot: .5, ur: 4 }); B.g(tex.metal({ c: o.c })).smooth(0).loft(4, [[ly + .3, .2, .2, 0, 1], [ly + .42, .04, .04, 1, 1.1]], { cap: 'top', rot: .5 }).loft(4, [[ly - .04, .08, .08, 0, .8], [ly, .11, .11, .2, .9]], { rot: .5 });
    const g = B.group(); if (o.light) { const L = new THREE.PointLight(o.cold ? '#bfe0ff' : '#ffc070', o.power || 14, o.range || 9, 1.6); L.position.set(lx, ly + .1, 0); g.add(L); g.userData.light = L; } g.userData.lampPos = [lx, ly + .15, 0]; return g; }
  // さく。len（長さ m）、kind（R.tex.fence と同じ）、h（高さ）、c
  function fence(o = {}) { const len = o.len || 4, h = o.h || 1, t = tex.fence({ kind: o.kind, c: o.c }), G = geo().normal([0, .7, .7]); G.quad([-len / 2, 0, 0], [len / 2, 0, 0], [len / 2, h, 0], [-len / 2, h, 0], [0, 0, Math.round(len / h), 1], [.85, .85, 1, 1]); const m = G.mesh(t, { side: true }); return m; }
  // 噴水。r（水盤の半径）。userData.tick(t) を毎コマ呼ぶと水が動く
  function fountain(o = {}) { const r = o.r || 1.7, B = parts(), st = o.stone || tex.stone({ c: '#a8a296' }), S = B.g(st).smooth(0), wf = tex.water({ c: o.water || '#4a9ad0' }), n = 8;
    S.loft(n, [[0, r + .08, r + .08, 0, .7], [.5, r, r, .25, 1]], { ur: 6 }).loft(n, [[.5, r, r, 0, 1.05], [.5, r - .22, r - .22, .11, 1.05]], { ur: 6 }).loft(n, [[.5, r - .22, r - .22, .12, .8], [.3, r - .22, r - .22, .22, .6]], { ur: 6 });
    S.smooth(1).loft(n, [[.2, .34, .34, 0, .8], [.5, .22, .22, .15, .95], [1.25, .14, .14, .5, 1], [1.4, .62, .62, .6, 1.05], [1.52, .7, .7, .7, 1.1]], { ur: 2 }).smooth(0).loft(n, [[1.52, .7, .7, 0, 1.1], [1.52, .56, .56, .1, 1.1]], { ur: 2 }).loft(n, [[1.52, .56, .56, .1, .8], [1.42, .2, .2, .3, .7]], { ur: 2 }).smooth(1).loft(6, [[1.42, .1, .1, 0, .9], [1.85, .07, .07, .2, 1], [1.95, .13, .13, .25, 1.1], [2.05, .03, .03, .3, 1.1]], { cap: 'top' });
    const g = B.group(), wm = mat(wf[0], { vc: true, smooth: true }).clone(); wm.onBeforeCompile = snapPatch; const W = geo().normal([0, 1, 0]); W.loft(n, [[.36, r - .22, r - .22, 0, 1]], { cap: 'top', capRect: true }).loft(n, [[1.47, .56, .56, 0, 1.1]], { cap: 'top', capRect: true }); const pts = W._raw(); for (let i = 0; i < pts.uv.length; i++) pts.uv[i] *= r * 1.2; const wmesh = new THREE.Mesh(W.build(), wm); wmesh.userData.dyn = true; wmesh.receiveShadow = true; g.add(wmesh);
    const ft = tex.fall().clone(); ft.needsUpdate = true; const fm = new THREE.MeshBasicMaterial({ map: ft, alphaTest: .5, side: THREE.DoubleSide, color: '#e8f6ff' }); fm.onBeforeCompile = snapPatch; const F = geo(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .4, c = Math.cos(a), s = Math.sin(a), px = -s * .17, pz = c * .17; F.quad([c * .86 - px, .36, s * .86 - pz], [c * .86 + px, .36, s * .86 + pz], [c * .68 + px, 1.5, s * .68 + pz], [c * .68 - px, 1.5, s * .68 - pz], [0, 0, 1, 2.2]); }
    const fmesh = new THREE.Mesh(F.build(), fm); fmesh.userData.dyn = true; g.add(fmesh); g.userData.dyn = false; g.userData.tick = t => { flip(wm, wf, t, 5); ft.offset.y = t * 1.6; }; g.userData.r = r; return g; }
  // 井戸（石のつつ＋屋根＋つるべ）
  function well(o = {}) { const B = parts(), S = B.g(o.stone || tex.stone()), W = B.g(tex.planks({ c: '#7a5638' })), r = .75; S.loft(8, [[0, r + .06, r + .06, 0, .7], [.85, r, r, .42, 1]], { ur: 3 }).loft(8, [[.85, r, r, 0, 1.05], [.85, r - .2, r - .2, .1, 1.05]], { ur: 3 }).loft(8, [[.85, r - .2, r - .2, 0, .5], [.3, r - .2, r - .2, .3, .25]], { ur: 3 });
    B.g(mat('#141820', { vc: true })).loft(8, [[.32, r - .2, r - .2, 0, 1]], { cap: 'top' }); for (const s of [-1, 1]) W.box(.12, 1.9, .12, s * (r - .02), .5, 0, { m: 2 }); W.box(2 * r + .3, .08, .08, 0, 1.75, 0, { m: 2 });
    const Rf = B.g(o.roof || tex.shingle()); for (const s of [1, -1]) Rf.quad([-(r + .35) * s, 2.3, .75 * s], [(r + .35) * s, 2.3, .75 * s], [(r + .35) * s, 2.85, 0], [-(r + .35) * s, 2.85, 0], [0, 0, 1.1, .5], [.9, .9, 1.05, 1.05]); for (const s of [1, -1]) W.tri([(r + .3) * s, 2.3, .7 * s], [(r + .3) * s, 2.3, -.7 * s], [(r + .3) * s, 2.83, 0], [0, 0], [.7, 0], [.35, .26], .8);
    W.box(.02, .7, .02, 0, 1.05, 0, {}); const b = barrel({ h: .3, r: .16 }); b.position.set(0, .8, 0); const g = B.group(); g.add(b); return g; }
  // 屋台（しまのひさし＋台＋売り物）。c, c2 = ひさしの 2 色
  function stall(o = {}) { const B = parts(), W = B.g(tex.planks({ c: '#8f6a44' })), w = o.w || 2.4, d = 1.3; for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) W.box(.09, z > 0 ? 2.0 : 2.5, .09, x * w / 2, 0, z * d / 2, { m: 2 }); W.box(w + .1, .1, d + .1, 0, .85, 0, { m: 2 }); W.box(w, .5, .06, 0, .35, d / 2, { m: 2, top: false, c0: .7 });
    const n = Math.round(w / .8); B.g(tex.goods({ seed: o.seed, fc: o.fc })).quad([-w / 2 + .1, .97, d / 2 - .08], [w / 2 - .1, .97, d / 2 - .08], [w / 2 - .1, 1.16, -d / 2 + .15], [-w / 2 + .1, 1.16, -d / 2 + .15], [0, 0, n, 1]);
    const A = B.g(tex.fabric({ c: o.c || '#d8503c', c2: o.c2 || '#f4ead2', scallop: 1 }), { side: true }), aw = w + .5; A.quad([-aw / 2, 1.98, d / 2 + .4], [aw / 2, 1.98, d / 2 + .4], [aw / 2, 2.55, -d / 2 - .15], [-aw / 2, 2.55, -d / 2 - .15], [0, .3, Math.round(aw / .75), 1], [.92, .92, 1.06, 1.06]); A.quad([-aw / 2, 1.72, d / 2 + .4], [aw / 2, 1.72, d / 2 + .4], [aw / 2, 1.98, d / 2 + .4], [-aw / 2, 1.98, d / 2 + .4], [0, 0, Math.round(aw / .75), .28], .85); return B.group(); }
  // 長いす
  function bench(o = {}) { const G = geo(), w = o.w || 1.6; G.box(w, .07, .42, 0, .42, 0, { m: 1.4 }); G.box(w, .32, .06, 0, .62, -.2, { m: 1.4 }); for (const s of [-1, 1]) { G.box(.08, .42, .4, s * (w / 2 - .12), 0, 0, { m: 1.4, top: false }); G.box(.07, .5, .07, s * (w / 2 - .12), .42, -.2, { m: 1.4, top: false }); } return G.mesh(tex.planks({ c: o.c || '#8f6a44' })); }
  // 標識（柱＋板）。kind は R.tex.roadSign と同じ
  function roadSign(o = {}) { const B = parts(), h = o.h || 2.4; B.g(tex.metal({ c: '#9a9ea8' })).smooth(1).loft(5, [[0, .04, .04, 0, .8], [h, .035, .035, 4, 1]], { cap: 'top' }); B.g(tex.roadSign({ kind: o.kind }), { side: true }).quad([-.32, h - .6, .05], [.32, h - .6, .05], [.32, h + .04, .05], [-.32, h + .04, .05]); return B.group(); }
  // 雲（空にうかべる板。光に関係なく明るい）
  function cloud(o = {}) { const s = o.s || 14, t = tex.cloud({ c: o.c, shade: o.shade, seed: o.seed }), m = new THREE.Mesh(new THREE.PlaneGeometry(s, s / 2), new THREE.MeshBasicMaterial({ map: t, alphaTest: .5, fog: false, side: THREE.DoubleSide })); return m; }

  return { hash, mix, ramp, tone, tn, Px, paint: T, tex, mat, crt, U, cfg, TR, ngon, SEC9, geo, parts, merge, ground, strip, blob, flip, house, tree, barrel, crate, rock, tuft, lamp, fence, fountain, well, stall, bench, roadSign, cloud };
};
