"""Read public YouTube metadata for videos already embedded in the site."""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
import json
import re
import sys
import urllib.request
from audit_seo import ROOT, Document


def fetch(video_id):
    url = 'https://www.youtube.com/watch?v=' + video_id
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            doc = Document(response.read().decode('utf-8'))
        values = {v.get('itemprop', v.get('name')): v.get('content') for v in doc.select('meta')}
        result = {k: values.get(k) for k in ['title', 'uploadDate', 'duration']}
        if not all(result.values()):
            return video_id, {'error': 'Public metadata unavailable', 'source': url}
        return video_id, {**result, 'source': url, 'checkedOn': date.today().isoformat()}
    except Exception as e:
        return video_id, {'error': str(e), 'source': url}


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    ids = set()
    for path in ROOT.rglob('*.html'):
        if '.git' in path.parts or 'artifacts' in path.parts:
            continue
        text = path.read_text(encoding='utf-8-sig').split('</head>', 1)[-1]
        ids.update(re.findall(r'(?:youtube(?:-nocookie)?\.com/embed/|data-youtube-id=[\"\'])([\w-]{11})', text))
    with ThreadPoolExecutor(max_workers=3) as pool:
        data = dict(pool.map(fetch, sorted(ids)))
    (ROOT / 'scripts/video_metadata.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'verified': sum('error' not in v for v in data.values()), 'failures': {k: v for k, v in data.items() if 'error' in v}}, ensure_ascii=False))
