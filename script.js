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
        icon.addEventListener('click', (e) => { // For mobile tap
            if (e.detail === 1 && window.innerWidth <= 768) {
                openWindow(icon.dataset.window);
            }
        });
    });

    windows.forEach(windowEl => {
        const titleBar = windowEl.querySelector('.title-bar');
        const closeBtn = windowEl.querySelector('.close-btn');

        closeBtn.addEventListener('click', () => closeWindow(closeBtn.dataset.window));

        // Dragging Logic
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
            // Constrain to viewport
            const maxX = window.innerWidth - windowEl.offsetWidth;
            const maxY = window.innerHeight - windowEl.offsetHeight;
            windowEl.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            windowEl.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        windowEl.addEventListener('mousedown', () => {
             windowEl.style.zIndex = ++zIndexCounter;
        });
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
        if (dockIcon) {
            dock.removeChild(dockIcon);
        }
    };

    // --- Terminal Logic ---
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalWindow = document.getElementById('terminal-window');

    if (terminalWindow) {
        terminalWindow.addEventListener('click', () => terminalInput.focus());
    }

    const commands = {
        help: `Available commands:<br>
               - <b>help</b>: Show this list<br>
               - <b>open [section]</b>: Open a window (e.g., 'open projects')<br>
               - <b>contact</b>: Show contact details<br>
               - <b>neofetch</b>: Display system summary<br>
               - <b>clear</b>: Clear the terminal screen`,
        contact: `LinkedIn: <a href="https://linkedin.com/in/pwnjoshi" target="_blank">linkedin.com/in/pwnjoshi</a><br>Website: <a href="https://iampawan.me" target="_blank">iampawan.me</a>`,
        neofetch: `
<pre style="color: #00a8ff;">
    ./o.    <b>pawan@desktop</b>
   ./sssso.   -----------
  .osssssso.  <b>OS:</b> pwnOS v2.0
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
        clear: () => {
            terminalOutput.innerHTML = '';
            return true;
        }
    };

    const printToTerminal = (html) => {
        const p = document.createElement('p');
        p.innerHTML = html;
        terminalOutput.appendChild(p);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    };

    const welcomeMessage = () => {
        printToTerminal("pwnOS [Version 2.0.0]");
        printToTerminal("(c) 2025 Pawan Joshi. All rights reserved.");
        printToTerminal("Type 'help' to see available commands.");
    };

    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const commandLine = terminalInput.value.trim();
                const [command, ...args] = commandLine.split(' ');
                printToTerminal(`<span class="prompt">pawan@desktop:~$</span> ${commandLine}`);

                if (command === 'open' && args[0]) {
                     const section = args[0].toLowerCase();
                     if (['about', 'projects', 'skills', 'education', 'terminal'].includes(section)) {
                         openWindow(section);
                     } else {
                         printToTerminal(`Error: Section '${args[0]}' not found.`);
                     }
                } else if (command in commands) {
                    const result = commands[command];
                    if (typeof result === 'function') {
                        result();
                    } else {
                        printToTerminal(result);
                    }
                } else if(command !== '') {
                    printToTerminal(`bash: command not found: ${command}`);
                }

                terminalInput.value = '';
            }
        });
        welcomeMessage();
    }
});