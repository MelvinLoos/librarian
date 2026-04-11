<template>
  <article class="group space-y-4">
    <div class="relative overflow-hidden rounded-[1.8rem] bg-gray-950 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_50px_rgba(74,20,140,0.25)]">
      <div class="aspect-[2/3] w-full overflow-hidden">
        <NuxtImg
          src="https://placehold.co/400x600/111827/ffffff?text=Cover"
          alt="Cover art placeholder"
          format="webp"
          loading="lazy"
          class="h-full w-full object-cover"
        />
      </div>
      <div class="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-violet-600/10"></div>
      <div class="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white shadow-lg">
        <span class="material-symbols-outlined text-[16px]">favorite</span>
      </div>
    </div>

    <div class="space-y-1 px-1">
      <h4 class="truncate text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">{{ book.title }}</h4>
      <p class="text-[11px] uppercase tracking-[0.18em] text-gray-400">Unknown author</p>
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
interface Book {
  id: number
  title: string
  hasCover?: boolean
  sortTitle?: string
  pubdate?: string
}

const props = defineProps<{ book: Book }>()
</script>
