/**
 * ビルドした dist/ を、Tomo Travel のリポジトリの portfolio/ フォルダにコピーします。
 *   npm run deploy
 * portfolio/ は https://tomotravel-pm.com/portfolio/ として公開されます（Tomo Travel と同じ Netlify）。
 * コピーしたあと、Tomo Travel のリポジトリで portfolio/ と .portfolio-src/ をコミットして push してください。
 */
import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || '../portfolio');
if (!fs.existsSync(path.join(src, 'index.html'))) { console.error('dist/ がありません。先に npm run build を実行してください。'); process.exit(1); }
if (path.basename(out) !== 'portfolio' || out === process.cwd()) { console.error(`コピー先が想定と違います: ${out}`); process.exit(1); }

fs.rmSync(out, { recursive: true, force: true });
// _headers・robots.txt はサイトの一番上でしか意味がないので、サブフォルダ公開では入れない
const skip = new Set(['_headers', 'robots.txt']);
fs.cpSync(src, out, { recursive: true, filter: (p) => !skip.has(path.basename(p)) });
const count = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`公開用のファイルをコピーしました（${count(out)}ファイル）: ${out}`);
