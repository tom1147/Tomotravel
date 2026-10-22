/**
 * English copy (main language of the site).
 * Same keys as ja.ts / zh.ts. Prices come from src/config/pricing.ts.
 */
import { pricing as P, money } from '../config/pricing';
import type { Dict } from './ja';

const en: Dict = {
  meta: {
    siteName: 'Tomo — Web & Creative',
    defaultTitle: 'Tomo | Professional websites, made simple',
    defaultDescription: `Portfolio of Tomo, an independent web designer and developer based in Japan. Websites and landing pages for freelancers, creators and small businesses from ${money(P.websiteFrom)}, with optional ${money(P.careMonthly)}/month care after launch.`,
    titleSuffix: ' | Tomo',
  },

  nav: {
    works: 'Work',
    services: 'Services',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    menu: 'Menu',
    close: 'Close',
    skip: 'Skip to content',
    home: 'Home',
  },

  common: {
    external: 'opens in a new tab',
    viewSite: 'Visit the live site',
    viewDetail: 'View project',
    scrollPage: 'Scroll the page',
    stopPage: 'Stop',
    hoverHint: 'Hover over the screen to scroll through the whole page.',
    tapHint: 'Tap “Scroll the page” to scroll through the whole page.',
    backToWorks: 'Back to all work',
    next: 'Next project',
    watchOnYoutube: 'Watch on YouTube',
    fromPre: 'From',
    from: '',
    perMonth: '/month',
    perRequest: '/request',
  },

  home: {
    hero: {
      title: ['Professional websites,', 'made simple.'],
      lead: 'Websites and landing pages for freelancers, creators and small businesses. Design, launch and updates after launch — all handled by one dedicated creator.',
      ctaWorks: 'See my work',
      ctaPricing: 'View pricing',
      ctaContact: 'Start a project',
      status: 'Small projects welcome',
      quickLabel: 'Selected work',
    },
    works: {
      title: 'Selected work',
      lead: 'I design, build and run my own travel media site, Tomo Travel — every page, every article and both of its games. Here are a few of the websites I’ve made.',
      more: 'View all work',
    },
    services: {
      title: 'What I can do for you',
      lead: 'My main focus is websites for freelancers, creators and small businesses. I also offer updates after launch, video production and small games.',
      rows: [
        {
          key: 'web',
          title: 'Websites and landing pages',
          body: 'From a one-page landing page to a site for your shop — designed, built and launched for you.',
          pre: 'From',
          amount: money(P.websiteFrom),
          unit: '',
          href: 'services/',
        },
        {
          key: 'care',
          title: 'Website care (monthly)',
          body: `Up to ${P.careUpdatesPerMonth} small updates a month — text, photos and more — handled by email. Completely optional.`,
          pre: '',
          amount: money(P.careMonthly),
          unit: '/month',
          href: 'pricing/',
        },
        {
          key: 'video',
          title: 'Video production',
          body: 'Planning, filming and editing, backed by years of running my own travel YouTube channel.',
          pre: '',
          amount: '',
          unit: 'Quote on request',
          href: 'works/tomo-travel-channel/',
        },
        {
          key: 'digital',
          title: 'Mini games and interactive content',
          body: 'Browser games and interactive web content that make your brand memorable.',
          pre: '',
          amount: '',
          unit: 'Quote on request',
          href: 'works/tomo-nightwalker/',
        },
      ],
      priceNote: 'All prices are in US dollars.',
      pricing: 'See full pricing',
      more: 'Explore services',
    },
    why: {
      title: 'Why work with me',
      lead: 'Design-led websites for individuals and small businesses, with one person looking after your project from the first message to launch.',
      points: [
        {
          title: 'Small projects welcome',
          body: 'A one-page landing page or a simple site for your shop — no project is too small to ask about.',
        },
        {
          title: 'A simple, email-based process',
          body: 'We work mostly by email, with calls only when they’re really needed, so it fits easily around a busy schedule.',
        },
        {
          title: 'Your site is yours',
          body: 'The finished website belongs to you. Even if you stop the care plan, your site won’t go offline or disappear.',
        },
        {
          title: 'Ready for Japanese customers',
          body: 'Want to welcome visitors from Japan? I can create pages in natural Japanese, structured the way Japanese users expect.',
        },
      ],
    },
    video: {
      title: 'Video planning, filming and editing',
      lead: 'I run my own travel YouTube channel, Tomo Travel Channel, handling everything from planning and filming to editing, captions and thumbnails. I can also pair video with your website for a stronger promotion.',
      ctaChannel: 'Visit the YouTube channel',
      ctaDetail: 'About video production',
    },
    game: {
      label: 'Tomo Nightwalker',
      title: 'My YouTube channel became a game. First playable version built in just 4 days.',
      body: 'An original tower defense game based on my channel. I built the first playable version in four days and have kept updating it ever since with new characters and stages.',
      pitch: 'I can also create an original mini game starring you or your brand.',
      ctaDetail: 'About the game',
      ctaPlay: 'Play in your browser',
      ctaApk: 'Android app (APK)',
      apkNote: 'The APK is a large file, so downloading over Wi-Fi is recommended.',
    },
    about: {
      title: 'One person, from first message to launch.',
      body: 'I’m an independent creator based in Japan. Alongside websites and landing pages, I run a travel YouTube channel and develop browser games. You talk directly to the person building your site, so communication stays simple and small adjustments are easy.',
      more: 'More about me',
      facts: [
        { k: 'Based in', v: 'Japan' },
        { k: 'YouTube', v: 'Tomo Travel Channel' },
        { k: 'Makes', v: 'Web, video and games' },
      ],
    },
  },

  services: {
    web: {
      title: 'Websites and landing pages',
      body: 'Websites for freelancers, creators and small shops — from design to launch, all in one place.',
      targetsLabel: 'Ideal for',
      targets: [
        'Freelancers and sole proprietors',
        'Creators and YouTubers',
        'Cafés and restaurants',
        'Beauty salons',
        'Small shops and local services',
        'Small brands',
        'Newly launched businesses',
      ],
      scopeLabel: 'What’s included',
      scope: [
        'Design',
        'Built with HTML, CSS and JavaScript',
        'Mobile and desktop friendly',
        'Basic SEO setup',
        'Launch on free hosting',
        'Your own domain, with HTTPS',
        'All site files handed over to you',
      ],
      extra: 'Extra pages and special features such as booking systems or online shops are quoted separately.',
      priceLabel: 'One-page website',
    },
    care: {
      title: 'Website care',
      body: `An optional ${money(P.careMonthly)}/month plan covering up to ${P.careUpdatesPerMonth} small updates a month by email. No need to touch any code yourself.`,
      items: ['Text edits and photo swaps', 'Opening hours and menu updates', 'Contact details and link fixes', 'Site checks and email support'],
      link: 'View pricing',
    },
    video: {
      title: 'Video production',
      body: 'Videos that get your message across, drawing on my experience planning, filming and editing for my own travel channel.',
      items: ['YouTube videos and Shorts', 'Promo and shop introduction videos', 'Editing, subtitles and captions'],
      link: 'See video work',
    },
    digital: {
      title: 'Mini games and interactive content',
      body: 'Browser mini games and interactive web content — projects that go beyond a standard website.',
      items: ['Original mini games', 'Interactive web content', 'AI-assisted images and video'],
      link: 'See the game',
    },
    priceButton: 'View pricing',
  },

  servicesPage: {
    title: 'Services',
    lead: 'My main service is websites for freelancers, creators and small businesses. I can also help with updates after launch, video and games.',
    otherTitle: 'More ways I can help',
    whyTitle: 'Why work with me',
    combo: {
      title: 'Web + video promotion',
      body: 'From filming and editing an introduction video for your site to pages that turn viewers into visitors, I can take care of web and video together.',
    },
    process: {
      title: 'How it works',
      steps: [
        { title: 'Tell me about your project', body: 'Use the contact form to share your goals, the content you want and your ideal launch date.' },
        { title: 'Scope and quote', body: 'I outline the pages and the price for you to review.' },
        { title: 'Payment', body: 'Small projects are usually paid upfront.' },
        { title: 'Build and preview', body: 'I build your site and share a preview link for you to check.' },
        { title: 'Revisions', body: 'One round of minor revisions after your review.' },
        { title: 'Launch and handover', body: 'Your site goes live, and you receive all the files plus simple instructions for updates.' },
      ],
    },
  },

  pricingPage: {
    title: 'Pricing',
    headline: 'Simple websites. Clear, upfront pricing.',
    lead: 'A professional website without the complicated process. Pay only for what you need, at a price you know from the start. All prices are in US dollars.',
    plans: {
      website: {
        name: 'Website',
        sub: 'Landing page or simple website',
        pre: 'From',
        price: money(P.websiteFrom),
        unit: '',
        term: 'One-time payment',
        body: 'A one-page website for individuals and small businesses.',
        includes: [
          'One-page website (about 3–5 sections)',
          'Modern, polished design',
          'Mobile and desktop friendly',
          'Basic SEO setup',
          'Launch on free hosting',
          'Your own domain, with HTTPS',
          'All site files handed over to you',
          'One round of minor revisions before launch',
        ],
        note: 'No text or photos yet? No problem — I can prepare them based on what you tell me.',
        cta: 'Start with this plan',
      },
      care: {
        name: 'Website care',
        sub: 'Updates after launch, handled for you',
        pre: '',
        price: money(P.careMonthly),
        unit: '/month',
        term: 'Optional — cancel anytime',
        body: 'Send small changes by email and I’ll take care of them.',
        includes: [
          `Up to ${P.careUpdatesPerMonth} minor updates per month`,
          'Text edits and photo swaps',
          'Simple changes to hours, menus and price lists',
          'Contact details and link fixes',
          'Checks that your site displays correctly',
          'Fixes for minor issues',
          'Email support',
        ],
        note: 'Unused updates don’t roll over. Urgent or same-day changes aren’t guaranteed.',
        cta: 'Ask about website care',
      },
    },
    fix: {
      name: 'One-off fixes',
      price: 'Quote on request',
      body: 'Not on the care plan? You can still request changes after launch, one at a time. Tell me what you need and I’ll quote a price.',
      cta: 'Request a fix',
    },
    extraTitle: 'Quoted separately',
    extras: ['Extra pages or multi-page sites', 'Advanced animation', 'Complex custom design', 'Writing large amounts of content', 'Major redesigns', 'Booking systems or online shops', 'Back-end development or special features'],
    notesTitle: 'Good to know',
    notes: [
      'Domain registration and paid third-party services are not included.',
      'A monthly plan is never required.',
      'Extra pages, major design changes and advanced features are quoted separately.',
    ],
    ownership: {
      title: 'Your finished site belongs to you.',
      body: 'I set things up so that hosting your site usually stays within free plans (if a paid service is ever needed, I’ll explain beforehand). If you cancel the care plan, your site stays online — I never take it down or delete it.',
    },
    faqTitle: 'Frequently asked questions',
    faq: [
      { q: 'What happens if I don’t sign up for website care?', a: 'Your site simply stays online. If you need changes later, just ask — I’ll quote each fix individually.' },
      { q: 'Will my site go offline if I cancel the care plan?', a: 'No. The site is yours, so it keeps running after you cancel.' },
      { q: 'Can I hire you if I don’t have text or photos?', a: 'Yes. Tell me about your business or project and I’ll write the copy. If you don’t have photos, I’ll finish the site with suitable stock or illustrative images, which you can swap for your own later.' },
      { q: 'I don’t have a domain (a web address like yourname.com).', a: 'You can launch on a free address (for example, your-shop.pages.dev) at no cost. That said, I don’t really recommend staying on a free address: for a shop or business, your own domain is easier to remember and builds trust. If you’d like one, I’ll email you simple steps to get it (the domain fee is paid by you).' },
      { q: 'When and how do I pay?', a: 'Small projects are usually paid upfront. I’ll share payment options when we discuss your project.' },
      { q: 'Can I hire you from outside Japan?', a: 'Absolutely. We work mostly by email, so I can take on projects from anywhere in the world.' },
    ],
  },

  aboutPage: {
    title: 'About',
    name: 'Tomo',
    role: 'Freelance web designer and video creator',
    intro: [
      'I’m an independent creator based in Japan. I design and build websites and landing pages for individuals, creators and small businesses, handling everything myself from design to launch.',
      'I also run a travel YouTube channel, Tomo Travel Channel, where I plan, film and edit every video. I built the channel’s travel media website and two browser games based on it, too.',
    ],
    doLabel: 'What I do',
    do: [
      'Websites and landing pages (design, build and launch)',
      'Updates and care after launch',
      'Video planning, filming and editing',
      'Running Tomo Travel Channel on YouTube',
      'Browser games and interactive content',
    ],
    whyLabel: 'How I work',
    why: [
      { title: 'Small projects welcome', body: 'From a one-page site to a quick fix — feel free to ask.' },
      { title: 'A simple process', body: 'We work mostly by email, with calls only when needed.' },
      { title: 'Realistic schedules', body: 'We agree on a timeline together, and I see every project through to the end.' },
      { title: 'No long-term contracts', body: 'Monthly care is optional. Use it only when you need it.' },
    ],
    aiLabel: 'How I build',
    ai: 'I use AI tools for coding, image creation and testing so I can work efficiently. Quality and usability are always checked by me, personally, before anything goes live.',
    linksLabel: 'Links',
    linkYoutube: 'YouTube: Tomo Travel Channel',
    linkTravel: 'Tomo Travel (travel media site)',
  },

  contactPage: {
    title: 'Contact',
    lead: 'Have a website, an update or a video in mind? Send me a message using the form below. Small projects are always welcome.',
    form: {
      name: 'Name',
      email: 'Email',
      topic: 'What can I help with?',
      message: 'Message',
      required: 'Required',
      /** value = subject line received on Netlify (kept in Japanese for the site owner, tagged EN) */
      topics: [
        { label: 'Website or landing page', value: '【ポートフォリオ EN】Webサイト・LP制作のご相談' },
        { label: 'Updates or fixes', value: '【ポートフォリオ EN】公開後の更新・修正のご相談' },
        { label: 'Video production', value: '【ポートフォリオ EN】動画制作のご相談' },
        { label: 'Games or something else', value: '【ポートフォリオ EN】ゲーム・そのほかのご相談' },
      ],
      messagePlaceholder: 'Tell me about your goals, the content you’d like and your ideal launch date — whatever you know so far.',
      submit: 'Send message',
      sending: 'Sending…',
      done: 'Thank you! Your message has been sent. I’ll get back to you by email.',
      error: 'Your message couldn’t be sent. Please check your connection and try again.',
      note: 'I’ll reply by email.',
    },
    emailLabel: 'Email',
    copy: 'Copy address',
    copied: 'Copied',
    openMail: 'Open in mail app',
    button: 'Open the contact form',
    hostNote: (host: string) => `Opens the contact form on ${host}.`,
    checklistLabel: 'Helpful things to include',
    checklist: [
      'The purpose of your site',
      'The content you want (the sections you need)',
      'Whether you already have text and photos',
      'Designs or websites you like',
      'Your ideal launch date',
      'Whether you have a domain (your own web address)',
    ],
    formTitle: 'Contact form',
    unavailable: 'Contact details are coming soon.',
  },

  contactBand: {
    title: 'Got a small project? Let’s talk.',
    body: 'A site for your shop, a landing page, or a few fixes to your current site — tell me what you have in mind.',
    button: 'Go to the contact form',
  },

  worksPage: {
    title: 'Work',
    lead: 'A selection of the websites, videos and games I’ve made. Open any project for details and a link to the live site.',
    webTitle: 'Websites',
    beyondTitle: 'Video and games',
  },

  workDetail: {
    genre: 'Type',
    audience: 'Audience',
    role: 'My role',
    url: 'Live site',
    designLabel: 'Design highlights',
    featuresLabel: 'Key features',
    pcLabel: 'Desktop',
    spLabel: 'Mobile',
    ctaTitle: 'Want a site like this? Let’s talk about your project.',
    ctaGame: 'Interested in an original game? Let’s talk.',
    ctaVideo: 'Need a video? Let’s talk.',
    ctaServices: 'View pricing',
    ctaContact: 'Get in touch',
    sharedDomainNote: 'For operational reasons, several venue sites are hosted under a shared domain.',
  },

  a11y: {
    mainNav: 'Main',
    footerNav: 'Footer',
    breadcrumb: 'Breadcrumb',
    gallery: 'Screen gallery',
    offers: 'What I offer',
    nextWork: 'Next project',
    otherServices: 'Care, video and digital',
    photoAlt: 'Photo of Tomo',
  },

  gameDetail: {
    play: 'Play in your browser',
    apk: 'Download for Android (APK)',
    apkNote: 'The APK is a large file, so downloading over Wi-Fi is recommended.',
    itch: 'itch.io',
    screens: 'Screenshots',
    gameplay: 'Gameplay',
    aiTitle: 'First playable version in 4 days — and still improving.',
    aiBody: [
      'Using AI for programming, graphics, sound and writing, I released a playable first version in four days.',
      'Everything you see now has been added in updates since: new areas, bosses, companions and story, along with ongoing balance and control improvements. Both the browser and Android versions are kept up to date.',
    ],
    yourTitle: 'I can also make an original mini game starring you or your brand.',
    ideas: [
      'A game starring a YouTuber',
      'A mini game based on you',
      'A game with original characters',
      'A promotional game for a shop',
      'Games you can play in a web browser',
      'Interactive content for brands',
    ],
  },

  videoDetail: {
    channel: 'Visit the YouTube channel',
    titleNote: 'Video titles have been rewritten to describe what each video is about.',
    skills: 'What I do',
    imageAlt: 'A person standing on a beach under a starry night sky — a photo also used on the Tomo Travel website',
  },

  notFound: {
    title: 'Page not found',
    body: 'The address may have changed, or the page may have been removed. Try the home page or the list of my work.',
    home: 'Go to the home page',
  },

  brand: {
    role: 'Web Designer and Developer',
  },

  lang: {
    label: 'Language',
  },

  footer: {
    tagline: 'Websites for freelancers, creators and small businesses. Made in Japan, for clients worldwide.',
    copyright: '© 2026 Tomo',
  },
};

export default en;
