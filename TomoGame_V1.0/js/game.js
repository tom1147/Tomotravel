/**
 * Tomo Game - メインゲームロジック
 * スイカゲーム風物理パズル
 */

// Matter.js モジュール
const { Engine, Render, Runner, Bodies, Body, Composite, Events, Vector } = Matter;

// ゲーム状態
let engine, render, runner;
let score = 0;
let currentCat = null;
let nextCat = null;
let dropX = 0;
let canDrop = true;
let isGameOver = false;
let dangerTimer = null; // ゲームオーバータイマー
let isInitialized = false;
let gameWidth = 440;
let gameHeight = 700;

// スケーリング（基準サイズ 440x700 に対する比率）
const REF_WIDTH = 440;
const REF_HEIGHT = 700;
let scaleW = 1;
let scaleH = 1;

/**
 * スケール済み半径を返す（幅基準）
 */
function scaledRadius(cat) {
    return cat.radius * scaleW;
}
let dangerDropCount = 0; // 危険状態からの落下カウント
let isInDangerZone = false; // 現在危険状態か
let dangerSpecialUsed = false; // 危険状態中に爆弾/tama12を使用したか

// オーディオ
let bgm = null;
let isBgmPlaying = false;

// 爆弾状態
let isBombMode = false; // 現在爆弾モードか

// 広告状態追跡
let isWatchingAd = false; // 広告視聴中かどうか

// 最高到達レベル
let maxReachedLevel = 0;

// BGM選択
let selectedBgmIndex = 0;
let previewBgm = null;
const BGM_INDEX_KEY = 'tomogame_bgm_index';

// 設定パネル
let isSettingsOpen = false;

// 特殊スキル
let isSkillActive = false;
let skillAttractInterval = null;
let skillTimeout = null;
let specialSkillTimer = 0; // Lv1スキル条件達成からの遅延タイマー
let skill3Timer = 0; // Lv3スキル条件達成からの遅延タイマー

// コンボカウンター
let comboCount = 0;
let comboTimer = null;
const COMBO_TIMEOUT = 1500; // 1.5秒以内に次の合体でコンボ継続

// スキル（削除）機能
let isSkillSelectionMode = false;
let skillSelectionTimeout = null; // スキル選択タイムアウト
let currentSkillType = 'normal'; // 'normal' | 'yoshiki'
let wasSkillConditionMet = false; // 無限ループ防止用フラグ
let skillConditionTimer = 0; // 条件達成からの経過時間計測用
let skillSelectedBodies = [];
const SKILL_REQUIRED_TAMA_LEVEL = 2; // レベル2の玉（No.30）
const SKILL_REQUIRED_COUNT = 6;
// スキルごとの設定
const SKILL_CONFIG = {
    normal: {
        maxSelect: 99,
        freeSelect: true,
        videoSrc: './assets/tama2skill.mp4',
        announce: 'SKILL READY!\n消したい玉を選んで発動！'
    },
    yoshiki: {
        maxSelect: 1,
        freeSelect: false,
        videoSrc: './assets/yoshiki.mp4',
        announce: 'YOSHIKI SKILL!\n1つ選んで消せ！'
    }
};
const SKILL_TARGET_MAX_LEVEL = 6; // これ以下を選択可能

// コンティニュー状態
let hasContinued = false;



// ==========================================
// スキル機能の実装
// ==========================================

/**
 * スキル状態（条件達成度）を更新
 * 毎フレーム呼ばれる
 */
function updateSkillStatus() {
    if (isGameOver || !engine || isBombMode || isSkillActive) return;

    const now = Date.now();
    // レベル2の玉（No.30）を数える（盤面に着地して1秒以上経ったもののみ）
    const bodies = Composite.allBodies(engine.world);
    const count = bodies.filter(b =>
        b.plugin &&
        b.plugin.catLevel === SKILL_REQUIRED_TAMA_LEVEL &&
        !b.isStatic &&
        !b.isSensor &&
        !b.isRemoved &&
        b.plugin.dropTime && (now - b.plugin.dropTime > 1000)
    ).length;

    // 6個以上で、スキルモードでなければ自動発動（2秒遅延）
    if (count >= SKILL_REQUIRED_COUNT) {
        if (skillConditionTimer === 0) {
            skillConditionTimer = now;
        }

        // 2秒経過したら発動
        // 2秒経過したら発動
        if (now - skillConditionTimer > 2000) {
            if (!isSkillSelectionMode) {
                toggleSkillMode(true, 'normal'); // 通常スキル発動
                skillConditionTimer = 0;
            }
        }
    } else {
        // 条件を下回ったらタイマーリセット
        skillConditionTimer = 0;
    }
}

/**
 * スキルボタンのUI更新
 */
function updateSkillUI(isInMode) {
    // ボタンUIは廃止されましたが、互換性のため残しています
}

/**
 * スキルモード切替
 * @param {boolean} forceStart 強制開始フラグ
 * @param {string} type スキルタイプ ('normal' | 'yoshiki')
 */
function toggleSkillMode(forceStart = false, type = 'normal') {
    if (!forceStart && !isSkillSelectionMode) return;

    if (forceStart) {
        // モード開始
        isSkillSelectionMode = true;
        currentSkillType = type;
        const config = SKILL_CONFIG[currentSkillType];

        canDrop = false; // 落下禁止
        skillSelectedBodies = [];
        playSkillSound(); // キラーン✨

        // 物理演算を一時停止（timeScale = 0 で停止）
        engine.timing.timeScale = 0;

        // アナウンス
        const gameArea = document.getElementById('game-area');
        // 既存のメッセージがあれば消す
        const existingMsg = document.getElementById('skill-announce-msg');
        if (existingMsg) existingMsg.remove();

        const msg = document.createElement('div');
        msg.id = 'skill-announce-msg';
        msg.textContent = config.announce;
        msg.className = 'skill-announce-text';
        msg.style.cssText = `
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            text-align: center;
            font-size: 1.8rem;
            color: #ffd700;
            font-weight: 900;
            text-shadow: 0 0 15px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 100;
            white-space: pre-wrap;
            background: rgba(0,0,0,0.7);
            padding: 20px;
            border-radius: 15px;
            border: 3px solid #ffd700;
            animation: fadeIn 0.5s ease forwards;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
        `;
        gameArea.appendChild(msg);

        // freeSelectモード（通常スキル）なら「発動」ボタンを表示
        if (config.freeSelect) {
            const existingBtn = document.getElementById('skill-execute-btn');
            if (existingBtn) existingBtn.remove();

            const executeBtn = document.createElement('div');
            executeBtn.id = 'skill-execute-btn';
            executeBtn.textContent = '発動！';
            executeBtn.style.cssText = `
                position: absolute;
                bottom: 12%;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 50px;
                font-size: 1.6rem;
                font-weight: 900;
                color: #fff;
                background: linear-gradient(135deg, #ff6b35, #e63946);
                border: 3px solid #ffd700;
                border-radius: 50px;
                cursor: pointer;
                z-index: 150;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                box-shadow: 0 0 20px rgba(255, 107, 53, 0.6), 0 4px 10px rgba(0,0,0,0.3);
                transition: transform 0.1s, box-shadow 0.1s;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            `;
            executeBtn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (skillSelectedBodies.length > 0) {
                    executeBtn.remove();
                    executeSkillDelete();
                }
            });
            gameArea.appendChild(executeBtn);
        }

        // 発動エフェクト（画面フラッシュなど）
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            opacity: 0.5;
            z-index: 200;
            pointer-events: none;
        `;
        gameArea.appendChild(flash);
        setTimeout(() => {
            flash.style.transition = 'opacity 0.5s ease-out';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 500);
        }, 50);

        // 派手なエフェクト
        showMergeEffect(gameWidth / 2, gameHeight / 2, '⚡', 'SKILL ACTIVATED!');
    }
}


/**
 * 画面タップ時の処理（スキル選択）
 */
function handleSkillTap(x, y) {
    // タップ位置にあるボディを探す
    const bodies = Composite.allBodies(engine.world);

    let target = null;
    let minDist = Infinity;

    // タップ位置に近いボディを探す
    bodies.forEach(body => {
        if (!body.plugin?.catLevel) return;
        if (body.isStatic || body.isRemoved) return;

        // 選択可能レベル上限チェック（Yoshikiスキルは制限なし、通常はLv6まで）
        if (currentSkillType !== 'yoshiki' && body.plugin.catLevel > SKILL_TARGET_MAX_LEVEL) return;

        const dx = body.position.x - x;
        const dy = body.position.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 半径内かつ、一番中心に近いものを優先
        const radius = body.circleRadius || 20;
        if (dist < radius + 10) { // 少し判定広めに
            if (dist < minDist) {
                minDist = dist;
                target = body;
            }
        }
    });

    if (target) {
        toggleBodySelection(target);
    }
}


/**
 * ボディの選択/解除
 */
function toggleBodySelection(body) {
    const index = skillSelectedBodies.indexOf(body);
    const config = SKILL_CONFIG[currentSkillType];
    const maxSelect = config.maxSelect;

    if (index !== -1) {
        // 解除
        skillSelectedBodies.splice(index, 1);
        playClickSound(); // 解除音（クリック音で代用）
    } else {
        // 選択（上限チェック）
        if (skillSelectedBodies.length < maxSelect) {
            skillSelectedBodies.push(body);
            playClickSound();

            // freeSelectでない場合、指定数選んだら自動実行
            if (!config.freeSelect && skillSelectedBodies.length >= maxSelect) {
                setTimeout(executeSkillDelete, 200);
            }
        }
    }

    // アナウンス更新
    const msg = document.getElementById('skill-announce-msg');
    if (msg) {
        if (config.freeSelect) {
            msg.textContent = `${skillSelectedBodies.length} 個選択中`;
        } else {
            msg.textContent = `あと ${maxSelect - skillSelectedBodies.length} 個選択！`;
        }
    }
}

/**
 * 選択したボディをまとめて削除（動画再生後）
 */
function executeSkillDelete() {
    if (skillSelectedBodies.length === 0) {
        endSkillMode();
        return;
    }

    // タイムアウトをクリア（動画再生中にタイムアウトしないように）
    if (skillSelectionTimeout) { clearTimeout(skillSelectionTimeout); skillSelectionTimeout = null; }

    // アナウンス・発動ボタン消去
    const msg = document.getElementById('skill-announce-msg');
    if (msg) msg.remove();
    const btn = document.getElementById('skill-execute-btn');
    if (btn) btn.remove();

    // 動画再生 → 終了後に玉を消す
    playSkillVideo(() => {
        performSkillDeletion();
    });
}

/**
 * スキル動画を再生
 */
function playSkillVideo(onComplete) {
    const config = SKILL_CONFIG[currentSkillType] || SKILL_CONFIG['normal'];
    playGenericVideo(config.videoSrc, onComplete);
}

/**
 * 実際の玉削除処理
 */
function performSkillDeletion() {
    try {
        let totalScore = 0;

        skillSelectedBodies.forEach(body => {
            if (!body || body.isRemoved) return;

            // エフェクト
            showMergeEffect(body.position.x, body.position.y, '💥', 0);

            // 削除
            body.isRemoved = true;
            Composite.remove(engine.world, body);

            // スコア加算
            if (body.plugin && body.plugin.catLevel) {
                const cat = CAT_OBJECTS.find(c => c.level === body.plugin.catLevel);
                if (cat) {
                    totalScore += cat.score;
                }
            }
        });

        if (totalScore > 0) {
            score += totalScore;
            updateScore();
        }

        // 音再生
        playBombSound();

        // YOSHIKIスキルの場合の追加演出（最後にtama12が爆発して消える）
        if (currentSkillType === 'yoshiki') {
            showYoshikiExplosion();
        }

        // バランス調整: スキル後にLv2の玉が多すぎる場合、追加で消す（通常スキルのみ）
        if (currentSkillType === 'normal') {
            adjustSkillBalance();
        }
    } catch (error) {
        console.error('Error in performSkillDeletion:', error);
    } finally {
        // 何があっても必ずモードを終了させ、物理演算を復帰させる
        endSkillMode();
    }
}

/**
 * YOSHIKIスキルの最後の爆発演出
 */
function showYoshikiExplosion() {
    // 画面上部中央で爆発
    const x = dropX;
    const y = GAME_CONFIG.dropAreaTop + 40;

    // YOSHIKI玉表示（幻影）
    const gameArea = document.getElementById('game-area');
    const ghost = document.createElement('img');
    ghost.src = TAMA12_OBJECT.image;
    ghost.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 80px;
        height: 80px;
        transform: translate(-50%, -50%) scale(1);
        z-index: 50;
        opacity: 0.8;
        transition: all 0.5s ease-out;
    `;
    gameArea.appendChild(ghost);

    // 0.5秒後に爆発
    setTimeout(() => {
        ghost.style.transform = 'translate(-50%, -50%) scale(1.5)';
        ghost.style.opacity = '0';

        // 爆発エフェクト
        showMergeEffect(x, y, '💥', 0);
        playBombSound();

        setTimeout(() => ghost.remove(), 500);
    }, 500);
}

