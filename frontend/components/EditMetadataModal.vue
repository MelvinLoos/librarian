<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    data-test="modal-overlay"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-2xl rounded-[2rem] bg-surface-container-high p-8 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Edit book metadata"
    >
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-serif font-semibold text-on-surface">Edit Metadata</h2>
          <button
            type="button"
            data-test="cancel"
            aria-label="Close"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant/10 text-on-surface-variant transition hover:bg-surface-variant/20 hover:text-primary"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <form class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2" @submit.prevent="submit">
          <label class="block sm:col-span-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Title</span>
            <input
              v-model="form.title"
              required
              type="text"
              data-test="title"
              class="mt-2 w-full rounded-2xl bg-surface-variant/20 px-4 py-3 text-on-surface outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Authors (comma separated)</span>
            <input
              v-model="authorsText"
              type="text"
              data-test="authors"
              class="mt-2 w-full rounded-2xl bg-surface-variant/20 px-4 py-3 text-on-surface outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Tags (comma separated)</span>
            <input
              v-model="tagsText"
              type="text"
              data-test="tags"
              class="mt-2 w-full rounded-2xl bg-surface-variant/20 px-4 py-3 text-on-surface outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Series</span>
            <input
              v-model="form.seriesName"
              type="text"
              data-test="series"
              class="mt-2 w-full rounded-2xl bg-surface-variant/20 px-4 py-3 text-on-surface outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label class="block">
            <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Rating (0–5)</span>
            <input
              v-model="form.rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              data-test="rating"
              class="mt-2 w-full rounded-2xl bg-surface-variant/20 px-4 py-3 text-on-surface outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label class="block sm:col-span-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Publisher</span>
            <input
              v-model="form.publisher"
              type="text"
              data-test="publisher"
              class="mt-2 w-full rounded-2xl bg-surface-variant/20 px-4 py-3 text-on-surface outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label class="block sm:col-span-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Description</span>
            <textarea
              v-model="form.description"
              rows="4"
              data-test="description"
              class="mt-2 w-full rounded-2xl bg-surface-variant/20 px-4 py-3 text-on-surface outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
            ></textarea>
          </label>

          <div class="mt-2 flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              data-test="cancel"
              class="rounded-full border border-outline-variant/10 bg-surface-variant/10 px-6 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-variant/20"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              data-test="submit"
              :disabled="saving"
              class="rounded-full bg-primary-gradient px-6 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:brightness-[1.1] disabled:opacity-50"
              @click="submit"
            >
              <span v-if="saving">Saving…</span>
              <span v-else>Save changes</span>
            </button>
          </div>
        </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { CatalogApi } from '~/infrastructure/api/CatalogApi'
import type { Book, BookMetadataInput } from '~/domain/catalog/Catalog.types'

const props = defineProps<{
  open: boolean;
  book: Book | null;
}>()

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', book: Book): void;
}>()

const saving = ref(false)
const authorsText = ref('')
const tagsText = ref('')

const form = reactive({
  title: '',
  publisher: '',
  rating: 0,
  seriesName: '',
  description: '',
})

watch(
  () => [props.open, props.book],
  () => {
    if (!props.open || !props.book) return
    form.title = props.book.title ?? ''
    form.publisher = props.book.publisher ?? ''
    form.rating = props.book.rating ?? 0
    form.seriesName = props.book.series?.name ?? ''
    form.description = props.book.description ?? props.book.comments ?? ''
    authorsText.value = (props.book.authors ?? []).map((a) => a.name).join(', ')
    tagsText.value = (props.book.tags ?? []).map((t) => t.name).join(', ')
  },
  { immediate: true },
)

function toList(text: string): { name: string }[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }))
}

async function submit() {
  if (!props.book) return
  saving.value = true
  try {
    const payload: BookMetadataInput = {
      title: form.title,
      publisher: form.publisher || undefined,
      description: form.description || undefined,
      rating: form.rating === 0 ? undefined : form.rating,
      authors: toList(authorsText.value),
      tags: toList(tagsText.value),
      series: form.seriesName ? { name: form.seriesName, index: props.book.series?.index } : undefined,
      identifiers: props.book.identifiers,
    }

    const updated = await CatalogApi.updateBookMetadata(props.book.id, payload)
    emit('saved', updated)
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>