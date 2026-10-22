// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * 公開先：https://tomotravel-pm.com/portfolio/
 *   英語 /portfolio/ ・ 日本語 /portfolio/ja/ ・ 中国語 /portfolio/zh/
 *
 * SITE_URL       : 公開するドメイン（canonical・OGP・サイトマップのURLに使われます）
 * PORTFOLIO_BASE : 公開するフォルダ（既定は /portfolio/）。独自ドメインの直下で公開するときは / にします。
 */
const site = process.env.SITE_URL || 'https://tomotravel-pm.com';
const base = process.env.PORTFOLIO_BASE || '/portfolio/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  compressHTML: true,
});
