<template>
  <div
    data-test="book-selection-grid"
    class="rounded-[1.5rem] border border-outline-variant/10 bg-surface-variant/5"
  >
    <div class="flex items-center gap-3 border-b border-outline-variant/10 px-4 py-2.5">
      <div data-test="select-all" class="flex items-center">
        <UiCheckbox
          :model-value="allSelected"
          :input-aria-label="allSelected ? 'Deselect all books' : 'Select all books'"
          @update:model-value="onToggleAll"
        />
      </div>
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Title</span>
      <span class="ml-auto text-xs text-on-surface-variant">{{ selectedIds.length }} selected</span>
    </div>

    <ul class="max-h-64 divide-y divide-outline-variant/10 overflow-y-auto">
      <li
        v-for="book in books"
        :key="book.id"
        data-test="book-grid-row"
        class="flex items-center gap-3 px-4 py-2"
        :class="{ 'bg-primary-container/15': isSelected(book.id) }"
      >
        <UiCheckbox
          :model-value="isSelected(book.id)"
          :input-aria-label="'Select ' + book.title"
          @update:model-value="onRowToggle(book.id, $event)"
        />
        <span class="truncate text-sm font-medium text-on-surface">{{ book.title }}</span>
        <span class="ml-auto truncate text-xs text-on-surface-variant">
          {{ book.author || book.authors?.[0]?.name || 'Unknown Author' }}
        </span>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '~/domain/catalog/Catalog.types'

const props = defineProps<{
  books: Book[]
}>()

/**
 * Live two-way binding for the selection state.
 *
 * Registering the model under the `modelValue` name means:
 * - reads track every parent-side `:model-value` update (no snapshot drift),
 * - assignments write back through the native `update:modelValue` event.
 */
const selectedIds = defineModel<number[]>('modelValue', { default: () => [] })

const isSelected = (id: number) => selectedIds.value.includes(id)

const allSelected = computed(
  () => selectedIds.value.length > 0 && selectedIds.value.length === props.books.length,
)

const onRowToggle = (id: number, checked: boolean) => {
  if (checked) {
    if (!isSelected(id)) {
      selectedIds.value = [...selectedIds.value, id]
    }
  } else {
    selectedIds.value = selectedIds.value.filter((bookId) => bookId !== id)
  }
}

const onToggleAll = (checked: boolean) => {
  selectedIds.value = checked ? props.books.map((book) => book.id) : []
}
</script>