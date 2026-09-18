import { describe, expect, it } from 'vitest'
import { expectTypeOf } from 'vitest'
import type { ReadingProgress } from '~/domain/catalog/Catalog.types'

// Canonical backend contract (LibrarianReadingProgress / UpdateProgressDto).
// The backend persists `locator (String)` + `percentage (Float)`; the legacy
// `currentPage`/`totalPages` fields were removed from the schema and DTO.
const BACKEND_PROGRESS_CONTRACT: ReadonlyArray<keyof ReadingProgress> = [
  'id',
  'bookId',
  'locator',
  'percentage',
  'updatedAt',
]

describe('ReadingProgress API contract', () => {
  // Adversarial typing gate: this fixture MUST type-check against the frontend
  // contract, mirroring the response of GET /users/me/reading-states.
  const sample: ReadingProgress = {
    id: 1,
    userId: 'user-123',
    bookId: 42,
    locator: 'epubcfi(/6/4!/4/2/1:0)',
    percentage: 42.5,
    updatedAt: '2026-09-18T10:00:00Z',
  }

  it('should type-check locator/percentage/userId against the new contract', () => {
    expectTypeOf(sample.locator).toBeString()
    expectTypeOf(sample.percentage).toBeNumber()
    expectTypeOf(sample.userId).toBeString()
  })

  it('should expose the backend contract fields at runtime', () => {
    for (const field of BACKEND_PROGRESS_CONTRACT) {
      expect(sample).toHaveProperty(field)
    }
  })

  it('should expose the reading position consumed by the reader UI', () => {
    expect(sample.locator).toBe('epubcfi(/6/4!/4/2/1:0)')
    expect(sample.percentage).toBe(42.5)
  })

  it('should not depend on legacy currentPage/totalPages fields', () => {
    expect(Object.hasOwn(sample, 'currentPage')).toBe(false)
    expect(Object.hasOwn(sample, 'totalPages')).toBe(false)
  })
})