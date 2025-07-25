document.addEventListener('DOMContentLoaded', () => {
    // --- Window Management ---
    const windows = document.querySelectorAll('.window');
    const icons = {
        aboutIcon: document.getElementById('aboutWindow'),
        projectsIcon: document.getElementById('projectsWindow'),
        skillsIcon: document.getElementById('skillsWindow'),
        eduIcon: document.getElementById('eduWindow'),
        terminalIcon: document.getElementById('terminalWindow')
    };
    let activeWindow = null;
    let zIndexCounter = 10;

    const openWindow = (windowEl) => {
        windowEl.style.display = 'flex';
        windowEl.style.zIndex = ++zIndexCounter;
        activeWindow = windowEl;
    };

    Object.keys(icons).forEach(iconId => {
        const icon = document.getElementById(iconId);
        const windowEl = icons[iconId];
        if (icon && windowEl) {
            icon.addEventListener('dblclick', () => openWindow(windowEl));
            icon.addEventListener('click', (e) => { // For mobile tap
                if (e.detail === 1) { // Check for single tap
                   const isMobile = window.innerWidth <= 768;
                   if (isMobile) {
                       openWindow(windowEl);
                   }
                }
            });
        }
    });

    windows.forEach(windowEl => {
        const closeBtn = windowEl.querySelector('.close-btn');
        const titleBar = windowEl.querySelector('.title-bar');

        closeBtn.addEventListener('click', () => {
            windowEl.style.display = 'none';
        });

        // --- Dragging Logic ---
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        titleBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            offset.x = e.clientX - windowEl.offsetLeft;
            offset.y = e.clientY - windowEl.offsetTop;
            windowEl.style.zIndex = ++zIndexCounter;
            activeWindow = windowEl;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            windowEl.style.left = `${e.clientX - offset.x}px`;
            windowEl.style.top = `${e.clientY - offset.y}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Bring window to front on click
        windowEl.addEventListener('mousedown', () => {
            windowEl.style.zIndex = ++zIndexCounter;
            activeWindow = windowEl;
        });
    });

    // --- Clock ---
    const clock = document.getElementById('clock');
    const updateClock = () => {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        clock.textContent = time;
    };
    setInterval(updateClock, 1000);
    updateClock();

    // --- Terminal Logic ---
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalWindow = document.getElementById('terminalWindow');

    terminalWindow.addEventListener('click', () => terminalInput.focus());

    const commands = {
        help: `Available commands:<br>
               - <b>help</b>: Show this list<br>
               - <b>about</b>: Display info about me<br>
               - <b>projects</b>: Show my projects<br>
               - <b>skills</b>: List my technical skills<br>
               - <b>contact</b>: Show contact details<br>
               - <b>open [section]</b>: Open a window (e.g., 'open projects')<br>
               - <b>clear</b>: Clear the terminal screen<br>
               - <b>neofetch</b>: Display system summary`,
        about: "I’m Pawan, a driven Computer Science undergraduate at Graphic Era University with a deep passion for building impactful tech solutions.",
        projects: "<b>Zenari (AI Wellness App)</b> - Built in 48 hours for Graph-E-Thon 2025. Features AI chat, mood tracking, journaling, and more.",
        skills: "<b>Tech Stack:</b> React Native, Python, JS, HTML/CSS, Firebase, Full-Stack Dev.<br><b>Other:</b> AI/ML, Public Speaking, Leadership, Music.",
        contact: `Website: <a href="https://iampawan.me" target="_blank">iampawan.me</a><br>LinkedIn: <a href="https://linkedin.com/in/pwnjoshi" target="_blank">linkedin.com/in/pwnjoshi</a>`,
        neofetch: `
<pre>
    ./o.    <b>pawan@desktop</b>
   ./sssso.   -----------
  .osssssso.  <b>OS:</b> PawanOS v1.0
 .ossssssso.  <b>Host:</b> Human
.osssssssso.  <b>Kernel:</b> Coffee-Fueled
osssssssssso  <b>Uptime:</b> 20 years
osssssssssso  <b>Shell:</b> B.Tech CS
osssssssssso  <b>Resolution:</b> 1080p
.osssssssso.  <b>Interests:</b> Full-Stack, AI/ML
 .ossssssso.  <b>Now Playing:</b> Guitar Riffs
  .osssssso.
   ./sssso.
    ./o.
</pre>
        `,
        clear: () => {
            terminalOutput.innerHTML = '';
            return true;
        }
    };

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const commandLine = terminalInput.value.trim();
            const [command, ...args] = commandLine.split(' ');
            const outputLine = document.createElement('p');
            outputLine.innerHTML = `<span class="prompt">pawan@desktop:~$</span> ${commandLine}`;
            terminalOutput.appendChild(outputLine);

            if (command in commands) {
                const result = commands[command];
                const resultLine = document.createElement('p');
                if (typeof result === 'function') {
                    result();
                } else {
                    resultLine.innerHTML = result;
                    terminalOutput.appendChild(resultLine);
                }
            } else if (command === 'open' && args[0]) {
                 const section = args[0].toLowerCase();
                 const iconEl = document.getElementById(`${section}Icon`);
                 if(iconEl) {
                     openWindow(icons[`${section}Icon`]);
                 } else {
                     const errorLine = document.createElement('p');
                     errorLine.textContent = `Error: Section '${args[0]}' not found.`;
                     terminalOutput.appendChild(errorLine);
                 }
            } else if(command !== '') {
                const errorLine = document.createElement('p');
                errorLine.textContent = `bash: command not found: ${command}`;
                terminalOutput.appendChild(errorLine);
            }
            
            terminalInput.value = '';
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    });
});