/**
 * スキル後のバランス調整
 * Lv2の玉が6個以上残っていたら追加削除（連続発動防止）
 */
function adjustSkillBalance() {
    const bodies = Composite.allBodies(engine.world);
    const lv2Bodies = bodies.filter(b =>
        b.plugin?.catLevel === SKILL_REQUIRED_TAMA_LEVEL &&
        !b.isStatic && !b.isRemoved && !b.isSensor
    );

    let removeCount = 0;
    if (lv2Bodies.length >= 6) {
        removeCount = 2;
    } else if (lv2Bodies.length >= 5) {
        removeCount = 1;
    }

    if (removeCount > 0) {
        // ランダムに選んで消す
        const shuffled = lv2Bodies.sort(() => Math.random() - 0.5);
        for (let i = 0; i < removeCount && i < shuffled.length; i++) {
            const body = shuffled[i];
            showMergeEffect(body.position.x, body.position.y, '✨', 0);
            body.isRemoved = true;
            Composite.remove(engine.world, body);
        }
    }
}

function endSkillMode() {
    skillSelectedBodies = [];
    isSkillSelectionMode = false;
    canDrop = true;
    if (skillSelectionTimeout) { clearTimeout(skillSelectionTimeout); skillSelectionTimeout = null; }

    // 物理演算再開
    engine.timing.timeScale = 1;

    // アナウンス消去
    const msg = document.getElementById('skill-announce-msg');
    if (msg) msg.remove();

    // 発動ボタン消去
    const executeBtn = document.getElementById('skill-execute-btn');
    if (executeBtn) executeBtn.remove();

    // YOSHIKIスキルの場合、玉を消費したので次の玉を準備
    if (currentSkillType === 'yoshiki') {
        prepareNextCat();
    }
}

// ホールド機能
let holdCat = null;
let holdCount = 5;
const MAX_HOLD_COUNT = 5;

// リロール機能
let rerollCount = 5;
const MAX_REROLL_COUNT = 5;

// 画像キャッシュ
const imageCache = {};
let bombImageCache = null;
let tama12ImageCache = null;

// ハイスコア
let highScore = 0;
const HIGHSCORE_KEY = 'tomogame_highscore';

// ゲームURL（シェア用）- YouTube Channel
const GAME_URL = 'https://www.youtube.com/@TomoTravel-PM';
const GAME_CONFIG = {
    wallThickness: 15,
    dangerLineY: 80, // 基準値（scaleHで調整される）
    dropCooldown: 400,
    gameOverDelay: 2000,
    dropAreaTop: 30, // 基準値（scaleHで調整される）
};

// 基準値（getGameSize後に更新）
const BASE_DANGER_LINE_Y = 80;
const BASE_DROP_AREA_TOP = 30;

/**
 * 画像を事前読み込み
 */
function preloadImages() {
    // 既にキャッシュ済みなら再読み込みしない
    if (Object.keys(imageCache).length > 0) return;

    CAT_OBJECTS.forEach(cat => {
        if (cat.image) {
            const img = new Image();
            img.src = cat.image;
            imageCache[cat.level] = img;
        }
    });

    // 爆弾画像の読み込み
    // 爆弾画像の読み込み
    bombImageCache = new Image();
    bombImageCache.src = BOMB_OBJECT.image;

    // 特殊玉（TAMA12）画像の読み込み
    if (TAMA12_OBJECT && TAMA12_OBJECT.image && !tama12ImageCache) {
        tama12ImageCache = new Image();
        tama12ImageCache.src = TAMA12_OBJECT.image;
    }
}

/**
 * ハイスコアを読み込む
 */
function loadHighScore() {
    const saved = localStorage.getItem(HIGHSCORE_KEY);
    highScore = saved ? parseInt(saved, 10) : 0;
    updateHighScoreDisplay();
}

/**
 * ハイスコアを保存する
 */
function saveHighScore() {
    localStorage.setItem(HIGHSCORE_KEY, highScore.toString());
}

/**
 * ハイスコア表示を更新
 */
function updateHighScoreDisplay() {
    const bestScoreEl = document.getElementById('best-score');
    const highscoreEl = document.getElementById('highscore');

    if (bestScoreEl) bestScoreEl.textContent = highScore.toLocaleString();
    if (highscoreEl) highscoreEl.textContent = highScore.toLocaleString();
}

/**
 * ゲーム終了時にハイスコアをチェック
 */
function checkHighScore() {
    const isNewRecord = score > highScore;

    if (isNewRecord) {
        highScore = score;
        saveHighScore();
        updateHighScoreDisplay();
        document.getElementById('new-record').classList.remove('hidden');
    } else {
        document.getElementById('new-record').classList.add('hidden');
    }

    return isNewRecord;
}

/**
 * X（Twitter）でシェア
 */
function shareOnTwitter() {
    const text = `🌴 Tomo Game で ${score.toLocaleString()} 点を獲得しました！\n\nTomoGame 近日公開予定！youtube登録よろしくです！`;
    const url = encodeURIComponent(GAME_URL);
    const tweetText = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`, '_blank');
}

/**
 * LINEでシェア
 */
function shareOnLine() {
    const text = `🌴 Tomo Game で ${score.toLocaleString()} 点を獲得しました！\nTomoGame 近日公開予定！youtube登録よろしくです！\n${GAME_URL}`;
    const lineText = encodeURIComponent(text);
    window.open(`https://social-plugins.line.me/lineit/share?text=${lineText}`, '_blank');
}

/**
 * BGMを初期化
 */
function initAudio() {
    const bgmFile = BGM_LIST[selectedBgmIndex]?.file || './assets/sounds/bgm.mp3';
    bgm = new Audio(bgmFile);
    bgm.loop = true;
    bgm.volume = 0.3;
}

/**
 * BGMを再生
 */
function playBgm() {
    if (bgm && !isBgmPlaying) {
        bgm.currentTime = 0;
        bgm.play().catch(e => console.log('BGM再生待機中...'));
        isBgmPlaying = true;
    }
}

/**
 * BGMを停止
 */
function stopBgm() {
    if (bgm) {
        bgm.pause();
        isBgmPlaying = false;
    }
}

/**
 * 再生を止めずにBGMトラックを切り替える
 */
function switchBgmTrack() {
    if (!bgm) return;
    const wasPlaying = isBgmPlaying;
    bgm.pause();
    bgm.removeAttribute('src');
    bgm.load();

    const bgmFile = BGM_LIST[selectedBgmIndex]?.file || './assets/sounds/bgm.mp3';
    bgm = new Audio(bgmFile);
    bgm.loop = true;
    bgm.volume = 0.3;

    if (wasPlaying) {
        bgm.play().catch(() => { });
        isBgmPlaying = true;
    }
}

// Web Audio API コンテキスト
let audioContext = null;

/**
 * AudioContextを初期化
 */
function initSoundContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 再生可能状態にする
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

/**
 * 落下音（ポトン）- かわいい音
 */
function playDropSound() {
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.15);
}

/**
 * 合体音（ポン！キラキラ）- かわいい音
 */
function playMergeSound(level) {
    if (!audioContext) return;

    // メインの「ポン」音
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();

    osc1.connect(gain1);
    gain1.connect(audioContext.destination);

    // レベルが高いほど高い音
    const baseFreq = 400 + (level * 50);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioContext.currentTime + 0.1);

    gain1.gain.setValueAtTime(0.4, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.2);

    // キラキラ音（高音）
    setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();

        osc2.connect(gain2);
        gain2.connect(audioContext.destination);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200 + level * 100, audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);

        gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.15);
    }, 50);
}

/**
 * ゲームオーバー音
 */
function playGameOverSound() {
    if (!audioContext) return;

    // 下降する「ぽよよ〜ん」
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.5);

    gain.gain.setValueAtTime(0.4, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.5);
}

/**
 * 爆弾音（ドーン！）
 */
function playBombSound() {
    if (!audioContext) return;

    // 低音のドーン
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.3);

    gain.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.4);

    // 高音のキラキラ追加
    setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();

        osc2.connect(gain2);
        gain2.connect(audioContext.destination);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1500, audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);

        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.2);
    }, 100);
}

/**
 * ゲームサイズを取得
 */
function getGameSize() {
    const gameArea = document.getElementById('game-area');
    const rect = gameArea.getBoundingClientRect();
    // 非表示時は0x0が返るので、その場合は更新しない
    if (rect.width <= 0 || rect.height <= 0) return;
    gameWidth = rect.width;
    gameHeight = rect.height;

    dropX = gameWidth / 2;

    // スケール比率を更新（幅基準で統一することで、ボールの相対サイズを一定にする）
    scaleW = gameWidth / REF_WIDTH;
    scaleH = scaleW;

    // 危険ラインとドロップ位置をスケーリング
    GAME_CONFIG.dangerLineY = Math.round(BASE_DANGER_LINE_Y * scaleH);
    GAME_CONFIG.dropAreaTop = Math.round(BASE_DROP_AREA_TOP * scaleH);

    // CSSの危険ラインも更新
    const dangerLine = document.getElementById('danger-line');
    if (dangerLine) {
        dangerLine.style.top = GAME_CONFIG.dangerLineY + 'px';
    }
}

/**
 * ゲーム初期化
 */
function initGame() {
    // 画像を事前読み込み
    preloadImages();

    // ハイスコア読み込み
    loadHighScore();

    // BGM再生中なら初期化しない（曲が途切れないように）
    if (!isBgmPlaying) {
        initAudio();
    }

    // ゲームサイズを取得
    getGameSize();

    // タイムアウトをクリア
    if (dangerTimer) {
        clearTimeout(dangerTimer);
        dangerTimer = null;
    }

    // スコアリセット
    score = 0;
    updateScore();
    isGameOver = false;
    canDrop = true;
    dropX = gameWidth / 2;
    dangerDropCount = 0;
    isInDangerZone = false;
    dangerSpecialUsed = false;
    maxReachedLevel = 0;
    isSkillActive = false;
    specialSkillTimer = 0;
    skill3Timer = 0;
    skillConditionTimer = 0;
    comboCount = 0;
    if (comboTimer) clearTimeout(comboTimer);
    if (skillAttractInterval) { clearInterval(skillAttractInterval); skillAttractInterval = null; }
    if (skillTimeout) { clearTimeout(skillTimeout); skillTimeout = null; }
    if (skillSelectionTimeout) { clearTimeout(skillSelectionTimeout); skillSelectionTimeout = null; }
    hasContinued = false; // コンティニュー状態リセット

    // リワード広告をプリロード
    prepareRewardAd();

    // スキル状態リセット
    isSkillSelectionMode = false;
    skillSelectedBodies = [];
    updateSkillUI();

    // スキル動画オーバーレイが残っている場合は非表示にする
    const videoOverlay = document.getElementById('skill-video-overlay');
    if (videoOverlay) videoOverlay.classList.add('hidden');
    const existingSkillMsg = document.getElementById('skill-announce-msg');
    if (existingSkillMsg) existingSkillMsg.remove();

    // ホールド状態リセット
    holdCat = null;
    holdCount = MAX_HOLD_COUNT;
    updateHoldDisplay();

    // リロール状態リセット
    rerollCount = MAX_REROLL_COUNT;
    updateRerollDisplay();

    // 背景を元に戻す
    resetBackground();
    document.getElementById('game-over').classList.add('hidden');

    // 既存のキャンバスを削除
    const existingCanvas = document.getElementById('game-canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // 既存のエンジンをクリア
    if (engine) {
        Events.off(engine);
        Composite.clear(engine.world);
        Engine.clear(engine);
    }
    if (render) {
        Events.off(render);
        Render.stop(render);
    }
    if (runner) {
        Runner.stop(runner);
    }

    // エンジン作成
    engine = Engine.create({
        gravity: { x: 0, y: 0.55 }
    });

    // 新しいキャンバスを作成
    const gameArea = document.getElementById('game-area');
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    gameArea.appendChild(canvas);

    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: gameWidth,
            height: gameHeight,
            wireframes: false,
            background: 'transparent',
        }
    });

    // 壁を作成
    createWalls();

    // 衝突イベント
    Events.on(engine, 'collisionStart', handleCollision);

    // 毎フレームチェック
    Events.on(engine, 'afterUpdate', () => {
        checkGameOver();
        updateSkillStatus();
    });

    // 開始
    Render.run(render);
    runner = Runner.create({ delta: 1000 / 30, isFixed: true });
    Runner.run(runner, engine);

    // 最初の猫を準備
    nextCat = rollNextCat();
    prepareNextCat();

    // 入力イベント設定（初回のみ）
    if (!isInitialized) {
        setupInputEvents();
        isInitialized = true;
    }

    // カスタムレンダリング（renderのEventsはクリア済みなので再登録）
    setupCustomRender();

    // UI初期表示
    updateMaxLevelDisplay();
    updateComboDisplay();
}

