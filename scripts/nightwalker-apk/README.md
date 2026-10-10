# とも旅ナイトウォーカー Android版の配布

Cloudflare R2 の非公開バケット `tomo-nightwalker-downloads` に APK を置き、`worker.mjs` が指定した APK だけをダウンロードとして配信する。Webゲームは従来の `https://tomo-nightwalker.pages.dev/` のまま。

- ダウンロード URL: `https://tomo-nightwalker-apk.tom-middle-pakipaki2.workers.dev/TomoNightwalker-Android-latest.apk`

- 現行の配布キー: `TomoNightwalker-Android-v38.0.0.apk`
- 元ファイル: `C:/Users/tommi/Desktop/インクリメンタルゲーム/TomoNightwalker-Android-v38.0.0.apk`
- サイズ: 360,277,500 bytes
- SHA-256: `21ab78728c4e6899303c08f9e6e3211b1a5377fc475d653adeabf1af7b6e02ef`
- APK 署名: v2・v3 検証済み

R2 は Standard ストレージクラスを使い、公開用の `r2.dev` URL は有効にしない。Worker は GET と HEAD のみを許可し、部分取得に対応する。旧v31・v36・v37の直接URLと `latest.apk` のURLは、現行版にリダイレクトする。旧v31オブジェクトは非公開バケット内に保管する。

Wrangler の単一オブジェクトアップロード上限は 300 MiB のため、v31とv36はローカルで32 MiB以下のパートに分割して非公開バケットへ送り、一時的なローカル Worker から R2 のマルチパートAPIで元の1ファイルに結合した。結合後、公開URLから全体を読み、元ファイルとのSHA-256一致を確認する。R2上の一時パートは検証後に削除する。

今後の更新も、300 MiBを超えるAPKはR2のS3マルチパートアップロードか同様の結合手順を使う。公開後は HEAD、Range、全体のSHA-256を確認する。認証情報やAPK本体はこのリポジトリへ入れない。


v37の公開確認：HEAD・Range・配布ファイル全体のSHA-256を元APKと照合し、HPの版番号表示をv37に統一。既存の配布URLと旧APKオブジェクトは保持。


v38はリンゴの等身統一、単独覚醒の強化、同時編成時の守護干渉、REXへの改名を含む。同一署名・packageで既存セーブを引き継ぐ。
