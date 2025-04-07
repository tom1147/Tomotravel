document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed"); // デバッグ用ログ

    // === HTMLコンポーネントの読み込み関数 ===
    // url: 読み込むHTMLファイルのパス (このscript.jsからの相対パス)
    // placeholderId: HTMLを挿入する要素のID
    // callback: 読み込み完了後に実行する関数
    const loadHTML = (url, placeholderId, callback) => {
        console.log(`Attempting to load: ${url} into #${placeholderId}`);
        // fetchは実行中のJSファイル(script.js)からの相対パスでファイルを解決する
        fetch(url)
            .then(response => {
                console.log(`Response status for ${url}: ${response.status}`);
                if (!response.ok) {
                    // エラーレスポンスの内容も表示
                    return response.text().then(text => {
                        throw new Error(`HTTP error! status: ${response.status} for ${url}. Response: ${text}`);
                    });
                }
                return response.text();
            })
            .then(data => {
                const placeholder = document.getElementById(placeholderId);
                console.log(`Placeholder element #${placeholderId}:`, placeholder);
                if (placeholder) {
                    placeholder.innerHTML = data;
                    console.log(`Successfully loaded ${url} into #${placeholderId}`);
                    // 読み込み完了後にコールバック関数を実行
                    if (callback) {
                        console.log(`Executing callback for #${placeholderId}`);
                        callback();
                    }
                } else {
                    console.error(`Placeholder element with id "${placeholderId}" not found.`);
                }
            })
            .catch(error => {
                console.error(`Could not load HTML from ${url}:`, error);
                const placeholder = document.getElementById(placeholderId);
                if (placeholder) {
                    // エラーメッセージをプレースホルダー内に表示
                    placeholder.innerHTML = `<p style="color: red; text-align: center; border: 1px solid red; padding: 10px;">Error loading ${placeholderId.replace('-placeholder','')}: ${error.message}. Check path and file existence.</p>`;
                }
            });
    };

    // === ヘッダー読み込み後に実行される初期化関数 ===
    function initializeHeaderScript() {
        console.log("Attempting to initialize header scripts...");

        // --- ヘッダーのスクロール変化 ---
        const header = document.getElementById('header'); // header.html内の要素を取得
        console.log("Header element found by initializeHeaderScript:", header);
        if (header) {
             // 最初の状態をチェック
             if (window.scrollY > 50) {
                 header.classList.add('scrolled');
             }
            window.addEventListener('scroll', function() {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
            console.log("Scroll listener for header added.");
        } else {
             console.error("Header element (#header) not found AFTER loading header.html");
        }

        // --- ハンバーガーメニュー ---
        const menuToggle = document.getElementById('menu-toggle'); // header.html内の要素を取得
        const mainNav = document.getElementById('main-nav');       // header.html内の要素を取得
        const body = document.body;
        console.log("Menu toggle:", menuToggle, "Main nav:", mainNav);

        // モバイルメニューを開閉する関数
        function openMobileMenu() {
            if (mainNav && menuToggle) {
                mainNav.classList.add('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                }
                menuToggle.setAttribute('aria-expanded', 'true');
                body.style.overflow = 'hidden'; // 背景のスクロールを禁止
            }
        }

        function closeMobileMenu() {
            // メニューがアクティブかどうかチェック
            if (mainNav && menuToggle && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
                menuToggle.setAttribute('aria-expanded', 'false');
                body.style.overflow = ''; // 背景のスクロール禁止を解除
            }
        }

        if (menuToggle && mainNav) {
            menuToggle.setAttribute('aria-controls', 'main-nav');
            menuToggle.setAttribute('aria-expanded', 'false');

            menuToggle.addEventListener('click', function(event) {
                event.stopPropagation(); // クリックイベントが伝播しないようにする
                if (mainNav.classList.contains('active')) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }
            });
             console.log("Menu toggle click listener added.");

            // ナビゲーションリンククリックでメニューを閉じる
            const navLinks = mainNav.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    // 今回はどのリンクでも閉じる
                    closeMobileMenu();
                });
            });
            console.log("Nav link click listeners added.");

            // メニュー外クリックでメニューを閉じる
            document.addEventListener('click', function(event) {
                const isClickInsideNav = mainNav.contains(event.target);
                const isClickOnToggle = menuToggle.contains(event.target);

                if (!isClickInsideNav && !isClickOnToggle && mainNav.classList.contains('active')) {
                    closeMobileMenu();
                }
            });
            console.log("Document click listener for closing menu added.");

             // ESCキーでメニューを閉じる
             document.addEventListener('keydown', function(event) {
                 if (event.key === 'Escape' && mainNav.classList.contains('active')) {
                     closeMobileMenu();
                 }
             });
            console.log("Document keydown listener for closing menu added.");

        } else {
            if (!menuToggle) console.error("Menu toggle element (#menu-toggle) not found AFTER loading header.html");
            if (!mainNav) console.error("Main navigation element (#main-nav) not found AFTER loading header.html");
        }
         console.log("Header script initialization finished.");
    } // --- end of initializeHeaderScript ---


    // === フッター読み込み後に実行される初期化関数 (必要なら) ===
    // function initializeFooterScript() { ... }

    // === サイドバー読み込み後に実行される初期化関数 (必要なら) ===
    // function initializeSidebarScript() { ... }

    // === 実際の読み込み処理 ===
    // このスクリプト(script.js)が blog/ ディレクトリにあるため、
    // 同じ blog/ ディレクトリにあるファイルは './' またはファイル名のみで指定。
    // header.html, footer.html, sidebar.html が blog/ にある前提。
    loadHTML('./header.html', 'header-placeholder', initializeHeaderScript);
    loadHTML('./footer.html', 'footer-placeholder', null); // フッター用JSがない場合
    loadHTML('./sidebar.html', 'sidebar-placeholder', null); // サイドバー用JSがない場合

    // === ブログ記事本体に特有のスクリプトがあればここに追加 ===
    console.log("Executing other scripts unrelated to loaded components...");

}); // END DOMContentLoaded