/**
 * 壁を作成
 */
function createWalls() {
    const w = gameWidth;
    const h = gameHeight;
    const t = GAME_CONFIG.wallThickness;

    const wallOptions = {
        isStatic: true,
        render: {
            fillStyle: 'transparent', // CSSで描画するので透明
        },
        friction: 0.3,
        restitution: 0.1,
    };

    const floorOptions = {
        isStatic: true,
        render: {
            fillStyle: 'transparent',
        },
        friction: 0.5,
        restitution: 0.05,
    };

    // 左壁 - 画面左端に配置
    const leftWall = Bodies.rectangle(t / 2, h / 2, t, h * 2, wallOptions);
    leftWall.label = 'wall';
    // 右壁 - 画面右端に配置
    const rightWall = Bodies.rectangle(w - t / 2, h / 2, t, h * 2, wallOptions);
    rightWall.label = 'wall';
    // 床 - 画面下端ギリギリに配置
    const floor = Bodies.rectangle(w / 2, h + 10, w * 2, 40, floorOptions);
    floor.label = 'wall';

    Composite.add(engine.world, [leftWall, rightWall, floor]);
}

/**
 * 壁を削除して再作成（リサイズ時用）
 */
function recreateWalls() {
    const bodies = Composite.allBodies(engine.world);
    const walls = bodies.filter(b => b.label === 'wall');
    walls.forEach(w => Composite.remove(engine.world, w));
    createWalls();
}

/**
 * 次の猫を準備
 */
function prepareNextCat() {
    currentCat = nextCat;

    // 次の猫を決定（爆弾判定込み）
    nextCat = rollNextCat();

    // 現在の猫が爆弾かどうかでUIを更新
    isBombMode = !!(currentCat && currentCat.isBomb);

    const nextCatEl = document.getElementById('next-cat');
    const nextPreview = document.getElementById('next-preview');
    const skipBtn = document.getElementById('skip-bomb-btn');

    // 爆弾が落下対象のときスキップボタン表示
    if (isBombMode) {
        nextPreview.classList.add('bomb-mode');
        skipBtn.classList.remove('hidden');
    } else {
        nextPreview.classList.remove('bomb-mode');
        skipBtn.classList.add('hidden');
    }

    // NEXT枠の表示を更新
    if (nextCat.image) {
        nextCatEl.innerHTML = `<img src="${nextCat.image}" alt="${nextCat.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        nextCatEl.textContent = nextCat.emoji;
    }

    canDrop = true;
}

/**
 * 次の猫を決定（爆弾判定込み）
 */
/**
 * 次の猫を決定（爆弾判定込み、特殊玉込み）
 */
function rollNextCat() {
    // 1%の確率で特殊玉（YOSHIKI）
    if (Math.random() < TAMA12_CHANCE) {
        return TAMA12_OBJECT;
    }
    // 5%の確率で爆弾
    if (Math.random() < BOMB_CHANCE) {
        return BOMB_OBJECT;
    }
    return getRandomDroppableCat();
}

/**
 * 爆弾をスキップ（通常の猫に差し替え）
 */
function skipBomb() {
    if (!isBombMode || !canDrop || isGameOver) return;

    // 爆弾をスキップ: NEXTに表示されていた猫を現在の猫にし、新たにNEXTを決定
    isBombMode = false;
    currentCat = nextCat;
    nextCat = rollNextCat();

    // UI更新
    const nextPreview = document.getElementById('next-preview');
    const skipBtn = document.getElementById('skip-bomb-btn');
    const nextCatEl = document.getElementById('next-cat');

    nextPreview.classList.remove('bomb-mode');
    skipBtn.classList.add('hidden');

    // NEXT枠の表示を更新
    if (nextCat.image) {
        nextCatEl.innerHTML = `<img src="${nextCat.image}" alt="${nextCat.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        nextCatEl.textContent = nextCat.emoji;
    }
}

/**
 * 猫を落とす
 */
function dropCat() {
    if (!canDrop || isGameOver) return;

    // 危険状態の場合、落下カウントを増やしてゲームオーバー判定
    if (isInDangerZone) {
        dangerDropCount++;
        const isSpecial = currentCat && (currentCat.isBomb || currentCat.isYoshiki);

        if (dangerSpecialUsed) {
            // 爆弾/tama12を使用済みだが条件未解消 → 次の発射（4回目）でゲームオーバー
            gameOver();
            return;
        }

        if (dangerDropCount >= 3) {
            if (isSpecial) {
                // 3回目が爆弾/tama12 → 発動を許可（条件解消のチャンス）
                dangerSpecialUsed = true;
            } else {
                // 3回目で通常玉 → ゲームオーバー
                gameOver();
                return;
            }
        } else if (dangerDropCount >= 2 && isSpecial) {
            // 2回目が爆弾/tama12 → 発動を許可（条件解消のチャンス）
            dangerSpecialUsed = true;
        }
    }

    // AudioContext初期化（初回クリック時）
    initSoundContext();

    // 爆弾の場合は特別処理
    if (currentCat && currentCat.isBomb) {
        playBombSound();
        triggerBombEffect();
        canDrop = false;

        // 爆弾モード解除
        isBombMode = false;
        document.getElementById('next-preview').classList.remove('bomb-mode');
        document.getElementById('skip-bomb-btn').classList.add('hidden');

        // クールダウン後に次の猫を準備
        setTimeout(prepareNextCat, GAME_CONFIG.dropCooldown);
        return;
    }

    // 特殊玉（Yoshiki）の場合は特別処理
    if (currentCat && currentCat.isYoshiki) {
        // ターゲット候補があるかチェック（なければ消費して次へ）
        const bodies = Composite.allBodies(engine.world);
        const hasTarget = bodies.some(b => b.plugin && b.plugin.catLevel && !b.isStatic && !b.isRemoved);

        if (!hasTarget) {
            // ターゲットがない
            showMergeEffect(dropX, GAME_CONFIG.dropAreaTop + 50, '😅', 'NO TARGET');
            canDrop = false;
            // 玉は消えるがスキル不発、少し待って次へ
            setTimeout(() => {
                prepareNextCat();
            }, 1000);
            return;
        }

        // 発動エフェクト
        showMergeEffect(dropX, GAME_CONFIG.dropAreaTop + 50, '🌹', 'YOSHIKI SKILL!');

        canDrop = false;

        // スキルモード開始（即時）
        toggleSkillMode(true, 'yoshiki');

        // 玉は物理的に落ちずに消える
        // 次の玉の準備はスキルモード終了後に行うため、ここでは何もしない
        return;
    }

    // 落下音を再生
    playDropSound();

    canDrop = false;

    const cat = currentCat;
    const r = scaledRadius(cat);
    const isSmall = cat.level <= 3;
    const body = Bodies.circle(dropX, GAME_CONFIG.dropAreaTop + r, r, {
        restitution: 0.08,
        friction: isSmall ? 0.3 : 0.5,
        frictionStatic: isSmall ? 0.3 : 0.5,
        frictionAir: isSmall ? 0.12 : 0.05,
        density: isSmall ? 0.0005 : 0.001,
        render: {
            fillStyle: cat.color,
            strokeStyle: 'rgba(0,0,0,0.2)',
            lineWidth: 2,
        },
        label: `cat_${cat.level}`,
        plugin: {
            catLevel: cat.level,
            dropTime: Date.now(),
        }
    });

    Composite.add(engine.world, body);

    // クールダウン後に次の猫を準備
    setTimeout(prepareNextCat, GAME_CONFIG.dropCooldown);
}

/**
 * 爆弾エフェクト - 盤面を揺らす
 */
function triggerBombEffect() {
    const gameArea = document.getElementById('game-area');
    const gameContainer = document.getElementById('game-container');

    // 画面揺れ（控えめ）
    gameContainer.classList.add('shaking');
    setTimeout(() => {
        gameContainer.classList.remove('shaking');
    }, 600);

    // 全てのオブジェクトに強い力を加える
    const bodies = Composite.allBodies(engine.world);
    bodies.forEach(body => {
        if (!body.plugin?.catLevel) return;
        if (body.isStatic) return;

        // 強いランダムな方向に力を加える
        const forceX = (Math.random() - 0.5) * 0.3;  // 横方向の力を大幅強化
        const forceY = -0.15 - Math.random() * 0.1;   // 上向きの力を大幅強化
        Body.applyForce(body, body.position, { x: forceX, y: forceY });

        // 回転も加える
        const torque = (Math.random() - 0.5) * 0.05;
        Body.setAngularVelocity(body, body.angularVelocity + torque);
    });

    // ボーナススコア
    score += 50;
    updateScore();

    // エフェクト表示
    const effect = document.createElement('div');
    effect.className = 'merge-effect';
    effect.textContent = '💥';
    effect.style.cssText = `
        left: ${dropX}px;
        top: ${GAME_CONFIG.dropAreaTop + 50}px;
        font-size: 5rem;
    `;
    gameArea.appendChild(effect);
    setTimeout(() => effect.remove(), 500);

    // スコアポップ
    const scorePop = document.createElement('div');
    scorePop.className = 'score-pop';
    scorePop.textContent = '+50 BOMB!';
    scorePop.style.cssText = `
        left: ${dropX}px;
        top: ${GAME_CONFIG.dropAreaTop + 80}px;
        color: #ff8c42;
    `;
    gameArea.appendChild(scorePop);
    setTimeout(() => scorePop.remove(), 800);
}

/**
 * 衝突処理
 */
function handleCollision(event) {
    const pairs = event.pairs;

    pairs.forEach(pair => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // 両方が猫オブジェクトかチェック
        if (!bodyA.plugin?.catLevel || !bodyB.plugin?.catLevel) return;

        // 同じレベルかチェック
        if (bodyA.plugin.catLevel !== bodyB.plugin.catLevel) return;

        // 合体処理
        mergeCats(bodyA, bodyB);
    });
}

/**
 * 猫を合体
 */
