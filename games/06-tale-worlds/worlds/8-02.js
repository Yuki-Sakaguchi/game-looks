// ワールド 8-02「飛空艇の発着場」。もとは game-looks-8/02-airship-dock.html（見るだけの場面）。
// 雲海の上につき出た朝の高台から、木と鉄の桟橋が空へのび、生成りの気のうに赤い帯の飛空艇がとまっている。
// ゲームにするために足した物：がけのふちの柵と見えないかべ、桟橋と飛空艇の甲板の足場（落ちても はじめに戻るだけ）、雲海を見下ろす見張り台、話せる発着場の人 9 人、しらべられる物 4 つ。
TALE_WORLD('8-02', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), { hash } = K;
  scene.add(R.skyDome([[0, '#3a6cb4'], [.5, '#6aa4d8'], [.8, '#a4c8e6'], [.93, '#eec4a8'], [1, '#ffd2a0']], { r: 520 })); scene.fog = new THREE.Fog('#f0c8a2', 80, 360);
  K.lights(scene, G.renderer, { sky: 0xb8d0ff, ground: 0xd8b898, amb: 1.5, sun: 0xffd8a8, power: 2.6, range: 34, pos: [-37, 25, -30] });
  const SUN = new THREE.Vector3(-.62, .42, -.5).normalize();

  // ---- 高台（草と石だたみ。まわりは がけ）と、下の雲海。桟橋の上は 板の高さ PY ----
  const EDGE = -5, PY = .35, PE = -31.5, isle = (x, z) => Math.max(EDGE - z, Math.hypot(x / 34, (z - 16) / 24) * 24 - 24);   // 正なら がけの外
  const HL = (x, z) => { const k = isle(x, z); return k > 0 ? -Math.min(34, k * 16) : 0; };
  const H = (x, z) => (Math.abs(x) < 2.7 && z < EDGE + .6 && z > PE) ? PY : HL(x, z);   // 桟橋の上は板の高さ。それ以外は高台とがけ
  const land = R.ground({ w: 90, d: 70, cell: 2, cz: 14, H: HL, layers: [T.grass({ c: '#6aa852', flowers: .25 }), T.cobble({ c: '#a89c8c' }), T.rock({ c: '#8a8078' })],
    mix: (x, z) => [Math.abs(x) < 7 && z < 13 ? 1 : Math.hypot(x, z - 16) < 6 ? 1 : 0, isle(x, z) > -.6 ? 1 : 0] }); scene.add(land.mesh);
  const sea = R.ground({ w: 640, d: 640, cell: 16, cz: -80, H: (x, z) => -30 + Math.sin(x * .05) * Math.cos(z * .043) * 3 + Math.sin(x * .13 + z * .09) * 1.3, layers: [T.snow({ c: '#f0d8c4', m: 40 })], shade: (x, z) => { const k = .5 + .5 * Math.sin(x * .05) * Math.cos(z * .043); return [.8 + .2 * k, .74 + .2 * k, .8 + .14 * k]; } }); sea.mesh.receiveShadow = false; scene.add(sea.mesh);
  scene.add(R.backdrop({ c: '#6a78ac', haze: '#f0bca0', r: 420, h: 110, y: -30, rep: 3 }));
  for (let i = 0; i < 14; i++) { const c = R.cloud({ s: 50 + hash(i, 8) * 50, c: '#fbe8d4', shade: '#d8a4a4', seed: i }), a = i * .45 + 2.2, r = 150 + hash(i, 4) * 120; c.position.set(Math.cos(a) * r, -20 + hash(i, 9) * 22 + (i % 4 === 0 ? 60 : 0), Math.sin(a) * r - 30); c.lookAt(0, c.position.y, -10); scene.add(c); }
  const sunD = new THREE.Mesh(new THREE.CircleGeometry(13, 20), new THREE.MeshBasicMaterial({ color: '#fff2c4', fog: false })); sunD.position.set(SUN.x * 440, 46, SUN.z * 440); sunD.lookAt(0, 20, 0); scene.add(sunD);
  G.ground(H); G.bounds(-30, 30, PE + .2, 39);

  // がけのふち：高台のまわりに 見えないかべ（がけの手前で止まる）。前のふちは 柵が見えている
  { const pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, s = 22.6 / 24; pts.push([Math.cos(a) * 34 * s, 16 + Math.sin(a) * 24 * s]); }
    for (let i = 0; i < 64; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1]; if (Math.max(z0, z1) < EDGE + 1.2) continue; const L = Math.hypot(x1 - x0, z1 - z0); G.box((x0 + x1) / 2, (z0 + z1) / 2, L + .3, .4, -40, 9, Math.atan2(-(z1 - z0), x1 - x0), true); } }
  for (const sx of [-1, 1]) G.box(sx * 10.65, EDGE + .9, 15.9, .3, -40, 9, 0, true);   // 前のふちの柵（桟橋の入口だけ あいている）

  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  // ---- 桟橋・飛空艇・わたり板・もやい綱 ----
  put(F.pier({ len: 28, w: 5.4, h: PY, drop: 16, c: '#a07a4c' }), 0, -17.5, 0, 0, 'none');
  const ship = F.airship({ s: 1.5, c: '#eee0bc', c2: '#c8503c' }); ship.position.set(6.1, PY - 1.45, -17); ship.rotation.y = Math.PI; scene.add(ship);
  const DY = PY - 1.45 + ship.userData.deck;   // 甲板の高さ
  G.box(6.1, -17.2, 3.2, 10.6, -40, DY); G.box(3.5, -15.4, 2.2, 1.4, -40, (PY + DY) / 2);   // 甲板と わたり板（足場）
  G.box(6.1, -13.6, 2.7, 2.7, -40, 9, 0, true);   // 船室
  G.box(8.05, -17.4, .3, 11.4, DY - .2, DY + .55, 0, true); G.box(4.15, -19.55, .3, 6.7, DY - .2, DY + .55, 0, true);   // 船べり（わたり板の所だけ あいている）
  G.box(6.1, -23, 3, .3, DY - .2, DY + .55, 0, true);   // とも
  { const g = R.geo(), y = PY + .03, z = -15.4; g.quad([2.5, y, z + .7], [4.4, y + .3, z + .7], [4.4, y + .3, z - .7], [2.5, y, z - .7], [0, 0, 1, .9]); fixed.push(g.mesh(T.planks({ c: '#b89464', w: 8 }), { side: true }));   // わたり板
    const Rp = R.geo(); for (const [z0, z1] of [[-8, -11.5], [-25.6, -22.6]]) Rp.quad([2.45, PY + .5, z0 - .05], [2.45, PY + .5, z0 + .05], [4.3, PY + 1.25, z1 + .05], [4.3, PY + 1.25, z1 - .05], [0, 0, 1, 10]).quad([2.4, PY + .5, z0], [2.5, PY + .5, z0], [4.35, PY + 1.25, z1], [4.25, PY + 1.25, z1], [0, 0, 1, 10]); fixed.push(Rp.mesh(F.tex.rope(), { side: true })); }   // もやい綱
  for (const z of [-8, -25.6]) put(R.barrel({ h: .7, r: .17, c: '#5a4a40' }), 2.35, z, 0, PY, 'round');
  [[-2.1, -7, 0], [-2.1, -13.4, 1], [-2.2, -20, 2], [-2.1, -26.5, 0], [1.9, -3.6, 1], [-1.6, -29.6, 3]].forEach(([x, z, k], i) => {
    if (k === 0) { put(R.crate({ s: .8 }), x, z, .2, PY); put(R.crate({ s: .55, kind: 'x', c: '#8a9a6a' }), x + .05, z, .7, PY + .8); }
    if (k === 1) { put(R.barrel(), x, z, i, PY, 'round'); put(R.barrel({ h: .8, r: .32 }), x + .1, z - .8, 1, PY, 'round'); }
    if (k === 2) { put(R.crate({ s: .7, kind: 'x' }), x, z, 1.2, PY); put(R.crate({ s: .7, c: '#9a8a6a' }), x, z - .85, .1, PY); }
    if (k === 3) put(F.vane({ h: 2.6 }), x, z, 0, PY, 'trunk', { r: .15 }); });
  for (const z of [-4.5, -17.5, -30.5]) put(R.lamp({ h: 2.8 }), -2.45, z, 0, PY, 'trunk', { r: .15 });
  // 足した：桟橋の先の 低い手すり（雲海をのぞきこむ所）
  put(R.fence({ len: 5, kind: 'rail' }), 0, PE + .25, 0, PY, 'none'); G.box(0, PE + .25, 5.4, .3, -40, 9, 0, true);

  // ---- 高台の上：発着場の小屋・旗・荷馬車・荷・柵・木 ----
  put(R.house({ w: 6.4, d: 5.2, h: 3, wall: T.boards({ c: '#a8845a' }), roof: T.roof({ kind: 'slate', c: '#b8503c' }), base: T.stone(), win: T.window({ shutters: 1 }), sign: T.sign({ kind: 'star' }), chimney: true }), -10.5, 5.5, .5, 0, 'none');
  G.box(-10.5, 5.5, 6.7, 5.5, -1, 9, .5, true);
  put(F.flag({ kind: 'banner', c: '#c8503c', crest: 'wave', pole: 4.2 }), -4.2, 1.2, .3, 0, 'trunk', { r: .12 }); put(F.flag({ c: '#f0e8d4', c2: '#c8503c', crest: 'anchor', cc: '#34507a', pole: 5 }), 4.4, 1.6, -1.2, 0, 'trunk', { r: .12 });
  put(F.wagon({ load: 'crates', cover: '#e8dcc0' }), 5.6, 7.5, -2.6, 0, 'wall'); put(R.crate(), 3.8, 3, .3); put(R.crate({ s: .6, kind: 'x', c: '#8a9a6a' }), 3.8, 3, .8, .8); put(R.barrel(), 4.8, 3.4, 0, 0, 'round');
  for (const x of [-15.6, -10.6, -5.6, 5.6, 10.6, 15.6]) put(R.fence({ len: 5, kind: 'rail' }), x, EDGE + .9, 0, 0, 'none');
  for (let i = 0; i < 14; i++) { const a = hash(i, 1) * 6.283, r = 10 + hash(i, 2) * 12, x = Math.cos(a) * r * 1.3, z = 16 + Math.sin(a) * r; if (isle(x, z) > -3 || (Math.abs(x) < 8 && z < 14)) continue; if (i % 3) put(R.tree({ kind: i % 2 ? 'pine' : 'round', h: 4.5 + hash(i, 3) * 3, seed: i }), x, z, i, 0, 'trunk'); else put(R.rock({ s: 1 + hash(i, 5), seed: i }), x, z, i, 0, 'round', { pad: .7 }); }
  for (let i = 0; i < 20; i++) { const x = (hash(i, 6) - .5) * 40, z = -3 + hash(i, 7) * 18; if (Math.abs(x) > 7.5) put(R.tuft({ kind: ['grass', 'flower', 'bush'][i % 3], s: .6 + hash(i, 5) * .4, seed: i % 3 }), x, z, i, 0, 'none'); }
  // 足した：小屋の前の ベンチと荷の山、花のはち
  put(R.bench(), -6.4, 9.6, -2.2); put(R.crate({ s: .8, kind: 'x' }), -6.2, 2.4, .4); put(R.crate({ s: .8 }), -6.9, 3.2, .1); put(R.crate({ s: .6, c: '#9a8a6a' }), -6.5, 2.8, .7, .8);
  for (const [x, z] of [[-7.6, 7.1], [-13.2, 2.6]]) { put(R.barrel({ h: .5, r: .34, c: '#9a6a44' }), x, z, 0, 0, 'round'); put(R.tree({ kind: 'bush', h: .7, flowers: .8, fc: ['#e8505a', '#f2d24a', '#ffffff'], seed: x }), x, z, 0, .45, 'none'); }
  // 足した：雲海を見下ろす 見張り台（板の段を 4 つのぼる。上に 望遠鏡の人）
  { const pl = T.planks({ c: '#9a7448', w: 8 }), g2 = R.geo(), z0 = -2.4, x0 = -6.6;
    [.38, .76, 1.14, 1.52].forEach((h, k) => { g2.box(1, h, 1.4, -k, 0, 0, { m: 1.5 }); G.box(x0 - k, z0, 1, 1.4, -9, h, 0); });
    g2.box(3.6, 1.52, 3, -5.3, 0, -.1, { m: 1.5 }); G.box(x0 - 5.3, z0 - .1, 3.6, 3, -9, 1.52, 0); const me = g2.mesh(pl); me.position.set(x0, 0, z0); fixed.push(me);
    put(R.fence({ len: 3.6, kind: 'rail' }), x0 - 5.3, z0 - 1.55, 0, 1.52, 'none'); put(R.fence({ len: 3, kind: 'rail' }), x0 - 7.05, z0 - .1, Math.PI / 2, 1.52, 'none');
    G.box(x0 - 5.3, z0 - 1.55, 3.6, .2, 1.3, 3, 0, true); G.box(x0 - 7.05, z0 - .1, .2, 3, 1.3, 3, 0, true);
    G.sign(x0 - 5.3, 1.52, z0 - 1.3, { name: '見張り台', lines: [['足もとは、どこまでも つづく 雲の海。', '朝の光で、雲が もも色に そまっている。']] }); }
  scene.add(R.merge(fixed));
  const far = F.airship({ s: .8, c: '#dce8ec', c2: '#3a6aa8', bob: 0 }); far.rotation.y = Math.PI / 2; scene.add(far);   // 遠くを行く船

  // ---- しらべる物 ----
  G.sign(-1.6, PY + .6, -28.9, { name: '風見', lines: [['矢は 西を さしている。', '今日は 船が よく進む 風だ。']] });
  G.sign(-7.6, 1.2, 3.4, { name: '発着場の掲示板', lines: [['「朝の便：雲の町ゆき」', '「昼の便：運休（風のため）」'], ['すみに 小さな字で 書いてある。', '「わすれもの：赤いはちまき 1 本」']] });
  G.sign(3.3, PY + .7, -15.4, { name: '飛空艇', lines: [['生成りの気のうに、赤い帯。', 'プロペラが ゆっくり 回っている。'], ['船べりに 名前が ほってある。', '「あさつゆ号」']] });

  // ---- 発着場の人（TL.person。主人公と同じ 4.5 頭身の作り） ----
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y) => { const p = TL.person(o); p.position.set(x, y ?? H(x, z), z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const line = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'tall', hat: 'cap', hatC: '#34507a', hair: 'center', head: { hair: '#e8e0d0', eye: '#8a5aa8', eyes: 'small', mouth: 'line' }, colors: C('#34507a', '#e8c058', '#eae4d4', '#c8503c', { glove: '#f0ece0', boot: '#4a3a34' }) }, 1.9, -13.6, -1.2,
    { name: '飛空艇の船長', lines: [['あさつゆ号へ ようこそ。', '風が よければ、昼までに 雲の町へ つく。'], ['空の上では、雲の流れを 読むのが 大事だ。', '鳥が 低く飛ぶ日は、出ないほうがいい。'], 'わたり板から 足を すべらせるなよ。\n下は ずっと 雲だ。'] });
  const porter = [
    folk({ size: 'tall', outfit: 'worker', hat: 'kerchief', hatC: '#8a5a3a', hair: 'wolf', bulk: 1.12, head: { hair: '#5a4a3a', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'line', beard: 'stubble' }, colors: { linen: '#e8dcc0', pants: '#5a5a48', scarf: '#8a5a3a' } }, 1.7, 4, Math.PI,
      { name: '荷運びの男', path: line([[1.7, 4], [1.7, -14.4], [.6, -14.6], [.6, 4]]), speed: 1.1, lines: [['よいしょ、っと。', '次の便の荷は、まだまだ あるぞ。'], '箱の中身？ 雲の町へ とどける 小麦粉さ。'] }),
    folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#4a7a8a', hair: 'swept', head: { hair: '#c8843a', eye: '#4a6a9a', mouth: 'smile', blush: true }, colors: { linen: '#f4ecd0', pants: '#4a7a8a', boot: '#7a4a2a' } }, .4, -6, 0,
      { name: '荷運びの娘', path: line([[.6, -14.6], [.6, 4], [1.7, 4], [1.7, -14.4]]), speed: 1.2, u: .3, lines: [['船長さんは こわそうだけど、\nやさしいのよ。', 'わたしも いつか 船に乗りたいな。'], ['北の 樹の上の町には、\n木と木を つなぐ つり橋が あるんだって。', '一度 わたってみたい！']] })];
  folk({ size: 'small', hat: 'straw', hair: 'center', head: { hair: '#8a8a8a', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'mustache' }, colors: C('#7a8a5a', '#e8e0c8', '#5a4a3a', '#c8a040') }, 2.6, 3.9, -2.4,
    { name: '発着場の番人', lines: [['ようこそ、空の玄関へ。', 'わしは ここで 四十年、船を 見送ってきた。'], ['むかしは 城下町と ここを、\n船が 一日に 十度も 行き来したものじゃ。'], 'がけのふちには 近よりすぎんようにな。'] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#c8503c', hair: 'center', head: { hair: '#5a3a2a', eye: '#6a4a2a', mouth: 'smile' }, colors: { tunic: '#6a7a9a', apron: '#f4ecdc' } }, -7.6, 6.4, .5 + Math.PI / 2,
    { name: '切符売りの人', lines: [['雲の町ゆきは、朝の便だけよ。', '昼の便は 風が強くて お休み。'], 'お茶でも 飲んで、待っていく？'] });
  folk({ size: 'child', outfit: 'worker', hat: 'cap', hatC: '#c8503c', hair: 'wolf', head: { hair: '#2a3a5a', eye: '#3a7aa8', mouth: 'open' }, colors: { pants: '#3a5a8a', linen: '#f0e6cc' } }, -.9, -9.5, -.6,
    { name: '見物の子', lines: [['うわあ、飛空艇って 大きいなあ！', 'プロペラの音、聞こえる？'], ['見張り台に のぼると、\n雲の海が ぜんぶ 見えるよ。', '小屋の ちかくの 段から のぼれるんだ。']] });
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#5a4a3a', hair: 'swept', head: { hair: '#3a2a22', eye: '#5a6a4a', eyes: 'small', mouth: 'line' }, colors: { linen: '#c8bca0', pants: '#4a4a52', scarf: '#c8503c' } }, 6.4, -19.6, Math.PI / 2,
    { name: '見習いの整備士', lines: [['プロペラの じくに、油を さしているんだ。', 'きしむ音が したら、\n空の上で こまるからね。'], '船の上は ゆれるから、\n気をつけて歩いてね。'] }, DY);
  folk({ size: 'normal', hair: 'center', head: { hair: '#d8b060', eye: '#3a7ac8', mouth: 'smile' }, colors: C('#3a8a6a', '#a8553a', '#5a4a3c', '#e0c040') }, -.8, -29.6, Math.PI,
    { name: '雲を見る旅人', lines: [['雲の下には、何が あるんだろうね。', '海だという人も、森だという人もいる。'], ['南の 塩の湖では、\n空が 足もとに うつるそうだ。', 'いつか 見てみたい。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'hood', hatC: '#5a4a7a', hold: 'staff', hair: 'center', head: { hair: '#c8c8d0', eye: '#6a5aa8', eyes: 'small', mouth: 'line' }, colors: { tunic: '#5a4a7a', trim: '#e8d8a0' } }, -11.9, -2.4, Math.PI,
    { name: '空読みの学者', lines: [['風と 雲の 形を、\n毎朝 書きとめておるのじゃ。'], ['星を見る塔の 天文の先生とは、\n手紙の なかまでな。', '夜の空と 朝の空、\nどちらも ふしぎなものよ。']] }, 1.52);
  const birds = [0, 1, 2, 3].map(() => { const b = R.bird({ c: '#f4f0e8', belly: '#ffffff', neck: false, s: 1.6 }); scene.add(b); return b; });

  // ---- 毎コマ：旗・プロペラ・遠くの船・かもめ・けむり。荷運びの人は 箱をかかえる ----
  const fx = K.fx(scene, 40); let sm = 0;
  G.spawn(-1.6, 8, Math.PI - .22); G.tour([[-.9, 4], [-.9, -9], [-.9, -26], [.6, -29.5], [1.2, -20], [1.4, -15.4], [3.8, -15.4], [6.1, -17.5], [6.1, -21.5], [6, -16], [3, -15.4], [1.1, -6], [-4, -1], [-6.6, -2.4], [-10.5, -2.6], [-6, -2.4], [0, 6]]);
  G.tick((t, dt, P) => {
    for (const n of porter) if (!n.talk) F.carryPose(n.o);
    birds.forEach((b, i) => { const a = t * (.22 + i * .03) + i * 1.7, r = 14 + i * 5; b.position.set(-10 + Math.cos(a) * r, 7 + i * 1.6 + Math.sin(t * .7 + i) * 1.2, -24 + Math.sin(a) * r * .7); b.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a) * .7); R.birdPose(b, 'fly', t * .45 + i); });
    far.position.set(-90 + ((t * 2.2 + 40) % 200), 16, -120);
    F.tick(t); if ((sm += dt) > .5) { sm = 0; fx.emit('smoke', -12.4, 6.2, 5.4, { size: .5, life: 3.2, vy: .8, vx: .5, grow: 1.5, spread: .12, tint: '#fff0e0' }); }
    fx.update(dt); });
});
