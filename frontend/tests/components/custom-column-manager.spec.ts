import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { markRaw } from 'vue'

const { mockGetCustomColumns, mockUpsertCustomColumn, mockDeleteCustomColumn } = vi.hoisted(() => ({
  mockGetCustomColumns: vi.fn(),
  mockUpsertCustomColumn: vi.fn(),
  mockDeleteCustomColumn: vi.fn(),
}))

vi.mock('~/infrastructure/api/CatalogApi', () => ({
  CatalogApi: {
    getCustomColumns: mockGetCustomColumns,
    upsertCustomColumn: mockUpsertCustomColumn,
    deleteCustomColumn: mockDeleteCustomColumn,
  },
}))

import CustomColumnManager from '~/components/CustomColumnManager.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'

function mountManager() {
  return mount(CustomColumnManager, {
    global: {
      components: {
        // Mirror Nuxt auto-import for the Reka UI atoms.
        UiButton: markRaw(UiButton),
        UiInput: markRaw(UiInput),
        UiSelect: markRaw(UiSelect),
        UiCheckbox: markRaw(UiCheckbox),
      },
    },
  })
}

describe('CustomColumnManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCustomColumns.mockResolvedValue([
      { id: 'col-1', name: '#read_status', dataType: 'text', isMultiple: false },
    ])
  })

  it('lists existing custom columns', async () => {
    const wrapper = mountManager()
    await flushPromises()

    expect(mockGetCustomColumns).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-test="custom-column-row"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('#read_status')
  })

  it('creates a custom column from the form', async () => {
    mockUpsertCustomColumn.mockResolvedValue({ id: 'col-2' })
    const wrapper = mountManager()
    await flushPromises()

    await wrapper.find('[data-test="column-name"] input').setValue('#genre')
    const dataType = wrapper.find('[data-test="column-datatype"] select')
    await dataType.setValue('series')
    await dataType.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockUpsertCustomColumn).toHaveBeenCalledWith({
      name: '#genre',
      dataType: 'series',
      displayLabel: undefined,
      isMultiple: false,
    })
  })

  it('deletes a custom column', async () => {
    mockDeleteCustomColumn.mockResolvedValue({ id: 'col-1', deleted: true })
    const wrapper = mountManager()
    await flushPromises()

    await wrapper.find('[data-test="delete-column"]').trigger('click')
    await flushPromises()

    expect(mockDeleteCustomColumn).toHaveBeenCalledWith('col-1')
  })
it('flags an empty column name as invalid and skips the API', async () => {
    const wrapper = mountManager()
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockUpsertCustomColumn).not.toHaveBeenCalled()
    const input = wrapper.find('[data-test="column-name"] input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('Name is required')
  })

  it('flags duplicate column names as invalid and skips the API', async () => {
    const wrapper = mountManager()
    await flushPromises()

    await wrapper.find('[data-test="column-name"] input').setValue('#read_status')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockUpsertCustomColumn).not.toHaveBeenCalled()
    const input = wrapper.find('[data-test="column-name"] input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('already exists')
  })

  it('disables the add button while a column is being created', async () => {
    let resolvePromise: (value: unknown) => void = () => {}
    mockUpsertCustomColumn.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve
      }),
    )
    const wrapper = mountManager()
    await flushPromises()

    await wrapper.find('[data-test="column-name"] input').setValue('#genre')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-test="add-column"]').attributes('disabled')).toBeDefined()

    resolvePromise({ id: 'col-2' })
    await flushPromises()
  })
})