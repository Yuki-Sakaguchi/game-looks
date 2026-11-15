// 島の中身。地形の色、村、教会、風車、灯台、港、浜、森、山、小島、そして住人の立ち位置。
import { THREE, K, at, box, cyl, cone, ico, pyr, gable, sbox, scyl, sroof, bx, zone, capture, soft, toWorld, worldYaw, ground } from './core.js';
import * as T from './terrain.js';
import * as P from './props.js';
const { WALL, STONE, GREY, WOOD, DWOOD, ROPE, IRON, ROOF, SHUT, LEAF, GAY } = P, { hash, groundY: gy } = T, PI = Math.PI, TAU = PI * 2;

export const W = { spots: [], people: [], smokes: [], fires: [], founts: [], mills: [], clouds: [], shore: [], animals: [], bell: null, bellRope: null, beam: null, start: null, pondMesh: null };
const person = (x, z, ry, o) => { const p = toWorld(x, 0, z); W.people.push({ x: p.x, z: p.z, hy: p.y, ry: worldYaw(ry), ...o }); };
const spotL = (x, y, z) => W.spots.push(toWorld(x, y, z));

// ---------- 配置表。[種類, x, z, 幅, 奥行, 向き, 屋根]  向き 0 は南向き（+z に戸口）
const HOUSES = [
  ['cafe', -20, 71, 10, 7.5, PI / 2, 'hip'], ['shed', 19, 73, 6.5, 5.5, -PI / 2, 'gable'],
  ['shop', -19, 46, 8, 7, PI / 2, 'hip'], ['bakery', 19, 45, 8, 7, -PI / 2, 'gable'],
  ['home', -11, 27, 7, 6, 0, 'hip'], ['home', 12, 26, 7, 7, 0, 'flat'],
  ['home', -33, 56, 7, 6, PI, 'gable'], ['home', -37, 36, 7, 6, 0, 'hip'], ['home', -50, 55, 6.5, 6.5, PI, 'flat'],
  ['home', 32, 56, 7, 6, PI, 'hip'], ['home', 35, 33, 8, 6, 0, 'gable'], ['home', 49, 43, 6.5, 6.5, -PI / 2, 'flat'],
  ['home', -24, 10, 7, 6, PI / 2, 'hip'], ['home', 22, 8, 7, 6, -PI / 2, 'hip'],
  ['home', -56, 16, 8, 6, PI / 2, 'gable'], ['cabin', -40, -36, 6, 5, PI / 2, 'gable'], ['home', 104, -66, 6, 5.5, PI, 'hip'],
];
const PLAZA = { x: 0, z: 46, r: 11 }, CHURCH = { x: 0, z: 4 }, MILL = { x: -68, z: 28 }, LIGHT = { x: T.CAPE.x - 2, z: T.CAPE.z - 4 }, RUIN = { x: 30, z: -52 }, CAMP = { x: -74, z: -40 }, SHACK = { x: 56, z: 64 }, FIELD = [-90, -60, 38, 66];
export const AREAS = [[T.ISLET.x, T.ISLET.z, 22, 'ひみつの小島'], [T.CAPE.x, T.CAPE.z, 30, '灯台の岬'], [T.PEAK.x, T.PEAK.z, 15, '見晴らし山'], [RUIN.x, RUIN.z, 11, '尾根の遺跡'], [0, 90, 27, '港'], [CHURCH.x, CHURCH.z, 14, '丘の教会'], [56, 68, 26, 'パラソルの浜'], [-74, 46, 24, '風車の畑'], [T.POND.x, T.POND.z - 8, 30, 'しずかの森'], [0, 44, 40, '白壁の村']];
const field = (x, z) => x > FIELD[0] && x < FIELD[1] && z > FIELD[2] && z < FIELD[3];
const occupied = [];
const free = (x, z, r = 1) => !field(x, z) && !T.onRoad(x, z) && occupied.every(o => Math.hypot(x - o[0], z - o[1]) > o[2] + r);

function layout() {
  const P_ = (x, z, r, y, b) => { occupied.push([x, z, r + 1]); return T.pad(x, z, r, y, b); };
  P_(0, 74, 13, 1.8, 6); P_(PLAZA.x, PLAZA.z, PLAZA.r + 1, null, 6);
  for (const h of HOUSES) h.y = P_(h[1], h[2], Math.hypot(h[3], h[4]) / 2 + 1.6, null, 4);
  CHURCH.y = P_(CHURCH.x, CHURCH.z - 2, 13, null, 6); MILL.y = P_(MILL.x, MILL.z, 7, null, 5); LIGHT.y = P_(T.CAPE.x, T.CAPE.z, 13, 14, 7); RUIN.y = P_(RUIN.x, RUIN.z, 8, null, 6);
  CAMP.y = P_(CAMP.x, CAMP.z, 6, null, 5); SHACK.y = P_(SHACK.x, SHACK.z, 5, 2.2, 5); P_(T.PEAK.x, T.PEAK.z, 5, null, 7); P_(T.ISLET.x, T.ISLET.z, 6, 2.6, 5);
  T.POND.y = P_(T.POND.x, T.POND.z, 12, null, 6) - .5;
  T.road([[0, 82], [0, 60], [0, 46]], 2); T.road([[0, 46], [0, 12]], 1.7); T.road([[0, 46], [-24, 46], [-44, 46], [-58, 36], [-66, 31]], 1.7); T.road([[0, 46], [24, 46], [40, 50], [52, 60]], 1.7);
  T.road([[5, 18], [13, 6], [13, -8], [6, -18], [-1, -25], [-8, -32]], 1.2); T.road([[40, 50], [58, 30], [64, 0], [62, -30], [60, -54], [64, -66]], 1.4); T.road([[-44, 46], [-46, 24], [-50, 2], [-54, -8]], 1.2); T.road([[-54, -8], [-66, -24], [-72, -36]], 1.1); T.road([[62, -30], [46, -44], [34, -50]], 1.1); T.road([[-66, 31], [-74, 38]], 1.3);
  T.bake();
}

function terrainMesh(scene) {
  const C = K.colors('#f0deb0', '#8cc070', '#7ab466', '#e0c86a', '#9a9488', '#6fa860', '#e6d8b8', '#e4cf9c', '#aaa498', '#6aa85c', '#dccfb4', '#ece0c8', '#cfc9a0', '#9cc47c');
  const land = K.terrain((x, z) => T.gridH(x, z), T.NX, T.NX, T.CELL, (y, x, z) => {
    if (y < -2.5) return C[12]; if (y < .5) return C[7]; const s = T.slope(x, z), n = hash(Math.round(x * .3), Math.round(z * .3));
    if (y > 2 && (s > .8 || y > 23)) return n > .5 ? C[4] : C[8];
    if (y < 1.5) return C[0];
    const dp = Math.hypot(x - PLAZA.x, z - PLAZA.z); if (dp < PLAZA.r + 1.5) return (Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? C[10] : C[11];
    if (Math.hypot(x, z - 74) < 13 && y < 2.2) return C[10];
    if (T.onRoad(x, z)) return C[6];
    if (field(x, z)) return Math.floor(x / 3) % 2 ? C[3] : C[5];
    if (y > 15) return n > .5 ? C[13] : C[2];
    if (x < -28 && z < 4 && y > 4) return n > .5 ? C[9] : C[2];
    return C[1 + Math.floor(n * 2)];
  });
  land.mesh.receiveShadow = true; scene.add(land.mesh);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), K.flat('#b8c4a0')); bed.rotation.x = -PI / 2; bed.position.y = -6.05; scene.add(bed);
  const seaMat = new THREE.MeshStandardMaterial({ color: '#1fa0b8', transparent: true, opacity: .78, roughness: .3 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), seaMat); sea.rotation.x = -PI / 2; sea.receiveShadow = true; scene.add(sea);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(T.POND.r + .5, 16), seaMat); pond.rotation.x = -PI / 2; pond.position.set(T.POND.x, T.POND.y, T.POND.z); scene.add(pond); W.pondMesh = pond;
  for (let k = 0; k < 220; k++) { const a = k / 220 * TAU; let r = 60; while (r < 140 && gy(Math.cos(a) * r, Math.sin(a) * r) > .05) r += .5; W.shore.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; W.shore.push([T.CAPE.x + Math.cos(a) * (T.CAPE.r + .5), T.CAPE.z + Math.sin(a) * (T.CAPE.r + .5)], [T.ISLET.x + Math.cos(a) * (T.ISLET.r + .5), T.ISLET.z + Math.sin(a) * (T.ISLET.r + .5)]); }
}

