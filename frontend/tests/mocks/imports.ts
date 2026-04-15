import { ref } from 'vue'
import { vi } from 'vitest'

export const useState = (key: string, init?: () => any) => {
  return ref(init ? init() : null)
}

export const useFetch = (url: string, opts?: any) => {
  // Use global.fetch if available (for test expectations), otherwise mock it
  const p = (typeof global !== 'undefined' && global.fetch) 
    ? global.fetch(url, opts) 
    : Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      } as any)

  const result = {
    data: ref(null),
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
    execute: vi.fn(),
    // Forward the thenable to the original promise result
    then: (cb: any) => p.then(cb),
    catch: (cb: any) => p.catch(cb),
  }
  return result as any
}

export const useApiFetch = useFetch
export const $fetch = useFetch
export const useRouter = () => ({ push: vi.fn(), replace: vi.fn() })
export const useRoute = () => ({ params: {}, query: {} })
export const useCookie = (key: string) => ref(null)
export const defineNuxtComponent = (component: any) => component

