import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiButton from '~/components/ui/UiButton.vue'

describe('UiButton (atom)', () => {
  it('renders a button with a stable data-test hook', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Save' } })
    const button = wrapper.find('[data-test="ui-button"]')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
  })

  it('renders the default slot content', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Save changes' } })
    expect(wrapper.text()).toContain('Save changes')
  })

  it('applies the primary tone and md size variants by default', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Go' } })
    const cls = wrapper.find('[data-test="ui-button"]').attributes('class') || ''
    expect(cls).toContain('bg-primary')
    expect(cls).toMatch(/px-4|px-6/)
  })

  it('applies the given tone variant', () => {
    const wrapper = mount(UiButton, { props: { tone: 'error' }, slots: { default: 'Delete' } })
    const cls = wrapper.find('[data-test="ui-button"]').attributes('class') || ''
    expect(cls).toContain('bg-error')
  })

  it('emits click on press', async () => {
    const wrapper = mount(UiButton, { slots: { default: 'Click' } })
    await wrapper.find('[data-test="ui-button"]').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('forwards type="submit"', () => {
    const wrapper = mount(UiButton, { props: { type: 'submit' }, slots: { default: 'Send' } })
    expect(wrapper.find('[data-test="ui-button"]').attributes('type')).toBe('submit')
  })

  it('does not emit click while disabled', async () => {
    const wrapper = mount(UiButton, { props: { disabled: true }, slots: { default: 'X' } })
    const button = wrapper.find('[data-test="ui-button"]')
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('announces loading state via aria-busy and disables the control', () => {
    const wrapper = mount(UiButton, { props: { loading: true }, slots: { default: 'Saving…' } })
    const button = wrapper.find('[data-test="ui-button"]')
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Saving…')
  })
})