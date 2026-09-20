<template>
  <section class="relative min-h-screen overflow-hidden bg-surface text-on-surface">
    <div class="absolute inset-0">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        alt="Cover background"
        class="absolute inset-0 h-full w-full object-cover blur-3xl saturate-150 opacity-20"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-surface/40 to-surface" />
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
      <UiButton
        data-test="back-button"
        tone="ghost"
        size="sm"
        @click="goBack"
      >
        <LucideArrowLeft class="h-4 w-4 group-hover:-translate-x-1" />
        Back to overview
      </UiButton>

      <div class="rounded-[2.5rem] bg-surface-container-high/75 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div class="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <!-- Actual Cover Image -->
            <div v-if="coverUrl" class="shrink-0 w-48 overflow-hidden rounded-2xl shadow-2xl">
               <img :src="coverUrl" :alt="book?.title" class="aspect-[2/3] w-full object-cover" />
            </div>
            
            <div class="flex-1">
              <p class="text-sm uppercase tracking-[0.3em] text-primary">Book details</p>
              <h1 class="mt-4 text-3xl font-serif font-semibold tracking-tight text-on-surface md:text-5xl">{{ book?.title || 'Loading…' }}</h1>
              <p class="mt-4 text-lg text-secondary">{{ book?.author || book?.authors?.map(a => a.name).join(', ') || 'Unknown author' }}</p>
              <UiButton
                type="button"
                data-test="edit-metadata"
                tone="secondary"
                size="sm"
                @click="showEditModal = true"
              >
                Edit Metadata
              </UiButton>
            </div>
          </div>

          <div class="space-y-4 rounded-[2rem] bg-surface-variant/10 p-6">
            <div class="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant">Series</div>
            <div class="text-base text-on-surface">{{ book?.series || 'Standalone' }}</div>
            
            <div class="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant">Tags</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in book?.tags || []"
                :key="tag"
                class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                {{ tag }}
              </span>
              <span v-if="!(book?.tags?.length)" class="text-sm text-on-surface-variant">No tags available</span>
            </div>
          </div>
        </div>

        <div class="mt-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div 
            class="max-w-3xl text-sm leading-relaxed text-on-surface-variant opacity-90 prose prose-p:mb-4 prose-a:text-primary"
            v-html="book?.description || 'No description available for this title.'"
          ></div>

          <div class="flex w-full shrink-0 flex-col gap-3 sm:w-48">
            <NuxtLink
              :to="`/read/${route.params.id}`"
              class="inline-flex w-full items-center justify-center rounded-[2rem] bg-primary-gradient px-8 py-3 text-sm font-semibold tracking-wide text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:brightness-[1.1]"
            >
              Read Now
            </NuxtLink>

            <a
              :href="downloadUrl"
              class="inline-flex w-full items-center justify-center rounded-[2rem] border border-outline-variant/10 bg-surface-variant/10 px-6 py-3 text-sm font-semibold text-on-surface backdrop-blur-md transition-all hover:bg-surface-variant/20"
              download
            >
              Download
            </a>

            <!-- ── Offline / Cache Section ─────────────────────────────── -->
            <div class="rounded-[2rem] border border-outline-variant/10 bg-surface-variant/5 px-5 py-4 backdrop-blur-md">
              <!-- Header row: label + toggle -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    v-if="isOfflineReady"
                    class="material-symbols-outlined text-[18px] text-emerald-500"
                    title="Available offline"
                    aria-label="Available offline"
                  >offline_pin</span>
                  <span
                    v-else-if="isDownloading"
                    class="material-symbols-outlined text-[18px] animate-spin text-primary"
                    aria-label="Downloading…"
                  >sync</span>
                  <span
                    v-else
                    class="material-symbols-outlined text-[18px] text-on-surface-variant/50"
                    aria-label="Not available offline"
                  >cloud_off</span>

                  <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                    Offline
                  </span>
                </div>

                <!-- Toggle button -->
                <button
                  type="button"
                  data-test="offline-toggle"
                  :aria-pressed="isOfflineReady || isDownloading"
                  :disabled="!cacheApiAvailable"
                  :title="toggleLabel"
                  class="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
                  :class="(isOfflineReady || isDownloading) ? 'bg-primary' : 'bg-surface-variant'"
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
                  'text-emerald-500': isOfflineReady,
                  'text-primary': isDownloading,
                  'text-on-surface-variant/50': !isOfflineReady && !isDownloading,
                }"
              >
                <template v-if="isOfflineReady">Available offline</template>
                <template v-else-if="isDownloading">Caching… {{ cacheProgress }}%</template>
                <template v-else>Not cached</template>
              </p>

              <!-- Progress bar (visible only while downloading) -->
              <div
                v-if="isDownloading"
                class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-variant/20"
                role="progressbar"
                :aria-valuenow="cacheProgress"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="h-full rounded-full bg-primary-gradient transition-all duration-300"
                  :style="{ width: `${cacheProgress}%` }"
                />
              </div>
            </div>
            <!-- ── /Offline Section ────────────────────────────────────── -->
          </div>
        </div>
      </div>
    </div>

    <EditMetadataModal
      :open="showEditModal"
      :book="book"
      data-test="edit-metadata-modal"
      @close="showEditModal = false"
      @saved="onMetadataSaved"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { LucideArrowLeft } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useApiBase } from '~/composables/useApiBase'
import { useBookCacheStore } from '~/stores/bookCache'
import EditMetadataModal from '~/components/EditMetadataModal.vue'
import type { Book } from '~/domain/catalog/Catalog.types'

const route = useRoute()
const router = useRouter()
const apiBase = useApiBase()
const { data: book } = useApiFetch(`/books/${route.params.id}`, {
  baseURL: apiBase,
})
const downloadUrl = computed(() => `/api/assets/books/${route.params.id}/download`)
const coverUrl = computed(() => book.value?.hasCover ? `/api/assets/covers/${route.params.id}` : null)

// ── Edit metadata ────────────────────────────────────────────────────────────
const showEditModal = ref(false)

function onMetadataSaved(updated: Book) {
  book.value = { ...book.value, ...updated }
  showEditModal.value = false
}

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
    bookCacheStore.clearBookMeta(bookId.value)
  } else {
    // Optimistically set metadata for the Downloads page.
    // We strip extraneous fields like 'comments' or 'description' to save LS space.
    bookCacheStore.setBookMeta(bookId.value, {
      id: bookId.value,
      title: book.value?.title ?? 'Unknown Title',
      authors: book.value?.authors ?? [],
      hasCover: book.value?.hasCover ?? false,
    })

    bookCacheStore.cacheBook(bookId.value).catch(() => {
      // If download fails completely, remove meta
      bookCacheStore.clearBookMeta(bookId.value)
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
