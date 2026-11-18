/* game-looks-7 方向 A「こまかいローポリ」の部品集。
   箱（BoxGeometry）の組み合わせをやめ、回転体・先細りの管・面取りした箱・でこぼこの多面体で形を作る。面はカクカクのまま（flatShading）、
   色は頂点の色でぬる（下が少し暗く上が少し明るい・面ごとにわずかにちがう）。見本は 01-hill-village-walk.html、全部品の一覧は model-sheet.html。

   ■ 読みこみ方
     <script src="kit.js"></script><script src="model.js"></script>   （importmap と module の script より前に）
     const K = KIT(THREE), M = MODEL(THREE, K);

   ■ 決まり
     ・できあがった物はどれも THREE.Group を返す。足もとが y=0、前は +z。大きさの単位は m（大人 1.62、戸 1.95、1 階 2.7）。
     ・色は '#rrggbb'。どの物も引数 o（省ける）で色・大きさ・形を変えられる。seed を変えると形のゆらぎが変わる。
     ・物 1 つは Mesh 1〜2 つにまとめてある（人と動物だけは関節ごと）。同じ物を多数置くなら scatter()。
     ・影は join() が自動でつける（落とす・受ける）。光は look() を 1 回呼ぶ。

   ■ いつもの光
     look(scene, renderer, mood, o) → { sun, hemi, rim, follow(x, y, z), mood, lit }
        mood: 'morning' | 'noon' | 'evening' | 'dusk' | 'night' | 'mist'。空・霧・太陽とやわらかい影・空の色のまわりこみ・ふちの光をまとめて用意する。
        o = { range: 影の届く広さ(26), fog: [近, 遠](38, 170), dir: 太陽のある向き [x, y, z], map: 影の地図(1024), set: { MOODS の値を上書き } }
        毎コマ follow(主役の x, y, z) を呼ぶ。返り値の lit は「その時間の窓あかりの強さ」（家・街灯・車の lit にそのまま渡す）。mood.cloud = 雲の [上の色, 下の色]
     lit(obj, 強さ)   窓・ランプなど光る面の明るさをあとから変える（0 で消える）

   ■ 人（いちばん大事）
     person(o) → Group                      300〜700 面ほど（ぼうし・リュックをつけると増える）
        age: 'adult' | 'child'   h: 身長   head: 頭の高さ÷身長（大人 .238、子ども .3）   wide: 体の太さ
        skin, hair, top, bottom, shoes: 色   hairStyle: 'short' | 'bob' | 'long' | 'pony' | 'bun' | 'spiky' | 'twin' | 'fringe' | 'none'
        sleeves: 'long' | 'short'   legs: 'pants' | 'shorts' | 'skirt' | 'dress'   socks: 色（false でなし）
        coat: true（すその長い上着）  collar: 色（えり）  belt: 色  buttons: 色
        hat: 'straw' | 'cap' | 'beanie' と hatColor, hatBand   pack: 色（リュック）  scarf: 色（マフラー）  tie: 髪かざりの色  cheek: false でほおの赤みなし
     pose(人, 種類, 位相, 強さ = 1)
        種類: 'walk' | 'run' | 'stand' | 'sit' | 'wave' | 'ride' | 'carry'。腕はひじ、足はひざで曲がる。位相は 2π で 2 歩。
        歩くとき：位相 = 進んだ距離 ÷ 人.userData.rig.stride × π にすると足がすべらない。
        すわるとき：人.position.y = 座面の高さ − 人.userData.seatY（bench の座面は bench.userData.seat）。
        自分で動かすなら 人.userData.rig の { body, torso, head, armL, armR, elbowL, elbowR, legL, legR, kneeL, kneeR, scarf } の rotation を変える。

   ■ 木
     tree(o)      広葉樹   h(5), leaf: 色 または 色の並び, trunk, blobs: 葉のかたまりの数(5), kind: 'round' | 'tall' | 'wide', spread, d: 葉の細かさ(1。遠くは .5), fruit: 実の色, seed
     conifer(o)   針葉樹   h(6), leaf, trunk, tiers: 段の数(4), wide, seg(8。遠くは 6), snow: 雪の色, seed
     bush(o)      しげみ   r(.8), leaf, n(3), flowers: 花や実の色, d, seed
     LEAF         葉の色の組: spring, summer, deep, autumn, gold, sakura, snow, dusk （例 tree({ leaf: M.LEAF.autumn })）

   ■ 家
     house(o)     w(5), d(4), h: 1 階の高さ(2.7), floors(1), roof: 'gable'（切妻）| 'hip'（寄棟）, gableFront, pitch, eave,
                  wall, wall2, roofColor, trim, door, base, chimneyColor: 色   timber: 色（柱を見せる）  shutters: 色（よろい戸）  flowerBox: 色 と flowers: [色…]
                  chimney: false, porch: false, lantern: false, awning: 色（しまのひさし）, windows: 'front' または 面の並び, found: 土台をのばす長さ, lit: 窓あかり, seed
                  土台の石・のきの出た屋根・棟・破風・えんとつ・わくとさんのある窓・戸と取っ手・ふみ石・小屋根・戸口のあかりがつく。
                  userData = { glass: 光る窓の Mesh, size: [w, のきの高さ, d], chimney: えんとつの口 [x, y, z] }

   ■ 小物
     rock(o)                 r, color, n: 個数, moss: こけの色, d, seed
     tufts(list, o)          草のふさを多数。list = [[x, y, z, 大きさ, 色], …]   o = { color, tip }
     flowers(list, o)        花を多数（1 か所に 3 輪）。list = [[x, y, z, 大きさ, 色の番号], …]   o = { colors: [色…], stem }
     fence(pts, o)           折れ線 pts = [[x, z], …] にそうさく。o = { H: 地面の高さの式, h, gap, kind: 'rail' | 'picket', color }
     lamp(o)                 街灯。h(3.2), kind: 'top' | 'arm', color, lit, light: true で本物の点の光
     bench(o)                w, color, metal, seat: 座面の高さ(.42)
     sign(o)                 kind: 'arrow'（道しるべ）| 'hang'（つり看板）| 'board'（立て看板）, color, post, mark
     well(o)                 井戸。stone, wood, roofColor, water
     bridge(o)               そり橋（z の向きにわたる）。len(7), w(2.2), rise(.7), color, rail。userData.y(u) = 板の高さ（u は 0〜1）
     cloud(o)                s, color, shade, n, seed （光を受けない。look().mood.cloud の色を渡すとよい）
     puffs(scene, o)         けむり・ほこり・湯気。→ { emit(x, y, z, { life, size, grow, vx, vy, vz }), update(dt) }

   ■ 動物
     animal('dog' | 'cat' | 'sheep', o)   color, color2, collar: 首輪の色, s: 大きさ, belly: false, socks: false
     gait(動物, 種類, 位相, 強さ)          'walk' | 'run' | 'stand' | 'sit' | 'graze'。歩くときの位相 = 距離 ÷ 動物.userData.rig.stride × π
     bird(o), flap(鳥, 位相, 強さ)         color, belly, beak, s。flap(鳥, 0, 0) で羽をたたんで立つ

   ■ 乗りもの（userData.wheels の各 Mesh を rotation.x で回す）
     car(o)        kind: 'mini' | 'truck', body, roof, trim, lit: ライト, rack: true で屋根に荷物
     bicycle(o)    color, seat, basket: false。 ride(自転車, 人, 進んだ距離) で人を乗せてこがせる
     boat(o)       len(3.4), hull, trim, inside, sail: 帆の色（つけると帆かけ舟）, oars: false。船底が y=0（水に .12 しずめる）。userData.oars
     train(o)      len(8.5), body, upper, roof, stripe, lit, panto: false

   ■ 地面
     ground(H, o) → { mesh, follow(x, z), h(x, z) }     K.terrain をこの方向の色でぬる。H(x, z) は高さの式。h は「三角の面」にぴったりの高さ（物を置くときに使う）
        o = { nx, nz(96。偶数), cell(2), grass: [色…], patch, jit, paths: [{ d: (x, z) => 道からの距離, w, color, edge }], slope: { color, from, to },
              shore: { level, sand, wet, band, mask }, under, high: { y, band, color } }  （色の式だけほしいときは groundColor(o)）
     ribbon(pts, o) → Mesh    道・川など、線にそう帯を地面に重ねる。pts = [[x, z], …]   o = { w, H: ground の h, lift, y, color, edge, ew, close }
     water(o) → Mesh          水面。level, size, color, opacity
     faceH(H, cell)           ground を使わず K.terrain をじかに使うとき用の、面にぴったりの高さの式

   ■ 形を作る道具（自分で新しい物を作るとき。どれも色なしの BufferGeometry を返す）
     cbox(w, h, d, 面取り, { top: [sx, sz] })   面取りした箱（ふつうの箱の代わり）     box(w, h, d)   小さな部品用のただの箱（窓のさん など）
     lathe([[半径, 高さ, ぎざ, ぎざ(高さ)], …], 分割, { sx, sz, rot })   回転体（幹・つぼ・塔・胴）。半径 0 で始めて 0 で終えると閉じる
     tube([[x, y, z], …], 太さ または [太さ…], 分割, { sq, open })     先細りの管（手足・枝・くき・手すり）
     blob(r, { d, j, sx, sy, sz, flat, seed })   でこぼこの多面体（岩・葉・雲・毛）     prism([[x, y], …], 厚み, 面取り)   押し出し（車体の横顔など）
     cyl(上の半径, 下の半径, 高さ, 分割)   cone(r, h, 分割)   gem(r, sx, sy, sz)   8 面の粒（目・ボタン・実）     taper(geo, sx, sz)   上をすぼめる
   ■ 色をぬって、まとめる
     P(geo, 色, x, y, z, { rx, ry, rz, s, sx, sy, sz, grad, jit, top })   色をぬって置く →「色つきの形」。grad = 上下の明暗、jit = 面ごとのゆれ、top = 上の色
                                                                        （渡した形は書きかわる。同じ形を 2 度使うなら geo.clone()）
     join([色つきの形, …], 材質) → Mesh     1 つの Mesh にまとめる。材質は MAT（ふつう）, MAT2（両面）, MATSKY（光を受けない）, glowMat(消えた色, 光る色)
     move(色つきの形, x, y, z, ry, s)     写して動かす      paint(geo, 色, o)   色だけぬる
     scatter(Mesh または Group, [[x, y, z, 向き, 大きさ, 色, たての倍率], …]) → InstancedMesh     同じ物を多数
     shade(色, k)   明るく(+)・暗く(−)     mix(a, b, t)     noise(x, z)   なめらかな乱数     tris(obj)   三角形の数
     例）きのこ:  const g = new THREE.Group(); g.add(M.join([ M.P(M.tube([[0, 0, 0], [.03, .3, 0]], [.09, .06]), '#f4ead6'),
                  M.P(M.lathe([[0, .25], [.3, .28, .06], [.2, .42], [0, .5]], 8), '#d9523c') ]));
*/
window.MODEL = (THREE, K) => {
  const TAU = Math.PI * 2, hash = K.hash;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const col = c => (c && c.isColor) ? c : new THREE.Color(c);
  // 色を明るく(k>0)・暗く(k<0)する。mix(a, b, t) は 2 色の間
  const shade = (c, k) => { const q = col(c).clone(); return k >= 0 ? q.lerp(new THREE.Color(1, 1, 1), k) : q.multiplyScalar(1 + k); };
  const mix = (a, b, t) => col(a).clone().lerp(col(b), t);
  // なめらかな乱数（0〜1）。地面の色むらや形のゆらぎに使う
  const noise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v); };

  // ───────── 材質 ─────────
  // どの部品も「頂点の色＋flatShading」の同じ材質 1 つでぬる（だから 1 つの物を 1 つの Mesh にまとめられる）
  const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .88, metalness: 0 });
  const MAT2 = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .88, metalness: 0, side: THREE.DoubleSide });   // うすい板（葉・帆・草）用。両面
  const MATSKY = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });   // 雲など、光を受けない物
  // 光る面（窓・ランプ）。lit(obj, 0〜1) で明るさを変える
  const glowMat = (off = '#4f6f8a', on = '#ffd88a') => new THREE.MeshStandardMaterial({ color: off, emissive: on, emissiveIntensity: 0, flatShading: true, roughness: .35 });

  // ───────── 形を作る道具（どれも色なしの BufferGeometry を返す） ─────────
  const geoOf = pos => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g; };
  const same = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-7;
  const tri = (out, a, b, c) => { if (same(a, b) || same(b, c) || same(a, c)) return; out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); };
  // 外向きにそろえて 3 角形を足す（原点のまわりの出っぱった形用）
  const triOut = (out, a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (nx * (a[0] + b[0] + c[0]) + ny * (a[1] + b[1] + c[1]) + nz * (a[2] + b[2] + c[2]) < 0) tri(out, a, c, b); else tri(out, a, b, c); };

  // 面取りした箱：角を b だけ落とす（44 面）。o.top = [sx, sz] で上をすぼめる・広げる。中心が原点
  function cbox(w, h, d, b, o = {}) {
    const hs = [w / 2, h / 2, d / 2]; if (b == null) b = Math.min(w, h, d) * .14; b = Math.min(b, Math.min(w, h, d) * .49);
    const v = (a, s, t, u) => { const p = [0, 0, 0]; p[a] = s * hs[a]; p[(a + 1) % 3] = t * (hs[(a + 1) % 3] - b); p[(a + 2) % 3] = u * (hs[(a + 2) % 3] - b); return p; }, out = [];
    const quad = (p, q, r, s) => { triOut(out, p, q, r); triOut(out, p, r, s); };
    for (let a = 0; a < 3; a++) for (const s of [-1, 1]) { quad(v(a, s, -1, -1), v(a, s, 1, -1), v(a, s, 1, 1), v(a, s, -1, 1)); const bb = (a + 1) % 3; for (const t of [-1, 1]) quad(v(a, s, t, -1), v(a, s, t, 1), v(bb, t, 1, s), v(bb, t, -1, s)); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) triOut(out, v(0, sx, sy, sz), v(1, sy, sz, sx), v(2, sz, sx, sy));
    const g = geoOf(out); if (o.top) taper(g, o.top[0], o.top[1] ?? o.top[0]); return g;
  }
  // 上へ行くほど x と z を sx, sz 倍にする（台形・くさび形にする）
  function taper(g, sx, sz = sx) { g.computeBoundingBox(); const p = g.attributes.position, y0 = g.boundingBox.min.y, yh = Math.max(1e-6, g.boundingBox.max.y - y0); for (let i = 0; i < p.count; i++) { const k = (p.getY(i) - y0) / yh; p.setX(i, p.getX(i) * lerp(1, sx, k)); p.setZ(i, p.getZ(i) * lerp(1, sz, k)); } return g; }

  // 輪を積んで作る筒（lathe と tube の中身）。rings = [{ c: 中心, n, b: 輪の 2 つの軸, r: 半径, jr, jy: ぎざぎざ }]
  function ringGeo(rings, seg, rot = 0, sq = 1) {
    const out = [], V = rings.map(R => { const a = []; for (let j = 0; j < seg; j++) { const th = rot + j / seg * TAU, r = R.r * (1 + (j % 2 ? 1 : -1) * (R.jr || 0)), cx = Math.cos(th) * r, sx = Math.sin(th) * r * sq, dy = (j % 2 ? -1 : 0) * (R.jy || 0); a.push([R.c[0] + R.n[0] * cx + R.b[0] * sx, R.c[1] + R.n[1] * cx + R.b[1] * sx + dy, R.c[2] + R.n[2] * cx + R.b[2] * sx]); } return a; });
    for (let i = 0; i < V.length - 1; i++) for (let j = 0; j < seg; j++) { const A = V[i][j], B = V[i][(j + 1) % seg], C = V[i + 1][(j + 1) % seg], D = V[i + 1][j]; tri(out, A, D, B); tri(out, B, D, C); }
    return geoOf(out);
  }
  // 回転体：profile = [[半径, 高さ, ぎざ(半径), ぎざ(高さ)], …] を下から上へ。半径 0 で始めて 0 で終えると閉じた形になる。
  // seg = まわりの分割（6〜10 がローポリらしい）。o = { rot: まわす角, sx, sz: だ円にする }
  function lathe(profile, seg = 8, o = {}) { const g = ringGeo(profile.map(([r, y, jr, jy]) => ({ c: [0, y, 0], n: [1, 0, 0], b: [0, 0, 1], r, jr, jy })), seg, o.rot ?? Math.PI / seg); if (o.sx || o.sz) g.scale(o.sx || 1, 1, o.sz || 1); return g; }
  // 先細りの管：pts = [[x,y,z], …] を通り、radii（数 または 点ごとの配列）の太さ。両はしは閉じる。o = { seg, sq: 断面をつぶす, open: 閉じない }
  function tube(pts, radii, seg = 6, o = {}) {
    const n = pts.length, P = pts.map(p => new THREE.Vector3(...p)), rings = [], rr = i => Array.isArray(radii) ? radii[i] : radii; let N = null;
    for (let i = 0; i < n; i++) {
      const t = new THREE.Vector3().subVectors(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]).normalize();
      if (!N) { N = Math.abs(t.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0).cross(t); } N = N.clone().addScaledVector(t, -N.dot(t)).normalize();
      const B = new THREE.Vector3().crossVectors(N, t), R = { c: pts[i], n: N.toArray(), b: B.toArray(), r: rr(i) };
      if (i === 0 && !o.open && R.r > 0) rings.push({ ...R, r: 0 }); rings.push(R); if (i === n - 1 && !o.open && R.r > 0) rings.push({ ...R, r: 0 });
    }
    return ringGeo(rings, seg, o.rot ?? Math.PI / seg, o.sq ?? 1);
  }
  // でこぼこの多面体（岩・葉のかたまり・雲・毛のかたまり）。o = { d: 細かさ(0=20 面, .5=36 面, 1=80 面), j: でこぼこの強さ, sx, sy, sz: のばす, flat: 下を平らに切る(0〜1), seed }
  function blob(r = 1, o = {}) {
    const d = o.d ?? 1, g = d === .5 ? new THREE.DodecahedronGeometry(1, 0) : new THREE.IcosahedronGeometry(1, d), p = g.attributes.position, j = o.j ?? .16, sd = o.seed || 0;
    for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + (hash(Math.round(x * 40) + Math.round(y * 40) * 7.13 + sd * 1.7, Math.round(z * 40) + sd * 3.1) - .5) * 2 * j; x *= k; y *= k; z *= k; if (o.flat != null) y = Math.max(y, -o.flat); p.setXYZ(i, x * r * (o.sx || 1), y * r * (o.sy || 1), z * r * (o.sz || 1)); }
    g.deleteAttribute('uv'); g.deleteAttribute('normal'); return g;
  }
  // 押し出し：XY 平面の形 pts = [[x,y], …]（左まわり）を z の方向へ depth だけ厚くする。bevel でふちを面取り。中心は z=0
  function prism(pts, depth, bevel = 0) {
    const s = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, depth - bevel * 2), steps: 1, curveSegments: 1, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 1 });
    g.translate(0, 0, -(depth - bevel * 2) / 2); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g.clearGroups(); return g;
  }
  const gem = (r, sx = 1, sy = 1, sz = 1) => { const g = lathe([[0, -r], [r, 0], [0, r]], 4, { rot: 0 }); g.scale(sx, sy, sz); return g; };   // 8 面の小さな粒（目・ボタン・実）
  const cyl = (rt, rb, h, seg = 8, o = {}) => lathe([[0, -h / 2], [rb, -h / 2], [rt, h / 2], [0, h / 2]], seg, o);
  const cone = (r, h, seg = 6) => lathe([[0, 0], [r, 0], [0, h]], seg);

  // ───────── 色をぬる・置く・まとめる ─────────
  // paint：形に頂点の色をつける。下が少し暗く上が少し明るい（grad）、面ごとにわずかにちがう（jit）。o.top で上の色を別にできる
  function paint(geo, color, o = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = p.count, a = new Float32Array(n * 3), c = col(color), top = o.top ? col(o.top) : null, grad = o.grad ?? .11, jit = o.jit ?? .04, sd = o.seed || 0;
    g.computeBoundingBox(); const y0 = g.boundingBox.min.y, yh = Math.max(1e-6, g.boundingBox.max.y - y0);
    for (let i = 0; i < n; i += 3) {
      const cx = p.getX(i) + p.getX(i + 1) + p.getX(i + 2), cy = p.getY(i) + p.getY(i + 1) + p.getY(i + 2), cz = p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2), ux = p.getX(i + 1) - p.getX(i), uy = p.getY(i + 1) - p.getY(i), uz = p.getZ(i + 1) - p.getZ(i), vx = p.getX(i + 2) - p.getX(i), vy = p.getY(i + 2) - p.getY(i), vz = p.getZ(i + 2) - p.getZ(i);
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const f = 1 + (hash(Math.round(nx * 9) + Math.round(ny * 9) * 13.7 + Math.round(nz * 9) * 5.3 + sd, Math.round((nx * cx + ny * cy + nz * cz) * 9)) - .5) * 2 * jit;
      for (let k = 0; k < 3; k++) { const t = (p.getY(i + k) - y0) / yh, s = f * (1 + (t - .55) * 2 * grad); let r = c.r, gg = c.g, b = c.b; if (top) { r = lerp(r, top.r, t); gg = lerp(gg, top.g, t); b = lerp(b, top.b, t); } a[(i + k) * 3] = r * s; a[(i + k) * 3 + 1] = gg * s; a[(i + k) * 3 + 2] = b * s; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
  // P：形に色をぬって、場所へ置く。o = { rx, ry, rz: 回す, s または sx, sy, sz: のばす, grad, jit, top }。返すのは「色つきの形」
  function P(geo, color, x = 0, y = 0, z = 0, o = {}) {
    const g = paint(geo, color, o); _e.set(o.rx || 0, o.ry || 0, o.rz || 0); _q.setFromEuler(_e); _s.set(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1);
    g.applyMatrix4(_m.compose(_v.set(x, y, z), _q, _s)); return g;
  }
  // join：色つきの形の並びを 1 つの Mesh にまとめる（影を落とす・受ける）。mat を変えれば両面や光る面にできる
  function join(list, mat = MAT) {
    let n = 0; for (const g of list) n += g.attributes.position.count; const pos = new Float32Array(n * 3), cl = new Float32Array(n * 3); let k = 0;
    for (const g of list) { pos.set(g.attributes.position.array, k); if (g.attributes.color) cl.set(g.attributes.color.array, k); else cl.fill(1, k, k + g.attributes.position.count * 3); k += g.attributes.position.count * 3; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
  }
  // 色つきの形を、あとからまとめて動かす（部品のかたまりを別の場所へ写すとき）
  const move = (g, x = 0, y = 0, z = 0, ry = 0, s = 1) => { const q = g.clone(); _e.set(0, ry, 0); q.applyMatrix4(_m.compose(_v.set(x, y, z), _q.setFromEuler(_e), _s.set(s, s, s))); return q; };
  // 同じ Mesh をたくさん置く（InstancedMesh）。list = [[x, y, z, 向き, 大きさ, 色(かけ算。なくてもよい), たての倍率], …]
  function scatter(mesh, list, o = {}) {
    const im = new THREE.InstancedMesh(mesh.geometry, mesh.material, list.length), d = new THREE.Object3D(), c = new THREE.Color();
    list.forEach(([x, y, z, ry = 0, s = 1, tint = null, sy = 1], i) => { d.position.set(x, y, z); d.rotation.set(0, ry, 0); d.scale.set(s, s * sy, s); d.updateMatrix(); im.setMatrixAt(i, d.matrix); if (tint || o.tint) im.setColorAt(i, c.set(tint || '#ffffff')); });
    im.castShadow = o.cast !== false; im.receiveShadow = o.recv !== false; im.computeBoundingSphere(); return im;
  }
  const tris = obj => { let n = 0; obj.traverse(m => { if (m.isMesh) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3 * (m.isInstancedMesh ? m.count : 1); }); return Math.round(n); };

  // ───────── いつもの光 ─────────
  // look(scene, renderer, mood, o)：空・霧・太陽（やわらかい影）・空の色のまわりこみ・ふちの光をまとめて用意する。
  // mood = 'morning' | 'noon' | 'evening' | 'dusk' | 'night' | 'mist'。o = { range: 影の届く広さ, fog: [近, 遠], dir: 太陽の向き [x,y,z] }
  const MOODS = {
    morning: { sky: [[0, '#8cc6ea'], [.5, '#cfe9f0'], [.82, '#fbeed8'], [1, '#fff4e0']], fog: '#e4efe6', hs: '#dcecff', hg: '#b9c79a', amb: 1.55, sun: '#fff0d2', pw: 2.5, dir: [-.62, .5, .42], rim: '#bfe2ff', rp: .55, cloud: ['#ffffff', '#f6dcc8'], lit: 0 },
    noon: { sky: [[0, '#6fb6ea'], [.6, '#c4e6f6'], [1, '#eef8f4']], fog: '#dcf0f4', hs: '#eaf4ff', hg: '#a9c08e', amb: 1.6, sun: '#fffaf0', pw: 2.6, dir: [-.4, .85, .3], rim: '#d6ecff', rp: .35, cloud: ['#ffffff', '#dfeaf4'], lit: 0 },
    evening: { sky: [[0, '#7aa6dc'], [.45, '#c9c4d6'], [.75, '#f9cfa0'], [1, '#ffe6b4']], fog: '#f1cfae', hs: '#dbe6f6', hg: '#d6b48c', amb: 1.7, sun: '#ffe2b8', pw: 2.4, dir: [-.64, .47, .45], rim: '#ff9c86', rp: .6, cloud: ['#fff0d8', '#f0a898'], lit: .9 },
    dusk: { sky: [[0, '#34406e'], [.5, '#8a6c9c'], [.8, '#f09c7c'], [1, '#ffcf96']], fog: '#b98aa0', hs: '#8e9ee0', hg: '#8a6a7c', amb: 1.15, sun: '#ff9a6a', pw: 1.7, dir: [-.8, .2, .4], rim: '#7a8cff', rp: .6, cloud: ['#ffc8a8', '#a878a8'], lit: 1.3 },
    night: { sky: [[0, '#0d1433'], [.6, '#22316a'], [1, '#3a4c88']], fog: '#1f2c5c', hs: '#5f78d0', hg: '#1c2440', amb: 1.25, sun: '#9db8ff', pw: 1.1, dir: [-.4, .7, .35], rim: '#4a66d8', rp: .5, cloud: ['#4a5c9a', '#2a3668'], lit: 1.6 },
    mist: { sky: [[0, '#c4d6e0'], [.6, '#e2ebea'], [1, '#f2f1e8']], fog: '#e3ebe8', hs: '#f0f6ff', hg: '#b4bfae', amb: 1.9, sun: '#fff6e6', pw: 1.3, dir: [-.5, .7, .4], rim: '#ffffff', rp: .3, cloud: ['#ffffff', '#e4e8ea'], lit: .5 },
  };
  function look(scene, renderer, mood = 'morning', o = {}) {
    const L = { ...(MOODS[mood] || MOODS.morning), ...(o.set || {}) }, dir = new THREE.Vector3(...(o.dir || L.dir)).normalize(), range = o.range || 26, fog = o.fog || [38, 170];
    scene.background = K.sky(L.sky); scene.fog = new THREE.Fog(L.fog, fog[0], fog[1]);
    const { hemi, sun } = K.lights(scene, renderer, { sky: L.hs, ground: L.hg, amb: L.amb, sun: L.sun, power: L.pw, range, map: o.map || 1024, pos: dir.clone().multiplyScalar(70).toArray() });
    sun.shadow.bias = -.0006; sun.shadow.normalBias = .035; sun.shadow.camera.far = 160; sun.shadow.camera.updateProjectionMatrix();
    const rim = new THREE.DirectionalLight(L.rim, L.rp); scene.add(rim, rim.target);   // ふちの光：太陽の反対がわ、少し上から。影は落とさない
    const texel = range * 2 / (o.map || 1024);
    // follow(x, y, z)：影と光を主役のまわりへ送る（影がちらつかないよう、影の地図の 1 ます単位で動かす）
    const follow = (x = 0, y = 0, z = 0) => { x = Math.round(x / texel) * texel; z = Math.round(z / texel) * texel; sun.target.position.set(x, y, z); sun.position.set(x + dir.x * 70, y + dir.y * 70, z + dir.z * 70); rim.target.position.set(x, y, z); rim.position.set(x - dir.x * 50, y + 28, z - dir.z * 50); };
    follow(0, 0, 0); return { sun, hemi, rim, follow, mood: L, dir, lit: L.lit };
  }
  // lit(obj, 強さ)：obj の中の光る面（窓・ランプ）の明るさを変える。0 で消える
  const lit = (obj, v = 1) => { obj.traverse(m => { if (m.isMesh && m.userData.glow) m.material.emissiveIntensity = v * (m.userData.glow === true ? 1 : m.userData.glow); }); return obj; };

  // ───────── 人 ─────────
  // 頭の断面（半径, 高さ）。頭の高さの半分 R を 1 として、あごが 0、てっぺんが 2
  const HEADP = [[0, 0], [.44, .03], [.76, .3], [.96, .7], [1, 1.1], [.9, 1.55], [.57, 1.9], [0, 2.03]];
  const headR = y => { for (let i = 1; i < HEADP.length; i++) if (y <= HEADP[i][1]) { const a = HEADP[i - 1], b = HEADP[i]; return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])); } return 0; };
  const HAIR = { short: [1.5, .95, .55, 0], bob: [1.42, .22, .12, .93], long: [1.45, -.25, -1.0, .96], pony: [1.5, .95, .6, 0], bun: [1.52, 1.0, .6, 0], spiky: [1.55, 1.05, .6, 0], twin: [1.45, .8, .5, 0], fringe: [1.22, .7, .4, 0] };
  // かみの毛のかぶり：前は高く（おでこが見える）、横・うしろは長く。すそは束ごとにぎざぎざ
  function hairCap(R, style, seed) {
    const [front, side, back, hang] = HAIR[style] || HAIR.short, seg = 10, V = [], out = [];
    for (let j = 0; j < seg; j++) { const th = j / seg * TAU + .314, f = Math.sin(th), jag = (hash(j, seed + 9) - .5) * .2 + (j % 2 ? .08 : -.08);
      const yb = (f > .05 ? lerp(side, front, smooth(.05, .62, f)) : lerp(back, side, smooth(-.75, .05, f))) + jag, ys = [2.16, 1.9, Math.max(yb, 1.55), Math.max(yb, lerp(1.55, yb, .5)), yb], cl = [];
      ys.forEach((y, k) => { const r = k === 0 ? 0 : Math.max(headR(clamp(y, 0, 2)), y < 1.1 ? hang : 0) * 1.1 + .09; cl.push([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R * .97]); }); V.push(cl); }
    for (let j = 0; j < seg; j++) for (let k = 0; k < 4; k++) { const A = V[j][k + 1], B = V[(j + 1) % seg][k + 1], C = V[(j + 1) % seg][k], D = V[j][k]; tri(out, A, D, B); tri(out, B, D, C); }
    return geoOf(out);
  }
  /* 人を作る。前は +z、足もとが y=0。o の中身（どれも省ける）:
     age: 'adult' | 'child'（体の比率が変わる）  h: 身長（大人 1.62、子ども 1.12）  wide: 体の太さの倍率
     skin, hair, top, bottom, shoes: 色   hairStyle: 'short' | 'bob' | 'long' | 'pony' | 'bun' | 'spiky' | 'twin' | 'fringe' | 'none'
     sleeves: 'long' | 'short'   legs: 'pants' | 'shorts' | 'skirt' | 'dress'（dress は上着と同じ色のスカート）
     coat: true（すその長い上着） collar: 色（えり） belt: 色（ベルト） buttons: 色（前のボタン）
     hat: 'cap' | 'straw' | 'beanie' と hatColor, hatBand   pack: 色（リュック）  scarf: 色（マフラー。うしろにたれる）
     返す Group の userData.rig に関節（body, torso, head, armL/R, elbowL/R, legL/R, kneeL/R, scarf）が入る。動かすのは pose() */
  function person(o = {}) {
    const child = o.age === 'child', h = o.h ?? (child ? 1.12 : 1.62), wide = o.wide ?? 1, seed = o.seed ?? 1;
    const skin = col(o.skin || '#f3c9a4'), hairC = o.hair || '#5a3a2a', top = o.top || '#e8563e', bottom = o.bottom || '#3d4c6e', shoes = o.shoes || '#4a3630', legs = o.legs || 'pants';
    const headH = h * (o.head ?? (child ? .3 : .238)), R = headH / 2, neck = h * .028, shY = h - headH - neck, hipY = h * (child ? .4 : .455), tl = shY - hipY;
    const sw = h * (child ? .112 : .122) * wide, hipR = sw * (child ? .92 : .86), waistR = sw * (child ? .9 : .76), dz = child ? .72 : .64;
    const armLen = tl * (child ? 1.0 : 1.1), ua = armLen * .5, fa = armLen * .5, th = hipY * .5, sl = hipY - th, ra = h * .034, rl = h * (child ? .052 : .05) * Math.sqrt(wide);
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const SK = { grad: .05, jit: .015 }, J = (parent, list, x = 0, y = 0, z = 0) => { const grp = new THREE.Group(); grp.position.set(x, y, z); if (list.length) grp.add(join(list)); parent.add(grp); return grp; };
    // こし（ズボンの上・スカート）
    const hp = [], bc = legs === 'dress' ? top : bottom;
    const sk = legs === 'skirt' || legs === 'dress';
    hp.push(P(lathe([[0, hipY - h * .045], [hipR * .7, hipY - h * .04], [hipR, hipY], [waistR * 1.02, hipY + tl * .22], [0, hipY + tl * .22]], 8, { sz: dz }), sk ? '#f4f0e6' : bottom));
    if (sk) hp.push(P(lathe([[0, hipY - th * .4], [hipR * 1.2, hipY - th * (child ? .5 : .68)], [hipR * 1.8, hipY - th * (child ? .62 : .8), .07], [hipR * 1.36, hipY - th * .1], [waistR * 1.24, hipY + tl * .2], [waistR * 1.2, hipY + tl * .3], [0, hipY + tl * .3]], 10, { sz: .84 }), bc, 0, 0, 0, { grad: .16 }));
    body.add(join(hp));
    // 胴：こしで細く、胸と肩で広い。すそは少し広がる
    const tp = [], y0 = -tl * .02, hem = o.coat ? -th * .62 : y0;
    const prof = [[0, hem + .01], [o.coat ? hipR * 1.38 : waistR * (legs === 'skirt' ? 1.0 : 1.16), hem, o.coat ? .05 : 0]]; if (o.coat) prof.push([hipR * 1.12, 0]);
    prof.push([waistR * 1.04, tl * .3], [sw * .96, tl * .7], [sw * .98, tl * .86], [sw * .66, tl * .99], [R * .42, tl * 1.04], [0, tl * 1.04]);
    tp.push(P(lathe(prof, 8, { sz: dz }), top, 0, 0, 0, { grad: .1 }));
    if (o.belt) tp.push(P(lathe([[waistR * 1.1, tl * .1], [waistR * 1.14, tl * .14], [waistR * 1.12, tl * .2], [waistR, tl * .21]], 8, { sz: dz }), o.belt), P(cbox(sw * .22, tl * .11, .02), '#e8c860', 0, tl * .15, waistR * 1.14 * dz));
    tp.push(P(tube([[0, tl * 1.0, 0], [0, tl + neck + R * .3, 0]], R * .36, 6, { open: true }), skin, 0, 0, 0, SK));
    if (o.collar) tp.push(P(lathe([[R * .4, tl * 1.02], [R * .72, tl * .985, .1], [R * .62, tl * 1.07, .12], [R * .4, tl * 1.06]], 8, { sz: .9 }), o.collar));
    if (o.buttons) for (let i = 0; i < 3; i++) tp.push(P(gem(h * .013), o.buttons, 0, tl * (.36 + i * .2), lerp(waistR, sw, .3 + i * .3) * dz * .99, { jit: 0 }));
    if (o.pack) { const pw = sw * 1.5, ph = tl * .78, pd = sw * .8, pz = -sw * dz - pd * .42; tp.push(P(cbox(pw, ph, pd, pd * .28), o.pack, 0, tl * .52, pz), P(cbox(pw * 1.04, ph * .36, pd * 1.06, pd * .26), shade(o.pack, -.14), 0, tl * .76, pz), P(cbox(pw * .6, ph * .3, pd * .4, pd * .12), shade(o.pack, .12), 0, tl * .36, pz - pd * .5), P(cbox(pw * .16, .02, .03), '#e8c860', 0, tl * .62, pz - pd * .54));
      for (const s of [-1, 1]) tp.push(P(tube([[s * sw * .58, tl * .22, -sw * dz * .5], [s * sw * .7, tl * .3, sw * dz * .78], [s * sw * .62, tl * .88, sw * dz * .74], [s * sw * .55, tl * 1.0, 0], [s * sw * .5, tl * .9, -sw * dz * .8]], h * .013, 4, { sq: .5 }), shade(o.pack, -.2))); }
    if (o.scarf) tp.push(P(lathe([[R * .42, tl * .98], [R * .78, tl * 1.0], [R * .82, tl * 1.1], [R * .5, tl * 1.16], [R * .3, tl * 1.14]], 8, { sz: .95 }), o.scarf));
    const torso = J(body, tp, 0, hipY, 0);
    const scarf = new THREE.Group(); scarf.position.set(sw * .3, tl * 1.06, -R * .62); torso.add(scarf);
    if (o.scarf) scarf.add(join([P(tube([[0, 0, 0], [0, -tl * .2, -R * .16], [0, -tl * .52, -R * .1]], [R * .2, R * .24, R * .27], 4, { sq: .4, rot: 0 }), o.scarf), P(cbox(R * .5, tl * .07, R * .14, .005), shade(o.scarf, .25), 0, -tl * .5, -R * .1)]));
    // 頭：顔・耳・かみの毛・ぼうし（あごの下が回る中心）
    const hd = [], style = o.hairStyle || 'short';
    hd.push(P(lathe(HEADP.map(([r, y]) => [r * R, y * R]), 8, { sz: .96 }), skin, 0, 0, 0, SK));
    for (const s of [-1, 1]) { hd.push(P(gem(R * .15, .8, 1.25, .5), '#2c2430', s * R * .34, R * .9, R * .87, { jit: 0, grad: 0 })); hd.push(P(gem(R * .22, .5, 1, .8), shade(skin, -.06), s * R * .98, R * .86, 0, SK)); }
    if (o.cheek !== false) for (const s of [-1, 1]) hd.push(P(gem(R * .15, 1, 1, .3), mix(skin, '#f08a7a', .3), s * R * .56, R * .6, R * .73, { jit: 0, grad: 0 }));
    if (style !== 'none') { hd.push(P(hairCap(R, style, seed), hairC, 0, 0, 0, { grad: .1, jit: .06 }));
      if (style === 'pony') hd.push(P(tube([[0, 1.45 * R, -.95 * R], [0, 1.5 * R, -1.4 * R], [0, .9 * R, -1.75 * R], [0, .15 * R, -1.6 * R]], [R * .2, R * .3, R * .26, R * .04], 5), hairC), P(blob(R * .16, { d: 0, j: 0 }), o.tie || '#e8563e', 0, 1.45 * R, -1.08 * R));
      if (style === 'bun') hd.push(P(blob(R * .42, { d: .5, j: .1 }), hairC, 0, 1.95 * R, -.62 * R));
      if (style === 'twin') for (const s of [-1, 1]) hd.push(P(tube([[s * .95 * R, 1.1 * R, -.2 * R], [s * 1.35 * R, .9 * R, -.3 * R], [s * 1.4 * R, .1 * R, -.25 * R]], [R * .18, R * .3, R * .05], 5), hairC), P(blob(R * .13, { d: 0, j: 0 }), o.tie || '#e8563e', s * 1.02 * R, 1.08 * R, -.2 * R));
      if (style === 'spiky') for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + .4, e = i === 6 ? 1.5 : .75; hd.push(P(cone(R * .34, R * .62, 4), hairC, Math.cos(a) * Math.cos(e) * R * .8, R * (1.25 + Math.sin(e) * .7), Math.sin(a) * Math.cos(e) * R * .8 - R * .1, { rz: -Math.cos(a) * (1.57 - e) * .9, rx: Math.sin(a) * (1.57 - e) * .9, jit: .07 })); } }
    if (o.hat) { const hc = o.hatColor || '#e8c860', hb = o.hatBand || shade(hc, -.25);
      if (o.hat === 'straw') hd.push(P(lathe([[R * 1.95, 1.42 * R, .03], [R * 1.12, 1.5 * R], [R * 1.06, 1.62 * R], [R * 1.0, 2.0 * R], [R * .7, 2.2 * R], [0, 2.24 * R]], 10), hc, 0, 0, 0, { rx: -.1 }), P(lathe([[R * 1.13, 1.52 * R], [R * 1.1, 1.72 * R], [R * 1.02, 1.72 * R]], 10), hb, 0, 0, 0, { rx: -.1 }), P(lathe([[0, 1.4 * R], [R * 1.93, 1.4 * R, .03], [R * 1.95, 1.42 * R, .03]], 10), shade(hc, -.2), 0, 0, 0, { rx: -.1, grad: 0 }));
      if (o.hat === 'cap') hd.push(P(lathe([[R * 1.1, 1.4 * R], [R * 1.12, 1.62 * R], [R * .95, 2.0 * R], [R * .5, 2.2 * R], [0, 2.24 * R]], 8), hc, 0, 0, -R * .03), P(cbox(R * 1.5, R * .09, R * .95, R * .04, { top: [1, 1] }), hb, 0, 1.46 * R, R * 1.25, { rx: .16 }), P(blob(R * .1, { d: 0, j: 0 }), hb, 0, 2.25 * R, -R * .03));
      if (o.hat === 'beanie') hd.push(P(lathe([[R * 1.1, 1.3 * R], [R * 1.2, 1.36 * R], [R * 1.2, 1.56 * R], [R * 1.1, 1.62 * R], [R * .98, 1.95 * R], [R * .55, 2.2 * R], [0, 2.26 * R]], 8, { sz: .98 }), hc, 0, 0, 0, { rx: -.12 }), P(lathe([[R * 1.12, 1.3 * R], [R * 1.22, 1.36 * R], [R * 1.22, 1.56 * R], [R * 1.1, 1.63 * R]], 8, { sz: .98 }), hb, 0, 0, 0, { rx: -.12 }), P(blob(R * .3, { d: .5, j: .12 }), hb, 0, 2.36 * R, -R * .3)); }
    const head = J(torso, hd, 0, tl + neck, 0);
    // うで：肩 → ひじ → 手（指のない丸い手）
    const arm = s => { const up = [], lo = [], sc = o.sleeves === 'short' ? skin : top;
      up.push(P(tube([[0, ra * .75, 0], [0, ra * .3, 0], [0, -ua, 0], [0, -ua - ra * .7, 0]], [0, ra * 1.08, ra * .92, 0], 6), top));
      if (o.sleeves === 'short') lo.push(P(tube([[0, ra * .7, 0], [0, 0, 0], [0, -fa * .92, 0]], [0, ra * .84, ra * .72], 6), skin, 0, 0, 0, SK)); else lo.push(P(tube([[0, ra * .7, 0], [0, 0, 0], [0, -fa * .8, 0], [0, -fa * .82, 0]], [0, ra * .92, ra * .86, ra * .6], 6), sc));
      lo.push(P(blob(ra * 1.02, { d: 0, j: .04, sy: 1.2, sx: .8 }), skin, 0, -fa * .97, 0, SK));
      const A = J(torso, up, s * (sw * .93 + ra * .3), tl * .86, 0), E = J(A, lo, 0, -ua, 0); return [A, E]; };
    const [armL, elbowL] = arm(-1), [armR, elbowR] = arm(1);
    // 足：もも → ひざ → すね・くつ
    const leg = s => { const up = [], lo = [], bare = legs !== 'pants', tc = bare && legs !== 'shorts' ? skin : bottom, lc = bare ? skin : bottom, fl = h * (child ? .15 : .145);
      up.push(P(tube([[0, 0, 0], [0, -th, 0], [0, -th - rl * .6, 0]], [rl * 1.08, rl * .86, 0], 6), tc, 0, 0, 0, tc === skin ? SK : {}));
      if (legs === 'shorts') up.push(P(tube([[0, .01, 0], [0, -th * .55, 0]], [rl * 1.2, rl * 1.24], 6), bottom));
      lo.push(P(tube([[0, rl * .6, 0], [0, 0, 0], [0, -sl + h * .03, 0]], [0, rl * .84, rl * .62], 6), lc, 0, 0, 0, lc === skin ? SK : {}));
      if (bare && o.socks !== false) lo.push(P(tube([[0, -sl * .62, 0], [0, -sl + h * .03, 0]], [rl * .74, rl * .68], 6, { open: true }), o.socks || '#f4f0e6'));
      lo.push(P(lathe([[0, 0], [rl * 1.0, 0], [rl * 1.02, h * .028], [rl * .62, h * .058], [0, h * .058]], 6, { sz: fl / (rl * 2), rot: 0 }), shoes, 0, -sl, fl * .22));
      const A = J(body, up, s * hipR * .5, hipY, 0), E = J(A, lo, 0, -th, 0); return [A, E]; };
    const [legL, kneeL] = leg(-1), [legR, kneeR] = leg(1);
    g.userData.rig = { body, torso, head, armL, armR, elbowL, elbowR, legL, legR, kneeL, kneeR, scarf, h, th, sl, hipY, stride: 2 * hipY * Math.sin(.5) };
    g.userData.seatY = sl; return g;
  }
  /* 人を動かす。pose(人, 種類, 位相, 強さ = 1)
     'walk'（歩く）'run'（走る）'stand'（立つ。位相でゆっくり息をする）'sit'（すわる。座面の高さは 人.userData.seatY）
     'wave'（立って右手をふる）'ride'（自転車をこぐ）'carry'（両手で前に物を持って歩く）
     位相は 2π で 2 歩。歩くときは「進んだ距離 ÷ 人.userData.rig.stride × π」を渡すと足がすべらない */
  function pose(g, kind = 'stand', ph = 0, amt = 1) {
    const r = g.userData.rig, s = Math.sin(ph), c = Math.cos(ph), mx = Math.max;
    for (const k of ['torso', 'head', 'armL', 'armR', 'elbowL', 'elbowR', 'legL', 'legR', 'kneeL', 'kneeR']) r[k].rotation.set(0, 0, 0);
    r.body.position.y = 0; r.body.rotation.set(0, 0, 0); r.armL.rotation.z = -.09; r.armR.rotation.z = .09; r.scarf.rotation.set(.15, 0, 0);
    if (kind === 'walk' || kind === 'carry') { const A = .5 * amt;
      r.legL.rotation.x = -A * s - .04; r.legR.rotation.x = A * s - .04; r.kneeL.rotation.x = .1 + 1.5 * A * mx(0, Math.cos(ph + .35)); r.kneeR.rotation.x = .1 + 1.5 * A * mx(0, -Math.cos(ph + .35));
      r.armL.rotation.x = A * .8 * s; r.armR.rotation.x = -A * .8 * s; r.elbowL.rotation.x = -(.22 + .6 * A * mx(0, -s)); r.elbowR.rotation.x = -(.22 + .6 * A * mx(0, s));
      r.body.position.y = -r.h * .016 * amt * (1 - Math.cos(ph * 2)); r.torso.rotation.set(.05 * amt, -.2 * A * s, .03 * amt * c); r.head.rotation.set(-.02, .14 * A * s, -.02 * amt * c); r.scarf.rotation.set(.3 + .12 * Math.sin(ph * 2 + 1), 0, .1 * s);
      if (kind === 'carry') { r.armL.rotation.set(-.75, 0, .12); r.armR.rotation.set(-.75, 0, -.12); r.elbowL.rotation.x = r.elbowR.rotation.x = -.95; } }
    else if (kind === 'run') { const A = .95 * amt;
      r.legL.rotation.x = -A * s - .22; r.legR.rotation.x = A * s - .22; r.kneeL.rotation.x = .3 + 1.7 * mx(0, Math.cos(ph + .5)) * amt; r.kneeR.rotation.x = .3 + 1.7 * mx(0, -Math.cos(ph + .5)) * amt;
      r.armL.rotation.x = A * s; r.armR.rotation.x = -A * s; r.elbowL.rotation.x = -1.45 + .25 * s; r.elbowR.rotation.x = -1.45 - .25 * s;
      r.body.position.y = r.h * .03 * amt * Math.abs(s) - r.h * .02; r.torso.rotation.set(.24 * amt, -.26 * A * s, 0); r.head.rotation.set(-.14 * amt, .16 * A * s, 0); r.scarf.rotation.set(1.0 + .2 * Math.sin(ph * 2), 0, .15 * s); }
    else if (kind === 'sit' || kind === 'ride') { const ride = kind === 'ride';
      r.body.position.y = -r.th * (ride ? .45 : 1); r.legL.rotation.x = r.legR.rotation.x = -1.5; r.kneeL.rotation.x = 1.5 + .18 * s * amt; r.kneeR.rotation.x = 1.5 - .18 * s * amt;
      r.armL.rotation.set(-.5, 0, .1); r.armR.rotation.set(-.5, 0, -.1); r.elbowL.rotation.x = r.elbowR.rotation.x = -.75; r.torso.rotation.x = .04 + .015 * Math.sin(ph * .5); r.head.rotation.set(.03 * c, .25 * Math.sin(ph * .31) * amt, 0);
      if (ride) { r.legL.rotation.x = -.8 - .42 * s; r.kneeL.rotation.x = 1.15 + .5 * c; r.legR.rotation.x = -.8 + .42 * s; r.kneeR.rotation.x = 1.15 - .5 * c; r.torso.rotation.x = .3; r.head.rotation.x = -.22; r.armL.rotation.set(-1.05, 0, .16); r.armR.rotation.set(-1.05, 0, -.16); r.elbowL.rotation.x = r.elbowR.rotation.x = -.25; } }
    else { // stand / wave
      r.torso.rotation.x = .012 * s; r.body.position.y = -r.h * .004 * (1 - c); r.armL.rotation.set(.03 * s, 0, -.12 - .012 * s); r.armR.rotation.set(-.03 * s, 0, .12 + .012 * s); r.elbowL.rotation.x = r.elbowR.rotation.x = -.16; r.head.rotation.set(.02 * s, .22 * Math.sin(ph * .37) * amt, 0); r.legL.rotation.z = -.03; r.legR.rotation.z = .03;
      if (kind === 'wave') { r.armR.rotation.set(0, 0, 2.5 + .12 * Math.sin(ph * 3)); r.elbowR.rotation.set(0, 0, .5 + .45 * Math.sin(ph * 3)); r.head.rotation.set(-.06, 0, .05); } }
    return g;
  }

  // ───────── 木 ─────────
  // 葉の色の組（明るい色・ふつう・影の色）。tree({ leaf: LEAF.autumn }) のように使う
  const LEAF = { spring: ['#a6d67a', '#8cc86a', '#74b860'], summer: ['#6fb86a', '#57a662', '#448f5c'], deep: ['#4f9a66', '#3f8660', '#2f7258'], autumn: ['#f2b04a', '#e8843a', '#d8603a'], gold: ['#f6d45a', '#eebc42', '#dca036'], sakura: ['#ffd2e0', '#ffb9d0', '#f7a2c2'], snow: ['#f6fafc', '#e2edf4', '#cfdfea'], dusk: ['#5a8a8a', '#48787e', '#3a6672'] };
  const arr = v => Array.isArray(v) ? v : [v];
  /* 広葉樹：曲がった幹と枝、でこぼこの葉のかたまり。o = { h: 高さ(5), leaf: 色 または 色の並び(LEAF.summer), trunk: 幹の色, blobs: 葉のかたまりの数(5),
     spread: 横の広がり(1), kind: 'round' | 'tall'（細長い）| 'wide'（横に広い）, d: 葉の細かさ(1。遠くの木は .5 や 0), fruit: 実の色, seed: 形の番号 } */
  function tree(o = {}) {
    const h = o.h ?? 5, seed = o.seed ?? 1, rnd = i => hash(seed * 7.31 + i, seed * 1.93 + i * 3.7), leaf = arr(o.leaf || LEAF.summer), tc = o.trunk || '#7a5a44', kind = o.kind || 'round', n = o.blobs ?? (kind === 'tall' ? 4 : 5), d = o.d ?? 1, sp = (o.spread ?? 1) * (kind === 'wide' ? 1.35 : kind === 'tall' ? .62 : 1), q = [];
    const bx = (rnd(1) - .5) * h * .16, bz = (rnd(2) - .5) * h * .16, th = h * (kind === 'tall' ? .34 : .46), cr = h * .27 * sp, cy = h * (kind === 'tall' ? .62 : .7), top = [bx * 1.2, th * 1.12, bz * 1.2];
    q.push(P(tube([[0, -.05, 0], [0, h * .03, 0], [bx * .25, th * .4, bz * .25], [bx, th * .82, bz], top], [h * .075, h * .052, h * .042, h * .034, h * .02], 6), tc, 0, 0, 0, { grad: .16, jit: .06 }));
    const cs = [[bx * 1.2, cy + (kind === 'tall' ? cr * .9 : cr * .25), bz * 1.2, cr * (kind === 'tall' ? .78 : .86)]];
    for (let i = 1; i < n; i++) { const a = i / (n - 1) * TAU + rnd(3) * 6, dd = cr * (kind === 'tall' ? .34 : .72), r = cr * (.52 + rnd(10 + i) * .22), yy = kind === 'tall' ? cy - cr * 1.3 + (i / (n - 1)) * cr * 1.9 : cy - cr * .28 + (rnd(20 + i) - .5) * cr * .5; cs.push([bx * 1.2 + Math.cos(a) * dd, yy, bz * 1.2 + Math.sin(a) * dd, r]); }
    cs.forEach(([x, y, z, r], i) => { q.push(P(blob(r, { d, j: .17, seed: seed + i * 3, sy: kind === 'tall' ? 1.08 : .84 }), leaf[i === 0 ? 0 : 1 + (i % Math.max(1, leaf.length - 1))] || leaf[0], x, y, z, { ry: rnd(30 + i) * 6, grad: .2, jit: .06 }));
      if (i > 0 && i < 4 && kind !== 'tall' && d >= 1) q.push(P(tube([[bx * (.6 + i * .12), th * (.55 + i * .1), bz * (.6 + i * .12)], [lerp(bx, x, .5), lerp(th, y, .35), lerp(bz, z, .5)], [x, y - r * .2, z]], [h * .026, h * .02, h * .012], 5), tc, 0, 0, 0, { jit: .06 })); });
    if (o.fruit) for (let i = 0; i < 9; i++) { const c = cs[i % cs.length], a = rnd(40 + i) * TAU, e = (rnd(50 + i) - .3) * 1.2; q.push(P(blob(h * .022, { d: 0, j: 0 }), o.fruit, c[0] + Math.cos(a) * Math.cos(e) * c[3] * .95, c[1] + Math.sin(e) * c[3] * .78, c[2] + Math.sin(a) * Math.cos(e) * c[3] * .95, { jit: 0 })); }
    const g = new THREE.Group(); g.add(join(q)); return g;
  }
  /* 針葉樹：すそがぎざぎざの段を重ねる。o = { h: 高さ(6), leaf: 色 または 色の並び, trunk, tiers: 段の数(4), wide: 太さ(1), seg: まわりの分割(8。遠くは 6), snow: 雪の色（つけると雪がのる）, seed } */
  function conifer(o = {}) {
    const h = o.h ?? 6, seed = o.seed ?? 1, leaf = arr(o.leaf || LEAF.deep), n = o.tiers ?? 4, wd = o.wide ?? 1, sg = o.seg ?? 8, q = [], y0 = h * .16, lean = (hash(seed, 3) - .5) * h * .05;
    q.push(P(tube([[0, -.05, 0], [0, h * .04, 0], [lean * .3, h * .5, 0], [lean, h * .9, 0]], [h * .055, h * .04, h * .025, h * .008], 6), o.trunk || '#6a4a3a', 0, 0, 0, { jit: .06 }));
    for (let i = 0; i < n; i++) { const u = i / n, r = h * .25 * wd * (1 - u * .72), yb = y0 + (h - y0) * u * .86, tH = (h - y0) / n * 1.75, x = lean * (yb / h);
      q.push(P(lathe([[0, r * .3], [r * .5, r * .12], [r, 0, .2, r * .3], [r * .55, tH * .42, .1], [i === n - 1 ? 0 : r * .2, tH]], sg, { rot: i * .7 + seed }), leaf[i % leaf.length], x, yb, 0, { top: shade(leaf[i % leaf.length], .1), grad: .2, jit: .06 }));
      if (o.snow) q.push(P(lathe([[r * .78, tH * .22, .22, r * .16], [r * .5, tH * .5, .1], [i === n - 1 ? 0 : r * .22, tH * 1.02]], 8, { rot: i * .7 + seed }), o.snow, x, yb + .03, 0, { grad: .05, jit: .03 })); }
    const g = new THREE.Group(); g.add(join(q)); return g;
  }
  /* 低い木・しげみ。o = { r: 大きさ(.8), leaf: 色 または 色の並び, n: かたまりの数(3), flowers: 花や実の色（つけると点々がつく）, d: 細かさ(1), seed } */
  function bush(o = {}) {
    const r = o.r ?? .8, seed = o.seed ?? 1, leaf = arr(o.leaf || LEAF.summer), n = o.n ?? 3, q = [], cs = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + seed, dd = i === 0 ? 0 : r * .62, rr = r * (i === 0 ? .82 : .5 + hash(seed, i) * .18); cs.push([Math.cos(a) * dd, rr * .55, Math.sin(a) * dd, rr]); q.push(P(blob(rr, { d: o.d ?? 1, j: .17, seed: seed + i, flat: .55, sy: .9 }), leaf[i % leaf.length], Math.cos(a) * dd, rr * .5, Math.sin(a) * dd, { ry: i * 2, grad: .2, jit: .06 })); }
    if (o.flowers) for (let i = 0; i < 12; i++) { const c = cs[i % n], a = hash(seed + i, 4) * TAU, e = .25 + hash(seed + i, 5) * 1.1; q.push(P(blob(r * .07, { d: 0, j: 0 }), arr(o.flowers)[i % arr(o.flowers).length], c[0] + Math.cos(a) * Math.cos(e) * c[3] * .95, c[1] + Math.sin(e) * c[3] * .86, c[2] + Math.sin(a) * Math.cos(e) * c[3] * .95, { jit: 0, grad: 0 })); }
    const g = new THREE.Group(); g.add(join(q)); return g;
  }

  // ───────── 家 ─────────
  const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  /* 家。前（戸のある面）は +z、足もとが y=0。o の中身（どれも省ける）:
     w, d: 横と奥行き(5, 4)  h: 1 階ぶんのかべの高さ(2.5)  floors: 階数(1)
     roof: 'gable'（切妻）| 'hip'（寄棟）  gableFront: true で三角のかべを前に向ける  pitch: 屋根のきつさ(.8)  eave: のきの出(.45)
     wall, wall2（2 階のかべ）, roofColor, trim（わく・さん・破風の色）, door, base（土台の石）: 色   timber: 色（角の柱を見せる）
     chimney: false でえんとつなし   shutters: 色（よろい戸）  flowerBox: 色（前の窓の花の箱）と flowers: 花の色の並び
     found: 土台を下へのばす長さ（坂に建てるとき。1 など）  userData.chimney = えんとつの口の場所 [x, y, z]（けむりを出すとき）
     windows: 'front'（前だけ）または 窓をつける面の並び（1=右(+x), 2=うしろ, 3=左。なければ全部。カメラから見えない面をはぶくと軽い）
     porch: false で戸の上の小屋根なし   awning: 色（しまのひさし。店ふう）  lit: 窓のあかりの強さ（0〜1.5。あとから lit(家, 強さ) でも変えられる） */
  function house(o = {}) {
    const w = o.w ?? 5, d = o.d ?? 4, fh = o.h ?? 2.7, floors = o.floors ?? 1, seed = o.seed ?? 1, wall = o.wall || '#f4ead6', wall2 = o.wall2 || wall, roofC = o.roofColor || '#c8563e', trim = o.trim || '#fbf6ea', doorC = o.door || '#5f8a9a', baseC = o.base || '#aaa69e';
    const q = [], gl = [], B = .3, WH = fh * floors, yE = B + WH, ov = o.eave ?? .45, jet = floors > 1 && o.jetty !== false ? .18 : 0, fl = arr(o.flowers || ['#f06a6a', '#f6d45a', '#ffffff']);
    const fd = o.found || 0; q.push(P(cbox(w + .34, B + .1 + fd, d + .34, .08), baseC, 0, (B - fd) / 2, 0, { jit: .07 })); let chim = null;
    for (let f = 0; f < floors; f++) { const e = f > 0 ? jet : 0; q.push(P(cbox(w + e, fh + .02, d + e, .05), f > 0 ? wall2 : wall, 0, B + fh * (f + .5), 0, { grad: .07, jit: .02 })); if (f > 0) q.push(P(cbox(w + e + .1, .16, d + e + .1, .04), o.timber || trim, 0, B + fh * f, 0)); }
    if (o.timber) for (const sx of [-1, 1]) for (const sz of [-1, 1]) q.push(P(cbox(.22, WH, .22, .03), o.timber, sx * (w / 2 + jet / 2 - .05), B + WH / 2, sz * (d / 2 + jet / 2 - .05)));
    // 窓：わく・ガラス・さん・台、よろい戸、花の箱（かべの面が z=0、まん中が原点。あとで各面へ写す）
    const win = (ww, wh, shut, box) => { const s = [], g = [];
      s.push(P(bx(ww + .2, wh + .2, .1), trim, 0, 0, .03, { jit: 0 }), P(bx(.05, wh, .04), trim, 0, 0, .1, { jit: 0 }), P(bx(ww, .05, .04), trim, 0, wh * .14, .1, { jit: 0 }), P(bx(ww + .36, .09, .22), trim, 0, -wh / 2 - .1, .1)); g.push(P(bx(ww, wh, .04), '#ffffff', 0, 0, .075));
      if (shut) for (const sd of [-1, 1]) { const sw = ww * .46, x = sd * (ww / 2 + .12 + sw / 2); s.push(P(bx(sw, wh + .12, .05), shut, x, 0, .045, { jit: .03 })); for (let k = 0; k < 3; k++) s.push(P(bx(sw * .72, .07, .03), shade(shut, -.2), x, (k - 1) * wh * .28, .075, { grad: 0, jit: 0 })); }
      if (box) { s.push(P(cbox(ww + .26, .2, .26, .04, { top: [1.04, 1.2] }), box, 0, -wh / 2 - .27, .2)); for (let k = 0; k < 3; k++) { const x = (k - 1) * ww * .36; s.push(P(blob(.16, { d: 0, j: .2, seed: k + seed }), '#5fa05c', x, -wh / 2 - .1, .22), P(gem(.07), fl[(k + seed) % fl.length], x + .03, -wh / 2 + .04, .3, { jit: 0, grad: 0 }), P(gem(.06), fl[(k + seed + 1) % fl.length], x - .09, -wh / 2 - .05, .35, { jit: 0, grad: 0 })); } }
      return [s, g]; };
    // 面に置く：side 0=前, 1=右(+x), 2=うしろ, 3=左。u は面にそった位置
    const onWall = (side, u, y, sg, e = 0) => { const hw = (side % 2 ? w : d) / 2 + e / 2, ry = side * Math.PI / 2, x = side === 0 ? u : side === 1 ? hw : side === 2 ? -u : -hw, z = side === 0 ? hw : side === 1 ? -u : side === 2 ? -hw : u; for (const p of sg[0]) q.push(move(p, x, y, z, ry)); for (const p of sg[1]) gl.push(move(p, x, y, z, ry)); };
    const cols = n => [...Array(n)].map((_, i) => (i + .5) / n), nf = Math.max(1, Math.round(w / 1.75)), ns = Math.max(1, Math.round(d / 2.1)), dcol = o.doorCol ?? (nf > 2 ? 1 : 0), ww = .78, wh = 1.02, dw = .95, dh = 1.95, doorX = (cols(nf)[dcol] - .5) * w;
    for (let f = 0; f < floors; f++) { const y = B + fh * f + fh * .5, e = f > 0 ? jet : 0;
      cols(nf).forEach((c, i) => { if (f === 0 && i === dcol) return; onWall(0, (c - .5) * w * .92, y, win(ww, wh, o.shutters, o.flowerBox), e); });
      const ws = o.windows === 'front' ? [] : Array.isArray(o.windows) ? o.windows : [1, 2, 3]; for (const sd of ws) if (sd === 2) cols(nf).forEach(c => onWall(2, (c - .5) * w * .92, y, win(ww, wh, o.shutters), e)); else if (sd) cols(ns).forEach(c => onWall(sd, (c - .5) * d * .9, y, win(ww, wh, o.shutters), e)); }
    // 戸：わく、板、小窓、取っ手、ふみ石、小屋根（または しまのひさし）
    { const s = [], g = [], y = dh / 2;
      s.push(P(bx(dw + .22, dh + .12, .12), trim, 0, y, .03, { jit: 0 }), P(cbox(dw, dh, .08, .02), doorC, 0, y - .03, .075, { jit: .03 }), P(bx(dw * .68, dh * .3, .03), shade(doorC, -.14), 0, dh * .25, .12, { jit: 0, grad: 0 }), P(bx(dw * .68, dh * .12, .03), shade(doorC, -.14), 0, dh * .52, .12, { jit: 0, grad: 0 }), P(blob(.055, { d: 0, j: 0 }), '#e8c860', dw * .34, dh * .47, .15, { jit: 0 }), P(cbox(dw + .7, .16, .62, .04), baseC, 0, -.2, .3, { jit: .07 }));
      g.push(P(bx(dw * .5, dh * .18, .03), '#ffffff', 0, dh * .79, .115));
      if (o.awning) { const aw = Math.min(w * .9, dw + 2.6), n = Math.max(4, Math.round(aw / .42)); for (let k = 0; k < n; k++) { const x = (k + .5) / n * aw - aw / 2; s.push(P(bx(aw / n + .005, .06, 1.1), k % 2 ? '#fbf6ea' : o.awning, x + (doorX > 0 ? -.6 : doorX < 0 ? .6 : 0), dh + .42, .52, { rx: .42, jit: 0, grad: .04 }), P(bx(aw / n + .005, .2, .04), k % 2 ? '#fbf6ea' : o.awning, x + (doorX > 0 ? -.6 : doorX < 0 ? .6 : 0), dh + .12, 1.0, { jit: 0, grad: 0 })); } }
      else if (o.porch !== false) { s.push(P(cbox(dw + .8, .09, .85, .03), roofC, 0, dh + .4, .4, { rx: .4, jit: .04 }), P(bx(dw + .7, .06, .06), trim, 0, dh + .23, .78)); for (const sd of [-1, 1]) s.push(P(tube([[sd * (dw / 2 + .22), dh - .18, .04], [sd * (dw / 2 + .22), dh + .22, .62]], .035, 4), trim)); }
      if (o.lantern !== false) { s.push(P(bx(.12, .05, .16), '#3a4048', dw / 2 + .32, dh * .82, .1), P(cone(.1, .08, 4), '#3a4048', dw / 2 + .32, dh * .8 - .04, .2)); g.push(P(cyl(.05, .065, .15, 4), '#ffffff', dw / 2 + .32, dh * .8 - .12, .2)); }
      onWall(0, doorX * .92, B, [s, g]); }
    // 屋根（ここでは棟を x の向きに作り、gableFront のときは 90 度まわす）
    const rf = [], rgl = [], gf = !!o.gableFront, RW = gf ? d : w, RD = (gf ? w : d) + jet, og = .38, L = RW + jet + og * 2;
    if ((o.roof || 'gable') === 'gable') { const rise = (o.pitch ?? .8) * RD / 2, run = RD / 2 + ov, rise2 = rise * run / (RD / 2), a = Math.atan2(rise2, run), SL = Math.hypot(run, rise2), yR = yE + rise, nb = 3;
      for (const s of [-1, 1]) { for (let k = 0; k < nb; k++) { const u = 1 - (k + .5) / nb, off = .05 + k * .045; rf.push(P(cbox(L - (nb - 1 - k) * .0, .1, SL / nb + .12, .025), k % 2 ? shade(roofC, -.07) : roofC, 0, yR - rise2 * u + Math.cos(a) * off, s * (run * u + Math.sin(a) * off), { rx: s * a, grad: 0, jit: .035 })); }
        for (const sx of [-1, 1]) rf.push(P(bx(.09, .2, SL - .1), trim, sx * (L / 2 - .1), yR - rise2 * .5 - Math.cos(a) * .07, s * (run * .5 - Math.sin(a) * .07), { rx: s * a, jit: 0 })); }
      rf.push(P(cbox(L + .08, .16, .36, .06), shade(roofC, -.2), 0, yR + .1 + nb * .035, 0));
      const tg = prism([[-RD / 2, 0], [RD / 2, 0], [0, rise]], RW + jet - .04); tg.rotateY(Math.PI / 2); rf.push(P(tg, wall2, 0, yE - .01, 0, { grad: .05, jit: .02 }));
      for (const sx of [-1, 1]) { rf.push(P(cyl(.27, .27, .08, 8), trim, sx * (RW + jet) / 2, yE + rise * .4, 0, { rz: Math.PI / 2, jit: 0 })); rgl.push(P(cyl(.19, .19, .1, 8), '#ffffff', sx * (RW + jet) / 2, yE + rise * .4, 0, { rz: Math.PI / 2 })); }
      if (o.chimney !== false) { const cx = RW * .24, cz = -RD * .2, cb = yE + rise * .3, ct = yR + .5; rf.push(P(cbox(.6, ct - cb, .6, .05, { top: [.88, .88] }), o.chimneyColor || '#b8705a', cx, (cb + ct) / 2, cz, { jit: .08 }), P(cbox(.72, .13, .72, .04), baseC, cx, ct + .04, cz), P(cyl(.11, .14, .26, 6), '#5a4a44', cx, ct + .22, cz)); chim = gf ? [cz, ct + .4, -cx] : [cx, ct + .4, cz]; }
    } else { const rise = (o.pitch ?? .62) * RD / 2, a0 = L / 2 + ov - og, b0 = RD / 2 + ov, rx = Math.max(.02, (RW + jet - RD) / 2 + .15), mk = (a, b, ra, rb, hh) => { const out = [], Bq = [[-a, -hh / 2, -b], [a, -hh / 2, -b], [a, -hh / 2, b], [-a, -hh / 2, b]], T = [[-ra, hh / 2, -rb], [ra, hh / 2, -rb], [ra, hh / 2, rb], [-ra, hh / 2, rb]]; for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; triOut(out, Bq[i], Bq[j], T[j]); triOut(out, Bq[i], T[j], T[i]); } triOut(out, T[0], T[1], T[2]); triOut(out, T[0], T[2], T[3]); triOut(out, Bq[0], Bq[1], Bq[2]); triOut(out, Bq[0], Bq[2], Bq[3]); return geoOf(out); };
      const at = t => [lerp(a0, rx, t), lerp(b0, .02, t)], m1 = at(.5), m0 = at(.42);
      rf.push(P(cbox(a0 * 2 - .1, .12, b0 * 2 - .1, .03), trim, 0, yE - .02, 0, { jit: 0 }), P(mk(a0, b0, m1[0], m1[1], rise * .5), roofC, 0, yE + .04 + rise * .25, 0, { grad: .05, jit: .04 }), P(mk(m0[0] + .1, m0[1] + .1, rx, .03, rise * .58), shade(roofC, -.07), 0, yE + .1 + rise * .42 + rise * .29, 0, { grad: .05, jit: .04 }), P(cbox(rx * 2 + .3, .14, .32, .05), shade(roofC, -.2), 0, yE + rise + .12, 0));
      if (o.chimney !== false) { const cx = rx * .5 + .5, cz = -b0 * .32, cb = yE + rise * .3, ct = yE + rise + .5; rf.push(P(cbox(.6, ct - cb, .6, .05, { top: [.88, .88] }), o.chimneyColor || '#b8705a', cx, (cb + ct) / 2, cz, { jit: .08 }), P(cbox(.72, .13, .72, .04), baseC, cx, ct + .04, cz), P(cyl(.11, .14, .26, 6), '#5a4a44', cx, ct + .22, cz)); chim = gf ? [cz, ct + .4, -cx] : [cx, ct + .4, cz]; } }
    for (const p of rf) q.push(gf ? move(p, 0, 0, 0, Math.PI / 2) : p); for (const p of rgl) gl.push(gf ? move(p, 0, 0, 0, Math.PI / 2) : p);
    const g = new THREE.Group(), glass = join(gl, glowMat()); glass.castShadow = false; glass.userData.glow = true; glass.material.emissiveIntensity = o.lit || 0; g.add(join(q), glass); g.userData.glass = glass; g.userData.size = [w, yE, d]; g.userData.chimney = chim; return g;
  }

  // ───────── 小物 ─────────
  // 岩。o = { r: 大きさ(1), color, n: 個数(1〜3 でかたまりに), moss: 上にのるこけの色, d: 細かさ(1。小さい岩は .5), seed }
  function rock(o = {}) { const r = o.r ?? 1, dd0 = o.d ?? 1, seed = o.seed ?? 1, c = o.color || '#9a9894', n = o.n ?? 1, q = [];
    for (let i = 0; i < n; i++) { const rr = r * (i ? .45 + hash(seed, i) * .2 : 1), a = seed + i * 2.4, dd = i ? r * .95 : 0; q.push(P(blob(rr, { d: dd0, j: .2, seed: seed + i * 5, flat: .45, sy: .8, sx: 1.1 }), c, Math.cos(a) * dd, rr * .34, Math.sin(a) * dd, { ry: a * 3, top: o.moss || shade(c, .1), grad: .16, jit: .07 })); }
    const g = new THREE.Group(); g.add(join(q)); return g; }
  // 草のふさを多数（InstancedMesh）。list = [[x, y, z, 大きさ, 色(かけ算)], …]。o = { color: 草の色, tip: 葉先の色 }
  function tufts(list, o = {}) { const out = []; for (let k = 0; k < 6; k++) { const a = k * 1.13, hh = .26 + hash(k, 3) * .2, b = [Math.cos(a) * .05, 0, Math.sin(a) * .05], px = -Math.sin(a) * .035, pz = Math.cos(a) * .035, lean = .06 + hash(k, 5) * .1; tri(out, [b[0] - px, 0, b[2] - pz], [b[0] + px, 0, b[2] + pz], [b[0] + Math.cos(a) * lean, hh, b[2] + Math.sin(a) * lean]); }
    const m = join([P(geoOf(out), o.color || '#5fa862', 0, 0, 0, { top: o.tip || '#a8d47a', grad: .1, jit: .05 })], MAT2), im = scatter(m, list.map(([x, y, z, s = 1, c]) => [x, y, z, hash(x, z) * 6, s, c]), { cast: false }); return im; }
  // 花を多数（InstancedMesh が 2 つ入った Group）。1 か所に 3 輪。list = [[x, y, z, 大きさ, 色の番号], …]。o = { colors: 花の色の並び, stem: くきの色 }
  function flowers(list, o = {}) { const cs = o.colors || ['#ffffff', '#f6d45a', '#f08a8a', '#b79adf'], st = [], hd = [], hp = [[-.07, .3, .02, .3], [.07, .23, -.04, -.35], [.0, .37, .06, .1]];
    for (const [x, y, z, tz] of hp) { { const sg = []; tri(sg, [x * .3 - .012, 0, z * .3], [x * .3 + .012, 0, z * .3], [x, y, z]); st.push(P(geoOf(sg), o.stem || '#5a9a58', 0, 0, 0, { jit: 0 })); } hd.push(P(lathe([[.078, .0, .3], [0, .03]], 6), '#ffffff', x, y, z, { rz: tz, rx: .3, grad: 0, jit: .04 }), P(cone(.026, .03, 4), '#ffe9a0', x - tz * .03, y + .022, z + .008, { rz: tz, rx: .3, jit: 0 })); }
    { const lf = []; tri(lf, [0, .02, 0], [.11, .1, .03], [.05, .0, .06]); tri(lf, [0, .02, 0], [-.1, .09, -.04], [-.04, 0, -.07]); st.push(P(geoOf(lf), o.stem || '#5a9a58')); }
    const L = list.map(([x, y, z, s = 1, ci]) => [x, y, z, hash(x, z) * 6, s, cs[(ci ?? Math.floor(hash(x * 3.1, z * 1.7) * cs.length)) % cs.length]]), g = new THREE.Group(); g.add(scatter(join(st, MAT2), L.map(l => [l[0], l[1], l[2], l[3], l[4]]), { cast: false }), scatter(join(hd), L, { cast: false })); return g; }
  /* さく：折れ線 pts = [[x, z], …] にそって立てる。o = { H: 地面の高さの式(x, z), h: 高さ(.95), gap: 柱の間(1.7), kind: 'rail'（横木 2 本）| 'picket'（とがった板）, color } */
  function fence(pts, o = {}) { const H = o.H || (() => 0), hh = o.h ?? .95, gap = o.gap ?? 1.7, c = o.color || (o.kind === 'picket' ? '#f6f0e2' : '#8a6a4c'), q = [], posts = [];
    for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / gap)); for (let k = i ? 1 : 0; k <= n; k++) { const x = lerp(x0, x1, k / n), z = lerp(z0, z1, k / n); posts.push([x, H(x, z), z]); } }
    posts.forEach(([x, y, z], i) => { const nx = posts[Math.min(posts.length - 1, i + 1)], pv = posts[Math.max(0, i - 1)], ry = Math.atan2(nx[0] - pv[0], nx[2] - pv[2]);
      q.push(P(cbox(.13, hh + .15, .13, .03, { top: [.6, .6] }), c, x, y + hh / 2 - .075, z, { ry, jit: .07 }));
      if (i < posts.length - 1) { const [x2, y2, z2] = posts[i + 1]; for (const f of o.kind === 'picket' ? [.3, .72] : [.42, .8]) q.push(P(tube([[x, y + hh * f, z], [x2, y2 + hh * f, z2]], .045, 4, { sq: .55, rot: 0 }), shade(c, -.06), 0, 0, 0, { jit: .05 }));
        if (o.kind === 'picket') { const d = Math.hypot(x2 - x, z2 - z), m = Math.max(1, Math.round(d / .3)); for (let k = 1; k < m; k++) { const u = k / m, px = lerp(x, x2, u), pz = lerp(z, z2, u), py = lerp(y, y2, u); q.push(P(lathe([[0, 0], [.055, 0], [.055, hh * .8], [0, hh * .93]], 4, { sz: .4 }), c, px, py + .05, pz, { ry: Math.atan2(x2 - x, z2 - z) + Math.PI / 2, jit: .05 })); } } } });
    const g = new THREE.Group(); g.add(join(q)); return g; }
  /* 街灯。o = { h: 高さ(3.2), kind: 'top'（柱の上にあかり）| 'arm'（曲がったうでから下げる）, color: 柱の色, lit: あかりの強さ, light: true で本物の点の光もつける（数は少なく） } */
  function lamp(o = {}) { const h = o.h ?? 3.2, c = o.color || '#3d4650', q = [], gl = [], arm = o.kind === 'arm', lx = arm ? .62 : 0, ly = arm ? h * .86 : h * .88;
    q.push(P(lathe([[0, 0], [.2, 0], [.18, .1], [.09, .32], [.075, .5], [0, .5]], 6), c), P(tube([[0, .45, 0], [0, arm ? h * .9 : ly - .06, 0]], [.06, .045], 6), c, 0, 0, 0, { grad: .05 }));
    if (arm) q.push(P(tube([[0, h * .86, 0], [0, h, 0], [.2, h * 1.06, 0], [.5, h * 1.04, 0], [lx, h * .98, 0], [lx, ly + .26, 0]], .032, 5), c), P(blob(.07, { d: 0, j: 0 }), c, 0, h * .9, 0));
    q.push(P(lathe([[.06, ly - .06], [.16, ly], [.17, ly + .04], [.1, ly + .05]], 6), c), P(lathe([[.2, ly + .32], [.26, ly + .3, .04], [.1, ly + .42], [.03, ly + .5], [0, ly + .56]], 6), c), P(blob(.035, { d: 0, j: 0 }), c, 0, ly + .58, 0));
    q.forEach((p, i) => { if (i >= (arm ? 4 : 2)) p.translate(lx, 0, 0); });
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; q.push(P(bx(.022, .28, .022), c, lx + Math.cos(a) * .165, ly + .17, Math.sin(a) * .165, { rz: -Math.cos(a) * .1, rx: Math.sin(a) * .1, jit: 0 })); }
    gl.push(P(lathe([[.12, ly + .04], [.16, ly + .3], [0, ly + .3]], 6), '#ffffff', lx, 0, 0));
    const g = new THREE.Group(), glass = join(gl, glowMat('#e8e4d0', '#ffd27a')); glass.castShadow = false; glass.userData.glow = 1.6; glass.material.emissiveIntensity = (o.lit || 0) * 1.6; g.add(join(q), glass);
    if (o.light) { const pl = new THREE.PointLight('#ffc878', o.light === true ? 12 : o.light, 9, 1.6); pl.position.set(lx, ly + .15, 0); g.add(pl); g.userData.light = pl; } return g; }
  // ベンチ。前は +z。o = { w: 横(1.5), color: 板の色, metal: 足の色, seat: 座面の高さ(.42) }
  function bench(o = {}) { const w = o.w ?? 1.5, c = o.color || '#a8744a', mc = o.metal || '#3d4650', sy = o.seat ?? .42, q = [];
    for (let k = 0; k < 3; k++) q.push(P(cbox(w, .045, .125, .014), c, 0, sy, -.15 + k * .15, { jit: .06 })); for (let k = 0; k < 2; k++) q.push(P(cbox(w, .13, .04, .014), c, 0, sy + .22 + k * .2, -.27 - k * .05, { rx: -.22, jit: .06 }));
    for (const s of [-1, 1]) { const x = s * (w / 2 - .14); q.push(P(tube([[x, 0, .2], [x, sy - .04, .17], [x, sy - .04, -.2]], .03, 4), mc), P(tube([[x, 0, -.3], [x, sy, -.22], [x, sy + .52, -.36]], .03, 4), mc), P(tube([[x, sy + .26, -.28], [x, sy + .24, .14], [x, sy - .02, .2]], .028, 4), mc)); }
    const g = new THREE.Group(); g.add(join(q)); g.userData.seat = sy; return g; }
  // 看板。o = { kind: 'board'（柱 2 本の板）| 'arrow'（矢じるしの道しるべ）| 'hang'（つり下げ看板）, color: 板の色, post: 柱の色, mark: 絵がらの色 }
  function sign(o = {}) { const kind = o.kind || 'arrow', c = o.color || '#e8d4a8', pc = o.post || '#7a5a44', mk = o.mark || '#6a4a3a', q = [];
    if (kind === 'arrow') { q.push(P(tube([[0, 0, 0], [.02, 1.0, 0], [0, 1.9, 0]], [.07, .055, .045], 5), pc, 0, 0, 0, { jit: .06 })); [[1.5, .12, c, 1], [1.16, -.5, shade(c, -.1), -1]].forEach(([y, ry, cc, dir], i) => { const a = prism([[-.5, -.13], [.3, -.13], [.52, 0], [.3, .13], [-.5, .13]], .05, .012); q.push(P(a, cc, .12 * dir, y, .07, { ry: ry + (dir < 0 ? Math.PI : 0) })); for (let k = 0; k < 3; k++) q.push(P(bx(.16 - k * .03, .028, .012), mk, (.12 + (-.28 + k * .2)) * dir * Math.cos(ry), y + (k % 2 ? -.02 : .03), .07 + .03 + Math.sin(-ry) * (-.28 + k * .2) * dir, { ry, jit: 0, grad: 0 })); }); q.push(P(cone(.07, .1, 5), pc, 0, 1.9, 0)); }
    else if (kind === 'hang') { q.push(P(tube([[0, 0, 0], [0, 2.5, 0]], [.07, .055], 5), pc), P(tube([[0, 2.3, 0], [.95, 2.3, 0]], .035, 4), pc), P(tube([[0, 1.9, 0], [.4, 2.28, 0]], .025, 4), pc), P(cbox(.72, .5, .06, .04), c, .52, 1.9, 0), P(cbox(.78, .56, .035, .03), pc, .52, 1.9, 0)); for (const z of [-.035, .035]) q.push(P(cyl(.13, .13, .012, 8), mk, .52, 1.92, z, { rx: Math.PI / 2, jit: 0 })); for (const x of [.28, .76]) q.push(P(bx(.02, .2, .02), '#3d4650', x, 2.22, 0)); }
    else { for (const x of [-.55, .55]) q.push(P(tube([[x, 0, 0], [x, 1.55, 0]], [.06, .05], 5), pc)); q.push(P(cbox(1.5, .8, .07, .03), c, 0, 1.2, .03), P(cbox(1.6, .1, .12, .03), pc, 0, 1.64, .03)); for (let k = 0; k < 4; k++) q.push(P(bx(k === 0 ? .7 : 1.1 - (k % 2) * .3, k === 0 ? .1 : .05, .012), mk, k === 0 ? 0 : -(k % 2) * .15, 1.46 - k * .16 - (k ? .04 : 0), .072, { jit: 0, grad: 0 })); }
    const g = new THREE.Group(); g.add(join(q)); return g; }
  // 井戸：石の輪、柱と小屋根、まき上げの棒、おけ。o = { stone, wood, roofColor, water }
  function well(o = {}) { const sc = o.stone || '#a9a59c', wc = o.wood || '#7a5a44', q = [];
    q.push(P(lathe([[0, 0], [.86, 0], [.9, .12], [.84, .2, .02], [.86, .74, .02], [.92, .8], [.92, .92], [.64, .92], [.64, .4], [0, .4]], 9), sc, 0, 0, 0, { jit: .1, grad: .1 }), P(lathe([[.64, .58], [0, .58]], 9), o.water || '#5aa2c8', 0, 0, 0, { jit: .05, grad: 0 }));
    for (const s of [-1, 1]) q.push(P(cbox(.13, 1.7, .13, .03), wc, s * .78, .92 + .8, 0, { jit: .06 }), P(cbox(.1, .1, 1.5, .02), wc, s * .78, 2.48, 0));
    for (const s of [-1, 1]) { for (let k = 0; k < 2; k++) q.push(P(cbox(2.1, .07, .52, .02), k ? shade(o.roofColor || '#c8563e', -.07) : (o.roofColor || '#c8563e'), 0, 2.56 + k * .3 + .03, s * (.7 - k * .43), { rx: s * .62, jit: .04 })); }
    q.push(P(cbox(2.16, .1, .2, .03), shade(o.roofColor || '#c8563e', -.2), 0, 3.04, 0), P(tube([[-.92, 1.9, 0], [.92, 1.9, 0]], .055, 6), wc), P(tube([[.92, 1.9, 0], [1.06, 1.9, 0], [1.06, 1.68, 0], [1.22, 1.68, 0]], .028, 4), '#3d4650'), P(tube([[.1, 1.9, 0], [.1, 1.22, 0]], .014, 3), '#d8c8a0'), P(lathe([[0, 1.0], [.12, 1.0], [.16, 1.22], [.13, 1.22], [.1, 1.05], [0, 1.05]], 6), wc, .1, 0, 0), P(tube([[-.4, 1.9, 0], [.4, 1.9, 0]], .075, 6), '#d8c8a0'));
    const g = new THREE.Group(); g.add(join(q)); return g; }
  // 橋：そった板の橋。z の方向にわたる（両はしが y=0）。o = { len: 長さ(7), w: はば(2.2), rise: そりの高さ(.7), color, rail: 手すりの色 }
  function bridge(o = {}) { const len = o.len ?? 7, w = o.w ?? 2.2, rise = o.rise ?? .7, c = o.color || '#a8744a', rc = o.rail || '#c8563e', q = [], n = Math.round(len / .34), Y = u => rise * (1 - (2 * u - 1) ** 2), pt = (u, x, dy = 0) => [x, Y(u) + dy, (u - .5) * len];
    for (let i = 0; i < n; i++) { const u = (i + .5) / n, sl = Math.atan2(Y(u + .01) - Y(u - .01), .02 * len); q.push(P(bx(w, .07, len / n - .03), i % 2 ? shade(c, -.06) : c, 0, Y(u) + .02, (u - .5) * len, { rx: -sl, jit: .06 })); }
    for (const s of [-1, 1]) { const us = [...Array(9)].map((_, i) => i / 8); q.push(P(tube(us.map(u => pt(u, s * (w / 2 - .06), -.12)), .09, 4), shade(c, -.2)), P(tube(us.map(u => pt(u, s * (w / 2 - .02), .86)), .05, 5), rc), P(tube(us.map(u => pt(u, s * (w / 2 - .02), .45)), .03, 4), rc));
      for (let k = 0; k <= 6; k++) { const u = k / 6; q.push(P(cbox(.12, 1.1, .12, .03), rc, s * (w / 2 - .02), Y(u) + .45, (u - .5) * len), P(blob(.085, { d: 0, j: 0 }), shade(rc, -.15), s * (w / 2 - .02), Y(u) + 1.05, (u - .5) * len)); } }
    const g = new THREE.Group(); g.add(join(q)); g.userData.y = Y; return g; }
  // 雲：下が平らなでこぼこのかたまり。光を受けず、上が明るく下に色がつく。o = { s: 大きさ(1), color: 上の色, shade: 下の色, n: かたまりの数(5), seed }
  function cloud(o = {}) { const s = o.s ?? 1, seed = o.seed ?? 1, n = o.n ?? 5, q = [];
    for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) - .5 : 0, r = (2.6 - Math.abs(u) * 2.2 + hash(seed, i) * .8) * s; q.push(P(blob(r, { d: 1, j: .14, seed: seed + i, flat: .38, sy: .78 }), o.shade || '#dfe8f2', u * 9 * s + (hash(seed, i + 9) - .5) * s, r * .3, (hash(seed, i + 5) - .5) * 3 * s, { top: o.color || '#ffffff', grad: 0, jit: .025, ry: i })); }
    const m = join(q, MATSKY); m.castShadow = m.receiveShadow = false; m.userData.noEdge = true; const g = new THREE.Group(); g.add(m); return g; }

  /* けむり・ほこり・湯気：でこぼこの小さな玉が、ふくらみながら上がって消える（ローポリのまま）。puffs(scene, { n: 最大数(40), color, opacity })。
     返すもの { emit(x, y, z, { life: 秒, size, grow: ふくらむ倍率, vx, vy, vz }), update(dt) }。毎コマ update を呼ぶ */
  function puffs(scene, o = {}) { const n = o.n || 40, im = new THREE.InstancedMesh(paint(blob(1, { d: 0, j: .14 }), o.color || '#ffffff', { grad: .12, jit: .04 }), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, transparent: (o.opacity ?? .92) < 1, opacity: o.opacity ?? .92 }), n), d = new THREE.Object3D(), ps = [...Array(n)].map(() => ({ age: 1, life: 1 }));
    d.scale.setScalar(0); d.updateMatrix(); for (let i = 0; i < n; i++) im.setMatrixAt(i, d.matrix); im.frustumCulled = false; scene.add(im);
    return { mesh: im, emit(x, y, z, e = {}) { const p = ps.find(q => q.age >= q.life); if (p) Object.assign(p, { age: 0, life: e.life || 2.5, x, y, z, size: e.size || .3, grow: e.grow ?? 2, vx: e.vx || 0, vy: e.vy ?? .7, vz: e.vz || 0, r: Math.random() * 6 }); },
      update(dt) { ps.forEach((p, i) => { if (p.age >= p.life) return; p.age += dt; const k = Math.min(1, p.age / p.life); p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; d.position.set(p.x, p.y, p.z); d.rotation.set(p.r, p.r + p.age * .4, 0); d.scale.setScalar(k >= 1 ? 0 : p.size * (1 + p.grow * k) * smooth(0, .12, k) * smooth(1, .55, k)); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); im.instanceMatrix.needsUpdate = true; } }; }

  // ───────── 動物 ─────────
  /* 4 本足の動物。前は +z。animal('dog' | 'cat' | 'sheep', o)。o = { color: 体の色, color2: 耳・しっぽの先・足先などの色, collar: 首輪の色, s: 大きさ(1) }。動かすのは gait() */
  function animal(kind = 'dog', o = {}) {
    const D = { dog: { L: .62, r: .135, leg: .3, hr: .13, c: '#d8a05a', c2: '#8a5a3a' }, cat: { L: .44, r: .095, leg: .2, hr: .105, c: '#e8e2d8', c2: '#6a625e' }, sheep: { L: .78, r: .31, leg: .2, hr: .14, c: '#f4eee0', c2: '#4a4248' } }[kind], sc = o.s ?? 1, { L, r, leg, hr } = D, c = o.color || D.c, c2 = o.color2 || D.c2, by = leg + r * .8;
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body); g.scale.setScalar(sc); const bq = [], hq = [], tq = [], legs = [];
    if (kind === 'sheep') { bq.push(P(blob(r, { d: 1, j: .13, sx: .92, sy: .9, sz: 1.3, seed: 3 }), c, 0, by + r * .1, 0, { grad: .14, jit: .05 })); bq.push(P(blob(r * .5, { d: .5, j: .12 }), c, 0, by + r * .55, L * .42));
      hq.push(P(lathe([[0, -hr * 1.3], [hr * .5, -hr * 1.2], [hr * .72, -hr * .2], [hr * .7, hr * .5], [0, hr * .8]], 6, { sz: 1.0 }), c2, 0, 0, hr * .5, { rx: 1.25 }), P(blob(hr * .62, { d: .5, j: .14 }), c, 0, hr * .62, -hr * .1)); for (const s of [-1, 1]) hq.push(P(cone(hr * .26, hr * .9, 4), c2, s * hr * .6, hr * .28, -hr * .05, { rz: -s * 1.8 }), P(blob(hr * .09, { d: 0, j: 0 }), '#f4f0e6', s * hr * .42, hr * .12, hr * .98, { jit: 0 }));
      tq.push(P(blob(r * .28, { d: 0, j: .1 }), c, 0, 0, -.04)); }
    else { const cat = kind === 'cat';
      bq.push(P(tube([[0, by - r * .1, -L / 2 - r * .5], [0, by, -L / 2], [0, by + .005, 0], [0, by + r * .12, L / 2], [0, by + r * .5, L / 2 + r * .7]], [r * .45, r * .96, r * .88, r * 1.04, r * .62], 8, { sq: 1.12 }), c, 0, 0, 0, { grad: .14 }));
      if (o.belly !== false) bq.push(P(blob(r * .8, { d: 0, j: 0, sx: .8, sy: .5, sz: 1.5 }), shade(c, .25), 0, by - r * .68, L * .12));
      if (o.collar) bq.push(P(lathe([[r * .66, -.02], [r * .74, 0], [r * .66, .03]], 8), o.collar, 0, by + r * .62, L / 2 + r * .55, { rx: 1.0 }));
      hq.push(P(blob(hr, { d: 1, j: .04, sx: 1.02, sy: .92, sz: 1.0 }), c, 0, hr * .5, hr * .35, { grad: .08, jit: .03 }));
      hq.push(P(tube([[0, hr * .3, hr * 1.0], [0, hr * .22, hr * (cat ? 1.42 : 1.85)]], [hr * (cat ? .5 : .56), hr * (cat ? .3 : .36)], 6), cat ? c : shade(c, .25), 0, 0, 0, { jit: .02 }), P(blob(hr * .15, { d: 0, j: 0 }), '#3a2e30', 0, hr * .3, hr * (cat ? 1.44 : 1.88), { jit: 0 }));
      for (const s of [-1, 1]) { hq.push(P(blob(hr * .12, { d: 0, j: 0, sy: 1.25 }), '#2c2430', s * hr * .46, hr * .68, hr * 1.1, { jit: 0, grad: 0 }));
        if (cat) hq.push(P(cone(hr * .4, hr * .62, 4), c2, s * hr * .58, hr * 1.12, hr * .22, { rz: -s * .3, rx: -.1 })); else hq.push(P(blob(hr * .5, { d: 0, j: .08, sx: .4, sy: 1.15, sz: .8 }), c2, s * hr * .98, hr * .62, hr * .22, { rz: s * .25 })); }
      if (cat) tq.push(P(tube([[0, 0, 0], [0, .08, -.1], [0, .24, -.14], [0, .36, -.08], [0, .4, .0]], [.026, .026, .024, .022, .012], 5), c), P(tube([[0, .345, -.092], [0, .4, .0]], [.0235, .013], 5), c2));
      else tq.push(P(tube([[0, 0, 0], [0, .1, -.09], [0, .24, -.1], [0, .3, -.05]], [.04, .036, .028, .01], 5), c), P(tube([[0, .235, -.1], [0, .3, -.05]], [.03, .011], 5), shade(c, .3))); }
    body.add(join(bq)); const head = new THREE.Group(); head.position.set(0, kind === 'sheep' ? by + r * .3 : by + r * .62, kind === 'sheep' ? L * .5 + r * .2 : L / 2 + r * .72); head.add(join(hq)); body.add(head);
    const tail = new THREE.Group(); tail.position.set(0, kind === 'sheep' ? by + r * .2 : by + r * .5, kind === 'sheep' ? -r * 1.25 : -L / 2 - r * .5); tail.add(join(tq)); body.add(tail);
    const lr = kind === 'sheep' ? .045 : r * .3, lx = kind === 'sheep' ? r * .5 : r * .58, lc = kind === 'sheep' ? c2 : c, ly = kind === 'sheep' ? leg * 1.5 : leg + r * .25;
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const p = new THREE.Group(); p.position.set(sx * lx, ly, sz * (kind === 'sheep' ? L * .32 : L / 2 - r * .25)); p.add(join([P(tube([[0, 0, 0], [0, -ly * .5, sz < 0 ? -.012 : .008], [0, -ly + lr * .7, 0]], [lr * 1.25, lr * .9, lr * .8], 5), lc), P(blob(lr * 1.15, { d: 0, j: 0, sy: .7, sz: 1.35 }), kind === 'sheep' ? '#3a3238' : (o.socks === false ? c : shade(c, .3)), 0, -ly + lr * .7, lr * .3, { jit: .02 })])); body.add(p); legs.push(p); }
    g.userData.rig = { body, head, tail, legs, leg: ly, kind, stride: ly * 1.5 }; return g;
  }
  // 動物を動かす。gait(動物, 種類, 位相, 強さ)。種類 = 'walk' | 'run' | 'stand'（しっぽだけ動く）| 'sit'（すわる）| 'graze'（草を食べる）
  function gait(g, kind = 'walk', ph = 0, amt = 1) { const r = g.userData.rig, s = Math.sin(ph), cat = r.kind === 'cat';
    r.body.position.y = 0; r.body.rotation.set(0, 0, 0); r.head.rotation.set(0, 0, 0); r.legs.forEach(l => l.rotation.set(0, 0, 0)); r.tail.rotation.set(cat ? 0 : .2, r.kind === 'dog' ? Math.sin(ph * 2.3) * .5 : Math.sin(ph * .5) * .25, 0);
    if (kind === 'walk' || kind === 'run') { const A = (kind === 'run' ? .8 : .45) * amt, run = kind === 'run'; r.legs[0].rotation.x = -A * s; r.legs[3].rotation.x = run ? A * s : -A * s; r.legs[1].rotation.x = run ? -A * Math.sin(ph - .5) : A * s; r.legs[2].rotation.x = run ? A * Math.sin(ph - .5) : A * s;
      r.body.position.y = (run ? .05 * Math.abs(s) : .012 * Math.cos(ph * 2)) * amt; r.body.rotation.x = run ? .1 * s : 0; r.head.rotation.x = .06 * Math.sin(ph * 2) + (run ? -.1 * s : 0); r.body.rotation.z = .03 * s * amt; }
    else if (kind === 'sit') { r.body.rotation.x = -.62; r.body.position.y = -r.leg * .42; r.body.position.z = 0; r.legs[0].rotation.x = r.legs[1].rotation.x = .62; r.legs[2].rotation.x = r.legs[3].rotation.x = -.85; r.head.rotation.x = .5 + .05 * s; r.head.rotation.y = .3 * Math.sin(ph * .4) * amt; if (cat) r.tail.rotation.x = -1.2; }
    else if (kind === 'graze') { r.head.rotation.x = 1.0 + .12 * Math.sin(ph * 3); r.head.rotation.y = .1 * Math.sin(ph * .7); }
    else { r.head.rotation.y = .3 * Math.sin(ph * .4) * amt; r.head.rotation.x = .04 * s; }
    return g; }
  // 鳥。前は +z。o = { color, belly: おなかの色, beak, s: 大きさ(1 で 20cm ほど。遠くに飛ばすなら 2〜3) }。flap(鳥, 位相) ではばたく。flap(鳥, 位相, 0) で羽をたたんで立つ
  function bird(o = {}) { const c = o.color || '#f4f0e6', g = new THREE.Group(), q = [], wings = []; g.scale.setScalar(o.s ?? 1);
    q.push(P(tube([[0, .1, -.12], [0, .1, -.06], [0, .105, .02], [0, .13, .08]], [.012, .05, .06, .035], 6, { sq: 1.05 }), c, 0, 0, 0, { grad: .1 }), P(blob(.045, { d: 0, j: 0, sx: .8, sy: .5, sz: 1.3 }), o.belly || shade(c, .3), 0, .068, .02), P(blob(.042, { d: .5, j: .03 }), c, 0, .165, .09), P(cone(.016, .05, 4), o.beak || '#f0a03a', 0, .16, .125, { rx: Math.PI / 2 }), P(cbox(.07, .012, .12, .004, { top: [1, 1] }), shade(c, -.2), 0, .11, -.16, { rx: -.2 }));
    for (const s of [-1, 1]) { q.push(P(blob(.008, { d: 0, j: 0 }), '#2c2430', s * .028, .175, .118, { jit: 0 }), P(tube([[s * .02, .06, 0], [s * .022, 0, .01]], .005, 3), o.beak || '#f0a03a'));
      const w = new THREE.Group(); w.position.set(s * .04, .13, .0); const wg = []; tri(wg, [0, 0, .06], [s * .2, 0, .02], [0, 0, -.06]); tri(wg, [s * .2, 0, .02], [s * .22, 0, -.09], [0, 0, -.06]); w.add(join([P(geoOf(wg), shade(c, -.14), 0, 0, 0, { grad: 0 })], MAT2)); g.add(w); wings.push(w); }
    g.add(join(q)); g.userData.rig = { wings }; return g; }
  function flap(g, ph = 0, amt = 1) { const w = g.userData.rig.wings, a = amt ? Math.sin(ph) * .95 * amt + .1 : 1.3; w[0].rotation.z = a; w[1].rotation.z = -a; if (!amt) { w[0].rotation.y = .3; w[1].rotation.y = -.3; } else w[0].rotation.y = w[1].rotation.y = 0; return g; }

  // ───────── 乗りもの ─────────
  // 色つきの形から、重心の高さが fn に合う三角だけ残す（輪の上半分だけ使う、など）
  const keep = (g, fn) => { const p = g.attributes.position.array, c = g.attributes.color.array, a = [], b = []; for (let i = 0; i < p.length; i += 9) if (fn((p[i + 1] + p[i + 4] + p[i + 7]) / 3)) for (let k = 0; k < 9; k++) { a.push(p[i + k]); b.push(c[i + k]); } const o = geoOf(a); o.setAttribute('color', new THREE.Float32BufferAttribute(b, 3)); return o; };
  const wheel = (r, wd, tire = '#34343c', hub = '#d8d4cc') => { const m = join([P(lathe([[0, -wd / 2], [r * .82, -wd / 2], [r, -wd * .3], [r, wd * .3], [r * .82, wd / 2], [0, wd / 2]], 10), tire, 0, 0, 0, { rz: Math.PI / 2, grad: 0 }), P(lathe([[0, -wd * .56], [r * .52, -wd * .56], [r * .52, wd * .56], [0, wd * .56]], 6), hub, 0, 0, 0, { rz: Math.PI / 2, grad: 0, jit: .08 })]); return m; };
  /* 車：丸みのある小さな車。前は +z。o = { kind: 'mini' | 'truck', body: 車体の色, roof: 屋根の色, trim: バンパーの色, lit: ライトの強さ, rack: true で屋根に荷物 }。userData.wheels を rotation.x で回す */
  function car(o = {}) { const c = o.body || '#e8563e', tc = o.trim || '#d8d4cc', truck = o.kind === 'truck', q = [], gl = [], g = new THREE.Group(), W = 1.5, GL = '#3f5566';
    const side = (pts, wd, bev) => { const p = prism(pts, wd, bev); p.rotateY(-Math.PI / 2); return p; };   // (z, y) の横顔を x の方向へ押し出す
    q.push(P(side([[-1.58, .3], [-1.62, .6], [-1.5, .86], [-1.0, .92], [.72, .92], [1.3, .84], [1.58, .68], [1.62, .42], [1.56, .3]], W, .11), c, 0, 0, 0, { grad: .1, jit: .03 }));
    const cab = truck ? [[-.12, .9], [-.06, 1.5], [.5, 1.5], [.98, .9]] : [[-1.28, .9], [-1.0, 1.46], [.2, 1.46], [.76, .9]], cw = truck ? [[.0, .97], [.04, 1.4], [.46, 1.4], [.82, .97]] : [[-1.1, .97], [-.92, 1.38], [.14, 1.38], [.6, .97]], gw = cab.map(([z, y], i) => [z + (i < 2 ? -.025 : .025), i === 0 || i === 3 ? y + .07 : y - .08]);
    const tp = (p, y) => { const a = p.attributes.position; for (let i = 0; i < a.count; i++) a.setX(i, a.getX(i) * lerp(1, .84, clamp((a.getY(i) - .9) / .56))); return p; };
    q.push(P(tp(side(cab, W - .1, .08)), o.roof || c, 0, 0, 0, { grad: .06, jit: .03 }), P(tp(side(cw, W - .08, .0)), GL, 0, 0, 0, { grad: .1, jit: 0 }), P(tp(side(gw, W - .46, .0)), GL, 0, 0, 0, { grad: .1, jit: 0 }));
    if (!truck) q.push(P(tp(bx(W - .06, .46, .09)), o.roof || c, 0, 1.18, -.36, { jit: 0 }));
    if (truck) { q.push(P(cbox(W - .06, .3, 1.42, .04), shade(c, -.1), 0, 1.02, -.86)); q.push(P(bx(W - .2, .04, 1.3), '#6a5a4a', 0, 1.16, -.86)); for (const [x, y, z, s] of [[-.3, 1.3, -.6, .26], [.25, 1.28, -1.0, .24], [-.2, 1.26, -1.15, .2], [.3, 1.32, -.5, .2]]) q.push(P(blob(s, { d: .5, j: .1, flat: .6 }), ['#f0a03a', '#e8843a', '#f6d45a'][Math.round(x * 10 + 9) % 3], x, y, z)); }
    if (o.rack && !truck) { q.push(P(bx(1.0, .03, 1.0), '#5a5a62', 0, 1.52, -.4), P(cbox(.8, .26, .5, .05), '#b8845a', 0, 1.67, -.55), P(cbox(.6, .2, .36, .06), '#5a8a7a', .05, 1.63, -.05)); }
    for (const s of [-1, 1]) { q.push(P(cbox(W - .06, .15, .14, .05), tc, 0, .42, s * 1.6), P(cbox(.1, .07, .78, .03), shade(c, -.12), s * (W / 2 - .01), .68, 0)); for (const z of [-1, 1]) q.push(keep(P(lathe([[.33, -.09], [.41, -.06], [.41, .06], [.33, .09]], 10), shade(c, -.1), s * (W / 2 - .03), .33, z * 1.0, { rz: Math.PI / 2 }), y => y > .4));
      q.push(P(cbox(.07, .09, .12, .02), c, s * (W / 2 + .02), 1.0, .7), P(bx(.03, .03, .12), tc, s * (W / 2 - .02), .86, truck ? .45 : .1));
      gl.push(P(cyl(.11, .11, .06, 8), '#ffffff', s * .48, .68, 1.6, { rx: Math.PI / 2 })); q.push(P(cbox(.2, .1, .05, .02), '#e8483a', s * .5, .7, -1.62, { jit: 0 })); }
    q.push(P(bx(.6, .12, .04), '#3d4650', 0, .64, 1.63, { jit: 0 }), P(bx(.34, .12, .03), '#f4f0e6', 0, .46, -1.68, { jit: 0 }));
    const glass = join(gl, glowMat('#fff6d8', '#fff0b0')); glass.castShadow = false; glass.userData.glow = 1.5; glass.material.emissiveIntensity = (o.lit || 0) * 1.5; g.add(join(q), glass); g.userData.wheels = [];
    for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const wq = wheel(.31, .2); wq.position.set(x * (W / 2 - .12), .31, z * 1.0); g.add(wq); g.userData.wheels.push(wq); } return g; }
  /* 自転車。前は +z。o = { color: わくの色, basket: false でかごなし, seat }。userData.wheels と userData.crank（ペダル）を rotation.x で回す。
     人を乗せるには ride(自転車, 人, 進んだ距離)：人を自転車の子にして、こぐ姿勢にし、車輪とペダルを回す */
  function bicycle(o = {}) { const c = o.color || '#4a8ac0', g = new THREE.Group(), q = [], R = .33, mc = '#3d4650', T = (a, b, r = .022) => q.push(P(tube([a, b], r, 5), c, 0, 0, 0, { jit: .02 }));
    const A = [0, R, -.52], Bb = [0, .3, -.06], S = [0, .78, -.24], Hd = [0, .86, .36], Hb = [0, .6, .42], F = [0, R, .54];
    T(Bb, S, .024); T([0, .7, -.21], Hd); T(Bb, Hb, .026); T(Hb, Hd, .026); for (const s of [-1, 1]) { T([s * .05, R, -.52], [s * .02, .3, -.06], .014); T([s * .05, R, -.52], [s * .015, .7, -.21], .013); q.push(P(tube([[s * .012, .6, .42], [s * .05, R, .54]], .015, 4), mc)); }
    q.push(P(tube([S, [0, .88, -.27]], .016, 4), mc), P(cbox(.15, .05, .27, .02, { top: [.9, .9] }), o.seat || '#5a4030', 0, .9, -.27), P(tube([Hd, [0, 1.0, .33]], .016, 4), mc), P(tube([[-.26, 1.02, .28], [-.2, 1.0, .33], [.2, 1.0, .33], [.26, 1.02, .28]], .016, 4), mc));
    for (const s of [-1, 1]) q.push(P(tube([[s * .19, 1.0, .33], [s * .27, 1.02, .27]], .022, 4), '#5a4030'));
    if (o.basket !== false) q.push(P(lathe([[0, 0], [.11, 0], [.15, .2], [.13, .2], [.1, .03], [0, .03]], 6, { sz: .8 }), '#c8a06a', 0, .78, .56, { jit: .08 }), P(tube([[0, .84, .4], [0, .84, .46]], .012, 3), mc));
    g.add(join(q));
    const mkW = () => { const w = join([P(new THREE.TorusGeometry(R - .025, .026, 4, 12), '#34343c', 0, 0, 0, { ry: Math.PI / 2, grad: 0 }), ...[0, 1, 2].map(k => P(bx(.008, R * 1.86, .012), '#b8b8c0', 0, 0, 0, { rx: k * Math.PI / 3, jit: 0, grad: 0 })), P(cyl(.03, .03, .08, 5), mc, 0, 0, 0, { rz: Math.PI / 2 })]); return w; };
    const w1 = mkW(), w2 = mkW(); w1.position.set(...F); w2.position.set(...A); const crank = new THREE.Group(); crank.position.set(...Bb);
    crank.add(join([P(cyl(.07, .07, .012, 8), mc, .04, 0, 0, { rz: Math.PI / 2 }), P(bx(.014, .17, .024), mc, .055, .085, 0), P(bx(.014, .17, .024), mc, -.055, -.085, 0), P(cbox(.09, .02, .06, .006), mc, .105, .17, 0), P(cbox(.09, .02, .06, .006), mc, -.105, -.17, 0)]));
    g.add(w1, w2, crank); g.userData.wheels = [w1, w2]; g.userData.crank = crank; g.userData.seatY = .93; g.userData.R = R; return g; }
  function ride(bike, rider, dist = 0) { if (rider.parent !== bike) bike.add(rider); const r = rider.userData.rig, ph = dist / (bike.userData.R * 2.6); pose(rider, 'ride', ph); rider.position.set(0, bike.userData.seatY - (r.hipY - r.th * .45) + r.h * .035, -.3); rider.rotation.set(0, 0, 0); for (const w of bike.userData.wheels) w.rotation.x = dist / bike.userData.R; bike.userData.crank.rotation.x = ph + Math.PI / 2; return bike; }
  /* 小舟。前（へさき）は +z。船底が y=0（水に .12 ほどしずめて置く）。o = { len: 長さ(3.4), hull: 船体の色, trim: ふちの色, inside: 内がわの色, sail: 帆の色（つけると帆かけ舟）, oars: false でかいなし }。userData.oars を rotation.y でこぐ */
  function boat(o = {}) { const len = o.len ?? 3.4, k = len / 3.4, hc = o.hull || '#e8e2d2', tc = o.trim || '#c8563e', ic = o.inside || '#c8a070', q = [], g = new THREE.Group(), N = 7, hw = [.4, .58, .66, .66, .56, .36, .03], st = [];
    for (let i = 0; i < N; i++) { const u = i / (N - 1), w = hw[i] * k, sh = (.44 + .2 * u * u * u + .04 * (1 - u) ** 2) * k, bt = (.02 + .16 * u ** 3) * k, z = (u - .46) * len; st.push([[-w, sh, z], [-w * .82, bt + .16 * k, z], [0, bt, z], [w * .82, bt + .16 * k, z], [w, sh, z]]); }
    const hull = [], ins = []; for (let i = 0; i < N - 1; i++) for (let j = 0; j < 4; j++) { const A = st[i][j], B = st[i][j + 1], C = st[i + 1][j + 1], D = st[i + 1][j]; tri(hull, A, B, D); tri(hull, B, C, D); const f = p => [p[0] * .9, p[1] + .035 * (p[1] < .3 ? 1 : 0), p[2] * .985]; tri(ins, f(A), f(D), f(B)); tri(ins, f(B), f(D), f(C)); }
    for (let j = 0; j < 3; j++) { tri(hull, st[0][0], st[0][j + 1], st[0][j + 2 > 4 ? 4 : j + 2]); } tri(hull, st[0][0], st[0][3], st[0][4]); tri(hull, st[0][0], st[0][2], st[0][3]);
    q.push(P(geoOf(hull), hc, 0, 0, 0, { grad: .14, jit: .04 }), P(geoOf(ins), ic, 0, 0, 0, { grad: .12, jit: .04 }));
    for (const s of [-1, 1]) q.push(P(tube(st.map(r => [r[s < 0 ? 0 : 4][0] * 1.01, r[0][1], r[0][2]]), .04 * k, 4), tc, 0, 0, 0, { jit: .03 }));
    q.push(P(tube([st[0][0], st[0][4]].map(p => [p[0], p[1], p[2] - .01]), .04 * k, 4), tc), P(tube([[0, .62 * k, st[N - 1][0][2] - .04], [0, .8 * k, st[N - 1][0][2] + .06]], [.04 * k, .03 * k], 4), tc));
    for (const i of [1, 3]) q.push(P(cbox(hw[i] * k * 1.9, .04, .26 * k, .012), shade(ic, -.12), 0, .31 * k, st[i][0][2] + .1));
    q.push(P(bx(.7 * k, .02, len * .62), shade(ic, -.05), 0, .13 * k, -.1 * len));
    const oars = []; if (o.sail) { const mh = 3.1 * k, mz = .25 * k; q.push(P(tube([[0, .1, mz], [0, mh, mz]], [.045 * k, .028 * k], 5), '#7a5a44'), P(tube([[0, .85 * k, mz], [0, .8 * k, mz - 1.45 * k]], .028 * k, 4), '#7a5a44'));
      const sg = [], a = [0, .95 * k, mz - .05], b = [0, mh - .1, mz - .05], c = [0, .92 * k, mz - 1.4 * k], m = [.2 * k, 1.6 * k, mz - .5 * k]; tri(sg, a, b, m); tri(sg, b, c, m); tri(sg, c, a, m); q.push(P(geoOf(sg), o.sail, 0, 0, 0, { grad: .08, jit: .03 }));
      const jg = [], d = [0, mh - .3, mz + .05], e = [0, .7 * k, st[N - 1][0][2] - .05], f = [0, .9 * k, mz + .08], n = [-.1 * k, 1.5 * k, mz + .5 * k]; tri(jg, d, e, n); tri(jg, e, f, n); tri(jg, f, d, n); q.push(P(geoOf(jg), shade(o.sail, -.06), 0, 0, 0, { grad: .08, jit: .03 }));
      const fg = []; tri(fg, [0, mh, mz], [0, mh - .16, mz], [0, mh - .08, mz - .34]); q.push(P(geoOf(fg), tc)); }
    else if (o.oars !== false) for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * hw[3] * k, .5 * k, st[3][0][2] - .25); p.add(join([P(tube([[-s * .4, .12, 0], [s * 1.2, -.34, 0]], .022, 4), '#a8845a'), P(cbox(.42, .02, .13, .008), tc, s * 1.32, -.385, 0, { rz: -s * .28 })], MAT2)); p.rotation.y = -s * .35; g.add(p); oars.push(p); }
    g.add(join(q, MAT2)); g.userData.oars = oars; return g; }
  /* 小さな電車（1 両）。前は +z。o = { len: 長さ(8.5), body: 下の色, upper: 上の色, roof, stripe: 帯の色, lit: 窓とライトの強さ, panto: false でパンタグラフなし }。userData.wheels を rotation.x で回す */
  function train(o = {}) { const len = o.len ?? 8.5, c = o.body || '#3f8f6a', uc = o.upper || '#f6ecd2', rc = o.roof || '#b9b5ac', q = [], gl = [], g = new THREE.Group(), hl = len / 2, DK = '#44424a';
    q.push(P(prism([[-1.26, .62], [-1.32, .86], [-1.33, 1.6], [1.33, 1.6], [1.32, .86], [1.26, .62]], len, .16), c, 0, 0, 0, { grad: .08, jit: .025 }), P(prism([[-1.33, 1.56], [-1.3, 2.86], [1.3, 2.86], [1.33, 1.56]], len - .02, .16), uc, 0, 0, 0, { grad: .05, jit: .02 }), P(prism([[-1.32, 2.84], [-1.2, 3.06], [-.72, 3.24], [.72, 3.24], [1.2, 3.06], [1.32, 2.84]], len + .06, .2), rc, 0, 0, 0, { grad: .1, jit: .03 }), P(cbox(2.72, .1, len - .28, .03), o.stripe || shade(c, -.15), 0, 1.6, 0));
    const nw = Math.max(3, Math.round((len - 2.6) / 1.15)), span = len - 2.9;
    for (const s of [-1, 1]) { for (let i = 0; i < nw; i++) { const z = (i + .5) / nw * span - span / 2; q.push(P(bx(.06, .98, span / nw - .12), '#fbf6ea', s * 1.315, 2.18, z, { jit: 0 })); gl.push(P(bx(.06, .84, span / nw - .26), '#fff', s * 1.33, 2.18, z)); }
      for (const z of [-1, 1]) { q.push(P(cbox(.07, 1.95, .86, .02), shade(uc, -.08), s * 1.325, 1.78, z * (span / 2 + .58)), P(bx(.03, .03, .84), DK, s * 1.34, .78, z * (span / 2 + .58))); gl.push(P(bx(.06, .7, .5), '#fff', s * 1.345, 2.2, z * (span / 2 + .58))); }
      q.push(P(bx(1.9, 1.06, .06), '#fbf6ea', 0, 2.2, s * (hl - .02), { jit: 0 }), P(bx(.08, 1.0, .08), uc, 0, 2.2, s * hl)); gl.push(P(bx(1.76, .9, .06), '#fff', 0, 2.2, s * (hl + .0)), P(bx(.8, .16, .05), '#fff', 0, 2.92 - .16, s * (hl + .03)));
      for (const x of [-.86, .86]) { if (s > 0) gl.push(P(cyl(.12, .12, .08, 8), '#fff', x, 1.1, hl + .02, { rx: Math.PI / 2 })); else q.push(P(cyl(.11, .11, .08, 8), '#e8483a', x, 1.1, -hl - .02, { rx: Math.PI / 2, jit: 0 })); q.push(P(cyl(.16, .16, .05, 8), DK, x, 1.1, s * (hl + .0), { rx: Math.PI / 2 })); }
      q.push(P(cbox(2.3, .22, .3, .06), DK, 0, .66, s * (hl + .02)), P(cbox(.3, .2, .4, .05), DK, 0, .6, s * (hl + .22))); }
    q.push(P(cbox(1.5, .22, 2.0, .07), shade(rc, -.1), 0, 3.3, -len * .16), P(cbox(1.2, .16, 1.0, .05), shade(rc, -.16), 0, 3.28, len * .28), P(cbox(2.0, .34, len * .3, .06), DK, 0, .52, 0));
    if (o.panto !== false) { const pz = len * .08; for (const s of [-1, 1]) q.push(P(tube([[s * .3, 3.26, pz - .5], [s * .3, 3.62, pz], [s * .3, 3.98, pz - .42]], .022, 4), DK)); q.push(P(tube([[-.62, 4.0, pz - .42], [.62, 4.0, pz - .42]], .028, 4), DK), P(bx(.9, .05, .5), DK, 0, 3.28, pz - .5)); }
    const glass = join(gl, glowMat('#55707e', '#ffe2a0')); glass.castShadow = false; glass.userData.glow = true; glass.material.emissiveIntensity = o.lit || 0; g.add(join(q), glass); g.userData.wheels = [];
    for (const zb of [-1, 1]) { q.length = 0; const bz = zb * len * .3; g.add(Object.assign(join([P(cbox(2.0, .34, 2.1, .08), DK, 0, .44, bz)]))); for (const zz of [-.62, .62]) for (const x of [-1, 1]) { const w = wheel(.36, .14, '#5a5a62', '#8a8a92'); w.position.set(x * .78, .36, bz + zz); g.add(w); g.userData.wheels.push(w); } }
    return g; }

  // ───────── 地面 ─────────
  // faceH：K.terrain がじっさいに作る「三角の面」の高さ。物を置くときはこれを使うと、地面から浮かない・うまらない
  function faceH(H, cell, zoff = 0) { return (x, z) => { const gx = x / cell, gz = (z - zoff) / cell, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz, x0 = ix * cell, z0 = iz * cell + zoff, x1 = x0 + cell, z1 = z0 + cell; if (fx + fz <= 1) { const a = H(x0, z0); return a + (H(x1, z0) - a) * fx + (H(x0, z1) - a) * fz; } const c = H(x1, z1); return c + (H(x0, z1) - c) * (1 - fx) + (H(x1, z0) - c) * (1 - fz); }; }
  /* 地面の色の式を作る（K.terrain の colorFn）。o の中身:
     H: 高さの式（slope や shore を使うなら必要）  grass: 草の色の並び（大きなむらになる）  patch: むらの細かさ(.05)  jit: 面ごとの明るさのゆれ(.03)
     paths: [{ d: (x, z) => 道のまん中からの距離, w: 半分のはば, color, edge: ふちの色（草がすれた色）}, …]（土の色をぬる。きれいなふちは ribbon で重ねる）
     slope: { color, from: .45, to: .8 }（急な所を岩や土の色に）  shore: { level: 水面の高さ, sand: 砂の色, wet: ぬれた色, band: はば, mask: (x, z) => 0〜1（池のまわりだけにするとき。なければ level より低い所は全部 砂になる）}  under: 水の下の色
     high: { y, band, color }（高い所の色。雪や岩） */
  function groundColor(o = {}) { const gs = (o.grass || ['#8fca74', '#7fc06c', '#9ed27c']).map(col), f = o.patch ?? .05, jit = o.jit ?? .03, out = new THREE.Color(), tmp = new THREE.Color(), H = o.H, paths = (o.paths || (o.path ? [o.path] : [])).map(p => ({ ...p, c: col(p.color || '#e2cfa0'), e: col(p.edge || '#b9c27c') })), sl = o.slope && { ...o.slope, c: col(o.slope.color) }, sh = o.shore && { ...o.shore, s: col(o.shore.sand || '#ead9a8'), w: col(o.shore.wet || '#c9b98a') }, un = o.under && col(o.under), hi = o.high && { ...o.high, c: col(o.high.color) };
    return (y, x, z) => { const n = noise(x * f + 31.7, z * f + 11.3) * .65 + noise(x * f * 2.7, z * f * 2.7) * .35, k = clamp(n * 1.5 - .25) * (gs.length - 1), i = Math.min(gs.length - 2, Math.floor(k)), t = smooth(.3, .7, k - i); out.copy(gs[Math.max(0, i)]).lerp(gs[Math.min(gs.length - 1, i + 1)], gs.length > 1 ? t : 0);
      if (sl && H) { const e = .6, s = Math.hypot(H(x + e, z) - H(x - e, z), H(x, z + e) - H(x, z - e)) / (2 * e); out.lerp(sl.c, smooth(sl.from ?? .45, sl.to ?? .8, s)); }
      if (hi) out.lerp(hi.c, smooth(hi.y - (hi.band || 2), hi.y + (hi.band || 2), y + (n - .5) * 3));
      for (const p of paths) { const d = p.d(x, z) + (hash(Math.round(x * 2.3), Math.round(z * 2.3)) - .5) * (p.rough ?? .5); if (d < p.w * 2.2) { out.lerp(p.e, smooth(p.w * 2.2, p.w * 1.2, d) * .8); out.lerp(p.c, smooth(p.w * 1.25, p.w * .8, d)); } }
      if (sh) { const b = sh.band || 1.2, m = sh.mask ? sh.mask(x, z) : 1; if (m > 0) { out.lerp(sh.s, m * smooth(sh.level + b, sh.level + b * .35, y)); out.lerp(sh.w, m * smooth(sh.level + b * .3, sh.level, y)); if (un && y < sh.level) out.lerp(un, m * smooth(sh.level, sh.level - b, y)); } }
      const j = 1 + (hash(Math.round(x * 7.1), Math.round(z * 7.3)) - .5) * 2 * jit; out.r *= j; out.g *= j; out.b *= j; return out; }; }
  /* 地面：K.terrain をこの方向の色でぬって返す。ground(H, o)。o = { nx, nz: ますの数(96。偶数), cell: ますの大きさ(2), color: 色の式（なければ groundColor(o) を使う。上の中身をそのまま書ける）}
     返すもの { mesh, follow(x, z), h(x, z) }。h は面にぴったりの高さ（faceH）。scene.add(g.mesh) して、毎コマ g.follow(主役の x, z) */
  function ground(H, o = {}) { const cell = o.cell || 2, t = K.terrain(H, o.nx || 96, o.nz || 96, cell, o.color || groundColor({ H, ...o })); t.mesh.receiveShadow = true; return { mesh: t.mesh, follow: (x, z) => t.follow(x, z), h: faceH(H, cell) }; }
  /* 道・川・砂浜のふちなど、線にそってのびる帯。ribbon(pts, o)。pts = [[x, z], …]（1〜2m おきに細かく）。
     o = { w: はば(2.4), H: 高さの式（ground の h を渡す）, lift: 地面から浮かせる量(.05), y: 決まった高さに置く（川の水面など）, color, edge: ふちの色, ew: ふちのはば(.3), jit, close: 輪にする } */
  const RMAT = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  function ribbon(pts, o = {}) { const w = o.w ?? 2.4, H = o.H || (() => 0), lift = o.lift ?? .05, ew = o.edge ? (o.ew ?? .3) : 0, n = pts.length, offs = ew ? [-w / 2 - ew, -w / 2, 0, w / 2, w / 2 + ew] : [-w / 2, 0, w / 2], rows = [], mid = [], edg = [];
    for (let i = 0; i < n; i++) { const a = pts[o.close ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[o.close ? (i + 1) % n : Math.min(n - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l; rows.push(offs.map(f => { const x = pts[i][0] + nx * f, z = pts[i][1] + nz * f; return [x, o.y != null ? o.y : H(x, z) + lift, z]; })); }
    const up = (out, a, b, c) => { const ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]); ny >= 0 ? tri(out, a, b, c) : tri(out, a, c, b); };
    for (let i = 0; i < (o.close ? n : n - 1); i++) { const r0 = rows[i], r1 = rows[(i + 1) % n]; for (let j = 0; j < offs.length - 1; j++) { const out = ew && (j === 0 || j === offs.length - 2) ? edg : mid; up(out, r0[j], r0[j + 1], r1[j + 1]); up(out, r0[j], r1[j + 1], r1[j]); } }
    const list = [paint(geoOf(mid), o.color || '#e6d3a4', { grad: 0, jit: o.jit ?? .03 })]; if (ew) list.push(paint(geoOf(edg), o.edge, { grad: 0, jit: o.jit ?? .03 }));
    const m = join(list, o.mat || RMAT); m.castShadow = false; return m; }
  // 水面：大きな 1 枚の板（ゆるい波の色むらつき）。water(o)。o = { level: 高さ, size(400), color, opacity(.82) }。主役について動かすなら mesh.position.x / z を変える
  function water(o = {}) { const s = o.size || 400, g = new THREE.PlaneGeometry(s, s, 24, 24); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(paint(g, o.color || '#6fb7d6', { grad: 0, jit: .035 }), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .3, transparent: (o.opacity ?? .82) < 1, opacity: o.opacity ?? .82 })); m.position.y = o.level ?? 0; m.receiveShadow = true; return m; }
  return { MAT, MAT2, MATSKY, glowMat, hash, noise, lerp, clamp, smooth, shade, mix, cbox, taper, lathe, tube, blob, prism, cyl, cone, gem, box: bx, paint, P, join, move, scatter, tris, MOODS, look, lit, person, pose, LEAF, tree, conifer, bush, house, rock, tufts, flowers, fence, lamp, bench, sign, well, bridge, cloud, puffs, animal, gait, bird, flap, car, bicycle, ride, boat, train, faceH, groundColor, ground, ribbon, water };
};
