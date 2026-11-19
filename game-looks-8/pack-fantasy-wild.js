// game-looks-8 の題材「ファンタジーの自然・魔法・ダンジョン」の追加の部品（pack）。kit.js・retro.js のあとに読み、 const F = PACK_FWILD(THREE, K, R)  として使う。
// 全部の部品を見るページは pack-fantasy-wild-sheet.html（?p=tex&i=0〜4 でテクスチャ、?p=parts&i=0〜6 で形）。見本の場面は 12-crystal-cave.html と 13-giant-mushroom-forest.html。
//
// ■ 決まり：retro.js と同じ。足もとが y=0、正面が +z、大きさは m。色は '#rrggbb'。どの関数も引数は 1 つの { … } で、全部省ける。
//   動く物・光る物は userData.tick(t) を持つ。毎コマ呼ぶ（R.merge に入れたあとでも動く）。生きものは 名前Pose(物, …, t) で動かす。
//   あかりは light: true のときだけ PointLight を持つ（userData.light）。数を増やしすぎず、F.bake で地面と天井の頂点の色に焼きこむのがおすすめ。
//
// ■ テクスチャ  F.tex.名前({ c, seed, m, … }) → THREE.Texture（R.ground の layers や R.geo の mesh にそのまま使える）
//   地形：caveRock { glint, moss, mossC }  lava { crust, hot }  ice  swamp（コマの並び）  cascade（落ちる水・抜き）  foam（コマの並び）  dungeon { kind: 'wall'/'floor', moss }
//   鉱物・植物：crystal  ore { rock }  cap { kind: 'spot'/'stripe'/'ring'/'fleck'/'plain', c2 }  gill  stem  moss { kind: 'patch'/'tile' }  vine { flowers, fc }  bloom { leaf }
//   骨・宝・人工物：bone  skull  gold { gems }  chest  ironDoor { lit, arch }  rail { wood }  rope  dome
//   魔法・光（加算ではる）：circle { star }  halo  dot  beam  streak  aurora { c2 }  flame { c }（コマの並び）
//   生きもの：dragon { belly, wing, eye }  slime { cheek }  critter { belly }  flyers { wing, dress, skin }
//
// ■ 道具
//   F.glowMat(テクスチャ, { add, opacity, cut, color, side, fog, own }) 光る材質   F.halo(色, 大きさ, 濃さ) にじみの板（Sprite）
//   F.tube(G, [[x,y,z,半径], …], 角の数, { m, ur, cap, up, c }) 曲がった管   F.blobSec(n, seed, ゆがみ) でこぼこの断面   F.vn(x, z, seed) なめらかな乱数
//   F.bake([{ x, y, z, c, r, k }, …], もとの明るさ) → (x, z, y) => [r,g,b]   あかりを R.ground の shade や caveCeil の shade に焼きこむ式
//
// ■ 地形
//   F.caveH({ rx, rz, h, bump, seed, dist(x,z) }) → 天井の高さの式     F.caveCeil({ w, d, cell, H, floor, tex / c, shade, cx, cz }) 洞くつの天井と壁（地面は R.ground）
//   F.spike({ h, r, down, seed, c }) つらら石・石じゅん   F.pillar({ h, r, spire, seed, c }) 岩の柱   F.cliff({ w, h, d, lean, top, seed, c }) がけ（+z 向き）
//   F.floatIsle({ r, h, grass, rock, c, rockC, seed }) 浮島（原点は草の面）
//   F.pool({ kind: 'water'/'swamp'/'lava'/'ice', r, rz, c, wobble, emissive, y }) 池・沼・溶岩だまり・氷（tick）   F.flow(点の列, はば, { kind, speed, c }) 溶岩や水の流れ（tick）
//   F.waterfall({ w, h, c, lip, speed }) 滝としぶき（tick。原点は滝つぼ）
//   F.stoneBridge({ len, w, rise, rail, c, moss }) 石のそり橋（x 向き。userData.deckY(x)）   F.ropeBridge({ len, w, sag, h, gaps }) つり橋（userData.deckY(x)）
//
// ■ 植物・鉱物・骨・宝
//   F.crystal({ h, r, n, c, seed, glow, halo, light }) 水晶のかたまり（tick）   F.gemOre({ s, c, rock, seed }) 宝石の原石
//   F.mushroom({ h, r, shape: 'dome'/'flat'/'cone'/'bell', kind, c, c2, stemC, gill, lean, skirt, glow, seed }) 巨大きのこ（小さいきのこも h を小さくして作る）
//   F.mushroomHouse({ h, r, stemR, c, c2, kind, shape, door, lit, light }) きのこの家（userData.smoke）
//   F.bloom({ s, c, leaf }) 光る花   F.mossPatch({ r, c, seed }) 光るこけ   F.vine({ len, n, w, c, flowers, glow }) つた（原点は付け根）   F.deadTree({ h, r, branches, seed, c }) 枯れ木
//   F.ribs({ n, w, h, gap, r, broken, lean, spine, c }) ろっ骨のアーチ（z 向きにならぶ）   F.skull({ s, horns, c }) 頭の骨
//   F.coinPile({ r, h, gems, seed }) 金貨の山   F.chest({ s, c, open }) 宝箱（userData.lid）
//
// ■ 人工物
//   F.rail(点の列, { w }) レール   F.mineCart({ load: 'ore'/'gold'/'crystal', c, gem }) トロッコ（+x が前。userData.wheels）   F.mineProp({ w, h, c, lamp, light }) 坑道の木のささえ
//   F.dungeonWall({ len, h, thick, c, moss, crenel }) 石かべ（床は F.tex.dungeon({ kind: 'floor' }) を R.ground に）   F.column({ h, r, broken, c }) 石の柱
//   F.ironDoor({ w, h, lit, c, iron, open }) 鉄の扉（userData.open(0〜1)）   F.observatory({ r, h, c, domeC, lit }) 天文塔（userData.top, lens）
//   F.swampHut({ w, d, stilt, c, roofC, light }) 沼の小屋（userData.smoke, floor）
//
// ■ 魔法・光・空
//   F.torch({ h, wall, c, light, power, range }) たいまつ（tick）   F.brazier({ s, c, light }) かがり火（tick）
//   F.motes({ n, box: [w,h,d], c, size, rise, drift, y }) ただよう・のぼる光の粒（tick(t, 主役の x, z)）   F.beam({ h, r, c, opacity }) 光の柱（tick）   F.magicCircle({ r, c, star, spin }) 魔法陣（tick）
//   F.aurora({ r, y, h, arc, dir, bands, c, c2, opacity }) オーロラ（tick）   F.meteors({ n, r, dir, arc, c }) 流れ星（tick）   F.starDome({ r, stops, n, milky, moon: { az, el, r, c } }) 星空の丸天井
//
// ■ 生きもの（少ない面＋テクスチャ）
//   F.dragon({ s, c, belly, wing, eye }) と F.dragonPose(竜, 'fly'/'walk'/'perch', t)   F.slime({ s, c, cheek, glow }) と F.slimePose(玉, t, はねる高さ)（オリジナルの「しずく玉」）
//   F.critter({ s, c, belly }) と F.critterPose(獣, 'walk'/'sit', t)（長い耳の小さな獣）   F.bat({ s, c, wing }) と F.batPose(こうもり, t)   F.bug({ s, c }) と F.bugPose(虫, t)（光る虫）
//   F.fairy({ s, c, hair, skin, light }) と F.fairyPose(妖精, t)   F.wisp({ s, c, light }) 光の玉（tick）
window.PACK_FWILD = (THREE, K, R) => {
  // ================= 1. 道具 =================
  const { hash, mix, ramp, tone, tn, Px, geo, parts, TR } = R, T = R.tex, TAU = Math.PI * 2, PI = Math.PI, cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  // くり返せるボロノイ（retro.js と同じ式。岩・溶岩・氷のひびの形に使う）
  const voro = (x, y, size, n, jit, seed, sq = 0) => { const cs = size / n, gx = Math.floor(x / cs), gy = Math.floor(y / cs); let b1 = 1e9, b2 = 1e9, id = 0, bx = 0, by = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = gx + i, cy = gy + j, wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n, px = (cx + .5 + (hash(wx, wy, seed) - .5) * jit) * cs, py = (cy + .5 + (hash(wx, wy, seed + 9) - .5) * jit) * cs, ax = x + .5 - px, ay = y + .5 - py, d = Math.hypot(ax, ay) * (1 - sq) + Math.max(Math.abs(ax), Math.abs(ay)) * sq; if (d < b1) { b2 = b1; b1 = d; id = wy * n + wx; bx = ax; by = ay; } else if (d < b2) b2 = d; }
    return { id, d1: b1, d2: b2, dx: bx, dy: by }; };
  // 世界の座標で使う なめらかな乱数（0〜1）
  const vn = (x, z, s = 0) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return (hash(ix, iz, s) * (1 - u) + hash(ix + 1, iz, s) * u) * (1 - v) + (hash(ix, iz + 1, s) * (1 - u) + hash(ix + 1, iz + 1, s) * u) * v; };
  const X = {}, PAINT = {}, cache = new Map();
  const def = (name, m, fn, cut = false) => { PAINT[name] = fn; X[name] = (o = {}) => { const key = name + JSON.stringify(o); let t = cache.get(key); if (!t) cache.set(key, t = T.from(fn(o), { m: o.m || m, cut: typeof cut === 'function' ? cut(o) : cut })); return t; }; };
  const defF = (name, m, fn, n = 4, cut = false) => { PAINT[name] = fn; X[name] = (o = {}) => { const key = name + JSON.stringify(o); let t = cache.get(key); if (!t) cache.set(key, t = [...Array(n)].map((_, f) => T.from(fn(o, f, n), { m: o.m || m, cut }))); return t; }; };
  const dth = (x, y) => (x + y) & 1;

  // ================= 2. テクスチャ（X.名前(o) → THREE.Texture。どれも c（もとの色）・seed・m を取れる） =================
  // ---- 地形 ----
  // 洞くつの岩（青むらさき。割れ目の面＋地層のしま＋光る鉱物のつぶ）。glint: つぶの色（false でなし）、moss: 0〜1 で光るこけ（mossC）
  def('caveRock', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#5c5a94'), sd = o.seed || 0, gl = o.glint === undefined ? '#9adcf0' : o.glint;
    P.each((x, y) => { const v = voro(x, y, 64, 5, .85, sd, .2), e = (v.d2 - v.d1) / 2, t = [3, 2, 3, 4, 2, 3, 3][Math.floor(hash(v.id, 3, sd) * 7)], dir = (v.dx + v.dy * 1.4) / (v.d1 + .01), lay = Math.floor((y + tn(x, y, 16, 16, 64, 64, sd + 3) * 9) / 7) % 3;
      if (e < .7) return C[0]; if (e < 1.5) return dir > 0 ? C[1] : tone(C, t + 1); if (dir < -.9 && e < 4.5) return tone(C, t + 1); if (dir > 1 && e < 3.5) return tone(C, t - 1);
      return lay === 0 && dth(x, y) ? tone(C, t - 1) : lay === 2 && (x + y * 3) % 7 === 0 ? tone(C, t + 1) : C[t]; });
    if (gl) for (let k = 0; k < 9; k++) { const x = Math.floor(hash(k, 1, sd + 4) * 64), y = Math.floor(hash(k, 2, sd + 4) * 64); P.set(x, y, gl); P.set(x + 1, y, mix(gl, C[3], .5)); P.set(x, y + 1, mix(gl, C[2], .6)); if (k % 3 === 0) P.set(x - 1, y - 1, '#ffffff'); }
    if (o.moss) { const G = ramp(o.mossC || '#58c8a0'); P.each((x, y) => tn(x, y, 16, 16, 64, 64, sd + 8) < o.moss * .5 ? G[hash(x, y, sd) > .6 ? 4 : hash(x, y, sd) > .25 ? 3 : 2] : undefined); }
    return P; });
  // 溶岩（黒い岩のかたまりの間を、白→黄→だいだい→赤の割れ目が走る。光る材質ではり、offset を動かして流す）
  def('lava', 4, (o = {}) => { const P = Px(64), C = ramp(o.crust || '#4a2a34'), sd = o.seed || 0, H = o.hot || ['#fff6b0', '#ffc23a', '#f47a22', '#c8401c', '#8a2a22'];
    P.each((x, y) => { const v = voro(x, y, 64, 4, .9, sd, .1), e = (v.d2 - v.d1) / 2 + (tn(x, y, 8, 8, 64, 64, sd + 2) - .5) * 1.4, n = tn(x, y, 8, 8, 64, 64, sd + v.id);
      if (e < .9) return H[0]; if (e < 1.9) return H[1]; if (e < 3) return H[2]; if (e < 3.6) return dth(x, y) ? H[2] : H[3]; if (e < 4.6) return H[3]; if (e < 5.6) return H[4];
      if (hash(v.id, 5, sd) > .55 && n > .8) return H[2]; return n > .66 ? C[3] : n < .3 ? C[1] : C[2]; });
    return P; });
  // 氷（すける青。白いひび・ななめの光のすじ・中のあわ）
  def('ice', 3, (o = {}) => { const P = Px(64), I = ramp(o.c || '#8cc8ea'), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 32, 32, 64, 64, sd) * .6 + tn(x, y, 16, 16, 64, 64, sd + 4) * .4, v = voro(x, y, 64, 3, .9, sd + 1), e = (v.d2 - v.d1) / 2, g = ((x - y) % 32 + 32) % 32;
      if (e < .55) return '#ffffff'; if (e < 1.4 && v.dx + v.dy > 0) return I[2]; if (g < 2 && n > .45) return I[5]; if (g === 2 && n > .5) return I[4];
      return n > .66 ? I[4] : n > .6 && dth(x, y) ? I[4] : n < .3 ? I[2] : n < .36 && dth(x, y) ? I[2] : I[3]; });
    for (let k = 0; k < 6; k++) { let x = hash(k, 1, sd) * 64, y = hash(k, 2, sd) * 64; const a = hash(k, 3, sd) * TAU; for (let s = 0; s < 7 + k; s++) { P.set(x, y, s % 5 === 4 ? I[4] : '#ffffff'); x += Math.cos(a + Math.sin(s) * .6); y += Math.sin(a + Math.sin(s) * .6); } }
    for (let k = 0; k < 8; k++) { const x = Math.floor(hash(k, 4, sd) * 64), y = Math.floor(hash(k, 5, sd) * 64); P.set(x, y, '#ffffff'); P.set(x + 1, y + 1, I[2]); }
    return P; });
  // 沼の水（にごった緑の水に、うき草とはすの葉）→ コマの並び（R.flip で送る）
  defF('swamp', 3, (o = {}, f, n) => { const P = R.paint.water({ c: o.c || '#4f7a52', frame: f, frames: n, seed: o.seed }), sd = o.seed || 0, G = ramp(o.weed || '#8cc85a'); P.each((x, y, c) => c === '#ffffff' ? '#d8e8a8' : undefined);
    for (let k = 0; k < 7; k++) { const cx = hash(k, 1, sd + 2) * 64, cy = hash(k, 2, sd + 2) * 64; for (let i = 0; i < 6; i++) { const x = Math.floor(cx + (hash(k, i, sd + 3) - .5) * 11), y = Math.floor(cy + (hash(k, i, sd + 4) - .5) * 8); P.set(x, y, G[4]); P.set(x + 1, y, G[3]); P.set(x, y + 1, G[2]); P.set(x + 1, y + 1, G[1]); } }
    for (let k = 0; k < 2; k++) { const cx = 14 + k * 33 + Math.floor(hash(k, 6, sd) * 6), cy = 18 + k * 27; P.disc(cx + .5, cy + 1.5, 4.6, G[0]); P.disc(cx, cy, 4.4, G[2]); P.disc(cx - .6, cy - .6, 3, G[3]); P.line(cx, cy, cx + 4, cy + 3, G[0]); P.set(cx - 2, cy - 2, G[5]); if (k === 0) P.bits(cx - 1, cy - 2, [' p ', 'pwp', ' p '], { p: '#f4a8c8', w: '#fff0a0' }); }
    return P; });
  // 落ちる水（32×64 の切りぬき。たてにくり返す。offset.y を動かして落とす）
  def('cascade', 1.5, (o = {}) => { const P = Px(32, 64), W = ramp(o.c || '#8cc8ec');
    P.each((x, y) => { const h1 = hash(x, 0, 3), h2 = hash(x >> 1, 1, 5), ph = (y + Math.floor(h1 * 64)) % 32, wide = h2 > .35; if (ph < 14) return h1 > .78 ? '#ffffff' : h1 > .45 ? W[5] : W[4]; if (ph < 21) return W[4]; if (ph < 26) return wide ? W[3] : null; return wide && h1 > .3 ? W[3] : null; }); return P; }, true);
  // 滝つぼのしぶき（32×16 の切りぬき 4 コマ）
  defF('foam', 1, (o = {}, f) => { const P = Px(32, 16), W = ramp(o.c || '#bfe4ff'); P.clip = true;
    for (let k = 0; k < 8; k++) { const cx = 2 + k * 4 + hash(k, f, 1) * 2, hh = (3 + hash(k, f, 2) * 8) * (1 - Math.abs(k - 3.5) / 6), r = 2 + hash(k, f, 3) * 1.6; P.disc(cx, 16 - hh * .4, r + 1, W[4]); P.disc(cx, 15 - hh * .55, r, '#ffffff'); P.set(cx + (hash(k, f, 4) - .5) * 5, 14 - hh - hash(k, f, 5) * 3, '#ffffff'); P.set(cx + (hash(k, f, 6) - .5) * 6, 15 - hh * .8, W[5]); }
    return P; }, 4, true);

  // ---- 鉱物・植物 ----
  // 水晶（32×64。左半分が明るい面、右半分が暗い面。面のふちの光・ななめの光のすじ・中のきず）。光る材質ではる
  def('crystal', 1, (o = {}) => { const P = Px(32, 64), C = ramp(o.c || '#6ad8f0', 6, { contrast: .9 }), sd = o.seed || 0;
    P.each((x, y) => { const f = x < 16 ? 0 : 1, i = x % 16, d = (i + y * .5 + sd * 5) % 22; if (i === 0) return '#ffffff'; if (i === 15) return C[f ? 1 : 2]; if (i === 1) return C[5];
      let t = f ? 3 : 4; if (d < 3) t += 1; else if (d > 12 && d < 14) t -= 1; if (y < 8 - i * .4) t += 1; if (y > 50 && dth(x, y)) t -= 1; if (y > 58) t -= 1; return tone(C, t); });
    for (let k = 0; k < 5; k++) { const x = 3 + Math.floor(hash(k, 1, sd) * 26), y = 6 + Math.floor(hash(k, 2, sd) * 50); if (x % 16 < 3 || x % 16 > 12) continue; P.set(x, y, '#ffffff'); P.set(x + 1, y + 1, C[5]); P.set(x + 1, y + 2, C[2]); }
    return P; });
  // 宝石の原石のはだ（岩に、色のついた結晶の小さな面がうまる）
  def('ore', 2, (o = {}) => { const P = PAINT.caveRock({ c: o.rock || '#6a6478', seed: o.seed, glint: false }), G = ramp(o.c || '#e8506a'), sd = o.seed || 0;
    for (let k = 0; k < 11; k++) { const x = Math.floor(hash(k, 1, sd + 6) * 60), y = Math.floor(hash(k, 2, sd + 6) * 60), big = k % 3 === 0; P.bits(x, y, big ? [' hh ', 'hmmd', 'mmdd', ' dk '] : [' h ', 'hmd', ' d '], { h: G[5], m: G[4], d: G[3], k: G[1] }); P.set(x, y, '#ffffff'); }
    return P; });
  // きのこのかさ（よこ＝ぐるり、上＝かさのてっぺん、下＝ふち）。kind: 'spot'（白い点）/ 'stripe'（ふちへ広がるすじ）/ 'ring'（輪）/ 'fleck'（こまかい点）/ 'plain'。c2 は点やすじの色
  def('cap', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#d8433a'), S = ramp(o.c2 || '#fff2dc'), kind = o.kind || 'spot', sd = o.seed || 0; P.clip = true;
    P.each((x, y) => { const n = tn(x, y, 16, 8, 64, 64, sd), d = dth(x, y); let t = y < 9 ? 4 : y < 12 ? (d ? 4 : 3) : y < 40 ? 3 : y < 44 ? (d ? 3 : 2) : y < 57 ? 2 : y < 60 ? (d ? 2 : 1) : 1; if (y < 24 && n > .64) t++; if (y > 28 && n < .26) t--; if (y === 63) t = 0; return tone(C, t); });
    const put = (x, y, c) => { if (y > 0 && y < 62) P.set(((x % 64) + 64) % 64, y, c); };
    if (kind === 'spot') for (let k = 0; k < 9; k++) { const row = Math.floor(k / 3), col = k % 3, cx = (col * 21.3 + row * 9 + hash(k, 1, sd) * 6) % 64, cy = 11 + row * 17 + hash(k, 2, sd) * 5, ry = (4 + hash(k, 3, sd) * 3.6) * (row ? 1 : .75), rx = Math.min(9.5, ry * (o.ax || .62));
        for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry, r = Math.hypot(dx, dy) + (hash(x, y, sd + k) - .5) * .14; if (r > 1.22) continue; if (r > 1) { if (dx + dy > .3) put(x, y, C[1]); continue; } put(x, y, dx + dy > .8 ? S[2] : dx + dy < -.75 ? '#ffffff' : S[3]); } }
    if (kind === 'stripe') P.each((x, y) => { if (y < 6 || y > 61) return; const i = (x + Math.floor(tn(x, y, 8, 16, 64, 64, sd) * 3)) % 16, w = 1.5 + y / 13; return i < w ? (i < 1 ? S[2] : i > w - 1 ? S[4] : S[3]) : undefined; });
    if (kind === 'ring') P.each((x, y) => { const yy = y + Math.round(Math.sin(x / 64 * TAU * 2) * 2.5 + Math.sin(x / 64 * TAU * 5) * 1); for (const [a, b] of [[16, 22], [34, 43]]) if (yy >= a && yy <= b) return yy === a ? S[4] : yy === b ? S[2] : (hash(x, y, sd) > .9 ? S[2] : S[3]); });
    if (kind === 'fleck') for (let k = 0; k < 46; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = 5 + Math.floor(hash(k, 2, sd) * 54); put(x, y, S[4]); put(x, y + 1, S[3]); if (k % 2) put(x + 1, y + 1, S[2]); }
    return P; });
  // きのこのひだ（たての細い線）
  def('gill', 1, (o = {}) => { const P = Px(32), G = ramp(o.c || '#f2dcb8'); P.each((x, y) => { const i = (x + (y > 20 && hash(x >> 2, 1) > .5 ? 1 : 0)) % 4; let t = [4, 3, 2, 1][i]; if (y < 6) t -= 1; if (y > 27 && i < 2) t += 1; return tone(G, t); }); return P; });
  // きのこのじく（たてのすじ・しみ）
  def('stem', 2, (o = {}) => { const P = Px(32, 64), S = ramp(o.c || '#ecdcc0'), sd = o.seed || 0;
    P.each((x, y) => { const wx = x + (tn(x, y, 8, 16, 32, 64, sd + 5) - .5) * 3, n = tn(wx, y, 4, 32, 32, 64, sd) * .7 + tn(wx, y, 2, 8, 32, 64, sd + 2) * .3; let t = n < .3 ? 2 : n < .5 ? 3 : n < .56 ? 4 : n < .8 ? 3 : 4; if (y > 54 && dth(x, y)) t--; if (y > 60) t--; return tone(S, t); });
    for (let k = 0; k < 9; k++) { const x = Math.floor(hash(k, 1, sd) * 32), y = Math.floor(hash(k, 2, sd) * 60); P.set(x, y, S[1]); P.set(x, y + 1, S[1]); P.set(x, y + 2, S[2]); P.set(x + 1, y + 1, S[5]); }
    return P; });
  // 光るこけ。kind: 'patch'（地面や岩にはる丸いかたまりの切りぬき）/ 'tile'（くり返し）
  def('moss', 1.5, (o = {}) => { const P = Px(32), G = ramp(o.c || '#58e0b0'), sd = o.seed || 0, tile = o.kind === 'tile'; P.clip = !tile;
    P.each((x, y) => { const a = Math.atan2(y - 15.5, x - 15.5), d = Math.hypot(x - 15.5, y - 15.5), edge = 11 + (hash(Math.floor(a * 2.5 + 9), 1, sd) - .5) * 6 + tn(x, y, 8, 8, 32, 32, sd) * 3; if (!tile && d > edge) return null; const n = tn(x, y, 4, 4, 32, 32, sd + 2);
      if (!tile && d > edge - 1.2) return G[1]; return n > .72 ? G[5] : n > .5 ? G[4] : n < .22 ? G[2] : G[3]; });
    for (let k = 0; k < 6; k++) { const x = 6 + Math.floor(hash(k, 1, sd) * 20), y = 6 + Math.floor(hash(k, 2, sd) * 20); P.set(x, y, '#ffffff'); }
    return P; }, o => o.kind !== 'tile');
  // つた（16×64 の切りぬき。上からさがる）。flowers: true で光る花
  def('vine', 1, (o = {}) => { const P = Px(16, 64), G = ramp(o.c || '#3f9a5a'), fc = o.fc || '#ffe890', sd = o.seed || 0; P.clip = true;
    for (let y = 0; y < 64 - (sd % 3) * 6; y++) { const x = 8 + Math.sin(y * .28 + sd) * 2.6; P.set(x, y, G[2]); if (y % 7 === 3) { const s = (y / 7 | 0) % 2 ? 1 : -1; P.bits(Math.round(x) + (s > 0 ? 1 : -4), y - 1, s > 0 ? ['hm ', 'mmd', ' d '] : [' mh', 'dmm', ' d '], { h: G[5], m: G[4], d: G[3] }); }
      if (o.flowers && y % 21 === 12) { const fx = Math.round(x) + ((y / 21 | 0) % 2 ? 2 : -3); P.bits(fx, y, ['ff', 'fw'], { f: fc, w: '#ffffff' }); } }
    return P; }, true);
  // 光る花（32×32 の切りぬき。つりがね形の花が 3 つ）
  def('bloom', 1, (o = {}) => { const P = Px(32), G = ramp(o.leaf || '#2f8a6a'), c = o.c || '#7af0ff', w = mix(c, '#ffffff', .7), d = mix(c, '#2a4a8a', .35); P.clip = true;
    for (const [tx, ty, bx] of [[7, 11, 14], [16, 5, 16], [25, 13, 18]]) { for (let s = 0; s <= 24; s++) { const u = s / 24, x = bx + (tx - bx) * u * u, y = 31 - (31 - ty) * u; P.set(x, y, u > .8 ? G[4] : G[3]); } P.bits(tx - 2, ty, [' cc ', 'cwwc', 'cwwd', 'c  d'], { c, w, d }); P.set(tx, ty + 4, '#ffffff'); }
    for (const [bx, lean] of [[11, -1], [15, 0], [20, 1], [13, -2], [18, 2]]) for (let s = 0; s < 9; s++) { P.set(bx + lean * s * s / 26, 31 - s, s > 6 ? G[4] : G[2]); P.set(bx + lean * s * s / 26 + 1, 31 - s, G[3]); }
    return P; }, true);
  // 骨（たてのすじ・小さなあな・ひび）
  def('bone', 1.5, (o = {}) => { const P = Px(32, 64), B = ramp(o.c || '#e6dab8', 6, { cool: .08 }), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 4, 32, 32, 64, sd) * .7 + tn(x, y, 8, 8, 32, 64, sd + 1) * .3; let t = n < .3 ? 2 : n < .62 ? 3 : 4; if ((x * 7 + y * 3) % 23 === 0) t = 2; if (y < 2 || y > 61) t -= 1; return tone(B, t); });
    for (let k = 0; k < 4; k++) { let x = Math.floor(hash(k, 1, sd) * 32); const y0 = Math.floor(hash(k, 2, sd) * 64), len = 10 + Math.floor(hash(k, 3, sd) * 12); for (let s = 0; s < len; s++) { if (hash(k, s, sd + 4) > .7) x += hash(k, s, sd + 5) > .5 ? 1 : -1; P.set(x, y0 + s, B[1]); P.set(x + 1, y0 + s, B[5]); } }
    return P; });
  // 頭の骨の顔（64×32。まん中が正面。丸い目のあな・鼻・歯。てっぺんにこけ）
  def('skull', 3, (o = {}) => { const P = Px(64, 32), B = ramp(o.c || '#e6dab8', 6, { cool: .08 }), G = ramp('#7aaa5a'), D = o.dark || '#4a3c50', sd = o.seed || 0; P.clip = true;
    P.each((x, y) => { const n = tn(x, y, 8, 8, 64, 32, sd); let t = n < .3 ? 2 : n < .7 ? 3 : 4; if (y > 27) t--; if (y < 4 && tn(x, y, 8, 4, 64, 32, sd + 3) > .45) return G[n > .5 ? 4 : 3]; if (y === 4 && hash(x, 1, sd) > .6) return G[2]; return tone(B, t); });
    for (const ex of [26, 38]) { P.disc(ex, 13.5, 5, B[1]); P.disc(ex, 13, 4.2, D); P.disc(ex - .8, 12.2, 2.4, mix(D, '#000000', .3)); P.set(ex + 2, 15, B[2]); }
    P.bits(30, 18, [' dd ', 'dddd', 'd  d'], { d: D }); for (let x = 23; x <= 41; x++) { const i = (x - 23) % 3; P.set(x, 24, B[1]); for (let y = 25; y < 30; y++) P.set(x, y, i === 2 ? B[1] : i === 0 ? B[5] : B[4]); P.set(x, 30, B[2]); }
    for (let s = 0; s < 9; s++) P.set(31 + Math.round(Math.sin(s * 1.3) * 1.2), 3 + s * .8, B[1]);
    return P; });
  // 金貨の山（重なった金貨。ふちの影と光）。gems: true で宝石がまじる
  def('gold', 1.5, (o = {}) => { const P = Px(64), G = ramp(o.c || '#f0c030', 6, { cool: .06, warm: .15 }), sd = o.seed || 0, list = []; P.fill(G[0]);
    for (let k = 0; k < 120; k++) list.push([hash(k, 1, sd) * 64, hash(k, 2, sd) * 64, 3.6 + hash(k, 3, sd) * 1.2]); list.sort((a, b) => a[1] - b[1]);
    for (const [cx, cy, r] of list) { const ry = r * .66; for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) { const dx = (x + .5 - cx) / r, dy = (y + .5 - cy) / ry, d = Math.hypot(dx, dy), d2 = Math.hypot(dx, (y - .5 - cy) / ry);
        if (d > 1) { if (d2 <= 1) P.set(x, y, dx > .2 ? G[1] : G[2]); continue; } P.set(x, y, d > .8 ? (dx + dy < -.2 ? G[5] : G[2]) : d < .45 && dx + dy > .15 ? G[2] : dx + dy < -.5 ? G[4] : G[3]); } P.set(cx - r * .5, cy - ry * .5, '#ffffff'); }
    if (o.gems) for (let k = 0; k < 6; k++) { const J = ramp(['#e8506a', '#4ab0f0', '#5ad88a'][k % 3]), x = Math.floor(hash(k, 5, sd) * 60), y = Math.floor(hash(k, 6, sd) * 60); P.bits(x, y, [' hh ', 'hmmd', 'mmdd', ' dk '], { h: J[5], m: J[4], d: J[3], k: J[1] }); P.set(x + 1, y, '#ffffff'); }
    return P; });

  // ---- 人工物 ----
  // ダンジョンの石。kind: 'wall'（大きな切り石のつみ。下にこけ）/ 'floor'（四角い敷石。すりへったまん中）
  def('dungeon', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#7e7c96'), G = ramp(o.mossC || '#6a9a5a'), sd = o.seed || 0, moss = o.moss ?? .5;
    if (o.kind === 'floor') { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const split = (i + j) % 2 === 1, x0 = i * 32, y0 = j * 32; for (const [bx, by, bw, bh] of split ? [[0, 0, 16, 32], [16, 0, 16, 32]] : [[0, 0, 32, 32]]) { const t = [3, 2, 3, 4][Math.floor(hash(x0 + bx, y0 + by, sd) * 4)]; P.rect(x0 + bx, y0 + by, bw, bh, C[0]); P.block(x0 + bx, y0 + by, bw - 1, bh - 1, C, t, { round: true });
            for (let y = 4; y < bh - 5; y++) for (let x = 4; x < bw - 5; x++) { const d = Math.abs(x - bw / 2 + .5) / bw + Math.abs(y - bh / 2 + .5) / bh; if (d < .22 && dth(x, y)) P.set(x0 + bx + x, y0 + by + y, tone(C, t + 1)); else if (hash(x0 + bx + x, y0 + by + y, sd) > .95) P.set(x0 + bx + x, y0 + by + y, tone(C, t - 1)); }
            if (hash(x0 + bx, y0 + by, sd + 2) > .4) { let cx = x0 + bx + 3 + Math.floor(hash(bx, y0, sd + 3) * (bw - 8)), cy = y0 + by + 2; for (let s = 0; s < bh * .55; s++) { P.set(cx, cy + s, C[1]); P.set(cx + 1, cy + s, tone(C, t + 1)); if (hash(s, cx, sd) > .6) cx += hash(s, cy, sd) > .5 ? 1 : -1; } } } } }
    else for (let r = 0; r < 4; r++) { const y = r * 16, off = r % 2 ? 11 : 0; let x = off; for (const bw of [22, 21, 21]) { const t = [3, 3, 2, 4, 3][Math.floor(hash(r, x, sd) * 5)]; P.rect(x, y, bw, 16, C[0]); P.block(x, y, bw - 1, 15, C, t, { round: true });
          for (let k = 0; k < 5; k++) { const px = x + 2 + Math.floor(hash(k, x + r, sd + 1) * (bw - 5)), py = y + 2 + Math.floor(hash(k, x + r, sd + 2) * 11); P.set(px, py, tone(C, t - 1)); P.set(px + 1, py, tone(C, t - 1)); P.set(px, py + 1, tone(C, t + 1)); }
          if (hash(r, x, sd + 3) > .6) { P.set(x + bw - 2, y + 14, C[0]); P.set(x + bw - 3, y + 14, C[1]); P.set(x + bw - 2, y + 13, C[1]); }
          if (hash(r, x, sd + 4) > .55) { let cx = x + 4 + Math.floor(hash(r, x, sd + 5) * (bw - 9)); for (let s = 1; s < 9; s++) { P.set(cx, y + s, C[1]); if (s % 3 === 2) cx += hash(s, x, sd) > .5 ? 1 : -1; } }
          x += bw; } }
    if (moss) P.each((x, y) => { const k = o.kind === 'floor' ? tn(x, y, 16, 16, 64, 64, sd + 8) < moss * .3 : (y % 16 > 11 || y > 56) && tn(x, y, 8, 4, 64, 64, sd + 8) < moss * (y > 56 ? .9 : .5); return k && P.get(x, y) !== C[0] ? G[hash(x, y, sd) > .6 ? 4 : hash(x, y, sd) > .25 ? 3 : 2] : undefined; });
    return P; });
  // 鉄の扉（32×64。2 枚びらき。帯とびょう・とってのわ・上に小さな格子窓）。lit で窓にあかり、arch で上が丸い（抜き色つき）
  def('ironDoor', 2, (o = {}) => { const P = Px(32, 64), I = ramp(o.c || '#4a5068'), Gd = ramp('#d8b04a', 6, { cool: .08 }); P.clip = true;
    P.each((x, y) => { if (o.arch && y < 16 && Math.hypot((x - 15.5) / 16, (16 - y) / 16) > 1) return null; const band = [6, 30, 54].some(b => y >= b && y < b + 5); let t = band ? 4 : 3; if (!band && (x * 3 + y) % 11 === 0) t = 2; if (x === 15) t = 1; if (x === 16) t = 5; if (x === 0 || y === 63) t = 1; if (x === 31) t = 1; if (band && (y === 6 || y === 30 || y === 54)) t = 5; if (band && (y === 10 || y === 34 || y === 58)) t = 1; return tone(I, t); });
    for (const by of [8, 32, 56]) for (let x = 3; x < 32; x += 6) { P.set(x, by, I[5]); P.set(x + 1, by, '#ffffff'); P.set(x + 1, by + 1, I[0]); }
    for (const hx of [10, 19]) P.bits(hx, 37, ['ggg', 'g g', 'gdg', ' d '], { g: Gd[4], d: Gd[2] });
    for (const wx of [4, 19]) for (let y = 15; y < 24; y++) for (let x = 0; x < 9; x++) P.set(wx + x, y, x === 0 || y === 15 ? I[1] : x === 8 || y === 23 ? I[5] : x % 3 === 1 ? I[4] : o.lit ? (y < 19 ? '#ffd880' : '#f6a43c') : '#1a1c2a');
    return P; }, o => !!o.arch);
  // 宝箱（64×32。左＝箱の正面、右＝ふた）。木の板に金の帯とかぎ
  def('chest', 1, (o = {}) => { const P = Px(64, 32), W = ramp(o.c || '#8a5a34'), G = ramp('#e8b838', 6, { cool: .08 }); P.clip = true;
    for (const x0 of [0, 32]) { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const row = y >> 3, e = y & 7, n = tn(x + row * 9, y, 8, 2, 32, 32, x0); P.set(x0 + x, y, e === 0 ? W[4] : e === 7 ? W[1] : n > .7 ? W[2] : W[3]); }
      for (const sx of [3, 25]) for (let y = 0; y < 32; y++) { P.set(x0 + sx, y, G[5]); P.set(x0 + sx + 1, y, G[3]); P.set(x0 + sx + 2, y, G[3]); P.set(x0 + sx + 3, y, G[1]); if (y % 8 === 4) { P.set(x0 + sx + 1, y, '#ffffff'); P.set(x0 + sx + 2, y + 1, G[1]); } }
      for (let x = 0; x < 32; x++) { const y = x0 ? 29 : 0; P.set(x0 + x, y, G[5]); P.set(x0 + x, y + 1, G[3]); P.set(x0 + x, y + 2, G[1]); } }
    P.rect(13, 1, 6, 10, G[3]); P.rect(13, 1, 6, 1, G[5]); P.rect(18, 1, 1, 10, G[1]); P.rect(13, 10, 6, 1, G[1]); P.bits(15, 4, ['kk', 'kk', 'k ', 'k '], { k: '#3a2418' });
    return P; });
  // レール（32×32 の切りぬき。上から見た線路。よこ 32 ドット＝はば。まくら木とレール 2 本）
  def('rail', 1.6, (o = {}) => { const P = Px(32), W = ramp(o.wood || '#7a5638'), I = ramp(o.c || '#8a8e9c');
    P.each((x, y) => { const e = y % 16; if ((x >= 6 && x <= 8) || (x >= 23 && x <= 25)) { const i = x < 16 ? x - 6 : x - 23; return i === 0 ? I[5] : i === 1 ? I[3] : I[1]; } if (e >= 4 && e <= 9 && x >= 2 && x <= 29) return e === 4 ? W[4] : e === 9 ? W[1] : (x * 5 + y) % 9 === 0 ? W[2] : W[3]; return null; });
    for (let y = 5; y < 32; y += 16) for (const x of [5, 9, 22, 26]) { P.set(x, y + 1, I[1]); P.set(x, y + 2, I[4]); }
    return P; }, true);
  // つり橋のつな（32×32 の切りぬき。上と下のつな＋ばつ印のあみ）
  def('rope', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#b89868'); P.each((x, y) => { if (y >= 2 && y <= 4) return (x + y) % 4 < 2 ? C[4] : C[2]; if (y >= 28 && y <= 30) return (x + y) % 4 < 2 ? C[3] : C[1]; if (y < 2 || y > 30) return null; const i = x % 16; if (i < 2) return i ? C[2] : C[4]; const d = (y - 4) / 24 * 14; return Math.abs(i - 2 - d) < .7 || Math.abs(i - 2 - (14 - d)) < .7 ? C[3] : null; }); return P; }, true);
  // 天文台のドーム（緑青の銅板。板のつぎ目とびょう）
  def('dome', 2, (o = {}) => { const P = Px(32), C = ramp(o.c || '#4a9a8a'); for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const t = (i + j) % 2 ? 3 : 4; P.block(i * 16, j * 16, 16, 16, C, t - 1 + ((i * 3 + j) % 2)); P.set(i * 16 + 2, j * 16 + 2, C[5]); P.set(i * 16 + 13, j * 16 + 2, C[5]); P.set(i * 16 + 3, j * 16 + 3, C[0]); for (let s = 4; s < 13; s++) if (hash(i, j + s) > .6) P.set(i * 16 + 5 + (s * 3) % 8, j * 16 + s, C[2]); } return P; });

  // ---- 魔法・光（null のドットはすける。加算の材質ではる） ----
  // 魔法陣（64×64。二重の輪・六ぼう星・めもり・まん中のしるし）
  def('circle', 4, (o = {}) => { const P = Px(64), c = o.c || '#8ae8ff', w = mix(c, '#ffffff', .65), d = mix(c, '#203060', .35), star = o.star ?? 6; P.clip = true;
    P.each((x, y) => { const r = Math.hypot(x - 31.5, y - 31.5), a = Math.atan2(y - 31.5, x - 31.5); if (Math.abs(r - 30.2) < 1) return w; if (Math.abs(r - 26.3) < .6) return c; if (r > 26.8 && r < 29.3) { const k = ((a / TAU * 24) % 1 + 1) % 1; return k < .16 ? c : k > .45 && k < .6 && r < 28.6 ? d : null; } if (Math.abs(r - 13) < .7) return c; if (Math.abs(r - 10.4) < .5) return d; return null; });
    const pt = (k, r) => [31.5 + Math.cos(k / star * TAU - PI / 2) * r, 31.5 + Math.sin(k / star * TAU - PI / 2) * r], step = star % 2 ? 2 : 2;
    for (let k = 0; k < star; k++) { const a = pt(k, 25.5), b = pt(k + step, 25.5); P.line(a[0], a[1], b[0], b[1], w); const q = pt(k + .5, 19.5); P.bits(Math.round(q[0]) - 1, Math.round(q[1]) - 1, [' c ', 'cwc', ' c '], { c, w: '#ffffff' }); }
    P.bits(29, 29, ['  ww  ', ' wccw ', 'wc  cw', 'wc  cw', ' wccw ', '  ww  '], { w, c }); return P; });
  // 光の玉のにじみ（16×16。白い芯から点の並びでうすくなる。色は材質でつける）
  def('halo', 1, () => { const P = Px(32), g = v => { const q = Math.round(cl(v) * 255).toString(16).padStart(2, '0'); return '#' + q + q + q; }; P.clip = true; P.each((x, y) => { const d = Math.hypot(x - 15.5, y - 15.5) / 15.5; if (d >= 1) return null; const v = d < .16 ? 1 : Math.pow(1 - (d - .16) / .84, 2.2) * .85; return g(Math.round(v * 9) / 9 + (dth(x, y) ? .03 : -.03)); }); return P; });
  // 光の粒（8×8 の十字）
  def('dot', 1, () => { const P = Px(8); P.clip = true; P.bits(1, 1, ['  ..  ', '  oo  ', '.oWWo.', '.oWWo.', '  oo  ', '  ..  '], { W: '#ffffff', o: '#c0c0c0', '.': '#585858' }); return P; });
  // 光の柱のすじ（16×32。下が明るく、上へ点の並びで消える）
  def('beam', 2, (o = {}) => { const P = Px(16, 32); P.each((x, y) => { const k = (31 - y) / 31, a = hash(x, 1, o.seed || 0), b = hash(x, y >> 2, 7); if (a < .25) return null; if (hash(x, y, 3) < k * 1.1 - .15) return null; return a > .8 && k < .7 ? '#ffffff' : b > .5 ? '#c8c8c8' : '#909090'; }); return P; });
  // 流れ星（32×8。右に頭、左へ点の並びの尾）
  def('streak', 1, () => { const P = Px(32, 8); P.clip = true; P.each((x, y) => { const k = x / 31, d = Math.abs(y - 3.5); if (x > 27) return d < 2 ? '#ffffff' : d < 3 && x < 31 ? '#c0c0d8' : null; if (d > .5 + k * 1.6) return null; return hash(x, y, 2) < k * 1.2 ? (d < 1 ? '#e8e8ff' : '#9090c0') : null; }); return P; });
  // オーロラ（64×32。たての光のすじ。下のふちが明るく、上へ c → c2 に変わりながら消える）
  def('aurora', 8, (o = {}) => { const P = Px(64, 32), c = o.c || '#5af0b0', c2 = o.c2 || '#b080f0', sd = o.seed || 0;
    P.each((x, y) => { const a = tn(x, 0, 8, 8, 64, 32, sd) * .65 + tn(x, 0, 2, 8, 64, 32, sd + 3) * .35, hgt = 9 + a * 23, k = (31 - y) / hgt; if (k > 1 || (a < .3 && dth(x, y))) return null; if (k > .45 && hash(x, y, sd) < (k - .45) * 1.9) return null; if (x % 3 === 0 && a < .6 && k > .2) return null; return k < .06 ? mix(c, '#ffffff', .45) : k < .14 && dth(x, y) ? mix(c, '#ffffff', .3) : mix(c, c2, cl(k * 1.3 - .15)); });
    return P; });
  // ほのお（16×24 の切りぬき 4 コマ）。c を入れると魔法の色の火（もとは だいだい）
  defF('flame', 1, (o = {}, f) => { const P = Px(16, 24), C = o.c ? [mix(o.c, '#201040', .25), o.c, mix(o.c, '#ffffff', .7)] : ['#e8452a', '#ffa832', '#fff6b0']; P.clip = true;
    P.each((x, y) => { const hh = 23 - y, k = hh / 23, sway = Math.sin(hh * .35 + f * 1.6) * 2.2 * k, w = 6.2 * Math.pow(1 - k, .75) * (.82 + .18 * Math.sin(f * 2.1 + hh)) + (k < .12 ? -1.5 + k * 12 : 0), dx = Math.abs(x - 7.5 - sway); if (dx > w) return null; if (k > .62 && hash(x, y, f) > .72) return null; return dx < w * .34 && k < .5 ? C[2] : dx < w * .7 && k < .78 ? C[1] : C[0]; });
    P.set(5 + f * 2, 3 + (f % 2) * 3, C[1]); P.set(11 - f, 1 + f, C[0]); return P; }, 4, true);

  // ---- 生きもの ----
  // 竜（64×64 の 1 枚。上半分＝体をぐるりと巻くうろこ（まん中が腹）、左下＝つばさの膜、右下＝目・角・つめ）
  def('dragon', 2, (o = {}) => { const P = Px(64), C = ramp(o.c || '#c8483a'), Bl = ramp(o.belly || '#f0d090'), Wg = ramp(o.wing || '#f0a050'), Hn = ramp('#e8dcc0', 6, { cool: .08 }); P.clip = true;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const a = Math.abs(x - 31.5); if (a < 8) { const e = y % 5; P.set(x, y, a > 7 ? Bl[2] : e === 0 ? Bl[1] : e === 1 ? Bl[5] : e === 4 ? Bl[3] : Bl[4]); continue; }
      const row = y >> 2, sx = (x + (row % 2) * 3) % 6, sy = y & 3; let t = sy === 0 ? 4 : sy === 3 ? 2 : 3; if (sx === 0) t = 2; if (sx === 1 && sy <= 1) t = 5; if (sx === 5 && sy === 3) t = 1; if (a > 29) t = (y % 6 < 3) ? 1 : 5; else if (a > 27) t = Math.max(1, t - 1); if (a < 10) t = 2; P.set(x, y, tone(C, t)); }
    for (let y = 32; y < 64; y++) for (let x = 0; x < 32; x++) { const edge = 55 + 8 * Math.abs(Math.cos(PI * x / 10.4)); if (y > edge) continue; let c = y < 35 ? (y === 32 ? C[5] : y === 34 ? C[1] : C[3]) : Wg[3]; if (y >= 35) { const rib = [0, 10.4, 20.8, 31.2].some(r0 => Math.abs(x - (r0 - (63 - y) * .12)) < .8); if (rib) c = C[2]; else if ([0, 10.4, 20.8, 31.2].some(r0 => Math.abs(x - 1.4 - (r0 - (63 - y) * .12)) < .8)) c = Wg[5]; else if (y > edge - 2) c = Wg[1]; else if (y > edge - 6 && dth(x, y)) c = Wg[2]; else if ((x + y * 2) % 13 === 0) c = Wg[4]; } P.set(x, y, c); }
    P.rect(32, 32, 8, 8, C[3]); P.bits(32, 32, ['  kkkk  ', ' kyyyyk ', 'kyydyyyk', 'kyydwyyk', 'kyydyyyk', ' kyyyyk ', '  kkkk  ', '        '], { k: C[0], y: o.eye || '#ffe060', d: '#1a1418', w: '#ffffff' });
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) P.set(40 + x, 32 + y, y % 4 === 3 ? Hn[1] : x < 2 ? Hn[5] : x > 5 ? Hn[2] : Hn[3 + (y < 6 ? 1 : 0)]);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) P.set(48 + x, 32 + y, (x % 4 < 2 + (y < 3 ? 1 : 0) - (y > 5 ? 1 : 0)) && y < 7 ? (x % 4 === 0 ? '#ffffff' : Hn[4]) : null);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.set(48 + x, 48 + y, tone(C, (y & 3) === 0 ? 2 : (x + (y >> 2) * 2) % 5 === 0 ? 2 : y < 4 ? 4 : 3));   // 頭の上・うでの単純なうろこ
    return P; }, true);
  // まるい生きもの「しずく玉」（32×32。まん中が顔。大きな目・ほほ・中のあわ）
  def('slime', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#5ad0a0'), ch = o.cheek || '#ff9ab0';
    P.each((x, y) => { const n = tn(x, y, 8, 8, 32, 32, 1); let t = y < 6 ? 5 : y < 10 ? 4 : y < 22 ? 3 : y < 27 ? 2 : 1; if ((y === 6 || y === 10 || y === 22 || y === 27) && dth(x, y)) t++; if (n > .78 && y > 8 && y < 26) t++; return tone(C, t); });
    for (const [bx, by] of [[3, 9], [27, 13], [5, 20], [24, 23], [29, 6]]) { P.set(bx, by, C[5]); P.set(bx + 1, by, '#ffffff'); P.set(bx, by + 1, C[4]); }
    for (const ex of [12, 18]) { P.bits(ex, 12, ['kk', 'kw', 'kk', 'kk', 'kk'], { k: '#1c2a38', w: '#ffffff' }); P.set(ex, 11, C[1]); P.set(ex + 1, 11, C[1]); }
    P.bits(14, 18, ['k  k', ' kk '], { k: '#1c2a38' }); P.rect(9, 17, 2, 2, ch); P.rect(21, 17, 2, 2, ch); P.rect(13, 3, 5, 2, '#ffffff'); P.set(12, 4, '#ffffff'); P.set(19, 6, '#ffffff');
    return P; });
  // 小さな獣「ミミナガ」（64×32。左＝体をぐるりと巻く毛（まん中が腹）、右上＝顔・毛・耳の内がわ、右下＝しっぽのしま）
  def('critter', 1, (o = {}) => { const P = Px(64, 32), C = ramp(o.c || '#d8a86a'), Wt = ramp(o.belly || '#f8ecd4'), pk = '#f09aa8'; P.clip = true;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const a = Math.abs(x - 15.5); P.set(x, y, a < 5 ? Wt[4] : a < 6 ? Wt[3] : a > 13 ? ((y + 1) % 8 < 3 ? C[2] : C[4]) : (x * 3 + y * 5) % 11 === 0 ? C[2] : C[3]); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.set(32 + x, y, y > 9 && Math.abs(x - 7.5) < 5 ? Wt[4] : y < 2 ? C[4] : C[3]);
    for (const ex of [35, 42]) P.bits(ex, 5, ['kk ', 'kwk', 'kkk', ' k '], { k: '#2a1c20', w: '#ffffff' }); P.bits(38, 10, [' pp ', 'k  k', ' kk '], { p: pk, k: '#6a4a3a' }); P.rect(33, 10, 2, 2, pk); P.rect(45, 10, 2, 2, pk);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { P.set(48 + x, y, (x + y * 2) % 7 === 0 ? C[2] : C[3]); P.set(56 + x, y, x > 1 && x < 6 && y > 1 ? (y > 12 ? C[2] : pk) : C[4]); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) P.set(32 + x, 16 + y, y < 4 ? Wt[4] : y < 5 ? Wt[3] : (y - 5) % 5 < 2 ? C[2] : (x * 3 + y) % 7 === 0 ? C[4] : C[3]);
    return P; });
  // こうもり・光る虫・妖精（32×32 の 1 枚。左上＝こうもりの体、右上＝こうもりのつばさ、左下＝虫と妖精の体、右下＝うすい羽）
  def('flyers', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#6a4a8a'), Wg = ramp(o.wing || '#9a6ab0'), D = ramp(o.dress || '#ffe890'); P.clip = true;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) P.set(x, y, y > 12 ? C[2] : (x + y) % 5 === 0 ? C[2] : C[3]); P.set(2, 4, '#ffe060'); P.set(5, 4, '#ffe060'); P.set(3, 7, '#ffffff'); P.set(4, 7, '#ffffff');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 24; x++) { const edge = 10 + 5 * Math.abs(Math.cos(PI * x / 8)); if (y > edge) continue; const rib = [0, 8, 16, 23.5].some(r0 => Math.abs(x - r0 + y * .12) < .7); P.set(8 + x, y, y < 2 ? C[2] : rib ? C[1] : y > edge - 2 ? Wg[2] : Wg[3]); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.set(x, 16 + y, x < 8 ? (y % 4 === 0 ? '#2a2420' : y < 6 ? '#5a4030' : '#3a3028') : (y < 5 ? (o.skin || '#ffe0c8') : y % 5 === 0 ? D[2] : x === 9 ? D[5] : D[3 + (y > 11 ? 1 : 0)]));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot((x - 2) / 13, (y - 8) / 7.5), v = Math.abs(y - 8 - (x - 2) * .3) < .6 || Math.abs(y - 8 + (x - 2) * .3) < .6 || y === 8; if (d > 1 || x < 1) continue; P.set(16 + x, 16 + y, d > .86 ? '#ffffff' : v ? '#e8f8ff' : dth(x, y) ? '#c8ecff' : null); }
    return P; }, true);

  // ================= 3. 材質と形の道具 =================
  const snap = R.mat('#ffffff').onBeforeCompile, gmCache = new Map();
  // 光に関係なく光る材質。o = { add（加算）, opacity, cut, color, side: false で片面, fog, own（自分だけの材質にする） }
  const glowMat = (t, o = {}) => { const key = t.uuid + JSON.stringify(o); let m = o.own ? null : gmCache.get(key); if (m) return m; const tr = !!o.add || (o.opacity ?? 1) < 1;
    m = new THREE.MeshBasicMaterial({ map: t, color: o.color || '#ffffff', vertexColors: true, transparent: tr, opacity: o.opacity ?? 1, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !tr, side: o.side === false ? THREE.FrontSide : THREE.DoubleSide, alphaTest: (o.cut ?? t.userData.cut) && !o.add ? .5 : 0, fog: o.fog ?? !o.add }); m.onBeforeCompile = snap; if (!o.own) gmCache.set(key, m); return m; };
  const own = t => { const c = t.clone(); c.needsUpdate = true; return c; };
  const gmesh = (G, m) => { const me = new THREE.Mesh(G.build(), m); me.castShadow = false; me.receiveShadow = false; return me; };
  // 光の玉のにじみ（いつもカメラを向く板。加算）
  let haloT = null; const halo = (c = '#ffffff', s = 1, op = .7) => { if (!haloT) { haloT = own(X.halo()); haloT.magFilter = THREE.LinearFilter; } const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT, color: c, blending: THREE.AdditiveBlending, transparent: true, opacity: op, depthWrite: false })); sp.scale.setScalar(s); return sp; };
  // でこぼこの輪の断面（R.geo の loft にわたす）
  const blobSec = (n, sd = 0, jit = .22) => { const pts = [], u = []; for (let k = 0; k < n; k++) { const a = (k + .5) / n * TAU, rr = 1 + (hash(k, 7, sd) - .5) * 2 * jit; pts.push([-Math.sin(a) * rr, -Math.cos(a) * rr]); u.push(k / n); } u.push(1); return { pts, u }; };
  // 点の列にそった管（曲がった枝・ろっ骨・くい）。pts: [[x, y, z, 半径], …]、n 角形。o = { m（たて 1 枚が何 m）, ur, cap, up, c: i => 明るさ }
  const tube = (G, pts, n = 5, o = {}) => { const V = pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), rings = [], up0 = new THREE.Vector3(...(o.up || [0, 0, 1])), m = o.m || 1.5, ur = o.ur || 1; let len = 0;
    for (let i = 0; i < V.length; i++) { const t = V[Math.min(V.length - 1, i + 1)].clone().sub(V[Math.max(0, i - 1)]).normalize(), nn = up0.clone().sub(t.clone().multiplyScalar(up0.dot(t))); if (nn.lengthSq() < 1e-4) nn.set(1, 0, 0).sub(t.clone().multiplyScalar(t.x)); nn.normalize(); const b = t.clone().cross(nn), r = pts[i][3] ?? o.r ?? .1, ring = [];
      if (i) len += V[i].distanceTo(V[i - 1]); for (let k = 0; k <= n; k++) { const a = k / n * TAU, ca = Math.cos(a) * r, sa = Math.sin(a) * r; ring.push([V[i].x + nn.x * ca + b.x * sa, V[i].y + nn.y * ca + b.y * sa, V[i].z + nn.z * ca + b.z * sa]); } rings.push([ring, len / m, t]); }
    for (let i = 0; i < rings.length - 1; i++) { const [A, va] = rings[i], [Bq, vb] = rings[i + 1], c0 = o.c ? o.c(i) : 1, c1 = o.c ? o.c(i + 1) : 1; for (let k = 0; k < n; k++) G.quad(A[k], A[k + 1], Bq[k + 1], Bq[k], [k / n * ur, va, (k + 1) / n * ur, vb], [c0, c0, c1, c1]); }
    if (o.cap) { const [A, va] = rings[rings.length - 1], c = V[V.length - 1].toArray(); for (let k = 0; k < n; k++) G.tri(A[k], A[k + 1], c, [0, va], [.3, va], [.15, va + .1]); const [A0] = rings[0], c0 = V[0].toArray(); for (let k = 0; k < n; k++) G.tri(A0[k + 1], A0[k], c0, [0, 0], [.3, 0], [.15, .1]); }
    return G; };
  // あかりを頂点の色に焼きこむ式を作る（R.ground の shade や caveCeil の shade にわたす）。lights: [{ x, y, z, c, r（とどく距離）, k（強さ） }]、base: もとの明るさ（数 か [r,g,b]）
  const bake = (lights, base = .5) => { const L = lights.map(l => { const c = new THREE.Color(l.c || '#ffffff'); return [l.x, l.y ?? 1, l.z, c.r, c.g, c.b, l.r || 8, l.k ?? 1]; }), b = typeof base === 'number' ? [base, base, base] : base;
    return (x, z, y = 0) => { let r = b[0], g = b[1], bl = b[2]; for (const l of L) { const d = Math.hypot(x - l[0], y - l[1], z - l[2]); if (d < l[6]) { const k = (1 - d / l[6]) ** 2 * l[7]; r += l[3] * k; g += l[4] * k; bl += l[5] * k; } } return [r, g, bl]; }; };

  // ================= 4. 地形 =================
  // 洞くつの天井の高さの式。まん中が高く、ふちで地面におりて壁になる。dist(x, z) → 0（まん中）〜1（壁）を入れると、輪の形や通路の形にもできる
  //   rx, rz（広さの半径）, h（天井の高さ）, bump（でこぼこ m）, seed
  const caveH = (o = {}) => { const rx = o.rx || 30, rz = o.rz || rx, h = o.h || 12, sd = o.seed || 0, bump = o.bump ?? 2.2, dist = o.dist || ((x, z) => Math.hypot(x / rx, z / rz));
    return (x, z) => { const d = dist(x, z), k = Math.max(0, 1 - d * d), n = vn(x * .16, z * .16, sd) + vn(x * .4, z * .4, sd + 3) * .4; return h * Math.pow(k, .55) * (.72 + n * .28) + (n - .7) * bump - (d > 1 ? (d - 1) * 30 : 0); }; };
  // 洞くつの天井と壁（下を向いた でこぼこの面。地面より下にもぐった所は作らない）。地面は R.ground、柱やつらら石は pillar / spike を足す
  //   w, d（広さ）, cell（ます目 2.5）, H(x, z)（天井の高さ。省くと caveH(o)）, floor（これより低い所は作らない -1）, tex か c, shade(x, z, y) → 明るさ か [r,g,b]（bake で作れる）, cx, cz
  function caveCeil(o = {}) { const w = o.w || 80, d = o.d || w, cell = o.cell || 2.5, H = o.H || caveH(o), t = o.tex || X.caveRock({ c: o.c }), m = t.userData.m || 3, cx = o.cx || 0, cz = o.cz || 0, nx = Math.round(w / cell), nz = Math.round(d / cell), fl = o.floor ?? -1, G = geo().smooth(0), sh = o.shade, row = [];
    const V = (i, j) => { const key = i * 4096 + j; let v = row[key]; if (v) return v; const x = cx + (i - nx / 2) * cell + (hash(i, j, 5) - .5) * cell * .5, z = cz + (j - nz / 2) * cell + (hash(i, j, 6) - .5) * cell * .5, y = H(x, z); return row[key] = { p: [x, y, z], uv: [(x + y * .45) / m, (z + y * .7) / m], c: sh ? sh(x, z, y) : 1 }; };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = V(i, j), b = V(i + 1, j), c = V(i + 1, j + 1), e = V(i, j + 1); if (a.p[1] < fl && b.p[1] < fl && c.p[1] < fl && e.p[1] < fl) continue; G.tri(a.p, c.p, e.p, a.uv, c.uv, e.uv, [a.c, c.c, e.c]); G.tri(a.p, b.p, c.p, a.uv, b.uv, c.uv, [a.c, b.c, c.c]); }
    const me = G.mesh(t); me.castShadow = false; me.frustumCulled = false; me.userData.H = H; return me; }
  // つらら石（down: true で天井からさがる。原点は天井の付け根）と石じゅん（地面から立つ）。h, r, seed, tex か c
  function spike(o = {}) { const h = o.h || 2, r = o.r || h * .2, sd = o.seed || 0, t = o.tex || X.caveRock({ c: o.c }), bx = (hash(1, 1, sd) - .5) * r, bz = (hash(1, 2, sd) - .5) * r, v = h / 3;
    const rings = o.down ? [[-h, .02, .02, 0, 1.15, bx, bz], [-h * .55, r * .36, r * .36, v * .45, .95, bx * .5, bz * .5], [-h * .2, r * .72, r * .72, v * .8, .8], [0, r * 1.3, r * 1.3, v, .62]] : [[0, r * 1.35, r * 1.35, 0, .68], [h * .2, r * .8, r * .8, v * .2, .9], [h * .6, r * .4, r * .4, v * .6, 1, bx * .5, bz * .5], [h, .02, .02, v, 1.12, bx, bz]];
    return geo().smooth(0).loft(blobSec(5, sd, .15), rings, { ur: Math.max(1, Math.round(r * 2)) }).mesh(t); }
  // 岩の柱（洞くつの柱：上下が太い ／ spire: true で先細りの岩の塔）。h, r, seed, tex か c
  function pillar(o = {}) { const h = o.h || 8, r = o.r || 1.2, sd = o.seed || 0, t = o.tex || X.caveRock({ c: o.c }), m = t.userData.m || 3, j = (i, k) => hash(i, k, sd) - .5, prof = o.spire ? [[0, 1.5], [.1, 1.12], [.4, .86], [.7, .62], [.9, .36], [1, .1]] : [[0, 1.65], [.1, 1.12], [.35, .82], [.6, .78], [.88, 1.08], [1, 1.7]];
    return geo().smooth(0).loft(blobSec(7, sd, .2), prof.map(([v, k], i) => [v * h, r * k * (1 + j(i, 1) * .22), r * k * (1 + j(i, 2) * .22), v * h / m, o.spire ? .68 + v * .42 : .72 + .34 * Math.sin(v * PI), i && i < prof.length - 1 ? j(i, 3) * r * .35 : 0, i && i < prof.length - 1 ? j(i, 4) * r * .35 : 0]), { cap: 'top', ur: Math.max(1, Math.round(r * TAU / m)) }).mesh(t); }
  // がけ（+z を向いた でこぼこの岩かべ。上は平ら）。w, h, d（奥行きのでこぼこ）, lean（うしろへのたおれ）, top（上の面のテクスチャ。省くと岩）, seed, tex か c
  function cliff(o = {}) { const w = o.w || 12, h = o.h || 8, d = o.d || 2.5, sd = o.seed || 0, t = o.tex || X.caveRock({ c: o.c || '#7a7488', glint: false }), m = t.userData.m || 3, nx = Math.max(2, Math.round(w / 2.2)), ny = Math.max(2, Math.round(h / 2.2)), B = parts(), G = B.g(t).smooth(0), Tp = B.g(o.top || t).smooth(0), lean = o.lean ?? .22, bk = -h * lean - d * 2.5;
    const V = (i, j) => { const u = i / nx, v = j / ny, edge = i === 0 || i === nx; return [(u - .5) * w + (edge ? 0 : (hash(i, j, sd) - .5) * .9), v * h + (j && j < ny ? (hash(i, j, sd + 1) - .5) * .8 : 0), -v * h * lean + (hash(i, j, sd + 2) - .5) * d * .7 + (j % 2 ? d * .18 : 0) - (edge ? d * .6 : 0)]; };
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = V(i, j), b = V(i + 1, j), c = V(i + 1, j + 1), e = V(i, j + 1), c0 = .66 + .4 * j / ny, c1 = .66 + .4 * (j + 1) / ny; G.quad(a, b, c, e, [a[0] / m, a[1] / m, b[0] / m, e[1] / m], [c0, c0, c1, c1]); }
    for (let i = 0; i < nx; i++) { const a = V(i, ny), b = V(i + 1, ny); Tp.quad(a, b, [b[0], h, bk], [a[0], h, bk], [a[0] / m, 0, b[0] / m, (a[2] - bk) / m], 1.05); }
    for (let j = 0; j < ny; j++) { const a = V(0, j), e = V(0, j + 1), b = V(nx, j), c = V(nx, j + 1); G.quad([a[0], a[1], bk], a, e, [e[0], e[1], bk], [0, a[1] / m, (a[2] - bk) / m, e[1] / m], .6); G.quad(b, [b[0], b[1], bk], [c[0], c[1], bk], c, [0, b[1] / m, (b[2] - bk) / m, c[1] / m], .6); }
    return B.group(); }
  // 浮島（上が草、下が逆さの岩山。原点は草の面のまん中）。r, h（岩の深さ）, grass, rock（テクスチャ）, c（草の色）, seed。userData.r
  function floatIsle(o = {}) { const r = o.r || 6, h = o.h || r * 1.3, sd = o.seed || 0, n = 10, sec = blobSec(n, sd, .16), gt = o.grass || T.grass({ c: o.c || '#5aa850', flowers: .3 }), rt = o.rock || X.caveRock({ c: o.rockC || '#8a7a70', glint: false }), B = parts(), j = (i, k) => hash(i, k, sd) - .5, mg = gt.userData.m || 3;
    B.g(rt).smooth(0).loft(sec, [[-h, .06 * r, .06 * r, 0, .5, j(0, 1) * r * .3, j(0, 2) * r * .3], [-h * .72, r * .26, r * .26, h * .1, .56, j(1, 1) * r * .3, j(1, 2) * r * .3], [-h * .42, r * .52, r * .52, h * .2, .66, j(2, 1) * r * .2, j(2, 2) * r * .2], [-h * .16, r * .82, r * .82, h * .29, .8], [-.4, r * .98, r * .98, h * .34, .95], [0, r, r, h * .34 + .13, 1]], { ur: Math.max(2, Math.round(r * TAU / 3)) });
    const Gt = B.g(gt).normal([0, 1, 0]), P = (k, q) => { const p = sec.pts[k % n]; return [p[0] * r * q, 0, p[1] * r * q]; }, uv = p => [p[0] / mg, -p[2] / mg];
    for (let k = 0; k < n; k++) { const a = P(k, .5), b = P(k + 1, .5), c = P(k + 1, 1), e = P(k, 1); Gt.tri([0, 0, 0], a, b, [0, 0], uv(a), uv(b)); Gt.tri(a, e, c, uv(a), uv(e), uv(c), [1, .9, .9]); Gt.tri(a, c, b, uv(a), uv(c), uv(b), [1, .9, 1]); }
    const Fr = B.g(T.leaves({ shape: 'fringe', c: o.c || '#5aa850' }), { side: true }).normal([0, 1, 0]), rep = Math.max(1, Math.round(r * TAU / n / 2.5));
    for (let k = 0; k < n; k++) { const a = P(k, 1.01), b = P(k + 1, 1.01); Fr.quad([a[0] * 1.03, -1.1, a[2] * 1.03], [b[0] * 1.03, -1.1, b[2] * 1.03], [b[0], .04, b[2]], [a[0], .04, a[2]], [k * rep, 0, (k + 1) * rep, 1], [.7, .7, 1, 1]); }
    const g = B.group(); g.userData.r = r; return g; }
  // 水たまり・池・溶岩だまり・氷・沼（丸い面を細かく割ったもの）。kind: 'water' / 'swamp' / 'lava' / 'ice'、r, rz, c, wobble（ふちのゆがみ）, emissive（暗い所で水をうすく光らせる色）, y。userData.tick(t) を毎コマ
  function pool(o = {}) { const kind = o.kind || 'water', r = o.r || 6, rz = o.rz || r, seg = o.seg || 16, nr = o.rings || Math.max(2, Math.round(Math.max(r, rz) / 3)), sd = o.seed || 0, G = geo().normal([0, 1, 0]), wob = o.wobble ?? .1;
    const frames = kind === 'water' ? T.water({ c: o.c || '#3f8fc0' }) : kind === 'swamp' ? X.swamp({ c: o.c }) : null, t0 = frames ? frames[0] : own(kind === 'lava' ? X.lava({ seed: sd }) : X.ice({ c: o.c })), m = t0.userData.m || 3;
    const pt = (k, q) => { const a = k / seg * TAU, e = q === nr ? 1 + (hash(k % seg, 3, sd) - .5) * 2 * wob : 1, x = Math.cos(a) * r * q / nr * e, z = Math.sin(a) * rz * q / nr * e; return [[x, 0, z], [x / m, -z / m]]; };
    for (let k = 0; k < seg; k++) { const a = pt(k, 1), b = pt(k + 1, 1); G.tri([0, 0, 0], b[0], a[0], [0, 0], b[1], a[1]); for (let q = 1; q < nr; q++) { const p0 = pt(k, q), p1 = pt(k + 1, q), p2 = pt(k + 1, q + 1), p3 = pt(k, q + 1); G.tri(p0[0], p1[0], p2[0], p0[1], p1[1], p2[1]); G.tri(p0[0], p2[0], p3[0], p0[1], p2[1], p3[1]); } }
    let mt, tick; if (kind === 'lava') { mt = glowMat(t0, { own: true, side: false }); tick = t => { t0.offset.set(t * .012, t * .03); const k = .92 + Math.sin(t * 1.7) * .08; mt.color.setRGB(k, k, k); }; }
    else { mt = R.mat(t0, { vc: true, smooth: true }).clone(); mt.onBeforeCompile = snap; if (o.emissive || kind === 'ice') mt.emissive.set(o.emissive || '#143246'); tick = frames ? t => R.flip(mt, frames, t, o.fps || 4) : () => {}; }
    const me = new THREE.Mesh(G.build(), mt); me.position.y = o.y ?? .06; me.receiveShadow = kind !== 'lava'; me.userData.tick = tick; return me; }
  // 流れ（点の列にそった帯。溶岩の川・水の流れ・沼の水路）。pts: [[x,y,z], …]、wd（はば）、kind: 'water' / 'lava' / 'swamp'、speed。userData.tick(t)
  function flow(pts, wd = 3, o = {}) { const kind = o.kind || 'water', t = own(kind === 'lava' ? X.lava({ seed: o.seed }) : kind === 'swamp' ? X.swamp({ c: o.c })[0] : T.water({ c: o.c || '#3f8fc0' })[0]), me = R.strip(pts, wd, t, { lift: o.lift ?? .05, ur: wd / (t.userData.m || 3), mat: kind === 'lava' ? { glow: true } : {} }), sp = o.speed ?? (kind === 'lava' ? .25 : .9); me.userData.tick = tm => { t.offset.y = -tm * sp / (t.userData.m || 3); }; return me; }
  // 滝（落ちる水の 2 枚がさね＋滝つぼのしぶき＋水けむり。原点は滝つぼ、上は y = h）。w, h, c, lip（下での前へのふくらみ）, speed。userData.tick(t)
  function waterfall(o = {}) { const w = o.w || 3, h = o.h || 10, c = o.c || '#8cc8ec', g = new THREE.Group(), ft = own(X.cascade({ c })), nx = Math.max(2, Math.round(w / 1.2)), ny = Math.max(2, Math.round(h / 2.5)), bow = o.bow ?? .4, lip = o.lip ?? Math.min(1.6, h * .12), G = geo();
    const V = (i, j, back) => { const u = i / nx, v = j / ny; return [(u - .5) * w * (1 + (1 - v) * .12), v * h, Math.sin(u * PI) * bow + Math.pow(1 - v, 1.6) * lip - back]; };
    for (const [back, tint, du] of [[.25, .66, .37], [0, 1, 0]]) { G.tint(tint); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const b0 = 1.12 - .2 * j / ny, b1 = 1.12 - .2 * (j + 1) / ny; G.quad(V(i, j, back), V(i + 1, j, back), V(i + 1, j + 1, back), V(i, j + 1, back), [i / nx * w / 1.5 + du, j / ny * h / 3, (i + 1) / nx * w / 1.5 + du, (j + 1) / ny * h / 3], [b0, b0, b1, b1]); } }
    g.add(gmesh(G, glowMat(ft, { own: true, cut: true })));
    const fr = X.foam({ c: mix(c, '#ffffff', .5) }), fm = glowMat(fr[0], { own: true, cut: true }), F = geo(), fw = w * .75, fh = Math.max(.7, w * .42); for (const [a, z] of [[0, lip + .35], [.7, lip + .1], [-.7, lip + .1]]) { const cx = Math.cos(a) * fw, cz = Math.sin(a) * fw; F.quad([-cx, 0, z - cz], [cx, 0, z + cz], [cx, fh, z + cz], [-cx, fh, z - cz], [0, 0, Math.max(1, Math.round(fw)), 1]); }
    g.add(gmesh(F, fm)); const mist = halo('#dff2ff', w * 1.9, .2); mist.position.set(0, fh * .7, lip); g.add(mist);
    g.userData = { tick: t => { ft.offset.y = t * (o.speed || 1.1); R.flip(fm, fr, t, 8); }, base: [0, 0, lip], top: h }; return g; }
  // 石の橋（x の向きにかかる そり橋。両はしが y=0）。len, w, rise（そりの高さ）, rail（らんかんの高さ）, tex か c, moss。userData.deckY(x) → 橋の上の高さ
  function stoneBridge(o = {}) { const len = o.len || 12, w = o.w || 3, rise = o.rise ?? len * .1, n = o.n || Math.max(4, Math.round(len / 1.6)), t = o.tex || T.stone({ c: o.c || '#9a968c', moss: o.moss ?? .4 }), m = t.userData.m || 3, B = parts(), G = B.g(t).smooth(0), D = B.g(o.deck || T.cobble({ kind: 'slab', c: o.c || '#a8a294' })).smooth(0), th = o.thick || .55, ph = o.rail ?? .7, hw = w / 2, pw = .3, drop = o.drop ?? 2.6;
    const yd = u => rise * (1 - (2 * u - 1) ** 2), yu = u => yd(u) - th - drop * Math.abs(2 * u - 1) ** 2.6;
    for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, x0 = (u0 - .5) * len, x1 = (u1 - .5) * len, a0 = yd(u0), a1 = yd(u1), b0 = yu(u0), b1 = yu(u1), U = [x0 / m, 0, x1 / m, 1];
      D.quad([x0, a0, hw - pw], [x1, a1, hw - pw], [x1, a1, -hw + pw], [x0, a0, -hw + pw], [x0 / 3, 0, x1 / 3, (w - pw * 2) / 3]); G.quad([x0, b0, -hw], [x1, b1, -hw], [x1, b1, hw], [x0, b0, hw], [x0 / m, 0, x1 / m, w / m], .5);
      const sv = [x0 / m, b0 / m, x1 / m, (a0 + ph) / m]; G.quad([x0, b0, hw], [x1, b1, hw], [x1, a1 + ph, hw], [x0, a0 + ph, hw], sv, [.7, .7, 1, 1]); G.quad([x1, b1, -hw], [x0, b0, -hw], [x0, a0 + ph, -hw], [x1, a1 + ph, -hw], sv, [.6, .6, .85, .85]);
      const iv = [x0 / m, 0, x1 / m, ph / m]; G.quad([x1, a1, hw - pw], [x0, a0, hw - pw], [x0, a0 + ph, hw - pw], [x1, a1 + ph, hw - pw], iv, .8); G.quad([x0, a0, -hw + pw], [x1, a1, -hw + pw], [x1, a1 + ph, -hw + pw], [x0, a0 + ph, -hw + pw], iv, .95);
      G.quad([x0, a0 + ph, hw], [x1, a1 + ph, hw], [x1, a1 + ph, hw - pw], [x0, a0 + ph, hw - pw], [x0 / m, 0, x1 / m, .1], 1.08); G.quad([x0, a0 + ph, -hw + pw], [x1, a1 + ph, -hw + pw], [x1, a1 + ph, -hw], [x0, a0 + ph, -hw], [x0 / m, 0, x1 / m, .1], 1.08); }
    const g = B.group(); g.userData.deckY = x => yd(cl(x / len + .5)); return g; }
  // つり橋（x の向き。板がたわんでならび、つなのあみが両がわにつく。両はしが y=0）。len, w, sag（たるみ）, h（つなの高さ）, gaps（板のぬけ 0〜1）。userData.deckY(x)
  function ropeBridge(o = {}) { const len = o.len || 14, w = o.w || 1.6, sag = o.sag ?? len * .07, n = Math.max(6, Math.round(len / .55)), B = parts(), W = B.g(T.planks({ c: o.c || '#8f6a44' })).smooth(0), Rp = B.g(X.rope({}), { side: true }).normal([0, 1, 0]), y = u => -sag * (1 - (2 * u - 1) ** 2), hh = o.h || 1;
    for (let i = 0; i < n; i++) { const u = (i + .5) / n, x = (u - .5) * len, sl = Math.atan2(y(u + .01) - y(u - .01), .02 * len); if (hash(i, 2, o.seed || 0) < (o.gaps ?? .05)) continue; W.at(TR(x, y(u), 0, (hash(i, 1) - .5) * .12, 0, sl)).box(len / n * .86, .06, w, 0, -.03, 0, { m: 1.2, c0: .8 }); } W.at(null);
    for (const z of [-w / 2, w / 2]) { for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, x0 = (u0 - .5) * len, x1 = (u1 - .5) * len; Rp.quad([x0, y(u0), z], [x1, y(u1), z], [x1, y(u1) + hh, z], [x0, y(u0) + hh, z], [x0, 0, x1, 1], [.85, .85, 1, 1]); } for (const x of [-len / 2, len / 2]) W.box(.18, hh + .6, .18, x, -.3, z, { m: 1.2, c0: .75 }); }
    const g = B.group(); g.userData.deckY = x => y(cl(x / len + .5)); return g; }

  // ================= 5. 植物・鉱物・骨・宝 =================
  // 水晶のかたまり（六角の柱が、まん中の 1 本のまわりに ななめに生える）。h（まん中の高さ）, r, n（本数）, c, seed, glow: false で光らない（うすく自分で光るだけ）,
  //   halo（にじみの板。h が 1.2 以上なら既定でつく）, light: true で PointLight（userData.light）。userData.tick(t) でにじみがゆっくり明滅
  function crystal(o = {}) { const h = o.h || 1.6, n = o.n || 5, sd = o.seed || 0, c = o.c || '#6ad8f0', r = o.r || h * .16, t = X.crystal({ c, seed: sd % 3 }), G = geo().smooth(0), g = new THREE.Group();
    for (let i = 0; i < n; i++) { const main = i === 0, a = hash(i, 1, sd) * TAU, tilt = main ? .08 : .3 + hash(i, 2, sd) * .5, hh = h * (main ? 1 : .35 + hash(i, 3, sd) * .45), rr = r * (main ? 1 : .55 + hash(i, 4, sd) * .3), d = main ? 0 : r * (.5 + hash(i, 5, sd) * .6), br = main ? 1 : .82 + hash(i, 6, sd) * .3;
      G.at(TR(Math.sin(a) * d, -.05, Math.cos(a) * d, a, tilt, 0)).loft(6, [[0, rr * .78, rr * .78, 0, .6 * br], [hh * .72, rr, rr, .72, br], [hh, .02, .02, 1, 1.25 * br]], { ur: 3, rot: hash(i, 7, sd) }); }
    const me = o.glow === false ? G.mesh(t, { emissive: mix(c, '#000000', .6) }) : gmesh(G, glowMat(t, { side: false })); g.add(me); let hl = null;
    if (o.halo ?? (h >= 1.2 && o.glow !== false)) { hl = halo(c, h * 2.2, .42); hl.position.y = h * .55; g.add(hl); }
    if (o.light) { const L = new THREE.PointLight(c, o.power || 10, o.range || h * 5 + 4, 1.6); L.position.y = h * .7; g.add(L); g.userData.light = L; }
    const ph = hash(sd, 9) * TAU; g.userData.tick = tm => { if (hl) hl.material.opacity = .34 + .12 * Math.sin(tm * 1.3 + ph); }; return g; }
  // 宝石の原石（岩のかたまりに、色の結晶がうまり、小さな水晶が生える）。s, c（宝石の色）, rock, seed
  function gemOre(o = {}) { const s = o.s || 1, sd = o.seed || 0, g = new THREE.Group(), c = o.c || '#e8506a';
    g.add(geo().smooth(0).loft(blobSec(6, sd, .2), [[0, s * .9, s * .8, 0, .7], [s * .3, s, s * .9, .3, .9], [s * .62, s * .66, s * .6, .62, 1.05, s * .08], [s * .8, s * .25, s * .25, .85, 1.1, s * .1]], { cap: 'top', ur: 2 }).mesh(X.ore({ c, rock: o.rock, seed: sd % 3 })));
    const cr = crystal({ h: s * .7, n: 3, c, seed: sd, halo: false }); cr.position.set(s * .2, s * .48, s * .15); cr.rotation.z = -.35; g.add(cr); return g; }
  // きのこのかさの輪（形ごと）
  const CAPS = { dome: [[.93, -.07], [1, 0], [.97, .14], [.86, .36], [.66, .62], [.4, .85], [.14, .97]], flat: [[.95, -.05], [1, 0], [.98, .12], [.88, .3], [.68, .45], [.4, .55], [.12, .6]], cone: [[.94, -.06], [1, 0], [.8, .12], [.56, .34], [.36, .6], [.2, .84], [.06, 1]], bell: [[.84, -.04], [.9, 0], [1, .12], [.95, .42], [.76, .7], [.46, .9], [.15, 1]] };
  const capLoft = (B, o, r, capH, y0, cx, cz, sd) => { const P = CAPS[o.shape || 'dome'], n = r > 2.5 ? 10 : 8, ur = r > 1.2 ? Math.max(2, Math.round(r * .9)) : 1, j = (i, k) => 1 + (hash(i, k, sd) - .5) * .08;
    B.g(X.cap({ kind: o.kind || 'spot', c: o.c, c2: o.c2, seed: sd % 3, ax: Math.max(.5, Math.round(ur * 2.6) / 10) })).smooth(2 + sd).loft(n, P.map(([k, v], i) => [y0 + v * capH, r * k * j(i, 1), r * k * j(i, 2), i === 0 ? 0 : .02 + Math.max(0, v) * .96, i === 0 ? .55 : .78 + v * .34, cx, cz]), { cap: 'top', ur, rot: hash(sd, 3) });
    const gt = X.gill({ c: o.gill }), Gg = o.glow ? B.g(glowMat(gt, { color: typeof o.glow === 'string' ? o.glow : '#fff0c8' })) : B.g(gt, { side: true, emissive: mix(o.gill || '#f2dcb8', '#000000', .6) }); Gg.smooth(0).loft(n, [[y0 + P[0][1] * capH, r * P[0][0], r * P[0][0], 0, o.glow ? 1 : .8, cx, cz], [y0 + capH * .16, o.neck, o.neck, 1, o.glow ? .5 : .5, cx, cz]], { ur: Math.max(2, Math.round(r * 5)), rot: hash(sd, 3) }); };
  // 巨大きのこ。h（高さ）, r（かさの半径）, shape: 'dome' / 'flat' / 'cone' / 'bell'、kind（かさの柄：'spot' / 'stripe' / 'ring' / 'fleck' / 'plain'）, c, c2, stemC, gill（ひだの色）,
  //   lean（じくの曲がり 0〜1）, skirt（つば）, glow（true か色：ひだが光る）, seed。小さいきのこも同じ関数で作れる（h: .5 など）。userData.top = かさのてっぺんの位置
  function mushroom(o = {}) { const h = o.h || 6, r = o.r || h * .5, sd = o.seed || 0, B = parts(), sr = o.stemR || Math.max(.05, r * .15 + h * .012), lean = o.lean ?? .5, lx = (hash(1, 1, sd) - .5) * h * .24 * lean, lz = (hash(1, 2, sd) - .5) * h * .24 * lean, capH = o.capH || r * ({ dome: .62, flat: .6, cone: 1.05, bell: .9 }[o.shape || 'dome']), y0 = h - capH * ({ flat: .6 }[o.shape] || 1), vs = Math.max(2, Math.min(4, sr * 5));
    B.g(X.stem({ c: o.stemC, seed: sd % 2 })).smooth(1).loft(8, [[0, 1.75, .7], [.05, 1.4, .85], [.3, 1.05, .95], [.7, .9, 1], [1, .82, .8]].map(([k, q, c]) => { const y = k * (y0 + capH * .2); return [y, sr * q, sr * q, y / vs, c, lx * k * k, lz * k * k]; }), { ur: Math.max(2, Math.round(sr * 3)) });
    if (o.skirt ?? (o.kind || 'spot') === 'spot') { const ys = y0 * .74, k = ys / (y0 + capH * .2); B.g(X.gill({ c: o.gill }), { side: true }).smooth(0).loft(8, [[ys - sr * .55, sr * 1.5, sr * 1.5, 0, .7, lx * k * k, lz * k * k], [ys, sr * .93, sr * .93, 1, 1, lx * k * k, lz * k * k]], { ur: 4 }); }
    capLoft(B, { ...o, neck: sr * .85 }, r, capH, y0, lx, lz, sd); const g = B.group(); g.userData.top = [lx, y0 + capH, lz]; g.userData.r = r; return g; }
  // きのこの家（太いじくに扉と丸い窓、かさの屋根に小さなえんとつ）。h, r, stemR, c, c2, kind, shape, door（扉の色）, lit（窓のあかり）, light: true で入口の PointLight。userData.smoke = えんとつの口
  function mushroomHouse(o = {}) { const h = o.h || 5.2, r = o.r || 3.2, sr = o.stemR || 1.5, sd = o.seed || 0, B = parts(), capH = r * (o.shape === 'cone' ? 1.05 : .7), y0 = h - capH, lit = o.lit ?? true, rad = y => sr * (y < .4 ? 1.14 - y * .3 : 1.02 - (y - .4) / (y0 - .2) * .2), ap = Math.cos(PI / 8);
    B.g(X.stem({ c: o.stemC || '#f0e2c4', m: 3 })).smooth(1).loft(8, [0, .4, y0 * .5, y0 + capH * .2].map((y, i) => [y, rad(y), rad(y), y / 3, [.72, .9, 1, .85][i]]), { ur: 4 });
    capLoft(B, { ...o, neck: sr * .8 }, r, capH, y0, 0, 0, sd);
    const face = (G, a, w, ya, yb, uv, e = .04) => { const c = Math.cos(a), s = Math.sin(a), ra = rad(ya) * ap + e, rb = rad(yb) * ap + e; G.quad([s * ra - c * w / 2, ya, c * ra + s * w / 2], [s * ra + c * w / 2, ya, c * ra - s * w / 2], [s * rb + c * w / 2, yb, c * rb - s * w / 2], [s * rb - c * w / 2, yb, c * rb + s * w / 2], uv); };
    face(B.g(T.door({ arch: 1, c: o.door || '#3f8a7a', lit }), { offset: true }), 0, 1.05, 0, 2.05, [0, 0, 1, 1]);
    const wt = T.window({ arch: 1, lit: lit ? 1 : 0, bars: 'cross', curtain: false, frame: '#8a5a3a' }), Wn = B.g(wt, { offset: true, glow: !!lit }); for (const a of [-PI / 4, PI / 4, PI * .75]) face(Wn, a, .8, 1.15, 1.95, [0, 0, 1, 1]); if (y0 > 3.4) face(Wn, 0, .7, 2.6, 3.3, [0, 0, 1, 1]);
    B.g(T.cobble({ c: '#a8a294' })).smooth(0).loft(6, [[0, 1, .6, 0, .8, 0, sr * 1.25], [.12, .9, .52, .1, 1.05, 0, sr * 1.25]], { cap: 'top', capRect: true });
    const cx = r * .5, cy = y0 + capH * .52, St = B.g(T.stone({ c: '#9a9488' })).smooth(1); tube(St, [[cx, cy, -r * .2, .22], [cx + .05, cy + .5, -r * .2, .2], [cx + .22, cy + .95, -r * .2, .2], [cx + .2, cy + 1.3, -r * .2, .24]], 6, { m: 1.5, ur: 1, cap: true });
    const g = B.group(); g.userData.smoke = [cx + .2, cy + 1.4, -r * .2]; g.userData.r = r; if (o.light) { const L = new THREE.PointLight('#ffc070', o.power || 10, 9, 1.6); L.position.set(0, 2.2, sr + 1); g.add(L); g.userData.light = L; } return g; }
  // 光る花（板を十字に組む。光に関係なく光る）。s, c, leaf
  function bloom(o = {}) { const s = o.s || .7, G = geo(); for (const a of [.4, .4 + PI / 2]) { const cx = Math.cos(a) * s / 2, cz = Math.sin(a) * s / 2; G.quad([-cx, 0, -cz], [cx, 0, cz], [cx, s, cz], [-cx, s, -cz]); } return gmesh(G, glowMat(X.bloom({ c: o.c, leaf: o.leaf }), { cut: true })); }
  // 光るこけ（地面にはる丸い板。tilt で岩はだに立てかける）。r, c
  function mossPatch(o = {}) { const r = o.r || .8, G = geo().normal([0, 1, 0]); G.quad([-r, 0, r], [r, 0, r], [r, 0, -r], [-r, 0, -r]); const me = gmesh(G, glowMat(X.moss({ c: o.c, seed: o.seed }), { cut: true })); me.position.y = .05; me.rotation.y = (o.seed || 0) * 1.7; return me; }
  // つた（上からさがる板。原点は付け根）。len, n（本数）, w（広がり）, c, flowers, glow（光る）
  function vine(o = {}) { const len = o.len || 3, n = o.n || 3, sd = o.seed || 0, w = o.w ?? .8, G = geo().normal([0, 1, 0]), t = X.vine({ c: o.c, flowers: o.flowers, fc: o.fc, seed: sd % 3 });
    for (let i = 0; i < n; i++) { const a = hash(i, 1, sd) * PI, x = (hash(i, 2, sd) - .5) * w, z = (hash(i, 3, sd) - .5) * w * .5, l = len * (.6 + hash(i, 4, sd) * .4), cx = Math.cos(a) * .22, cz = Math.sin(a) * .22; G.quad([x - cx, -l, z - cz], [x + cx, -l, z + cz], [x + cx, 0, z + cz], [x - cx, 0, z - cz], [0, 1 - l / 3, 1, 1], [.75, .75, 1, 1]); }
    return o.glow ? gmesh(G, glowMat(t, { cut: true })) : G.mesh(t, { side: true }); }
  // 枯れ木（曲がった幹と、先細りの枝）。h, r, branches, seed, c
  function deadTree(o = {}) { const h = o.h || 5, sd = o.seed || 0, t = o.tex || T.bark({ c: o.c || '#6a5a52' }), G = geo().smooth(1), r = o.r || h * .05, lx = (hash(1, 1, sd) - .5) * h * .3, lz = (hash(1, 2, sd) - .5) * h * .3, tp = k => [lx * k * k + Math.sin(k * 5 + sd) * r * .9, k * h * .82, lz * k * k + Math.cos(k * 4 + sd) * r * .6], trunk = [];
    for (let i = 0; i <= 5; i++) { const k = i / 5; trunk.push([...tp(k), r * (1.45 - k * 1.15) * (i === 0 ? 1.5 : 1)]); } tube(G, trunk, 6, { up: [1, 0, 0], c: i => .75 + i * .06 });
    for (let b = 0; b < (o.branches ?? 4); b++) { const k0 = .38 + b * .15 + hash(b, 2, sd) * .06, p = tp(k0), a = b * 2.4 + hash(b, 3, sd) * 1.2 + sd, L = h * (.3 + hash(b, 4, sd) * .2), r0 = r * (1.45 - k0 * 1.15) * .7, pts = [], bend = (hash(b, 5, sd) - .5) * 1.2;
      for (let s = 0; s <= 3; s++) { const q = s / 3, aa = a + bend * q; pts.push([p[0] + Math.cos(aa) * L * q, p[1] + L * (q * .45 + q * q * .4), p[2] + Math.sin(aa) * L * q, r0 * (1 - q * .85)]); } tube(G, pts, 4, {});
      const f = pts[2], fa = a + 1.1; tube(G, [[f[0], f[1], f[2], r0 * .35], [f[0] + Math.cos(fa) * L * .25, f[1] + L * .2, f[2] + Math.sin(fa) * L * .25, r0 * .2], [f[0] + Math.cos(fa) * L * .4, f[1] + L * .42, f[2] + Math.sin(fa) * L * .4, .01]], 3, {}); }
    return G.mesh(t); }
  // 巨大なろっ骨のアーチ（z の向きにならぶ。下を道が通る）。n（対の数）, w（はば）, h（高さ）, gap（間かく）, r（太さ）, broken（折れた骨の割合）, lean, spine: false で背骨なし, c
  function ribs(o = {}) { const n = o.n || 5, w = o.w || 7, h = o.h || 5.5, gap = o.gap || 2.6, sd = o.seed || 0, t = X.bone({ c: o.c }), G = geo().smooth(1), r = o.r || .24;
    for (let i = 0; i < n; i++) { const z = (i - (n - 1) / 2) * gap, k = 1 - Math.abs(i - (n - 1) / 2) / n * .7, ww = w * k / 2, hh = h * k; for (const s of [-1, 1]) { const brk = hash(i, s + 2, sd) < (o.broken ?? .2), a1 = brk ? .55 + hash(i, s, sd) * .4 : 1.28, pts = [];
        for (let q = 0; q <= 6; q++) { const a = -.15 + (a1 + .15) * q / 6; pts.push([s * ww * Math.cos(a) * (1 + .12 * Math.sin(a * 2)), hh * Math.sin(a), z + Math.sin(a) * (o.lean ?? .6) + (hash(i, q, sd) - .5) * .06, r * k * (1.3 - q / 6 * .8)]); } tube(G, pts, 5, { cap: true, c: q => .8 + q * .05 }); } }
    if (o.spine !== false) for (let i = 0; i < n * 2 - 1; i++) { const z = (i / 2 - (n - 1) / 2) * gap; G.at(TR(0, -.05, z, 0, PI / 2)).loft(6, [[-gap * .22, r * .9, r * .7, 0, .8], [0, r * 1.5, r * 1.1, .15, 1], [gap * .22, r * .9, r * .7, .3, .85]], { cap: 'both' }); } G.at(null);
    return G.mesh(t); }
  // 巨大な頭の骨（丸い目のあな。てっぺんにこけ。こわくしない）。s（高さ m）, horns: true で角, c
  function skull(o = {}) { const s = o.s || 3, B = parts(), G = B.g(X.skull({ c: o.c, seed: o.seed })).smooth(1);
    G.loft(R.SEC9, [[0, .4, .46, .02, .7], [.12, .5, .56, .14, .85], [.3, .5, .6, .3, .95], [.52, .6, .7, .56, 1], [.78, .56, .68, .84, 1.05], [.95, .34, .42, .98, 1.1, 0, -.05]].map(q => q.map((v, i) => i === 3 || i === 4 ? v : v * s)), { cap: 'top', capUV: [.5, .98] });
    if (o.horns) { const Hn = B.g(X.bone({ c: o.c })).smooth(1); for (const sx of [-1, 1]) tube(Hn, [[sx * .5 * s, .7 * s, 0, .12 * s], [sx * .8 * s, .86 * s, -.05 * s, .09 * s], [sx * .95 * s, 1.1 * s, -.02 * s, .05 * s], [sx * .9 * s, 1.3 * s, .05 * s, .01]], 5, {}); }
    return B.group(); }
  // 金貨の山（すそが広がった山）。r, h, gems（宝石まじり）, seed
  function coinPile(o = {}) { const r = o.r || 1.6, h = o.h || r * .62, sd = o.seed || 0, t = X.gold({ gems: o.gems, seed: sd % 2 }), j = (i, k) => 1 + (hash(i, k, sd) - .5) * .25, L = Math.hypot(r, h) / 1.5;
    return geo().smooth(1).loft(blobSec(9, sd, .14), [[0, r * 1.05, r, 0, .82], [h * .14, r * .9 * j(1, 1), r * .88 * j(1, 2), L * .15, .95], [h * .5, r * .55 * j(2, 1), r * .55 * j(2, 2), L * .55, 1.05, r * .06], [h * .85, r * .22, r * .22, L * .88, 1.15, r * .08], [h, .03, .03, L, 1.2, r * .08]], { ur: Math.max(2, Math.round(r * 2.6)) }).mesh(t, { emissive: o.emissive ?? '#3a2400' }); }
  // 宝箱（ふたは userData.lid。open: 0〜1 で開き、中の金貨が光る）。s, c（木の色）, open
  function chest(o = {}) { const s = o.s || 1, t = X.chest({ c: o.c }), g = new THREE.Group(), w = .9 * s, hh = .5 * s, d = .6 * s, open = o.open || 0;
    g.add(geo().smooth(0).rect(0, 0, .5, 1).box(w, hh, d, 0, 0, 0, { c0: .8 }).mesh(t)); const lid = new THREE.Group(); lid.position.set(0, hh, -d / 2); lid.add(geo().smooth(0).rect(.5, 0, 1, 1).box(w * 1.03, hh * .5, d * 1.03, 0, 0, d / 2, { taper: [.96, .72], bottom: true }).mesh(t)); lid.rotation.x = -open * 1.9; g.add(lid);
    if (open) { const G = geo().normal([0, 1, 0]); G.quad([-w * .44, hh * .96, d * .44], [w * .44, hh * .96, d * .44], [w * .44, hh * .96, -d * .44], [-w * .44, hh * .96, -d * .44], [0, 0, .6, .4]); g.add(gmesh(G, glowMat(X.gold({ gems: true }), {}))); const hl = halo('#ffd860', s * 1.5, .5); hl.position.y = hh * 1.3; g.add(hl); }
    g.userData.lid = lid; return g; }

  // ================= 6. 人工物 =================
  // レール（点の列にそってしく）。pts: [[x,y,z], …]、w（はば 1.6）
  const rail = (pts, o = {}) => R.strip(pts, o.w || 1.6, X.rail({ c: o.c, wood: o.wood }), { lift: o.lift ?? .05 });
  // トロッコ（+x が前。userData.wheels を rotation.z で回す）。load: 'ore' / 'gold' / 'crystal' / なし、c（木の色）, gem（つみ荷の色）
  function mineCart(o = {}) { const B = parts(), W = B.g(T.planks({ c: o.c || '#7a5a3c' })).smooth(0), I = B.g(T.metal({ c: '#4a4c58' })).smooth(0), m = 1.2, g = new THREE.Group();
    W.box(1.4, .68, .95, 0, .38, 0, { m, taper: [1.14, 1.16], top: false, c0: .72 }); I.box(1.64, .07, 1.14, 0, 1.03, 0, {}).box(1.3, .1, .8, 0, .29, 0, { top: false, bottom: true }).tint(.35).box(1.44, .02, .96, 0, .98, 0, {}).tint(1); for (const x of [-.45, .45]) I.box(.07, .07, 1.2, x, .2, 0, {}); for (const s of [-1, 1]) I.box(.05, .7, .06, s * .76, .37, 0, { taper: [1, 1] });
    g.add(B.group()); const wm = R.mat(T.wheel({ kind: 'wood', c: '#6a6c78' }), { vc: true, side: true }), wheels = []; for (const x of [-.45, .45]) for (const z of [-.56, .56]) { const wq = new THREE.Mesh(geo().quad([-.24, -.24, 0], [.24, -.24, 0], [.24, .24, 0], [-.24, .24, 0]).build(), wm); wq.position.set(x, .24, z); wq.castShadow = true; g.add(wq); wheels.push(wq); }
    if (o.load === 'gold') { const p = coinPile({ r: .62, h: .45, gems: true }); p.position.y = .95; p.scale.set(1.05, 1, .7); g.add(p); } if (o.load === 'ore') { const p = gemOre({ s: .5, c: o.gem, seed: 2 }); p.position.set(-.1, .9, 0); p.scale.set(1.3, 1, 1); g.add(p); } if (o.load === 'crystal') { const p = crystal({ h: .8, n: 5, c: o.gem, halo: true }); p.position.y = .95; g.add(p); }
    g.userData.wheels = wheels; g.userData.wheelR = .24; return g; }
  // 坑道の木のささえ（2 本の柱＋はり＋すじかい。道をまたぐ）。w, h, c, lamp: true で つりランプ（light: true で PointLight）
  function mineProp(o = {}) { const w = o.w || 3.6, h = o.h || 3.2, B = parts(), G = B.g(T.planks({ c: o.c || '#7a5a3c' })).smooth(0), m = 1.4, th = .26;
    for (const s of [-1, 1]) { G.at(TR(s * w / 2, 0, 0, 0, 0, s * .07)).box(th, h, th, 0, 0, 0, { m, c0: .7 }); G.at(TR(s * (w / 2 - .14), h - 1.0, 0, 0, 0, s * .8)).box(.14, 1.25, .14, 0, 0, 0, { m }); } G.at(null).box(w + .9, th, th + .06, 0, h - .05, 0, { m });
    const g = B.group(); if (o.lamp) { const L = geo().loft(4, [[h - .75, .1, .1, 0], [h - .45, .14, .14, 1]], { rot: .5, ur: 4 }); g.add(gmesh(L, glowMat(T.lamp({}), {})), geo().box(.02, .42, .02, 0, h - .45, 0, {}).box(.3, .05, .3, 0, h - .45, 0, {}).mesh(T.metal({}))); const hl = halo('#ffc070', 1.3, .5); hl.position.y = h - .6; g.add(hl); if (o.light) { const P = new THREE.PointLight('#ffc070', o.power || 10, o.range || 9, 1.6); P.position.y = h - .7; g.add(P); g.userData.light = P; } } return g; }
  // ダンジョンの石かべ（x の向きにのびる。土台と上の帯つき）。len, h, thick, c, moss, crenel: true で上にでこぼこ
  function dungeonWall(o = {}) { const len = o.len || 6, h = o.h || 4.5, th = o.thick || .6, t = o.tex || X.dungeon({ c: o.c, moss: o.moss }), G = geo().smooth(0), m = 3;
    G.box(len, h, th, 0, 0, 0, { m, c0: .7, c1: 1, top: false }).box(len, .36, th + .26, 0, 0, 0, { m, c0: .62, c1: .9 }).box(len, .3, th + .18, 0, h, 0, { m, c0: .9, c1: 1.08 });
    if (o.crenel) { const n = Math.max(1, Math.round(len / 1.5)); for (let i = 0; i < n; i++) G.box(len / n * .55, .6, th + .18, (i + .5) / n * len - len / 2, h + .3, 0, { m, c1: 1.08 }); } return G.mesh(t); }
  // 石の柱（四角い台＋丸い柱＋柱頭）。h, r, broken: true で折れた柱, c, moss, seed
  function column(o = {}) { const h = o.h || 4.5, r = o.r || .4, sd = o.seed || 0, t = o.tex || X.dungeon({ c: o.c, moss: o.moss ?? .3 }), G = geo().smooth(0), hb = o.broken ? h * (.3 + hash(sd, 1) * .3) : h;
    G.loft(4, [[0, r * 2, r * 2, 0, .7], [.32, r * 2, r * 2, .1, .92]], { cap: 'top' }); G.smooth(1).loft(8, o.broken ? [[.32, r * 1.2, r * 1.2, .1, .85], [.5, r, r, .17, 1], [hb, r * .93, r * .93, hb / 3, 1], [hb + r * .5, r * .5, r * .5, hb / 3 + .1, 1.08, r * .3, r * .1]] : [[.32, r * 1.2, r * 1.2, .1, .85], [.5, r, r, .17, 1], [h - .5, r * .9, r * .9, h / 3, 1], [h - .3, r * 1.25, r * 1.25, h / 3 + .08, .9], [h - .12, r * 1.6, r * 1.6, h / 3 + .14, 1.05]], { cap: 'top', ur: 2 });
    if (!o.broken) G.smooth(0).loft(4, [[h - .12, r * 2.1, r * 2.1, 0, .9], [h, r * 2.1, r * 2.1, .05, 1.05]], { cap: 'top' }); return G.mesh(t); }
  // 鉄の扉（石のわく＋2 枚びらきの扉。userData.open(0〜1) で開く）。w, h, lit（のぞき窓のあかり）, c（石）, iron（鉄の色）, open
  function ironDoor(o = {}) { const w = o.w || 2.2, h = o.h || 3.2, st = o.stone || X.dungeon({ c: o.c }), g = new THREE.Group(), S = geo().smooth(0), fw = .55, leaves = [];
    for (const s of [-1, 1]) S.box(fw, h, .9, s * (w / 2 + fw / 2), 0, 0, { m: 3, c0: .7 }).box(fw + .2, .3, 1.1, s * (w / 2 + fw / 2), 0, 0, { m: 3, c0: .65 }); S.box(w + fw * 2 + .3, .6, 1, 0, h, 0, { m: 3 }).box(.7, .75, 1.1, 0, h - .08, 0, { m: 3, taper: [1.25, 1], c0: .9, c1: 1.1 }); g.add(S.mesh(st));
    const dm = R.mat(X.ironDoor({ c: o.iron, lit: o.lit }), { vc: true, side: true }); for (const s of [-1, 1]) { const pv = new THREE.Group(), G = geo(); pv.position.set(s * w / 2, 0, .12); G.quad(s > 0 ? [-w / 2, 0, 0] : [0, 0, 0], s > 0 ? [0, 0, 0] : [w / 2, 0, 0], s > 0 ? [0, h, 0] : [w / 2, h, 0], s > 0 ? [-w / 2, h, 0] : [0, h, 0], s > 0 ? [.5, 0, 1, 1] : [0, 0, .5, 1]); const me = new THREE.Mesh(G.build(), dm); me.castShadow = true; pv.add(me); pv.userData.dyn = true; g.add(pv); leaves.push([pv, s]); }
    g.userData.open = k => { for (const [pv, s] of leaves) pv.rotation.y = s * k * 1.5; }; g.userData.open(o.open || 0); return g; }
  // 天文塔（石の塔＋緑青のドーム＋ドームから出た望遠鏡。正面 +z に扉）。r, h（塔の高さ）, c（石）, domeC, lit（窓のあかり）。userData.top = てっぺんの高さ
  function observatory(o = {}) { const r = o.r || 3.2, h = o.h || 9, B = parts(), S = B.g(o.stone || T.stone({ c: o.c || '#8a8ca0' })).smooth(0), D = B.g(X.dome({ c: o.domeC })).smooth(1), sr = r * .82, ap = Math.cos(PI / 8), yd = h + .45, rad = y => sr * (1.08 - .18 * y / h);
    S.loft(8, [[0, sr * 1.18, sr * 1.18, 0, .7], [.6, sr * 1.12, sr * 1.12, .2, .88], [.6, rad(.6), rad(.6), .2, .9], [h, rad(h), rad(h), h / 3, 1.05], [h, r * 1.08, r * 1.08, h / 3, .8], [yd, r * 1.08, r * 1.08, h / 3 + .15, 1.05]], { ur: Math.max(2, Math.round(sr * TAU / 3)), cap: 'top' });
    D.loft(10, [0, .3, .6, .9, 1.2, 1.45].map((a, i) => [yd + Math.sin(a) * r * .96, Math.cos(a) * r * .98, Math.cos(a) * r * .98, a / 1.5 * 2.4, .8 + i * .06]), { cap: 'top', ur: 5, rot: 0 });
    const I = B.g(T.metal({ c: '#3a3c4c' })).smooth(0); for (let i = 0; i < 4; i++) { const a0 = i * .34, a1 = (i + 1) * .34, hw = .5; I.quad([-hw, yd + Math.sin(a0) * r * .97, Math.cos(a0) * r * 1.0], [hw, yd + Math.sin(a0) * r * .97, Math.cos(a0) * r * 1.0], [hw, yd + Math.sin(a1) * r * .97, Math.cos(a1) * r * 1.0], [-hw, yd + Math.sin(a1) * r * .97, Math.cos(a1) * r * 1.0], [0, 0, 2, 2], .45); }
    const Br = B.g(T.metal({ c: '#c8a04a' })).smooth(1); Br.at(TR(0, yd + r * .3, r * .25, 0, .85)).loft(8, [[0, .38, .38, 0, .7], [r * .95, .38, .38, 3, 1], [r * .95, .46, .46, 3, .9], [r * 1.3, .46, .46, 4, 1.05]], { ur: 3 }).at(null);
    B.g(glowMat(X.ice({ c: '#a8d8f8' }), {})).at(TR(0, yd + r * .3, r * .25, 0, .85)).loft(8, [[r * 1.27, .42, .42, 0, 1]], { cap: 'top', capRect: true }).at(null);
    const face = (G, a, w, ya, yb, e = .05) => { const c = Math.cos(a), s = Math.sin(a), ra = rad(ya) * ap + e, rb = rad(yb) * ap + e; G.quad([s * ra - c * w / 2, ya, c * ra + s * w / 2], [s * ra + c * w / 2, ya, c * ra - s * w / 2], [s * rb + c * w / 2, yb, c * rb - s * w / 2], [s * rb - c * w / 2, yb, c * rb + s * w / 2]); };
    face(B.g(T.door({ arch: 1, c: o.door || '#6a4a3a' }), { offset: true }), 0, 1.1, .6, 2.75); const lit = o.lit ?? true, Wn = B.g(T.window({ arch: 1, lit: lit ? 1 : 0, bars: 'cross', curtain: false }), { offset: true, glow: !!lit }); for (const [a, y] of [[0, 4.4], [PI / 4, 3.2], [-PI / 4, 5.6], [PI / 2, 6.6], [-PI / 2, 2.6], [0, 7.2]]) if (y < h - 1.2) face(Wn, a, .8, y, y + .95);
    const g = B.group(); g.userData.top = yd + r; g.userData.lens = [0, yd + r * .3 + Math.cos(.85) * r * 1.3, r * .25 + Math.sin(.85) * r * 1.3]; return g; }
  // 沼の小屋（曲がったくいの高床＋かたむいた小屋＋曲がったえんとつ＋はしご。こわくしない：窓にあかりと花の箱）。w, d, stilt（床の高さ）, c（かべ）, roofC, light: true で入口の PointLight。userData.smoke, userData.floor
  function swampHut(o = {}) { const g = new THREE.Group(), fh = o.stilt ?? 1.8, w = o.w || 3.4, d = o.d || 3, B = parts(), Bk = B.g(T.bark({ c: '#5a4a40' })).smooth(1), Pl = B.g(T.planks({ c: '#7a6048' })).smooth(0), sd = o.seed || 0;
    for (const [sx, z] of [[-1, -d / 2 + .1], [1, -d / 2 + .1], [-1, d / 2 + .9], [1, d / 2 + .9]]) { const x = sx * (w / 2 + .15), bx = (hash(sx + 2, Math.round(z), sd) - .5) * .5; tube(Bk, [[x * 1.12 + bx, -.4, z * 1.1, .17], [x + bx * .6, fh * .45, z, .13], [x - bx * .3, fh * .8, z, .13], [x, fh + .05, z, .12]], 5, {}); }
    Pl.box(w + 1, .16, d + 1.7, 0, fh, .35, { m: 1.6, c0: .7 }); for (let i = 0; i < 6; i++) Pl.at(TR(0, fh * (i + .5) / 6, d / 2 + 1.25 + (1 - (i + .5) / 6) * .7, 0, 0, 0)).box(.7, .05, .12, 0, 0, 0, { m: 1 }); Pl.at(null);
    for (const s of [-1, 1]) tube(Bk, [[s * .38, -.1, d / 2 + 2, .045], [s * .38, fh + .1, d / 2 + 1.2, .045]], 4, {});
    const hs = R.house({ w, d, h: 2.1, wall: T.boards({ c: o.c || '#7a6a92' }), base: false, roof: T.shingle({ c: o.roofC || '#5a8a6a' }), pitch: 1.15, eave: .55, door: T.door({ c: '#b8683a', arch: 1 }), win: T.window({ box: 1, shutters: 1, lit: 0 }), winLit: T.window({ box: 1, shutters: 1, lit: 1 }), lit: 1, wins: { f: [-1.05], r: 1, b: 0, l: 1 }, doorX: .5, seed: sd }); hs.position.set(0, fh + .16, 0); hs.rotation.z = .05; hs.rotation.y = -.04;
    const St = B.g(T.stone({ c: '#8a8690' })).smooth(1), cx = -w * .22, cy = fh + 3.1; tube(St, [[cx, cy, -.3, .24], [cx - .08, cy + .6, -.3, .22], [cx + .22, cy + 1.1, -.3, .2], [cx + .12, cy + 1.6, -.3, .2], [cx + .3, cy + 1.95, -.3, .25]], 6, { cap: true });
    const lp = geo().loft(4, [[fh + 1.75, .09, .09, 0], [fh + 2.02, .13, .13, 1]], { rot: .5, ur: 4 }), lm = gmesh(lp, glowMat(T.lamp({}), {})); lm.position.set(1.25, 0, d / 2 + .5); const hl = halo('#ffc070', 1.2, .5); hl.position.set(1.25, fh + 1.9, d / 2 + .5);
    g.add(B.group(), hs, lm, hl); if (o.light) { const L = new THREE.PointLight('#ffc070', o.power || 10, 9, 1.6); L.position.set(1.1, fh + 1.9, d / 2 + .8); g.add(L); g.userData.light = L; }
    g.userData.smoke = [cx + .3, cy + 2.1, -.3]; g.userData.floor = fh + .16; return g; }

  // ================= 7. 魔法・光・空 =================
  const flameQuads = (s, c) => { const fr = X.flame({ c }), m = glowMat(fr[0], { cut: true, fl: c || 1 }), G = geo(); for (const a of [.3, .3 + PI / 2]) { const cx = Math.cos(a) * s * .33, cz = Math.sin(a) * s * .33; G.quad([-cx, 0, -cz], [cx, 0, cz], [cx, s, cz], [-cx, s, -cz]); } return { me: gmesh(G, m), m, fr }; };
  const fireTick = (g, F, hl, L, ph, p0) => tm => { F.m.map = F.fr[Math.floor(tm * 9) % 4]; const k = .86 + .1 * Math.sin(tm * 11 + ph) + .06 * Math.sin(tm * 23 + ph * 2); if (L) L.intensity = p0 * k; hl.material.opacity = .5 * k; };
  // たいまつ（立てる棒。wall: true でかべから ななめに出る）。h, c（ほのおの色。省くとだいだい）, light: false で PointLight なし, power, range。userData.tick(t) で火がゆらぐ
  function torch(o = {}) { const h = o.h || 1.7, g = new THREE.Group(), B = parts(), body = new THREE.Group(), lc = o.c || '#ffb060', ph = hash(o.seed || 0, 3) * TAU;
    B.g(T.bark({ c: '#5a4030' })).smooth(1).loft(5, [[0, .045, .045, 0, .75], [h, .06, .06, h / 1.5, 1]]); B.g(T.metal({ c: '#4a4c58' })).smooth(0).loft(6, [[h - .06, .065, .065, 0, .8], [h + .12, .125, .125, 1, 1.05]]);
    const F = flameQuads(o.fs || .55, o.c); F.me.position.y = h + .06; const hl = halo(lc, 1.5, .5); hl.position.y = h + .35; body.add(B.group(), F.me, hl); let L = null; if (o.light !== false) { L = new THREE.PointLight(lc, o.power || 12, o.range || 10, 1.6); L.position.y = h + .35; body.add(L); g.userData.light = L; }
    if (o.wall) { body.rotation.x = .5; body.position.set(0, (o.y ?? 1.5) - h * .6, .05); } g.add(body); g.userData.tick = fireTick(g, F, hl, L, ph, o.power || 12); return g; }
  // かがり火（三本足の鉄のうつわ＋大きな火）。s（大きさ）, c, light, power, range。userData.tick(t)
  function brazier(o = {}) { const s = o.s || 1, g = new THREE.Group(), B = parts(), I = B.g(T.metal({ c: '#4a4c58' })).smooth(0), lc = o.c || '#ffb060', ph = hash(o.seed || 0, 4) * TAU;
    I.loft(8, [[.72 * s, .12 * s, .12 * s, 0, .7], [.8 * s, .34 * s, .34 * s, .5, .9], [1.02 * s, .5 * s, .5 * s, 1.2, 1.05], [1.06 * s, .46 * s, .46 * s, 1.3, .8]], { ur: 6 }); for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + .5; tube(I, [[Math.cos(a) * .5 * s, 0, Math.sin(a) * .5 * s, .035 * s], [Math.cos(a) * .2 * s, .5 * s, Math.sin(a) * .2 * s, .03 * s], [Math.cos(a) * .12 * s, .78 * s, Math.sin(a) * .12 * s, .03 * s]], 4, { m: .5 }); }
    const C = geo().normal([0, 1, 0]); C.loft(8, [[1.0 * s, .44 * s, .44 * s, 0, 1]], { cap: 'top', capRect: true }); const F = flameQuads(.95 * s, o.c); F.me.position.y = .98 * s; const hl = halo(lc, 2.4 * s, .5); hl.position.y = 1.5 * s;
    g.add(B.group(), gmesh(C, glowMat(X.lava({}), {})), F.me, hl); let L = null; if (o.light !== false) { L = new THREE.PointLight(lc, o.power || 20, o.range || 14, 1.6); L.position.y = 1.6 * s; g.add(L); g.userData.light = L; }
    g.userData.tick = fireTick(g, F, hl, L, ph, o.power || 20); return g; }
  // ただよう光の粒（加算の小さな十字の板のむれ）。n, box: [はば, 高さ, 奥行き], c, size, rise（のぼる速さ m/秒。負でおちる）, drift（ゆれ m）, y（下のはし）, seed
  //   userData.tick(t, cx, cz) を毎コマ呼ぶ。cx, cz（主役の位置）を入れると、粒の箱が主役についてくる
  function motes(o = {}) { const n = o.n || 80, [bw, bh, bd] = o.box || [30, 6, 30], sd = o.seed || 0, s = (o.size || .12) / 2, rise = o.rise ?? .15, drift = o.drift ?? .5, y0 = o.y ?? .3, G = geo();
    for (let i = 0; i < n; i++) { const k = .6 + hash(i, 5, sd) * .8, a = s * k; G.quad([-a, -a, 0], [a, -a, 0], [a, a, 0], [-a, a, 0]); G.quad([0, -a, -a], [0, -a, a], [0, a, a], [0, a, -a]); }
    const g = G.build(), base = g.attributes.position.array.slice(), P = g.attributes.position.array, C = g.attributes.color.array, me = new THREE.Mesh(g, glowMat(X.dot(), { add: o.add !== false, color: o.c || '#fff2a8', own: true, fog: o.fog })); me.frustumCulled = false; me.userData.dyn = true; const wrap = (v, c, L) => c + (((v - c + L / 2) % L) + L) % L - L / 2;
    me.userData.tick = (t, cx = 0, cz = 0) => { for (let i = 0; i < n; i++) { const hx = hash(i, 1, sd), hy = hash(i, 2, sd), hz = hash(i, 3, sd), ph = hash(i, 4, sd) * TAU, x = wrap(hx * bw + Math.sin(t * .5 + ph) * drift, cx, bw), z = wrap(hz * bd + Math.cos(t * .4 + ph * 1.7) * drift, cz, bd), yy = (((hy * bh + t * rise * (.6 + hx * .8)) % bh) + bh) % bh, y = y0 + yy + Math.sin(t * .9 + ph) * drift * .3, edge = Math.min(1, yy * 2, (bh - yy) * 2), tw = (.55 + .45 * Math.sin(t * 2.3 + ph * 3)) * edge;
        for (let v = 0; v < 12; v++) { const q = (i * 12 + v) * 3; P[q] = base[q] + x; P[q + 1] = base[q + 1] + y; P[q + 2] = base[q + 2] + z; C[q] = C[q + 1] = C[q + 2] = tw; } } g.attributes.position.needsUpdate = g.attributes.color.needsUpdate = true; };
    me.userData.tick(0); return me; }
  // 光の柱（地面から空へのびる加算の筒）。h, r, c, opacity。userData.tick(t)
  function beam(o = {}) { const h = o.h || 14, r = o.r || .9, c = o.c || '#9ae8ff', g = new THREE.Group(), m = glowMat(X.beam({}), { add: true, own: true, color: c, opacity: o.opacity ?? .6 }), G = geo();
    G.loft(8, [[0, r, r, 0, 1], [h * .5, r * .85, r * .85, .5, .7], [h, r * .7, r * .7, 1, .2]], { ur: 4 }).loft(6, [[0, r * .45, r * .45, 0, 1], [h, r * .3, r * .3, 1, .3]], { ur: 2, rot: .2 });
    const me = gmesh(G, m), hl = halo(c, r * 4.5, .7); hl.position.y = .3; g.add(me, hl); g.userData.tick = tm => { me.rotation.y = tm * .35; m.opacity = (o.opacity ?? .6) * (.85 + .15 * Math.sin(tm * 2.2)); }; return g; }
  // 魔法陣（地面に光る円。ゆっくり回る）。r, c, star（星のかどの数 5〜8）, spin。userData.tick(t)
  function magicCircle(o = {}) { const r = o.r || 2, m = glowMat(X.circle({ c: o.c, star: o.star }), { add: true, own: true, opacity: .9 }), G = geo().normal([0, 1, 0]);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const x0 = (i - 1) * r, x1 = i * r, z0 = (1 - j) * r, z1 = -j * r; G.quad([x0, 0, z0], [x1, 0, z0], [x1, 0, z0 - r], [x0, 0, z0 - r], [i / 2, j / 2, (i + 1) / 2, (j + 1) / 2]); }
    const me = gmesh(G, m); me.position.y = o.y ?? .08; me.renderOrder = 2; me.userData.dyn = true; me.userData.tick = tm => { me.rotation.y = tm * (o.spin ?? .3); m.opacity = .75 + .2 * Math.sin(tm * 1.8); }; return me; }
  // オーロラ（空にかかる光のカーテン）。r（遠さ）, y（下のはしの高さ）, h, arc（ひろがり rad）, dir（向き rad。0 が -z、正で +x へ）, bands（枚数）, c, c2, opacity。userData.tick(t)
  function aurora(o = {}) { const r = o.r || 220, y = o.y ?? 60, h = o.h || 70, arc = o.arc || 2.4, a0 = o.dir ?? 0, bands = o.bands || 2, g = new THREE.Group(), list = [], n = 24, op = o.opacity ?? .5;
    for (let b = 0; b < bands; b++) { const t = own(X.aurora({ c: o.c, c2: o.c2, seed: b })), m = glowMat(t, { add: true, own: true, fog: false, opacity: op }), G = geo(), rb = r * (1 - b * .14);
      const P = (i, top) => { const u = i / n, a = a0 + (u - .5) * arc + b * .3, rr = rb * (1 + Math.sin(u * 9 + b * 2) * .08); return [Math.sin(a) * rr, y - b * h * .15 + Math.sin(u * 7 + b) * h * .12 + (top ? h * (.8 + .2 * Math.sin(u * 5 + b * 3)) : 0), -Math.cos(a) * rr]; };
      for (let i = 0; i < n; i++) G.quad(P(i, 0), P(i + 1, 0), P(i + 1, 1), P(i, 1), [i / n * 3, 0, (i + 1) / n * 3, 1]); const me = gmesh(G, m); me.frustumCulled = false; me.renderOrder = -5; g.add(me); list.push([t, m, b]); }
    g.userData.tick = tm => { for (const [t, m, b] of list) { t.offset.x = tm * .006 * (b % 2 ? -1 : 1); m.opacity = op * (.8 + .2 * Math.sin(tm * .6 + b * 2)); } }; return g; }
  // 流れ星（ときどき空を流れる光のすじ）。n, r, dir, arc, c。userData.tick(t)
  function meteors(o = {}) { const n = o.n || 4, r = o.r || 230, g = new THREE.Group(), m = glowMat(X.streak(), { add: true, fog: false, color: o.c || '#ffffff' }), list = [], a0 = o.dir ?? 0, arc = o.arc || 2.2, L = r * .14, wd = r * .012, sd = o.seed || 0;
    const dirv = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    for (let i = 0; i < n; i++) { const me = gmesh(geo().quad([-L, -wd, 0], [0, -wd, 0], [0, wd, 0], [-L, wd, 0]), m), az = a0 + (hash(i, 1, sd) - .5) * arc, el = .45 + hash(i, 2, sd) * .5, sg = hash(i, 3, sd) > .5 ? 1 : -1, S = dirv(az, el), E = dirv(az + sg * .3, el - .24), d = E.clone().sub(S).normalize(), zc = S.clone().negate(), yv = zc.clone().cross(d).normalize(); me.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, yv, d.clone().cross(yv))); me.frustumCulled = false; me.visible = false; g.add(me); list.push([me, S, E, 4 + hash(i, 4, sd) * 5, hash(i, 5, sd) * 9]); }
    g.userData.tick = tm => { for (const [me, S, E, per, off] of list) { const k = ((tm + off) % per) / .8; me.visible = k < 1; if (k < 1) { me.position.copy(S).lerp(E, k).multiplyScalar(r); me.scale.set(Math.min(1, k * 4), 1 - k * .7, 1); } } }; return g; }
  // 星空の丸天井（色の帯＋手で打った星＋天の川＋月）。r, stops: [[0, てっぺんの色], …, [1, 地平線の色]], n（星の数）, milky: false で天の川なし, moon: { az, el, r, c }（az は rad。0 が -z）
  function starDome(o = {}) { const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), stops = o.stops || [[0, '#0c1238'], [.55, '#22387a'], [1, '#5a5aa4']], gr = x.createLinearGradient(0, 0, 0, H / 2), sd = o.seed || 0; for (const [p, col] of stops) gr.addColorStop(p, col);
    x.fillStyle = stops[stops.length - 1][1]; x.fillRect(0, 0, W, H); x.fillStyle = gr; x.fillRect(0, 0, W, H / 2); const px = (i, j, c, a = 1) => { x.globalAlpha = a; x.fillStyle = c; x.fillRect(((Math.round(i) % W) + W) % W, Math.round(j), 1, 1); };
    if (o.milky !== false) for (let k = 0; k < 2600; k++) { const u = hash(k, 1, sd), i = u * W, j = H * (.2 + .14 * Math.sin(u * TAU + 1) + (hash(k, 2, sd) + hash(k, 3, sd) - 1) * .07); if (j > 4 && j < H / 2 - 6) px(i, j, ['#8a9ae0', '#b8a8e8', '#6a8ad8'][k % 3], .32); }
    for (let k = 0; k < (o.n || 300); k++) { const i = hash(k, 4, sd) * W, j = H * (.04 + Math.pow(hash(k, 5, sd), 1.15) * .44), q = hash(k, 6, sd), c = ['#ffffff', '#cfe0ff', '#fff0c0', '#ffd8e8'][k % 4]; if (q < .68) px(i, j, c, .5 + q * .6); else if (q < .92) { px(i, j, '#ffffff'); px(i + 1, j, c, .6); } else { px(i, j, '#ffffff'); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) px(i + a, j + b, c, .8); px(i + 2, j, c, .35); px(i - 2, j, c, .35); } }
    if (o.moon) { const M = o.moon, el = M.el ?? .5, mr = (M.r || 5), cxm = (.75 - (M.az || 0) / TAU) * W, cym = H / 2 * (1 - el / (PI / 2)), sx = 1 / Math.cos(el), c = M.c || '#fff4d0'; for (let j = -mr; j <= mr; j++) for (let i = -mr * sx; i <= mr * sx; i++) { const d = Math.hypot(i / sx, j); if (d > mr) continue; const cr = [[-.3, -.2, .22], [.25, .3, .18], [.1, -.45, .12]].some(([a, b, q]) => Math.hypot(i / sx / mr - a, j / mr - b) < q); px(cxm + i, cym + j, d > mr - 1 ? mix(c, '#ffffff', .6) : cr ? mix(c, '#8a8ab0', .35) : c); } }
    x.globalAlpha = 1; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = THREE.RepeatWrapping;
    const me = new THREE.Mesh(new THREE.SphereGeometry(o.r || 300, 24, 14), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false })); me.renderOrder = -10; me.frustumCulled = false; return me; }

  // ================= 8. 生きもの =================
  const FW = TR(0, 0, 0, 0, PI / 2), BK = TR(0, 0, 0, PI, PI / 2);   // 筒を前（+z）へ／うしろ（-z）へねかせる
  const rig = (m) => (G, parent, x, y, z) => { const me = new THREE.Mesh(G.build(), m); me.castShadow = true; const pv = new THREE.Group(); pv.position.set(x, y, z); pv.add(me); parent.add(pv); return pv; };
  // 竜（大きい。体長 5.5 m・つばさ 6 m ほど × s）。c（うろこ）, belly, wing（つばさの膜）, eye, s。正面 +z、足もとが y=0。動きは dragonPose(竜, 'fly' / 'walk' / 'perch', t)
  //   userData.J: body, neck[4], head, tail[6], wL, wL2, wR, wR2（つばさの付け根と先）, legFL, legFR, legHL, legHR
  function dragon(o = {}) { const s = o.s || 1, t = X.dragon({ c: o.c, belly: o.belly, wing: o.wing, eye: o.eye }), m = R.mat(t, { vc: true, smooth: true, side: true }), g = new THREE.Group(), root = new THREE.Group(), J = { neck: [], tail: [] }, W = 64, part = rig(m), skin = () => geo().smooth(1).px(0, 0, 64, 32, W, W); root.scale.setScalar(s); g.add(root);
    J.body = part(skin().at(TR(0, 0, -.8, 0, PI / 2)).loft(8, [[0, .2, .2, 0, .85], [.3, .4, .38, .2], [.8, .46, .45, .5], [1.3, .38, .37, .8], [1.62, .22, .22, 1]], { cap: 'both', rot: 0 }), root, 0, .95, 0);
    for (let i = 0; i < 4; i++) { const r0 = .235 - i * .024, r1 = r0 - .024; J.neck.push(part(skin().at(FW).loft(6, [[-.05, r0, r0 * 1.06, i * .25], [.4, r1, r1 * 1.06, (i + 1) * .25]], { rot: 0 }), i ? J.neck[i - 1] : J.body, 0, i ? 0 : .1, i ? .37 : .7)); }
    const Gh = skin().at(FW).loft(6, [[-.08, .14, .15, 0, .9], [.12, .23, .2, .3], [.3, .2, .16, .55, 1, 0, .02], [.52, .135, .1, .8, 1, 0, .05], [.68, .1, .07, 1, 1.05, 0, .06]], { cap: 'both', rot: 0 }).at(null).smooth(0).px(32, 32, 8, 8, W, W);
    for (const sx of [1, -1]) Gh.quad([sx * .2, .02, .29], [sx * .215, .02, .13], [sx * .19, .16, .13], [sx * .175, .16, .29]); Gh.px(40, 32, 8, 16, W, W); for (const sx of [1, -1]) Gh.at(TR(sx * .1, .15, .06, 0, -1.05, -sx * .32)).loft(4, [[0, .055, .055, 0, .9], [.36, .012, .012, 1, 1.1]], {}); Gh.at(null);
    J.head = part(Gh, J.neck[3], 0, 0, .37);
    for (let i = 0; i < 6; i++) { const r0 = .22 * Math.pow(.74, i), r1 = r0 * .74, G = skin().at(BK).loft(5, [[-.04, r0, r0, i / 6], [.46, r1, r1, (i + 1) / 6]], { rot: 0 }).at(null);
      if (i === 5) G.smooth(0).px(40, 32, 8, 16, W, W).tri([0, 0, -.4], [-.17, 0, -.62], [0, 0, -.92], [0, 0], [1, .5], [0, 1]).tri([0, 0, -.4], [.17, 0, -.62], [0, 0, -.92], [0, 0], [1, .5], [0, 1], .8);
      J.tail.push(part(G, i ? J.tail[i - 1] : J.body, 0, i ? 0 : .03, i ? -.43 : -.72)); }
    for (const [nm, sx, z] of [['legFL', 1, .42], ['legFR', -1, .42], ['legHL', 1, -.48], ['legHR', -1, -.48]]) J[nm] = part(geo().smooth(1).px(48, 48, 16, 16, W, W).loft(5, [[-.83, .1, .17, 0, .75, 0, .07], [-.74, .08, .09, .12, .9], [-.4, .1, .12, .55], [0, .15, .17, 1]], { cap: 'bot' }), J.body, sx * .3, -.12, z);
    for (const [nm, sx] of [['wL', 1], ['wR', -1]]) { J[nm] = part(geo().px(0, 32, 32, 32, W, W).normal([0, 1, 0]).quad([0, 0, -.72], [sx * 1.3, 0, -.56], [sx * 1.3, 0, .28], [0, 0, .18], [0, 0, .5, 1]), J.body, sx * .18, .3, .28); J[nm + '2'] = part(geo().px(0, 32, 32, 32, W, W).normal([0, 1, 0]).quad([0, 0, -.56], [sx * 1.5, 0, -.3], [sx * 1.6, 0, .06], [0, 0, .28], [.5, 0, 1, 1], .92), J[nm], sx * 1.3, 0, 0); }
    g.userData = { J, kind: 'dragon', s }; dragonPose(g, 'fly', 0); return g; }
  function dragonPose(g, pose = 'fly', t = 0) { const J = g.userData.J, fly = pose === 'fly', walk = pose === 'walk', f = Math.sin(t * 4.2), f2 = Math.sin(t * 4.2 - .9), a = fly ? .12 + f * .62 : .55 + Math.sin(t * .8) * .03, b = fly ? f2 * .75 - .1 : -2.75;
    J.body.position.y = fly ? .95 - f * .1 : .95 + (walk ? Math.abs(Math.sin(t * 3)) * .03 : Math.sin(t * 1.2) * .01); J.body.rotation.x = fly ? -.06 : 0; const sw = fly ? 0 : 1.2; J.wL.rotation.set(0, sw, a); J.wL2.rotation.z = b; J.wR.rotation.set(0, -sw, -a); J.wR2.rotation.z = -b;
    J.neck.forEach((n, i) => { n.rotation.x = (i < 2 ? -.46 : .36) * (fly ? .55 : 1) + Math.sin(t * 1.7 - i * .8) * .07; n.rotation.y = Math.sin(t * (pose === 'perch' ? .6 : .9) - i * .6) * (pose === 'perch' ? .2 : .1); }); J.head.rotation.x = (fly ? .12 : .08) + Math.sin(t * .7) * .06;
    J.tail.forEach((n, i) => { n.rotation.y = Math.sin(t * 2 - i * .75) * (fly ? .2 : .14); n.rotation.x = fly ? .03 + Math.sin(t * 2.1 - i * .6) * .08 : i === 0 ? -.3 : i < 3 ? .1 : .04; });
    const w = Math.sin(t * 3) * .5; J.legFL.rotation.x = fly ? .9 : walk ? w : 0; J.legHR.rotation.x = fly ? 1.1 : walk ? w : 0; J.legFR.rotation.x = fly ? .9 : walk ? -w : 0; J.legHL.rotation.x = fly ? 1.1 : walk ? -w : 0; }
  // まるい生きもの「しずく玉」（頭に小さなしずくの つの。はねると のびちぢみする）。c, cheek, s（半径）。動きは slimePose(玉, t, はねる高さ)
  function slime(o = {}) { const s = o.s || .4, g = new THREE.Group(), body = new THREE.Group(), G = geo().smooth(1);
    G.loft(8, [[0, .62, .62, 0, .75], [.1, .9, .9, .16, .9], [.42, 1, 1, .5, 1], [.72, .76, .76, .8, 1.05], [.93, .34, .34, .96, 1.1]], { cap: 'both', capUV: [.5, .96] }).loft(4, [[.9, .06, .06, .9, 1], [1.12, .04, .04, .93, 1.1], [1.2, .11, .11, .95, 1.15], [1.31, .02, .02, .97, 1.2]], { cap: 'top', capUV: [.5, .96] });
    body.add(G.mesh(X.slime({ c: o.c, cheek: o.cheek }), o.glow ? { emissive: mix(o.c || '#5ad0a0', '#000000', .55) } : {})); body.scale.setScalar(s); g.add(body); g.userData = { J: { body }, s, kind: 'slime' }; return g; }
  function slimePose(g, t, hop = .25) { const b = g.userData.J.body, s = g.userData.s, k = Math.sin(t * 5), up = Math.max(0, k), sq = up > 0 ? 1 + up * .2 : 1 + k * .24, q = 1 / Math.sqrt(sq); b.position.y = up * hop; b.scale.set(s * q, s * sq, s * q); }
  // 小さな獣「ミミナガ」（長い耳と ふさふさのしまのしっぽ。ねこ ほどの大きさ）。c, belly, s。動きは critterPose(獣, 'walk' / 'sit', t)
  function critter(o = {}) { const s = o.s || 1, m = R.mat(X.critter({ c: o.c, belly: o.belly }), { vc: true, smooth: true, side: true }), g = new THREE.Group(), root = new THREE.Group(), J = {}, W = 64, H = 32, part = rig(m); root.scale.setScalar(s); g.add(root);
    J.body = part(geo().smooth(1).px(0, 0, 32, 32, W, H).at(FW).loft(6, [[-.04, .05, .06, 0, .9], [.04, .11, .11, .15], [.16, .13, .13, .5], [.28, .11, .12, .85], [.36, .06, .07, 1]], { cap: 'both', rot: 0 }), root, 0, .2, -.16);
    J.head = part(geo().smooth(0).px(48, 0, 8, 8, W, H).box(.2, .16, .16, 0, -.06, 0, { taper: [.85, .9] }).px(32, 0, 16, 16, W, H).quad([-.1, -.06, .082], [.1, -.06, .082], [.085, .1, .074], [-.085, .1, .074]), J.body, 0, .1, .4);
    for (const [nm, sx] of [['earL', 1], ['earR', -1]]) J[nm] = part(geo().px(56, 0, 8, 16, W, H).normal([0, .5, .8]).quad([-.035, 0, 0], [.035, 0, 0], [.045, .3, -.03], [-.03, .3, -.03]), J.head, sx * .06, .09, -.02);
    const leg = (parent, x, y, z) => part(geo().smooth(1).px(48, 0, 8, 8, W, H).loft(4, [[-.17, .026, .036, 0], [0, .036, .042, 1]], { cap: 'bot' }), parent, x, y, z); J.fl = leg(J.body, .06, -.03, .3); J.fr = leg(J.body, -.06, -.03, .3); J.hl = leg(root, .065, .17, -.14); J.hr = leg(root, -.065, .17, -.14);
    J.tail = part(geo().smooth(1).px(32, 16, 32, 16, W, H).loft(6, [[0, .03, .03, 1], [.12, .09, .09, .62, 1, 0, -.02], [.27, .1, .1, .28, 1, 0, -.02], [.37, .03, .03, 0, 1.1]], { cap: 'top' }), root, 0, .24, -.2);
    g.userData = { J, kind: 'critter' }; critterPose(g, 'walk', 0); return g; }
  function critterPose(g, pose, t) { const J = g.userData.J, a = Math.sin(t), fl = Math.sin(t * .5) * .12;
    if (pose === 'sit') { J.body.position.set(0, .14, -.12); J.body.rotation.x = -1.0; J.head.rotation.set(.9 + Math.sin(t * .6) * .08, Math.sin(t * .5) * .5, 0); for (const l of [J.fl, J.fr]) l.rotation.x = 1.0; for (const l of [J.hl, J.hr]) { l.position.y = .05; l.rotation.x = -1.45; } J.tail.position.set(0, .08, -.22); J.tail.rotation.set(-1.2, 0, Math.sin(t * 1.3) * .3); J.earL.rotation.set(-.2 + Math.sin(t * .9) * .2, 0, -.25); J.earR.rotation.set(-.2 + Math.sin(t * .9 + 1) * .2, 0, .25); }
    else { J.body.position.set(0, .2 + Math.abs(Math.cos(t)) * .03, -.14); J.body.rotation.x = a * .08; J.head.rotation.set(-a * .06, Math.sin(t * .25) * .2, 0); J.fl.rotation.x = a * .7; J.fr.rotation.x = a * .5; J.hl.rotation.x = -a * .7; J.hr.rotation.x = -a * .5; for (const l of [J.hl, J.hr]) l.position.y = .17; J.tail.position.set(0, .24, -.2); J.tail.rotation.set(-.75 + a * .15, 0, Math.sin(t * .5) * .3); J.earL.rotation.set(-.35 + a * .25, 0, -.2 - fl); J.earR.rotation.set(-.35 - a * .2, 0, .2 + fl); } }
  // こうもり（つばさ 80 cm ほど × s）。c, wing。動きは batPose(こうもり, t)
  function bat(o = {}) { const s = o.s || 1, m = R.mat(X.flyers({ c: o.c, wing: o.wing }), { vc: true, smooth: true, side: true }), g = new THREE.Group(), root = new THREE.Group(), J = {}, part = rig(m); root.scale.setScalar(s); g.add(root);
    const Gb = geo().smooth(1).px(0, 0, 8, 16, 32, 32).at(FW).loft(5, [[-.1, .02, .02, 0], [-.03, .06, .06, .3], [.06, .065, .065, .72], [.11, .04, .04, .95]], { cap: 'both', rot: 0 }).at(null).smooth(0); for (const sx of [-1, 1]) Gb.tri([sx * .015, .04, .08], [sx * .055, .04, .07], [sx * .05, .12, .06], [0, .9], [1, .9], [.5, 1]); J.body = part(Gb, root, 0, 0, 0);
    for (const [nm, sx] of [['wl', 1], ['wr', -1]]) J[nm] = part(geo().px(8, 0, 24, 16, 32, 32).normal([0, 1, 0]).quad([0, 0, -.1], [sx * .38, 0, -.04], [sx * .4, 0, .1], [0, 0, .08]), J.body, sx * .04, .01, 0);
    g.userData = { J, kind: 'bat' }; return g; }
  function batPose(g, t) { const J = g.userData.J, f = Math.sin(t * 14); J.wl.rotation.z = f * .8; J.wr.rotation.z = -f * .8; J.body.position.y = -f * .025; J.body.rotation.x = -.15; }
  // 光る虫（ほたるのように おしりが光る）。c（光の色）, s。動きは bugPose(虫, t)。userData.halo
  function bug(o = {}) { const s = o.s || 1, c = o.c || '#c8ff7a', m = R.mat(X.flyers({}), { vc: true, smooth: true, side: true }), g = new THREE.Group(), root = new THREE.Group(), J = {}, part = rig(m); root.scale.setScalar(s); g.add(root);
    J.body = part(geo().smooth(1).px(0, 16, 8, 16, 32, 32).at(FW).loft(4, [[-.06, .012, .012, 0], [0, .032, .03, .5], [.06, .02, .02, 1]], { cap: 'both' }), root, 0, 0, 0);
    for (const [nm, sx] of [['wl', 1], ['wr', -1]]) J[nm] = part(geo().px(16, 16, 16, 16, 32, 32).normal([0, 1, 0]).quad([0, 0, -.05], [sx * .12, 0, -.05], [sx * .12, 0, .04], [0, 0, .04], sx > 0 ? [0, 0, 1, 1] : [0, 0, 1, 1]), J.body, sx * .01, .03, 0);
    const hl = halo(c, .55, .9), core = halo('#ffffff', .16, .9); hl.position.set(0, -.01, -.06); core.position.copy(hl.position); root.add(hl, core); g.userData = { J, halo: hl, kind: 'bug', ph: Math.random() * TAU }; return g; }
  function bugPose(g, t) { const J = g.userData.J, f = Math.sin(t * 40); J.wl.rotation.z = .5 + f * .5; J.wr.rotation.z = -.5 - f * .5; g.userData.halo.material.opacity = .5 + .4 * Math.sin(t * 2.2 + g.userData.ph); }
  // 妖精（光る小さな人。うすい羽が 4 枚）。c（服と光の色）, hair, skin, s（.3 m ほど × s）, light: true で PointLight。動きは fairyPose(妖精, t)
  function fairy(o = {}) { const s = o.s || 1, c = o.c || '#ffe890', m = R.mat(X.flyers({ c: o.hair || '#f0a060', dress: c, skin: o.skin }), { vc: true, smooth: true, side: true, emissive: '#3a3428' }), g = new THREE.Group(), root = new THREE.Group(), J = {}, part = rig(m); root.scale.setScalar(s); g.add(root);
    const Gb = geo().smooth(1).px(8, 16, 8, 16, 32, 32).loft(5, [[0, .055, .055, 0, .9], [.1, .034, .03, .42], [.17, .02, .02, .62], [.2, .042, .042, .74], [.26, .046, .046, .9], [.3, .02, .02, 1]], { cap: 'both' }).px(0, 0, 8, 12, 32, 32); const HR = [[.2, .048, .05, 0, .9, 0, -.014], [.27, .054, .056, .5, 1, 0, -.014], [.33, .02, .02, 1, 1.1, 0, -.008]];
    Gb.loft(5, HR, { cap: 'top', seg: [0, 1] }).loft(5, HR, { seg: [3, 5] }); J.body = part(Gb, root, 0, 0, 0);
    for (const [nm, sx] of [['wl', 1], ['wr', -1]]) J[nm] = part(geo().px(16, 16, 16, 16, 32, 32).normal([0, 0, 1]).quad([0, -.03, 0], [sx * .2, -.02, 0], [sx * .23, .2, 0], [0, .08, 0]).quad([0, -.16, 0], [sx * .14, -.17, 0], [sx * .16, -.02, 0], [0, -.03, 0], [0, 0, 1, 1], .9), J.body, sx * .012, .17, -.03);
    const hl = halo(c, .7, .55); hl.position.y = .16; root.add(hl); if (o.light) { const L = new THREE.PointLight(c, o.power || 5, 6, 1.6); L.position.y = .16; root.add(L); g.userData.light = L; } g.userData = { ...g.userData, J, halo: hl, kind: 'fairy' }; return g; }
  function fairyPose(g, t) { const J = g.userData.J, f = Math.sin(t * 30); J.wl.rotation.y = -.5 - f * .45; J.wr.rotation.y = .5 + f * .45; J.body.position.y = Math.sin(t * 2.2) * .05; J.body.rotation.x = .2; g.userData.halo.material.opacity = .5 + .12 * Math.sin(t * 3.1); }
  // 光の玉（ひとだま ではなく、やさしい あかり）。c, s, light: true で PointLight。userData.tick(t) でゆれて明滅
  function wisp(o = {}) { const c = o.c || '#9ae8ff', s = o.s || .6, g = new THREE.Group(), a = halo(c, s * 2, .6), b = halo('#ffffff', s * .7, .9), ph = hash(o.seed || 0, 8) * TAU; g.add(a, b); let L = null; if (o.light) { L = new THREE.PointLight(c, o.power || 8, o.range || 8, 1.6); g.add(L); g.userData.light = L; }
    g.userData.tick = tm => { const k = .8 + .2 * Math.sin(tm * 2.6 + ph); a.material.opacity = .6 * k; a.scale.setScalar(s * 2 * (.9 + .1 * k)); a.position.y = b.position.y = Math.sin(tm * 1.3 + ph) * s * .25; if (L) { L.intensity = (o.power || 8) * k; L.position.y = a.position.y; } }; return g; }

  return { tex: X, paint: PAINT, glowMat, halo, tube, blobSec, bake, vn,
    caveH, caveCeil, spike, pillar, cliff, floatIsle, pool, flow, waterfall, stoneBridge, ropeBridge,
    crystal, gemOre, mushroom, mushroomHouse, bloom, mossPatch, vine, deadTree, ribs, skull, coinPile, chest,
    rail, mineCart, mineProp, dungeonWall, column, ironDoor, observatory, swampHut,
    torch, brazier, motes, beam, magicCircle, aurora, meteors, starDome,
    dragon, dragonPose, slime, slimePose, critter, critterPose, bat, batPose, bug, bugPose, fairy, fairyPose, wisp };
};
