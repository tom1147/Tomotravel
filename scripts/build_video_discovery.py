"""Build a video directory and focused watch pages from verified, existing videos.

Run before build_seo.py. Existing article prose, publication dates and URLs stay intact.
"""
from __future__ import annotations

import html
import json
from pathlib import Path
import re
import sys

from audit_seo import Document, LD, ORIGIN, ROOT
from site_files import write_text

UPDATE_DATE = '2026-09-21'
WATCH = {
    'uf67dP5Cg70': {
        'slug': 'charm', 'title': 'Charm Music Loungeの店内動画｜マニラ・マラテKTV',
        'description': 'マニラ・マラテのホテル内にあるCharm Music Loungeを、とも旅ちゃんねるの動画で紹介。ステージやソファ席、青紫の照明が広がる店内の雰囲気をご覧いただけます。料金とアクセスは紹介記事にまとめています。',
    },
    'T4Azkowjg14': {
        'slug': 'new-kai-moana', 'title': 'New Kai Moanaの紹介動画｜マラテJTV・休業前の店内',
        'description': 'マニラ・マラテのNew Kai Moanaを訪れた動画です。休業前の店内、ランウェイ式ショーアップ、ローテーションの様子を紹介しています。現在はリニューアルのためクローズ中とのことです。',
    },
    'z5APVNRi0FQ': {
        'slug': 'cebu-jtv', 'title': 'セブ島JTV体験動画｜B-pink・Club Kと初日の夜遊び',
        'description': 'セブ島旅行初日の夜、とも旅ちゃんねるがJTVのB-pinkとClub Kを訪れた体験動画です。お店の雰囲気や会話、現地で過ごした夜の様子を紹介。動画とあわせて体験記事も読めます。',
    },
}


def plain(text):
    return ' '.join(html.unescape(re.sub(r'<[^>]+>', '', text)).split())


def canonical(path):
    source = path.relative_to(ROOT).as_posix()
    return ORIGIN + '/' + source.removesuffix('.html')


def duration_label(value):
    match = re.fullmatch(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', value)
    if not match:
        raise ValueError('Unrecognized verified duration: ' + value)
    hours, minutes, seconds = (int(n or 0) for n in match.groups())
    return f'{hours}:{minutes:02d}:{seconds:02d}' if hours else f'{minutes}:{seconds:02d}'


def assets(text):
    if 'id="video-discovery-styles"' not in text:
        text = text.replace('</head>', '<link id="video-discovery-styles" rel="stylesheet" href="/assets/video-discovery.css">\n</head>', 1)
    if 'id="video-discovery-script"' not in text:
        text = text.replace('</body>', '<script id="video-discovery-script" src="/assets/video-discovery.js" defer></script>\n</body>', 1)
    return text


def updated(text):
    # Update only pages whose visible content changed, retaining datePublished.
    def change(match):
        data = json.loads(match[1])
        for node in data.get('@graph', []):
            if node.get('@type') in ('WebPage', 'CollectionPage', 'Article', 'BlogPosting'):
                node['dateModified'] = max(node.get('dateModified', '')[:10], UPDATE_DATE)
        return '<script type="application/ld+json" id="site-structured-data">\n' + json.dumps(data, ensure_ascii=False, indent=2) + '\n</script>'
    return LD.sub(change, text)


def card(video):
    vid = video['id']
    note = '<p class="video-card-notice">リニューアル休業中・休業前の動画</p>' if vid == 'T4Azkowjg14' else ''
    return f'''<article class="video-card">
  <a href="{video['destination']}" data-video-id="{vid}" data-video-platform="site">
    <div class="video-poster"><img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="{html.escape(video['title'], quote=True)}" width="480" height="360" loading="lazy" decoding="async"><span class="video-duration">{video['durationLabel']}</span></div>
    <h3>{html.escape(video['title'])}</h3>
  </a>
  <p><time datetime="{video['uploadDate']}">{video['uploadDate'][:10]}</time> 公開</p>{note}
</article>'''


def shell(title, description, content, graph, image):
    payload = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False).replace('</', '<\\/')
    return f'''<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}｜とも旅ちゃんねる</title>
<meta name="description" content="{html.escape(description, quote=True)}">
<meta property="og:image" content="{image}">
<link rel="preconnect" href="https://www.youtube.com"><link rel="preconnect" href="https://i.ytimg.com">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JKY9ZSJK82"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-JKY9ZSJK82');</script>
<script type="application/ld+json" id="site-structured-data">{payload}</script>
</head><body class="video-page">
<a class="video-skip" href="#video-main">本文へ移動</a>
<div id="site-header"></div>
<main id="video-main" class="video-shell">{content}</main>
<footer class="video-footer"><div class="video-shell">とも旅ちゃんねる VLOG<nav aria-label="フッター"><a href="{ORIGIN}/">トップ</a><a href="{ORIGIN}/ktv/indexktv">KTVマップ</a><a href="{ORIGIN}/blog">旅ブログ</a><a href="{ORIGIN}/privacy-policy">プライバシー</a><a href="{ORIGIN}/sitemap">サイトマップ</a></nav></div></footer>
</body></html>
'''


