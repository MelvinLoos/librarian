import { fileURLToPath, URL } from 'node:url'

const isDev = process.env.NODE_ENV !== 'production'

// https://nuxt.com/docs/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    'lucide-nuxt',
    '@nuxt/image',
    '@vueuse/nuxt',
    ['@vite-pwa/nuxt', {
      registerType: 'autoUpdate',

      // Use injectManifest so we can supply a hand-crafted service worker that
      // registers a Workbox CacheFirst + RangeRequestsPlugin route for the
      // /api/assets/books/:id/stream endpoint.  The build pipeline will inject
      // the precache manifest (self.__WB_MANIFEST) into public/sw.ts at
      // compile time.
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.ts',

      manifest: {
        name: 'Librarian',
        short_name: 'Librarian',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
      },

      // injectManifest config — controls which assets are precached and
      // injected into self.__WB_MANIFEST inside the custom SW.
      injectManifest: {
        // Scope the injected precache to static shell assets only.
        // Book-stream blobs are handled by the runtime CacheFirst route in
        // sw.ts; they must NOT be listed here because their URLs are dynamic.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],

        // Prevent Workbox from silently skipping assets that are legitimately
        // large (e.g. font subsets).  The build will throw with a clear message
        // instead of silently omitting files.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
      },

      client: {
        installPrompt: true,
        periodicSyncForUpdates: 3600, // Check for updates every hour
      },

      devOptions: {
        enabled: !isDev,
        suppressWarnings: true,
        navigateFallbackAllowlist: [/^\/$/],
        type: 'module',
      },
    }]
  ],
  googleFonts: {
    families: {
      Newsreader: {
        wght: [200, 300, 400, 500, 600, 700, 800],
        ital: [200, 800]
      },
      Manrope: {
        wght: [200, 300, 400, 500, 600, 700, 800]
      },
      'Material+Symbols+Outlined': true
  },
    display: 'block',
    download: true
  },
  css: [fileURLToPath(new URL('./assets/css/main.css', import.meta.url))],
  app: {
    head: {
      link: [],
    },
  },
  pages: true,
  image: {
    domains: ['lh3.googleusercontent.com', 'placehold.co'],
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || '/api'
    }
  },
  routeRules: {
    '/api/**': { proxy: 'http://localhost:3001/api/**' }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
