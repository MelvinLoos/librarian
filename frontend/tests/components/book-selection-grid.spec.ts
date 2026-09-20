import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { markRaw } from 'vue'
import BookSelectionGrid from '~/components/BookSelectionGrid.vue'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'

const books = [
  { id: 1, title: 'Dune', author: 'Frank Herbert' },
  { id: 2, title: 'Hyperion', author: 'Dan Simmons' },
  { id: 3, title: 'Neuromancer', author: 'William Gibson' },
]

function mountGrid(modelValue: number[] = []) {
  return mount(BookSelectionGrid, {
    props: { books, modelValue },
    global: {
      components: {
        UiCheckbox: markRaw(UiCheckbox),
      },
    },
  })
}

describe('BookSelectionGrid (Catalog molecule)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one row per provided book', () => {
    const wrapper = mountGrid()
    expect(wrapper.findAll('[data-test="book-grid-row"]')).toHaveLength(3)
    expect(wrapper.text()).toContain('Hyperion')
  })

  it('reflects the initial selection', () => {
    const wrapper = mountGrid([1, 3])
    const rows = wrapper.findAll('[data-test="book-grid-row"]')
    expect((rows[0].find('input').element as HTMLInputElement).checked).toBe(true)
    expect((rows[1].find('input').element as HTMLInputElement).checked).toBe(false)
    expect((rows[2].find('input').element as HTMLInputElement).checked).toBe(true)
  })

  it('emits the updated id list when a single row is toggled', async () => {
    const wrapper = mountGrid([1])
    const rows = wrapper.findAll('[data-test="book-grid-row"]')
    await rows[1].find('input').setValue(true)
    await rows[1].find('input').trigger('change')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 2]])
  })

  it('selects every book when the header select-all is enabled', async () => {
    const wrapper = mountGrid([1])
    await wrapper.find('[data-test="select-all"] input').setValue(true)
    await wrapper.find('[data-test="select-all"] input').trigger('change')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[1, 2, 3]])
    const rows = wrapper.findAll('[data-test="book-grid-row"]')
    for (const row of rows) {
      expect((row.find('input').element as HTMLInputElement).checked).toBe(true)
    }
  })

  it('deselects every book when select-all is toggled off', async () => {
    const wrapper = mountGrid([1, 2, 3])
    await wrapper.find('[data-test="select-all"] input').setValue(false)
    await wrapper.find('[data-test="select-all"] input').trigger('change')
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]])
  })

  it('exposes accessible labels on the row checkboxes', () => {
    const wrapper = mountGrid()
    const rows = wrapper.findAll('[data-test="book-grid-row"]')
    expect(rows[0].find('input').attributes('aria-label')).toContain('Dune')
  })
})