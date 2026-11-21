---
name: look-retro-crt
description: このリポジトリのテイスト B「描きこんだテクスチャとブラウン管」（game-looks-7 の 11〜20、部品集 retro.js）で、新しい場面やゲームの絵を作る・直すときに使う。「ドット絵のテクスチャのほうで」「ブラウン管で」「昔の 3D ゲーム機っぽく」「第 7 集の 11 みたいな感じで」「retro.js で」と頼まれたとき、または新しいドット絵のテクスチャを描くときに読む。
---

# テイスト B「描きこんだテクスチャとブラウン管」で作る

面の数は少ないまま、表面にドット絵のテクスチャをしっかり描き、低い解像度とブラウン管のにじみでやわらかく見せるテイストです。初期〜2 代めの家庭用 3D ゲーム機の絵が手本です。持ち主が「めっちゃ良い感じ」と言った第 7 集の 11〜20 を、同じ質で再現するための手順です。

商品名や既存のゲームの名前は、ページにもコメントにも書きません（「初期の家庭用 3D ゲーム機ふう」のように書く）。

## 最初に読む物

1. `docs/taste.md` ─ 持ち主の好みと、外れた例。
2. `game-looks-7/retro.js` の先頭のコメント ─ テクスチャと部品の一覧と引数。ここが正本です。ファイルは大きいので、先頭のコメントと、使う関数の所だけ読めば足ります。
3. `game-looks-7/11-plaza-town-rpg.html` ─ 見本。書き方と密度をこれに合わせる。
4. 絵を 1 回見る:
   - 見本: `node tools/cap.mjs check game-looks-7/11-plaza-town-rpg.html` → `tools/out/11-plaza-town-rpg-sheet.jpg`
   - テクスチャの一覧: `node tools/cap.mjs check "game-looks-7/retro-sheet.html?p=tex"` → `tools/out/retro-sheet_p_tex-wide.png`（`&i=0`〜`5` で 1 組ずつ）

## このテイストの決まり

- **細部はテクスチャが受け持つ**。形は少ない面（人で 300〜700 三角形）。ただし立方体の組み合わせではなく、先細りの手足、傾いた屋根、ふくらんだ胴など、少ない面で形の特徴を出す。
- **テクスチャは「手で打ったドット絵」**。32〜64 ドット、にじませない（NearestFilter）、1 枚 6〜12 色。明るい面・影・ふちのハイライト・目地のかげ・ところどころの欠けやしみを打つ。乱数の点々や、単色に線 1 本ではだめ。
- **単色の面を置かない**。物の表面には必ず `R.tex.*` のテクスチャをはる。`THREE.BoxGeometry` に色をぬっただけの物は置かない。
- **仕上げは必ず `R.crt()`**。横 320 ドットほどの粗い絵に描き（頂点はドットに丸めるのでふるえる）、色数を落としてディザにかけ、ブラウン管に映す。
- **ブラウン管は強くしすぎない**。目的は「ドットと面の粗さが、ほどよくとけて、やわらかく見える」こと。既定の強さから大きく上げない。汚し・ざらつき・ゆがみで中の世界が見づらくなったら失敗（`noise` は 0 でよい）。

## ページの形

