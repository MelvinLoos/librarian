import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

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

describe('CustomColumnManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCustomColumns.mockResolvedValue([
      { id: 'col-1', name: '#read_status', dataType: 'text', isMultiple: false },
    ])
  })

  it('lists existing custom columns', async () => {
    const wrapper = mount(CustomColumnManager)
    await flushPromises()

    expect(mockGetCustomColumns).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-test="custom-column-row"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('#read_status')
  })

  it('creates a custom column from the form', async () => {
    mockUpsertCustomColumn.mockResolvedValue({ id: 'col-2' })
    const wrapper = mount(CustomColumnManager)
    await flushPromises()

    await wrapper.find('[data-test="column-name"]').setValue('#genre')
    const dataType = wrapper.find('[data-test="column-datatype"]')
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
    const wrapper = mount(CustomColumnManager)
    await flushPromises()

    await wrapper.find('[data-test="delete-column"]').trigger('click')
    await flushPromises()

    expect(mockDeleteCustomColumn).toHaveBeenCalledWith('col-1')
  })
})