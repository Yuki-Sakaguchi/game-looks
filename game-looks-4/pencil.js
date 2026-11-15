// 第 4 集の共通部品。ふつうに塗ったローポリの箱庭を、最後に「紙＋色鉛筆のハッチング」に描き直す
// （描き方は第 1 集 06 と同じ：薄い下塗り、暗い面ほど斜線を重ねる、色の境目が鉛筆の輪郭、1 秒に 6 回の揺れ）
// 使い方: const P = PENCIL(THREE, { sky, from, look, size, wide, sun });  fov を渡すと遠近カメラ（FPS などの画角）になる  P.run((dt, t) => { ... });
function PENCIL(THREE, o = {}) {
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene(); scene.background = new THREE.Color(o.sky ?? 0x8fcdf0);
  const cam = o.fov ? new THREE.PerspectiveCamera(o.fov, 1, .1, o.far ?? 400) : new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 200);
  const from = o.from ?? [12, 12, 12], look = o.look ?? [0, 0, 0];
  cam.position.set(from[0] + look[0], from[1] + look[1], from[2] + look[2]); cam.lookAt(look[0], look[1], look[2]);
  scene.add(new THREE.AmbientLight(0xffffff, o.amb ?? 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, o.key ?? 2.6); sun.position.set(...(o.sun ?? [4, 10, -3])); scene.add(sun);

  const hash = (a, b = 0) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
  const mats = new Map();
  const lam = c => { if (typeof c !== 'number') return c; let m = mats.get(c); if (!m) mats.set(c, m = new THREE.MeshLambertMaterial({ color: c, flatShading: true })); return m; };
  const glow = c => new THREE.MeshBasicMaterial({ color: c });
  const add = (p, geo, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, lam(c)); m.position.set(x, y, z); (p || scene).add(m); return m; };
  const grp = (p, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); (p || scene).add(g); return g; };
  const box = (p, w, h, d, c, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), c, x, y, z);
  const cyl = (p, rt, rb, h, c, x, y, z, seg = 6) => add(p, new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y, z);
  const cone = (p, r, h, c, x, y, z, seg = 5) => add(p, new THREE.ConeGeometry(r, h, seg), c, x, y, z);
  const ball = (p, r, c, x, y, z, det = 0) => add(p, new THREE.IcosahedronGeometry(r, det), c, x, y, z);
  // 三角屋根（棟は z 方向、底が y=0）
  const prismGeo = (w, h, d) => {
    const a = w / 2, b = d / 2, v = [
      -a, 0, b, a, 0, b, 0, h, b, a, 0, -b, -a, 0, -b, 0, h, -b,
      a, 0, b, a, 0, -b, 0, h, -b, a, 0, b, 0, h, -b, 0, h, b,
      -a, 0, -b, -a, 0, b, 0, h, b, -a, 0, -b, 0, h, b, 0, h, -b,
      -a, 0, -b, a, 0, -b, a, 0, b, -a, 0, -b, a, 0, b, -a, 0, b];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
  };
  const prism = (p, w, h, d, c, x, y, z) => add(p, prismGeo(w, h, d), c, x, y, z);
  const tree = (p, x, z, s = 1, c = 0x3f8f4a, y = 0) => { const g = grp(p, x, y, z); g.scale.setScalar(s); cyl(g, .06, .08, .25, 0x8a5a3a, 0, .12, 0, 5); cone(g, .3, .75, c, 0, .6, 0); return g; };
  const round = (p, x, z, s = 1, c = 0x5aa84e, y = 0) => { const g = grp(p, x, y, z); g.scale.setScalar(s); cyl(g, .06, .08, .4, 0x8a5a3a, 0, .2, 0, 5); ball(g, .34, c, 0, .62, 0); return g; };
  // 家（壁の箱＋三角屋根）。rot は y まわりの向き
  const house = (p, x, z, w, d, h, wall, roof, rot = 0, y = 0) => {
    const g = grp(p, x, y, z); g.rotation.y = rot;
    box(g, w, h, d, wall, 0, h / 2, 0); prism(g, w * 1.14, w * .55, d * 1.1, roof, 0, h, 0);
    box(g, w * .22, h * .5, .04, 0x6a4a3a, 0, h * .25, d / 2 + .01); return g;
  };
  // 2 点をむすぶ棒（ロープ、ケーブル、マスト）
  const rod = (p, a, b, r, c) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va), len = d.length();
    const m = add(p, new THREE.CylinderGeometry(r, r, len, 5), c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
  };
  // 小さな人（足もとが y=0、前は +z）
  const person = (p, x, z, body = 0x4f7fd8, hat = 0, y = 0) => {
    const g = grp(p, x, y, z);
    box(g, .2, .26, .14, body, 0, .23, 0); box(g, .07, .12, .08, 0x4a4058, -.05, .06, 0); box(g, .07, .12, .08, 0x4a4058, .05, .06, 0);
    ball(g, .1, 0xf0c8a0, 0, .45, 0); if (hat) cyl(g, .07, .12, .09, hat, 0, .55, 0);
    return g;
  };
  // マス目の地面。fn(ix, iz, x, z) が [色, 上面の高さ] を返す（null ならそのマスは置かない）
  const tiles = (nx, nz, fn, p) => {
    for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
      const x = ix - (nx - 1) / 2, z = iz - (nz - 1) / 2, r = fn(ix, iz, x, z); if (!r) continue;
      box(p, 1, .4, 1, r[0], x, (r[1] ?? 0) - .2, z);
    }
  };
  const dirt = (w, d, c = 0x9a6b4a, y = -.92, h = 1) => box(null, w + .4, h, d + .4, c, 0, y, 0);
  const sea = (c = 0xb4e0fa, y = -1.2) => { const m = add(null, new THREE.PlaneGeometry(200, 200), c, 0, y, 0); m.rotation.x = -Math.PI / 2; return m; };
  // 折れ線の道。at(d, obj) で道のり d の位置と向きを obj に入れる（前は +z）
  const path = (pts, closed = true) => {
    const segs = []; let total = 0; const n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) { const a = pts[i], b = pts[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, len, at: total }); total += len; }
    return {
      total, at(d, obj) {
        d = ((d % total) + total) % total;
        for (const s of segs) if (d <= s.at + s.len) {
          const f = (d - s.at) / s.len;
          obj.position.x = s.a[0] + (s.b[0] - s.a[0]) * f; obj.position.z = s.a[1] + (s.b[1] - s.a[1]) * f;
          obj.rotation.y = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]); return s;
        }
      }
    };
  };

  const rt = new THREE.WebGLRenderTarget(4, 4, { samples: 4 });
  const post = new THREE.ShaderMaterial({
    uniforms: { t: { value: rt.texture }, res: { value: new THREE.Vector2() }, dpr: { value: 1 }, seed: { value: 0 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `
    uniform sampler2D t;uniform vec2 res;uniform float dpr,seed;varying vec2 vUv;
    float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
    float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
    vec3 S(vec2 uv){return pow(texture2D(t,uv).rgb,vec3(.4545));}
    float hatch(vec2 p,float dir,float off){
      float v=(p.x+dir*p.y)/7.+off+vn(p*.02+seed)*.6;
      return smoothstep(.22,.12,abs(fract(v)-.5))*smoothstep(.2,.45,vn(p*.11+seed*3.));}
    void main(){
      vec2 px=dpr/res,p=gl_FragCoord.xy/dpr;
      vec2 uv=vUv+(vec2(vn(p*.06+seed*7.),vn(p*.06+seed*7.+31.))-.5)*px*3.;
      vec3 c=S(uv);
      float e=length(c-S(uv+vec2(px.x*1.3,0.)))+length(c-S(uv+vec2(0.,px.y*1.3)));
      float d=1.-dot(c,vec3(.3,.59,.11));
      vec3 paper=vec3(.965,.945,.89);
      vec3 pen=mix(c/max(max(c.r,c.g),max(c.b,.001)),c,.5);
      vec3 o=mix(paper,pen,.3+.12*vn(p*.3));
      float ink=hatch(p,1.,0.)*smoothstep(.2,.36,d);
      ink=max(ink,hatch(p,-1.,.3)*smoothstep(.4,.55,d));
      ink=max(ink,hatch(p,1.,.5)*smoothstep(.6,.75,d));
      o=mix(o,pen*.5,ink*.85);
      o=mix(o,vec3(.2,.17,.26),smoothstep(.07,.2,e)*.9*(.7+.3*vn(p*.4+seed)));
      o*=.95+.05*vn(p*1.7);
      gl_FragColor=vec4(o,1.);
    }`
  });
  const ps = new THREE.Scene(); const pq = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); pq.frustumCulled = false; ps.add(pq);
  const pc = new THREE.Camera();
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    rt.setSize(s.x, s.y); post.uniforms.res.value.copy(s); post.uniforms.dpr.value = renderer.getPixelRatio();
    const a = innerWidth / innerHeight, h = Math.max(o.size ?? 6.6, (o.wide ?? 8.2) / a);
    if (o.fov) cam.aspect = a; else { cam.left = -h * a; cam.right = h * a; cam.top = h; cam.bottom = -h; }
    cam.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();
  function run(fn) {
    let t = 0, last = performance.now();
    const frame = now => {
      const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now; t += dt;
      fn(dt, t);
      post.uniforms.seed.value = Math.floor(t * 6) % 97;
      renderer.setRenderTarget(rt); renderer.render(scene, cam);
      renderer.setRenderTarget(null); renderer.render(ps, pc);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  return { scene, cam, renderer, sun, hash, lam, glow, add, grp, box, cyl, cone, ball, prism, tree, round, house, rod, person, tiles, dirt, sea, path, run };
}
