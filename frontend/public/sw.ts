/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'
import { RangeRequestsPlugin } from 'workbox-range-requests'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// Take control of all clients immediately on activation
self.skipWaiting()
clientsClaim()

// ──────────────────────────────────────────────────────────────────────────────
// Precache: all statically-generated assets injected by vite-plugin-pwa at
// build time.  The `self.__WB_MANIFEST` placeholder is replaced by the Workbox
// CLI / injectManifest step with the real asset list.
// ──────────────────────────────────────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ──────────────────────────────────────────────────────────────────────────────
// Book-stream cache
//
// Strategy: CacheFirst with a one-off network fallback.
//
// Why CacheFirst?
//   Once a book has been fully fetched (either as an EPUB ArrayBuffer or the
//   first full PDF load) the response is stored under the cache name
//   "book-streams".  On subsequent visits – including offline reads – the
//   cached full response is returned directly without hitting the network.
//
// Range-request handling (HTTP 206 Partial Content):
//   PDF viewers (and some browser engines) issue byte-range requests for large
//   files.  Because the complete response is already stored in the cache,
//   RangeRequestsPlugin intercepts the `Range: bytes=X-Y` header on the
//   *incoming* request, slices the correct byte range out of the cached
//   response body, and synthesises a proper HTTP 206 reply.  The origin server
//   is never contacted again for those partial fetches.
//
// Caching rules:
//   • Only HTTP 200 OK responses are stored (CacheableResponsePlugin).
//     A 206 response arriving from the network would be an incomplete body and
//     must NOT be persisted, otherwise the range-slice logic would produce
//     corrupt output.
//   • Books are large files; the cache is limited to 20 entries and 7 days to
//     prevent unbounded storage growth (ExpirationPlugin).
//
// URL pattern:
//   Matches the proxied Nuxt route  /api/assets/books/<id>/stream
//   (and the direct backend path    /assets/books/<id>/stream just in case the
//    service worker scope ever widens).
// ──────────────────────────────────────────────────────────────────────────────
const BOOK_STREAM_CACHE = 'book-streams-v1'

registerRoute(
  ({ url }) =>
    /\/api\/assets\/books\/\d+\/stream/.test(url.pathname) ||
    /\/assets\/books\/\d+\/stream/.test(url.pathname),
  new CacheFirst({
    cacheName: BOOK_STREAM_CACHE,
    plugins: [
      // Only cache full (200 OK) network responses.
      // A 206 Partial Content from the origin would be an incomplete body;
      // storing it would break offline range-request reconstruction.
      new CacheableResponsePlugin({ statuses: [200] }),

      // When a request with a Range header is served from cache, this plugin
      // slices the correct byte range from the complete cached body and returns
      // a synthetic HTTP 206 response so the browser's media / PDF engine
      // receives exactly what it asked for.
      new RangeRequestsPlugin(),

      // Evict stale entries so the cache does not grow without bound.
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

// ──────────────────────────────────────────────────────────────────────────────
// Cover images — NetworkFirst so fresh covers load online, fall back to cache.
// ──────────────────────────────────────────────────────────────────────────────
registerRoute(
  ({ url }) => /\/api\/assets\/books\/\d+\/cover/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'book-covers-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  }),
)
