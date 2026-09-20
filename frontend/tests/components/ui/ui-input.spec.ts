import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiInput from '~/components/ui/UiInput.vue'

describe('UiInput (atom)', () => {
  it('renders a text input with a stable data-test hook', () => {
    const wrapper = mount(UiInput)
    const input = wrapper.find('[data-test="ui-input"]')
    expect(input.exists()).toBe(true)
  })

  it('reflects the modelValue prop as the input value', () => {
    const wrapper = mount(UiInput, { props: { modelValue: 'Dune' } })
    expect((wrapper.find('[data-test="ui-input"]').element as HTMLInputElement).value).toBe('Dune')
  })

  it('emits update:modelValue when the user types', async () => {
    const wrapper = mount(UiInput)
    await wrapper.find('[data-test="ui-input"]').setValue('Hyperion')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Hyperion'])
  })

  it('forwards type and placeholder attributes', () => {
    const wrapper = mount(UiInput, { props: { type: 'number', placeholder: 'Pages' } })
    const input = wrapper.find('[data-test="ui-input"]')
    expect(input.attributes('type')).toBe('number')
    expect(input.attributes('placeholder')).toBe('Pages')
  })

  it('marks invalid inputs for assistive tech', () => {
    const wrapper = mount(UiInput, { props: { invalid: true } })
    const input = wrapper.find('[data-test="ui-input"]')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('class')).toContain('outline-error')
  })

  it('exposes required state via aria-required', () => {
    const wrapper = mount(UiInput, { props: { required: true } })
    expect(wrapper.find('[data-test="ui-input"]').attributes('aria-required')).toBe('true')
  })

  it('passes disabled through to the native control', () => {
    const wrapper = mount(UiInput, { props: { disabled: true } })
    expect(wrapper.find('[data-test="ui-input"]').attributes('disabled')).toBeDefined()
  })
})