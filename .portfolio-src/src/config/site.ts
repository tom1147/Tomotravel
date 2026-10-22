/**
 * サイト全体の設定。
 * 外部リンクや問い合わせ先はここだけで管理します（ページ内に直接URLを書かない）。
 * 空文字の項目は、ページ上に表示されません（リンク切れ・ダミーボタン防止）。
 */
export const site = {
  brand: 'Tomo',

  /**
   * 配色。'light' = 明るいページ＋作品は夜色のパネル / 'dark' = 全体を夜色に
   */
  theme: 'light' as 'light' | 'dark',

  /** トップに「新規のご相談を受付中」を出すかどうか（文言は i18n 側） */
  available: true,

  contact: {
    /**
     * お問い合わせフォームの送信先。
     * Tomo Travel（Netlify）の既存フォーム「contact」に届きます。
     * 届いた内容は、Tomo Travel と同じ Netlify の管理画面・通知メールで確認できます。
     * 項目名（name / email / subject / message）は Tomo Travel 側のフォームと同じにしてあります。
     * 件名には【ポートフォリオ】が付くので、どちらのサイトからの問い合わせか見分けられます。
     * 空にするとフォームは表示されず、下の email / url の案内に切り替わります。
     */
    formAction: 'https://tomotravel-pm.com/?success=true',
    formName: 'contact',
    /** 問い合わせ用のメールアドレス（フォームを使わない場合のみ表示） */
    email: '',
    /** フォームもメールも使わない場合の案内先 */
    url: 'https://tomotravel-pm.com/#contact',
    hostLabel: 'Tomo Travel 公式サイト',
  },

  social: {
    youtube: 'https://www.youtube.com/@TomoTravel-PM',
    x: 'https://x.com/tomotravel_pm',
    /** LinkedInのプロフィールURLが決まったら設定してください */
    linkedin: '',
  },

  game: {
    web: 'https://tomo-nightwalker.pages.dev/',
    itch: 'https://tomotravel.itch.io/tomo-nightwalker',
    /** Android版APK（Cloudflare Workers経由で最新版を配信）。空にするとボタンは非表示 */
    apk: 'https://tomo-nightwalker-apk.tom-middle-pakipaki2.workers.dev/TomoNightwalker-Android-latest.apk',
  },
} as const;

export type Site = typeof site;
