// 人と動物。箱を組んだ人形に、歩く・走る・跳ぶ・泳ぐ・座るなどの姿勢をつける。
import { THREE, K, ground } from './core.js';
import { hash, waterY, POND } from './terrain.js';
const PI = Math.PI;
const part = (p, w, h, d, c, x, y, z) => { const m = K.box(p, w, h, d, c, x, y, z); m.castShadow = true; return m; };
const pivot = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };

// 人形。+z を向いて立つ。足もとが原点
export function makePerson(look = {}, scale = 1) {
  const g = new THREE.Group(), body = pivot(g, 0, 0, 0), skin = look.skin || '#f0c8a0', shirt = look.shirt || '#f4f4f4', pants = look.pants || '#3f8ad0', hair = look.hair || '#6a4a34';
  const torso = pivot(body, 0, .8, 0); part(torso, .5, .62, .3, shirt, 0, .31, 0);
  if (look.robe) part(torso, .54, .8, .34, shirt, 0, -.3, 0); if (look.apron) part(torso, .42, .7, .04, look.apron, 0, .1, .17); if (look.pack) { part(torso, .4, .46, .2, '#8a5a34', 0, .36, -.25); part(torso, .42, .1, .22, '#e0b040', 0, .62, -.25); }
  if (look.scarf) { part(torso, .44, .12, .34, look.scarf, 0, .62, 0); part(torso, .12, .34, .05, look.scarf, .12, .46, -.19); }
  const head = pivot(torso, 0, .64, 0); part(head, .38, .38, .36, skin, 0, .2, 0); part(head, .42, .16, .4, hair, 0, .38, -.01); part(head, .42, .3, .12, hair, 0, .22, -.15);
  for (const s of [-1, 1]) part(head, .06, .08, .02, '#2a2422', s * .09, .2, .185); if (look.beard) part(head, .34, .16, .08, hair, 0, .05, .16);
  if (look.chef) part(head, .34, .3, .34, '#ffffff', 0, .6, 0); else if (look.hat) { const b = K.add(head, new THREE.CylinderGeometry(.36, .36, .04, 8), look.hat, 0, .46, 0); b.castShadow = true; part(head, .34, .16, .34, look.hat, 0, .54, 0); }
  const arm = s => { const p = pivot(torso, s * .33, .56, 0); part(p, .15, .4, .17, shirt, 0, -.16, 0); part(p, .13, .26, .15, skin, 0, -.47, 0); return p; };
  const leg = s => { const p = pivot(body, s * .13, .8, 0); part(p, .2, .62, .22, pants, 0, -.31, 0); part(p, .21, .18, .3, look.shoe || '#6a4a34', 0, -.71, .04); return p; };
  g.scale.setScalar(scale);
  return { g, body, torso, head, armL: arm(-1), armR: arm(1), legL: leg(-1), legR: leg(1), phase: 0, scale };
}
const ease = (o, k, v, a) => { o[k] += (v - o[k]) * a; };
// mode: idle / move / air / glide / swim / sit / dash / fish。speed は横の速さ、vy は縦の速さ
export function pose(p, mode, dt, speed = 0, vy = 0, t = 0) {
  const a = 1 - Math.exp(-dt * 16); let lx = 0, rx = 0, alx = 0, arx = 0, alz = 0, arz = 0, lean = 0, by = 0, hx = 0;
  if (mode === 'move') { p.phase += dt * (3 + speed * 1.55); const A = Math.min(1.15, .3 + speed * .085), s = Math.sin(p.phase); lx = s * A; rx = -s * A; alx = -s * A * .9; arx = s * A * .9; lean = speed * .018; by = Math.abs(Math.cos(p.phase)) * .05 * A; }
  else if (mode === 'idle') { const s = Math.sin(t * 2); alz = -.06 - s * .02; arz = .06 + s * .02; by = s * .008; }
  else if (mode === 'air') { const up = vy > 0; lx = up ? -.9 : -.25; rx = up ? .35 : .3; alx = up ? -2.6 : -1.2; arx = up ? -2.4 : -1.3; alz = up ? -.3 : -1.1; arz = up ? .3 : 1.1; lean = up ? .1 : -.08; }
  else if (mode === 'glide') { alx = arx = -3.05; alz = .12; arz = -.12; lx = .25 + Math.sin(t * 3) * .12; rx = .1 - Math.sin(t * 3) * .12; lean = .16; }
  else if (mode === 'swim') { p.phase += dt * (3 + speed * 1.4); const s = Math.sin(p.phase), c = Math.cos(p.phase); lean = 1.25; by = .78; alx = -1.6 + s * 1.4; arx = -1.6 - s * 1.4; alz = -.3 - c * .3; arz = .3 - c * .3; lx = s * .5 - .1; rx = -s * .5 - .1; hx = -.9; }
  else if (mode === 'dash') { lean = .75; alx = 1.3; arx = 1.3; alz = -.35; arz = .35; lx = .9; rx = -.5; }
  else if (mode === 'sit') { lx = rx = -1.5; by = -.34; alx = arx = -.5; }
  else if (mode === 'fish') { arx = -1.25; alx = -.9; alz = .3; by = Math.sin(t * 1.5) * .008; }
  ease(p.legL.rotation, 'x', lx, a); ease(p.legR.rotation, 'x', rx, a); ease(p.armL.rotation, 'x', alx, a); ease(p.armR.rotation, 'x', arx, a); ease(p.armL.rotation, 'z', alz, a); ease(p.armR.rotation, 'z', arz, a);
  ease(p.body.rotation, 'x', lean, a); ease(p.body.position, 'y', by, a); ease(p.head.rotation, 'x', hx, a);
}