def main():
    metadata = json.loads((ROOT / 'scripts/video_metadata.json').read_text(encoding='utf-8'))
    sources = [ROOT / 'cebu2nd1.html', ROOT / 'cebu2nd2.html', *sorted((ROOT / 'blog').glob('*.html')), *sorted((ROOT / 'ktv').glob('*.html'))]
    catalog = []
    for path in sources:
        original = path.read_text(encoding='utf-8-sig')
        body = original.split('</head>', 1)[-1]
        ids = list(dict.fromkeys(re.findall(r'(?:youtube(?:-nocookie)?\.com/embed/|data-youtube-id=[\"\'])([\w-]{11})', body)))
        if not ids:
            continue
        vid = ids[0]
        info = metadata[vid]
        if not all(info.get(key) for key in ['title', 'uploadDate', 'duration']):
            raise ValueError('Unverified video: ' + vid)
        current = re.sub(r'\n?<!-- video-discovery:start -->.*?<!-- video-discovery:end -->\n?', '', original, flags=re.S)
        # A stable fragment works for both static iframes and the existing LEX slot.
        player = re.search(r'<(?:iframe|div)\b[^>]*(?:youtube(?:-nocookie)?\.com/embed/' + re.escape(vid) + r'|data-youtube-id=[\"\']' + re.escape(vid) + r')[^>]*>', current, re.S)
        if not player:
            raise ValueError('Cannot locate visible player: ' + str(path))
        tag = player[0]
        attributes = Document(tag).tags[0][1]
        anchor = attributes.get('id', 'article-video')
        if 'id' not in attributes:
            tag = re.sub(r'^(<\w+)', r'\1 id="article-video"', tag, count=1)
            current = current[:player.start()] + tag + current[player.end():]
        article_url = canonical(path)
        destination = ORIGIN + '/videos/' + WATCH[vid]['slug'] if vid in WATCH else article_url + '#' + anchor
        data = {**info, 'id': vid, 'source': path.relative_to(ROOT).as_posix(), 'articleUrl': article_url,
                'destination': destination, 'durationLabel': duration_label(info['duration'])}
        catalog.append(data)
        watch_link = f'<a href="{destination}" data-video-id="{vid}" data-video-platform="site">動画を大きく見る</a>' if vid in WATCH else f'<a href="#{anchor}">記事の動画へ</a>'
        nav = f'''\n<!-- video-discovery:start -->
<nav class="video-discovery" aria-label="この記事の動画">{watch_link}<a href="https://www.youtube.com/watch?v={vid}" target="_blank" rel="noopener noreferrer" data-video-id="{vid}" data-video-platform="youtube">YouTubeで見る</a><a href="{ORIGIN}/videos/">動画一覧</a></nav>
<!-- video-discovery:end -->\n'''
        current, count = re.subn(r'(<h1\b[^>]*>.*?</h1>)', lambda m: m[1] + nav, current, count=1, flags=re.S)
        if count != 1:
            raise ValueError('Cannot locate article heading: ' + str(path))
        current = updated(assets(current))
        write_text(path, current)

    catalog.sort(key=lambda v: v['uploadDate'], reverse=True)
    if len({v['id'] for v in catalog}) != len(catalog):
        raise ValueError('Duplicate catalog video')
    video_dir = ROOT / 'videos'
    video_dir.mkdir(exist_ok=True)
    groups = [('manila', 'マニラ・マラテのKTV動画', [v for v in catalog if v['source'].startswith('ktv/')]),
              ('cebu', 'セブ島の一人旅・JTV体験動画', [v for v in catalog if not v['source'].startswith('ktv/')])]
    title = 'フィリピン旅行・KTV動画一覧｜マニラ・セブ島'
    description = 'とも旅ちゃんねるのマニラ・マラテKTV紹介、セブ島JTV体験、ホテル、街歩き、一人旅の動画を一覧で探せます。店内の雰囲気は動画で、料金やアクセスは紹介記事で確認できます。'
    sections = ''.join(f'<section id="{ident}" class="video-collection"><h2>{heading}</h2><div class="video-grid">' + ''.join(card(v) for v in videos) + '</div></section>' for ident, heading, videos in groups)
    content = f'''<nav class="video-breadcrumb" aria-label="パンくず"><a href="{ORIGIN}/">ホーム</a><span>動画一覧</span></nav>
<h1>マニラも、セブ島も。<br>動画で旅の雰囲気を知る。</h1><p class="video-intro">{description}</p>
<nav class="video-categories" aria-label="動画のエリア"><a href="#manila">マニラ・マラテ</a><a href="#cebu">セブ島</a><a href="{ORIGIN}/ktv/indexktv">KTVマップ</a><a href="https://www.youtube.com/@TomoTravel-PM/videos" target="_blank" rel="noopener noreferrer">チャンネルの新着</a></nav>{sections}'''
    graph = [{'@type':'CollectionPage', '@id':ORIGIN+'/videos/#webpage', 'dateModified':UPDATE_DATE},
             {'@type':'ItemList', '@id':ORIGIN+'/videos/#videos', 'name':'フィリピン旅行・KTV動画一覧', 'numberOfItems':len(catalog),
              'itemListElement':[{'@type':'ListItem','position':i+1,'url':v['destination'],'name':v['title']} for i,v in enumerate(catalog)]}]
    write_text(video_dir / 'index.html', assets(shell(title, description, content, graph, 'https://i.ytimg.com/vi/uf67dP5Cg70/hqdefault.jpg')))
    for vid, detail in WATCH.items():
        video = next(v for v in catalog if v['id'] == vid)
        url = ORIGIN + '/videos/' + detail['slug']
        notice = '<p class="video-notice">※New Kai Moanaは現在リニューアルのためクローズ中とのことです。休業前の記録としてご覧ください。（2026年9月19日追記）</p>' if vid == 'T4Azkowjg14' else ''
        related = [v for v in catalog if v['id'] != vid and v['source'].startswith('ktv/') == video['source'].startswith('ktv/')][:3]
        content = f'''<nav class="video-breadcrumb" aria-label="パンくず"><a href="{ORIGIN}/">ホーム</a><a href="{ORIGIN}/videos/">動画一覧</a></nav>
<h1>{html.escape(detail['title'])}</h1><p class="video-meta">とも旅ちゃんねる · {video['durationLabel']} · <time datetime="{video['uploadDate']}">{video['uploadDate'][:10]}</time> 公開</p>
<div class="video-player"><iframe src="https://www.youtube.com/embed/{vid}?rel=0&amp;playsinline=1" title="{html.escape(video['title'], quote=True)}" width="1120" height="630" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
<div class="video-actions"><a href="https://www.youtube.com/watch?v={vid}" target="_blank" rel="noopener noreferrer" data-video-id="{vid}" data-video-platform="youtube">YouTubeで見る</a><a href="{video['articleUrl']}">紹介記事を読む</a></div>{notice}
<p class="video-description">{detail['description']}</p>
<section class="video-related"><h2>あわせて見たい動画</h2><div class="video-grid">{''.join(card(v) for v in related)}</div></section>'''
        graph = [{'@type':'WebPage','@id':url+'#webpage','dateModified':UPDATE_DATE},
                 {'@type':'VideoObject','name':video['title'],'description':detail['description'],'uploadDate':video['uploadDate'],'duration':video['duration'],
                  'thumbnailUrl':f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg','embedUrl':f'https://www.youtube.com/embed/{vid}'}]
        write_text(video_dir / (detail['slug'] + '.html'), assets(shell(detail['title'], detail['description'], content, graph, f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg')))

    # Keep this module in the existing KTV route, directly after the map.
    path = ROOT / 'ktv/indexktv.html'
    text = path.read_text(encoding='utf-8')
    text = re.sub(r'\n?<!-- ktv-video-picks:start -->.*?<!-- ktv-video-picks:end -->\n?', '', text, flags=re.S)
    picks = '<!-- ktv-video-picks:start -->\n<section class="ktv-video-picks" aria-labelledby="ktv-videos-heading"><h2 id="ktv-videos-heading">マラテのKTVを動画で見てみる</h2><p>店内やショーアップの雰囲気を動画で紹介しています。気になったお店は、紹介記事で料金やアクセスも確認できます。</p><div class="video-grid">' + ''.join(card(v) for v in catalog if v['source'].startswith('ktv/')) + '</div><div class="video-discovery"><a href="' + ORIGIN + '/videos/">セブ島の動画も見る</a></div></section>\n<!-- ktv-video-picks:end -->\n'
    text = text.replace('    <section id="latest-articles"', picks + '\n    <section id="latest-articles"', 1)
    write_text(path, updated(assets(text)))
    # The catalog is generated from public, verified video metadata only.
    out = ROOT / 'artifacts/seo/video-discovery-catalog.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Updated video links in {len(catalog)} articles; built one directory and {len(WATCH)} watch pages.')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
