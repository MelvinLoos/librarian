<template>
  <main class="mx-auto max-w-7xl px-4 pb-28 pt-2 sm:px-6 lg:px-8">
    <!-- Currently Reading Section -->
    <section 
      v-if="currentReading"
      id="currently-reading" 
      class="rounded-[2.5rem] border border-white/10 bg-[#0a0a0a]/80 p-5 shadow-2xl backdrop-blur-xl sm:p-6 lg:p-8"
    >
      <div class="flex flex-col gap-6 md:flex-row md:items-center">
        <div class="relative mx-auto w-full max-w-[18rem] overflow-hidden rounded-[2rem] shadow-2xl md:mx-0">
          <NuxtImg
            v-if="currentReading"
            :src="heroImageSrc"
            :alt="currentReading?.book?.title"
            @error="onHeroError"
            format="webp"
            loading="lazy"
            class="aspect-[2/3] w-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        <div class="flex-1 space-y-5 text-center md:text-left">
          <div class="space-y-2">
            <span class="inline-flex rounded-full bg-violet-600/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-violet-300">Currently Reading</span>
            <h2 class="text-4xl font-semibold tracking-tight text-white sm:text-5xl">{{ currentReading.book.title }}</h2>
            <p class="text-sm italic text-gray-300 sm:text-base">{{ currentReading.book.authorSort }}</p>
          </div>

          <div class="space-y-4 rounded-[2rem] bg-gray-950/70 p-5 text-left">
            <div class="flex items-center justify-between text-sm uppercase tracking-[0.25em] text-gray-500">
              <span>Progress</span>
              <span class="text-violet-300">{{ progressPercent }}%</span>
            </div>
            <div class="h-2.5 rounded-full bg-white/5">
              <div 
                class="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-300 shadow-[0_0_18px_rgba(168,85,247,0.35)] transition-all duration-1000"
                :style="{ width: `${progressPercent}%` }"
              ></div>
            </div>
            <p class="text-xs uppercase tracking-[0.24em] text-gray-400">
              Last read {{ lastReadDate }} • Page {{ currentReading.currentPage }} of {{ currentReading.totalPages }}
            </p>
          </div>

          <button class="w-full rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg transition hover:brightness-[1.05] md:w-auto">
            Continue Reading
          </button>
        </div>
      </div>
    </section>

    <section id="recent-additions" class="mt-10 space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h3 class="text-3xl font-semibold tracking-tight text-white">Recent Additions</h3>
        <NuxtLink to="/" class="text-sm uppercase tracking-[0.3em] text-violet-300 transition hover:text-white">View All</NuxtLink>
      </div>

      <div class="flex gap-4 overflow-x-auto pb-3 hide-scrollbar">
        <template v-if="pendingRecent">
          <div v-for="i in 5" :key="i" class="shrink-0 w-40 md:w-44 animate-pulse">
            <div class="aspect-[2/3] w-full rounded-[1.8rem] bg-white/5"></div>
            <div class="mt-2 h-3 w-3/4 rounded bg-white/5"></div>
            <div class="mt-1 h-2 w-1/2 rounded bg-white/5"></div>
          </div>
        </template>
        <template v-else>
          <div 
            v-for="book in recentBooks" 
            :key="book.id"
            class="shrink-0 w-40 md:w-44 rounded-[1.8rem] overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1 bg-gray-950/50 backdrop-blur-sm"
          >
            <div class="aspect-[2/3] w-full overflow-hidden">
              <NuxtImg
                :src="getBookCover(book)"
                :alt="book?.title"
                @error="onCarouselError(book.id)"
                format="webp"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
            <div class="space-y-1 px-1.5 py-2.5">
              <h4 class="truncate text-sm font-semibold text-white">{{ book.title }}</h4>
              <p class="truncate text-[10px] uppercase tracking-[0.22em] text-gray-400">
                {{ book.authors?.map(a => a.name).join(', ') || 'Unknown Author' }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </section>

    <section class="mt-10 space-y-6 text-center md:text-left">
      <h3 class="text-3xl font-semibold tracking-tight text-white">Your Library</h3>

      <div class="mt-8 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white active:bg-violet-600/10 active:text-violet-300">All</button>
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white">Fiction</button>
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white">Non-fiction</button>
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white">Sci-fi</button>
        <button class="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.28em] text-gray-200 transition hover:border-violet-400/40 hover:text-white">History</button>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <template v-if="pending">
          <BookSkeleton v-for="index in 10" :key="index" />
        </template>
        <template v-else>
          <BookCard
            v-for="book in library"
            :key="book.id || book.title"
            :book="book"
          />
        </template>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BookCard from '~/components/BookCard.vue'
import BookSkeleton from '~/components/BookSkeleton.vue'
import { useApiFetch } from '~/composables/useApiFetch';

// 1. Fetch recent additions
const { data: recentBooks, pending: pendingRecent } = useApiFetch<any[]>('/books?sort=timestamp&order=desc&limit=10')

// 2. Fetch all library books
const searchQuery = useState('search-query')
const { data: books, pending } = useApiFetch<any[]>('/books', {
  query: computed(() => ({
    search: searchQuery.value || undefined
  }))
})
const library = computed(() => books.value || [])

// 3. Fetch reading states (currently reading)
const { data: readingStates } = useApiFetch<any[]>('/users/me/reading-states')

const placeholder = '/placeholder-cover.png'

const currentReading = computed(() => {
  if (!readingStates.value || readingStates.value.length === 0) return null
  return readingStates.value[0]
})

// Safe hero image source
const heroImageSrc = ref(placeholder)
watch(currentReading, (newVal) => {
  if (newVal?.book?.hasCover) {
    heroImageSrc.value = `/api/assets/covers/${newVal.bookId}`
  } else {
    heroImageSrc.value = placeholder
  }
}, { immediate: true })

const onHeroError = () => {
  heroImageSrc.value = placeholder
}

// Track broken images in the carousel to show placeholder
const brokenImages = ref<Set<number>>(new Set())
const getBookCover = (book: any) => {
  if (!book?.hasCover || brokenImages.value.has(book.id)) {
    return placeholder
  }
  return `/api/assets/covers/${book.id}`
}

const onCarouselError = (bookId: number) => {
  brokenImages.value.add(bookId)
}

const progressPercent = computed(() => {
  if (!currentReading.value) return 0
  const percent = (currentReading.value.currentPage / currentReading.value.totalPages) * 100
  return Math.round(percent)
})

const lastReadDate = computed(() => {
  if (!currentReading.value) return ''
  const date = new Date(currentReading.value.updatedAt)
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>
