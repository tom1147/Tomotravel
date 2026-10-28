# Tomo — Web & Creative Portfolio

Webサイト・LP制作を中心にした、個人クリエイター Tomo のポートフォリオ兼サービス紹介サイトです（LinkedIn からの集客用）。
**英語がメイン**で、日本語・中国語（簡体字）に切り替えられます。Astro で作った静的サイトです。

公開先：**https://tomotravel-pm.com/portfolio/**（Tomo Travel と同じ Netlify で公開）

## フォルダの構成（Tomo Travel のリポジトリの中）

| フォルダ | 中身 |
| --- | --- |
| `.portfolio-src/` | このフォルダ。サイトの元ファイル（文章・画像・デザイン）。直すのはこちら |
| `portfolio/` | 公開用にビルドしたファイル。`https://tomotravel-pm.com/portfolio/` としてそのまま公開されます。直接は編集しません |

`.portfolio-src` は名前が `.` で始まるので、Tomo Travel のビルド（`scripts/build_production.py`）では公開されません。
Tomo Travel 側のファイルや設定は一切変更していません。

## 言語とURL

| 言語 | URL |
| --- | --- |
| 英語（メイン） | `/portfolio/` `/portfolio/pricing/` など |
| 日本語 | `/portfolio/ja/` `/portfolio/ja/pricing/` など |
| 中国語（簡体字） | `/portfolio/zh/` `/portfolio/zh/pricing/` など |

すべてのページの右上（スマホでもヘッダー）と一番下に「EN / 日本語 / 中文」の切り替えがあり、今見ているページの別の言語版に移動します。
各ページには検索エンジン向けに言語の対応（hreflang）を入れています。

## ページ構成

| URL | 内容 |
| --- | --- |
| `/portfolio/` | トップ（Hero / 制作実績 / ご依頼いただけること（料金の目安つき） / 依頼しやすい理由 / 動画 / ゲーム / プロフィール / お問い合わせ） |
| `/portfolio/works/` | 制作実績の一覧 |
| `/portfolio/works/tomo-travel/` ほか | 実績ごとの詳細ページ（LinkedIn から直接リンクできる独立URL） |
| `/portfolio/services/` | サービス |
| `/portfolio/pricing/` | 料金（制作 $150〜、月額保守 $30、単発の修正は応相談、よくある質問） |
| `/portfolio/about/` | プロフィール |
| `/portfolio/contact/` | お問い合わせフォーム（Tomo Travel の Netlify フォームに届きます） |

実績の詳細ページ：`tomo-travel` / `k-amigo` / `kiss-me` / `k-sayuri` / `tomo-nightwalker` / `tomo-travel-channel`

## 直して公開するまで

```bash
cd .portfolio-src
npm install          # 初回のみ
npm run dev          # 開発サーバー http://localhost:4321/portfolio/
npm run deploy       # ビルドして、../portfolio/ に公開用ファイルをコピー
```

`npm run deploy` のあと、Tomo Travel のリポジトリで `portfolio/` と `.portfolio-src/` をコミットして push すると、Netlify で公開されます。
Node.js 20.3 以上が必要です。

### ダブルクリックで見られる確認用フォルダ

`npm run preview:file` を実行すると `確認用/` ができます。`確認用/index.html` をダブルクリックすると、Node.js のサーバーなしでサイト全体を確認できます（言語の切り替え・ページ間の移動もできます）。
公開には使いません。`確認用/` は `.gitignore` 済みなので push されません。

## よく編集する場所

| やりたいこと | ファイル |
| --- | --- |
| 文章・見出し・ボタンの文言 | `src/i18n/en.ts`（英語）・`src/i18n/ja.ts`（日本語）・`src/i18n/zh.ts`（中国語）。3つとも同じ場所を直します |
| 実績の内容（説明・機能・画像・URL） | `src/data/works.ts`（文章と画像の説明は3言語で書いています） |
| 料金の数字（$150・$30・月2回） | `src/config/pricing.ts`（全ページ・全言語に反映） |
| お問い合わせフォームの送信先・SNS・ゲームのリンク | `src/config/site.ts` |
| 左上のロゴのアイコン | `src/assets/brand/tomoicon.png`（ブラウザのタブのアイコンは `public/favicon.png` など） |
| 色・文字サイズ・余白 | `src/styles/global.css` の先頭（`:root`）。言語ごとの文字組みも同じファイル（`html:lang(en)` など） |
| 「Small projects welcome」の表示 | `src/config/site.ts` の `available`（false で非表示） |
| トップの流れる実績の壁の画像 | `src/components/HeroWall.astro` |
| 実績の画像 | `src/assets/works/<実績名>/`（ビルド時に自動で軽量化・サイズ違いを生成） |
| SNSシェア画像（OGP） | `public/og/en/` `public/og/ja/` `public/og/zh/`（言語ごと、1200×630） |
| ページの組み立て | `src/views/*.astro`（英語・日本語・中国語で共通）。`src/pages/` はURLを作るだけのファイル |

存在しない画像を `works.ts` で指定するとビルドが止まるので、画像切れのまま公開されることはありません。

### お問い合わせフォーム

お問い合わせページのフォームは、**Tomo Travel（tomotravel-pm.com）の既存の Netlify フォーム「contact」に送信**します（同じサイトの中なので、そのまま届きます）。
届いた内容は、Tomo Travel と同じ Netlify の管理画面（Forms）と通知メールで確認できます。

- 件名に「【ポートフォリオ EN】Webサイト・LP制作のご相談」のように付くので、どの言語のページからの問い合わせか見分けられます（日本語ページは【ポートフォリオ】、中国語は【ポートフォリオ ZH】）
- Netlify は、Tomo Travel 側のフォームに登録されている項目しか保存しません。そのため項目名は Tomo Travel 側と同じ `name` / `email` / `subject` / `message` にしています。**Tomo Travel 側のフォームの項目名を変えると、こちらからの問い合わせが届かなくなる**ので注意してください
- 迷惑メール対策として、Tomo Travel 側と同じ `bot-field`（ボット用の隠し項目）を入れています
- 送信先は `src/config/site.ts` の `contact.formAction` で変更できます

**公開したら、一度だけテスト送信して、Netlify に届くことを確認してください。**

## 別のドメインで公開したくなったら

独自ドメインの直下（例：`https://tomo-web.com/`）で公開する場合は、`SITE_URL=https://tomo-web.com` と `PORTFOLIO_BASE=/` を指定してビルドし、`dist/` を Cloudflare Pages や Netlify に公開します（`astro.config.mjs` を参照）。
`public/_headers` は、その場合のキャッシュ設定です（Tomo Travel の中で公開する今の形では使いません）。

## 画像について

- Webサイトのスクリーンショットは、各サイトの公開中のソース（このPCのクローン）をブラウザで表示して撮影したものです。PC表示は 1440px 幅、スマートフォン表示は 390px 幅。
- 動画のサムネイルは YouTube の公開サムネイル、ゲーム画面は Tomo Nightwalker の確認用スクリーンショットを使用しています。
- プロフィール写真は既存のアイコン画像（500×500）の背景を外したものです。より大きい写真があれば `src/assets/about/tomo.webp` を差し替えてください。
