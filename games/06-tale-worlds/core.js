// 「ものがたりの世界をめぐる」の土台。ワールドのファイル（worlds/*.js）は、ここの道具で 当たり判定・村人・入口 を足す。
// 主人公は第 13 集の pack-tale.js の人（ユウリ、4.5 頭身、流し前がみ）。歩く・走る・ジャンプ・村人と話す。
//
// ■ ワールドの書き方（worlds/xx.js）
//   TALE_WORLD('8-01', G => { … })  の中で、もとの場面と同じように scene に物を足し、次の道具で遊べるようにする。
//     G.THREE G.K G.R G.T G.TL G.scene G.cam G.renderer G.hash … いつもの道具
//     G.ground(H)                   地面の高さ H(x, z)（省くと 0）
//     G.solid(物, 形, o)            当たり判定。形 'box'（物の向きに合わせた箱。上に乗れる）/ 'wall'（箱だが上には乗れない：屋根の家・城）/ 'round'（円柱。o.r）/ 'trunk'（木の幹。r .35）/ 'none'
//                                   o = { pad（箱を少し小さく/大きく）, top（上の高さを決める）, r }。物はもう置いてある位置で測る
//     G.box(x, z, w, d, y0, y1, ry, wall) 見えない箱（かべ・段・台）。wall=true なら上に乗れない  G.circle(x, z, r, y0, y1)  見えない円柱
//     G.bounds(x0, x1, z0, z1)      歩ける はんい（外は見えないかべ）
//     G.npc(人, { name, lines: [ … ], face, wander, path, speed, r })   話せる人。lines は 1 回ごとに 1 つずつ進む文（配列の配列で、1 回の会話に何ページか）
//     G.sign(x, y, z, { name, lines })  話せる物（看板・碑など。見えない）
//     G.spawn(x, z, ry)             はじめの場所
//     G.tick(f)                     毎コマ f(t, dt, 主人公の位置)
//     G.crt(o)                      ブラウン管の引数（省くと { noise: 0 }）
window.TALE_WORLDS = window.TALE_WORLDS || {};
window.TALE_WORLD = (id, build) => { window.TALE_WORLDS[id] = build; };

