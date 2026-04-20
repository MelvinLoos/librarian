<template>
  <main class="mx-auto max-w-7xl px-4 pb-28 pt-2 sm:px-6 lg:px-8">
    <section class="mt-10 space-y-6 text-center md:text-left">
      <h3 class="text-3xl font-semibold tracking-tight text-white">Your Downloads</h3>

      <div v-if="isLoading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <BookSkeleton v-for="index in 10" :key="index" />
      </div>

      <div v-else-if="cachedBookDetails.length > 0" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <BookCard
          v-for="book in cachedBookDetails"
          :key="book.id || book.title"
          :book="book"
        />
      </div>

      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <h2 class="text-display-lg text-white">No downloads yet.</h2>
        <NuxtLink to="/" class="mt-8 rounded-full border border-gray-600/50 bg-gray-900/50 px-8 py-3 text-lg font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-gray-800/60">
          Go to Library
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import BookCard from '~/components/BookCard.vue'
import BookSkeleton from '~/components/BookSkeleton.vue'
import { useBookCacheStore } from '~/stores/bookCache'
import { useSearchStore } from '~/stores/search'
import type { Book } from '~/domain/catalog/Catalog.types'

const bookCacheStore = useBookCacheStore()
const searchStore = useSearchStore()
const router = useRouter()

const isLoading = ref(true)
const cachedBookDetails = ref<Book[]>([])

let cleanupSwListener: (() => void) | undefined

onMounted(async () => {
  // Initialize service worker listener and store its cleanup function
  cleanupSwListener = bookCacheStore.initSwListener()

  // Refresh cache status from the service worker
  await bookCacheStore.refreshCacheStatus()

  // Ensure all books metadata is available to cross-reference
  // If no books are fetched, it means the user was likely offline
  // before visiting other pages, and we'll fallback to an empty state.
  // This call does *not* make a network request if data is already fetched.
  // The searchStore.books are typically populated when the app first loads or
  // by navigating to the index page while online.
  if (searchStore.books.length === 0) {
    // Attempt to fetch books. If offline, this will resolve to empty.
    await searchStore.fetchBooks()
  }

  // Populate cachedBookDetails based on current cache status and available book data
  updateCachedBookDetails()

  isLoading.value = false
})

onBeforeUnmount(() => {
  // Clean up the service worker listener when the component is unmounted
  if (cleanupSwListener) {
    cleanupSwListener()
  }
})

// Watch for changes in the cache status map or search store's books
watch([() => bookCacheStore.cacheStatusMap, () => searchStore.books], () => {
  updateCachedBookDetails()
}, { deep: true }) // Deep watch for cacheStatusMap changes inside

function updateCachedBookDetails() {
  const allBooks = searchStore.books
  const currentlyCachedBookIds = Object.keys(bookCacheStore.cacheStatusMap)
    .map(Number)
    .filter(bookId => bookCacheStore.isCached(bookId))

  cachedBookDetails.value = allBooks.filter(book =>
    currentlyCachedBookIds.includes(book.id)
  )
}
</script>

<style scoped>
/* Add any component-specific styles here if necessary */
</style>
