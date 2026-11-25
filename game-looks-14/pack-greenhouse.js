// 第 14 集 03「冬の雨の朝の大温室」のための部品。../game-looks-7/kit.js と retro.js のあとに読み、
//   const GH = PACK_GREENHOUSE(THREE, K, R);   として使う。共通の部品集（retro.js と各 pack）は変えず、ここにだけ足す。
// 決まりは retro.js と同じ（足もとが y=0、大きさは m、色は '#rrggbb'）。
//
// ■ GH.glass({ c, frame, drops, n: 4 }) → { frames: [Texture…], mat }   雨つぶの流れるガラス（64 ドット＝2 m。白い鉄の桟つき）
//     ガラスは半分すけ、桟は不透明。雨つぶの すじが下へ流れるコマを n 枚打つ。毎コマ R.flip(mat, frames, t, fps) で送る
// ■ GH.house({ nave: [z0, z1], ax, ay, ah, step, dome: { z, r, h, rise }, iron, plinth }) → { iron: Group, glass: Mesh, lantern: 頂上の y, inside(x, z) }
//     鉄とガラスの温室。手前に のびる かまぼこ屋根の 身廊と、奥の大きな円いドームの館。
//     iron は動かない白い鉄の骨組み（R.merge に入れてよい）。glass はすけるガラス（R.merge に入れない）。inside(x, z) は温室の中なら true
// ■ GH.koi({ s, c, c2 }) → Mesh   にしきごい（オレンジと白のまだら）。前が +z
// ■ GH.can({ c }) → Group   じょうろ（取っ手の所が原点）。userData.spout ＝ 口の位置
// ■ GH.rain({ n, area: [x0, x1, z0, z1], h, skip(x, z), c, a, speed }) → LineSegments   決まった場所に ふる雨（温室の外だけにふらせる）。毎コマ userData.tick(t)
// ■ GH.drip({ n, h, c }) → LineSegments   じょうろの口から落ちる水。毎コマ userData.tick(t)。position を口に合わせる
// ■ GH.pot({ r, h, c }) → Mesh   素焼きのはち（つりかごにも使う）
window.PACK_GREENHOUSE = (THREE, K, R) => {
  const { hash, ramp, geo, parts } = R, T = R.tex, PI = Math.PI, TAU = PI * 2;

  // ================= 雨の流れるガラス =================
  // ガラスは うすい水色で半分すける。左上から右下へ 光の帯。白い鉄の桟（ふちと まん中の たて）。
  // 雨つぶは、上が細く下が丸い すじ。コマごとに 4 ドットずつ下へ。とちゅうで止まる つぶも少し
  const glass = (o = {}) => { const n = o.n || 4, G = ramp(o.c || '#b8d4d8'), Fr = ramp(o.frame || '#e4ebe8'), frames = [], rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const drops = [...Array(o.drops || 11)].map((_, k) => ({ x: 3 + Math.floor(hash(k, 1) * 58), y: Math.floor(hash(k, 2) * 64), v: 2 + Math.floor(hash(k, 3) * 3), len: 3 + Math.floor(hash(k, 4) * 6), stop: hash(k, 5) > .7 }));
    for (let f = 0; f < n; f++) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const X = cv.getContext('2d'), D = X.createImageData(64, 64), px = (x, y, c, a) => { x = ((x % 64) + 64) % 64; y = ((y % 64) + 64) % 64; const i = (y * 64 + x) * 4, [r, g, b] = rgb(c); D.data[i] = r; D.data[i + 1] = g; D.data[i + 2] = b; D.data[i + 3] = Math.round(a * 255); };
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const s = (x + y * 2) % 41; px(x, y, s < 3 ? G[5] : s < 7 ? G[4] : (x * 7 + y * 3) % 23 === 0 ? G[4] : G[3], s < 7 ? .42 : .26); }
      for (const d of drops) { const y0 = d.stop ? d.y : d.y + f * d.v * (n === 4 ? 4 : 1); for (let i = 0; i < d.len; i++) px(d.x, y0 - i, G[5], .5 - i * .04); px(d.x, y0 + 1, '#ffffff', .75); px(d.x + 1, y0 + 1, G[2], .55); px(d.x, y0 + 2, G[2], .5); }
      for (let i = 0; i < 64; i++) { px(i, 0, Fr[2], 1); px(i, 1, Fr[4], 1); px(0, i, Fr[2], 1); px(1, i, Fr[4], 1); px(32, i, Fr[3], 1); px(33, i, Fr[1], 1); px(i, 32, Fr[3], .9); }
      X.putImageData(D, 0, 0); const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; frames.push(t); }
    const mat = new THREE.MeshBasicMaterial({ map: frames[0], transparent: true, side: THREE.DoubleSide, depthWrite: false, vertexColors: true });
    return { frames, mat }; };

  // ================= 鉄とガラスの温室 =================
  const up = new THREE.Vector3(0, 1, 0), qa = new THREE.Quaternion(), M4 = new THREE.Matrix4(), V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  // a から b へ 四角い鉄の棒（はば w）
  const bar = (G, a, b, w = .12) => { const A = V(a), d = V(b).sub(A), L = d.length(); if (L < 1e-4) return; qa.setFromUnitVectors(up, d.clone().normalize()); M4.compose(A, qa, new THREE.Vector3(1, 1, 1)); G.at(M4); G.box(w, L, w, 0, 0, 0, { m: 1.5, top: false }); G.at(null); };
  const house = (o = {}) => {
    const [Z0, Z1] = o.nave || [14, -28], AX = o.ax || 6.5, AY = o.ay || 4.2, AH = o.ah || 4.5, ST = o.step || 3, P = o.plinth ?? .6, D = { z: -40, r: 13, h: 9.5, rise: 11, ...(o.dome || {}) };
    const B = parts(), Ir = B.g(o.iron || T.metal({ c: '#e4ebe8' })), Pl = B.g(o.brick || T.brick({ c: '#9a6a58', seed: 4 })), GL = geo(), gq = (a, b, c, d, u = 1, v = 1) => GL.quad(a, b, c, d, [0, 0, u, v]);
    const NA = 10, arch = k => { const q = k / NA * PI; return [-Math.cos(q) * AX, AY + Math.sin(q) * AH]; };
    // ---- 身廊：たての柱、かまぼこの あばら、横の けた、低い れんがの腰かべ ----
    const zs = []; for (let z = Z0; z > Z1 - .01; z -= ST) zs.push(z); if (zs[zs.length - 1] > Z1 + .3) zs.push(Z1);
    for (const z of zs) { for (const s of [-1, 1]) { bar(Ir, [s * AX, P, z], [s * AX, AY, z], .16); bar(Ir, [s * AX, AY - .6, z], [s * (AX - .7), AY + .15, z], .08); }
      for (let k = 0; k < NA; k++) { const [x1, y1] = arch(k), [x2, y2] = arch(k + 1); bar(Ir, [x1, y1, z], [x2, y2, z], .14); } }
    for (const k of [0, 2, 4, 5, 6, 8, 10]) { const [x, y] = arch(k); bar(Ir, [x, y, Z0], [x, y, Z1], .1); }
    for (const s of [-1, 1]) { bar(Ir, [s * AX, P, Z0], [s * AX, P, Z1], .14); bar(Ir, [s * AX, (P + AY) / 2, Z0], [s * AX, (P + AY) / 2, Z1], .08); Pl.box(.34, P, Z0 - Z1, s * AX, 0, (Z0 + Z1) / 2, { m: 3 }); }
    for (let i = 0; i < zs.length - 1; i++) { const za = zs[i], zb = zs[i + 1], u = (za - zb) / 2;
      for (const s of [-1, 1]) gq([s * AX, P, za], [s * AX, P, zb], [s * AX, AY, zb], [s * AX, AY, za], u, (AY - P) / 2);
      for (let k = 0; k < NA; k++) { const [x1, y1] = arch(k), [x2, y2] = arch(k + 1); gq([x1, y1, za], [x2, y2, za], [x2, y2, zb], [x1, y1, zb], Math.hypot(x2 - x1, y2 - y1) / 2, u); } }
    // 手前のつま（入口）：半円の上を ガラス、下の まん中に戸口
    for (let k = 0; k < NA; k++) { const [x1, y1] = arch(k), [x2, y2] = arch(k + 1); GL.tri([x1, y1, Z0], [x2, y2, Z0], [0, AY, Z0], [0, 0], [1, 0], [.5, 1]); }
    for (const s of [-1, 1]) { gq([s * 1.4, P, Z0], [s * AX, P, Z0], [s * AX, AY, Z0], [s * 1.4, AY, Z0], (AX - 1.4) / 2, (AY - P) / 2); bar(Ir, [s * 1.4, 0, Z0], [s * 1.4, AY, Z0], .16); } bar(Ir, [-1.4, 3, Z0], [1.4, 3, Z0], .14); gq([-1.4, 3, Z0], [1.4, 3, Z0], [1.4, AY, Z0], [-1.4, AY, Z0], 1.4, .6);
    // ---- ドームの館：円い胴（たてのガラス）＋ ドーム ＋ てっぺんの小さな塔 ----
    const NS = 28, LAT = 7, RT = 2.2, ang = i => i / NS * TAU, at = (i, r, y) => [Math.sin(ang(i)) * r, y, D.z + Math.cos(ang(i)) * r];
    const open = i => { const a = (i + .5) / NS * TAU, x = Math.sin(a) * D.r, z = D.z + Math.cos(a) * D.r; return z > D.z && Math.abs(x) < AX + .2; };
    const lat = j => { const pm = Math.acos(RT / D.r), p = j / LAT * pm; return [D.r * Math.cos(p), D.h + D.rise * Math.sin(p) / Math.sin(pm)]; };
    for (let i = 0; i < NS; i++) { const a0 = at(i, D.r, 0), inOpen = open(i) && open((i - 1 + NS) % NS);
      if (!inOpen) bar(Ir, at(i, D.r, P), at(i, D.r, D.h), .18); else bar(Ir, at(i, D.r, AY + AH), at(i, D.r, D.h), .16);
      for (const y of [P, D.h * .5, D.h]) if (!(open(i) && y < AY + AH)) bar(Ir, at(i, D.r, y), at(i + 1, D.r, y), .12);
      if (!open(i)) { Pl.at(null); const b0 = at(i, D.r, 0), b1 = at(i + 1, D.r, 0); Pl.quad(b0, b1, [b1[0], P, b1[2]], [b0[0], P, b0[2]], [0, 0, 1, .2]); gq(at(i, D.r, P), at(i + 1, D.r, P), at(i + 1, D.r, D.h), at(i, D.r, D.h), 1.5, (D.h - P) / 2); }
      else gq(at(i, D.r, AY + AH), at(i + 1, D.r, AY + AH), at(i + 1, D.r, D.h), at(i, D.r, D.h), 1.5, (D.h - AY - AH) / 2);
      for (let j = 0; j < LAT; j++) { const [r0, y0] = lat(j), [r1, y1] = lat(j + 1); if (i % 2 === 0) bar(Ir, at(i, r0, y0), at(i, r1, y1), .16); gq(at(i, r0, y0), at(i + 1, r0, y0), at(i + 1, r1, y1), at(i, r1, y1), r0 * TAU / NS / 2, Math.hypot(r1 - r0, y1 - y0) / 2); }
      for (const j of [2, 4, LAT]) { const [r, y] = lat(j); bar(Ir, at(i, r, y), at(i + 1, r, y), .1); } }
    const TY = lat(LAT)[1]; for (let i = 0; i < NS; i += 2) { bar(Ir, at(i, RT, TY), at(i, RT, TY + 1.6), .1); gq(at(i, RT, TY), at(i + 2, RT, TY), at(i + 2, RT, TY + 1.6), at(i, RT, TY + 1.6), .6, .8); }
    Ir.loft(14, [[TY + 1.6, RT + .25, RT + .25, 0, .9, 0, D.z], [TY + 2.6, .6, .6, .5, 1, 0, D.z], [TY + 3.2, .08, .08, 1, 1.1, 0, D.z]], { cap: 'top', ur: 3 }); Ir.loft(6, [[TY + 3.2, .1, .1, 0, 1, 0, D.z], [TY + 3.9, .05, .05, 1, 1, 0, D.z]], { cap: 'top' });
    // 身廊の ドームがわの つなぎの あばら（2 本）
    for (const z of [Z1]) for (let k = 0; k < NA; k++) { const [x1, y1] = arch(k), [x2, y2] = arch(k + 1); bar(Ir, [x1, y1, z], [x2, y2, z], .2); }
    const iron = B.group(), g = GL.build(); const cols = g.attributes.color; for (let i = 0; i < cols.count; i++) cols.setXYZ(i, 1, 1, 1);
    const gm = o.glass || glass({}); const glassM = new THREE.Mesh(g, gm.mat); glassM.renderOrder = 2; glassM.userData.dyn = true;
    const inside = (x, z) => (Math.abs(x) < AX && z < Z0 && z > Z1 - 2) || Math.hypot(x, z - D.z) < D.r;
    return { iron, glass: glassM, gm, lantern: TY + 3.9, inside, D, AX, AY, AH, Z0, Z1 }; };

  // ================= にしきごい =================
  const koiT = (o = {}) => { const P = R.Px(32, 16), Or = ramp(o.c || '#f0782a'), W = ramp(o.c2 || '#f4f0e8'), sd = o.seed || 0;
    P.each((x, y) => { const n = R.tn ? R.tn(x, y, 8, 3, 32, 16, sd) : hash(x >> 2, y >> 2, sd); return n > .55 ? (y < 5 ? Or[4] : Or[3]) : (y < 5 ? W[4] : W[3]); });
    for (let x = 0; x < 32; x++) { P.set(x, 15, Or[1]); P.set(x, 0, W[5]); } P.set(29, 6, '#1a1a22'); P.set(29, 9, '#1a1a22'); return T.from(P, { m: 1 }); };
  const koi = (o = {}) => { const s = o.s || .5, G = geo().smooth(1);
    G.loft(6, [[0, .02, .01, 0, .7], [.18, .09, .05, .3, .9], [.55, .12, .07, .6, 1], [.85, .09, .05, .85, 1], [1, .03, .03, 1, 1]].map(r => [r[0] * s, r[1] * s * 1.2, r[2] * s, r[3], r[4]]), { cap: 'top' });
    G.smooth(0).quad([-.14 * s, -.02 * s, 0], [.14 * s, -.02 * s, 0], [.06 * s, .08 * s, 0], [-.06 * s, .08 * s, 0], [0, 0, .1, .1]);
    const m = G.mesh(koiT(o)); m.geometry.rotateX(PI / 2); m.userData.dyn = true; return m; };

  // ================= じょうろ・はち =================
  const can = (o = {}) => { const B = parts(), Mt = B.g(T.metal({ c: o.c || '#5a8a6a' })), g = new THREE.Group();
    Mt.loft(8, [[-.32, .12, .12, 0, .8, .16, 0], [-.08, .13, .13, .5, 1, .16, 0], [-.06, .1, .1, .6, 1.1, .16, 0]], { cap: 'both' });
    bar(Mt, [.16, -.12, -.1], [.16, .06, -.1], .03); bar(Mt, [.16, .06, -.1], [.16, .06, .1], .03); bar(Mt, [.24, -.26, 0], [.56, -.02, 0], .04); Mt.loft(6, [[-.04, .02, .02, 0, 1, .58, 0], [.02, .05, .05, 1, 1.1, .58, 0]], { cap: 'top' });
    const gg = B.group(); g.add(gg); g.userData.spout = [.6, 0, 0]; g.userData.dyn = true; return g; };
  const pot = (o = {}) => { const r = o.r || .3, h = o.h || .35, G = geo().smooth(1); G.loft(8, [[0, r * .7, r * .7, 0, .7], [h * .85, r, r, .8, 1], [h, r * 1.08, r * 1.08, 1, 1.15]], { cap: 'bot', ur: 2 }); return G.mesh(T.brick({ c: o.c || '#b8643a', mortar: '#a8583a' })); };

  // ================= 決まった場所にふる雨 =================
  const rain = (o = {}) => { const n = o.n || 900, [x0, x1, z0, z1] = o.area || [-40, 40, -70, 30], H = o.h || 22, sp = o.speed || 16, ln = o.len || .9, pts = [];
    for (let i = 0; pts.length < n && i < n * 6; i++) { const x = x0 + hash(i, 1, 9) * (x1 - x0), z = z0 + hash(i, 2, 9) * (z1 - z0); if (o.skip && o.skip(x, z)) continue; pts.push([x, z, hash(i, 3, 9), .8 + hash(i, 4, 9) * .4]); }
    const pos = new Float32Array(pts.length * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: o.c || '#c8d4e4', transparent: true, opacity: o.a ?? .5 })); l.frustumCulled = false; l.userData.dyn = true;
    l.userData.tick = t => { for (let i = 0; i < pts.length; i++) { const [x, z, ph, k] = pts[i], y = H - (((t * sp * k + ph * H) % H) + H) % H, j = i * 6; pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; pos[j + 3] = x + .12; pos[j + 4] = y + ln; pos[j + 5] = z; } g.attributes.position.needsUpdate = true; };
    l.userData.tick(0); return l; };
  const drip = (o = {}) => { const n = o.n || 14, h = o.h || 1, pos = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: o.c || '#d8ecf4', transparent: true, opacity: .8 })); l.frustumCulled = false; l.userData.dyn = true; l.userData.on = 1;
    l.userData.tick = t => { for (let i = 0; i < n; i++) { const k = ((t * 1.6 + i / n) % 1), y = -k * h * l.userData.on, x = k * .25 + (hash(i, 1) - .5) * .06, z = (hash(i, 2) - .5) * .08, j = i * 6; pos[j] = x; pos[j + 1] = y; pos[j + 2] = z; pos[j + 3] = x + .02; pos[j + 4] = y + .09 * l.userData.on; pos[j + 5] = z; } g.attributes.position.needsUpdate = true; };
    return l; };

  return { glass, house, koi, can, pot, rain, drip, bar };
};
