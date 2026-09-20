import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    token: 'test-token',
    user: { email: 'test@example.com', role: 'ADMIN' },
    logout: vi.fn(),
  }),
}))

import { markRaw } from 'vue'
import UploadDropzone from './UploadDropzone.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiDialog from '~/components/ui/UiDialog.vue'

/**
 * Request-router for the real Storage backend contract:
 *  POST /api/assets/upload              -> 202 { id, state, message }
 *  GET  /api/assets/:assetId/status     -> { assetId, state, bookId }
 *  POST /api/assets/books/:id/convert   -> 202 { jobId, message }
 *  GET  /api/assets/conversions/:jobId  -> { jobId, status, progress, ... }
 */
function installFetchRoutes(routes: Record<string, unknown>) {
  const counts = new Map<string, number>()
  mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
    const method = (opts?.method || 'GET').toUpperCase()
    const key = `${method} ${url}`
    const handler = (routes as Record<string, unknown>)[key]
    if (!handler) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: `No route for ${key}` }),
        text: () => Promise.resolve(`No route for ${key}`),
      })
    }
    const count = counts.get(key) ?? 0
    counts.set(key, count + 1)
    let value = typeof handler === 'object' && handler !== null && 'status' in handler
      ? (handler as { value: unknown }).value
      : handler
    const status = typeof handler === 'object' && handler !== null && 'status' in handler
      ? (handler as { status: number }).status
      : 200
    // Array handlers simulate state progression across successive polls.
    if (Array.isArray(value)) {
      value = value[Math.min(count, value.length - 1)]
    }
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(value),
      text: () => Promise.resolve(JSON.stringify(value)),
    })
  })
}

function uploadOkRoutes() {
  installFetchRoutes({
    'POST /api/assets/upload': { id: 'asset-1', state: 'UPLOADED', message: 'ok' },
    'GET /api/assets/asset-1/status': { assetId: 'asset-1', state: 'READY', bookId: 7 },
  })
}

function mountDropzone(props: Record<string, unknown> = {}) {
  return mount(UploadDropzone, {
    props,
    global: {
      components: {
        // Mirror Nuxt auto-import: atoms resolve without explicit imports in the app.
        UiButton: markRaw(UiButton),
        UiInput: markRaw(UiInput),
        UiSelect: markRaw(UiSelect),
        UiDialog: markRaw(UiDialog),
      },
    },
  })
}

const dropEpub = async (wrapper: ReturnType<typeof mountDropzone>, name = 'example.epub') => {
  await wrapper.find('[data-test="upload-dropzone"]').trigger('drop', {
    dataTransfer: { files: [new File(['content'], name, { type: 'application/epub+zip' })] },
  })
  await flushPromises()
}

