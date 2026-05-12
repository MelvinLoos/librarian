<template>
  <main class="mx-auto max-w-7xl px-4 pb-28 pt-2 sm:px-6 lg:px-8">
    <section class="mt-10 space-y-6 text-center md:text-left">
      <div class="mb-8">
        <p class="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Local Storage</p>
        <h3 class="mt-2 text-3xl font-serif font-semibold tracking-tight text-on-surface">Your Downloads</h3>
      </div>

      <div v-if="isLoading" class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <BookSkeleton v-for="index in 10" :key="index" />
      </div>

      <div v-else-if="cachedBookDetails.length > 0" class="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <BookCard
          v-for="book in cachedBookDetails"
          :key="book.id || book.title"
          :book="book"
        />
      </div>

      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <div class="material-symbols-outlined text-8xl text-on-surface-variant/20 mb-4">download_for_offline</div>
        <h2 class="text-2xl font-serif font-semibold text-on-surface">No downloads yet.</h2>
        <p class="mt-2 text-on-surface-variant">Books you make available offline will appear here.</p>
        <NuxtLink to="/" class="mt-8 rounded-full border border-outline-variant/20 bg-surface-variant/10 px-8 py-3 text-sm font-bold uppercase tracking-widest text-on-surface shadow-lg backdrop-blur-md transition hover:bg-surface-variant/20 hover:text-primary">
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
