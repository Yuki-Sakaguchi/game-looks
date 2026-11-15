// 島あるき：空撮の島（game-looks-2 の 08）を、うしろからのカメラで歩きまわる。
// 見た目は元の場面を引きつぐ：晴れた昼、あざやかな色、くっきりした影、小さなカメラらしい広角のゆがみと色ずれ、四すみの計器表示。
import { THREE, K, setRoot, finish, pushOut, ground, ceiling, blocked, zones, inZone, vertCount } from './core.js';
import * as T from './terrain.js';
import { W, AREAS, build } from './world.js';
import { makePerson, pose, makeFolk, updateFolk, makeAnimals, updateAnimals, makeGulls, updateGulls, makeBoats, updateBoats } from './actors.js';
const { clamp, lerp, waterY, groundY } = T, PI = Math.PI, TAU = PI * 2, $ = id => document.getElementById(id), damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const TOUCH = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window, Q = new URLSearchParams(location.search);
if (TOUCH) document.body.classList.add('touch');

// ---------- 舞台
const { scene, cam, renderer, onResize } = K.stage({ fov: 62, far: 900, pr: Math.min(devicePixelRatio, TOUCH ? 1.5 : 2) });
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
scene.background = new THREE.Color('#9ad0e8'); scene.fog = new THREE.Fog('#b8dcec', 130, 560);
scene.add(new THREE.HemisphereLight(0xdff2ff, 0x8aa070, 1.5));
const sun = new THREE.DirectionalLight(0xfff4dc, 2.8), SUN = new THREE.Vector3(50, 90, 30); sun.castShadow = true; sun.shadow.mapSize.set(TOUCH ? 1536 : 2048, TOUCH ? 1536 : 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 260 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -.0012; scene.add(sun, sun.target);
setRoot(scene); build(scene); finish();
const fx = K.fx(scene, 260), puff = (kind, x, y, z, o) => fx.emit(kind, x, y, z, { fog: false, ...o });

// 動くもの：風車の羽根、灯台の光、鐘
const mills = W.mills.map(m => { const g = new THREE.Group(); g.position.copy(m.p); g.rotation.y = m.ry; const hub = new THREE.Group(); g.add(hub); for (let k = 0; k < 4; k++) { const arm = new THREE.Group(); arm.rotation.z = k * PI / 2; hub.add(arm); const s = K.box(arm, .16, 6, .12, '#8a6a44', 0, 3, 0); s.castShadow = true; const v = K.box(arm, 1.1, 4.4, .05, '#e8dcc0', .6, 3.6, 0); v.castShadow = true; for (let j = 0; j < 5; j++) K.box(arm, 1.1, .06, .08, '#8a6a44', .6, 1.7 + j * .95, 0); } K.box(hub, .5, .5, .5, '#6a4a34', 0, 0, 0); scene.add(g); return hub; });
const beam = new THREE.Group(); beam.position.copy(W.beam); for (const s of [-1, 1]) { const c = K.add(beam, new THREE.ConeGeometry(2.6, 26, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: .13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), s * 13.4, 0, 0); c.rotation.z = s * PI / 2; } K.add(beam, new THREE.SphereGeometry(.7, 8, 6), K.glow('#fff6c8'), 0, 0, 0); scene.add(beam);
const bell = new THREE.Group(); bell.position.copy(W.bell).y += .9; { const b = K.add(bell, new THREE.CylinderGeometry(.35, .8, 1.1, 8), K.flat('#e0b040', { roughness: .4 }), 0, -.7, 0); b.castShadow = true; K.add(bell, new THREE.SphereGeometry(.16, 6, 5), '#6a4a34', 0, -1.3, 0); } scene.add(bell); let bellT = 9;
const folk = makeFolk(scene, W.people), animals = makeAnimals(scene, W.animals), gulls = makeGulls(scene), boats = makeBoats(scene);
// 貝がら
const shellGeo = new THREE.ConeGeometry(.26, .5, 5), shellMat = K.flat('#ffd9c8', { emissive: '#ff9a7a', emissiveIntensity: .5 }), pearlMat = K.glow('#fff6c8');
const shells = W.spots.map((p, i) => { const g = new THREE.Group(); g.position.copy(p); const s = K.add(g, shellGeo, shellMat, 0, 0, 0); s.rotation.z = PI / 2; s.scale.set(1, 1, .55); K.add(g, new THREE.OctahedronGeometry(.12), pearlMat, .2, .02, 0); scene.add(g); return { g, p, got: false, ph: i * 1.3 }; }); let got = 0;

// 仕上げ（元の場面と同じ考え方：ふちのゆがみ、赤と青のずれ、輪郭の強調、あざやかさ、すみの暗さ）。boost はダッシュ中に強まる
const post = K.post(renderer, `uniform float boost;void main(){vec2 p=vUv-.5;float asp=res.x/res.y;vec2 c=p*vec2(asp,1.)/(.5*length(vec2(asp,1.)));float r2=dot(c,c);
vec2 q=p*(1.+.07*r2)*.934+.5,e=p*r2*(.0045+boost*.016);vec3 col=vec3(src(q+e).r,src(q).g,src(q-e).b);
vec2 d=1.5/size;vec3 bl=(src(q+vec2(d.x,0.))+src(q-vec2(d.x,0.))+src(q+vec2(0.,d.y))+src(q-vec2(0.,d.y)))*.25;col+=(col-bl)*.7;
float l=dot(col,vec3(.3,.59,.11));col=mix(vec3(l),col,1.25);col=(col-.5)*1.08+.52;col*=1.-r2*(.2+boost*.25);gl_FragColor=vec4(col,1.);}`, { boost: { value: 0 } }); onResize(post.resize);

// ---------- 音（その場で合成）
let ac = null, master, noise, seaG, windG, muted = false;
function audio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; } const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ac = new AC(); master = ac.createGain(); master.gain.value = .55; master.connect(ac.destination);
  noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const amb = (f, q) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q; g.gain.value = 0; s.connect(fl).connect(g).connect(master); s.start(); return g; }; seaG = amb(420, .5); windG = amb(900, .8);
}
function tone(f, d, type = 'sine', v = .15, slide = 1, delay = 0) { if (!ac || muted) return; const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + delay; o.type = type; o.frequency.setValueAtTime(f, t0); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + d); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0008, t0 + d); o.connect(g).connect(master); o.start(t0); o.stop(t0 + d + .03); }
function hiss(d, v, f, q = 1, slide = 1) { if (!ac || muted) return; const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(), t0 = ac.currentTime; s.buffer = noise; fl.type = 'bandpass'; fl.frequency.setValueAtTime(f, t0); if (slide !== 1) fl.frequency.exponentialRampToValueAtTime(f * slide, t0 + d); fl.Q.value = q; g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0008, t0 + d); s.connect(fl).connect(g).connect(master); s.start(t0, Math.random()); s.stop(t0 + d + .03); }
const sfx = {
  step: k => hiss(.07, k === 2 ? .2 : .11, k === 1 ? 1500 : k === 2 ? 500 : 800 + Math.random() * 500, k === 2 ? 3 : 1), jump: () => tone(300, .16, 'triangle', .13, 1.9), jump2: () => { tone(430, .2, 'triangle', .13, 2); hiss(.18, .12, 2400, 1, .5); }, dash: () => hiss(.3, .32, 2600, .7, .25), land: v => hiss(.12, Math.min(.4, .1 + v * .02), 260, 1),
  splash: () => hiss(.55, .4, 1500, .5, .4), swim: () => hiss(.25, .1, 900, .8, .6), boing: () => { tone(150, .35, 'sine', .28, 2.8); tone(300, .25, 'triangle', .08, 2.2); }, glide: () => hiss(.4, .12, 700, 1, 1.6),
  shell: n => [0, 4, 7, 12].forEach((s, i) => tone(660 * 2 ** ((s + (n % 4) * 2) / 12), .34, 'sine', .11, 1, i * .065)), talk: () => tone(420 + Math.random() * 260, .05, 'square', .035), pet: () => { tone(700, .12, 'sine', .1, 1.5); tone(900, .14, 'sine', .1, 1.4, .1); },
  bell: () => [1, 2.02, 2.76, 4.1, 5.4].forEach((m, i) => tone(196 * m, 3.2 - i * .45, 'sine', .2 / (i + 1))), gull: () => { tone(1500, .2, 'sawtooth', .02, .7); tone(1700, .25, 'sawtooth', .02, .6, .22); }, fan: () => [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(523 * 2 ** (s / 12), .5, 'triangle', .1, 1, i * .09)),
};

