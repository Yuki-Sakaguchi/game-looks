//__HEADER__
window.PACK_SEA = (THREE, K, R) => {
  // ================= 1. 道具（色・材質・形の向き） =================
  const { hash, mix, ramp, tn, Px, TR, geo, parts, ngon } = R, T = R.tex, S = {}, TAU = Math.PI * 2;
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), md = (a, n) => ((a % n) + n) % n;
  const U = { time: { value: 0 } };   // ゆれる材質が見る時計（S.tick が進める）
  const snap = sh => { sh.uniforms.rSnap = R.U.snap; sh.vertexShader = 'uniform vec2 rSnap;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nif(rSnap.x>0.){gl_Position.xy=floor(gl_Position.xy/gl_Position.w*rSnap+.5)/rSnap*gl_Position.w;}'); };
  // 材質。R.mat に無い物（半透明・加算・水の中でゆれる）を足した物。同じ引数なら同じ物を返す（R.merge でまとまる）
  //   o = { glow（光に関係なく光る）, alpha（0〜1 の半透明）, add（加算）, cut, side, sway: { amp, f, k, inv }（頂点シェーダでゆらす。uv の v が大きいほど大きくゆれる。inv で逆）, color, emissive, fog, flat }
  const matCache = new Map();
  function xmat(t, o = {}) { const key = (t ? t.uuid : '-') + JSON.stringify(o); let m = matCache.get(key); if (m) return m;
    const cut = o.cut ?? (t ? t.userData.cut : false), p = { map: t || null, color: o.color || '#ffffff', vertexColors: o.vc !== false, alphaTest: cut ? .5 : 0, side: (o.side ?? cut) ? THREE.DoubleSide : THREE.FrontSide, fog: o.fog !== false };
    if (o.alpha !== undefined || o.add) { p.transparent = true; p.opacity = o.alpha ?? 1; p.depthWrite = false; } if (o.add) p.blending = THREE.AdditiveBlending;
    if (o.offset) { p.polygonOffset = true; p.polygonOffsetFactor = -2; p.polygonOffsetUnits = -2; }
    m = o.glow ? new THREE.MeshBasicMaterial(p) : new THREE.MeshLambertMaterial({ ...p, flatShading: !!o.flat, emissive: o.emissive || '#000000' });
    const sw = o.sway, keep = p.side === THREE.DoubleSide && !o.glow && !o.flat;   // 両面の物は、うら から見ても同じ明るさにする（ひれ・葉が片側だけ暗くならない）
    m.onBeforeCompile = sh => { snap(sh); if (o.add) fogToBlack(sh); if (keep) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal=normalize(vNormal);');
      if (sw) { sh.uniforms.sTime = U.time; sh.uniforms.sP = { value: new THREE.Vector4(sw.amp ?? .2, sw.f ?? 1.2, sw.inv ? -(sw.k ?? 1) : (sw.k ?? 1), sw.inv ? 1 : 0) };
        sh.vertexShader = 'uniform float sTime;uniform vec4 sP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n{vec4 q=modelMatrix*vec4(transformed,1.);float w=clamp(sP.w+sP.z*uv.y,0.,1.);w*=w;transformed.x+=sin(sTime*sP.y+q.x*.9+q.z*.7+uv.y*1.4)*sP.x*w;transformed.z+=cos(sTime*sP.y*.8+q.x*.6-q.z*.8+uv.y)*sP.x*.6*w;}'); } };
    m.customProgramCacheKey = () => 'sea' + (sw ? 1 : 0) + (o.add ? 1 : 0) + (keep ? 1 : 0);
    matCache.set(key, m); return m; }
  const LZ = TR(0, 0, 0, 0, Math.PI / 2, 0);   // R.geo の loft（+y にのびる筒）を +z 向きにねかせる行列。断面の「うしろ」が上（せなか）、「前」が下（はら）になる
  const SEC6 = ngon(6, 0), SEC4D = ngon(4, 0), SEC8 = ngon(8, 0);
  // 面の向きを n の側へそろえて足す四角・三角（うらがえしを気にせずに書ける）
  const faceQ = (G, a, b, c, d, r = [0, 0, 1, 1], cs = 1, n = [0, 1, 0]) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], k = typeof cs === 'number' ? [cs, cs, cs, cs] : cs;
    if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0) G.quad(b, a, d, c, [r[2], r[1], r[0], r[3]], [k[1], k[0], k[3], k[2]]); else G.quad(a, b, c, d, r, k); return G; };
  const faceT = (G, a, b, c, ua, ub, uc, cs = 1, n = [0, 1, 0]) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], k = typeof cs === 'number' ? [cs, cs, cs] : cs;
    if ((uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2] < 0) G.tri(a, c, b, ua, uc, ub, [k[0], k[2], k[1]]); else G.tri(a, b, c, ua, ub, uc, k); return G; };
  // 上から見た絵をそのままはる、まるい山（こうら・かにの甲・金貨の山）。rings = [[半径の割合, 高さの割合], …]（上から下へ）。belly で底もふさぐ
  function domeP(G, o) { const n = o.n || 8, rx = o.rx, rz = o.rz ?? rx, h = o.h, y0 = o.y || 0, rg = o.rings || [[.62, .72], [1, 0]], uvr = o.uvr || 1, uv = p => [.5 + p[0] / (2 * rx) * uvr, .5 - p[2] / (2 * rz) * uvr], ring = ([f, yf]) => [...Array(n)].map((_, k) => { const a = (k + (o.rot ?? .5)) / n * TAU; return [Math.cos(a) * rx * f, y0 + h * yf, Math.sin(a) * rz * f]; }), A = [0, y0 + h, 0], Rg = rg.map(ring), sh = o.shade || [1, .95, .8, .7];
    for (let k = 0; k < n; k++) { const j = (k + 1) % n; G.tri(A, Rg[0][j], Rg[0][k], uv(A), uv(Rg[0][j]), uv(Rg[0][k]), [sh[0], sh[1], sh[1]]);
      for (let i = 0; i < Rg.length - 1; i++) { const Uk = Rg[i][k], Uj = Rg[i][j], Lk = Rg[i + 1][k], Lj = Rg[i + 1][j]; G.tri(Uk, Uj, Lj, uv(Uk), uv(Uj), uv(Lj), [sh[i + 1], sh[i + 1], sh[i + 2]]); G.tri(Uk, Lj, Lk, uv(Uk), uv(Lj), uv(Lk), [sh[i + 1], sh[i + 2], sh[i + 2]]); }
      if (o.belly) { const L = Rg[Rg.length - 1], C = [0, y0 + h * rg[rg.length - 1][1], 0]; G.tri(C, L[k], L[j], uv(C), uv(L[k]), uv(L[j]), .6); } }
    return G; }
  const pivot = (parent, x = 0, y = 0, z = 0) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; };
  const mesh = (G, m, parent) => { const me = new THREE.Mesh(G.build(), m); me.castShadow = !m.isMeshBasicMaterial && !m.transparent; me.receiveShadow = !m.transparent; if (parent) parent.add(me); return me; };

  // ================= 2. テクスチャ（どれも手で打ったドット絵。S.tex.名前(o) → THREE.Texture、S.paint.名前(o) → Px） =================
  const paint = {}, tex = {}, texCache = new Map();
  const def = (name, m, fn, cut = false) => { paint[name] = fn; tex[name] = (o = {}) => { const key = name + JSON.stringify(o); let t = texCache.get(key); if (!t) { t = T.from(fn(o), { m: o.m || m, cut: typeof cut === 'function' ? cut(o) : cut, name }); texCache.set(key, t); } return t; }; };
  const frames = (name, n = 4) => { const one = tex[name]; tex[name] = (o = {}) => [...Array(o.frames || n)].map((_, i) => one({ ...o, frames: o.frames || n, frame: i })); };
  // くり返せるボロノイ（石・こうら・光のあみ目）
  const voro = (x, y, W, n, sd = 0, jit = .9) => { const cs = W / n, gx = Math.floor(x / cs), gy = Math.floor(y / cs); let b1 = 1e9, b2 = 1e9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = gx + i, cy = gy + j, wx = md(cx, n), wy = md(cy, n), px = (cx + .5 + (hash(wx, wy, sd) - .5) * jit) * cs, py = (cy + .5 + (hash(wx, wy, sd + 9) - .5) * jit) * cs, d = Math.hypot(x + .5 - px, y + .5 - py); if (d < b1) { b2 = b1; b1 = d; id = wy * n + wx; } else if (d < b2) b2 = d; }
    return { id, d1: b1, d2: b2 }; };
  // ふじつぼ・も・さんごの芽を、打ってある絵の上にのせる。o = { grow: 0〜1, from: 'any'/'bottom'/'top'（どちら側に多いか）, algae, barnacle, dots（さんごの芽の色の並び。false でなし）, seed }
  function crust(P, o = {}) { const g = o.grow ?? .5, sd = o.seed || 0, W = P.w, H = P.h, A = ramp(o.algae || '#4f9a72'), B = ramp(o.barnacle || '#dcd6c0'), from = o.from || 'any'; if (g <= 0) return P;
    const side = y => from === 'bottom' ? y / H : from === 'top' ? 1 - y / H : .5;
    P.each((x, y, c) => { if (!c) return; const n = tn(x, y, 16, 16, W, H, sd + 40) * .6 + tn(x, y, 8, 8, W, H, sd + 41) * .4, th = 1 - g * (.52 + .5 * side(y)), ch = (x + y) & 1;
      if (n > th + .1) return tn(x, y, 4, 4, W, H, sd + 42) > .62 ? A[4] : ch ? A[2] : A[3]; if (n > th + .04) return ch ? A[2] : mix(c, A[2], .55); if (n > th) return ch ? mix(c, A[1], .5) : undefined; });
    const nb = Math.round(g * 16 * W * H / 4096), bm = { h: B[5], m: B[3], d: B[1], k: B[0] };
    for (let k = 0; k < nb; k++) { const x = Math.floor(hash(k, 1, sd + 50) * W), y0 = hash(k, 2, sd + 50), y = Math.floor((from === 'bottom' ? Math.sqrt(y0) : from === 'top' ? 1 - Math.sqrt(y0) : y0) * H); if (!P.get(x, y) || !P.get(x + 3, y + 3)) continue;
      if (k % 3) { P.bits(x, y, ['.hh.', 'hkmh', 'mkkm', '.mm.'], bm); if (k % 2) P.bits(x + 4, y + 1, ['hh', 'km', 'mm'], bm); } else P.bits(x, y, ['hm', 'kd'], bm); }
    const dc = o.dots === false ? [] : (o.dots || ['#f0808a', '#f4b04a', '#b08ae0']);
    for (let k = 0; k < Math.round(g * 7 * W * H / 4096) && dc.length; k++) { const x = Math.floor(hash(k, 3, sd + 60) * W), y = Math.floor(hash(k, 4, sd + 60) * H), c = dc[k % dc.length]; if (!P.get(x, y) || !P.get(x + 1, y + 2)) continue; P.set(x, y, mix(c, '#ffffff', .45)); P.set(x + 1, y, c); P.set(x, y + 1, c); P.set(x + 1, y + 1, mix(c, '#30204a', .35)); if (k % 2) { P.set(x - 1, y + 1, c); P.set(x, y + 2, mix(c, '#30204a', .35)); } }
    return P; }
  S.crust = crust;

  // ---- 海底 ----
  // 白い砂（波のあと・貝がら・小石）。c で色
  def('sand', 3, (o = {}) => { const c = o.c || '#efe4c2', P = R.paint.sand({ c, seed: o.seed }), A = ramp(c), sd = o.seed || 0;
    for (let k = 0; k < 6; k++) { const x = Math.floor(hash(k, 1, sd + 3) * 64), y = Math.floor(hash(k, 2, sd + 3) * 64); if (k % 3 === 0) P.bits(x, y, ['.ww.', 'wpsw', '.ss.', '.dd.'], { w: '#fffaf0', p: '#f6c0b4', s: '#e8d0c0', d: A[1] }); else if (k % 3 === 1) P.bits(x, y, ['.hh', 'hmd', '.dd'], { h: A[5], m: '#b8b0a8', d: A[1] }); else { P.set(x, y, A[1]); P.set(x + 1, y, A[2]); P.set(x + 2, y + 1, A[1]); } }
    return P; });
  // 光のあみ目（コースティクス）。黒地に白い線のコマの並び（加算で重ねる）。n（あみ目の数）
  const netAt = (x, y, f, nf, sd, n) => { const a = f / nf * TAU, xx = x + 3 * Math.sin(y / 64 * TAU * 2 + a) + 2 * Math.sin(y / 64 * TAU + a + 2), yy = y + 3 * Math.sin(x / 64 * TAU * 2 + a + 1.3) + 2 * Math.cos(x / 64 * TAU - a), v = voro(xx, yy, 64, n, sd, .95); return v.d2 - v.d1; };
  def('caustic', 6, (o = {}) => { const P = Px(64), sd = o.seed || 0, f = o.frame || 0, nf = o.frames || 4, n = o.n || 3;
    P.each((x, y) => { const e = netAt(x, y, f, nf, sd, n), e2 = netAt(x + 11, y + 23, (f + 2) % nf, nf, sd + 5, n + 1); return e < 1.1 ? '#ffffff' : e < 2 ? ((x + y) & 1 ? '#c0c0c0' : '#808080') : e2 < .9 ? '#585858' : e < 3.2 && ((x + y) & 1) ? '#383838' : '#000000'; }); return P; }); frames('caustic');
  // 水面を下から見上げた絵（きらめく）。c = 明るい水の色。kind: 'water' / 'ice'（ひびのある氷。動かない）
  def('under', 8, (o = {}) => { const P = Px(64), W = ramp(o.c || '#7fd8e8', 6, { warm: .45, cool: .6 }), sd = o.seed || 0, f = o.frame || 0, nf = o.frames || 4;
    if (o.kind === 'ice') { const I = ramp(o.c || '#bfe6ee', 6, { cool: .58 }); P.each((x, y) => { const v = voro(x, y, 64, 3, sd + 2, .9), e = v.d2 - v.d1, n = tn(x, y, 16, 16, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 1) * .4, t = 2 + (v.id * 7 % 3); return e < 1 ? '#ffffff' : e < 2.2 ? I[5] : n > .68 ? I[Math.min(5, t + 2)] : n < .3 ? I[t - 1] : n < .36 && ((x + y) & 1) ? I[t - 1] : I[t]; });
      for (let k = 0; k < 9; k++) { const x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64); P.bits(x, y, ['.w.', 'whw', '.w.'], { w: I[5], h: '#ffffff' }); } return P; }
    P.each((x, y) => { const e = netAt(x, y, f, nf, sd, 3), n = tn(x, y, 32, 32, 64, 64, sd + 3); return e < 1.6 ? '#ffffff' : e < 3 ? W[5] : e < 4.6 ? ((x + y) & 1 ? W[5] : W[4]) : n > .6 ? W[4] : n < .3 ? W[2] : W[3]; }); return P; }); frames('under');
  // 上からさす光のすじ（黒地。加算で重ねる）。下へ行くほど うすくなる
  def('shaft', 8, (o = {}) => { const P = Px(32, 64), sd = o.seed || 0; P.each((x, y) => { const col = tn(x, 0, 4, 4, 32, 4, sd) * .7 + tn(x, 0, 2, 4, 32, 4, sd + 1) * .3, edge = Math.min(1, Math.min(x, 31 - x) / 7), fade = Math.pow(1 - y / 63, 1.25), v = col * edge * fade * 1.5 + ((x + y) & 1 ? .04 : -.04) + (((x >> 1) + y) % 3 === 0 ? .03 : 0), q = Math.floor(cl(v) * 5) / 5 * 255 | 0; return '#' + q.toString(16).padStart(2, '0').repeat(3); }); return P; });
  // ただよう粒と あわ（8 ドット）
  def('bubble', 1, () => { const P = Px(16, 8); P.clip = true; P.bits(0, 0, ['..hhhh..', '.hw..mh.', 'hw....mh', 'h......h', 'h......m', 'hm....mm', '.mm..mm.', '..mmmm..'], { h: '#f4ffff', w: '#ffffff', m: '#a8e0f0' }); P.bits(10, 2, ['.hh.', 'hwmh', 'hmmh', '.hh.'], { h: '#e8fcff', w: '#ffffff', m: '#b8e8f4' }); return P; }, true);

  // ---- さんご・いそぎんちゃく・海草 ----
  // さんごの はだ。kind: 'pore'（つぶつぶ：枝・ゆび・つつ）/ 'brain'（のうさんごの みぞ）/ 'cell'（テーブルさんごの小さなへや）
  def('coral', 1.2, (o = {}) => { const kind = o.kind || 'pore', S0 = kind === 'cell' ? 64 : 32, P = Px(S0), C = ramp(o.c || '#f0705a'), sd = o.seed || 0, tip = o.tip || C[5];
    if (kind === 'brain') { P.each((x, y) => { const w = Math.sin((x + 5 * Math.sin(y / 32 * TAU + 1) + 3 * Math.sin(y / 32 * TAU * 2 + x / 32 * TAU)) / 32 * TAU * 4), w2 = Math.sin((x + 1 + 5 * Math.sin((y - 1) / 32 * TAU + 1) + 3 * Math.sin((y - 1) / 32 * TAU * 2 + (x + 1) / 32 * TAU)) / 32 * TAU * 4); return w > .55 ? (w2 < w ? C[5] : C[4]) : w > -.1 ? C[3] : w > -.6 ? C[2] : C[1]; }); for (let k = 0; k < 5; k++) P.set(hash(k, 1, sd) * 32, hash(k, 2, sd) * 32, C[0]); return P; }
    if (kind === 'cell') { P.each((x, y) => { const v = voro(x, y, 64, 9, sd), e = v.d2 - v.d1, t = 2 + (v.id * 5 % 3) * .5; return e < 1 ? C[1] : v.d1 < 1.2 ? C[5] : v.d1 < 2.2 ? C[Math.round(t) + 1] : e < 2 && ((x + y) & 1) ? C[1] : C[Math.round(t)]; }); return P; }
    P.each((x, y) => { const n = tn(x, y, 16, 16, 32, 32, sd) * .6 + tn(x, y, 8, 8, 32, 32, sd + 1) * .4; return n > .62 ? C[4] : n < .36 ? C[2] : C[3]; });
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const x = i * 4 + (j & 1) * 2 + (hash(i, j, sd) > .7 ? 1 : 0), y = j * 4 + (hash(i, j, sd + 1) > .7 ? 1 : 0); P.set(x, y, tip); P.set(x + 1, y, C[4]); P.set(x, y + 1, C[1]); P.set(x + 1, y + 1, C[1]); }
    return P; });
  // うちわさんご（あみ目の切りぬき。1 枚の板にはる）
  def('fan', 1, (o = {}) => { const P = Px(48), C = ramp(o.c || '#e85a8a'), sd = o.seed || 0; P.clip = true; const cx = 24, cy = 47;
    P.each((x, y) => { const dx = x + .5 - cx, dy = cy - y, r = Math.hypot(dx, dy), a = Math.atan2(dx, dy), lim = 44 + 3 * Math.sin(a * 5 + sd); if (r > lim || Math.abs(a) > 1.25 || dy < 0) return null;
      const rib = Math.abs(md(a * (7 + Math.floor(r / 14) * 6) / 2.5 + .5 + hash(Math.floor(r / 14), 3, sd) * .4, 1) - .5), ring = md(r + 2 * Math.sin(a * 6), 5), main = Math.abs(md(a * 7 / 2.5 + .5, 1) - .5) * r;
      if (r < 6) return Math.abs(dx) < 2 ? C[2] : null; if (main < 1.1) return r > lim - 2 ? C[5] : C[3]; if (rib * r / (1 + Math.floor(r / 14)) < .55) return r > lim - 2 ? C[5] : C[4]; if (ring < 1 && r > 9) return r > lim - 1.5 ? C[5] : C[3]; if (r > lim - 1) return C[4]; return null; });
    return P; }, true);
  // いそぎんちゃく（左半分＝しょくしゅ：下が根もと。右半分＝どう）。c = しょくしゅ、tip = 先の色、body = どうの色
  def('anemone', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#f0a060'), B = ramp(o.body || '#c8506a'), tip = o.tip || '#fff2c0';
    P.each((x, y) => { if (x < 16) { const k = 1 - y / 31, sx = x & 7; return k > .86 ? (sx > 1 && sx < 6 ? tip : mix(tip, C[4], .5)) : k > .78 ? C[5] : sx === 0 || sx === 7 ? C[1] : sx === 1 ? C[2] : sx < 4 ? (y % 6 === 0 ? C[4] : C[3]) : sx === 4 ? C[5] : C[4]; }
      const sx = (x - 16) & 3; return y < 3 ? B[5] : y < 5 ? B[4] : sx === 0 ? B[1] : sx === 1 ? (y % 5 === 0 ? B[4] : B[2]) : (y + x) % 7 === 0 ? B[5] : B[3]; }); return P; });
  // 昆布（たてにくり返す切りぬきの帯。まん中のくきから、葉が左右に出る）。kind: 'kelp' / 'ribbon'（細長い葉がまっすぐ）
  def('kelp', 1, (o = {}) => { const P = Px(32, 64), C = ramp(o.c || '#7a9a3a'), sd = o.seed || 0, kind = o.kind || 'kelp'; P.clip = false;
    if (kind === 'ribbon') { for (let b = 0; b < 3; b++) { const bx = 5 + b * 10; for (let y = 0; y < 64; y++) { const x = bx + Math.round(2.2 * Math.sin(y / 64 * TAU * (b === 1 ? 1 : 2) + b * 2)), w = b === 1 ? 3 : 2; for (let i = -w; i <= w; i++) P.set(x + i, y, i === -w ? C[1] : i === w ? C[4] : i === 0 ? C[2] : (y + b * 5) % 9 === 0 ? C[4] : C[3]); } } P.clip = true; return P; }
    for (let y = 0; y < 64; y++) { const x = 16 + Math.round(1.5 * Math.sin(y / 64 * TAU * 2)); P.set(x, y, C[2]); P.set(x + 1, y, C[1]); }
    for (let k = 0; k < 6; k++) { const y0 = k * 10.67 + 3, sx = k % 2 ? 1 : -1, x0 = 16 + Math.round(1.5 * Math.sin(y0 / 64 * TAU * 2)) + (sx > 0 ? 1 : 0), len = 11 + Math.floor(hash(k, 1, sd) * 3);
      for (let i = 0; i < len; i++) { const u = i / (len - 1), w = Math.round(1 + 3.2 * Math.sin(Math.PI * Math.pow(u, .7))), yc = y0 - i * .75 - 2.5 * Math.sin(u * 2.4); for (let j = -w; j <= w; j++) { const yy = Math.round(yc + j), e = j === -w || j === w || i === len - 1; P.set(x0 + sx * (i + 1), yy, e ? (j < 0 ? C[4] : C[1]) : j === 0 ? C[2] : (i + j) % 4 === 0 ? C[4] : C[3]); } }
      P.set(x0 + sx, Math.round(y0), '#d8c060'); P.set(x0 + sx, Math.round(y0) - 1, '#f0e090'); P.set(x0 + sx * 2, Math.round(y0), '#b89a40'); }
    P.clip = true; return P; }, true);
  // 海草のしげみ（切りぬき）
  def('seagrass', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#4fa86a'), sd = o.seed || 0; P.clip = true;
    for (let b = 0; b < 9; b++) { const x0 = 3 + b * 3.2 + hash(b, 1, sd) * 2, h = 14 + hash(b, 2, sd) * 16, lean = (hash(b, 3, sd) - .5) * 9, t = 2 + (b % 3); for (let i = 0; i < h; i++) { const u = i / h, x = Math.round(x0 + lean * u * u + Math.sin(u * 5 + b) * 1.2), y = 31 - i; P.set(x, y, C[Math.min(5, t + (u > .7 ? 1 : 0))]); if (u < .75) P.set(x + 1, y, C[t - 1]); if (i === Math.floor(h) - 1) P.set(x, y, C[5]); } }
    return P; }, true);

  // ---- ふじつぼ・も のついた物（沈んだ木・石・鉄・コンクリート） ----
  // どのテクスチャにも「水の中に長くあった」あとをのせる。base = R.paint の名前（'planks' 'boards' 'stone' 'rock' 'concrete' 'brick' 'cobble' 'metal' 'windowWall' …）、o = その引数、あとは crust の引数
  def('grown', 3, (o = {}) => { const base = o.base || 'planks', P = R.paint[base](o.o || {}); return crust(P, { grow: o.grow ?? .5, from: o.from, algae: o.algae, barnacle: o.barnacle, dots: o.dots, seed: o.seed }); }, o => !!o.cut);
  // 神殿の柱（たてのみぞ＋つなぎ目＋ひび。下からも がのぼる）。よこ 64 ドットで 1 周
  def('column', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#d8d2c0', 6, { contrast: .85 }), sd = o.seed || 0;
    P.each((x, y) => { const f = x & 7, j = y & 31; let t = [1, 2, 3, 4, 5, 4, 3, 2][f]; if (j === 0) t = 1; else if (j === 1) t = Math.min(5, t + 1); else if (j === 31) t = Math.max(1, t - 1); if (tn(x, y, 16, 16, 64, 64, sd) > .7 && t > 1) t -= 1; return C[t]; });
    for (let k = 0; k < 4; k++) { let x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(hash(k, 2, sd) * 64); for (let i = 0; i < 9; i++) { P.set(x, y, C[0]); P.set(x + 1, y, C[5]); y++; if (hash(k, i, sd + 3) > .5) x += hash(k, i, sd + 4) > .5 ? 1 : -1; } }
    return crust(P, { grow: o.grow ?? .5, from: 'bottom', seed: sd }); });
  // 沈んだ船の帆（やぶれた布。切りぬき）
  def('sail', 3, (o = {}) => { const P = Px(64), C = ramp(o.c || '#d8d0b8'), sd = o.seed || 0; P.clip = true;
    P.each((x, y) => { const hole = tn(x, y, 16, 16, 64, 64, sd) * .6 + tn(x, y, 8, 8, 64, 64, sd + 1) * .4, low = y / 63, edge = 56 - 12 * tn(x, 0, 8, 8, 64, 8, sd + 2) - (x % 16 < 3 ? 14 * hash(x >> 4, 1, sd) : 0); if (y > edge || hole > .78 - .22 * low) return null; const st = y % 12; return st === 0 ? C[1] : st === 1 ? C[4] : hole > .7 - .22 * low ? C[1] : tn(x, y, 8, 16, 64, 64, sd + 5) > .6 ? C[4] : x % 16 === 8 ? C[2] : C[3]; });
    return crust(P, { grow: o.grow ?? .5, from: 'bottom', dots: false, seed: sd }); }, true);
  // つぼ（素焼き＋もよう）。よこ 64 ドットで 1 周
  def('pot', 2, (o = {}) => { const P = Px(64, 32), C = ramp(o.c || '#c87a4a'), D = ramp(o.c2 || '#3a3048'), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 16, 8, 64, 32, sd); if (y === 6 || y === 16 || y === 24) return D[2]; if (y === 7 || y === 17) return C[5]; if (y > 8 && y < 15) { const q = x & 7, r = y - 9; return ['#####...', '....#...', '.##.#...', '.#..#...', '.####...', '........'][r][q] === '#' ? D[2] : C[3]; } if (y > 17 && y < 24) return ((x + (y & 1) * 2) & 3) === 0 ? D[3] : C[3]; return n > .62 ? C[4] : n < .35 ? C[2] : C[3]; });
    return crust(P, { grow: o.grow ?? .4, from: 'bottom', seed: sd }); });
  // 宝箱（左上＝箱の横：木と鉄の帯と かぎ。右上＝ふた。左下＝金貨と宝石。右下＝箱の内がわ）
  def('chest', 1, (o = {}) => { const P = Px(64), W = ramp(o.c || '#8a5a34'), I = ramp(o.iron || '#6a6a78'), G = ramp('#f0c030', 6, { warm: .15, cool: .08 }), sd = o.seed || 0;
    for (const ox of [0, 32]) for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const pl = y % 8, band = x < 3 || x > 28 || (x > 13 && x < 18); let c = pl === 0 ? W[1] : pl === 1 ? W[4] : (x * 3 + y * 7) % 11 === 0 ? W[2] : W[3]; if (band) c = x === 0 || x === 14 || x === 29 ? I[4] : x === 2 || x === 17 || x === 31 ? I[1] : y % 8 === 4 ? I[5] : I[3]; if (y < 2 || y > 29) c = y === 0 || y === 30 ? I[4] : I[2]; P.set(ox + x, y, c); }
    P.bits(13, 3, ['.gggg.', 'gGGGGg', 'gGkkGd', 'gGkkGd', 'gGGkGd', '.dddd.'], { g: G[4], G: G[3], k: '#2a2030', d: G[1] });
    P.rect(0, 32, 32, 32, G[2]); for (let k = 0; k < 46; k++) { const x = Math.floor(hash(k, 1, sd) * 29), y = 33 + Math.floor(hash(k, 2, sd) * 28); P.bits(x, y, ['.hh.', 'hGGg', 'gGgd', '.dd.'], { h: '#fff8c0', G: G[4], g: G[3], d: G[1] }); }
    [['#e8405a', 5, 38], ['#4aa8f0', 20, 46], ['#5ad88a', 11, 55], ['#e8405a', 24, 57], ['#c88af0', 26, 36]].forEach(([c, x, y]) => P.bits(x, y, ['.hc.', 'hccd', 'ccdd', '.dd.'], { h: '#ffffff', c, d: mix(c, '#201030', .45) }));
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) P.set(32 + x, 32 + y, y % 8 === 0 ? W[0] : (x + y * 3) % 9 === 0 ? W[0] : W[1]);
    return P; });
  // ドームのほね組み（わくだけ残した切りぬき。1 ますに 1 枚）と、ガラスのつや
  def('domeFrame', 1, (o = {}) => { const P = Px(32), M = ramp(o.c || '#c8a85a'); P.clip = true; P.each((x, y) => { const ex = Math.min(x, 31 - x), ey = Math.min(y, 31 - y); if (ex > 2 && ey > 2) return ex + ey === 6 || ex + ey === 7 ? M[2] : null; return ex === 0 || ey === 0 ? M[1] : ex === 1 || ey === 1 ? ((x + y) % 8 === 0 ? M[1] : M[4]) : M[3]; }); return P; }, true);
  def('glass', 4, (o = {}) => { const P = Px(32), C = ramp(o.c || '#bfeef8'); P.each((x, y) => { const d = md(x + y, 32); return d < 3 ? '#ffffff' : d < 5 ? C[5] : d > 14 && d < 16 ? C[5] : (x - y + 64) % 32 < 1 ? C[4] : C[3]; }); return P; });
  // ダイバーの道具（左上＝タンク、右上＝ガラス、右中＝足ひれ、左下＝ゴムの帯、中下＝金物）
  def('gear', 1, (o = {}) => { const P = Px(64), Tk = ramp(o.tank || '#f0c23a'), F = ramp(o.fin || '#f06a4a'), Rb = ramp('#3a3a4a'), M = ramp(o.metal || '#b8a060'), Gl = ramp('#8fd8f0', 6, { cool: .6 });
    for (let y = 0; y < 48; y++) for (let x = 0; x < 32; x++) { const sx = x & 15, t = [1, 2, 3, 4, 5, 4, 4, 3, 3, 3, 3, 3, 2, 2, 1, 1][sx]; P.set(x, y, y < 4 ? M[Math.min(5, t)] : y < 6 ? Rb[2] : (y > 18 && y < 23) || (y > 36 && y < 40) ? Rb[y === 19 || y === 37 ? 4 : 2] : y > 44 ? Tk[Math.max(0, t - 2)] : Tk[t]); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) { const e = x < 2 || x > 29 || y < 2 || y > 13, d = x - y; P.set(32 + x, y, e ? (x === 0 || y === 0 ? Rb[4] : Rb[2]) : d === 6 || d === 7 || d === 12 ? '#ffffff' : y > 9 ? Gl[2] : y > 5 ? Gl[3] : Gl[4]); }
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const sx = x & 7; P.set(32 + x, 16 + y, y < 3 ? Rb[3] : x === 0 || x === 31 ? F[1] : sx === 0 ? F[1] : sx === 1 ? F[5] : y > 28 ? F[5] : (y & 7) === 0 ? F[2] : F[3]); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.set(x, 48 + y, y % 4 === 0 ? Rb[4] : (x + y) % 5 === 0 ? Rb[1] : Rb[2]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) P.set(16 + x, 48 + y, y === 0 || x === 0 ? M[5] : y === 15 || x === 15 ? M[1] : (x % 5 === 2 && y % 5 === 2) ? M[1] : (x % 5 === 2 && y % 5 === 1) ? M[5] : M[3]);
    return P; });
  // ---- 生きもの（どれも 1 枚に体とひれをまとめた絵。体は「よこ＝体のまわり 1 周（左はしと右はしが せなか、まん中が はら）、たて＝頭（上）からしっぽ（下）」） ----
  const KK = '#1a1a2a', FISHC = { clown: ['#f07a2a', '#ffffff', '#f07a2a'], angel: ['#f6d23a', '#3a4aa0', '#f6d23a'], tang: ['#3a7ae0', '#f6d23a', '#f6d23a'], parrot: ['#3ab8a8', '#f08aa8', '#f08aa8'], grouper: ['#c8704a', '#f4dcb8', '#a85a3a'], silver: ['#8ab4d8', '#f4e060', '#a8c8e0'], butter: ['#fff2c8', '#f0a030', '#f6d23a'] };
  // 魚。kind: 'clown'（オレンジに白い帯）/ 'angel'（黄に青い帯。たて長）/ 'tang'（青に黄のしっぽ）/ 'parrot'（青緑とピンク。大きめ）/ 'grouper'（茶に水玉。大きい）/ 'silver'（群れ用。銀に黄の線）/ 'butter'（白に だいだいの帯）。c, c2, fin で色
  def('fish', 1, (o = {}) => { const kind = o.kind || 'clown', F0 = FISHC[kind] || FISHC.clown, C = ramp(o.c || F0[0]), D = ramp(o.c2 || F0[1]), F = ramp(o.fin || F0[2]), P = Px(64), Wh = ramp('#f4f6f8', 6, { cool: .62 }); P.clip = true;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++) { const sx = x < 32 ? x : 63 - x, kx = sx / 31, sc = (sx + ((y >> 1) & 1) * 2) & 3, ev = (y & 1) === 0; let c = kx < .16 ? C[2] : kx > .8 ? C[4] : ev && sc === 0 ? C[2] : ev && sc === 1 ? C[4] : C[3];
      if (kind === 'clown') { if ((y >= 8 && y <= 11) || (y >= 20 && y <= 24) || (y >= 34 && y <= 37)) c = kx < .16 ? Wh[2] : Wh[4]; if ([7, 12, 19, 25, 33, 38].includes(y)) c = KK; }
      if (kind === 'angel') { if ((y >= 10 && y <= 12) || (y >= 20 && y <= 22) || (y >= 30 && y <= 32)) c = D[2]; if ([9, 13, 19, 23, 29, 33].includes(y)) c = D[4]; if (y < 5) c = C[4]; }
      if (kind === 'butter') { if (y >= 4 && y <= 6) c = KK; if ((y >= 14 && y <= 17) || (y >= 27 && y <= 30)) c = D[3]; if (y > 35) c = D[4]; }
      if (kind === 'tang') { if (y > 9 && y < 35 && kx > .22 && kx < .22 + .42 * Math.sin(Math.PI * (y - 9) / 26)) c = (y + sx) % 5 === 0 ? '#2a3a8a' : '#1a2460'; if (y > 34) c = D[y > 36 ? 3 : 4]; }
      if (kind === 'parrot') { if (kx > .72) c = D[4]; else if (ev && sc === 0) c = D[3]; if (kx < .16) c = mix(C[2], '#3a5ac0', .4); if (y < 4) c = y < 2 ? '#fff4c8' : '#f0d890'; if (y > 35) c = D[3]; }
      if (kind === 'grouper') { if (kx > .78) c = D[3]; else if (hash(sx >> 1, y >> 1, 3) > .78) c = (sx + y) & 1 ? D[4] : D[5]; }
      if (kind === 'silver') { c = kx < .2 ? C[2] : kx < .36 ? (ev && sc === 0 ? C[2] : C[3]) : kx < .44 ? D[3] : kx < .7 ? (ev && sc === 0 ? Wh[2] : Wh[3]) : Wh[4]; }
      P.set(x, y, c); }
    for (const ex of [14, 45]) { P.bits(ex, 3, ['.www.', 'wkkkw', 'wkkhw', 'wkkkw', '.www.'], { w: '#ffffff', k: KK, h: '#ffffff' }); P.set(ex + 1, 4, '#ffffff'); }
    for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) { const dy = Math.abs(j - 11.5), half = 2.5 + i * .42, notch = i > 15 ? (i - 15) * .8 : 0; if (dy > half || dy < notch) continue; P.set(i, 40 + j, i < 2 ? C[3] : dy > half - 1.2 || dy < notch + 1 || i === 23 ? F[1] : (j + (i >> 1)) % 3 === 0 ? F[2] : i > 19 ? F[5] : F[3]); }
    for (let i = 0; i < 24; i++) { const ht = 2 + 9 * Math.sin(Math.PI * Math.pow(i / 23, .55)); for (let j = 0; j < 12; j++) { const up = 11 - j; if (up > ht) continue; P.set(24 + i, 40 + j, up > ht - 1.3 ? F[1] : up < 2 ? C[3] : (i + up) % 4 === 0 ? F[2] : F[3]); P.set(24 + i, 52 + j, up > ht - 1.3 ? F[3] : (i + up) % 4 === 0 ? F[4] : F[5]); } }
    return P; }, true);
  // うみがめ（左上＝こうら、右上＝はだ、中＝頭の 1 周、左下＝はら）
  def('turtle', 1, (o = {}) => { const P = Px(64), Sh = ramp(o.c || '#7a8a44'), Sk = ramp(o.skin || '#dce09c'), Dk = ramp(o.dark || '#4a7450');
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = x - 15.5, dy = y - 15.5, r = Math.hypot(dx, dy * .92), v = voro(x, y * 1.15 + 3, 32, 3, 7, .35), e = v.d2 - v.d1; let c; if (r > 12.3) { const a = Math.floor((Math.atan2(dy, dx) + Math.PI) / TAU * 14); c = r > 15 ? Sh[1] : r < 13.1 ? '#ece0a0' : a & 1 ? Sh[2] : Sh[4]; } else c = e < 1.3 ? '#ece0a0' : v.d1 < 1.6 ? Sh[5] : Math.floor(v.d1 / 1.8) & 1 ? Sh[3] : Sh[2]; P.set(x, y, c); }
    const skin = (x, y) => { const v = voro(x, y, 32, 5, 3, .8), e = v.d2 - v.d1; return e < 1.4 ? Sk[4] : v.d1 < 1.3 ? Dk[4] : v.id % 3 ? Dk[3] : Dk[2]; };
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) P.set(32 + x, y, skin(x, y));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 64; x++) { const sx = x < 32 ? x : 63 - x; P.set(x, 32 + y, sx > 23 ? (y % 5 === 4 ? Sk[3] : Sk[4]) : sx < 5 ? Dk[2] : skin(x, y + 7)); if (y === 4 && sx > 16 && sx < 30) P.set(x, 32 + y, Dk[1]); if (y === 3 && sx === 16) P.set(x, 32 + y, Dk[1]); }
    for (const ex of [11, 49]) P.bits(ex, 37, ['.ww.', 'wkkw', 'wkhw', '.ww.'], { w: Sk[5], k: KK, h: '#ffffff' });
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) P.set(x, 48 + y, x % 11 === 0 || y % 8 === 0 ? Sk[2] : (x + y) % 9 === 0 ? Sk[5] : Sk[4]);
    return P; });
  // えい（上半分＝せなか：よこが つばさのはしからはしまで。下半分＝はら）
  def('manta', 1, (o = {}) => { const P = Px(64), C = ramp(o.c || '#5a80bc'), W = ramp('#f2f4f8', 6, { cool: .62 });
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const dx = Math.abs(x - 31.5), n = tn(x, y, 16, 16, 64, 32, 2); let c = dx < 2 ? C[1] : dx < 7 ? C[2] : n > .62 ? C[4] : n < .34 ? C[2] : C[3]; const sh = Math.hypot((dx - 12) / 7.5, (y - 8) / 3.5); if (sh < 1) c = sh > .8 && ((x + y) & 1) ? C[4] : W[4]; if (dx > 27) c = C[4]; if (y > 28) c = C[2]; if (hash(x >> 1, y >> 1, 5) > .93 && dx > 8) c = C[5]; P.set(x, y, c);
      const e = Math.hypot((dx - 4) / 28, (y - 14) / 17); let b = e > .85 ? W[2] : e > .7 && ((x + y) & 1) ? W[2] : W[4]; if (dx > 5 && dx < 11 && y > 8 && y < 20 && (y & 3) === 1 && dx - 5 < 5) b = C[2]; if (y === 2 && dx < 4) b = C[1]; P.set(x, 32 + y, b); }
    for (const ex of [25, 37]) { P.set(ex, 2, KK); P.set(ex + 1, 2, KK); P.set(ex, 3, KK); P.set(ex + 1, 3, '#ffffff'); }
    return P; });
  // たこ（上半分＝頭のふくろ 1 周：下のほうに目。下半分＝うで 1 周：まん中が きゅうばんのある下がわ）
  def('octo', 1, (o = {}) => { const P = Px(64), C = ramp(o.c || '#e8683a'), W = ramp(o.c2 || '#f8dcc8');
    for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { const n = tn(x, y, 16, 16, 64, 32, 1) * .6 + tn(x, y, 8, 8, 64, 32, 2) * .4; P.set(x, y, n > .62 ? C[4] : n < .36 ? C[2] : C[3]); const sx = x < 32 ? x : 63 - x; P.set(x, 32 + y, sx < 9 ? (hash(x >> 1, y >> 1, 4) > .8 ? C[5] : C[3]) : sx < 13 ? C[2] : sx < 19 ? ((x + y) & 1 ? C[2] : W[2]) : W[3]); }
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) { if (hash(i, j, 6) > .6) continue; const x = i * 8 + Math.floor(hash(i, j, 7) * 5), y = j * 7 + Math.floor(hash(i, j, 8) * 4); P.bits(x, y, ['.p.', 'pcp', '.d.'], { p: W[4], c: C[5], d: C[1] }); }
    for (const ex of [13, 45]) { P.bits(ex, 21, ['.hhhh.', 'yyyyyy', 'ykkkky', 'yyyyyy', '.dddd.'], { h: C[5], y: '#f8e468', k: KK, d: C[1] }); }
    for (let y = 0; y < 32; y += 4) for (const x of [25, 36]) { P.bits(x, 32 + y, ['.ww.', 'wppw', '.ww.'], { w: '#ffffff', p: '#f0a0a8' }); }
    return P; });
  // くらげ。kind: 'bell'（かさ。上がてっぺん）/ 'arms'（たれる うでの切りぬき。上が根もと）
  def('jelly', 1, (o = {}) => { const C = ramp(o.c || '#f0a0d8', 6, { cool: .78, warm: .95 }), kind = o.kind || 'bell', P = kind === 'bell' ? Px(32) : Px(32, 64); P.clip = true;
    if (kind === 'bell') { P.each((x, y) => { const q = x & 3, lp = Math.hypot(((x & 7) - 3.5) / 2.6, (y - 11) / 4.5); if (y > 27) return q === 2 ? '#ffffff' : y === 28 ? C[5] : C[4]; if (lp < 1 && lp > .55) return C[2]; if (lp <= .55) return C[5]; return q === 0 ? C[5] : y < 6 ? C[4] : (x + y) % 6 === 0 ? C[4] : C[3]; }); return P; }
    for (const [x0, w, a, f, p] of [[4, 0, 2, 2, 0], [11, 0, 2.5, 1.5, 2], [27, 0, 2, 2, 4], [21, 0, 2.5, 1.5, 1], [16, 2, 3, 3, 3]]) for (let y = 0; y < (w ? 40 : 64); y++) { const x = Math.round(x0 + a * Math.sin(y / 64 * TAU * f + p)); for (let i = -w; i <= w; i++) P.set(x + i, y, w ? (i === -w || i === w ? ((y & 3) < 2 ? C[5] : null) : (y + i) % 4 === 0 ? C[5] : C[4]) : y % 5 === 0 ? '#ffffff' : (y & 1) || y < 40 ? C[4] : null); }
    return P; }, o => o.kind === 'arms');
  // いるか・くじら（体 1 周 × 鼻先からしっぽ）。kind: 'dolphin' / 'whale'
  def('whale', 1, (o = {}) => { const wh = o.kind === 'whale', P = Px(64), C = ramp(o.c || (wh ? '#3a5a8c' : '#6a8cb4')), W = ramp(o.c2 || '#f2f0ee', 6, { cool: .62 });
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const sx = x < 32 ? x : 63 - x, edge = (wh ? 15 : 13) + Math.round(2.5 * Math.sin(y / 9 + 1)) + (y < 10 ? 5 : 0), n = tn(x, y, 16, 16, 64, 64, 3); let c = sx < 3 ? C[2] : sx < edge - 4 ? (n > .64 ? C[4] : C[3]) : sx < edge ? ((x + y) & 1 ? C[3] : C[4]) : sx < edge + 2 ? ((x + y) & 1 ? C[4] : W[3]) : W[4];
      if (wh && sx >= edge + 1 && y > 3 && y < 34 && sx % 3 === 0) c = W[2]; if (wh && y < 9 && sx < 9 && hash(sx >> 1, y >> 1, 2) > .7) c = C[5];
      const my = wh ? 17 : 12, mx = wh ? 19 : 18; if (y < my && sx === mx) c = C[0]; if (y >= my && y < my + 2 && sx === mx - 1 - (y - my)) c = C[0]; P.set(x, y, c); }
    for (const ex of wh ? [15, 46] : [13, 48]) P.bits(ex, wh ? 18 : 13, ['.ww.', 'wkkw', 'wkhw', '.ww.'], { w: C[5], k: KK, h: '#ffffff' });
    if (wh) for (let k = 0; k < 12; k++) { const x = Math.floor(hash(k, 1, 9) * 64), y = 6 + Math.floor(hash(k, 2, 9) * 50); P.set(x, y, '#ffffff'); P.set(x + 1, y, '#d8d8d0'); P.set(x, y + 1, '#d8d8d0'); }
    return P; });
  // かに（左＝こうら：下が前。右上＝足と はさみの切りぬき）
  def('crab', 1, (o = {}) => { const P = Px(64, 32), C = ramp(o.c || '#e8553a'); P.clip = true;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = Math.abs(x - 15.5), n = tn(x, y, 8, 8, 32, 32, 1); let c = y < 9 ? C[4] : y > 25 ? ((x >> 1) & 1 ? C[5] : C[2]) : n > .66 ? C[4] : C[3]; if ((dx > 3 && dx < 5 && y > 10 && y < 22) || (y === 16 && dx < 4) || (y === 10 && dx > 4 && dx < 10)) c = C[1]; if (hash(x >> 1, y >> 1, 3) > .9 && y < 24) c = C[5]; P.set(x, y, c); }
    P.line(32, 4, 41, 3, C[3]); P.line(32, 5, 41, 4, C[2]); P.line(32, 3, 41, 2, C[4]); P.line(41, 3, 46, 14, C[3]); P.line(42, 3, 47, 14, C[2]); P.set(41, 3, C[1]); P.set(46, 14, '#fff4e0'); P.set(47, 15, '#fff4e0'); P.set(36, 4, C[1]);
    P.bits(48, 0, ['..........hhh...', '.......hhccccc..', '.....hhcccccddw.', '....hccccdd.....', '...hcccd........', 'hhhcccchhhh.....', 'cccccccccccch...', 'dddccccddddcccw.', '...dddd....ddd..'], { h: C[5], c: C[3], d: C[1], w: '#fff4e0' });
    P.rect(32, 16, 32, 16, C[3]); P.bits(32, 16, ['kkkk', 'khkk', 'kkkk', 'kkkk'], { k: KK, h: '#ffffff' });
    return P; }, true);
  // 貝・ひとで・うに（左上＝貝のすじ：下がちょうつがい。右上＝ひとでの はだ。左下＝うにのとげの切りぬき。右下＝うにの体としんじゅ）
  def('bits', 1, (o = {}) => { const P = Px(64), C = ramp(o.c || '#f4c0c8'), St = ramp(o.star || '#f0863a'), Ur = ramp(o.urchin || '#5a4490'); P.clip = true;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = x - 15.5, dy = 34 - y, a = Math.atan2(dx, dy), r = Math.hypot(dx, dy), rib = md(a * 9, 1); P.set(x, y, md(r, 8) < 1 ? C[2] : rib < .2 ? C[1] : rib < .5 ? C[5] : md(r, 8) > 5 ? C[4] : C[3]);
      const n = tn(x, y, 8, 8, 32, 32, 4); P.set(32 + x, y, (x & 3) === 1 && (y & 3) === 1 ? '#fff0c8' : (x & 3) === 2 && (y & 3) === 2 ? St[1] : n > .6 ? St[4] : St[3]); P.set(32 + x, 32 + y, y > 15 ? ((x + y) % 7 === 0 ? '#ffffff' : y > 26 ? '#d8d0e8' : '#f8f4ff') : (x & 3) === 0 && (y & 3) === 0 ? Ur[5] : Ur[2]); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + .1, L = 11 + (k % 3) * 2; for (let i = 2; i < L; i++) { const x = 16 + Math.cos(a) * i, y = 48 + Math.sin(a) * i; P.set(x, y, i > L - 3 ? '#d8b8ff' : i > L - 6 ? Ur[4] : Ur[2]); } } P.disc(16, 48, 3, Ur[1]);
    return P; }, true);
  // かもめ（上＝体 1 周：上がくちばし。下＝つばさ：左が根もと）
  def('gull', 1, (o = {}) => { const P = Px(32), G = ramp(o.c || '#aab4c4', 6, { cool: .62 }), W = '#f6f6f2';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) { const sx = x < 16 ? x : 31 - x; P.set(x, y, y < 2 ? '#f0b030' : y < 5 ? W : sx < 5 && y > 5 ? G[3] : sx < 7 && y > 5 ? G[4] : y > 13 ? G[2] : W); P.set(x, 16 + y, x > 26 ? (x % 3 === 0 && y % 4 === 1 ? W : KK) : x > 23 ? G[1] : x < 5 ? W : y < 3 ? G[4] : y > 12 ? G[5] : (x + y) % 6 === 0 ? G[2] : G[3]); }
    P.set(4, 3, KK); P.set(27, 3, KK); return P; });

  // ---- 海面（上から見る） ----
  // 大きな波の海面（コマの並び。R.tex.water より波が大きく、白い波がしらが動く）。c = 水の色
  def('swell', 8, (o = {}) => { const P = Px(64), W = ramp(o.c || '#2f8fb8', 6, { warm: .5 }), sd = o.seed || 0, f = o.frame || 0, nf = o.frames || 4, a0 = f / nf * TAU;
    P.each((x, y) => { const n = tn(x, y + 2.5 * Math.sin(x / 64 * TAU + a0), 32, 16, 64, 64, sd) * .6 + tn(x + 2 * Math.sin(y / 64 * TAU * 2 + a0), y, 16, 8, 64, 64, sd + 5) * .4, ch = (x + y) & 1; return n > .68 ? W[4] : n > .62 ? (ch ? W[4] : W[3]) : n < .3 ? W[2] : n < .36 ? (ch ? W[2] : W[3]) : W[3]; });
    for (let k = 0; k < 14; k++) { const ph = md(f + Math.floor(hash(k, 3, sd) * nf), nf), a = Math.sin(ph / nf * TAU), x = Math.floor(hash(k, 1, sd) * 64), y = Math.floor(k * 4.57 + hash(k, 2, sd) * 3), len = Math.round(9 + hash(k, 4, sd) * 9 + a * 3);
      for (let q = 0; q < len; q++) { const u = q / (len - 1), yy = y + Math.round(-1.6 * Math.sin(u * Math.PI)); P.set(x + q, yy, a > .3 && q > 2 && q < len - 3 ? '#ffffff' : W[5]); if (q > 1 && q < len - 2) P.set(x + q, yy + 1, a > .3 && (q & 1) ? W[5] : W[4]); if (q > 2 && q < len - 2) P.set(x + q + 1, yy + 2, W[2]); if (a > .6 && q % 4 === 1 && q > 2 && q < len - 3) P.set(x + q, yy - 1, '#ffffff'); } }
    return P; }); frames('swell');
  // 水ぎわの白い泡（帯の切りぬきのコマ。下のはしが物にふれる側）
  def('foam', 2, (o = {}) => { const P = Px(64, 16), sd = o.seed || 0, f = o.frame || 0, nf = o.frames || 4; P.clip = true;
    P.each((x, y) => { const xs = x + f * 64 / nf, n = tn(xs, y, 8, 4, 64, 16, sd) * .65 + tn(xs * 2 + f * 3, y, 4, 4, 64, 16, sd + 1) * .35, th = .72 - .5 * Math.pow(y / 15, 1.4); if (n < th) return null; return n > th + .16 ? '#ffffff' : (x + y) & 1 ? '#ffffff' : '#c8eef4'; }); return P; }, true); frames('foam');
  // うき（赤と白のしま。下にふじつぼ）
  def('buoy', 1, (o = {}) => { const P = Px(32), C = ramp(o.c || '#e0483a'), W = ramp('#f0ece0');
    P.each((x, y) => { const t = [1, 2, 3, 4, 5, 4, 3, 3][x & 7], band = y > 9 && y < 17; return y === 9 || y === 17 ? C[0] : band ? W[Math.max(1, t - 1)] : (x * 5 + y * 3) % 23 === 0 ? C[1] : C[t]; }); return crust(P, { grow: .35, from: 'bottom', seed: 3 }); });
  // さびた鉄（いかり・くさり・ドームの土台）
  def('iron', 1.5, (o = {}) => { const P = Px(32), M = ramp(o.c || '#6e6470'), Rs = ramp('#b8683a'), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 16, 16, 32, 32, sd) * .6 + tn(x, y, 8, 8, 32, 32, sd + 1) * .4; return (y & 15) === 0 ? M[1] : (y & 15) === 1 ? M[5] : n > .68 ? Rs[3] : n > .62 ? ((x + y) & 1 ? Rs[2] : M[3]) : n < .3 ? M[2] : (x * 3 + y) % 13 === 0 ? M[4] : M[3]; });
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) P.bits(i * 8 + 3, j * 16 + 7, ['hm', 'md'], { h: M[5], m: M[4], d: M[0] });
    return crust(P, { grow: o.grow ?? .5, seed: sd }); });

  // ================= 3. 水の中の空気 =================
  // 深さごとの色の組。hi/mid/low = 見上げた色・水平の色・足もとの色、fog = 水の色、ray = 光のすじの色
  const DEPTH = {
    shallow: { hi: '#d2fcf0', mid: '#52ccd8', low: '#2c8cc0', fog: '#48bcd0', near: 5, far: 72, sky: 0xdcfff4, ground: 0x58b0c8, amb: 1.2, sun: 0xfff4d0, power: 1.4, ray: '#fff6c8', rayA: .55, caustic: .5, surf: '#8fe6ea' },
    mid: { hi: '#a8ecf6', mid: '#34a0d4', low: '#1e62ac', fog: '#2e96cc', near: 4, far: 60, sky: 0xc4f0ff, ground: 0x4488c8, amb: 1.25, sun: 0xeafaff, power: 1.3, ray: '#d4f6ff', rayA: .45, caustic: .38, surf: '#74d4ec' },
    deep: { hi: '#4688cc', mid: '#2854a4', low: '#1e327c', fog: '#244a9c', near: 3, far: 46, sky: 0x94b8ff, ground: 0x5058b8, amb: 1.4, sun: 0xa0ccff, power: .8, ray: '#8cc4ff', rayA: .3, caustic: .12, surf: '#4c94dc' },
    ice: { hi: '#ecfdfd', mid: '#5cbcd4', low: '#2c74ac', fog: '#58b2ce', near: 4, far: 58, sky: 0xe4fcff, ground: 0x60a0cc, amb: 1.35, sun: 0xe0f6ff, power: 1.0, ray: '#e8ffff', rayA: .4, caustic: .22, surf: '#c4ecf0', ice: true } };
  S.DEPTH = DEPTH;
  const fogToBlack = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', '#ifdef USE_FOG\ngl_FragColor.rgb*=1.-smoothstep(fogNear,fogFar,vFogDepth);\n#endif'); };   // 加算の物は、遠くで水の色ではなく「無し」へ消す
  let seq = 0; const rnd = () => hash(++seq, 7, 3);
  // あわ。{ emit(x, y, z, 個数, ひろがり, 大きさ), update(dt) }。top（水面の高さ）で消える
  function bubbles(scene, o = {}) { const max = o.max || 70, top = o.top ?? 14, base = tex.bubble(), ms = [0, 1].map(i => { const t = base.clone(); t.repeat.set(.5, 1); t.offset.set(i * .5, 0); t.needsUpdate = true; return new THREE.SpriteMaterial({ map: t, alphaTest: .5, fog: true }); }), pool = [], live = [];
    for (let i = 0; i < max; i++) { const s = new THREE.Sprite(ms[i % 3 ? 1 : 0]); s.visible = false; s.userData.big = i % 3 === 0; scene.add(s); pool.push(s); }
    const emit = (x, y, z, n = 1, sp = .12, size = 1) => { for (let k = 0; k < n; k++) { const s = pool.pop(); if (!s) return; s.position.set(x + (rnd() - .5) * sp * 2, y + rnd() * sp, z + (rnd() - .5) * sp * 2); Object.assign(s.userData, { vy: .6 + rnd() * .6, ph: rnd() * 6, sz: (.07 + rnd() * .06) * size * (s.userData.big ? 1.7 : 1), age: 0 }); s.scale.setScalar(s.userData.sz); s.visible = true; live.push(s); } };
    const update = dt => { for (let i = live.length - 1; i >= 0; i--) { const s = live[i], u = s.userData; u.age += dt; s.position.y += u.vy * dt; s.position.x += Math.sin(u.age * 5 + u.ph) * .22 * dt; s.position.z += Math.cos(u.age * 4 + u.ph) * .22 * dt; const k = u.sz * (1 + u.age * .22); s.scale.set(k, k, 1); if (s.position.y > top - .15 || u.age > 10) { s.visible = false; live.splice(i, 1); pool.push(s); } } };
    return { emit, update }; }
  // 水の中の見え方をまとめて用意する。
  //   o = { depth: 'shallow'/'mid'/'deep'/'ice', top（水面の高さ m。既定 14）, floor（海底の高さ。光のすじの下のはし）, rays（光のすじの数。0 でなし）, motes（ただよう粒の数）, surface: false（見上げた水面なし）, range（影の広さ）, ＋ DEPTH の値の上書き（fog, far, amb, ray, rayA …） }
  //   返すもの E = { D（色の組）, top, sun, hemi, dome, surface, rays, motes, bubbles: { emit, update }, tick(t, cam, dt) }。毎コマ E.tick(t, cam, dt) を呼ぶ
  function underwater(scene, renderer, o = {}) { const D = { ...DEPTH[o.depth || 'mid'], ...o }, top = o.top ?? 14, floor = o.floor ?? 0, E = { D, top };
    scene.fog = new THREE.Fog(D.fog, D.near, D.far);
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const cx = cv.getContext('2d'), gr = cx.createLinearGradient(0, 0, 0, 256); for (const [p, c] of [[0, D.hi], [.2, mix(D.hi, D.mid, .45)], [.4, D.mid], [.5, D.fog], [.62, mix(D.fog, D.low, .7)], [1, D.low]]) gr.addColorStop(p, c); cx.fillStyle = gr; cx.fillRect(0, 0, 4, 256); const dt = new THREE.CanvasTexture(cv); dt.colorSpace = THREE.SRGBColorSpace;
    E.dome = new THREE.Mesh(new THREE.SphereGeometry(o.r || 220, 16, 12), new THREE.MeshBasicMaterial({ map: dt, side: THREE.BackSide, fog: false, depthWrite: false })); E.dome.renderOrder = -10; E.dome.frustumCulled = false; scene.add(E.dome);
    const L = K.lights(scene, renderer, { sky: D.sky, ground: D.ground, amb: D.amb, sun: D.sun, power: D.power, range: o.range || 26, pos: [-8, 40, 6] }); E.sun = L.sun; E.hemi = L.hemi;
    // 見上げた水面（細かく割った板。8 m のタイルの倍数で主役についていく）
    let SF = null; if (o.surface !== false) { SF = D.ice ? [tex.under({ kind: 'ice', c: D.surf, frames: 1 })[0]] : tex.under({ c: D.surf }); const g = new THREE.PlaneGeometry(176, 176, 22, 22); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 22, uv.getY(i) * 22);
      const m = new THREE.MeshBasicMaterial({ map: SF[0], side: THREE.DoubleSide, fog: true }); m.onBeforeCompile = snap; E.surface = new THREE.Mesh(g, m); E.surface.position.y = top; E.surface.frustumCulled = false; scene.add(E.surface); }
    // 上からさす光のすじ（加算の たて長の板。主役のまわりに めぐらせる）
    const nr = o.rays ?? 10, RR = 24, rays = [], rm = [0, 1, 2].map(i => { const m = xmat(tex.shaft({ seed: i }), { glow: true, add: true, alpha: D.rayA, side: true, color: D.ray, key: 'ray' + i }); return m; }), hgt = top - floor + 1;
    for (let i = 0; i < nr; i++) { const w = 1.6 + hash(i, 1, 5) * 3.2, G = geo(), sl = hgt * .22, sg = 4; for (let k = 0; k < sg; k++) { const y0 = k / sg, y1 = (k + 1) / sg; G.quad([-w / 2 + sl * (1 - y0), y0 * hgt, 0], [w / 2 + sl * (1 - y0), y0 * hgt, 0], [w / 2 + sl * (1 - y1), y1 * hgt, 0], [-w / 2 + sl * (1 - y1), y1 * hgt, 0], [0, y0, 1, y1]); }
      const me = mesh(G, rm[i % 3]); me.rotation.y = (hash(i, 2, 5) - .5) * 1.2; me.userData = { bx: (hash(i, 3, 5) - .5) * 2 * RR, bz: (hash(i, 4, 5) - .5) * 2 * RR }; me.position.y = floor - .5; me.renderOrder = 4; me.frustumCulled = false; scene.add(me); rays.push(me); }
    E.rays = rays;
    // ただよう粒
    const nm = o.motes ?? 160, MB = 13; if (nm) { const pg = new THREE.BufferGeometry(), pa = new Float32Array(nm * 3), pb = new Float32Array(nm * 3); for (let i = 0; i < nm; i++) { pb[i * 3] = (hash(i, 1, 8) - .5) * 2 * MB; pb[i * 3 + 1] = hash(i, 2, 8) * 2 * MB; pb[i * 3 + 2] = (hash(i, 3, 8) - .5) * 2 * MB; } pg.setAttribute('position', new THREE.BufferAttribute(pa, 3));
      E.motes = new THREE.Points(pg, new THREE.PointsMaterial({ color: mix(D.hi, '#ffffff', .5), size: o.moteSize || .1, sizeAttenuation: true, transparent: true, opacity: .75, depthWrite: false })); E.motes.frustumCulled = false; E.motes.userData.base = pb; scene.add(E.motes); }
    E.bubbles = bubbles(scene, { top, max: o.bubbles });
    E.tick = (t, cam, dt2 = 1 / 60) => { const p = cam.position; S.tick(t); E.dome.position.copy(p);
      if (E.surface) { E.surface.position.x = Math.round(p.x / 8) * 8; E.surface.position.z = Math.round(p.z / 8) * 8; if (SF.length > 1) R.flip(E.surface.material, SF, t, 4); }
      for (let i = 0; i < rays.length; i++) { const r = rays[i], u = r.userData; r.position.x = p.x + md(u.bx + Math.sin(t * .13 + i) * 1.5 - p.x + RR, 2 * RR) - RR; r.position.z = p.z - 4 + md(u.bz - p.z + RR, 2 * RR) - RR; }
      rm.forEach((m, i) => { m.opacity = D.rayA * (.72 + .28 * Math.sin(t * .8 + i * 2.1)); });
      if (E.motes) { const a = E.motes.geometry.attributes.position, b = E.motes.userData.base; for (let i = 0; i < nm; i++) { a.array[i * 3] = p.x + md(b[i * 3] + Math.sin(t * .3 + i) * .4 - p.x + MB, 2 * MB) - MB; a.array[i * 3 + 1] = p.y + md(b[i * 3 + 1] + t * .06 - p.y + MB, 2 * MB) - MB; a.array[i * 3 + 2] = p.z + md(b[i * 3 + 2] + Math.cos(t * .25 + i) * .4 - p.z + MB, 2 * MB) - MB; if (Math.abs(a.array[i * 3] - p.x) + Math.abs(a.array[i * 3 + 1] - p.y) + Math.abs(a.array[i * 3 + 2] - p.z) < 3.5) a.array[i * 3 + 1] += 2 * MB; }   // カメラのすぐ前の粒は、大きな四角に見えるので よける
      a.needsUpdate = true; }
      E.bubbles.update(dt2); };
    return E; }
  // 海底。R.ground に、光のゆらぎ（コースティクス）の重ねがけを足した物。
  //   o = { w, d, cell, H(x,z), layers（既定は白い砂）, mix, shade, env（underwater の返り値。色と強さを合わせる）, caustic（強さ 0〜1。0 でなし）, causticC, causticM（あみ目 1 枚の大きさ m）, fps }
  //   返すもの：{ mesh（Group）, follow(cx, cz), tick(t), H }
  function seabed(o = {}) { const env = o.env, H = o.H || (() => 0), base = { w: o.w || 120, d: o.d || 120, cell: o.cell || 2 }, g = R.ground({ ...base, H, layers: o.layers || [tex.sand()], mix: o.mix, shade: o.shade }), out = { mesh: new THREE.Group(), ground: g, H }; out.mesh.add(g.mesh);
    const ca = o.caustic ?? (env ? env.D.caustic : .4); let cg = null, CF = null;
    if (ca > 0) { CF = tex.caustic({ m: o.causticM || 6 }); cg = R.ground({ ...base, H: (x, z) => H(x, z) + .03, layers: [CF[0]] }); const m = cg.mat, old = m.onBeforeCompile; m.transparent = true; m.blending = THREE.AdditiveBlending; m.depthWrite = false; m.opacity = ca; m.color.set(o.causticC || (env ? env.D.ray : '#fff6c8')); m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
      m.onBeforeCompile = sh => { old(sh); fogToBlack(sh); }; m.customProgramCacheKey = () => 'sea-caustic'; cg.mesh.receiveShadow = false; cg.mesh.renderOrder = 1; out.mesh.add(cg.mesh); out.caustic = cg; }
    out.follow = (cx, cz) => { g.follow(cx, cz); if (cg) cg.follow(cx, cz); }; out.tick = t => { if (cg) R.flip(cg.mat, CF, t, o.fps || 5); }; return out; }
  Object.assign(S, { underwater, seabed, bubbles });

  // ================= 4. 海底の岩と、生えている物 =================
  // 岩（ふじつぼ・も つき）。s（大きさ）, c, grow, seed, flat（高さの倍率）, tex（別のテクスチャ）
  function rock(o = {}) { const s = o.s || 1, sd = o.seed || 0, t = o.tex || tex.grown({ base: 'rock', o: { c: o.c || '#8c8898' }, grow: o.grow ?? .6, seed: sd % 3 }), j = (i, k) => 1 + (hash(i, k, sd) - .5) * .5, fl = o.flat || 1, of = (i, k) => (hash(i, k, sd) - .5) * s * .3;
    return geo().smooth(1).loft(7, [[-.15 * s, s * 1.02 * j(0, 1), s * .96 * j(0, 2), 0, .6], [s * .38 * fl * j(1, 3), s * .94 * j(1, 1), s * .88 * j(1, 2), .35, .9, of(1, 5), of(1, 6)], [s * .8 * fl * j(2, 3), s * .6 * j(2, 1), s * .6 * j(2, 2), .7, 1.05, of(2, 5), of(2, 6)], [s * 1.02 * fl, s * .2, s * .2, .92, 1.15, of(3, 5), of(3, 6)]], { cap: 'top', ur: 2 }).mesh(t); }
  // 海底のがけ（x にそってのびる かべ。正面が +z、上に たな）。len, h, back（たなの奥ゆき）, slope（すその出かた）, c, grow, seed
  function cliff(o = {}) { const len = o.len || 20, h = o.h || 8, sd = o.seed || 0, t = o.tex || tex.grown({ base: 'rock', o: { c: o.c || '#7c7a94' }, grow: o.grow ?? .5, seed: 1 }), m = t.userData.m || 3, G = geo().smooth(1), nx = Math.max(2, Math.round(len / 3)), ys = [0, .3, .64, 1, 1], back = o.back || 6, sl = o.slope ?? .35, vs = [0, .3 * h, .64 * h, h, h + back], cs = [.62, .82, 1, 1.12, 1.05];
    const P = (i, j) => { const e = i === 0 || i === nx ? 0 : 1; return [-len / 2 + i * len / nx + e * (hash(i, j, sd) - .5) * 1.2, ys[j] * h + (j === 1 || j === 2 ? (hash(i, j, sd + 1) - .5) * h * .1 : 0), j === 4 ? -back : (1 - ys[j]) * h * sl + (hash(i, j, sd + 2) - .5) * (j === 3 ? .8 : 1.8)]; };
    for (let i = 0; i < nx; i++) for (let j = 0; j < 4; j++) G.quad(P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1), [i * len / nx / m, vs[j] / m, (i + 1) * len / nx / m, vs[j + 1] / m], [cs[j], cs[j], cs[j + 1], cs[j + 1]]);
    return G.mesh(t); }
  const CORALC = ['#f0705a', '#f4a03c', '#f6d24a', '#e86aa0', '#9a6ad0', '#4ab8c8', '#f4ece0', '#6ac87a'], CKIND = ['branch', 'table', 'brain', 'fan', 'tube', 'finger'];
  S.CORALC = CORALC;
  // さんご。kind: 'branch'（枝）/ 'table'（テーブル）/ 'brain'（のう）/ 'fan'（うちわ。ゆれる）/ 'tube'（つつ）/ 'finger'（ゆびの束）。s（大きさ）, c（色。省くと seed で色ちがい）, tip（先の色）, seed
  function coral(o = {}) { const kind = o.kind || 'branch', sd = o.seed || 0, s = o.s || 1, c = o.c || CORALC[md(sd * 3 + CKIND.indexOf(kind), CORALC.length)], G = geo().smooth(1);
    if (kind === 'fan') { const w = 1.3 * s, h = 1.3 * s; G.smooth(0).normal([0, .6, .8]).quad([-w / 2, 0, -.16 * s], [0, 0, 0], [0, h, 0], [-w / 2, h, -.16 * s], [0, 0, .5, 1], [.8, .8, 1.05, 1.05]).quad([0, 0, 0], [w / 2, 0, -.16 * s], [w / 2, h, -.16 * s], [0, h, 0], [.5, 0, 1, 1], [.8, .8, 1.05, 1.05]); const me = G.mesh(xmat(tex.fan({ c, seed: sd % 3 }), { cut: true, side: true, sway: { amp: .07 * s, f: 1.1, k: 1 } })); me.castShadow = false; return me; }
    if (kind === 'branch') { const t = tex.coral({ c, tip: o.tip }); let id = 0;
      const br = (M, len, r, dep) => { G.at(M).loft(4, [[0, r, r, 0, .78], [len, r * .72, r * .72, len / .5, 1], [len + r * .6, r * .28, r * .28, len / .5 + .1, 1.3]], { cap: 'top', capUV: [.03, .97] }); if (dep <= 0) return;
        const n = 2 + (hash(id, 1, sd) > .6 ? 1 : 0), a0 = hash(id, 6, sd) * TAU; for (let k = 0; k < n; k++) { id++; br(M.clone().multiply(TR(0, len * (.7 + .3 * hash(id, 5, sd)), 0, a0 + k / n * TAU + hash(id, 2, sd), .5 + hash(id, 3, sd) * .35, 0)), len * (.62 + hash(id, 4, sd) * .2), r * .72, dep - 1); } };
      for (let k = 0; k < 3; k++) { id++; br(TR((hash(k, 7, sd) - .5) * .2 * s, 0, (hash(k, 8, sd) - .5) * .2 * s, k * 2.1 + sd, k ? .4 : .08, 0), (.5 + hash(k, 9, sd) * .15) * s, .085 * s, o.depth ?? 2); }
      return G.at(null).mesh(t); }
    if (kind === 'table') { const t = tex.coral({ kind: 'cell', c, m: 1.6 }), r = s, h = .75 * s, plate = (M, r, h) => G.at(M).loft(8, [[0, r * .2, r * .2, 0, .55], [h * .6, r * .15, r * .15, .25, .7], [h * .9, r * .62, r * .62, .5, .72], [h, r, r, .9, 1], [h + .06 * s, r * .95, r * .95, 1, 1.12]], { cap: 'top', capRect: true, ur: 3 });
      plate(TR(0, 0, 0, sd), r, h); if (o.tiers !== 1) { plate(TR(r * .55, h * .3, r * .3, sd + 1, .1, .12), r * .6, h * .95); plate(TR(-r * .5, h * .2, -r * .35, sd + 2, -.1, -.1), r * .5, h * .7); } return G.at(null).mesh(t); }
    if (kind === 'brain') { const r = .6 * s; return G.loft(8, [[-.05 * s, r * .8, r * .8, 0, .62], [r * .32, r, r, .3, .9], [r * .72, r * .8, r * .8, .65, 1.05], [r * .95, r * .42, r * .42, .9, 1.15]], { cap: 'top', ur: 3 }).mesh(tex.coral({ kind: 'brain', c })); }
    const t = tex.coral({ c, tip: o.tip }), n = kind === 'tube' ? 4 : 6;
    for (let k = 0; k < n; k++) { const a = k / n * TAU + sd, d = k ? (.16 + hash(k, 1, sd) * .14) * s : 0, h = (kind === 'tube' ? .55 : .5) * s * (.6 + hash(k, 2, sd) * .7) * (k ? 1 : 1.25), r = (kind === 'tube' ? .13 : .085) * s * (.8 + hash(k, 3, sd) * .4); G.at(TR(Math.cos(a) * d, 0, Math.sin(a) * d, a, k ? .12 + hash(k, 4, sd) * .2 : 0, 0));
      if (kind === 'tube') G.loft(6, [[0, r * .6, r * .6, 0, .7], [h * .5, r * .82, r * .82, .5, .9], [h, r, r, 1, 1.12], [h - .04 * s, r * .7, r * .7, 1, .3]], { cap: 'top', capUV: [.5, .5] }); else G.loft(5, [[0, r * .8, r * .8, 0, .72], [h * .6, r, r, .6, .95], [h * .9, r * .8, r * .8, .9, 1.1], [h, r * .35, r * .35, 1, 1.25]], { cap: 'top', capUV: [.03, .97] }); }
    return G.at(null).mesh(t); }
  // いそぎんちゃく（しょくしゅが ゆれる）。s, c（しょくしゅ）, tip（先）, body（どう）, n（しょくしゅの数）, seed
  function anemone(o = {}) { const s = o.s || 1, sd = o.seed || 0, n = o.n || 14, t = tex.anemone({ c: o.c, tip: o.tip, body: o.body }), m = xmat(t, { sway: { amp: .07 * s, f: 1.7, k: 1 } }), G = geo().smooth(1), h = .22 * s, r = .2 * s;
    G.px(16, 24, 16, 8, 32, 32).loft(8, [[0, r * .85, r * .85, 0, .7], [h * .7, r * .8, r * .8, .6, .9], [h, r, r, 1, 1]], { cap: 'top', ur: 2 });
    for (let k = 0; k < n; k++) { const inner = k % 3 === 2, a = k / n * TAU + (inner ? .3 : 0), d = r * (inner ? .35 : .82), L = (.34 + hash(k, 1, sd) * .16) * s * (inner ? .8 : 1); G.px(0, 0, 8, 32, 32, 32).at(TR(Math.sin(a) * d, h - .01, Math.cos(a) * d, a, inner ? .15 : .55, 0)).loft(3, [[0, .04 * s, .04 * s, 0, .85], [L * .55, .034 * s, .034 * s, .55, 1], [L, .02 * s, .02 * s, 1, 1.15]], { cap: 'top', capUV: [.5, .98] }); }
    const me = G.at(null).mesh(m); me.castShadow = false; return me; }
  // 昆布（たてに長い帯が 2 枚。ゆっくり大きくゆれる。ならべて森にする）。h（高さ m）, w（はば）, c, kind: 'kelp'/'ribbon', amp（ゆれの大きさ）, seed
  function kelp(o = {}) { const h = o.h || 8, w = o.w || 1, sd = o.seed || 0, t = tex.kelp({ c: o.c, kind: o.kind, seed: sd % 2 }), m = xmat(t, { cut: true, side: true, sway: { amp: o.amp ?? .55, f: .9, k: .2 } }), G = geo().normal([0, 1, 0]), sg = Math.ceil(h / 1.2);
    for (const a of [sd, sd + 1.6]) { const cx = Math.cos(a) * w / 2, cz = Math.sin(a) * w / 2; for (let i = 0; i < sg; i++) { const y0 = i * h / sg, y1 = (i + 1) * h / sg, k0 = .62 + .38 * i / sg, k1 = .62 + .38 * (i + 1) / sg; G.quad([-cx, y0, -cz], [cx, y0, cz], [cx, y1, cz], [-cx, y1, -cz], [0, y0 / 2, 1, y1 / 2], [k0, k0, k1, k1]); } }
    const me = G.mesh(m); me.castShadow = false; return me; }
  // 海草のしげみ（ゆれる）。s, c, seed
  function seagrass(o = {}) { const s = o.s || .8, sd = o.seed || 0, t = tex.seagrass({ c: o.c, seed: sd % 3 }), m = xmat(t, { cut: true, side: true, sway: { amp: .1 * s, f: 1.5, k: 1 } }), G = geo().normal([0, 1, 0]);
    for (const a of [.4 + sd, .4 + sd + Math.PI / 2]) { const cx = Math.cos(a) * s * .55, cz = Math.sin(a) * s * .55; G.quad([-cx, 0, -cz], [cx, 0, cz], [cx, s, cz], [-cx, s, -cz], [0, 0, 1, 1], [.75, .75, 1.05, 1.05]); } const me = G.mesh(m); me.castShadow = false; return me; }
  // 貝（ふたが開いて しんじゅが見える）・ひとで・うに。どれも 1 枚のテクスチャ（S.tex.bits）
  function shell(o = {}) { const s = o.s || 1, r = .2 * s, t = tex.bits({ c: o.c, star: o.star, urchin: o.urchin }), G = geo().smooth(1).px(0, 0, 32, 32, 64, 64);
    domeP(G.at(TR(0, .07 * s, 0, 0, Math.PI, 0)), { rx: r, rz: r * .9, h: .07 * s, n: 7, rings: [[.6, .5], [1, 0]], uvr: -1, shade: [.7, .8, .9] });
    domeP(G.at(TR(0, .07 * s, -r * .85, 0, -(o.open ?? .6), 0).multiply(TR(0, 0, r * .85))), { rx: r, rz: r * .9, h: .1 * s, n: 7, rings: [[.6, .6], [1, 0]], uvr: -1, belly: true });
    if (o.pearl !== false) G.at(TR(0, .08 * s, .02 * s)).px(36, 50, 10, 10, 64, 64).loft(6, [[0, .02 * s, .02 * s, 0, .8], [.035 * s, .045 * s, .045 * s, .5, 1.1], [.075 * s, .02 * s, .02 * s, 1, 1.3]], { cap: 'both' });
    return G.at(null).mesh(xmat(t, { side: true })); }
  function starfish(o = {}) { const s = o.s || 1, R1 = .24 * s, R2 = .09 * s, t = tex.bits({ c: o.shell, star: o.c, urchin: o.urchin }), G = geo().px(32, 0, 32, 32, 64, 64), C = [0, .06 * s, 0], uv = p => [.5 + p[0] / (2 * R1), .5 + p[2] / (2 * R1)], P = k => { const a = k / 10 * TAU, r = k % 2 ? R2 : R1; return [Math.sin(a) * r, k % 2 ? .025 * s : .005, Math.cos(a) * r]; };
    for (let k = 0; k < 10; k++) { const a = P(k), b = P(k + 1); faceT(G, C, a, b, uv(C), uv(a), uv(b), [1.12, k % 2 ? .78 : .95, k % 2 ? .95 : .78]); } return G.mesh(xmat(t, { side: true })); }
  function urchin(o = {}) { const s = o.s || 1, r = .11 * s, t = tex.bits({ c: o.shell, star: o.star, urchin: o.c }), G = geo().smooth(1).px(34, 34, 12, 12, 64, 64).loft(6, [[0, r * .8, r * .8, 0, .7], [r * .6, r, r, .5, 1], [r * 1.1, r * .4, r * .4, 1, 1.2]], { cap: 'top' });
    G.smooth(0).normal([0, 1, 0]).px(0, 32, 32, 32, 64, 64); const q = r * 2.4; for (const a of [0, 1.05, 2.1]) { const cx = Math.cos(a) * q, cz = Math.sin(a) * q; G.quad([-cx, r * .5 - q, -cz], [cx, r * .5 - q, cz], [cx, r * .5 + q, cz], [-cx, r * .5 + q, -cz]); } G.quad([-q, r * .5, q], [q, r * .5, q], [q, r * .5, -q], [-q, r * .5, -q]);
    const me = G.mesh(xmat(t, { cut: true, side: true })); me.castShadow = false; return me; }
  // さんごのかたまり（岩＋さんご数種＋いそぎんちゃく＋海草）。場面をうめるのに便利。s, n（さんごの数）, seed, kinds（使う種類）, colors
  function reef(o = {}) { const s = o.s || 1, sd = o.seed || 0, n = o.n ?? 5, g = new THREE.Group(), kinds = o.kinds || CKIND, cols = o.colors || CORALC, rk = rock({ s: 1.1 * s, seed: sd, flat: .6, c: o.rock, grow: .7 }); g.add(rk);
    for (let k = 0; k < n; k++) { const a = k / n * TAU + hash(k, 1, sd) * .8 + sd, d = (k === 0 ? .1 : .45 + hash(k, 2, sd) * .5) * s, kind = kinds[md(Math.floor(hash(k, 3, sd) * 97) + k, kinds.length)], c = coral({ kind, s: s * (.55 + hash(k, 4, sd) * .5) * (kind === 'table' ? .8 : 1), c: cols[md(Math.floor(hash(k, 5, sd) * 89) + k * 3, cols.length)], seed: sd + k }); c.position.set(Math.cos(a) * d, Math.max(0, s * .62 * (1 - (d / (1.05 * s)) ** 2)) - .05, Math.sin(a) * d); c.rotation.y = a + 1.57; g.add(c); }
    if (o.anemone !== false) { const a = anemone({ s: .9 * s, c: cols[md(sd + 1, cols.length)], body: cols[md(sd + 4, cols.length)], seed: sd }); a.position.set(Math.cos(sd * 2.3) * s * .95, .1, Math.sin(sd * 2.3) * s * .95); g.add(a); }
    for (let k = 0; k < 3; k++) { const q = seagrass({ s: (.5 + hash(k, 6, sd) * .4) * s, seed: sd + k }), a = hash(k, 7, sd) * TAU; q.position.set(Math.cos(a) * s * 1.25, 0, Math.sin(a) * s * 1.25); g.add(q); }
    return g; }
  Object.assign(S, { rock, cliff, coral, anemone, kelp, seagrass, shell, starfish, urchin, reef });

  // ================= 5. 生きもの（どれも userData.tick(t) で その場で泳ぐ動き。位置と向きはページが決める。正面は +z。userData.dyn = true なので R.merge に入れても残る） =================
  const FISH = { clown: { len: .36, w: .06, h: .11 }, butter: { len: .38, w: .045, h: .17, tall: 1 }, angel: { len: .46, w: .05, h: .22, tall: 1 }, tang: { len: .46, w: .055, h: .16 }, parrot: { len: .85, w: .12, h: .21 }, grouper: { len: 1.4, w: .24, h: .32 }, silver: { len: .28, w: .04, h: .065 } };
  const fishBody = (G, L, hw, hh, tail) => { const B = (z, a, b, v, c = 1) => [z * L, a * hw, b * hh, v, c]; return G.at(LZ).loft(SEC6, [...(tail ? [B(-.5, .1, .24, 0, .9), B(-.36, .2, .32, .14)] : []), B(-.2, .5, .56, .3, .95), B(0, .95, 1, .5), B(.25, 1, .95, .75), B(.42, .62, .58, .92), B(.5, .15, .18, 1)], { cap: 'both', capUV: [.02, .5] }).at(null); };
  const fishFins = (G, D, L, pect) => { const fh = D.h * (D.tall ? 1 : .7), y0 = D.h * .82; G.smooth(0).normal([0, 1, 0]).px(24, 40, 24, 12, 64, 64).quad([0, y0, .2 * L], [0, y0, -.22 * L], [0, y0 + fh, -.3 * L], [0, y0 + fh, .14 * L]).quad([0, -y0, .02 * L], [0, -y0, -.22 * L], [0, -y0 - fh * .7, -.28 * L], [0, -y0 - fh * .7, 0]);
    if (pect) { G.px(24, 52, 24, 12, 64, 64); for (const sx of [1, -1]) G.quad([sx * D.w * .9, -.3 * D.h, .22 * L], [sx * (D.w + fh * .5), -.5 * D.h, .02 * L], [sx * (D.w + fh * .7), .1 * D.h, -.04 * L], [sx * D.w * .9, .1 * D.h, .2 * L]); } return G.normal(null); };
  // 大きめの魚（しっぽをふる）。kind: 'clown'/'butter'/'angel'/'tang'/'parrot'/'grouper'/'silver'、s（倍率）, c, c2, fin（色）, seed
  function fish(o = {}) { const kind = o.kind || 'clown', D = FISH[kind] || FISH.clown, L = D.len, m = xmat(tex.fish({ kind, c: o.c, c2: o.c2, fin: o.fin }), { cut: true, side: true }), g = new THREE.Group(), root = pivot(g), ph = (o.seed || 0) * 1.7; root.scale.setScalar(o.s || 1);
    const Gb = geo().smooth(1).px(0, 0, 64, 40, 64, 64); fishBody(Gb, L, D.w, D.h); fishFins(Gb, D, L, true); mesh(Gb, m, root);
    const tail = pivot(root, 0, 0, -.2 * L), th = D.h * (D.tall ? 1 : 1.2), Gt = geo().smooth(1).px(0, 0, 64, 40, 64, 64).at(LZ).loft(SEC6, [[-.3 * L, .1 * D.w, .24 * D.h, 0, .9], [-.16 * L, .22 * D.w, .32 * D.h, .14, 1], [0, .5 * D.w, .56 * D.h, .3, .95]]).at(null);
    Gt.smooth(0).normal([0, 1, 0]).px(0, 40, 24, 24, 64, 64).quad([0, -th, -.2 * L], [0, -th, -.2 * L - th * 1.9], [0, th, -.2 * L - th * 1.9], [0, th, -.2 * L]); mesh(Gt, m, tail);
    g.userData = { kind: 'fish', dyn: true, tail, len: L * (o.s || 1), tick: (t, k = 1) => { const a = Math.sin(t * 8 * k + ph); tail.rotation.y = a * .6; root.rotation.y = -a * .12; } }; return g; }
  // 小魚の群れ（InstancedMesh 1 つ。原点のまわりの だ円をまわる）。
  //   n（数）, kind, c, c2, s, rx, rz（だ円の半径 m）, spread（群れの長さ。角度。6.28 で輪になる）, wide（群れのはば）, h（上下のひろがり）, speed（m/秒。負で逆まわり）, tints: [色…]（1 ぴきごとの色がけ）, seed
  function school(o = {}) { const n = o.n || 40, kind = o.kind || 'silver', D = FISH[kind] || FISH.silver, L = D.len, sd = o.seed || 0, m = xmat(tex.fish({ kind, c: o.c, c2: o.c2, fin: o.fin }), { cut: true, side: true });
    const G = geo().smooth(1).px(0, 0, 64, 40, 64, 64); fishBody(G, L, D.w, D.h, true); fishFins(G, D, L, false); const th = D.h * 1.2; G.smooth(0).normal([0, 1, 0]).px(0, 40, 24, 24, 64, 64).quad([0, -th, -.44 * L], [0, -th, -.44 * L - th * 1.8], [0, th, -.44 * L - th * 1.8], [0, th, -.44 * L]);
    const im = new THREE.InstancedMesh(G.build(), m, n); im.frustumCulled = false;
    const rx = o.rx ?? 6, rz = o.rz ?? rx, sp = o.spread ?? 1.4, hgt = o.h ?? 1.5, wd = o.wide ?? 1.2, speed = o.speed ?? 1.2, dir = speed < 0 ? -1 : 1, om = Math.abs(speed) / Math.max(rx, rz), s0 = o.s || 1;
    const F = [...Array(n)].map((_, i) => ({ a: (hash(i, 1, sd) - .5) * sp, r: (hash(i, 2, sd) - .5) * wd * 2, y: (hash(i, 3, sd) - .5) * hgt, s: s0 * (.8 + hash(i, 4, sd) * .45), p: hash(i, 5, sd) * TAU })), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
    if (o.tints) { const c = new THREE.Color(); F.forEach((f, i) => im.setColorAt(i, c.set(o.tints[i % o.tints.length]))); }
    const tick = t => { for (let i = 0; i < n; i++) { const f = F[i], a = dir * t * om + f.a + Math.sin(t * .7 + f.p) * .06, ca = Math.cos(a), sa = Math.sin(a); p.set(ca * (rx + f.r), f.y + Math.sin(t * 2 + f.p) * .12, sa * (rz + f.r)); e.set(0, Math.atan2(-sa * rx * dir, ca * rz * dir) + Math.sin(t * 10 + f.p) * .2, 0); q.setFromEuler(e); sc.setScalar(f.s); M.compose(p, q, sc); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; };
    tick(0); im.userData = { kind: 'school', dyn: true, tick }; return im; }
  // うみがめ（前のひれで はばたく）。s, c（こうら）, skin, dark
  function turtle(o = {}) { const m = xmat(tex.turtle({ c: o.c, skin: o.skin, dark: o.dark }), { side: true }), g = new THREE.Group(), root = pivot(g), W = 64; root.scale.setScalar(o.s || 1);
    const Gs = geo().smooth(1).px(0, 0, 32, 32, W, W); domeP(Gs, { rx: .37, rz: .47, h: .2, y: .02, n: 8, rings: [[.6, .78], [.95, .25], [1, 0]], shade: [1.12, 1.02, .85, .7] });
    Gs.px(0, 48, 32, 16, W, W); domeP(Gs.at(TR(0, .02, 0, 0, Math.PI, 0)), { rx: .35, rz: .44, h: .08, n: 8, rings: [[.6, .6], [1, 0]], shade: [.8, .75, .65] }); Gs.at(null).smooth(0).normal([0, 1, 0]).px(34, 2, 10, 10, W, W).tri([-.05, .02, -.44], [.05, .02, -.44], [0, .01, -.6]); mesh(Gs.normal(null), m, root);
    const head = pivot(root, 0, .04, .4); mesh(geo().smooth(1).px(0, 32, 64, 16, W, W).at(LZ).loft(SEC6, [[-.06, .055, .055, 0, .85], [.07, .09, .085, .35, 1], [.19, .088, .082, .75, 1], [.28, .035, .04, 1, 1]], { cap: 'top', capUV: [.5, .98] }).at(null), m, head);
    const F = [1, -1].map(sx => { const p = pivot(root, sx * .3, .03, .26), G = geo().normal([0, 1, 0]).px(32, 0, 32, 32, W, W); G.quad([0, 0, -.08], [0, 0, .09], [sx * .32, 0, .12], [sx * .3, 0, -.08], [0, 0, .5, 1], [.9, .9, 1, 1]).tri([sx * .3, 0, -.08], [sx * .32, 0, .12], [sx * .68, 0, -.2], [.5, 0], [.5, 1], [1, .5]); mesh(G, m, p); return p; });
    const B = [1, -1].map(sx => { const p = pivot(root, sx * .24, .02, -.36), G = geo().normal([0, 1, 0]).px(32, 0, 32, 32, W, W); G.quad([0, 0, -.05], [0, 0, .07], [sx * .2, 0, -.08], [sx * .12, 0, -.24], [0, 0, .5, .5]); mesh(G, m, p); return p; });
    g.userData = { kind: 'turtle', dyn: true, head, tick: t => { const a = Math.sin(t * 2.2), b = Math.cos(t * 2.2); F.forEach((p, i) => { const sx = i ? -1 : 1; p.rotation.z = sx * (a * .6 + .05); p.rotation.y = sx * b * .28; }); B.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * Math.sin(t * 2.2 + 1.5) * .2; }); head.rotation.x = Math.sin(t * .8) * .08; head.rotation.y = Math.sin(t * .5) * .15; root.rotation.x = Math.sin(t * 2.2 + 1) * .05; root.position.y = -a * .04; } }; return g; }
  // えい（大きなつばさを波うたせる）。s, c
  function ray(o = {}) { const m = xmat(tex.manta({ c: o.c }), { side: true }), g = new THREE.Group(), root = pivot(g); root.scale.setScalar(o.s || 1);
    const ST = [[0, .62, -.52, .12], [.36, .52, -.5, .085], [.82, .26, -.36, .035], [1.25, -.16, -.3, .004]], UT = p => [.5 + p[3] / 2.5, 1 - (.65 - p[2]) / 1.3 * .5], UB = p => [.5 + p[3] / 2.5, .5 - (.65 - p[2]) / 1.3 * .5];
    const strip = (G, i, sx, x0) => { const a = ST[i], b = ST[i + 1], P = (s, z, y) => [sx * s[0] - x0, y, z, sx * s[0]], za = (a[1] + a[2]) / 2 + .08, zb = (b[1] + b[2]) / 2 + .04, af = P(a, a[1], 0), ab = P(a, a[2], 0), bf = P(b, b[1], 0), bb = P(b, b[2], 0);
      for (const [up, y, U, c] of [[1, 1, UT, 1], [-1, -.55, UB, .92]]) { const am = P(a, za, a[3] * y), bm = P(b, zb, b[3] * y), n = [0, up, 0]; faceT(G, af, bf, bm, U(af), U(bf), U(bm), c, n); faceT(G, af, bm, am, U(af), U(bm), U(am), c, n); faceT(G, am, bm, bb, U(am), U(bm), U(bb), c * .92, n); faceT(G, am, bb, ab, U(am), U(bb), U(ab), c * .92, n); } };
    const Gc = geo().smooth(1); strip(Gc, 0, 1, 0); strip(Gc, 0, -1, 0); Gc.smooth(0).px(30, 12, 2, 8, 64, 64).at(LZ).loft(3, [[-2, .004, .004, 0, .8], [-.48, .03, .03, 1, 1]]).at(null);
    Gc.px(40, 4, 8, 8, 64, 64).normal([0, 1, 0]); for (const sx of [1, -1]) Gc.tri([sx * .12, .02, .56], [sx * .3, .01, .5], [sx * .22, -.06, .84]); mesh(Gc.normal(null), m, root);
    const W = [1, -1].map(sx => { const p1 = pivot(root, sx * .36, 0, 0), G1 = geo().smooth(1); strip(G1, 1, sx, sx * .36); mesh(G1, m, p1); const p2 = pivot(p1, sx * .46, 0, 0), G2 = geo().smooth(1); strip(G2, 2, sx, sx * .82); mesh(G2, m, p2); return [p1, p2]; });
    g.userData = { kind: 'ray', dyn: true, tick: (t, k = 1) => { const w = t * 1.9 * k; W.forEach(([p1, p2], i) => { const sx = i ? -1 : 1; p1.rotation.z = sx * Math.sin(w) * .38; p2.rotation.z = sx * Math.sin(w - 1) * .55; }); root.position.y = -Math.sin(w) * .08; root.rotation.x = Math.cos(w) * .04; } }; return g; }
  // たこ（8 本のうでが うねる。海底にすわる向き）。s, c, c2（下がわの色）
  function octopus(o = {}) { const m = xmat(tex.octo({ c: o.c, c2: o.c2 })), g = new THREE.Group(), root = pivot(g), W = 64; root.scale.setScalar(o.s || 1);
    const head = pivot(root, 0, .14, -.02); head.rotation.x = -.5; mesh(geo().smooth(1).px(0, 0, 64, 32, W, W).loft(8, [[-.06, .15, .15, 0, .85], [.1, .2, .19, .3, 1], [.3, .27, .26, .6, 1.05], [.47, .21, .21, .86, 1.1], [.55, .08, .08, 1, 1.12]], { cap: 'top', capUV: [.5, .98] }), m, head);
    mesh(geo().smooth(1).px(0, 34, 16, 28, W, W).loft(8, [[0, .2, .2, 0, .8], [.14, .19, .19, .5, 1], [.2, .12, .12, 1, 1]]), m, root);
    const A = [...Array(8)].map((_, k) => { const a = (k + .5) / 8 * TAU, p1 = pivot(root, Math.sin(a) * .15, .1, Math.cos(a) * .15); p1.rotation.order = 'YXZ'; mesh(geo().smooth(1).px(0, 32, 64, 32, W, W).at(LZ).loft(SEC6, [[0, .062, .052, 0, .9], [.32, .046, .04, .5, 1]]).at(null), m, p1);
      const p2 = pivot(p1, 0, 0, .32); mesh(geo().smooth(1).px(0, 32, 64, 32, W, W).at(LZ).loft(SEC6, [[0, .046, .04, .5, 1], [.28, .026, .024, .85, 1], [.5, .006, .006, 1, 1.1]]).at(null), m, p2); return [p1, p2, a]; });
    g.userData = { kind: 'octopus', dyn: true, tick: t => { A.forEach(([p1, p2, a], k) => { const w = t * 1.4 + k * .8; p1.rotation.set(.22 + Math.sin(w) * .2, a + Math.sin(t * .9 + k) * .14, 0); p2.rotation.x = -.5 + Math.sin(w - 1) * .5; p2.rotation.y = Math.cos(w * .7) * .4; }); const b = 1 + Math.sin(t * 2) * .04; head.scale.set(b, 2 - b, b); head.rotation.z = Math.sin(t * .6) * .06; } }; g.userData.tick(0); return g; }
  // くらげ（かさが のびちぢみし、うでが ゆれる。光に関係なく光る）。s, c, alpha, glow: false（光らせない）, seed
  function jelly(o = {}) { const s = o.s || 1, c = o.c || '#f0a0d8', gl = o.glow !== false, mb = xmat(tex.jelly({ c }), { glow: gl, alpha: o.alpha ?? .85, side: true }), ma = xmat(tex.jelly({ c, kind: 'arms' }), { glow: gl, cut: true, side: true, sway: { amp: .1 * s, f: 1.6, k: 1, inv: 1 } }), g = new THREE.Group(), root = pivot(g), r = .4, h = .36, ph = (o.seed || 0) * 2.1; root.scale.setScalar(s);
    const bell = mesh(geo().smooth(1).loft(8, [[-.03, r * .86, r * .86, 0, .85], [0, r, r, .06, 1], [h * .42, r * .95, r * .95, .35, 1], [h * .8, r * .62, r * .62, .72, 1.05], [h, r * .2, r * .2, .96, 1.1]], { cap: 'top', ur: 2, capUV: [.5, .99] }), mb, root); bell.renderOrder = 3;
    const Ga = geo().normal([0, 1, 0]); for (const [a, w, L] of [[0, .36, 1.5], [1.57, .36, 1.5], [.78, .26, 1.1], [2.36, .26, 1.1]]) { const cx = Math.cos(a) * w, cz = Math.sin(a) * w; for (let k = 0; k < 3; k++) Ga.quad([-cx, -L * (k + 1) / 3, -cz], [cx, -L * (k + 1) / 3, cz], [cx, -L * k / 3, cz], [-cx, -L * k / 3, -cz], [0, 1 - (k + 1) / 3, 1, 1 - k / 3]); } const arms = mesh(Ga, ma, root); arms.castShadow = false;
    g.userData = { kind: 'jelly', dyn: true, tick: t => { const p = Math.sin(t * 2.3 + ph); bell.scale.set(1 + p * .1, 1 - p * .14, 1 + p * .1); root.position.y = Math.sin(t * 2.3 + ph - 1.3) * .07 * s; } }; return g; }
  // いるか・くじら（しっぽを上下にふる。大きい）。kind: 'dolphin'（2.3 m）/ 'whale'（9 m）, s, c, c2
  function whale(o = {}) { const wh = o.kind === 'whale', L = wh ? 9 : 2.3, R0 = wh ? 1.2 : .27, m = xmat(tex.whale({ kind: wh ? 'whale' : 'dolphin', c: o.c, c2: o.c2 }), { side: true }), g = new THREE.Group(), root = pivot(g), W = 64; root.scale.setScalar(o.s || 1);
    const B = (z, a, b, v, c = 1, oy = 0) => [z * L, a * R0, b * R0, v, c, 0, -oy * R0], FIN = G => G.smooth(0).normal([0, 1, 0]).px(0, 26, 3, 14, W, W);
    const Gb = geo().smooth(1).at(LZ).loft(SEC8, wh ? [B(-.2, .56, .6, .3), B(0, .95, 1, .5), B(.2, 1.06, 1.05, .7), B(.36, .96, .9, .86, 1, -.05), B(.46, .62, .55, .96, 1, -.16), B(.5, .2, .2, 1, 1, -.22)] : [B(-.22, .5, .55, .3), B(-.02, .9, .95, .48), B(.18, 1, 1, .66), B(.32, .8, .85, .8), B(.4, .46, .5, .88, 1, -.1), B(.43, .22, .2, .92, 1, -.28), B(.5, .1, .08, 1, 1, -.32)], { cap: 'top', capUV: [.5, .99] }).at(null);
    FIN(Gb); if (wh) Gb.tri([0, R0 * .78, -.06 * L], [0, R0 * .66, -.16 * L], [0, R0 * 1.05, -.14 * L]); else Gb.tri([0, R0 * .95, .06 * L], [0, R0 * .9, -.1 * L], [0, R0 * 2, -.12 * L]); mesh(Gb.normal(null), m, root);
    const P = [1, -1].map(sx => { const p = pivot(root, sx * R0 * .82, -R0 * .45, .2 * L), G = FIN(geo()), ln = wh ? .3 * L : .2 * L; G.quad([0, 0, -.035 * L], [0, 0, .035 * L], [sx * ln * .6, -ln * .1, .0], [sx * ln, -ln * .25, -.1 * L - (wh ? .04 * L : 0)]); mesh(G, m, p); return p; });
    const tail = pivot(root, 0, 0, -.22 * L); mesh(geo().smooth(1).at(LZ).loft(SEC8, wh ? [[-.24 * L, .1 * R0, .14 * R0, .04], [-.12 * L, .3 * R0, .34 * R0, .16], [0, .56 * R0, .6 * R0, .3]] : [[-.26 * L, .09 * R0, .14 * R0, .04], [-.13 * L, .24 * R0, .32 * R0, .16], [0, .5 * R0, .55 * R0, .3]], { cap: 'bot', capUV: [.02, .1] }).at(null), m, tail);
    const fluke = pivot(tail, 0, 0, -.24 * L), Gf = FIN(geo()), fw = wh ? .2 * L : .18 * L; for (const sx of [1, -1]) Gf.quad([0, 0, .03 * L], [sx * fw * .5, 0, -.03 * L], [sx * fw, 0, -.12 * L], [0, 0, -.07 * L]); mesh(Gf, m, fluke);
    g.userData = { kind: 'whale', dyn: true, len: L * (o.s || 1), tick: (t, k = 1) => { const w = t * (wh ? 1.1 : 3.2) * k, a = Math.sin(w); tail.rotation.x = a * .28; fluke.rotation.x = Math.sin(w - 1) * .5; root.rotation.x = -a * .05; root.position.y = Math.cos(w) * (wh ? .12 : .05); P.forEach((p, i) => { p.rotation.z = (i ? -1 : 1) * (Math.sin(w * .5) * .18 - .1); }); } }; return g; }
  // かに（よこ歩きの足の動き）。s, c
  function crab(o = {}) { const m = xmat(tex.crab({ c: o.c }), { cut: true, side: true }), g = new THREE.Group(), root = pivot(g), W = 64, H = 32; root.scale.setScalar(o.s || 1);
    const Gb = geo().smooth(1).px(0, 0, 32, 32, W, H); domeP(Gb, { rx: .17, rz: .12, h: .075, y: .06, n: 8, rings: [[.6, .7], [1, 0]], belly: true }); Gb.smooth(0).px(32, 16, 4, 4, W, H); for (const sx of [1, -1]) Gb.box(.03, .055, .03, sx * .06, .1, .085); mesh(Gb, m, root);
    const Lg = []; for (const sx of [1, -1]) for (let k = 0; k < 3; k++) { const p = pivot(root, sx * .13, .075, .05 - k * .065); p.rotation.x = -.5; p.userData = { sx, k }; mesh(geo().normal([0, 1, 0]).px(32, 0, 16, 16, W, H).quad([0, -.1, 0], [sx * .17, -.1, 0], [sx * .17, .04, 0], [0, .04, 0]), m, p); Lg.push(p); }
    const Cl = [1, -1].map(sx => { const p = pivot(root, sx * .1, .075, .09); p.rotation.order = 'YXZ'; mesh(geo().normal([0, 1, 0]).px(48, 0, 16, 9, W, H).quad([0, -.04, 0], [sx * .2, -.04, 0], [sx * .2, .07, 0], [0, .07, 0]), m, p); return p; });
    g.userData = { kind: 'crab', dyn: true, tick: (t, walk = 1) => { Lg.forEach(p => { const { sx, k } = p.userData, w = t * 11 + k * 2.1 + (sx > 0 ? 0 : 1); p.rotation.z = sx * Math.sin(w) * .28 * walk; p.rotation.y = Math.cos(w) * .2 * walk + sx * (k - 1) * -.35; }); Cl.forEach((p, i) => { const sx = i ? -1 : 1; p.rotation.set(-.6, sx * -.95, sx * (.25 + Math.sin(t * 1.6 + i * 2) * .22)); }); root.position.y = Math.abs(Math.sin(t * 11)) * .008 * walk; } }; g.userData.tick(0); return g; }
  // かもめ（はばたく／すべる）。s, c。tick(t, glide 0〜1)
  function gull(o = {}) { const m = xmat(tex.gull({ c: o.c }), { side: true }), g = new THREE.Group(), root = pivot(g), W = 32; root.scale.setScalar(o.s || 1);
    const Gb = geo().smooth(1).px(0, 0, 32, 16, W, W).at(LZ).loft(SEC6, [[-.27, .012, .02, 0, .9], [-.12, .05, .05, .3, 1], [.04, .078, .072, .6, 1], [.15, .052, .056, .8, 1], [.21, .036, .04, .9, 1], [.28, .008, .01, 1, 1]], { cap: 'both', capUV: [.5, .5] }).at(null); Gb.smooth(0).normal([0, 1, 0]).px(8, 20, 8, 6, W, W).tri([-.06, 0, -.24], [.06, 0, -.24], [0, .01, -.4]); mesh(Gb.normal(null), m, root);
    const Wg = [1, -1].map(sx => { const p1 = pivot(root, sx * .05, .035, .03), G1 = geo().normal([0, 1, 0]).px(0, 16, 16, 16, W, W).quad([0, 0, -.1], [sx * .32, 0, -.09], [sx * .32, 0, .09], [0, 0, .11]); mesh(G1, m, p1); const p2 = pivot(p1, sx * .32, 0, 0), G2 = geo().normal([0, 1, 0]).px(16, 16, 16, 16, W, W).quad([0, 0, -.09], [sx * .32, 0, -.12], [sx * .36, 0, -.04], [0, 0, .09]); mesh(G2, m, p2); return [p1, p2]; });
    g.userData = { kind: 'gull', dyn: true, tick: (t, glide = 0) => { const f = Math.sin(t * 7), k = 1 - glide; Wg.forEach(([p1, p2], i) => { const sx = i ? -1 : 1; p1.rotation.z = sx * (f * .55 * k + .14); p2.rotation.z = sx * (Math.sin(t * 7 - .9) * .6 * k - .16); }); root.position.y = -f * .03 * k; } }; g.userData.tick(0); return g; }
  Object.assign(S, { fish, school, turtle, ray, octopus, jelly, whale, crab, gull, FISH });

  // ================= 6. ダイバー =================
  // R.actor に もぐる道具を付け、体を水平にした Group を返す（正面 +z。原点は腰。位置と rotation.y はページが決める）。
  //   o = { actor: { R.actor の引数（服の色・かみ型など） }, head: 'mask'（既定）/'snorkel'（マスク＋シュノーケル）/'helmet'（金物のヘルメット）/'none', tank: 色 か false, fin: 色 か false, metal, pitch（体のかたむき。1.57 でま水平。既定 1.3 ＝ 少し頭が上） }
  //   毎コマ S.swim(d, t, { kick, rate, stroke, arms: 'stroke'/'glide'/'reach', look }) で泳がせる。あわは S.breathe(d, env.bubbles, dt)。人そのものは d.userData.actor、関節は d.userData.J
  function diver(o = {}) { const A = R.actor({ build: 'toon', hairStyle: 'short', cloth: 'tunic', sleeve: 'long', lower: 'pants', top: '#2f6fb4', top2: '#f4d23a', bottom: '#27508c', gloves: 'glove', glove: '#2a3a5c', shoes: 'shoe', shoe: '#2a3a5c', belt: '#f4d23a', ...(o.actor || {}) });
    const D = A.userData.build, J = A.userData.J, Hd = D.head, HW = D.hw * Hd, hd = D.hdep || 1, Tt = D.torso, ch = D.chest, m = xmat(tex.gear({ tank: o.tank || undefined, fin: o.fin || undefined, metal: o.metal }), { side: true }), W = 64, head = o.head || 'mask';
    if (head === 'mask' || head === 'snorkel') { const G = geo().smooth(0), zf = HW * .9 * hd, y0 = .26 * Hd, y1 = .6 * Hd, w = HW * .96; G.px(2, 50, 12, 12, W, W).box(2 * w, y1 - y0, .09, 0, y0, zf, { bottom: true, c0: .85 }); G.px(32, 0, 32, 16, W, W).quad([-w, y0, zf + .048], [w, y0, zf + .048], [w, y1, zf + .048], [-w, y1, zf + .048]);
      G.smooth(1).px(2, 50, 12, 12, W, W).loft(8, [[.37 * Hd, HW * 1.07, HW * 1.07 * hd, 0, .8, 0, -.02 * HW], [.5 * Hd, HW * 1.08, HW * 1.08 * hd, 1, 1, 0, -.02 * HW]]);
      if (head === 'snorkel') G.px(36, 22, 4, 20, W, W).loft(4, [[.2 * Hd, .024, .024, 0, .85, -HW * 1.12, HW * .5], [.5 * Hd, .024, .024, .3, 1, -HW * 1.16, 0], [1.28 * Hd, .024, .024, 1, 1.1, -HW * 1.1, -HW * .3]], { cap: 'top' });
      J.head.add(mesh(G, m)); }
    if (head === 'helmet') { const G = geo().smooth(1).px(17, 49, 14, 14, W, W), r = HW * 1.5; G.loft(8, [[-.04 * Hd, HW * 1.25, HW * 1.25, 0, .75], [.06 * Hd, HW * 1.3, HW * 1.3, .1, 1], [.1 * Hd, r * .86, r * .86, .14, .9], [.36 * Hd, r, r, .4, 1], [.76 * Hd, r, r, .75, 1.05], [1.04 * Hd, r * .74, r * .74, .95, 1.1], [1.18 * Hd, r * .3, r * .3, 1, 1.15]], { cap: 'top', ur: 3 });
      G.smooth(0).px(32, 0, 32, 16, W, W).quad([-HW * .82, .3 * Hd, r * .95], [HW * .82, .3 * Hd, r * .95], [HW * .82, .78 * Hd, r * .95], [-HW * .82, .78 * Hd, r * .95]); for (const sx of [1, -1]) G.quad([sx * r * .96, .4 * Hd, -HW * .3], [sx * r * .96, .4 * Hd, HW * .3], [sx * r * .96, .7 * Hd, HW * .3], [sx * r * .96, .7 * Hd, -HW * .3]); J.head.add(mesh(G, m)); }
    if (o.tank !== false) { const G = geo().smooth(1).px(0, 0, 32, 48, W, W), r = D.sh * .44, z = -(ch + r * .95); G.loft(8, [[.02 * Tt, r * .7, r * .7, 0, .8, 0, z], [.12 * Tt, r, r, .08, .95, 0, z], [.84 * Tt, r, r, .86, 1, 0, z], [.95 * Tt, r * .5, r * .5, .93, 1, 0, z], [1.08 * Tt, r * .3, r * .3, 1, 1.05, 0, z]], { cap: 'both', ur: 1 });
      G.smooth(0).px(2, 50, 12, 12, W, W); for (const sx of [1, -1]) G.box(.05, Tt * .72, ch * 2.2 + .04, sx * D.sh * .6, Tt * .2, -.02, { c0: .9 }); J.torso.add(mesh(G, m)); }
    if (o.fin !== false) for (const n of ['L', 'R']) { const G = geo().smooth(0).normal([0, -.3, -1]), y0 = -D.shin - D.foot * .3, L = .6; G.px(32, 16, 32, 32, W, W).quad([-.19, y0 - L, .16], [.19, y0 - L, .16], [.07, y0, .02], [-.07, y0, .02]); J['shin' + n].add(mesh(G, m)); }
    const g = new THREE.Group(), tilt = pivot(g), pitch = o.pitch ?? 1.3, hy = A.userData.hipY * (o.actor && o.actor.s || 1); tilt.add(A); A.rotation.x = pitch; A.position.set(0, -hy * Math.cos(pitch), -hy * Math.sin(pitch));
    g.userData = { kind: 'diver', dyn: true, actor: A, J, tilt, pitch, breath: 0 }; swim(g, 0); return g; }
  function swim(d, t, o = {}) { const A = d.userData.actor, J = A.userData.J, k = o.kick ?? 1, ph = t * (o.rate ?? 5.5), s = Math.sin(ph), c = Math.cos(ph), st = t * (o.stroke ?? 2.4), p = (1 - Math.cos(st)) / 2, mode = o.arms || 'stroke';
    J.legL.rotation.x = s * .24 * k - .04; J.legR.rotation.x = -s * .24 * k - .04; J.shinL.rotation.x = .08 + Math.max(0, c) * .4 * k; J.shinR.rotation.x = .08 + Math.max(0, -c) * .4 * k; J.legL.rotation.z = -.06; J.legR.rotation.z = .06; J.hips.position.y = A.userData.hipY;
    for (const [n, sx] of [['L', 1], ['R', -1]]) { if (mode === 'glide') { J['arm' + n].rotation.set(.25 + s * .05 * sx, 0, sx * .1); J['fore' + n].rotation.x = -.15; } else if (mode === 'reach') { J['arm' + n].rotation.set(-2.7 + Math.sin(t * 1.3 + sx) * .08, 0, sx * .12); J['fore' + n].rotation.x = -.12; } else { J['arm' + n].rotation.set(-2.75 + 2.2 * p, 0, sx * (.1 + Math.sin(Math.PI * p) * .75)); J['fore' + n].rotation.x = -.12 - Math.sin(Math.PI * p) * .75; } }
    J.torso.rotation.set(-.1, s * .05, 0); J.head.rotation.set(-(o.look ?? .8), Math.sin(t * .6) * .12, 0); A.rotation.y = s * .07; d.userData.tilt.position.y = Math.sin(t * 1.2) * .05; if (J.cape) J.cape.rotation.x = .1; }
  // ダイバーの口もとから、ときどき あわを出す（2.6 秒に 1 回、まとめて）。bub = env.bubbles
  const _v = new THREE.Vector3();
  function breathe(d, bub, dt, every = 2.6) { const u = d.userData; u.breath += dt; const k = u.breath % every; if (k < .5 && Math.floor(k * 14) !== Math.floor((k - dt) * 14)) { u.J.head.localToWorld(_v.set(0, .12, .16)); bub.emit(_v.x, _v.y, _v.z, 1, .06); } }
  Object.assign(S, { diver, swim, breathe });

  // ================= 7. 沈んだ物 =================
  const dirTR = (x, y, z, dx, dy, dz) => { const l = Math.hypot(dx, dy, dz); return TR(x, y, z, Math.atan2(dx, dz), Math.acos(dy / l), 0); };   // +y の筒を (dx,dy,dz) の向きへ
  // 沈んだ帆船（長さ 14 m。船首 +z、底が y=0。かたむけるのはページで rotation.z など）。右げん（+x）の船腹に穴があき、ろっ骨が見える。
  //   帆柱は 3 本：前はのこり（やぶれた帆がゆれる）、まん中は折れて左げんへたおれ、うしろは根もとだけ。o = { s, c（木の色）, grow（ふじつぼ・もの量）, sail（帆の色。false でなし）, breach: false, seed }
  function ship(o = {}) { const sd = o.seed || 0, grow = o.grow ?? .6, B = parts(), hullT = tex.grown({ base: 'planks', o: { c: o.c || '#7c5c46' }, grow, seed: sd }), deckT = tex.grown({ base: 'planks', o: { c: o.deck || '#a08462' }, grow: grow * .7, seed: sd + 1 }), mh = xmat(hullT, { side: true }), md2 = xmat(deckT, { side: true }), G = B.g(mh), Gd = B.g(md2), m = 3;
    const ST = [[-7, 1.3, 4.9, 4.2], [-5.6, 1.85, 4.8, 4.2], [-3.4, 2.1, 4.75, 4.2], [-3.4, 2.1, 3.2, 2.6], [0, 2.2, 3.05, 2.5], [3.2, 2, 3.2, 2.6], [3.2, 2, 4, 3.4], [5.4, 1.2, 4.25, 3.5], [7, .14, 4.7, 3.6]], ky = z => z > 4 ? (z - 4) * .55 : z < -5.6 ? (-5.6 - z) * .4 : 0;
    for (let i = 0; i < ST.length - 1; i++) { const a = ST[i], b = ST[i + 1]; if (a[0] === b[0]) { const lo = Math.min(a[3], b[3]), hi = Math.max(a[3], b[3]); faceQ(G, [-a[1], lo, a[0]], [a[1], lo, a[0]], [a[1], hi, a[0]], [-a[1], hi, a[0]], [0, 0, a[1] * 2 / m, (hi - lo) / m], [.75, .75, .95, .95], [0, 0, a[3] > b[3] ? 1 : -1]); continue; }
      for (const sx of [1, -1]) { const K0 = [sx * .16, ky(a[0]), a[0]], K1 = [sx * .16, ky(b[0]), b[0]], B0 = [sx * a[1] * .84, ky(a[0]) + 1.05, a[0]], B1 = [sx * b[1] * .84, ky(b[0]) + 1.05, b[0]], R0 = [sx * a[1], a[2], a[0]], R1 = [sx * b[1], b[2], b[0]], u0 = a[0] / m, u1 = b[0] / m;
        if (!(sx > 0 && i === 4 && o.breach !== false)) faceQ(G, K0, K1, B1, B0, [u0, 0, u1, .4], [.55, .55, .8, .8], [sx, -.6, 0]); faceQ(G, B0, B1, R1, R0, [u0, .4, u1, .4 + (a[2] - 1) / m], [.8, .8, 1, 1], [sx, 0, 0]); }
      faceQ(Gd, [-a[1] * .98, a[3], a[0]], [a[1] * .98, a[3], a[0]], [b[1] * .98, b[3], b[0]], [-b[1] * .98, b[3], b[0]], [-a[1] / m, a[0] / m, a[1] / m, b[0] / m], 1, [0, 1, 0]); }
    faceQ(G, [-1.3, ky(-7), -7], [1.3, ky(-7), -7], [1.3, 4.9, -7], [-1.3, 4.9, -7], [0, 0, 2.6 / m, 1.4], [.6, .6, .9, .9], [0, 0, -1]); faceQ(G, [-.16, 0, -5.6], [.16, 0, -5.6], [1.3, ky(-7), -7], [-1.3, ky(-7), -7], [0, 0, .5, .3], .5, [0, -1, -1]);
    if (o.breach !== false) for (const z of [.5, 1.3, 2.1, 2.9]) G.at(TR(0, 0, z)).loft(4, [[0, .07, .07, 0, .5, .25, 0], [1.05, .07, .07, .4, .7, 1.8, 0], [2.3, .07, .07, .8, .9, 2.12, 0]]).at(null);
    Gd.box(1.5, .14, 1.5, 0, 2.5, -1.2, { m: 1.5, c0: .5, c1: .62 }); G.box(.22, .5, .22, 0, 4.2, -6.2, { m }).box(2.4, .1, .16, 0, 4.9, -6.95, { m });
    const mast = (x, y, z, h, r) => G.loft(6, [[y, r, r, 0, .78, x, z], [y + h, r * .62, r * .62, h / 1.5, 1, x, z]], { cap: 'top', capUV: [.5, .5] }), yard = (M, len, r = .08) => G.at(M).loft(5, [[-len / 2, r, r, 0, .8], [len / 2, r, r, len / 1.5, 1]], { cap: 'both' }).at(null);
    mast(0, 2.5, 2.1, 9.2, .2); yard(TR(0, 9.6, 2.1, 0, 0, Math.PI / 2), 5.2); yard(TR(0, 6.2, 2.1, 0, 0, Math.PI / 2), 4); G.loft(8, [[7.4, .34, .34, 0, .7, 0, 2.1], [7.95, .5, .5, .3, 1, 0, 2.1]]);
    G.loft(6, [[2.5, .24, .24, 0, .78, 0, -1.9], [4.5, .2, .2, 1, 1, 0, -1.9], [5.1, .08, .06, 1.2, .7, .1, -1.85]], { cap: 'top' }); G.at(dirTR(-.2, 4.7, -1.9, -6.6, -4.3, -1.6)).loft(6, [[0, .19, .19, 0, .9], [8.4, .11, .11, 5, 1]], { cap: 'both' }).at(null); yard(dirTR(-4.2, 2.1, -2.9, .3, .25, 1).multiply(TR(0, 0, 0)), 4.2);
    mast(0, 4.2, -5.2, 1.5, .17); G.at(dirTR(0, 4.1, 6.3, 0, .38, 1)).loft(5, [[0, .13, .13, 0, .8], [3.8, .06, .06, 2, 1]], { cap: 'top' }).at(null);
    if (o.sail !== false) { const ms = xmat(tex.sail({ c: o.sail || undefined, seed: sd, grow: grow * .6 }), { cut: true, side: true, sway: { amp: .16, f: 1, k: 1, inv: 1 } }), Gs = B.g(ms).normal([0, .5, 1]);
      const sheet = (x0, x1, yt, yb, z, bz) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const u0 = i / 2, u1 = (i + 1) / 2, v0 = j / 2, v1 = (j + 1) / 2, X = u => x0 + (x1 - x0) * u, Y = v => yb + (yt - yb) * v, Z = v => z + bz * Math.sin(v * Math.PI) + (1 - v) * bz * .5; Gs.quad([X(u0), Y(v0), Z(v0)], [X(u1), Y(v0), Z(v0)], [X(u1), Y(v1), Z(v1)], [X(u0), Y(v1), Z(v1)], [u0, v0, u1, v1], [.85 + v0 * .15, .85 + v0 * .15, .85 + v1 * .15, .85 + v1 * .15]); } };
      sheet(-2.4, 2.4, 9.5, 6.3, 2.2, .45); sheet(-1.8, 1.8, 6.1, 3.6, 2.2, .3); }
    const g = B.group(); g.scale.setScalar(o.s || 1); g.userData = { kind: 'ship', deck: 2.5 * (o.s || 1), castle: 4.2 * (o.s || 1), len: 14 * (o.s || 1) }; return g; }
  // 宝箱（ふたが開き、金貨が光る）。s, c, open（0〜1）
  function chest(o = {}) { const t = tex.chest({ c: o.c }), mw = xmat(t, { side: true }), mg = xmat(t, { emissive: '#8a6410' }), g = new THREE.Group(), W = 64, w = .92, h = .46, d = .58, open = o.open ?? 1; g.scale.setScalar(o.s || 1);
    const G = geo().smooth(0).px(0, 0, 32, 32, W, W).box(w, h, d, 0, 0, 0, { top: false, c0: .8 }); G.px(32, 32, 32, 32, W, W).quad([-w / 2, .06, d / 2], [w / 2, .06, d / 2], [w / 2, .06, -d / 2], [-w / 2, .06, -d / 2]); mesh(G, mw, g);
    const lid = pivot(g, 0, h, -d / 2); lid.rotation.x = -open * 1.85; mesh(geo().smooth(0).px(32, 0, 32, 32, W, W).box(w * 1.02, .2, d * 1.02, 0, 0, d / 2, { taper: [.96, .72], bottom: true, c0: .9 }), mw, lid);
    if (open > .2) { const Gg = geo().smooth(1).px(0, 32, 32, 32, W, W); domeP(Gg, { rx: w * .45, rz: d * .43, h: .2, y: h * .7, n: 7, rings: [[.6, .6], [1, 0]], shade: [1.15, 1, .85] }); Gg.smooth(0).px(1, 33, 14, 14, W, W); for (const [x, z, r] of [[.62, .3, .16], [-.5, .46, .13], [.2, .52, .1], [-.75, .12, .11]]) Gg.quad([x - r, .02, z + r], [x + r, .02, z + r], [x + r, .02, z - r], [x - r, .02, z - r]); mesh(Gg, mg, g); }
    g.userData = { kind: 'chest', lid }; return g; }
  // いかり（高さ 2.4 m。立った向き。ねかせるのはページで）。s, c, grow
  function anchor(o = {}) { const t = tex.iron({ c: o.c, grow: o.grow ?? .6 }), G = geo().smooth(1); G.loft(5, [[.22, .1, .1, 0, .8], [2.15, .07, .07, 1.3, 1]], { cap: 'top' }); G.at(TR(0, 1.95, 0, 0, Math.PI / 2, 0)).loft(5, [[-.75, .05, .05, 0, .85], [.75, .05, .05, 1, 1]], { cap: 'both' }).at(null);
    for (const [x, y, rz] of [[-.13, 2.3, .78], [.13, 2.3, -.78], [-.13, 2.5, -.78], [.13, 2.5, .78]]) G.at(TR(x, y, 0, 0, 0, rz)).box(.05, .26, .05, 0, -.13, 0, { m: .5 }).at(null);
    for (const sx of [1, -1]) { G.smooth(1).loft(4, [[.12, .11, .1, 0, .75, 0, 0], [.2, .1, .09, .2, .9, sx * .42, 0], [.52, .08, .07, .5, 1, sx * .82, 0], [.98, .03, .03, .9, 1, sx * 1, 0]], { cap: 'top' }); G.smooth(0); faceT(G, [sx * .62, .34, .2], [sx * .62, .34, -.2], [sx * 1.04, 1.1, 0], [0, 0], [.4, 0], [.2, .6], 1, [sx, 1, 0]); faceT(G, [sx * .62, .34, -.2], [sx * .62, .34, .2], [sx * 1.04, 1.1, 0], [0, 0], [.4, 0], [.2, .6], .7, [-sx, -1, 0]); }
    const me = G.mesh(t); me.scale.setScalar(o.s || 1); return me; }
  // つぼ。s, c（素焼きの色）, c2（もようの色）, grow, seed
  function pot(o = {}) { const s = o.s || 1, h = .9 * s, r = s, t = tex.pot({ c: o.c, c2: o.c2, grow: o.grow, seed: o.seed });
    return geo().smooth(1).loft(8, [[0, .13 * r, .13 * r, 0, .7], [.07 * h, .2 * r, .2 * r, .06, .85], [.38 * h, .34 * r, .34 * r, .4, 1], [.62 * h, .3 * r, .3 * r, .66, 1], [.8 * h, .14 * r, .14 * r, .84, .95], [.9 * h, .12 * r, .12 * r, .92, 1], [h, .2 * r, .2 * r, 1, 1.1], [h - .03 * s, .13 * r, .13 * r, 1, .25]], { cap: 'top', capUV: [.5, .5] }).mesh(t); }
  // 神殿の石の柱。h（高さ m）, r（半径）, c, grow, broken（true で上が折れている）, base: false（台なし：たおれた柱のかけら用）, seed
  function pillar(o = {}) { const h = o.h || 5, r = o.r || .42, sd = o.seed || 0, c = o.c || '#d8d2c0', B = parts(), G = B.g(tex.column({ c, grow: o.grow, seed: sd % 3 })).smooth(1), Gb = B.g(tex.grown({ base: 'stone', o: { c }, grow: o.grow ?? .5, from: 'bottom', seed: sd % 3 })), base = o.base !== false, y0 = base ? .5 : 0, m = 3;
    if (base) { Gb.box(r * 2.9, .26, r * 2.9, 0, 0, 0, { m }); G.loft(10, [[.26, r * 1.3, r * 1.3, 0, .8], [.38, r * 1.32, r * 1.32, .04, 1], [.5, r * 1.04, r * 1.04, .08, .88]]); }
    if (o.broken) G.loft(10, [[y0, r, r, y0 / m, .82], [h - .35, r * .9, r * .9, (h - .35) / m, 1], [h - .1, r * .86, r * .7, h / m, .95, r * .12, .05], [h, r * .4, r * .3, h / m, .6, r * .3, .1]], { cap: 'top', capUV: [.5, .5] });
    else { G.loft(10, [[y0, r, r, y0 / m, .82], [y0 + (h - y0) * .4, r * .98, r * .98, (y0 + (h - y0) * .4) / m, 1], [h - .5, r * .84, r * .84, (h - .5) / m, 1], [h - .36, r * .92, r * .92, (h - .36) / m, .85], [h - .22, r * 1.28, r * 1.28, (h - .22) / m, 1.05]]); Gb.box(r * 2.8, .22, r * 2.8, 0, h - .22, 0, { m }); }
    const g = B.group(); g.userData = { h }; return g; }
  // ガラスのドーム（海底の町用。金のほね組み＋うすいガラス＋鉄の土台）。r（半径）, h（高さ）, n（よこの ますの数）, c（ほねの色）, glass, alpha（ガラスのこさ）
  function dome(o = {}) { const r = o.r || 8, n = o.n || 12, hh = o.h || r * .8, g = new THREE.Group(), prof = [[0, 1], [.2, .985], [.44, .89], [.66, .72], [.84, .48], [.96, .22]], rings = k => prof.map(([y, f], i) => [y * hh, f * r * k, f * r * k, i, 1]);
    const fr = geo().smooth(1).loft(n, rings(1), { ur: n }).mesh(xmat(tex.domeFrame({ c: o.c }), { cut: true, side: true })); fr.castShadow = false;
    const gl = geo().smooth(1).loft(n, rings(.995), { ur: n / 3, cap: 'top', capUV: [.5, .5] }).mesh(xmat(tex.glass({ c: o.glass }), { glow: true, alpha: o.alpha ?? .2, side: true })); gl.renderOrder = 5; gl.castShadow = false; gl.userData.dyn = true;
    const bs = geo().smooth(1).loft(n, [[-.6, r * 1.05, r * 1.05, 0, .7], [.28, r * 1.05, r * 1.05, .6, 1], [.34, r * 1.0, r * 1.0, .66, 1.1]], { ur: n }).loft(8, [[hh * .955, r * .26, r * .26, 0, .9], [hh + .5, r * .1, r * .1, .5, 1.1], [hh + 1.4, .03, .03, 1, 1.2]]).mesh(tex.iron({ c: o.base || '#8a7a5a', grow: .4 }));
    g.add(fr, gl, bs); g.userData = { kind: 'dome', r, h: hh, glass: gl }; return g; }
  Object.assign(S, { ship, chest, anchor, pot, pillar, dome });

  // ================= 8. 海面（上から見る場面用） =================
  // 動く海面。大きな波で頂点が上下し、波がしらが明るくなる。半透明なので、しずめた物が水の中にうすく見える。
  //   o = { w, d, cell, c（水の色）, level（水面の高さ。既定 0）, wave（波の高さ m）, alpha（0〜1。1 で不透明）, m（テクスチャ 1 枚の大きさ m）, fps,
  //         shore(x, z) → 0〜1（1 に近いほど岸・浅瀬。水色が明るくなり、.75 から白い泡になる） }
  //   返すもの：{ mesh, mat, level, h(x, z, t)（その場の波の高さ：舟・うきを浮かせる）, tick(t, cx, cz)（毎コマ。cx, cz は主役の位置） }
  function sea(o = {}) { const cell = o.cell || 4, nx = Math.round((o.w || 200) / cell), nz = Math.round((o.d || 200) / cell), level = o.level ?? 0, amp = o.wave ?? .3, F = tex.swell({ c: o.c, m: o.m }), mm = F[0].userData.m, alpha = o.alpha ?? .86, shore = o.shore;
    const g = new THREE.PlaneGeometry(nx * cell, nz * cell, nx, nz); g.rotateX(-Math.PI / 2); const P = g.attributes.position, n = P.count, base = P.array.slice(), uv = g.attributes.uv, col = new Float32Array(n * 3).fill(1); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mt = new THREE.MeshLambertMaterial({ map: F[0], vertexColors: true, transparent: alpha < 1, opacity: alpha, depthWrite: alpha >= 1 }); mt.onBeforeCompile = snap; const me = new THREE.Mesh(g, mt); me.frustumCulled = false; me.receiveShadow = true; me.renderOrder = 2;
    const h = (x, z, t) => level + amp * (Math.sin(x * .19 + t * .9) * .5 + Math.sin(z * .23 + t * .7 + x * .06) * .35 + Math.sin((x + z) * .41 + t * 1.4) * .15);
    function tick(t, cx = 0, cz = 0) { const sx = Math.round(cx / cell) * cell, sz = Math.round(cz / cell) * cell;
      for (let i = 0; i < n; i++) { const x = base[i * 3] + sx, z = base[i * 3 + 2] + sz, y = h(x, z, t), k = amp ? (y - level) / amp : 0; P.array[i * 3 + 1] = y; uv.array[i * 2] = x / mm; uv.array[i * 2 + 1] = -z / mm; let r = 1 + k * .2, gg = 1 + k * .17, b = 1 + k * .1;
        if (shore) { const f = cl(shore(x, z)), fo = cl((f - .78 + .08 * Math.sin(t * 1.4 + x * .7 + z * .5)) * 6); r *= 1 + f * 1.1; gg *= 1 + f * .5; b *= 1 + f * .22; r += (3.4 - r) * fo; gg += (1.9 - gg) * fo; b += (1.5 - b) * fo; }
        col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b; }
      P.needsUpdate = uv.needsUpdate = g.attributes.color.needsUpdate = true; me.position.set(sx, 0, sz); R.flip(mt, F, t, o.fps || 3); }
    tick(0); return { mesh: me, mat: mt, level, h, tick }; }
  // 水面より下の部分を、深さに合わせて水の色へよせる（頂点の色を書きかえる）。建物・柱・岩を作って置いたあと（R.merge の前でも後でもよい）に 1 回呼ぶ。
  //   o = { level（水面の高さ）, depth（この深さで いちばん青くなる m）, c（水の色）, k（青くする強さ 0〜1）, dark（深い所を暗くする量 0〜1） }
  function sink(obj, o = {}) { const level = o.level ?? 0, depth = o.depth ?? 5, c = new THREE.Color(o.c || '#2f8fb8'), kk = o.k ?? .85, dk = o.dark ?? .25, v = new THREE.Vector3(), mx = Math.max(c.r, c.g, c.b) || 1, tr = c.r / mx, tg = c.g / mx, tb = c.b / mx; obj.updateMatrixWorld(true);
    obj.traverse(nd => { if (!nd.isMesh || !nd.geometry.attributes.color || nd.isInstancedMesh) return; const P = nd.geometry.attributes.position, C = nd.geometry.attributes.color; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(nd.matrixWorld); const k = cl((level - v.y) / depth); if (k <= 0) continue; const f = Math.min(1, .35 + k) * kk, d = 1 - dk * k; C.setXYZ(i, C.getX(i) * (1 + (tr - 1) * f) * d, C.getY(i) * (1 + (tg - 1) * f) * d, C.getZ(i) * (1 + (tb - 1) * f) * d); } C.needsUpdate = true; }); return obj; }
  // 水ぎわの白い泡の輪（建物・柱・岩の足もとに置く。動かない物なので R.merge でまとめられる。泡のコマは S.tick が送る）。
  //   o = { w, d }（四角）か { r, n }（まるい物）、wd（泡のはば）, y（水面の高さ ＋ 少し）
  let FOAM = null; const foamMat = () => { if (!FOAM) { const F = tex.foam(); FOAM = { F, m: xmat(F[0], { cut: true, side: true, glow: true, offset: true }) }; } return FOAM.m; };
  function foamRing(o = {}) { const wd = o.wd ?? .7, y = o.y ?? .05, G = geo(), pts = []; if (o.r) { const n = o.n || 10; for (let k = 0; k < n; k++) { const a = -k / n * TAU; pts.push([Math.cos(a) * o.r, Math.sin(a) * o.r, Math.cos(a), Math.sin(a)]); } } else { const a = (o.w || 4) / 2, b = (o.d || 4) / 2; pts.push([-a, b, -1, 1], [a, b, 1, 1], [a, -b, 1, -1], [-a, -b, -1, -1]); }
    let u = 0; for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[(k + 1) % pts.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]), u1 = u + Math.max(1, Math.round(len / 2)); faceQ(G, [p[0], y, p[1]], [q[0], y, q[1]], [q[0] + q[2] * wd, y, q[1] + q[3] * wd], [p[0] + p[2] * wd, y, p[1] + p[3] * wd], [u, 0, u1, 1], 1, [0, 1, 0]); u = u1; }
    const me = G.mesh(foamMat()); me.castShadow = false; me.receiveShadow = false; return me; }
  // いかだ（丸太＋うきのたる＋小さな帆）。w, d, c, mast: false, cloth（帆の色）。userData.deck = 上にのる高さ
  function raft(o = {}) { const w = o.w || 3.2, d = o.d || 2.6, B = parts(), Lg = B.g(tex.grown({ base: 'planks', o: { c: o.c || '#a8824e' }, grow: .25, dots: false, seed: 2 })).smooth(1), n = Math.round(w / .36);
    for (let i = 0; i < n; i++) Lg.at(TR(-w / 2 + (i + .5) * w / n, .12, 0, 0, Math.PI / 2, 0)).loft(6, [[-d / 2 - hash(i, 1) * .25, .16, .16, 0, .75], [d / 2 + hash(i, 2) * .25, .17, .17, d / 1.5, 1]], { cap: 'both', capUV: [.5, .5] }); Lg.at(null).smooth(0);
    for (const z of [-d * .32, d * .32]) Lg.box(w * .96, .08, .18, 0, .27, z, { m: 2 });
    if (o.mast !== false) { Lg.smooth(1).loft(5, [[.25, .06, .06, 0, .8, -w * .2, 0], [2.7, .045, .045, 1.6, 1, -w * .2, 0]], { cap: 'top' }).at(TR(-w * .2, 2.45, 0, 0, 0, Math.PI / 2)).loft(4, [[-.8, .03, .03, 0, .8], [.8, .03, .03, 1, 1]], { cap: 'both' }).at(null);
      B.g(T.fabric({ c: o.cloth || '#e8a83a', pattern: 'stripe' }), { side: true }).normal([0, .5, 1]).quad([-w * .2 - .72, 1.1, .03], [-w * .2 + .72, 1.1, .03], [-w * .2 + .75, 2.42, 0], [-w * .2 - .75, 2.42, 0], [0, 0, 1.5, 1.4], [.85, .85, 1, 1]); }
    const g = B.group(); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const b = R.barrel({ h: .8, r: .28, c: o.barrel || '#4a80a0' }); b.rotation.x = Math.PI / 2; b.position.set(x * w * .4, -.02, z * d * .26 - .4); g.add(b); }
    g.userData = { kind: 'raft', deck: .33 }; return g; }
  // うき（ブイ。赤白のしま、上に小さなあかり）。s, c, lamp（あかりの色）。水面に置き、S.sea の h でゆらす
  function buoy(o = {}) { const g = new THREE.Group(); g.scale.setScalar(o.s || 1);
    g.add(geo().smooth(1).loft(8, [[-.55, .12, .12, 1, .7], [-.3, .5, .5, .8, .85], [.22, .56, .56, .35, 1], [.42, .4, .4, .12, 1.05], [.5, .14, .14, 0, 1.1]], { ur: 2 }).mesh(tex.buoy({ c: o.c })), geo().smooth(1).loft(4, [[.48, .06, .06, 0, .8], [1.45, .035, .035, 1, 1]]).box(.2, .04, .2, 0, 1.42, 0, { m: .5 }).mesh(tex.iron({ grow: .2 })));
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(.12), new THREE.MeshBasicMaterial({ color: o.lamp || '#ffe070' })); lamp.material.onBeforeCompile = snap; lamp.position.y = 1.58; lamp.userData.dyn = true; g.add(lamp); g.userData = { kind: 'buoy', lamp }; return g; }
  // 桟橋（x にそってのびる板の道。くいは水の中へ）。len, w, h（床の高さ）, depth（くいが水面の下へのびる長さ）, c, grow
  function pier(o = {}) { const len = o.len || 12, w = o.w || 1.8, h = o.h ?? .55, dp = o.depth ?? 3, B = parts(), Dk = B.g(T.planks({ c: o.c || '#a08058' })), Ps = B.g(tex.grown({ base: 'planks', o: { c: '#6e5238' }, grow: o.grow ?? .7, from: 'bottom', seed: 4 })).smooth(1), n = Math.max(2, Math.round(len / 2.4) + 1);
    Dk.box(len, .1, w, 0, h - .1, 0, { m: 2, c0: .7, bottom: true });
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) Ps.loft(6, [[-dp, .12, .12, 0, .5, -len / 2 + .3 + i * (len - .6) / (n - 1), s * (w / 2 - .12)], [h + (i % 2 ? .1 : .55) + hash(i, s) * .15, .09, .09, (dp + h) / 1.5, 1, -len / 2 + .3 + i * (len - .6) / (n - 1), s * (w / 2 - .12)]], { cap: 'top', capUV: [.5, .5] });
    const g = B.group(); g.userData = { kind: 'pier', deck: h }; return g; }
  // 毎コマ 1 回呼ぶ：ゆれる物（海草・いそぎんちゃく・くらげのうで・帆）の時計と、泡のコマを進める。underwater の E.tick は中でこれを呼ぶ
  S.tick = t => { U.time.value = t; if (FOAM) R.flip(FOAM.m, FOAM.F, t, 4); };
  Object.assign(S, { sea, sink, foamRing, raft, buoy, pier, tex, paint, mat: xmat, domeP, faceQ, faceT, LZ });
  return S;


};
