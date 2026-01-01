/**
 * Smart Planner - PWA Offline Support
 * Service Worker registration and offline functionality
 */

// ============================================
// Service Worker Registration
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered: ', registration);
            })
            .catch(registrationError => {
                console.log('ServiceWorker registration failed: ', registrationError);
            });
    });
}

// ============================================
// Offline Detection
// ============================================

const OfflineManager = {
    init() {
        // Update online/offline status
        window.addEventListener('online', () => {
            this.showOfflineBanner(false);
        });
        
        window.addEventListener('offline', () => {
            this.showOfflineBanner(true);
        });
        
        // Initial check
        if (!navigator.onLine) {
            this.showOfflineBanner(true);
        }
    },

    showOfflineBanner(show) {
        let banner = document.getElementById('offlineBanner');
        
        if (show && !banner) {
            banner = document.createElement('div');
            banner.id = 'offlineBanner';
            banner.style.cssText = `
                position: fixed;
                top: 70px;
                left: 0;
                right: 0;
                background: rgba(255, 152, 0, 0.9);
                color: white;
                padding: 1rem;
                text-align: center;
                z-index: 1500;
                font-weight: 500;
            `;
            banner.textContent = '⚠️ You are currently offline. Your data is saved locally.';
            document.body.appendChild(banner);
        } else if (!show && banner) {
            banner.remove();
        }
    }
};

// Initialize offline manager
OfflineManager.init();
