// game-looks-9 の追加の部品「ダークな雰囲気」。game-looks-7 の kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), D = PACK_DARK(THREE, K, R);   として使う（第 8 集の pack といっしょに読んでよい）。
// 一覧は pack-dark-sheet.html（?p=mood で雰囲気の組 8 つ、?p=parts&i=0〜3 で形、?p=tex でテクスチャ）。見本は 01-cursed-castle-gate.html（嵐）と 02-moonlit-graveyard-chapel.html（月夜）。
//
// ■ 考え方：「暗い雰囲気なのに、主役と場面が読める」。画面を黒くつぶさず、暗い所と あかりの当たる所の差で見せる。
//   1) 空は てっぺんが暗く、地平線が明るい → 遠くの城や木が、明るい空と霧の前の黒いシルエットになる
//   2) 弱い空の光（青や緑によせる）で、かげの中のテクスチャも読める。黒（#000）の面は作らない。テクスチャの色も、黒ではなく青むらさき寄りの暗い色
//   3) ななめ うしろからの ふちの光（月・いなずま・遠い火）で、主役と建物のりんかくが出る
//   4) あかり（ランタン・窓・火）は、地面の明るさに焼きこみ（D.lightShade）、かべと地面に加算の輪（D.pools / D.spot）。PointLight は主役のまわりの 1〜3 個だけ
//   この 1)〜3) を 1 回で用意するのが D.mood。場面はまず D.mood を呼び、足りない所に あかりを足す。明るさの全体は D.mood の level（既定 1）で動かす
//
// ■ 決まり：retro.js と同じ（足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'）。長い物（さく・いばら）は x の向きにのびる。
//   動く物は、作ったときに D.live に入る。毎コマ  D.tick(t, cam)  を 1 回呼べば全部動く（雰囲気の組・いなずま・雨・霧・火・鳥・鬼火…）。
//   動く部分は userData.dyn = true なので、R.merge にそのまま入れてよい。
//
// ■ 雰囲気の組  const mood = D.mood(scene, renderer, 種類, { level: 1, dir: [x,y,z]（ふちの光が来る向き）, shadow: true, range: 30, hills: true, follow: 主役, r: 380（空の半径。cam の far より小さく） })
//   種類: 'storm'（嵐の夜。青黒）/ 'moon'（月夜。青緑）/ 'fog'（深い霧。灰）/ 'ember'（遠い火事・溶岩。赤だいだい）/ 'blood'（赤い月。赤むらさき）
//         / 'abyss'（深い海・地の底。青みどり）/ 'blackout'（停電の町。紺）/ 'ash'（ふる灰。灰茶）   色の表は D.MOODS（{ sky, fog, hemi, key, fill, hills, base, glow }）。引数で上書きできる
//   用意する物: 空（R.skyDome）、霧（scene.fog）、空の光（hemi）、ふちの光（key。影つき）、手前からの弱い光（fill）、遠くの山のシルエット（hills）
//   返す物: { sky, hemi, key, fill, hills, fog, dir, base: [r,g,b]（地面の下地の明るさ）, glow（合う あかりの色）, shade(あかりの一覧) → R.ground の shade, fl（いなずまの強さ 0〜1。書きこめる）, follow, tick(t, cam) }
//   D.lightning(mood, { first: 2.3（最初の時刻）, every: 6.5, az: 0（出る方角。度。0 が -z、90 が +x）, spread: 50, dist: 150, power: 1, bolt: true }) → Group   ときどき空と場面が白くなる（scene に入れる）
//
// ■ あかり
//   D.lightShade([{ x, z, r, c, k }, …], [r, g, b]（下地）) → (x, z) → [r, g, b]   R.ground の shade に入れる（あかりを地面に焼きこむ。テクスチャが明るく読める）
//   D.pools([{ p: [x, y, z], r, r2, c, n: [法線]（省くと地面）, k }, …]) → Mesh   加算の光の輪（地面・かべ）   D.spot({ r, c, k, flicker }) → Mesh   動かせる 1 つの輪（position で置く）
//   D.streaks([{ x, z, h, c, w, len, k, flicker }, …], { y }) → Mesh   ぬれた地面の映りこみ（あかりの下からカメラのほうへ のびる）   D.halo({ c, r, k, flicker }) → Sprite
//   D.lantern(人, { hand: 'L'/'R', c, light: true, power, range, r（地面の輪） }) → Group   主役が手にさげるランタン（にじみ＋PointLight＋足もとの輪）。毎コマ R.walk のあとに D.lanternPose(人) で うでを前へ
//   D.candles({ n: 5, len: 1.2, h: .22, light }) → Group   ろうそくの列（x の向き）   D.brazier({ s: 1, c, light }) → Group   かがり火（鉄のかごと三脚）   D.flame({ s, c }) → Mesh   火だけ
//   D.windowLight({ w: .8, h: 1.6, kind: 'lancet'/'rose'/'rect', c, k, pool: 2.2 }) → Group   あかりのついた窓（色ガラス＋かべのにじみ＋前の地面の輪）。かべの面に置く（+z 向き）
//   D.warnLamp({ kind: 'spin'/'blink', c: '#ff4030', r: .16, light }) → Group   赤い警告灯（回る光のすじ・点めつ）   D.exitLamp({ c: '#58e8a0', w: .5 }) → Group   非常灯（かべに付ける）
//   D.bulb({ drop: .6, c, flicker: true, light }) → Group   つるした電球（消えかけて ちらつく。つるす点が y=0）
//
// ■ 天気と空気
//   D.rain({ n: 700, box: [26, 13, 26], speed: 24, slant: [.3, .1], c, a: .55, len: .7 }) → 線   D.groundFog({ n: 46, box: [56, 56], y: .1, h: 1.5, w: 8, c, a: .34, wind: [.5, .15] }) → Mesh   地をはう霧（やわらかい かたまり）
//   D.flakes({ kind: 'ash'/'ember'/'snow'/'dust', n: 260, box: [24, 10, 24], c, size }) → 点   ふる灰・のぼる火の粉   D.clouds({ n: 9, r: 260, y: 70, s: 80, c, shade, speed: .012 }) → Group   流れる雲
//   D.moon({ r: 28, c, az: -20, el: 26, dist: 330, halo: 2.6, red: false }) → Group   大きな月（az は D.lightning と同じ向き）。userData.dir ＝ 月の向き（D.mood の dir に入れると ふちの光が月から来る）
//   D.shaft({ w: 3, h: 12, c, a: .25, lean: [x, z] }) → Mesh   うすい光のすじ（加算。足もとが y=0）
//
// ■ 不気味な小物
//   D.grave({ kind: 'round'/'point'/'slab'/'obelisk'/'disc'/'post', s, c, lean, leanX, moss, seed }) → Group   墓石と墓標   D.graves({ n, area: [w, d], seed, keep(x,z) → false で置かない }) → Group   まとめて置く
//   D.statue({ kind: 'angel'/'knight', s: 1, c, broken: true }) → Group   台座つきの石の像（天使はつばさが欠け、騎士は剣を地につく）   D.column({ h: 3, r: .35, broken: true, c, fallen: true }) → Group   こわれた柱
//   D.fence({ len: 6, h: 1.5, c, lean, posts: true }) → Group   鉄のさく   D.gate({ w: 2.4, h: 2.6, open: .5, c, stone }) → Group   石の柱と鉄のとびら
//   D.deadTree({ h: 6, r: .28, seed, c, twigs: 2 }) → Group   枯れ木（userData.perch ＝ 枝先の位置。からすを とまらせる）   D.thorns({ len: 3, h: 1, seed }) → Mesh   いばら
//   D.web({ s: 1 }) → Mesh   くもの巣（かどが原点。+x と -y へ広がる）   D.chain({ len: 2, sway }) → Mesh   くさり（つるす点が y=0）
//   D.bier({ s: 1, c }) → Group   ひつぎの形の石の台   D.scarecrow({ s: 1, c }) → Group   かかし   D.wreckCart({ c }) → Group   こわれた馬車
//   D.chapel({ w: 5, d: 8, h: 4.2, stone, roof, lit: 1, tower: true }) → Group   ゴシックふうの小さな礼拝堂（とがりアーチの窓・ばら窓・尖塔）。userData = { h, wins: [[x,y,z,nx], …], door: [x,y,z] }
//
// ■ 生きもの・影
//   D.crow({ s: 1.5 }) → R.bird の黒い版（R.birdPose で動かす）   D.perched([[x, y, z, 向き], …], { watch: 主役, near: 4 }) → Group   とまる からす（主役が近づくと飛びたち、あとで戻る）
//   D.flock({ kind: 'crow'/'bat', n: 9, r: 9, h: 9, c, speed, center: [x, y, z] }) → Mesh   輪をかいて飛ぶ群れ（こうもりは小さく、ばたばた）
//   D.owl({ s: 1.4, c }) → Group   ふくろう（目が光り、ときどき まばたき）   D.cat({ s }) → R.cat の黒い版（目が黄色。R.catPose で動かす）
//   D.wisp({ c: '#8ef0d0', r: .5, drift: .6, light, seed }) → Group   鬼火（ゆれる光の玉。地面に輪）   D.ghost({ h: 1.9, c, a: .5 }) → Mesh   うすく光る人の形（遠くに立つだけ）
//   D.loomer({ w: 60, h: 46, c, eye: '#ffd060', gap: .16 }) → Group   遠くの大きな影（光る目が 2 つの、山のような黒い形）。霧の色より少し暗い c にする
//
// ■ テクスチャ  D.tex.名前({ c, seed, m, … })   stone { moss, stain }（黒ずんだ石。こけと雨じみ）   wetCobble { wet, shine }（ぬれた石だたみ）   deadGrass   ash（灰の地面）   plank（古い板）
//   grave { mark, moss }（墓石の正面）   glass { kind: 'lancet'/'rose', lit, cs }（暗い色ガラス。抜き）   fence（さびた鉄のさく。抜き）   thorn / web / chain（抜き）   moon { shade }   owl
window.PACK_DARK = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, geo, parts, TR, mat } = R, T = R.tex, PT = R.paint, PI = Math.PI, TAU = PI * 2, D = { live: [] };
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), md = (v, k) => ((v % k) + k) % k, V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const live = o => { D.live.push(o); return o; }, dyn = o => { o.userData.dyn = true; return o; };
  D.tick = (t, cam) => { for (let i = 0; i < D.live.length; i++) D.live[i].userData.tick(t, cam); };
  const TX = (v, f, dflt = {}) => v && v.isTexture ? v : f(v ? { ...dflt, c: v } : dflt);

  // ================= 1. テクスチャ =================
  const paint = {}, tex = {}, cache = new Map();
  const def = (name, m, fn, cut = false) => { paint[name] = fn; tex[name] = (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) cache.set(k, t = T.from(fn(o), { m: o.m || m, cut, name: 'dark.' + name })); return t; }; };
  // 黒ずんだ切り石。段ごとに はばのちがう石、目地のかげ、上からたれる雨じみ、目地にそった こけ
  def('stone', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#666a84'), M = ramp(o.mossC || '#4c6e54'), sd = o.seed || 0, moss = o.moss ?? .35, st = o.stain ?? .5;
    for (let r = 0; r < 4; r++) { const x0 = (r % 2) * 9 + Math.floor(hash(r, sd) * 5); let x = x0, i = 0; while (x < x0 + 64) { let bw = 12 + Math.floor(hash(r, i, sd) * 11); if (x0 + 64 - x - bw < 9) bw = x0 + 64 - x; P.block(x, r * 16, bw, 15, C, 2 + (hash(r, i, sd + 3) > .6 ? 1 : 0) - (hash(r, i, sd + 5) > .78 ? 1 : 0), {}); P.rect(x + bw - 1, r * 16, 1, 15, C[0]); x += bw; i++; } P.rect(0, r * 16 + 15, 64, 1, C[0]); }
    P.each((x, y, c) => { const yy = y % 16, s = tn(x, y, 5, 32, 64, 64, sd + 1), g = tn(x, y, 8, 8, 64, 64, sd + 2);
      if (g + (yy < 4 ? .25 : 0) + (yy > 13 ? .3 : 0) > 1.2 - moss * .5 && hash(x, y, sd) > .25) return tone(M, 1 + Math.floor(hash(x, y, 7) * 2.4));
      if (s > .78 - st * .2 && c !== C[0] && hash(x, y, sd + 4) > .2) return mix(c, C[0], .45);
      if (hash(x, y, sd + 9) > .985) return C[1]; });
    return P; });
  // ぬれた石だたみ。水たまり（暗くて、ふちが明るい）と、石の上の てり
  def('wetCobble', 3, (o = {}) => { const c = o.c || '#5c6480', P = PT.cobble({ kind: o.kind || 'round', c, seed: o.seed }), C = ramp(c), sd = o.seed || 0, wet = o.wet ?? .5, sh = o.shine || '#a8b8e0', th = 1 - wet * .55;
    P.each((x, y, q) => { const p = tn(x, y, 16, 16, P.w, P.h, sd + 3), e = tn(x + 1, y + 1, 16, 16, P.w, P.h, sd + 3); if (p > th) return e <= th ? mix(sh, c, .35) : hash(x >> 1, y, sd) > .9 ? mix(sh, c, .5) : mix(C[0], '#2a3458', .5); if (hash(x, y, sd + 5) > .93) return mix(q || c, sh, .4); });
    return P; });
  def('deadGrass', 3, (o = {}) => { const c = o.c || '#56624e', P = PT.grass({ c, flowers: 0, seed: o.seed }), dry = mix(c, '#b0a880', .5); P.each((x, y) => hash(x, y, (o.seed || 0) + 3) > .955 ? dry : hash(x, y, 8) > .975 ? mix(c, '#20283a', .5) : undefined); return P; });
  def('ash', 3, (o = {}) => { const c = o.c || '#6a686c', P = PT.dirt({ c, seed: o.seed }), C = ramp(c); P.each((x, y) => { const s = tn(x, y, 10, 10, P.w, P.h, (o.seed || 0) + 2); return s > .7 ? (hash(x, y, 4) > .5 ? C[4] : C[3]) : hash(x, y, 6) > .97 ? C[0] : undefined; }); return P; });
  def('plank', 3, (o = {}) => { const c = o.c || '#584e58', P = PT.planks({ c, seed: o.seed }), C = ramp(c); P.each((x, y, q) => { const s = tn(x, y, 6, 20, P.w, P.h, (o.seed || 0) + 5); return s > .74 && hash(x, y, 2) > .3 ? mix(q || c, C[0], .5) : hash(x, y, 9) > .985 ? C[4] : undefined; }); return P; });
  // 墓石の正面（32×48）。ほりこんだ わく、しるし、字ではない ほりあとの線、ひび、下からの こけ
  def('grave', 1, (o = {}) => { const P = Px(32, 48), C = ramp(o.c || '#7c8296'), M = ramp('#4c6e54'), sd = o.seed || 0, moss = o.moss ?? .5;
    P.each((x, y) => tone(C, 2 + (tn(x, y, 8, 8, 32, 48, sd) > .6 ? 1 : 0) - (tn(x, y, 6, 12, 32, 48, sd + 4) > .7 ? 1 : 0)));
    P.rect(4, 5, 24, 1, C[1]); P.rect(4, 6, 24, 1, C[4]); P.rect(4, 5, 1, 30, C[1]); P.rect(27, 5, 1, 30, C[4]); P.rect(4, 35, 24, 1, C[4]);
    const k = o.mark ?? (sd % 3); if (k === 0) { P.disc(16, 13, 3.6, C[1]); P.disc(16.6, 13.6, 2.4, C[3]); } else if (k === 1) P.bits(13, 10, ['  ##  ', ' #  # ', '#    #', ' #  # ', '  ##  '], { '#': C[1] }); else { P.rect(10, 11, 12, 1, C[1]); P.rect(10, 14, 12, 1, C[1]); }
    for (let i = 0; i < 4; i++) { const w = 8 + Math.floor(hash(i, sd, 2) * 12), x = 16 - (w >> 1); P.rect(x, 20 + i * 4, w, 1, C[1]); P.rect(x, 21 + i * 4, w, 1, C[4]); }
    let cx = 6 + hash(sd, 8) * 20; for (let y = 0; y < 18 + hash(sd, 9) * 14; y++) { P.set(cx, y, C[0]); cx += hash(y, sd, 6) > .6 ? (hash(y, sd, 7) > .5 ? 1 : -1) : 0; }
    P.each((x, y) => y > 47 - (4 + tn(x, 0, 6, 8, 32, 48, sd + 2) * 14) * moss && hash(x, y, sd) > .3 ? tone(M, 1 + Math.floor(hash(x, y, 5) * 2.2)) : undefined); return P; });
  // 暗い色ガラス。lancet＝とがりアーチ（32×64 ＝ 1 m × 2 m）、rose＝ばら窓（48×48）。lit で内がわから ともる
  def('glass', 1, (o = {}) => { const rose = o.kind === 'rose', W = rose ? 48 : 32, H = rose ? 48 : 64, P = Px(W, H), lit = o.lit ?? 0, cs = (o.cs || ['#6a2f7a', '#1f6272', '#8a2f42', '#96762e', '#2f4290']).map(c => lit ? mix(c, o.glow || '#ffd890', .22 + lit * .34) : mix(c, '#161a2a', .3)), lead = o.lead || '#1c1e2e', fr = ramp(o.frame || '#5e627c'); P.clip = true;
    P.each((x, y) => { let id;
      if (rose) { const dx = x - 23.5, dy = y - 23.5, r = Math.hypot(dx, dy), a = md(Math.atan2(dy, dx), TAU) / TAU * 8; if (r > 23.5) return null; if (r > 21) return fr[r > 22.4 ? 1 : 3]; const ring = r < 5 ? 0 : r < 13 ? 1 : 2, af = a % 1; if (Math.abs(r - 5) < .7 || Math.abs(r - 13) < .7 || (ring && (af < .09 || af > .91))) return lead; id = ring * 31 + Math.floor(a) * ring; }
      else { const cx = 15.5, top = 20, hw = 14, edge = y >= top ? hw : hw * Math.sqrt(Math.max(0, 1 - ((top - y) / top) ** 1.6)), d = edge - Math.abs(x - cx); if (d < 0 || y > 62) return null; if (d < 2 || y > 60) return fr[d < 1 ? 1 : 3]; const dg = Math.floor(x + y * .5); if (Math.abs(x - cx) < .8 || y % 12 === 8 || dg % 14 === 0) return lead; id = Math.floor(y / 12) * 4 + (x > cx ? 1 : 0) + Math.floor(dg / 14) * 2; }
      const c = cs[Math.floor(hash(id, o.seed || 0) * cs.length)]; return hash(x, y, 3) > .86 ? mix(c, lit ? '#fff0c0' : '#8090c0', .25) : c; }); return P; }, true);
  // 鉄のさく（32×64 ＝ 1 m × 2 m。やりの先、よこ棒 2 本、さび）
  def('fence', 1, (o = {}) => { const P = Px(32, 64), C = ramp(o.c || '#565a76'), Rs = ramp(o.rust || '#8a5a44'), sd = o.seed || 0; P.clip = true;
    for (let k = 0; k < 4; k++) { const x = 3 + k * 8, tall = k % 2 === 0, y0 = tall ? 8 : 14; P.rect(x, y0, 2, 64 - y0, C[2]); P.rect(x, y0, 1, 64 - y0, C[4]); if (tall) { P.bits(x - 1, 1, [' ## ', ' ## ', '####', '####', ' ## ', ' ## ', ' ## '], { '#': C[3] }); P.set(x, 1, C[5]); P.set(x - 1, 3, C[5]); } else P.rect(x, 12, 2, 2, C[4]); }
    for (const y of [17, 54]) { P.rect(0, y, 32, 3, C[2]); P.rect(0, y, 32, 1, C[4]); P.rect(0, y + 2, 32, 1, C[0]); }
    P.each((x, y, c) => c && hash(x, y, sd) > .88 ? tone(Rs, 1 + Math.floor(hash(x, y, 3) * 2)) : undefined); return P; }, true);
  def('thorn', 2, (o = {}) => { const P = Px(64, 32), C = ramp(o.c || '#5a4a5c'), sd = o.seed || 0;
    for (let k = 0; k < 5; k++) for (let x = 0; x < 64; x++) { const yy = 16 + Math.sin(x / 64 * TAU * (1 + k % 3) + k * 1.9) * (4 + k * 1.3) + (k - 2) * 2; P.set(x, yy, C[2 + k % 2]); P.set(x, yy + 1, C[1]); if (hash(x, k, sd) > .8) { const up = hash(x, k, 5) > .5 ? -1 : 1; P.set(x, yy + up * 2 + (up > 0 ? 1 : 0), C[4]); P.set(x + 1, yy + up + (up > 0 ? 1 : 0), C[3]); } } return P; }, true);
  def('web', 1, (o = {}) => { const P = Px(32), c = o.c || '#b4bed2', c2 = mix(c, '#3a4058', .4); P.clip = true; for (let k = 0; k <= 5; k++) { const a = k / 5 * PI / 2; P.line(0, 0, Math.cos(a) * 31, Math.sin(a) * 31, k % 2 ? c2 : c); }
    for (const r of [7, 13, 20, 27]) for (let k = 0; k < 5; k++) { const a0 = k / 5 * PI / 2, a1 = (k + 1) / 5 * PI / 2, am = (a0 + a1) / 2, xm = Math.cos(am) * r * .9, ym = Math.sin(am) * r * .9; P.line(Math.cos(a0) * r, Math.sin(a0) * r, xm, ym, c2); P.line(xm, ym, Math.cos(a1) * r, Math.sin(a1) * r, c2); } return P; }, true);
  def('chain', .25, (o = {}) => { const P = Px(8, 16), C = ramp(o.c || '#62667e'); P.clip = true; P.bits(1, 0, [' #### ', '#    #', '#    #', '#    #', '#    #', '#    #', ' #### '], { '#': C[3] }); P.rect(3, 6, 2, 10, C[2]); P.rect(3, 6, 1, 10, C[4]); P.set(2, 0, C[5]); P.set(1, 2, C[5]); return P; }, true);
  def('moon', 1, (o = {}) => { const P = Px(64), c = o.c || '#eaf6f0', sh = o.shade || mix(c, '#4e7486', .5); P.clip = true; P.each((x, y) => { const r = Math.hypot(x - 31.5, y - 31.5); if (r > 31) return null; const s = tn(x, y, 12, 12, 64, 64, 3) * .7 + tn(x, y, 5, 5, 64, 64, 7) * .3; return s > .62 ? sh : s > .54 ? mix(c, sh, .5) : r > 29 ? mix(c, sh, .25) : c; }); return P; }, true);
  // ふくろう（32×32 を胴にひとまき。まん中が正面：顔の円ばんと目、下は むねのもよう）
  def('owl', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#7a6a5c'), Fc = ramp(o.face || '#c8baa0');
    P.each((x, y) => tone(C, 2 + ((x + (y >> 2) * 3) % 6 < 2 && y % 4 === 3 ? -1 : 0) + (y % 4 === 0 ? 1 : 0)));
    for (const ex of [11.5, 20.5]) { P.disc(ex, 8, 4.6, Fc[2]); P.disc(ex, 8, 3.7, Fc[3]); P.disc(ex, 8, 2.3, '#ffd24a'); P.disc(ex, 8, 1.1, '#18141c'); } P.bits(15, 10, ['##', '##', ' #'], { '#': '#d89a3a' });
    for (let y = 15; y < 30; y += 3) for (let x = 9; x < 23; x++) P.set(x, y + ((x >> 1) & 1), (x + y) % 3 ? Fc[2] : C[1]); return P; });
  // 遠くの大きな影（64×48 の切りぬき）。山のような こぶと、塔か角のような 2 本
  def('loomer', 1, (o = {}) => { const P = Px(64, 48), c = o.c || '#1c2438', c2 = mix(c, '#000008', .3), sd = o.seed || 0; P.clip = true;
    for (let x = 0; x < 64; x++) { const u = (x - 31.5) / 32, hump = 30 * Math.exp(-u * u * 5.5) + 13 * Math.exp(-u * u * 1.4), horn = Math.max(0, 9 - Math.abs(Math.abs(x - 31.5) - 11) * 3.2) * 1.3, h = hump + horn + (tn(x, 0, 6, 8, 64, 48, sd) - .5) * 5; for (let y = 47; y > 47 - h && y >= 0; y--) P.set(x, y, tn(x, y, 7, 7, 64, 48, sd + 2) > .62 ? c2 : c); } return P; }, true);
  D.tex = tex; D.paint = paint;

  // ================= 2. 光の絵と、四角の入れ物 =================
  const alphaTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const q = fn(x, y), i = (y * w + x) * 4; for (let k = 0; k < 4; k++) im.data[i + k] = cl(q[k]) * 255; } g.putImageData(im, 0, 0);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return t; };
  const step = (v, n) => Math.round(cl(v) * n) / n, lazy = f => { let v; return () => v || (v = f()); };
  const haloT = lazy(() => alphaTex(32, 32, (x, y) => { const v = step(Math.max(0, 1 - Math.hypot(x - 15.5, y - 15.5) / 15.5) ** 1.8, 10); return [v, v, v, 1]; }));
  const streakT = lazy(() => alphaTex(16, 64, (x, y) => { const ky = 1 - Math.abs(y - 31.5) / 32, kx = Math.max(0, 1 - Math.abs(x - 7.5 - Math.sin(y * .9) * 1.2) / 7), v = step(ky ** 1.3 * kx ** .9 * (y % 5 === 4 ? .35 : y % 7 === 2 ? .6 : 1), 8); return [v, v, v, 1]; }));
  const shaftT = lazy(() => alphaTex(32, 64, (x, y) => { const sx = Math.max(0, 1 - Math.abs(x - 15.5) / 16), v = step(sx ** 1.3 * ((x * 5) % 11 < 4 ? 1 : .68) * (1 - .8 * y / 63), 10); return [v, v, v, 1]; }));
  // 霧のかたまり：いくつかの丸を重ねた、よこ長の やわらかい形（上下のはしは消える）
  const fogT = lazy(() => alphaTex(64, 32, (x, y) => { let v = 0; for (let k = 0; k < 6; k++) { const cx = 8 + k * 9.6 + Math.sin(k * 2.3) * 3, cy = 17 + Math.cos(k * 1.7) * 4, r = 9 + (k % 3) * 2.5; v = Math.max(v, 1 - Math.hypot((x - cx) / 1.25, y - cy) / r); } v *= cl((31 - y) / 9) * cl(Math.min(x, 63 - x) / 10); return [1, 1, 1, v > .55 ? .8 : v > .36 ? .56 : v > .2 ? .32 : v > .07 ? .14 : 0]; }));
  const ghostT = lazy(() => alphaTex(32, 64, (x, y) => { const dx = Math.abs(x - 15.5), hw = y < 15 ? Math.sqrt(Math.max(0, 36 - (y - 9) ** 2)) : 5.5 + (y - 15) * .2 + Math.sin(y * .55) * .7, e = cl((Math.max(hw, y > 12 && y < 16 ? 5 : 0) - dx) / 2.6), f = y > 30 ? cl(1 - (y - 30) / 30) : 1, v = step(e * f, 6), eye = y >= 8 && y <= 9 && (Math.abs(dx - 2.5) < 1) ? .25 : 1; return [1, 1, 1, v * eye]; }));
  const addMat = (map, o = {}) => new THREE.MeshBasicMaterial({ map, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, ...o });
  const lin = c => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; }, rgb01 = c => { const k = new THREE.Color(c); return [k.r, k.g, k.b].map(v => Math.pow(v, 1 / 2.2)); };
  const flick = (t, s = 0) => hash(Math.floor(t * 11), s, 3) < .14 ? .3 : Math.sin(t * 37 + s * 9) > .93 ? .6 : 1, fire = (t, s = 0) => .82 + .1 * Math.sin(t * 9 + s * 5) + .08 * Math.sin(t * 23.7 + s * 3);
  const quads = (n, material, alpha) => { const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), s = alpha ? 4 : 3, col = new Float32Array(n * 4 * s), idx = []; for (let i = 0; i < n; i++) { uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, s)); g.setIndex(idx); const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.userData.dyn = true; m.castShadow = m.receiveShadow = false;
    m.userData.put = (i, a, b, c, d, rgb, al) => { pos.set(a, i * 12); pos.set(b, i * 12 + 3); pos.set(c, i * 12 + 6); pos.set(d, i * 12 + 9); for (let k = 0; k < 4; k++) { col.set(rgb, (i * 4 + k) * s); if (alpha) col[(i * 4 + k) * s + 3] = al; } }; m.userData.flush = () => { g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; }; return m; };
  const glowM = (t, o = {}) => mat(t, { vc: true, glow: true, ...o });

  // ================= 3. 雰囲気の組 =================
  // sky ＝ [てっぺん, 中, 低い所, 地平線]、fog ＝ [色, 近, 遠]、hemi ＝ [空の色, 地の色, 強さ]、key ＝ [色, 強さ, 来る向き]、fill ＝ [色, 強さ]、hills ＝ 遠くの山の色、base ＝ 地面の下地の明るさ、glow ＝ 合う あかりの色
  const MOODS = D.MOODS = {
    storm: { sky: ['#0e1228', '#232e4e', '#405274', '#6c7ea0'], fog: ['#35435f', 20, 150], hemi: ['#9cb2e6', '#3a3e58', 1.25], key: ['#b8ccff', 1.5, [-.62, .5, -.6]], fill: ['#6a7cb0', .55], hills: '#1c2338', base: [.86, .9, 1.06], glow: '#ffb060', flash: '#e4ecff' },
    moon: { sky: ['#081428', '#0f3248', '#22606e', '#5c9e9a'], fog: ['#27545f', 24, 170], hemi: ['#96dcd8', '#2a3e4a', 1.02], key: ['#c8f6ec', 1.75, [-.55, .6, -.58]], fill: ['#4c80a0', .5], hills: '#123040', base: [.64, .78, .82], glow: '#ffd070', stars: 220, flash: '#e8fff8' },
    fog: { sky: ['#3c4654', '#56626e', '#76828a', '#929c9e'], fog: ['#7e8a90', 5, 62], hemi: ['#c4ccd4', '#50565e', 1.2], key: ['#e4e8ec', .7, [-.4, .8, -.45]], fill: ['#8a94a0', .4], hills: '#56626c', base: [.95, .97, 1], glow: '#ffc878', flash: '#ffffff' },
    ember: { sky: ['#180c16', '#3a1620', '#7a3024', '#c8642c'], fog: ['#5c2c24', 18, 140], hemi: ['#e09468', '#3c242c', 1.1], key: ['#ffa058', 1.6, [-.5, .32, -.8]], fill: ['#7a4a6a', .5], hills: '#200e14', base: [1.05, .86, .8], glow: '#ffb040', flash: '#ffe0b0' },
    blood: { sky: ['#14080e', '#3a1022', '#6e1e2c', '#a43c38'], fog: ['#4c1a2c', 20, 150], hemi: ['#d0809a', '#34222e', 1.15], key: ['#ff9684', 1.5, [-.55, .5, -.66]], fill: ['#6a4a8a', .5], hills: '#1e0a14', base: [1.04, .84, .9], glow: '#ffc060', stars: 120, flash: '#ffd8d0' },
    abyss: { sky: ['#030810', '#06182a', '#0c2c42', '#16485c'], fog: ['#0e3044', 9, 85], hemi: ['#62aace', '#142838', 1.15], key: ['#8ee6ff', 1.1, [-.2, .95, -.25]], fill: ['#2a6a8a', .5], hills: '#061a28', base: [.8, .98, 1.08], glow: '#7af0d0', flash: '#d0f8ff' },
    blackout: { sky: ['#0a0c16', '#161a2a', '#262c40', '#3a4258'], fog: ['#20263a', 16, 120], hemi: ['#8490b8', '#2c2e3a', 1.05], key: ['#a8b8e0', 1.0, [-.5, .7, -.5]], fill: ['#5a5a80', .45], hills: '#10121e', base: [.88, .9, 1.04], glow: '#ff4a38', flash: '#e0e8ff' },
    ash: { sky: ['#3a3638', '#5a5252', '#807268', '#a4927e'], fog: ['#70685f', 12, 110], hemi: ['#ccc4bc', '#4e4848', 1.2], key: ['#ffe2c2', .9, [-.5, .6, -.6]], fill: ['#8a8088', .4], hills: '#4a4444', base: [1, .96, .92], glow: '#ff9a48', flash: '#fff4e0' } };
  D.mood = (scene, renderer, kind = 'moon', o = {}) => { const P = { ...(MOODS[kind] || MOODS.moon), ...o }, lv = o.level ?? 1, rad = o.r || 380, M = { kind, P, fl: 0, follow: o.follow || null, base: P.base, glow: P.glow };
    const sky = R.skyDome(P.sky.map((c, i) => [[0, .45, .78, 1][i], c]), { r: rad }), fogC = new THREE.Color(P.fog[0]), flashC = new THREE.Color(P.flash || '#e4ecff'); scene.add(sky); scene.fog = new THREE.Fog(P.fog[0], P.fog[1], P.fog[2]); renderer.setClearColor(P.fog[0]);
    const hemi = new THREE.HemisphereLight(P.hemi[0], P.hemi[1], P.hemi[2] * lv), key = new THREE.DirectionalLight(P.key[0], P.key[1] * lv), fill = new THREE.DirectionalLight(P.fill[0], P.fill[1] * lv), dir = V3(...(o.dir || P.key[2])).normalize(), fd = V3(-dir.x, .45, -dir.z).normalize();
    if (o.shadow !== false) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; key.castShadow = true; key.shadow.mapSize.set(1024, 1024); const r = o.range || 30; Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 220 }); key.shadow.bias = -.0015; key.shadow.normalBias = .05; }
    fill.target = key.target; scene.add(hemi, key, key.target, fill);
    let hills = null; if (o.hills !== false) { hills = R.backdrop({ c: P.hills, haze: mix(P.hills, P.sky[3], .8), r: rad * .8, y: o.hillsY ?? -4, h: o.hillsH, seed: o.seed }); scene.add(hills); }
    let stars = null; if (P.stars && o.stars !== false) { stars = K.stars(P.stars, rad * .96, 1.2); stars.material.color.set(mix(P.sky[3], '#ffffff', .5)); stars.material.fog = false; scene.add(stars); }
    const h0 = hemi.intensity, k0 = key.intensity, hy = hills ? hills.position.y : 0, zero = V3();
    M.tick = (t, cam) => { if (cam) { sky.position.copy(cam.position); if (hills) hills.position.set(cam.position.x, hy, cam.position.z); if (stars) stars.position.copy(cam.position); }
      const f = M.follow ? (M.follow.isObject3D ? M.follow.position : M.follow) : cam ? cam.position : zero; key.position.copy(f).addScaledVector(dir, 70); key.target.position.copy(f); fill.position.copy(f).addScaledVector(fd, 50);
      const fl = M.fl; sky.material.color.setScalar(1 + fl * (P.skyFlash ?? 3)); scene.fog.color.copy(fogC).lerp(flashC, fl * .36); hemi.intensity = h0 * (1 + fl * 1.5); key.intensity = k0 * (1 + fl * 1.6); };
    Object.assign(M, { sky, hemi, key, fill, hills, stars, fog: scene.fog, dir, shade: list => D.lightShade(list, P.base) }); live({ userData: { tick: M.tick } }); M.tick(0, null); return M; };
  // いなずま：ときどき mood.fl を上げ（空・霧・光が白くなる）、その方角に 光のすじ を出す。2 度またたいてから消える
  D.lightning = (mood, o = {}) => { const ev = o.every || 6.5, first = o.first ?? 2.3, az = o.az ?? 0, spread = o.spread ?? 50, dist = o.dist || 150, pw = o.power ?? 1, g = dyn(new THREE.Group()), G = geo(), sc = dist / 150;
    const seg = (a, b, w) => G.quad([a[0] - w, a[1], 0], [a[0] + w, a[1], 0], [b[0] + w * .8, b[1], 0], [b[0] - w * .8, b[1], 0]); let x = 0, y = 100; const pts = [[0, 100]]; while (y > 8) { y -= 7 + hash(pts.length, 3) * 9; x += (hash(pts.length, 5) - .5) * 17; pts.push([x, y]); }
    for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], 1.1 - i * .04); let q = pts[3]; for (let i = 0; i < 4; i++) { const n = [q[0] + 6 + hash(i, 8) * 7, q[1] - 6 - hash(i, 9) * 6]; seg(q, n, .5); q = n; } q = pts[6] || pts[4]; for (let i = 0; i < 3; i++) { const n = [q[0] - 5 - hash(i, 18) * 7, q[1] - 5 - hash(i, 19) * 6]; seg(q, n, .45); q = n; }
    const bolt = G.mesh('#f6f9ff', { glow: true, side: true, fog: false }), hl = D.halo({ c: mood.P.flash || '#dfe8ff', r: 46, k: .55 }); bolt.castShadow = false; hl.position.y = 70; g.add(bolt, hl); g.scale.setScalar(sc); g.visible = false;
    g.userData.tick = (t, cam) => { const k = Math.max(0, Math.floor((t - first) / ev)), tk = first + k * ev + (k ? (hash(k, 1) - .5) * ev * .5 : 0), dt = t - tk, env = dt < 0 ? 0 : dt < .07 ? 1 : dt < .14 ? .3 : dt < .28 ? .92 : .92 * Math.exp(-(dt - .28) * 4.5);
      mood.fl = env * pw; g.visible = o.bolt !== false && dt >= 0 && dt < .3 && !(dt >= .07 && dt < .14); if (g.visible && cam) { const a = (az + (hash(k, 2) - .5) * spread) * PI / 180; g.position.set(cam.position.x + Math.sin(a) * dist, 0, cam.position.z - Math.cos(a) * dist); g.rotation.y = -a; g.scale.x = (hash(k, 3) > .5 ? 1 : -1) * sc; } };
    g.userData.at = () => first; return live(g); };

  // ================= 4. あかり =================
  D.lightShade = (lights, base = [.86, .9, 1.06]) => { const L = lights.map(l => ({ x: l.x, z: l.z, r: l.r || 5, c: rgb01(l.c || '#ffb060').map(v => v * (l.k ?? 1) * 1.25) })); return (x, z) => { let r = base[0], g = base[1], b = base[2]; for (const l of L) { const dx = x - l.x, dz = z - l.z; if (Math.abs(dx) > l.r || Math.abs(dz) > l.r) continue; const k = Math.max(0, 1 - Math.hypot(dx, dz) / l.r) ** 2; r += l.c[0] * k; g += l.c[1] * k; b += l.c[2] * k; } return [r, g, b]; }; };
  D.pools = list => { const m = quads(list.length, addMat(haloT())), a = V3(), b = V3(), nn = V3(), up = V3(0, 1, 0);
    list.forEach((L, i) => { nn.set(...(L.n || [0, 1, 0])).normalize(); if (Math.abs(nn.y) > .9) { a.set(1, 0, 0); b.set(0, 0, -1); } else { a.crossVectors(up, nn).normalize(); b.crossVectors(nn, a); } const r = L.r || 2, r2 = L.r2 || r, p = L.p, e = .05, c = lin(L.c || '#ffb060').map(v => v * (L.k ?? 1));
      const Q = (sa, sb) => [p[0] + nn.x * e + a.x * r * sa + b.x * r2 * sb, p[1] + nn.y * e + a.y * r * sa + b.y * r2 * sb, p[2] + nn.z * e + a.z * r * sa + b.z * r2 * sb]; m.userData.put(i, Q(-1, -1), Q(1, -1), Q(1, 1), Q(-1, 1), c); });
    m.userData.flush(); m.renderOrder = 2; return m; };
  D.spot = (o = {}) => { const k = o.k ?? .7, m = dyn(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: haloT(), color: o.c || '#ffb060', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: k, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }))); m.rotation.x = -PI / 2; m.scale.setScalar(o.r || 2); m.position.y = .06; m.renderOrder = 2; m.userData.k = k;
    if (o.flicker) { m.userData.tick = t => { m.material.opacity = m.userData.k * (o.flicker === 'bulb' ? flick(t, o.seed || 2) : fire(t, o.seed || 2)); }; live(m); } return m; };
  D.halo = (o = {}) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT(), color: o.c || '#ffb060', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: o.k ?? .8 })); s.scale.setScalar((o.r || .7) * 2); if (o.flicker) { s.userData.tick = t => { s.material.opacity = (o.k ?? .8) * (o.flicker === 'bulb' ? flick(t, o.seed || 1) : fire(t, o.seed || 1)); }; live(s); } return s; };
  D.streaks = (list, o = {}) => { const m = quads(list.length, addMat(streakT())), y = o.y ?? .05, cs = list.map(L => lin(L.c || '#ffb060'));
    m.userData.tick = (t, cam) => { if (!cam) return; list.forEach((L, i) => { const h = L.h ?? 3, f = h / (h + Math.max(.5, cam.position.y)), cx = L.x + (cam.position.x - L.x) * f, cz = L.z + (cam.position.z - L.z) * f; let dx = cam.position.x - L.x, dz = cam.position.z - L.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
        const w = (L.w ?? .9) / 2, ln = (L.len ?? Math.min(7, 1.5 + dl * .22)) / 2, k = (L.k ?? 1) * (.82 + .18 * Math.sin(t * 2.3 + i * 1.7)) * cl(1.3 - dl / (o.far || 45)) * (L.flicker ? flick(t, i) : 1), c = cs[i].map(v => v * k);
        m.userData.put(i, [cx - dz * w - dx * ln, y, cz + dx * w - dz * ln], [cx + dz * w - dx * ln, y, cz - dx * w - dz * ln], [cx + dz * w + dx * ln, y, cz - dx * w + dz * ln], [cx - dz * w + dx * ln, y, cz + dx * w + dz * ln], c); }); m.userData.flush(); };
    m.renderOrder = 2; return live(m); };
  // 火（十字に組んだ 2 枚の切りぬき。4 コマを送る）
  const flameF = lazy(() => [0, 1, 2, 3].map(f => { const P = Px(16, 24); P.clip = true; P.each((x, y) => { const h = 1 - y / 23, w = (1 - h) ** .7 * 6.5 * (.75 + .25 * Math.sin(h * 9 + f * 1.6)), cx = 7.5 + Math.sin(h * 5 + f * 1.57) * 1.6 * h, d = Math.abs(x - cx); if (d > w || y < 2 + ((f * 3 + x) % 4)) return null; const k = d / w + h * .8; return k < .45 ? '#fff6c8' : k < .85 ? '#ffc040' : k < 1.2 ? '#f07a20' : '#c03a18'; }); return T.from(P, { cut: true, m: 1 }); }));
  D.flame = (o = {}) => { const s = o.s || 1, w = .28 * s, h = .62 * s, G = geo(); for (const a of [0, PI / 2]) G.at(TR(0, 0, 0, a)).quad([-w, 0, 0], [w, 0, 0], [w, h, 0], [-w, h, 0]).at(null); const m = dyn(new THREE.Mesh(G.build(), new THREE.MeshBasicMaterial({ map: flameF()[0], alphaTest: .5, side: THREE.DoubleSide, fog: false, color: o.c || '#ffffff' }))), sd = o.seed || 0;
    m.userData.tick = t => { m.material.map = flameF()[Math.floor(t * 9 + sd * 1.3) % 4]; }; return live(m); };
  // 主役が手にさげるランタン。うでの関節に付くので、歩くとゆれる。毎コマ R.walk のあとに D.lanternPose(人)
  D.lantern = (actor, o = {}) => { const J = actor.userData.J, B = actor.userData.build, hand = o.hand || 'L', pv = J['fore' + hand], c = o.c || '#ffb050', hold = new THREE.Group(), g = new THREE.Group(), P = parts(), s = o.s || 1;
    hold.rotation.z = pv.children[0] ? pv.children[0].rotation.z : 0; pv.add(hold); g.position.y = -B.farm - B.hand[2] * .8; hold.add(g);
    const It = P.g(T.metal ? T.metal({ c: '#4a4c5c' }) : '#4a4c5c'); It.box(.014 * s, .07 * s, .014 * s, 0, -.07 * s, 0, {}); It.loft(4, [[-.13 * s, .085 * s, .085 * s, 0, 1], [-.07 * s, .02 * s, .02 * s, 1, 1.1]], {}).loft(4, [[-.32 * s, .06 * s, .06 * s, 0, .8], [-.29 * s, .075 * s, .075 * s, 1, .9]], {});
    P.g(T.lamp(), { glow: true }).loft(4, [[-.29 * s, .062 * s, .062 * s, 0], [-.13 * s, .078 * s, .078 * s, 1]], { ur: 4 }); g.add(P.group());
    const hl = D.halo({ c, r: o.halo || .55, k: .75 }); hl.position.y = -.21 * s; g.add(hl); let Lp = null; if (o.light !== false) { Lp = new THREE.PointLight(c, o.power || 9, o.range || 7, 1.5); Lp.position.y = -.21 * s; g.add(Lp); }
    const spot = D.spot({ c, r: o.r || 2.6, k: o.k ?? .55 }), wp = V3(), p0 = Lp ? Lp.intensity : 0; actor.userData.lantern = { g, hand };
    g.userData.tick = t => { if (!spot.parent && actor.parent) actor.parent.add(spot); g.getWorldPosition(wp); const f = fire(t * .7, 4); spot.position.set(wp.x, (o.y ?? actor.position.y) + .06, wp.z); spot.material.opacity = spot.userData.k * f; hl.material.opacity = .75 * f; if (Lp) Lp.intensity = p0 * f; };
    g.userData.spot = spot; g.userData.light = Lp; return live(g); };
  D.lanternPose = (actor, lift = 1) => { const L = actor.userData.lantern; if (!L) return; const J = actor.userData.J, a = J['arm' + L.hand], f = J['fore' + L.hand], sx = L.hand === 'L' ? 1 : -1; a.rotation.set(-.5 * lift, 0, sx * .18); f.rotation.x = -.75 * lift; L.g.rotation.x = -(a.rotation.x + f.rotation.x) + Math.sin(performance.now() * .004) * .06; };
  D.candles = (o = {}) => { const n = o.n || 5, len = o.len ?? 1.2, g = new THREE.Group(), G = geo(), F = geo(), wax = T.plaster ? T.plaster({ frame: 'none', c: '#e8dcc0' }) : '#e8dcc0';
    for (let i = 0; i < n; i++) { const x = n > 1 ? (i / (n - 1) - .5) * len : 0, h = (o.h || .22) * (.6 + hash(i, o.seed || 0) * .7), z = (hash(i, 3) - .5) * .12; G.at(TR(x, 0, z)).loft(5, [[0, .028, .028, 0, .8], [h, .024, .024, .3, 1]], { cap: 'top' }).at(null);
      for (const a of [0, PI / 2]) F.at(TR(x, h, z, a)).quad([-.03, 0, 0], [.03, 0, 0], [.03, .09, 0], [-.03, .09, 0]).at(null); const hl = D.halo({ c: '#ffc060', r: .2, k: .6, flicker: 'fire', seed: i + (o.seed || 0) }); hl.position.set(x, h + .06, z); g.add(hl); }
    const fm = dyn(new THREE.Mesh(F.build(), new THREE.MeshBasicMaterial({ map: flameF()[0], alphaTest: .5, side: THREE.DoubleSide, fog: false }))); fm.userData.tick = t => { fm.material.map = flameF()[Math.floor(t * 8) % 4]; }; live(fm); g.add(G.mesh(wax), fm);
    if (o.light) { const Lp = new THREE.PointLight('#ffb860', o.power || 5, o.range || 5, 1.6); Lp.position.y = .3; g.add(Lp); } return g; };
  D.brazier = (o = {}) => { const s = o.s || 1, g = new THREE.Group(), P = parts(), It = P.g(T.metal ? T.metal({ c: '#4e5066' }) : '#4e5066', { side: true }), c = o.c || '#ffa040';
    for (let k = 0; k < 3; k++) It.at(TR(0, 0, 0, k * TAU / 3).multiply(TR(.3 * s, 0, 0, 0, 0, .28))).box(.05 * s, .95 * s, .05 * s, 0, 0, 0, { top: false }).at(null);
    It.loft(8, [[.78 * s, .12 * s, .12 * s, 0, .7], [.9 * s, .3 * s, .3 * s, .5, .9], [1.06 * s, .36 * s, .36 * s, 1, 1.05]], { cap: 'bot' }); g.add(P.group());
    const fl = D.flame({ s: 1.15 * s, seed: o.seed }); fl.position.y = 1 * s; const hl = D.halo({ c, r: 1.1 * s, k: .7, flicker: 'fire', seed: o.seed || 3 }); hl.position.y = 1.3 * s; g.add(fl, hl); const sp = D.spot({ c, r: (o.r || 3.4) * s, k: .5, flicker: 'fire', seed: o.seed || 3 }); g.add(sp);
    if (o.light) { const Lp = dyn(new THREE.PointLight(c, o.power || 12, o.range || 9, 1.5)); Lp.position.y = 1.4 * s; const p0 = Lp.intensity; Lp.userData.tick = t => { Lp.intensity = p0 * fire(t, o.seed || 3); }; live(Lp); g.add(Lp); g.userData.light = Lp; } return g; };
  D.windowLight = (o = {}) => { const kind = o.kind || 'lancet', w = o.w || (kind === 'rose' ? 1.5 : .8), h = o.h || (kind === 'rose' ? w : 1.6), c = o.c || '#ffc468', k = o.k ?? 1, g = new THREE.Group(), G = geo().quad([-w / 2, 0, .03], [w / 2, 0, .03], [w / 2, h, .03], [-w / 2, h, .03]);
    g.add(G.mesh(kind === 'rect' ? T.window({ lit: 1, bars: 'grid' }) : tex.glass({ kind, lit: 1, seed: o.seed }), { glow: true, offset: true })); const L = [{ p: [0, h / 2, .04], n: [0, 0, 1], r: w * 1.1 + .5, r2: h * .62 + .5, c, k: .5 * k }]; if (o.pool !== 0) L.push({ p: [0, -(o.y ?? 1.2) + .02, (o.pool || 2.2) * .62], r: (o.pool || 2.2) * .8, r2: o.pool || 2.2, c, k: .6 * k }); g.add(D.pools(L)); return g; };
  D.warnLamp = (o = {}) => { const c = o.c || '#ff4030', r = o.r || .16, spin = (o.kind || 'spin') === 'spin', g = new THREE.Group(), P = parts(); P.g(T.metal ? T.metal({ c: '#4a4c5c' }) : '#4a4c5c').loft(6, [[0, r * 1.2, r * 1.2, 0, .8], [r * .5, r * 1.2, r * 1.2, 1, 1]], { cap: 'top' }); P.g(mat(c, { glow: true })).loft(6, [[r * .5, r, r, 0], [r * 1.7, r * .85, r * .85, 1], [r * 2, r * .3, r * .3, 1]], { cap: 'top' }); g.add(P.group());
    const hl = D.halo({ c, r: r * 5, k: .8 }); hl.position.y = r * 1.2; g.add(hl); const B = geo(); for (const s of [1, -1]) B.tri([0, r * 1.2, 0], [s * 4.5, r * 1.2 + .7, 0], [s * 4.5, r * 1.2 - .7, 0], [.5, .1], [0, 1], [1, 1], [1, .0, .0]);
    const beam = dyn(new THREE.Mesh(B.build(), new THREE.MeshBasicMaterial({ color: c, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide, fog: false }))); beam.visible = spin; g.add(beam); let Lp = null; if (o.light) { Lp = new THREE.PointLight(c, o.power || 8, o.range || 9, 1.5); Lp.position.y = r * 1.4; g.add(Lp); }
    const p0 = Lp ? Lp.intensity : 0, sp = o.speed || 3.2, sd = o.seed || 0; beam.userData.tick = t => { const k = spin ? .7 + .3 * Math.sin(t * sp + sd) : (Math.sin(t * sp * 1.4 + sd) > 0 ? 1 : .12); beam.rotation.y = t * sp + sd; hl.material.opacity = .8 * k; if (Lp) Lp.intensity = p0 * k; }; live(beam); g.userData.light = Lp; return g; };
  D.exitLamp = (o = {}) => { const c = o.c || '#58e8a0', w = o.w || .5, g = new THREE.Group(), P = parts(); P.g(T.metal ? T.metal({ c: '#3e4252' }) : '#3e4252').box(w + .06, w * .46, .08, 0, 0, .04, {}); const Pp = Px(16, 8); Pp.fill(c); Pp.rect(0, 0, 16, 1, '#ffffff'); Pp.bits(3, 2, ['  #  ##  ', ' ##  ####', '###  ##  ', ' ##  ##  '], { '#': mix(c, '#083020', .7) });
    P.g(T.from(Pp, { m: 1 }), { glow: true }).quad([-w / 2, .03, .09], [w / 2, .03, .09], [w / 2, w * .43, .09], [-w / 2, w * .43, .09]); g.add(P.group(), D.pools([{ p: [0, -.5, .02], n: [0, 0, 1], r: 1, r2: 1.2, c, k: .4 }])); const hl = D.halo({ c, r: .6, k: .5 }); hl.position.set(0, w * .22, .15); g.add(hl); return g; };
  D.bulb = (o = {}) => { const drop = o.drop ?? .6, c = o.c || '#ffd890', g = new THREE.Group(), P = parts(); P.g(T.metal ? T.metal({ c: '#3a3c48' }) : '#3a3c48').box(.012, drop, .012, 0, -drop, 0, { top: false }).loft(5, [[-drop - .05, .035, .035, 0, .8], [-drop, .02, .02, 1, 1]], {}); P.g(mat(c, { glow: true })).loft(5, [[-drop - .15, .02, .02, 0], [-drop - .11, .05, .05, .5], [-drop - .05, .032, .032, 1]], { cap: 'bot' }); g.add(P.group());
    const fk = o.flicker !== false ? 'bulb' : 0, hl = D.halo({ c, r: o.halo || .5, k: .8, flicker: fk, seed: o.seed || 1 }); hl.position.y = -drop - .1; g.add(hl); if (o.light) { const Lp = dyn(new THREE.PointLight(c, o.power || 7, o.range || 7, 1.5)); Lp.position.y = -drop - .15; const p0 = Lp.intensity; if (fk) { Lp.userData.tick = t => { Lp.intensity = p0 * flick(t, o.seed || 1); }; live(Lp); } g.add(Lp); g.userData.light = Lp; } return g; };

  // ================= 5. 天気と空気 =================
  D.rain = (o = {}) => { const n = o.n || 700, [W, H, Dp] = o.box || [26, 13, 26], sp = o.speed || 24, sl = o.slant || [.3, .1], ln = o.len || .7, pos = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const l = dyn(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: o.c || '#b4c6f4', transparent: true, opacity: o.a ?? .42, fog: false }))); l.frustumCulled = false;
    l.userData.tick = (t, cam) => { if (!cam) return; const cx = cam.position.x, cz = cam.position.z; for (let i = 0; i < n; i++) { const y = H - md(t * sp * (.8 + hash(i, 3) * .4) + hash(i, 4) * H, H), x = cx + md(hash(i, 1) * W - cx + sl[0] * y, W) - W / 2, z = cz + md(hash(i, 2) * Dp - cz + sl[1] * y, Dp) - Dp / 2, j = i * 6; pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; pos[j + 3] = x + sl[0] * ln; pos[j + 4] = y + ln; pos[j + 5] = z + sl[1] * ln; } g.attributes.position.needsUpdate = true; }; return live(l); };
  // 地をはう霧：やわらかい かたまりを、カメラのまわりの地面に しきつめて流す（カメラのほうを向く。近すぎる物と はしの物は消す）
  D.groundFog = (o = {}) => { const n = o.n || 46, [W, Dp] = o.box || [56, 56], y0 = o.y ?? .1, h = o.h || 1.5, w = o.w || 8, al = o.a ?? .34, wind = o.wind || [.5, .15], col = lin(o.c || '#c8d8e0'), Hf = o.H || null;
    const m = quads(n, new THREE.MeshBasicMaterial({ map: fogT(), vertexColors: true, transparent: true, depthWrite: false, fog: false }), true), rt = V3();
    m.userData.tick = (t, cam) => { if (!cam) return; const cx = cam.position.x, cz = cam.position.z; rt.setFromMatrixColumn(cam.matrixWorld, 0); rt.y = 0; rt.normalize();
      for (let i = 0; i < n; i++) { const x = cx + md(hash(i, 1) * W + wind[0] * t * (.7 + hash(i, 5) * .6) - cx, W) - W / 2, z = cz + md(hash(i, 2) * Dp + wind[1] * t - cz, Dp) - Dp / 2, dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz), ww = w * (.6 + hash(i, 3) * .8) / 2, hh = h * (.7 + hash(i, 4) * .7), yb = (Hf ? Hf(x, z) : 0) + y0 + Math.sin(t * .4 + i) * .06;
        const A = al * cl((d - 3) / 5) * cl((1 - Math.abs(dx) / (W / 2)) * 5) * cl((1 - Math.abs(dz) / (Dp / 2)) * 5) * (.75 + .25 * Math.sin(t * .5 + i * 2.1));
        m.userData.put(i, [x - rt.x * ww, yb, z - rt.z * ww], [x + rt.x * ww, yb, z + rt.z * ww], [x + rt.x * ww, yb + hh, z + rt.z * ww], [x - rt.x * ww, yb + hh, z - rt.z * ww], col, A); } m.userData.flush(); };
    m.renderOrder = 3; return live(m); };
  D.flakes = (o = {}) => { const kind = o.kind || 'ash', n = o.n || 260, [W, H, Dp] = o.box || [24, 10, 24], em = kind === 'ember', vy = o.vy ?? (em ? 1.3 : kind === 'dust' ? .08 : kind === 'snow' ? -1 : -.7), pos = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = dyn(new THREE.Points(g, new THREE.PointsMaterial({ color: o.c || (em ? '#ffa040' : kind === 'snow' ? '#e8f0ff' : kind === 'dust' ? '#c8d0e0' : '#b8b4b0'), size: o.size || (em ? 2 : 1.6), sizeAttenuation: false, transparent: true, opacity: o.a ?? (em ? 1 : .8), blending: em ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, fog: false }))); p.frustumCulled = false;
    p.userData.tick = (t, cam) => { if (!cam) return; const cx = cam.position.x, cz = cam.position.z; for (let i = 0; i < n; i++) { const y = md(hash(i, 4) * H + t * vy * (.6 + hash(i, 3) * .8), H), sw = Math.sin(t * (.6 + hash(i, 6)) + i) * (em ? .5 : .8); pos[i * 3] = cx + md(hash(i, 1) * W + sw + (o.wind ? o.wind[0] * t : 0) - cx, W) - W / 2; pos[i * 3 + 1] = y + (o.y || 0); pos[i * 3 + 2] = cz + md(hash(i, 2) * Dp + Math.cos(t * .5 + i * 1.3) * .5 + (o.wind ? o.wind[1] * t : 0) - cz, Dp) - Dp / 2; } g.attributes.position.needsUpdate = true; }; return live(p); };
  D.clouds = (o = {}) => { const n = o.n || 9, r = o.r || 260, g = dyn(new THREE.Group()), sp = o.speed ?? .012, sd = o.seed || 0; for (let i = 0; i < n; i++) { const c = R.cloud({ s: (o.s || 80) * (.7 + hash(i, sd + 8) * .7), c: o.c || '#46527a', shade: o.shade || '#262e4e', seed: i + sd }), a = i / n * TAU + hash(i, sd + 2) * .5, y = (o.y || 70) * (.55 + hash(i, sd + 9) * .9); c.position.set(Math.sin(a) * r, y, -Math.cos(a) * r); c.lookAt(0, y * .5, 0); g.add(c); }
    g.userData.tick = (t, cam) => { g.rotation.y = (o.phase || 0) + t * sp; if (cam) g.position.set(cam.position.x, 0, cam.position.z); }; return live(g); };
  D.moon = (o = {}) => { const r = o.r || 28, dist = o.dist || 330, az = (o.az ?? -20) * PI / 180, el = (o.el ?? 26) * PI / 180, c = o.c || (o.red ? '#f0a088' : '#eaf6f0'), dir = V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)), g = dyn(new THREE.Group());
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: tex.moon({ c, shade: o.shade || (o.red ? '#8a3a40' : undefined) }), alphaTest: .5, fog: false, depthWrite: false })), hl = D.halo({ c: o.haloC || mix(c, o.red ? '#ff5040' : '#60d0d0', .45), r: r * (o.halo ?? 2.6), k: o.k ?? .5 }); disc.renderOrder = -8; hl.renderOrder = -9;
    disc.position.copy(dir).multiplyScalar(dist); hl.position.copy(disc.position); disc.lookAt(0, 0, 0); g.add(hl, disc); g.userData.dir = dir; g.userData.tick = (t, cam) => { if (cam) g.position.copy(cam.position); }; return live(g); };
  D.shaft = (o = {}) => { const w = o.w || 3, h = o.h || 12, ln = o.lean || [0, 0], G = geo(), c = lin(o.c || '#c8e0ff').map(v => v * (o.a ?? .25)); for (const a of [0, PI / 2]) { const cx = Math.cos(a) * w / 2, cz = Math.sin(a) * w / 2; G.quad([-cx, 0, -cz], [cx, 0, cz], [cx * .5 + ln[0], h, cz * .5 + ln[1]], [-cx * .5 + ln[0], h, -cz * .5 + ln[1]], [0, 1, 1, 0], c); }
    const m = dyn(new THREE.Mesh(G.build(), addMat(shaftT()))); m.castShadow = false; m.userData.tick = t => { m.material.opacity = .85 + .15 * Math.sin(t * .7); }; return live(m); };

  // ================= 6. 不気味な小物 =================
  // 墓石と墓標。正面（+z）に tex.grave、横と うらは黒ずんだ石。lean / leanX でかたむける
  D.grave = (o = {}) => { const kind = o.kind || 'round', s = o.s || 1, sd = o.seed || 0, c = o.c || '#7c8296', B = parts(), F = B.g(tex.grave({ c, seed: sd % 7, moss: o.moss })), S = B.g(tex.stone({ c: mix(c, '#3a3e58', .2), moss: .6, seed: sd % 5, m: 1.5 })), g = new THREE.Group(), inn = new THREE.Group();
    let w = (o.w || .62) * s, h = (o.h || 1.05) * s; const th = .16 * s;
    if (kind === 'obelisk') S.loft(4, [[0, w * .55, w * .55, 0, .8], [.2 * s, w * .55, w * .55, .15, .95], [.2 * s, w * .36, w * .36, .15, .85], [h * 1.7, w * .22, w * .22, 1.2, 1.05], [h * 1.7 + w * .35, .01, .01, 1.35, 1.12]], {});
    else if (kind === 'post') { const W = B.g(tex.plank({ c: '#6a5a58' })); W.box(.09 * s, h * 1.1, .09 * s, 0, 0, 0, { m: 1 }); W.at(TR(0, h * .78, .05 * s, 0, 0, .12)).box(w * .9, .2 * s, .04 * s, 0, 0, 0, { m: 1 }).at(null); }
    else { if (kind === 'slab') { w *= 1.25; h *= .6; } if (kind === 'disc') w *= .7;
      const pts = [[-w / 2, 0], [w / 2, 0]], hs = kind === 'round' ? h - w / 2 : kind === 'point' ? h - w * .4 : kind === 'disc' ? h * .62 : h;
      if (kind === 'round') for (let k = 0; k <= 6; k++) { const a = k / 6 * PI; pts.push([Math.cos(a) * w / 2, hs + Math.sin(a) * w / 2]); }
      else if (kind === 'point') pts.push([w / 2, hs], [0, h], [-w / 2, hs]);
      else if (kind === 'disc') { pts.push([w / 2, hs]); for (let k = 0; k <= 8; k++) { const a = -PI * .3 + k / 8 * PI * 1.6; pts.push([Math.cos(a) * w * .72, hs + w * .55 + Math.sin(a) * w * .72]); } pts.push([-w / 2, hs]); }
      else pts.push([w / 2, hs], [-w / 2, hs]);
      const H = Math.max(...pts.map(p => p[1])), W2 = Math.max(...pts.map(p => Math.abs(p[0]))) * 2, uv = p => [p[0] / W2 + .5, p[1] / H], cen = [0, H * .45], n = pts.length;
      for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; F.tri([0, cen[1], th / 2], [a[0], a[1], th / 2], [b[0], b[1], th / 2], uv(cen), uv(a), uv(b)); F.tri([0, cen[1], -th / 2], [b[0], b[1], -th / 2], [a[0], a[1], -th / 2], uv(cen), uv(b), uv(a), .8); if (i) S.quad([a[0], a[1], th / 2], [a[0], a[1], -th / 2], [b[0], b[1], -th / 2], [b[0], b[1], th / 2], [0, 0, .1, .3], .85); }
      S.box(w * 1.25, .1 * s, th * 2.4, 0, 0, 0, { m: 1.5 }); }
    inn.add(B.group()); inn.rotation.set(o.leanX || 0, 0, o.lean || 0); inn.position.y = -.03; g.add(inn); return g; };
  D.graves = (o = {}) => { const n = o.n || 12, [W, Dp] = o.area || [16, 12], sd = o.seed || 0, g = new THREE.Group(), kinds = o.kinds || ['round', 'round', 'point', 'slab', 'disc', 'round', 'obelisk', 'point', 'post'], cols = Math.ceil(Math.sqrt(n * W / Dp)), rows = Math.ceil(n / cols); g.userData.at = [];
    for (let i = 0; i < n; i++) { const x = ((i % cols) + .5) / cols * W - W / 2 + (hash(i, sd, 1) - .5) * W / cols * .5, z = (Math.floor(i / cols) + .5) / rows * Dp - Dp / 2 + (hash(i, sd, 2) - .5) * Dp / rows * .4; if (o.keep && o.keep(x, z) === false) continue;
      const q = D.grave({ kind: kinds[Math.floor(hash(i, sd, 3) * kinds.length)], s: .9 + hash(i, sd, 4) * .5, seed: i + sd, lean: (hash(i, sd, 5) - .5) * .5, leanX: (hash(i, sd, 6) - .5) * .3, c: o.c }); q.position.set(x, o.H ? o.H(x, z) : 0, z); q.rotation.y = (o.ry || 0) + (hash(i, sd, 7) - .5) * .5; g.add(q); g.userData.at.push([x, z]); } return g; };
  // 台座つきの石の像。angel＝うつむいた衣の人に、片方が欠けたつばさ。knight＝かぶとの人が、剣を地につく
  D.statue = (o = {}) => { const s = o.s || 1, kn = o.kind === 'knight', c = o.c || '#8a90a8', G = geo().smooth(1), st = tex.stone({ c, moss: .5, m: 1.6, seed: o.seed }), g = new THREE.Group(), R6 = (y, a, b, sh, oz = 0) => [y * s, a * s, b * s, y / 1.6, sh, 0, oz * s];
    G.smooth(0).box(.95 * s, .5 * s, .95 * s, 0, 0, 0, { m: 1.6 }).box(.75 * s, .12 * s, .75 * s, 0, .5 * s, 0, { m: 1.6 }).smooth(1);
    if (kn) { G.loft(6, [R6(.62, .2, .16, .8), R6(1.25, .19, .15, .9), R6(1.5, .3, .19, 1), R6(1.78, .33, .2, 1.05), R6(1.86, .12, .1, 1)], {}).loft(6, [R6(1.84, .1, .1, .9), R6(1.95, .15, .16, 1), R6(2.1, .15, .16, 1.05), R6(2.24, .04, .04, 1.1)], { cap: 'top' });
      G.smooth(0).box(.07 * s, 1.05 * s, .04 * s, 0, .62 * s, .26 * s, { m: 1.6 }).box(.34 * s, .06 * s, .06 * s, 0, 1.55 * s, .26 * s, { m: 1.6 }); for (const sx of [-1, 1]) G.at(TR(sx * .3 * s, 1.72 * s, .06 * s, 0, -.6, sx * .55)).box(.11 * s, .42 * s, .11 * s, 0, -.42 * s, 0, { m: 1.6 }).at(null); }
    else { G.loft(6, [R6(.62, .34, .28, .78), R6(1.1, .25, .21, .9), R6(1.55, .2, .16, 1), R6(1.82, .25, .17, 1.05), R6(1.92, .1, .09, 1, .03)], {}).loft(6, [R6(1.9, .07, .07, .9, .05), R6(2, .12, .12, 1, .08), R6(2.14, .11, .12, 1.05, .09), R6(2.22, .04, .04, 1.1, .08)], { cap: 'top' });
      G.smooth(0).box(.2 * s, .12 * s, .1 * s, 0, 1.52 * s, .17 * s, { m: 1.6 }); const wing = (sx, k) => G.quad([sx * .12 * s, 1.75 * s, -.16 * s], [sx * (.12 + .75 * k) * s, (1.75 + .6 * k) * s, -.32 * s], [sx * (.12 + .6 * k) * s, (1.75 - .75 * k) * s, -.3 * s], [sx * .14 * s, 1.05 * s, -.18 * s], [0, 0, .5, .6], sx > 0 ? 1 : .9);
      G.normal([0, .5, .85]); wing(-1, 1); wing(1, o.broken === false ? 1 : .38); G.normal(null); }
    g.add(G.mesh(st, { side: true })); g.userData.h = 2.24 * s; return g; };
  D.column = (o = {}) => { const h = o.h || 3, r = o.r || .35, st = tex.stone({ c: o.c || '#7a7e98', moss: .5, m: 1.5, seed: o.seed }), G = geo().smooth(1), g = new THREE.Group();
    G.smooth(0).box(r * 3, .28, r * 3, 0, 0, 0, { m: 1.5 }).smooth(1).loft(8, [[.28, r * 1.25, r * 1.25, 0, .85], [.5, r, r, .15, .95], [h * .6, r * .92, r * .92, h * .4, 1], [h, r * .88, r * .88, h * .66, 1.05, o.broken === false ? 0 : r * .12], [h + (o.broken === false ? .25 : .32), r * (o.broken === false ? 1.3 : .35), r * (o.broken === false ? 1.3 : .5), h * .7, 1.05, o.broken === false ? 0 : r * .4]], { cap: 'top', ur: 2 });
    if (o.broken !== false && o.fallen !== false) G.at(TR(r * 3.2, r * .88, r * 1.4, .5, 0, PI / 2)).loft(8, [[-.7, r * .88, r * .88, 0, .85], [.7, r * .88, r * .88, .9, 1]], { cap: 'both', ur: 2 }).at(null);
    g.add(G.mesh(st)); return g; };
  D.fence = (o = {}) => { const len = o.len || 6, h = o.h || 1.5, B = parts(), g = new THREE.Group(), inn = new THREE.Group(), F = B.g(tex.fence({ c: o.c, seed: o.seed }), { side: true }), Pm = B.g(tex.stone({ c: o.postC || '#6e728c', m: 1.5 })), n = Math.max(1, Math.round(len / 3));
    F.normal([0, .6, .8]).quad([-len / 2, 0, 0], [len / 2, 0, 0], [len / 2, h, 0], [-len / 2, h, 0], [0, 0, Math.max(1, Math.round(len)), 1]).normal(null);
    if (o.posts !== false) for (let i = 0; i <= n; i++) Pm.at(TR(-len / 2 + i * len / n, 0, 0)).loft(4, [[0, .17, .17, 0, .8], [h + .08, .15, .15, .8, 1], [h + .08, .21, .21, .8, 1.05], [h + .4, .02, .02, 1, 1.1]], {}).at(null);
    inn.add(B.group()); inn.rotation.x = o.lean || 0; g.add(inn); return g; };
  D.gate = (o = {}) => { const w = o.w || 2.4, h = o.h || 2.6, a = (o.open ?? .5) * 1.3, B = parts(), g = new THREE.Group(), F = B.g(tex.fence({ c: o.c }), { side: true }), Pm = B.g(TX(o.stone, tex.stone, { c: '#6e728c', m: 1.5 }));
    for (const sx of [-1, 1]) { Pm.at(TR(sx * (w / 2 + .3), 0, 0)).loft(4, [[0, .36, .36, 0, .8], [h, .32, .32, h / 1.5, 1], [h, .42, .42, h / 1.5, 1.05], [h + .22, .42, .42, h / 1.5 + .1, 1.05], [h + .7, .03, .03, h / 1.5 + .3, 1.12]], {}).at(null);
      F.at(TR(sx * w / 2, 0, 0, sx * a)).normal([0, .6, .8]).quad([sx < 0 ? 0 : -w / 2, 0, 0], [sx < 0 ? w / 2 : 0, 0, 0], [sx < 0 ? w / 2 : 0, h * .86, 0], [sx < 0 ? 0 : -w / 2, h * .86, 0], [0, 0, 1, 1]).normal(null).at(null); }
    g.add(B.group()); return g; };
  // 枯れ木。まがった幹から、枝が 2〜3 段に分かれる。userData.perch ＝ 太い枝の先（からすを とまらせる）
  D.deadTree = (o = {}) => { const h = o.h || 6, r = o.r || h * .05, sd = o.seed || 0, md2 = o.twigs ?? 2, G = geo().smooth(1), bark = TX(o.c, T.bark, { c: '#5a5262' }), g = new THREE.Group(), perch = [];
    const branch = (M, len, rad, dep, s) => { const bx = (hash(s, 1) - .5) * .5 * len, bz = (hash(s, 2) - .5) * .5 * len; G.at(M).loft(dep ? 4 : 6, [[0, rad * (dep ? 1 : 1.5), rad * (dep ? 1 : 1.5), 0, .8], [len * .12, rad, rad, len * .08, .9, bx * .05, bz * .05], [len * .55, rad * .66, rad * .66, len * .37, 1, bx * .6, bz * .6], [len, rad * .22, rad * .22, len * .66, 1.08, bx, bz]], { cap: 'top' }).at(null);
      if (dep === 1) perch.push(V3(bx * .6, len * .55 + rad * .6, bz * .6).applyMatrix4(M)); if (dep >= md2) return; const k = dep ? 2 : 3 + Math.floor(hash(s, 3) * 2);
      for (let i = 0; i < k; i++) { const f = dep ? .4 + i * .35 : .42 + i * .5 / k + hash(s, i, 4) * .08, ry = hash(s, i, 5) * TAU + i * 2.2, tilt = .55 + hash(s, i, 6) * .65; branch(M.clone().multiply(TR(bx * f, len * f, bz * f, ry, tilt)), len * (dep ? .5 : .42 + hash(s, i, 7) * .2), rad * (dep ? .5 : .46), dep + 1, s * 7 + i + 1); } };
    branch(TR(0, 0, 0, hash(sd, 9) * TAU, (hash(sd, 8) - .5) * .2), h, r, 0, sd + 1); g.add(G.mesh(bark)); g.userData.perch = perch; return g; };
  D.thorns = (o = {}) => { const len = o.len || 3, h = o.h || 1, G = geo(), t = tex.thorn({ c: o.c, seed: o.seed }); G.normal([0, .7, .7]); for (const [z, lz, k] of [[-.18, .25, 0], [.16, -.3, .37], [0, 0, .7]]) G.quad([-len / 2, 0, z], [len / 2, 0, z], [len / 2, h, z + lz], [-len / 2, h, z + lz], [k, 0, k + len / 2, 1]); return G.mesh(t, { side: true }); };
  D.web = (o = {}) => { const s = o.s || 1; return geo().normal([0, .5, .8]).quad([0, -s, 0], [s, -s, 0], [s, 0, 0], [0, 0, 0]).mesh(tex.web({ c: o.c }), { side: true }); };
  D.chain = (o = {}) => { const len = o.len || 2, m = geo().normal([0, .5, .8]).quad([-.05, -len, 0], [.05, -len, 0], [.05, 0, 0], [-.05, 0, 0], [0, 0, 1, len / .2]).mesh(tex.chain({ c: o.c }), { side: true }); if (o.sway) { dyn(m); m.userData.tick = t => { m.rotation.z = Math.sin(t * 1.1 + (o.seed || 0)) * o.sway; }; live(m); } return m; };
  D.bier = (o = {}) => { const s = o.s || 1, st = tex.stone({ c: o.c || '#7a7e98', moss: .4, m: 1.5, seed: o.seed }), G = geo(), g = new THREE.Group(), pts = [[-.3, -1], [.3, -1], [.46, -.42], [.28, 1], [-.28, 1], [-.46, -.42]].map(p => [p[0] * s, p[1] * s]), y0 = .5 * s, y1 = .82 * s;
    G.box(1.25 * s, .5 * s, 2.4 * s, 0, 0, 0, { m: 1.5, c0: .8 }); for (let i = 0; i < 6; i++) { const a = pts[i], b = pts[(i + 1) % 6]; G.quad([b[0], y0, -b[1]], [a[0], y0, -a[1]], [a[0] * .92, y1, -a[1] * .95], [b[0] * .92, y1, -b[1] * .95], [0, 0, .4, .2], .85); G.tri([0, y1, 0], [b[0] * .92, y1, -b[1] * .95], [a[0] * .92, y1, -a[1] * .95], [.5, .5], [.5 + b[0], .5 + b[1] * .4], [.5 + a[0], .5 + a[1] * .4], 1.05); } g.add(G.mesh(st, { side: true })); return g; };
  D.scarecrow = (o = {}) => { const s = o.s || 1, B = parts(), g = new THREE.Group(), W = B.g(tex.plank({ c: '#6a5a58' })), C = B.g(T.fabric({ pattern: 'plain', c: o.c || '#5a4a6a' }), { side: true }), Hd = B.g(T.fabric({ pattern: 'plain', c: '#b8a888' })), St = B.g(T.tuft({ kind: 'wheat' }), { side: true });
    W.box(.08 * s, 1.95 * s, .08 * s, 0, 0, 0, { m: 1 }); W.at(TR(0, 1.38 * s, 0, 0, 0, .08)).box(1.4 * s, .07 * s, .07 * s, 0, 0, 0, { m: 1 }).at(null);
    C.smooth(1).loft(6, [[.72 * s, .3 * s, .2 * s, 0, .75], [1.05 * s, .2 * s, .15 * s, .4, .9], [1.42 * s, .24 * s, .16 * s, .9, 1], [1.5 * s, .08 * s, .07 * s, 1, 1]], {}); for (const sx of [-1, 1]) C.at(TR(sx * .2 * s, 1.44 * s, 0, 0, 0, sx * (PI / 2 - .08) + .08)).loft(5, [[0, .09 * s, .08 * s, 0, .95], [.48 * s, .11 * s, .09 * s, .6, .85]], {}).at(null);
    Hd.smooth(1).loft(6, [[1.48 * s, .08 * s, .08 * s, 0, .8], [1.6 * s, .15 * s, .14 * s, .4, 1], [1.76 * s, .14 * s, .13 * s, .8, 1.05], [1.84 * s, .05 * s, .05 * s, 1, 1.05]], { cap: 'top' }); C.loft(8, [[1.78 * s, .32 * s, .32 * s, 0, .8], [1.84 * s, .15 * s, .15 * s, .3, .95], [2.08 * s, .03 * s, .03 * s, 1, 1.05, .05 * s]], {});
    for (const sx of [-1, 1]) St.normal([0, .6, .8]).quad([sx * .62 * s, 1.18 * s, 0], [sx * .88 * s, 1.18 * s, 0], [sx * .88 * s, 1.5 * s, 0], [sx * .62 * s, 1.5 * s, 0]).normal(null); g.add(B.group()); g.rotation.z = .06; return g; };
  D.wreckCart = (o = {}) => { const B = parts(), g = new THREE.Group(), W = B.g(tex.plank({ c: o.c || '#5e525e' }), { side: true }), Wh = B.g(T.wheel({ kind: 'wood' }), { side: true }), M = TR(0, .42, 0, 0, .05, .2);
    W.at(M).box(2.3, .12, 1.3, 0, 0, 0, { m: 1.6 }); for (const z of [-1, 1]) W.box(2.3, .7, .07, 0, .12, z * .62, { m: 1.6, top: false }); W.box(.07, .7, 1.24, -1.12, .12, 0, { m: 1.6, top: false }); for (const [x, z, hh] of [[-1.05, -.58, 1.5], [-1.05, .58, 1.1], [1.05, -.58, 1.35]]) W.box(.08, hh, .08, x, .8, z, { m: 1.6 }); W.at(M.clone().multiply(TR(1.1, .1, 0, 0, 0, -.35))).box(1.7, .08, .08, .85, 0, 0, { m: 1.6 }).at(null);
    Wh.normal([0, .4, .9]).at(M).quad([-1.3, -.42, .72], [-.2, -.42, .72], [-.2, .68, .72], [-1.3, .68, .72]).at(TR(1.5, .06, 1.2, .4, -PI / 2 + .12)).quad([-.55, -.55, 0], [.55, -.55, 0], [.55, .55, 0], [-.55, .55, 0]).at(null).normal(null); g.add(B.group()); return g; };
  // ゴシックふうの小さな礼拝堂。正面（+z）に とびらと ばら窓、横に とがりアーチの窓、ひかえ壁、左前に尖塔。lit で窓がともり、かべと地面に輪が落ちる
  D.chapel = (o = {}) => { const w = o.w || 5, d = o.d || 8, h = o.h || 4.2, rh = o.roofH || w * .78, st = TX(o.stone, tex.stone, { c: '#70748e' }), rf = TX(o.roof, c => T.roof({ kind: 'slate', ...c }), { c: '#434a6c' }), lit = o.lit ?? 1, B = parts(), G = B.g(st), Rf = B.g(rf, { side: true }), m = st.userData.m || 3, mr = rf.userData.m || 3, hw = w / 2, hd = d / 2, e = .3, yb = h - e * rh / hw, yr = h + rh, sl = Math.hypot(hw + e, rh + e * rh / hw), g = new THREE.Group(), wins = [], pools = [], gc = o.glow || '#ffc468';
    G.box(w, h, d, 0, 0, 0, { m, top: false, c0: .78 }); for (const s of [1, -1]) G.tri([-hw * s, h, hd * s], [hw * s, h, hd * s], [0, yr, hd * s], [0, h / m], [w / m, h / m], [w / 2 / m, yr / m]);
    Rf.quad([hw + e, yb, hd + e], [hw + e, yb, -hd - e], [0, yr, -hd - e], [0, yr, hd + e], [0, 0, (d + 2 * e) / mr, sl / mr], [.85, .85, 1.05, 1.05]).quad([-hw - e, yb, -hd - e], [-hw - e, yb, hd + e], [0, yr, hd + e], [0, yr, -hd - e], [0, 0, (d + 2 * e) / mr, sl / mr], [.85, .85, 1.05, 1.05]);
    const nz = Math.max(2, Math.round(d / 2.6)), Gl = B.g(tex.glass({ kind: 'lancet', lit, seed: 1 }), { glow: lit > 0, offset: true }), wh = Math.min(2, h * .5), wy = h * .3;
    for (const sx of [-1, 1]) { for (let i = 0; i <= nz; i++) G.box(.55, h * .82, .6, sx * (hw + .27), 0, -hd + i * d / nz, { m, taper: [.45, 1], c0: .75 });
      for (let i = 0; i < nz; i++) { const z = -hd + (i + .5) * d / nz, X = sx * (hw + .03); Gl.quad([X, wy, z + sx * .45], [X, wy, z - sx * .45], [X, wy + wh, z - sx * .45], [X, wy + wh, z + sx * .45]); wins.push([X, wy + wh / 2, z, sx]); if (lit) pools.push({ p: [X, wy + wh / 2, z], n: [sx, 0, 0], r: 1, r2: wh * .75, c: gc, k: .42 * lit }, { p: [sx * (hw + 1.9), .02, z], r: 1.7, r2: 1.3, c: gc, k: .5 * lit }); } }
    const dz = hd + .03, rr = Math.min(.95, w * .19), ry = h + rh * .22; B.g(T.door({ arch: 1, style: 'plank', c: o.door || '#4a3c4c', frame: '#8a8ea8' }), { offset: true }).quad([-.75, 0, dz], [.75, 0, dz], [.75, 2.5, dz], [-.75, 2.5, dz]);
    B.g(tex.glass({ kind: 'rose', lit, seed: 2 }), { glow: lit > 0, offset: true }).quad([-rr, ry - rr, dz], [rr, ry - rr, dz], [rr, ry + rr, dz], [-rr, ry + rr, dz]); G.box(2.3, .16, .9, 0, 0, hd + .45, { m }); G.box(1.9, .3, .5, 0, 0, hd + .25, { m });
    if (lit) pools.push({ p: [0, ry, dz], n: [0, 0, 1], r: rr * 1.9, c: gc, k: .45 * lit }, { p: [0, .02, hd + 2.6], r: 2.2, r2: 2.6, c: gc, k: .45 * lit });
    if (o.tower !== false) { const tx = -hw - .75, tz = hd - .95, th = h + rh + 1.6, tw = 1.9; G.box(tw, th, tw, tx, 0, tz, { m, c0: .75 }); G.box(tw + .3, .25, tw + .3, tx, th, tz, { m }); Rf.at(TR(tx, th + .25, tz)).loft(4, [[0, tw * .78, tw * .78, 0, .85], [th * .55, .03, .03, th * .55 / mr, 1.1]], { ur: 2 }).at(null);
      const bt = B.g(tex.glass({ kind: 'lancet', lit: 0, cs: ['#20243a', '#262a44'], seed: 3 }), { offset: true }), by = th - 2.1, tzf = tz + tw / 2 + .03, txl = tx - tw / 2 - .03; bt.quad([tx - .4, by, tzf], [tx + .4, by, tzf], [tx + .4, by + 1.6, tzf], [tx - .4, by + 1.6, tzf]).quad([txl, by, tz - .4], [txl, by, tz + .4], [txl, by + 1.6, tz + .4], [txl, by + 1.6, tz - .4]); g.userData.top = th * 1.55 + .25; }
    g.add(B.group()); if (pools.length) g.add(D.pools(pools)); Object.assign(g.userData, { h: yr, wins, door: [0, 0, hd] }); return g; };

  // ================= 7. 生きもの・影 =================
  D.crow = (o = {}) => R.bird({ c: o.c || '#2e2e40', belly: '#3c3c50', neck: false, s: o.s || 1.5 });
  D.cat = (o = {}) => R.cat({ c: o.c || '#2c2c3a', belly: '#383846', plain: 1, eye: '#f0d040', s: o.s });
  D.perched = (list, o = {}) => { const g = dyn(new THREE.Group()), near = o.near || 4, bs = list.map(([x, y, z, ry = 0]) => { const b = D.crow(o); b.position.set(x, y, z); b.rotation.y = ry; b.userData.home = [x, y, z, ry]; b.userData.fly = -1; g.add(b); return b; }); let last = 0;
    g.userData.tick = t => { const dt = Math.min(.1, Math.max(0, t - last)), w = o.watch ? o.watch.position : null; last = t;
      for (const b of bs) { const [hx, hy, hz, hr] = b.userData.home, dh = w ? Math.hypot(w.x - hx, w.z - hz) : 99;
        if (b.userData.fly < 0) { R.birdPose(b, hy > .5 ? 'stand' : 'peck', t + hr * 3); if (dh < near) b.userData.fly = 0; }
        else { const f = (b.userData.fly += dt), a = hr + 1; b.visible = f < 6; b.position.set(hx + Math.sin(a) * f * 3.4, hy + Math.min(9, f * 2.6 - f * f * .1), hz + Math.cos(a) * f * 3.4); b.rotation.y = a; R.birdPose(b, 'fly', t + hr); if (f > 6 && dh > near * 3) { b.userData.fly = -1; b.visible = true; b.position.set(hx, hy, hz); b.rotation.y = hr; } } } };
    g.userData.birds = bs; return live(g); };
  D.flock = (o = {}) => { const bat = o.kind === 'bat', n = o.n || 9, r = o.r || 9, h = o.h ?? 9, sp = o.speed || (bat ? 1.1 : .5), sz = (o.s || 1) * (bat ? .32 : .55), c = o.center || [0, 0, 0], pos = new Float32Array(n * 18), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = dyn(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: o.c || (bat ? '#1e1c2e' : '#202234'), side: THREE.DoubleSide, fog: o.fog ?? false }))); m.frustumCulled = false; m.userData.center = c;
    m.userData.tick = t => { for (let i = 0; i < n; i++) { const dn = i % 2 ? -1 : 1, a = dn * t * sp * (.7 + hash(i, 1) * .6) + i * 2.4, rr = r * (.45 + hash(i, 2) * .75) * (bat ? 1 + .25 * Math.sin(t * 2.1 + i) : 1), x = c[0] + Math.cos(a) * rr, z = c[2] + Math.sin(a) * rr * .8, y = c[1] + h * (.7 + hash(i, 3) * .5) + Math.sin(t * (bat ? 3.1 : .9) + i * 1.7) * (bat ? .8 : .5), dx = -Math.sin(a) * dn, dz = Math.cos(a) * dn * .8, dl = Math.hypot(dx, dz), fx = dx / dl, fz = dz / dl, wy = Math.sin(t * (bat ? 22 : 9) + i * 2) * sz * .7, wx = -fz * sz, wz = fx * sz, L = sz * .55;
        pos.set([x + fx * L, y, z + fz * L, x - fx * L, y, z - fz * L, x + wx, y + wy, z + wz, x + fx * L, y, z + fz * L, x - wx, y + wy, z - wz, x - fx * L, y, z - fz * L], i * 18); } g.attributes.position.needsUpdate = true; }; return live(m); };
  D.owl = (o = {}) => { const s = o.s || 1.4, g = new THREE.Group(), G = geo().smooth(1), q = (y, a, b, sh) => [y * s, a * s, b * s, y / .47, sh];
    G.loft(6, [q(0, .06, .05, .75), q(.1, .12, .11, .9), q(.25, .13, .12, 1), q(.34, .125, .115, 1), q(.43, .1, .09, 1.05), q(.47, .04, .04, 1.05)], { cap: 'top', rot: 0 }); G.smooth(0); for (const sx of [-1, 1]) G.tri([sx * .05 * s, .44 * s, .02 * s], [sx * .11 * s, .42 * s, .02 * s], [sx * .1 * s, .53 * s, 0], [.1, .9], [.2, .9], [.15, 1]);
    g.add(G.mesh(tex.owl({ c: o.c }), { side: true })); const E = geo(); for (const sx of [-1, 1]) E.quad([sx * .05 * s - .018 * s, .335 * s, .118 * s], [sx * .05 * s + .018 * s, .335 * s, .118 * s], [sx * .05 * s + .018 * s, .37 * s, .118 * s], [sx * .05 * s - .018 * s, .37 * s, .118 * s]);
    const eyes = dyn(E.mesh(o.eye || '#ffd84a', { glow: true, fog: false })); eyes.castShadow = false; eyes.userData.tick = t => { eyes.visible = (t * .37 + (o.seed || 0)) % 1 > .06; g.rotation.z = Math.sin(t * .5) * .04; }; live(eyes); g.add(eyes); return g; };
  // 鬼火：にじむ光の玉が、置いた所のまわりを ゆっくり ただよう。地面に輪が落ちる
  D.wisp = (o = {}) => { const c = o.c || '#8ef0d0', r = o.r || .5, dr = o.drift ?? .6, sd = o.seed || 0, g = dyn(new THREE.Group()), inn = new THREE.Group(), hl = D.halo({ c, r, k: .85 }), core = D.halo({ c: mix(c, '#ffffff', .7), r: r * .32, k: 1 }), sp = D.spot({ c, r: o.pool || r * 3.6, k: o.k ?? .45 }); inn.add(hl, core); g.add(inn, sp);
    let Lp = null; if (o.light) { Lp = new THREE.PointLight(c, o.power || 5, o.range || 6, 1.5); inn.add(Lp); }
    g.userData.tick = t => { const x = Math.sin(t * .5 + sd * 2) * dr + Math.sin(t * 1.3 + sd) * dr * .3, z = Math.cos(t * .37 + sd * 3) * dr, y = Math.sin(t * 1.1 + sd * 1.7) * .22, f = .8 + .2 * Math.sin(t * 5 + sd * 4); inn.position.set(x, y, z); sp.position.set(x, .06 - g.position.y, z); hl.material.opacity = .85 * f; sp.material.opacity = sp.userData.k * f; hl.scale.setScalar(r * 2 * (.9 + .15 * f)); if (Lp) Lp.intensity = (o.power || 5) * f; }; g.userData.light = Lp; return live(g); };
  D.ghost = (o = {}) => { const h = o.h || 1.9, a = o.a ?? .5, m = dyn(new THREE.Mesh(new THREE.PlaneGeometry(h * .5, h), new THREE.MeshBasicMaterial({ map: ghostT(), color: o.c || '#a8e8e0', blending: THREE.AdditiveBlending, transparent: true, opacity: a, depthWrite: false, fog: false }))); m.geometry.translate(0, h / 2, 0); m.renderOrder = 3;
    m.userData.tick = (t, cam) => { if (cam) m.rotation.y = Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z); m.material.opacity = a * (.7 + .3 * Math.sin(t * .9 + (o.seed || 0))); m.scale.x = 1 + Math.sin(t * 1.3) * .04; }; return live(m); };
  D.loomer = (o = {}) => { const w = o.w || 60, h = o.h || 46, g = dyn(new THREE.Group()), body = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.loomer({ c: o.c, seed: o.seed }), alphaTest: .5, fog: false })), ec = o.eye || '#ffd060', gap = (o.gap ?? .16) * w / 2, eyes = [-1, 1].map(sx => { const e = D.halo({ c: ec, r: w * .028, k: 1 }), e2 = D.halo({ c: mix(ec, '#ffffff', .6), r: w * .011, k: 1 }); e.position.set(sx * gap, h * (o.eyeY ?? .7), .5); e2.position.copy(e.position); g.add(e, e2); return [e, e2]; });
    body.position.y = h / 2; g.add(body); g.userData.tick = (t, cam) => { if (cam) g.rotation.y = Math.atan2(cam.position.x - g.position.x, cam.position.z - g.position.z); const b = (t * .11 + (o.seed || 0) * .3) % 1, k = b > .93 ? 0 : .75 + .25 * Math.sin(t * 1.7); for (const [e, e2] of eyes) { e.material.opacity = k; e2.material.opacity = k; } body.position.y = h / 2 + Math.sin(t * .25) * h * .012; }; return live(g); };
  return D;
};
