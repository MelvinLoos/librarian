/**
 * Tests for the offline/cache UI on the book detail page (pages/book/[id].vue).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

// ── Stub vue-router (imported directly by the page) ────────────────────────
vi.mock('vue-router', () => ({
  useRoute:  () => ({ params: { id: '42' }, query: {} }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

// ── Mutable state that the store mock reads from ───────────────────────────
let _status = ref<'not-cached' | 'partial' | 'cached'>('not-cached')
let _progress = ref(0)
let _apiAvailable = ref(true)

const mockCacheBook = vi.fn()
const mockClearCachedBook = vi.fn()
const mockRefreshCacheStatus = vi.fn()
const mockInitSwListener = vi.fn(() => () => {})

vi.mock('~/stores/bookCache', () => ({
  useBookCacheStore: () => ({
    getStatus:          (_id: number) => _status.value,
    getProgress:        (_id: number) => _progress.value,
    get cacheApiAvailable() { return _apiAvailable.value },
    refreshCacheStatus: mockRefreshCacheStatus,
    cacheBook:          mockCacheBook,
    clearCachedBook:    mockClearCachedBook,
    initSwListener:     mockInitSwListener,
  }),
}))

vi.mock('~/composables/useApiBase', () => ({ useApiBase: () => 'http://localhost' }))

// Prevent the page's useApiFetch call from hitting the network
vi.stubGlobal('useApiFetch', (_url: string) => ({
  data: ref(null),
  pending: ref(false),
  error: ref(null),
}))

import BookDetailPage from '../../pages/book/[id].vue'

const globalStubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  LucideArrowLeft: { template: '<span />' },
}

function mountPage() {
  return mount(BookDetailPage, {
    global: {
      plugins: [createPinia()],
      stubs: globalStubs,
    },
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('Book detail page – offline toggle', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _status.value = 'not-cached'
    _progress.value = 0
    _apiAvailable.value = true
    mockCacheBook.mockResolvedValue(undefined)
    mockClearCachedBook.mockResolvedValue(undefined)
    mockRefreshCacheStatus.mockResolvedValue(undefined)
    mockInitSwListener.mockReturnValue(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the offline toggle in the off state by default', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const toggle = wrapper.find('button[aria-pressed]')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).toContain('Not cached')
    expect(wrapper.html()).toContain('cloud_off')
  })

  it('calls cacheBook when toggle is clicked from off state', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button[aria-pressed]').trigger('click')
    expect(mockCacheBook).toHaveBeenCalledWith(42)
  })

  it('shows spinning sync icon, "Caching…" label and progress bar while partial', async () => {
    _status.value = 'partial'
    _progress.value = 37
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.html()).toContain('sync')
    expect(wrapper.text()).toContain('37%')
    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('aria-valuenow')).toBe('37')
  })

  it('tracks progress bar width to the store value', async () => {
    _status.value = 'partial'
    _progress.value = 65
    const wrapper = mountPage()
    await flushPromises()

    const fill = wrapper.find('[role="progressbar"] div')
    expect(fill.attributes('style')).toContain('65%')
  })

  it('shows offline_pin badge and "Available offline" when cached', async () => {
    _status.value = 'cached'
    _progress.value = 100
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.html()).toContain('offline_pin')
    expect(wrapper.text()).toContain('Available offline')
    expect(wrapper.find('button[aria-pressed]').attributes('aria-pressed')).toBe('true')
  })

  it('calls clearCachedBook when toggle is clicked from cached state', async () => {
    _status.value = 'cached'
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button[aria-pressed]').trigger('click')
    expect(mockClearCachedBook).toHaveBeenCalledWith(42)
    expect(mockCacheBook).not.toHaveBeenCalled()
  })

  it('calls clearCachedBook when toggle clicked while partial (cancels download)', async () => {
    _status.value = 'partial'
    _progress.value = 50
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button[aria-pressed]').trigger('click')
    expect(mockClearCachedBook).toHaveBeenCalledWith(42)
    expect(mockCacheBook).not.toHaveBeenCalled()
  })

  it('disables the toggle when Cache API is unavailable', async () => {
    _apiAvailable.value = false
    const wrapper = mountPage()
    await flushPromises()

    const toggle = wrapper.find('button[aria-pressed]')
    expect(toggle.attributes()).toHaveProperty('disabled')
  })

  it('hides the progress bar when not downloading', async () => {
    _status.value = 'not-cached'
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('[role="progressbar"]').exists()).toBe(false)
  })

  it('calls refreshCacheStatus and initSwListener on mount', async () => {
    mountPage()
    await flushPromises()

    expect(mockRefreshCacheStatus).toHaveBeenCalledWith([42])
    expect(mockInitSwListener).toHaveBeenCalledOnce()
  })
})
