<template>
  <div class="min-h-screen bg-surface text-on-surface">
    <header class="fixed inset-x-0 top-0 z-50 border-b border-outline-variant/10 bg-surface/98 backdrop-blur-xl">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div class="flex items-center gap-3 sm:gap-6">
          <NuxtLink to="/" class="flex items-center gap-3 shrink-0">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary text-lg font-semibold border border-primary/20">L</span>
            <div class="hidden sm:block">
              <p class="text-base font-semibold text-on-surface leading-tight">Librarian</p>
            </div>
          </NuxtLink>

          <!-- Search Bar (Unified for all screens) -->
          <div class="flex-1 relative group">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg transition-colors group-focus-within:text-primary">search</span>
            <input
              v-model="searchStore.query"
              type="search"
              placeholder="Search books, authors, series..."
              class="w-full rounded-2xl border border-outline-variant/10 bg-surface-variant/10 pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition focus:border-primary focus:bg-surface-variant/20 focus:ring-4 focus:ring-primary/10 shadow-inner"
            />
          </div>

          <div id="user-info" class="flex items-center gap-3 shrink-0">
            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-variant/10 text-on-surface border border-outline-variant/20 transition hover:bg-surface-variant/20 hover:text-primary"
              aria-label="Toggle theme"
            >
              <Sun v-if="theme === 'dark'" :size="20" />
              <Moon v-else :size="20" />
            </button>

            <div v-if="authStore.isAuthenticated" class="hidden md:flex flex-col items-end">
              <p class="text-xs font-medium text-on-surface">{{ authStore.user?.email }}</p>
              <p class="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">{{ authStore.user?.role }}</p>
            </div>
            
            <NuxtLink 
              v-else 
              to="/login"
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition hover:bg-primary/20"
            >
              <span class="material-symbols-outlined">login</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main class="pt-24 pb-24">
      <slot />
    </main>

    <OfflineIndicator />

    <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/10 bg-surface/98 backdrop-blur-md pb-6 pt-2">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <NuxtLink to="/" class="flex flex-col items-center justify-center gap-1 text-xs text-on-surface transition hover:text-primary">
          <span class="material-symbols-outlined text-2xl">auto_stories</span>
          <span>Library</span>
        </NuxtLink>
        <NuxtLink to="/" class="flex flex-col items-center justify-center gap-1 text-xs text-on-surface transition hover:text-primary">
          <span class="material-symbols-outlined text-2xl">explore</span>
          <span>Discover</span>
        </NuxtLink>
        <NuxtLink to="/downloads" class="flex flex-col items-center justify-center gap-1 text-xs text-on-surface transition hover:text-primary">
          <span class="material-symbols-outlined text-2xl">download_for_offline</span>
          <span>Downloads</span>
        </NuxtLink>

        <NuxtLink to="/settings" class="flex flex-col items-center justify-center gap-1 text-xs text-on-surface transition hover:text-primary">
          <span class="material-symbols-outlined text-2xl">settings</span>
          <span>Settings</span>
        </NuxtLink>
        <button
          v-if="authStore.isAuthenticated"
          @click="authStore.logout()"
          class="flex flex-col items-center justify-center gap-1 text-xs text-on-surface transition hover:text-error"
        >
          <span class="material-symbols-outlined text-2xl">logout</span>
          <span>Logout</span>
        </button>
        <NuxtLink v-else to="/login" class="flex flex-col items-center justify-center gap-1 text-xs text-on-surface transition hover:text-primary">
          <span class="material-symbols-outlined text-2xl">person</span>
          <span>Login</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useSearchStore } from '~/stores/search'
import { useTheme } from '~/composables/useTheme'
import OfflineIndicator from '~/components/OfflineIndicator.vue'

const authStore = useAuthStore()
const searchStore = useSearchStore()
const { theme, toggleTheme } = useTheme()
</script>
