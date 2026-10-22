import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n';

/**
 * 制作実績のデータ。
 * 文章は言語ごと（en / ja / zh）に持ち、画像やURLなど言語に依存しない情報は共通で持ちます。
 * 画像は src/assets 以下のファイル名で指定します。存在しない画像を指定するとビルドが失敗します。
 * 画像の説明（alt）も3言語で書きます。ギャラリーでは画像の下に説明として表示されます。
 */

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.{webp,png,jpg}', { eager: true });

export function img(path: string): ImageMetadata {
  const hit = files[`../assets/${path}`];
  if (!hit) throw new Error(`画像が見つかりません: src/assets/${path}`);
  return hit.default;
}

/** 3言語の文字列 */
type L = Record<Lang, string>;
const l = (en: string, ja: string, zh: string): L => ({ en, ja, zh });

type RawShot = { src: ImageMetadata; alt: L };
export type Shot = { src: ImageMetadata; alt: string };

type WorkText = {
  name: string;
  /** 一覧カードに出す短い説明 */
  short: string;
  genre: string;
  summary: string;
  audience?: string;
  role: string;
  design?: { title: string; body: string }[];
  features: string[];
  /** ゲーム用の見出し */
  headline?: string;
};

type RawWork = {
  slug: string;
  kind: 'web' | 'video' | 'game';
  url?: string;
  /** URL表示用（https:// を除いたもの） */
  urlLabel?: string;
  /** 店舗サイト：共通ドメインの注記を出すかどうか */
  sharedDomain?: boolean;
  /** モックアップのブラウザのタブに表示する名前（実際のサイトのタイトル） */
  tabTitle?: string;
  /** 展示パネルの背景色（作品の世界観に合わせた夜の色） */
  tint: string;
  /** パネルにうっすら差す光の色（作品のキーカラー） */
  glow: string;
  cover: RawShot;
  desktop?: RawShot;
  desktopFull?: RawShot;
  mobile?: RawShot;
  mobileFull?: RawShot;
  gallery?: { pc: RawShot[]; sp: RawShot[] };
  text: Record<Lang, WorkText>;
};

