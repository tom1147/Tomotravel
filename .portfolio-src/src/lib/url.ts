/**
 * 言語に関係しないファイル（画像・アイコンなど）へのパスを作る。
 * ページへのリンクは i18n の useI18n(Astro.url).u() を使います。
 *   asset('favicon.png') -> '/portfolio/favicon.png'
 */
export function asset(path = ''): string {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return base + path.replace(/^\//, '');
}

/** 今のページがナビの項目に当たるか（aria-current 用）。href は言語つきのパス */
export function isCurrent(current: string, href: string, home: string): boolean {
  if (href === home) return current === home;
  return current.startsWith(href);
}
