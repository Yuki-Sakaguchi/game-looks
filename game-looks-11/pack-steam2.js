// game-looks-11 の追加の部品「蒸気と歯車の町」（46〜50 で使う）。../game-looks-7/kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), S = PACK_STEAM2(THREE, K, R);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。
//
// ■ 決まり：足もとが y=0、正面が +z、大きさは m。色は '#rrggbb'（1 色わたすと R.ramp で 6 段を作る）。
//   回る物（歯車・はずみ車）は作ったときに S.live に入る。毎コマ S.tick(t) を 1 回呼べば全部回る。動く部分は userData.dyn = true。
//
// ■ テクスチャ  S.tex.名前({ c, seed, m, … }) → THREE.Texture（同じ引数なら同じ物）
//   brass { c, rivets: true, band }   みがいた真ちゅうの板（ふちのリベット、ところどころの緑青、すじ）。c を鉄の色にすれば鉄板にもなる
//   gearFace { c, spokes: 6, hole }    歯車の面（128×128。抜き色つき）。外のふちが歯の先、まん中が軸
//   gauge { c }                        圧力計の文字盤（32×32。抜き色つき。真ちゅうの輪・クリーム色の面・赤い針）
//   glass { c, lit }                   ガラスの管・電球の中の光るすじ（16×32）
//
// ■ 形
//   S.gear({ r: 2, th: .35, pitch: .55, spokes: 6, c: '#c89a48', edge（側面の色）, speed: .2（rad/秒。負で逆回り）, phase }) → Group
//       歯車（軸は z。+z の面が正面）。userData = { teeth（歯の数）, wheel（回る Mesh）, speed, phase }。かみ合わせは  S.mesh(a, b)  で b の速さと位相を a に合わせる
//   S.engine({ h: 2, r: .5, c（胴の真ちゅう）, iron（台と煙突）, gear: true, gearR（横の歯車の半径）, speed, gauge: true }) → Group   たて型の小さな蒸気機関（ボイラー・煙突・圧力計・横の歯車）。userData.vent ＝ 煙突の口
//   S.lamp({ kind: 'wall'/'post'/'hang', h, c, glow（ガラスの色）, light: false, power, range }) → Group   真ちゅうのランプ（かご＋光る丸いガラス）。userData.lampPos
//   S.tube({ h: .5, r: .06, c: '#7af0c8' }) → Group   光る液の入ったガラスの管（真ちゅうの口金つき）
//
// ■ 毎コマ：S.tick(t)
window.PACK_STEAM2 = (THREE, K, R) => {
  const { hash, ramp, mix, tone } = R, PI = Math.PI, live = [], cache = new Map();
  const def = (name, fn, meta = {}) => (o = {}) => { const key = name + JSON.stringify(o); let t = cache.get(key); if (!t) { const P = fn(o); t = R.tex.from(P, { m: o.m || meta.m || 2, cut: meta.cut }); cache.set(key, t); } return t; };

  // ---- 真ちゅうの板（よこ 64 × たて 64。ふちにリベット、みがいたすじ、ところどころ緑青） ----
  const paintBrass = (o = {}) => { const P = R.Px(64), B = ramp(o.c || '#c89a48'), sd = o.seed || 0, G = ramp('#5aa088');
    P.each((x, y) => { const n = R.tn(x, y, 32, 4, 64, 64, sd) * .7 + R.tn(x, y, 8, 2, 64, 64, sd + 3) * .3; return n > .66 ? B[4] : n < .3 ? B[2] : B[3]; });
    for (let k = 0; k < 7; k++) { const y = Math.floor(hash(k, 1, sd) * 60) + 2, x = Math.floor(hash(k, 2, sd) * 64), l = 6 + Math.floor(hash(k, 3, sd) * 14); for (let i = 0; i < l; i++) P.set(x + i, y, B[5]); }   // みがいた光のすじ
    if (o.band !== false) for (const y of [0, 31]) { for (let x = 0; x < 64; x++) { P.set(x, y, B[1]); P.set(x, y + 1, B[4]); P.set(x, y + 2, B[3]); } }   // 板のつぎ目
    if (o.rivets !== false) for (const y of [5, 27, 37, 59]) for (let x = 4; x < 64; x += 8) { P.set(x, y, B[5]); P.set(x + 1, y, B[4]); P.set(x, y + 1, B[4]); P.set(x + 1, y + 1, B[1]); P.set(x + 2, y + 1, B[0]); P.set(x + 1, y + 2, B[0]); }
    for (let k = 0; k < 5; k++) { if (hash(k, 9, sd) > (o.patina ?? .6)) continue; const x = Math.floor(hash(k, 7, sd) * 60), y = Math.floor(hash(k, 8, sd) * 58); for (let j = 0; j < 4; j++) for (let i = 0; i < 3 + (j % 2); i++) if (hash(i, j, sd + k) > .35) P.set(x + i, y + j + 2, G[j < 2 ? 3 : 2]); }   // 緑青のしみ
    return P; };

  // ---- 歯車の面（128×128。中心からの距離で 歯・ふち・うで・軸 を打ち分ける。すきまは抜き） ----
  //   ふちは r=1（歯の先）、歯の根は root、ふちの内がわは rim、軸のまわりは hub。光は左上から
  const paintGear = (o = {}) => { const N = 128, P = R.Px(N), B = ramp(o.c || '#c89a48'), sd = o.seed || 0, ns = o.spokes ?? 6, root = o.root ?? .86, rim = o.rim ?? .7, hub = o.hub ?? .2, sw = o.sw ?? .07, hole = o.hole;
    const reg = new Int8Array(N * N);   // 0 抜き / 1 歯とふち / 2 うで / 3 軸のまわり / 4 軸の穴
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = (x + .5 - N / 2) / (N / 2), dy = (y + .5 - N / 2) / (N / 2), q = Math.hypot(dx, dy), a = Math.atan2(dy, dx); let r = 0;
      if (q < .07) r = 4; else if (q < hub) r = 3; else if (q < rim) { if (ns === 0 || hole === false) r = 2; else for (let k = 0; k < ns; k++) { const b = a - (k / ns) * 2 * PI, d = Math.abs(Math.sin(b)) * q; if (Math.cos(b) > 0 && d < sw + (rim - q) * .05) { r = 2; break; } } } else if (q <= 1.02) r = 1;
      reg[y * N + x] = r; }
    const g = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? 0 : reg[y * N + x];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = g(x, y); if (!r) continue; const dx = (x + .5 - N / 2) / (N / 2), dy = (y + .5 - N / 2) / (N / 2), q = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      let t = r === 2 ? 3 : r === 3 ? 4 : r === 4 ? 0 : 3; if (r === 1) { const grain = R.tn(a * 20 + 40, q * 30, 6, 4, 80, 64, sd); t = grain > .62 ? 4 : grain < .32 ? 2 : 3; if (q > root) t = 3; }
      if (r === 4) { P.set(x, y, q < .045 ? B[0] : B[1]); continue; }
      const up = g(x - 1, y - 1), dn = g(x + 1, y + 1), up2 = g(x - 2, y - 2), dn2 = g(x + 2, y + 2);
      if (up !== r && (up === 0 || up < r || r === 1)) t = 5; else if (dn !== r && (dn === 0 || dn < r || r === 1)) t = 0; else if (up2 !== r && up2 === 0) t = Math.min(5, t + 1); else if (dn2 !== r && dn2 === 0) t = 1;
      P.set(x, y, B[t]); }
    // ふちの溝（歯の根）と、ふちのリベット、軸のまわりのボルト
    for (let k = 0; k < 160; k++) { const a = k / 160 * 2 * PI; P.set(N / 2 + Math.cos(a) * root * N / 2 - .5, N / 2 + Math.sin(a) * root * N / 2 - .5, B[1]); P.set(N / 2 + Math.cos(a) * (rim + .03) * N / 2 - .5, N / 2 + Math.sin(a) * (rim + .03) * N / 2 - .5, B[2]); }
    const nr = o.rivets ?? 16; for (let k = 0; k < nr; k++) { const a = (k + .5) / nr * 2 * PI, cx = Math.round(N / 2 + Math.cos(a) * (rim + root) / 2 * N / 2), cy = Math.round(N / 2 + Math.sin(a) * (rim + root) / 2 * N / 2); P.set(cx - 1, cy - 1, B[5]); P.set(cx, cy - 1, B[4]); P.set(cx - 1, cy, B[4]); P.set(cx, cy, B[2]); P.set(cx + 1, cy, B[0]); P.set(cx, cy + 1, B[0]); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * 2 * PI + .3, cx = Math.round(N / 2 + Math.cos(a) * hub * .62 * N / 2), cy = Math.round(N / 2 + Math.sin(a) * hub * .62 * N / 2); P.rect(cx - 1, cy - 1, 3, 3, B[1]); P.set(cx - 1, cy - 1, B[5]); P.set(cx, cy, B[4]); }
    // 緑青と よごれを少し
    for (let k = 0; k < 6; k++) { const a = hash(k, 3, sd) * 2 * PI, q = rim + .04 + hash(k, 4, sd) * (root - rim - .08), cx = N / 2 + Math.cos(a) * q * N / 2, cy = N / 2 + Math.sin(a) * q * N / 2, GR = ramp(o.patinaC || '#5a9a84'); if (hash(k, 5, sd) > (o.patina ?? .5)) continue; for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if (hash(i, j, k + sd) > .4) P.set(cx + i, cy + j, GR[2 + (j === 0 ? 1 : 0)]); }
    return P; };

  // ---- 圧力計（32×32。抜き） ----
  const paintGauge = (o = {}) => { const P = R.Px(32), B = ramp(o.c || '#c89a48'), F = ramp('#efe4c8'), Rr = ramp('#c83a2a'); P.clip = true; P.fill(null);
    P.disc(16, 16, 15.5, B[1]); P.disc(16, 16, 14.5, B[3]); P.disc(15, 15, 13.5, B[4]); P.disc(16, 16, 12, B[1]); P.disc(16, 16, 11, F[3]); P.disc(15, 15, 9, F[4]);
    for (let k = 0; k <= 10; k++) { const a = PI * .8 + k / 10 * PI * 1.4, l = k % 5 === 0 ? 3 : 2; for (let i = 0; i < l; i++) P.set(16 + Math.cos(a) * (10 - i), 16 + Math.sin(a) * (10 - i), k > 7 ? Rr[2] : F[0]); }
    P.line(16, 16, 22, 10, Rr[2]); P.line(16, 17, 22, 11, Rr[1]); P.disc(16, 16, 1.6, B[1]); P.set(15, 15, B[5]); return P; };

  // ---- ガラスの中の光る液（16×32） ----
  const paintGlass = (o = {}) => { const P = R.Px(16, 32), Gc = ramp(o.c || '#7af0c8'); P.fill(Gc[3]); for (let y = 0; y < 32; y++) { P.set(2, y, Gc[5]); P.set(3, y, Gc[4]); P.set(13, y, Gc[2]); P.set(14, y, Gc[1]); }
    for (let k = 0; k < 6; k++) { const x = 5 + Math.floor(hash(k, 1) * 6), y = Math.floor(hash(k, 2) * 30); P.set(x, y, '#ffffff'); P.set(x + 1, y + 1, Gc[5]); } for (let x = 0; x < 16; x++) { P.set(x, 6, Gc[5]); P.set(x, 7, Gc[2]); } return P; };

  const tex = { brass: def('brass', paintBrass, { m: 2 }), gearFace: def('gear', paintGear, { m: 1, cut: true }), gauge: def('gauge', paintGauge, { m: 1, cut: true }), glass: def('glass', paintGlass, { m: 1 }) };

  // ================= 歯車 =================
  function gear(o = {}) { const r = o.r || 2, th = o.th ?? Math.max(.14, r * .14), pitch = o.pitch || Math.max(.3, r * .26), n = o.teeth || Math.max(8, Math.round(2 * PI * r / pitch)), td = Math.min(r * .14, pitch * .55), root = 1 - td / r;
    const ns = o.spokes ?? (r > 1.2 ? 6 : r > .5 ? 5 : 0), rim = o.rim ?? Math.max(root - .2, root - .5 / r * .6), hub = o.hub ?? (ns ? .22 : .3), sw = .07 + (r < 1 ? .04 : 0);
    const c = o.c || '#c89a48', face = tex.gearFace({ c, spokes: ns, root, rim, hub, sw, seed: o.seed || 0, patina: o.patina, rivets: Math.max(6, Math.round(r * 6)) }), edge = tex.brass({ c: o.edge || mix(c, '#3a3040', .25), rivets: false, band: false, patina: 0 });
    const B = R.parts(), Fc = B.g(face, { side: true }), Ed = B.g(edge, { side: true }), uv = (x, y) => [.5 + x / (2 * r), .5 + y / (2 * r)], hz = th / 2;
    // 外のふち（歯の形）。歯 1 つ = 根 → 先 → 先 → 根
    const out = []; for (let i = 0; i < n; i++) { const a = i / n * 2 * PI, s = 2 * PI / n; for (const [f, q] of [[0, root], [.12, 1], [.38, 1], [.5, root]]) out.push([Math.cos(a + f * s) * r * q, Math.sin(a + f * s) * r * q]); }
    for (const z of [hz, -hz]) for (let i = 0; i < out.length; i++) { const a = out[i], b = out[(i + 1) % out.length], A = [a[0], a[1], z], Bp = [b[0], b[1], z], C = [0, 0, z];
      if (z > 0) Fc.tri(A, Bp, C, uv(...a), uv(...b), [.5, .5], 1); else Fc.tri(Bp, A, C, uv(...b), uv(...a), [.5, .5], .8); }
    // 側面（歯の外がわ）
    let u = 0; for (let i = 0; i < out.length; i++) { const a = out[i], b = out[(i + 1) % out.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (a[0] + b[0]) / 2, ny = (a[1] + b[1]) / 2, sh = .75 + .3 * Math.max(0, (ny - nx * .3) / r);
      Ed.quad([a[0], a[1], hz], [b[0], b[1], hz], [b[0], b[1], -hz], [a[0], a[1], -hz], [u / 2, 0, (u + l) / 2, th / 2], sh); u += l; }
    // ふちの内がわ・軸のまわり・うでの側面（すきまから見える所）
    if (ns) { const ri = rim * r, rh = hub * r, m = 24; for (let k = 0; k < m; k++) { const a0 = k / m * 2 * PI, a1 = (k + 1) / m * 2 * PI, sh = .55 + .25 * Math.max(0, -Math.sin((a0 + a1) / 2));
        Ed.quad([Math.cos(a1) * ri, Math.sin(a1) * ri, hz], [Math.cos(a0) * ri, Math.sin(a0) * ri, hz], [Math.cos(a0) * ri, Math.sin(a0) * ri, -hz], [Math.cos(a1) * ri, Math.sin(a1) * ri, -hz], [0, 0, .3, th / 2], sh);
        Ed.quad([Math.cos(a0) * rh, Math.sin(a0) * rh, hz], [Math.cos(a1) * rh, Math.sin(a1) * rh, hz], [Math.cos(a1) * rh, Math.sin(a1) * rh, -hz], [Math.cos(a0) * rh, Math.sin(a0) * rh, -hz], [0, 0, .3, th / 2], .9); }
      for (let k = 0; k < ns; k++) { const a = k / ns * 2 * PI, ca = Math.cos(a), sa = Math.sin(a), w = sw * r; for (const s of [-1, 1]) { const p0 = [ca * rh - sa * w * s, sa * rh + ca * w * s], p1 = [ca * ri - sa * w * s, sa * ri + ca * w * s];
          Ed.quad([p0[0], p0[1], hz], [p1[0], p1[1], hz], [p1[0], p1[1], -hz], [p0[0], p0[1], -hz], [0, 0, (ri - rh) / 2, th / 2], s > 0 ? .7 : 1); } } }
    // 軸（前後に少し出る）
    B.g(tex.brass({ c: o.axle || '#5a5468', rivets: false, band: false, patina: 0 })).loft(8, [[-hz - .12, r * .07, r * .07, 0, .8], [hz + .12, r * .07, r * .07, 1, 1]], { cap: 'both' });
    const wheel = B.group();
    const g = new THREE.Group(); g.add(wheel); wheel.userData.dyn = true; g.userData = { teeth: n, wheel, speed: o.speed ?? .2, phase: o.phase || 0, r, dyn: true }; live.push(g); return g; }
  // b を a にかみ合わせる（速さは歯の数の比で逆回り。歯が半分ずれるよう位相を合わせる）。中心の向きは a→b の角度で計算する
  function meshGears(a, b) { const A = a.userData, Bd = b.userData; a.updateMatrixWorld(); b.updateMatrixWorld(); const pb = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld), inv = new THREE.Matrix4().copy(a.matrixWorld).invert(), d = pb.clone().applyMatrix4(inv), ang = Math.atan2(d.y, d.x);
    const sA = 2 * PI / A.teeth, sB = 2 * PI / Bd.teeth, fA = (A.phase + .25 * sA - ang) / sA; Bd.speed = -A.speed * A.teeth / Bd.teeth; Bd.phase = ang + PI - .25 * sB + sB * (.5 - fA); return b; }

  // ================= たて型の小さな蒸気機関 =================
  function engine(o = {}) { const h = o.h || 2, r = o.r || .5, B = R.parts(), Bo = B.g(tex.brass({ c: o.c || '#c89a48', seed: o.seed || 0, m: 1.5 })).smooth(1), Ir = B.g(tex.brass({ c: o.iron || '#4e5068', rivets: true, patina: 0, m: 1.5 })).smooth(1);
    Ir.loft(8, [[0, r * 1.25, r * 1.25, 0, .7], [h * .12, r * 1.2, r * 1.2, .2, .85]], { cap: 'top', ur: 3 });
    Bo.loft(10, [[h * .12, r, r, 0, .8], [h * .2, r * 1.04, r * 1.04, .1, .95], [h * .7, r * 1.04, r * 1.04, .8, 1.05], [h * .78, r, r, .9, 1], [h * .9, r * .7, r * .7, 1, 1.1], [h * .96, r * .3, r * .3, 1.1, 1.15]], { cap: 'top', ur: 3 });
    const cy0 = h * .9, cx = r * .25; Ir.smooth(0).loft(6, [[cy0, r * .16, r * .16, 0, .9, cx, -r * .2], [cy0 + h * .55, r * .14, r * .14, 2, 1, cx, -r * .2], [cy0 + h * .6, r * .22, r * .22, 2.2, 1.05, cx, -r * .2], [cy0 + h * .64, r * .22, r * .22, 2.4, .8, cx, -r * .2]], { ur: 1 });
    if (o.gauge !== false) { const gz = r * 1.05 + .02, gy = h * .58, gs = r * .38; B.g(tex.gauge({ c: o.c }), { side: true }).quad([-gs, gy - gs, gz], [gs, gy - gs, gz], [gs, gy + gs, gz], [-gs, gy + gs, gz]); }
    // 横のピストンの筒
    Ir.loft(6, [[h * .3, r * .18, r * .18, 0, .9, -r * 1.2, r * .2], [h * .62, r * .18, r * .18, 1, 1, -r * 1.2, r * .2]], { cap: 'top' });
    const g = B.group(); g.userData.vent = [cx, cy0 + h * .64, -r * .2];
    if (o.gear !== false) { const gr = o.gearR || r * .75, w = gear({ r: gr, th: Math.max(.08, gr * .2), c: o.gearC || o.c || '#c89a48', speed: o.speed ?? 1.2, spokes: 5 }); w.position.set(r * 1.05 + gr * .1 + .12, Math.max(h * .42, gr + .05), r * .35); w.rotation.y = PI / 2; g.add(w); g.userData.gear = w; }
    return g; }

  // ================= 真ちゅうのランプ =================
  function lamp(o = {}) { const kind = o.kind || 'wall', h = o.h ?? (kind === 'post' ? 3 : kind === 'hang' ? 0 : 2.2), B = R.parts(), M = B.g(tex.brass({ c: o.c || '#c89a48', rivets: false, m: 1 })).smooth(0), gl = o.glow || '#ffc868';
    let ly = h; if (kind === 'post') { M.smooth(1).loft(6, [[0, .18, .18, 0, .8], [.18, .13, .13, .2, 1], [.3, .06, .06, .4, 1], [h - .35, .05, .05, 3, 1], [h - .3, .1, .1, 3.2, 1.05]], { cap: 'top' }); ly = h - .1; }
    if (kind === 'wall') { M.box(.16, .3, .06, 0, h - .5, -.03); M.box(.05, .05, .36, 0, h - .3, .18); ly = h - .45; }
    if (kind === 'hang') { M.box(.03, .5, .03, 0, -.5, 0); ly = -.75; }
    const gz = kind === 'wall' ? .36 : 0;
    B.g(tex.glass({ c: gl }), { glow: true }).loft(6, [[ly - .14, .05, .05, 0, 1, 0, gz], [ly - .08, .13, .13, .3, 1, 0, gz], [ly + .08, .13, .13, .7, 1, 0, gz], [ly + .14, .06, .06, 1, 1, 0, gz]], { cap: 'both' });
    M.loft(6, [[ly + .13, .15, .15, 0, 1, 0, gz], [ly + .22, .05, .05, 1, 1.1, 0, gz]], { cap: 'top' }).loft(6, [[ly - .2, .05, .05, 0, .8, 0, gz], [ly - .14, .1, .1, .5, .9, 0, gz]], { cap: 'bot' });
    for (let k = 0; k < 4; k++) { const a = k / 4 * 2 * PI + PI / 4, x = Math.cos(a) * .15, z = Math.sin(a) * .15 + gz; M.box(.02, .3, .02, x, ly - .15, z); }   // かごの細い棒
    const g = B.group(); g.userData.lampPos = [0, ly, gz];
    if (o.light) { const L = new THREE.PointLight(gl, o.power || 8, o.range || 7, 1.6); L.position.set(0, ly, gz + .1); g.add(L); g.userData.light = L; }
    return g; }

  // ================= 光る液のガラス管 =================
  function tube(o = {}) { const h = o.h || .5, r = o.r || .06, B = R.parts(), M = B.g(tex.brass({ c: o.brass || '#c89a48', rivets: false, m: .5 })).smooth(1);
    B.g(tex.glass({ c: o.c || '#7af0c8' }), { glow: true }).smooth(1).loft(6, [[.06, r, r, 0, 1], [h - .06, r, r, 1, 1]], { ur: 1 });
    M.loft(6, [[0, r * 1.5, r * 1.5, 0, .8], [.07, r * 1.4, r * 1.4, .3, 1]], { cap: 'top' }).loft(6, [[h - .07, r * 1.3, r * 1.3, 0, 1], [h, r * 1.3, r * 1.3, .3, 1.1], [h + .03, r * .5, r * .5, .5, 1.1]], { cap: 'top' }); return B.group(); }

  function tick(t) { for (const g of live) { const u = g.userData; u.wheel.rotation.z = u.phase + t * u.speed; } }
  return { tex, paint: { brass: paintBrass, gear: paintGear, gauge: paintGauge, glass: paintGlass }, gear, mesh: meshGears, engine, lamp, tube, tick, live };
};
