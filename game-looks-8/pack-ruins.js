//@@HEADER@@
window.PACK_RUINS = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, geo, parts, TR, mat } = R, T = R.tex, PT = R.paint;
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), TAU = Math.PI * 2;
  const GREEN = '#63a04c', IVY = '#4c9650', CONC = '#b9b5a6', RUST = '#a9603a';

  // ================= 1. テクスチャ =================
  const paint = {}, tex = {}, cache = new Map();
  const def = (name, m, fn, cut = false) => { paint[name] = fn; tex[name] = (o = {}) => { const key = name + JSON.stringify(o); let t = cache.get(key); if (!t) cache.set(key, t = T.from(fn(o), { m: o.m || m, cut, name: 'ruins.' + name })); return t; }; };
  // ひび（ぎざぎざに進む暗い線。となりに明るい点を打って、段のふちに見せる）。ax=1 でよこ向き
  const crackLine = (P, x, y, n, ax, sd, dk, hi) => { for (let k = 0; k < n; k++) { P.set(x, y, dk); if (hi && k % 3 === 1) P.set(x + (ax ? 0 : 1), y + (ax ? 1 : 0), hi); const r = hash(k, sd, 7); if (ax) { x++; y += r > .72 ? 1 : r < .28 ? -1 : 0; } else { y++; x += r > .72 ? 1 : r < .28 ? -1 : 0; } } return [x, y]; };
  // くり返せる ます目のかけら（size ドットに n×n 個）。id・ふちまでの近さ e・中心からのずれ bx, by を返す
  const vor = (x, y, size, n, sd, jit = .9, wob = 0) => { const cs = size / n, gx = Math.floor(x / cs), gy = Math.floor(y / cs); let b1 = 1e9, b2 = 1e9, id = 0, bx = 0, by = 0; if (wob) { x += (tn(x, y, 4, 4, size, size, sd + 13) - .5) * wob; y += (tn(x, y, 4, 4, size, size, sd + 14) - .5) * wob; }
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const wx = ((gx + i) % n + n) % n, wy = ((gy + j) % n + n) % n, ax = x + .5 - (gx + i + .5 + (hash(wx, wy, sd) - .5) * jit) * cs, ay = y + .5 - (gy + j + .5 + (hash(wx, wy, sd + 9) - .5) * jit) * cs, d = Math.hypot(ax, ay) * .6 + Math.max(Math.abs(ax), Math.abs(ay)) * .4; if (d < b1) { b2 = b1; b1 = d; id = wy * n + wx; bx = ax; by = ay; } else if (d < b2) b2 = d; } return { id, e: b2 - b1, bx, by }; };
  // 葉 1 枚（左上が明るく、右下が暗い）
  const LEAF = [[' ll ', 'lmmd', 'mmdk', ' dk '], [' lm ', 'lmmk', ' dk '], ['ll ', 'lmd', 'mdk', ' k '], ['lm', 'dk']];
  const leaf = (put, x, y, G, k, b = 0) => LEAF[k].forEach((row, jj) => [...row].forEach((ch, ii) => { if (ch !== ' ') put(x + ii, y + jj, G[{ l: 4 + b, m: 3 + b, d: 2, k: 1 }[ch]]); }));
  // こけの重ねがけ。amt 0〜1、bias(x, y) で生えやすい所（下・目地）を足す。ふちは市松で影を落とす
  const mossOver = (P, amt, c, sd, bias) => { if (!amt) return; const G = ramp(c || GREEN), W = P.w, H = P.h;
    const f = (x, y) => tn(x, y, 16, 16, W, H, sd + 40) * .55 + tn(x, y, 8, 8, W, H, sd + 41) * .45 + (bias ? bias(x, y) : 0) - (1 - amt * .9);
    P.each((x, y, c0) => { if (c0 === null) return; const n = f(x, y); if (n < 0) return n > -.035 && f(x, y - 1) >= 0 ? mix(c0, G[0], .45) : undefined; const d = tn(x, y, 4, 4, W, H, sd + 42); return n < .03 ? ((x + y) & 1 ? G[2] : G[1]) : d > .68 ? G[4] : d < .3 ? G[2] : G[3]; });
    for (let k = 0; k < 26; k++) { const x = Math.floor(hash(k, 1, sd + 43) * W), y = Math.floor(hash(k, 2, sd + 43) * H); if (f(x, y) > .06) { P.set(x, y, G[5]); P.set(x + 1, y + 1, G[1]); } } };

  // われたコンクリート。c, crack 0〜1（ひびの量）, moss 0〜1（こけ）, stain（さびのしみ。既定 1）
  def('concrete', 3, (o = {}) => { const base = o.c || CONC, sd = o.seed || 0, P = PT.concrete({ c: base, seed: sd }), C = ramp(base, 6, { contrast: .75 }), Ru = ramp(RUST), cr = o.crack ?? .6;
    for (let k = 0; k < Math.round(cr * 5); k++) { let x = Math.floor(hash(k, 1, sd + 5) * 64), y = Math.floor(hash(k, 2, sd + 5) * 64); [x, y] = crackLine(P, x, y, 12 + Math.floor(hash(k, 3, sd) * 22), k % 2, sd + k, C[0], C[5]); if (hash(k, 4, sd) > .35) crackLine(P, x, y, 9, (k + 1) % 2, sd + k + 9, C[1]); }
    for (let k = 0; k < Math.round(cr * 4); k++) { const x = Math.floor(hash(k, 6, sd) * 60), y = Math.floor(hash(k, 7, sd) * 60); P.bits(x, y, ['.dd..', 'dkkm.', '.kmmh', '..hh.'], { d: C[1], k: C[0], m: C[2], h: C[5] }); }
    if (o.stain ?? 1) for (let k = 0; k < 3; k++) { const x = Math.floor(hash(k, 8, sd) * 64), y = Math.floor(hash(k, 9, sd) * 40), n = 8 + Math.floor(hash(k, 10, sd) * 12); P.set(x, y, Ru[1]); P.set(x + 1, y, Ru[3]); for (let j = 1; j < n; j++) if (j < n * .5 || (j & 1)) P.set(x + (j > n * .7 ? 1 : 0), y + j, mix(P.get(x, y + j) || C[3], Ru[3], .5 - j / n * .3)); }
    mossOver(P, o.moss ?? .3, o.mossC, sd, (x, y) => (y / 64 - .5) * .25); return P; });

  // さびた鉄板。c（さびの色）, paint（ペンキの色。入れると「はげたペンキ」）, peel 0〜1（はげぐあい）, wave（波板）, panel（つぎ目の間かく。0 でなし）
  def('rust', 2, (o = {}) => { const P = Px(64), sd = o.seed || 0, Rr = ramp(o.c || RUST), Dk = ramp('#5e4038'), Pn = o.paint && ramp(o.paint, 6, { contrast: .8 }), peel = o.peel ?? .45, pn = o.panel ?? 32;
    const keep = (x, y) => Pn && tn(x, y, 8, 8, 64, 64, sd + 5) * .35 + tn(x, y, 4, 4, 64, 64, sd + 6) * .3 + tn(x, y, 16, 32, 64, 64, sd + 7) * .35 - (pn ? Math.max(0, ((y % pn) / pn - .7)) * .45 : 0) > .5 + (peel - .5) * .5;
    P.each((x, y) => { const n = tn(x, y, 16, 16, 64, 64, sd) * .5 + tn(x, y, 8, 8, 64, 64, sd + 1) * .32 + hash(x >> 1, y >> 1, sd) * .18, st = tn(x, 0, 4, 64, 64, 64, sd + 2) > .66 && tn(x, y, 4, 32, 64, 64, sd + 3) > .45;
      if (keep(x, y)) { if (!keep(x, y - 1)) return Pn[5]; const m = tn(x, y, 8, 16, 64, 64, sd + 8); return m > .7 ? Pn[4] : m < .22 ? Pn[2] : Pn[3]; }
      if (Pn && keep(x, y - 1)) return Dk[1]; if (Pn && keep(x - 1, y)) return Dk[2];
      if (hash(x, y, sd + 4) > .975) return Dk[1]; const t = (n > .66 ? 4 : n > .5 ? 3 : n > .36 ? 2 : 1) - (st ? 1 : 0); return t >= 4 ? mix(Rr[4], '#e09a4a', .4) : Rr[Math.max(1, t)]; });
    if (pn) for (let y = 0; y < 64; y += pn) for (let x = 0; x < 64; x++) { P.set(x, y, Dk[0]); P.mul(x, y + 1, 1.22); if (x % 8 === 3) { P.set(x, y + 3, Dk[1]); P.mul(x + 1, y + 4, 1.3); } }
    if (o.wave) P.each((x, y, c) => { const f = [1.2, 1.08, 1, .92, .72, .86, 1, 1.1][x & 7]; const q = c.match(/\w\w/g).map(h => cl(Math.round(parseInt(h, 16) * f), 0, 255).toString(16).padStart(2, '0')); return '#' + q.join(''); });
    return P; });

  // ぬけた窓のかべ（128 ドット＝6 m。3 m ごとに窓 1 つ、4 つの窓がぜんぶちがう：からっぽ・われたガラス・くもったガラス・草がこぼれる）
  //   c（かべの色）, moss, holes 0〜1（ガラスの無い窓のわりあい）, plants 0〜1（窓から草）, flowers, glass（ガラスの色）
  def('ruinWall', 6, (o = {}) => { const P = Px(128), base = o.c || CONC, sd = o.seed || 0, C = ramp(base, 6, { contrast: .75 }), Gl = ramp(o.glass || '#86b4c8', 6, { warm: .5 }), In = ['#343b4e', '#444e64', '#58647c', '#74849c'], G = ramp(o.plantC || IVY), Fr = ramp('#8a8c86');
    for (let q = 0; q < 4; q++) P.blit(paint.concrete({ c: base, seed: sd * 4 + q, crack: .5, moss: 0 }), (q & 1) * 64, (q >> 1) * 64);
    for (const y of [0, 64]) for (let x = 0; x < 128; x++) { P.set(x, y, C[1]); P.set(x, y + 1, C[5]); P.set(x, y + 2, C[4]); P.set(x, y + 3, (x & 3) ? C[4] : C[3]); P.set(x, y + 4, C[2]); P.mul(x, y + 5, .86); }
    mossOver(P, o.moss ?? .35, o.mossC, sd, (x, y) => { const v = (y % 64) / 64; return (v > .78 ? .16 : v < .12 ? .12 : 0) - .04; });
    for (let q = 0; q < 4; q++) { const x0 = (q & 1) * 64 + 14, y0 = (q >> 1) * 64 + 16, w = 36, h = 30, r = hash(q, 3, sd), hole = r < (o.holes ?? .6), kind = hole ? (hash(q, 5, sd) < (o.plants ?? .45) ? 3 : hash(q, 6, sd) < .5 ? 1 : 0) : 2;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = i + j * .6; let c = j < 3 ? In[0] : i < 3 ? In[0] : d > 44 ? In[3] : d > 30 ? In[2] : In[1]; if (i > w - 9 && j > 9 && j < h - 3 && i < w - 3) c = ((i + j) & 1) && i === w - 8 ? In[2] : In[3];   // おくのかべに落ちる光
        if (kind === 2) { const b = ((i + j) % 22 + 22) % 22; c = b === 9 || b === 10 ? Gl[4] : b === 14 ? Gl[3] : j > h * .7 && ((i + j) & 1) ? mix(Gl[2], C[3], .5) : j < 6 ? Gl[1] : Gl[2]; }
        if (kind === 1) { const a = i + j, b2 = (w - i) + (h - j), e = (w - i) + j; if (a < 15 + hash(i >> 2, 1, sd + q) * 6 || b2 < 13 + hash(j >> 2, 2, sd + q) * 7 || (e < 9)) c = (a === 12 || b2 === 10) ? Gl[5] : (i + j) % 7 === 0 ? Gl[4] : Gl[3]; }
        P.set(x0 + i, y0 + j, c); }
      for (let i = -2; i < w + 2; i++) { P.set(x0 + i, y0 + h, C[5]); P.set(x0 + i, y0 + h + 1, C[4]); P.set(x0 + i, y0 + h + 2, C[1]); P.set(x0 + i, y0 - 1, C[1]); P.set(x0 + i, y0 - 2, C[2]); }
      for (let j = 0; j < h; j++) { P.set(x0 - 1, y0 + j, C[2]); P.set(x0 + w, y0 + j, C[5]); }
      if (kind !== 3) { const n = kind === 2 ? h : Math.floor(h * (.3 + hash(q, 7, sd) * .5)); for (let j = 0; j < n; j++) { P.set(x0 + 17, y0 + j, Fr[4]); P.set(x0 + 18, y0 + j, Fr[1]); } if (kind === 2) for (let i = 0; i < w; i++) { P.set(x0 + i, y0 + 13, Fr[4]); P.set(x0 + i, y0 + 14, Fr[1]); } }
      for (const sx of [x0 + 1, x0 + w - 2]) { const n = 5 + Math.floor(hash(sx, q, sd) * 12); for (let j = 3; j < n; j++) P.mul(sx, y0 + h + j, .84); }   // 窓台の下のよごれ
      if (kind === 3) { const fc = o.fc || ['#fff6e0', '#ffd86a', '#f6a8c8'], put = (x, y, c) => P.set(x, y, c);
        for (let k = 0; k < 34; k++) { const u = hash(k, 1, sd + q * 9), v = hash(k, 2, sd + q * 9), i = -2 + Math.floor(u * (w + 1)), hang = Math.sin(u * Math.PI) * .5 + .5, j = h - 9 + Math.floor((v * v * 2.2 - .8) * 9 * hang) + (k < 8 ? -8 - Math.floor(v * 8) : 0); leaf(put, x0 + i, y0 + j, G, k % 3, k % 4 === 0 ? 1 : 0); if (k % 7 === 2 && (o.flowers ?? 1)) { const c = fc[k % fc.length]; P.set(x0 + i + 1, y0 + j, c); P.set(x0 + i + 2, y0 + j, c); P.set(x0 + i + 1, y0 + j + 1, mix(c, '#a05060', .3)); } } } }
    return P; });

  // つた（抜き色つき。よこにくり返せる）。amount 0〜1, from: 'top'（上からたれる）/ 'bottom'（下からはい上がる）/ 'all', flowers 0〜1, fc, c
  def('ivy', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, G = ramp(o.c || IVY), St = ramp('#6a6a40'), amt = o.amount ?? .6, from = o.from || 'top', fc = o.fc || ['#fff6e0', '#f6a8c8', '#ffd86a'];
    const put = (x, y, c) => { if (y >= 0 && y < 64) P.set(x, y, c); }, vv = y => from === 'top' ? y / 63 : from === 'bottom' ? 1 - y / 63 : .3;
    const den = (x, y) => amt * 1.3 - vv(y) * 1.05 + (tn(x, y, 16, 16, 64, 64, sd) - .5) * .6 + (tn(x, 0, 8, 64, 64, 64, sd + 3) ** 2) * .55;
    for (let k = 0; k < 9; k++) { let x = Math.floor(hash(k, 1, sd) * 64), n = Math.floor((.3 + hash(k, 2, sd) * .7) * 58 * Math.min(1, amt * 1.5)); for (let j = 0; j < n; j++) { const y = from === 'bottom' ? 63 - j : j; put(x, y, St[j % 5 === 0 ? 4 : 2]); if (hash(k, j, sd + 1) > .8) x += hash(k, j, sd + 2) > .5 ? 1 : -1; if (j % 7 === 3 && j > n * .5) { put(x + 1, y, G[3]); put(x + 2, y, G[4]); put(x + 1, y + 1, G[1]); put(x + 2, y + 1, G[2]); } } }
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const d = den(x, y); if (d < .66) continue; const q = vor(x, y, 64, 11, sd + 20, 1, 2), t = 2 + Math.floor(hash(q.id, 1, sd) * 2.2); P.set(x, y, d < .69 ? G[1] : q.e < .8 ? G[1] : q.bx + q.by < -1.2 ? G[Math.min(5, t + 1)] : q.bx + q.by > 1.6 ? G[t - 1] : G[t]); }
    for (let j = -1; j < 14; j++) for (let i = 0; i < 13; i++) { const x = Math.floor(i * 4.92 + hash(i, j, sd + 4) * 4), y = Math.floor(j * 4.8 + hash(i, j, sd + 5) * 4), d = den(x, y), t = hash(i, j, sd + 6); if (d < .4 + t * .1) continue;
      if (d < .72) leaf(put, x, y, G, d < .5 ? 3 : Math.floor(t * 3), t > .6 ? 1 : 0);
      if (hash(i, j, sd + 7) < (o.flowers || 0) * .35) { const c = fc[Math.floor(t * 9) % fc.length]; put(x + 1, y, c); put(x + 2, y, c); put(x + 1, y + 1, c); put(x + 2, y + 1, mix(c, '#a05060', .35)); } }
    return P; }, true);

  // こけ（しきつめる。地面の layers・屋上・石の上に）。c, flowers 0〜1
  def('moss', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, G = ramp(o.c || '#6aa64e');
    P.each((x, y) => { const q = vor(x, y, 64, 8, sd, 1, 3), t = 2 + Math.floor(hash(q.id, 1, sd) * 1.6), n = tn(x, y, 4, 4, 64, 64, sd + 2); return q.e < 1 ? G[1] : q.e < 2 && q.bx + q.by > 0 ? G[t - 1] : q.bx + q.by < -2.5 && n > .35 ? G[t + 1] : n > .8 ? G[t + 1] : n < .16 ? G[t - 1] : G[t]; });
    for (let k = 0; k < 40; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64); P.set(x, y, G[5]); if (k % 3 === 0) { P.set(x + 1, y, G[4]); P.set(x, y + 1, G[1]); } }
    const fc = o.fc || ['#ffffff', '#ffe27a', '#c8b8f0']; for (let k = 0; k < Math.round((o.flowers ?? .15) * 40); k++) { const x = Math.floor(hash(k, 3, sd) * 64), y = Math.floor(hash(k, 4, sd) * 64), c = fc[k % fc.length]; P.set(x, y, c); P.set(x + 1, y, mix(c, G[3], .3)); P.set(x, y + 1, G[0]); }
    return P; });

  // がれき（しきつめる）。c, brick 0〜1（れんがのかけら）, grass 0〜1（すき間の草）, rebar（鉄筋）
  def('rubble', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, C = ramp(o.c || '#b0aca0', 6, { contrast: .85 }), B = ramp('#b8684a'), G = ramp(GREEN), Ru = ramp(RUST), cs = 64 / 7;
    const cell = (x, y) => vor(x, y, 64, 7, sd, .9);
    P.each((x, y) => { const q = cell(x, y), r = hash(q.id, 1, sd), gr = r < (o.grass ?? .1), R2 = r > 1 - (o.brick ?? .1) ? B : C, t = 2 + Math.floor(hash(q.id, 2, sd) * 3);
      if (q.e < 1.1) return gr || hash(x >> 1, y >> 1, sd + 3) < (o.grass ?? .1) * 1.6 ? G[2] : C[0]; if (gr) return tn(x, y, 4, 4, 64, 64, sd + 8) > .6 ? G[4] : (x + y * 2) % 5 === 0 ? G[2] : G[3];
      return q.e < 2.3 ? (q.bx + q.by < 0 ? R2[Math.min(5, t + 1)] : R2[t - 1]) : hash(x, y, sd + 4) > .93 ? R2[t - 1] : R2[t]; });
    if (o.rebar ?? 1) for (let k = 0; k < 3; k++) { const x = Math.floor(hash(k, 5, sd) * 64), y = Math.floor(hash(k, 6, sd) * 64), dx = hash(k, 7, sd) > .5 ? 1 : -1; for (let i = 0; i < 9; i++) { P.set(x + i * dx, y + (i >> 1), Ru[i % 4 === 0 ? 4 : 2]); P.set(x + i * dx, y + (i >> 1) + 1, C[0]); } }
    return P; });

  // ひびわれたアスファルト（64 ドット＝4 m）。c, crack 0〜1, grass 0〜1（われ目の草）, line: 'none'/'center'/'edge'/'both'（1 枚が道はばのとき用。白線はかすれる）, patch（つぎはぎ）
  def('asphalt', 4, (o = {}) => { const P = Px(64), sd = o.seed || 0, A0 = ramp(o.c || '#74747c', 6, { contrast: .8 }), A = [A0[1], A0[2], mix(A0[2], A0[3], .5), A0[3], mix(A0[3], A0[4], .45), A0[4]], G = ramp(GREEN), gr = o.grass ?? .5, cr = o.crack ?? .55, L = o.lineC || '#e6e2d2', Y = o.centerC || '#e2bc50', cs = 64 / 3;
    P.each((x, y) => { const n = tn(x, y, 16, 16, 64, 64, sd), h2 = hash(x >> 1, y >> 1, sd), h1 = hash(x, y, sd + 2); return h2 > .962 ? A[5] : h1 > .95 ? A[2] : n > .64 ? A[2] : n < .3 ? A[4] : A[3]; });
    if (o.patch ?? 1) for (let i = 0; i < 14; i++) for (let j = 0; j < 9; j++) P.set(40 + i, 6 + j, (i === 0 || j === 0) ? A[5] : (i === 13 || j === 8) ? A[0] : ((i + j) % 5 ? A[1] : A[2]));
    const worn = (x, y, c) => { const n = tn(x, y, 8, 8, 64, 64, sd + 31); if (n < .72) P.set(x, y, n > .6 ? mix(c, A[3], .45) : c); }, ln = o.line || 'none';
    if (ln === 'edge' || ln === 'both') for (let y = 0; y < 64; y++) for (const x of [4, 5, 58, 59]) worn(x, y, L);
    if (ln === 'center' || ln === 'both') for (let y = 6; y < 40; y++) for (const x of [31, 32]) worn(x, y, Y);
    const edge = (x, y) => { let b1 = 1e9, b2 = 1e9; const gx = Math.floor(x / cs), gy = Math.floor(y / cs); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const wx = ((gx + i) % 3 + 3) % 3, wy = ((gy + j) % 3 + 3) % 3, d = Math.hypot(x + .5 - (gx + i + .5 + (hash(wx, wy, sd + 11) - .5)) * cs, y + .5 - (gy + j + .5 + (hash(wx, wy, sd + 12) - .5)) * cs) + tn(x, y, 4, 4, 64, 64, sd + 13) * 2.4; if (d < b1) { b2 = b1; b1 = d; } else if (d < b2) b2 = d; } return b2 - b1; };
    P.each((x, y) => { const e = edge(x, y), on = tn(x, y, 16, 16, 64, 64, sd + 14) < cr, g = tn(x, y, 8, 8, 64, 64, sd + 15) < gr * 1.1; if (!on) return;
      if (e < .9) return g ? G[hash(x, y, sd) > .5 ? 4 : 3] : A[0]; if (e < 2.2 && g) return hash(x, y, sd + 16) > .45 ? ((x + y) & 1 ? G[3] : G[2]) : undefined; if (e < 1.8 && !g && edge(x - 1, y - 1) < .9) return A[5]; });
    if (gr > .3) for (let k = 0; k < Math.round(gr * 8); k++) { const x = Math.floor(hash(k, 17, sd) * 64), y = Math.floor(hash(k, 18, sd) * 64); if (edge(x, y) < 3) P.bits(x - 2, y - 2, ['.l.l.', 'l.m.l', '.mmm.', '.ddd.'], { l: G[5], m: G[4], d: G[1] }); }
    return P; });

  // 路面の白線（抜き色つき。かすれている。P.decal ではる）。kind: 'zebra'（横断歩道。よこにくり返す）/ 'line' / 'dash' / 'stop' / 'arrow' / 'diamond'。c, worn 0〜1
  def('marking', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, c = o.c || '#ece8d8', c2 = mix(c, '#8a8a90', .35), kind = o.kind || 'zebra', wn = o.worn ?? .5;
    const on = (x, y) => kind === 'zebra' ? (x % 16) < 9 && y > 3 && y < 60 : kind === 'line' ? x > 28 && x < 35 : kind === 'dash' ? x > 28 && x < 35 && y % 64 < 40 : kind === 'stop' ? y > 22 && y < 38 : kind === 'diamond' ? Math.abs(Math.abs(x - 32) + Math.abs(y - 32) * .5 - 13) < 2.6 : (Math.abs(x - 32) < 4 && y > 26 && y < 60) || (y <= 26 && y > 5 && Math.abs(x - 32) < (y - 5) * .62);
    P.each((x, y) => { if (!on(x, y)) return null; const n = tn(x, y, 8, 8, 64, 64, sd) * .6 + tn(x, y, 4, 4, 64, 64, sd + 1) * .4, e = !on(x, y - 1) || !on(x - 1, y); if (n < wn * .62) return null; return n < wn * .62 + .07 ? ((x + y) & 1 ? c2 : null) : e ? '#ffffff' : n > .7 ? c2 : c; });
    for (let k = 0; k < 3; k++) { let x = Math.floor(hash(k, 3, sd) * 64), y = 0; for (let j = 0; j < 64; j++) { P.set(x, y + j, null); if (hash(k, j, sd) > .6) x += hash(k, j, sd + 1) > .5 ? 1 : -1; } }
    return P; }, true);

  // 線路（しきつめる。64 ドット＝3 m。レールは v（たて）の向きに走る：R.strip なら進む向き、R.ground なら z の向き）。grass 0〜1, rust
  def('rail', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, S = ramp(o.c || '#9a9288', 6, { contrast: .9 }), W = ramp('#6e5038'), I = ramp('#8a8e98'), Ru = ramp(RUST), G = ramp(GREEN), gr = o.grass ?? .5;
    P.each((x, y) => { const cx = Math.floor(x / 4), cy = Math.floor(y / 4), jx = hash(cx, cy, sd) * 2, jy = hash(cx, cy, sd + 1) * 2, dx = (x % 4) - 1 - jx, dy = (y % 4) - 1 - jy, t = 2 + Math.floor(hash(cx, cy, sd + 2) * 1.7); return dx * dx + dy * dy > 3.6 ? S[1] : dx + dy < -1 ? S[t + 1] : S[t]; });
    for (let y0 = 3; y0 < 64; y0 += 16) for (let x = 9; x < 55; x++) for (let j = 0; j < 7; j++) { const g2 = hash(x >> 2, y0, sd + 3); P.set(x, y0 + j, j === 0 ? W[4] : j === 6 ? W[0] : (x === 9 ? W[4] : x === 54 ? W[1] : (j + (g2 > .5 ? 1 : 0)) % 3 === 0 ? W[2] : W[3])); if (j === 6) P.mul(x, y0 + 7, .7); }
    for (const x0 of [18, 43]) for (let y = 0; y < 64; y++) { P.set(x0 - 1, y, Ru[1]); P.set(x0, y, Ru[3]); P.set(x0 + 1, y, hash(y >> 2, x0, sd) > .7 ? Ru[4] : I[5]); P.set(x0 + 2, y, I[3]); P.set(x0 + 3, y, Ru[2]); P.mul(x0 + 4, y, .7); if (y % 16 === 6) { P.set(x0 - 2, y, I[1]); P.set(x0 + 5, y, I[1]); P.set(x0 - 2, y - 1, I[4]); P.set(x0 + 5, y - 1, I[4]); } }
    for (let k = 0; k < Math.round(gr * 26); k++) { const x = Math.floor(hash(k, 5, sd) * 64), y = Math.floor(hash(k, 6, sd) * 64); if (Math.abs(x - 19) < 4 || Math.abs(x - 44) < 4) continue; P.bits(x - 2, y - 2, k % 3 ? ['.l.l.', 'l.m.l', '.mmm.', '.ddd.'] : ['.l.', 'lml', '.d.'], { l: G[5], m: G[4], d: G[1] }); }
    return P; });

  // 水たまり（抜き色つき。空が映る。P.decal ではる）。c（空の色）
  def('puddle', 3, (o = {}) => { const P = Px(48, 32), sd = o.seed || 0, W = ramp(o.c || '#8fc4e4', 6, { warm: .5 }); P.clip = true;
    P.each((x, y) => { const a = Math.atan2(y - 16, (x - 24) * .66), r = Math.hypot((x - 24) * .66, y - 16), rr = 10.5 + Math.sin(a * 3 + sd) * 2.4 + Math.sin(a * 5 + sd * 2) * 1.6 + Math.sin(a * 9 + sd) * .7; if (r > rr) return r < rr + 2 && ((x + y) & 1 || r < rr + 1) ? '#56565f' : null; const v = y / 32, n = tn(x, y, 16, 4, 48, 32, sd); return r > rr - 1.2 ? W[1] : (y === 11 && x > 20 && x < 29) || (y === 19 && x > 14 && x < 20) ? '#ffffff' : n > .7 ? W[5] : v < .45 ? W[4] : v < .7 ? W[3] : ((x + y) & 1 ? W[3] : W[2]); });
    return P; }, true);

  // 古代の石（彫りのあと）。kind: 'block'（大きな切り石）/ 'carve'（うずと日輪の帯を彫った石）/ 'flute'（柱のたてみぞ）。c, moss
  def('ancient', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, base = o.c || '#cdbf9c', C = ramp(base, 6, { contrast: .85 }), kind = o.kind || 'block';
    if (kind === 'flute') { P.each((x, y) => { const k = x & 7, n = tn(x, y, 16, 16, 64, 64, sd); return C[[1, 2, 3, 3, 4, 5, 4, 2][k] - (n < .3 && k > 1 && k < 6 ? 1 : 0)]; }); for (const y of [0, 32]) for (let x = 0; x < 64; x++) { P.set(x, y, C[0]); P.set(x, y + 1, C[5]); if (hash(x >> 2, y, sd) > .6) P.set(x, y - 1, C[1]); } }
    else { for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) { const x0 = k * 32 + (r & 1) * 16, y0 = r * 16, t = 2 + Math.floor(hash(k, r, sd) * 2.4); P.block(x0, y0, 32, 16, C, t, { hi: 2, lo: 2 }); for (let j = 2; j < 14; j++) for (let i = 2; i < 30; i++) { const n = tn(x0 + i, y0 + j, 8, 8, 64, 64, sd + 2); if (n > .68) P.set(x0 + i, y0 + j, C[t + 1]); else if (n < .26) P.set(x0 + i, y0 + j, C[t - 1]); } if (hash(k, r, sd + 5) > .55) { const cx = x0 + (hash(k, r, sd + 6) > .5 ? 0 : 29); P.bits(cx, y0 + 12, ['kk.', 'kkk', 'dkk'], { k: C[0], d: C[1] }); } } }
    if (kind === 'carve') { const dk = C[1], hi = C[5], cut = (x, y) => { P.set(x, y, dk); P.set(x + 1, y + 1, hi); };
      for (let x = 0; x < 64; x++) { for (const y of [18, 45]) { P.set(x, y, dk); P.set(x, y + 1, hi); } for (let y = 20; y < 45; y++) P.set(x, y, tone(C, 3 + (tn(x, y, 8, 8, 64, 64, sd + 7) > .6 ? 1 : 0))); }
      for (const cx of [16, 48]) { for (let a = 0; a < 44; a++) { const th = a * .32, r = 1 + a * .22; cut(Math.round(cx + Math.cos(th) * r), Math.round(32 + Math.sin(th) * r)); } }   // うず
      for (let a = 0; a < 16; a++) { const th = a / 16 * TAU; cut(Math.round(32 + Math.cos(th) * 4), Math.round(32 + Math.sin(th) * 4)); if (a % 2 === 0) { cut(Math.round(32 + Math.cos(th) * 7), Math.round(32 + Math.sin(th) * 7)); cut(Math.round(32 + Math.cos(th) * 8.4), Math.round(32 + Math.sin(th) * 8.4)); } }   // 日輪
      for (const cx of [0, 63]) for (let j = 0; j < 9; j++) { cut(cx === 0 ? 0 : 62, 23 + j * 2); } for (let x = 2; x < 64; x += 6) { cut(x, 21); cut(x + 1, 21); cut(x + 2, 22); cut(x, 43); cut(x + 1, 42); cut(x + 2, 42); } }
    let cx2 = 9 + Math.floor(hash(1, 2, sd) * 40), cy2 = 0; [cx2, cy2] = crackLine(P, cx2, cy2, 26, 0, sd + 3, C[0], C[5]);
    mossOver(P, o.moss ?? .3, o.mossC, sd, (x, y) => kind === 'flute' ? ((y % 32) < 4 ? .12 : 0) + (y / 64 - .5) * .2 : ((y % 16) < 3 ? .14 : 0)); return P; });

  // 鉄骨の組み（抜き色つき。たてにくり返す）。kind: 'x'（ばってんの組み。左右に柱）/ 'ladder'（はしご）/ 'grid' / 'beam'（太い はり。遠くでも見える）。c, paint（残ったペンキ）
  def('truss', 1.5, (o = {}) => { const P = Px(32), sd = o.seed || 0, kind = o.kind || 'x', Rr = ramp(o.c || '#9a5a3c'), Pn = o.paint ? ramp(o.paint) : null; P.fill(null);
    const pt = (x, y, t) => { if (x < 0 || x > 31) return; const pk = Pn && tn(x, y, 8, 8, 32, 32, sd) > .45; P.set(x, y, pk ? Pn[t] : Rr[t]); };
    if (kind === 'ladder') { for (let y = 0; y < 32; y++) for (const x of [9, 21]) { pt(x, y, 4); pt(x + 1, y, 2); } for (let y = 3; y < 32; y += 8) for (let x = 11; x < 21; x++) { pt(x, y, 5); pt(x, y + 1, 1); } return P; }
    if (kind === 'beam') { for (let y = 0; y < 32; y++) { for (const x0 of [0, 26]) [4, 4, 3, 3, 3, 1].forEach((t, i) => pt(x0 + i, y, t)); const xd = Math.round(y < 16 ? 6 + y * 17 / 15 : 23 - (y - 16) * 17 / 15); [5, 4, 3, 1].forEach((t, i) => pt(xd + i, y, t)); if (y % 16 < 2) for (let x = 6; x < 26; x++) pt(x, y, y % 16 ? 2 : 5); } return P; }
    for (let y = 0; y < 32; y++) { for (const x of [0, 28]) { pt(x, y, 4); pt(x + 1, y, 3); pt(x + 2, y, 3); pt(x + 3, y, 1); } }
    for (let i = 0; i < 32; i++) { const x = 3 + Math.round(i * 25 / 31); for (const [yy, t] of [[i, 4], [i + 1, 3], [i + 2, 2]]) { if (x > 3 && x < 28) { pt(x, yy % 32, t); pt(31 - x, yy % 32, t === 4 ? 3 : 1); } } }
    for (const y of [0, 16]) if (kind === 'grid' || y === 0) for (let x = 4; x < 28; x++) { pt(x, y, 5); pt(x, y + 1, 3); pt(x, y + 2, 1); }
    for (const [x, y] of [[1, 2], [29, 2], [1, 18], [29, 18]]) pt(x, y, 0);
    return P; }, true);

  // さびた金あみ（抜き色つき。やぶれた穴がある）。c, holes 0〜1
  def('chain', 2, (o = {}) => { const P = Px(64, 32), sd = o.seed || 0, I = ramp(o.c || '#8f9a94'), Ru = ramp(RUST); P.clip = true;
    P.each((x, y) => { const hole = tn(x, y, 16, 16, 64, 32, sd) > 1 - (o.holes ?? .3) * .6 && y > 3 && y < 29; if (y < 2) return y ? I[2] : I[5]; if (y > 29) return I[y === 30 ? 4 : 1]; if (hole) return null; const a = (x + y) % 5 === 0, b = (x - y + 64) % 5 === 0, ru = tn(x, y, 8, 8, 64, 32, sd + 2) > .55; return a ? (ru ? Ru[3] : I[4]) : b ? (ru ? Ru[2] : I[2]) : null; });
    return P; }, true);

  // くずれた上ば（抜き色つき。64×32 ＝ 3 m × 1.5 m。ぎざぎざのコンクリートから鉄筋がのびる。かべやビルの欠けた上にのせる）
  def('jag', 3, (o = {}) => { const P = Px(64, 32), sd = o.seed || 0, C = ramp(o.c || CONC, 6, { contrast: .8 }), Ru = ramp(RUST); P.clip = true;
    const top = x => Math.round(27 - (tn(x, 0, 8, 32, 64, 32, sd) * 15 + tn(x, 0, 4, 32, 64, 32, sd + 1) * 7 + (hash(x >> 2, 3, sd) > .7 ? 3 : 0)));
    for (let k = 0; k < 6; k++) { let x = 4 + k * 10 + Math.floor(hash(k, 1, sd) * 5), y = top(x) + 2, n = 6 + Math.floor(hash(k, 2, sd) * 14), bend = hash(k, 3, sd) > .55 ? (hash(k, 4, sd) > .5 ? 1 : -1) : 0; for (let j = 0; j < n && y > 0; j++) { P.set(x, y, Ru[j % 4 === 1 ? 4 : 3]); P.set(x + 1, y, Ru[1]); if (bend && j > n * .5) { x += bend; if (j % 2) y--; } else y--; } }
    for (let x = 0; x < 64; x++) { const t = top(x); for (let y = t; y < 32; y++) { const n = tn(x, y, 8, 8, 64, 32, sd + 5); P.set(x, y, y === t ? C[5] : y === t + 1 ? C[4] : n > .65 ? C[4] : n < .3 ? C[2] : C[3]); } if (top(x - 1) < t - 1) for (let y = t; y < Math.min(32, t + 5); y++) P.set(x, y, C[1]); }
    return P; }, true);

  // 看板の絵（字ではない模様。64×32 ＝ 2 m × 1 m）。kind: 'sun' / 'stripe' / 'wave' / 'arrow' / 'dots' / 'leaf'。c, c2, peel 0〜1
  def('panel', 2, (o = {}) => { const P = Px(64, 32), sd = o.seed || 0, kind = o.kind || 'sun', A = ramp(o.c || '#e6d9b4', 6, { contrast: .7 }), B = ramp(o.c2 || '#d86a4a'), Ru = ramp(RUST), peel = o.peel ?? .4; P.clip = true;
    const on = (x, y) => kind === 'stripe' ? ((x + y) >> 3) % 2 === 0 : kind === 'wave' ? ((y + Math.round(Math.sin(x / 64 * TAU * 2) * 3) + 32) % 10) < 4 : kind === 'dots' ? Math.hypot((x % 16) - 8, (y % 16) - 8) < 4.5 : kind === 'arrow' ? (Math.abs(y - 16) < 4 && x > 10 && x < 40) || (x >= 40 && x < 54 && Math.abs(y - 16) < (54 - x) * .8) : kind === 'leaf' ? Math.hypot((x - 32) * .5, y - 16) < 9 && Math.abs(y - 16) > .6 && Math.abs((x - 32) * .5 - (y - 16) * 0) > 0 : (Math.hypot(x - 32, y - 18) < 8 || (Math.hypot(x - 32, y - 18) < 15 && Math.hypot(x - 32, y - 18) > 10 && Math.floor((Math.atan2(y - 18, x - 32) + Math.PI) / TAU * 12) % 2 === 0));
    P.each((x, y) => { if (x < 2 || y < 2 || x > 61 || y > 29) return (x === 0 || y === 0) ? Ru[4] : (x === 63 || y === 31) ? Ru[1] : Ru[2]; const pl = tn(x, y, 16, 16, 64, 32, sd) * .6 + tn(x, y, 8, 8, 64, 32, sd + 1) * .4 < peel * .7; if (pl) return tn(x, y, 4, 4, 64, 32, sd + 2) > .5 ? Ru[3] : Ru[2]; const o1 = on(x, y), S = o1 ? B : A, n = tn(x, y, 8, 16, 64, 32, sd + 3); return o1 && !on(x, y - 1) ? S[4] : n > .7 ? S[4] : n < .2 ? S[2] : S[3]; });
    for (let k = 0; k < 5; k++) { const x = 4 + Math.floor(hash(k, 4, sd) * 56), n = 5 + Math.floor(hash(k, 5, sd) * 14); for (let j = 2; j < n; j++) if (j < n * .6 || j & 1) P.mul(x, j, .8); }
    return P; });

  // 色あせた しまの布（屋根・ひさし。やぶれは抜き色）。c, c2, torn 0〜1
  def('stripes', 2, (o = {}) => { const P = Px(64, 32), sd = o.seed || 0, A = ramp(o.c || '#e0705a', 6, { contrast: .75 }), B = ramp(o.c2 || '#f0e8d0', 6, { contrast: .6 }), G = ramp(GREEN);
    P.each((x, y) => { if (y > 6 && tn(x, y, 16, 8, 64, 32, sd) + (y / 32) * .25 > 1.12 - (o.torn ?? .3) * .5) return null; const S = (x >> 3) % 2 ? B : A, n = tn(x, y, 8, 8, 64, 32, sd + 1), k = x & 7; if (y > 27 && tn(x, y, 8, 8, 64, 32, sd + 4) > .5) return G[y > 29 ? 2 : 3]; return k === 0 ? S[4] : k === 7 ? S[2] : y < 2 ? S[2] : n > .72 ? S[4] : n < .22 ? S[2] : S[3]; });
    return P; }, true);

  // 自動販売機の正面（32×64 ＝ 1 m × 2 m）。c
  def('vend', 1, (o = {}) => { const P = Px(32, 64), sd = o.seed || 0, C = ramp(o.c || '#d8dccf', 6, { contrast: .75 }), In = ['#3a4254', '#566078', '#7c88a0'], Ru = ramp(RUST), G = ramp(GREEN), cs = ['#e2604a', '#f2b23a', '#6ab0d8', '#8ac86a', '#f4f0e0', '#c88ad0']; P.clip = true;
    P.block(0, 0, 32, 64, C, 3, { hi: 2, lo: 2 }); for (let y = 3; y < 33; y++) for (let x = 3; x < 29; x++) P.set(x, y, y === 3 || x === 3 ? In[0] : (x + y) % 19 === 4 ? In[2] : In[1]);
    for (let r = 0; r < 3; r++) { for (let x = 4; x < 28; x++) { P.set(x, 12 + r * 10, C[4]); P.set(x, 13 + r * 10, C[1]); } for (let k = 0; k < 6; k++) { if (hash(k, r, sd) < .25) continue; const c = cs[Math.floor(hash(k, r, sd + 1) * cs.length)], x = 5 + k * 4, y = 5 + r * 10; P.set(x + 1, y, mix(c, '#ffffff', .5)); for (let j = 1; j < 7; j++) { P.set(x, y + j, c); P.set(x + 1, y + j, mix(c, '#ffffff', .3)); P.set(x + 2, y + j, mix(c, '#30304a', .3)); } P.set(x + 1, y + 3, '#f4f0e0'); } }
    for (let k = 0; k < 6; k++) { P.set(5 + k * 4, 35, '#e8c85a'); P.set(6 + k * 4, 35, '#a8843a'); } for (let y = 39; y < 47; y++) for (let x = 20; x < 28; x++) P.set(x, y, y === 39 || x === 20 ? C[1] : C[2]); P.rect(22, 41, 4, 1, In[0]); P.rect(23, 44, 2, 2, In[0]);
    for (let y = 50; y < 58; y++) for (let x = 5; x < 27; x++) P.set(x, y, y === 50 ? In[0] : y === 57 ? C[5] : In[1]);
    P.each((x, y, c) => { const n = tn(x, y, 8, 8, 32, 64, sd + 3) + (y / 64) * .34 + (x < 3 || x > 28 ? .12 : 0); return n > 1.05 ? Ru[tn(x, y, 4, 4, 32, 64, sd + 4) > .5 ? 3 : 2] : n > 1 ? Ru[1] : undefined; });
    for (let x = 0; x < 32; x++) { const h = Math.floor(tn(x, 0, 4, 64, 32, 64, sd + 6) * 7 * (o.moss ?? 1)); for (let j = 0; j < h; j++) P.set(x, 63 - j, G[j === h - 1 ? 4 : (x + j) % 3 ? 3 : 2]); }
    return P; });

  // 信号機の箱（48×16。消えた 3 つのあかり）
  def('signal', 1.2, (o = {}) => { const P = Px(48, 16), sd = o.seed || 0, C = ramp(o.c || '#7c8a84'), Ru = ramp(RUST), L = ['#5aa890', '#c8a850', '#c06a5a']; P.clip = true; P.block(0, 0, 48, 16, C, 2, { hi: 2, lo: 1 });
    for (let k = 0; k < 3; k++) { const cx = 8 + k * 16; P.disc(cx, 8, 6.4, C[0]); P.disc(cx, 8.4, 5.2, mix(L[k], '#3a3a48', .35)); P.disc(cx - .8, 7.2, 3, L[k]); P.set(cx - 2, 6, mix(L[k], '#ffffff', .6)); P.set(cx - 3, 7, mix(L[k], '#ffffff', .4)); for (let i = -6; i <= 6; i++) P.set(cx + i, 1, C[5]); }
    P.each((x, y) => tn(x, y, 8, 8, 48, 16, sd) > .74 && Math.hypot((x % 16) - 8, y - 8) > 5 ? Ru[2 + ((x + y) & 1)] : undefined); return P; });

  // バス・電車のよこ（64 ドット＝3 m。よこにくり返す）と 前（64×64）。kind: 'bus'/'train', c, c2（帯）
  def('coachSide', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, C = ramp(o.c || '#e4dcc0', 6, { contrast: .75 }), B = ramp(o.c2 || '#4f9a8a'), In = ['#2c3242', '#3e485c', '#56627a'], Gl = ramp('#8ab4c8', 6, { warm: .5 }), Ru = ramp(RUST), G = ramp(GREEN), train = o.kind === 'train'; P.clip = true;
    P.each((x, y) => { const n = tn(x, y, 8, 16, 64, 64, sd); return y < 3 ? C[5] : y < 6 ? C[2] : y >= 58 ? In[y === 58 ? 0 : 1] : y >= 33 && y < 39 ? B[n > .6 ? 4 : 3] : y === 39 ? B[1] : n > .72 ? C[4] : n < .2 ? C[2] : C[3]; });
    for (let k = 0; k < 2; k++) { const x0 = 3 + k * 32, w = 26, y0 = 9, h = 21, broken = hash(k, 1, sd) < .6; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let c = j < 2 || i < 2 ? In[0] : i + j > 30 ? In[2] : In[1]; if (!broken) { const b = (i + j) % 17; c = b === 6 || b === 7 ? Gl[4] : j > h * .65 && ((i + j) & 1) ? mix(Gl[2], C[3], .5) : Gl[2]; } else if (i + j < 10 + hash(i >> 2, k, sd) * 5 || (w - i) + (h - j) < 9) c = (i + j) % 6 === 0 ? Gl[5] : Gl[3]; P.set(x0 + i, y0 + j, c); }
      for (let i = -1; i <= w; i++) { P.set(x0 + i, y0 - 1, C[1]); P.set(x0 + i, y0 + h, C[5]); } for (let j = 0; j < h; j++) { P.set(x0 - 1, y0 + j, C[1]); P.set(x0 + w, y0 + j, C[5]); } }
    if (train) for (let y = 7; y < 58; y++) { P.set(31, y, C[1]); P.set(32, y, C[5]); P.set(0, y, C[1]); P.set(63, y, C[4]); }
    for (let x = 0; x < 64; x += 8) { P.set(x + 3, 44, C[1]); P.set(x + 4, 45, C[5]); }
    P.each((x, y) => { if (y < 8 || (y > 8 && y < 31 && (x % 32) > 2 && (x % 32) < 29)) return; const n = tn(x, y, 8, 8, 64, 64, sd + 3) + (y / 64) * .34 + (tn(x, 0, 4, 64, 64, 64, sd + 7) > .7 ? .1 : 0); return n > 1.02 ? Ru[tn(x, y, 4, 4, 64, 64, sd + 4) > .5 ? 3 : 2] : n > .97 ? Ru[1] : undefined; });
    for (let x = 0; x < 64; x++) { const h = Math.floor(tn(x, 0, 8, 64, 64, 64, sd + 6) * 11 * (o.moss ?? 1)); for (let j = 0; j < h; j++) P.set(x, 63 - j, G[j === h - 1 ? 5 : (x + j) % 3 ? 3 : 2]); }
    return P; });
  def('coachEnd', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, C = ramp(o.c || '#e4dcc0', 6, { contrast: .75 }), B = ramp(o.c2 || '#4f9a8a'), In = ['#2c3242', '#3e485c', '#56627a'], Gl = ramp('#8ab4c8', 6, { warm: .5 }), Ru = ramp(RUST), G = ramp(GREEN), train = o.kind === 'train'; P.clip = true;
    P.each((x, y) => { const n = tn(x, y, 8, 16, 64, 64, sd); return y < 3 ? C[5] : y >= 58 ? In[1] : y >= 36 && y < 42 ? B[n > .6 ? 4 : 3] : n > .72 ? C[4] : n < .2 ? C[2] : C[3]; });
    const win = (x0, w, y0, h, br) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const b = (i + j) % 19; let c = br ? (j < 2 || i < 2 ? In[0] : In[1]) : b === 6 || b === 7 ? Gl[4] : j > h * .7 && ((i + j) & 1) ? mix(Gl[2], C[3], .5) : Gl[2]; if (br && (i + j < 9 || (w - i) + (h - j) < 8)) c = Gl[3]; P.set(x0 + i, y0 + j, c); } for (let i = -1; i <= w; i++) { P.set(x0 + i, y0 - 1, C[1]); P.set(x0 + i, y0 + h, C[5]); } for (let j = 0; j < h; j++) { P.set(x0 - 1, y0 + j, C[1]); P.set(x0 + w, y0 + j, C[5]); } };
    if (train) { win(5, 20, 10, 20, 0); win(39, 20, 10, 20, 1); for (let y = 8; y < 56; y++) { P.set(27, y, C[1]); P.set(36, y, C[5]); } win(29, 6, 12, 14, 0); } else { win(5, 54, 9, 22, hash(1, 2, sd) > .5); for (let i = 16; i < 48; i++) { P.set(i, 4, C[2]); P.set(i, 5, '#f0e8c8'); P.set(i, 6, C[1]); } }
    for (const cx of [10, 53]) { P.disc(cx, 48, 4.5, C[1]); P.disc(cx, 48, 3.5, '#f4e8b0'); P.disc(cx - .6, 47.4, 1.6, '#ffffff'); } for (let x = 2; x < 62; x++) { P.set(x, 54, '#8a8e98'); P.set(x, 55, '#c8ccd0'); P.set(x, 56, '#5a5e68'); }
    for (let i = 24; i < 40; i++) for (let j = 45; j < 52; j++) P.set(i, j, j % 2 ? In[1] : In[2]);
    P.each((x, y) => { const n = tn(x, y, 8, 8, 64, 64, sd + 3) + (y / 64) * .4; return y > 32 && n > 1.04 ? Ru[tn(x, y, 4, 4, 64, 64, sd + 4) > .5 ? 3 : 2] : undefined; });
    for (let x = 0; x < 64; x++) { const h = Math.floor(tn(x, 0, 8, 64, 64, 64, sd + 6) * 9 * (o.moss ?? 1)); for (let j = 0; j < h; j++) P.set(x, 63 - j, G[j === h - 1 ? 5 : (x + j) % 3 ? 3 : 2]); }
    return P; });

  // ゴンドラ（観覧車のかご）の 1 面（32×32。下が色の板、まん中が窓、上が屋根）。c
  def('gondola', 1, (o = {}) => { const P = Px(32), sd = o.seed || 0, C = ramp(o.c || '#e2705a', 6, { contrast: .8 }), W = ramp('#ece4d0', 6, { contrast: .6 }), In = ['#3a4254', '#566078', '#7c88a0'], Ru = ramp(RUST);
    P.each((x, y) => { const n = tn(x, y, 8, 8, 32, 32, sd); if (y < 5) return C[y === 0 ? 5 : y === 4 ? 1 : 4]; if (y < 17) { if (x < 3 || x > 28) return W[x === 2 || x === 28 ? 2 : 4]; if (y === 5 || y === 16) return W[y === 5 ? 2 : 5]; return y === 6 || x === 3 ? In[0] : (x + y) % 13 === 3 ? In[2] : In[1]; } if (y === 17) return C[5]; if (y > 29) return C[1]; return n + (y / 32) * .4 > 1.02 ? Ru[2 + ((x + y) & 1)] : (x === 0 ? C[5] : x === 31 ? C[2] : n > .7 ? C[4] : C[3]); });
    for (let x = 6; x < 26; x++) { P.set(x, 22, W[4]); P.set(x, 23, W[4]); P.set(x, 24, C[2]); } return P; });

  // 工場のガラス窓（抜き色つき。ます目のわくに、残ったガラスと ぬけた所）。holes 0〜1
  def('panes', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, F = ramp(o.c || '#6f7a78'), Gl = ramp(o.glass || '#a8d0dc', 6, { warm: .5 }), Ru = ramp(RUST);
    P.each((x, y) => { const cx = x >> 4, cy = y >> 4, i = x & 15, j = y & 15, fr = i === 0 || j === 0 || i === 15 || j === 15; if (fr) return tn(x, y, 8, 8, 64, 64, sd) > .6 ? Ru[2 + (i === 0 || j === 0 ? 2 : 0)] : F[i === 0 || j === 0 ? 4 : 1]; const r = hash(cx, cy, sd); if (r < (o.holes ?? .5)) return (r < (o.holes ?? .5) * .5 && (i + j < 9 || i - j > 6)) ? Gl[(i + j) % 5 === 0 ? 5 : 4] : null; return (i + j) % 11 === 3 ? Gl[5] : j > 10 && ((i + j) & 1) ? Gl[2] : Gl[3]; });
    return P; }, true);

  // 動物の 1 枚絵（64×32。胴・頭・首・耳・足・尾）。kind: 'deer'/'dog'/'horse'
  def('beast', 1, (o = {}) => { const P = Px(64, 32), kind = o.kind || 'deer', C = ramp(o.c || (kind === 'dog' ? '#d8964a' : kind === 'horse' ? '#efe6d6' : '#c88a54'), 6, { contrast: .8 }), W = ramp(o.belly || '#f6ecd8', 6, { contrast: .6 }), dk = '#3a2c2c', acc = ramp(o.c2 || '#d8584a'), horse = kind === 'horse'; P.clip = true;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const a = Math.abs(x - 16); let c = a < 4 ? W[4] : a < 6 ? ((x + y) & 1 ? W[4] : C[4]) : a > 14 ? C[2] : a > 11 ? C[3] : ((y + x) % 9 === 0 ? C[4] : C[3]);
      if (kind === 'deer' && a > 6 && a < 14 && o.spots !== false && hash(x >> 1, y >> 1, 5) > .8) c = W[5]; if (kind === 'deer' && y > 26 && a > 9) c = W[5]; if (kind === 'dog' && y < 5 && a < 9) c = W[4];
      if (horse) { c = a > 14 ? W[2] : (x * 3 + y) % 11 === 0 ? W[3] : W[4]; if (y > 9 && y < 21 && a > 4) c = y === 10 || y === 20 ? '#f2d06a' : a > 12 && y > 12 && y < 18 ? acc[4] : acc[3]; if (y > 4 && y < 8) c = '#f2d06a'; } P.set(x, y, c); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const a = Math.abs(x - 8); let c = a < 3 ? W[4] : a > 6 ? C[2] : C[3]; if (horse) c = a > 6 ? acc[3] : W[4]; if (y < 5) c = a < 5 ? W[5] : (horse ? W[4] : C[4]); if (kind === 'dog' && y < 8 && a < 6) c = W[5]; if (y < 2 && a < (kind === 'dog' ? 4 : 6)) c = dk; if (y === 2 && a < 2 && kind === 'dog') c = dk; P.set(32 + x, y, c); }
    for (const ex of [35, 43]) { P.set(ex, 7, dk); P.set(ex + 1, 7, dk); P.set(ex, 8, dk); P.set(ex + 1, 8, dk); P.set(ex, 7, '#ffffff'); if (kind !== 'dog') { P.set(ex - 1, 6, W[5]); P.set(ex + 2, 6, W[5]); } }
    for (let y = 16; y < 32; y++) for (let x = 0; x < 16; x++) { const a = Math.abs(x - 8); let c = a < 3 ? W[4] : a > 6 ? C[2] : C[3]; if (horse) c = a > 5 ? acc[y % 3 ? 3 : 2] : W[4]; if (o.collar && y > 20 && y < 25) c = y === 21 ? mix(o.collar, '#ffffff', .35) : y === 24 ? mix(o.collar, '#30203a', .4) : o.collar; P.set(32 + x, y, c); }
    for (let y = 0; y < 12; y++) for (let x = 0; x < 8; x++) P.set(48 + x, y, Math.abs(x - 3.5) < 1.6 && y > 2 ? '#e8b8a8' : horse ? W[3] : C[3]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) P.set(56 + x, y, y > 12 ? (horse ? '#f2d06a' : dk) : kind === 'dog' && y > 8 ? W[4] : y > 7 ? (horse ? W[3] : C[2]) : horse ? W[4] : C[3]);
    for (let y = 16; y < 32; y++) for (let x = 0; x < 16; x++) P.set(48 + x, y, kind === 'deer' ? (Math.abs(x - 8) < 5 ? W[5] : C[3]) : horse ? acc[(x + y) % 3 ? 3 : 2] : (Math.abs(x - 8) < 3 ? W[4] : C[3]));
    return P; });
  def('antler', .6, (o = {}) => { const P = Px(16), C = ramp(o.c || '#d8c8a0'); P.clip = true; const ln = (x0, y0, x1, y1) => { P.line(x0, y0, x1, y1, C[4]); P.line(x0 + 1, y0, x1 + 1, y1, C[2]); }; ln(7, 15, 6, 9); ln(6, 9, 3, 2); ln(6, 9, 10, 4); ln(5, 6, 1, 6); ln(10, 4, 13, 1); ln(4, 4, 6, 0); return P; }, true);
  // ちょうの羽（抜き色つき。白で打ち、材質の色でそめる）
  def('wing', .2, () => { const P = Px(8); P.clip = true; P.bits(0, 0, ['..www...', '.wwwww..', 'wwkwwww.', 'wwwwwwk.', '.wwwwww.', '..wwkww.', '...www..', '........'], { w: '#ffffff', k: '#b8b8c8' }); return P; }, true);

  // 時計（校舎用。字のない文字ばん）・古い標識・自転車の車輪
  def('clock', 2, () => { const P = Px(32), C = ramp('#ece4cc', 6, { contrast: .6 }), Ru = ramp(RUST); P.clip = true; P.each((x, y) => { const d = Math.hypot(x - 15.5, y - 15.5); return d > 15.5 ? null : d > 13 ? Ru[d > 14.5 ? 1 : (x + y) % 5 ? 3 : 4] : d > 12 ? C[1] : (x + y * 2) % 13 === 0 ? C[2] : C[3 + (x + y < 26 ? 1 : 0)]; });
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; P.set(15.5 + Math.cos(a) * 10.5, 15.5 + Math.sin(a) * 10.5, '#4a4048'); if (k % 3 === 0) P.set(15.5 + Math.cos(a) * 9.5, 15.5 + Math.sin(a) * 9.5, '#4a4048'); } P.line(15, 16, 15, 8, '#3a3440'); P.line(16, 16, 16, 9, '#3a3440'); P.line(16, 16, 22, 19, '#3a3440'); P.set(15, 16, '#c8584a'); P.set(16, 16, '#c8584a'); return P; }, true);
  def('roadSignOld', .7, (o = {}) => { const P = PT.roadSign(o), Ru = ramp(RUST), sd = o.seed || 0; P.each((x, y, c) => { if (c === null) return; const n = tn(x, y, 8, 8, 32, 32, sd) * .6 + tn(x, y, 4, 4, 32, 32, sd + 1) * .4 + (y / 32) * .2; return n > .72 ? Ru[n > .8 ? 2 : 3] : mix(c, '#d8d2c0', .28); }); return P; }, true);
  def('spoke', .66, () => { const P = Px(32), I = ramp('#9a9ea8'); P.clip = true; P.each((x, y) => { const d = Math.hypot(x - 15.5, y - 15.5), a = (Math.atan2(y - 15.5, x - 15.5) / TAU + 1) * 10 % 1; return d > 16 ? null : d > 13.2 ? '#3a3840' : d > 12 ? I[4] : d < 2.2 ? I[2] : (a < .12 ? I[3] : null); }); return P; }, true);
  // さびた車（R.paint.car の上に、さび・こけ・われた窓を重ねる）
  def('wreck', 1, (o = {}) => { const P = PT.car({ c: o.c, kind: o.kind }), Ru = ramp(RUST), G = ramp(GREEN), sd = o.seed || 0, mo = o.moss ?? .6;
    P.each((x, y, c) => { if (c === null) return; const side = y < 32, n = tn(x, y, 8, 8, 64, 64, sd) * .6 + tn(x, y, 4, 4, 64, 64, sd + 1) * .4 + (side ? (y / 32) * .28 : y < 48 ? ((y - 32) / 16) * .22 : 0); if (n > .8) return Ru[tn(x, y, 4, 4, 64, 64, sd + 2) > .5 ? 3 : 2]; if (n > .76) return Ru[1]; return mix(c, '#d8d4c4', .16); });
    for (let y = 49; y < 63; y++) for (let x = 33; x < 47; x++) { const n = tn(x, y, 4, 4, 64, 64, sd + 5); if (n < mo) P.set(x, y, G[n < mo * .35 ? 4 : n < mo * .7 ? 3 : 2]); }
    for (let x = 0; x < 64; x++) { const h = Math.floor(tn(x, 0, 8, 64, 64, 64, sd + 6) * 6 * mo); for (let j = 0; j < h; j++) { P.set(x, 31 - j, G[j === h - 1 ? 5 : (x + j) % 3 ? 3 : 2]); P.set(x, 47 - j, G[j === h - 1 ? 5 : 3]); } }
    return P; });

  // ================= 2. 形 =================
  const q4 = (G, a, b, c, d, ua, ub, uc, ud, cs = 1) => G.tri(a, b, c, ua, ub, uc, cs).tri(a, c, d, ua, uc, ud, cs);
  const up6 = y => (Math.floor(y / 6 + 1e-6) + 1) * 6, bri = y => y < 0 ? .62 : .8 + .2 * Math.min(1, y / 9);
  const grp = (...a) => { const g = new THREE.Group(); g.add(...a); return g; };
  // 根もとを取りまく つたの輪（柱・タンク・塔に）
  const ivyRing = (B, r, h, o = {}) => B.g(tex.ivy({ from: 'bottom', amount: o.amount ?? .65, flowers: o.flowers ?? .4, seed: o.seed || 0 }), {}).smooth(0).loft(o.n || 8, [[o.y || 0, r + .07, r + .07, 0, 1], [(o.y || 0) + h, (o.r1 ?? r) + .07, (o.r1 ?? r) + .07, 1, 1]], { ur: Math.max(2, Math.round(TAU * r / 3)) });

  // 地面にはる平らな絵（白線・横断歩道・水たまり・こけ）。w × d m。ur, vr（くり返し。省くとテクスチャの m から）。3 m ごとに割ってある
  function decal(t, w = 3, d = 3, o = {}) { const G = geo().normal([0, 1, 0]), nx = Math.max(1, Math.round(w / 3)), nz = Math.max(1, Math.round(d / 3)), m = t.userData.m || 3, ur = o.ur ?? w / m, vr = o.vr ?? d / m, y = o.y ?? .05;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x0 = -w / 2 + i * w / nx, x1 = x0 + w / nx, z0 = d / 2 - j * d / nz, z1 = z0 - d / nz; G.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [i / nx * ur, j / nz * vr, (i + 1) / nx * ur, (j + 1) / nz * vr], o.bright ?? 1); }
    const me = G.mesh(t, { offset: true }); me.castShadow = false; return me; }

  // ---- 建物 ----
  function building(o = {}) { const bay = 3, fh = 3, nx = Math.max(1, Math.round((o.w || 12) / bay)), nz = Math.max(1, Math.round((o.d || 12) / bay)), fl = o.floors || 6, sd = o.seed || 0, br = o.broken ?? .3, base = o.base || 0, c = o.c || CONC, B = parts(), iv = o.ivy ?? .45;
    const Gw = B.g(o.wall || tex.ruinWall({ c, moss: o.moss ?? .35, seed: sd % 3, holes: o.holes, plants: o.plants })), Gi = B.g(o.inner || tex.concrete({ c: mix(c, '#7c7c8c', .3), moss: .25, seed: 1 })), Gr = B.g(o.roof || tex.concrete({ c: mix(c, '#8c8c82', .25), moss: o.roofMoss ?? .7, seed: 2 })), Gj = B.g(tex.jag({ c, seed: sd % 2 }));
    const Gt = iv ? B.g(tex.ivy({ amount: .75, flowers: o.flowers ?? .3, seed: sd % 2 }), { offset: true }) : null, Gb = iv ? B.g(tex.ivy({ from: 'bottom', amount: .7, flowers: o.flowers ?? .3, seed: sd % 2 }), { offset: true }) : null;
    const cx = (o.corner ?? Math.floor(hash(1, 2, sd) * 4)) & 1 ? nx - 1 : 0, cz = (o.corner ?? Math.floor(hash(1, 2, sd) * 4)) & 2 ? nz - 1 : 0, dg = Math.hypot(nx, nz);
    const Hc = (i, j) => i < 0 || j < 0 || i >= nx || j >= nz ? -1 : Math.max(1, fl - Math.max(0, Math.round(br * fl * 1.3 * (1 - Math.hypot(i - cx, j - cz) / dg * 2.4) + (hash(i, j, sd) - .5) * br * 3)));
    const X = i => -nx * bay / 2 + i * bay, Z = j => -nz * bay / 2 + j * bay;
    const side = (G, ax, az, bx, bz, y0, y1, k, sc) => { for (let y = y0; y < y1 - .01;) { const yn = Math.min(y1, up6(y)); G.quad([ax, y, az], [bx, y, bz], [bx, yn, bz], [ax, yn, az], [k * .5 * sc, y / 6 * sc, (k * .5 + .5) * sc, yn / 6 * sc], [bri(y), bri(y), bri(yn), bri(yn)]); y = yn; } };
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const h = Hc(i, j), x0 = X(i), x1 = x0 + bay, z0 = Z(j), z1 = z0 + bay, top = h * fh;
      for (const [ni, nj, ax, az, bx, bz, k] of [[i, j + 1, x0, z1, x1, z1, i], [i, j - 1, x1, z0, x0, z0, nx - 1 - i], [i + 1, j, x1, z1, x1, z0, nz - 1 - j], [i - 1, j, x0, z0, x0, z1, j]]) { const hn = Hc(ni, nj), out = hn < 0; if (h <= hn) continue;
        side(out ? Gw : Gi, ax, az, bx, bz, out ? -base : hn * fh, top, k, out ? 1 : 2);
        if (h < fl) { const r = hash(i * 3 + ni, j * 5 + nj, sd); Gj.quad([ax, top, az], [bx, top, bz], [bx, top + 1.5, bz], [ax, top + 1.5, az], [r, 0, r + 1, 1]); }
        if (out && iv) { const ex = -(bz - az) / bay * .07, ez = (bx - ax) / bay * .07, r = hash(i * 7 + k, j + ni * 3, sd + 5), r2 = hash(i * 7 + k, j + ni * 3, sd + 6);
          if (r < iv) { const hh = Math.min(top + base, r2 > .5 ? 6 : 4.5); Gt.quad([ax + ex, top + .25 - hh, az + ez], [bx + ex, top + .25 - hh, bz + ez], [bx + ex, top + .25, bz + ez], [ax + ex, top + .25, az + ez], [r * 7, 0, r * 7 + 1, 1]); }
          if (!base && r2 < iv * .9) Gb.quad([ax + ex, 0, az + ez], [bx + ex, 0, bz + ez], [bx + ex, 3.6, bz + ez], [ax + ex, 3.6, az + ez], [r2 * 7, 0, r2 * 7 + 1, 1]); } }
      Gr.quad([x0, top, z1], [x1, top, z1], [x1, top, z0], [x0, top, z0], [i, j, i + 1, j + 1], h < fl ? .86 : 1); }
    const hx = cx ? 0 : nx - 1, hz = cz ? 0 : nz - 1;   // こわれていない側のかど
    if ((o.hut ?? fl >= 3) && Hc(hx, hz) === fl) Gi.box(2.2, 2.1, 2.2, X(hx) + 1.5, fl * fh, Z(hz) + 1.5, { m: 3 });
    const g = B.group(), rg = o.roofGreen ?? .5; let low = [0, 0, 99];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const h = Hc(i, j); if (h < low[2] || (h === low[2] && hash(i, j, sd + 3) > .6)) low = [i, j, h]; if ((i === hx && j === hz) || hash(i, j, sd + 8) > rg) continue; const tf = R.tuft({ kind: ['grass', 'bush', 'flower', 'grass'][Math.floor(hash(i, j, sd + 9) * 4)], s: .8 + hash(i, j, sd + 10) * .7, seed: (i + j) % 3 }); tf.position.set(X(i) + .6 + hash(i, j, sd + 11) * 1.8, h * fh, Z(j) + .6 + hash(i, j, sd + 12) * 1.8); tf.rotation.y = i + j; g.add(tf); }
    if (o.tree ?? br > 0) { const tr = R.tree({ kind: o.treeKind || 'round', h: o.treeH || 3.6 + hash(5, 6, sd) * 1.6, c: o.treeC, flowers: o.treeFlowers, fc: o.treeFc, seed: sd }); tr.position.set(X(low[0]) + 1.5, low[2] * fh - .1, Z(low[1]) + 1.5); g.add(tr); }
    g.userData = { w: nx * bay, d: nz * bay, h: fl * fh, top: (i, j) => Hc(i, j) * fh, low: [X(low[0]) + 1.5, low[2] * fh, Z(low[1]) + 1.5] }; return g; }

  // くずれたかべ（上ばがぎざぎざ、鉄筋がのびる）。len, h, fall（はしへ向かって低くなる量 0〜1）, jag, thick, tex（省くと われたコンクリート。tex.ruinWall をわたすと窓つき）, base
  function wall(o = {}) { const len = o.len || 9, h = o.h || 4.5, sd = o.seed || 0, th = (o.thick ?? .4) / 2, t = o.tex || tex.concrete({ c: o.c, moss: o.moss ?? .4, seed: sd % 3 }), m = t.userData.m || 3, B = parts(), G = B.g(t), Gj = B.g(tex.jag({ c: o.c, seed: sd % 2 })), n = Math.max(2, Math.round(len / 1.5)), st = len / n, base = o.base || 0;
    const H = k => Math.max(.5, h * (1 - (o.fall ?? .6) * (k / n) + (hash(k, 1, sd) - .5) * (o.jag ?? .45)));
    for (let k = 0; k < n; k++) { const x0 = -len / 2 + k * st, x1 = x0 + st, hl = H(k), hr = Math.max(.4, H(k) + (hash(k, 2, sd) - .5) * h * .22), u0 = x0 / m, u1 = x1 / m, b0 = bri(0), cs = [b0, b0, bri(hr), bri(hl)];
      q4(G, [x0, -base, th], [x1, -base, th], [x1, hr, th], [x0, hl, th], [u0, -base / m], [u1, -base / m], [u1, hr / m], [u0, hl / m], [b0, b0, bri(hr)]); q4(G, [x1, -base, -th], [x0, -base, -th], [x0, hl, -th], [x1, hr, -th], [-u1, -base / m], [-u0, -base / m], [-u0, hl / m], [-u1, hr / m], [b0 * .9, b0 * .9, bri(hl) * .9]);
      G.quad([x0, hl, th], [x1, hr, th], [x1, hr, -th], [x0, hl, -th], [u0, 0, u1, th * 2 / m], 1.08); G.quad([x0, -base, -th], [x0, -base, th], [x0, hl, th], [x0, hl, -th], [0, 0, th * 2 / m, hl / m], .8); G.quad([x1, -base, th], [x1, -base, -th], [x1, hr, -th], [x1, hr, th], [0, 0, th * 2 / m, hr / m], .9);
      if (hash(k, 3, sd) > (o.rebar === false ? 2 : .45)) { const r = hash(k, 4, sd), y = Math.min(hl, hr) - .15; Gj.quad([x0, y, 0], [x1, y, 0], [x1, y + .9, 0], [x0, y + .9, 0], [r, 0, r + st / 3, .75]); } }
    const g = B.group(); g.userData = { len, h }; return g; }

  // 柱とはりだけ残った骨組み。nx, nz（ます目の数）, floors, bay（柱の間かく m）, fh（1 階の高さ）, miss 0〜1（上の階の欠け）, slab 0〜1（床の残りぐあい）, base
  function frame(o = {}) { const nx = o.nx || 3, nz = o.nz || 2, fl = o.floors || 3, bay = o.bay || 4, fh = o.fh || 3.2, sd = o.seed || 0, miss = o.miss ?? .35, base = o.base || 0, B = parts(), G = B.g(o.tex || tex.concrete({ c: o.c, moss: o.moss ?? .45, seed: sd % 3 })), Gs = B.g(tex.concrete({ c: o.c, moss: .75, seed: 2 })), Gj = B.g(tex.jag({ c: o.c, seed: sd % 2 }));
    const X = i => (i - nx / 2) * bay, Z = j => (j - nz / 2) * bay, CH = (i, j) => Math.max(1, fl - Math.floor(hash(i, j, sd) * fl * miss * 2.2));
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { const h = CH(i, j); for (let y = -base; y < h * fh - .01;) { const yn = Math.min(h * fh, up6(y)); G.box(.46, yn - y, .46, X(i), y, Z(j), { m: 3, top: yn >= h * fh, c0: bri(y), c1: bri(yn) }); y = yn; }
      if (h < fl) { const r = hash(i, j, sd + 2); for (const ry of [0, 1]) Gj.at(TR(X(i), h * fh - .1, Z(j), ry * 1.57)).quad([-.3, 0, 0], [.3, 0, 0], [.3, .9, 0], [-.3, .9, 0], [r, .1, r + .2, .85]); Gj.at(null); }
      for (let k = 1; k <= fl; k++) { if (i < nx && h >= k && CH(i + 1, j) >= k) G.box(bay - .46, .42, .3, X(i) + bay / 2, k * fh - .42, Z(j), { m: 3, bottom: true }); if (j < nz && h >= k && CH(i, j + 1) >= k) G.box(.3, .42, bay - .46, X(i), k * fh - .42, Z(j) + bay / 2, { m: 3, bottom: true });
        if (i < nx && j < nz && Math.min(h, CH(i + 1, j), CH(i, j + 1), CH(i + 1, j + 1)) >= k && hash(i + k * 5, j, sd + 4) < (o.slab ?? .45)) Gs.box(bay, .16, bay, X(i) + bay / 2, k * fh - .02, Z(j) + bay / 2, { m: 3, bottom: true }); } }
    const g = B.group(); g.userData = { w: nx * bay, d: nz * bay, h: fl * fh, fh }; return g; }

  // 橋げた（T 字の橋脚）。h（上ばの高さ）, w, d（柱の太さ）, cap（上のはりの長さ。x の向き）, base（水にしずめる深さ）
  function pier(o = {}) { const h = o.h || 6, w = o.w || 2.2, d = o.d || 1.6, cap = o.cap ?? 6, base = o.base || 0, G = geo(), top = cap ? h - 1.7 : h;
    for (let y = -base; y < top - .01;) { const yn = Math.min(top, up6(y)); G.box(w, yn - y, d, 0, y, 0, { m: 3, top: !cap && yn >= top, c0: bri(y), c1: bri(yn) }); y = yn; }
    if (cap) { G.box(w, .8, d, 0, h - 1.7, 0, { m: 3, top: false, taper: [cap / w * .86, 1.12], c0: .85 }); G.box(cap * .86, .9, d * 1.12, 0, h - .9, 0, { m: 3 }); }
    const me = G.mesh(o.tex || tex.concrete({ c: o.c, moss: o.moss ?? .45, seed: (o.seed || 0) % 3 })); me.userData = { h }; return me; }

  // 高架の道路・線路（x の向きにのびる）。len, w（はば）, h（路面の高さ）, kind: 'road'/'rail', gap: [x0, x1]（落ちている所）, span（橋脚の間かく）, base, grass, fallen（落ちた床を地面に置く）
  function viaduct(o = {}) { const len = o.len || 48, w = o.w || 9, h = o.h || 7, kind = o.kind || 'road', span = o.span || 12, gap = o.gap || null, sd = o.seed || 0, base = o.base || 0, c = o.c, B = parts(), tk = 1, n = Math.round(len / 6);
    const Gc = B.g(tex.concrete({ c, moss: o.moss ?? .3, seed: sd % 3 })), Gt = B.g(o.top || (kind === 'rail' ? tex.rail({ grass: o.grass ?? .7 }) : tex.asphalt({ line: 'both', grass: o.grass ?? .7, m: w }))), Gj = B.g(tex.jag({ c, seed: sd % 2 })), inGap = x => gap && x > gap[0] && x < gap[1]; let gl = null, gr = null;
    const deck = (x0, x1) => { const xm = (x0 + x1) / 2, L = x1 - x0; Gc.box(L, tk, w, xm, h - tk, 0, { m: 3, top: false, bottom: true, c0: .8 }); Gt.quad([x0, h, -w / 2], [x0, h, w / 2], [x1, h, w / 2], [x1, h, -w / 2], kind === 'rail' ? [0, x0 / 3, w / 3, x1 / 3] : [0, x0 / w, 1, x1 / w]); for (const s of [-1, 1]) Gc.box(L, kind === 'rail' ? .35 : .9, .28, xm, h, s * (w / 2 - .14), { m: 3 }); };
    for (let k = 0; k < n; k++) { const x0 = -len / 2 + k * 6, x1 = x0 + 6; if (inGap(x0 + 3)) { if (gl === null) gl = x0; gr = x1; continue; } deck(x0, x1); }
    if (gl !== null) { for (const [x, s] of [[gl, 1], [gr, -1]]) if (Math.abs(x) < len / 2 - .1) Gj.quad([x, h - .45, w / 2], [x, h - .45, -w / 2], [x + s * 1.5, h - .45, -w / 2], [x + s * 1.5, h - .45, w / 2], [0, 0, w / 3, 1]);
      if (gl > -len / 2 + .1) { const M = TR(gl, h, 0, 0, 0, -(o.droop ?? .5)); Gc.at(M).box(5, tk * .8, w * .96, 2.5, -tk * .8, 0, { m: 3, top: false, bottom: true, c0: .7 }); Gt.at(M).quad([0, 0, -w * .48], [0, 0, w * .48], [5, 0, w * .48], [5, 0, -w * .48], kind === 'rail' ? [0, 0, w / 3, 5 / 3] : [0, 0, 1, 5 / w]); Gj.at(M).quad([5, -.4, w * .48], [5, -.4, -w * .48], [6.3, -.4, -w * .48], [6.3, -.4, w * .48], [.3, 0, .3 + w / 3, 1]); Gc.at(null); Gt.at(null); Gj.at(null); }
      if ((o.fallen ?? !base) && gr - gl > 7) { const M = TR((gl + gr) / 2 + 1.5, .35, .6, .12, 0, .1); Gc.at(M).box(5.5, tk * .8, w * .9, 0, 0, 0, { m: 3 }); Gc.at(null); } }
    const g = B.group(); for (let x = -len / 2 + span / 2; x < len / 2; x += span) { if (inGap(x) && !o.gapPiers) continue; const p = pier({ h: h - tk, cap: w * .98, base, c, moss: o.moss, seed: sd + Math.round(x) }); p.rotation.y = Math.PI / 2; p.position.x = x; g.add(p); }
    g.userData = { deckY: h, w, len, gap: gl === null ? null : [gl, gr] }; return g; }

  // 古代の石の柱。h, r, broken 0〜1（上がどれだけ折れているか）, base。たおれた柱は rotation.z = Math.PI / 2 で ねかせる
  function column(o = {}) { const h = o.h || 6, r = o.r || .5, sd = o.seed || 0, c = o.c, mo = o.moss ?? .3, base = o.base || 0, br = o.broken || 0, B = parts(), Gb = B.g(tex.ancient({ c, moss: mo, seed: sd % 2 })), Gf = B.g(tex.ancient({ kind: 'flute', c, moss: mo, seed: sd % 2 })).smooth(1), st = br ? .5 + (h - 1.02) * cl(1 - br, .12, 1) : h - .52, hs = st - .5;
    Gb.box(r * 2.9, .28 + base, r * 2.9, 0, -base, 0, { m: 3, c0: .8 }); Gb.loft(8, [[.28, r * 1.32, r * 1.32, 0, .88], [.5, r * 1.1, r * 1.1, .1, 1]], { ur: 2 });
    Gf.loft(8, [[.5, r, r, 0, .86], [.5 + hs * .5, r * .97, r * .97, hs / 6, 1], [st, r * .86, r * .86, hs / 3, 1.04, br ? r * .1 : 0, 0], ...(br ? [[st + r * .5, r * .3, r * .5, hs / 3 + .1, .9, r * .35, 0]] : [])], { ur: 2, cap: br ? 'top' : undefined });
    if (!br) { Gb.loft(8, [[st, r * .9, r * .9, 0, .9], [st + .22, r * 1.36, r * 1.36, .1, 1.05]], { ur: 2 }); Gb.box(r * 3, .3, r * 3, 0, h - .3, 0, { m: 3, bottom: true }); }
    if (o.ivy ?? 1) ivyRing(B, r, Math.min(2.4, hs), { y: .3, seed: sd % 2, n: 8, amount: o.ivy ?? .6 }); const g = B.group(); g.userData = { h, top: br ? st : h }; return g; }

  // くずれたアーチ。w（くぐる はば）, h（てっぺん）, thick（柱の太さ）, d（おくゆき）, broken 0〜1（まん中がどれだけ落ちているか）, base
  function arch(o = {}) { const w = o.w || 5, h = o.h || 6.5, th = o.thick || 1.1, d = (o.d || 1.2) / 2, n = 9, br = o.broken || 0, sd = o.seed || 0, base = o.base || 0, B = parts(), t = o.tex || tex.ancient({ c: o.c, moss: o.moss ?? .35, seed: sd % 2 }), G = B.g(t), Gc = B.g(tex.ancient({ kind: 'carve', c: o.c, moss: .15, seed: sd % 2 })), ri = w / 2, ro = ri + th * .85, sp = Math.max(1, h - ro);
    for (const s of [-1, 1]) { for (let y = -base; y < sp - .01;) { const yn = Math.min(sp, up6(y)); G.box(th, yn - y, d * 2, s * (ri + th / 2), y, 0, { m: 3, top: false, c0: bri(y), c1: bri(yn) }); y = yn; } Gc.box(th * 1.16, .5, d * 2.16, s * (ri + th / 2), sp - .5, 0, { uv: [0, .3, th * 1.16 / 3, .47], topUV: [0, 0, .3, .3] }); }
    const P = (k, r, z) => { const a = k / n * Math.PI; return [Math.cos(a) * r, sp + Math.sin(a) * r, z]; }, gone = k => br && Math.abs(k + .5 - n * (.5 + (hash(1, 2, sd) - .5) * .3)) < br * n / 2;
    for (let k = 0; k < n; k++) { if (gone(k)) continue; const cs = k % 2 ? .93 : 1.04, u = k * .4; G.quad(P(k, ri, d), P(k, ro, d), P(k + 1, ro, d), P(k + 1, ri, d), [u, 0, u + .4, .3], cs); G.quad(P(k, ro, -d), P(k, ri, -d), P(k + 1, ri, -d), P(k + 1, ro, -d), [u, 0, u + .4, .3], cs * .9);
      G.quad(P(k, ro, d), P(k, ro, -d), P(k + 1, ro, -d), P(k + 1, ro, d), [u, 0, u + .4, .4], cs * 1.06); G.quad(P(k, ri, -d), P(k, ri, d), P(k + 1, ri, d), P(k + 1, ri, -d), [u, 0, u + .4, .4], cs * .7);
      for (const [kk, ok] of [[k, k === 0 || gone(k - 1)], [k + 1, k === n - 1 || gone(k + 1)]]) if (ok) { G.quad(P(kk, ri, d), P(kk, ri, -d), P(kk, ro, -d), P(kk, ro, d), [0, 0, .4, .3], .8); G.quad(P(kk, ri, -d), P(kk, ri, d), P(kk, ro, d), P(kk, ro, -d), [0, 0, .4, .3], .8); } }
    const g = B.group(); g.userData = { w, h, spring: sp }; return g; }

  // 石段（-z へ向かって上がる）。w, n（段の数）, rise, run, tex, base
  function steps(o = {}) { const w = o.w || 6, n = o.n || 6, rise = o.rise || .3, run = o.run || .55, base = o.base || 0, t = o.tex || tex.ancient({ c: o.c, moss: o.moss ?? .45, seed: (o.seed || 0) % 2 }), m = t.userData.m || 3, G = geo(), a = w / 2;
    for (let k = 0; k < n; k++) { const z = -k * run, y0 = k * rise, y1 = y0 + rise, cs = .96 + hash(k, 1, o.seed || 0) * .1; G.quad([-a, y0, z], [a, y0, z], [a, y1, z], [-a, y1, z], [0, y0 / m, w / m, y1 / m], .78); G.quad([-a, y1, z], [a, y1, z], [a, y1, z - run], [-a, y1, z - run], [0, k * run / m, w / m, (k + 1) * run / m], cs);
      G.quad([a, -base, z], [a, -base, z - run], [a, y1, z - run], [a, y1, z], [k * run / m, -base / m, (k + 1) * run / m, y1 / m], .85); G.quad([-a, -base, z - run], [-a, -base, z], [-a, y1, z], [-a, y1, z - run], [k * run / m, -base / m, (k + 1) * run / m, y1 / m], .85); }
    G.quad([a, -base, -n * run], [-a, -base, -n * run], [-a, n * rise, -n * run], [a, n * rise, -n * run], [0, -base / m, w / m, n * rise / m], .8); const me = G.mesh(t); me.userData = { h: n * rise, d: n * run }; return me; }

  // 山（がれき・砂・こけ）。r, h, tex, squash（おくゆきのつぶれ）   rubble はその上に、床のかけら・鉄筋・草をのせたもの
  function mound(o = {}) { const r = o.r || 3, h = o.h || 1.1, sd = o.seed || 0, t = o.tex || tex.rubble({ seed: sd % 2 }), m = t.userData.m || 3, sq = o.squash ?? .8, j = (i, k) => 1 + (hash(i, k, sd) - .5) * .35;
    return geo().smooth(1).loft(9, [[-.06, r * j(0, 1), r * j(0, 2) * sq, 0, .8], [h * .45, r * .72 * j(1, 1), r * .7 * j(1, 2) * sq, r * .4 / m, .96, r * .08, 0], [h * .85, r * .36 * j(2, 1), r * .34 * j(2, 2) * sq, r * .8 / m, 1.05, r * .1, r * .05], [h, r * .06, r * .06, r / m, 1.1, r * .12, r * .05]], { cap: 'top', ur: Math.max(2, Math.round(TAU * r * .7 / m)), rot: hash(3, 3, sd) }).mesh(t); }
  function rubble(o = {}) { const r = o.r || 3, h = o.h || 1.2, sd = o.seed || 0, B = parts(), G = B.g(tex.concrete({ c: o.c, moss: .5, seed: sd % 3 })), Gj = B.g(tex.jag({ c: o.c, seed: sd % 2 })), g = grp(mound({ r, h, seed: sd, tex: tex.rubble({ grass: o.grass ?? .15, seed: sd % 2 }) }));
    for (let k = 0; k < (o.slabs ?? 3); k++) { const a = hash(k, 1, sd) * TAU, rr = r * (.2 + hash(k, 2, sd) * .45); G.at(TR(Math.cos(a) * rr, h * (.5 + hash(k, 3, sd) * .3), Math.sin(a) * rr * .8, a, (hash(k, 4, sd) - .5) * 1.1, (hash(k, 5, sd) - .5) * 1.1)).box(1.3 + hash(k, 6, sd), .24, .9 + hash(k, 7, sd) * .6, 0, 0, 0, { m: 3, bottom: true }); if (k < 2) Gj.at(TR(Math.cos(a + 2) * rr, h * .45, Math.sin(a + 2) * rr * .8, a)).quad([-.9, 0, 0], [.9, 0, 0], [.9, 1, 0], [-.9, 1, 0], [k * .3, 0, k * .3 + .6, .9]); }
    g.add(B.group()); for (let k = 0; k < (o.tufts ?? 3); k++) { const a = hash(k, 8, sd) * TAU, tf = R.tuft({ kind: k % 3 === 2 ? 'flower' : 'grass', s: .6 + hash(k, 9, sd) * .4, seed: k % 3 }); tf.position.set(Math.cos(a) * r * .8, h * .12, Math.sin(a) * r * .65); g.add(tf); } return g; }

  // 校舎（長い建物＋まん中の時計塔）。w, floors, c, broken, base
  function school(o = {}) { const w = o.w || 36, fl = o.floors || 3, sd = o.seed || 0, c = o.c || '#e8dcc0', B = parts();
    const main = building({ w, d: 9, floors: fl, c, moss: o.moss ?? .3, broken: o.broken ?? .2, holes: o.holes ?? .5, seed: sd, hut: false, roofGreen: .45, base: o.base, ivy: o.ivy, treeC: o.treeC, treeFlowers: o.treeFlowers, treeFc: o.treeFc }), tower = building({ w: 6, d: 12, floors: fl + 1, c, moss: o.moss ?? .3, broken: 0, seed: sd + 1, hut: false, tree: false, base: o.base, ivy: o.ivy });
    const y = fl * 3 + .5; B.g(tex.clock(), { offset: true }).quad([-1.1, y, 6.08], [1.1, y, 6.08], [1.1, y + 2.2, 6.08], [-1.1, y + 2.2, 6.08]); const G = B.g(tex.concrete({ c, moss: .5 })); G.box(5.4, .26, 2.6, 0, 2.9, 7.3, { m: 3, bottom: true }); for (const s of [-1, 1]) G.box(.3, 2.9, .3, s * 2.4, 0, 8.3, { m: 3, top: false });
    const g = grp(main, tower, B.group()); g.userData = { w, d: 9, h: (fl + 1) * 3 }; return g; }

  // 工場（のこぎり屋根。天窓のガラスは +x を向く）。w, d, h（軒の高さ）, teeth（屋根の山の数）, rise, open 0〜1（+z のかべの、まん中のあいた はば）, c。中からも見える（両面）
  //   userData.skylights = [{ x, y, z }]（天窓のまん中。P.shaft を置く目やす）
  function factory(o = {}) { const w = o.w || 30, d = o.d || 18, h = o.h || 7.5, teeth = o.teeth || Math.max(2, Math.round(w / 6)), rh = o.rise || 2.6, sd = o.seed || 0, c = o.c || '#c8d4c8', open = o.open ?? .4, B = parts(), tw = w / teeth, sky = [], a = w / 2, b = d / 2;
    const Gc = B.g(tex.concrete({ c: '#b4b0a2', moss: .5, seed: sd % 3 }), { side: true }), Gw = B.g(tex.rust({ wave: 1, paint: c, peel: o.peel ?? .45, panel: 0, seed: sd % 2 }), { side: true }), Gp = B.g(tex.panes({ holes: o.holes ?? .55, seed: sd % 2 }), { side: true }), Gt = B.g(tex.truss({ seed: sd % 2 }), { side: true });
    const seg = (ax, az, bx, bz, u, low = true) => { const L = Math.hypot(bx - ax, bz - az); if (low) { Gc.quad([ax, 0, az], [bx, 0, bz], [bx, 2.4, bz], [ax, 2.4, az], [u / 3, 0, (u + L) / 3, .8], [.8, .8, .95, .95]); Gp.quad([ax, 2.4, az], [bx, 2.4, bz], [bx, 5.4, bz], [ax, 5.4, az], [u / 3, 0, (u + L) / 3, 1]); } Gw.quad([ax, 5.4, az], [bx, 5.4, bz], [bx, h, bz], [ax, h, az], [u / 2, 0, (u + L) / 2, (h - 5.4) / 2]); };
    const nxs = Math.round(w / 3), nzs = Math.round(d / 3); for (let k = 0; k < nxs; k++) { const x0 = -a + k * w / nxs, x1 = x0 + w / nxs; seg(x1, -b, x0, -b, k * 3); seg(x0, b, x1, b, k * 3, Math.abs((x0 + x1) / 2) > open * a); } for (let k = 0; k < nzs; k++) { const z0 = -b + k * d / nzs, z1 = z0 + d / nzs; seg(a, z1, a, z0, k * 3); seg(-a, z0, -a, z1, k * 3); }
    const nz = Math.max(1, Math.round(d / 6)), sl = Math.hypot(tw, rh);
    for (let k = 0; k < teeth; k++) { const x0 = -a + k * tw, x1 = x0 + tw; for (let j = 0; j < nz; j++) { const z0 = -b + j * d / nz, z1 = z0 + d / nz;
        q4(Gw, [x0, h, z1], [x1, h + rh, z1], [x1, h + rh, z0], [x0, h, z0], [z1 / 2, 0], [z1 / 2, sl / 2], [z0 / 2, sl / 2], [z0 / 2, 0], [.9, 1.08, 1.08]); Gp.quad([x1, h, z1], [x1, h, z0], [x1, h + rh, z0], [x1, h + rh, z1], [j * 2, 0, j * 2 + 2, rh / 3]); sky.push({ x: x1, y: h + rh / 2, z: (z0 + z1) / 2 }); }
      for (const z of [-b, b]) Gw.tri([x0, h, z], [x1, h, z], [x1, h + rh, z], [0, 0], [tw / 2, 0], [tw / 2, rh / 2], .95);
      if (k) for (let j = 1; j < nz; j++) Gt.quad([x0 - .3, 0, -b + j * d / nz], [x0 + .3, 0, -b + j * d / nz], [x0 + .3, h, -b + j * d / nz], [x0 - .3, h, -b + j * d / nz], [0, 0, 1, Math.round(h / 1.5)]); }
    for (let j = 1; j < nz; j++) { const z = -b + j * d / nz, nn = Math.round(w / 1.5); q4(Gt, [-a, h - .9, z], [a, h - .9, z], [a, h, z], [-a, h, z], [0, 0], [0, nn], [1, nn], [1, 0]); }
    const g = B.group(); g.userData = { w, d, h, skylights: sky, tw, rise: rh }; return g; }

  // 大きなタンク。r, h, legs（足の高さ。0 で地面に置く）, c, base     えんとつ。h, r, bands（しまの数）, c, c2, base
  function tank(o = {}) { const r = o.r || 3, h = o.h || 7, legs = o.legs || 0, sd = o.seed || 0, c = o.c || '#c8d6cc', base = o.base || 0, B = parts(), G = B.g(tex.rust({ paint: c, peel: o.peel ?? .45, seed: sd % 2 })).smooth(1), ur = Math.max(2, Math.round(TAU * r / 2)), y0 = legs, yb = legs ? y0 : -base;
    G.loft(10, [[yb, r, r, yb / 2, .76], [y0 + h * .5, r, r, (y0 + h * .5) / 2, .95], [y0 + h, r, r, (y0 + h) / 2, 1], [y0 + h + r * .22, r * .72, r * .72, (y0 + h) / 2 + .4, 1.08], [y0 + h + r * .34, r * .08, r * .08, (y0 + h) / 2 + .8, 1.12]], { ur, cap: legs ? 'bot' : undefined });
    B.g(tex.truss({ kind: 'ladder' }), { side: true }).quad([-.75, 0, r + .06], [.75, 0, r + .06], [.75, y0 + h, r + .06], [-.75, y0 + h, r + .06], [0, 0, 1, Math.round((y0 + h) / 1.5)]);
    if (legs) { const Gl = B.g(tex.truss({ seed: sd % 2 }), { side: true }); for (let k = 0; k < 4; k++) Gl.at(TR(0, 0, 0, k * Math.PI / 2 + .785)).quad([-.4, -base, r * .78], [.4, -base, r * .78], [.4, legs, r * .78], [-.4, legs, r * .78], [0, 0, 1, Math.round((legs + base) / 1.5)]).quad([-r * .78, legs * .45, r * .78], [r * .78, legs * .45, r * .78], [r * .78, legs * .45 + .5, r * .78], [-r * .78, legs * .45 + .5, r * .78], [0, 0, 1, .34]); }
    else if (!base && (o.ivy ?? 1)) ivyRing(B, r, 3, { n: 10, seed: sd % 2 }); const g = B.group(); g.userData = { r, h: y0 + h + r * .34 }; return g; }
  function chimney(o = {}) { const h = o.h || 22, r = o.r || 1.5, sd = o.seed || 0, nb = o.bands ?? 5, base = o.base || 0, B = parts(), ta = tex.rust({ paint: o.c || '#d86a54', peel: .4, panel: 0, seed: sd % 2 }), tb = tex.rust({ paint: o.c2 || '#ece6d6', peel: .35, panel: 0, seed: (sd + 1) % 2 }), rr = y => r * (1 - .45 * Math.max(0, y) / h);
    for (let k = 0; k < nb; k++) { const y0 = k ? k * h / nb : -base, y1 = (k + 1) * h / nb; B.g(k % 2 ? tb : ta).smooth(1).loft(8, [[y0, rr(y0), rr(y0), y0 / 2, .78 + .2 * k / nb], [y1, rr(y1), rr(y1), y1 / 2, .82 + .2 * (k + 1) / nb]], { ur: Math.max(2, Math.round(TAU * rr(y0) / 2)) }); }
    B.g(tex.rust({ c: '#5a4a50', panel: 0 })).smooth(0).loft(8, [[h, rr(h) * 1.12, rr(h) * 1.12, 0, .9], [h + .35, rr(h) * 1.12, rr(h) * 1.12, .2, 1]], { cap: 'top', ur: 2 });
    B.g(tex.truss({ kind: 'ladder' }), { side: true }).quad([-.75, 0, r + .05], [.75, 0, r + .05], [.75, h, rr(h) + .05], [-.75, h, rr(h) + .05], [0, 0, 1, Math.round(h / 1.5)]); if (!base && (o.ivy ?? 1)) ivyRing(B, r, 3.4, { r1: rr(3.4), seed: sd % 2 }); const g = B.group(); g.userData = { h, top: [0, h + .4, 0] }; return g; }

  // 鉄塔。h, w（足もとのはば）, arms（うでの数）, lean, leanX   userData.tips = 電線をつなぐ点（[x, y, z]。鉄塔の中の座標）
  function pylon(o = {}) { const h = o.h || 24, w = o.w || 5, sd = o.seed || 0, B = parts(), Gt = B.g(tex.truss({ paint: o.c, seed: sd % 2 }), { side: true }), tips = [], M = TR(0, 0, 0, 0, o.leanX || 0, o.lean || 0), tw = y => w / 2 * (1 - .84 * y / h), V = new THREE.Vector3(), ns = 4;
    for (let s = 0; s < ns; s++) { const y0 = s * h / ns - (s ? 0 : (o.base || 0)), y1 = (s + 1) * h / ns, a0 = tw(Math.max(0, y0)), a1 = tw(y1); for (let k = 0; k < 4; k++) Gt.at(M.clone().multiply(TR(0, 0, 0, k * Math.PI / 2))).quad([-a0, y0, a0], [a0, y0, a0], [a1, y1, a1], [-a1, y1, a1], [0, 0, 1, Math.max(1, Math.round((y1 - y0) / (a0 + a1) / 1.2))]); }
    [[.64, .95], [.79, .8], [.93, .55]].slice(0, o.arms ?? 3).forEach(([f, l]) => { const y = h * f, L = w * l; Gt.at(M); q4(Gt, [-L, y - .4, 0], [L, y - .4, 0], [L, y + .4, 0], [-L, y + .4, 0], [0, 0], [0, Math.round(L * 2 / 1.5)], [1, Math.round(L * 2 / 1.5)], [1, 0]); q4(Gt, [-L, y, -.4], [L, y, -.4], [L, y, .4], [-L, y, .4], [0, 0], [0, Math.round(L * 2 / 1.5)], [1, Math.round(L * 2 / 1.5)], [1, 0]); for (const s of [-1, 1]) tips.push(V.set(s * (L - .1), y - .45, 0).applyMatrix4(M).toArray()); });
    const g = B.group(); g.userData = { h, tips }; return g; }

  // 灯台。h, r, c, c2（しまの色）, base, lit（あかりがともる。既定 true）   userData.lampY
  function lighthouse(o = {}) { const h = o.h || 16, r = o.r || 2.3, sd = o.seed || 0, base = o.base || 0, c = o.c || '#f0ece0', c2 = o.c2 || '#d8604a', B = parts(), ta = tex.rust({ paint: c, peel: o.peel ?? .3, c: '#b89a80', seed: sd % 2 }), tb = tex.rust({ paint: c2, peel: .35, seed: (sd + 1) % 2 }), hb = h - 3.2, rr = y => r * (1 - .38 * Math.max(0, y) / hb), nb = o.bands ?? 4, rt = rr(hb);
    B.g(tex.ancient({ c: '#b4b0a4', moss: .5, seed: sd % 2 })).loft(8, [[-base, r * 1.38, r * 1.38, -base / 3, .7], [.8, r * 1.3, r * 1.3, .27, 1]], { ur: 6, cap: 'top' });
    for (let k = 0; k < nb; k++) { const y0 = .8 + k * (hb - .8) / nb, y1 = .8 + (k + 1) * (hb - .8) / nb; B.g(k % 2 ? tb : ta).smooth(1).loft(8, [[y0, rr(y0), rr(y0), y0 / 2, .82 + .18 * k / nb], [y1, rr(y1), rr(y1), y1 / 2, .86 + .18 * (k + 1) / nb]], { ur: Math.max(2, Math.round(TAU * rr(y0) / 2)) }); }
    const dz = rr(.8) * .924 + .05; B.g(T.door({ arch: 1, c: '#5a7a8a' }), { offset: true }).quad([-.55, .8, dz], [.55, .8, dz], [.55 * .98, 3, dz - .08], [-.55 * .98, 3, dz - .08]);
    B.g(ta).smooth(0).loft(8, [[hb, rt + .75, rt + .75, 0, .8], [hb + .22, rt + .75, rt + .75, .11, 1]], { cap: 'both', ur: 4 }); B.g(T.fence({ kind: 'iron' }), { side: true }).loft(8, [[hb + .22, rt + .7, rt + .7, 0, 1], [hb + 1.15, rt + .7, rt + .7, 1, 1]], { ur: 16 });
    B.g(tex.panes({ holes: .25, c: '#e8e4d8', seed: sd % 2 }), { side: true }).loft(8, [[hb + .22, rt * .72, rt * .72, 0, 1], [hb + 1.9, rt * .72, rt * .72, .5, 1]], { ur: 4 });
    if (o.lit ?? true) B.g(T.lamp(), { glow: true }).loft(6, [[hb + .5, rt * .3, rt * .3, 0], [hb + 1.6, rt * .3, rt * .3, 1]], { ur: 3, cap: 'top' });
    B.g(tb).smooth(0).loft(8, [[hb + 1.9, rt * .9, rt * .9, 0, .9], [hb + 2.9, .12, .12, .6, 1.1], [hb + 3.3, .05, .05, .8, 1.1]], { ur: 4, cap: 'top' });
    if (!base && (o.ivy ?? 1)) ivyRing(B, r * 1.3, 3.6, { r1: rr(3.6) * 1.02, y: .1, seed: sd % 2 }); const g = B.group(); g.userData = { h, lampY: hb + 1.1 }; return g; }

  // ---- 残された物 ----
  // さびた車（R.car の形に、さびとこけの絵）。c, kind: 'sedan'/'van', moss, grass（まわりの草）
  function wreck(o = {}) { const sd = o.seed || 0, car = R.car({ c: o.c, kind: o.kind }), key = 'wreck' + JSON.stringify([o.c, o.kind, o.moss, sd % 3]); let t = cache.get(key); if (!t) cache.set(key, t = T.from(paint.wreck({ c: o.c, kind: o.kind, moss: o.moss, seed: sd % 3 }), { m: 1 }));
    car.children[0].material = mat(t, { vc: true, smooth: true }); for (const wq of car.userData.wheels) { wq.userData.dyn = false; wq.position.y = .29; } car.position.y = -.07; car.rotation.z = (hash(1, 2, sd) - .5) * .08; const g = grp(car);
    if (o.grass ?? 1) for (let k = 0; k < 4; k++) { const tf = R.tuft({ kind: k === 1 ? 'flower' : k === 3 ? 'bush' : 'grass', s: .55 + hash(k, 3, sd) * .4, seed: k % 3 }); tf.position.set((k % 2 ? 1 : -1) * (.75 + hash(k, 4, sd) * .3), 0, (k < 2 ? 1 : -1) * (1.1 + hash(k, 5, sd) * .6)); g.add(tf); } return g; }
  // バス・電車の車両（前は +z）。kind: 'bus'/'train', len, c, c2（帯）, moss, ivy
  function coach(o = {}) { const kind = o.kind || 'bus', train = kind === 'train', n = Math.max(2, Math.round((o.len || (train ? 15 : 9)) / 3)), len = n * 3, w = (train ? 2.8 : 2.4) / 2, hb = train ? 2.7 : 2.6, y0 = train ? .95 : .5, yT = y0 + hb, tp = .88, sd = o.seed || 0, c = o.c || '#e4dcc0', B = parts(), l2 = len / 2;
    const Gs = B.g(tex.coachSide({ kind, c: o.c, c2: o.c2, seed: sd % 2, moss: o.moss })), Ge = B.g(tex.coachEnd({ kind, c: o.c, c2: o.c2, seed: sd % 2, moss: o.moss })), Gr = B.g(tex.rust({ paint: mix(c, '#ffffff', .15), peel: .5, panel: 0, seed: sd % 2 })), Gu = B.g(tex.rust({ c: '#5c4c48', panel: 0 })), Gi = (o.ivy ?? 1) ? B.g(tex.ivy({ amount: .7, flowers: .5, seed: sd % 2 }), { offset: true }) : null, Ga = (o.ivy ?? 1) ? B.g(tex.ivy({ from: 'all', amount: .6, flowers: .5, seed: sd % 2 }), { offset: true }) : null, Gw = B.g(T.wheel({ kind: 'car' }), { side: true });
    for (let k = 0; k < n; k++) { const za = l2 - k * 3, zb = za - 3; Gs.quad([w, y0, za], [w, y0, zb], [w * tp, yT, zb], [w * tp, yT, za], [k, 0, k + 1, 1], [.85, .85, 1, 1]); Gs.quad([-w, y0, zb], [-w, y0, za], [-w * tp, yT, za], [-w * tp, yT, zb], [k, 0, k + 1, 1], [.85, .85, 1, 1]); Gr.quad([-w * tp, yT, za], [w * tp, yT, za], [w * tp, yT, zb], [-w * tp, yT, zb], [0, k * 1.5, w * tp, k * 1.5 + 1.5], 1.06);
      if (Gi && hash(k, 1, sd) < .6) { Ga.quad([-w * tp, yT + .04, za], [w * tp, yT + .04, za], [w * tp, yT + .04, zb], [-w * tp, yT + .04, zb], [k, 0, k + 1, 1]); const s = hash(k, 2, sd) > .5 ? 1 : -1; Gi.quad([s * (w + .04), yT - 1.7, s > 0 ? za : zb], [s * (w + .04), yT - 1.7, s > 0 ? zb : za], [s * (w * tp + .04), yT + .08, s > 0 ? zb : za], [s * (w * tp + .04), yT + .08, s > 0 ? za : zb], [k * .7, .43, k * .7 + 1, 1]); } }
    Ge.quad([-w, y0, l2], [w, y0, l2], [w * tp, yT, l2], [-w * tp, yT, l2], [0, 0, 1, 1], [.85, .85, 1, 1]); Ge.quad([w, y0, -l2], [-w, y0, -l2], [-w * tp, yT, -l2], [w * tp, yT, -l2], [0, 0, 1, 1], [.8, .8, .95, .95]);
    if (train) { for (const z of [-len * .32, len * .32]) { Gu.box(w * 1.7, .75, 2.6, 0, .12, z, { m: 2 }); for (const s of [-1, 1]) for (const dz of [-.8, .8]) Gw.quad([s * (w * .85 + .02), .02, z + dz - .42], [s * (w * .85 + .02), .02, z + dz + .42], [s * (w * .85 + .02), .86, z + dz + .42], [s * (w * .85 + .02), .86, z + dz - .42]); } Gu.box(w * 1.2, .3, len * .5, 0, .6, 0, { m: 2 }); }
    else { Gu.box(w * 1.84, y0 - .12, len * .97, 0, .14, 0, { m: 2, top: false }); for (const s of [-1, 1]) for (const z of [l2 - 1.9, -l2 + 2.1]) Gw.quad([s * (w + .02), -.08, z - .5], [s * (w + .02), -.08, z + .5], [s * (w + .02), .92, z + .5], [s * (w + .02), .92, z - .5]); }
    const g = B.group(); g.userData = { len, w: w * 2, h: yT }; return g; }

  // 信号（たおれかけ）。h, arm（うでの長さ。0 で柱に直づけ）, lean（かたむき。ラジアン）, leanX, ivy    標識。kind（R.tex.roadSign と同じ）, h, lean
  function signal(o = {}) { const h = o.h || 5.4, arm = o.arm ?? 3, sd = o.seed || 0, B = parts(), pt = tex.rust({ paint: o.c || '#8a9a92', peel: .5, panel: 0, seed: sd % 2, m: 1.5 }), Gp = B.g(pt).smooth(1), Gb = B.g(pt), Gh = B.g(tex.signal({ seed: sd % 2 })), M = TR(0, 0, 0, 0, o.leanX || 0, o.lean ?? -.2);
    Gp.at(M).loft(6, [[-.4, .15, .15, 0, .8], [.5, .11, .11, .4, .92], [h, .075, .075, h / 1.5, 1]], { cap: 'top' });
    const head = (x, y) => { const a = .62, b = .22, e = .15; Gh.at(M).quad([x - a, y - b, e], [x + a, y - b, e], [x + a, y + b, e], [x - a, y + b, e]).quad([x + a, y - b, -e], [x - a, y - b, -e], [x - a, y + b, -e], [x + a, y + b, -e]); Gb.at(M).box(a * 2, b * 2, e * 2 - .02, x, y - b, 0, { m: 1.5 }); };
    if (arm) { Gb.at(M).box(arm, .09, .09, arm / 2, h - .55, 0, { m: 1.5 }); head(arm - .5, h - .98); } else head(0, h - .7); if (o.walk) { Gb.at(M).box(.34, .7, .3, .28, 2.5, 0, { m: 1.5 }); }
    if (o.ivy ?? 1) { const Gi = B.g(tex.ivy({ from: 'bottom', amount: .75, flowers: .4, seed: sd % 2 }), {}); for (const ry of [0, 1.57]) Gi.at(M.clone().multiply(TR(0, 0, 0, ry))).quad([-.5, -.1, 0], [.5, -.1, 0], [.5, 2.6, 0], [-.5, 2.6, 0], [.1 + ry, 0, .43 + ry, .9]); }
    return B.group(); }
  function sign(o = {}) { const h = o.h || 2.6, B = parts(), M = TR(0, 0, 0, 0, o.leanX || 0, o.lean ?? .16); B.g(tex.rust({ paint: '#b8bcc0', peel: .5, panel: 0, m: 1.5 })).smooth(1).at(M).loft(5, [[-.3, .045, .045, 0, .8], [h, .04, .04, h / 1.5, 1]], { cap: 'top' });
    B.g(tex.roadSignOld({ kind: o.kind, seed: o.seed }), { side: true }).at(M).quad([-.36, h - .7, .05], [.36, h - .7, .05], [.36, h + .02, .05], [-.36, h + .02, .05]); return B.group(); }
  // 電柱。h, lean, leanX, arms, trans（変圧器）, ivy   userData.tips = 電線をつなぐ点     たれた電線  P.wire([x,y,z], [x,y,z], { sag（たるみ m）, n, w })
  function pole(o = {}) { const h = o.h || 8.5, sd = o.seed || 0, B = parts(), M = TR(0, 0, 0, 0, o.leanX || 0, o.lean ?? .08), Gp = B.g(tex.concrete({ c: '#a89e8c', moss: .35, crack: .3, m: 2, seed: sd % 2 })).smooth(1), Gr = B.g(tex.rust({ panel: 0, m: 1.5 })), tips = [], V = new THREE.Vector3();
    Gp.at(M).loft(6, [[-.4, .2, .2, 0, .8], [h, .13, .13, h / 2, 1]], { cap: 'top' });
    [[h - .5, 2.3], [h - 1.3, 1.7]].slice(0, o.arms ?? 2).forEach(([y, L]) => { Gr.at(M).box(L, .1, .1, 0, y, 0, { m: 1.5 }); for (const s of [-1, 1]) { Gr.box(.07, .2, .07, s * (L / 2 - .1), y + .1, 0, {}); tips.push(V.set(s * (L / 2 - .1), y + .3, 0).applyMatrix4(M).toArray()); } });
    if (o.trans ?? true) B.g(tex.rust({ paint: '#93a0a4', peel: .5, m: 1.5, seed: sd % 2 })).smooth(2).at(M).loft(8, [[h - 3.3, .3, .3, 0, .85, .42, 0], [h - 2.3, .3, .3, .66, 1, .42, 0]], { cap: 'both', ur: 1 });
    if (o.ivy ?? 1) { const Gi = B.g(tex.ivy({ from: 'bottom', amount: .8, flowers: .3, seed: sd % 2 }), {}); for (const ry of [0, 1.57]) Gi.at(M.clone().multiply(TR(0, 0, 0, ry))).quad([-.6, -.1, 0], [.6, -.1, 0], [.6, 3.4, 0], [-.6, 3.4, 0], [.2 + ry, 0, .6 + ry, 1]); }
    const g = B.group(); g.userData = { h, tips }; return g; }
  function wire(a, b, o = {}) { const sag = o.sag ?? 1.4, n = o.n || 6, w = o.w || .05, G = geo().normal([0, 1, 0]), pt = k => { const u = k / n; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * sag, a[2] + (b[2] - a[2]) * u]; };
    for (let k = 0; k < n; k++) { const p = pt(k), q = pt(k + 1), dx = q[0] - p[0], dz = q[2] - p[2], l = Math.hypot(dx, dz) || 1, ex = -dz / l * w, ez = dx / l * w; G.quad([p[0], p[1] - w, p[2]], [q[0], q[1] - w, q[2]], [q[0], q[1] + w, q[2]], [p[0], p[1] + w, p[2]]).quad([p[0] - ex, p[1], p[2] - ez], [q[0] - ex, q[1], q[2] - ez], [q[0] + ex, q[1], q[2] + ez], [p[0] + ex, p[1], p[2] + ez]); }
    const me = G.mesh(tex.rust({ c: '#4c4854', panel: 0, m: 1 }), { side: true }); me.castShadow = false; return me; }
  // 自動販売機。c, lean, leanX, ivy    ベンチ。w, c, broken    看板。w, h, legs（足の高さ）, kind, c, c2, peel, lean    さびた金あみのフェンス。len, h, lean, gap 0〜1（ぬけ）, ivy 0〜1, holes
  function vending(o = {}) { const sd = o.seed || 0, c = o.c || '#d8dccf', B = parts(), M = TR(0, 0, 0, 0, o.leanX ?? -.05, o.lean ?? .05);
    B.g(tex.rust({ paint: c, peel: .3, c: '#b8744a', panel: 0, seed: sd % 2 })).at(M).box(1, 1.9, .7, 0, 0, 0, { m: 2 }); B.g(tex.vend({ c, seed: sd % 2 })).at(M).quad([-.5, 0, .36], [.5, 0, .36], [.5, 1.9, .36], [-.5, 1.9, .36]);
    if (o.ivy ?? 1) { B.g(tex.ivy({ amount: .7, flowers: .5, seed: sd % 2 }), { offset: true }).at(M).quad([-.56, .8, .38], [.3, .8, .38], [.3, 1.96, .38], [-.56, 1.96, .38], [0, .4, .45, 1]).quad([-.52, .7, -.36], [-.52, .7, .37], [-.52, 1.96, .37], [-.52, 1.96, -.36], [.5, .35, .9, 1]); B.g(tex.ivy({ from: 'all', amount: .6, seed: sd % 2 }), { offset: true }).at(M).quad([-.52, 1.93, .37], [.52, 1.93, .37], [.52, 1.93, -.37], [-.52, 1.93, -.37], [0, 0, .5, .4]); }
    return B.group(); }
  function bench(o = {}) { const w = o.w || 1.7, B = parts(), Gw = B.g(T.planks({ c: o.c || '#93a384' })), Gr = B.g(tex.rust({ panel: 0, m: 1 }));
    for (const [y, z, rx, rz] of [[.44, .13, 0, 0], [.44, -.07, 0, 0], [.7, -.24, -1.3, 0], [.92, -.3, -1.3, o.broken === false ? 0 : .2]]) Gw.at(TR(0, y, z, 0, rx, rz)).box(w, .05, .17, 0, 0, 0, { m: 1.4, bottom: true });
    Gr.at(null); for (const s of [-1, 1]) { Gr.box(.06, .44, .44, s * (w / 2 - .15), 0, 0, { top: false }); Gr.box(.06, .6, .06, s * (w / 2 - .15), .44, -.27, {}); } return B.group(); }
  function billboard(o = {}) { const w = o.w || 5, h = o.h || 2.5, legs = o.legs ?? 4, sd = o.seed || 0, B = parts(), M = TR(0, 0, 0, 0, o.leanX ?? .07, o.lean ?? .05);
    B.g(tex.panel({ kind: o.kind, c: o.c, c2: o.c2, peel: o.peel, seed: sd % 3 })).at(M).quad([-w / 2, legs, .09], [w / 2, legs, .09], [w / 2, legs + h, .09], [-w / 2, legs + h, .09]); B.g(tex.rust({ seed: sd % 2 })).at(M).box(w, h, .16, 0, legs, 0, { m: 2 });
    if (legs) { const Gt = B.g(tex.truss({ seed: sd % 2 }), { side: true }); for (const s of [-1, 1]) for (const ry of [0, 1]) Gt.at(M.clone().multiply(TR(s * w * .3, 0, -.12, ry * Math.PI / 2))).quad([-.3, -.3, 0], [.3, -.3, 0], [.3, legs + .1, 0], [-.3, legs + .1, 0], [0, 0, 1, Math.round((legs + .4) / 1.2)]); }
    if (o.ivy ?? 1) B.g(tex.ivy({ amount: .6, flowers: .3, seed: sd % 2 }), { offset: true }).at(M).quad([-w / 2, legs + h - 2.2, .12], [-w / 2 + 2.4, legs + h - 2.2, .12], [-w / 2 + 2.4, legs + h + .15, .12], [-w / 2, legs + h + .15, .12], [0, .2, .8, 1]);
    const g = B.group(); g.userData = { top: legs + h }; return g; }
  function fence(o = {}) { const len = o.len || 8, h = o.h || 1.8, sd = o.seed || 0, n = Math.max(1, Math.round(len / 2)), st = len / n, ln = o.lean ?? .3, iv = o.ivy ?? .5, B = parts(), Gc = B.g(tex.chain({ seed: sd % 2, holes: o.holes }), { side: true }), Gp = B.g(tex.rust({ panel: 0, m: 1 })).smooth(1), Gi = iv ? B.g(tex.ivy({ from: 'bottom', amount: .75, flowers: o.flowers ?? .5, seed: sd % 2 }), {}) : null, L = k => (hash(k, 1, sd) - .5) * ln;
    for (let k = 0; k <= n; k++) { const x = -len / 2 + k * st, l0 = L(k), l1 = L(k + 1), t0 = [x, h * Math.cos(l0), h * Math.sin(l0)], t1 = [x + st, h * Math.cos(l1), h * Math.sin(l1)]; Gp.at(TR(x, 0, 0, 0, l0, 0)).loft(4, [[-.2, .045, .045, 0, .8], [h + .06, .04, .04, h, 1]], { cap: 'top' }); Gp.at(null); if (k === n || hash(k, 2, sd) < (o.gap ?? .15)) continue;
      Gc.quad([x, 0, 0], [x + st, 0, 0], t1, t0, [k, 0, k + st / 2, 1]); if (Gi && hash(k, 3, sd) < iv) { const r = hash(k, 4, sd); Gi.quad([x, 0, .04], [x + st, 0, .04], [t1[0], t1[1] * .98, t1[2] * .98 + .04], [t0[0], t0[1] * .98, t0[2] * .98 + .04], [r, 0, r + st / 3, .72]); } }
    return B.group(); }
  // 売店（つたのからむ、ひさしつきの小屋。正面は +z）。w, d, h, c（かべ）, c2（ひさし・屋根）, kind（看板の模様）, ivy, torn
  function kiosk(o = {}) { const w = o.w || 3.2, d = o.d || 2.2, h = o.h || 2.5, sd = o.seed || 0, c = o.c || '#e8dcc0', c2 = o.c2 || '#e0705a', B = parts(), a = w / 2, b = d / 2;
    const Gw = B.g(tex.rust({ paint: c, peel: o.peel ?? .2, c: '#b8744a', seed: sd % 2 })), Gt = B.g(tex.rust({ paint: c2, peel: .3, panel: 0, seed: (sd + 1) % 2 }));
    Gw.box(w, h, .12, 0, 0, -b + .06, { m: 2, c0: .85 }); for (const s of [-1, 1]) Gw.box(.12, h, d, s * (a - .06), 0, 0, { m: 2, c0: .85 }); Gw.box(w - .24, 1, .14, 0, 0, b - .07, { m: 2, c0: .85 }); Gt.box(w - .1, .08, .5, 0, 1, b - .12, { m: 2, bottom: true }); Gt.box(w + .5, .14, d + .5, 0, h, 0, { m: 2, bottom: true });
    B.g(tex.concrete({ c: '#7c8496', moss: .15, crack: .3 })).quad([-a + .12, 0, -b + .13], [a - .12, 0, -b + .13], [a - .12, h, -b + .13], [-a + .12, h, -b + .13], [0, 0, 1, .8], [.7, .7, .9, .9]); B.g(T.goods(), { offset: true }).quad([-a + .4, 1.15, -b + .15], [a - .4, 1.15, -b + .15], [a - .4, 2.1, -b + .15], [-a + .4, 2.1, -b + .15], [0, 0, Math.round(w - .8), 1], .9);
    B.g(tex.stripes({ c: c2, torn: o.torn ?? .35, seed: sd % 2 }), { side: true }).quad([-a - .2, h - .75, b + 1.15], [a + .2, h - .75, b + 1.15], [a + .2, h + .02, b + .2], [-a - .2, h + .02, b + .2], [0, 0, (w + .4) / 2, 1]);
    const sw = w * .36, sy = h + .14; B.g(tex.panel({ kind: o.kind || 'sun', c2, seed: sd % 3, peel: .3 })).quad([-sw, sy, b - .1], [sw, sy, b - .1], [sw, sy + sw, b - .1], [-sw, sy + sw, b - .1]); Gw.quad([sw, sy, b - .14], [-sw, sy, b - .14], [-sw, sy + sw, b - .14], [sw, sy + sw, b - .14], [0, 0, sw, sw / 2]);
    if (o.ivy ?? 1) { const Gi = B.g(tex.ivy({ amount: o.ivy ?? .75, flowers: .45, seed: sd % 2 }), { offset: true }), s = sd % 2 ? 1 : -1; Gi.quad([s * (a + .03), h - 2.4, s * b], [s * (a + .03), h - 2.4, -s * b], [s * (a + .03), h + .3, -s * b], [s * (a + .03), h + .3, s * b], [0, 0, .8, 1]).quad([-a - .3, h - 1.3, b + .3], [-a + 1.5, h - 1.3, b + .3], [-a + 1.5, h + .3, b + .3], [-a - .3, h + .3, b + .3], [.2, .45, .8, 1]);
      B.g(tex.ivy({ from: 'all', amount: .7, flowers: .5, seed: sd % 2 }), { offset: true }).quad([-a - .25, h + .16, b + .25], [a + .25, h + .16, b + .25], [a + .25, h + .16, -b - .25], [-a - .25, h + .16, -b - .25], [0, 0, 1.2, .9]); }
    const g = B.group(); g.userData = { w, d, h }; return g; }
  // すべり台（-z にはしご、+z へすべる）。c, c2
  function slide(o = {}) { const c = o.c || '#e8b84a', c2 = o.c2 || '#5a9ac0', B = parts(), Gp = B.g(tex.rust({ paint: c, peel: .45, panel: 0 })), Gs = B.g(tex.rust({ paint: c2, peel: .4, panel: 0, seed: 1 }), { side: true }), ph = 1.7, e = .38;
    for (const sx of [-1, 1]) { for (const sz of [-1, 1]) Gp.box(.08, ph + .8, .08, sx * .42, 0, sz * .42, { m: 2 }); Gp.box(.05, .05, .9, sx * .42, ph + .75, 0, { m: 2 }); Gs.quad([sx * e, .28, 3.5], [sx * e, .5, 3.5], [sx * e, ph + .22, .45], [sx * e, ph, .45], [0, 0, 1.7, .11]); }
    Gp.box(.92, .08, .92, 0, ph, 0, { m: 2, bottom: true }); Gs.quad([-e, .28, 3.5], [e, .28, 3.5], [e, ph, .45], [-e, ph, .45], [0, 0, .38, 1.7]); Gs.quad([-e, .28, 4.1], [e, .28, 4.1], [e, .28, 3.5], [-e, .28, 3.5], [0, 0, .38, .3]); Gp.box(.08, .28, .08, 0, 0, 3.9, {});
    B.g(tex.truss({ kind: 'ladder', paint: c }), { side: true }).quad([-.75, 0, -1.2], [.75, 0, -1.2], [.75, ph, -.46], [-.75, ph, -.46], [0, 0, 1, 1.4]); return B.group(); }

  // 観覧車（止まっている。x-y の面に立つ）。r, n（かごの数）, c（鉄骨に残るペンキ）, fc（かごの色）, rot（止まった角度）, missing 0〜1（落ちたかご）, live（true で動かせる：userData.spin(角度)・userData.tick(t) でかごがゆれる）
  function ferris(o = {}) { const r = o.r || 9, n = o.n || 10, sd = o.seed || 0, c = o.c || '#ece4cc', hubY = r + 1.7, fc = o.fc || ['#e2705a', '#f0c050', '#5a9ac0', '#7ab86a', '#ece4d4', '#c88ab8'], Bw = parts(), Bs = parts(), wheel = new THREE.Group(), pivots = [], rot = o.rot ?? .13; wheel.position.y = hubY; wheel.rotation.z = rot;
    const Gt = Bw.g(tex.truss({ kind: 'beam', paint: c, seed: sd % 2 }), { side: true }), Gp = Bw.g(tex.rust({ paint: c, peel: .45, panel: 0, seed: sd % 2 })), P = (a, rr, z) => [Math.cos(a) * rr, Math.sin(a) * rr, z], sl = Math.max(1, Math.round(TAU * r / n / 1.3)), sn = Math.max(2, Math.round(r / 1.1));
    for (let k = 0; k < n; k++) { const a0 = k / n * TAU, a1 = (k + 1) / n * TAU, ex = -Math.sin(a0) * .5, ey = Math.cos(a0) * .5;
      for (const z of [-.72, .72]) { Gt.quad(P(a0, r - 1.25, z), P(a0, r, z), P(a1, r, z), P(a1, r - 1.25, z), [0, 0, 1, sl]); Gt.quad([Math.cos(a0) * .5 - ex, Math.sin(a0) * .5 - ey, z], [Math.cos(a0) * .5 + ex, Math.sin(a0) * .5 + ey, z], [Math.cos(a0) * (r - 1.2) + ex, Math.sin(a0) * (r - 1.2) + ey, z], [Math.cos(a0) * (r - 1.2) - ex, Math.sin(a0) * (r - 1.2) - ey, z], [0, 0, 1, sn]); }
      Gp.at(TR(...P(a0, r - .3, 0))).box(.09, .09, 1.5, 0, -.045, 0, { m: 2 }); Gp.at(null);
      if (hash(k, 1, sd) < (o.missing ?? .12)) continue; const pv = new THREE.Group(); pv.position.set(...P(a0, r - .3, 0)); pv.rotation.z = -rot;
      const cab = geo().smooth(0).px(0, 27, 4, 4, 32, 32).box(.06, .5, .06, 0, -.5, 0, { top: false }).rect().loft(6, [[-2.1, .46, .46, 0, .8], [-1.92, .64, .64, .1, .9], [-1.42, .67, .67, .46, 1], [-.92, .67, .67, .84, 1], [-.78, .74, .74, .88, 1.05], [-.5, .12, .12, 1, 1.1]], { ur: 6, cap: 'both' }).mesh(tex.gondola({ c: fc[k % fc.length], seed: k % 2 })); pv.add(cab); wheel.add(pv); pivots.push(pv); }
    Gp.smooth(1).at(TR(0, 0, -.95, 0, Math.PI / 2)).loft(8, [[0, .75, .75, 0, .9], [1.9, .75, .75, .95, 1]], { cap: 'both', ur: 2 }); wheel.add(Bw.group());
    const Ls = Bs.g(tex.truss({ kind: 'beam', paint: c, seed: (sd + 1) % 2 }), { side: true }), ln = Math.round(Math.hypot(r * .5, hubY) / 1.3); for (const z of [-1.2, 1.2]) for (const s of [-1, 1]) Ls.quad([s * r * .5 - .65, 0, z * 1.5], [s * r * .5 + .65, 0, z * 1.5], [.6, hubY, z], [-.6, hubY, z], [0, 0, 1, ln]);
    Bs.g(tex.rust({ paint: c, peel: .5, panel: 0 })).box(.32, .32, 2.9, 0, hubY - .16, 0, { m: 2 }); Bs.g(tex.concrete({ moss: .65, seed: sd % 3 })).box(r * 1.15, .35, 3.6, 0, 0, 0, { m: 3 }).box(r * .5, .35, 1.6, 0, 0, 2.5, { m: 3, c1: .95 });
    const g = grp(Bs.group(), wheel); if (o.live) wheel.userData.dyn = true;
    g.userData = { wheel, pivots, hubY, r, spin: a => { wheel.rotation.z = a; for (const p of pivots) p.rotation.z = -a; }, tick: t => pivots.forEach((p, i) => { p.rotation.z = -wheel.rotation.z + Math.sin(t * .8 + i * 1.7) * .05; }) }; return g; }

  // メリーゴーランド（止まっている）。r, n（馬の数）, c, c2（屋根のしま）, fc（くらの色）, torn
  function carousel(o = {}) { const r = o.r || 4, n = o.n || 6, sd = o.seed || 0, c = o.c || '#e0705a', c2 = o.c2 || '#f0e8d0', fc = o.fc || ['#d8584a', '#4f9a8a', '#e2a83a'], B = parts();
    B.g(tex.rust({ paint: c, peel: .4, seed: sd % 2 })).loft(12, [[0, r + .15, r + .15, 0, .8], [.4, r, r, .2, 1]], { ur: 8 });
    const Gd = B.g(T.planks({ c: '#b0a082' })); for (let k = 0; k < 12; k++) { const a0 = k / 12 * TAU, a1 = (k + 1) / 12 * TAU, p = a => [Math.cos(a) * r, .4, -Math.sin(a) * r], u = q => [q[0] / 3, -q[2] / 3]; Gd.tri([0, .4, 0], p(a0), p(a1), [0, 0], u(p(a0)), u(p(a1)), 1); }
    B.g(tex.panel({ kind: 'dots', c: c2, c2: c, peel: .3, seed: sd % 3 })).smooth(1).loft(8, [[.4, .85, .85, 0, .9], [3.25, .75, .75, 1, 1]], { ur: 3 });
    B.g(tex.stripes({ c, c2, torn: o.torn ?? .25, seed: sd % 2 }), { side: true }).smooth(0).loft(12, [[3.1, r + .35, r + .35, 0, .95], [4.5, .25, .25, 1, 1.12]], { ur: 3 });
    B.g(tex.rust({ paint: c, peel: .3, panel: 0, seed: (sd + 1) % 2 })).loft(12, [[2.72, r + .37, r + .37, 0, .85], [3.1, r + .37, r + .37, .19, 1]], { ur: 8 });
    const Gm = B.g(tex.rust({ paint: '#e6c460', peel: .3, panel: 0, m: 1 })).smooth(1); Gm.loft(6, [[4.5, .25, .25, 0, 1], [4.78, .32, .32, .3, 1], [5.15, .03, .03, .6, 1.1]], {});
    const pl = [...Array(n)].map((_, k) => { const a = k / n * TAU + .2, x = Math.cos(a) * r * .72, z = -Math.sin(a) * r * .72; Gm.loft(5, [[.4, .04, .04, 0, .9, x, z], [3.2, .04, .04, 2.8, 1, x, z]], {}); return [a, x, z]; }), g = B.group();
    pl.forEach(([a, x, z], k) => { if (hash(k, 1, sd) < (o.missing ?? .15)) return; const hs = beast({ kind: 'horse', c2: fc[k % fc.length], s: .82 }); beastPose(hs, 'leap', k * 1.3); hs.position.set(x, .62 + (k % 2) * .4, z); hs.rotation.y = Math.atan2(-Math.sin(a), -Math.cos(a)); g.add(hs); });
    g.userData = { r, h: 5.15 }; return g; }

  // 自転車（前は +z）。c, basket
  function bike(o = {}) { const c = o.c || '#5aa0b8', B = parts(), Gf = B.g(tex.rust({ paint: c, peel: .2, panel: 0, m: 1 })), Gw = B.g(tex.spoke(), { side: true }), Gt = B.g(tex.rust({ c: '#4c4854', panel: 0, m: 1 })).smooth(1), wr = .33;
    const bar = (p, q, th = .04) => { const dy = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dy, dz); Gf.at(TR(0, p[0], p[1], 0, Math.atan2(dz, dy))).box(th, L, th, 0, 0, 0, { top: false }); };
    for (const z of [-.52, .52]) { Gt.at(TR(0, wr, z, 0, 0, Math.PI / 2)).loft(8, [[-.028, wr, wr, 0], [.028, wr, wr, 1]], {}); Gw.quad([0, 0, z - wr], [0, 0, z + wr], [0, wr * 2, z + wr], [0, wr * 2, z - wr]); }
    const Rr = [wr, -.52], F = [wr, .52], BB = [.3, -.06], S = [.8, -.22], H = [.88, .36], Hb = [.62, .42]; bar(Rr, BB); bar(BB, S); bar(Rr, [.72, -.2]); bar(BB, Hb); bar([.72, -.2], H); bar(Hb, [.95, .34]); bar(Hb, F);
    Gf.at(null).box(.5, .04, .04, 0, .94, .32, {}); Gt.smooth(0).at(null).box(.14, .05, .27, 0, .8, -.24, {}); Gt.box(.05, .06, .1, -.27, .93, .31, {}); Gt.box(.05, .06, .1, .27, .93, .31, {});
    if (o.basket ?? 1) B.g(T.crate({ kind: 'plain', c: '#c8b080' })).box(.34, .22, .26, 0, .7, .5, { taper: 1.12 }); return B.group(); }

  // ---- 生きもの ----
  // しか・犬・（メリーゴーランドの）馬。P.deer({ c, antlers, spots, s })  P.dog({ c, collar, s })  → Group（正面 +z、足もと y=0）。P.beastPose(動物, 'walk'/'run'/'graze'（草を食べる）/'stand'/'sit', t)
  const SPEC = { deer: { L: 1.0, rb: .2, leg: .68, neck: .46, lean: .55, head: .3, hr: .095, ear: .16, tail: .1, legR: .042 }, dog: { L: .56, rb: .135, leg: .3, neck: .17, lean: .6, head: .2, hr: .1, ear: .09, tail: .2, legR: .042 }, horse: { L: 1.0, rb: .24, leg: .6, neck: .46, lean: .6, head: .34, hr: .11, ear: .09, tail: .4, legR: .05 } };
  function beast(o = {}) { if (typeof o === 'string') o = { kind: o }; const kind = o.kind || 'deer', S = SPEC[kind], s = o.s || 1, t = tex.beast({ kind, c: o.c, belly: o.belly, c2: o.c2, collar: o.collar, spots: o.spots }), m = mat(t, { vc: true, smooth: true }), g = new THREE.Group(), root = new THREE.Group(), J = {}, W = 64, H = 32, L = S.L, rb = S.rb, hr = S.hr, RX = TR(0, 0, 0, 0, Math.PI / 2); root.scale.setScalar(s); g.add(root);
    const part = (G, parent, x, y, z, mm = m) => { const me = new THREE.Mesh(G.build(), mm); me.castShadow = true; const pv = new THREE.Group(); pv.position.set(x, y, z); pv.add(me); parent.add(pv); return pv; };
    J.body = part(geo().smooth(1).px(0, 0, 32, 32, W, H).at(RX).loft(6, [[-L * .5, rb * .5, rb * .6, 0, .9], [-L * .38, rb * .98, rb * 1.06, .14], [-L * .05, rb * .92, rb, .45], [L * .28, rb * 1.02, rb * 1.13, .78], [L * .5, rb * .58, rb * .72, 1]], { cap: 'both', rot: 0 }), root, 0, S.leg + rb * .5, 0);
    J.neck = part(geo().smooth(1).px(32, 16, 16, 16, W, H).loft(6, [[-.05, rb * .6, rb * .72, 0, .95], [S.neck, hr * .8, hr * .9, 1]], {}), J.body, 0, rb * .4, L * .4);
    const Gh = geo().smooth(1).px(32, 0, 16, 16, W, H).at(RX).loft(6, [[-hr * .9, hr * .5, hr * .55, 0, .95], [0, hr, hr * 1.02, .3], [S.head * .45, hr * .8, hr * .8, .6], [S.head, hr * .44, hr * .42, 1]], { cap: 'both', rot: 0 }).at(null).smooth(0).px(48, 0, 8, 12, W, H);
    for (const sx of [-1, 1]) { const a = [sx * hr * .8, hr * .55, -.02], b = [sx * hr * .3, hr * .85, -.02], c = kind === 'deer' ? [sx * (hr * .9 + S.ear * .7), hr * .6 + S.ear * .8, -.05] : [sx * hr * .62, hr * .8 + S.ear, .0]; Gh.tri(a, b, c, [0, 0], [1, 0], [.5, 1]).tri(b, a, c, [0, 0], [1, 0], [.5, 1], .75); }
    J.head = part(Gh, J.neck, 0, S.neck, 0);
    if (kind === 'deer' && o.antlers !== false) { const Ga = geo(); for (const sx of [-1, 1]) Ga.quad([sx * .03, hr * .7, -.02], [sx * .32, hr * .7, -.13], [sx * .32, hr * .7 + .42, -.13], [sx * .03, hr * .7 + .42, -.02], sx > 0 ? [0, 0, 1, 1] : [0, 0, 1, 1]); const am = new THREE.Mesh(Ga.build(), mat(tex.antler(), { vc: true, side: true })); am.castShadow = true; J.head.add(am); }
    const leg = (x, z) => part(geo().smooth(1).px(56, 0, 8, 16, W, H).loft(4, [[-S.leg, S.legR * .78, S.legR * .95, 0], [-S.leg * .5, S.legR * .7, S.legR * .82, .45], [0, S.legR * 1.5, S.legR * 1.9, 1]], { cap: 'bot' }), J.body, x, -rb * .5, z);
    J.fl = leg(rb * .55, L * .36); J.fr = leg(-rb * .55, L * .36); J.hl = leg(rb * .55, -L * .36); J.hr = leg(-rb * .55, -L * .36);
    J.tail = part(geo().smooth(1).px(48, 16, 16, 16, W, H).loft(4, [[0, kind === 'horse' ? .06 : .035, .035, 0], [S.tail, kind === 'dog' ? .03 : .02, .02, 1]], { cap: 'top' }), J.body, 0, rb * .6, -L * .47);
    g.userData = { J, kind, spec: S }; beastPose(g, 'stand', 0); return g; }
  function beastPose(g, pose = 'walk', t = 0) { const J = g.userData.J, S = g.userData.spec, dog = g.userData.kind === 'dog', sit = pose === 'sit', leap = pose === 'leap'; let a = 0, amp = 0, neck = S.lean, nod = 0, brx = 0, by = S.leg + S.rb * .5, look = 0;
    if (pose === 'walk' || pose === 'run') { a = Math.sin(t); amp = pose === 'walk' ? .5 : .85; by += Math.abs(Math.cos(t)) * (pose === 'walk' ? .015 : .05); nod = Math.sin(t * 2) * .04; neck += Math.sin(t) * .04; }
    else if (pose === 'graze') { neck = 2.5 + Math.sin(t * 1.3) * .05; nod = 1 + Math.sin(t * 5) * .05; brx = .1; }
    else if (sit) { brx = -.75; by = Math.sin(.75) * S.L * .5 + S.rb * .95; neck = 1.05; look = Math.sin(t * .5) * .4; }
    else if (leap) { brx = -.12; neck = .75; nod = .25; }
    else { look = Math.sin(t * .5) * .5; nod = Math.sin(t * .8) * .05; }
    J.body.position.y = by; J.body.rotation.x = brx; J.neck.rotation.x = neck; J.head.rotation.set(-(brx + neck) + nod, look, 0);
    J.fl.rotation.x = sit ? .75 : leap ? -.8 : a * amp; J.fr.rotation.x = sit ? .75 : leap ? -.5 : -a * amp; J.hl.rotation.x = sit ? -.75 : leap ? .7 : -a * amp; J.hr.rotation.x = sit ? -.75 : leap ? .45 : a * amp; J.fl.scale.y = J.fr.scale.y = sit ? 1.35 : 1;
    J.tail.rotation.set(dog ? -.55 : g.userData.kind === 'horse' ? -2.7 : -2.3, 0, dog ? Math.sin(t * (sit ? 7 : 1) + 1) * .5 : Math.sin(t * .7) * .15); }
  const deer = (o = {}) => beast({ kind: 'deer', ...o }), dog = (o = {}) => beast({ kind: 'dog', ...o });
  // 鳥の群れ（まるく飛びつづける）。n, r（輪の半径）, h（高さのはば）, c, s, speed, squash   毎コマ userData.tick(t)
  function flock(o = {}) { const n = o.n || 6, g = new THREE.Group(), bs = [], sq = o.squash ?? .6; for (let i = 0; i < n; i++) { const b = R.bird({ c: o.c || '#f4f0e8', neck: false, belly: '#ffffff', s: o.s || 1.8 }); g.add(b); bs.push(b); } g.userData.dyn = true;
    g.userData.tick = t => bs.forEach((b, i) => { const rr = (o.r || 12) * (1 + (hash(i, 1) - .5) * .5), a = t * (o.speed || .35) * (1 + (hash(i, 2) - .5) * .3) + i * .45 + hash(i, 3) * .8; b.position.set(Math.cos(a) * rr, Math.sin(t * .7 + i) * 1.2 + hash(i, 4) * (o.h ?? 3), Math.sin(a) * rr * sq); b.rotation.set(0, Math.atan2(-Math.sin(a), Math.cos(a) * sq), -.25); R.birdPose(b, 'fly', t + i * .37); }); g.userData.tick(0); return g; }
  // ちょう（光に舞う小さな板）。n, area: [x, y, z のはば], fc（色）, s   毎コマ userData.tick(t)
  function butterflies(o = {}) { const n = o.n || 6, fc = o.fc || ['#fff8d8', '#ffd86a', '#f8b0d0', '#b8d8ff'], A = o.area || [6, 1.6, 6], s = o.s || .09, g = new THREE.Group(), list = [], wt = tex.wing(), Gw = sx => geo().normal([0, 1, 0]).quad([0, 0, s], [sx * s * 1.25, 0, s], [sx * s * 1.25, 0, -s], [0, 0, -s]).build(), gl = Gw(1), gr = Gw(-1);
    for (let i = 0; i < n; i++) { const m = mat(wt, { glow: true, color: fc[i % fc.length], side: true }), b = new THREE.Group(), wl = new THREE.Mesh(gl, m), wr = new THREE.Mesh(gr, m); b.add(wl, wr); g.add(b); list.push([b, wl, wr]); } g.userData.dyn = true;
    const pos = (i, t) => { const p = hash(i, 5) * 9; return [(Math.sin(t * .31 + p) * .5 + Math.sin(t * .13 + p * 2) * .5) * A[0] / 2, .4 + (.5 + Math.sin(t * .9 + p) * .3 + Math.sin(t * 3.1 + p) * .1) * A[1], (Math.cos(t * .27 + p * 1.7) * .5 + Math.sin(t * .11 + p) * .5) * A[2] / 2]; };
    g.userData.tick = t => list.forEach(([b, wl, wr], i) => { const p = pos(i, t), q = pos(i, t + .2), f = .2 + Math.abs(Math.sin(t * 13 + i * 2)) * 1.15; b.position.set(...p); b.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2]); wl.rotation.z = f; wr.rotation.z = -f; }); g.userData.tick(0); return g; }

  // ---- 光 ----
  // 光のすじ（加算の半透明。3 枚の板を軸のまわりに組み、ふちをぼかしてあるので板に見えにくい）。w（はば）, h（高さ）, dx, dz（上のはしのずれ＝太陽の向き）, c, a（こさ）, n, spread   毎コマ userData.tick(t) でゆらぐ
  let shaftT = null;
  function shaft(o = {}) { if (!shaftT) { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const x = cv.getContext('2d'), im = x.createImageData(64, 128); for (let j = 0; j < 128; j++) for (let i = 0; i < 64; i++) { const u = i / 63, v = j / 127, pr = Math.sin(u * Math.PI) ** 1.6 * (.62 + .38 * Math.sin(u * 23) * Math.sin(u * 7 + 1)), vf = Math.min(1, v / .1) * (v < .55 ? 1 : Math.max(0, 1 - (v - .55) / .45) ** 1.3), q = Math.round(255 * cl(pr * vf)), k = (j * 64 + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = q; im.data[k + 3] = 255; } x.putImageData(im, 0, 0); shaftT = new THREE.CanvasTexture(cv); shaftT.colorSpace = THREE.SRGBColorSpace; }
    const w = o.w || 3, h = o.h || 12, dx = o.dx ?? -h * .35, dz = o.dz ?? 0, n = o.n || 3, sp = o.spread ?? 1.3, a0 = o.a ?? .3, m = new THREE.MeshBasicMaterial({ map: shaftT, color: o.c || '#fff0c0', transparent: true, opacity: a0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }), G = geo();
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI + .3, ex = Math.cos(a) * w / 2, ez = Math.sin(a) * w / 2; G.quad([-ex * sp, 0, -ez * sp], [ex * sp, 0, ez * sp], [dx + ex, h, dz + ez], [dx - ex, h, dz - ez]); }
    const me = new THREE.Mesh(G.build(), m); me.castShadow = me.receiveShadow = false; me.renderOrder = 5; me.frustumCulled = false; me.userData.dyn = true; me.userData.tick = t => { m.opacity = a0 * (.86 + Math.sin(t * .7 + (o.seed || 0) * 2.3) * .14); }; return me; }
  // 光の中のほこり・花粉の粒。n, area: [x, y, z のはば], c, size, a   毎コマ userData.tick(t)
  function motes(o = {}) { const n = o.n || 50, A = o.area || [8, 5, 8], pos = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: o.c || '#fff6c8', size: o.size || 1.3, sizeAttenuation: false, transparent: true, opacity: o.a ?? .8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); pts.frustumCulled = false; pts.userData.dyn = true;
    pts.userData.tick = t => { for (let i = 0; i < n; i++) { const p = hash(i, 1) * 50; pos[i * 3] = (hash(i, 3) - .5) * A[0] + Math.sin(t * .4 + p) * .4; pos[i * 3 + 1] = ((hash(i, 4) + t * (.02 + hash(i, 2) * .03)) % 1) * A[1]; pos[i * 3 + 2] = (hash(i, 5) - .5) * A[2] + Math.cos(t * .3 + p) * .4; } g.attributes.position.needsUpdate = true; }; pts.userData.tick(0); return pts; }
  // 花の群れ・草むら（R.tuft をまとめて置く）。n, r, fc, kinds, s
  function flowers(o = {}) { const n = o.n || 12, r = o.r || 2.5, sd = o.seed || 0, kinds = o.kinds || ['flower', 'flower', 'grass'], g = new THREE.Group(); for (let i = 0; i < n; i++) { const a = hash(i, 1, sd) * TAU, rr = r * Math.sqrt(hash(i, 2, sd)), tf = R.tuft({ kind: kinds[i % kinds.length], s: (o.s || .6) * (.75 + hash(i, 3, sd) * .6), fc: o.fc, c: o.c, seed: i % 3 }); tf.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr * (o.squash ?? 1)); tf.rotation.y = i * 1.3; g.add(tf); } return g; }
  // かべにはる つた・こけの板（正面 +z。かべから少しうかせて置く）。w, h, from, amount, flowers
  function ivy(o = {}) { const w = o.w || 3, h = o.h || 3, t = tex.ivy({ from: o.from, amount: o.amount ?? .7, flowers: o.flowers ?? .3, seed: o.seed, c: o.c }), G = geo(), nx = Math.max(1, Math.round(w / 3)); for (let i = 0; i < nx; i++) G.quad([-w / 2 + i * w / nx, 0, 0], [-w / 2 + (i + 1) * w / nx, 0, 0], [-w / 2 + (i + 1) * w / nx, h, 0], [-w / 2 + i * w / nx, h, 0], [i * w / nx / 3, 0, (i + 1) * w / nx / 3, 1]); const me = G.mesh(t, { offset: true }); me.castShadow = false; return me; }

  return { tex, paint, decal, building, wall, frame, pier, viaduct, column, arch, steps, mound, rubble, school, factory, tank, chimney, pylon, lighthouse, wreck, coach, signal, sign, pole, wire, vending, bench, billboard, fence, kiosk, slide, ferris, carousel, bike, beast, beastPose, deer, dog, flock, butterflies, shaft, motes, flowers, ivy };
};
