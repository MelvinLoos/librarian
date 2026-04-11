// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
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
        enabled: true, // Enable PWA in development mode for easier testing
        suppressWarnings: true,
        navigateFallbackAllowlist: [/^\/$/],
        type: 'module',
      }
    }]
  ],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
