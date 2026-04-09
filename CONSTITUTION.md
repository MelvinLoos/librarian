# **PROJECT CONSTITUTION: Next-Gen Calibre (Code Name: Librarian)**

## **1\. Core Philosophy & Goals**

* **Primary Objective:** Build a modern, mobile-first, self-hostable web application for eBook and document management, serving as a clean-architecture replacement for the legacy calibre-web.  
* **Scale Target:** Optimized for personal and home-lab deployments ranging from 1,000 to 100,000 items.  
* **MVP Scope:** Book storage, searchability, metadata management, device transfer (sync/download), and Multi-User Support (Role-Based Access Control).  
* **AI-Developer First:** This codebase will be primarily generated and maintained by autonomous AI agents. Therefore, strict type safety, modularity, and rigid separation of concerns are non-negotiable.

## **2\. Target Audience & Deployment Limits**

* **End Users:** Readers wanting a beautiful, Netflix-style, mobile-first interface for their curated book collections.  
* **Operators:** Home-lab enthusiasts and self-hosters deploying via Docker on consumer hardware (NAS, Raspberry Pi, VPS).  
* **Architectural Boundary:** This is a single-deployment, multi-user application. True PaaS/Multi-tenancy is **strictly out of scope** to prevent data-leakage risks and scope bloat.

## **3\. Technology Stack (The "Non-Negotiables")**

* **Frontend:** **Nuxt 3 (Vue.js)** configured as a Progressive Web App (PWA). Styled with TailwindCSS.  
* **Backend Framework:** **NestJS (Node.js)**. Selected specifically for its aggressive enforcement of modularity and Dependency Injection.  
* **Database & ORM:** **SQLite** interfaced strictly via **Prisma ORM**.

## **4\. Spec-Driven Development (SDD) & Agent Tooling**

* **Source of Truth:** The **Open Spec** framework will be used to define all feature requirements. Code is merely a compilation of the spec.  
* **Context Boundaries:** **.ruler** files will be placed in critical directories to inject localized rules, preventing cross-agent contamination.  
* **Architectural Memory:** Every significant technical choice MUST be documented in an **Architecture Decision Record (ADR)** in the /docs/adr folder.  
* **Strict AI Task Sequencing:** Agents must ALWAYS build features in this order:  
  1. Domain Layer \+ Tests \-\> 2\. Application Layer \+ Tests \-\> 3\. Infrastructure/Presentation Layers.

## **5\. Architectural Standards (Clean Architecture)**

AI Agents contributing to this repository must strictly adhere to the following layer isolations:

1. **Domain Layer:** Contains core business entities. Absolutely NO framework (NestJS) or database (Prisma) dependencies are allowed here. Must consist of **Pure Functions**.  
2. **Application / Use Case Layer:** Orchestrates domain logic.  
3. **Infrastructure / Adapter Layer:** Implementations of interfaces (e.g., Prisma repositories, file system wrappers).  
4. **Presentation Layer (API):** NestJS Controllers. Must contain NO business logic. Payload validation must use class-validator and class-transformer.

## **6\. The API Contract & Observability Rules**

* **API Contracts:** The API must be documented using OpenAPI (Swagger).  
* **Standardized Errors:** All API errors MUST conform to **RFC 7807 (Problem Details for HTTP APIs)**.  
* **Structured Logging:** console.log is forbidden. All logging must be structured JSON emitting { level, message, timestamp, context, traceId }.

## **7\. The Pragmatic Hybrid Testing Pipeline**

* **7.1 Adversarial Test-Driven Development (TDD):** No implementation code may be written before the test is written and failing. The implementation must adapt to the test.  
* **7.2 The "Fast" Test Pyramid:**  
  * **Unit Tests (90%):** 100% coverage mandated for Domain/Use Case Layers. Executed via Vitest/Jest with zero external dependencies.  
  * **Integration Tests (9%):** Infrastructure adapters must be tested against an ephemeral, **file-based SQLite database** (e.g., test-db-${uuid}.sqlite) that is dynamically generated and destroyed per test suite.  
  * **E2E Contract Tests (1%):** Limited strictly to critical API paths.  
* **7.3 The CI/CD Rule:** The entire test suite must run in under 3 minutes. "Skipping" tests using test.skip or @ts-ignore is a critical violation.