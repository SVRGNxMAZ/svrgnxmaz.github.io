// Wait for the page to load
window.addEventListener('load', function() {
    // After 1.5 seconds, fade out the loader
    setTimeout(function() {
        const loader = document.querySelector('.loader');
        const loaderContainer = document.querySelector('.loader-container'); // If using overlay
        
        // Apply fade-out effect
        loader.style.transition = 'opacity 0.5s ease';
        loader.style.opacity = '0';
        
        // If using overlay, fade it out too
        if (loaderContainer) {
            loaderContainer.style.opacity = '0';
        }
        
        // Remove elements after fade-out completes
        setTimeout(function() {
            loader.remove();
            if (loaderContainer) {
                loaderContainer.remove();
            }
            document.body.classList.remove('loading'); // Optional: re-enable scrolling
        }, 500); // Matches the transition duration
    }, 1000); // 1.5 seconds delay before fade-out
});