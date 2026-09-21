<template>
  <NuxtLink :to="`/book/${book.id}`" class="group block h-full">
    <div
      data-test="book-card"
      :data-selected="selected ? 'true' : undefined"
      class="relative overflow-hidden rounded-[1.8rem] bg-surface-container shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl data-[selected=true]:ring-2 data-[selected=true]:ring-primary data-[selected=true]:ring-offset-2"
    >
      <!-- Cover Container -->
      <div class="aspect-[2/3] w-full overflow-hidden bg-surface-variant/10">
        <template v-if="book.hasCover">
          <img
            :src="`/api/assets/covers/${book.id}`"
            :alt="book.title"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-on-surface-variant/40">
          <span class="material-symbols-outlined text-4xl">book</span>
        </div>
      </div>

      <!-- Book Info Overlay -->
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-12">
        <p class="truncate text-[10px] uppercase tracking-[0.18em] font-bold text-white/90">
          {{ book.author || book.authors?.[0]?.name || 'Unknown Author' }}
        </p>
        <h4 class="mt-1 truncate text-sm font-semibold text-white group-hover:text-primary-dim transition-colors">{{ book.title }}</h4>
        
        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center">
            <span class="material-symbols-outlined text-[14px] text-primary">star</span>
            <span class="ml-1 text-[10px] uppercase tracking-[0.24em] font-bold text-white/80">4.2</span>
          </div>
          <div class="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm">
            {{ book.formats?.[0]?.format || 'EPUB' }}
          </div>
        </div>
      </div>

      <!-- Progress Bar (if reading) -->
      <div v-if="readingProgress !== undefined" class="absolute bottom-0 left-0 h-1 bg-primary/30" :style="{ width: '100%' }">
        <div class="h-full bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.8)]" :style="{ width: `${readingProgress}%` }"></div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  book: any
  readingProgress?: number
  /** When true, the card renders the `data-[selected=true]:ring-2` affordance. */
  selected?: boolean
}>()
</script>
