# SPEC-issue-7: E-book Format Conversion Pipeline

**Status:** Approved (orchestration plan D1–D4) — implementation per Adversarial TDD.
**Bounded Context:** `storage` only. Legacy Calibre tables frozen; one new Librarian-owned
table added.

## Objective

Stand up the full conversion pipeline: `POST /assets/books/:id/convert` →
persisted `ConversionJob` → `FormatConversionRequestedEvent` → piscina worker (native or CLI)
→ status polling (`GET /assets/conversions/:jobId`) / cancel
(`DELETE /assets/conversions/:jobId`).

## Engine Strategy (approved D2 — hybrid)

- **Native (pure Node, fully testable):** `EPUB→TXT` (strip HTML via jszip) and `TXT→EPUB`
  (build a minimal EPUB via jszip). Guaranteed to work in any environment.
- **CLI-backed:** `EPUB→PDF`, `EPUB→MOBI`, `MOBI→EPUB`, `PDF→EPUB`, `AZW3→EPUB` shell out to
  Calibre's `ebook-convert` when present (`which ebook-convert` on this host: **absent**).
  When the binary is missing the job FAILS with a clear, user-facing error
  ("Calibre ebook-convert CLI is not installed…").
- The format registry (domain) validates all pairs; `isNative()` distinguishes the engines.
- **Deviation (noted in issue comment):** DoD "EPUB→MOBI and receive the file" — without
  Calibre installed, the DOMAIN pipeline, job lifecycle, status polling, and failure surfacing
  are fully exercised; real EPUB↔MOBI/PDF bytes require the CLI and fail gracefully here.

<!--PART2-->

## Layer Plan

### Domain (`src/storage/domain/`)
1. `conversion-status.enum.ts` — PENDING/RUNNING/COMPLETED/FAILED/CANCELLED.
2. `conversion-job.entity.ts` — props (id, bookId, sourceFormat, targetFormat, status,
   progress, errorMessage?, outputPath?, requestedAt, updatedAt) + state machine:
   `markRunning` (PENDING→RUNNING), `markCompleted(outputPath)` (RUNNING→COMPLETED, p=100),
   `markFailed(reason)`, `cancel()` (PENDING|RUNNING→CANCELLED); validation: non-empty
   formats, progress clamp.
3. `events/format-conversion-requested.event.ts` — REDEFINED ctor
   `(jobId, bookId, sourceFormat, targetFormat)`; `Asset.requestFormatConversion` withdrawn
   (superseded by the use-case-driven pipeline; aggregate + spec updated).
4. `events/format-conversion-completed.event.ts` — new `(jobId, success, sourceFormat,
   targetFormat, outputPath?, errorMessage?)`.
5. `services/format-registry.ts` — pure registry: EPUB→[PDF,MOBI,TXT], MOBI→[EPUB],
   PDF→[EPUB], AZW3→[EPUB], TXT→[EPUB]; `supports(source,target)`, `getTargets(source)`,
   `isNative(source,target)` (true iff EPUB→TXT | TXT→EPUB).

### Application (`src/storage/application/`)
6. `ports/conversion-job-repository.interface.ts` — `save(job)`, `findById(id)`.
7. `ports/conversion-executor.interface.ts` — `convert(input)` (throws on failure).
8. `use-cases/request-conversion.use-case.ts` — resolve book format via `IBookFormatRepository`,
   validate via registry (unsupported ⇒ `BadRequestException`), create job, persist, emit
   `FormatConversionRequestedEvent`, return jobId.
9. `use-cases/get-conversion-status.use-case.ts` — findById → DTO (null if missing).
10. `use-cases/cancel-conversion.use-case.ts` — findById (missing ⇒ `NotFoundException`),
    `cancel()` (illegal state ⇒ `BadRequestException`), persist, return job.
11. `use-cases/execute-conversion-job.use-case.ts` — load job ⇒ `markRunning`/save ⇒
    `IConversionExecutor.convert` ⇒ `markCompleted(outputPath)`/save ⇒ emit
    `FormatConversionCompletedEvent` (success). Failure ⇒ `markFailed`/save ⇒ emit completed
    event (failure) with errorMessage.

### Infrastructure (`src/storage/infrastructure/`)
12. `prisma/schema.prisma` — `LibrarianConversionJob` model + bootstrap DDL (done) + `prisma generate`.
13. `prisma-conversion-job.repository.ts` — upsert-by-id + ACL row→entity.
14. `conversion.worker.ts` — piscina worker: NATIVE via jszip; CLI via `execFile('ebook-convert')`;
    output `process.cwd()` + outputRelativePath; returns `{ success, errorMessage? }`.
15. `conversion-pool.adapter.ts` — implements `IConversionExecutor` over piscina.
16. `format-conversion-requested.listener.ts` — resolve source absolute path
    (`IBookFormatRepository.getFormatInfo` + `IFileStorage.getBookFilePath`), output
    `.librarian/conversions/{jobId}.{ext}`, delegate to `ExecuteConversionJobUseCase`.

### Presentation (`src/storage/presentation/`)
17. `asset.controller.ts` — `POST /assets/books/:id/convert` (202, `{ targetFormat }` DTO),
    `GET /assets/conversions/:jobId` (200), `DELETE /assets/conversions/:jobId` (200) —
    Swagger decorators, Pino; `storage.module.ts` wiring.

## Test Plan (RED first; no `@ts-ignore`, no `test.skip`)

1. `domain/conversion-job.entity.spec.ts` — state machine + validation (unit)
2. `domain/events/format-conversion-completed.event.spec.ts` — new (unit)
3. `domain/events/format-conversion-requested.event.spec.ts` — updated ctor (unit)
4. `domain/asset.aggregate.spec.ts` — `requestFormatConversion` block removed
5. `domain/services/format-registry.spec.ts` — matrix (unit)
6. `application/use-cases/request-conversion.use-case.spec.ts` — unit
7. `application/use-cases/get-conversion-status.use-case.spec.ts` — unit
8. `application/use-cases/cancel-conversion.use-case.spec.ts` — unit
9. `application/use-cases/execute-conversion-job.use-case.spec.ts` — unit
10. `infrastructure/prisma-conversion-job.repository.spec.ts` — **SQLite file-db**
11. `infrastructure/conversion-pool.adapter.spec.ts` — mocked piscina
12. `infrastructure/conversion.worker.spec.ts` — real: EPUB→TXT, TXT→EPUB, CLI-absent failure
13. `infrastructure/format-conversion-requested.listener.spec.ts` — unit
14. `presentation/asset.controller.spec.ts` — extended: 3 new endpoints

## Verification
Full backend suite green · `npm run build` clean · lint delta ≈ 0 for production code (spec
files may add test-convention noise matching the existing 150-error baseline) · failing RED
log posted to issue #7 before implementation.