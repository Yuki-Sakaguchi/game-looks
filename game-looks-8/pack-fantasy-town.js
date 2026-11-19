// game-looks-8 の追加の部品「ファンタジーの町・建物」。game-looks-7 の kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), F = PACK_FTOWN(THREE, K, R);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。一覧は pack-fantasy-town-sheet.html（?p=tex でテクスチャ、?p=parts&i=0〜6 で形）。
// 見本の場面は 01-castle-town-avenue.html（城下町）と 02-airship-dock.html（飛空艇の発着場）。
//
// ■ 決まり：どの形も 足もとが y=0、正面が +z、大きさは m。色は '#rrggbb'（1 色わたすと 6 段の明暗を自動で作る）。stone / roof などの引数は「テクスチャ」か「色」のどちらでもよい。
//   動く物（旗・風車・プロペラ・火・水・時計）は、毎コマ  F.tick(t)  を 1 回呼べば全部動く（1 つずつなら 物.userData.tick(t)）。
//   動く部分には userData.dyn = true が付いているので、R.merge([…]) にそのまま入れてよい（動く部分だけ残る）。
//
// ■ テクスチャ  F.tex.名前({ c, seed, m, … }) → THREE.Texture（同じ引数なら同じ物）。F.paint.名前(o) は R.Px を返す（上から描き足せる）
//   石：ashlar { c, moss 0〜1 }（城の大きな切り石）   sandstone { c }（砂岩。地層のすじ）   shiro { c, wood, base: false }（東方風の白かべ。上に梁、下に板）
//   屋根：slate { c, c2（まぜる色）, kind: 'fish'/'diamond' }（色つきのうろこがわら）   kawara { c }（東方風の丸がわら）   dome { c, c2 }（ドーム屋根の 1 枚。よこにくり返す）
//   木と金物：lacquer { c, band }（東方風の赤い柱。band: true で上下に金と黒の帯＝32×64 を柱 1 本に 1 回はる）   ornate { c, gem }（金の飾り帯 32×16）   iron { c, rust }（びょう打ちの鉄板）
//   布：banner { c, c2, crest, cc, tail: 'swallow'/'point'/'flat', wide }（旗。抜き色つき 32×64。wide: true で横長の 48×32）
//         crest（紋。どれも自作の単純な図形）: 'sun'/'moon'/'star'/'tree'/'crown'/'diamond'/'tower'/'anchor'/'wave'/'none'
//       sail { c, c2（たてじま）, crest, cc }（帆布。ぬい目とつぎ）   balloon { c, c2 }（気のうの布。たてのぬい目と色の帯）   carpet { c, c2, c3 }（じゅうたん）
//   かざり：glass { cs: [色…], lit, kind: 'lancet'/'rose' }（ステンドグラスふうの窓。抜き色つき 32×48、rose は 32×32）   tile { c, c2, kind: 'star'/'check'/'fan' }（色タイル）   clock { c }（時計の文字盤。針は形）
//   切りぬき：grate { c }（落とし格子）   rail { kind: 'wood'/'iron'/'stone'/'rope', c }（手すり。よこにくり返す）   rope { kind: 'line'/'ladder'/'net' }   millsail { c }（風車の羽根 1 枚）
//   室内・小物：shelf { kind: 'bottles'/'books'/'mix', c }（たなに並んだびん・本）   fire() → 4 コマの並び（R.flip で送る）   straw { c, c2 }（むぎわら。下 1/4 がリボン）   basket { c }（かごの編み目）
//
// ■ 城・砦（stone＝石、roof＝屋根。テクスチャか色）
//   F.wall({ len, h: 5, th: 1.2, stone, crenel: true })                 城壁（x 方向にのびる。上は歩ける通路と のこぎり形）
//   F.tower({ kind: 'round'/'square', r: 2, h: 9, stone, roof, top: 'cone'/'crenel', roofH, flag: { …F.flag の引数 }, wins: true, lit })   塔。userData.top（てっぺんの高さ）
//   F.spire({ r, h, roof, n: 8, finial: true })                          とんがり屋根だけ（好きな塔や家の上にのせる）
//   F.gate({ w: 7, h: 7, d: 3, aw: 3.4, ah: 4.4, stone, door: 'portcullis'/'wood'/'none', open: 0〜1, crenel, arch: 'round'/'point', crest })   門（アーチの穴をくぐれる）。userData.setOpen(k)
//   F.drawbridge({ w: 3.4, len: 5, open: 0〜1 })                         はね橋（-z 側がちょうつがい。+z へたおれる）。userData.setOpen(k)
//   F.castle({ s: 1, stone, roof, crest, c（旗の色）, keep: true })      できあいの城（城壁＋門＋角の塔＋本丸と尖塔＋旗）。はば 30 m ほど。遠景にも使える
//   F.flag({ kind: 'flag'/'banner'/'pennant'/'drape', w, h, pole（さおの高さ。0 でさおなし）, c, c2, crest, cc, tail })   旗（さおの先で横になびく）・のぼりとたれ幕（たてに下がる）。風でゆれる
//   F.bunting({ from: [x,y,z], to: [x,y,z], n, cs: [色…], sag })         通りにわたす三角の旗のひも
//
// ■ 建物の部品
//   F.arch({ w: 3, h: 4, d: 1, th: .7, stone, kind: 'round'/'point' })   アーチ（柱 2 本＋上の石）   F.column({ h: 4, r: .3, tex, kind: 'round'/'square'/'east' })   柱
//   F.stairs({ w: 3, h: 2, d: 3, n（段の数）, tex, side: true })         階段・石段（-z 側が高い。+z から上る）   F.balcony({ w: 3, d: 1.2, tex, rail })   バルコニー（かべに付ける。奥が -z）
//   F.clockTower({ w: 3.4, h: 12, stone, roof, lit })   時計塔（針が動く。鐘つき）   F.bell({ s: 1 })   鐘（ゆれる）
//   F.windmill({ h: 8, stone, roof, c（羽根の布）, speed })               風車（羽根が回る）
//   F.dome({ r: 3, h, c, c2, kind: 'onion'/'round', finial })            ドーム屋根   F.minaret({ h: 12, r: 1, stone, c })   細い尖塔（砂漠の宮殿ふう）
//   F.eastRoof({ w, d, h: 2, eave: 1.2, roof, lift: .5 })                 東方風の反った屋根だけ   F.eastHall({ w: 8, d: 6, h: 3.4, tiers: 1/2, c（柱）, roof, lit })   反った屋根のお堂
//   F.torii({ w: 4, h: 4.6, c })   鳥居のような門   F.stoneLantern({ h: 1.7, lit, light })   石灯ろう   （石段は F.stairs({ tex: F.tex.ashlar() })）
//   F.treeHouse({ h: 6（床の高さ）, r: 2.2, trunk: 1, roof, lit })       木の上の小屋（太い幹＋床＋手すり＋丸い小屋）。userData.deck = 床の高さ
//   F.ropeBridge({ from: [x,y,z], to: [x,y,z], w: 1.2, sag: .6 })        つり橋（世界の座標で 2 点をわたす）。userData.at(k 0〜1) → 橋の上の位置
//   F.ladder({ h: 4, kind: 'wood'/'rope' })                               はしご
//   F.canal({ len: 30, w: 6, depth: 1.2, stone, water })                 運河（z 方向にのびる。岸の石がき 2 本＋水。水面は y = -depth+.5）   F.bridge({ span: 7, w: 2.6, rise: 1.6, stone })   小さな太鼓橋（x 方向にわたす）
//
// ■ 乗りもの（前は +z）
//   F.airship({ s: 1, c（気のう）, c2（帯）, hull（船体の木の色）, trim, crest })   飛空艇（気のう・船体・プロペラ・かじの帆）。userData.deck（甲板の高さ）。プロペラが回り、ゆっくり上下する
//   F.ship({ s: 1, c（船体）, c2（帯）, sail, sail2, crest, flag })               帆船（マスト 2 本、船尾のやぐら）。水面は y=0
//   F.gondola({ c, c2 })   ゴンドラ（こぎ手は F.wear ではなく、R.actor を userData.stand = [x,y,z] に立たせる）
//   F.wagon({ c, cover: 布の色 / false, load: 'crates'/'barrels'/'hay' })          荷馬車（4 輪。ほろ つき）。userData.wheels
//
// ■ 室内
//   F.room({ w: 9, d: 7, h: 3.4, floor, wall, beams: true, open: 'f'（あけておく面）, wins: [x…]（奥のかべの窓の位置）, lit })   板の床と壁、天井の梁
//   F.fireplace({ w: 2.4, h: 2.6, stone, lit: true, light: true })   暖炉（火がゆらぐ）   F.table({ w: 1.6, d: .9, round: false })   F.chair({ back: true })   F.stool()
//   F.shelf({ w: 2, h: 2, kind })   たなとびん   F.counter({ w: 3, c })   カウンター   F.hangLamp({ drop: .8, light })   つりランプ   F.keg({ rack: true })   ねかせた たる
//   （階段は F.stairs({ tex: R.tex.planks(), rail: 'wood' })）
//
// ■ 人のための小物   F.wear(actor, 種類, { … }) → 付けた Group（R.actor の関節に付ける。体つきに合わせて大きさが決まる）
//   'strawHat' { c, c2（リボン）, wide }   むぎわら帽子（頭に。かみ型は short / bob / bun / tail / long / bald が合う）
//   'apron'    { c, c2, len }               エプロン（胴の前。立っている人向き。歩く人は len を .3 ほどに）
//   'staff'    { c, len, hand: 'R'/'L' }    かざりのない つえ（手に）
//   'lantern'  { hand: 'L'/'R', light }     ランタン（手にさげる。light: true で小さなあかり）
//   'basket'   { hand: 'L'/'R', c, fc: [色…] }   かご（手にさげる。中に花やくだもの）
//   'sack'     { c }                         肩にかつぐ ふくろ（胴に）       'box' { s, c }   両手でかかえる木箱（胴に。F.carryPose(actor) でうでを前へ）
window.PACK_FTOWN = (THREE, K, R) => {
  const { hash, ramp, tone, mix, tn, Px, TR, geo, parts, mat } = R, T = R.tex, F = {}, paint = {}, tex = {}, cache = new Map(), live = [];
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), PI = Math.PI;
  const def = (name, m, fn, cut = false) => { paint[name] = fn; tex[name] = (o = {}) => { const key = name + JSON.stringify(o); let t = cache.get(key); if (!t) { t = T.from(fn(o), { m: o.m || m, cut: typeof cut === 'function' ? !!cut(o) : cut }); t.userData.name = 'ft.' + name; cache.set(key, t); } return t; }; };
  const asTex = (v, d) => v && v.isTexture ? v : d(v);   // テクスチャか色かを受ける

  // ================= 1. テクスチャ =================
  // 切り石。大きな石を段ちがいに積む（32×16 ドット＝1.5 m × .75 m）。strata で砂岩の地層のすじ
  const blocks = (o, dc, strata) => { const Q = Px(64), S = ramp(o.c || dc, 6, strata ? { contrast: .85 } : {}), M = strata ? S[1] : S[0], G = ramp(o.mossC || '#6f9a4e'), sd = o.seed || 0; Q.fill(M);
    const ROWS = [[0, [32, 32]], [16, [32, 16, 16]], [4, [24, 40]], [20, [32, 32]]];
    ROWS.forEach(([x0, ws], r) => { let x = x0; const y = r * 16; ws.forEach((bw, k) => { const h1 = hash(r, k, sd), t = [3, 3, 2, 4, 3, 3][Math.floor(h1 * 6)]; Q.block(x, y, bw - 1, 15, S, t, { round: true });
      for (let i = 2; i < bw - 3; i++) { if (tn(x + i, y, 8, 8, 64, 64, sd + r) > .5) Q.set(x + i, y + 1, tone(S, t + 2)); if (tn(x + i, y + 9, 8, 8, 64, 64, sd + r + 5) > .56) Q.set(x + i, y + 12, tone(S, t - 1)); }
      if (strata) for (const ly of [4, 8, 11]) for (let i = 1; i < bw - 2; i++) { const n = tn(x + i, y + ly, 16, 4, 64, 64, sd + ly); if (n > .42) Q.set(x + i, y + ly + (n > .7 ? 1 : 0), tone(S, t + (ly === 8 ? -1 : 1))); }
      else { for (let j = 3; j < 12; j++) for (let i = 2; i < bw - 3; i++) { const n = tn(x + i, y + j, 8, 8, 64, 64, sd + 11); if (n > .74) Q.set(x + i, y + j, tone(S, t + 1)); else if (n < .2 && ((i + j) & 1)) Q.set(x + i, y + j, tone(S, t - 1)); } }
      const h2 = hash(r, k, sd + 3), cx = x + 3 + Math.floor(hash(r, k, sd + 4) * (bw - 10));
      if (h2 > .6) { Q.set(cx, y + 5, tone(S, t - 2)); Q.set(cx + 1, y + 6, tone(S, t - 2)); Q.set(cx + 1, y + 7, tone(S, t - 2)); Q.set(cx + 2, y + 8, tone(S, t - 2)); Q.set(cx + 2, y + 7, tone(S, t + 1)); Q.set(cx + 3, y + 8, tone(S, t + 1)); }   // ひび
      else if (h2 < .22) { Q.rect(x + bw - 4, y + 12, 3, 3, M); Q.set(x + bw - 5, y + 13, tone(S, t - 1)); Q.set(x + bw - 4, y + 11, tone(S, t + 1)); }   // かどの欠け
      if (hash(r, k, sd + 6) > .72) for (let j = 0; j < 5; j++) if (j < 3 || (j & 1)) Q.set(cx + 5, y + 1 + j, tone(S, t - 1));   // 雨だれ
      if (o.moss && hash(r, k, sd + 7) < o.moss) { const mw = 5 + Math.floor(hash(r, k, sd + 8) * 8); for (let i = 0; i < mw; i++) { Q.set(x + i, y + 14, G[i % 3 === 1 ? 4 : 3]); Q.set(x + i, y + 15, G[2]); if (i % 2 === 0 && i < mw - 1) Q.set(x + i, y + 13, G[i % 4 ? 3 : 4]); } }
      x += bw; }); });
    return Q; };
  def('ashlar', 3, o => blocks(o, '#a9a59c', false));
  def('sandstone', 3, o => blocks(o, '#dcb98a', true));

  // 東方風の白かべ。上に こげ茶の梁、下に板ばり（base: false で白かべだけ）
  def('shiro', 3, (o = {}) => { const Q = Px(64), C = ramp(o.c || '#eee6d4', 6, { contrast: .7 }), W = ramp(o.wood || '#4a3830'), sd = o.seed || 0, base = o.base !== false;
    Q.each((x, y) => { const n = tn(x, y, 32, 16, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 2) * .4; return n > .62 ? C[4] : n < .16 ? C[2] : C[3]; });
    for (let k = 0; k < 6; k++) { const x = Math.floor(hash(k, 1, sd) * 60), y = 10 + Math.floor(hash(k, 2, sd) * 26); Q.set(x, y, C[2]); Q.set(x + 1, y, C[2]); Q.set(x + 2, y + 1, C[2]); Q.set(x + 1, y + 1, C[4]); }
    for (let x = 0; x < 64; x++) { for (let y = 0; y < 6; y++) Q.set(x, y, y === 0 ? W[4] : y === 5 ? W[1] : (x * 3 + y) % 11 === 0 ? W[2] : W[3]); Q.set(x, 6, C[1]); Q.set(x, 7, C[2]); }
    if (base) for (let x = 0; x < 64; x++) { const i = x % 8; for (let y = 44; y < 64; y++) Q.set(x, y, y === 44 ? W[5] : y === 45 ? W[1] : i === 0 ? W[1] : i === 1 ? W[4] : (y * 5 + x) % 13 === 0 ? W[2] : W[3]); Q.set(x, 43, C[2]); }
    return Q; });

  // 色つきのうろこがわら。8 ドットの丸い板を段ちがいに。c2 を少しまぜる
  def('slate', 3, (o = {}) => { const Q = Px(64), A = ramp(o.c || '#4a6ea8'), B = ramp(o.c2 || mix(o.c || '#4a6ea8', '#f0e0a0', .3)), sd = o.seed || 0, dia = o.kind === 'diamond';
    Q.each((x, y) => { const row = y >> 3, ly = y & 7, xx = x + (row & 1) * 4, col = (xx >> 3) & 7, lx = xx & 7, h1 = hash(col, row, sd), S = h1 > .82 ? B : A, t = h1 < .2 ? 2 : h1 > .6 && h1 < .7 ? 4 : 3, e = Math.min(lx, 7 - lx);
      if (ly === 7) return e < (dia ? 3 : 1) ? A[0] : S[1]; if (ly === 6 && e < (dia ? 2 : 1)) return A[0]; if (dia && ly === 5 && e < 1) return A[0];
      if (ly === 0) return tone(S, t - 2); if (lx === 0) return tone(S, t - 1); if (lx === 1 || ly === 1) return tone(S, t + 1); if (ly === 6 || (dia && ly === 5 && e < 2)) return tone(S, t - 1);
      return tone(S, t + (tn(x, y, 8, 8, 64, 64, sd + 3) > .72 ? 1 : 0)); });
    return Q; });
  // 東方風の丸がわら。たての丸いうねが 8 ドットごと、よこのつぎ目が 16 ドットごと
  def('kawara', 3, (o = {}) => { const Q = Px(64), A = ramp(o.c || '#5a6680'), sd = o.seed || 0;
    Q.each((x, y) => { const lx = x & 7, ly = y & 15, k = hash(x >> 3, y >> 4, sd), d = k > .8 ? 1 : k < .15 ? -1 : 0; if (lx === 7) return A[0]; if (ly === 15) return lx < 4 ? A[1] : A[0]; if (ly === 0 && lx < 5) return A[5];
      return tone(A, [1, 3, 5, 4, 3, 2, 1][lx] + (lx > 4 ? 0 : d) + (ly === 14 && lx < 5 ? -1 : 0)); });
    return Q; });
  // ドーム屋根の 1 枚（32×64。よこにくり返す）。まん中にうね、横の帯、小さな星
  def('dome', 2, (o = {}) => { const Q = Px(32, 64), A = ramp(o.c || '#3f9a96'), B = ramp(o.c2 || '#e8c058');
    Q.each((x, y) => { const e = Math.min(x, 31 - x), ly = y & 15; if (e === 0) return x === 0 ? B[4] : B[2]; if (e === 1) return A[1]; if (ly === 15) return A[1]; if (ly === 0) return A[5];
      const sx = Math.abs(x - 15.5), sy = Math.abs(ly - 8); if (sx + sy < 3.2) return sx + sy < 1.2 ? B[5] : B[3]; return tone(A, x < 10 ? 4 : x > 22 ? 2 : 3) ; });
    for (let k = 0; k < 8; k++) { const x = 4 + Math.floor(hash(k, 3) * 24), y = Math.floor(hash(k, 4) * 64); Q.set(x, y, A[2]); Q.set(x + 1, y, A[4]); }
    return Q; });

  // 東方風の赤い柱・梁。band: true は 32×64（上に金の帯、下に黒い根まき）
  def('lacquer', 1, (o = {}) => { const band = !!o.band, Q = Px(32, band ? 64 : 32), A = ramp(o.c || '#c8452e'), Gd = ramp('#e0b048'), D = ramp('#3a3238'), H = Q.h;
    Q.each((x, y) => { const g = hash(x, 7, o.seed || 0), n = tn(x, y, 4, 16, 32, H, 3); return g > .9 && (y + x * 5) % 11 < 5 ? A[2] : n > .8 ? A[4] : n < .12 ? A[2] : A[3]; });
    for (let k = 0; k < 5; k++) { const x = Math.floor(hash(k, 1) * 30), y = Math.floor(hash(k, 2) * H); Q.set(x, y, A[1]); Q.set(x + 1, y, A[1]); Q.set(x + 1, y + 1, A[5]); }
    if (band) for (let x = 0; x < 32; x++) { for (let y = 0; y < 7; y++) Q.set(x, y, y === 0 ? Gd[5] : y === 6 ? Gd[1] : (x % 8 === 3 && y === 3) ? Gd[1] : (x % 8 === 4 && y === 3) ? Gd[5] : Gd[3]); Q.set(x, 7, A[1]); for (let y = 54; y < 64; y++) Q.set(x, y, y === 54 ? D[5] : y === 55 ? D[4] : (x + y) % 7 === 0 ? D[2] : D[3]); Q.set(x, 53, A[1]); }
    return Q; });
  // 金の飾り帯（32×16）。上下のふち、ひし形のくり返し、びょう。gem で宝石の色
  def('ornate', 1, (o = {}) => { const Q = Px(32, 16), A = ramp(o.c || '#d8a83a'), Gm = ramp(o.gem || '#c8453a');
    Q.each((x, y) => { const lx = x & 15, d = Math.abs(lx - 7.5) + Math.abs(y - 7.5); if (y === 0) return A[5]; if (y === 1 || y === 14) return A[1]; if (y === 15) return A[2]; if (y === 2) return A[4];
      if (d < 2) return lx < 8 ? Gm[5] : Gm[3]; if (d < 3.2) return Gm[1]; if (d < 4.6) return lx + y < 15 ? A[5] : A[2]; if ((lx === 0 || lx === 15) && (y === 7 || y === 8)) return y === 7 ? A[5] : A[1]; return y < 8 ? A[3] : mix(A[3], A[2], .5); });
    return Q; });
  // びょう打ちの鉄板（32×32）。rust でさびのしみ
  def('iron', 1.5, (o = {}) => { const Q = Px(32), A = ramp(o.c || '#5c6170'), Rs = ramp('#9a5a3a'), sd = o.seed || 0, rust = o.rust ?? .5;
    Q.each((x, y) => { const lx = x & 15, ly = y & 15, n = tn(x, y, 8, 8, 32, 32, sd); if (lx === 15 || ly === 15) return A[0]; if (lx === 0 || ly === 0) return A[5]; if (lx === 14 || ly === 14) return A[1];
      if ((lx === 3 || lx === 11) && (ly === 3 || ly === 11)) return A[5]; if ((lx === 4 || lx === 12) && (ly === 4 || ly === 12)) return A[0];
      if (rust && tn(x, y, 8, 16, 32, 32, sd + 4) > 1 - rust * .45 && ly > 5) return (x + y) & 1 ? Rs[2] : Rs[3]; return n > .64 ? A[4] : n < .3 ? A[2] : A[3]; });
    return Q; });

  // 紋（自作の単純な図形）。(dx, dy) が図形の中なら 1（明るい側は 2）を返す
  const BITS = { crown: ['#...#...#', '#..###..#', '##.###.##', '#########', '#########', '.........', '#########', '#########'], tower: ['#.#.#.#', '#######', '#######', '.#####.', '.##.##.', '.##.##.', '.#####.', '.#...#.', '.#...#.', '#######'], anchor: ['...###...', '...#.#...', '...###...', '....#....', '.#######.', '....#....', '....#....', '#...#...#', '##..#..##', '.#######.', '..#####..'] };
  const crestAt = (kind, dx, dy, r) => { const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (kind === 'sun') return d < r * .48 || (d > r * .62 && d < r && Math.abs(Math.sin(a * 4)) > .72) ? 1 : 0;
    if (kind === 'moon') return d < r * .9 && Math.hypot(dx - r * .42, dy + r * .12) > r * .72 ? 1 : 0;
    if (kind === 'star') { const k = Math.abs(((a + PI / 2) / (PI * 2 / 5) % 1 + 1) % 1 - .5) * 2; return d < r * (.4 + .6 * Math.pow(k, 2.4)) ? 1 : 0; }
    if (kind === 'tree') return Math.hypot(dx, dy + r * .25) < r * .68 || (Math.abs(dx) < r * .16 && dy > 0 && dy < r) || (dy > r * .82 && dy < r && Math.abs(dx) < r * .5) ? 1 : 0;
    if (kind === 'diamond') { const q = Math.abs(dx) + Math.abs(dy); return q < r && (q > r * .62 || q < r * .3) ? 1 : 0; }
    if (kind === 'wave') { const w = dy - Math.sin(dx / r * 3.4) * r * .22; return Math.abs(dx) < r && (Math.abs(w + r * .32) < r * .15 || Math.abs(w - r * .32) < r * .15) ? 1 : 0; }
    const B = BITS[kind]; if (B) { const sc = Math.max(1, Math.round(r * 2 / B.length)), j = Math.floor((dy + B.length * sc / 2) / sc), i = Math.floor((dx + B[0].length * sc / 2) / sc); return B[j] && B[j][i] === '#' ? 1 : 0; } return 0; };
  const putCrest = (Q, kind, cx, cy, r, C) => { if (!kind || kind === 'none') return; for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) if (crestAt(kind, i + .5, j + .5, r)) { const up = crestAt(kind, i + .5, j - .5, r), rt = crestAt(kind, i + 1.5, j + .5, r), dn = crestAt(kind, i + .5, j + 1.5, r); Q.set(cx + i, cy + j, !up ? C[5] : !dn || !rt ? C[2] : C[4]); } };
  // 旗の布（抜き色つき）。たて長 32×64（のぼり・たれ幕）か、wide: true で横長 48×32（さおの旗）。ふちどり c2、紋 crest（色 cc）、下の切れこみ tail
  def('banner', 1, (o = {}) => { const wide = !!o.wide, W = wide ? 48 : 32, H = wide ? 32 : 64, Q = Px(W, H), A = ramp(o.c || '#c8453a'), B = ramp(o.c2 || '#f0d070'), C = ramp(o.cc || o.c2 || '#f0d070'), tail = o.tail || (wide ? 'flat' : 'swallow'); Q.clip = true;
    Q.each((x, y) => { if (wide) { const cut = tail === 'swallow' ? Math.max(0, 10 - Math.abs(y - 15.5) * .9) : tail === 'point' ? Math.abs(y - 15.5) * .8 : 0; if (x > W - 1 - cut) return null; const e = Math.min(y, H - 1 - y), f = (x + (y >> 2)) % 12; if (x < 2) return B[x ? 2 : 4]; if (e < 3) return e === 2 ? B[1] : e === 0 && y < 3 ? B[5] : B[3]; return f === 0 ? A[4] : f === 6 || f === 7 ? A[2] : A[3]; }
      const cut = tail === 'swallow' ? Math.max(0, 12 - Math.abs(x - 15.5) * 1.1) : tail === 'point' ? Math.abs(x - 15.5) * 1.0 : 0; if (y > H - 1 - cut) return null; const e = Math.min(x, W - 1 - x), f = x % 10;
      if (y < 3) return y === 0 ? B[5] : y === 2 ? B[1] : B[3]; if (e < 3) return e === 2 ? B[1] : e === 0 && x < 3 ? B[5] : B[3]; if (y > H - 4 - cut) return y > H - 3 - cut ? B[2] : B[4];
      return (f === 0 ? A[4] : f === 5 || f === 6 ? A[2] : A[3]); });
    for (let y = 0; y < H; y += 16) for (let x = 3; x < W - 3; x++) { const c = Q.get(x, y + 15); if (c && !wide && y + 15 < H - 16) Q.mul(x, y + 15, .9); }
    putCrest(Q, o.crest === undefined ? 'sun' : o.crest, wide ? 22 : 16, wide ? 16 : 24, wide ? 9 : 10, C); return Q; }, true);
  // 帆布。よこのぬい目、たての糸、つぎ。c2 でたてじま、crest で紋（色 cc）。64×64 を帆 1 枚に 1 回はる
  def('sail', 4, (o = {}) => { const Q = Px(64), A = ramp(o.c || '#ece0c4', 6, { contrast: .8 }), B = o.c2 ? ramp(o.c2) : null, C = ramp(o.cc || '#b8483a'), sd = o.seed || 0;
    Q.each((x, y) => { const S = B && ((x >> 3) & 1) ? B : A, ly = y & 15, n = tn(x, y, 16, 8, 64, 64, sd); if (ly === 15) return S[1]; if (ly === 0) return S[5]; if (ly === 14 && x % 4 < 2) return S[2]; if (x % 16 === 0 && ly % 3 === 1) return S[2]; return n > .66 ? S[4] : n < .3 ? S[2] : S[3]; });
    Q.rect(44, 36, 9, 8, A[2]); for (let i = 0; i < 9; i++) { Q.set(44 + i, 36, A[5]); if (i % 2) { Q.set(44 + i, 44, A[1]); Q.set(53, 36 + Math.min(7, i), A[1]); } }
    putCrest(Q, o.crest, 32, 30, 13, C); return Q; });
  // 気のうの布（64×64）。たてのぬい目が 16 ドットごと、色の帯 c2 が上下に 1 本ずつ、つぎ
  def('balloon', 4, (o = {}) => { const Q = Px(64), A = ramp(o.c || '#ecdcb8', 6, { contrast: .8 }), B = ramp(o.c2 || '#c8503c'), sd = o.seed || 0;
    Q.each((x, y) => { const lx = x & 15, band = (y >= 10 && y < 18) || (y >= 46 && y < 54), S = band ? B : A, n = tn(x, y, 16, 16, 64, 64, sd); if (lx === 15) return S[1]; if (lx === 0) return S[5]; if (lx === 14 && y % 3 === 0) return S[2];
      if (band && (y === 10 || y === 46)) return B[5]; if (band && (y === 17 || y === 53)) return B[1]; if (band && Math.abs(lx - 7.5) + Math.abs((y - (y < 30 ? 14 : 50)) + .5) < 2.6) return A[4]; return lx < 5 ? tone(S, n > .6 ? 5 : 4) : lx > 10 ? tone(S, 2) : tone(S, n < .3 ? 2 : 3); });
    Q.rect(20, 26, 7, 6, A[2]); for (let i = 0; i < 7; i++) { Q.set(20 + i, 26, A[5]); if (i % 2) Q.set(20 + i, 32, A[1]); } return Q; });
  // じゅうたん（64×64）。ふちの帯、ひし形のもよう
  def('carpet', 3, (o = {}) => { const Q = Px(64), A = ramp(o.c || '#a83a40'), B = ramp(o.c2 || '#e8c870'), C = ramp(o.c3 || '#34507a');
    Q.each((x, y) => { const e = Math.min(x, 63 - x, y, 63 - y), lx = x & 15, ly = y & 15, d = Math.abs(lx - 7.5) + Math.abs(ly - 7.5), D = Math.abs(x - 31.5) + Math.abs(y - 31.5);
      if (e < 2) return B[e ? 3 : 4]; if (e < 6) return (x + y) % 4 < 2 ? C[3] : C[2]; if (e === 6) return B[4]; if (e === 7) return A[1];
      if (D < 6) return B[5]; if (D < 9) return C[3]; if (D < 11) return B[3]; if (D > 20 && D < 22.5) return B[3];
      if (d < 1.6) return B[5]; if (d < 3) return C[2]; if (d > 6.6 && d < 7.6) return A[2]; return (x * 7 + y * 3) % 17 === 0 ? A[4] : A[3]; });
    return Q; });

  // ステンドグラスふうの窓（抜き色つき）。lancet＝先のとがった 32×48、rose＝丸い 32×32。黒いふちの中に色ガラス。lit で明るく
  def('glass', 1, (o = {}) => { const rose = o.kind === 'rose', H = rose ? 32 : 48, Q = Px(32, H), cs = (o.cs || ['#d8483a', '#e8b83a', '#3a78c8', '#3aa870', '#8a58b8']).map(c => ramp(o.lit ? mix(c, '#fff4c8', .28) : c)), St = ramp(o.frame || '#b8b0a4'), L = '#2a2630'; Q.clip = true;
    Q.each((x, y) => { const dx = x + .5 - 16, dy = y + .5 - 16, d = Math.hypot(dx, dy), ar = y < 24 ? 26.3 - Math.hypot(dx - (dx < 0 ? 10.8 : -10.8), y + .5 - 24) : 99;   // lancet は 2 つの円でとがったアーチ
      const edge = rose ? 15.5 - d : Math.min(ar, 15.5 - Math.abs(dx), H - .5 - y); if (edge < 0) return null; if (edge < 2.2) return edge < 1.1 ? St[dx + dy < 0 ? 5 : 2] : St[3]; if (edge < 3.2) return L;
      let id, lead = false; if (rose) { const a = Math.atan2(dy, dx) + PI, r = Math.hypot(dx, dy), sec = a / (PI / 4), rr = r < 3.5 ? 0 : r < 8 ? 1 : 2; lead = Math.abs(r - 3.5) < .6 || Math.abs(r - 8) < .6 || (r > 3.5 && Math.abs(sec - Math.round(sec)) * r * .78 < .6); id = rr * 8 + Math.floor(sec) + rr; }
      else { const u = x + y, v = x - y + 64; lead = u % 8 === 0 || v % 8 === 0 || x === 15 || x === 16 || y === 30; id = (u >> 3) * 7 + (v >> 3) * 3 + (y > 30 ? 2 : 0); if (Math.hypot(dx, y - 13) < 5) { lead = Math.abs(Math.hypot(dx, y - 13) - 4.6) < .7; id = 99; } }
      if (lead) return L; const S = cs[Math.floor(hash(id, 3, o.seed || 0) * cs.length)]; return o.lit ? S[(x + y) % 5 === 0 ? 5 : 4] : S[(x * 3 + y) % 7 === 0 ? 5 : (x + y * 2) % 5 === 0 ? 2 : 3]; });
    return Q; }, true);
  // 色タイル（32×32 に 16 ドットのタイルが 4 枚）。kind: 'star'（八角の星）/ 'check' / 'fan'（うろこ）
  def('tile', 1.5, (o = {}) => { const Q = Px(32), A = ramp(o.c || '#2f7ab0'), B = ramp(o.c2 || '#f0ead8'), C = ramp(o.c3 || '#e0a83a'), kind = o.kind || 'star';
    Q.each((x, y) => { const lx = x & 15, ly = y & 15, dx = Math.abs(lx - 7.5), dy = Math.abs(ly - 7.5), alt = ((x >> 4) + (y >> 4)) & 1; if (lx === 15 || ly === 15) return B[1]; if (lx === 0 || ly === 0) return B[5];
      if (kind === 'check') return alt ? (lx + ly < 16 ? A[4] : A[3]) : (lx + ly < 16 ? B[4] : B[3]);
      if (kind === 'fan') { const r = Math.hypot(lx - 7.5, ly - 15); return r < 4 ? C[4] : r < 5 ? A[1] : r < 9 ? (alt ? A[3] : A[4]) : r < 10 ? A[1] : B[lx < 8 ? 4 : 3]; }
      const st = Math.max(dx, dy) < 5 || dx + dy < 7; if (dx + dy < 1.6) return C[5]; if (dx + dy < 3) return C[3]; if (st) return (Math.max(dx, dy) > 4 || dx + dy > 6) ? A[1] : (lx < 8 ? A[4] : A[3]); if (dx > 6 && dy > 6) return C[3]; return B[lx + ly < 15 ? 4 : 3]; });
    return Q; });
  // 時計の文字盤（抜き色つき 32×32）。針は形で付ける
  def('clock', 1, (o = {}) => { const Q = Px(32), A = ramp(o.c || '#f0e8d0', 6, { contrast: .7 }), Gd = ramp(o.rim || '#d8a83a'), L = '#3a3038'; Q.clip = true;
    Q.each((x, y) => { const dx = x + .5 - 16, dy = y + .5 - 16, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), k = a / (PI / 6), near = Math.abs(k - Math.round(k)) * d * .52; if (d > 15.6) return null; if (d > 13) return Gd[d > 14.6 ? 1 : dx + dy < 0 ? 5 : 3]; if (d > 12.2) return L;
      if (d > 8.6 && d < 11.4 && near < (Math.round(k) % 3 === 0 ? 1.1 : .55)) return L; if (d < 1.6) return Gd[2]; return dx + dy < -6 ? A[4] : dx + dy > 9 ? A[2] : A[3]; });
    return Q; }, true);

  // 落とし格子（抜き色つき 32×32。くり返す）
  def('grate', 1, (o = {}) => { const Q = Px(32), A = ramp(o.c || '#4a4c5a'); Q.each((x, y) => { const lx = x & 7, ly = y & 7, v = lx < 3, h = ly < 2; if (v && h) return lx === 1 ? A[5] : A[1]; if (v) return A[[4, 3, 1][lx]]; if (h) return A[ly ? 1 : 4]; return null; }); return Q; }, true);
  // 手すり（抜き色つき 32×32。よこにくり返す）。kind: 'wood'（ろくろの小柱）/ 'iron'（うずまき）/ 'stone'（太い小柱）/ 'rope'（くいと なわ 2 本）
  def('rail', 1, (o = {}) => { const kind = o.kind || 'wood', Q = Px(32), A = ramp(o.c || (kind === 'iron' ? '#3c3e4a' : kind === 'stone' ? '#b0aaa0' : kind === 'rope' ? '#8a6a44' : '#8a6040')), Rp = ramp('#c8a868');
    Q.each((x, y) => { if (kind === 'rope') { const lx = x & 31, sag = Math.round(Math.sin((x + 12) / 32 * PI * 2) * 1.5); if (lx < 4 && y >= 2) return y === 2 ? A[5] : A[[4, 3, 3, 1][lx]]; for (const y0 of [8, 20]) { const yy = y - y0 - sag; if (yy === 0) return (x + y) % 3 ? Rp[4] : Rp[2]; if (yy === 1) return (x + y) % 3 ? Rp[2] : Rp[1]; } return null; }
      if (y < 4) return y === 0 ? A[5] : y === 3 ? A[1] : A[3]; if (y >= 28) return y === 28 ? A[4] : y === 31 ? A[1] : A[3];
      if (kind === 'iron') { const lx = x & 7; if (lx === 3) return A[4]; if (lx === 4) return A[1]; const r = Math.hypot((x & 15) - 11.5, y - 14); return (x & 8) && Math.abs(r - 3) < .8 ? A[3] : null; }
      const w = kind === 'stone' ? 16 : 8, lx = x % w, c = w / 2 - .5, ly = y - 4, hw = kind === 'stone' ? [2, 3, 5, 5, 4, 3, 2, 2, 3, 4, 5, 5, 5, 5, 4, 3, 2, 2, 3, 4, 5, 5, 3, 2][ly] : [1, 2, 2, 1, 1, 1, 2, 3, 3, 3, 2, 2, 1, 1, 1, 2, 2, 2, 1, 1, 1, 2, 2, 1][ly], dx = lx - c; if (Math.abs(dx) > hw) return null; return dx < -hw + 1 ? A[5] : dx > hw - 1 ? A[1] : A[dx < 0 ? 4 : 3]; });
    return Q; }, true);
  // なわ（抜き色つき 32×32）。kind: 'line'（よこ 1 本。よこにくり返す）/ 'ladder'（なわばしご。たてにくり返す）/ 'net'（あみ）
  def('rope', 1, (o = {}) => { const kind = o.kind || 'line', Q = Px(kind === 'line' ? 16 : 32, kind === 'line' ? 4 : 32), A = ramp(o.c || '#b8945a');
    Q.each((x, y) => { if (kind === 'line') return y === 0 ? null : y === 3 ? A[1] : (x + y) % 4 < 2 ? A[4] : A[2];
      if (kind === 'ladder') { if (x >= 3 && x < 6 || x >= 26 && x < 29) return (y + (x % 3)) % 4 < 2 ? A[4] : A[2]; if (x >= 6 && x < 26 && (y % 16 >= 6 && y % 16 < 9)) return y % 16 === 6 ? A[5] : y % 16 === 8 ? A[1] : A[3]; return null; }
      const u = (x + y) % 8, v = ((x - y) % 8 + 8) % 8; return u === 0 || v === 0 ? A[4] : u === 1 || v === 1 ? A[1] : null; });
    return Q; }, true);
  // 風車の羽根 1 枚（抜き色つき 16×64。下がじく側）。木の骨組みに布
  def('millsail', 1, (o = {}) => { const Q = Px(16, 64), W = ramp('#7a5a3c'), A = ramp(o.c || '#ece0c4', 6, { contrast: .8 }); Q.clip = true;
    Q.each((x, y) => { if (x >= 7 && x <= 8) return x === 7 ? W[4] : W[2]; if (y > 54) return null; if (y < 2 || x === 0 || x === 15) return W[3]; if (y % 8 === 0) return W[x < 7 ? 3 : 4]; if (x < 7) return (x === 3 && y % 8 > 1) ? W[2] : null; return (y % 8 === 7) ? A[2] : (x + (y >> 3)) % 5 === 0 ? A[4] : A[3]; });
    return Q; }, true);

  // たなに並んだ物（64×64。たな 1 つに 1 回はる）。kind: 'bottles'（びん）/ 'books'（本）/ 'mix'
  def('shelf', 2, (o = {}) => { const Q = Px(64), W = ramp(o.c || '#7a5438'), kind = o.kind || 'mix', sd = o.seed || 0, COL = ['#c8483a', '#3a8ac8', '#4aa868', '#e0b040', '#8a5ab8', '#e8e0d0', '#d87a3a', '#3aa8a0']; Q.clip = true;
    Q.each((x, y) => (x < 2 || x > 61) ? W[x === 0 || x === 62 ? 4 : 2] : (y + x * 3) % 9 === 0 ? W[0] : W[1]);
    for (const y of [0, 20, 41, 61]) for (let x = 0; x < 64; x++) { Q.set(x, y, W[5]); Q.set(x, y + 1, W[3]); Q.set(x, y + 2, W[1]); if (y < 60) Q.set(x, y + 3, W[0]); }
    [[3, 17], [23, 18], [44, 17]].forEach(([y0, hh], r) => { const kd = kind === 'mix' ? ['bottles', 'books', 'jars'][r] : kind, yb = y0 + hh; let x = 4;
      while (x < 58) { const h1 = hash(x, r, sd), S = ramp(COL[Math.floor(hash(x, r, sd + 1) * COL.length)]);
        if (kd === 'books') { const bw = 3 + Math.floor(h1 * 2), bh = 11 + Math.floor(hash(x, r, sd + 2) * 5); if (x + bw > 60) break; for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) Q.set(x + i, yb - 1 - j, i === 0 ? S[5] : i === bw - 1 ? S[1] : (j === 2 || j === bh - 3) ? '#f0d890' : S[3]); x += bw + (h1 > .85 ? 2 : 0); }
        else if (kd === 'jars') { const bw = 7, bh = 7 + Math.floor(h1 * 3); if (x + bw > 60) break; for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) { if ((j === 0 || j === bh - 1) && (i === 0 || i === bw - 1)) continue; Q.set(x + i, yb - 1 - j, j === bh - 1 ? S[1] : i < 2 ? S[5] : i > 4 ? S[2] : S[3]); } Q.rect(x + 1, yb - bh - 2, bw - 2, 2, '#e8dcc0'); Q.set(x + 1, yb - bh - 2, '#fff8e8'); x += bw + 2; }
        else { const bw = 4 + Math.floor(h1 * 2), bh = 7 + Math.floor(hash(x, r, sd + 2) * 4); if (x + bw > 60) break; for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) { if (j === bh - 1 && (i === 0 || i === bw - 1)) continue; Q.set(x + i, yb - 1 - j, i === 0 ? S[5] : i === bw - 1 ? S[1] : j < 2 ? S[2] : j > bh - 4 ? S[4] : S[3]); } const nx = x + (bw >> 1) - 1; Q.rect(nx, yb - bh - 3, 2, 3, S[4]); Q.set(nx, yb - bh - 3, S[5]); Q.rect(nx, yb - bh - 5, 2, 2, '#c8a070'); Q.set(x + 1, yb - bh + 2, '#ffffff'); x += bw + 1 + (h1 > .7 ? 1 : 0); } } });
    return Q; });
  // 火（抜き色つき 32×32 の 4 コマ）。R.flip(材質, F.tex.fire(), t, 8) で送る
  const fireFrame = f => { const Q = Px(32); Q.clip = true; const TG = [[8, 15, 5], [16, 26, 7], [23, 18, 5.5], [12, 20, 4], [20, 22, 4.5]];
    const Hh = x => { let h = 0; TG.forEach(([c, hh, w], k) => { const cc = c + Math.sin(f * 1.571 + k * 1.9) * 1.6, hk = hh * (.72 + .28 * Math.sin(f * 1.571 * (1 + (k & 1)) + k * 2.3)), q = Math.abs(x + .5 - cc) / w; if (q < 1) h = Math.max(h, hk * (1 - Math.pow(q, 1.6))); }); return h; };
    Q.each((x, y) => { const yy = 31 - y, h = Hh(x); if (yy >= h) return null; const k = yy / h, e = Math.min(Hh(x - 1), Hh(x + 1)) <= yy; if (e || k > .86) return '#c8402a'; if (k > .62) return '#f0802a'; if (k > .34 || Math.abs(x - 15.5) > 7) return '#ffc23a'; return '#fff2b8'; });
    for (let k = 0; k < 3; k++) { const x = 8 + Math.floor(hash(k, f, 5) * 16), y = 2 + Math.floor(hash(k, f, 6) * 8); Q.set(x, y, '#ffc23a'); } return Q; };
  paint.fire = fireFrame; tex.fire = () => { let a = cache.get('fire'); if (!a) cache.set('fire', a = [0, 1, 2, 3].map(f => T.from(fireFrame(f), { m: 1, cut: true }))); return a; };
  // むぎわら（32×32。上 3/4 が編み目、下 1/4 がリボン）
  def('straw', .5, (o = {}) => { const Q = Px(32), A = ramp(o.c || '#e8c878'), B = ramp(o.c2 || '#c8483a'); Q.each((x, y) => { if (y >= 24) return y === 24 ? B[5] : y === 31 ? B[1] : B[3]; const ly = y & 3, lx = (x + (y >> 2) * 3) % 6; return ly === 3 ? A[1] : lx === 0 ? A[2] : ly === 0 ? A[5] : lx < 3 ? A[4] : A[3]; }); return Q; });
  // かごの編み目（32×32）
  def('basket', .5, (o = {}) => { const Q = Px(32), A = ramp(o.c || '#b88a50'); Q.each((x, y) => { if (y < 3) return y === 0 ? A[5] : y === 2 ? A[1] : A[4]; const cx = x >> 2, cy = (y - 3) >> 2, lx = x & 3, ly = (y - 3) & 3, ov = (cx + cy) & 1; return ov ? (lx === 0 ? A[1] : lx === 3 ? A[2] : A[4]) : (ly === 0 ? A[4] : ly === 3 ? A[1] : A[3]); }); return Q; });
  F.tex = tex; F.paint = paint;

  // ================= 2. 道具 =================
  const reg = (g, fn) => { g.userData.tick = fn; live.push(g); return g; };
  F.tick = t => { for (let i = 0; i < live.length; i++) live[i].userData.tick(t); };   // 動く物を全部動かす（毎コマ 1 回）
  const stoneT = v => asTex(v, c => tex.ashlar(c ? { c } : {})), roofT = v => asTex(v, c => tex.slate(c ? { c } : {})), woodT = (v, d) => asTex(v, c => T.planks({ c: c || d || '#8a6444' }));
  const gold = () => tex.ornate(), DARKWOOD = '#5a4030';
  // アーチの穴のふち（左下 → 上 → 右下の点の列）。kind: 'round'（半円）/ 'point'（とがり）
  const archPts = (aw, ah, kind = 'round', n = 5) => { const a = aw / 2, rise = Math.min(ah - .05, kind === 'point' ? aw * .8 : a), ys = ah - rise, c = Math.max(0, (rise * rise - a * a) / aw), r = a + c, th = Math.acos(c / r), L = [[-a, 0], [-a, ys]];
    for (let i = 1; i <= n; i++) { const q = th * i / n; L.push([c - r * Math.cos(q), ys + r * Math.sin(q)]); } for (let i = n; i >= 0; i--) L.push([-L[i][0], L[i][1]]); return L; };
  // アーチの穴のあいた かべの面（はば W × 高さ H。z の位置に、back なら -z 向き）
  const archFace = (G, W, H, pts, z, m, back, sh = 1, x0 = 0, y0 = 0) => { const hw = W / 2, ys = pts[1][1], e = 1e-4, out = ([x, y]) => { if (y <= ys + e) return [x < 0 ? -hw : hw, y]; const dy = y - ys, k = Math.min(Math.abs(x) > e ? hw / Math.abs(x) : 1e9, (H - ys) / dy); return [x * k, ys + dy * k]; };
    const V = ([x, y]) => [x0 + (back ? -x : x), y0 + y, z], U = ([x, y]) => [(x + hw) / m, y / m], side = q => Math.abs(Math.abs(q[0]) - hw) < e && q[1] < H - e, top = q => q[1] > H - e && Math.abs(q[0]) < hw - e;
    for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1], op = out(p), oq = out(q), poly = [p, q, oq]; if (side(op) && top(oq)) poly.push([op[0], H]); else if (top(op) && side(oq)) poly.push([oq[0], H]); poly.push(op);
      for (let j = 1; j < poly.length - 1; j++) G.tri(V(poly[0]), V(poly[j]), V(poly[j + 1]), U(poly[0]), U(poly[j]), U(poly[j + 1]), sh); } };
  const archTunnel = (G, pts, z0, z1, m, sh = .65, x0 = 0, y0 = 0) => { let v = 0; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1], v1 = v + Math.hypot(q[0] - p[0], q[1] - p[1]) / m; G.quad([x0 + p[0], y0 + p[1], z0], [x0 + p[0], y0 + p[1], z1], [x0 + q[0], y0 + q[1], z1], [x0 + q[0], y0 + q[1], z0], [v, 0, v1, Math.abs(z0 - z1) / m], sh); v = v1; } };
  // アーチのふち石（前の面に少しうかせて、明るい石の輪）
  const archTrim = (G, pts, z, wd = .3, x0 = 0, y0 = 0) => { const a = -pts[0][0], ys = pts[1][1], k = 1 + wd / a, o = ([x, y]) => [x * k, y > ys ? ys + (y - ys) * k : y]; for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1], op = o(p), oq = o(q), V = ([x, y]) => [x0 + x, y0 + y, z]; G.quad(V(p), V(q), V(oq), V(op), [(i % 4) * .25, .02, (i % 4) * .25 + .22, .22], i % 2 ? 1.16 : 1.04); } };
  // のこぎり形の上ば（低いかべ＋出っぱり）。(x0,z0) から (x1,z1) へ
  const crenels = (G, x0, z0, x1, z1, y, o = {}) => { const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), mw = o.mw || .7, mh = o.mh || .65, th = o.th || .4, m = o.m || 3, ph = o.ph ?? .45, n = Math.max(1, Math.round((len / mw - 1) / 2)), u = len / (2 * n + 1);
    G.at(TR(x0, y, z0, Math.atan2(-dz, dx))); G.box(len, ph, th, len / 2, 0, 0, { m, c0: .85 }); for (let k = 0; k <= n; k++) G.box(u, mh, th, u * (2 * k + .5), ph, 0, { m, c1: 1.06 }); G.at(null); };

  // ================= 3. 城・砦 =================
  // 旗・のぼり・たれ幕。kind: 'flag'（さおの先で横になびく）/ 'pennant'（細長い三角）/ 'banner'（のぼり：さおの横木から下がる）/ 'drape'（たれ幕：さおなし。y=0 が上のはし、かべの前に下げる）
  F.flag = (o = {}) => { const kind = o.kind || 'flag', vert = kind === 'banner' || kind === 'drape', w = o.w || (kind === 'drape' ? 1.2 : kind === 'banner' ? .8 : kind === 'pennant' ? 2.2 : 1.6), h = o.h || (kind === 'drape' ? 2.6 : kind === 'banner' ? 2.2 : kind === 'pennant' ? .55 : 1.05), pole = kind === 'drape' ? 0 : (o.pole ?? (kind === 'banner' ? 3.6 : 3)), g = new THREE.Group(), B = parts();
    const tx = o.tex || tex.banner({ c: o.c, c2: o.c2, crest: o.crest, cc: o.cc, tail: o.tail || (kind === 'pennant' ? 'point' : undefined), wide: !vert });
    if (pole) { B.g(T.planks({ c: '#6a4c34' })).loft(5, [[0, .065, .065, 0, .8], [pole, .045, .045, pole / 1.5, 1]]); B.g(gold()).loft(5, [[pole - .02, .05, .05, .2, .9], [pole + .1, .1, .1, .5, 1.1], [pole + .22, .01, .01, .8, 1.1]]); if (kind === 'banner') B.g(T.planks({ c: '#6a4c34' })).box(w + .25, .06, .06, w / 2, pole - .22, 0, { m: 1.5 }); g.add(B.group()); }
    const nx = vert ? 2 : 6, ny = vert ? 5 : 2, x0 = kind === 'drape' ? -w / 2 : kind === 'banner' ? .1 : .05, y1 = kind === 'drape' ? 0 : pole - (kind === 'banner' ? .25 : .12), G = geo().normal([0, .3, 1]);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const xa = x0 + w * i / nx, xb = x0 + w * (i + 1) / nx, ya = y1 - h + h * j / ny, yb = y1 - h + h * (j + 1) / ny; G.quad([xa, ya, 0], [xb, ya, 0], [xb, yb, 0], [xa, yb, 0], [i / nx, j / ny, (i + 1) / nx, (j + 1) / ny]); }
    const me = G.mesh(tx, { side: true }), P = me.geometry.attributes.position, base = P.array.slice(), ph = live.length * 1.7 + (o.seed || 0); me.userData.dyn = true; me.castShadow = false; g.add(me);
    return reg(g, t => { const A = P.array; for (let i = 0; i < A.length; i += 3) { const x = base[i], y = base[i + 1]; if (vert) { const k = (y1 - y) / h; A[i + 2] = (Math.sin(y * 2.4 + t * 2.6 + ph) * .1 + Math.sin(t * 1.1 + ph) * .12 * k) * k; A[i] = x + Math.sin(t * 1.7 + ph + y * 1.5) * .04 * k; }
      else { const k = (x - x0) / w, q = x * 3.4 - t * 5.2 + ph; A[i + 2] = Math.sin(q + y * 1.2) * .17 * k * Math.min(1.4, w / 1.6); A[i + 1] = y - k * k * .1 * h + Math.cos(q) * .04 * k; } } P.needsUpdate = true; }); };
  // 通りにわたす三角の旗のひも（from, to は世界の座標 [x,y,z]）
  F.bunting = (o = {}) => { const a = o.from || [-4, 4, 0], b = o.to || [4, 4, 0], n = o.n || 9, sag = o.sag ?? .5, cs = o.cs || ['#c8453a', '#f0d070', '#34507a', '#f4ecd8', '#3f8a6a'], B = parts(), dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1, tx = dx / L, tz = dz / L, at = k => [a[0] + dx * k, a[1] + (b[1] - a[1]) * k - sag * 4 * k * (1 - k), a[2] + dz * k], Rp = B.g(tex.rope(), { side: true });
    for (let i = 0; i < n; i++) { const p = at(i / n), q = at((i + 1) / n); Rp.quad([p[0], p[1] - .03, p[2]], [q[0], q[1] - .03, q[2]], [q[0], q[1] + .03, q[2]], [p[0], p[1] + .03, p[2]], [0, 0, 3, 1]);
      const c = at((i + .5) / n), hw = L / n * .36; B.g(T.fabric({ pattern: 'plain', c: cs[i % cs.length] }), { side: true }).normal([0, .5, 1]).tri([c[0] - tx * hw, c[1], c[2] - tz * hw], [c[0] + tx * hw, c[1], c[2] + tz * hw], [c[0], c[1] - hw * 2.3, c[2]], [0, 1], [1, 1], [.5, 0], [1, 1, .8]); }
    const g = B.group(); g.traverse(q => { q.castShadow = false; }); return g; };
  // 城壁（x 方向にのびる）。上は通路、前後に のこぎり形
  F.wall = (o = {}) => { const len = o.len || 12, h = o.h || 5, th = o.th || 1.2, st = stoneT(o.stone), m = st.userData.m, G = geo();
    G.box(len, h, th, 0, 0, 0, { m, c0: .76 }); G.tint(.8).box(len, .3, th + .22, 0, h - .5, 0, { m }).tint(1);
    if (o.crenel !== false) { crenels(G, -len / 2, th / 2 - .09, len / 2, th / 2 - .09, h, { m }); crenels(G, -len / 2, -th / 2 + .09, len / 2, -th / 2 + .09, h, { m }); }
    const me = G.mesh(st); me.userData = { len, h, th }; return me; };
  // とんがり屋根。n: 8（丸い塔）/ 4（四角い塔）。r は のきの半径（四角は はばの半分）
  F.spire = (o = {}) => { const r = o.r || 2.3, h = o.h || r * 2.3, rt = roofT(o.roof), m = rt.userData.m, n = o.n || 8, B = parts(), G = B.g(rt), k = n === 4 ? 1.414 : 1, ur = Math.max(2, Math.round(2 * PI * r / m)), sl = Math.hypot(r, h) / m, rg = (f, q, c) => [h * f, r * q * k, r * q * k, sl * f, c];
    G.loft(n, [rg(0, 1, .78), rg(.1, .84, .95), rg(.42, .42, 1), [h, .03, .03, sl, 1.1]], { ur }); B.g(T.planks({ c: DARKWOOD })).loft(n, [[0, r * k, r * k, 0, .55]], { cap: 'bot', capUV: [.5, .5] });
    if (o.finial !== false) B.g(gold()).loft(5, [[h - .12, .05, .05, .2, .9], [h + .1, .14, .14, .5, 1], [h + .26, .1, .1, .7, 1.1], [h + .52, .01, .01, .9, 1.1]]);
    const g = B.group(); g.userData = { h, r }; return g; };
  // 塔。kind: 'round'（八角）/ 'square'（r は はばの半分）。top: 'cone'（とんがり屋根）/ 'crenel'（のこぎり形の屋上）
  F.tower = (o = {}) => { const sq = o.kind === 'square', r = o.r || 2, h = o.h || 9, st = stoneT(o.stone), m = st.userData.m, B = parts(), G = B.g(st), n = sq ? 4 : (o.n || 8), k = sq ? 1.414 : 1, R1 = r * k, top = o.top || 'cone', ur = Math.max(2, Math.round((sq ? 8 : 2 * PI) * r / m)), rg = (y, q, c) => [y, R1 * q, R1 * q, y / m, c], g = new THREE.Group();
    G.loft(n, [rg(0, 1.1, .72), rg(Math.min(1.4, h * .14), 1, .9), rg(h - 1.2, 1, 1), rg(h - .75, 1.15, .8), rg(h, 1.15, 1.02)], { ur, cap: 'top', capRect: true });
    const ring = R.ngon(n, .5).pts, face = (j, y, wq, hq, G2, uv = [0, 0, 1, 1]) => { const a = ring[j], b = ring[(j + 1) % n], mx = (a[0] + b[0]) / 2 * R1, mz = (a[1] + b[1]) / 2 * R1, l = Math.hypot(mx, mz), dx = mx / l, dz = mz / l, tx = dz, tz = -dx, e = .04, P4 = (s, yy) => [mx + dx * e + tx * s, yy, mz + dz * e + tz * s]; G2.quad(P4(-wq / 2, y), P4(wq / 2, y), P4(wq / 2, y + hq), P4(-wq / 2, y + hq), uv); };
    if (o.wins !== false) { const wt = T.window({ h: 48, arch: 1, bars: 'grid', frame: '#8a8478' }), wl = T.window({ h: 48, arch: 1, bars: 'grid', lit: 1, frame: '#8a8478' }), ws = Math.min(1, r * .5); let c = 0; for (const [fy, off] of h > 7.5 ? [[.42, 0], [.7, 1]] : [[.5, 0]]) for (let j = off; j < n; j += sq ? 1 : 2) { const lit = hash(c++, n, o.seed || 0) < (o.lit || 0); face((j + n / 2 - 1) % n, h * fy, .8 * ws, 1.2 * ws, B.g(lit ? wl : wt, { offset: true, glow: lit })); } }
    if (top === 'crenel') for (let j = 0; j < n; j++) { const a = ring[j], b = ring[(j + 1) % n], q = R1 * 1.15 - .25 * k; crenels(G, a[0] * q, a[1] * q, b[0] * q, b[1] * q, h, { m, mw: .55, mh: .55, th: .36 }); }
    g.add(B.group()); let tp = h + (top === 'crenel' ? 1 : 0);
    if (top === 'cone') { const rh = o.roofH || r * 2.4, sp = F.spire({ r: r * 1.34, h: rh, roof: o.roof, n: sq ? 4 : 8 }); sp.position.y = h - .02; g.add(sp); tp = h + rh; }
    if (o.flag) { const f = F.flag({ kind: 'flag', pole: 2.4, ...o.flag }); f.position.y = top === 'cone' ? tp - .25 : h; g.add(f); }
    g.userData = { top: tp, r, h }; return g; };
  // 門（アーチの穴をくぐれる）。door: 'portcullis'（落とし格子）/ 'wood'（木の とびら）/ 'none'。open 0〜1。banner: { …F.flag の引数 } でアーチの上にたれ幕
  F.gate = (o = {}) => { const W = o.w || 7, H = o.h || 7, d = o.d || 3, aw = o.aw || 3.4, ah = o.ah || 4.4, st = stoneT(o.stone), m = st.userData.m, B = parts(), G = B.g(st), pts = archPts(aw, ah, o.arch), hw = W / 2, hd = d / 2, ys = pts[1][1], g = new THREE.Group(), door = o.door || 'portcullis', sc = [.76, .76, .96, .96];
    archFace(G, W, H, pts, hd, m, false); archFace(G, W, H, pts, -hd, m, true, .86); archTunnel(G, pts, hd, -hd, m, .6); archTrim(G, pts, hd + .05);
    G.quad([hw, 0, hd], [hw, 0, -hd], [hw, H, -hd], [hw, H, hd], [0, 0, d / m, H / m], sc).quad([-hw, 0, -hd], [-hw, 0, hd], [-hw, H, hd], [-hw, H, -hd], [0, 0, d / m, H / m], sc).quad([-hw, H, hd], [hw, H, hd], [hw, H, -hd], [-hw, H, -hd], [0, 0, W / m, d / m], 1);
    G.tint(.8).box(W + .3, .34, d + .3, 0, H - .6, 0, { m }).tint(1);
    if (o.crenel !== false) { const x = hw - .1, z = hd - .1; crenels(G, -x, z, x, z, H, { m }); crenels(G, -x, -z, x, -z, H, { m }); crenels(G, x, z - .4, x, -z + .4, H, { m }); crenels(G, -x, -z + .4, -x, z - .4, H, { m }); }
    g.add(B.group()); let setOpen = () => {};
    if (door === 'portcullis') { const me = geo().quad([-aw / 2, 0, 0], [aw / 2, 0, 0], [aw / 2, ah, 0], [-aw / 2, ah, 0], [0, 0, Math.round(aw), ah]).mesh(tex.grate(), { side: true }), P = me.geometry.attributes.position, U = me.geometry.attributes.uv; me.position.z = hd - .55; me.userData.dyn = true; g.add(me);
      setOpen = k => { const y0 = cl(k) * ah * .82; for (const i of [0, 1, 3]) { P.setY(i, y0); U.setY(i, 0); } for (const i of [2, 4, 5]) U.setY(i, ah - y0); P.needsUpdate = U.needsUpdate = true; }; }
    if (door === 'wood') { const wt = T.planks({ c: '#6a4a34', w: 8 }), it = tex.iron({ rust: 0, c: '#4a4c58' }), B2 = parts(); B2.g(wt).quad([-aw / 2, ys, hd - .5], [aw / 2, ys, hd - .5], [aw / 2, ah, hd - .5], [-aw / 2, ah, hd - .5], [0, 0, aw / 1.5, (ah - ys) / 1.5], .85); B2.g(it).box(aw, .12, .1, 0, ys - .06, hd - .5, { m: 1.5 }); g.add(B2.group()); const leaves = [];
      for (const sx of [-1, 1]) { const L = parts(), lw = aw / 2 - .02; L.g(wt).at(TR(0, 0, 0, 0, 0, 0)).box(lw, ys, .12, sx * -lw / 2, 0, 0, { uv: [0, 0, lw / 1.5, ys / 1.5], c0: .8 }); for (const fy of [.2, .78]) L.g(it).box(lw - .1, .16, .16, sx * -lw / 2, ys * fy, 0, { m: 1.5 }); L.g(gold()).box(.1, .22, .2, sx * -(lw - .22), ys * .48, 0, {}); const lf = L.group(), hold = new THREE.Group(); hold.add(lf); hold.position.set(sx * aw / 2, 0, hd - .5); hold.userData.dyn = true; g.add(hold); leaves.push([lf, sx]); }
      setOpen = k => { for (const [lf, sx] of leaves) lf.rotation.y = sx * cl(k) * 1.45; }; }
    if (o.banner) { const f = F.flag({ kind: 'drape', w: 1.2, h: Math.min(2.2, H - ah - .5) + .5, ...o.banner }); f.position.set(0, H - .75, hd + .1); g.add(f); }
    setOpen(o.open ?? 0); g.userData = { setOpen, w: W, h: H, d, aw, ah }; return g; };
  // はね橋。-z のはしが ちょうつがい（門の前に置く）、+z へたおれる。open: 0＝おりている / 1＝上がっている
  F.drawbridge = (o = {}) => { const w = o.w || 3.4, len = o.len || 5, ch = o.chainH || 4, g = new THREE.Group(), B = parts(), Wd = B.g(T.planks({ c: '#7a5a3c', w: 8 })), It = B.g(tex.iron({ rust: .3 })); g.userData.dyn = true;
    Wd.at(TR(0, 0, 0, PI / 2)).box(len, .16, w, -len / 2, -.08, 0, { m: 2 }).at(null); for (const z of [.3, len - .3]) It.box(w + .06, .2, .16, 0, -.1, z, { m: 1.5 }); const deck = B.group(); g.add(deck);
    const chains = [-1, 1].map(sx => { const c = geo().box(.07, 1, .07, 0, 0, 0, { uv: [0, 0, .2, 4] }).mesh(tex.iron({ rust: 0, c: '#3a3c48' })); g.add(c); return [c, sx]; }), A = new THREE.Vector3(), E = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const setOpen = k => { const a = cl(k) * 1.35; deck.rotation.x = -a; for (const [c, sx] of chains) { A.set(sx * (w / 2 - .1), ch, -.1); E.set(sx * (w / 2 - .1), Math.sin(a) * (len - .3), Math.cos(a) * (len - .3)); c.position.copy(E); A.sub(E); c.scale.y = A.length(); c.quaternion.setFromUnitVectors(up, A.normalize()); } };
    setOpen(o.open ?? 0); g.userData.setOpen = setOpen; return g; };
  // できあいの城：門＋城壁＋角の塔＋本丸（四角い大きな塔）＋高い尖塔＋旗。門は z=0 で +z を向く。はば 30 m、奥行き 19 m、高さ 24 m ほど（s で全体の大きさ）
  F.castle = (o = {}) => { const st = stoneT(o.stone), rf = roofT(o.roof), g = new THREE.Group(), fl = { c: o.c || '#c8453a', c2: o.c2, crest: o.crest || 'sun', cc: o.cc }, put = (ob, x, y, z, ry = 0) => { ob.position.set(x, y, z); ob.rotation.y = ry; g.add(ob); return ob; }, lit = o.lit || 0;
    const gate = put(F.gate({ w: 7, h: 7.6, d: 3.2, stone: st, open: o.open ?? 1, door: o.door, banner: fl }), 0, 0, 0);
    for (const sx of [-1, 1]) { put(F.wall({ len: 7.4, h: 5.6, stone: st }), sx * 7.1, 0, 0); put(F.tower({ r: 2.3, h: 9.6, stone: st, roof: rf, flag: fl, lit, seed: sx }), sx * 12.6, 0, .2); put(F.wall({ len: 14.4, h: 5.6, stone: st }), sx * 12.6, 0, -8.2, PI / 2); put(F.tower({ r: 2.1, h: 8.8, stone: st, roof: rf, lit, seed: sx + 5 }), sx * 12.6, 0, -16.6); }
    put(F.wall({ len: 23, h: 5.6, stone: st }), 0, 0, -16.6);
    if (o.keep !== false) { put(F.tower({ kind: 'square', r: 4.6, h: 10.8, stone: st, top: 'crenel', wins: false }), 0, 0, -9.6); put(F.tower({ r: 2.5, h: 17.5, roofH: 6.6, stone: st, roof: rf, flag: { ...fl, w: 2.2, h: 1.4 }, lit, seed: 3 }), 0, 0, -10.6);
      for (const sx of [-1, 1]) put(F.tower({ r: 1.5, h: 13.6, roofH: 4.4, stone: st, roof: rf, lit, seed: sx + 9 }), sx * 4.3, 0, -6.2);
      const gl = tex.glass({ lit: lit > .5 ? 1 : 0 }), Gg = geo(); for (const x of [-2, 0, 2]) Gg.quad([x - .6, 6.2, -4.95], [x + .6, 6.2, -4.95], [x + .6, 8, -4.95], [x - .6, 8, -4.95]); g.add(Gg.mesh(gl, { offset: true, glow: lit > .5 })); }
    g.scale.setScalar(o.s || 1); g.userData = { gate, w: 30, d: 19 }; return g; };

  // ================= 4. 建物の部品 =================
  // アーチ（柱 2 本＋上の石）。w, h は穴の大きさ、th は柱と上の石の太さ、d は奥行き
  F.arch = (o = {}) => { const w = o.w || 3, h = o.h || 4, d = o.d || 1, th = o.th || .7, st = stoneT(o.stone), m = st.userData.m, G = geo(), W = w + th * 2, H = h + th * .8, pts = archPts(w, h, o.kind), hw = W / 2, hd = d / 2, sc = [.78, .78, .96, .96];
    archFace(G, W, H, pts, hd, m, false); archFace(G, W, H, pts, -hd, m, true, .86); archTunnel(G, pts, hd, -hd, m, .66); archTrim(G, pts, hd + .04, .22); G.quad([hw, 0, hd], [hw, 0, -hd], [hw, H, -hd], [hw, H, hd], [0, 0, d / m, H / m], sc).quad([-hw, 0, -hd], [-hw, 0, hd], [-hw, H, hd], [-hw, H, -hd], [0, 0, d / m, H / m], sc).quad([-hw, H, hd], [hw, H, hd], [hw, H, -hd], [-hw, H, -hd], [0, 0, W / m, d / m], 1.04);
    G.tint(.82).box(W + .16, .18, d + .16, 0, H, 0, { m }).tint(1); const me = G.mesh(st); me.userData = { w: W, h: H + .18 }; return me; };
  // 柱。kind: 'round'（石の丸柱。台と柱頭つき）/ 'square' / 'east'（東方風の赤い柱。石の台）
  F.column = (o = {}) => { const h = o.h || 4, r = o.r || .3, kind = o.kind || 'round', B = parts();
    if (kind === 'east') { B.g(asTex(o.tex, c => tex.lacquer({ band: true, c }))).loft(8, [[.14, r, r, 0, .85], [h, r * .92, r * .92, 1, 1]], { ur: 2 }); B.g(T.stone({ c: '#a8a296' })).loft(8, [[0, r * 1.7, r * 1.7, 0, .75], [.14, r * 1.4, r * 1.4, .1, 1]], { cap: 'top', capRect: true, ur: 2 }); return B.group(); }
    const st = asTex(o.tex, c => tex.ashlar({ c: c || '#d8d2c4' })), m = st.userData.m, n = kind === 'square' ? 4 : 8, k = n === 4 ? 1.414 : 1, rg = (y, q, c) => [y, r * q * k, r * q * k, y / m, c];
    B.g(st).loft(n, [rg(0, 1.55, .78), rg(.2, 1.55, 1), rg(.28, 1.1, .85), rg(.34, 1, 1), rg(h - .34, .88, 1), rg(h - .24, 1.15, .86), rg(h - .1, 1.5, 1.05), rg(h, 1.5, 1)], { ur: 2, cap: 'top', capRect: true }); return B.group(); };
  // 階段・石段。+z 側（z = d/2）が下、-z 側が上。rail: 'wood'/'stone'/'iron'/'rope' で両がわに手すり。userData.y(z) → その場所の段の高さ
  F.stairs = (o = {}) => { const w = o.w || 3, h = o.h || 2, d = o.d || 3, n = o.n || Math.max(2, Math.round(h / .22)), tx = asTex(o.tex, c => tex.ashlar(c ? { c } : {})), m = tx.userData.m, B = parts(), G = B.g(tx), dy = h / n, dz = d / n, hw = w / 2;
    for (let i = 0; i < n; i++) { const z = d / 2 - i * dz, y = i * dy, u = [(i * .37) % 1, 0, (i * .37) % 1 + w / m, dy / m]; G.quad([-hw, y, z], [hw, y, z], [hw, y + dy, z], [-hw, y + dy, z], u, .74).quad([-hw, y + dy, z], [hw, y + dy, z], [hw, y + dy, z - dz], [-hw, y + dy, z - dz], [u[0], 0, u[2], dz / m], 1.06);
      if (o.side !== false) G.quad([hw, 0, z], [hw, 0, z - dz], [hw, y + dy, z - dz], [hw, y + dy, z], [z / m, 0, (z - dz) / m, (y + dy) / m], .86).quad([-hw, 0, z - dz], [-hw, 0, z], [-hw, y + dy, z], [-hw, y + dy, z - dz], [z / m, 0, (z - dz) / m, (y + dy) / m], .86); }
    if (o.back !== false) G.quad([hw, 0, -d / 2], [-hw, 0, -d / 2], [-hw, h, -d / 2], [hw, h, -d / 2], [0, 0, w / m, h / m], .8);
    if (o.rail) { const Rl = B.g(tex.rail({ kind: o.rail }), { side: true }).normal([0, .7, .7]), L = Math.round(Math.hypot(d, h)); for (const sx of [-1, 1]) { const x = sx * (hw - .06); Rl.quad([x, dy, d / 2], [x, h, -d / 2], [x, h + .95, -d / 2], [x, dy + .95, d / 2], [0, 0, L, 1]); } }
    const g = B.group(); g.userData = { h, d, n, y: z => cl(Math.ceil((d / 2 - z) / dz), 0, n) * dy }; return g; };
  // バルコニー（かべに付ける。y=0 が床の上、奥（かべ側）が z=0、+z へ張り出す）
  F.balcony = (o = {}) => { const w = o.w || 3, d = o.d || 1.2, tx = asTex(o.tex, c => tex.ashlar({ c: c || '#c8c0b0' })), m = tx.userData.m, B = parts(), G = B.g(tx), Rl = B.g(tex.rail({ kind: o.rail || 'stone' }), { side: true }).normal([0, .7, .7]), hw = w / 2;
    G.box(w, .2, d, 0, -.2, d / 2, { m, bottom: true }); for (const sx of [-1, 1]) G.at(TR(sx * (hw - .3), -.2, 0)).tri([-.12, 0, 0], [-.12, 0, d * .8], [-.12, -.8, 0], [0, 1], [.3, 1], [0, .7], .7).tri([.12, 0, d * .8], [.12, 0, 0], [.12, -.8, 0], [.3, 1], [0, 1], [0, .7], .8).quad([-.12, -.8, 0], [.12, -.8, 0], [.12, 0, d * .8], [-.12, 0, d * .8], [0, 0, .1, .3], .6).at(null);
    Rl.quad([-hw, 0, d - .05], [hw, 0, d - .05], [hw, .95, d - .05], [-hw, .95, d - .05], [0, 0, Math.round(w), 1]); for (const sx of [-1, 1]) Rl.quad([sx * (hw - .05), 0, 0], [sx * (hw - .05), 0, d], [sx * (hw - .05), .95, d], [sx * (hw - .05), .95, 0], [0, 0, Math.max(1, Math.round(d)), 1]); return B.group(); };
  // 鐘（y=0 がつるす所。下へ下がる）。ゆれる
  F.bell = (o = {}) => { const s = o.s || 1, g = new THREE.Group(), G = geo().smooth(1); G.loft(8, [[-.95, .5, .5, 0, .8], [-.86, .44, .44, .2, 1.1], [-.5, .3, .3, .5, 1], [-.22, .22, .22, .8, 1], [-.12, .1, .1, .9, 1.1], [0, .05, .05, 1, 1]], { ur: 3 }).loft(6, [[-1.05, .09, .09, 0, .7], [-.9, .09, .09, 1, .7]], { cap: 'bot' });
    const me = G.mesh(tex.ornate({ c: o.c || '#c8a040' }), { side: true }), hold = new THREE.Group(); me.scale.setScalar(s); hold.add(me); hold.userData.dyn = true; g.add(hold); const ph = live.length; return reg(g, t => { me.rotation.z = Math.sin(t * 2.2 + ph) * .28; }); };
  // 時計塔（四角）。下から 胴 → 文字盤（4 面。針が動く）→ 鐘のへや（アーチの窓）→ とんがり屋根
  F.clockTower = (o = {}) => { const w = o.w || 3.4, h = o.h || 12, st = stoneT(o.stone), m = st.userData.m, B = parts(), G = B.g(st), g = new THREE.Group(), hw = w / 2, bh = w * 1.05, rh = o.roofH || w * 1.35, h1 = h - bh - rh, R1 = hw * 1.414, rg = (y, q, c) => [y, R1 * q, R1 * q, y / m, c], cs = w * .66;
    G.loft(4, [rg(0, 1.1, .74), rg(1, 1, .9), rg(h1 - .5, 1, 1), rg(h1 - .3, 1.1, .82), rg(h1, 1.1, 1)], { ur: Math.round(4 * w / m), cap: 'top', capRect: true });
    const G2 = B.g(st, { side: true }), bw = w - .3, pts = archPts(bw * .5, bh * .78); for (let k = 0; k < 4; k++) { G2.at(TR(0, h1, 0, k * PI / 2)); archFace(G2, bw, bh, pts, bw / 2, m, false, k % 2 ? .86 : 1); archTrim(G2, pts, bw / 2 + .03, .16); } G2.at(null);
    G.tint(.82).box(w + .3, .26, w + .3, 0, h1 + bh - .1, 0, { m }).tint(1); if (o.door !== false) B.g(T.door({ arch: 1 }), { offset: true }).quad([-.55, 0, hw * 1.03 + .05], [.55, 0, hw * 1.03 + .05], [.55, 2.2, hw + .05], [-.55, 2.2, hw + .05]);
    const Cf = B.g(tex.clock(), { offset: true, glow: !!o.lit }), cy = h1 - .7 - cs, hands = []; for (let k = 0; k < 4; k++) Cf.at(TR(0, 0, 0, k * PI / 2)).quad([-cs / 2, cy, hw + .05], [cs / 2, cy, hw + .05], [cs / 2, cy + cs, hw + .05], [-cs / 2, cy + cs, hw + .05]).at(null); g.add(B.group());
    for (let k = 0; k < 4; k++) {
      const hold = new THREE.Group(), it = tex.iron({ rust: 0, c: '#2a2630' }), mk = (len, wd) => geo().box(wd, len, .03, 0, -len * .12, 0, { taper: .5 }).mesh(it), mn = mk(cs * .4, cs * .07), hr = mk(cs * .27, cs * .1); hold.add(mn, hr); hold.rotation.y = k * PI / 2; hold.position.set(Math.sin(k * PI / 2) * (hw + .09), cy + cs / 2, Math.cos(k * PI / 2) * (hw + .09)); hold.userData.dyn = true; g.add(hold); hands.push([mn, hr]); }
    const sp = F.spire({ r: hw * 1.32, h: rh, roof: o.roof, n: 4 }); sp.position.y = h1 + bh + .14; g.add(sp); const bell = F.bell({ s: w * .3 }); bell.position.y = h1 + bh - .2; g.add(bell);
    if (o.flag) { const f = F.flag({ pole: 2.2, ...o.flag }); f.position.y = h1 + bh + rh - .2; g.add(f); }
    const T0 = o.time ?? 10.15; reg(g, t => { const mnA = (T0 % 1) / .6 * PI * 2 + t * (o.speed ?? .1), hrA = T0 / 12 * PI * 2 + t * (o.speed ?? .1) / 12; for (const [a, b] of hands) { a.rotation.z = -mnA; b.rotation.z = -hrA; } }); g.userData.top = h; g.userData.belfry = h1; return g; };
  // 風車。石（か しっくい）の胴に、とんがり屋根、正面に 4 枚の羽根（回る）。speed は回る速さ
  F.windmill = (o = {}) => { const h = o.h || 8, r = o.r || h * .3, st = asTex(o.stone, c => T.plaster({ c: c || '#ece2cc' })), m = st.userData.m, B = parts(), G = B.g(st), g = new THREE.Group(), rt = r * .66, L = o.blade || h * .6, bw = L * .26;
    G.loft(8, [[0, r * 1.06, r * 1.06, 0, .76], [.8, r, r, .8 / m, .92], [h, rt, rt, h / m, 1]], { ur: Math.round(2 * PI * r / m), cap: 'top', capRect: true }); B.g(T.stone()).loft(8, [[0, r * 1.1, r * 1.1, 0, .75], [.7, r * 1.03, r * 1.03, .25, 1]], { ur: 4 });
    B.g(T.door({ arch: 1 }), { offset: true }).quad([-.55, 0, r * .97 + .06], [.55, 0, r * .97 + .06], [.55, 2.2, r * .9 + .06], [-.55, 2.2, r * .9 + .06]); const Wn = B.g(T.window({ shutters: 1 }), { offset: true }); for (const [a, y] of [[0, h * .55], [PI / 2, h * .4], [-PI / 2, h * .62]]) { const q = (r + (rt - r) * (y + .5) / h) * .93 + .05; Wn.at(TR(0, 0, 0, a)).quad([-.45, y, q + .03], [.45, y, q + .03], [.45, y + .9, q - .02], [-.45, y + .9, q - .02]).at(null); }
    B.g(T.planks({ c: '#6a4c34' })).at(TR(0, h + .3, 0, 0, PI / 2)).loft(6, [[-rt * .5, .14, .14, 0, .8], [rt + .75, .11, .11, 1, 1]], { cap: 'top' }).at(null); g.add(B.group());
    const sp = F.spire({ r: rt * 1.3, h: o.roofH || rt * 1.7, roof: asTex(o.roof, c => T.shingle(c ? { c } : {})), n: 8, finial: false }); sp.position.y = h - .02; g.add(sp);
    const hold = new THREE.Group(), rotor = new THREE.Group(), S = geo().normal([0, .2, 1]); for (let k = 0; k < 4; k++) S.at(TR(0, 0, 0, 0, 0, k * PI / 2)).quad([-bw / 2, .15, 0], [bw / 2, .15, 0], [bw / 2, L, 0], [-bw / 2, L, 0], [0, 0, 1, 1]).at(null);
    const sm = S.mesh(tex.millsail({ c: o.c }), { side: true }); rotor.add(sm, geo().box(.3, .3, .2, 0, -.15, -.1, {}).mesh(T.planks({ c: '#6a4c34' }))); hold.add(rotor); hold.position.set(0, h + .3, rt + .7); hold.userData.dyn = true; g.add(hold);
    const sp2 = o.speed ?? .7; reg(g, t => { rotor.rotation.z = -t * sp2; }); g.userData.top = h; g.userData.rotor = rotor; return g; };
  // ドーム屋根。kind: 'onion'（ねぎぼうず）/ 'round'（半球）。r は すその半径。c, c2 は F.tex.dome の色。drum（下の金の帯の高さ）
  F.dome = (o = {}) => { const r = o.r || 3, on = o.kind !== 'round', h = o.h || (on ? r * 1.9 : r), n = o.n || 10, B = parts(), dt = asTex(o.tex, () => tex.dome({ c: o.c, c2: o.c2 })), dr = o.drum ?? r * .16, prof = on ? [[0, .86], [.1, 1.02], [.24, 1.1], [.4, 1], [.58, .68], [.74, .34], [.88, .13], [1, .01]] : [[0, 1], [.3, .95], [.58, .81], [.8, .58], [.94, .3], [1, .01]];
    if (dr) B.g(gold()).loft(n, [[0, r * .9, r * .9, 0, .8], [dr, r * .9, r * .9, 1, 1.05]], { ur: n }); B.g(dt).smooth(1).loft(n, prof.map(([f, q], i) => [dr + h * f, r * q, r * q, f, .82 + .26 * f]), { ur: n });
    if (o.finial !== false) B.g(gold()).loft(5, [[dr + h - .1, .05, .05, .1, .9], [dr + h + r * .12, r * .07, r * .07, .4, 1.1], [dr + h + r * .22, r * .03, r * .03, .6, 1], [dr + h + r * .3, r * .06, r * .06, .7, 1.1], [dr + h + r * .5, .01, .01, .9, 1.1]]);
    const g = B.group(); g.userData = { h: dr + h, r }; return g; };
  // 細い尖塔（砂漠の宮殿ふう）。石の筒＋見はり台（手すり）＋小さなドーム
  F.minaret = (o = {}) => { const h = o.h || 12, r = o.r || 1, st = asTex(o.stone, c => tex.sandstone(c ? { c } : {})), m = st.userData.m, B = parts(), G = B.g(st), g = new THREE.Group(), hb = h * .72, rg = (y, q, c) => [y, r * q, r * q, y / m, c];
    G.loft(8, [rg(0, 1.25, .76), rg(.9, 1.05, .95), rg(hb - .6, .86, 1), rg(hb - .15, 1.35, .82), rg(hb, 1.35, 1.03)], { ur: Math.max(2, Math.round(2 * PI * r / m)), cap: 'top', capRect: true }).loft(8, [rg(hb, .7, .9), rg(h - .2, .66, 1), rg(h, .82, .9)], { ur: 2, cap: 'top', capRect: true });
    B.g(tex.tile({ c: o.c }), {}).loft(8, [[hb * .5, r * .97, r * .97, 0, 1], [hb * .5 + .75, r * .955, r * .955, .5, 1]], { ur: Math.max(4, Math.round(2 * PI * r / 1.5)) }); B.g(tex.rail({ kind: 'stone', c: '#e0c8a0' }), { side: true }).loft(8, [[hb, r * 1.3, r * 1.3, 0, .9], [hb + .7, r * 1.3, r * 1.3, 1, 1]], { ur: 8 });
    B.g(T.window({ h: 48, arch: 1, bars: 'none', glass: '#2a2a3a', frame: '#c8a070' }), { offset: true }).quad([-.3, hb + .9, r * .7 + .03], [.3, hb + .9, r * .7 + .03], [.3, hb + 1.8, r * .69 + .03], [-.3, hb + 1.8, r * .69 + .03]); g.add(B.group());
    const dm = F.dome({ r: r * .86, c: o.c, c2: o.c2, drum: .12 }); dm.position.y = h; g.add(dm); g.userData.top = h + dm.userData.h; return g; };

  // ---- 東方風 ----
  // 反った屋根（寄棟。四すみが はね上がる）。w, d は建物の大きさ、eave は のきの出、h は屋根の高さ、lift は すみの はね上がり
  F.eastRoof = (o = {}) => { const w = o.w || 8, d = o.d || 6, h = o.h || 2.2, ev = o.eave ?? 1.3, lift = o.lift ?? .55, rt = asTex(o.roof, c => tex.kawara(c ? { c } : {})), m = rt.userData.m, B = parts(), G = B.g(rt), rot = d > w, a = (rot ? d : w) / 2 + ev, b = (rot ? w : d) / 2 + ev, nu = 4, nv = 3;
    const Y = (u, v) => h * Math.pow(v, 1.7) + lift * Math.pow(1 - v, 2) * Math.pow(Math.abs(u), 2.6), pt = (s, u, v) => { const A = a - b * v, Bz = b - b * v, y = Y(u, v); return s === 0 ? [u * A, y, Bz] : s === 1 ? [A, y, -u * Bz] : s === 2 ? [-u * A, y, -Bz] : [-A, y, u * Bz]; };
    if (rot) G.at(TR(0, 0, 0, PI / 2)); for (let s = 0; s < 4; s++) { const len = s % 2 ? b : a, sl = Math.hypot(b, h); G.smooth(s + 1); for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const u0 = -1 + 2 * i / nu, u1 = -1 + 2 * (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv, r0 = 1 - (s % 2 ? 1 : b / a) * 0, U = (u, v) => u * (len - (s % 2 ? b : b) * v * (s % 2 ? 1 : 1)) / m;
        const p0 = pt(s, u0, v0), p1 = pt(s, u1, v0), p2 = pt(s, u1, v1), p3 = pt(s, u0, v1), sh = s % 2 ? .86 : 1; G.tri(p0, p1, p2, [U(u0, v0), v0 * sl / m], [U(u1, v0), v0 * sl / m], [U(u1, v1), v1 * sl / m], [sh * (.86 + .2 * v0), sh * (.86 + .2 * v0), sh * (.86 + .2 * v1)]).tri(p0, p2, p3, [U(u0, v0), v0 * sl / m], [U(u1, v1), v1 * sl / m], [U(u0, v1), v1 * sl / m], [sh * (.86 + .2 * v0), sh * (.86 + .2 * v1), sh * (.86 + .2 * v1)]); } }
    G.smooth(0).tint(.6).box(2 * (a - b) + .7, .3, .34, 0, h - .08, 0, { m }).tint(1); const Gd = B.g(gold()); for (const sx of [-1, 1]) Gd.at(TR(sx * (a - b + .35), h + .1, 0, sx > 0 ? 0 : PI)).tri([0, 0, .1], [0, 0, -.1], [.3, .55, 0], [0, 0], [1, 0], [.5, 1]).tri([0, 0, -.1], [0, 0, .1], [.3, .55, 0], [0, 0], [1, 0], [.5, 1]).at(null);
    const Wd = B.g(tex.lacquer({ c: o.under || '#7a3a2c' })); if (rot) Wd.at(TR(0, 0, 0, PI / 2)); Wd.quad([-a, .02, -b], [a, .02, -b], [a, .02, b], [-a, .02, b], [0, 0, a, b], .6).at(null); G.at(null);
    const g = B.group(); g.userData = { h, a, b }; return g; };
  // 反った屋根のお堂。石の台＋赤い柱＋白かべ＋反った屋根。tiers: 2 で二重の屋根。c（柱の色）, roof, lit
  F.eastHall = (o = {}) => { const w = o.w || 8, d = o.d || 6, h = o.h || 3.4, tiers = o.tiers || 1, bh = o.base ?? .6, B = parts(), g = new THREE.Group(), St = B.g(tex.ashlar({ c: '#b4aea2' })), wl = tex.shiro({ c: o.wall }), Lq = B.g(tex.lacquer({ c: o.c })), col = tex.lacquer({ band: true, c: o.c }), Cl = B.g(col), rh = o.roofH || 2.2;
    St.box(w + 2, bh, d + 2, 0, 0, 0, { m: 3, c0: .78 }); const story = (W, D, y0, H, door) => { const hw = W / 2 - .3, hd = D / 2 - .3, Wg = B.g(wl); for (const [s, L] of [['f', hw], ['r', hd], ['b', hw], ['l', hd]]) { const [rx, rz, nx, nz] = { f: [1, 0, 0, 1], r: [0, -1, 1, 0], b: [-1, 0, 0, -1], l: [0, 1, -1, 0] }[s], off = s === 'f' || s === 'b' ? hd : hw, P4 = (q, y) => [rx * q + nx * off, y, rz * q + nz * off]; Wg.quad(P4(-L, y0), P4(L, y0), P4(L, y0 + H), P4(-L, y0 + H), [0, 0, Math.max(1, Math.round(L / 1.5)), 1], s === 'f' ? 1 : .88); }
      const nx = Math.max(2, Math.round(W / 2.6)) ; for (let i = 0; i <= nx; i++) for (const z of [1, -1]) { const x = -W / 2 + W * i / nx; Cl.at(TR(x, y0, z * D / 2)).loft(8, [[0, .17, .17, 0, .85], [H, .15, .15, 1, 1]], { ur: 2 }).at(null); } Lq.box(W + .3, .26, D + .3, 0, y0 + H - .2, 0, { m: 1 });
      if (door) { B.g(T.door({ style: 'panel', c: '#7a3a2a', frame: '#3a2a26' }), { offset: true }).quad([-.7, y0, hd + .05], [.7, y0, hd + .05], [.7, y0 + 2.4, hd + .05], [-.7, y0 + 2.4, hd + .05]); const wt = T.window({ bars: 'grid', curtain: false, lit: o.lit ? 1 : 0, frame: '#4a3830', glass: '#e8e0c8' }), Wn = B.g(wt, { offset: true, glow: !!o.lit }); for (const sx of [-1, 1]) if (hw > 2.2) Wn.quad([sx * hw * .58 - .5, y0 + 1.1, hd + .05], [sx * hw * .58 + .5, y0 + 1.1, hd + .05], [sx * hw * .58 + .5, y0 + 2.1, hd + .05], [sx * hw * .58 - .5, y0 + 2.1, hd + .05]); } };
    story(w, d, bh, h, true); g.add(B.group()); const st = F.stairs({ w: 2.2, h: bh, d: 1, n: 3, tex: tex.ashlar({ c: '#b4aea2' }) }); st.position.z = d / 2 + 1.5; g.add(st);
    const r1 = F.eastRoof({ w, d, h: rh, eave: o.eave ?? 1.4, roof: o.roof }); r1.position.y = bh + h; g.add(r1); let top = bh + h + rh;
    if (tiers > 1) { const B2 = parts(), y2 = bh + h + rh * .5, h2 = h * .55, w2 = w * .58, d2 = d * .58; B2.g(wl).box(w2 - .6, h2, d2 - .6, 0, y2, 0, { uv: [0, 0, 2, 1] }); B2.g(tex.lacquer({ c: o.c })).box(w2 - .3, .24, d2 - .3, 0, y2 + h2 - .2, 0, { m: 1 }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B2.g(col).at(TR(sx * (w2 / 2 - .3), y2, sz * (d2 / 2 - .3))).loft(8, [[0, .14, .14, 0, .85], [h2, .13, .13, 1, 1]], { ur: 2 }).at(null); g.add(B2.group()); const r2 = F.eastRoof({ w: w2, d: d2, h: rh * .9, eave: (o.eave ?? 1.4) * .85, roof: o.roof }); r2.position.y = y2 + h2; g.add(r2); top = y2 + h2 + rh * .9; }
    g.userData = { top, base: bh }; return g; };
  // 鳥居のような門。w（柱のあいだ）, h, c
  F.torii = (o = {}) => { const w = o.w || 4, h = o.h || 4.6, B = parts(), Lq = B.g(tex.lacquer({ c: o.c })), Cl = B.g(tex.lacquer({ band: true, c: o.c })), Dk = B.g(T.planks({ c: '#3a3238' })), r = h * .045;
    for (const sx of [-1, 1]) Cl.at(TR(sx * w / 2, 0, 0, 0, 0, sx * .035)).loft(8, [[0, r * 1.15, r * 1.15, 0, .82], [h * .98, r, r, 1, 1]], { ur: 2 }).at(null); Lq.box(w + r * 5, r * 1.3, r * 1.3, 0, h * .76, 0, { m: 1 }); Lq.box(r * 1.6, h * .15, r * .8, 0, h * .79, 0, { m: 1 });
    for (const sx of [-1, 1]) { Lq.at(TR(0, h * .93, 0, 0, 0, sx * .07)).box(w * .5 + r * 6, r * 1.5, r * 1.9, sx * (w * .25 + r * 3), 0, 0, { m: 1 }).at(null); Dk.at(TR(0, h * .93 + r * 1.5, 0, 0, 0, sx * .07)).box(w * .5 + r * 7.4, r * .9, r * 2.6, sx * (w * .25 + r * 3.7), 0, 0, { m: 1.5 }).at(null); }
    const g = B.group(); g.userData = { w, h }; return g; };
  // 石灯ろう。lit で火ぶくろが光る。light: true で小さなあかり
  F.stoneLantern = (o = {}) => { const h = o.h || 1.7, k = h / 1.7, B = parts(), st = asTex(o.stone, c => T.stone({ c: c || '#a8a69c', moss: .3 })), G = B.g(st), rg = (y, r, c, v) => [y * k, r * k, r * k, v ?? y, c];
    G.loft(6, [rg(0, .36, .75), rg(.14, .34, 1), rg(.2, .16, .85), rg(.86, .13, 1), rg(.92, .3, .85), rg(1.0, .32, 1.05)], { ur: 2, cap: 'top', capRect: true }).loft(4, [rg(1.3, .46, .7, 0), rg(1.42, .22, 1, .3), rg(1.52, .06, 1.05, .5)], { ur: 2 }).loft(4, [rg(1.3, .46, .6, 0)], { cap: 'bot' }).loft(6, [rg(1.5, .05, .9, 0), rg(1.6, .09, 1, .1), rg(1.7, .02, 1.1, .2)], {});
    B.g(o.lit ? T.lamp() : T.window({ bars: 'cross', curtain: false, glass: '#3a3a44', frame: '#8a887e' }), { glow: !!o.lit }).loft(4, [[1.0 * k, .24 * k, .24 * k, 0, 1], [1.3 * k, .24 * k, .24 * k, 1, 1]], { ur: 4 });
    const g = B.group(); if (o.light) { const L = new THREE.PointLight('#ffc070', o.power || 8, o.range || 6, 1.6); L.position.y = 1.15 * k; g.add(L); } return g; };

  // ================= 5. 木の上・運河・桟橋 =================
  // 木の上の小屋。太い幹のまわりに 八角の床（高さ h）、なわの手すり、丸い小屋と わらの とんがり屋根、上に葉。userData.deck = 床の高さ、userData.r = 床の半径
  F.treeHouse = (o = {}) => { const h = o.h || 6, r = o.r || 2.2, tr = o.trunk || 1, B = parts(), g = new THREE.Group(), Bk = B.g(T.bark()), Pl = B.g(T.planks({ c: '#9a7448' })), hr = r * .6, hh = 2.1;
    Bk.loft(8, [[0, tr * 1.5, tr * 1.5, 0, .7], [1.2, tr * 1.05, tr * 1.05, .5, .9], [h, tr * .9, tr * .9, h / 2.4, 1], [h + hh + 2.6, tr * .6, tr * .6, (h + hh + 2.6) / 2.4, 1]], { ur: 3 });
    Pl.loft(8, [[h - .22, r, r, 0, .7], [h, r, r, .1, 1]], { ur: 8, cap: 'top', capRect: true }).loft(8, [[h - .22, r, r, 0, .5]], { cap: 'bot', capRect: true }); for (let k = 0; k < 4; k++) Pl.at(TR(0, h - .22, 0, k * PI / 2 + .4, 0, 0)).tri([.1, 0, r * .85], [.1, 0, tr * .8], [.1, -1.5, tr * .9], [0, 0], [1, 0], [1, .5], .6).tri([-.1, 0, tr * .8], [-.1, 0, r * .85], [-.1, -1.5, tr * .9], [1, 0], [0, 0], [1, .5], .7).at(null);
    B.g(tex.rail({ kind: 'rope' }), { side: true }).loft(8, [[h, r * .97, r * .97, 0, .9], [h + .95, r * .97, r * .97, 1, 1]], { ur: 8, seg: [0, 3] }).loft(8, [[h, r * .97, r * .97, 0, .9], [h + .95, r * .97, r * .97, 1, 1]], { ur: 8, seg: [5, 8] });
    B.g(T.boards({ c: o.c || '#a8845a' })).loft(8, [[h, hr, hr, 0, .85], [h + hh, hr, hr, hh / 3, 1]], { ur: 3 }); B.g(T.door({ arch: 1 }), { offset: true }).quad([-.42, h, hr * .93 + .04], [.42, h, hr * .93 + .04], [.42, h + 1.7, hr * .93 + .04], [-.42, h + 1.7, hr * .93 + .04]);
    const wt = T.window({ lit: o.lit ? 1 : 0, bars: 'cross' }), Wn = B.g(wt, { offset: true, glow: !!o.lit }); for (const a of [PI / 2, -PI / 2]) Wn.at(TR(0, 0, 0, a)).quad([-.35, h + .8, hr * .93 + .04], [.35, h + .8, hr * .93 + .04], [.35, h + 1.5, hr * .93 + .04], [-.35, h + 1.5, hr * .93 + .04]).at(null); g.add(B.group());
    const sp = F.spire({ r: hr * 1.45, h: 1.9, roof: asTex(o.roof, c => T.thatch(c ? { c } : {})), finial: false }); sp.position.y = h + hh; g.add(sp); if (o.leaves !== false) { const lf = R.tree({ h: 6, seed: o.seed || 0, c: o.leaf }); lf.position.y = h + hh + .2; g.add(lf); }
    g.userData = { deck: h, r }; return g; };
  // つり橋（世界の座標の 2 点をわたす）。userData.at(k) → [x, y, z]（k = 0〜1。橋の上の位置）
  F.ropeBridge = (o = {}) => { const a = o.from || [-5, 5, 0], b = o.to || [5, 5, 0], w = o.w || 1.2, sag = o.sag ?? .6, dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1, n = Math.max(3, Math.round(L / 1)), px = -dz / L * w / 2, pz = dx / L * w / 2, at = k => [a[0] + dx * k, a[1] + (b[1] - a[1]) * k - sag * 4 * k * (1 - k), a[2] + dz * k], B = parts(), Pl = B.g(T.planks({ c: '#9a7448', w: 8 }), { side: true }), Rl = B.g(tex.rail({ kind: 'rope' }), { side: true }).normal([0, 1, 0]);
    for (let i = 0; i < n; i++) { const p = at(i / n), q = at((i + 1) / n); Pl.quad([p[0] + px, p[1], p[2] + pz], [p[0] - px, p[1], p[2] - pz], [q[0] - px, q[1], q[2] - pz], [q[0] + px, q[1], q[2] + pz], [0, i * .5, w / 1.5, i * .5 + .5]); for (const s of [-1, 1]) Rl.quad([p[0] + px * s, p[1], p[2] + pz * s], [q[0] + px * s, q[1], q[2] + pz * s], [q[0] + px * s, q[1] + .95, q[2] + pz * s], [p[0] + px * s, p[1] + .95, p[2] + pz * s]); }
    const g = B.group(); g.userData = { at, len: L }; return g; };
  // はしご（かべや幹に立てかける。少し手前にかたむく）。kind: 'wood' / 'rope'
  F.ladder = (o = {}) => { const h = o.h || 4, w = o.w || .6, me = geo().normal([0, .3, 1]).quad([-w / 2, 0, h * .12], [w / 2, 0, h * .12], [w / 2, h, 0], [-w / 2, h, 0], [0, 0, 1, Math.round(h * 1.6)]).mesh(tex.rope({ kind: 'ladder', c: o.kind === 'rope' ? undefined : '#8a6040' }), { side: true }); return me; };
  // 運河（z 方向にのびる）。岸の石がき 2 本（上の面は y=0。はば 1.2 m）＋水（y = -depth * .45）。地面は R.ground の H で、運河の所（|x| < w/2 + .6）を -depth より下げておく
  F.canal = (o = {}) => { const len = o.len || 30, w = o.w || 6, dp = o.depth || 1.2, st = stoneT(o.stone), m = st.userData.m, G = geo(), g = new THREE.Group(), wf = T.water({ c: o.water || '#3f9ab0' });
    for (const sx of [-1, 1]) { G.box(1.2, dp + .6, len, sx * (w / 2 + .6), -dp - .6, 0, { m, c0: .6 }); G.tint(1.08).box(.5, .14, len, sx * (w / 2 + .2), 0, 0, { m }).tint(1); } g.add(G.mesh(st));
    const base = R.mat(wf[0], { vc: true, smooth: true }), wm = base.clone(); wm.onBeforeCompile = base.onBeforeCompile; const W = geo().normal([0, 1, 0]), nz = Math.ceil(len / 3), y = -dp * .45; for (let i = 0; i < nz; i++) { const z0 = -len / 2 + len * i / nz, z1 = z0 + len / nz; W.quad([-w / 2, y, z1], [w / 2, y, z1], [w / 2, y, z0], [-w / 2, y, z0], [0, z1 / 3, w / 3, z0 / 3]); }
    const wme = new THREE.Mesh(W.build(), wm); wme.userData.dyn = true; wme.receiveShadow = true; g.add(wme); g.userData.water = y; return reg(g, t => R.flip(wm, wf, t, 4)); };
  // 小さな太鼓橋（x 方向にわたす。下を舟がくぐる）。上は平らで、両がわに石段と手すり。userData.h = 橋の上の高さ
  F.bridge = (o = {}) => { const span = o.span || 7, w = o.w || 2.6, rise = o.rise || 1.6, st = stoneT(o.stone), m = st.userData.m, B = parts(), G = B.g(st), g = new THREE.Group(), H = rise + .4, W = span + 1.6, hd = w / 2, a = span / 2, rho = (a * a + rise * rise) / (2 * rise), th0 = Math.asin(Math.min(1, a / rho)), pts = [[-a, -1.2], [-a, 0]];
    for (let i = 1; i <= 5; i++) { const q = th0 * (1 - i / 5); pts.push([-rho * Math.sin(q), rise - rho + rho * Math.cos(q)]); } for (let i = 5; i >= 0; i--) pts.push([-pts[i + 1][0], pts[i + 1][1]]); pts.push([a, -1.2]);
    const face = (z, back) => { const V = ([x, y]) => [back ? -x : x, y, z]; for (let i = 1; i < pts.length - 2; i++) { const p = pts[i], q = pts[i + 1]; G.quad(V(p), V(q), V([q[0], H]), V([p[0], H]), [p[0] / m, p[1] / m, q[0] / m, H / m], back ? .84 : 1); } for (const sx of [-1, 1]) { const x0 = sx * a, x1 = sx * W / 2, l = Math.min(x0, x1), r2 = Math.max(x0, x1); G.quad(V([l, -1.2]), V([r2, -1.2]), V([r2, H]), V([l, H]), [l / m, 0, r2 / m, (H + 1.2) / m], back ? .84 : 1); } };
    face(hd, false); face(-hd, true); archTunnel(G, pts, hd, -hd, m, .6); G.quad([-W / 2, H, hd], [W / 2, H, hd], [W / 2, H, -hd], [-W / 2, H, -hd], [0, 0, W / m, w / m], 1.05);
    const Rl = B.g(tex.rail({ kind: o.rail || 'stone' }), { side: true }).normal([0, .7, .7]); for (const s of [-1, 1]) Rl.quad([-W / 2, H, s * (hd - .05)], [W / 2, H, s * (hd - .05)], [W / 2, H + .9, s * (hd - .05)], [-W / 2, H + .9, s * (hd - .05)], [0, 0, Math.round(W), 1]); g.add(B.group());
    for (const sx of [-1, 1]) { const s = F.stairs({ w, h: H, d: H * 1.7, tex: st, rail: o.rail || 'stone', back: false }); s.rotation.y = -sx * PI / 2; s.position.x = sx * (W / 2 + H * .85); g.add(s); } g.userData = { h: H, len: W + H * 3.4 }; return g; };
  // 桟橋・足場（z 方向にのびる。上の面は y = h）。木のくいと すじかい、鉄の帯。rail: 'rope' などで両がわに手すり。userData.deck = h
  F.pier = (o = {}) => { const len = o.len || 12, w = o.w || 4, h = o.h || 3, B = parts(), Pl = B.g(T.planks({ c: o.c || '#9a7448', w: 8 })), Wd = B.g(T.planks({ c: '#6a4c34' })), It = B.g(tex.iron({ rust: .4 })), nz = Math.max(1, Math.round(len / 3)), hw = w / 2;
    for (let i = 0; i < nz; i++) { const z0 = -len / 2 + len * i / nz, z1 = z0 + len / nz; Pl.quad([-hw, h, z1], [hw, h, z1], [hw, h, z0], [-hw, h, z0], [z1 / 2, 0, z0 / 2, w / 2], i % 2 ? 1 : 1.06); Pl.quad([hw, h - .18, z1], [hw, h - .18, z0], [hw, h, z0], [hw, h, z1], [0, 0, 1.5, .1], .7).quad([-hw, h - .18, z0], [-hw, h - .18, z1], [-hw, h, z1], [-hw, h, z0], [0, 0, 1.5, .1], .7); }
    Pl.quad([-hw, h - .18, len / 2], [hw, h - .18, len / 2], [hw, h, len / 2], [-hw, h, len / 2], [0, 0, 1.5, .1], .75).quad([hw, h - .18, -len / 2], [-hw, h - .18, -len / 2], [-hw, h, -len / 2], [hw, h, -len / 2], [0, 0, 1.5, .1], .75).quad([-hw, h - .18, -len / 2], [hw, h - .18, -len / 2], [hw, h - .18, len / 2], [-hw, h - .18, len / 2], [0, 0, 2, len / 2], .45);
    for (let i = 0; i <= nz; i++) { const z = -len / 2 + len * i / nz; for (const sx of [-1, 1]) { Wd.at(TR(sx * (hw - .2), 0, z)).loft(6, [[-(o.drop || 0), .16, .16, 0, .7], [h + (o.rail ? 1 : .25), .13, .13, (h + 1) / 1.5, 1]], { cap: 'top' }).at(null); It.at(TR(sx * (hw - .2), 0, z)).loft(6, [[h - .5, .17, .17, 0, .9], [h - .3, .17, .17, .3, 1]], { ur: 2 }).at(null); }
      Wd.box(w - .3, .16, .16, 0, h - .36, z, { m: 1.5 }); if (h > 1.6) for (const s of [-1, 1]) Wd.at(TR(0, h * .5, z, 0, 0, s * Math.atan2(h * .6, w - .6))).box(Math.hypot(w - .6, h * .6), .1, .1, 0, 0, s * .06, { m: 1.5 }).at(null); }
    if (o.rail) { const Rl = B.g(tex.rail({ kind: o.rail }), { side: true }).normal([0, .7, .7]); for (const sx of [-1, 1]) Rl.quad([sx * (hw - .2), h, -len / 2], [sx * (hw - .2), h, len / 2], [sx * (hw - .2), h + .95, len / 2], [sx * (hw - .2), h + .95, -len / 2], [0, 0, nz * 2, 1]); }
    const g = B.group(); g.userData = { deck: h, len, w }; return g; };
  // 風見（さお＋東西南北の うで＋矢。矢がゆっくりふれる）
  F.vane = (o = {}) => { const h = o.h || 2.2, B = parts(), It = B.g(tex.iron({ rust: 0, c: '#3a3c48' })), g = new THREE.Group(); It.loft(5, [[0, .05, .05, 0, .8], [h, .03, .03, 2, 1]]); It.box(.9, .03, .03, 0, h * .72, 0, {}).box(.03, .03, .9, 0, h * .72, 0, {}); g.add(B.group());
    const A = geo(), y = 0; A.box(1.1, .04, .04, 0, -.02, 0, {}).normal([0, .3, 1]).tri([.5, -.16, 0], [.85, 0, 0], [.5, .16, 0], [0, 0], [1, .5], [0, 1]).quad([-.75, -.2, 0], [-.4, -.06, 0], [-.4, .06, 0], [-.75, .2, 0]); const am = A.mesh(gold(), { side: true }), hold = new THREE.Group(); hold.add(am); hold.position.y = h * .9; hold.userData.dyn = true; g.add(hold); const ph = live.length;
    return reg(g, t => { am.rotation.y = (o.dir || 0) + Math.sin(t * .7 + ph) * .35 + Math.sin(t * 2.3 + ph) * .08; }); };

  // ================= 6. 乗りもの =================
  // 船体（断面の列をつなぐ）。st = [[z, はばの半分, 深さ, ふちの高さ], …]（うしろ → 前）。trim でふちの帯、deck で甲板（ふちからの下がり）
  const hull = (G, Gt, Gd, st, o = {}) => { const m = o.m || 3, sec = ([z, hw, dp, yt]) => [[-hw, yt, z], [-hw * .8, yt - dp * .62, z], [0, yt - dp, z], [hw * .8, yt - dp * .62, z], [hw, yt, z]], dk = o.deck ?? .4;
    for (let i = 0; i < st.length - 1; i++) { const a = sec(st[i]), b = sec(st[i + 1]), u0 = st[i][0] / m, u1 = st[i + 1][0] / m; for (let k = 0; k < 4; k++) { const v0 = k * .22, v1 = v0 + .22, side = k === 0 || k === 3; G.quad(a[k], a[k + 1], b[k + 1], b[k], [u0, v0, u1, v1], side ? (k ? .82 : 1) : .62); if (o.inner) G.quad(a[k + 1], a[k], b[k], b[k + 1], [u0, v0 + .5, u1, v1 + .5], side ? .7 : .55); }
      if (Gt) for (const s of [0, 4]) { const p = a[s], q = b[s], e = s ? .03 : -.03, tw = o.trimW || .26, U = [u0 * 3, 0, u1 * 3, 1]; if (s) Gt.quad([q[0] + e, q[1] - tw, q[2]], [p[0] + e, p[1] - tw, p[2]], [p[0] + e, p[1] + .04, p[2]], [q[0] + e, q[1] + .04, q[2]], U); else Gt.quad([p[0] + e, p[1] - tw, p[2]], [q[0] + e, q[1] - tw, q[2]], [q[0] + e, q[1] + .04, q[2]], [p[0] + e, p[1] + .04, p[2]], U); }
      if (Gd) { const ha = st[i][1] * .93, hb = st[i + 1][1] * .93, ya = o.deckY ?? st[i][3] - dk, yb = o.deckY ?? st[i + 1][3] - dk, za = st[i][0], zb = st[i + 1][0]; Gd.quad([-hb, yb, zb], [hb, yb, zb], [ha, ya, za], [-ha, ya, za], [0, zb / 2, 1.5, za / 2], 1.04); } }
    const a = sec(st[0]); G.tri(a[0], a[2], a[1], [0, .9], [.5, 0], [.2, .3], .8).tri(a[0], a[4], a[2], [0, .9], [1, .9], [.5, 0], .8).tri(a[2], a[4], a[3], [.5, 0], [1, .9], [.8, .3], .8); };
  // 回る羽根（プロペラ）。n 枚、長さ r。回るじくは z
  const rotor = (n, r, t) => { const G = geo().normal([0, .3, 1]); for (let k = 0; k < n; k++) G.at(TR(0, 0, 0, 0, 0, k * PI * 2 / n)).quad([-r * .1, 0, 0], [r * .1, 0, 0], [r * .2, r, .04], [-r * .2, r, -.04], [0, 0, .4, r / 1.5]).at(null); G.box(r * .2, r * .2, r * .2, 0, -r * .1, 0, {}); return G.mesh(t, { side: true }); };
  // 飛空艇。気のう（c、帯 c2）の下に、なわで つった木の船体（hull）。左右とうしろにプロペラ、かじの帆、船室、旗。前は +z。y=0 が船底、userData.deck が甲板の高さ
  //   全体が動く（ゆっくり上下・プロペラ）ので R.merge に入れず、そのまま scene.add する。bob: 0 でゆれを止める
  F.airship = (o = {}) => { const s = o.s || 1, g = new THREE.Group(), body = new THREE.Group(), B = parts(), bt = tex.balloon({ c: o.c, c2: o.c2 }), wd = T.planks({ c: o.hull || '#8f623c' }), G = B.g(wd), Gd = B.g(T.planks({ c: '#b89464', w: 8 })), Gt = B.g(tex.ornate({ c: o.trim, gem: o.c2 })), It = B.g(tex.iron({ rust: .2 })), Rp = B.g(tex.rope(), { side: true }), ey = 6.4, er = 2.3;
    const st = [[-3.6, .9, .9, 2.0], [-2.6, 1.25, 1.3, 1.75], [-.5, 1.4, 1.5, 1.6], [1.8, 1.3, 1.45, 1.62], [3.2, .8, 1.2, 1.85], [4.3, .03, .7, 2.3]]; hull(G, Gt, Gd, st, { inner: true, deck: .45 });
    B.g(bt).smooth(1).at(TR(0, ey, 0, 0, PI / 2)).loft(10, [[-6, .05, .05, 0, .8], [-5.2, er * .5, er * .5, .08, .86], [-3.4, er * .9, er * .9, .24, .95], [-.5, er, er, .5, 1], [2.6, er * .92, er * .92, .74, 1], [4.8, er * .58, er * .58, .92, 1.02], [6, .05, .05, 1, 1.05]], { ur: 10 }).at(null).smooth(0);
    It.at(TR(0, ey - er * .96, 0, 0, PI / 2)).loft(6, [[-3.4, .12, .12, 0, .8], [3.4, .12, .12, 4, 1]], {}).at(null);
    for (const z of [-2.6, -.5, 1.8, 3.2]) for (const sx of [-1, 1]) { const i = st.findIndex(q => q[0] === z), a = [sx * st[i][1], st[i][3], z], b = [sx * er * .78, ey - er * .6, z * .9]; Rp.quad([a[0], a[1], a[2] - .04], [a[0], a[1], a[2] + .04], [b[0], b[1], b[2] + .04], [b[0], b[1], b[2] - .04], [0, 0, 1, 6]).quad([a[0] - .04, a[1], a[2]], [a[0] + .04, a[1], a[2]], [b[0] + .04, b[1], b[2]], [b[0] - .04, b[1], b[2]], [0, 0, 1, 6]); }
    const Bd = B.g(T.boards({ c: o.cabin || '#a87c50' })); Bd.box(1.7, 1.25, 1.7, 0, 1.25, -2.3, { m: 2, c0: .82 }); B.g(T.shingle({ c: o.c2 || '#b8503c' })).box(2, .14, 2, 0, 2.5, -2.3, { m: 2 }).box(1.3, .14, 1.4, 0, 2.64, -2.3, { m: 2 }); const Wn = B.g(T.window({ lit: 1, bars: 'cross', frame: '#5a4030' }), { offset: true, glow: true }); Wn.quad([-.3, 1.65, -1.43], [.3, 1.65, -1.43], [.3, 2.25, -1.43], [-.3, 2.25, -1.43]); for (const sx of [-1, 1]) Wn.quad([sx * .87, 1.65, -2.3 + sx * .3], [sx * .87, 1.65, -2.3 - sx * .3], [sx * .87, 2.25, -2.3 - sx * .3], [sx * .87, 2.25, -2.3 + sx * .3]);
    const Fb = B.g(tex.sail({ c: o.fin || '#e8d8b4', c2: o.c2 || '#c8503c' }), { side: true }).normal([.5, .5, .5]); Fb.tri([0, ey + er * .3, -3.6], [0, ey + er * 1.5, -6.3], [0, ey, -6], [0, 0], [1, 1], [1, 0]).tri([0, ey - er * .3, -3.8], [0, ey, -6], [0, ey - er * 1.2, -6.1], [0, 1], [1, 1], [1, 0]); for (const sx of [-1, 1]) Fb.tri([sx * er * .5, ey, -3.8], [sx * er * 1.5, ey, -6.2], [0, ey, -6], [0, 0], [1, 1], [1, 0]); Fb.quad([0, .9, -3.7], [0, .7, -4.9], [0, 2.3, -4.9], [0, 2.2, -3.7], [0, 0, .5, .5]);
    for (const sx of [-1, 1]) { It.at(TR(sx * 2.05, 1.5, -1.2, 0, PI / 2)).loft(6, [[-.7, .1, .1, 0, .8], [-.4, .3, .3, .2, 1], [.5, .26, .26, .7, 1], [.8, .08, .08, 1, .9]], { ur: 2 }).at(null); G.box(.9, .1, .3, sx * 1.6, 1.45, -1.2, { m: 1.5 }); }
    G.at(TR(0, 2.1, 4.2, 0, -1.1)).loft(5, [[0, .07, .07, 0, .8], [1.4, .04, .04, 1, 1]], { cap: 'top' }).at(null); B.g(gold()).loft(6, [[2.3, .1, .1, 0, .9, 0, 4.25], [2.5, .2, .2, .5, 1.1, 0, 4.3], [2.7, .05, .05, 1, 1, 0, 4.3]], {}); body.add(B.group());
    const pt = T.planks({ c: '#c8a878' }), rots = [[2.05, 1.5, -2.1, .75], [-2.05, 1.5, -2.1, .75], [0, 1.3, -4.95, .6]].map(([x, y, z, r]) => { const hd = new THREE.Group(), rm = rotor(3, r, pt); hd.position.set(x, y, z); hd.add(rm); body.add(hd); return rm; });
    const fl = F.flag({ kind: 'pennant', pole: 1.6, c: o.c2 || '#c8503c', crest: 'none', w: 1.6, h: .4 }); fl.position.set(0, ey + er * .95, -3); fl.rotation.y = PI / 2; body.add(fl);
    body.scale.setScalar(s); g.add(body); g.userData.dyn = true; g.userData.deck = 1.15 * s; g.userData.len = 12 * s; const bob = o.bob ?? 1, ph = live.length;
    return reg(g, t => { body.position.y = Math.sin(t * .8 + ph) * .1 * bob; body.rotation.z = Math.sin(t * .55 + ph) * .012 * bob; rots.forEach((r, i) => { r.rotation.z = t * (o.spin ?? 9) * (i === 1 ? -1 : 1); }); }); };
  // 帆船（マスト 2 本、船尾のやぐら、四角い帆）。c（船体）, c2（帯と旗）, sail（帆の色）, sail2（たてじま）, crest（帆の紋）。前は +z、水面は y=0。全体がゆっくりゆれるので R.merge に入れない
  F.ship = (o = {}) => { const s = o.s || 1, g = new THREE.Group(), body = new THREE.Group(), B = parts(), wd = T.planks({ c: o.c || '#7a5236' }), G = B.g(wd), Gd = B.g(T.planks({ c: '#b89464', w: 8 })), Gt = B.g(tex.ornate({ c: o.trim, gem: o.c2 })), Ms = B.g(T.planks({ c: '#6a4c34' })), Sl = B.g(tex.sail({ c: o.sail, c2: o.sail2, crest: o.crest, cc: o.cc || o.c2 }), { side: true }), Rp = B.g(tex.rope(), { side: true });
    const st = [[-5.6, 1.5, 1.7, 3.3], [-4, 1.9, 2.3, 2.9], [-2.6, 2, 2.5, 2.1], [-.5, 2.05, 2.5, 1.9], [2.6, 1.85, 2.3, 1.95], [4.8, 1.05, 1.9, 2.4], [6.3, .03, 1.2, 3.1]]; hull(G, Gt, Gd, st, { deckY: 1.5, trimW: .34 });
    const Bd = B.g(T.boards({ c: o.cabin || '#9a6c44' })); Bd.box(3.3, 1.5, 2.9, 0, 1.5, -4.1, { m: 3, c0: .82, taper: [.94, 1] }); Gd.quad([-1.6, 3.02, -2.65], [1.6, 3.02, -2.65], [1.5, 3.02, -5.55], [-1.5, 3.02, -5.55], [0, 0, 1.5, 1.5]); B.g(tex.rail({ kind: 'wood' }), { side: true }).normal([0, .7, .7]).quad([-1.6, 3, -2.65], [1.6, 3, -2.65], [1.6, 3.8, -2.65], [-1.6, 3.8, -2.65], [0, 0, 3, 1]);
    const Wn = B.g(T.window({ lit: 1, bars: 'grid', frame: '#5a4030' }), { offset: true, glow: true }); for (const x of [-.8, .8]) { Wn.quad([x + .32, 1.95, -5.58], [x - .32, 1.95, -5.58], [x - .32, 2.6, -5.6], [x + .32, 2.6, -5.6]); Wn.quad([x - .3, 1.9, -2.63], [x + .3, 1.9, -2.63], [x + .3, 2.5, -2.63], [x - .3, 2.5, -2.63]); }
    const mast = (z, h, sails) => { Ms.at(TR(0, 1.4, z)).loft(6, [[0, .17, .17, 0, .8], [h, .09, .09, h / 1.5, 1]], { cap: 'top' }).at(null); for (const [y, w, hh] of sails) { Ms.at(TR(0, y + hh, z + .12, 0, 0, PI / 2)).loft(5, [[-w / 2 - .2, .06, .06, 0, .9], [w / 2 + .2, .06, .06, 2, 1]], {}).at(null); const bz = .12 + w * .16, P4 = (u, v) => [u * w / 2 * (1 - .06 * (1 - v)), y + hh * v, z + .14 + bz * (1 - u * u) * (1 - (2 * v - 1) ** 2 * .7)]; Sl.smooth(z * 10 + y); for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { const u0 = -1 + i / 2, u1 = u0 + .5, v0 = j / 2, v1 = v0 + .5; Sl.quad(P4(u0, v0), P4(u1, v0), P4(u1, v1), P4(u0, v1), [(u0 + 1) / 2, v0, (u1 + 1) / 2, v1], .9 + .1 * v0); } Sl.smooth(0); } };
    mast(-.6, 9.4, [[2.8, 4.2, 3.3], [6.5, 3.2, 2.3]]); mast(3, 7.6, [[2.8, 3.4, 2.7], [5.9, 2.5, 1.7]]); Ms.at(TR(0, 2.9, 6, 0, -1.25)).loft(5, [[0, .1, .1, 0, .8], [2.6, .05, .05, 2, 1]], { cap: 'top' }).at(null);
    B.g(tex.sail({ c: o.sail }), { side: true }).normal([.6, .4, .5]).tri([0, 3.6, 8.3], [0, 8.4, 3.1], [0, 3.3, 3.6], [1, 0], [0, 1], [0, 0]); for (const [a, b] of [[[1.9, 2, -1.6], [0, 9.6, -.6]], [[-1.9, 2, -1.6], [0, 9.6, -.6]], [[1.7, 2, 2.2], [0, 8.4, 3]], [[-1.7, 2, 2.2], [0, 8.4, 3]]]) Rp.quad([a[0], a[1], a[2] - .04], [a[0], a[1], a[2] + .04], [b[0], b[1], b[2] + .04], [b[0], b[1], b[2] - .04], [0, 0, 1, 8]);
    body.add(B.group()); const fl = F.flag({ pole: 1.4, c: o.c2 || '#c8453a', crest: o.flag ?? 'none', w: 1.5, h: .9, ...(o.flagO || {}) }); fl.position.set(0, 10.7, -.6); body.add(fl);
    body.scale.setScalar(s); g.add(body); g.userData.dyn = true; g.userData.deck = 1.5 * s; const ph = live.length; return reg(g, t => { body.rotation.z = Math.sin(t * .7 + ph) * .025; body.rotation.x = Math.sin(t * .5 + ph) * .012; body.position.y = Math.sin(t * .9 + ph) * .07 - .25 * s; }); };
  // ゴンドラ（細長い舟。へさきと ともが そり上がる）。c（船体）, c2（ざぶとん）。水面は y=0。こぎ手は userData.stand（[x, y, z]）に立たせる。かいは userData.oar（Group。rotation.x でこぐ）
  F.gondola = (o = {}) => { const B = parts(), G = B.g(T.planks({ c: o.c || '#2e2a34' })), Gt = B.g(tex.ornate({ c: o.trim })), Gd = B.g(T.planks({ c: '#6a4c34' })), st = [[-3.1, .03, .3, 1.1], [-2.4, .42, .5, .62], [-1, .62, .56, .44], [1, .6, .56, .44], [2.3, .38, .5, .64], [3, .12, .4, 1], [3.3, .03, .2, 1.5]];
    hull(G, Gt, Gd, st, { inner: true, deck: .32, trimW: .1 }); B.g(T.fabric({ pattern: 'plain', c: o.c2 || '#b8403a' })).box(.8, .12, .5, 0, .3, .9, {}).box(.8, .4, .1, 0, .3, .6, {}).box(.8, .12, .5, 0, .3, -.2, {}); Gt.box(.06, .5, .3, 0, 1.45, 3.25, {});
    const g = B.group(), oar = new THREE.Group(), om = geo().at(TR(0, 0, 0, 0, 0, -.9)).loft(5, [[-2.2, .07, .02, 0, .8], [-1.5, .03, .03, .3, 1], [1.2, .03, .03, 1, 1]], { cap: 'bot' }).mesh(T.planks({ c: '#8a6444' })); oar.add(om); oar.position.set(-.5, 1, -2); oar.userData.dyn = true; g.add(oar); g.userData = { stand: [0, .34, -2.1], oar }; return g; };
  // 荷馬車（4 輪）。cover: ほろの布の色（false でなし）、load: 'crates'/'barrels'/'hay'。前は +z（ながえ）。userData.wheels（回す車輪の並び）
  F.wagon = (o = {}) => { const B = parts(), Wd = B.g(T.planks({ c: o.c || '#8f6a44' })), It = B.g(tex.iron({ rust: .3 })), g = new THREE.Group(), m = 1.6; Wd.box(1.5, .12, 3, 0, .78, 0, { m, bottom: true }); for (const sx of [-1, 1]) Wd.box(.07, .5, 3, sx * .72, .9, 0, { m }); for (const z of [-1.47, 1.47]) Wd.box(1.5, .5, .07, 0, .9, z, { m });
    Wd.box(.08, .08, 1.9, 0, .62, 2.4, { m }).box(1, .07, .07, 0, .62, 3.3, { m }); for (const z of [-.95, .95]) It.box(1.7, .09, .09, 0, .52, z, { m: 1.5 });
    if (o.cover !== false) { const Cv = B.g(tex.sail({ c: o.cover === true || !o.cover ? '#ece0c4' : o.cover }), { side: true }).smooth(1).at(TR(0, 1.4, 0, 0, PI / 2)); Cv.loft(8, [[-1.5, .78, .95, 0, .9], [0, .76, .92, .5, 1], [1.5, .78, .95, 1, .9]], { seg: [2, 6], ur: 2, rot: 0 }).at(null).smooth(0); for (const z of [-1.5, 0, 1.5]) Wd.at(TR(0, 1.4, z, 0, PI / 2)).loft(8, [[-.03, .8, .97, 0, .8], [.03, .8, .97, .1, .8]], { seg: [2, 6], rot: 0 }).at(null); }
    g.add(B.group()); const put = (ob, x, y, z, ry = 0) => { ob.position.set(x, y, z); ob.rotation.y = ry; g.add(ob); };
    if (o.load === 'crates') { put(R.crate({ s: .7 }), -.2, .9, -.6, .2); put(R.crate({ s: .5, kind: 'x', c: '#8a9a6a' }), .3, .9, .4, .5); } if (o.load === 'barrels') { put(R.barrel({ h: .8, r: .32 }), -.3, .9, -.7); put(R.barrel({ h: .8, r: .32 }), .3, .9, .1); } if (o.load === 'hay') put(geo().loft(6, [[0, .68, 1.35, 0, .8], [.5, .64, 1.3, .5, 1], [.85, .4, 1, 1, 1.05]], { cap: 'top', capRect: true, ur: 2 }).mesh(T.thatch()), 0, .9, 0);
    const wt = T.wheel(), wm = R.mat(wt, { vc: true, smooth: true, side: true }); g.userData.wheels = []; for (const [x, z] of [[-.85, -.95], [.85, -.95], [-.85, .95], [.85, .95]]) { const wg = new THREE.Group(), q = new THREE.Mesh(geo().quad([0, -.52, .52], [0, -.52, -.52], [0, .52, -.52], [0, .52, .52]).build(), wm); q.castShadow = true; wg.add(q); wg.position.set(x, .52, z); wg.userData.dyn = true; g.add(wg); g.userData.wheels.push(wg); } return g; };

  // @@NEXT@@
  return F;
};
