// ワールド 12-19「王国の図書館の塔」。もとは game-looks-12/19-library-tower-kingdom.html（見るだけの場面）。
// 夕方の図書館の塔の中。丸い吹き抜けに 本だなの回廊が 何十階も重なり、上は夕日の霧にとける。まん中に光の玉、舞う本、大きなアーチの窓の外に 王都と城。
// ゲームにするために足した物：まるい かべと机の当たり判定、かべぞいの らせんの木の段（1 階めの回廊へ のぼれる。回廊は 1 周 歩ける）、受付のカウンター。
// 司書・学者・書記・衛兵など 塔の人 8 人とねこ、はしごをのぼる司書（見るだけ）、しらべられる物 4 つ。
TALE_WORLD('12-19', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), FW = PACK_FWILD(THREE, K, R), D = PACK_DARK(THREE, K, R), { hash } = K, PI = Math.PI, TAU = PI * 2;
  scene.add(R.skyDome([[0, '#3a2a5a'], [.45, '#8a4a7a'], [.75, '#e8806a'], [.92, '#ffc070'], [1, '#fff0b0']], { r: 700 })); scene.fog = new THREE.Fog('#f0a070', 14, 110);   // 上の階ほど夕日の霧にとける（窓の外の王都は霧からはずす）
  K.lights(scene, G.renderer, { sky: 0xffd0a8, ground: 0x6a4a5a, amb: 1.45, sun: 0xffb070, power: 2.2, range: 30, pos: [-10, 40, -60] });

  // ---- 塔の吹き抜け：半径 RO の丸い かべ一面に本だな、6 m ごとに回廊（板の床と手すり）。窓の向き（-z）の下の 4 階ぶんは大きなアーチの窓 ----
  const RO = 14, RI = 12.3, FL = 6, NF = 22, NS = 28, WIN = k => { const a = (k + .5) / NS * TAU; return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < .42; };
  const ang = k => k / NS * TAU, P = (r, k, y) => [Math.sin(ang(k)) * r, y, -Math.cos(ang(k)) * r], PA = (r, a, y = 0) => [Math.sin(a) * r, y, -Math.cos(a) * r];
  // 足した：かべぞいの らせんの木の段。角度 AS（下）から AE（上）へ 15 段、1 段 .4 m。上のはしは 1 階めの回廊（KS の区画）に つながる
  const AS = -2.25, AE = -1.25, NSTEP = 15, KS = 22;
  const SH = F.tex.shelf({ kind: 'books', c: '#6a4430' }), SH2 = F.tex.shelf({ kind: 'mix', c: '#6a4430', seed: 3 }), WD = T.planks({ c: '#7a5038' }), FLR = T.planks({ c: '#8a5a3a' }), RL = F.tex.rail({ kind: 'wood', c: '#6a4430' }), ST = F.tex.ashlar({ c: '#c89a8a', moss: 0 });
  const Gs = R.geo(), Gs2 = R.geo(), Gw = R.geo(), Gf = R.geo(), Gr = R.geo(), Gst = R.geo();
  for (let f = 0; f < NF; f++) { const y0 = f * FL, y1 = y0 + FL;
    for (let k = 0; k < NS; k++) { const a = P(RO, k, y0), b = P(RO, k + 1, y0), c = P(RO, k + 1, y1), d = P(RO, k, y1);
      if (WIN(k) && f < 4) { if (f === 3) Gst.quad(a, b, c, d, [0, 0, 1.6, 2], .9); continue; }
      (hash(k, f) > .5 ? Gs : Gs2).quad(a, b, [c[0], y1 - .6, c[2]], [d[0], y1 - .6, d[2]], [0, 0, 1.6, 2.6], f < 2 ? 1 : .95);   // 本だな（内がわを向く）
      Gw.at(R.TR(a[0] * .985, y0, a[2] * .985, -ang(k))).box(.5, FL, .5, 0, 0, 0, { m: 2 }).at(null); }   // 本だなの間の柱
    if (f > 0) { for (let k = 0; k < NS; k++) { const a = P(RO, k, y0), b = P(RO, k + 1, y0), c = P(RI, k + 1, y0), d = P(RI, k, y0); Gf.quad(d, c, b, a, [0, 0, 2, 1.4], 1); Gf.quad(a, b, [c[0], y0 - .5, c[2]], [d[0], y0 - .5, d[2]], [0, 0, 2, .3], .55); Gf.quad([d[0], y0 - .5, d[2]], [c[0], y0 - .5, c[2]], c, d, [0, 0, 2, .3], .7);   // 回廊の床と、その下の面とふち
        if (!(f === 1 && k === KS)) Gr.quad([d[0], y0, d[2]], [c[0], y0, c[2]], [c[0], y0 + 1, c[2]], [d[0], y0 + 1, d[2]], [0, 0, 2.4, 1]); } } }   // 手すり（段の上のはしだけ あけた）
  // 窓の上のアーチの石と、窓の わく
  { const k0 = [...Array(NS).keys()].filter(WIN), ka = k0[0], kb = k0[k0.length - 1] + 1;
    for (let k = ka; k < kb; k++) { const u0 = (k - ka) / (kb - ka), u1 = (k + 1 - ka) / (kb - ka), ar = u => 18 + Math.sin(u * PI) * 5; const a = P(RO, k, ar(u0)), b = P(RO, k + 1, ar(u1)); Gst.quad(a, b, [b[0], 24, b[2]], [a[0], 24, a[2]], [0, 0, 1.6, 1], .9); }
    for (let k = ka; k <= kb; k += 1) { const a = P(RO - .1, k, 0); Gw.at(R.TR(a[0], 0, a[2], -ang(k))).box(.35, 18 + (k === ka || k === kb ? 6 : Math.sin((k - ka) / (kb - ka) * PI) * 5), .35, 0, 0, 0, { m: 2 }).at(null); }
    for (const y of [6, 12]) for (let k = ka; k < kb; k++) { const a = P(RO - .1, k, y), b = P(RO - .1, k + 1, y); Gw.quad(a, b, [b[0], y + .3, b[2]], [a[0], y + .3, a[2]], [0, 0, 1, .2]); } }
  // らせんの段（見た目）
  for (let i = 0; i < NSTEP; i++) { const a = AS + (AE - AS) * (i + .5) / NSTEP, top = .4 * (i + 1), r0 = 10.6, r1 = i === NSTEP - 1 ? 12.45 : 12.0, [x, , z] = PA((r0 + r1) / 2, a), w = (AE - AS) / NSTEP * 11.3 + .04;
    Gw.at(R.TR(x, 0, z, -a)).box(w, top, r1 - r0, 0, 0, 0, { m: 2 }).at(null); G.box(x, z, w, r1 - r0, -1, top, -a); }
  { const Gb = R.geo(); for (let i = 0; i < NSTEP; i += 2) { const a = AS + (AE - AS) * (i + .5) / NSTEP, [x, , z] = PA(10.65, a); Gb.at(R.TR(x, .4 * (i + 1), z, -a)).box(.08, .9, .08, 0, 0, 0, { m: 1 }).at(null); }
    for (let i = 0; i < NSTEP - 1; i++) { const a0 = AS + (AE - AS) * (i + .5) / NSTEP, a1 = AS + (AE - AS) * (i + 1.5) / NSTEP, p0 = PA(10.65, a0, .4 * (i + 1) + .9), p1 = PA(10.65, a1, .4 * (i + 2) + .9); Gr.quad([p0[0], p0[1] - .9, p0[2]], [p1[0], p1[1] - .9, p1[2]], p1, p0, [0, 0, .5, 1]); }
    scene.add(Gb.mesh(WD)); }
  const fixed = [Gs.mesh(SH, { side: true }), Gs2.mesh(SH2, { side: true }), Gw.mesh(WD), Gf.mesh(FLR, { side: true }), Gr.mesh(RL, { side: true }), Gst.mesh(ST, { side: true })];
  // 当たり判定：まるい かべ（本だなと窓）、1 階めの回廊の床と 手すり、段の内がわの手すり
  for (let k = 0; k < NS; k++) { const a = ang(k + .5), [x, , z] = PA(RO + .25, a), [gx, , gz] = PA((RI + RO) / 2, a), [rx, , rz] = PA(RI - .05, a);
    G.box(x, z, 3.4, .5, -1, 60, -a, true); G.box(gx, gz, 3.3, RO - RI + .1, FL - .5, FL, -a);
    if (k !== KS) G.box(rx, rz, 2.9, .12, FL, FL + 1.1, -a, true); }
  G.bounds(-13.8, 13.8, -13.8, 13.8);

  // 床：色タイルの丸い床と、まん中の じゅうたん
  const floor = R.ground({ w: 34, d: 34, cell: 1, layers: [F.tex.tile({ c: '#2a6a7a', c2: '#e8d8b8', c3: '#c8803a', kind: 'star' }), F.tex.carpet({ c: '#8a2a3a', c2: '#e8c060', c3: '#2a4a6a' })], mix: (x, z) => [Math.abs(x) < 2.2 && z > -12 ? 1 : 0, 0] }); scene.add(floor.mesh);
  const put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  // 読書机、いす、机の上の本、はしご
  for (const [x, z, ry] of [[-6.5, 2, .3], [6.5, 2, -.3], [-6, -5, -.2], [6, -5, .2]]) { put(F.table({ w: 2.4, d: 1.1 }), x, z, ry, 0, 'box'); for (const s of [-1, 1]) put(F.chair({}), x + s * .6, z + 1, PI + ry, 0, 'box', { pad: .05 }); const bk = F.shelf({ w: 1, h: .4, kind: 'books' }); put(bk, x, z, ry, .78); }
  for (let f = 0; f < 8; f++) for (let k = 0; k < NS; k += 5) { if (WIN(k) && f < 4) continue; const kk = k + (f % 3), a = P(RO - .5, kk + .5, f * FL), l = F.ladder({ h: FL - .2, kind: 'wood' }); put(l, a[0], a[2], -ang(kk + .5) + PI, f * FL); }
  // 足した：受付のカウンターと、古い大きな本の台
  put(F.counter({ w: 3, c: '#6a4430' }), 4.2, 8.6, -PI / 2 - .5, 0, 'box');
  put(F.shelf({ w: 1, h: .4, kind: 'books' }), 4.2, 8.6, -PI / 2 - .5, 1.0);
  { const Gl = R.geo(); Gl.box(.9, 1, .7, 0, 0, 0, { m: 1.5 }); put(Gl.mesh(WD), -2.6, -9.2, .2, 0, 'box'); const bk = F.shelf({ w: .8, h: .3, kind: 'books', seed: 4 }); put(bk, -2.6, -9.2, .2, 1); }
  // 窓の外：夕やけの王都（ずっと下）と城、遠くの山
  const city = new THREE.Group(); city.position.set(0, -8, -230); fixed.push(city);
  { const C = F.castle({ s: 2.6, stone: F.tex.ashlar({ c: '#e8c0a8' }), roof: F.tex.slate({ c: '#3a5a9a' }), c: '#c8403a', crest: 'crown', cc: '#f8e0a0', lit: 1 }); C.position.set(10, 0, -40); city.add(C);
    for (let i = 0; i < 60; i++) { const a = (hash(i, 1) - .5) * 2.2, d = 40 + hash(i, 2) * 120, x = Math.sin(a) * d, z = 60 - Math.cos(a) * d * .7; const h = R.house({ w: 6, d: 5, h: 4, wall: T.plaster({ c: ['#f0e0c8', '#e8c8b0', '#f0d8a8'][i % 3], frame: 'cross' }), roof: T.roof({ c: ['#c8503a', '#3a6aa8', '#c8803a'][i % 3] }), lit: 1, chimney: i % 3 === 0, seed: i }); h.position.set(x, 0, z); h.rotation.y = hash(i, 3) * 2; h.scale.setScalar(1.6); city.add(h); }
    for (const [x, z, h] of [[-60, 10, 30], [70, 30, 26], [-30, -60, 34]]) { const t = F.tower({ r: 4, h, stone: F.tex.ashlar({ c: '#e8c0a8' }), roof: F.tex.slate({ c: '#3a5a9a' }), top: 'cone', roofH: 9, flag: { c: '#e8b830', crest: 'sun', cc: '#c8403a', w: 4, h: 2.4 } }); t.position.set(x, 0, z); city.add(t); } }
  scene.add(R.backdrop({ c: '#7a4a7a', haze: '#f0a070', r: 500, h: 50, y: -20, rep: 3 }));
  scene.add(R.merge(fixed));
  city.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.fog = false; }); });
  for (let k = 0; k < 6; k++) { const c = R.cloud({ s: 70 + hash(k, 1) * 60, c: '#ffc8a0', shade: '#a86a8a', seed: k }); c.position.set((hash(k, 2) - .5) * 400, 20 + hash(k, 3) * 80, -360 - hash(k, 4) * 100); scene.add(c); }
  const sunD = new THREE.Mesh(new THREE.CircleGeometry(20, 20), new THREE.MeshBasicMaterial({ color: '#fff0c0', fog: false })); sunD.position.set(-30, 0, -500); scene.add(sunD); const sunG = FW.halo('#ffc070', 160, .5); sunG.position.set(-30, 0, -490); scene.add(sunG);

  // ---- まん中の光の玉、光の粒 ----
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), new THREE.MeshBasicMaterial({ color: '#fff4c8', fog: false })); orb.position.set(0, 20, 0); scene.add(orb); const orbH = FW.halo('#ffe0a0', 26, .7); orbH.position.copy(orb.position); scene.add(orbH);
  const orbL = new THREE.PointLight('#ffd8a0', 30, 60, 1.3); orbL.position.copy(orb.position); scene.add(orbL);
  for (let f = 2; f < 12; f += 2) { const l = new THREE.PointLight('#ffb870', 14, 26, 1.4); l.position.set(0, f * FL, 0); scene.add(l); }
  const motes = FW.motes({ n: 90, box: [20, 14, 20], c: '#fff0c0', size: .14, rise: .2 }); scene.add(motes);

  // ---- 舞う本（開いたページがはばたく） ----
  const page = (() => { const P2 = R.Px(16), A = R.ramp('#c8a880', 6, { contrast: .6 }), Ink = R.ramp('#5a4a4a'); P2.fill(A[3]); for (let y = 3; y < 14; y += 2) for (let x = 2; x < 14; x++) if (hash(x >> 1, y, 3) > .25 && !(x === 7 || x === 8)) P2.set(x, y, Ink[3]); for (let y = 0; y < 16; y++) { P2.set(7, y, A[1]); P2.set(8, y, A[2]); P2.set(0, y, A[2]); P2.set(15, y, A[2]); } return T.from(P2, { m: 1 }); })();
  const books = [...Array(16)].map((_, i) => { const g = new THREE.Group(), cov = R.mat(T.fabric({ pattern: 'plain', c: ['#a83a3a', '#3a6a9a', '#3a8a5a', '#c8903a'][i % 4] }), { side: true }), pg = R.mat(page, { side: true, color: '#b8a088' });
    const L = new THREE.Group(), Rr = new THREE.Group(); for (const [grp, sx] of [[L, -1], [Rr, 1]]) { const Gp = R.geo(); Gp.quad([0, 0, -.32], [sx * .48, 0, -.32], [sx * .48, 0, .32], [0, 0, .32], [sx < 0 ? 0 : .5, 0, sx < 0 ? .5 : 1, 1]); const m = new THREE.Mesh(Gp.build(), pg); const G2 = R.geo(); G2.quad([0, -.03, -.34], [sx * .5, -.03, -.34], [sx * .5, -.03, .34], [0, -.03, .34]); grp.add(m, new THREE.Mesh(G2.build(), cov)); g.add(grp); }
    g.scale.setScalar(1.7); g.userData = { L, R: Rr, r: 2.5 + hash(i, 1) * 6, y: 3 + hash(i, 2) * 14, sp: (.12 + hash(i, 3) * .1) * (i % 2 ? 1 : -1), ph: hash(i, 4) * TAU }; scene.add(g); return g; });
  const birds = [0, 1, 2, 3].map(() => { const b = R.bird({ c: '#3a2a3a', belly: '#6a4a5a', s: 2.2 }); scene.add(b); return b; });

  // ---- 塔の人（TL.person。主人公と同じ 4.5 頭身の作り）。司書は ローブ、学者は とんがり帽子、書記は みどりの上着 ----
  const person = (o, x, z, ry, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return p; };
  const folk = (o, x, z, ry, d, y) => G.npc(person(o, x, z, ry, y), d);
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const sitPose = p => { const J = p.userData.J; J.legL.rotation.x = J.legR.rotation.x = -1.45; J.shinL.rotation.x = J.shinR.rotation.x = 1.45; J.head.rotation.x = .35; J.armL.rotation.x = J.armR.rotation.x = -.9; J.foreL.rotation.x = J.foreR.rotation.x = -.7; };
  const seat = o => { const p = TL.person(o); return Math.max(0, .5 - p.userData.hipY); };
  // はしごをのぼる司書（見るだけ。のぼって、本をとって、おりる）
  const LAD = (() => { const a = P(RO - 1.1, 5.5, 0); return { x: a[0], z: a[2], ry: -ang(5.5) + PI }; })();
  const libr = person({ size: 'normal', outfit: 'robe', hat: 'hood', hatC: '#4a3a6a', hair: 'center', head: { hair: '#d8d0c8', eyes: 'small', mouth: 'line' }, colors: { tunic: '#4a3a6a', trim: '#e8c060' } }, LAD.x, LAD.z, LAD.ry + PI);
  // はしごの下で 支える 見習いの司書
  { const [x, , z] = P(RO - 2.4, 5.1, 0); folk({ size: 'child', outfit: 'robe', hair: 'swept', head: { hair: '#c8843a', eye: '#4a6a9a', mouth: 'open', blush: true }, colors: { tunic: '#6a5a9a', trim: '#e8c060' } }, x, z, -ang(5.1) + PI * .8,
    { name: '見習いの司書', lines: [['しーっ。先生が いま、上の たなの本を とってるの。', 'はしごを 支えるのが、わたしの しごと。'], ['この塔の本だなは、二十階より 上まで つづいてるのよ。', 'いちばん上は、だれも 見たことが ないんだって。']] }); }
  // 受付の 司書長（カウンターのうしろ）
  folk({ size: 'tall', outfit: 'robe', hat: 'hood', hatC: '#2a3a5a', hair: 'center', head: { hair: '#e8e0d0', eyes: 'small', brow: 'thick', mouth: 'line', beard: 'mustache' }, colors: { tunic: '#2a3a5a', trim: '#e8c060', belt: '#c8a040' } }, 5.0, 9.1, -PI / 2 - .5 + PI,
    { name: '司書長', lines: [['王国の図書館へ ようこそ。', '本は どれを 読んでも かまいませんが、お静かに。'], ['回廊へは、かべぞいの らせんの段から のぼれます。', '手すりから 身を のりだしては いけませんよ。'], ['まん中の 光の玉は、夜も 消えません。', '何百年も前の 魔法使いが ともしたものです。']] });
  // 読書する人（いすに すわっている。話しかけると 立ち上がる）
  const reader = (o, x, z, ry, d) => { const y = seat(o), n = folk(o, x, z, ry, { ...d, idle: (t, p) => { R.idle(p, t, 0); sitPose(p); p.userData.J.head.rotation.x = .35 + Math.sin(t * .5 + x) * .05; } }, y); return n; };
  reader({ size: 'normal', outfit: 'robe', hat: 'wizard', hatC: '#3a5a3a', hair: 'wolf', head: { hair: '#4a3a30', eyes: 'small', mouth: 'line' }, colors: { tunic: '#3a5a3a', trim: '#e8c060' } }, -7.1, 3.1, PI + .3,
    { name: '薬草の学者', lines: [['この本には、霧の中でしか 咲かない花のことが 書いてある。', '……見てみたいものだ。'], ['がけの上の港から、飛空艇で 霧の上へ 出られるらしい。', '花さがしの 旅に出ようか。']] });
  reader({ size: 'child', hat: 'beret', hatC: '#3a5a9a', hair: 'center', head: { hair: '#2a2a34', eye: '#3a5a9a', mouth: 'smile', blush: true }, colors: { tunic: '#3a5a9a', vest: '#e8d8b0', pants: '#3a3a44' } }, 5.9, 3.1, PI - .3,
    { name: '本の好きな子', lines: [['しーっ！ 今 いいところなの。', 'ドラゴンが 王さまの かんむりを ぬすんだところ！'], ['ねえ、本って 空を とぶの？', 'さっきから 頭の上を、ぱたぱた とんでるんだけど。']] });
  reader({ size: 'small', hair: 'center', head: { hair: '#e8e8e8', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#6a6a4a', vest: '#4a3a30', pants: '#3a3a44', scarf: '#c8503a' } }, -6.6, -3.9, PI - .2,
    { name: 'うたたねの おじいさん', lines: ['……ぐう。', ['……む、ねておらんぞ。', '目を とじて、本の 中身を 思いうかべておったのじゃ。'], '森で 旅芸人の祭りが あるそうじゃな。わしも 若いころは 綱わたりを……ぐう。'] });
  // 書記の少年（もとの場面の主役。みどりの上着で 床を 歩きまわる）
  folk({ size: 'normal', hair: 'swept', head: { hair: '#6a3a2a', eye: '#3a5a3a', mouth: 'smile', blush: true }, colors: { tunic: '#3a7a4a', vest: '#f0e4c8', pants: '#4a3a3a', boot: '#5a3a2a', scarf: '#e8c060' } }, 0, 0, 0,
    { name: '書記の少年', path: loop([[0, 6], [3.2, -2], [0, -9], [-3.2, -2]]), speed: 1.1, lines: [['王さまの 命令で、この塔の本を ぜんぶ 書き写しているんだ。', '……あと 九万さつ。'], ['上を見ると、首が いたくなるよね。', 'でも 見ちゃうんだ。きれいだから。']] });
  // 段の下の 衛兵
  { const [x, , z] = PA(9.4, AS - .12); folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'wolf', head: { hair: '#3a2e2a', skin: '#e0b088', eye: '#5a5a7a', brow: 'angry', mouth: 'line' }, colors: { tunic: '#6a3a5a', scarf: '#e8c060' } }, x, z, Math.atan2(-x, -z),
    { name: '塔の衛兵', lines: [['この段を のぼれば、一の回廊だ。', '走るなよ。本が おどろく。'], ['……冗談では ない。この塔の本は、ときどき とんで にげるのだ。', '頭の上に 気をつけろ。']] }); }
  // 一の回廊の上：窓の前で 王都を見る 星読みの学者
  { const [x, , z] = PA(13.1, .18); folk({ size: 'normal', outfit: 'robe', hat: 'wizard', hatC: '#2a2a5a', hold: 'staff', hair: 'center', head: { hair: '#a8a8c8', eye: '#6a8ac8', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#2a2a5a', trim: '#c8c8f0', belt: '#c8a040' } }, x, z, PI,
    { name: '星読みの学者', lines: [['ここから見る 王都の夕やけは、王国で いちばんだ。', 'お城の屋根が、もうすぐ 星を うつしはじめる。'], ['夜になったら、窓の外の 星を数えるのが わたしの しごと。', '……きのうは 三つ 数えたところで ねてしまった。']] }, FL); }
  // ねこ（床を ぐるりと歩く）
  const cat = R.cat({ c: '#e8a050', belly: '#f8f0e0' }); scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, path: loop([0, 1, 2, 3, 4, 5, 6, 7].map(i => [Math.sin(i / 8 * TAU) * 5, 1 + Math.cos(i / 8 * TAU) * 3])), speed: 1.2, idle: t => R.catPose(cat, 'walk', t * 1.3), lines: ['にゃ。', '……（本の上で ねるのが すきらしい）', 'にゃあん。'] });
  const hl = new THREE.PointLight('#ffe0b0', 8, 8, 1.5); scene.add(hl);

  // ---- しらべられる物 ----
  G.sign(0, 1, 0, { name: '光の玉', lines: [['見上げると、ずっと上に 光の玉が うかんでいる。', '本だなの回廊が、霧の中へ どこまでも つづいている。']] });
  G.sign(0, 1.2, -12.9, { name: '大きなアーチの窓', lines: [['窓の外は、夕やけの王都。', '屋根の むこうに、青い屋根の 城が 見える。'], 'ずっと下を、鳥の むれが 横切っていく。'] });
  G.sign(-2.6, 1.2, -8.6, { name: '台の上の 古い本', lines: [['ひらいたままの 大きな本。', '「空のくじら」「霧の城」「ネオンの港」……旅の地図の本らしい。'], 'しおりが はさんである。だれかが 読みかけのようだ。'] });
  { const [x, , z] = PA(13.4, AE - .3, 0); G.sign(x, FL + 1, z, { name: '回廊の本だな', lines: [['背表紙の文字が 読めない。', 'さわると、本が かすかに ふるえた……ような。']] }); }

  // ---- はじめの場所と 自動で歩く道 ----
  G.spawn(0, 10, PI);
  G.camera({ pitch: .08, lookUp: 1.4 });
  G.tour([[0, 4], [0, -10.5], [7.5, -8], [10, 0], [8, 8], [0, 10.5], [-7, 7.5], [-9, 0], [-7.5, -8], [0, -10.5], [0, 4]]);

  // ---- 毎コマ：はしごの司書、舞う本、鳥、光の玉 ----
  G.tick((t, dt, P0) => {
    hl.position.set(P0.x, P0.y + 2.5, P0.z + 2);
    { const c = (t * .25) % 2, u = c < 1 ? c : 2 - c, h = Math.min(1, u * 1.2) * 4; libr.position.set(LAD.x, h, LAD.z); const J = libr.userData.J, s = Math.sin(t * 5); J.armL.rotation.set(-2.6 + s * .3, 0, .2); J.armR.rotation.set(-2.6 - s * .3, 0, -.2); J.legL.rotation.x = -.5 + s * .4; J.legR.rotation.x = -.5 - s * .4; J.shinL.rotation.x = J.shinR.rotation.x = .6; }
    books.forEach((b, i) => { const u = b.userData, a = t * u.sp + u.ph; b.position.set(Math.sin(a) * u.r, u.y + Math.sin(t * .6 + i) * .6, Math.cos(a) * u.r - 1); b.rotation.set(Math.sin(t * .4 + i) * .2, a + (u.sp > 0 ? PI / 2 : -PI / 2), 0); const f = Math.sin(t * 4 + i) * .5 + .7; u.L.rotation.z = f; u.R.rotation.z = -f; });
    birds.forEach((b, i) => { const a = t * .3 + i * 1.6; b.position.set(Math.sin(a) * 30, 6 + i * 3, -60 + Math.cos(a) * 10); b.rotation.y = a + PI / 2; R.birdPose(b, 'fly', t + i); });
    orb.rotation.y = t * .5; orbH.material.opacity = .6 + Math.sin(t * 1.3) * .1; motes.userData.tick?.(t, P0.x, P0.z);
    F.tick(t); D.tick(t, G.cam); });
});
