# Sprint 5: Backend Data Expansion (NestJS + Prisma)

**Context:** We are expanding the NestJS backend to support the "Netflix-style" Nuxt 3 frontend. The frontend requires endpoints for recent additions, deep metadata joins (authors/series/synopsis), cover image streaming, and user reading progress tracking.

**CRITICAL RULES FOR AI AGENT:**

1. **Architecture:** Strictly adhere to NestJS Module/Controller/Service patterns.
    
2. **Database:** We are using Prisma with a legacy SQLite Calibre database (`metadata.db`). Do not alter existing legacy table structures.
    
3. **Testing:** **EVERY single endpoint and service method MUST have corresponding tests** in `[name].controller.spec.ts` and `[name].service.spec.ts`. You must use `@nestjs/testing` to mock the `PrismaService` and assert that the correct data is returned and correct methods are called.
    
4. **Error Handling:** Use standard NestJS exceptions (`NotFoundException`, `BadRequestException`) if records are missing or query parameters are invalid. Tests must cover these failure states.

5. **API Documentation:** The API MUST be a first-class citizen. Every Controller method must be decorated with `@ApiOperation`, `@ApiResponse`, and `@ApiTags`. Every DTO property must be decorated with `@ApiProperty` including an `example` and `description`. All endpoints requiring JWTs must be decorated with `@ApiBearerAuth()`.


## Step 1: Schema Updates (Reading Progress)

**Target Directory:** `/backend/`

**Objective:** Calibre does not track reading progress natively. We need a new table managed by Prisma to store where the user is in a book.

1. **Prisma Schema (`prisma/schema.prisma`):**
    
    - Add a new model called `LibrarianReadingProgress`.
        
    - Fields: `id` (Int, @id, @default(autoincrement())), `userId` (Int), `bookId` (Int), `currentPage` (Int, @default(0)), `totalPages` (Int, @default(0)), `updatedAt` (DateTime, @updatedAt).
        
    - Create a unique constraint on `@@unique([userId, bookId])` so a user only has one progress record per book.
        
2. **Execution:** After updating the file, provide the terminal command to the user to push this schema (`npx prisma db push`).
    
3. **No Tests Needed for Step 1** (Schema only).
    

## Step 2: The Asset Module (Cover Streaming)

**Target Directory:** `/backend/src/assets/`

**Context:** The frontend needs a way to fetch the `cover.jpg` file for the cinematic grid.

**Objective:**

1. **Service (`AssetService`):**
    
    - Create a method `getCoverStream(bookId: number)`.
        
    - It must query the `PrismaService` to find the book by ID and get its relative `path` from the Calibre database.
        
    - Construct the absolute path to the `cover.jpg` (combining the base Calibre library path from `.env` and the book's relative path).
        
    - Use Node's `fs` to check if the file exists. If not, throw `NotFoundException`.
        
    - Return a `fs.createReadStream`.
        
2. **Controller (`AssetController`):**
    
    - Add `GET /assets/covers/:bookId`.
        
    - Call the service, and wrap the stream in a NestJS `StreamableFile`.
        
    - Set the response header `Content-Type: image/jpeg`.
        
3. **Tests (`asset.controller.spec.ts` & `asset.service.spec.ts`):**
    
    - **Write strict tests:** Mock `fs.existsSync` and `PrismaService.book.findUnique`.
        
    - Assert that `NotFoundException` is thrown if the DB returns null.
        
    - Assert that `NotFoundException` is thrown if the file does not exist on disk.
        
    - Assert that a stream is successfully returned if both exist.
        

## Step 3: Catalog Expansion (Deep Metadata & Filters)

**Target Directory:** `/backend/src/catalog/`

**Context:** We need to upgrade the Book queries to support sorting (Recent Additions), joining relational data (Authors/Series), and aggregating tags.

**Objective:**

1. **Upgrade `GET /books` (`BookController` & `BookService`):**
    
    - Add optional query parameters: `?sort=added&order=desc&limit=10`.
        
    - The Prisma query must use the junction tables to `include` authors (`books_authors_link`) and tags (`books_tags_link`) so the frontend doesn't just get raw IDs.
        
2. **Upgrade `GET /books/:id`:**
    
    - It must `include` the author(s), series, and the `comments` table (which contains the HTML synopsis in Calibre). If the book doesn't exist, throw `NotFoundException`.
        
3. **New Endpoint `GET /tags/top` (`TagController` & `TagService`):**
    
    - Query the `tags` table and join it with the junction table to count how many books have each tag.
        
    - Return the top 15 tags sorted by frequency.
        
4. **New Endpoints `GET /authors` & `GET /series`:**
    
    - Return a simple list of all authors and series for the "Explore" UI.
        
5. **Tests (`catalog.controller.spec.ts` & `catalog.service.spec.ts`):**
    
    - Assert `GET /books` properly passes the `take: 10` and `orderBy` arguments to `PrismaService`.
        
    - Assert `GET /tags/top` returns an array of objects containing `{ id, name, count }`.
        
    - Assert `GET /books/:id` throws `NotFoundException` when querying an invalid ID.
        

## Step 4: User Progress Module (Now Reading)

**Target Directory:** `/backend/src/iam/` (or a dedicated `user` module if you split them)

**Context:** The frontend needs to save and retrieve where the user left off.

**Objective:**

1. **New Endpoint `PUT /users/me/progress/:bookId`:**
    
    - Requires JWT Authentication (extract `userId` from the request object).
        
    - Body expects `{ currentPage: number, totalPages: number }`.
        
    - Use Prisma's `upsert` on the `LibrarianReadingProgress` table using the unique `[userId, bookId]` constraint.
        
2. **New Endpoint `GET /users/me/reading-states`:**
    
    - Requires JWT Authentication.
        
    - Query `LibrarianReadingProgress` where `userId` matches.
        
    - You MUST `include` the `Book` relation in this query so the frontend gets the title and book ID to render the "Now Reading" card. Sort by `updatedAt` descending.
        
3. **Tests (`progress.controller.spec.ts` & `progress.service.spec.ts`):**
    
    - Assert that unauthenticated requests are rejected (mock the Auth Guard).
        
    - Assert the `PUT` endpoint calls `PrismaService.librarianReadingProgress.upsert` with the correct mapped data.
        
    - Assert the `GET` endpoint returns an array of reading states attached to book metadata.