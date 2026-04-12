import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      authStore.token = null
      authStore.user = null
      return navigateTo('/login')
    }
  }

  if (!authStore.token && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }

  if (authStore.token && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/')
  }
})