// ---------- 壁。ops = 開口 [{ u 中心, w 幅, y0, y1 }]。y0 が 0 なら戸口、それ以外は窓。外がわは +z
const HH = 3, TW = .3;
const win = (u, pot = false, w = 1.1) => ({ u, w, y0: 1, y1: 2.2, pot }), door = (u = 0, w = 1.4, h = 2.3) => ({ u, w, y0: 0, y1: h });
function wall(len, h, ops, c, shut, glass) {
  let x = -len / 2; const seg = (a, b, y0, y1) => { if (b - a > .02 && y1 - y0 > .02) bx(b - a, y1 - y0, TW, c, (a + b) / 2, (y0 + y1) / 2, 0); };
  for (const o of [...ops].sort((a, b) => a.u - b.u)) {
    const a = o.u - o.w / 2, b = o.u + o.w / 2, my = (o.y0 + o.y1) / 2, oh = o.y1 - o.y0; seg(x, a, 0, h); seg(a, b, 0, o.y0); seg(a, b, o.y1, h); x = b;
    if (o.y0 > 0) {
      box(o.w + .3, .08, TW + .2, STONE, o.u, o.y0 - .04, .04);
      if (glass) { for (let k = 0; k < 3; k++) box(o.w, oh / 3, .06, glass[k % glass.length], o.u, o.y0 + (k + .5) * oh / 3, 0); box(.06, oh, .08, IRON, o.u, my, 0); }
      else { box(.05, oh, .05, '#e8dcc0', o.u, my, 0); box(o.w, .05, .05, '#e8dcc0', o.u, my, 0); }
      if (shut) for (const s of [-1, 1]) box(o.w / 2, oh, .06, shut, o.u + s * (o.w * .75 + .02), my, TW / 2 + .04);
      if (o.pot) { box(o.w, .2, .26, '#c8744a', o.u, o.y0 - .2, TW / 2 + .17); for (let k = 0; k < 4; k++) ico(.15, k % 2 ? GAY[0] : GAY[1], o.u - o.w / 2 + .18 + k * (o.w - .36) / 3, o.y0 - .02, TW / 2 + .17, 0); }
    } else { for (const s of [a - .06, b + .06]) box(.12, o.y1 + .1, TW + .1, DWOOD, s, o.y1 / 2 + .05, 0); box(o.w + .24, .12, TW + .1, DWOOD, o.u, o.y1 + .06, 0); }
  }
  seg(x, len / 2, 0, h);
}

// ---------- 家の中身
const FURN = {
  home(w, d, i) {
    const v = i % 3, L = -w / 2 + TW, R = w / 2 - TW, Bk = -d / 2 + TW;
    P.bed(L + .75, Bk + 1.2, 0, SHUT[i % 5]); if (v !== 1) P.fireplace(R - 1.2, Bk + .32, 0); else { P.bed(L + 2.1, Bk + 1.2, 0, GAY[i % 5]); P.shelf(R - 1, Bk + .2, 0, 1.6); }
    P.table(R - 1.5, .7, 1.4, .9); P.chair(R - 1.5, 1.5, PI); P.chair(R - 2.5, .7, PI / 2); P.rug(L + 1.7, .9, 2.2, 1.5, ROOF[i % 3]);
    P.shelf(L + .2, .4, PI / 2, 1.4, GAY, 1.5); P.picture(0, 1.8, Bk + .02, 0, GAY[(i + 2) % 5]); P.pot(R - 1.5, .82, .7, GAY[i % 5], .6); P.crate(L + .5, 0, d / 2 - .8, .6);
    if (i % 4 === 0) spotL(R - .7, .9, Bk + 1.6);
  },
  cafe(w, d) {
    const Bk = -d / 2 + TW; P.counter(-1.4, Bk + 1.7, 5); P.shelf(-1.4, Bk + .2, 0, 4.6, ['#4f9a78', '#e0b040', '#c8603c', '#f4f4f4', '#5a6a8a'], 2.2);
    for (let k = 0; k < 5; k++) { cyl(.09, .11, .2, GAY[k], -3.4 + k * .9, 1.18, Bk + 1.7, 6); }
    for (const [x, z] of [[-3, .9], [-.4, 1.5], [2.6, -.6], [3.3, -2.2]]) { P.roundTable(x, z, '#f4f4f4'); P.chair(x - .95, z, PI / 2, '#3f8ad0'); P.chair(x + .95, z, -PI / 2, '#3f8ad0'); cyl(.07, .06, .16, '#ffd84a', x + .15, .89, z + .1, 6); }
    P.picture(3.2, 1.8, Bk + .02, 0, GAY[2]); P.picture(1.8, 1.8, Bk + .02, 0, GAY[4]); P.rug(.5, 2.2, 3, 1.3, '#3f8ad0'); P.pot(-w / 2 + .7, 0, d / 2 - .8, GAY[0], 1.3);
    person(-1.4, Bk + .95, 0, { name: 'カフェの店主 マルタ', look: { shirt: '#f4f4f4', pants: '#3f8ad0', hair: '#6a4a34', apron: '#e0483c' }, lines: ['いらっしゃい。今日のおすすめはレモネードだよ。', 'テラスのパラソル、上に飛び乗るとよく跳ねるって子どもたちが言ってたわ。', '港の桟橋の先には行った？ 釣り好きのジーノがいるはずよ。'] });
  },
  shop(w, d) {
    const L = -w / 2 + TW, R = w / 2 - TW, Bk = -d / 2 + TW; P.shelf(-1.6, Bk + .2, 0, 3.6, GAY, 2.2); P.shelf(L + .2, -.4, PI / 2, 3.4, ['#e0b040', '#4f9a78', '#f4f4f4', '#d8744a'], 2.2); P.counter(R - 1.6, -.6, 2.6, 0);
    box(.4, .28, .3, IRON, R - 1.2, 1.22, -.6); P.barrel(R - .6, 0, 1.9); P.barrel(R - 1.4, 0, 2.2, .8); P.crate(L + .6, 0, 2.3, .8); P.crate(L + .7, .8, 2.3, .55, .4); P.sack(L + 1.6, 0, 2.4); P.sack(-1, 0, Bk + 1); P.rug(-.6, 1, 2.4, 1.6, '#4f9a78');
    for (let k = 0; k < 5; k++) { box(.03, .5, .03, ROPE, -2 + k * .7, HH - .25, 1); ico(.16, GAY[k % 5], -2 + k * .7, HH - .6, 1, 0); }
    person(R - 1.6, -1.35, 0, { name: '雑貨屋 ノンナ', look: { shirt: '#4f9a78', pants: '#6a4a34', hair: '#e8e8e8', apron: '#f4ecdc' }, lines: ['貝がらを集めてるのかい？ 島じゅうに落ちてるって話だよ。', '屋根の上、灯台のてっぺん、小島…高いところと遠いところを探してごらん。', '平屋根の家は、外の階段から屋上に上がれるんだよ。'] });
    spotL(L + .7, 1.7, 2.3);
  },
  bakery(w, d) {
    const L = -w / 2 + TW, R = w / 2 - TW, Bk = -d / 2 + TW; P.oven(L + 1.3, Bk + .75, 0); P.counter(1.2, .3, 3.2, 0); for (let k = 0; k < 6; k++) ico(.16, k % 2 ? '#d8a860' : '#c89048', .1 + k * .42, 1.16, .3 + (k % 2) * .16, 0, .6, k, 1.5);
    P.table(R - .9, Bk + .9, 1.2, 1.2); for (let k = 0; k < 3; k++) cyl(.12, .12, .5, '#d8a860', R - 1.2 + k * .3, 1.07, Bk + .9, 5, 0, 0, .4); P.sack(L + .6, 0, 1.4, '#f4f4f4'); P.sack(L + 1.3, 0, 1.7, '#f4f4f4'); P.sack(L + .7, 0, 2.2); P.shelf(R - .2, 1.6, -PI / 2, 1.8, ['#d8a860', '#c89048', '#f0deb0'], 1.5); P.rug(0, 1.9, 2.6, 1.2, '#e0b040');
    person(1.2, -.5, 0, { name: 'パン屋 ピエトロ', look: { shirt: '#f4f4f4', pants: '#f4ecdc', hair: '#3a2a22', hat: '#ffffff', chef: true }, lines: ['焼きたてだよ！ …見るだけ？ まあいいさ、香りはタダだ。', '教会の裏から山道が続いてる。てっぺんの眺めは島いちばんだぞ。'] });
    W.smokes.push(toWorld(L + 1.3, HH + 2.6, Bk + .75));
  },
  shed(w, d) {
    const L = -w / 2 + TW, R = w / 2 - TW, Bk = -d / 2 + TW; P.net(L + 1.3, 0, Bk + 1, .2); P.crate(R - .6, 0, Bk + .6, .9); P.crate(R - .7, .9, Bk + .6, .6, .3); P.barrel(R - .6, 0, .6); P.barrel(R - 1.5, 0, Bk + .6);
    for (let k = 0; k < 3; k++) box(.04, 2.4, .04, WOOD, L + .12, 1.3, -.6 + k * .5, 0, .15); cyl(.3, .3, .25, ROPE, .2, .13, .8, 8); ico(.25, GAY[0], L + .6, .25, 1.6, 0); ico(.25, GAY[2], L + 1.1, .25, 1.9, 0); spotL(R - .7, 1.95, Bk + .6);
  },
  cabin(w, d) {
    const L = -w / 2 + TW, R = w / 2 - TW, Bk = -d / 2 + TW; P.bed(L + .75, Bk + 1.2, 0, '#e0483c'); P.fireplace(R - 1.1, Bk + .32, 0); P.table(R - 1.1, 1, 1.2, .8); P.chair(R - 2.1, 1, PI / 2); P.rug(L + 1.6, .8, 2, 1.4, '#8a5a44');
    for (let k = 0; k < 6; k++) cyl(.13, .13, .7, '#7a5a40', L + .5, .14 + Math.floor(k / 3) * .26, 1.2 + (k % 3) * .28, 6, 0, 0, PI / 2); spotL(R - 1.1, 1.3, 1);
  },
};

