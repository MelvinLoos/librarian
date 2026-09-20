import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'

describe('UiCheckbox (atom)', () => {
  it('renders a checkbox with a label', () => {
    const wrapper = mount(UiCheckbox, { props: { label: 'Multiple values' } })
    const input = wrapper.find('[data-test="ui-checkbox"]')
    expect(input.exists()).toBe(true)
    expect(wrapper.text()).toContain('Multiple values')
  })

  it('reflects the modelValue checked state', () => {
    const wrapper = mount(UiCheckbox, { props: { modelValue: true, label: 'Yes' } })
    expect((wrapper.find('[data-test="ui-checkbox"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('emits update:modelValue with the new boolean when toggled', async () => {
    const wrapper = mount(UiCheckbox, { props: { label: 'Toggle' } })
    await wrapper.find('[data-test="ui-checkbox"]').setValue(true)
    await wrapper.find('[data-test="ui-checkbox"]').trigger('change')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('passes disabled through to the native control', () => {
    const wrapper = mount(UiCheckbox, { props: { disabled: true, label: 'No' } })
    expect(wrapper.find('[data-test="ui-checkbox"]').attributes('disabled')).toBeDefined()
  })
})