"""Generate static, crawlable SEO metadata without rewriting article copy.

Run with the bundled Python (Pillow is used only to READ image dimensions).
Use --date YYYY-MM-DD when publishing a significant page update; otherwise
existing modification dates are retained. No dates are invented for videos.
"""
from __future__ import annotations

import argparse
import copy
from datetime import date
import html
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urljoin, urlsplit, urlunsplit
import xml.etree.ElementTree as ET

from audit_seo import Document, LD, ORIGIN, ROOT, resolve_file
from PIL import Image

NAME = 'とも旅ちゃんねるVLOG'
LOGO = ORIGIN + '/images/tomoicon.png'
FRAGMENTS = {'blog/header.html', 'blog/footer.html', 'blog/sidebar.html', 'ktv/header.html', 'test.html', 'shinsa.html', '404.html'}
SOCIAL = ['https://www.youtube.com/@TomoTravel-PM', 'https://x.com/tomotravel_pm']
ALIASES = {
    '/blog/cebu-day1.html': '/cebu2nd1', '/blog/cebu-day1': '/cebu2nd1',
    '/blog/cebu2nd1': '/cebu2nd1', '/blog/cebu2nd1.html': '/cebu2nd1',
    '/blog/cebu2nd2': '/cebu2nd2', '/blog/cebu2nd2.html': '/cebu2nd2',
    '/category/philippines-ktv': '/ktv/indexktv', '/category/philippines-ktv/': '/ktv/indexktv',
    '/blog/category/cebu': '/blog', '/blog/category/cebu/': '/blog',
    '/author/tomo': '/#about', '/author/tomo/': '/#about',
}


def canonical(path):
    if path == 'index.html':
        return ORIGIN + '/'
    if path.endswith('/index.html'):
        return ORIGIN + '/' + path[:-10].lower()
    return ORIGIN + '/' + path.removesuffix('.html').lower()


def strip_json_comments(text):
    # Match strings first so https:// inside JSON strings is never treated as a comment.
    return re.sub(r'("(?:\\.|[^"\\])*")|/\*.*?\*/|//[^\r\n]*', lambda m: m[1] or '', text, flags=re.S)


def old_graph(text):
    nodes = []
    for block in LD.findall(text):
        try:
            d = json.loads(strip_json_comments(block))
            nodes.extend(d.get('@graph', [d]))
        except (ValueError, AttributeError):
            pass  # Legacy placeholder breadcrumb blocks are rebuilt from real pages below.
    return nodes


def text_content(markup):
    return ' '.join(html.unescape(re.sub('<[^>]+>', '', markup)).split())


def metadata(text):
    return {a.get('name', a.get('property', '')): a.get('content', '') for a in Document(text).select('meta')}


def update_tag(text, tag, key, value, attrs):
    def match(m):
        parsed = Document(m[0]).select(tag)[0]
        return '' if parsed.get(key) == value else m[0]
    text = re.sub(r'<' + tag + r'\b[^>]*>', match, text, flags=re.I)
    new = '<' + tag + ' ' + ' '.join(f'{k}="{html.escape(str(v), quote=True)}"' for k, v in attrs.items()) + '>'
    return text.replace('</head>', '    ' + new + '\n</head>', 1)


def meta(text, key, value):
    attr = 'property' if key.startswith(('og:', 'article:')) else 'name'
    return update_tag(text, 'meta', attr, key, {attr: key, 'content': value})


def normalized_url(value, source, pages):
    absolute = urljoin(ORIGIN + '/' + source, html.unescape(value))
    u = urlsplit(absolute)
    if u.netloc != urlsplit(ORIGIN).netloc:
        return value
    path = u.path
    if path in ALIASES:
        return urljoin(ORIGIN, ALIASES[path]) + (('?' + u.query) if u.query else '') + (('#' + u.fragment) if u.fragment and '#' not in ALIASES[path] else '')
    file = resolve_file(absolute)
    if file:
        rel = file.relative_to(ROOT).as_posix()
        if rel in pages:
            return canonical(rel) + (('?' + u.query) if u.query else '') + (('#' + u.fragment) if u.fragment else '')
    return absolute


