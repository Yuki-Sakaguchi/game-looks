// 第 15 集の見本の場面「見下ろしの RPG の村」。pix2d.js のあとに読み、VILLAGE(PIX2D({ machine })) で動かす。
// 同じ村を、機械の決まり（色の数・画面の大きさ・仕上げ）だけ変えて出す。地面・家・木・人は、素材と明るさの段で手で打ち、色は部品集にまかせる。
// ファミコンふう（古い 8 ビット機）は、タイルのくり返し・平らな色・マス目にそろう木・いつも足ぶみする人・追いかけない（ぴったり付いてくる）画面で、もっと古く見せる。
// 主人公が村をひとまわりし、井戸のそばの長老と、桟橋の つり人に話しかける。ほかに、広場を歩く人、走る子、畑の人、ちょうちょう、えんとつのけむり、水のきらめき。
window.VILLAGE = P => {
  const { hash } = P, OLD = P.machine === 'fc', TS = 16, MW = 32, MH = 24, PW = MW * TS, PH = MH * TS, M = P.machine, ctx = P.ctx;
  // ---- 地図（ピクセルの座標で、道・広場・池・畑の はんいを決める） ----
  const POND = { x: 408, y: 86, rx: 66, ry: 48 };
  const inPond = (x, y, k = 1) => ((x - POND.x) / (POND.rx * k)) ** 2 + ((y - POND.y) / (POND.ry * k)) ** 2 < 1;
  const PATHS = [[32, 176, 480, 192], [240, 40, 256, 352], [96, 104, 112, 176], [192, 104, 208, 176], [96, 296, 112, 352], [368, 296, 384, 344], [256, 88, 344, 104], [112, 344, 368, 352]];
  const PLAZA = [208, 144, 304, 224], FIELD = [400, 264, 480, 336];
  const onPath = (x, y) => PATHS.some(([a, b, c, d]) => x >= a && x < c && y >= b && y < d);
  const onPlaza = (x, y) => x >= PLAZA[0] && x < PLAZA[2] && y >= PLAZA[1] && y < PLAZA[3];
  const onField = (x, y) => x >= FIELD[0] && x < FIELD[2] && y >= FIELD[1] && y < FIELD[3];
  const forest = (x, y) => { const tx = x / TS, ty = y / TS, e = Math.min(tx, ty, MW - tx, MH - ty) - hash(Math.floor(tx), Math.floor(ty), 3) * 1.2; return e < 1.6; };

  // ---- 地面（4 コマ。水のきらめきだけ変わる） ----
  function paintGround(fr) { const S = P.surface(PW, PH);
    S.each((x, y) => { const cx = x >> 3, cy = y >> 3, h1 = hash(cx, cy, 1);
      if (inPond(x, y)) { const sh = !inPond(x, y, .86), ring = !inPond(x, y, .97);
        if (ring) return ['stone', (x + y) % 5 ? 2 : 1]; if (sh) return ['water', 1];
        const wv = (y + Math.floor(Math.sin(x * .09 + fr * 1.57) * 2)) % 7, gl = wv === 0 && hash(x >> 2, y, fr) < .5; return ['water', gl ? 3 : (y + (x >> 3)) % 11 === 0 ? 1 : 2]; }
      if (onPlaza(x, y)) { const bx = (x - PLAZA[0]) % 16, by = (y - PLAZA[1]) % 8, off = Math.floor((y - PLAZA[1]) / 8) % 2 ? 8 : 0, bx2 = (bx + off) % 16;
        if (by === 7 || bx2 === 15) return ['stone', 1]; if (by === 0 || bx2 === 0) return ['stone', 3]; return ['stone', hash(x >> 4, y >> 3, 9) < .2 ? 1 : 2]; }
      if (onField(x, y)) { const r = (y - FIELD[1]) % 12; if (r < 2) return ['dirt', 1]; if (r < 9) { const sp = (x - FIELD[0]) % 8; return sp === 3 || sp === 4 ? ['crop', r < 4 ? 3 : 2] : sp === 2 || sp === 5 ? ['crop', 1] : ['dirt', 2]; } return ['dirt', 2]; }
      if (onPath(x, y)) { const e = !onPath(x - 1, y) || !onPath(x + 1, y) || !onPath(x, y - 1) || !onPath(x, y + 1); if (e && hash(x, y, 5) < .55) return ['grass', 1];
        const pb = hash(x >> 1, y >> 1, 6); return ['path', pb < .05 ? 1 : pb > .96 ? 3 : 2]; }
      // 草：8×8 ごとに、草の束（光と かげ）と、ときどき花
      const lx = x & 7, ly = y & 7, tuft = h1 < .55, tx = 2 + Math.floor(hash(cx, cy, 2) * 4), ty = 2 + Math.floor(hash(cx, cy, 4) * 4);
      if (tuft && ((lx === tx && ly === ty) || (lx === tx - 1 && ly === ty + 1) || (lx === tx + 1 && ly === ty + 1))) return ['grass', 3];
      if (tuft && lx === tx && ly === ty + 1) return ['grass', 1];
      if (h1 > .93 && !forest(x, y)) { const fc = ['red', 'yellow', 'white'][Math.floor(hash(cx, cy, 8) * 3)]; if (lx === tx && ly === ty) return [fc, 2]; if (Math.abs(lx - tx) + Math.abs(ly - ty) === 1) return [fc, 3]; }
      return ['grass', forest(x, y) ? 1 : 2]; });
    // 桟橋の板
    for (let y = 88; y < 104; y++) for (let x = 340; x < 372; x++) S.set(x, y, 'wood', y === 88 || y === 103 ? 1 : (x % 6 === 0 ? 1 : y < 91 ? 3 : 2));
    return S.toCanvas(fr); }
  // ファミコンふう（古い 8 ビット機）：16×16 のタイルを くり返す。面は平らな 1 色に決まった小さな模様、さかいはマス目にそろう。池のふちも 8 ドットの段になる
  function paintGroundOld(fr) { const S = P.surface(PW, PH), cell = (x, y) => [(x >> 3) * 8 + 4, (y >> 3) * 8 + 4];
    S.each((x, y) => { const lx = x & 15, ly = y & 15, tx = x >> 4, ty = y >> 4, [bx, by] = cell(x, y);
      if (inPond(bx, by)) { const rim = !inPond(bx - 8, by) || !inPond(bx + 8, by) || !inPond(bx, by - 8) || !inPond(bx, by + 8), lx8 = x & 7, ly8 = y & 7;
        if (rim && ((!inPond(bx - 8, by) && lx8 === 0) || (!inPond(bx + 8, by) && lx8 === 7) || (!inPond(bx, by - 8) && ly8 === 0) || (!inPond(bx, by + 8) && ly8 === 7))) return ['outline', 0];
        const wx = (lx + (fr % 2) * 4) & 15; return ['water', (ly === 4 && wx > 2 && wx < 7) || (ly === 11 && wx > 9 && wx < 14) ? 3 : 2]; }
      if (onPlaza(x, y)) return ['stone', ly % 8 === 7 || (lx + (ly >> 3) * 8) % 16 === 15 ? 1 : 2];
      if (onField(x, y)) { const r = (y - FIELD[1]) % 12; return r < 3 ? ['dirt', 1] : ['crop', (x & 7) === 3 || (x & 7) === 4 ? 3 : 1]; }
      if (onPath(x, y)) return ['path', (lx === 3 && ly === 4) || (lx === 11 && ly === 9) || (lx === 6 && ly === 13) ? 2 : 3];
      if (hash(tx, ty, 21) < .07 && !forest(x, y)) { if (lx >= 6 && lx <= 8 && ly >= 6 && ly <= 8) return lx === 7 && ly === 7 ? ['yellow', 3] : (lx === 7 || ly === 7) ? ['red', 3] : ['grass', 2]; }
      if ((lx === 3 && ly === 5) || (lx === 4 && ly === 4) || (lx === 5 && ly === 5) || (lx === 11 && ly === 12) || (lx === 12 && ly === 11) || (lx === 13 && ly === 12)) return ['grass', 1];
      return ['grass', 2]; });
    for (let y = 88; y < 104; y++) for (let x = 336; x < 368; x++) S.set(x, y, 'wood', y === 88 || y === 103 || x % 8 === 0 ? 0 : 2);
    return S.toCanvas(fr); }
  const ground = [0, 1, 2, 3].map(OLD ? paintGroundOld : paintGround);

  // ---- 物（それぞれ 1 枚の絵にしておく） ----
  function tree(seed) { const S = P.surface(32, 40);
    S.rect(13, 26, 6, 12, 'trunk', 2); S.rect(13, 26, 2, 12, 'trunk', 3); S.rect(17, 26, 2, 12, 'trunk', 1); S.set(12, 37, 'trunk', 2); S.set(19, 37, 'trunk', 2);
    const blobs = [[16, 14, 14, 12], [9, 18, 8, 7], [23, 18, 8, 7], [16, 8, 10, 7]]; for (const [x, y, rx, ry] of blobs) S.disc(x, y, rx, ry, 'leaf', 1);
    for (const [x, y, rx, ry] of blobs) S.disc(x - 1, y - 2, rx - 2, ry - 2, 'leaf', 2);
    for (let i = 0; i < 9; i++) { const x = 6 + Math.floor(hash(i, seed, 1) * 18), y = 4 + Math.floor(hash(i, seed, 2) * 14); S.disc(x, y, 2.6, 1.8, 'leaf', 3); S.set(x + 1, y + 2, 'leaf', 1); }
    S.outline(); return S.toCanvas(seed); }
  function house(roofM, seed) { const S = P.surface(64, 64);
    // 屋根（かわらの段）
    for (let y = 4; y < 34; y++) { const inset = Math.max(0, 6 - Math.floor(y / 2)); for (let x = inset; x < 64 - inset; x++) { const row = Math.floor((y - 4) / 5), ry = (y - 4) % 5, sx = (x + (row % 2) * 4) % 8; S.set(x, y, roofM, ry === 4 ? 1 : sx === 0 ? 1 : ry === 0 ? 3 : y < 8 ? 3 : 2); } }
    S.rect(2, 34, 60, 2, roofM, 1);
    S.rect(46, 0, 8, 12, 'stone', 2); S.rect(46, 0, 8, 2, 'stone', 3); S.rect(52, 2, 2, 10, 'stone', 1);   // えんとつ
    // かべ・はしら・まど・とびら
    S.rect(4, 36, 56, 24, 'wall', 2); S.rect(4, 36, 56, 2, 'wall', 1); for (const x of [4, 22, 41, 58]) S.rect(x, 36, 2, 24, 'wood', x === 58 ? 1 : 2); S.rect(4, 47, 56, 2, 'wood', 1);
    for (const x of [9, 46]) { S.rect(x, 39, 10, 7, 'wood', 1); S.rect(x + 1, 40, 8, 5, 'water', 2); S.rect(x + 1, 40, 3, 2, 'water', 3); S.rect(x + 4, 40, 1, 5, 'wood', 2); }
    S.rect(26, 44, 12, 16, 'wood', 1); S.rect(27, 45, 10, 15, 'wood', 2); for (let y = 46; y < 60; y += 3) S.rect(27, y, 10, 1, 'wood', 1); S.set(35, 52, 'yellow', 3); S.rect(27, 45, 2, 15, 'wood', 3);
    S.rect(2, 60, 60, 2, 'stone', 1); for (let i = 0; i < 5; i++) S.disc(8 + i * 12, 62, 2, 1, 'grass', 3);   // 土台と草
    // 花の はこ
    for (const x of [9, 46]) { S.rect(x, 46, 10, 2, 'wood', 1); for (let k = 0; k < 4; k++) S.set(x + 1 + k * 2, 45, k % 2 ? 'red' : 'yellow', 3); }
    S.outline(); return S.toCanvas(seed); }
  function well() { const S = P.surface(28, 32); S.rect(4, 4, 2, 16, 'wood', 2); S.rect(22, 4, 2, 16, 'wood', 1); for (let y = 0; y < 6; y++) S.rect(2 + y, y, 24 - y * 2, 1, 'roofB', y < 2 ? 3 : 2);
    S.disc(14, 22, 11, 7, 'stone', 2); S.disc(14, 20, 11, 4, 'stone', 3); S.disc(14, 20, 7, 2.5, 'water', 1); for (let x = 4; x < 25; x += 4) S.set(x, 24, 'stone', 1); S.rect(13, 6, 2, 10, 'wood', 3); S.rect(12, 14, 4, 3, 'wood', 1); S.outline(); return S.toCanvas(2); }
  function sign() { const S = P.surface(16, 18); S.rect(7, 8, 2, 10, 'wood', 1); S.rect(1, 1, 14, 8, 'wood', 2); S.rect(1, 1, 14, 2, 'wood', 3); for (const y of [4, 6]) S.rect(3, y, 10, 1, 'ink', 1); S.outline(); return S.toCanvas(3); }
  function fence(vert) { const S = P.surface(16, 16); if (vert) { S.rect(6, 0, 4, 16, 'wood', 2); S.rect(6, 0, 1, 16, 'wood', 3); } else { for (const x of [1, 13]) { S.rect(x, 3, 2, 11, 'wood', 2); S.set(x, 3, 'wood', 3); } S.rect(0, 5, 16, 2, 'wood', 3); S.rect(0, 10, 16, 2, 'wood', 2); } S.outline(); return S.toCanvas(4); }
  // ファミコンふうの木と家：平らな色に黒いりんかく。決まった点だけで光を打つ
  function treeOld() { const S = P.surface(16, 18); S.disc(8, 7, 7.5, 7, 'leaf', 1); for (const [x, y] of [[4, 4], [5, 3], [9, 6], [10, 5], [6, 9], [11, 9]]) S.set(x, y, 'leaf', 2); S.rect(7, 13, 3, 4, 'trunk', 2); S.outline(); return S.toCanvas(1); }
  function houseOld(roofM) { const S = P.surface(64, 56); for (let y = 6; y < 28; y++) { const ins = Math.max(0, 8 - y); S.rect(ins, y, 64 - ins * 2, 1, roofM, (y - 6) % 4 === 3 ? 1 : 2); }
    S.rect(44, 0, 8, 10, 'stone', 2); S.rect(4, 28, 56, 26, 'wall', 3); S.rect(26, 36, 12, 18, 'wood', 1); S.set(35, 45, 'yellow', 3);
    for (const x of [9, 45]) { S.rect(x, 33, 10, 9, 'outline', 0); S.rect(x + 1, 34, 8, 7, 'water', 3); S.rect(x + 4, 34, 1, 7, 'outline', 0); S.rect(x + 1, 37, 8, 1, 'outline', 0); }
    S.outline(); return S.toCanvas(1); }
  const TREE = OLD ? [treeOld(), treeOld(), treeOld()] : [tree(1), tree(2), tree(3)], HOUSE_R = OLD ? houseOld('roof') : house('roof', 1), HOUSE_B = OLD ? houseOld('roofB') : house('roofB', 2), WELL = well(), SIGN = sign(), FENCE = fence(false), FENCEV = fence(true);

  // ---- 物の置き場所（y でならべて描く。y は足もと） ----
  const things = [];
  const put = (img, x, y, base) => things.push({ img, x, y, base: y + (base ?? img.height) });
  { const d = OLD ? 8 : 0; put(HOUSE_R, 64, 40 + d); put(HOUSE_B, 160, 40 + d); put(HOUSE_B, 64, 232 + d); put(HOUSE_R, 336, 232 + d); }
  put(WELL, 276, 150); put(SIGN, 220, 194);
  for (let x = FIELD[0] - 8; x < FIELD[2] + 8; x += 16) { put(FENCE, x, FIELD[1] - 12); if (x < 440 || x > 452) put(FENCE, x, FIELD[3]); }
  for (let y = FIELD[1]; y < FIELD[3]; y += 16) { put(FENCEV, FIELD[0] - 12, y); put(FENCEV, FIELD[2] + 4, y); }
  const blocked = (x, y) => onPath(x, y) || onPlaza(x, y) || inPond(x, y, 1.25) || onField(x - 10, y) || onField(x + 10, y + 12) || (x > 52 && x < 236 && y > 30 && y < 112) || (x > 52 && x < 140 && y > 222 && y < 304) || (x > 324 && x < 412 && y > 222 && y < 304);
  if (OLD) { for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) { const x = tx * TS + 8, y = ty * TS + 8; if ((forest(x, y) || (hash(tx, ty, 14) < .05 && !blocked(x, y) && !blocked(x, y + 16))) && !onPath(x, y) && !inPond(x, y, 1.1)) put(TREE[0], tx * TS, ty * TS - 2, 18); } }   // 古い機械：木はマス目に 1 本ずつ
  else for (let ty = 0; ty < MH + 1; ty++) for (let tx = 0; tx < MW + 1; tx++) { const x = tx * TS + (hash(tx, ty, 11) - .5) * 8, y = ty * TS + 8 + (hash(tx, ty, 12) - .5) * 8;
    if ((forest(x, y) && hash(tx, ty, 13) < .85) || (!blocked(x, y) && hash(tx, ty, 14) < .045 && !blocked(x, y + 16))) put(TREE[Math.floor(hash(tx, ty, 15) * 3)], x - 16, y - 34, 36); }

  // ---- 人（16×16。下・上・横の 3 つの向きに、足のちがう 2 コマ） ----
  const BODY = ['...kcccCCccck...', '..kscccccccsk...', '..kkcccccccckk..', '...kppppppppk...'];
  const DOWN = ['......kkkk......', '....kkhhhhkk....', '...khhhHHhhhk...', '..khhHHhhhhhhk..', '..khhhhhhhhhhk..', '..khsshhhhsshk..', '..kssssssssssk..', '..kssksssskssk..', '...kssssssssk...', '....kkSSSSkk....', ...BODY];
  const UP = ['......kkkk......', '....kkhhhhkk....', '...khhhHHhhhk...', '..khhHHhhhhhhk..', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..', '..khhhhhhhhhhk..', '...khhhhhhhhk...', '....kkSSSSkk....', ...BODY];
  const SIDE = ['......kkkkk.....', '....kkhhhhhk....', '...khhhHHhhhk...', '...khhhhhhHhhk..', '...khhhhhhhhhk..', '...khhhhhsssk...', '...khhhhssssk...', '...khhhssskssk..', '....khssssssk...', '.....kkSSSkk....', '....kccCCcck....', '....kcccccsk....', '....kkcccckk....', '....kppppppk....'];
  const LEGS = { d: [['....kpk..kpk....', '...kbbk..kbbk...'], ['...kpk....kpk...', '...kbk....kbbk..']], s: [['....kpk.kpk.....', '....kbbkkbbk....'], ['.....kppk.......', '.....kbbk.......']] };
  function person(cols) { const f = (rows, legs) => P.sprite([...rows, ...legs], cols); const d = [f(DOWN, LEGS.d[0]), f(DOWN, LEGS.d[1])], u = [f(UP, LEGS.d[0]), f(UP, LEGS.d[1])], r = [f(SIDE, LEGS.s[0]), f(SIDE, LEGS.s[1])]; return { d, u, r, l: r.map(P.flip) }; }
  const HERO = person({ hair: '#8a4a2a', cloth: '#d04838', pants: '#3a4a8a', boot: '#5a3a2a' });
  const mk = (cols, path, speed, op = {}) => ({ spr: person(cols), path, speed, u: op.u || 0, x: path[0][0], y: path[0][1], dir: op.dir || 'd', name: op.name, still: path.length === 1, ph: 0 });
  const NPCS = [
    mk({ hair: '#e8e8e8', cloth: '#7a5aa8', pants: '#4a3a6a', boot: '#3a2a2a', skin: '#f0c098' }, [[292, 186]], 0, { dir: 'l', name: 'ちょうろう' }),
    mk({ hair: '#3a3a3a', cloth: '#3c8a5a', pants: '#5a4a3a', boot: '#4a3a2a', skin: '#d8a070' }, [[378, 92]], 0, { dir: 'r', name: 'つりびと' }),
    mk({ hair: '#c8843a', cloth: '#e0a0b8', pants: '#8a5a7a', boot: '#6a4a3a' }, [[214, 150], [298, 150], [298, 218], [214, 218]], 26, { name: 'むらの ひと' }),
    mk({ hair: '#2a2a3a', cloth: '#f0c040', pants: '#3a6aa8', boot: '#a83a2a' }, [[120, 128], [232, 128], [232, 168], [120, 168]], 52),
    mk({ hair: '#5a3a1a', cloth: '#a8b8d8', pants: '#6a5a3a', boot: '#4a3a2a', skin: '#e0a878' }, [[412, 276], [468, 276], [468, 324], [412, 324]], 18),
  ];
  // ---- 主人公の道（止まって話す所つき） ----
  const TOUR = [[104, 124], [104, 184], [272, 186, { talk: 0, face: 'r', lines: 'よく きたのう たびのひと。\nこの いどの みずは\nむかしから かれたことが ないのじゃ。' }],
    [248, 184], [248, 96], [356, 96, { talk: 1, face: 'r', lines: 'しーっ… さかなが にげちまう。\nいけの ぬしは まだ だれも\nつりあげて いないんだ。' }], [248, 96], [248, 300], [392, 300], [392, 340], [120, 348], [104, 300], [104, 192], [104, 124]];
  const hero = { x: TOUR[0][0], y: TOUR[0][1], i: 1, dir: 'd', ph: 0, wait: 0, talk: null, shown: 0 };
  const SPEED = 46;
  function step(a, dt, sp) { const [tx, ty] = a.target, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy); if (d < .6) return true; const k = Math.min(1, sp * dt / d); a.x += dx * k; a.y += dy * k; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u'); a.ph += dt * sp / 7; return false; }

  // ---- 動く小物：ちょうちょう、けむり、雲のかげ（スーファミふうだけ） ----
  const BUTTER = [[150, 210], [330, 150], [420, 200]].map(([x, y], i) => ({ x, y, i }));
  const SMOKE = [[64 + 50, 40], [160 + 50, 40], [64 + 50, 232], [336 + 50, 232]];
  let camX = 0, camY = 0;
  P.loop((t, dt) => {
    // 主人公
    if (hero.wait > 0) { hero.wait -= dt; hero.shown += dt * 22; if (hero.wait <= 0) hero.talk = null; }
    else { const w = TOUR[hero.i]; hero.target = w; if (step(hero, dt, SPEED)) { const op = w[2]; hero.i = (hero.i + 1) % TOUR.length; if (op && op.talk !== undefined) { hero.wait = 5.2; hero.talk = op; hero.shown = 0; hero.dir = op.face; } } }
    for (const n of NPCS) { if (n.still) continue; n.target = n.path[(n.u + 1) % n.path.length]; if (step(n, dt, n.speed)) n.u = (n.u + 1) % n.path.length; }
    // カメラ（主人公を まん中に。地図の外は見せない。ドットにそろえる）
    const tx = Math.max(0, Math.min(PW - P.W, hero.x - P.W / 2)), ty = Math.max(0, Math.min(PH - P.H, hero.y - P.H / 2 - 8)); const ck = OLD ? 1 : Math.min(1, dt * 5); camX += (tx - camX) * ck; camY += (ty - camY) * ck; const cx = Math.round(camX), cy = Math.round(camY);
    ctx.drawImage(ground[OLD ? Math.floor(t * 2) % 2 : Math.floor(t * 3) % 4], -cx, -cy);
    // かげ（スーファミふうは半透明。ファミコン・ゲームボーイふうは無し）
    const list = things.map(o => ({ ...o, kind: 'thing' }));
    for (const a of [hero, ...NPCS]) list.push({ kind: 'char', a, base: a.y + 1 });
    list.sort((p, q) => p.base - q.base);
    if (M === 'sfc') { ctx.fillStyle = 'rgba(20,30,40,.28)'; for (const o of list) { if (o.kind === 'char') { ctx.beginPath(); ctx.ellipse(Math.round(o.a.x) - cx, Math.round(o.a.y) - cy, 6, 2.5, 0, 0, 7); ctx.fill(); } else if (o.img.width === 32) { ctx.beginPath(); ctx.ellipse(o.x + 18 - cx, o.base - 1 - cy, 13, 4, 0, 0, 7); ctx.fill(); } } }
    for (const o of list) { if (o.kind === 'thing') { if (o.x - cx > P.W || o.x + o.img.width - cx < 0 || o.y - cy > P.H || o.y + o.img.height - cy < 0) continue; ctx.drawImage(o.img, Math.round(o.x) - cx, Math.round(o.y) - cy); continue; }
      const a = o.a, still = a === hero ? hero.wait > 0 : a.still, fr = OLD ? Math.floor(t * 4 + a.x * .01) % 2 : still ? 0 : Math.floor(a.ph) % 2, img = a.spr ? a.spr[a.dir][fr] : HERO[a.dir][fr], bob = !OLD && !still && fr ? -1 : 0; ctx.drawImage(img, Math.round(a.x) - 8 - cx, Math.round(a.y) - 15 + bob - cy); }
    // けむり
    for (const [sx, sy] of SMOKE) for (let k = 0; k < 3; k++) { const f = ((t * .45 + k / 3 + sx * .01) % 1), x = sx + Math.sin(f * 6 + k) * 3 + f * 6 - cx, y = sy - f * 26 - cy, r = 2 + f * 4;
      if (M === 'sfc') { ctx.globalAlpha = .55 * (1 - f); ctx.fillStyle = '#f0f0f8'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      else if (f < .75) { ctx.fillStyle = M === 'gb' ? P.GB[3] : '#bcbcbc'; ctx.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), Math.round(r), Math.round(r)); ctx.fillStyle = M === 'gb' ? P.GB[2] : '#fcfcfc'; ctx.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), Math.max(1, Math.round(r / 2)), 1); } }
    // ちょうちょう
    if (!OLD) for (const b of BUTTER) { const x = b.x + Math.sin(t * .7 + b.i) * 30 - cx, y = b.y + Math.sin(t * 1.3 + b.i * 2) * 12 - cy, open = Math.floor(t * 8 + b.i) % 2;
      ctx.fillStyle = M === 'gb' ? P.GB[3] : M === 'fc' ? '#fcfcfc' : ['#f8f8f8', '#f8e070', '#f8a8c8'][b.i]; if (open) { ctx.fillRect(Math.round(x) - 2, Math.round(y), 2, 2); ctx.fillRect(Math.round(x) + 1, Math.round(y), 2, 2); } else ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 2); ctx.fillStyle = M === 'gb' ? P.GB[0] : '#202020'; ctx.fillRect(Math.round(x), Math.round(y), 1, 2); }
    // 雲のかげ（スーファミふう）
    if (M === 'sfc') { ctx.fillStyle = 'rgba(10,20,40,.13)'; for (let k = 0; k < 3; k++) { const x = ((t * 9 + k * 210) % (PW + 240)) - 120 - cx, y = 60 + k * 120 - cy; ctx.beginPath(); ctx.ellipse(x, y, 70, 26, 0, 0, 7); ctx.ellipse(x + 40, y + 10, 50, 20, 0, 0, 7); ctx.fill(); } }
    // 会話の窓
    if (hero.talk) { const nm = NPCS[hero.talk.talk].name, ln = M === 'gb' ? nm + '「' + hero.talk.lines.replace(/\n/g, '') + '」' : hero.talk.lines; P.talk(nm, ln, Math.floor(hero.shown)); }
    P.present(t);
  });
};
