// game-looks-12 の題材「霧と飛空艇の王国」（11〜15）の追加の部品。kit.js・retro.js・game-looks-8/pack-fantasy-town.js のあとに読み、
//   const RM = PACK_REALM1(THREE, K, R, F);   として使う（F は PACK_FTOWN）。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。足もとが y=0、正面が +z、大きさは m。
//
// ■ 形
//   RM.roundHouse({ r: 2.2, h: 2.6, wall, roof, roofH, base, door, win, winLit, lit: 0〜1, wins: [面の番号…], chimney, bell: 0〜1（屋根のふくらみ） })
//       まるい屋根の家（10 角の筒のかべに、すそが張りだして ふっくらまるい とんがり屋根）。userData.top = 屋根のてっぺんの高さ、userData.smoke = えんとつの口（ローカル）
//   RM.skyShip({ s, c（船体）, c2（帯と旗）, sail, sail2, crest, wing（つばさの帆の色）, bag（気のうの色。入れると帆柱の上に長い気のうが付く）, bag2 })
//       帆の飛空艇（F.ship の船体と帆に、左右へ張りだす つばさの帆と、うしろのプロペラ）。全体がゆっくり上下するので R.merge に入れず scene に置き、F.tick(t) で動かす
//   RM.cloudSea({ y: -30, w: 700, d: 700, cz, c, shade, m }) → R.ground の戻り値（{ mesh, follow }）   下に広がる霧の海（雲海）。ゆるいうねりと明暗
//   RM.drift(scene, { n, area: [x0, x1, y0, y1, z0, z1], s, c, shade, speed, seed }) → { tick(t) }   霧の海の上をゆっくり流れる雲のかたまり（R.cloud の板）
window.PACK_REALM1 = (THREE, K, R, F) => {
  const T = R.tex, { hash } = K, PI = Math.PI, RM = {};

  // ---- まるい屋根の家 ----
  RM.roundHouse = (o = {}) => {
    const r = o.r || 2.2, h = o.h || 2.6, n = 10, B = R.parts(), circ = 2 * PI * r, ur = Math.max(1, Math.round(circ / 3)), cf = Math.cos(PI / n);
    const wallT = o.wall || T.plaster({ c: '#ece0c8' }), roofT = o.roof || T.shingle({ c: '#3a7a8a' }), baseT = o.base || T.stone({ c: '#a49a8a' });
    B.g(wallT).loft(n, [[0, r, r, 0, .82], [h, r, r, h / 3, 1]], { ur });                                   // しっくいの かべ
    B.g(baseT).loft(n, [[-.4, r + .1, r + .1, 0, .75], [.55, r + .1, r + .1, .32, .9]], { ur, cap: 'top' });  // 石の土台
    const rh = o.roofH || r * 1.15, e = r + .5, bl = o.bell ?? .5, kv = rh / 3;
    B.g(roofT).loft(n, [[h - .25, e, e, 0, .78], [h + rh * .1, r * (1.02 + .06 * bl), r * (1.02 + .06 * bl), kv * .15, .88], [h + rh * .38, r * (.9 + .08 * bl), r * (.9 + .08 * bl), kv * .4, .97], [h + rh * .64, r * (.66 + .08 * bl), r * (.66 + .08 * bl), kv * .65, 1.04], [h + rh * .86, r * .34, r * .34, kv * .86, 1.1], [h + rh, .05, .05, kv, 1.14]], { ur: Math.max(1, Math.round(circ / 2.4)), cap: 'bot', capUV: [.5, .1] });
    B.g(T.planks({ c: '#6a4c34' })).loft(5, [[h + rh - .05, .05, .05, 0, .8], [h + rh + .7, .03, .03, 1, 1]], {});   // てっぺんの小さな ぼう
    const front = r * cf + .03, dt = o.door || T.door({ style: 'plank', c: '#7a4a30', arch: 1 });
    B.g(dt, { offset: true }).quad([-.48, 0, front], [.48, 0, front], [.48, 1.9, front], [-.48, 1.9, front]);
    const wt = o.win || T.window({ bars: 'cross', arch: 1, shutters: 1, frame: '#5a4030' }), lt = o.winLit || T.window({ bars: 'cross', arch: 1, lit: 1, shutters: 1, frame: '#5a4030' });
    (o.wins || [3, 7, 1, 9, 5.01]).forEach((j, i) => { const lit = (o.lit ?? 0) > hash(i, j, 3), G = B.g(lit ? lt : wt, { offset: true, glow: lit }), A = Math.round(j) / n * 2 * PI, dx = -Math.sin(A), dz = -Math.cos(A), rx = dz, rz = -dx, c = [dx * (r * cf + .04), 0, dz * (r * cf + .04)], w = .45, y0 = j === 5.01 ? h * .62 : h * .38, y1 = y0 + (j === 5.01 ? .6 : .95);
      if (j === 5.01 && h < 2.4) return; const X = (s, y) => [c[0] + rx * w * s, y, c[2] + rz * w * s]; G.quad(X(-1, y0), X(1, y0), X(1, y1), X(-1, y1)); });
    let smoke = null;
    if (o.chimney) { const cx = r * .45, cz = -r * .3, y0 = h + rh * .3; B.g(T.brick({ c: '#9a5a44' })).at(R.TR(cx, 0, cz)).loft(4, [[y0, .28, .28, 0, .85], [y0 + rh * .7, .26, .26, 1, 1]], { cap: 'top', rot: 0 }).at(null); smoke = new THREE.Vector3(cx, y0 + rh * .75, cz); }
    const g = B.group(); g.userData = { top: h + rh, smoke, r }; return g; };

  // ---- 帆の飛空艇 ----
  RM.skyShip = (o = {}) => {
    const g = F.ship({ s: o.s || 1, c: o.c || '#6a4a34', c2: o.c2 || '#c8453a', sail: o.sail || '#f0e6cc', sail2: o.sail2, crest: o.crest || 'sun', cc: o.cc, flag: o.flag ?? 'none' }), body = g.children[0], B = R.parts();
    const Wg = B.g(F.tex.sail({ c: o.wing || o.sail || '#f0e6cc', c2: o.c2 || '#c8453a' }), { side: true }), Sp = B.g(T.planks({ c: '#5a4030' }));
    for (const sx of [-1, 1]) {   // つばさの帆（骨 3 本に 布を張った扇）
      const root = [[sx * 2.1, 2.2, 2.6], [sx * 2.2, 2.3, -.6], [sx * 2.0, 2.4, -3.8]], tip = [[sx * 6.4, 3.4, 1.6], [sx * 8.6, 4.2, -1.8], [sx * 7.2, 3.6, -5.6]];
      for (let i = 0; i < 2; i++) { const a = root[i], b = root[i + 1], c = tip[i + 1], d = tip[i]; Wg.quad(sx > 0 ? a : b, sx > 0 ? b : a, sx > 0 ? c : d, sx > 0 ? d : c, [i * .5, 0, i * .5 + .5, 1]); }
      for (let i = 0; i < 3; i++) { const a = root[i], b = tip[i], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
        Sp.at(new THREE.Matrix4().lookAt(new THREE.Vector3(...a), new THREE.Vector3(...b), new THREE.Vector3(0, 1, 0)).setPosition(...a).multiply(new THREE.Matrix4().makeRotationX(-PI / 2))).loft(4, [[0, .09, .09, 0, .8], [L, .04, .04, 1, 1]], {}).at(null); } }
    if (o.bag) { const bt = F.tex.balloon({ c: o.bag, c2: o.bag2 || o.c2 || '#c8453a' }), ey = 13.4, er = 2.6;
      B.g(bt).smooth(1).at(R.TR(0, ey, .8, 0, PI / 2)).loft(10, [[-7.5, .05, .05, 0, .8], [-6.3, er * .55, er * .55, .08, .86], [-4, er * .92, er * .92, .26, .95], [0, er, er, .5, 1], [3.6, er * .9, er * .9, .74, 1], [6, er * .5, er * .5, .92, 1.02], [7.2, .05, .05, 1, 1.05]], { ur: 3 }).at(null).smooth(0);
      const Rp = B.g(F.tex.rope(), { side: true }); for (const [a, b] of [[[1.9, 2, -4], [er * .7, ey - er * .7, -4.2]], [[-1.9, 2, -4], [-er * .7, ey - er * .7, -4.2]], [[1.7, 2, 4.5], [er * .7, ey - er * .7, 4.6]], [[-1.7, 2, 4.5], [-er * .7, ey - er * .7, 4.6]], [[0, 10, -.6], [0, ey - er, -.6]], [[0, 8.4, 3], [0, ey - er, 3]]]) Rp.quad([a[0], a[1], a[2] - .05], [a[0], a[1], a[2] + .05], [b[0], b[1], b[2] + .05], [b[0], b[1], b[2] - .05], [0, 0, 1, 6]); }
    body.add(B.group());
    const prop = new THREE.Group(), P = R.geo(); for (let k = 0; k < 3; k++) { const a = k * 2 * PI / 3; P.at(R.TR(0, 0, 0, 0, 0, a)).quad([-.22, 0, 0], [.22, 0, 0], [.14, 1.9, .05], [-.14, 1.9, .05], [0, 0, 1, 2]).at(null); }
    prop.add(P.mesh(T.planks({ c: '#c8a878' }), { side: true })); prop.position.set(0, 3.2, -6.2); body.add(prop);
    const old = g.userData.tick; g.userData.tick = t => { old(t); prop.rotation.z = t * (o.spin ?? 7); }; return g; };

  // ---- 霧の海（雲海） ----
  RM.cloudSea = (o = {}) => { const y = o.y ?? -30, a = o.a || .05, b = o.b || .043;
    const g = R.ground({ w: o.w || 700, d: o.d || 700, cell: o.cell || 16, cz: o.cz || 0, cx: o.cx || 0, H: (x, z) => y + Math.sin(x * a) * Math.cos(z * b) * 3 + Math.sin(x * .13 + z * .09) * 1.3, layers: [T.snow({ c: o.c || '#f0e2dc', m: o.m || 40 })],
      shade: (x, z) => { const k = .5 + .5 * Math.sin(x * a) * Math.cos(z * b), s = o.shade || [.78, .74, .82]; return [s[0] + (1 - s[0]) * k, s[1] + (1 - s[1]) * k, s[2] + (1 - s[2]) * k]; } });
    g.mesh.receiveShadow = false; g.mesh.castShadow = false; return g; };

  // ---- 流れる雲のかたまり ----
  RM.drift = (scene, o = {}) => { const n = o.n || 10, A = o.area || [-200, 200, -30, -10, -300, -40], sp = o.speed ?? 2, list = [];
    for (let i = 0; i < n; i++) { const c = R.cloud({ s: (o.s || 40) * (.6 + hash(i, 1, o.seed || 0) * .8), c: o.c || '#fbeee4', shade: o.shade || '#c8a8b8', seed: i + (o.seed || 0) }); scene.add(c);
      list.push({ c, x: A[0] + hash(i, 2, o.seed || 0) * (A[1] - A[0]), y: A[2] + hash(i, 3, o.seed || 0) * (A[3] - A[2]), z: A[4] + hash(i, 4, o.seed || 0) * (A[5] - A[4]) }); }
    return { list, tick: (t, cam) => { const W = A[1] - A[0]; for (const q of list) { const x = A[0] + ((((q.x - A[0]) + t * sp) % W) + W) % W; q.c.position.set(x, q.y, q.z); if (cam) q.c.lookAt(cam.position.x, q.y, cam.position.z); } } }; };

  return RM;
};
