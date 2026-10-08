# とも旅ナイトウォーカー Android版の配布

Cloudflare R2 の非公開バケット `tomo-nightwalker-downloads` に APK を置き、`worker.mjs` が指定した APK だけをダウンロードとして配信する。Webゲームは従来の `https://tomo-nightwalker.pages.dev/` のまま。

- ダウンロード URL: `https://tomo-nightwalker-apk.tom-middle-pakipaki2.workers.dev/TomoNightwalker-Android-v31.apk`

- 配布キー: `TomoNightwalker-Android-v31.apk`
- 元ファイル: `C:/Users/tommi/Desktop/インクリメンタルゲーム/output/TomoNightwalker-Android-v31.apk`
- サイズ: 330,194,725 bytes
- SHA-256: `ef35c722eee29a236bcab3a2b6c5e5b0e18fa79b8e1d98eb07d4bba44a948951`
- APK 署名: v2・v3 検証済み

`output/TomoNightwalker-Android-v1.apk` も、この v31 ファイルと SHA-256 が同じ。R2 は Standard ストレージクラスを使い、公開用の `r2.dev` URL は有効にしない。Worker は GET と HEAD のみを許可し、部分取得に対応する。

Wrangler の単一オブジェクトアップロード上限は 300 MiB のため、v31 はローカルで32 MiB以下のパートに分割して非公開バケットへ送り、一時的なローカル Worker から R2 のマルチパートAPIで元の1ファイルに結合した。結合後、公開URLから全330,194,725バイトを読み、元ファイルとのSHA-256一致を確認した。R2上の一時パートは削除済み。

今後の更新も、300 MiBを超えるAPKはR2のS3マルチパートアップロードか同様の結合手順を使う。公開後は HEAD、Range、全体のSHA-256を確認する。認証情報やAPK本体はこのリポジトリへ入れない。
