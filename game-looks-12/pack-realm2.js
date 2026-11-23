// game-looks-12「霧と飛空艇の王国」（16〜20）で使い回す部品。../game-looks-7/kit.js・retro.js・../game-looks-8/pack-fantasy-town.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), F = PACK_FTOWN(THREE, K, R), Q = PACK_REALM2(THREE, K, R, F);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'。
//
// ■ 乗りもの
//   Q.skyShip({ s: 1, c（船体の木）, c2（帯と旗）, sail, sail2（帆のたてじま）, crest, cc, wing（つばさの布）, rib（つばさのほね）, lamp（窓とともの灯の色）, bob: 1 }) → Group
//       帆の飛空艇。F.ship（帆船）の船体の左右に、木のほねに布を張った扇のつばさ、ともに 2 つのプロペラ、船底に竜骨のひれ、へさきと ともに灯。
//       前は +z、y=0 が水線（船底は y=-.9×s ほど）。長さ 13 m × s。ゆっくり上下し、つばさが風でそよぎ、プロペラが回る。毎コマ Q.tick(t)（F.tick(t) も）。
// ■ 毎コマ  Q.tick(t)
window.PACK_REALM2 = (THREE, K, R, F) => {
  const { hash, ramp, Px, TR, geo, parts } = R, T = R.tex, PI = Math.PI, Q = { live: [] }, cache = new Map();
  const reg = (o, f) => { o.userData.tick = f; o.userData.dyn = true; Q.live.push(o); return o; };
  Q.tick = t => { for (let i = 0; i < Q.live.length; i++) Q.live[i].userData.tick(t); };
  const memo = (k, f) => { let v = cache.get(k); if (!v) cache.set(k, v = f()); return v; };

  // つばさの布（32×32。ほねにそった ぬい目、ふちの帯、つぎあて。抜き色なし）
  const wingTex = (c, c2) => memo('wing' + c + c2, () => { const P = Px(32), A = ramp(c, 6, { contrast: .8 }), B = ramp(c2);
    P.each((x, y) => hash(x >> 1, y >> 2, 5) > .84 ? A[2] : (x + y) % 9 === 0 ? A[2] : A[3]);
    for (let x = 0; x < 32; x++) { P.set(x, 0, B[1]); P.set(x, 1, B[2]); P.set(x, 2, B[3]); P.set(x, 3, B[4]); P.set(x, 4, A[1]); }   // つばさの先の色の帯
    for (const yy of [11, 22]) for (let x = 0; x < 32; x++) { P.set(x, yy, A[1]); P.set(x, yy + 1, A[4]); }   // ぬい目
    P.rect(19, 14, 7, 6, A[4]); P.rect(19, 14, 7, 1, A[1]); P.rect(19, 19, 7, 1, A[1]); P.rect(19, 14, 1, 6, A[1]); P.rect(25, 14, 1, 6, A[1]);   // つぎあて
    for (let y = 5; y < 32; y++) { P.set(0, y, A[1]); P.set(31, y, A[5]); }
    return T.from(P, { m: 2 }); });
  // 回る羽根（n 枚、長さ r。軸は z）
  const rotor = (n, r, tx) => { const G = geo().normal([0, .3, 1]); for (let k = 0; k < n; k++) G.at(TR(0, 0, 0, 0, 0, k * PI * 2 / n)).quad([-r * .12, 0, 0], [r * .12, 0, 0], [r * .22, r, .05], [-r * .22, r, -.05], [0, 0, .4, r / 1.5]).at(null); return G.mesh(tx, { side: true }); };

  Q.skyShip = (o = {}) => { const s = o.s || 1, g = new THREE.Group(), body = new THREE.Group(), ship = F.ship({ c: o.c || '#7a5236', c2: o.c2 || '#c8453a', sail: o.sail, sail2: o.sail2, crest: o.crest, cc: o.cc, trim: o.trim, flag: o.flag }), B = parts();
    body.add(ship);
    const rib = T.planks({ c: o.rib || '#6a4c34' }), Rb = B.g(rib), Wg = B.g(wingTex(o.wing || '#ece0c4', o.c2 || '#c8453a'), { side: true }), It = B.g(F.tex.iron({ rust: .2, c: o.iron }));
    // つばさ：ふなべりの 2 点から、外へ 4 本のほねが扇にひらく。ほねのあいだに布
    const wings = [];
    for (const sx of [-1, 1]) { const wg = new THREE.Group(), G = geo(), Gr = geo(), L = [5.4, 6.6, 6.2, 4.6], A = [.55, .25, -.08, -.42];
      const tip = k => [sx * Math.cos(A[k]) * L[k] * .96, .9 + Math.sin(.18 + k * .02) * L[k] * .25, Math.sin(A[k]) * L[k] * 1.1 - .6];
      for (let k = 0; k < 3; k++) { const a = tip(k), b = tip(k + 1); G.tri([0, .1, 1.2 - k * .9], a, b, [0, .2], [0, 1], [1, 1]).tri([0, .1, 1.2 - k * .9], b, [0, .1, .3 - k * .9], [0, .2], [1, 1], [1, .2]); }
      for (let k = 0; k < 4; k++) { const a = tip(k), b = [0, .1, 1.2 - Math.min(k, 3) * .9]; const d = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = Math.hypot(...d), ry = Math.atan2(d[0], d[2]), rx = -Math.asin(d[1] / len);
        Gr.at(TR(b[0], b[1], b[2], ry, rx + PI / 2, 0)).loft(4, [[0, .1, .1, 0, .85], [len, .05, .05, len / 2, 1]], {}).at(null); }
      wg.add(G.mesh(wingTex(o.wing || '#ece0c4', o.c2 || '#c8453a'), { side: true }), Gr.mesh(rib)); wg.position.set(sx * 1.95, 1.3, .2); body.add(wg); wings.push(wg); }
    // 竜骨のひれ（船底）と、ともの軸受け
    Rb.tri([0, -.7, 4.2], [0, -.7, -4.8], [0, -2.2, -3.4], [0, 1], [3, 1], [2.4, 0]);
    Rb.tri([0, -.7, 4.2], [0, -2.2, -3.4], [0, -.7, -4.8], [0, 1], [2.4, 0], [3, 1]);
    const props = [];
    for (const sx of [-1, 1]) { It.at(TR(sx * 1.25, .7, -6, 0, PI / 2)).loft(6, [[-.9, .14, .14, 0, .8], [-.6, .34, .34, .3, 1], [.7, .3, .3, .8, 1], [1, .1, .1, 1, .9]], { ur: 2 }).at(null);
      const hd = new THREE.Group(), rm = rotor(4, 1.15 * 1, T.planks({ c: '#c8a878' })); hd.position.set(sx * 1.25, .7, -7.05); hd.add(rm); body.add(hd); props.push(rm); }
    body.add(B.group());
    // 灯（へさきと とも）
    const lampC = o.lamp || '#ffd27a', glow = new THREE.MeshBasicMaterial({ color: lampC, fog: false }), lamps = [];
    for (const p of [[0, 3.3, 6.4], [1.1, 3.9, -5.6], [-1.1, 3.9, -5.6]]) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(.22, 0), glow); m.position.set(...p); body.add(m); lamps.push(m); }
    body.scale.setScalar(s); g.add(body); g.userData.lamps = lamps; g.userData.len = 13 * s;
    const bob = o.bob ?? 1, ph = Q.live.length * 1.7;
    return reg(g, t => { body.position.y = Math.sin(t * .6 + ph) * .25 * bob * s; body.rotation.z = Math.sin(t * .45 + ph) * .02 * bob;
      wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (Math.sin(t * 1.1 + ph + i) * .05 + .03); });
      props.forEach((p, i) => { p.rotation.z = t * (o.spin ?? 7) * (i ? -1 : 1); }); }); };
  return Q;
};
