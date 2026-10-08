# ルミナ島のモンスター
オリジナル2Dモンスター収集RPG。16種のモンスター、8属性、4番人、捕獲・育成・進化・図鑑・ボックス・最終ボスを収録。

## プレイ
公開URLは LIVE.md を参照。iPhoneのSafariで開き、最初の仲間を選ぶ。「音 OFF」をタップするとBGMと効果音が有効。音を出すにはブラウザ上の操作が必要。

PCでは矢印/WASD、Space/Enter。iPhoneでは画面の十字キーと「話す/調べる」。HPは診療所で無料回復。紋章を得たら「島の地図」から新エリアの里へ移動できる。

## 開発
外部JS依存なし。dist/ を静的配信する。`npm test`、`npm run check`。
音の再生成：Python NumPyとffmpegで `python3 scripts/generate_audio.py`。画像はImageGenから作成したオリジナル。
セーブはこの端末のlocalStorage。JSONで移行可能。進行状況と未検証項目は DEVELOPMENT.md。
