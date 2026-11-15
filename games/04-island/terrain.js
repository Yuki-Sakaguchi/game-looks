// 島の地形。高さの式と、建物の下を平らにならす「台」、道、池をここで決める。
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const hash = (a, b = 0) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };

export const CELL = 2, NX = 156, HALF = NX * CELL / 2;
export const ISLET = { x: -116, z: 100, r: 15 }, CAPE = { x: 96, z: -78, r: 24 }, PEAK = { x: -8, z: -34 }, POND = { x: -56, z: -18, r: 8, y: 0 };

// 岸からの距離（内がわが正）
function shore(x, z) {
  const a = Math.atan2(z, x), d = Math.hypot(x, z);
  let e = 100 + 9 * Math.sin(3 * a + .6) + 6 * Math.sin(5 * a + 2.1) + 3 * Math.sin(11 * a) - d;
  e = Math.max(e, CAPE.r - Math.hypot(x - CAPE.x, z - CAPE.z));
  e = Math.max(e, ISLET.r - Math.hypot(x - ISLET.x, z - ISLET.z));
  return e;
}
function raw(x, z) {
  const e = shore(x, z); if (e < 0) return Math.max(-6, e * .2);
  const north = smooth(.1, -.6, z / (Math.hypot(x, z) + 1)), isl = Math.hypot(x - ISLET.x, z - ISLET.z) < ISLET.r + 2;
  let h = 1.3 * smooth(0, 8, e) + (isl ? 1.6 * smooth(4, 12, e) : 3.6 * smooth(6, 34, e)) + (Math.sin(x * .045) * Math.cos(z * .05) * 2 + Math.sin(x * .11 + z * .07) * .7) * smooth(14, 40, e);
  h += 6 * smooth(1.5, 7, e) * north;                                                    // 北がわは崖
  h += 21 * Math.exp(-((x - PEAK.x) ** 2 + (z - PEAK.z) ** 2) / (2 * 19 * 19)) * smooth(4, 30, e);   // 山
  h += 8 * Math.exp(-((x - 30) ** 2 + (z + 52) ** 2) / (2 * 15 * 15)) * smooth(4, 30, e);            // 尾根
  h += 5 * Math.exp(-((x - CAPE.x) ** 2 + (z - CAPE.z) ** 2) / (2 * 16 * 16));                         // 岬
  return h;
}
// 台：[x, z, 半径, 高さ(null なら元の高さ), ぼかし幅]
export const pads = [];
export function pad(x, z, r, y = null, blend = 5) { const p = { x, z, r, y: y ?? Math.max(1.6, raw(x, z)), blend }; pads.push(p); return p.y; }
export function H(x, z) {
  let h = raw(x, z);
  for (const p of pads) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r + p.blend) h = lerp(h, p.y, smooth(p.r + p.blend, p.r, d)); }
  const dp = Math.hypot(x - POND.x, z - POND.z); if (dp < POND.r) h -= 1.5 * (1 - (dp / POND.r) ** 2);
  return h;
}
// 格子にした高さ。地面の三角形と同じ切り方で読むので、足もとがぴったり合う
let G = null;
export function bake() { G = new Float32Array((NX + 1) * (NX + 1)); for (let j = 0; j <= NX; j++) for (let i = 0; i <= NX; i++) G[j * (NX + 1) + i] = H(-HALF + i * CELL, -HALF + j * CELL); }
export function gridH(x, z) { const i = clamp(Math.round((x + HALF) / CELL), 0, NX), j = clamp(Math.round((z + HALF) / CELL), 0, NX); return G[j * (NX + 1) + i]; }
export function groundY(x, z) {
  const fx = (x + HALF) / CELL, fz = (z + HALF) / CELL; if (fx < 0 || fz < 0 || fx >= NX || fz >= NX) return -6;
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, w = NX + 1, a = G[j * w + i], b = G[(j + 1) * w + i], c = G[(j + 1) * w + i + 1], d = G[j * w + i + 1];
  return u + v <= 1 ? a + u * (d - a) + v * (b - a) : c + (1 - u) * (b - c) + (1 - v) * (d - c);
}
export const slope = (x, z) => Math.hypot(groundY(x + 1, z) - groundY(x - 1, z), groundY(x, z + 1) - groundY(x, z - 1)) / 2;
// 水面の高さ（池の中だけ池の水面）
export const waterY = (x, z) => Math.hypot(x - POND.x, z - POND.z) < POND.r + 1 ? POND.y : 0;
// 道
export const roads = [];
export function road(pts, w = 1.6) { for (let i = 0; i < pts.length - 1; i++) roads.push([...pts[i], ...pts[i + 1], w]); }
export function onRoad(x, z) { for (const [ax, az, bx, bz, w] of roads) { const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < w) return true; } return false; }
