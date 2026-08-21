import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { mockUpdateBookMetadata } = vi.hoisted(() => ({
  mockUpdateBookMetadata: vi.fn(),
}))

vi.mock('~/infrastructure/api/CatalogApi', () => ({
  CatalogApi: {
    updateBookMetadata: mockUpdateBookMetadata,
  },
}))

import EditMetadataModal from '~/components/EditMetadataModal.vue'

const book = {
  id: 42,
  title: 'The Way of Kings',
  authors: [{ id: 1, name: 'Brandon Sanderson' }],
  tags: [{ id: 2, name: 'Fantasy' }],
  series: { id: 3, name: 'The Stormlight Archive' },
  rating: 4.5,
  publisher: 'Tor Books',
  description: 'An epic fantasy novel',
  identifiers: [{ type: 'isbn', value: '9780765326355' }],
}

function mountModal() {
  return mount(EditMetadataModal, {
    props: {
      open: true,
      book: book as any,
    },
  })
}

describe('EditMetadataModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefills form fields from the book prop', () => {
    const wrapper = mountModal()

    expect((wrapper.find('[data-test="title"]').element as HTMLInputElement).value).toBe(
      'The Way of Kings',
    )
    expect((wrapper.find('[data-test="publisher"]').element as HTMLInputElement).value).toBe(
      'Tor Books',
    )
    expect((wrapper.find('[data-test="rating"]').element as HTMLInputElement).value).toBe('4.5')
    expect((wrapper.find('[data-test="authors"]').element as HTMLInputElement).value).toBe(
      'Brandon Sanderson',
    )
    expect((wrapper.find('[data-test="tags"]').element as HTMLInputElement).value).toBe('Fantasy')
    expect((wrapper.find('[data-test="series"]').element as HTMLInputElement).value).toBe(
      'The Stormlight Archive',
    )
  })

  it('emits close when the cancel button is clicked', async () => {
    const wrapper = mountModal()

    await wrapper.find('[data-test="cancel"]').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('submits metadata changes and emits saved with the response', async () => {
    const response = { ...book, title: 'Updated Title' }
    mockUpdateBookMetadata.mockResolvedValue(response)

    const wrapper = mountModal()

    await wrapper.find('[data-test="title"]').setValue('Updated Title')
    await wrapper.find('[data-test="submit"]').trigger('click')
    await flushPromises()

    expect(mockUpdateBookMetadata).toHaveBeenCalledWith(42, expect.objectContaining({
      title: 'Updated Title',
      rating: 4.5,
      publisher: 'Tor Books',
    }))
    expect(wrapper.emitted('saved')?.[0]).toEqual([response])
  })

  it('maps comma-separated authors/tags into arrays in the payload', async () => {
    mockUpdateBookMetadata.mockResolvedValue(book)

    const wrapper = mountModal()

    await wrapper.find('[data-test="authors"]').setValue('Author One, Author Two')
    await wrapper.find('[data-test="tags"]').setValue('Tag A, Tag B')
    await wrapper.find('[data-test="submit"]').trigger('click')
    await flushPromises()

    const call = mockUpdateBookMetadata.mock.calls[0]!
    const payload = call[1]
    expect(payload.authors).toEqual([{ name: 'Author One' }, { name: 'Author Two' }])
    expect(payload.tags).toEqual([{ name: 'Tag A' }, { name: 'Tag B' }])
  })

  it('does not render form fields when closed', () => {
    const wrapper = mount(EditMetadataModal, {
      props: { open: false, book: book as any },
    })

    expect(wrapper.find('[data-test="title"]').exists()).toBe(false)
  })
})