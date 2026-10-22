/**
 * 简体中文文案。
 * 与 ja.ts / en.ts 使用相同的键。价格数字来自 src/config/pricing.ts。
 */
import { pricing as P, money } from '../config/pricing';
import type { Dict } from './ja';

const zh: Dict = {
  meta: {
    siteName: 'Tomo — Web & Creative',
    defaultTitle: 'Tomo｜专业的网站，轻松拥有',
    defaultDescription: `日本独立创作者Tomo的作品集。为个人、创作者和小型店铺制作网站与落地页，${money(P.websiteFrom)}起。上线后的更新可选择每月${money(P.careMonthly)}的维护方案。`,
    titleSuffix: '｜Tomo',
  },

  nav: {
    works: '作品',
    services: '服务',
    pricing: '价格',
    about: '关于我',
    contact: '联系我',
    menu: '菜单',
    close: '关闭',
    skip: '跳到正文',
    home: '首页',
  },

  common: {
    external: '在新标签页中打开',
    viewSite: '访问网站',
    viewDetail: '查看详情',
    scrollPage: '滚动浏览页面',
    stopPage: '停止',
    hoverHint: '将鼠标移到画面上，即可滚动浏览整个页面。',
    tapHint: '点击“滚动浏览页面”，即可浏览整个页面。',
    backToWorks: '返回作品列表',
    next: '下一个作品',
    watchOnYoutube: '在YouTube观看',
    fromPre: '',
    from: '起',
    perMonth: '/月',
    perRequest: '/次',
  },

  home: {
    hero: {
      title: ['专业的网站，', '轻松拥有。'],
      lead: '为个人、创作者和小型店铺制作网站与落地页。从设计、上线到之后的更新，全部由一位创作者负责到底。',
      ctaWorks: '查看作品',
      ctaPricing: '查看价格',
      ctaContact: '咨询项目',
      status: '欢迎小型项目',
      quickLabel: '作品',
    },
    works: {
      title: '作品',
      lead: '我的旅行媒体网站“Tomo Travel”，从网站设计到文章和两款游戏，全部由我亲手制作。这里从我做过的网站中精选几个进行介绍。',
      more: '查看全部作品',
    },
    services: {
      title: '我能为你做什么',
      lead: '主要业务是为个人和小型店铺制作网站，也可以承接上线后的更新、视频制作和小游戏开发。',
      rows: [
        {
          key: 'web',
          title: '网站・落地页制作',
          body: '从单页落地页到店铺介绍网站，设计到上线一站式负责。',
          pre: '',
          amount: money(P.websiteFrom),
          unit: '起',
          href: 'services/',
        },
        {
          key: 'care',
          title: '上线后的更新（月度维护）',
          body: `文字和图片替换等小型更新，每月最多${P.careUpdatesPerMonth}次，通过邮件即可委托。是否签约可自由选择。`,
          pre: '',
          amount: money(P.careMonthly),
          unit: '/月',
          href: 'pricing/',
        },
        {
          key: 'video',
          title: '视频制作',
          body: '凭借运营旅行YouTube频道积累的策划、拍摄与剪辑经验，制作能打动人的视频。',
          pre: '',
          amount: '',
          unit: '根据内容报价',
          href: 'works/tomo-travel-channel/',
        },
        {
          key: 'digital',
          title: '小游戏・互动内容',
          body: '制作可在浏览器中游玩的小游戏和互动网页内容。',
          pre: '',
          amount: '',
          unit: '根据内容报价',
          href: 'works/tomo-nightwalker/',
        },
      ],
      priceNote: '所有价格均以美元计。',
      pricing: '查看价格详情',
      more: '查看服务详情',
    },
    why: {
      title: '选择我的理由',
      lead: '为个人和小型店铺打造注重设计的网站。从第一次咨询到上线，都由同一位创作者全程负责。',
      points: [
        {
          title: '欢迎小型项目',
          body: '单页落地页、店铺介绍网站等小型网站，都欢迎随时咨询。',
        },
        {
          title: '流程简单',
          body: '主要通过邮件沟通，只在必要时开会，再忙也能轻松推进。',
        },
        {
          title: '网站归你所有',
          body: '完成的网站属于你。即使停止维护，网站也不会停止运行或消失。',
        },
        {
          title: '也能面向日本客户',
          body: '想接待来自日本的客人？我可以用自然的日语，按照日本用户熟悉的结构制作页面。',
        },
      ],
    },
    video: {
      title: '视频策划・拍摄・剪辑',
      lead: '我亲自运营旅行YouTube频道“Tomo Travel Channel”，从策划、拍摄、剪辑到字幕和缩略图全部一手包办。也欢迎咨询网站与视频结合的推广方案。',
      ctaChannel: '访问YouTube频道',
      ctaDetail: '关于视频制作',
    },
    game: {
      label: 'Tomo Nightwalker',
      title: '我的YouTube频道变成了游戏。首个可玩版本仅用4天完成。',
      body: '以我的频道为题材的原创塔防游戏。首个版本4天完成，之后不断加入新角色和关卡，至今仍在持续更新。',
      pitch: '也可以为你或你的品牌制作原创小游戏。',
      ctaDetail: '了解这款游戏',
      ctaPlay: '在浏览器中游玩',
    },
    about: {
      title: '从咨询到上线，全部亲手完成。',
      body: '我是一名住在日本的独立创作者。以网站和落地页制作为主，同时运营旅行YouTube频道，也开发浏览器游戏。直接与制作者本人沟通，交流简单，细节调整也能灵活应对。',
      more: '了解更多',
      facts: [
        { k: '所在地', v: '日本' },
        { k: 'YouTube', v: 'Tomo Travel Channel' },
        { k: '制作', v: '网站・视频・游戏' },
      ],
    },
  },

  services: {
    web: {
      title: '网站・落地页制作',
      body: '为个人、创作者和小型店铺制作网站，从设计到上线一站式交给我。',
      targetsLabel: '适合这些客户',
      targets: [
        '个体经营者・自由职业者',
        '创作者・YouTuber',
        '咖啡馆・餐厅',
        '美容沙龙',
        '小型店铺・服务业',
        '小众品牌',
        '刚刚创业的商家',
      ],
      scopeLabel: '制作内容',
      scope: [
        '设计',
        '使用 HTML / CSS / JavaScript 制作',
        '适配手机和电脑',
        '基础SEO设置',
        '上线发布（使用免费服务器）',
        '绑定自有域名・支持https',
        '交付网站全部文件',
      ],
      extra: '增加页面，或预约、网店等特殊功能，将根据需求另行报价。',
      priceLabel: '单页网站',
    },
    care: {
      title: '上线后的更新・维护',
      body: `每月${money(P.careMonthly)}的可选方案，每月最多${P.careUpdatesPerMonth}次小型更新，通过邮件委托即可，无需自己修改代码。`,
      items: ['文字修改・图片替换', '营业时间・菜单更新', '联系方式・链接修改', '显示检查与邮件支持'],
      link: '查看价格',
    },
    video: {
      title: '视频制作',
      body: '凭借运营旅行YouTube频道积累的策划、拍摄与剪辑经验，制作能准确传达信息的视频。',
      items: ['YouTube视频・短视频', '宣传视频・店铺介绍视频', '视频剪辑・字幕'],
      link: '查看视频作品',
    },
    digital: {
      title: '小游戏・互动内容',
      body: '浏览器小游戏、互动网页内容等，网站之外的数字内容也能制作。',
      items: ['原创小游戏', '互动网页内容', '运用AI制作图片・视频'],
      link: '查看游戏作品',
    },
    priceButton: '查看价格',
  },

  servicesPage: {
    title: '服务',
    lead: '主要业务是为个人和小型店铺制作网站，也可以承接上线后的更新、视频和游戏制作。',
    otherTitle: '其他服务',
    whyTitle: '选择我的理由',
    combo: {
      title: '网站＋视频的组合推广',
      body: '拍摄、剪辑网站用的介绍视频，或设计从视频引导到网站的结构等，网站和视频可以一起委托。',
    },
    process: {
      title: '制作流程',
      steps: [
        { title: '咨询', body: '通过联系表单告诉我网站的目的、想放的内容和希望上线的时间。' },
        { title: '确认内容与报价', body: '整理需要制作的页面内容和价格，供你确认。' },
        { title: '付款', body: '小型项目原则上预先付款。' },
        { title: '制作・预览', body: '完成网站后，通过临时网址发布，供你确认。' },
        { title: '修改', body: '确认后可进行1次小幅修改。' },
        { title: '上线・交付', body: '网站正式上线，并交付全部文件和更新方法。' },
      ],
    },
  },

  pricingPage: {
    title: '价格',
    headline: '简单的网站，清楚的价格。',
    lead: '无需繁琐手续，就能拥有专业的网站。只为需要的部分付费，价格一目了然。所有价格均以美元计。',
    plans: {
      website: {
        name: '网站制作',
        sub: '落地页・简单网站',
        pre: '',
        price: money(P.websiteFrom),
        unit: '起',
        term: '一次性付款',
        body: '面向个人和小型店铺的单页网站。',
        includes: [
          '单页网站（约3〜5个板块）',
          '现代、精致的设计',
          '适配手机和电脑',
          '基础SEO设置',
          '上线发布（使用免费服务器）',
          '绑定自有域名・支持https',
          '交付网站全部文件',
          '上线前1次小幅修改',
        ],
        note: '没有文字或照片也没关系。了解你的情况后，由我来准备。',
        cta: '咨询此方案',
      },
      care: {
        name: '月度维护',
        sub: '上线后的更新交给我',
        pre: '',
        price: money(P.careMonthly),
        unit: '/月',
        term: '可选・随时可以解约',
        body: '上线后的小修改，通过邮件就能轻松委托。',
        includes: [
          `每月最多${P.careUpdatesPerMonth}次小型更新`,
          '文字修改・图片替换',
          '营业时间・菜单・价目表的简单更新',
          '联系方式・链接修改',
          '检查网站是否正常显示',
          '小问题修复',
          '邮件支持',
        ],
        note: '当月未使用的次数不会顺延到下月。不保证紧急或当天处理。',
        cta: '咨询维护方案',
      },
    },
    fix: {
      name: '单次修改',
      price: '面议',
      body: '没有签约维护，也可以按次委托上线后的修改。了解需求后告知价格。',
      cta: '咨询修改',
    },
    extraTitle: '需另行报价',
    extras: ['增加页面・多页面网站', '高级动画', '复杂的设计', '大量文字・内容撰写', '大幅改版', '预约系统・网店功能', '后端开发・特殊功能'],
    notesTitle: '注意事项',
    notes: [
      '不含域名注册费用及付费第三方服务的费用。',
      '月度维护不是必选项。',
      '增加页面、大幅改版和高级功能需另行报价。',
    ],
    ownership: {
      title: '完成的网站，属于你。',
      body: '网站托管的费用原则上控制在免费方案范围内（如需付费服务，会事先说明）。即使解约维护方案，我也不会停止或删除你的网站。',
    },
    faqTitle: '常见问题',
    faq: [
      { q: '不签约维护会怎样？', a: '网站会照常运行。之后需要修改时，可以按次咨询（根据内容报价）。' },
      { q: '解约维护后，网站会停止吗？', a: '不会。网站属于你，解约后也可以继续使用。' },
      { q: '没有文字和照片也能委托吗？', a: '可以。了解你的店铺或业务后，文字由我来撰写。没有照片时，会用合适的素材图片或示意图完成，之后也可以换成你自己的照片。' },
      { q: '我没有域名（类似 yourname.com 的专属网址）。', a: '没有域名也可以用免费网址（例如 your-shop.pages.dev）发布网站，不产生费用。不过，不太推荐一直使用免费网址。店铺或商业网站使用自有域名，更容易记住，也更有信赖感。需要注册时，我会通过邮件说明步骤（域名费用由你承担）。' },
      { q: '什么时候、如何付款？', a: '小型项目原则上预先付款。具体付款方式会在咨询时告知。' },
      { q: '海外也可以委托吗？', a: '当然可以。主要通过邮件沟通，世界各地都可以委托。' },
    ],
  },

  aboutPage: {
    title: '关于我',
    name: 'Tomo',
    role: '自由网页设计师 / 视频创作者',
    intro: [
      '我是一名住在日本的独立创作者。为个人、创作者和小型店铺制作网站和落地页，从设计到上线全部独立完成。',
      '我还运营旅行YouTube频道“Tomo Travel Channel”，擅长视频的策划、拍摄和剪辑。与频道联动的旅行媒体网站，以及以频道为题材的两款浏览器游戏，也都是我亲手制作的。',
    ],
    doLabel: '主要工作',
    do: [
      '网站・落地页制作（设计・开发・上线）',
      '上线后的更新・维护',
      '视频策划・拍摄・剪辑',
      '运营YouTube频道“Tomo Travel Channel”',
      '浏览器游戏・数字内容制作',
    ],
    whyLabel: '工作方式',
    why: [
      { title: '欢迎小型项目', body: '单页网站或小修改都可以咨询。' },
      { title: '流程简单', body: '以邮件沟通为主，只在必要时开会。' },
      { title: '合理的日程', body: '交期与你商量决定，接下的工作会负责到底。' },
      { title: '无需长期合约', body: '月度维护是可选项，只在需要时委托即可。' },
    ],
    aiLabel: '关于制作方式',
    ai: '在编写代码、制作图片和检查等环节运用AI，高效完成制作。最终的品质和易用性，由我亲自确认。',
    linksLabel: '链接',
    linkYoutube: 'YouTube：Tomo Travel Channel',
    linkTravel: 'Tomo Travel（旅行媒体网站）',
  },

  contactPage: {
    title: '联系我',
    lead: '网站制作、更新或视频等方面的咨询，欢迎通过下方表单联系。小型项目也非常欢迎。',
    form: {
      name: '姓名',
      email: '邮箱',
      topic: '咨询类型',
      message: '咨询内容',
      required: '必填',
      /** value 为在 Netlify 收到的标题（为方便站长阅读保留日语，并标注 ZH） */
      topics: [
        { label: '网站・落地页制作', value: '【ポートフォリオ ZH】Webサイト・LP制作のご相談' },
        { label: '上线后的更新・修改', value: '【ポートフォリオ ZH】公開後の更新・修正のご相談' },
        { label: '视频制作', value: '【ポートフォリオ ZH】動画制作のご相談' },
        { label: '游戏・其他', value: '【ポートフォリオ ZH】ゲーム・そのほかのご相談' },
      ],
      messagePlaceholder: '请在已知的范围内填写网站目的、想放的内容、希望上线的时间等。',
      submit: '发送',
      sending: '正在发送…',
      done: '已发送。确认内容后，我会通过邮件回复你。',
      error: '发送失败。请检查网络连接后重试。',
      note: '我会通过邮件回复。',
    },
    emailLabel: '邮箱',
    copy: '复制地址',
    copied: '已复制',
    openMail: '用邮件应用打开',
    button: '打开联系表单',
    hostNote: (host: string) => `将打开${host}的联系表单。`,
    checklistLabel: '咨询时提供以下信息会更顺利',
    checklist: [
      '网站的目的',
      '想放的内容（需要的板块）',
      '是否已有文字和照片',
      '喜欢的设计或参考网站',
      '希望上线的时间',
      '是否已有域名（专属网址）',
    ],
    formTitle: '联系表单',
    unavailable: '联系方式准备中。',
  },

  contactBand: {
    title: '小项目也欢迎，随时来聊聊。',
    body: '想做店铺网站、需要一个落地页，或想稍微修改现在的网站——先告诉我你的想法吧。',
    button: '前往联系表单',
  },

  worksPage: {
    title: '作品',
    lead: '从我制作过的网站、视频和游戏中精选介绍。在详情页可以查看实际网站。',
    webTitle: '网站',
    beyondTitle: '视频・游戏',
  },

  workDetail: {
    genre: '类型',
    audience: '目标用户',
    role: '负责内容',
    url: '网址',
    designLabel: '设计特点',
    featuresLabel: '主要功能',
    pcLabel: '电脑端',
    spLabel: '手机端',
    ctaTitle: '想做类似的网站？欢迎咨询。',
    ctaGame: '想做原创游戏？欢迎咨询。',
    ctaVideo: '需要制作视频？欢迎咨询。',
    ctaServices: '查看价格',
    ctaContact: '咨询',
    sharedDomainNote: '因运营原因，多家店铺的网站放在同一域名下。',
  },

  a11y: {
    mainNav: '主导航',
    footerNav: '页脚导航',
    breadcrumb: '面包屑导航',
    gallery: '页面截图',
    offers: '服务内容',
    nextWork: '下一个作品',
    otherServices: '维护・视频・数字内容',
    photoAlt: 'Tomo的照片',
  },

  gameDetail: {
    play: '在浏览器中游玩',
    apk: '下载安卓版（APK）',
    apkNote: 'APK文件较大，建议在Wi-Fi环境下下载。',
    itch: 'itch.io',
    screens: '游戏画面',
    gameplay: '游戏内容',
    aiTitle: '首个版本4天上线，至今仍在改进。',
    aiBody: [
      '在编程、美术、音效和文本制作中运用AI，4天内发布了可玩的首个版本。',
      '现在的内容都是之后陆续更新加入的。在增加新区域、首领、伙伴和剧情的同时，持续改进平衡性和操作体验。浏览器版和安卓版同步更新。',
    ],
    yourTitle: '也可以为你或你的品牌制作原创小游戏。',
    ideas: [
      '以YouTuber为主角的游戏',
      '以个人为题材的小游戏',
      '原创角色游戏',
      '店铺宣传游戏',
      '可在浏览器中游玩的游戏',
      '品牌互动内容',
    ],
  },

  videoDetail: {
    channel: '访问YouTube频道',
    titleNote: '视频标题已改写为便于理解内容的说明。',
    skills: '负责内容',
    imageAlt: '站在夜晚海边、仰望星空的人物。这张照片也用于Tomo Travel网站。',
  },

  notFound: {
    title: '找不到页面',
    body: '网址可能已更改，或页面已被删除。请从首页或作品列表中查找。',
    home: '返回首页',
  },

  brand: {
    role: '网页设计・开发',
  },

  lang: {
    label: '语言',
  },

  footer: {
    tagline: '为个人和小型店铺制作网站。从日本出发，服务全球客户。',
    copyright: '© 2026 Tomo',
  },
};

export default zh;