```html
<!doctype html>
<html lang="ja">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>7-21 ジャンル ルック</title>
<style>
html,body{margin:0;height:100%;background:#0c0c10;overflow:hidden}
canvas{display:block}
#cap{position:fixed;left:12px;bottom:10px;font:12px/1.5 ui-monospace,Menlo,monospace;color:#d8d0c0;opacity:.8}
</style>
<div id="cap">7-21 ─ ジャンル / 描きこんだテクスチャと、ブラウン管　｜　見るだけ（自動で歩く）</div>
<script src="kit.js"></script>
<script src="retro.js"></script>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
<script type="module">
// どんな絵の決まりで描いているかを 2〜3 行で
import * as THREE from 'three';
const K = KIT(THREE), R = RETRO(THREE, K), T = R.tex;
const { scene, cam, renderer, onResize } = K.stage({ fov: 44, far: 900, aa: false, fitAspect: .9, maxFov: 74 });
scene.add(R.skyDome([[0, '#2e3474'], [.6, '#a8709c'], [1, '#ffe2a0']], { r: 380 })); scene.fog = new THREE.Fog('#e6a784', 36, 170);
const { sun } = K.lights(scene, renderer, { sun: 0xffc890, range: 30 });              // 光は K.lights。あかりは PointLight を少数
const land = R.ground({ w: 140, d: 100, cell: 2, layers: [T.cobble(), T.grass()], mix: (x, z) => [Math.abs(z) > 6 ? 1 : 0, 0] }); scene.add(land.mesh);
const home = R.house({ wall: T.plaster({ frame: 'cross' }), roof: T.roof(), lit: 1 }); home.position.set(9, 0, -8);
scene.add(R.merge([home]));                                                           // 動かない物は R.merge でまとめる
const hero = R.actor({ build: 'toon', hairStyle: 'spiky', cloth: 'tunic', top: '#3f72b0', neck: 'cape' }); scene.add(hero);   // 人は 5 頭身の toon
const crt = R.crt(renderer, { noise: 0 }); onResize(crt.resize);
K.loop((dt, t) => {
  const x = t * 1.6; hero.position.set(x, 0, 0); hero.rotation.y = Math.PI / 2; R.walk(hero, t * 8);
  sun.position.set(x - 30, 40, 20); sun.target.position.set(x, 0, 0);
  land.follow(x, 0); cam.position.set(x - 3.8, 2.2, 2.2); cam.lookAt(x + 2, 1.1, -.4);                    // うしろから追う。主役は画面の高さの 1/5 以上に
  crt.render(scene, cam, t);                                                          // renderer.render ではなく、こちらを呼ぶ
});
</script>
</html>
```

第 7 集の外（`games/` など）に置くときは、`<script src="../game-looks-7/kit.js">` のように読みます。部品集は写さず、同じ 1 つを使います。

## 部品の入口

くわしい引数は `retro.js` の先頭にあります。形は `game-looks-7/retro-sheet.html?p=parts&i=0`〜`2`（`&raw=1` でブラウン管なし）で確かめられます。

