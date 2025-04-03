document.addEventListener('DOMContentLoaded', function() {
    // --- ヘッダーのスクロール変化 ---
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // --- ハンバーガーメニュー ---
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const body = document.body;

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

        // ナビゲーションリンククリックでメニューを閉じる
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // ページ内リンク(#から始まる)の場合のみ閉じる（外部リンクや別ページへのリンクでは閉じないようにする場合）
                // if (link.getAttribute('href').startsWith('#') || link.getAttribute('href').startsWith('/#')) {
                    closeMobileMenu();
                // }
                // 今回はどのリンクでも閉じるようにします
            });
        });

        // メニュー外クリックでメニューを閉じる
        document.addEventListener('click', function(event) {
            const isClickInsideNav = mainNav.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);

            if (!isClickInsideNav && !isClickOnToggle && mainNav.classList.contains('active')) {
                closeMobileMenu();
            }
        });

         // ESCキーでメニューを閉じる
         document.addEventListener('keydown', function(event) {
             if (event.key === 'Escape' && mainNav.classList.contains('active')) {
                 closeMobileMenu();
             }
         });
    }

}); // END DOMContentLoaded