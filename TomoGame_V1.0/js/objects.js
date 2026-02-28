/**
 * オブジェクト定義ファイル
 * 
 * 🔧 カスタマイズ方法:
 * - 絵文字を変更: emoji プロパティを編集
 * - 画像に変更: image プロパティにURLを設定
 * - サイズ調整: radius プロパティを編集
 * 
 * Tomo Game - Tropical Night Edition
 */

const CAT_OBJECTS = [
    // 南国テーマのカラーパレット
    // image プロパティがあれば画像を表示、なければ絵文字を表示
    {
        level: 1,
        name: 'さかしん(Sakashin)',
        emoji: '🌴',
        image: './assets/tama1.png',
        radius: 25,
        color: '#1a4d7c',
        score: 1,
        description: 'ベトナム系の有名youtuber。<br>いつも仲良くしてくれててとてもいい人。<br>盤面に6つ集めると…',
        links: {
            twitter: 'https://x.com/sakashin_331',
            youtube: 'https://www.youtube.com/@sakashin1026'
        }
    },
    {
        level: 2,
        name: '30番(No.30)',
        emoji: '🌊',
        image: './assets/tama2.png',
        radius: 35,
        color: '#0d6b8a',
        score: 3,
        description: 'ホーチミンレタントンのEnjoy Massageで知り合った女の子。<br>ガチでマッサージがうまかったです！<br>ホーチミン行ったら必ず行くお店に…<br>盤面に6つ集めると…<br>出演動画は以下を！',
        links: {
            youtube1: 'https://youtu.be/cwyNmj6or5g',
            youtube2: 'https://youtu.be/1mDMSTezImU'
        }
    },
    {
        level: 3,
        name: 'アマラ(Amara)',
        emoji: '🐚',
        image: './assets/tama3.png',
        radius: 46,
        color: '#0a8b8b',
        score: 6,
        description: 'マラテのJTV「G-style」で出会った動画外の女の子。<br>普通にお店楽しんでyoutubeにほぼ出来てないです。隠しキャラ。<br>この子は実は超純粋！？純粋すぎて…言えない！<br>盤面に5つ集めると…',
        links: {
            map: 'https://maps.app.goo.gl/UQDrfvsLYCDomVnv8'
        }
    },
    {
        level: 4,
        name: 'アヤ(Aya)',
        emoji: '🌺',
        image: './assets/tama4.png',
        radius: 56,
        color: '#ff6b9d',
        score: 10,
        description: 'セブ島のJTV「Club K」で知り合った女の子。<br>今は辞めてしまったがその後も仲は良い。<br>…実は秘密のスキルがあるらしい？',
        links: {
            youtube: 'https://youtu.be/z5APVNRi0FQ'
        }
    },
    {
        level: 5,
        name: 'エムジェイ(MJ)',
        emoji: '🥥',
        image: './assets/tama5.png',
        radius: 66,
        color: '#8b6914',
        score: 15,
        description: 'セブ島のガールズバーCebuBaseで知り合った女の子。<br>もともとWingのNo.1だったらしい。さすが…<br>盤面に4つ集めると…',
        links: {
            youtube1: 'https://youtu.be/pVJb3vjQYmQ',
            youtube2: 'https://youtu.be/7Lh9JpyFz-8'
        }
    },
    {
        level: 6,
        name: 'ネコ(My Cat)',
        emoji: '🏄',
        image: './assets/tama6.png',
        radius: 81,
        color: '#00a8cc',
        score: 21,
        description: 'うちのかわいい猫ちゃん。<br>猫は世界を救う',
        links: {}
    },
    {
        level: 7,
        name: 'ローズ(ROSE)',
        emoji: '🤿',
        image: './assets/tama7.png',
        radius: 93,
        color: '#006994',
        score: 28,
        description: 'JTV WINGで知り合った女の子。<br>元気いっぱいで楽しい気持ちになれますよ！<br>なんだかんだセブ島に行くと1回はWing行ってる。',
        links: {
            youtube1: 'https://youtu.be/oONFOnW9cY0',
            youtube2: 'https://youtu.be/Ot5hZDzn-Ng'
        }
    },
    {
        level: 8,
        name: 'ネコ(My Cat)',
        emoji: '⛵',
        image: './assets/tama8.png',
        radius: 105,
        color: '#1e3a5f',
        score: 36,
        description: `ネコが可愛すぎる。<br>（We're currently recruiting kids who want to appear in a game—haha.）`,
        links: {}
    },
    {
        level: 9,
        name: 'ハァ（Ha）',
        emoji: '🌙',
        image: './assets/tama9.png',
        radius: 112,
        color: '#2d1b4e',
        score: 45,
        description: 'ベトナムのわいんばーで知り合った女の子。<br>デートしたいけど高嶺の花なので誘えない。',
        links: {
            youtube1: 'https://youtu.be/6qQDsV-Hco0',
            youtube2: 'https://youtu.be/SmyUMEp8Azo'
        }
    },
    {
        level: 10,
        name: 'アヤ(Aya)',
        emoji: '🌟',
        image: './assets/tama10.png',
        radius: 124,
        color: '#ffd700',
        score: 55,
        description: 'お店を辞めても会ってくれるアヤちゃん。<br>本当に性格の良いかわいい子。<br>毎回惜しいところまで行くがいつも…二人の行く末は？',
        links: {
            youtube1: 'https://youtu.be/jwd2WxvLPkg',
            youtube2: 'https://youtu.be/NBb_lL0VOa4'
        }
    },
    {
        level: 11,
        name: 'とも(Tomo)',
        emoji: '👑',
        image: './assets/tama11.png',
        radius: 142,
        color: '#ff8c42',
        score: 100,
        description: '出会いを求めて彷徨う紳士()<br>ぜひ旅先で見かけたら声かけて下さい！喜びます！',
        links: {
            youtube_channel: 'https://www.youtube.com/@TomoTravel-PM'
        }
    },
];

