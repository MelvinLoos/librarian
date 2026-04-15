import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DefaultLayout from './default.vue'

vi.mock('../stores/auth', () => ({ 
  useAuthStore: () => ({ 
    isAuthenticated: true, 
    user: { email: 'test@example.com', role: 'ADMIN' }, 
    logout: vi.fn() 
  }) 
}))

vi.mock('../stores/search', () => ({
  useSearchStore: () => ({
    query: '',
    setQuery: vi.fn()
  })
}))

describe('Default layout', () => {
  it('renders the main application shell', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })

    expect(wrapper.text()).toContain('Librarian')
    expect(wrapper.text()).toContain('Settings')
  })
})
