import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DefaultLayout from './default.vue'

const mockToggleTheme = vi.fn()
const mockTheme = ref('dark')

vi.mock('../composables/useTheme', () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme
  })
}))

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
  beforeEach(() => {
    vi.clearAllMocks()
    mockTheme.value = 'dark'
  })

  it('renders the main application shell', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          Sun: true,
          Moon: true,
          OfflineIndicator: true
        },
      },
    })

    expect(wrapper.text()).toContain('Librarian')
    expect(wrapper.text()).toContain('Settings')
  })

  it('toggles the theme when the theme button is clicked', async () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          Sun: true,
          Moon: true,
          OfflineIndicator: true
        },
      },
    })

    const themeButton = wrapper.find('button[aria-label="Toggle theme"]')
    expect(themeButton.exists()).toBe(true)

    await themeButton.trigger('click')
    expect(mockToggleTheme).toHaveBeenCalled()
  })

  it('displays the Sun icon when theme is dark', () => {
    mockTheme.value = 'dark'
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          Sun: { template: '<span class="sun-icon" />' },
          Moon: { template: '<span class="moon-icon" />' },
          OfflineIndicator: true
        },
      },
    })

    expect(wrapper.find('.sun-icon').exists()).toBe(true)
    expect(wrapper.find('.moon-icon').exists()).toBe(false)
  })

  it('displays the Moon icon when theme is light', () => {
    mockTheme.value = 'light'
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          Sun: { template: '<span class="sun-icon" />' },
          Moon: { template: '<span class="moon-icon" />' },
          OfflineIndicator: true
        },
      },
    })

    expect(wrapper.find('.sun-icon').exists()).toBe(false)
    expect(wrapper.find('.moon-icon').exists()).toBe(true)
  })
})
