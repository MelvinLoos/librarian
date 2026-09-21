import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import IndexPage from '../../pages/index.vue'
import { useLibrarySelectionStore } from '../../stores/librarySelection'

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

// Default: simulate the initial loading state for /books
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

  it('wires the full book list and live selection into the bulk edit modal', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Override the network stub: /books returns a single book, resolved.
    vi.stubGlobal('useApiFetch', (url: string) => {
      if (url === '/books') {
        return { data: ref([{ id: 1, title: 'Dune', hasCover: false }]), pending: ref(false) }
      }
      return { data: ref([]), pending: ref(false) }
    })

    const selection = useLibrarySelectionStore()
    selection.toggleAll([1])

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
            BookCard: true,
            // Spy on the real component's props without rendering its internals.
            BulkEditModal: {
              template:
                '<div data-test="bulk-edit-modal-stub" ' +
                ':data-open="String(open)" ' +
                ':data-book-ids="JSON.stringify(bookIds)" ' +
                ':data-books="JSON.stringify(books)" />',
              props: ['open', 'bookIds', 'books'],
            },
          },
        },
      }
    )

    await flushPromises()

    const editButton = wrapper.find('[data-test="edit-selection"]')
    expect(editButton.exists()).toBe(true)
    await editButton.trigger('click')
    await flushPromises()

    const modal = wrapper.find('[data-test="bulk-edit-modal-stub"]')
    expect(modal.attributes('data-open')).toBe('true')
    expect(JSON.parse(modal.attributes('data-book-ids')!)).toEqual([1])
    // The grid needs the live book list to render selectable rows.
    expect(JSON.parse(modal.attributes('data-books')!)).toEqual([
      { id: 1, title: 'Dune', hasCover: false },
    ])

    // Restore the default loading-state stub for sibling tests.
    vi.stubGlobal('useApiFetch', (url: string) => {
      if (url === '/books') {
        return { data: ref([]), pending: ref(true) }
      }
      return { data: ref([]), pending: ref(false) }
    })
  })
})
