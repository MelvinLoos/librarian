<template>
  <div class="fixed inset-0 z-[100] flex flex-col bg-[#080e1a] text-gray-200">
    <header class="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#080e1a]/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div v-if="bookMetadata">
          <h1 class="text-sm font-semibold text-white sm:text-base">{{ bookMetadata.title }}</h1>
          <p v-if="activeFormat === 'EPUB'" class="text-xs text-gray-400">{{ progressPercent }}% Read</p>
          <p v-else class="text-xs text-gray-400">PDF Document</p>
        </div>
      </div>
      
      <div v-if="activeFormat === 'EPUB'" class="flex gap-2">
        <button @click="prevPage" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button @click="nextPage" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </header>

    <div class="relative flex-1 overflow-hidden">
      <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p class="text-sm uppercase tracking-widest text-violet-300">Loading Book...</p>
      </div>
      
      <div v-show="activeFormat === 'EPUB'" id="viewer" class="h-full w-full"></div>

      <iframe 
        v-if="activeFormat === 'PDF' && pdfUrl" 
        :src="pdfUrl" 
        class="h-full w-full border-none"
      ></iframe>
      
      <div v-if="!isLoading && !activeFormat" class="absolute inset-0 flex flex-col items-center justify-center">
        <p class="text-gray-400">No readable format found for this book.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import ePub from 'epubjs'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const $api = useApi()
const bookId = route.params.id as string

const isLoading = ref(true)
const bookMetadata = ref<any>(null)
const progressPercent = ref(0)
const activeFormat = ref<'EPUB' | 'PDF' | null>(null)
const pdfUrl = ref<string | null>(null)

let epubBook: any = null
let rendition: any = null
let saveProgressTimeout: any = null

onMounted(async () => {
  try {
    // 1. Fetch Metadata to determine formats
    bookMetadata.value = await $api(`/books/${bookId}`)
    
    // Simplistic format check: verify if the data array contains EPUB or PDF
    const formats = bookMetadata.value?.formats?.map((f: any) => f.format.toUpperCase()) || []
    
    if (formats.includes('EPUB')) {
      activeFormat.value = 'EPUB'
      await loadEpub()
    } else if (formats.includes('PDF')) {
      activeFormat.value = 'PDF'
      // Browser will automatically send the auth cookie for the iframe request
      pdfUrl.value = `/api/assets/books/${bookId}/stream?format=PDF`
      isLoading.value = false
    } else {
      isLoading.value = false
    }
  } catch (e) {
    console.error('Failed to load book', e)
    isLoading.value = false
  }
})

const loadEpub = async () => {
  try {
    // Fetch via authenticated API as an ArrayBuffer to prevent container.xml 404
    const buffer = await $api(`/assets/books/${bookId}/stream?format=EPUB`, { 
      responseType: 'arrayBuffer' 
    })
    
    epubBook = ePub(buffer as ArrayBuffer)

    rendition = epubBook.renderTo('viewer', {
      width: '100%',
      height: '100%',
      spread: 'none',
      manager: 'continuous',
      flow: 'scrolled',
    })

    rendition.themes.default({
      body: { background: '#080e1a', color: '#e0e5f6' },
      p: { 'font-family': 'Manrope, sans-serif', 'font-size': '1.1rem', 'line-height': '1.6' },
      h1: { 'font-family': 'Newsreader, serif', color: '#bd9dff' },
      a: { color: '#c38bf5' }
    })

    // Fetch saved reading states (Matches your ProgressController.ts exactly)
    const states: any = await $api('/users/me/reading-states')
    const savedState = states.find((s: any) => s.bookId === parseInt(bookId))
    
    if (savedState?.locator) {
      await rendition.display(savedState.locator)
      progressPercent.value = Math.round(savedState.percentage)
    } else {
      await rendition.display()
    }

    isLoading.value = false

    // Track Progress
    rendition.on('relocated', (location: any) => {
      let percentage = 0
      if (epubBook.locations && epubBook.locations.length() > 0) {
        percentage = epubBook.locations.percentageFromCfi(location.start.cfi) * 100
      }
      progressPercent.value = Math.round(percentage)
      debouncedSaveProgress(location.start.cfi, percentage)
    })

    epubBook.ready.then(() => epubBook.locations.generate(1600))
  } catch (error) {
    console.error('Error loading EPUB', error)
    isLoading.value = false
  }
}

const debouncedSaveProgress = (locator: string, percentage: number) => {
  if (saveProgressTimeout) clearTimeout(saveProgressTimeout)
  saveProgressTimeout = setTimeout(async () => {
    try {
      // Matches your ProgressController.ts exactly
      await $api(`/users/me/progress/${bookId}`, {
        method: 'PUT',
        body: { locator, percentage }
      })
    } catch (error) {
      console.error('Failed to save progress', error)
    }
  }, 2000)
}

const prevPage = () => rendition && rendition.prev()
const nextPage = () => rendition && rendition.next()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

onBeforeUnmount(() => {
  if (saveProgressTimeout) clearTimeout(saveProgressTimeout)
  if (epubBook) epubBook.destroy()
})
</script>

<style>
#viewer iframe {
  border: none !important;
}
</style>