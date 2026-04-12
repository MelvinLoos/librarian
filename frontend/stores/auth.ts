import { defineStore } from 'pinia'
interface UserProfile {
  id: string
  email: string
  role: 'ADMIN' | 'READER'
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const isProd = process.env.NODE_ENV === 'production'

    const token = useCookie<string | null>('auth_token', {
      secure: isProd,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
    })

    return {
      token: token as unknown as string | null,
      user: null as UserProfile | null,
    }
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    async login(credentials: { email: string; password: string }) {
      const response = await $fetch<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      })

      if (response.token) {
        this.token = response.token
        const decoded = parseJwt(response.token)
        if (decoded) {
          // Map the JWT payload to your user state.
          this.user = { id: decoded.sub, email: decoded.email, role: decoded.role }
        }
      } else {
        this.token = response.token
        this.user = response.user
      }
    },

    async register(credentials: { email: string; password: string }) {
      await $fetch('/api/users', {
        method: 'POST',
        body: credentials,
      })

      await this.login(credentials)
    },

    logout() {
      this.token = null
      this.user = null
      return navigateTo('/login')
    },

    async fetchUser() {
      if (!this.token) {
        return
      }
      const decoded = parseJwt(this.token)

      if (decoded) {
        this.user = { id: decoded.sub, email: decoded.email, role: decoded.role }
      } else {
        this.logout() // Token is malformed
      }

      // this.user = await $fetch<UserProfile>('/api/users/me', {
      //   headers: {
      //     Authorization: `Bearer ${this.token}`,
      //   },
      // })
    },
  },
})
