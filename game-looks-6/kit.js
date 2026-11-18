// game-looks-6 の共通部品（第 2 集の kit.js をもとに足したもの）。各ページは three.js を読みこんだあと  const K = KIT(THREE)  として使う。
// 入っているもの：舞台の用意（たて長では画角を自動で広げる）、空のグラデーション、ドット模様、ローポリの地面、
// 8×8 ドット絵の効果（炎・煙・きらめき・水しぶき・雪けむり・泡）、ローポリの小物（人・木・家・岩・雲・車・舟）、
// 仕上げの画面加工（法線と奥行きを使った輪郭線、決めた色だけに丸めるパレット）、毎コマの呼び出し
window.KIT = (THREE) => {
  const hash = (a, b = 0) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };

  function stage(o = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: o.aa !== false }); renderer.setPixelRatio(o.pr || Math.min(devicePixelRatio, 2)); document.body.prepend(renderer.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(o.fov || 45, 1, .1, o.far || 500), subs = [];
    const fov0 = o.fov || 45, A0 = o.fitAspect || 1.15;   // 横長での画角。たて長（横/たて が A0 より小さい）では、横に見える広さが変わらないよう たての画角を広げる（上限 o.maxFov）
    const resize = () => { renderer.setSize(innerWidth, innerHeight); const a = innerWidth / innerHeight; cam.aspect = a; cam.fov = a >= A0 ? fov0 : Math.min(o.maxFov || 96, 2 * Math.atan(Math.tan(fov0 * Math.PI / 360) * A0 / a) * 180 / Math.PI); cam.updateProjectionMatrix(); subs.forEach(f => f(innerWidth, innerHeight)); };
    addEventListener('resize', resize); resize(); addEventListener('orientationchange', () => [100, 400, 900].forEach(t => setTimeout(resize, t))); if (window.visualViewport) visualViewport.addEventListener('resize', resize);   // iOS は回した直後だと画面の大きさが古いままのことがあるので、少し待ってからも測りなおす
    return { renderer, scene, cam, onResize: f => { subs.push(f); f(innerWidth, innerHeight); } };
  }

  // 空：上から下への色の帯。stops = [[位置 0〜1, 色], …]
  function sky(stops) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); for (const [p, col] of stops) g.addColorStop(p, col); x.fillStyle = g; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

  // ドット模様：fn(i, j) が 0〜1 の明るさ、または色の文字列を返す。にじませずに拡大する
  function pix(fn, size = 16, repeat = 1) { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { const v = fn(i, j); if (typeof v === 'string') x.fillStyle = v; else { const q = Math.round(255 * v); x.fillStyle = `rgb(${q},${q},${q})`; } x.fillRect(i, j, 1, 1); } const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.colorSpace = THREE.SRGBColorSpace; return t; }

  const flat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .9, ...extra });
  const glow = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
  function add(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, typeof mat === 'string' ? flat(mat) : mat); m.position.set(x, y, z); parent.add(m); return m; }
  const box = (p, w, h, d, mat, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z);

  // ローポリの地面：高さの式 H(x, z) と色の式 colorFn(高さ, x, z) → THREE.Color。follow() でカメラの下へ送りなおす
  function terrain(H, nx, nz, cell, colorFn, matOpts = {}) {
    const g = new THREE.PlaneGeometry(nx * cell, nz * cell, nx, nz).toNonIndexed(); g.rotateX(-Math.PI / 2);
    const base = g.attributes.position.array.slice(), col = new Float32Array(base.length); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, ...matOpts })); mesh.frustumCulled = false; let px = null, pz = null;
    function follow(cx = 0, cz = 0, zoff = 0) {
      const sx = Math.round(cx / cell) * cell, sz = Math.round(cz / cell) * cell + zoff; if (sx === px && sz === pz) return; px = sx; pz = sz; const p = g.attributes.position.array;
      for (let i = 0; i < p.length; i += 9) { let hy = 0, mx = 0, mz = 0; for (let k = 0; k < 3; k++) { const x = base[i + k * 3] + sx, z = base[i + k * 3 + 2] + sz, y = H(x, z); p[i + k * 3 + 1] = y; hy += y / 3; mx += x / 3; mz += z / 3; } const c = colorFn(hy, mx, mz); for (let k = 0; k < 3; k++) { col[i + k * 3] = c.r; col[i + k * 3 + 1] = c.g; col[i + k * 3 + 2] = c.b; } }
      g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; mesh.position.set(sx, 0, sz);
    }
    follow(0, 0); return { mesh, follow };
  }
  const colors = (...list) => list.map(c => new THREE.Color(c));

  // 針葉樹（雪つきにもできる）
  function pine(h, leaf = '#2f6a4a', trunk = '#5a4030', snow = null) { const gp = new THREE.Group(); add(gp, new THREE.CylinderGeometry(h * .04, h * .06, h * .3, 5), trunk, 0, h * .15, 0); for (let k = 0; k < 3; k++) { const r = h * (.3 - k * .07), y = h * (.36 + k * .22); add(gp, new THREE.ConeGeometry(r, h * .36, 6), leaf, 0, y, 0).rotation.y = k; if (snow) add(gp, new THREE.ConeGeometry(r * .62, h * .2, 6), snow, 0, y + h * .09, 0).rotation.y = k; } return gp; }

  // 8×8 ドット絵の効果。板は常にカメラを向く。kind: flame / smoke / spark / splash / puff / bubble
  const KINDS = ['flame', 'smoke', 'spark', 'splash', 'puff', 'bubble'];
  function atlas() {
    const c = document.createElement('canvas'); c.width = 32; c.height = 8 * KINDS.length; const x = c.getContext('2d'); const P = (i, j, col) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); };
    KINDS.forEach((kind, row) => { for (let f = 0; f < 4; f++) for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const ox = f * 8 + i, oy = row * 8 + j, dx = i - 3.5, dy = j - 3.5, r = Math.hypot(dx, dy), n = hash(i + f * 13, j + row * 7);
        if (kind === 'flame') { const hh = 7 - j, w = (3.3 - hh * .44) * (1 - f * .16) + (n - .5) * .8; if (Math.abs(dx) < w && hh < 8 - f * 1.4) P(ox, oy, Math.abs(dx) < w * .4 && hh < 4 - f * .6 ? '#fff6b0' : Math.abs(dx) < w * .75 ? '#ffa832' : '#e8452a'); }
        if (kind === 'smoke' || kind === 'puff') { const rad = 1.6 + f * .75; if (r < rad && n > f * .16) P(ox, oy, kind === 'puff' ? (dy < 0 ? '#ffffff' : '#d8e4f4') : (dy < 0 ? '#9a9aa6' : '#62626e')); }
        if (kind === 'spark') { const arm = [1, 2.6, 3.6, 1.2][f]; if ((Math.abs(dx) < .6 && Math.abs(dy) < arm) || (Math.abs(dy) < .6 && Math.abs(dx) < arm)) P(ox, oy, r < 1 ? '#ffffff' : '#fff2a0'); }
        if (kind === 'splash') { const rad = 1 + f * .9; if (Math.abs(r - rad) < .6 && dy < 1.5 && n > .25) P(ox, oy, n > .6 ? '#ffffff' : '#bfe4ff'); if (f < 2 && Math.abs(dx) < 1 && dy < 0 && dy > -3 + f) P(ox, oy, '#ffffff'); }
        if (kind === 'bubble') { const rad = 1.4 + f * .5; if (Math.abs(r - rad) < .55) P(ox, oy, '#bfe9ff'); if (i === 3 && j === 3 - Math.min(1, f)) P(ox, oy, '#ffffff'); } } });
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function fx(scene, max = 180) {
    const tex = atlas(), pool = [], live = [];
    for (let i = 0; i < max; i++) { const map = tex.clone(); map.repeat.set(1 / 4, 1 / KINDS.length); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false })); s.visible = false; scene.add(s); pool.push(s); }
    function emit(kind, x, y, z, o = {}) { const s = pool.pop(); if (!s) return; const row = KINDS.indexOf(kind), sp = o.spread || 0;
      Object.assign(s.userData, { row, age: 0, life: o.life || 1, size: o.size || 1, grow: o.grow || 0, grav: o.grav || 0, vx: (o.vx || 0) + (Math.random() - .5) * sp, vy: (o.vy || 0) + (Math.random() - .5) * sp, vz: (o.vz || 0) + (Math.random() - .5) * sp, fade: o.fade !== false });
      s.material.blending = o.add ? THREE.AdditiveBlending : THREE.NormalBlending; s.material.fog = o.fog !== false; s.material.color.set(o.tint || '#ffffff'); s.position.set(x, y, z); s.visible = true; live.push(s); }
    function update(dt) { for (let i = live.length - 1; i >= 0; i--) { const s = live[i], u = s.userData; u.age += dt; const k = u.age / u.life; if (k >= 1) { s.visible = false; live.splice(i, 1); pool.push(s); continue; }
        u.vy += u.grav * dt; s.position.x += u.vx * dt; s.position.y += u.vy * dt; s.position.z += u.vz * dt; s.scale.setScalar(u.size * (1 + u.grow * k)); s.material.opacity = u.fade ? Math.min(1, (1 - k) * 3) : 1; s.material.map.offset.set(Math.min(3, Math.floor(k * 4)) / 4, 1 - (u.row + 1) / KINDS.length); } }
    return { emit, update };
  }

  // 仕上げ：場面を 1 枚の絵に描いてから、body の式で画面全体を加工する。
  // o.width を指定すると横その数のドットの粗い絵になる。body では src(uv) で元の色、size がドット数、res が画面の大きさ、px が 1 ドットの大きさ(uv)。
  // o.gbuf を true にすると、法線と奥行きも描く。body で nrm(uv)＝面の向き(−1〜1、カメラから見た向き)、dep(uv)＝カメラからの距離、
  // edge(uv, w, nt, dt)＝輪郭の強さ 0〜1（w は線の太さ(ドット)、nt は面の向きの差のしきい値、dt は奥行きの差(割合)のしきい値）が使える。
  // 輪郭には板のスプライト・点・線・半透明の物は入らない。ほかに h(p) 乱数、vn(p) なめらかな乱数、fbm(p)、bayer(p)、luma(c) がある
  function post(renderer, body, uniforms = {}, o = {}) {
    const near = o.width ? THREE.NearestFilter : THREE.LinearFilter;
    const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: near, magFilter: near });
    let rtN = null, nMat = null; if (o.gbuf) { rtN = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }); rtN.depthTexture = new THREE.DepthTexture(4, 4); nMat = new THREE.MeshNormalMaterial({ flatShading: o.gbuf !== 'smooth' }); }
    const u = { tD: { value: rt.texture }, tN: { value: rtN && rtN.texture }, tZ: { value: rtN && rtN.depthTexture }, nf: { value: new THREE.Vector2(.1, 500) }, res: { value: new THREE.Vector2() }, size: { value: new THREE.Vector2() }, px: { value: new THREE.Vector2() }, time: { value: 0 }, ...uniforms };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: `precision highp float;uniform sampler2D tD,tN,tZ;uniform vec2 res,size,px,nf;uniform float time;varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+7.1;a*=.5;}return s;}
float bayer(vec2 p){vec2 a=mod(p,2.),b=mod(floor(p/2.),2.);float x=(a.y<.5)?(a.x<.5?0.:2.):(a.x<.5?3.:1.);float y=(b.y<.5)?(b.x<.5?0.:2.):(b.x<.5?3.:1.);return (x*4.+y)/16.;}
float luma(vec3 c){return dot(c,vec3(.3,.59,.11));}
vec3 src(vec2 uv){return pow(max(texture2D(tD,uv).rgb,0.),vec3(1./2.2));}
vec3 nrm(vec2 uv){return texture2D(tN,uv).rgb*2.-1.;}
float dep(vec2 uv){float z=texture2D(tZ,uv).r*2.-1.;return 2.*nf.x*nf.y/(nf.y+nf.x-z*(nf.y-nf.x));}
float edge(vec2 uv,float w,float nt,float dt){vec2 e=px*w;vec3 n0=nrm(uv+e*vec2(-.5,-.5)),n1=nrm(uv+e*vec2(.5,.5)),n2=nrm(uv+e*vec2(.5,-.5)),n3=nrm(uv+e*vec2(-.5,.5));float d0=dep(uv+e*vec2(-.5,-.5)),d1=dep(uv+e*vec2(.5,.5)),d2=dep(uv+e*vec2(.5,-.5)),d3=dep(uv+e*vec2(-.5,.5));
float en=max(length(n0-n1),length(n2-n3)),ed=max(abs(d0-d1),abs(d2-d3))/min(min(d0,d1),min(d2,d3));return max(smoothstep(nt,nt*1.6,en),smoothstep(dt,dt*1.6,ed));}
` + body });
    const ps = new THREE.Scene(); ps.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)); const pc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), hid = [];
    const resize = (w, h) => { let rw, rh; if (o.width) { const ww = w < h ? Math.round(o.width * (o.tall || .62)) : o.width; rw = ww; rh = Math.max(60, Math.round(ww * h / w)); } else { const s = (o.scale || 1) * renderer.getPixelRatio(); rw = Math.round(w * s); rh = Math.round(h * s); } rt.setSize(rw, rh); if (rtN) rtN.setSize(rw, rh); u.size.value.set(rw, rh); u.px.value.set(1 / rw, 1 / rh); u.res.value.set(w, h); };
    return { u, resize, render(scene, cam, t) { u.time.value = t; u.nf.value.set(cam.near, cam.far); renderer.setRenderTarget(rt); renderer.render(scene, cam);
        if (rtN) { hid.length = 0; scene.traverse(q => { if (q.visible && (q.isSprite || q.isPoints || q.isLine || (q.isMesh && (q.material.transparent || q.userData.noEdge)))) { q.visible = false; hid.push(q); } }); const bg = scene.background, fg = scene.fog; scene.background = null; scene.fog = null; scene.overrideMaterial = nMat; renderer.setRenderTarget(rtN); renderer.setClearColor(0x8080ff, 1); renderer.clear(); renderer.render(scene, cam); scene.overrideMaterial = null; scene.background = bg; scene.fog = fg; for (const q of hid) q.visible = true; }
        renderer.setRenderTarget(null); renderer.render(ps, pc); } };
  }
  // よく使う仕上げ：色を n 段に丸め、境目を 4×4 の点の並びで混ぜる（ドット絵らしい粗さ）
  const DITHER = (n, amt) => `void main(){vec2 px=floor(vUv*size);vec3 c=src((px+.5)/size);c=floor(c*float(${n})+.5+(bayer(px)-.5)*float(${amt}))/float(${n});gl_FragColor=vec4(c,1.);}`;

  // 決めた色だけで描く仕上げ：色を、bayer の点の並びで少しゆらしてから、list（'#rrggbb' の並び）のいちばん近い色に丸める。amt はゆらす強さ（0〜.2 ほど）。
  // extra は丸める前に c（vec3）や uv をいじる GLSL（輪郭を黒くする、など）。K.post(renderer, K.PALETTE([...], .08), {}, { width: 240 }) のように使う
  const PALETTE = (list, amt = .08, extra = '') => { const cs = list.map(c => new THREE.Color(c).convertLinearToSRGB()); return `vec3 pal(vec3 c){vec3 b=vec3(0.);float bd=1e9;${cs.map(c => `{vec3 p=vec3(${c.r.toFixed(4)},${c.g.toFixed(4)},${c.b.toFixed(4)});vec3 d=(c-p)*vec3(.9,1.2,.7);float dd=dot(d,d);if(dd<bd){bd=dd;b=p;}}`).join('')}return b;}
void main(){vec2 q=floor(vUv*size),uv=(q+.5)/size;vec3 c=src(uv);${extra}c=pal(c+(bayer(q)-.47)*${amt.toFixed(3)});gl_FragColor=vec4(c,1.);}`; };

  // ローポリの小物。どれも Group を返す。足もとが y=0
  // 人：頭・胴・手足の箱。walk(g, 位相, ふり幅) で歩かせる。o = { skin, top, bottom, hat, s(大きさ) }
  function person(o = {}) { const g = new THREE.Group(), s = o.s || 1, P = {}; const part = (n, w, h, d, c, x, y, z, piv) => { const pv = new THREE.Group(); pv.position.set(x * s, y * s, z * s); const m = box(pv, w * s, h * s, d * s, c, 0, piv * s, 0); m.castShadow = true; g.add(pv); P[n] = pv; return m; };
    part('body', .5, .62, .3, o.top || '#e8503a', 0, .78, 0, .31); part('head', .4, .4, .4, o.skin || '#f2c8a0', 0, 1.42, 0, .2); if (o.hat) box(P.head, .46 * s, .14 * s, .46 * s, o.hat, 0, .44 * s, 0);
    part('legL', .2, .8, .22, o.bottom || '#3a4a6a', -.13, .8, 0, -.4); part('legR', .2, .8, .22, o.bottom || '#3a4a6a', .13, .8, 0, -.4); part('armL', .16, .6, .18, o.top || '#e8503a', -.34, 1.36, 0, -.3); part('armR', .16, .6, .18, o.top || '#e8503a', .34, 1.36, 0, -.3); g.userData.P = P; return g; }
  function walk(g, ph, amp = .7) { const P = g.userData.P, a = Math.sin(ph) * amp; P.legL.rotation.x = a; P.legR.rotation.x = -a; P.armL.rotation.x = -a * .8; P.armR.rotation.x = a * .8; P.body.position.y = P.body.userData.y0 ?? (P.body.userData.y0 = P.body.position.y); P.body.position.y = P.body.userData.y0 + Math.abs(Math.cos(ph)) * .04; }
  // 丸い木（広葉樹）。葉のかたまりを 2〜3 個
  function tree(h = 4, leaf = '#5aa870', trunk = '#6a4a34', leaf2 = null) { const g = new THREE.Group(); add(g, new THREE.CylinderGeometry(h * .05, h * .08, h * .45, 5), trunk, 0, h * .22, 0).castShadow = true; const L = (r, x, y, z, c) => { const m = add(g, new THREE.IcosahedronGeometry(r, 0), c, x, y, z); m.rotation.set(x * 3 + r, y, z * 2); m.castShadow = true; }; L(h * .3, 0, h * .66, 0, leaf); L(h * .22, h * .18, h * .52, h * .06, leaf2 || leaf); L(h * .2, -h * .16, h * .56, -h * .1, leaf2 || leaf); return g; }
  // 家：かべの箱と切妻の屋根、戸と窓（win は窓の色。夜は光る色にして glow を使うとよい）
  function house(w = 4, h = 2.6, d = 5, wall = '#f4e8d0', roof = '#c8503a', win = '#5a7a9a', lit = false) { const g = new THREE.Group(); const b = box(g, w, h, d, wall, 0, h / 2, 0); b.castShadow = b.receiveShadow = true; const rg = new THREE.CylinderGeometry(w * .72, w * .72, d * 1.08, 3, 1); rg.rotateX(Math.PI / 2); rg.rotateZ(Math.PI); rg.scale(1, .62, 1); const r = add(g, rg, roof, 0, h + w * .22, 0); r.castShadow = true; const wm = lit ? glow(win) : flat(win); box(g, w * .22, h * .5, .08, '#6a4a34', -w * .2, h * .25, d / 2 + .02); box(g, w * .24, h * .28, .08, wm, w * .2, h * .56, d / 2 + .02); for (const z of [-d * .25, d * .25]) { box(g, .08, h * .28, d * .2, wm, w / 2 + .02, h * .56, z); box(g, .08, h * .28, d * .2, wm, -w / 2 - .02, h * .56, z); } return g; }
  function rock(r = 1, color = '#8a8a90') { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), flat(color)); m.scale.set(1, .7, .85); m.position.y = r * .4; m.rotation.set(r * 3, r * 7, 0); m.castShadow = true; const g = new THREE.Group(); g.add(m); return g; }
  function cloud(s = 1, color = '#ffffff') { const g = new THREE.Group(), m = glow(color, { fog: false }); for (const [x, y, z, r] of [[0, 0, 0, 3], [3, -.4, .5, 2.2], [-3, -.5, -.4, 2.4], [1.2, 1.2, -.3, 2], [-1.4, .9, .4, 1.7]]) { const q = add(g, new THREE.IcosahedronGeometry(r * s, 0), m, x * s, y * s, z * s); q.scale.y = .62; q.userData.noEdge = true; } return g; }
  // 車：箱の車体と屋根、タイヤ 4 つ（userData.wheels を回す）。前は +z
  function car(body = '#e8503a', top = '#f4f0e4') { const g = new THREE.Group(); box(g, 1.7, .6, 3.4, body, 0, .7, 0).castShadow = true; box(g, 1.5, .55, 1.7, top, 0, 1.27, -.2).castShadow = true; box(g, 1.3, .36, .06, '#3a4a5a', 0, 1.27, .67); g.userData.wheels = []; for (const [x, z] of [[-.9, 1.1], [.9, 1.1], [-.9, -1.1], [.9, -1.1]]) { const wq = add(g, new THREE.CylinderGeometry(.38, .38, .3, 10), '#2a2a30', x, .38, z); wq.rotation.z = Math.PI / 2; g.userData.wheels.push(wq); } for (const x of [-.6, .6]) { add(g, new THREE.BoxGeometry(.3, .18, .06), glow('#fff2b0'), x, .78, 1.72); add(g, new THREE.BoxGeometry(.3, .16, .06), glow('#ff5040'), x, .78, -1.72); } return g; }
  // 小舟：船体と、あれば帆。前は +z
  function boat(hull = '#c8503a', sail = '#f4f0e4') { const g = new THREE.Group(); const hg = new THREE.BoxGeometry(1.5, .6, 3.6, 1, 1, 2); const p = hg.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getZ(i) > 1) p.setX(i, p.getX(i) * .15); if (p.getY(i) < 0) p.setX(i, p.getX(i) * .7); } hg.computeVertexNormals(); add(g, hg, hull, 0, .25, 0).castShadow = true; if (sail) { add(g, new THREE.CylinderGeometry(.05, .05, 3, 5), '#6a4a34', 0, 1.9, .2); const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, .8, .1, 0, 3.3, .1, 0, .8, -1.5]), 3)); sg.computeVertexNormals(); add(g, sg, flat(sail, { side: THREE.DoubleSide }), 0, 0, 0).castShadow = true; } return g; }
  // 光と影の用意：空の光と太陽（影つき）。range は影の届く広さ。返した sun を主役に合わせて動かしてよい（sun.target も）
  function lights(scene, renderer, o = {}) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; const hemi = new THREE.HemisphereLight(o.sky || 0xffffff, o.ground || 0x8a9a8a, o.amb ?? 1.3); const sun = new THREE.DirectionalLight(o.sun || 0xfff2dc, o.power ?? 2.4); sun.position.set(...(o.pos || [-30, 40, 20])); sun.castShadow = true; sun.shadow.mapSize.set(o.map || 1024, o.map || 1024); const r = o.range || 40; Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 200 }); sun.shadow.bias = -.0015; sun.shadow.normalBias = .05; scene.add(hemi, sun, sun.target); return { hemi, sun }; }
  // 影を落とす・受ける印を、Group の中の全部につける
  const shadow = (g, cast = true, recv = true) => { g.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return g; };

  function loop(fn) { let last = performance.now(), t = 0; const f = now => { const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; t += dt; fn(dt, t); requestAnimationFrame(f); }; requestAnimationFrame(f); }
  function stars(n = 300, r = 300, size = 1.5) { const g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const th = hash(i, 5) * 6.283, e = .08 + hash(i, 6) * 1.4; a[i * 3] = Math.cos(th) * Math.cos(e) * r; a[i * 3 + 1] = Math.sin(e) * r; a[i * 3 + 2] = Math.sin(th) * Math.cos(e) * r; } g.setAttribute('position', new THREE.BufferAttribute(a, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: false, fog: false })); }

  return { hash, stage, sky, pix, flat, glow, add, box, terrain, colors, pine, fx, post, DITHER, PALETTE, person, walk, tree, house, rock, cloud, car, boat, lights, shadow, loop, stars };
};
