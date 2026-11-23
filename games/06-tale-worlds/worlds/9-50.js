// ワールド 9-50「巨大なファンのたて穴」。もとは game-looks-9/50-giant-fan-shaft.html（見るだけの場面）。
// 鉄の都市の、上の層へ空気を送る 丸いたて穴の底。頭上で 家より大きなファンが ゆっくり回り、羽根のすき間から白い光のすじが落ちる。
// ゲームにするために足した物：かべ・足場の輪・橋・タンク・機械の当たり判定、底から足場へ、足場から上の足場へのぼる鉄の階段、木箱の山、
// 話せる点検の人たち 8 人と黒ねこ、しらべられる物 4 つ、休けい所の電球と主人公のまわりの弱いあかり（暗さは もとのまま、人が見えるように）。
TALE_WORLD('9-50', G => {
  const { THREE, K, R, T, TL, scene } = G, C = PACK_CITY(THREE, K, R), D = PACK_DARK(THREE, K, R), X = C.tex, { hash } = K, PI = Math.PI, TAU = PI * 2;
  const FOG = '#0b1322', WR = 11, FY = 10.5, FR = 9.7, CY = 3, C0 = 9.25, C1 = 10.95, TOP = 18, N = 28, pol = (r, a, y = 0) => [r * Math.sin(a), y, r * Math.cos(a)], A = k => k / N * TAU;
  const mood = D.mood(scene, G.renderer, 'blackout', { follow: new THREE.Vector3(0, 0, 0), hills: false, range: 16, r: 140, sky: [FOG, FOG, FOG, FOG], fog: [FOG, 16, 70], hemi: ['#6a80b8', '#242a40', .72], key: ['#dceaff', 3, [.1, 1, .07]], fill: ['#3a4a80', .2], base: [.78, .84, 1.02] });
  mood.key.shadow.mapSize.set(2048, 2048);
  G.crt({ noise: 0, bright: 1.12 });

  // ---- 底：鉄板の床と水たまり。まん中が明るい。休けい所のあかりも床に焼きこむ ----
  const REST = [5.3, -1.4], RRY = -1.31, RF = [Math.sin(RRY), Math.cos(RRY)], RS = [Math.cos(RRY), -Math.sin(RRY)];
  const land = R.ground({ w: 24, d: 24, cell: 1, layers: [X.plate({ c: '#4c5874', n: 4 }), X.asphalt({ wet: 1, c: '#3a455c', wetC: '#5a7ab8' }), X.conc({ c: '#5a6478' })], mix: (x, z) => { const r = Math.hypot(x, z); return [r > 2.6 && Math.sin(x * .9 + 1) * Math.sin(z * .8) > .2 ? 1 : 0, r < 2.6 ? 1 : 0]; },
    shade: mood.shade([{ x: 0, z: 0, r: 10, c: '#a8c8ff', k: .3 }, { x: REST[0], z: REST[1], r: 3.2, c: '#ffb868', k: .45 }]) }); scene.add(land.mesh);
  G.ground(() => 0); G.bounds(-10.6, 10.6, -10.6, 10.6);
  // たて穴のかべ：28 枚の かべの箱を輪にならべる（カメラも この内がわに入る）
  for (let k = 0; k < N; k++) { const a = A(k + .5), [x, , z] = pol(WR + .35, a); G.box(x, z, 2 * WR * Math.sin(PI / N) + .3, .7, -1, TOP + 2, a, true); }

  // ---- たて穴のかべ（鉄板の輪。上ほど明るい）、足場の輪（金網の床と手すり）、上の足場、たて穴をわたる橋 ----
  const fixed = [], B = R.parts();
  { const Wl = B.g(X.plate({ c: '#414d6a', n: 2 }), { side: true }), Wc = B.g(X.conc({ c: '#4a5470' }), { side: true }), Wn = B.g(X.plate({ c: '#56607c', n: 2, warn: 1 }), { side: true }), br = y => y > FY ? 1.5 : y > FY - 3 ? 1.1 : .85;
    for (let k = 0; k < N; k++) for (let y = 0; y < TOP; y += 3) { const Gm = y === 6 ? Wn : (Math.round(y / 3) + (k >> 2)) % 3 === 1 ? Wc : Wl; Gm.quad(pol(WR, A(k + 1), y), pol(WR, A(k), y), pol(WR, A(k), y + 3), pol(WR, A(k + 1), y + 3), [0, 0, .82, 1], [br(y), br(y), br(y + 3), br(y + 3)]); }
    const Gr = B.g(X.manhole({ kind: 'grate', c: '#66728e' }), { side: true }), Rl = B.g(X.rail({ c: '#7a86a4' }), { side: true }), St = B.g(X.plate({ c: '#48546e' }));
    const ring = (y, r0, r1, k0, k1, open = []) => { for (let k = k0; k < k1; k++) { const a = A(k), b = A(k + 1), m = A(k + .5), [cx, , cz] = pol((r0 + r1) / 2, m), [rx, , rz] = pol(r0 + .04, m);
        Gr.quad(pol(r0, a, y), pol(r0, b, y), pol(r1, b, y), pol(r1, a, y), [0, 0, 3, 2]);
        G.box(cx, cz, 2 * r1 * Math.sin(PI / N) + .06, r1 - r0, y - .2, y, m);
        if (!open.includes(k)) { Rl.quad(pol(r0, a, y), pol(r0, b, y), pol(r0, b, y + 1), pol(r0, a, y + 1), [0, 0, 2, 1]); G.box(rx, rz, 2 * r0 * Math.sin(PI / N) + .02, .1, y, y + 1.05, m, true); }
        St.at(R.TR(...pol((r0 + r1) / 2, a, y - .16), a)).box(.14, .16, r1 - r0, 0, 0, 0, { m: 3, bottom: true }).at(null); if (k % 2 === 0) St.tri(pol(r1, a, y - .16), pol(r1 - 1.1, a, y - .16), pol(r1, a, y - 1.4), [0, 1], [1, 1], [0, 0]); } };
    for (let z = -11; z < 11; z += 2) { Gr.quad([-.9, CY, z + 2], [.9, CY, z + 2], [.9, CY, z], [-.9, CY, z], [0, 0, 2, 2]); for (const sx of [-1, 1]) { if (Math.abs(z + 1) < 9) Rl.quad([sx * .9, CY, z + 2], [sx * .9, CY, z], [sx * .9, CY + 1, z], [sx * .9, CY + 1, z + 2], [0, 0, 2, 1]); St.box(.12, .16, 2, sx * .9, CY - .16, z + 1, { m: 3, bottom: true }); if (Math.abs(z + 1) % 6 === 3) { St.box(.14, CY - .16, .14, sx * .9, 0, z + 1, { m: 3, top: false }); G.circle(sx * .9, z + 1, .14, -1, CY - .2); } } }
    // 橋の床と手すり（手すりは足場の輪の内がわまで）
    G.box(0, 0, 1.8, 22, CY - .2, CY, 0); for (const sx of [-1, 1]) G.box(sx * .95, 0, .1, 18.2, CY, CY + 1.05, 0, true);
    // 足場の輪。橋がつながる所と、階段の口は手すりをあける
    ring(CY, C0, C1, 0, N, [0, 27, 13, 14, 3, 4]); ring(6.6, 9.7, C1, 3, 13); ring(6.6, 9.7, C1, 18, 25, [18]); fixed.push(B.group()); }

  // ---- 足した：鉄の階段 2 つ（底→足場の輪、足場の輪→上の足場）。見た目は C.stairs、当たりは 1 段ずつの箱 ----
  const stair = (x0, z0, ry, base, h, run) => { const s = C.stairs({ h, run, w: .9, c: '#56607c', rail: 'both' }); s.position.set(x0, base, z0); s.rotation.y = ry; fixed.push(s);
    const n = Math.ceil(h / .38), c = Math.cos(ry), sn = Math.sin(ry);
    for (let i = 0; i < n; i++) { const lx = (i + .5) * run / n; G.box(x0 + c * lx, z0 - sn * lx, run / n + .02, .9, base - .5, base + h * (i + 1) / n, ry); }
    const lx = run + .5; G.box(x0 + c * lx, z0 - sn * lx, 1, .9, base - .5, base + h, ry);
    for (const sz of [-1, 1]) { const ox = -sn * sz * .47, oz = -c * sz * .47; G.box(x0 + c * (run + 1) / 2 + ox, z0 - sn * (run + 1) / 2 + oz, run + 1, .06, base + .3, base + h + 1, ry, true); } };
  { const a = A(4), r0 = 4.8, run = 3.45, [x0, , z0] = pol(r0, a); stair(x0, z0, a - PI / 2, 0, CY, run); }
  { const rm = 10.45, a1 = A(18) + .02, run = 4.1, a0 = a1 - (run + 1) / rm, [xs, , zs] = pol(rm, a0), [xe, , ze] = pol(rm, a1), ry = Math.atan2(-(ze - zs), xe - xs); stair(xs, zs, ry, CY, 6.6 - CY, run); }

  // ---- かべの配管・はしご・タンク ----
  for (let k = 0; k < N; k += 2) { const a = A(k + .5), r = .16 + hash(k, 1) * .22, top = k % 6 === 0 ? TOP : 6 + hash(k, 2) * 10; fixed.push(C.pipe([pol(WR - r - .05, a, 0), pol(WR - r - .05, a, top), pol(WR - r - .05, a + .12, top + .8), pol(WR - r - .05, a + .12, TOP)], r, { c: ['#4a5a7c', '#56607a', '#3e5a6a', '#5a5a84'][k % 4], joint: 3 })); }
  for (const [k, y, h] of [[5, 0, CY], [9, CY, 3.6], [20, CY, 3.6], [16, 0, CY], [23, 6.6, 3.4]]) { const a = A(k + .25), l = C.ladder({ h, c: '#8a94ac' }); l.position.set(...pol(WR - .12, a, y)); l.rotation.y = a + PI; fixed.push(l); }
  const TANKS = [[2, 1.1, 2.4], [12, .9, 3], [19, 1.2, 2]];
  for (const [k, r, h] of TANKS) { const t = C.tank({ r, h, c: '#4a5a78', legs: .5 }); t.position.set(...pol(7.4, A(k), 0)); fixed.push(t); G.solid(t, 'round', { r: r + .1 }); }
  // 底の物：機械の箱、ドラムかん、鉄くず、まん中の大きな排気口
  { const P = R.parts(), Pn = P.g(X.panel({ c: '#56708a' })), Mh = P.g(X.manhole({ kind: 'grate', c: '#5a6680' }), { offset: true });
    for (const [k, r, w, h] of [[7, 7.6, 1.8, 1.5], [15, 7.2, 2.2, 1.9], [24, 7.8, 1.6, 1.3]]) { Pn.at(R.TR(...pol(r, A(k), 0), A(k))).box(w, h, 1, 0, 0, 0, { m: 1.5, c0: .75 }).at(null); const [x, , z] = pol(r, A(k)); G.box(x, z, w, 1, -1, h, A(k), true); }
    Mh.quad([-2.2, .03, 2.2], [2.2, .03, 2.2], [2.2, .03, -2.2], [-2.2, .03, -2.2], [0, 0, 3, 3]); fixed.push(P.group()); }
  for (const [x, z, c] of [[3.5, 5.6, '#5a5060'], [4.3, 6.1, '#4a5a70'], [-5.5, -2.5, '#5a5060'], [-2, 6.6, '#4a5a70']]) { const d = C.drum({ c, mark: 'band' }); d.position.set(x, 0, z); fixed.push(d); G.solid(d, 'round', { r: .32 }); }
  for (const [x, z, s, i] of [[-6, 3.2, 1.6, 1], [5.5, -4.5, 2, 2], [1, -7.6, 1.4, 3]]) { const d = C.scrap({ s, seed: i, cs: ['#4e5870', '#5a6078', '#465a6a'] }); d.position.set(x, 0, z); fixed.push(d); G.solid(d, 'round', { pad: .6 }); }
  // 足した：木箱の山（底から 3 段。いちばん上から 橋の高さ）
  [[-3.2, -6.4, 0, .9, 0], [-2.3, -6.5, 0, .9, 1], [-2.75, -6.45, .9, .9, 2], [-1.6, -7.3, 0, .9, 3], [-1.9, -7.2, .9, .9, 4], [-2.4, -7.0, 1.8, .9, 5]].forEach(([x, z, y, s, i]) => { const c = R.crate({ s, kind: i % 2 ? 'x' : 'slash', c: '#7a6a5a' }); c.position.set(x, y, z); c.rotation.y = i * .25; fixed.push(c); G.solid(c, 'box'); });
  // 足した：休けい所（ベンチ、やかんを のせた木箱、工具箱）
  { const b = R.bench({ w: 1.6 }); b.position.set(REST[0], 0, REST[1]); b.rotation.y = RRY; fixed.push(b); G.solid(b, 'box');
    const tb = R.crate({ s: .6, c: '#6a5a4a' }); tb.position.set(REST[0] + RS[0] * 1.35, 0, REST[1] + RS[1] * 1.35); fixed.push(tb); G.solid(tb, 'box');
    const tb2 = R.crate({ s: .45, kind: 'x', c: '#8a4a3a' }); tb2.position.set(REST[0] - RS[0] * 1.35, 0, REST[1] - RS[1] * 1.35); tb2.rotation.y = .6; fixed.push(tb2); G.solid(tb2, 'box'); }
  // ファンを支える 3 本の はりと、まん中のモーターの箱（動かない）
  for (let i = 0; i < 3; i++) { const b = C.beam({ len: WR * 2, h: .7, w: .7, c: '#39445e' }); b.position.y = FY - 1.9; b.rotation.y = i * PI / 3; fixed.push(b); }
  fixed.push(R.geo().smooth(1).loft(8, [[FY - 2.6, .7, .7, 0, .7], [FY - 2.2, 1.5, 1.5, .3, .9], [FY - .5, 1.5, 1.5, 1, 1]], { ur: 3, cap: 'bot' }).mesh(X.plate({ c: '#48546e', n: 2 })));
  scene.add(R.merge(fixed));

  // ---- ファン：5 枚の羽根（ねじれた板）と、じく。すき間の光のすじも いっしょに回る ----
  const fan = new THREE.Group(); fan.position.y = FY; fan.userData.dyn = true; scene.add(fan);
  { const Gm = R.geo(), NB = 5; for (let i = 0; i < NB; i++) { const a0 = i / NB * TAU, w = TAU / NB * .56, S = 4; for (let j = 0; j < S; j++) { const r0 = 1.3 + (FR - 1.3) * j / S, r1 = 1.3 + (FR - 1.3) * (j + 1) / S, k0 = .55 + .45 * j / S, k1 = .55 + .45 * (j + 1) / S;
        Gm.quad(pol(r0, a0 - w * k0 / 2, -.5), pol(r0, a0 + w * k0 / 2, .5), pol(r1, a0 + w * k1 / 2, .4), pol(r1, a0 - w * k1 / 2, -.4), [j / S * 3, 0, (j + 1) / S * 3, 1.4]); } }
    Gm.smooth(1).loft(10, [[-.7, 1.1, 1.1, 0, .8], [-.3, 1.5, 1.5, .3, 1], [.6, 1.5, 1.5, .7, 1], [1, .9, .9, 1, .9]], { ur: 3, cap: 'both' }); fan.add(Gm.mesh(X.plate({ c: '#38445e', n: 2 }), { side: true }));
    for (let i = 0; i < NB; i++) { const q = pol(5.6, (i + .5) / NB * TAU, -FY), sh = D.shaft({ w: 2.6, h: FY - .4, c: '#cfe0ff', a: .14 }); sh.position.set(...q); fan.add(sh); }
    fan.add(D.pools([...Array(NB)].map((_, i) => ({ p: pol(5.6, (i + .5) / NB * TAU, -FY + .06), r: 3.4, c: '#cfe0ff', k: .42 })))); }
  // ファンのむこうの光：明るい丸い面（上の層の こうし）と、にじみ
  { const P = R.Px(32); for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - 15.5, y - 15.5) / 16; P.set(x, y, d < .35 ? '#ffffff' : d < .6 ? '#e4f0ff' : d < .85 ? '#b8d0f8' : '#86a4dc'); } for (let i = 3; i < 32; i += 7) { P.rect(i, 0, 1, 32, '#5a74a8'); P.rect(0, i, 32, 1, '#5a74a8'); }
    const Gm = R.geo(); for (let k = 0; k < N; k++) { const a = pol(WR, A(k), TOP), b = pol(WR, A(k + 1), TOP); Gm.tri(b, a, [0, TOP, 0], [.5 + b[0] / WR / 2, .5 + b[2] / WR / 2], [.5 + a[0] / WR / 2, .5 + a[2] / WR / 2], [.5, .5]); } const lid = Gm.mesh(T.from(P, { m: 1 }), { glow: true, fog: false, side: true }); lid.castShadow = false; scene.add(lid);
    const h = D.halo({ c: '#cfe0ff', r: 10, k: .55 }); h.position.set(0, TOP - 1.5, 0); scene.add(h); }

  // ---- 赤い小さな警告灯、たれたくさり、底からのぼる蒸気、光の中の ほこり ----
  for (const [k, y] of [[13.5, 5.2], [15.5, 8.6]]) { const w = D.warnLamp({ kind: 'blink', c: '#ff3a2c', r: .12, seed: k }); w.position.set(...pol(WR - .3, A(k), y)); scene.add(w); }
  [[3, 6.4, 2.4], [10, 6.4, 2], [14.5, CY - .2, 1.8], [22, 6.4, 2.4], [26, CY - .2, 1.6]].forEach(([k, y, len], i) => { const c = D.chain({ len, sway: .05, seed: i * 2, c: '#8a94ac' }); c.position.set(...pol(9.6, A(k), y)); c.rotation.y = A(k); scene.add(c); });
  [[1.2, .05, .8], [-4.5, .05, 3], [5, .05, -3.5]].forEach(([x, y, z], i) => { const s = C.steam({ n: 9, r: .9, rise: 6, spread: .6, speed: .16, c: '#8a9cc0', a: .2, phase: i * .4 }); s.position.set(x, y, z); scene.add(s); });
  scene.add(D.flakes({ kind: 'dust', n: 150, box: [20, 10, 20], c: '#dce8ff', vy: .35, size: 1.8 }));
  // 足した：休けい所の つるした電球（あたたかい色。点検の人の顔が読める）と、上の足場の作業灯
  { const bl = D.bulb({ drop: 5.6, c: '#ffc878', light: true, power: 6, range: 6.5, seed: 3 }); bl.position.set(REST[0] + .3, FY - 2.2, REST[1] - .2); scene.add(bl);
    const pl = D.pools([{ p: [REST[0], .05, REST[1]], r: 2.4, c: '#ffb060', k: .32 }]); scene.add(pl);
    const b2 = D.bulb({ drop: .5, c: '#dfe8ff', light: true, power: 4, range: 5, seed: 7 }); b2.position.set(...pol(10.3, A(8), 9.2)); scene.add(b2); }
  // 主人公のまわりの弱い青いあかり（もとの場面の follow と同じ）
  const follow = new THREE.PointLight('#a8c0ff', 5, 6, 1.4); scene.add(follow);

  // ---- 点検の人たち（TL.person。だいだいのベストの作業着、帽子・かみ型・背たけで見分ける） ----
  const ORANGE = '#f08a2c', put = (o, x, y, z, ry, d) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = (pts, y = 0) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, y, z)), true, 'centripetal');
  const ringPts = (r, k0, k1, n) => [...Array(n)].map((_, i) => { const [x, , z] = pol(r, A(k0 + (k1 - k0) * i / (n - 1))); return [x, z]; });
  put({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#e8ecf4', hair: 'wolf', bulk: 1.1, head: { hair: '#3a3a44', skin: '#d8a878', eyes: 'small', brow: 'thick', mouth: 'line', beard: 'stubble' }, colors: { linen: '#e8ecf4', pants: '#56628a', vest: ORANGE, scarf: ORANGE } }, .2, CY, -4.5, PI,
    { name: '点検の班長', lines: [['ここは 上の層へ 風を送る たて穴だ。', 'あのファンが 止まると、上は 息ができなくなる。'], ['羽根の かげが 回ってくるだろう。', 'あれで 時間が分かるんだ。ひと回り 二十秒。'], '橋の上は 走るなよ。金網が すべるからな。'] });
  { const n = put({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: ORANGE, hair: 'swept', head: { hair: '#6a3a2a', skin: '#f0c49c', eye: '#4a6a9a', mouth: 'open', blush: true }, colors: { linen: '#d8dce8', pants: '#56628a', scarf: ORANGE } }, 0, CY, 0, 0,
      { name: '見回りの点検係', path: loop(ringPts(10.05, 4.5, 12.5, 6).concat(ringPts(9.5, 12.5, 4.5, 6).slice(1, -1))), speed: .9, lines: [['足場の ボルトを 一本ずつ たたいて 回ってるの。', '音で ゆるんでるのが 分かるんだよ。'], '赤いランプの所は、配管の 圧が 高い所。さわらないでね。'] }); n.flyY = CY; }
  put({ size: 'small', outfit: 'worker', hat: 'cap', hatC: '#8a94ac', hair: 'center', head: { hair: '#b8b4b0', skin: '#d8a070', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'beard' }, colors: { linen: '#c8ccd8', pants: '#4a4e64', scarf: '#5a6a8a' } }, REST[0] + RF[0] * .6, 0, REST[1] + RF[1] * .6, RRY,
    { name: '年よりの機械工', lines: [['ふう、ひと休みじゃ。', 'このファンは、わしが 見習いのころから 回っとる。'], ['上の都市の人は、ここを 知らんじゃろうな。', 'それでも 風は とどけるのが、わしらの しごとじゃ。'], 'やかんの茶、飲むかね？ ……さめとるがの。'] });
  put({ size: 'child', outfit: 'worker', hat: 'cap', hatC: ORANGE, hair: 'swept', head: { hair: '#2a2a34', eye: '#3a7a5a', mouth: 'open', blush: true }, colors: { linen: '#e8ecf4', pants: '#56628a', scarf: '#d8402e' } }, 1.6, 0, 2.6, PI * .8,
    { name: '見習いの子', lines: [['うわあ、光が 回ってる……！', 'ずっと 見てても あきないんだ。'], ['いつか あのファンの 上に行ってみたい。', '上には 白い塔の 都市があるんだって。'], '木箱の てっぺんから見る 光のすじが、いちばん きれいなんだ。'] });
  put({ size: 'normal', outfit: 'worker', hat: 'kerchief', hatC: '#4f8f88', hair: 'center', head: { hair: '#3a2a22', skin: '#e8b890', eye: '#8a4a6a', mouth: 'smile' }, colors: { linen: '#d8ccb0', pants: '#4f6a6a', scarf: '#c8a04a' } }, ...(() => { const [x, , z] = pol(10.2, A(9.5)); return [x, 6.6, z]; })(), A(9.5) + PI,
    { name: '配管工', lines: ['上の足場は 風が強いよ。帽子に 気をつけて。', ['このはしごの 先は、上の層への 点検口。', 'かぎが かかってて、わたしでも 入れないの。']] });
  { const n = put({ size: 'tall', outfit: 'guard', hat: 'helm', hair: 'center', head: { hair: '#4a3a2a', skin: '#c8885a', eyes: 'small', brow: 'angry', mouth: 'line' }, colors: { metal: '#7a86a4', tunic: '#3a4a6a' } }, 0, 0, 0, 0,
      { name: '保安係', path: loop([[2.6, -1.0], [3.8, 3.6], [-.6, 4.2], [-3.6, 1.2], [-3.4, -3.6], [1.4, -5.4]]), speed: .8, u: .3, lines: [['ここは 関係者のほか 立ち入りきんし……', 'ん？ 見学か。なら、ファンの真下には 行くなよ。'], ['高架下の 屋台の町から 来たのか？', 'あそこの 湯気は、ここまで 上がってくるんだ。']] }); }
  put({ size: 'normal', outfit: 'robe', hat: 'hood', hatC: '#3a4258', hair: 'swept', head: { hair: '#8a6a4a', skin: '#e0b088', eye: '#5a5a7a', eyes: 'small', mouth: 'line' }, colors: { tunic: '#4a5470', trim: '#a8b4d0' } }, ...(() => { const [x, , z] = pol(10.1, A(25.5)); return [x, CY, z]; })(), A(25.5) + PI,
    { name: '風の記録係', lines: [['風の強さを、毎日 帳面に つけています。', '今日は「ふつう」。まいにち「ふつう」です。'], '上の層から、ときどき 花びらが 落ちてくるんですよ。ふしぎでしょう。'] });
  put({ size: 'normal', outfit: 'traveler', hat: 'cap', hatC: '#33384c', hair: 'wolf', head: { hair: '#2a2228', skin: '#a8704a', eye: '#6a4a2a', mouth: 'smile' }, colors: { tunic: '#56628a', vest: ORANGE, pants: '#33384c', scarf: '#e8ecf4' } }, 2.9, 0, 6.6, PI + .6,
    { name: 'ドラムかん運び', lines: [['このかん、からっぽに 見えて 重いんだ。', '中身？ 羽根に ぬる 油さ。'], ['貨物エレベーターで 上まで 運ぶ日もある。', 'ゆれるけど、ながめは いいぜ。']] });
  // 黒ねこ（あたたかい電球の下で まるくなる）
  const cat = D.cat({ s: 1 }); cat.position.set(REST[0] + RS[0] * 1.35, .6, REST[1] + RS[1] * 1.35); cat.rotation.y = 2.2; scene.add(cat);
  G.npc(cat, { name: '黒ねこ', r: .2, head: .25, lines: ['……にゃ。', '（あたたかい木箱の上から、動く気は ないらしい）', 'ごろごろ……。'], idle: t => R.catPose(cat, 'sit', t) });

  // ---- しらべられる物 ----
  G.sign(0, .2, -1.6, { name: '大きな排気口', lines: [['鉄の こうしの下から、なまあたたかい 風が ふき上がる。', 'ずっと下にも、まだ 町が あるのだろうか。']] });
  { const [x, , z] = pol(9.6, A(13.5)); G.sign(x, CY + 1, z, { name: '赤い警告灯', lines: [['「圧力 注意」と、さびた板に 書いてある。', '赤い光が、一定の はやさで またたいている。']] }); }
  { const [x, , z] = pol(10.1, A(23.3)); G.sign(x, 6.8, z, { name: '上の層への点検口', lines: [['はしごの先に、丸い ふたが見える。', 'かぎ穴には、花の形の もようが ほってある。']] }); }
  { const [x, , z] = pol(7.4, A(12)); G.sign(x + .4, 1.2, z + .9, { name: 'タンクの計器', lines: [['針が「みどり」の所で ふるえている。', 'となりに だれかの 落書き：「上の空は 青いらしい」']] }); }

  // ---- はじめの場所と、自動で歩く道 ----
  G.spawn(0, 6.5, PI);
  { const P = (r, k) => { const [x, , z] = pol(r, A(k)); return [+x.toFixed(2), +z.toFixed(2)]; };
    G.tour([[0, 6], [0, -3], [0, -9.9], P(10, 11), P(10, 8), P(9.9, 4.3), P(8.6, 4), P(4.2, 4), [3, -2.4], [-1.6, -4.4], [-4.3, 1.2], [-1.4, 3.4], P(4.2, 4), P(8.6, 4), P(9.9, 4), P(10, 2), P(10, .3), [0, 8.4]]); }

  // ---- 毎コマ：ファン・警告灯・ほこり・くさり ----
  G.tick((t, dt, P) => {
    fan.rotation.y = t * .3; follow.position.set(P.x, P.y + 1.8, P.z + .6);
    D.tick(t, G.cam); C.update(t, G.cam); });
});
