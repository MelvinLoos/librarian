import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

vi.mock('workbox-core', () => ({
  clientsClaim: vi.fn(),
}))

vi.mock('workbox-precaching', () => ({
  cleanupOutdatedCaches: vi.fn(),
  precacheAndRoute: vi.fn(),
}))

vi.mock('workbox-routing', () => ({
  registerRoute: vi.fn(),
}))

vi.mock('workbox-strategies', () => ({
  CacheFirst: vi.fn(),
  NetworkFirst: vi.fn(),
  StaleWhileRevalidate: vi.fn(),
}))

vi.mock('workbox-range-requests', () => ({
  RangeRequestsPlugin: vi.fn(),
}))

vi.mock('workbox-cacheable-response', () => ({
  CacheableResponsePlugin: vi.fn(),
}))

vi.mock('workbox-expiration', () => ({
  ExpirationPlugin: vi.fn(),
}))

// We need to trigger the evaluation of sw.ts to check what was passed to registerRoute for streams
describe('Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('self', {
      skipWaiting: vi.fn(),
      addEventListener: vi.fn(),
      __WB_MANIFEST: [],
      clients: {
        matchAll: vi.fn().mockResolvedValue([]),
      }
    })
  })

  it('prevents passive caching of streams using cacheWillUpdate plugin', async () => {
    // Dynamically import sw.ts to run its top-level code
    await import('./sw.ts')
    
    // Find the registerRoute call that handles stream caching
    const registerRouteCalls = vi.mocked(registerRoute).mock.calls
    const streamRouteCall = registerRouteCalls.find(call => {
      const matchFn = call[0] as any
      if (typeof matchFn === 'function') {
        const url = new URL('http://localhost/api/assets/books/123/stream')
        return matchFn({ url })
      }
      return false
    })

    expect(streamRouteCall).toBeDefined()
    
    // Check that CacheFirst was initialized with the cacheWillUpdate plugin
    const cacheFirstMock = vi.mocked(CacheFirst)
    
    // The stream route should use CacheFirst
    expect(streamRouteCall![1]).toBeInstanceOf(CacheFirst)
    
    // Look at the arguments passed to CacheFirst
    // Assuming the stream route is the first call to CacheFirst (or we find the right one)
    const strategyConfig = cacheFirstMock.mock.calls.find(call => call[0]?.cacheName === 'book-streams-v1')![0]
    
    const plugins = strategyConfig?.plugins || []
    
    // We expect to find a plugin with cacheWillUpdate that resolves to null
    const cacheWillUpdatePlugin = plugins.find((p: any) => typeof p.cacheWillUpdate === 'function')
    
    expect(cacheWillUpdatePlugin).toBeDefined()
    
    // Execute the cacheWillUpdate function
    const result = await cacheWillUpdatePlugin.cacheWillUpdate()
    expect(result).toBeNull() // It should return null to prevent passive caching
  })
})