function roof(kind, w, d, zn, i, c) {
  if (kind === 'hip') { box(w + .9, .14, d + .9, '#e8dcc0', 0, HH + .02, 0); pyr(w / 2 + .5, 2, d / 2 + .5, c, 0, HH + .06, 0); sroof(2, w / 2 + .5, 2.06, d / 2 + .5, 0, HH, 0, 0, { zone: zn }); }
  else if (kind === 'gable') { box(w + .9, .14, d + .9, '#e8dcc0', 0, HH + .02, 0); gable(w / 2 + .5, 2.2, d + .9, c, 0, HH + .06, 0); sroof(3, w / 2 + .5, 2.26, d / 2 + .45, 0, HH, 0, 0, { zone: zn }); }
  else {
    bx(w + .4, .25, d + .4, '#efe2c8', 0, HH + .125, 0, 0, { zone: zn }); const e = w / 2 + .05, f = d / 2 + .05, py = HH + .5, zt = stairTop(d);
    const par = (len, x, z, ry) => bx(len, .5, .3, WALL, x, py, z, ry, { zone: zn });
    par(w + .4, 0, f, 0); par(w + .4, 0, -f, 0); par(d + .1, e, 0, PI / 2); par(zt - .6 + f, -e, (zt - .6 - f) / 2, PI / 2); if (f - zt - .6 > .2) par(f - zt - .6, -e, (f + zt + .6) / 2, PI / 2);
  }
  if (kind !== 'flat' && i % 2 === 0) { box(.7, 1.9, .7, WALL, w / 4, HH + 1.5, -d / 5); box(.9, .14, .9, c, w / 4, HH + 2.5, -d / 5); W.smokes.push(toWorld(w / 4, HH + 2.9, -d / 5)); }
}
const STEPS = 11, RISE = (HH + .25 + .2) / STEPS, stairTop = d => -d / 2 + .3 + (STEPS - 1) * .5;

function house(h, i) {
  const [kind, x, z, w, d, ry, rk] = h, cabin = kind === 'cabin', wc = cabin ? '#b08a60' : i % 3 === 1 ? '#efe2c8' : WALL, sh = cabin ? '#4f9a78' : SHUT[i % 5], flatR = rk === 'flat';
  const dU = kind === 'cafe' ? 2.6 : kind === 'shed' ? 0 : (i % 2 ? -1 : 1) * (w / 2 - 1.9), dW = kind === 'shed' ? 2.6 : 1.4;
  at(x, h.y + .2, z, ry, () => {
    bx(w + .5, 3, d + .5, STONE, 0, -1.5, 0); box(w - .5, .03, d - .5, cabin ? '#9a7650' : kind === 'home' ? '#c8a878' : '#d8c4a0', 0, .015, 0);
    const front = [door(dU, dW)]; if (kind !== 'shed') { front.push(win(dU > 0 ? dU - 2.6 : dU + 2.6, true)); if (w > 8) front.push(win(dU - 5.2, true)); }
    at(0, 0, d / 2 - TW / 2, 0, () => wall(w, HH, front, wc, sh));
    at(0, 0, -d / 2 + TW / 2, PI, () => wall(w, HH, kind === 'shed' ? [] : [win(-w / 4), win(w / 4)], wc, sh));
    at(w / 2 - TW / 2, 0, 0, PI / 2, () => wall(d - TW * 2, HH, [win(0, i % 2 === 0)], wc, sh));
    at(-w / 2 + TW / 2, 0, 0, -PI / 2, () => wall(d - TW * 2, HH, flatR ? [] : [win(0)], wc, sh));
    if (kind !== 'shed') at(dU - dW / 2, 0, d / 2 + .02, -1.95, () => box(dW - .1, 2.2, .07, sh, dW / 2, 1.1, 0));
    else for (const s of [-1, 1]) at(dU + s * dW / 2, 0, d / 2 + .02, s * 1.9, () => box(dW / 2, 2.2, .07, DWOOD, -s * dW / 4, 1.1, 0));
    box(1.5, .04, .8, '#c8603c', dU, -.17, d / 2 + .7);
    const zn = zone(w - .5, d - .5, HH - .05);
    zn.mesh = capture(() => roof(rk, w, d, zn, i, cabin ? '#8a5a44' : ROOF[i % 3]));
    if (flatR) {
      const xs = -w / 2 - .85; for (let j = 0; j < STEPS; j++) { const top = -.2 + (j + 1) * RISE; bx(1.1, top + 1.2, .5, j % 2 ? STONE : '#e4dac4', xs, (top - 1.2) / 2, -d / 2 + .3 + j * .5); }
      at(0, HH + .25, 0, 0, () => { P.roundTable(1, -.6); P.chair(1.9, -.6, -PI / 2, '#3f8ad0'); P.chair(.1, -.6, PI / 2, '#3f8ad0'); P.pot(w / 2 - .6, 0, d / 2 - .6, GAY[i % 5], 1.3); P.pot(w / 2 - .6, 0, -d / 2 + .6, GAY[(i + 1) % 5], 1.1); P.crate(-w / 2 + 1.6, 0, -d / 2 + .8, .7); for (const s of [-1, 1]) cyl(.04, .04, 2, DWOOD, s * (w / 2 - .5), 1, d / 2 - 1.4, 5); box(w - 1, .02, .02, ROPE, 0, 1.9, d / 2 - 1.4); for (let k = 0; k < 4; k++) box(.6, .7 - (k % 2) * .2, .03, [GAY[3], GAY[2], GAY[0], GAY[1]][k], -w / 2 + 1.4 + k * 1.1, 1.55 + (k % 2) * .1, d / 2 - 1.4); spotL(1, 1.5, -.6); });
    }
    FURN[kind](w, d, i);
    P.pot(dU + dW / 2 + .5, -.2, d / 2 + .5, GAY[i % 5], 1.2); if (i % 2) P.pot(dU - dW / 2 - .5, -.2, d / 2 + .5, GAY[(i + 2) % 5], 1); if (kind === 'home' && i % 3 === 0) P.bench(dU > 0 ? dU - 2.6 : dU + 2.6, -.2, d / 2 + .6, 0); if (kind === 'home' && i % 3 === 1) { P.barrel(w / 2 + .6, -.2, d / 2 - .6); P.crate(w / 2 + .7, -.2, d / 2 - 1.6, .7, .3); }
    if (kind === 'cafe') {   // テラス
      for (let k = 0; k < 8; k++) box(1.05, .08, 2.6, k % 2 ? '#e0483c' : '#f4f4f4', -4.3 + k * 1.05 + .6, HH - .5, d / 2 + 1.3, 0, .22); sbox(8.4, .2, 2.5, .5, HH - .5, d / 2 + 1.3, 0, { bounce: 14, nocam: true });
      at(0, -.2, d / 2, 0, () => { for (const [tx, tz, c] of [[-3, 4.4, 0], [.2, 5.4, 1], [3.4, 4.4, 2]]) { P.roundTable(tx, tz); P.chair(tx - .95, tz, PI / 2, '#3f8ad0'); P.chair(tx + .95, tz, -PI / 2, '#3f8ad0'); P.parasol(tx + .1, 0, tz + .1, GAY[c]); } });
      box(1, 1.3, .08, '#3a4a3a', dU + 1.5, .5, d / 2 + .7, 0, -.2); box(.8, .5, .09, '#f4f4f4', dU + 1.5, .8, d / 2 + .68, 0, -.2);
    }
    if (kind === 'shop') { P.stall(-1.2, -.2, d / 2 + 1.6, 0, GAY[2], ['#ff9a4a', '#e0483c', '#ffd84a', '#7ab466']); P.barrel(-w / 2 + .5, -.2, d / 2 + .6); }
    if (kind === 'bakery') { box(.9, .7, .06, '#e0b040', dU, 2.75, d / 2 + .5); cyl(.03, .03, .5, IRON, dU, 2.75, d / 2 + .25, 4, 0, PI / 2); }
    if (kind === 'shed') { P.net(w / 2 + 1.2, -.2, 0, PI / 2); P.crate(-1.9, -.2, d / 2 + .7, .9); P.barrel(-2.6, -.2, d / 2 + 1.4); }
  });
}

