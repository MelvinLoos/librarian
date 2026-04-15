import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();
  
  // Always attempt to hydrate the user from the token on page load
  if (authStore.token && !authStore.user) {
    authStore.hydrate();
  }

  const isPublicRoute = to.path === '/login' || to.path === '/register';

  // Not logged in + trying to access private page -> Kick to login
  if (!authStore.isAuthenticated && !isPublicRoute) {
    return navigateTo('/login');
  }

  // Logged in + trying to access login page -> Send to dashboard
  if (authStore.isAuthenticated && isPublicRoute) {
    return navigateTo('/');
  }
});