function mergeCats(bodyA, bodyB) {
    // すでに削除されていたらスキップ
    if (bodyA.isRemoved || bodyB.isRemoved) return;

    // フラグを立てる
    bodyA.isRemoved = true;
    bodyB.isRemoved = true;

    const currentLevel = bodyA.plugin.catLevel;

    // 合体位置（中間点）
    const newX = (bodyA.position.x + bodyB.position.x) / 2;
    const newY = (bodyA.position.y + bodyB.position.y) / 2;

    // 古い猫を削除
    Composite.remove(engine.world, bodyA);
    Composite.remove(engine.world, bodyB);

    // レベル11（God）同士なら全玉消滅＆スコア2倍
    if (currentLevel >= 11) {
        // 盤面の全ての玉を爆発エフェクト付きで消去
        const allBodies = Composite.allBodies(engine.world);
        allBodies.forEach(body => {
            if (!body.plugin?.catLevel) return;
            if (body.isStatic || body.isRemoved) return;
            showMergeEffect(body.position.x, body.position.y, '💥', 0);
            body.isRemoved = true;
            Composite.remove(engine.world, body);
        });

        // スコア2倍
        const bonusScore = score;
        score += bonusScore;
        updateScore();

        // 消滅エフェクト（豪華に）
        showMergeEffect(newX, newY, '👑', "SCORE x2!!");
        playBombSound();
        playMergeSound(currentLevel);

        // 危険状態をリセット（盤面が空になるため）
        isInDangerZone = false;
        dangerDropCount = 0;
        dangerSpecialUsed = false;
        return;
    }

    const newLevel = currentLevel + 1;
    const newCat = getCatByLevel(newLevel);
    const newR = scaledRadius(newCat);

    // 新しい猫を作成
    const isSmallMerge = newCat.level <= 3;
    const newBody = Bodies.circle(newX, newY, newR, {
        restitution: 0.08,
        friction: isSmallMerge ? 0.3 : 0.5,
        frictionStatic: isSmallMerge ? 0.3 : 0.5,
        frictionAir: isSmallMerge ? 0.12 : 0.05,
        density: isSmallMerge ? 0.0005 : 0.001,
        render: {
            fillStyle: newCat.color,
            strokeStyle: 'rgba(0,0,0,0.2)',
            lineWidth: 2,
        },
        label: `cat_${newCat.level}`,
        plugin: {
            catLevel: newCat.level,
            dropTime: Date.now(),
        }
    });

    // 少し上向きの力を加える（ポップ感）
    Body.setVelocity(newBody, { x: 0, y: -1.5 });

    Composite.add(engine.world, newBody);

    // スコア加算
    score += newCat.score;
    updateScore();

    // 最高到達レベルを更新し、レベルに応じて背景変更
    if (newLevel > maxReachedLevel) {
        maxReachedLevel = newLevel;
        if (maxReachedLevel >= 11) {
            changeBackgroundToTomoend();
        } else if (maxReachedLevel >= 10) {
            changeBackgroundToAya();
        } else if (maxReachedLevel >= 9) {
            changeBackgroundToHaa();
        }
    }

    // コンボカウンター更新
    comboCount++;
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        comboCount = 0;
        updateComboDisplay();
    }, COMBO_TIMEOUT);

    // コンボボーナス（2コンボ以上で表示＆ボーナス）
    if (comboCount >= 2) {
        const comboBonus = comboCount * 2;
        score += comboBonus;
        updateScore();
        showComboEffect(newX, newY, comboCount);
    }

    updateComboDisplay();

    // 最高到達レベル表示を更新
    updateMaxLevelDisplay();

    // 合体音を再生
    playMergeSound(newLevel);

    // エフェクト表示
    showMergeEffect(newX, newY, newCat.emoji, newCat.score);
}

/**
 * 合体エフェクト
 */
function showMergeEffect(x, y, emoji, points) {
    const gameArea = document.getElementById('game-area');

    // 絵文字エフェクト
    const effect = document.createElement('div');
    effect.className = 'merge-effect';
    effect.textContent = emoji;
    effect.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        font-size: 4rem;
    `;
    gameArea.appendChild(effect);
    setTimeout(() => effect.remove(), 500);

    // スコアポップ
    const scorePop = document.createElement('div');
    scorePop.className = 'score-pop';
    scorePop.textContent = typeof points === 'number' ? `+${points}` : points;
    if (typeof points !== 'number') {
        scorePop.style.fontSize = '2rem';
        scorePop.style.color = '#ffd700';
        scorePop.style.fontWeight = '900';
        scorePop.style.textShadow = '0 0 10px rgba(255, 140, 66, 0.8)';
    }
    scorePop.style.cssText += `
        left: ${x}px;
        top: ${y - 30}px;
    `;
    gameArea.appendChild(scorePop);
    setTimeout(() => scorePop.remove(), 800);
}

/**
 * スコア更新
 */
function updateScore() {
    const scoreEl = document.getElementById('score');
    scoreEl.textContent = score.toLocaleString();

    // スコア更新アニメーション
    scoreEl.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreEl.style.transform = 'scale(1)';
    }, 100);
}

/**
 * ゲームオーバーチェック
 */
function checkGameOver() {
    if (isGameOver) return;

    const bodies = Composite.allBodies(engine.world);
    let currentlyInDanger = false;

    bodies.forEach(body => {
        if (!body.plugin?.catLevel) return;
        if (body.isStatic) return;

        // 危険ラインを超えているかチェック
        if (body.position.y - body.circleRadius < GAME_CONFIG.dangerLineY) {
            // ある程度静止しているかチェック
            const speed = Vector.magnitude(body.velocity);
            if (speed < 0.5) {
                currentlyInDanger = true;
            }
        }
    });

    // 危険状態の更新
    if (currentlyInDanger) {
        if (!isInDangerZone) {
            // 新たに危険状態に入った
            isInDangerZone = true;
            dangerDropCount = 0;
            dangerSpecialUsed = false;
        }
    } else {
        if (isInDangerZone) {
            // 危険状態から脱出 → カウンターリセット
            isInDangerZone = false;
            dangerDropCount = 0;
            dangerSpecialUsed = false;
        }
    }

    // 特殊スキルチェック
    checkSpecialSkill();
    checkSkill3();
}

/**
 * ゲームオーバー処理
 */
function gameOver() {
    if (isGameOver) return;

    isGameOver = true;
    canDrop = false;

    // スキル関連を強制クリーンアップ
    if (skillAttractInterval) { clearInterval(skillAttractInterval); skillAttractInterval = null; }
    if (skillTimeout) { clearTimeout(skillTimeout); skillTimeout = null; }
    if (skillSelectionTimeout) { clearTimeout(skillSelectionTimeout); skillSelectionTimeout = null; }
    if (dangerTimer) { clearTimeout(dangerTimer); dangerTimer = null; }
    isSkillActive = false;
    specialSkillTimer = 0;
    skill3Timer = 0;
    skillConditionTimer = 0;
    if (isSkillSelectionMode) {
        isSkillSelectionMode = false;
        engine.timing.timeScale = 1;
        const skillMsg = document.getElementById('skill-announce-msg');
        if (skillMsg) skillMsg.remove();
        const skillBtn = document.getElementById('skill-execute-btn');
        if (skillBtn) skillBtn.remove();
    }
    skillSelectedBodies = [];

    // スキル動画オーバーレイが残っている場合は非表示にする
    const videoOverlay = document.getElementById('skill-video-overlay');
    if (videoOverlay) videoOverlay.classList.add('hidden');

    // コンボタイマーもクリア
    if (comboTimer) { clearTimeout(comboTimer); comboTimer = null; }

    // BGMはそのまま流し続ける

    // ゲームオーバー音を再生
    playGameOverSound();

    document.getElementById('final-score').textContent = score.toLocaleString();

    // 最高到達レベルをゲームオーバー画面に表示
    const finalMaxLvEl = document.getElementById('final-max-level');
    if (finalMaxLvEl) {
        const maxCat = getCatByLevel(maxReachedLevel);
        finalMaxLvEl.textContent = maxReachedLevel > 0 ? `Lv.${maxReachedLevel} ${maxCat.name}` : '-';
    }

    // ハイスコアチェック
    checkHighScore();

    // コンティニューボタン表示制御
    const continueBtn = document.getElementById('continue-btn');
    if (!hasContinued) {
        continueBtn.classList.remove('hidden');
        if (shouldSkipAd()) {
            continueBtn.innerHTML = '<span class="icon">FREE</span> CONTINUE';
        } else {
            continueBtn.innerHTML = '<span class="icon">📺</span> CONTINUE (Watch Ad)';
        }
    } else {
        continueBtn.classList.add('hidden');
    }
    document.getElementById('countdown-area').classList.add('hidden'); // 念のため非表示

    document.getElementById('game-over').classList.remove('hidden');

    Runner.stop(runner);
}

/**
 * 入力イベント設定
 */
function setupInputEvents() {
    const gameArea = document.getElementById('game-area');

    // マウス/タッチ移動
    const handleMove = (clientX) => {
        if (isGameOver) return;
        // スキル選択モード中は落下位置を動かさない（誤操作防止）
        if (isSkillSelectionMode) return;

        const rect = gameArea.getBoundingClientRect();
        const x = clientX - rect.left;

        // 壁にぶつからないように制限
        const cat = currentCat || CAT_OBJECTS[0];
        const cr = scaledRadius(cat);
        const minX = GAME_CONFIG.wallThickness + cr + 5;
        const maxX = gameWidth - GAME_CONFIG.wallThickness - cr - 5;

        dropX = Math.max(minX, Math.min(maxX, x));
    };

    // マウスイベント
    gameArea.addEventListener('mousemove', (e) => handleMove(e.clientX));
    gameArea.addEventListener('click', (e) => {
        if (isSkillSelectionMode) {
            const rect = gameArea.getBoundingClientRect();
            handleSkillTap(e.clientX - rect.left, e.clientY - rect.top);
        } else {
            dropCat();
        }
    });

    // タッチイベント
    gameArea.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
    }, { passive: false });

    gameArea.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (isSkillSelectionMode) {
            const touch = e.changedTouches[0];
            const rect = gameArea.getBoundingClientRect();
            handleSkillTap(touch.clientX - rect.left, touch.clientY - rect.top);
        } else {
            dropCat();
        }
    });

    // リスタートボタン → 直接リスタート
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    // コンティニューボタン
    document.getElementById('continue-btn').addEventListener('click', startContinue);

    // 爆弾スキップボタン
    document.getElementById('skip-bomb-btn').addEventListener('click', skipBomb);

    // シェアボタン
    document.getElementById('share-twitter').addEventListener('click', shareOnTwitter);
    document.getElementById('share-line').addEventListener('click', shareOnLine);
}

/**
 * カスタムレンダリング（絵文字表示）
 */
function setupCustomRender() {
    Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        const bodies = Composite.allBodies(engine.world);

        // 猫オブジェクトを描画
        bodies.forEach(body => {
            if (!body.plugin?.catLevel) return;

            const cat = getCatByLevel(body.plugin.catLevel);
            const x = body.position.x;
            const y = body.position.y;
            const br = body.circleRadius || scaledRadius(cat);
            const cachedImage = imageCache[cat.level];
            const hasImage = cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0;

            // 背景円（影付き）- 画像がない場合のみ
            if (!hasImage) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, br, 0, Math.PI * 2);
                ctx.fillStyle = cat.color;
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 5;
                ctx.fill();
                ctx.restore();
            }

            // 画像または絵文字を表示
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(body.angle);

            if (hasImage) {
                // 画像を円形にクリップして描画
                const size = br * 2;
                const imgW = cachedImage.naturalWidth;
                const imgH = cachedImage.naturalHeight;

                // 円形にクリップ
                ctx.beginPath();
                ctx.arc(0, 0, br, 0, Math.PI * 2);
                ctx.clip();

                // 高さに合わせてスケール（横長画像対応）
                const scale = size / imgH;
                const drawW = imgW * scale;
                const drawH = size;

                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 5;
                ctx.drawImage(cachedImage, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
                // 絵文字を表示
                const fontSize = br * 1.4;
                ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cat.emoji, 0, 0);
            }
            ctx.restore();

            // スキル選択中のハイライト
            if (skillSelectedBodies.includes(body)) {
                ctx.save();
                ctx.translate(x, y);
                // 赤枠
                ctx.beginPath();
                ctx.arc(0, 0, br + 4, 0, Math.PI * 2);
                ctx.strokeStyle = '#ff3366';
                ctx.lineWidth = 4;
                ctx.stroke();
                // ❌マーク
                ctx.fillStyle = '#ff3366';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 4;
                ctx.fillText('❌', 0, 0);
                ctx.restore();
            }
        });

        // ドロップインジケーター描画
        if (!isGameOver && currentCat && canDrop) {
            const cat = currentCat;
            const dr = scaledRadius(cat);
            const y = GAME_CONFIG.dropAreaTop + dr;

            // 爆弾か通常かで画像を選択
            let cachedImage;
            let hasImage;
            if (cat.isBomb) {
                cachedImage = bombImageCache;
                hasImage = cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0;
            } else if (cat.isYoshiki) {
                cachedImage = tama12ImageCache;
                hasImage = cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0;
            } else {
                cachedImage = imageCache[cat.level];
                hasImage = cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0;
            }

            ctx.save();

            // ガイドライン（点線）- 爆弾の場合はオレンジ色
            ctx.beginPath();
            ctx.strokeStyle = cat.isBomb ? 'rgba(255, 100, 50, 0.6)' : 'rgba(255, 140, 66, 0.4)';
            ctx.setLineDash([8, 8]);
            ctx.lineWidth = cat.isBomb ? 3 : 2;
            ctx.moveTo(dropX, y + dr + 10);
            ctx.lineTo(dropX, gameHeight - 50);
            ctx.stroke();
            ctx.setLineDash([]);

            // プレビュー（画像または絵文字）
            ctx.globalAlpha = 0.8;
            if (hasImage) {
                // 画像を円形にクリップして描画
                const size = dr * 2;
                const imgW = cachedImage.naturalWidth;
                const imgH = cachedImage.naturalHeight;

                // 円形にクリップ
                ctx.beginPath();
                ctx.arc(dropX, y, dr, 0, Math.PI * 2);
                ctx.clip();

                // 高さに合わせてスケール
                const scale = size / imgH;
                const drawW = imgW * scale;
                const drawH = size;

                ctx.drawImage(cachedImage, dropX - drawW / 2, y - drawH / 2, drawW, drawH);
            } else {
                // 背景円
                ctx.beginPath();
                ctx.arc(dropX, y, dr, 0, Math.PI * 2);
                ctx.fillStyle = cat.color;
                ctx.fill();

                // 絵文字
                ctx.globalAlpha = 1;
                const fontSize = dr * 1.4;
                ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(cat.emoji, dropX, y);
            }

            ctx.restore();
        }
    });
}

/**
 * コンボエフェクト表示
 */
function showComboEffect(x, y, combo) {
    const gameArea = document.getElementById('game-area');
    const comboPop = document.createElement('div');
    comboPop.className = 'combo-pop';
    comboPop.textContent = `x${combo} COMBO!`;
    comboPop.style.cssText = `
        left: ${x}px;
        top: ${y - 50}px;
    `;
    gameArea.appendChild(comboPop);
    setTimeout(() => comboPop.remove(), 1000);
}

/**
 * コンボ表示を更新
 */
function updateComboDisplay() {
    const comboEl = document.getElementById('combo-display');
    if (!comboEl) return;

    if (comboCount >= 2) {
        comboEl.textContent = `x${comboCount}`;
        comboEl.classList.remove('hidden');
        comboEl.classList.add('combo-active');
        setTimeout(() => comboEl.classList.remove('combo-active'), 150);
    } else {
        comboEl.classList.add('hidden');
    }
}

/**
 * 最高到達レベル表示を更新
 */
function updateMaxLevelDisplay() {
    const maxLvEl = document.getElementById('max-level');
    if (maxLvEl) {
        maxLvEl.textContent = maxReachedLevel;
    }
}

/**
 * 特殊スキルチェック - レベル1が6個溜まったら発動
 */
function checkSpecialSkill() {
    if (isSkillActive || isGameOver || isBombMode || isSkillSelectionMode) return;

    const now = Date.now();
    const bodies = Composite.allBodies(engine.world);
    // 盤面に着地して1秒以上経ったもののみカウント
    const level1Bodies = bodies.filter(b =>
        b.plugin?.catLevel === 1 &&
        !b.isStatic &&
        !b.isRemoved &&
        b.plugin.dropTime && (now - b.plugin.dropTime > 1000)
    );

    if (level1Bodies.length >= 6) {
        // 2秒遅延で発動
        if (specialSkillTimer === 0) {
            specialSkillTimer = now;
        }
        if (now - specialSkillTimer > 2000) {
            specialSkillTimer = 0;
            triggerSpecialSkill();
        }
    } else {
        specialSkillTimer = 0;
    }
}

/**
 * 特殊スキル発動 - レベル1がレベル2を連れ去る
 * sakashinskill.mp4 を再生し、終了後にスキル効果を実行
 */
function triggerSpecialSkill() {
    isSkillActive = true;
    canDrop = false;

    // 動画を再生 → 終了後にスキル効果を実行
    playGenericVideo('./assets/sakashinskill.mp4', () => {
        executeSpecialSkillEffect();
    });
}

/**
 * 汎用動画再生（スキップ付き）
 * ユーザージェスチャー外からでも確実に再生できるよう、
 * autoplay失敗時はタップで再生開始するUIを表示する。
 * @param {string} videoSrc 動画ファイルパス
 * @param {Function} onComplete 動画終了後のコールバック
 */
function playGenericVideo(videoSrc, onComplete) {
    const overlay = document.getElementById('skill-video-overlay');
    const video = document.getElementById('skill-video');
    const skipBtn = document.getElementById('skill-video-skip');

    if (!overlay || !video) {
        onComplete();
        return;
    }

    // BGMを小さくする
    const originalVolume = bgm ? bgm.volume : 0.3;
    if (bgm) bgm.volume = 0.05;

    overlay.classList.remove('hidden');

    let finished = false;
    let safetyTimer = null;

    function finish() {
        if (finished) return;
        finished = true;
        if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
        // タップ開始UIが残っていたら除去
        const tapUI = document.getElementById('video-tap-to-play');
        if (tapUI) tapUI.remove();
        video.pause();
        video.onended = null;
        video.onerror = null;
        video.removeAttribute('src');
        video.load();
        overlay.classList.add('hidden');
        if (bgm) bgm.volume = originalVolume;
        onComplete();
    }

    /**
     * 動画の実際の再生を開始する（ユーザージェスチャー内で呼ぶ）
     */
    function startPlayback() {
        const tapUI = document.getElementById('video-tap-to-play');
        if (tapUI) tapUI.remove();

        video.onended = finish;
        video.onerror = finish;

        // SKIPボタン
        function handleSkip(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            finish();
        }
        skipBtn.onclick = handleSkip;
        skipBtn.ontouchend = handleSkip;

        video.src = videoSrc;

        // 安全策タイムアウト（15秒）
        safetyTimer = setTimeout(() => {
            if (!finished) finish();
        }, 15000);

        video.muted = false;
        video.play().then(() => {
            // 再生成功
        }).catch(() => {
            // それでもダメならミュートで再生
            video.muted = true;
            video.play().catch(() => {
                finish();
            });
        });
    }

    // まずautoplay（ミュート）を試みる
    video.src = videoSrc;
    video.muted = true;
    video.play().then(() => {
        // autoplay成功 → ミュート解除して継続
        video.muted = false;

        video.onended = finish;
        video.onerror = finish;

        function handleSkip(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            finish();
        }
        skipBtn.onclick = handleSkip;
        skipBtn.ontouchend = handleSkip;

        safetyTimer = setTimeout(() => {
            if (!finished) finish();
        }, 15000);
    }).catch(() => {
        // autoplay失敗 → タップで再生するUIを表示
        video.pause();
        video.removeAttribute('src');
        video.load();

        const tapUI = document.createElement('div');
        tapUI.id = 'video-tap-to-play';
        tapUI.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            z-index: 510; cursor: pointer;
        `;
        tapUI.innerHTML = `
            <div style="font-size: 4rem;">▶</div>
            <div style="color: #fff; font-size: 1.2rem; font-weight: 700; margin-top: 12px;
                        text-shadow: 0 0 8px rgba(0,0,0,0.8);">TAP TO PLAY</div>
        `;

        function handleTap(e) {
            e.preventDefault();
            e.stopPropagation();
            tapUI.removeEventListener('click', handleTap);
            tapUI.removeEventListener('touchend', handleTap);
            startPlayback();
        }
        tapUI.addEventListener('click', handleTap);
        tapUI.addEventListener('touchend', handleTap);

        overlay.appendChild(tapUI);

        // SKIPボタンでもスキップ可能（動画見ずにスキップ）
        function handleSkipBeforePlay(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            finish();
        }
        skipBtn.onclick = handleSkipBeforePlay;
        skipBtn.ontouchend = handleSkipBeforePlay;
    });
}

