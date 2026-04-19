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
        class="inline-flex items-center gap-2 rounded-full bg-gray-900/70 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-900"
        type="button"
      >
        <LucideArrowLeft class="h-4 w-4" />
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

        <div class="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p class="max-w-2xl text-sm leading-7 text-gray-300">{{ book?.description || 'A cinematic view of the book metadata with author, series, and download action.' }}</p>

          <div class="flex gap-4">
            <NuxtLink
              :to="`/read/${route.params.id}`"
              class="inline-flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-600 to-fuchsia-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-[1.05]"
            >
              Read Now
            </NuxtLink>

            <a
              :href="downloadUrl"
              class="inline-flex items-center justify-center rounded-[2rem] bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              download
            >
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LucideArrowLeft } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useApiBase } from '~/composables/useApiBase'

const route = useRoute()
const router = useRouter()
const apiBase = useApiBase()
const { data: book } = useApiFetch(`/books/${route.params.id}`, {
  baseURL: apiBase,
})
const downloadUrl = computed(() => `${apiBase}/assets/download/${route.params.id}`)
const coverUrl = computed(() => book.value?.hasCover ? `/api/assets/covers/${route.params.id}` : null)

const goBack = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}
</script>
