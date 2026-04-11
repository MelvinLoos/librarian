import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DefaultLayout from './default.vue'

let authState = { isAdmin: true, isReader: false }
function useAuthStore() {
  return authState
}

let searchState = { query: '', setQuery: vi.fn() }
function useSearchStore() {
  return searchState
}

vi.mock('../stores/auth', () => ({ useAuthStore }))
vi.mock('../stores/search', () => ({ useSearchStore }))

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