/**
 * 特殊スキルの実際の効果（動画再生後に呼ばれる）
 */
function executeSpecialSkillEffect() {
    // ゲームオーバー中なら中断
    if (isGameOver) {
        isSkillActive = false;
        return;
    }

    const bodies = Composite.allBodies(engine.world);
    const level1Bodies = bodies.filter(b => b.plugin?.catLevel === 1 && !b.isStatic && !b.isRemoved);
    const level2Bodies = bodies.filter(b => b.plugin?.catLevel === 2 && !b.isStatic && !b.isRemoved);

    // 告知テキスト表示
    const gameArea = document.getElementById('game-area');
    const announce = document.createElement('div');
    announce.className = 'skill-announce';
    announce.textContent = 'SKILL!';
    gameArea.appendChild(announce);
    setTimeout(() => announce.remove(), 1200);

    // スキル効果音
    playSkillSound();

    // 集合フェーズ: レベル1をレベル2に向かって引き寄せる
    if (skillAttractInterval) clearInterval(skillAttractInterval);
    skillAttractInterval = setInterval(() => {
        if (isGameOver) { clearInterval(skillAttractInterval); skillAttractInterval = null; return; }
        level1Bodies.forEach(body1 => {
            if (body1.isRemoved) return;

            let targetX, targetY;

            if (level2Bodies.length > 0) {
                // 最も近いレベル2を探す
                let closest = level2Bodies[0];
                let minDist = Infinity;
                level2Bodies.forEach(body2 => {
                    if (body2.isRemoved) return;
                    const dx = body2.position.x - body1.position.x;
                    const dy = body2.position.y - body1.position.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = body2;
                    }
                });
                targetX = closest.position.x;
                targetY = closest.position.y;
            } else {
                // レベル2がなければ画面中央に集める
                targetX = gameWidth / 2;
                targetY = gameHeight / 2;
            }

            const dx = targetX - body1.position.x;
            const dy = targetY - body1.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                const force = 0.003;
                Body.applyForce(body1, body1.position, {
                    x: (dx / dist) * force,
                    y: (dy / dist) * force,
                });
            }
        });
    }, 16);

    // 消滅フェーズ
    skillTimeout = setTimeout(() => {
        clearInterval(skillAttractInterval);
        skillAttractInterval = null;

        // ゲームオーバー中なら中断
        if (isGameOver) {
            isSkillActive = false;
            skillTimeout = null;
            return;
        }

        const allTargets = [...level1Bodies, ...level2Bodies];
        let removedCount = 0;

        allTargets.forEach(body => {
            if (body.isRemoved) return;

            // 爆発エフェクト
            showMergeEffect(body.position.x, body.position.y, '💥', 0);

            // ボディ削除
            body.isRemoved = true;
            Composite.remove(engine.world, body);
            removedCount++;
        });

        // 爆発音
        if (removedCount > 0) {
            playBombSound();
        }

        // ボーナススコア
        if (removedCount > 0) {
            const bonus = removedCount * 5;
            score += bonus;
            updateScore();

            // スコアポップ
            const scorePop = document.createElement('div');
            scorePop.className = 'score-pop';
            scorePop.textContent = `+${bonus} SKILL!`;
            scorePop.style.cssText = `
                left: ${gameWidth / 2}px;
                top: ${gameHeight / 2}px;
                color: var(--accent-cyan);
            `;
            gameArea.appendChild(scorePop);
            setTimeout(() => scorePop.remove(), 800);
        }

        // スキル完了
        isSkillActive = false;
        canDrop = true;
        skillTimeout = null;
    }, 800);
}

/**
 * レベル3スキルチェック - レベル3が5個溜まったら発動
 */
function checkSkill3() {
    if (isSkillActive || isGameOver || isBombMode || isSkillSelectionMode) return;

    const now = Date.now();
    const bodies = Composite.allBodies(engine.world);
    const level3Bodies = bodies.filter(b =>
        b.plugin?.catLevel === 3 &&
        !b.isStatic &&
        !b.isRemoved &&
        b.plugin.dropTime && (now - b.plugin.dropTime > 1000)
    );

    if (level3Bodies.length >= 5) {
        if (skill3Timer === 0) {
            skill3Timer = now;
        }
        if (now - skill3Timer > 2000) {
            skill3Timer = 0;
            triggerSkill3();
        }
    } else {
        skill3Timer = 0;
    }
}

/**
 * レベル3スキル発動 - skill3.mp4を再生し、終了後にLv3とLv4を爆発消去
 */
function triggerSkill3() {
    isSkillActive = true;
    canDrop = false;

    playGenericVideo('./assets/skill3.mp4', () => {
        executeSkill3Effect();
    });
}

/**
 * レベル3スキルの実際の効果（動画再生後に呼ばれる）
 * Lv3とLv4の玉をすべて爆発エフェクト付きで消去
 */
