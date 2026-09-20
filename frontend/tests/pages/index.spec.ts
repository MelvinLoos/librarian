import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { ref } from 'vue'
import IndexPage from '../../pages/index.vue'

vi.mock('~/stores/search', () => {
  return {
    useSearchStore: () => ({
      query: '',
      books: [],
      recentBooks: [],
      topTags: [],
      readingStates: [],
      pending: true,
      pendingRecent: true,
      pendingTags: true,
      pendingReading: true,
      currentReading: null,
      fetchBooks: vi.fn(),
      fetchRecentBooks: vi.fn(),
      fetchTopTags: vi.fn(),
      fetchReadingStates: vi.fn(),
    })
  }
})

// Mock useApiFetch to prevent real network calls
vi.stubGlobal('useApiFetch', (url: string) => {
  if (url === '/books') {
    return { data: ref([]), pending: ref(true) }
  }
  return { data: ref([]), pending: ref(false) }
})

// Mock useOnlineStatus
vi.mock('~/composables/useOnlineStatus', () => ({
  useOnlineStatus: () => ({ isOffline: ref(false) })
}))
vi.mock('~/composables/useApiBase', () => ({ useApiBase: () => 'http://localhost:3000' }))

describe('Index page loading state', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders skeletons when pending is true', async () => {

    const wrapper = mount(
      {
        components: { IndexPage },
        template: '<Suspense><IndexPage /></Suspense>',
      },
      {
        global: {
          plugins: [createPinia()],
          stubs: {
            NuxtLink: { template: '<a><slot /></a>' },
            NuxtImg: true,
            BookCard: true,
          },
        },
      }
    )

    await flushPromises()
    expect(wrapper.html()).toContain('animate-pulse')
  })

  it('restricts multi-select to the Your Library grid (no checkboxes in Recent Additions)', async () => {
    const recentBooks = [
      { id: 1, title: 'Dune', author: 'Frank Herbert' },
      { id: 2, title: 'Hyperion', author: 'Dan Simmons' },
    ]

    vi.stubGlobal('useApiFetch', (url: string) => {
      if (url === '/books') {
        return { data: ref(recentBooks), pending: ref(false) }
      }
      return { data: ref([]), pending: ref(false) }
    })

    const wrapper = mount(
      {
        components: { IndexPage },
        template: '<Suspense><IndexPage /></Suspense>',
      },
      {
        global: {
          plugins: [createPinia()],
          stubs: {
            NuxtLink: { template: '<a><slot /></a>' },
            BookCard: true,
          },
        },
      }
    )

    await flushPromises()

    // Selection affordance is reserved for the main grid only.
    expect(wrapper.findAll('[data-test^="book-select-"]')).toHaveLength(0)
  })
})
