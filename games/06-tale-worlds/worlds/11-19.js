// ワールド 11-19「がけの家々」。もとは game-looks-11/19-cliff-dwelling-village.html（見るだけの場面）。
// 夕方の赤いがけの村。段になったがけに土の家々がはりつき、板の通路と はしごでつながる。谷の切れ目の向こうへ つり橋、洗たく物、やぎ。
// ゲームにするために足した物：板の通路（手すりの当たり判定）、1 段め→2 段めへの 土の階段、のぼれる はしご（前を向いて歩くと のぼる）、
// 平らな屋根の上に乗れる家、屋根へかけた はしご、通路のはしの柵と岩、話せる人 9 人と やぎ、しらべられる物 3 つ。
TALE_WORLD('11-19', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), FW = PACK_FWILD(THREE, K, R), SD = PACK_SAND2(THREE, K, R), { hash } = K, PI = Math.PI;
  scene.add(R.skyDome([[0, '#3a3a78'], [.45, '#8a5a90'], [.75, '#e07a5a'], [.92, '#f8b070'], [1, '#ffe0a0']], { r: 400 })); scene.fog = new THREE.Fog('#c88070', 50, 230);
  K.lights(scene, G.renderer, { sky: 0xd8a8c8, ground: 0x7a4a48, amb: 1.4, sun: 0xffa868, power: 2.3, range: 34, pos: [-45, 18, 35] });

  // ---- 段になったがけ：谷の底（y=0）→ 1 段め（y=6）→ 2 段め（y=11）→ 高いがけ。x<-31 は 谷の切れ目（もとのまま） ----
  const sm = (a, b, v) => { const k = Math.max(0, Math.min(1, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
  const Y1 = 6, Y2 = 11, GAP = [-31, -41], inGap = x => x < GAP[0] && x > GAP[1];
  const H = (x, z) => { if (inGap(x) && z < 2) return -2 + sm(-24, -40, z) * 30; const t1 = sm(-1.6, -2.2, z) * Y1, t2 = sm(-8.6, -9.2, z) * (Y2 - Y1), t3 = sm(-15.6, -16.6, z) * 18; return t1 + t2 + t3 + Math.sin(x * .3) * .1; };
  const land = R.ground({ w: 140, d: 70, cell: 1, cz: -10, H, layers: [T.dirt({ c: '#b0684a', pebbles: .4 }), T.grass({ c: '#8a8a4a', flowers: .1, fc: ['#f0d070', '#ffffff'] }), T.cobble({ kind: 'slab', c: '#a8705a' })],
    mix: (x, z) => [z > 2 || (z < -16.6) ? .8 : 0, (z < -2.6 && z > -8.2) || (z < -9.6 && z > -15.4) ? .6 : 0] }); scene.add(land.mesh);
  // 歩くための地面は、段のさかいを まっすぐな段にする（見た目の坂は がけの絵がかくす）。2 段めは がけのふち z=-8.5 から
  const H2 = (x, z) => inGap(x) && z < 2 ? H(x, z) : (z < -2.1 ? Y1 : 0) + (z < -8.5 ? Y2 - Y1 : 0) + (z < -15.8 ? 18 : 0) + Math.sin(x * .3) * .1;
  G.ground(H2); G.bounds(-30.2, 29.4, -15.2, -.45);
  const fixed = [], put = (o, x, z, ry = 0, y = H(x, z), kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const CL = F.tex.sandstone({ c: '#b8583a' }), CL2 = F.tex.sandstone({ c: '#c86a44', seed: 2 });
  for (let k = 0; k < 7; k++) { const x = 30 - k * 9.2; if (inGap(x)) continue; put(FW.cliff({ w: 10, h: Y1 + .3, d: 1.4, lean: .04, seed: k, tex: CL }), x, -1.4, 0, -.2); put(FW.cliff({ w: 10, h: Y2 - Y1 + .3, d: 1.2, lean: .04, seed: k + 9, tex: CL2 }), x, -8.4, 0, Y1 - .2); put(FW.cliff({ w: 10, h: 22, d: 2, lean: .1, seed: k + 19, tex: CL }), x, -15.6, 0, Y2 - .2); }
  for (let k = 0; k < 6; k++) put(FW.cliff({ w: 12, h: 30, d: 2, lean: .12, seed: k + 30, tex: CL2 }), -46 - k * 11, -2 - (k % 2) * 3, 0, -2);
  put(FW.cliff({ w: 12, h: 30, d: 2, lean: .1, seed: 41, tex: CL }), GAP[0] + 1, -12, -PI / 2, -2);
  // 足した：谷の向こうがわの がけ（通路から谷を見ても、地面のはしが見えないように）
  for (let k = 0; k < 10; k++) put(FW.cliff({ w: 20, h: 22 + hash(k, 12) * 12, d: 3, lean: .1, seed: k + 50, tex: k % 2 ? CL : CL2, top: T.dirt({ c: '#b0684a' }) }), -84 + k * 19, 24 + (k % 2) * 2, PI, -1);
  // がけの面は のぼれない かべ（はしごと階段だけで上がる）。谷の切れ目がわの がけも かべ
  G.box(0, -8.62, 64, .12, -9, Y2 - .3, 0, true); G.box(0, -16.1, 64, 1.1, -9, 60, 0, true); G.box(-29.6, -12, 2.4, 12, -9, 60, 0, true);

  // ---- 土の家（平らな屋根）。1 段めと 2 段めと、谷の向こう。屋根の上には乗れる ----
  const ADOBE = ['#d88a5a', '#e0a070', '#c87850'].map((c, i) => T.plaster({ frame: 'none', c, seed: i })), ROOF = T.plaster({ frame: 'none', c: '#b87048' });
  const winL = T.window({ h: 32, bars: 'cross', lit: 1, curtain: '#ffd080', frame: '#6a3a28' }), winD = T.window({ h: 32, bars: 'cross', curtain: '#3a6aa8', frame: '#6a3a28' }), DOOR = T.door({ style: 'plank', c: '#6a4430' });
  const home = (i, w = 4, h = 2.8) => R.house({ w, d: 3.6, h, roofKind: 'flat', wall: ADOBE[i % 3], roof: ROOF, win: winD, winLit: winL, lit: .6, door: DOOR, wins: { f: 1, b: 0, l: 1, r: 1 }, chimney: i % 3 === 0, seed: i });
  const homeSolid = (i, x, z, y, w, h) => { G.box(x, z - .125, w + .3, 4.15, y - 1, y + h + .25); if (i % 3 === 0) G.circle(x + w * .24, z - .65, .4, y, y + h + 1); };
  const HOMES = [], TOPS = {};
  for (let i = 0; i < 8; i++) { const x = 24 - i * 7.2 + hash(i, 1) * 1.5, w = 4 + hash(i, 2) * 1.4, h = 2.6 + hash(i, 3) * .8; if (x < GAP[0] + 2) continue; HOMES.push(put(home(i, w, h), x, -6.2, 0, Y1)); homeSolid(i, x, -6.2, Y1, w, h); TOPS['a' + i] = [x, Y1 + h + .25]; }
  for (let i = 0; i < 7; i++) { const x = 20 - i * 7.8 + hash(i, 4) * 2, w = 4 + hash(i, 5), h = 2.8 + hash(i, 6) * 1.2; if (x < GAP[0] + 2) continue; put(home(i + 3, w, h), x, -13.2, 0, Y2); homeSolid(i + 3, x, -13.2, Y2, w, h); TOPS['b' + i] = [x, Y2 + h + .25]; }
  for (let i = 0; i < 5; i++) put(home(i + 7, 4, 3), -48 - i * 8, 1.5 + (i % 2), 0, 4 + i * 2.2);
  // 板の通路（1 段めのふち。がけから はり出し、下に つっかい棒）と、外がわの手すり。手すりは こえられない かべ
  { const B = R.parts(), Pl = B.g(T.planks({ c: '#8a5a38', w: 8 })), Rl = B.g(F.tex.rail({ kind: 'wood' }), { side: true }), x0 = GAP[0] + .4, x1 = 30, L = x1 - x0;
    Pl.box(L, .18, 1.8, (x0 + x1) / 2, Y1 - .18, -1.1, { m: 2 }); for (let x = x0 + 1; x < x1; x += 3) Pl.at(R.TR(x, Y1 - .2, -.4, 0, .55)).loft(4, [[-2.4, .08, .08, 0, .8], [0, .08, .08, 1]], {}).at(null);
    Rl.quad([x0, Y1, -.2], [x1, Y1, -.2], [x1, Y1 + .9, -.2], [x0, Y1 + .9, -.2], [0, 0, L, 1]);
    Rl.quad([x0, Y1, -6], [x0, Y1, -.2], [x0, Y1 + .9, -.2], [x0, Y1 + .9, -6], [0, 0, 5.8, 1]); fixed.push(B.group());
    G.box((x0 + x1) / 2, -1.35, L, 2.3, Y1 - 1, Y1); G.box((x0 + x1) / 2, -.2, L, .2, Y1 - 3, Y1 + 1.3, 0, true); G.box(x0, -3.1, .2, 6, Y1 - 3, Y1 + 1.3, 0, true);
    G.sign(x0 + .6, Y1 + .9, -1.4, { name: '通路の西のはし', lines: [['谷の切れ目の向こうにも、家が 段になって ならんでいる。', '夕日で、がけが もえるように 赤い。'], ['つり橋が 風で ゆれている。', '板が 何まいか はずれているようだ。']] }); }

  // ---- はしご（前を向いて歩きつづけると のぼる）。[x, z（はしごの前）, 下の高さ, 長さ] ----
  const LADS = [[16.5, -8.2, Y1, 5.6], [2.3, -8.2, Y1, 5.6], [-12.4, -8.2, Y1, 5.6], [9, -.6, -.1, 6.2], [-20, -.4, -.1, 6.2], [6, -15.2, Y2, 7], [-17, -15.2, Y2, 7]];
  LADS.forEach(([x, z, y, h]) => put(F.ladder({ h, w: .6 }), x, z, 0, y));
  const CLIMB = [[16.5, -8.56, Y1, Y2], [2.3, -8.56, Y1, Y2], [-12.4, -8.56, Y1, Y2]];
  // 足した：家と家のあいだの はしご（1 段め→2 段め）と、家の屋根へかけた はしご
  const addLad = (x, wallZ, y0, top) => { put(F.ladder({ h: top - y0 + .6, w: .6 }), x, wallZ + .12, 0, y0); CLIMB.push([x, wallZ, y0, top]); };
  addLad(7.1, -8.56, Y1, Y2); addLad(-7.3, -8.56, Y1, Y2);
  addLad(12.2, -4.25, Y1, TOPS.a2[1]); addLad(-16.4, -4.25, Y1, TOPS.a6[1]); addLad(-1.2, -11.25, Y2, TOPS.b3[1]);
  // ---- 足した：1 段め→2 段めへの 土の階段（家 0 と 家 1 のあいだ）。上に 小さなおどり場 ----
  { const n = 17, run = .35, z0 = -2.6, rise = (Y2 - Y1) / n, x0 = 21.2, Gs = R.geo();
    for (let k = 0; k < n; k++) { Gs.box(2.2, (k + 1) * rise, run, 0, 0, -(k + .5) * run, { m: 2 }); G.box(x0, z0 - (k + .5) * run, 2.2, run, -9, Y1 + (k + 1) * rise); }
    const me = Gs.mesh(ADOBE[1]); me.position.set(x0, Y1, z0); fixed.push(me); G.box(x0, -8.95, 2.2, 1.3, -9, Y2);
    const Rl = R.geo(); for (const sx of [-1, 1]) Rl.quad([sx * 1.1, 0, 0], [sx * 1.1, Y2 - Y1, -n * run], [sx * 1.1, Y2 - Y1 + .8, -n * run], [sx * 1.1, .8, 0], [0, 0, 5, 1]);
    const rm = Rl.mesh(F.tex.rail({ kind: 'wood' }), { side: true }); rm.position.set(x0, Y1, z0); fixed.push(rm); }
  // ---- 小物（もとの 4 つ＋足した物）。たる・木箱は のって ジャンプの足場にもなる ----
  put(R.barrel({ h: .8, r: .3, c: '#8a5a3a' }), 12, -3.2, 0, Y1, 'round'); put(R.crate({ s: .6, c: '#9a6a44' }), -4, -3, .3, Y1, 'box'); put(R.barrel({ h: .7, r: .28 }), -18, -3.4, 0, Y1, 'round'); put(R.crate({ s: .5, kind: 'x' }), 20, -10.4, .4, Y2, 'box');
  put(R.crate({ s: .8, c: '#9a6a44' }), -9.4, -3.6, .2, Y1, 'box'); put(R.crate({ s: .6, kind: 'x' }), -9.4, -3.6, .7, Y1 + .8, 'box'); put(R.barrel({ h: .9, r: .34, c: '#7a4a30' }), 8.6, -11, 0, Y2, 'round');
  put(R.barrel({ h: .6, r: .3, c: '#c07a50' }), 1.2, -3.8, 0, Y1, 'round'); put(R.barrel({ h: .6, r: .3, c: '#c07a50' }), 1.9, -3.4, 0, Y1, 'round');
  for (let i = 0; i < 14; i++) { const x = 30 - hash(i, 7) * 60; if (inGap(x)) continue; put(R.tuft({ kind: i % 2 ? 'bush' : 'grass', s: .8, seed: i % 3 }), x, -2.8 - hash(i, 8) * 1.2, i, Y1); }
  for (let i = 0; i < 16; i++) { const x = 34 - hash(i, 9) * 80, z = 4 + hash(i, 10) * 10; put(i % 3 ? R.rock({ s: .6 + hash(i, 11), c: '#9a5a44', seed: i }) : R.tree({ kind: 'bush', h: 1.6, c: '#6a7a3a', seed: i }), x, z, i); }
  // 東のはし：大きな岩と柵（ここから先は がけが切れている）
  for (const [z, y] of [[-4.6, Y1], [-12.2, Y2]]) { put(R.rock({ s: 3.2, c: '#9a5a44', seed: z }), 31.4, z, z, y); put(R.fence({ len: 6, kind: 'wood' }), 29.6, z, PI / 2, y); }
  G.sign(9, Y2 + 1.4, -15.3, { name: 'がけの絵', lines: [['がけに、やぎと 人と 太陽の絵が ほってある。', 'ずっと むかしの 村の人が ほったのだろう。']] });
  G.sign(8.6, Y2 + .8, -10.4, { name: '水がめ', lines: [['つめたい水が いっぱいに入っている。', '谷の底の いずみから、毎朝 くみあげるそうだ。']] });
  scene.add(R.merge(fixed));

  // ---- つり橋（2 段めから 谷の向こうへ。見るだけ）、洗たく物、けむり ----
  const bridge = F.ropeBridge({ from: [GAP[0] + .5, Y2, -11], to: [GAP[1] - 1, 12.4, -5], w: 1.2, sag: 1.4 }); scene.add(bridge);
  const CLOTH = ['#3a6ab0', '#f0ece0', '#c84a3a', '#f0d070', '#5a9a6a'].map((c, i) => T.fabric({ c, c2: '#f4ecd8', pattern: i % 2 ? 'stripe' : 'plain' }));
  const lines = [[8, 15], [-6, 0], [-22, -16]].map(([a, b], j) => { const g = new THREE.Group(), y = Y1 + 2.5, z = -3.6, rope = R.geo().quad([a, y, z], [b, y, z], [b, y + .03, z], [a, y + .03, z]).mesh(T.planks({ c: '#e8d8b8' }), { side: true }); g.add(rope); const cs = [];
    for (let k = 0; k < 5; k++) { const x = a + (b - a) * (k + .6) / 5.4, w = .5 + hash(k, j) * .3, h = .6 + hash(k, j + 3) * .4, m = R.geo().quad([-w / 2, -h, 0], [w / 2, -h, 0], [w / 2, 0, 0], [-w / 2, 0, 0]).mesh(CLOTH[(k + j) % 5], { side: true }); m.position.set(x, y - Math.sin((k + .6) / 5.4 * PI) * .2, z); g.add(m); cs.push(m); }
    scene.add(g); return cs; });
  G.sign(-.4, Y1 + 1.2, -3.7, { name: '洗たく物', lines: [['夕方の風で、青い布が はためいている。', 'お日さまの においがする。']] });
  const fx = K.fx(scene, 40);

  // ---- 村の人（TL.person。主人公と同じ 4.5 頭身の作り）。やぎ・つばめ ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const person = (o, x, y, z, ry) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return p; };
  const folk = (o, x, y, z, ry, d) => G.npc(person(o, x, y, z, ry), d);
  const loop = (pts, y) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, y, z)), true, 'centripetal');
  const washer = folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#c84a3a', hair: 'center', head: { hair: '#1a1418', skin: '#c8885a', mouth: 'smile', blush: true }, colors: { tunic: '#3a6ab0', apron: '#f0e8d8', scarf: '#c84a3a' } }, -3.4, Y1, -3.9, 0,
    { name: '洗たく物をほす おかみさん', idle: (t, o) => { R.idle(o, t, Math.sin(t * .5) * .3); o.userData.J.armR.rotation.x = -2.4 + Math.sin(t * 2) * .3; o.userData.J.armL.rotation.x = -2.2 - Math.sin(t * 2) * .3; },
      lines: [['夕方の風は よく かわくのよ。', 'あしたの朝には、ぱりっとしてるわ。'], ['上の段へは、家のあいだの はしごか、東の 土の階段で 行けるわよ。', 'はしごは、前を向いて 歩きつづければ のぼれるの。']] });
  const kid = folk({ size: 'child', hat: 'hood', hatC: '#e8b040', hair: 'swept', head: { hair: '#3a2420', skin: '#c8885a', mouth: 'open', blush: true }, colors: C('#e8b040', '#6a3a2a', '#6a3a2a', '#3a6ab0') }, 0, Y1, -1, 0,
    { name: 'かごを せおった子', path: loop([[18, -1.1], [-12, -1.1], [-12, -1.5], [18, -1.5]], Y1), speed: 1.6, lines: [['おばあちゃんに、あんずを とどけるの！', '……あっ、一つ 落としちゃった。'], ['家の 屋根の上は、村の子の あそび場なんだ。', 'はしごで のぼれるよ！']] });
  kid.flyY = Y1;
  folk({ size: 'small', outfit: 'robe', hold: 'staff', hair: 'center', head: { hair: '#e8e8e8', skin: '#b8784a', eyes: 'closed', brow: 'thick', mouth: 'line', beard: 'beard' }, colors: { tunic: '#8a4a3a', trim: '#f0d070' } }, -2.2, Y2, -10.3, .2,
    { name: '村長', lines: [['ようこそ、がけの村へ。', 'わしらは 千年前から、この がけに 家を ほって くらしておる。'], ['谷の切れ目の つり橋は、いま 板を はりかえておる。', 'なおったら、向こうの家にも 行けるじゃろう。'], ['西の 砂の谷には、目をとじた 巨大な像が すわっておるそうな。', 'わしも 若いころ 一度だけ 見たよ。']] });
  folk({ size: 'normal', outfit: 'worker', hat: 'straw', hair: 'wolf', head: { hair: '#2a2420', skin: '#b8784a', eyes: 'small', mouth: 'smile', beard: 'stubble' }, colors: { pants: '#5a4a3a', linen: '#e8d8b8', scarf: '#6a8a4a' } }, 22.6, Y2, -10.3, -1.2,
    { name: 'やぎ飼い', lines: [['うちの やぎは、がけのぼりの 名人さ。', 'いちばん上の がけの てっぺんにも 一ぴき いるだろ？'], 'やぎの ちちで作る チーズは、村の じまんだよ。'] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#f0d070', hair: 'swept', head: { hair: '#5a2a2a', skin: '#c8885a', eye: '#6a4a2a', mouth: 'smile' }, colors: { tunic: '#5a9a6a', apron: '#e8d8c0' } }, 0, Y2, 0, 0,
    { name: '水くみの むすめ', path: loop([[16, -10.1], [-20, -10.1], [-20, -10.7], [16, -10.7]], Y2), speed: .9, u: .4, lines: [['毎朝、谷の底まで 水を くみに おりるの。', '上がるときは、足が ぱんぱん！'], '夕焼けの時間が いちばん好き。がけが ぜんぶ 金色になるの。'] });
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#6a4a34', hair: 'wolf', bulk: 1.1, head: { hair: '#4a3428', skin: '#a8683a', eyes: 'small', brow: 'thick', mouth: 'line', beard: 'mustache' }, colors: { pants: '#5a4a3a', scarf: '#c84a3a', linen: '#d8c8a8' } }, -27.8, Y1, -3.6, -1.9,
    { name: '橋なおしの大工', lines: [['つり橋の板が 風で 何まいか 飛んでいってね。', 'いま 新しい板を 切っているところさ。'], ['向こうの家の人たちは、橋が なおるまで 谷の底を 回って 来るんだ。', '半日がかりさ。']] });
  folk({ size: 'normal', hat: 'straw', hair: 'swept', head: { hair: '#c8843a', skin: '#e8b890', eye: '#4a6a9a', mouth: 'smile' }, colors: C('#4a6a9a', '#c8682e', '#e8dcc0', '#f0d070') }, 26.2, Y1, -1.3, -PI / 2,
    { name: '旅人', lines: [['すごい村だろう？ 家が がけに はりついてる。', 'まるで つばめの巣みたいだ。'], ['この先には、蒸気で動く 時計塔の町が あるらしい。', '歯車が ぐるぐる 回っているんだって。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'kerchief', hatC: '#3a6ab0', hair: 'center', head: { hair: '#d8d8d8', skin: '#b8784a', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#c87850', trim: '#3a6ab0' } }, 4.4, Y1, -3.7, .3,
    { name: 'かご作りのおばあさん', lines: [['草を あんで、かごを 作っておるよ。', 'この村の子は、みんな わしの かごを せおっておる。'], 'あんずを 一つ あげよう。……ほら、あまいじゃろう？'] });
  { const [x, y] = TOPS.b3; folk({ size: 'normal', outfit: 'guard', hat: 'hood', hatC: '#8a4a3a', hold: 'spear', hair: 'wolf', head: { hair: '#2a2420', skin: '#b8784a', brow: 'angry', mouth: 'line' }, colors: { tunic: '#8a4a3a', metal: '#b89a6a', scarf: '#3a6ab0' } }, x + .8, y, -13.6, .4,
    { name: '屋根の上の見はり', lines: [['よく ここまで のぼってきたな。', 'ここからなら、谷の ずっと先まで 見える。'], ['砂あらしが 来たら、角笛で 村に 知らせるんだ。', '今日の空は おだやかだ。']] }); }
  // 足した：がけの上の はしごを のぼりおりする人（見るだけ）、つり橋をわたる人（見るだけ）
  const climber = person({ size: 'normal', outfit: 'worker', hat: 'kerchief', hatC: '#c84a3a', hair: 'wolf', head: { hair: '#2a2420', skin: '#b8784a', beard: 'mustache' }, colors: { pants: '#5a4a3a', linen: '#e8d8b8' } }, -17, Y2, -15.05, PI);
  const crosser = person({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#c84a3a', hair: 'swept', head: { hair: '#3a2a20', skin: '#b8784a' }, colors: { pants: '#4a4a5a', linen: '#f0e0c0' } }, 0, Y2, 0, 0);
  const goats = [['stand', 13.5, -2.9, Y1, -1.2], ['graze', 21, -10.6, Y2, .5], ['walk', 0, 0, Y2, 0], ['stand', -9, -17.3, 29, .4]].map(([pose, x, z, y, ry], i) => { const g = SD.goat({ c: ['#f0e8d8', '#6a4a3a', '#e8e0d0', '#3a3030'][i], seed: i }); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); return g; });
  G.npc(goats[0], { name: 'やぎ', r: .45, head: .9, lines: ['メェ〜。', '……もぐもぐ。', 'メェ？'], idle: t => SD.goatPose(goats[0], 'stand', t) });
  const swallows = [0, 1, 2, 3].map(i => { const b = R.bird({ c: '#2a2a3a', belly: '#f0e8e0', neck: false, s: 1.1 }); scene.add(b); return b; });

  // ---- はしごを のぼる：はしごの前で、がけ（-z）を向いて歩きつづけると上がる。上まで来るまでは はしごに くっつき、上まで来たら そのまま前へ ----
  const climbPose = (o, ph) => { const J = o.userData.J; J.armL.rotation.set(-2.6 + Math.sin(ph) * .4, 0, 0); J.armR.rotation.set(-2.6 - Math.sin(ph) * .4, 0, 0); J.legL.rotation.x = -.6 + Math.sin(ph) * .5; J.legR.rotation.x = -.6 - Math.sin(ph) * .5; J.shinL.rotation.x = J.shinR.rotation.x = .8; };
  let cph = 0;
  G.tick((t, dt, P) => { for (const [x, wz, y0, top] of CLIMB) if (Math.abs(P.x - x) < .45 && P.z > wz - .05 && P.z < wz + .8 && P.y > y0 - .3 && P.y < top + .1 && P.speed > .3 && Math.cos(P.ry) < -.6) {
    P.y = Math.min(top + .15, P.y + 2.6 * dt); P.vy = 0; P.ground = false; P.air = 0; if (P.y < top - .05) P.z = Math.max(P.z, wz + .31); cph += dt * 7; climbPose(G.hero, cph); G.hero.position.set(P.x, P.y, P.z); break; } });

  // ---- 毎コマ：はしごの人、つり橋の人、洗たく物、やぎ、つばめ、けむり ----
  G.spawn(24, -1.2, -PI / 2);
  G.tour([[16, -1.2], [21.2, -3.2], [21.2, -9.6], [14, -10.4], [7.6, -10.2], [4, -9.8], [4, -7.4], [-.25, -5.4], [-.25, -2], [-10, -1.2], [-7.3, -3], [-7.3, -10], [-14, -10.4], [-21.2, -9.6], [-21.3, -4], [-26, -1.2], [10, -1.2]]);
  G.tick(() => G.cam.rotateX(innerWidth < innerHeight ? .2 : .14));
  G.tick((t, dt, P) => {
    const cy = (Math.sin(t * .45) * .5 + .5) * 5.2; climber.position.y = Y2 + cy; climbPose(climber, t * 3.4);
    const k = (Math.sin(t * .18) * .5 + .5) * .96 + .02, bp = bridge.userData.at ? bridge.userData.at(k) : null; if (bp) { crosser.position.set(bp[0] ?? bp.x, (bp[1] ?? bp.y), bp[2] ?? bp.z); crosser.rotation.y = Math.cos(t * .18) > 0 ? -PI / 2 - .4 : PI / 2 - .4; R.walk(crosser, t * 4, .7); }
    lines.forEach((cs, j) => cs.forEach((m, i) => { m.rotation.x = Math.sin(t * 2.2 + i * .9 + j) * .25 - .15; m.rotation.y = Math.sin(t * 1.3 + i) * .15; }));
    { const g = goats[2], gx = 10 - ((t * .7) % 20); g.position.set(gx, Y2, -10.6 + Math.sin(gx * .4) * .3); g.rotation.y = -PI / 2; SD.goatPose(g, 'walk', t * 3.2); } SD.goatPose(goats[1], 'graze', t + 2); SD.goatPose(goats[3], 'stand', t + 6);
    swallows.forEach((b, i) => { const a = t * (.7 + i * .1) + i * 1.6, r = 5 + i * 1.5; b.position.set(P.x - 6 + Math.cos(a) * r, Y1 + 5 + Math.sin(t * 1.4 + i) * 1.5, -4 + Math.sin(a) * r * .5); b.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a) * .5); R.birdPose(b, 'fly', t * .9 + i); });
    if (Math.floor(t * 2.2) !== Math.floor((t - dt) * 2.2)) for (const hh of HOMES) if (hh.userData.chimney || hash(Math.round(hh.position.x), 3) > .6) fx.emit('smoke', hh.position.x + .8, Y1 + 3.6, -6.8, { size: .4, life: 3.5, vy: .5, vx: -.2, grow: 1.6, spread: .1, tint: '#e8d0c8' });
    F.tick(t); fx.update(dt); });
});
