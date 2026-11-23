// game-looks-11 の追加の部品「和の里」（06〜10 で使い回す小物）。kit.js・retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), WA = PACK_WA2(THREE, K, R);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。どの形も 足もとが y=0（ちょうちんだけ、つるす点が y=0）、正面 +z、大きさは m。
//
// ■ 中身
//   WA.tex.chochin({ c, mark: 'ring'/'dot'/'wave'/'none', mc }) … ちょうちんの紙（たてのほね・上下の黒いわく・まん中の紋）。16×24
//   WA.tex.washi({ c, frame, mark }) … とうろうの和紙（木のわく・すける紙のむら・すみの小さな花の紋）。32×32
//   WA.chochin({ c, r: .2, h: .42, mark, glow: true, cord: .12 }) → Group   つるすちょうちん（つるす点が y=0、下へ下がる）。userData.mid ＝ 光のまん中の高さ（マイナス）
//   WA.toro({ s: 1, c, wood }) → Group   水に流すとうろう（木の台＋光る和紙の四角いあんどん＋上の小さな屋根）。userData.mid ＝ 光のまん中の高さ
//   WA.kasa(人, { c, wide }) → 人   あみがさ（わらの円すい）を頭に付ける（01 と同じ形）
//   WA.yukata({ 色… }) → R.actor の引数   ゆかたの人（robe＋長いすそ＋帯）。R.actor({ build: 'toon', ...WA.yukata({ top: '#…' }) })
//   WA.petals(scene, { n: 160, box: [30, 10, 30], c, size: 2.4, fall: .9, wind: [.7, .25] }) → { pts, tick(t, cx, cz, cy) }   舞う花びら・雪（主役のまわりの箱の中で、ゆれながら落ちる点）
window.PACK_WA2 = (THREE, K, R) => {
  const T = R.tex, { hash } = K, PI = Math.PI, memo = new Map(), key = (n, o) => n + JSON.stringify(o);
  const once = (n, o, f) => { const k = key(n, o); if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };

  // ---- テクスチャ ----
  const tex = {};
  tex.chochin = (o = {}) => once('chochin', o, () => { const P = R.Px(16, 24), A = R.ramp(o.c || '#e0402a'), Kc = R.ramp('#2a2228'), M = R.ramp(o.mc || '#2a2228');
    P.fill(A[3]); for (let y = 3; y < 21; y += 3) { P.rect(0, y, 16, 1, A[2]); P.rect(0, y + 1, 16, 1, A[4]); }   // たてのほね（よこの線）と、その下の明るいふくらみ
    for (let x = 0; x < 16; x += 4) P.rect(x, 3, 1, 18, A[2]);
    const m = o.mark || 'ring';
    if (m === 'ring') { P.disc(8, 12, 4.2, M[2]); P.disc(8, 12, 2.6, A[4]); P.disc(8, 12, 1.2, M[2]); }
    if (m === 'dot') { P.disc(8, 12, 3.4, M[2]); P.rect(7, 10, 1, 1, M[4]); }
    if (m === 'wave') { for (let x = 3; x < 13; x++) { const y = 12 + Math.round(Math.sin(x * 1.1) * 1.5); P.rect(x, y, 1, 2, M[2]); } P.rect(5, 8, 6, 1, M[2]); P.rect(5, 16, 6, 1, M[2]); }
    P.rect(0, 0, 16, 3, Kc[1]); P.rect(0, 21, 16, 3, Kc[1]); P.rect(0, 1, 16, 1, Kc[3]); P.rect(0, 22, 16, 1, Kc[3]);
    return T.from(P, { m: 1 }); });
  tex.washi = (o = {}) => once('washi', o, () => { const P = R.Px(32, 32), A = R.ramp(o.c || '#f8e0a8'), W = R.ramp(o.frame || '#5a3a2a'), M = R.ramp(o.mark || '#d8503a');
    P.fill(A[4]); P.each((x, y) => { const n = hash(x >> 1, y >> 1, 7); return n < .16 ? A[3] : n > .9 ? A[5] : null; });   // 紙のむら（すけ具合）
    for (let y = 4; y < 29; y += 6) P.rect(2, y, 28, 1, A[3]);                                                                // 紙をはり合わせた うすい線
    // すみの小さな花の紋（5 つの点）と、反対のすみに草の線
    const fx = 21, fy = 9; for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2 - PI / 2; P.rect(fx + Math.round(Math.cos(a) * 2.4), fy + Math.round(Math.sin(a) * 2.4), 2, 2, M[3]); } P.rect(fx, fy, 2, 2, M[5]);
    P.line(7, 26, 9, 18, R.ramp('#5a8a4a')[2]); P.line(10, 26, 13, 20, R.ramp('#5a8a4a')[2]);
    P.rect(0, 0, 32, 2, W[2]); P.rect(0, 30, 32, 2, W[1]); P.rect(0, 0, 2, 32, W[2]); P.rect(30, 0, 2, 32, W[1]); P.rect(15, 2, 2, 28, W[3]); P.rect(0, 0, 32, 1, W[4]);
    return T.from(P, { m: 1 }); });

  // ---- ちょうちん（つるす点が y=0） ----
  const chochin = (o = {}) => { const r = o.r || .2, h = o.h || .42, cord = o.cord ?? .12, B = R.parts(), L = B.g(tex.chochin({ c: o.c, mark: o.mark, mc: o.mc }), { glow: o.glow !== false }), Kd = B.g(T.planks({ c: '#2a2228' })).smooth(1);
    if (cord > 0) Kd.loft(4, [[-cord, .008, .008, 0, 1], [0, .008, .008, 1, 1]], {});
    const y0 = -cord - h;
    L.at(R.TR(0, y0, 0)).loft(8, [[0, r * .25, r * .25, 0, .8], [h * .1, r * .78, r * .78, .1, 1], [h * .5, r, r, .5, 1.1], [h * .9, r * .78, r * .78, .9, 1], [h, r * .25, r * .25, 1, .8]], { cap: 'both' }).at(null);
    const g = B.group(); g.traverse(m => { if (m.isMesh) m.castShadow = false; }); g.userData.mid = y0 + h / 2; return g; };

  // ---- 流しとうろう（足もとが水面） ----
  const toro = (o = {}) => { const s = o.s || 1, B = R.parts(), Wd = B.g(T.planks({ c: o.wood || '#6a4a34', m: 1.2 })), Pp = B.g(tex.washi({ c: o.c, mark: o.mark }), { glow: true }), Rf = B.g(T.planks({ c: '#3a2a24', m: 1 }));
    const w = .36 * s, bh = .06 * s, ph = .34 * s, pw = .28 * s;
    Wd.box(w, bh, w, 0, 0, 0, { m: 1.2 });                          // 木の台
    Pp.box(pw, ph, pw, 0, bh, 0, { top: false, bottom: false });     // 光る和紙
    Rf.box(pw + .06 * s, .03 * s, pw + .06 * s, 0, bh + ph, 0, { m: 1, taper: .2 });   // 上のわく
    const g = B.group(); g.traverse(m => { if (m.isMesh) m.castShadow = false; }); g.userData.mid = bh + ph * .5; return g; };

  // ---- あみがさ（01 と同じ形） ----
  const kasa = (p, o = {}) => { const b = p.userData.build, Hd = b.head, HW = b.hw * Hd, wd = o.wide || 2.6, r = (f, k, v, sc) => [f * Hd, HW * k, HW * k, v, sc];
    p.userData.J.head.add(R.geo().smooth(1).loft(8, [r(.62, wd, 0, .8), r(.86, wd * .58, .5, 1), r(1.2, .1, 1, 1.08)], { ur: 3, cap: 'top' }).mesh(T.thatch({ c: o.c || '#d8c084' }), { side: true })); return p; };

  // ---- ゆかたの引数 ----
  const yukata = (o = {}) => ({ cloth: 'robe', sleeve: 'long', skirt: .92, shoes: 'shoe', shoe: '#8a6a4a', top2: '#f4ecd8', belt: o.obi || '#e0a040', ...o });

  // ---- 舞う花びら・雪 ----
  const petals = (scene, o = {}) => { const n = o.n || 160, A = o.box || [30, 10, 30], pos = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: o.c || '#ffd2e2', size: o.size || 2.4, sizeAttenuation: false, fog: o.fog ?? false })); pts.frustumCulled = false; scene.add(pts);
    const wrap = (v, c, a) => ((v - c + a / 2) % a + a) % a - a / 2 + c, fall = o.fall ?? .9, wx = (o.wind || [.7, .25])[0], wz = (o.wind || [.7, .25])[1];
    const tick = (t, cx = 0, cz = 0, cy = 0) => { for (let i = 0; i < n; i++) { const f = .5 + hash(i, 2) * .7, ph = hash(i, 1) * 50;
      pos[i * 3] = wrap((hash(i, 3) - .5) * A[0] + t * wx + Math.sin(t * 1.3 * f + ph) * .7, cx, A[0]);
      pos[i * 3 + 1] = cy + A[1] - ((hash(i, 4) * A[1] + t * f * fall) % A[1]);
      pos[i * 3 + 2] = wrap((hash(i, 5) - .5) * A[2] + t * wz + Math.cos(t * 1.1 * f + ph) * .7, cz, A[2]); } g.attributes.position.needsUpdate = true; };
    tick(0); return { pts, tick }; };

  return { tex, chochin, toro, kasa, yukata, petals };
};
