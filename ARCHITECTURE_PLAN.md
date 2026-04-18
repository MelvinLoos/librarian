# **OPEN SPEC: Next-Gen Calibre (Librarian) \- Architecture Plan**

## **1\. System Containers & Infrastructure (C4 Level 2\)**

The physical deployment architecture:

* **Frontend Container:** Nuxt 3 (Vue) PWA.  
* **Backend Container:** NestJS (Node.js). Orchestrates all logic and HTTP requests.  
* **Embedded Background Worker:** To maintain zero-configuration deployability, asynchronous CPU-heavy tasks (EPUB extraction, conversion) are executed via a dedicated Node.js worker pool (e.g., piscina). No external message queues (Redis/RabbitMQ) are permitted.  
* **Data Layer:** SQLite (metadata.db). Handled exclusively via Prisma ORM.  
* **Storage Layer:** Local File System Docker volume.

## **2\. Directory Structure (Clean Architecture Map)**

NestJS Modules map 1:1 with Bounded Contexts. Cross-module imports are strictly forbidden except for /shared.

/backend  
├── /prisma  
│   ├── schema.prisma                 \# The single source of truth for DB schemas  
│   └── migrations/                   \# Managed Prisma migrations  
├── /src  
│   ├── /shared                       \# Global Primitives (NO Business Logic)  
│   ├── /iam                          \# IAM Bounded Context Module  
│   ├── /catalog                      \# Catalog Bounded Context Module  
│   │   ├── /domain                   \# book.aggregate.ts, book.events.ts  
│   │   ├── /application              \# get-book.use-case.ts  
│   │   ├── /infrastructure           \# prisma-book.repository.ts, legacy-acl.mapper.ts  
│   │   └── /presentation             \# book.controller.ts, book.dto.ts  
│   ├── /storage                      \# Storage Bounded Context Module  
│   ├── /reading                      \# Reading Bounded Context Module  
│   │   ├── /domain                   \# progress.aggregate.ts  
│   │   ├── /application              \# update-progress.use-case.ts  
│   │   ├── /infrastructure           \# prisma-reading.repository.ts  
│   │   └── /presentation             \# progress.controller.ts  
│   ├── /integration                  \# Integration Bounded Context Module  
│   └── /delivery                     \# Delivery Bounded Context Module  
└── main.ts                           \# App Entrypoint

## **3\. NestJS Execution Lifecycles**

Technical implementation of the flows defined in the Product Spec.

### **3.1 Synchronous Flow & The Anti-Corruption Layer (ACL)**

1. **Controller:** HTTP GET reaches BookController. Payload validated via class-validator.  
2. **Application:** Controller invokes GetBookUseCase.  
3. **Infrastructure:** Use Case queries PrismaBookRepository, which executes against legacy SQLite tables.  
4. **ACL Translation:** Repository passes raw Prisma result to LegacyAclMapper, which instantiates a pure Book Aggregate (Domain Layer).  
5. **Response:** Controller serializes the Aggregate to JSON.

### **3.2 Asynchronous Event-Driven Flow (Choreography)**

1. **Controller:** HTTP POST reaches AssetController. File buffer is saved to /tmp.  
2. **Event Emission:** Controller returns HTTP 202 Accepted and emits AssetUploadedEvent via @nestjs/event-emitter.  
3. **Worker Handoff:** StorageContext listener delegates the extraction task to the piscina worker pool to avoid blocking the main NestJS event loop.  
4. **Chained Events:** Worker finishes and emits MetadataExtractedEvent, picked up by CatalogContext for database insertion.

## **4\. Prisma Database Strategy & Blueprint**

**CRITICAL DIRECTIVE:** The legacy Calibre tables (books, authors, data) are **FROZEN**. Prisma migrations must NEVER alter the structure of these legacy tables.

```
// schema.prisma  
datasource db {  
  provider \= "sqlite"  
  url      \= env("DATABASE\_URL")  
}  
generator client {  
  provider \= "prisma-client-js"  
}

// \--- 1\. IAM CONTEXT (Librarian Specific \- Managed by Migrations) \---  
model User {  
  id           String   @id @default(uuid())  
  email        String   @unique  
  passwordHash String  
  role         String   @default("READER")  
  createdAt    DateTime @default(now())  
  @@map("librarian\_users")  
}

// \--- 2\. CATALOG & STORAGE CONTEXTS (Legacy Calibre Mapping \- FROZEN) \---  
model Book {  
  id           Int       @id @default(autoincrement())  
  title        String    @default("Unknown")  
  sort         String?  
  timestamp    DateTime? @default(now())  
  pubdate      DateTime?  
  seriesIndex  Float?    @default(1.0) @map("series\_index")  
  authorSort   String?   @map("author\_sort")  
  uuid         String?  
  hasCover     Boolean?  @default(false) @map("has\_cover")  
  lastModified DateTime  @default(now()) @updatedAt @map("last\_modified")

  authors      BookAuthorLink\[\]  
  formats      Data\[\]  
  @@map("books")  
}

model Author {  
  id    Int    @id @default(autoincrement())  
  name  String  
  sort  String?  
  link  String?  
  books BookAuthorLink\[\]  
  @@map("authors")  
}

model BookAuthorLink {  
  id       Int @id @default(autoincrement())  
  bookId   Int @map("book")  
  authorId Int @map("author")  
  book     Book   @relation(fields: \[bookId\], references: \[id\], onDelete: Cascade)  
  author   Author @relation(fields: \[authorId\], references: \[id\], onDelete: Cascade)  
  @@unique(\[bookId, authorId\])  
  @@map("books\_authors\_link")  
}

model Data {  
  id               Int    @id @default(autoincrement())  
  bookId           Int    @map("book")  
  format           String   
  uncompressedSize Int    @map("uncompressed\_size")  
  name             String   
  book             Book   @relation(fields: \[bookId\], references: \[id\], onDelete: Cascade)  
  @@map("data")  
}
```

## **5\. Security & Observability Implementation**

Implementation of requirements from Constitution Section 6:

* **Global Authentication:** NestJS must implement a global Auth Guard. Public endpoints must use a custom @IsPublic() metadata decorator.  
* **Logging Integration:** A global NestJS Interceptor will integrate Winston to log all request durations and attach unique Trace IDs.  
* **Error Handling:** A Global Exception Filter will intercept all Domain Exceptions (e.g., BookNotFoundException) and serialize them to the strict RFC 7807 JSON format.