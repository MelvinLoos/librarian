# Antigravity Agent Orchestration Rules & Sprints

**Context:** This repository uses Spec-Driven Development (SDD) and Clean Architecture to build "Librarian" (Next-Gen Calibre). As an AI Agent operating within the Google Antigravity IDE, your actions are strictly governed by the constraints below.

## 🔴 GLOBAL DIRECTIVES FOR AI AGENTS (READ FIRST)

1. **The Core Specifications:** Before executing any task, you MUST align your logic with the following source-of-truth documents:
   - `CONSTITUTION.md`: For tech stack, testing pyramids, and logging/API rules.
   - `PRODUCT_SPEC.md`: For DDD Ubiquitous Language and Bounded Context rules.
   - `ARCHITECTURE_PLAN.md`: For strictly enforced directory structures and database mappings.
2. **The "Artifact First" Rule:** You are strictly forbidden from writing or modifying implementation code immediately. Upon receiving a task, you MUST first generate an **Implementation Plan Artifact**. You must PAUSE and wait for the human user to approve the artifact before writing code.
3. **Clean Architecture Enforcement:** All Bounded Contexts (`/iam`, `/catalog`, `/storage`, `/reading`) are strictly isolated. You must implement features in this exact order: `Domain` -> `Application (Use Cases)` -> `Infrastructure (Adapters)` -> `Presentation (Controllers)`.
4. **Database Immutability:** The legacy SQLite tables (`books`, `authors`, `data`) mapped in `schema.prisma` are FROZEN. Do not alter them. 
5. **API & Error Standards:** All controllers must use Swagger decorators (`@ApiOperation`, `@ApiResponse`, etc.). All errors must be thrown using standard NestJS exceptions. All logging must use the globally injected Pino logger.

---

## Sprint 1: Enforcing Observability (✅ Completed)
- Implemented global `rfc7807-exception.filter.ts`.
- Integrated `nestjs-pino` with single-line terminal DX.

## Sprint 2: Observability Retrofit & DDD Audit (✅ Completed)
- Retrofitted `/storage`, `/catalog`, and `/reading` with Pino and strict RFC 7807 error handling.

---

## Sprint 3: The Consumption Pipeline (Asset Delivery & Locator Tracking)

**Target Directories:** `prisma/schema.prisma`, `/backend/src/storage/`, `/backend/src/reading/`

**Context:** Users need the ability to stream books into a web reader using chunking, download books for offline use, and track their reading progress agnostically (supporting both EPUB CFIs and PDF pages).

**Objective:**
1. **Schema Update:** Modify `LibrarianReadingProgress` in `schema.prisma`. Remove `currentPage` and `totalPages`. Add `locator` (String) and `percentage` (Float).
2. **Reading Retrofit:** Update `UpdateReadingProgressUseCase`, `ProgressController`, and their corresponding DTOs to accept and return the new `locator` and `percentage` fields.
3. **Storage Application:** Create `StreamAssetUseCase` and `DownloadAssetUseCase`. 
   - `StreamAssetUseCase` MUST handle `Range` headers to support HTTP 206 Partial Content for chunked web-reader streaming.
4. **Storage Presentation:** Update `AssetController` with two new endpoints:
   - `GET /assets/books/:id/stream`: Must return a `StreamableFile` with correct `Content-Range`, `Accept-Ranges`, and `Content-Length` headers.
   - `GET /assets/books/:id/download`: Must return a `StreamableFile` with `Content-Disposition: attachment`.
   - Update OpenAPI Swagger decorators to explicitly document the Range/Chunking support.