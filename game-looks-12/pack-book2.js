// 第 12 集「絵本の世界」の 06〜10 で使い回す部品。../game-looks-7/kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), B = PACK_BOOK2(THREE, K, R);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。決まりも同じ（足もとが y=0、正面が +z、大きさは m）。
//
// ■ 形
//   B.house({ w: 3, d: 3, h: 4, lean: .5（てっぺんが +x へ寄る m。負で -x）, leanZ: 0, bulge: .12（中ほどのふくらみ）, wall, roof, roofH: 3, roofLean: .8, eave: .35,
//             door（テクスチャ。false でなし）, win（テクスチャ）, wins: 1（前と横の窓の数）, lit: false（窓が光る）, chimney: true, brick, seed }) → Group
//       ゆがんだ絵本の家（かたむいて ふくらんだ 4 角の胴と、先の曲がった とんがり屋根）。箱の組み合わせではなく、輪をつないだ筒で作る。userData.top ＝ 屋根の先の位置 [x, y, z]
//   B.star({ s: 1, c: '#ffd84a', glow: true, face: false }) → Mesh   5 つの角の星（まん中がふくらんだ 立体。前後どちらも同じ）。face: true で ねむった顔を描く
//   B.puff({ s: 6, n: 5, c: '#f4f0ff', flat: .35, seed }) → Mesh   もこもこの雲（ふくらんだ玉を横にならべる。原点は雲の底のまん中あたり）
//   B.key({ s: 1, c: '#c8963a' }) → Group   ぜんまいのねじ（軸は y。y=0 がねじこむがわ。上に 2 つの輪の持ち手。回すときは group.rotation.y）。userData.h ＝ 高さ
//
// ■ テクスチャ  B.tex.名前({ c, seed, … })
//   star { c, face }（星の絵。32×32）   puff { c, seed, m }（雲の もこもこ。くり返せる 32×32）
window.PACK_BOOK2 = (THREE, K, R) => {
  const { hash } = K, { ramp, Px, geo, parts, TR } = R, T = R.tex, PI = Math.PI;
  const B = { tex: {} }, cache = new Map(), once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

  // ---- 星の絵：まん中が明るく、ふちが だいだいの 5 つの角。face で とじた目と ほほえみ ----
  B.tex.star = (o = {}) => once('star' + JSON.stringify(o), () => { const P = Px(32), C = ramp(o.c || '#ffd84a', 6, { contrast: .8 });
    const inStar = (x, y) => { const dx = x - 16, dy = y - 17, a = Math.atan2(dy, dx) + PI / 2, r = Math.hypot(dx, dy), k = Math.abs(((a / (2 * PI / 5)) % 1 + 1) % 1 - .5) * 2; return r < 6.5 + k * 9; };
    P.each((x, y) => { if (!inStar(x + .5, y + .5)) return null; const r = Math.hypot(x - 15, y - 15); return r < 4 ? C[5] : r < 8 ? C[4] : r < 11 ? C[3] : C[2]; });
    P.each((x, y, c) => c && (!inStar(x + 1.5, y + .5) || !inStar(x + .5, y + 1.5)) ? C[1] : undefined);
    if (o.face) { const d = ramp('#8a4a2a'); for (const ex of [12, 19]) { P.set(ex, 16, d[1]); P.set(ex + 1, 17, d[1]); P.set(ex + 2, 16, d[1]); } P.set(14, 20, d[2]); P.set(15, 21, d[1]); P.set(16, 21, d[1]); P.set(17, 20, d[2]); P.set(11, 19, '#ffa0a0'); P.set(21, 19, '#ffa0a0'); }
    return T.from(P, { m: 1, cut: true }); });

  // ---- 星（10 の点をむすんだ平たい形。まん中だけ前後へ ふくらむ） ----
  B.star = (o = {}) => { const s = o.s || 1, th = s * .22, G = geo(), out = [];
    for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2, r = (k % 2 ? .42 : 1) * s; out.push([Math.sin(a) * r, Math.cos(a) * r]); }
    const uv = p => [.5 + p[0] / s * .47, .47 + p[1] / s * .47];
    for (const sz of [1, -1]) for (let k = 0; k < 10; k++) { const a = out[k], b = out[(k + 1) % 10], A = [a[0], a[1], 0], Bv = [b[0], b[1], 0], C = [0, 0, th * sz];
      if (sz > 0) G.tri(A, Bv, C, uv(a), uv(b), [.5, .47], [k % 2 ? .85 : 1.05, k % 2 ? 1.05 : .85, 1.15]); else G.tri(Bv, A, C, uv(b), uv(a), [.5, .47], [.8, .8, 1]); }
    const m = G.mesh(B.tex.star({ c: o.c, face: o.face }), { glow: o.glow !== false, cut: false, side: true }); m.castShadow = false; return m; };

  // ---- ゆがんだ家 ----
  B.house = (o = {}) => { const w = o.w || 3, d = o.d || 3, h = o.h || 4, lean = o.lean ?? .5, lz = o.leanZ || 0, bu = o.bulge ?? .12, sd = o.seed || 0, Q = Math.SQRT1_2;
    const wall = o.wall || T.plaster({ c: '#f0d8b0', seed: sd }), roof = o.roof || T.shingle({ c: '#c0504a', seed: sd }), P = parts();
    // 輪：[y, x の半はば, z の半はば, ずれ x, ずれ z]（面までの距離。4 角形の頂点はこれを √2 倍）
    const RG = [[0, w / 2, d / 2, 0, 0], [h * .5, w / 2 * (1 + bu), d / 2 * (1 + bu), lean * .35, lz * .35], [h, w / 2 * (1 + bu * .3), d / 2 * (1 + bu * .3), lean, lz]];
    const at = y => { for (let i = 0; i < RG.length - 1; i++) { const a = RG[i], b = RG[i + 1]; if (y <= b[0] || i === RG.length - 2) { const k = (y - a[0]) / (b[0] - a[0]); return a.map((v, j) => v + (b[j] - v) * k); } } };
    const ur = Math.max(1, Math.round((w + d) * 2 / 3));
    P.g(wall).smooth(0).loft(4, RG.map(([y, hx, hz, dx, dz], i) => [y, hx / Q, hz / Q, y / 3, [.78, .95, 1.05][i], dx, dz]), { ur });
    // 屋根：のき（少し外へ）から、先が曲がった とんがりへ
    const top = RG[2], eave = o.eave ?? .35, rh = o.roofH ?? 3, rl = o.roofLean ?? .8, ex = top[1] + eave, ez = top[2] + eave;
    const roofR = [[h - .15, ex / Q, ez / Q, 0, .75, top[3], top[4]], [h + rh * .38, ex * .62 / Q, ez * .62 / Q, .45, .95, top[3] + rl * .15, top[4]], [h + rh * .75, ex * .26 / Q, ez * .26 / Q, .8, 1.05, top[3] + rl * .55, top[4]], [h + rh, .04, .04, 1, 1.1, top[3] + rl, top[4]]];
    P.g(roof).smooth(1).loft(4, roofR, { ur: 4 });
    P.g(roof).smooth(0).tint(.55).loft(4, [[h - .15, ex / Q, ez / Q, 0, 1, top[3], top[4]], [h - .02, top[1] / Q, top[2] / Q, .1, 1, top[3], top[4]]], { ur: 4 }).tint(1);   // のきの うら
    // 面の上の点（side: 'f' 前 / 'l' -x / 'r' +x）。u は面の中の よこ位置（-1〜1）
    const onFace = (side, u, y, out = .03) => { const [, hx, hz, dx, dz] = at(y); if (side === 'f') return [dx + u * hx, y, dz + hz + out]; if (side === 'b') return [dx - u * hx, y, dz - hz - out]; const sx = side === 'r' ? 1 : -1; return [dx + sx * (hx + out), y, dz - sx * u * hz]; };
    const plate = (G, side, u, y0, y1, hw, uvr = [0, 0, 1, 1]) => { const p = (uu, y) => onFace(side, uu, y); const hxu = (y) => { const [, hx, hz] = at(y); return hw / (side === 'f' || side === 'b' ? hx : hz); };
      G.quad(p(u - hxu(y0), y0), p(u + hxu(y0), y0), p(u + hxu(y1), y1), p(u - hxu(y1), y1), uvr); };
    if (o.door !== false) plate(P.g(o.door || T.door({ style: 'plank', arch: true, c: '#7a4a3a' })).tint(1), 'f', (hash(sd, 3) - .5) * .5, 0, Math.min(2, h * .5), .5);
    const nw = o.wins ?? 1, wt = o.win || T.window({ lit: o.lit, curtain: o.lit ? '#f0c060' : '#f0e4d0', frame: '#5a3a2a', arch: hash(sd, 4) > .5 });
    const WG = P.g(wt, { glow: !!o.lit });
    const wy = Math.min(h - 1.2, Math.max(2.4, h * .62));
    for (const side of ['f', 'l', 'r', 'b']) { const n = side === 'f' ? nw : side === 'b' ? 0 : Math.max(1, nw - (w > d ? 1 : 0)); for (let i = 0; i < n; i++) { const u = n === 1 ? (side === 'f' ? .1 : 0) : (i / (n - 1) - .5) * 1.1; plate(WG, side, u, wy, wy + .9, .4); } }
    if (h > 5.5) for (const side of ['f', 'l', 'r']) plate(WG, side, side === 'f' ? -.45 : .2, 1.1, 2, .38);
    if (o.chimney !== false) { const cx = top[3] + top[1] * .5, cz = top[4] - top[2] * .2, cy = h + rh * .2; P.g(o.brick || T.brick({ c: '#a85a48', seed: sd })).smooth(0).loft(4, [[cy - .6, .32, .32, 0, .85, cx, cz], [cy + 1.1, .3, .3, .6, 1, cx + .1, cz], [cy + 1.5, .38, .38, .75, 1.08, cx + .18, cz]], { cap: 'top', ur: 1 }); }
    const g = P.group(); g.userData.top = [top[3] + rl, h + rh, top[4]]; g.userData.chimney = o.chimney !== false ? [top[3] + top[1] * .5 + .18, h + rh * .2 + 1.5, top[4] - top[2] * .2] : null; return g; };

  // ---- ぜんまいのねじ（軸は y。y=0 がねじこむがわ、上に 2 つの輪の持ち手。輪は xy 面） ----
  B.key = (o = {}) => { const s = o.s || 1, P = parts(), G = P.g(R.tex.metal({ c: o.c || '#c8963a' })).smooth(1), L = .9 * s, y0 = L + .2 * s;
    G.loft(6, [[0, .09 * s, .09 * s, 0, .8], [L, .09 * s, .09 * s, 2, 1], [L + .05 * s, .17 * s, .17 * s, 2.1, 1.1], [y0, .17 * s, .17 * s, 2.3, 1]], { cap: 'both' });
    const ring = (cx, cy, R0, th) => { const n = 12; for (let k = 0; k < n; k++) { const a0 = k / n * PI * 2, a1 = (k + 1) / n * PI * 2, p = (a, r, z) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z], uv = [k / n * 3, 0, (k + 1) / n * 3, 1];
        G.quad(p(a0, R0 - th, th * .5), p(a1, R0 - th, th * .5), p(a1, R0, th * .5), p(a0, R0, th * .5), uv, 1.05);
        G.quad(p(a1, R0 - th, -th * .5), p(a0, R0 - th, -th * .5), p(a0, R0, -th * .5), p(a1, R0, -th * .5), uv, .85);
        G.quad(p(a0, R0, th * .5), p(a1, R0, th * .5), p(a1, R0, -th * .5), p(a0, R0, -th * .5), uv, .95);
        G.quad(p(a1, R0 - th, th * .5), p(a0, R0 - th, th * .5), p(a0, R0 - th, -th * .5), p(a1, R0 - th, -th * .5), uv, .7); } };
    const rr = .42 * s; ring(-rr * .92, y0 + rr * .72, rr, .17 * s); ring(rr * .92, y0 + rr * .72, rr, .17 * s);
    const g = P.group(); g.userData.h = y0 + rr * 1.8; return g; };

  // ---- もこもこの雲の地：うろこ形の小さな ふくらみを打つ（くり返せる 32×32） ----
  B.tex.puff = (o = {}) => once('puff' + JSON.stringify(o), () => { const P = Px(32), C = ramp(o.c || '#f4f0ff', 6, { contrast: .55 }), sd = o.seed || 0;
    P.fill(C[3]); for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const cx = k * 8 + (r % 2) * 4 + hash(k, r, sd) * 2, cy = r * 8 + 4; for (let j = -5; j <= 4; j++) for (let i = -5; i <= 5; i++) { const d = Math.hypot(i, j * 1.1); if (d > 4.6) continue; P.set(cx + i, cy + j, d > 3.9 && j > 0 ? C[2] : j < -2 && i < 1 ? C[5] : j < 0 ? C[4] : C[3]); } }
    return T.from(P, { m: o.m || 2 }); });
  // ---- もこもこの雲（ふくらんだ玉をいくつか重ねる）。s: 大きさ, n: 玉の数, c: 色, flat: 下を平らに, seed ----
  B.puff = (o = {}) => { const s = o.s || 6, n = o.n || 5, sd = o.seed || 0, G = geo().smooth(1), flat = o.flat ?? .35;
    for (let i = 0; i < n; i++) { const u = n === 1 ? 0 : i / (n - 1) - .5, r = s * (.34 + hash(i, 1, sd) * .14) * (1 - Math.abs(u) * .7), cx = u * s * 1.15, cz = (hash(i, 2, sd) - .5) * s * .4, cy = r * (.5 + hash(i, 3, sd) * .3);
      const rings = [[-1, .55], [-.6, .9], [-.1, 1], [.4, .88], [.8, .55], [1, .08]].map(([t, k], j) => [cy + t * r * (t < 0 ? flat * 1.6 : .95), r * k, r * k * .85, j / 5 * 2, t < -.3 ? .72 : .82 + (t + 1) * .14, cx, cz]);
      G.loft(8, rings, { ur: 3, rot: hash(i, 4, sd) }); }
    const m = G.mesh(B.tex.puff({ c: o.c, seed: sd }), { fog: o.fog }); m.castShadow = false; return m; };

  return B; };
