# LEARNINGS — 199-pinball

## 2026-08-18 | タイトルBG + SE + ゲームオーバー音

- やったこと: タイトル背景イラスト（webp）、2段階STARTフロー、Web Audio SE（発射/フリッパー/跳ね返り/バンパー/落球）、ゲームオーバー時BGM停止+専用SE。
- うまくいったこと: タイトル層とプレイ層を分離し START ボタン被り解消。SE は gain 0.14〜0.20 + クールダウンで耳障り回避。
- 次回: ゲームオーバー後タイトルへ戻る導線、ハイスコア保存。

## 2026-08-18 | タイトル画面 + BGM

- やったこと: ネオン風タイトル画面（TAP TO START）を追加。BGMをタイトル/プレイで切替。Suno MP3（カバー画像付き）を `-vn` で HE-AAC m4a 化し `audio/` に配置（8MB鉄則対応）。
- うまくいったこと: タイトル画面タップで title BGM、START で play BGM に切替。ミュート状態を localStorage 保存。
- 詰まった箇所: Suno 出力 MP3 に MJPEG カバーが同梱され ffmpeg 変換失敗 → `-vn` で音声のみ抽出。
- 次回: （上記エントリへ統合済み）

## 2026-08-17 | 単一HTML化 + GitHub公開

- やったこと: 分割ファイル（style.css / script.js）を index.html 1本に統合。iOS touch UX（safe-area・ダブルタップ防止・vibrate）を追加。GitHub Pages 更新。
- うまくいったこと: 16KB 単一ファイルで harness PASS。物理・描画・オンスクリーンコントロールがそのまま動く。
- 詰まった箇所: 以前の js/ 分割版はレイアウト不整合が多く、単一HTMLへの書き直しで解消。
