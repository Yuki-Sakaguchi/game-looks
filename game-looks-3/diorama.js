// game-looks-3 の共通部品：黒い空間に浮かぶ、ドット絵のジオラマ。
// 作り方の要点
//  1. 場面は「明るさだけ」で作る。ふつうの物は灰色（白〜黒）の材質にし、差し色にしたい物だけ、あざやかな色の材質にする。
//  2. 横 360 ドットの小さな絵に描く。
//  3. 仕上げで、灰色の所は明るさを 6 段に丸めて「その場面の色相の 6 色」に置きかえる。あざやかな所は「差し色の 4 色」に置きかえる。
//     段の境目は 4×4 の決まった点の並び（ディザ）で混ぜるので、ドット絵の陰になる。いちばん暗い段はまっ黒＝背景にとける。
//  4. ジオラマ全体をゆっくり回す。光は動かさないので、回るにつれて陰の付き方が変わる
window.DIORAMA = (THREE, K, o) => {
  const { scene, cam, renderer, onResize } = K.stage({ fov: o.fov || 28, aa: false, pr: 1 });
  scene.background = new THREE.Color(0); const dist = o.dist || 30; scene.fog = new THREE.Fog(0, dist - 6, dist + 16);
  const world = new THREE.Group(); scene.add(world);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, o.amb === undefined ? .55 : o.amb));
  const key = new THREE.DirectionalLight(0xffffff, o.key === undefined ? 2.4 : o.key); key.position.set(-8, 12, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, .9); rim.position.set(9, 5, -10); scene.add(rim);
  const greys = {}, g = v => greys[v] || (greys[v] = new THREE.MeshStandardMaterial({ color: new THREE.Color(v, v, v), flatShading: true, roughness: 1 }));
  const a = (hex, lit) => lit ? new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: 1 }) : new THREE.MeshBasicMaterial({ color: hex, fog: false });
  const lightM = (v = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), fog: false });
  const V = hex => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b).set(...[c.r, c.g, c.b].map(x => Math.pow(x, 1 / 2.2))); };
  // 土台：上が平らな岩の島。下はすぼまって暗がりに消える
  function base(r, v = .55) {
    const top = K.add(world, new THREE.CylinderGeometry(r, r * .86, .9, 11), g(v), 0, -.45, 0), p = top.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + (K.hash(i, 3) - .5) * .16; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } top.geometry.computeVertexNormals();
    const under = K.add(world, new THREE.ConeGeometry(r * .88, r * 1.3, 9), g(.22), 0, -.9 - r * .65, 0); under.rotation.x = Math.PI;
    for (let i = 0; i < 9; i++) { const an = i / 9 * 6.283 + .3, rr = r * (.86 + K.hash(i, 5) * .12); K.add(world, new THREE.IcosahedronGeometry(.5 + K.hash(i, 6) * .7, 0), g(.4 + K.hash(i, 7) * .25), Math.cos(an) * rr, .1, Math.sin(an) * rr).scale.y = .7; }
  }
  // 光の筋：足し合わせで明るくなるだけの、うすい円すい
  function shaft(x, z, r, h, tilt = 0, col = null, op = .16) { const geo = new THREE.ConeGeometry(r, h, 10, 1, true); geo.translate(0, -h / 2, 0); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col || 0xffffff, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(x, h, z); m.rotation.z = tilt; world.add(m); return m; }
  // ただよう粒（大きさの変わらない点）
  function motes(n, r, h, col = 0xffffff, size = 1) { const geo = new THREE.BufferGeometry(), arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const an = K.hash(i, 11) * 6.283, d = Math.sqrt(K.hash(i, 12)) * r; arr[i * 3] = Math.cos(an) * d; arr[i * 3 + 1] = K.hash(i, 13) * h; arr[i * 3 + 2] = Math.sin(an) * d; } geo.setAttribute('position', new THREE.BufferAttribute(arr, 3)); const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size, sizeAttenuation: false, fog: false })); world.add(p); return p; }
  const post = K.post(renderer, `uniform vec3 ramp[6];uniform vec3 acc[4];
void main(){vec2 px=floor(vUv*size);vec3 c=src((px+.5)/size);float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),l=dot(c,vec3(.3,.59,.11)),d=bayer(px)-.5;vec3 q;
if(mx-mn>.2){int i=int(clamp(floor(mx*3.4+d*.9),0.,3.));q=acc[i];}
else{int i=int(clamp(floor(l*5.6+.35+d*.95),0.,5.));q=i==0?vec3(0.):ramp[i];}
gl_FragColor=vec4(q,1.);}`, { ramp: { value: o.ramp.map(V) }, acc: { value: o.acc.map(V) } }, { width: o.width || 360 });
  onResize(post.resize);
  function run(fn) { K.loop((dt, t) => { world.rotation.y = t * (o.spin || .22); const wide = Math.max(1, 1.5 / cam.aspect); cam.position.set(0, (o.height || 11) * wide, dist * wide); cam.lookAt(0, o.look === undefined ? 3 : o.look, 0); const cd = cam.position.length(); scene.fog.near = cd * 1.02; scene.fog.far = cd * 1.55; if (fn) fn(dt, t); post.render(scene, cam, t); }); }
  return { scene, world, cam, renderer, g, a, lightM, base, shaft, motes, run };
};
