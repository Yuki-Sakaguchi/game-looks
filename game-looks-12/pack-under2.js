// 第 12 集の題材「上と下の鉄の都市」のうち、26〜30 で使う「上の都市」の部品（pack）。../game-looks-7/kit.js と retro.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), U = PACK_UNDER2(THREE, K, R);   として使う（下の町は ../game-looks-8/pack-city.js の C.〜 を使う）。
//
// ■ 考え方：下の町（さびた鉄・トタン・裸電球）から見上げる、白い大理石と金の、手のとどかない都市。下から見えるのは「巨大な台の裏」と「その上に光る塔」。
//   上の都市は、遠くても霧に消えないよう、材質の fog を切り、色だけ tint で空気の色へ寄せる（haze, hazeK）。夜は glow: true で、光に関係なく白く光る。
//   色の組の見本：大理石 '#f2ede0'（白にクリーム）／金 '#e8b848'／窓のあかり '#fff2c0'。下の町の さび赤・青ねずと ならべると、それだけで対比になる。
//
// ■ 決まり：retro.js と同じ（足もとが y=0、正面が +z、大きさは m）。動く物は userData.tick(t) を持ち、作ったときに U.live に入る。毎コマ U.update(t) を 1 回。
//
// ■ テクスチャ  U.tex.名前({ c, seed, m }) → THREE.Texture
//   marble { c, gold（上に金の帯） }（大理石の切り石と うすい石目）   marbleWin { lit 0〜1, c }（細長いアーチ窓のならぶ大理石のかべ。窓は光る色）
//   gold { c }（金の飾り帯：ひし形とつぶ）   under { c, lamps 0〜1 }（台の裏：鉄のあばら・リベット・たれた しみ・小さなあかり）   fall（落ちる水のすじ。抜き。32×64）
//
// ■ 上の都市
//   U.tower({ h: 60, r: 4, kind: 'spire'/'dome'/'needle'/'stepped', glow, fog, tint, seed }) → Group   白い塔（金の輪と、とがった金の屋根）。userData.top ＝ てっぺんの高さ
//   U.upper({ r: 60, y: 40, th: 12, towers: 12, tall: 1, glow, fog, tint, seed, under: true, rim: true, hang: 6 }) → Group   空にうかぶ台と、その上の塔の群れ。原点は台の中心の真下の地面（y=0）
//       userData = { y（台の上の面の高さ）, bottom（台の裏のいちばん下）, r, drains: [[x, y, z], …]（台のふちの はき出し口。たきを下げる所） }
//   U.halo({ c, r, k }) → Sprite   光のにじみ（加算。霧なし）   U.spot({ r, c, k }) → Mesh   地面に落ちる光の輪（加算。position で動かす）
//
// ■ 光と効果
//   U.searchlight({ len: 90, r0: .8, r1: 9, c, a: .3 }) → Group   白いサーチライトの光の柱（原点が光の出口。-y の向きへのびる。rotation で向ける）。userData.beam
//   U.fireworks({ n: 4, center: [x, y, z], spread: [sx, sy, sz], per: 4.6, R0: 13, cs: [[色, 光る色], …], size: 3.2 }) → Group   花火（上る光のすじ → 開く点の輪 → 落ちながら消える）
//   U.cascade({ w: 3, h: 30, c, a: .75, speed: 1.4 }) → Group   台のふちから落ちる水（原点が上のはし。-y へ落ちる。下のはしに しぶき）
//   U.kite({ c, c2, s: 1, tail: 6 }) → Group   たこ（ひし形の紙と しっぽ）。毎コマ kite.userData.string(手の位置 Vector3) で糸を引く
//   U.update(t)
window.PACK_UNDER2 = (THREE, K, R) => {
  const { hash } = K, PI = Math.PI, TAU = PI * 2, T = R.tex, U = {}, tx = {}, cache = new Map(), ramp = R.ramp, mix = (a, b, k) => { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const def = (name, m, fn, cut = false) => { tx[name] = (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) cache.set(k, t = T.from(fn(o), { m: o.m || m, cut })); return t; }; };
  U.tex = tx; U.live = [];
  const live = o => { o.userData.dyn = true; U.live.push(o); return o; };

  // ---- 大理石の切り石（64×64 ＝ 3 m）。横長の石を 4 段、目地はうすい灰青、石ごとに明るさを少し変え、ななめの石目を 1〜2 本 ----
  const marbleP = (o = {}) => { const P = R.Px(64), A = ramp(o.c || '#f2ede0', 6, { contrast: .55 }), G = ramp('#e8b848'), sd = o.seed || 0;
    for (let row = 0; row < 4; row++) { const y0 = row * 16, off = row % 2 ? 16 : 0; for (let k = 0; k < 2; k++) { const x0 = (off + k * 32) % 64, t = hash(row, k, sd) > .6 ? 4 : hash(row, k, sd + 1) > .7 ? 2.6 : 3;
      for (let j = 0; j < 16; j++) for (let i = 0; i < 32; i++) { const x = x0 + i, e0 = j === 0 || i === 0, e1 = j === 15 || i === 31; P.set(x, y0 + j, e1 ? A[1] : e0 ? A[5] : (hash(x >> 1, (y0 + j) >> 1, sd + 3) > .9 ? A[Math.round(t) - 1] : A[Math.round(t)])); }
      const vx = x0 + 4 + Math.floor(hash(row, k, sd + 5) * 20); for (let j = 2; j < 14; j++) { P.set(vx + Math.round(j * .7 + Math.sin(j) * .8), y0 + j, A[2]); if (j % 3 === 0) P.set(vx + Math.round(j * .7) + 1, y0 + j, A[2]); } } }
    if (o.gold) { for (let x = 0; x < 64; x++) { P.set(x, 0, G[5]); P.set(x, 1, G[4]); P.set(x, 2, x % 4 === 1 ? G[5] : G[3]); P.set(x, 3, G[1]); } }
    return P; };
  def('marble', 3, marbleP);
  // ---- アーチ窓のならぶかべ（64×64 ＝ 3 m に窓 2 つ）。窓は光る色（夜は glow の材質で、そのままあかりに見える） ----
  def('marbleWin', 3, (o = {}) => { const P = marbleP({ c: o.c, seed: o.seed }), A = ramp(o.c || '#f2ede0', 6, { contrast: .55 }), G = ramp('#e8b848'), W = ['#fffbe8', '#fff2c0', '#ffe08a', '#f0b860'], D = ['#4a5a80', '#6a7aa0', '#8a9ac0'], lit = o.lit ?? .85, sd = o.seed || 0;
    for (let x = 0; x < 64; x++) { P.set(x, 50, A[5]); P.set(x, 51, A[4]); P.set(x, 52, A[1]); }   // 窓の下の帯
    for (let k = 0; k < 2; k++) { const cx = 16 + k * 32, on = hash(k, sd, 9) < lit;
      for (let y = 8; y < 49; y++) for (let x = cx - 6; x <= cx + 5; x++) { const ax = x - cx + .5, top = 14 - Math.sqrt(Math.max(0, 36 - ax * ax)), inside = y >= top && Math.abs(ax) < 5.5, frame = y >= top - 1.2 && Math.abs(ax) < 6.6 && !inside;
        if (frame) P.set(x, y, y < top + .2 ? G[4] : G[2]); else if (inside) { const ed = Math.abs(ax) > 4.2 || y > 46, mul = x === cx; P.set(x, y, on ? (mul ? G[3] : ed ? W[2] : y < 18 ? W[0] : W[1]) : (mul ? A[1] : ed ? D[0] : y < 20 ? D[2] : D[1])); } }
      for (let x = cx - 6; x <= cx + 5; x++) P.set(x, 48, G[1]); P.rect(cx - 1, 4, 2, 3, G[4]); P.set(cx - 2, 5, G[3]); P.set(cx + 1, 5, G[3]); }   // 窓台と、上の金のかざり
    return P; });
  // ---- 金の飾り帯（32×16）：ひし形の連なりと つぶ。上下に光と影 ----
  def('gold', 1.5, (o = {}) => { const P = R.Px(32, 16), G = ramp(o.c || '#e8b848', 6, { contrast: 1.1 });
    P.each((x, y) => y === 0 ? G[5] : y === 1 ? G[4] : y === 15 ? G[0] : y === 14 ? G[1] : G[3]);
    for (let x = 0; x < 32; x++) { const d = Math.abs(((x % 16) - 7.5)), yy = Math.round(d * .8); P.set(x, 3 + yy, G[5]); P.set(x, 12 - yy, G[1]); if (d < 6) for (let y = 4 + yy; y < 12 - yy; y++) P.set(x, y, d < 2 ? G[5] : G[2]); }
    for (let x = 0; x < 32; x += 16) { P.set(x, 7, G[5]); P.set(x, 8, G[4]); P.set(x + 1, 8, G[1]); }
    return P; });
  // ---- 台の裏（64×64 ＝ 8 m）：鉄板の格子、あばら、リベット、雨だれのしみ、小さな作業灯 ----
  def('under', 8, (o = {}) => { const P = R.Px(64), A = ramp(o.c || '#4e4e68', 6, { contrast: .8 }), S = ramp('#8a5a40'), L = ['#fff0c0', '#ffc860', '#c88a40'], sd = o.seed || 0;
    P.each((x, y) => { const px = x % 32, py = y % 32, n = hash(x >> 3, y >> 3, sd); return px === 0 || py === 0 ? A[0] : px === 1 || py === 1 ? A[4] : px === 31 || py === 31 ? A[1] : n > .8 ? A[2] : A[3]; });
    for (let y = 0; y < 64; y++) for (const x of [14, 15, 16, 46, 47, 48]) P.set(x, y, x % 32 === 15 ? A[4] : x % 32 === 14 ? A[2] : A[1]);   // あばら
    for (let y = 4; y < 64; y += 8) for (let x = 4; x < 64; x += 8) if ((x % 32) > 3 && (x % 32) < 29) P.set(x, y, A[5]);
    for (let k = 0; k < 6; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y0 = Math.floor(hash(k, 2, sd) * 64), len = 6 + Math.floor(hash(k, 3, sd) * 14); for (let j = 0; j < len; j++) { P.set(x, y0 + j, j < len - 2 ? S[2] : S[1]); if (j < 3) P.set(x + 1, y0 + j, S[3]); } }
    const lamps = o.lamps ?? .5; for (let k = 0; k < 4; k++) if (hash(k, 9, sd) < lamps) { const x = 6 + (k % 2) * 32 + Math.floor(hash(k, 4, sd) * 18), y = 6 + Math.floor(k / 2) * 32 + Math.floor(hash(k, 5, sd) * 18); P.rect(x - 1, y - 1, 3, 3, L[2]); P.rect(x, y - 1, 1, 3, L[1]); P.rect(x - 1, y, 3, 1, L[1]); P.set(x, y, L[0]); }
    return P; });
  // ---- 落ちる水のすじ（32×64。抜き） ----
  def('fall', 2, (o = {}) => { const P = R.Px(32, 64), W = ['#c8d8f0', '#e4eefa', '#ffffff', '#9ab0d8'];
    for (let x = 0; x < 32; x++) { if (hash(x, 1) < .18) continue; const ph = Math.floor(hash(x, 2) * 64), len = 20 + Math.floor(hash(x, 3) * 40), c = hash(x, 4) > .7 ? W[2] : hash(x, 5) > .4 ? W[1] : W[0];
      for (let j = 0; j < len; j++) P.set(x, ph + j, j < 3 ? W[2] : j > len - 4 ? W[3] : c); }
    return P; }, true);

  // ---- 材質（夜は glow、昼は Lambert に少し emissive。霧は既定で切る） ----
  const MAT = (t, o) => o.glow ? { glow: true, fog: !!o.fog } : { fog: !!o.fog, emissive: o.emissive || '#2a2630' };   // emissive は昼・夕方に、かげの面が黒くならないよう
  const tintOf = o => { if (!o.haze) return o.tint ?? 1; const k = o.hazeK ?? .3, h = o.haze, c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255), b = o.tint ?? 1; return c.map(v => b * (1 - k) + v * k); };

  // ---- 白い塔 ----
  U.tower = (o = {}) => { const h = o.h || 60, r = o.r || 4, kind = o.kind || 'spire', B = R.parts(), mo = MAT(null, o), tn = tintOf(o), sd = o.seed || 0, n = 8;
    const Mw = B.g(tx.marbleWin({ seed: sd % 3, lit: o.lit ?? .85 }), mo).tint(tn), Mm = B.g(tx.marble({ seed: sd % 2 }), mo).tint(tn), Gd = B.g(tx.gold(), mo).tint(tn);
    const ur = rr => Math.max(2, Math.round(TAU * rr / 3)), seg = (G, y0, y1, r0, r1, m = 3, cap) => G.loft(n, [[y0, r0, r0, y0 / m, .86], [y1, r1, r1, y1 / m, 1.04]], { ur: ur((r0 + r1) / 2), cap });
    const ringG = (y, rr, th = .9) => { Gd.loft(n, [[y, rr * .96, rr * .96, 0, .8], [y + th * .3, rr, rr, .3, 1.1], [y + th, rr, rr, 1, 1]], { ur: ur(rr) * 2, cap: 'top' }); };
    const roofG = (y0, rr, hh) => Gd.loft(n, [[y0, rr, rr, 0, .9], [y0 + hh * .25, rr * .7, rr * .7, .25, 1.05], [y0 + hh * .7, rr * .22, rr * .22, .7, 1.1], [y0 + hh, .04, .04, 1, 1.15]], { ur: ur(rr) });
    seg(Mm, 0, h * .05, r * 1.35, r * 1.3, 3, 'top'); ringG(h * .05, r * 1.32, .6);
    if (kind === 'needle') { seg(Mw, h * .05, h * .62, r, r * .62); ringG(h * .62, r * .82); seg(Mw, h * .62 + .9, h * .74, r * .58, r * .48); ringG(h * .74, r * .62, .7); roofG(h * .74 + .7, r * .5, h * .26 - .7); }
    else if (kind === 'dome') { seg(Mw, h * .05, h * .55, r, r * .92); ringG(h * .55, r * 1.08); const y0 = h * .55 + .9, rd = r * .95; Gd.loft(n, [[y0, rd, rd, 0, .9], [y0 + rd * .45, rd * .9, rd * .9, .3, 1], [y0 + rd * .8, rd * .6, rd * .6, .6, 1.1], [y0 + rd, rd * .2, rd * .2, .85, 1.15], [y0 + rd * 1.05, .05, .05, 1, 1.2]], { ur: ur(rd) }); roofG(y0 + rd * 1.0, r * .14, h - y0 - rd); }
    else if (kind === 'stepped') { let y = h * .05, rr = r; for (let k = 0; k < 4; k++) { const hh = h * [.3, .2, .14, .1][k]; seg(Mw, y, y + hh, rr, rr * .9); ringG(y + hh, rr * 1.02, .7); y += hh + .7; rr *= .72; } roofG(y, rr * 1.1, h - y); }
    else { seg(Mw, h * .05, h * .5, r, r * .8); ringG(h * .5, r * .98); seg(Mw, h * .5 + .9, h * .7, r * .72, r * .6); ringG(h * .7, r * .74, .7); roofG(h * .7 + .7, r * .68, h * .3 - .7); }
    const g = B.group(); g.userData.top = h; g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.frustumCulled = false; } }); return g; };

  // ---- 空にうかぶ台と、その上の塔 ----
  U.upper = (o = {}) => { const r = o.r || 60, y = o.y || 40, th = o.th || 12, sd = o.seed || 0, g = new THREE.Group(), B = R.parts(), mo = MAT(null, o), tn = tintOf(o), n = 28, ur = rr => Math.max(2, Math.round(TAU * rr / 8));
    const unT = tx.under({ seed: sd, lamps: o.lamps ?? .6 }), Un = B.g(unT, { fog: !!o.fog, emissive: o.underGlow || '#1c1a2c' }).tint(o.underTint ?? 1);
    if (o.under !== false) Un.loft(n, [[y - th, r * .5, r * .5, 0, .62], [y - th * .78, r * .56, r * .56, .2, .72], [y - th * .74, r * .74, r * .74, .4, .78], [y - th * .45, r * .8, r * .8, .65, .88], [y - th * .4, r * .95, r * .95, .85, .9], [y - 1.5, r, r, 1.3, 1]], { ur: ur(r) * 2, cap: 'bot' });   // 下へ だんだんに細くなる台の裏
    if (o.rim !== false) { const Mw = B.g(tx.marbleWin({ seed: sd + 1, lit: o.lit ?? .8 }), mo).tint(tn), Gd = B.g(tx.gold(), mo).tint(tn), Mm = B.g(tx.marble({ seed: sd }), mo).tint(tn), U3 = k => Math.max(2, Math.round(TAU * r / k));
      Gd.loft(n, [[y - 1.6, r * 1.005, r * 1.005, 0, .8], [y - .2, r * 1.005, r * 1.005, 1, 1.1]], { ur: U3(1.5) * 1 });
      Mw.loft(n, [[y - .2, r, r, 0, .9], [y + 5.8, r, r, 2, 1.02]], { ur: U3(3) });
      Gd.loft(n, [[y + 5.8, r * 1.01, r * 1.01, 0, .9], [y + 6.8, r * 1.01, r * 1.01, 1, 1.15]], { ur: U3(1.5), cap: 'top' });
      Mm.loft(n, [[y + 6.8, r * .9, r * .9, 0, .9], [y + 10, r * .86, r * .86, 1, 1]], { ur: U3(3), cap: 'top' }); }
    const plat = B.group(); plat.traverse(m => { if (m.isMesh) { m.castShadow = false; m.frustumCulled = false; } }); g.add(plat);
    // 塔：まん中ほど高く。台の上の面は y + 10
    const NT = o.towers ?? 12, tall = o.tall || 1, KINDS = ['spire', 'needle', 'dome', 'stepped'];
    for (let i = 0; i < NT; i++) { const a = hash(i, sd, 1) * TAU, d = i === 0 ? 0 : (.18 + hash(i, sd, 2) * .62) * r, k = 1 - d / r, h = (i === 0 ? r * 2.2 : r * (.5 + k * 1.3 + hash(i, sd, 3) * .4)) * tall, tw = U.tower({ h, r: Math.max(2, h * (i === 0 ? .07 : .085)), kind: i === 0 ? 'spire' : KINDS[(i + sd) % 4], glow: o.glow, fog: o.fog, emissive: o.emissive, tint: o.tint, haze: o.haze, hazeK: o.hazeK, seed: i + sd, lit: o.lit });
      tw.position.set(Math.cos(a) * d, y + 10, Math.sin(a) * d); g.add(tw); }
    // 台の裏から下がる物（太い管と、くさりの束）。はき出し口の位置を userData.drains に
    const drains = [], Hg = R.geo(), hang = o.hang ?? 6; for (let i = 0; i < hang; i++) { const a = (i + .5) / hang * TAU + sd, rr = r * (.55 + hash(i, sd, 7) * .3), x = Math.cos(a) * rr, z = Math.sin(a) * rr, yt = y - th * (rr > r * .74 ? .42 : .76), len = 4 + hash(i, sd, 8) * 8; Hg.loft(6, [[yt - len, 1.1, 1.1, 0, .8, x, z], [yt - len + .8, 1.3, 1.3, .2, 1, x, z], [yt + 2, 1, 1, 1, .9, x, z]], { cap: 'bot' }); drains.push([x, yt - len, z]); }
    if (hang) { const hm = Hg.mesh(T.metal ? T.metal({ c: '#5a5a70' }) : unT, { fog: !!o.fog, emissive: '#1a1828' }); hm.castShadow = false; hm.frustumCulled = false; g.add(hm); }
    // 台の裏の作業灯（点の光）
    if (o.dots !== false) { const pts = [], cs = [], c1 = new THREE.Color('#ffd890'), c2 = new THREE.Color('#ffffff'); for (let i = 0; i < 90; i++) { const a = hash(i, sd, 11) * TAU, k = [.48, .7, .78, .9, .98][i % 5] - hash(i, sd, 12) * .03, rr = r * k, yy = y - th * (k > .97 ? .1 : k > .8 ? .42 : k > .56 ? .76 : 1); pts.push(Math.cos(a) * rr, yy - .4, Math.sin(a) * rr); const c = i % 4 ? c1 : c2; cs.push(c.r, c.g, c.b); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
      const pm = new THREE.Points(pg, new THREE.PointsMaterial({ size: o.dotSize || 2, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); pm.frustumCulled = false; g.add(pm); }
    g.userData = { y: y + 10, bottom: y - th * 1.2, r, drains }; return g; };

  // ---- 光のにじみ ----
  let haloT = null; const haloTex = () => { if (haloT) return haloT; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); haloT = new THREE.CanvasTexture(c); return haloT; };
  U.halo = (o = {}) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: o.c || '#fff0c0', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: o.k ?? .6 })); s.scale.setScalar((o.r || 10) * 2); s.userData.dyn = true; return s; };

  U.spot = (o = {}) => { const m = new THREE.Mesh(new THREE.CircleGeometry(o.r || 4, 20), new THREE.MeshBasicMaterial({ map: haloTex(), color: o.c || '#e8f0ff', transparent: true, opacity: o.k ?? .5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.rotation.x = -PI / 2; m.position.y = .06; m.renderOrder = 2; m.userData.dyn = true; return m; };

  // ---- サーチライト（光の柱） ----
  U.searchlight = (o = {}) => { const len = o.len || 90, r0 = o.r0 || .8, r1 = o.r1 || 9, a = o.a ?? .3, c = new THREE.Color(o.c || '#e8f0ff'), geo = new THREE.CylinderGeometry(r0, r1, len, 18, 8, true); geo.translate(0, -len / 2, 0);
    const P = geo.attributes.position, col = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { const k = -P.getY(i) / len, f = a * Math.pow(1 - k, 1.4) * (1 - Math.exp(-k * 30)) + a * .25 * Math.exp(-k * 12); col[i * 3] = c.r * f; col[i * 3 + 1] = c.g * f; col[i * 3 + 2] = c.b * f; }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); beam.frustumCulled = false;
    const g = new THREE.Group(); g.add(beam); const h = U.halo({ c: o.c || '#e8f0ff', r: r0 * 4, k: .9 }); g.add(h); g.userData = { beam, dyn: true }; return g; };

  // ---- 花火 ----
  U.fireworks = (o = {}) => { const g = new THREE.Group(), N = o.n || 4, [cx0, cy0, cz0] = o.center || [0, 60, -150], [sx, sy, sz] = o.spread || [70, 18, 30], per = o.per || 4.6, R0 = o.R0 || 13, sz0 = o.size || 3.2;
    const CS = o.cs || [['#ff7aa8', '#ffe0f0'], ['#7ae0ff', '#e0fbff'], ['#ffd060', '#fff4c0'], ['#a8ff90', '#f0ffe0'], ['#ffffff', '#fff8e0']];
    const FW = [...Array(N)].map((_, k) => { const col = CS[k % CS.length], n = 110, pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ color: col[0], size: sz0, sizeAttenuation: false, fog: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), p = new THREE.Points(geo, m); p.frustumCulled = false; g.add(p);
      const dirs = [...Array(n)].map((_, i) => { const u = hash(i, k + 1) * 2 - 1, a = hash(i, k + 7) * TAU, rr = Math.sqrt(1 - u * u); return [rr * Math.cos(a), u, rr * Math.sin(a), .85 + hash(i, k + 3) * .2]; });
      const hl = U.halo({ c: col[0], r: R0 * 1.1, k: 0 }); g.add(hl); return { p, m, geo, pos, dirs, hl, n, col }; });
    g.userData.flash = 0;
    g.userData.tick = t => { let fl = 0; FW.forEach((f, k) => { const off = k * per / N + .6, tt = t - off, cyc = Math.floor(tt / per), lt = tt - cyc * per, cx = cx0 + (hash(cyc, k + 11) - .5) * sx, cy = cy0 + hash(cyc, k + 13) * sy, cz = cz0 - hash(cyc, k + 17) * sz, Rr = R0 * (.8 + hash(cyc, k + 19) * .45);
      if (tt < 0) { f.p.visible = false; f.hl.material.opacity = 0; return; } f.p.visible = true;
      if (lt < 1) { const yy = cy - 30 + 30 * (1 - (1 - lt) ** 2); for (let i = 0; i < f.n; i++) { const j = i % 10; f.pos[i * 3] = cx + Math.sin(lt * 20 + j) * .2; f.pos[i * 3 + 1] = yy - j * 1.1; f.pos[i * 3 + 2] = cz; } f.m.color.set(f.col[1]); f.m.opacity = .7; f.hl.material.opacity = 0; }
      else { const e = lt - 1, rr = Rr * (1 - Math.exp(-e * 3.2)), fall = e * e * 2.2, a = Math.max(0, 1 - e / 2.6); for (let i = 0; i < f.n; i++) { const d = f.dirs[i], tw = (hash(i, Math.floor(t * 12)) > .25 || e < 1.4) ? 1 : 0; f.pos[i * 3] = cx + d[0] * rr * d[3]; f.pos[i * 3 + 1] = cy + d[1] * rr * d[3] - fall - (1 - tw) * 999; f.pos[i * 3 + 2] = cz + d[2] * rr * d[3]; }
        f.m.color.set(e < .25 ? f.col[1] : f.col[0]); f.m.opacity = a; f.hl.position.set(cx, cy, cz); const ho = Math.max(0, .55 - e * .45); f.hl.material.opacity = ho; fl = Math.max(fl, ho); }
      f.geo.attributes.position.needsUpdate = true; }); g.userData.flash = fl; };
    return live(g); };

  // ---- 落ちる水 ----
  U.cascade = (o = {}) => { const w = o.w || 3, h = o.h || 30, sp = o.speed || 1.4, g = new THREE.Group(), t0 = tx.fall().clone(); t0.needsUpdate = true; t0.repeat.set(w / 2, h / 4); t0.wrapS = t0.wrapT = THREE.RepeatWrapping;
    const m = new THREE.MeshBasicMaterial({ map: t0, color: o.c || '#d8e4f8', transparent: true, opacity: o.a ?? .75, alphaTest: .4, side: THREE.DoubleSide, depthWrite: false, fog: o.fog ?? true });
    for (const ry of [0, PI / 2.4]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 1, 6), m); p.position.y = -h / 2; p.rotation.y = ry; g.add(p); }
    const mist = U.halo({ c: '#c8d8f0', r: w * 1.1, k: .35 }); mist.position.y = -h + .6; g.add(mist);
    g.userData.tick = t => { t0.offset.y = t * sp * h / 4 / 6; mist.material.opacity = .28 + Math.sin(t * 3.1) * .06; }; return live(g); };

  // ---- たこ ----
  U.kite = (o = {}) => { const s = o.s || 1, g = new THREE.Group(), P = R.Px(32), A = ramp(o.c || '#e8503a'), B2 = ramp(o.c2 || '#f0d060'), W = ramp('#e8e0cc'); P.clip = true;
    P.each((x, y) => { const dx = Math.abs(x - 15.5), dy = y < 12 ? (12 - y) / 12 : (y - 12) / 20, inside = dx / 15.5 + dy < 1; if (!inside) return null; const q = (x < 16) !== (y < 12); const edge = dx / 15.5 + dy > .9; return edge ? A[1] : q ? (hash(x >> 2, y >> 2) > .85 ? A[2] : A[3]) : (hash(x >> 2, y >> 2, 1) > .85 ? B2[2] : B2[3]); });
    P.line(15, 0, 15, 31, W[1]); P.line(1, 12, 30, 12, W[1]); P.rect(9, 17, 3, 3, W[4]); P.set(22, 8, W[4]); P.set(23, 9, W[4]);   // ほね・つぎの当たった所
    const body = new THREE.Mesh(new THREE.PlaneGeometry(1.1 * s, 1.1 * s), R.mat(T.from(P, { m: 1, cut: true }), { side: true })); g.add(body);
    const tail = [], tn = o.tail ?? 6, tg = new THREE.BufferGeometry(), tp = new Float32Array((tn + 1) * 3); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); g.add(new THREE.Line(tg, new THREE.LineBasicMaterial({ color: '#e8e0cc' })));
    const bowM = R.mat(o.c2 || '#f0d060', { side: true }); for (let i = 0; i < tn; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(.22 * s, .1 * s), bowM); g.add(b); tail.push(b); }
    const sg = new THREE.BufferGeometry(), spos = new Float32Array(9 * 3); sg.setAttribute('position', new THREE.BufferAttribute(spos, 3)); const str = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: '#f0e8d8', transparent: true, opacity: .7 })); str.frustumCulled = false;
    g.userData.line = str; const v = new THREE.Vector3(), w0 = new THREE.Vector3();
    g.userData.tick = t => { body.rotation.z = Math.sin(t * 1.7 + s) * .25; body.rotation.x = Math.sin(t * 1.1) * .2; for (let i = 0; i <= tn; i++) { const yy = -.55 * s - i * .28 * s, xx = Math.sin(t * 3 - i * .8) * .12 * i * s; tp[i * 3] = xx; tp[i * 3 + 1] = yy; tp[i * 3 + 2] = -.1 * i; if (i > 0) tail[i - 1].position.set(xx, yy, -.1 * i); } tg.attributes.position.needsUpdate = true; };
    g.userData.string = hand => { g.updateMatrixWorld(); w0.set(0, -.3 * s, 0).applyMatrix4(g.matrixWorld); for (let i = 0; i <= 8; i++) { const k = i / 8; v.lerpVectors(hand, w0, k); v.y -= Math.sin(k * PI) * hand.distanceTo(w0) * .06; spos[i * 3] = v.x; spos[i * 3 + 1] = v.y; spos[i * 3 + 2] = v.z; } sg.attributes.position.needsUpdate = true; };
    return live(g); };

  U.update = t => { for (const o of U.live) o.userData.tick?.(t); };
  return U;
};
