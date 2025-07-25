document.addEventListener('DOMContentLoaded', () => {
    // --- BOOT & LOGIN SEQUENCE ---
    const loadingScreen = document.getElementById('loading-screen');
    const loginScreen = document.getElementById('login-screen');
    const loginBtn = document.getElementById('login-btn');
    const welcomeWidget = document.getElementById('welcome-widget');

    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            loginScreen.style.opacity = '1';
            loginScreen.style.pointerEvents = 'auto';
            new Typewriter(document.getElementById('login-user-typewriter'), {
                strings: ['Pawan Joshi', 'AI/ML Developer', 'Full-Stack Engineer'],
                autoStart: true,
                loop: true,
            });
        }, 500);
    }, 2500);
    
    loginBtn.onclick = () => {
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            if (window.innerWidth > 768 && !sessionStorage.getItem('welcomeClosed')) {
                welcomeWidget.style.display = 'block';
            }
            
            // Show welcome notification
            setTimeout(() => {
                showNotification('Welcome to PawanOS!', 'Right-click for context menus, use keyboard shortcuts, and explore!')
            }, 1000)
            
            // Show keyboard shortcuts after a delay
            setTimeout(() => {
                showNotification('Keyboard Shortcuts', 'Alt+Tab: Switch windows • Ctrl+Shift+T: Terminal • Ctrl+Shift+E: Explorer')
            }, 4000)
        }, 500);
    };

    // --- CORE OS & WINDOW MANAGEMENT ---
    const desktop = document.getElementById('desktop');
    const dock = document.getElementById('dock');
    const openWindows = {};
    let zIndexCounter = 10;
    
    const apps = [
        { id: 'about', name: 'About', icon: 'user-round' },
        { id: 'projects', name: 'Projects', icon: 'rocket' },
        { id: 'terminal', name: 'Terminal', icon: 'terminal' },
        { id: 'file-explorer', name: 'Explorer', icon: 'folder' },
        { id: 'music', name: 'Music', icon: 'music' },
        { id: 'settings', name: 'Settings', icon: 'settings' }
    ];

    const iconPositions = JSON.parse(localStorage.getItem('iconPositions')) || {};
    const startMenuItem = document.createElement('div');
    startMenuItem.className = 'dock-item';
    startMenuItem.id = 'start-btn';
    startMenuItem.title = 'Start';
    startMenuItem.innerHTML = `<i data-lucide="layout-grid"></i>`;
    dock.appendChild(startMenuItem);

    apps.forEach((app, index) => {
        const desktopIcon = document.createElement('div');
        desktopIcon.className = 'desktop-icon';
        desktopIcon.id = `icon-${app.id}`;
        desktopIcon.innerHTML = `<i data-lucide="${app.icon}"></i><span>${app.name}</span>`;
        if (iconPositions[app.id]) {
            desktopIcon.style.left = iconPositions[app.id].x;
            desktopIcon.style.top = iconPositions[app.id].y;
        } else {
            const col = 0; // All icons start on the left column
            const row = index;
            const desktopWidgetsContainer = document.getElementById('desktop-widgets');
            const clockWidget = document.getElementById('clock-widget');
            // Calculate top offset based on actual widget heights with more spacing
            const topOffset = (desktopWidgetsContainer.offsetHeight || 0) + (clockWidget.offsetHeight || 60) + 100;
            desktopIcon.style.left = `${col * 100 + 20}px`;
            desktopIcon.style.top = `${row * 100 + topOffset}px`;
        }
        desktopIcon.ondblclick = () => openWindow(app.id, app.name, app.icon);
        desktop.appendChild(desktopIcon);
        makeIconDraggable(desktopIcon);

        const dockItem = document.createElement('div');
        dockItem.className = 'dock-item';
        dockItem.title = app.name;
        dockItem.innerHTML = `<i data-lucide="${app.icon}"></i>`;
        dockItem.onclick = () => openWindow(app.id, app.name, app.icon);
        dock.appendChild(dockItem);
    });

    function openWindow(id, name, icon) {
        if (openWindows[id]) {
            const win = openWindows[id];
            win.style.zIndex = ++zIndexCounter;
            win.classList.add('is-focused');
            win.style.display = 'flex';
            Object.values(openWindows).forEach(w => { if(w !== win) w.classList.remove('is-focused'); });
            return;
        }
        const windowEl = document.createElement('div');
        windowEl.className = 'window is-focused';
        windowEl.id = `${id}-window`;
        Object.assign(windowEl.style, {
            width: window.innerWidth > 768 ? '60vw' : '100vw',
            height: window.innerWidth > 768 ? '70vh' : '100vh',
            left: window.innerWidth > 768 ? `${Math.random() * 20 + 15}%` : '0',
            top: window.innerWidth > 768 ? `${Math.random() * 15 + 10}%` : '0',
            zIndex: ++zIndexCounter
        });
        const contentHTML = document.getElementById(`${id}-content`).innerHTML;
        windowEl.innerHTML = `<div class="title-bar"><div class="traffic-lights"><div class="traffic-light close"></div><div class="traffic-light minimize"></div><div class="traffic-light maximize"></div></div><span style="font-weight: 600;">${name}</span><i data-lucide="${icon}" style="width: 16px; height: 16px;"></i></div><div class="window-content">${contentHTML}</div>`;
        document.body.appendChild(windowEl);
        windowEl.style.display = 'flex';
        openWindows[id] = windowEl;
        updateDock();
        Object.values(openWindows).forEach(w => { if(w !== windowEl) w.classList.remove('is-focused'); });
        
        if (id === 'about') initRadarChart(windowEl);
        if (id === 'projects') renderProjects(windowEl);
        if (id === 'music') initMusicPlayer(windowEl);
        if (id === 'file-explorer') renderFileGrid(windowEl);
        if (id === 'settings') initSettings(windowEl);
        if (id === 'terminal') initTerminal(windowEl);
        
        lucide.createIcons();
        makeWindowDraggable(windowEl);
        
        windowEl.onmousedown = () => {
            windowEl.style.zIndex = ++zIndexCounter;
            windowEl.classList.add('is-focused');
            Object.values(openWindows).forEach(w => { if(w !== windowEl) w.classList.remove('is-focused'); });
        };
        windowEl.querySelector('.close').onclick = () => { windowEl.remove(); delete openWindows[id]; updateDock(); };
        windowEl.querySelector('.minimize').onclick = () => windowEl.style.display = 'none';
        windowEl.querySelector('.maximize').onclick = () => {
            const isMaximized = windowEl.classList.toggle('maximized');
            if (isMaximized) {
                windowEl.dataset.oldWidth = windowEl.style.width;
                windowEl.dataset.oldHeight = windowEl.style.height;
                windowEl.dataset.oldTop = windowEl.style.top;
                windowEl.dataset.oldLeft = windowEl.style.left;
                Object.assign(windowEl.style, {width: '100vw', height: '100vh', top: '0', left: '0'});
            } else {
                Object.assign(windowEl.style, {
                    width: windowEl.dataset.oldWidth, 
                    height: windowEl.dataset.oldHeight, 
                    top: windowEl.dataset.oldTop, 
                    left: windowEl.dataset.oldLeft
                });
            }
        };
    }
    
    function makeIconDraggable(el) {
        let isDragging = false, offsetX, offsetY, startX, startY;
        const GRID_SIZE = 100; // Snap to grid size
        const DRAG_THRESHOLD = 5; // Minimum distance to start dragging
        
        const startDrag = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            offsetX = touch.clientX - el.offsetLeft;
            offsetY = touch.clientY - el.offsetTop;
            
            el.style.zIndex = '1000';
            el.style.transition = 'none';
            
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
        };
        
        const onDrag = (e) => {
            const touch = e.touches ? e.touches[0] : e;
            const deltaX = Math.abs(touch.clientX - startX);
            const deltaY = Math.abs(touch.clientY - startY);
            
            // Only start dragging if moved beyond threshold
            if (!isDragging && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
                isDragging = true;
                el.classList.add('dragging');
                el.style.transform = 'scale(1.1) rotate(2deg)';
                el.style.opacity = '0.8';
                el.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)';
            }
            
            if (!isDragging) return;
            e.preventDefault();
            
            const topBoundary = document.getElementById('desktop-widgets').offsetHeight + 10;
            const leftBoundary = 10;
            const rightBoundary = window.innerWidth - el.offsetWidth - 10;
            const bottomBoundary = window.innerHeight - el.offsetHeight - 100; // Account for dock
            
            let newX = touch.clientX - offsetX;
            let newY = touch.clientY - offsetY;
            
            // Constrain to boundaries
            newX = Math.max(leftBoundary, Math.min(newX, rightBoundary));
            newY = Math.max(topBoundary, Math.min(newY, bottomBoundary));
            
            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;
        };
        
        const endDrag = () => {
            if (isDragging) {
                // Snap to grid
                const currentX = parseInt(el.style.left);
                const currentY = parseInt(el.style.top);
                const snappedX = Math.round(currentX / GRID_SIZE) * GRID_SIZE;
                const snappedY = Math.round((currentY - document.getElementById('desktop-widgets').offsetHeight - 20) / GRID_SIZE) * GRID_SIZE + document.getElementById('desktop-widgets').offsetHeight + 20;
                
                // Smooth transition to snapped position
                el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                el.style.left = `${snappedX}px`;
                el.style.top = `${snappedY}px`;
                el.style.transform = 'scale(1) rotate(0deg)';
                el.style.opacity = '1';
                el.style.boxShadow = '';
                el.style.zIndex = '';
                
                // Remove dragging class after transition
                setTimeout(() => {
                    el.classList.remove('dragging');
                    el.style.transition = '';
                }, 300);
                
                // Save position
                iconPositions[el.id.replace('icon-','')] = { 
                    x: `${snappedX}px`, 
                    y: `${snappedY}px` 
                };
                localStorage.setItem('iconPositions', JSON.stringify(iconPositions));
                
                isDragging = false;
            } else {
                // Reset if no drag occurred
                el.style.zIndex = '';
                el.style.transition = '';
            }
            
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('touchend', endDrag);
        };
        
        el.addEventListener('mousedown', startDrag);
        el.addEventListener('touchstart', startDrag, { passive: false });
    }

    function makeWindowDraggable(el) {
        const titleBar = el.querySelector('.title-bar');
        let isDragging = false;
        let offsetX, offsetY;
        
        const startDrag = (e) => {
            // Prevent dragging when clicking on traffic lights or other interactive elements
            if (e.target.classList.contains('traffic-light') || e.target.closest('.traffic-lights')) {
                return;
            }
            
            // Only allow dragging from title bar
            if (!e.target.closest('.title-bar')) {
                return;
            }
            
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            offsetX = touch.clientX - el.offsetLeft;
            offsetY = touch.clientY - el.offsetTop;
            
            // Bring window to front
            el.style.zIndex = ++zIndexCounter;
            el.classList.add('is-focused');
            Object.values(openWindows).forEach(w => { if(w !== el) w.classList.remove('is-focused'); });
            
            // Add dragging styles
            el.style.transition = 'none';
            titleBar.style.cursor = 'grabbing';
            
            // Add event listeners to document
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
            
            e.preventDefault();
        };
        
        const onDrag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            
            let newX = touch.clientX - offsetX;
            let newY = touch.clientY - offsetY;
            
            // Constrain to viewport boundaries
            const maxX = window.innerWidth - el.offsetWidth;
            const maxY = window.innerHeight - el.offsetHeight;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;
        };
        
        const endDrag = () => {
            if (!isDragging) return;
            
            isDragging = false;
            el.style.transition = '';
            titleBar.style.cursor = 'move';
            
            // Remove event listeners
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('touchend', endDrag);
        };
        
        // Add mouse and touch event listeners to title bar
        titleBar.addEventListener('mousedown', startDrag);
        titleBar.addEventListener('touchstart', startDrag, { passive: false });
    }
    function updateDock() { document.querySelectorAll('.dock-item').forEach(item => { const appName = item.title.toLowerCase().replace(' ', '-'); item.classList.toggle('active', !!openWindows[appName]); }); }
    
    // --- WIDGETS & UI ---
    // Setup welcome widget close button after lucide icons are created
    function setupWelcomeWidget() {
        const welcomeWidget = document.getElementById('welcome-widget');
        const closeBtn = welcomeWidget.querySelector('.close-widget');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                welcomeWidget.style.display = 'none';
                sessionStorage.setItem('welcomeClosed', 'true');
            };
        }
    }
    
    // --- THEME TOGGLE ---
    const themeToggle = document.getElementById('theme-toggle')
    const html = document.documentElement
    
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark'
    html.setAttribute('data-theme', savedTheme)
    updateThemeIcon(savedTheme)
    
    themeToggle.onclick = () => {
        const currentTheme = html.getAttribute('data-theme')
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
        html.setAttribute('data-theme', newTheme)
        localStorage.setItem('theme', newTheme)
        updateThemeIcon(newTheme)
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i')
        icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon')
        lucide.createIcons();
        
        // Setup welcome widget close button after icons are created
        setupWelcomeWidget();
    }
    
    // --- CHATBOT TOGGLE ---
    const chatbotToggle = document.getElementById('chatbot-toggle')
    const chatbotContainer = document.getElementById('chatbot-container')
    
    chatbotToggle.onclick = () => {
        const isVisible = chatbotContainer.style.display === 'flex'
        chatbotContainer.style.display = isVisible ? 'none' : 'flex'
        chatbotToggle.classList.toggle('active', !isVisible)
    }
    
    // --- NOTIFICATIONS ---
    function showNotification(title, message) {
        const notification = document.createElement('div')
        notification.className = 'notification'
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 0.5rem;">${title}</div>
            <div style="font-size: 0.9rem; opacity: 0.8;">${message}</div>
        `
        document.getElementById('notification-center').appendChild(notification)
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove()
            }
        }, 3000)
    }
    
    // --- CONTEXT MENU ---
    const contextMenu = document.getElementById('context-menu')
    let contextTarget = null
    
    function showContextMenu(e, target = null) {
        e.preventDefault()
        contextTarget = target
        
        const menuItems = target && target.classList.contains('desktop-icon') 
            ? [
                { icon: 'folder-open', text: 'Open', action: () => {
                    const appId = target.id.replace('icon-', '')
                    const app = apps.find(a => a.id === appId)
                    if (app) openWindow(app.id, app.name, app.icon)
                }},
                { icon: 'info', text: 'Properties', action: () => showNotification('Properties', `Icon: ${target.querySelector('span').textContent}`) },
                { icon: 'trash-2', text: 'Delete', action: () => {
                    if (confirm('Delete this icon?')) {
                        target.remove()
                        delete iconPositions[target.id.replace('icon-', '')]
                        localStorage.setItem('iconPositions', JSON.stringify(iconPositions))
                    }
                }}
            ]
            : [
                { icon: 'refresh-cw', text: 'Refresh', action: () => location.reload() },
                { icon: 'monitor', text: 'Display Settings', action: () => openWindow('settings', 'Settings', 'settings') },
                { icon: 'terminal', text: 'Open Terminal', action: () => openWindow('terminal', 'Terminal', 'terminal') },
                { icon: 'folder', text: 'File Explorer', action: () => openWindow('file-explorer', 'Explorer', 'folder') }
            ]
        
        contextMenu.innerHTML = menuItems.map(item => 
            `<div class="context-menu-item" data-action="${item.text}">
                <i data-lucide="${item.icon}"></i>
                <span>${item.text}</span>
            </div>`
        ).join('')
        
        // Position menu
        contextMenu.style.left = `${Math.min(e.clientX, window.innerWidth - 200)}px`
        contextMenu.style.top = `${Math.min(e.clientY, window.innerHeight - menuItems.length * 40)}px`
        contextMenu.style.display = 'block'
        
        // Add event listeners
        contextMenu.querySelectorAll('.context-menu-item').forEach((item, index) => {
            item.onclick = () => {
                menuItems[index].action()
                hideContextMenu()
            }
        })
        
        lucide.createIcons()
    }
    
    function hideContextMenu() {
        contextMenu.style.display = 'none'
        contextTarget = null
    }
    
    // Context menu event listeners
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.desktop-icon')) {
            showContextMenu(e, e.target.closest('.desktop-icon'))
        } else if (e.target.closest('#desktop')) {
            showContextMenu(e)
        }
    })
    
    document.addEventListener('click', () => hideContextMenu())
    
    // --- KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
        // Alt + Tab: Switch between windows
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault()
            const windowIds = Object.keys(openWindows)
            if (windowIds.length > 1) {
                const currentFocused = document.querySelector('.window.is-focused')
                const currentIndex = windowIds.findIndex(id => openWindows[id] === currentFocused)
                const nextIndex = (currentIndex + 1) % windowIds.length
                const nextWindow = openWindows[windowIds[nextIndex]]
                
                Object.values(openWindows).forEach(w => w.classList.remove('is-focused'))
                nextWindow.classList.add('is-focused')
                nextWindow.style.zIndex = ++zIndexCounter
                nextWindow.style.display = 'flex'
            }
        }
        
        // Ctrl + Shift + T: Open Terminal
        if (e.ctrlKey && e.shiftKey && e.key === 'T') {
            e.preventDefault()
            openWindow('terminal', 'Terminal', 'terminal')
        }
        
        // Ctrl + Shift + E: Open File Explorer
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault()
            openWindow('file-explorer', 'Explorer', 'folder')
        }
        
        // F11: Toggle fullscreen simulation
        if (e.key === 'F11') {
            e.preventDefault()
            document.body.classList.toggle('fullscreen-mode')
        }
        
        // Escape: Close context menu or current window
        if (e.key === 'Escape') {
            if (contextMenu.style.display === 'block') {
                hideContextMenu()
            } else {
                const focusedWindow = document.querySelector('.window.is-focused')
                if (focusedWindow) {
                    const windowId = Object.keys(openWindows).find(id => openWindows[id] === focusedWindow)
                    if (windowId) {
                        focusedWindow.remove()
                        delete openWindows[windowId]
                        updateDock()
                    }
                }
            }
        }
    })

    // --- DESKTOP WIDGETS ---
    const clockTime = document.querySelector('#clock-widget .time');
    const clockDate = document.querySelector('#clock-widget .date');
    function updateWidgets() {
        const now = new Date();
        if(clockTime) clockTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if(clockDate) clockDate.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
    setInterval(updateWidgets, 1000);
    updateWidgets();

    // --- START MENU ---
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    const startMenuGrid = startMenu.querySelector('.start-menu-grid');
    startMenuGrid.innerHTML = apps.map(app => `
        <a href="#" class="start-menu-item" data-app="${app.id}" data-name="${app.name}" data-icon="${app.icon}">
            <i data-lucide="${app.icon}"></i>
            <span>${app.name}</span>
        </a>
    `).join('');
    startBtn.onclick = (e) => {
        e.stopPropagation();
        startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
    };
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && e.target !== startBtn) {
            startMenu.style.display = 'none';
        }
    });
    startMenuGrid.querySelectorAll('.start-menu-item').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            const { app, name, icon } = e.currentTarget.dataset;
            openWindow(app, name, icon);
            startMenu.style.display = 'none';
        };
    });

    // --- APP INIT ---
    function initSettings(win) {
        // Load saved settings
        const settings = JSON.parse(localStorage.getItem('osSettings')) || {
            darkTheme: true,
            particles: true,
            animations: true,
            sounds: true,
            notifications: true,
            clockFormat24: false,
            cpuInterval: 1000
        };
        
        // Wallpaper options
        const optionsContainer = win.querySelector('#wallpaper-options');
        const wallpapers = [
            { name: 'Cyber City', url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93a23e?q=80&w=2070&auto=format&fit=crop' },
            { name: 'Mountains', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop' },
            { name: 'Abstract', url: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?q=80&w=2071&auto=format&fit=crop' },
            { name: 'Ocean', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=2070&auto=format&fit=crop' },
            { name: 'Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop' }
        ];
        optionsContainer.innerHTML = wallpapers.map(w => `<button class="wallpaper-btn" data-bg="url('${w.url}')" style="background: none; border: 1px solid var(--border-color); color: var(--text-color); padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.3s; min-width: 80px;">${w.name}</button>`).join('');
        optionsContainer.querySelectorAll('.wallpaper-btn').forEach(btn => {
            btn.onmouseenter = () => btn.style.background = 'rgba(0, 240, 255, 0.1)';
            btn.onmouseleave = () => btn.style.background = 'none';
            btn.onclick = () => {
                document.querySelector('.os-container').style.backgroundImage = btn.dataset.bg;
                localStorage.setItem('wallpaper', btn.dataset.bg);
                optionsContainer.querySelectorAll('.wallpaper-btn').forEach(b => b.style.borderColor = 'var(--border-color)');
                btn.style.borderColor = 'var(--accent-primary)';
                showNotification('Wallpaper Changed', `Applied ${btn.textContent} wallpaper`);
            };
        });
        
        // Toggle switches initialization
        const toggles = {
            'dark-theme-toggle': 'darkTheme',
            'particles-toggle': 'particles',
            'animations-toggle': 'animations',
            'sound-toggle': 'sounds',
            'notifications-toggle': 'notifications',
            'clock-format-toggle': 'clockFormat24'
        };
        
        Object.entries(toggles).forEach(([id, settingKey]) => {
            const toggle = win.querySelector(`#${id}`);
            if (toggle) {
                toggle.checked = settings[settingKey];
                
                // Add toggle slider styles
                const slider = toggle.nextElementSibling;
                slider.style.cssText += `
                    &::before {
                        content: '';
                        height: 18px;
                        width: 18px;
                        left: 3px;
                        bottom: 3px;
                        background-color: white;
                        transition: .4s;
                        position: absolute;
                        border-radius: 50%;
                        transform: ${toggle.checked ? 'translateX(26px)' : 'translateX(0)'};
                    }
                `;
                
                toggle.onchange = () => {
                    settings[settingKey] = toggle.checked;
                    localStorage.setItem('osSettings', JSON.stringify(settings));
                    
                    // Apply setting changes immediately
                    switch(settingKey) {
                        case 'particles':
                            const particlesContainer = document.getElementById('particles-js');
                            if (particlesContainer) {
                                particlesContainer.style.display = toggle.checked ? 'block' : 'none';
                            }
                            break;
                        case 'animations':
                            document.documentElement.style.setProperty('--animation-duration', toggle.checked ? '0.3s' : '0s');
                            break;
                        case 'notifications':
                            if (!toggle.checked) {
                                document.querySelectorAll('.notification').forEach(n => n.remove());
                            }
                            break;
                    }
                    
                    showNotification('Settings Updated', `${settingKey.replace(/([A-Z])/g, ' $1').toLowerCase()} ${toggle.checked ? 'enabled' : 'disabled'}`);
                };
            }
        });
        
        // CPU interval slider
        const cpuSlider = win.querySelector('#cpu-interval-slider');
        const cpuValue = win.querySelector('#cpu-interval-value');
        if (cpuSlider && cpuValue) {
            cpuSlider.value = settings.cpuInterval;
            cpuValue.textContent = settings.cpuInterval;
            
            cpuSlider.oninput = () => {
                cpuValue.textContent = cpuSlider.value;
                settings.cpuInterval = parseInt(cpuSlider.value);
                localStorage.setItem('osSettings', JSON.stringify(settings));
            };
        }
        
        // Export settings
        const exportBtn = win.querySelector('#export-settings-btn');
        if (exportBtn) {
            exportBtn.onclick = () => {
                const allSettings = {
                    osSettings: settings,
                    wallpaper: localStorage.getItem('wallpaper'),
                    iconPositions: JSON.parse(localStorage.getItem('iconPositions') || '{}'),
                    welcomeClosed: sessionStorage.getItem('welcomeClosed')
                };
                const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pawnos-settings-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showNotification('Settings Exported', 'Your settings have been downloaded');
            };
        }
        
        // Import settings
        const importBtn = win.querySelector('#import-settings-btn');
        const fileInput = win.querySelector('#settings-file-input');
        if (importBtn && fileInput) {
            importBtn.onclick = () => fileInput.click();
            
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedSettings = JSON.parse(e.target.result);
                            
                            if (importedSettings.osSettings) {
                                localStorage.setItem('osSettings', JSON.stringify(importedSettings.osSettings));
                            }
                            if (importedSettings.wallpaper) {
                                localStorage.setItem('wallpaper', importedSettings.wallpaper);
                            }
                            if (importedSettings.iconPositions) {
                                localStorage.setItem('iconPositions', JSON.stringify(importedSettings.iconPositions));
                            }
                            
                            showNotification('Settings Imported', 'Please refresh the page to apply all changes');
                            setTimeout(() => location.reload(), 2000);
                        } catch (error) {
                            showNotification('Import Failed', 'Invalid settings file format', 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            };
        }
        
        // Clear all data
        const clearDataBtn = win.querySelector('#clear-data-btn');
        if (clearDataBtn) {
            clearDataBtn.onclick = () => {
                if (clearDataBtn.textContent === 'Are you sure?') {
                    localStorage.clear();
                    sessionStorage.clear();
                    showNotification('Data Cleared', 'All local data has been removed');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    clearDataBtn.textContent = 'Are you sure?';
                    clearDataBtn.style.background = '#ff3838';
                    setTimeout(() => {
                        clearDataBtn.textContent = 'Clear All Data';
                        clearDataBtn.style.background = '#ff6b6b';
                    }, 3000);
                }
            };
        }
        
        // Reset OS
        const resetBtn = win.querySelector('#reset-os-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (resetBtn.textContent === 'Confirm Reset?') {
                    localStorage.clear();
                    sessionStorage.clear();
                    location.reload();
                } else {
                    resetBtn.textContent = 'Confirm Reset?';
                    resetBtn.style.background = '#ff2f2f';
                    setTimeout(() => {
                        resetBtn.textContent = 'Reset OS';
                        resetBtn.style.background = '#ff4757';
                    }, 3000);
                }
            };
        }
    }
    function initRadarChart(win) { /* Logic remains the same */ }
    function renderProjects(win) { 
        const projectData = [
            { title: "Zenari - AI Wellness App", tags: ["React Native", "Firebase", "AI/ML"], description: "Developed during Graph-E-Thon 2.0 in 48 hours. Zenari provides empathetic AI chat support, smart journaling, mood analytics, and more." },
            { title: "Full-Stack E-commerce", tags: ["React.js", "Node.js", "MongoDB"], description: "A complete e-commerce solution with user authentication, product management, and payment gateway integration." }
        ];
        const grid = win.querySelector('#project-grid');
        grid.innerHTML = projectData.map(p => `
            <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 0.5rem;">
                <h3 style="font-weight: 600;">${p.title}</h3>
                <p style="font-size: 0.9rem; color: var(--text-secondary-color); margin: 0.5rem 0;">${p.description}</p>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">${p.tags.map(t => `<span style="background: rgba(0, 240, 255, 0.1); color: var(--accent-primary); padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.8rem;">${t}</span>`).join('')}</div>
            </div>
        `).join('');
    }
    function renderFileGrid(win) {
        const fileGrid = win.querySelector('#file-grid');
        const fileList = win.querySelector('#file-list');
        const fileListBody = win.querySelector('#file-list-body');
        const pathBar = win.querySelector('#path-bar');
        const searchInput = win.querySelector('#search-input');
        const itemCount = win.querySelector('#item-count');
        const selectionInfo = win.querySelector('#selection-info');
        const viewToggle = win.querySelector('#view-toggle');
        const backBtn = win.querySelector('#back-btn');
        const forwardBtn = win.querySelector('#forward-btn');
        const upBtn = win.querySelector('#up-btn');
        
        let currentPath = '~/Desktop';
        let pathHistory = ['~/Desktop'];
        let historyIndex = 0;
        let viewMode = 'grid'; // 'grid' or 'list'
        let selectedItems = new Set();
        let searchTerm = '';
        
        // File system simulation with portfolio-aligned content
        const fileSystem = {
            '~': {
                'Desktop': {
                    'Development Projects': { type: 'folder' },
                    'Design Assets': { type: 'folder' },
                    'Certificates': { type: 'folder' },
                    'Pawan_Joshi_Resume.pdf': { type: 'file', size: '2.1 MB', modified: '2025-01-23' },
                    'Portfolio_Presentation.pptx': { type: 'file', size: '8.5 MB', modified: '2025-01-22' },
                    'Skills_Assessment.xlsx': { type: 'file', size: '245 KB', modified: '2025-01-20' },
                    'Quick_Notes.txt': { type: 'file', size: '3 KB', modified: '2025-01-25' }
                },
                'Documents': {
                    'Academic': { type: 'folder' },
                    'Professional': { type: 'folder' },
                    'Research Papers': { type: 'folder' },
                    'Project Documentation': { type: 'folder' },
                    'Graph-E-Thon_2025_Report.pdf': { type: 'file', size: '1.8 MB', modified: '2025-01-18' },
                    'AI_ML_Study_Notes.md': { type: 'file', size: '28 KB', modified: '2025-01-15' },
                    'Full_Stack_Roadmap.txt': { type: 'file', size: '12 KB', modified: '2025-01-10' }
                },
                'Downloads': {
                    'zenari-wellness-app.apk': { type: 'file', size: '25.6 MB', modified: '2025-01-22' },
                    'react-native-setup.exe': { type: 'file', size: '128 MB', modified: '2025-01-20' },
                    'firebase-config.json': { type: 'file', size: '2 KB', modified: '2025-01-19' },
                    'node-modules-backup.zip': { type: 'file', size: '45.2 MB', modified: '2025-01-18' },
                    'vs-code-extensions.txt': { type: 'file', size: '1 KB', modified: '2025-01-16' }
                },
                'Pictures': {
                    'Project Screenshots': { type: 'folder' },
                    'Profile Photos': { type: 'folder' },
                    'UI Mockups': { type: 'folder' },
                    'professional_headshot.jpg': { type: 'file', size: '3.2 MB', modified: '2025-01-21' },
                    'zenari_app_demo.png': { type: 'file', size: '1.8 MB', modified: '2025-01-20' },
                    'portfolio_website_preview.png': { type: 'file', size: '2.1 MB', modified: '2025-01-19' },
                    'graph_e_thon_team_photo.jpg': { type: 'file', size: '4.5 MB', modified: '2025-01-15' }
                },
                'Music': {
                    'Coding Playlists': { type: 'folder' },
                    'lo-fi-coding-beats.mp3': { type: 'file', size: '4.5 MB', modified: '2025-01-16' },
                    'focus_music_mix.mp3': { type: 'file', size: '3.8 MB', modified: '2025-01-14' },
                    'ambient_work_sounds.mp3': { type: 'file', size: '5.2 MB', modified: '2025-01-12' }
                },
                'Videos': {
                    'Project Demos': { type: 'folder' },
                    'Tutorials': { type: 'folder' },
                    'zenari_app_walkthrough.mp4': { type: 'file', size: '45.2 MB', modified: '2025-01-17' },
                    'portfolio_website_demo.mp4': { type: 'file', size: '28.7 MB', modified: '2025-01-15' },
                    'react_native_tutorial.mp4': { type: 'file', size: '156.3 MB', modified: '2025-01-10' }
                }
            },
            '~/Desktop/Development Projects': {
                'Zenari - AI Wellness App': { type: 'folder' },
                'Portfolio Website (PawanOS)': { type: 'folder' },
                'E-commerce Platform': { type: 'folder' },
                'AI Chatbot': { type: 'folder' },
                'Machine Learning Projects': { type: 'folder' },
                'Web3 DApps': { type: 'folder' },
                'README.md': { type: 'file', size: '8 KB', modified: '2025-01-20' },
                'project_roadmap.md': { type: 'file', size: '5 KB', modified: '2025-01-18' }
            },
            '~/Desktop/Development Projects/Zenari - AI Wellness App': {
                'src': { type: 'folder' },
                'assets': { type: 'folder' },
                'docs': { type: 'folder' },
                'package.json': { type: 'file', size: '2 KB', modified: '2025-01-22' },
                'README.md': { type: 'file', size: '12 KB', modified: '2025-01-22' },
                'app_screenshots.png': { type: 'file', size: '3.5 MB', modified: '2025-01-21' },
                'GraphEThon_Presentation.pptx': { type: 'file', size: '15.2 MB', modified: '2025-01-20' },
                'user_feedback.xlsx': { type: 'file', size: '85 KB', modified: '2025-01-19' },
                'development_log.txt': { type: 'file', size: '18 KB', modified: '2025-01-18' }
            },
            '~/Desktop/Development Projects/Portfolio Website (PawanOS)': {
                'index.html': { type: 'file', size: '245 KB', modified: '2025-01-25' },
                'assets': { type: 'folder' },
                'docs': { type: 'folder' },
                'README.md': { type: 'file', size: '6 KB', modified: '2025-01-24' },
                'design_mockups.fig': { type: 'file', size: '12.8 MB', modified: '2025-01-23' },
                'deployment_notes.txt': { type: 'file', size: '2 KB', modified: '2025-01-22' },
                'performance_metrics.json': { type: 'file', size: '4 KB', modified: '2025-01-20' }
            },
            '~/Desktop/Design Assets': {
                'Icons': { type: 'folder' },
                'Logos': { type: 'folder' },
                'UI Components': { type: 'folder' },
                'brand_guidelines.pdf': { type: 'file', size: '5.2 MB', modified: '2025-01-20' },
                'color_palette.ase': { type: 'file', size: '1 KB', modified: '2025-01-18' },
                'typography_guide.pdf': { type: 'file', size: '2.1 MB', modified: '2025-01-15' }
            },
            '~/Desktop/Certificates': {
                'academic_certificates.pdf': { type: 'file', size: '8.5 MB', modified: '2025-01-10' },
                'GraphEThon_2025_Certificate.pdf': { type: 'file', size: '2.2 MB', modified: '2025-01-18' },
                'react_native_certification.pdf': { type: 'file', size: '1.8 MB', modified: '2024-12-15' },
                'firebase_certification.pdf': { type: 'file', size: '1.5 MB', modified: '2024-11-20' },
                'python_ai_ml_certificate.pdf': { type: 'file', size: '2.1 MB', modified: '2024-10-25' }
            },
            '~/Documents/Academic': {
                'Semester Reports': { type: 'folder' },
                'Research Work': { type: 'folder' },
                'thesis_proposal.docx': { type: 'file', size: '1.2 MB', modified: '2025-01-15' },
                'university_transcript.pdf': { type: 'file', size: '450 KB', modified: '2025-01-10' },
                'computer_science_notes.pdf': { type: 'file', size: '25.8 MB', modified: '2025-01-05' }
            },
            '~/Documents/Professional': {
                'resume_versions.pdf': { type: 'file', size: '5.2 MB', modified: '2025-01-23' },
                'cover_letters.docx': { type: 'file', size: '125 KB', modified: '2025-01-20' },
                'linkedin_profile_backup.txt': { type: 'file', size: '8 KB', modified: '2025-01-18' },
                'interview_preparation.md': { type: 'file', size: '15 KB', modified: '2025-01-15' }
            },
            '~/Pictures/Project Screenshots': {
                'zenari_ui_screens.png': { type: 'file', size: '4.2 MB', modified: '2025-01-22' },
                'portfolio_desktop_view.png': { type: 'file', size: '2.8 MB', modified: '2025-01-21' },
                'ecommerce_dashboard.png': { type: 'file', size: '3.1 MB', modified: '2025-01-19' },
                'chatbot_interface.png': { type: 'file', size: '1.9 MB', modified: '2025-01-17' },
                'mobile_app_mockups.png': { type: 'file', size: '5.5 MB', modified: '2025-01-15' }
            },
            '~/Videos/Project Demos': {
                'zenari_full_demo.mp4': { type: 'file', size: '128.5 MB', modified: '2025-01-20' },
                'portfolio_walkthrough.mp4': { type: 'file', size: '85.2 MB', modified: '2025-01-18' },
                'react_native_app_demo.mp4': { type: 'file', size: '45.8 MB', modified: '2025-01-15' },
                'graphethon_presentation.mp4': { type: 'file', size: '256.7 MB', modified: '2025-01-12' }
            }
        };
        
        function getFileIcon(fileName, isFolder) {
            if (isFolder) return 'folder';
            
            const ext = fileName.split('.').pop().toLowerCase();
            const iconMap = {
                'pdf': 'file-text',
                'docx': 'file-text',
                'txt': 'file-text',
                'md': 'file-text',
                'xlsx': 'spreadsheet',
                'csv': 'spreadsheet',
                'jpg': 'image',
                'jpeg': 'image',
                'png': 'image',
                'gif': 'image',
                'mp3': 'music',
                'wav': 'music',
                'mp4': 'video',
                'avi': 'video',
                'zip': 'archive',
                'rar': 'archive',
                'exe': 'cpu',
                'apk': 'smartphone',
                'pptx': 'presentation'
            };
            return iconMap[ext] || 'file';
        }
        
        function formatFileSize(size) {
            if (!size) return '';
            return size;
        }
        
        function getCurrentFiles() {
            const files = fileSystem[currentPath] || {};
            const fileArray = Object.entries(files).map(([name, data]) => ({
                name,
                type: data.type,
                size: data.size || '',
                modified: data.modified || '2025-01-01',
                icon: getFileIcon(name, data.type === 'folder')
            }));
            
            // Filter by search term
            if (searchTerm) {
                return fileArray.filter(file => 
                    file.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            return fileArray;
        }
        
        function renderGrid() {
            const files = getCurrentFiles();
            
            fileGrid.innerHTML = files.map((file, index) => `
                <div class="file-item" data-index="${index}" data-name="${file.name}" data-type="${file.type}" 
                     style="display: flex; flex-direction: column; align-items: center; text-align: center; 
                            padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s;
                            user-select: none; background: transparent;">
                    <i data-lucide="${file.icon}" style="width: 32px; height: 32px; margin-bottom: 0.5rem; color: var(--accent-primary);"></i>
                    <span style="font-size: 0.8rem; word-break: break-word; line-height: 1.2;">${file.name}</span>
                </div>
            `).join('');
            
            fileList.style.display = 'none';
            fileGrid.style.display = 'grid';
        }
        
        function renderList() {
            const files = getCurrentFiles();
            
            fileListBody.innerHTML = files.map((file, index) => `
                <tr class="file-item" data-index="${index}" data-name="${file.name}" data-type="${file.type}"
                    style="cursor: pointer; transition: background-color 0.2s;">
                    <td style="padding: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="${file.icon}" style="width: 16px; height: 16px; color: var(--accent-primary);"></i>
                        ${file.name}
                    </td>
                    <td style="padding: 0.5rem;">${formatFileSize(file.size)}</td>
                    <td style="padding: 0.5rem;">${file.type === 'folder' ? 'Folder' : 'File'}</td>
                    <td style="padding: 0.5rem;">${file.modified}</td>
                </tr>
            `).join('');
            
            fileGrid.style.display = 'none';
            fileList.style.display = 'block';
        }
        
        function render() {
            if (viewMode === 'grid') {
                renderGrid();
            } else {
                renderList();
            }
            
            // Update UI elements
            pathBar.textContent = currentPath;
            const files = getCurrentFiles();
            itemCount.textContent = `${files.length} item${files.length !== 1 ? 's' : ''}`;
            
            if (selectedItems.size > 0) {
                selectionInfo.textContent = `${selectedItems.size} selected`;
            } else {
                selectionInfo.textContent = '';
            }
            
            // Update navigation buttons
            backBtn.disabled = historyIndex <= 0;
            forwardBtn.disabled = historyIndex >= pathHistory.length - 1;
            upBtn.disabled = currentPath === '~';
            
            backBtn.style.opacity = backBtn.disabled ? '0.5' : '1';
            forwardBtn.style.opacity = forwardBtn.disabled ? '0.5' : '1';
            upBtn.style.opacity = upBtn.disabled ? '0.5' : '1';
            
            lucide.createIcons();
            attachFileEvents();
        }
        
        function attachFileEvents() {
            document.querySelectorAll('.file-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const index = parseInt(item.dataset.index);
                    const name = item.dataset.name;
                    
                    if (e.ctrlKey || e.metaKey) {
                        // Multi-select
                        if (selectedItems.has(index)) {
                            selectedItems.delete(index);
                            item.style.background = 'transparent';
                        } else {
                            selectedItems.add(index);
                            item.style.background = 'rgba(0, 240, 255, 0.2)';
                        }
                    } else {
                        // Single select
                        selectedItems.clear();
                        document.querySelectorAll('.file-item').forEach(i => {
                            i.style.background = 'transparent';
                        });
                        selectedItems.add(index);
                        item.style.background = 'rgba(0, 240, 255, 0.2)';
                    }
                    
                    render();
                });
                
                item.addEventListener('dblclick', () => {
                    const name = item.dataset.name;
                    const type = item.dataset.type;
                    
                    if (type === 'folder') {
                        navigateTo(`${currentPath}/${name}`);
                    } else {
                        // Open file
                        showNotification('File Opened', `Opening ${name}`);
                    }
                });
                
                // Hover effects
                item.addEventListener('mouseenter', () => {
                    if (!selectedItems.has(parseInt(item.dataset.index))) {
                        item.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                });
                
                item.addEventListener('mouseleave', () => {
                    if (!selectedItems.has(parseInt(item.dataset.index))) {
                        item.style.background = 'transparent';
                    }
                });
            });
        }
        
        function navigateTo(newPath) {
            if (fileSystem[newPath]) {
                currentPath = newPath;
                
                // Update history
                pathHistory = pathHistory.slice(0, historyIndex + 1);
                pathHistory.push(currentPath);
                historyIndex = pathHistory.length - 1;
                
                selectedItems.clear();
                render();
            }
        }
        
        function navigateUp() {
            const parts = currentPath.split('/');
            if (parts.length > 1) {
                parts.pop();
                const parentPath = parts.join('/') || '~';
                navigateTo(parentPath);
            }
        }
        
        function navigateBack() {
            if (historyIndex > 0) {
                historyIndex--;
                currentPath = pathHistory[historyIndex];
                selectedItems.clear();
                render();
            }
        }
        
        function navigateForward() {
            if (historyIndex < pathHistory.length - 1) {
                historyIndex++;
                currentPath = pathHistory[historyIndex];
                selectedItems.clear();
                render();
            }
        }
        
        function toggleView() {
            viewMode = viewMode === 'grid' ? 'list' : 'grid';
            const icon = viewToggle.querySelector('i');
            icon.setAttribute('data-lucide', viewMode === 'grid' ? 'list' : 'grid-3x3');
            render();
        }
        
        // Event listeners
        backBtn.addEventListener('click', navigateBack);
        forwardBtn.addEventListener('click', navigateForward);
        upBtn.addEventListener('click', navigateUp);
        viewToggle.addEventListener('click', toggleView);
        
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            selectedItems.clear();
            render();
        });
        
        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                // Remove active state from all items
                document.querySelectorAll('.sidebar-item').forEach(i => {
                    i.style.background = 'transparent';
                });
                
                // Add active state to clicked item
                item.style.background = 'var(--widget-bg)';
                
                const path = item.dataset.path;
                navigateTo(path);
            });
        });
        
        // Context menu for files
        win.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.file-item')) {
                e.preventDefault();
                const item = e.target.closest('.file-item');
                const name = item.dataset.name;
                const type = item.dataset.type;
                
                // Show custom context menu
                showNotification('Context Menu', `Right-clicked on ${name}`);
            }
        });
        
        // Keyboard shortcuts
        win.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && selectedItems.size === 1) {
                const selectedItem = document.querySelector(`.file-item[data-index="${Array.from(selectedItems)[0]}"]`);
                if (selectedItem) {
                    selectedItem.dispatchEvent(new Event('dblclick'));
                }
            } else if (e.key === 'Backspace') {
                navigateUp();
            } else if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                // Select all
                const files = getCurrentFiles();
                selectedItems.clear();
                files.forEach((_, index) => selectedItems.add(index));
                render();
            }
        });
        
        // Initial render
        render();
    }
    function initMusicPlayer(win) { /* Logic remains the same */ }
    function initTerminal(win) { /* Logic remains the same */ }

    // --- INITIALIZE OS ---
    const savedWallpaper = localStorage.getItem('wallpaper');
    if (savedWallpaper) document.querySelector('.os-container').style.backgroundImage = savedWallpaper;
    
    particlesJS('particles-js', {"particles":{"number":{"value":80,"density":{"enable":true,"value_area":800}},"color":{"value":"#ffffff"},"shape":{"type":"circle"},"opacity":{"value":0.5,"random":true},"size":{"value":3,"random":true},"line_linked":{"enable":false},"move":{"enable":true,"speed":1,"direction":"none","random":true,"straight":false,"out_mode":"out","bounce":false}},"interactivity":{"detect_on":"canvas","events":{"onhover":{"enable":false},"onclick":{"enable":false},"resize":true}},"retina_detect":true});
    lucide.createIcons();
    
    // Setup welcome widget close button after lucide icons are created
    setTimeout(() => {
        const closeBtn = welcomeWidget.querySelector('.close-widget');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                welcomeWidget.style.display = 'none';
                sessionStorage.setItem('welcomeClosed', 'true');
            };
        }
    }, 100);
});