<template>
  <UiDialog
    data-test="bulk-edit-modal"
    :open="open"
    :title="modalTitle"
    @close="$emit('close')"
  >
    <BookSelectionGrid
      v-if="books && books.length"
      data-test="bulk-edit-grid"
      :books="books"
      :model-value="selectedIds"
      @update:model-value="selectedIds = $event"
    />

    <div class="mt-4 space-y-4">
      <div data-test="title">
        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Title
        </label>
        <UiInput
          :model-value="title"
          placeholder="Leave blank to keep"
          aria-label="New title"
          @update:model-value="title = $event"
        />
      </div>

      <div data-test="publisher">
        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Publisher
        </label>
        <UiInput
          :model-value="publisher"
          placeholder="Leave blank to keep"
          aria-label="New publisher"
          @update:model-value="publisher = $event"
        />
      </div>

      <div data-test="rating">
        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Rating (0–5)
        </label>
        <UiSelect
          :model-value="rating"
          :options="ratingOptions"
          placeholder="No change"
          aria-label="New rating"
          @update:model-value="rating = $event"
        />
      </div>

      <div data-test="description">
        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Description
        </label>
        <UiTextarea
          :model-value="description"
          rows="3"
          placeholder="Leave blank to keep"
          aria-label="New description"
          @update:model-value="description = $event"
        />
      </div>

      <div data-test="authors">
        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Authors (comma separated)
        </label>
        <UiInput
          :model-value="authors"
          placeholder="Leave blank to keep"
          aria-label="New authors"
          @update:model-value="authors = $event"
        />
      </div>

      <div data-test="tags">
        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Tags (comma separated)
        </label>
        <UiInput
          :model-value="tags"
          placeholder="Leave blank to keep"
          aria-label="New tags"
          @update:model-value="tags = $event"
        />
      </div>

      <div data-test="series">
        <label class="block text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Series
        </label>
        <UiInput
          :model-value="series"
          placeholder="Leave blank to keep"
          aria-label="New series"
          @update:model-value="series = $event"
        />
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <UiButton data-test="cancel" tone="ghost" size="sm" @click="$emit('close')">
        Cancel
      </UiButton>
      <UiButton data-test="save" tone="primary" size="sm" :disabled="busy" @click="save">
        {{ busy ? 'Applying…' : 'Apply changes' }}
      </UiButton>
    </div>
  </UiDialog>
</template>
<script setup lang="ts">
import { computed, ref, withDefaults } from 'vue'
import { CatalogApi } from '~/infrastructure/api/CatalogApi'
import type { Book } from '~/domain/catalog/Catalog.types'

const props = withDefaults(
  defineProps<{
    open?: boolean
    bookIds?: number[]
    books?: Book[]
  }>(),
  {
    open: false,
    bookIds: () => [],
    books: undefined,
  },
)

const emit = defineEmits<{ close: []; updated: [books: Book[]] }>()

const title = ref('')
const publisher = ref('')
const rating = ref('')
const description = ref('')
const authors = ref('')
const tags = ref('')
const series = ref('')
const busy = ref(false)

const selectedIds = ref<number[]>(props.bookIds.map(Number))

const ratingOptions = Array.from({ length: 11 }, (_, index) => {
  const value = String(index * 0.5)
  return { value, label: value }
})

const modalTitle = computed(() => `Edit ${selectedIds.value.length} selected book(s)`)

const buildChanges = (): Record<string, unknown> => {
  const changes: Record<string, unknown> = {}
  if (title.value.trim()) changes.title = title.value.trim()
  if (publisher.value.trim()) changes.publisher = publisher.value.trim()
  if (rating.value !== '' && rating.value !== null) changes.rating = Number(rating.value)
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
  const ids = selectedIds.value
  if (Object.keys(changes).length === 0 || ids.length === 0) return

  busy.value = true
  try {
    const updated = await CatalogApi.bulkUpdateBooks(ids, changes)
    emit('updated', updated as Book[])
    emit('close')
  } finally {
    busy.value = false
  }
}
</script>