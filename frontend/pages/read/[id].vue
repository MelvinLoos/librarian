<template>
  <div class="fixed inset-0 z-[100] flex flex-col bg-[#080e1a] text-gray-200">
    <header class="relative z-50 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#080e1a]/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div v-if="bookMetadata" class="hidden sm:block">
          <h1 class="text-sm font-semibold text-white sm:text-base">{{ bookMetadata.title }}</h1>
          <p v-if="activeFormat === 'EPUB'" class="text-xs text-gray-400">{{ progressPercent }}% Read</p>
          <p v-else class="text-xs text-gray-400">PDF Document</p>
        </div>
      </div>
      
      <button 
        v-if="activeFormat === 'EPUB' && toc.length > 0" 
        @click="isTocOpen = !isTocOpen"
        class="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition"
        :class="isTocOpen ? 'bg-violet-600/20 text-violet-300' : 'bg-white/5 hover:bg-white/10'"
      >
        <span class="material-symbols-outlined text-[18px]">format_list_bulleted</span>
        <span class="hidden sm:inline">Chapters</span>
      </button>
    </header>

    <div 
      v-if="isTocOpen"
      class="absolute right-0 top-[65px] z-50 h-[calc(100vh-65px)] w-full max-w-sm overflow-y-auto border-l border-white/10 bg-[#0a0f1d]/95 p-4 shadow-2xl backdrop-blur-2xl transition-transform"
    >
      <h2 class="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Document Outline</h2>
      <ul class="space-y-1">
        <li v-for="item in toc" :key="item.id">
          <button 
            @click="goToChapter(item.href)"
            class="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-violet-300"
          >
            {{ item.label }}
          </button>
        </li>
      </ul>
    </div>

    <div 
      class="relative flex-1 overflow-hidden" 
      @click="isTocOpen = false"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div v-if="isLoading" class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#080e1a]">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p class="text-sm uppercase tracking-widest text-violet-300">Loading Content...</p>
      </div>

      <div 
        v-if="activeFormat === 'EPUB'" 
        @click.stop="prevPage"
        class="group absolute inset-y-0 left-0 z-40 flex w-1/4 cursor-pointer items-center justify-start transition-all duration-500 hover:bg-gradient-to-r hover:from-black/60 hover:to-transparent sm:w-24"
      >
        <div class="flex h-full w-1.5 bg-violet-500/0 transition-colors duration-500 group-hover:bg-violet-500/50 group-hover:shadow-[0_0_15px_rgba(138,76,252,0.8)]"></div>
        <div class="ml-2 flex h-16 w-16 -translate-x-4 items-center justify-center rounded-full bg-[#080e1a]/90 text-white opacity-0 shadow-[0_0_30px_rgba(138,76,252,0.4)] backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:ml-4">
          <span class="material-symbols-outlined text-3xl text-violet-300">chevron_left</span>
        </div>
      </div>

      <div 
        v-if="activeFormat === 'EPUB'" 
        @click.stop="nextPage"
        class="group absolute inset-y-0 right-0 z-40 flex w-1/4 cursor-pointer items-center justify-end transition-all duration-500 hover:bg-gradient-to-l hover:from-black/60 hover:to-transparent sm:w-24"
      >
        <div class="mr-2 flex h-16 w-16 translate-x-4 items-center justify-center rounded-full bg-[#080e1a]/90 text-white opacity-0 shadow-[0_0_30px_rgba(138,76,252,0.4)] backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:mr-4">
          <span class="material-symbols-outlined text-3xl text-violet-300">chevron_right</span>
        </div>
        <div class="flex h-full w-1.5 bg-violet-500/0 transition-colors duration-500 group-hover:bg-violet-500/50 group-hover:shadow-[0_0_15px_rgba(138,76,252,0.8)]"></div>
      </div>
      
      <div 
        v-show="activeFormat === 'EPUB'" 
        id="viewer" 
        class="h-full w-full"
        :class="[
          (transitionState === 'next-out' || transitionState === 'prev-out') ? 'transition-all duration-150 ease-in' : '',
          transitionState === 'idle' ? 'transition-all duration-150 ease-out' : '',
          transitionState === 'next-out' ? 'opacity-0 -translate-x-6 scale-[0.98]' : '',
          transitionState === 'next-in' ? 'opacity-0 translate-x-6 scale-[0.98]' : '',
          transitionState === 'prev-out' ? 'opacity-0 translate-x-6 scale-[0.98]' : '',
          transitionState === 'prev-in' ? 'opacity-0 -translate-x-6 scale-[0.98]' : '',
          transitionState === 'idle' ? 'opacity-100 translate-x-0 scale-100' : ''
        ]"
      ></div>

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
const transitionState = ref<'idle' | 'next-out' | 'next-in' | 'prev-out' | 'prev-in'>('idle')

// TOC State
const toc = ref<any[]>([])
const isTocOpen = ref(false)

let epubBook: any = null
let rendition: any = null
let saveProgressTimeout: any = null

// --- Interaction Handlers ---
let touchStartX = 0
let touchStartY = 0
let touchEndX = 0
let touchEndY = 0

const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.changedTouches[0].screenX
  touchStartY = e.changedTouches[0].screenY
}

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX = e.changedTouches[0].screenX
  touchEndY = e.changedTouches[0].screenY
  handleSwipe()
}

