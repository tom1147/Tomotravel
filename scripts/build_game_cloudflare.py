"""Package only Tomo Game for Cloudflare Pages (no main-site files or credentials)."""
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
GAME = ROOT / 'TomoGame_V1.0'
OLD_URL = 'https://tomotravel-pm.com/tomogame_v1.0/'


def build(output, public_url):
    url = urlsplit(public_url)
    if url.scheme != 'https' or not url.hostname or url.username or url.password or url.query or url.fragment or url.path not in ('', '/'):
        raise ValueError('Use the HTTPS root URL of the Cloudflare project')
    public_url = public_url.rstrip('/') + '/'
    output = output.resolve()
    if output == ROOT or output in ROOT.parents or output == GAME or GAME in output.parents:
        raise ValueError('Choose a separate, empty output directory')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output directory must be empty; existing files are never removed')
    output.mkdir(parents=True, exist_ok=True)
    files = [GAME / name for name in ('index.html', 'style.css', 'tokens.css', 'manifest.json', 'sw.js', 'js/game.js', 'js/objects.js')]
    files += sorted((GAME / 'assets').rglob('*'))
    count = 0
    for source in files:
        if not source.is_file():
            continue
        if source.stat().st_size > 25 * 1024 * 1024:
            raise ValueError('Cloudflare asset exceeds 25 MiB: ' + str(source))
        destination = output / source.relative_to(GAME)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        count += 1
    html = (output / 'index.html').read_text(encoding='utf-8')
    html = html.replace(OLD_URL, public_url)
    html = html.replace('href="../index.html"', 'href="https://tomotravel-pm.com/"')
    html = html.replace('href="/favicon.ico" type="image/x-icon"', 'href="assets/icon512.png" type="image/png"')
    (output / 'index.html').write_text(html, encoding='utf-8')
    code = (output / 'js/game.js').read_text(encoding='utf-8').replace(OLD_URL, public_url)
    (output / 'js/game.js').write_text(code, encoding='utf-8')
    (output / '_headers').write_text(
        '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n'
        '/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n'
        '/sw.js\n  Cache-Control: no-cache\n/js/*\n  Cache-Control: no-cache\n'
        '/assets/*\n  Cache-Control: public, max-age=86400\n', encoding='utf-8')
    (output / '404.html').write_text(
        '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
        '<title>ページが見つかりません | Tomo Game</title><h1>ページが見つかりません</h1>'
        '<p><a href="/">Tomo Gameに戻る</a></p></html>', encoding='utf-8')
    (output / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: ' + public_url + 'sitemap.xml\n', encoding='utf-8')
    (output / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        '<url><loc>' + public_url + '</loc></url></urlset>', encoding='utf-8')
    report = {'url': public_url, 'files': count + 4, 'output': str(output)}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    hosting = json.loads((ROOT / 'assets/game-hosting.json').read_text(encoding='utf-8'))
    parser.add_argument('--url', default=hosting['public_url'], help='The assigned production URL; defaults to assets/game-hosting.json')
    args = parser.parse_args()
    build(args.output, args.url)
