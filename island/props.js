// 小物の部品集。どれも「いまの置き場所」からの相対位置で置く（y は足もと）。
import { at, box, cyl, cone, blade, ico, pyr, sbox, scyl, bx, soft } from './core.js';
import { hash } from './terrain.js';

export const WALL = '#f4ecdc', STONE = '#d8cdb8', GREY = '#9a9488', WOOD = '#a88660', DWOOD = '#6a4a34', SAND = '#f0deb0', ROPE = '#cbb890', IRON = '#4a4a52';
export const ROOF = ['#c8603c', '#b85434', '#d8744a'], SHUT = ['#3f8ad0', '#4f9a78', '#d8744a', '#e0b040', '#5a6a8a'], LEAF = ['#4f9a58', '#3f8a50', '#5aa860'], GAY = ['#ff5a6a', '#ffd84a', '#5ac8ff', '#f4f4f4', '#ff9a4a'];
const TAU = Math.PI * 2;

// ---- 木と草
export function tree(x, y, z, s = 1, k = 0) { cyl(.2 * s, .3 * s, 1.8 * s, DWOOD, x, y + .9 * s, z, 5); ico(1.5 * s, LEAF[k % 2], x, y + 3 * s, z, 0, 1, k); ico(1 * s, LEAF[(k + 1) % 3], x + .8 * s, y + 2.3 * s, z + .4 * s, 0, 1, k * 2); ico(.8 * s, LEAF[k % 3], x - .6 * s, y + 2.5 * s, z - .5 * s, 0, 1, k * 3); scyl(.32 * s, 4 * s, x, y + 2 * s, z, { nocam: true }); }
export function cypress(x, y, z, s = 1) { cyl(.14 * s, .18 * s, 1 * s, DWOOD, x, y + .5 * s, z, 5); cone(.75 * s, 5.4 * s, '#2f7a4a', x, y + 3.4 * s, z, 6); cone(.55 * s, 3 * s, '#3a8a54', x + .1, y + 2.6 * s, z + .1, 5, 1); scyl(.5 * s, 5 * s, x, y + 2.5 * s, z, { nocam: true }); }
export function pine(x, y, z, s = 1) { cyl(.16 * s, .24 * s, 1.6 * s, '#5a4030', x, y + .8 * s, z, 5); for (let k = 0; k < 3; k++) cone((1.5 - k * .36) * s, 1.9 * s, k % 2 ? '#2f6a4a' : '#357a50', x, y + (2.1 + k * 1.15) * s, z, 6, k); scyl(.3 * s, 5 * s, x, y + 2.5 * s, z, { nocam: true }); }
export function palm(x, y, z, s = 1, lean = .5) {
  let px = x, py = y; const a = hash(x, z) * TAU, dx = Math.cos(a), dz = Math.sin(a);
  for (let k = 0; k < 6; k++) { const o = lean * (k * k) * .045 * s; cyl(.17 * s, .2 * s, .95 * s, k % 2 ? '#9a7a54' : '#8a6a48', x + dx * o, y + (k + .5) * .9 * s, z + dz * o, 6); px = x + dx * o; py = y + (k + 1) * .9 * s; }
  const pz = z + dz * lean * 25 * .045 * s; px = x + dx * lean * 25 * .045 * s;
  for (let k = 0; k < 8; k++) { const b = k / 8 * TAU; for (let j = 0; j < 2; j++) box(1.3 * s, .06, (.6 - j * .2) * s, j ? '#4a9a5a' : '#58aa62', px + Math.cos(b) * (.7 + j * 1.15) * s, py - .05 - j * .42 * s, pz - Math.sin(b) * (.7 + j * 1.15) * s, b, 0, -.22 - j * .5); }
  ico(.16 * s, '#6a4a34', px + .2, py - .2, pz, 0); ico(.16 * s, '#6a4a34', px - .15, py - .25, pz + .15, 0); scyl(.25 * s, 5 * s, x, y + 2.5 * s, z, { nocam: true });
}
export function olive(x, y, z, s = 1, k = 0) { cyl(.16 * s, .3 * s, 1.2 * s, '#7a6650', x, y + .6 * s, z, 5, 0, 0, .15); ico(1.1 * s, '#8aa878', x + .1, y + 1.9 * s, z, 0, .8, k); ico(.8 * s, '#7a9a6c', x - .6 * s, y + 1.6 * s, z + .4 * s, 0, .8, k * 2); scyl(.3 * s, 2 * s, x, y + s, z, { nocam: true }); }
export const bush = (x, y, z, s = 1, c = LEAF[0]) => { ico(.7 * s, c, x, y + .35 * s, z, 0, .7, x); ico(.5 * s, LEAF[1], x + .5 * s, y + .25 * s, z + .2 * s, 0, .7, z); };
export function rock(x, y, z, r = 1, solid = true, c = GREY) { ico(r, c, x, y + r * .25, z, 0, .7, x + z); if (r > .9) ico(r * .55, '#aaa498', x + r * .7, y + r * .1, z + r * .4, 0, .7, x); if (solid) scyl(r * .8, r * 1.2, x, y + r * .25, z); }
export const grass = (x, y, z, s = 1, c = '#7ab466') => soft(() => { blade(.12 * s, .5 * s, c, x, y, z, x); blade(.1 * s, .38 * s, c, x + .15 * s, y, z + .1 * s, z, 0, .25); blade(.1 * s, .34 * s, c, x - .12 * s, y, z + .12 * s, x + z, 0, -.25); });
export const flower = (x, y, z, c) => soft(() => { blade(.05, .34, '#5a9a50', x, y, z, x); box(.16, .1, .16, c, x, y + .37, z, x); box(.07, .05, .07, '#ffe9a0', x, y + .44, z, x); });
export function reeds(x, y, z) { soft(() => { for (let k = 0; k < 5; k++) { const a = k * 1.9, r = .15 + (k % 3) * .14; blade(.05, 1.2 + (k % 2) * .4, '#6a9a50', x + Math.cos(a) * r, y, z + Math.sin(a) * r, a); if (k % 2) cyl(.05, .05, .28, '#6a4a34', x + Math.cos(a) * r, y + 1.5, z + Math.sin(a) * r, 5); } }); }

