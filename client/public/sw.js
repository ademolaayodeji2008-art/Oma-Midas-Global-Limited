/**
 * Service Worker - Install-only PWA (No offline caching)
 * 
 * This service worker enables PWA installation on mobile devices
 * WITHOUT offline functionality to prevent data inconsistency issues.
 */

// Version of the service worker
const VERSION = '1.0.0';

// Install event - just log that SW is installed
self.addEventListener('install', (event) => {
  console.log(`[Service Worker ${VERSION}] Installing...`);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches if any
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker ${VERSION}] Activating...`);
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - Always go to network (NO caching/offline mode)
self.addEventListener('fetch', (event) => {
  // Just pass through to network - no caching
  // This ensures data is always fresh and prevents offline mode
  event.respondWith(fetch(event.request));
});

console.log(`[Service Worker ${VERSION}] Loaded (Install-only, no offline caching)`);
