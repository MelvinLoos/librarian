import { fileURLToPath, URL } from 'node:url'

const isDev = process.env.NODE_ENV !== 'production'

// https://nuxt.com/docs/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    'lucide-nuxt',
    '@nuxt/image',
    '@vueuse/nuxt',
    ['@vite-pwa/nuxt', {
      registerType: 'autoUpdate',
      manifest: {
        name: 'Librarian',
        short_name: 'Librarian',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
      },
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      },
      client: {
        installPrompt: true,
        periodicSyncForUpdates: 3600 // Check for updates every hour
      },
      devOptions: {
        enabled: !isDev,
        suppressWarnings: true,
        navigateFallbackAllowlist: [/^\/$/],
        type: 'module',
      }
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
      apiBase: process.env.API_BASE || 'http://localhost:3000'
    }
  },
  routeRules: {
    '/api/**': { proxy: 'http://localhost:3001/**' }
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})