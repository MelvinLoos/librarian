import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * librarySelection store
 *
 * Tracks which books are ticked on the library grid for bulk editing.
 * State is intentionally in-memory (session-scoped).
 */
export const useLibrarySelectionStore = defineStore('librarySelection', () => {
  const selectedIds = ref<number[]>([])

  const count = computed(() => selectedIds.value.length)

  const has = (id: number): boolean => selectedIds.value.includes(id)

  const toggle = (id: number): void => {
    if (has(id)) {
      selectedIds.value = selectedIds.value.filter((current) => current !== id)
    } else {
      selectedIds.value = [...selectedIds.value, id]
    }
  }

  const toggleAll = (ids: number[]): void => {
    selectedIds.value = [...ids]
  }

  const clear = (): void => {
    selectedIds.value = []
  }

  return { selectedIds, count, has, toggle, toggleAll, clear }
})