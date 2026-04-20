/**
 * bookCache store
 *
 * Tracks offline cache status and download progress for book stream assets.
 *
 * Cache names must stay in sync with the Service Worker (public/sw.ts):
 *   • BOOK_STREAM_CACHE  = 'book-streams-v1'
 *
 * Architecture:
 *   • State lives in `cacheStatusMap` — a plain reactive Record<bookId, BookCacheEntry>.
 *   • `cachedBookIds` is a Set<number> persisted to localStorage under
 *     LS_CACHED_BOOK_IDS_KEY so fully-cached books are immediately available
 *     across page reloads before the async Cache Storage inspection completes.
 *   • `refreshCacheStatus` inspects the Cache Storage API to build the initial
 *     snapshot and re-sync at any time.
 *   • `markBookCached` / `unmarkBookCached` are first-class actions that update
 *     both the in-memory map and the localStorage persistence layer.
 *   • `isCached` is a synchronous predicate that reads from the in-memory map.
 *   • `cacheBook` sends a message to the service worker to initiate streaming and caching.
 *   • `clearCachedBook` sends a message to the service worker to remove the book stream entry.
 *   • `initSwListener` hooks into SW messages to keep the store in sync when
 *     the SW independently evict or caches entries.
 *   • `cacheBook` sends a message to the service worker to initiate streaming and caching.
 *   • `clearCachedBook` sends a message to the service worker to remove the book stream entry.
 *   • `initSwListener` hooks into SW messages to keep the store in sync when
 *     the SW independently evicts or caches entries.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BookCacheEntry, BookCacheStatus } from '~/domain/catalog/Catalog.types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants — keep in sync with public/sw.ts
// ─────────────────────────────────────────────────────────────────────────────
export const BOOK_STREAM_CACHE = 'book-streams-v1'

/**
 * localStorage key under which the set of fully-cached book IDs is persisted.
 * Storing this lets the UI reflect offline-ready state synchronously on mount,
 * before the async Cache Storage inspection in `refreshCacheStatus` resolves.
 */
export const LS_CACHED_BOOK_IDS_KEY = 'librarian:cachedBookIds'

