import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiTextarea from '~/components/ui/UiTextarea.vue'

describe('UiTextarea (atom)', () => {
  it('renders a textarea with a stable data-test hook', () => {
    const wrapper = mount(UiTextarea)
    expect(wrapper.find('[data-test="ui-textarea"]').exists()).toBe(true)
  })

  it('reflects the modelValue prop as textarea content', () => {
    const wrapper = mount(UiTextarea, { props: { modelValue: 'Once upon a time…' } })
    expect((wrapper.find('[data-test="ui-textarea"]').element as HTMLTextAreaElement).value).toBe(
      'Once upon a time…',
    )
  })

  it('emits update:modelValue when the user types', async () => {
    const wrapper = mount(UiTextarea)
    await wrapper.find('[data-test="ui-textarea"]').setValue('Chapter one.')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Chapter one.'])
  })

  it('forwards placeholder, rows and disabled attributes', () => {
    const wrapper = mount(UiTextarea, { props: { placeholder: 'Description', rows: 5, disabled: true } })
    const textarea = wrapper.find('[data-test="ui-textarea"]')
    expect(textarea.attributes('placeholder')).toBe('Description')
    expect(textarea.attributes('rows')).toBe('5')
    expect(textarea.attributes('disabled')).toBeDefined()
  })
})