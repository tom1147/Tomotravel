# 本番ビルドと画像素材

トップページのデザイン素材は、作業フォルダに画像を追加しない運用です。
`assets/design-assets.json` に、素材専用ブランチ `codex/design-assets-20261003` の固定コミットURLとSHA-256を記録しています。
元の生成画像と確認用スクリーンショットはこのリポジトリには含めません。

## Netlify

`netlify.toml` のビルドコマンドが `scripts/build_production.py` を実行します。
公開画像を取得・検証し、既存サイトと一緒に `dist/` に配置します。Netlifyの公開フォルダも `dist` です。
20枚のWebPはバージョン付きの `/_design-assets/20261003-c1/` で配信し、長期間キャッシュできます。
画像の取得失敗やハッシュ不一致、SEO検証エラーがある場合、ビルドは失敗して公開を止めます。

## ローカル確認

`python scripts/preview_site.py` で、必要な画像をOSの一時フォルダに取得してプレビューします。
初回のみ素材のダウンロードにネット接続が必要です。
すでに取得済みの素材を使う場合は `--design-assets <素材フォルダ>` を指定できます。

本番と同じファイル一式を確認する場合は、空の出力フォルダをclone外に指定します。

```powershell
python scripts/build_production.py --output C:\path\outside-clone\release
python scripts/preview_site.py --root C:\path\outside-clone\release --port 8767
```

本番ビルドはPython標準ライブラリのみを使います。PillowやNode.jsのインストールは不要です。
Windowsで見逃されやすい旧ファイル名の大文字・小文字の違いも、公開URLに合わせて出力します。

## 素材の更新

画像を更新する際は、clone外で最適化した素材を専用ブランチへ保存し、固定コミットURL・各ファイルのハッシュ・公開ディレクトリのバージョンをmanifestで更新します。
既存のバージョンのファイルは上書きしません。HTML/CSSの参照先も新しいバージョンに揃えてください。

お問い合わせフォームは従来のNetlify Forms設定を維持しています。画像の配信確認と、フォームの本番メール受信確認は別の確認事項です。
