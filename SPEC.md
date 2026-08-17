# 199-pinball SPEC

- 仕様書名: PINBALL
- 対象ゲーム: `199-pinball`
- 作成日: 2026-08-17
- 更新日: 2026-08-17
- ステータス: 公開準備

## 1. ゲーム概要

- ジャンル: ピンボール
- 一言説明: プランジャーで球を打ち、フリッパーで返すテーブルゲーム
- 公開ブロッカーになる未確定事項: なし

## 2. 対象環境

- GitHub Pages / iPhone Safari / 320–430px
- 静的 HTML/CSS/JS。外部音源ファイルなし。衝突SEは Web Audio API

## 3. ファイル構成

```text
199-pinball/
  index.html
  style.css
  script.js
```

## 4. コアループ

TAP TO START（Audio unlock）→ HOLD LAUNCH → バンパー/レーン/ターゲット加点 → ドレインで残機-1 → 0で GAME OVER

## 5. 音声

- 当たり音: `AudioContext` + `OscillatorNode` + `GainNode` + `BiquadFilter`（内部生成）
- MP3/WAV は使わない
- ミュートボタンあり。状態は localStorage
