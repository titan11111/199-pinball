# 199-pinball — NEON PINBALL

## 概要
ネオンサイバー風ピンボール。単一 `index.html`、Canvas 2D、外部アセットなし。GitHub Pages / iPhone Safari 前提。

## 操作
- 左フリッパー: ← / LEFTボタン / 画面左タップ
- 右フリッパー: → / RIGHTボタン / 画面右タップ
- 発射: Space（長押し→離す）/ LAUNCHボタン
- リセット: R

## ゲームルール
- ボール3個。下部ドレインに落ちたら1個消費
- バンパー5個（200〜400点）、ポスト4個
- スコアはHUD上部に6桁ゼロ埋め表示
- 残ボールがなくなったらゲームオーバー、Space/LAUNCHでリトライ

## 実装メモ
- 論理座標系 520×790。DPR対応リサイズ
- 物理: 重力 + 壁/ガイド/バンパー/フリッパー反射。固定タイムステップ 1/120s
- 発射レーン右端。チャージメーター付きプランジャー
- iOS Safari: viewport-fit=cover / safe-area / ダブルタップ防止 / pointerdown ボタン

## ファイル構成
```
199-pinball/
  index.html   # HTML + CSS + JS 単一ファイル
  SPEC.md
  LEARNINGS.md
  .nojekyll
```

## 未確定事項
- BGM・効果音（WebAudio）は次回改修候補
- ハイスコア localStorage 保存は未実装