// ---- 外の小物
export function lamp(x, y, z, ry = 0) { at(x, y, z, ry, () => { cyl(.07, .1, 3.2, IRON, 0, 1.6, 0, 6); box(.7, .06, .06, IRON, .3, 3.15, 0); box(.26, .34, .26, '#ffe9a0', .6, 2.9, 0); pyr(.2, .16, .2, IRON, .6, 3.07, 0); scyl(.12, 3.2, 0, 1.6, 0, { nocam: true }); }); }
export function bench(x, y, z, ry = 0) { at(x, y, z, ry, () => { bx(1.7, .08, .5, WOOD, 0, .46, 0); box(1.7, .5, .07, WOOD, 0, .85, -.24, 0, -.15); for (const s of [-1, 1]) box(.08, .46, .46, IRON, s * .75, .23, 0); }); }
export function barrel(x, y, z, s = 1) { cyl(.36 * s, .36 * s, .9 * s, '#9a7650', x, y + .45 * s, z, 8); cyl(.39 * s, .39 * s, .08, IRON, x, y + .22 * s, z, 8); cyl(.39 * s, .39 * s, .08, IRON, x, y + .7 * s, z, 8); scyl(.38 * s, .9 * s, x, y + .45 * s, z); }
export function crate(x, y, z, s = .8, ry = 0, c = '#b89464') { bx(s, s, s, c, x, y + s / 2, z, ry); box(s * 1.04, s * .12, s * 1.04, '#8a6a44', x, y + s * .5, z, ry); }
export function pot(x, y, z, c = GAY[0], s = 1) { cyl(.22 * s, .15 * s, .3 * s, '#c8744a', x, y + .15 * s, z, 6); ico(.26 * s, '#4f9a58', x, y + .45 * s, z, 0, .8); box(.12, .1, .12, c, x + .1 * s, y + .64 * s, z); box(.12, .1, .12, c, x - .12 * s, y + .58 * s, z + .1 * s); }
export function sack(x, y, z, c = '#d8c8a0') { ico(.34, c, x, y + .3, z, 0, 1.05, x); box(.16, .12, .16, '#b8a880', x, y + .66, z); }
export function sign(x, y, z, ry, labels = 2) { at(x, y, z, ry, () => { cyl(.06, .08, 2.3, DWOOD, 0, 1.15, 0, 5); for (let k = 0; k < labels; k++) { const s = k % 2 ? -1 : 1; box(.9, .22, .05, '#e8dcc0', s * .42, 2.05 - k * .32, 0, k * .5); box(.16, .16, .05, '#e8dcc0', s * .9, 2.05 - k * .32, -Math.sin(k * .5) * s * .45, k * .5 + .78); } }); }
export function fence(ax, az, bx_, bz, gy, h = .9, c = '#e8dcc0') { const L = Math.hypot(bx_ - ax, bz - az), n = Math.max(1, Math.round(L / 1.6)), ry = -Math.atan2(bz - az, bx_ - ax); for (let i = 0; i <= n; i++) { const x = ax + (bx_ - ax) * i / n, z = az + (bz - az) * i / n, y = gy(x, z); box(.12, h + .1, .12, c, x, y + h / 2, z, ry); if (i < n) { const x2 = ax + (bx_ - ax) * (i + 1) / n, z2 = az + (bz - az) * (i + 1) / n, y2 = gy(x2, z2), mx = (x + x2) / 2, mz = (z + z2) / 2, my = (y + y2) / 2, rz = Math.atan2(y2 - y, L / n); for (const k of [.45, .8]) box(L / n, .07, .06, c, mx, my + h * k, mz, ry, 0, rz); sbox(L / n, h + 2, .16, mx, my + h / 2 - 1, mz, ry, { nocam: true }); } } }
export function stoneWall(ax, az, bx_, bz, gy, h = .8) { const L = Math.hypot(bx_ - ax, bz - az), n = Math.max(1, Math.round(L / 1.3)), ry = -Math.atan2(bz - az, bx_ - ax); for (let i = 0; i < n; i++) { const x = ax + (bx_ - ax) * (i + .5) / n, z = az + (bz - az) * (i + .5) / n, y = gy(x, z), hh = h + hash(i, x) * .2; bx(L / n + .04, hh + 1, .5, i % 3 ? STONE : '#c8bca4', x, y + hh / 2 - .5, z, ry, { nocam: true }); } }
export function parasol(x, y, z, c = GAY[0], c2 = '#f4f4f4') { cyl(.04, .04, 2.4, '#eeeeee', x, y + 1.2, z, 5); cone(1.7, .55, c, x, y + 2.5, z, 8); cone(1.72, .5, c2, x, y + 2.47, z, 4, .4); scyl(1.6, .3, x, y + 2.45, z, { bounce: 15, nocam: true }); }
export function towel(x, y, z, ry, c) { box(.9, .04, 1.9, c, x, y + .03, z, ry); box(.9, .045, .3, '#f4f4f4', x, y + .03, z, ry); }
export function stall(x, y, z, ry, c = GAY[0], goods = GAY) {
  at(x, y, z, ry, () => {
    for (const sx of [-1.3, 1.3]) for (const sz of [-.8, .8]) cyl(.05, .05, 2.4, DWOOD, sx, 1.2, sz, 5);
    for (let k = 0; k < 6; k++) box(.47, .08, 2.2, k % 2 ? c : '#f4f4f4', -1.18 + k * .47, 2.45, 0, 0, 0, 0); sbox(2.9, .2, 2.2, 0, 2.45, 0, 0, { bounce: 13, nocam: true });
    bx(2.6, .9, 1.1, WOOD, 0, .45, 0);
    for (let k = 0; k < 4; k++) { box(.52, .16, .8, '#8a6a44', -.96 + k * .64, .98, 0, 0, -.25); for (let j = 0; j < 6; j++) ico(.11, goods[(k + (j > 2 ? 1 : 0)) % goods.length], -1.12 + k * .64 + (j % 3) * .16, 1.1 + (j > 2 ? .1 : 0), -.2 + (j > 2 ? .3 : 0), 0); }
  });
}
export function well(x, y, z) { at(x, y, z, 0, () => { cyl(.9, .95, .8, STONE, 0, .4, 0, 8); cyl(.7, .7, .1, '#1fa0b8', 0, .72, 0, 8); scyl(.95, .8, 0, .4, 0); for (const s of [-1, 1]) cyl(.06, .06, 1.9, DWOOD, s * .8, 1.3, 0, 5); box(1.9, .08, .1, DWOOD, 0, 2.2, 0); pyr(1.2, .5, .7, ROOF[0], 0, 2.24, 0); cyl(.14, .16, .22, WOOD, .15, 1.4, 0, 6); box(.02, .75, .02, ROPE, .15, 1.8, 0); }); }
export function boat(x, y, z, ry, c = '#f4f4f4', big = false) {
  at(x, y, z, ry, () => { const L = big ? 5.4 : 3.6, w = big ? 1.9 : 1.4;
    bx(w, .7, L, c, 0, .12, 0); box(w * .78, .5, .9, c, 0, .15, L / 2 + .3); box(w * .45, .4, .5, c, 0, .2, L / 2 + .85); box(w + .1, .1, L + .1, '#3a4a5a', 0, .5, 0); box(w - .3, .06, L - .3, '#c8a878', 0, .44, 0);
    for (const s of [-1, .4]) box(w - .2, .08, .34, WOOD, 0, .56, s * L * .25);
    if (big) { bx(1.3, 1.1, 1.5, '#e8e8e8', 0, 1.05, -1.1); box(1.5, .1, 1.7, c === '#f4f4f4' ? '#3f8ad0' : '#f4f4f4', 0, 1.65, -1.1); box(1, .4, .04, '#5ac8ff', 0, 1.2, -.34); cyl(.04, .04, 2.2, '#eeeeee', 0, 2.7, -1.1, 5); box(.5, .3, .03, GAY[0], .27, 3.6, -1.1); }
    else { box(.05, .05, 1.8, WOOD, w / 2 + .05, .62, 0, 0, .1); box(.05, .05, 1.8, WOOD, -w / 2 - .05, .62, 0, 0, .1); }
  });
}
export function net(x, y, z, ry) { at(x, y, z, ry, () => { for (let k = 0; k < 5; k++) box(.03, .03, 2, ROPE, -.8 + k * .4, 1.1 - k * .12, 0, 0, .5); for (let k = 0; k < 4; k++) box(1.8, .03, .03, ROPE, 0, .5 + k * .3, -.6 + k * .4); for (const s of [-1, 1]) cyl(.05, .05, 2, DWOOD, s * 1, 1, .7, 5); ico(.16, GAY[4], .6, .6, -.4, 0); ico(.16, GAY[2], -.5, .9, .1, 0); }); }
export function hay(x, y, z, ry = 0) { cyl(.75, .75, 1.1, '#e0c86a', x, y + .72, z, 10, ry, Math.PI / 2); cyl(.2, .2, 1.12, '#c8ac50', x, y + .72, z, 6, ry, Math.PI / 2); sbox(1.5, 1.45, 1.1, x, y + .72, z, ry); }
export function tent(x, y, z, ry, c = GAY[4]) { at(x, y, z, ry, () => { for (const s of [-1, 1]) { box(1.9, .05, 2.8, c, s * .68, .82, 0, 0, 0, s * -.87); } box(.08, .08, 2.9, '#f4f4f4', 0, 1.42, 0); box(1.5, .04, 2.6, '#6a8ab0', 0, .04, 0); box(.7, .16, 1.7, '#e0483c', -.25, .13, -.2); sbox(.3, 1.4, 2.6, 0, .7, -.2, 0, { nocam: true }); }); }
export function campfire(x, y, z) { for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; ico(.2, GREY, x + Math.cos(a) * .6, y + .08, z + Math.sin(a) * .6, 0, .8, k); } for (let k = 0; k < 3; k++) box(.14, .14, .9, '#4a3428', x, y + .14, z, k * 1.05, .2); }
export function log(x, y, z, ry) { cyl(.3, .3, 1.8, '#7a5a40', x, y + .3, z, 7, ry, 0, Math.PI / 2); sbox(1.8, .6, .6, x, y + .3, z, ry); }
export function column(x, y, z, h = 4, broken = false) { cyl(.6, .65, .3, STONE, x, y + .15, z, 8); cyl(.42, .46, h, '#e8e0cc', x, y + .3 + h / 2, z, 8); if (!broken) { cyl(.6, .46, .3, STONE, x, y + .45 + h, z, 8); } scyl(.5, h + .6, x, y + (h + .6) / 2, z); }
export function buoy(x, z, c = '#e0483c') { cyl(.18, .4, .7, c, x, .2, z, 8); cyl(.05, .05, .8, '#f4f4f4', x, .9, z, 5); box(.16, .16, .16, '#ffe9a0', x, 1.36, z); scyl(.4, 1, x, .1, z); }
export function cloud(x, y, z, s = 1) { ico(5 * s, '#ffffff', x, y, z, 0, .45, x); ico(3.6 * s, '#f6fbff', x + 4.5 * s, y - .4 * s, z + 1, 0, .45, z); ico(3 * s, '#ffffff', x - 4 * s, y - .3 * s, z - 1, 0, .45, 1); ico(2.4 * s, '#f6fbff', x + 1 * s, y + 1.3 * s, z + .5, 0, .5, 2); }

