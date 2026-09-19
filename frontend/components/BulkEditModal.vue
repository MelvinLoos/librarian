<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    data-test="bulk-edit-modal"
  >
    <div class="w-full max-w-lg rounded-[2.5rem] bg-surface-container-high/80 p-6 shadow-2xl backdrop-blur-xl m-4">
      <h2 class="text-2xl font-serif font-semibold text-on-surface">
        Edit {{ bookIds.length }} selected book(s)
      </h2>

      <div class="mt-6 space-y-4">
        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Title</label>
        <input v-model="title" data-test="title" class="w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface" />

        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Publisher</label>
        <input v-model="publisher" data-test="publisher" class="w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface" />

        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Rating (0–5)</label>
        <input v-model.number="rating" data-test="rating" type="number" min="0" max="5" step="0.5" class="w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface" />

        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Description</label>
        <textarea v-model="description" data-test="description" class="w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface"></textarea>

        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Authors (comma separated)</label>
        <input v-model="authors" data-test="authors" class="w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface" />

        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Tags (comma separated)</label>
        <input v-model="tags" data-test="tags" class="w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface" />

        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Series</label>
        <input v-model="series" data-test="series" class="w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface" />
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button data-test="cancel" class="rounded-full px-4 py-2 text-on-surface-variant" @click="$emit('close')">
          Cancel
        </button>
        <button data-test="save" class="rounded-full bg-primary-gradient px-6 py-2 font-semibold text-on-primary" @click="save">
          Apply changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CatalogApi } from '~/infrastructure/api/CatalogApi'

const props = defineProps({
  open: { type: Boolean, default: false },
  bookIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'updated'])

const title = ref('')
const publisher = ref('')
const rating = ref<number | null>(null)
const description = ref('')
const authors = ref('')
const tags = ref('')
const series = ref('')

const buildChanges = (): Record<string, unknown> => {
  const changes: Record<string, unknown> = {}
  if (title.value.trim()) changes.title = title.value.trim()
  if (publisher.value.trim()) changes.publisher = publisher.value.trim()
  if (rating.value !== null) changes.rating = Number(rating.value)
  if (description.value.trim()) changes.description = description.value.trim()
  if (authors.value.trim()) {
    changes.authors = authors.value
      .split(',')
      .map((name) => ({ name: name.trim() }))
      .filter((author) => author.name.length > 0)
  }
  if (tags.value.trim()) {
    changes.tags = tags.value
      .split(',')
      .map((name) => ({ name: name.trim() }))
      .filter((tag) => tag.name.length > 0)
  }
  if (series.value.trim()) changes.series = { name: series.value.trim() }
  return changes
}

const save = async () => {
  const changes = buildChanges()
  if (Object.keys(changes).length === 0) return

  const ids = (props.bookIds as number[]).map(Number)
  const updated = await CatalogApi.bulkUpdateBooks(ids, changes)
  emit('updated', updated)
  emit('close')
}
</script>