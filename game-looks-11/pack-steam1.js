// 第 11 集「蒸気と歯車の町」（41〜45）で使い回す部品。../game-looks-7/kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), S = PACK_STEAM1(THREE, K, R);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。決まりも同じ（足もとが y=0、正面が +z、大きさは m）。
//
// ■ テクスチャ  S.tex.名前({ c, seed }) → THREE.Texture（同じ引数なら同じ物）
//   gearFace { c, spokes: 0〜8, hole }（歯車の正面。64×64。スポークのすきまは抜き）   brass { c }（びょう打ちの真ちゅう板。32×32）
//   gauge { c }（圧力計の文字盤。16×16）
// ■ 形
//   S.gear({ r: 1, n（歯の数）, th: .2（あつみ）, c, spokes: 5, speed: .5（1 秒に回るラジアン）, phase, axle: true }) → Group
//       歯車（正面が +z、z の軸で回る。manual: true で自分で回す）。かみあわせるときは speed を -speed × r1 / r2 に、phase を半歯ずらす。userData.spin ＝ 回る部分
//   S.chimney({ r: .8, h: 12, tex, band, top }) → Mesh   れんがの煙突（上へ少し細くなる。上に帯と口）。userData.top ＝ 口の高さ
//   S.gauge({ r: .25 }) → Group   圧力計（針がふるえる）
// ■ 毎コマ  S.tick(t)  を 1 回（歯車と計器が動く）
window.PACK_STEAM1 = (THREE, K, R) => {
  const { hash, ramp, mix, Px, TR, geo, parts } = R, T = R.tex, S = {}, live = [], cache = new Map(), PI = Math.PI;
  const reg = (o, f) => { o.userData.tick = f; o.userData.dyn = true; live.push(o); return o; };
  const def = (name, m, fn, cut = false) => (o = {}) => { const key = name + JSON.stringify(o); let t = cache.get(key); if (!t) { t = T.from(fn(o), { m: o.m || m, cut }); cache.set(key, t); } return t; };
  S.tex = {};

  // 歯車の正面。外がわの歯の帯、ふちの面取り、スポーク（すきまは抜き）、まん中の軸とボルト。光は左上から
  S.tex.gearFace = def('gearFace', 1, (o = {}) => { const P = Px(64), A = ramp(o.c || '#c8963a'), n = o.spokes ?? 5, hole = o.hole !== false;
    P.each((x, y) => { const dx = x + .5 - 32, dy = y + .5 - 32, r = Math.hypot(dx, dy), d = r / 32, a = Math.atan2(dy, dx), lit = (-dx - dy) / (r + .01) / 1.41;
      if (d > 1.02) return null;
      if (d > .86) return A[lit > .45 ? 4 : lit < -.45 ? 2 : 3];
      if (d > .82) return lit > 0 ? A[5] : A[1];
      if (d > .7) { const g = hash(Math.round(a * 40), 3); return d > .78 ? A[3] : g > .85 ? A[2] : d < .72 ? (lit > 0 ? A[1] : A[4]) : A[3]; }
      if (d < .26) { if (d < .08) return A[5]; if (d > .22) return lit > 0 ? A[1] : A[4]; const ba = ((a / (PI * 2 / 6)) % 1 + 1) % 1; if (Math.abs(d - .16) < .035 && Math.abs(ba - .5) < .09) return A[0]; return lit > .3 ? A[4] : A[3]; }
      if (!n) { const q = hash(Math.round(x / 3), Math.round(y / 3), 5); return Math.abs(d - .48) < .02 ? A[1] : q > .9 ? A[2] : A[3]; }
      const sa = ((a / (PI * 2 / n)) % 1 + 1) % 1, off = (sa - .5) * (PI * 2 / n) * r, w = 3.3 - d * 1.2;
      if (Math.abs(off) < w) return off < -w + 1.2 ? A[4] : off > w - 1.2 ? A[1] : A[3];
      if (Math.abs(off) < w + 1.2 || d > .68 || d < .29) return A[1];
      return hole ? null : A[0]; });
    return P; }, true);
  // びょう打ちの真ちゅう板（32×32 ＝ 1.5 m）。四すみのびょう、ふちの光と影、みがいた すじ、ところどころの緑青
  S.tex.brass = def('brass', 1.5, (o = {}) => { const P = Px(32), A = ramp(o.c || '#c8963a'), V = ramp('#5fa08a');
    P.each((x, y) => { const lx = x & 15, ly = y & 31, h1 = hash(x >> 4, 1, o.seed || 0);
      if (lx === 15 || ly === 31) return A[0]; if (lx === 0 || ly === 0) return A[5]; if (lx === 14 || ly === 30) return A[1];
      if ((lx === 3 || lx === 11) && (ly === 3 || ly === 27)) return A[5]; if ((lx === 4 || lx === 12) && (ly === 4 || ly === 28)) return A[1];
      if (ly > 22 && hash(x, y, 7) > .8 && h1 > .5) return V[2 + (x & 1)];
      return (x + (y >> 2)) % 7 === 0 ? A[4] : (y * 3 + x) % 11 === 0 ? A[2] : A[3]; });
    return P; });
  // 圧力計の文字盤（16×16）。白い盤、目もり、赤い区間
  S.tex.gauge = def('gauge', .5, (o = {}) => { const P = Px(16), A = ramp(o.c || '#c8963a'), W = ramp('#ece4cc');
    P.each((x, y) => { const dx = x + .5 - 8, dy = y + .5 - 8, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (r > 8) return null; if (r > 6.6) return dx + dy < 0 ? A[5] : A[1];
      if (r > 5 && r < 6.2 && a < 0 && a > -1.2) return '#c83c30'; if (r > 5 && r < 6.2 && ((a * 6 / PI) % 1 + 1) % 1 < .25 && dy < 2) return '#3a3230'; return r > 5.4 ? W[2] : W[4]; });
    return P; }, true);

  // ---- 歯車 ----
  S.gear = (o = {}) => { const r = o.r || 1, n = o.n || Math.max(8, Math.round(r * 12)), th = o.th ?? Math.max(.12, r * .18), rr = r * .86, c = o.c || '#c8963a', g = new THREE.Group(), spin = new THREE.Group(), B = parts();
    const F = B.g(S.tex.gearFace({ c, spokes: o.spokes ?? (r > .5 ? 5 : 0) }), { side: true }), E = B.g(T.metal({ c: mix(c, '#4a3a30', .25) })), w = PI * 2 / n, pts = [];
    for (let i = 0; i < n; i++) { const b = i * w; pts.push([b - w * .27, rr], [b - w * .14, r], [b + w * .14, r], [b + w * .27, rr]); }
    const P = ([a, rad], z) => [Math.cos(a) * rad, Math.sin(a) * rad, z], U = ([a, rad]) => [.5 + Math.cos(a) * rad / r / 2, .5 + Math.sin(a) * rad / r / 2];
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length];
      F.tri([0, 0, th / 2], P(p, th / 2), P(q, th / 2), [.5, .5], U(p), U(q), 1); F.tri([0, 0, -th / 2], P(q, -th / 2), P(p, -th / 2), [.5, .5], U(q), U(p), .8);
      const lit = .78 + .3 * Math.sin((p[0] + q[0]) / 2 + PI * .75); E.quad(P(p, th / 2), P(p, -th / 2), P(q, -th / 2), P(q, th / 2), [0, 0, .25, .25], lit); }
    if (o.axle !== false) { const ar = r * .14; E.at(TR(0, 0, 0, 0, PI / 2)).loft(6, [[-th * 1.6, ar, ar, 0, .8], [th * 1.6, ar, ar, .3, 1.1]], { cap: 'both' }).at(null); }
    spin.add(B.group()); g.add(spin); g.userData.spin = spin; const sp = o.speed ?? .5, ph = o.phase || 0; spin.rotation.z = ph;
    if (o.manual) { g.userData.dyn = true; return g; }   // manual: true なら自分で  g.userData.spin.rotation.z  を回す
    return reg(g, t => { spin.rotation.z = ph + t * sp; }); };

  // ---- れんがの煙突 ----
  S.chimney = (o = {}) => { const r = o.r || .8, h = o.h || 12, tx = o.tex || T.brick({ c: '#9a4a34' }), m = tx.userData && tx.userData.m || 3, B = parts(), G = B.g(tx), ur = Math.max(2, Math.round(PI * 2 * r / m)), top = r * .82;
    G.loft(8, [[0, r * 1.15, r * 1.15, 0, .7], [.8, r, r, .8 / m, .85], [h * .6, r * .92, r * .92, h * .6 / m, 1], [h - .9, top, top, (h - .9) / m, 1.05]], { ur });
    const Bd = B.g(T.metal({ c: o.band || '#4a4450' })); Bd.loft(8, [[h - .9, top * 1.18, top * 1.18, 0, .8], [h - .5, top * 1.18, top * 1.18, .3, 1.05], [h - .5, top, top, .4, .9], [h, top, top, .6, 1], [h, top * .8, top * .8, .7, .6], [h - .6, top * .8, top * .8, .9, .3]], { ur: 3 });
    const me = B.group(); me.userData.top = h; return me; };

  // ---- 圧力計（針がふるえる） ----
  S.gauge = (o = {}) => { const r = o.r || .25, g = new THREE.Group(), face = geo().quad([-r, -r, 0], [r, -r, 0], [r, r, 0], [-r, r, 0]).mesh(S.tex.gauge({ c: o.c })), nd = geo().quad([-r * .05, 0, .01], [r * .05, 0, .01], [0, r * .8, .01], [0, r * .8, .01]).mesh('#2a2228'); g.add(face, nd); nd.userData.dyn = true; const ph = hash(live.length, 9) * 9;
    return reg(g, t => { nd.rotation.z = -.4 + Math.sin(t * 1.3 + ph) * .3 + Math.sin(t * 17 + ph) * .04; }); };

  // ---- 人の小物：おでこに上げたゴーグル（R.actor の頭の関節に付ける）。c ＝ わくの色、lens ＝ レンズの色 ----
  S.goggles = (p, o = {}) => { const b = p.userData.build, Hd = b.head, HW = b.hw * Hd, B = parts(), M = B.g(T.metal({ c: o.c || '#c8963a' })), L = B.g(o.lens || '#9ad8e8', { glow: true }), r = HW * (o.r || .27), y = Hd * (o.y || .8), z = HW * (o.z || .78);
    for (const s of [-1, 1]) { const x = s * HW * .42; M.at(TR(x, y, z, 0, PI / 2)).loft(8, [[-r * .3, r, r, 0, .8], [r * .9, r, r, .5, 1.1], [r * .9, r * .72, r * .72, .7, 1]], { rot: 0 }).at(null); L.at(TR(x, y, z + r * .75, 0, PI / 2)).loft(8, [[0, r * .74, r * .74, 0, 1]], { cap: 'top' }).at(null); }
    const g = B.group(); p.userData.J.head.add(g); return g; };

  S.tick = t => { for (let i = 0; i < live.length; i++) live[i].userData.tick(t); };
  return S;
};