function executeSkill3Effect() {
    if (isGameOver) {
        isSkillActive = false;
        return;
    }

    const bodies = Composite.allBodies(engine.world);
    // Lv3以下の玉を集めてシャッフルし、最大5個をランダム選択
    const candidates = bodies.filter(b =>
        b.plugin?.catLevel && b.plugin.catLevel <= 3 && !b.isStatic && !b.isRemoved
    );
    // Fisher-Yatesシャッフル
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const allTargets = candidates.slice(0, 5);

    const gameArea = document.getElementById('game-area');

    // 告知テキスト表示
    const announce = document.createElement('div');
    announce.className = 'skill-announce';
    announce.textContent = 'SKILL!';
    gameArea.appendChild(announce);
    setTimeout(() => announce.remove(), 1200);

    // スキル効果音
    playSkillSound();
    let removedCount = 0;
    let delay = 0;

    // 派手な連鎖爆発エフェクト（少しずつ時間差で爆発）
    allTargets.forEach((body, index) => {
        if (body.isRemoved) return;

        delay = index * 120; // 120msずつずらして爆発

        setTimeout(() => {
            if (body.isRemoved) return;

            // 複数の爆発エフェクト
            showMergeEffect(body.position.x, body.position.y, '💥', 0);
            showMergeEffect(body.position.x + 15, body.position.y - 10, '🔥', 0);
            showMergeEffect(body.position.x - 10, body.position.y + 15, '💥', 0);

            // 爆発音
            playBombSound();

            // ボディ削除
            body.isRemoved = true;
            Composite.remove(engine.world, body);
            removedCount++;
        }, delay);
    });

    // すべての爆発が終わった後にスコア加算＆スキル完了
    const totalDelay = allTargets.length * 120 + 300;
    skillTimeout = setTimeout(() => {
        if (isGameOver) {
            isSkillActive = false;
            skillTimeout = null;
            return;
        }

        // ボーナススコア
        if (removedCount > 0) {
            const bonus = removedCount * 8;
            score += bonus;
            updateScore();

            const scorePop = document.createElement('div');
            scorePop.className = 'score-pop';
            scorePop.textContent = `+${bonus} SKILL!`;
            scorePop.style.cssText = `
                left: ${gameWidth / 2}px;
                top: ${gameHeight / 2}px;
                color: #ff6b35;
            `;
            gameArea.appendChild(scorePop);
            setTimeout(() => scorePop.remove(), 800);
        }

        // スキル完了
        isSkillActive = false;
        canDrop = true;
        skillTimeout = null;
    }, totalDelay);
}

/**
 * スキル効果音
 */
function playSkillSound() {
    if (!audioContext) return;

    // 上昇する「キラーン」音
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, audioContext.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.4);

    // 追加のキラキラ音
    setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.2);

        gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.25);
    }, 150);
}

/**
 * 背景をhaa.jpgに変更
 */
function changeBackgroundToHaa() {
    const gameArea = document.getElementById('game-area');
    gameArea.style.background = `
        linear-gradient(180deg,
            rgba(6, 16, 32, 0.7) 0%,
            rgba(10, 22, 40, 0.3) 50%,
            rgba(15, 30, 50, 0.1) 100%),
        url('./assets/haa.jpg')`;
    gameArea.style.backgroundSize = 'contain';
    gameArea.style.backgroundPosition = 'center bottom';
    gameArea.style.backgroundRepeat = 'no-repeat';
    gameArea.style.backgroundColor = 'rgba(10, 20, 35, 0.95)';
}

/**
 * 背景をaya.pngに変更（レベル10達成時）
 */
function changeBackgroundToAya() {
    const gameArea = document.getElementById('game-area');
    gameArea.style.background = `
        linear-gradient(180deg,
            rgba(6, 16, 32, 0.7) 0%,
            rgba(10, 22, 40, 0.3) 50%,
            rgba(15, 30, 50, 0.1) 100%),
        url('./assets/aya.png')`;
    gameArea.style.backgroundSize = 'contain';
    gameArea.style.backgroundPosition = 'center bottom';
    gameArea.style.backgroundRepeat = 'no-repeat';
    gameArea.style.backgroundColor = 'rgba(10, 20, 35, 0.95)';
}

/**
 * 背景をtomoend.pngに変更（レベル11達成時）
 */
function changeBackgroundToTomoend() {
    const gameArea = document.getElementById('game-area');
    gameArea.style.background = `
        linear-gradient(180deg,
            rgba(6, 16, 32, 0.7) 0%,
            rgba(10, 22, 40, 0.3) 50%,
            rgba(15, 30, 50, 0.1) 100%),
        url('./assets/tomoend.png')`;
    gameArea.style.backgroundSize = 'contain';
    gameArea.style.backgroundPosition = 'center bottom';
    gameArea.style.backgroundRepeat = 'no-repeat';
    gameArea.style.backgroundColor = 'rgba(10, 20, 35, 0.95)';
}

/**
 * 背景を元に戻す
 */
function resetBackground() {
    const gameArea = document.getElementById('game-area');
    gameArea.style.background = `
        linear-gradient(180deg,
            rgba(6, 16, 32, 0.7) 0%,
            rgba(10, 22, 40, 0.5) 50%,
            rgba(15, 30, 50, 0.3) 100%),
        url('./assets/beach_night_bg.png')`;
    gameArea.style.backgroundSize = 'cover';
    gameArea.style.backgroundPosition = 'center bottom';
    gameArea.style.backgroundRepeat = 'no-repeat';
    gameArea.style.backgroundColor = '';
}

/**
 * ゲームを直接リスタート（タイトルに戻らない）
 */
function restartGame() {
    // BGMはそのまま流し続ける
    document.getElementById('game-over').classList.add('hidden');
    initGame();
}

/**
 * タイトル画面を表示
 */
function showTitleScreen() {
    // ゲームを停止（BGMはそのまま流し続ける）
    if (runner) Runner.stop(runner);
    if (render) Render.stop(render);

    // UIの切替
    document.getElementById('title-screen').classList.remove('hidden');
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');

    // ミュージックボックスを更新
    updateMusicBoxDisplay();
}

/**
 * 設定パネルを開く/閉じる
 */
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    isSettingsOpen = !isSettingsOpen;

    if (isSettingsOpen) {
        updateSettingsMusicDisplay();
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
}

/**
 * 設定パネル内のBGM表示を更新
 */
function updateSettingsMusicDisplay() {
    const nameEl = document.getElementById('settings-bgm-name');
    const counterEl = document.getElementById('settings-bgm-counter');

    if (!nameEl || !counterEl) return;

    if (BGM_LIST.length === 0) {
        nameEl.textContent = 'No Music';
        counterEl.textContent = '0 / 0';
        return;
    }

    nameEl.textContent = BGM_LIST[selectedBgmIndex].name;
    counterEl.textContent = `${selectedBgmIndex + 1} / ${BGM_LIST.length}`;
}

/**
 * ゲーム中にBGMを変更
 */
function changeGameBgm(newIndex) {
    selectedBgmIndex = newIndex;
    saveBgmIndex();
    switchBgmTrack();
    updateSettingsMusicDisplay();
}

/**
 * BGMインデックスをlocalStorageに保存
 */
function saveBgmIndex() {
    localStorage.setItem(BGM_INDEX_KEY, selectedBgmIndex.toString());
}

/**
 * BGMインデックスをlocalStorageから読み込み
 */
function loadBgmIndex() {
    const saved = localStorage.getItem(BGM_INDEX_KEY);
    if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < BGM_LIST.length) {
            selectedBgmIndex = idx;
        }
    }
}

/**
 * ミュージックボックスの表示を更新
 */
function updateMusicBoxDisplay() {
    const nameEl = document.getElementById('bgm-name');
    const counterEl = document.getElementById('bgm-counter');

    if (BGM_LIST.length === 0) {
        nameEl.textContent = 'No Music';
        counterEl.textContent = '0 / 0';
        return;
    }

    nameEl.textContent = BGM_LIST[selectedBgmIndex].name;
    counterEl.textContent = `${selectedBgmIndex + 1} / ${BGM_LIST.length}`;
}

/**
 * BGMプレビュー再生
 */
function previewSelectedBgm() {
    if (previewBgm) {
        previewBgm.pause();
        previewBgm.removeAttribute('src');
        previewBgm.load();
        previewBgm = null;
    }
    if (BGM_LIST.length === 0) return;

    previewBgm = new Audio(BGM_LIST[selectedBgmIndex].file);
    previewBgm.volume = 0.2;
    previewBgm.play().catch(() => { });
}

/**
 * タイトル画面の初期化
 */
/**
 * AdMob初期化
 */
async function initAdMob() {
    try {
        if (window.Capacitor?.Plugins?.AdMob) {
            const { AdMob } = window.Capacitor.Plugins;
            await AdMob.initialize({ testingDevices: [], initializeForTesting: false });
            console.log('AdMob initialized');
            // 初回の広告を読み込む
            await prepareRewardAd();
        }
    } catch (e) {
        console.error('AdMob init error:', e);
    }
}

/**
 * リワード広告のプリロード
 */
async function prepareRewardAd() {
    try {
        if (!window.Capacitor?.Plugins?.AdMob) return;
        const { AdMob } = window.Capacitor.Plugins;
        await AdMob.prepareRewardVideoAd({
            adId: 'ca-app-pub-3940256099942544/5224354917', // Google Test ID
            isTesting: true
        });
        console.log('Reward ad preloaded');
    } catch (e) {
        console.error('Reward ad preload error:', e);
    }
}

// 広告クールダウン・制限管理
const AD_COOLDOWN_MS = 4 * 60 * 1000;       // 広告視聴後4分間は広告不要
const AD_BATCH_LIMIT = 5;                     // 5回見たら休憩
const AD_BATCH_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 5回後は2時間クールダウン
const AD_DAILY_MAX = 10;                      // 1日最大10回

function getAdTracker() {
    try {
        const data = JSON.parse(localStorage.getItem('adTracker') || '{}');
        const today = new Date().toDateString();
        if (data.date !== today) {
            return { date: today, count: 0, timestamps: [] };
        }
        return data;
    } catch (e) {
        return { date: new Date().toDateString(), count: 0, timestamps: [] };
    }
}

function saveAdTracker(tracker) {
    try {
        localStorage.setItem('adTracker', JSON.stringify(tracker));
    } catch (e) { }
}

function recordAdWatch() {
    const tracker = getAdTracker();
    tracker.count++;
    tracker.timestamps.push(Date.now());
    saveAdTracker(tracker);
}

function shouldSkipAd() {
    const tracker = getAdTracker();
    const now = Date.now();

    // 1日の上限に達した
    if (tracker.count >= AD_DAILY_MAX) return true;

    // 直近の広告から4分以内
    if (tracker.timestamps.length > 0) {
        const lastWatch = tracker.timestamps[tracker.timestamps.length - 1];
        if (now - lastWatch < AD_COOLDOWN_MS) return true;
    }

    // 5回の倍数に達した後、2時間以内
    if (tracker.count > 0 && tracker.count % AD_BATCH_LIMIT === 0) {
        const lastWatch = tracker.timestamps[tracker.timestamps.length - 1];
        if (now - lastWatch < AD_BATCH_COOLDOWN_MS) return true;
    }

    return false;
}

function initTitleScreen() {
    // AdMob初期化
    initAdMob();

    // 前回のBGM選択を復元
    loadBgmIndex();
    updateMusicBoxDisplay();

    // タイトル画面での初回タッチでBGM再生開始（Android autoplay制約対応）
    let titleBgmStarted = false;
    const startTitleBgm = () => {
        if (titleBgmStarted) return;
        titleBgmStarted = true;
        initSoundContext();
        initAudio();
        playBgm();
    };
    document.getElementById('title-screen').addEventListener('click', startTitleBgm, { once: true });
    document.getElementById('title-screen').addEventListener('touchstart', startTitleBgm, { once: true });

    // 前へボタン
    document.getElementById('bgm-prev').addEventListener('click', () => {
        if (BGM_LIST.length === 0) return;
        startTitleBgm(); // BGMがまだなら開始
        selectedBgmIndex = (selectedBgmIndex - 1 + BGM_LIST.length) % BGM_LIST.length;
        saveBgmIndex();
        updateMusicBoxDisplay();
        // プレビューではなくメインBGMを切り替え
        switchBgmTrack();
    });

    // 次へボタン
    document.getElementById('bgm-next').addEventListener('click', () => {
        if (BGM_LIST.length === 0) return;
        startTitleBgm(); // BGMがまだなら開始
        selectedBgmIndex = (selectedBgmIndex + 1) % BGM_LIST.length;
        saveBgmIndex();
        updateMusicBoxDisplay();
        // プレビューではなくメインBGMを切り替え
        switchBgmTrack();
    });

    // 画像プリロード
    const startBtn = document.getElementById('start-btn');
    const allImages = [
        ...CAT_OBJECTS.filter(c => c.image).map(c => c.image),
        BOMB_OBJECT.image,
        TAMA12_OBJECT.image,
        './assets/beach_night_bg.png',
        './assets/title.png',
        './assets/tomoend.png',
        './assets/tomogame.png',
        './assets/icon512.png',
        './assets/con1.png',
        './assets/con2.png',
        './assets/con3.png',
        './assets/con4.png'
    ].filter(Boolean);

    let imagesLoaded = 0;
    const totalImages = allImages.length;
    startBtn.disabled = true;
    startBtn.textContent = 'LOADING...';

    function onImageLoaded() {
        imagesLoaded++;
        const pct = Math.floor((imagesLoaded / totalImages) * 100);
        startBtn.textContent = `LOADING... ${pct}%`;
        if (imagesLoaded >= totalImages) {
            startBtn.disabled = false;
            startBtn.textContent = 'START';
            startBtn.style.letterSpacing = '8px';
        }
    }

    allImages.forEach(src => {
        const img = new Image();
        img.onload = onImageLoaded;
        img.onerror = onImageLoaded;
        img.src = src;
    });

    // STARTボタン
    startBtn.addEventListener('click', () => {
        if (startBtn.disabled) return;
        startTitleBgm(); // BGMがまだなら開始
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        initGame();
    });

    // 設定パネルの初期化
    initSettingsPanel();
}

