// 第 8 集の題材「鉄の都市の下町」の追加の部品（pack）。../game-looks-7/kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), C = PACK_CITY(THREE, K, R);   として使う。
// 全部をならべて見るページは pack-city-sheet.html（?p=tex でテクスチャ、?p=parts&i=0〜5 で形）。見本は 44-underplate-market.html と 45-pipe-alley.html。
//
// ■ 考え方：上の層を支える鉄板の天井と柱の下にひろがる、トタンと廃材の つぎはぎの町。まずしいが、にぎやかで、あたたかい。
//   空の代わりに「鉄板の天井（C.ceiling）＋遠くの丸天井（C.dome）＋町なみの輪（C.backdrop）」。天井・あかり・ネオンは光に関係なく光る材質なので、
//   場面の明るさは「地面とかべに落ちるあかりの色」で作る：R.ground の shade に C.lightShade(あかりの一覧) を入れ、かべには C.pools（加算の光の輪）を足す。
//   PointLight は主役のまわりの 2〜4 個だけにする。電球・ちょうちん・ネオンは明るいテクスチャなので、ブラウン管のにじみ（bloom）で自然に ともって見える。
//   色の組の見本：鉄 '#454a66'（青むらさき寄り。黒くしない）／さび赤 '#b5603c'・青みどり '#4f8f88'・からし '#c8a04a'／電球 '#ffb050'・ネオンのもも '#ff5aa8'・水色 '#4ae0f0'（C.PAL と C.LIGHT）。
//
// ■ 決まり：retro.js と同じ（足もとが y=0、正面が +z、大きさは m）。長い物（はり・高架・ホーム・電車・フェンス）は x の向きにのびる。
//   動く物（ファン・蒸気・雨・火花・ちらつくネオン・点めつ・ぬれた地面の映りこみ）は、作ったときに C.live に入る。毎コマ C.update(t, cam) を 1 回呼べば全部動く。
//   動く部分は userData.dyn = true なので、R.merge にそのまま入れてよい（動く部分だけ残る）。同じ部品を作っただけで場面に入れなかったときも害はない。
//
// ■ テクスチャ  C.tex.名前({ ... }) → THREE.Texture（同じ引数なら同じ物）。どれも c（もとの色）・seed・m を取れる。C.paint.名前(o) は Px を返す
//   かべ・屋根：tin { rust 0〜1, dir: 'v'/'h' }（トタン）   plate { n（1 枚の中の板の数）, rust, warn（下に しま模様） }（鉄板とリベット）   patch { cs: [色…], seed 0〜2 }（つぎはぎ）
//               conc { }（コンクリートと たれた しみ）   tile { c2, check }   container { c2 } / containerEnd（コンテナの横・とびら）
//   地面：asphalt { wet 0〜1, wetC }（ぬれたアスファルト。水たまりは ふちが明るい）   track { }（線路。よこ 64 ドット＝3 m）   manhole { kind: 'round'/'grate'/'plate' }（抜き）
//   天井・骨組み：ceil { leak 0〜1, light }（つぎ目から光がもれる天井。光る材質で使う）   girder { kind: 'x'/'z' }（トラス。抜き）   pillar / pillarLights（支柱と、その窓あかり）   skyline { haze }（遠くの町なみ。抜き）
//   あかり：neon { kind, c, c2, shape: 'sq'/'wide'/'tall', bg（地の色。null で管だけ＝抜き）, border, seed }
//             kind: 'ring' 'moon' 'star' 'zig' 'arrow' 'wave' 'cup' 'fish' 'bottle' 'gear' 'heart' 'eye' 'glyphs'（どれも字ではない模様・自作の記号）
//           lantern { kind: 'red'/'white'/'yellow', mark }   bulb   shopwin { kind: 'goods'/'food'/'parts'/'room', lit }（あかりのついた店先）   vend { c }（自動販売機）
//   布：noren { c2, kind: 'ring'/'wave'/'dots'/'bars' }（のれん。抜き）   hood { c2 }（つぎの当たった ほろ）   laundry（せんたく物。抜き）
//   配管・機械：pipe { band（色の帯） }   drum { c2, mark: 'diamond'/'band'/'none' } / drumTop   panel { }（機械の板）   grille { }（室外機ふうの箱の正面）   meter・valve・blade・turbine（抜き）
//               mesh { bar }（金網。抜き）   ladder・rail・stair・antenna（抜き）
//   小物・乗りもの：scrap { }（鉄くずの山）   tire { kind: 'hub'/'hole' } / tread   poster { kind: 0〜5 }   counter（屋台の台）   bike・moto（横から見た絵。抜き）
//                   train { kind: 'pass'/'box', c2, lit, wreck } / trainEnd / bogie   truckSide / truckFront { c }
//
// ■ 天井と骨組み
//   C.ceiling({ w, d, y, cell: 8, c, leak, beams: 16（はりの間かく。0 でなし）, hole(x, z) → true でその板をぬく, tint(x, z) → 明るさ, cx, cz }) → Group   鉄板の天井（下向き。光る材質）
//   C.pillar({ r: 5, h: 40, c, lights: true, lm（窓あかりの絵 1 枚が何 m か。遠景は大きく）, emissive（遠くでも黒くつぶれないよう足す色） }) → Group   巨大な支柱（上と下が ふくらむ。窓あかりつき）。遠景にも近景にも
//   C.beam({ len, h: .6, w: .4, c })   C.truss({ len, h: 1.6, w: 1.2, c })   鉄骨の はり と トラス（x の向き。底が y=0）
//   C.elevated({ len, h: 7, c, posts: 10 }) → Group   高架の線路（x の向き。上の面が y=h。userData.top = h）
//   C.dome({ r: 380, c, haze, lights: [色…] }) → Mesh   空の代わりの丸天井（暗い鉄の色に、上の層のあかりの点）   C.backdrop({ r: 200, h, y, c, haze, rep }) → Mesh  遠くの町なみの輪
//
// ■ 建物
//   C.shack({ w: 5, d: 4.5, floors: 2, h, h2, seed, cs, wall（1 階のかべ）, lit 0〜1, shop: 'door'/'noren'/'shutter'/'window'/'open', shopC, awning: 色 か 'tin', stairs: 'l'/'r',
//             laundry, tank, antenna, vent, sign: { kind, c, shape: 'tall'/'wide', flicker } }) → Group   つぎはぎの家・店（userData.h = 高さ）。C.shop(o) は shop: 'noren' が既定
//   C.container({ c, c2, len: 6 })   C.containerHouse({ n: 3, seed, cs, lit }) → Group   コンテナと、コンテナを積んだ家
//   C.platform({ len: 16, w: 3.4, roof: true, c }) → Group   小さな駅のホームと屋根（x の向き。線路がわが +z。上の面は y=.9）
//
// ■ 配管・機械
//   C.pipe([[x, y, z], …], 太さの半径, { c, band, bend（まがりの丸み）, joint（つぎ手の間かく m。0 でなし）, n: 6, ends: true（はしの つぎ手） }) → Mesh   まがり は点を置くだけで丸くなる
//   C.pipeRun([[x, z], …]（道の中心線）, { side: 1/-1, off: 4（中心線からのきょり）, pipes: [{ r, y, c, band }, …], gap, posts: 6, valves: true, seed }) → Group   配管を道にそって引く
//   C.duct([[x, y, z], …], はば, 高さ, { c, joint })   C.valve({ r（管の半径）, c })   C.meter({ r })
//   C.fan({ r: .6, kind: 'wall'/'roof', c, speed })（回る）   C.tank({ r, h, kind: 'v'/'h', c, legs, ladder })   C.generator({ c })（userData.vent ＝ けむりの出る所）   C.acbox({ c, fan: true })
//   C.manhole({ r, kind })   C.fence({ len, h, kind: 'mesh'/'tin', c })   C.ladder({ h })   C.stairs({ h, w, run, rail })   C.fireEscape({ floors: 3, fh: 2.8, w: 2.6 })
//
// ■ あかり
//   C.neon({ kind, c, c2, shape, w（はば m）, bg, border, seed, two（両面）, flicker（ちらつく） }) → Mesh（まん中が x=0、下が y=0、+z 向き）
//   C.bulbs(a, b, { n, sag, cs: [色…], r }) → Group   裸電球の列（a, b は [x, y, z]。電線は たれる。userData.pts ＝ 電球の位置）
//   C.lanterns(a, b, { n, sag, kind, r })   C.lantern({ kind, r })（つるす点が y=0）
//   C.streetLamp({ h: 4.2, c, cold, light（PointLight をつける）, halo: true })   C.signal({ h, cs: [色…], blink })（信号ふうのランプ。点めつ）
//   C.shaft({ w: 3, h: 14, c, a: .3, lean, n: 2 }) → Mesh   上の層からもれる光のすじ（加算。足もとが y=0）   C.halo({ c, r, flicker }) → Sprite   あかりの まわりの ぼんやり
//   C.pools([{ p: [x, y, z], r, c, n: [法線]（省くと地面）, k（強さ） }, …]) → Mesh   加算の光の輪（地面・かべ）。1 回の描画
//   C.lightShade([{ x, z, r, c, k }, …], [r, g, b]（下地の明るさ）) → (x, z) → [r, g, b]   R.ground の shade に入れる（あかりを地面に焼きこむ）
//   C.streaks([{ x, z, c, w, len, k }, …], { y }) → Mesh   ぬれた路面の映りこみ（ネオンがカメラのほうへ たてにのびる。加算）
//
// ■ 小物
//   C.yatai({ c, c2, kind, steam: true }) → Group   屋台（のれん・ちょうちん・湯気。userData.pot ＝ なべの位置）
//   C.drum({ c, c2, mark, h, r })   C.tires({ n: 3, kind: 'stack'/'pile', seed })   C.scrap({ s: 2, seed, cs })（鉄くずの山）   C.vending({ c })   C.trash({ kind: 'can'/'bin', c })
//   C.bike({ c })   C.trike({ c, load })（三輪の荷車）   C.pole({ h, arms, box })（電柱。userData.tips ＝ 電線をつなぐ点）   C.wires([[a, b, たれ], …], { c }) → 線   C.poster({ kind, s })   C.bench({ w, c })
//
// ■ 乗りもの
//   C.train({ kind: 'pass'/'box', c, c2, len: 9, lit, wreck }) → Group（x の向き。車輪の下が y=0）   C.truck({ c, load: 'drums'/'crates'/'none' })（userData.wheels）   C.moto({ c })
//
// ■ 効果
//   C.steam({ n: 9, r: .5, rise: 2.4, spread: .35, speed: .35, c, a: .55, dir: [x, y, z]（ふきだす向き）, jet（いきおい。0〜1） }) → Mesh   蒸気・湯気（丸い かたまり。置く所に position）
//   C.rain({ n: 500, box: [26, 12, 26], speed: 20, slant: [x, z], c, a }) → 線（カメラについてくる）   C.sparks({ n: 18, every: 1.6, c, power })（火花。置く所に position）
//
// ■ 毎コマ：C.update(t, cam)   ■ 色：C.PAL（つぎはぎの色）  C.LIGHT = { bulb, pink, cyan, green, amber }
window.PACK_CITY = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, C = {}, paint = {}, tx = {}, cache = new Map();
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const def = (name, m, fn, cut = false) => { paint[name] = fn; tx[name] = (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) cache.set(k, t = T.from(fn(o), { m: o.m || m, cut: typeof cut === 'function' ? cut(o) : cut })); return t; }; };
  const PAL = ['#b5603c', '#4f8f88', '#c8a04a', '#6f7f9a', '#8f6a44', '#a8a49a'];   // さび赤・青みどり・からし・青ねず・木・白ちゃけた鉄
  const LIGHT = { bulb: '#ffb050', pink: '#ff5aa8', cyan: '#4ae0f0', green: '#7af09a', amber: '#ffd060' };
  const RUST = ramp('#a85a30'), IRON = '#454a66', DARK = '#2a2838';
  const rgb = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
  C.PAL = PAL; C.LIGHT = LIGHT; C.tex = tx; C.paint = paint; C.live = [];
  const live = o => { C.live.push(o); return o; };
  C.update = (t, cam) => { for (const o of C.live) o.userData.tick(t, cam); };

  // ================= 1. テクスチャ =================
  const WV = [2, 3, 4, 5, 4, 3, 2, 1];   // トタンの波 1 つ（8 ドット）の明るさ
  // トタン。たての波、32 ドットごとの重ね目、くぎ、重ね目からたれる さび
  def('tin', 3, (o = {}) => { const P = Px(64), M = ramp(o.c || PAL[0]), sd = o.seed || 0, rust = o.rust ?? .5, hz = o.dir === 'h';
    P.each((X, Y) => { const x = hz ? Y : X, y = hz ? X : Y, s = y % 32, wv = WV[x & 7]; let c = tone(M, wv);
      if (s === 0) c = M[0]; else if (s === 1) c = tone(M, wv + 1); else if (s === 31) c = tone(M, wv - 1);
      if (s === 4 && (x & 15) === 2) c = M[0]; if (s === 4 && (x & 15) === 3) c = M[5];
      const drip = hash(x >> 1, y >> 5, sd) < rust * .55 ? 3 + hash(x >> 1, sd, 3) * 15 : 0, n = tn(x, y, 8, 16, 64, 64, sd);
      if (s > 1 && s < 2 + drip) c = tone(RUST, wv - (s > drip - 1 ? 2 : 1));
      if (n > 1 - rust * .3) c = tone(RUST, wv - 1); else if (n > 1 - rust * .38 && ((x + y) & 1)) c = tone(RUST, wv);
      return c; });
    return P; });
  // 鉄板とリベット。n×n 枚の板、ふちの光と影、リベットからたれる さび、こすれた きず
  def('plate', 3, (o = {}) => { const P = Px(64), M = ramp(o.c || '#6a7080', 6, { contrast: .8 }), sd = o.seed || 0, n = o.n || 2, s = 64 / n, rust = o.rust ?? .4;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const t = 2 + Math.floor(hash(i, j, sd) * 1.99); P.block(i * s, j * s, s, s, M, t);
      for (let y = 1; y < s - 1; y++) for (let x = 1; x < s - 1; x++) { const X = i * s + x, Y = j * s + y, m = tn(X, Y, 16, 16, 64, 64, sd + 5); if (m > .68) P.set(X, Y, tone(M, t + 1)); else if (m < .3 && ((X + Y) & 1)) P.set(X, Y, tone(M, t - 1)); }
      for (let k = 4; k < s; k += 8) for (const [x, y] of [[k, 2], [k, s - 4], [2, k], [s - 4, k]]) { const X = i * s + x, Y = j * s + y; P.set(X, Y, M[5]); P.set(X + 1, Y, tone(M, t + 1)); P.set(X, Y + 1, M[0]); P.set(X + 1, Y + 1, M[0]);
        if (y === 2 && hash(X, Y, sd) < rust * .6) for (let q = 2; q < 3 + hash(X, Y, 9) * 9; q++) P.set(X, Y + q, tone(RUST, q < 5 ? 2 : 3)); }
      const sx = i * s + 6 + Math.floor(hash(i, j, sd + 2) * (s - 16)), sy = j * s + 8 + Math.floor(hash(i, j, sd + 3) * (s - 16)); for (let q = 0; q < 7; q++) { P.set(sx + q, sy + (q >> 1), tone(M, t + 2)); P.set(sx + q, sy + (q >> 1) + 1, tone(M, t - 1)); } }
    if (o.warn) for (let y = 50; y < 62; y++) for (let x = 0; x < 64; x++) P.set(x, y, y === 50 || y === 61 ? M[0] : ((x + y) >> 3) & 1 ? (y === 51 ? '#f4d868' : '#e0aa2c') : (y === 51 ? '#4a4858' : '#2e2c3a'));
    return P; });
  // つぎはぎのかべ：トタン・板・鉄板を、色ちがいで はり合わせる（seed 0〜2 で はり方が変わる）
  const LAY = [[[0, 0, 24, 36, 't', 0], [24, 0, 40, 20, 'b', 4], [24, 20, 22, 28, 'p', 3], [46, 20, 18, 44, 't', 2], [0, 36, 24, 28, 'p', 5], [24, 48, 22, 16, 't', 1]],
    [[0, 0, 40, 16, 'b', 4], [40, 0, 24, 30, 't', 1], [0, 16, 18, 48, 't', 0], [18, 16, 22, 26, 'p', 5], [40, 30, 24, 34, 't', 2], [18, 42, 22, 22, 'b', 3]],
    [[0, 0, 32, 32, 't', 2], [32, 0, 32, 22, 'p', 3], [32, 22, 14, 42, 'b', 4], [46, 22, 18, 42, 't', 0], [0, 32, 32, 32, 't', 1]]];
  def('patch', 3, (o = {}) => { const P = Px(64), sd = o.seed || 0, cs = o.cs || PAL;
    for (const [x0, y0, w, h, k, ci] of LAY[sd % 3]) { const M = ramp(k === 'b' ? (cs[4] || '#8f6a44') : cs[(ci + (sd >> 2)) % cs.length]);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const x = x0 + i, y = y0 + j; let t = 3;
        if (k === 't') { t = WV[i & 7]; if (hash(x >> 1, y0, sd) < .3 && j > 1 && j < 4 + hash(x >> 1, 5, sd) * 12) { P.set(x, y, tone(RUST, t - 1)); continue; } }
        else if (k === 'b') { const r = j % 6; t = r === 0 ? 1 : r === 1 ? 4 : 3 - ((Math.floor(j / 6) + (i >> 3)) & 1) * .6; if (r > 1 && hash(i >> 2, Math.floor(j / 6), sd + y0) < .16) t = 2; if (r === 3 && (i % 13) === 6) t = 1; }
        else { t = 3 + (tn(x, y, 16, 16, 64, 64, sd + 4) > .6 ? 1 : 0); if (tn(x, y, 8, 16, 64, 64, sd + 8) > .78) { P.set(x, y, tone(RUST, 2 + ((x + y) & 1))); continue; } }
        if (j === 0 || i === 0) t = Math.max(t, 4) + (j === 0 ? 1 : 0); if (j === h - 1 || i === w - 1) t = 0;
        P.set(x, y, tone(M, t)); }
      for (const [nx, ny] of [[2, 2], [w - 4, 2], [2, h - 4], [w - 4, h - 4]]) { P.set(x0 + nx, y0 + ny, M[5]); P.set(x0 + nx + 1, y0 + ny + 1, M[0]); P.set(x0 + nx, y0 + ny + 1, M[0]); } }
    return P; });
  def('conc', 3, (o = {}) => { const c = o.c || '#9a968e', P = R.paint.concrete({ c, seed: o.seed }), D = ramp(c, 6, { contrast: .75 }), sd = o.seed || 0;
    for (let k = 0; k < 7; k++) { const x = Math.floor(hash(k, 1, sd) * 64), len = 10 + Math.floor(hash(k, 2, sd) * 30), w = 1 + (k % 3 === 0 ? 2 : k % 2); for (let y = 0; y < len; y++) for (let i = 0; i < w; i++) if (y < len - i * 4) P.set(x + i, y, y > len * .6 && (y + i) % 4 === 3 ? D[2] : D[1]); }
    P.each((x, y, c0) => y > 52 && tn(x, y, 8, 8, 64, 64, sd + 3) * 14 > 64 - y ? ((x + y) & 1 ? D[1] : D[2]) : undefined); for (let x = 0; x < 64; x++) { P.set(x, 0, D[4]); P.set(x, 63, D[0]); }
    return P; });
  def('tile', 1.5, (o = {}) => { const P = Px(32), A = ramp(o.c || '#d8dcd0'), B = ramp(o.c2 || PAL[1]), G = ramp('#6a665e'), sd = o.seed || 0; P.fill(G[2]);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const r = hash(i, j, sd), M = (o.check ? (i + j) & 1 : r < .24) ? B : A, x = i * 8, y = j * 8;
      if (r > .92) { P.rect(x, y, 7, 7, G[3]); P.rect(x, y, 7, 1, G[1]); P.set(x + 3, y + 3, G[4]); P.set(x + 4, y + 4, G[1]); continue; }
      P.rect(x, y, 7, 7, M[3]); P.rect(x, y, 7, 1, M[5]); P.rect(x, y, 1, 7, M[4]); P.rect(x, y + 6, 7, 1, M[2]); P.rect(x + 6, y, 1, 7, M[2]); if (r > .6 && r < .72) P.line(x + 1, y + 5, x + 5, y + 1, M[1]); if (r > .8) P.rect(x + 2, y + 2, 2, 2, M[4]); }
    return P; });
  def('container', 6, (o = {}) => { const P = Px(64, 32), M = ramp(o.c || PAL[1]), B = ramp(o.c2 || '#f0e8d0'), sd = o.seed || 0; P.clip = true;
    P.each((x, y) => { let t = [4, 3, 2, 3][x & 3]; if (y < 3 || y > 28) t = y === 0 || y === 29 ? 5 : y === 2 || y === 31 ? 1 : 3; if (x < 2 || x > 61) t = x === 0 || x === 62 ? 4 : 1;
      const drip = hash(x >> 1, 3, sd) < .3 ? 4 + hash(x >> 1, 4, sd) * 12 : 0; if (y > 2 && y < 3 + drip && x > 1 && x < 62) return tone(RUST, t - 1); if (y > 24 && y < 29 && tn(x, y, 8, 4, 64, 32, sd) > .6) return tone(RUST, t - 1); return tone(M, t); });
    P.rect(7, 9, 12, 7, B[3]); P.rect(7, 9, 12, 1, B[5]); P.rect(10, 11, 6, 3, M[2]); P.rect(7, 18, 8, 1, B[3]); P.rect(7, 20, 12, 1, B[3]); P.rect(44, 12, 3, 3, B[3]); P.rect(48, 12, 3, 3, B[3]); P.rect(52, 12, 6, 3, B[2]);
    return P; });
  def('containerEnd', 2.4, (o = {}) => { const P = Px(32), M = ramp(o.c || PAL[1]), S = ramp('#b8bcc8'), sd = o.seed || 0; P.clip = true;
    P.each((x, y) => { let t = ((y % 8) < 1) ? 2 : 3; if (y < 2 || y > 29 || x < 1 || x > 30) t = 1; if (x === 15 || x === 16) t = x === 15 ? 1 : 4; if (y > 25 && tn(x, y, 8, 4, 32, 32, sd) > .55) return tone(RUST, t - 1); return tone(M, t); });
    for (const x of [5, 11, 20, 26]) { P.rect(x, 2, 1, 28, S[4]); P.rect(x + 1, 2, 1, 28, S[1]); P.rect(x - 1, 16, 3, 2, S[5]); P.rect(x - 1, 18, 3, 1, S[0]); } return P; });
  // ぬれたアスファルト：むら、石つぶ、ひび、直したあと、水たまり（ふちが明るく、中に光の点）
  def('asphalt', 3, (o = {}) => { const P = Px(64), A0 = ramp(o.c || '#4e4c60'), A = [A0[1], A0[2], mix(A0[2], A0[3], .5), A0[3], mix(A0[3], A0[4], .4), A0[4]], sd = o.seed || 0, wet = o.wet ?? .5, wc = o.wetC || '#5a6698', Wt = [A[0], mix(A[3], wc, .5), mix(A[4], wc, .6), mix(A[5], wc, .6), mix(wc, '#dfe6ff', .5)];
    P.each((x, y) => { const n = tn(x, y, 16, 8, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 3) * .4; return A[n > .62 ? 4 : n < .4 ? 2 : 3]; });
    for (let k = 0; k < 24; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64); P.set(x, y, A[5]); P.set(x + 1, y + 1, A[0]); if (k % 4 === 0) P.set(x + 1, y, A[4]); }
    for (let k = 0; k < 3; k++) { let x = Math.floor(hash(k, 5, sd) * 64), y = Math.floor(hash(k, 6, sd) * 64); for (let i = 0; i < 16; i++) { P.set(x, y, A[0]); P.set(x, y + 1, A[4]); x++; const r = hash(k, i, sd + 7); y += r > .62 ? 1 : r < .3 ? -1 : 0; } }
    { const x = 34 + (sd % 3) * 4, y = 8; for (let j = 0; j < 11; j++) for (let i = 0; i < 16; i++) P.set(x + i, y + j, j === 0 || i === 0 ? A[0] : j === 10 || i === 15 ? A[4] : ((i + j) % 5 === 0 ? A[1] : A[2])); }
    if (wet > 0) { const th = 1 - wet * .5, f = (x, y) => tn(x, y, 16, 16, 64, 64, sd + 11) * .7 + tn(x, y, 32, 32, 64, 64, sd + 12) * .3; P.each((x, y) => { const n = f(x, y); if (n > th) return f(x, y - 1) <= th ? Wt[4] : f(x, y + 1) <= th ? Wt[0] : (y % 9 === 4 && (x + y * 3) % 16 < 5) ? Wt[3] : n > th + .07 ? Wt[2] : Wt[1]; if (n > th - .035 && ((x + y) & 1)) return A[1]; }); }
    return P; });
  def('track', 3, (o = {}) => { const P = Px(64, 32), Bl = ramp(o.c || '#5e5a66'), Wd = ramp('#6e4e38'), St = ramp('#8a8c9c'), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 8, 8, 64, 32, sd); return tone(Bl, n > .62 ? 4 : n < .36 ? 2 : 3); });
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) { const x = i * 8 + Math.floor(hash(i, j, sd) * 5), y = j * 8 + Math.floor(hash(i, j, sd + 1) * 5); P.bits(x, y, ['.hh', 'hmd', '.dd'], { h: Bl[5], m: Bl[4], d: Bl[1] }); }
    for (const j of [3, 19]) { P.block(5, j, 54, 7, Wd, 3); for (let x = 8; x < 56; x += 5) P.set(x, j + 2 + (x % 3), Wd[2]); P.rect(5, j + 7, 54, 1, Bl[0]); }
    for (const rx of [16, 45]) for (let y = 0; y < 32; y++) { P.set(rx - 1, y, RUST[1]); P.set(rx, y, St[2]); P.set(rx + 1, y, St[5]); P.set(rx + 2, y, St[3]); P.set(rx + 3, y, Bl[0]); if (y === 5 || y === 21) { P.set(rx - 2, y, St[4]); P.set(rx + 4, y, St[4]); } }
    return P; });
  def('manhole', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#6a6c7c'), k = o.kind || 'round'; P.clip = true;
    P.each((x, y) => { const dx = x - 15.5, dy = y - 15.5, d = Math.hypot(dx, dy);
      if (k === 'grate') return (x < 2 || y < 2 || x > 29 || y > 29) ? M[x < 2 || y < 2 ? 4 : 1] : (x % 5 < 2) ? '#16141e' : M[y % 8 === 0 ? 1 : x % 5 === 2 ? 4 : 3];
      if (k === 'plate') return (x < 1 || y < 1) ? M[5] : (x > 30 || y > 30) ? M[0] : ((x + y) % 8 < 2) !== ((x - y + 64) % 8 < 2) ? M[4] : M[2];
      if (d > 15.5) return null; if (d > 13.5) return M[dy < -dx ? 5 : 1]; if (d > 12.5) return M[0]; if (d < 3) return M[d < 1.6 ? 1 : 4];
      const a = Math.atan2(dy, dx), ring = Math.floor(d / 3) % 2; return ring ? (Math.floor((a + PI) / (PI / 8)) % 2 ? M[4] : M[2]) : M[3]; });
    return P; }, o => (o.kind || 'round') === 'round');
  // 鉄板の天井：16 ドットの板、太い はり、つぎ目からもれる上の層の光
  def('ceil', 8, (o = {}) => { const P = Px(64), M = ramp(o.c || IRON, 6, { contrast: .8 }), sd = o.seed || 0, leak = o.leak ?? .5, Lc = o.light || '#ffe6a8';
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const t = 2 + Math.floor(hash(i, j, sd) * 1.99), x = i * 16, y = j * 16; P.block(x, y, 16, 16, M, t);
      for (const [a, b] of [[2, 2], [13, 2], [2, 13], [13, 13]]) { P.set(x + a, y + b, tone(M, t + 2)); P.set(x + a, y + b + 1, M[0]); }
      if (hash(i, j, sd + 3) > .55) for (let q = 0; q < 6; q++) P.set(x + 5 + q, y + 6 + (q >> 1), tone(M, t - 1)); if (hash(i, j, sd + 4) > .7) P.rect(x + 6, y + 9, 5, 3, tone(M, t + 1)); }
    for (let k = 0; k < 64; k++) for (const [q, t] of [[30, 4], [31, 2], [32, 1], [33, 0]]) { P.set(k, q, M[t]); P.set(q, k, M[t]); }
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (hash(i, j, sd + 9) < leak * .45) { const hz = hash(i, j, sd + 10) > .5, len = 5 + Math.floor(hash(i, j, sd + 11) * 8), a = i * 16 + 3, b = j * 16 + (hz ? 0 : 3);
      for (let q = 0; q < len; q++) { const x = hz ? a + q : i * 16, y = hz ? b : b + q; P.set(x, y, Lc); P.set(hz ? x : x + 1, hz ? y + 1 : y, mix(Lc, '#e8782c', .5)); P.set(hz ? x : x - 1, hz ? y - 1 : y, mix(Lc, M[2], .6)); } }
    return P; });
  def('girder', 2, (o = {}) => { const P = Px(32), M = ramp(o.c || '#5a5e78'), z = o.kind === 'z'; P.clip = true;
    for (let x = 0; x < 32; x++) { const y1 = 4 + x * 23 / 32, y2 = 27 - x * 23 / 32; for (const [dy, t] of [[-1, 5], [0, 3], [1, 1]]) { P.set(x, y1 + dy, M[t]); if (!z) P.set(x, y2 + dy, M[t === 5 ? 4 : t === 3 ? 2 : 0]); } }
    for (let y = 0; y < 32; y++) { P.set(0, y, M[4]); P.set(1, y, M[3]); P.set(2, y, M[1]); }
    for (const y0 of [0, 27]) for (let x = 0; x < 32; x++) { P.set(x, y0, M[5]); P.set(x, y0 + 1, M[3]); P.set(x, y0 + 2, x % 4 === 1 ? M[5] : M[3]); P.set(x, y0 + 3, x % 4 === 1 ? M[0] : M[2]); P.set(x, y0 + 4, M[0]); }
    if (!z) { P.disc(16, 15.5, 3.2, M[3]); P.set(15, 14, M[5]); P.set(16, 16, M[0]); } return P; }, true);
  def('pillar', 12, (o = {}) => { const P = Px(64), M = ramp(o.c || '#565a78', 6, { contrast: .85 }), sd = o.seed || 0;
    P.each((x, y) => { const r = x % 16, s = y % 32; let t = r === 0 ? 1 : r === 1 ? 5 : r === 15 ? 2 : r < 9 ? 4 : 3; if (s < 5) t = s === 0 ? 5 : s === 4 ? 0 : (s === 2 && x % 4 === 1) ? 5 : 3; if (s === 5) t = 1;
      const drip = hash(x >> 1, y >> 5, sd) < .28 ? hash(x >> 1, 7, sd) * 20 : 0; if (s > 5 && s < 6 + drip) return tone(RUST, t - 2); if (tn(x, y, 16, 16, 64, 64, sd) > .7) t -= 1; return tone(M, t); });
    return P; });
  def('pillarLights', 12, (o = {}) => { const P = Px(64), sd = o.seed || 0, cs = o.cs || ['#ffd27a', '#ffb050', '#ffe9b8']; P.clip = true;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { const r = hash(i, j, sd); if (r < .45) continue; const x = i * 16 + 3 + Math.floor(hash(i, j, sd + 1) * 3) * 3, y = j * 8 + 2, n = 1 + Math.floor(r * 3.9) % 3; for (let k = 0; k < n; k++) { P.rect(x + k * 3, y, 2, 2, cs[(i + j + k) % cs.length]); } if (r > .93) P.rect(x, y + 4, 2, 2, '#ff5a4a'); if (r > .8 && r < .86) P.rect(x + 1, y + 4, 5, 1, LIGHT.cyan); }
    return P; }, true);
  // 遠くの町なみ（128×48 の切りぬき）：つぎはぎの家・タンク・配管の かげ絵に、窓あかりと ネオンの点
  def('skyline', 60, (o = {}) => { const P = Px(128, 48), c = o.c || '#3a3550', hz = o.haze || '#8a5a6a', sd = o.seed || 0, L = [mix(c, hz, .62), mix(c, hz, .3)]; P.clip = true;
    for (let k = 0; k < 2; k++) for (let x = 0; x < 128;) { const w = 5 + Math.floor(hash(x, k, sd) * 9), h = (k ? 9 : 17) + Math.floor(hash(x, k, sd + 1) * (k ? 14 : 20)), top = 48 - h, r = hash(x, k, sd + 2);
      for (let i = 0; i < w && x + i < 128; i++) for (let y = top + (r > .7 && i < 2 ? 3 : 0); y < 48; y++) P.set(x + i, y, y === top ? mix(L[k], '#ffffff', .12) : L[k]);
      if (r < .25) { P.rect(x + 1, top - 4, 4, 4, L[k]); P.rect(x + 2, top - 5, 2, 1, L[k]); } else if (r < .45) { P.rect(x + 2, top - 7, 1, 7, L[k]); P.rect(x + 1, top - 5, 3, 1, L[k]); } else if (r > .85) P.rect(x + w - 2, top - 3, 1, 3, L[k]);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) { const q = hash(x + i, j, sd + 5 + k); if (q > .52 && i * 3 + 2 < w && top + 3 + j * 5 < 46) P.rect(x + 1 + i * 3, top + 3 + j * 5, 2, k ? 2 : 1, q > .93 ? LIGHT.pink : q > .88 ? LIGHT.cyan : k ? '#ffc070' : mix('#ffc070', hz, .35)); }
      x += w + (r > .6 ? 1 : 0); }
    for (let x = 0; x < 128; x++) { P.set(x, 47, L[1]); if (hash(x >> 4, 3, sd) > .5) P.set(x, 40 - (hash(x >> 4, 4, sd) * 10 | 0), mix(L[1], '#000000', .15)); }
    return P; }, true);

  // ---- ネオン：管の線を引いてから、しん（白）・管（色）・にじみ（暗い色）の 3 段にする ----
  const Mask = (w, h) => { const d = new Uint8Array(w * h), M = { w, h, d };
    M.set = (x, y, v = 1) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) d[y * w + x] = v; };
    M.line = (x0, y0, x1, y1, v) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) M.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, v); };
    M.poly = (pts, ox, oy, s, v = 1, close = false) => { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; M.line(ox + a[0] * s, oy + a[1] * s, ox + b[0] * s, oy + b[1] * s, v); } };
    M.arc = (cx, cy, r, a0, a1, v = 1) => { const n = Math.max(4, Math.ceil(r * Math.abs(a1 - a0) * 1.6)); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; M.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, v); } };
    return M; };
  const ICON = {
    ring: (M, x, y, s) => { M.arc(x + s / 2, y + s / 2, s * .42, 0, PI * 2, 1); M.arc(x + s / 2, y + s / 2, s * .16, 0, PI * 2, 2); },
    moon: (M, x, y, s) => { M.arc(x + s * .5, y + s * .5, s * .42, .9, PI * 2 - .9, 1); M.arc(x + s * .78, y + s * .5, s * .36, 2.05, PI * 2 - 2.05, 1); M.set(x + s * .8, y + s * .2, 2); M.set(x + s * .9, y + s * .75, 2); },
    star: (M, x, y, s) => M.poly([0, 2, 4, 1, 3].map(k => [.5 + Math.sin(k * PI * .4) * .46, .52 - Math.cos(k * PI * .4) * .46]), x, y, s, 1, true),
    zig: (M, x, y, s) => { M.poly([[.62, .04], [.26, .5], [.56, .5], [.3, .96]], x, y, s, 1); M.poly([[.84, .2], [.7, .42]], x, y, s, 2); M.poly([[.12, .62], [.02, .8]], x, y, s, 2); },
    arrow: (M, x, y, s) => { M.poly([[.08, .5], [.9, .5]], x, y, s, 1); M.poly([[.6, .2], [.92, .5], [.6, .8]], x, y, s, 1); M.poly([[.08, .3], [.4, .3]], x, y, s, 2); M.poly([[.08, .7], [.4, .7]], x, y, s, 2); },
    wave: (M, x, y, s) => { for (const [oy, v] of [[.32, 1], [.68, 2]]) M.poly([...Array(13)].map((_, i) => [i / 12, oy + Math.sin(i / 12 * PI * 4) * .13]), x, y, s, v); },
    cup: (M, x, y, s) => { M.poly([[.1, .5], [.9, .5]], x, y, s, 1); M.poly([[.14, .5], [.3, .86], [.7, .86], [.86, .5]], x, y, s, 1); M.poly([[.38, .94], [.62, .94]], x, y, s, 1); for (const ox of [.36, .62]) M.poly([[ox, .4], [ox - .07, .28], [ox + .05, .16], [ox - .02, .04]], x, y, s, 2); },
    fish: (M, x, y, s) => { M.poly([[.1, .5], [.3, .28], [.56, .26], [.74, .5], [.56, .74], [.3, .72]], x, y, s, 1, true); M.poly([[.74, .5], [.94, .28], [.94, .72]], x, y, s, 1, true); M.set(x + s * .28, y + s * .45, 2); M.poly([[.44, .4], [.5, .5], [.44, .6]], x, y, s, 2); },
    bottle: (M, x, y, s) => { M.poly([[.42, .04], [.58, .04], [.58, .3], [.74, .46], [.74, .95], [.26, .95], [.26, .46], [.42, .3]], x, y, s, 1, true); M.poly([[.26, .62], [.74, .62]], x, y, s, 2); M.poly([[.26, .78], [.74, .78]], x, y, s, 2); },
    gear: (M, x, y, s) => { M.poly([...Array(8)].map((_, k) => [.5 + Math.cos(k * PI / 4 + .39) * .45, .5 + Math.sin(k * PI / 4 + .39) * .45]), x, y, s, 1, true); M.arc(x + s / 2, y + s / 2, s * .17, 0, PI * 2, 2); },
    heart: (M, x, y, s) => { M.arc(x + s * .3, y + s * .34, s * .21, PI * .8, PI * 2, 1); M.arc(x + s * .7, y + s * .34, s * .21, PI, PI * 2.2, 1); M.poly([[.11, .46], [.5, .92], [.89, .46]], x, y, s, 1); },
    eye: (M, x, y, s) => { M.poly([...Array(9)].map((_, i) => [.06 + i * .11, .5 - Math.sin(i / 8 * PI) * .3]), x, y, s, 1); M.poly([...Array(9)].map((_, i) => [.06 + i * .11, .5 + Math.sin(i / 8 * PI) * .3]), x, y, s, 1); M.arc(x + s / 2, y + s / 2, s * .14, 0, PI * 2, 2); },
    // 自作の記号（字ではない）：ひし形・三角・山形・的・長さのちがう棒・半円・砂時計など、図形だけを組み合わせる
    glyph: (M, x, y, s, sd, v = 1) => { const k = Math.floor(hash(sd, 1, 2) * 10) % 10, P = (pts, c) => M.poly(pts, x, y, s, v, c), v2 = v;
      if (k === 0) P([[.5, 0], [1, .5], [.5, 1], [0, .5]], true); else if (k === 1) { P([[.5, .05], [1, .95], [0, .95]], true); M.set(x + s * .5, y + s * .65, v2); }
      else if (k === 2) { P([[0, .45], [.5, 0], [1, .45]]); P([[0, .95], [.5, .5], [1, .95]]); } else if (k === 3) { M.arc(x + s / 2, y + s / 2, s * .48, 0, PI * 2, v); M.arc(x + s / 2, y + s / 2, s * .12, 0, PI * 2, v2); }
      else if (k === 4) { P([[0, .1], [1, .1]]); P([[.2, .5], [.8, .5]]); P([[.4, .9], [.6, .9]]); } else if (k === 5) { M.arc(x + s / 2, y + s * .55, s * .48, PI, PI * 2, v); P([[0, .95], [1, .95]]); }
      else if (k === 6) P([[0, 0], [1, 0], [0, 1], [1, 1]], true); else if (k === 7) { P([[0, 1], [0, .6]]); P([[.33, 1], [.33, .4]]); P([[.66, 1], [.66, .2]]); P([[1, 1], [1, 0]]); }
      else if (k === 8) { P([[0, .05], [1, .05], [.5, .95]], true); P([[.3, .4], [.7, .4]]); } else { P([[0, 0], [1, 0], [1, 1], [0, 1]], true); P([[0, 1], [1, 0]]); } } };
  def('neon', 1, (o = {}) => { const sh = o.shape || 'sq', w = sh === 'wide' ? 64 : sh === 'tall' ? 16 : 32, h = sh === 'tall' ? 48 : 32, P = Px(w, h), c = o.c || LIGHT.pink, c2 = o.c2 || c, bg = o.bg === undefined ? '#1e1b34' : o.bg, k = o.kind || 'ring', sd = o.seed || 0, M = Mask(w, h); P.clip = true;
    if (bg) { const Bg = ramp(bg); P.each((x, y) => (x < 1 || y < 1) ? Bg[4] : (x > w - 2 || y > h - 2) ? Bg[1] : Bg[3]); for (const [x, y] of [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]]) P.set(x, y, Bg[5]); }
    if (sh === 'sq') (ICON[k] || ICON.ring)(M, 4, 4, 23, sd);
    else if (sh === 'wide') { if (k === 'glyphs') for (let i = 0; i < 4; i++) ICON.glyph(M, 7 + i * 14, 10, 10, sd * 7 + i, i % 2 ? 2 : 1); else { ICON[k](M, 5, 5, 21, sd); for (let i = 0; i < 2; i++) ICON.glyph(M, 34 + i * 14, 10, 10, sd * 7 + i, 2); } }
    else { if (k !== 'glyphs') ICON[k](M, 3, 3, 10, sd); for (let i = k === 'glyphs' ? 0 : 1; i < 3; i++) ICON.glyph(M, 3, 4 + i * 15, 9, sd * 7 + i, k === 'glyphs' ? 1 : 2); }
    if (o.border) { const v = 2; for (let x = 2; x < w - 2; x++) { if (x % 6 !== 5) { M.set(x, 1, v); M.set(x, h - 2, v); } } for (let y = 2; y < h - 2; y++) if (y % 6 !== 5) { M.set(1, y, v); M.set(w - 2, y, v); } }
    const col = v => v === 2 ? c2 : c, dim = bg || '#000000';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = M.d[y * w + x]; if (v) { P.set(x, y, mix(col(v), '#ffffff', .72)); continue; } let n1 = 0, n2 = 0;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const q = M.d[yy * w + xx]; if (!q) continue; if (Math.abs(i) + Math.abs(j) === 1) n1 = q; else if (Math.abs(i) + Math.abs(j) <= 2) n2 = n2 || q; }
      if (n1) P.set(x, y, col(n1)); else if (n2 && bg) P.set(x, y, mix(col(n2), dim, .62)); }
    return P; }, o => o.bg === null || o.bg === false);
  // ちょうちん（よこ＝まわり、たて＝高さ。まん中が明るい）
  def('lantern', 1, (o = {}) => { const P = Px(32), k = o.kind || 'red', L = k === 'white' ? ['#c89a68', '#f0d498', '#fff0c0', '#fffbe4'] : k === 'yellow' ? ['#c8781c', '#f4ac30', '#ffd860', '#fff2b0'] : ['#b02c1c', '#e8502c', '#ff8a3a', '#ffc868'], D = '#2a2028', mk = o.mark ?? 1;
    P.each((x, y) => { if (y < 4 || y > 27) return y === 3 || y === 28 ? '#c8a04a' : D; const v = Math.abs(y - 15.5) / 12, t = v < .3 ? 3 : v < .62 ? 2 : v < .88 ? 1 : 0; return (y % 4 === 0) ? L[Math.max(0, t - 1)] : L[t]; });
    if (mk) { const M = Mask(32, 32); M.arc(8, 15.5, 4.5, 0, PI * 2); M.poly([[.5, 0], [1, .5], [.5, 1], [0, .5]], 20, 11, 9, 1, true); for (let i = 0; i < 1024; i++) if (M.d[i]) P.set(i % 32, (i / 32) | 0, D); }
    return P; });
  def('bulb', .2, () => { const P = Px(8); P.clip = true; P.each((x, y) => { if (y < 2) return x > 1 && x < 6 ? (y ? '#5a5560' : '#3a3644') : null; const d = Math.hypot(x - 3.5, y - 4.8); return d < 1.6 ? '#ffffff' : d < 2.7 ? '#fff0c0' : d < 3.6 ? '#ffd27a' : null; }); return P; }, true);
  // あかりのついた店先（ショーウィンドウ）。kind: 'goods'（びん・箱）/ 'food'（つるした物と なべ）/ 'parts'（歯車・工具）/ 'room'（のれんの奥の店の中）
  def('shopwin', 1.5, (o = {}) => { const P = Px(32), F = ramp(o.frame || '#4a4450'), k = o.kind || 'goods', lit = o.lit ?? 1, L = lit ? ['#e88c2c', '#f6b446', '#fbd67a', '#fff0c0'] : ['#1e2440', '#28305a', '#343e70', '#4a568c'], S = lit ? '#6a3a20' : '#141830', sd = o.seed || 0, cs = lit ? ['#c2382e', '#2f7a8a', '#5a8a3a', '#f4ead2', '#8a4a8a'] : ['#2a3260', '#34407a', '#28305a']; P.clip = true;
    P.each((x, y) => (x < 2 || y < 2 || x > 29 || y > 29) ? F[(x < 1 || y < 1) ? 5 : (x > 30 || y > 30) ? 1 : 3] : L[y < 8 ? 3 : y < 17 ? 2 : y < 25 ? 1 : 0]);
    if (k === 'room') { P.rect(2, 20, 28, 10, S); P.rect(2, 20, 28, 1, L[3]); for (let i = 0; i < 5; i++) { P.rect(4 + i * 5, 6, 3, 5, cs[i % cs.length]); P.rect(4 + i * 5, 6, 3, 1, L[3]); } P.rect(2, 12, 28, 1, S); for (let i = 0; i < 4; i++) P.rect(5 + i * 6, 14, 4, 4, cs[(i + 2) % cs.length]); P.rect(22, 15, 6, 5, '#f4ead2'); P.rect(23, 14, 4, 1, L[3]); }
    else { for (const sy of [13, 22]) { P.rect(2, sy, 28, 1, S); for (let i = 0; i < 6; i++) { const r = hash(i, sy, sd), c = cs[Math.floor(r * 17) % cs.length], x = 4 + i * 4 + (r > .5 ? 1 : 0);
          if (k === 'parts') { if (i % 2) { P.disc(x + 1.5, sy - 3, 2.4, c); P.set(x + 1, sy - 3, S); } else { P.rect(x, sy - 5, 1, 5, S); P.rect(x - 1, sy - 6, 3, 2, c); } }
          else if (r < .5) { P.rect(x, sy - 5, 2, 5, c); P.set(x, sy - 6, S); P.set(x, sy - 5, L[3]); } else { P.rect(x, sy - 4, 3, 4, c); P.rect(x, sy - 4, 3, 1, L[3]); } } }
      if (k === 'food') { for (let i = 0; i < 5; i++) { const x = 5 + i * 5; P.rect(x, 2, 1, 2 + (i % 2), S); P.rect(x - 1, 4 + (i % 2), 3, 4, i % 2 ? '#c2382e' : '#a8622c'); P.set(x - 1, 4 + (i % 2), L[3]); } }
      for (let q = 0; q < 9; q++) { P.set(6 + q, 11 - q, L[3]); if (q < 6) P.set(21 + q, 28 - q, L[2]); } P.rect(2, 26, 28, 4, F[2]); P.rect(2, 26, 28, 1, F[4]); }
    return P; });
  def('vend', 1, (o = {}) => { const P = Px(32, 64), M = ramp(o.c || '#d8dce4'), cs = ['#e2503c', '#f2a23a', '#3f8ac0', '#8ab84a', '#f4f0e0']; P.clip = true;
    P.each((x, y) => (x < 2 || x > 29 || y < 2 || y > 61) ? M[x < 1 || y < 1 ? 5 : 2] : y < 36 ? (y < 4 || x < 4 || x > 27 ? '#ffe8a8' : '#fff8dc') : y > 44 && y < 51 && x > 5 && x < 21 ? '#22202c' : y > 55 ? M[2] : M[4]);
    for (let j = 0; j < 3; j++) for (let k = 0; k < 6; k++) { P.rect(4 + k * 4, 5 + j * 10, 3, 6, cs[(k + j * 2) % 5]); P.rect(4 + k * 4, 5 + j * 10, 3, 1, '#ffffff'); P.rect(4 + k * 4, 12 + j * 10, 3, 1, k % 3 ? '#3f8ac0' : '#e2503c'); }
    P.rect(23, 39, 5, 3, '#22202c'); P.rect(24, 40, 3, 1, '#7af09a'); P.rect(23, 45, 2, 5, M[1]); P.rect(6, 51, 15, 1, M[5]); for (let x = 3; x < 29; x += 3) P.set(x, 58, M[1]); return P; });
  // ---- 布 ----
  def('noren', 1, (o = {}) => { const P = Px(32), A = ramp(o.c || '#2f4a8a'), B = o.c2 || '#f4ead2', k = o.kind || 'ring'; P.clip = true;
    P.each((x, y) => { const p = x % 8; return tone(A, y < 3 ? 2 : p === 0 ? 4 : p === 6 ? 2 : p === 7 ? 1 : 3); });
    const M = Mask(32, 32); if (k === 'ring') { M.arc(15.5, 14, 6, 0, PI * 2); M.arc(15.5, 14, 2, 0, PI * 2); } else if (k === 'wave') { ICON.wave(M, 4, 4, 22); } else if (k === 'dots') { for (const x of [6, 15.5, 25]) M.arc(x, 14, 2.4, 0, PI * 2); } else for (const y of [9, 14, 19]) M.line(5, y, 26, y);
    for (let i = 0; i < 1024; i++) if (M.d[i]) { const x = i % 32, y = (i / 32) | 0; P.set(x, y, B); P.set(x + 1, y, B); }
    P.each((x, y, c) => y < 2 ? (y ? '#3a2a22' : '#7a5a3c') : (y > 9 && x % 8 === 7) || y > 27 + ((x >> 3) % 2) * 2 || (y > 26 && (x % 8 === 0 || x % 8 === 6)) ? null : undefined); return P; }, true);
  def('hood', 1, (o = {}) => { const P = R.paint.fabric({ c: o.c || '#c2453a', c2: o.c2 || '#f0e2c4', scallop: o.scallop }), A = ramp(o.c2 || '#f0e2c4'), D = ramp(o.c || '#c2453a'), sd = o.seed || 0;
    P.each((x, y, c) => c && tn(x, y, 16, 8, 32, 32, sd) > .78 ? mix(c, '#5a4030', .22) : undefined);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) if (P.get(18 + i, 6 + j)) P.set(18 + i, 6 + j, j === 0 || i === 0 || j === 6 || i === 8 ? ((i + j) & 1 ? A[1] : D[1]) : mix(PAL[3], '#ffffff', .15)); return P; }, o => !!o.scallop);
  def('laundry', 3, () => { const P = Px(64, 16), W = ramp('#ece8dc'), Bp = ramp('#5a7ab0'), Pk = ramp('#e89aa8'), Y = ramp('#e8c45a'), Tq = ramp(PAL[1]); P.clip = true; P.rect(0, 0, 64, 1, '#4a4450');
    const hang = (x, w, h, M, st) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P.set(x + i, 1 + j, tone(M, i === 0 ? 4 : i === w - 1 ? 1 : (st && (j % 4) < 2) ? 2 : (i * 5 + j) % 11 === 0 ? 2 : 3)); P.set(x + 1, 0, '#c8a04a'); P.set(x + w - 2, 0, '#c8a04a'); };
    hang(2, 9, 10, W); P.rect(0, 2, 2, 4, W[3]); P.rect(11, 2, 2, 4, W[2]); hang(15, 7, 13, Tq, 1); hang(24, 8, 12, Bp); P.rect(27, 6, 2, 7, null); hang(35, 6, 6, Pk); hang(43, 11, 9, Y, 1); hang(56, 5, 7, W); return P; }, true);
  // ---- 配管・機械 ----
  def('pipe', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#7a8494'), sd = o.seed || 0, W = [3, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 1, 2, 2, 3, 3];
    P.each((x, y) => { let t = W[x >> 1]; const s = y % 32; if (s === 0) return M[0]; if (s === 1) t += 1; if (s === 31) t -= 1; const n = tn(x, y, 8, 8, 32, 32, sd); if (n > .84) return tone(RUST, t - 1); if (n > .79 && ((x + y) & 1)) return tone(RUST, t); return tone(M, t); });
    if (o.band) { const B = ramp(o.band); for (let y = 12; y < 18; y++) for (let x = 0; x < 32; x++) P.set(x, y, tone(B, W[x >> 1] - (y === 17 ? 1 : 0) + (y === 12 ? 1 : 0))); } return P; });
  def('drum', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || PAL[1]), B = ramp(o.c2 || '#e8c040'), sd = o.seed || 0, mk = o.mark || 'diamond', W = [3, 3, 4, 4, 3, 3, 2, 2];
    P.each((x, y) => { let t = W[(x >> 2) & 7]; if (y < 2) t = y ? 1 : 5; else if (y === 10 || y === 20) t = 5; else if (y === 11 || y === 21) t = 1; else if (y === 31) t = 0;
      if (mk === 'band' && y > 12 && y < 19) return ((x + y) >> 2) & 1 ? tone(B, t) : '#2e2c3a'; if (y > 24 && tn(x, y, 8, 4, 32, 32, sd) * 10 > 31 - y + 3) return tone(RUST, t - 1); if (hash(x >> 1, 2, sd) < .2 && y > 11 && y < 13 + hash(x >> 1, 3, sd) * 6) return tone(RUST, t - 1); return tone(M, t); });
    if (mk === 'diamond') { for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (Math.abs(i) + Math.abs(j) <= 4) P.set(8 + i, 15 + j, Math.abs(i) + Math.abs(j) === 4 ? '#2e2c3a' : B[3]); P.rect(7, 13, 2, 3, '#2e2c3a'); P.set(8, 17, '#2e2c3a'); P.set(7, 17, '#2e2c3a'); }
    return P; });
  def('drumTop', .7, (o = {}) => { const P = Px(16), M = ramp(o.c || PAL[1]); P.clip = true; P.each((x, y) => { const d = Math.hypot(x - 7.5, y - 7.5); return d > 8 ? null : d > 6.6 ? M[y < 8 ? 5 : 1] : d > 5.6 ? M[1] : d < 1.3 ? M[2] : M[y < 7 ? 3 : 2]; }); P.rect(10, 4, 2, 2, M[5]); P.set(11, 5, M[0]); P.set(4, 10, M[5]); P.set(4, 11, M[0]); return P; }, true);
  def('panel', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#6c8a84', 6, { contrast: .85 }); P.clip = true; P.block(0, 0, 32, 32, M, 3);
    for (let j = 0; j < 4; j++) { P.rect(3, 3 + j * 3, 15, 1, M[0]); P.rect(3, 4 + j * 3, 15, 1, M[5]); } P.disc(24.5, 8.5, 4.4, '#3a3644'); P.disc(24.5, 8.5, 3.4, '#f0e8d0'); P.line(24, 9, 26, 6, '#d83a2c'); P.set(24, 9, '#2a2028');
    P.rect(3, 17, 4, 3, '#7af09a'); P.rect(3, 17, 4, 1, '#d8ffe0'); P.rect(9, 17, 4, 3, '#ff5a4a'); P.rect(9, 17, 4, 1, '#ffc8b8'); P.rect(15, 17, 4, 3, '#4a2a20'); P.rect(22, 16, 7, 5, M[2]); P.rect(23, 17, 5, 1, M[0]); P.rect(23, 19, 5, 1, M[0]);
    for (let y = 24; y < 29; y++) for (let x = 2; x < 30; x++) P.set(x, y, ((x + y) >> 2) & 1 ? (y === 24 ? '#f4d868' : '#e0aa2c') : '#2e2c3a'); for (const [x, y] of [[1, 1], [29, 1], [1, 29], [29, 29]]) { P.set(x, y, M[5]); P.set(x + 1, y + 1, M[0]); } return P; });
  def('grille', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#b8b4a4', 6, { contrast: .85 }), sd = o.seed || 0; P.clip = true; P.block(0, 0, 32, 32, M, 3);
    P.each((x, y) => { const d = Math.hypot(x - 12, y - 14.5); if (d < 10.5) return d > 9.5 ? M[1] : d < 2 ? M[4] : (Math.round(d) % 3 === 0) ? M[4] : (Math.abs(x - 12) < 1 || Math.abs(y - 14.5) < 1) ? M[4] : '#2a2838'; if (x > 24 && x < 30 && y > 4 && y < 26) return y % 3 === 0 ? M[0] : y % 3 === 1 ? M[5] : undefined; if (y > 27 && tn(x, y, 8, 4, 32, 32, sd) > .5) return tone(RUST, 2); });
    P.rect(2, 30, 5, 2, M[0]); P.rect(25, 30, 5, 2, M[0]); return P; });
  def('meter', .3, () => { const P = Px(16); P.clip = true; P.each((x, y) => { const d = Math.hypot(x - 7.5, y - 7.5); return d > 7.6 ? null : d > 6 ? (y < 8 ? '#e8c46a' : '#8a6a2c') : (d > 4.4 && (Math.round(Math.atan2(y - 7.5, x - 7.5) * 4) % 2 === 0) && y < 10) ? '#3a3644' : '#f4ecd8'; }); P.line(7, 8, 11, 4, '#d83a2c'); P.set(7, 8, '#2a2028'); P.set(8, 8, '#2a2028'); return P; }, true);
  def('valve', .4, (o = {}) => { const P = Px(16), M = ramp(o.c || '#d0442e'); P.clip = true; P.each((x, y) => { const dx = x - 7.5, dy = y - 7.5, d = Math.hypot(dx, dy); return d > 7.8 ? null : d > 5.4 ? M[dy < -dx ? 5 : 2] : d < 2 ? M[d < 1 ? 5 : 3] : (Math.abs(dx) < 1 || Math.abs(dy) < 1 || Math.abs(Math.abs(dx) - Math.abs(dy)) < .8) ? M[3] : null; }); return P; }, true);
  def('blade', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#9aa0b0'); P.clip = true; P.each((x, y) => { const dx = x - 15.5, dy = y - 15.5, d = Math.hypot(dx, dy); if (d < 3.2) return M[d < 1.5 ? 5 : 2]; if (d > 15) return null; const a = ((Math.atan2(dy, dx) + d * .035 + PI * 2) % (PI / 2)) / (PI / 2); return a < .56 ? M[a < .1 ? 5 : a > .44 ? 1 : 3] : null; }); return P; }, true);
  def('turbine', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#a8acb8'); P.each((x, y) => { const s = (x + (y >> 2)) % 8; return y < 2 || y > 29 ? M[1] : M[s < 2 ? 5 : s < 5 ? 3 : s < 6 ? 1 : 0]; }); return P; });
  def('mesh', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#8a909c'); P.clip = true; P.each((x, y) => { if (o.bar && (y < 2 || y > 29)) return M[y === 0 || y === 30 ? 5 : 1]; const a = (x + y) % 8 === 0, b = ((x - y) % 8 + 8) % 8 === 0; return a && b ? M[5] : a ? M[4] : b ? M[2] : null; }); return P; }, true);
  def('ladder', 1, (o = {}) => { const P = Px(16, 32), M = ramp(o.c || '#8a8c9c'); P.clip = true; P.each((x, y) => (x === 1 || x === 13) ? M[5] : (x === 2 || x === 14) ? M[2] : (x > 2 && x < 13 && y % 8 === 3) ? M[4] : (x > 2 && x < 13 && y % 8 === 4) ? M[1] : null); return P; }, true);
  def('rail', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#6a6e84'); P.clip = true; P.each((x, y) => y < 3 ? M[y === 0 ? 5 : y === 2 ? 1 : 3] : (y === 14 || y === 15) ? M[y === 14 ? 4 : 1] : (x % 16 < 2) ? M[x % 16 ? 2 : 4] : y > 29 ? M[y === 30 ? 4 : 1] : null); return P; }, true);
  def('stair', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#6a6e84'); P.each((x, y) => { const s = y % 8; return x < 2 || x > 29 ? M[1] : s === 0 ? M[5] : s < 4 ? ((x + s) % 4 === 0 ? M[2] : M[4]) : s === 4 ? M[1] : M[0]; }); return P; });
  def('antenna', 1, () => { const P = Px(16, 32), M = ramp('#9a9cac'); P.clip = true; P.rect(7, 2, 2, 30, M[3]); P.rect(7, 2, 1, 30, M[5]); for (const [y, w] of [[4, 7], [9, 5], [14, 6]]) { P.rect(8 - w, y, w * 2, 1, M[4]); P.set(8 - w, y + 1, M[1]); P.set(7 + w, y + 1, M[1]); } P.line(8, 20, 13, 26, M[2]); P.rect(12, 26, 3, 2, M[4]); return P; }, true);
  // ---- 小物・乗りもの ----
  def('scrap', 2.5, (o = {}) => { const P = Px(64), sd = o.seed || 0, cs = o.cs || [PAL[0], '#7a8090', PAL[1], PAL[2], '#8a5a3c', '#9a9ca8']; P.fill('#3a3442');
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const r = hash(i, j, sd), M = ramp(cs[(i * 3 + j * 5 + sd) % cs.length]), x = i * 16 + Math.floor(hash(i, j, sd + 2) * 6) - 2 + (j % 2) * 8, y = j * 16 + Math.floor(hash(i, j, sd + 3) * 6) - 2;
      if (r < .4) { const w = 14 + Math.floor(r * 16), h = 10 + Math.floor(hash(i, j, sd + 4) * 7); P.block(x, y, w, h, M, 3); P.rect(x + 1, y + 1, w - 2, 1, M[5]); P.set(x + 2, y + 3, M[5]); P.set(x + w - 3, y + h - 3, M[0]); if (r < .2) for (let q = 3; q < w - 2; q += 4) { P.rect(x + q, y + 3, 1, h - 5, M[1]); P.rect(x + q + 1, y + 3, 1, h - 5, M[4]); } else for (let q = 0; q < 5; q++) P.set(x + 4 + q, y + h - 4 - q, tone(RUST, 2)); }
      else if (r < .64) { const hz = r < .52, len = 19; for (let q = 0; q < len; q++) for (let k = 0; k < 5; k++) P.set(hz ? x + q : x + k, hz ? y + k : y + q, q % 9 === 0 ? M[0] : q % 9 === 1 ? M[5] : M[[5, 4, 3, 2, 0][k]]); }
      else if (r < .86) { P.disc(x + 8, y + 8, 7.6, M[0]); P.disc(x + 8, y + 8, 6.6, M[3]); P.disc(x + 7, y + 7, 4.6, M[4]); P.disc(x + 8, y + 8, 2.6, '#2a2634'); for (let k = 0; k < 8; k++) P.rect(x + 7 + Math.round(Math.cos(k * PI / 4) * 7.6), y + 7 + Math.round(Math.sin(k * PI / 4) * 7.6), 2, 2, M[2]); }
      else { P.rect(x, y + 4, 16, 3, tone(RUST, 3)); P.rect(x, y + 7, 16, 1, RUST[1]); P.rect(x + 6, y - 2, 3, 16, tone(RUST, 4)); P.rect(x + 9, y - 2, 1, 16, RUST[1]); } }
    return P; });
  def('tire', 1, (o = {}) => { const P = Px(32), M = ramp('#34323e', 6, { contrast: 1.3 }), S = ramp(o.c || '#a8acb8'), hub = (o.kind || 'hub') === 'hub'; P.clip = true;
    P.each((x, y) => { const dx = x - 15.5, dy = y - 15.5, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); if (d > 15.6) return null; if (d > 13.2) return Math.floor((a + PI) * 7) % 2 ? M[4] : M[1]; if (d > 7.6) return d > 11.6 && dy < -dx * .3 ? M[4] : d < 8.8 ? M[1] : M[3];
      if (!hub) return null; if (d > 6.2) return S[dy < 0 ? 5 : 1]; if (d < 1.6) return S[1]; return Math.abs(d - 4) < .9 && Math.floor((a + PI) / (PI * .4) + .5) !== Math.floor((a + PI) / (PI * .4)) ? S[1] : S[dy < -dx ? 4 : 3]; }); return P; }, true);
  def('tread', .5, () => { const P = Px(16), M = ramp('#34323e', 6, { contrast: 1.3 }); P.each((x, y) => { const s = (y + Math.abs(x - 7.5) | 0) % 4; return x < 1 || x > 14 ? M[1] : s === 0 ? M[0] : s === 1 ? M[4] : M[3]; }); return P; });
  def('poster', .5, (o = {}) => { const P = Px(16, 24), k = (o.kind || 0) % 6, M = ramp(['#e8dcc0', '#e8c8a0', '#c8dcd0', '#f0e0a8', '#e0c0c8', '#d8d4c4'][k]), ink = ['#b8302a', '#2a4a8a', '#2f7a5a', '#8a3a8a', '#c2702a', '#3a3644'][k]; P.clip = true;
    P.each((x, y) => (x < 1 || y < 1) ? M[5] : (x > 14 || y > 22) ? M[1] : tn(x, y, 8, 8, 16, 24, k) > .72 ? M[2] : M[3]); P.rect(2, 2, 12, 1, ink);
    if (k === 0) { P.disc(8, 9, 4, ink); P.disc(8, 9, 2, M[4]); P.rect(3, 16, 10, 1, ink); P.rect(3, 18, 7, 1, ink); } else if (k === 1) { P.line(3, 9, 12, 9, ink); P.line(9, 6, 12, 9, ink); P.line(9, 12, 12, 9, ink); for (let y = 15; y < 21; y += 2) P.rect(3, y, 10, 1, ink); }
    else if (k === 2) { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) P.rect(3 + i * 4, 5 + j * 4, 3, 3, (i + j) % 2 ? ink : M[1]); P.rect(3, 18, 10, 2, ink); } else if (k === 3) { P.line(3, 6, 7, 12, ink); P.line(7, 12, 9, 7, ink); P.line(9, 7, 13, 14, ink); P.rect(3, 17, 10, 1, ink); P.rect(5, 19, 6, 1, ink); }
    else if (k === 4) { P.disc(8, 10, 3, ink); for (let a = 0; a < 8; a++) P.set(8 + Math.round(Math.cos(a * PI / 4) * 5), 10 + Math.round(Math.sin(a * PI / 4) * 5), ink); P.rect(3, 18, 10, 2, ink); } else { P.rect(3, 5, 10, 6, ink); P.rect(4, 6, 8, 4, M[4]); P.rect(3, 13, 10, 1, ink); P.rect(3, 15, 10, 1, ink); P.rect(3, 17, 6, 1, ink); }
    for (let q = 0; q < 4; q++) for (let i = 0; i < 4 - q; i++) P.set(15 - i, 23 - q, null); P.set(1, 1, '#fff8e0'); P.set(14, 1, '#fff8e0'); return P; }, true);
  def('counter', 1.2, () => { const P = Px(32, 16), W = ramp('#9a6e44'); P.clip = true; P.each((x, y) => W[y === 0 ? 5 : y === 15 ? 1 : (y % 5 === 4) ? 2 : (x * 3 + y) % 13 === 0 ? 2 : 3]);
    for (const [x, c] of [[3, '#e8892c'], [12, '#c2382e']]) { P.rect(x, 4, 7, 6, '#f4ecd8'); P.rect(x + 1, 5, 5, 4, c); P.set(x + 2, 6, '#ffe8a0'); P.set(x + 4, 7, '#f4ecd8'); P.rect(x, 10, 7, 1, W[1]); } P.rect(22, 3, 2, 8, '#5a8a3a'); P.rect(25, 5, 2, 6, '#3f6ab0'); P.rect(28, 6, 2, 5, '#f4ecd8'); P.set(22, 3, '#d8ffc0'); return P; });
  // 自転車（横から見た絵。64×32 ＝ 1.8 m × .9 m）
  def('bike', 1.8, (o = {}) => { const P = Px(64, 32), F = ramp(o.c || '#3f8a8a'), S = '#b8bcc8', D = '#2a2834', M = Mask(64, 32); P.clip = true;
    for (const cx of [12, 51]) { M.arc(cx, 20, 10.5, 0, PI * 2, 1); for (let k = 0; k < 6; k++) M.line(cx, 20, cx + Math.cos(k * PI / 3 + .3) * 9, 20 + Math.sin(k * PI / 3 + .3) * 9, 2); }
    for (let i = 0; i < 2048; i++) if (M.d[i]) P.set(i % 64, (i / 64) | 0, M.d[i] === 1 ? D : S); for (const cx of [12, 51]) { P.set(cx, 20, S); P.set(cx + 1, 20, S); }
    const L = (a, b, c, d, col) => { P.line(a, b, c, d, col); P.line(a, b + 1, c, d + 1, col); }; L(12, 20, 28, 20, F[3]); L(28, 20, 22, 7, F[3]); L(22, 8, 42, 8, F[4]); L(28, 20, 43, 9, F[2]); L(43, 6, 51, 20, F[3]); L(12, 20, 22, 8, F[2]);
    P.rect(18, 4, 9, 2, D); P.rect(19, 4, 7, 1, '#5a4a40'); P.rect(40, 3, 6, 2, D); P.rect(42, 5, 2, 3, S); P.rect(27, 19, 3, 3, S); P.rect(26, 23, 5, 1, D); P.rect(4, 12, 10, 1, S); P.rect(3, 9, 9, 3, o.box || '#8f6a44'); P.rect(3, 9, 9, 1, '#c8a070'); return P; }, true);
  def('moto', 2, (o = {}) => { const P = Px(64, 32), F = ramp(o.c || '#c2453a'), S = ramp('#a8acb8'), D = '#2a2834'; P.clip = true;
    const L = (a, b, c, d, col, w = 2) => { for (let k = 0; k < w; k++) P.line(a, b + k, c, d + k, col); };
    L(14, 22, 28, 12, S[2]); L(28, 12, 46, 12, S[3]); L(46, 10, 52, 23, S[4]); L(22, 22, 40, 22, S[1]); P.rect(24, 14, 14, 8, S[2]); P.rect(25, 15, 12, 2, S[4]); P.rect(26, 18, 4, 3, D); P.rect(32, 18, 5, 3, S[1]);
    P.rect(30, 7, 14, 6, F[3]); P.rect(30, 7, 14, 1, F[5]); P.rect(30, 12, 14, 1, F[1]); P.rect(42, 8, 2, 4, F[4]); P.rect(16, 9, 14, 4, D); P.rect(16, 9, 14, 1, '#6a5048'); P.rect(11, 11, 6, 3, F[2]); P.rect(10, 12, 2, 2, '#ff5a4a');
    P.rect(46, 4, 2, 7, S[3]); P.rect(44, 3, 7, 2, D); P.rect(49, 7, 4, 4, '#fff0b0'); P.rect(49, 7, 4, 1, S[5]); L(8, 24, 24, 24, S[3], 2); P.rect(6, 23, 4, 4, S[1]); P.rect(8, 13, 12, 2, F[1]); P.rect(46, 14, 10, 2, F[1]); return P; }, true);
  // 古い電車（横 64×32 ＝ 6 m × 2.6 m）。kind: 'pass'（客車）/ 'box'（貨車）
  def('train', 6, (o = {}) => { const P = Px(64, 32), k = o.kind || 'pass', M = ramp(o.c || (k === 'box' ? '#8a4a34' : PAL[1])), B = ramp(o.c2 || '#e8dcbc'), G = ramp('#5a5868'), sd = o.seed || 0, wr = o.wreck ? 1 : 0, lit = o.lit, glass = new Set();
    if (k === 'box') { P.each((x, y) => y < 2 ? G[y ? 2 : 4] : y > 28 ? G[y === 29 ? 4 : 1] : tone(M, x % 4 === 0 ? 1 : x % 4 === 1 ? 4 : 3 - ((x >> 2) % 3 === 0 ? .6 : 0)));
      P.block(22, 3, 20, 25, M, 2); P.line(23, 4, 40, 26, M[1]); P.line(40, 4, 23, 26, M[1]); P.line(23, 5, 40, 27, M[4]); P.rect(22, 2, 20, 1, G[5]); P.rect(30, 14, 3, 4, G[4]); P.rect(5, 18, 7, 7, B[3]); P.rect(6, 19, 5, 2, M[2]); P.rect(6, 22, 3, 2, M[2]); P.rect(48, 20, 10, 1, B[3]); P.rect(48, 22, 6, 1, B[3]); P.rect(48, 24, 8, 1, B[3]); }
    else { P.each((x, y) => y < 3 ? G[y === 0 ? 4 : y === 2 ? 1 : 3] : y < 15 ? B[y === 3 ? 5 : 3] : y < 17 ? B[y === 15 ? 2 : 4] : y > 28 ? G[y === 29 ? 3 : 1] : M[y === 17 ? 5 : y === 27 ? 1 : y === 26 && x % 4 === 1 ? 5 : 3]);
      for (const [x, i] of [[3, 0], [14, 1], [41, 2], [52, 3]]) { const dead = wr && hash(i, sd, 3) < .5, on = lit && !dead && hash(i, sd, 4) < .8; P.rect(x - 1, 5, 11, 9, G[1]);
        for (let j = 0; j < 7; j++) for (let q = 0; q < 9; q++) { if (on && q !== 4) glass.add((6 + j) * 64 + x + q); P.set(x + q, 6 + j, dead ? (j % 3 === 2 ? '#5a4030' : '#8a6a44') : on ? (j < 2 ? '#fff0c0' : j < 5 ? '#fbd67a' : '#f6b446') : (q + j === 6 || q + j === 7) ? '#a8c0e0' : j > 4 ? '#3a4a78' : '#2a3460'); } P.rect(x + 4, 6, 1, 7, G[2]); }
      P.rect(26, 4, 12, 25, M[2]); P.rect(27, 5, 10, 23, M[3]); P.rect(31, 5, 1, 23, M[1]); P.rect(32, 5, 1, 23, M[5]); for (const x of [28, 33]) for (let j = 0; j < 7; j++) { P.rect(x, 7 + j, 3, 1, lit && !wr ? '#fbd67a' : j > 4 ? '#3a4a78' : '#2a3460'); if (lit && !wr) for (let q = 0; q < 3; q++) glass.add((7 + j) * 64 + x + q); } P.rect(30, 17, 1, 3, G[5]); P.rect(33, 17, 1, 3, G[5]); }
    const rust = wr ? .9 : .4; P.each((x, y, c) => { const n = tn(x, y, 8, 8, 64, 32, sd + 2); if ((y > 20 && y < 29 && n * 12 > 29 - y + (1 - rust) * 5) || (wr && n > .76)) return ((x + y) & 1) || n > .6 ? tone(RUST, y > 25 ? 1 : 2) : c; }); if (o.only) P.each((x, y, c) => glass.has(y * 64 + x) ? c : null); return P; }, o => !!o.only);
  def('trainEnd', 2.6, (o = {}) => { const P = Px(32), k = o.kind || 'pass', M = ramp(o.c || (k === 'box' ? '#8a4a34' : PAL[1])), B = ramp(o.c2 || '#e8dcbc'), G = ramp('#5a5868'), sd = o.seed || 0; P.clip = true;
    if (k === 'box') { P.each((x, y) => y < 2 ? G[3] : y > 28 ? G[1] : tone(M, x % 4 === 0 ? 1 : x % 4 === 1 ? 4 : 3)); for (let y = 6; y < 27; y += 5) { P.rect(22, y, 7, 1, G[5]); P.rect(22, y + 1, 7, 1, G[0]); } P.rect(22, 4, 1, 24, G[4]); P.rect(28, 4, 1, 24, G[4]); }
    else { P.each((x, y) => y < 3 ? G[y === 0 ? 4 : 3] : y < 15 ? B[3] : y < 17 ? B[4] : y > 28 ? G[1] : M[y === 17 ? 5 : 3]); for (const x of [3, 21]) { P.rect(x - 1, 5, 10, 9, G[1]); for (let j = 0; j < 7; j++) for (let q = 0; q < 8; q++) P.set(x + q, 6 + j, o.lit ? (j < 3 ? '#fff0c0' : '#fbd67a') : q + j === 6 ? '#a8c0e0' : j > 4 ? '#3a4a78' : '#2a3460'); }
      P.rect(12, 4, 8, 25, M[2]); P.rect(13, 5, 6, 23, M[3]); P.rect(14, 7, 4, 6, '#2a3460'); for (const x of [5, 25]) { P.disc(x + .5, 22.5, 2.6, G[1]); P.disc(x + .5, 22.5, 1.7, o.lit ? '#fff0b0' : '#c8c4a8'); } P.rect(14, 1, 4, 2, '#ffd060'); }
    P.each((x, y, c) => y > 22 && y < 29 && tn(x, y, 8, 8, 32, 32, sd) * 10 > 29 - y + 2 && ((x + y) & 1) ? tone(RUST, 2) : undefined); return P; });
  def('bogie', 6, () => { const P = Px(64, 16), G = ramp('#4a4858'), S = ramp('#8a8c9c'); P.clip = true; P.rect(2, 0, 60, 3, G[2]); P.rect(2, 0, 60, 1, G[4]); P.rect(0, 2, 3, 3, G[3]); P.rect(61, 2, 3, 3, G[3]);
    for (const bx of [6, 40]) { P.rect(bx, 3, 18, 4, G[1]); P.rect(bx, 3, 18, 1, G[3]); for (const cx of [bx + 4, bx + 14]) { P.disc(cx, 10, 5.4, G[0]); P.disc(cx, 10, 4.4, S[2]); P.disc(cx - .3, 9.7, 3, S[3]); P.disc(cx, 10, 1.4, G[1]); P.set(cx - 2, 7, S[5]); } P.rect(bx + 7, 8, 4, 3, G[2]); for (let y = 8; y < 11; y++) P.set(bx + 8 + (y % 2), y, S[4]); } P.rect(28, 3, 8, 5, G[1]); P.rect(29, 4, 6, 1, G[3]); return P; }, true);
  // 小型トラック（横 64×32 ＝ 3.4 m × 1.7 m、正面 32×32）
  def('truckSide', 3.4, (o = {}) => { const P = Px(64, 32), M = ramp(o.c || '#5a8ab0'), W = ramp('#8f6a44'), G = ramp('#4a4858'), sd = o.seed || 0; P.clip = true;
    for (let y = 2; y < 26; y++) for (let x = 42; x < 63; x++) { if (y < 12 && x > 55 + (y - 2) * .5) continue; P.set(x, y, M[y === 2 ? 5 : y > 22 ? 2 : 3]); } for (let y = 4; y < 12; y++) for (let x = 45; x < 55 + (y - 2) * .4; x++) P.set(x, y, x + y === 55 || x + y === 56 ? '#a8c0e0' : y > 9 ? '#3a4a78' : '#2a3460');
    P.rect(43, 3, 1, 22, M[1]); P.rect(53, 13, 1, 11, M[1]); P.rect(48, 15, 3, 1, G[4]); P.rect(60, 16, 3, 3, '#fff0b0'); P.rect(59, 23, 5, 2, G[3]);
    for (let y = 10; y < 22; y++) for (let x = 1; x < 41; x++) P.set(x, y, tone(W, y === 10 ? 5 : y === 21 ? 1 : (y % 4 === 1) ? 2 : 3)); for (const x of [1, 14, 27, 40]) P.rect(x, 9, 1, 13, G[3]); P.rect(0, 22, 62, 3, G[2]); P.rect(0, 22, 62, 1, G[4]); P.rect(0, 14, 1, 3, '#ff5a4a');
    P.each((x, y, c) => c && y > 18 && y < 25 && x > 41 && tn(x, y, 8, 4, 64, 32, sd) > .62 ? tone(RUST, 2) : undefined); return P; }, true);
  def('truckFront', 1.5, (o = {}) => { const P = Px(32), M = ramp(o.c || '#5a8ab0'), G = ramp('#4a4858'); P.clip = true; P.each((x, y) => y < 2 ? M[5] : y < 14 ? ((x < 3 || x > 28 || y < 4) ? M[3] : x + y === 20 || x + y === 21 ? '#a8c0e0' : y > 11 ? '#3a4a78' : '#2a3460') : y > 27 ? G[y === 28 ? 4 : 2] : M[y === 14 ? 4 : y > 24 ? 2 : 3]);
    P.rect(10, 18, 12, 6, G[1]); for (let y = 19; y < 24; y += 2) P.rect(11, y, 10, 1, G[4]); for (const x of [3, 24]) { P.rect(x, 18, 5, 4, '#fff0b0'); P.rect(x, 18, 5, 1, '#ffffff'); P.rect(x, 22, 5, 1, '#e8892c'); } P.rect(12, 25, 8, 2, '#f4ecd8'); return P; });
  def('gap', 4, (o = {}) => { const P = Px(32), L = ['#e88c2c', '#f6b446', '#fbd67a', '#fff0c0', '#fffbe8'], D = o.c || '#3a3850'; P.each((x, y) => { const d = Math.hypot(x - 15.5, y - 15.5) / 22; return L[cl(Math.floor((1 - d) * 5 + ((x + y) & 1) * .5), 0, 4)]; });
    for (let k = 0; k < 32; k++) { for (const q of [9, 10, 22]) { P.set(k, q, D); P.set(q, k, D); } P.set(k, k, D); P.set(31 - k, k, D); } return P; });

  // ================= 2. 形の道具 =================
  const GLOW = { glow: true }, OFF = { offset: true }, GLOFF = { glow: true, offset: true }, SIDE = { side: true };
  const gg = (B, t, o) => B.g(t, o).at(null).tint(1).rect(0, 0, 1, 1).smooth(0).normal(null);
  // +z 向きの四角（x0〜x1, y0〜y1, z）。rep = [よこ, たて] のくり返し
  const face = (G, x0, y0, x1, y1, z = 0, rep = [1, 1], tint = 1) => G.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, rep[0], rep[1]], tint);
  const flat = (G, x0, z0, x1, z1, y, rep = [1, 1], tint = 1) => G.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 0, rep[0], rep[1]], tint);   // 上向きの四角（z0 が奥）
  const bx = (G, t, w, h, d, x, y, z, o = {}) => G.box(w, h, d, x, y, z, { m: t.userData.m, ...o });
  const V = a => new THREE.Vector3(a[0], a[1], a[2]);
  const circle = (r, n = 6) => [...Array(n)].map((_, k) => [Math.cos(k / n * 2 * PI) * r, Math.sin(k / n * 2 * PI) * r]);
  // 折れ線の かどを丸める
  function roundPath(pts, rb, seg = 3) { if (!rb || pts.length < 3) return pts.map(V); const out = [V(pts[0])];
    for (let i = 1; i < pts.length - 1; i++) { const p = V(pts[i]), a = V(pts[i - 1]).sub(p), b = V(pts[i + 1]).sub(p), r = Math.min(rb, a.length() * .45, b.length() * .45), p0 = p.clone().addScaledVector(a.normalize(), r), p1 = p.clone().addScaledVector(b.normalize(), r);
      for (let k = 0; k <= seg; k++) { const u = k / seg; out.push(p0.clone().multiplyScalar((1 - u) ** 2).addScaledVector(p, 2 * u * (1 - u)).addScaledVector(p1, u * u)); } }
    out.push(V(pts[pts.length - 1])); return out; }
  // 道すじ pts にそって、断面 ring（[[上, 横], …]）の輪をつなぐ。o = { bend（かどの丸み）, joint（つぎ手の間かく。0 でなし）, fk（つぎ手の太さの倍率）, e（つぎ手の長さの半分）, m（テクスチャ 1 枚の長さ）, ur, ends }
  function tubeInto(G, pts, ring, o = {}) { const P = roundPath(pts, o.bend, o.seg || 3), st = [], e = o.e || .05, jt = o.joint || 0, fk = o.fk || 1.35, n = ring.length, m = o.m || 1, ur = o.ur || 1; let d = 0;
    const fl = (p, dir, dd) => { for (const [s, k] of [[-1, 1], [-1, fk], [1, fk], [1, 1]]) st.push({ p: p.clone().addScaledVector(dir, s * e), t: dir, k, d: dd + s * e + (k > 1 ? -s * 1e-4 : 0) }); };
    for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; if (i) d += P[i].distanceTo(P[i - 1]); st.push({ p: P[i], t: b.clone().sub(a).normalize(), k: 1, d });
      if (i < P.length - 1 && jt) { const q = P[i + 1], L = q.distanceTo(P[i]), dir = q.clone().sub(P[i]).normalize(); if (L > e * 8) { const cnt = Math.max(1, Math.round(L / jt)); for (let j = 0; j < cnt; j++) { const f = (j + .5) / cnt * L; fl(P[i].clone().addScaledVector(dir, f), dir, d + f); } } } }
    st.sort((a, b) => a.d - b.d); let N = null; const Bv = new THREE.Vector3(), rows = [];
    for (const s of st) { if (!N) N = Math.abs(s.t.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0); N.addScaledVector(s.t, -N.dot(s.t)).normalize(); Bv.crossVectors(s.t, N);
      rows.push(ring.map(([a, b]) => [s.p.x + (N.x * a + Bv.x * b) * s.k, s.p.y + (N.y * a + Bv.y * b) * s.k, s.p.z + (N.z * a + Bv.z * b) * s.k])); }
    for (let i = 0; i < st.length - 1; i++) for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; G.quad(rows[i][k], rows[i][k1], rows[i + 1][k1], rows[i + 1][k], [k / n * ur, st[i].d / m, (k + 1) / n * ur, st[i + 1].d / m]); }
    return G; }
  const pipeInto = (G, pts, r, o = {}) => { G.smooth(1); tubeInto(G, pts, circle(r, o.n || 6), { bend: o.bend ?? r * 2.2, joint: o.joint ?? 3, e: r * .3, m: Math.max(.5, r * 6), ur: r > .25 ? 2 : 1, ...o }); return G.smooth(0); };

  // ================= 3. 配管・機械 =================
  C.pipe = (pts, r = .15, o = {}) => pipeInto(R.geo(), pts, r, o).mesh(tx.pipe({ c: o.c, band: o.band }));
  C.duct = (pts, w = .8, h = .5, o = {}) => { const t = tx.plate({ c: o.c || '#7c8290', n: 2 }); return tubeInto(R.geo(), pts, [[h / 2, -w / 2], [h / 2, w / 2], [-h / 2, w / 2], [-h / 2, -w / 2]], { bend: Math.max(w, h) * .7, seg: 2, joint: o.joint ?? 2, fk: 1.1, e: .04, m: 3, ur: (w + h) * 2 / 3 }).mesh(t, { smooth: false }); };
  C.valve = (o = {}) => { const r = o.r || .15, B = R.parts(), G = gg(B, tx.pipe({ c: o.body || '#6a6e84' })).smooth(1); G.at(TR(0, 0, 0, 0, 0, PI / 2)).loft(6, [[-r * 1.9, r * 1.5, r * 1.5, 0], [-r * 1.4, r * 1.5, r * 1.5, .2], [-r * 1.4, r * 1.2, r * 1.2, .2], [r * 1.4, r * 1.2, r * 1.2, .8], [r * 1.4, r * 1.5, r * 1.5, .8], [r * 1.9, r * 1.5, r * 1.5, 1]], { cap: 'both' }).at(null).smooth(0);
    G.box(r * .5, r * .5, r * 2.2, 0, -r * .25, r * 1.6, { m: 1 }); const s = r * 1.9; face(gg(B, tx.valve({ c: o.c }), SIDE), -s, -s, s, s, r * 2.75); return B.group(); };
  C.meter = (o = {}) => { const r = o.r || .16, B = R.parts(); gg(B, tx.pipe({ c: '#6a6e84' })).box(.06, .22, .06, 0, 0, 0, { m: 1 }).box(r * 2.1, r * 2.1, .06, 0, .2, -.02, { m: 1 }); face(gg(B, tx.meter(), SIDE), -r, .2 + r * .05, r, .2 + r * 2.05, .02); return B.group(); };
  const spin = (m, axis, speed) => { m.userData.dyn = true; m.userData.tick = t => { const d = t - (m.userData.t ?? t); m.userData.t = t; if (axis === 'y') m.rotateY(d * speed); else m.rotateZ(d * speed); }; return live(m); };
  // 換気のファン。kind: 'wall'（かべの四角いわくの中で回る。+z 向き、まん中が y=r+.15）/ 'roof'（屋根の上の、回る丸い頭）
  C.fan = (o = {}) => { const r = o.r || .6, g = new THREE.Group(), B = R.parts(), tp = tx.plate({ c: o.c || '#7c8290' }), sp = o.speed ?? 7;
    if (o.kind === 'roof') { gg(B, tp).smooth(1).loft(6, [[0, r * .7, r * .7, 0, .8], [.25, r * .55, r * .55, .2, 1], [.45, r * .55, r * .55, .4, 1]]); g.add(B.group());
      const m = R.geo().smooth(1).loft(8, [[.45, r * .6, r * .6, 0, .8], [.6, r, r, .25], [.95, r, r, .7], [1.15, r * .55, r * .55, 1]], { cap: 'top', ur: 2 }).mesh(tx.turbine({ c: o.c })); g.add(spin(m, 'y', sp * .5)); return g; }
    const s = r + .15, G = gg(B, tp); for (const [x, y, w, h] of [[0, 0, s * 2, .15], [0, s * 2 - .15, s * 2, .15], [-s + .075, .15, .15, s * 2 - .3], [s - .075, .15, .15, s * 2 - .3]]) bx(G, tp, w, h, .3, x, y, 0);
    face(gg(B, tx.manhole({ kind: 'grate', c: '#3c3a4c' })), -s, 0, s, s * 2, -.1, [2, 2], .8); g.add(B.group());
    const bl = face(R.geo(), -r, -r, r, r, 0).mesh(tx.blade({ c: o.blade }), SIDE); bl.position.set(0, s, .06); g.add(spin(bl, 'z', sp)); return g; };
  // タンク。kind: 'v'（たて。足つき）/ 'h'（よこ。x の向き、長さ h）
  C.tank = (o = {}) => { const r = o.r || .9, h = o.h || 2, lg = o.legs ?? .7, c = o.c || PAL[1], t = tx.plate({ c, n: 2, seed: o.seed }), tb = tx.plate({ c: mix(c, '#3a3848', .45) }), B = R.parts(), G = gg(B, t).smooth(1), ur = Math.max(2, Math.round(2 * PI * r / 3 * 1.5)), g = new THREE.Group();
    if (o.kind === 'h') { G.at(TR(0, lg + r, 0, 0, 0, PI / 2)).loft(8, [[-h / 2 - r * .25, r * .5, r * .5, 0, .85], [-h / 2, r, r, .1], [h / 2, r, r, h / 3], [h / 2 + r * .25, r * .5, r * .5, h / 3 + .1, .85]], { cap: 'both', ur }).at(null).smooth(0);
      const S = gg(B, tb); for (const s of [-1, 1]) bx(S, tb, .25, lg + r * .5, r * 1.5, s * h * .3, 0, 0, { top: false }); }
    else { G.loft(8, [[lg, r * .8, r * .8, 0, .75], [lg + .12, r, r, .04, .9], [lg + h - .12, r, r, h / 3], [lg + h, r * .86, r * .86, h / 3 + .05, 1.05], [lg + h + r * .28, r * .25, r * .25, h / 3 + .3, 1.1]], { cap: 'both', ur }).smooth(0);
      const S = gg(B, tb); for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) bx(S, tb, .12, lg + .1, .12, x * r * .62, 0, z * r * .62, { top: false });
      S.smooth(1); for (const k of [.3, .7]) S.loft(8, [[lg + h * k - .05, r * 1.03, r * 1.03, 0, .8], [lg + h * k + .05, r * 1.03, r * 1.03, .1, 1]], { ur }); S.smooth(0);
      if (o.ladder ?? h > 1.6) face(gg(B, tx.ladder(), SIDE), -.25, 0, .25, lg + h, r + .07, [1, Math.round(lg + h)]); }
    g.add(B.group()); g.userData.h = lg + (o.kind === 'h' ? r * 2 : h + r * .28); return g; };
  C.generator = (o = {}) => { const B = R.parts(), g = new THREE.Group(), c = o.c || '#6c8a84', tp = tx.plate({ c, n: 2 }), G = gg(B, tp); bx(G, tp, 1.8, 1.05, .9, 0, .16, 0); const S = gg(B, tx.plate({ c: '#4a4858' })); for (const z of [-.3, .3]) S.box(1.9, .16, .14, 0, 0, z, { m: 3 });
    const Pn = gg(B, tx.panel({ c }), OFF); face(Pn, -.86, .22, -.02, 1.14, .455); face(gg(B, tx.grille({ c: mix(c, '#c8c4b4', .5) }), OFF), .04, .22, .86, 1.14, .455);
    const Pp = gg(B, tx.pipe({ c: '#5a5868' })); pipeInto(Pp, [[.55, 1.2, 0], [.55, 2.1, 0], [.95, 2.3, 0]], .09, { joint: 0, bend: .2 }); Pp.smooth(1).at(TR(-.3, 1.42, 0, 0, 0, PI / 2)).loft(6, [[-.5, .12, .12, 0, .8], [-.42, .2, .2, .1], [.42, .2, .2, .9], [.5, .12, .12, 1, .8]], { cap: 'both' }).at(null).smooth(0);
    g.add(B.group()); g.userData.vent = [1, 2.36, 0]; return g; };
  // 室外機ふうの箱（かべに付けるときは wall: true で うけ金具がつく）
  C.acbox = (o = {}) => { const B = R.parts(), g = new THREE.Group(), c = o.c || '#b8b4a4', tp = tx.plate({ c, n: 2, rust: .7 }), w = .95, h = .7, y0 = o.wall ? .12 : .06; bx(gg(B, tp), tp, w, h, .4, 0, y0, 0); face(gg(B, tx.grille({ c, seed: o.seed }), OFF), -w / 2, y0, w / 2, y0 + h, .205);
    const S = gg(B, tx.plate({ c: '#4a4858' })); if (o.wall) for (const s of [-1, 1]) { S.box(.05, .05, .6, s * .35, .07, -.05, { m: 3 }); S.box(.05, .4, .05, s * .35, -.3, -.3, { m: 3 }); } else for (const s of [-1, 1]) S.box(.1, .06, .42, s * .35, 0, 0, { m: 3 });
    g.add(B.group()); if (o.fan) { const bl = face(R.geo(), -.21, -.21, .21, .21, 0).mesh(tx.blade({ c: '#d8d4c4' }), SIDE); bl.position.set(-w / 2 + .357, y0 + h * .547, .215); g.add(spin(bl, 'z', 9)); } return g; };
  C.manhole = (o = {}) => { const r = o.r || .45, m = flat(R.geo(), -r, -r, r, r, .035).mesh(tx.manhole({ kind: o.kind, c: o.c }), OFF); m.castShadow = false; return m; };
  // フェンス。kind: 'mesh'（金網）/ 'tin'（高さのふぞろいな トタンのへい）
  C.fence = (o = {}) => { const len = o.len || 6, h = o.h || 1.8, B = R.parts(), sd = o.seed || 0;
    if (o.kind === 'tin') { for (let x = -len / 2, i = 0; x < len / 2 - .01; i++) { const w = Math.min(len / 2 - x, .9 + hash(i, sd, 1) * .5), hh = h * (.8 + hash(i, sd, 2) * .3), t = tx.tin({ c: (o.cs || PAL)[Math.floor(hash(i, sd, 3) * 4)], seed: i % 3 }); face(gg(B, t, SIDE), x, 0, x + w, hh, (hash(i, sd, 4) - .5) * .08, [w / 3, hh / 3], [.8, .8, 1, 1]); x += w; } }
    else { face(gg(B, tx.mesh({ c: o.c, bar: 1 }), SIDE), -len / 2, 0, len / 2, h, 0, [Math.round(len), 1]); }
    const M = gg(B, T.metal({ c: '#5a5868' })); for (let i = 0, n = Math.max(1, Math.round(len / 2.5)); i <= n; i++) M.box(.07, h + .08, .07, -len / 2 + i * len / n, 0, -.04, { m: .5 }); return B.group(); };
  C.ladder = (o = {}) => face(R.geo(), -.25, 0, .25, o.h || 3, .08, [1, Math.round(o.h || 3)]).mesh(tx.ladder({ c: o.c }), SIDE);
  // 外階段（x の向きに のぼる。のぼり口が x=0、上が x=run・y=h）
  C.stairs = (o = {}) => { const h = o.h || 2.9, w = o.w || .85, run = o.run || h * 1.15, z = w / 2, B = R.parts(), n = Math.round(h / .22), len = Math.hypot(run, h), tp = tx.plate({ c: o.c || '#5e6078' });
    gg(B, tx.stair({ c: o.c }), SIDE).quad([0, 0, -z], [0, 0, z], [run, h, z], [run, h, -z], [0, 0, 1, n / 4]); const S = gg(B, tp, SIDE); for (const s of [-1, 1]) S.quad([0, -.22, s * z], [run, h - .22, s * z], [run, h, s * z], [0, 0, s * z], [0, 0, len / 3, .1]);
    bx(gg(B, tp), tp, 1, .1, w, run + .5, h - .1, 0, { bottom: true }); bx(gg(B, tp), tp, .09, h - .1, .09, run + .9, 0, z - .05, { top: false }); bx(gg(B, tp), tp, .09, h - .1, .09, run + .9, 0, -z + .05, { top: false });
    if (o.rail !== false) { const Rl = gg(B, tx.rail({ c: o.c }), SIDE), sides = o.rail === 'both' || o.rail === undefined ? [-1, 1] : [o.rail]; for (const s of sides) { Rl.quad([0, 0, s * z], [run, h, s * z], [run, h + .9, s * z], [0, .9, s * z], [0, 0, Math.round(len), 1]); Rl.quad([run, h, s * z], [run + 1, h, s * z], [run + 1, h + .9, s * z], [run, h + .9, s * z]); } }
    return B.group(); };
  // 非常階段（かべ z=0 に付け、+z へ d だけ出る。1 階ぶんは はしご）
  C.fireEscape = (o = {}) => { const fl = o.floors || 3, fh = o.fh || 2.8, w = o.w || 2.6, d = o.d || .95, B = R.parts(), tp = tx.plate({ c: o.c || '#5e6078' }), Ms = gg(B, tx.manhole({ kind: 'grate', c: o.c || '#6a6e84' }), SIDE), Rl = gg(B, tx.rail({ c: o.c }), SIDE), St = gg(B, tx.stair({ c: o.c }), SIDE), P = gg(B, tp);
    for (let f = 1; f <= fl; f++) { const y = f * fh; Ms.quad([-w / 2, y, d], [w / 2, y, d], [w / 2, y, 0], [-w / 2, y, 0], [0, 0, Math.round(w * 1.5), 1]); bx(P, tp, w, .08, .06, 0, y - .08, d); for (const s of [-1, 1]) bx(P, tp, .06, .08, d, s * w / 2, y - .08, d / 2);
      face(Rl, -w / 2, y, w / 2, y + .9, d, [Math.round(w), 1]); for (const s of [-1, 1]) Rl.quad([s * w / 2, y, 0], [s * w / 2, y, d], [s * w / 2, y + .9, d], [s * w / 2, y + .9, 0]);
      if (f > 1) { const s = f % 2 ? 1 : -1, x0 = -s * (w / 2 - .5), x1 = s * (w / 2 - .5), n = Math.round(fh / .22); St.quad([x0, y - fh, d * .5], [x0, y - fh, d], [x1, y, d], [x1, y, d * .5], [0, 0, .5, n / 4]); } }
    face(gg(B, tx.ladder({ c: o.c }), SIDE), -w / 2 + .1, .5, -w / 2 + .6, fh, d - .05, [1, Math.round(fh)]); return B.group(); };
  // 配管を道にそって引く。path = [[x, z], …]（道の中心線）。side: 1 ＝ +x へ進むとき +z がわ。pipes = [{ r, y, c, band }, …]。riser（m）を入れると、ところどころ上へ のびる
  C.pipeRun = (path, o = {}) => { const side = o.side || 1, off = o.off ?? 4, sd = o.seed || 0, gap = o.gap ?? 0, g = new THREE.Group(), B = R.parts(), pipes = o.pipes || [{ r: .22, y: .42, c: '#7a8494' }, { r: .13, y: .92, c: PAL[0] }, { r: .08, y: 1.24, c: PAL[2], band: '#e8e4d8' }];
    const offs = dist => path.map((p, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [p[0] - dz / l * dist * side, p[1] + dx / l * dist * side, Math.atan2(dz * side, -dx * side)]; });
    pipes.forEach((p, i) => { const L = offs(off + i * gap); pipeInto(gg(B, tx.pipe({ c: p.c, band: p.band, seed: i })), L.map(([x, z]) => [x, p.y, z]), p.r, { joint: p.joint ?? 4, bend: p.r * 3 }); });
    const top = Math.max(...pipes.map(p => p.y + p.r)), L0 = offs(off + (pipes.length - 1) * gap / 2), tp = tx.plate({ c: '#4e4c5e' }), S = gg(B, tp), ps = o.posts ?? 6; let acc = ps / 2, k = 0;
    for (let i = 0; i < L0.length - 1; i++) { const a = L0[i], b = L0[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (; ps > 0 && acc < len; acc += ps, k++) { const u = acc / len, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u; S.at(TR(x, 0, z, ry)); bx(S, tp, .12, top + .06, Math.max(.3, (pipes.length - 1) * gap + .4), 0, 0, 0); S.at(null);
        if (o.valves !== false && hash(k, sd, 5) < .45) { const pi = k % Math.min(2, pipes.length), p = pipes[pi], v = C.valve({ r: p.r, c: k % 3 ? '#d0442e' : '#e8c040' }), u2 = Math.min(1, (acc + ps * .4) / len); v.position.set(a[0] + (b[0] - a[0]) * u2, p.y, a[1] + (b[1] - a[1]) * u2); v.rotation.y = ry + (side > 0 ? PI : 0); g.add(v); }
        if (o.riser && hash(k, sd, 6) < .3 && pipes[1]) { const p = pipes[1]; pipeInto(gg(B, tx.pipe({ c: p.c, band: p.band, seed: 1 })), [[x, p.y, z], [x, o.riser, z]], p.r, { joint: 3 }); } }
      acc -= len; }
    g.add(B.group()); return g; };

  // ================= 4. 天井と骨組み =================
  C.ceiling = (o = {}) => { const w = o.w || 120, d = o.d || 80, y = o.y || 16, cell = o.cell || 8, cx = o.cx || 0, cz = o.cz || 0, t = tx.ceil({ c: o.c, leak: o.leak, seed: o.seed }), B = R.parts(), G = B.g(t, GLOW), nx = Math.round(w / cell), nz = Math.round(d / cell), r = cell / t.userData.m;
    const tint = o.tint || ((x, z) => .8 + hash(Math.round(x / cell), Math.round(z / cell), 3) * .3), tp = tx.plate({ c: mix(o.c || IRON, '#000000', .2) }), W = gg(B, tp, GLOW), Gp = gg(B, tx.gap(), GLOW);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x0 = cx - w / 2 + i * cell, z0 = cz - d / 2 + j * cell, x1 = x0 + cell, z1 = z0 + cell, xm = x0 + cell / 2, zm = z0 + cell / 2;
      if (o.hole && o.hole(xm, zm)) { const q = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; for (let k = 0; k < 4; k++) { const a = q[k], b = q[(k + 1) % 4]; W.quad([b[0], y, b[1]], [a[0], y, a[1]], [a[0], y + 2, a[1]], [b[0], y + 2, b[1]], [0, 0, cell / 3, 2 / 3], [1.5, 1.5, 2.6, 2.6]); } Gp.quad([x0, y + 2, z0], [x1, y + 2, z0], [x1, y + 2, z1], [x0, y + 2, z1]); continue; }
      G.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [i * r, j * r, (i + 1) * r, (j + 1) * r], tint(xm, zm)); }
    const bs = o.beams ?? 16; if (bs) { W.tint(.9); for (let z = cz - d / 2 + bs / 2; z < cz + d / 2; z += bs) for (let x = cx - w / 2; x < cx + w / 2 - .01; x += cell) bx(W, tp, cell, .9, .6, x + cell / 2, y - .9, z, { bottom: true, top: false }); W.tint(.75); for (let x = cx - w / 2 + bs / 2; x < cx + w / 2; x += bs) for (let z = cz - d / 2; z < cz + d / 2 - .01; z += cell) bx(W, tp, .5, .6, cell, x, y - .6, z + cell / 2, { bottom: true, top: false }); W.tint(1); }
    const g = B.group(); g.traverse(m => { m.castShadow = false; m.receiveShadow = false; }); return g; };
  C.pillar = (o = {}) => { const r = o.r || 5, h = o.h || 40, m = 12, t = tx.pillar({ c: o.c, seed: o.seed }), ur = Math.max(2, Math.round(2 * PI * r / m)), B = R.parts(), G = B.g(t, o.emissive ? { emissive: o.emissive } : {}).smooth(1), ring = (y, k, c = 1) => [y, r * k, r * k, y / m, c], lm = o.lm || (r > 4 ? 24 : 12);
    G.loft(8, [ring(0, 1.6, .7), ring(h * .03, 1.5, .85), ring(h * .055, 1.12, .95), ring(h * .08, 1), ring(h * .8, 1, 1), ring(h * .88, 1.25, .9), ring(h * .95, 1.9, .8), ring(h, 2.7, .7)], { ur });
    for (const k of [.3, .55]) G.loft(8, [ring(h * k - .5, 1.06, .8), ring(h * k + .5, 1.06, 1.05)], { ur });
    if (o.lights !== false) gg(B, tx.pillarLights({ seed: o.seed }), GLOW).loft(8, [[h * .1, r * 1.015, r * 1.015, h * .1 / lm], [h * .78, r * 1.015, r * 1.015, h * .78 / lm]], { ur: Math.max(2, Math.round(2 * PI * r / lm)) });
    return B.group(); };
  C.beam = (o = {}) => { const len = o.len || 10, h = o.h || .6, w = o.w || .4, t = tx.plate({ c: o.c || '#5a5e78' }), G = R.geo(); bx(G, t, len, h, w * .3, 0, 0, 0, { bottom: true }); bx(G, t, len, .08, w, 0, 0, 0, { bottom: true }); bx(G, t, len, .08, w, 0, h - .08, 0, { bottom: true }); return G.mesh(t, { smooth: false }); };
  C.truss = (o = {}) => { const len = o.len || 12, h = o.h || 1.6, w = o.w ?? 1.2, c = o.c || '#5a5e78', n = Math.max(1, Math.round(len / h)), B = R.parts(), G = gg(B, tx.girder({ c }), SIDE), tp = tx.plate({ c });
    for (const z of w ? [-w / 2, w / 2] : [0]) face(G, -len / 2, 0, len / 2, h, z, [n, 1]); if (w) for (let i = 0; i <= n; i += 2) bx(gg(B, tp), tp, .12, .12, w, -len / 2 + i * len / n, h - .12, 0); return B.group(); };
  const trackQuad = (G, x0, x1, y, z = 0) => G.quad([x0, y, z - 1.5], [x0, y, z + 1.5], [x1, y, z + 1.5], [x1, y, z - 1.5], [0, 0, 1, (x1 - x0) / 1.5]);
  C.trackQuad = trackQuad;
  C.elevated = (o = {}) => { const len = o.len || 40, h = o.h || 7, c = o.c || '#5a5e78', B = R.parts(), tp = tx.plate({ c }), D = gg(B, tp), Tk = gg(B, tx.track()), Gd = gg(B, tx.girder({ c }), SIDE), Rl = gg(B, tx.rail({ c }), SIDE), ps = o.posts || 10;
    for (let x = -len / 2; x < len / 2 - .01; x += 8) { const x1 = Math.min(len / 2, x + 8); bx(D, tp, x1 - x, .3, 3.8, (x + x1) / 2, h - .3, 0, { bottom: true, top: false }); trackQuad(Tk, x, x1, h); for (const z of [-1.9, 1.9]) { face(Gd, x, h - 1.7, x1, h - .3, z, [Math.round((x1 - x) / 1.4), 1]); face(Rl, x, h, x1, h + .9, z, [Math.round(x1 - x), 1]); } }
    for (let x = -len / 2 + ps / 2; x < len / 2; x += ps) { for (const z of [-1.4, 1.4]) bx(D, tp, .45, h - 1.7, .45, x, 0, z, { top: false, c0: .75 }); bx(D, tp, .6, .4, 3.8, x, h - 2.1, 0, { bottom: true }); Gd.quad([x, h - 3.9, 1.4], [x, h - 3.9, -1.4], [x, h - 2.1, -1.4], [x, h - 2.1, 1.4], [0, 0, 1.5, 1]); }
    const g = B.group(); g.userData.top = h; return g; };
  // 空の代わりの丸天井：暗い鉄の はりの格子に、上の層のあかりの点。地平線に近いほど かすむ色（haze）へ
  C.dome = (o = {}) => { const P = Px(256, 64), c = o.c || '#2e2c48', hz = o.haze || '#6a4a62', Ls = o.lights || ['#ffc070', '#ffb050', '#ffe0a0', '#ffc070', LIGHT.cyan, LIGHT.pink], sd = o.seed || 0; P.clip = true;
    P.each((x, y) => { const k = cl((y - 12) / 50), q = cl(Math.floor(k * 6 + ((x + y) & 1) * .5) / 6); let col = mix(c, hz, q); if (y % 12 === 11 || x % 32 === 0) col = mix(col, '#000000', .25 * (1 - q)); else if (y % 12 === 0 || x % 32 === 1) col = mix(col, '#ffffff', .07 * (1 - q)); else if ((x + y * 2) % 64 === 0 && y < 40) col = mix(col, '#000000', .15); return col; });
    for (let j = 0; j < 5; j++) for (let i = 0; i < 32; i++) { const r = hash(i, j, sd); if (r < .45) continue; const x = i * 8 + Math.floor(hash(i, j, sd + 1) * 4), y = j * 12 + 2 + Math.floor(hash(i, j, sd + 2) * 7), L = Ls[Math.floor(r * 37) % Ls.length], n = 1 + Math.floor(r * 11) % 3; for (let q = 0; q < n; q++) P.set(x + q * 2, y, mix(L, hz, j * .12)); if (r > .9) { P.rect(x, y + 2, 5, 1, mix(L, hz, .3)); } }
    const t = T.from(P, { m: 1, cut: true }); t.wrapT = THREE.ClampToEdgeWrapping; const g = new THREE.SphereGeometry(o.r || 380, 32, 16), u = g.attributes.uv, p = g.attributes.position, top = (o.top || 38) * PI / 180;
    for (let i = 0; i < u.count; i++) { const el = Math.asin(cl(p.getY(i) / (o.r || 380), -1, 1)); u.setXY(i, u.getX(i) * (o.rep || 4), cl(el / top, .01, .99)); }
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false })); m.renderOrder = -10; m.frustumCulled = false; return m; };
  C.backdrop = (o = {}) => { const r = o.r || 200, h = o.h || r * .2, t = tx.skyline({ c: o.c, haze: o.haze, seed: o.seed }), g = new THREE.CylinderGeometry(r, r, h, 32, 1, true), u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setX(i, u.getX(i) * (o.rep || 5));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, alphaTest: .5, side: THREE.BackSide, fog: false })); m.position.y = (o.y ?? -1) + h / 2; return m; };

  // ================= 5. 建物 =================
  const WINF = '#4a4450', winT = on => on ? T.window({ lit: 1, frame: WINF, bars: 'cross' }) : T.window({ frame: WINF, curtain: '#8a94a8' });
  C.shack = (o = {}) => { const sd = o.seed || 0, w = o.w || 5, d = o.d || 4.5, fl = o.floors || 2, cs = o.cs || PAL, B = R.parts(), g = new THREE.Group(), lit = o.lit ?? .6, rnd = k => hash(sd, k, 7), pick = k => cs[Math.floor(rnd(k) * cs.length) % cs.length], shop = o.shop || 'door', h0 = o.h || 2.9;
    const wallT = k => { const r = rnd(k + 30); return r < .42 ? tx.patch({ seed: (sd + k) % 3, cs }) : r < .8 ? tx.tin({ c: pick(k + 40), seed: sd % 3 }) : tx.plate({ c: mix(pick(k + 40), '#7a7f8c', .5) }); };
    const win = (x, y, z, ry, on, s = .9) => gg(B, winT(on), on ? GLOFF : OFF).at(TR(x, y, z, ry)).quad([-s / 2, 0, 0], [s / 2, 0, 0], [s / 2, s, 0], [-s / 2, s, 0]).at(null);
    let y = 0, fw = w, fx = 0, fd = d, fz = 0, lastT = null; const z0 = d / 2 + .02, trim = tx.plate({ c: '#5a5868' });
    for (let f = 0; f < fl; f++) { const fh = f ? (o.h2 || 2.5) : h0;
      if (f) { const nw = Math.max(2.4, fw * (.74 + rnd(f) * .26)), nd = fd * (.8 + rnd(f + 5) * .2); fx += (fw - nw) / 2 * (rnd(f + 3) < .5 ? -1 : 1); fz += (fd - nd) / 2 * (rnd(f + 6) < .65 ? -1 : 1); fw = nw; fd = nd; }
      const t = lastT = (f === 0 && o.wall) || wallT(f); bx(gg(B, t), t, fw, fh, fd, fx, y, fz, { c0: .8 }); bx(gg(B, trim), trim, fw + .16, .12, fd + .16, fx, y + fh - .06, fz);
      if (f) { const n = fw > 3.6 ? 2 : 1; for (let i = 0; i < n; i++) win(fx + (n === 1 ? 0 : (i - .5) * fw * .5), y + .85, fz + fd / 2 + .02, 0, rnd(f * 9 + i) < lit); win(fx + fw / 2 + .02, y + .85, fz, PI / 2, rnd(f * 9 + 4) < lit * .7); win(fx - fw / 2 - .02, y + .85, fz, -PI / 2, rnd(f * 9 + 5) < lit * .7); }
      y += fh; }
    const ow = w - .9, sc = o.shopC || pick(60), rep = (a, m) => Math.max(1, Math.round(a / m));
    if (shop === 'door') { face(gg(B, T.door({ c: mix(pick(61), '#5a4a40', .4), frame: WINF }), OFF), -w * .22 - .5, 0, -w * .22 + .5, 2, z0); win(w * .22, .95, z0, 0, rnd(70) < lit); }
    else if (shop === 'shutter') face(gg(B, T.shutter({ c: sc }), OFF), -ow / 2, 0, ow / 2, 2.35, z0, [rep(ow, 3), .87], .92);
    else if (shop === 'window') { face(gg(B, tx.shopwin({ kind: o.goods || 'goods', seed: sd % 5 }), GLOFF), -ow / 2, .55, ow / 2 - 1.15, 2.05, z0, [rep(ow - 1.15, 1.5), 1]); face(gg(B, T.door({ style: 'glass', lit: 1, frame: WINF, c: '#6a5a4a' }), GLOFF), ow / 2 - 1, 0, ow / 2, 2.05, z0); }
    else { face(gg(B, tx.shopwin({ kind: 'room', seed: sd % 5 }), GLOFF), -ow / 2, 0, ow / 2, 2.3, z0, [rep(ow, 2), 1]); if (shop === 'noren') face(gg(B, tx.noren({ c: sc, kind: ['ring', 'wave', 'dots', 'bars'][sd % 4] })), -ow / 2, 1.5, ow / 2, 2.32, z0 + .08, [Math.max(2, Math.round(ow / .9)), 1]); }
    if (o.awning) { const aw = Math.min(w, ow + .6), ay = Math.min(h0 - .2, 2.65);
      if (o.awning === 'tin') { const t = tx.tin({ c: pick(62), seed: 1 }); gg(B, t, SIDE).quad([-aw / 2, ay - .45, z0 + 1.3], [aw / 2, ay - .45, z0 + 1.3], [aw / 2, ay, z0], [-aw / 2, ay, z0], [0, 0, aw / 3, .45], [.9, .9, 1.05, 1.05]); const M = gg(B, T.metal({ c: '#5a5868' })); for (const s of [-1, 1]) M.box(.06, ay - .45, .06, s * (aw / 2 - .1), 0, z0 + 1.22, { m: .5, top: false }); }
      else { const A = gg(B, T.fabric({ c: o.awning === true ? pick(63) : o.awning, c2: '#f0e2c4', scallop: 1 }), SIDE), n = Math.round(aw / .75); A.quad([-aw / 2, ay - .4, z0 + 1.1], [aw / 2, ay - .4, z0 + 1.1], [aw / 2, ay, z0], [-aw / 2, ay, z0], [0, .3, n, 1], [.92, .92, 1.06, 1.06]); A.quad([-aw / 2, ay - .66, z0 + 1.1], [aw / 2, ay - .66, z0 + 1.1], [aw / 2, ay - .4, z0 + 1.1], [-aw / 2, ay - .4, z0 + 1.1], [0, 0, n, .28], .85); } }
    // 屋根：うしろが高い 片流れのトタン
    const xl = fx - fw / 2, xr = fx + fw / 2, zf = fz + fd / 2, zb = fz - fd / 2, rh = o.roofH ?? .55, rt = o.roof || tx.tin({ c: pick(64), seed: 2, rust: .7 }), e = .3;
    gg(B, rt, SIDE).quad([xl - e, y + .04, zf + e + .1], [xr + e, y + .04, zf + e + .1], [xr + e, y + rh + .06, zb - e], [xl - e, y + rh + .06, zb - e], [0, 0, (fw + e * 2) / 3, (fd + e * 2) / 3], [.95, .95, 1.08, 1.08]);
    const Wt = gg(B, lastT); Wt.tri([xl, y, zb], [xl, y, zf], [xl, y + rh, zb], [0, 0], [fd / 3, 0], [0, rh / 3]); Wt.tri([xr, y, zf], [xr, y, zb], [xr, y + rh, zb], [0, 0], [fd / 3, 0], [fd / 3, rh / 3]); Wt.quad([xr, y, zb], [xl, y, zb], [xl, y + rh, zb], [xr, y + rh, zb], [0, 0, fw / 3, rh / 3]);
    if (o.tank ?? rnd(80) < .35) { const k = C.tank({ r: .5, h: .9, legs: .4, c: pick(81), ladder: false }); k.position.set(fx + (rnd(82) - .5) * (fw - 1.5), y + rh * .45, fz - fd * .12); g.add(k); }
    if (o.antenna ?? rnd(83) < .5) { const A = gg(B, tx.antenna(), SIDE); for (const ry of [.4, .4 + PI / 2]) A.at(TR(xr - .45, y + rh * .8, zb + .45, ry)).quad([-.5, 0, 0], [.5, 0, 0], [.5, 2, 0], [-.5, 2, 0]); A.at(null); }
    if (o.vent ?? rnd(84) < .5) { const s = rnd(85) < .5 ? -1 : 1, px = s * (w / 2 + .17); pipeInto(gg(B, tx.pipe({ c: '#7a7480' })), [[s * (w / 2 - .05), 1.7, -d * .2], [px, 1.7, -d * .2], [px, y + rh + .9, -d * .2]], .09, { joint: 0, bend: .15 }); g.userData.vent = [px, y + rh + 1, -d * .2]; }
    if ((o.laundry ?? rnd(86) < .4) && fl > 1) { const ly = h0 + 1.1, lw = Math.min(3, w - 1), lx = (rnd(87) - .5) * (w - lw); face(gg(B, tx.laundry()), lx - lw / 2, ly, lx + lw / 2, ly + lw / 4, z0 + .55); const M = gg(B, T.metal({ c: '#5a5868' })); for (const s of [-1, 1]) M.box(.04, .04, .6, lx + s * lw / 2, ly + lw / 4 - .03, z0 + .28, { m: .5 }); }
    if (o.stairs && fl > 1) { const s = o.stairs === 'l' ? -1 : 1, st = C.stairs({ h: h0, w: .8, run: Math.min(d - 1.1, h0 * 1.15), rail: s }); st.rotation.y = PI / 2; st.position.set(s * (w / 2 + .42), 0, d / 2 - .05); g.add(st); }
    if (o.sign) { const S = o.sign === true ? {} : o.sign, shp = S.shape || 'tall', n = C.neon({ kind: S.kind || 'glyphs', c: S.c || LIGHT.pink, c2: S.c2, shape: shp, w: shp === 'tall' ? .6 : shp === 'sq' ? 1.1 : Math.min(2.4, ow), seed: sd, two: shp !== 'wide', flicker: S.flicker, border: shp !== 'tall' });
      if (shp !== 'wide') { n.rotation.y = PI / 2; n.position.set((S.side || 1) * (w / 2 - .3), h0 - .25, z0 + (shp === 'tall' ? .42 : .7)); } else n.position.set(S.x || 0, Math.max(2.7, h0 - .1), z0 + .14); g.add(n); }
    g.add(B.group()); Object.assign(g.userData, { h: y + rh, w, d, top: [fx, y, fz, fw, fd] }); return g; };
  C.shop = (o = {}) => C.shack({ shop: 'noren', awning: true, ...o });
  function containerInto(B, o = {}, M4 = null) { const len = o.len || 6, c = o.c || PAL[1], h = 2.6, dz = 1.22, S = gg(B, tx.container({ c, c2: o.c2, seed: o.seed })).at(M4), r = [0, 0, len / 6, 1];
    S.quad([-len / 2, 0, dz], [len / 2, 0, dz], [len / 2, h, dz], [-len / 2, h, dz], r, [.82, .82, 1, 1]); S.quad([len / 2, 0, -dz], [-len / 2, 0, -dz], [-len / 2, h, -dz], [len / 2, h, -dz], r, [.82, .82, 1, 1]); S.at(null);
    const E = gg(B, tx.containerEnd({ c })).at(M4); E.quad([len / 2, 0, dz], [len / 2, 0, -dz], [len / 2, h, -dz], [len / 2, h, dz]); E.quad([-len / 2, 0, -dz], [-len / 2, 0, dz], [-len / 2, h, dz], [-len / 2, h, -dz]); E.at(null);
    gg(B, tx.tin({ c, dir: 'h', rust: .6 })).at(M4).quad([-len / 2, h, dz], [len / 2, h, dz], [len / 2, h, -dz], [-len / 2, h, -dz], [0, 0, len / 3, .8], .9).at(null); }
  C.container = (o = {}) => { const B = R.parts(); containerInto(B, o); return B.group(); };
  // コンテナを積んだ家（n 段）。窓あかり・とびら・はしご・屋上の手すり
  C.containerHouse = (o = {}) => { const n = o.n || 3, sd = o.seed || 0, cs = o.cs || [PAL[1], PAL[0], PAL[2], PAL[3]], lit = o.lit ?? .7, B = R.parts(), g = new THREE.Group(); let dx = 0, ry = 0;
    for (let i = 0; i < n; i++) { const y = i * 2.6; if (i) { dx = (hash(sd, i, 1) - .5) * 2; ry = hash(sd, i, 2) > .72 ? PI / 2 : (hash(sd, i, 3) - .5) * .12; } const M = TR(dx, y, 0, ry); containerInto(B, { c: cs[(i + sd) % cs.length], seed: sd + i }, M);
      for (const x of [-1.5, .9]) { const on = hash(sd, i * 5 + x, 4) < lit; gg(B, winT(on), on ? GLOFF : OFF).at(M).quad([x - .45, .95, 1.24], [x + .45, .95, 1.24], [x + .45, 1.85, 1.24], [x - .45, 1.85, 1.24]).at(null); }
      if (!i) gg(B, T.door({ c: '#6a5a4a', frame: WINF }), OFF).at(M).quad([2, 0, 1.24], [2.9, 0, 1.24], [2.9, 1.95, 1.24], [2, 1.95, 1.24]).at(null);
      else gg(B, tx.ladder(), SIDE).at(M).quad([2.2, -2.6, 1.3], [2.7, -2.6, 1.3], [2.7, 0, 1.3], [2.2, 0, 1.3], [0, 0, 1, 3]).at(null);
      if (i === n - 1) { const Rl = gg(B, tx.rail(), SIDE).at(M); Rl.quad([-3, 2.6, 1.2], [3, 2.6, 1.2], [3, 3.5, 1.2], [-3, 3.5, 1.2], [0, 0, 6, 1]); Rl.quad([-3, 2.6, -1.2], [-3, 2.6, 1.2], [-3, 3.5, 1.2], [-3, 3.5, -1.2], [0, 0, 2, 1]); Rl.quad([3, 2.6, 1.2], [3, 2.6, -1.2], [3, 3.5, -1.2], [3, 3.5, 1.2], [0, 0, 2, 1]); Rl.at(null); } }
    g.add(B.group()); g.userData.h = n * 2.6; return g; };
  // 小さな駅のホームと屋根（x の向き。線路がわが +z。上の面は y=.9）
  C.platform = (o = {}) => { const len = o.len || 16, w = o.w || 3.4, B = R.parts(), g = new THREE.Group(), tc = tx.conc({ c: '#8e8a88' }), tt = tx.tile({ c: '#c8c4b4', c2: o.c || PAL[1] }), ty = tx.tile({ c: '#e8c040', c2: '#d8a82c', check: 1 }), tp = tx.plate({ c: '#5e6078' }), G = gg(B, tc), Tl = gg(B, tt), Y = gg(B, ty, OFF);
    for (let x = -len / 2; x < len / 2 - .01; x += 4) { const x1 = Math.min(len / 2, x + 4); bx(G, tc, x1 - x, .9, w, (x + x1) / 2, 0, 0, { top: false, c0: .75 }); flat(Tl, x, -w / 2, x1, w / 2, .9, [(x1 - x) / 1.5, w / 1.5]); flat(Y, x, w / 2 - .75, x1, w / 2 - .45, .905, [(x1 - x) / .375, .25]); }
    if (o.roof !== false) { const Rf = gg(B, tx.tin({ c: o.roofC || PAL[1], rust: .6 }), SIDE), P = gg(B, tp); for (let x = -len / 2; x < len / 2 - .01; x += 4) { const x1 = Math.min(len / 2, x + 4); Rf.quad([x, 3.25, w / 2 + .35], [x1, 3.25, w / 2 + .35], [x1, 3.8, -w / 2 - .1], [x, 3.8, -w / 2 - .1], [0, 0, (x1 - x) / 3, (w + .5) / 3], [.9, .9, 1.05, 1.05]); bx(P, tp, x1 - x, .14, .1, (x + x1) / 2, 3.16, w / 2 + .3); }
      for (let x = -len / 2 + 1; x < len / 2; x += 4.66) { bx(P, tp, .16, 2.85, .16, x, .9, -w / 2 + .5, { top: false }); bx(P, tp, .1, .1, w, x, 3.4, .1); }
      g.add(C.bulbs([-len / 2 + 1, 3.75, w / 2 - .5], [len / 2 - 1, 3.75, w / 2 - .5], { n: Math.round(len / 3.2), sag: .25, drop: .5 })); const s = C.neon({ kind: 'glyphs', shape: 'wide', w: 2.2, c: LIGHT.cyan, c2: LIGHT.amber, two: true, seed: 3 }); s.position.set(0, 2.5, 0); g.add(s); }
    const f = C.fence({ len, h: 1.1, kind: 'mesh' }); f.position.set(0, .9, -w / 2 + .06); g.add(f); const b = C.bench({ w: 1.6 }); b.position.set(-len / 4, .9, -w / 2 + .5); g.add(b); g.add(B.group()); return g; };

  // ================= 6. あかり =================
  // にじんだ光の絵（加算で重ねる）。段をつけてあるので、粗い絵の上でディザになる
  const alphaTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const q = fn(x, y), i = (y * w + x) * 4; for (let k = 0; k < 4; k++) im.data[i + k] = cl(q[k]) * 255; } g.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return t; };
  const step = (v, n) => Math.round(cl(v) * n) / n;
  let _halo, _streak, _shaft, _puff;
  const haloT = () => _halo || (_halo = alphaTex(32, 32, (x, y) => { const v = step(Math.max(0, 1 - Math.hypot(x - 15.5, y - 15.5) / 15.5) ** 1.8, 10); return [v, v, v, 1]; }));
  const streakT = () => _streak || (_streak = alphaTex(16, 64, (x, y) => { const ky = 1 - Math.abs(y - 31.5) / 32, kx = Math.max(0, 1 - Math.abs(x - 7.5 - Math.sin(y * .9) * 1.2) / 7), v = step(ky ** 1.3 * kx ** .9 * (y % 5 === 4 ? .35 : y % 7 === 2 ? .6 : 1), 8); return [v, v, v, 1]; }));
  const shaftT = () => _shaft || (_shaft = alphaTex(32, 64, (x, y) => { const sx = Math.max(0, 1 - Math.abs(x - 15.5) / 16), v = step(sx ** 1.3 * ((x * 5) % 11 < 4 ? 1 : .68) * (1 - .78 * y / 63), 10); return [v, v, v, 1]; }));
  const puffT = () => _puff || (_puff = alphaTex(32, 32, (x, y) => { const dx = x - 15.5, dy = y - 15.5, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy) / 15.5 * (1 + .13 * Math.sin(a * 5 + 1) + .09 * Math.sin(a * 3)), v = 1 - d, al = v > .5 ? .92 : v > .32 ? .62 : v > .17 ? .34 : v > .05 ? .14 : 0, sh = dx + dy > 5 && v < .6 ? .84 : 1; return [sh, sh, sh * 1.03, al]; }));
  const addMat = (map, o = {}) => new THREE.MeshBasicMaterial({ map, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, ...o });
  const lin = c => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };
  const flick = (t, s = 0) => hash(Math.floor(t * 11), s, 3) < .14 ? .3 : Math.sin(t * 37 + s * 9) > .93 ? .6 : 1;
  // 四角をいくつでも入れられる、位置・UV・色の入れ物（加算の光・蒸気用）
  const quads = (n, mat, alpha) => { const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), col = new Float32Array(n * 4 * (alpha ? 4 : 3)), idx = []; for (let i = 0; i < n; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, alpha ? 4 : 3)); g.setIndex(idx); const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.userData.dyn = true; m.castShadow = m.receiveShadow = false;
    m.userData.put = (i, a, b, c, d, rgb, al) => { pos.set(a, i * 12); pos.set(b, i * 12 + 3); pos.set(c, i * 12 + 6); pos.set(d, i * 12 + 9); const s = alpha ? 4 : 3; for (let k = 0; k < 4; k++) { col.set(rgb, (i * 4 + k) * s); if (alpha) col[(i * 4 + k) * s + 3] = al; } }; m.userData.flush = () => { g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; }; return m; };
  // 加算の光の輪（地面・かべ）。list = [{ p: [x, y, z], r, r2（たての半径）, c, n: [法線], k }]
  C.pools = (list, o = {}) => { const m = quads(list.length, addMat(haloT())), a = new THREE.Vector3(), b = new THREE.Vector3(), nn = new THREE.Vector3();
    list.forEach((L, i) => { nn.set(...(L.n || [0, 1, 0])).normalize(); if (Math.abs(nn.y) > .9) { a.set(1, 0, 0); b.set(0, 0, -1); } else { a.crossVectors(new THREE.Vector3(0, 1, 0), nn).normalize(); b.crossVectors(nn, a); } const r = L.r || 2, r2 = L.r2 || r, p = L.p, e = .05, k = L.k ?? 1, c = lin(L.c || LIGHT.bulb).map(v => v * k);
      const P = (sa, sb) => [p[0] + nn.x * e + a.x * r * sa + b.x * r2 * sb, p[1] + nn.y * e + a.y * r * sa + b.y * r2 * sb, p[2] + nn.z * e + a.z * r * sa + b.z * r2 * sb]; m.userData.put(i, P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), c); });
    m.userData.flush(); m.renderOrder = 2; return m; };
  // R.ground の shade に入れる：あかりを地面に焼きこむ。lights = [{ x, z, r, c, k }]、base = 下地の明るさ [r, g, b]
  C.lightShade = (lights, base = [.5, .5, .62]) => { const L = lights.map(l => ({ x: l.x, z: l.z, r: l.r || 5, c: rgb(l.c || LIGHT.bulb).map(v => v * (l.k ?? 1) * 1.15) })); return (x, z) => { let r = base[0], g = base[1], b = base[2]; for (const l of L) { const dx = x - l.x, dz = z - l.z; if (Math.abs(dx) > l.r || Math.abs(dz) > l.r) continue; const k = Math.max(0, 1 - Math.hypot(dx, dz) / l.r) ** 2; r += l.c[0] * k; g += l.c[1] * k; b += l.c[2] * k; } return [r, g, b]; }; };
  // ぬれた路面の映りこみ：あかり（高さ h）の下から、カメラのほうへ たてにのびる。list = [{ x, z, h, c, w, len, k }]
  C.streaks = (list, o = {}) => { const m = quads(list.length, addMat(streakT())), y = o.y ?? .05, cs = list.map(L => lin(L.c || LIGHT.pink));
    m.userData.tick = (t, cam) => { if (!cam) return; list.forEach((L, i) => { const h = L.h ?? 3, f = h / (h + Math.max(.5, cam.position.y)), cx = L.x + (cam.position.x - L.x) * f, cz = L.z + (cam.position.z - L.z) * f; let dx = cam.position.x - L.x, dz = cam.position.z - L.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
        const w = (L.w ?? .9) / 2, ln = (L.len ?? Math.min(7, 1.5 + dl * .22)) / 2, k = (L.k ?? 1) * (.82 + .18 * Math.sin(t * 2.3 + i * 1.7)) * cl(1.3 - dl / (o.far || 45)) * (L.flicker ? flick(t, i) : 1), c = cs[i].map(v => v * k);
        m.userData.put(i, [cx - dz * w - dx * ln, y, cz + dx * w - dz * ln], [cx + dz * w - dx * ln, y, cz - dx * w - dz * ln], [cx + dz * w + dx * ln, y, cz - dx * w + dz * ln], [cx - dz * w + dx * ln, y, cz + dx * w + dz * ln], c); }); m.userData.flush(); };
    m.renderOrder = 2; return live(m); };
  C.halo = (o = {}) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT(), color: o.c || LIGHT.bulb, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: o.k ?? .8 })); s.scale.setScalar((o.r || .7) * 2); if (o.flicker) { s.userData.tick = t => { s.material.opacity = (o.k ?? .8) * flick(t, o.seed || 1); }; live(s); } return s; };
  // 上の層からもれる光のすじ（加算の板を n 枚 交差させる。上がせまく、下が広い）
  C.shaft = (o = {}) => { const w = o.w || 3, h = o.h || 14, n = o.n || 2, lean = o.lean || 0, c = lin(o.c || '#ffe2a8').map(v => v * (o.a ?? .3)), m = quads(n, addMat(shaftT(), { polygonOffset: false }));
    for (let i = 0; i < n; i++) { const a = i / n * PI + (o.rot || .3), cx = Math.cos(a), cz = Math.sin(a), b = w / 2, tp = w * .32; m.userData.put(i, [-cx * b, 0, -cz * b], [cx * b, 0, cz * b], [cx * tp + lean * h, h, cz * tp], [-cx * tp + lean * h, h, -cz * tp], c); } m.userData.flush(); m.userData.dyn = true; m.renderOrder = 3; return m; };
  // ネオンの看板（まん中が x=0、下が y=0、+z 向き）。flicker でちらつく。userData = { w, h, c }
  C.neon = (o = {}) => { const sh = o.shape || 'sq', t = tx.neon({ kind: o.kind, c: o.c, c2: o.c2, shape: sh, bg: o.bg, border: o.border, seed: o.seed }), w = o.w || (sh === 'wide' ? 2 : sh === 'tall' ? .6 : 1.1), h = w * (sh === 'wide' ? .5 : sh === 'tall' ? 3 : 1);
    let mt = R.mat(t, { glow: true, vc: true, side: !!o.two || t.userData.cut }); if (o.flicker) { const f = mt.onBeforeCompile; mt = mt.clone(); mt.onBeforeCompile = f; }
    const m = face(R.geo(), -w / 2, 0, w / 2, h, 0).mesh(mt); m.castShadow = false; Object.assign(m.userData, { w, h, c: o.c || LIGHT.pink }); if (o.flicker) { const s = (o.seed || 0) + (o.flicker === true ? 1 : o.flicker); m.userData.dyn = true; m.userData.tick = tt => mt.color.setScalar(flick(tt, s)); live(m); } return m; };
  const lineOf = (pts, c = '#1e1c2a') => { const l = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), new THREE.LineBasicMaterial({ color: c })); l.userData.dyn = true; return l; };
  const sagPts = (a, b, sag, n = 8) => [...Array(n + 1)].map((_, i) => { const u = i / n; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u]; });
  const segs = P => { const out = []; for (let i = 0; i < P.length - 1; i++) out.push(...P[i], ...P[i + 1]); return out; };
  // たれる電線。list = [[a, b, たれ], …]（a, b は [x, y, z]）
  C.wires = (list, o = {}) => lineOf(list.flatMap(([a, b, s]) => segs(sagPts(a, b, s ?? .5, o.n || 8))), o.c);
  def('glowv', .3, () => { const P = Px(8); P.each((x, y) => y < 2 ? '#ffffff' : y < 5 ? '#fff6dc' : y < 7 ? '#ffe2a8' : '#f0b060'); return P; });
  // 裸電球の列。a, b = [x, y, z]。cs で色をまぜる。drop ＝ 電線からつるす長さ
  C.bulbs = (a, b, o = {}) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = o.n || Math.max(2, Math.round(len / 1.3)), cs = o.cs || [LIGHT.bulb], r = o.r || .075, dp = o.drop ?? .14, g = new THREE.Group(), G = R.geo().smooth(1), W = sagPts(a, b, o.sag ?? .4, n * 2), ln = segs(W), pts = [];
    for (let i = 0; i < n; i++) { const p = W[i * 2 + 1], c = cs[i % cs.length], y = p[1] - dp; ln.push(...p, p[0], y, p[2]); G.tint(rgb(mix(c, '#ffffff', .35))).at(TR(p[0], y, p[2])).loft(5, [[-r * 2.3, r * .45, r * .45, 1], [-r * 1.5, r, r, .7], [-r * .6, r * .85, r * .85, .3], [0, r * .4, r * .4, 0]], { cap: 'bot' }); pts.push([p[0], y - r, p[2], c]); }
    const m = G.mesh(tx.glowv(), GLOW); g.add(lineOf(ln), m); g.userData.pts = pts; return g; };
  const lanternInto = (G, x, y, z, r, h) => G.at(TR(x, y, z)).loft(6, [[-.05 - h, r * .42, r * .42, 0], [-.05 - h * .88, r * .62, r * .62, .12], [-.05 - h * .7, r, r, .3], [-.05 - h * .3, r, r, .7], [-.05 - h * .12, r * .62, r * .62, .88], [-.05, r * .42, r * .42, 1]], { cap: 'both' }).at(null);
  C.lantern = (o = {}) => lanternInto(R.geo().smooth(1), 0, 0, 0, o.r || .22, o.h || (o.r || .22) * 2.3).mesh(tx.lantern({ kind: o.kind, mark: o.mark }), GLOW);
  // ちょうちんの列。kinds で色をまぜる（'red' / 'white' / 'yellow'）
  C.lanterns = (a, b, o = {}) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = o.n || Math.max(2, Math.round(len / 1.5)), ks = o.kinds || [o.kind || 'red'], r = o.r || .2, g = new THREE.Group(), B = R.parts(), W = sagPts(a, b, o.sag ?? .5, n * 2), pts = [];
    for (let i = 0; i < n; i++) { const p = W[i * 2 + 1], k = ks[i % ks.length]; lanternInto(B.g(tx.lantern({ kind: k }), GLOW).smooth(1), p[0], p[1], p[2], r, r * 2.3); pts.push([p[0], p[1] - r * 1.3, p[2], k === 'white' ? '#ffe9b8' : k === 'yellow' ? '#ffd060' : '#ff8a3a']); }
    g.add(lineOf(segs(W)), B.group()); g.userData.pts = pts; return g; };
  // 街灯：まがった鉄の管に、かさのついた あかり。userData.lamp ＝ あかりの位置
  C.streetLamp = (o = {}) => { const h = o.h || 4.2, arm = o.arm ?? .9, B = R.parts(), g = new THREE.Group(), c = o.c || '#4e4c5e', lc = o.cold ? '#bfe6ff' : LIGHT.bulb;
    const P = gg(B, tx.pipe({ c })); pipeInto(P, [[0, 0, 0], [0, h, 0], [arm, h + .3, 0], [arm, h + .12, 0]], .07, { joint: 0, bend: .45 }); P.smooth(1).loft(6, [[0, .16, .16, 0, .7], [.35, .1, .1, .3, 1]]).at(TR(arm, h - .1, 0)).loft(6, [[0, .34, .34, 0, 1], [.2, .1, .1, .5, 1.1]], { cap: 'top' }).at(null).smooth(0);
    gg(B, tx.glowv(), GLOW).smooth(1).tint(rgb(mix(lc, '#ffffff', .4))).at(TR(arm, h - .1, 0)).loft(6, [[-.16, .1, .1, 0], [-.05, .2, .2, .6], [0, .27, .27, 1]], { cap: 'bot' }).at(null);
    g.add(B.group()); if (o.halo !== false) { const s = C.halo({ c: lc, r: o.haloR || .9, k: .7, flicker: o.flicker, seed: o.seed }); s.position.set(arm, h - .2, 0); g.add(s); }
    if (o.light) { const l = new THREE.PointLight(lc, o.power || 18, o.range || 11, 1.5); l.position.set(arm, h - .5, 0); g.add(l); } g.userData.lamp = [arm, h - .2, 0]; g.userData.c = lc; return g; };
  // 信号ふうのランプ：柱の上の箱に、色のあかりが n 個。blink（秒）ごとに つぎの色へ
  C.signal = (o = {}) => { const h = o.h || 3.2, cs = o.cs || ['#ff5a4a', LIGHT.amber, LIGHT.green], n = cs.length, B = R.parts(), g = new THREE.Group(), tp = tx.plate({ c: '#3c3a4c', n: 1 }), bh = n * .3 + .12, P = gg(B, tx.pipe({ c: '#4e4c5e' })); pipeInto(P, [[0, 0, 0], [0, h, 0]], .06, { joint: 0 });
    bx(gg(B, tp), tp, .38, bh, .22, 0, h - .1, 0); g.add(B.group()); const lamps = cs.map((c, i) => { const m = face(R.geo(), -.11, -.11, .11, .11, 0).mesh(new THREE.MeshBasicMaterial({ map: tx.bulb(), color: c, alphaTest: .5 })); m.position.set(0, h + bh - .32 - i * .3, .115); m.userData.dyn = true; g.add(m); return m; });
    const col = cs.map(c => new THREE.Color(c)), hl = C.halo({ c: cs[0], r: .5, k: .7 }); hl.position.set(0, h + bh / 2, .2); g.add(hl); const holder = lamps[0]; holder.userData.tick = t => { const k = Math.floor(t / (o.blink || 1.4) + (o.seed || 0)) % n; lamps.forEach((m, i) => m.material.color.copy(col[i]).multiplyScalar(i === k ? 1 : .16)); hl.material.color.copy(col[k]); hl.position.y = h + bh - .32 - k * .3; }; live(holder); return g; };

  // ================= 7. 小物 =================
  const tireInto = (B, M4, r = .32, w = .2) => { gg(B, tx.tread()).smooth(1).at(M4).loft(8, [[0, r * .9, r * .9, 0, .7], [w * .2, r, r, .25, 1], [w * .8, r, r, .75, 1], [w, r * .9, r * .9, 1, 1]], { ur: 6 }).loft(8, [[w, r * .5, r * .5, 0, .4], [0, r * .5, r * .5, 1, .4]]).at(null).smooth(0);
    const S = gg(B, tx.tire({ kind: 'hole' })).at(M4); S.quad([-r, w, r], [r, w, r], [r, w, -r], [-r, w, -r]); S.quad([-r, 0, -r], [r, 0, -r], [r, 0, r], [-r, 0, r], [0, 0, 1, 1], .6); S.at(null); };
  C.drum = (o = {}) => { const h = o.h || .9, r = o.r || .3, B = R.parts(); gg(B, tx.drum({ c: o.c, c2: o.c2, mark: o.mark, seed: o.seed })).smooth(1).loft(8, [[0, r * .96, r * .96, 0, .7], [.04, r, r, .04, .85], [h - .03, r, r, .97, 1], [h, r * .96, r * .96, 1, 1]], { ur: 2 }); flat(gg(B, tx.drumTop({ c: o.c })), -r, -r, r, r, h - .02); return B.group(); };
  // タイヤの山。kind: 'stack'（まっすぐ積む）/ 'pile'（くずれた山）
  C.tires = (o = {}) => { const n = o.n || 3, sd = o.seed || 0, B = R.parts(), r = o.r || .34, w = .22;
    if (o.kind === 'pile') { const L = [[0, 0, 0, 0, 0], [.7, 0, .15, 0, 0], [.32, w, .1, 0, .06], [-.2, .05, .62, 1.25, .3], [.95, .3, -.25, -1.1, 1.9]]; for (let i = 0; i < Math.min(n + 2, L.length); i++) { const [x, y, z, rx, ry] = L[i]; tireInto(B, TR(x, y + (rx ? r * .9 : 0), z, ry, rx), r, w); } }
    else for (let i = 0; i < n; i++) tireInto(B, TR((hash(i, sd, 1) - .5) * .1, i * w, (hash(i, sd, 2) - .5) * .1, hash(i, sd, 3) * 3), r, w);
    return B.group(); };
  // 鉄くずの山（s ＝ 大きさ m）。つき出た管・トタン・タイヤつき
  C.scrap = (o = {}) => { const s = o.s || 2, sd = o.seed || 0, B = R.parts(), rn = k => hash(sd, k, 11), G = gg(B, tx.scrap({ seed: sd % 3, cs: o.cs }));
    G.loft(R.ngon(7, rn(1)), [[0, s * 1.15, s * .95, 0, .7], [s * .22, s * .95, s * .78, .25, .9, s * (rn(2) - .5) * .2, 0], [s * .46, s * .58, s * .5, .55, 1, s * (rn(3) - .5) * .3, s * (rn(4) - .5) * .2], [s * .62, s * .2, s * .18, .8, 1.1, s * (rn(5) - .5) * .3, s * (rn(6) - .5) * .2]], { cap: 'top', ur: 3 });
    pipeInto(gg(B, tx.pipe({ c: '#7a7480' })), [[s * .3, s * .3, s * .2], [s * .8, s * .75, s * .4]], .07 * s, { joint: 0 }); pipeInto(gg(B, tx.pipe({ c: PAL[0] })), [[-s * .5, s * .15, s * .4], [-s * .2, s * .2, s * .95], [-s * .1, s * .02, s * 1.2]], .05 * s, { joint: 0, bend: .2 });
    const t = tx.tin({ c: (o.cs || PAL)[sd % 4], rust: .9 }); gg(B, t, SIDE).at(TR(-s * .55, 0, s * .1, .5 + rn(7), 0, .35)).quad([-s * .35, 0, 0], [s * .35, 0, 0], [s * .35, s * .8, 0], [-s * .35, s * .8, 0], [0, 0, s * .7 / 3, s * .8 / 3]).at(null);
    tireInto(B, TR(s * .75, .3, s * .75, rn(8) * 3, 1.3), .32, .2); tireInto(B, TR(s * .1, s * .58, -s * .1, 0, .3, .2), .3, .2);
    bx(gg(B, tx.plate({ c: PAL[3] })), tx.plate({ c: PAL[3] }), s * .5, s * .28, s * .35, -s * .15, s * .28, s * .55, { taper: .9 }); return B.group(); };
  C.vending = (o = {}) => { const B = R.parts(), c = o.c || '#d8dce4', t = T.metal({ c }); gg(B, t).box(1, 1.85, .7, 0, 0, 0, { m: .5, taper: .97, c0: .7 }); gg(B, tx.vend({ c }), GLOFF).quad([-.46, .06, .351], [.46, .06, .351], [.45, 1.8, .34], [-.45, 1.8, .34]); return B.group(); };
  C.trash = (o = {}) => { const B = R.parts(), c = o.c || '#7a8494'; if (o.kind === 'bin') { const t = tx.plate({ c, n: 1, rust: .8 }); bx(gg(B, t), t, .9, .85, .7, 0, 0, 0, { taper: 1.06, c0: .7 }); const tl = tx.plate({ c: mix(c, '#2a2838', .4), n: 1 }); bx(gg(B, tl), tl, 1, .1, .8, 0, .85, 0, { taper: .9 }); }
    else { gg(B, tx.drum({ c, mark: 'none', seed: 2 })).smooth(1).loft(8, [[0, .24, .24, 0, .7], [.7, .29, .29, 1, 1]], { ur: 2 }); gg(B, tx.plate({ c: mix(c, '#2a2838', .3), n: 1 })).smooth(1).loft(8, [[.7, .31, .31, 0, 1], [.76, .3, .3, .3, 1], [.84, .06, .06, 1, 1.1]], { cap: 'top' }); } return B.group(); };
  // 自転車（x の向き。横から見た絵の板＋ハンドルと荷台）
  C.bike = (o = {}) => { const B = R.parts(); face(gg(B, tx.bike({ c: o.c, box: o.box })), -.9, 0, .9, .9, 0); const M = gg(B, T.metal({ c: '#4a4858' })); M.box(.05, .05, .5, .32, .8, 0, { m: .5 }); M.box(.3, .05, .22, -.6, .6, 0, { m: .5 }); const W = gg(B, T.planks({ c: o.box || '#8f6a44' })); bx(W, T.planks(), .34, .22, .3, -.6, .65, 0); return B.group(); };
  // 三輪の荷車（x の向き。うしろが荷台）。load: 'crates'/'drum'/'none'
  C.trike = (o = {}) => { const B = R.parts(), g = new THREE.Group(), c = o.c || PAL[1], Wd = T.planks({ c: '#8f6a44' }), G = gg(B, Wd), Mt = T.metal({ c }), M = gg(B, Mt);
    bx(G, Wd, 1.2, .08, .95, -.5, .42, 0, { bottom: true }); for (const z of [-.47, .47]) bx(G, Wd, 1.2, .28, .05, -.5, .5, z); bx(G, Wd, .05, .28, .95, -1.1, .5, 0); bx(G, Wd, .05, .28, .95, .1, .5, 0);
    M.at(TR(.1, .46, 0, 0, 0, .5)).box(1.0, .06, .06, .5, 0, 0, { m: .5 }).at(null); M.box(.06, .7, .06, .95, .35, 0, { m: .5 }); M.box(.05, .05, .5, .95, 1.03, 0, { m: .5 }); M.box(.3, .06, .24, .3, .78, 0, { m: .5 }); M.box(.05, .34, .05, .3, .46, 0, { m: .5 });
    const Wh = gg(B, T.wheel({ kind: 'wood' })); face(Wh, .62, 0, 1.28, .66, 0); for (const z of [-.52, .52]) face(Wh, -.83, 0, -.17, .66, z);
    g.add(B.group()); const ld = o.load ?? 'crates'; if (ld === 'crates') { const a = R.crate({ s: .5 }); a.position.set(-.72, .5, -.1); const b = R.crate({ s: .42, kind: 'x' }); b.position.set(-.22, .5, .12); b.rotation.y = .3; g.add(a, b); } else if (ld === 'drum') { const a = C.drum({ h: .7, r: .26, c: PAL[2] }); a.position.set(-.5, .5, 0); g.add(a); } return g; };
  // 電柱。userData.tips ＝ 電線をつなぐ点（[x, y, z]。置いたあとは 柱の位置を足す）
  C.pole = (o = {}) => { const h = o.h || 7, arms = o.arms ?? 2, B = R.parts(), g = new THREE.Group(), tc = tx.conc({ c: '#8a8680' }), tips = []; gg(B, tc).smooth(1).loft(6, [[0, .16, .16, 0, .75], [h, .1, .1, h / 3, 1]], { cap: 'top' });
    const W = gg(B, T.planks({ c: '#6e5238' })); for (let i = 0; i < arms; i++) { const y = h - .5 - i * .7, l = 1.7 - i * .3; W.box(l, .1, .1, 0, y, .12, { m: 2 }); for (const s of [-1, 1]) { W.box(.06, .14, .06, s * (l / 2 - .1), y + .1, .12, { m: 2 }); tips.push([s * (l / 2 - .1), y + .24, .12]); } }
    if (o.box !== false) { const d = C.drum({ h: .7, r: .24, c: '#7a8090', mark: 'none' }); d.position.set(.32, h - 2.6, 0); g.add(d); } if (o.lamp) { const l = C.streetLamp({ h: .01, arm: .8, halo: true }); l.position.set(0, h - 3.2, 0); l.rotation.y = -PI / 2; g.add(l); }
    g.add(B.group()); g.userData.tips = tips; return g; };
  C.poster = (o = {}) => { const s = o.s || 1, m = face(R.geo(), -.25 * s, 0, .25 * s, .75 * s, 0).mesh(tx.poster({ kind: o.kind }), OFF); m.castShadow = false; return m; };
  C.bench = (o = {}) => { const w = o.w || 1.6, B = R.parts(), Wd = T.planks({ c: o.c || '#8f6a44' }), G = gg(B, Wd), M = gg(B, T.metal({ c: '#4a4858' })); bx(G, Wd, w, .06, .4, 0, .42, 0, { bottom: true }); bx(G, Wd, w, .28, .05, 0, .62, -.2); for (const s of [-1, 1]) { M.box(.06, .42, .36, s * (w / 2 - .14), 0, 0, { m: .5, top: false }); M.box(.05, .5, .05, s * (w / 2 - .14), .42, -.2, { m: .5 }); } return B.group(); };
  // 屋台（+z が客がわ）。のれん・ちょうちん・なべの湯気。userData.pot ＝ なべの位置
  C.yatai = (o = {}) => { const B = R.parts(), g = new THREE.Group(), w = o.w || 2.2, d = 1.1, c = o.c || '#c2453a', Wd = T.planks({ c: '#8f6a44' }), G = gg(B, Wd), ey = 2.12, rz = d / 2 + .38;
    bx(G, Wd, w, .55, d, 0, .4, 0, { c0: .75, bottom: true }); bx(G, Wd, w + .3, .07, d + .4, 0, .95, 0, { bottom: true }); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bx(G, Wd, .07, 1.3, .07, x * (w / 2 - .04), 1.02, z * (d / 2 - .04), { top: false });
    flat(gg(B, tx.counter(), OFF), -w / 2, d / 2 - .22, w / 2, d / 2 + .16, 1.025, [Math.round(w / 1.2), 1]);
    const H = gg(B, tx.hood({ c, c2: o.c2, seed: o.seed }), SIDE), hw = w / 2 + .3, n = Math.round(w / .8) + 1; H.quad([-hw, ey, rz], [hw, ey, rz], [hw, ey + .42, 0], [-hw, ey + .42, 0], [0, 0, n, 1], [.9, .9, 1.06, 1.06]); H.quad([hw, ey, -rz], [-hw, ey, -rz], [-hw, ey + .42, 0], [hw, ey + .42, 0], [0, 0, n, 1], [.75, .75, .95, .95]);
    face(gg(B, tx.noren({ c: o.noren || '#2f4a8a', kind: o.kind || 'wave' })), -w / 2, ey - .5, w / 2, ey + .02, rz - .04, [Math.round(w / .7), 1]);
    face(gg(B, tx.shopwin({ kind: 'goods', seed: o.seed }), GLOW), -w / 2 + .05, 1.02, w / 2 - .05, 1.85, -d / 2 + .02, [Math.round(w / 1.1), 1]);
    const Wh = gg(B, T.wheel({ kind: 'wood' })); for (const s of [-1, 1]) Wh.quad([s * (w / 2 + .05), 0, .42 * s], [s * (w / 2 + .05), 0, -.42 * s], [s * (w / 2 + .05), .84, -.42 * s], [s * (w / 2 + .05), .84, .42 * s]);
    const px = w * .24, pz = -.12; gg(B, T.metal({ c: '#8a8c9c' })).smooth(1).at(TR(px, 0, pz)).loft(8, [[1.02, .2, .2, 0, .8], [1.3, .24, .24, 1, 1]], { ur: 2 }).at(null).smooth(0); gg(B, tx.drumTop({ c: '#e8a84a' })).quad([px - .22, 1.28, pz + .22], [px + .22, 1.28, pz + .22], [px + .22, 1.28, pz - .22], [px - .22, 1.28, pz - .22]);
    lanternInto(gg(B, tx.lantern({ kind: 'red' }), GLOW).smooth(1), -hw + .12, ey - .02, rz - .02, .17, .4); g.add(B.group()); g.userData.pot = [px, 1.3, pz];
    if (o.steam !== false) { const s = C.steam({ n: 7, r: .34, rise: 1.5, spread: .22, c: '#fff2dc', a: .5 }); s.position.set(px, 1.32, pz); g.add(s); } return g; };

  // ================= 8. 乗りもの =================
  // 古い電車・貨車（x の向き。車輪の下が y=0。len は 6 の倍数がきれい）
  C.train = (o = {}) => { const k = o.kind || 'pass', len = o.len || 12, n = Math.max(1, Math.round(len / 6)), B = R.parts(), to = { kind: k, c: o.c, c2: o.c2, wreck: o.wreck, seed: o.seed }, ts = tx.train(to), te = tx.trainEnd({ ...to, lit: o.lit }), y0 = .78, h = 2.6, dz = 1.3, tr = tx.tin({ c: '#6a6878', dir: 'h', rust: o.wreck ? .9 : .5 });
    const S = gg(B, ts); face(S, -len / 2, y0, len / 2, y0 + h, dz, [n, 1], [.85, .85, 1, 1]); S.quad([len / 2, y0, -dz], [-len / 2, y0, -dz], [-len / 2, y0 + h, -dz], [len / 2, y0 + h, -dz], [0, 0, n, 1], [.85, .85, 1, 1]);
    if (o.lit && k === 'pass') { const Lw = gg(B, tx.train({ ...to, lit: 1, only: 1 }), GLOFF); face(Lw, -len / 2, y0, len / 2, y0 + h, dz, [n, 1]); Lw.quad([len / 2, y0, -dz], [-len / 2, y0, -dz], [-len / 2, y0 + h, -dz], [len / 2, y0 + h, -dz], [0, 0, n, 1]); }
    const E = gg(B, te); E.quad([len / 2, y0, dz], [len / 2, y0, -dz], [len / 2, y0 + h, -dz], [len / 2, y0 + h, dz]); E.quad([-len / 2, y0, -dz], [-len / 2, y0, dz], [-len / 2, y0 + h, dz], [-len / 2, y0 + h, -dz]);
    const Rf = gg(B, tr); for (let x = -len / 2; x < len / 2 - .01; x += 6) { const x1 = Math.min(len / 2, x + 6); Rf.quad([x, y0 + h, dz], [x1, y0 + h, dz], [x1, y0 + h + .28, dz * .55], [x, y0 + h + .28, dz * .55], [0, 0, 2, .25], [.9, .9, 1.05, 1.05]); Rf.quad([x, y0 + h + .28, dz * .55], [x1, y0 + h + .28, dz * .55], [x1, y0 + h + .28, -dz * .55], [x, y0 + h + .28, -dz * .55], [0, .25, 2, .7]); Rf.quad([x, y0 + h + .28, -dz * .55], [x1, y0 + h + .28, -dz * .55], [x1, y0 + h, -dz], [x, y0 + h, -dz], [0, .7, 2, .95], .8); }
    for (const s of [-1, 1]) Rf.tri([s * len / 2, y0 + h, s * dz], [s * len / 2, y0 + h, -s * dz], [s * len / 2, y0 + h + .28, 0], [0, 0], [.8, 0], [.4, .1], .8);
    const Bg = gg(B, tx.bogie()); for (const z of [-dz + .12, dz - .12]) face(Bg, -len / 2, 0, len / 2, .8, z); const U = gg(B, tx.plate({ c: '#3c3a4c' })); bx(U, tx.plate(), len * .92, .5, dz * 1.4, 0, .3, 0, { bottom: true, top: false }); const g = B.group(); g.userData.len = len; return g; };
  // 小型トラック（x の向き。前が +x）。load: 'drums'/'crates'/'none'
  C.truck = (o = {}) => { const B = R.parts(), g = new THREE.Group(), c = o.c || '#5a8ab0', ts = tx.truckSide({ c, seed: o.seed }), S = gg(B, ts), W = 64, H = 32, hw = .75, y0 = .32, uv = (x0, y0p, x1, y1p) => [x0 / W, 1 - y1p / H, x1 / W, 1 - y0p / H];
    // 運転台（横の絵の 42〜63 ドット）と 荷台（0〜41 ドット）
    for (const s of [1, -1]) { const q = (x0, x1, yb, yt, r, tp = 1) => s > 0 ? S.quad([x0, yb, hw], [x1, yb, hw], [x1, yt, hw * tp], [x0, yt, hw * tp], r) : S.quad([x1, yb, -hw], [x0, yb, -hw], [x0, yt, -hw * tp], [x1, yt, -hw * tp], [r[2], r[1], r[0], r[3]]); q(.55, 1.7, y0, y0 + 1.3, uv(42, 2, 63, 26), .9); q(-1.7, .55, y0, y0 + .86, uv(0, 9, 42, 26)); }
    const F = gg(B, tx.truckFront({ c })); F.quad([1.7, y0, hw], [1.7, y0, -hw], [1.62, y0 + 1.3, -hw * .9], [1.62, y0 + 1.3, hw * .9], [0, .15, 1, 1]);
    const Pb = gg(B, tx.plate({ c, n: 1 })); Pb.quad([.55, y0 + 1.3, hw * .9], [1.62, y0 + 1.3, hw * .9], [1.62, y0 + 1.3, -hw * .9], [.55, y0 + 1.3, -hw * .9], [0, 0, .4, .5]); Pb.quad([.55, y0 + .5, -hw], [.55, y0 + .5, hw], [.55, y0 + 1.3, hw * .9], [.55, y0 + 1.3, -hw * .9], [0, 0, .5, .3], .8);
    const Wd = gg(B, T.planks({ c: '#8f6a44' })); flat(Wd, -1.7, -hw, .55, hw, y0 + .32, [1, .6], .8); Wd.quad([-1.7, y0, -hw], [-1.7, y0, hw], [-1.7, y0 + .86, hw], [-1.7, y0 + .86, -hw], [0, 0, .7, .4], .85); Wd.quad([.55, y0 + .3, hw], [.55, y0 + .3, -hw], [.55, y0 + .86, -hw], [.55, y0 + .86, hw], [0, 0, .7, .3], .7);
    for (const x of [-1.05, 1.1]) for (const s of [-1, 1]) tireInto(B, TR(x, .3, s > 0 ? hw - .2 : -hw, 0, PI / 2), .3, .2); g.add(B.group());
    const ld = o.load ?? 'drums'; if (ld === 'drums') for (const [x, z, cc] of [[-1.25, -.3, PAL[1]], [-.65, .28, PAL[2]], [-.05, -.25, PAL[0]]]) { const d = C.drum({ h: .75, r: .27, c: cc }); d.position.set(x, y0 + .33, z); g.add(d); } else if (ld === 'crates') for (const [x, z, s] of [[-1.2, -.2, .6], [-.5, .15, .7], [.1, -.2, .5]]) { const a = R.crate({ s, kind: s > .6 ? 'x' : 'slash' }); a.position.set(x, y0 + .33, z); g.add(a); } return g; };
  C.moto = (o = {}) => { const B = R.parts(), S = gg(B, tx.moto({ c: o.c })); for (const z of [-.09, .09]) face(S, -1, .02, 1, 1.02, z); for (const x of [-.62, .62]) tireInto(B, TR(x, .32, -.08, 0, PI / 2), .32, .16);
    const M = gg(B, T.metal({ c: '#4a4858' })); M.box(.05, .05, .6, .5, .92, 0, { m: .5 }); M.box(.5, .08, .2, -.25, .7, 0, { m: .5 }); face(gg(B, tx.meter(), GLOW).at(TR(.72, .68, 0, PI / 2)), -.09, 0, .09, .18, 0).at(null); return B.group(); };

  // ================= 9. 効果 =================
  // 蒸気・湯気：丸い かたまりが、わき出て、ふくらみながら うすくなる。置く所に position。dir ＝ ふきだす向き、jet ＝ はじめの いきおい（0〜1）
  C.steam = (o = {}) => { const n = o.n || 9, r = o.r || .5, rise = o.rise || 2.4, spread = o.spread ?? .35, sp = o.speed || .35, al = o.a ?? .55, jet = o.jet || 0, dir = new THREE.Vector3(...(o.dir || [0, 1, 0])).normalize(), wind = o.wind || [0, 0], col = lin(o.c || '#f4f0ff'), ph0 = o.phase || 0;
    const m = quads(n, new THREE.MeshBasicMaterial({ map: puffT(), vertexColors: true, transparent: true, depthWrite: false }), true), rt = new THREE.Vector3(), up = new THREE.Vector3(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), a = new THREE.Vector3(), b = new THREE.Vector3();
    m.userData.tick = (t, cam) => { if (!cam) return; q.setFromRotationMatrix(m4.extractRotation(m.matrixWorld)).invert(); rt.setFromMatrixColumn(cam.matrixWorld, 0).applyQuaternion(q); up.setFromMatrixColumn(cam.matrixWorld, 1).applyQuaternion(q);
      for (let i = 0; i < n; i++) { const ph = (t * sp * (.85 + hash(i, 3) * .3) + i / n + ph0) % 1, tr = jet ? 1 - (1 - ph) ** (1 + jet * 2) : ph, s = r * (.35 + ph * 1.05), sw = spread * ph, x = dir.x * rise * tr + Math.sin(i * 12.9 + ph * 3) * sw + wind[0] * ph * ph, y = dir.y * rise * tr + (dir.y < .5 ? ph * ph * rise * .5 : 0) + Math.sin(i * 4.1 + ph * 2) * sw * .3, z = dir.z * rise * tr + Math.cos(i * 7.3 + ph * 2.3) * sw + wind[1] * ph * ph, an = i * 1.7 + ph * .9, ca = Math.cos(an) * s, sa = Math.sin(an) * s;
        a.copy(rt).multiplyScalar(ca).addScaledVector(up, sa); b.copy(up).multiplyScalar(ca).addScaledVector(rt, -sa); const A = Math.min(1, ph / .12) * (1 - ph) ** 1.15 * al;
        m.userData.put(i, [x - a.x - b.x, y - a.y - b.y, z - a.z - b.z], [x + a.x - b.x, y + a.y - b.y, z + a.z - b.z], [x + a.x + b.x, y + a.y + b.y, z + a.z + b.z], [x - a.x + b.x, y - a.y + b.y, z - a.z + b.z], col, A); } m.userData.flush(); };
    m.renderOrder = 4; return live(m); };
  // 雨（線）。カメラのまわりの箱の中に ふる。slant ＝ ななめ [x, z]
  C.rain = (o = {}) => { const n = o.n || 500, [W, H, D] = o.box || [26, 12, 26], sp = o.speed || 20, sl = o.slant || [.12, 0], ln = o.len || .5, pos = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: o.c || '#b8ccff', transparent: true, opacity: o.a ?? .5, fog: false })); l.frustumCulled = false; l.userData.dyn = true; const md = (v, k) => ((v % k) + k) % k;
    l.userData.tick = (t, cam) => { if (!cam) return; const cx = cam.position.x, cz = cam.position.z; for (let i = 0; i < n; i++) { const y = H - md(t * sp * (.8 + hash(i, 3) * .4) + hash(i, 4) * H, H), x = cx + md(hash(i, 1) * W - cx + sl[0] * y, W) - W / 2, z = cz + md(hash(i, 2) * D - cz + sl[1] * y, D) - D / 2; pos.set([x, y, z, x + sl[0] * ln, y + ln, z + sl[1] * ln], i * 6); } g.attributes.position.needsUpdate = true; }; return live(l); };
  // 火花：every 秒ごとに、置いた所から とびちる。power ＝ いきおい
  C.sparks = (o = {}) => { const n = o.n || 18, ev = o.every || 1.6, pw = o.power || 1, life = o.life || .7, pos = new Float32Array(n * 6), col = new Float32Array(n * 6), g = new THREE.BufferGeometry(), c = lin(o.c || '#ffd27a'); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); l.frustumCulled = false; l.userData.dyn = true; const hl = C.halo({ c: '#fff0c0', r: .5 }); l.add(hl);
    l.userData.tick = t => { const u = t / ev + (o.phase || 0), k = Math.floor(u), age = (u - k) * ev; hl.material.opacity = age < .5 ? (.5 + .5 * Math.sin(age * 60)) * (1 - age * 2) : 0;
      for (let i = 0; i < n; i++) { const a = hash(i, k, 1) * PI * 2, s = (1 + hash(i, k, 2) * 2.2) * pw, vx = Math.cos(a) * s, vz = Math.sin(a) * s, vy = (1.2 + hash(i, k, 3) * 3) * pw, ag = age * (.7 + hash(i, k, 4) * .6), on = ag < life, f = on ? 1 - ag / life : 0, x = vx * ag, y = Math.max(-(o.floor ?? 9), vy * ag - 4.9 * ag * ag), z = vz * ag, d = .05;
        pos.set(on ? [x, y, z, x - vx * d, y - (vy - 9.8 * ag) * d, z - vz * d] : [0, 0, 0, 0, 0, 0], i * 6); col.set([c[0] * f + f * f * .5, c[1] * f + f * f * .4, c[2] * f, c[0] * f * .5, c[1] * f * .3, 0], i * 6); } g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; }; return live(l); };
  return C;
};
