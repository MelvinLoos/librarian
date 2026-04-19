import { useAuthStore } from '~/stores/auth'
import { AuthApi } from '~/infrastructure/api/AuthApi'

export const useApi = () => {
  const authStore = useAuthStore()

  const $api = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      if (authStore.token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${authStore.token}`,
        }
      }
      // Ensure cookies (refreshToken) are sent
      options.credentials = 'include'
    },
    async onResponseError({ response, options }) {
      // @ts-ignore - _retry is a custom property
      if (response.status === 401 && !options._retry) {
        // @ts-ignore
        options._retry = true
        try {
          const { accessToken } = await AuthApi.refreshToken()
          authStore.setToken(accessToken)

          // Use the global $fetch with the new token
          // Since we're in a create() instance, we can just call it again with the updated headers
          // @ts-ignore
          return $api(response.url, options)
        } catch (error) {
          authStore.logout()
        }
      }
    }
  })

  return $api
}