/** Build the stream URL for a given book ID (matches the SW route pattern). */
export function bookStreamUrl(bookId: number | string): string {
  return `/api/assets/books/${bookId}/stream`
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Read the persisted cached-book ID set from localStorage, or return empty. */
function _lsRead(): Set<number> {
  if (typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(LS_CACHED_BOOK_IDS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map(Number).filter((n) => !isNaN(n)))
  } catch {
    return new Set()
  }
}

/** Persist the cached-book ID set to localStorage. */
function _lsWrite(ids: Set<number>): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(LS_CACHED_BOOK_IDS_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // Quota exceeded or private browsing — silently ignore.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────
export const useBookCacheStore = defineStore('bookCache', () => {
  // ── 1. STATE ──────────────────────────────────────────────────────────────

  /**
   * Seed the in-memory map from localStorage so the UI can reflect cached
   * state synchronously before the async Cache Storage inspection resolves.
   */
  const _lsIds = _lsRead()
  const _initialMap: Record<number, BookCacheEntry> = {}
  for (const id of _lsIds) {
    _initialMap[id] = { status: 'cached', progress: 100 }
  }

  /** Map of bookId → BookCacheEntry. */
  const cacheStatusMap = ref<Record<number, BookCacheEntry>>(_initialMap)

  /** Whether the Cache Storage API is available in this environment. */
  const cacheApiAvailable = computed(
    () => typeof caches !== 'undefined' && typeof caches.open === 'function',
  )

  // ── 2. GETTERS ────────────────────────────────────────────────────────────

  function getEntry(bookId: number): BookCacheEntry {
    return cacheStatusMap.value[bookId] ?? { status: 'not-cached', progress: 0 }
  }

  function getStatus(bookId: number): BookCacheStatus {
    return getEntry(bookId).status
  }

  function getProgress(bookId: number): number {
    return getEntry(bookId).progress
  }

  // ── 3. INTERNAL HELPERS ───────────────────────────────────────────────────

  function _setEntry(bookId: number, entry: BookCacheEntry): void {
    cacheStatusMap.value = { ...cacheStatusMap.value, [bookId]: entry }
  }

  function _setStatus(bookId: number, status: BookCacheStatus, progress = 0, errorMessage: string | undefined = undefined): void {
    _setEntry(bookId, { status, progress, errorMessage })
    // Keep localStorage in sync for fully-cached and evicted books.
    if (status === 'cached' || status === 'not-cached' || errorMessage) {
      const ids = _lsRead()
      if (status === 'cached') {
        ids.add(bookId)
      } else {
        ids.delete(bookId)
      }
      _lsWrite(ids)
    }
  }

  // ── 4a. refreshCacheStatus ────────────────────────────────────────────────

  async function refreshCacheStatus(bookIds?: number[]): Promise<void> {
    if (!cacheApiAvailable.value) return

    try {
      const cache = await caches.open(BOOK_STREAM_CACHE)
      const cachedRequests = await cache.keys()

      const cachedIds = new Set<number>()
      for (const req of cachedRequests) {
        const match = /\/api\/assets\/books\/(\d+)\/stream/.exec(new URL(req.url).pathname)
        if (match) cachedIds.add(Number(match[1]))
      }

      const idsToCheck = bookIds ?? Array.from(cachedIds)

      for (const id of idsToCheck) {
        const current = cacheStatusMap.value[id]
        if (cachedIds.has(id)) {
          if (!current || current.status !== 'partial') _setStatus(id, 'cached', 100)
        } else {
          if (!current || current.status !== 'partial') _setStatus(id, 'not-cached', 0)
        }
      }

      if (!bookIds) {
        for (const id of cachedIds) {
          if (!(id in cacheStatusMap.value)) _setStatus(id, 'cached', 100)
        }
      }
    } catch (err) {
      console.warn('[bookCache] refreshCacheStatus failed:', err)
    }
  }

  // ── 4b. cacheBook ─────────────────────────────────────────────────────────

  /**
   * Download and cache the book stream for `bookId` offline.
   * Progress is reflected in `cacheStatusMap[bookId].progress` (0–100).
   *
   * Uses a TransformStream pipeline so that chunks are passed through and
   * written to Cache Storage incrementally — no full-body buffering occurs.
   *
   * @param bookId    - Numeric book ID.
   * @param fetchImpl - Injectable fetch (defaults to `globalThis.fetch`).
   *                    Accepts the same signature as the Web Fetch API.
   */
  async function cacheBook(
    bookId: number,
    fetchImpl: typeof globalThis.fetch = globalThis.fetch,
  ): Promise<void> {
    if (!cacheApiAvailable.value) {
      console.warn('[bookCache] Cache Storage API not available')
      return
    }

    // Prevent concurrent downloads for the same book.
    if (cacheStatusMap.value[bookId]?.status === 'partial') return

    _setStatus(bookId, 'partial', 0)

    const url = bookStreamUrl(bookId)

    try {
      const response = await fetchImpl(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const total = parseInt(response.headers.get('Content-Length') ?? '0', 10)
      let loaded = 0
      let lastBroadcastedProgress = -1

      // ── Streaming pipe via TransformStream — zero memory accumulation ───────
      //
      // Each chunk is enqueued straight through without being stored anywhere.
      // Only the integer-percentage cursor and the last-broadcast cursor are
      // held as local variables; the actual payload bytes are never buffered.
      const transformStream = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(chunk)

          loaded += chunk.byteLength
          if (total > 0) {
            const progress = Math.floor((loaded / total) * 100)
            // Throttle: only update state when the integer percentage has
            // increased by at least 1 point since the last broadcast.
            if (progress > lastBroadcastedProgress) {
              lastBroadcastedProgress = progress
              _setStatus(bookId, 'partial', Math.min(progress, 100))
            }
          }
        },
      })

      const cache = await caches.open(BOOK_STREAM_CACHE)

      if (!response.body) {
        // No body stream (e.g. empty response in test stubs) — cache directly.
        await cache.put(url, response)
        _setStatus(bookId, 'cached', 100)
        return
      }

      const stream = response.body.pipeThrough(transformStream)

      // Pass the live ReadableStream directly into the Response so Cache
      // Storage consumes it incrementally — do NOT await the full body first.
      const cacheableResponse = new Response(stream, {
        status: 200,
        statusText: 'OK',
        headers: response.headers,
      })

      // cache.put resolves only after the stream is fully consumed and
      // committed, so marking 'cached' after this await is always correct.
      await cache.put(url, cacheableResponse)
      _setStatus(bookId, 'cached', 100)
    } catch (err) {
      _setStatus(bookId, 'not-cached', 0)
      throw err
    }
  }

  // ── 4c. clearCachedBook ───────────────────────────────────────────────────

  /** Remove a book's stream from Cache Storage and reset its store entry. */
  async function clearCachedBook(bookId: number): Promise<void> {
    if (!cacheApiAvailable.value) return
    try {
      const cache = await caches.open(BOOK_STREAM_CACHE)
      await cache.delete(bookStreamUrl(bookId))
    } catch (err) {
      console.warn('[bookCache] clearCachedBook failed:', err)
    } finally {
      _setStatus(bookId, 'not-cached', 0)
    }
  }

  // ── 4d. markBookCached / unmarkBookCached / isCached ─────────────────────

  /**
   * Synchronously mark a book as fully cached in both the in-memory store and
   * the localStorage persistence layer.
   *
   * Intended for use by callers that manage Cache Storage directly (e.g. after
   * receiving a BOOK_CACHE_COMPLETE SW message) and need a first-class,
   * named action.
   */
  function markBookCached(bookId: number): void {
    _setStatus(bookId, 'cached', 100)
  }

  /**
   * Synchronously mark a book as no longer cached in both the in-memory store
   * and the localStorage persistence layer.
   *
   * Does NOT delete the entry from Cache Storage — call `clearCachedBook` for
   * that.  This action is useful for reflecting external evictions.
   */
  function unmarkBookCached(bookId: number): void {
    _setStatus(bookId, 'not-cached', 0)
  }

  /**
   * Synchronous predicate: returns `true` if the book is marked as fully
   * cached in the in-memory store.
   *
   * Uses the in-memory map rather than the Cache Storage API, so it is safe
   * to call in render/computed contexts.
   */
  function isCached(bookId: number): boolean {
    return getStatus(bookId) === 'cached'
  }

  // ── 4e. initSwListener ────────────────────────────────────────────────────

  /**
   * Wire up a `message` listener on the SW so the store stays in sync when
   * the SW independently evicts or caches entries.
   *
   * Expected message shapes:
   *   { type: 'BOOK_CACHE_EVICTED',  bookId: number }
   *   { type: 'BOOK_CACHE_PROGRESS', bookId: number, progress: number }
   *   { type: 'BOOK_CACHE_COMPLETE', bookId: number }
   *
   * Returns a cleanup function that removes the listener.
   */
  let _swListenerAttached = false

  function initSwListener(): () => void {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return () => {}
    if (_swListenerAttached) return () => {}

    const handler = (event: MessageEvent) => {
      const { data } = event
      if (!data || typeof data !== 'object') return
      switch (data.type) {
        case 'BOOK_CACHE_EVICTED': {
          const id = Number(data.bookId)
          if (!isNaN(id)) _setStatus(id, 'not-cached', 0)
          break
        }
        case 'BOOK_CACHE_PROGRESS': {
          const id = Number(data.bookId)
          const progress = Number(data.progress)
          if (!isNaN(id) && !isNaN(progress)) {
            _setStatus(id, 'partial', Math.min(Math.max(progress, 0), 100))
          }
          break
        }
        case 'BOOK_CACHE_COMPLETE': {
          const id = Number(data.bookId)
          if (!isNaN(id)) _setStatus(id, 'cached', 100)
          break
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handler)
    _swListenerAttached = true

    return () => {
      navigator.serviceWorker.removeEventListener('message', handler)
      _swListenerAttached = false
    }
  }

  // ── 5. RETURN ─────────────────────────────────────────────────────────────
  return {
    cacheStatusMap,
    cacheApiAvailable,
    getEntry,
    getStatus,
    getProgress,
    refreshCacheStatus,
    markBookCached,
    unmarkBookCached,
    isCached,
    cacheBook,
    clearCachedBook,
    initSwListener,
  }
})
