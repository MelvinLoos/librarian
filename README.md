# Librarian (Next-Gen Calibre)
[![Librarian CI](https://github.com/MelvinLoos/librarian/actions/workflows/ci.yml/badge.svg)](https://github.com/MelvinLoos/librarian/actions/workflows/ci.yml)

Librarian is a modern, mobile-first, self-hostable web application designed for eBook and document management. Conceived as a clean-architecture replacement for `calibre-web`, it is optimized for personal and home-lab deployments.

## Core Capabilities

Librarian is built to provide a premium, Netflix-style interface for your personal book collection while maintaining strict compatibility with your existing data.

- **Legacy Calibre Compatibility:** Reads and maps directly from frozen Calibre database schemas (`books`, `authors`, `data`). No complex data migrations are required.
    
- **Multi-User RBAC:** Identity and Access Management with distinct user roles (Admin, Contributor, Reader). Safely share your library with friends and family.
    
- **Modern Frontend:** A Progressive Web App (PWA) delivering a highly responsive, native-feeling experience across mobile, tablet, and desktop displays.
    
- **Device Delivery:** Built-in capabilities for hardware sync (e.g., Kobo, Kindle) and OPDS feeds to deliver books directly to your eReaders.
    
- **Event-Driven Storage:** Non-blocking, asynchronous metadata extraction and physical asset ingestion ensures the interface remains lightning-fast, even during heavy batch uploads.
    

## Technology Stack

This project is built using **Spec-Driven Development (SDD)** and is inherently **AI-Developer First**.

- **Frontend:** Nuxt 3 (Vue.js), TailwindCSS.
    
- **Backend:** NestJS (Node.js), `@nestjs/event-emitter`.
    
- **Database & ORM:** SQLite, Prisma ORM (Prisma 7+).
    
- **Testing:** Jest/Vitest for TDD (Targeting 100% coverage on Domain/Use Case layers).
    

## Getting Started (Local Setup)

The project is structured as a decoupled monorepo containing a `frontend` and `backend` directory. You will need Node.js (v18+) and NPM/Yarn.

### Backend Setup

The backend utilizes Prisma 7. Database connection strings are managed via `prisma.config.ts`.

```
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Initialize the SQLite database and run Prisma generation
npx prisma db push

# Start the development server (runs on http://localhost:3000)
npm run start:dev
```

### Frontend Setup

```
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Nuxt 3 development server
npm run dev
```

## Architecture Overview

Librarian strictly adheres to **Clean Architecture** principles to ensure maintainability and testability. The backend is divided into five isolated Bounded Contexts:

1. **IAM:** Identity & Access Management (Authentication, Roles).
    
2. **Catalog:** Core library logic and Anti-Corruption Layer (ACL) translating legacy Calibre schemas to pure Domain Aggregates.
    
3. **Storage:** Physical file system abstraction and asset ingestion.
    
4. **Integration:** Third-party metadata enrichment (e.g., Google Books APIs).
    
5. **Delivery:** Hardware and client-specific protocols (OPDS, SendToKindle).
    

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
    
3. **Task Sequencing:** 
	- **Phase 1:** Build Domain Layer + Unit Tests via Adversarial TDD.
    
    - **Phase 2:** Build Application Layer (Use Cases utilizing mocked Repository Interfaces).
        
    - **Phase 3:** Build Infrastructure (Prisma/File System) and Presentation Layers.
        
4. **No UI Testing for Business Logic:** Implementation code must satisfy automated tests, not manual human verification. Ensure `npm run test` executes rapidly and passes before opening a Pull Request.