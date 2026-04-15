import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { ref } from 'vue'
import IndexPage from '../../pages/index.vue'

vi.mock('~/stores/search', () => {
  const { ref } = require('vue')
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
})
