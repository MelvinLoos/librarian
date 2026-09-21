import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BookCard from '~/components/BookCard.vue'

const book = { id: 1, title: 'Dune', author: 'Frank Herbert' }

function mountCard(extraProps: Record<string, unknown> = {}) {
  return mount(BookCard, {
    props: { book, ...extraProps },
    global: {
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
      },
    },
  })
}

describe('BookCard (visual selection affordance)', () => {
  it('marks the outer card wrapper as selected with the ring affordance', () => {
    const wrapper = mountCard({ selected: true })
    const card = wrapper.find('[data-test="book-card"]')

    expect(card.exists()).toBe(true)
    expect(card.attributes('data-selected')).toBe('true')
    expect(card.attributes('class') ?? '').toContain('data-[selected=true]:ring-2')
  })

  it('omits the selection affordance when the card is not selected', () => {
    const wrapper = mountCard()
    const card = wrapper.find('[data-test="book-card"]')

    // The ring variant only activates through data-selected="true"; an
    // unselected card must not carry it (the class string itself is static
    // so Tailwind can compile the variant — activation is attribute-driven).
    expect(card.exists()).toBe(true)
    expect(card.attributes('data-selected')).toBeUndefined()
  })
})