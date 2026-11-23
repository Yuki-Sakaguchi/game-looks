// game-looks-11「砂と草原の旅」（11〜15）で使い回す生きもの：らくだ・馬・ひつじ。kit.js・retro.js のあとに読み、
//   const A = PACK_SAND1(THREE, K, R);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵の 1 枚のテクスチャ 64×48 ＋ R.geo() の loft の少ない面）。箱は使わない。
//
// ■ 生きもの（正面 +z、足もと y=0、大きさは m。どれも Group を返す）
//   A.camel({ c, belly, s, load: true/false, cloth, cloth2, bag })   らくだ（こぶ 1 つ。load で くらの布・左右の荷ぶくろ・まいたじゅうたん）。ひざのこぶ、広い足のうら
//   A.horse({ c, belly, mane, s, sock, blaze, saddle })              馬（たてがみ・長い尾）。saddle: 色 で くらと鞍しき（人を乗せるときは userData.seat の上に）
//   A.sheep({ c, face, s })                                           ひつじ（もこもこの毛。顔と足はこい色）
//   A.pose(動物, 'walk'/'stand'/'graze'/'kneel', t)                    動かす。らくだの walk は同じがわの前後の足がいっしょに出る（側対歩）
//   どれも userData.J（body, neck, head, fl, fr, hl, hr, tail）と userData.seat（くらの上の高さ・体の中の位置）を持つ
window.PACK_SAND1 = (THREE, K, R) => {
  const { hash, mix, ramp, Px, geo, TR, mat, tex } = R, PI = Math.PI;
  // 体つき。L 胴の長さ、rb 胴の太さ、leg 足の長さ、neck 首、lean 首の前への傾き、head 頭の長さ、hr 頭の太さ、legR 足の太さ、tail 尾の長さ
  const SPEC = {
    camel: { L: 1.55, rb: .3, rz: 1.12, leg: 1.12, neck: .78, lean: 1.05, head: .5, hr: .12, ear: .07, tail: .42, legR: .05 },
    horse: { L: 1.3, rb: .27, rz: 1.1, leg: .86, neck: .62, lean: .62, head: .52, hr: .12, ear: .11, tail: .62, legR: .05 },
    sheep: { L: .78, rb: .29, rz: 1.06, leg: .34, neck: .16, lean: .95, head: .3, hr: .1, ear: .1, tail: .14, legR: .034 } };
  // ---- テクスチャ（64×48）。区画：胴 0,0,32,32（よこ＝まわり。まん中 x=16 が腹、はしが背）／頭 32,0,16,16（y=0 が鼻先）／首 32,16,16,16（まん中が のど）
  //      耳 48,0,8,12／足 56,0,8,16（下が ひづめ）／尾 48,16,16,16／こぶ・たてがみ 0,32,32,16／くらの布 32,32,32,16
  const cache = new Map();
  function skin(kind, o = {}) { const key = kind + JSON.stringify(o); if (cache.has(key)) return cache.get(key);
    const P = Px(64, 48), base = o.c || (kind === 'camel' ? '#c8955a' : kind === 'horse' ? '#8a5434' : '#ece4d2'), C = ramp(base, 6, { contrast: .85 }), W = ramp(o.belly || (kind === 'camel' ? '#e6c48e' : kind === 'horse' ? '#b8885a' : '#f8f2e4'), 6, { contrast: .7 }),
      Mn = ramp(o.mane || (kind === 'horse' ? '#2a1c1c' : kind === 'camel' ? '#8a6038' : '#3a2e30'), 6), Fc = ramp(o.face || (kind === 'sheep' ? '#3a3034' : base), 6, { contrast: .8 }), dk = '#2a1e22', sd = o.seed || 0;
    // 胴
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const a = Math.abs(x - 16); let c;
      if (kind === 'sheep') { const cx = (x + (y >> 2) * 2) % 4, cy = y % 4, curl = cx === 0 || cy === 0, n = hash(x >> 1, y >> 1, sd + 3); c = curl ? W[n > .5 ? 2 : 3] : (cx === 1 && cy === 1 ? W[5] : W[4]); if (a > 13) c = curl ? W[3] : W[5]; if (a < 3 && y > 4) c = curl ? W[1] : W[2]; }
      else { c = a < 4 ? W[3] : a < 6 ? ((x + y) & 1 ? W[3] : C[3]) : a > 14 ? C[2] : a > 11 ? C[3] : C[4];
        if (kind === 'camel' && (x * 5 + y * 3) % 13 === 0 && a > 5) c = C[2];                       // ぼさぼさの毛の すじ
        if (kind === 'camel' && y > 24 && a > 8) c = (x + y) % 3 ? C[3] : C[2];                       // 前の肩の 長い毛
        if (kind === 'horse' && a > 6 && a < 13 && (y === 9 || y === 22) && (x & 1)) c = C[5];         // 毛なみの光
        if (kind === 'horse' && hash(x, y, sd + 1) > .93) c = C[5]; }
      P.set(x, y, c); }
    // 頭（y=0 が鼻先、まん中 x=8 が あご）
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const a = Math.abs(x - 8); let c = a < 3 ? Fc[4] : a > 6 ? Fc[2] : Fc[3];
      if (kind === 'sheep' && y > 10) c = a > 4 ? W[3] : W[4];                                       // 頭のうしろは毛
      if (kind === 'horse' && o.blaze && a > 6 && y > 1) c = '#f4ece0';                               // はなすじの白
      if (y < 4) c = kind === 'camel' ? (a < 5 ? W[3] : C[3]) : kind === 'horse' ? Fc[1] : Fc[2];       // 鼻づら
      if (y < 2 && a > 5) c = dk; if (y === 1 && (a === 7 || a === 6)) c = dk;                         // はなの あな
      if (y === 2 && a < 4) c = mix(dk, Fc[2], .4);                                                   // 口
      P.set(32 + x, y, c); }
    for (const ex of [35, 44]) { P.set(ex, 8, dk); P.set(ex + 1, 8, dk); P.set(ex, 9, dk); P.set(ex + 1, 9, dk); P.set(ex + (ex < 40 ? 0 : 1), 8, '#ffffff'); P.set(ex - 1, 7, kind === 'camel' ? C[1] : Fc[1]); P.set(ex + 2, 7, kind === 'camel' ? C[1] : Fc[1]); }   // 目と、まつげ
    // 首（まん中が のど）
    for (let y = 16; y < 32; y++) for (let x = 0; x < 16; x++) { const a = Math.abs(x - 8); let c = a < 3 ? W[3] : a > 6 ? C[2] : C[3];
      if (kind === 'camel' && a < 4 && y > 22) c = (x + y) & 1 ? C[2] : C[3];                         // のどの長い毛
      if (kind === 'sheep') c = y < 20 ? (a > 4 ? W[3] : W[4]) : (a < 3 ? Fc[3] : W[(x + y) % 3 ? 4 : 2]);
      P.set(32 + x, y, c); }
    // 耳・足・尾
    for (let y = 0; y < 12; y++) for (let x = 0; x < 8; x++) P.set(48 + x, y, Math.abs(x - 3.5) < 1.6 && y > 2 ? (kind === 'sheep' ? '#c89088' : mix(Fc[2], '#d8a898', .5)) : Fc[3]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { let c = x < 2 ? C[2] : x > 5 ? C[2] : C[3];
      if (kind === 'camel') c = y > 13 ? mix(dk, C[2], .5) : (y > 6 && y < 9) ? C[1] : y < 3 ? C[4] : c;                    // ひざのこぶと、足のうら
      if (kind === 'horse') c = y > 13 ? dk : o.sock && y > 9 ? '#f0e8dc' : y > 11 ? C[1] : c;
      if (kind === 'sheep') c = y < 3 ? W[3] : y > 13 ? dk : Fc[x < 2 || x > 5 ? 2 : 3];
      P.set(56 + x, y, c); }
    for (let y = 16; y < 32; y++) for (let x = 0; x < 16; x++) { let c = kind === 'horse' ? Mn[(x + (y >> 1)) % 3 ? 2 : 3] : C[3]; if (kind === 'camel' && y > 26) c = Mn[2]; if (kind === 'sheep') c = W[(x + y) % 3 ? 4 : 2]; P.set(48 + x, y, c); }
    // こぶ（らくだ）・たてがみ（馬）・毛のふち（ひつじ）
    for (let y = 32; y < 48; y++) for (let x = 0; x < 32; x++) { const a = Math.abs(x - 16); let c;
      if (kind === 'horse') c = Mn[(x * 3 + y) % 5 === 0 ? 4 : (x + y) % 3 ? 2 : 1];
      else if (kind === 'camel') { c = a > 13 ? C[2] : a < 4 ? C[3] : C[4]; if ((x * 3 + y * 5) % 11 === 0) c = C[2]; if (y < 35) c = Mn[3]; if (y < 34 && (x & 1)) c = Mn[2]; }
      else c = W[(x + y) % 4 ? 4 : 2];
      P.set(x, y, c); }
    // くらの布（しま＋ふさ。らくだ・馬）
    const F1 = ramp(o.cloth || '#c8402e'), F2 = ramp(o.cloth2 || '#e8b048'), F3 = ramp('#2e4a7a');
    for (let y = 32; y < 48; y++) for (let x = 32; x < 64; x++) { const j = y - 32, i = x - 32; let c = j < 2 || j > 13 ? F2[2] : j < 4 || j > 11 ? F1[2] : (j > 6 && j < 9) ? ((i >> 1) % 2 ? F3[3] : F2[4]) : ((i + j) % 6 === 0 ? F1[4] : F1[3]); if (j === 15 && i % 2) c = null; if (j === 14 && i % 4 === 1) c = F2[4]; P.set(x, y, c ?? F2[1]); }
    const t = tex.from(P, { m: 1 }); cache.set(key, t); return t; }

  // ---- 体を組む ----
  function beast(kind, o = {}) { const S = SPEC[kind], s = o.s || 1, t = skin(kind, o), m = mat(t, { vc: true, smooth: true }), g = new THREE.Group(), root = new THREE.Group(), J = {}, W = 64, H = 48, L = S.L, rb = S.rb, rz = S.rz, hr = S.hr, RX = TR(0, 0, 0, 0, PI / 2);
    root.scale.setScalar(s); g.add(root);
    const part = (G, parent, x, y, z, mm = m) => { const me = new THREE.Mesh(G.build(), mm); me.castShadow = true; me.receiveShadow = true; const pv = new THREE.Group(); pv.position.set(x, y, z); pv.add(me); parent.add(pv); return pv; };
    // 胴（RX でよこにねかせた loft。輪の dz は 上下のずれ：プラスで下へ）。らくだは肩が高く腰が細い、ひつじは丸い、馬は胸が厚い
    const bodyRings = kind === 'camel' ? [[-L * .5, rb * .45, rb * .5, 0, .85, 0, -rb * .05], [-L * .38, rb * .82, rb * .92, .12, .95], [-L * .1, rb * .9, rb * rz, .4, 1], [L * .22, rb * 1.02, rb * 1.18, .7, 1, 0, rb * .12], [L * .42, rb * .9, rb * 1.12, .9, 1, 0, rb * .12], [L * .5, rb * .5, rb * .7, 1, .95, 0, -rb * .1]]
      : kind === 'sheep' ? [[-L * .5, rb * .5, rb * .55, 0, .85], [-L * .4, rb * .92, rb * .96, .12, .95], [-L * .1, rb * 1.04, rb * rz, .42, 1], [L * .22, rb * 1.02, rb * 1.04, .74, 1], [L * .44, rb * .8, rb * .86, .92, 1], [L * .52, rb * .42, rb * .5, 1, .95]]
      : [[-L * .5, rb * .5, rb * .6, 0, .85, 0, -rb * .1], [-L * .4, rb * .95, rb * 1.02, .12, .95, 0, -rb * .05], [-L * .1, rb * .86, rb * rz * .95, .42, 1, 0, rb * .05], [L * .22, rb * .92, rb * 1.12, .74, 1], [L * .42, rb * .8, rb * 1.06, .92, 1, 0, -rb * .1], [L * .5, rb * .5, rb * .66, 1, .95, 0, -rb * .2]];
    J.body = part(geo().smooth(1).px(0, 0, 32, 32, W, H).at(RX).loft(8, bodyRings, { cap: 'both', rot: 0 }), root, 0, S.leg + rb * .5, 0);
    if (kind === 'camel') { const Gh = geo().smooth(1).px(0, 32, 32, 16, W, H), hy = rb * .55;   // こぶ（背の まん中より少しうしろ。丸い山）
      Gh.loft(8, [[hy, rb * .72, rb * .95, 0, .9, 0, -.02], [hy + rb * .5, rb * .6, rb * .78, .45, 1, 0, -.04], [hy + rb * .95, rb * .34, rb * .44, .85, 1.05, 0, -.06], [hy + rb * 1.12, rb * .08, rb * .1, 1, 1.05, 0, -.07]], { cap: 'top', rot: 0 }); part(Gh, J.body, 0, 0, -L * .05); }
    if (kind === 'sheep') { const Gw = geo().smooth(1).px(0, 32, 32, 16, W, H); Gw.loft(8, [[rb * .45, rb * .98, rb * .8, 0, .95], [rb * .85, rb * .7, rb * .55, .7, 1.05], [rb * 1.05, rb * .2, rb * .2, 1, 1.05]], { cap: 'top', rot: 0 }); part(Gw, J.body, 0, 0, 0); }   // 背中の毛のふくらみ
    // 首（らくだは前へ長く出てから上へ。S 字）
    const nk = kind === 'camel' ? [[-.06, rb * .5, rb * .62, 0, .95], [S.neck * .4, hr * 1.05, hr * 1.3, .45, 1, 0, .08], [S.neck * .78, hr * .9, hr * 1.1, .8, 1, 0, .02], [S.neck, hr * .8, hr * .95, 1, 1, 0, -.06]]
      : kind === 'sheep' ? [[-.06, rb * .55, rb * .6, 0, .95], [S.neck, hr * 1.1, hr * 1.15, 1]] : [[-.05, rb * .62, rb * .78, 0, .95], [S.neck * .5, hr * 1.05, hr * 1.3, .5, 1, 0, .02], [S.neck, hr * .85, hr * 1.02, 1]];
    J.neck = part(geo().smooth(1).px(32, 16, 16, 16, W, H).loft(6, nk, {}), J.body, 0, rb * .4, L * .4);
    const endZ = kind === 'camel' ? -.06 : 0;
    // 頭（鼻先へ細くなる）
    const hd = kind === 'camel' ? [[-hr * .9, hr * .55, hr * .6, 0, .95], [0, hr, hr * 1.05, .3], [S.head * .45, hr * .72, hr * .78, .6], [S.head * .8, hr * .62, hr * .7, .85], [S.head, hr * .5, hr * .52, 1]]
      : kind === 'sheep' ? [[-hr * .8, hr * .6, hr * .7, 0, .95], [0, hr, hr * 1.05, .4], [S.head * .55, hr * .78, hr * .82, .7], [S.head, hr * .45, hr * .5, 1]]
      : [[-hr * .9, hr * .5, hr * .6, 0, .95], [0, hr * .9, hr * 1.1, .3], [S.head * .5, hr * .66, hr * .9, .6], [S.head, hr * .5, hr * .62, 1]];
    const Gh = geo().smooth(1).px(32, 0, 16, 16, W, H).at(RX).loft(6, hd, { cap: 'both', rot: 0 }).at(null).smooth(0).px(48, 0, 8, 12, W, H);
    for (const sx of [-1, 1]) { const a = [sx * hr * .7, hr * .5, -.02], b = [sx * hr * .25, hr * .8, -.02], c = kind === 'sheep' ? [sx * (hr + S.ear), hr * .3, -.03] : [sx * hr * .55, hr * .75 + S.ear, -.04]; Gh.tri(a, b, c, [0, 0], [1, 0], [.5, 1]).tri(b, a, c, [0, 0], [1, 0], [.5, 1], .75); }
    J.head = part(Gh, J.neck, 0, S.neck, endZ);
    if (kind === 'horse') { // たてがみ（首のうしろの板）と、前がみ
      const Gm = geo().smooth(0).px(0, 32, 32, 16, W, H); for (const sx of [-1, 1]) Gm.quad([sx * .012, -.02, -rb * .62], [sx * .012, S.neck + .02, -hr * .95], [sx * .05, S.neck - .02, -hr * 1.35], [sx * .05, -.02, -rb * .95], [0, 0, 1, 1], sx > 0 ? 1 : .8);
      part(Gm, J.neck, 0, 0, 0, mat(t, { vc: true, side: true })); }
    // 足（らくだは ひざにこぶ、足のうらが広い）
    const lr = S.legR, legRings = kind === 'camel' ? [[-S.leg, lr * 1.5, lr * 1.8, 0, .9], [-S.leg * .9, lr * .7, lr * .8, .12], [-S.leg * .55, lr * .72, lr * .8, .4], [-S.leg * .48, lr * 1.15, lr * 1.2, .5], [-S.leg * .4, lr * .85, lr * .95, .6], [0, lr * 2.4, lr * 2.8, 1]]
      : kind === 'sheep' ? [[-S.leg, lr * .9, lr, 0], [-S.leg * .5, lr * .85, lr * .95, .45], [0, lr * 2.4, lr * 2.6, 1]]
      : [[-S.leg, lr * 1.05, lr * 1.2, 0, .9], [-S.leg * .9, lr * .8, lr * .9, .12], [-S.leg * .5, lr * .8, lr * .95, .45], [-S.leg * .42, lr * 1.05, lr * 1.1, .55], [0, lr * 2, lr * 2.4, 1]];
    const leg = (x, z) => part(geo().smooth(1).px(56, 0, 8, 16, W, H).loft(5, legRings, { cap: 'bot' }), J.body, x, -rb * .5, z);
    const lx = rb * (kind === 'sheep' ? .5 : .55); J.fl = leg(lx, L * .36); J.fr = leg(-lx, L * .36); J.hl = leg(lx, -L * .36); J.hr = leg(-lx, -L * .36);
    J.tail = part(geo().smooth(1).px(48, 16, 16, 16, W, H).loft(5, kind === 'horse' ? [[0, .05, .05, 0], [S.tail * .3, .09, .07, .3], [S.tail, .06, .05, 1]] : [[0, S.legR * .9, S.legR * .9, 0], [S.tail * .7, S.legR * .6, S.legR * .6, .7], [S.tail, S.legR * 1.1, S.legR * .9, 1]], { cap: 'top' }), J.body, 0, rb * .55, -L * .48);
    g.userData = { J, kind, spec: S, s, seat: [0, S.leg + rb * 1.45, kind === 'camel' ? -L * .05 : 0] };
    // らくだの荷：くらの布（背にかける）、左右の荷ぶくろ、まいた じゅうたん。どれも loft（箱にしない）
    if (kind === 'camel' && o.load !== false) { const B = R.parts(), cm = B.g(t, { side: true }), bagT = tex.fabric({ c: o.bag || '#d8c49a', c2: '#a88a5a', pattern: 'check' }), rugT = tex.fabric({ c: o.rug || '#2e5a8a', c2: '#e8c058', pattern: 'stripe' }), ropeT = tex.planks({ c: '#8a6a44' });
      const sx0 = -L * .05; // こぶの位置
      for (const sx of [-1, 1]) { const Q = (u, zz) => { const ang = u * 1.4, r = rb * 1.06, bump = rb * .95 * Math.max(0, 1 - (zz / .42) ** 2) * Math.cos(ang) ** 3; return [sx * Math.sin(ang) * (r + bump * .3), Math.cos(ang) * r * 1.12 + .03 + bump, zz + sx0]; };
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const u0 = i / 3, u1 = (i + 1) / 3, z0 = -.4 + j * .4, z1 = z0 + .4; cm.px(32, 32, 32, 16, W, H).quad(Q(u0, z0), Q(u0, z1), Q(u1, z1), Q(u1, z0), [j / 2, 1 - u0, (j + 1) / 2, 1 - u1], sx > 0 ? 1 : .86); } }
      const BG = B.g(bagT), RG = B.g(rugT), RP = B.g(ropeT);
      for (const sx of [-1, 1]) { BG.at(TR(sx * (rb * 1.12), -rb * .25, sx0 + .05, 0, 0, sx * .12)).loft(6, [[-.32, .13, .2, 0, .8], [-.18, .2, .3, .3, .95], [.1, .19, .3, .7, 1], [.22, .1, .2, 1, 1]], { cap: 'both' }).at(null);
      }
      RG.at(TR(0, rb * 1.08, sx0 - .62, 0, 0, PI / 2)).loft(8, [[-rb * 1.25, .11, .11, 0, .9], [rb * 1.25, .11, .11, 1, 1]], { cap: 'both', ur: 2 }).at(null);
      RP.at(TR(0, rb * .2, sx0 + .62, 0, 0, PI / 2)).loft(5, [[-rb * 1.2, .025, .025, 0], [rb * 1.2, .025, .025, 1]], {}).at(null);
      const lg = B.group(); lg.traverse(q => { if (q.isMesh) q.castShadow = true; }); J.body.add(lg); }
    if (kind === 'horse' && o.saddle) { const B = R.parts(), cm = B.g(t, { side: true }), sd = B.g(tex.barrel({ c: o.saddle }));
      for (const sx of [-1, 1]) { const Q = u => { const ang = u * 1.2, r = rb * 1.05; return [sx * Math.sin(ang) * r, Math.cos(ang) * r * 1.05, 0]; }; for (let i = 0; i < 3; i++) { const a = Q(i / 3), b = Q((i + 1) / 3); cm.px(32, 32, 32, 16, W, H).quad([a[0], a[1], -.32], [a[0], a[1], .3], [b[0], b[1], .3], [b[0], b[1], -.32], [0, 1 - i / 3, 1, 1 - (i + 1) / 3], sx > 0 ? 1 : .86); } }
      sd.at(TR(0, rb * 1.02, 0, 0, PI / 2)).loft(6, [[-.24, .16, .06, 0, .9, 0, -.04], [-.05, .18, .05, .4, 1], [.16, .16, .05, .8, 1], [.24, .1, .1, 1, 1, 0, -.05]], { cap: 'both', rot: 0 }).at(null);
      J.body.add(B.group()); }
    pose(g, 'stand', 0); return g; }

  function pose(g, p = 'walk', t = 0) { const J = g.userData.J, S = g.userData.spec, kind = g.userData.kind, camel = kind === 'camel'; let a = 0, amp = 0, neck = S.lean, nod = 0, brx = 0, by = S.leg + S.rb * .5, look = 0, kn = 0;
    if (p === 'walk') { a = Math.sin(t); amp = camel ? .32 : kind === 'sheep' ? .5 : .42; by += Math.abs(Math.cos(t)) * .02; nod = Math.sin(t * 2) * (camel ? .07 : .05); neck += Math.sin(t * 2) * .03; }
    else if (p === 'graze') { neck = 2.35 + Math.sin(t * 1.3) * .05; nod = .9 + Math.sin(t * 5) * .05; brx = .06; }
    else if (p === 'kneel') { kn = 1; by = S.rb * .95; brx = 0; neck = S.lean * .9; look = Math.sin(t * .4) * .35; nod = Math.sin(t * .9) * .04; }
    else { look = Math.sin(t * .5) * .4; nod = Math.sin(t * .8) * .05; }
    J.body.position.y = by; J.body.rotation.x = brx; J.neck.rotation.x = neck; J.head.rotation.set(-(brx + neck) + nod + (camel ? .1 : 0), look, 0);
    if (kn) { J.fl.rotation.x = J.fr.rotation.x = -1.45; J.hl.rotation.x = J.hr.rotation.x = 1.45; J.fl.scale.y = J.fr.scale.y = J.hl.scale.y = J.hr.scale.y = .55; }
    else { const L = camel ? a : a, R2 = camel ? a : -a; J.fl.rotation.x = L * amp; J.hl.rotation.x = R2 * amp; J.fr.rotation.x = -L * amp; J.hr.rotation.x = -R2 * amp; J.fl.scale.y = J.fr.scale.y = J.hl.scale.y = J.hr.scale.y = 1; }
    J.tail.rotation.set(kind === 'horse' ? -2.75 : kind === 'sheep' ? -2.4 : -2.85, 0, Math.sin(t * (kind === 'horse' ? .9 : 1.3)) * .18); }

  return { SPEC, skin, camel: (o = {}) => beast('camel', o), horse: (o = {}) => beast('horse', o), sheep: (o = {}) => beast('sheep', o), pose };
};
