# LEARNINGS — 199-pinball

## 2026-08-17 | 単一HTML化 + GitHub公開

- やったこと: 分割ファイル（style.css / script.js）を index.html 1本に統合。iOS touch UX（safe-area・ダブルタップ防止・vibrate）を追加。GitHub Pages 更新。
- うまくいったこと: 16KB 単一ファイルで harness PASS。物理・描画・オンスクリーンコントロールがそのまま動く。
- 詰まった箇所: 以前の js/ 分割版はレイアウト不整合が多く、単一HTMLへの書き直しで解消。
- 次回: WebAudio BGM/SE、ハイスコア保存、TAP TO START オーバーレイ。
