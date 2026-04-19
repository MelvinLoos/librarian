# Librarian (Next-Gen Calibre)
[![Librarian CI](https://github.com/MelvinLoos/librarian/actions/workflows/ci.yml/badge.svg)](https://github.com/MelvinLoos/librarian/actions/workflows/ci.yml)

Librarian is a modern, mobile-first, self-hostable web application designed for eBook and document management. Conceived as a clean-architecture replacement for `calibre-web`, it is optimized for personal and home-lab deployments.

## Core Capabilities

Librarian is built to provide a premium, Netflix-style interface for your personal book collection while maintaining strict compatibility with your existing data.

- **Legacy Calibre Compatibility:** Reads and maps directly from frozen Calibre database schemas (`books`, `authors`, `data`, `comments`, `tags`). 
- **Native Embedded Reader:** Read books directly in the browser.
  - **EPUB:** Distraction-free tap zones, keyboard/swipe navigation, cinematic page-turn transitions, and dynamic Table of Contents via `epubjs`.
  - **PDF:** Native browser iframe streaming with read-tracking initialization.
- **Cross-Device Progress Syncing:** Safely injects a non-destructive `LibrarianReadingProgress` table into your Calibre `metadata.db` to sync your exact reading percentage and EPUB CFI locations across devices without altering native Calibre tables.
- **Modern Frontend:** A Progressive Web App (PWA) delivering a highly responsive, glassmorphic, native-feeling experience across mobile, tablet, and desktop displays.
- **Event-Driven Storage:** Non-blocking, asynchronous physical asset streaming via HTTP 206 chunking ensures the interface remains lightning-fast.
- **Multi-User RBAC *(WIP)*:** Identity and Access Management with distinct user roles (Admin, Contributor, Reader). Safely share your library with friends and family.
- **Device Delivery *(Planned)*:** Built-in capabilities for hardware sync (e.g., Kobo, Kindle) and OPDS feeds to deliver books directly to your eReaders.
- **Asset Ingestion *(Planned)*:** Web-based uploading and asynchronous metadata extraction for adding new books to the library directly from the browser.

## Technology Stack

This project is built using **Spec-Driven Development (SDD)** and is inherently **AI-Developer First**.

- **Frontend:** Nuxt 3 (built as a Static SPA), Vue 3, TailwindCSS, `epubjs`.
- **Backend:** NestJS (Node.js), `@nestjs/event-emitter`, `@nestjs/terminus` (Enterprise Health Checks).
- **Database & ORM:** SQLite, Prisma ORM, Better-SQLite3.
- **Deployment:** Multi-stage Docker, optimized for x86 and ARM (Raspberry Pi) architecture. Monolithic single-port execution.
- **Testing:** Jest/Vitest for TDD (Targeting 100% coverage on Domain/Use Case layers).

## Getting Started

Librarian now compiles into a **Monolithic Architecture**. The Nuxt frontend is built as static assets and served directly by the NestJS backend on a single port (`3001`), with backend routes prefixed by `/api`.

### Option 1: Docker Deployment (Recommended)
Docker is the safest way to deploy Librarian, especially on ARM hardware like a Raspberry Pi, as it handles Prisma's architecture-specific SQLite binaries automatically.

1. Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```
2. Configure your library path and secret in the `.env` file:
```env
# Use an absolute or relative path to your Calibre library on the host machine
HOST_CALIBRE_DIR=/path/to/your/calibre/folder
JWT_SECRET=your_super_secret_random_string
```
3. Build and start the container:
```bash
docker compose up -d --build
```
The application will be available at `http://localhost:3001`.

### Option 2: Local Bare Metal Setup
You will need Node.js (v24+) and NPM.

1. **Install Dependencies:**
```bash
# Installs dependencies for root, frontend, and backend
npm run install:all
```
2. **Configure Backend Environment:**
Create `backend/.env` and ensure your database path is an absolute URI with three slashes:
```env
DATABASE_URL="file:///path/to/your/calibre/metadata.db"
CALIBRE_LIBRARY_PATH="/path/to/your/calibre"
JWT_SECRET="your_secret_key"
```
3. **Build the Monolith:**
```bash
# Generates Nuxt static output and compiles NestJS
npm run build 
```
4. **Start the Application:**
```bash
npm run start
```

*Note: For active development, use `npm run dev` in the root folder to spin up concurrently running, hot-reloading frontend and backend servers.*

## Monitoring & Health Checks

Librarian includes a standardized health check endpoint at `/api/health`. It bypasses global authentication guards and monitors memory heap and RSS memory usage to ensure streaming stability during heavy asset parsing.

## Architecture Overview

Librarian strictly adheres to **Clean Architecture** principles to ensure maintainability and testability. The backend is divided into five isolated Bounded Contexts:

1. **IAM:** Identity & Access Management (Authentication, Sessions). *Roles and Permissions are WIP.*
2. **Catalog:** Core library logic and Anti-Corruption Layer (ACL) translating legacy Calibre schemas to pure Domain Aggregates.
3. **Storage:** Physical file system abstraction and asset streaming. *Asset ingestion via web upload is WIP.*
4. **Integration *(Planned)*:** Third-party metadata enrichment (e.g., Google Books APIs).
5. **Delivery *(Planned)*:** Hardware and client-specific protocols (OPDS, SendToKindle).

### Layer Constraints

Within each Bounded Context, code is rigidly separated into layers. Cross-layer contamination is strictly forbidden:

- `/domain`: Pure TypeScript business logic (Aggregates, Entities, Value Objects, Events). **No framework or database imports allowed.**
- `/application`: Orchestration via Use Cases and interface Ports.
- `/infrastructure`: Implementation of Ports (Prisma Repositories, File System Adapters, Crypto Hashers).
- `/presentation`: NestJS Controllers and DTO validation (`class-validator`).

## Development & AI Orchestration Guidelines

This repository relies on `@intellectronica/ruler` to enforce architectural boundaries during AI agent code generation.

If you are a human operator directing an AI agent, you must follow the **Spec-Driven Development** sequence:

1. **Read the Spec Kit:** The AI must read `CONSTITUTION.md`, `PRODUCT_SPEC.md`, and `ARCHITECTURE_PLAN.md` before writing any code.
2. **Respect the `.ruler`:** Ensure the AI reads the local `.ruler` file in its target directory to understand its strict import restrictions.
3. **Task Sequencing:** - **Phase 1:** Build Domain Layer + Unit Tests via Adversarial TDD.
   - **Phase 2:** Build Application Layer (Use Cases utilizing mocked Repository Interfaces).
   - **Phase 3:** Build Infrastructure (Prisma/File System) and Presentation Layers.
4. **No UI Testing for Business Logic:** Implementation code must satisfy automated tests, not manual human verification. Ensure `npm run test` executes rapidly and passes before opening a Pull Request.