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

    function openWindow(id, name, icon, data = {}) {
        if (openWindows[id] && !id.startsWith('viewer-')) {
            const win = openWindows[id];
            win.style.zIndex = ++zIndexCounter;
            win.classList.add('is-focused');
            win.style.display = 'flex';
            Object.values(openWindows).forEach(w => { if(w !== win) w.classList.remove('is-focused'); });
            return;
        }

        const windowId = id.startsWith('viewer-') ? `${id}-${Date.now()}` : id;

        const windowEl = document.createElement('div');
        windowEl.className = 'window is-focused';
        windowEl.id = `${windowId}-window`;
        Object.assign(windowEl.style, {
            width: data.width || (window.innerWidth > 768 ? '60vw' : '100vw'),
            height: data.height || (window.innerWidth > 768 ? '70vh' : '100vh'),
            left: window.innerWidth > 768 ? `${Math.random() * 20 + 15}%` : '0',
            top: window.innerWidth > 768 ? `${Math.random() * 15 + 10}%` : '0',
            zIndex: ++zIndexCounter
        });
        const contentHTML = document.getElementById(`${id}-content`).innerHTML;
        windowEl.innerHTML = `<div class="title-bar"><div class="traffic-lights"><div class="traffic-light close"></div><div class="traffic-light minimize"></div><div class="traffic-light maximize"></div></div><span style="font-weight: 600;">${name}</span><i data-lucide="${icon}" style="width: 16px; height: 16px;"></i></div><div class="window-content">${contentHTML}</div>`;
        document.body.appendChild(windowEl);
        windowEl.style.display = 'flex';
        openWindows[windowId] = windowEl;
        updateDock();
        Object.values(openWindows).forEach(w => { if(w !== windowEl) w.classList.remove('is-focused'); });
        
        lucide.createIcons();
        
        // App-specific initializations
        if (id === 'about') {
            animateSkillBars(windowEl);
        }
        if (id === 'projects') renderProjects(windowEl);
        if (id === 'settings') initSettings(windowEl);
        if (id === 'terminal') initTerminal(windowEl);
        if (id === 'file-viewer') initFileViewer(windowEl, data);
        if (id === 'image-viewer') initImageViewer(windowEl, data);
        
        makeWindowDraggable(windowEl);
        
        windowEl.onmousedown = () => {
            windowEl.style.zIndex = ++zIndexCounter;
            windowEl.classList.add('is-focused');
            Object.values(openWindows).forEach(w => { if(w !== windowEl) w.classList.remove('is-focused'); });
        };
        windowEl.querySelector('.close').onclick = () => { 
            windowEl.remove(); 
            delete openWindows[windowId]; 
            updateDock(); 
        };
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
                { icon: 'terminal', text: 'Open Terminal', action: () => openWindow('terminal', 'Terminal', 'terminal') }
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
    
    // Global event delegation for welcome widget close button
    document.addEventListener('click', (e) => {
        if (e.target.matches('.close-widget') || e.target.closest('.close-widget')) {
            const welcomeWidget = document.getElementById('welcome-widget');
            if (welcomeWidget) {
                e.preventDefault();
                e.stopPropagation();
                welcomeWidget.style.display = 'none';
                sessionStorage.setItem('welcomeClosed', 'true');
            }
        }
    })
    
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
    
    // Create enhanced start menu structure
    startMenu.innerHTML = `
        <div class="start-menu-header">
            <h3 class="start-menu-title">PawanOS</h3>
            <p class="start-menu-subtitle">Portfolio Experience</p>
        </div>
        <div class="start-menu-grid"></div>
        <div class="start-menu-footer">
            <div class="start-menu-user">
                <img src="https://media.licdn.com/dms/image/v2/D5603AQGQAi62iRw1xA/profile-displayphoto-shrink_800_800/B56ZcX1WnDGsAg-/0/1748451552389?e=1756339200&v=beta&t=ovjGwcj0WEH1BH06XuJAO_rHrKL8YzZxV52CFeMWwdM" 
                     alt="Pawan Joshi" class="start-menu-avatar">
                <div class="start-menu-user-info">
                    <div class="start-menu-username">Pawan Joshi</div>
                    <div class="start-menu-status">AI/ML Developer</div>
                </div>
            </div>
            <div class="start-menu-power">
                <button class="power-btn" title="Settings" id="power-settings">
                    <i data-lucide="settings"></i>
                </button>
                <button class="power-btn" title="Refresh" id="power-refresh">
                    <i data-lucide="refresh-cw"></i>
                </button>
            </div>
        </div>
    `;
    
    const startMenuGrid = startMenu.querySelector('.start-menu-grid');
    startMenuGrid.innerHTML = apps.map(app => `
        <a href="#" class="start-menu-item" data-app="${app.id}" data-name="${app.name}" data-icon="${app.icon}">
            <i data-lucide="${app.icon}"></i>
            <span>${app.name}</span>
        </a>
    `).join('');
    
    // Start menu event handlers
    startBtn.onclick = (e) => {
        e.stopPropagation();
        const isVisible = startMenu.style.display === 'block';
        startMenu.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Re-create icons when menu opens
            lucide.createIcons();
        }
    };
    
    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && e.target !== startBtn) {
            startMenu.style.display = 'none';
        }
    });
    
    // App item handlers
    startMenuGrid.querySelectorAll('.start-menu-item').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            const { app, name, icon } = e.currentTarget.dataset;
            openWindow(app, name, icon);
            startMenu.style.display = 'none';
            showNotification('App Launched', `Opening ${name}...`);
        };
    });
    
    // Power button handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('#power-settings')) {
            openWindow('settings', 'Settings', 'settings');
            startMenu.style.display = 'none';
        } else if (e.target.closest('#power-refresh')) {
            showNotification('System Refresh', 'Refreshing PawanOS...');
            setTimeout(() => location.reload(), 1000);
            startMenu.style.display = 'none';
        }
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
    function animateSkillBars(win) {
        // Get all skill progress bars within the window
        const skillBars = win.querySelectorAll('.skill-progress');
        
        // Create intersection observer to trigger animation when skills section is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate each skill bar
                    skillBars.forEach((bar, index) => {
                        // Get the target percentage from the data attribute (using data-width)
                        const targetPercentage = bar.getAttribute('data-width');
                        
                        // Reset the bar width to 0
                        bar.style.width = '0%';
                        
                        // Animate with a slight delay for each bar
                        setTimeout(() => {
                            bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                            bar.style.width = targetPercentage + '%';
                        }, index * 100); // 100ms delay between each bar
                    });
                    
                    // Stop observing after animation triggers
                    observer.disconnect();
                }
            });
        }, {
            threshold: 0.3 // Trigger when 30% of the skills section is visible
        });
        
        // Observe the skills section
        const skillsSection = win.querySelector('.skills-section');
        if (skillsSection) {
            observer.observe(skillsSection);
        } else {
            // Fallback: if skills section not found, animate immediately
            skillBars.forEach((bar, index) => {
                const targetPercentage = bar.getAttribute('data-width');
                bar.style.width = '0%';
                
                setTimeout(() => {
                    bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    bar.style.width = targetPercentage + '%';
                }, index * 100);
            });
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
                'Desktop': { type: 'folder' },
                'Documents': { type: 'folder' },
                'Downloads': { type: 'folder' },
                'Pictures': { type: 'folder' },
                'Music': { type: 'folder' },
                'Videos': { type: 'folder' }
            },
            '~/Desktop': {
                'Development Projects': { type: 'folder' },
                'Design Assets': { type: 'folder' },
                'Certificates': { type: 'folder' },
                'Pawan_Joshi_Resume.pdf': { type: 'file', size: '2.1 MB', modified: '2025-01-23' },
                'Portfolio_Presentation.pptx': { type: 'file', size: '8.5 MB', modified: '2025-01-22' },
                'Skills_Assessment.xlsx': { type: 'file', size: '245 KB', modified: '2025-01-20' },
                'Quick_Notes.txt': { type: 'file', size: '3 KB', modified: '2025-01-25' }
            },
            '~/Documents': {
                'Academic': { type: 'folder' },
                'Professional': { type: 'folder' },
                'Research Papers': { type: 'folder' },
                'Project Documentation': { type: 'folder' },
                'Graph-E-Thon_2025_Report.pdf': { type: 'file', size: '1.8 MB', modified: '2025-01-18' },
                'AI_ML_Study_Notes.md': { type: 'file', size: '28 KB', modified: '2025-01-15' },
                'Full_Stack_Roadmap.txt': { type: 'file', size: '12 KB', modified: '2025-01-10' }
            },
            '~/Downloads': {
                'zenari-wellness-app.apk': { type: 'file', size: '25.6 MB', modified: '2025-01-22' },
                'react-native-setup.exe': { type: 'file', size: '128 MB', modified: '2025-01-20' },
                'firebase-config.json': { type: 'file', size: '2 KB', modified: '2025-01-19' },
                'node-modules-backup.zip': { type: 'file', size: '45.2 MB', modified: '2025-01-18' },
                'vs-code-extensions.txt': { type: 'file', size: '1 KB', modified: '2025-01-16' }
            },
            '~/Pictures': {
                'Project Screenshots': { type: 'folder' },
                'Profile Photos': { type: 'folder' },
                'UI Mockups': { type: 'folder' },
                'professional_headshot.jpg': { type: 'file', size: '3.2 MB', modified: '2025-01-21' },
                'zenari_app_demo.png': { type: 'file', size: '1.8 MB', modified: '2025-01-20' },
                'portfolio_website_preview.png': { type: 'file', size: '2.1 MB', modified: '2025-01-19' },
                'graph_e_thon_team_photo.jpg': { type: 'file', size: '4.5 MB', modified: '2025-01-15' }
            },
            '~/Music': {
                'Coding Playlists': { type: 'folder' },
                'lo-fi-coding-beats.mp3': { type: 'file', size: '4.5 MB', modified: '2025-01-16' },
                'focus_music_mix.mp3': { type: 'file', size: '3.8 MB', modified: '2025-01-14' },
                'ambient_work_sounds.mp3': { type: 'file', size: '5.2 MB', modified: '2025-01-12' }
            },
            '~/Videos': {
                'Project Demos': { type: 'folder' },
                'Tutorials': { type: 'folder' },
                'zenari_app_walkthrough.mp4': { type: 'file', size: '45.2 MB', modified: '2025-01-17' },
                'portfolio_website_demo.mp4': { type: 'file', size: '28.7 MB', modified: '2025-01-15' },
                'react_native_tutorial.mp4': { type: 'file', size: '156.3 MB', modified: '2025-01-10' }
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
    function initMusicPlayer(win) {
        const playPauseBtn = win.querySelector('#play-pause-btn');
        const prevBtn = win.querySelector('#prev-btn');
        const nextBtn = win.querySelector('#next-btn');
        const shuffleBtn = win.querySelector('#shuffle-btn');
        const repeatBtn = win.querySelector('#repeat-btn');
        const volumeSlider = win.querySelector('#volume-slider');
        const currentSongTitle = win.querySelector('#current-song-title');
        const currentSongArtist = win.querySelector('#current-song-artist');
        const albumArt = win.querySelector('.album-art');
        const playlistContainer = win.querySelector('#playlist');
        const progressBar = win.querySelector('.progress-bar');
        const progressFill = win.querySelector('.progress-fill');
        const currentTimeDisplay = win.querySelector('#current-time');
        const totalTimeDisplay = win.querySelector('#total-time');
        
        const songs = [
            { title: "Lofi Study", artist: "FASSounds", duration: 140, url: "https://cdn.pixabay.com/audio/2022/10/18/audio_85273b7596.mp3"},
            { title: "Midnight Forest", artist: "chillmore", duration: 164, url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808447342.mp3"},
            { title: "Coffee Chill Out", artist: "AME", duration: 128, url: "https://cdn.pixabay.com/audio/2023/04/24/audio_903713289b.mp3"},
            { title: "Deep Focus", artist: "Study Vibes", duration: 180, url: "https://cdn.pixabay.com/audio/2022/11/11/audio_d0b61496c6.mp3"},
            { title: "Calm Waters", artist: "Ambient Zone", duration: 156, url: "https://cdn.pixabay.com/audio/2023/02/14/audio_31b2f00a71.mp3"}
        ];

        let currentAudio = null;
        let currentSongIndex = 0;
        let isPlaying = false;
        let isShuffled = false;
        let repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
        let volume = 0.7;
        let currentTime = 0;
        let duration = 0;
        let progressInterval = null;

        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        
        function updateUI() {
            const song = songs[currentSongIndex];
            currentSongTitle.textContent = song.title;
            currentSongArtist.textContent = song.artist;
            totalTimeDisplay.textContent = formatTime(song.duration);
            
            // Update playlist active state
            playlistContainer.querySelectorAll('.playlist-item').forEach((item, index) => {
                if (index === currentSongIndex) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Update album art animation
            if (isPlaying) {
                albumArt.classList.add('playing');
            } else {
                albumArt.classList.remove('playing');
            }
        }

        function updateProgress() {
            if (currentAudio && duration > 0) {
                currentTime = currentAudio.currentTime;
                const progressPercent = (currentTime / duration) * 100;
                progressFill.style.width = `${progressPercent}%`;
                currentTimeDisplay.textContent = formatTime(currentTime);
            }
        }

        function loadSong(index) {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.removeEventListener('loadedmetadata', updateDuration);
                currentAudio.removeEventListener('ended', handleSongEnd);
                currentAudio.removeEventListener('timeupdate', updateProgress);
            }
            
            currentSongIndex = index;
            const song = songs[currentSongIndex];
            currentAudio = new Audio(song.url);
            currentAudio.volume = volume;
            
            currentAudio.addEventListener('loadedmetadata', updateDuration);
            currentAudio.addEventListener('ended', handleSongEnd);
            currentAudio.addEventListener('timeupdate', updateProgress);
            
            updateUI();
        }

        function updateDuration() {
            if (currentAudio) {
                duration = currentAudio.duration || songs[currentSongIndex].duration;
                totalTimeDisplay.textContent = formatTime(duration);
            }
        }

        function handleSongEnd() {
            if (repeatMode === 2) {
                // Repeat current song
                playSong(currentSongIndex);
            } else if (repeatMode === 1 || currentSongIndex < songs.length - 1) {
                // Repeat all or next song available
                nextSong();
            } else {
                // Stop playback
                stopPlayback();
            }
        }

        function playSong(index) {
            loadSong(index);
            currentAudio.play().then(() => {
                isPlaying = true;
                playPauseBtn.querySelector('i').setAttribute('data-lucide', 'pause');
                lucide.createIcons();
                updateUI();
            }).catch(error => {
                console.error('Error playing audio:', error);
                showNotification('Playback Error', 'Could not play audio. Please try again.');
            });
        }

        function pauseSong() {
            if (currentAudio) {
                currentAudio.pause();
                isPlaying = false;
                playPauseBtn.querySelector('i').setAttribute('data-lucide', 'play');
                lucide.createIcons();
                updateUI();
            }
        }

        function stopPlayback() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                isPlaying = false;
                playPauseBtn.querySelector('i').setAttribute('data-lucide', 'play');
                lucide.createIcons();
                updateUI();
                progressFill.style.width = '0%';
                currentTimeDisplay.textContent = '0:00';
            }
        }

        function nextSong() {
            let nextIndex;
            if (isShuffled) {
                nextIndex = Math.floor(Math.random() * songs.length);
            } else {
                nextIndex = (currentSongIndex + 1) % songs.length;
            }
            playSong(nextIndex);
        }

        function prevSong() {
            const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playSong(prevIndex);
        }

        // Event Listeners
        playPauseBtn.onclick = () => {
            if (isPlaying) {
                pauseSong();
            } else {
                if (currentAudio) {
                    currentAudio.play().then(() => {
                        isPlaying = true;
                        playPauseBtn.querySelector('i').setAttribute('data-lucide', 'pause');
                        lucide.createIcons();
                        updateUI();
                    }).catch(error => {
                        console.error('Error resuming audio:', error);
                    });
                } else {
                    playSong(currentSongIndex);
                }
            }
        };

        nextBtn.onclick = () => {
            nextSong();
        };

        prevBtn.onclick = () => {
            prevSong();
        };

        shuffleBtn.onclick = () => {
            isShuffled = !isShuffled;
            if (isShuffled) {
                shuffleBtn.classList.add('active');
            } else {
                shuffleBtn.classList.remove('active');
            }
        };

        repeatBtn.onclick = () => {
            repeatMode = (repeatMode + 1) % 3;
            repeatBtn.classList.remove('active');
            const icon = repeatBtn.querySelector('i');
            
            switch(repeatMode) {
                case 0:
                    icon.setAttribute('data-lucide', 'repeat');
                    break;
                case 1:
                    icon.setAttribute('data-lucide', 'repeat');
                    repeatBtn.classList.add('active');
                    break;
                case 2:
                    icon.setAttribute('data-lucide', 'repeat-1');
                    repeatBtn.classList.add('active');
                    break;
            }
            lucide.createIcons();
        };

        volumeSlider.oninput = () => {
            volume = volumeSlider.value / 100;
            if (currentAudio) {
                currentAudio.volume = volume;
            }
        };

        // Progress bar click to seek
        progressBar.onclick = (e) => {
            if (currentAudio && duration > 0) {
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const progressWidth = rect.width;
                const seekTime = (clickX / progressWidth) * duration;
                currentAudio.currentTime = seekTime;
            }
        };

        // Populate playlist
        playlistContainer.innerHTML = songs.map((song, index) => `
            <div class="playlist-item" data-song-index="${index}">
                <div class="playlist-item-info">
                    <div class="playlist-item-icon">
                        <i data-lucide="music"></i>
                    </div>
                    <div class="playlist-item-text">
                        <h5>${song.title}</h5>
                        <p>${song.artist}</p>
                    </div>
                </div>
                <div class="playlist-item-duration">${formatTime(song.duration)}</div>
            </div>
        `).join('');

        playlistContainer.querySelectorAll('.playlist-item').forEach(item => {
            item.onclick = () => {
                playSong(parseInt(item.dataset.songIndex));
            };
        });
        
        // Initialize
        loadSong(0);
        volumeSlider.value = volume * 100;
        lucide.createIcons();
        
        // Store player instance for cleanup
        win.musicPlayer = {
            isPlaying,
            togglePlayPause: () => {
                if (isPlaying) {
                    pauseSong();
                } else {
                    playSong(currentSongIndex);
                }
            },
            cleanup: () => {
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
            }
        };
    }
    
    function initTerminal(win) {
        const terminalOutput = win.querySelector('#terminal-output');
        const terminalInput = win.querySelector('#terminal-input');
        const terminalForm = win.querySelector('#terminal-form');
        
        // Terminal state
        let currentPath = '/home/pawan';
        let commandHistory = JSON.parse(localStorage.getItem('terminalHistory')) || [];
        let historyIndex = commandHistory.length;
        let isAuthenticated = false;
        
        // --- FIX START: Correctly define portfolioData ---
        const portfolioData = {
            about: {
                name: 'Pawan Joshi',
                title: 'AI/ML & Full-Stack Developer',
                education: 'Computer Science Student at Graphic Era University',
                role: 'CTO & Co-Founder of Tech Sangi Pvt. Ltd.',
                achievement: 'Top 35 Finalist - Graph-E-Thon 2025',
                experience: '3+ years building production-ready applications',
                focus: 'AI/ML, React Native, Firebase, Full-Stack Development'
            },
            skills: {
                'Industry Knowledge': {
                    'JavaScript': '90%',
                    'C (Programming Language)': '80%',
                    'C++': '85%',
                    'Python (Programming Language)': '88%',
                    'AI/ML': '82%'
                },
                'Tools & Technologies': {
                    'React Native': '90%',
                    'Firebase': '92%',
                    'Node.js': '85%',
                    'WordPress (Passed LinkedIn Skill Assessment)': '78%'
                },
                'Interpersonal Skills': {
                    'Leadership': '88%',
                    'Public Speaking': '82%',
                    'Creativity': '90%',
                    'Team Collaboration': '92%',
                    'Graphic Design': '78%'
                }
            },
            projects: [
                {
                    name: 'Zenari - AI Wellness App',
                    description: 'Developed during Graph-E-Thon 2.0 in 48 hours. Zenari provides empathetic AI chat support, smart journaling, mood analytics, and more.',
                    tech: ['React Native', 'Firebase', 'AI/ML'],
                    status: 'Top 35 Finalist'
                },
                {
                    name: 'PawanOS Portfolio',
                    description: 'Interactive portfolio website designed as an operating system interface.',
                    tech: ['JavaScript', 'CSS3', 'HTML5', 'Particles.js'],
                    status: 'Live'
                },
                {
                    name: 'Full-Stack E-commerce',
                    description: 'Complete e-commerce solution with user authentication, product management, and payment gateway integration.',
                    tech: ['React.js', 'Node.js', 'MongoDB'],
                    status: 'In Development'
                }
            ],
            contact: {
                email: 'me@joshipawan.com.np',
                linkedin: 'https://www.linkedin.com/in/pwnjoshi/',
                github: 'https://github.com/pwnjoshi',
                twitter: 'https://twitter.com/pwnjoshidev'
            },
            fileSystem: {
                '/home/pawan': {
                    type: 'directory',
                    contents: ['Documents', 'Projects', 'Skills', 'About', 'Contact', '.bashrc', '.profile']
                },
                '/home/pawan/Documents': {
                    type: 'directory',
                    contents: ['resume.pdf', 'certificates', 'academic']
                },
                '/home/pawan/Projects': {
                    type: 'directory',
                    contents: ['zenari-app', 'pawanos-portfolio', 'ecommerce-platform', 'README.md']
                },
                '/home/pawan/Skills': {
                    type: 'directory',
                    contents: ['programming.json', 'tools.json', 'soft-skills.json']
                }
            }
        };

        // Now, add the file content that depends on the main portfolioData object
        portfolioData.fileSystem['/home/pawan/About'] = {
            type: 'file',
            content: `# About Pawan Joshi\n\n${portfolioData.about.name} - ${portfolioData.about.title}\n${portfolioData.about.education}\n${portfolioData.about.role}\n\n🏆 ${portfolioData.about.achievement}\n⚡ ${portfolioData.about.experience}\n🎯 Focus: ${portfolioData.about.focus}`
        };

        portfolioData.fileSystem['/home/pawan/Contact'] = {
            type: 'file',
            content: `# Contact Information\n\n📧 Email: ${portfolioData.contact.email}\n🔗 LinkedIn: ${portfolioData.contact.linkedin}\n🐙 GitHub: ${portfolioData.contact.github}\n🐦 Twitter: ${portfolioData.contact.twitter}`
        };
        // --- FIX END ---
        
        // Color schemes
        const colors = {
            primary: '#00f0ff',
            secondary: '#ff2f7d',
            success: '#4ade80',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6',
            muted: '#a0aec0'
        };
        
        // Terminal commands
        const commands = {
            help: {
                description: 'Show available commands',
                execute: () => {
                    const commandList = Object.entries(commands).map(([cmd, info]) => 
                        `<span style="color: ${colors.primary}">${cmd.padEnd(15)}</span> - ${info.description}`
                    ).join('\n');
                    
                    return `\n<span style="color: ${colors.success}">Available Commands:</span>\n\n${commandList}\n\n<span style="color: ${colors.info}">💡 Tip: Use tab for autocomplete, ↑↓ for history</span>`;
                }
            },
            
            clear: {
                description: 'Clear terminal screen',
                execute: () => {
                    terminalOutput.innerHTML = '';
                    return null;
                }
            },
            
            ls: {
                description: 'List directory contents',
                execute: (args) => {
                    const path = args[0] ? resolvePath(args[0]) : currentPath;
                    const dir = portfolioData.fileSystem[path];
                    
                    if (!dir) {
                        return `<span style="color: ${colors.error}">ls: cannot access '${args[0] || path}': No such file or directory</span>`;
                    }
                    
                    if (dir.type === 'file') {
                        return `<span style="color: ${colors.info}">${path.split('/').pop()}</span>`;
                    }
                    
                    const items = dir.contents.map(item => {
                        const itemPath = `${path}/${item}`;
                        const itemData = portfolioData.fileSystem[itemPath];
                        const isDir = itemData?.type === 'directory' || !itemData;
                        return `<span style="color: ${isDir ? colors.primary : colors.success}">${item}${isDir ? '/' : ''}</span>`;
                    }).join('  ');
                    
                    return items || `<span style="color: ${colors.muted}">Empty directory</span>`;
                }
            },
            
            cd: {
                description: 'Change directory',
                execute: (args) => {
                    if (!args[0]) {
                        currentPath = '/home/pawan';
                        return null;
                    }
                    
                    const newPath = resolvePath(args[0]);
                    const dir = portfolioData.fileSystem[newPath];
                    
                    if (!dir || dir.type !== 'directory') {
                        return `<span style="color: ${colors.error}">cd: ${args[0]}: No such directory</span>`;
                    }
                    
                    currentPath = newPath;
                    return null;
                }
            },
            
            pwd: {
                description: 'Print working directory',
                execute: () => `<span style="color: ${colors.info}">${currentPath}</span>`
            },
            
            cat: {
                description: 'Display file contents',
                execute: (args) => {
                    if (!args[0]) {
                        return `<span style="color: ${colors.error}">cat: missing file operand</span>`;
                    }
                    
                    const filePath = resolvePath(args[0]);
                    const file = portfolioData.fileSystem[filePath];
                    
                    if (!file) {
                        return `<span style="color: ${colors.error}">cat: ${args[0]}: No such file or directory</span>`;
                    }
                    
                    if (file.type === 'directory') {
                        return `<span style="color: ${colors.error}">cat: ${args[0]}: Is a directory</span>`;
                    }
                    
                    return `<span style="color: ${colors.muted}">${file.content.replace(/\n/g, '<br>')}</span>`;
                }
            },
            
            about: {
                description: 'Show about information',
                execute: () => {
                    const about = portfolioData.about;
                    return `\n<span style="color: ${colors.success}">📋 About ${about.name}</span>\n\n` +
                           `<span style="color: ${colors.primary}">Title:</span> ${about.title}\n` +
                           `<span style="color: ${colors.primary}">Education:</span> ${about.education}\n` +
                           `<span style="color: ${colors.primary}">Role:</span> ${about.role}\n` +
                           `<span style="color: ${colors.primary}">Achievement:</span> ${about.achievement}\n` +
                           `<span style="color: ${colors.primary}">Experience:</span> ${about.experience}\n` +
                           `<span style="color: ${colors.primary}">Focus:</span> ${about.focus}\n`;
                }
            },
            
            skills: {
                description: 'Show technical skills',
                execute: (args) => {
                    const category = args[0];
                    const skills = portfolioData.skills;
                    
                    if (category) {
                        const categoryData = skills[category] || skills[Object.keys(skills).find(k => k.toLowerCase().includes(category.toLowerCase()))];
                        if (!categoryData) {
                            return `<span style="color: ${colors.error}">Category '${category}' not found. Available: ${Object.keys(skills).join(', ')}</span>`;
                        }
                        
                        const skillList = Object.entries(categoryData).map(([skill, level]) => 
                            `<span style="color: ${colors.info}">${skill}</span>: <span style="color: ${colors.success}">${level}</span>`
                        ).join('\n');
                        
                        return `\n<span style="color: ${colors.primary}">${category}</span>\n\n${skillList}\n`;
                    }
                    
                    const allSkills = Object.entries(skills).map(([category, skillList]) => {
                        const skills = Object.entries(skillList).map(([skill, level]) => 
                            `  <span style="color: ${colors.info}">${skill}</span>: <span style="color: ${colors.success}">${level}</span>`
                        ).join('\n');
                        return `<span style="color: ${colors.primary}">${category}</span>\n${skills}`;
                    }).join('\n\n');
                    
                    return `\n<span style="color: ${colors.success}">🛠️ Technical Skills</span>\n\n${allSkills}\n`;
                }
            },
            
            projects: {
                description: 'Show project portfolio',
                execute: (args) => {
                    const projectName = args[0];
                    const projects = portfolioData.projects;
                    
                    if (projectName) {
                        const project = projects.find(p => p.name.toLowerCase().includes(projectName.toLowerCase()));
                        if (!project) {
                            return `<span style="color: ${colors.error}">Project '${projectName}' not found</span>`;
                        }
                        
                        return `\n<span style="color: ${colors.primary}">${project.name}</span>\n\n` +
                                   `<span style="color: ${colors.info}">Description:</span> ${project.description}\n` +
                                   `<span style="color: ${colors.info}">Technologies:</span> ${project.tech.join(', ')}\n` +
                                   `<span style="color: ${colors.info}">Status:</span> <span style="color: ${colors.success}">${project.status}</span>\n`;
                    }
                    
                    const projectList = projects.map(project => 
                        `<span style="color: ${colors.primary}">${project.name}</span> - ${project.description.substring(0, 60)}...`
                    ).join('\n');
                    
                    return `\n<span style="color: ${colors.success}">🚀 Projects Portfolio</span>\n\n${projectList}\n\n<span style="color: ${colors.muted}">Use 'projects <name>' for details</span>`;
                }
            },
            
            contact: {
                description: 'Show contact information',
                execute: () => {
                    const contact = portfolioData.contact;
                    return `\n<span style="color: ${colors.success}">📞 Contact Information</span>\n\n` +
                           `<span style="color: ${colors.primary}">Email:</span> <a href="mailto:${contact.email}" style="color: ${colors.info}">${contact.email}</a>\n` +
                           `<span style="color: ${colors.primary}">LinkedIn:</span> <a href="${contact.linkedin}" target="_blank" style="color: ${colors.info}">${contact.linkedin}</a>\n` +
                           `<span style="color: ${colors.primary}">GitHub:</span> <a href="${contact.github}" target="_blank" style="color: ${colors.info}">${contact.github}</a>\n` +
                           `<span style="color: ${colors.primary}">Twitter:</span> <a href="${contact.twitter}" target="_blank" style="color: ${colors.info}">${contact.twitter}</a>\n`;
                }
            },
            
            open: {
                description: 'Open PawanOS applications',
                execute: (args) => {
                    if (!args[0]) {
                        return `<span style="color: ${colors.error}">Usage: open <app>\nAvailable apps: about, projects, settings, music, file-explorer</span>`;
                    }
                    
                    const appMap = {
                        'about': { id: 'about', name: 'About', icon: 'user-round' },
                        'projects': { id: 'projects', name: 'Projects', icon: 'rocket' },
                        'settings': { id: 'settings', name: 'Settings', icon: 'settings' },
                        'music': { id: 'music', name: 'Music', icon: 'music' },
                        'explorer': { id: 'file-explorer', name: 'Explorer', icon: 'folder' },
                        'file-explorer': { id: 'file-explorer', name: 'Explorer', icon: 'folder' }
                    };
                    
                    const app = appMap[args[0].toLowerCase()];
                    if (!app) {
                        return `<span style="color: ${colors.error}">Unknown app: ${args[0]}</span>`;
                    }
                    
                    openWindow(app.id, app.name, app.icon);
                    return `<span style="color: ${colors.success}">Opening ${app.name}...</span>`;
                }
            },
            
            theme: {
                description: 'Toggle dark/light theme',
                execute: (args) => {
                    const currentTheme = document.documentElement.getAttribute('data-theme');
                    const newTheme = args[0] || (currentTheme === 'dark' ? 'light' : 'dark');
                    
                    if (!['dark', 'light'].includes(newTheme)) {
                        return `<span style="color: ${colors.error}">Invalid theme. Use: dark, light</span>`;
                    }
                    
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem('theme', newTheme);
                    updateThemeIcon(newTheme);
                    
                    return `<span style="color: ${colors.success}">Theme changed to ${newTheme}</span>`;
                }
            },
            
            whoami: {
                description: 'Display current user info',
                execute: () => `<span style="color: ${colors.info}">pawan@pawanos</span>`
            },
            
            date: {
                description: 'Display current date and time',
                execute: () => `<span style="color: ${colors.info}">${new Date().toString()}</span>`
            },
            
            echo: {
                description: 'Display text',
                execute: (args) => `<span style="color: ${colors.muted}">${args.join(' ')}</span>`
            },
            
            history: {
                description: 'Show command history',
                execute: () => {
                    if (commandHistory.length === 0) {
                        return `<span style="color: ${colors.muted}">No commands in history</span>`;
                    }
                    
                    const historyList = commandHistory.map((cmd, index) => 
                        `<span style="color: ${colors.muted}">${(index + 1).toString().padStart(3)}</span>  <span style="color: ${colors.info}">${cmd}</span>`
                    ).join('\n');
                    
                    return `\n${historyList}\n`;
                }
            },
            
            neofetch: {
                description: 'Display system information',
                execute: () => {
                    return `\n<span style="color: ${colors.primary}">  ___   ___   ___   ___   ___   ___   ___  </span>\n` +
                           `<span style="color: ${colors.primary}"> /\\  \\ /\\  \\ /\\  \\ /\\  \\ /\\  \\ /\\  \\ /\\  \\ </span>\n` +
                           `<span style="color: ${colors.primary}">/::\\  \\/::\\  \\/::\\  \\/::\\  \\ \\:\\  \\/::\\  \\/::\\  \\</span>\n` +
                           `<span style="color: ${colors.primary}">/:/\\:\\  \\/:/\\:\\  \\/:/\\:\\  \\/:/\\:\\  \\ \\:\\  \\/:/\\:\\  \\/:/\\ \\  \\</span>\n` +
                           `<span style="color: ${colors.primary}">/::\\~\\:\\  \\/::\\~\\:\\  \\/::\\~\\:\\  \\/:/  \\:\\  \\_____\\:\\  \\/:/  \\:\\  \\_\\:\\~\\ \\  \\</span>\n` +
                           `<span style="color: ${colors.primary}">/:/\\:\\ \\:\\__\\/:/\\:\\ \\:\\__\\/:/\\:\\ \\:\\__\\/:/__/ \\:\\__\\::::::::\\__\\/:/__/ \\:\\__\\/\\ \\:\\ \\ \\__\\</span>\n` +
                           `<span style="color: ${colors.primary}">\\/__\\:\\/:/  /\\/__\\:\\/:/  /\\/__\\:\\/:/  / \\:\\  \\ /:/  / \\:\\~~\\~\\/__/ \\:\\  \\ /:/  / \\:\\ \\:\\ \\/__/</span>\n` +
                           `<span style="color: ${colors.primary}">     \\::/  /      \\::/  /      \\::/  /   \\:\\ /:/  /   \\:\\  \\      \\:\\ /:/  /   \\:\\ \\:\\__\\  </span>\n` +
                           `<span style="color: ${colors.primary}">      \\/__/        \\/__/        \\/__/     \\:\\/:/  /     \\:\\  \\      \\:\\/:/  /     \\:\\/:/  /  </span>\n` +
                           `<span style="color: ${colors.primary}">                                         \\::/  /       \\:\\__\\      \\::/  /       \\::/  /   </span>\n` +
                           `<span style="color: ${colors.primary}">                                          \\/__/         \\/__/       \\/__/         \\/__/    </span>\n\n` +
                           `<span style="color: ${colors.info}">OS:</span> PawanOS (Portfolio Edition)\n` +
                           `<span style="color: ${colors.info}">Developer:</span> Pawan Joshi\n` +
                           `<span style="color: ${colors.info}">Role:</span> AI/ML & Full-Stack Developer\n` +
                           `<span style="color: ${colors.info}">University:</span> Graphic Era University\n` +
                           `<span style="color: ${colors.info}">Experience:</span> 3+ Years\n` +
                           `<span style="color: ${colors.info}">Specialization:</span> React Native, Firebase, AI/ML\n` +
                           `<span style="color: ${colors.info}">Achievement:</span> Top 35 Finalist - Graph-E-Thon 2025\n`;
                }
            }
        };
        
        // Helper functions
        function resolvePath(path) {
            if (path.startsWith('/')) {
                return path;
            }
            
            if (path === '..') {
                const parts = currentPath.split('/');
                parts.pop();
                return parts.join('/') || '/';
            }
            
            if (path === '.') {
                return currentPath;
            }
            
            return `${currentPath}/${path}`.replace(/\/+/g, '/');
        }
        
        function addToHistory(command) {
            if (command.trim() && commandHistory[commandHistory.length - 1] !== command) {
                commandHistory.push(command);
                if (commandHistory.length > 100) {
                    commandHistory.shift();
                }
                localStorage.setItem('terminalHistory', JSON.stringify(commandHistory));
            }
            historyIndex = commandHistory.length;
        }
        
        function getAutocomplete(input) {
            const parts = input.split(' ');
            const command = parts[0];
            
            if (parts.length === 1) {
                // Command completion
                const matches = Object.keys(commands).filter(cmd => cmd.startsWith(command));
                return matches.length === 1 ? matches[0] : matches;
            }
            
            // Path completion for commands that accept paths
            if (['cd', 'ls', 'cat'].includes(command) && parts.length === 2) {
                const pathInput = parts[1];
                const basePath = pathInput.includes('/') ? pathInput.substring(0, pathInput.lastIndexOf('/')) : '';
                const fileName = pathInput.includes('/') ? pathInput.substring(pathInput.lastIndexOf('/') + 1) : pathInput;
                
                const searchPath = basePath ? resolvePath(basePath) : currentPath;
                const dir = portfolioData.fileSystem[searchPath];
                
                if (dir && dir.type === 'directory') {
                    const matches = dir.contents.filter(item => item.startsWith(fileName));
                    if (matches.length === 1) {
                        return basePath ? `${basePath}/${matches[0]}` : matches[0];
                    }
                    return matches;
                }
            }
            
            return [];
        }
        
        function executeCommand(input) {
            const parts = input.trim().split(/\s+/);
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);
            
            if (!command) return null;
            
            if (commands[command]) {
                return commands[command].execute(args);
            } else {
                return `<span style="color: ${colors.error}">Command '${command}' not found. Type 'help' for available commands.</span>`;
            }
        }
        
        function appendOutput(content, isCommand = false) {
            if (content === null) return;
            
            const line = document.createElement('div');
            line.style.marginBottom = '0.5rem';
            line.style.fontFamily = 'var(--font-mono)';
            line.style.whiteSpace = 'pre-wrap';
            line.style.wordBreak = 'break-word';
            
            if (isCommand) {
                line.innerHTML = `<span style="color: ${colors.primary}">joshi@PawanOS</span><span style="color: ${colors.muted}">:</span><span style="color: ${colors.info}">${currentPath.replace('/home/pawan', '~')}</span><span style="color: ${colors.muted}">$</span> <span style="color: ${colors.success}">${content}</span>`;
            } else {
                line.innerHTML = content;
            }
            
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
        
        // Initialize terminal
        appendOutput('Welcome to PawanOS Terminal v2.1.0');
        appendOutput(`Type '<span style="color: ${colors.primary}">help</span>' for available commands, '<span style="color: ${colors.primary}">about</span>' for portfolio info.`);
        appendOutput('');
        
        // --- FIX START: Simplified and robust event handling ---
        const handleTerminalSubmit = (e) => {
            e.preventDefault();
            const input = terminalInput.value.trim();
            
            if (input) {
                appendOutput(input, true);
                addToHistory(input);
                
                try {
                    const output = executeCommand(input);
                    if (output !== null && output !== undefined) {
                        appendOutput(output);
                    }
                } catch (error) {
                    appendOutput(`<span style="color: ${colors.error}">Error executing command: ${error.message}</span>`);
                }
                
                appendOutput('');
            }
            
            terminalInput.value = '';
            terminalInput.focus();
        };

        terminalForm.addEventListener('submit', handleTerminalSubmit);
        
        // Keyboard shortcuts
        terminalInput.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (historyIndex > 0) {
                        historyIndex--;
                        terminalInput.value = commandHistory[historyIndex] || '';
                    }
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        terminalInput.value = commandHistory[historyIndex] || '';
                    } else {
                        historyIndex = commandHistory.length;
                        terminalInput.value = '';
                    }
                    break;
                    
                case 'Tab':
                    e.preventDefault();
                    const autocomplete = getAutocomplete(terminalInput.value);
                    if (typeof autocomplete === 'string') {
                        const parts = terminalInput.value.split(' ');
                        if (parts.length === 1) {
                            terminalInput.value = autocomplete + ' ';
                        } else {
                            parts[parts.length - 1] = autocomplete;
                            terminalInput.value = parts.join(' ');
                        }
                    } else if (Array.isArray(autocomplete) && autocomplete.length > 0) {
                        appendOutput(`Possible completions: ${autocomplete.join('  ')}`);
                        appendOutput('');
                    }
                    break;
                    
                case 'l':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        commands.clear.execute();
                    }
                    break;
                    
                case 'c':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        terminalInput.value = '';
                        appendOutput('^C');
                        appendOutput('');
                    }
                    break;
            }
        });
        // --- FIX END ---
        
        // Focus terminal input when terminal is clicked
        win.addEventListener('click', () => {
            terminalInput.focus();
        });
        
        // Auto-focus when terminal opens
        setTimeout(() => {
            terminalInput.focus();
        }, 100);
    }

    // --- INITIALIZE OS ---
    const savedWallpaper = localStorage.getItem('wallpaper');
    if (savedWallpaper) document.querySelector('.os-container').style.backgroundImage = savedWallpaper;
    
    particlesJS('particles-js', {"particles":{"number":{"value":80,"density":{"enable":true,"value_area":800}},"color":{"value":"#ffffff"},"shape":{"type":"circle"},"opacity":{"value":0.5,"random":true},"size":{"value":3,"random":true},"line_linked":{"enable":false},"move":{"enable":true,"speed":1,"direction":"none","random":true,"straight":false,"out_mode":"out","bounce":false}},"interactivity":{"detect_on":"canvas","events":{"onhover":{"enable":false},"onclick":{"enable":false},"resize":true}},"retina_detect":true});
    lucide.createIcons();
    
});