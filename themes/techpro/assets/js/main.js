document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. Theme Toggle
    // ---------------------------------------------------------
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    function updateThemeIcons(isDark) {
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isDark ? 'block' : 'none';
            moonIcon.style.display = isDark ? 'none' : 'block';
        }
    }

    if (themeToggle) {
        updateThemeIcons(document.documentElement.classList.contains('dark'));

        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
            updateThemeIcons(isDark);

            // Re-render Mermaid if active
            if (window.mermaid) {
                const diagrams = document.querySelectorAll('.language-mermaid, pre.mermaid');
                diagrams.forEach(el => {
                    el.removeAttribute('data-processed');
                });
                try {
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: isDark ? 'dark' : 'default',
                        themeVariables: { fontFamily: 'Inter, system-ui, sans-serif' }
                    });
                    mermaid.run();
                } catch (e) {
                    console.debug('Mermaid re-render notice:', e);
                }
            }
        });
    }

    // ---------------------------------------------------------
    // 2. Mobile Navigation Menu Toggle
    // ---------------------------------------------------------
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('open');
            mobileMenuToggle.classList.toggle('open', isOpen);
            mobileMenuToggle.setAttribute('aria-expanded', isOpen);
            document.body.classList.toggle('menu-open', isOpen);
        });

        // Close menu when clicking outside or on a link
        document.addEventListener('click', (e) => {
            if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mainNav.classList.remove('open');
                mobileMenuToggle.classList.remove('open');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            }
        });

        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('open');
                mobileMenuToggle.classList.remove('open');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // ---------------------------------------------------------
    // 3. Code Block Copy Buttons & Language Headers
    // ---------------------------------------------------------
    const codeBlocks = document.querySelectorAll('.post-content pre');

    codeBlocks.forEach(pre => {
        // Avoid adding headers multiple times
        if (pre.querySelector('.code-header')) return;

        const code = pre.querySelector('code');
        const codeText = code ? code.innerText : pre.innerText;

        // Detect language from class (e.g. language-go, language-bash, chroma class)
        let lang = '';
        if (code && code.className) {
            const match = code.className.match(/language-([a-zA-Z0-9_-]+)/);
            if (match) lang = match[1];
        }
        if (!lang && pre.parentElement && pre.parentElement.className) {
            const match = pre.parentElement.className.match(/highlight-([a-zA-Z0-9_-]+)/);
            if (match) lang = match[1];
        }

        // Create container wrapper if not wrapped
        const header = document.createElement('div');
        header.className = 'code-header';

        const langBadge = document.createElement('span');
        langBadge.className = 'code-lang';
        langBadge.textContent = lang ? lang.toUpperCase() : 'CODE';
        header.appendChild(langBadge);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'code-copy-btn';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
        copyBtn.title = 'Copy code';
        copyBtn.innerHTML = `
            <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span class="copy-text">Copy</span>
        `;

        copyBtn.addEventListener('click', async () => {
            try {
                // Strip line numbers if copied from line-numbered code
                const textToCopy = code ? code.innerText : pre.innerText;
                await navigator.clipboard.writeText(textToCopy);
                
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `
                    <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span class="copy-text">Copied!</span>
                `;

                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `
                        <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        <span class="copy-text">Copy</span>
                    `;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy code', err);
            }
        });

        header.appendChild(copyBtn);
        pre.insertBefore(header, pre.firstChild);
    });

    // ---------------------------------------------------------
    // 4. Reading Progress Bar & Back-to-Top Button
    // ---------------------------------------------------------
    const progressBar = document.getElementById('reading-progress-bar');
    const backToTopBtn = document.getElementById('back-to-top');
    const article = document.querySelector('article.post-single');

    function handleScroll() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

        if (progressBar && article) {
            const articleTop = article.offsetTop;
            const articleHeight = article.offsetHeight;
            const current = scrollTop - articleTop;
            const progress = Math.max(0, Math.min(100, (current / (articleHeight - window.innerHeight * 0.6)) * 100));
            progressBar.style.width = `${progress}%`;
        }

        if (backToTopBtn) {
            if (scrollTop > 350) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---------------------------------------------------------
    // 5. i18n Tabs Logic
    // ---------------------------------------------------------
    const tabGroups = document.querySelectorAll('.i18n-tabs');
    const savedLang = localStorage.getItem('lang-preference');

    tabGroups.forEach(group => {
        const buttons = group.querySelectorAll('.tab-btn');
        const contents = group.querySelectorAll('.tab-content');
        let initialLangSet = false;

        buttons.forEach((btn, index) => {
            const lang = btn.getAttribute('data-lang');
            
            if ((savedLang && lang === savedLang) || (!savedLang && index === 0)) {
                btn.classList.add('active');
                if (contents[index]) contents[index].classList.add('active');
                initialLangSet = true;
            }

            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                if (contents[index]) contents[index].classList.add('active');
                
                localStorage.setItem('lang-preference', lang);
                syncOtherTabs(lang, group);
            });
        });
        
        if (!initialLangSet && buttons.length > 0) {
            buttons[0].classList.add('active');
            if (contents[0]) contents[0].classList.add('active');
        }
    });
    
    function syncOtherTabs(lang, originGroup) {
        tabGroups.forEach(group => {
            if (group === originGroup) return;
            const targetBtn = group.querySelector(`.tab-btn[data-lang="${lang}"]`);
            if (targetBtn) {
                targetBtn.click();
            }
        });
    }
});