// ---------- 入力
const keys = new Set(), inp = { mx: 0, mz: 0, sprint: false, jump: false, jumpP: false, dashP: false, useP: false }; let locked = false, drag = false, started = false;
const cs = { yaw: PI, pitch: .32, zoom: 6.8, dist: 6.8 };
addEventListener('keydown', e => { if (e.repeat) return; keys.add(e.code); if (e.code === 'Space') { inp.jumpP = true; e.preventDefault(); } if (e.code === 'KeyF' || e.code === 'KeyQ') inp.dashP = true; if (e.code === 'KeyE' || e.code === 'Enter') inp.useP = true; if (e.code === 'KeyM') { muted = !muted; if (master) master.gain.value = muted ? 0 : .55; toast(muted ? '音 オフ' : '音 オン'); } if (e.code.startsWith('Arrow')) e.preventDefault(); });
addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
const cv = renderer.domElement;
function begin() { if (!ready) return; audio(); if (!started) { started = true; $('start').style.display = 'none'; toast('白壁の村', 'ISOLA BIANCA'); } if (!TOUCH && !locked) cv.requestPointerLock?.()?.catch?.(() => { }); }
$('start').addEventListener('click', begin);
cv.addEventListener('mousedown', e => { if (TOUCH) return; if (!locked) { drag = true; begin(); } else if (e.button === 0) inp.dashP = true; });
addEventListener('mouseup', () => drag = false); document.addEventListener('pointerlockchange', () => locked = document.pointerLockElement === cv);
addEventListener('mousemove', e => { if (!locked && !drag) return; cs.yaw -= e.movementX * .0026; cs.pitch = clamp(cs.pitch + e.movementY * .0022, -.5, 1.38); });
addEventListener('wheel', e => { cs.zoom = clamp(cs.zoom * (e.deltaY > 0 ? 1.12 : .89), 2.6, 16); }, { passive: true }); addEventListener('contextmenu', e => e.preventDefault());
// タッチ：左半分でスティック、右半分で見まわす
const stick = $('stick'), knob = stick.firstElementChild; let sId = null, lId = null, sx0 = 0, sy0 = 0, lx = 0, ly = 0, tmx = 0, tmz = 0;
if (TOUCH) {
  $('keys').innerHTML = '<tr><td>左半分</td><td>スティックで歩く（大きく倒すと走る）</td></tr><tr><td>右半分</td><td>なぞって見まわす</td></tr><tr><td>JUMP</td><td>ジャンプ ／ 空中でもう一度 ／ 押しっぱなしで滑空</td></tr><tr><td>DASH</td><td>ダッシュ（空中でも 1 回）</td></tr>';
  addEventListener('touchstart', e => { begin(); for (const t of e.changedTouches) { if (t.target.classList?.contains('btn') || t.target.id === 'prompt') continue; if (t.clientX < innerWidth * .45 && sId === null) { sId = t.identifier; sx0 = t.clientX; sy0 = t.clientY; stick.style.display = 'block'; stick.style.left = sx0 + 'px'; stick.style.top = sy0 + 'px'; knob.style.transform = ''; } else if (lId === null) { lId = t.identifier; lx = t.clientX; ly = t.clientY; } } }, { passive: false });
  addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) { if (t.identifier === sId) { let dx = (t.clientX - sx0) / 54, dy = (t.clientY - sy0) / 54; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } tmx = dx; tmz = -dy; knob.style.transform = `translate(${dx * 40}px,${dy * 40}px)`; } else if (t.identifier === lId) { cs.yaw -= (t.clientX - lx) * .006; cs.pitch = clamp(cs.pitch + (t.clientY - ly) * .005, -.5, 1.38); lx = t.clientX; ly = t.clientY; } } }, { passive: false });
  const end = e => { for (const t of e.changedTouches) { if (t.identifier === sId) { sId = null; tmx = tmz = 0; stick.style.display = 'none'; } if (t.identifier === lId) lId = null; } }; addEventListener('touchend', end); addEventListener('touchcancel', end);
  const hold = (el, down, up) => { el.addEventListener('touchstart', e => { e.preventDefault(); begin(); down(); el.style.background = 'rgba(255,255,255,.35)'; }, { passive: false }); const u = e => { e.preventDefault(); up && up(); el.style.background = ''; }; el.addEventListener('touchend', u); el.addEventListener('touchcancel', u); };
  let tj = false; hold($('bj'), () => { tj = true; inp.jumpP = true; }, () => tj = false); hold($('bd'), () => inp.dashP = true); hold($('be'), () => inp.useP = true); hold($('prompt'), () => inp.useP = true);
  inp.touchJump = () => tj;
}
function readInput() {
  let mx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), mz = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const m = Math.hypot(mx, mz); if (m > 1) { mx /= m; mz /= m; } inp.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight'); inp.jump = keys.has('Space');
  if (TOUCH && (tmx || tmz)) { const tm = Math.hypot(tmx, tmz); mx = tmx / tm; mz = tmz / tm; inp.sprint = tm > .82; if (tm < .25) mx = mz = 0; } if (inp.touchJump?.()) inp.jump = true;
  inp.mx = mx; inp.mz = mz;
}

