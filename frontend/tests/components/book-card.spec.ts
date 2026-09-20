import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { markRaw } from 'vue'
import BookCard from '~/components/BookCard.vue'
import UiCheckbox from '~/components/ui/UiCheckbox.vue'

const book = { id: 7, title: 'Dune', author: 'Frank Herbert', hasCover: false }

function mountCard(props: Record<string, unknown> = {}) {
  return mount(BookCard, {
    props: { book, ...props },
    global: {
      stubs: { NuxtLink: { template: '<a><slot /></a>' } },
      components: { UiCheckbox: markRaw(UiCheckbox) },
    },
  })
}

describe('BookCard (selection affordance)', () => {
  it('does not render a selection overlay when not selectable', () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-test="book-card-select"]').exists()).toBe(false)
  })

  it('renders a UiCheckbox overlay when selectable is true', () => {
    const wrapper = mountCard({ selectable: true, selected: false })
    const overlay = wrapper.find('[data-test="book-card-select"]')
    expect(overlay.exists()).toBe(true)
    expect(overlay.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('reflects the selected state on the overlay checkbox', () => {
    const wrapper = mountCard({ selectable: true, selected: true })
    const input = wrapper.find('[data-test="book-card-select"] input')
    expect((input.element as HTMLInputElement).checked).toBe(true)
  })

  it('marks the selection surface with data-selected="true" when selected', () => {
    const wrapper = mountCard({ selectable: true, selected: true })
    const surface = wrapper.find('[data-test="book-card-selection-surface"]')
    expect(surface.attributes('data-selected')).toBe('true')
  })

  it('keeps the selected highlight variant classes on the card root', () => {
    const wrapper = mountCard({ selectable: true, selected: true })
    const surface = wrapper.find('[data-test="book-card-selection-surface"]')
    expect(surface.attributes('class')).toContain('data-[selected=true]:ring-2')
  })

  it('emits update:selected with the book id and new state', async () => {
    const wrapper = mountCard({ selectable: true, selected: false })
    const input = wrapper.find('[data-test="book-card-select"] input')
    await input.setValue(true)
    await input.trigger('change')
    expect(wrapper.emitted('update:selected')?.[0]).toEqual([7, true])
  })
})