function church() {
  const w = 9, d = 16, UP = 2.6, slate = '#5a6a8a', GL = ['#e0483c', '#ffd84a', '#3f8ad0', '#4f9a78'];
  at(CHURCH.x, CHURCH.y + .2, CHURCH.z, 0, () => {
    bx(w + .6, 3, d + .6, STONE, 0, -1.5, 0); box(w - .5, .03, d - .5, '#d8cdb8', 0, .015, 0); box(1.6, .035, d - 2.4, '#b03a34', 0, .02, -.6);
    const side = [-5, -1.8, 1.4, 4.6].map(u => ({ u, w: 1, y0: 1.1, y1: 2.7 }));
    at(0, 0, d / 2 - TW / 2, 0, () => wall(w, HH, [door(0, 1.9, 2.6)], WALL));
    at(0, 0, -d / 2 + TW / 2, PI, () => wall(w, HH, [{ u: 0, w: 1.4, y0: 1.3, y1: 2.8 }], WALL, null, GL));
    at(w / 2 - TW / 2, 0, 0, PI / 2, () => wall(d - TW * 2, HH, side, WALL, null, GL)); at(-w / 2 + TW / 2, 0, 0, -PI / 2, () => wall(d - TW * 2, HH, side, WALL, null, GL));
    for (const s of [-1, 1]) at(s * .95, 0, d / 2 + .02, s * 1.9, () => box(.9, 2.5, .08, DWOOD, -s * .45, 1.25, 0));
    bx(3.4, .2, 1.4, STONE, 0, -.1, d / 2 + .9);
    const zn = zone(w - .5, d - .5, HH + UP);
    zn.mesh = capture(() => {
      box(w, UP, TW, WALL, 0, HH + UP / 2, d / 2 - TW / 2); box(w, UP, TW, WALL, 0, HH + UP / 2, -d / 2 + TW / 2); for (const s of [-1, 1]) box(TW, UP, d, WALL, s * (w / 2 - TW / 2), HH + UP / 2, 0);
      cyl(1.1, 1.1, .12, GL[2], 0, HH + 1.3, d / 2 + .02, 8, 0, PI / 2); cyl(.6, .6, .14, GL[1], 0, HH + 1.3, d / 2 + .03, 8, 0, PI / 2);
      box(w + 1, .14, d + 1, '#e8dcc0', 0, HH + UP, 0); gable(w / 2 + .6, 3, d + 1, slate, 0, HH + UP + .06, 0); sroof(3, w / 2 + .6, 3.06, d / 2 + .5, 0, HH + UP, 0, 0, { zone: zn });
      box(.14, 1.3, .14, '#e0b040', 0, HH + UP + 3.6, d / 2); box(.7, .14, .14, '#e0b040', 0, HH + UP + 3.8, d / 2);
    });
    // 塔（うしろ）と鐘
    const tz = -d / 2 - 2.2; bx(4.2, 12, 4.2, WALL, 0, 6, tz); for (const s of [-1, 1]) { box(.5, 2, 4.3, WALL, s * 1.85, 13, tz); box(4.3, 2, .5, WALL, 0, 13, tz + s * 1.85); } box(4.6, .3, 4.6, '#e8dcc0', 0, 14.1, tz); pyr(2.5, 4.2, 2.5, slate, 0, 14.2, tz); box(.12, 1, .12, '#e0b040', 0, 18.8, tz); box(.5, .12, .12, '#e0b040', 0, 19, tz);
    box(.9, 1.4, .08, slate, 0, 9, tz + 2.12); cyl(.7, .7, .1, '#f4f4f4', 0, 10.6, tz + 2.14, 10, 0, PI / 2); box(.06, .5, .04, IRON, 0, 10.8, tz + 2.2); box(.3, .06, .04, IRON, .13, 10.6, tz + 2.2);
    W.bell = toWorld(0, 13, tz); W.bellRope = toWorld(3.2, 1.3, -d / 2 + 1.2); box(.05, HH + UP - .6, .05, ROPE, 3.2, (HH + UP + .6) / 2, -d / 2 + 1.2); ico(.14, '#e0b040', 3.2, 1.25, -d / 2 + 1.2, 0);
    // 中：長いす、祭壇、ろうそく
    for (let r = 0; r < 5; r++) for (const s of [-1, 1]) at(s * 2.35, 0, 4.6 - r * 1.9, 0, () => { bx(2.5, .1, .5, WOOD, 0, .46, 0); box(2.5, .6, .08, WOOD, 0, .8, .26); for (const e of [-1.2, 1.2]) box(.08, .9, .56, DWOOD, e, .45, 0); });
    bx(4.6, .25, 2.6, STONE, 0, .125, -d / 2 + 1.8); bx(2.2, .9, .9, '#f4f4f4', 0, .7, -d / 2 + 1.5); box(2.4, .06, 1, '#e0b040', 0, 1.17, -d / 2 + 1.5); box(.1, .9, .1, '#e0b040', 0, 1.65, -d / 2 + 1.5); box(.5, .1, .1, '#e0b040', 0, 1.8, -d / 2 + 1.5);
    for (const s of [-1, 1]) { cyl(.04, .05, .5, '#f4f4f4', s * .8, 1.45, -d / 2 + 1.5, 5); box(.06, .1, .06, '#ffa832', s * .8, 1.75, -d / 2 + 1.5); cyl(.08, .14, 1.4, '#e0b040', s * 1.9, .95, -d / 2 + 1.8, 6); box(.08, .14, .08, '#ffa832', s * 1.9, 1.75, -d / 2 + 1.8); }
    spotL(-1.6, 1.1, -d / 2 + 1.8);
    person(1.6, -d / 2 + 3.2, 0, { name: '神父 ルカ', look: { shirt: '#2a2a32', pants: '#2a2a32', hair: '#e8e8e8', robe: true }, lines: ['ようこそ。静かな島でしょう。', '奥のひもを引くと鐘が鳴ります。どうぞ、鳴らしてみてください。', '教会の東から山道がのびています。足もとに気をつけて。'] });
    // 外まわり
    P.cypress(-6.5, -.2, 9, 1.1); P.cypress(6.5, -.2, 9, 1.2); P.cypress(-6.8, -.2, -4, 1); P.bench(-3.6, -.2, 9.6, 0); P.lamp(3.4, -.2, 10, PI);
    for (let k = 0; k < 5; k++) { const gx = 7.2 + (k % 3) * 1.5, gz = -9 + Math.floor(k / 3) * 2 + (k % 2) * .3; box(.6, .8, .14, STONE, gx, .2, gz); box(.4, .14, .14, STONE, gx, .66, gz); }
  });
}

function windmill() {
  const R = 3.5, seg = 2 * R * Math.tan(PI / 8) + .28, UP = 5;
  at(MILL.x, MILL.y + .2, MILL.z, .5, () => {
    cyl(R + .5, R + .5, 3, STONE, 0, -1.5, 0, 8, PI / 8); scyl(R + .4, 3, 0, -1.5, 0); cyl(R, R, .03, '#c8a878', 0, .015, 0, 8, PI / 8);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; at(Math.sin(a) * R, 0, Math.cos(a) * R, a, () => wall(seg, HH, k === 0 ? [door(0, 1.3, 2.2)] : k % 2 ? [] : [{ u: 0, w: .8, y0: 1.2, y1: 2.1 }], WALL, k % 2 ? null : SHUT[0])); }
    const zn = zone(R * 1.8, R * 1.8, HH + UP);
    zn.mesh = capture(() => { cyl(R - .9, R + .12, UP, WALL, 0, HH + UP / 2, 0, 8, PI / 8); cyl(R - .4, R - .4, .2, '#e8dcc0', 0, HH + UP, 0, 8, PI / 8); cone(R - .2, 2.4, '#8a5a44', 0, HH + UP + 1.2, 0, 8, PI / 8); box(.5, .5, 1.6, DWOOD, 0, HH + UP - .9, R - .9); for (const y of [1.2, 3]) box(.7, .9, .1, '#3a4a5a', 0, HH + y, R - .15 - y * .17); });
    scyl(R + .1, .3, 0, HH + UP, 0, { zone: zn });
    W.mills.push({ p: toWorld(0, HH + UP - .9, R + .05), ry: worldYaw(0) });
    cyl(1.1, 1.1, .5, GREY, 0, .55, 0, 10); cyl(1.3, 1.3, .3, STONE, 0, .15, 0, 10); cyl(.12, .12, 2.6, DWOOD, 0, 1.6, 0, 6); scyl(1.2, .8, 0, .4, 0); P.sack(-2, 0, -1.4, '#f4f4f4'); P.sack(-1.4, 0, -2.1); P.sack(-2.2, 0, -.6); P.crate(2, 0, -1.6, .8); P.barrel(2.1, 0, .3);
    for (let k = 0; k < 7; k++) box(.6, .05, .05, WOOD, -2.2, .4 + k * .4, 1.6, .8); for (const s of [-.3, .3]) box(.06, 3, .06, WOOD, -2.2 + s * .7, 1.5, 1.6 + s * .7); spotL(2, 1.5, -1.6);
    person(2.2, R + 2.4, .3, { name: '風車番 トト', look: { shirt: '#e0b040', pants: '#6a4a34', hair: '#8a5a44', hat: '#e8dcc0' }, lines: ['いい風だろ。羽根は一年じゅう回ってる。', '中をのぞいていきな。粉だらけだけどな。', '畑の干し草の上は、昼寝にちょうどいいぞ。'] });
  });
}

