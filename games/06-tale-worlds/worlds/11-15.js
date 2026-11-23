// ワールド 11-15「塩の湖の鏡」。もとは game-looks-11/15-salt-flat-mirror.html（見るだけの場面）。
// 夕方の塩の湖。白い塩の大地にうすく水がはり、藤色とだいだいの夕空が足もとまでそっくり映る。塩の結晶のふちが、六角形の白い網になって水から顔を出す。
// ゲームにするために足した物：歩ける はんいを しめす 目じるしの くいと綱、隊商の野営（荷馬車・たる・木箱）、のぼれる 塩のブロックの山、話せる人 8 人、しらべられる物 4 つ。
// 主人公と町の人にも、水の下に さかさの写しを付け、歩くと足もとに波紋が広がる。
TALE_WORLD('11-15', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), { hash } = K, PI = Math.PI;
  scene.fog = new THREE.Fog('#c8a0b8', 120, 500);
  K.lights(scene, G.renderer, { sky: 0xd8b8e8, ground: 0xe8c0b0, amb: 1.55, sun: 0xffb080, power: 2.2, range: 22, pos: [-7.2, 12, -58] });
  const SUN = new THREE.Vector3(-.12, .2, -.97).normalize();

  // ---- 空：上下に折り返した丸天井（地平線から上と下が同じ色の並び） ----
  let skyM = null; const SKY = [[0, '#3a3270'], [.3, '#5e4c94'], [.52, '#9a6eb0'], [.72, '#d888ac'], [.88, '#f8a878'], [1, '#ffd49a']];
  { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128); for (const [p, col] of SKY) g.addColorStop(p, col); x.fillStyle = g; x.fillRect(0, 0, 4, 128);
    const g2 = x.createLinearGradient(0, 256, 0, 128); for (const [p, col] of SKY) g2.addColorStop(p, col); x.fillStyle = g2; x.fillRect(0, 128, 4, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.SphereGeometry(440, 16, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; m.frustumCulled = false; scene.add(m); skyM = m; }
  const world = new THREE.Group(), near = new THREE.Group(); scene.add(world, near);   // 水の上の物（遠くは主人公について動く world、近くは止まった near。あとで さかさの写しを作る）
  const sunD = new THREE.Mesh(new THREE.CircleGeometry(18, 24), new THREE.MeshBasicMaterial({ color: '#fff0c0', fog: false })); sunD.position.set(SUN.x * 400, 30, SUN.z * 400); sunD.lookAt(0, 0, 0); world.add(sunD);
  world.add(R.backdrop({ c: '#7a5a8a', haze: '#f0a8a0', r: 360, h: 26, y: -1, rep: 3 }), R.backdrop({ c: '#9a6a98', haze: '#f8c0a0', r: 400, h: 40, y: -1, rep: 2, seed: 5 }));
  for (let i = 0; i < 12; i++) { const c = R.cloud({ s: 40 + hash(i, 8) * 40, c: i % 3 ? '#f8b8a0' : '#ffd0a8', shade: '#9a70a8', seed: i }), a = -PI / 2 + (i - 6) * .28 + (hash(i, 2) - .5) * .2, r = 300 + hash(i, 3) * 60; c.position.set(Math.cos(a) * r, 40 + hash(i, 4) * 70, Math.sin(a) * r); c.lookAt(0, 40, 0); world.add(c); }
  G.ground(() => 0); G.bounds(-40, 40, -96, 22);

  // ---- 塩の小山（まるい白い盛り土。上に乗れる）と、遠くの岩の島 ----
  const saltT = T.snow({ c: '#f4eee8' }), fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  for (let i = 0; i < 26; i++) { const a = hash(i, 1) * 6.28, r = 18 + hash(i, 2) * 120, s = .6 + hash(i, 3) * 1.2, x = Math.cos(a) * r, z = Math.sin(a) * r - 40; const m = R.geo().smooth(1).loft(7, [[-.1, 1.4 * s, 1.2 * s, 0, .9], [.25 * s, 1.05 * s, .9 * s, .5, 1], [.55 * s, .3 * s, .28 * s, 1, 1.06]], { cap: 'top', rot: i }).mesh(saltT); m.position.set(x, 0, z); fixed.push(m);
    if (Math.abs(x) < 42 && z > -98 && z < 24) G.circle(x, z, .95 * s, -1, .5 * s); }
  [[-70, -170, 9, 12], [95, -210, 14, 9], [-160, -120, 8, 16]].forEach(([x, z, h, r], i) => { const m = R.rock({ s: r, c: '#7a5a7a', seed: i + 3 }); m.scale.y = h / r; m.position.set(x, -.5, z); fixed.push(m); });

  // ---- 足した：目じるしの くいと綱（ここから先は 塩が うすくて あぶない）。3 本に 1 本、赤い小旗 ----
  { const wood = R.geo(), rope = R.geo(), pts = [], X0 = -40.6, X1 = 40.6, Z0 = -96.6, Z1 = 22.6;
    for (let x = X0; x < X1; x += 6) pts.push([x, Z1]); for (let z = Z1; z > Z0; z -= 6) pts.push([X1, z]); for (let x = X1; x > X0; x -= 6) pts.push([x, Z0]); for (let z = Z0; z < Z1; z += 6) pts.push([X0, z]);
    pts.forEach(([x, z], i) => { wood.at(R.TR(x, 0, z, i)).loft(5, [[-.2, .09, .09, 0, .8], [1.25, .07, .07, 1.5, 1]], { cap: 'top' }).at(null); const [x2, z2] = pts[(i + 1) % pts.length];
      rope.quad([x, .95, z], [x2, .85 + .1, z2], [x2, 1.0, z2], [x, 1.0, z], [0, 0, 6, 1]); if (i % 3 === 0) { const fl = F.flag({ kind: 'pennant', pole: 0, c: '#c8503c', crest: 'none', w: .7, h: .26 }); fl.position.set(x, 1.2, z); fl.rotation.y = i; fixed.push(fl); } });
    fixed.push(wood.mesh(T.planks({ c: '#6a4a3a' })), rope.mesh(F.tex.rope(), { side: true })); }
  // ---- 足した：隊商の野営（荷馬車・たる・木箱。木箱は のぼれる） ----
  put(F.wagon({ load: 'barrels', cover: '#e8d8c8' }), -11.5, -15, .9, 0, 'wall'); put(F.wagon({ load: 'crates', cover: '#c8b0d0' }), -15.5, -10.5, 2.2, 0, 'wall');
  put(R.barrel(), -9.2, -11.6, 0, 0, 'round'); put(R.barrel({ h: .8, r: .32 }), -8.6, -12.3, 1, 0, 'round'); put(R.crate({ s: .8 }), -13.4, -12.6, .3); put(R.crate({ s: .8, kind: 'x' }), -13.4, -12.6, .9, .8); put(R.crate({ s: .7, c: '#9a8a6a' }), -12.6, -12.1, .2);
  put(R.bench(), -10.6, -8.6, .4);
  // ---- 足した：塩のブロックの山（切り出した塩を 段に 積んである。てっぺんから 湖が 見わたせる） ----
  { const bt = T.stone({ c: '#ece6e0' }), g2 = R.geo(), cx = 9, cz = -18;
    [[0, 0, .4, 3], [1, 0, .8, 3], [2, 0, 1.2, 3], [3, 0, 1.6, 3], [3.2, -2.4, 2.0, 2.2]].forEach(([dx, dz, h, d]) => { const w = dx === 3.2 ? 2.4 : 1; g2.box(w, h, d, dx, 0, dz, { m: 1.5 }); G.box(cx + dx, cz + dz, w, d, -1, h); });
    const me = g2.mesh(bt); me.position.set(cx, 0, cz); fixed.push(me);
    G.sign(cx + 3.2, 2.0, cz - 3, { name: '塩のブロックの山', lines: [['てっぺんから 見ると、\n空が 足もとまで つづいている。', 'どこからが 空で、\nどこからが 湖か わからない。']] }); }
  near.add(R.merge(fixed));

  // ---- 人（TL.person。主人公と同じ 4.5 頭身の作り）と、水の下の さかさの写し ----
  const twins = [], twin = p => { const q = TL.person(p.userData.o); q.scale.y = -1; scene.add(q); twins.push([p, q]); return q; };
  const C = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const line = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const folk = (o, x, z, ry, d) => { const p = TL.person(o); p.userData.o = o; p.position.set(x, 0, z); p.rotation.y = ry; scene.add(p); twin(p); return G.npc(p, d); };
  // 夕日へ向かって歩く 旅の仲間 3 人（もとの場面の 3 人）。ゆっくり 輪をえがいて 歩く
  const walk = line([[2, 2], [-2, -24], [-1, -50], [4, -62], [10, -50], [8, -24], [6, 0]]);
  [
    folk({ size: 'normal', hair: 'wolf', head: { hair: '#3a2a3a', eye: '#3a7a8a', skin: '#f0c8a8', mouth: 'smile' }, colors: C('#f0e8e0', '#2e9a9a', '#5a4a6a', '#2e9a9a', { belt: '#8a5a3a', glove: '#6a4a3a', boot: '#5a3a2a' }) }, 2, 2, PI,
      { name: '旅の剣士', path: walk, speed: .9, u: .02, lines: [['夕日が 沈むまでに、\n湖の まん中へ 行きたいんだ。', '空の中を 歩いてる みたいだろう？'], ['西の 森の 木の上の町で、\nきみに 似た人を 見たよ。', '……いや、気のせいかな。']] }),
    folk({ size: 'normal', outfit: 'robe', hold: 'staff', hair: 'center', head: { hair: '#e8a060', skin: '#e8b898', mouth: 'smile', blush: true }, colors: { tunic: '#8a6ab0', trim: '#f0e0d0', scarf: '#f0a040' } }, 2, 2, PI,
      { name: '旅の魔法使い', path: walk, speed: .9, u: .0, lines: [['水の上の 空に、\nわたしたちも うつっているわ。', 'さかさまの 世界にも、\nもう ひとりの わたし。'], '塩の 結晶は、\n夜に なると すこし 光るのよ。'] }),
    folk({ size: 'tall', outfit: 'worker', hair: 'swept', bulk: 1.14, head: { hair: '#2a2024', skin: '#c8906a', brow: 'thick', mouth: 'line', beard: 'stubble' }, colors: { linen: '#f0e0c8', pants: '#4a4058', scarf: '#c86a3a', boot: '#4a3a30' } }, 2, 2, PI,
      { name: '旅の力持ち', path: walk, speed: .9, u: .985, lines: [['荷物は ぜんぶ おれが 持つ。', 'そのかわり、めしの 番は たのむぞ。'], ['足が ぬれるのは いいが、\n塩で ブーツが まっしろだ。']] })];
  folk({ size: 'tall', outfit: 'worker', hat: 'straw', hair: 'wolf', bulk: 1.1, head: { hair: '#5a4a3a', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#e8e0d4', pants: '#6a5a4a', scarf: '#c8503c' } }, 7.4, -15.4, -2.4,
    { name: '塩の切り出し職人', lines: [['塩を 四角く 切りだして、\n積んで かわかすんだ。', 'あの山は、ひと夏ぶんの しごとさ。'], ['のぼっても いいぞ。', 'ただし、角が するどいから 気をつけてな。']] });
  folk({ size: 'normal', hat: 'kerchief', hatC: '#c8503c', hair: 'center', head: { hair: '#3a2a2a', eye: '#6a4a2a', mouth: 'smile' }, colors: C('#c8a06a', '#8a4a5a', '#5a4a4a', '#e8c040') }, -10.6, -13.4, 2.2,
    { name: '隊商の商人', lines: [['塩を 荷馬車に つんで、\n城下町まで 運ぶのさ。', 'この塩で、パン屋の パンが うまくなる。'], ['夜は ここで 野営だ。', '星の 草原の 塔が、\n遠くに 見える 夜もある。']] });
  folk({ size: 'child', outfit: 'worker', hat: 'cap', hatC: '#2e9a9a', hair: 'swept', head: { hair: '#c8743a', eye: '#3a7a8a', mouth: 'open', blush: true }, colors: { linen: '#f4ecdc', pants: '#5a6a8a' } }, -6, -6, 0,
    { name: '水あそびの子', path: line([[-6, -6], [-3, -3], [-6, 0], [-9, -3]]), speed: 2.2, lines: [['ぱしゃ、ぱしゃ！', '足もとに 雲が あるよ！'], ['ねえ、さかさまの きみが、\nこっちを 見てるよ。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'hood', hatC: '#6a5a7a', hold: 'staff', hair: 'center', head: { hair: '#d8d0d8', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'beard' }, colors: { tunic: '#7a6a8a', trim: '#e8d8b0' } }, -10.2, -8.2, .4,
    { name: '隊商の長老', lines: [['この湖は、雨の あとだけ 鏡に なる。', 'おまえさんは 運が いい。'], ['むかし、\n空を 飛ぶ船で この上を 通ったことがある。', '上から 見ても、空が 二つ あったよ。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'straw', hair: 'center', head: { hair: '#8a5a34', eye: '#8a4a6a', mouth: 'smile', blush: true }, colors: { tunic: '#d888ac', apron: '#f8f0ec' } }, 1.6, -30, PI * .9,
    { name: '鳥を見る人', lines: [['夕方に なると、\n鳥の むれが 西へ わたっていくの。', '空と 水に、鳥が 二重に 見えるでしょう？'], '鳥が 見えなくなるまで、\nここで 見おくるの。'] });

  // 主人公の写し
  const heroQ = TL.person('hero'); heroQ.scale.y = -1; scene.add(heroQ); twins.push([G.hero, heroQ]);
  // 鳥の群れ（ななめに横切る）と、その写し
  const birds = [0, 1, 2, 3, 4].map(() => { const b = R.bird({ c: '#3a2a4a', belly: '#5a4060', neck: false, s: 1.8 }), m = R.bird({ c: '#3a2a4a', belly: '#5a4060', neck: false, s: 1.8 }); m.scale.y = -1; scene.add(b, m); return [b, m]; });
  // 水の上の物の、さかさの写し。world と near を まるごと複製して上下を返す
  const mirror = world.clone(), mirrorN = near.clone(); mirror.scale.y = mirrorN.scale.y = -1; scene.add(mirror, mirrorN);

  // ---- 水面：うすい藤色の半透明の面と、水から出た塩のふちの網（六角形のドット絵） ----
  const tint = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200, 30, 30), new THREE.MeshBasicMaterial({ color: '#8a6a9a', transparent: true, opacity: .22, depthWrite: false })); tint.rotation.x = -PI / 2; tint.position.y = .004; scene.add(tint);
  const crust = (() => { const P = R.Px(64), N = 5, cs = 64 / N, pt = (i, j) => { const wi = ((i % N) + N) % N, wj = ((j % N) + N) % N; return [(i + .5 + (hash(wi, wj, 3) - .5) * .7) * cs, (j + .5 + (hash(wi, wj, 9) - .5) * .7) * cs]; }, W = R.ramp('#f4f0ec', 6, { contrast: .6 });
    P.each((x, y) => { const gx = Math.floor(x / cs), gy = Math.floor(y / cs); let d1 = 1e9, d2 = 1e9, id = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const [px, py] = pt(gx + i, gy + j), d = Math.hypot(x + .5 - px, y + .5 - py); if (d < d1) { d2 = d1; d1 = d; id = (gx + i) * 7 + (gy + j) * 13; } else if (d < d2) d2 = d; }
      const e = d2 - d1; if (e < .8) return W[4]; if (e < 1.3 && (x + y) & 1) return W[2]; if (hash(id, 1) > .92 && d1 < 3) return W[d1 < 2 ? 5 : 3]; return null; });
    return T.from(P, { m: 7, cut: true }); })();
  { const g = R.geo().normal([0, 1, 0]), S = 8, n = 40; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x0 = (i - n / 2) * S, z0 = (j - n / 2) * S - 60, x1 = x0 + S, z1 = z0 + S; if (Math.hypot(x0 + S / 2, z0 + S / 2 + 20) > 150) continue; g.quad([x0, .01, z1], [x1, .01, z1], [x1, .01, z0], [x0, .01, z0], [x0 / 7, -z1 / 7, x1 / 7, -z0 / 7]); }
    const m = g.mesh(crust); m.castShadow = false; scene.add(m); }

  // ---- 波紋：足もとに広がる、ドットの輪（半透明で消えていく） ----
  const ringT = (() => { const P = R.Px(32); P.clip = true; P.each((x, y) => { const d = Math.hypot(x - 15.5, y - 15.5); return Math.abs(d - 14) < 1 ? '#ffffff' : Math.abs(d - 11) < .7 && (x + y) % 3 ? '#f8e8f0' : null; }); return T.from(P, { m: 1, cut: true }); })();
  const RINGS = [...Array(40)].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringT, transparent: true, depthWrite: false, opacity: 0, color: '#fff4f0' })); m.rotation.x = -PI / 2; m.position.y = .03; m.userData.age = 9; scene.add(m); return m; });
  let ri = 0; const ripple = (x, z, s = 1) => { const m = RINGS[ri++ % RINGS.length]; m.position.set(x, .03, z); m.userData.age = 0; m.userData.s = s; };

  // ---- しらべる物 ----
  G.sign(0, .3, -2, { name: '塩の結晶', lines: [['水の中に、六角形の 白い あみめ。', '指で なぞると、しょっぱい におい。']] });
  G.sign(-40.6, .9, -36, { name: '目じるしの くい', lines: [['「この先 塩がうすく あぶない」', '綱の 向こうは、空だけが つづいている。']] });
  G.sign(-12.6, 1, -16, { name: '荷馬車', lines: [['たるの中は、白い 塩で いっぱい。', 'ほろに「城下町ゆき」と 書いてある。']] });

  // ---- はじめの場所（夕日のほうを向く）と、自動で歩く道 ----
  G.spawn(0, 12, PI);
  G.tour([[0, 4], [-4, -6], [-6.5, -12.5], [-4, -20], [2, -28], [6.4, -18], [8.6, -18], [12, -18], [12.4, -21], [6, -12], [2, -2], [0, 10]]);
  const lastP = new Map(); let sm = 0;
  G.tick((t, dt, P) => {
    // 写し：人の関節を毎コマ 写す
    for (const [p, q] of twins) { q.position.set(p.position.x, -p.position.y, p.position.z); q.rotation.copy(p.rotation); const A = p.userData.J, B = q.userData.J; for (const n in A) if (B[n] && A[n].isObject3D) { B[n].rotation.copy(A[n].rotation); B[n].position.copy(A[n].position); }
      const l = lastP.get(p) || [p.position.x, p.position.z]; if (Math.hypot(p.position.x - l[0], p.position.z - l[1]) > .75) { if (p.position.y < .1) ripple(p.position.x, p.position.z, p === G.hero ? 1 : .9); lastP.set(p, [p.position.x, p.position.z]); } else if (!lastP.has(p)) lastP.set(p, l); }
    RINGS.forEach(m => { const u = m.userData; u.age += dt; const k = u.age / 2.4; if (k > 1) { m.material.opacity = 0; return; } const s = (.3 + k * 1.9) * (u.s || 1); m.scale.set(s, s, 1); m.material.opacity = (1 - k) * .6; });
    birds.forEach(([b, m], i) => { const bx = 40 - ((t * 3.2 + i * 2.2) % 90), by = 14 + i * .7 + Math.sin(t + i) * .3, bz = P.z - 30 - i * 1.6; b.position.set(P.x + bx, by, bz); b.rotation.y = -PI / 2; R.birdPose(b, 'fly', t * .9 + i); m.position.set(P.x + bx, -by, bz); m.rotation.copy(b.rotation); R.birdPose(m, 'fly', t * .9 + i); });
    // 写しの丸天井と水の面は、カメラと主人公について動く
    skyM.position.set(G.cam.position.x, 0, G.cam.position.z); tint.position.x = Math.round(P.x / 40) * 40; tint.position.z = Math.round(P.z / 40) * 40;
    world.position.x = mirror.position.x = P.x; world.position.z = mirror.position.z = P.z;
    F.tick(t); });
});
