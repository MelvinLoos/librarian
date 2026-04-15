<template>
  <article class="group space-y-4">
    <div class="relative overflow-hidden rounded-[1.8rem] bg-gray-950 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_50px_rgba(74,20,140,0.25)]">
      <div class="aspect-[2/3] w-full overflow-hidden">
        <NuxtImg
          :src="imageSrc"
          :alt="book?.title"
          @error="onImageError"
          format="webp"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div class="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-violet-600/10"></div>
      <div class="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white shadow-lg">
        <span class="material-symbols-outlined text-[16px]">favorite</span>
      </div>
    </div>

    <div class="space-y-1 px-1">
      <h4 class="truncate text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">{{ book.title }}</h4>
      <p class="truncate text-[11px] uppercase tracking-[0.18em] text-gray-400">
        {{ book.authors?.map(a => a.name).join(', ') || 'Unknown Author' }}
      </p>
      <div class="flex items-center gap-1 text-yellow-300">
        <span class="material-symbols-outlined text-[14px]">star</span>
        <span class="material-symbols-outlined text-[14px]">star</span>
        <span class="material-symbols-outlined text-[14px]">star</span>
        <span class="material-symbols-outlined text-[14px]">star</span>
        <span class="material-symbols-outlined text-[14px] text-gray-500">star</span>
        <span class="ml-1 text-[10px] uppercase tracking-[0.24em] text-gray-400">4.2</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Author {
  id: number
  name: string
}

interface Book {
  id: number
  title: string
  hasCover?: boolean
  sortTitle?: string
  pubdate?: string
  authors?: Author[]
}

const props = defineProps<{ book: Book }>()

const placeholder = '/placeholder-cover.png'
const imageSrc = ref(placeholder)

watch(() => props.book, (newBook) => {
  if (newBook?.hasCover) {
    imageSrc.value = `/api/assets/covers/${newBook.id}`
  } else {
    imageSrc.value = placeholder
  }
}, { immediate: true })

const onImageError = () => {
  imageSrc.value = placeholder
}
</script>