| ほしい物 | 使う物 |
|---|---|
| 地面のテクスチャ | `T.grass` `T.dirt` `T.sand` `T.snow` `T.cobble` `T.brickFloor` `T.planks` `T.road` `T.water`（コマの並び。`R.flip` で送る） |
| かべ・屋根 | `T.brick` `T.stone` `T.plaster` `T.boards` `T.concrete` `T.shutter` `T.window` `T.windowWall` `T.door` ／ `T.roof` `T.shingle` `T.thatch` |
| 自然 | `T.bark` `T.leaves` `T.tuft` `T.rock` `T.hills` `T.cloud` |
| 小物の柄 | `T.crate` `T.barrel` `T.sign` `T.roadSign` `T.fabric` `T.fence` `T.metal` `T.lamp` `T.goods` `T.wheel` |
| 色ちがい | どのテクスチャも `{ c: '#rrggbb', seed, m }`。1 色わたすと、影は青むらさき寄り・光は黄寄りの 6 段を自動で作る |
| 地面 | `R.ground({ layers: [3 枚まで], mix, shade, H })`、`R.strip`（道・川の帯）、`R.blob`（足もとの影） |
| 空・遠景 | `R.skyDome` `R.backdrop`（遠くの山なみ） `R.cloud` |
| 家 | `R.house({ wall, roof, roofKind, door, win, lit, chimney, sign, awning … })` |
| 木・小物 | `R.tree` `R.rock` `R.tuft` `R.barrel` `R.crate` `R.lamp` `R.fence` `R.fountain` `R.well` `R.stall` `R.bench` `R.roadSign` |
| 人（新しい作り） | `R.actor({ build, sex, hairStyle, eyes, cloth, lower, gloves, shoes, shoulder, neck, back, hat, hold, 色… })` と `R.walk` `R.idle`。手とくつが大きく、角ばった手足、とがったかみの束、平たい顔に大きな目。**新しい場面の人はこれで作る** |
| 人の体つき（等身） | `R.actor({ build })`。`heroic`（7 頭身。肩が広く足が長い）`toon`（5 頭身。ひじから先・ひざから下が太い）`chibi`（3 頭身）。場面の全員をそろえるなら、人を作る前に `R.cfg.actorBuild = 'toon'` |
| 見本の人物 | `R.CAST`（10 人。`{ id, name, role, o }`）。`R.actor('gald')` のように id で作れる。`R.actor({ ...R.CAST[0].o, top: '#…' })` で色や部品だけ変えてもよい。見くらべは `game-looks-7/retro-people.html`（`?who=番号&rot=角度&raw=1`） |
| 人（これまでの作り） | `R.person({ … })`。4 頭身で、持ち主に「等身がイメージと違う」と言われた古い作り。**新しい場面では使わない**。`11-plaza-town-rpg.html?cast=old` と `retro-people.html?old=1` に、見くらべ用として残してある |
| 動物 | `R.cat` と `R.catPose`、`R.bird` と `R.birdPose` |
| 乗りもの | `R.cart` `R.car` `R.boat` |
| 材質 | `R.mat(テクスチャか色, { cut, glow, side … })`（頂点のふるえつき） |
| 仕上げ | `R.crt(renderer, { width: 320, scan: .3, bloom: .35, curve: .05, noise … })` |
| 新しい形 | `R.geo()` に `quad` `tri` `box` `loft`（輪をつないだ筒）を足して `g.mesh(テクスチャ)` |
| 新しいテクスチャ | `const P = R.Px(64)` に `P.set` `P.rect` `P.line` `P.disc` で打ち、`R.tex.from(P, { m, cut })`。`R.paint.名前(o)` の上から描き足してもよい |

## 題材ごとの追加の部品（第 8 集の pack）

中世の町いがいの題材は、`game-looks-8/` の pack を読みこんで使います（`retro.js` のあとに `<script src="../game-looks-8/pack-xxx.js">`。第 8 集の中なら `pack-xxx.js`）。使い方は各ファイルの先頭のコメント、見た目は `pack-xxx-sheet.html`、書き方は見本の場面にあります。

| pack | 中身 | 見本の場面 |
|---|---|---|
| `pack-fantasy-town.js`（`PACK_FTOWN`） | 城・塔・門・旗、風車、ドームと尖塔、東方風の屋根と門、樹上の小屋とつり橋、運河、飛空艇・帆船・ゴンドラ、室内。人の小物を付ける `F.wear`（むぎわら帽子・エプロン・つえ・ランタン・かご） | `game-looks-8/01`〜`11` |
| `pack-fantasy-wild.js`（`PACK_FWILD`） | 洞くつ、浮島、滝、溶岩、氷、沼、水晶、巨大きのこ、骨、宝、鉱山、ダンジョン、竜などの生きもの、光の粒・オーロラ・星空 | `12`〜`22` |
| `pack-ruins.js`（`PACK_RUINS`） | くずれたビル・高架・柱・工場・校舎・灯台、ひびわれた道、つたとこけ、止まった車や電車、しか・鳥・ちょう、光のすじ | `23`〜`30` |
| `pack-sea.js`（`PACK_SEA`） | 水の中の見え方、さんご・海草、魚の群れなどの生きもの、ダイバー、沈んだ船、上から見る海面と、水にしずめた物の見せ方 | `31`〜`43` |
| `pack-city.js`（`PACK_CITY`） | 鉄板の天井と支柱、つぎはぎの家と店、配管、ネオン・裸電球、屋台、電車、蒸気・雨・ぬれた路面 | `44`〜`50` |

