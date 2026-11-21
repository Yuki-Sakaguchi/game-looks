// テイスト B の人（R.actor / R.person）の動きの部品集。retro.js のあとに読み、 const MO = RETRO_MOTIONS(THREE, R)  として使う。
// 動きを見て確かめるページは retro-actor-lab.html（「キャラクターの調整室」）。ゲームを作るときは、ここに動きを足していく。
//
// ■ 使い方
//   MO.play(人, 'walk', t)            毎コマ呼ぶ。t は秒。人の関節（人.userData.J）の向きと、腰の高さだけを書きかえる（人.position や人.rotation はさわらない）
//   MO.play(人, 'walk', t, { speed: 1.2, amp: 1 })   speed = 動きの速さの倍率、amp = 動きの大きさの倍率
//   MO.list                           [{ id, name, loop }, …]  loop はひとめぐりの秒数（0 は「決まった長さがない」）
//   MO.reset(人)                      まっすぐ立った形にもどす
//   MO.add(id, name, loop, (人, t, J, D, amp) => { … })   動きを足す。J = 関節、D = 体つきの数（thigh, shin など。R.person では空）
//
// ■ 関節の向きの決まり（人は +z が正面。L は +x がわ、R は −x がわ）
//   legL / legR .rotation.x   マイナスで足が前へ、プラスでうしろへ
//   shinL / shinR .rotation.x プラスでひざが曲がる
//   armL / armR .rotation.x   マイナスでうでが前へ（−3 ほどで真上）、プラスでうしろへ
//   armL .rotation.z          プラスで横へ開く（armR はマイナスで開く）
//   foreL / foreR .rotation.x マイナスでひじが曲がる
//   torso / head .rotation    x プラスで前へたおす、y で左右を向く
//   hips.position.y           腰の高さ（立ったときは 人.userData.hipY）
window.RETRO_MOTIONS = (THREE, R) => {
  const S = Math.sin, C = Math.cos, PI = Math.PI, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = k => k * k * (3 - 2 * k), saw = (t, len) => ((t % len) + len) % len / len;
  const NAMES = ['hips', 'torso', 'head', 'armL', 'armR', 'foreL', 'foreR', 'legL', 'legR', 'shinL', 'shinR'];
  const legLen = g => { const D = g.userData.build || {}; return D.thigh && D.shin ? D.thigh + D.shin : g.userData.hipY * .88; };
  function reset(g) { const J = g.userData.J; for (const n of NAMES) if (J[n]) J[n].rotation.set(0, 0, 0); J.hips.position.y = g.userData.hipY; J.armL.rotation.z = .07; J.armR.rotation.z = -.07; J.foreL.rotation.x = J.foreR.rotation.x = -.14; if (J.cape) J.cape.rotation.x = -.05; }
  // ひざを a だけ曲げてしゃがむ（足のうらが地面からずれないよう、ももを前へ a、すねをうしろへ 2a）
  function squat(g, a) { const J = g.userData.J; J.legL.rotation.x = J.legR.rotation.x = -a; J.shinL.rotation.x = J.shinR.rotation.x = 2 * a; J.hips.position.y = g.userData.hipY - legLen(g) * (1 - C(a)); }
  const M = {}, list = [];
  const add = (id, name, loop, fn) => { if (!M[id]) list.push({ id, name, loop }); M[id] = fn; };

  add('stand', '立つ', 0, (g, t) => R.idle(g, t));
  add('look', '見まわす', 6, (g, t, J) => { R.idle(g, t, S(t * PI / 3) * .95); J.head.rotation.x = S(t * PI / 1.5) * .22 - .05; J.torso.rotation.y = S(t * PI / 3) * .25; });
  add('walk', '歩く', 0, (g, t, J, D, amp) => R.walk(g, t * 7, amp));
  add('run', '走る', 0, (g, t, J, D, amp) => { const ph = t * 11; R.walk(g, ph, 1.45 * amp); J.torso.rotation.x = .26; J.head.rotation.x = -.16; J.foreL.rotation.x = -1.25; J.foreR.rotation.x = -1.25; J.hips.position.y = g.userData.hipY + Math.abs(S(ph)) * legLen(g) * .07 - legLen(g) * .03; if (J.cape) J.cape.rotation.x = -.7 + S(ph * 2) * .12; });
  add('carry', 'かかえて歩く', 0, (g, t, J, D, amp) => { R.walk(g, t * 6, .85 * amp); J.armL.rotation.set(-.85, 0, -.12); J.armR.rotation.set(-.85, 0, .12); J.foreL.rotation.x = J.foreR.rotation.x = -1.05; J.torso.rotation.set(-.06, 0, 0); });
  add('push', '押す', 0, (g, t, J, D, amp) => { R.walk(g, t * 4.5, .8 * amp); J.torso.rotation.set(.5, 0, 0); J.head.rotation.x = -.35; J.armL.rotation.set(-1.75, 0, .05); J.armR.rotation.set(-1.75, 0, -.05); J.foreL.rotation.x = J.foreR.rotation.x = -.25; });
  add('jump', 'ジャンプ', 1.3, (g, t, J, D, amp) => { reset(g); const k = saw(t, 1.3), L = legLen(g);
    if (k < .24) { const a = ease(k / .24) * .85; squat(g, a); J.torso.rotation.x = a * .45; J.armL.rotation.x = J.armR.rotation.x = a * .9; }                        // しゃがんでためる
    else if (k < .8) { const u = (k - .24) / .56, y = 4 * u * (1 - u) * L * .95 * amp, a = .25 + S(u * PI) * .45; squat(g, a); J.hips.position.y += L * (1 - C(a)) + y;   // 空中（足を少したたむ）
      J.armL.rotation.set(-2.5 + u * 1.4, 0, .25); J.armR.rotation.set(-2.5 + u * 1.4, 0, -.25); J.foreL.rotation.x = J.foreR.rotation.x = -.3; J.torso.rotation.x = -.08; if (J.cape) J.cape.rotation.x = -.5 + u * .9; }
    else { const a = (1 - ease((k - .8) / .2)) * .7; squat(g, a); J.torso.rotation.x = a * .4; J.armL.rotation.x = J.armR.rotation.x = -a * .5; } });                   // 着地
  add('crouch', 'しゃがむ', 0, (g, t, J) => { reset(g); squat(g, 1.02 + S(t * 1.8) * .03); J.torso.rotation.x = .38; J.head.rotation.set(-.3, S(t * .8) * .35, 0); J.armL.rotation.set(-.55, 0, .12); J.armR.rotation.set(-.55, 0, -.12); J.foreL.rotation.x = J.foreR.rotation.x = -1.1; if (J.cape) J.cape.rotation.x = -.5; });
  add('sit', 'すわる', 0, (g, t, J, D) => { reset(g); const br = S(t * 2.1), th = (D && D.thigh) || legLen(g) * .5; J.legL.rotation.x = J.legR.rotation.x = -1.48; J.shinL.rotation.x = J.shinR.rotation.x = 1.48; J.hips.position.y = g.userData.hipY - th;   // いすの高さは「すねの長さ」。ももが水平になる
    J.torso.rotation.x = -.05 + br * .01; J.armL.rotation.set(-.62, 0, .05); J.armR.rotation.set(-.62, 0, -.05); J.foreL.rotation.x = J.foreR.rotation.x = -.62; J.head.rotation.set(S(t * .7) * .05, S(t * .45) * .3, 0); if (J.cape) J.cape.rotation.x = -.3; });
  add('wave', '手をふる', 0, (g, t, J) => { R.idle(g, t, .12); J.armR.rotation.set(0, 0, -2.55 + S(t * 9) * .16); J.foreR.rotation.set(-.2, 0, S(t * 9) * .55); J.torso.rotation.z = .05; });
  add('cheer', 'よろこぶ', 0, (g, t, J, D, amp) => { reset(g); const b = Math.abs(S(t * 6)), a = (1 - b) * .35; squat(g, a); J.hips.position.y += b * legLen(g) * .16 * amp; J.armL.rotation.set(-2.85, 0, .32 + S(t * 12) * .1); J.armR.rotation.set(-2.85, 0, -.32 - S(t * 12) * .1); J.foreL.rotation.x = J.foreR.rotation.x = -.25 - b * .3; J.head.rotation.x = -.25; if (J.cape) J.cape.rotation.x = -.2 - b * .3; });
  add('swing', 'ふりおろす', 1.1, (g, t, J) => { reset(g); const k = saw(t, 1.1), up = k < .45 ? ease(k / .45) : k < .6 ? 1 - ease((k - .45) / .15) * 1.25 : -.25 + ease((k - .6) / .4) * .25;   // 0→1 でふりかぶり、すばやく −.25 までふりおろし、もどす
    J.armR.rotation.set(-.5 - up * 2.3, 0, -.12); J.foreR.rotation.x = -.35 - Math.max(0, up) * .7; J.armL.rotation.set(.25 - up * .5, 0, .2); J.foreL.rotation.x = -.6;
    J.torso.rotation.set(.12 - up * .22, up * .4 - .1, 0); J.head.rotation.y = -up * .25; J.legL.rotation.x = -.42; J.shinL.rotation.x = .38; J.legR.rotation.x = .3; J.shinR.rotation.x = .12; J.hips.position.y = g.userData.hipY - legLen(g) * .05; if (J.cape) J.cape.rotation.x = -.25 - up * .2; });
  add('bow', 'おじぎ', 2.6, (g, t, J) => { reset(g); const k = saw(t, 2.6), a = k < .3 ? ease(k / .3) : k < .6 ? 1 : 1 - ease((k - .6) / .4); J.torso.rotation.x = a * .78; J.head.rotation.x = a * .25; J.armL.rotation.set(-a * .12, 0, .05); J.armR.rotation.set(-a * .12, 0, -.05); J.legL.rotation.x = J.legR.rotation.x = a * .06; if (J.cape) J.cape.rotation.x = -.05 + a * .5; });

  function play(g, id, t, o = {}) { const f = M[id] || M.stand; f(g, t * (o.speed ?? 1), g.userData.J, g.userData.build || {}, o.amp ?? 1); }
  return { play, list, reset, add, squat, legLen };
};
