import type { Book, Tag, ReadingProgress } from '~/domain/catalog/Catalog.types'
import { useAuthStore } from '~/stores/auth'

export const CatalogApi = {
  /**
   * Helper to get common fetch options (like Authorization header)
   */
  getCommonOptions() {
    const authStore = useAuthStore()
    const headers: Record<string, string> = {}
    
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }
    
    return { headers }
  },

  async getAllBooks(params?: Record<string, any>): Promise<Book[]> {
    return await $fetch<Book[]>('/api/books', {
      ...this.getCommonOptions(),
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
    return await $fetch<Tag[]>('/api/tags/top', {
      ...this.getCommonOptions(),
    })
  },

  async getBookById(id: number): Promise<Book> {
    return await $fetch<Book>(`/api/books/${id}`, {
      ...this.getCommonOptions(),
    })
  },

  async getReadingStates(): Promise<ReadingProgress[]> {
    return await $fetch<ReadingProgress[]>('/api/users/me/reading-states', {
      ...this.getCommonOptions(),
    })
  }
}