const works: RawWork[] = [
  {
    slug: 'tomo-travel',
    kind: 'web',
    url: 'https://tomotravel-pm.com/',
    urlLabel: 'tomotravel-pm.com',
    tabTitle: 'とも旅ちゃんねるVLOG',
    tint: '#0C1730',
    glow: '#E2C27A',
    cover: {
      src: img('works/tomo-travel/desktop.webp'),
      alt: l('Tomo Travel homepage: a night sea and starry sky with the headline “Solo travel in Southeast Asia, on video”', 'Tomo Travelのトップページ。夜の海と星空の写真に「東南アジアの一人旅を動画で。」の見出し', 'Tomo Travel首页：夜晚的海面与星空，配有“用视频记录东南亚独自旅行”的标题'),
    },
    desktop: { src: img('works/tomo-travel/desktop.webp'), alt: l('Tomo Travel homepage on desktop', 'Tomo TravelのトップページのPC表示', 'Tomo Travel首页（电脑端）') },
    desktopFull: { src: img('works/tomo-travel/desktop-full.webp'), alt: l('The full Tomo Travel homepage on desktop', 'Tomo Travelのトップページ全体（PC表示）', 'Tomo Travel完整首页（电脑端）') },
    mobile: { src: img('works/tomo-travel/mobile.webp'), alt: l('Tomo Travel homepage on mobile', 'Tomo Travelのトップページのスマートフォン表示', 'Tomo Travel首页（手机端）') },
    mobileFull: { src: img('works/tomo-travel/mobile-full.webp'), alt: l('The full Tomo Travel homepage on mobile', 'Tomo Travelのトップページ全体（スマートフォン表示）', 'Tomo Travel完整首页（手机端）') },
    gallery: {
      pc: [
        { src: img('works/tomo-travel/blog-d0.webp'), alt: l('Travel blog index: photos and article titles on a light background', '旅ブログの一覧ページ。明るい背景に写真と記事タイトルが並ぶ', '旅行博客列表页：明亮背景上排列着照片和文章标题') },
        { src: img('works/tomo-travel/article-d0.webp'), alt: l('An article from the Ho Chi Minh City travel journal series', 'ホーチミン旅行記シリーズの記事ページ', '胡志明市旅行记系列的文章页面') },
      ],
      sp: [
        { src: img('works/tomo-travel/mobile.webp'), alt: l('Homepage on mobile', 'トップページのスマートフォン表示', '首页（手机端）') },
        { src: img('works/tomo-travel/blog-m0.webp'), alt: l('Travel blog index on mobile', '旅ブログ一覧のスマートフォン表示', '旅行博客列表（手机端）') },
        { src: img('works/tomo-travel/article-m0.webp'), alt: l('Travel journal article on mobile', '旅行記の記事ページのスマートフォン表示', '旅行记文章页面（手机端）') },
      ],
    },
    text: {
      en: {
        name: 'Tomo Travel',
        short: 'A travel media site linked to my YouTube channel — every article and game made by me.',
        genre: 'Travel media and YouTube companion site',
        summary:
          'The official website for my travel YouTube channel. Beyond designing and building the site, I write the articles and made both of the games you can play on it. It gathers the prices, directions and travel tips that don’t fit in a video, so viewers can move between videos and articles while planning their trip.',
        audience: 'Japanese travelers planning trips to Southeast Asia (the Philippines, Vietnam, Thailand and more), and viewers of the channel',
        role: 'Planning, design, development, writing, game development and operation',
        design: [
          { title: 'The channel’s world on the homepage', body: 'A large photo of the night sea and stars brings the channel’s “travel at night” mood straight to the homepage.' },
          { title: 'Bright, readable articles', body: 'Blog and travel-journal pages switch to a light palette, with a magazine-like layout made for reading photos and text.' },
          { title: 'Typography built for phones', body: 'Most visitors arrive from videos on their phones, so type size, line spacing and photo sizes are tuned for mobile first.' },
        ],
        features: [
          'Two-way links between articles and videos (related videos in articles, articles from the video list)',
          'Articles organized by region and series — Cebu, Manila, Ho Chi Minh City and more',
          'Video directory and KTV guide pages',
          'Two original games (the merge puzzle “Tomo Game” and the tower defense game “Tomo Nightwalker”)',
          'Contact form',
          'SEO basics such as structured data and sitemaps',
          'Responsive design',
        ],
      },
      ja: {
        name: 'Tomo Travel',
        short: 'YouTubeチャンネルと連動した旅行メディア。記事やゲームも含めて、すべて自分で制作しています。',
        genre: '旅行メディア・YouTube連携サイト',
        summary:
          '自分で運営している旅行YouTube「とも旅ちゃんねる」の公式サイトです。サイトのデザインと実装だけでなく、旅行記などの記事や、サイトで遊べる2本のゲームもすべて自分で制作しています。動画だけでは伝えきれない料金やアクセス、旅の情報を記事にまとめ、動画と記事を行き来しながら旅の準備ができる旅行メディアとして運営しています。',
        audience: 'フィリピン・ベトナム・タイなど、東南アジアへの旅行を考えている日本人旅行者と、チャンネルの視聴者',
        role: '企画・デザイン・実装・記事執筆・ゲーム制作・運営',
        design: [
          { title: '動画の世界観をそのままトップに', body: '夜の海と星空の写真を大きく使い、チャンネルの「旅の夜」の雰囲気をトップページで伝えています。' },
          { title: '読みものは明るく、読みやすく', body: 'ブログや旅行記のページは明るい配色に切り替え、写真と文章をじっくり読める誌面のようなデザインにしています。' },
          { title: 'スマートフォンで読む前提の文字組み', body: '動画から訪れる人の多くはスマートフォン。文字サイズ、行間、写真の大きさをスマートフォンを基準に整えています。' },
        ],
        features: [
          '記事と動画の相互リンク（記事内の関連動画、動画一覧から紹介記事へ）',
          'セブ島・マニラ・ホーチミンなど、地域とシリーズ別の記事構成',
          '動画一覧ページとKTV情報ページ',
          'オリジナルゲーム2本（マージパズル「Tomo Game」、タワーディフェンス「Tomo Nightwalker」）',
          'お問い合わせフォーム',
          '構造化データやサイトマップなど、SEOの基本設定',
          'レスポンシブデザイン',
        ],
      },
      zh: {
        name: 'Tomo Travel',
        short: '与我的YouTube频道联动的旅行媒体网站，文章和游戏也都由我亲手制作。',
        genre: '旅行媒体・YouTube联动网站',
        summary:
          '我运营的旅行YouTube频道的官方网站。不仅是网站的设计与开发，旅行记等文章，以及网站上可以玩的两款游戏，也全部由我亲手制作。把视频里讲不完的价格、交通和旅行信息整理成文章，让观众可以在视频和文章之间来回浏览，轻松做好旅行准备。',
        audience: '计划前往菲律宾、越南、泰国等东南亚地区旅行的日本游客，以及频道观众',
        role: '策划・设计・开发・撰稿・游戏制作・运营',
        design: [
          { title: '把频道的世界观搬到首页', body: '首页大面积使用夜晚海面与星空的照片，传达频道“夜之旅”的氛围。' },
          { title: '文章页面明亮易读', body: '博客和旅行记页面切换为明亮配色，采用杂志般的版式，方便细读照片和文字。' },
          { title: '以手机阅读为前提的排版', body: '从视频进入的访客大多使用手机，因此以手机为基准调整了字号、行距和图片大小。' },
        ],
        features: [
          '文章与视频互相链接（文章内的相关视频、从视频列表跳转到介绍文章）',
          '按宿务、马尼拉、胡志明市等地区和系列整理的文章结构',
          '视频列表页和KTV信息页',
          '两款原创游戏（合成解谜游戏“Tomo Game”、塔防游戏“Tomo Nightwalker”）',
          '联系表单',
          '结构化数据、网站地图等基础SEO设置',
          '响应式设计',
        ],
      },
    },
  },
  {
    slug: 'k-amigo',
    kind: 'web',
    url: 'https://k-amigo.com/',
    urlLabel: 'k-amigo.com',
    tabTitle: 'K.AMIGO KTV BAR',
    tint: '#22091E',
    glow: '#FF4FCF',
    cover: {
      src: img('works/k-amigo/desktop.webp'),
      alt: l('K.AMIGO KTV BAR homepage: a neon-style logo and the headline “Make your night more glamorous”', 'K.AMIGO KTV BARのトップページ。ネオン調のロゴと「夜をもっと華やかに」の見出し', 'K.AMIGO KTV BAR首页：霓虹风格的标志和“让夜晚更加华丽”的标题'),
    },
    desktop: { src: img('works/k-amigo/desktop.webp'), alt: l('K.AMIGO KTV BAR homepage on desktop', 'K.AMIGO KTV BARのトップページのPC表示', 'K.AMIGO KTV BAR首页（电脑端）') },
    desktopFull: { src: img('works/k-amigo/desktop-full.webp'), alt: l('The full K.AMIGO KTV BAR page on desktop', 'K.AMIGO KTV BARのページ全体（PC表示）', 'K.AMIGO KTV BAR完整页面（电脑端）') },
    mobile: { src: img('works/k-amigo/mobile.webp'), alt: l('K.AMIGO KTV BAR on mobile', 'K.AMIGO KTV BARのスマートフォン表示', 'K.AMIGO KTV BAR（手机端）') },
    mobileFull: { src: img('works/k-amigo/mobile-full.webp'), alt: l('The full K.AMIGO KTV BAR page on mobile', 'K.AMIGO KTV BARのページ全体（スマートフォン表示）', 'K.AMIGO KTV BAR完整页面（手机端）') },
    gallery: {
      pc: [
        { src: img('works/k-amigo/d0.webp'), alt: l('Pricing section with rates for each time slot shown as cards', '料金システムのセクション。時間帯ごとの料金をカードで表示', '价格体系板块：用卡片展示各时段的价格') },
        { src: img('works/k-amigo/d1.webp'), alt: l('Drink and food menu section', 'ドリンク・フードメニューのセクション', '饮品・餐食菜单板块') },
      ],
      sp: [
        { src: img('works/k-amigo/m0.webp'), alt: l('Pricing on mobile', '料金システムのスマートフォン表示', '价格体系（手机端）') },
        { src: img('works/k-amigo/m1.webp'), alt: l('Menu on mobile', 'メニューのスマートフォン表示', '菜单（手机端）') },
        { src: img('works/k-amigo/m2.webp'), alt: l('Directions and contact via the official LINE account, on mobile', 'アクセスと公式LINEへの問い合わせ案内のスマートフォン表示', '交通指引与官方LINE咨询入口（手机端）') },
      ],
    },
    text: {
      en: {
        name: 'K.AMIGO',
        short: 'A site for a Japanese-style KTV bar in Manila, made for Japanese visitors.',
        genre: 'Website for an overseas venue',
        summary:
          'The official site of K.AMIGO KTV BAR, a Japanese-style KTV bar in Malate, Manila. It’s structured so Japanese visitors can check everything they want to know before visiting — prices, menus, location and how to book — on a single page.',
        audience: 'Japanese travelers visiting Manila and Japanese residents',
        role: 'Design, development and launch',
        design: [
          { title: 'Neon nights as the brand', body: 'Inspired by Manila’s neon nightlife, a dark design lets the pink glow capture the venue’s atmosphere.' },
          { title: 'Japanese headlines take center stage', body: 'Large Japanese headlines lead the page, with English used as an atmospheric accent.' },
          { title: 'Photos and video show the venue', body: 'A photo gallery and an introduction video let first-time guests see inside before they visit.' },
        ],
        features: [
          'Pricing by time slot',
          'Food and drink menus',
          'Embedded introduction video',
          'Photo gallery',
          'Directions with Google Maps',
          'Booking and inquiries via the official LINE account',
          'FAQ',
          'Mobile friendly',
        ],
      },
      ja: {
        name: 'K.AMIGO',
        short: 'マニラの日本式KTV。日本人のお客様向けの店舗サイト。',
        genre: '海外店舗向けWebサイト',
        summary:
          'フィリピン・マニラのマラテ地区にある日本式KTV「K.AMIGO KTV BAR」の公式サイトです。現地を訪れる日本人のお客様が、来店前に知りたい料金、メニュー、場所、予約方法を1ページで確認できるように構成しました。',
        audience: 'マニラを訪れる日本人旅行者・現地在住の日本人',
        role: 'デザイン・実装・公開',
        design: [
          { title: 'ネオンの夜をブランドに', body: 'マニラの夜のネオンをモチーフに、ピンクの光が映えるダーク基調のデザインで店舗の雰囲気を表現しています。' },
          { title: '日本語の見出しを主役に', body: '「夜をもっと華やかに」など日本語の見出しを大きく扱い、英語は雰囲気を添えるアクセントとして使っています。' },
          { title: '写真と動画で店内を伝える', body: '店内写真のギャラリーと紹介動画で、初めての人でも来店前にお店の様子がわかるようにしています。' },
        ],
        features: [
          '料金システム（時間帯別の料金表）',
          'フード・ドリンクメニュー',
          '店内紹介動画の埋め込み',
          '写真ギャラリー',
          'Googleマップを使ったアクセス案内',
          '公式LINEへの予約・問い合わせ導線',
          'よくある質問',
          'スマートフォン対応',
        ],
      },
      zh: {
        name: 'K.AMIGO',
        short: '马尼拉的日式KTV，面向日本客人的店铺网站。',
        genre: '海外店铺网站',
        summary:
          '菲律宾马尼拉马拉特区日式KTV“K.AMIGO KTV BAR”的官方网站。为了让来访的日本客人在到店前就能在一个页面里查看价格、菜单、位置和预约方式，对内容结构做了专门设计。',
        audience: '前往马尼拉的日本游客及当地的日本居民',
        role: '设计・开发・上线',
        design: [
          { title: '把霓虹之夜变成品牌', body: '以马尼拉夜晚的霓虹为主题，在深色基调上让粉色光芒更加醒目，表现店铺的氛围。' },
          { title: '以日语标题为主角', body: '大幅呈现日语标题，英语则作为增添氛围的点缀。' },
          { title: '用照片和视频展示店内', body: '通过店内照片集和介绍视频，让第一次来的客人也能提前了解店里的样子。' },
        ],
        features: [
          '价格体系（按时段的价目表）',
          '餐食・饮品菜单',
          '嵌入店内介绍视频',
          '照片集',
          '使用Google地图的交通指引',
          '通过官方LINE预约・咨询',
          '常见问题',
          '适配手机',
        ],
      },
    },
  },
  {
    slug: 'kiss-me',
    kind: 'web',
    url: 'https://k-amigo.com/kissme/',
    urlLabel: 'k-amigo.com/kissme/',
    sharedDomain: true,
    tabTitle: 'KISS ME KTV',
    tint: '#2A0718',
    glow: '#FF3D8B',
    cover: {
      src: img('works/kiss-me/desktop.webp'),
      alt: l('KISS ME KTV homepage: a brush-script logo, neon signs and a collage of Polaroid photos', 'KISS ME KTVのトップページ。ブラシ文字のロゴとネオンサイン、ポラロイド写真のコラージュ', 'KISS ME KTV首页：笔刷字体标志、霓虹招牌和拍立得照片拼贴'),
    },
    desktop: { src: img('works/kiss-me/desktop.webp'), alt: l('KISS ME KTV homepage on desktop', 'KISS ME KTVのトップページのPC表示', 'KISS ME KTV首页（电脑端）') },
    desktopFull: { src: img('works/kiss-me/desktop-full.webp'), alt: l('The full KISS ME KTV page on desktop', 'KISS ME KTVのページ全体（PC表示）', 'KISS ME KTV完整页面（电脑端）') },
    mobile: { src: img('works/kiss-me/mobile.webp'), alt: l('KISS ME KTV on mobile', 'KISS ME KTVのスマートフォン表示', 'KISS ME KTV（手机端）') },
    mobileFull: { src: img('works/kiss-me/mobile-full.webp'), alt: l('The full KISS ME KTV page on mobile', 'KISS ME KTVのページ全体（スマートフォン表示）', 'KISS ME KTV完整页面（手机端）') },
    gallery: {
      pc: [{ src: img('works/kiss-me/d0.webp'), alt: l('Floor guide, menu, directions and booking laid out as cards', '店内案内・メニュー・アクセス・予約をカードで並べたセクション', '用卡片排列的店内介绍・菜单・交通・预约板块') }],
      sp: [
        { src: img('works/kiss-me/m0.webp'), alt: l('Menu and drinks on mobile', 'メニュー・ドリンクのスマートフォン表示', '菜单・饮品（手机端）') },
        { src: img('works/kiss-me/m1.webp'), alt: l('Directions on mobile', 'アクセスのスマートフォン表示', '交通指引（手机端）') },
        { src: img('works/kiss-me/m2.webp'), alt: l('Booking via LINE on mobile', 'LINE予約の案内のスマートフォン表示', 'LINE预约指引（手机端）') },
      ],
    },
    text: {
      en: {
        name: 'KISS ME',
        short: 'A brand site that captures the venue’s personality with brush lettering and neon.',
        genre: 'Brand website for a venue',
        summary:
          'The brand site for KISS ME, a Japanese-style KTV bar in Ermita, near Malate in Manila. Brush-script lettering, Polaroid-style photos and neon signs come together to bring the personality of the name to life on the web.',
        audience: 'Japanese guests visiting Manila',
        role: 'Design, development and launch',
        design: [
          { title: 'The name becomes the visual', body: 'A large brush-script “KISS ME” at the top tells visitors the name and character of the place at a glance.' },
          { title: 'A collage-style layout', body: 'Slightly tilted, overlapping Polaroid-style photos and cards make the page playful rather than overly neat.' },
          { title: 'A palette built around pink', body: 'The logo’s pink accents the whole site, so the brand color stands out even among night photos.' },
        ],
        features: [
          'Hostess profiles',
          'Introduction video',
          'Floor guide',
          'Menu and pricing',
          'Directions',
          'LINE booking with a QR code',
          'Tap-to-call phone links',
          'FAQ',
          'Mobile friendly',
        ],
      },
      ja: {
        name: 'KISS ME',
        short: 'ブラシ文字とネオンで、店名の世界観を表現したブランドサイト。',
        genre: '店舗向けブランドWebサイト',
        summary:
          'マニラ・エルミタ（マラテ周辺）にある日本式KTV「KISS ME」のブランドサイトです。ブラシ文字のロゴタイプ、ポラロイド写真、ネオンサインを組み合わせ、店名の持つ世界観をそのままWebで表現しました。',
        audience: 'マニラを訪れる日本人のお客様',
        role: 'デザイン・実装・公開',
        design: [
          { title: '店名をそのままビジュアルに', body: '大きなブラシ文字の「KISS ME」をトップに据え、ひと目でお店の名前とキャラクターが伝わるようにしています。' },
          { title: 'コラージュのようなレイアウト', body: 'ポラロイド風の写真やカードを少し傾けて重ね、整いすぎない、遊び心のある画面にしています。' },
          { title: 'ピンクを軸にした配色', body: 'ロゴのピンクを全体のアクセントに使い、夜の写真の中でもブランドカラーが目立つようにしています。' },
        ],
        features: [
          'ホステス紹介',
          '店内紹介動画',
          '店内案内（フロア）',
          'メニュー・料金システム',
          'アクセス',
          'QRコードつきのLINE予約案内',
          'タップで電話をかけられるリンク',
          'よくある質問',
          'スマートフォン対応',
        ],
      },
      zh: {
        name: 'KISS ME',
        short: '用笔刷字体和霓虹灯，表现店名世界观的品牌网站。',
        genre: '店铺品牌网站',
        summary:
          '位于马尼拉埃尔米塔（马拉特附近）的日式KTV“KISS ME”的品牌网站。结合笔刷字体的标志、拍立得风格的照片和霓虹灯招牌，把店名所带有的世界观原汁原味地呈现在网页上。',
        audience: '前往马尼拉的日本客人',
        role: '设计・开发・上线',
        design: [
          { title: '店名本身就是视觉', body: '顶部放置大大的笔刷字体“KISS ME”，让人一眼就记住店名和店铺的个性。' },
          { title: '拼贴式的版面', body: '拍立得风格的照片和卡片略微倾斜、相互重叠，营造不过分规整、充满玩心的画面。' },
          { title: '以粉色为核心的配色', body: '以标志的粉色作为全站点缀，让品牌色在夜景照片中也同样醒目。' },
        ],
        features: [
          '接待人员介绍',
          '店内介绍视频',
          '楼层介绍',
          '菜单・价格体系',
          '交通指引',
          '附二维码的LINE预约指引',
          '点击即可拨打电话的链接',
          '常见问题',
          '适配手机',
        ],
      },
    },
  },
  {
    slug: 'k-sayuri',
    kind: 'web',
    url: 'https://k-amigo.com/ksayuri/',
    urlLabel: 'k-amigo.com/ksayuri/',
    sharedDomain: true,
    tabTitle: 'K. SAYURI KTV',
    tint: '#170F33',
    glow: '#A68BFF',
    cover: {
      src: img('works/k-sayuri/desktop.webp'),
      alt: l('K. SAYURI KTV homepage: purple neon and script lettering', 'K. SAYURI KTVのトップページ。紫のネオンと筆記体のコピー', 'K. SAYURI KTV首页：紫色霓虹与手写体文案'),
    },
    desktop: { src: img('works/k-sayuri/desktop.webp'), alt: l('K. SAYURI KTV homepage on desktop', 'K. SAYURI KTVのトップページのPC表示', 'K. SAYURI KTV首页（电脑端）') },
    desktopFull: { src: img('works/k-sayuri/desktop-full.webp'), alt: l('The full K. SAYURI KTV homepage on desktop', 'K. SAYURI KTVのトップページ全体（PC表示）', 'K. SAYURI KTV完整首页（电脑端）') },
    mobile: { src: img('works/k-sayuri/mobile.webp'), alt: l('K. SAYURI KTV on mobile', 'K. SAYURI KTVのスマートフォン表示', 'K. SAYURI KTV（手机端）') },
    mobileFull: { src: img('works/k-sayuri/mobile-full.webp'), alt: l('The full K. SAYURI KTV homepage on mobile', 'K. SAYURI KTVのトップページ全体（スマートフォン表示）', 'K. SAYURI KTV完整首页（手机端）') },
    gallery: {
      pc: [{ src: img('works/k-sayuri/res-d0.webp'), alt: l('Booking page: choose a date, time and party size to create a message to send via LINE', '予約ページ。来店日時と人数を選んでLINEで送るメッセージを作成するフォーム', '预约页面：选择到店日期、时间和人数，生成通过LINE发送的信息') }],
      sp: [
        { src: img('works/k-sayuri/menu-m0.webp'), alt: l('Pricing and drinks page on mobile', '料金システム・ドリンクページのスマートフォン表示', '价格体系・饮品页面（手机端）') },
        { src: img('works/k-sayuri/res-m0.webp'), alt: l('Booking page on mobile', '予約ページのスマートフォン表示', '预约页面（手机端）') },
        { src: img('works/k-sayuri/res-m1.webp'), alt: l('Booking message form on mobile', '予約メッセージ作成フォームのスマートフォン表示', '预约信息生成表单（手机端）') },
      ],
    },
    text: {
      en: {
        name: 'K. SAYURI',
        short: 'A calm, purple-toned site organized across multiple pages.',
        genre: 'Brand website for a venue',
        summary:
          'The site for K. SAYURI, a Japanese-style KTV bar in Malate, Manila. With a calm, purple-based look, it guides visitors through the venue, hostesses, menu and directions on separate pages. A booking page lets guests choose a date, time and party size to create a reservation message to send via LINE.',
        audience: 'Japanese guests visiting Manila',
        role: 'Design, development and launch',
        design: [
          { title: 'An elegant night in purple light', body: 'Purple paired with neon blue creates a relaxed, grown-up night atmosphere rather than a loud one.' },
          { title: 'Script and serif type together', body: 'Script and serif typefaces for the name and headings give the site elegant typography that holds its own against the photos.' },
          { title: 'Japanese and English side by side', body: 'English phrases accompany the Japanese copy, so both Japanese and local guests get a feel for the place.' },
        ],
        features: [
          'Separate pages for the venue, hostesses, menu, videos, directions, news and booking',
          'A booking form that turns the chosen date, time and party size into a LINE message (opening hours checked in Manila time)',
          'QR code for adding the LINE account',
          'Directions with Google Maps',
          'Mobile friendly',
        ],
      },
      ja: {
        name: 'K. SAYURI',
        short: '紫を基調にした、落ち着いた雰囲気の複数ページ構成のサイト。',
        genre: '店舗向けブランドWebサイト',
        summary:
          'マニラ・マラテにある日本式KTV「K. SAYURI」のサイトです。紫を基調にした落ち着いた雰囲気で、店内、ホステス、メニュー、アクセスをページごとに分けて案内しています。来店日時と人数を選ぶと、LINEで送る予約メッセージを作成できる予約ページも用意しました。',
        audience: 'マニラを訪れる日本人のお客様',
        role: 'デザイン・実装・公開',
        design: [
          { title: '紫の光で上品な夜を', body: '紫とネオンブルーを組み合わせ、にぎやかすぎない、落ち着いた大人の夜の雰囲気にしています。' },
          { title: '筆記体とセリフ体の組み合わせ', body: '店名や見出しに筆記体とセリフ体を使い、写真に負けない、華やかで上品なタイポグラフィにしています。' },
          { title: '日本語と英語の併記', body: '日本語のコピーに英語のフレーズを添え、日本人のお客様にも現地のお客様にも雰囲気が伝わるようにしています。' },
        ],
        features: [
          '店内・ホステス・メニュー・動画・アクセス・お知らせ・予約の複数ページ構成',
          '来店日時と人数を選ぶと、LINEで送る予約メッセージを作成するフォーム（マニラ時間で営業時間を判定）',
          'LINE友だち追加のQRコード',
          'Googleマップを使ったアクセス案内',
          'スマートフォン対応',
        ],
      },
      zh: {
        name: 'K. SAYURI',
        short: '以紫色为基调、氛围沉稳的多页面网站。',
        genre: '店铺品牌网站',
        summary:
          '马尼拉马拉特日式KTV“K. SAYURI”的网站。以紫色为基调营造沉稳的氛围，按页面分别介绍店内环境、接待人员、菜单和交通。还设有预约页面：选择到店日期、时间和人数后，即可生成通过LINE发送的预约信息。',
        audience: '前往马尼拉的日本客人',
        role: '设计・开发・上线',
        design: [
          { title: '用紫色光芒打造优雅夜晚', body: '紫色搭配霓虹蓝，营造不过分喧闹、沉稳成熟的夜晚氛围。' },
          { title: '手写体与衬线体的组合', body: '店名和标题使用手写体与衬线体，打造不输照片、华丽而优雅的字体设计。' },
          { title: '日语与英语并记', body: '日语文案搭配英语短句，让日本客人和当地客人都能感受到店铺的氛围。' },
        ],
        features: [
          '店内・接待人员・菜单・视频・交通・公告・预约的多页面结构',
          '选择到店日期、时间和人数后，生成通过LINE发送的预约信息的表单（按马尼拉时间判断营业时间）',
          '添加LINE好友的二维码',
          '使用Google地图的交通指引',
          '适配手机',
        ],
      },
    },
  },
  {
    slug: 'tomo-nightwalker',
    kind: 'game',
    url: 'https://tomo-nightwalker.pages.dev/',
    urlLabel: 'tomo-nightwalker.pages.dev',
    tint: '#0B1726',
    glow: '#5CC8FF',
    cover: {
      src: img('works/tomo-nightwalker/title.webp'),
      alt: l('Tomo Nightwalker title screen: the main character in the streets of Manila at night', 'Tomo Nightwalkerのタイトル画面。夜のマニラの街並みに主人公のキャラクター', 'Tomo Nightwalker标题画面：夜晚马尼拉街头的主角'),
    },
    gallery: {
      pc: [
        { src: img('works/tomo-nightwalker/battle-rift.webp'), alt: l('Battle screen: the party fights a boss, with the current lineup on the right', '戦闘画面。仲間たちとボスが戦い、右側に編成中のキャラクターが並ぶ', '战斗画面：伙伴们与首领对战，右侧排列着当前编队的角色') },
        { src: img('works/tomo-nightwalker/battle-guardian.webp'), alt: l('A street battle with crowds of allies and enemies', '街なかでの戦闘画面。大勢の仲間と敵が入り乱れる', '街头战斗画面：大量伙伴与敌人混战') },
        { src: img('works/tomo-nightwalker/crew.webp'), alt: l('Stage select and team-building screen', 'ステージ選択と編成の画面', '关卡选择与编队画面') },
        { src: img('works/tomo-nightwalker/story.webp'), alt: l('A story conversation scene', 'ストーリーの会話シーン', '剧情对话场景') },
        { src: img('works/tomo-nightwalker/battle-raid.webp'), alt: l('A ten-member raid battle', '10人編成のレイド戦の画面', '10人编队的团队战画面') },
        { src: img('works/tomo-nightwalker/hub.webp'), alt: l('The screen for unlocking a new area', '新しいエリアへ進むための画面', '前往新区域的画面') },
      ],
      sp: [],
    },
    text: {
      en: {
        name: 'Tomo Nightwalker',
        short: 'A tower defense game based on my YouTube channel.',
        genre: 'Tower defense game (browser / Android)',
        headline: 'My YouTube channel became a game. First playable version built in just 4 days.',
        summary:
          'An original tower defense game based on my YouTube channel. Using AI, I built the first playable version in four days, and since launch I’ve kept adding characters, stages and story while improving and expanding the game. Playable in Japanese and English.',
        role: 'Concept, development and release (AI-assisted)',
        features: [
          'Tower defense battles',
          'Original characters',
          'Training and team building',
          'Weapons and skills',
          'Stages and story',
          'Endless mode',
        ],
      },
      ja: {
        name: 'Tomo Nightwalker',
        short: '自分のYouTubeチャンネルを題材にしたタワーディフェンスゲーム。',
        genre: 'タワーディフェンスゲーム（ブラウザ / Android）',
        headline: '自分のYouTubeチャンネルがゲームに。初期版をわずか4日で制作。',
        summary:
          'YouTube「とも旅ちゃんねる」を題材にした、オリジナルのタワーディフェンスゲームです。AIを活用して初期版を4日間で制作し、公開後もキャラクター、ステージ、ストーリーの追加を重ねて、現在も改善と拡張を続けています。日本語と英語で遊べます。',
        role: '企画・開発・公開（AIを活用）',
        features: [
          'タワーディフェンス形式のバトル',
          'オリジナルキャラクター',
          '仲間の育成と編成',
          '武器・スキル',
          'ステージ攻略とストーリー',
          'エンドレスモード',
        ],
      },
      zh: {
        name: 'Tomo Nightwalker',
        short: '以我的YouTube频道为题材的塔防游戏。',
        genre: '塔防游戏（浏览器 / 安卓）',
        headline: '我的YouTube频道变成了游戏。首个可玩版本仅用4天完成。',
        summary:
          '以我的YouTube频道为题材的原创塔防游戏。借助AI在4天内完成首个可玩版本，上线后不断加入角色、关卡和剧情，至今仍在持续改进和扩展。支持日语和英语。',
        role: '策划・开发・发布（运用AI）',
        features: [
          '塔防式战斗',
          '原创角色',
          '伙伴培养与编队',
          '武器・技能',
          '关卡挑战与剧情',
          '无尽模式',
        ],
      },
    },
  },
  {
    slug: 'tomo-travel-channel',
    kind: 'video',
    url: 'https://www.youtube.com/@TomoTravel-PM',
    urlLabel: 'youtube.com/@TomoTravel-PM',
    tint: '#1A0F14',
    glow: '#FF5A4F',
    cover: {
      src: img('video/T8fWpREZLpY.webp'),
      alt: l('A thumbnail from Tomo Travel Channel: an episode introducing the new facilities at Takanawa Gateway', '「とも旅ちゃんねる」の動画サムネイル。高輪ゲートウェイの施設を紹介する回', '“Tomo Travel Channel”的视频缩略图：介绍高轮Gateway新设施的一期'),
    },
    text: {
      en: {
        name: 'Tomo Travel Channel',
        short: 'My travel YouTube channel — planned, filmed and edited by me.',
        genre: 'Travel YouTube channel',
        summary:
          'My own YouTube channel sharing the reality of solo travel, mainly in Southeast Asia. I handle everything myself: planning, filming, editing, captions and thumbnails. I also make videos introducing the shops and venues I visit.',
        role: 'Planning, filming, editing and thumbnails',
        features: ['Video planning', 'Filming', 'Editing', 'Captions and subtitles', 'Thumbnail design', 'Travel vlogs', 'Venue promotion', '360° / VR video'],
      },
      ja: {
        name: 'とも旅ちゃんねる',
        short: '企画から撮影・編集まで自分で手がける旅行YouTube。',
        genre: '旅行YouTubeチャンネル',
        summary:
          '東南アジアを中心に、一人旅のリアルを発信している自分のYouTubeチャンネルです。企画、撮影、編集、テロップ、サムネイル制作まで、すべて自分で手がけています。旅先の店舗を紹介する動画も制作しています。',
        role: '企画・撮影・編集・サムネイル制作',
        features: ['動画企画', '撮影', '編集', 'テロップ・字幕', 'サムネイル制作', '旅行Vlog', '店舗プロモーション', '360度・VR動画'],
      },
      zh: {
        name: 'Tomo Travel Channel',
        short: '从策划、拍摄到剪辑全部亲手完成的旅行YouTube频道。',
        genre: '旅行YouTube频道',
        summary:
          '以东南亚为中心，分享独自旅行真实体验的个人YouTube频道。策划、拍摄、剪辑、字幕和缩略图全部亲手完成，也制作介绍旅途中店铺的视频。',
        role: '策划・拍摄・剪辑・缩略图制作',
        features: ['视频策划', '拍摄', '剪辑', '字幕', '缩略图制作', '旅行Vlog', '店铺宣传', '360度・VR视频'],
      },
    },
  },
];

