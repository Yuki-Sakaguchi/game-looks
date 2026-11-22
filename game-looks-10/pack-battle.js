// 第 10 集「ゲームの画面の試作（バトル）」の共通の部品（pack）。../game-looks-7/kit.js・retro.js（・retro-motions.js）のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), B = PACK_BATTLE(THREE, K, R);   として使う。見本は 01-turn-battle-command.html。
// 中身は 4 つ：(1) 画面の表示（HUD）  (2) 敵 5 種と動き  (3) 効果（切る・当たる・魔法・弾・ほこり・回復）  (4) 味方に持たせる武器。
//
// ■ 1. 画面の表示（HUD）── ブラウン管ごしに映る、ドット絵の文字と窓
//   しくみ：HUD を 1 枚の canvas に描き、CanvasTexture をカメラの前の板（カメラの子）にはる。板は同じ scene の中にあるので、crt.render(scene, cam, t) が
//           そのまま色の段おとし・にじみ・走査線をかける。canvas の大きさは「粗い絵」（crt.low.w × crt.low.h。横長で 334×209、たて長で 195×422 ほど）と同じで、
//           canvas の 1 ドット＝粗い絵の 1 ドット。座標はすべてこのドット（左上が 0,0）。DOM の文字は重ねない。
//   const H = B.hud(scene, cam, crt, { font（フォントの並び）, pad: 6（画面のふちの余白。丸いかどで切れない幅）, threshold: 96（文字の太さ。小さいほど太い） });   crt を作ったあとに呼ぶ。cam は scene に入れられる
//   毎コマ：  H.begin();  …H.win / H.text などで描く…  H.end(dt);  そのあと crt.render(scene, cam, t)。    H.W, H.H（canvas の大きさ）  H.tall（たて長か）
//   置き場所：H.place('左下', w, h, dx, dy) → { x, y, w, h }   '左上' '上' '右上' '左' '中' '右' '左下' '下' '右下'。余白を取り、画面からはみ出さないよう直す。dx, dy でずらす
//   文字：    H.text('こうげき', x, y, { c: '#fff', size: 10（8〜12）, shadow: '#000'（false でなし）, outline: 色（ふちどり）, align: 'l'/'c'/'r', scale: 1（整数倍） }) → はば
//             H.textW(文字, { size, scale }) → はば    canvas の文字を小さく描いて、しきい値で 2 値にしたドット（ひらがな・カタカナ・数字・記号。漢字はつぶれやすい）
//   数字：    H.num('128/250', x, y, { c, small（3×5 の小さい数字）, scale, shadow, outline, align }) → はば   手で打った 5×7 の数字（0-9 / + - . % : ! x と HPMLVSTAEX）
//   窓：      H.win(x, y, w, h, { c: '#22306e'（上の色）, c2（下の色）, edge: '#f0f0f8'（ふちの明るい線）, a: .93（地のこさ）, title（左上の見出し） })   ふちの線＋影＋たての色の帯
//   ゲージ：  H.bar(x, y, w, h, v（0〜1）, { c, back, v2（おくれて減る分）, c2, ticks（目もりの数） })   H.vbar(…同じ。下からたまる)   H.ring(cx, cy, r, v, { c, back, th: 3（太さ）, from（はじまりの角度。0 が上） })
//   名前と数字の行：H.status(x, y, w, { name, hp, hpMax, hpShow（おくれて減る HP）, mp, mpMax, wait（0〜1。待ち時間）, sel（えらばれている）, down（たおれた） })   高さは 14
//   コマンド：H.menu(x, y, items（文字の配列）, sel（番号）, { t（カーソルのゆれ）, size, lineH: 12, dim: [うすくする番号…], cursor: true }) → 高さ    H.menuSize(items, { size, lineH }) → { w, h }
//   技の名前の帯：H.banner('イカヅチ', k（0〜1。出る→止まる→消える）, { y（省くと上から 1/4）, c, c2, scale: 2, sub（小さな 2 行め） })
//   ロックオン：  H.lock(sx, sy, r, t, { c: '#ffd040', tight（0〜1。しぼり） })    H.tag(sx, sy, 'なまえ', v, { c })（頭の上の名前と体力バー）
//   小さな絵：H.icon('hand', x, y, { c, scale, outline })   hand tri heart bolt sword potion bullet star bulb shield drop   H.face(x, y, { skin, hair, eye, hurt, scale })（14×14 の顔）
//   そのほか：H.rect(x, y, w, h, 色, こさ)    H.msg('ネジバチの こうげき', '上', { dy, w })（1 行の知らせの窓）    H.ctx（canvas の 2D コンテキスト。自分で描くとき）
//   3D の位置：H.project(Vector3) → { x, y, on }（HUD のドット。on は画面の中か）
//   飛び出す数字：H.pop(Vector3, '128', { c: '#fff', scale: 1, life: .9, text: true（数字ではなく文字。'ミス' など） })   3D の位置に出て、はねて、点めつして消える。H.end(dt) が描く
//
// ■ 2. 敵（小〜中）── R.geo() の少ない面＋手で打った 64 ドットのテクスチャ 1 枚。足もとが y=0、正面が +z
//   B.enemy.jelly({ s, c, c2, eye })    ぷるぷるした しずく形の生きもの（つの 2 本、大きな目）。高さ .6 m
//   B.enemy.beast({ s, c, c2, eye })    四つ足のけもの（しま、きば、たてがみ、しっぽ）。体の長さ 1.3 m
//   B.enemy.golem({ s, c, c2, eye, kind: 'iron'/'rock' })   がらくた（か岩）のゴーレム。大きな前うで、胸のあかり。高さ 1.9 m
//   B.enemy.drone({ s, c, c2, eye })    空を飛ぶ小さな機械（ひとつ目、左右の回るはね、下の筒）。うく高さは userData.fly
//   B.enemy.shade({ s, c, c2, eye })    よろよろ歩く人がたの影（長いうで、光る目と口、ぎざぎざのすそ）。高さ 1.7 m
//     どれも userData = { kind, J（関節・部位）, h（高さ）, r（半径）, center（当たりの中心の高さ）, len: { attack, hurt, down }（動きの秒数）, hitAt（attack のうち当たる時点 0〜1）, reach（うつときに前へ出る長さ） }
//   B.pose(敵, 'idle'/'walk'/'attack'/'hurt'/'down', t)   idle・walk は t を秒でわたし続ける。attack・hurt・down は「はじめてからの秒」をわたす（終わりで止まる）。敵.position / rotation はさわらない
//   B.drive(敵) → { set('attack'), update(dt), name, t }   動きの切りかえ役。毎コマ update(dt)。attack・hurt は終わると idle にもどり、down はそのまま（生き返らせるときは d.name = 'idle' と直に入れる）
//   空を飛ぶ drone だけは体が userData.fly の高さにうく（引数 fly で変えられる。当たりの中心は position.y + fly + center）。色ちがいは c・c2・eye、岩のゴーレムは kind: 'rock'
//
// ■ 3. 効果 ── const F = B.fx(scene, cam);  毎コマ F.update(dt)。出した物は勝手に消える。pos は Vector3 か [x, y, z]
//   F.slash(pos, { ry（切る人の向き）, tilt（0 でよこ切り、1.2 ほどで たて切り）, c, s: 1, flip })   剣のふりの弧
//   F.spark(pos, { c, n: 8, s: 1 })   当たりの火花      F.dust(pos, { c, n: 5, s: 1 })   ほこり      F.ring(pos, { c, s: 1, life: .45 })   地面に広がる輪
//   F.fire(pos, { s: 1, c })   F.ice(pos, { s: 1, c })   F.bolt(pos, { s: 1, c, h: 9（落ちてくる高さ） })   魔法 3 種（ほのお／氷のとげ／いなずま）
//   F.shot(from, to, { c, speed: 28, s: 1, onHit() })   弾と光の尾（着いたら火花。onHit を呼ぶ）→ 着くまでの秒
//   F.heal(pos, { c, h: 1.4 })   回復のきらめき      F.charge(pos, { c, life: 1, r: 1 })   魔法をためる光（まわりから集まる）
//   F.clear()   出ている効果をすぐ全部消す（ひと回りの頭にもどるとき）      B.spriteTex.名前()   効果に使うドット絵（glint dot puff ball shard plus streak ring arc bolt flame(0〜2) ice(色)）
//   あかり（PointLight）は足さない（数が変わると描画が止まるため）。光らせたいときは、ページに置いた PointLight の強さを自分で動かす（01 の flash）
//
// ■ 4. 武器 ── B.weapon('gun'/'rifle'/'greatsword'/'bow'/'shield'/'axe'/'wand', { c, c2, s }) → Mesh（にぎる所が原点。刃・銃口は +y へのびる）
//   B.arm(人, 武器, { hand: 'R'/'L', rx, ry, rz, y }) → 武器   R.actor の手に付ける（前うでの関節の子にする）。向きの既定は武器ごとに入っている（弓・たては左手）。ふつうの剣・つえ・やりは R.actor の hold で足りる
//   武器.userData.tip ＝ にぎりから先（銃口・刃先）までの長さ m
//
// ■ 色：B.PAL = { hp, mp, wait, warn, win, gold }
window.PACK_BATTLE = (THREE, K, R) => {
  const { hash, mix, ramp, tone, tn, Px, TR } = R, T = R.tex, PI = Math.PI, B = {};
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = k => k * k * (3 - 2 * k), seg = (t, a, b) => cl((t - a) / (b - a));
  const V3 = p => p && p.isVector3 ? p.clone() : new THREE.Vector3(...(p || [0, 0, 0]));
  const PAL = { hp: '#5ce070', mp: '#58b8ff', wait: '#ffd040', warn: '#ff5a4a', win: '#22306e', gold: '#ffe890' };
  B.PAL = PAL;

  // ================= 1. 画面の表示（HUD） =================
  // 手で打った数字（5×7）と小さい数字（3×5）
  const N5 = { '0': '.###.#...##..###.#.###..##...#.###.', '1': '..#...##....#....#....#....#...###.', '2': '.###.#...#....#...#...#...#...#####', '3': '.###.#...#....#..##.....##...#.###.', '4': '...#...##..#.#.#..#.#####...#....#.',
    '5': '######....####.....#....##...#.###.', '6': '..##..#...#....####.#...##...#.###.', '7': '#####....#...#...#...#....#....#...', '8': '.###.#...##...#.###.#...##...#.###.', '9': '.###.#...##...#.####....#...#..##..',
    '/': '....#....#...#...#...#...#....#....', '+': '.......#....#..#####..#....#.......', '-': '...............#####...............', '.': '.........................##...##...', '%': '##..###..#...#...#...#...#..###..##',
    ':': '......##...##.........##...##......', '!': '..#....#....#....#....#.........#..', 'x': '.....#...#.#.#...#...#.#.#...#.....', ' ': '...................................',
    H: '#...##...##...#######...##...##...#', P: '####.#...##...#####.#....#....#....', M: '#...###.###.#.##.#.##...##...##...#', L: '#....#....#....#....#....#....#####', V: '#...##...##...##...#.#.#..#.#...#..',
    S: '.#####....#.....###.....#....#####.', T: '#####..#....#....#....#....#....#..', A: '.###.#...##...#######...##...##...#', E: '######....#....####.#....#....#####', X: '#...##...#.#.#...#...#.#.#...##...#' };
  const N3 = { '0': '####.##.##.####', '1': '.#.##..#..#.###', '2': '###..#####..###', '3': '###..####..####', '4': '#.##.####..#..#', '5': '####..###..####', '6': '####..####.####', '7': '###..#..#.#..#.', '8': '####.#####.####', '9': '####.####..####',
    '/': '..#..#.#.#..#..', '-': '......###......', '+': '....#.###.#....', ':': '....#.....#....', '.': '.............#.', ' ': '...............', '%': '#.#..#.#.#..#.#', H: '#.##.#####.##.#', P: '####.#####..#..', M: '#.########.##.#', L: '#..#..#..#..###', V: '#.##.##.##.#.#.', x: '...#.#.#.#.#...' };
  // 小さな絵（# が色、+ が明るい所）
  const ICON = { hand: ['.####...', '#++++###', '#+++++++#', '#++++###', '#+++#...', '.###....'], tri: ['#....', '##...', '###..', '####.', '###..', '##...', '#....'],
    heart: ['.##.##.', '#+#####', '#######', '.#####.', '..###..', '...#...'], bolt: ['...##', '..##.', '.##..', '#####', '..##.', '.##..', '##...'], sword: ['......#', '.....##', '....##.', '#..##..', '.###...', '.##....', '#..#...'],
    potion: ['..##..', '..##..', '.#++#.', '#+####', '######', '######', '.####.'], bullet: ['.##.', '#++#', '#+##', '####', '####', '#..#'], star: ['...#...', '...#...', '.#####.', '#######', '.#####.', '.##.##.', '#.....#'],
    bulb: ['..###..', '.#+++#.', '#++++##', '#+++###', '.#####.', '..###..', '..#.#..', '..###..'], shield: ['#######', '#+++###', '#+#####', '#######', '.#####.', '..###..', '...#...'], drop: ['...#...', '..###..', '.#+###.', '#+#####', '#######', '.#####.'] };

  B.hud = (scene, cam, crt, o = {}) => {
    const cv = document.createElement('canvas'), x = cv.getContext('2d'), H = { W: 320, H: 200, tall: false, pad: o.pad ?? 6, ctx: x, canvas: cv };
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
    mesh.renderOrder = 9999; mesh.frustumCulled = false; mesh.userData.dyn = true; if (!cam.parent) scene.add(cam); cam.add(mesh); H.mesh = mesh;
    const FONT = o.font || '"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic","Meiryo","Noto Sans JP","Noto Sans CJK JP","IPAGothic","MS Gothic",sans-serif';
    const gc = document.createElement('canvas'); gc.width = gc.height = 40; const gx = gc.getContext('2d', { willReadFrequently: true }), glyphs = new Map(), strips = new Map();
    // 1 文字を小さく描き、しきい値で 2 値のドットにする
    const glyph = (ch, size) => { const key = ch + size; let g = glyphs.get(key); if (g) return g; gx.clearRect(0, 0, 40, 40); gx.font = `${size}px ${FONT}`; gx.textBaseline = 'alphabetic'; gx.fillStyle = '#fff'; gx.fillText(ch, 1, Math.round(size * .88));
      const adv = ch === ' ' ? Math.round(size * .5) : Math.max(2, Math.round(gx.measureText(ch).width)), d = gx.getImageData(0, 0, size + 4, size + 4).data, px = [], n = size + 4, th = o.threshold ?? 96;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (d[(j * n + i) * 4 + 3] > th) px.push([i - 1, j]);
      g = { adv, px }; glyphs.set(key, g); return g; };
    const lineT = (str, size) => () => { const px = []; let w = 0; for (const ch of str) { const g = glyph(ch, size); for (const [i, j] of g.px) px.push([w + i, j]); w += g.adv; } return { w, h: size + 2, px }; };
    const lineN = (str, small) => () => { const F = small ? N3 : N5, cw = small ? 3 : 5, ch = small ? 5 : 7, px = []; let w = 0; for (const c of String(str)) { const b = F[c] || F[' ']; for (let k = 0; k < b.length; k++) if (b[k] === '#') px.push([w + k % cw, Math.floor(k / cw)]); w += cw + 1; } return { w: w - 1, h: ch, px }; };
    // ドットの並びを、色・影・ふちどりつきの小さな canvas にして取っておく
    const strip = (key, build, col, sh, ol) => { const k = key + '|' + col + '|' + sh + '|' + ol; let c = strips.get(k); if (c) return c; if (strips.size > 700) strips.clear();
      const q = build(); c = document.createElement('canvas'); c.width = Math.max(1, q.w + 3); c.height = q.h + 3; const g = c.getContext('2d');
      if (ol) { g.fillStyle = ol; for (const [i, j] of q.px) g.fillRect(i, j, 3, 3); } else if (sh) { g.fillStyle = sh; for (const [i, j] of q.px) g.fillRect(i + 2, j + 2, 1, 1); }
      g.fillStyle = col; for (const [i, j] of q.px) g.fillRect(i + 1, j + 1, 1, 1); c.tw = q.w; strips.set(k, c); return c; };
    const blit = (c, px, py, o2) => { const sc = o2.scale || 1, w = c.tw * sc, ax = o2.align === 'c' ? Math.round(px - w / 2) : o2.align === 'r' ? px - w : px; x.drawImage(c, ax - sc, py - sc, c.width * sc, c.height * sc); return w; };
    const shOf = o2 => o2.outline ? false : (o2.shadow === undefined ? '#000000' : o2.shadow);
    H.text = (str, px, py, o2 = {}) => { str = String(str); const size = o2.size || 10; return blit(strip('t' + size + str, lineT(str, size), o2.c || '#ffffff', shOf(o2), o2.outline || false), Math.round(px), Math.round(py), o2); };
    H.textW = (str, o2 = {}) => { let w = 0; for (const ch of String(str)) w += glyph(ch, o2.size || 10).adv; return w * (o2.scale || 1); };
    H.num = (str, px, py, o2 = {}) => blit(strip('n' + (o2.small ? 3 : 5) + str, lineN(str, o2.small), o2.c || '#ffffff', shOf(o2), o2.outline || false), Math.round(px), Math.round(py), o2);
    H.numW = (str, o2 = {}) => (String(str).length * ((o2.small ? 3 : 5) + 1) - 1) * (o2.scale || 1);
    H.rect = (px, py, w, h, c, a = 1) => { x.globalAlpha = a; x.fillStyle = c; x.fillRect(Math.round(px), Math.round(py), Math.round(w), Math.round(h)); x.globalAlpha = 1; };
    H.icon = (name, px, py, o2 = {}) => { const rows = ICON[name] || ICON.tri, c = strip('i' + name, () => { const p = []; rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') p.push([i, j]); })); return { w: Math.max(...rows.map(r => r.length)), h: rows.length, px: p }; }, o2.c || '#ffffff', false, o2.outline === undefined ? '#101020' : o2.outline);
      const c2 = strip('j' + name, () => { const p = []; rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '+') p.push([i, j]); })); return { w: Math.max(...rows.map(r => r.length)), h: rows.length, px: p }; }, o2.hi || '#ffffff', false, false);
      blit(c, Math.round(px), Math.round(py), o2); blit(c2, Math.round(px), Math.round(py), o2); return c.tw * (o2.scale || 1); };
    // 置き場所。'左下' などの名前から、余白を取った四角を返す
    const ANC = { '左上': [0, 0], '上': [.5, 0], '右上': [1, 0], '左': [0, .5], '中': [.5, .5], '右': [1, .5], '左下': [0, 1], '下': [.5, 1], '右下': [1, 1], lt: [0, 0], t: [.5, 0], rt: [1, 0], l: [0, .5], c: [.5, .5], r: [1, .5], lb: [0, 1], b: [.5, 1], rb: [1, 1] };
    H.place = (anchor, w, h, dx = 0, dy = 0) => { const [ax, ay] = ANC[anchor] || ANC['中'], p = H.pad; w = Math.min(Math.round(w), H.W - p * 2); h = Math.min(Math.round(h), H.H - p * 2);
      return { x: Math.round(cl(p + (H.W - p * 2 - w) * ax + dx, p, H.W - p - w)), y: Math.round(cl(p + (H.H - p * 2 - h) * ay + dy, p, H.H - p - h)), w, h }; };
    // 窓：外の黒い線 → 明るいふち → 内がわの影、地は たての色の帯（さかい目は市松）
    const wins = new Map();
    H.win = (px, py, w, h, o2 = {}) => { px = Math.round(px); py = Math.round(py); w = Math.round(w); h = Math.round(h); const c1 = o2.c || PAL.win, c2 = o2.c2 || mix(c1, '#000010', .55), ed = o2.edge || '#f0f0f8', key = [w, h, c1, c2, ed].join();
      let c = wins.get(key); if (!c) { if (wins.size > 60) wins.clear(); c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), nb = 5;
        for (let j = 2; j < h - 2; j++) { const f = (j - 2) / Math.max(1, h - 5) * (nb - 1), b = Math.floor(f), fr = f - b, ca = mix(c1, c2, b / (nb - 1)), cb = mix(c1, c2, Math.min(nb - 1, b + 1) / (nb - 1));
          g.fillStyle = ca; g.fillRect(2, j, w - 4, 1); if (fr > .66) { g.fillStyle = cb; for (let i = 2 + (j & 1); i < w - 2; i += 2) g.fillRect(i, j, 1, 1); } }
        const ln = (col, a, b2, cc, d) => { g.fillStyle = col; g.fillRect(a, b2, cc, d); };
        ln('#080814', 1, 0, w - 2, 1); ln('#080814', 1, h - 1, w - 2, 1); ln('#080814', 0, 1, 1, h - 2); ln('#080814', w - 1, 1, 1, h - 2);
        ln(ed, 2, 1, w - 4, 1); ln(ed, 1, 2, 1, h - 4); ln(mix(ed, '#404060', .45), 2, h - 2, w - 4, 1); ln(mix(ed, '#404060', .45), w - 2, 2, 1, h - 4); ln(ed, 2, 2, 1, 1); ln(mix(ed, '#404060', .45), w - 3, h - 3, 1, 1); ln(ed, w - 3, 2, 1, 1); ln(ed, 2, h - 3, 1, 1);
        ln(mix(c1, '#ffffff', .25), 3, 2, w - 6, 1); ln(mix(c2, '#000000', .4), 3, h - 3, w - 6, 1); wins.set(key, c); }
      H.rect(px + 2, py + 2, w, h, '#000008', .35); x.globalAlpha = o2.a ?? .93; x.drawImage(c, px, py); x.globalAlpha = 1;
      if (o2.title) { const tw = H.textW(o2.title, { size: 8 }); H.rect(px + 5, py - 3, tw + 5, 9, c1); H.rect(px + 5, py - 3, tw + 5, 1, ed); H.text(o2.title, px + 8, py - 3, { size: 8, c: PAL.gold }); } };
    // ゲージ
    H.bar = (px, py, w, h, v, o2 = {}) => { px = Math.round(px); py = Math.round(py); const c = o2.c || PAL.hp, iw = w - 2, f = Math.round(iw * cl(v)), f2 = o2.v2 !== undefined ? Math.round(iw * cl(o2.v2)) : 0;
      H.rect(px, py, w, h, '#080814'); H.rect(px + 1, py + 1, iw, h - 2, o2.back || '#2a2c40'); if (f2 > f) H.rect(px + 1 + f, py + 1, f2 - f, h - 2, o2.c2 || '#e04848');
      if (f > 0) { H.rect(px + 1, py + 1, f, h - 2, c); if (h > 3) { H.rect(px + 1, py + 1, f, 1, mix(c, '#ffffff', .55)); H.rect(px + 1, py + h - 2, f, 1, mix(c, '#000020', .35)); } }
      if (o2.ticks) for (let i = 1; i < o2.ticks; i++) H.rect(px + 1 + Math.round(iw * i / o2.ticks), py + 1, 1, h - 2, '#080814', .7); };
    H.vbar = (px, py, w, h, v, o2 = {}) => { px = Math.round(px); py = Math.round(py); const c = o2.c || PAL.hp, ih = h - 2, f = Math.round(ih * cl(v)), f2 = o2.v2 !== undefined ? Math.round(ih * cl(o2.v2)) : 0;
      H.rect(px, py, w, h, '#080814'); H.rect(px + 1, py + 1, w - 2, ih, o2.back || '#2a2c40'); if (f2 > f) H.rect(px + 1, py + 1 + ih - f2, w - 2, f2 - f, o2.c2 || '#e04848');
      if (f > 0) { H.rect(px + 1, py + 1 + ih - f, w - 2, f, c); if (w > 3) { H.rect(px + 1, py + 1 + ih - f, 1, f, mix(c, '#ffffff', .55)); H.rect(px + w - 2, py + 1 + ih - f, 1, f, mix(c, '#000020', .35)); } }
      if (o2.ticks) for (let i = 1; i < o2.ticks; i++) H.rect(px + 1, py + 1 + Math.round(ih * i / o2.ticks), w - 2, 1, '#080814', .7); };
    H.ring = (cx, cy, r, v, o2 = {}) => { cx = Math.round(cx); cy = Math.round(cy); const th = o2.th || 3, c = o2.c || PAL.hp, bk = o2.back || '#2a2c40', hi = mix(c, '#ffffff', .5), fr = o2.from || 0; v = cl(v);
      for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) { const d = Math.hypot(i + .5, j + .5); if (d > r + 1 || d < r - th - 1) continue; const edge = d > r || d < r - th; let a = (Math.atan2(i + .5, -(j + .5)) / (PI * 2) - fr + 2) % 1;
        x.fillStyle = edge ? '#080814' : a <= v && v > 0 ? (d > r - 1.2 ? hi : c) : bk; x.fillRect(cx + i, cy + j, 1, 1); } };
    // 名前と数字の行（なまえ／HP の数字と細いバー／MP／待ち時間のゲージ）
    H.status = (px, py, w, s) => { px = Math.round(px); py = Math.round(py); const nameW = Math.min(46, Math.round(w * .27)), wtW = Math.max(24, Math.round(w * .2)), rest = w - nameW - wtW - 8, hpW = Math.round(rest * .58), mpW = rest - hpW, low = s.hp / s.hpMax < .3, dn = s.down || s.hp <= 0;
      const hx = px + nameW + 2, mx = hx + hpW + 3, wx = mx + mpW + 3;
      if (s.sel) H.rect(px - 2, py - 1, w + 4, 13, '#ffffff', .14);
      H.text(s.name, px, py, { c: dn ? '#8088a0' : s.sel ? PAL.gold : '#ffffff', size: o.nameSize || 10 });
      H.num(String(Math.max(0, Math.round(s.hp))), hx + hpW, py + 1, { align: 'r', c: dn ? '#ff7060' : low ? '#ffe060' : '#ffffff' }); H.num('HP', hx, py + 3, { small: true, c: '#9ad0ff' });
      H.bar(hx, py + 9, hpW, 3, s.hp / s.hpMax, { c: low ? '#ffb040' : PAL.hp, v2: s.hpShow !== undefined ? s.hpShow / s.hpMax : undefined });
      if (s.mpMax) { H.num(String(Math.round(s.mp)), mx + mpW, py + 1, { align: 'r', c: '#d8ecff' }); H.num('MP', mx, py + 3, { small: true, c: '#9ad0ff' }); H.bar(mx, py + 9, mpW, 3, s.mp / s.mpMax, { c: PAL.mp }); }
      const full = s.wait >= 1; H.bar(wx, py + 3, wtW, 6, s.wait, { c: dn ? '#606070' : full ? '#fff6a0' : PAL.wait, back: '#3a2c40' }); };
    // コマンドの一覧（カーソルつき）
    H.menuSize = (items, o2 = {}) => ({ w: Math.max(...items.map(s => H.textW(s, { size: o2.size || 10 }))) + 22, h: items.length * (o2.lineH || 12) + 8 });
    H.menu = (px, py, items, sel, o2 = {}) => { const lh = o2.lineH || 12, t = o2.t || 0; items.forEach((s, i) => { const dim = o2.dim && o2.dim.includes(i); H.text(s, px + 13, py + i * lh, { size: o2.size || 10, c: dim ? '#8088a8' : i === sel ? PAL.gold : '#ffffff' }); });
      if (o2.cursor !== false && sel >= 0) H.icon('hand', px + 1 + Math.round(Math.sin(t * 9) * 1.2), py + sel * lh + 3, {}); return items.length * lh; };
    // 1 行の知らせの窓
    H.msg = (str, anchor = '上', o2 = {}) => { const w = o2.w || H.textW(str) + 18, r = H.place(anchor, w, 18, o2.dx || 0, o2.dy || 0); H.win(r.x, r.y, r.w, r.h, o2); H.text(str, r.x + r.w / 2, r.y + 4, { align: 'c', c: o2.tc || '#ffffff' }); return r; };
    // 技の名前の帯。k: 0〜1（出る → 止まる → 消える）
    H.banner = (str, k, o2 = {}) => { if (k <= 0 || k >= 1) return; const a = Math.min(1, k / .12, (1 - k) / .12), c = o2.c || '#3a2a8a', c2 = o2.c2 || PAL.gold; let sc = o2.scale || 2; while (sc > 1 && H.textW(str) * sc > H.W - 24) sc--;
      const bh = Math.round((10 * sc + 10 + (o2.sub ? 11 : 0)) * a), cy = Math.round(o2.y ?? H.H * .24), y0 = cy - (bh >> 1); if (bh < 3) return;
      for (let j = 0; j < bh; j++) { const e = Math.min(j, bh - 1 - j); H.rect(0, y0 + j, H.W, 1, e === 0 ? c2 : e === 1 ? '#080814' : mix(c, '#000010', Math.abs(j / bh - .5) * 1.1), e < 2 ? 1 : .86); }
      if (a < 1) return; const sl = Math.round((1 - ease(Math.min(1, k / .25))) * H.W * .5), tx = H.W / 2 + sl;
      H.text(str, tx, y0 + 5, { align: 'c', scale: sc, c: '#ffffff', outline: '#080814' }); if (o2.sub) H.text(o2.sub, H.W / 2 - sl, y0 + 7 + 10 * sc, { align: 'c', c: c2, size: 8 });
      const tw = H.textW(str) * sc / 2 + 8; for (const s of [-1, 1]) H.icon('star', Math.round(tx + s * tw - 3), y0 + (bh >> 1) - 4, { c: c2 }); };
    // ロックオンの印（4 すみのかぎ＋まわる三角）。r はドット
    H.lock = (sx, sy, r, t = 0, o2 = {}) => { sx = Math.round(sx); sy = Math.round(sy); const c = o2.c || '#ffd040', k = '#080814', rr = Math.round(r * (1 + (1 - (o2.tight ?? 1)) * 1.2) + Math.sin(t * 6) * 1), L = Math.max(3, Math.round(r * .45));
      for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = sx + ax * rr, py = sy + ay * rr; H.rect(Math.min(px, px - ax * L) - 1, py - 1, L + 3, 3, k); H.rect(px - 1, Math.min(py, py - ay * L) - 1, 3, L + 3, k); }
      for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = sx + ax * rr, py = sy + ay * rr; H.rect(Math.min(px, px - ax * L), py, L + 1, 1, c); H.rect(px, Math.min(py, py - ay * L), 1, L + 1, c); }
      for (let i = 0; i < 4; i++) { const a = t * 1.6 + i * PI / 2, px = Math.round(sx + Math.cos(a) * (rr + 4)), py = Math.round(sy + Math.sin(a) * (rr + 4)); H.rect(px - 1, py - 1, 3, 3, k); H.rect(px, py, 1, 1, '#ffffff'); }
      H.rect(sx - 1, sy - 1, 3, 3, k); H.rect(sx, sy, 1, 1, c); };
    // 頭の上の名前と体力バー
    H.tag = (sx, sy, name, v, o2 = {}) => { sx = Math.round(sx); sy = Math.round(sy); const w = o2.w || 28; if (name) H.text(name, sx, sy - 11, { align: 'c', size: 8, outline: '#080814' }); H.bar(sx - (w >> 1), sy, w, 4, v, { c: o2.c || PAL.warn, v2: o2.v2 }); };
    // 14×14 の顔（かみ・はだ・目）
    const FACE = ['..hhhhhhhhhh..', '.hhhhhhhhhhhh.', 'hhhhhhhhhhhhhh', 'hhhhshhhhshhhh', 'hhhsssshssshhh', 'hhsssssssssshh', 'hhskkssssKksHh', 'hhseksssskeshh', 'hhseksssskeshh', '.hsssssssssh.', '.hsspsssspsh.', '..ssssmmssss..', '...ssssssss...', '....ssssss....'];
    H.face = (px, py, o2 = {}) => { const sc = o2.scale || 1, map = { h: o2.hair || '#c05a3a', s: o2.skin || '#f4d0b0', k: '#201820', K: '#201820', e: o2.eye || '#3a6ac0', p: '#f0a0a0', m: '#b04a4a', H: mix(o2.hair || '#c05a3a', '#ffffff', .4) };
      H.rect(px - 1, py - 1, 14 * sc + 2, 14 * sc + 2, '#080814'); H.rect(px, py, 14 * sc, 14 * sc, o2.bg || '#3a4a8a');
      FACE.forEach((r, j) => [...r].forEach((ch, i) => { const c = map[ch]; if (c) H.rect(px + (i + (r.length < 14 ? 1 : 0)) * sc, py + j * sc, sc, sc, o2.hurt && ch === 's' ? mix(c, '#ff4040', .3) : c); })); };
    // 3D の位置 → HUD のドット
    const pv = new THREE.Vector3();
    H.project = p => { pv.copy(p).project(cam); return { x: (pv.x * .5 + .5) * H.W, y: (.5 - pv.y * .5) * H.H, on: pv.z < 1 && Math.abs(pv.x) < 1 && Math.abs(pv.y) < 1 }; };
    // 飛び出す数字
    const pops = [];
    H.pop = (p, str, o2 = {}) => { pops.push({ p: V3(p), str: String(str), age: 0, life: o2.life || .9, c: o2.c || '#ffffff', scale: o2.scale || 1, text: !!o2.text, dx: o2.dx || 0 }); };
    H.begin = () => { const lw = crt.low.w, lh = crt.low.h; if (cv.width !== lw || cv.height !== lh) { cv.width = lw; cv.height = lh; tex.dispose(); } H.W = lw; H.H = lh; H.tall = lw < lh; x.clearRect(0, 0, lw, lh); x.imageSmoothingEnabled = false; return H; };
    H.end = (dt = 1 / 60) => {
      for (let i = pops.length - 1; i >= 0; i--) { const q = pops[i]; q.age += dt; const k = q.age / q.life; if (k >= 1) { pops.splice(i, 1); continue; } const s = H.project(q.p); if (!s.on) continue;
        const hop = k < .3 ? Math.sin(k / .3 * PI) * 12 : k < .5 ? Math.sin((k - .3) / .2 * PI) * 4 : 0; if (k > .78 && Math.floor(q.age * 30) % 2) continue;
        const f = q.text ? H.text : H.num; f(q.str, s.x + q.dx, s.y - 6 - hop * q.scale, { align: 'c', c: q.c, scale: q.scale, outline: '#080814' }); }
      tex.needsUpdate = true; const d = .5, hh = 2 * d * Math.tan(cam.fov * PI / 360); mesh.position.set(0, 0, -d); mesh.scale.set(hh * cam.aspect, hh, 1); };
    return H; };

  // ================= 2. 敵 =================
  const E = {}, POSE = {}, tcache = new Map();
  const etex = (name, o, fn, cut = false) => { const k = name + JSON.stringify(o); let t = tcache.get(k); if (!t) tcache.set(k, t = T.from(fn(), { m: 1, cut })); return t; };
  const mk = (kind, s, J, ud) => { const g = new THREE.Group(); g.add(J.root); J.root.scale.setScalar(s); g.userData = { kind, J, s, len: { attack: .9, hurt: .5, down: 1.1 }, hitAt: .5, reach: 1, ...ud }; return g; };
  const grp = (parent, x = 0, y = 0, z = 0) => { const p = new THREE.Group(); p.position.set(x, y, z); if (parent) parent.add(p); return p; };
  B.enemy = E;
  B.pose = (e, name, t) => { const f = POSE[e.userData.kind]; if (f) f(e, name, Math.max(0, t), e.userData.J); const L = e.userData.len[name]; return L ? cl(t / L) : 0; };
  B.drive = e => { const d = { name: 'idle', t: 0, clock: hash(e.id, 3) * 9, set(n) { if (d.name === 'down' && n !== 'idle') return d; d.name = n; d.t = 0; return d; },
    update(dt) { d.t += dt; d.clock += dt; const L = e.userData.len[d.name]; B.pose(e, d.name, L ? d.t : d.clock); if (L && d.t >= L && d.name !== 'down') d.set('idle'); return d; } }; return d; };

  // ---- ぷるぷるした生きもの ----
  E.jelly = (o = {}) => { const s = o.s || 1, c = o.c || '#4fb8a8', c2 = o.c2 || '#ffd060', eye = o.eye || '#fff6c0';
    const t = etex('jelly', { c, c2, eye }, () => { const P = Px(64), M = ramp(c), M2 = ramp(c2); P.clip = true;
      P.each((x, y) => { if (y >= 40) return null; const n = tn(x, y, 16, 8, 64, 40, 3), b = y < 4 ? 5 : y < 9 ? 4 : y < 27 ? 3 : y < 34 ? 2 : 1, d = (x + y) & 1; let k = b; if ((y === 4 || y === 9 || y === 27 || y === 34) && d) k = b + 1; if (n > .72 && y > 9) k++; if (n < .25 && y > 6) k--; return tone(M, k); });
      // すそのしずく（こい線）
      for (let x = 0; x < 64; x++) { const w = [0, 1, 2, 3, 3, 2, 1, 0][x & 7]; for (let j = 0; j <= w; j++) P.set(x, 39 - j, M[0]); P.set(x, 38 - w, tone(M, 1)); }
      // まわりの あわ（輪と光の点）
      for (let k = 0; k < 9; k++) { const bx = Math.floor(hash(k, 1, 5) * 64), by = 10 + Math.floor(hash(k, 2, 5) * 20), r = 1 + (k % 3); if (Math.abs(bx - 32) < 15) continue; for (let a = 0; a < 12; a++) P.set(bx + Math.round(Math.cos(a / 12 * PI * 2) * r), by + Math.round(Math.sin(a / 12 * PI * 2) * r), tone(M, 4)); P.set(bx - 1, by - 1, '#ffffff'); P.set(bx + r, by + r, tone(M, 1)); }
      // つや
      P.rect(21, 5, 5, 2, '#ffffff'); P.rect(20, 7, 3, 2, '#ffffff'); P.set(27, 5, tone(M, 5)); P.rect(40, 6, 2, 1, tone(M, 5));
      // 目（白目・ひとみ・光の点）と まゆ
      for (const ex of [23, 36]) { P.bits(ex, 13, ['.kkkk.', 'kwwwwk', 'kwwppk', 'kwpppk', 'kwpphk', 'kwwppk', 'kwwwwk', '.kkkk.'], { k: M[0], w: eye, p: '#1a1830', h: '#ffffff' }); P.rect(ex, 22, 6, 1, tone(M, 2)); }
      P.line(22, 11, 27, 12, M[0]); P.line(42, 11, 37, 12, M[0]);
      // 口（ぎざぎざ）と きば、ほお
      P.bits(27, 25, ['k.........k', '.kkkkkkkkk.', '..kwkrrkwk.', '...kkkkkk..'], { k: M[0], w: '#ffffff', r: '#c0405a' }); P.rect(20, 23, 2, 1, '#ff9aa0'); P.rect(43, 23, 2, 1, '#ff9aa0');
      // つの（しま）と、光る先
      for (let y = 44; y < 60; y++) for (let x = 0; x < 16; x++) P.set(x, y, tone(M2, ((y - 44) >> 2) % 2 ? 2 : 3 + (x < 6 ? 1 : 0) - (x > 11 ? 1 : 0)));
      P.rect(20, 44, 8, 8, eye); P.rect(22, 46, 4, 4, '#ffffff'); return P; });
    const J = { root: new THREE.Group() }; J.move = grp(J.root); J.body = grp(J.move);
    const G = R.geo().smooth(1).px(0, 0, 64, 40, 64, 64).loft(8, [[0, .31, .3, 0, .7], [.05, .41, .39, .1, .85], [.2, .43, .41, .42, 1], [.36, .35, .34, .72, 1.05], [.47, .21, .21, .9, 1.1], [.57, .05, .05, 1, 1.15, 0, -.03]], { cap: 'top' });
    const Gg = R.geo();
    for (const sx of [-1, 1]) { G.px(0, 44, 16, 16, 64, 64).at(TR(sx * .14, .43, .02, 0, -.15, -sx * .55)).smooth(0).loft(4, [[0, .055, .055, 0, .9], [.1, .04, .04, .6, 1], [.19, .012, .012, 1, 1.1]], {});
      Gg.px(20, 44, 8, 8, 64, 64).at(TR(sx * .14, .43, .02, 0, -.15, -sx * .55)).loft(4, [[.17, .001, .001, 0], [.2, .035, .035, .5], [.24, .001, .001, 1]], {}); }
    J.body.add(G.mesh(t), Gg.mesh(R.mat(t, { glow: true })));
    return mk('jelly', s, J, { h: .6 * s, r: .42 * s, center: .28 * s, reach: .9 * s }); };
  POSE.jelly = (e, name, t, J) => { const b = J.body, r = J.move; r.position.set(0, 0, 0); b.rotation.set(0, 0, 0); let sy = 1, sxz = 1;
    if (name === 'idle') { sy = 1 + Math.sin(t * 3.2) * .07; sxz = 1 - Math.sin(t * 3.2) * .04; b.rotation.z = Math.sin(t * 1.6) * .04; }
    else if (name === 'walk') { const ph = (t * 1.8) % 1; if (ph < .6) { const a = Math.sin(ph / .6 * PI); r.position.y = a * .28; sy = 1 + a * .18; sxz = 1 - a * .1; } else { const a = Math.sin((ph - .6) / .4 * PI); sy = 1 - a * .25; sxz = 1 + a * .16; } }
    else if (name === 'attack') { const k = cl(t / e.userData.len.attack); if (k < .3) { const a = ease(k / .3); sy = 1 - a * .35; sxz = 1 + a * .22; r.position.z = -a * .12; } else if (k < .62) { const a = (k - .3) / .32, h = Math.sin(a * PI); r.position.z = -.12 + ease(a) * 1.12; r.position.y = h * .35; sy = 1.25 - a * .2; sxz = .88; b.rotation.x = .5 - a * .3; } else { const a = ease((k - .62) / .38); r.position.z = 1 - a; r.position.y = Math.sin(a * PI) * .2; sy = 1 - Math.sin(a * PI) * .1; } }
    else if (name === 'hurt') { const k = cl(t / e.userData.len.hurt), a = Math.sin(k * PI); b.rotation.x = -a * .5; sy = 1 - a * .28; sxz = 1 + a * .18; r.position.x = Math.sin(t * 60) * .03 * (1 - k); r.position.z = -a * .15; }
    else if (name === 'down') { const k = ease(cl(t / e.userData.len.down)); sy = 1 - k * .86; sxz = 1 + k * .55; b.rotation.z = Math.sin(t * 20) * .05 * (1 - k); }
    b.scale.set(sxz, sy, sxz); };

  // ---- 四つ足のけもの ----
  E.beast = (o = {}) => { const s = o.s || 1, c = o.c || '#7a5aa8', c2 = o.c2 || '#f0b848', eye = o.eye || '#fff08a';
    const t = etex('beast', { c, c2, eye }, () => { const P = Px(64), M = ramp(c), S = ramp(c2), Bl = ramp(mix(c, '#f4e8d8', .62)); P.clip = true;
      // 胴（まん中の列が はら、左右のはしが せなか）。せなかに しま
      for (let y = 0; y < 24; y++) for (let x = 0; x < 64; x++) { const d = Math.abs(x - 31.5) / 32, n = tn(x, y, 8, 8, 64, 24, 2); let col = d < .2 ? tone(Bl, 3 + (n > .6 ? 1 : 0)) : d < .27 ? ((x + y) & 1 ? tone(Bl, 2) : tone(M, 3)) : tone(M, 3 + (n > .7 ? 1 : n < .25 ? -1 : 0));
        const st = (y + Math.round(Math.sin(x * .4) * 1.5) + 60) % 6; if (d > .45 && st < 2) col = tone(S, st ? 3 : 2); if (d > .45 && st === 2) col = tone(M, 1); if (d > .94) col = tone(M, 1); P.set(x, y, col); }
      for (let k = 0; k < 26; k++) { const x = Math.floor(hash(k, 1, 6) * 64), y = Math.floor(hash(k, 2, 6) * 22); if (Math.abs(x - 32) < 8) continue; P.set(x, y, tone(M, 5)); P.set(x, y + 1, tone(M, 1)); }
      P.line(46, 13, 52, 17, '#f4d8d0'); P.line(46, 14, 52, 18, tone(M, 0)); P.line(49, 12, 55, 16, '#f4d8d0');
      // 頭（y=24 が鼻先、y=39 が首。x=16 が あご、はしが頭のてっぺん）
      for (let y = 24; y < 40; y++) for (let x = 0; x < 32; x++) { const d = Math.abs(x - 15.5) / 16; P.set(x, y, d < .25 ? tone(Bl, y < 28 ? 2 : 3) : d > .88 ? tone(S, 2 + ((y >> 1) & 1)) : tone(M, y < 27 ? 2 : 3 + (hash(x, y, 3) > .8 ? 1 : 0))); }
      for (const [ex, sx] of [[6, 1], [22, -1]]) { P.bits(ex, 31, ['kkkk', 'keek', 'kehk', 'kkkk'], { k: tone(M, 0), e: eye, h: '#ffffff' }); P.line(ex + (sx > 0 ? -1 : 4), 30, ex + (sx > 0 ? 3 : 0), 29, tone(M, 0)); }
      for (const mx of [11, 20]) { for (let y = 25; y < 35; y++) P.set(mx, y, tone(M, 0)); for (const fy of [26, 29, 32]) { P.set(mx + (mx < 16 ? 1 : -1), fy, '#ffffff'); P.set(mx + (mx < 16 ? 1 : -1), fy + 1, '#ffffff'); P.set(mx + (mx < 16 ? 2 : -2), fy, '#ffffff'); } }
      P.rect(0, 24, 4, 2, '#201828'); P.rect(28, 24, 4, 2, '#201828'); P.set(1, 24, '#8a80a0'); P.set(30, 24, '#8a80a0');
      // 足（下の 3 行が つめ）
      for (let y = 24; y < 40; y++) for (let x = 32; x < 48; x++) { const st = (y - 24) % 5; P.set(x, y, st === 1 ? tone(S, 3) : st === 2 ? tone(M, 1) : tone(M, 3 + ((x - 32) < 4 ? 1 : (x - 32) > 11 ? -1 : 0))); }
      for (let x = 32; x < 48; x++) { P.set(x, 37, tone(M, 1)); P.set(x, 38, (x & 3) === 3 ? tone(M, 0) : '#f4ecd8'); P.set(x, 39, (x & 3) === 3 ? tone(M, 0) : '#c8c0b8'); }
      // しっぽ（しま。先は明るい）
      for (let y = 24; y < 40; y++) for (let x = 48; x < 64; x++) P.set(x, y, y < 28 ? tone(S, 4 - ((x + y) & 1)) : ((y >> 1) & 1) ? tone(S, 3) : tone(M, 2 + ((x - 48) < 5 ? 1 : 0)));
      // たてがみ（抜き）・耳
      for (let x = 0; x < 32; x++) { const hgt = 3 + [0, 2, 5, 8, 6, 3][x % 6]; for (let j = 0; j < hgt; j++) P.set(x, 51 - j, j === hgt - 1 ? tone(S, 1) : tone(S, j > hgt * .5 ? 4 : 3)); }
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const w = (y + 1) / 2; if (Math.abs(x - 3.5) < w) P.set(32 + x, 40 + y, Math.abs(x - 3.5) < w - 1.2 ? '#e08a9a' : tone(M, 2)); }
      return P; }, true);
    const J = { root: new THREE.Group() }; J.move = grp(J.root); J.body = grp(J.move, 0, .58, 0);
    const AX = TR(0, 0, 0, 0, PI / 2, 0), G = R.geo().smooth(1).px(0, 0, 64, 24, 64, 64).at(TR(0, 0, -.52, 0, PI / 2, 0)).loft(8, [[0, .1, .1, 0, .8], [.14, .2, .21, .14, .95], [.42, .19, .2, .42, 1], [.76, .25, .27, .76, 1.05], [1.02, .18, .21, 1, 1]], { cap: 'both' });
    G.at(null).smooth(0).px(0, 40, 32, 12, 64, 64); for (let i = 0; i < 4; i++) { const z0 = -.34 + i * .22, z1 = z0 + .24, y0 = .17 + i * .025; G.quad([0, y0, z0], [0, y0 + .02, z1], [0, y0 + .2, z1], [0, y0 + .18, z0], [i * .25, 0, i * .25 + .25, 1]); }
    J.body.add(G.mesh(t));
    J.head = grp(J.body, 0, .1, .47); J.head.scale.setScalar(1.18); const Gh = R.geo().smooth(1).px(0, 24, 32, 16, 64, 64).at(TR(0, 0, -.04, 0, PI / 2, 0)).loft(8, [[0, .15, .15, 0, .9], [.14, .185, .175, .35, 1], [.3, .12, .11, .7, 1], [.45, .075, .065, 1, 1.05]], { cap: 'both' });
    Gh.at(null).smooth(0).px(32, 40, 8, 8, 64, 64); for (const sx of [-1, 1]) Gh.tri([sx * .06, .13, .04], [sx * .17, .1, .08], [sx * .15, .32, -.02], [0, 0], [1, 0], [.5, 1]);
    J.head.add(Gh.mesh(t)); J.jaw = grp(J.head, 0, -.07, .08); J.jaw.add(R.geo().smooth(1).px(10, 24, 12, 14, 64, 64).at(AX).loft(5, [[0, .1, .04, 0, .8], [.32, .06, .03, 1, .95]], { cap: 'both' }).mesh(t));
    for (const [n, x, z] of [['FL', .15, .34], ['FR', -.15, .34], ['BL', .15, -.36], ['BR', -.15, -.36]]) { const L = J['leg' + n] = grp(J.body, x, -.02, z), S2 = J['shin' + n] = grp(L, 0, -.3, 0);
      L.add(R.geo().smooth(1).px(32, 24, 16, 8, 64, 64).loft(5, [[-.3, .06, .07, 0, .85], [0, .095, .12, 1, 1]], {}).mesh(t)); S2.add(R.geo().smooth(1).px(32, 32, 16, 8, 64, 64).loft(5, [[-.28, .08, .1, 0, .85, 0, .025], [-.2, .05, .055, .35, .9], [0, .058, .068, 1, 1]], { cap: 'bot' }).mesh(t)); }
    J.tail = grp(J.body, 0, .06, -.5); J.tail.add(R.geo().smooth(1).px(48, 24, 16, 16, 64, 64).at(TR(0, 0, 0, 0, -PI / 2, 0)).loft(5, [[0, .05, .05, 1, .9], [.3, .035, .035, .5, 1], [.42, .075, .075, .2, 1.05], [.54, .01, .01, 0, 1.1]], {}).mesh(t));
    return mk('beast', s, J, { h: .95 * s, r: .6 * s, center: .55 * s, reach: 1.2 * s, len: { attack: 1, hurt: .5, down: 1 }, hitAt: .5 }); };
  POSE.beast = (e, name, t, J) => { const m = J.move, b = J.body, L = e.userData.len; m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); b.position.y = .58; b.rotation.set(0, 0, 0); J.head.rotation.set(.25, 0, 0); J.jaw.rotation.x = .1; J.tail.rotation.set(.5, 0, 0);
    const leg = (n, a, k) => { J['leg' + n].rotation.set(a, 0, 0); J['shin' + n].rotation.x = k; }; for (const n of ['FL', 'FR', 'BL', 'BR']) leg(n, 0, 0);
    if (name === 'idle') { const br = Math.sin(t * 2.4); b.position.y = .58 + br * .012; J.head.rotation.set(.25 + br * .04, Math.sin(t * .9) * .3, 0); J.tail.rotation.set(.5 + Math.sin(t * 1.7) * .15, Math.sin(t * 3.1) * .5, 0); J.jaw.rotation.x = .12 + Math.max(0, Math.sin(t * 1.3)) * .12; leg('FL', -.08, .1); leg('BR', .1, -.08); }
    else if (name === 'walk') { const ph = t * 9; for (const [n, o2] of [['FL', 0], ['BR', .3], ['FR', PI], ['BL', PI + .3]]) { const a = Math.sin(ph + o2); leg(n, a * .6, Math.max(0, Math.cos(ph + o2)) * .7 - .1); } b.position.y = .56 + Math.abs(Math.sin(ph)) * .04; b.rotation.x = Math.sin(ph * 2) * .04; J.head.rotation.x = .2 + Math.sin(ph * 2) * .06; J.tail.rotation.set(.7, Math.sin(ph) * .4, 0); }
    else if (name === 'attack') { const k = cl(t / L.attack);
      if (k < .32) { const a = ease(k / .32); b.position.y = .58 - a * .16; b.rotation.x = a * .22; J.head.rotation.x = .25 - a * .3; m.position.z = -a * .18; leg('FL', -.5 * a, .9 * a); leg('FR', -.5 * a, .9 * a); leg('BL', .4 * a, -.5 * a); leg('BR', .4 * a, -.5 * a); J.jaw.rotation.x = .1 + a * .2; J.tail.rotation.x = .5 + a * .5; }
      else if (k < .62) { const a = (k - .32) / .3, h = Math.sin(a * PI); m.position.z = -.18 + ease(a) * 1.38; m.position.y = h * .42; b.rotation.x = -.35 + a * .6; leg('FL', -1.3 + a * .6, .2); leg('FR', -1.1 + a * .5, .2); leg('BL', .9 - a * .5, .3); leg('BR', .8 - a * .5, .3); J.head.rotation.x = -.2; J.jaw.rotation.x = .75 - (a > .8 ? (a - .8) * 3.2 : 0); J.tail.rotation.x = 1; }
      else { const a = ease((k - .62) / .38); m.position.z = 1.2 * (1 - a); m.position.y = Math.sin(a * PI) * .22; leg('FL', .3 * Math.sin(a * PI), .3); leg('FR', .2 * Math.sin(a * PI), .3); leg('BL', -.3 * Math.sin(a * PI), .3); leg('BR', -.2 * Math.sin(a * PI), .3); } }
    else if (name === 'hurt') { const k = cl(t / L.hurt), a = Math.sin(k * PI); m.position.z = -a * .25; m.position.x = Math.sin(t * 55) * .025 * (1 - k); b.rotation.set(-a * .25, 0, a * .15); J.head.rotation.set(-.3 * a, .7 * a, .3 * a); J.jaw.rotation.x = .1 + a * .5; J.tail.rotation.x = .5 - a * .9; leg('FL', -.5 * a, .6 * a); leg('FR', -.3 * a, .4 * a); }
    else if (name === 'down') { const k = cl(t / L.down), a = ease(Math.min(1, k * 1.6)), bo = k < .62 ? 0 : Math.sin((k - .62) / .38 * PI) * .05; m.rotation.z = a * 1.5; m.position.y = -a * .34 + bo; m.position.x = a * .3; J.head.rotation.set(.5 * a, 0, -.3 * a); J.jaw.rotation.x = .1 + a * .4; J.tail.rotation.set(.5 - a * .7, 0, 0); leg('FL', -.4 * a, .5 * a); leg('FR', .3 * a, .3 * a); leg('BL', .5 * a, .2 * a); leg('BR', -.3 * a, .6 * a); } };

  // ---- がらくた（か岩）のゴーレム ----
  E.golem = (o = {}) => { const s = o.s || 1, rock = o.kind === 'rock', c = o.c || (rock ? '#9a968c' : '#7c84a8'), c2 = o.c2 || (rock ? '#6aa058' : '#c8683a'), eye = o.eye || (rock ? '#8af0e0' : '#ffd060');
    const t = etex('golem', { c, c2, eye, rock }, () => { const P = Px(64), M = ramp(c, 6, { contrast: .9 }), S = ramp(c2), K0 = M[0]; P.clip = true;
      // 板（石）を 1 枚ずつ：ふちの光と影、リベット（こけ）、さび（ひび）
      const plate = (x, y, w, h, k, sd) => { P.block(x, y, w, h, M, k, { round: rock }); for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const n = tn(x + i, y + j, 8, 8, 64, 64, sd); if (n > .7) P.set(x + i, y + j, tone(M, k + 1)); else if (n < .26 && ((i + j) & 1)) P.set(x + i, y + j, tone(M, k - 1)); }
        if (rock) { for (let i = 1; i < w - 1; i++) if (hash(x + i, y, sd) > .45) { P.set(x + i, y, tone(S, 3)); if (hash(x + i, y, sd + 1) > .5) P.set(x + i, y + 1, tone(S, 2)); } const cx = x + 2 + Math.floor(hash(x, y, sd + 2) * (w - 4)); for (let j = 2; j < h - 1; j++) P.set(cx + (j % 3 === 0 ? 1 : 0), y + j, tone(M, k - 2)); }
        else { for (const [i, j] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) { P.set(x + i, y + j, tone(M, 5)); if (j === 1 && hash(x + i, y, sd) < .6) for (let q = 1; q < 2 + hash(x + i, y, sd + 4) * (h - 4); q++) P.set(x + i, y + j + q, tone(S, q < 3 ? 2 : 3)); } } };
      // 胴（x=32 が正面）
      [[0, 0, 12, 14], [12, 0, 12, 10], [0, 14, 12, 14], [12, 10, 12, 18], [40, 0, 12, 18], [52, 0, 12, 12], [40, 18, 12, 10], [52, 12, 12, 16], [24, 0, 16, 5], [24, 24, 16, 4]].forEach(([x, y, w, h], i) => plate(x, y, w, h, 2 + (i * 7 % 3 === 0 ? 1 : 0), i));
      P.block(24, 5, 16, 19, M, 3); for (let y = 7; y < 13; y += 2) { P.rect(26, y, 12, 1, K0); P.rect(26, y + 1, 12, 1, tone(M, 4)); }
      P.disc(32, 18.5, 5, K0); P.disc(32, 18.5, 4, tone(M, 1));
      if (!rock) { for (let x = 0; x < 24; x++) for (let y = 24; y < 27; y++) P.set(x, y, ((x + y) >> 2) & 1 ? '#f0c040' : '#2a2838'); P.bits(44, 4, ['ww.w', 'w..w', 'w.ww', '....', '.ww.'], { w: '#f0ecd8' }); }
      else { for (let a = 0; a < 16; a++) P.set(46 + Math.round(Math.cos(a / 16 * PI * 2) * 3.4), 8 + Math.round(Math.sin(a / 16 * PI * 2) * 3.4), eye); P.set(46, 8, eye); P.line(46, 5, 46, 11, mix(eye, c, .4)); }
      P.line(5, 4, 9, 9, tone(M, 5)); P.line(5, 5, 9, 10, K0); P.line(56, 16, 60, 22, tone(M, 5)); P.line(56, 17, 60, 23, K0);
      // 頭（x=16 が正面。のぞき窓に光る目）
      plate(0, 28, 10, 12, 3, 20); plate(22, 28, 10, 12, 2, 21); P.block(10, 28, 12, 12, M, 3); P.rect(0, 28, 32, 1, tone(M, 5)); P.rect(10, 32, 12, 4, K0); P.rect(11, 33, 3, 2, eye); P.rect(18, 33, 3, 2, eye); P.set(12, 33, '#ffffff'); P.set(19, 33, '#ffffff'); P.rect(10, 37, 12, 1, tone(M, 1)); for (let x = 11; x < 21; x += 2) P.set(x, 38, K0);
      // うで（上 8 行が上うで、下 10 行が前うで。いちばん下が こぶし）
      plate(32, 28, 16, 8, 2, 30); plate(48, 28, 16, 8, 3, 31); plate(32, 36, 11, 7, 3, 32); plate(43, 36, 11, 7, 2, 33); plate(54, 36, 10, 7, 3, 34); for (let x = 32; x < 64; x++) { P.set(x, 43, K0); P.set(x, 44, tone(M, (x & 7) < 6 ? 4 : 1)); P.set(x, 45, tone(M, (x & 7) < 6 ? 3 : 0)); }
      if (!rock) for (let x = 32; x < 64; x++) P.set(x, 40, ((x >> 2) & 1) ? '#f0c040' : '#2a2838');
      // 足（下が足のうら）
      plate(0, 40, 16, 9, 3, 40); plate(16, 40, 16, 9, 2, 41); plate(0, 49, 32, 4, 2, 42); for (let x = 0; x < 32; x++) { P.set(x, 53, K0); P.set(x, 54, tone(M, 4)); P.set(x, 55, (x & 3) ? tone(M, 2) : K0); }
      // 胸のあかり・えんとつ・光る色
      for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const d = Math.hypot(x - 5.5, y - 5.5); P.set(32 + x, 46 + y, d < 2 ? '#ffffff' : d < 4 ? eye : d < 5 ? mix(eye, '#402010', .45) : d < 6 ? K0 : tone(M, 2)); } P.line(34, 50, 36, 48, '#ffffff');
      for (let y = 46; y < 62; y++) for (let x = 44; x < 52; x++) P.set(x, y, y < 49 ? '#1c1a24' : (y % 5 === 0) ? tone(M, 0) : tone(M, 2 + ((x - 44) < 3 ? 1 : 0)));
      P.rect(56, 56, 8, 8, eye); return P; });
    const J = { root: new THREE.Group() }; J.move = grp(J.root); J.hips = grp(J.move, 0, .72, 0); J.torso = grp(J.hips);
    const G = R.geo().smooth(rock ? 1 : 0).px(0, 0, 64, 28, 64, 64).loft(8, [[-.06, .3, .26, 0, .72], [.2, .47, .37, .25, .9], [.62, .63, .45, .62, 1], [.86, .56, .42, .86, 1.06], [.99, .3, .28, 1, 1.12]], { cap: 'both' });
    G.px(44, 46, 8, 16, 64, 64).at(TR(-.42, .84, -.16, 0, -.25, .25)).loft(5, [[0, .075, .075, 0, .9], [.34, .075, .075, .8, 1], [.35, .1, .1, .82, 1], [.42, .1, .1, 1, 1.05]], { cap: 'top' }).at(null);
    const Gg = R.geo().px(32, 46, 12, 12, 64, 64).at(TR(0, .47, .385, 0, PI / 2 - .12, 0)).loft(6, [[0, .15, .15, 0], [.035, .13, .13, 1]], { cap: 'top', capRect: true });
    J.torso.add(G.mesh(t), Gg.mesh(R.mat(t, { glow: true })));
    J.head = grp(J.torso, 0, .93, .2); J.head.add(R.geo().smooth(0).px(0, 28, 32, 12, 64, 64).loft(6, [[-.02, .2, .2, 0, .85], [.2, .215, .215, .8, 1], [.28, .13, .13, 1, 1.1]], { cap: 'top' }).mesh(t));
    { const Ge = R.geo().px(56, 56, 8, 8, 64, 64); for (const sx of [-1, 1]) Ge.quad([sx * .075 - .035, .085, .205], [sx * .075 + .035, .085, .205], [sx * .075 + .035, .13, .205], [sx * .075 - .035, .13, .205]); J.head.add(Ge.mesh(R.mat(t, { glow: true }))); }
    for (const [n, sx] of [['L', 1], ['R', -1]]) { const A = J['arm' + n] = grp(J.torso, sx * .68, .78, .02), Fo = J['fore' + n] = grp(A, 0, -.42, 0), Lg = J['leg' + n] = grp(J.hips, sx * .27, 0, 0);
      A.add(R.geo().smooth(0).px(32, 28, 32, 8, 64, 64).loft(6, [[-.44, .1, .1, 0, .85], [-.06, .15, .15, .7, 1], [.1, .2, .2, .85, 1.05], [.19, .05, .05, 1, 1.1]], { cap: 'top' }).mesh(t));
      Fo.add(R.geo().smooth(0).px(32, 36, 32, 10, 64, 64).loft(6, [[-.64, .2, .22, 0, .8], [-.5, .25, .27, .22, .92], [-.2, .2, .21, .62, 1], [.02, .12, .12, 1, 1]], { cap: 'bot' }).mesh(t));
      Lg.add(R.geo().smooth(0).px(0, 40, 32, 16, 64, 64).loft(6, [[-.72, .2, .27, 0, .75, 0, .05], [-.6, .17, .2, .2, .9], [-.3, .13, .13, .6, 1], [.02, .17, .17, 1, 1]], { cap: 'bot' }).mesh(t)); }
    return mk('golem', s, J, { h: 1.95 * s, r: .8 * s, center: 1.1 * s, reach: 1.2 * s, len: { attack: 1.3, hurt: .55, down: 1.4 }, hitAt: .5 }); };
  POSE.golem = (e, name, t, J) => { const m = J.move, L = e.userData.len; m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); J.hips.position.y = .72; J.hips.rotation.set(0, 0, 0); J.torso.rotation.set(.18, 0, 0); J.head.rotation.set(-.1, 0, 0);
    for (const n of ['L', 'R']) { const sx = n === 'L' ? 1 : -1; J['arm' + n].rotation.set(.1, 0, sx * .12); J['fore' + n].rotation.set(-.25, 0, 0); J['leg' + n].rotation.set(0, 0, 0); }
    if (name === 'idle') { const br = Math.sin(t * 1.6); J.torso.rotation.x = .18 + br * .03; J.torso.rotation.y = Math.sin(t * .7) * .08; J.head.rotation.y = Math.sin(t * .9 + 1) * .5; J.armL.rotation.x = .1 + br * .06; J.armR.rotation.x = .1 - br * .06; J.hips.position.y = .72 + br * .01; }
    else if (name === 'walk') { const ph = t * 4.2, a = Math.sin(ph); J.legL.rotation.x = a * .5; J.legR.rotation.x = -a * .5; J.hips.position.y = .7 + Math.abs(Math.cos(ph)) * .05; J.hips.rotation.z = a * .06; J.torso.rotation.set(.24, a * .16, -a * .05); J.armL.rotation.x = -a * .5; J.armR.rotation.x = a * .5; J.foreL.rotation.x = -.35; J.foreR.rotation.x = -.35; }
    else if (name === 'attack') { const k = cl(t / L.attack), up = k < .4 ? ease(k / .4) : k < .5 ? 1 - ease((k - .4) / .1) * 1.25 : -.25 * (1 - ease((k - .5) / .5)), rec = k > .5 ? 1 - ease((k - .5) / .5) : 1, fw = k < .4 ? 0 : k < .5 ? ease((k - .4) / .1) : rec;
      J.armR.rotation.set(.1 - Math.max(0, up) * 2.9 + (up < 0 ? -1.1 * (-up / .25) : 0), 0, -.12 - Math.max(0, up) * .3); J.foreR.rotation.x = -.25 - Math.max(0, up) * .6; J.armL.rotation.set(.1 + Math.max(0, up) * .5, 0, .2); J.torso.rotation.set(.18 - Math.max(0, up) * .3 + fw * .55, Math.max(0, up) * .45 - fw * .3, 0); J.head.rotation.x = -.1 - fw * .3; m.position.z = fw * .35; J.legL.rotation.x = -fw * .4; J.legR.rotation.x = fw * .3; J.hips.position.y = .72 - fw * .06; if (k > .5 && k < .62) m.position.y = Math.sin((k - .5) / .12 * PI) * -.02; }
    else if (name === 'hurt') { const k = cl(t / L.hurt), a = Math.sin(k * PI); J.torso.rotation.set(.18 - a * .5, a * .2, 0); J.head.rotation.set(-.1 - a * .4, Math.sin(t * 40) * .2 * (1 - k), 0); J.armL.rotation.set(-a * .8, 0, .12 + a * .7); J.armR.rotation.set(-a * .6, 0, -.12 - a * .7); m.position.z = -a * .2; J.legR.rotation.x = -a * .3; }
    else if (name === 'down') { const k = cl(t / L.down), a = ease(Math.min(1, k * 1.5)), b = ease(cl((k - .35) / .5)); J.hips.position.y = .72 - a * .4 + (k > .66 && k < .8 ? Math.sin((k - .66) / .14 * PI) * .03 : 0); J.legL.rotation.set(-a * 1.3, 0, a * .35); J.legR.rotation.set(-a * 1.2, 0, -a * .4); J.torso.rotation.set(.18 + b * 1.05, 0, b * .12); J.head.rotation.set(-.1 + b * .5, 0, b * .5); J.armL.rotation.set(.1 - b * .9, 0, .12 + b * .6); J.armR.rotation.set(.1 - b * .7, 0, -.12 - b * .5); J.foreL.rotation.x = -.25 - b * .3; m.position.x = Math.sin(t * 45) * .015 * (1 - k); } };

  // ---- 空を飛ぶ小さな機械 ----
  E.drone = (o = {}) => { const s = o.s || 1, c = o.c || '#d8a038', c2 = o.c2 || '#3a3e58', eye = o.eye || '#ff5a4a', fly = o.fly ?? 1.25;
    const t = etex('drone', { c, c2, eye }, () => { const P = Px(64), M = ramp(c), D = ramp(c2), K0 = D[0]; P.clip = true;
      // 胴（x=32 が正面。上が上面）。つぎ目、リベット、しま、目のまわりのわく
      for (let y = 0; y < 20; y++) for (let x = 0; x < 64; x++) { const n = tn(x, y, 8, 8, 64, 20, 4); let col = y < 3 ? tone(M, 5) : y < 9 ? tone(M, 4 - (n < .3 ? 1 : 0)) : y < 11 ? tone(D, 2 + ((x >> 1) & 1)) : y < 17 ? tone(M, 3 - (n < .3 ? 1 : 0)) : tone(M, 1);
        if ((x & 15) === 0) col = y < 9 || y > 10 ? K0 : col; if ((x & 15) === 1 && (y < 9 || y > 10)) col = tone(M, 5); if (((x & 15) === 4 || (x & 15) === 13) && (y === 4 || y === 14)) col = '#fff4d0'; P.set(x, y, col); }
      for (let x = 0; x < 16; x++) for (let y = 12; y < 16; y++) { P.set(x, y, ((x + y) >> 1) & 1 ? '#2a2838' : '#f0e8d0'); P.set(48 + x, y, ((x + y) >> 1) & 1 ? '#2a2838' : '#f0e8d0'); }
      P.disc(32, 10, 8.2, K0); P.disc(32, 10, 7, tone(D, 2)); P.disc(32, 10, 5.5, K0); for (let a = 0; a < 8; a++) P.set(32 + Math.round(Math.cos(a / 8 * PI * 2) * 6.3), 10 + Math.round(Math.sin(a / 8 * PI * 2) * 6.3), tone(D, 5));
      P.line(6, 5, 10, 7, tone(M, 1)); P.line(52, 4, 57, 6, tone(M, 1)); P.bits(19, 3, ['w.w', '.w.', 'w.w'], { w: '#c03838' });
      // 目（レンズ）
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); P.set(x, 20 + y, d < 2.2 ? '#fff0e0' : d < 4.6 ? eye : d < 6 ? mix(eye, '#200808', .5) : d < 7.4 ? '#181420' : tone(D, 2)); } P.rect(4, 24, 2, 2, '#ffffff'); P.set(10, 31, mix(eye, '#ffffff', .5));
      // 回るはね（抜き）
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x - 7.5, dy = y - 7.5, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), b = Math.abs(Math.sin(a * 1.5)); if (d < 1.8) P.set(16 + x, 20 + y, tone(D, 4)); else if (d < 7.6 && b < .42) P.set(16 + x, 20 + y, b < .16 ? '#e8ecf4' : (x + y) & 1 ? '#aab0c4' : null); else if (d > 6.9 && d < 7.7 && ((x + y) & 1)) P.set(16 + x, 20 + y, '#8088a0'); }
      // 筒・足（鉄）と 尾びれ
      for (let y = 20; y < 36; y++) for (let x = 32; x < 48; x++) P.set(x, y, (y - 20) % 5 === 0 ? K0 : (y - 20) % 5 === 1 ? tone(D, 5) : tone(D, 3 - ((x - 32) > 10 ? 1 : 0))); P.rect(32, 20, 16, 2, '#181420');
      for (let y = 20; y < 36; y++) for (let x = 48; x < 64; x++) P.set(x, y, ((x - 48 + y) >> 2) & 1 ? tone(M, 3) : tone(D, 2)); for (let x = 48; x < 64; x++) { P.set(x, 20, tone(M, 5)); P.set(x, 35, K0); }
      P.rect(0, 40, 8, 8, eye); P.rect(2, 42, 4, 4, '#ffffff'); return P; }, true);
    const J = { root: new THREE.Group() }; J.move = grp(J.root); J.body = grp(J.move, 0, fly, 0);
    const G = R.geo().smooth(1).px(0, 0, 64, 20, 64, 64).loft(8, [[-.16, .05, .05, 0, .7], [-.09, .22, .22, .15, .85], [0, .3, .3, .5, 1], [.09, .23, .23, .85, 1.08], [.16, .07, .07, 1, 1.15]], { cap: 'both' });
    G.smooth(0).px(32, 20, 16, 16, 64, 64); for (const sx of [-1, 1]) G.at(TR(sx * .26, .02, 0, 0, 0, -sx * PI / 2)).loft(4, [[0, .045, .045, 0, .9], [.2, .03, .03, 1, 1]], {}).at(TR(sx * .46, -.02, 0)).loft(5, [[0, .05, .05, 0, .85], [.1, .035, .035, 1, 1]], { cap: 'top' });
    G.at(TR(0, .14, -.05)).loft(3, [[0, .012, .012, 0], [.2, .008, .008, 1]], {}).at(null).px(48, 20, 16, 16, 64, 64).quad([0, .02, -.2], [0, .02, -.5], [0, .24, -.52], [0, .12, -.22]).quad([-.2, 0, -.2], [.2, 0, -.2], [.12, 0, -.44], [-.12, 0, -.44]);
    for (const sx of [-1, 1]) G.px(32, 20, 16, 16, 64, 64).at(TR(sx * .12, -.12, .06, 0, .5, sx * .35)).loft(3, [[-.2, .008, .008, 0], [0, .03, .03, 1]], {});
    const Gg = R.geo().px(0, 20, 16, 16, 64, 64).at(TR(0, 0, .25, 0, PI / 2, 0)).loft(8, [[0, .15, .15, 0], [.07, .12, .12, 1]], { cap: 'top', capRect: true }).at(TR(0, .34, -.05)).px(0, 40, 8, 8, 64, 64).loft(4, [[0, .001, .001, 0], [.03, .03, .03, .5], [.06, .001, .001, 1]], {});
    J.body.add(G.mesh(t), Gg.mesh(R.mat(t, { glow: true }))); J.eye = J.body.children[1];
    for (const [n, sx] of [['L', 1], ['R', -1]]) { const r = J['rot' + n] = grp(J.body, sx * .46, .1, 0); r.add(R.geo().px(16, 20, 16, 16, 64, 64).quad([-.26, 0, .26], [.26, 0, .26], [.26, 0, -.26], [-.26, 0, -.26]).mesh(t)); }
    J.gun = grp(J.body, 0, -.14, .04); J.gun.add(R.geo().smooth(0).px(32, 20, 16, 16, 64, 64).at(TR(0, 0, 0, 0, PI / 2 + .25, 0)).loft(5, [[-.04, .06, .06, 0, .8], [.1, .05, .05, .4, 1], [.11, .035, .035, .45, .9], [.3, .03, .03, .9, 1], [.31, .042, .042, 1, 1]], { cap: 'both' }).mesh(t));
    return mk('drone', s, J, { h: (fly + .3) * s, r: .5 * s, center: 0, fly: fly * s, reach: .3 * s, len: { attack: .9, hurt: .6, down: 1.2 }, hitAt: .5 }); };
  POSE.drone = (e, name, t, J) => { const m = J.move, b = J.body, L = e.userData.len, fly = e.userData.fly / e.userData.s; m.position.set(0, 0, 0); b.position.set(0, fly + Math.sin(t * 2.3) * .07, 0); b.rotation.set(0, 0, 0); J.gun.rotation.set(0, 0, 0); J.eye.scale.setScalar(1); let spin = 30;
    if (name === 'idle') { b.rotation.set(Math.sin(t * 1.1) * .06, Math.sin(t * .8) * .25, Math.sin(t * 1.7) * .08); J.gun.rotation.x = Math.sin(t * 1.3) * .15; }
    else if (name === 'walk') { b.rotation.set(.3, 0, Math.sin(t * 3) * .1); }
    else if (name === 'attack') { const k = cl(t / L.attack); if (k < .5) { const a = ease(k / .5); b.rotation.x = -a * .25; b.position.z = -a * .1; b.position.y = fly + a * .12; J.gun.rotation.x = -a * .2; J.eye.scale.setScalar(1 + a * .25 + Math.sin(t * 40) * .08 * a); } else { const a = (k - .5) / .5, kick = Math.exp(-a * 6); b.rotation.x = -.25 + kick * .5 + (1 - kick) * .25; b.position.z = -.1 - kick * .22 + ease(a) * .1; b.position.y = fly + .12 * (1 - ease(a)); J.gun.rotation.x = -.2 * (1 - a); J.eye.scale.setScalar(1 + kick * .6); } }
    else if (name === 'hurt') { const k = cl(t / L.hurt), a = Math.sin(k * PI); b.rotation.set(-a * .5, ease(k) * PI * 2, a * .6); b.position.y = fly - a * .25; b.position.z = -a * .3; spin = 12; }
    else if (name === 'down') { const k = cl(t / L.down), f = Math.min(1, k / .55), y = fly - (fly - .17) * f * f, bo = k > .55 && k < .8 ? Math.sin((k - .55) / .25 * PI) * .12 : 0; b.position.y = y + bo; b.rotation.set(f * .5, f * 2.2, f * 1.05); spin = 30 * Math.max(0, 1 - k * 1.6); J.eye.scale.setScalar(Math.max(.3, 1 - k)); J.gun.rotation.x = f * .6; }
    const A = name === 'down' ? (e.userData.spinA = (e.userData.spinA || 0) + spin * .016) : t * spin; J.rotL.rotation.y = A; J.rotR.rotation.y = -A * 1.1; };

  // ---- よろよろ歩く人がたの影 ----
  E.shade = (o = {}) => { const s = o.s || 1, c = o.c || '#4a3a7a', c2 = o.c2 || '#a888e8', eye = o.eye || '#aaffd8';
    const t = etex('shade', { c, c2, eye }, () => { const P = Px(64), M = ramp(c, 6, { contrast: 1.1 }), S = ramp(c2); P.clip = true;
      // 体（x=32 が正面）。下はぎざぎざの すそ（抜き）。うずと、ふちの明るい線
      for (let y = 0; y < 36; y++) for (let x = 0; x < 64; x++) { const n = tn(x, y, 16, 12, 64, 36, 7), w = Math.sin(x * .3 + y * .22 + n * 5); let col = tone(M, 2 + (w > .55 ? 1 : w < -.6 ? -1 : 0)); if (w > .9) col = tone(S, 2); if (y < 3) col = tone(M, 3); const hem = 30 + [0, 2, 4, 5, 3, 1, 4, 2][(x + (x >> 3)) & 7]; if (y > hem) col = null; else if (y === hem) col = tone(S, 3); else if (y === hem - 1) col = tone(M, 1); P.set(x, y, col); }
      for (const rx of [26, 38]) for (let y = 6; y < 20; y += 3) { P.set(rx, y, tone(S, 3)); P.set(rx + (rx < 32 ? 1 : -1), y + 1, tone(S, 2)); }
      P.bits(28, 8, ['.s.....s.', 'ss.....ss', '.s..s..s.', '....s....', '...sss...', '....s....'], { s: tone(S, 3) });
      for (let k = 0; k < 9; k++) { const x = Math.floor(hash(k, 1, 9) * 64), y = 4 + Math.floor(hash(k, 2, 9) * 22); P.set(x, y, tone(S, 4)); P.set(x + 1, y + 1, tone(M, 0)); }
      // 頭（x=16 が正面）：光る目と ぎざぎざの口
      for (let y = 36; y < 52; y++) for (let x = 0; x < 32; x++) { const w = Math.sin(x * .5 + y * .4); P.set(x, y, tone(M, 2 + (w > .6 ? 1 : 0) + (y < 39 ? 1 : 0))); }
      P.bits(9, 41, ['ee........ee', 'eee......eee', '.eee....eee.', '..ee....ee..'], { e: eye }); P.set(10, 42, '#ffffff'); P.set(20, 42, '#ffffff'); P.bits(11, 47, ['e.e.e.e.e.', '.e.e.e.e.e', '..eeeeee..'], { e: eye }); P.rect(9, 40, 3, 1, tone(M, 0)); P.rect(20, 40, 3, 1, tone(M, 0));
      // うで（下が つめ）
      for (let y = 36; y < 52; y++) for (let x = 32; x < 48; x++) { const w = Math.sin(x * .8 + y * .5); P.set(x, y, y > 48 ? tone(S, 4 - ((x >> 1) & 1)) : tone(M, 2 + (w > .5 ? 1 : 0))); } for (let y = 37; y < 48; y += 4) P.rect(32, y, 16, 1, tone(S, 2));
      P.rect(48, 36, 8, 8, eye); P.rect(56, 36, 8, 8, tone(S, 4)); return P; }, true);
    const emi = mix(c, '#000000', .55), mt = R.mat(t, { vc: true, smooth: true, emissive: emi });
    const J = { root: new THREE.Group() }; J.move = grp(J.root); J.body = grp(J.move); J.torso = grp(J.body, 0, .8, 0);
    J.body.add(R.geo().smooth(1).px(0, 18, 64, 18, 64, 64).loft(8, [[0, .36, .34, 0, .8], [.3, .24, .22, .45, .9], [.82, .17, .15, 1, 1]], {}).mesh(mt));
    J.torso.add(R.geo().smooth(1).px(0, 0, 64, 18, 64, 64).loft(8, [[0, .17, .15, 0, .95], [.34, .26, .2, .55, 1.05], [.5, .2, .16, .85, 1.1], [.58, .07, .07, 1, 1.1]], { cap: 'top' }).mesh(mt));
    J.head = grp(J.torso, 0, .57, .03); const Gh = R.geo().smooth(1).px(0, 36, 32, 16, 64, 64).loft(6, [[-.02, .08, .09, 0, .9], [.1, .15, .15, .4, 1], [.24, .13, .13, .8, 1.1], [.36, .03, .03, 1, 1.15, 0, -.08]], { cap: 'both' });
    Gh.smooth(0).px(56, 36, 8, 8, 64, 64); for (const sx of [-1, 1]) Gh.at(TR(sx * .1, .24, -.02, 0, -.3, -sx * .7)).loft(3, [[0, .035, .035, 0], [.2, .004, .004, 1]], {}); J.head.add(Gh.mesh(mt));
    { const Ge = R.geo().px(48, 36, 8, 8, 64, 64); for (const sx of [-1, 1]) Ge.tri([sx * .02, .15, .153], [sx * .11, .2, .12], [sx * .1, .14, .13]); Ge.quad([-.06, .06, .14], [.06, .06, .14], [.05, .085, .15], [-.05, .085, .15]); J.head.add(Ge.mesh(R.mat(t, { glow: true, side: true }))); }
    for (const [n, sx] of [['L', 1], ['R', -1]]) { const A = J['arm' + n] = grp(J.torso, sx * .25, .42, 0), Fo = J['fore' + n] = grp(A, 0, -.5, 0);
      A.add(R.geo().smooth(1).px(32, 36, 16, 8, 64, 64).loft(5, [[-.5, .045, .045, 0, .9], [0, .07, .07, 1, 1]], { cap: 'top' }).mesh(mt));
      const Gf = R.geo().smooth(1).px(32, 40, 16, 8, 64, 64).loft(5, [[-.5, .06, .05, 0, .9], [0, .045, .045, 1, 1]], {}); Gf.smooth(0).px(32, 46, 16, 6, 64, 64); for (const d of [-1, 0, 1]) Gf.at(TR(d * .04, -.48, 0, 0, .25, d * .3)).loft(3, [[-.22, .003, .003, 0, 1.1], [0, .025, .025, 1, 1]], {}); Fo.add(Gf.mesh(mt)); }
    return mk('shade', s, J, { h: 1.75 * s, r: .4 * s, center: 1 * s, reach: .7 * s, len: { attack: 1.1, hurt: .6, down: 1.3 }, hitAt: .55 }); };
  POSE.shade = (e, name, t, J) => { const m = J.move, b = J.body, L = e.userData.len; m.position.set(0, 0, 0); b.rotation.set(0, 0, 0); b.scale.set(1, 1, 1); J.torso.rotation.set(.25, 0, 0); J.head.rotation.set(.1, 0, .2);
    for (const n of ['L', 'R']) { const sx = n === 'L' ? 1 : -1; J['arm' + n].rotation.set(-.15, 0, sx * .12); J['fore' + n].rotation.set(-.3, 0, 0); }
    if (name === 'idle') { const a = Math.sin(t * 1.3); b.rotation.z = a * .07; J.torso.rotation.set(.25 + Math.sin(t * .9) * .06, 0, a * .08); J.head.rotation.set(.1, Math.sin(t * .6) * .4, .2 + Math.sin(t * 2.1) * .1); J.armL.rotation.x = -.15 + Math.sin(t * 1.3 + 1) * .15; J.armR.rotation.x = -.15 - Math.sin(t * 1.3 + 1) * .15; b.scale.y = 1 + Math.sin(t * 2.6) * .015; }
    else if (name === 'walk') { const ph = t * 3.2, a = Math.sin(ph); b.rotation.set(.1, 0, a * .14); m.position.y = Math.abs(Math.cos(ph)) * .03; J.torso.rotation.set(.4, a * .2, a * .1); J.head.rotation.set(.2, 0, .2 - a * .25); J.armL.rotation.set(-.5 - a * .5, 0, .2); J.armR.rotation.set(-.5 + a * .5, 0, -.2); J.foreL.rotation.x = -.5; J.foreR.rotation.x = -.5; }
    else if (name === 'attack') { const k = cl(t / L.attack), up = k < .45 ? ease(k / .45) : Math.max(0, 1 - (k - .45) / .1), fw = k < .45 ? 0 : k < .55 ? ease((k - .45) / .1) : 1 - ease((k - .55) / .45);
      for (const n of ['L', 'R']) { const sx = n === 'L' ? 1 : -1; J['arm' + n].rotation.set(-.15 - up * 2.6 - fw * 1.3, 0, sx * (.12 + up * .4 - fw * .3)); J['fore' + n].rotation.x = -.3 - up * .5 + fw * .2; }
      J.torso.rotation.set(.25 - up * .45 + fw * .75, 0, 0); J.head.rotation.set(.1 - up * .3 + fw * .2, 0, .2); m.position.z = -up * .12 + fw * .7; b.scale.y = 1 + up * .08 - fw * .08; }
    else if (name === 'hurt') { const k = cl(t / L.hurt), a = Math.sin(k * PI); J.torso.rotation.set(.25 - a * .8, a * .3, 0); J.head.rotation.set(.1 - a * .5, 0, .2 + a * .4); J.armL.rotation.set(-a * 1.6, 0, .12 + a * .9); J.armR.rotation.set(-a * 1.3, 0, -.12 - a * .9); m.position.z = -a * .2; m.position.x = Math.sin(t * 50) * .03 * (1 - k); b.scale.set(1 + a * .1, 1 - a * .12, 1 + a * .1); }
    else if (name === 'down') { const k = cl(t / L.down), a = ease(k); b.scale.set(1 + a * 1.1, Math.max(.04, 1 - a * .97), 1 + a * 1.1); J.torso.rotation.set(.25 + a * .8, 0, 0); J.head.rotation.set(.1 + a * .6, 0, .2 + Math.sin(t * 14) * .2 * (1 - a)); J.armL.rotation.set(-a * 2.4, 0, .12 + a * .5); J.armR.rotation.set(-a * 2.2, 0, -.12 - a * .5); b.rotation.z = Math.sin(t * 12) * .06 * (1 - a); } };

  // ================= 3. 効果 =================
  const sprT = new Map();
  const spT = (name, fn) => { let t = sprT.get(name); if (!t) { const P = fn(); P.clip = true; sprT.set(name, t = T.from(P, { cut: true })); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; } return t; };
  const bitsP = (rows, map) => { const P = Px(Math.max(...rows.map(r => r.length)), rows.length); P.clip = true; P.bits(0, 0, rows, map); return P; };
  const W = '#ffffff', G1 = '#c8c8c8', G2 = '#909090';
  const TX = {
    glint: () => spT('glint', () => bitsP(['....w....', '....w....', '....w....', '...waw...', 'wwwaaawww', '...waw...', '....w....', '....w....', '....w....'], { w: G1, a: W })),
    dot: () => spT('dot', () => bitsP(['.ww.', 'waaw', 'waaw', '.ww.'], { w: G1, a: W })),
    puff: () => spT('puff', () => { const P = Px(12); P.clip = true; for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const d = Math.hypot(x - 5.5, y - 5.5) + (hash(x >> 1, y >> 1, 4) - .5) * 1.6; if (d < 3.4) P.set(x, y, W); else if (d < 5) P.set(x, y, (x + y) & 1 ? G1 : W); else if (d < 5.9 && ((x + y) & 1)) P.set(x, y, G1); } P.set(3, 3, W); return P; }),
    ball: () => spT('ball', () => bitsP(['..www..', '.waaaw.', 'waaaaaw', 'waaaaaw', 'waaaaaw', '.waaaw.', '..www..'], { w: G2, a: W })),
    shard: () => spT('shard', () => bitsP(['...a...', '..aaw..', '..aaw..', '.aaaww.', '.aaaww.', 'aaaawww', '.aaaww.', '.aaaww.', '..aaw..', '..aaw..', '...a...'], { w: G2, a: W })),
    plus: () => spT('plus', () => bitsP(['..w..', '..a..', 'waaaw', '..a..', '..w..'], { w: G1, a: W })),
    streak: () => spT('streak', () => { const P = Px(16, 4); P.clip = true; for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { const mid = y === 1 || y === 2; if (x > 11) P.set(x, y, mid ? W : G1); else if (x > 5) { if (mid) P.set(x, y, G1); else if ((x + y) & 1) P.set(x, y, G2); } else if (mid && ((x + y) & 1)) P.set(x, y, G2); } return P; }),
    ring: () => spT('ring', () => { const P = Px(32); P.clip = true; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const d = Math.hypot(x - 15.5, y - 15.5); if (d < 15.5 && d > 13.2) P.set(x, y, W); else if (d <= 13.2 && d > 11 && ((x + y) & 1)) P.set(x, y, G1); else if (d <= 11 && d > 8.5 && (x & 1) && (y & 1)) P.set(x, y, G2); } return P; }),
    // 剣の弧：よこ 32（弧にそう。右が先）× たて 8（上が外がわ）
    arc: () => spT('arc', () => { const P = Px(32, 8); P.clip = true; for (let x = 0; x < 32; x++) for (let y = 0; y < 8; y++) { const k = x / 31, w = Math.round(1 + k * 6); if (y >= w) continue; if (y === 0) P.set(x, y, k > .2 ? W : G1); else if (y < w * .45) P.set(x, y, k > .5 ? W : G1); else if ((x + y) & 1) P.set(x, y, k > .6 ? G1 : G2); } return P; }),
    bolt: () => spT('bolt', () => { const P = Px(8, 8); P.clip = true; for (let y = 0; y < 8; y++) { P.rect(3, y, 2, 1, W); P.set(2, y, G1); P.set(5, y, G1); if (y & 1) { P.set(1, y, G2); P.set(6, y, G2); } } return P; }),
    flame: i => spT('flame' + i, () => { const P = Px(12, 16); P.clip = true; for (let y = 0; y < 16; y++) { const k = y / 15, w = (k < .6 ? .8 + k * 6.5 : 4.7 * Math.sin((1 - k) / .4 * PI / 2) + .6), cx = 5.5 + Math.sin(y * .7 + i * 2.1) * (1 - k) * 1.6; for (let x = 0; x < 12; x++) { const d = Math.abs(x + .5 - cx - .5); if (d < w * .38 && k > .35) P.set(x, y, W); else if (d < w * .7 && k > .15) P.set(x, y, '#ffd860'); else if (d < w) P.set(x, y, k < .25 && ((x + y + i) & 1) ? null : '#ff7a28'); } } P.set(2 + i * 3, 1, '#ffd860'); P.set(8 - i * 2, 3, '#ff7a28'); return P; }),
    // 氷のとげの はだ（面のさかい目と つや）
    ice: c => spT('ice' + c, () => { const P = Px(16, 32), M = ramp(c); for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) { const f = x >> 2, k = [4, 2, 3, 5][f] - (y > 24 ? 1 : 0); P.set(x, y, (x & 3) === 0 ? '#ffffff' : tone(M, k + ((x + y * 2) % 11 === 0 ? 1 : 0))); } for (let k = 0; k < 6; k++) { const x = Math.floor(hash(k, 1, 8) * 14), y = Math.floor(hash(k, 2, 8) * 26); P.line(x, y, x + 2, y + 4, '#ffffff'); } return P; }) };
  B.spriteTex = TX;

  B.fx = (scene, cam) => { const items = [], F = { items }, UP = new THREE.Vector3(0, 1, 0);
    const add = (obj, life, tick, o = {}) => { scene.add(obj); obj.visible = !(o.delay > 0); obj.userData.dyn = true; items.push({ obj, life, age: -(o.delay || 0), tick, own: o.own, done: o.done }); return obj; };
    const kill = it => { scene.remove(it.obj); it.obj.traverse(n => { if (n.material && n.material.userData.fx) n.material.dispose(); if (n.geometry && n.userData.ownGeo) n.geometry.dispose(); }); if (it.done) it.done(); };
    F.update = dt => { for (let i = items.length - 1; i >= 0; i--) { const it = items[i]; it.age += dt; if (it.age < 0) continue; it.obj.visible = true; const k = it.age / it.life; if (k >= 1) { items.splice(i, 1); kill(it); continue; } it.tick(k, dt, it.age); } };
    F.clear = () => { for (const it of items.splice(0)) { it.done = null; kill(it); } };
    const spr = (tex, c, size, addv = true) => { const m = new THREE.SpriteMaterial({ map: tex, color: c, transparent: true, blending: addv ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, fog: false }); m.userData.fx = true; const s = new THREE.Sprite(m); s.scale.set(size, size * (tex.userData.h / tex.userData.w), 1); return s; };
    const bmat = (tex, c, addv = true) => { const m = new THREE.MeshBasicMaterial({ map: tex, color: c, transparent: true, blending: addv ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }); m.userData.fx = true; return m; };
    // 飛びちる つぶ（重力つき）
    const burst = (p, tex, c, n, o = {}) => { for (let i = 0; i < n; i++) { const a = hash(i, n, 1 + (o.seed || 0)) * PI * 2, up = (o.up ?? .5) + hash(i, n, 2) * (o.upR ?? 1), sp = (o.speed || 3) * (.5 + hash(i, n, 3)), v = new THREE.Vector3(Math.cos(a) * sp, up * (o.speed || 3), Math.sin(a) * sp), s = spr(tex, c, (o.size || .12) * (.7 + hash(i, n, 4) * .6), o.add !== false); s.position.copy(p);
      if (o.spin) s.material.rotation = hash(i, n, 5) * 6; add(s, (o.life || .4) * (.7 + hash(i, n, 6) * .6), (k, dt) => { v.y -= (o.grav ?? 9) * dt; s.position.addScaledVector(v, dt); if (o.floor !== undefined && s.position.y < o.floor) { s.position.y = o.floor; v.y *= -.4; } s.material.opacity = k > .6 ? (1 - k) / .4 : 1; if (o.spin) s.material.rotation += dt * o.spin; }, { delay: o.delay }); } };
    F.spark = (pos, o = {}) => { const p = V3(pos), s = o.s || 1, c = o.c || '#ffe080', g = spr(TX.glint(), '#ffffff', .2 * s); g.position.copy(p); add(g, .16, k => { const z = (.3 + ease(Math.min(1, k * 2)) * 1.1) * s; g.scale.set(z, z, 1); g.material.rotation = k * .8; g.material.opacity = 1 - k * k; });
      burst(p, TX.dot(), c, o.n || 8, { speed: 3.2 * s, size: .1 * s, life: .32, up: .2, upR: 1.1 }); };
    F.dust = (pos, o = {}) => { const p = V3(pos), s = o.s || 1, n = o.n || 5; for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + hash(i, 7) * 1.2, d = spr(TX.puff(), o.c || '#b8b4c0', .3 * s, false), vx = Math.cos(a) * .9 * s, vz = Math.sin(a) * .9 * s; d.position.copy(p); d.position.y += .12 * s;
      add(d, .5 + hash(i, 8) * .2, (k, dt) => { d.position.x += vx * dt * (1 - k); d.position.z += vz * dt * (1 - k); d.position.y += dt * .4 * s; const z = (.25 + k * .5) * s; d.scale.set(z, z, 1); d.material.opacity = (1 - k) * .8; }); } };
    F.ring = (pos, o = {}) => { const p = V3(pos), s = o.s || 1, m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bmat(TX.ring(), o.c || '#ffe8a0')); m.userData.ownGeo = true; m.rotation.x = -PI / 2; m.position.copy(p); m.position.y += .04;
      add(m, o.life || .45, k => { const z = (.3 + ease(k) * 2.6) * s; m.scale.set(z, z, 1); m.material.opacity = 1 - k * k; }, { delay: o.delay }); return m; };
    // 剣の弧：半径 .5〜1.1 m のおうぎ形が、ふりの向きに回りながら消える
    F.slash = (pos, o = {}) => { const p = V3(pos), s = o.s || 1, G = R.geo(), n = 9, span = 2.5; for (let i = 0; i < n; i++) { const a0 = -span / 2 + span * i / n, a1 = -span / 2 + span * (i + 1) / n, q = (a, r) => [Math.sin(a) * r, 0, Math.cos(a) * r]; G.quad(q(a0, .45), q(a1, .45), q(a1, 1.15), q(a0, 1.15), [i / n, 0, (i + 1) / n, 1]); }
      const m = new THREE.Mesh(G.build(), bmat(TX.arc(), o.c || '#e8f4ff')), h = new THREE.Group(); m.userData.ownGeo = true; h.add(m); h.position.copy(p); h.rotation.set(0, o.ry || 0, 0); const inner = m, fl = o.flip ? -1 : 1; inner.rotation.z = (o.tilt || 0) * fl; h.scale.setScalar(s);
      add(h, o.life || .22, k => { inner.rotation.y = fl * (-.9 + ease(k) * 1.8); inner.scale.set(fl, 1, 1); m.material.opacity = k < .5 ? 1 : (1 - k) * 2; }); return h; };
    F.heal = (pos, o = {}) => { const p = V3(pos), c = o.c || '#8affb0', hh = o.h || 1.4; F.ring(p, { c, s: .5, life: .6 });
      for (let i = 0; i < 12; i++) { const s = spr(i % 3 ? TX.glint() : TX.plus(), i % 2 ? c : '#ffffff', .24 + hash(i, 9) * .14), a0 = i / 12 * PI * 2, r0 = .35 + hash(i, 10) * .2; add(s, .8, k => { const a = a0 + k * 3; s.position.set(p.x + Math.cos(a) * r0, p.y + .1 + k * hh * (.6 + hash(i, 11) * .5), p.z + Math.sin(a) * r0); s.material.opacity = Math.sin(k * PI); }, { delay: i * .05 }); } };
    F.charge = (pos, o = {}) => { const p = V3(pos), c = o.c || '#c8a0ff', life = o.life || 1, rr = o.r || 1, n = Math.round(life * 14); for (let i = 0; i < n; i++) { const s = spr(i % 2 ? TX.glint() : TX.dot(), i % 3 ? c : '#ffffff', .14), a = hash(i, 12) * PI * 2, e = (hash(i, 13) - .3) * 1.6, d = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e) + .3, Math.sin(a) * Math.cos(e)).multiplyScalar(rr);
      add(s, .45, k => { s.position.copy(p).addScaledVector(d, 1 - ease(k)); s.material.opacity = Math.min(1, k * 3); const z = .2 - k * .1; s.scale.set(z, z, 1); }, { delay: i / n * life }); } };
    // 弾と光の尾
    F.shot = (from, to, o = {}) => { const a = V3(from), b = V3(to), c = o.c || '#ffe060', s = o.s || 1, len = a.distanceTo(b), life = Math.max(.05, len / (o.speed || 28)), g = new THREE.Group(), head = spr(TX.ball(), '#ffffff', .16 * s), G = R.geo(), L = 1.1 * s, w = .07 * s;
      G.quad([-w, 0, -L], [w, 0, -L], [w, 0, 0], [-w, 0, 0], [0, 0, 1, 1]); G.quad([0, -w, -L], [0, w, -L], [0, w, 0], [0, -w, 0], [0, 0, 1, 1]); const tx = TX.streak(), tail = new THREE.Mesh(G.build(), bmat(tx, c)); tail.userData.ownGeo = true;
      { const uv = tail.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v, u); } }
      const halo = spr(TX.ball(), c, .34 * s); g.add(tail, halo, head); g.position.copy(a); g.lookAt(b); add(g, life, k => { g.position.lerpVectors(a, b, k); }, { done: () => { if (o.spark !== false) F.spark(b, { c, s: s * .9, n: 6 }); if (o.onHit) o.onHit(); } }); return life; };
    // ---- 魔法 3 種 ----
    F.fire = (pos, o = {}) => { const p = V3(pos), s = o.s || 1, c = o.c || '#ffffff'; F.ring(p, { c: '#ff9a40', s: .7 * s, life: .5 });
      for (let i = 0; i < 9; i++) { const f = spr(TX.flame(i % 3), c, .5 * s), ox = (hash(i, 14) - .5) * .7 * s, oz = (hash(i, 15) - .5) * .5 * s, big = i < 3 ? 1.5 : 1; f.center.set(.5, 0); let fr = i;
        add(f, .55 + hash(i, 16) * .25, (k, dt, age) => { const nf = (i + Math.floor(age * 12)) % 3; if (nf !== fr) { fr = nf; f.material.map = TX.flame(nf); } const z = (.35 + Math.sin(Math.min(1, k * 1.6) * PI * .6) * .7) * s * big; f.scale.set(z * .75, z * (1 + k * .6), 1); f.position.set(p.x + ox, p.y + k * .7 * s, p.z + oz); f.material.opacity = k > .7 ? (1 - k) / .3 : 1; }, { delay: i * .07 }); }
      burst(p.clone().setY(p.y + .3), TX.dot(), '#ffb040', 10, { speed: 1.6 * s, up: 1.4, upR: 1.5, grav: 1, life: .9, size: .09 * s, delay: .15 }); };
    F.ice = (pos, o = {}) => { const p = V3(pos), s = o.s || 1, c = o.c || '#8adcff', t = TX.ice(c), g = new THREE.Group(), sp = []; F.ring(p, { c, s: .7 * s, life: .5 });
      for (let i = 0; i < 6; i++) { const G = R.geo(), hh = (i ? .7 + hash(i, 17) * .5 : 1.5) * s, r = (i ? .12 : .2) * s, a = i / 5 * PI * 2 + .4, d = i ? .34 * s : 0; G.loft(4, [[0, r, r, 0, .8], [hh * .55, r * .8, r * .8, .6, 1], [hh, .004, .004, 1, 1.2]], {}); const m = G.mesh(R.mat(t, { glow: true })); m.userData.ownGeo = true; m.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); m.rotation.set(Math.sin(a) * d * .9, i, -Math.cos(a) * d * .9); m.scale.y = .01; m.userData.del = i ? .04 + i * .03 : 0; g.add(m); sp.push(m); }
      g.position.copy(p); let broke = false;
      add(g, .95, (k, dt, age) => { for (const m of sp) { const u = cl((age - m.userData.del) / .1); m.scale.y = Math.max(.01, ease(u) * (1 + Math.sin(u * PI) * .25)); } if (k > .72 && !broke) { broke = true; g.visible = false; burst(p.clone().setY(p.y + .6 * s), TX.shard(), c, 12, { speed: 2.6 * s, up: .6, upR: 1.4, size: .2 * s, life: .55, spin: 6, floor: p.y + .05 }); burst(p.clone().setY(p.y + .8 * s), TX.glint(), '#ffffff', 5, { speed: 1.2 * s, grav: 0, size: .22 * s, life: .4 }); } if (broke) g.visible = false; });
      burst(p.clone().setY(p.y + .2), TX.glint(), '#ffffff', 5, { speed: 1.5 * s, grav: 0, up: 1, size: .18 * s, life: .35 }); };
    F.bolt = (pos, o = {}) => { const p = V3(pos), s = o.s || 1, c = o.c || '#fff4a0', hh = o.h || 9, g = new THREE.Group(), tx = TX.bolt();
      const zig = (x0, y0, x1, y1, n, w, seed) => { const G = R.geo(); let px = x0, py = y0; for (let i = 1; i <= n; i++) { const k = i / n, nx = x0 + (x1 - x0) * k + (i < n ? (hash(i, seed, 20) - .5) * 1.3 * s : 0), ny = y0 + (y1 - y0) * k, dx = nx - px, dy = ny - py, l = Math.hypot(dx, dy) || 1, ox = -dy / l * w, oy = dx / l * w; G.quad([px - ox, py - oy, 0], [px + ox, py + oy, 0], [nx + ox, ny + oy, 0], [nx - ox, ny - oy, 0], [0, 0, 1, 1]); px = nx; py = ny; } const m = new THREE.Mesh(G.build(), bmat(tx, c)); m.userData.ownGeo = true; return m; };
      const A = zig((hash(1, 21) - .5) * 2, hh, 0, 0, 9, .22 * s, 1), A2 = zig((hash(2, 21) - .5) * 2, hh, 0, 0, 8, .16 * s, 5), Br = zig(.3, hh * .45, 1.6 * s, hh * .12, 4, .1 * s, 9), Br2 = zig(-.2, hh * .62, -1.5 * s, hh * .3, 4, .09 * s, 13); g.add(A, A2, Br, Br2); g.position.copy(p);
      add(g, .42, (k, dt, age) => { if (cam) g.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z); const f = Math.floor(age * 30); A.visible = f % 3 !== 1; A2.visible = f % 3 === 1 || k < .2; Br.visible = f % 2 === 0; Br2.visible = f % 2 === 1; for (const m of [A, A2, Br, Br2]) m.material.opacity = k > .6 ? (1 - k) / .4 : 1; });
      const fl = spr(TX.puff(), c, 1); fl.position.copy(p).setY(p.y + .5 * s); add(fl, .3, k => { const z = (1 + k * 2) * s; fl.scale.set(z, z, 1); fl.material.opacity = (1 - k) * .8; });
      F.ring(p, { c, s: 1.1 * s, life: .4 }); burst(p.clone().setY(p.y + .2), TX.dot(), c, 12, { speed: 4 * s, up: .5, upR: 1.2, size: .12 * s, life: .45, floor: p.y + .03 }); };
    return F; };

  // ================= 4. 武器 =================
  // テクスチャ 1 枚（64×32）：刃（0,0,16,32）・木のえ（16,0,8,32）・鉄（24,0,16,16）・金（24,16,8,8）・光る玉（32,16,8,8）・つる（40,16,8,8）・たての面（40,0,24,16）・かわ（48,16,16,16）
  const wtex = (c, c2, gem) => etex('weapon', { c, c2, gem }, () => { const P = Px(64, 32), M = ramp(c, 6, { contrast: 1.1 }), Wd = ramp(c2), Go = ramp('#e8b840'), Ir = ramp('#5a6078'), Le = ramp('#8a5a3a'); P.clip = true;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) P.set(x, y, x === 0 || x === 15 ? '#ffffff' : x === 7 || x === 8 ? tone(M, 1) : x < 7 ? tone(M, 4 + (((x + y) % 9) === 0 ? 1 : 0)) : tone(M, 3 - (((x * 2 + y) % 11) === 0 ? 1 : 0)));
    P.line(3, 20, 5, 24, tone(M, 1)); P.line(11, 6, 12, 10, tone(M, 5)); P.rect(1, 12, 1, 2, tone(M, 1)); P.rect(14, 25, 1, 2, tone(M, 1));
    for (let y = 0; y < 32; y++) for (let x = 16; x < 24; x++) P.set(x, y, (y % 8) < 2 ? tone(Le, y % 8 ? 2 : 4) : tone(Wd, 3 + (x < 18 ? 1 : x > 21 ? -1 : 0) - (((x + y * 3) % 7) === 0 ? 1 : 0)));
    for (let y = 0; y < 16; y++) for (let x = 24; x < 40; x++) { const ex = (x - 24) % 8, ey = y % 8; P.set(x, y, ex === 0 || ey === 0 ? Ir[0] : ex === 1 || ey === 1 ? tone(Ir, 5) : (ex === 3 && ey === 3) ? '#e8ecf4' : tone(Ir, 3 - (ex > 5 ? 1 : 0))); }
    for (let y = 16; y < 24; y++) for (let x = 24; x < 32; x++) P.set(x, y, y === 16 ? tone(Go, 5) : y === 23 ? tone(Go, 1) : ((x + y) % 4 === 0) ? tone(Go, 4) : tone(Go, 3));
    for (let y = 16; y < 24; y++) for (let x = 32; x < 40; x++) { const d = Math.hypot(x - 35.5, y - 19.5); P.set(x, y, d < 1.5 ? '#ffffff' : d < 3 ? mix(gem, '#ffffff', .4) : gem); }
    P.rect(40, 16, 8, 8, '#e8e0c8'); for (let y = 16; y < 24; y += 2) P.rect(40, y, 8, 1, '#a89878');
    for (let y = 0; y < 16; y++) for (let x = 40; x < 64; x++) { const dx = Math.abs(x - 51.5), dy = Math.abs(y - 7.5); P.set(x, y, dx > 10.5 || dy > 6.5 ? tone(Go, dx > 10.5 && y > 8 ? 2 : 4) : dx < 1.5 || dy < 1 ? tone(Go, 3) : dx + dy * 1.4 < 6 ? '#f4ecd8' : tone(M, (x + y) & 8 ? 3 : 2)); }
    for (const [x, y] of [[41, 1], [62, 1], [41, 14], [62, 14], [51, 7]]) { P.set(x, y, '#ffffff'); P.set(x, y + 1 > 15 ? 15 : y + 1, tone(Go, 1)); }
    for (let y = 16; y < 32; y++) for (let x = 48; x < 64; x++) P.set(x, y, (y % 4 === 0) ? tone(Le, 1) : ((x * 3 + y) % 6 === 0) ? tone(Le, 4) : tone(Le, 3));
    for (let y = 24; y < 32; y++) for (let x = 24; x < 48; x++) P.set(x, y, tone(Ir, ((x >> 1) & 1) ? 2 : 3)); return P; });
  B.weapon = (kind, o = {}) => { const c = o.c || '#c8d0e0', c2 = o.c2 || '#7a5234', gem = o.gem || '#7af0ff', t = wtex(c, c2, gem), W = 64, Hh = 32, G = R.geo().smooth(0), Gg = R.geo(), s = o.s || 1;
    const BLADE = () => G.px(0, 0, 16, 32, W, Hh), WOOD = () => G.px(16, 0, 8, 32, W, Hh), IRON = () => G.px(24, 0, 16, 16, W, Hh), GOLD = () => G.px(24, 16, 8, 8, W, Hh), LEA = () => G.px(48, 16, 16, 16, W, Hh), X90 = TR(0, 0, 0, 0, PI / 2, 0);
    let rx = PI / 2 + .25, hand = 'R', ry = 0, rz = 0, yy = 0;
    if (kind === 'greatsword') { WOOD().loft(5, [[-.3, .028, .028, 0, .8], [.02, .03, .03, .4, 1]], { cap: 'bot' }); GOLD().loft(4, [[-.34, .001, .001, 0], [-.3, .05, .05, .5], [-.27, .03, .03, 1]], {}).loft(4, [[.0, .2, .05, 0, .9], [.06, .24, .04, .6, 1], [.09, .1, .03, 1, 1.05]], { cap: 'both', rot: 0 });
      BLADE().loft(4, [[.07, .1, .022, 0, .9], [.3, .115, .026, .22, 1], [1.12, .1, .02, .86, 1.05], [1.36, .003, .003, 1, 1.15]], { rot: 0 }); rx = PI / 2 - .2; }
    else if (kind === 'axe') { WOOD().loft(5, [[-.3, .024, .024, 0, .8], [.72, .022, .022, 1, 1]], { cap: 'both' }); for (const sx of [-1, 1]) BLADE().at(TR(0, .58, 0, 0, 0, -sx * PI / 2)).loft(4, [[.02, .07, .03, 0, .85], [.12, .1, .025, .4, 1], [.26, .24, .006, 1, 1.15]], { rot: 0, cap: 'top' }); G.at(null); GOLD().loft(4, [[.5, .04, .04, 0], [.68, .04, .04, 1]], {}).loft(4, [[.72, .03, .03, 0], [.82, .003, .003, 1]], {}); rx = PI / 2 - .1; }
    else if (kind === 'gun' || kind === 'rifle') { const L = kind === 'rifle' ? .62 : .24; LEA().at(TR(0, -.01, .02, 0, PI / 2 - .25, 0)).loft(4, [[0, .024, .034, 0, .9], [.13, .022, .03, 1, .8]], { cap: 'top', rot: 0 }).at(null);
      IRON().loft(4, [[-.07, .036, .058, 0, .85], [.12, .036, .058, 1, 1]], { cap: 'both', rot: 0 }).loft(6, [[.12, .027, .027, 0, .9], [.12 + L, .024, .024, 1, 1]], { cap: 'top' }).loft(6, [[.1 + L, .034, .034, 0, 1], [.14 + L, .034, .034, 1, 1.05]], { cap: 'both' });
      GOLD().loft(4, [[.0, .012, .05, 0], [.06, .012, .05, 1]], { rot: 0, cap: 'both' }); if (kind === 'rifle') { WOOD().at(TR(0, -.07, 0, 0, Math.PI - .12, 0)).loft(4, [[0, .024, .04, 0, .9], [.3, .028, .065, 1, .8]], { cap: 'top', rot: 0 }).at(null).loft(4, [[.12, .024, .03, 0, .9, 0, .03], [.4, .02, .024, 1, 1, 0, .03]], { rot: 0 }); IRON().loft(5, [[.2, .014, .014, 0, 1, 0, -.045], [.36, .014, .014, 1, 1, 0, -.045]], { cap: 'both' }); }
      Gg.px(32, 16, 8, 8, W, Hh).loft(4, [[.145 + L, .012, .012, 0], [.15 + L, .012, .012, 1]], { cap: 'top' }); rx = PI / 2 + .1; }
    else if (kind === 'bow') { const n = 7; WOOD(); for (let i = 0; i < n; i++) { const a0 = -1.05 + 2.1 * i / n, a1 = -1.05 + 2.1 * (i + 1) / n, pt = a => [0, Math.sin(a) * .62, Math.cos(a) * .5 - .5], w0 = .012 + .02 * Math.cos(a0), w1 = .012 + .02 * Math.cos(a1), p0 = pt(a0), p1 = pt(a1);
        for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const q = (p, w, ddx, ddz) => [p[0] + ddx * w, p[1], p[2] + ddz * w], e2 = [-dz, dx]; G.quad(q(p0, w0, dx - e2[0], dz - e2[1]), q(p0, w0, dx + e2[0], dz + e2[1]), q(p1, w1, dx + e2[0], dz + e2[1]), q(p1, w1, dx - e2[0], dz - e2[1]), [0, i / n, 1, (i + 1) / n], .8 + (dx > 0 ? .25 : dz > 0 ? .15 : 0)); } }
      LEA().loft(5, [[-.08, .028, .03, 0], [.08, .028, .03, 1]], {}); GOLD().at(TR(0, .54, -.25, 0, .5, 0)).loft(4, [[0, .02, .02, 0], [.08, .004, .004, 1]], {}).at(TR(0, -.54, -.25, 0, Math.PI - .5, 0)).loft(4, [[0, .02, .02, 0], [.08, .004, .004, 1]], {}).at(null);
      G.px(40, 16, 8, 8, W, Hh).quad([-.004, -.54, -.25], [.004, -.54, -.25], [.004, .54, -.25], [-.004, .54, -.25]).quad([0, -.54, -.254], [0, -.54, -.246], [0, .54, -.246], [0, .54, -.254]); rx = 0; hand = 'L'; }
    else if (kind === 'shield') { G.px(40, 0, 24, 16, W, Hh).at(X90).loft(6, [[0, .3, .36, 0, .8], [.05, .27, .33, .3, 1]], { cap: 'top', capRect: true, rot: 0 }); IRON().at(TR(0, 0, 0, 0, -PI / 2, 0)).loft(6, [[0, .3, .36, 0, .7], [.012, .3, .36, 1, .7]], { cap: 'top', rot: 0 }).at(null); rx = 0; ry = PI / 2; hand = 'L'; yy = .1; }
    else { WOOD().loft(5, [[-.12, .016, .016, 0, .85], [.3, .014, .014, .6, 1]], { cap: 'bot' }); GOLD().loft(4, [[.28, .03, .03, 0], [.33, .02, .02, 1]], {}); for (const sx of [-1, 1]) GOLD().at(TR(sx * .02, .33, 0, 0, 0, -sx * .7)).loft(3, [[0, .014, .014, 0], [.1, .003, .003, 1]], {}); G.at(null); Gg.px(32, 16, 8, 8, W, Hh).loft(4, [[.33, .003, .003, 0], [.38, .04, .04, .5], [.44, .003, .003, 1]], {}); rx = PI / 2 - .5; }
    const g = new THREE.Group(); g.add(G.mesh(R.mat(t, { vc: true, smooth: false, side: true }))); if (Gg.count()) g.add(Gg.mesh(R.mat(t, { glow: true }))); g.scale.setScalar(s); g.userData = { kind, rx, ry, rz, hand, y: yy, dyn: true, tip: kind === 'gun' ? .4 : kind === 'rifle' ? .78 : kind === 'greatsword' ? 1.36 : kind === 'axe' ? .8 : .44 }; return g; };
  // 人の手に付ける（前うでの関節の子）。にぎる位置は 手のまん中
  B.arm = (person, w, o = {}) => { const J = person.userData.J, D = person.userData.build || {}, hand = o.hand || w.userData.hand || 'R', fore = J['fore' + hand], y0 = D.farm ? -(D.farm + D.hand[2] * .5) : -.25; w.position.set(0, y0 + (o.y ?? w.userData.y ?? 0), 0); w.rotation.set(o.rx ?? w.userData.rx ?? PI / 2, o.ry ?? w.userData.ry ?? 0, o.rz ?? w.userData.rz ?? 0); fore.add(w); return w; };
  return B;
};
