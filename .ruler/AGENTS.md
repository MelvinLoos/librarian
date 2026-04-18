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
5. **API & Error Standards:** All controllers must use Swagger decorators (`@ApiOperation`, `@ApiResponse`, etc.). All errors must be thrown using standard NestJS exceptions, which will be caught by the global RFC 7807 filter.

---

## Sprint 1: Enforcing Observability (Current Active Task)

**Target Directory:** `/backend/src/shared/`

**Objective:** Implement the mandated global error handling and high-performance structured logging using Pino.

1. **Artifact Generation:** Outline the creation of `rfc7807-exception.filter.ts` and the integration of `nestjs-pino`.
2. **Implementation:** - Install `nestjs-pino`, `pino-http`, and `pino-pretty` (as a dev dependency).
   - The Exception Filter must catch all Domain and standard HTTP exceptions and format them strictly to the `application/problem+json` RFC 7807 standard.
   - Configure the NestJS `LoggerModule` (from `nestjs-pino`) to log requests/responses with a unique `traceId`. The application must *always* output raw JSON.
3. **Wiring:** - Update `/backend/src/main.ts` to bind the Pino logger as the global logger and instantiate the Exception Filter.
   - Update `/backend/package.json` to append ` | pino-pretty` to the `start:dev` and `start:debug` scripts to provide human-readable logs during local development.

---

## Sprint 2: The Storage Context (Cover Streaming)

**Target Directory:** `/backend/src/storage/`

**Context:** The frontend needs a way to fetch the `cover.jpg` file for the cinematic grid. 

**Objective:**
1. **Domain/Application:** Create a `GetCoverStreamUseCase` that takes a `bookId`.
2. **Infrastructure:** Query the `PrismaService` to find the book's path. Combine it with the base library path to locate `cover.jpg` on the file system. Return a Node `fs.createReadStream`. Throw a `NotFoundException` if the DB record or physical file is missing.
3. **Presentation:** Create an `AssetController` with `GET /assets/covers/:bookId` that returns the stream wrapped in a NestJS `StreamableFile` with `Content-Type: image/jpeg`.
4. **Testing:** Write isolated unit tests for the Use Case and Controller mocking `fs` and Prisma.

---

## Sprint 3: Catalog Expansion (Deep Metadata & Filters)

**Target Directory:** `/backend/src/catalog/`

**Context:** The Book queries must be upgraded to support sorting, deep relation joining via the Anti-Corruption Layer (ACL), and tag aggregation.

**Objective:**
1. **Application/Infrastructure (`GetBooksUseCase`):** Add support for sorting (`?sort=added&order=desc&limit=10`). The Prisma query must use the junction tables to `include` authors (`books_authors_link`) and tags.
2. **Application/Infrastructure (`GetBookUseCase`):** Upgrade the singular book fetch to `include` authors, series, and the `comments` table (synopsis).
3. **Application/Infrastructure (`GetTopTagsUseCase`):** Create a query that joins `tags` with `books_tags_link` to return the top 15 tags by frequency.
4. **Presentation:** Update `BookController` and `TagController` with the new endpoints and Swagger documentation.

---

## Sprint 4: Reading Context (User Progress)

**Target Directory:** `/backend/src/reading/`

**Context:** Implement the formally ratified Bounded Context for tracking user reading progress.

**Objective:**
1. **Domain:** Define the `ReadingProgress` Aggregate.
2. **Application (`UpdateReadingProgressUseCase` & `GetReadingStatesUseCase`):** - Update: Accepts `userId`, `bookId`, `currentPage`, `totalPages`.
   - Get: Retrieves all states for a `userId`.
3. **Infrastructure:** Implement `PrismaReadingProgressRepository` utilizing Prisma's `upsert` against the `LibrarianReadingProgress` table. For the `Get` query, ensure the related `Book` data is included.
4. **Presentation (`ProgressController`):** - `PUT /progress/:bookId` (Protected via JWT, extracts user ID from token).
   - `GET /progress` (Protected via JWT).