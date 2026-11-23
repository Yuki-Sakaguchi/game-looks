// 第 11 集「砂と草原の旅」（16〜20）で使い回す小さな部品。game-looks-7 の kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), SD = PACK_SAND2(THREE, K, R);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。決まりも同じ（足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'）。
//
// ■ 生きもの
//   SD.camel({ c, belly, c2（鞍の布）, saddle: true, s }) → Group   らくだ（こぶ 1 つ、長い首と足）。SD.camelPose(らくだ, 'walk'/'stand'/'rest'（ひざを折って休む）, t)
//   SD.goat({ c, belly, horn, s, beard: true }) → Group   やぎ（短い角とあごひげ）。SD.goatPose(やぎ, 'walk'/'stand'/'graze'/'climb', t)
// ■ 物
//   SD.tent({ w: 2.4, d: 2.8, h: 1.8, c, c2, open: true }) → Group   旅の小さな三角テント（布はしま。前の入口に明かりがもれる）
//   SD.hood(actor, { c, c2, mask: true }) → Group   頭からかぶる布と、口と鼻をおおう布（頭の関節に付ける）。砂嵐の旅人
window.PACK_SAND2 = (THREE, K, R) => {
  const { hash } = K, T = R.tex, TR = R.TR, SD = {};

  // ---- けものの 1 枚絵（64×32）。胴(0,0,32,32)・こぶ(32,0,16,16)・首(32,16,16,16)・頭(48,0,8,16)・足(56,0,8,16)・布(48,16,8,16)・尾と角(56,16,8,16) ----
  const furTex = (o = {}) => { const P = R.Px(64, 32), C = R.ramp(o.c || '#c89a5c', 6, { contrast: .8 }), W = R.ramp(o.belly || o.c || '#e0c08a', 6, { contrast: .6 }), Q = R.ramp(o.c2 || '#b83a34'), Q2 = R.ramp(o.c3 || '#2e5a8a'), Hn = R.ramp(o.horn || '#6a5a4a'), sd = o.seed || 0, dk = '#3a2a28';
    P.each((x, y) => { const n = hash(x >> 1, y, sd); let t = n > .82 ? 4 : n < .2 ? 2 : 3; if ((x + y * 3) % 7 === 0) t = 2; return C[t]; });
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const u = x / 32; if (Math.abs(u - .5) < .17) P.set(x, y, hash(x, y, sd + 1) > .5 ? W[3] : W[4]); if (Math.abs(u - .5) < .1) P.set(x, y, W[4]); if (u < .06 || u > .94) P.set(x, y, hash(x, y, sd + 2) > .4 ? C[4] : C[5]); }   // まん中（u=.5）が腹、はし（u=0,1）が背
    for (let y = 0; y < 16; y++) for (let x = 32; x < 48; x++) P.set(x, y, y < 4 ? C[5] : hash(x, y, sd + 3) > .7 ? C[3] : C[4]);   // こぶは上が明るい
    for (let y = 16; y < 32; y++) for (let x = 32; x < 48; x++) { const u = (x - 32) / 16; P.set(x, y, Math.abs(u - .5) < .2 ? W[3] : hash(x, y, sd + 4) > .75 ? C[2] : C[3]); if (o.mane && (u < .12 || u > .88)) P.set(x, y, C[1]); }
    for (let y = 0; y < 16; y++) for (let x = 48; x < 56; x++) P.set(x, y, y < 3 ? C[1] : y < 5 ? C[2] : C[3]);   // 頭（上の行が鼻先）
    P.set(49, 7, dk); P.set(50, 7, dk); P.set(54, 7, dk); P.set(53, 7, dk); P.set(49, 6, '#f0e8d8'); P.set(54, 6, '#f0e8d8'); P.set(51, 1, dk); P.set(52, 1, dk);   // 目・まつげ・鼻のあな
    for (let y = 0; y < 16; y++) for (let x = 56; x < 64; x++) P.set(x, y, y > 13 ? dk : y > 11 ? C[1] : y < 3 ? C[3] : hash(x, y, sd + 5) > .6 ? C[2] : C[3]);   // 足（下がひづめ）
    for (let y = 16; y < 32; y++) for (let x = 48; x < 56; x++) { const j = y - 16, i = x - 48; P.set(x, y, j < 2 || j > 13 ? Q[1] : (j % 4 === 2) ? Q2[3] : (i + j) % 4 === 0 ? '#f0d890' : Q[3]); if (j === 1 || j === 14) P.set(x, y, '#f0d890'); }   // 鞍の布（しまと金のふち）
    for (let y = 16; y < 32; y++) for (let x = 56; x < 64; x++) P.set(x, y, o.hornTail ? (y % 3 ? Hn[3] : Hn[1]) : y > 26 ? C[1] : C[2]);
    return T.from(P, { m: 1 }); };

  // 4 本足の生きもの（らくだ・やぎ）。S: { L 胴の長さ, rb 胴の半径, leg 足の長さ, neck, neckF（首の前への出）, head, hr, legR, hump, tail }
  const beast4 = (S, tex, o = {}) => { const s = o.s || 1, m = R.mat(tex, { vc: true, smooth: true }), g = new THREE.Group(), root = new THREE.Group(), J = {}, W = 64, H = 32, L = S.L, rb = S.rb, hr = S.hr, RX = TR(0, 0, 0, 0, Math.PI / 2); root.scale.setScalar(s); g.add(root);
    const part = (G, parent, x, y, z) => { const me = new THREE.Mesh(G.build(), m); me.castShadow = true; const pv = new THREE.Group(); pv.position.set(x, y, z); pv.add(me); parent.add(pv); return pv; };
    const Gb = R.geo().smooth(1).px(0, 0, 32, 32, W, H).at(RX).loft(7, [[-L * .5, rb * .45, rb * .55, 0, .9], [-L * .36, rb * .92, rb * .98, .15], [-L * .05, rb * .95, rb * 1.02, .45], [L * .28, rb, rb * 1.06, .78], [L * .5, rb * .6, rb * .7, 1]], { cap: 'both', rot: 0 });
    if (S.hump) Gb.at(TR(0, rb * .55, -L * .04)).px(32, 0, 16, 16, W, H).loft(7, [[0, rb * .78, rb * .95, 0, .95], [S.hump * .55, rb * .55, rb * .7, .5], [S.hump, rb * .18, rb * .25, 1, 1.05]], { cap: 'top' });
    if (S.hump && o.saddle !== false) Gb.at(TR(0, rb * .55, -L * .04)).px(48, 16, 8, 16, W, H).smooth(2).loft(8, [[-rb * .05, rb * 1.06, rb * 1.12, 0, .9], [S.hump * .45, rb * .66, rb * .8, 1, 1.05]], {});
    J.body = part(Gb.at(null), root, 0, S.leg + rb * .3, 0);
    const n = S.neck, f = S.neckF || 0; J.neck = part(R.geo().smooth(1).px(32, 16, 16, 16, W, H).loft(6, [[-.06, rb * .5, rb * .62, 0, .95], [n * .45, hr * 1.05, hr * 1.15, .45, 1, 0, f * .9], [n, hr * .85, hr * .95, 1, 1, 0, f]], {}), J.body, 0, rb * .35, L * .42);
    const Gh = R.geo().smooth(1).px(48, 0, 8, 16, W, H).at(RX).loft(6, [[-hr * .9, hr * .62, hr * .7, 0, .95], [0, hr, hr * 1.05, .3], [S.head * .5, hr * .78, hr * .88, .6], [S.head, hr * .55, hr * .62, 1]], { cap: 'both', rot: 0 }).at(null).smooth(0);
    for (const sx of [-1, 1]) { const a = [sx * hr * .7, hr * .6, -hr * .5], b = [sx * hr * .3, hr * .85, -hr * .5], c = [sx * (hr * .7 + S.ear * .8), hr * .7 + S.ear * .4, -hr * .8]; Gh.px(56, 0, 8, 8, W, H).tri(a, b, c, [0, 0], [1, 0], [.5, 1]).tri(b, a, c, [0, 0], [1, 0], [.5, 1], .75); }
    if (S.horn) for (const sx of [-1, 1]) Gh.px(56, 16, 8, 16, W, H).at(TR(sx * hr * .45, hr * .7, -hr * .3, 0, -.9, sx * .25)).loft(4, [[0, hr * .45, hr * .5, 0, .9], [S.horn, hr * .1, hr * .06, 1, 1.1, 0, -S.horn * .35]], { cap: 'top' }).at(null);
    if (S.beard) Gh.px(32, 16, 4, 16, W, H).at(TR(0, -hr * .7, S.head * .55, 0, .3)).loft(4, [[-S.beard, hr * .05, hr * .05, 0, .8], [0, hr * .3, hr * .25, 1]], { cap: 'bot' }).at(null);
    J.head = part(Gh, J.neck, 0, n, f);
    const leg = (x, z) => part(R.geo().smooth(1).px(56, 0, 8, 16, W, H).loft(5, [[-S.leg, S.legR * 1.05, S.legR * 1.2, 0], [-S.leg * .08, S.legR * .75, S.legR * .85, .15], [-S.leg * .5, S.legR * 1.05, S.legR * 1.1, .5], [-S.leg * .25, S.legR * 1.5, S.legR * 1.7, .8], [0, S.legR * 2.5, S.legR * 3, 1]], { cap: 'bot' }), J.body, x, -rb * .4, z);
    J.fl = leg(rb * .5, L * .36); J.fr = leg(-rb * .5, L * .36); J.hl = leg(rb * .5, -L * .38); J.hr = leg(-rb * .5, -L * .38);
    J.tail = part(R.geo().smooth(1).px(56, 16, 8, 16, W, H).loft(4, [[0, .04, .04, 0], [S.tail, .025, .02, 1]], { cap: 'top' }), J.body, 0, rb * .45, -L * .49);
    g.userData = { J, spec: S }; return g; };
  const pose4 = (g, pose, t) => { const J = g.userData.J, S = g.userData.spec; let a = 0, amp = 0, by = S.leg + S.rb * .3, brx = 0, neck = S.lean, nod = 0, look = 0, fold = 0;
    if (pose === 'walk' || pose === 'climb') { a = Math.sin(t); amp = pose === 'climb' ? .55 : .42; by += Math.abs(Math.cos(t)) * .02; nod = Math.sin(t * 2) * .06; neck += Math.sin(t * 2) * .05; brx = pose === 'climb' ? -.25 : 0; }
    else if (pose === 'graze') { neck = 2.3 + Math.sin(t * 1.3) * .05; nod = .9 + Math.sin(t * 5) * .08; brx = .08; }
    else if (pose === 'rest') { fold = 1; by = S.rb * .95; neck = S.lean * .5; look = Math.sin(t * .4) * .5; nod = Math.sin(t * .9) * .05 + Math.max(0, Math.sin(t * 2.7)) * .04; }
    else { look = Math.sin(t * .5) * .45; nod = Math.sin(t * .8) * .05; }
    J.body.position.y = by; J.body.rotation.x = brx; J.neck.rotation.x = neck; J.head.rotation.set(-(brx + neck) + nod + (S.headTilt || 0), look, 0);
    const lg = [J.fl, J.fr, J.hl, J.hr]; if (fold) { lg.forEach((l, k) => { l.rotation.x = k < 2 ? 1.5 : -1.5; l.scale.y = .55; }); }
    else { lg.forEach(l => l.scale.y = 1); J.fl.rotation.x = a * amp; J.fr.rotation.x = -a * amp; J.hl.rotation.x = -a * amp; J.hr.rotation.x = a * amp; }
    J.tail.rotation.set(-2.6 + Math.sin(t * .8) * .1, 0, Math.sin(t * 1.3) * .25); };

  const CAMEL = { L: 1.45, rb: .33, leg: 1.12, neck: .74, neckF: .34, lean: .55, head: .44, hr: .11, ear: .07, legR: .055, hump: .42, tail: .38, headTilt: -.15 };
  SD.camel = (o = {}) => beast4(CAMEL, furTex({ c: o.c || '#c8975a', belly: o.belly || '#e2c494', c2: o.c2 || '#b8382e', c3: o.c3 || '#2e5a8a', seed: o.seed }), o);
  SD.camelPose = (g, pose = 'stand', t = 0) => pose4(g, pose, t);
  const GOAT = { L: .62, rb: .17, leg: .42, neck: .26, neckF: .06, lean: .5, head: .24, hr: .075, ear: .08, legR: .03, tail: .1, horn: .26, beard: .09 };
  SD.goat = (o = {}) => beast4({ ...GOAT, beard: o.beard === false ? 0 : GOAT.beard }, furTex({ c: o.c || '#ece4d4', belly: o.belly || '#f6f0e4', horn: o.horn || '#6a5a4a', hornTail: true, mane: true, seed: o.seed }), o);
  SD.goatPose = (g, pose = 'stand', t = 0) => pose4(g, pose, t);

  // ---- テント：しまの布を 2 枚の屋根に、うしろは三角でふさぎ、前は片がわを めくって明かりをのぞかせる ----
  SD.tent = (o = {}) => { const w = o.w || 2.4, d = o.d || 2.8, h = o.h || 1.8, B = R.parts(), C = B.g(T.fabric({ c: o.c || '#d8c8a8', c2: o.c2 || '#a8583a', pattern: 'stripe' }), { side: true }), Pl = B.g(T.planks({ c: '#6a4a34' })), hw = w / 2, hd = d / 2;
    C.quad([-hw, 0, hd], [-hw, 0, -hd], [0, h, -hd], [0, h, hd], [0, 0, d / 1.5, 1.4], .82).quad([hw, 0, -hd], [hw, 0, hd], [0, h, hd], [0, h, -hd], [0, 0, d / 1.5, 1.4], 1);
    C.tri([hw, 0, -hd], [-hw, 0, -hd], [0, h, -hd], [0, 0], [1, 0], [.5, 1], .7).tri([-hw, 0, hd], [-hw * .15, 0, hd + .05], [0, h, hd], [0, 0], [.4, 0], [.5, 1], .9).tri([hw * .95, 0, hd + .5], [hw, 0, hd], [0, h, hd], [0, 0], [.4, 0], [.5, 1], .95);
    if (o.open !== false) B.g(T.window({ lit: 1, curtain: '#ffc070', bars: 'none', frame: '#ffb060', glass: '#ffb060' }), { glow: true, color: o.glow || '#c87038' }).quad([-hw * .1, 0, hd - .4], [hw * .7, 0, hd - .4], [0, h * .8, hd - .4], [0, h * .8, hd - .4], [.2, 0, .8, .9]);
    Pl.at(TR(0, 0, hd + .02)).loft(4, [[0, .04, .04, 0], [h + .2, .03, .03, 1]], {}).at(TR(0, 0, -hd - .02)).loft(4, [[0, .04, .04, 0], [h + .2, .03, .03, 1]], {}).at(null);
    return B.group(); };

  // ---- 頭の布：かみの上からかぶるずきん（顔の前はあく）と、口と鼻をおおう布。うしろへすそが のびる ----
  SD.hood = (actor, o = {}) => { const b = actor.userData.build, Hd = b.head, HW = b.hw * Hd, dp = b.hdep || 1, B = R.parts(), Cl = B.g(T.fabric({ c: o.c || '#c8a878', c2: o.c2 || '#a8885c', pattern: 'plain' }), { side: true }), n = 10, r = (y, k, kz, v, sh = 1, oz = 0) => [y * Hd, HW * k, HW * kz * dp, v, sh, 0, oz * HW];
    const lo = [r(-.3, 1.45, 1.4, 0, .85, -.3), r(.15, 1.5, 1.45, .25, .95, -.12), r(.6, 1.55, 1.5, .5, 1)], hi = [r(.6, 1.55, 1.5, .5, 1), r(1.0, 1.45, 1.42, .75, 1.05), r(1.3, 1.0, 1.0, .9, 1.1), r(1.45, .05, .05, 1, 1.1)];
    Cl.loft(n, lo, { seg: [0, 3] }); Cl.loft(n, lo, { seg: [7, 10] }); Cl.loft(n, hi, {});   // 前（u=.5 のまわり）は 目より下をあける
    Cl.loft(6, [[-.6 * Hd, HW * 1.6, HW * .5, 0, .8, 0, -HW * 1.3], [-.2 * Hd, HW * 1.3, HW * .6, 1, .95, 0, -HW * 1.05]], { seg: [0, 3] });   // うしろのすそ
    if (o.mask !== false) B.g(T.fabric({ c: o.c2 || '#a8885c', c2: o.c || '#c8a878', pattern: 'stripe' }), { side: true }).loft(n, [[.02 * Hd, HW * 1.06, HW * 1.12 * dp, 0, .9], [.38 * Hd, HW * 1.12, HW * 1.2 * dp, 1, 1]], {});
    const gg = B.group(); actor.userData.J.head.add(gg); return gg; };

  return SD;
};
