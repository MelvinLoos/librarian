import type { Book, Tag, ReadingProgress, BookMetadataInput } from '~/domain/catalog/Catalog.types'

export const CatalogApi = {
  async getAllBooks(params?: Record<string, any>): Promise<Book[]> {
    const $api = useApi()
    return await $api<Book[]>('/api/books', {
      params,
    })
  },

  async getRecentBooks(limit: number = 10): Promise<Book[]> {
    return await this.getAllBooks({
      sort: 'timestamp',
      order: 'desc',
      limit
    })
  },

  async getTopTags(): Promise<Tag[]> {
    const $api = useApi()
    return await $api<Tag[]>('/api/tags/top')
  },

  async getBookById(id: number): Promise<Book> {
    const $api = useApi()
    return await $api<Book>(`/api/books/${id}`)
  },

  async updateBookMetadata(id: number, input: BookMetadataInput): Promise<Book> {
    const $api = useApi()
    return await $api<Book>(`/api/books/${id}`, {
      method: 'PATCH',
      body: input,
    })
  },

  async getReadingStates(): Promise<ReadingProgress[]> {
    const $api = useApi()
    return await $api<ReadingProgress[]>('/api/users/me/reading-states')
  }
}
