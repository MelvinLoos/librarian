import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiSelect from '~/components/ui/UiSelect.vue'

const options = [
  { value: 'text', label: 'Text' },
  { value: 'series', label: 'Series' },
  { value: 'rating', label: 'Rating' },
]

describe('UiSelect (atom)', () => {
  it('renders a native select with a stable data-test hook', () => {
    const wrapper = mount(UiSelect, { props: { options } })
    const select = wrapper.find('[data-test="ui-select"]')
    expect(select.exists()).toBe(true)
  })

  it('renders one option element per provided option', () => {
    const wrapper = mount(UiSelect, { props: { options } })
    const rendered = wrapper.findAll('option')
    expect(rendered).toHaveLength(options.length)
    expect(wrapper.text()).toContain('Series')
  })

  it('preselects the current modelValue', () => {
    const wrapper = mount(UiSelect, { props: { options, modelValue: 'rating' } })
    expect((wrapper.find('[data-test="ui-select"]').element as HTMLSelectElement).value).toBe('rating')
  })

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(UiSelect, { props: { options } })
    await wrapper.find('[data-test="ui-select"]').setValue('series')
    await wrapper.find('[data-test="ui-select"]').trigger('change')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['series'])
  })

  it('passes disabled through to the native control', () => {
    const wrapper = mount(UiSelect, { props: { options, disabled: true } })
    expect(wrapper.find('[data-test="ui-select"]').attributes('disabled')).toBeDefined()
  })
})