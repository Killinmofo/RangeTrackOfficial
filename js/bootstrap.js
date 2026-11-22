'use strict';
// Cache the full application shell for use without a network connection.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(error => {
      console.warn('RangeTrack offline cache setup failed:', error);
    });
  });
}
