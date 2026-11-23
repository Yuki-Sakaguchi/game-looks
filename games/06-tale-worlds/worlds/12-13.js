// ワールド 12-13「がけの上の飛空艇の港」。もとは game-looks-12/13-airship-harbor-cliff.html（見るだけの場面）。
// 夕方、雲の海から そそり立つ がけに、板の通路が 4 段はりつく港町。空へつき出た桟橋に、気のうの船と帆の船が出入りする。
// ゲームにするために足した物：通路（上から 2 段め）と桟橋 2 本を歩けるようにし、もやっている飛空艇の甲板へ わたり板でのれるようにした。
// 家と家のすきまに 木箱でのぼる物見台、切符の屋台、港の人 9 人とねこ、しらべられる物 4 つ。下の段・上の段・遠くの船は もとのまま見るだけ。
TALE_WORLD('12-13', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), FW = PACK_FWILD(THREE, K, R), RM = PACK_REALM1(THREE, K, R, F), { hash } = K, PI = Math.PI;
  G.cam.far = 1400; G.cam.updateProjectionMatrix();
  scene.add(R.skyDome([[0, '#3a3a7a'], [.4, '#6a4a8a'], [.7, '#c06a80'], [.88, '#e8886a'], [1, '#f4b07a']], { r: 620 })); scene.fog = new THREE.Fog('#c07a80', 110, 760);
  const SUN = new THREE.Vector3(.75, .18, .55).normalize();
  K.lights(scene, G.renderer, { sky: 0xc8a8e0, ground: 0x8a5a6a, amb: 1.7, sun: 0xffb070, power: 2.8, range: 38, pos: [SUN.x * 60, SUN.y * 60, SUN.z * 60] });

  // ---- 甲板の上だけ 低い（もやっている船の甲板）。ほかは通路と桟橋の板の高さ 0 ----
  const SHIP = { x: 9.6, z: 35.5 }, DECK = -.47, onDeck = (x, z) => x > SHIP.x - 1.5 && x < SHIP.x + 1.5 && z > 33.5 && z < 39.6, H = (x, z) => onDeck(x, z) ? DECK : 0;
  G.ground(H); G.bounds(-37.4, 41.4, .4, 40);

  // ---- 大きながけ（板の通路の うしろ）と、はるか下の雲の海 ----
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const ROCK = FW.tex.caveRock({ c: '#c8967a', glint: false, moss: .25, mossC: '#7a8a5a' }), TOP = T.grass({ c: '#6a8a4a' });
  for (let i = -5; i <= 5; i++) for (let j = 0; j < 5; j++) { const w = 26, h = 42; put(FW.cliff({ w, h, d: 4, lean: .04, seed: i * 7 + j, tex: ROCK, top: j === 4 ? TOP : ROCK }), i * 24 + (j % 2) * 6, -1.6 - j * 1.2 - Math.abs(i) * .6, 0, -170 + j * 40); }
  const sea = RM.cloudSea({ y: -175, cz: 150, w: 1000, d: 800, c: '#f8c8a8', shade: [.62, .5, .72], m: 50 }); scene.add(sea.mesh);
  scene.add(R.backdrop({ c: '#6a5a8a', haze: '#e89a8a', r: 680, h: 90, y: -180, rep: 3, seed: 5 }));

  // ---- 板の通路（4 段）と、家・荷あげの腕木・桟橋。歩けるのは y=0 の段だけ ----
  const docks = [[14, 0, 30], [-22, 0, 16], [30, -13, 22], [-2, -13, 20], [18, -26, 26], [-40, 12, 14], [46, 12, 14]];
  const LV = [12, 0, -13, -26], WALL = [T.boards({ c: '#a8845a' }), T.plaster({ c: '#e8d0b0', frame: 'cross', wood: '#5a3a2a' }), T.boards({ c: '#8a6a4a', seed: 2 }), T.plaster({ c: '#f0dcc0', seed: 3 })], ROOF = [T.roof({ kind: 'slate', c: '#3a6a7a' }), T.shingle({ c: '#a8503a' }), T.roof({ kind: 'scale', c: '#4a8a8a' })];
  const winL = T.window({ bars: 'cross', lit: 1, curtain: '#ffd890', frame: '#4a3020' }), winD = T.window({ bars: 'cross', curtain: '#e8d8c0', frame: '#4a3020' }), smokeAt = [];
  LV.forEach((y, l) => {
    { const Gs = R.geo(); Gs.box(250, 1, 7.6, 0, y - 1, 3.6, { m: 3 }); fixed.push(Gs.mesh(T.cobble({ kind: 'slab', c: '#b8a090' }))); const Gr = R.geo(); Gr.box(250, 4, 4.2, 0, y - 5, 1.9, { m: 3, c0: .6, c1: .9 }); fixed.push(Gr.mesh(ROCK));   // がけを けずった石の段と、その下の岩
      const Rl = R.geo().normal([0, .3, 1]); Rl.quad([-125, y, 7.3], [125, y, 7.3], [125, y + .9, 7.3], [-125, y + .9, 7.3], [0, 0, 250 / 1.6, 1]); fixed.push(Rl.mesh(F.tex.rail({ kind: 'wood', c: '#8a6a48' }), { side: true })); }
    for (let k = 0; k < 18; k++) { const x = -110 + k * 13 + hash(k, l) * 4; if (docks.some(d => d[1] === y && Math.abs(x - d[0]) < 6)) continue; const w = 6 + hash(k, l + 3) * 2.5, h = 3 + hash(k, l + 5) * 1.6;
      const hs = put(R.house({ w, d: 3.6, h, h2: k % 3 ? 0 : 2.4, wall: WALL[(k + l) % 4], roof: ROOF[(k + l * 2) % 3], pitch: .7, ridge: 'x', eave: .4, win: winD, winLit: winL, lit: .65, door: T.door({ style: 'plank', c: '#5a3a2a', lit: 1 }), chimney: k % 2 === 0, seed: k * 4 + l, wins: { f: 2, b: 0, l: 1, r: 1 } }), x, 1.8, 0, y);
      if (y === 0) G.box(x, 1.8, w + .3, 3.9, -1, 9, 0, true);
      if (k % 2 === 0) smokeAt.push([x + w * .24, y + hs.userData.top + .8, 1.8 - .6]); }
    for (let k = 0; k < 9; k++) { const x = -96 + k * 26 + l * 7; put(R.lamp({ h: 2.6, c: '#3a2a2a' }), x, 7, 0, y, y === 0 ? 'trunk' : 'none', { r: .15 }); put(F.flag({ kind: 'banner', w: .7, h: 1.9, pole: 3.8, c: k % 2 ? '#2a8a8a' : '#e8a050', crest: 'anchor', cc: '#f4ead8' }), x + 6, 7.1, 0, y, y === 0 ? 'trunk' : 'none', { r: .12 }); } });
  docks.forEach(([x, y, len]) => { put(F.pier({ len, w: 3.2, h: 1, drop: 1.2, c: '#8a6a48', rail: 'rope' }), x, 7.4 + len / 2, 0, y - 1); put(R.lamp({ h: 3, c: '#3a2a2a' }), x + 1.3, 7.4 + len - .5, 0, y, y === 0 ? 'trunk' : 'none', { r: .15 }); });
  for (const [x, y] of [[-6, 0], [30, 0], [-34, -13], [20, -26]]) { const Gt = R.geo(); FW.tube(Gt, [[x, y + 7, .6, .35], [x, y + 8.2, 4, .3], [x, y + 8.6, 8.4, .25]], 5, {}); fixed.push(Gt.mesh(T.planks({ c: '#5a4030' }))); }   // 荷あげの腕木
  for (let i = 0; i < 30; i++) { const x = -100 + hash(i, 1) * 200, l = i % 4, y = LV[l]; put(i % 3 ? R.crate({ s: .6 + hash(i, 2) * .3, kind: i % 2 ? 'x' : 'slash' }) : R.barrel({ c: '#6a4a34' }), x, 4.1 + hash(i, 3) * .4, i, y, y === 0 ? (i % 3 ? 'box' : 'round') : 'none'); }

  // ---- 歩ける所のふち（見えないかべ）：通路の手すり、桟橋のなわの手すり、桟橋の先 ----
  const wallX = (x0, x1, z, h = 1.2) => G.box((x0 + x1) / 2, z, x1 - x0, .3, -1, h, 0, true), wallZ = (x, z0, z1, h = 1.2) => G.box(x, (z0 + z1) / 2, .3, z1 - z0, -1, h, 0, true);
  wallX(-37.6, -23.4, 7.45); wallX(-20.6, 12.6, 7.45); wallX(15.4, 41.6, 7.45);
  wallZ(-23.5, 7.4, 23.4); wallZ(-20.5, 7.4, 23.4); wallX(-23.6, -20.4, 23.5);
  wallZ(12.5, 7.4, 34.1); wallZ(12.5, 35.1, 37.4); wallZ(15.5, 7.4, 37.4); wallX(12.4, 15.6, 37.5);

  // ---- 足した：通路のはしの通行止め（ここから先は荷の置き場） ----
  for (const [x, s] of [[-37.9, 1], [41.9, -1]]) { put(R.fence({ len: 3.6, kind: 'wood' }), x, 5.5, PI / 2, 0); G.box(x, 5.5, .4, 3.8, -1, 1.4, 0, true);
    put(R.crate({ s: .9, kind: 'x' }), x - s * .7, 4.3, .2, 0, 'box'); put(R.crate({ s: .7 }), x - s * .7, 4.3, .5, .9, 'none'); put(R.barrel({ c: '#6a4a34' }), x - s * .7, 6.6, 0, 0, 'round'); }

  // ---- 足した：家のすきまの物見台（木箱 → 木箱 2 つ → 台。台の上から 船と雲の海を見わたせる） ----
  const LK = { x0: -11.6, x1: -7.2, z0: .4, z1: 3.1, y: 2.7 };
  { const P = T.planks({ c: '#8a6a48', w: 8 }), Gp = R.geo(), Gw = R.geo(), cx = (LK.x0 + LK.x1) / 2, cz = (LK.z0 + LK.z1) / 2, w = LK.x1 - LK.x0, d = LK.z1 - LK.z0;
    Gp.box(w, .22, d, cx, LK.y - .22, cz, { m: 2 }); fixed.push(Gp.mesh(P));
    for (const [px, pz] of [[LK.x0 + .2, LK.z0 + .2], [LK.x1 - .2, LK.z0 + .2], [LK.x0 + .2, LK.z1 - .2], [LK.x1 - .2, LK.z1 - .2]]) Gw.box(.24, LK.y - .2, .24, px, 0, pz, { m: 1.5 });
    Gw.box(1.2, .1, .1, LK.x0 + .6, LK.y + .85, LK.z1 - .08, { m: 1.5 }).box(2.2, .1, .1, LK.x1 - 1.1, LK.y + .85, LK.z1 - .08, { m: 1.5 }); Gw.box(.1, .1, d, LK.x0 + .05, LK.y + .85, cz, { m: 1.5 }); Gw.box(.1, .1, d, LK.x1 - .05, LK.y + .85, cz, { m: 1.5 });
    for (const [px, pz] of [[LK.x0 + .05, LK.z1 - .08], [LK.x1 - .05, LK.z1 - .08], [-10.45, LK.z1 - .08], [-9.35, LK.z1 - .08], [LK.x0 + .05, LK.z0 + .3], [LK.x1 - .05, LK.z0 + .3]]) Gw.box(.1, .9, .1, px, LK.y, pz, { m: 1.5 });
    fixed.push(Gw.mesh(T.planks({ c: '#5a4030' })));
    G.box(cx, cz, w, d, -1, LK.y, 0); G.box(-11.0, LK.z1 - .05, 1.2, .15, LK.y, LK.y + 1.1, 0, true); G.box(-8.3, LK.z1 - .05, 2.2, .15, LK.y, LK.y + 1.1, 0, true); G.box(LK.x0 + .05, (LK.z0 + LK.z1) / 2, .15, LK.z1 - LK.z0, LK.y, LK.y + 1.1, 0, true); G.box(LK.x1 - .05, (LK.z0 + LK.z1) / 2, .15, LK.z1 - LK.z0, LK.y, LK.y + 1.1, 0, true);
    put(R.crate({ s: .9, kind: 'slash' }), -10.8, 3.6, 0, 0, 'box'); put(R.crate({ s: .9, kind: 'x' }), -9.9, 3.6, 0, 0, 'box'); put(R.crate({ s: .9, kind: 'slash', c: '#8a9a6a' }), -9.9, 3.6, .1, .9, 'box');
    put(F.flag({ kind: 'flag', w: 1.1, h: .7, pole: 2.6, c: '#2a8a8a', crest: 'anchor', cc: '#f4ead8' }), LK.x0 + .3, LK.z0 + .4, 0, LK.y, 'trunk', { r: .1 });
    G.sign(-8.2, LK.y + .4, LK.z1 - .2, { name: '物見台', lines: [['雲の海が、夕日で もも色に光っている。', '下の段の桟橋にも、船が もやっている。'], ['はるか遠くに、船が ゆっくり横切っていく。', 'あれは どこの港へ 行くのだろう。']] }); }

  // ---- 足した：切符の屋台（家のすきま）と、旅の荷物 ----
  put(R.stall({ c: '#2a8a8a', seed: 3, fc: ['#f4ead8', '#e8a050', '#c8503c'] }), -35.5, 1.9, 0, 0, 'box');
  put(R.crate({ s: .7, kind: 'x', c: '#9a7a5a' }), -21.2, 19.2, .3, 0, 'box'); put(R.crate({ s: .5, c: '#6a5a8a' }), -21.2, 19.2, .7, .7, 'none'); put(R.barrel({ h: .9, r: .34, c: '#6a4a34' }), -22.8, 12, 0, 0, 'round');
  put(R.barrel({ c: '#6a4a34' }), 15.1, 22, 0, 0, 'round'); put(R.crate({ s: .8, kind: 'slash' }), 15.0, 26, .2, 0, 'box');
  G.sign(16.4, 1.2, 7.2, { name: '行き先の板', lines: [['一番桟橋：東の くじらの町ゆき', '二番桟橋：霧の上の 城下町ゆき'], '下の段の桟橋は、荷物の船 せんようです。'] });
  G.sign(-6, 2.2, 6.6, { name: '荷あげの腕木', lines: [['がけから つき出た 太い木の腕。', 'なわの先に、木箱が ゆれている。'], '下の段から、荷物を 引き上げるらしい。'] });
  G.sign(-22, 1, 23.2, { name: '桟橋の先', lines: [['足の下は、ずっと 雲の海。', '……下を見ると、ひざが ふるえる。'], '雲のすきまに、もっと下の段の 明かりが見えた。'] });

  scene.add(R.merge(fixed));
  const cranes = [[-6, 0], [30, 0], [-34, -13], [20, -26]].map(([x, y], i) => { const g = new THREE.Group(), Gq = R.geo(); Gq.quad([-.03, -4, 0], [.03, -4, 0], [.03, 0, 0], [-.03, 0, 0], [0, 0, 1, 3]).quad([0, -4, -.03], [0, -4, .03], [0, 0, .03], [0, 0, -.03], [0, 0, 1, 3]); g.add(Gq.mesh(F.tex.rope(), { side: true })); const c = R.crate({ s: .9, kind: 'x' }); c.position.y = -4.9; g.add(c); g.position.set(x, y + 8.4, 8.3); scene.add(g); return g; });

  // ---- 夕日と雲 ----
  const sunD = new THREE.Mesh(new THREE.CircleGeometry(20, 20), new THREE.MeshBasicMaterial({ color: '#fff0c0', fog: false })); sunD.position.set(SUN.x * 600, 30, SUN.z * 600); sunD.lookAt(0, 0, 0); scene.add(sunD);
  for (let k = 0; k < 12; k++) { const c = R.cloud({ s: 60 + hash(k, 9) * 70, c: '#ffc8a0', shade: '#8a5a8a', seed: k }), a = .2 + (k / 12) * 1.9; c.position.set(Math.cos(a) * 540, -20 + hash(k, 8) * 120, Math.sin(a) * 540); c.lookAt(0, 0, 0); scene.add(c); }
  const mist = RM.drift(scene, { n: 12, area: [-300, 300, -150, -90, 40, 300], s: 80, c: '#f8c0a8', shade: '#9a6a9a', speed: 2.2 });

  // ---- 船：もやっている 4 隻（いちばん手前の 1 隻は 甲板にのれる）、入ってくる 1 隻、出ていく 1 隻、遠くの船 ----
  const TEAL = '#2a9a9a';
  const moored = [[F.airship({ s: 1.5, c: '#e8f0e8', c2: TEAL, hull: '#7a5038' }), 14 - 5.2, 0, 34], [RM.skyShip({ s: 1, c: '#5a3a2a', c2: TEAL, sail: '#f4e8d0', bag: '#d8eae4', bag2: TEAL, crest: 'anchor', cc: TEAL }), 30 + 5.6, -13, 22], [RM.skyShip({ s: .9, c: '#6a4a3a', c2: '#c8503c', sail: '#f0dcc0', sail2: '#c8503c', crest: 'sun', cc: '#c8503c' }), 18 - 5.2, -26, 26], [F.airship({ s: 1.3, c: '#3aa8a0', c2: '#f0e4c8' }), -2 - 4.6, -13, 20]];
  moored.forEach(([s, x, y, len], i) => { s.position.set(x, y - 2.2, 7.4 + len * (i ? .55 : 1.08)); scene.add(s); });
  moored[0][0].position.set(SHIP.x, -2.2, SHIP.z);   // のれる船は、桟橋の先の わきへ寄せた
  // 甲板のふち（見えないかべ）と、うしろの船室。わたり板の所だけ あけてある
  { const x0 = SHIP.x - 1.6, x1 = SHIP.x + 1.6, z0 = 33.4, z1 = 39.7; wallZ(x0, z0, z1, .9); wallZ(x1, z0, 34.1, .9); wallZ(x1, 35.1, z1, .9); wallX(x0, x1, z1, .9); G.box(SHIP.x, 32.05, 2.7, 2.7, -3, 1.9, 0, true);
    const Pb = R.geo(); Pb.box(1.6, .1, .9, SHIP.x + 2.25, -.06, 34.6, { m: 1.5 }); Pb.box(1.6, .08, .08, SHIP.x + 2.25, .75, 34.15, { m: 1.5 }).box(1.6, .08, .08, SHIP.x + 2.25, .75, 35.05, { m: 1.5 }); const pm = Pb.mesh(T.planks({ c: '#a8845a' })); scene.add(pm);
    G.box(SHIP.x + 2.25, 34.05, 1.6, .15, -1, 1.2, 0, true); G.box(SHIP.x + 2.25, 35.15, 1.6, .15, -1, 1.2, 0, true); G.box(SHIP.x + 2.25, 34.6, 1.6, .9, -1, .04, 0);
    put(R.crate({ s: .7, kind: 'x' }), SHIP.x - .8, 38.4, .4, DECK, 'box'); put(R.barrel({ h: .8, r: .3, c: '#6a4a34' }), SHIP.x + .9, 38.8, 0, DECK, 'round');
    G.sign(SHIP.x + .4, DECK + 1.6, 33.6, { name: '船室の とびら', lines: [['かぎが かかっている。', '中から、いびきが 聞こえる……。']] }); }
  const inbound = F.airship({ s: 1.6, c: '#3aa8a0', c2: '#f0e4c8', hull: '#6a4a34' }); scene.add(inbound);
  const outbound = RM.skyShip({ s: 1.2, c: '#4a3a4a', c2: TEAL, sail: '#f8ecd8', wing: '#f8ecd8', crest: 'star', cc: TEAL }); scene.add(outbound);
  const farShips = [0, 1, 2].map(k => { const s = k === 1 ? RM.skyShip({ s: 1.4, bag: '#e8e0d0', c2: TEAL }) : F.airship({ s: 1.6, c: k ? '#e8d8c0' : '#3aa8a0', c2: '#c8503c' }); scene.add(s); return s; });
  const gulls = [0, 1, 2, 3, 4].map(k => { const b = R.bird({ c: '#f8f0f0', belly: '#ffffff', neck: false, s: 1.6 }); scene.add(b); return b; });

  // ---- 港の人（TL.person。主人公と同じ 4.5 頭身の作り）。服と帽子で 仕事が分かるように ----
  const folk = (o, x, z, ry, d, y) => { const p = TL.person(o); p.position.set(x, y ?? H(x, z), z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'center', head: { hair: '#3a2e2a', skin: '#e0b088', eye: '#5a5a7a', brow: 'angry', mouth: 'line' }, colors: { tunic: '#2a6a7a', scarf: '#e8a050' } }, 16.6, 4.3, -.9,
    { name: '桟橋の番人', lines: [['一番桟橋へ ようこそ。', '船に のるなら、わたり板を ゆっくり歩くように。'], '風の強い日は、桟橋を とじることもある。', ['この港の下には、まだ 2 つも段がある。', '荷物の船は、そっちへ つくんだ。']] });
  folk({ size: 'tall', hat: 'cap', hatC: '#2a3a5a', hair: 'wolf', bulk: 1.08, head: { hair: '#e8e0d0', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'beard' }, colors: { tunic: '#2a3a5a', vest: '#e8c058', linen: '#eae4d4', pants: '#3a3a4a', scarf: TEAL } }, 13.5, 33.4, -PI / 2,
    { name: '船長', lines: [['わしの船は、あしたの朝 東へ出る。', '空を泳ぐ くじらの町まで、三日の旅じゃ。'], ['甲板に のってみるかね？', 'わたり板の先へ どうぞ。ただし 船室は かぎつきじゃ。'], '雲の海に落ちた者は、まだ 一人もおらん。……今のところはな。'] });
  folk({ size: 'normal', outfit: 'worker', hat: 'kerchief', hatC: TEAL, hair: 'swept', head: { hair: '#2a2a3a', eye: '#2a8a8a', eyes: 'small', mouth: 'smile' }, colors: { linen: '#e8dcc0', pants: '#4a3a5a', scarf: TEAL } }, 0, 0, 0,
    { name: '荷運びの若者', path: loop([[13.3, 9], [13.3, 31], [14.7, 31], [14.7, 9]]), speed: 1.4, lines: [['よいしょ、よいしょ。', '船の荷物は、ぜんぶ 手で運ぶんだ。'], 'いつか 自分の船を もつのが ゆめなんだ。'] });
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#8a5a3a', hair: 'center', bulk: 1.14, head: { hair: '#5a4a3a', skin: '#c8885a', eyes: 'small', brow: 'thick', mouth: 'line', beard: 'stubble' }, colors: { linen: '#8a5a3a', pants: '#5a5a48', scarf: '#e8dcc0' } }, 0, 0, 0,
    { name: '荷運びの おやじ', path: loop([[-30, 5.4], [36, 5.4], [36, 5.9], [-30, 5.9]]), speed: 1.1, u: .3, lines: [['この通路を 毎日 何十回も 行ったり来たりさ。', 'おかげで 足は じょうぶだ。'], ['上の段へ行くには、がけの中の 長い階段を のぼる。', '今日は もう、かんべんだね。']] });
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#c8503c', hair: 'swept', head: { hair: '#c8603a', eye: '#4a6a9a', mouth: 'open', blush: true }, colors: { linen: '#4a6a8a', pants: '#3a4a6a', scarf: '#f4ecd0' } }, -4.6, 4.3, -.4,
    { name: '腕木の整備士', lines: [['腕木の なわが、ちょっと ほつれてる……', 'あした 取りかえなくちゃ。'], ['飛空艇の気のうはね、うすい布を 何まいも かさねてるの。', 'ぬい目ひとつで、空に うかぶか決まるのよ。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#e8a050', hair: 'center', head: { hair: '#5a2a2a', eye: '#8a4a6a', mouth: 'smile', blush: true }, colors: { tunic: '#2a6a7a', apron: '#f4ead8' } }, -33.3, 2.7, -.3,
    { name: '切符売りの おねえさん', lines: [['船の切符は こちら！', '東の くじらの町ゆき、あと 三まいですよ。'], ['霧の上の 城下町ゆきは、夕方の 一便だけ。', 'お城の旗が見えたら、もうすぐ つきます。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'wizard', hatC: '#3a3468', hold: 'staff', hair: 'center', head: { hair: '#e8e8e8', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#4a3e7a', trim: '#e8c058' } }, -21.6, 18, PI * .1,
    { name: '船を待つ 魔法使い', lines: [['ふむ、船は まだか。', 'ほうきで 飛ぶには、ちと 年を とりすぎた。'], ['森の中では、旅芸人の 祭りが ひらかれておるそうじゃ。', '帰りに よってみようかの。']] });
  folk({ size: 'child', hat: 'beret', hatC: '#c8503c', hair: 'wolf', head: { hair: '#2a2a34', eye: '#3a7a5a', mouth: 'open' }, colors: { tunic: '#e8a050', vest: '#4a6a8a', pants: '#4a3a5a', scarf: '#f4ecd0' } }, 3.2, 6.9, .2,
    { name: '船を見る子', lines: [['見て見て！ 船が 入ってくるよ！', 'あの青いのは、ぼくの いちばん好きな船！'], ['物見台に のぼると、もっと よく見えるんだ。', '木箱を ぴょんぴょんって のぼるの。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'hood', hatC: '#6a4a6a', hair: 'center', head: { hair: '#d8d0c8', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#6a4a6a', trim: '#e8c058', scarf: '#c8503c' } }, -8.4, 1.5, .3,
    { name: '雲読みの おばあさん', lines: [['ほっほ、ここまで のぼってきたのかい。', 'あたしは 雲の形で、あしたの風を 読むのさ。'], ['西の雲が 長くのびている。', 'あしたは 船出に いい風が ふくよ。']] }, LK.y);
  // ねこ（木箱の上で ねている。話しかけると ないて すわりなおす）
  const cat = R.cat({ c: '#e8a050', plain: 1 }); cat.position.set(15.0, .8, 26); cat.rotation.y = -1.2; scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃあ。', '……（しっぽで 雲の海を さしている）', 'にゃ？'], idle: t => R.catPose(cat, 'sit', t) });

  // ---- はじめの場所と 自動で歩く道 ----
  G.spawn(14, 11, .12);
  G.tour([[14, 18], [14, 30], [13.6, 34.6], [11.4, 34.6], [9.6, 36.2], [9.6, 38.6], [11.4, 34.6], [14, 16], [14, 6], [-8.4, 5.6], [-21.8, 6], [-21.8, 21], [-21.8, 6], [-30, 5.6], [8, 5.8]]);

  // ---- 毎コマ：腕木のゆれ、出入りする船、かもめ、霧、けむり ----
  const fx = K.fx(scene, 80); let sm = 0;
  G.tick((t, dt, P) => {
    cranes.forEach((g, i) => { g.rotation.z = Math.sin(t * .8 + i) * .12; g.rotation.x = Math.sin(t * .6 + i * 2) * .06; });
    { const k = (t * .02) % 1, a = 1 - k; inbound.position.set(-28 - a * 120, -6 + a * 30, 7.4 + 12 + a * 140); inbound.rotation.y = PI - Math.atan2(120, 140) * .9; }   // 入ってくる船
    { const k = (t * .025 + .3) % 1; outbound.position.set(-60 - k * 200, -40 + k * 50, 30 + k * 170); outbound.rotation.y = -Math.atan2(200, 170); }   // 出ていく船
    farShips.forEach((s, k) => { s.position.set(-300 + ((t * (3 + k) + k * 200) % 600), -60 + k * 50, 260 + k * 90); s.rotation.y = PI / 2; });
    gulls.forEach((b, k) => { const a = t * (.2 + k * .03) + k * 1.4, r = 12 + k * 4; b.position.set(22 + Math.cos(a) * r, -4 + k * 2 + Math.sin(t * .6 + k), 18 + Math.sin(a) * r * .7); b.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a) * .7); R.birdPose(b, 'fly', t * .45 + k); });
    mist.tick(t, G.cam); F.tick(t);
    if ((sm += dt) > .5) { sm = 0; for (const s of smokeAt) if (Math.abs(s[0] - P.x) < 60) fx.emit('smoke', s[0], s[1], s[2], { size: .5, life: 3.4, vy: .7, vx: .4, grow: 1.6, spread: .1, tint: '#f8d8d0' }); }
    fx.update(dt); });
});