/**
 * 設定パネルの初期化
 */
function initSettingsPanel() {
    // 設定ボタン
    document.getElementById('settings-btn').addEventListener('click', toggleSettings);

    // 設定パネル閉じるボタン
    document.getElementById('settings-close').addEventListener('click', toggleSettings);

    // 設定パネル内BGM前へ
    document.getElementById('settings-bgm-prev').addEventListener('click', () => {
        if (BGM_LIST.length === 0) return;
        const newIndex = (selectedBgmIndex - 1 + BGM_LIST.length) % BGM_LIST.length;
        changeGameBgm(newIndex);
    });

    // 設定パネル内BGM次へ
    document.getElementById('settings-bgm-next').addEventListener('click', () => {
        if (BGM_LIST.length === 0) return;
        const newIndex = (selectedBgmIndex + 1) % BGM_LIST.length;
        changeGameBgm(newIndex);
    });
}

/**
 * コマーシャル再生開始（コンティニュー）
 * @param {boolean} forceAd - クールダウンを無視して強制的に広告を表示するか
 */
async function startContinue(forceAd = false) {
    // 状態更新
    hasContinued = true;
    window._hasRewarded = false; // 報酬フラグ初期化

    // ボタン非表示、ローディング表示
    document.getElementById('continue-btn').classList.add('hidden');
    document.getElementById('restart-btn').classList.add('hidden');
    document.getElementById('share-twitter').parentElement.classList.add('hidden');

    const countdownArea = document.getElementById('countdown-area');

    // 広告スキップ判定（クールダウン中 or 上限到達）
    // forceAdが指定されている場合はスキップしない
    if (!forceAd && shouldSkipAd()) {
        executeContinue();
        return;
    }

    if (window.Capacitor?.Plugins?.AdMob) {
        // AdMobリワード広告を表示
        const { AdMob } = window.Capacitor.Plugins;
        countdownArea.classList.remove('hidden');
        isWatchingAd = true; // 広告視聴開始
        try {
            let rewarded = false;
            let dismissed = false;

            // リスナーをまず全て登録
            const rewardListener = await AdMob.addListener('onRewardedVideoAdReward', () => {
                console.log('Ad: rewarded');
                rewarded = true;
                window._hasRewarded = true; // 報酬獲得フラグ
            });
            const failListener = await AdMob.addListener('onRewardedVideoAdFailedToLoad', () => {
                console.warn('Ad: failed to load');
                isWatchingAd = false;
                cleanupListeners();
                // ロード失敗時は復活させず、アラートを出して戻すか、あるいは諦めて復活させるか
                // ここでは復活させる（ユーザー体験優先）
                executeContinue();
            });
            const dismissListener = await AdMob.addListener('onRewardedVideoAdDismissed', () => {
                console.log('Ad: dismissed, rewarded=' + rewarded);
                if (dismissed) return;
                dismissed = true;
                isWatchingAd = false;
                cleanupListeners();
                prepareRewardAd();
                countdownArea.classList.add('hidden');

                if (rewarded) {
                    recordAdWatch();
                    executeContinue();
                } else {
                    // キャンセル: カウントせず確認ダイアログ
                    showAdCancelDialog();
                }
            });

            function cleanupListeners() {
                isWatchingAd = false;
                try { rewardListener.remove(); } catch (e) { }
                try { failListener.remove(); } catch (e) { }
                try { dismissListener.remove(); } catch (e) { }
            }

            await AdMob.showRewardVideoAd();
        } catch (e) {
            console.error('Ad error:', e);
            isWatchingAd = false;
            // 表示エラー時も復活させる（あるいはリトライダイアログを出すべきだが、とりあえず復活）
            executeContinue();
        }
    } else {
        // Web版フォールバック：3秒後に復活
        countdownArea.classList.remove('hidden');
        isWatchingAd = true;
        setTimeout(() => {
            isWatchingAd = false;
            recordAdWatch();
            executeContinue();
        }, 3000);
    }
}

/**
 * 広告キャンセル時のダイアログ表示
 */
function showAdCancelDialog() {
    // すでに報酬獲得済みなら出さない
    if (window._hasRewarded) return;

    // カスタムダイアログを作成（confirm()はWebViewで不安定なため）
    const overlay = document.createElement('div');
    overlay.id = 'ad-cancel-dialog';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.7); z-index: 99999;
        display: flex; justify-content: center; align-items: center;
    `;
    const box = document.createElement('div');
    box.style.cssText = `
        background: #1a1a2e; border: 1px solid rgba(255,255,255,0.2);
        border-radius: 16px; padding: 24px; max-width: 300px; text-align: center;
        color: #fff; font-family: 'Inter', sans-serif;
    `;
    box.innerHTML = `
        <p style="font-size:0.95rem; margin:0 0 8px; font-weight:700;">報酬はもらえません</p>
        <p style="font-size:0.8rem; margin:0 0 20px; color:rgba(255,255,255,0.6);">コンティニューなしで最初からになります</p>
        <div style="display:flex; gap:12px; justify-content:center;">
            <button id="ad-cancel-yes" style="flex:1; padding:12px; border-radius:10px; border:none;
                background:#ff4d4d; color:#fff; font-weight:700; font-size:0.85rem; cursor:pointer;">
                はい（リスタート）
            </button>
            <button id="ad-cancel-no" style="flex:1; padding:12px; border-radius:10px; border:none;
                background:rgba(255,255,255,0.15); color:#fff; font-weight:700; font-size:0.85rem; cursor:pointer;">
                いいえ
            </button>
        </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const yesBtn = document.getElementById('ad-cancel-yes');
    const noBtn = document.getElementById('ad-cancel-no');

    const handleYes = (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.remove();
        restartGame();
    };

    const handleNo = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        overlay.remove();

        // 再度広告を表示する前にロードを試みる
        if (window.Capacitor?.Plugins?.AdMob) {
            const { AdMob } = window.Capacitor.Plugins;
            try {
                await AdMob.prepareRewardVideoAd({
                    adId: 'ca-app-pub-3940256099942544/5224354917', // Test ID
                    isTesting: true
                });
            } catch (e) { console.warn('Retry prepare failed', e); }
        }

        // hasContinuedをリセットして再度広告を表示（強制表示）
        hasContinued = false;
        startContinue(true);
    };

    yesBtn.addEventListener('click', handleYes);
    yesBtn.addEventListener('touchend', handleYes);
    noBtn.addEventListener('click', handleNo);
    noBtn.addEventListener('touchend', handleNo);
}

/**
 * 復活処理
 */
function executeContinue() {
    // ダイアログが出ている場合は消す（成功しているので）
    window._pendingAdCancel = false;
    const dialog = document.getElementById('ad-cancel-dialog');
    if (dialog) dialog.remove();

    // UI戻す
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('restart-btn').classList.remove('hidden');
    document.getElementById('share-twitter').parentElement.classList.remove('hidden');
    document.getElementById('countdown-area').classList.add('hidden');

    // ゲーム再開
    isGameOver = false;
    canDrop = true;
    isInDangerZone = false;
    dangerDropCount = 0;
    dangerSpecialUsed = false;

    // スキル状態リセット
    isSkillActive = false;
    isSkillSelectionMode = false;
    specialSkillTimer = 0;
    skill3Timer = 0;
    skillConditionTimer = 0;
    skillSelectedBodies = [];
    if (skillAttractInterval) { clearInterval(skillAttractInterval); skillAttractInterval = null; }
    if (skillTimeout) { clearTimeout(skillTimeout); skillTimeout = null; }
    if (skillSelectionTimeout) { clearTimeout(skillSelectionTimeout); skillSelectionTimeout = null; }
    if (dangerTimer) { clearTimeout(dangerTimer); dangerTimer = null; }

    // 物理演算のtimeScaleを確実に復元
    engine.timing.timeScale = 1;

    // スキル動画オーバーレイが残っている場合は非表示にする
    const videoOverlay = document.getElementById('skill-video-overlay');
    if (videoOverlay) videoOverlay.classList.add('hidden');
    const skillMsg = document.getElementById('skill-announce-msg');
    if (skillMsg) skillMsg.remove();

    // 小さいオブジェクト（Lv1〜3）のみ削除してスペースを確保
    const bodies = Composite.allBodies(engine.world);
    const bodiesToRemove = bodies.filter(body => {
        if (!body.plugin?.catLevel) return false;
        if (body.isStatic) return false;
        // レベル3以下の小さいものを削除
        return body.plugin.catLevel <= 3;
    });

    bodiesToRemove.forEach(body => {
        // エフェクト出して消す
        showMergeEffect(body.position.x, body.position.y, '✨', 0);
        body.isRemoved = true;
        Composite.remove(engine.world, body);
    });

    // 残ったオブジェクトを少し浮かせて再配置しやすくする
    const displayBodies = Composite.allBodies(engine.world);
    displayBodies.forEach(body => {
        if (!body.plugin?.catLevel) return;
        if (body.isStatic) return;

        // 少し上に浮かせる
        Body.setPosition(body, { x: body.position.x, y: body.position.y - 50 });
        Body.setVelocity(body, { x: 0, y: -2 });
    });

    // 物理シミュレーション再開
    Runner.run(runner, engine);
    // BGMは止めていないので再開不要
}

// ページ読み込み時 → タイトル画面を表示
document.addEventListener('DOMContentLoaded', initTitleScreen);

/**
 * バックグラウンド復帰時のBGM再開（Android対応）
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // バックグラウンドに入った → BGMを一時停止
        if (bgm && isBgmPlaying) {
            bgm.pause();
        }
        if (previewBgm) {
            previewBgm.pause();
        }

        // 広告視聴中にバックグラウンドに行った場合 = 広告キャンセル
        if (isWatchingAd) {
            // すでに報酬獲得済みの場合はキャンセル扱いしない
            if (window._hasRewarded) {
                console.log('Ad: already rewarded, ignoring background check');
            } else {
                console.log('Ad: app went to background during ad');
                isWatchingAd = false;
                // キャンセルはカウントしない、次回フォアグラウンド復帰時にダイアログ表示
                window._pendingAdCancel = true;
            }
        }
    } else {
        // フォアグラウンドに戻った
        // 広告キャンセルがペンディングの場合、ダイアログ表示
        if (window._pendingAdCancel) {
            window._pendingAdCancel = false;
            document.getElementById('countdown-area')?.classList.add('hidden');
            showAdCancelDialog();
        }

        // AudioContextを先に再開してからBGM再生
        const resumeAudio = () => {
            if (bgm && isBgmPlaying) {
                bgm.play().catch(() => { });
            }
        };
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(resumeAudio).catch(resumeAudio);
        } else {
            resumeAudio();
        }
    }
});

/**
 * 画面リサイズ・回転時のゲームエリア再調整（Android対応）
 */