// 釣りざお
export function rod(p) { const r = pivot(p.armR, 0, -.55, 0); part(r, .04, .04, 2.6, '#8a6a44', 0, 0, 1.2); part(r, .015, 1.6, .015, '#f4f4f4', 0, -.8, 2.5); part(r, .08, .08, .08, '#e0483c', 0, -1.6, 2.5); r.rotation.x = -.5; }

// ---------- 住人
export function makeFolk(scene, defs) {
  return defs.map((d, i) => {
    const p = makePerson(d.look, d.kid ? .72 : .96 + hash(i, 3) * .1); scene.add(p.g); if (d.fish) rod(p);
    const y = ground(d.x, d.z, d.hy + 1, .6); p.g.position.set(d.x, y, d.z); p.g.rotation.y = d.ry;
    return { ...d, p, y, yaw: d.ry, wp: 1, wait: 0, line: 0, home: d.ry };
  });
}
const turn = (cur, target, a) => { let d = ((target - cur + PI) % (PI * 2) + PI * 2) % (PI * 2) - PI; return cur + d * a; };
export function updateFolk(folk, dt, t, px, py, pz) {
  for (const f of folk) {
    const g = f.p.g, dx = px - g.position.x, dz = pz - g.position.z, dist = Math.hypot(dx, dz); if (dist > 150) continue;
    const nearP = dist < 3.2 && Math.abs(py - g.position.y) < 2.5; let mode = f.sit ? 'sit' : f.fish ? 'fish' : 'idle', sp = 0;
    if (f.path && !nearP && f.wait <= 0) {
      const [tx, tz] = f.path[f.wp], ex = tx - g.position.x, ez = tz - g.position.z, ed = Math.hypot(ex, ez); sp = f.run ? 3.6 : 1.5;
      if (ed < .5) { f.wp = (f.wp + 1) % f.path.length; if (!f.run && hash(f.wp, t | 0) > .5) f.wait = 1 + hash(f.wp, 2) * 3; }
      else { g.position.x += ex / ed * sp * dt; g.position.z += ez / ed * sp * dt; f.yaw = turn(f.yaw, Math.atan2(ex, ez), 1 - Math.exp(-dt * 8)); g.position.y += (ground(g.position.x, g.position.z, g.position.y + .7, .7) - g.position.y) * Math.min(1, dt * 14); }
      mode = 'move';
    } else { f.wait -= dt; if (nearP && !f.sit && !f.fish) f.yaw = turn(f.yaw, Math.atan2(dx, dz), 1 - Math.exp(-dt * 6)); else if (!f.path) f.yaw = turn(f.yaw, f.home, 1 - Math.exp(-dt * 3)); }
    g.rotation.y = f.yaw; if (dist < 70) pose(f.p, mode, dt, sp, 0, t + f.x);
    f.near = dist;
  }
}

