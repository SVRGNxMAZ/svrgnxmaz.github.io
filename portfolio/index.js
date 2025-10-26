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
    // Try fetch with cors first (if /health endpoint supports CORS), then fallback to image ping
    function fetchWithCors(targetUrl, t = timeout) {
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

                fetch(fetchUrl, { method: 'GET', mode: 'cors', signal: controller.signal })
                    .then(response => {
                        clearTimeout(timer);
                        // Only accept HTTP 200 as online, anything else (including 502, 500, etc.) is offline
                        console.debug('ServerStatus: fetch response status ->', response.status);
                        resolve(response.status === 200);
                    })
                    .catch((err) => {
                        clearTimeout(timer);
                        console.debug('ServerStatus: fetch error ->', err.message);
                        resolve(false);
                    });
            } catch (e) {
                console.debug('ServerStatus: fetch exception ->', e.message);
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
                    + 'images/favicon.ico?_=' + Date.now();
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
            // 1) attempt fetch with CORS to target origin (/health)
            console.debug('ServerStatus: trying fetch with CORS ->', url);
            const fetchOk = await fetchWithCors(url, timeout);
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

// Try reading status.json written by GitHub Actions (same-origin)
// Note: status.json handling removed — using client-side ping only.

// Initialize status checks for any .server-status elements with data-url
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.server-status[data-url]').forEach(el => {
        const url = el.dataset.url;

    // keep markup minimal (status-dot/status-text/button)

        // create a manual check button so users can trigger ping on static deployments
        let btn = el.querySelector('.status-check-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'status-check-btn';
            btn.type = 'button';
            btn.textContent = 'Check Now';
            btn.style.marginLeft = '8px';
            btn.style.padding = '6px 10px';
            btn.style.fontSize = '0.85rem';
            btn.style.borderRadius = '8px';
            btn.style.border = 'none';
            btn.style.background = '#1976d2';
            btn.style.color = '#fff';
            btn.style.cursor = 'pointer';
            el.appendChild(btn);
        }

        btn.addEventListener('click', async () => {
            try {
                btn.disabled = true;
                const prev = btn.textContent;
                btn.textContent = 'Checking...';
                await checkServerStatus(url, el);
                btn.textContent = prev;
            } catch (e) {
                console.error('ServerStatus manual check error', e);
            } finally {
                btn.disabled = false;
            }
        });

        // no extra debug UI created; keep markup minimal (status-dot/status-text/button)

        // Run one client-side check immediately (no status.json fallback)
        (async () => {
            try {
                await checkServerStatus(url, el);
            } catch (e) {
                console.error('ServerStatus initial check error', e);
            }
        })();
    });
});