function lighthouse() {
  const TH = 15, n = 50, RS = 3.65, dth = .21, a0 = 1.2, red = '#e0483c';
  at(LIGHT.x, LIGHT.y, LIGHT.z, 0, () => {
    cyl(3.6, 3.9, .5, STONE, 0, .05, 0, 12); cyl(2.3, 2.8, TH, WALL, 0, TH / 2, 0, 12); cyl(2.66, 2.74, 2.2, red, 0, 4.4, 0, 12); cyl(2.44, 2.52, 2.2, red, 0, 10.4, 0, 12); scyl(2.8, TH + 3, 0, TH / 2 - 1.5, 0);
    box(1.1, 2, .2, '#3a4a5a', 0, 1.2, 2.72); box(1.3, .14, .3, DWOOD, 0, 2.27, 2.72); for (const y of [6, 9, 12.4]) box(.5, .8, .2, '#3a4a5a', 0, y, 2.6 - (y / TH) * .45);
    for (let j = 0; j < n; j++) { const th = a0 + j * dth, top = (j + 1) * TH / n, cx = Math.cos(th) * RS, cz = Math.sin(th) * RS; bx(1.6, .2, 1, j % 2 ? STONE : '#e4dac4', cx, top - .1, cz, -th, { nocam: true }); if (j % 2 === 0) { box(.07, 1.1, .07, IRON, Math.cos(th) * 4.35, top + .55, Math.sin(th) * 4.35); } if (j % 6 === 0) box(.14, top, .14, IRON, Math.cos(th) * 4.3, top / 2, Math.sin(th) * 4.3); }
    const end = a0 + (n - 1) * dth;
    for (let k = 0; k < 14; k++) { const th = k / 14 * TAU, dd = ((end - th) % TAU + TAU) % TAU; if (dd < 1.75 && dd > .2) continue; bx(1.8, .25, 1.75, '#e8dcc0', Math.cos(th) * 3.6, TH - .125, Math.sin(th) * 3.6, -th); box(.07, 1.1, .07, IRON, Math.cos(th) * 4.4, TH + .55, Math.sin(th) * 4.4); box(.06, .06, 2, IRON, Math.cos(th) * 4.4, TH + 1.1, Math.sin(th) * 4.4, -th); }
    cyl(1.7, 1.7, 2.3, '#bfe9ff', 0, TH + 1.15, 0, 10); for (let k = 0; k < 10; k++) { const th = k / 10 * TAU; box(.1, 2.3, .1, IRON, Math.cos(th) * 1.72, TH + 1.15, Math.sin(th) * 1.72); } scyl(1.75, 2.3, 0, TH + 1.15, 0); cyl(2.2, 2.2, .2, red, 0, TH + 2.4, 0, 10); cone(2.2, 1.7, red, 0, TH + 3.35, 0, 10); ico(.3, '#e0b040', 0, TH + 4.3, 0, 0);
    W.beam = toWorld(0, TH + 1.15, 0); spotL(-3.6, TH + 1, 0);
    person(3.4, 5, .6, { name: '灯台守 エンツォ', look: { shirt: '#3a4a6a', pants: '#f4ecdc', hair: '#e8e8e8', hat: '#3a4a6a' }, lines: ['らせん階段をのぼってみな。島がぜんぶ見える。', 'てっぺんからパラソルで飛ぶと最高だぞ。空中でジャンプを押しっぱなしだ。', '夜は来ないが、灯りは回しておく。それが灯台守ってもんだ。'] });
    P.bench(-4, 0, 5, .6); P.barrel(4.6, 0, 1.6); P.crate(5.2, 0, 2.6, .8, .4);
  });
}

// 2 点のあいだに板の橋をかける（たるみつき）。horiz なら高さ一定
function bridge(ax, ay, az, bx_, by, bz, w = 2.4, sag = .7, piles = true) {
  const L = Math.hypot(bx_ - ax, bz - az), n = Math.ceil(L / 1.2), ry = Math.atan2(bx_ - ax, bz - az);
  for (let i = 0; i < n; i++) { const t = (i + .5) / n, x = ax + (bx_ - ax) * t, z = az + (bz - az) * t, y = ay + (by - ay) * t - Math.sin(t * PI) * sag; bx(w, .18, L / n + .06, i % 2 ? WOOD : '#b8946a', x, y - .09, z, ry);
    if (i % 3 === 0) at(x, y, z, ry, () => { for (const s of [-1, 1]) { box(.1, 1.1, .1, DWOOD, s * (w / 2 - .05), .5, 0); if (piles) cyl(.12, .12, y + 3, DWOOD, s * (w / 2 - .1), -(y + 3) / 2, 0, 5); } });
    at(x, y, z, ry, () => { for (const s of [-1, 1]) box(.04, .04, L / n + .1, ROPE, s * (w / 2 - .05), 1, 0); }); }
}

function harbor() {
  bx(30, 3, 5.5, STONE, 2, .3, 84.2); for (let k = 0; k < 7; k++) { cyl(.22, .26, .5, IRON, -11 + k * 4.4, 2.05, 86.3, 6); }
  bridge(4, 1.8, 86.5, 4, 1.8, 116, 3, 0); bx(3.4, .2, 3, '#b8946a', 8.2, .45, 110); bx(1, .2, 3, WOOD, 6.1, 1.1, 110);
  P.boat(10.5, -.1, 96, .1, '#e0483c'); P.boat(-1.5, -.1, 100, PI + .1, '#3f8ad0'); P.boat(11, -.1, 104, -.1, '#f4f4f4', true); P.boat(-2.5, -.1, 91, PI - .2, '#f2c230'); P.boat(-10, -.1, 97, PI / 2 + .3, '#f4f4f4', true); P.boat(17, -.05, 95.5, -PI / 2 + .2, '#4f9a78');
  P.lamp(2.9, 1.8, 115.2, PI); P.crate(5.1, 1.8, 113.6, .8, .2); P.crate(5.2, 1.8, 105, .7); P.barrel(3, 1.8, 99); P.net(-8, 1.8, 83.6, 0); P.crate(12, 1.8, 83.5, 1, .2); P.crate(13.2, 1.8, 83.2, .8, .5); P.crate(12.4, 2.8, 83.4, .7, .7); P.barrel(10.4, 1.8, 83); P.barrel(-13, 1.8, 84);
  box(1.2, .9, .2, IRON, -4, 2.3, 85.4, .3, .3); cyl(.5, .5, .12, IRON, -4, 2.4, 85.6, 8, .3, PI / 2);   // いかり
  P.lamp(-6, 1.8, 80.5, 0); P.lamp(8.5, 1.8, 80.5, PI); P.bench(-2.5, 1.8, 79, 0); P.sign(1.8, 1.8, 77, .3, 3); P.stall(8, 1.8, 76.5, -.4, GAY[2], ['#bfe9ff', '#9ab8c8', '#ff9a4a']);
  for (const [x, z, c] of [[-14, 104, '#e0483c'], [22, 108, '#f2c230'], [-6, 122, '#e0483c'], [16, 124, '#f4f4f4']]) P.buoy(x, z, c);
  W.spots.push(new THREE.Vector3(4, 2.7, 114.6), new THREE.Vector3(11, 1.6, 105.5));
  W.people.push({ x: 3.2, z: 111, hy: 1.8, ry: PI / 2 + .3, sit: false, fish: true, name: '漁師 ジーノ', look: { shirt: '#3f8ad0', pants: '#5a6a8a', hair: '#3a2a22', hat: '#f2c230' }, lines: ['今日は潮がいい。…ま、釣れてないけどな。', '南西の小島は、岩づたいに跳んで渡れるぞ。ジャンプに自信があればな。', '海に落ちても平気さ。泳いで浮き桟橋や舟によじのぼれる。'] });
}

function plaza() {
  const { x, z } = PLAZA, y = gy(x, z);
  at(x, y, z, 0, () => { cyl(2.6, 2.7, .6, STONE, 0, .3, 0, 10); cyl(2.3, 2.3, .1, '#1fa0b8', 0, .58, 0, 10); scyl(2.6, .64, 0, .3, 0); cyl(.5, .7, 1.5, STONE, 0, .75, 0, 8); cyl(1.2, .5, .3, STONE, 0, 1.6, 0, 8); cyl(1, 1, .06, '#1fa0b8', 0, 1.74, 0, 8); cyl(.2, .3, .7, STONE, 0, 2.1, 0, 6); ico(.26, '#e0b040', 0, 2.6, 0, 0); scyl(.9, 2.4, 0, 1.2, 0); W.founts.push(toWorld(0, 2.6, 0)); });
  P.stall(x - 5.6, y, z + 6.4, .7, GAY[0], ['#e0483c', '#ffd84a', '#7ab466', '#ff9a4a']); P.stall(x + 5.8, y, z + 6.2, -.7, GAY[1], ['#f4f4f4', '#d8a860', '#e0b040']); P.stall(x + 6.4, y, z - 5.6, -2.3, GAY[2], ['#ff5a6a', '#ffd84a', '#f4f4f4', '#b08ad0']);
  for (const [dx, dz, r] of [[-8.6, -3.2, 1.2], [8.8, 2.6, -1.3], [-3.4, -8.6, 0], [3.4, -8.8, 0]]) P.bench(x + dx, y, z + dz, r);
  for (const [dx, dz] of [[-7.6, 7.6], [7.6, 7.6], [-7.6, -7.6], [7.6, -7.6]]) P.lamp(x + dx, gy(x + dx, z + dz), z + dz, Math.atan2(-dx, -dz));
  P.well(x - 9.4, gy(x - 9.4, z + 2.4), z + 2.4); P.sign(x + 2.6, y, z + 9.6, 0, 4); P.barrel(x + 8.6, y, z - 2.6); P.crate(x + 9, y, z - 3.8, .8, .3); for (let k = 0; k < 4; k++) P.pot(x + Math.cos(k * PI / 2 + .8) * 3.5, y, z + Math.sin(k * PI / 2 + .8) * 3.5, GAY[k], 1.4);
  // 路地の洗濯ひも、旗
  const line = (ax, az, bx_, bz, h) => { const L = Math.hypot(bx_ - ax, bz - az), ry = -Math.atan2(bz - az, bx_ - ax), ya = gy(ax, az) + h, yb = gy(bx_, bz) + h; box(L, .03, .03, ROPE, (ax + bx_) / 2, (ya + yb) / 2, (az + bz) / 2, ry, 0, Math.atan2(yb - ya, L)); const n = Math.floor(L / 1.1); for (let k = 1; k < n; k++) { const t = k / n; box(.5, .5, .03, GAY[k % 5], ax + (bx_ - ax) * t, ya + (yb - ya) * t - .28, az + (bz - az) * t, ry); } };
  line(-15, 39, -8, 31, 3.3); line(8, 30, 15, 41, 3.3); line(-9, 56, 9, 56, 4.4); line(-28, 50, -22, 44, 3.3);
  W.spots.push(new THREE.Vector3(x, y + 3.5, z));
}

