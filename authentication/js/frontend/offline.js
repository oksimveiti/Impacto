if ('serviceWorker' in navigator) {
  // Wait for the page to load
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      console.log(`Service Worker Registered (Scope: ${registration.scope})`);
    } catch (error) {
      console.error('Service Worker Error:', error);
    }
  });
} else {
  console.warn('Service Worker is not supported by your browser.');
}