// ---------- プレイヤー
const hero = makePerson({ shirt: '#e0483c', pants: '#3a4a6a', hair: '#3a2a22', hat: '#f4ecdc', pack: true, scarf: '#ffd84a', shoe: '#f4f4f4' }); scene.add(hero.g);
const glider = new THREE.Group(); { const c = K.add(glider, new THREE.ConeGeometry(1.5, .6, 8), '#e0483c', 0, 1.25, 0); c.castShadow = true; const c2 = K.add(glider, new THREE.ConeGeometry(1.52, .56, 4), '#f4f4f4', 0, 1.23, 0); c2.rotation.y = .4; K.add(glider, new THREE.CylinderGeometry(.03, .03, 1.5, 5), '#eeeeee', 0, .5, 0); } glider.position.set(0, 1.5, .12); glider.scale.setScalar(.001); hero.body.add(glider);
const P = { x: W.start.x, y: W.start.y, z: W.start.z, r: .36, h: 1.6, vx: 0, vy: 0, vz: 0, yaw: PI, ground: true, coyote: 0, buffer: 0, airJumps: 1, dashT: 0, dashCd: 0, airDash: false, dx: 0, dz: 0, glide: false, armed: false, swim: false, squash: 0, stride: 0, fallFrom: 0, surf: 0, mode: 'idle', maxY: 0 };
if (Q.get('pos')) { const [x, z, y] = Q.get('pos').split(',').map(Number); P.x = x; P.z = z; P.y = y ?? ground(x, z, 1e3, 0) + .1; }
const STEP = .46, WALK = 5.4, RUN = 9.4, DASH = 21;
function dust(n, size = .8, spread = 1.2) { const wet = P.y < waterY(P.x, P.z) + .05; for (let i = 0; i < n; i++) puff(wet ? 'splash' : 'puff', P.x + (Math.random() - .5) * .5, P.y + .15, P.z + (Math.random() - .5) * .5, { life: .45 + Math.random() * .3, size, grow: 1.4, spread, vy: .6, tint: wet ? '#ffffff' : P.surf === 1 ? '#f4e6c0' : '#e8f0e0' }); }
function updatePlayer(dt, t) {
  readInput();
  const fwx = -Math.sin(cs.yaw), fwz = -Math.cos(cs.yaw); let ix = fwx * inp.mz + Math.cos(cs.yaw) * inp.mx, iz = fwz * inp.mz - Math.sin(cs.yaw) * inp.mx; if (P.auto) { const ax = P.auto[0] - P.x, az = P.auto[1] - P.z, ad = Math.hypot(ax, az); if (ad < .35) P.auto = P.route?.shift() || null; else { ix = ax / ad; iz = az / ad; } }
  const im = Math.hypot(ix, iz); if (im > 1) { ix /= im; iz /= im; }
  P.buffer = inp.jumpP ? .14 : P.buffer - dt; P.coyote -= dt; P.dashCd -= dt;
  const wl = waterY(P.x, P.z), floatY = wl - 1.05, wade = P.ground && P.y < wl - .25;
  // ダッシュ
  if (inp.dashP && P.dashCd <= 0 && (P.ground || P.swim || !P.airDash)) { P.dashT = .2; P.dashCd = .5; if (!P.ground && !P.swim) P.airDash = true; if (im > .1) { P.dx = ix / im; P.dz = iz / im; } else { P.dx = Math.sin(P.yaw); P.dz = Math.cos(P.yaw); } P.yaw = Math.atan2(P.dx, P.dz); P.glide = false; sfx.dash(); dust(5, 1, 2); }
  // ジャンプ
  if (P.buffer > 0) {
    if (P.ground || P.coyote > 0 || P.swim) { P.vy = P.swim ? 8 : 9.6; if (P.swim) { puff('splash', P.x, wl + .2, P.z, { size: 1.6, life: .5, grow: 1 }); sfx.swim(); } else { dust(4); sfx.jump(); } P.ground = false; P.swim = false; P.coyote = 0; P.buffer = 0; P.armed = false; P.squash = -.18; }
    else if (inp.jumpP && P.airJumps > 0) { P.airJumps--; P.vy = 8.8; P.buffer = 0; P.armed = true; P.glide = false; P.squash = -.2; sfx.jump2(); for (let k = 0; k < 8; k++) puff('puff', P.x + Math.cos(k * .785) * .5, P.y, P.z + Math.sin(k * .785) * .5, { life: .4, size: .7, grow: 1, vx: Math.cos(k * .785) * 2.4, vz: Math.sin(k * .785) * 2.4 }); }
    else if (inp.jumpP) P.armed = true;
  }
  // 横の速さ
  if (P.dashT > 0) { P.dashT -= dt; P.vx = P.dx * DASH; P.vz = P.dz * DASH; P.vy = Math.max(P.vy, 0) * .5; if (Math.random() < dt * 40) puff('puff', P.x, P.y + .7, P.z, { life: .35, size: 1.1, grow: .6, spread: .5 }); if (P.dashT <= 0) { P.vx = P.dx * RUN; P.vz = P.dz * RUN; } }
  else {
    const top = (P.swim ? (inp.sprint ? 5.6 : 3.6) : P.glide ? 9 : inp.sprint ? RUN : WALK) * (wade ? .72 : 1), acc = P.ground ? (im > 0 ? 60 : 48) : P.swim ? 18 : P.glide ? 12 : im > 0 ? 26 : 5;
    const tx = ix * top, tz = iz * top, ex = tx - P.vx, ez = tz - P.vz, el = Math.hypot(ex, ez), k = el > 1e-4 ? Math.min(1, acc * dt / el) : 0; P.vx += ex * k; P.vz += ez * k;
    if (im > .05) P.yaw = P.yaw + ((((Math.atan2(ix, iz) - P.yaw + PI) % TAU) + TAU) % TAU - PI) * (1 - Math.exp(-dt * (P.ground ? 16 : 9)));
  }
  // 沖に出すぎたら岸のほうへ流す
  const far = Math.hypot(P.x, P.z); if (far > 205) { const k = (far - 205) * .8 * dt; P.vx -= P.x / far * k * 12; P.vz -= P.z / far * k * 12; if (!P.warn || t - P.warn > 8) { P.warn = t; toast('', '潮の流れが岸へ押し戻す'); } }
  // 縦の速さ
  const wasGlide = P.glide; P.glide = !P.ground && !P.swim && P.armed && inp.jump && P.vy < -.5 && P.dashT <= 0; if (P.glide && !wasGlide) sfx.glide();
  if (P.swim) P.vy += ((floatY - P.y) * 34 - P.vy * 7) * dt; else if (P.glide) P.vy = damp(P.vy, -1.7, 7, dt); else if (!P.ground) P.vy = Math.max(-42, P.vy - (P.vy > 0 ? (inp.jump ? 25 : 58) : 34) * dt);
  // 動かして、押し出す（速いときは刻む）
  const prevY = P.y, sp = Math.hypot(P.vx, P.vz), n = Math.max(1, Math.ceil(sp * dt / .22)), stp = P.swim ? 2.2 : P.ground ? STEP : .32;
  for (let i = 0; i < n; i++) { P.x += P.vx * dt / n; P.z += P.vz * dt / n; pushOut(P, stp); }
  if (!P.ground || P.swim) { P.y += P.vy * dt; if (P.vy > 0) { const c = ceiling(P.x, P.z, prevY + P.h); if (P.y + P.h > c) { P.y = c - P.h; P.vy = 0; } } }
  const g = ground(P.x, P.z, Math.max(prevY, P.y), stp), hit = ground.hit;
  if (P.ground && !P.swim) { if (g >= P.y - STEP - sp * dt * 1.2) P.y = g; else { P.ground = false; P.coyote = .12; P.vy = 0; P.fallFrom = P.y; } }
  else if (P.y <= g && P.vy <= 0 || (P.swim && g > P.y)) {
    const v = -P.vy; P.y = g;
    if (hit && hit.bounce && v > 2) { P.vy = hit.bounce + (inp.jump ? 3.5 : 0); P.airJumps = 1; P.airDash = false; P.armed = true; P.squash = -.3; sfx.boing(); for (let k = 0; k < 6; k++) puff('spark', P.x, P.y + .2, P.z, { life: .4, size: .9, spread: 5, add: true }); }
    else { P.ground = true; P.swim = false; P.vy = 0; P.airJumps = 1; P.airDash = false; P.armed = false; P.glide = false; if (v > 3) { P.squash = Math.min(.4, v * .022); dust(Math.min(8, 2 + v * .3 | 0), 1, 2); sfx.land(v); shake = Math.min(.25, v * .012); } }
  }
  // 泳ぎ
  const deep = groundY(P.x, P.z) < floatY - .05 && !(P.ground && P.y > floatY + .1);
  if (!P.swim && deep && P.y < floatY + .02 && !P.ground) { P.swim = true; P.glide = false; P.airJumps = 1; P.airDash = false; if (P.vy < -3) { for (let k = 0; k < 9; k++) puff('splash', P.x, wl + .1, P.z, { life: .6, size: 1.3, grow: 1.2, spread: 3, vy: 3, grav: -9 }); sfx.splash(); } P.vy *= .35; }
  else if (!P.swim && deep && P.ground && P.y < floatY) { P.swim = true; P.ground = false; }
  if (P.swim && (!deep || P.y > floatY + .5)) { P.swim = false; if (g >= P.y - .1) { P.ground = true; P.vy = 0; } }
  // 足音と砂けむり
  const hs = Math.hypot(P.vx, P.vz); P.surf = hit ? 2 : P.y < 1.5 ? 1 : 0;
  if ((P.ground || P.swim) && hs > 1) { P.stride += hs * dt; if (P.stride > (P.swim ? 3.2 : 2.3)) { P.stride = 0; if (P.swim) { sfx.swim(); puff('splash', P.x, wl + .1, P.z, { life: .5, size: 1.1, grow: 1.2 }); } else { sfx.step(wade ? 1 : P.surf); if (hs > 7 || wade) dust(1, .7, .6); } } }
  // 姿
  P.mode = P.dashT > 0 ? 'dash' : P.swim ? 'swim' : P.glide ? 'glide' : !P.ground ? 'air' : hs > .6 ? 'move' : 'idle';
  pose(hero, P.mode, dt, hs, P.vy, t); P.squash = damp(P.squash, 0, 12, dt); hero.g.scale.set(1 + P.squash * .5, 1 - P.squash, 1 + P.squash * .5);
  hero.g.position.set(P.x, damp(hero.g.position.y, P.y, P.ground && !P.swim ? 26 : 60, dt), P.z); if (Math.abs(hero.g.position.y - P.y) > 2.5) hero.g.position.y = P.y; hero.g.rotation.y = P.yaw;
  glider.scale.setScalar(damp(glider.scale.x, P.glide ? 1 : .001, 16, dt)); glider.visible = glider.scale.x > .02; glider.rotation.x = -hero.body.rotation.x;
  inp.jumpP = inp.dashP = false;
}

