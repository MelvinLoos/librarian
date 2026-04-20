/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
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
        deletedURLs: async (urls: string[]) => {
          for (const url of urls) {
            const bookId = extractBookId(url)
            if (bookId !== null) {
              await broadcastToClients({ type: 'BOOK_CACHE_EVICTED', bookId })
            }
          }
        },
      }),
    ],
  }),
)

// ──────────────────────────────────────────────────────────────────────────────
// Cover images — NetworkFirst so fresh covers load online, fall back to cache.
// Covers are relatively small (<50 KB each) and stale-on-refresh is acceptable.
//
// Matches:
//   /api/assets/books/<id>/cover  — primary route used by the frontend
//   /api/assets/covers/<id>       — alternate route alias
//   /assets/…                     — direct backend paths (wider SW scope)
// ──────────────────────────────────────────────────────────────────────────────
registerRoute(
  ({ url }) =>
    /\/api\/assets\/(?:books\/\d+\/cover|covers\/\d+)/.test(url.pathname) ||
    /\/assets\/(?:books\/\d+\/cover|covers\/\d+)/.test(url.pathname),
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
// Book metadata JSON — StaleWhileRevalidate so the UI renders instantly from
// cache while fresh data is fetched in the background.
//
// Matches:
//   /api/books         — catalogue listing (with or without query params)
//   /api/books/<id>    — single-book detail
//
// Only HTTP 200 responses are cached; error pages are never persisted.
// Entries expire after 7 days and are capped at 500 to bound storage.
// ──────────────────────────────────────────────────────────────────────────────
registerRoute(
  ({ url }) => /^\/api\/books(?:\/\d+)?$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'book-metadata-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
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
    let lastBroadcastedProgress = -1

    // ── Streaming pipe via TransformStream — zero memory accumulation ─────────
    //
    // Each chunk is passed straight through (controller.enqueue) without being
    // stored anywhere.  Only the integer-percentage counter and the last-
    // broadcast cursor are kept in local variables; the payload bytes are never
    // buffered.
    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk)

        loaded += chunk.byteLength
        if (total > 0) {
          const progress = Math.floor((loaded / total) * 100)
          // Throttle: only broadcast when the integer percentage has increased
          // by at least 1 point since the last broadcast.
          if (progress > lastBroadcastedProgress) {
            lastBroadcastedProgress = progress
            // Fire-and-forget — intentionally not awaited inside the
            // synchronous transform callback.
            broadcastToClients({ type: 'BOOK_CACHE_PROGRESS', bookId, progress })
          }
        }
      },
    })

    // Pipe the response body through the transform.  When response.body is
    // null (e.g. a HEAD response or test stub) fall back to caching the
    // original response directly so the no-body path is still covered.
    if (!response.body) {
      const cache = await caches.open(BOOK_STREAM_CACHE)
      await cache.put(url, response)
      await broadcastToClients({ type: 'BOOK_CACHE_COMPLETE', bookId })
      return
    }

    const stream = response.body.pipeThrough(transformStream)

    // Construct the cacheable response from the *streaming* readable — do NOT
    // await the full body before calling cache.put.  The Cache Storage API
    // accepts a Response backed by a live ReadableStream and will consume it
    // incrementally, which is the whole point of this zero-copy approach.
    const cacheableResponse = new Response(stream, {
      status: 200,
      statusText: 'OK',
      headers: response.headers,
    })

    const cache = await caches.open(BOOK_STREAM_CACHE)

    // cache.put itself returns a promise that resolves once the stream has
    // been fully consumed and committed to cache storage.  Awaiting it here
    // means BOOK_CACHE_COMPLETE is only sent after the data is safely stored.
    await cache.put(url, cacheableResponse)
    await broadcastToClients({ type: 'BOOK_CACHE_COMPLETE', bookId })

    // ── Side-cache: book metadata ─────────────────────────────────────────────
    //
    // Explicitly populate 'book-metadata-v1' so the Downloads page can render
    // book titles offline without depending solely on the StaleWhileRevalidate
    // route handler having been triggered before the device went offline.
    try {
      const metadataResponse = await fetch(`/api/books/${bookId}`)
      if (metadataResponse.ok) {
        const metadataCache = await caches.open('book-metadata-v1')
        await metadataCache.put(`/api/books/${bookId}`, metadataResponse)
      }
    } catch (metaErr) {
      console.warn(`[SW] swCacheBook: failed to cache metadata for book ${bookId}`, metaErr)
    }

    // ── Side-cache: cover image ───────────────────────────────────────────────
    //
    // Explicitly populate 'book-covers-v1' so cover thumbnails render offline
    // on the Downloads page.
    try {
      const coverResponse = await fetch(`/api/assets/covers/${bookId}`)
      if (coverResponse.ok) {
        const coversCache = await caches.open('book-covers-v1')
        await coversCache.put(`/api/assets/covers/${bookId}`, coverResponse)
      }
    } catch (coverErr) {
      console.warn(`[SW] swCacheBook: failed to cache cover for book ${bookId}`, coverErr)
    }
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