def normalize_links(text, source, pages):
    def link(m):
        tag = m[0]
        a = Document(tag).select('a')[0]
        value = a.get('href', '')
        if value and not value.startswith(('#', 'mailto:', 'tel:', 'javascript:')):
            target = normalized_url(value, source, pages)
            tag = re.sub(r'\bhref\s*=\s*([\"\']).*?\1', lambda _: 'href="' + html.escape(target, quote=True) + '"', tag, count=1, flags=re.S)
        if re.search(r'(?:a8\.net|afi-b\.com|af\.moshimo\.com)', value) or ('trip.com' in value and 'Allianceid' in value):
            rel = set(a.get('rel', '').split()) | {'sponsored', 'nofollow', 'noopener'}
            tag = re.sub(r'\s+rel\s*=\s*([\"\']).*?\1', '', tag, flags=re.S)
            tag = tag[:-1] + ' rel="' + ' '.join(sorted(rel)) + '">'
        return tag
    return re.sub(r'<a\b[^>]*>', link, text, flags=re.I)


def dimensions(url):
    p = resolve_file(url)
    if not p or p.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp', '.gif'}:
        return None
    try:
        with Image.open(p) as im:
            return im.size
    except OSError:
        return None


def image_urls(text, source):
    urls = []
    for a in Document(text).select('img'):
        src = urljoin(ORIGIN + '/' + source, a.get('src', ''))
        if urlsplit(src).netloc == urlsplit(ORIGIN).netloc and resolve_file(src) and src != LOGO:
            if src not in urls:
                urls.append(src)
    return urls


def common_nodes():
    return [
        {'@type': 'Organization', '@id': ORIGIN + '/#organization', 'name': NAME, 'url': ORIGIN + '/',
         'logo': {'@type': 'ImageObject', '@id': ORIGIN + '/#logo', 'url': LOGO, 'width': 500, 'height': 500}, 'sameAs': SOCIAL},
        {'@type': 'WebSite', '@id': ORIGIN + '/#website', 'url': ORIGIN + '/', 'name': NAME,
         'inLanguage': 'ja', 'publisher': {'@id': ORIGIN + '/#organization'}},
    ]


def breadcrumbs(url, title, source):
    rows = [('ホーム', ORIGIN + '/')]
    if source.startswith('blog/') or source.startswith('cebu'):
        rows.append(('ブログ', ORIGIN + '/blog'))
    elif source.startswith('ktv/') and source != 'ktv/indexktv.html':
        rows.append(('フィリピンKTV紹介', ORIGIN + '/ktv/indexktv'))
    rows.append((title, url))
    return {'@type': 'BreadcrumbList', '@id': url + '#breadcrumb', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': name, 'item': link} for i, (name, link) in enumerate(rows)
    ]}


def walk(value):
    if isinstance(value, dict):
        yield value
        for v in value.values():
            yield from walk(v)
    elif isinstance(value, list):
        for v in value:
            yield from walk(v)


