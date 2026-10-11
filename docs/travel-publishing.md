# 旅行記の制作・公開手順

今回の追加対象は58動画。既存のホーチミン編6記事も同じ記事基盤へ移し、ブログには以前の21記事を含む85記事を掲載する。

| シリーズ | 今回の記事数 |
| --- | ---: |
| タイ編 | 8 |
| マニラ編 | 7 |
| 金沢編 | 1 |
| セブ島フォース編 | 7 |
| ホーチミンセカンド編 | 9 |
| マニラ・セブ最終回編 | 11 |
| 高輪ゲートウェイ編 | 1 |
| マニラセカンド編 | 9 |
| マニラサード編 | 1 |
| ハノイ・ホーチミン編 | 4 |

## 編集データ

- `docs/travel-articles.json`：公開本文、公開動画ID、写真、シリーズ、公開日。記事再生成の入力。
- `docs/travel-source-audit.json`：元ファイル名、字幕の種類、動画の尺、原稿の確認事項。公開ビルドからは除外する。
- `docs/travel-design-system.json`：実装前に生成した10系統のページ全体のデザイン案と方針。
- `docs/travel-legacy-articles.json`：先に確認したホーチミン6記事の本文と写真を保存したもの。
- `scripts/video_metadata.json`：公開YouTubeから確認したタイトル・公開日時・動画の長さ。
- `assets/travel-editorial-tokens.css`：シリーズ別の色と書体。
- `assets/travel-editorial.css`：記事、シリーズ一覧、ブログトップのレイアウト。
- `assets/travel-editorial.js`：動画再生、目次、リンクコピー、記事検索の補助。

## 元動画から新しく作るとき

1. 指定フォルダの日本語SRT/TXTと完成動画を確認する。翻訳字幕、前回の回想、タイトルカード、途中に挿入された別動画を区別する。原本は変更しない。
2. 本人のYouTubeの日本語タイトル、内容、長さを照合する。フォルダ名だけで動画を決めない。対応表は `scripts/match_travel_videos.py`、今回の読み取り結果は `artifacts/travel-archive/` にある。
3. 字幕を通読して時系列の原稿を作る。料金は撮影当時の値として扱い、見積額・単価・会計を混同しない。不明な年、店名、費用を推測で補わない。
4. ページ全体のデザイン案を画像生成してから実装する。案に描かれた架空の風景や価格を、実際の旅行記には使わない。
5. `scripts/prepare_article_frames.py` で候補を切り出し、コンタクトシートと原寸画像を確認する。写真は各記事2〜3枚を目安にし、冒頭の動画ポスターにも使用する。
6. 組み込み画像生成でデジタル国旗・字幕・テロップを補修する。実看板、人物の容貌、設備、元のプライバシーぼかしを保持する。文字のない良いフレームはそのまま採用できる。
7. 画像を1440pxと720pxのWebPへ変換する。参照元、動画時刻、プロンプト、結果を `artifacts/travel-archive/image-results/` に記録し、画像ごとの確認を終えてから `complete` にする。
8. `SERIES`、原稿、対応表、検証用の対象数を更新する。字幕・動画・加工前の大きな写真・実験ファイルは `artifacts/` に置き、公開ファイルに混ぜない。

字幕がないタイ編6と高輪は、本人の公開動画の日本語自動字幕を補助資料にした。ホーチミンセカンド1は公開版から約90秒が削除されているため、保存版のタイムコードへのリンクを載せない。

## 再生成と確認

公開原稿から再生成するだけなら、元のドライブや画像生成サービスは不要。

```powershell
python scripts/build_travel_articles.py --strict
python scripts/build_seo.py
python scripts/verify_travel_articles.py
python scripts/verify_seo.py
```

作業中の原稿・画像台帳を取り込むときだけ `--refresh` を使う。初回公開日を確定するときは `--refresh --date YYYY-MM-DD --strict` を指定する。過去記事の公開日を動画公開日に置き換えない。

`build_seo.py` は既存サイトの公開画像パックもチェックサム付きで確認する。通信できない環境では `--design-assets` に検証済みの画像パックを指定できる。

本番ビルドのローカル出力先には、リポジトリ外の新しい空フォルダを指定する。

```powershell
python scripts/build_production.py --output <空のビルド専用フォルダ>
python scripts/preview_site.py --root <同じフォルダ> --port 8768
```

記事には本文・画像・YouTube iframeが最初からHTMLにある。ブログの全85件へのリンクもHTMLに残り、JavaScriptは絞り込みだけを補助する。記事は `BlogPosting`、シリーズ一覧は `CollectionPage` と `ItemList`、動画は確認済みの `VideoObject` として出力する。

生成物はXML/HTMLサイトマップ、`llms.txt`、出典付き本文の `llms-full.txt`。AI向けテキストは補助資料であり、検索順位やAIでの採用を保証するものではない。[GoogleのAI検索に関する公式説明](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)、[動画の公式ガイド](https://developers.google.com/search/docs/appearance/video)に従い、本文の読み取りやすさ、出典、動画の発見性を優先する。

公開前に、対象記事数、動画ID、写真の所属・寸法、シリーズ連番、ゲームメニュー、スマホ320/375/414/768pxの表示を確認する。push後はGitの到達と本番ページの反映をそれぞれ確認する。
