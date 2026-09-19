import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLibrarySelectionStore } from '../../stores/librarySelection'

describe('librarySelection store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('tracks a set of selected book ids', () => {
    const store = useLibrarySelectionStore()

    expect(store.count).toBe(0)
    store.toggle(1)
    store.toggle(2)
    expect(store.selectedIds).toEqual([1, 2])
    expect(store.has(1)).toBe(true)
    expect(store.count).toBe(2)
  })

  it('toggles an id off when selected again', () => {
    const store = useLibrarySelectionStore()
    store.toggle(1)
    store.toggle(1)
    expect(store.has(1)).toBe(false)
    expect(store.count).toBe(0)
  })

  it('selects and clears all ids from a list', () => {
    const store = useLibrarySelectionStore()
    store.toggleAll([1, 2, 3])
    expect(store.count).toBe(3)

    store.clear()
    expect(store.count).toBe(0)
  })
})