def static_include(text, ident, content):
    start, end = f'<!-- seo-include:{ident}:start -->', f'<!-- seo-include:{ident}:end -->'
    if start in text:
        return re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: start + '\n' + content + '\n' + end, text, flags=re.S)
    pattern = r'(<(?P<tag>div|aside)\b[^>]*\bid=[\"\']' + re.escape(ident) + r'[\"\'][^>]*>)\s*(</(?P=tag)>)'
    return re.sub(pattern, lambda m: m[1] + start + '\n' + content + '\n' + end + m[3], text, count=1, flags=re.S)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', help='Actual date of this significant technical update, YYYY-MM-DD')
    args = parser.parse_args()
    video_metadata_path = ROOT / 'scripts/video_metadata.json'
    video_metadata = json.loads(video_metadata_path.read_text(encoding='utf-8')) if video_metadata_path.exists() else {}
    if args.date:
        date.fromisoformat(args.date)
    pages = {p.relative_to(ROOT).as_posix(): p.read_text(encoding='utf-8-sig') for p in ROOT.rglob('*.html')
             if '.git' not in p.parts and 'artifacts' not in p.parts and '<head' in p.read_text(encoding='utf-8-sig').lower()
             and p.relative_to(ROOT).as_posix() not in FRAGMENTS and p.name != 'sitemap.html'}
    pages['sitemap.html'] = (ROOT / 'sitemap.html').read_text(encoding='utf-8') if (ROOT / 'sitemap.html').exists() else ''
    # Shared fragments use root-relative or absolute links, also when inlined at /blog.
    fragments = {}
    for name in ['blog/header.html', 'blog/footer.html', 'blog/sidebar.html', 'ktv/header.html']:
        value = (ROOT / name).read_text(encoding='utf-8-sig')
        if name == 'blog/header.html':
            value = value.replace('href="./"', 'href="/blog"')
        if name == 'blog/footer.html':
            value = re.sub(r'href="#(about|videos|travel|equipment|booking|preparation|contact)"', r'href="/#\1"', value)
            if '/sitemap"' not in value:
                value = value.replace('<!-- ▼▼▼', '<a href="/sitemap">サイトマップ</a>\n                <!-- ▼▼▼', 1)
        value = normalize_links(value, name, pages)
        fragments[name] = value
        (ROOT / name).write_text(value, encoding='utf-8', newline='\n')

    records = []
    for source, original in list(pages.items()):
        if source == 'sitemap.html':
            continue
        text = original
        old = old_graph(text)
        md = metadata(text)
        title = text_content(re.search(r'<title[^>]*>(.*?)</title>', text, re.S | re.I)[1])
        url = canonical(source)
        blog_article = source.startswith('blog/') or source.startswith('cebu')
        previous = next((x for x in old if x.get('@type') in ('BlogPosting', 'Article')), {})
        description = md.get('description') or md.get('og:description') or {
            'traveltest.html': 'とも旅ちゃんねるのお仕事のご依頼・店舗紹介・取材に関するご案内とお問い合わせ。',
            'TomoGame_V1.0/index.html': 'Tomo Game - Tropical Merge Puzzle。ブラウザで楽しめるマージパズルゲーム。',
            'VideoInstructionEditor.html': 'AI動画生成の指示書を編集するブラウザツール。シーン構成や動画指示を整理できます。',
            'website/memorylog/index.html': 'Tomo Travel Memories。とも旅の旅の記録を紹介します。',
        }.get(source, title)
        description = text_content(description)
        # Preserve all editorial text; repair metadata and markup only.
        if source == 'index.html':
            text = re.sub(r'\A.*?(?=<!DOCTYPE)', '', text, count=1, flags=re.S | re.I)
            text = text.replace('<h1 class="thank-you-title">', '<h2 class="thank-you-title">').replace('お問い合わせありがとうございます！</h1>', 'お問い合わせありがとうございます！</h2>')
            text = re.sub(r'<h2(\b[^>]*>)KTVポータルはこちら！</h2>', r'<h1\1KTVポータルはこちら！</h1>', text, count=1)
            text = text.replace('.hero h2', '.hero h1')
        if source == 'cebu2nd1.html':
            text = re.sub(r'<h1 class="logo-text">(.*?)</h1>', r'<div class="logo-text">\1</div>', text, flags=re.S)
        if source == 'privacy-policy.html':
            text = text.replace('<h2 id="privacy-policy-heading">プライバシーポリシー</h2>', '<h1 id="privacy-policy-heading" style="font-size:2rem">プライバシーポリシー</h1>')
        if source in ('cebu2nd1.html', 'cebu2nd2.html'):
            text = re.sub(r'<link\b[^>]*href=[\"\'](?:\./)?style.css[\"\'][^>]*>', '', text)
        if source == 'blog/insta360x4.html':
            text = re.sub(r'<img\b[^>]*src=[\"\']\./images/insta360-x4-intro.jpg[\"\'][^>]*>', '', text)
        text = normalize_links(text, source, pages)
        for ident, fragment in [('header-placeholder', 'blog/header.html'), ('footer-placeholder', 'blog/footer.html'), ('sidebar-placeholder', 'blog/sidebar.html')]:
            text = static_include(text, ident, fragments[fragment])
        if source.startswith('ktv/'):
            text = static_include(text, 'site-header', fragments['ktv/header.html'])
        # JSON-LD is the single source of structured data. Legacy microdata had incomplete
        # VideoObjects and ImageObjects, plus conflicting author/date values.
        text = re.sub(r'<(?:meta|link)\b[^>]*\bitemprop=[\"\'][^\"\']*[\"\'][^>]*>', '', text, flags=re.I)
        text = re.sub(r'\s+item(?:prop|type|id|ref)\s*=\s*([\"\']).*?\1', '', text, flags=re.S | re.I)
        text = re.sub(r'\s+itemscope(?:\s*=\s*([\"\']).*?\1)?', '', text, flags=re.I)
        images = image_urls(text.split('seo-include:sidebar-placeholder:start')[0], source)
        image = urljoin(ORIGIN + '/' + source, md.get('og:image', ''))
        if urlsplit(image).netloc != urlsplit(ORIGIN).netloc or not resolve_file(image):
            image = images[0] if images else LOGO
        if not image.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
            image = images[0] if images else LOGO
        # Image geometry prevents avoidable layout shifts; files are not rewritten.
        def fix_image(m):
            tag = m[0]
            a = Document(tag).select('img')[0]
            size = dimensions(urljoin(ORIGIN + '/' + source, a.get('src', '')))
            extra = ''
            if size and 'width' not in a and 'height' not in a:
                extra += f' width="{size[0]}" height="{size[1]}"'
            if 'decoding' not in a:
                extra += ' decoding="async"'
            return tag.rstrip('/> ') + extra + (' />' if tag.endswith('/>') else '>')
        text = re.sub(r'<img\b[^>]*>', fix_image, text, flags=re.I)
        # If dimensions are added to fluid content images, maintain their aspect ratio.
        if 'id="seo-image-layout"' not in text:
            text = text.replace('</head>', '<style id="seo-image-layout">.blog-content img, .blog-sidebar img, .post-thumbnail img { height: auto; }</style>\n</head>', 1)
        text = LD.sub('', text)
        text = re.sub(r'<link\b[^>]*hreflang=[\"\'][^\"\']*[\"\'][^>]*>', '', text, flags=re.I)
        text = update_tag(text, 'link', 'rel', 'canonical', {'rel': 'canonical', 'href': url})
        text = update_tag(text, 'link', 'rel', 'icon', {'rel': 'icon', 'href': '/favicon.ico', 'type': 'image/x-icon'})
        values = {'description': description, 'robots': 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
                  'og:title': title, 'og:description': description, 'og:url': url, 'og:type': 'article' if blog_article or source in ['ktv/charm.html', 'ktv/lex.html', 'ktv/newkaimoana.html'] else 'website',
                  'og:site_name': NAME, 'og:locale': 'ja_JP', 'og:image': image, 'og:image:alt': title if image != LOGO else NAME,
                  'twitter:card': 'summary_large_image', 'twitter:title': title, 'twitter:description': description, 'twitter:image': image, 'twitter:image:alt': title if image != LOGO else NAME}
        size = dimensions(image)
        if size:
            values.update({'og:image:width': size[0], 'og:image:height': size[1]})
        for k, v in values.items():
            text = meta(text, k, v)
        dates = [x.get('datetime') for x in Document(text).select('time') if x.get('datetime')]
        published = dates[0] if dates else previous.get('datePublished') if source.startswith('ktv/') else None
        git_date = subprocess.run(['git', 'log', '-1', '--format=%as', '--', source], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        modified = args.date or max([v[:10] for v in [previous.get('dateModified'), md.get('article:modified_time'), git_date] + [n.get('dateModified') for n in old] if v] or ['2026-09-19'])
        graph = common_nodes()
        page = {'@type': 'CollectionPage' if source in ('blog.html', 'ktv/indexktv.html', 'website/memorylog/index.html') else 'WebPage',
                '@id': url + '#webpage', 'url': url, 'name': title, 'description': description, 'inLanguage': 'ja',
                'isPartOf': {'@id': ORIGIN + '/#website'}, 'publisher': {'@id': ORIGIN + '/#organization'}, 'dateModified': modified,
                'primaryImageOfPage': {'@type': 'ImageObject', '@id': url + '#primaryimage', 'url': image}}
        if source != 'index.html':
            page['breadcrumb'] = {'@id': url + '#breadcrumb'}
        if published:
            page['datePublished'] = published
        graph.append(page)
        if blog_article:
            heading = re.search(r'<h1\b[^>]*>(.*?)</h1>', text, re.S | re.I)
            article = {'@type': 'BlogPosting', '@id': url + '#article', 'url': url, 'headline': text_content(heading[1]) if heading else title,
                       'description': description, 'mainEntityOfPage': {'@id': url + '#webpage'}, 'isPartOf': {'@id': ORIGIN + '/#website'},
                       'author': {'@type': 'Person', '@id': ORIGIN + '/#author', 'name': 'Tomo', 'url': ORIGIN + '/#about', 'sameAs': SOCIAL},
                       'publisher': {'@id': ORIGIN + '/#organization'}, 'inLanguage': 'ja', 'isAccessibleForFree': True, 'dateModified': modified}
            if images:
                article['image'] = images
            if published:
                article['datePublished'] = published
                text = meta(text, 'article:published_time', published)
            text = meta(text, 'article:modified_time', modified)
            graph.append(article)
            page['mainEntity'] = {'@id': url + '#article'}
        elif source.startswith('ktv/'):
            for node in old:
                kind = node.get('@type')
                if kind in ('Organization', 'WebSite', 'WebPage', 'CollectionPage', 'BreadcrumbList', 'ImageObject', 'VideoObject'):
                    continue
                if source == 'ktv/indexktv.html' and kind == 'Article':
                    continue
                node = copy.deepcopy(node)
                # These existing business facts remain identical to the published page.
                def fix_urls(obj):
                    if isinstance(obj, dict):
                        return {k: fix_urls(v) for k, v in obj.items()}
                    if isinstance(obj, list):
                        return [fix_urls(v) for v in obj]
                    if isinstance(obj, str) and obj.startswith(ORIGIN):
                        return normalized_url(obj, source, pages)
                    return obj
                node = fix_urls(node)
                if kind == 'Article':
                    node['dateModified'] = modified
                    node['publisher'] = {'@id': ORIGIN + '/#organization'}
                    node['mainEntityOfPage'] = {'@id': url + '#webpage'}
                    page['mainEntity'] = {'@id': node['@id']}
                if kind == 'ItemList':
                    page['mainEntity'] = {'@id': node['@id']}
                graph.append(node)
            business = next((n for n in graph if n.get('@type') == 'NightClub' or isinstance(n.get('@type'), list)), None)
            if business:
                page['about'] = {'@id': business['@id']}
        elif source == 'lp-service.html':
            service = {'@type': 'Service', '@id': url + '#service', 'name': 'LP作成サービス', 'url': url,
                       'serviceType': 'ランディングページ制作', 'provider': {'@id': ORIGIN + '/#organization'}, 'description': description}
            graph.append(service)
            page['mainEntity'] = {'@id': service['@id']}
        # Keep only existing video metadata that describes a video actually present on this page.
        body = original.split('</head>', 1)[-1]
        seen_video = set()
        video_candidates = [n for n in walk(old) if n.get('@type') == 'VideoObject']
        for video_id in re.findall(r'(?:youtube(?:-nocookie)?\.com/embed/|data-youtube-id=[\"\'])([\w-]{11})', body):
            verified = video_metadata.get(video_id, {})
            if verified.get('uploadDate'):
                video_candidates.append({'@type': 'VideoObject', 'name': verified['title'], 'description': description,
                                         'embedUrl': 'https://www.youtube.com/embed/' + video_id, 'uploadDate': verified['uploadDate']})
        for node in video_candidates:
            if node.get('@type') != 'VideoObject' or not node.get('uploadDate'):
                continue
            embed = node.get('embedUrl', '')
            vid = re.search(r'/embed/([\w-]{11})', embed)
            if not vid or vid[1] not in body or vid[1] in seen_video:
                continue
            seen_video.add(vid[1])
            video = {k: copy.deepcopy(node[k]) for k in ('name', 'description', 'uploadDate', 'duration') if k in node}
            video.update({'@type': 'VideoObject', '@id': url + '#video-' + vid[1],
                          'embedUrl': 'https://www.youtube.com/embed/' + vid[1], 'url': 'https://www.youtube.com/watch?v=' + vid[1],
                          'thumbnailUrl': 'https://i.ytimg.com/vi/' + vid[1] + '/hqdefault.jpg', 'inLanguage': 'ja',
                          'publisher': {'@id': ORIGIN + '/#organization'}, 'isPartOf': {'@id': url + '#webpage'}})
            verified = video_metadata.get(vid[1], {})
            if verified.get('uploadDate'):
                video.update({'name': verified['title'], 'uploadDate': verified['uploadDate'], 'duration': verified['duration']})
            graph.append(video)
            if blog_article:
                article['video'] = {'@id': video['@id']}
            # Preserve stable cross-references in existing store Article / business objects.
            for obj in walk(graph):
                for k in ['video', 'subjectOf']:
                    if isinstance(obj.get(k), dict) and obj[k].get('@id', '').endswith('#video'):
                        obj[k] = {'@id': video['@id']}
        if source != 'index.html':
            graph.append(breadcrumbs(url, title, source))
        if source == 'blog.html':
            targets = []
            for a in Document(text.split('seo-include:sidebar-placeholder:start')[0]).select('a'):
                link = a.get('href', '')
                f = resolve_file(link) if link.startswith(ORIGIN) else None
                rel = f.relative_to(ROOT).as_posix() if f else ''
                if rel in pages and (rel.startswith('blog/') or rel.startswith('cebu')) and canonical(rel) not in targets:
                    targets.append(canonical(rel))
            listing = {'@type': 'ItemList', '@id': url + '#articles', 'numberOfItems': len(targets),
                       'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': v} for i, v in enumerate(targets)]}
            graph.append(listing)
            page['mainEntity'] = {'@id': listing['@id']}
        payload = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=2).replace('</', '<\\/')
        text = text.replace('</head>', '<script type="application/ld+json" id="site-structured-data">\n' + payload + '\n</script>\n</head>', 1)
        head, body_content = text.split('</head>', 1)
        text = re.sub(r'\n(?:[ \t]*\n)+', '\n\n', head) + '</head>' + body_content
        text = re.sub(r'(<a[^>]*>)[ \t]+\n', r'\1\n', text)
        # These existing applications use CRLF in Git; preserve their established
        # convention rather than changing thousands of unrelated application lines.
        newline = '\r\n' if source in {'VideoInstructionEditor.html', 'traveltest.html', 'website/memorylog/index.html'} else '\n'
        (ROOT / source).write_text(text, encoding='utf-8', newline=newline)
        records.append({'source': source, 'url': url, 'title': title, 'description': description, 'lastmod': modified, 'images': images, 'graph': graph})

    # A human-readable directory also provides plain HTML paths to every public page.
    groups = [('主要ページ', lambda r: r['source'] in ['index.html', 'blog.html', 'ktv/indexktv.html', 'traveltest.html', 'lp-service.html', 'privacy-policy.html']),
              ('KTV・JTV紹介', lambda r: r['source'].startswith('ktv/') and r['source'] != 'ktv/indexktv.html'),
              ('旅ブログ・機材', lambda r: r['source'].startswith(('blog/', 'cebu'))),
              ('その他のページ・ツール', lambda r: r['source'] in ['TomoGame_V1.0/index.html', 'VideoInstructionEditor.html', 'website/memorylog/index.html'])]
    sections = ''.join('<section><h2>' + label + '</h2><ul>' + ''.join('<li><a href="' + r['url'] + '">' + html.escape(r['title']) + '</a></li>' for r in records if predicate(r)) + '</ul></section>' for label, predicate in groups)
    sitemap_date = max(r['lastmod'] for r in records)
    directory = '<!DOCTYPE html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>サイトマップ | ' + NAME + '</title><meta name="description" content="とも旅ちゃんねるの旅ブログ、KTV・JTV紹介、サービスとツールのページ一覧。"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="' + ORIGIN + '/sitemap"><link rel="icon" href="/favicon.ico"><style>body{font-family:system-ui,sans-serif;background:#070b18;color:#e5e7eb;line-height:1.8;margin:0}main{max-width:960px;margin:auto;padding:40px 24px}a{color:#93c5fd}h1{font-size:2rem}h2{font-size:1.25rem;margin-top:2rem}li{margin:.6rem 0}footer{border-top:1px solid #334155;margin-top:2rem;padding-top:1rem}</style></head><body><main><nav aria-label="パンくず"><a href="/">ホーム</a> / サイトマップ</nav><h1>サイトマップ</h1>' + sections + '<footer><a href="/">とも旅ちゃんねるVLOG</a> · <a href="/privacy-policy">プライバシーポリシー</a></footer></main></body></html>\n'
    directory_graph = common_nodes() + [{'@type': 'CollectionPage', '@id': ORIGIN + '/sitemap#webpage', 'url': ORIGIN + '/sitemap', 'name': 'サイトマップ | ' + NAME, 'inLanguage': 'ja', 'isPartOf': {'@id': ORIGIN + '/#website'}, 'breadcrumb': {'@id': ORIGIN + '/sitemap#breadcrumb'}}, breadcrumbs(ORIGIN + '/sitemap', 'サイトマップ', 'sitemap.html')]
    directory = directory.replace('</head>', '<script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@graph': directory_graph}, ensure_ascii=False) + '</script></head>')
    (ROOT / 'sitemap.html').write_text(directory, encoding='utf-8', newline='\n')
    records.append({'source': 'sitemap.html', 'url': ORIGIN + '/sitemap', 'title': 'サイトマップ', 'lastmod': sitemap_date, 'images': [], 'graph': []})
    ns, img_ns, video_ns = 'http://www.sitemaps.org/schemas/sitemap/0.9', 'http://www.google.com/schemas/sitemap-image/1.1', 'http://www.google.com/schemas/sitemap-video/1.1'
    ET.register_namespace('', ns); ET.register_namespace('image', img_ns); ET.register_namespace('video', video_ns)
    root = ET.Element('{' + ns + '}urlset')
    for r in records:
        node = ET.SubElement(root, '{' + ns + '}url')
        ET.SubElement(node, '{' + ns + '}loc').text = r['url']
        ET.SubElement(node, '{' + ns + '}lastmod').text = r['lastmod']
        for value in r['images']:
            im = ET.SubElement(node, '{' + img_ns + '}image')
            ET.SubElement(im, '{' + img_ns + '}loc').text = value
        for v in r['graph']:
            if v.get('@type') == 'VideoObject':
                vd = ET.SubElement(node, '{' + video_ns + '}video')
                for key, target in [('thumbnailUrl', 'thumbnail_loc'), ('name', 'title'), ('description', 'description'), ('embedUrl', 'player_loc'), ('uploadDate', 'publication_date')]:
                    ET.SubElement(vd, '{' + video_ns + '}' + target).text = v[key]
    ET.indent(root, space='  ')
    ET.ElementTree(root).write(ROOT / 'sitemap.xml', encoding='utf-8', xml_declaration=True)
    llms = '# とも旅ちゃんねるVLOG\n\n> フィリピン・東南アジアの一人旅の体験、KTV・JTV紹介、旅の準備を発信する日本語サイト。\n\n運営者の体験をもとにした記事です。店舗の営業時間・料金などは各ページに記載した時点の情報であり、最新情報は店舗公式窓口をご確認ください。\n\n## ページ一覧\n\n' + '\n'.join('- [' + r['title'].replace('[', '［').replace(']', '］') + '](' + r['url'] + ')' for r in records) + '\n\n## 公式チャンネル\n\n- [YouTube](' + SOCIAL[0] + ')\n- [X](' + SOCIAL[1] + ')\n'
    (ROOT / 'llms.txt').write_text(llms, encoding='utf-8', newline='\n')
    redirects = ['# Exact permanent redirects; do not redirect all missing URLs to the home page.', '/index.html / 301!', '/index / 301!']
    for r in records:
        src, dest = '/' + r['source'], urlsplit(r['url']).path
        if src != dest and r['source'] != 'index.html':
            redirects.append(src + ' ' + dest + ' 301!')
    # Netlify normalizes trailing slashes before matching. Redirecting /x/ to /x
    # would therefore loop. Only redirect genuinely different paths.
    redirects += [src + ' ' + dest + ' 301!' for src, dest in ALIASES.items() if not src.endswith('/')]
    # The legacy game folder uses uppercase locally; Netlify serves its public URL lowercase.
    redirects += ['/tomogame_v1.0/index.html /tomogame_v1.0/ 301!', '/scripts/* /404.html 404!', '/artifacts/* /404.html 404!', '/docs/* /404.html 404!', '/readme /404.html 404!']
    (ROOT / '_redirects').write_text('\n'.join(redirects) + '\n', encoding='utf-8', newline='\n')
    out = ROOT / 'artifacts/seo/generated.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Updated {len(records)} public pages, sitemap.xml, llms.txt and redirects.')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
