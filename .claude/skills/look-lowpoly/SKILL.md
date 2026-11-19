---
name: look-lowpoly
description: このリポジトリのテイスト A「こまかいローポリ」（game-looks-7 の 01〜10、部品集 model.js）で、新しい場面やゲームの絵を作る・直すときに使う。「ローポリのほうで」「こまかいローポリで」「第 7 集の 01 みたいな感じで」「model.js で」と頼まれたとき、または箱っぽくなったローポリを直すときに読む。
---

# テイスト A「こまかいローポリ」で作る

面を増やして形を作りこんだローポリを、やわらかい光で見せるテイストです。持ち主が「めっちゃ良い感じ」と言った第 7 集の 01〜10 を、同じ質で再現するための手順です。

## 最初に読む物

1. `docs/taste.md` ─ 持ち主の好みと、外れた例。
2. `game-looks-7/model.js` の先頭のコメント ─ 部品の一覧と引数。ここが正本です（この文書の表は入口だけ）。
3. `game-looks-7/01-hill-village-walk.html` ─ 見本。書き方と密度をこれに合わせる。
4. 見本の絵を 1 回見る: `node tools/cap.mjs check game-looks-7/01-hill-village-walk.html` → `tools/out/01-hill-village-walk-sheet.jpg`

## このテイストの決まり

- **箱を使わない**。人・家・木・乗りもの・動物は、必ず `model.js` の物を使う。`THREE.BoxGeometry` をそのまま物の形にしない。新しく作る物も、下の「形を作る道具」で箱に見えない形にする。
- **面はカクカクのまま**（flatShading）。つるつるの高精細にはしない。ただしシルエットだけで人・木・家と分かること。
- **色は頂点の色でぬる**。テクスチャははらない。下が少し暗く上が少し明るい、面ごとにわずかにちがう（`P()` の `grad` と `jit`）。
- **光は `M.look()` の 1 回だけ**。やわらかい影、空の色のまわりこみ、ふちの光がまとめて入る。画面加工（post）はかけない。
- **近くで見ても部品が見つかる**。窓のさん、えり、かみの毛の束、のき、えんとつ、取っ手。

## ページの形

```html
<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>7-21 ジャンル ルック</title>
<style>
html,body{margin:0;height:100%;background:#f4efe2;overflow:hidden}
canvas{display:block}
#cap{position:fixed;left:12px;bottom:10px;font:12px/1.5 ui-monospace,Menlo,monospace;color:#5a4a3a;background:#f4efe2;padding:0 6px}
</style>
<div id="cap">7-21 ─ ジャンル / ルック　｜　見るだけ（自動で歩く）</div>
<script src="kit.js"></script>
<script src="model.js"></script>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
<script type="module">
// どんな絵の決まりで描いているかを 2〜3 行で
import * as THREE from 'three';
const K = KIT(THREE), M = MODEL(THREE, K), { scene, cam, renderer } = K.stage({ fov: 40 });
const L = M.look(scene, renderer, 'evening', { range: 26 });       // 光と空と霧
const H = (x, z) => Math.sin(x * .05) * 1.5;                        // 地面の高さの式
const land = M.ground(H, { paths: [{ d: (x, z) => Math.abs(z), w: 2.2, color: '#d8c49a' }] }); scene.add(land.mesh);
const hero = M.person({ age: 'child', hat: 'straw', pack: '#e8b84a' }); scene.add(hero);
const home = M.house({ floors: 2, roof: 'hip', shutters: '#3a6a8a', lit: L.lit }); home.position.set(12, land.h(12, -7), -7); scene.add(home);
K.loop((dt, t) => {
  const x = t * 1.4; hero.position.set(x, land.h(x, 0), 0); hero.rotation.y = Math.PI / 2;
  M.pose(hero, 'walk', x / hero.userData.rig.stride * Math.PI);      // 足がすべらない位相
  land.follow(x, 0); L.follow(x, land.h(x, 0), 0);
  cam.position.set(x - 4.2, land.h(x, 0) + 2.3, 2.4); cam.lookAt(x + 2, land.h(x, 0) + 1.1, -.4);   // うしろから追う。主役は画面の高さの 1/5 以上に
  renderer.render(scene, cam);
});
</script>
</html>
```

第 7 集の外（`games/` など）に置くときは、`<script src="../game-looks-7/kit.js">` のように読みます。部品集は写さず、同じ 1 つを使います。

## 部品の入口

くわしい引数は `model.js` の先頭にあります。見た目は `game-looks-7/model-sheet.html?s=people`（ほかに `trees` / `houses` / `props` / `animals` / `vehicles`、`&mood=night`）で確かめられます。

