document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    function updateIcons(isDark) {
        if (isDark) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }

    if (themeToggle) {
        // Initial icon state
        updateIcons(document.documentElement.classList.contains('dark'));

        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
            updateIcons(isDark);
            
            // Re-render mermaid if it exists
            if (typeof mermaid !== 'undefined') {
                location.reload(); // Simple way to re-render for now
            }
        });
    }

    // i18n Tabs Logic
    const tabGroups = document.querySelectorAll('.i18n-tabs');
    
    // Check if we have a saved language preference
    const savedLang = localStorage.getItem('lang-preference');

    tabGroups.forEach(group => {
        const buttons = group.querySelectorAll('.tab-btn');
        const contents = group.querySelectorAll('.tab-content');
        
        let initialLangSet = false;

        buttons.forEach((btn, index) => {
            const lang = btn.getAttribute('data-lang');
            
            // Set initial active based on savedLang or just the first one
            if ((savedLang && lang === savedLang) || (!savedLang && index === 0)) {
                btn.classList.add('active');
                contents[index].classList.add('active');
                initialLangSet = true;
            }

            btn.addEventListener('click', () => {
                // Remove active from all
                buttons.forEach(b => b.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Add active to clicked
                btn.classList.add('active');
                contents[index].classList.add('active');
                
                // Save preference
                localStorage.setItem('lang-preference', lang);
                
                // Sync all other tab groups on the page
                syncOtherTabs(lang, group);
            });
        });
        
        // If savedLang wasn't found in this group, default to first
        if (!initialLangSet && buttons.length > 0) {
            buttons[0].classList.add('active');
            contents[0].classList.add('active');
        }
    });
    
    function syncOtherTabs(lang, originGroup) {
        tabGroups.forEach(group => {
            if (group === originGroup) return;
            const targetBtn = group.querySelector(`.tab-btn[data-lang="${lang}"]`);
            if (targetBtn) {
                targetBtn.click(); // Trigger click to activate
            }
        });
    }
});
