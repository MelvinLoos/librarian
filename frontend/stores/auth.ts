import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useCookie, useRouter } from '#imports';
import { AuthApi } from '~/infrastructure/api/AuthApi';
import type { LoginCredentials, User } from '~/domain/auth/Auth.types';

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter();

  // 1. STATE
  // Read the initial cookie value (for SSR/page reloads) into a standard Vue Ref
  const initialCookie = useCookie<string | null>('auth_token').value;
  const token = ref<string | null>(initialCookie);
  const user = ref<User | null>(null);

  // 2. GETTERS
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  // 3. ACTIONS
  async function login(credentials: LoginCredentials) {
    try {
      const response = await AuthApi.login(credentials);

      // A. Update Pinia's state so your UI updates immediately
      token.value = response.accessToken;
      user.value = response.user;

      // B. Explicitly write to the Nuxt cookie here, bypassing Pinia's proxy
      const cookie = useCookie('auth_token', {
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      });
      cookie.value = response.accessToken;

    } catch (error) {
      token.value = null;
      user.value = null;
      throw error;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;

    // Explicitly clear the cookie
    const cookie = useCookie('auth_token', { path: '/' });
    cookie.value = null;

    router.push('/login');
  }

  function hydrate() {
    if (!token.value) return;
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]));
      user.value = { id: payload.sub, email: payload.email, role: payload.role };
    } catch (e) {
      logout();
    }
  }

  function setToken(newToken: string | null) {
    token.value = newToken;
    const cookie = useCookie('auth_token', {
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    cookie.value = newToken;
  }

  return { token, user, isAuthenticated, isAdmin, login, logout, hydrate, setToken };
});