<template>
  <div class="px-4 py-8 sm:px-6 lg:px-8">
    <!-- Hero / Currently Reading (Visual Anchor) -->
    <section v-if="currentReading" class="relative mb-16 overflow-hidden rounded-[3rem] bg-surface-container-high/65 p-6 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
      <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
      <div class="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl"></div>

      <div class="relative flex flex-col gap-8 md:flex-row md:items-center">
        <NuxtLink :to="`/book/${currentReading.bookId}`" class="block shrink-0 w-40 md:w-44 rounded-[1.8rem] overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1 bg-surface-variant/10 backdrop-blur-sm">
          <img
            v-if="currentReading.book?.hasCover"
            :src="`/api/assets/covers/${currentReading.bookId}`"
            class="aspect-[2/3] w-full object-cover"
            alt="Current reading cover"
          />
          <div v-else class="aspect-[2/3] w-full flex items-center justify-center text-on-surface-variant/40">
            <span class="material-symbols-outlined text-4xl">book</span>
          </div>
        </NuxtLink>

        <div class="flex-1 space-y-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.4em] text-primary">Resume Reading</p>
            <h2 class="mt-2 text-4xl font-serif font-semibold tracking-tight text-on-surface sm:text-5xl">{{ currentReading.book?.title }}</h2>
            <p class="mt-2 text-sm italic text-secondary sm:text-base">{{ currentReading.book?.authorSort }}</p>
          </div>

          <div class="max-w-md space-y-2">
            <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
              <span>Progress</span>
              <span>{{ Math.round(currentReading.percentage || 0) }}%</span>
            </div>
            <div class="h-2.5 rounded-full bg-surface-variant/20 overflow-hidden">
               <div class="h-full bg-primary-gradient shadow-[0_0_15px_rgba(var(--color-primary),0.5)] transition-all duration-500" :style="{ width: `${currentReading.percentage}%` }"></div>
            </div>
          </div>

          <NuxtLink
            :to="`/read/${currentReading.bookId}`"
            class="mt-4 inline-flex justify-center w-full rounded-full bg-primary-gradient px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-on-primary shadow-lg shadow-primary/20 transition hover:brightness-[1.05] md:w-auto"
          >
            Continue Journey
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Recent Additions (Nocturnal Carousel Style) -->
    <section class="mb-16">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Newly Acquired</p>
          <h3 class="mt-2 text-3xl font-serif font-semibold tracking-tight text-on-surface">Recent Additions</h3>
        </div>
        <NuxtLink to="/" class="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-primary transition hover:text-primary-dim">View All</NuxtLink>
      </div>

      <div v-if="selection.count > 0" class="mt-2 flex items-center gap-3 rounded-full bg-primary/10 px-5 py-2.5">
        <span class="text-sm text-on-surface">{{ selection.count }} selected</span>
        <button
          data-test="edit-selection"
          class="rounded-full bg-primary-gradient px-5 py-1.5 text-sm font-semibold text-on-primary"
          @click="showBulkModal = true"
        >
          Edit selection
        </button>
      </div>

      <div class="hide-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        <div v-for="book in recentBooks" :key="book.id" class="w-40 shrink-0 sm:w-48">
          <label class="flex items-center gap-2 text-xs text-on-surface-variant" :data-test="`book-select-${book.id}`">
            <input
              type="checkbox"
              :checked="selection.has(book.id)"
              @change="selection.toggle(book.id)"
            />
            Select
          </label>
          <BookCard :book="book" :selected="selection.has(book.id)" />
        </div>
      </div>
    </section>

    <!-- Main Library Grid -->
    <section>
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">The Collection</p>
          <h3 class="mt-2 text-3xl font-serif font-semibold tracking-tight text-on-surface">Your Library</h3>
        </div>

        <!-- Tag Filter (Editorial Style) -->
        <div class="flex flex-wrap gap-2">
          <button
            @click="selectedTag = null"
            class="rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300"
            :class="!selectedTag ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-variant/10 text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface'"
          >
            All
          </button>
          <button
            v-for="tag in topTags"
            :key="tag.name"
            @click="selectedTag = tag.name"
            class="rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-300"
            :class="selectedTag === tag.name ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-variant/10 text-on-surface-variant hover:bg-surface-variant/20 hover:text-on-surface'"
          >
            {{ tag.name }}
          </button>
        </div>
      </div>

      <div v-if="pending" class="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <div v-for="i in 10" :key="i" class="space-y-4">
          <div class="aspect-[2/3] w-full rounded-[1.8rem] bg-surface-variant/10 animate-pulse"></div>
          <div class="h-3 w-3/4 rounded bg-surface-variant/10 animate-pulse"></div>
          <div class="h-2 w-1/2 rounded bg-surface-variant/10 animate-pulse"></div>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <BookCard
          v-for="book in filteredBooks"
          :key="book.id"
          :book="book"
          :reading-progress="getReadingProgress(book.id)"
          :selected="selection.has(book.id)"
        />
      </div>

      <div v-if="!pending && filteredBooks.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
        <span class="material-symbols-outlined text-6xl text-on-surface-variant/20">search_off</span>
        <p class="mt-4 text-on-surface-variant">No books found in this niche.</p>
      </div>
    </section>

    <!-- Offline State Placeholder -->
    <div v-if="isOffline && filteredBooks.length === 0" class="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div class="material-symbols-outlined text-8xl text-primary animate-pulse">cloud_off</div>
      <h2 class="mt-8 text-4xl font-serif font-semibold text-on-surface">You are offline.</h2>
      <p class="mt-4 max-w-md text-on-surface-variant">Access your downloaded books even without an internet connection.</p>
      <NuxtLink to="/downloads" class="mt-8 rounded-full border border-outline-variant/20 bg-surface-variant/10 px-8 py-3 text-sm font-bold uppercase tracking-widest text-on-surface shadow-lg backdrop-blur-md transition hover:bg-surface-variant/20 hover:text-primary">
        View Downloads
      </NuxtLink>
    </div>

    <BulkEditModal :open="showBulkModal" :book-ids="selection.selectedIds" @close="showBulkModal = false" @updated="onBulkUpdated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useApiBase } from '~/composables/useApiBase'