function beach() {
  const y = SHACK.y;
  at(SHACK.x, y, SHACK.z, -.5, () => {   // 浜の売店
    bx(5, .3, 4, WOOD, 0, .15, 0); for (const sx of [-2.3, 2.3]) for (const sz of [-1.8, 1.8]) cyl(.1, .1, 2.9, DWOOD, sx, 1.6, sz, 6); pyr(3.3, 1.5, 2.8, '#e0c86a', 0, 3, 0); sroof(2, 3.3, 1.5, 2.8, 0, 3, 0, 0, { nocam: true });
    at(0, .3, 1.5, 0, () => P.counter(0, 0, 4.2, 0, '#e0c86a')); at(0, .3, 0, 0, () => { P.shelf(0, -1.6, 0, 3, ['#ff5a6a', '#ffd84a', '#5ac8ff', '#7ab466'], 1.6); for (let k = 0; k < 4; k++) cyl(.1, .08, .22, GAY[k], -1.4 + k * .9, 1.2, 1.5, 6); });
    for (const s of [-1.2, 0, 1.2]) at(s, 0, 2.6, 0, () => { cyl(.22, .22, .08, GAY[2], 0, .78, 0, 8); cyl(.04, .04, .76, IRON, 0, .38, 0, 5); scyl(.25, .8, 0, .4, 0); });
    for (let k = 0; k < 3; k++) box(.5, 2, .08, GAY[k], 3.2 + k * .15, 1.1, -1 + k * .7, .2, 0, .12);
    person(0, .2, 0, { name: '浜の売店 ビアンカ', look: { shirt: '#ff5a6a', pants: '#f4f4f4', hair: '#e0b040', hat: '#f4ecdc' }, lines: ['冷たいジュース、あるよ。', 'パラソルに上から飛び乗ってごらん。びよーんって跳ねるから。', '見張り台のてっぺん、ながめがいいよ。'] });
  });
  const pts = [[38, 73], [44, 71], [50, 73.5], [61, 72.5], [67, 69], [73, 64], [78, 57], [46, 77]];
  pts.forEach(([x, z], i) => { const yy = gy(x, z); if (yy < .5) return; P.parasol(x, yy, z, GAY[i % 3], i % 2 ? '#f4f4f4' : GAY[(i + 1) % 3]); P.towel(x + .9, yy, z + .6, i * .7, GAY[(i + 2) % 5]); if (i % 2) P.towel(x - 1, yy, z + .3, i * .4 + 1, GAY[(i + 3) % 5]); if (i % 3 === 0) ico(.3, GAY[i % 5], x - .8, yy + .3, z - 1, 1); });
  { const x = 57, z = 75, yy = gy(x, z); at(x, yy, z, .3, () => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(.09, .11, 2.9, WOOD, sx, 1.45, sz, 5); bx(2.5, .2, 2.5, WOOD, 0, 2.8, 0); for (const s of [-1, 1]) { box(.08, .9, 2.5, '#f4f4f4', s * 1.2, 3.35, 0); } box(2.5, .9, .08, '#f4f4f4', 0, 3.35, -1.2); pyr(1.6, .7, 1.6, '#e0483c', 0, 4.9, 0); for (const sx of [-1.2, 1.2]) for (const sz of [-1.2, 1.2]) box(.07, 2, .07, WOOD, sx, 3.9, sz); for (let j = 0; j < 9; j++) bx(1.2, .12, .5, WOOD, 0, .26 + j * .31, 3.9 - j * .34); box(.5, .3, .05, '#e0483c', 0, 3.5, 1.3); spotL(0, 3.7, -.3); }); W.people.push({ x: x + 2.6, z: z + 1, hy: yy, ry: PI / 2, name: 'ライフガード ダリオ', look: { shirt: '#e0483c', pants: '#f2c230', hair: '#3a2a22', skin: '#c89468' }, lines: ['沖に出すぎるなよ。流れが岸へ押し戻すけどな。', '泳ぐときも Shift で速く進める。おぼえておけ。'] }); }
  { const x = 65, z = 73.5, yy = gy(x, z); for (const [dx, dz, s] of [[0, 0, 1], [.9, .3, .7], [-.7, .6, .6], [.2, -.9, .5]]) { cyl(.38 * s, .5 * s, .6 * s, '#e4cf9c', x + dx, yy + .3 * s, z + dz, 8); cone(.3 * s, .4 * s, '#e4cf9c', x + dx, yy + .8 * s, z + dz, 6); } box(.03, .5, .03, DWOOD, x, yy + 1.2, z); box(.3, .18, .02, GAY[0], x + .15, yy + 1.35, z); }
  { const x = 70, z = 61, yy = gy(x, z); for (const s of [-1, 1]) cyl(.07, .07, 2.4, '#f4f4f4', x + s * 3.2, yy + 1.2, z + s * 1.4, 5); box(7, .7, .04, '#f4f4f4', x, yy + 2, z, -.41); ico(.28, GAY[1], x + 1, yy + .28, z + 2, 1); }
  for (const [x, z, s] of [[36, 67, 1.2], [42, 65.5, 1], [63, 61, 1.3], [72, 55, 1.1], [78, 47, 1.2], [81, 38, 1], [28, 72, 1.1], [69, 66, .9], [-60, 74, 1.1], [-70, 68, 1.2], [-46, 79, 1]]) P.palm(x, gy(x, z) - .1, z, s, .5 + hash(x, z));
  W.spots.push(new THREE.Vector3(44, gy(44, 71) + 3.5, 71), new THREE.Vector3(80, gy(80, 50) + .8, 50));
}

function farm() {
  const [x0, x1, z0, z1] = FIELD; P.fence(x0, z0, x1, z0, gy); P.fence(x0, z1, x1 - 6, z1, gy); P.fence(x0, z0, x0, z1, gy); P.fence(x1, z0 + 5, x1, z1, gy);
  for (let x = x0 + 2.2; x < x1 - 1; x += 3) for (let z = z0 + 1.5; z < z1 - 1; z += 1.5) { const k = Math.floor((x - x0) / 3) % 4, y = gy(x, z); if (y < 1.5) continue; soft(() => { if (k === 0) { ico(.32, '#4f9a58', x, y + .2, z, 0, .7, z); box(.12, .1, .12, '#e0483c', x + .12, y + .4, z); } else if (k === 1) { for (let j = 0; j < 2; j++) cone(.14, .9, '#e0c86a', x + j * .3 - .15, y + .45, z + j * .2, 4, z); } else if (k === 2) { ico(.3, '#6aa85c', x, y + .15, z, 0, .6, z); ico(.2, '#ff9a4a', x + .2, y + .12, z + .1, 0); } else { cyl(.03, .03, 1.3, DWOOD, x, y + .65, z, 4); ico(.3, '#5aa860', x, y + 1, z, 0, 1.2, z); } }); }
  for (const [x, z, r] of [[-64, 70, .3], [-66.5, 71, 1.2], [-65, 70.4, .8], [-57, 46, 0], [-56.4, 50, 1.5]]) P.hay(x, gy(x, z) + (r === .8 ? 1.3 : 0), z, r);
  { const x = -75, z = 52, y = gy(x, z); at(x, y, z, .4, () => { cyl(.06, .06, 2.2, DWOOD, 0, 1.1, 0, 5); box(1.8, .08, .08, DWOOD, 0, 1.6, 0); box(.7, .8, .3, '#e0483c', 0, 1.35, 0); box(1.7, .3, .26, '#e0483c', 0, 1.6, 0); ico(.26, '#e0c86a', 0, 2.05, 0, 0); cone(.44, .3, '#c8ac50', 0, 2.36, 0, 8); scyl(.2, 2.2, 0, 1.1, 0); }); }
  P.well(-52, gy(-52, 24), 24); P.crate(-59.6, gy(-59.6, 21), 21, .8); P.barrel(-60, gy(-60, 19.6), 19.6);
  P.fence(-50, 8, -50, 14, gy, .9, WOOD); P.fence(-50, 8, -44, 8, gy, .9, WOOD); P.fence(-44, 8, -44, 14, gy, .9, WOOD);
  W.animals.push({ kind: 'hen', x: -47, z: 11, r: 2.4, n: 4 }, { kind: 'sheep', x: -20, z: -4, r: 9, n: 4 }, { kind: 'sheep', x: 40, z: 6, r: 8, n: 3 });
  W.people.push({ x: -62, z: 44, hy: 0, ry: 1, name: '農家 アダ', look: { shirt: '#7ab466', pants: '#8a6a44', hair: '#6a4a34', hat: '#e0c86a' }, lines: ['トマトにかぼちゃ、麦にぶどう。小さい畑だけど自慢なんだ。', 'かかしの帽子はわたしのお古さ。'], path: [[-62, 44], [-62, 58], [-72, 58], [-72, 44]] });
  W.spots.push(new THREE.Vector3(-65, gy(-65, 70.4) + 3.4, 70.4), new THREE.Vector3(-84, gy(-84, 60) + .8, 60));
}

