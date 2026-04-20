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
// Helpers: broadcast cache lifecycle events to all open clients so the Pinia
// bookCache store can stay in sync without polling.
// ──────────────────────────────────────────────────────────────────────────────

/** Extract the numeric bookId from a book-stream URL, or null if unmatched. */
function extractBookId(url: string): number | null {
  const match = /\/(?:api\/)?assets\/books\/(\d+)\/stream/.exec(new URL(url).pathname)
  return match ? Number(match[1]) : null
}

/** Broadcast a message to every controlled client. */
async function broadcastToClients(message: object): Promise<void> {
  const clients = await self.clients.matchAll({ includeUncontrolled: false, type: 'window' })
  for (const client of clients) {
    client.postMessage(message)
  }
}

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
      // The `deletedURLs` callback fires after each quota-triggered purge;
      // we broadcast BOOK_CACHE_EVICTED messages so the Pinia store reflects
      // the removal without the user having to refresh.
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

// ──────────────────────────────────────────────────────────────────────────────
// Client ↔ SW message channel
//
// Inbound  (client → SW): CACHE_BOOK { bookId }, EVICT_BOOK { bookId }
// Outbound (SW → clients): BOOK_CACHE_PROGRESS { bookId, progress },
//                           BOOK_CACHE_COMPLETE { bookId },
//                           BOOK_CACHE_EVICTED  { bookId },
//                           BOOK_CACHE_ERROR    { bookId, error }
// ──────────────────────────────────────────────────────────────────────────────
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event
  if (!data || typeof data !== 'object') return
  if (data.type === 'CACHE_BOOK') {
    const bookId = Number(data.bookId)
    if (!isNaN(bookId)) event.waitUntil(swCacheBook(bookId))
  }
  if (data.type === 'EVICT_BOOK') {
    const bookId = Number(data.bookId)
    if (!isNaN(bookId)) event.waitUntil(swEvictBook(bookId))
  }
})

async function swCacheBook(bookId: number): Promise<void> {
  const url = `/api/assets/books/${bookId}/stream`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const total = parseInt(response.headers.get('Content-Length') ?? '0', 10)
    let loaded = 0
    const reader = response.body?.getReader()
    if (!reader) {
      const cache = await caches.open(BOOK_STREAM_CACHE)
      await cache.put(url, response)
      await broadcastToClients({ type: 'BOOK_CACHE_COMPLETE', bookId })
      return
    }
    const chunks: Uint8Array[] = []
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.byteLength
      if (total > 0) {
        const progress = Math.min(Math.round((loaded / total) * 100), 99)
        await broadcastToClients({ type: 'BOOK_CACHE_PROGRESS', bookId, progress })
      }
    }
    const merged = new Uint8Array(chunks.reduce((acc, c) => acc + c.byteLength, 0))
    let offset = 0
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }
    const cacheableResponse = new Response(merged, {
      status: 200, statusText: 'OK', headers: response.headers,
    })
    const cache = await caches.open(BOOK_STREAM_CACHE)
    await cache.put(url, cacheableResponse)
    await broadcastToClients({ type: 'BOOK_CACHE_COMPLETE', bookId })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await broadcastToClients({ type: 'BOOK_CACHE_ERROR', bookId, error })
  }
}

async function swEvictBook(bookId: number): Promise<void> {
  const url = `/api/assets/books/${bookId}/stream`
  try {
    const cache = await caches.open(BOOK_STREAM_CACHE)
    await cache.delete(url)
  } finally {
    await broadcastToClients({ type: 'BOOK_CACHE_EVICTED', bookId })
  }
}
