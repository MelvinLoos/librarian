<template>
  <section class="relative min-h-screen overflow-hidden bg-[#080e1a] text-gray-200">
    <div class="absolute inset-0">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        alt="Cover background"
        class="absolute inset-0 h-full w-full object-cover blur-3xl saturate-150 opacity-20"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-gray-950/40 to-gray-950" />
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <button
        @click="goBack"
        class="group inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-200 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:text-white hover:shadow-[0_0_20px_rgba(138,76,252,0.2)]"
        type="button"
      >
        <LucideArrowLeft class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to overview
      </button>

      <div class="rounded-[2.5rem] bg-gray-950/75 p-8 shadow-[0_20px_40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div class="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <!-- Actual Cover Image -->
            <div v-if="coverUrl" class="shrink-0 w-48 overflow-hidden rounded-2xl shadow-2xl">
               <img :src="coverUrl" :alt="book?.title" class="aspect-[2/3] w-full object-cover" />
            </div>
            
            <div class="flex-1">
              <p class="text-sm uppercase tracking-[0.3em] text-violet-400">Book details</p>
              <h1 class="mt-4 text-3xl font-serif font-semibold tracking-tight text-white md:text-5xl">{{ book?.title || 'Loading…' }}</h1>
              <p class="mt-4 text-lg text-violet-300">{{ book?.author || book?.authors?.map(a => a.name).join(', ') || 'Unknown author' }}</p>
            </div>
          </div>

          <div class="space-y-4 rounded-[2rem] bg-gray-900/65 p-6">
            <div class="text-sm uppercase tracking-[0.3em] text-gray-500">Series</div>
            <div class="text-base text-gray-200">{{ book?.series || 'Standalone' }}</div>
            
            <div class="text-sm uppercase tracking-[0.3em] text-gray-500">Tags</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in book?.tags || []"
                :key="tag"
                class="rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold text-violet-300"
              >
                {{ tag }}
              </span>
              <span v-if="!(book?.tags?.length)" class="text-sm text-gray-400">No tags available</span>
            </div>
          </div>
        </div>

        <div class="mt-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div 
            class="max-w-3xl text-sm leading-relaxed text-gray-300 opacity-90 prose prose-invert prose-p:mb-4 prose-a:text-violet-400"
            v-html="book?.description || 'No description available for this title.'"
          ></div>

          <div class="flex w-full shrink-0 flex-col gap-3 sm:w-48">
            <NuxtLink
              :to="`/read/${route.params.id}`"
              class="inline-flex w-full items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-600 to-fuchsia-500 px-8 py-3 text-sm font-semibold tracking-wide text-white shadow-[0_0_20px_rgba(138,76,252,0.3)] transition-all hover:scale-[1.02] hover:brightness-[1.1]"
            >
              Read Now
            </NuxtLink>

            <a
              :href="downloadUrl"
              class="inline-flex w-full items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-gray-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
              download
            >
              Download
            </a>

            <!-- ── Offline / Cache Section ─────────────────────────────── -->
            <div class="rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
              <!-- Header row: label + toggle -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    v-if="isOfflineReady"
                    class="material-symbols-outlined text-[18px] text-emerald-400"
                    title="Available offline"
                    aria-label="Available offline"
                  >offline_pin</span>
                  <span
                    v-else-if="isDownloading"
                    class="material-symbols-outlined text-[18px] animate-spin text-violet-400"
                    aria-label="Downloading…"
                  >sync</span>
                  <span
                    v-else
                    class="material-symbols-outlined text-[18px] text-gray-500"
                    aria-label="Not available offline"
                  >cloud_off</span>

                  <span class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                    Offline
                  </span>
                </div>

                <!-- Toggle button -->
                <button
                  type="button"
                  :aria-pressed="isOfflineReady || isDownloading"
                  :disabled="!cacheApiAvailable"
                  :title="toggleLabel"
                  class="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                  :class="(isOfflineReady || isDownloading) ? 'bg-violet-600' : 'bg-gray-700'"
                  @click="handleOfflineToggle"
                >
                  <span
                    class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
                    :class="(isOfflineReady || isDownloading) ? 'translate-x-5' : 'translate-x-0'"
                  />
                  <span class="sr-only">{{ toggleLabel }}</span>
                </button>
              </div>

              <!-- Status label -->
              <p
                class="mt-2 text-[10px] uppercase tracking-[0.2em]"
                :class="{
                  'text-emerald-400': isOfflineReady,
                  'text-violet-400': isDownloading,
                  'text-gray-500': !isOfflineReady && !isDownloading,
                }"
              >
                <template v-if="isOfflineReady">Available offline</template>
                <template v-else-if="isDownloading">Caching… {{ cacheProgress }}%</template>
                <template v-else>Not cached</template>
              </p>

              <!-- Progress bar (visible only while downloading) -->
              <div
                v-if="isDownloading"
                class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-700"
                role="progressbar"
                :aria-valuenow="cacheProgress"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-300"
                  :style="{ width: `${cacheProgress}%` }"
                />
              </div>
            </div>
            <!-- ── /Offline Section ────────────────────────────────────── -->
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { LucideArrowLeft } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useApiBase } from '~/composables/useApiBase'
import { useBookCacheStore } from '~/stores/bookCache'

const route = useRoute()
const router = useRouter()
const apiBase = useApiBase()
const { data: book } = useApiFetch(`/books/${route.params.id}`, {
  baseURL: apiBase,
})
const downloadUrl = computed(() => `/api/assets/books/${route.params.id}/download`)
const coverUrl = computed(() => book.value?.hasCover ? `/api/assets/covers/${route.params.id}` : null)

// ── Offline / cache ──────────────────────────────────────────────────────────
const bookCacheStore = useBookCacheStore()
const bookId = computed(() => Number(route.params.id))

const cacheStatus    = computed(() => bookCacheStore.getStatus(bookId.value))
const cacheProgress  = computed(() => bookCacheStore.getProgress(bookId.value))
const isOfflineReady = computed(() => cacheStatus.value === 'cached')
const isDownloading  = computed(() => cacheStatus.value === 'partial')
const cacheApiAvailable = computed(() => bookCacheStore.cacheApiAvailable)

const toggleLabel = computed(() => {
  if (isOfflineReady.value) return 'Remove offline copy'
  if (isDownloading.value)  return 'Cancel download'
  return 'Make available offline'
})

async function handleOfflineToggle() {
  if (!cacheApiAvailable.value) return
  if (isOfflineReady.value || isDownloading.value) {
    await bookCacheStore.clearCachedBook(bookId.value)
  } else {
    bookCacheStore.cacheBook(bookId.value).catch(() => {
      // error already logged inside the store
    })
  }
}

let cleanupSwListener: (() => void) | undefined

onMounted(() => {
  bookCacheStore.refreshCacheStatus([bookId.value])
  cleanupSwListener = bookCacheStore.initSwListener()
})

onBeforeUnmount(() => {
  cleanupSwListener?.()
})
// ── /Offline / cache ─────────────────────────────────────────────────────────

const goBack = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}
</script>
