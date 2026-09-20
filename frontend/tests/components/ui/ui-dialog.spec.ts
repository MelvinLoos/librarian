import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UiDialog from '~/components/ui/UiDialog.vue'

describe('UiDialog (atom)', () => {
  it('renders nothing when closed', () => {
    const wrapper = mount(UiDialog, { props: { open: false, title: 'Edit' } })
    expect(wrapper.find('[data-test="ui-dialog"]').exists()).toBe(false)
  })

  it('renders a modal dialog overlay with the given title when open', () => {
    const wrapper = mount(UiDialog, { props: { open: true, title: 'Edit Metadata' } })
    const dialog = wrapper.find('[data-test="ui-dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-label')).toBe('Edit Metadata')
  })

  it('renders the body slot content', () => {
    const wrapper = mount(UiDialog, {
      props: { open: true, title: 'Edit' },
      slots: { default: '<p>Body copy</p>' },
    })
    expect(wrapper.text()).toContain('Body copy')
  })

  it('keeps the glassmorphic MD3 surface treatment', () => {
    const wrapper = mount(UiDialog, { props: { open: true, title: 'Edit' } })
    const panel = wrapper.find('[data-test="ui-dialog-panel"]')
    const cls = panel.attributes('class') || ''
    expect(cls).toContain('bg-surface-container-high')
    expect(cls).toContain('backdrop-blur')
  })

  it('emits close when the dismiss button is pressed', async () => {
    const wrapper = mount(UiDialog, { props: { open: true, title: 'Edit' } })
    await wrapper.find('[data-test="ui-dialog-close"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})