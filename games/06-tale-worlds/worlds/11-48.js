// ワールド 11-48「霧の鉄橋」。もとは game-looks-11/48-iron-bridge-fog.html（見るだけの場面）。
// 朝霧の川。リベット打ちの鉄のトラス橋が、石の橋脚の上を霧の奥までのびる。下を外輪の蒸気船がけむりを吐いてくぐり、かもめが舞う。
// ゲームにするために足した物：橋の上（車道と外がわの歩道）を歩ける当たり判定、歩道の手すり・トラスの柱・橋の門の塔・ガス灯のかべ、
// 橋の両はしの 工事中の通行止め、車道に止めた荷馬車と木箱（のぼれる）、話せる人 9 人、しらべられる物 3 つ。
TALE_WORLD('11-48', G => {
  const { THREE, K, R, T, TL, scene } = G, F = PACK_FTOWN(THREE, K, R), C = PACK_CITY(THREE, K, R), S = PACK_STEAM2(THREE, K, R), { hash } = K, PI = Math.PI;
  const FOG = '#d8d0cc';
  scene.add(R.skyDome([[0, '#9ab0c8'], [.5, '#d4d0d4'], [.85, '#f0dcd0'], [1, FOG]], { r: 400 })); scene.fog = new THREE.Fog(FOG, 14, 120);
  K.lights(scene, G.renderer, { sky: 0xe8e4f0, ground: 0x7a8a88, amb: 1.35, sun: 0xffe0c0, power: 1.3, range: 24, pos: [-36, 21, -42] });

  // ---- 川（コマ送りの水）と、霧の奥の岸の町なみ（もとのまま） ----
  const WF = T.water({ c: '#6a8a84' }), wmat = R.mat(WF[0], { vc: true, smooth: true });
  { const G2 = R.geo(); for (let x = -110; x < 110; x += 4) for (let z = -90; z < 50; z += 4) { const c = (xx, zz) => .85 + .2 * Math.max(0, 1 - Math.hypot(xx + 20, zz + 60) / 70); G2.quad([x, 0, z + 4], [x + 4, 0, z + 4], [x + 4, 0, z], [x, 0, z], [x / 3, -(z + 4) / 3, (x + 4) / 3, -z / 3], [c(x, z + 4), c(x + 4, z + 4), c(x + 4, z), c(x, z)]); }
    const m = G2.mesh(wmat); m.castShadow = false; scene.add(m); }
  scene.add(R.backdrop({ c: '#a8a0a8', haze: '#e4dcd6', r: 230, h: 40, y: -3, rep: 3, seed: 2 }));

  // ---- 鉄橋：石の橋脚、車道、外がわの歩道、両がわのトラス（上下の弦材・たて材・ななめ材）、上の横つなぎ ----
  const BANK = [], DY = 8, TH = 6.5, ZT = 2.3, X0 = -130, X1 = 130, BAY = 5, fixed = [], put = (o, x, z, ry = 0, y = 0, kind = 'none', op) => { o.position.set(x, y, z); o.rotation.y = ry; fixed.push(o); G.solid(o, kind, op); return o; };
  const IRON = F.tex.iron({ c: '#5e6a80', rust: .35 }), IRON2 = F.tex.iron({ c: '#4e5870', rust: .5, seed: 2 });
  { const G2 = R.geo(), H2 = R.geo(), mem = (a, b, w, G3 = G2) => { const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d).normalize()), m = new THREE.Matrix4().compose(new THREE.Vector3(...a), q, new THREE.Vector3(1, 1, 1)); G3.at(m).box(w, L, w, 0, 0, 0, { m: 2, top: false }).at(null); };
    for (const z of [-ZT, ZT]) { mem([X0, DY, z], [X1, DY, z], .5, H2); mem([X0, DY + TH, z], [X1, DY + TH, z], .45, H2);
      for (let x = X0; x < X1; x += BAY) { mem([x, DY, z], [x, DY + TH, z], .28); const k = Math.round((x - X0) / BAY) % 2; mem(k ? [x, DY, z] : [x, DY + TH, z], k ? [x + BAY, DY + TH, z] : [x + BAY, DY, z], .22); } }
    for (let x = X0; x < X1; x += BAY) { mem([x, DY + TH, -ZT], [x, DY + TH, ZT], .22); mem([x, DY - .3, -ZT - .2], [x, DY - .3, 4.4], .3, H2); if (Math.round(x / BAY) % 2 === 0) { mem([x, DY + TH, -ZT], [x + BAY, DY + TH, ZT], .14); mem([x, DY + TH, ZT], [x, DY + TH - 1.3, ZT], .12); } }
    fixed.push(G2.mesh(IRON), H2.mesh(IRON2)); }
  // 車道（石だたみ）と、外の歩道（板）と その手すり
  { const G2 = R.geo(), P = R.geo(); for (let x = X0; x < X1; x += 4) { G2.quad([x, DY, ZT], [x + 4, DY, ZT], [x + 4, DY, -ZT], [x, DY, -ZT], [x / 3, 0, (x + 4) / 3, 2 * ZT / 3]);
      P.quad([x, DY + .02, 4.3], [x + 4, DY + .02, 4.3], [x + 4, DY + .02, ZT + .2], [x, DY + .02, ZT + .2], [x / 3, 0, (x + 4) / 3, .7]); P.quad([x, DY - .25, 4.3], [x + 4, DY - .25, 4.3], [x + 4, DY + .02, 4.3], [x, DY + .02, 4.3], [x / 3, 0, (x + 4) / 3, .1], .8); }
    fixed.push(G2.mesh(T.cobble({ kind: 'slab', c: '#8a8a8e' })), P.mesh(T.planks({ c: '#8a6a50' }))); }
  { const G2 = R.geo(); for (let x = X0; x < X1; x += 2) { G2.box(.07, 1.02, .07, x, DY, 4.2, { m: 1 }); if (x % 4 === 0) G2.box(.12, .12, .12, x, DY + 1.02, 4.2, { m: 1 }); } for (const y of [1, .5]) G2.box(X1 - X0, .07, .07, 0, DY + y - .035, 4.2, { m: 2 }); fixed.push(G2.mesh(F.tex.iron({ c: '#3e4860' }))); }
  for (let x = -60; x <= 60; x += 15) put(R.lamp({ h: 3.4, c: '#3e4860' }), x + 2.5, 4.05, 0, DY, 'trunk', { r: .14 });
  // 橋の上を歩く：地面は橋の床の高さ。歩道の手すりと、向こうがわのトラスは こえられない かべ。トラスの柱とななめ材の足もとは 円柱
  G.ground(() => DY); G.bounds(-61, 61, -2.05, 3.95);
  G.box(0, 4.25, X1 - X0, .12, DY - 2, DY + 1.3, 0, true); G.box(0, -2.45, X1 - X0, .3, DY - 2, DY + TH, 0, true);
  for (let x = X0; x <= X1; x += BAY) { if (Math.abs(x) > 66) continue; G.circle(x, ZT, .22, DY - 1, DY + TH); if (Math.round((x - X0) / BAY) % 2) for (const dx of [-.5, .5]) G.circle(x + dx, ZT, .16, DY - 1, DY + 1.2); }
  // 橋脚（切り石）。上は橋の下まで
  for (const x of [-75, -35, 35, 75]) { const G2 = R.geo(); G2.loft(8, [[-1, 3.2, 2.8, 0, .8], [DY - .5, 2.6, 2.4, 3, 1], [DY - .2, 3, 3, 3.2, 1.05]], { cap: 'top', ur: 4, rot: 0 }); put(G2.mesh(F.tex.ashlar({ c: '#9a948c', moss: .3 })), x, 0); }
  // 橋の門（入口の飾りの塔）と銘板
  for (const x of [-35, 35]) for (const z of [-ZT - .4, ZT + .4]) { const tw = F.tower({ kind: 'square', r: .7, h: DY + TH + 3, stone: F.tex.ashlar({ c: '#a8a098' }), roof: '#4a5a6a', top: 'cone', roofH: 2 }); put(tw, x, z, 0, 0); G.box(x, z, 1.6, 1.6, -1, 40, 0, true); }
  G.sign(-35, DY + 1.3, 3.6, { name: '橋の銘板', lines: [['「鉄の大橋」と、真ちゅうの板に ほってある。', '橋げたの リベットは、ぜんぶで 百万本 あるそうだ。']] });
  // 霧の奥の岸：れんがの家なみと、工場の煙突
  { const BR = T.brick({ c: '#9a6a5a' }), RF = T.roof({ kind: 'slate', c: '#5a5e6e' }); for (let k = 0; k < 14; k++) { const hx = -90 + k * 13 + hash(k, 1) * 5, h = 3 + hash(k, 2) * 3; put(R.house({ w: 8, d: 6, h, h2: 3, wall: BR, roof: RF, seed: k }), hx, -64 - hash(k, 3) * 6); }
    for (const [cx, cz, ch] of [[-40, -74, 22], [-12, -78, 26], [30, -72, 20], [58, -80, 24]]) { const G2 = R.geo(); G2.loft(8, [[0, 1.6, 1.6, 0, .8], [ch, 1.1, 1.1, ch / 3, 1], [ch + .6, 1.4, 1.4, ch / 3 + .2, 1]], { cap: 'top', ur: 3 }); put(G2.mesh(T.brick({ c: '#8a5a4a', seed: 4 })), cx, cz); BANK.push([cx, ch, cz]); } }
  // 足した：橋の両はしの 通行止め（工事中の柵と木箱。この先は霧の中で 橋をなおしている）
  for (const s of [-1, 1]) { const x = s * 61.6; put(R.fence({ len: 6.8, kind: 'wood', h: 1.1 }), x, 1, PI / 2, DY);
    put(R.crate({ s: .9, c: '#8a6a44' }), x - s * .9, -1.4, .3, DY, 'box'); put(R.crate({ s: .8, kind: 'x', c: '#9a7a50' }), x - s * .9, -1.4, .9, DY + .9, 'box'); put(R.barrel({ c: '#6a5a4a' }), x - s * 1, 2.9, 0, DY, 'round'); put(R.lamp({ h: 2.2, c: '#3e4860' }), x - s * .6, .4, 0, DY, 'trunk', { r: .12 }); }
  G.sign(60.4, DY + 1, 1, { name: '通行止めの札', lines: [['「この先 橋の工事中。とおれません」', '霧の向こうから、かなづちの音が ひびいてくる。']] });
  // 足した：車道に止めた 荷馬車と、ふみ台の木箱（荷台の上に のぼれる）
  put(F.wagon({ load: 'crates', cover: false }), -9, -.4, PI / 2, DY, 'box'); put(R.crate({ s: .85, c: '#8a6a44' }), -12.1, -.2, .2, DY, 'box'); put(R.barrel({ c: '#7a5a3a' }), -5.8, -.3, 0, DY, 'round');
  G.sign(14, DY + 1, 4, { name: '霧の川', lines: [['手すりの下は、ずっと下に 川が ながれている。', '霧の中から、外輪の 水をかく音が 聞こえる。'], ['ふかく 息をすうと、つめたい 川のにおいがする。']] });
  scene.add(R.merge(fixed));
  BANK.forEach(([cx, ch, cz], i) => { const s = C.steam({ n: 9, r: 2.2, rise: 16, spread: 2, speed: .12, c: '#e8e0dc', a: .5, wind: [6, 0], phase: i * .2 }); s.position.set(cx, ch + .6, cz); scene.add(s); });

  // ---- 外輪の蒸気船（川をよこぎり、橋の下をくぐる）と小舟（もとのまま） ----
  const steamer = (() => { const B = R.parts(), Hl = B.g(T.boards({ c: '#2e5a52' }), { side: true }).smooth(1), Dk = B.g(T.planks({ c: '#a08060' }), { side: true }), Wa = B.g(T.windowWall({ wall: 'boards', wallO: { c: '#e8e0d0' }, curtain: '#f0d890', bars: 'cross' }));
    const sec = (z, hw, yt, dp) => [[-hw, yt, z], [-hw * .8, yt - dp * .7, z], [0, yt - dp, z], [hw * .8, yt - dp * .7, z], [hw, yt, z]], st = [[-7, 2.4, 1.3, 1.4], [-4, 2.6, 1.3, 1.8], [3, 2.6, 1.3, 1.8], [6, 1.8, 1.5, 1.6], [8, .1, 1.8, 1.3]];
    for (let i = 0; i < st.length - 1; i++) { const a = sec(...st[i]), b = sec(...st[i + 1]); for (let k = 0; k < 4; k++) Hl.quad(a[k + 1], a[k], b[k], b[k + 1], [st[i][0] / 3, k * .25, st[i + 1][0] / 3, k * .25 + .25], k === 0 || k === 3 ? 1 : .7); }
    { const a = sec(...st[0]); Hl.tri(a[0], a[2], a[4], [0, 0], [.5, 1], [1, 0], .8); }
    Dk.quad([-2.4, 1.32, -7], [2.4, 1.32, -7], [2.4, 1.32, 6], [-2.4, 1.32, 6], [0, 0, 2, 4]); Dk.tri([-1.8, 1.5, 6], [1.8, 1.5, 6], [0, 1.82, 8]);
    Wa.box(3.4, 1.9, 7, 0, 1.3, -1.6, { m: 1.6 }); B.g(T.roof({ kind: 'slate', c: '#8a3a34' })).box(3.8, .2, 7.6, 0, 3.2, -1.6, { m: 2 }); Wa.box(2, 1.4, 2.2, 0, 3.4, .6, { m: 1.6 });
    B.g(T.metal({ c: '#c83a2e' })).loft(8, [[3.3, .45, .45, 0, 1, 0, -2.4], [6.6, .45, .45, 2, 1.05, 0, -2.4]]).loft(8, [[6.6, .55, .55, 0, .9, 0, -2.4], [7, .55, .55, .2, .9, 0, -2.4]]);
    B.g(T.metal({ c: '#2e2a34' })).loft(8, [[5.4, .47, .47, 0, 1, 0, -2.4], [5.8, .47, .47, .2, 1, 0, -2.4]]);
    const g = B.group(); g.children.forEach(m => m.castShadow = false);
    [-1, 1].forEach(s => { const w = S.gear({ r: 1.9, th: .5, pitch: .9, spokes: 8, c: '#8a3a30', speed: 1.4 * s }); w.position.set(s * 2.9, 1.1, 1.2); w.rotation.y = PI / 2; g.add(w); });
    const hood = R.geo(); hood.loft(10, [[0, 2.25, 2.25, 0, 1, 0, 0], [.7, 2.25, 2.25, .3, 1, 0, 0]], { seg: [0, 5], rot: 0 }); const hm = hood.mesh(T.boards({ c: '#e8d8b0' }), { side: true }); hm.rotation.z = -PI / 2;
    for (const s of [-1, 1]) { const h = hm.clone(); h.position.set(s * 2.9 - .35, 1.1, 1.2); g.add(h); }
    return g; })();
  scene.add(steamer); { const st = C.steam({ n: 10, r: .7, rise: 7, spread: .9, speed: .25, c: '#f4f0ec', a: .6, wind: [0, 3] }); st.position.set(0, 7, -2.4); steamer.add(st); }
  const boats = [0, 1].map(k => { const b = R.boat({ c: ['#9a6a44', '#5a7a8a'][k] }); b.scale.setScalar(1.3); scene.add(b); return b; });
  const gulls = [0, 1, 2, 3, 4].map(k => { const b = R.bird({ c: '#f0eee8', belly: '#ffffff', neck: false, s: 1.7 }); scene.add(b); return b; });

  // ---- 橋の人（TL.person。主人公と同じ 4.5 頭身の作り）。歩道と車道を行き来する人、手すりの人、通行止めの番 ----
  const Cl = (tunic, vest, pants, scarf, extra = {}) => ({ tunic, vest, pants, scarf, ...extra });
  const folk = (o, x, z, ry, d) => { const p = TL.person(o); p.position.set(x, DY, z); p.rotation.y = ry; scene.add(p); return G.npc(p, d); };
  const lane = (x0, x1, z0, z1) => new THREE.CatmullRomCurve3([[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  folk({ size: 'tall', hat: 'cap', hatC: '#3a3a4a', hold: 'staff', hair: 'swept', head: { hair: '#2a2228', skin: '#e8b890', eyes: 'small', mouth: 'line', beard: 'mustache' }, colors: Cl('#3a3a4a', '#5a5060', '#3a3a4a', '#e8e0d0') }, 0, 0, 0,
    { name: 'ステッキの紳士', path: lane(-32, 32, 3.3, 3.65), speed: .9, u: .55, lines: [['おはよう。霧の朝の 散歩は いいものだ。', '橋が 雲の上に うかんでいるように 見えるだろう？'], ['この橋の向こうの町には、歯車の 時計塔が あってね。', '正午の 鐘が、霧の中でも よく ひびくんだ。']] });
  folk({ size: 'normal', outfit: 'robe', hat: 'hood', hatC: '#8a6a7a', hair: 'center', head: { hair: '#c8a070', skin: '#f0c49c', eye: '#6a5a7a', mouth: 'smile' }, colors: { tunic: '#8a6a7a', trim: '#f0e4d0' } }, 0, 0, 0,
    { name: '市場へ行く ご婦人', path: lane(-50, 50, -1.75, -1.45), speed: .8, u: .15, lines: [['川向こうの 朝市へ 行くところよ。', 'この霧だと、魚が よく とれるんですって。'], '蒸気船の 汽笛が 聞こえたら、もうすぐ 市が ひらく時間なの。'] });
  folk({ size: 'child', hat: 'cap', hatC: '#7a5a3a', hair: 'wolf', head: { hair: '#8a5a3a', skin: '#f0c49c', mouth: 'open', blush: true }, colors: Cl('#7a5a3a', '#f0e4c0', '#4a4a5a', '#c83a2e') }, 0, 0, 0,
    { name: '新聞くばりの子', path: lane(-56, 56, .95, .6), speed: 2.6, u: .3, lines: [['新聞〜！ 朝の 新聞だよ〜！', '……あっ、きみの分は ないや。'], ['橋の はしっこは 工事中なんだ。', 'ぼくは いつも ここを 行ったり来たり してるんだよ。']] });
  folk({ size: 'normal', outfit: 'worker', hat: 'straw', hair: 'wolf', head: { hair: '#4a3a2a', skin: '#c8885a', eyes: 'small', mouth: 'smile', beard: 'stubble' }, colors: { pants: '#4a5a6a', linen: '#e8dcc0', scarf: '#5a7a8a' } }, 21, 3.75, 0,
    { name: '手すりの つり人', lines: [['しーっ。いま、糸が ぴくっと 動いたんだ。', '……気のせいだったかな。'], ['ここから 川まで 八メートル。', '糸を たらすのも 一苦労さ。']] });
  folk({ size: 'small', outfit: 'robe', hat: 'kerchief', hatC: '#3e4860', hold: 'staff', hair: 'center', head: { hair: '#d8d0c8', skin: '#e8b890', eyes: 'closed', mouth: 'line', beard: 'beard' }, colors: { tunic: '#4a5a6a', trim: '#c8a040' } }, 2.0, 3.7, -PI / 2,
    { name: 'ガス灯の 点灯夫', lines: [['夜明けだから、灯を けして まわっておる。', 'この橋には 九つの ガス灯が あるんじゃ。'], ['霧の日は、昼でも 灯を つけておくことが ある。', '船からも 橋が 見えるようにのう。']] });
  folk({ size: 'normal', hat: 'beret', hatC: '#c83a2e', hair: 'swept', head: { hair: '#5a3a2a', skin: '#f0c49c', eye: '#4a6a9a', mouth: 'smile', blush: true }, colors: Cl('#4a5a7a', '#c83a2e', '#3e4a64', '#f0e8d8') }, -19, 3.6, PI / 2 + .5,
    { name: 'スケッチする 旅の子', lines: [['霧の橋を 絵に かいてるの。', '鉄の線が、霧の中に すうっと きえていくところが 好き。'], ['前は がけに家が はりついた 村を かいたわ。', 'こんどは 歯車の町に 行ってみるつもり。']] });
  folk({ size: 'tall', outfit: 'guard', hat: 'helm', hold: 'spear', hair: 'center', head: { hair: '#3a2e2a', skin: '#e0b088', brow: 'angry', mouth: 'line' }, colors: { tunic: '#3e4860', metal: '#a0a8b8', scarf: '#c83a2e' } }, 59.4, 1.6, -PI / 2,
    { name: '橋の見はり', lines: [['ここから先は 工事中だ。', '霧の中で 足をすべらせたら、川まで まっさかさまだぞ。'], '工事が おわったら、この先の 島まで 歩いて 行けるように なるんだ。'] });
  folk({ size: 'normal', outfit: 'worker', hat: 'cap', hatC: '#c8963a', hair: 'wolf', bulk: 1.1, head: { hair: '#2a2228', skin: '#c8885a', eyes: 'small', brow: 'thick', mouth: 'open', beard: 'mustache' }, colors: { pants: '#5a5e70', linen: '#d8ccb0', scarf: '#c8963a' } }, -59.4, 1.4, PI / 2,
    { name: 'リベット打ちの 職人', lines: [['トン、トン、カン！', '……おっと、ここは とおれないよ。リベットを 打ちなおしてるんだ。'], ['この橋の鉄は、ぜんぶ 時計塔の町の 工場で 作られたのさ。']] });
  folk({ size: 'normal', outfit: 'apron', hat: 'kerchief', hatC: '#e0a040', hair: 'center', head: { hair: '#3a2a28', skin: '#e8b890', mouth: 'smile' }, colors: { tunic: '#6a7a5a', apron: '#f0ece0' } }, -10.8, 1.6, PI / 2 + .4,
    { name: '荷馬車の 八百屋', lines: [['馬が 霧を こわがって、動かなくなっちゃってね。', '霧が 晴れるまで 休けいさ。'], ['荷台の 木箱の上に のってみな。', '霧の上に 頭が 出るような 気分になるよ。']] });

  // ---- 毎コマ：蒸気船は 主人公の少し先の川を よこぎり、橋の下をくぐる。小舟、かもめ、水 ----
  G.spawn(-26, 3.4, PI / 2);
  G.tour([[-14, 3.4], [-12.1, 1.1], [-12.1, -.2], [-9, -.4], [-6, -.4], [6, -1], [20, 2.8], [34, 3.8], [36, 3.4], [50, 1], [58, 0], [40, 3.3], [10, 3.3], [-20, 3.3], [-50, 3.3], [-56, 0], [-30, 3.3]]);
  G.tick(() => G.cam.rotateX(innerWidth < innerHeight ? .14 : .08));
  let pass = -1, sx = 0;
  G.tick((t, dt, P) => {
    const u = t * 2.2, c = Math.floor(u / 110), sz = 16 - (u % 110); if (c !== pass) { pass = c; sx = P.x + 13; } steamer.position.set(sx, .05 + Math.sin(t * 1.3) * .05, sz); steamer.rotation.y = PI; steamer.rotation.z = Math.sin(t * .9) * .015;
    boats.forEach((b, k) => { const bz = -10 - k * 22 + Math.sin(t * .2 + k) * 3; b.position.set(-14 + k * 26 + Math.sin(t * .05 + k) * 8, .05 + Math.sin(t * 1.5 + k) * .04, bz); b.rotation.y = .6 + k; });
    gulls.forEach((b, k) => { const a = t * (.35 + k * .05) + k * 1.3, r = 7 + k * 2.2; b.position.set(P.x + 9 + Math.cos(a) * r, DY + 1.2 + k * .6 + Math.sin(t * .7 + k) * .5, 6 + Math.sin(a) * r * .7); b.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a) * .7); R.birdPose(b, 'fly', t * .6 + k); });
    R.flip(wmat, WF, t, 4); for (const f of WF) f.offset.y = t * .05;
    S.tick(t); F.tick(t); C.update(t, G.cam); });
});