// 最初に落とせる猫のレベル範囲（1〜5）
const DROPPABLE_MAX_LEVEL = 5;

// 爆弾オブジェクト
const BOMB_OBJECT = {
    name: 'ボムボム',
    emoji: '💣',
    image: './assets/bomb2.png',
    radius: 45,
    color: '#2d2d2d',
    isBomb: true,
};

// 爆弾出現確率（5%）
const BOMB_CHANCE = 0.05;

// 特殊玉（tama12）
const TAMA12_OBJECT = {
    name: 'よしき(Yoshiki)',
    emoji: '🎸',
    image: './assets/tama12.png',
    radius: 40,
    color: '#800080',
    isYoshiki: true, // 特殊フラグ
    description: 'お友達youtuber。<br>そのうち動画にでます。',
    links: {
        youtube_channel: 'https://www.youtube.com/@yosiki1111'
    }
};

// 特殊玉出現確率（1%）
const TAMA12_CHANCE = 0.01;

/**
 * BGMリスト - 曲を追加するにはここに追加するだけでUI自動反映
 * name: 表示名, file: mp3ファイルパス
 */
const BGM_LIST = [
    // --- 英語 A-Z ---
    { name: 'Chidori', file: './assets/sounds/Chidori.mp3' },
    { name: 'Chidori(BGM)', file: './assets/sounds/Chidori(BGM).mp3' },
    { name: 'Dayone', file: './assets/sounds/Dayone.mp3' },
    { name: 'END(BGM)', file: './assets/sounds/END(BGM).mp3' },
    { name: 'Green Song', file: './assets/sounds/Green Song.mp3' },
    { name: 'Green Song(BGM)', file: './assets/sounds/Green Song(BGM).mp3' },
    { name: 'I miss u', file: './assets/sounds/I miss u.mp3' },
    { name: 'IZAKAYA(BGM)', file: './assets/sounds/IZAKAYA(BGM).mp3' },
    { name: 'JAZZY(BGM)', file: './assets/sounds/JAZZY(BGM).mp3' },
    { name: 'JTVガール', file: './assets/sounds/bgm_003.mp3' },
    { name: 'JTVで酔いつぶれる男(BGM)', file: './assets/sounds/bgm_002.mp3' },
    { name: 'Manilaの夜', file: './assets/sounds/bgm_004.mp3' },
    { name: 'Night Dog(BGM)', file: './assets/sounds/Night Dog(BGM).mp3' },
    { name: 'soi6', file: './assets/sounds/soi6.mp3' },
    { name: 'sweet time(BGM)', file: './assets/sounds/sweet time(BGM).mp3' },
    { name: 'Thai song', file: './assets/sounds/Thai song.mp3' },
    { name: 'Unbreakable Spell', file: './assets/sounds/Unbreakable Spell.mp3' },
    // --- 数字 ---
    { name: '30番', file: './assets/sounds/bgm_001.mp3' },
    // --- 日本語 カタカナ（50音順）---
    { name: 'カクテル・オン・ザ・セブ', file: './assets/sounds/bgm_009.mp3' },
    { name: 'カクテル・オン・ザ・セブ (BGM)', file: './assets/sounds/bgm_008.mp3' },
    { name: 'ギャルマジック', file: './assets/sounds/bgm_010.mp3' },
    { name: 'シンデレラ', file: './assets/sounds/bgm_011.mp3' },
    { name: 'ジョリビー', file: './assets/sounds/bgm_012.mp3' },
    { name: 'ディビソリアナイト', file: './assets/sounds/bgm_013.mp3' },
    { name: 'パラダイスランドリゾート', file: './assets/sounds/bgm_014.mp3' },
    { name: 'ベニスのカフェ(BGM)', file: './assets/sounds/bgm_015.mp3' },
    { name: 'ベニスの街', file: './assets/sounds/bgm_016.mp3' },
    { name: '夕焼け', file: './assets/sounds/bgm_037.mp3' },
    { name: 'ホーチミンでの別れ', file: './assets/sounds/bgm_018.mp3' },
    { name: 'ホーチミンでみんなと(BGM)', file: './assets/sounds/bgm_019.mp3' },
    { name: 'ホーチミンの風', file: './assets/sounds/bgm_020.mp3' },
    // --- 日本語 ひらがな ---
    { name: 'お寝坊さん(BGM)', file: './assets/sounds/bgm_005.mp3' },
    { name: 'か・か・かなざわ！', file: './assets/sounds/bgm_006.mp3' },
    { name: 'ゆったりした午後(BGM)', file: './assets/sounds/bgm_007.mp3' },
    // --- 日本語 漢字（読み順）---
    { name: '甘い月', file: './assets/sounds/bgm_034.mp3' },
    { name: '憧れの男', file: './assets/sounds/bgm_031.mp3' },
    { name: '行かないで', file: './assets/sounds/bgm_036.mp3' },
    { name: '気まぐれな恋', file: './assets/sounds/bgm_033.mp3' },
    { name: '恋の予感', file: './assets/sounds/bgm_030.mp3' },
    { name: '幻想の恋(BGM)', file: './assets/sounds/bgm_029.mp3' },
    { name: '至高の時間(BGM)', file: './assets/sounds/bgm_035.mp3' },
    { name: '寿司(BGM)', file: './assets/sounds/bgm_028.mp3' },
    { name: '初めてのホーチミン', file: './assets/sounds/bgm_021.mp3' },
    { name: '初めて作った歌', file: './assets/sounds/bgm_022.mp3' },
    { name: '多分こいつは詐欺師', file: './assets/sounds/bgm_024.mp3' },
    { name: '南国の夢', file: './assets/sounds/bgm_023.mp3' },
    { name: '旅の始まり(BGM)', file: './assets/sounds/bgm_032.mp3' },
    { name: '夜のハイウェイ(BGM)', file: './assets/sounds/bgm_025.mp3' },
    { name: '夜の街灯(BGM)', file: './assets/sounds/bgm_027.mp3' },
    { name: '夜の猫(BGM)', file: './assets/sounds/bgm_026.mp3' },
    { name: '星降るセブの夜に…', file: './assets/sounds/BGM_038.mp3' },
];

