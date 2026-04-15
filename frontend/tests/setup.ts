import { vi } from 'vitest'
import * as vue from 'vue'

// Set up globals for Vue core (Nuxt auto-imports these)
vi.stubGlobal('ref', vue.ref)
vi.stubGlobal('computed', vue.computed)
vi.stubGlobal('watch', vue.watch)
vi.stubGlobal('onMounted', vue.onMounted)
vi.stubGlobal('onUnmounted', vue.onUnmounted)
vi.stubGlobal('reactive', vue.reactive)
vi.stubGlobal('nextTick', vue.nextTick)

// Avoid using variables from outside the factory because of hoisting
vi.mock('#imports', () => {
  const { ref } = require('vue')
  return {
    useState: (key: string, init?: () => any) => ref(init ? init() : null),
    useFetch: (url: string, opts?: any) => {
      const p = (typeof global !== 'undefined' && global.fetch) 
        ? global.fetch(url, opts) 
        : Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(''),
          })
      return {
        data: ref(null),
        pending: ref(false),
        error: ref(null),
        refresh: () => {},
        execute: () => {},
        then: (cb: any) => p.then(cb),
        catch: (cb: any) => p.catch(cb),
      }
    },
    useApiFetch: (url: string, opts?: any) => {
      const p = (typeof global !== 'undefined' && global.fetch) 
        ? global.fetch(url, opts) 
        : Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(''),
          })
      return {
        data: ref(null),
        pending: ref(false),
        error: ref(null),
        then: (cb: any) => p.then(cb),
        catch: (cb: any) => p.catch(cb),
      }
    },
    useRouter: () => ({ push: () => {}, replace: () => {} }),
    useRoute: () => ({ params: {}, query: {} }),
    useCookie: (key: string) => ref(null),
    defineNuxtComponent: (c: any) => c,
    useAuthStore: () => ({
      isAuthenticated: true,
      token: 'test-token',
      user: { email: 'test@example.com', role: 'ADMIN' },
      login: () => {},
      logout: () => {},
    }),
  }
})

vi.mock('~/composables/useApiFetch', () => {
  const { ref } = require('vue')
  return {
    useApiFetch: (url: string, opts?: any) => {
      const p = (typeof global !== 'undefined' && global.fetch) 
        ? global.fetch(url, opts) 
        : Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(''),
          })
      return {
        data: ref(null),
        pending: ref(false),
        error: ref(null),
        then: (cb: any) => p.then(cb),
        catch: (cb: any) => p.catch(cb),
      }
    }
  }
})

// Mock NuxtLink globally
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $router: { push: () => {} },
  }),
}))

// Set up globals
vi.stubGlobal('useState', (key: string, init?: () => any) => vue.ref(init ? init() : null))
vi.stubGlobal('useFetch', (url: string, opts?: any) => {
  const p = (typeof global !== 'undefined' && global.fetch) 
    ? global.fetch(url, opts) 
    : Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  return { 
    data: vue.ref(null), 
    pending: vue.ref(false), 
    error: vue.ref(null),
    then: (cb: any) => p.then(cb)
  }
})
vi.stubGlobal('useApiFetch', (url: string, opts?: any) => {
  const p = (typeof global !== 'undefined' && global.fetch) 
    ? global.fetch(url, opts) 
    : Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  return { 
    data: vue.ref(null), 
    pending: vue.ref(false), 
    error: vue.ref(null),
    then: (cb: any) => p.then(cb)
  }
})
vi.stubGlobal('useAuthStore', () => ({
  isAuthenticated: true,
  user: { email: 'test@example.com', role: 'ADMIN' },
  logout: vi.fn(),
}))


