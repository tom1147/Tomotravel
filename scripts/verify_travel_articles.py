"""Check the publication contract for the reviewed travel archive."""
from collections import Counter
import html
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, urljoin

from PIL import Image
from audit_seo import Document, LD, ORIGIN, ROOT, resolve_file
from build_travel_articles import SERIES, hub_path, route, PUBLISHED


def verify():
    errors = []
    rows = json.loads((ROOT / 'docs/travel-articles.json').read_text(encoding='utf-8'))['articles']
    videos = json.loads((ROOT / 'scripts/video_metadata.json').read_text(encoding='utf-8'))
    expected_counts = {'thailand': 8, 'manila': 7, 'kanazawa': 1, 'cebu4': 7, 'hochiminh2': 9,
                       'manila-cebu': 11, 'takanawa': 1, 'manila2': 9, 'manila3': 1,
                       'hanoi-hochiminh': 4, 'hochiminh': 6}
    counts = Counter(r['series'] for r in rows)
    if counts != expected_counts:
        errors.append(f'Wrong series inventory: {counts}')
    for key in ('slug', 'file', 'youtubeId'):
        if len({r[key] for r in rows}) != len(rows):
            errors.append(f'Duplicate {key}')
    images_count = 0
    # Episode 4 explicitly reuses a room photo from episode 1 and credits that
    # exact video in its caption; this is a sourced retrospective reference.
    credited_video_references = {'hochiminh4': {'7xOr6yXy8E8'}}
    for row in rows:
        source = row['file']
        text = (ROOT / source).read_text(encoding='utf-8')
        doc = Document(text)
        body = text.split('</head>', 1)[-1]
        title = re.findall(r'<h1\b[^>]*>(.*?)</h1>', body, re.S)
        if len(title) != 1 or html.unescape(re.sub('<[^>]+>', '', title[0])) != row['youtubeTitle']:
            errors.append(f'{source}: H1 does not match the verified YouTube title')
        frames = [f for f in doc.select('iframe') if 'youtube.com/embed/' in f.get('src', '')]
        if len(frames) != 1 or '/embed/' + row['youtubeId'] not in frames[0]['src']:
            errors.append(f'{source}: wrong/missing YouTube player')
        graph = json.loads(LD.findall(text)[0])['@graph']
        article = next((n for n in graph if n.get('@type') == 'BlogPosting'), {})
        video = next((n for n in graph if n.get('@type') == 'VideoObject'), {})
        for key in ['name', 'uploadDate', 'duration']:
            expected = videos[row['youtubeId']].get('title' if key == 'name' else key)
            if video.get(key) != expected:
                errors.append(f'{source}: VideoObject {key} differs from official video metadata')
        if article.get('datePublished') != PUBLISHED:
            errors.append(f'{source}: article date must not be backdated to video publication')
        if row['imageStatus'] != 'complete' or len(row['images']) < (1 if row.get('isLegacy') else 2):
            errors.append(f'{source}: images not complete')
        section_ids = {s['id'] for s in row['sections']}
        for pic in row['images']:
            if not row.get('isLegacy') and pic.get('sectionId') not in section_ids:
                errors.append(f'{source}: orphaned photo section {pic.get("sectionId")}')
            path = ROOT / pic['output']
            if not path.exists():
                errors.append(f'{source}: missing photo {pic["output"]}')
                continue
            with Image.open(path) as im:
                if im.size != (pic['width'], pic['height']):
                    errors.append(f'{source}: incorrect image geometry {pic["output"]}')
            if not path.with_name(path.stem + '-720.webp').exists():
                errors.append(f'{source}: missing responsive image {pic["output"]}')
            if not row.get('isLegacy') and f'images/travel/{row["slug"]}/' not in pic['output']:
                errors.append(f'{source}: image belongs to another trip')
            images_count += 1
        ids = [attrs['id'] for _, attrs in doc.tags if attrs.get('id')]
        if len(ids) != len(set(ids)):
            errors.append(f'{source}: duplicate HTML IDs')
        for link in doc.select('a'):
            value = link.get('href', '')
            if value.startswith('#') and value[1:] not in ids:
                errors.append(f'{source}: broken section anchor {value}')
            target = urljoin(ORIGIN + '/' + source, value)
            allowed_videos = {row['youtubeId']} | credited_video_references.get(row['slug'], set())
            if urlsplit(target).netloc == 'www.youtube.com' and '/watch' in target and not any(vid in target for vid in allowed_videos):
                errors.append(f'{source}: section links to a different video')
        if row.get('skipChapterTimes') and re.search(r'(?:&amp;|&)t=\d+s', body):
            errors.append(f'{source}: timestamp links must be omitted for re-edited public video')
        head = re.search(r'<header class="travel-header">(.*?)</header>', body, re.S)[1]
        if not any(urlsplit(a.get('href', '')).path == '/games/' for a in Document(head).select('a')):
            errors.append(f'{source}: no games menu')
        for kind, attr in [('img', 'src'), ('script', 'src'), ('link', 'href')]:
            for el in doc.select(kind):
                value = el.get(attr, '')
                if value.startswith('/') and not resolve_file(value):
                    errors.append(f'{source}: missing local dependency {value}')
    for series, count in expected_counts.items():
        path = ROOT / hub_path(series)
        text = path.read_text(encoding='utf-8')
        card_count = len(re.findall(r'<article class="post-card"', text))
        if card_count != count:
            errors.append(f'{path.name}: wrong number of episode cards')
        episodes = sorted(r['episode'] for r in rows if r['series'] == series)
        if episodes != list(range(1, count + 1)):
            errors.append(f'{series}: non-contiguous episodes')
    blog = (ROOT / 'blog.html').read_text(encoding='utf-8')
    cards = re.findall(r'<article class="post-card"[^>]*>(.*?)</article>', blog, re.S)
    targets = [urlsplit(Document(card).select('a')[0]['href']).path for card in cards]
    if len(targets) != 85 or len(set(targets)) != 85:
        errors.append('Blog directory must contain 85 distinct stories')
    for row in rows:
        if route(row['file']) not in targets:
            errors.append(f'{row["file"]}: not linked from blog')
    report = {'stories': len(rows), 'new_source_videos': len([r for r in rows if not r.get('isLegacy')]),
              'series': dict(counts), 'reviewed_hero_and_body_photos': images_count, 'blog_cards': len(cards), 'errors': errors}
    out = ROOT / 'artifacts/travel-archive/verification.json'
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return not errors


if __name__ == '__main__':
    raise SystemExit(0 if verify() else 1)