// ---------- カメラ
const tgt = new THREE.Vector3(P.x, P.y + 1.45, P.z), dir = new THREE.Vector3(); let shake = 0, fov = 62;
function updateCamera(dt, t) {
  tgt.x = damp(tgt.x, P.x, 22, dt); tgt.z = damp(tgt.z, P.z, 22, dt); tgt.y = damp(tgt.y, hero.g.position.y + 1.45, P.ground ? 9 : 14, dt);
  dir.set(Math.sin(cs.yaw) * Math.cos(cs.pitch), Math.sin(cs.pitch), Math.cos(cs.yaw) * Math.cos(cs.pitch));
  let free = cs.zoom; for (let s = .3; s <= cs.zoom; s += .2) if (blocked(tgt.x + dir.x * s, tgt.y + dir.y * s, tgt.z + dir.z * s)) { free = Math.max(.35, s - .35); break; }
  cs.dist = free < cs.dist ? damp(cs.dist, free, 40, dt) : damp(cs.dist, free, 5, dt);
  cam.position.set(tgt.x + dir.x * cs.dist, tgt.y + dir.y * cs.dist, tgt.z + dir.z * cs.dist); const wy = waterY(cam.position.x, cam.position.z) + .35; if (cam.position.y < wy) cam.position.y = wy;
  if (shake > .001) { cam.position.y += Math.sin(t * 60) * shake; shake = damp(shake, 0, 10, dt); }
  cam.lookAt(tgt.x, tgt.y + .1, tgt.z); hero.g.visible = cs.dist > .9;
  const hs = Math.hypot(P.vx, P.vz), want = 62 + (P.dashT > 0 ? 16 : hs > 7 ? 6 : 0) + (P.glide ? 5 : 0); fov = damp(fov, want, P.dashT > 0 ? 14 : 4, dt);
  // スマホは 1 割ほど広くし、たて長の画面では横の画角が 45 度を下回らないように広げる
  const vf = Math.min(104, fov * Math.min(86, Math.max(62 * (Math.min(innerWidth, innerHeight) < 520 ? 1.12 : 1), Math.atan(Math.tan(45 * Math.PI / 360) * innerHeight / innerWidth) * 360 / Math.PI)) / 62);
  if (Math.abs(cam.fov - vf) > .05) { cam.fov = vf; cam.updateProjectionMatrix(); }
  post.u.boost.value = damp(post.u.boost.value, P.dashT > 0 ? 1 : P.glide ? .15 : 0, 9, dt);
  const sx = Math.round(P.x / 4) * 4, sz = Math.round(P.z / 4) * 4, sy = Math.round(P.y / 4) * 4; sun.target.position.set(sx, sy, sz); sun.position.set(sx + SUN.x, sy + SUN.y, sz + SUN.z);
}