- 動く物のある pack は、毎コマの呼び出しが要る（`F.tick(t)`、`C.update(t, cam)`、海は `env.tick` と `bed.tick`）。忘れると、ゆれ・あかり・泡が止まる。
- 海に浮かぶ廃墟（`38`〜`43`）は `pack-ruins.js` と `pack-sea.js` を両方使う。浅い所で下の道を見せるなら、海面の `alpha` は .56 ほど、下の地面は水面の 2 m 下、`S.sink` の `depth` は 3 ほど。
- 廃墟・海の底・下町は、こわくしない・暗くしない（光がさし、草や花や人のくらしがある）。
- 新しい場面は、第 8 集に続きの番号で足す。

## ダークな雰囲気で作るとき（第 9 集の pack-dark.js）

持ち主は第 8 集（明るく、こわくない）を「全てとても良かった」と言ったうえで、「もう少しダークな雰囲気」も頼みました（`docs/taste.md`）。それで作ったのが第 9 集（`game-looks-9/`）です。暗い場面は、`game-looks-9/pack-dark.js`（`PACK_DARK`）を読みこんで作ります。

- **暗さの基準は見本の 2 場面**: `game-looks-9/01-cursed-castle-gate.html`（嵐）と `02-moonlit-graveyard-chapel.html`（月夜）。これより黒くつぶさない。昼の絵にもしない。
- **まず `D.mood(scene, renderer, 種類, o)` で光と空を用意する**。種類は `storm` `moon` `fog` `ember` `blood` `abyss` `blackout` `ash`。地面は `R.ground` の `shade` に `mood.shade(あかりの一覧)` を入れて、あかりの輪を焼きこむ。毎コマ `D.tick(t, cam)`。場面に合わせて `D.MOODS` の値を引数で上書きする（`ember` と `ash` は空が明るめ）。
- **暗い所と、あかりの当たる所の差で見せる**。主役にはあかりを 1 つ持たせる（`D.lantern(人)`。懐中電灯は部品集に無く、`15`・`20` などがページの中の `torch()` で作っている）。主役の服には、暗い背景でうもれない色を 1 つ入れる。石や鉄は黒にせず、青むらさき寄りの暗い色にする。
- **水の中は `pack-sea.js` の `S.underwater`（`depth: 'deep'` など）が光を用意する**ので、`D.mood` と二重にしない（`25`〜`32`）。
- **こわさは「不気味・さびしい・重い」まで**。血、残こくな物、人が傷つく様子、追われる・つかまる場面は入れない。おばけや怪物は、遠くの影・光る目・うすく光る姿くらいにする（`D.ghost`、`D.loomer`、`D.wisp`）。
- ほかに: いなずま `D.lightning`、雨 `D.rain`、地をはう霧 `D.groundFog`、灰・火の粉・雪 `D.flakes`、月 `D.moon`、墓石・像・枯れ木・礼拝堂、からす・こうもり・ふくろう・黒ねこ。くわしくは `pack-dark.js` の先頭のコメントと、`pack-dark-sheet.html`。

## 新しいテクスチャを描くとき

1. まず色を決める。もとの色 1 つから `R.ramp` で 6 段（影は青むらさき寄り、光は黄寄り）を作る。むやみに色を増やさない。
2. 大きな形から打つ（れんがなら目地の格子 → 1 個ごとの色ちがい → 上のふちのハイライトと下の影 → 欠け・しみを少し）。
3. くり返してつなぎ目が見えないこと（左右・上下のはしがつながる）。
4. 1 m ≒ 21 ドット（64 ドットで 3 m）が既定。主役の位置で画面の 1 ドットは 3 cm ほどなので、それより細かく描いても見えない。
5. `retro-sheet.html?p=tex` で大きく見て、手で打ったドット絵として気持ちよいか確かめる。

