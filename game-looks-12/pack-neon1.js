// 第 12 集「ネオンの港町」（31〜35）で使い回す部品。../game-looks-7/kit.js・retro.js・../game-looks-8/pack-city.js のあとに読み、
//   const K = KIT(THREE), R = RETRO(THREE, K), C = PACK_CITY(THREE, K, R), N = PACK_NEON1(THREE, K, R, C);   として使う。
// 作り方は retro.js と同じ（手で打ったドット絵のテクスチャ＋ R.geo() の少ない面）。足もとが y=0、正面が +z、大きさは m、色は '#rrggbb'。
// 第 8 集の pack-city.js（ネオン・配管・屋台・雨・映りこみ）に無い物だけを足す。看板の字は どれも実在しない漢字ふうの形（N.glyph が乱数で組む）。
//
// ■ テクスチャ  N.tex.名前({ … }) → THREE.Texture（同じ引数なら同じ物）
//   flats { c, seed, cage 0〜1, ac 0〜1, wash 0〜1 }   積み重なった集合住宅のかべ（128 ドット＝12 m。3 m × 3 m の部屋が 4 × 4。窓・鉄の窓かご・室外機・物干しざお・たれた しみ）
//   flatsLit { seed, lit 0〜1, cage }                   同じ並びの「あかりのついた窓」だけの絵（抜き。光る材質で flats の上に重ねる。seed と cage を flats とそろえる）
//   sign { kind: 'v'/'h', n（字の数）, c, c2（ふちの管）, bg, seed, bulbs }   漢字ふうの字のネオン看板（v＝たて長、h＝よこ長）
//   sail { c, seed }（ジャンク船の帆。横の竹のすじ・つぎ）   hull { c, c2（帯） }（船の板）   bus { c, c2, lit, seed }（二階建てバスの横・前・うしろの 1 枚）
//   jet { c（帯の色） }（飛行機の胴）   wing（つばさ）   cloth { kind: 'shirt'/'pants'/'towel'/'sheet', c, c2 }（せんたく物。抜き）   ac（室外機の正面）
// ■ 形
//   N.tower({ w: 12, d: 10, h: 60, c, seed, lit: 0〜1, cage, ac, wash（かべの絵の中の窓かご・室外機・物干しのわりあい）, acBox（出っぱる室外機の数のわりあい）, roof: true,
//            step（上を細くする高さ）, emissive, grad: [下の明るさ, 上の明るさ]（数か [r,g,b]。谷の底を暗く、上を夕日で明るく） }) → Group
//       高い集合住宅（4 面に flats。lit で夜の窓。屋上に水のタンク・アンテナ・小屋）。userData = { w, d, h }
//   N.sign({ kind, n, c, c2, w（はば m）, seed, flicker, bulbs, depth: .22 }) → Group   つき出し看板（両面が光る。まん中が x=0、下が y=0、面は z の向き）。userData = { w, h, c }
//   N.junk({ len: 12, c, sail（帆の色）, masts: 2, lit: true }) → Group   帆の船（x の向きが前。水面が y=0）。userData.sails（ゆらす）
//   N.ferry({ len: 16, c, c2, lit: true }) → Group   二つの向きに走れる渡し船（x の向き。水面が y=0）
//   N.bus({ c, c2, lit }) → Group   二階建てのバス（x の向きが前。userData.wheels を回す）
//   N.plane({ c（帯の色）, gear: true }) → Group   大きな旅客機（-x が機首。長さ 40 m ほど。userData.tick(t) で灯火が点めつ）
//   N.antenna({ h: 3, n: 5 }) → Group   魚の骨の形のテレビのアンテナ   N.laundry(a, b, { n, cs, seed, drop }) → Group   物干しのひもとせんたく物（風にゆれる）
//   N.umbrella(人, 色, 色2) → 人   かさを持たせる（N.umbPose(人) を毎コマ）   N.extra(i, o) → R.actor の引数（町の人。i で見た目が変わる）
// ■ 字   N.glyph(M, x, y, s, seed, v)   M（N.mask(w, h)）に s ドット角の漢字ふうの字を 1 つ打つ
// ■ 毎コマ：N.tick(t)（ちらつく看板・せんたく物・飛行機の灯火）
window.PACK_NEON1 = (THREE, K, R, C) => {
  const { hash, mix, ramp, tone, tn, Px } = R, T = R.tex, PI = Math.PI, N = {}, tx = {}, cache = new Map(), live = [];
  const def = (name, m, fn, cut = false) => { tx[name] = (o = {}) => { const k = name + JSON.stringify(o); let t = cache.get(k); if (!t) cache.set(k, t = T.from(fn(o), { m: o.m || m, cut: typeof cut === 'function' ? cut(o) : cut })); return t; }; };
  N.tex = tx; N.live = live; N.tick = t => { for (const o of live) o.userData.tick(t); };
  const flick = (t, s = 0) => hash(Math.floor(t * 9), s, 3) < .12 ? .25 : Math.sin(t * 31 + s * 7) > .95 ? .55 : 1;

  // ================= 字（漢字ふうの、どこにも無い字） =================
  N.mask = (w, h) => { const d = new Uint8Array(w * h), M = { w, h, d };
    M.set = (x, y, v) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) d[y * w + x] = v; };
    M.line = (x0, y0, x1, y1, v) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) M.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, v); };
    return M; };
  // 字の部品（0〜1 の箱の中に打つ）。横の画・たての画・はらい・点・口の形を組む
  const PART = [
    (L) => { L(0, .1, 1, .1); L(0, .5, 1, .5); L(.05, .92, .95, .92); L(.5, .1, .5, .92); },                 // 横 3 本＋たて
    (L) => { L(0, 0, 1, 0); L(0, 0, 0, 1); L(1, 0, 1, 1); L(0, 1, 1, 1); L(0, .5, 1, .5); },                  // 口に横 1 本
    (L) => { L(0, .25, 1, .25); L(.5, 0, .5, 1); L(.45, .3, 0, .85); L(.55, .3, 1, .85); },                   // 横・たて・左右のはらい
    (L) => { L(.15, .05, .15, 1); L(.85, .05, .85, 1); L(0, .05, 1, .05); L(.15, .55, .85, .55); L(0, 1, 1, 1); },   // たて 2 本と横 3 本
    (L) => { L(.3, 0, .55, .15); L(.1, .35, .3, .45); L(.05, .9, .35, .6); L(.75, 0, .75, 1); },               // 点々とたて（へん）
    (L) => { L(0, .3, 1, .3); L(.5, 0, .5, .3); L(.1, .55, .9, .55); L(.1, .55, .1, 1); L(.9, .55, .9, 1); L(.1, 1, .9, 1); },  // 十と下の口
    (L) => { L(.5, 0, .5, .2); L(0, .2, 1, .2); L(.2, .45, .8, .45); L(.5, .2, .5, 1); L(.5, 1, .25, .85); },   // なべぶた・はね
    (L) => { L(0, 0, .8, 0); L(.8, 0, .8, 1); L(.8, 1, 1, .85); L(.2, .3, .6, .3); L(.2, .65, .6, .65); L(.2, .3, .2, .65); }];  // かぎと中の口
  N.glyph = (M, x0, y0, s, sd, v = 1) => { const r = k => hash(sd, k, 41), s1 = s - 1;
    const sub = (bx0, by0, bx1, by1, k) => { const f = PART[Math.floor(r(k) * PART.length)]; f((ax, ay, cx, cy) => M.line(x0 + (bx0 + ax * (bx1 - bx0)) * s1, y0 + (by0 + ay * (by1 - by0)) * s1, x0 + (bx0 + cx * (bx1 - bx0)) * s1, y0 + (by0 + cy * (by1 - by0)) * s1, v)); };
    const lay = Math.floor(r(0) * 5);
    if (lay === 0) { sub(0, 0, .34, 1, 1); sub(.48, 0, 1, 1, 2); }          // へん と つくり
    else if (lay === 1) { sub(0, 0, 1, .38, 1); sub(0, .52, 1, 1, 2); }     // かんむり と 下
    else if (lay === 2) { sub(0, 0, 1, 1, 9); sub(.28, .3, .72, .78, 3); }   // 外の形の中に
    else if (lay === 3) { sub(0, 0, .3, .5, 1); sub(0, .6, .3, 1, 4); sub(.42, 0, 1, 1, 2); }
    else sub(0, 0, 1, 1, 5); };
  // 管の光の絵にする（芯は白っぽく、まわりに色、その外に うすいにじみ）
  const tube = (P, M, col, bg) => { const { w, h, d } = M;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = d[y * w + x]; if (v) { P.set(x, y, mix(col(v), '#ffffff', .68)); continue; } let n1 = 0, n2 = 0;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const q = d[yy * w + xx]; if (!q) continue; const md = Math.abs(i) + Math.abs(j); if (md === 1) n1 = q; else if (md <= 2) n2 = n2 || q; }
      if (n1) P.set(x, y, col(n1)); else if (n2 && bg) P.set(x, y, mix(col(n2), bg, .6)); } };
  def('sign', 1, (o = {}) => { const v = o.kind !== 'h', n = o.n || 3, s = 12, W = v ? s + 8 : n * (s + 3) + 7, H = v ? n * (s + 3) + 7 : s + 8, P = Px(W, H), c = o.c || '#ff5aa8', c2 = o.c2 || c, bg = o.bg || '#1e1832', B = ramp(bg), sd = o.seed || 0, M = N.mask(W, H);
    P.each((x, y) => (x < 1 || y < 1) ? B[4] : (x > W - 2 || y > H - 2) ? B[0] : (x < 3 || y < 3 || x > W - 4 || y > H - 4) ? B[2] : B[3]);
    for (let i = 0; i < n; i++) N.glyph(M, v ? 4 : 4 + i * (s + 3), v ? 4 + i * (s + 3) : 4, s, sd * 13 + i, 1);
    for (let x = 1; x < W - 1; x++) { M.set(x, 1, 2); M.set(x, H - 2, 2); } for (let y = 1; y < H - 1; y++) { M.set(1, y, 2); M.set(W - 2, y, 2); }
    if (o.bulbs) for (let k = 0; k < M.d.length; k++) if (M.d[k] === 2 && ((k % W) + ((k / W) | 0)) % 3) M.d[k] = 0;
    tube(P, M, q => q === 2 ? c2 : c, mix(bg, '#000000', .1));
    if (o.bulbs) for (let k = 0; k < M.d.length; k++) if (M.d[k] === 2) P.set(k % W, (k / W) | 0, '#fff4c8');
    return P; });

  // ================= 集合住宅のかべ =================
  // 1 部屋ぶん（32 × 32 ドット）の中身を決める。flats と flatsLit で同じ物を使う
  const cell = (i, j, sd, o) => { const r = k => hash(i * 7 + k, j * 3 + k * 5, sd + 11); const cage = r(1) < (o.cage ?? .55), kind = r(2), ex = r(3) < (o.ac ?? .5) ? 'ac' : r(3) < (o.ac ?? .5) + (o.wash ?? .3) ? 'wash' : 'none';
    return { cage, wide: kind > .72, half: kind < .12, ex, curtain: r(4), lit: r(5), shade: r(6), tone: r(7), plant: r(8) > .7 }; };
  const WIN = (q) => q.wide ? [3, 7, 26, 17] : q.half ? [9, 7, 14, 17] : [6, 7, 20, 17];   // 窓の x, y, はば, 高さ（部屋の中で）
  def('flats', 12, (o = {}) => { const P = Px(128), c = o.c || '#c8b8a0', M = ramp(c, 6, { contrast: .8 }), M2 = ramp(mix(c, '#d8d4cc', .5), 6, { contrast: .7 }), G = ramp('#3a4660'), F = ramp('#a8acb8'), I = ramp('#4a4e60'), A = ramp('#d8d4c4'), sd = o.seed || 0, CUR = ['#e8d8a8', '#c8e0d8', '#e8b8b0', '#b8c8e8', '#f0ece0'], WC = ['#e84a4a', '#f0f0e8', '#4a8ad0', '#f0c84a', '#5ab06a', '#e88ab8'];
    P.each((x, y) => { const n = tn(x, y, 16, 16, 128, 128, sd) * .6 + tn(x, y, 4, 4, 128, 128, sd + 2) * .4; let t = n > .62 ? 4 : n < .36 ? 2 : 3; if ((x & 3) === 0 && (y & 3) === 0) t--; return tone(M, t); });
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const q = cell(i, j, sd, o), X = i * 32, Y = j * 32;
      if (q.tone > .8) { const Q = ramp(mix(c, q.tone > .9 ? '#8a9aa8' : '#d8c8a8', .4), 6, { contrast: .8 }); for (let y = 3; y < 32; y++) for (let x = 0; x < 32; x++) if (hash(x >> 2, y >> 2, sd + i * 9 + j) > .4 || x > 4) P.set(X + x, Y + y, tone(Q, 3 + ((x & 3) === 0 && (y & 3) === 0 ? -1 : 0))); }   // はりかえた所
      for (let x = 0; x < 32; x++) { P.set(X + x, Y, M2[5]); P.set(X + x, Y + 1, M2[4]); P.set(X + x, Y + 2, M2[3]); P.set(X + x, Y + 3, M[0]); }   // 床の帯（上が光、下にかげ）
      for (let k = 0; k < 4; k++) { const x = Math.floor(hash(i, j * 4 + k, sd + 5) * 32), len = 4 + Math.floor(hash(i, k, sd + j) * 20); for (let y = 4; y < 4 + len; y++) if (y < 32) P.set(X + x, Y + y, (y + x) & 1 && y > len * .7 ? tone(M, 2) : tone(M, 1)); }   // 床の帯からたれる しみ
      const [wx, wy, ww, wh] = WIN(q);
      for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) { const e = x === 0 || y === 0, e2 = x === ww - 1 || y === wh - 1, mid = x === (ww >> 1) && !q.half; let col;
        if (e) col = F[4]; else if (e2 || mid) col = F[1]; else { const g = (x + y * .6) % 14; col = g < 2 ? G[4] : y < 4 ? G[3] : G[2]; if (q.curtain > .45 && (x < ww * .4 || q.curtain > .8) && y > 1) col = mix(CUR[Math.floor(q.curtain * 50) % 5], '#405070', .35 + (x & 1) * .08); }
        P.set(X + wx + x, Y + wy + y, col); }
      for (let x = 0; x < ww + 2; x++) { P.set(X + wx - 1 + x, Y + wy + wh, M2[4]); P.set(X + wx - 1 + x, Y + wy + wh + 1, M[1]); }   // 窓台
      if (q.cage) { const x0 = wx - 2, x1 = wx + ww + 1, y0 = wy - 2, y1 = wy + wh + 3;   // 鉄の窓かご（出っぱっている。右と下に かげ）
        for (let x = x0; x <= x1; x++) { P.set(X + x, Y + y0, I[4]); P.set(X + x, Y + y0 + 1, I[2]); P.set(X + x, Y + y1, I[3]); P.set(X + x + 1, Y + y1 + 1, M[0]); P.set(X + x + 1, Y + y1 + 2, tone(M, 1)); }
        for (let y = y0; y <= y1; y++) { P.set(X + x0, Y + y, I[3]); P.set(X + x1, Y + y, I[1]); P.set(X + x1 + 1, Y + y + 1, M[0]); }
        for (let x = x0 + 3; x < x1; x += 3) for (let y = y0 + 2; y < y1; y++) P.set(X + x, Y + y, y & 1 ? I[2] : I[3]);
        for (let x = x0 + 1; x < x1; x++) P.set(X + x, Y + y1 - 4, I[2]);
        if (q.plant) for (let k = 0; k < 9; k++) P.set(X + x0 + 2 + Math.floor(hash(k, i, j + sd) * (x1 - x0 - 3)), Y + y1 - 1 - Math.floor(hash(k, j, i) * 3), ['#4a8a4a', '#6ab05a', '#3a6a3a'][k % 3]);
        else for (let k = 0; k < 3; k++) { const bx = X + x0 + 2 + k * 6 + Math.floor(q.shade * 3); P.rect(bx, Y + y1 - 3, 4, 3, ['#c8a070', '#8a90a8', '#e8e0c8'][(k + j) % 3]); P.set(bx, Y + y1 - 3, '#f0e8d8'); } }
      if (q.ex === 'ac') { const ax = q.shade > .5 ? 2 : 19, ay = 25; for (let y = 0; y < 6; y++) for (let x = 0; x < 11; x++) P.set(X + ax + x, Y + ay + y, y === 0 ? A[5] : y === 5 || x === 10 ? A[1] : x > 5 && (x - 6) ** 2 + (y - 2.5) ** 2 < 5 ? (y + x) & 1 ? I[1] : I[2] : (y & 1) ? A[2] : A[3]);
        for (let y = 31; y < 38; y++) P.set(X + ax + 2, Y + y, tone(M, 1)); }   // 室外機と、その下の水のしみ
      else if (q.ex === 'wash') { const ly = 27; for (let x = 1; x < 31; x++) P.set(X + x, Y + ly, I[1]);   // 物干しざおと、せんたく物
        for (let k = 0; k < 4; k++) { const cx = X + 2 + k * 7 + Math.floor(hash(k, i, j) * 2), wc = ramp(WC[Math.floor(hash(k, j, i + sd) * 6)]), hh = 4 + Math.floor(hash(k, i + 3, j) * 4); for (let y = 1; y <= hh; y++) for (let x = 0; x < 5; x++) P.set(cx + x, Y + ly + y, x === 4 ? wc[1] : y === 1 ? wc[4] : wc[3]); } } }
    return P; });
  def('flatsLit', 12, (o = {}) => { const P = Px(128), sd = o.seed || 0, lit = o.lit ?? .4, WARM = [['#ffd27a', '#ffe9b8', '#fff6dc'], ['#ffb86a', '#ffd49a', '#ffecc8'], ['#a8d0ff', '#c8e4ff', '#e8f4ff'], ['#b8a8ff', '#d0c8ff', '#ece8ff'], ['#ffe0a0', '#fff0c8', '#ffffff']], I = '#20202e'; P.clip = true;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const q = cell(i, j, sd, o), X = i * 32, Y = j * 32; if (q.lit > lit) continue; const L = WARM[Math.floor(hash(i, j, sd + 3) * 5)], [wx, wy, ww, wh] = WIN(q);
      for (let y = 1; y < wh - 1; y++) for (let x = 1; x < ww - 1; x++) { let col = y < wh * .3 ? L[2] : y < wh * .7 ? L[1] : L[0]; if (q.curtain > .45 && (x < ww * .4 || q.curtain > .8)) col = mix(L[1], '#e8a070', .35 + (x % 3 === 0 ? .1 : 0)); if (x === (ww >> 1) && !q.half) col = '#6a6070'; P.set(X + wx + x, Y + wy + y, col); }
      if (q.shade > .66) { const px = X + wx + 3 + Math.floor(q.shade * 9) % (ww - 6), py = Y + wy + wh - 1; for (let y = 0; y < 8; y++) for (let x = -2; x <= 2; x++) if (y > 3 || Math.abs(x) < 2) P.set(px + x, py - y, '#5a4a58'); }   // 窓の中の人かげ
      else if (q.shade < .2) { P.rect(X + wx + ww - 6, Y + wy + wh - 6, 4, 4, '#3a3a50'); P.rect(X + wx + ww - 5, Y + wy + wh - 5, 2, 2, '#9ad0ff'); }   // テレビの光
      if (q.cage) for (let x = wx + 1; x < wx + ww; x += 3) for (let y = wy; y < wy + wh; y++) P.set(X + x, Y + y, I); }
    return P; }, true);
  def('ac', 1, (o = {}) => { const P = Px(16, 12), A = ramp(o.c || '#d8d4c4'), I = ramp('#4a4e60'); P.each((x, y) => y === 0 || x === 0 ? A[5] : y === 11 || x === 15 ? A[1] : (x - 10) ** 2 + (y - 5.5) ** 2 < 14 ? ((x + y) & 1 ? I[1] : I[3]) : (y & 1) ? A[2] : A[3]); P.disc(10, 5.5, 1.2, A[4]); return P; });

  // ================= 布・船・乗りもの =================
  def('cloth', 1, (o = {}) => { const k = o.kind || 'shirt', P = Px(16, k === 'sheet' ? 24 : 16), W = ramp(o.c || '#e84a4a'), c2 = o.c2; P.clip = true;
    const fill = (f) => P.each((x, y) => f(x, y) ? (x === 0 || y === 0 ? W[4] : (x > 13 || (y & 7) === 7) ? W[2] : (c2 && (x >> 2) & 1) ? c2 : W[3]) : null);
    if (k === 'shirt') fill((x, y) => (y < 5 && x >= 0) || (x >= 3 && x <= 12 && y < 15)); else if (k === 'pants') fill((x, y) => y < 15 && x >= 2 && x <= 13 && !(y > 4 && x > 6 && x < 9));
    else if (k === 'towel') fill((x, y) => x >= 3 && x <= 12 && y < 13); else fill((x, y) => x >= 0 && y < 23);
    for (let x = 0; x < 16; x++) if (P.get(x, 0)) P.set(x, 0, '#f8f4e8'); return P; }, true);
  def('sail', 4, (o = {}) => { const P = Px(32, 64), S = ramp(o.c || '#b0442e', 6, { contrast: .85 }), sd = o.seed || 0;
    P.each((x, y) => { const n = tn(x, y, 8, 16, 32, 64, sd); return tone(S, 3 + (n > .66 ? 1 : n < .3 ? -1 : 0) - ((x & 7) === 0 ? .6 : 0)); });
    for (let y = 0; y < 64; y += 8) for (let x = 0; x < 32; x++) { P.set(x, y, '#3a2a24'); P.set(x, y + 1, '#c8a878'); P.set(x, y + 2, S[1]); }   // 竹のすじ
    for (let k = 0; k < 4; k++) { const x = Math.floor(hash(k, 1, sd) * 24), y = 3 + Math.floor(hash(k, 2, sd) * 7) * 8; P.rect(x, y, 6, 4, S[k % 2 ? 4 : 2]); for (let i = 0; i < 6; i++) P.set(x + i, y, S[5]); }   // つぎ
    return P; });
  def('hull', 3, (o = {}) => { const P = Px(64, 32), H = ramp(o.c || '#6a4a34'), B = ramp(o.c2 || '#c8452e');
    P.each((x, y) => { const r = y % 5; return y < 6 ? (y < 1 ? B[5] : y > 4 ? B[1] : B[3]) : y < 8 ? H[5] : r === 0 ? H[1] : tone(H, 3 - ((x >> 4) + (y / 5 | 0)) % 2 * .7 + (hash(x >> 3, y / 5 | 0) > .85 ? -1 : 0)); });
    for (let k = 0; k < 10; k++) { const x = hash(k, 3) * 64, y = 10 + hash(k, 4) * 20; P.set(x, y, H[0]); P.set(x + 1, y, H[4]); }
    return P; });
  def('bus', 1, (o = {}) => { const P = Px(128, 64), Bd = ramp(o.c || '#c8302a'), Cr = ramp(o.c2 || '#f0e8d0'), G = ramp('#283450'), L = ['#ffe2a0', '#fff0c8', '#fffbe8'], lit = o.lit ?? 1, sd = o.seed || 0, AD = ramp('#2a4a8a');
    // 横（0〜95）：上の窓の列・帯・下の窓の列・すそ。前（96〜127 の上半分）・うしろ（下半分）
    const winRow = (y0, h, x0, x1, step, k) => { for (let x = x0; x < x1; x++) { const pane = (x - x0) % step, edge = pane === 0 || pane === step - 1; for (let y = 0; y < h; y++) { let c = edge ? Cr[1] : lit ? (y < 2 ? L[2] : y < h - 3 ? L[1] : L[0]) : (y < 2 ? G[4] : G[2]);
      if (!edge && lit && hash(Math.floor((x - x0) / step), k, sd) > .35) { const px = x0 + Math.floor((x - x0) / step) * step + step / 2, dx = x - px; if (y > h - 7 && Math.abs(dx) < 3 || (y > h - 10 && y <= h - 7 && Math.abs(dx) < 2)) c = ['#4a3a48', '#5a4a3a', '#3a3a5a'][Math.floor(hash(x0, px, k) * 3)]; }   // 乗っている人の頭と肩
      P.set(x, y0 + y, c); } } };
    P.each((x, y) => x < 96 ? (y < 2 ? Bd[4] : y < 26 ? Bd[3] : y < 30 ? Cr[3] : y < 54 ? Bd[3] : y < 56 ? Bd[1] : '#2a2a34') : null);
    winRow(4, 14, 2, 94, 13, 1); winRow(31, 13, 14, 94, 13, 2); for (let y = 30; y < 54; y++) for (let x = 2; x < 12; x++) P.set(x, y, x === 2 || x === 11 || x === 6 ? Cr[1] : y < 44 ? (lit ? L[1] : G[3]) : Bd[2]);   // 乗り口
    for (let x = 20; x < 76; x++) for (let y = 19; y < 25; y++) P.set(x, y, y === 19 || y === 24 ? AD[1] : AD[3]);   // 横の広告の板
    { const M = N.mask(56, 6); for (let i = 0; i < 4; i++) N.glyph(M, 3 + i * 13, 0, 6, sd * 5 + i, 1); for (let i = 0; i < M.d.length; i++) if (M.d[i]) P.set(20 + i % 56, 19 + (i / 56 | 0), '#f0e070'); }
    for (const wx of [18, 76]) for (let y = 46; y < 56; y++) for (let x = wx - 7; x < wx + 7; x++) if ((x - wx) ** 2 + (y - 56) ** 2 < 56) P.set(x, y, '#1a1a24');   // タイヤの所の切りかき
    for (let x = 0; x < 96; x++) { P.set(x, 26, Cr[5]); P.set(x, 29, Cr[1]); }
    // 前
    P.each((x, y) => x >= 96 && y < 32 ? (y < 1 ? Bd[4] : Bd[3]) : undefined);
    P.rect(99, 2, 26, 3, '#101018'); { const M = N.mask(24, 3); for (let i = 0; i < 3; i++) N.glyph(M, 1 + i * 8, 0, 3, sd + i * 3, 1); for (let i = 0; i < M.d.length; i++) if (M.d[i]) P.set(100 + i % 24, 2 + (i / 24 | 0), '#ffb030'); }   // 行き先の表示
    P.rect(98, 6, 28, 9, lit ? L[0] : G[3]); P.rect(98, 6, 28, 1, Cr[4]); P.rect(98, 16, 28, 1, Cr[3]); P.rect(98, 17, 28, 9, lit ? L[1] : G[2]); P.rect(111, 17, 2, 9, Cr[1]);
    for (let y = 18; y < 26; y += 2) P.rect(99, y, 11, 1, lit ? L[2] : G[4]);
    P.rect(98, 27, 28, 3, '#3a3a44'); P.rect(99, 27, 4, 3, '#fff6d0'); P.rect(121, 27, 4, 3, '#fff6d0'); P.rect(105, 28, 14, 1, '#6a6a78');
    // うしろ
    P.each((x, y) => x >= 96 && y >= 32 ? (y < 33 ? Bd[4] : Bd[2]) : undefined);
    P.rect(99, 36, 26, 9, lit ? L[0] : G[2]); P.rect(99, 49, 26, 6, Cr[2]); P.rect(99, 58, 4, 3, '#e83a3a'); P.rect(121, 58, 4, 3, '#e83a3a'); P.rect(106, 57, 12, 4, '#e8e0c8');
    return P; });
  def('jet', 6, (o = {}) => { const P = Px(64, 128), W = ramp('#e8eaf0', 6, { contrast: .6 }), Gy = ramp('#8a90a0'), S = ramp(o.c || '#2a6ac8');
    // よこ（x）＝胴のまわり（0 と 32 が横、16 が上、48 が下）、たて（y）＝機首(0)→尾(127)
    P.each((x, y) => { const a = Math.min(Math.abs(x - 32), Math.abs(x), Math.abs(x - 64)), bot = Math.abs(x - 48) < 12; let c = bot ? tone(Gy, 3 + (Math.abs(x - 48) > 8 ? 1 : 0)) : tone(W, a < 6 ? 3 : 4); if (y % 16 === 0) c = bot ? Gy[1] : W[2]; return c; });
    for (const sx of [0, 32]) { for (let y = 14; y < 112; y++) { for (const d of [-5, -4]) P.set(sx + d, y, S[3]); P.set(sx - 3, y, S[5]); }   // 窓の下の帯
      for (let y = 12; y < 108; y += 3) P.set(sx + 1, y, '#2a3448'); P.rect(sx, 6, 3, 2, '#2a3448'); for (const dy of [30, 80]) P.rect(sx - 1, dy, 2, 4, W[1]); }   // 窓の列・ドア
    for (let y = 2; y < 8; y++) for (let x = 0; x < 64; x++) if (Math.abs(x - 16) < 9 && y < 6) P.set(x, y, '#1a2030');   // 操縦席の窓
    return P; });
  def('wing', 6, () => { const P = Px(64), W = ramp('#c8ccd8', 6, { contrast: .6 }); P.each((x, y) => tone(W, 3 + (y < 4 ? 1 : 0) - (x % 16 === 0 ? 1 : 0) - (y > 50 && (x % 8 === 0) ? 1 : 0))); for (let x = 0; x < 64; x++) { P.set(x, 50, W[1]); P.set(x, 51, W[4]); } return P; });

  // ================= 形 =================
  const met = (c = '#5a5e70') => T.metal({ c }), mtx = R.TR;
  // テレビのアンテナ（魚の骨）。根もとが y=0
  N.antenna = (o = {}) => { const h = o.h || 3, n = o.n || 5, G = R.geo(); G.box(.06, h, .06, 0, 0, 0, { m: 1 }); for (let i = 0; i < n; i++) { const y = h - .2 - i * .32, l = .9 - i * .08; G.box(.04, .04, l, 0, y, 0, { m: 1 }); } G.box(.04, .04, 1.1, 0, h - .05, 0, { m: 1 }); const m = G.mesh(met('#8a8ea0')); m.castShadow = false; return m; };
  // 高い集合住宅
  N.tower = (o = {}) => { const w = o.w || 12, d = o.d || 10, h = Math.round((o.h || 60) / 3) * 3, sd = o.seed || 0, c = o.c || '#c8b8a0', B = R.parts(), g = new THREE.Group(), lit = o.lit ?? 0,
      fo = { c, seed: sd, cage: o.cage ?? .55, ac: o.ac ?? .45, wash: o.wash ?? .3 }, wall = tx.flats(fo), em = o.emissive ? { emissive: o.emissive } : {};
    const gr = o.grad || [1, 1], gy = y => { const k = y / h; return typeof gr[0] === 'number' && typeof gr[1] === 'number' ? gr[0] + (gr[1] - gr[0]) * k : [0, 1, 2].map(i => { const p = typeof gr[0] === 'number' ? gr[0] : gr[0][i], q = typeof gr[1] === 'number' ? gr[1] : gr[1][i]; return p + (q - p) * k; }); };
    const body = (bw, bd, y0, y1, x = 0, z = 0) => { B.g(wall, em).box(bw, y1 - y0, bd, x, y0, z, { m: 12, top: false, c0: gy(y0), c1: gy(y1) }); B.g(T.concrete({ c: mix(c, '#8a8a90', .6) })).quad([x - bw / 2, y1, z + bd / 2], [x + bw / 2, y1, z + bd / 2], [x + bw / 2, y1, z - bd / 2], [x - bw / 2, y1, z - bd / 2], [0, 0, bw / 3, bd / 3]);
      if (lit > 0) B.g(R.mat(tx.flatsLit({ seed: sd, lit, cage: fo.cage, ac: fo.ac, wash: fo.wash }), { glow: true, vc: true })).box(bw + .06, y1 - y0, bd + .06, x, y0, z, { m: 12, top: false });
      const par = B.g(T.concrete({ c: mix(c, '#a8a8a8', .5) })); par.box(bw + .3, .9, .25, x, y1, z + bd / 2, { m: 3 }); par.box(bw + .3, .9, .25, x, y1, z - bd / 2, { m: 3 }); par.box(.25, .9, bd, x + bw / 2, y1, z, { m: 3 }); par.box(.25, .9, bd, x - bw / 2, y1, z, { m: 3 }); };   // 屋上のかこい
    const st = o.step && o.step < h ? Math.round(o.step / 3) * 3 : 0;
    if (st) { body(w, d, 0, st); body(w * .7, d * .75, st, h, w * .12 * (hash(sd, 4) > .5 ? 1 : -1), 0); } else body(w, d, 0, h);
    const top = st ? h : h, tw = st ? w * .7 : w, td = st ? d * .75 : d, tx0 = st ? w * .12 * (hash(sd, 4) > .5 ? 1 : -1) : 0;
    const acm = R.mat(tx.ac({}), { vc: true }), A = B.g(acm), nA = Math.floor((o.acBox ?? .3) * (w / 3) * (h / 3) * .5);   // 出っぱった室外機（前と横）
    for (let k = 0; k < nA; k++) { const fx = Math.floor(hash(k, sd, 1) * Math.floor(w / 3)), fy = Math.floor(hash(k, sd, 2) * (h / 3 - 1)), x = -w / 2 + fx * 3 + (hash(k, sd, 3) > .5 ? .7 : 2.3), y = fy * 3 + .4;
      if (st && y > st) continue; A.box(.9, .6, .5, x, y, d / 2 + .25, { uv: [0, 0, 1, 1] }); }
    if (o.roof !== false) { const rr = k => hash(sd, k, 21); for (let k = 0; k < 2; k++) { const t = C.tank({ r: .8 + rr(k) * .5, h: 1.8, c: ['#4f8f88', '#a8a49a', '#6f7f9a'][k % 3], legs: .8, seed: sd + k }); t.position.set(tx0 + (rr(k + 3) - .5) * (tw - 3), top, (rr(k + 5) - .5) * (td - 3)); g.add(t); }
      for (let k = 0; k < 3; k++) { const a = N.antenna({ h: 2.5 + rr(k + 7) * 2.5 }); a.position.set(tx0 + (rr(k + 9) - .5) * (tw - 1.5), top, (rr(k + 11) - .5) * (td - 1.5)); a.rotation.y = rr(k) * 3; g.add(a); }
      if (rr(13) > .4) { const s = C.shack({ w: 3.4, d: 3, floors: 1, seed: sd + 3, shop: 'door', lit: lit ? .7 : 0, awning: false, laundry: false, sign: false }); s.position.set(tx0 + (rr(14) - .5) * (tw - 4.5), top, -td / 2 + 2); g.add(s); } }
    g.add(B.group()); g.userData = { w, d, h }; return g; };
  // つき出し看板（両面）。下が y=0、面は ±z
  N.sign = (o = {}) => { const kind = o.kind || 'v', n = o.n || 3, t = tx.sign({ kind, n, c: o.c, c2: o.c2, bg: o.bg, seed: o.seed, bulbs: o.bulbs }), ar = t.image.width / t.image.height, w = o.w || (kind === 'v' ? .9 : 2.4), h = w / ar, dp = o.depth ?? .22, g = new THREE.Group();
    let mt = R.mat(t, { glow: true, vc: true }); if (o.flicker) { const f = mt.onBeforeCompile; mt = mt.clone(); mt.onBeforeCompile = f; }
    const G = R.geo(); G.quad([-w / 2, 0, dp / 2], [w / 2, 0, dp / 2], [w / 2, h, dp / 2], [-w / 2, h, dp / 2]); G.quad([w / 2, 0, -dp / 2], [-w / 2, 0, -dp / 2], [-w / 2, h, -dp / 2], [w / 2, h, -dp / 2]);
    const face = G.mesh(mt); face.castShadow = false; g.add(face);
    const F = R.geo(); F.box(w, .06, dp, 0, h, 0, { m: 1 }); F.box(w, .06, dp, 0, -.06, 0, { m: 1 }); F.box(.06, h, dp, -w / 2, 0, 0, { m: 1, top: false }); F.box(.06, h, dp, w / 2, 0, 0, { m: 1, top: false }); g.add(F.mesh(met('#3a3c50')));
    if (o.flicker) { face.userData.dyn = true; const s = (o.seed || 0) + 3; face.userData.tick = tt => mt.color.setScalar(flick(tt, s)); live.push(face); }
    g.userData = { w, h, c: o.c || '#ff5aa8' }; return g; };
  // 船体：secs = [[x, はばの半分, ふなべりの高さ, 底の高さ], …]（うしろ→前）
  const hull = (B, secs, tex, deck) => { const G = B.g(tex).smooth(0), D = B.g(T.planks({ c: '#8a6a4a' }));
    for (let i = 0; i < secs.length - 1; i++) { const [x0, w0, t0, b0] = secs[i], [x1, w1, t1, b1] = secs[i + 1], u0 = x0 / 3, u1 = x1 / 3;
      G.quad([x0, b0, w0 * .55], [x1, b1, w1 * .55], [x1, t1, w1], [x0, t0, w0], [u0, 0, u1, 1]); G.quad([x1, b1, -w1 * .55], [x0, b0, -w0 * .55], [x0, t0, -w0], [x1, t1, -w1], [u1, 0, u0, 1]);
      G.quad([x0, b0, -w0 * .55], [x1, b1, -w1 * .55], [x1, b1, w1 * .55], [x0, b0, w0 * .55], [0, 0, 1, .2]);
      const dy0 = t0 - deck, dy1 = t1 - deck; D.quad([x0, dy0, w0 * .95], [x1, dy1, w1 * .95], [x1, dy1, -w1 * .95], [x0, dy0, -w0 * .95], [0, 0, (x1 - x0) / 2, w0]);
      G.quad([x0, dy0, w0 * .95], [x1, dy1, w1 * .95], [x1, t1, w1 * .95], [x0, t0, w0 * .95], [u0, .7, u1, 1]); G.quad([x1, dy1, -w1 * .95], [x0, dy0, -w0 * .95], [x0, t0, -w0 * .95], [x1, t1, -w1 * .95], [u1, .7, u0, 1]); }
    for (const [s, k] of [[secs[0], -1], [secs[secs.length - 1], 1]]) { const [x, w, t, b] = s; if (w < .05) continue; const q = k < 0 ? [[x, b, -w * .55], [x, b, w * .55], [x, t, w], [x, t, -w]] : [[x, b, w * .55], [x, b, -w * .55], [x, t, -w], [x, t, w]]; G.quad(...q, [0, 0, w * 2 / 3, 1]); } };
  // 帆：竹のすじで区切った、扇に開く帆（mast の位置が x=0、下が y=0、x の正が前）
  const sail = (G, H, Wd, n = 7) => { for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n, y0 = a * H, y1 = b * H, f0 = .25 + a * .1, f1 = .25 + b * .1, r0 = Wd * (.75 + a * .35), r1 = Wd * (.75 + b * .35) * (i === n - 1 ? .8 : 1), top = i === n - 1 ? .12 * H : 0;
      G.quad([-r0, y0, 0], [f0, y0, 0], [f1, y1, 0], [-r1, y1 + top, 0], [0, a, 1, b]); } };
  N.junk = (o = {}) => { const L = o.len || 12, B = R.parts(), g = new THREE.Group(), sails = [], hc = o.c || '#5a3a28';
    hull(B, [[-L / 2, L * .12, 2.4, .4], [-L * .4, L * .14, 1.9, -.4], [-L * .1, L * .15, 1.3, -.7], [L * .2, L * .13, 1.25, -.6], [L * .42, L * .08, 1.6, -.2], [L / 2, L * .045, 1.9, .5]], tx.hull({ c: hc, c2: o.c2 || '#c8452e' }), .35);
    const cab = B.g(T.planks({ c: '#7a5a3a' })); cab.box(L * .22, 1.1, L * .2, -L * .36, 1.9, 0, { m: 2 }); B.g(T.thatch({ c: '#8a7a5a' })).box(L * .25, .25, L * .23, -L * .36, 3, 0, { m: 2 });   // とものへやと、その屋根
    if (o.lit !== false) B.g(R.mat(C.tex.shopwin({ kind: 'room', lit: 1 }), { glow: true })).quad([-L * .44, 2.05, L * .101], [-L * .3, 2.05, L * .101], [-L * .3, 2.8, L * .101], [-L * .44, 2.8, L * .101]);
    const mast = B.g(T.bark({ c: '#6a5038' })).smooth(1), ms = (o.masts || 2) > 2 ? [[L * .28, .8], [-L * .05, 1], [-L * .3, .65]] : [[L * .22, .85], [-L * .12, 1]];
    for (const [mx, k] of ms) { const H = L * .78 * k; mast.loft(5, [[1, .1, .1, 0, 1, mx, 0], [1 + H, .06, .06, 1, 1, mx, 0]]);
      const sg = R.geo(); sail(sg, H * .85, L * .32 * k); const sm = sg.mesh(tx.sail({ c: o.sail || '#b0442e', seed: mx | 0 }), { side: true }); sm.position.set(mx, 1 + H * .12, 0); sm.rotation.y = .5; sm.userData.dyn = true; g.add(sm); sails.push(sm); }
    g.add(B.group()); if (o.lit !== false && C.lantern) { const l = C.lantern({ kind: 'red', r: .22 }); l.position.set(-L / 2 + .3, 3.3, 0); g.add(l); }
    g.userData = { sails, len: L }; return g; };
  N.ferry = (o = {}) => { const L = o.len || 16, B = R.parts(), g = new THREE.Group(), c = o.c || '#3a7a5a', c2 = o.c2 || '#f0ece0', W = 2.6;
    hull(B, [[-L / 2, 1.6, 1.2, .3], [-L * .4, W, 1.3, -.5], [L * .4, W, 1.3, -.5], [L / 2, 1.6, 1.2, .3]], tx.hull({ c, c2: '#e8e4d8' }), .3);
    const wn = C.tex.shopwin({ kind: 'room', lit: o.lit === false ? 0 : 1 }), Wl = B.g(T.plaster({ c: c2 })), Gw = B.g(R.mat(wn, { glow: o.lit !== false, vc: true }));
    Wl.box(L * .72, 2.1, W * 1.6, 0, 1, 0, { m: 2, top: false }); for (const sz of [1, -1]) for (let k = 0; k < 8; k++) { const x = -L * .32 + k * L * .09; Gw.quad([x, 1.9, sz * W * .81], [x + L * .07, 1.9, sz * W * .81], [x + L * .07, 2.8, sz * W * .81], [x, 2.8, sz * W * .81], [0, 0, 1, 1]); }
    B.g(C.tex.plate({ c: '#5a6a5a' })).box(L * .78, .2, W * 1.8, 0, 3.1, 0, { m: 3 }); B.g(C.tex.plate({ c: '#e8e4d8' })).box(L * .2, 1.3, W * 1.1, 0, 3.3, 0, { m: 2 });   // 屋根と、上の操だ室
    B.g(R.mat(wn, { glow: o.lit !== false, vc: true })).quad([-L * .09, 3.7, W * .56], [L * .09, 3.7, W * .56], [L * .09, 4.3, W * .56], [-L * .09, 4.3, W * .56]);
    g.add(B.group()); g.userData = { len: L }; return g; };
  // 二階建てバス（x の正が前。長さ 11 m）
  N.bus = (o = {}) => { const t = tx.bus({ c: o.c, c2: o.c2, lit: o.lit ?? 1, seed: o.seed }), L = 11, W = 2.5, H = 4.3, y0 = .35, g = new THREE.Group(), G = R.geo(), mt = R.mat(t, { vc: true, emissive: o.lit === 0 ? '#000000' : '#3a3020' });
    const r = (x, y, w, h) => [x / 128, 1 - (y + h) / 64, (x + w) / 128, 1 - y / 64], a = L / 2, b = W / 2, top = y0 + H, tp = .93;
    { const q = r(0, 0, 96, 56); G.quad([-a, y0, b], [a, y0, b], [a * .99, top, b * tp], [-a * .99, top, b * tp], [q[2], q[1], q[0], q[3]]); } G.quad([a, y0, -b], [-a, y0, -b], [-a * .99, top, -b * tp], [a * .99, top, -b * tp], r(0, 0, 96, 56));
    G.quad([a, y0, b], [a, y0, -b], [a * .99, top, -b * tp], [a * .99, top, b * tp], r(96, 0, 32, 32)); G.quad([-a, y0, -b], [-a, y0, b], [-a * .99, top, b * tp], [-a * .99, top, -b * tp], r(96, 32, 32, 32));
    G.quad([-a * .99, top, b * tp], [a * .99, top, b * tp], [a * .99, top, -b * tp], [-a * .99, top, -b * tp], r(4, 0, 80, 2));
    const body = new THREE.Mesh(G.build(), mt); body.castShadow = true; g.add(body);
    const wheels = []; for (const x of [a - 2.06, a - 8.7]) for (const z of [b - .2, -b + .2]) { const wg = R.geo().smooth(1); wg.at(mtx(0, 0, 0, 0, PI / 2)).loft(10, [[-.15, .5, .5, 0], [.15, .5, .5, 1]], { cap: 'both', capRect: true }); const w = wg.mesh(T.wheel({ kind: 'car' })); w.position.set(x, .5, z); w.userData.dyn = true; g.add(w); wheels.push(w); }
    g.userData = { wheels, len: L }; return g; };
  // 大きな旅客機（-x が機首。胴の中心が y=0）
  N.plane = (o = {}) => { const g = new THREE.Group(), B = R.parts(), jt = tx.jet({ c: o.c }), Lf = 40, rr = 2.3;
    const F = B.g(jt).smooth(1); F.at(mtx(0, 0, 0, 0, 0, -PI / 2)).loft(10, [[-Lf / 2, .2, .2, 1, 1, 0, 0], [-Lf / 2 + 1, rr * .6, rr * .62, .98, 1, .3, 0], [-Lf / 2 + 3.5, rr * .95, rr, .94], [-Lf / 2 + 6, rr, rr, .88], [Lf * .2, rr, rr, .28], [Lf * .38, rr * .6, rr * .55, .1, 1, -1.1, 0], [Lf / 2, rr * .15, rr * .15, 0, 1, -1.9, 0]], { cap: 'both', ur: 1, rot: 0 }).at(null);
    for (const sz of [1, -1]) { const G2 = B.g(tx.wing(), { side: true }); const span = 17, x0 = -3, root = 7, tip = 2, sweep = 7.5, y = -1.1; G2.quad([x0, y, 0], [x0 + root, y, 0], [x0 + sweep + tip, y + 1, sz * span], [x0 + sweep, y + 1, sz * span], [0, 0, 1, 1]);
      G2.quad([Lf * .36, .4, 0], [Lf * .5, .6, 0], [Lf * .5 + .5, 1, sz * 6.5], [Lf * .43, 1, sz * 6.5], [0, 0, 1, 1]);   // うしろの小さなつばさ
      const E = B.g(T.metal({ c: '#c8ccd8' })).smooth(1), ex = 2.2, ez = sz * 6.2; E.at(mtx(ex, -2.2, ez, 0, 0, -PI / 2)).loft(8, [[-2.2, .95, .95, 0], [-1.8, 1.1, 1.1, .2], [1.6, .9, .9, .9], [2.2, .55, .55, 1]], { cap: 'top' }).at(null);   // エンジン
      B.g(R.mat('#14161e')).at(mtx(ex - 2.2, -2.2, ez, 0, 0, -PI / 2)).loft(8, [[0, .9, .9, 0], [.05, .9, .9, 1]], { cap: 'bot' }).at(null); }
    const Tf = B.g(tx.wing(), { side: true }); Tf.quad([Lf * .34, 1.2, 0], [Lf * .5, 1.7, 0], [Lf * .5 + .8, 9, 0], [Lf * .44, 9, 0], [0, 0, 1, 1]);   // 尾のつばさ
    const Tc = B.g(T.metal({ c: o.c || '#2a6ac8' }), { side: true }); Tc.quad([Lf * .4, 4.5, .03], [Lf * .49, 5, .03], [Lf * .5 + .7, 8.6, .03], [Lf * .445, 8.6, .03], [0, 0, 1, 1]); Tc.quad([Lf * .49, 5, -.03], [Lf * .4, 4.5, -.03], [Lf * .445, 8.6, -.03], [Lf * .5 + .7, 8.6, -.03], [0, 0, 1, 1]);
    if (o.gear !== false) { const Gr = B.g(T.metal({ c: '#7a7e8a' })), Wh = B.g(R.mat('#22242c'), { smooth: true }); for (const [x, z] of [[-Lf / 2 + 4.5, 0], [3.5, 2.6], [3.5, -2.6]]) { Gr.box(.25, 2.2, .25, x, -rr - 2, z, { m: 1 }); for (const dz of [-.35, .35]) Wh.at(mtx(x, -rr - 2.1, z + dz, 0, PI / 2)).loft(8, [[-.15, .55, .55, 0], [.15, .55, .55, 1]], { cap: 'both' }).at(null); } }
    g.add(B.group());
    const halo = (c, r, x, y, z) => { const s = C.halo({ c, r, k: 1 }); s.position.set(x, y, z); g.add(s); return s; }, land = [halo('#fff6dc', 2.4, -2.5, -1.4, 3), halo('#fff6dc', 2.4, -2.5, -1.4, -3)], nav = [halo('#ff3a3a', 1, 6, 0, -17), halo('#3aff6a', 1, 6, 0, 17)], beacon = halo('#ff4040', 1.4, 0, -rr - .1, 0);
    g.userData.dyn = true; g.userData.tick = t => { beacon.material.opacity = (t * 1.2) % 1 < .12 ? 1 : .1; for (const s of nav) s.material.opacity = .9; }; live.push(g); g.userData.len = Lf; return g; };
  // 物干しのひもと せんたく物（a, b は [x, y, z]）
  const CL = ['#e84a4a', '#f0f0e8', '#4a8ad0', '#f0c84a', '#5ab06a', '#e88ab8', '#8a5ab0', '#f09a4a'], KINDS = ['shirt', 'pants', 'towel', 'sheet', 'shirt', 'towel'];
  N.laundry = (a, b, o = {}) => { const g = new THREE.Group(), len = Math.hypot(b[0] - a[0], b[2] - a[2]), n = o.n || Math.max(2, Math.floor(len / .9)), cs = o.cs || CL, sd = o.seed || 0, sag = o.sag ?? .25, items = [];
    const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u); }
    const lp = []; for (let i = 0; i < 8; i++) lp.push(...pts.slice(i * 3, i * 3 + 3), ...pts.slice(i * 3 + 3, i * 3 + 6)); const line = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)), new THREE.LineBasicMaterial({ color: '#3a3a44' })); g.add(line);
    const ang = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
    for (let i = 0; i < n; i++) { const u = (i + .5) / n, k = KINDS[Math.floor(hash(i, sd, 4) * 6)], c = cs[Math.floor(hash(i, sd, 5) * cs.length)], t = tx.cloth({ kind: k, c, c2: hash(i, sd, 6) > .7 ? '#f0f0e8' : undefined }), w = k === 'sheet' ? .9 : .55, h = w * t.image.height / t.image.width;
      const G = R.geo(); G.quad([-w / 2, -h, 0], [w / 2, -h, 0], [w / 2, 0, 0], [-w / 2, 0, 0]); const m = G.mesh(t, { side: true }); m.castShadow = false;
      const p = new THREE.Group(); p.position.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u); p.rotation.y = ang; p.add(m); g.add(p); items.push([p, hash(i, sd, 7) * 6]); }
    g.userData.dyn = true; g.userData.tick = t => { for (const [p, ph] of items) p.rotation.x = Math.sin(t * 2.1 + ph) * .18 + Math.sin(t * 3.7 + ph * 2) * .06 - .1; }; live.push(g); return g; };
  // かさ（8 角）。人の根もとに付ける
  N.umbrella = (who, c, c2) => { const g = new THREE.Group(), G = R.geo(); G.loft(8, [[0, .64, .64, 0, .78], [.1, .5, .5, .4, .95], [.2, .26, .26, .8, 1.05], [.26, .02, .02, 1, 1.1]], { ur: 4 }); const M = R.geo(); M.box(.035, .95, .035, 0, -.82, 0, { m: .5 }); M.box(.03, .1, .03, 0, .25, 0, { m: .5 }); g.add(G.mesh(T.fabric({ c, c2, pattern: 'stripe' }), { side: true }), M.mesh(T.metal({ c: '#8a90a8' })));
    const k = who.scale.y || 1; g.position.set(.2, who.userData.height / k + .1, .12); who.add(g); who.userData.umb = g; return who; };
  N.umbPose = w => { const J = w.userData.J; J.armR.rotation.set(-1.25, 0, .25); J.foreR.rotation.x = -1.2; };
  // 町の人（i で見た目が変わる）。o で上書き
  const HS = ['short', 'bob', 'long', 'bun', 'tufts', 'tail', 'short', 'spiky'], TOPS = ['#e8e4f4', '#3f5a8a', '#c8452e', '#2f7a8a', '#e8c84a', '#7a5ab0', '#f0f0e8', '#5a8a4a', '#d87a9a', '#4a4a5a'], BOTS = ['#2f3450', '#3a3a5a', '#4a5a94', '#5a4a3a', '#2a2a34', '#7a6a5a'], HAIR = ['#2a2a34', '#3a2a24', '#5a3a2a', '#8a8a94', '#1e1e28'], CLOTH = ['tunic', 'jacket', 'coat', 'tunic', 'jacket'];
  N.extra = (i, o = {}) => { const r = k => hash(i, k, 77), f = r(1) > .5, hs = HS[Math.floor(r(2) * 8)];
    return { sex: f ? 'f' : 'm', hairStyle: f && hs === 'spiky' ? 'bob' : hs, hair: HAIR[Math.floor(r(3) * 5)], eyes: ['big', 'half', 'round', 'big'][Math.floor(r(4) * 4)], cloth: CLOTH[Math.floor(r(5) * 5)], top: TOPS[Math.floor(r(6) * 10)], top2: TOPS[Math.floor(r(7) * 10)], bottom: BOTS[Math.floor(r(8) * 6)],
      lower: f && r(9) > .5 ? 'skirt' : 'pants', skirt: .75, skirtC: BOTS[Math.floor(r(10) * 6)], shoes: r(11) > .5 ? 'shoe' : 'boot', shoe: '#2a2a3a', back: r(12) > .8 ? 'bag' : undefined, s: .9 + r(13) * .12, ...o }; };
  return N;
};