const handleSwipe = () => {
  if (activeFormat.value !== 'EPUB') return;
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // Only trigger swipe if horizontal movement is dominant
  if (Math.abs(diffX) > Math.abs(diffY)) {
    const swipeThreshold = 50; // pixels required to count as a swipe
    if (diffX < -swipeThreshold) {
      nextPage(); // Swiped left -> Go Forward
    } else if (diffX > swipeThreshold) {
      prevPage(); // Swiped right -> Go Backward
    }
  }
};

const handleKeyboard = (e: KeyboardEvent) => {
  if (activeFormat.value !== 'EPUB') return;
  if (e.key === 'ArrowLeft') {
    prevPage();
  } else if (e.key === 'ArrowRight') {
    nextPage();
  }
};

// --- Lifecycle ---
onMounted(async () => {
  window.addEventListener('keyup', handleKeyboard);

  try {
    bookMetadata.value = await $api(`/books/${bookId}`)
    const formats = bookMetadata.value?.formats?.map((f: any) => f.format.toUpperCase()) || []
    
    if (formats.includes('EPUB')) {
      activeFormat.value = 'EPUB'
      await loadEpub()
    } else if (formats.includes('PDF')) {
      activeFormat.value = 'PDF'
      pdfUrl.value = `/api/assets/books/${bookId}/stream?format=PDF`
      isLoading.value = false
      debouncedSaveProgress('pdf-page-1', 0)
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
    const buffer = await $api(`/assets/books/${bookId}/stream?format=EPUB`, { 
      responseType: 'arrayBuffer' 
    })
    
    epubBook = ePub(buffer as ArrayBuffer)

    rendition = epubBook.renderTo('viewer', {
      width: '100%',
      height: '100%',
      spread: 'none',
      manager: 'continuous',
      flow: 'paginated', 
    })

    rendition.themes.default({
      body: { background: '#080e1a', color: '#e0e5f6' },
      p: { 'font-family': 'Manrope, sans-serif', 'font-size': '1.1rem', 'line-height': '1.6' },
      h1: { 'font-family': 'Newsreader, serif', color: '#bd9dff' },
      h2: { 'font-family': 'Newsreader, serif', color: '#bd9dff' },
      a: { color: '#c38bf5' }
    })

    // Listen for inputs inside the iframe
    rendition.on('keyup', handleKeyboard);
    rendition.on('touchstart', handleTouchStart);
    rendition.on('touchend', handleTouchEnd);

    // Extract Table of Contents
    epubBook.loaded.navigation.then((nav: any) => {
      toc.value = nav.toc
    })

    const states: any = await $api('/users/me/reading-states')
    const savedState = states.find((s: any) => s.bookId === parseInt(bookId))
    
    if (savedState?.locator) {
      await rendition.display(savedState.locator)
      progressPercent.value = Math.round(savedState.percentage)
    } else {
      await rendition.display()
    }

    isLoading.value = false

    rendition.on('relocated', (location: any) => {
      if (epubBook.locations && epubBook.locations.length() > 0) {
        const rawPercentage = (location.start.percentage || 0) * 100
        const safePercentage = Math.max(0, Math.min(100, rawPercentage))
        
        progressPercent.value = Math.round(safePercentage)
        debouncedSaveProgress(location.start.cfi, safePercentage)
      } else {
        debouncedSaveProgress(location.start.cfi, progressPercent.value)
      }
    })

    epubBook.ready.then(() => epubBook.locations.generate(1600))
  } catch (error) {
    console.error('Error loading EPUB', error)
    isLoading.value = false
  }
}

// --- Actions ---
// --- Actions ---
const goToChapter = (href: string) => {
  if (rendition && transitionState.value === 'idle') {
    // Treat chapter jumps as a forward fade
    transitionState.value = 'next-out'
    setTimeout(() => {
      rendition.display(href)
      transitionState.value = 'next-in'
      isTocOpen.value = false
      
      setTimeout(() => {
        transitionState.value = 'idle'
      }, 50)
    }, 150)
  }
}

const prevPage = () => {
  // Lockout prevents rapid-fire button mashing from breaking the animation
  if (!rendition || transitionState.value !== 'idle') return
  transitionState.value = 'prev-out'
  
  setTimeout(() => {
    rendition.prev()
    // Snap the invisible wrapper to the left side
    transitionState.value = 'prev-in' 
    
    setTimeout(() => {
      // 50ms buffer ensures the browser removes the CSS transition class before snapping,
      // then restores it so we can smoothly slide back to the center ('idle')
      transitionState.value = 'idle' 
    }, 50) 
  }, 150) // 150ms matches the Tailwind CSS duration
}

const nextPage = () => {
  if (!rendition || transitionState.value !== 'idle') return
  transitionState.value = 'next-out'
  
  setTimeout(() => {
    rendition.next()
    transitionState.value = 'next-in'
    
    setTimeout(() => {
      transitionState.value = 'idle'
    }, 50)
  }, 150)
}
const debouncedSaveProgress = (locator: string, percentage: number) => {
  if (saveProgressTimeout) clearTimeout(saveProgressTimeout)
  saveProgressTimeout = setTimeout(async () => {
    try {
      await $api(`/users/me/progress/${bookId}`, {
        method: 'PUT',
        body: { locator, percentage }
      })
    } catch (error) {
      console.error('Failed to save progress', error)
    }
  }, 2000)
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('keyup', handleKeyboard);
  if (saveProgressTimeout) clearTimeout(saveProgressTimeout)
  if (epubBook) epubBook.destroy()
})
</script>

<style>
#viewer iframe {
  border: none !important;
}
</style>