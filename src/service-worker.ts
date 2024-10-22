/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST || []);

registerRoute(
  ({ url }) => url.origin === 'https://your-api-endpoint.com', 
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
);

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || !response.ok) {
          return caches.match('/offline.html') as Promise<Response>; 
        }
        return response;
      })
      .catch(() => {
        return caches.match('/offline.html') as Promise<Response>; 
      })
  );
});
