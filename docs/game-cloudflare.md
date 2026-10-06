# Tomo Game / Cloudflare Pages

- 公開URL: https://tomo-travel-game.pages.dev/
- Pagesプロジェクト: `tomo-travel-game`
- 設定: `assets/game-hosting.json`
- ゲームのソース: `TomoGame_V1.0/`

ゲームだけをCloudflare PagesへDirect Uploadで公開しています。本体サイトは従来のNetlifyに残ります。Netlifyビルドからゲームフォルダを除外し、旧 `/tomogame_v1.0` と配下のURLはCloudflareへ301転送します。ソースは引き続きこのリポジトリで管理します。

## ゲームを更新する

```powershell
node scripts/test_tomogame.cjs
python scripts/build_game_cloudflare.py --output artifacts/cloudflare-game/release-YYYYMMDD-N
```

出力先は毎回新しい空のフォルダを指定してください。ゲーム・画像・音声・動画だけをコピーし、canonical・共有URL・ホームへの戻り先を公開先向けに調整します。1ファイル25MiB超はビルドエラーになります。認証情報は含みません。

Cloudflare Dashboard → Workers & Pages → tomo-travel-game → Create a new deployment → Production で、生成したフォルダを **folder** から選び、全ファイルのアップロード成功を確認して公開します。`file` から大きなZIPを選ぶと単一ファイルの上限にかかります。

Direct Upload方式のため、GitHubへのpushだけではCloudflareのゲームは更新されません。Netlify本体は従来どおり自動更新されます。Cloudflareに公開後、開始・合体・音楽選択・動画素材・ホームへのリンクを確認してください。

## URL・サイト側の整合性

`scripts/build_seo.py` は設定を読み、ゲームへのリンクと旧URLの転送を維持します。本体サイトのXMLサイトマップから旧ゲームURLを除外し、Cloudflare側でゲーム専用の `sitemap.xml` を配信します。

```powershell
python scripts/build_seo.py
python scripts/verify_seo.py
```

最高記録と音量設定はブラウザの保存領域にあり、ドメインが変わるため旧URLから自動では引き継がれません。旧データ自体はブラウザに残ります。
