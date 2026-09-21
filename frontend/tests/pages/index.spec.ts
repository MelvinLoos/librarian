import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
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

  it('marks the selected card with the data-selected affordance', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Resolved /books payload containing the book we will select.
    vi.stubGlobal('useApiFetch', (url: string) => {
      if (url === '/books') {
        return {
          data: ref([{ id: 1, title: 'Dune', hasCover: false }]),
          pending: ref(false),
        }
      }
      return { data: ref([]), pending: ref(false) }
    })

    const { useLibrarySelectionStore } = await import('~/stores/librarySelection')
    useLibrarySelectionStore().toggleAll([1])

    const wrapper = mount(
      {
        components: { IndexPage },
        template: '<Suspense><IndexPage /></Suspense>',
      },
      {
        global: {
          plugins: [pinia],
          stubs: {
            NuxtLink: { template: '<a><slot /></a>' },
            NuxtImg: true,
            // Record the selection state the page passes into each card.
            BookCard: {
              template:
                '<div data-test="book-card-stub" ' +
                ':data-book-id="String(book.id)" ' +
                ':data-selected="String(selected)" />',
              props: ['book', 'selected'],
            },
          },
        },
      },
    )

    await flushPromises()

    const card = wrapper.find('[data-book-id="1"]')
    expect(card.exists()).toBe(true)
    expect(card.attributes('data-selected')).toBe('true')

    // Restore the default loading-state stub for sibling tests.
    vi.stubGlobal('useApiFetch', (url: string) => {
      if (url === '/books') {
        return { data: ref([]), pending: ref(true) }
      }
      return { data: ref([]), pending: ref(false) }
    })
  })
})
