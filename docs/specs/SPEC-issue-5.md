# SPEC-issue-5: Real EPUB/PDF Metadata Extraction

**Status:** Approved (orchestration plan D1–D4) — implementation per Adversarial TDD.
**Bounded Context:** `storage` only. No imports from other contexts. Legacy Calibre tables frozen.

## Objective

Replace mocked metadata ingestion with real parsers so that uploaded EPUB/PDF assets produce
real `ExtractedMetadata` (title, authors[], cover buffer, ISBN, publisher, pubdate, language,
description), persisted asset state transitions, and a `MetadataExtractedEvent` carrying real
data for downstream Catalog consumption.

## Scope & Boundaries

- **In scope:** Domain `ExtractedMetadata` VO; `IMetadataExtractor` port; `ExtractMetadataUseCase`;
  real EPUB/PDF parsing in the piscina worker; `IFileStorage.saveCover`; richer
  `MetadataExtractedEvent`; listener refactored onto the use case (fixes infra→infra call);
  upload response gains `state`; SQLite-backed integration coverage.
- **Out of scope:** Catalog-side Book creation from the event (no catalog listener exists yet;
  the event payload type is the contract).
- **Deviation from approved D1:** `pdfjs-dist` is NOT added. Rationale: (1) DoD requires only
  "Cover image extracted from EPUB and saved to storage"; (2) PDF "metadata if embedded" is
  satisfied deterministically via manual Info/XMP scanning, fully testable with a generated
  minimal PDF fixture; (3) legacy pdf.js page rasterization in Node 24 worker threads is
  fragile and untestable under the no-skip TDD gate. EPUB uses `jszip` (ZIP is binary; a
  zero-dep parser is impossible) — jszip is used by both the parser and the test fixtures.

## Layer Plan

### Domain (`src/storage/domain/`)
1. `value-objects/extracted-metadata.value-object.ts` — new `ExtractedMetadata` VO
   (title, authors[], isbn?, publisher?, pubDate?, language?, description?, cover?: Buffer,
   coverMimeType?). Validates: non-empty title, non-empty author entries, cover ⇒ coverMimeType.
   Pure TS, no external deps. `fromRaw(raw)` maps the worker payload → VO; `toPayload()` emits
   the serializable shape.
2. `events/metadata-extracted.event.ts` — extend with `metadata?: ExtractedMetadataPayload`
   (plain shape, defined in the event file).
3. `asset.aggregate.ts` — `markAsReady(metadata?: ExtractedMetadata)` forwards the payload into
   the emitted `MetadataExtractedEvent`.

### Application (`src/storage/application/`)
4. `ports/metadata-extractor.interface.ts` — `IMetadataExtractor { extract(filePath): Promise<ExtractedMetadata> }`.
5. `use-cases/extract-metadata.use-case.ts` — find asset (null if missing) →
   `startProcessing`+save → extract via port → `IFileStorage.saveCover` when cover present →
   `markAsReady(metadata)`+save → drain `domainEvents` via `EventEmitter2` → return metadata.
   Failure ⇒ `markAsFailed(reason)`+save, rethrow.

### Infrastructure (`src/storage/infrastructure/`)
6. `metadata-extraction.types.ts` — extend result; add `ExtractedRawMetadata` shape.
7. `metadata-extractor.worker.ts` — real parser (parentPort contract unchanged):
   - Detect by extension/magic: `%PDF-` → PDF; `PK\x03\x04` → EPUB; else unsupported.
   - EPUB: `META-INF/container.xml` → OPF path → parse `dc:title`, all `dc:creator`,
     `dc:identifier` (isbn when scheme/format says so), `dc:publisher`, `dc:date`,
     `dc:language`, `dc:description` (namespace-agnostic, entity-decoded helpers) → cover via
     `<meta name="cover">` → manifest `item` href → entry bytes.
   - PDF: manual `/Title /Author /Subject /Keywords /Producer /CreationDate` Info-dict scan +
     embedded XMP `<dc:...>` block scan (XMP wins). Cover: best-effort `xmp:Thumbnails`
     embedded image if present, else undefined.
8. `metadata-extraction-pool.adapter.ts` — implement `IMetadataExtractor` over piscina;
   map raw payload → `ExtractedMetadata.fromRaw`.
9. `local-file.storage.ts` + `IFileStorage` — add `saveCover(buffer, assetId, mimeType)`
   writing `.librarian/covers/{assetId}.{ext}`.
10. `asset-uploaded.listener.ts` — delegate to `ExtractMetadataUseCase`.

### Presentation (`src/storage/presentation/`)
11. `asset.controller.ts` — upload response `{ id, state: 'UPLOADED', message }` (Swagger schema
    updated). Status stays `GET /assets/:id/status` (issue's `/assets/status/:jobId` is stale;
    noted in issue comment).
12. `storage.module.ts` — bind `IMetadataExtractor` → adapter; provide `ExtractMetadataUseCase`.

## Test Plan (RED first, no `@ts-ignore`, no `test.skip`)

| # | Spec | Layer | Backing |
|---|------|-------|---------|
| 1 | `extracted-metadata.value-object.spec.ts` | Domain | unit |
| 2 | `metadata-extracted.event.spec.ts` (extended) | Domain | unit |
| 3 | `asset.aggregate.spec.ts` (extended) | Domain | unit |
| 4 | `extract-metadata.use-case.spec.ts` | Application | unit (mocked ports) |
| 5 | `metadata-extractor.worker.spec.ts` (rewritten) | Infrastructure | unit, jszip-generated EPUB + minimal PDF fixtures |
| 6 | `metadata-extraction-pool.adapter.spec.ts` (updated) | Infrastructure | mocked piscina |
| 7 | `asset-uploaded.listener.spec.ts` (updated) | Infrastructure | unit |
| 8 | `metadata-extraction.integration.spec.ts` (new) | Infrastructure | **SQLite file-db** + real worker fn + real `PrismaAssetRepository` |
| 9 | `asset.controller.spec.ts` (extended) | Presentation | unit |

Fixtures: `infrastructure/fixtures/book-fixtures.ts` (test-only): `buildMinimalEpub(...)` via
jszip, `buildMinimalPdf(...)` with correct xref offsets + optional XMP stream.

## Verification
`rtk npx jest src/storage` green · `npm run lint` clean · `npm run build` clean.
Failing RED logs posted to issue #5 before any implementation.

## Definition of Done (issue #5)
- TDD root: VO/use case/worker specs failing first (evidence: issue comment).
- EPUB → correct title/authors (OPF) + cover extracted & saved via `IFileStorage.saveCover`.
- PDF → metadata extracted when embedded.
- `MetadataExtractedEvent` carries real data.
- Full suite green; no TS/lint errors.