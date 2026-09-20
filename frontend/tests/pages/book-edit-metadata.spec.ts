import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('vue-router', () => ({
  useRoute:  () => ({ params: { id: '42' }, query: {} }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

vi.mock('~/stores/bookCache', () => ({
  useBookCacheStore: () => ({
    getStatus:          () => ref('not-cached'),
    getProgress:        () => ref(0),
    get cacheApiAvailable() { return ref(true).value },
    refreshCacheStatus: vi.fn(),
    cacheBook:          vi.fn(),
    clearCachedBook:    vi.fn(),
    initSwListener:     vi.fn(() => () => {}),
    setBookMeta:        vi.fn(),
    clearBookMeta:      vi.fn(),
  }),
}))

vi.mock('~/composables/useApiBase', () => ({ useApiBase: () => 'http://localhost' }))

const { mockUpdateBookMetadata } = vi.hoisted(() => ({
  mockUpdateBookMetadata: vi.fn(),
}))

vi.mock('~/infrastructure/api/CatalogApi', () => ({
  CatalogApi: {
    updateBookMetadata: mockUpdateBookMetadata,
  },
}))

const bookData = ref({
  id: 42,
  title: 'The Way of Kings',
  authors: [{ id: 1, name: 'Brandon Sanderson' }],
  tags: [{ id: 2, name: 'Fantasy' }],
  series: { id: 3, name: 'The Stormlight Archive' },
  rating: 4.5,
  publisher: 'Tor Books',
  description: 'An epic fantasy novel',
} as any)

vi.stubGlobal('useApiFetch', () => ({
  data: bookData,
  pending: ref(false),
  error: ref(null),
}))

import BookDetailPage from '../../pages/book/[id].vue'
import { markRaw } from 'vue'
import UiButton from '~/components/ui/UiButton.vue'

function mountPage() {
  return mount(BookDetailPage, {
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        LucideArrowLeft: { template: '<span />' },
        EditMetadataModal: false,
      },
      components: {
        // Mirror Nuxt auto-import for the Reka UI atoms used by the page.
        UiButton: markRaw(UiButton),
      },
    },
  })
}

describe('Book detail page – edit metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('opens the modal when Edit Metadata is clicked', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[data-test="edit-metadata"]').exists()).toBe(true)

    // The modal is stubbed here; assert the button is wired to open it.
    await wrapper.find('[data-test="edit-metadata"]').trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent({ name: 'EditMetadataModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(true)
  })
})