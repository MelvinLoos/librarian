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
5. **API & Error Standards:** All controllers must use Swagger decorators (`@ApiOperation`, `@ApiResponse`, etc.). All errors must be thrown using standard NestJS exceptions, which will be caught by the global RFC 7807 filter. All logging must use the globally injected Pino logger.

---

## Sprint 1: Enforcing Observability (✅ Completed)
- Implemented global `rfc7807-exception.filter.ts`.
- Integrated `nestjs-pino` with `pino-http` and `pino-pretty` for local DX.

---

## Sprint 2: Observability Retrofit & DDD Audit (🎯 Current Active Task)

**Target Directories:** `/backend/src/storage/`, `/backend/src/catalog/`, `/backend/src/reading/`

**Context:** These modules were scaffolded prior to the enforcement of the Pino observability layer and strict RFC 7807 error handling. They must be retrofitted to comply with the current architecture.

**Objective:**
1. **Artifact Generation:** Analyze all controllers, services, and use cases across these three Bounded Contexts.
2. **Implementation:** - Replace any instances of `console.log` or the standard NestJS `Logger` with the newly injected Pino logger.
   - Ensure that any "not found" states (e.g., Book missing for cover stream, missing reading progress) explicitly throw a standard NestJS exception (e.g., `NotFoundException`) so they are caught by the global RFC 7807 filter.
   - Verify that there are no illegal cross-module imports (e.g., `/catalog` importing from `/storage`).
3. **Validation:** Run all existing `.spec.ts` files to ensure the logging changes do not break any unit tests.

---

## Sprint 3: Storage, Catalog & Reading Contexts (✅ Implemented, Pending Audit via Sprint 2)
*Features exist in the codebase and are awaiting the retrofit and validation phase to ensure strict DDD and Clean Architecture compliance.*