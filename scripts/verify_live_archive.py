"""Read-only check that the deployed archive and its hero images are reachable."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import html
import json
from pathlib import Path
import re
import urllib.request
import urllib.error
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


def fetch(url, *, head=False):
    request = urllib.request.Request(url, method='HEAD' if head else 'GET', headers={
        'User-Agent': 'TomoTravel-PublicationCheck/1.0', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=35) as response:
        return {'status': response.status, 'url': response.url, 'type': response.headers.get('Content-Type', ''),
                'text': '' if head else response.read().decode('utf-8', 'replace')}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--origin', default='https://tomotravel-pm.com')
    p.add_argument('--sha')
    args = p.parse_args()
    origin = args.origin.rstrip('/')
    rows = json.loads((ROOT / 'docs/travel-articles.json').read_text(encoding='utf-8'))['articles']
    checks = []
    for row in rows:
        checks.append({'path': '/' + row['file'].removesuffix('.html'), 'title': row['youtubeTitle'], 'video': row['youtubeId']})
    hubs = sorted(set('/blog/hochiminh' if r['series'] == 'hochiminh' else '/blog/series-' + r['series'] for r in rows))
    checks += [{'path': path} for path in hubs]
    checks += [{'path': '/blog', 'cards': 85}, {'path': '/games/'}, {'path': '/sitemap.xml'}, {'path': '/llms.txt'}, {'path': '/llms-full.txt'}]
    photos = sorted(set('/' + next((p for p in r['images'] if p['index'] == r['heroIndex']), r['images'][0])['output'] for r in rows))
    checks += [{'path': path, 'head': True} for path in photos]
    def check(item):
        url = origin + item['path']
        try:
            result = fetch(url, head=item.get('head', False))
            errors = []
            if result['status'] != 200:
                errors.append('HTTP ' + str(result['status']))
            if item.get('title'):
                titles = re.findall(r'<h1\b[^>]*>(.*?)</h1>', result['text'], re.S)
                actual = html.unescape(re.sub(r'<[^>]+>', '', titles[0])) if titles else ''
                if actual != item['title']:
                    errors.append('Article title differs')
                if '/embed/' + item['video'] not in result['text']:
                    errors.append('Expected YouTube player missing')
            if item.get('cards') and len(re.findall(r'<article class="post-card"', result['text'])) != item['cards']:
                errors.append('Blog card count differs')
            if item.get('head') and not result['type'].startswith('image/'):
                errors.append('Hero image content type differs')
            return {'path': item['path'], 'status': result['status'], 'errors': errors}
        except Exception as exc:
            return {'path': item['path'], 'errors': [str(exc)]}
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, checks))
    errors = [r for r in results if r['errors']]
    report = {'origin': origin, 'checks': len(results), 'passed': len(results) - len(errors), 'failures': errors}
    if args.sha:
        status = json.loads(fetch('https://api.github.com/repos/tom1147/Tomotravel/commits/' + args.sha + '/status')['text'])
        report['commit'] = args.sha
        report['githubStatus'] = status.get('state')
        report['deployChecks'] = [{key: s.get(key) for key in ['context', 'state', 'target_url', 'description']} for s in status.get('statuses', [])]
    out = ROOT / 'artifacts/travel-archive/live-verification.json'
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return not errors


if __name__ == '__main__':
    raise SystemExit(0 if main() else 1)
