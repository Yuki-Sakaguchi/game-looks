// ワールド 8-22「星降る草原の天文塔」。もとは game-looks-8/22-starfall-observatory.html（見るだけの場面）。
// 天の川の下、光る花と風にゆれる草の丘をのぼると、緑青のドームの天文塔。道のランプのだいだいと、流れ星。
// ゲームにするために足した物：塔・ランプ・木・岩の当たり判定、草原のはしの低い柵、のぼれる星見台（望遠鏡つき）、話せる人 8 人とねこ、しらべられる物 4 つ。
TALE_WORLD('8-22', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FWILD(THREE, K, R), X = F.tex, { hash } = K, TAU = Math.PI * 2;
  scene.fog = new THREE.Fog('#3c3a86', 34, 170);
  K.lights(scene, G.renderer, { sky: 0xa8aef8, ground: 0x6660b0, amb: 1.55, sun: 0xd0d8ff, power: 1.35, range: 30, pos: [-24, 45, -30] });
  // 星空（天の川・月）と流れ星。塔のほうの空に天の川が下りてくるよう、丸天井を少しかたむける（主人公について動く）
  const sky = new THREE.Group(), tilt = new THREE.Group(); tilt.rotation.x = -.5; tilt.add(F.starDome({ r: 330, stops: [[0, '#0a0c38'], [.5, '#262672'], [1, '#6a4aa6']], n: 460, moon: { az: -.62, el: .84, r: 6, c: '#fff6d8' } }));
  const met = [F.meteors({ n: 9, r: 250, dir: 0, arc: 2.6 }), F.meteors({ n: 5, r: 250, dir: Math.PI, arc: 2.4, seed: 4 })]; tilt.add(met[0]); sky.add(tilt, met[1]); scene.add(sky);

  // ---- 丘と小道。道は遠くから丘をのぼって塔の扉へ行き、塔をまわって帰る輪 ----
  const cl = v => Math.max(0, Math.min(1, v)), sm = v => { const k = cl(v); return k * k * (3 - 2 * k); };
  const HF = (x, z) => { const r = Math.hypot(x, z); return 5.2 * (1 - sm((r - 5) / 18)) + cl((r - 26) / 22) * (F.vn(x * .08, z * .08, 3) - .4) * 2.4; };
  const path = new THREE.CatmullRomCurve3([[4, 46], [1.5, 36], [0, 26], [0, 17], [.6, 9.5], [5.5, 4.5], [8, -2], [4.5, -8.5], [-4, -9.5], [-11, -5], [-17, 6], [-20, 20], [-17, 34], [-8, 44]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const PS = path.getSpacedPoints(260), off = (x, z) => { let m = 1e9; for (const q of PS) { const d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < m) m = d; } return Math.sqrt(m); };
  const at = (u, side = 0) => { const p = path.getPointAt(((u % 1) + 1) % 1), tg = path.getTangentAt(((u % 1) + 1) % 1); return [p.x + tg.z * side, p.z - tg.x * side, Math.atan2(tg.x, tg.z)]; };
  const LAMPS = [[.085, 1.6], [.15, -1.6], [.215, 1.6], [.275, -1.6], [.46, 1.7], [.62, -1.7], [.78, 1.7], [.93, -1.7]].map(([u, s]) => { const [x, z] = at(u, s); return { x, z, y: HF(x, z) }; });
  const bakeF = F.bake([...LAMPS.map(l => ({ x: l.x, y: l.y + 2.3, z: l.z, c: '#ffb060', r: 8, k: 1.3 })), { x: .6, y: 7, z: 4.6, c: '#ffc070', r: 8, k: .9 }], [.72, .74, 1.02]);
  const land = R.ground({ w: 200, d: 200, cell: 2, H: HF, layers: [T.grass({ c: '#3f7a8c', flowers: .2, fc: ['#ffffff', '#c8e8ff', '#ffe8a0'] }), T.dirt({ c: '#8c80b8', pebbles: .4 }), T.grass({ c: '#4a8a8a', flowers: .9, fc: ['#ffffff', '#fff0a0', '#f0b0ff'] })],
    mix: (x, z) => { const d = off(x, z); return [cl(1.3 - d / 1.3), d > 1.8 && F.vn(x * .16, z * .16, 7) > .6 ? .8 : 0]; }, shade: (x, z) => bakeF(x, z, HF(x, z)) });
  scene.add(land.mesh); G.ground(HF); G.bounds(-46, 46, -38, 54);

  // ---- 動かない物：天文塔・ランプ・木・岩・光る花 ----
  const fixed = [], put = (o, x, z, ry = 0, y = HF(x, z), kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const tower = put(F.observatory({ r: 3.4, h: 9.5, c: '#8a88b4', domeC: '#4a9a9a', lit: true }), 0, 0, 0, 5.1, 'none'); G.circle(0, 0, 3.3, 3.5, 99);
  LAMPS.forEach((l, i) => put(R.lamp({ h: 2.6, light: false }), l.x, l.z, i, l.y, 'trunk', { r: .15 }));
  for (let i = 0; i < 60; i++) { const a = hash(i, 1) * TAU, r0 = 9 + hash(i, 2) * 70, x = Math.cos(a) * r0, z = Math.sin(a) * r0; if (off(x, z) < 5.5 || (Math.abs(x) < 9 && z > 0 && z < 50)) continue;
    if (i % 4 === 3) put(R.rock({ s: .6 + hash(i, 3) * 1.3, c: '#7a78b0', seed: i }), x, z, i, HF(x, z) - .15, 'round', { pad: .7 }); else put(R.tree({ kind: i % 4 === 0 ? 'pine' : 'round', h: 4 + hash(i, 4) * 3.5, c: i % 2 ? '#2f5f86' : '#356e7c', seed: i }), x, z, i, HF(x, z), 'trunk'); }
  for (let i = 0; i < 70; i++) { const [x, z] = at(hash(i, 5), (i % 2 ? 1 : -1) * (1.5 + hash(i, 6) ** 1.4 * 7)); if (Math.hypot(x, z) < 4.8) continue; put(F.bloom({ s: .5 + hash(i, 7) * .4, c: ['#a8e8ff', '#fff0a0', '#f0a8ff'][i % 3], leaf: '#3a8a84' }), x, z, i, HF(x, z), 'none'); }
  for (const [x, z, len, ry] of [[-3.6, 5.6, 3, .5], [4.4, 6.4, 3, -.5]]) put(R.fence({ len, kind: 'picket', h: .7, c: '#d8d0f0' }), x, z, ry, HF(x, z), 'wall');
  // 足した：草原のはしの 低い柵（ここから先へは 行かない）。丘を中心に ぐるりと かこむ
  { const N = 96, RX = 44, RZ = 44, CZ = 8; for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, x0 = Math.sin(a0) * RX, z0 = CZ + Math.cos(a0) * RZ, x1 = Math.sin(a1) * RX, z1 = CZ + Math.cos(a1) * RZ, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0);
    put(R.fence({ len: L + .05, kind: 'picket', h: .7, c: '#b8b0e0' }), mx, mz, ry, HF(mx, mz) - .05, 'none'); G.box(mx, mz, L + .3, .3, -9, 30, ry, true); } }
  // 足した：星見台（板の台と 5 つの段。上に 真ちゅうの望遠鏡）。丘の西の中ほど
  let DECK = 0;
  { const cx = -8.6, cz = 3.2, base = Math.min(...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => HF(cx + a * 1.8, cz + b * 1.8))) - .3, top = Math.max(...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => HF(cx + a * 1.8, cz + b * 1.8))) + 1.6;
    const pl = T.planks({ c: '#7a6a8a', w: 8 }), g2 = R.geo(); g2.box(3.4, .2, 3.4, 0, top - .2 - base, 0, { m: 1.5 }); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g2.box(.22, top - .2 - base, .22, a * 1.5, 0, b * 1.5, { m: 1.5 }); G.box(cx, cz, 3.4, 3.4, top - .3, top);
    for (let j = 0; j < 8; j++) { const x = cx + 1.7 + .45 + j * .9, y = top - (j + 1) * .38; if (y < HF(x, cz) + .05) break; g2.box(.9, y - base, 1.3, x - cx, 0, 0, { m: 1.5 }); G.box(x, cz, .9, 1.3, -9, y); }
    const me = g2.mesh(pl); me.position.set(cx, base, cz); fixed.push(me); DECK = top;
    put(R.fence({ len: 3.4, kind: 'picket', h: .7, c: '#d8d0f0' }), cx, cz - 1.65, 0, top, 'none'); put(R.fence({ len: 3.4, kind: 'picket', h: .7, c: '#d8d0f0' }), cx, cz + 1.65, 0, top, 'none'); put(R.fence({ len: 3.4, kind: 'picket', h: .7, c: '#d8d0f0' }), cx - 1.65, cz, Math.PI / 2, top, 'none');
    G.box(cx, cz - 1.65, 3.4, .2, top, top + 1.5, 0, true); G.box(cx, cz + 1.65, 3.4, .2, top, top + 1.5, 0, true); G.box(cx - 1.65, cz, .2, 3.4, top, top + 1.5, 0, true);
    const sc = R.geo().loft(6, [[0, .06, .06, 0, .8], [1.1, .04, .04, 1, 1]], {}).at(R.TR(0, 1.15, 0, 0, -1.0)).loft(8, [[-.5, .09, .09, 0, .8], [.2, .12, .12, .5, 1], [.75, .15, .15, 1, 1.1]], { cap: 'top' }).at(null).mesh(T.metal({ c: '#c8a04a' }));
    put(sc, cx - .8, cz - .6, -2.4, top, 'round', { r: .3, top: top + 1.3 });
    G.sign(cx - .8, top + .9, cz - .6, { name: '望遠鏡', lines: [['のぞくと、月の でこぼこが 見える。', '光の すじが、ひとつ 横切った。'], ['もう一度 のぞく。', '星の あいだに、\nくじらのような 形の雲が うかんでいる。']] }); }
  scene.add(R.merge(fixed));
  scene.add(R.backdrop({ c: '#2a2a70', haze: '#4a3c90', r: 150, h: 30, y: -2, rep: 7 }), R.backdrop({ c: '#3e3486', haze: '#6a4aa6', r: 215, h: 62, y: -3, rep: 4, seed: 3 }));
  const lampL = [0, 2].map(i => { const L = new THREE.PointLight('#ffb060', 14, 11, 1.6); L.position.set(LAMPS[i].x, LAMPS[i].y + 2.3, LAMPS[i].z); scene.add(L); return L; }), doorL = new THREE.PointLight('#ffc070', 16, 12, 1.6); doorL.position.set(.4, 7, 5); scene.add(doorL);
  const lens = F.halo('#bfe8ff', 2.2, .7); lens.position.set(tower.userData.lens[0], 5.1 + tower.userData.lens[1], tower.userData.lens[2]); scene.add(lens);
  // 風にゆれる草（切りぬきの板のむれ。上のはしの頂点だけを毎コマずらす）
  const sway = (kind, c, n, sd, s0, s1) => { const g = R.geo().normal([0, 1, 0]); for (let i = 0; i < n; i++) { const [x, z] = at(hash(i, sd), (i % 2 ? 1 : -1) * (1.5 + hash(i, sd + 1) ** 1.3 * 9)); if (Math.hypot(x, z) < 4.6) continue; const y = HF(x, z) - .03, s = s0 + hash(i, sd + 2) * (s1 - s0);
      for (const a of [i * 1.3, i * 1.3 + Math.PI / 2]) { const cx = Math.cos(a) * s / 2, cz = Math.sin(a) * s / 2; g.quad([x - cx, y, z - cz], [x + cx, y, z + cz], [x + cx, y + s, z + cz], [x - cx, y + s, z - cz], [0, 0, 1, 1], [.75, .75, 1.08, 1.08]); } }
    const me = g.mesh(T.tuft({ kind, c }), { side: true }), P = me.geometry.attributes.position, base = P.array.slice(), w = new Float32Array(P.count); for (let i = 0; i < P.count; i++) w[i] = base[i * 3 + 1] - HF(base[i * 3], base[i * 3 + 2]) > .3 ? 1 : 0;
    me.castShadow = false; me.frustumCulled = false; me.userData.tick = t => { for (let i = 0; i < P.count; i++) { if (!w[i]) continue; const x = base[i * 3], z = base[i * 3 + 2], gg = .05 + .13 * (.5 + .5 * Math.sin(t * .7 + x * .09 + z * .06)), k = Math.sin(t * 1.9 + x * .4 + z * .27) * gg + gg * .8; P.array[i * 3] = x + k; P.array[i * 3 + 2] = z + k * .5; } P.needsUpdate = true; }; scene.add(me); return me; };
  const grass = [sway('grass', '#5cacb4', 520, 11, .5, .9), sway('wheat', '#8a9ad8', 150, 21, .8, 1.2), sway('flower', '#5cacb4', 120, 31, .5, .75)];

  // ---- しらべる物 ----
  G.sign(0, 5.8, 3.4, { name: '塔の扉', lines: [['重い木の扉。中から、\n歯車の回る音が する。', 'かぎが かかっている。']] });
  G.sign(-.9, HF(-.9, 17) + .5, 17, { name: '光る花', lines: [['花びらが、\n星の光を ためて ほんのり光っている。', 'さわると、光が すこし 強くなった。']] });
  G.sign(-17.2, HF(-17.2, 34.6) + .6, 34.6, { name: '道しるべの石', lines: [['「北：天文塔　南：草原をこえて 塩の湖」', 'もう ひとつ 字が ほってあるが、\nこけで 読めない。']] });

  // ---- 人とねこ（TL.person。主人公と同じ 4.5 頭身の作り）。夜の色の服 ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y) => { const p = TL.person(o); p.position.set(x, y ?? HF(x, z), z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loopPts = PS.filter((_, i) => i % 6 === 0).map(q => [q.x, q.z]), line = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'tall', outfit: 'robe', hat: 'wizard', hatC: '#3a4a9a', hold: 'staff', hair: 'center', head: { hair: '#e8e4f0', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'beard' }, colors: { tunic: '#3a4a9a', trim: '#f0d880', belt: '#f0d880' } }, 2.2, 5.6, .3,
    { name: '天文の先生', lines: [['おや、こんな夜ふけに お客さんとは。', '今夜は 流れ星が よく 見える夜じゃ。'], ['星は 毎晩 すこしずつ ずれていく。', 'それを 書きとめるのが、\nわしの 仕事じゃよ。'], ['雲の上の 発着場には、\n空読みの 学者が おってな。', '朝の空と 夜の空、手紙で 教えあっておる。']] });
  folk({ size: 'normal', outfit: 'robe', hat: 'cap', hatC: '#c8483a', hair: 'center', head: { hair: '#c8743a', eye: '#4a6ac8', mouth: 'smile', blush: true }, colors: { tunic: '#f2e8cc', trim: '#c8483a', belt: '#c8a04a', scarf: '#c8483a' } }, 1.5, 36, Math.PI,
    { name: '見習いの学者', path: line(loopPts), speed: 1.1, u: .55, lines: [['先生に 星の 本を とどけに\n行くところなの。', 'とっても 重いのよ、これ。'], ['流れ星が 落ちた所には、\n光る石が のこるって。', '先生は「ただの\nうわさじゃ」って 言うけど。']] });
  folk({ size: 'child', hat: 'beret', hatC: '#4a6ac8', hair: 'swept', head: { hair: '#2a2a44', eye: '#4a8ac8', mouth: 'open', blush: true }, colors: C('#e8c860', '#5a4a8a', '#3a4a6a', '#f4f0e8') }, 3.6, 12.5, -2.2,
    { name: '星を数える子', lines: [['ひゃく よんじゅう いち、\nひゃく よんじゅう に……', 'あっ、どこまで 数えたか わすれちゃった。'], '流れ星に ねがいごと、もう した？'] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#8a6ac8', hair: 'center', head: { hair: '#5a3a2a', eye: '#6a4a8a', mouth: 'smile' }, colors: { tunic: '#6a5a9a', apron: '#e8e0f4' } }, -14.4, 12, 1.2,
    { name: '花つみの娘', lines: [['光る花は、夜にしか 咲かないの。', 'つんだ花は、\n朝には ただの 白い花に なるのよ。'], '塔の 先生の へやに、毎晩 一輪 かざるの。'] });
  folk({ size: 'tall', outfit: 'guard', hat: 'hood', hatC: '#3a3a5a', hold: 'spear', hair: 'wolf', head: { hair: '#4a3a2a', skin: '#e0b088', eyes: 'small', brow: 'angry', mouth: 'line' }, colors: { tunic: '#3a3a6a', metal: '#9098b0', scarf: '#c8483a' } }, -2.4, 6.6, .4,
    { name: '夜番', lines: [['塔の扉は、\n先生が 中に いるとき だけ ひらく。', '今は 外で 星を見ておられるから、\nしまっている。'], ['夜の 草原は しずかで いい。', 'たまに 耳の長い 小さな けものが、\nのぞきに 来る。']] });
  folk({ size: 'normal', hat: 'beret', hatC: '#a8553a', hair: 'wolf', head: { hair: '#d8b060', eye: '#3a7ac8', eyes: 'small', mouth: 'smile' }, colors: C('#3a6a8a', '#a8553a', '#4a4a5a', '#e0c040') }, -8.2, 2.4, -1.6,
    { name: '星座を描く絵かき', lines: [['星と星を 線で つないで、\n絵に しているんだ。', 'あれは「つりざお」、\nそっちは「ねむる ねこ」。'], ['望遠鏡も のぞいてごらん。', 'この 星見台は、\n段を のぼれば だれでも 使えるよ。']] }, DECK);
  folk({ size: 'small', hat: 'hood', hatC: '#5a5a7a', hold: 'staff', hair: 'center', head: { hair: '#b8b8c8', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'mustache' }, colors: C('#6a6a8a', '#4a4a6a', '#4a4a5a', '#c8a040') }, 6.4, 24, -2.6,
    { name: '夜の旅人', lines: [['昼は 歩き、夜は 星を 見て 道を さがす。', 'それが わしの 旅の しかたじゃ。'], ['大きな木の上の 町で、\nつり橋を わたってきた。', 'あそこの ランタンも、\n星のように きれいじゃった。']] });
  folk({ size: 'child', outfit: 'worker', hat: 'cap', hatC: '#4a8a8a', hair: 'center', head: { hair: '#8a5a34', eye: '#6a4a2a', mouth: 'smile', blush: true }, colors: { linen: '#e8e0f4', pants: '#4a4a7a' } }, 8.6, -6, -.6,
    { name: '虫とりの子', lines: [['光る虫を つかまえて、びんに 入れるんだ。', '朝になったら、ちゃんと にがすよ。'], 'ほら、\nいま きみの 肩の上を とんでいったよ！'] });
  const cat = R.cat({ c: '#e8e0d0', s: 1.1 }); cat.position.set(-2.4, HF(-2.4, 5.4), 5.4); cat.rotation.y = .6; scene.add(cat);
  G.npc(cat, { name: '塔のねこ', r: .2, head: .25, lines: ['にゃあ。', '……（しっぽで 月を さしている）', 'にゃ？'], idle: t => R.catPose(cat, 'sit', t) });
  const crits = [[.11, 3, '#d8d0f0'], [.2, -3.4, '#c8b8a0'], [.5, 3.2, '#d8d0f0'], [.85, -3, '#c8b8a0']].map(([u, s, c], i) => { const g = F.critter({ c, s: 1.4 }), [x, z, r] = at(u, s); g.position.set(x, HF(x, z), z); g.rotation.y = r + (s > 0 ? -1.2 : 1.2); scene.add(g); return g; });
  const bugs = [...Array(10)].map((_, i) => { const g = F.bug({ c: i % 3 ? '#fff0a0' : '#c8ffb0', s: 1.5 }); g.userData.orb = [hash(i, 21) * TAU, 1.6 + hash(i, 22) * 4, 1.1 + hash(i, 23) * 1.6, .25 + hash(i, 24) * .3, i % 2 ? 1 : -1]; scene.add(g); return g; });
  const motes = F.motes({ n: 80, box: [30, 6, 30], c: '#d8e0ff', size: .1, rise: .1, drift: 1.2, y: .3 }); scene.add(motes);

  // ---- はじめの場所（丘のふもとから、塔を見上げる）と、自動で歩く道 ----
  G.spawn(3.2, 45, Math.PI - .06);
  G.tour([[1.6, 38], [0, 22], [0, 15], [.6, 9.5], [4.4, 6.2], [7.6, -2], [4.5, -8.5], [-4, -9.5], [-9.6, -5], [-6.2, 3.2], [-8.6, 3.2], [-6, 3.2], [-12, 4], [-17, 10], [-18.6, 22], [-12, 36], [0, 36]]);
  G.tick((t, dt, P) => {
    sky.position.set(P.x, 0, P.z); for (const m of met) m.userData.tick(t); for (const g of grass) g.userData.tick(t);
    crits.forEach((c, i) => F.critterPose(c, 'sit', t + i));
    bugs.forEach((b, i) => { const [ph, r, h, sp, dir] = b.userData.orb, a = ph + t * sp * dir, s = Math.sin(P.ry || 0), c = Math.cos(P.ry || 0), cx = P.x + s * (2 + i * .6), cz = P.z + c * (2 + i * .6); b.position.set(cx + Math.cos(a) * r, HF(cx, cz) + h + Math.sin(t * 1.3 + ph) * .4, cz + Math.sin(a * 1.3) * r); b.rotation.y = Math.atan2(-Math.sin(a) * dir, Math.cos(a * 1.3) * 1.3 * dir); F.bugPose(b, t + ph); });
    lampL.forEach((L, i) => { L.intensity = 14 * (.92 + .08 * Math.sin(t * 6 + i * 2)); }); doorL.intensity = 16 * (.92 + .08 * Math.sin(t * 5)); lens.material.opacity = .5 + .25 * Math.sin(t * 1.7);
    motes.userData.tick(t, P.x, P.z); });
});
