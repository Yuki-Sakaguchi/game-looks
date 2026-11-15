// 部品をまとめて 1 枚の形に焼きこむ仕組みと、当たり判定。
// box() などで置いた形は色つきの頂点としてためておき、区画ごとに 1 つのメッシュにする（描く回数を減らすため）。
// sbox() などで置いた「かたまり」は、歩く・のぼる・カメラがよける、の全部に使う。
import * as THREE from 'three';
import { groundY } from './terrain.js';
export { THREE };
export const K = window.KIT(THREE);

const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .9 });
const geos = new Map(), cols = new Map();
const geo = (key, make) => { let a = geos.get(key); if (!a) { let g = make(); if (g.index) g = g.toNonIndexed(); geos.set(key, a = g.attributes.position.array); } return a; };
const col = c => { let v = cols.get(c); if (!v) cols.set(c, v = new THREE.Color(c)); return v; };

class Batch {
  constructor(chunk) { this.chunk = chunk; this.m = new Map(); }
  push(arr, color, mat) {
    const e = mat.elements, key = this.chunk ? Math.floor(e[12] / this.chunk) + ',' + Math.floor(e[14] / this.chunk) : 0;
    let c = this.m.get(key); if (!c) this.m.set(key, c = { p: [], c: [] });
    const k = col(color), P = c.p, Q = c.c;
    for (let i = 0; i < arr.length; i += 3) { const x = arr[i], y = arr[i + 1], z = arr[i + 2]; P.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]); Q.push(k.r, k.g, k.b); }
  }
  build(parent, cast = true) {
    const out = [];
    for (const c of this.m.values()) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(c.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c.c, 3)); g.computeBoundingSphere(); const m = new THREE.Mesh(g, MAT); m.castShadow = cast; m.receiveShadow = true; parent.add(m); out.push(m); }
    this.m.clear(); return out;
  }
}
const main = new Batch(56), softB = new Batch(56); let cur = main, root = null, verts = 0;
export const setRoot = r => root = r;
export function finish() { main.build(root, true); softB.build(root, false); }
// fn の中で置いたものを、影を落とさない組に入れる（草や花など）
export function soft(fn) { const p = cur; cur = softB; fn(); cur = p; }
// fn の中で置いたものを 1 つのメッシュにして返す（屋根のように、あとで消したいもの用）
export function capture(fn, cast = true) { const p = cur; cur = new Batch(0); fn(); const m = cur.build(root, cast)[0]; cur = p; return m; }

// いまの置き場所（平行移動と、たて軸まわりの回転だけ）
let T = new THREE.Matrix4(), yaw = 0; const stack = [];
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function at(x, y, z, ry, fn) { stack.push(T.clone(), yaw); T.multiply(_m.makeRotationY(ry).setPosition(x, y, z)); yaw += ry; const r = fn(); yaw = stack.pop(); T = stack.pop(); return r; }
export const toWorld = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(T);
export const worldYaw = (ry = 0) => yaw + ry;