describe('UploadDropzone (Storage molecule)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch as unknown as typeof fetch
  })

  it('renders the dropzone content', () => {
    const wrapper = mountDropzone()
    expect(wrapper.find('[data-test="upload-dropzone"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Drag and drop files here')
  })

  it('browse control is a keyboard-operable button', () => {
    const wrapper = mountDropzone()
    const browse = wrapper.find('[data-test="browse-files"]')
    expect(browse.exists()).toBe(true)
    expect(browse.attributes('type')).toBe('button')
  })

  it('rejects files with unsupported extensions', async () => {
    const wrapper = mountDropzone()
    await wrapper.find('[data-test="upload-dropzone"]').trigger('drop', {
      dataTransfer: { files: [new File(['x'], 'malware.exe', { type: 'application/octet-stream' })] },
    })
    await flushPromises()
    expect(wrapper.findAll('[data-test="upload-row"]')).toHaveLength(0)
  })

  it('adds dropped files to the queued list with an initial status', async () => {
    const wrapper = mountDropzone()
    await dropEpub(wrapper)
    expect(wrapper.findAll('[data-test="upload-row"]')).toHaveLength(1)
    expect(wrapper.find('[data-test="upload-status"]').text()).toBe('Queued')
  })

  it('does not offer upload when no files are queued', async () => {
    const wrapper = mountDropzone()
    expect(wrapper.find('[data-test="start-upload"]').exists()).toBe(false)
    await wrapper.find('[data-test="upload-dropzone"]').trigger('keydown', { key: 'Enter' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('uploads each queued file against /api/assets/upload and finishes done', async () => {
    uploadOkRoutes()
    const wrapper = mountDropzone({ pollIntervalMs: 1, maxStatusPolls: 5 })
    await dropEpub(wrapper, 'a.epub')
    await dropEpub(wrapper, 'b.epub')

    await wrapper.find('[data-test="start-upload"]').trigger('click')
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 10))
    await flushPromises()

    const uploadCalls = mockFetch.mock.calls.filter(([url]) => url === '/api/assets/upload')
    expect(uploadCalls).toHaveLength(2)
    expect(uploadCalls[0][1]).toMatchObject({ method: 'POST' })

    const statuses = wrapper.findAll('[data-test="upload-status"]').map((el) => el.text())
    expect(statuses).toEqual(['Done', 'Done'])
  })

  it('marks upload failures as error', async () => {
    installFetchRoutes({
      'POST /api/assets/upload': { status: 500, value: { message: 'Disk full' } },
    })
    const wrapper = mountDropzone({ pollIntervalMs: 1, maxStatusPolls: 2 })
    await dropEpub(wrapper)

    await wrapper.find('[data-test="start-upload"]').trigger('click')
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 5))
    await flushPromises()

    expect(wrapper.find('[data-test="upload-status"]').text()).toBe('Error')

    await wrapper.find('[data-test="row-details"]').trigger('click')
    expect(wrapper.find('[data-test="upload-error-dialog"]').exists()).toBe(true)
  })
it('only offers backend-supported conversion targets per source format', async () => {
    const wrapper = mountDropzone()
    await dropEpub(wrapper, 'novel.pdf')
    await flushPromises()
    const options = wrapper.findAll('option').map((o) => o.text()).filter((t) => t.length > 0)
    expect(options).toEqual(['EPUB'])
  })

  it('requests conversion, tracks job progress, and reaches done', async () => {
    installFetchRoutes({
      'POST /api/assets/upload': { id: 'asset-1', state: 'UPLOADED', message: 'ok' },
      'GET /api/assets/asset-1/status': { assetId: 'asset-1', state: 'READY', bookId: 7 },
      'POST /api/assets/books/7/convert': { jobId: 'job-1', message: 'Conversion requested' },
      'GET /api/assets/conversions/job-1': [
        { status: 'running', progress: 50, sourceFormat: 'EPUB', targetFormat: 'MOBI' },
        { status: 'completed', progress: 100, sourceFormat: 'EPUB', targetFormat: 'MOBI' },
      ],
    })
    const wrapper = mountDropzone({ pollIntervalMs: 1, maxStatusPolls: 6 })
    await dropEpub(wrapper)

    const target = wrapper.find('[data-test="conversion-target"] select')
    await target.setValue('MOBI')
    await wrapper.find('[data-test="start-upload"]').trigger('click')
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 15))
    await flushPromises()

    const convertCall = mockFetch.mock.calls.find(([url]) => url === '/api/assets/books/7/convert')
    expect(convertCall).toBeTruthy()
    expect(convertCall![1]).toMatchObject({ method: 'POST' })
    expect(JSON.parse((convertCall![1] as RequestInit).body as string)).toEqual({
      targetFormat: 'MOBI',
    })
    expect(wrapper.find('[data-test="upload-status"]').text()).toBe('Done')
  })

  it('filters the queued list by file name', async () => {
    const wrapper = mountDropzone()
    await dropEpub(wrapper, 'alpha.epub')
    await dropEpub(wrapper, 'beta.epub')

    await wrapper.find('[data-test="file-filter"] input').setValue('alpha')
    const visible = wrapper.findAll('[data-test="upload-row"]')
    expect(visible).toHaveLength(1)
    expect(visible[0].text()).toContain('alpha.epub')
  })
})
