// ワールド 12-32「積み重なったビルの谷間」。もとは game-looks-12/32-stacked-tower-canyon.html（見るだけの場面）。
// 夕方。40 階をこえる集合住宅が 両がわから かぶさり、空は上の細い すき間だけ。谷の底の通りに 屋台と人ごみ、上には物干しと ちょうちんのひも。
// ゲームにするために足した物：屋台と小物の当たり判定、通りの両はしの通行止め、木箱からのぼる非常階段のおどり場（ちょうちんの高さ近くから 通りを見わたせる）。
// 屋台の人・配達の若者・見回り・看板の職人など 話せる人 9 人とねこ、歩く人ごみ 14 人、しらべられる物 4 つ。
TALE_WORLD('12-32', G => {
  const { THREE, K, R, T, TL, scene } = G, C = PACK_CITY(THREE, K, R), PK = PACK_RUINS(THREE, K, R), N = PACK_NEON1(THREE, K, R, C), X = C.tex, { hash } = K, PI = Math.PI;
  const RED = '#e8443a';
  scene.add(R.skyDome([[0, '#4a4a98'], [.35, '#a86aa0'], [.7, '#f08a78'], [1, '#ffd09a']], { r: 600 })); scene.fog = new THREE.Fog('#e8a08a', 110, 620);
  const SUN = new THREE.Vector3(.9, .4, .35).normalize();
  K.lights(scene, G.renderer, { sky: 0xffc8b0, ground: 0x6a5aa0, amb: 1.6, sun: 0xffb070, power: 1.5, range: 30, pos: [SUN.x * 80, SUN.y * 80, SUN.z * 80] });

  // ---- 谷：通り（はば 9 m）の両がわに、上へ細くなりながら積み重なった棟。底は日かげの ふじ色、上は夕日で だいだい ----
  const HW = 4.5, fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const WALLC = ['#c8b0b8', '#b8b8c8', '#d0b8a0', '#a8b8c0', '#c8c0a8', '#b8a8c0'], GR = [[.52, .5, .82], [1.75, 1.22, .88]];
  for (const s of [-1, 1]) for (let x = -110, i = 0; x < 110; i++) { const w = 10 + Math.floor(hash(i, s, 1) * 3) * 3, h = 84 + Math.floor(hash(i, s, 2) * 8) * 9, d = 14;
    put(N.tower({ w, d, h, step: h * (.55 + hash(i, s, 4) * .2), c: WALLC[(i * 2 + (s > 0 ? 1 : 0)) % 6], seed: 60 + i * 2 + (s > 0 ? 1 : 0), lit: .16, acBox: .4, cage: .65, wash: .4, grad: GR }), x + w / 2, s * (HW + d / 2), s > 0 ? PI : 0);
    x += w + (hash(i, s, 3) > .7 ? 1.2 : 0); }
  put(N.tower({ w: 40, d: 20, h: 168, step: 120, c: '#d8c0a8', seed: 3, lit: .12, acBox: .2, grad: [[.7, .6, .8], [1.9, 1.3, .9]] }), 120, 0, -PI / 2);   // つきあたりの いちばん高い棟
  put(N.tower({ w: 30, d: 20, h: 132, c: '#c0b0c0', seed: 9, lit: .1, grad: GR }), -125, 0, PI / 2);
  G.bounds(-45.6, 47.6, -HW + .25, HW - .25);

  // ---- 通りの底：屋台の列・ちょうちんのひも・店の看板 ----
  const lights = [], stalls = [];
  for (let k = 0; k < 16; k++) { const s = k % 2 ? 1 : -1, x = -42 + k * 5.6 + hash(k, 1) * 1.5, kind = k % 3;
    const st = kind === 0 ? C.yatai({ c: ['#c83a34', '#3a6a8a', '#8a4a8a'][k % 3], c2: '#f8f0e0', kind: ['wave', 'ring', 'dots'][k % 3], noren: ['#a8302a', '#2a4a6a'][k % 2], seed: k }) : R.stall({ w: 2.6, c: ['#e8443a', '#e8c84a', '#4a8ac8', '#f0f0e8'][k % 4], c2: '#f8f0e0' });
    put(st, x, s * (HW - 1.6), s > 0 ? PI : 0); G.box(x, s * (HW - 1.6), kind === 0 ? 2.3 : 2.7, kind === 0 ? 1.2 : 1.4, -1, 2, 0, true); stalls.push([x, s, kind]); lights.push({ x, z: s * (HW - 1.4), r: 3.6, c: '#ffb070', k: .7 }); }
  for (let k = 0; k < 9; k++) { const x = -40 + k * 10; scene.add(C.lanterns([x, 6.5, -HW + .2], [x + 2, 6.8, HW - .2], { n: 7, sag: .8, kind: k % 3 ? 'red' : 'yellow', r: .17 })); }
  for (let k = 0; k < 40; k++) { const x = -45 + hash(k, 1) * 90, s = hash(k, 2) > .5 ? 1 : -1, y = 3.5 + hash(k, 3) * 12, v = hash(k, 4) < .7, c = ['#ff5a8a', '#4ae0d0', '#ffc040', '#f0f0ff'][Math.floor(hash(k, 5) * 4)];
    const sg = N.sign({ kind: v ? 'v' : 'h', n: 2 + Math.floor(hash(k, 6) * 3), c, c2: '#ffc040', w: v ? .9 : 2.2, seed: k + 200, flicker: k % 13 === 6 }); sg.position.set(x, y, s * (HW - sg.userData.w / 2 - .1)); sg.rotation.y = PI / 2; fixed.push(sg); }
  const land = R.ground({ w: 220, d: 12, cell: 1, layers: [X.conc({ c: '#8a849c' }), T.cobble({ c: '#7a7090', kind: 'slab' }), X.plate({ c: '#6a6488', n: 2 })], mix: (x, z) => [Math.abs(z) < 1.6 ? 1 : 0, hash(Math.round(x / 6), Math.round(z / 3)) > .86 ? 1 : 0], shade: C.lightShade(lights, [.62, .58, .82]) });
  scene.add(land.mesh);
  for (const s of [-1, 1]) fixed.push(C.pipe([[-110, 4.4, s * (HW - .1)], [110, 4.4, s * (HW - .1)]], .14, { c: '#7a7a98', joint: 4 }));
  put(C.drum({ c: '#4f8f88' }), 3, -2.0, 0, 0, 'round'); put(R.crate({ s: .6 }), 8, 2.5, .3, 0, 'box'); put(C.bike({ c: '#e8443a' }), -6, 3.1, .1, 0, 'box', { pad: .1 }); put(C.trike({ c: '#4a6a94', load: true }), 14, -1.9, 0, 0, 'box', { pad: .05 });

  // ---- 足した：非常階段の おどり場（木箱 → 木箱 2 つ → おどり場。高さ 2.7 m） ----
  const FE = { x0: 7.2, x1: 11.2, z0: -HW, z1: -HW + 1.4, y: 2.7 };
  { const cx = (FE.x0 + FE.x1) / 2, w = FE.x1 - FE.x0, d = FE.z1 - FE.z0, Gg = R.geo(), Gp = R.geo(), Gr2 = R.geo().normal([0, .3, 1]);
    Gg.quad([FE.x0, FE.y, FE.z1], [FE.x1, FE.y, FE.z1], [FE.x1, FE.y, FE.z0], [FE.x0, FE.y, FE.z0], [0, 0, Math.round(w * 1.5), 1]); fixed.push(Gg.mesh(X.manhole({ kind: 'grate', c: '#6a6e84' }), { side: true }));
    Gp.box(w, .1, .08, cx, FE.y - .1, FE.z1, { m: 1.5 }).box(.08, .1, d, FE.x0, FE.y - .1, FE.z0 + d / 2, { m: 1.5 }).box(.08, .1, d, FE.x1, FE.y - .1, FE.z0 + d / 2, { m: 1.5 });
    for (const [x, z] of [[FE.x0 + .1, FE.z1 - .05], [FE.x1 - .1, FE.z1 - .05]]) Gp.box(.08, 1.8, .08, x, FE.y - 1.8, z, { m: 1.5 }).box(.06, .06, d, x, FE.y - 1.2, FE.z0 + d / 2, { m: 1.5 });   // ななめの ささえの代わりの つり金具
    fixed.push(Gp.mesh(X.plate({ c: '#5e6078' })));
    Gr2.quad([FE.x0, FE.y, FE.z1], [FE.x1, FE.y, FE.z1], [FE.x1, FE.y + .9, FE.z1], [FE.x0, FE.y + .9, FE.z1], [0, 0, Math.round(w), 1]).quad([FE.x0, FE.y, FE.z0], [FE.x0, FE.y, FE.z1], [FE.x0, FE.y + .9, FE.z1], [FE.x0, FE.y + .9, FE.z0], [0, 0, 1, 1]); fixed.push(Gr2.mesh(X.rail({ c: '#6a6e84' }), { side: true }));
    G.box(cx, FE.z0 + d / 2, w, d, FE.y - .12, FE.y, 0); G.box(cx, FE.z1, w, .12, FE.y, FE.y + 1.1, 0, true); G.box(FE.x0, FE.z0 + d / 2, .12, d, FE.y, FE.y + 1.1, 0, true);
    put(R.crate({ s: .9, kind: 'x' }), 11.75, -2.7, .1, 0, 'box'); put(R.crate({ s: .9 }), 11.75, -3.75, 0, 0, 'box'); put(R.crate({ s: .9, kind: 'slash', c: '#8a9a6a' }), 11.75, -3.75, .08, .9, 'box');
    G.sign(9.2, FE.y + .8, FE.z1 - .2, { name: 'おどり場からの ながめ', lines: [['ちょうちんの ひもが、目の前を 横切っている。', '通りの ずっと先まで、赤い明かりが つづく。'], ['見上げると、ビルと ビルの すき間に 細い夕やけ。', 'せんたく物が、旗のように ゆれている。']] }); }

  // ---- 足した：通りの両はしの 通行止め（トタンのさくと ドラムかん） ----
  for (const [x, s] of [[-46.2, 1], [48.2, -1]]) { put(C.fence({ len: 9, h: 1.8, kind: 'tin' }), x, 0, PI / 2, 0); G.box(x, 0, .3, 9, -1, 2, 0, true);
    put(C.drum({ c: '#a8603a' }), x + s * .8, -1.6, 0, 0, 'round'); put(C.drum({ c: '#4f8f88' }), x + s * .8, 2.2, 0, 0, 'round'); put(R.crate({ s: .8, kind: 'x' }), x + s * .9, .4, .3, 0, 'box'); }
  G.sign(-45.2, 1, 0, { name: '通行止めの さく', lines: [['「この先 工事中」と 書いてある。', 'さくの すき間から、また 屋台の明かりが 見える。']] });
  scene.add(R.merge(fixed));
  // 上の階どうしに わたした物干し（下から見上げると、空のすき間にせんたく物がならぶ）
  for (let k = 0; k < 14; k++) { const x = -40 + k * 6.3 + hash(k, 3) * 2, y = 14 + hash(k, 4) * 40; scene.add(N.laundry([x, y, -HW], [x + 1.5 - hash(k, 5) * 3, y + .3, HW], { n: 5 + (k % 3), seed: k, sag: .5 })); }
  const kites = PK.flock({ n: 6, r: 14, h: 6, c: '#3a3040', s: 3, speed: .18 }); kites.position.set(10, 95, 0); scene.add(kites);
  stalls.filter((_, i) => i % 3 === 0).forEach(([x, s]) => { const m = C.steam({ r: .5, rise: 3, n: 7, c: '#fff4ec', a: .42 }); m.position.set(x, 1.3, s * (HW - 1.8)); scene.add(m); });
  G.sign(0, 1, 0, { name: '谷の底の 通り', lines: [['見上げると、ビルが 空を おしつぶしそうだ。', '何十階あるのか、数えられない。'], 'どこかの窓から、ラジオの音が ふってくる。'] });
  { const [x, s] = stalls[0]; G.sign(x, 1.2, s * (HW - 2.4), { name: '屋台の なべ', lines: [['ぐつぐつ にえる なべから、白い湯気。', 'あまくて からい においが する。']] }); }

  // ---- 町の人（TL.person。主人公と同じ 4.5 頭身の作り）。屋台の人は 前かけ、配達は 作業着、見回りは 帽子と制服 ----
  const person = (o, x, z, ry, y = 0) => { const p = TL.person(o); p.position.set(x, y, z); p.rotation.y = ry; scene.add(p); return p; };
  const folk = (o, x, z, ry, d, y) => G.npc(person(o, x, z, ry, y), d);
  const loop = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const HAIRC = ['#2a2228', '#3a2a24', '#6a4a3a', '#c8843a', '#1e1e2a'], SKIN = ['#f0c49c', '#e0b088', '#d8a070', '#c8885a'];
  // 屋台の人（話せるのは 4 人。ほかは 見るだけ）
  const sellers = [];
  const SELL = [
    { name: '麺の屋台の おやじ', o: { size: 'tall', bulk: 1.12, hat: 'kerchief', hatC: RED, head: { beard: 'stubble', eyes: 'small', mouth: 'smile' } }, lines: [['へい、らっしゃい！', 'うちの スープは、三日 にこんでるんだ。'], ['この谷は 一日じゅう 日かげでね。', '夕方の 一時間だけ、上のほうが 光るのさ。']] },
    null,
    { name: '串焼きの おばさん', o: { size: 'normal', hat: 'kerchief', hatC: '#e8c84a', head: { mouth: 'open', blush: true } }, lines: [['焼きたてだよ！ 一本 どうだい？', 'たれは、ひいばあちゃんの 代からの 秘伝さ。'], ['上の階の 物干しから、ときどき くつしたが ふってくるの。', 'なべに 入らないよう 見はってるんだよ。']] },
    null,
    { name: '果物屋台の むすめ', o: { size: 'normal', hat: 'straw', head: { mouth: 'smile', blush: true } }, lines: [['あまい 果物 いかが？', '港に 船が ついたばかりの、南の国の 実よ。'], ['港の 飛空艇の 船乗りさんたちも、よく 買いに来るの。', 'がけの上の港から、ここまで 半日なんだって。']] },
    null,
    { name: '雑貨屋台の じいさん', o: { size: 'small', hat: 'cap', hatC: '#3a4a6a', head: { hair: '#e8e8e8', eyes: 'closed', beard: 'beard', mouth: 'line' } }, lines: [['……なんでも あるよ。', 'ネジも、電球も、読めない字の 看板も。'], ['この谷の ビルはね、むかしは 三階だてだったんだ。', '上に 上に、つみ足して こうなったのさ。']] },
    null];
  stalls.filter((_, i) => i % 2 === 0).forEach(([x, s], i) => { const sd = SELL[i], ry = s > 0 ? PI : 0, z = s * (HW - .5);
    const o = { size: 'normal', outfit: 'apron', hat: i % 3 ? 'kerchief' : undefined, hatC: RED, hair: ['swept', 'center', 'wolf'][i % 3], ...(sd ? sd.o : {}), head: { hair: HAIRC[i % 5], skin: SKIN[i % 4], mouth: 'smile', ...(sd ? sd.o.head : {}) }, colors: { tunic: ['#f4ecd8', '#3a6a8a', '#8a4a8a', '#4a7a5a'][i % 4], apron: i % 2 ? '#f4ecd8' : RED } };
    if (sd) folk(o, x, z, ry, { name: sd.name, r: .75, lines: sd.lines });
    else { const p = person(o, x, z, ry); p.userData.seller = 1; sellers.push(p); } });
  // 配達の若者（荷台つきの三輪車の持ち主。通りを 急いで行き来する）
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#2fa89a', hair: 'wolf', head: { hair: '#1e1e2a', eye: '#2a8a8a', mouth: 'open' }, colors: { linen: '#4a6a94', pants: '#3a3a4a', scarf: '#2fa89a' } }, 0, 0, 0,
    { name: '配達の若者', path: loop([[-40, .9], [44, .9], [44, .4], [-40, .4]]), speed: 2.4, lines: [['ごめん、いそいでるんだ！', '四十二階まで、なべを とどけるの。'], ['この谷の エレベーターは、三日に 一回しか 動かないんだよ。', 'だから 足が いのち！']] });
  // 見回りの人（帽子と 制服）
  folk({ size: 'tall', outfit: 'guard', hat: 'cap', hatC: '#2a3a5a', hair: 'center', head: { hair: '#3a2e2a', skin: '#e0b088', brow: 'angry', mouth: 'line' }, colors: { tunic: '#2a3a5a', metal: '#8a90a8', scarf: '#e8c84a' } }, 0, 0, 0,
    { name: '通りの 見回り', path: loop([[-30, -.9], [30, -.9], [30, -.5], [-30, -.5]]), speed: .9, u: .6, lines: [['夕方は 人が 多い。すりに 気をつけろ。', '……いや、この谷に すりは いないか。みんな 顔見知りだ。'], ['通りの両はしは、工事中で 通れない。', 'ビルを また 一階 つみ足すらしい。']] });
  // 通りの子（屋台の前を かけまわる）
  folk({ size: 'child', hat: 'beret', hatC: RED, hair: 'swept', head: { hair: '#3a2430', mouth: 'open', blush: true }, colors: { tunic: '#2fa89a', vest: '#f4ecd8', pants: '#f0e4c8', boot: RED } }, 0, 0, 0,
    { name: '通りの子', path: loop([[-8, 1.8], [6, 1.8], [6, -1.4], [-8, -1.4]]), speed: 2.2, lines: [['ねえねえ、空を見たことある？', 'ここからだと、細い すじにしか 見えないの。'], ['屋上に のぼったら、海と 港が 見えるんだって！', 'でも 四十階も あるんだよ。']] });
  // 看板の職人（非常階段の おどり場の上）
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#e8c84a', hair: 'wolf', bulk: 1.06, head: { hair: '#6a4a3a', skin: '#c8885a', eyes: 'small', mouth: 'smile', beard: 'stubble' }, colors: { linen: '#e8c84a', pants: '#4a4a5a', scarf: '#4a6a94' } }, 8.0, -3.9, .4,
    { name: '看板の職人', lines: [['よく ここまで のぼってきたな。', 'ネオンの 管を とりかえてるところだ。'], ['看板の字かい？ じつは おれにも 読めない。', 'むかしの だれかが 考えた字らしい。']] }, FE.y);
  // 物干しの おばあさん（店と店の あいだの 戸口）
  folk({ size: 'small', outfit: 'apron', hat: 'kerchief', hatC: '#8a4a8a', hair: 'center', head: { hair: '#d8d0c8', eyes: 'small', mouth: 'smile' }, colors: { tunic: '#8a4a8a', apron: '#f4ecd8' } }, -21.6, 4.0, PI,
    { name: '戸口の おばあさん', lines: [['あたしの へやは 三十八階。', 'せんたく物を ほすのは、むかいの棟との あいだの ひもさ。'], ['森の祭りの 一座が、こんど ここへ 来るんだって。', 'たのしみだねえ。']] });
  // ねこ（木箱の上）
  const cat = R.cat({ c: '#3a3040', belly: '#e8e4dc' }); cat.position.set(8, .6, 2.5); cat.rotation.y = -2.2; scene.add(cat);
  G.npc(cat, { name: 'ねこ', r: .2, head: .25, lines: ['にゃ。', '……（ちょうちんの明かりを じっと見ている）', 'なーお。'], idle: t => R.catPose(cat, 'sit', t) });
  // 人ごみ（話さない。通りを 行き来する）
  const OUT = [undefined, 'apron', 'worker', undefined, 'robe'], HAT = [undefined, 'cap', undefined, 'straw', 'beret', 'kerchief', undefined];
  const crowd = [...Array(14)].map((_, i) => { const o = { size: ['normal', 'normal', 'tall', 'small', 'child'][i % 5], outfit: OUT[i % 5], hat: HAT[i % 7], hatC: ['#e8443a', '#2fa89a', '#e8c84a', '#4a6a94'][i % 4], hair: ['swept', 'center', 'wolf'][i % 3], head: { hair: HAIRC[i % 5], skin: SKIN[(i + 1) % 4], mouth: i % 2 ? 'smile' : 'line' }, colors: { tunic: ['#4a6a94', '#c8b0b8', '#2fa89a', '#8a4a8a', '#e8c84a', '#6a5a98', '#d0b8a0'][i % 7], vest: ['#3a3a4a', '#f4ecd8', '#a8302a'][i % 3], pants: ['#3a3a4a', '#5a5a7a', '#f0e4c8'][i % 3] } };
    return { p: person(o, 0, 0, 0), dir: i % 2 ? 1 : -1, z: (i % 2 ? 1 : -1) * (1.35 + hash(i, 3) * .7), sp: .55 + hash(i, 4) * .5, off: hash(i, 5) * 70, stop: i % 5 === 0 }; });

  // ---- はじめの場所と 自動で歩く道 ----
  G.spawn(-14, 0, PI / 2);
  G.camera({ pitch: .12, lookUp: 1.1 });
  G.tour([[-4, -.2], [6, 1.6], [12.8, -.6], [16, .2], [30, -.4], [40, .6], [30, .4], [10, .8], [-10, .2], [-30, -.4], [-40, .4], [-20, 0]]);

  // ---- 毎コマ：人ごみ、屋台の人、とび、看板・物干し ----
  G.tick((t, dt, P) => {
    crowd.forEach((c, i) => { const W = 50, b = c.off + t * c.sp * c.dir * (c.stop ? 0 : 1) - P.x + 14, px = P.x - 14 + ((b % W) + W) % W; c.p.position.set(px, 0, c.z); c.p.rotation.y = c.stop ? (c.z > 0 ? 0 : PI) : c.dir > 0 ? PI / 2 : -PI / 2; if (c.stop) R.idle(c.p, t + i, Math.sin(t * .4 + i) * .3); else R.walk(c.p, t * c.sp * 4.8 + c.off, .8); });
    sellers.forEach((c, i) => { R.idle(c, t + i, Math.sin(t * .5 + i) * .25); c.userData.J.armR.rotation.x = -.8 - Math.sin(t * 2.6 + i) * .2; });
    kites.userData.tick(t); C.update(t, G.cam); N.tick(t); });
});