## 人を作るとき

人の見た目と動きは、`game-looks-7/retro-actor-lab.html`（キャラクターの調整室）で確かめます。4 つの向き、顔のアップ、1 人を回す、全員ならべ、場面の中の大きさを切りかえられ、ブラウン管あり・なし、体つき、動きもボタンで変えられます。引数でも決められます（例 `?who=4&view=face&raw=1`、`?who=7&view=turn&rot=40&motion=jump`）。顔や体の作りを直したら、ここで正面・横・うしろを見てから場面で確かめます。

顔のつくりは調整中です。持ち主は、これまでの顔（あごが広く正面が平ら）を「丼みたい」と言い、あごがシャープな漫画の輪郭と、大きめのかわいい目をもとめています（`docs/taste.md`）。新しい形は `R.cfg.face = 'manga'`（人を作る前に入れる）で出ます。既定はまだ `'bowl'`（これまでの形）で、持ち主が決めたら `retro.js` の `cfg` の既定を変えます。場面で試すなら `11-plaza-town-rpg.html?face=manga`。

動きは `game-looks-7/retro-motions.js` にあります（`const MO = RETRO_MOTIONS(THREE, R); MO.play(人, 'run', t)`）。立つ・見まわす・歩く・走る・かかえて歩く・押す・ジャンプ・しゃがむ・すわる・手をふる・よろこぶ・ふりおろす・おじぎ。ゲームで動きが要るときは、`MO.add` でここに足します（関節の向きの決まりは、ファイルの先頭のコメント）。

持ち主は、これまでの人（`R.person`、4 頭身）を「等身がイメージと違う。もう少し頭を小さく」と言い、そのあと初期の家庭用 3D ゲーム機の時代の人物のイメージ画像を貼りました（`docs/taste.md` の「テイスト B の人について」）。それに合わせた作りが `R.actor` です。

- **人は `R.actor` の `toon`（5 頭身）で作る**。持ち主がえらんだ体つきで、11〜20 の場面は全員これになっている。`heroic`（7 頭身）と `chibi`（3 頭身）は、たのまれたときだけ使う（`11-plaza-town-rpg.html?cast=heroic`、`?cast=chibi` で見くらべられる）。1 つの場面の中で体つきをまぜない。子どもは `s` を小さくする。
- **カメラは人に寄せる**。`toon` は身長 1.4 m ほど。うしろから追うなら、距離 5 m・高さ 2.4 m・注視の高さ 1.05 m くらい（たて長は距離 3.9 m）で、主役が画面の高さの 1/3 ほどになる。
- **うでは少し外へ開いて付いている**。手を合わせる、物をさげる、荷車を引く、かいをにぎるなどの姿勢は、うでの関節の回転を足して内へ寄せ、横からの絵で手の位置を確かめる。
- **部品集に無い物**: むぎわら帽子（14・15・16・19・20 がページの中で作って頭の関節に付けている）、エプロン、かざりのない つえ。売り手は屋台の台にかくれるので、台の上に立たせる（18）。
- **シルエットと色で別人にする**。かみ型（`spiky` `tufts` `long` `short` `tail` `twin` `bob` `bun` `bald`）、帽子、肩当て、持ち物、上と下の服の色の組で、ひと目で見分けがつくように。まず `R.CAST` の人物を使い、足りなければ引数を変えて足す。
- **既存の作品の人物に似せない**。かみ型・服・色・持ち物の組み合わせが、特定の人物と分かる物にならないようにする。
- **顔は粗く打ってある**（頭のテクスチャは 64×24 ドットを 2 倍）。主役が画面の高さの 1/3 ほどでも、目が 2 つの点として読めるようにするため。細かい線を顔に足しても、小さくなるとつぶれてざらつくだけ。
- **人のテクスチャは、縮小版（ミップ）を自前で作っている**（2×2 ドットで多い色を残す）。ふつうの平均だと輪郭線と目がとけるため。`R.tex.actor` を自分で材質にはるときは、この効果はない（`R.actor` の中の `actorTex` が受け持つ）。
- 形や絵を直したら、`retro-people.html?who=番号&raw=1&rot=0`（`90`、`180`）で前・横・うしろを見てから、ブラウン管ごし（`raw` なし）と場面の中で見る。`&tex=1` でテクスチャ 1 枚が右に出る。
- 三角形は、装備の少ない人で 600 ほど、よろい・マント・やりを全部つけると 700 ほど。人数の多い場面では装備を減らす。

