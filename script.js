document.addEventListener('DOMContentLoaded', () => {
    const windows = document.querySelectorAll('.window');
    const desktopIcons = document.querySelectorAll('.desktop-icon');
    const dock = document.getElementById('dock');
    let zIndexCounter = 10;

    // --- Window Management ---
    const openWindows = {};

    const openWindow = (windowId) => {
        const windowEl = document.getElementById(`${windowId}-window`);
        if (!windowEl) return;

        windowEl.style.display = 'flex';
        windowEl.style.zIndex = ++zIndexCounter;

        if (!openWindows[windowId]) {
            openWindows[windowId] = true;
            createDockIcon(windowId);
        }
    };

    const closeWindow = (windowId) => {
        const windowEl = document.getElementById(`${windowId}-window`);
        if (windowEl) {
            windowEl.style.display = 'none';
            delete openWindows[windowId];
            removeDockIcon(windowId);
        }
    };

    desktopIcons.forEach(icon => {
        icon.addEventListener('dblclick', () => openWindow(icon.dataset.window));
        icon.addEventListener('click', (e) => {
            if (e.detail === 1 && window.innerWidth <= 768) {
                openWindow(icon.dataset.window);
            }
        });
    });

    windows.forEach(windowEl => {
        const titleBar = windowEl.querySelector('.title-bar');
        const closeBtn = windowEl.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => closeWindow(closeBtn.dataset.window));

        let isDragging = false;
        let offset = { x: 0, y: 0 };
        titleBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            offset.x = e.clientX - windowEl.offsetLeft;
            offset.y = e.clientY - windowEl.offsetTop;
            windowEl.style.zIndex = ++zIndexCounter;
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            let newX = e.clientX - offset.x;
            let newY = e.clientY - offset.y;
            const maxX = window.innerWidth - windowEl.offsetWidth;
            const maxY = window.innerHeight - windowEl.offsetHeight;
            windowEl.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            windowEl.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
        windowEl.addEventListener('mousedown', () => { windowEl.style.zIndex = ++zIndexCounter; });
    });

    // --- Dock Logic ---
    const createDockIcon = (windowId) => {
        const iconElement = document.querySelector(`.desktop-icon[data-window="${windowId}"] i`);
        if (!iconElement) return;
        const iconData = iconElement.className;
        const dockIcon = document.createElement('i');
        dockIcon.className = `${iconData} dock-icon`;
        dockIcon.dataset.window = windowId;
        dockIcon.addEventListener('click', () => openWindow(windowId));
        dock.appendChild(dockIcon);
    };

    const removeDockIcon = (windowId) => {
        const dockIcon = dock.querySelector(`.dock-icon[data-window="${windowId}"]`);
        if (dockIcon) dock.removeChild(dockIcon);
    };

    // --- Terminal Logic ---
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalWindow = document.getElementById('terminal-window');
    if (terminalWindow) terminalWindow.addEventListener('click', () => terminalInput.focus());

    const printToTerminal = (html) => {
        const p = document.createElement('p');
        p.innerHTML = html;
        terminalOutput.appendChild(p);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    const commands = {
        help: `Available commands:<br>
               - <b>help</b>: Show this list<br>
               - <b>open [app]</b>: Open an application (e.g., 'open projects')<br>
               - <b>contact</b>: Show contact details<br>
               - <b>date</b>: Display the current date and time<br>
               - <b>weather</b>: Show the weather in Dehradun<br>
               - <b>neofetch</b>: Display system summary<br>
               - <b>clear</b>: Clear the terminal screen`,
        contact: `LinkedIn: <a href="https://linkedin.com/in/pwnjoshi" target="_blank">linkedin.com/in/pwnjoshi</a><br>Website: <a href="https://iampawan.me" target="_blank">iampawan.me</a>`,
        date: () => new Date().toLocaleString(),
        weather: () => "Fetching weather... It's currently a pleasant 24°C and clear in Dehradun, India.",
        neofetch: `<pre style="color: #00a8ff;">
    ./o.    <b>pawan@desktop</b>
   ./sssso.   -----------
  .osssssso.  <b>OS:</b> pwnOS v3.0
 .ossssssso.  <b>Host:</b> Human
.osssssssso.  <b>Kernel:</b> Coffee-Fueled
osssssssssso  <b>Uptime:</b> 20 years
osssssssssso  <b>Shell:</b> B.Tech CS
osssssssssso  <b>Resolution:</b> 4K
.osssssssso.  <b>Theme:</b> Glassmorphism
 .ossssssso.  <b>Interests:</b> Full-Stack, AI/ML
  .osssssso.
   ./sssso.
    ./o.
</pre>`,
        clear: () => { terminalOutput.innerHTML = ''; return true; }
    };

    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const commandLine = terminalInput.value.trim();
                const [command, ...args] = commandLine.split(' ');
                printToTerminal(`<span class="prompt">pawan@desktop:~$</span> ${commandLine}`);
                if (command === 'open' && args[0]) {
                    const section = args[0].toLowerCase();
                    if (['about', 'projects', 'skills', 'education', 'terminal', 'settings'].includes(section)) {
                        openWindow(section);
                    } else {
                        printToTerminal(`Error: Application '${args[0]}' not found.`);
                    }
                } else if (command in commands) {
                    const result = commands[command];
                    printToTerminal(typeof result === 'function' ? result() : result);
                } else if (command !== '') {
                    printToTerminal(`bash: command not found: ${command}`);
                }
                terminalInput.value = '';
            }
        });
        printToTerminal("pwnOS [Version 3.0.0]. Type 'help' for a list of commands.");
    }

    // --- Top Menu Bar Clock ---
    const clockElement = document.getElementById('clock');
    const updateClock = () => {
        const now = new Date();
        const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        clockElement.textContent = now.toLocaleString('en-US', options);
    };
    setInterval(updateClock, 1000);
    updateClock();

    // --- Settings Logic ---
    const wallpaperButtons = document.querySelectorAll('.wallpaper-btn');
    const desktop = document.getElementById('desktop-container');
    wallpaperButtons.forEach(button => {
        button.addEventListener('click', () => {
            desktop.style.backgroundImage = button.dataset.bg;
        });
    });

    // --- Animated Particle Background ---
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles = [];

    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: Math.random() * 0.5 - 0.25,
            vy: Math.random() * 0.5 - 0.25,
            radius: Math.random() * 1.5 + 0.5
        });
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        });
        requestAnimationFrame(drawParticles);
    }
    
    drawParticles();
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
});
