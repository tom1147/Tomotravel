"""Read-only inventory of the static site and its public HTTP responses."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://tomotravel-pm.com"
LD = re.compile(r'<script\b[^>]*type=[\"\']application/ld\+json[\"\'][^>]*>(.*?)</script>', re.S | re.I)


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.tags = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

    def select(self, tag):
        return [a for t, a in self.tags if t == tag]


def resolve_file(url):
    path = unquote(urlsplit(url).path)
    p = ROOT / path.lstrip('/')
    for candidate in [p, Path(str(p).rstrip('/') + '.html'), p / 'index.html']:
        if candidate.is_file():
            return candidate
    return None


def inventory():
    pages = []
    missing = {}
    for p in sorted(ROOT.rglob('*.html')):
        if '.git' in p.parts or 'artifacts' in p.parts:
            continue
        rel = p.relative_to(ROOT).as_posix()
        text = p.read_text(encoding='utf-8-sig')
        doc = Document(text)
        meta = {a.get('name', a.get('property', '')): a.get('content', '') for a in doc.select('meta')}
        schemas, errors = [], []
        for block in LD.findall(text):
            try:
                data = json.loads(block)
                schemas += data.get('@graph', [data]) if isinstance(data, dict) else data
            except ValueError as e:
                errors.append(str(e))
        title = re.search(r'<title[^>]*>(.*?)</title>', text, re.S | re.I)
        row = {'file': rel, 'title': title[1] if title else '', 'meta': meta,
               'canonicals': [a.get('href') for a in doc.select('link') if a.get('rel') == 'canonical'],
               'h1': len(doc.select('h1')), 'schemas': schemas, 'schema_errors': errors,
               'links': [a.get('href', '') for a in doc.select('a')],
               'images': doc.select('img'), 'dates': doc.select('time'),
               'embeds': [a.get('src', '') for a in doc.select('iframe')]}
        pages.append(row)
        for kind, attr in [('a', 'href'), ('img', 'src'), ('script', 'src'), ('link', 'href')]:
            for a in doc.select(kind):
                value = a.get(attr, '')
                if not value or value.startswith('#'):
                    continue
                url = urljoin(ORIGIN + '/' + rel, value)
                if urlsplit(url).netloc != urlsplit(ORIGIN).netloc:
                    continue
                if not resolve_file(url):
                    missing.setdefault(urlsplit(url).path, set()).add(rel)
    return {'pages': pages, 'missing': {k: sorted(v) for k, v in missing.items()}}


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'TomoTravel-TechnicalAudit/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            text = data.decode('utf-8', 'replace') if 'text/' in response.headers.get('Content-Type', '') else ''
            doc = Document(text)
            return {'url': url, 'status': response.status, 'final': response.url,
                    'server': response.headers.get('Server'), 'bytes': len(data),
                    'type': response.headers.get('Content-Type'),
                    'robots': response.headers.get('X-Robots-Tag'),
                    'canonical': [a.get('href') for a in doc.select('link') if a.get('rel') == 'canonical']}
    except urllib.error.HTTPError as e:
        return {'url': url, 'status': e.code, 'final': e.url}
    except Exception as e:
        return {'url': url, 'error': str(e)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--live', action='store_true')
    parser.add_argument('--output', default='artifacts/seo/before.json')
    args = parser.parse_args()
    result = inventory()
    if args.live:
        urls = {ORIGIN + '/', ORIGIN + '/robots.txt', ORIGIN + '/sitemap.xml'}
        for row in result['pages']:
            urls.update(row['canonicals'])
            if row['title']:
                urls.add(ORIGIN + '/' + row['file'])
        urls.update(ORIGIN + path for path in result['missing'])
        with ThreadPoolExecutor(max_workers=6) as pool:
            result['live'] = list(pool.map(fetch, sorted(urls)))
    output = ROOT / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'pages': len(result['pages']), 'invalid_jsonld_pages': [r['file'] for r in result['pages'] if r['schema_errors']],
                      'missing_targets': result['missing'], 'live': result.get('live', [])}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
