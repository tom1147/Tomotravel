/**
 * 料金の数字はここだけで管理します。変更するとサイト全体（トップ・サービス・料金ページ）に反映されます。
 * 文言は src/i18n/ja.ts（将来は en.ts）側にあります。
 */
export const pricing = {
  currency: 'USD',
  symbol: '$',
  /** Webサイト・LP制作（1回払い）の開始価格 */
  websiteFrom: 100,
  /** 月額保守 */
  careMonthly: 30,
  /** 月額保守で受け付ける軽微な更新の回数（月あたり） */
  careUpdatesPerMonth: 2,
} as const;

export const money = (n: number) => `${pricing.symbol}${n}`;
