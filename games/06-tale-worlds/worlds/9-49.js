// ワールド 9-49「霧の夜、高架下の屋台」。もとは game-looks-9/49-lone-stall-under-viaduct.html（見るだけの場面）。
// こい霧の夜の下町。シャッターのおりた通りと 暗い柱の間、高架の下に、屋台が 1 軒だけ あかりをともす。頭上を電車が通ると 電球がゆれる。
// ゲームにするために足した物：家なみ・高架の柱・屋台・小物の当たり判定、通りの両はしの通行止め、高架の下の コンテナと木箱の段（のぼれる）、
// 夜の町の人 8 人と ねこ 2 ひき、しらべられる物 4 つ。暗さは もとの場面のまま（D.mood の 'fog' を夜の色に）。主人公には うすい あかりが ついてくる。
TALE_WORLD('9-49', G => {
  const { THREE, K, R, T, TL, scene } = G, C = PACK_CITY(THREE, K, R), D = PACK_DARK(THREE, K, R), X = C.tex, { hash } = K, PI = Math.PI;
  const FOG = '#34404e', OR = '#ffa548', VZ = -6, VH = 6.4, SX = 10, SZ = -5.1, SRY = -.5;
  const mood = D.mood(scene, G.renderer, 'fog', { follow: G.hero, hills: false, range: 26, r: 300, sky: ['#18202c', '#242e3a', '#303c4a', '#3c4856'], fog: [FOG, 4, 50], hemi: ['#94a4bc', '#383c4a', .82], key: ['#b8c8e0', .55, [-.4, .8, .45]], fill: ['#6a7890', .3], base: [.66, .72, .86] });
  G.crt({ bright: 1.1 });

  // ---- 地面：ぬれたアスファルト。高架の下はコンクリート。屋台のあかりを大きく焼きこむ ----
  const LIT = [{ x: SX - .6, z: SZ + 1.6, r: 14, c: OR, k: 1.8 }, { x: SX - .4, z: SZ + .8, r: 4.5, c: '#ffd080', k: 1 }, { x: -22, z: 5.5, r: 5, c: '#9ac8ff', k: .4 }, { x: 17, z: 5.5, r: 5, c: '#9ac8ff', k: .4 }];
  const land = R.ground({ w: 150, d: 70, cell: 2, cz: -2, layers: [X.asphalt({ wet: .75, c: '#485062', wetC: '#6c7c98' }), X.conc({ c: '#6a7080' }), X.plate({ c: '#5a6274', n: 4 })], mix: (x, z) => [Math.abs(z - VZ) < 2.6 ? 1 : 0, z > 5.2 && z < 6.6 ? 1 : 0], shade: mood.shade(LIT) }); scene.add(land.mesh);
  G.ground(() => 0); G.bounds(-29, 35, -10, 6.8);

  // ---- 高架、シャッターのおりた家なみ、暗い柱、電柱 ----
  const fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'box', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; }, CS = ['#566078', '#606a80', '#5a5a74', '#4e6474', '#6a6478'];
  put(C.elevated({ len: 140, h: VH, c: '#4e586e', posts: 10 }), 0, VZ, 0, 0, 'none');
  for (let x = -65; x < 70; x += 10) for (const dz of [-1.4, 1.4]) G.circle(x, VZ + dz, .34, -1, VH);   // 高架の柱
  for (const [z, ry, k] of [[-12.5, 0, 0], [9.2, PI, 1]]) for (let x = -44, i = 0; x < 52; i++) { const w = 5 + hash(i, k + 3) * 2.6; put(C.shack({ w, d: 4.6, floors: 2 + (hash(i, k + 5) > .6 ? 1 : 0), seed: i + k * 20 + 7, cs: CS, shop: 'shutter', lit: 0, laundry: false, awning: i % 3 === 0 ? 'tin' : null, sign: i % 4 === 1 ? { kind: ['moon', 'cup', 'fish', 'star'][i % 4], c: '#5a6a84', shape: 'tall' } : false }), x + w / 2, z, ry, 0, 'none'); G.box(x + w / 2, z, w + .3, 4.8, -1, 12, ry, true); x += w + .3; }
  scene.add(R.merge([[36, -30, 6.5], [-40, -34, 7], [70, 26, 8]].map(([x, z, r], i) => { const p = C.pillar({ r, h: 60, seed: i + 4, c: '#3c4658', lights: false }); p.position.set(x, 0, z); return p; })));
  const POLES = [[-16, 5.9], [4, 5.9], [24, 5.9]].map(([x, z]) => put(C.pole({ h: 7 }), x, z, PI / 2, 0, 'trunk', { r: .16 }));
  put(C.streetLamp({ h: 4.6, cold: true, c: '#465064', halo: false }), -22, 5.8, PI, 0, 'trunk', { r: .14 }); put(C.streetLamp({ h: 4.6, cold: true, c: '#465064', halo: false }), 17, 5.8, PI, 0, 'trunk', { r: .14 });
  put(C.vending({ c: '#5a6478' }), -3, -9.9); put(C.trash({ c: '#4a5468' }), 1.5, 5.6, 0, 0, 'round'); put(C.bike({ c: '#6a7488' }), -8.6, 5.7, .1, 0, 'box', { pad: .2 }); put(C.drum({ c: '#566078', mark: 'none' }), 15.6, -4.2, 0, 0, 'round'); put(C.tires({ n: 3 }), 4.6, -7.6, 0, 0, 'round');
  for (const [x, z, k] of [[-4, 1.2, 'round'], [5, 2.6, 'grate']]) put(C.manhole({ kind: k }), x, z, 0, 0, 'none');
  { const W = []; for (let i = 0; i < 2; i++) W.push([[POLES[i].position.x, 6.6, 5.9], [POLES[i + 1].position.x, 6.6, 5.9], 1]); scene.add(C.wires(W, { c: '#1e2632' })); }
  // 足した：通りの両はしの通行止め（さくと ドラムかん。この先は霧で見えない）
  for (const x of [-29.6, 35.6]) { put(C.fence({ len: 17, h: 1.6, kind: 'mesh', c: '#4a5468' }), x, -1.6, PI / 2, 0, 'none'); for (const z of [-7, 3.5]) put(C.drum({ c: '#5a6478', mark: 'band' }), x + (x < 0 ? .9 : -.9), z, x, 0, 'round'); }
  // 足した：高架のわきに置かれた コンテナと、木箱の段（のぼると 電車が すぐ上を通る）。高架の床は カメラが めりこまないよう 見えない箱にする
  put(C.container({ c: '#4e6474', len: 6 }), -10, -2.6, 0); G.box(0, VZ, 140, 3.8, VH - 1.7, VH + 1, 0, true);
  [[-5.6, -2.2, 0, .9], [-6.5, -2.2, 0, .9], [-6.5, -2.2, .9, .9], [-13.6, -3.1, 0, .7]].forEach(([x, z, y, s], i) => put(R.crate({ s, kind: i % 2 ? 'x' : 'plain', c: '#6a5a4a' }), x, z, i * .2, y));

  // ---- 屋台：1 軒だけ。のれん、ちょうちん、湯気。前に長いす、よこに木箱 ----
  const stall = put(C.yatai({ c: '#c2553a', c2: '#f0e0c0', kind: 'wave', noren: '#b8402a', seed: 2 }), SX, SZ, SRY, 0, 'box', { pad: .15 }), sm = R.TR(SX, 0, SZ, SRY), W2 = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(sm);
  { const b = W2(0, 0, 1.25); put(C.bench({ w: 1.9, c: '#8a6a48' }), b.x, b.z, SRY + PI); const c = W2(-1.9, 0, .5); put(R.crate({ s: .55, c: '#8a6a48' }), c.x, c.z, .3); const c2 = W2(1.9, 0, -.2); put(C.drum({ c: '#7a5a44', mark: 'none', h: .7 }), c2.x, c2.z, 0, 0, 'round'); }
  scene.add(R.merge(fixed));
  const bulbP = W2(.5, 2.1, .95), bulb = D.bulb({ drop: .45, c: '#ffd890', flicker: false }); bulb.position.copy(bulbP); scene.add(bulb);
  const glow = D.halo({ c: OR, r: 6, k: .55 }), glow2 = D.halo({ c: '#ffc070', r: 1.6, k: .7 }), sl = new THREE.PointLight(OR, 46, 13, 1.25), front = W2(0, 1.7, 1.6); glow.position.copy(W2(0, 1.6, .8)); glow2.position.copy(bulbP).y -= .55; sl.position.copy(front); scene.add(glow, glow2, sl);
  const pool = D.spot({ c: OR, r: 5.4, k: .5 }); pool.position.set(front.x - .6, .05, front.z + .6); scene.add(pool);
  scene.add(D.pools([{ p: [SX - 5, 3.2, VZ + 1.4], n: [0, 0, 1], r: 2, r2: 3, c: OR, k: .22 }, { p: [SX, VH - .35, VZ], n: [0, -1, 0], r: 5, r2: 2, c: OR, k: .3 }]), D.streaks([{ x: front.x - .5, z: front.z, h: 2, c: OR, k: .9, w: 2, len: 9 }, { x: bulbP.x, z: bulbP.z, h: 1.6, c: '#ffd890', k: .7, w: .7, len: 6 }], { far: 40 }));
  const steam = C.steam({ n: 9, r: .6, rise: 3, spread: .5, speed: .22, c: '#ffe2c0', a: .4 }); steam.position.copy(W2(.5, 1.5, -.1)); scene.add(steam);
  // 足した：街灯の下の 青い光の輪（主人公と町の人が 暗がりでも見えるように）
  scene.add(D.pools([{ p: [-22, .04, 5], r: 2.6, r2: 2.6, c: '#9ac8ff', k: .25 }, { p: [17, .04, 5], r: 2.6, r2: 2.6, c: '#9ac8ff', k: .25 }]));

  // ---- 電車（頭上を通る）、霧 ----
  const train = new THREE.Group(); for (const dx of [-6.2, 6.2]) { const c = C.train({ lit: 1, len: 12, c: '#5a6478', c2: '#8a94a8', seed: 3 }); c.position.x = dx; train.add(c); } train.position.set(200, VH, VZ); scene.add(train);
  const th = D.halo({ c: '#ffe8c0', r: 1.6, k: .9 }); th.position.set(-12.6, 1.5, 0); train.add(th);
  scene.add(D.groundFog({ n: 60, box: [64, 50], y: .1, h: 2.4, w: 11, c: '#8a9cb4', a: .26, wind: [.5, .12] }), D.flakes({ kind: 'dust', n: 80, box: [14, 6, 14], c: '#c8b8a0' }));
  const follow = new THREE.PointLight('#b8c8e8', 5, 6, 1.4); scene.add(follow);

  // ---- しらべられる物 ----
  G.sign(W2(0, 0, .9).x, 1.2, W2(0, 0, .9).z, { name: '屋台のなべ', lines: [['大きな なべで、おでんが ことこと にえている。', 'だしの においが、霧の中まで ただよってくる。']] });
  G.sign(-3, 1.2, -9.3, { name: '自動販売機', lines: [['あかりが 消えた 自動販売機。', 'ボタンを おしても、なにも出てこない。'], 'とり出し口に、だれかの わすれた 手ぶくろが 入っている。'] });
  G.sign(-20, 1.4, 6.4, { name: 'シャッター', lines: [['シャッターに、色あせた はり紙。', '「夜の 屋台、雨でも 出ます」']] });
  G.sign(5, 1.2, VZ + 1.2, { name: '高架の柱', lines: [['さわると、つめたくて しめっている。', '電車が通るたびに、柱が ぶるぶる ふるえる。']] });

  // ---- 夜の町の人（TL.person。主人公と同じ 4.5 頭身の作り）。色は霧の青灰に なじむ、くすんだ色 ----
  const CC = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const line = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  { const o = W2(1.5, 0, .5); folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#e8e0d0', hair: 'center', bulk: 1.12, head: { hair: '#b8b8b8', skin: '#e0b088', eyes: 'closed', brow: 'thick', mouth: 'smile', beard: 'mustache' }, colors: { tunic: '#e8e0d0', apron: '#b8402a' } }, o.x, o.z, SRY - .6,
    { name: '屋台の主人', r: .7, lines: [['へい、らっしゃい。霧の 夜は 冷えるだろう。', 'おでんで あったまって いきな。'], ['この屋台は、三十年 ここで 出してる。', '電車が 通るたびに、電球が ゆれるのさ。'], 'だいこんが いちばん うまいよ。たまごも いけるがね。'] }); }
  folk({ size: 'tall', outfit: 'worker', hat: 'cap', hatC: '#4a5468', hair: 'wolf', head: { hair: '#3a3028', skin: '#d8a070', eyes: 'small', brow: 'thick', mouth: 'smile', beard: 'stubble' }, colors: { pants: '#4a4a5a', scarf: '#c8784a' } }, W2(-.6, 0, 1.8).x, W2(-.6, 0, 1.8).z, SRY + PI,
    { name: '仕事帰りの職人', lines: [['あ〜、しみる。一日の 終わりは これに かぎる。', '…ん？ あんたも 一ぱい どうだい。'], ['昼間は スクラップ置き場で 部品を より分けてる。', '子どもらが 鉄くずの山で 遊んでて、にぎやかなんだ。']] });
  folk({ size: 'normal', hair: 'center', head: { hair: '#2e3040', eye: '#5a6a9a', eyes: 'small', mouth: 'line' }, colors: CC('#5a6c94', '#d8dce8', '#3c4666', '#e8e2d2') }, 0, 0, 0,
    { name: '霧の中を歩く人', path: line([[-6, 2.6], [8.6, -1.8], [10, -1], [-5, 3.6]]), speed: .9, lines: [['霧が こい夜は、あの あかりを 目じるしに 歩くの。', 'まいごに ならないように。'], '……電車の音。もうすぐ 真上を 通るわ。'] });
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'center', head: { hair: '#4a3a2a', skin: '#e0b088', eye: '#5a5a7a', brow: 'angry', mouth: 'line' }, colors: { metal: '#8a94a8', tunic: '#3c4666' } }, 0, 0, 0,
    { name: '夜回りの番人', path: line([[-24, 4.4], [30, 4.4], [30, 3.6], [-24, 3.6]]), speed: 1, u: .35, lines: [['夜回りだ。霧の夜は、足もとに 気をつけろ。', 'ぬれた 鉄板は、よく すべる。'], ['通りの はしは 通行止めだ。', 'この先は 霧が こくて、何も 見えんからな。']] });
  folk({ size: 'child', hat: 'cap', hatC: '#c8784a', hair: 'wolf', head: { hair: '#2a2a34', eye: '#3a5a8a', mouth: 'open', blush: true }, colors: CC('#6a7aa8', '#c8784a', '#3a4458', '#e8d8b0') }, -10.4, -2.6, PI * .4,
    { name: 'コンテナの上の子', lines: [['ここ、電車が 真上を 通るんだ。', 'ごうって 音が して、おなかに ひびくの！'], ['木箱を のぼれば、きみも 来られるよ。', '電車の まどの あかり、きれいだよ。']] }, 2.45);
  folk({ size: 'small', outfit: 'robe', hat: 'hood', hatC: '#4a3a5a', hair: 'center', head: { hair: '#c8c0d0', eye: '#8a6ab8', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#4a3a5a', trim: '#c8a860' } }, -1.4, -9.6, .1,
    { name: '辻うらない', lines: [['ふふ、霧の夜に 出歩くとは、あなた 旅の人ね。', 'あなたの 行く先には、光の すじが 見えるわ。'], ['光の ふる 廃工場…… それとも 草の 線路……', 'どちらでも、きっと よい 出会いが あるわ。']] });
  folk({ size: 'normal', hat: 'beret', hatC: '#6a4a3a', hair: 'swept', head: { hair: '#5a3a2a', eye: '#4a5a6a', eyes: 'small', mouth: 'smile' }, colors: CC('#6a5a4a', '#3c4666', '#4a4a5a', '#c8a04a') }, 4.6, 4.6, PI * .9,
    { name: '流しの楽士', lines: [['♪ 霧の 高架の 下で ／ ひとつ ともる あかり ♪', '……屋台の おやじさんに ささげる 歌さ。'], 'ここは 音が よく ひびく。高架の 下は ちょっとした 音楽堂だよ。'] });
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#5a6478', hair: 'swept', head: { hair: '#2a2a34', eye: '#4a5a6a', mouth: 'line' }, colors: { pants: '#3c4666', scarf: '#8a94a8' } }, 18.4, -8.6, -.4,
    { name: 'おそい帰りの駅員', lines: [['さいごの電車が 出たら、わたしの 仕事も おしまい。', 'あの屋台で 一ぱい やって 帰るのが たのしみでね。'], '高架の 電車は、町の 上の層まで のぼっていくんだ。'] });
  // ねこ（木箱の上の白いねこは話せる）と、通りを歩く 黒いねこ
  const cat = R.cat({ c: '#e8e2d4', belly: '#fff8ec', plain: 1 }); { const p = W2(-1.9, .55, .5); cat.position.copy(p); cat.rotation.y = SRY + 1.2; scene.add(cat); }
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃあ。', '……（おでんの においを かいでいる）', 'にゃ。'], idle: t => R.catPose(cat, 'sit', t) });
  const cat2 = D.cat({ s: 1 }); scene.add(cat2);

  // ---- はじめの場所・自動で歩く道・毎コマ ----
  G.spawn(-2.2, 1.6, Math.atan2(9.6, -4.1));
  G.tour([[6, -1.4], [14, .5], [22, 2], [21, -8.8], [2, -8.8], [-8, -8.6], [-17, -8.6], [-17, -3], [-12, 3.5], [-4, 4], [-2.2, 1.6]]);
  G.tick((t, dt, P) => {
    // 電車：20 秒ごとに頭上を通る。近いほど、電球が大きくゆれて あかりが ちらつく
    const tt = t % 20, tx = 70 - (tt - 2.6) * 14, near = tt > 2.6 ? Math.exp(-(((tx - SX) / 26) ** 2)) : 0; train.position.x = tt > 2.6 ? tx : 200;
    const fk = 1 - near * (.22 + .2 * Math.sin(t * 37) * Math.sin(t * 23)) + Math.sin(t * 2.1) * .03;
    bulb.rotation.z = Math.sin(t * 5.2) * (.04 + near * .42); bulb.rotation.x = Math.sin(t * 4.1 + 1) * (.03 + near * .25); glow2.position.set(bulbP.x + Math.sin(bulb.rotation.z) * .55, bulbP.y - .55, bulbP.z - Math.sin(bulb.rotation.x) * .55);
    sl.intensity = 46 * fk; glow.material.opacity = .55 * fk; glow2.material.opacity = .7 * fk; pool.material.opacity = .5 * fk; pool.position.x = front.x - .6 + Math.sin(bulb.rotation.z) * 1.2;
    { const u = (t * .7 / 18 + .2) % 1; cat2.position.set(-2 + u * 18, 0, -3.6 - Math.sin(u * 6) * .3); cat2.rotation.y = PI / 2; R.catPose(cat2, 'walk', t * 8); }
    follow.position.set(P.x - 1, P.y + 2.2, P.z + 1.2);
    land.follow(0, -2); D.tick(t, G.cam); C.update(t, G.cam); });
});
