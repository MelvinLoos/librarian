import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CatalogApi } from '~/infrastructure/api/CatalogApi'
import type { Book, Tag, ReadingProgress } from '~/domain/catalog/Catalog.types'

export const useSearchStore = defineStore('search', () => {
  // 1. STATE
  const query = ref('')
  const books = ref<Book[]>([])
  const recentBooks = ref<Book[]>([])
  const topTags = ref<Tag[]>([])
  const readingStates = ref<ReadingProgress[]>([])
  
  // UI Persistence (Keep from original store)
  const booksCache = ref<Record<string, Book[]>>({})
  const scrollY = ref(0)
  
  const pending = ref(false)
  const pendingRecent = ref(false)
  const pendingTags = ref(false)
  const pendingReading = ref(false)

  // 2. GETTERS
  const currentReading = computed(() => {
    if (readingStates.value.length === 0) return null
    return readingStates.value[0]
  })

  // 3. ACTIONS
  function setQuery(value: string) {
    query.value = value
  }

  async function fetchBooks(params?: Record<string, any>) {
    pending.value = true
    try {
      books.value = await CatalogApi.getAllBooks(params)
    } finally {
      pending.value = false
    }
  }

  async function fetchRecentBooks(limit: number = 10) {
    pendingRecent.value = true
    try {
      recentBooks.value = await CatalogApi.getRecentBooks(limit)
    } finally {
      pendingRecent.value = false
    }
  }

  async function fetchTopTags() {
    pendingTags.value = true
    try {
      topTags.value = await CatalogApi.getTopTags()
    } finally {
      pendingTags.value = false
    }
  }

  async function fetchReadingStates() {
    pendingReading.value = true
    try {
      readingStates.value = await CatalogApi.getReadingStates()
    } finally {
      pendingReading.value = false
    }
  }

  // Original Actions (Compat)
  function setScrollY(value: number) {
    scrollY.value = value
  }

  function setBooks(key: string, _books: Book[]) {
    booksCache.value[key] = _books
  }

  function getBooksFromCache(key: string) {
    return booksCache.value[key] || []
  }

  return {
    // State
    query,
    books,
    recentBooks,
    topTags,
    readingStates,
    booksCache,
    scrollY,
    pending,
    pendingRecent,
    pendingTags,
    pendingReading,
    
    // Getters
    currentReading,
    
    // Actions
    setQuery,
    setScrollY,
    setBooks,
    getBooksFromCache,
    fetchBooks,
    fetchRecentBooks,
    fetchTopTags,
    fetchReadingStates
  }
})