import { useSearchStore } from '~/stores/search'
import { useOnlineStatus } from '~/composables/useOnlineStatus'
import { useLibrarySelectionStore } from '~/stores/librarySelection'
import BookCard from '~/components/BookCard.vue'
import BulkEditModal from '~/components/BulkEditModal.vue'

const apiBase = useApiBase()
const searchStore = useSearchStore()
const { isOffline } = useOnlineStatus()
const selectedTag = ref<string | null>(null)

const { data: books, pending } = useApiFetch('/books', {
  baseURL: apiBase,
  transform: (res: any) => res || []
})

const { data: readingStatus } = useApiFetch('/users/me/reading-states', {
  baseURL: apiBase,
  transform: (res: any) => res || []
})

const currentReading = computed(() => {
  if (!readingStatus.value?.length || !books.value?.length) return null
  const latest = readingStatus.value[0]
  const book = books.value.find((b: any) => b.id === latest.bookId)
  return book ? { ...latest, book } : null
})

const recentBooks = computed(() => {
  if (!books.value) return []
  return [...books.value].sort((a: any, b: any) => b.id - a.id).slice(0, 10)
})

const topTags = computed(() => {
  if (!books.value) return []
  const tags: Record<string, number> = {}
  books.value.forEach((b: any) => {
    b.tags?.forEach((t: string) => {
      tags[t] = (tags[t] || 0) + 1
    })
  })
  return Object.entries(tags)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

const filteredBooks = computed(() => {
  if (!books.value) return []
  let result = books.value

  if (searchStore.query) {
    const q = searchStore.query.toLowerCase()
    result = result.filter((b: any) =>
      b.title.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.series?.toLowerCase().includes(q)
    )
  }

  if (selectedTag.value) {
    result = result.filter((b: any) => b.tags?.includes(selectedTag.value))
  }

  return result
})

const getReadingProgress = (bookId: number) => {
  const state = readingStatus.value?.find((s: any) => s.bookId === bookId)
  return state?.percentage
}

const selection = useLibrarySelectionStore()
const showBulkModal = ref(false)

const onBulkUpdated = (updatedBooks: any[]) => {
  if (!books.value) return
  const byId = new Map(updatedBooks.map((book) => [Number(book.id), book]))
  books.value = books.value.map((book: any) => byId.get(Number(book.id)) ?? book)
  selection.clear()
}
</script>
