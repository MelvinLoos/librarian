/**
 * Unit tests for the bookCache Pinia store.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBookCacheStore, BOOK_STREAM_CACHE, LS_CACHED_BOOK_IDS_KEY, bookStreamUrl } from './bookCache'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeCacheMock() {
  const store = new Map<string, Response>()
  return {
    store,
    keys: vi.fn(async () =>
      Array.from(store.keys()).map((url) => new Request(url)),
    ),
    match: vi.fn(async (req: Request | string) => {
      const url = typeof req === 'string' ? req : req.url
      return store.get(url)
    }),
    put: vi.fn(async (req: Request | string, res: Response) => {
      const url = typeof req === 'string' ? req : req.url
      store.set(url, res)
    }),
    delete: vi.fn(async (req: Request | string) => {
      const url = typeof req === 'string' ? req : req.url
      return store.delete(url)
    }),
  }
}

function makeCachesMock(cacheMock: ReturnType<typeof makeCacheMock>) {
  return { open: vi.fn(async (_name: string) => cacheMock) }
}

function makeFetch(body: Uint8Array, status = 200) {
  return vi.fn(async (_url: string) => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(body); controller.close() },
    })
    return new Response(stream, {
      status,
      headers: { 'Content-Length': String(body.byteLength) },
    })
  })
}

function makeSwMock() {
  const listeners: Array<(e: MessageEvent) => void> = []
  return {
    listeners,
    mock: {
      addEventListener: vi.fn((_type: string, fn: any) => listeners.push(fn)),
      removeEventListener: vi.fn(),
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage stub
// ─────────────────────────────────────────────────────────────────────────────

function makeLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    store,
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value) }),
    removeItem: vi.fn((key: string) => { store.delete(key) }),
    clear: vi.fn(() => { store.clear() }),
  }
}

describe('bookCache store', () => {
  let cacheMock: ReturnType<typeof makeCacheMock>
  let cachesMock: ReturnType<typeof makeCachesMock>
  let lsMock: ReturnType<typeof makeLocalStorageMock>

  beforeEach(() => {
    setActivePinia(createPinia())
    cacheMock = makeCacheMock()
    cachesMock = makeCachesMock(cacheMock)
    vi.stubGlobal('caches', cachesMock)
    lsMock = makeLocalStorageMock()
    vi.stubGlobal('localStorage', lsMock)

    // Mock Service Worker controller
    const swMock = makeSwMock()
    vi.stubGlobal('navigator', {
      serviceWorker: {
        ...swMock.mock,
        controller: { postMessage: vi.fn() },
      }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('bookStreamUrl builds the correct path', () => {
    expect(bookStreamUrl(42)).toBe('/api/assets/books/42/stream')
    expect(bookStreamUrl('7')).toBe('/api/assets/books/7/stream')
  })

  it('starts with an empty cacheStatusMap', () => {
    expect(useBookCacheStore().cacheStatusMap).toEqual({})
  })

  it('getStatus returns not-cached for unknown books', () => {
    expect(useBookCacheStore().getStatus(99)).toBe('not-cached')
  })

  it('getProgress returns 0 for unknown books', () => {
    expect(useBookCacheStore().getProgress(99)).toBe(0)
  })

  it('getEntry returns the fallback for unknown books', () => {
    expect(useBookCacheStore().getEntry(99)).toEqual({ status: 'not-cached', progress: 0 })
  })

  // ── refreshCacheStatus ────────────────────────────────────────────────────

  it('marks books in the cache as cached', async () => {
    const store = useBookCacheStore()
    cacheMock.store.set(`http://localhost${bookStreamUrl(1)}`, new Response('data'))
    await store.refreshCacheStatus()
    expect(store.getStatus(1)).toBe('cached')
    expect(store.getProgress(1)).toBe(100)
  })

  it('marks books NOT in the cache as not-cached', async () => {
    const store = useBookCacheStore()
    store.cacheStatusMap[5] = { status: 'cached', progress: 100 }
    await store.refreshCacheStatus([5])
    expect(store.getStatus(5)).toBe('not-cached')
  })

  it('does not overwrite an active partial download', async () => {
    const store = useBookCacheStore()
    store.cacheStatusMap[3] = { status: 'partial', progress: 50 }
    await store.refreshCacheStatus([3])
    expect(store.getStatus(3)).toBe('partial')
    expect(store.getProgress(3)).toBe(50)
  })

  it('silently swallows Cache API errors', async () => {
    cachesMock.open.mockRejectedValueOnce(new Error('QuotaExceeded'))
    await expect(useBookCacheStore().refreshCacheStatus()).resolves.toBeUndefined()
  })

  // ── cacheBook ─────────────────────────────────────────────────────────────

  it('transitions to cached on success', async () => {
    const store = useBookCacheStore()
    await store.cacheBook(1, makeFetch(new Uint8Array([1, 2, 3])) as any)
    expect(store.getStatus(1)).toBe('cached')
    expect(store.getProgress(1)).toBe(100)
    expect(cacheMock.put).toHaveBeenCalledOnce()
  })

  it('resets to not-cached on fetch failure', async () => {
    const store = useBookCacheStore()
    const failFetch = vi.fn().mockRejectedValue(new Error('network error'))
    await expect(store.cacheBook(1, failFetch as any)).rejects.toThrow('network error')
    expect(store.getStatus(1)).toBe('not-cached')
  })

  it('resets to not-cached on non-OK HTTP status', async () => {
    const store = useBookCacheStore()
    const f = vi.fn(async () => new Response('Not Found', { status: 404 }))
    await expect(store.cacheBook(1, f as any)).rejects.toThrow('HTTP 404')
    expect(store.getStatus(1)).toBe('not-cached')
  })

  it('does not start a second download if already partial', async () => {
    const store = useBookCacheStore()
    store.cacheStatusMap[1] = { status: 'partial', progress: 30 }
    const fetchMock = makeFetch(new Uint8Array([1]))
    await store.cacheBook(1, fetchMock as any)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(store.getProgress(1)).toBe(30)
  })

  it('works when the response body has no ReadableStream', async () => {
    const store = useBookCacheStore()
    const f = vi.fn(async () => new Response(null, { status: 200 }))
    await store.cacheBook(1, f as any)
    expect(store.getStatus(1)).toBe('cached')
    expect(cacheMock.put).toHaveBeenCalledOnce()
  })

  it('returns early without throwing if Cache API is unavailable', async () => {
    vi.stubGlobal('caches', undefined)
    const store = useBookCacheStore()
    const fetchMock = makeFetch(new Uint8Array([1]))
    await expect(store.cacheBook(1, fetchMock as any)).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // ── clearCachedBook ───────────────────────────────────────────────────────

  it('removes the cache entry and resets state', async () => {
    const store = useBookCacheStore()
    cacheMock.store.set(`http://localhost${bookStreamUrl(2)}`, new Response('data'))
    store.cacheStatusMap[2] = { status: 'cached', progress: 100 }
    await store.clearCachedBook(2)
    expect(store.getStatus(2)).toBe('not-cached')
    expect(store.getProgress(2)).toBe(0)
    expect(cacheMock.delete).toHaveBeenCalledOnce()
  })

  it('still resets state even if cache.delete throws', async () => {
    const store = useBookCacheStore()
    store.cacheStatusMap[3] = { status: 'cached', progress: 100 }
    cacheMock.delete.mockRejectedValueOnce(new Error('disk error'))
    await store.clearCachedBook(3)
    expect(store.getStatus(3)).toBe('not-cached')
  })

  // ── initSwListener ────────────────────────────────────────────────────────

  it('processes BOOK_CACHE_EVICTED messages', () => {
    const store = useBookCacheStore()
    store.cacheStatusMap[5] = { status: 'cached', progress: 100 }
    const sw = (navigator.serviceWorker as any).listeners ? { mock: navigator.serviceWorker, listeners: (navigator.serviceWorker as any).listeners } : makeSwMock()
    if (!(navigator.serviceWorker as any).listeners) vi.stubGlobal('navigator', { serviceWorker: { ...sw.mock, controller: { postMessage: vi.fn() } } })
    store.initSwListener()
    sw.listeners[0](new MessageEvent('message', { data: { type: 'BOOK_CACHE_EVICTED', bookId: 5 } }))
    expect(store.getStatus(5)).toBe('not-cached')
  })

  it('processes BOOK_CACHE_PROGRESS messages', () => {
    const store = useBookCacheStore()
    const sw = (navigator.serviceWorker as any).listeners ? { mock: navigator.serviceWorker, listeners: (navigator.serviceWorker as any).listeners } : makeSwMock()
    if (!(navigator.serviceWorker as any).listeners) vi.stubGlobal('navigator', { serviceWorker: { ...sw.mock, controller: { postMessage: vi.fn() } } })
    store.initSwListener()
    sw.listeners[0](new MessageEvent('message', { data: { type: 'BOOK_CACHE_PROGRESS', bookId: 7, progress: 42 } }))
    expect(store.getStatus(7)).toBe('partial')
    expect(store.getProgress(7)).toBe(42)
  })

  it('processes BOOK_CACHE_COMPLETE messages', () => {
    const store = useBookCacheStore()
    const sw = (navigator.serviceWorker as any).listeners ? { mock: navigator.serviceWorker, listeners: (navigator.serviceWorker as any).listeners } : makeSwMock()
    if (!(navigator.serviceWorker as any).listeners) vi.stubGlobal('navigator', { serviceWorker: { ...sw.mock, controller: { postMessage: vi.fn() } } })
    store.initSwListener()
    sw.listeners[0](new MessageEvent('message', { data: { type: 'BOOK_CACHE_COMPLETE', bookId: 9 } }))
    expect(store.getStatus(9)).toBe('cached')
    expect(store.getProgress(9)).toBe(100)
  })

  it('clamps progress values to [0, 100]', () => {
    const store = useBookCacheStore()
    const sw = (navigator.serviceWorker as any).listeners ? { mock: navigator.serviceWorker, listeners: (navigator.serviceWorker as any).listeners } : makeSwMock()
    if (!(navigator.serviceWorker as any).listeners) vi.stubGlobal('navigator', { serviceWorker: { ...sw.mock, controller: { postMessage: vi.fn() } } })
    store.initSwListener()
    sw.listeners[0](new MessageEvent('message', { data: { type: 'BOOK_CACHE_PROGRESS', bookId: 1, progress: 150 } }))
    expect(store.getProgress(1)).toBe(100)
    sw.listeners[0](new MessageEvent('message', { data: { type: 'BOOK_CACHE_PROGRESS', bookId: 1, progress: -10 } }))
    expect(store.getProgress(1)).toBe(0)
  })

  it('ignores unknown message types without throwing', () => {
    const store = useBookCacheStore()
    const sw = (navigator.serviceWorker as any).listeners ? { mock: navigator.serviceWorker, listeners: (navigator.serviceWorker as any).listeners } : makeSwMock()
    if (!(navigator.serviceWorker as any).listeners) vi.stubGlobal('navigator', { serviceWorker: { ...sw.mock, controller: { postMessage: vi.fn() } } })
    store.initSwListener()
    expect(() =>
      sw.listeners[0](new MessageEvent('message', { data: { type: 'UNKNOWN', bookId: 1 } })),
    ).not.toThrow()
    expect(store.getStatus(1)).toBe('not-cached')
  })

  it('is a no-op when navigator.serviceWorker is absent', () => {
    vi.stubGlobal('navigator', {})
    expect(() => useBookCacheStore().initSwListener()).not.toThrow()
  })

  it('returns a cleanup function that removes the listener', () => {
    const store = useBookCacheStore()
    const sw = (navigator.serviceWorker as any).listeners ? { mock: navigator.serviceWorker, listeners: (navigator.serviceWorker as any).listeners } : makeSwMock()
    if (!(navigator.serviceWorker as any).listeners) vi.stubGlobal('navigator', { serviceWorker: { ...sw.mock, controller: { postMessage: vi.fn() } } })
    const cleanup = store.initSwListener()
    cleanup()
    expect(sw.mock.removeEventListener).toHaveBeenCalledOnce()
  })

  // ── cacheApiAvailable ─────────────────────────────────────────────────────

  it('is false when the caches global is absent', () => {
    vi.stubGlobal('caches', undefined)
    expect(useBookCacheStore().cacheApiAvailable).toBe(false)
  })

  it('is true when the caches global is present', () => {
    expect(useBookCacheStore().cacheApiAvailable).toBe(true)
  })

  // ── markBookCached / unmarkBookCached / isCached ──────────────────────────

  it('markBookCached sets status to cached and progress to 100', () => {
    const store = useBookCacheStore()
    store.markBookCached(10)
    expect(store.getStatus(10)).toBe('cached')
    expect(store.getProgress(10)).toBe(100)
  })

  it('unmarkBookCached sets status to not-cached and progress to 0', () => {
    const store = useBookCacheStore()
    store.markBookCached(10)
    store.unmarkBookCached(10)
    expect(store.getStatus(10)).toBe('not-cached')
    expect(store.getProgress(10)).toBe(0)
  })

  it('isCached returns true for a cached book', () => {
    const store = useBookCacheStore()
    store.markBookCached(10)
    expect(store.isCached(10)).toBe(true)
  })

  it('isCached returns false for an uncached book', () => {
    expect(useBookCacheStore().isCached(99)).toBe(false)
  })

  it('isCached returns false for a partial book', () => {
    const store = useBookCacheStore()
    store.cacheStatusMap[5] = { status: 'partial', progress: 50 }
    expect(store.isCached(5)).toBe(false)
  })

  // ── localStorage persistence ───────────────────────────────────────────────

  it('markBookCached persists the bookId to localStorage', () => {
    const store = useBookCacheStore()
    store.markBookCached(42)
    expect(lsMock.setItem).toHaveBeenCalledWith(
      LS_CACHED_BOOK_IDS_KEY,
      expect.stringContaining('42'),
    )
  })

  it('unmarkBookCached removes the bookId from localStorage', () => {
    const store = useBookCacheStore()
    store.markBookCached(42)
    store.unmarkBookCached(42)
    const lastCall = lsMock.setItem.mock.calls.at(-1)
    const written: number[] = JSON.parse(lastCall![1])
    expect(written).not.toContain(42)
  })

  it('cacheBook persists the bookId to localStorage on success', async () => {
    const store = useBookCacheStore()
    await store.cacheBook(11, makeFetch(new Uint8Array([1, 2])) as any)
    const lastCall = lsMock.setItem.mock.calls.at(-1)
    const written: number[] = JSON.parse(lastCall![1])
    expect(written).toContain(11)
  })

  it('clearCachedBook removes the bookId from localStorage', async () => {
    const store = useBookCacheStore()
    store.markBookCached(22)
    cacheMock.store.set(`http://localhost${bookStreamUrl(22)}`, new Response('data'))
    await store.clearCachedBook(22)
    const lastCall = lsMock.setItem.mock.calls.at(-1)
    const written: number[] = JSON.parse(lastCall![1])
    expect(written).not.toContain(22)
  })

  it('seeds cacheStatusMap from localStorage on store creation', () => {
    // Pre-seed localStorage before creating the store
    lsMock.store.set(LS_CACHED_BOOK_IDS_KEY, JSON.stringify([7, 13]))
    const store = useBookCacheStore()
    expect(store.getStatus(7)).toBe('cached')
    expect(store.getStatus(13)).toBe('cached')
    expect(store.getProgress(7)).toBe(100)
  })

  it('handles corrupt localStorage data gracefully', () => {
    lsMock.store.set(LS_CACHED_BOOK_IDS_KEY, '{not valid json')
    expect(() => useBookCacheStore()).not.toThrow()
    expect(useBookCacheStore().cacheStatusMap).toEqual({})
  })

  it('handles localStorage being unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(() => useBookCacheStore()).not.toThrow()
  })
})

