import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Cache names
const APP_SHELL_CACHE = 'app-shell-v1';
const STATIC_CACHE = 'static-resources-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const FONT_CACHE = 'font-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';

// Precache all build assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// App Shell - Cache First Strategy (instant offline loading)
// This caches the core app shell for instant loading
const appShellHandler = new CacheFirst({
  cacheName: APP_SHELL_CACHE,
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    }),
  ],
});

// Register App Shell route - pages load instantly from cache
registerRoute(
  ({ request, url }) => {
    return (
      request.mode === 'navigate' &&
      !url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/_next/data/')
    );
  },
  new NetworkFirst({
    cacheName: APP_SHELL_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
    networkTimeoutSeconds: 3, // Fall back to cache after 3s
  })
);

// Static Resources - Cache First (CSS, JS, etc.)
registerRoute(
  ({ request }) => {
    return (
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'worker'
    );
  },
  new CacheFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Fonts - Cache First with long expiration
registerRoute(
  ({ request, url }) => {
    return (
      request.destination === 'font' ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.ttf')
    );
  },
  new CacheFirst({
    cacheName: FONT_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// Images - Stale While Revalidate
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: IMAGE_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// API calls - Network First with fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),

  new NetworkFirst({
    cacheName: RUNTIME_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Skip waiting on install
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing...');
  self.skipWaiting();
});

// Claim clients on activate
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== APP_SHELL_CACHE &&
              name !== STATIC_CACHE &&
              name !== RUNTIME_CACHE &&
              name !== FONT_CACHE &&
              name !== IMAGE_CACHE &&
              !name.includes('workbox') // Keep workbox caches
            );
          })
          .map((name) => caches.delete(name))
      );
      
      // Take control of all pages
      await self.clients.claim();
    })()
  );
});

// Offline fallback page
const FALLBACK_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmartLifeOS - Offline</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
    }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>No internet connection detected. Some features may be limited.</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>
`;

// Cache offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.put('/offline', new Response(FALLBACK_HTML, {
        headers: { 'Content-Type': 'text/html' },
      }));
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'SmartLifeOS';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/favicon.jpeg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/notifications';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window open
        for (const client of clients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      (async () => {
        console.log('🔄 Background sync triggered');
        // Implement your sync logic here
      })()
    );
  }
});

console.log('✨ Service Worker: Offline-first strategy loaded');