// ---------- 動物
function critter(kind, i) {
  const g = new THREE.Group(), b = pivot(g, 0, 0, 0);
  if (kind === 'cat' || kind === 'dog') { const c = kind === 'dog' ? ['#c89048', '#f4ecdc'][i % 2] : ['#f2a040', '#3a3a42', '#f4f4f4'][i % 3], s = kind === 'dog' ? 1.35 : 1; part(b, .2 * s, .2 * s, .5 * s, c, 0, .28 * s, 0); part(b, .2 * s, .18 * s, .2 * s, c, 0, .42 * s, .3 * s); for (const e of [-1, 1]) { part(b, .06 * s, .08 * s, .05 * s, c, e * .07 * s, .55 * s, .3 * s); part(b, .06 * s, .2 * s, .06 * s, c, e * .07 * s, .1 * s, .18 * s); part(b, .06 * s, .2 * s, .06 * s, c, e * .07 * s, .1 * s, -.18 * s); } const tl = pivot(b, 0, .36 * s, -.25 * s); part(tl, .05 * s, .05 * s, .3 * s, c, 0, .08, -.12 * s); tl.rotation.x = .9; g.userData.tail = tl; }
  else if (kind === 'hen') { part(b, .22, .22, .3, i % 2 ? '#f4f4f4' : '#c8743a', 0, .26, 0); part(b, .14, .16, .14, i % 2 ? '#f4f4f4' : '#c8743a', 0, .42, .16); part(b, .05, .05, .08, '#e0b040', 0, .42, .26); part(b, .04, .08, .1, '#e0483c', 0, .53, .16); part(b, .04, .14, .04, '#e0b040', 0, .08, 0); }
  else if (kind === 'sheep') { const w = K.add(b, new THREE.IcosahedronGeometry(.48, 0), '#f4f0e4', 0, .62, 0); w.scale.set(.85, .8, 1.2); w.castShadow = true; part(b, .22, .24, .26, '#3a3a42', 0, .72, .56); for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(b, .09, .34, .09, '#3a3a42', sx * .2, .17, sz * .3); }
  else if (kind === 'duck') { part(b, .22, .16, .34, '#f4f4f4', 0, .08, 0); part(b, .12, .2, .12, i % 2 ? '#3f8a50' : '#f4f4f4', 0, .24, .14); part(b, .08, .04, .1, '#ff9a4a', 0, .22, .25); }
  else if (kind === 'crab') { part(b, .3, .1, .2, '#e0483c', 0, .1, 0); for (const s of [-1, 1]) { part(b, .1, .1, .1, '#e0483c', s * .22, .16, .12); part(b, .26, .03, .03, '#c83a30', s * .2, .06, -.04); part(b, .26, .03, .03, '#c83a30', s * .2, .06, .04); part(b, .03, .08, .03, '#2a2422', s * .07, .2, .08); } }
  return g;
}
const SPD = { cat: 1.3, dog: 2.2, hen: 1, sheep: .6, duck: .5, crab: 1.2 };
export function makeAnimals(scene, defs) {
  const out = [];
  defs.forEach((d, k) => { for (let i = 0; i < d.n; i++) { const g = critter(d.kind, i + k); scene.add(g); const a = hash(i, k) * 6.28, r = hash(i, k + 5) * d.r; g.position.set(d.x + Math.cos(a) * r, 0, d.z + Math.sin(a) * r); out.push({ ...d, g, tx: g.position.x, tz: g.position.z, wait: hash(i, k + 9) * 3, yaw: a, ph: i, friend: false }); } });
  return out;
}
export function updateAnimals(list, dt, t, px, pz) {
  for (const o of list) {
    const g = o.g, dx = px - g.position.x, dz = pz - g.position.z, dist = Math.hypot(dx, dz); o.near = dist; if (dist > 110) continue;
    let sp = SPD[o.kind], moving = false;
    if (o.kind === 'crab' && dist < 4.5) { o.tx = g.position.x - dx / dist * 3; o.tz = g.position.z - dz / dist * 3; o.wait = 0; sp = 4; }
    if (o.friend) { if (dist > 2.6) { o.tx = px; o.tz = pz; o.wait = 0; sp = Math.min(9, 2 + dist); } else o.wait = .3; }
    if (o.wait > 0) o.wait -= dt; else {
      const ex = o.tx - g.position.x, ez = o.tz - g.position.z, ed = Math.hypot(ex, ez);
      if (ed < .25) { o.wait = 1 + Math.random() * 4; const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * o.r; o.tx = o.x + Math.cos(a) * r; o.tz = o.z + Math.sin(a) * r; }
      else { g.position.x += ex / ed * sp * dt; g.position.z += ez / ed * sp * dt; o.yaw = turn(o.yaw, Math.atan2(ex, ez) + (o.kind === 'crab' ? PI / 2 : 0), 1 - Math.exp(-dt * 8)); moving = true; }
    }
    const gyy = o.kind === 'duck' ? POND.y : Math.max(ground(g.position.x, g.position.z, g.position.y + .6, .6), o.friend ? waterY(g.position.x, g.position.z) - .3 : -9); g.position.y += (gyy - g.position.y) * Math.min(1, dt * 12); g.rotation.y = o.yaw;
    o.ph += dt * (moving ? 12 : 2); const b = g.children[0]; b.position.y = moving ? Math.abs(Math.sin(o.ph)) * (o.kind === 'hen' || o.kind === 'dog' ? .08 : .03) : 0; b.rotation.x = o.kind === 'hen' && !moving && Math.sin(o.ph * 1.5) > .6 ? .7 : 0; if (o.kind === 'duck') b.rotation.z = Math.sin(t * 2 + o.ph) * .06; if (g.userData.tail) g.userData.tail.rotation.y = Math.sin(t * (o.friend ? 14 : 3) + o.ph) * .5;
  }
}

