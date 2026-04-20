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
 *   • `refreshCacheStatus` inspects the Cache Storage API to build the initial
 *     snapshot and re-sync at any time.
 *   • `cacheBook` streams the book via the Fetch API, reports progress through
 *     the store, and writes the completed response into Cache Storage directly
 *     so the Service Worker's CacheFirst route can serve it offline.
 *   • `clearCachedBook` removes the book stream entry from Cache Storage and
 *     resets the store entry to 'not-cached'.
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

/** Build the stream URL for a given book ID (matches the SW route pattern). */
export function bookStreamUrl(bookId: number | string): string {
  return `/api/assets/books/${bookId}/stream`
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────
export const useBookCacheStore = defineStore('bookCache', () => {
  // ── 1. STATE ──────────────────────────────────────────────────────────────

  /** Map of bookId → BookCacheEntry. */
  const cacheStatusMap = ref<Record<number, BookCacheEntry>>({})

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

  function _setStatus(bookId: number, status: BookCacheStatus, progress = 0): void {
    _setEntry(bookId, { status, progress })
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
   * @param bookId - Numeric book ID.
   * @param fetchImpl - Injectable fetch (defaults to `globalThis.fetch`).
   */
  async function cacheBook(
    bookId: number,
    fetchImpl: typeof fetch = globalThis.fetch,
  ): Promise<void> {
    if (!cacheApiAvailable.value) {
      console.warn('[bookCache] Cache Storage API not available')
      return
    }

    // Prevent concurrent downloads for the same book
    if (cacheStatusMap.value[bookId]?.status === 'partial') return

    _setStatus(bookId, 'partial', 0)

    const url = bookStreamUrl(bookId)

    try {
      const response = await fetchImpl(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`)
      }

      const total = parseInt(response.headers.get('Content-Length') ?? '0', 10)
      let loaded = 0
      const reader = response.body?.getReader()

      if (!reader) {
        const cache = await caches.open(BOOK_STREAM_CACHE)
        await cache.put(url, response)
        _setStatus(bookId, 'cached', 100)
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
          _setStatus(bookId, 'partial', Math.min(Math.round((loaded / total) * 100), 99))
        }
      }

      // Merge chunks into a single buffer
      const merged = new Uint8Array(chunks.reduce((acc, c) => acc + c.byteLength, 0))
      let offset = 0
      for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength }

      const cacheableResponse = new Response(merged, {
        status: 200, statusText: 'OK', headers: response.headers,
      })

      const cache = await caches.open(BOOK_STREAM_CACHE)
      await cache.put(url, cacheableResponse)
      _setStatus(bookId, 'cached', 100)
    } catch (err) {
      console.error('[bookCache] cacheBook failed:', err)
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

  // ── 4d. initSwListener ────────────────────────────────────────────────────

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
    cacheBook,
    clearCachedBook,
    initSwListener,
  }
})
