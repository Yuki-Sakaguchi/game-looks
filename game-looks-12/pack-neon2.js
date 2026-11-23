// 第 12 集「ネオンの港町」（36〜40）で使い回す部品。../game-looks-7/kit.js・retro.js・../game-looks-8/pack-city.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), C = PACK_CITY(THREE, K, R), N = PACK_NEON2(THREE, K, R, C);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。足もとが y=0、正面が +z、大きさは m。
//
// ■ 考え方：積み重なった高い集合住宅（窓・鉄の格子・室外機・ほした せんたく物をテクスチャに打つ）と、通りへつき出す看板の林。
//   看板の文字は実在の字ではなく、部首ふうの形を組み合わせた「架空の漢字ふう」の記号（N.glyph）。店名も商品名も無い。
//   集合住宅の窓あかりは、同じ絵の「あかりの版」を emissiveMap にして、夜でも窓だけが光る（光に関係なく光る材質にはしない）。
//
// ■ テクスチャ
//   N.facade({ c（かべの色）, seed, lit: .35（あかりのつく窓のわり合い）, cage: .5（鉄の格子のわり合い）, ac: .5（室外機）, wash: .25（せんたく物）, tile: true（小さなタイル）, warm（あかりの色の組） })
//       → { map, lit }   128×128 ＝ 12 m 四方（3 m の階 × 4、3 m の間口 × 4）。lit は emissiveMap 用（窓のあかりだけ）
//   N.tex.sign({ n: 3, dir: 'v'/'h', style: 'neon'/'box', c, c2, bg, seed })   看板の面（架空の漢字ふうの記号 n 字。neon は暗い地に光る管、box は明るい地に こい字）
// ■ 形
//   N.tower({ w: 12, d: 10, h: 40, c, seed, lit, cage, ac, wash, roof: true, shops: false, fog: true }) → Group   高い集合住宅（屋上に水のタンク・アンテナ・小屋）。userData.h
//   N.sign({ n, dir, style, c, c2, bg, px: .045（1 ドットが何 m か）, arm: .35（かべからの はなれ）, flat: false（かべに平らに付ける）, flicker, seed }) → Group
//       つき出し看板。かべが z=0 で、+z の向きへ つき出す（面は x の両がわを向く）。flat: true なら +z を向いて かべに付く。userData = { w, h, c }
//   N.signs({ x0, x1, z: 0, y0: 3, y1: 12, n: 8, seed, cs: [色…], box: .4（箱の看板のわり合い）, horiz: .2（横書き）, reach: .8（つき出しの長さ）, flat: 0（かべに平らに付けるわり合い）, flick, px }) → Group   かべにそって看板をならべる（高さとつき出しをずらし、重ねる）。userData.lights（地面に焼く光）
//   N.coil({ r: .35, turns: 5, c }) → Group   うずまきの線香（つるす点が y=0。下へたれる円すい）。userData.tip ＝ 火のついた先
// ■ 人
//   N.folk(k, o) → R.actor の引数（港町の人。k で かみ型・服・色がかわる。o で上書き）
// ■ 毎コマ  N.tick(t)  を 1 回（ちらつく看板）
window.PACK_NEON2 = (THREE, K, R, C) => {
  const { hash, ramp, mix, Px, tone } = R, T = R.tex, X = C.tex, N = { tex: {} }, PI = Math.PI, live = [], cache = new Map();
  const memo = (k, f) => { let t = cache.get(k); if (!t) cache.set(k, t = f()); return t; };
  const reg = (o, f) => { o.userData.tick = f; o.userData.dyn = true; live.push(o); return o; };
  N.tick = t => { for (const o of live) o.userData.tick(t); };
  // ちらつき：ふだんは 1。ときどき数コマ消えかける
  const flick = (t, s) => { const k = Math.floor(t * 14), a = hash(k, s, 3), b = hash(Math.floor(t * 1.3), s, 5); return b > .72 ? (a > .55 ? .25 : a > .3 ? .6 : 1) : 1; };

  // ================= 1. 架空の漢字ふうの記号 =================
  // 部首ふうの形（単位の四角の中の線）。どれも実在の字にはしない。組み合わせ方で字らしく見せる
  const RAD = {
    box: [[.15, .18, .85, .18], [.85, .18, .85, .82], [.85, .82, .15, .82], [.15, .82, .15, .18]],
    sun: [[.2, .08, .8, .08], [.8, .08, .8, .92], [.8, .92, .2, .92], [.2, .92, .2, .08], [.2, .5, .8, .5]],
    field: [[.1, .12, .9, .12], [.9, .12, .9, .88], [.9, .88, .1, .88], [.1, .88, .1, .12], [.1, .5, .9, .5], [.5, .12, .5, .88]],
    cross: [[.08, .42, .92, .42], [.5, .05, .5, .95]],
    three: [[.22, .14, .78, .14], [.28, .5, .72, .5], [.08, .88, .92, .88]],
    tree: [[.1, .3, .9, .3], [.5, .04, .5, .96], [.5, .34, .12, .82], [.5, .34, .88, .82]],
    man: [[.62, .04, .18, .48], [.38, .28, .38, .98]],
    water: [[.2, .1, .36, .22], [.12, .42, .3, .54], [.1, .94, .36, .64]],
    earth: [[.24, .36, .76, .36], [.04, .9, .96, .9], [.5, .08, .5, .9]],
    roof: [[.5, 0, .5, .14], [.08, .24, .92, .24], [.08, .24, .08, .44], [.92, .24, .92, .38]],
    grass: [[.04, .34, .96, .34], [.3, .08, .3, .6], [.7, .08, .7, .6]],
    hook: [[.06, .1, .94, .1], [.56, .1, .56, .9], [.56, .9, .38, .78]],
    person: [[.5, .06, .12, .94], [.46, .36, .9, .94]],
    thread: [[.55, .04, .22, .34], [.22, .34, .62, .5], [.62, .5, .22, .74], [.22, .74, .82, .7], [.52, .72, .52, 1]],
    eye: [[.26, .04, .74, .04], [.74, .04, .74, .96], [.74, .96, .26, .96], [.26, .96, .26, .04], [.26, .36, .74, .36], [.26, .66, .74, .66]],
    rice: [[.06, .5, .94, .5], [.5, .04, .5, .96], [.2, .14, .34, .3], [.8, .14, .66, .3], [.46, .56, .12, .92], [.54, .56, .88, .92]],
    bend: [[.2, .06, .2, .9], [.2, .9, .9, .9], [.9, .9, .9, .7]],
    gate: [[.1, .04, .1, .98], [.9, .04, .9, .98], [.1, .06, .42, .06], [.58, .06, .9, .06], [.42, .06, .42, .3], [.58, .06, .58, .3], [.1, .3, .42, .3], [.58, .3, .9, .3]],
    dots: [[.3, .12, .3, .2], [.7, .12, .7, .2], [.14, .5, .86, .5], [.5, .5, .5, .96]],
  };
  const LEFT = ['man', 'water', 'tree', 'box', 'earth', 'thread', 'sun', 'eye'], TOP = ['roof', 'grass', 'three', 'box', 'cross', 'sun', 'dots'], ANY = Object.keys(RAD).filter(k => k !== 'gate');
  // M = { set(x, y) }。(x, y) から s ドットの四角に、seed で決まる 1 字を打つ
  N.glyph = (M, x, y, s, seed) => { const r = k => hash(seed, k, 31), pick = (L, k) => L[Math.floor(r(k) * L.length) % L.length];
    const draw = (name, x0, y0, x1, y1) => { for (const [a, b, c, d] of RAD[name]) { const ax = x + (x0 + a * (x1 - x0)) * (s - 1), ay = y + (y0 + b * (y1 - y0)) * (s - 1), bx = x + (x0 + c * (x1 - x0)) * (s - 1), by = y + (y0 + d * (y1 - y0)) * (s - 1), n = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)))); for (let i = 0; i <= n; i++) M.set(Math.round(ax + (bx - ax) * i / n), Math.round(ay + (by - ay) * i / n)); } };
    const ty = Math.floor(r(1) * 10);
    if (ty < 4) { draw(pick(LEFT, 2), 0, 0, .36, 1); draw(pick(ANY, 3), .44, 0, 1, 1); }
    else if (ty < 7) { draw(pick(TOP, 4), 0, 0, 1, .4); draw(pick(ANY, 5), .08, .48, .92, 1); }
    else if (ty < 8) { draw('gate', 0, 0, 1, 1); draw(pick(['three', 'dots', 'thread', 'water'], 6), .3, .42, .7, .9); }
    else if (ty < 9) { draw(pick(LEFT, 7), 0, 0, .3, 1); draw(pick(TOP, 8), .38, 0, 1, .44); draw(pick(ANY, 9), .4, .52, 1, 1); }
    else { draw(pick(['field', 'tree', 'rice', 'hook', 'eye'], 10), .04, .3, .96, 1); draw(pick(['roof', 'grass', 'dots'], 11), .1, 0, .9, .34); } };
  const Mask = (w, h) => { const d = new Uint8Array(w * h); return { d, w, h, set: (x, y, v = 1) => { if (x >= 0 && y >= 0 && x < w && y < h) d[y * w + x] = v; }, get: (x, y) => x >= 0 && y >= 0 && x < w && y < h ? d[y * w + x] : 0 }; };

  // ================= 2. 看板の面 =================
  const CELL = 20;
  N.tex.sign = (o = {}) => memo('sign' + JSON.stringify(o), () => {
    const n = o.n || 3, v = (o.dir || 'v') === 'v', st = o.style || 'neon', W = v ? 24 : CELL * n + 8, H = v ? CELL * n + 8 : 24, P = Px(W, H), M = Mask(W, H), sd = o.seed || 0; P.clip = true;
    for (let i = 0; i < n; i++) { const gx = v ? 4 : 6 + i * CELL, gy = v ? 6 + i * CELL : 4; N.glyph(M, gx, gy, 16, sd * 13 + i); }
    if (st === 'neon') {
      const c = o.c || '#ff5aa8', c2 = o.c2 || c, Bg = ramp(o.bg || '#1c1a34'), core = mix(c, '#ffffff', .72);
      P.each((x, y) => (x < 1 || y < 1) ? Bg[4] : (x > W - 2 || y > H - 2) ? Bg[0] : ((x + y * 3) % 9 === 0 ? Bg[3] : Bg[2]));
      // ふちの管（点線のように つぎ目をあける）
      for (let x = 2; x < W - 2; x++) if (x % 7 !== 6) { P.set(x, 2, c2); P.set(x, H - 3, c2); }
      for (let y = 2; y < H - 2; y++) if (y % 7 !== 6) { P.set(2, y, c2); P.set(W - 3, y, c2); }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (M.get(x, y)) { P.set(x, y, core); continue; }
        const n1 = M.get(x - 1, y) || M.get(x + 1, y) || M.get(x, y - 1) || M.get(x, y + 1), n2 = M.get(x - 1, y - 1) || M.get(x + 1, y + 1) || M.get(x + 1, y - 1) || M.get(x - 1, y + 1);
        if (n1) P.set(x, y, c); else if (n2) P.set(x, y, mix(c, Bg[2], .55)); }
    } else {
      // あかりの入った箱の看板：明るい地、こい字（1 ドット太らせる）、ふちの帯、まん中が明るい
      const B = ramp(o.bg || '#f4ecd0'), F = ramp(o.c || '#c8302a'), E = ramp(o.c2 || '#c8302a');
      P.each((x, y) => { const e = Math.min(x, y, W - 1 - x, H - 1 - y); if (e < 1) return E[1]; if (e < 3) return (x + y) % 6 === 0 ? E[5] : E[3]; if (e < 4) return B[2]; const k = Math.abs(x - W / 2) / W + Math.abs(y - H / 2) / H; return k < .3 ? B[5] : B[4]; });
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (M.get(x, y) || M.get(x - 1, y)) P.set(x, y, M.get(x, y) ? F[2] : F[1]);
    }
    return T.from(P, { m: 1 }); });

  // ================= 3. 集合住宅のかべ =================
  const WARM = ['#ffd27a', '#ffe8b0', '#e8f4ff', '#c8f0d0', '#ffc0a0', '#ffd8e8'];
  const CLOTH = ['#e8e4dc', '#5a7ab0', '#e89aa8', '#e8c45a', '#4f8f88', '#c8453a', '#f0f0f0', '#8a6ab0'];
  N.facade = (o = {}) => memo('fac' + JSON.stringify(o), () => {
    const P = Px(128), E = Px(128), A = ramp(o.c || '#8a8a9a', 6, { contrast: .8 }), G = ramp(o.glass || '#2a3450'), Mt = ramp(o.metal || '#8a90a4'), Ac = ramp('#c8c8bc', 6, { contrast: .8 }), sd = o.seed || 0, L = o.warm || WARM;
    E.fill('#000000');
    // かべ：小さなタイル（4 ドットごとの目地）と、雨のしみ
    P.each((x, y) => { const n = R.tn(x, y, 16, 32, 128, 128, sd), j = o.tile !== false && ((x & 3) === 3 || (y & 3) === 3); let t = n > .66 ? 4 : n < .3 ? 2 : 3; if (j) t -= .8; return tone(A, t); });
    for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 4; bx++) { const X0 = bx * 32, Y0 = fy * 32, h = k => hash(bx + sd * 7, fy + sd * 3, k), lit = h(1) < (o.lit ?? .35), cage = h(2) < (o.cage ?? .5), ac = h(3) < (o.ac ?? .5), wash = h(4) < (o.wash ?? .25), lc = L[Math.floor(h(5) * L.length) % L.length], acR = h(6) > .5;
      // 階のさかいの床板（上が光、下が影）
      for (let x = X0; x < X0 + 32; x++) { P.set(x, Y0, A[5]); P.set(x, Y0 + 1, A[4]); P.set(x, Y0 + 2, A[1]); }
      // 窓の下から たれる しみ
      for (let k = 0; k < 3; k++) { const sx = X0 + 6 + Math.floor(h(10 + k) * 20), len = 4 + Math.floor(h(13 + k) * 8); for (let j = 0; j < len; j++) if (hash(sx, j, sd) > .25) P.set(sx, Y0 + 23 + j, j < 3 ? A[1] : A[2]); }
      // 窓（ふち・ガラス・まん中のさん）
      const wx = X0 + 6, wy = Y0 + 8, ww = 20, wh = 14;
      for (let j = -1; j <= wh; j++) for (let i = -1; i <= ww; i++) { const x = wx + i, y = wy + j; if (i < 0 || j < 0 || i >= ww || j >= wh) { P.set(x, y, j === wh ? A[5] : Mt[1]); continue; }
        let c; if (lit) { const cur = h(7) > .5 ? i < 6 + Math.floor(h(8) * 6) : i > 14 - Math.floor(h(8) * 6), cc = mix(CLOTH[Math.floor(h(9) * CLOTH.length)], lc, .45); c = cur ? (j < 2 ? mix(cc, '#000', .25) : cc) : (j < 3 ? mix(lc, '#ffffff', .4) : lc); if (!cur && j === wh - 1 && hash(i, bx, fy + 9) > .6) c = mix(lc, '#2a2030', .7); E.set(x, y, cur ? mix(cc, '#000', .45) : c); }
        else c = (i + j * 2) % 23 < 3 ? G[3] : j < 3 ? G[2] : G[1];
        if (i === 10) { c = Mt[2]; E.set(x, y, '#000000'); } P.set(x, y, c); }
      // 鉄の格子（窓の外へはり出した かご）
      if (cage) { const cx0 = X0 + 3, cx1 = X0 + 28, cy0 = Y0 + 5, cy1 = Y0 + 24;
        for (let x = cx0; x <= cx1; x++) { for (const y of [cy0, cy1, Y0 + 15]) { P.set(x, y, Mt[4]); P.set(x, y + 1, Mt[1]); E.set(x, y, '#000000'); E.set(x, y + 1, '#000000'); } }
        for (let x = cx0; x <= cx1; x += 3) for (let y = cy0; y <= cy1; y++) { P.set(x, y, Mt[3]); E.set(x, y, '#000000'); if (x + 1 <= cx1) { P.mul(x + 1, y, .8); E.mul(x + 1, y, .7); } }
        for (let k = 0; k < 4; k++) { const px = cx0 + 2 + Math.floor(h(20 + k) * 22); P.set(px, cy1 - 1, hash(k, bx, 3) > .5 ? '#4a8a4a' : '#c8703a'); P.set(px + 1, cy1 - 1, '#3a6a3a'); P.set(px, cy1 - 2, '#5aa05a'); } }
      // 室外機（窓の下。しま の吹き出し口と、まるい ファン）
      if (ac) { const ax = X0 + (acR ? 18 : 3), ay = Y0 + 24, aw = 11, ah = 7;
        for (let j = 0; j < ah; j++) for (let i = 0; i < aw; i++) { const e = i === 0 || j === 0 ? 4 : i === aw - 1 || j === ah - 1 ? 1 : (Math.hypot(i - 7, j - 3.2) < 2.6 ? ((i + j) % 2 ? 1 : 2) : j % 2 ? 2 : 3); P.set(ax + i, ay + j, Ac[e]); E.set(ax + i, ay + j, '#000000'); }
        for (let j = 0; j < 6; j++) if (hash(ax, j, 2) > .3) P.set(ax + 2, ay + ah + j, j < 2 ? A[0] : A[1]); }
      // せんたく物（さおと、つるした服）
      if (wash) { for (let x = X0 + 1; x < X0 + 31; x++) P.set(x, Y0 + 4, Mt[4]); let x = X0 + 2; while (x < X0 + 28) { const w = 3 + Math.floor(hash(x, fy, sd + 5) * 3), hh = 4 + Math.floor(hash(x, fy, sd + 6) * 4), cc = ramp(CLOTH[Math.floor(hash(x, bx, sd + 7) * CLOTH.length)]); for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) P.set(x + i, Y0 + 5 + j, cc[i === 0 ? 4 : i === w - 1 ? 2 : 3]); x += w + 1 + Math.floor(hash(x, fy, 9) * 2); } }
    }
    return { map: T.from(P, { m: 12 }), lit: T.from(E, { m: 12 }) }; });

  // あかりの版つきの材質（窓だけ光る）
  const facMat = (o) => memo('fm' + JSON.stringify(o), () => { const F = N.facade(o), m = R.mat(F.map, { vc: true, smooth: true, em: JSON.stringify(o) }); m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = F.lit; m.emissiveIntensity = o.glow ?? 1; return m; });
  N.facadeMat = facMat;

  // ================= 4. 高い集合住宅 =================
  N.tower = (o = {}) => { const w = o.w || 12, d = o.d || 10, h = o.h || 40, sd = o.seed || 0, g = new THREE.Group(), fo = { c: o.c || '#8a8a9a', seed: sd % 5, lit: o.lit ?? .35, cage: o.cage ?? .5, ac: o.ac ?? .5, wash: o.wash ?? .25, glow: o.glow, warm: o.warm, tile: o.tile };
    const M = facMat(fo), G = R.geo(); G.box(w, h, d, 0, 0, 0, { m: 12, top: false }); g.add(G.mesh(M));
    const conc = X.conc({ c: mix(fo.c, '#6a6a78', .4) }), Rf = R.geo(); Rf.box(w + .3, .9, d + .3, 0, h, 0, { m: 3 }); Rf.box(w - .5, .1, d - .5, 0, h + .05, 0, { m: 3 }); g.add(Rf.mesh(conc));
    if (o.roof !== false) { const r = k => hash(sd, k, 41);
      const hut = R.geo(); hut.box(w * .3, 2.6, d * .35, (r(1) - .5) * w * .4, h + .9, (r(2) - .5) * d * .3, { m: 3 }); g.add(hut.mesh(X.tin({ c: ['#8a8a9a', '#6a7a8a', '#9a7a6a'][sd % 3], rust: .7 })));
      for (let k = 0; k < 2; k++) { const tk = C.tank({ r: .9 + r(3 + k) * .4, h: 2, c: ['#4f8f88', '#a8a49a', '#6f7f9a'][(sd + k) % 3] }); tk.position.set((k ? -1 : 1) * w * .3, h + .9, (r(5 + k) - .5) * d * .4); g.add(tk); }
      const at = X.antenna(), Am = R.mat(at, { side: true }); for (let k = 0; k < 2 + (sd % 3); k++) { const ah = 3 + r(8 + k) * 4, q = R.geo(), ax = (r(10 + k) - .5) * w * .8, az = (r(12 + k) - .5) * d * .7; q.quad([ax - .6, h + .9, az], [ax + .6, h + .9, az], [ax + .6, h + .9 + ah, az], [ax - .6, h + .9 + ah, az]); q.quad([ax, h + .9, az - .6], [ax, h + .9, az + .6], [ax, h + .9 + ah, az + .6], [ax, h + .9 + ah, az - .6]); g.add(q.mesh(Am)); } }
    if (o.shops) { const sw = R.geo(), n = Math.max(1, Math.round(w / 3)), kinds = ['goods', 'food', 'parts', 'goods'];
      for (let i = 0; i < n; i++) { const x0 = -w / 2 + i * w / n + .15, x1 = x0 + w / n - .3, sm = R.mat(X.shopwin({ kind: kinds[(i + sd) % 4], lit: 1 }), { glow: true }), q = R.geo(); q.quad([x0, .05, d / 2 + .03], [x1, .05, d / 2 + .03], [x1, 2.6, d / 2 + .03], [x0, 2.6, d / 2 + .03], [0, 0, Math.round((x1 - x0) / 1.5), 1.6 / 1.5 * 1.1]); g.add(q.mesh(sm)); }
      sw.box(w, .12, 1.2, 0, 2.9, d / 2 + .6, { m: 3 }); g.add(sw.mesh(X.tin({ c: o.awning || '#4f8f88', dir: 'h' }))); }
    g.userData.h = h; return g; };

  // ================= 5. 看板 =================
  const metal = () => X.plate({ c: '#5a5e74', n: 2 });
  N.sign = (o = {}) => { const tx = N.tex.sign({ n: o.n || 3, dir: o.dir || 'v', style: o.style || 'neon', c: o.c, c2: o.c2, bg: o.bg, seed: o.seed || 0 }), px = o.px || .045, W = tx.userData.w * px, H = tx.userData.h * px, g = new THREE.Group(), arm = o.arm ?? .35;
    let m = R.mat(tx, { glow: true }); if (o.flicker) { const f = m.onBeforeCompile; m = m.clone(); m.onBeforeCompile = f; }
    const B = R.geo(), F = R.geo(), mt = metal();
    if (o.flat) { F.quad([-W / 2, 0, .08], [W / 2, 0, .08], [W / 2, H, .08], [-W / 2, H, .08]); B.box(W + .1, H + .1, .06, 0, -.05, .02, { m: 3 }); }
    else { const z0 = arm, z1 = arm + W, t = .04;
      F.quad([t, 0, z1], [t, 0, z0], [t, H, z0], [t, H, z1]); F.quad([-t, 0, z0], [-t, 0, z1], [-t, H, z1], [-t, H, z0]);
      B.box(.06, H + .1, W + .1, 0, -.05, (z0 + z1) / 2, { m: 3 }); for (const y of [H * .15, H * .85]) B.box(.05, .05, arm + .05, 0, y, arm / 2, { m: 3 }); }
    const fm = F.mesh(m); fm.castShadow = false; g.add(fm, B.mesh(mt)); Object.assign(g.userData, { w: W, h: H, c: o.style === 'box' ? (o.bg || '#f4ecd0') : (o.c || '#ff5aa8') });
    if (o.flicker) { fm.userData.dyn = true; const s = (o.seed || 0) + 3; reg(fm, t => m.color.setScalar(flick(t, s))); } return g; };

  // かべにそって看板をならべる。かべは z（引数）、+z へつき出す
  const NC = ['#ff5aa8', '#4ae0f0', '#ffd060', '#7af09a', '#ff7a3a', '#b48aff'], BOX = [['#f4ecd0', '#c8302a', '#c8302a'], ['#ffd23a', '#2a2a5a', '#c8302a'], ['#e83a2a', '#fff4d0', '#ffd23a'], ['#f0f4ff', '#2a5aa8', '#2a5aa8'], ['#3a9a6a', '#fff4d0', '#ffd23a']];
  N.signs = (o = {}) => { const g = new THREE.Group(), n = o.n || 8, sd = o.seed || 0, x0 = o.x0 ?? -10, x1 = o.x1 ?? 10, y0 = o.y0 ?? 3, y1 = o.y1 ?? 12, cs = o.cs || NC, lights = [], r = k => hash(sd, k, 53);
    for (let i = 0; i < n; i++) { const box = r(i * 5) < (o.box ?? .4), dir = r(i * 5 + 1) < (o.horiz ?? .2) ? 'h' : 'v', nn = dir === 'h' ? 3 + Math.floor(r(i * 5 + 2) * 2) : 2 + Math.floor(r(i * 5 + 2) * 4), B = BOX[Math.floor(r(i * 5 + 3) * BOX.length)], c = cs[Math.floor(r(i * 5 + 4) * cs.length)];
      const flat = r(i * 17) < (o.flat || 0), s = N.sign(box ? { n: nn, dir, style: 'box', bg: B[0], c: B[1], c2: B[2], seed: sd * 31 + i, px: o.px || .05, arm: .3 + r(i * 7) * (o.reach ?? .8), flat } : { n: nn, dir, style: 'neon', c, c2: cs[(i + 2) % cs.length], seed: sd * 31 + i, px: o.px || .05, arm: .3 + r(i * 7) * (o.reach ?? .8), flat, flicker: r(i * 9) < (o.flick ?? .15) });
      const x = x0 + (i + .5) / n * (x1 - x0) + (r(i * 11) - .5) * (x1 - x0) / n * .6, y = y0 + r(i * 13) * (y1 - y0); s.position.set(x, y, o.z || 0); g.add(s);
      lights.push({ x, y: y + s.userData.h / 2, z: (o.z || 0) + .4 + s.userData.w / 2, c: s.userData.c, h: s.userData.h, w: s.userData.w }); }
    g.userData.lights = lights; return g; };

  // ================= 6. うずまきの線香 =================
  N.coil = (o = {}) => { const r = o.r || .35, n = o.turns || 5, g = new THREE.Group(), G = R.geo().smooth(1), tp = T.bark({ c: o.c || '#b8743a' }), pts = [];
    for (let i = 0; i <= n * 16; i++) { const u = i / (n * 16), a = u * n * PI * 2, rr = r * (1 - u * .88), y = -u * r * 1.6; pts.push([Math.cos(a) * rr, y, Math.sin(a) * rr]); }
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], tw = .018; G.quad([a[0], a[1] - tw, a[2]], [b[0], b[1] - tw, b[2]], [b[0], b[1] + tw, b[2]], [a[0], a[1] + tw, a[2]], [0, 0, .2, .1]); }
    const wire = R.geo(); for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; wire.quad([0, 0, 0], [0, 0, 0], [Math.cos(a) * r, -r * .05, Math.sin(a) * r], [Math.cos(a) * r * .98, -r * .02, Math.sin(a) * r * .98]); }
    g.add(G.mesh(tp, { side: true }), wire.mesh(metal(), { side: true })); g.userData.tip = pts[0]; return g; };

  // ================= 7. 港町の人 =================
  const HAIR = ['#1e1a22', '#2a2228', '#3a2a24', '#4a3428', '#8a8a94', '#5a3a2a'], TOPS = ['#e8e4dc', '#2f3a6a', '#c8453a', '#d8a83a', '#4f8f88', '#6a6a7a', '#e8a0b0', '#3a6a9a', '#f0ece0', '#7a4a6a'], BOT = ['#2a2a3a', '#3a3a4a', '#4a4a5a', '#2f3a5a', '#5a4a3a'];
  const STY = ['short', 'bob', 'bun', 'tail', 'short', 'long', 'tufts', 'bald', 'short', 'spiky'], CL = ['jacket', 'tunic', 'coat', 'vest', 'tunic', 'jacket', 'overall'];
  N.folk = (k, o = {}) => { const r = j => hash(k, j, 71), f = r(1) > .5, sty = STY[Math.floor(r(2) * STY.length)];
    return { build: 'toon', sex: f ? 'f' : 'm', hairStyle: f && sty === 'bald' ? 'bob' : sty, hair: HAIR[Math.floor(r(3) * HAIR.length)], cloth: CL[Math.floor(r(4) * CL.length)], sleeve: r(5) > .5 ? 'short' : 'long',
      top: TOPS[Math.floor(r(6) * TOPS.length)], top2: TOPS[Math.floor(r(7) * TOPS.length)], bottom: BOT[Math.floor(r(8) * BOT.length)], lower: f && r(9) > .5 ? 'skirt' : r(9) > .8 ? 'shorts' : 'pants', skirt: .7, skirtC: BOT[Math.floor(r(10) * BOT.length)],
      shoes: r(11) > .5 ? 'shoe' : 'boot', shoe: '#2a2a34', eyes: ['big', 'half', 'round', 'closed', 'big'][Math.floor(r(12) * 5)], mouth: ['smile', 'small', 'line', 'open'][Math.floor(r(13) * 4)], hat: r(14) > .85 ? 'cap' : undefined, acc: TOPS[Math.floor(r(15) * TOPS.length)],
      back: r(16) > .8 ? 'bag' : undefined, beard: !f && r(17) > .85 ? 'stubble' : undefined, s: .92 + r(18) * .12, ...o }; };

  return N;
};
