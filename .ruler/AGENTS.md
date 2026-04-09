# Sprint 3: The Infrastructure Layer & External I/O

In this sprint, agents will implement the actual database repositories, file system adapters, and Anti-Corruption Layers (ACL).

**CRITICAL RULES FOR ALL AGENTS (PARALLEL EXECUTION SAFEGUARDS):**

1. **NO PACKAGE MUTATIONS:** The human operator has already installed all required packages (including `bcrypt`). You are strictly forbidden from running `npm install` or modifying `package.json`.
    
2. **THE SHARED MODULE EXISTS:** The operator has already created `/backend/src/shared/infrastructure/prisma.service.ts` and exported it from `SharedModule`. You can safely import and inject `PrismaService` without TypeScript errors.
    
3. **MOCK ALL I/O IN TESTS:** You must test your infrastructure classes using Jest mocks.
    
    - Mock the file system: `jest.mock('fs/promises')`
        
    - Mock the database: Inject a mocked `PrismaService` in your `.spec.ts` files using `{ provide: PrismaService, useValue: { ...mockedMethods } }`. Do NOT connect to the actual SQLite database in your tests.
        
4. **IMPORTS:** You may now import `@nestjs/common`, `@prisma/client`, `bcrypt`, and standard Node.js libraries ONLY inside the `/infrastructure` folders.
    

## Agent Alpha: Catalog Context

**Target Directory:** `/backend/src/catalog/`

**Context:** Read the Spec Kit. You are building the Infrastructure layer for the Catalog Context.

**Objective:**

1. **The ACL Mapper:** Create `/catalog/infrastructure/legacy-acl.mapper.ts`. Map the raw Prisma models (`Book`, `Author`, `BookAuthorLink` from the legacy Calibre tables) to your pure `Book` Aggregate. Provide `toDomain()` and `toPersistence()` methods. Account for legacy fields like `author_sort` and `has_cover`.
    
2. **The Repository:** Create `/catalog/infrastructure/prisma-book.repository.ts` implementing `IBookRepository`. Inject `PrismaService`, query the database, and use the `LegacyAclMapper` to translate the results before returning them.
    
3. **Wiring:** Update `catalog.module.ts`. Import the `SharedModule`. Replace the inline mock with `{ provide: 'IBookRepository', useClass: PrismaBookRepository }`.
    

**Strict Constraints:**

- The Legacy Calibre tables (`books`, `authors`, `data`) are FROZEN. You must map your domain to them, not the other way around.
    

## Agent Bravo: IAM Context

**Target Directory:** `/backend/src/iam/`

**Context:** Read the Spec Kit. You are building the Infrastructure layer for the IAM Context.

**Objective:**

1. **The Repository:** Create `/infrastructure/prisma-user.repository.ts` implementing `IUserRepository`. Inject `PrismaService` and perform CRUD operations on the `librarian_users` table. Translate between the Prisma model and your `User` aggregate.
    
2. **Security:** Create `/infrastructure/bcrypt-password.hasher.ts` implementing `IPasswordHasher`. Use the standard `bcrypt` library to hash and compare passwords.
    
3. **Wiring:** Update `iam.module.ts`. Import the `SharedModule`. Replace the inline mocks with `{ provide: 'IUserRepository', useClass: PrismaUserRepository }` and `{ provide: 'IPasswordHasher', useClass: BcryptPasswordHasher }`.
    

**Strict Constraints:**

- Keep infrastructure dependencies strictly within `/infrastructure`. Ensure your tests mock `bcrypt` to avoid slow test execution.
    

## Agent Charlie: Storage & Asset Context

**Target Directory:** `/backend/src/storage/`

**Context:** Read the Spec Kit. You are building the Infrastructure layer for the Storage Context.

**Objective:**

1. **File System Adapter:** Create `/infrastructure/local-file.storage.ts` implementing `IFileStorage`. Use native `fs.promises` and `path` to physically save the provided file buffer to a `.librarian/assets/` directory in the project root. Return the saved file path.
    
2. **The Repository:** Create `/infrastructure/prisma-asset.repository.ts` implementing `IAssetRepository`. Inject `PrismaService` and map your `Asset` metadata to the legacy `data` Prisma model.
    
3. **Wiring:** Update `storage.module.ts`. Import the `SharedModule`. Replace the inline mocks with your new Infrastructure classes.
    

**Strict Constraints:**

- Ensure your `fs` logic uses purely asynchronous methods (`fs.promises`). Do NOT use synchronous methods like `writeFileSync`.
