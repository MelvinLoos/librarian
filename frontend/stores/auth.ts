import { defineStore } from 'pinia'

interface UserProfile {
  id: string
  email: string
  role: 'ADMIN' | 'READER'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: { id: '', email: '', role: 'READER' } as UserProfile,
  }),
  getters: {
    isAdmin: (state) => state.user.role === 'ADMIN',
    isReader: (state) => state.user.role === 'READER',
  },
  actions: {
    login(payload: { id: string; email: string; role: 'ADMIN' | 'READER' }) {
      this.token = `fake-jwt-${payload.id}`
      this.user = payload
    },
    register(payload: { id: string; email: string; role: 'ADMIN' | 'READER' }) {
      this.login(payload)
    },
    logout() {
      this.token = ''
      this.user = { id: '', email: '', role: 'READER' }
    },
  },
})