// ---- 家の中の小物
export function table(x, z, w = 1.4, d = .9, c = WOOD) { bx(w, .08, d, c, x, .78, z); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(.08, .74, .08, DWOOD, x + sx * (w / 2 - .1), .37, z + sz * (d / 2 - .1)); }
export function roundTable(x, z, c = '#f4f4f4') { cyl(.6, .6, .06, c, x, .78, z, 10); cyl(.06, .06, .74, IRON, x, .37, z, 5); cyl(.3, .3, .04, IRON, x, .02, z, 8); scyl(.6, .1, x, .77, z); }
export function chair(x, z, ry = 0, c = WOOD) { at(x, 0, z, ry, () => { bx(.44, .06, .44, c, 0, .46, 0); box(.44, .5, .06, c, 0, .78, -.2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(.05, .44, .05, DWOOD, sx * .18, .22, sz * .18); }); }
export function bed(x, z, ry = 0, c = '#3f8ad0') { at(x, 0, z, ry, () => { bx(1.1, .35, 2.1, WOOD, 0, .22, 0); box(1.04, .16, 2, '#f4f4f4', 0, .46, 0); box(1.08, .14, 1.3, c, 0, .52, .32); box(.7, .12, .36, '#ffffff', 0, .58, -.74); box(1.1, .8, .08, DWOOD, 0, .5, -1.06); }); }
export function shelf(x, z, ry = 0, w = 1.6, items = GAY, h = 2) { at(x, 0, z, ry, () => { bx(w, h, .36, DWOOD, 0, h / 2, -.03); const rows = Math.floor(h / .5); for (let j = 0; j < rows; j++) { box(w - .1, .4, .3, '#8a6a4c', 0, .32 + j * .5, .06); for (let i = 0; i < Math.floor(w / .2) - 1; i++) { const r = hash(i + x * 7, j + z * 3); if (r < .22) continue; box(.11, .16 + r * .16, .2, items[Math.floor(r * 97) % items.length], -w / 2 + .2 + i * .2, .25 + j * .5 + r * .08, .12); } } }); }
export function counter(x, z, w, ry = 0, c = WOOD) { at(x, 0, z, ry, () => { bx(w, 1, .7, c, 0, .5, 0); box(w + .1, .08, .8, '#e8dcc0', 0, 1.04, 0); }); }
export const rug = (x, z, w, d, c, c2 = '#f4ecdc', ry = 0) => { box(w, .03, d, c, x, .02, z, ry); box(w - .4, .035, d - .4, c2, x, .02, z, ry); box(w - .8, .04, d - .8, c, x, .02, z, ry); };
export function fireplace(x, z, ry = 0) { at(x, 0, z, ry, () => { bx(1.6, 1.3, .6, STONE, 0, .65, 0); box(.9, .7, .2, '#2a2422', 0, .45, .22); box(.5, .3, .1, '#ffa832', 0, .25, .3); box(.2, .2, .1, '#fff6b0', 0, .22, .33); box(1.8, .1, .7, DWOOD, 0, 1.35, 0); box(.9, 1.7, .5, STONE, 0, 2.15, -.05); pot(.6, 1.4, 0, GAY[1], .6); }); }
export function oven(x, z, ry = 0) { at(x, 0, z, ry, () => { bx(2, 1.7, 1.4, '#c8744a', 0, .85, 0); pyr(1, .6, .7, '#b85434', 0, 1.7, 0); box(.9, .55, .1, '#2a2422', 0, .9, .7); box(.6, .3, .06, '#ffa832', 0, .82, .73); box(1.1, .08, .3, STONE, 0, .58, .8); }); }
export function picture(x, y, z, ry, c = GAY[2]) { at(x, y, z, ry, () => { box(.7, .55, .05, DWOOD, 0, 0, 0); box(.58, .43, .06, c, 0, 0, .005); box(.58, .16, .065, '#f0deb0', 0, -.13, .005); }); }