const shot = (s: RawShot | undefined, lang: Lang): Shot | undefined => (s ? { src: s.src, alt: s.alt[lang] } : undefined);

function localize(w: RawWork, lang: Lang) {
  return {
    slug: w.slug,
    kind: w.kind,
    url: w.url,
    urlLabel: w.urlLabel,
    sharedDomain: w.sharedDomain,
    tint: w.tint,
    glow: w.glow,
    cover: shot(w.cover, lang)!,
    desktop: shot(w.desktop, lang),
    desktopFull: shot(w.desktopFull, lang),
    mobile: shot(w.mobile, lang),
    mobileFull: shot(w.mobileFull, lang),
    gallery: w.gallery && { pc: w.gallery.pc.map((s) => shot(s, lang)!), sp: w.gallery.sp.map((s) => shot(s, lang)!) },
    t: { ...w.text[lang], tabTitle: w.tabTitle },
  };
}
export type LocalizedWork = ReturnType<typeof localize>;

export const workSlugs = works.map((w) => w.slug);
export const worksFor = (lang: Lang) => works.map((w) => localize(w, lang));
export const webWorksFor = (lang: Lang) => worksFor(lang).filter((w) => w.kind === 'web');
export const getWork = (slug: string, lang: Lang) => localize(works.find((w) => w.slug === slug)!, lang);