## はまりやすい所

- **`renderer.render` ではなく `crt.render(scene, cam, t)`** を呼ぶ。`onResize(crt.resize)` も忘れない。
- **動かない物は `R.merge([…])` でまとめる**。人は 1 人で Mesh 11〜13 個あるので、多人数の場面は人数に注意。
- **大きな 1 枚の面を置かない**。頂点をドットに丸めるので、大きな面はたて長の画面で形がくずれる。海や広い地面は細かく割る（`R.ground` は割ってある）。
- **サムネイルが大きくなりやすい**。走査線と細かい模様が動くため。`tools/cap.mjs gif` は 600 KB をこえると色数を自動で減らす。それでも大きいときは、カメラの動きをゆっくりにする。
- **暗い場面でも、中が見えること**。夜は空を紺にして、窓や街灯のあかり（`lit`、`R.lamp` の `light`）で地面を照らす。
- **霧のかたまりを板で置かない**。四角い板がそのまま見える。霧は `scene.fog` と `R.backdrop` の `haze` で出す。
- **`R.cfg.filter = 'nearest'`** は、テクスチャを作る前に入れる（遠くもドットのままにしたいとき）。

## 作る手順

1. **場面を決める**。主役、場所、時間と天気、カメラ。`docs/taste.md` の「共通の土台」に合うこと。地面・かべ・屋根に使うテクスチャと、その色を先に決める。
2. **ページを書く**。見本と同じ形で 90〜110 行。主役は開いて 2.5 秒の時点で、いちばん見せたい絵の中にいること。
3. **確かめる**。`node tools/cap.mjs check game-looks-7/番号-名前.html`。エラー 0 を確かめ、`tools/out/番号-名前-sheet.jpg` を必ず自分の目で見る。
4. **下の点検表で見て、直す**。2〜4 回くり返す。
5. **サムネイルを作る**。`node tools/cap.mjs gif game-looks-7/番号-名前.html game-looks-7/thumbs/番号.gif`
6. **一覧に足す**。`game-looks-7/index.html` の `LOOKS` に 1 行、見出しと説明の数、トップの `index.html` と `README.md` の表の数を直す（README の「足すときにやること」）。

## 絵の点検表

- [ ] どの面にもテクスチャがあり、単色の箱が置かれていない。
- [ ] テクスチャの目地・木目・かわらが、ブラウン管ごしに「とけて、ゆたかに」見える（つぶれて灰色のかたまりになっていない）。
- [ ] 人が、顔と服のテクスチャで人と分かる。主役が画面の高さの 1/5 以上ある。たて長でも切れていない。
- [ ] 止め絵 1 枚で、何をする場面か分かる。
- [ ] 色がまとまっている（地面・かべ・屋根・空で 4〜5 つの色の組）。こわくない。
- [ ] ブラウン管が強すぎない。左下の説明の文字が読め、中の世界が見やすい。
- [ ] 主役のほかに、動く物が 2 つ以上ある（町の人、ねこ、鳥、水、けむり）。
- [ ] 見本 `game-looks-7/11` とならべて、見劣りしない。

確かめていないこと（実機での速さ、場面の後半）は、確かめたと書かないこと。