function wilds() {
  // 池と森のキャンプ
  const pd = T.POND; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + .2, r = pd.r + .4 + hash(k, 3) * 1.4, x = pd.x + Math.cos(a) * r, z = pd.z + Math.sin(a) * r; if (k % 3) P.reeds(x, gy(x, z), z); else P.rock(x, gy(x, z), z, .5 + hash(k, 4) * .5, false); }
  soft(() => { for (let k = 0; k < 7; k++) { const a = k * 2.4, r = 1.5 + hash(k, 9) * 5; cyl(.45, .45, .04, '#5aa860', pd.x + Math.cos(a) * r, pd.y + .02, pd.z + Math.sin(a) * r, 7); if (k % 2) box(.14, .1, .14, '#ffb0c0', pd.x + Math.cos(a) * r, pd.y + .09, pd.z + Math.sin(a) * r); } });
  bridge(pd.x + pd.r + 2.2, pd.y + .5, pd.z + 2, pd.x + 2.5, pd.y + .5, pd.z + .5, 1.6, 0, false);
  W.animals.push({ kind: 'duck', x: pd.x - 2, z: pd.z - 1, r: 4.5, n: 3 });
  W.people.push({ x: pd.x + 3.4, z: pd.z + .7, hy: pd.y + .6, ry: -PI / 2, fish: true, name: '釣り人 サラ', look: { shirt: '#b08ad0', pants: '#5a6a8a', hair: '#3a2a22', hat: '#7ab466' }, lines: ['しーっ。…って、どうせ釣れないんだけどね。', 'この先の森にだれかキャンプしてるよ。たき火の煙が見えた。'] });
  at(CAMP.x, CAMP.y, CAMP.z, .4, () => { P.tent(-2.6, 0, -1, .5, GAY[4]); P.tent(2.4, 0, -2.4, -.7, GAY[2]); P.campfire(0, 0, 1); W.fires.push(toWorld(0, .3, 1)); P.log(0, 0, 3, .1); P.log(-2.2, 0, 1.8, 1.2); P.crate(3, 0, .6, .6); cyl(.12, .14, .3, IRON, .9, .15, 1.6, 6); spotL(-2.6, .7, -1.2);
    person(1.9, 1.8, -2.3, { name: '旅人 ミロ', look: { shirt: '#ff9a4a', pants: '#4a5a4a', hair: '#6a4a34', pack: true }, lines: ['山のてっぺんで見た朝日は忘れられないな。', 'この島、歩いて一周できるんだ。北がわは崖だけどね。', 'ダッシュは空中でも一回だけ出せる。崖をこえるのに便利だよ。'] }); });
  // 山頂
  { const { x, z } = T.PEAK, y = gy(x, z); at(x, y, z, 0, () => { cyl(.07, .09, 5, '#eeeeee', 0, 2.5, 0, 6); box(1.6, .9, .04, '#e0483c', .85, 4.4, 0); box(1.6, .3, .045, '#f4f4f4', .85, 4.4, 0); scyl(.15, 5, 0, 2.5, 0); for (let k = 0; k < 5; k++) ico(.5 - k * .08, k % 2 ? GREY : '#aaa498', 2.4, .3 + k * .42, -1.4, 0, .7, k); scyl(.5, 2, 2.4, 1, -1.4); P.bench(-1.6, 0, 2.6, PI); cyl(.05, .05, 1.3, IRON, -3, .65, -1, 5); cyl(.1, .14, .8, '#e0b040', -3, 1.4, -1, 6, 0, 1.3); spotL(2.4, 2.9, -1.4);
    person(.8, 3, PI, { name: '画家 エレナ', look: { shirt: '#f4f4f4', pants: '#3f8ad0', hair: '#c8603c', hat: '#5a6a8a' }, lines: ['この青、絵の具じゃなかなか出ないのよ。', 'ここから南へ飛ぶと、村の屋根までとどくかも。ためしてみたら？'] }); box(.06, 1.5, .06, WOOD, 1.6, .75, 3.6, 0, .2); box(.9, .7, .05, '#f4f4f4', 1.6, 1.3, 3.7, 0, .2); box(.7, .25, .055, '#5ac8ff', 1.6, 1.45, 3.7, 0, .2); }); }
  // 遺跡
  at(RUIN.x, RUIN.y, RUIN.z, .3, () => { cyl(6, 6.2, .3, STONE, 0, .05, 0, 12); scyl(6, .4, 0, 0, 0); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, br = k === 2 || k === 5; if (k === 6) continue; P.column(Math.cos(a) * 4.8, .2, Math.sin(a) * 4.8, br ? 1.2 + k * .2 : 4, br); } for (const [a, b] of [[0, 1], [3, 4]]) { const m = (a + b) / 16 * TAU; bx(4.2, .5, .9, '#e8e0cc', Math.cos(m) * 4.45, 5.05, Math.sin(m) * 4.45, -m + PI / 2); }
    cyl(.42, .46, 3.6, '#e8e0cc', -1, .62, 6.6, 8, .4, 0, PI / 2); sbox(3.6, .9, .9, -1, .62, 6.6, .4); bx(1.6, .8, 1, STONE, 0, .6, 0); spotL(0, 1.8, 0); spotL(Math.cos(PI / 16 * 1) * 4.45, 6.2, Math.sin(PI / 16) * 4.45); P.rock(3, .2, 2.5, .6, false, '#e8e0cc'); });
  // 灯台への橋と、小島への飛び石
  { const ax = 58, az = -58, at_ = t => [ax + (LIGHT.x - ax) * t, az + (LIGHT.z - az) * t]; let ta = 0, tb = 1;
    for (let t = 0; t <= 1; t += .005) { const [x, z] = at_(t), y = gy(x, z); if (y > 3.4) ta = t; else if (y < 1) break; }
    for (let t = 1; t >= 0; t -= .005) { const [x, z] = at_(t), y = gy(x, z); if (y > 3.4) tb = t; else if (y < 1) break; }
    const a = at_(ta - .01), b = at_(tb + .01), ya = gy(...a) + .12, yb = gy(...b) + .12; bridge(a[0], ya, a[1], b[0], yb, b[1], 2.4, .9); W.bridge = [a, b]; W.spots.push(new THREE.Vector3((a[0] + b[0]) / 2, (ya + yb) / 2 + .3, (a[1] + b[1]) / 2)); }
  { const ax = -84, az = 72, n = 16; for (let i = 0; i <= n; i++) { const t = i / n, x = ax + (T.ISLET.x - ax) * t + Math.sin(i * 2.1) * 1.6, z = az + (T.ISLET.z - az) * t + Math.cos(i * 1.7) * 1.2, y = gy(x, z); if (y > .25) continue; const r = 1.1 + hash(i, 5) * .5, top = .45 + hash(i, 6) * .5; cyl(r * .85, r * 1.15, top + 3, i % 2 ? GREY : '#aaa498', x, top - (top + 3) / 2, z, 7, i); scyl(r * .95, top + 3, x, top - (top + 3) / 2, z); if (i === 9) W.spots.push(new THREE.Vector3(x, top + .8, z)); } }
  at(T.ISLET.x, gy(T.ISLET.x, T.ISLET.z), T.ISLET.z, 0, () => { P.palm(-3, 0, -2, 1.3, .9); P.palm(3.4, 0, 1.4, 1.2, .7); P.palm(.5, 0, 4.6, 1, 1.2); bx(1.1, .7, .7, '#8a5a34', 0, .35, 0, .5); box(1.16, .12, .76, '#e0b040', 0, .7, 0, .5); box(1.14, .34, .74, '#7a4a2c', 0, .9, 0, .5); box(.16, .2, .05, '#e0b040', .16, .6, .34, .5); spotL(0, 1.9, 0); P.tent(-3.2, 0, 2.6, 1.1, GAY[1]); P.campfire(2.2, 0, -2.6); W.fires.push(toWorld(2.2, .3, -2.6)); P.log(3.6, 0, -1.6, .9);
    person(1.6, -.4, -1.2, { name: '島の先客 ロッコ', look: { shirt: '#f4ecdc', pants: '#8a6a44', hair: '#3a2a22', beard: true, skin: '#c89468' }, lines: ['おっ、ここまで渡ってきたのか！ 大したもんだ。', '宝箱？ 中身は貝がら 1 個さ。きみにやるよ。', '帰りは泳いでもいいぞ。岸でそのまま上がれる。'] }); });
  // 海の岩
  for (const [x, z, r] of [[-30, -122, 3], [-36, -126, 1.8], [44, -116, 2.4], [118, -40, 2.2], [-118, 20, 2.6], [-121, 25, 1.4], [70, 104, 2], [124, -98, 2.4]]) { ico(r, GREY, x, r * .2, z, 0, .9, x); ico(r * .6, '#aaa498', x + r * .8, r * .1, z + r * .3, 0, .9, z); scyl(r * .8, r * 1.6, x, 0, z); }
  W.spots.push(new THREE.Vector3(-30, 3.6, -122), new THREE.Vector3(-56, T.POND.y + 1.3, -18 + .5 - .5), new THREE.Vector3(-100, gy(-100, -6) + .8, -6), new THREE.Vector3(20, gy(20, -100) + .8, -100), new THREE.Vector3(78, gy(78, 10) + .8, 10));
}

