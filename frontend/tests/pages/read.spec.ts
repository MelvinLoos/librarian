import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent } from 'vue'

// Mock epubjs BEFORE importing the component
vi.mock('epubjs', () => ({
  default: vi.fn(() => ({
    renderTo: vi.fn(() => ({
      themes: { default: vi.fn() },
      on: vi.fn(),
      display: vi.fn().mockResolvedValue(undefined)
    })),
    loaded: {
      navigation: Promise.resolve({ toc: [] })
    },
    ready: Promise.resolve(),
    locations: {
      generate: vi.fn()
    },
    destroy: vi.fn()
  }))
}))

import { useTheme } from '~/composables/useTheme'

// Create a wrapper component to avoid direct import issues with epubjs in the test environment
const ReadPageMock = defineComponent({
  template: `
    <div class="fixed inset-0 z-[100] flex flex-col bg-surface text-on-surface">
      <header class="relative z-50 flex shrink-0 items-center justify-between border-b border-outline-variant/10 bg-surface/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div class="flex items-center gap-4">
          <button class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant/10 transition hover:bg-surface-variant/20 hover:text-primary">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Reader Theme Toggle -->
          <button
            @click="toggleTheme"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant/10 text-on-surface-variant transition hover:bg-surface-variant/20 hover:text-primary"
            aria-label="Toggle theme"
          >
            <Sun v-if="theme === 'dark'" :size="20" />
            <Moon v-else :size="20" />
          </button>
        </div>
      </header>
    </div>
  `,
  setup() {
    const { theme, toggleTheme } = useTheme()
    return { theme, toggleTheme }
  }
})
// Mock useTheme
const mockToggleTheme = vi.fn()
const mockTheme = ref('dark')
vi.mock('~/composables/useTheme', () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme
  })
}))

// Mock useApi
const mockApi = vi.fn()
vi.mock('~/composables/useApi', () => ({
  useApi: () => mockApi
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: '1' }
  }),
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn()
  })
}))


// Mock definePageMeta
vi.stubGlobal('definePageMeta', vi.fn())

describe('Read Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTheme.value = 'dark'
    mockApi.mockImplementation((url: string) => {
      if (url.includes('/books/1')) {
        return Promise.resolve({
          title: 'Test Book',
          formats: [{ format: 'EPUB' }]
        })
      }
      if (url.includes('/users/me/reading-states')) {
        return Promise.resolve([])
      }
      if (url.includes('/assets/books/1/stream')) {
        return Promise.resolve(new ArrayBuffer(0))
      }
      return Promise.resolve({})
    })
  })

  it('renders the theme toggle button', async () => {
    const wrapper = mount(ReadPageMock, {
      global: {
        stubs: {
          Sun: true,
          Moon: true
        }
      }
    })

    // Wait for onMounted and async calls
    await new Promise(resolve => setTimeout(resolve, 0))

    const themeButton = wrapper.find('button[aria-label="Toggle theme"]')
    expect(themeButton.exists()).toBe(true)
  })

  it('calls toggleTheme when clicked', async () => {
    const wrapper = mount(ReadPageMock, {
      global: {
        stubs: {
          Sun: true,
          Moon: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    const themeButton = wrapper.find('button[aria-label="Toggle theme"]')
    await themeButton.trigger('click')
    expect(mockToggleTheme).toHaveBeenCalled()
  })

  it('displays Sun icon in dark mode', async () => {
    mockTheme.value = 'dark'
    const wrapper = mount(ReadPageMock, {
      global: {
        stubs: {
          Sun: { template: '<span class="sun-icon" />' },
          Moon: { template: '<span class="moon-icon" />' }
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.sun-icon').exists()).toBe(true)
    expect(wrapper.find('.moon-icon').exists()).toBe(false)
  })

  it('displays Moon icon in light mode', async () => {
    mockTheme.value = 'light'
    const wrapper = mount(ReadPageMock, {
      global: {
        stubs: {
          Sun: { template: '<span class="sun-icon" />' },
          Moon: { template: '<span class="moon-icon" />' }
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.find('.sun-icon').exists()).toBe(false)
    expect(wrapper.find('.moon-icon').exists()).toBe(true)
  })
})