// ---------- 画面の文字
const O = { a: $('a'), b: $('b'), c: $('c'), d: $('d') }, toastEl = $('toast'), promptEl = $('prompt'), talkEl = $('talk'); let toastT = 0, talkT = 0, area = '', areaT = 0, hudT = 0, clock = 0;
function toast(big, small = '') { toastEl.innerHTML = big + (small ? `<small>${small}</small>` : ''); toastEl.style.opacity = 1; toastT = 3.2; }
function say(name, text) { talkEl.innerHTML = `<i>${name}</i>${text}`; talkEl.style.display = 'block'; talkT = 5.5; sfx.talk(); setTimeout(sfx.talk, 70); setTimeout(sfx.talk, 150); }
let target = null;
function updateInteract(dt, t) {
  target = null; let best = 2.7;
  for (const f of folk) if (f.near < best && Math.abs(f.p.g.position.y - P.y) < 2.2) { best = f.near; target = { kind: 'talk', f, label: '話す ─ ' + f.name }; }
  for (const o of animals) if ((o.kind === 'dog' || o.kind === 'cat' || o.kind === 'sheep') && o.near < Math.min(best, 2)) { best = o.near; target = { kind: 'pet', o, label: o.kind === 'dog' ? (o.friend ? '「まて」をする' : 'なでる ─ 犬') : o.kind === 'cat' ? 'なでる ─ ねこ' : 'なでる ─ ひつじ' }; }
  const br = W.bellRope; if (Math.hypot(P.x - br.x, P.z - br.z) < Math.min(best, 2.2) && Math.abs(P.y - br.y) < 2.5) target = { kind: 'bell', label: '鐘を鳴らす' };
  promptEl.style.display = target && started ? 'block' : 'none'; if (target) promptEl.innerHTML = (TOUCH ? '' : '<b>E</b>') + target.label; $('be').style.display = target ? 'grid' : 'none';
  if (inp.useP && target) {
    if (target.kind === 'talk') { const f = target.f; say(f.name, f.lines[f.line++ % f.lines.length]); }
    else if (target.kind === 'pet') { const o = target.o; sfx.pet(); for (let k = 0; k < 4; k++) puff('spark', o.g.position.x, o.g.position.y + .8, o.g.position.z, { life: .6, size: .6, spread: 1.5, vy: 1.5, tint: '#ff8aa0' }); if (o.kind === 'dog') { o.friend = !o.friend; say('犬', o.friend ? 'わん！（しっぽを振ってついてくる）' : 'くぅん。（その場でおすわりした）'); } else say(o.kind === 'cat' ? 'ねこ' : 'ひつじ', o.kind === 'cat' ? 'にゃあ。' : 'めぇ〜。'); }
    else { bellT = 0; sfx.bell(); toast('', 'カラーン … カラーン …'); }
  }
  inp.useP = false;
  if (talkT > 0 && (talkT -= dt) <= 0) talkEl.style.display = 'none'; if (toastT > 0 && (toastT -= dt) <= 0) toastEl.style.opacity = 0;
  // 貝がら
  for (const s of shells) { if (s.got) continue; s.g.rotation.y = t * 1.6 + s.ph; s.g.position.y = s.p.y + Math.sin(t * 2 + s.ph) * .12; const dx = P.x - s.p.x, dy = P.y + .8 - s.p.y, dz = P.z - s.p.z; if (dx * dx + dz * dz < 1.7 && Math.abs(dy) < 1.7) { s.got = true; s.g.visible = false; got++; sfx.shell(got); for (let k = 0; k < 10; k++) puff('spark', s.p.x, s.p.y, s.p.z, { life: .7, size: .8, spread: 5, add: true, tint: '#fff2a0' }); if (got === shells.length) { toast('ぜんぶ集めた！', `貝がら ${got} / ${shells.length}　島のすみずみまで歩きました`); sfx.fan(); } else toast('', `貝がら ${got} / ${shells.length}`); } }
  // 場所の名前
  if ((areaT -= dt) < 0) { areaT = .5; let a = ''; for (const [x, z, r, name] of AREAS) if (Math.hypot(P.x - x, P.z - z) < r) { a = name; break; } if (a && a !== area && started) toast(a); if (a) area = a; }
}
function updateHud(dt, t) {
  clock += dt; if ((hudT -= dt) > 0) return; hudT = .12; const s = 754 + Math.floor(clock), hs = Math.hypot(P.vx, P.vz), hdg = ((Math.atan2(-Math.sin(cs.yaw), Math.cos(cs.yaw)) * 180 / PI) + 360) % 360;
  O.a.innerHTML = '<span style="color:#ff4a3a">●</span> REC ' + [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':') + `<br><span style="color:#ffe9a0">◆ 貝がら ${got} / ${shells.length}</span>`;
  O.b.innerHTML = (area || '―') + '<br>BAT ' + Math.max(11, 78 - Math.floor(clock / 90)) + '% ▮▮▮▯ &nbsp; GPS 14';
  O.c.innerHTML = 'ALT ' + Math.max(0, P.y).toFixed(1) + ' m &nbsp; SPD ' + hs.toFixed(1) + ' m/s<br>' + ({ dash: 'DASH', swim: 'SWIM', glide: 'GLIDE', air: 'AIR', move: hs > 7 ? 'RUN' : 'WALK', idle: 'FOLLOW' })[P.mode] + ' &nbsp; HOME ' + Math.hypot(P.x - W.start.x, P.z - W.start.z).toFixed(0) + ' m';
  O.d.innerHTML = 'HDG ' + String(Math.round(hdg) % 360).padStart(3, '0') + '° ' + 'N NE E SE S SW W NW'.split(' ')[Math.round(hdg / 45) % 8] + '<br>N 43°12′' + String(8 + Math.round(-P.z / 30)).padStart(2, '0') + '″ &nbsp; E 5°21′' + String(44 + Math.round(P.x / 30)).padStart(2, '0') + '″';
}

