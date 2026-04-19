# Agent Directive: Clean Architecture & Domain-Driven Design (DDD)

**CRITICAL RULE:** The Librarian project strictly enforces Clean Architecture. Cross-layer contamination will result in immediate rejection of your code.

## 1. The Four Layers
You must strictly isolate code into the following directories within a module (e.g., `/src/catalog/`):

1. **`/domain` (Core Business Logic)**
   * **Rule:** ZERO external dependencies. No NestJS decorators (`@Injectable`), no Prisma (`@prisma/client`), no HTTP types.
   * **Contents:** Aggregate Roots, Entities, Value Objects, Domain Events. 
   * **Nature:** Pure TypeScript functions and classes.

2. **`/application` (Use Cases / Orchestration)**
   * **Rule:** Orchestrates domain objects using interfaces (Ports). Does NOT know about the database or HTTP.
   * **Contents:** Use Case classes, DTOs for Use Cases, Outbound Interface Ports (e.g., `BookRepositoryInterface`).

3. **`/infrastructure` (Adapters & Tools)**
   * **Rule:** The ONLY layer allowed to touch the database, file system, or external APIs.
   * **Contents:** Prisma Repositories (implementing application ports), Anti-Corruption Layer (ACL) Mappers, Piscina worker implementations.

4. **`/presentation` (Delivery / API)**
   * **Rule:** Contains NO business logic. Only handles HTTP translation.
   * **Contents:** NestJS Controllers (`@Controller`), Swagger decorators (`@ApiTags`), Input validation DTOs (`class-validator`).

## 2. Bounded Context Rules
* Modules (`iam`, `catalog`, `storage`, `reading`) are Bounded Contexts.
* **Forbidden:** You may NEVER directly import files from one Bounded Context into another.
* **Allowed:** Modules may only communicate via Domain Events (Choreography) or by sharing standard global primitives from the `/shared` module.

## 3. Database Constraints (Legacy Calibre)
* The `books`, `authors`, and `data` tables are **FROZEN**.
* You may NEVER generate Prisma migrations that alter the structure of these legacy Calibre tables.