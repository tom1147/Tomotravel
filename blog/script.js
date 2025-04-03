// blog/script.js
// 元の blog(1).html の <script>...</script> 内のコードをそのままコピー
// DOMContentLoaded の囲みはそのまま残します
document.addEventListener('DOMContentLoaded', function() {
    // --- ヘッダーのスクロール変化 ---
    // ヘッダー要素は header.html が読み込まれた後でないと存在しないため、
    // このファイルが読み込まれるタイミングではなく、
    // 実際に操作する関数内で要素を取得するか、
    // ヘッダー読み込み完了後にイベントリスナーを設定する方が確実です。
    // しかし、DOMContentLoaded内で要素を探す一般的なパターンで一旦記述します。
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) { // 50px スクロールで変化
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    } else {
        // ヘッダー読み込み前にスクリプトが実行された場合の警告（デバッグ用）
        // console.warn("Header element not found on DOMContentLoaded. Event listener might not be attached yet.");
    }

    // --- ハンバーガーメニュー ---
    // 同様に、メニュー要素も header.html 読み込み後に存在します。
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const body = document.body;

    // ヘッダー読み込みを待つ必要があるため、
    // クリックイベントの設定は、header.html読み込み後に行う方が安全です。
    // (下の blog.html 内の読み込み用JSで対応します)
    // ここでは関数定義のみを行います。

    function openMobileMenu() {
        // 要素の存在確認を追加
        const nav = document.getElementById('main-nav');
        const toggle = document.getElementById('menu-toggle');
        const bodyEl = document.body;
        if (nav && toggle) {
            nav.classList.add('active');
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            }
            toggle.setAttribute('aria-expanded', 'true');
            if (bodyEl) bodyEl.style.overflow = 'hidden'; // 背景スクロール禁止
        } else {
            console.error("Cannot open mobile menu: nav or toggle element not found.");
        }
    }

    function closeMobileMenu() {
        // 要素の存在確認を追加
        const nav = document.getElementById('main-nav');
        const toggle = document.getElementById('menu-toggle');
        const bodyEl = document.body;
        if (nav && toggle && nav.classList.contains('active')) {
            nav.classList.remove('active');
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
            toggle.setAttribute('aria-expanded', 'false');
            if (bodyEl) bodyEl.style.overflow = ''; // 背景スクロール許可
        }
        // activeでない場合は何もしないか、エラーログを出す（必要に応じて）
    }

    // イベントリスナー設定用の関数 (blog.html側のJSから呼び出す)
    window.initializeHeaderEvents = function() {
        console.log("Initializing header events...");
        const menuToggleBtn = document.getElementById('menu-toggle');
        const mainNavMenu = document.getElementById('main-nav');

        if (menuToggleBtn && mainNavMenu) {
            menuToggleBtn.setAttribute('aria-controls', 'main-nav');
            menuToggleBtn.setAttribute('aria-expanded', 'false');

            menuToggleBtn.addEventListener('click', function(event) {
                event.stopPropagation(); // クリックイベントが伝播しないように
                if (mainNavMenu.classList.contains('active')) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }
            });

            // メニュー内のリンククリックで閉じる
            const navLinks = mainNavMenu.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                     // ページ内リンク(#aboutなど)や外部リンク、ブログページへのリンクでも閉じる
                    closeMobileMenu();
                });
            });

             // メニュー外をクリックしたら閉じる (Body全体に対するリスナー)
             // 注意: header.html読み込み前にbodyにリスナーを設定すると意図通り動かない可能性
             // Bodyへのリスナーは初期化時に設定しても良いかも
             document.body.addEventListener('click', function(event) { // body に変更
                 // メニュー要素が存在するか再確認
                 const currentMainNav = document.getElementById('main-nav');
                 const currentMenuToggle = document.getElementById('menu-toggle');
                 if (!currentMainNav || !currentMenuToggle) return; // 要素がなければ何もしない

                 const isClickInsideNav = currentMainNav.contains(event.target);
                 const isClickOnToggle = currentMenuToggle.contains(event.target);

                 if (!isClickInsideNav && !isClickOnToggle && currentMainNav.classList.contains('active')) {
                     closeMobileMenu();
                 }
             });

             // Escキーでメニューを閉じる (Document全体に対するリスナー)
             document.addEventListener('keydown', function(event) {
                 // メニュー要素が存在するか再確認
                  const currentMainNav = document.getElementById('main-nav');
                  if (!currentMainNav) return;

                 if (event.key === 'Escape' && currentMainNav.classList.contains('active')) {
                     closeMobileMenu();
                 }
             });
             console.log("Header events initialized.");

        } else {
            console.error("Could not initialize header events: menuToggle or mainNav not found.");
        }

        // スクロールイベントは window に対してなので、ここで設定しても問題ない
        const headerElement = document.getElementById('header');
        if (headerElement) {
             window.addEventListener('scroll', function() {
                 if (window.scrollY > 50) {
                     headerElement.classList.add('scrolled');
                 } else {
                     headerElement.classList.remove('scrolled');
                 }
             });
             console.log("Scroll event listener added.");
        } else {
             console.error("Could not add scroll event listener: header element not found.");
        }
    };

}); // END DOMContentLoaded
