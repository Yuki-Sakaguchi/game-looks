// game-looks-11 の追加の部品「和の里」（02〜05 で使う）。kit.js・retro.js・pack-fantasy-town.js のあとに読み、
//   const W = PACK_WA1(THREE, K, R, F);   として使う（F は PACK_FTOWN。無くてもよいが、ちょうちんの腕木などに使う）。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。足もとが y=0、正面が +z、大きさは m。
//
// ■ 人の小物
//   W.kasa(人, { c })                    あみがさ（頭の関節に付ける）
//   W.umbrella(人, { c, c2, hand })      和がさ（開いた紙のかさ。手に持つ）。手の向きで かたむくときは、返した Group を 人.add して position・rotation を自分で決める
// ■ 鳥居
//   W.torii({ w, h, c, seed })           朱ぬりの鳥居（黒い根もとと笠木。ぬりのむらは少なめ。F.torii より すっきり）
// ■ あかり
//   W.tex.chochin({ c })                 ちょうちんの紙（16×24。光る材質で使う）
//   W.chochin({ c, s })                  つるした ちょうちん 1 つ（つるす点が y=0）。R.merge に入れてよい
// ■ 石の像・小さな建物
//   W.kitsune({ s, c, bib, side: 1/-1 }) 台にすわる きつねの石像（赤い前かけ）。side で顔を少し内へ向ける
//   W.hokora({ s, c, roof })             小さなほこら（石の台＋木の社＋かわら屋根）
// ■ 植物
//   W.bamboo({ h, r, c, lean, seed })    竹 1 本（節のある幹＋上の葉のかたまり）。userData.top（てっぺんの位置）
//   W.tex.culm({ c })                    竹の幹（節のすじ）
// ■ 田んぼ・里
//   W.suisha({ r, w, c })                水車（userData.wheel を回す。userData.tick(t)）
//   W.kakashi({ c, hat })                かかし（一本足・横木のうで・むぎわら笠・へのへのもへじは描かない）
//   W.sagi({ s })                        しらさぎ（R.bird の白い版。首が長い。W.sagiPose(鳥, 'fly'/'stand', t)）
window.PACK_WA1 = (THREE, K, R, F) => {
  const { hash, ramp, mix, Px, TR, geo, parts, mat } = R, T = R.tex, W = { tex: {} }, PI = Math.PI, cache = new Map();
  const memo = (k, f) => { let t = cache.get(k); if (!t) cache.set(k, t = f()); return t; };

  // ---- あみがさ・和がさ ----
  W.kasa = (p, o = {}) => { const b = p.userData.build, Hd = b.head, HW = b.hw * Hd, r = (f, k, v, s) => [f * Hd, HW * k, HW * k, v, s];
    const m = R.geo().smooth(1).loft(8, [r(.62, 2.6, 0, .8), r(.86, 1.5, .5, 1), r(1.2, .1, 1, 1.08)], { ur: 3, cap: 'top' }).mesh(T.thatch({ c: o.c || '#d8c084' }), { side: true }); p.userData.J.head.add(m); return m; };
  W.tex.wagasa = (o = {}) => memo('wagasa' + JSON.stringify(o), () => { const P = Px(32), A = ramp(o.c || '#c8403a'), B = ramp(o.c2 || '#f0e4c8');
    P.each((x, y) => { const r = Math.hypot(x - 15.5, y - 15.5), a = Math.atan2(y - 15.5, x - 15.5), rib = Math.abs(((a / PI * 8 % 1) + 1) % 1 - .5) < .07; if (r > 15.5) return null; if (r < 3) return B[1]; if (r > 9 && r < 11) return B[3]; return rib ? A[1] : (r > 13 ? A[2] : A[3]); });
    return T.from(P, { m: 1, cut: true }); });
  W.umbrella = (p, o = {}) => { const J = p.userData.J, hand = o.hand === 'L' ? J.foreL : J.foreR, b = p.userData.build, k = (b.head || .26) / .26, g = new THREE.Group(), B = parts();
    B.g(T.planks({ c: '#6a4a30' })).loft(4, [[0, .02 * k, .02 * k, 0, 1], [.95 * k, .016 * k, .016 * k, 1, 1]], {});
    const G = B.g(W.tex.wagasa(o), { side: true }), R0 = .62 * k, top = .95 * k; for (let i = 0; i < 12; i++) { const a0 = i / 12 * PI * 2, a1 = (i + 1) / 12 * PI * 2, q = a => [Math.cos(a) * R0, top - .2 * k, Math.sin(a) * R0], uv = a => [.5 + Math.cos(a) * .48, .5 + Math.sin(a) * .48]; G.tri(q(a0), [0, top, 0], q(a1), uv(a0), [.5, .5], uv(a1), [.9, 1.1, .9]); }
    const m = B.group(); g.add(m); if (o.attach !== false) { g.position.set(0, -.28 * k, .04); g.rotation.x = -.5; hand.add(g); } return g; };

  // ---- ちょうちん ----
  W.tex.chochin = (o = {}) => memo('chochin' + JSON.stringify(o), () => { const P = R.Px(16, 24), A = R.ramp(o.c || '#e0402a'), Kc = R.ramp('#2a2228'); P.fill(A[3]); for (let y = 3; y < 21; y += 3) P.rect(0, y, 16, 1, A[2]);
    P.rect(5, 6, 6, 10, A[5]); P.rect(6, 8, 4, 1, A[1]); P.rect(7, 9, 2, 5, A[1]); P.rect(6, 12, 4, 1, A[1]); P.rect(0, 0, 16, 3, Kc[1]); P.rect(0, 21, 16, 3, Kc[1]); P.rect(0, 1, 16, 1, Kc[3]); return T.from(P, { m: 1 }); });
  W.chochin = (o = {}) => { const s = o.s || 1, B = parts(), L = B.g(W.tex.chochin(o), { glow: true }), Kd = B.g(T.planks({ c: '#3a2a24' }));
    Kd.loft(4, [[-.14 * s, .008, .008, 0, 1], [0, .008, .008, 1, 1]], {});
    L.at(TR(0, -.62 * s, 0, 0, 0, 0, s)).loft(8, [[0, .05, .05, 0, .8], [.04, .17, .17, .1, 1], [.22, .23, .23, .5, 1.1], [.4, .17, .17, .9, 1], [.44, .05, .05, 1, .8]], { cap: 'both' }).at(null); return B.group(); };


  // ---- 鳥居（朱ぬりの柱、黒い根もとと笠木。ぬりの むらは少なめで、すっきり） ----
  W.tex.shu = (o = {}) => memo('shu' + JSON.stringify(o), () => { const P = Px(16, 32), A = ramp(o.c || '#d8402a', 6, { contrast: .8 }), sd = o.seed || 0; P.fill(A[3]);
    for (let x = 0; x < 16; x++) { const h1 = hash(x, 1, sd); if (h1 > .84) { const y0 = Math.floor(hash(x, 2, sd) * 32), len = 3 + Math.floor(hash(x, 3, sd) * 7); for (let j = 0; j < len; j++) P.set(x, y0 + j, mix(A[3], A[4], .55)); } else if (h1 < .1) { const y0 = Math.floor(hash(x, 4, sd) * 32); for (let j = 0; j < 4; j++) P.set(x, y0 + j, mix(A[3], A[2], .6)); } }
    for (let k = 0; k < 3; k++) { const x = Math.floor(hash(k, 6, sd) * 16), y = Math.floor(hash(k, 7, sd) * 32); P.set(x, y, A[1]); P.set(x + 1, y, A[2]); P.set(x, y - 1, A[5]); }
    return T.from(P, { m: o.m || 1 }); });
  W.torii = (o = {}) => { const w = o.w || 3, h = o.h || 3.6, r = o.r || h * .042, B = parts(), Lq = B.g(W.tex.shu({ c: o.c, seed: o.seed || 0 })), Bk = B.g(W.tex.shu({ c: '#2e2a2c', seed: 1 })), kb = Math.min(.42, h * .11);
    for (const sx of [-1, 1]) { Bk.at(TR(sx * w / 2, 0, 0)).loft(8, [[0, r * 1.18, r * 1.18, 0, .8], [kb, r * 1.12, r * 1.12, kb, 1]], { ur: 1 }).at(null);
      Lq.at(TR(sx * w / 2, 0, 0, 0, 0, sx * .025)).loft(8, [[kb, r, r, 0, .85], [h * .97, r * .9, r * .9, h * .9, 1.05]], { ur: 1 }).at(null); }
    Lq.box(w + r * 4, r * 1.25, r * .95, 0, h * .74, 0, { m: 1 }); Lq.box(r * 1.5, h * .15, r * .8, 0, h * .77, 0, { m: 1 });
    for (const sx of [-1, 1]) { Lq.at(TR(0, h * .91, 0, 0, 0, sx * .05)).box(w * .5 + r * 5, r * 1.3, r * 1.6, sx * (w * .25 + r * 2.5), 0, 0, { m: 1 }).at(null);
      Bk.at(TR(0, h * .91 + r * 1.3, 0, 0, 0, sx * .07)).box(w * .5 + r * 6.5, r * .95, r * 2.3, sx * (w * .25 + r * 3.25), 0, 0, { m: 1, c1: 1.15 }).at(null); }
    const g = B.group(); g.userData = { w, h }; return g; };

  // ---- きつねの石像 ----
  W.kitsune = (o = {}) => { const s = o.s || 1, B = parts(), st = T.rock({ c: o.c || '#d6d2c4', moss: .35, seed: 2, m: 1.2 }), G = B.g(st), Ped = B.g(F ? F.tex.ashlar({ c: '#a8a496', moss: .6 }) : T.stone({ moss: .5 })), Bib = B.g(T.fabric({ c: o.bib || '#d8382a', c2: '#f04a34', pattern: 'plain' }), { side: true });
    Ped.box(.62 * s, .16 * s, .78 * s, 0, 0, 0, { m: 1.5 }); Ped.box(.5 * s, .5 * s, .64 * s, 0, .16 * s, 0, { m: 1.5 }); Ped.box(.6 * s, .1 * s, .74 * s, 0, .66 * s, 0, { m: 1.5 });
    const y0 = .76 * s, M = TR(0, y0, 0, (o.side || 0) * .35, 0, 0, s); G.at(M);
    // 胴（すわった形。うしろが広く、胸が前へ）
    G.smooth(1).loft(7, [[0, .19, .25, 0, .78, 0, -.05], [.12, .2, .23, .2, .9, 0, -.04], [.28, .15, .15, .5, 1, 0, .02], [.44, .1, .1, .78, 1.05, 0, .07], [.54, .075, .08, 1, 1, 0, .08]], { cap: 'both' });
    // 前足 2 本
    for (const sx of [-1, 1]) G.smooth(2).loft(5, [[0, .045, .06, 0, .8, sx * .075, .2], [.3, .04, .045, 1, 1, sx * .07, .15]], { cap: 'top' });
    // 頭（前へのびる鼻づら）
    G.at(new THREE.Matrix4().multiplyMatrices(M, TR(0, .62, .07, 0, PI / 2))).smooth(3).loft(6, [[-.1, .03, .03, 0, .9], [-.05, .1, .09, .25, 1], [.04, .1, .085, .5, 1.05], [.12, .055, .05, .8, 1], [.22, .02, .022, 1, .95]], { cap: 'both' });
    // 耳（とがった三角）
    G.at(M).smooth(0); for (const sx of [-1, 1]) { const a = [sx * .03, .68, .02], b = [sx * .1, .68, .03], c = [sx * .09, .86, .0]; G.tri(a, b, c, [0, 0], [1, 0], [.5, 1], 1.1); G.tri(b, a, c, [0, 0], [1, 0], [.5, 1], .8); }
    // しっぽ（うしろから上へ、ふさふさ）
    G.smooth(4).loft(6, [[.02, .06, .06, 0, .9, 0, -.24], [.16, .1, .08, .35, 1, 0, -.33], [.34, .09, .07, .7, 1.05, 0, -.31], [.48, .02, .02, 1, 1.1, 0, -.24]], {});
    // 赤い前かけ（首のまわりに下がる布）
    Bib.at(M).loft(8, [[.36, .16, .16, 1, 1, 0, .1], [.5, .085, .09, 0, 1.05, 0, .085]], { ur: 2 }); G.at(null); Bib.at(null);
    const g = B.group(); g.userData.h = y0 + .9 * s; return g; };

  // ---- ほこら ----
  W.hokora = (o = {}) => { const s = o.s || 1, B = parts(), St = B.g(F ? F.tex.ashlar({ c: '#a4a094', moss: .6 }) : T.stone({ moss: .5 })), Wd = B.g(T.boards({ c: o.c || '#8a6040', seed: 3 })), Dr = B.g(T.door({ style: 'panel', c: '#6a4a30' }));
    St.box(1.1 * s, .5 * s, 1 * s, 0, 0, 0, { m: 1.5 }); Wd.box(.7 * s, .62 * s, .6 * s, 0, .5 * s, 0, { m: 1.5 }); Dr.quad([-.22 * s, .52 * s, .301 * s], [.22 * s, .52 * s, .301 * s], [.22 * s, 1.06 * s, .301 * s], [-.22 * s, 1.06 * s, .301 * s]);
    const g = B.group(); if (F) { const r = F.eastRoof({ w: .9 * s, d: .8 * s, h: .42 * s, eave: .22 * s, lift: .1 * s, roof: o.roof || F.tex.kawara({ c: '#5a6070' }) }); r.position.y = 1.12 * s; g.add(r); } return g; };

  // ---- 竹 ----
  W.tex.culm = (o = {}) => memo('culm' + JSON.stringify(o), () => { const P = Px(16, 64), A = ramp(o.c || '#7aa84a'), sd = o.seed || 0;
    P.each((x, y) => { const k = x < 2 ? 1 : x < 5 ? 2 : x < 10 ? 3 : x < 13 ? 4 : 3; return A[k]; });
    for (let y = 0; y < 64; y++) { if (hash(y, 1, sd) > .8) P.set(6 + Math.floor(hash(y, 2, sd) * 4), y, A[4]); }
    for (const ny of [0, 32]) { P.rect(0, ny, 16, 1, A[0]); P.rect(0, ny + 1, 16, 1, A[5]); P.rect(0, ny + 2, 16, 1, A[2]); P.set(4, ny + 3, A[1]); P.set(11, ny + 3, A[1]); }
    for (let k = 0; k < 4; k++) { const y = 6 + Math.floor(hash(k, 5, sd) * 50); P.set(9, y, A[1]); P.set(10, y + 1, A[1]); }
    return T.from(P, { m: 1 }); });
  W.bamboo = (o = {}) => { const h = o.h || 12, r = o.r || .07, sd = o.seed || 0, lean = o.lean || [0, 0], B = parts(), C = B.g(W.tex.culm({ c: o.c })), Lv = B.g(T.leaves({ c: o.leaf || '#5a9a48', shape: 'fringe', seed: sd % 3 }), { side: true });
    const n = 6, rings = []; for (let i = 0; i <= n; i++) { const t = i / n, bend = t * t; rings.push([t * h, r * (1 - t * .45), r * (1 - t * .45), t * h / 2, .85 + t * .2, lean[0] * bend * h, lean[1] * bend * h]); }
    C.smooth(1).loft(5, rings, { ur: 1 });
    // 上半分に、横へ出た葉のかたまり
    for (let k = 0; k < 6; k++) { const t = .5 + k * .09, y = t * h, a = hash(k, 3, sd) * PI * 2 + k * 2.1, ox = lean[0] * t * t * h, oz = lean[1] * t * t * h, rr = h * (.07 + hash(k, 4, sd) * .04);
      Lv.at(TR(ox + Math.cos(a) * rr * .7, y, oz + Math.sin(a) * rr * .7, a, 0, .25)).smooth(5 + k).loft(5, [[-rr * .2, .05, .05, 0, .75], [rr * .2, rr * 1.15, rr * .8, .5, 1], [rr * .9, .05, .05, 1, 1.15]], { ur: 2 }).at(null); }
    const g = B.group(); g.userData.top = [lean[0] * h, h, lean[1] * h]; return g; };

  // ---- 水車（木の輪。板の羽根。軸は x の向き） ----
  W.suisha = (o = {}) => { const r = o.r || 2, w = o.w || .8, n = o.n || 12, B = parts(), Wd = B.g(T.planks({ c: o.c || '#7a5a3a', seed: 2 })), Dk = B.g(T.boards({ c: '#5a4030', seed: 4 }));
    for (const sx of [-1, 1]) for (let i = 0; i < 16; i++) { const a0 = i / 16 * PI * 2, a1 = (i + 1) / 16 * PI * 2, p = (a, rr, dx = 0) => [sx * w / 2 + dx, Math.cos(a) * rr, Math.sin(a) * rr]; Wd.quad(p(a0, r * .86), p(a1, r * .86), p(a1, r), p(a0, r), [0, 0, 1, .3], 1); Wd.quad(p(a0, r), p(a1, r), p(a1, r * .86), p(a0, r * .86), [0, 0, 1, .3], .8); }
    for (let i = 0; i < n; i++) { const a = i / n * PI * 2; Dk.at(TR(0, 0, 0, 0, a)).box(w * 1.02, .06, r * .34, 0, r * .8, 0, { m: 1 }).at(null); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI; Wd.at(TR(0, 0, 0, 0, a)).box(w * .5, .08, r * 1.9, 0, -.04, 0, { m: 1.5 }).at(null); }
    Wd.at(TR(0, 0, 0, 0, 0, PI / 2)).loft(6, [[-w * .9, .12, .12, 0, 1], [w * .9, .12, .12, 1, 1]], { cap: 'both' }).at(null);
    const wheel = B.group(), g = new THREE.Group(); g.add(wheel); wheel.userData.dyn = true; g.userData.wheel = wheel; g.userData.dyn = true; g.userData.tick = t => { wheel.rotation.x = -t * (o.speed || .5); }; return g; };

  // ---- かかし ----
  W.kakashi = (o = {}) => { const B = parts(), Wd = B.g(T.planks({ c: '#7a5a3a' })), Cl = B.g(T.fabric({ c: o.c || '#4a6a9a', c2: '#f0e8d8', pattern: 'check' }), { side: true }), Hd = B.g(T.fabric({ c: '#efe6d0', pattern: 'plain' })), Th = B.g(T.thatch({ c: '#d8c07a' }), { side: true });
    Wd.loft(4, [[0, .04, .04, 0, 1], [1.75, .035, .035, 1, 1]], {}); Wd.box(1.5, .06, .06, 0, 1.3, 0, { m: 1 });
    Cl.loft(6, [[.75, .26, .16, 0, .85], [1.15, .22, .15, .5, 1], [1.38, .16, .12, 1, 1]], { ur: 2 }); for (const sx of [-1, 1]) Cl.at(TR(sx * .38, 1.33, 0, 0, 0, sx * PI / 2)).loft(5, [[-.2, .09, .08, 0, 1], [.18, .11, .1, 1, .9]], {}).at(null);
    for (const sx of [-1, 1]) Th.at(TR(sx * .76, 1.33, 0, 0, 0, sx * PI / 2)).loft(5, [[0, .05, .05, 0, 1], [.12, .1, .08, 1, 1.1]], {}).at(null);
    Hd.smooth(1).loft(7, [[1.4, .06, .06, 0, .9], [1.5, .15, .14, .3, 1], [1.62, .15, .14, .7, 1.05], [1.72, .05, .05, 1, 1]], { cap: 'top' });
    if (o.hat !== false) Th.smooth(2).loft(8, [[1.62, .38, .38, 0, .8], [1.7, .2, .2, .6, 1], [1.86, .02, .02, 1, 1.1]], { ur: 2, cap: 'top' });
    const g = B.group(); g.userData.sway = true; return g; };

  // ---- しらさぎ ----
  W.sagi = (o = {}) => { const s = o.s || 1, g = new THREE.Group(), B = parts(), Bd = B.g(T.fabric({ c: '#f4f2ea', pattern: 'plain' })), Bk = B.g(T.planks({ c: '#e0b030' })), Lg = B.g(T.planks({ c: '#3a3a40' }));
    const body = new THREE.Group(); g.add(body);
    Bd.at(TR(0, .55 * s, 0, 0, PI / 2 - .25)).smooth(1).loft(6, [[-.28 * s, .03 * s, .03 * s, 0, .9], [-.14 * s, .1 * s, .08 * s, .3, 1], [.1 * s, .09 * s, .08 * s, .7, 1.05], [.24 * s, .03 * s, .03 * s, 1, 1]], { cap: 'both' }).at(null);
    Bd.smooth(2).loft(5, [[.6 * s, .03 * s, .03 * s, 0, 1, 0, .2 * s], [.85 * s, .025 * s, .025 * s, .5, 1.05, 0, .24 * s], [.98 * s, .04 * s, .035 * s, 1, 1.1, 0, .27 * s]], { cap: 'top' });
    Bk.at(TR(0, .96 * s, .3 * s, 0, PI / 2 + .1)).loft(4, [[0, .015 * s, .012 * s, 0, 1], [.16 * s, .002, .002, 1, 1]], {}).at(null);
    const legs = []; for (const sx of [-1, 1]) Lg.loft(4, [[0, .01 * s, .01 * s, 0, 1, sx * .04 * s, 0], [.46 * s, .012 * s, .012 * s, 1, 1, sx * .04 * s, 0]], {});
    body.add(B.group());
    const wingT = T.fabric({ c: '#f8f6f0', pattern: 'plain' }), wm = mat(wingT, { side: true }), wl = [];
    for (const sx of [-1, 1]) { const G = geo(); G.quad([0, 0, .1 * s], [sx * .55 * s, 0, .02 * s], [sx * .55 * s, 0, -.12 * s], [0, 0, -.18 * s], [0, 0, 1, 1], [1, .95, .9, 1]); const m = new THREE.Mesh(G.build(), wm), pv = new THREE.Group(); pv.position.set(sx * .06 * s, .6 * s, 0); pv.add(m); body.add(pv); wl.push(pv); }
    g.userData = { wings: wl, body, dyn: true }; return g; };
  W.sagiPose = (b, kind, t) => { const [l, r] = b.userData.wings; if (kind === 'fly') { const f = Math.sin(t * 5) * .7; l.rotation.z = f; r.rotation.z = -f; b.userData.body.rotation.x = .9; } else { l.rotation.z = 1.4; r.rotation.z = -1.4; b.userData.body.rotation.x = 0; } };

  return W;
};
