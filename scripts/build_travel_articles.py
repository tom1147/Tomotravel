"""Render reviewed travel stories; production never needs the source drives.

Use --refresh while editing to freeze research and completed image manifests.
Use --strict before publishing to require every requested article and image.
Then run build_seo.py to refresh the site-wide graph and directories.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone, timedelta
import html
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

from audit_seo import Document, ORIGIN, ROOT
from site_files import write_text

BASE = ROOT / 'artifacts/travel-archive'
DATA = ROOT / 'docs/travel-articles.json'
PUBLISHED = json.loads(DATA.read_text(encoding='utf-8'))['publishedOn'] if DATA.exists() else '2026-10-11'
SERIES = {
    'thailand': ('タイ編', 'THAILAND', 'タイ', 'wide-editorial', 'cobalt-paper', 'バンコクからパタヤへ。初めてのタイを、移動も寄り道もそのままに。'),
    'manila': ('マニラ編', 'MANILA', 'フィリピン', 'night-journal', 'navy-amber', '初めてのマニラ。街の熱気、ホテル、食事、そして夜の出来事。'),
    'kanazawa': ('金沢編', 'KANAZAWA', '日本', 'heritage', 'ivory-vermilion', '冬の金沢で、市場を歩いてお寿司を食べる。ひとりの時間を楽しむ一日。'),
    'cebu4': ('セブ島フォース編', 'CEBU / FOURTH JOURNEY', 'フィリピン', 'night-journal', 'ink-teal', 'また戻ってきたセブ。再会も失敗も、旅の続きを綴ります。'),
    'hochiminh2': ('ホーチミンセカンド編', 'HO CHI MINH CITY / SECOND JOURNEY', 'ベトナム', 'city-notes', 'jade-paper', '二度目のホーチミン。歩き慣れた街にも、まだ知らない顔がありました。'),
    'manila-cebu': ('マニラ・セブ最終回編', 'MANILA TO CEBU', 'フィリピン', 'photo-essay', 'graphite-copper', 'マニラからセブへ。ホテル、夜の街、人との出会いをつなぐ旅。'),
    'takanawa': ('高輪ゲートウェイ編', 'TAKANAWA GATEWAY', '日本', 'architecture', 'white-cobalt', '新しい東京の街を歩く。高輪ゲートウェイと、その周辺の風景。'),
    'manila2': ('マニラセカンド編', 'MANILA / SECOND JOURNEY', 'フィリピン', 'city-notes', 'paper-saffron', '市場へ、マラテへ、夜の街へ。もう少し深くマニラを知る旅。'),
    'manila3': ('マニラサード編', 'MANILA / THIRD JOURNEY', 'フィリピン', 'travel-diary', 'paper-coral', '出発前から波乱のひとり旅。三度目のマニラへの道のり。'),
    'hanoi-hochiminh': ('ハノイ・ホーチミン編', 'HANOI & HO CHI MINH CITY', 'ベトナム', 'heritage', 'ivory-lacquer', 'ハノイから始まるベトナムの旅。街歩き、カフェ、夜の出会いを記録します。'),
    'hochiminh': ('ホーチミン編', 'HO CHI MINH CITY / FIRST JOURNEY', 'ベトナム', 'city-notes', 'jade-paper', '初めてのホーチミン。空港から市内へ、カフェから夜の街へ。全6回の旅行記。'),
}


def esc(value):
    return html.escape(str(value), quote=True)


def plain(markup):
    return html.unescape(re.sub(r'<[^>]+>', '', markup)).strip()


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save_json(path, value):
    write_text(path, json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def japan_date(value):
    return datetime.fromisoformat(value).astimezone(timezone(timedelta(hours=9))).date().isoformat()


def hub_path(series):
    return 'blog/hochiminh.html' if series == 'hochiminh' else f'blog/series-{series}.html'


def route(file):
    return '/' + file.removesuffix('.html')


def clock(seconds):
    seconds = int(float(seconds))
    return f'{seconds // 60:02}:{seconds % 60:02}'


def duration_clock(value):
    parts = re.fullmatch(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', value)
    h, m, s = [int(x or 0) for x in parts.groups()]
    return clock(h * 3600 + m * 60 + s)


def freeze_legacy():
    """Capture the six reviewed drafts once, before changing their presentation."""
    path = ROOT / 'docs/travel-legacy-articles.json'
    if path.exists():
        return read_json(path)
    metadata = read_json(BASE / 'youtube-metadata.json')
    ids = ['7xOr6yXy8E8', '6qQDsV-Hco0', 'dBa2MZrDyLA', '8kUN9mQad7w', 'qWZj225B5uU', 'cwyNmj6or5g']
    rows = []
    for i, vid in enumerate(ids, 1):
        file = f'blog/hochiminh{i}.html'
        text = (ROOT / file).read_text(encoding='utf-8-sig')
        md = {a.get('name', a.get('property')): a.get('content') for a in Document(text).select('meta')}
        intro = re.search(r'<div class="intro">(.*?)</div>', text, re.S)[1]
        secs = []
        for ident, body in re.findall(r'<section class="story-section" id="([^"]+)">(.*?)</section>', text, re.S):
            heading = re.search(r'<h2[^>]*>(.*?)</h2>', body, re.S)
            title = plain(heading[1].replace('<br>', ''))
            content = body[heading.end():]
            content = content.replace('../images/', '/images/')
            content = re.sub(r'<img ', '<img data-editorial-image ', content)
            secs.append({'id': ident, 'title': title, 'legacyHtml': content})
        poster = re.search(r'<button[^>]*data-video-launch[^>]*>(.*?)</button>', text, re.S)[1]
        im = Document(poster).select('img')[0]
        first_date = Document(text).select('time')[0]['datetime']
        rows.append({'slug': f'hochiminh{i}', 'series': 'hochiminh', 'episode': i, 'file': file,
                     'youtubeId': vid, 'youtubeTitle': metadata[vid]['title'], 'uploadDate': metadata[vid]['uploadDate'],
                     'duration': metadata[vid]['duration'], 'summary': md['description'], 'recordedOn': first_date,
                     'location': 'ホーチミン', 'themes': ['walk', 'food', 'night'] if i > 1 else ['walk', 'hotel', 'food'],
                     'leadHtml': intro, 'sections': secs, 'keyFacts': [], 'closing': [], 'isLegacy': True,
                     'images': [{'index': 1, 'output': im['src'].replace('../', ''), 'width': int(im['width']),
                                 'height': int(im['height']), 'alt': im['alt'], 'processing': 'image_gen'}],
                     'heroIndex': 1, 'imageStatus': 'complete'})
    save_json(path, rows)
    return rows


def freeze_legacy_index():
    path = ROOT / 'docs/travel-legacy-index.json'
    if path.exists():
        return read_json(path)
    text = (ROOT / 'blog.html').read_text(encoding='utf-8-sig')
    rows = []
    for attrs, card in re.findall(r'<article\b([^>]*class="post-card"[^>]*)>(.*?)</article>', text, re.S):
        links = Document(card).select('a')
        url = links[0]['href']
        src = urlsplit(url).path
        title = plain(re.search(r'<h2[^>]*>(.*?)</h2>', card, re.S)[1])
        pic = Document(card).select('img')[0]
        dates = Document(card).select('time')
        ps = re.findall(r'<p[^>]*>(.*?)</p>', card, re.S)
        rows.append({'url': src, 'title': title, 'image': pic['src'], 'alt': pic.get('alt', title),
                     'width': pic.get('width', 480), 'height': pic.get('height', 270), 'summary': plain(ps[0]) if ps else '',
                     'date': dates[0].get('datetime', '') if dates else '', 'country': 'フィリピン', 'seriesLabel': 'セブ島旅行記',
                     'themes': re.search(r'data-topics="([^"]+)"', attrs)[1].split()})
    # Equipment article was not present in the old list; keep it discoverable too.
    file = ROOT / 'blog/insta360x4.html'
    text = file.read_text(encoding='utf-8-sig')
    md = {a.get('name', a.get('property')): a.get('content') for a in Document(text).select('meta')}
    rows.append({'url': '/blog/insta360x4', 'title': plain(re.search(r'<h1[^>]*>(.*?)</h1>', text, re.S)[1]),
                 'summary': md.get('description', ''), 'image': md.get('og:image', '/images/tomoicon.png'),
                 'alt': 'Insta360 X4の記事', 'width': 480, 'height': 270, 'date': '', 'country': '旅の機材',
                 'seriesLabel': '旅の機材', 'themes': ['tips']})
    save_json(path, rows)
    return rows


def refresh():
    inventory = read_json(BASE / 'inventory.json')
    videos = read_json(BASE / 'youtube-metadata.json')
    rows = []
    for item in inventory:
        editorial = BASE / 'editorial' / (item['slug'] + '.json')
        if not editorial.exists():
            continue
        draft = read_json(editorial)
        images_file = BASE / 'image-results' / (item['slug'] + '.json')
        photos = read_json(images_file) if images_file.exists() else {'images': [], 'status': 'pending', 'heroIndex': 1}
        # Keep local source paths and editor-only cautions out of the public dataset.
        fields = ['slug', 'summary', 'lead', 'recordedOn', 'location', 'themes', 'keyFacts', 'sections', 'closing']
        row = {key: draft.get(key) for key in fields}
        row.update({key: item[key] for key in ['series', 'episode', 'youtubeId', 'youtubeTitle', 'uploadDate']})
        row.update({'file': f"blog/{item['slug']}.html", 'duration': videos[item['youtubeId']]['duration'],
                    'images': [{k: im[k] for k in ['index', 'sectionId', 'time', 'output', 'width', 'height', 'alt', 'processing'] if k in im}
                               for im in photos['images']], 'heroIndex': photos.get('heroIndex', 1), 'imageStatus': photos['status'],
                    'subtitleSource': item.get('subtitleSource', 'local-japanese-subtitles'), 'skipChapterTimes': item['slug'] == 'hochiminh2-01'})
        rows.append(row)
    rows += freeze_legacy()
    freeze_legacy_index()
    save_json(DATA, {'publishedOn': PUBLISHED, 'articles': rows})
    # Merge rather than replace metadata used by the existing Cebu/store pages.
    existing = read_json(ROOT / 'scripts/video_metadata.json')
    for vid, info in videos.items():
        existing[vid] = {key: info[key] for key in ['title', 'uploadDate', 'duration']}
        existing[vid].update({'source': f'https://www.youtube.com/watch?v={vid}', 'checkedOn': info.get('checkedOn', '2026-10-11')})
    save_json(ROOT / 'scripts/video_metadata.json', existing)
    return rows


def header():
    return '''<a class="skip-link" href="#main-content">本文へ移動</a>
<header class="travel-header"><div class="travel-shell header-inner"><a class="travel-brand" href="/" aria-label="とも旅ちゃんねる ホーム"><img src="/images/tomoicon.png" width="40" height="40" alt=""><span>とも旅ちゃんねる<small>ひとりで歩いた、旅の記録。</small></span></a><nav aria-label="メインメニュー"><a href="/blog" aria-current="true">旅のブログ</a><a href="/videos/">動画</a><a href="/games/">ゲーム</a></nav></div></header>'''


def footer():
    return '''<footer class="travel-footer"><div class="travel-shell"><a class="footer-brand" href="/">とも旅ちゃんねる</a><p>楽しかったことも、うまくいかなかったことも。自分で歩いた旅を、動画と文章で。</p><nav aria-label="フッターメニュー"><a href="/blog">旅のブログ</a><a href="/videos/">動画一覧</a><a href="/games/">ゲーム</a><a href="https://www.youtube.com/@TomoTravel-PM" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="/sitemap">サイトマップ</a><a href="/privacy-policy">プライバシーポリシー</a></nav><div class="footer-last"><span>© 2026 とも旅ちゃんねるVLOG</span><a href="#top">ページの先頭へ ↑</a></div></div></footer>'''


def shell(title, description, body, *, series='', page_type='article', image='', file='blog.html'):
    style = SERIES.get(series, ('', '', '', 'wide-editorial', 'cobalt-paper', ''))
    series_meta = f'<meta name="travel-series-name" content="{style[0]}"><meta name="travel-series-url" content="{ORIGIN + route(hub_path(series))}">' if series else ''
    return f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JKY9ZSJK82"></script>
<script>window.dataLayer = window.dataLayer || []; function gtag(){{dataLayer.push(arguments);}} gtag('js', new Date()); gtag('config', 'G-JKY9ZSJK82');</script>
<title>{esc(title)} | とも旅ちゃんねるVLOG</title>
<meta name="description" content="{esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large">
<meta name="referrer" content="strict-origin-when-cross-origin"><meta name="travel-page-type" content="{page_type}">
{series_meta}
<meta property="article:published_time" content="{PUBLISHED}"><meta property="article:modified_time" content="{PUBLISHED}">
<meta property="og:image" content="{ORIGIN + '/' + image.lstrip('/') if image else ORIGIN + '/images/tomoicon.png'}">
<link rel="canonical" href="{ORIGIN + route(file)}"><link rel="icon" href="/favicon.ico">
<link rel="stylesheet" href="/assets/travel-editorial.css?v=20261011"><script src="/assets/travel-editorial.js?v=20261011" defer></script>
</head><body id="top" class="travel-site layout-{style[3]} palette-{style[4]}" data-page-type="{page_type}">{header()}
{body}
{footer()}</body></html>
'''


def hero(row):
    return next((im for im in row['images'] if im['index'] == row['heroIndex']), next(iter(row['images']), None))


def image_tag(im, eager=False, sizes='(min-width: 1100px) 1060px, 94vw', editorial=True):
    src = '/' + im['output'].lstrip('/')
    small = src.removesuffix('.webp') + '-720.webp'
    loading = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return f'<img {"data-editorial-image" if editorial else ""} src="{esc(src)}" srcset="{esc(small)} 720w, {esc(src)} 1440w" sizes="{sizes}" width="{im["width"]}" height="{im["height"]}" alt="{esc(im["alt"])}" {loading} decoding="async">'


def video(row):
    vid, title = row['youtubeId'], row['youtubeTitle']
    pic = hero(row)
    poster = (f'<button class="video-poster" type="button" data-play-video hidden aria-label="YouTubeで本編を再生：{esc(title)}">{image_tag(pic, eager=True)}<span class="play-symbol" aria-hidden="true">▶</span><span class="poster-label">この旅を動画で見る<span>{duration_clock(row["duration"])}</span></span></button>') if pic else ''
    return f'''<section class="travel-video" aria-label="この旅行記のYouTube動画" data-youtube-id="{vid}"><div class="video-ratio"><iframe src="https://www.youtube.com/embed/{vid}?rel=0" title="{esc(title)}" width="1280" height="720" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>{poster}</div><div class="video-foot"><span>とも旅ちゃんねる · 本編動画</span><a href="https://www.youtube.com/watch?v={vid}" target="_blank" rel="noopener noreferrer">YouTubeで見る ↗</a></div></section>'''


def time_link(row, seconds, label='動画のこの場面'):
    if seconds is None or row.get('skipChapterTimes'):
        return ''
    return f'<a class="chapter-link" href="https://www.youtube.com/watch?v={row["youtubeId"]}&amp;t={int(float(seconds))}s" target="_blank" rel="noopener noreferrer">{label} {clock(seconds)} ↗</a>'


def contents(row):
    return '<ol>' + ''.join(f'<li><a href="#{esc(s["id"])}"><span>{i:02}</span>{esc(s["title"])}</a></li>' for i, s in enumerate(row['sections'], 1)) + '</ol>'


def article(row, articles):
    label, english, country, layout, palette, _ = SERIES[row['series']]
    siblings = sorted([r for r in articles if r['series'] == row['series']], key=lambda r: r['episode'])
    seq = next(i for i, r in enumerate(siblings) if r['slug'] == row['slug'])
    date_label = '2日目の記録' if row['slug'] == 'manila3-01' else '撮影'
    record = f'{date_label} <time datetime="{row["recordedOn"]}">{row["recordedOn"].replace("-", ".")}</time>' if row.get('recordedOn') else '動画をもとにした旅の記録'
    mast = f'''<header class="story-opening"><nav class="travel-breadcrumb" aria-label="パンくず"><a href="/blog">旅のブログ</a><span>/</span><a href="{route(hub_path(row['series']))}">{label}</a><span>/</span><span>第{row['episode']}回</span></nav><div class="opening-grid"><div><p class="eyebrow">{english} <span>{row['episode']:02} / {len(siblings):02}</span></p><h1>{esc(row['youtubeTitle'])}</h1></div><div class="opening-note"><p>{esc(row['summary'])}</p><div class="story-byline"><img src="/images/tomoicon.png" alt="" width="32" height="32"><span>とも / Tomo<small>{record}</small></span></div></div></div></header>'''
    intro = row.get('leadHtml') or ''.join(f'<p>{esc(p)}</p>' for p in row['lead'])
    body = []
    for i, section in enumerate(row['sections'], 1):
        if section.get('legacyHtml'):
            markup = section['legacyHtml']
        else:
            paragraphs = section['paragraphs']
            markup = time_link(row, section.get('start'))
            for n, p in enumerate(paragraphs):
                markup += f'<p>{esc(p)}</p>'
                if n == 0:
                    for im in row['images']:
                        if im.get('sectionId') == section['id']:
                            markup += f'<figure class="story-photo">{image_tag(im, sizes="(min-width:1100px) 760px, 94vw")}<figcaption>{esc(im["alt"])} {time_link(row, im.get("time"), "動画")}</figcaption></figure>'
        body.append(f'<section class="story-section" id="{esc(section["id"])}"><p class="section-number" aria-hidden="true">{i:02}</p><h2>{esc(section["title"])}</h2>{markup}</section>')
    closing = '<section class="story-section closing"><h2>この旅を振り返って</h2>' + ''.join(f'<p>{esc(p)}</p>' for p in row['closing']) + '</section>' if row.get('closing') else ''
    facts = ''.join(f'<div><dt>{esc(f["label"])}</dt><dd>{esc(f["value"])} {time_link(row, f.get("sourceTime"), "出典")}</dd></div>' for f in (row.get('keyFacts') or []))
    notes = f'<section class="trip-facts"><h2>今回の旅のメモ</h2><dl>{facts}</dl><p>料金・設備・利用条件は動画撮影時の記録です。</p></section>' if facts else ''
    prev_next = []
    for pos, name, rel in [(seq - 1, '← 前の旅', 'prev'), (seq + 1, '次の旅 →', 'next')]:
        if 0 <= pos < len(siblings):
            other = siblings[pos]
            prev_next.append(f'<a href="{route(other["file"])}" rel="{rel}"><small>{name} · 第{other["episode"]}回</small><span>{esc(other["youtubeTitle"])}</span></a>')
    series_links = ''.join(f'<a href="{route(s["file"])}" {"aria-current=page" if s["slug"] == row["slug"] else ""}>第{s["episode"]}回</a>' for s in siblings)
    pic = hero(row)
    source_note = '日本語字幕・本編映像' if row.get('subtitleSource') != 'official-youtube-auto-ja' else '本編映像・YouTubeの日本語自動字幕'
    source = f'''<section class="story-source" aria-label="記事と写真の出典"><h2>この記録について</h2><p>{source_note}をもとに、Tomoの旅を時系列でまとめました。感想や料金は訪問時のものです。写真は本編から切り出し、一部はAIによる画像補修で国旗・字幕・テロップを除去しています。元映像のプライバシー保護のぼかしは維持しています。</p><p>出典：<a href="https://www.youtube.com/watch?v={row['youtubeId']}" target="_blank" rel="noopener noreferrer">{esc(row['youtubeTitle'])}</a>（動画公開 {japan_date(row['uploadDate']).replace('-', '.')}）</p><p>記事公開・更新 <time datetime="{PUBLISHED}">{PUBLISHED.replace('-', '.')}</time> · 書き手 <a href="/#about">とも / Tomo</a></p></section>'''
    page = f'''<main id="main-content" class="travel-shell article-main" tabindex="-1">{mast}{video(row)}<div class="reading-grid"><article class="story-prose"><div class="story-intro">{intro}</div><p class="record-note">{esc(row['location'])}の旅行記。掲載情報は撮影時点の体験です。</p><details class="mobile-contents"><summary>この記事の目次</summary>{contents(row)}</details>{''.join(body)}{closing}{notes}{source}<div class="share-line"><button type="button" data-copy-link>記事リンクをコピー</button><span data-copy-status role="status" aria-live="polite"></span></div><nav class="story-next" aria-label="前後の記事">{''.join(prev_next)}</nav></article><aside class="story-rail"><div class="rail-sticky"><nav class="desktop-contents" aria-label="この記事の目次"><h2>この記事の目次</h2>{contents(row)}</nav><div class="rail-series"><p class="eyebrow">TRAVEL SERIES</p><h2><a href="{route(hub_path(row['series']))}">{label}</a></h2><nav aria-label="シリーズの各回">{series_links}</nav><a class="rail-all" href="{route(hub_path(row['series']))}">シリーズ一覧へ →</a></div><a class="rail-game" href="/games/">旅の合間に、ゲームでひと休み ↗</a></div></aside></div></main>'''
    write_text(ROOT / row['file'], shell(row['youtubeTitle'], row['summary'], page, series=row['series'], image=pic['output'] if pic else '', file=row['file']))


def card(row):
    label, _, country, *_ = SERIES[row['series']]
    if row['slug'] == 'manila-cebu-11':
        country = '日本'
    pic = hero(row)
    image = image_tag(pic, sizes='(min-width:1100px) 350px, (min-width:650px) 46vw, 92vw', editorial=False) if pic else ''
    return f'''<article class="post-card" data-topics="{' '.join(row['themes'])}" data-country="{country}" data-series="{row['series']}"><a class="post-image" href="{route(row['file'])}" tabindex="-1" aria-hidden="true">{image}<span>{row['episode']:02}</span></a><div class="post-copy"><p class="post-kicker">{label} · 第{row['episode']}回</p><h2><a href="{route(row['file'])}">{esc(row['youtubeTitle'])}</a></h2><p>{esc(row['summary'])}</p><small>動画公開 {japan_date(row['uploadDate']).replace('-', '.')}</small></div></article>'''


def series_hub(series, rows):
    label, english, country, layout, palette, description = SERIES[series]
    path = hub_path(series)
    photo = hero(rows[0])
    page = f'''<main id="main-content" class="travel-shell series-main" tabindex="-1"><nav class="travel-breadcrumb" aria-label="パンくず"><a href="/blog">旅のブログ</a><span>/</span><span>{label}</span></nav><header class="collection-opening"><div><p class="eyebrow">{english} / {len(rows):02} STORIES</p><h1>{label}</h1><p>{description}</p><a class="collection-start" href="{route(rows[0]['file'])}">第1回から読む →</a></div><figure>{image_tag(photo, eager=True, sizes="(min-width:1100px) 540px, 92vw", editorial=False) if photo else ''}</figure></header><div class="collection-meta"><span>{country} · とも / Tomoの旅行記</span><span>{len(rows)}記事</span></div><section class="article-grid" aria-label="{label}の記事一覧">{''.join(card(row) for row in rows)}</section><nav class="collection-bottom" aria-label="ブログ一覧へ"><a href="/blog">すべての旅を見る →</a><a href="/games/">ゲームで遊ぶ ↗</a></nav></main>'''
    write_text(ROOT / path, shell(label + '｜動画と写真で読む旅行記', description, page, series=series, page_type='series', image=photo['output'] if photo else '', file=path))


def blog_index(rows):
    old = freeze_legacy_index()
    display_order = ['hanoi-hochiminh', 'manila3', 'manila2', 'takanawa', 'manila-cebu', 'hochiminh2', 'cebu4', 'hochiminh', 'thailand', 'manila', 'kanazawa']
    series_links = []
    for name in display_order:
        group = [row for row in rows if row['series'] == name]
        if group:
            series_links.append(f'<a href="{route(hub_path(name))}"><span>{SERIES[name][0]}</span><small>{len(group):02}記事</small><span aria-hidden="true">↗</span></a>')
    cards = ''.join(card(row) for name in display_order for row in rows if row['series'] == name)
    for row in old:
        cards += f'''<article class="post-card" data-topics="{' '.join(row['themes'])}" data-country="{row['country']}" data-series="legacy"><a class="post-image" href="{esc(row['url'])}" tabindex="-1" aria-hidden="true"><img src="{esc(row['image'])}" alt="{esc(row['alt'])}" width="{row['width']}" height="{row['height']}" loading="lazy" decoding="async"></a><div class="post-copy"><p class="post-kicker">{row['seriesLabel']}</p><h2><a href="{esc(row['url'])}">{esc(row['title'])}</a></h2><p>{esc(row['summary'])}</p></div></article>'''
    featured = next((r for r in rows if r['slug'] == 'takanawa-01' and hero(r)), next(r for r in rows if hero(r)))
    pic = hero(featured)
    count = len(rows) + len(old)
    topic_names = [('all', 'すべて'), ('walk', '街歩き'), ('hotel', 'ホテル'), ('food', '食事・カフェ'), ('night', '夜の街'), ('tips', '移動・旅のメモ')]
    topics = ''.join(f'<button type="button" data-filter-topic="{key}" aria-pressed="{str(key == "all").lower()}">{label}</button>' for key, label in topic_names)
    page = f'''<main id="main-content" class="travel-shell blog-main" tabindex="-1"><header class="blog-opening"><div><p class="eyebrow">TOMO TRAVEL JOURNAL</p><h1>ひとりで歩く。<br>その街を、知る。</h1><p>タイ、ベトナム、フィリピン。そして日本。<br>食事も、移動も、夜の街も。動画と写真で読む、ともの旅。</p><a class="collection-start" href="#articles">{count}本の旅行記を読む ↓</a></div><a class="blog-feature" href="{route(featured['file'])}">{image_tag(pic, eager=True, sizes="(min-width:1100px) 700px, 94vw", editorial=False)}<span><small>{SERIES[featured['series']][0]} · 第{featured['episode']}回</small>{esc(featured['youtubeTitle'])}<b aria-hidden="true">↗</b></span></a></header><section class="series-directory" aria-labelledby="series-title"><div class="index-section-heading"><h2 id="series-title">シリーズから選ぶ</h2><p>旅の始まりから、順番に。</p></div><div class="series-directory-links">{''.join(series_links)}<a href="#articles" data-legacy-filter><span>セブ島 ファースト・セカンド・サード</span><small>20記事</small><span aria-hidden="true">↓</span></a></div></section><section id="articles" class="archive-section" aria-labelledby="articles-title"><div class="index-section-heading"><h2 id="articles-title">すべての旅行記</h2><p>{count} STORIES</p></div><form class="archive-search" role="search"><label for="travel-query">記事を探す</label><input id="travel-query" type="search" placeholder="地名・お店・気になること" autocomplete="off"><label class="country-label" for="travel-country">旅先</label><select id="travel-country"><option value="all">すべての旅先</option><option>タイ</option><option>ベトナム</option><option>フィリピン</option><option>日本</option><option>旅の機材</option></select><button type="reset">リセット</button></form><div class="topic-filters" role="group" aria-label="記事のテーマ">{topics}</div><p class="archive-status" role="status" aria-live="polite">{count}件の記事</p><div class="article-grid">{cards}</div><p class="archive-empty" hidden>該当する記事がありません。地名やテーマを変えて探してみてください。</p><div class="archive-more" hidden><button type="button" data-show-more>続きを表示 ↓</button></div></section></main>'''
    write_text(ROOT / 'blog.html', shell('旅ブログ｜タイ・ベトナム・フィリピン・日本のひとり旅', 'とも旅ちゃんねるの旅行記。タイ、マニラ、セブ、ホーチミン、ハノイ、金沢、高輪ゲートウェイを、本人の動画と写真で紹介。旅先・シリーズ・テーマから記事を探せます。', page, page_type='index', image=pic['output'], file='blog.html'))


def full_text(rows):
    def readable_legacy(markup):
        markup = re.sub(r'</(?:p|figcaption|tr|h[1-6])>', '\n\n', markup)
        markup = re.sub(r'</(?:td|th)>', ' | ', markup)
        return plain(markup)
    output = ['# とも旅ちゃんねるVLOG — 旅行記本文', '', '> 各記事と同じ体験記の本文です。営業時間・価格・設備は撮影時点の記録です。公開動画と記事URLを出典として併記しています。', '']
    for row in rows:
        output += ['## ' + row['youtubeTitle'], '', '記事: ' + ORIGIN + route(row['file']), 'シリーズ: ' + SERIES[row['series']][0] + f' 第{row["episode"]}回', '出典動画: https://www.youtube.com/watch?v=' + row['youtubeId'], '動画公開日: ' + japan_date(row['uploadDate']), '記事公開日: ' + PUBLISHED]
        if row.get('recordedOn'):
            output.append(('2日目の記録: ' if row['slug'] == 'manila3-01' else '撮影日: ') + row['recordedOn'])
        output += ['', row['summary'], '']
        if row.get('leadHtml'):
            output.append(readable_legacy(row['leadHtml']))
        else:
            output.extend(row['lead'])
        for sec in row['sections']:
            output += ['', '### ' + sec['title'], '']
            output.extend(sec.get('paragraphs') or [readable_legacy(sec['legacyHtml'])])
        output += row.get('closing') or []
        output += ['', '---', '']
    text = '\n'.join(line.strip() for line in '\n\n'.join(output).splitlines())
    write_text(ROOT / 'llms-full.txt', re.sub(r'\n{3,}', '\n\n', text).rstrip() + '\n')


def main():
    global PUBLISHED
    p = argparse.ArgumentParser()
    p.add_argument('--refresh', action='store_true')
    p.add_argument('--strict', action='store_true')
    p.add_argument('--date', help='Actual first-publication date for this batch, YYYY-MM-DD')
    args = p.parse_args()
    if args.date:
        datetime.fromisoformat(args.date)
        PUBLISHED = args.date
    rows = refresh() if args.refresh else read_json(DATA)['articles']
    if args.strict:
        assert len(rows) == 64, f'Expected 58 new + 6 existing stories, got {len(rows)}'
        incomplete = [r['slug'] for r in rows if r['imageStatus'] != 'complete' or not r['images']]
        assert not incomplete, 'Incomplete images: ' + ', '.join(incomplete)
        for row in rows:
            for im in row['images']:
                assert (ROOT / im['output']).exists(), im['output']
                assert (ROOT / im['output'].replace('.webp', '-720.webp')).exists(), im['output']
    for row in rows:
        article(row, rows)
    for series in SERIES:
        group = [row for row in rows if row['series'] == series]
        if group:
            series_hub(series, group)
    blog_index(rows)
    full_text(rows)
    print(f'Rendered {len(rows)} stories, {len(set(r["series"] for r in rows))} series hubs, blog index and llms-full.txt.')


if __name__ == '__main__':
    main()
