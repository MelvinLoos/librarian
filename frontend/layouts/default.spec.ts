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

  const mountLayout = () => mount(DefaultLayout, {
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        Sun: true,
        Moon: true,
        OfflineIndicator: true
      },
    },
  })

  it('renders the main application shell', () => {
    const wrapper = mountLayout()

    expect(wrapper.text()).toContain('Librarian')
    expect(wrapper.text()).toContain('Settings')
  })

  it('toggles the theme when the theme button is clicked', async () => {
    const wrapper = mountLayout()

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

  it('uses improved contrast classes on the header (dark theme)', () => {
    mockTheme.value = 'dark'
    const wrapper = mountLayout()

    const header = wrapper.find('header')
    expect(header.classes()).toContain('bg-surface/98')
    expect(header.classes()).toContain('backdrop-blur-xl')
  })

  it('uses improved contrast classes on the header (light theme)', () => {
    mockTheme.value = 'light'
    const wrapper = mountLayout()

    const header = wrapper.find('header')
    expect(header.classes()).toContain('bg-surface/98')
    expect(header.classes()).toContain('backdrop-blur-xl')
  })

  it('uses improved contrast classes on the bottom nav (dark theme)', () => {
    mockTheme.value = 'dark'
    const wrapper = mountLayout()

    const nav = wrapper.find('nav')
    expect(nav.classes()).toContain('bg-surface/98')
    expect(nav.classes()).toContain('backdrop-blur-md')
  })

  it('uses improved contrast classes on the bottom nav (light theme)', () => {
    mockTheme.value = 'light'
    const wrapper = mountLayout()

    const nav = wrapper.find('nav')
    expect(nav.classes()).toContain('bg-surface/98')
    expect(nav.classes()).toContain('backdrop-blur-md')
  })

  it('bottom nav links use text-on-surface for improved legibility (dark theme)', () => {
    mockTheme.value = 'dark'
    const wrapper = mountLayout()

    const navLinks = wrapper.find('nav').findAll('a')
    // At least Library, Discover, Downloads, Settings should be text-on-surface
    const navLinkClasses = navLinks.map(link => link.classes())
    navLinkClasses.forEach(classes => {
      expect(classes).toContain('text-on-surface')
      expect(classes).not.toContain('text-on-surface-variant')
    })
  })

  it('bottom nav links use text-on-surface for improved legibility (light theme)', () => {
    mockTheme.value = 'light'
    const wrapper = mountLayout()

    const navLinks = wrapper.find('nav').findAll('a')
    const navLinkClasses = navLinks.map(link => link.classes())
    navLinkClasses.forEach(classes => {
      expect(classes).toContain('text-on-surface')
      expect(classes).not.toContain('text-on-surface-variant')
    })
  })

  it('theme toggle button uses text-on-surface for improved contrast', () => {
    const wrapper = mountLayout()

    const themeButton = wrapper.find('button[aria-label="Toggle theme"]')
    expect(themeButton.classes()).toContain('text-on-surface')
  })
})
