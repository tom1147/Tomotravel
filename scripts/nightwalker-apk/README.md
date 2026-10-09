# とも旅ナイトウォーカー Android版の配布

Cloudflare R2 の非公開バケット `tomo-nightwalker-downloads` に APK を置き、`worker.mjs` が指定した APK だけをダウンロードとして配信する。Webゲームは従来の `https://tomo-nightwalker.pages.dev/` のまま。

- ダウンロード URL: `https://tomo-nightwalker-apk.tom-middle-pakipaki2.workers.dev/TomoNightwalker-Android-latest.apk`

- 現行の配布キー: `TomoNightwalker-Android-v36.0.0.apk`
- 元ファイル: `C:/Users/tommi/Desktop/インクリメンタルゲーム/TomoNightwalker-Android-v36.0.0.apk`
- サイズ: 348,684,286 bytes
- SHA-256: `c1474a9907fa0aa4723f226193415c90fdb6495ec4dd427f531461c7d49a9835`
- APK 署名: v2・v3 検証済み

R2 は Standard ストレージクラスを使い、公開用の `r2.dev` URL は有効にしない。Worker は GET と HEAD のみを許可し、部分取得に対応する。旧v31の直接URLと `latest.apk` のURLは、現行版にリダイレクトする。旧v31オブジェクトは非公開バケット内に保管する。

Wrangler の単一オブジェクトアップロード上限は 300 MiB のため、v31とv36はローカルで32 MiB以下のパートに分割して非公開バケットへ送り、一時的なローカル Worker から R2 のマルチパートAPIで元の1ファイルに結合した。結合後、公開URLから全体を読み、元ファイルとのSHA-256一致を確認する。R2上の一時パートは検証後に削除する。

今後の更新も、300 MiBを超えるAPKはR2のS3マルチパートアップロードか同様の結合手順を使う。公開後は HEAD、Range、全体のSHA-256を確認する。認証情報やAPK本体はこのリポジトリへ入れない。