// ---------- かもめ、沖の舟
export function makeGulls(scene, n = 12) {
  return [...Array(n)].map((_, i) => { const g = new THREE.Group(); part(g, .14, .12, .5, '#f4f4f4', 0, 0, 0); part(g, .08, .06, .12, '#ffb040', 0, 0, .3); const w = [-1, 1].map(s => { const p = pivot(g, s * .06, .04, 0); const m = part(p, .7, .03, .22, '#f4f4f4', s * .36, 0, 0); part(p, .2, .035, .2, '#4a4a52', s * .78, 0, -.02); m.castShadow = false; return p; }); scene.add(g); return { g, w, cx: (hash(i, 1) - .5) * 200, cz: (hash(i, 2) - .5) * 200, r: 14 + hash(i, 3) * 30, h: 14 + hash(i, 4) * 26, sp: (.25 + hash(i, 5) * .25) * (i % 2 ? 1 : -1), ph: i * 2 }; });
}
export function updateGulls(gulls, dt, t) { for (const b of gulls) { const a = t * b.sp + b.ph, x = b.cx + Math.cos(a) * b.r, z = b.cz + Math.sin(a) * b.r * .7; b.g.position.set(x, b.h + Math.sin(t * .4 + b.ph) * 2, z); b.g.rotation.y = Math.atan2(-Math.sin(a) * b.r * b.sp, Math.cos(a) * b.r * .7 * b.sp); const f = Math.sin(t * 7 + b.ph) * .5 * (Math.sin(t * .5 + b.ph) > 0 ? 1 : .15); b.w[0].rotation.z = -f; b.w[1].rotation.z = f; b.g.rotation.z = -.25 * Math.sign(b.sp); } }
export function makeBoats(scene) {
  return [...Array(5)].map((_, i) => { const g = new THREE.Group(), c = ['#f4f4f4', '#e0483c', '#3f8ad0', '#f2c230', '#f4f4f4'][i]; part(g, 2.4, 1, 6, c, 0, .4, 0); part(g, 1.8, .8, 1.4, c, 0, .5, 3.4); part(g, 1.7, 1.1, 2.2, '#e8e8e8', 0, 1.4, -.8); part(g, 1.9, .12, 2.4, i % 2 ? '#3f8ad0' : '#e0483c', 0, 2, -.8); if (i % 2 === 0) { part(g, .08, 5, .08, '#eeeeee', 0, 3.4, 1); const s = K.add(g, new THREE.ConeGeometry(1.8, 4.4, 3), '#ffffff', 0, 3.8, .1); s.scale.set(.06, 1, 1); s.rotation.y = PI; } scene.add(g); return g; });
}
export function updateBoats(boats, t, fxEmit) { boats.forEach((b, i) => { const a = t * (.035 + i * .006) * (i % 2 ? 1 : -1) + i * 1.3, R = 150 + i * 12; b.position.set(Math.cos(a) * R, Math.sin(t * 1.5 + i) * .1 - .1, Math.sin(a) * R); b.rotation.set(Math.sin(t * 1.1 + i) * .03, Math.atan2(-Math.sin(a), Math.cos(a)) + (i % 2 ? 0 : PI), Math.sin(t * .9 + i) * .04); if (fxEmit) fxEmit(b.position.x, b.position.z); }); }