function put(arr, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) { _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')); _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)).premultiply(T); cur.push(arr, color, _m); verts += arr.length / 3; }
export const vertCount = () => verts;
export const box = (w, h, d, c, x, y, z, ry = 0, rx = 0, rz = 0) => put(geo('box', () => new THREE.BoxGeometry(1, 1, 1)), c, x, y, z, w, h, d, rx, ry, rz);
export const cyl = (rt, rb, h, c, x, y, z, n = 8, ry = 0, rx = 0, rz = 0) => { const q = Math.round(rt / rb * 20) / 20; put(geo('c' + n + ':' + q, () => new THREE.CylinderGeometry(q, 1, 1, n)), c, x, y, z, rb, h, rb, rx, ry, rz); };
export const cone = (r, h, c, x, y, z, n = 6, ry = 0, rx = 0, rz = 0) => put(geo('k' + n, () => new THREE.ConeGeometry(1, 1, n)), c, x, y, z, r, h, r, rx, ry, rz);
export const blade = (r, h, c, x, y, z, ry = 0, rx = 0, rz = 0) => put(geo('bl', () => new THREE.ConeGeometry(1, 1, 3, 1, true).translate(0, .5, 0)), c, x, y, z, r, h, r, rx, ry, rz);
export const ico = (r, c, x, y, z, detail = 0, sy = 1, ry = 0, sx = 1) => put(geo('i' + detail, () => new THREE.IcosahedronGeometry(1, detail)), c, x, y, z, r * sx, r * sy, r, 0, ry, 0);
// 四角すい（底が y）と、切妻の三角柱（底が y、むねは z 方向）
export const pyr = (hw, h, hd, c, x, y, z, ry = 0) => put(geo('pyr', () => new THREE.ConeGeometry(Math.SQRT2, 1, 4).rotateY(Math.PI / 4).translate(0, .5, 0)), c, x, y, z, hw, h, hd, 0, ry, 0);
const GAB = new Float32Array([-1, 0, .5, 1, 0, .5, 0, 1, .5, 1, 0, -.5, -1, 0, -.5, 0, 1, -.5, -1, 0, -.5, -1, 0, .5, 0, 1, .5, -1, 0, -.5, 0, 1, .5, 0, 1, -.5, 1, 0, .5, 1, 0, -.5, 0, 1, -.5, 1, 0, .5, 0, 1, -.5, 0, 1, .5, -1, 0, .5, -1, 0, -.5, 1, 0, -.5, -1, 0, .5, 1, 0, -.5, 1, 0, .5]);
export const gable = (hw, h, d, c, x, y, z, ry = 0) => put(GAB, c, x, y, z, hw, h, d, 0, ry, 0);

// ---------- かたまり（当たり判定）。k: 0 箱 / 1 円柱 / 2 四角すいの屋根 / 3 切妻の屋根
export const solids = [], zones = []; const grid = new Map(), GC = 8, EMPTY = [];
function reg(s, R) { solids.push(s); const p = 1.3; for (let i = Math.floor((s.cx - R - p) / GC); i <= Math.floor((s.cx + R + p) / GC); i++) for (let j = Math.floor((s.cz - R - p) / GC); j <= Math.floor((s.cz + R + p) / GC); j++) { const k = i * 4096 + j; let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(s); } return s; }
export const near = (x, z) => grid.get(Math.floor(x / GC) * 4096 + Math.floor(z / GC)) || EMPTY;
function mk(k, hw, hd, x, yc, z, h, ry, o) { _p.set(x, yc, z).applyMatrix4(T); const a = yaw + ry; return reg({ k, cx: _p.x, cz: _p.z, hw, hd, cos: Math.cos(a), sin: Math.sin(a), y0: _p.y - h / 2, y1: _p.y + h / 2, ...o }, Math.hypot(hw, hd)); }
export const sbox = (w, h, d, x, y, z, ry = 0, o) => mk(0, w / 2, d / 2, x, y, z, h, ry, o);
export const scyl = (r, h, x, y, z, o) => { _p.set(x, y, z).applyMatrix4(T); return reg({ k: 1, cx: _p.x, cz: _p.z, r, y0: _p.y - h / 2, y1: _p.y + h / 2, ...o }, r); };
export const sroof = (k, hw, h, hd, x, y, z, ry = 0, o) => mk(k, hw, hd, x, y + h / 2, z, h, ry, o);
// 形と当たりを同時に置く
export const bx = (w, h, d, c, x, y, z, ry = 0, o) => { box(w, h, d, c, x, y, z, ry); return sbox(w, h, d, x, y, z, ry, o); };
// 建物の中かどうかを見る範囲。中にいるあいだ mesh（屋根）を消す
export function zone(w, d, h, o) { _p.set(0, 0, 0).applyMatrix4(T); const z = { cx: _p.x, cz: _p.z, hw: w / 2, hd: d / 2, cos: Math.cos(yaw), sin: Math.sin(yaw), y0: _p.y - .6, y1: _p.y + h, open: false, mesh: null, ...o }; zones.push(z); return z; }

let LX = 0, LZ = 0;
const local = (s, x, z) => { const dx = x - s.cx, dz = z - s.cz; LX = dx * s.cos - dz * s.sin; LZ = dx * s.sin + dz * s.cos; };
const topAt = s => s.k === 2 ? s.y0 + (s.y1 - s.y0) * Math.max(0, 1 - Math.max(Math.abs(LX) / s.hw, Math.abs(LZ) / s.hd)) : s.k === 3 ? s.y0 + (s.y1 - s.y0) * Math.max(0, 1 - Math.abs(LX) / s.hw) : s.y1;
export const inZone = (s, x, y, z) => { if (y < s.y0 || y > s.y1) return false; local(s, x, z); return Math.abs(LX) < s.hw && Math.abs(LZ) < s.hd; };

// 横方向の押し出し。b = { x, y(足もと), z, r, h }。足より step 以内の高さなら段差としてのぼれる
export function pushOut(b, step) {
  for (let pass = 0; pass < 2; pass++) for (const s of near(b.x, b.z)) {
    if (b.y + b.h <= s.y0 || s.thin) continue;
    if (s.k === 1) { const dx = b.x - s.cx, dz = b.z - s.cz, d = Math.hypot(dx, dz), R = s.r + b.r; if (d >= R || b.y + step >= s.y1) continue; if (d < 1e-4) { b.x += R; continue; } b.x = s.cx + dx / d * R; b.z = s.cz + dz / d * R; continue; }
    local(s, b.x, b.z); const ax = Math.abs(LX) - s.hw, az = Math.abs(LZ) - s.hd; if (ax >= b.r || az >= b.r) continue;
    if (b.y + step >= topAt(s)) continue;
    let px = 0, pz = 0;
    if (ax < 0 && az < 0) { if (ax > az) px = (b.r - ax) * Math.sign(LX || 1); else pz = (b.r - az) * Math.sign(LZ || 1); }
    else if (ax >= 0 && az >= 0) { const d = Math.hypot(ax, az); if (d >= b.r || d < 1e-5) continue; const k = (b.r - d) / d; px = ax * k * Math.sign(LX); pz = az * k * Math.sign(LZ); }
    else if (ax >= 0) px = (b.r - ax) * Math.sign(LX); else pz = (b.r - az) * Math.sign(LZ);
    b.x += px * s.cos + pz * s.sin; b.z += -px * s.sin + pz * s.cos;
  }
}
// 足もとの高さ。feet + step より上にある面は足場にならない。乗った「かたまり」は ground.hit に入る
export function ground(x, z, feet, step) {
  let y = groundY(x, z), hit = null;
  for (const s of near(x, z)) { let top; if (s.k === 1) { if (Math.hypot(x - s.cx, z - s.cz) > s.r + .12) continue; top = s.y1; } else { local(s, x, z); if (Math.abs(LX) > s.hw + .12 || Math.abs(LZ) > s.hd + .12) continue; top = topAt(s); } if (top <= feet + step && top > y) { y = top; hit = s; } }
  ground.hit = hit; return y;
}
// 頭の上の天井の高さ
export function ceiling(x, z, head) {
  let c = 1e9;
  for (const s of near(x, z)) { if (s.y0 < head - .1 || s.y0 >= c) continue; if (s.k === 1) { if (Math.hypot(x - s.cx, z - s.cz) > s.r) continue; } else { local(s, x, z); if (Math.abs(LX) > s.hw || Math.abs(LZ) > s.hd) continue; } c = s.y0; }
  return c;
}
// カメラがそこに置けないなら true
export function blocked(x, y, z) {
  if (y < groundY(x, z) + .3) return true;
  for (const s of near(x, z)) { if (s.nocam || (s.zone && s.zone.open) || y < s.y0 - .25 || y > s.y1 + .25) continue; if (s.k === 1) { if (Math.hypot(x - s.cx, z - s.cz) < s.r + .25) return true; continue; } local(s, x, z); if (Math.abs(LX) < s.hw + .3 && Math.abs(LZ) < s.hd + .3 && y < topAt(s) + .25) return true; }
  return false;
}
