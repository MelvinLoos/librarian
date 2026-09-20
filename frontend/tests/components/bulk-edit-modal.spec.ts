import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { markRaw } from 'vue'

const { mockBulkUpdateBooks } = vi.hoisted(() => ({
  mockBulkUpdateBooks: vi.fn(),
}))

vi.mock('~/infrastructure/api/CatalogApi', () => ({
  CatalogApi: {
    bulkUpdateBooks: mockBulkUpdateBooks,
  },
}))

import BulkEditModal from '~/components/BulkEditModal.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiTextarea from '~/components/ui/UiTextarea.vue'
import UiDialog from '~/components/ui/UiDialog.vue'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'
import BookSelectionGrid from '~/components/BookSelectionGrid.vue'

const books = [
  { id: 1, title: 'Dune' },
  { id: 2, title: 'Hyperion' },
  { id: 3, title: 'Neuromancer' },
]

function mountModal(extraProps: Record<string, unknown> = {}) {
  return mount(BulkEditModal, {
    props: {
      open: true,
      bookIds: [1, 2],
      ...extraProps,
    },
    global: {
      components: {
        // Mirror Nuxt auto-import for the Reka UI atoms + Catalog molecule.
        UiButton: markRaw(UiButton),
        UiInput: markRaw(UiInput),
        UiSelect: markRaw(UiSelect),
        UiTextarea: markRaw(UiTextarea),
        UiDialog: markRaw(UiDialog),
        UiCheckbox: markRaw(UiCheckbox),
        BookSelectionGrid: markRaw(BookSelectionGrid),
      },
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

  it('reflects the selected book count in the dialog title', () => {
    const wrapper = mountModal()
    const dialog = wrapper.find('[data-test="bulk-edit-modal"]')
    expect(dialog.attributes('aria-label')).toContain('2')
  })

  it('submits the partial changes for every selected book', async () => {
    mockBulkUpdateBooks.mockResolvedValue([{ id: 1, title: 'Dune' }])
    const wrapper = mountModal()

    await wrapper.find('[data-test="title"] input').setValue('Dune')
    await wrapper.find('[data-test="publisher"] input').setValue('Chilton Books')
    await wrapper.find('[data-test="save"]').trigger('click')
    await flushPromises()

    expect(mockBulkUpdateBooks).toHaveBeenCalledWith([1, 2], {
      title: 'Dune',
      publisher: 'Chilton Books',
    })
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('applies changes to the live grid selection when books are provided', async () => {
    mockBulkUpdateBooks.mockResolvedValue([{ id: 1, title: 'Dune' }])
    const wrapper = mountModal({ books })

    // Select every book via the grid header.
    await wrapper.find('[data-test="select-all"] input').setValue(true)
    await wrapper.find('[data-test="title"] input').setValue('All')
    await wrapper.find('[data-test="save"]').trigger('click')
    await flushPromises()

    expect(mockBulkUpdateBooks).toHaveBeenCalledWith([1, 2, 3], { title: 'All' })
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
      global: {
        components: {
          UiButton: markRaw(UiButton),
          UiInput: markRaw(UiInput),
          UiSelect: markRaw(UiSelect),
          UiTextarea: markRaw(UiTextarea),
          UiDialog: markRaw(UiDialog),
          UiCheckbox: markRaw(UiCheckbox),
          BookSelectionGrid: markRaw(BookSelectionGrid),
        },
      },
    })
    expect(wrapper.find('[data-test="bulk-edit-modal"]').exists()).toBe(false)
  })
})