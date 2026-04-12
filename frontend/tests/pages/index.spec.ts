import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { ref } from 'vue'
import IndexPage from '../../pages/index.vue'

let searchState = { query: '', setQuery: vi.fn(), booksCache: {}, scrollY: 0, getBooks: vi.fn(), setBooks: vi.fn(), setScrollY: vi.fn() }
function useSearchStore() {
  return searchState
}

vi.mock('~/stores/search', () => ({ useSearchStore }))
vi.mock('~/composables/useApiBase', () => ({ useApiBase: () => 'http://localhost:3000' }))

describe('Index page loading state', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders skeletons when pending is true', async () => {
    vi.stubGlobal('useApiFetch', () => ({ data: ref([]), pending: ref(true) }))
    searchState.getBooks = vi.fn(() => [])

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
})
