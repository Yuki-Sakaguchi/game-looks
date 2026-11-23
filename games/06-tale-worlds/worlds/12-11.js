// ワールド 12-11「霧の上の城下町」。もとは game-looks-12/11-mist-sea-castle-town.html（見るだけの場面）。
// 朝。霧の海から島のようにつき出た丘の城下町。石がきの段々に しっくいの かべと まるい屋根の家。霧の向こうの岩山に大きな城、霧の上を つばさの帆の飛空艇がすべる。
// ゲームにするために足した物：上の通りから 1 段め・2 段めへおりる石段（手すりに切れ目）、家・石がき・小物の当たり判定、町のはしの石がき、
// 話せる町の人 9 人とねこ、しらべられる物 4 つ、のぼれる木箱。1 段めから 2 段めへは とびおりても行ける（もどりは石段）。
TALE_WORLD('12-11', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), FW = PACK_FWILD(THREE, K, R), RM = PACK_REALM1(THREE, K, R, F), { hash } = K, PI = Math.PI;
  scene.add(R.skyDome([[0, '#4a78c0'], [.45, '#88b0dc'], [.78, '#d8c8dc'], [.92, '#f6d0c0'], [1, '#ffe4c4']], { r: 600 })); scene.fog = new THREE.Fog('#f2d4cc', 90, 820);
  K.lights(scene, G.renderer, { sky: 0xd8e0ff, ground: 0xd8a8a0, amb: 1.55, sun: 0xffe0c0, power: 2.5, range: 36, pos: [-33, 24, -36] });
  const SUN = new THREE.Vector3(-.55, .4, -.6).normalize();

  // ---- 丘の町の段々：上の通り（y 0）→ 1 段め（-4.5）→ 2 段め（-9）→ 霧へ落ちる がけ ----
  const H = (x, z) => { const edge = Math.max(0, Math.abs(x) - 58) * 1.4; let y = z >= -4 ? Math.max(0, z - 10) * .5 : z >= -18 ? -4.5 : z >= -30 ? -9 : -9 - (-30 - z) * 2.2; return Math.max(-48, y - edge); };
  const land = R.ground({ w: 150, d: 90, cell: 2, cz: -14, H, layers: [T.grass({ c: '#6a9a5a', flowers: .22, fc: ['#f8f0e8', '#f0a8b8', '#f4d870'] }), T.cobble({ c: '#b8aca0', moss: .15 }), T.rock({ c: '#8a8090', moss: .3 })],
    mix: (x, z) => [z > -4 || (Math.abs(x % 24) < 2.4 && z > -30) || (z < -9 && z > -12) || (z < -22 && z > -25) ? 1 : 0, z < -30 || Math.abs(x) > 58 ? 1 : 0] });
  scene.add(land.mesh); G.ground(H); G.bounds(-55.5, 55.5, -29.6, 4.4);
  const sea = RM.cloudSea({ y: -40, cz: -200, w: 900, d: 700, c: '#f4e2dc', shade: [.82, .74, .84] }); scene.add(sea.mesh);
  scene.add(R.backdrop({ c: '#9a90b8', haze: '#f2d0c8', r: 640, h: 80, y: -42, rep: 3, seed: 2 }));
  const fixed = [], put = (o, x, z, ry = 0, y = H(x, z), kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const STONE = F.tex.ashlar({ c: '#c8beb0', moss: .25 }), STONE2 = F.tex.ashlar({ c: '#b0a698', moss: .35, seed: 3 });
  // 石がき。上は その段の高さで歩ける（上の通りの石がきは 手すりの手前まで）
  put(F.wall({ len: 120, h: 4.5, th: 1.2, stone: STONE, crenel: false }), 0, -4.6, 0, -4.5, 'none'); G.box(0, -4.6, 120, 1.2, -9, 0, 0);
  put(F.wall({ len: 120, h: 4.5, th: 1.2, stone: STONE2, crenel: false }), 0, -18.6, 0, -9, 'none'); G.box(0, -18.6, 120, 1.2, -13, -4.5, 0);
  put(F.wall({ len: 120, h: 4, th: 2, stone: STONE2, crenel: false }), 0, -31, 0, -12.6, 'none');
  // 石の手すり（まん中の石段の所だけ切れ目）
  { const Gr = R.geo().normal([0, 0, 1]); for (const [a, b] of [[-60, -1.3], [1.3, 60]]) { Gr.quad([a, 0, -4.1], [b, 0, -4.1], [b, .85, -4.1], [a, .85, -4.1], [0, 0, (b - a) / 1.6, 1]); G.box((a + b) / 2, -4.1, b - a, .3, 0, 1.2, 0, true); } fixed.push(Gr.mesh(F.tex.rail({ kind: 'stone', c: '#d8d0c4' }), { side: true })); }
  // 足した：上の通り → 1 段めへの石段（石がきに そって まっすぐ下りる）
  { const d = 7, n = 20, cz = -5.2 - d / 2; put(F.stairs({ w: 2.4, h: 4.5, d, n, tex: STONE, rail: 'stone' }), 0, cz, PI, -4.5, 'none');
    for (let i = 0; i < n; i++) G.box(0, cz - d / 2 + (i + .5) * d / n, 2.4, d / n, -13, -4.5 + (i + 1) * 4.5 / n, 0); }
  // 足した：1 段め → 2 段めへの石段（2 段めの石がきに そって、よこへ下りる）
  { const d = 7, n = 20, cx = 6; put(F.stairs({ w: 2.4, h: 4.5, d, n, tex: STONE2, rail: 'stone' }), cx, -20.4, PI / 2, -9, 'none');
    for (let i = 0; i < n; i++) G.box(cx + d / 2 - (i + .5) * d / n, -20.4, d / n, 2.4, -13, -9 + (i + 1) * 4.5 / n, 0); }
  // 足した：町のはしの石がき（右と左。ここで行き止まり）
  for (const sx of [-1, 1]) for (const [z0, z1, y] of [[-4, 4.8, 0], [-18, -4.6, -4.5], [-30, -18.6, -9]]) put(F.wall({ len: z1 - z0 + 1, h: 2.6, th: 1, stone: STONE, crenel: true }), sx * 56.6, (z0 + z1) / 2, PI / 2, y, 'wall');

  // ---- まるい屋根の家（1 段め・2 段め）と、上の通りの うしろの家 ----
  const ROOF = [T.shingle({ c: '#3a7a88' }), T.shingle({ c: '#4a8a7a', seed: 2 }), F.tex.slate({ c: '#3a6a8a', c2: '#5a8aa0' }), T.shingle({ c: '#b8604a', seed: 3 })], WALL = [T.plaster({ c: '#f0e6d4' }), T.plaster({ c: '#ece0cc', frame: 'beam', seed: 2 }), T.plaster({ c: '#f4ead8', seed: 4 })];
  const smokeAt = [], homes = [];
  const rh = (x, z, i, s = 1) => { const r = 2.1 * s + hash(i, 1) * .6, hs = RM.roundHouse({ r, h: 2.4 + hash(i, 2) * 1.2, wall: WALL[i % 3], roof: ROOF[i % 4 === 3 && i % 8 !== 3 ? 3 : i % 3], chimney: i % 2 === 0, lit: .3, bell: .4 + hash(i, 4) * .6 }); put(hs, x, z, (hash(i, 5) - .5) * .6, undefined, 'none'); G.circle(x, z, r + .15, H(x, z) - 1, H(x, z) + 30); homes.push([x, z, r]);
    if (hs.userData.smoke) { const v = hs.userData.smoke.clone(); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), hs.rotation.y); smokeAt.push([x + v.x, hs.position.y + v.y, z + v.z]); } };
  let i = 0; for (let x = -56; x <= 56; x += 7.6) { if (Math.abs(x % 24) > 3.2) rh(x + hash(x, 1) * 1.5, -13.5 + hash(x, 2) * 2, i); i++; }
  for (let x = -52; x <= 56; x += 8.4) { rh(x + hash(x, 3) * 2, -26.5 + hash(x, 4) * 1.5, i, 1.1); i++; }
  for (let x = -60; x <= 60; x += 9) { put(R.house({ w: 6, d: 5, h: 3, h2: 2.6, wall: WALL[i % 3], roof: ROOF[i % 3], pitch: .8, ridge: 'x', chimney: true, win: T.window({ bars: 'cross', shutters: 1, box: 1 }), seed: i }), x, 7.5, PI, undefined, 'none'); G.box(x, 7.5, 6.3, 5.3, -1, 20, PI, true); i++; }
  for (let k = 0; k < 18; k++) { const x = -56 + k * 6.6 + hash(k, 1) * 2, z = k % 2 ? -9 : -23; if (k % 3) put(R.tree({ kind: k % 2 ? 'round' : 'pine', h: 3.6 + hash(k, 2) * 2.4, c: '#4a8a5a', flowers: .15, seed: k }), x, z, 0, undefined, 'trunk'); else put(R.tuft({ kind: 'bush', s: 1.1, seed: k % 3 }), x, z, 0, undefined, 'none'); }

  // ---- 上の通りの物：街灯・旗・たる・花の箱 ----
  for (let x = -48; x <= 48; x += 12) { put(R.lamp({ h: 3, c: '#3a3a44' }), x + 6, -3.4, 0, 0, 'trunk', { r: .16 }); put(F.flag({ kind: 'banner', w: .9, h: 2.4, pole: 4.6, c: '#c83a34', crest: 'tower', cc: '#f4e0a0' }), x, -3.6, 0, 0, 'trunk', { r: .12 }); }
  for (let k = 0; k < 10; k++) { const x = -45 + k * 10 + hash(k, 3) * 3; if (k % 2) put(R.barrel({ c: '#7a5a3a' }), x, 1.8, 0, 0, 'round'); else put(R.crate({ s: .6, kind: 'x' }), x, 1.8, 0, 0); }
  scene.add(...[-22, 2, 26].map(x => F.bunting({ from: [x - 9, -.6, -14], to: [x + 9, -.2, -15], n: 14, sag: 1.4, cs: ['#c83a34', '#f4e0a0', '#3a7a88', '#f4ece0'] })));
  // 足した：木箱の山（上の通り。2 だんめから 石の手すりごしに 霧の海が見える）、花のはち、ベンチ、1 段めの せんたく物の木
  [[-9.2, 2.8, 0, .9], [-8.3, 2.8, 0, .9], [-8.3, 3.0, .9, .9], [-7.4, 2.8, 0, .9]].forEach(([x, z, y, s], k) => put(R.crate({ s, kind: k % 2 ? 'x' : 'slash' }), x, z, k * .15, y));
  for (const [x, z] of [[-26.5, -3.3], [16.5, -3.3], [-38.6, 3.2], [30.4, 3.2]]) { put(R.barrel({ h: .5, r: .34, c: '#9a6a44' }), x, z, 0, 0, 'round'); put(R.tree({ kind: 'bush', h: .7, flowers: .8, fc: ['#f0a8b8', '#f4d870', '#ffffff'], seed: x }), x, z, 0, .45, 'none'); }
  put(R.bench({ c: '#7a5a3a' }), -8, -3.2, PI); put(R.bench({ c: '#7a5a3a' }), 22, -3.2, PI);
  put(R.well(), -2.6, -15.6, .3, undefined, 'round', { pad: .85 });
  put(R.cart({ load: 'crates' }), 17.4, -16.6, .4);

  // ---- 霧の向こうの、岩山の大きな城 ----
  const CX = 50, CZ = -250, CY = -16;
  put(FW.pillar({ h: 30, r: 34, seed: 3, c: '#9a94a8' }), CX, CZ, 0, CY - 28, 'none'); put(FW.pillar({ h: 24, r: 18, seed: 5, c: '#9a94a8' }), CX - 44, CZ + 18, 1, CY - 22, 'none');
  put(F.castle({ s: 3.2, stone: F.tex.ashlar({ c: '#e8e0d4' }), roof: F.tex.slate({ c: '#3a6a9a', c2: '#4a80b0' }), c: '#c83a34', crest: 'tower' }), CX, CZ, -.25, CY, 'none');
  put(F.tower({ kind: 'round', r: 3.2, h: 26, stone: F.tex.ashlar({ c: '#e0d8cc' }), roof: F.tex.slate({ c: '#3a6a9a' }), top: 'cone', roofH: 10, flag: { c: '#c83a34' } }), CX - 44, CZ + 18, 0, CY - 8, 'none');
  put(F.bridge({ span: 26, w: 3, rise: 3, stone: F.tex.ashlar({ c: '#d8d0c4' }) }), CX - 24, CZ + 10, -.35, CY - 4, 'none');
  scene.add(R.merge(fixed));
  for (let k = 0; k < 9; k++) { const c = R.cloud({ s: 70 + hash(k, 9) * 60, c: '#fff0e8', shade: '#d0a8b8', seed: k }), a = -PI / 2 + (k - 4) * .34; c.position.set(Math.cos(a) * 520, 70 + hash(k, 8) * 90, Math.sin(a) * 520); c.lookAt(0, 40, 0); scene.add(c); }
  const sunD = new THREE.Mesh(new THREE.CircleGeometry(16, 20), new THREE.MeshBasicMaterial({ color: '#fff6dc', fog: false })); sunD.position.set(SUN.x * 560, 70, SUN.z * 560); sunD.lookAt(0, 20, 0); scene.add(sunD);
  const mist = RM.drift(scene, { n: 14, area: [-260, 260, -36, -18, -300, -50], s: 70, c: '#fbeee8', shade: '#d8b4c0', speed: 1.6 });

  // ---- 飛空艇（霧の上をすべる 2 隻と、遠くの気のうの船） ----
  const ships = [RM.skyShip({ s: 1.6, c: '#6a4a34', c2: '#c83a34', sail: '#f4ece0', sail2: '#c83a34', crest: 'tower', cc: '#c83a34', wing: '#f4ece0' }), RM.skyShip({ s: 1, c: '#5a4a5a', c2: '#3a7a88', sail: '#e8e0d4', crest: 'star', cc: '#3a7a88', bag: '#f0e4cc', bag2: '#3a7a88' })];
  ships.forEach(s => scene.add(s)); const farShip = F.airship({ s: 1.4, c: '#e8dcc8', c2: '#c83a34' }); farShip.rotation.y = -PI / 2; scene.add(farShip);

  // ---- しらべられる物 ----
  G.sign(40, .9, -3.9, { name: '石の手すり', lines: [['霧の海の むこうに、岩山の上の 大きな城が 見える。', '朝日で、城の かべが もも色に そまっている。']] });
  G.sign(2, 1.1, -3.2, { name: '道しるべ', lines: [['「↓ 下の段・井戸」', '「→ 王城行きの 飛空艇のりば（いまは 霧で おやすみ）」']] });
  G.sign(-2.6, -3.6, -14.5, { name: '井戸', lines: [['霧の水を あつめる 井戸だ。', 'のぞくと、ひんやりした 風が 上がってくる。']] });
  G.sign(-20, -8.1, -29.4, { name: '2 段めの はし', lines: [['足もとから、まっ白な 霧の海が はじまっている。', 'ときどき、霧の中を 飛空艇の かげが 通りすぎる。']] });

  // ---- 町の人（TL.person。主人公と同じ 4.5 頭身の作り） ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y) => { const p = TL.person(o); p.position.set(x, y ?? H(x, z), z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'wolf', head: { hair: '#3a2e2a', skin: '#e0b088', eye: '#5a5a7a', brow: 'angry', mouth: 'line' }, colors: { tunic: '#3a7a88', scarf: '#c83a34' } }, 0, 0, 0,
    { name: '見回りの衛兵', path: loop([[-40, -.2], [36, -.2], [36, 1], [-40, 1]]), speed: 1.2, lines: [['朝の霧が はれるまでは、飛空艇は 出ないぞ。', 'のんびり 町を 見ていくといい。'], ['城へ行けるのは、王の しょうたい状を 持つ者だけだ。']] });
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#a8443a', hair: 'center', head: { hair: '#3a3a3a', skin: '#e0b088', eyes: 'small', mouth: 'smile', beard: 'mustache' }, colors: { linen: '#f0e4cc', pants: '#6a5a4a', scarf: '#6a8a5a' } }, 7.4, -3.5, PI * .92,
    { name: '手すりの おじさん', lines: [['毎朝 ここで、霧の海を ながめるのが たのしみでね。', '同じ 形の霧は、二度と ないんだ。'], ['霧が 深い日は、城が 空に うかんで 見えるよ。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#e8b84a', hair: 'center', head: { hair: '#8a5a3a', eye: '#5a6a8a', mouth: 'smile', blush: true }, colors: { tunic: '#e8b84a', apron: '#f4ecd8' } }, 0, 0, 0,
    { name: 'かいものの おかあさん', path: loop([[-34, -2.6], [-5, -2.6], [-5, -1.9], [-34, -1.9]]), speed: .9, u: .3, lines: [['パン屋さんは 1 段めよ。', 'まん中の 石段から おりられるわ。'], 'うちの子、ねこを おいかけて どこかへ 行っちゃった。'] });
  folk({ size: 'child', hair: 'wolf', head: { hair: '#d8a050', eye: '#4a6a9a', mouth: 'open', blush: true }, colors: C('#f0a8b8', '#f4ecd8', '#5a6a9a', '#f4d870') }, 0, 0, 0,
    { name: 'ねこを おう子', path: loop([[-6.4, -6.6], [-3, -7.2], [-4, -9.8], [-7.2, -8.6]]), speed: 2.6, lines: [['まてー！ しろちゃん！', '……ねこって、なんで 石がきの上を 走れるの？'], ['あのね、2 段めの はしまで 行くと、霧の海に 手が とどきそうなんだよ。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#f4ecd8', hair: 'swept', bulk: 1.1, head: { hair: '#5a3a2a', skin: '#e8b890', eyes: 'small', mouth: 'smile', beard: 'stubble' }, colors: { tunic: '#b8604a', apron: '#f4ecd8' } }, 9.4, -9.6, PI * .9,
    { name: 'パン屋の おやじさん', lines: [['焼きたての 霧パンだよ！', '霧の水で こねると、ふわっふわに なるんだ。'], ['飛空艇の 船乗りたちは、うちの パンを 旅に もっていくのさ。']] });
  folk({ size: 'tall', hat: 'beret', hatC: '#3a7a88', hair: 'swept', head: { hair: '#c8843a', eye: '#3a6a9a', mouth: 'smile' }, colors: C('#5a4a5a', '#c83a34', '#3a4a6a', '#f4ece0', { linen: '#f4ece0' }) }, -22, -3.3, PI * .95,
    { name: '飛空艇の 船乗り', lines: [['霧が はれたら、また 空へ 出るんだ。', 'つばさの帆に 風を いっぱい うけてね。'], ['東の 大樹の 根もとの村へ、荷物を はこぶ とちゅうさ。', 'あそこの 木は、雲より 高いんだぜ。'], ['いつか、空を 泳ぐ くじらの 背中に 船を つけてみたいなあ。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'hood', hatC: '#6a5a8a', hold: 'staff', hair: 'center', head: { hair: '#e8e8e8', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#6a5a8a', trim: '#e8d8a0' } }, -12, -28.6, PI,
    { name: '霧よみの 老人', lines: [['霧の うごきを 見れば、あしたの 天気が わかる。', '……あしたは、霧のち 晴れじゃな。'], ['この霧の海の 底には、むかしの 都が しずんでおるという。', 'だれも たしかめた者は おらんがのう。']] });
  folk({ size: 'normal', outfit: 'guard', hat: 'helm', hair: 'swept', head: { hair: '#5a3a2e', eye: '#3a6a9a', eyes: 'big', mouth: 'smile' }, colors: { tunic: '#c83a34', metal: '#d8d4cc', scarf: '#3a7a88' } }, 1.4, -22.6, PI * .7,
    { name: '見習い騎士', lines: [['ぼくは 城の 見習い騎士。', 'きょうは 町の 見回りの れんしゅうなんだ。'], ['この 石段、ぜんぶで 二十だん ある。', 'まいにち のぼりおりして、足を きたえているよ。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'straw', hair: 'center', head: { hair: '#4a3a2a', eye: '#6a4a8a', mouth: 'smile', blush: true }, colors: { tunic: '#6a8a5a', apron: '#f8f4ec' } }, -31.6, -21.4, .2,
    { name: '花そだての むすめ', lines: [['霧の 水を あびた 花は、色が こくなるの。', '朝のうちに 水やりを すませなきゃ。'], ['ブリキの おもちゃの町の 人が、花の たねを 買いに 来たことが あるわ。', 'ねじで 動く じょうろを くれたの。']] });
  const cat = R.cat({ c: '#f0e8dc', belly: '#ffffff' }); cat.position.set(-8.4, -4.5, -6.2); cat.rotation.y = 2.2; scene.add(cat);
  G.npc(cat, { name: 'しろいねこ', r: .2, head: .25, lines: ['にゃあ。', '……（しっぽで 石がきを たたいている）', 'にゃ？'], idle: t => R.catPose(cat, 'sit', t) });
  const birds = [0, 1, 2, 3, 4].map(() => { const b = R.bird({ c: '#f8f4f0', belly: '#ffffff', neck: false, s: 1.5 }); scene.add(b); return b; });

  // ---- はじめの場所：上の通りの まん中、石段の上から、霧の向こうの城を見る ----
  G.spawn(.2, -2.9, PI - .2);
  G.tour([[0, -6.2], [0, -12.6], [4, -16.4], [2.2, -18.4], [2.8, -20.4], [9.6, -20.4], [11.6, -27.4], [4, -29.2], [11.6, -27.4], [10.2, -21], [2.6, -20.4], [2.4, -17.4], [0, -12.6], [0, -5.5], [-1.2, -2.2], [-20, -2.2], [-1, -2.6]]);
  const fx = K.fx(scene, 60); let sm = 0;
  G.tick((t, dt, P) => {
    birds.forEach((b, k) => { const a = t * (.18 + k * .03) + k * 1.3, r = 10 + k * 4; b.position.set(6 + Math.cos(a) * r, 5 + k * 1.4 + Math.sin(t * .6 + k), -18 + Math.sin(a) * r * .6); b.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a) * .6); R.birdPose(b, 'fly', t * .45 + k); });
    ships[0].position.set(-150 + ((t * 3.2 + 150) % 340), -7, -84); ships[0].rotation.y = PI / 2;
    ships[1].position.set(170 - ((t * 2.4 + 60) % 360), -4, -150); ships[1].rotation.y = -PI / 2;
    farShip.position.set(-200 + ((t * 2 + 160) % 420), 26, -330);
    mist.tick(t, G.cam); F.tick(t);
    if ((sm += dt) > .45) { sm = 0; for (const s of smokeAt) if (Math.hypot(s[0] - P.x, s[2] - P.z) < 50) fx.emit('smoke', s[0], s[1], s[2], { size: .5, life: 3.4, vy: .6, vx: .35, grow: 1.6, spread: .1, tint: '#fff2ee' }); }
    fx.update(dt); });
});
