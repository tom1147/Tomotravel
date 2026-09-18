"""Regression checks for crawlability, JSON-LD and the generated sitemap."""
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit, urljoin
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

from audit_seo import Document, LD, ORIGIN, ROOT, resolve_file


def walk(value, key=''):
    yield key, value
    if isinstance(value, dict):
        for k, v in value.items():
            yield from walk(v, k)
    elif isinstance(value, list):
        for v in value:
            yield from walk(v, key)


def main():
    errors = []
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'i': 'http://www.google.com/schemas/sitemap-image/1.1', 'v': 'http://www.google.com/schemas/sitemap-video/1.1'}
    sitemap = ET.parse(ROOT / 'sitemap.xml').getroot()
    locations = [n.text for n in sitemap.findall('s:url/s:loc', ns)]
    if len(locations) != len(set(locations)):
        errors.append('Duplicate sitemap URLs')
    robots = RobotFileParser()
    robots.parse((ROOT / 'robots.txt').read_text(encoding='utf-8').splitlines())
    link_graph = {}
    schema_count = 0
    video_count = 0
    image_count = 0
    for url in locations:
        path = resolve_file(url)
        if not path:
            errors.append(f'Missing page: {url}')
            continue
        source = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding='utf-8-sig')
        doc = Document(text)
        md = [a for a in doc.select('meta') if a.get('name') == 'description']
        canonical = [a.get('href') for a in doc.select('link') if a.get('rel') == 'canonical']
        if canonical != [url]:
            errors.append(f'{source}: canonical {canonical} differs from sitemap {url}')
        if len(md) != 1 or not md[0].get('content'):
            errors.append(f'{source}: missing or duplicate description')
        if not text.lower().startswith('<!doctype html>'):
            errors.append(f'{source}: content before doctype')
        if 'noindex' in ','.join(a.get('content', '') for a in doc.select('meta') if a.get('name') == 'robots'):
            errors.append(f'{source}: indexable page has noindex')
        for bot in ['Googlebot', 'Bingbot', 'OAI-SearchBot']:
            if not robots.can_fetch(bot, url):
                errors.append(f'{source}: blocked for {bot}')
        blocks = LD.findall(text)
        if len(blocks) != 1:
            errors.append(f'{source}: expected one JSON-LD graph, got {len(blocks)}')
        try:
            graph = json.loads(blocks[0])['@graph']
        except (ValueError, IndexError, KeyError) as e:
            errors.append(f'{source}: invalid JSON-LD: {e}')
            continue
        schema_count += len(graph)
        ids = [n['@id'] for n in graph if '@id' in n]
        if len(ids) != len(set(ids)):
            errors.append(f'{source}: duplicate graph identifiers')
        for key, value in walk(graph):
            if isinstance(value, dict) and value.get('@type') == 'VideoObject':
                video_count += 1
                for required in ['name', 'description', 'thumbnailUrl', 'uploadDate', 'embedUrl']:
                    if not value.get(required):
                        errors.append(f'{source}: video lacks {required}')
                if 'contentUrl' in value and 'youtube.com/watch' in value['contentUrl']:
                    errors.append(f'{source}: watch URL used as video file')
                vid = value['embedUrl'].split('/embed/')[-1]
                if vid not in text.split('</head>', 1)[-1]:
                    errors.append(f'{source}: marked-up video is not present')
            if isinstance(value, str) and value.startswith(ORIGIN) and key in ['url', 'contentUrl', 'image', 'logo', 'item']:
                if not resolve_file(value):
                    errors.append(f'{source}: broken schema URL {value}')
        for a in doc.select('meta'):
            if a.get('property') == 'og:image' or a.get('name') == 'twitter:image':
                if not a.get('content', '').startswith('https://') or not resolve_file(a['content']):
                    errors.append(f'{source}: invalid social image {a.get("content")}')
        outgoing = set()
        for tag, attr in [('a', 'href'), ('img', 'src'), ('script', 'src'), ('link', 'href')]:
            for a in doc.select(tag):
                value = a.get(attr, '')
                if not value or value.startswith(('#', 'mailto:', 'tel:', 'javascript:', 'data:')):
                    continue
                target = urljoin(url, value)
                if urlsplit(target).netloc == urlsplit(ORIGIN).netloc:
                    if not resolve_file(target):
                        errors.append(f'{source}: broken {tag} target {target}')
                    if tag == 'a':
                        outgoing.add(target.split('#')[0].split('?')[0])
        link_graph[url] = outgoing
        for ident in ['header-placeholder', 'footer-placeholder', 'sidebar-placeholder', 'site-header']:
            if f'id="{ident}"' in text and f'seo-include:{ident}:start' not in text:
                errors.append(f'{source}: {ident} depends on JavaScript')
    reachable, todo = set(), [ORIGIN + '/']
    while todo:
        current = todo.pop()
        if current in reachable:
            continue
        reachable.add(current)
        todo.extend(link_graph.get(current, set()) - reachable)
    for url in set(locations) - reachable:
        errors.append(f'No crawlable HTML path from home: {url}')
    for node in sitemap.findall('s:url', ns):
        for image in node.findall('i:image/i:loc', ns):
            image_count += 1
            if not resolve_file(image.text):
                errors.append(f'Missing sitemap image {image.text}')
        for vd in node.findall('v:video', ns):
            for name in ['thumbnail_loc', 'title', 'description', 'player_loc', 'publication_date']:
                if not vd.findtext('v:' + name, namespaces=ns):
                    errors.append('Incomplete video sitemap entry: ' + name)
    if '/category/philippines-ktv/' in locations:
        errors.append('404 category remains in sitemap')
    report = {'pages': len(locations), 'schema_entities': schema_count, 'videos': video_count,
              'sitemap_images': image_count, 'reachable_pages': len(set(locations) & reachable), 'errors': sorted(set(errors))}
    for line in (ROOT / '_redirects').read_text(encoding='utf-8').splitlines():
        if line.startswith('#') or not line.strip():
            continue
        source, target, status = line.split()[:3]
        if status.startswith('30') and source.rstrip('/') == target.rstrip('/'):
            errors.append('Netlify trailing-slash redirect loop: ' + line)
    report['errors'] = sorted(set(errors))
    out = ROOT / 'artifacts/seo/verification.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return bool(errors)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
