# 属性スキル演出 2026-10-01

## 参照
- Blizzard公式「Diablo IV Quarterly Update—December 2021」 https://news.blizzard.com/en-us/article/23746639/diablo-iv-quarterly-updatedecember-2021
  武器の動きと攻撃領域/エフェクトの同期、攻撃方向に沿う命中表現、強弱の読み分けを参考にした。動画を視聴したという意味ではなく公式説明文の調査。
- Grinding Gear Games公式「New and Changed Skill Gems in Path of Exile: Expedition」 https://www.pathofexile.com/forum/view-thread/3147751
  Vaal Ground Slamの地面への打撃から波が広がる設計を、炎の着地衝撃の着想に用いた。本作は剣技であり、元ゲームの武器条件や数値を移植していない。

## 実装
- 雷光突き：予備発光、白い芯の直線、分岐放電、命中点からの放射。
- 氷牙薙ぎ：低い楕円の弧、結晶、足元の冷気の輪、破片。
- 焔の飛び込み：刀の降下方向の炎、着地の輪、地面の発光線、火花。
- 共通 SkillFX を本番とモーション確認画面で使用。命中時刻は既存の各技の打撃フレームに合わせる。本番では実際のhitイベントだけで敵の命中演出を出す。
- 敵の命中時の短い見た目の反動を追加。ダメージ計算/装備/セーブ形式は維持。
- キャラクターは既存の青銀の剣士の4姿勢素材。連続した全身アニメーションへ作り直したわけではない。
- 数値検証：命中フレーム一致、エフェクト消滅、有限座標、既存戦闘ループ。