// ---------- まわりの動き（煙、波、しぶき、きらめき）
let fxT = 0, gullT = 6;
function ambient(dt, t) {
  mills.forEach(m => m.rotation.z = t * .9); beam.rotation.y = t * .7; bellT += dt; bell.rotation.z = Math.sin(bellT * 7) * Math.exp(-bellT * .8) * .7;
  W.clouds.forEach((c, i) => { c.position.x = ((t * (1.2 + i * .15) + 300) % 600) - 300; });
  for (const z of zones) { const open = inZone(z, P.x, P.y + .9, P.z); if (open !== z.open) { z.open = open; if (z.mesh) z.mesh.visible = !open; } }
  updateFolk(folk, dt, t, P.x, P.y, P.z); updateAnimals(animals, dt, t, P.x, P.z); updateGulls(gulls, dt, t);
  const emit = (fxT -= dt) < 0; if (emit) fxT = .12;
  updateBoats(boats, t, emit ? (x, z) => puff('puff', x, .3, z, { life: 1.8, size: 1.6, grow: 1.8, spread: .6, tint: '#eaffff' }) : null);
  if (emit) {
    for (let k = 0; k < 3; k++) { const s = W.shore[Math.random() * W.shore.length | 0]; if (Math.hypot(s[0] - P.x, s[1] - P.z) < 150) puff('puff', s[0] + (Math.random() - .5) * 2, .25, s[1] + (Math.random() - .5) * 2, { life: 1.3, size: 1.7, grow: 1 }); }
    for (const s of W.smokes) if (Math.random() < .35 && Math.hypot(s.x - P.x, s.z - P.z) < 90) puff('smoke', s.x, s.y, s.z, { life: 2.6, size: .8, grow: 2, vy: 1.3, vx: .5, spread: .3, tint: '#f4f4f4', fog: true });
    for (const f of W.fires) if (Math.hypot(f.x - P.x, f.z - P.z) < 60) { puff('flame', f.x + (Math.random() - .5) * .3, f.y + .2, f.z + (Math.random() - .5) * .3, { life: .5, size: .9, vy: 1.2, add: true }); if (Math.random() < .3) puff('smoke', f.x, f.y + 1, f.z, { life: 2.4, size: .7, grow: 2, vy: 1.4, spread: .3, fog: true }); }
    for (const f of W.founts) if (Math.hypot(f.x - P.x, f.z - P.z) < 50) { const a = Math.random() * TAU; puff('splash', f.x, f.y, f.z, { life: .7, size: .5, vx: Math.cos(a) * 1.3, vz: Math.sin(a) * 1.3, vy: 2.4, grav: -9 }); }
    const a = Math.random() * TAU, r = 8 + Math.random() * 70, x = P.x + Math.cos(a) * r, z = P.z + Math.sin(a) * r; if (groundY(x, z) < -.6) puff('spark', x, .12, z, { life: .5, size: .9, add: true });
  }
  if ((gullT -= dt) < 0) { gullT = 7 + Math.random() * 12; if (started) sfx.gull(); }
  if (ac && seaG) { const sh = clamp(1 - Math.abs(Math.hypot(P.x, P.z) - 100) / 60, 0, 1); seaG.gain.value = damp(seaG.gain.value, .05 + sh * .16 + (P.swim ? .08 : 0), 2, dt); windG.gain.value = damp(windG.gain.value, clamp(P.y / 40, 0, .1) + (P.glide ? .14 : 0) + Math.hypot(P.vx, P.vz) * .003, 3, dt); }
}

// ---------- 開始
let ready = true; $('go').textContent = TOUCH ? 'タップしてはじめる' : 'クリックしてはじめる';
if (Q.has('auto')) begin();
cs.yaw = Q.has('yaw') ? +Q.get('yaw') : 0; if (Q.has('pitch')) cs.pitch = +Q.get('pitch'); if (Q.has('zoom')) cs.zoom = +Q.get('zoom');
window.__game = { P, cs, W, shells, folk, zones, keys, inp, verts: vertCount(), calls: () => renderer.info.render.calls, tris: () => renderer.info.render.triangles };
const FLY = Q.get('fly')?.split(',').map(Number);
K.loop((dt, t) => { updatePlayer(dt, t); updateInteract(dt, t); ambient(dt, t); updateCamera(dt, t); if (FLY) { cam.position.set(FLY[0], FLY[1], FLY[2]); cam.lookAt(FLY[3], FLY[4], FLY[5]); } fx.update(dt); post.render(scene, cam, t); updateHud(dt, t); });
