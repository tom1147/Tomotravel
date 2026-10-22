/**
 * 言語の切り替え（英語がメイン、日本語・中国語に切り替え可能）。
 *
 * URL の決まり（base が /portfolio/ の場合）
 *   英語   : /portfolio/            /portfolio/pricing/
 *   日本語 : /portfolio/ja/         /portfolio/ja/pricing/
 *   中国語 : /portfolio/zh/         /portfolio/zh/pricing/
 *
 * ページやコンポーネントでは、次のように使います。
 *   const { t, u, lang } = useI18n(Astro.url);
 *   t.nav.works   … その言語の文言
 *   u('pricing/') … その言語のページへのリンク
 */
import ja from './ja';
import en from './en';
import zh from './zh';

export const locales = ['en', 'ja', 'zh'] as const;
export type Lang = (typeof locales)[number];
export const defaultLang: Lang = 'en';

const dicts = { en, ja, zh };

export const langMeta: Record<Lang, { html: string; og: string; label: string; name: string }> = {
  en: { html: 'en', og: 'en_US', label: 'EN', name: 'English' },
  ja: { html: 'ja', og: 'ja_JP', label: '日本語', name: '日本語' },
  zh: { html: 'zh-Hans', og: 'zh_CN', label: '中文', name: '简体中文' },
};

/** 英語以外の言語のページを作るときの getStaticPaths 用 */
export const otherLangs = locales.filter((l) => l !== defaultLang);

const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/** base より後ろのパス（先頭の / なし） */
function afterBase(pathname: string): string {
  return pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, '');
}

export function langFromPath(pathname: string): Lang {
  const first = afterBase(pathname).split('/')[0];
  return (locales as readonly string[]).includes(first) && first !== defaultLang ? (first as Lang) : defaultLang;
}

/** 言語の部分を除いたページのパス（例: 'works/kiss-me/'） */
export function pagePath(pathname: string): string {
  const rest = afterBase(pathname);
  const lang = langFromPath(pathname);
  return lang === defaultLang ? rest : rest.slice(lang.length + 1);
}

/** 指定した言語のページへのリンク */
export function localePath(lang: Lang, path = ''): string {
  return base + (lang === defaultLang ? '' : `${lang}/`) + path.replace(/^\//, '');
}

export function useI18n(url: URL) {
  const lang = langFromPath(url.pathname);
  return {
    lang,
    t: dicts[lang],
    meta: langMeta[lang],
    u: (path = '') => localePath(lang, path),
    /** 補足をかっこでくくる（英語は半角、日本語・中国語は全角） */
    paren: (text: string) => (lang === 'en' ? ` (${text})` : `（${text}）`),
    /** 「詳しく見る：K.AMIGO」のような区切り */
    sep: lang === 'en' ? ': ' : '：',
  };
}

export type { Dict } from './ja';
