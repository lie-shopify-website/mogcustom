(function () {
    const header = document.querySelector('.js-headerV202601');
    const headerNav = header.querySelector('header-nav');
    const dropdownBackdrop = document.querySelector(".js-dropdownBackdrop-202601");
    const spc = 1024;



    function init(){
        initHeaderSticky();
        initDropdown();
        initTopMenuHover();
        showAccountQuickLinks();
        initMobileMenuEvent();
        setupSearchAutoFocus();

        initArrowState();
        initContactUs();
        initContactUsChat();
    }



    /* dropdown background：一级菜单 .js-dropdown 与子级层 .menu-level-2 均视为下拉区域 */
    function initDropdown() {
        if (window.innerWidth >= spc) {
            if (!header || !dropdownBackdrop) return;

            function isInDropdownZone(el) {
                return el && (el.closest('.js-dropdown') || el.closest('.menu-level-2'));
            }

            header.addEventListener('mouseover', function(event) {
                if (!isInDropdownZone(event.target)) return;
                var alreadyOpen = dropdownBackdrop.classList.contains("show");
                dropdownBackdrop.classList.add("show");
                if (!alreadyOpen) bodyScrollController(false);
            });

            header.addEventListener('mouseout', function(event) {
                if (isInDropdownZone(event.relatedTarget)) return;
                var wasOpen = dropdownBackdrop.classList.contains("show");
                dropdownBackdrop.classList.remove("show");
                if (wasOpen) bodyScrollController(true);
            });
        }
    }

    /* 一级菜单 hover：同步 .menu-level-2 下对应 panel 的 .active，并更新无障碍属性 */
    function initTopMenuHover() {
        if (window.innerWidth >= spc) {
            if (!header || !headerNav) return;

            const menuLevel2 = headerNav.querySelector('.menu-level-2');
            var closePanelsTimeoutId = null;
            var LEVEL2_CLOSE_DURATION = 400;

            function setActiveItem(topMenuItem) {
                header.querySelectorAll('.top-menu-item.active').forEach(function(el) { el.classList.remove('active'); });
                if (topMenuItem) topMenuItem.classList.add('active');
                headerNav.classList.add('hover');
            }

            function openPanel(topMenuItem, focusFirstInPanel) {
                if (closePanelsTimeoutId) {
                    clearTimeout(closePanelsTimeoutId);
                    closePanelsTimeoutId = null;
                }
                setActiveItem(topMenuItem);
                var link = topMenuItem.querySelector('a[aria-controls]');
                var panelId = link && link.getAttribute('aria-controls');
                if (!panelId || !menuLevel2) return;

                menuLevel2.classList.add('is-open');
                var activePanel = null;
                menuLevel2.querySelectorAll('.menu-submenu-container').forEach(function(panel) {
                    var isActive = panel.id === panelId;
                    panel.classList.toggle('active', isActive);
                    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
                    if (isActive) activePanel = panel;
                });
                link.setAttribute('aria-expanded', 'true');
                if (focusFirstInPanel && activePanel) {
                    var firstLink = activePanel.querySelector('a[href]:not([tabindex="-1"])');
                    if (firstLink) {
                        setTimeout(function() { firstLink.focus(); }, 0);
                    }
                }
            }

            function doLevel2Close() {
                if (!menuLevel2) return;
                menuLevel2.classList.remove('is-open');
                closePanelsTimeoutId = setTimeout(function() {
                    closePanelsTimeoutId = null;
                    menuLevel2.querySelectorAll('.menu-submenu-container').forEach(function(panel) {
                        panel.classList.remove('active');
                        panel.setAttribute('aria-hidden', 'true');
                    });
                    header.querySelectorAll('a[aria-controls][aria-haspopup="menu"]').forEach(function(link) {
                        link.setAttribute('aria-expanded', 'false');
                    });
                }, LEVEL2_CLOSE_DURATION);
            }

            function closePanels() {
                headerNav.classList.remove('hover');
                header.querySelectorAll('.top-menu-item.active').forEach(function(el) { el.classList.remove('active'); });
                doLevel2Close();
            }

            function isInMenuZone(el) {
                return el && (el.closest('.top-menu-item') || el.closest('.menu-level-2'));
            }

            header.addEventListener('mouseover', function(event) {
                var topMenuItem = event.target.closest('.top-menu-item');
                if (!topMenuItem) return;
                if (topMenuItem.querySelector('a[aria-controls]')) {
                    openPanel(topMenuItem);
                } else {
                    doLevel2Close();
                    setActiveItem(topMenuItem);
                }
            });

            header.addEventListener('mouseout', function(event) {
                if (!isInMenuZone(event.relatedTarget)) closePanels();
            });

            /* 键盘：Enter/Space 打开子菜单并聚焦到子级第一项，Escape 关闭并回退焦点，Tab 在子级最后一项时回到下一个一级 */
            function getFocusables(container) {
                var sel = 'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]';
                return Array.prototype.filter.call(container.querySelectorAll(sel), function(el) {
                    return el.offsetParent !== null && !el.hasAttribute('disabled');
                });
            }

            header.addEventListener('keydown', function(event) {
                var trigger = event.target.closest('a[aria-haspopup="menu"]');
                if (trigger && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    var item = trigger.closest('.top-menu-item');
                    if (item) openPanel(item, true);
                    return;
                }
                var inPanel = event.target.closest('.menu-submenu-container[role="menu"]');
                if (inPanel && event.key === 'Escape') {
                    event.preventDefault();
                    closePanels();
                    var panelId = inPanel.id;
                    var t = header.querySelector('a[aria-controls="' + panelId + '"]');
                    if (t) t.focus();
                    return;
                }
                if (inPanel && event.key === 'Tab' && !event.shiftKey) {
                    var focusables = getFocusables(inPanel);
                    var last = focusables[focusables.length - 1];
                    if (last && event.target === last) {
                        event.preventDefault();
                        var panelId = inPanel.id;
                        var currentTrigger = header.querySelector('a[aria-controls="' + panelId + '"]');
                        var currentItem = currentTrigger && currentTrigger.closest('.top-menu-item');
                        var nextItem = currentItem && currentItem.nextElementSibling;
                        while (nextItem && !nextItem.querySelector('a.menu__link')) nextItem = nextItem.nextElementSibling;
                        var nextLink = nextItem && nextItem.querySelector('a.menu__link');
                        if (nextLink) nextLink.focus();
                    }
                }
            });
        }
    }



    /* header sticky */
    function initHeaderSticky() {
        let isTop = window.scrollY === 0;
        
        if (isTop) {
          header.classList.add('scrollbar-top');
        }
        
        window.addEventListener('scroll', () => {
            window.requestAnimationFrame(() => {
                isTop = window.scrollY === 0;
                
                if (isTop) {
                  header.classList.add('scrollbar-top');
                } else {
                  header.classList.remove('scrollbar-top');
                }
            });
        });
    }



    /* show Account Quick Links mouseenter + click */
    function showAccountQuickLinks() {
        const accountIcon = header.querySelector(".js-accountIcon");
        if(!accountIcon) return;

        const quickLinks = accountIcon.querySelector(".js-accountQuickLinks");
        accountIcon.addEventListener("click", (e) => {
            if (window.innerWidth >= spc) return;
            e.stopPropagation();
            if (quickLinks.classList.contains("show")) {
                quickLinks.classList.remove("show");
                setTimeout(() => {
                }, 2000);
            } else {
                quickLinks.classList.add("show");
            }
        });

        document.addEventListener("click", () => {
            quickLinks.classList.remove("show");
        });

    }


    function bodyScrollController(type) {
        if (window.innerWidth < spc) return;

        if (type) {
            document.body.style.removeProperty("--padding-body-scroll-bar");
            document.body.classList.remove("header-dropdown-open")
        } else {
            // 滚动条在视口/html 上，用 documentElement.clientWidth 才能得到正确差值（约 15px）
            var e = window.innerWidth - document.documentElement.clientWidth;

            document.body.classList.add("header-dropdown-open");
            document.body.style.setProperty("--padding-body-scroll-bar", e + "px");
        }
    }

    


    /*================ mobile menu ================*/
    function initMobileMenuEvent() {
        _setupMobileMenuToggle(); /* topmenu open and close */

        _setupMobileSubMenuToggle(); /* submenu open and close */

        _setupMobileGrandMenuToggle(); /* grandmenu open and close */
    }
    
    function _setupMobileMenuToggle() {
        const menuIcon = header.querySelector('.js-mobileMenuIcon');
        const mobileMenu = header.querySelector('.js-mobileMenu .js-mobileMenuContainer');
        const siteHeader = header.querySelector('.js-siteHeader');
        const body = document.body;
        
        menuIcon.addEventListener("click", async () => {
            const isOpening = !menuIcon.classList.contains('open');
            
            if (isOpening) {
                await _scrollToTop();

                setTimeout(() => {
                    mobileMenu.classList.add('open');
                    siteHeader.classList.add('mobile-menu-open');
                    menuIcon.classList.add('open');
                    body.classList.add('body-scroll-locked');
                }, 30);

            } else {

                mobileMenu.classList.remove('open');
                siteHeader.classList.remove('mobile-menu-open');
                menuIcon.classList.remove('open');

                body.classList.remove('body-scroll-locked');
            }
        });
    }

    function _scrollToTop() {
        const headerTop = header.getBoundingClientRect().top + window.pageYOffset;
        if(headerTop == 0) return;

        return new Promise((resolve) => {
            window.scrollTo({
                top: headerTop,
                behavior: 'smooth'
            });
            resolve();
        });
    }



    function _setupMobileSubMenuToggle() {
        _subMenuEnter();
        _subMenuGoBack();
        _subMenuClose();
    }

    function _subMenuEnter(){
        const topMenuArea = header.querySelector('.js-topMenuArea');
        const topmenuItems = header.querySelectorAll('.js-topMenuItem.js-hasChildMenu');
        const subMenuArea = header.querySelector('.js-subMenuArea');
        topmenuItems.forEach(topmenuItem => {
            topmenuItem.addEventListener("click", (e) => {
                const tabIndex = e.currentTarget.getAttribute('data-tab-index');
                const currentSubmenu = subMenuArea.querySelector('.js-indexSubmenu[data-tab-index="'+ tabIndex +'"]');

                subMenuArea.querySelectorAll('.js-indexSubmenu').forEach(item => { item.classList.remove('active') });
                currentSubmenu.classList.add('active');

                subMenuArea.classList.add('active');
                topMenuArea.classList.add('to-left');
            });
        });
        
    }

    function _subMenuGoBack(){
        const goBackBtns = header.querySelectorAll('.js-subMenuArea .js-goBack');
        const topMenuArea = header.querySelector('.js-topMenuArea');
        const subMenuArea = header.querySelector('.js-subMenuArea');
        goBackBtns.forEach(goBackBtn => {
            goBackBtn.addEventListener("click", (e) => {
                subMenuArea.querySelectorAll('.js-indexSubmenu').forEach(item => { item.classList.remove('active') });
                subMenuArea.classList.remove('active');
                topMenuArea.classList.remove('to-left');
            });
        });
    }
    
    function _subMenuClose(){
        const subMenuArea = header.querySelector('.js-subMenuArea');
        const submenuHamburgerIcons = header.querySelectorAll('.js-subMenuArea .js-mobileMenuIcon');
        const topMenuArea = header.querySelector('.js-topMenuArea');
        submenuHamburgerIcons.forEach(submenuHamburgerIcon => {
            submenuHamburgerIcon.addEventListener("click", () => {
                const menuIcon = header.querySelector('.js-mobileMenuIcon');
                const mobileMenu = header.querySelector('.js-mobileMenu .js-mobileMenuContainer');
                const siteHeader = header.querySelector('.js-siteHeader');
                const body = document.body;
                
                mobileMenu.classList.remove('open');
                siteHeader.classList.remove('mobile-menu-open');
                menuIcon.classList.remove('open');
                body.classList.remove('body-scroll-locked');

                topMenuArea.classList.remove('to-left');
                subMenuArea.querySelectorAll('.js-indexSubmenu').forEach(item => { item.classList.remove('active') });
                subMenuArea.classList.remove('active');
            });
        });
    }


    function _setupMobileGrandMenuToggle() {
        const submenuIcons = header.querySelectorAll('.js-subMenuHeader');
        
        submenuIcons.forEach(submenuIcon => {
            submenuIcon.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const subMenuItem = e.target.closest('.js-subMenuItem');
                if (!subMenuItem) return;
                
                const indexSubmenu = e.target.closest('.js-indexSubmenu');
                const allOpenItems = indexSubmenu.querySelectorAll('.js-subMenuItem.open');
                const isOpening = !subMenuItem.classList.contains('open');
                
                allOpenItems.forEach(item => {
                    if (item !== subMenuItem) {
                        item.classList.remove('open');
                        updateArrowState(item, false);
                    }
                });
                
                subMenuItem.classList.toggle('open');
                updateArrowState(subMenuItem, isOpening);
            });
        });
    }
    
    function initArrowState() {
        // console.log('initArrowState');
        const subMenuArea = header.querySelector('.js-subMenuArea');
        subMenuArea.querySelectorAll('.js-subMenuItem.open').forEach(item => {
            // console.log(item);
            updateArrowState(item, true);
        });
    }

    function updateArrowState(element, shouldExpand) {
        const arrowBtn = element.querySelector('.accordion-toggle');
        if (!arrowBtn) return;
        
        const expandAnim = arrowBtn.querySelector('.expandAnim');
        const collapseAnim = arrowBtn.querySelector('.collapseAnim');
        
        if (!expandAnim || !collapseAnim) return;
        
        try {
            expandAnim.endElement();
            collapseAnim.endElement();
            
            if (shouldExpand) {
                expandAnim.beginElement();
                arrowBtn.setAttribute('aria-expanded', 'true');
            } else {
                collapseAnim.beginElement();
                arrowBtn.setAttribute('aria-expanded', 'false');
            }
        } catch(err) {}
    }



    /* search focus — 与 theme 的 dialog-component#search-modal / dialog:open 对齐（非 Bootstrap #searchModal） */
    function setupSearchAutoFocus() {
        const searchModal = document.getElementById('search-modal');
        if (searchModal) {
            searchModal.addEventListener('dialog:open', function () {
                setTimeout(function () {
                    const searchInput = searchModal.querySelector('input[name="q"]');
                    if (searchInput) {
                        forceFocusInput(searchInput);
                    }
                }, 50);
            });
        }

        document.querySelectorAll('.js-searchTrigger').forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                const clickTime = Date.now();
                const checkOpen = setInterval(function () {
                    const dialogOpen = document.querySelector('#search-modal dialog[open]');
                    if (dialogOpen) {
                        clearInterval(checkOpen);
                        const elapsed = Date.now() - clickTime;
                        const delay = Math.max(100, 300 - elapsed);
                        setTimeout(function () {
                            const searchInput = document.querySelector('#search-modal input[name="q"]');
                            if (searchInput) {
                                universalFocus(searchInput);
                            }
                        }, delay);
                    }
                }, 50);
                setTimeout(function () {
                    clearInterval(checkOpen);
                }, 3000);
            });
        });
    }
    
    function universalFocus(input) {
        if (!input || input.disabled) return;
        
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (!isIOS) {
            input.focus();
            setTimeout(() => {
                input.setSelectionRange(input.value.length, input.value.length);
            }, 10);
            return;
        }
        
        iosFocus(input);
    }
    
    function iosFocus(input) {
        input.setAttribute('readonly', true);
        input.style.opacity = '1';
        input.style.pointerEvents = 'auto';
        
        setTimeout(() => {
            input.removeAttribute('readonly');
            input.focus();
            
            setTimeout(() => {
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                input.dispatchEvent(clickEvent);
                
                let attempts = 0;
                const tryFocus = () => {
                    if (document.activeElement !== input && attempts < 3) {
                        input.focus();
                        attempts++;
                        setTimeout(tryFocus, 200);
                    }
                };
                tryFocus();
            }, 100);
        }, 100);
        
        setTimeout(() => {
            const len = input.value.length;
            input.setSelectionRange(len, len);
        }, 300);
    }
    
    function forceFocusInput(input) {
        input.style.cssText += ';opacity:1 !important;pointer-events:auto !important;';
        input.disabled = false;
        input.readOnly = false;
        
        input.focus();
        
        const isMobile = 'ontouchstart' in window;
        
        if (isMobile) {
            input.setAttribute('inputmode', 'search');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'none');
            
            setTimeout(() => {
                input.click();
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
        }
        
        setTimeout(() => {
            const length = input.value.length;
            input.setSelectionRange(length, length);
        }, 100);
    }


    /* contact us */
    function initContactUs() {
        const contactUsIcons = document.querySelectorAll('.js-contactUsIcon');
        const contactUsModal = document.querySelector('.js-contactUsModal');
        if (!contactUsModal || contactUsIcons.length === 0) return;

        contactUsIcons.forEach((contactUsIcon) => {
            contactUsIcon.addEventListener('click', () => {
                contactUsModal.classList.toggle('show');
            });
        });

        document.addEventListener('click', (e) => {
            if (contactUsModal.contains(e.target)) return;
            if (e.target.closest('.js-contactUsIcon')) return;
            contactUsModal.classList.remove('show');
        });
    }

    /* contact us chat — zE：#launcher  */
    function initContactUsChat() {
        var ZENDESK_WAIT_MS = 15000;
        var ZENDESK_POLL_MS = 500;
        var SESSION_ZENDESK_LAUNCHER_KEY = 'headerZendeskLauncherShown';

        function whenZendeskReady(fn) {
            if (typeof window.zE === 'function') {
                fn();
                return;
            }
            var deadline = Date.now() + ZENDESK_WAIT_MS;
            var id = setInterval(function () {
                if (typeof window.zE === 'function') {
                    clearInterval(id);
                    fn();
                } else if (Date.now() > deadline) {
                    clearInterval(id);
                }
            }, ZENDESK_POLL_MS);
        }

        function setLauncherVisible(show) {
            var el = document.querySelector('#launcher');
            if (!el) return;
            el.classList.toggle('show', !!show);
        }

        function restoreLauncherFromSession() {
            try {
                if (sessionStorage.getItem(SESSION_ZENDESK_LAUNCHER_KEY) !== '1') return;
            } catch (e) {
                return;
            }

            function tryApply() {
                var el = document.querySelector('#launcher');
                if (!el) return false;
                setLauncherVisible(true);
                return true;
            }

            if (tryApply()) return;

            var deadline = Date.now() + ZENDESK_WAIT_MS;
            var id = setInterval(function () {
                if (tryApply() || Date.now() > deadline) clearInterval(id);
            }, ZENDESK_POLL_MS);

            var mo = new MutationObserver(function () {
                if (tryApply()) mo.disconnect();
            });
            mo.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(function () {
                mo.disconnect();
            }, ZENDESK_WAIT_MS);
        }

        restoreLauncherFromSession();

        function detectMessengerPanelLikelyOpen() {
            var iframes = document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; i++) {
                var f = iframes[i];
                var src = (f.getAttribute('src') || '') + (f.src || '');
                if (!/zendesk|zdassets|zdusercontent/i.test(src)) continue;
                var r = f.getBoundingClientRect();
                if (r.width < 180 || r.height < 200) continue;
                var st = window.getComputedStyle(f);
                if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) continue;
                if (r.bottom <= 0 || r.right <= 0) continue;
                return true;
            }
            return false;
        }

        var listenersBound = false;
        function bindMessengerLauncherSync() {
            whenZendeskReady(function () {
                if (listenersBound) return;
                try {
                    window.zE('messenger:on', 'open', function () {
                        setLauncherVisible(true);
                    });
                    // window.zE('messenger:on', 'close', function () {
                    //     setLauncherVisible(false);
                    // });
                    window.zE('messenger:on', 'conversationOpened', function () {
                        setLauncherVisible(true);
                    });
                    listenersBound = true;
                } catch (e) {}

                var n = 0;
                var syncId = setInterval(function () {
                    n++;
                    if (detectMessengerPanelLikelyOpen()) {
                        setLauncherVisible(true);
                    }
                    if (n >= 40) clearInterval(syncId);
                }, 250);

                var moRaf = null;
                var mo = new MutationObserver(function () {
                    if (moRaf) return;
                    moRaf = requestAnimationFrame(function () {
                        moRaf = null;
                        if (detectMessengerPanelLikelyOpen()) setLauncherVisible(true);
                    });
                });
                mo.observe(document.documentElement, { childList: true, subtree: true });
                setTimeout(function () {
                    mo.disconnect();
                }, 12000);
            });
        }

        bindMessengerLauncherSync();

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.js-headerContactUsChat')) return;
            try {
                sessionStorage.setItem(SESSION_ZENDESK_LAUNCHER_KEY, '1');
            } catch (err) {}
            var contactUsModal = document.querySelector('.js-contactUsModal');
            if (contactUsModal) contactUsModal.classList.remove('show');
            whenZendeskReady(function () {
                try {
                    window.zE('messenger', 'open');
                } catch (err) {}
            });
        });
    }



    window.addEventListener('DOMContentLoaded', function() { 
        init();
    });

})();