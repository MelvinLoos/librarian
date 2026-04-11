import { defineStore } from 'pinia'

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '' as string,
    booksCache: {} as Record<string, any[]>,
    scrollY: 0 as number,
  }),
  actions: {
    setQuery(value: string) {
      this.query = value
    },
    setBooks(key: string, books: any[]) {
      this.booksCache[key] = books
    },
    getBooks(key: string) {
      return this.booksCache[key] || []
    },
    setScrollY(value: number) {
      this.scrollY = value
    },
  },
})
