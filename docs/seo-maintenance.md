# 内部SEOの保守

対象サイト: https://tomotravel-pm.com/ （Netlify / GitHub: tom1147/Tomotravel）

## 2026-09-19の変更

- 記事本文は維持。旧データで解析に失敗していた15ページのJSON-LDを修復。
- 正規URL、OGP、Twitterカード、サイトマップ、内部リンクを統一。
- 別ドメインのcanonical、存在しない著者・カテゴリ・画像URL、実装されていない検索機能のSearchActionを修正・除去。
- WebSite、Organization、WebPage、BlogPosting、BreadcrumbList、店舗情報、動画情報を関係づけたJSON-LDへ統一。不完全な重複microdataを除去。
- 共通ヘッダー・フッター・サイドバーをHTMLに埋め込み、JavaScriptを実行しないクローラーもリンクを発見できるように変更。
- Search Consoleで404と報告されていた `/blog/cebu2nd2` と `/blog/cebu-day1.html` を、それぞれ `/cebu2nd2` と `/cebu2nd1` へ301転送。後者の対応はGit履歴で確認済み。
- XMLサイトマップを実在する正規ページと画像・動画から再生成。HTMLサイトマップとllms.txtを追加。
- 試験用HTML断片と共通部品にHTTP noindexを設定。公開記事へのクロールは許可。
- 画像サイズを実測してwidth/heightを設定。存在しないCSS参照・仮画像を除去。アフィリエイトリンクにsponsoredを設定。
- 埋め込まれた23本のYouTube動画の公開日・再生時間・タイトルを公開ページで確認し、`scripts/video_metadata.json`に記録。

## ページを更新したとき

Python 3とPillowを使います。Pillowは既存画像の寸法取得だけに使用し、画像は編集しません。

1. 対象HTMLの本文・タイトル・description・必要な店舗情報を編集します。共通ナビは`blog/header.html`や`ktv/header.html`を編集します。
2. 動画を追加・差し替えた場合は `python scripts/collect_video_metadata.py` を実行します。公開YouTubeページを読み取るためネット接続が必要です。
3. `python scripts/build_seo.py` で派生データ・共通部品・サイトマップを更新します。既存の更新日は維持され、Git履歴に新しい更新日があれば反映されます。
4. サイト全体に重要な変更を加えた場合だけ `python scripts/build_seo.py --date YYYY-MM-DD` を使います。この指定は全対象ページのlastmodを更新します。毎日機械的に今日の日付へ変えないでください。
5. `python scripts/verify_seo.py` を実行し、errorsが空であることを確認します。
6. 公開後、正規URLの200応答と旧URLの301応答を確認します。サイトマップのURLは常に https://tomotravel-pm.com/sitemap.xml です。

新しいHTMLは自動検出されます。公開対象外の断片は`build_seo.py`のFRAGMENTSと`_headers`へ追加してください。新しい公開カテゴリを作った場合は、HTMLサイトマップのグループ分類にも追加します。リンクから到達できないページは検証で検出されます。

## 店舗の休業情報・追記を反映するとき

- 一覧と記事冒頭のお知らせに加え、descriptionと店舗JSON-LDも同じ状況に更新します。KTV記事のArticle、OGP、Twitterカードの説明文は生成処理でdescriptionに揃います。
- New Kai Moanaは2026年9月19日の追記でリニューアル休業中と案内しています。旧記事本文は維持し、店舗JSON-LDの通常営業時間・料金範囲・料金オファーは現在の営業情報として出力しないよう除去しました。再開情報が確認できたら、お知らせ、description、店舗JSON-LD、一覧のItemListを合わせて更新してください。
- 追記の`time`を公開日として扱わず、`article:published_time`と既存の`datePublished`を優先します。元の公開日を維持し、更新日と区別してください。
- `verify_seo.py`では公開日・更新日・説明文のメタタグと記事JSON-LDの一致も確認します。

判断の参照先: [Googleの構造化データガイドライン](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)。本文に見える情報と構造化データを一致させ、休業前の営業時間を現行情報として残さない方針です。

## 検証と証跡

- `python scripts/audit_seo.py --live --output artifacts/seo/live.json`: 公開HTTP応答を読み取る監査。
- `python scripts/preview_site.py`: localhost:8765での表示確認。Netlifyの転送エンジンそのものを再現するものではありません。
- `artifacts/seo/before.json`: 変更前の監査。
- `artifacts/seo/verification.json`: 現在の検証結果。
- `artifacts/seo/generated.json`: 生成時のページ・画像・動画一覧。

artifactsはGit管理・公開対象外です。scripts、docsへのHTTPアクセスは404にします。

## 運用上の前提

`llms.txt`はページ案内の補助資料です。検索順位やAI回答への採用を保証する機能ではありません。Googlebot、Bingbot、OAI-SearchBotが公開コンテンツを読み取れること、本文と構造化データが一致すること、正規URLと通常のリンクが整合することを優先します。

Netlifyは転送ルール判定前に末尾スラッシュを正規化するため、`/page/ /page 301!` のようなルールは追加しないでください。無限転送になります。

サイトマップ送信・インデックス登録リクエストはクロールの依頼であり、登録や順位はGoogle側の判断です。動画は記事内の補助コンテンツとして掲載されているため、動画検索用の専用視聴ページとして扱われるとは限りません。

公式資料:

- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- https://developers.google.com/search/docs/appearance/structured-data/video
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://docs.netlify.com/manage/routing/redirects/redirect-options/