// 木・草・花・岩をばらまく
function scatter() {
  const tryPut = (n, seed, fn, x0 = -130, x1 = 130, z0 = -130, z1 = 130) => { for (let i = 0; i < n; i++) { const x = x0 + hash(i, seed) * (x1 - x0), z = z0 + hash(i, seed + 1) * (z1 - z0), y = gy(x, z); if (y > 1.2) fn(x, y, z, i, T.slope(x, z)); } };
  tryPut(520, 11, (x, y, z, i, s) => { if (s > .75 || y < 2.2 || !free(x, z, 1.6)) return; const forest = x < -26 && z < 6, hi = y > 13; if (!forest && !hi && hash(i, 77) > .34) return; if (hi && y > 22) return; (hi || (forest && hash(i, 78) > .55) ? P.pine : P.tree)(x, y - .1, z, .9 + hash(i, 13) * .7, i); occupied.push([x, z, 1.2]); });
  tryPut(60, 21, (x, y, z, i, s) => { if (s < .6 && y > 3 && y < 12 && free(x, z, 1.5) && z > -20) { (i % 2 ? P.cypress : P.olive)(x, y - .1, z, .9 + hash(i, 23) * .5, i); occupied.push([x, z, 1]); } }, -60, 70, -10, 66);
  tryPut(240, 31, (x, y, z, i, s) => { if (y > 1.8 && s < .9 && free(x, z, .8)) P.bush(x, y, z, .7 + hash(i, 33) * .8, LEAF[i % 3]); });
  tryPut(150, 41, (x, y, z, i, s) => { if ((s > .55 || y > 18 || y < 1.7) && free(x, z, 1)) P.rock(x, y, z, .4 + hash(i, 43) * 1.1, hash(i, 43) > .6, y < 1.7 ? '#c8bca4' : GREY); });
  tryPut(5200, 51, (x, y, z, i, s) => { if (y > 1.9 && s < .8 && y < 24 && !T.onRoad(x, z) && Math.hypot(x - PLAZA.x, z - PLAZA.z) > PLAZA.r + 2) P.grass(x, y, z, .8 + hash(i, 53) * .9, y > 15 ? '#9cc47c' : field(x, z) ? '#6fa860' : i % 3 ? '#7ab466' : '#6aa85c'); });
  tryPut(1300, 61, (x, y, z, i, s) => { if (y > 2 && s < .6 && y < 22 && !T.onRoad(x, z) && !field(x, z) && hash(Math.round(x / 9), Math.round(z / 9)) > .45) P.flower(x, y, z, ['#ffffff', '#ffd84a', '#ff5a6a', '#b08ad0', '#ff9a4a'][Math.floor(hash(Math.round(x / 9), Math.round(z / 9) + 5) * 5)]); });
  for (let k = 0; k < 9; k++) W.clouds.push(capture(() => P.cloud((hash(k, 91) - .5) * 520, 70 + hash(k, 92) * 40, (hash(k, 93) - .5) * 520, 1.6 + hash(k, 94) * 1.6), false));
  // 道ぞいの街灯と石垣
  for (const [x, z, r] of [[-2.4, 64, PI / 2], [2.4, 58, -PI / 2], [-30, 47.9, 0], [28, 47.6, 0], [-1.9, 30, PI / 2], [-55, 40, 0], [46, 56, 0]]) P.lamp(x, gy(x, z), z, r);
  P.stoneWall(-27, 49.5, -27, 60, gy); P.stoneWall(25, 50, 25, 61, gy); P.stoneWall(-30, 30.5, -17.5, 34, gy); P.stoneWall(18.5, 33, 30, 29, gy); P.stoneWall(-9, 15, -16, 17, gy, .7); P.stoneWall(8, 16, 16, 15, gy, .7);
  P.sign(-45.6, gy(-45.6, 43.6), 43.6, 1, 3); P.sign(41, gy(41, 47.6), 47.6, -1, 3); P.sign(6.6, gy(6.6, 19), 19, .5, 2); P.sign(60.6, gy(60.6, -28), -28, 2, 2); P.bench(63, gy(63, 14), 14, -PI / 2); P.bench(-48, gy(-48, 6), 6, PI / 2);
}

function folk() {
  const add = o => W.people.push({ hy: 0, ry: 0, ...o });
  add({ x: 5, z: 50, name: 'いたずらっ子 ニコ', kid: true, run: true, look: { shirt: '#ffd84a', pants: '#3f8ad0', hair: '#3a2a22' }, lines: ['ねえ、ダッシュ見せて！ びゅーんってやつ！', '屋根の上にも貝がらがあるんだよ。ぼく知ってるもん。'], path: [[5, 50], [7, 40], [-6, 39], [-8, 52], [0, 55]] });
  add({ x: -6, z: 42, name: 'おてんば ミア', kid: true, run: true, look: { shirt: '#ff5a6a', pants: '#f4f4f4', hair: '#c8603c' }, lines: ['二段ジャンプできる？ わたしはできない！', '噴水のてっぺん、きらきらしてるよ。'], path: [[-6, 42], [-8, 52], [0, 55], [5, 50], [7, 40]] });
  add({ x: -8.6, z: 42.2, ry: 1.2 + PI, sit: true, name: 'おばあさん ローザ', look: { shirt: '#b08ad0', pants: '#5a6a8a', hair: '#e8e8e8' }, lines: ['いいお天気ねえ。この広場で、もう六十年ひなたぼっこしてるのよ。', '西は風車と畑、東は浜、北は教会と山。迷ったら立て札をごらん。'] });
  add({ x: 0, z: 66, name: '郵便屋 パオロ', look: { shirt: '#3f8ad0', pants: '#3a4a6a', hair: '#6a4a34', hat: '#3f8ad0', pack: true }, lines: ['手紙かい？ ないよ。でも島を一周するのは日課でね。', '東の道を北へ行くと、岬の灯台に渡る橋があるよ。'], path: [[0, 66], [0, 48], [22, 46], [40, 50], [22, 46], [0, 48], [-22, 46], [-42, 46], [-22, 46], [0, 48]] });
  add({ x: 58, z: 20, name: '羊飼い ジュリア', look: { shirt: '#f4ecdc', pants: '#8a5a44', hair: '#e0b040', hat: '#e0c86a' }, lines: ['羊たち、勝手に散らばっちゃって。まあ島の外には行かないからね。', '尾根の上に古い柱が立ってるの。だれが建てたのかしら。'], path: [[58, 20], [48, 8], [38, 4], [48, 8]] });
  add({ x: 30, z: 67, name: '散歩の人 カルロ', look: { shirt: '#4f9a78', pants: '#f4ecdc', hair: '#3a2a22' }, lines: ['浜を歩くと頭がすっきりするんだ。', '浅いところは歩けるけど、深くなると泳ぎになるよ。'], path: [[30, 67], [44, 68], [58, 67], [70, 60], [58, 67], [44, 68]] });
  W.animals.push({ kind: 'cat', x: 4, z: 42, r: 8, n: 2 }, { kind: 'cat', x: -18, z: 76, r: 5, n: 1 }, { kind: 'dog', x: -12, z: 78, r: 4, n: 1 }, { kind: 'crab', x: 52, z: 76, r: 9, n: 5 }, { kind: 'crab', x: -62, z: 80, r: 6, n: 3 }, { kind: 'hen', x: -28, z: 30, r: 3, n: 2 });
}

export function build(scene) {
  layout(); terrainMesh(scene);
  HOUSES.forEach(house); church(); windmill(); lighthouse(); harbor(); plaza(); beach(); farm(); wilds(); scatter(); folk();
  // 屋根の上など、あとから高さを決める貝がら
  for (const [x, z] of [[-20, 71], [19, 45], [-37, 36], [35, 33], [0, -4.5], [32, 56]]) W.spots.push(new THREE.Vector3(x, ground(x, z, 1e3, 0) + .9, z));
  W.start = new THREE.Vector3(4, 1.9, 96);
}
