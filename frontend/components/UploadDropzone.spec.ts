import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UploadDropzone from './UploadDropzone.vue'

describe('UploadDropzone', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any
  })

  it('renders the dropzone content', () => {
    const wrapper = mount(UploadDropzone)
    expect(wrapper.text()).toContain('Drag and drop files here')
  })

  it('handles dragover and drop events', async () => {
    const wrapper = mount(UploadDropzone)
    await wrapper.trigger('dragover')

    await wrapper.trigger('drop', {
      dataTransfer: {
        files: [new File(['content'], 'example.epub', { type: 'application/epub+zip' })],
      },
    })

    expect(global.fetch).toHaveBeenCalled()
  })
})
