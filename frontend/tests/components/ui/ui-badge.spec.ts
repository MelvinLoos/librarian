import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiBadge from '~/components/ui/UiBadge.vue'

describe('UiBadge (atom)', () => {
  it('renders the label text in a badge element', () => {
    const wrapper = mount(UiBadge, { props: { label: 'Fantasy' } })
    const badge = wrapper.find('[data-test="ui-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('Fantasy')
  })

  it('exposes the variant via data-variant for theming hooks', () => {
    const wrapper = mount(UiBadge, { props: { label: 'Sci-Fi' } })
    expect(wrapper.attributes('data-variant')).toBe('default')
  })

  it('applies the primary variant when requested', () => {
    const wrapper = mount(UiBadge, { props: { label: 'Classic', variant: 'primary' } })
    expect(wrapper.attributes('data-variant')).toBe('primary')
  })

  it('supports the outlined variant', () => {
    const wrapper = mount(UiBadge, { props: { label: 'Non-fiction', variant: 'outlined' } })
    expect(wrapper.attributes('data-variant')).toBe('outlined')
  })

  it('renders as the configured tag for semantic markup', () => {
    const wrapper = mount(UiBadge, { props: { label: 'Anthology', tag: 'li' } })
    expect(wrapper.find('li[data-test="ui-badge"]').exists()).toBe(true)
  })
})