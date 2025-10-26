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
    // Try fetch with no-cors first (good if /health exists or origin allows it), then fallback to image ping
    function fetchNoCors(targetUrl, t = timeout) {
        return new Promise((resolve) => {
            if (!window.fetch || !window.AbortController) return resolve(false);
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => {
                    controller.abort();
                    resolve(false);
                }, t);

                // If caller passed a full url (like https://...), use it; otherwise build from url
                let fetchUrl = targetUrl;
                // Prefer /health on target origin if given just origin
                if (/^https?:\/\//i.test(targetUrl)) {
                    // try /health on the origin
                    fetchUrl = targetUrl.replace(/\/$/, '') + '/health';
                }

                fetch(fetchUrl, { method: 'GET', mode: 'no-cors', signal: controller.signal })
                    .then(() => {
                        clearTimeout(timer);
                        resolve(true);
                    })
                    .catch(() => {
                        clearTimeout(timer);
                        resolve(false);
                    });
            } catch (e) {
                resolve(false);
            }
        });
    }

    function imagePing(targetUrl, t = timeout) {
        return new Promise((resolve) => {
            let timedOut = false;
            const timer = setTimeout(() => {
                timedOut = true;
                resolve(false);
            }, t);

            try {
                const img = new Image();
                const pingUrl = (/^https?:\/\//i.test(targetUrl)
                    ? targetUrl.replace(/\/$/, '')
                    : window.location.origin.replace(/\/$/, '') + '/' + targetUrl.replace(/^\//, ''))
                    + '/images/TravelBuddyLogo.png?_=' + Date.now();
                img.src = pingUrl;
                img.onload = function () {
                    if (timedOut) return;
                    clearTimeout(timer);
                    resolve(true);
                };
                img.onerror = function () {
                    if (timedOut) return;
                    clearTimeout(timer);
                    resolve(false);
                };
            } catch (e) {
                clearTimeout(timer);
                resolve(false);
            }
        });
    }

    return new Promise(async (resolve) => {
        try {
            // 1) attempt fetch/no-cors to target origin (/health)
            console.debug('ServerStatus: trying fetch/no-cors ->', url);
            const fetchOk = await fetchNoCors(url, timeout);
            if (fetchOk) {
                el.classList.remove('offline');
                el.classList.add('online');
                text.textContent = 'Online';
                if (dot) dot.style.background = '#28a745';
                console.debug('ServerStatus: fetch succeeded -> online');
                return resolve(true);
            }

            // 2) fallback to image ping
            console.debug('ServerStatus: fetch failed, trying image ping ->', url);
            const imgOk = await imagePing(url, timeout);
            if (imgOk) {
                el.classList.remove('offline');
                el.classList.add('online');
                text.textContent = 'Online';
                if (dot) dot.style.background = '#28a745';
                console.debug('ServerStatus: image ping succeeded -> online');
                return resolve(true);
            }

            // neither worked -> offline
            el.classList.remove('online');
            el.classList.add('offline');
            text.textContent = 'Offline';
            if (dot) dot.style.background = '#dc3545';
            console.debug('ServerStatus: both checks failed -> offline');
            return resolve(false);
        } catch (err) {
            console.error('ServerStatus: unexpected error', err);
            el.classList.remove('online');
            el.classList.add('offline');
            text.textContent = 'Offline';
            if (dot) dot.style.background = '#dc3545';
            return resolve(false);
        }
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