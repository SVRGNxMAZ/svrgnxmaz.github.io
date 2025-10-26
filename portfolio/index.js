// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Header background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.color = '#333';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.1)';
        header.style.color = 'white';
    }
});

// Add hover effects to project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// --- Server status check (image-based ping with timeout) ---
function checkServerStatus(url, el, timeout = 5000) {
    const dot = el.querySelector('.status-dot');
    const text = el.querySelector('.status-text');

    // Show checking state
    el.classList.remove('online', 'offline');
    text.textContent = 'Checking...';
    // orange = checking
    dot.style.background = '#f0ad4e';

    return new Promise((resolve) => {
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            el.classList.remove('online');
            el.classList.add('offline');
            text.textContent = 'Offline';
            // red = offline
            if (dot) dot.style.background = '#dc3545';
            resolve(false);
        }, timeout);

        // Use image ping (works around CORS for reachability)
        const img = new Image();
        // Append a cache-busting query param
        img.src = url.replace(/\/$/, '') + '/images/favicon.ico' + '?_=' + Date.now();

        img.onload = function() {
            if (timedOut) return;
            clearTimeout(timer);
            el.classList.remove('offline');
            el.classList.add('online');
            text.textContent = 'Online';
            // green = online
            if (dot) dot.style.background = '#28a745';
            resolve(true);
        };

        img.onerror = function() {
            if (timedOut) return;
            clearTimeout(timer);
            el.classList.remove('online');
            el.classList.add('offline');
            text.textContent = 'Offline';
            // red = offline
            if (dot) dot.style.background = '#dc3545';
            resolve(false);
        };
    });
}

// Initialize status checks for any .server-status elements with data-url
document.querySelectorAll('.server-status[data-url]').forEach(el => {
    const url = el.dataset.url;
    // Run once immediately
    checkServerStatus(url, el);
    // Re-check every 30 seconds
    setInterval(() => checkServerStatus(url, el), 30000);
});