let resizeTimeout = null;
window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // ゲームプレイ中のみリサイズ対応
        if (!engine || isGameOver) return;
        // ゲームコンテナが非表示の場合はスキップ（0x0になるため）
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer || gameContainer.classList.contains('hidden')) return;
        const oldWidth = gameWidth;
        const oldHeight = gameHeight;
        const oldScaleW = scaleW;
        getGameSize();

        // サイズが変わった場合のみ更新
        if (oldWidth !== gameWidth || oldHeight !== gameHeight) {
            // キャンバスを更新
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                canvas.width = gameWidth;
                canvas.height = gameHeight;
            }
            if (render) {
                render.options.width = gameWidth;
                render.options.height = gameHeight;
                render.canvas.width = gameWidth;
                render.canvas.height = gameHeight;
            }

            // 壁と床を新しいサイズで再作成
            recreateWalls();

            // 既存ボールの位置とサイズをスケーリング
            const scaleRatioX = gameWidth / oldWidth;
            const scaleRatioY = gameHeight / oldHeight;
            const radiusRatio = scaleW / oldScaleW;

            const bodies = Composite.allBodies(engine.world);
            bodies.forEach(body => {
                if (!body.plugin?.catLevel) return;
                if (body.isStatic || body.isRemoved) return;

                // 位置を新しいサイズに合わせて移動
                const newX = body.position.x * scaleRatioX;
                const newY = body.position.y * scaleRatioY;
                Body.setPosition(body, { x: newX, y: newY });

                // 半径をスケーリング
                const cat = getCatByLevel(body.plugin.catLevel);
                const newRadius = scaledRadius(cat);
                Body.scale(body, radiusRatio, radiusRatio);
                body.circleRadius = newRadius;
            });

            // ドロップ位置を画面内に制限
            dropX = Math.min(Math.max(dropX * scaleRatioX, GAME_CONFIG.wallThickness + 20), gameWidth - GAME_CONFIG.wallThickness - 20);
        }
    }, 200);
});

/**
 * ホールド機能を使用
 */
function useHold() {
    // ゲームオーバー中、落下中、残り回数0なら使えない
    if (isGameOver || !canDrop || holdCount <= 0) return;

    // 爆弾モード中は使えない
    if (isBombMode) return;

    // ホールド使用
    holdCount--;

    if (holdCat === null) {
        // ホールドが空の場合: 現在のボールを保留して次を取得
        holdCat = currentCat;
        currentCat = nextCat;
        nextCat = rollNextCat();
    } else {
        // ホールドにボールがある場合: 現在のボールと交換
        const temp = currentCat;
        currentCat = holdCat;
        holdCat = temp;
    }

    // UI更新
    updateNextDisplay();
    updateHoldDisplay();

    // 効果音
    playClickSound();
}

/**
 * ホールド表示を更新
 */
function updateHoldDisplay() {
    const holdCatEl = document.getElementById('hold-cat');
    const holdCountEl = document.getElementById('hold-count');
    const holdBtn = document.getElementById('hold-btn');

    // 残り回数表示
    holdCountEl.textContent = holdCount;
    if (holdCount <= 0) {
        holdCountEl.classList.add('exhausted');
        holdBtn.disabled = true;
    } else {
        holdCountEl.classList.remove('exhausted');
        holdBtn.disabled = false;
    }

    // ホールド中のボール表示
    if (holdCat) {
        holdCatEl.classList.add('has-cat');
        if (holdCat.image) {
            holdCatEl.innerHTML = `<img src="${holdCat.image}" alt="${holdCat.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            holdCatEl.textContent = holdCat.emoji;
        }
    } else {
        holdCatEl.classList.remove('has-cat');
        holdCatEl.innerHTML = '';
    }
}

/**
 * NEXT表示を更新
 */
function updateNextDisplay() {
    const nextCatEl = document.getElementById('next-cat');
    if (nextCat.image) {
        nextCatEl.innerHTML = `<img src="${nextCat.image}" alt="${nextCat.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        nextCatEl.textContent = nextCat.emoji;
    }
}

/**
 * クリック音
 */
function playClickSound() {
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioContext.currentTime);

    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);
}

// ホールドボタンのイベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    const holdBtn = document.getElementById('hold-btn');
    if (holdBtn) {
        holdBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            useHold();
        });
    }

    // リロールボタン
    const rerollBtn = document.getElementById('reroll-btn');
    if (rerollBtn) {
        rerollBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            useReroll();
        });
    }

    // スキルボタン
    const skillBtn = document.getElementById('skill-btn');
    if (skillBtn) {
        skillBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSkillMode();
        });
    }
});

/**
 * リロール機能を使用
 */
function useReroll() {
    // ゲームオーバー中、落下中、残り回数0なら使えない
    if (isGameOver || !canDrop || rerollCount <= 0) return;

    // 爆弾モード中は使えない
    if (isBombMode) return;

    // リロール使用
    rerollCount--;

    // 現在のボールを引き直し
    currentCat = getRandomDroppableCat();

    // UI更新
    updateRerollDisplay();

    // 効果音
    playClickSound();
}

/**
 * リロール表示を更新
 */
function updateRerollDisplay() {
    const rerollCountEl = document.getElementById('reroll-count');
    const rerollBtn = document.getElementById('reroll-btn');

    // 残り回数表示
    rerollCountEl.textContent = rerollCount;
    if (rerollCount <= 0) {
        rerollCountEl.classList.add('exhausted');
        rerollBtn.disabled = true;
    } else {
        rerollCountEl.classList.remove('exhausted');
        rerollBtn.disabled = false;
    }
}


// キャストパネル初期化
let isFirstCastOpen = true;

function initCastPanel() {
    const castBtn = document.getElementById('cast-btn');
    const castPanel = document.getElementById('cast-panel');
    const castClose = document.getElementById('cast-close');

    // 詳細モーダル
    const detailModal = document.getElementById('cast-detail-modal');
    const detailModalClose = document.getElementById('detail-modal-close');

    if (castBtn && castPanel && castClose) {
        // Open Cast List
        castBtn.addEventListener('click', () => {
            renderCastList();
            castPanel.classList.remove('hidden');
            playClickSound();
        });

        // Close Cast List
        castClose.addEventListener('click', () => {
            castPanel.classList.add('hidden');
            playClickSound();
        });

        // Close on outside click (Cast List)
        castPanel.addEventListener('click', (e) => {
            if (e.target === castPanel) {
                castPanel.classList.add('hidden');
            }
        });
    }

    // 詳細モーダルの閉じるボタン
    if (detailModalClose && detailModal) {
        detailModalClose.addEventListener('click', () => {
            detailModal.classList.add('hidden');
            // リストパネルを表示
            castPanel.classList.remove('hidden');
            playClickSound();
        });

        // 背景クリックで閉じる
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) {
                detailModal.classList.add('hidden');
                castPanel.classList.remove('hidden');
            }
        });
    }
}

// キャストリスト生成
function renderCastList() {
    const listEl = document.getElementById('cast-list');
    if (!listEl) return;

    // 一度だけ生成するようにチェック
    if (listEl.children.length > 0) return;

    listEl.innerHTML = '';

    // 通常キャスト + 特殊玉を結合
    const allCast = [...CAT_OBJECTS, TAMA12_OBJECT];

    allCast.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'cast-item';

        // 画像と名前
        let imgHtml = '';
        if (cat.image) {
            imgHtml = `<img src="${cat.image}" alt="${cat.name}" class="cast-image">`;
        } else {
            imgHtml = `<div class="cast-image" style="background:${cat.color};display:flex;justify-content:center;align-items:center;font-size:1.5rem;">${cat.emoji}</div>`;
        }

        // レベル表記（特殊玉は「特殊玉」と表示）
        const levelText = cat.isYoshiki ? '特殊玉' : `Lv.${cat.level}`;

        item.innerHTML = `
            ${imgHtml}
            <div class="cast-name">${cat.name}</div>
            <div class="cast-level">${levelText}</div>
        `;

        // クリックイベント
        item.addEventListener('click', () => {
            showCastDetail(cat);
            playClickSound();
        });

        listEl.appendChild(item);
    });
}

// キャスト詳細表示（全画面モーダル）
function showCastDetail(cat) {
    const castPanel = document.getElementById('cast-panel');
    const detailModal = document.getElementById('cast-detail-modal');

    // 要素取得
    const imgEl = document.getElementById('detail-image');
    const nameEl = document.getElementById('detail-name');
    const levelEl = document.getElementById('detail-level');
    const descEl = document.getElementById('detail-desc');

    // データセット
    if (cat.image) {
        imgEl.innerHTML = `<img src="${cat.image}" alt="${cat.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        imgEl.innerHTML = cat.emoji;
        imgEl.style.fontSize = "4rem";
        imgEl.style.background = cat.color;
    }

    nameEl.textContent = cat.name;
    levelEl.textContent = cat.isYoshiki ? '特殊玉' : `Level ${cat.level}`;
    levelEl.style.color = cat.color;
    levelEl.style.backgroundColor = `${cat.color}20`;

    // 説明文
    const descriptions = [
        "南国のビーチで遊ぶのが大好き！<br>小さくて可愛いけど、集まると大変かも？",
        "海風を感じながらリラックス中。<br>優雅なひとときを過ごしているよ。",
        "真夏の太陽の下で輝く存在。<br>キラキラしたものが大好き！",
        "夜のビーチパーティーの主役！<br>みんなを盛り上げるのが得意。",
        "伝説の輝きを秘めた存在。<br>出会えたあなたは超ラッキー！"
    ];
    const descIndex = Math.min(Math.floor((cat.level - 1) / 2), descriptions.length - 1);
    descEl.innerHTML = cat.description || descriptions[descIndex];

    // SNSリンク生成
    const linksContainer = detailModal.querySelector('.detail-links');
    if (linksContainer) {
        linksContainer.innerHTML = '';

        if (cat.links) {
            // Twitter
            if (cat.links.twitter) {
                const btn = document.createElement('a');
                btn.href = cat.links.twitter;
                btn.target = '_blank';
                btn.className = 'detail-link-btn twitter';
                btn.textContent = 'X (Twitter)';
                linksContainer.appendChild(btn);
            }
            // YouTube
            if (cat.links.youtube) {
                const btn = document.createElement('a');
                btn.href = cat.links.youtube;
                btn.target = '_blank';
                btn.className = 'detail-link-btn youtube';
                btn.textContent = 'YouTube';
                linksContainer.appendChild(btn);
            }
            // YouTube 1
            if (cat.links.youtube1) {
                const btn = document.createElement('a');
                btn.href = cat.links.youtube1;
                btn.target = '_blank';
                btn.className = 'detail-link-btn youtube';
                btn.textContent = 'YouTube①';
                linksContainer.appendChild(btn);
            }
            // YouTube 2
            if (cat.links.youtube2) {
                const btn = document.createElement('a');
                btn.href = cat.links.youtube2;
                btn.target = '_blank';
                btn.className = 'detail-link-btn youtube';
                btn.textContent = 'YouTube②';
                linksContainer.appendChild(btn);
            }
            // YouTube Channel
            if (cat.links.youtube_channel) {
                const btn = document.createElement('a');
                btn.href = cat.links.youtube_channel;
                btn.target = '_blank';
                btn.className = 'detail-link-btn youtube';
                btn.textContent = 'YouTubeチャンネル';
                linksContainer.appendChild(btn);
            }
            // Instagram
            if (cat.links.instagram) {
                const btn = document.createElement('a');
                btn.href = cat.links.instagram;
                btn.target = '_blank';
                btn.className = 'detail-link-btn instagram';
                btn.textContent = 'Instagram';
                linksContainer.appendChild(btn);
            }
            // Map
            if (cat.links.map) {
                const btn = document.createElement('a');
                btn.href = cat.links.map;
                btn.target = '_blank';
                btn.className = 'detail-link-btn map';
                btn.textContent = 'お店の場所 📍';
                linksContainer.appendChild(btn);
            }
        }
    }

    // リストパネルを閉じて詳細モーダルを開く
    if (castPanel) castPanel.classList.add('hidden');
    if (detailModal) detailModal.classList.remove('hidden');
}


// Evolution Guideの生成（横一列 + 矢印）
function initEvolutionChart() {
    const chart = document.getElementById('evolution-chart');
    if (!chart) return;

    chart.innerHTML = '';

    CAT_OBJECTS.forEach((cat, index) => {
        // Item
        const item = document.createElement('div');
        item.className = 'evo-item';
        item.dataset.level = cat.level;

        // 画像設定
        if (cat.image) {
            item.style.backgroundImage = `url("${cat.image}")`;
            item.style.backgroundSize = 'cover';
            item.style.backgroundPosition = 'center';
            item.style.backgroundColor = 'transparent';
        } else {
            item.textContent = cat.emoji;
            item.style.backgroundColor = cat.color;
        }

        chart.appendChild(item);

        // 矢印（最後のアイテム以外）
        if (index < CAT_OBJECTS.length - 1) {
            const arrow = document.createElement('span');
            arrow.className = 'evo-arrow';
            arrow.textContent = '▸';
            chart.appendChild(arrow);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initCastPanel();
    initEvolutionChart();
});
