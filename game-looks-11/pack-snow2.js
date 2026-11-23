// game-looks-11 の追加の部品「雪と北の国」（26〜30 で使う）。game-looks-7 の kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), S = PACK_SNOW2(THREE, K, R);   として使う（第 8・9 集の pack といっしょに読んでよい）。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'。
//
// ■ テクスチャ  S.tex.名前({ … }) → THREE.Texture（同じ引数なら同じ物）
//   snowLeaves { c, snow 0〜1 }（雪の のった針葉樹の葉。抜き）   hide { c, c2 }（円すいテントの毛皮と布。ぬい目・すす・すその雪）
//   deer { c, belly }（トナカイの 1 枚絵 64×32）   antler { c }（つの。抜き）   fur { c }（毛皮のぼうし）
// ■ 形
//   S.snowPine({ h: 6, c, snow: .6, seed })   雪をかぶった針葉樹（R.tree の 'pine' と同じ形で、葉に雪を打つ）
//   S.tent({ r: 2.2, h: 4.2, c, c2, poles: true, seed })   円すいのテント（棒が上から つき出る。正面 +z に入口のたれ布）。userData.top ＝ けむりの出る点
//   S.reindeer({ s: 1, c, belly, antlers: true }) と S.reindeerPose(トナカイ, 'walk'/'graze'/'stand', t)   トナカイ（R.geo の loft ＋ 64×32 の絵）
//   S.furHat(人, { c })   人の頭に毛皮のぼうし（耳おおいつき）を付ける   S.sled({ len: 2.4, load: true, c })   荷をつんだ木のそり（+z が前。userData.hitch ＝ ひもを付ける点）
//   S.rope(テクスチャ)   2 点のあいだに張るひも（毎コマ userData.span(a, b) で張りなおす）
window.PACK_SNOW2 = (THREE, K, R) => {
  const { hash } = K, T = R.tex, PI = Math.PI, cache = new Map();
  const memo = (name, fn) => (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) cache.set(k, t = fn(o)); return t; };
  const tex = {};

  // ---- テクスチャ ----
  // 雪ののった葉：R.paint.leaves の 'fringe' の上に、上向きの面（絵の上のほう）ほど多く雪のかたまりを打つ
  tex.snowLeaves = memo('snowLeaves', (o = {}) => { const P = R.paint.leaves({ c: o.c || '#2c5e50', shape: 'fringe', seed: o.seed || 0 }), W = R.ramp('#eef4fc', 6, { cool: .7 }), amt = o.snow ?? .6, sd = o.seed || 0;
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) { const c = P.get(x, y); if (!c) continue; const n = R.tn(x, y, 6, 4, 64, 64, sd + 3), band = (y % 9) / 9, k = n * .9 + (1 - band) * .35 - y / 64 * .25;
      if (k > 1.05 - amt * .6) { const above = y > 0 && P.get(x, y - 1); P.set(x, y, !above ? W[5] : k > 1.25 - amt * .4 ? W[4] : W[3]); } else if (k > 1 - amt * .6 && hash(x, y, sd) > .5) P.set(x, y, W[2]); }
    return T.from(P, { m: 3, cut: true }); });
  // 毛皮と布のテント：たての ぬい目の板（色ちがい）、横の ぬい目、上は すすで黒ずみ、すそに雪。入口のたれ布は u=.5 の下
  tex.hide = memo('hide', (o = {}) => { const P = R.Px(64), A = R.ramp(o.c || '#b8946a', 6, { contrast: .8 }), B2 = R.ramp(o.c2 || '#8a6a4c'), D = R.ramp('#4a3830'), W = R.ramp('#e8eef8', 6, { cool: .7 }), sd = o.seed || 0;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const panel = Math.floor(x / 8), row = Math.floor((y + (panel % 2) * 5) / 13), pal = hash(panel, row, sd) > .62 ? B2 : A, n = R.tn(x, y, 5, 5, 64, 64, sd);
      let t = n > .7 ? 4 : n < .3 ? 2 : 3; if (x % 8 === 0) t = 1; else if (x % 8 === 1) t = Math.min(t + 1, 5); if ((y + (panel % 2) * 5) % 13 === 0) t = 1; if ((y + (panel % 2) * 5) % 13 === 1 && x % 3 === 0) t = 5;
      let c = pal[t]; if (y < 12) { const s = (12 - y) / 12 + (n - .5) * .5; if (s > .55) c = D[s > .85 ? 1 : 2]; else if (s > .3 && (x + y) % 2) c = D[3]; }
      const sn = 57 - R.tn(x, y, 4, 64, 64, 64, sd + 9) * 7; if (y > sn) c = y > sn + 1.5 ? W[4] : W[5]; P.set(x, y, c); }
    for (let y = 30; y < 60; y++) { const hw = 3 + (y - 30) * .2; for (let x = Math.round(32 - hw); x <= Math.round(32 + hw); x++) if (y < 58) P.set(x, y, Math.abs(x - 32) > hw - 1 ? D[3] : (y + x) % 5 === 0 ? D[1] : D[2]); }
    for (let k = 0; k < 6; k++) { const x = 6 + k * 10 + Math.round(hash(k, 4, sd) * 4); for (let y = 22; y < 26; y++) P.set(x, y, A[5]); P.set(x - 1, 24, A[5]); P.set(x + 1, 24, A[5]); }   // かざりの ししゅう
    for (let x = 0; x < 64; x++) { P.set(x, 27, (x % 4 < 2) ? '#c84838' : '#e8c060'); P.set(x, 28, '#8a3030'); }   // 赤と黄の帯
    return T.from(P, { m: 4 }); });
  // トナカイの 1 枚絵（64×32）。0〜32＝胴（x の 0 と 32 が背、16 が腹。y の上が前）、32〜48 上＝頭（x 8 があご、上が鼻先）、32〜48 下＝首（x 8 が のど）、48〜56 上＝耳、56〜64 上＝足、48〜64 下＝尾
  tex.deer = memo('deer', (o = {}) => { const P = R.Px(64, 32), C = R.ramp(o.c || '#8a7464', 6, { contrast: .8 }), W = R.ramp(o.belly || '#ece4d4', 6, { contrast: .5 }), D = R.ramp('#3c302c'), sd = o.seed || 0;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const a = Math.min(x, 32 - x), n = R.tn(x, y, 3, 4, 32, 32, sd), f = 1 - y / 32;
      let c = a < 2 ? C[1] : a < 5 ? C[2] : a < 9 ? C[n > .55 ? 4 : 3] : a < 11 ? C[n > .5 ? 3 : 2] : W[n > .5 ? 4 : 3];   // 背はこく、横は明るく、腹は白
      if (f < .14 && a > 5) c = W[a > 8 ? 4 : 3];                                    // おしりの白
      if (f > .8 && a > 4) c = W[n > .4 ? 5 : 4];                                     // 胸の前の白い毛
      if ((x * 3 + y * 5) % 11 === 0 && a > 3 && a < 10) c = C[2];                     // 毛なみ
      P.set(x, y, c); }
    for (let y = 16; y < 32; y++) for (let x = 0; x < 16; x++) { const a = Math.abs(x - 8), n = hash(x, y, sd + 2); P.set(32 + x, y, a < 4 ? W[n > .4 ? 5 : 4] : a < 6 ? W[3] : C[a > 7 ? 2 : 3]); if (y > 26 && a < 5 && (x + y) % 2) P.set(32 + x, y, W[2]); }   // 首：のどの白い たてがみ
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const a = Math.abs(x - 8); let c = y < 4 ? (a < 5 ? D[2] : D[3]) : y < 6 ? C[2] : a > 6 ? C[2] : C[3]; if (a < 3 && y > 5) c = W[3]; P.set(32 + x, y, c); }   // 頭：鼻先はこく、あごの下は白
    for (const ex of [3, 13]) { P.set(32 + ex, 9, D[0]); P.set(32 + ex, 10, D[0]); P.set(32 + ex + (ex < 8 ? 1 : -1), 9, '#f4f0e8'); }   // 目
    for (let y = 0; y < 12; y++) for (let x = 0; x < 8; x++) P.set(48 + x, y, Math.abs(x - 4) < 2 && y > 3 ? W[3] : C[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) P.set(56 + x, y, y > 12 ? D[1] : y > 10 ? W[5] : y < 3 ? C[2] : C[x < 3 ? 1 : 2]);   // 足：ひづめの上に白い帯
    for (let y = 16; y < 32; y++) for (let x = 0; x < 16; x++) P.set(48 + x, y, W[(x + y) % 3 ? 4 : 3]);
    return T.from(P, { m: 1 }); });
  // つの（32×32 の抜き）。下のはしが付け根。うしろへ反ってから前へ曲がる主の枝に、前と上へ小えだ
  tex.antler = memo('antler', (o = {}) => { const P = R.Px(32), A = R.ramp(o.c || '#cbb894', 6, { contrast: .8 }); P.clip = true;
    const br = (pts, w) => { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = 10; for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; for (let d = 0; d < w; d++) P.set(x + d, y, A[d === 0 ? 4 : d === w - 1 ? 1 : 2]); } } };
    br([[4, 31], [5, 22], [9, 13], [14, 7], [21, 3], [27, 2]], 3); br([[5, 23], [1, 18], [0, 14]], 2); br([[7, 17], [4, 10], [4, 6]], 2); br([[12, 9], [12, 2]], 2); br([[18, 4], [20, 0]], 2); br([[23, 3], [28, 0]], 2); br([[6, 27], [11, 25], [14, 26]], 2);
    return T.from(P, { m: 1, cut: true }); });
  tex.fur = memo('fur', (o = {}) => { const P = R.Px(32), A = R.ramp(o.c || '#e8dcc4', 6, { contrast: .7 }); P.each((x, y) => { const n = R.tn(x, y, 3, 3, 32, 32, 5), s = (x * 2 + y * 3) % 7 === 0; return A[s ? 2 : n > .65 ? 5 : n < .3 ? 3 : 4]; }); return T.from(P, { m: 1 }); });

  // ---- 雪の針葉樹 ----
  function snowPine(o = {}) { const h = o.h || 6, sd = o.seed || 0, B = R.parts(), G = B.g(tex.snowLeaves({ c: o.c, snow: o.snow, seed: sd % 3 }), { side: true }).smooth(2);
    B.g(T.bark({ c: '#5a4a44' })).smooth(1).loft(5, [[0, h * .06, h * .06, 0, .75], [h * .3, h * .03, h * .03, .5, 1]]);
    const nT = o.tiers || 4; for (let k = 0; k < nT; k++) { const y0 = h * (.14 + k * .76 / nT), r = h * (.27 - k * .19 / nT) * (1 + (hash(k, sd) - .5) * .12), t = y0 + h * .38; G.loft(7, [[y0, r, r, .02, .75], [y0 + (t - y0) * .45, r * .5, r * .5, .55, .95], [t, .02, .02, 1, 1.12]], { ur: 2, rot: k * .5 + sd }); }
    return B.group(); }

  // ---- 円すいのテント ----
  function tent(o = {}) { const r = o.r || 2.2, h = o.h || 4.2, B = R.parts(), G = B.g(tex.hide({ c: o.c, c2: o.c2, seed: o.seed || 0 }), { side: true }), sd = o.seed || 0, g = new THREE.Group();
    const rings = [[0, r, r, 0, .8], [h * .3, r * .72, r * .72, .32, .95], [h * .62, r * .4, r * .4, .64, 1.05], [h * .86, r * .14, r * .14, .9, 1.1], [h * .92, r * .08, r * .08, 1, 1.12]];
    G.loft(9, rings.map(q => [q[0], q[1] * (1 + (hash(Math.round(q[0] * 9), sd) - .5) * .04), q[2], q[3], q[4]]), { ur: 1, rot: 0 });
    if (o.poles !== false) { const P = B.g(T.bark({ c: '#7a6450' })); for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2 + .3, bx = Math.cos(a) * r * .9, bz = Math.sin(a) * r * .9, tx = -Math.cos(a) * r * .14, tz = -Math.sin(a) * r * .14, L = h * 1.22;
      const d = [tx - bx, L, tz - bz], l = Math.hypot(...d), ry = Math.atan2(d[0], d[2]), rx = Math.acos(d[1] / l); P.at(R.TR(bx, 0, bz, ry, rx)).loft(4, [[0, .045, .045, 0, .9], [l, .03, .03, 1, 1.1]]).at(null); } }
    g.add(B.group()); g.userData.top = [0, h * 1.05, 0]; return g; }

  // ---- トナカイ（鹿のなかま。足が太く、首の下に白い毛、大きなつの）----
  const SP = { L: 1.25, rb: .27, leg: .62, neck: .42, lean: .7, head: .34, hr: .11, ear: .12, legR: .05 };
  function reindeer(o = {}) { const s = o.s || 1, t = tex.deer({ c: o.c, belly: o.belly, seed: o.seed || 0 }), m = R.mat(t, { vc: true, smooth: true }), g = new THREE.Group(), root = new THREE.Group(), J = {}, W = 64, H = 32, { L, rb, hr } = SP, RX = R.TR(0, 0, 0, 0, PI / 2); root.scale.setScalar(s); g.add(root);
    const part = (G, parent, x, y, z, mm = m) => { const me = new THREE.Mesh(G.build(), mm); me.castShadow = true; me.receiveShadow = true; const pv = new THREE.Group(); pv.position.set(x, y, z); pv.add(me); parent.add(pv); return pv; };
    J.body = part(R.geo().smooth(1).px(0, 0, 32, 32, W, H).at(RX).loft(7, [[-L * .5, rb * .5, rb * .55, 0, .85], [-L * .38, rb * .95, rb * 1.02, .12], [-L * .05, rb * .98, rb * 1.08, .45], [L * .26, rb * 1.08, rb * 1.18, .76], [L * .5, rb * .66, rb * .8, 1]], { cap: 'both', rot: 0 }), root, 0, SP.leg + rb * .5, 0);
    J.neck = part(R.geo().smooth(1).px(32, 16, 16, 16, W, H).loft(6, [[-.06, rb * .66, rb * .8, 0, .95], [SP.neck * .55, hr * 1.25, hr * 1.5, .55], [SP.neck, hr * .9, hr, 1]], {}), J.body, 0, rb * .45, L * .4);
    const Gh = R.geo().smooth(1).px(32, 0, 16, 16, W, H).at(RX).loft(6, [[-hr * .9, hr * .55, hr * .6, 0, .95], [0, hr, hr * 1.04, .35], [SP.head * .5, hr * .82, hr * .86, .65], [SP.head, hr * .5, hr * .55, 1]], { cap: 'both', rot: 0 }).at(null).smooth(0).px(48, 0, 8, 12, W, H);
    for (const sx of [-1, 1]) { const a = [sx * hr * .8, hr * .5, -.04], b = [sx * hr * .35, hr * .8, -.04], c = [sx * (hr * .9 + SP.ear * .8), hr * .55 + SP.ear * .5, -.08]; Gh.tri(a, b, c, [0, 0], [1, 0], [.5, 1]).tri(b, a, c, [0, 0], [1, 0], [.5, 1], .75); }
    J.head = part(Gh, J.neck, 0, SP.neck, 0);
    if (o.antlers !== false) { const Ga = R.geo(), A = .62 * (o.antlerS || 1); for (const sx of [-1, 1]) { Ga.quad([sx * .04, hr * .7, .02], [sx * .14, hr * .7, -A * .9], [sx * (.2 + A * .3), hr * .7 + A, -A * .9], [sx * (.05 + A * .3), hr * .7 + A, .02], sx > 0 ? [1, 0, 0, 1] : [0, 0, 1, 1]); Ga.quad([sx * .05, hr * .7, 0], [sx * (.1 + A * .55), hr * .7, -A * .2], [sx * (.14 + A * .55), hr * .7 + A * .85, -A * .3], [sx * .08, hr * .7 + A * .85, .1], [0, 0, 1, 1]); }
      const am = new THREE.Mesh(Ga.build(), R.mat(tex.antler({ c: o.ac }), { vc: true, side: true })); am.castShadow = true; J.head.add(am); }
    const leg = (x, z, f) => part(R.geo().smooth(1).px(56, 0, 8, 16, W, H).loft(5, [[-SP.leg, SP.legR * 1.15, SP.legR * 1.4, 0, .7], [-SP.leg * .88, SP.legR * .75, SP.legR * .85, .15], [-SP.leg * .45, SP.legR * .8, SP.legR * .95, .5], [0, SP.legR * (f ? 1.7 : 2), SP.legR * 2.3, 1]], { cap: 'bot' }), J.body, x, -rb * .45, z);
    J.fl = leg(rb * .55, L * .34, 1); J.fr = leg(-rb * .55, L * .34, 1); J.hl = leg(rb * .55, -L * .36, 0); J.hr = leg(-rb * .55, -L * .36, 0);
    J.tail = part(R.geo().smooth(1).px(48, 16, 16, 16, W, H).loft(4, [[0, .06, .04, 0], [.12, .05, .03, 1]], { cap: 'top' }), J.body, 0, rb * .55, -L * .48);
    g.userData = { J }; reindeerPose(g, 'stand', 0); return g; }
  function reindeerPose(g, pose = 'walk', t = 0) { const J = g.userData.J; let a = 0, amp = 0, neck = SP.lean, nod = 0, by = SP.leg + SP.rb * .5, look = 0;
    if (pose === 'walk' || pose === 'run') { a = Math.sin(t); amp = pose === 'walk' ? .42 : .8; by += Math.abs(Math.cos(t)) * (pose === 'walk' ? .02 : .06); nod = Math.sin(t * 2) * .05; }
    else if (pose === 'graze') { neck = 2.35 + Math.sin(t * 1.3) * .05; nod = .9 + Math.sin(t * 5) * .06; }
    else { look = Math.sin(t * .5) * .5; nod = Math.sin(t * .8) * .05; }
    J.body.position.y = by; J.neck.rotation.x = neck; J.head.rotation.set(-neck + .15 + nod, look, 0);
    J.fl.rotation.x = a * amp; J.fr.rotation.x = -a * amp; J.hl.rotation.x = -a * amp; J.hr.rotation.x = a * amp; J.tail.rotation.set(-2.2, 0, Math.sin(t * .9) * .2); }

  // ---- 人の毛皮のぼうし（耳おおいつき）。kasa と同じく頭の関節に付ける ----
  function furHat(p, o = {}) { const b = p.userData.build, Hd = b.head, HW = b.hw * Hd, r = (f, k, v, s, z = 0) => [f * Hd, HW * k, HW * k * 1.05, v, s, 0, z * Hd]; const G = R.geo().smooth(1);
    G.loft(9, [r(.6, 1.22, 0, .8, -.03), r(.68, 1.26, .2, .9, -.03), r(.9, 1.16, .5, 1), r(1.1, .9, .8, 1.05), r(1.2, .3, 1, 1.1)], { cap: 'top', ur: 2 });
    for (const sx of [-1, 1]) G.at(R.TR(sx * HW * 1.06, Hd * .42, -Hd * .05)).box(HW * .2, Hd * .3, Hd * .34, 0, 0, 0, {}).at(null);
    const me = G.mesh(tex.fur({ c: o.c })); p.userData.J.head.add(me); return me; }

  // ---- 荷をつんだ木のそり ----
  function sled(o = {}) { const len = o.len || 2.4, w = o.w || .9, B = R.parts(), Wd = B.g(T.planks({ c: o.c || '#8a5e3c', w: 8 })), Rn = B.g(T.bark({ c: '#6a4a34' })), g = new THREE.Group();
    for (const sx of [-1, 1]) { const x = sx * w * .45, pts = [[0, -len * .5], [0, len * .3], [.12, len * .45], [.34, len * .52], [.5, len * .48]]; for (let i = 0; i < pts.length - 1; i++) { const [y0, z0] = pts[i], [y1, z1] = pts[i + 1], d = Math.hypot(y1 - y0, z1 - z0); Rn.at(R.TR(x, y0 + .04, z0, 0, Math.atan2(z1 - z0, y1 - y0))).loft(4, [[0, .045, .045, 0], [d, .045, .045, 1]]).at(null); }
      for (let k = 0; k < 4; k++) Rn.box(.06, .26, .06, x, .04, -len * .42 + k * len * .26, {}); }
    Wd.box(w, .06, len * .86, 0, .3, -len * .06, { m: 1 });
    if (o.load !== false) { const L = B.g(tex.hide({ c: '#9a7a58', c2: '#7a5c44', seed: 3 })); L.smooth(1).at(R.TR(0, .36, -len * .1, 0, PI / 2)).loft(7, [[-len * .38, w * .3, .12, 0, .8], [-len * .25, w * .5, .3, .3], [len * .2, w * .48, .32, .7], [len * .32, w * .3, .14, 1, .85]], { cap: 'both', rot: 0 }).at(null);
      const Rp = B.g(T.bark({ c: '#c8b088' })); for (const z of [-.45, .1]) Rp.at(R.TR(0, .36, z * len * .6)).loft(6, [[-.02, w * .52, .34, 0], [.03, w * .52, .34, 1]]).at(null); }
    g.add(B.group()); g.userData.hitch = new THREE.Vector3(0, .5, len * .5); return g; }

  // ---- 2 点のあいだに張る ひも ----
  function rope(t) { const me = R.geo().smooth(1).at(R.TR(0, 0, 0, 0, PI / 2)).loft(4, [[0, .018, .018, 0], [1, .018, .018, 1]]).at(null).mesh(t || T.bark({ c: '#c8b088' })), A = new THREE.Vector3(), Bv = new THREE.Vector3();
    me.userData.dyn = true; me.userData.span = (a, b) => { A.copy(a); Bv.copy(b); me.position.copy(A); me.lookAt(Bv); me.scale.set(1, 1, A.distanceTo(Bv)); }; return me; }

  return { tex, snowPine, tent, reindeer, reindeerPose, furHat, sled, rope };
};
