import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { mockBulkUpdateBooks } = vi.hoisted(() => ({
  mockBulkUpdateBooks: vi.fn(),
}))

vi.mock('~/infrastructure/api/CatalogApi', () => ({
  CatalogApi: {
    bulkUpdateBooks: mockBulkUpdateBooks,
  },
}))

import BulkEditModal from '~/components/BulkEditModal.vue'

function mountModal() {
  return mount(BulkEditModal, {
    props: {
      open: true,
      bookIds: [1, 2],
    },
  })
}

describe('BulkEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the selection count and target fields when open', () => {
    const wrapper = mountModal()

    expect(wrapper.find('[data-test="bulk-edit-modal"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="title"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="publisher"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="rating"]').exists()).toBe(true)
  })

  it('submits the partial changes for every selected book', async () => {
    mockBulkUpdateBooks.mockResolvedValue([{ id: 1, title: 'Dune' }])
    const wrapper = mountModal()

    await wrapper.find('[data-test="title"]').setValue('Dune')
    await wrapper.find('[data-test="publisher"]').setValue('Chilton Books')
    await wrapper.find('[data-test="save"]').trigger('click')
    await flushPromises()

    expect(mockBulkUpdateBooks).toHaveBeenCalledWith([1, 2], {
      title: 'Dune',
      publisher: 'Chilton Books',
    })
    const closeEvents = wrapper.emitted('close')
    expect(closeEvents).toBeTruthy()
  })

  it('does not submit when the payload is empty', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="save"]').trigger('click')
    await flushPromises()

    expect(mockBulkUpdateBooks).not.toHaveBeenCalled()
  })

  it('does not render when closed', () => {
    const wrapper = mount(BulkEditModal, {
      props: { open: false, bookIds: [1] },
    })
    expect(wrapper.find('[data-test="bulk-edit-modal"]').exists()).toBe(false)
  })
})