/**
 * dist/ を、ダブルクリック（file://）で見られる「確認用」フォルダに変換します。
 *   npm run preview:file
 * - href / src / srcset の "/..." を、そのページから見た相対パスに書き換える
 * - フォルダへのリンク（/works/ など）は .../index.html に書き換える
 * - CSS 内の url(/_astro/...) は同じフォルダからの相対パスに
 * 公開には使いません（公開は dist/ をそのまま使います）。
 */
import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || '確認用');
/** サイトの公開フォルダ（astro.config.mjs の base と同じ） */
const siteBase = (process.env.PORTFOLIO_BASE || '/portfolio/').replace(/\/?$/, '/');
if (!fs.existsSync(src)) { console.error(`${src} がありません。先に npm run build を実行してください。`); process.exit(1); }
fs.rmSync(out, { recursive: true, force: true });
const skip = new Set(['_headers', 'robots.txt']);
fs.cpSync(src, out, { recursive: true, filter: (p) => !skip.has(path.basename(p)) && !/^sitemap-.*\.xml$/.test(path.basename(p)) });

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const files = walk(out);

const rel = (p, prefix) => {
  const m = p.match(/^(\/[^#?]*)([?#].*)?$/);
  let base = m[1];
  if (base === siteBase.slice(0, -1)) base = '/';
  else if (base.startsWith(siteBase)) base = '/' + base.slice(siteBase.length);
  const rest = m[2] || '';
  const target = path.join(out, base);
  if (base.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) base = base.replace(/\/$/, '') + '/index.html';
  return prefix + base.replace(/^\//, '') + rest;
};

let count = 0;
for (const file of files.filter((f) => f.endsWith('.html'))) {
  const depth = path.relative(out, file).split(path.sep).length - 1;
  const prefix = depth ? '../'.repeat(depth) : './';
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/(\s(?:href|src|poster|action))="(\/(?!\/)[^"]*)"/g, (_, a, v) => `${a}="${rel(v, prefix)}"`);
  s = s.replace(/(\ssrcset)="([^"]*)"/g, (_, a, v) => `${a}="${v.split(',').map((x) => { const [u, ...d] = x.trim().split(/\s+/); return [u.startsWith('/') && !u.startsWith('//') ? rel(u, prefix) : u, ...d].join(' '); }).join(', ')}"`);
  s = s.replace(/url\((\/(?!\/)[^)]*)\)/g, (_, v) => `url(${rel(v, prefix)})`);
  s = s.replace(/<link rel="sitemap"[^>]*>/g, '');
  fs.writeFileSync(file, s);
  count++;
}
for (const file of files.filter((f) => f.endsWith('.css'))) {
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll(`url(${siteBase}_astro/`, 'url(./').replaceAll('url(/_astro/', 'url(./'));
}
console.log(`確認用フォルダを作成しました（${count}ページ）: ${out}`);