window.TALE_GAME = (THREE, K, R, TL, MO, opts = {}) => {
  const $ = id => document.getElementById(id), q = new URLSearchParams(location.search), AUTO = !!q.get('auto');
  const { scene, cam, renderer, onResize } = K.stage({ fov: 50, far: 900, aa: false, fitAspect: .9, maxFov: 78 });
  const G = { THREE, K, R, T: R.tex, TL, MO, scene, cam, renderer, hash: K.hash };
  // ---- 当たり判定 ----
  const boxes = [], circles = [], npcs = [], ticks = []; let H = () => 0, BND = null, SPAWN = [0, 0, 0], crtO = { noise: 0 }, TOUR = null, tourI = 0;
  G.ground = f => { H = f; }; G.bounds = (x0, x1, z0, z1) => { BND = [x0, x1, z0, z1]; }; G.spawn = (x, z, ry = 0) => { SPAWN = [x, z, ry]; }; G.tick = f => ticks.push(f); G.tour = pts => { TOUR = pts; }; G.crt = o => { crtO = { noise: 0, ...o }; };   // G.tour: ?auto=1 で歩く道（[[x, z], …] をくり返す）
  G.box = (x, z, w, d, y0, y1, ry = 0, wall = false) => { boxes.push({ x, z, hx: w / 2, hz: d / 2, y0, y1, c: Math.cos(ry), s: Math.sin(ry), wall }); };
  G.circle = (x, z, r, y0 = -9, y1 = 99) => { circles.push({ x, z, r, y0, y1 }); };
  G.solid = (o, kind = 'box', op = {}) => { if (kind === 'none') return o; o.updateMatrixWorld(true); const p = new THREE.Vector3(), qu = new THREE.Quaternion(), sc = new THREE.Vector3(); o.matrixWorld.decompose(p, qu, sc); const ry = new THREE.Euler().setFromQuaternion(qu, 'YXZ').y;
    if (kind === 'trunk' || kind === 'round') { const bb = new THREE.Box3().setFromObject(o); G.circle(p.x, p.z, op.r ?? (kind === 'trunk' ? .35 : Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2 * (op.pad ?? .9)), bb.min.y - .1, op.top ?? bb.max.y); return o; }
    const ry0 = o.rotation.y; o.rotation.y = ry0 - ry; o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); o.rotation.y = ry0; o.updateMatrixWorld(true);   // 向きをもどして測る（物の向きの箱）
    const pad = op.pad ?? 0, cx = (bb.min.x + bb.max.x) / 2 - p.x, cz = (bb.min.z + bb.max.z) / 2 - p.z, c = Math.cos(ry), s = Math.sin(ry);
    boxes.push({ x: p.x + cx * c + cz * s, z: p.z - cx * s + cz * c, hx: Math.max(.05, (bb.max.x - bb.min.x) / 2 - pad), hz: Math.max(.05, (bb.max.z - bb.min.z) / 2 - pad), y0: bb.min.y - .1, y1: op.top ?? bb.max.y, c, s, wall: kind === 'wall' }); return o; };
  // 主人公の足もとの高さ（地面と、乗れる箱・円柱の上）。step 以内の段は のぼれる
  const local = (b, x, z) => { const dx = x - b.x, dz = z - b.z; return [dx * b.c - dz * b.s, dx * b.s + dz * b.c]; };
  function support(x, z, y, step) { let g = H(x, z); for (const b of boxes) { if (b.wall || b.y1 > y + step || b.y1 <= g) continue; const [lx, lz] = local(b, x, z); if (Math.abs(lx) < b.hx + .05 && Math.abs(lz) < b.hz + .05) g = b.y1; }
    for (const c of circles) { if (c.y1 > y + step || c.y1 <= g) continue; if (Math.hypot(x - c.x, z - c.z) < c.r) g = c.y1; } return g; }
  function push(P, y, ht, step, r) {   // よこに押し出す
    for (const b of boxes) { if (b.y1 <= y + step || b.y0 >= y + ht) continue; let [lx, lz] = local(b, P.x, P.z); const ox = b.hx + r - Math.abs(lx), oz = b.hz + r - Math.abs(lz); if (ox <= 0 || oz <= 0) continue;
      if (ox < oz) lx += Math.sign(lx || 1) * ox; else lz += Math.sign(lz || 1) * oz; P.x = b.x + lx * b.c + lz * b.s; P.z = b.z - lx * b.s + lz * b.c; }
    for (const c of circles) { if (c.y1 <= y + step || c.y0 >= y + ht) continue; const dx = P.x - c.x, dz = P.z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > 1e-4) { P.x = c.x + dx / d * m; P.z = c.z + dz / d * m; } }
    for (const n of npcs) { if (n.hidden) continue; const p = n.o.position, dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz), m = n.r + r; if (d < m && d > 1e-4 && Math.abs(p.y - y) < 1.2) { P.x = p.x + dx / d * m; P.z = p.z + dz / d * m; } }
    if (BND) { P.x = Math.max(BND[0], Math.min(BND[1], P.x)); P.z = Math.max(BND[2], Math.min(BND[3], P.z)); } }

  // ---- 村人と、話せる物 ----
  G.npc = (o, d = {}) => { const J = o.userData.J, n = { human: !!(J && J.armL && J.legL && J.hips), o, name: d.name || '', lines: d.lines || [['……']], k: 0, r: d.r ?? .32, wander: d.wander, path: d.path, speed: d.speed ?? 1.1, u: d.u ?? 0, home: o.position.clone(), ry0: o.rotation.y, talk: 0, idle: d.idle, head: d.head ?? (o.userData.height || 1.4), pose: d.pose };
    npcs.push(n); return n; };
  G.sign = (x, y, z, d = {}) => { const o = new THREE.Object3D(); o.position.set(x, y, z); scene.add(o); const n = G.npc(o, { r: 0, head: d.head ?? .6, ...d }); n.thing = true; n.hidden = true; return n; };

  // ---- 主人公 ----
  const hero = TL.person('hero'); scene.add(hero); const shadow = R.blob(.34); scene.add(shadow);
  const st = { x: 0, y: 0, z: 0, vy: 0, ry: 0, ground: true, speed: 0, ph: 0, air: 0, talking: null };
  // ---- ブラウン管と、窓を描く粗い絵 ----
  let crt = null; const hud = $('hud'), hx = hud.getContext('2d');
  // ---- 入力 ----
  const key = {}, joy = { x: 0, y: 0, on: false, run: false }, cam0 = { yaw: 0, pitch: .3, dist: 3.9, drag: 0 };
  addEventListener('keydown', e => { key[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'KeyZ') act(); if (e.code === 'Space' && !st.talking) jump(); if (e.code === 'KeyM' || e.code === 'Escape') menu(); });
  addEventListener('keyup', e => { key[e.code] = false; });
  { const cv = renderer.domElement, pts = new Map();
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); const left = e.pointerType === 'touch' && e.clientX < innerWidth * .45; pts.set(e.pointerId, { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, left }); if (left) { joy.on = true; joy.x = joy.y = 0; $('stick').style.display = 'block'; $('stick').style.left = e.clientX - 50 + 'px'; $('stick').style.top = e.clientY - 50 + 'px'; } });
    cv.addEventListener('pointermove', e => { const p = pts.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (p.left) { const ax = (p.x - p.x0) / 50, ay = (p.y - p.y0) / 50, m = Math.hypot(ax, ay), k = m > 1 ? 1 / m : 1; joy.x = ax * k; joy.y = ay * k; joy.run = m > .85; $('knob').style.transform = `translate(${joy.x * 32}px,${joy.y * 32}px)`; }
      else { cam0.yaw -= dx * .008; cam0.pitch = Math.max(.05, Math.min(.9, cam0.pitch + dy * .004)); cam0.drag = 2; } });
    const up = e => { const p = pts.get(e.pointerId); pts.delete(e.pointerId); if (p && p.left) { joy.on = false; joy.x = joy.y = 0; $('stick').style.display = 'none'; $('knob').style.transform = ''; } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); cam0.dist = Math.max(2.4, Math.min(8, cam0.dist * Math.exp(e.deltaY * .001))); }, { passive: false }); }
  const tap = (id, f) => { const b = $(id); if (b) b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); f(); }); };
  tap('bJump', () => st.talking ? act() : jump()); tap('bTalk', () => act()); tap('bRun', () => { joy.lock = !joy.lock; $('bRun').classList.toggle('on', joy.lock); }); tap('bMenu', () => menu());

  function jump() { if (st.ground && !st.talking) { st.vy = 5.6; st.ground = false; st.air = 0; } }
  // 話す：近くて前にいる人を選ぶ。話している間は、ボタンで次のページへ
  let near = null;
  function act() { if ($('menu').style.display === 'block') return; if (st.talking) { const n = st.talking, page = n.lines[n.k % n.lines.length]; if (typeof page === 'string' || st.page >= page.length - 1) { if (st.shown < st.full.length) { st.shown = st.full.length; return; } st.talking = null; n.k++; n.talk = 0; return; } if (st.shown < st.full.length) { st.shown = st.full.length; return; } st.page++; st.full = page[st.page]; st.shown = 0; return; }
    if (near) { st.talking = near; near.talk = 1; st.page = 0; const page = near.lines[near.k % near.lines.length]; st.full = typeof page === 'string' ? page : page[0]; st.shown = 0; } }

  // ---- ワールドの一覧と、えらぶ窓 ----
  function menu() { const m = $('menu'); if (m.style.display === 'block') { m.style.display = 'none'; return; } m.style.display = 'block'; }
  { const list = $('mlist'); for (const w of opts.list || []) { const a = document.createElement(w.ready ? 'a' : 'span'); a.className = 'w' + (w.ready ? '' : ' off') + (w.id === opts.id ? ' here' : ''); if (w.ready) a.href = '?w=' + w.id; a.innerHTML = `<b>${w.id}</b> ${w.name}${w.ready ? '' : '<small>じゅんび中</small>'}`; list.appendChild(a); } $('mclose').onclick = () => menu(); }

  // ---- 窓（吹き出し）：粗い絵の大きさの canvas に描き、ドットのまま引きのばす。灰色のグラデーションに、銀の 2 本線のふち、話す人へ向いた しっぽ ----
  function wrap(text, w, font) { hx.font = font; const out = []; for (const para of text.split('\n')) { let line = ''; for (const ch of para) { if (hx.measureText(line + ch).width > w && line) { out.push(line); line = ch; } else line += ch; } out.push(line); } return out; }
  function win(x, y, w, h, tail) { const g = hx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#9aa0ac'); g.addColorStop(.5, '#6c717e'); g.addColorStop(1, '#4a4e5a');
    const path = () => { hx.beginPath(); hx.moveTo(x + 3, y); hx.lineTo(x + w - 3, y); hx.lineTo(x + w, y + 3); hx.lineTo(x + w, y + h - 3); hx.lineTo(x + w - 3, y + h);
      if (tail) { hx.lineTo(tail[0] + 5, y + h); hx.lineTo(tail[0], tail[1]); hx.lineTo(tail[0] - 3, y + h); } hx.lineTo(x + 3, y + h); hx.lineTo(x, y + h - 3); hx.lineTo(x, y + 3); hx.closePath(); };
    path(); hx.fillStyle = g; hx.fill(); hx.lineWidth = 3; hx.strokeStyle = '#1c1e26'; hx.stroke(); hx.lineWidth = 1; hx.strokeStyle = '#e6e8ee'; hx.stroke();
    hx.fillStyle = 'rgba(255,255,255,.16)'; hx.fillRect(x + 3, y + 2, w - 6, 1); }
  // 文字：窓より少し粗い細かさで打ち、ふちのぼかしを切って（55% より濃い所だけ残す）ドットにする。太さはふつう（400。ヒラギノ角ゴなら W3。500 以上は太い字が選ばれる）。右下に 1 ドットの影
  let HS = 1, FS = 10; const glyphs = new Map(), FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","YuGothic","Meiryo","Noto Sans JP","Noto Sans CJK JP","Source Han Sans JP","IPAGothic","IPAPGothic","TakaoGothic",sans-serif';   // どの端末でもゴシック体が選ばれるように、ゴシック体の名前をならべる
  function glyph(s, c) { const key = s + '|' + c + '|' + FS + '|' + HS; let g = glyphs.get(key); if (g) return g; if (glyphs.size > 400) glyphs.clear();
    const k = TK(), px = Math.round(FS * HS / k) + 1, sh = 1, m = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); m.font = `400 ${px}px ${FONT}`; const w = Math.ceil(m.measureText(s).width) + sh + 2, h = Math.ceil(px * 1.35) + sh + 2;
    m.canvas.width = w; m.canvas.height = h; m.font = `400 ${px}px ${FONT}`; m.textBaseline = 'top'; m.fillStyle = '#fff'; m.fillText(s, 1, 1);
    const im = m.getImageData(0, 0, w, h), d = im.data, out = new ImageData(w, h), o = out.data, hex = q => [parseInt(q.slice(1, 3), 16), parseInt(q.slice(3, 5), 16), parseInt(q.slice(5, 7), 16)], C = hex(c), D = hex('#14161e');
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = (y * w + x) * 4; if (d[i + 3] >= 140) { o[i] = C[0]; o[i + 1] = C[1]; o[i + 2] = C[2]; o[i + 3] = 255; } else if (x >= sh && y >= sh && d[((y - sh) * w + x - sh) * 4 + 3] >= 140) { o[i] = D[0]; o[i + 1] = D[1]; o[i + 2] = D[2]; o[i + 3] = 255; } }
    m.putImageData(out, 0, 0); g = m.canvas; glyphs.set(key, g); return g; }
  // 文字の 1 ドットは 窓の k ドット（窓が粗い絵の 3 倍なら 2）。きれいすぎず、ドットの感じが残る細かさ。文字の大きさは 1 ドットぶん大きめ
  const TK = () => Math.max(1, Math.round(HS / 1.5)), FE = () => (Math.round(FS * HS / TK()) + 1) * TK() / HS;   // FE＝粗い絵の単位での 文字の大きさ（折り返しの計算に使う）
  function text(s, x, y, c = '#f4f4f8') { if (!s) return; const g = glyph(s, c), k = TK(), X = Math.round(x * HS / k) * k, Y = Math.round(y * HS / k) * k; hx.drawImage(g, (X - k) / HS, (Y - k) / HS, g.width * k / HS, g.height * k / HS); }

  const v = new THREE.Vector3(), camP = new THREE.Vector3(), look = new THREE.Vector3();
  function drawHud(t) { const L = crt.low, W = L.w, Hh = L.h; HS = L.scale % 2 === 0 && L.scale >= 4 ? L.scale / 2 : L.scale;   // 窓と文字は、景色より細かく描く（画面の 1〜2 ドットが 窓の 1 ドット）
    if (hud.width !== W * HS || hud.height !== Hh * HS) { hud.width = W * HS; hud.height = Hh * HS; } hx.setTransform(HS, 0, 0, HS, 0, 0); hx.imageSmoothingEnabled = false; hx.clearRect(0, 0, W, Hh); const fs0 = W < 260 ? 9 : 10; FS = fs0; const fs = FE(), font = `400 ${fs}px ${FONT}`; hx.font = font; hx.textBaseline = 'top';
    text(opts.title || '', 6, 5, '#ffe6a8');
    if (st.talking) { const n = st.talking; v.set(n.o.position.x, n.o.position.y + n.head + .15, n.o.position.z).project(cam); const sx = (v.x * .5 + .5) * W, sy = (-v.y * .5 + .5) * Hh;
      const ww = Math.min(W - 16, fs * 22), lines = wrap(st.full.slice(0, Math.floor(st.shown)), ww - 14, font), all = wrap(st.full, ww - 14, font), nh = n.name ? fs + 4 : 0, h = 10 + nh + all.length * (fs + 3);
      let bx = Math.max(6, Math.min(W - ww - 6, sx - ww / 2)), by = Math.max(18, Math.min(Hh * .55, sy - h - 14)); const tl = v.z < 1 && sy > by + h + 4 ? [Math.max(bx + 10, Math.min(bx + ww - 12, sx)), Math.min(sy - 2, by + h + 18)] : null;
      win(bx, by, ww, h, tl); if (n.name) text(n.name, bx + 7, by + 5, '#ffe6a8'); lines.forEach((l, i) => text(l, bx + 7, by + 6 + nh + i * (fs + 3)));
      if (st.shown >= st.full.length && Math.sin(t * 8) > 0) { hx.fillStyle = '#ffe6a8'; hx.fillRect(bx + ww - 10, by + h - 7, 4, 3); hx.fillRect(bx + ww - 9, by + h - 4, 2, 1); } }
    else if (near) { v.set(near.o.position.x, near.o.position.y + near.head + .32, near.o.position.z).project(cam); const sx = (v.x * .5 + .5) * W, sy = (-v.y * .5 + .5) * Hh; if (v.z < 1) { const lb = near.thing ? 'しらべる' : 'はなす', w = hx.measureText(lb).width + 12; win(sx - w / 2, sy - fs - 8 + Math.sin(t * 4) * 1.5, w, fs + 6); text(lb, sx - w / 2 + 6, sy - fs - 5 + Math.sin(t * 4) * 1.5); } } }

  // ---- 動き ----
  function heroPose(t, dt) { const J = hero.userData.J;
    if (!st.ground) { MO.reset(hero); const k = Math.min(1, st.air * 4); J.legL.rotation.x = -.7 * k; J.shinL.rotation.x = 1.1 * k; J.legR.rotation.x = .25 * k; J.shinR.rotation.x = .6 * k; J.armL.rotation.set(-.4 * k, 0, .5 * k); J.armR.rotation.set(.5 * k, 0, -.5 * k); J.foreL.rotation.x = J.foreR.rotation.x = -.6 * k; J.torso.rotation.x = .08; return; }
    if (st.speed > 3.4) { st.ph += dt * (7 + st.speed); TL.dash(hero, st.ph, Math.min(1, (st.speed - 3.4) / 2.5)); }
    else if (st.speed > .2) { st.ph += dt * st.speed * 3.9; R.walk(hero, st.ph, 1); }
    else MO.play(hero, 'stand', t); }
  function npcTick(t, dt, P) { near = null; let best = 1e9;
    for (const n of npcs) { const o = n.o; try {
      if (n.talk) { const a = Math.atan2(P.x - o.position.x, P.z - o.position.z); if (!n.thing) { o.rotation.y += Math.atan2(Math.sin(a - o.rotation.y), Math.cos(a - o.rotation.y)) * Math.min(1, dt * 6); if (n.human) MO.play(o, 'stand', t); else if (n.idle) n.idle(t, o); } }
      else if (n.path) { n.u = (n.u + dt * n.speed / n.path.getLength()) % 1; const p = n.path.getPointAt(n.u), tg = n.path.getTangentAt(n.u); o.position.set(p.x, n.flyY ?? H(p.x, p.z), p.z); o.rotation.y = Math.atan2(tg.x, tg.z); if (n.human) R.walk(o, t * n.speed * 4.6, .9); else if (n.idle) n.idle(t, o); }
      else if (n.idle) n.idle(t, o); else if (n.human && !n.thing) { R.idle(o, t + n.home.x, Math.sin(t * .5 + n.home.z) * .3); o.rotation.y += (n.ry0 - o.rotation.y) * Math.min(1, dt * 2); }
      const dx = o.position.x - P.x, dz = o.position.z - P.z, d = Math.hypot(dx, dz), ahead = (dx * Math.sin(st.ry) + dz * Math.cos(st.ry)) / (d || 1), sc = d - ahead * .6;
      if (d < (n.thing ? 1.6 : 1.9) + n.r && Math.abs(o.position.y - st.y) < 1.6 && ahead > -.2 && sc < best) { best = sc; near = n; }
      } catch (e) { if (!n.err) { n.err = 1; console.warn('村人の動きでエラー', n.name, e); } } } }   // 1 人のまちがいで ゲームぜんぶが止まらないように

  // ---- はじめる ----
  function run(id) {
    const build = window.TALE_WORLDS[id]; build(G);
    for (const n of npcs) if (n.path) n.u = n.u || 0;
    if (q.get('at')) { const a = q.get('at').split(',').map(Number); SPAWN = [a[0], a[1], (a[2] || 0) * Math.PI / 180]; }   // ?at=x,z,向き（度）：はじめの場所を変える（確かめる用）
    [st.x, st.z, st.ry] = SPAWN; st.y = support(st.x, st.z, 50, 99); cam0.yaw = st.ry;
    crt = R.crt(renderer, crtO); onResize(crt.resize);
    const lightSun = scene.children.find(o => o.isDirectionalLight), SUNV = lightSun ? lightSun.position.clone().normalize() : new THREE.Vector3(.5, .7, .5);
    let ty = 0, lastHint = 0, runK = 0, dust = 0; const fx = K.fx(scene, 40);
    K.loop((dt, t) => {
      // 入力 → カメラから見た向き。走る 7.4 m/s（全力のダッシュ）、歩く 3.0 m/s
      let ix = 0, iz = 0, running = false;
      if (!st.talking && $('menu').style.display !== 'block') { ix = (key.KeyD || key.ArrowRight ? 1 : 0) - (key.KeyA || key.ArrowLeft ? 1 : 0); iz = (key.KeyW || key.ArrowUp ? 1 : 0) - (key.KeyS || key.ArrowDown ? 1 : 0); running = !!(key.ShiftLeft || key.ShiftRight || joy.lock);
        if (joy.on) { ix = joy.x; iz = -joy.y; running = running || joy.run; }
        if (AUTO && TOUR) { let [wx, wz] = TOUR[tourI % TOUR.length]; if (Math.hypot(wx - st.x, wz - st.z) < 1.2) { tourI++; [wx, wz] = TOUR[tourI % TOUR.length]; }
          const dx = wx - st.x, dz = wz - st.z, l = Math.hypot(dx, dz) || 1, fx = Math.sin(cam0.yaw), fz = Math.cos(cam0.yaw); iz = (dx * fx + dz * fz) / l; ix = (-dx * fz + dz * fx) / l; running = q.get('run') ? true : t % 9 > 5; if (!q.get('run') && Math.abs((t % 4) - 3) < dt) jump(); if (q.get('side')) { cam0.yaw = st.ry - Math.PI / 2; cam0.drag = 1; } } }   // ?run=1 ずっと走る、?side=1 横から見る（確かめる用）
      const m = Math.min(1, Math.hypot(ix, iz)), fwdX = Math.sin(cam0.yaw), fwdZ = Math.cos(cam0.yaw);   // カメラの前と右（右＝(−前z, 前x)）
      const dirX = fwdX * iz - fwdZ * ix, dirZ = fwdZ * iz + fwdX * ix;
      const want = m * (running ? 7.4 : 3.0); st.speed += (want - st.speed) * Math.min(1, dt * (st.ground ? 10 : 3));
      if (m > .05) { const a = Math.atan2(dirX, dirZ); st.ry += Math.atan2(Math.sin(a - st.ry), Math.cos(a - st.ry)) * Math.min(1, dt * 12); }
      const P = { x: st.x + Math.sin(st.ry) * st.speed * dt * (m > .05 ? 1 : 0), z: st.z + Math.cos(st.ry) * st.speed * dt * (m > .05 ? 1 : 0) };
      push(P, st.y, 1.1, .42, .3); const g = support(P.x, P.z, st.y, .42);
      if (st.ground && g < st.y - .5) { st.ground = false; st.vy = 0; st.air = 0; }
      st.x = P.x; st.z = P.z;
      if (st.ground) st.y += (g - st.y) * Math.min(1, dt * 18); else { st.vy -= 15 * dt; st.y += st.vy * dt; st.air += dt; const g2 = support(st.x, st.z, st.y, .2); if (st.y <= g2 && st.vy <= 0) { st.y = g2; st.ground = true; st.vy = 0; } }
      if (st.y < -30) { [st.x, st.z, st.ry] = SPAWN; st.y = support(st.x, st.z, 50, 99); st.vy = 0; }
      hero.position.set(st.x, st.y, st.z); hero.rotation.y = st.ry; heroPose(t, dt);
      if (st.ground && st.speed > 4.5 && (dust += dt) > .11) { dust = 0; fx.emit('smoke', st.x - Math.sin(st.ry) * .3, st.y + .05, st.z - Math.cos(st.ry) * .3, { size: .28, life: .45, vy: .4, grow: 1.4, spread: .1, tint: '#d8cbb0' }); }   // 走ると足もとに土ぼこり
      fx.update(dt);
      shadow.position.set(st.x, support(st.x, st.z, st.y + .05, .1) + .04, st.z);
      // カメラ：うしろから追う。動いているあいだは、ゆっくり主人公のうしろへ回る
      cam0.drag = Math.max(0, cam0.drag - dt); if (m > .05 && cam0.drag <= 0 && iz > -.3) cam0.yaw += Math.atan2(Math.sin(st.ry - cam0.yaw), Math.cos(st.ry - cam0.yaw)) * Math.min(1, dt * 1.6 * m);
      if (key.KeyQ) cam0.yaw += dt * 2; if (key.KeyC) cam0.yaw -= dt * 2;
      const fast = Math.max(0, Math.min(1, (st.speed - 3.4) / 3.5)); runK += (fast - runK) * Math.min(1, dt * 3); const tall = innerWidth < innerHeight, D = cam0.dist * (tall ? .9 : 1) * (1 + .18 * runK);
      { const U = cam.userData; if (U.set === undefined || Math.abs(cam.fov - U.set) > .01) U.fov0 = cam.fov; const f = U.fov0 + 7 * runK; cam.fov = U.set = f; cam.updateProjectionMatrix(); } ty += (st.y - ty) * Math.min(1, dt * 6);   // 走ると画角が少し広がる（画面の大きさが変わったら、もとの画角を取りなおす）。ty＝カメラが追う高さ
      const tx = st.x, tz = st.z; camP.set(tx - Math.sin(cam0.yaw) * Math.cos(cam0.pitch) * D, ty + 1.0 + Math.sin(cam0.pitch) * D, tz - Math.cos(cam0.yaw) * Math.cos(cam0.pitch) * D);
      { let k = 1; for (let i = 1; i <= 10; i++) { const f = i / 10, x = tx + (camP.x - tx) * f, y = ty + 1 + (camP.y - ty - 1) * f, z = tz + (camP.z - tz) * f;   // カメラと主人公のあいだに かべがあれば、カメラを近づける
          if (boxes.some(b => { if (y < b.y0 || y > b.y1 + .2) return false; const [lx, lz] = local(b, x, z); return Math.abs(lx) < b.hx + .15 && Math.abs(lz) < b.hz + .15; })) { k = Math.max(.3, (i - 1.5) / 10); break; } }
        if (k < 1) camP.set(tx + (camP.x - tx) * k, ty + 1 + (camP.y - ty - 1) * k, tz + (camP.z - tz) * k); }
      const gc = H(camP.x, camP.z) + .4; if (camP.y < gc) camP.y = gc; cam.position.lerp(camP, Math.min(1, dt * 8)); look.set(tx, ty + .85, tz); cam.lookAt(look);
      if (lightSun) { lightSun.position.set(st.x + SUNV.x * 60, SUNV.y * 60 + st.y, st.z + SUNV.z * 60); lightSun.target.position.set(st.x, st.y, st.z); }
      npcTick(t, dt, st); for (const f of ticks) f(t, dt, st);
      if (st.talking) st.shown = Math.min(st.full.length, st.shown + dt * 28);
      if (q.get('talk') && !st.talking && near && t > 1 && t - lastHint > 4) { lastHint = t; act(); }   // ?talk=1：近くの人に話しかけたままにする（確かめる用）
      if (AUTO && !st.talking && near && t > 2 && t - lastHint > 6) { lastHint = t; act(); } if (AUTO && st.talking && t - lastHint > 2.2) { lastHint = t; act(); act(); }
      $('bTalk').classList.toggle('on', !!near && !st.talking);
      crt.render(scene, cam, t); drawHud(t);
    });
  }
  G.run = run; G.cam = cam; G.hero = hero; G.state = st; G.npcs = npcs; G.act = act; G.H = (x, z) => H(x, z); G.dbg = (x, z) => [...boxes.filter(b => { const [lx, lz] = local(b, x, z); return Math.abs(lx) < b.hx + .5 && Math.abs(lz) < b.hz + .5; }), ...circles.filter(c => Math.hypot(x - c.x, z - c.z) < c.r + .5)]; window.__tale = G; return G;   // __tale は確かめる用
};