/** 動画実績で紹介する動画（タイトルは独自の説明文。YouTube上の題名とは異なります） */
const rawVideos = [
  {
    id: 'T8fWpREZLpY', length: '20:58', thumb: img('video/T8fWpREZLpY.webp'),
    text: {
      en: { title: 'A spot guide to the new facilities at Takanawa Gateway, Tokyo', tag: 'Spot guide' },
      ja: { title: '東京・高輪ゲートウェイの新施設を紹介するスポットガイド', tag: '施設紹介' },
      zh: { title: '介绍东京高轮Gateway新设施的景点指南', tag: '景点介绍' },
    },
  },
  {
    id: 'l4wZmpjWOeE', length: '21:49', thumb: img('video/l4wZmpjWOeE.webp'),
    text: {
      en: { title: 'From Manila’s airport to the city: a trip-prep guide', tag: 'Travel guide' },
      ja: { title: 'マニラの空港から市内中心部まで、旅の準備をまとめたガイド', tag: '旅行ガイド' },
      zh: { title: '从马尼拉机场到市中心的出行准备指南', tag: '旅行指南' },
    },
  },
  {
    id: 'r8HFuXCMu74', length: '20:03', thumb: img('video/r8HFuXCMu74.webp'),
    text: {
      en: { title: 'Walking Train Street in Hanoi, Vietnam — a travel vlog', tag: 'Travel vlog' },
      ja: { title: 'ベトナム・ハノイのトレインストリートを歩く旅行Vlog', tag: '旅行Vlog' },
      zh: { title: '漫步越南河内火车街的旅行Vlog', tag: '旅行Vlog' },
    },
  },
  {
    id: 'uf67dP5Cg70', length: '17:50', thumb: img('video/uf67dP5Cg70.webp'),
    text: {
      en: { title: 'Inside a lounge in Manila — a venue feature', tag: 'Venue feature' },
      ja: { title: 'マニラのラウンジを取材した店舗紹介', tag: '店舗紹介' },
      zh: { title: '实地探访马尼拉酒廊的店铺介绍', tag: '店铺介绍' },
    },
  },
];
export const videosFor = (lang: Lang) =>
  rawVideos.map((v) => ({ id: v.id, length: v.length, thumb: v.thumb, t: v.text[lang], url: `https://www.youtube.com/watch?v=${v.id}` }));
export type LocalizedVideo = ReturnType<typeof videosFor>[number];

/** 英字だけの名前は英語の見出し書体で表示する */
export const isLatin = (s: string) => /^[\x20-\x7E]+$/.test(s);
