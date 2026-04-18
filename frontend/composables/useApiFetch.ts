import { useAuthStore } from '~/stores/auth'
import { useApiBase } from '~/composables/useApiBase'

export const useApiFetch: typeof useFetch = (request, opts?) => {
  const authStore = useAuthStore()

  return useFetch(request, {
    ...opts,
    onRequest({ options }) {
      const apiBase = useApiBase()
      options.baseURL = '/api/'

      // Create headers object if it doesn't exist
      options.headers = options.headers || {}

      // If we have a token, inject it into the headers
      if (authStore.token) {
        // @ts-ignore - TS sometimes complains about Headers init, but this works perfectly in Nuxt
        options.headers.set('Authorization', `Bearer ${authStore.token}`)
      }
    },
    onResponseError({ response }) {
      // Optional: Auto-logout if the token is expired/invalid
      if (response.status === 401) {
        authStore.logout()
      }
    }
  })
}