# SPEC-issue-2-6: Bulk Metadata Editing & Custom Column CRUD

**Status:** Approved (orchestration plan D1–D4) — implementation per Adversarial TDD.
**Bounded Contexts:** `catalog` (backend) + Nuxt frontend. Legacy Calibre tables frozen; new
Librarian-owned tables only.

## Objective
1. **Issue #2 (audit & close):** `PATCH /catalog/books/:id` + `EditMetadataModal.vue` already
   exist with specs on main. This branch verifies both suites, fills any coverage gaps found,
   and closes #2.
2. **Issue #6:** Bulk metadata editing (`PATCH /catalog/books/bulk`) + Custom Column CRUD
   (definitions) end-to-end: domain → application → infrastructure → presentation → frontend.

## Scope Decisions (deviation notes → PR + issue comment)
- Custom-column **value plumbing** (book ↔ column values stored per book, rendered on the book
  detail page) requires additional Librarian tables + ACL work. The DoD bullet "create →
  display on book → delete" is partially deferred: this PR delivers full **definition CRUD
  (create/list/delete)** + bulk metadata editing, plus the frontend bulk-select/bulk-edit UI and
  the admin column manager. Value-per-book assignment is a tracked follow-up (note in PR).
- "Bulk atomically": the current `IBookRepository.update` port persists per book (each in its
  own Prisma transaction). Cross-book atomicity would require a new transactional port; the
  use case applies all updates and reports the updated books; failure mid-way surfaces as the
  standard NestJS exception. Documented in PR.

## Layer Plan (backend `/backend/src/catalog/`)

### Domain
1. `entities/custom-column.entity.ts` — EXTEND datatype to
   `'text'|'series'|'number'|'rating'|'date'|'boolean'` + `displayLabel?`, `isMultiple`
   (default false); keep `name`/`value`. Update entity spec.
2. `value-objects/bulk-update-command.value-object.ts` — NEW `BulkUpdateCommand`
   (`bookIds: number[]`, `changes: BookUpdateProps`) validating non-empty ids + non-empty title;
   factory `fromRaw(bookIds, raw)` builds domain entities (authors→Author etc.).

### Application
3. `ports/custom-column-repository.interface.ts` — NEW
   `findAll(): Promise<CustomColumn[]>`, `upsert(column): Promise<CustomColumn>`,
   `deleteById(id): Promise<boolean>`.
4. `use-cases/bulk-update-books.use-case.ts` — NEW: for each id → `book.update(changes)` →
   `repo.update(book)`; missing book ⇒ `NotFoundException`; returns updated books.
5. `use-cases/get-custom-columns.use-case.ts` — findAll → DTOs.
6. `use-cases/upsert-custom-column.use-case.ts` — validate → repo.upsert.
7. `use-cases/delete-custom-column.use-case.ts` — repo.deleteById; not-deleted ⇒ `NotFoundException`.

### Infrastructure
8. `prisma/schema.prisma` — `LibrarianCustomColumn` (id String @id, name unique, dataType,
   displayLabel?, isMultiple Boolean) + bootstrap DDL in `PrismaService.autoMigrate` +
   `prisma generate`.
9. `infrastructure/prisma-custom-column.repository.ts` — NEW, maps row ↔ entity (ACL).

### Presentation
10. `presentation/book.controller.ts` — `PATCH /books/bulk` (body `{ bookIds, changes }`,
    Swagger).
11. `presentation/custom-column.controller.ts` — NEW `GET/POST/DELETE /custom-columns`
    (`GET`, `POST` body `{ name, dataType?, displayLabel?, isMultiple? }`, `DELETE :id`) +
    Swagger; `catalog.module.ts` wiring.

## Layer Plan (frontend `/frontend/`)
12. `domain/catalog/Catalog.types.ts` — `CustomColumn`, `BulkBookUpdateInput`,
    `CustomColumnInput` types.
13. `pages/index.vue` — book multi-select checkboxes + selection toolbar + "Edit selection"
    button wired to `BulkEditModal`; `stores/librarySelection.ts` (Pinia) for selection state.
14. `components/BulkEditModal.vue` — form for authors/tags/series/rating/publisher/description
    → `PATCH /catalog/books/bulk`; updates `bookCache`. + component spec.
15. `pages/admin/index.vue` + `components/CustomColumnManager.vue` — list/create/delete custom
    columns via the new API. + component spec.
16. Book-detail column-value display: DEFERRED (see scope decisions) — filed in PR body.

## Test Plan (RED first)
Backend (jest): custom-column.entity.spec (ext), bulk-update-command spec, bulk-update-books
use-case spec, custom-columns use cases specs, prisma-custom-column.repository SQLite spec,
book.controller bulk spec, custom-column.controller spec.
Frontend (vitest): BulkEditModal.spec.ts, CustomColumnManager.spec.ts, library page
selection spec.
Issue #2 audit: run backend + frontend suites; add missing specs only for gaps found.

## Verification
Backend `jest` + build green; frontend `vitest run` + `vue-tsc --noEmit` green; lint delta ≈
0 for new production code (specs mirror codebase conventions); RED log posted to issue #6
before implementation.