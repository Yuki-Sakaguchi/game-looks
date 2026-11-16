// game-looks-2 の共通部品。各ページは three.js を読みこんだあと  const K = KIT(THREE)  として使う。
// 入っているもの：舞台の用意、空のグラデーション、ドット模様、ローポリの地面、
// 8×8 ドット絵の効果（炎・煙・きらめき・水しぶき・雪けむり・泡）、仕上げの画面加工、毎コマの呼び出し
window.KIT = (THREE) => {
  const hash = (a, b = 0) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };

  function stage(o = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: o.aa !== false }); renderer.setPixelRatio(o.pr || Math.min(devicePixelRatio, 2)); document.body.prepend(renderer.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(o.fov || 45, 1, .1, o.far || 500), subs = [];
    const resize = () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); subs.forEach(f => f(innerWidth, innerHeight)); };
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
  // o.width を指定すると横その数のドットの粗い絵になる。body では src(uv) で元の色、size がドット数、res が画面の大きさ
  function post(renderer, body, uniforms = {}, o = {}) {
    const rt = new THREE.WebGLRenderTarget(4, 4); if (o.width) rt.texture.minFilter = rt.texture.magFilter = THREE.NearestFilter;
    const u = { tD: { value: rt.texture }, res: { value: new THREE.Vector2() }, size: { value: new THREE.Vector2() }, time: { value: 0 }, ...uniforms };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: `uniform sampler2D tD;uniform vec2 res,size;uniform float time;varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float bayer(vec2 p){vec2 a=mod(p,2.),b=mod(floor(p/2.),2.);float x=(a.y<.5)?(a.x<.5?0.:2.):(a.x<.5?3.:1.);float y=(b.y<.5)?(b.x<.5?0.:2.):(b.x<.5?3.:1.);return (x*4.+y)/16.;}
vec3 src(vec2 uv){return pow(max(texture2D(tD,uv).rgb,0.),vec3(1./2.2));}
` + body });
    const ps = new THREE.Scene(); ps.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)); const pc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const resize = (w, h) => { let rw, rh; if (o.width) { rw = o.width; rh = Math.max(60, Math.round(o.width * h / w)); } else { const s = (o.scale || 1) * renderer.getPixelRatio(); rw = Math.round(w * s); rh = Math.round(h * s); } rt.setSize(rw, rh); u.size.value.set(rw, rh); u.res.value.set(w, h); };
    return { u, resize, render(scene, cam, t) { u.time.value = t; renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null); renderer.render(ps, pc); } };
  }
  // よく使う仕上げ：色を n 段に丸め、境目を 4×4 の点の並びで混ぜる（ドット絵らしい粗さ）
  const DITHER = (n, amt) => `void main(){vec2 px=floor(vUv*size);vec3 c=src((px+.5)/size);c=floor(c*float(${n})+.5+(bayer(px)-.5)*float(${amt}))/float(${n});gl_FragColor=vec4(c,1.);}`;

  function loop(fn) { let last = performance.now(), t = 0; const f = now => { const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; t += dt; fn(dt, t); requestAnimationFrame(f); }; requestAnimationFrame(f); }
  function stars(n = 300, r = 300, size = 1.5) { const g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const th = hash(i, 5) * 6.283, e = .08 + hash(i, 6) * 1.4; a[i * 3] = Math.cos(th) * Math.cos(e) * r; a[i * 3 + 1] = Math.sin(e) * r; a[i * 3 + 2] = Math.sin(th) * Math.cos(e) * r; } g.setAttribute('position', new THREE.BufferAttribute(a, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: false, fog: false })); }

  return { hash, stage, sky, pix, flat, glow, add, box, terrain, colors, pine, fx, post, DITHER, loop, stars };
};
