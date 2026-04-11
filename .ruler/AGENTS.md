# Sprint 4: The Nuxt 3 Frontend (Premium "Netflix-Style" UI)

In this sprint, the AI will scaffold the progressive web app (PWA) sequentially using Nuxt 3, Vue 3, and TailwindCSS. The UI must strictly follow our UI/UX research: dark mode by default, highly visual, edge-to-edge mobile designs, and cinematic detail views.

**CRITICAL RULES FOR ALL STEPS (READ CAREFULLY):**

1. **NO NPM INSTALLS:** Tailwind, Pinia, Lucide, `@nuxt/image`, `@vueuse/nuxt`, `vue-sonner`, `vitest`, and PWA modules are already installed. Do not run `npm install` or edit `package.json` or `nuxt.config.ts`.
    
2. **VUE 3 STRICT MODE:** You MUST use `<script setup lang="ts">` for all components. Do not use the Options API.
    
3. **SPA ROUTING & IMAGES:** * Use `<NuxtLink>` for all internal navigation. Do NOT use standard `<a>` tags.
    
    - Use `<NuxtImg>` for all book covers to ensure automatic WebP optimization. Do NOT use standard `<img>` tags.
        
4. **TESTING:** Every complex component or page MUST have a corresponding `.spec.ts` file using `@vue/test-utils` and `vitest`.
    
5. **COLOR PALETTE:** Use `bg-gray-950` or `bg-[#0a0a0a]` for the background. Use `text-gray-200` for primary text. Accent colors should be `violet-600` for primary actions.
    

## Step 1: Core Layout, IAM (Auth), & Settings

**Target Directory:** `/frontend/`

**Context:** You are responsible for the application shell, global navigation, RBAC state, and user settings.

**Objective:**

1. **State & RBAC:** Create `/stores/auth.ts` using Pinia. It must manage the JWT, user state, and provide getter functions like `isAdmin` and `isReader` based on the user's role.
    
2. **Mobile-First Layout:** Create `/layouts/default.vue`.
    
    - **Desktop (md+):** Collapsible left sidebar (`w-64 border-r border-gray-800/50 bg-gray-950`).
        
    - **Mobile (<md):** Fixed bottom tab bar (`fixed bottom-0 left-0 w-full bg-gray-950/90 backdrop-blur-md border-t border-gray-800 z-50`). Add `pb-6` to the tab bar for iOS safe areas. The main content `<slot />` needs `pb-24`.
        
    - **Global Search:** Add a visually prominent, glassmorphic search input in the top header (desktop) or a dedicated search tab (mobile). Bind this input to a global search state.
        
    - **RBAC Enforcement:** Wrap the "Admin/Upload" navigation link in a `v-if="authStore.isAdmin"` directive so regular readers never see it.
        
3. **Global Toaster:** In `app.vue`, import the `Toaster` component from `vue-sonner` and place it alongside `<NuxtLayout>`. Set its theme to `dark`.
    
4. **Pages:**
    
    - `/pages/login.vue` & `/pages/register.vue`: Glassmorphic centered cards (`bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm max-w-md w-full`). Use `toast.success()` on success.
        
    - `/pages/settings.vue`: A simple profile page where the user can view their Role, Email, and a placeholder area for "Personal OPDS Feed URL".
        
5. **Tests:** Create `layouts/default.spec.ts` to verify the Admin link only renders when the Pinia store role is ADMIN.
    

**Strict Constraints:** Do not touch `/pages/index.vue`.

## Step 2: Catalog, Discovery, & Search

**Target Directory:** `/frontend/`

**Context:** You are responsible for the main library interface, incorporating live search filtering and the cinematic detail view.

**Objective:**

1. **The Book Card & Skeleton:** * `/components/BookSkeleton.vue`: Loading placeholder (`aspect-[1/1.5] bg-gray-800 animate-pulse rounded-lg`).
    
    - `/components/BookCard.vue`: Aspect ratio `aspect-[1/1.5] bg-gray-900 overflow-hidden rounded-lg`. Use `<NuxtImg format="webp" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.05]">`. Truncate title text below the cover. Apply heavy shadows on hover.
        
2. **Main Grid View:** Create `/pages/index.vue`.
    
    - Fetch data using `useFetch('/api/books', { query: { search: searchQuery } })`. Watch the global search state from Step 1 to dynamically filter the grid.
        
    - **Grid:** `grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6`.
        
    - **Empty/Loading:** If pending, loop skeletons. If empty, show a centered Lucide icon with a message.
        
3. **Cinematic Detail View:** Create `/pages/book/[id].vue`.
    
    - **Ambient Background:** Blurred cover art absolutely behind the main content (`blur-3xl saturate-150 opacity-20 -z-10 object-cover w-full h-full absolute inset-0`). Add a gradient overlay (`bg-gradient-to-b from-gray-950/40 to-gray-950 absolute inset-0 -z-10`) to ensure text legibility.
        
    - **Metadata:** Display Title (`text-3xl md:text-5xl font-bold tracking-tight`), Author (`text-violet-400`), Tags, and Series.
        
    - **The Download Action:** Provide a prominent `violet-600` "Download" button. When clicked, it should trigger a native file download by pointing to `GET /api/assets/download/:bookId`.
        
4. **Tests:** Create `pages/index.spec.ts` to verify the grid renders skeletons when `pending` is true.
    

**Strict Constraints:** Do not edit `/layouts/default.vue` or auth-related files.

## Step 3: Admin & Storage Ingestion

**Target Directory:** `/frontend/`

**Context:** You are responsible for the administrative actions. This page must be strictly secured.

**Objective:**

1. **Route Protection:** Create a Nuxt middleware `/middleware/admin.ts`. It must verify `authStore.isAdmin`. If false, redirect to `/`.
    
2. **The Dropzone:** Create `/components/UploadDropzone.vue`.
    
    - Massive, dashed-border dropzone (`border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 hover:border-violet-500 hover:bg-violet-500/10`).
        
    - Use `@dragover.prevent` and `@drop.prevent` to stop native browser behavior.
        
    - Use `toast.promise()` or `toast.info()` from `vue-sonner` to display upload progress to `/api/assets`.
        
3. **Manual Entry Form:** Create `/components/ManualBookForm.vue`.
    
    - Form POSTs `{ title, author }` to `/api/books`. Use `toast.success()` on completion.
        
4. **Admin Dashboard:** Create `/pages/admin/index.vue`.
    
    - Apply `definePageMeta({ middleware: ['admin'] })`.
        
    - Display the `UploadDropzone` and `ManualBookForm` components.
        
5. **Tests:** Create `components/UploadDropzone.spec.ts` to ensure the component is structured properly and emits/handles drag events correctly.
    

**Strict Constraints:** Place your pages strictly under the `/pages/admin/` directory.