// 設定
const CONFIG = {
    useImage: false,
    imageBasePath: './assets/cats/',
};

/**
 * レベルからオブジェクト情報を取得
 */
function getCatByLevel(level) {
    return CAT_OBJECTS.find(cat => cat.level === level) || CAT_OBJECTS[0];
}

/**
 * ランダムな落下用猫を取得（レベル1〜5）
 */
function getRandomDroppableCat() {
    const level = Math.floor(Math.random() * DROPPABLE_MAX_LEVEL) + 1;
    return getCatByLevel(level);
}

/**
 * 進化チャートを描画
 */
function renderEvolutionChart() {
    const chart = document.getElementById('evolution-chart');
    if (!chart) return;

    const items = CAT_OBJECTS.map((cat, index) => {
        let content;
        if (cat.image) {
            content = `<img src="${cat.image}" alt="${cat.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            content = cat.emoji;
        }
        const item = `<div class="evo-item" title="Lv.${cat.level} ${cat.name}">${content}</div>`;
        const arrow = index < CAT_OBJECTS.length - 1 ? '<span class="evo-arrow">→</span>' : '';
        return item + arrow;
    });

    chart.innerHTML = items.join('');
}

// チャート描画は game.js の initEvolutionChart() で行うため、ここでは自動描画しない
