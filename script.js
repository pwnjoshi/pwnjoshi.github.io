document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections and cards
    document.querySelectorAll('.section-card, .profile-sidebar, .header-content').forEach(el => {
        el.classList.add('fade-in-section');
        observer.observe(el);
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Close mobile menu if open
                const nav = document.querySelector('nav');
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    document.querySelector('.mobile-menu-btn').classList.remove('active');
                }

                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile Menu Toggle
    const createMobileMenu = () => {
        const headerContent = document.querySelector('.header-content');
        const nav = document.querySelector('nav');
        
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'mobile-menu-btn';
        mobileBtn.innerHTML = `
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
        `;
        
        // Insert button before nav
        headerContent.insertBefore(mobileBtn, nav);

        mobileBtn.addEventListener('click', () => {
            mobileBtn.classList.toggle('active');
            nav.classList.toggle('active');
        });
    };

    createMobileMenu();

    // Typing effect for bio
    const bioElement = document.querySelector('.profile-bio');
    if (bioElement) {
        const text = bioElement.innerText;
        bioElement.innerText = '';
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                bioElement.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 20); // Speed of typing
            }
        }
        
        // Start typing when bio comes into view
        const bioObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                typeWriter();
                bioObserver.disconnect();
            }
        });
        
        bioObserver.observe(bioElement.parentElement);
    }

    // Add hover effect to skill tags
    document.querySelectorAll('.skill-tag').forEach(tag => {
        tag.addEventListener('mouseover', () => {
            tag.style.transform = 'translateY(-2px) scale(1.05)';
            tag.style.transition = 'all 0.2s ease';
        });
        
        tag.addEventListener('mouseout', () => {
            tag.style.transform = 'translateY(0) scale(1)';
        });
    });
});