| ほしい物 | 使う物 |
|---|---|
| 光・空・霧 | `M.look(scene, renderer, mood)`。mood は `morning` `noon` `evening` `dusk` `night` `mist` |
| 人 | `M.person({ age, hairStyle, legs, hat, pack, scarf, coat … })` と `M.pose(人, 'walk'｜'run'｜'stand'｜'sit'｜'wave'｜'ride'｜'carry', 位相)` |
| 木 | `M.tree`（広葉樹）、`M.conifer`（針葉樹）、`M.bush`。葉の色は `M.LEAF.autumn` など |
| 家 | `M.house({ floors, roof, shutters, flowerBox, awning, lit … })` |
| 小物 | `M.rock` `M.tufts` `M.flowers` `M.fence` `M.lamp` `M.bench` `M.sign` `M.well` `M.bridge` `M.cloud` `M.puffs` |
| 動物 | `M.animal('dog'｜'cat'｜'sheep')` と `M.gait`、`M.bird` と `M.flap` |
| 乗りもの | `M.car` `M.bicycle`（`M.ride` で人を乗せる） `M.boat` `M.train` |
| 地面・水 | `M.ground(H, o)`（`h(x,z)` で物を置く高さ）、`M.ribbon`（道・川）、`M.water` |
| 新しい形 | `M.cbox`（面取りした箱）`M.lathe`（回転体）`M.tube`（先細りの管）`M.blob`（でこぼこの多面体）`M.prism` `M.cyl` `M.cone` `M.gem` → `M.P(形, 色, …)` でぬり、`M.join([…])` で 1 つの Mesh に |

## はまりやすい所

- **`M.P()` は渡した形を書きかえる**。同じ形を 2 度使うなら `geo.clone()`。
- **`M.lathe` の断面は下から上へ書く**。上から下へ書くと面が裏返る。
- **`M.ground` の `shore` には `mask` をつける**。つけないと、水面より低い土地が全部砂色になる。
- **`M.scatter` の色は全部の行に渡す**。一部だけに渡すと、残りが黒くなる。
- **物を置く高さは `land.h(x, z)`**。高さの式 `H` をじかに使うと、三角の面から浮いたり沈んだりする。
- **人は 1 人で 700〜1600 面**（ぼうしやリュックで増える）。10 人をこえる場面は、遠くの人の飾りを減らす。場面全体は 10 万三角形までを目安に。
- **家の窓は見える面だけにつける**（`windows: 'front'` など）。全部の面につけると重い。
- **道が長く続く場面**は、置いた物をまとまりごとに先へ送りなおす（見本 01 の書き方）。

## 作る手順

1. **場面を決める**。主役、場所、時間と天気（mood）、カメラ。`docs/taste.md` の「共通の土台」に合うこと。主な色 2〜3 つと差し色 1 つを先に決める。
2. **ページを書く**。見本と同じ形で 90〜150 行。主役は開いて 2.5 秒の時点で、いちばん見せたい絵の中にいること。
3. **確かめる**。`node tools/cap.mjs check game-looks-7/番号-名前.html`。エラー 0 を確かめ、`tools/out/番号-名前-sheet.jpg` を必ず自分の目で見る。
4. **下の点検表で見て、直す**。2〜4 回くり返す。
5. **サムネイルを作る**。`node tools/cap.mjs gif game-looks-7/番号-名前.html game-looks-7/thumbs/番号.gif`
6. **一覧に足す**。`game-looks-7/index.html` の `LOOKS` に 1 行、見出しと説明の数、トップの `index.html` と `README.md` の表の数を直す（README の「足すときにやること」）。

## 絵の点検表

まとめの絵を見て、1 つずつ確かめます。

- [ ] 人・家・木が、箱の組み合わせに見えない。シルエットだけで何か分かる。
- [ ] 主役が画面の高さの 1/5 以上ある。たて長でも切れていない。
- [ ] 止め絵 1 枚で、何をする場面か分かる（歩く、走る、こぐ、運ぶ）。
- [ ] 色が主な 2〜3 色と差し色 1 つにまとまっている。濁っていない。
- [ ] 時間と天気の空気がある（影の向き、空の色、霧、あかり）。
- [ ] 主役のほかに、動く物が 2 つ以上ある（村人、動物、けむり、舞う物）。
- [ ] 地面が 1 色の板になっていない（道、草のふさ、花、岩、色のむら）。
- [ ] 見本 `game-looks-7/01` とならべて、見劣りしない。

確かめていないこと（実機での速さ、場面の後半）は、確かめたと書かないこと。
