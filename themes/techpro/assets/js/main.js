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
                        theme: isDark ? 'dark' : 'neutral',
                        themeVariables: {
                            fontFamily: "'Noto Serif SC', 'Songti SC', Georgia, serif",
                            primaryColor: isDark ? '#1a1a1a' : '#f7f6f2',
                            primaryTextColor: isDark ? '#f5f5f5' : '#111111',
                            primaryBorderColor: isDark ? '#d93830' : '#b91c1c',
                            lineColor: isDark ? '#888888' : '#333333'
                        }
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

    // ---------------------------------------------------------
    // 6. Collapsible Accordion Sidebar & ScrollSpy
    // ---------------------------------------------------------
    const tocAccordion = document.getElementById('toc-accordion');
    const tocToggleBtn = document.getElementById('toc-accordion-toggle');
    const tocStripExpandBtn = document.getElementById('toc-strip-expand');
    const postLayout = document.getElementById('post-body-layout');

    if (tocAccordion && postLayout) {
        // Restore saved collapsed state or URL param (?toc=collapsed)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToc = urlParams.get('toc');
        const savedCollapsed = urlToc === 'collapsed' || (urlToc !== 'open' && localStorage.getItem('toc-collapsed') === 'true');
        if (savedCollapsed) {
            postLayout.classList.add('sidebar-collapsed');
            tocAccordion.classList.add('collapsed');
            if (tocToggleBtn) tocToggleBtn.setAttribute('aria-expanded', 'false');
        }

        function toggleSidebar(collapsed) {
            const isNowCollapsed = collapsed !== undefined 
                ? collapsed 
                : !postLayout.classList.contains('sidebar-collapsed');
            
            postLayout.classList.toggle('sidebar-collapsed', isNowCollapsed);
            tocAccordion.classList.toggle('collapsed', isNowCollapsed);
            if (tocToggleBtn) tocToggleBtn.setAttribute('aria-expanded', !isNowCollapsed);
            localStorage.setItem('toc-collapsed', isNowCollapsed);
        }

        if (tocToggleBtn) {
            tocToggleBtn.addEventListener('click', () => toggleSidebar());
        }

        if (tocStripExpandBtn) {
            tocStripExpandBtn.addEventListener('click', () => toggleSidebar(false));
        }

        // Mobile Slide-out Drawer Handlers (Permanently visible pull tab + bottom drawer sheet)
        const mobilePullTab = document.getElementById('toc-mobile-pull-tab');
        const mobileBackdrop = document.getElementById('toc-mobile-backdrop');
        const mobileBottomFade = document.querySelector('.toc-mobile-bottom-fade');
        const stickySidebar = document.querySelector('.sticky-sidebar');

        // Portal mobile TOC elements directly under document.body on mobile viewports
        // so that mobile browser compositors never cull them as off-screen subtree elements.
        function syncMobileTocDom() {
            if (window.innerWidth <= 1024) {
                if (mobilePullTab && mobilePullTab.parentElement !== document.body) {
                    document.body.appendChild(mobilePullTab);
                }
                if (mobileBackdrop && mobileBackdrop.parentElement !== document.body) {
                    document.body.appendChild(mobileBackdrop);
                }
                if (mobileBottomFade && mobileBottomFade.parentElement !== document.body) {
                    document.body.appendChild(mobileBottomFade);
                }
                if (tocAccordion && tocAccordion.parentElement !== document.body) {
                    document.body.appendChild(tocAccordion);
                }
            } else {
                if (tocAccordion && stickySidebar && tocAccordion.parentElement !== stickySidebar) {
                    stickySidebar.appendChild(tocAccordion);
                }
            }
        }
        syncMobileTocDom();

        function toggleMobileDrawer(open) {
            const shouldOpen = open !== undefined
                ? open
                : !tocAccordion.classList.contains('mobile-drawer-open');

            tocAccordion.classList.toggle('mobile-drawer-open', shouldOpen);
            if (mobileBackdrop) {
                mobileBackdrop.classList.toggle('open', shouldOpen);
            }
            if (mobilePullTab) {
                mobilePullTab.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
                mobilePullTab.setAttribute('aria-label', shouldOpen ? 'Close Table of Contents' : 'Open Table of Contents');
                mobilePullTab.classList.toggle('drawer-open', shouldOpen);

                if (shouldOpen) {
                    // Synchronously measure drawer height and elevate pull tab smoothly above the drawer sheet
                    const drawerHeight = tocAccordion.offsetHeight;
                    mobilePullTab.style.transform = `translateX(-50%) translateY(-${drawerHeight - 1}px) translateZ(0)`;
                } else {
                    mobilePullTab.style.transform = '';
                }
            }
            if (shouldOpen) {
                document.body.classList.add('toc-drawer-active');
            } else {
                document.body.classList.remove('toc-drawer-active');
            }
        }

        function closeMobileDrawer() {
            toggleMobileDrawer(false);
        }

        if (mobilePullTab) {
            mobilePullTab.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMobileDrawer();
            });
        }

        if (mobileBackdrop) {
            mobileBackdrop.addEventListener('click', () => {
                closeMobileDrawer();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && tocAccordion.classList.contains('mobile-drawer-open')) {
                closeMobileDrawer();
            }
        });

        window.addEventListener('resize', () => {
            syncMobileTocDom();
            if (window.innerWidth > 1024 && tocAccordion.classList.contains('mobile-drawer-open')) {
                closeMobileDrawer();
            } else if (tocAccordion.classList.contains('mobile-drawer-open') && mobilePullTab) {
                const drawerHeight = tocAccordion.offsetHeight;
                mobilePullTab.style.transform = `translateX(-50%) translateY(-${drawerHeight - 1}px) translateZ(0)`;
            }
        });

        // Swipe down to dismiss drawer on mobile
        let touchStartY = 0;
        let touchCurrentY = 0;

        tocAccordion.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchCurrentY = touchStartY;
        }, { passive: true });

        tocAccordion.addEventListener('touchmove', (e) => {
            touchCurrentY = e.touches[0].clientY;
        }, { passive: true });

        tocAccordion.addEventListener('touchend', () => {
            const drawerBody = tocAccordion.querySelector('.toc-accordion-body');
            const isAtTop = !drawerBody || drawerBody.scrollTop <= 5;
            if (isAtTop && (touchCurrentY - touchStartY > 50) && tocAccordion.classList.contains('mobile-drawer-open')) {
                closeMobileDrawer();
            }
            touchStartY = 0;
            touchCurrentY = 0;
        });

        // Subsections accordion for nested lists
        const tocListItems = tocAccordion.querySelectorAll('#TableOfContents li');
        tocListItems.forEach(li => {
            const subList = li.querySelector('ul');
            if (subList) {
                li.classList.add('has-sub');
                // Open sub-accordion by default
                li.classList.add('sub-open');

                // Create toggle chevron for the sub-accordion
                const chevronBtn = document.createElement('button');
                chevronBtn.className = 'toc-sub-toggle';
                chevronBtn.setAttribute('aria-label', 'Toggle subsection');
                chevronBtn.innerHTML = `
                    <svg class="sub-chevron-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                `;

                chevronBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    li.classList.toggle('sub-open');
                });

                const link = li.querySelector('a');
                if (link) {
                    li.insertBefore(chevronBtn, link.nextSibling);
                } else {
                    li.appendChild(chevronBtn);
                }
            }
        });

        // ScrollSpy: highlight active heading & expand its sub-accordion
        const headings = document.querySelectorAll('.post-content h2, .post-content h3, .post-content h4');
        const tocLinks = tocAccordion.querySelectorAll('#TableOfContents a');

        // Close mobile drawer when clicking any TOC link
        tocLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    closeMobileDrawer();
                }
            });
        });

        if (headings.length > 0 && tocLinks.length > 0) {
            const headingMap = new Map();
            tocLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const id = decodeURIComponent(href.slice(1));
                    headingMap.set(id, link);
                }
            });

            function updateActiveToc() {
                const scrollPos = window.scrollY + 140;
                let activeId = null;

                for (let i = headings.length - 1; i >= 0; i--) {
                    const heading = headings[i];
                    if (heading.offsetTop <= scrollPos) {
                        activeId = heading.id;
                        break;
                    }
                }

                tocLinks.forEach(link => link.classList.remove('active'));

                if (activeId && headingMap.has(activeId)) {
                    const activeLink = headingMap.get(activeId);
                    activeLink.classList.add('active');

                    // If inside a sub-accordion, ensure it is open
                    const parentLi = activeLink.closest('li.has-sub');
                    if (parentLi) {
                        parentLi.classList.add('sub-open');
                    }
                }
            }

            window.addEventListener('scroll', updateActiveToc, { passive: true });
            updateActiveToc();
        }
    }
});

