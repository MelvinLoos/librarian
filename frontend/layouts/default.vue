<template>
  <div class="min-h-screen bg-[#080e1a] text-gray-200">
    <header class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#080e1a]/95 backdrop-blur-xl">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 py-3">
        <div class="flex items-center justify-between gap-4">
          <NuxtLink to="/" class="flex items-center gap-3 shrink-0">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-300 text-lg font-semibold border border-violet-500/20">L</span>
            <div class="hidden xs:block">
              <p class="text-base font-semibold text-white leading-tight">Librarian</p>
              <p class="text-[10px] uppercase tracking-[0.2em] text-gray-400">Digital Vault</p>
            </div>
          </NuxtLink>

          <!-- Desktop Search -->
          <div class="hidden md:flex flex-1 max-w-xl mx-4 relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input
              type="search"
              placeholder="Search your library..."
              class="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-gray-100 outline-none transition focus:border-violet-500 focus:bg-white/10 focus:ring-4 focus:ring-violet-500/10 shadow-inner"
            />
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div v-if="authStore.isAuthenticated" class="hidden sm:flex flex-col items-end">
              <p class="text-xs font-medium text-white">{{ authStore.user?.email }}</p>
              <p class="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{{ authStore.user?.role }}</p>
            </div>
            
            <button
              v-if="authStore.isAuthenticated"
              @click="authStore.logout()"
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/20"
              title="Sign Out"
            >
              <span class="material-symbols-outlined text-[20px]">logout</span>
            </button>
            
            <NuxtLink 
              v-else 
              to="/login"
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-300 border border-violet-500/20 transition hover:bg-violet-600/20"
            >
              <span class="material-symbols-outlined">login</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Mobile Search Row (Always visible on small screens) -->
        <div class="mt-3 md:hidden">
          <div class="relative group">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg transition-colors group-focus-within:text-violet-400">search</span>
            <input
              type="search"
              placeholder="Search books, authors, series..."
              class="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-gray-100 outline-none transition focus:border-violet-500 focus:bg-white/10 focus:ring-4 focus:ring-violet-500/10 shadow-inner"
            />
          </div>
        </div>
      </div>
    </header>

    <main class="pt-[128px] md:pt-28 pb-24">
      <slot />
    </main>

    <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#080e1a]/95 backdrop-blur-md pb-6 pt-2">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <NuxtLink to="/" class="flex flex-col items-center justify-center gap-1 text-xs text-gray-300 transition hover:text-violet-300">
          <span class="material-symbols-outlined text-2xl">auto_stories</span>
          <span>Library</span>
        </NuxtLink>
        <NuxtLink to="/" class="flex flex-col items-center justify-center gap-1 text-xs text-gray-300 transition hover:text-violet-300">
          <span class="material-symbols-outlined text-2xl">explore</span>
          <span>Discover</span>
        </NuxtLink>
        <NuxtLink to="/settings" class="flex flex-col items-center justify-center gap-1 text-xs text-gray-300 transition hover:text-violet-300">
          <span class="material-symbols-outlined text-2xl">settings</span>
          <span>Settings</span>
        </NuxtLink>
        <button
          v-if="authStore.isAuthenticated"
          @click="authStore.logout()"
          class="flex flex-col items-center justify-center gap-1 text-xs text-gray-300 transition hover:text-red-400"
        >
          <span class="material-symbols-outlined text-2xl">logout</span>
          <span>Logout</span>
        </button>
        <NuxtLink v-else to="/login" class="flex flex-col items-center justify-center gap-1 text-xs text-gray-300 transition hover:text-violet-300">
          <span class="material-symbols-outlined text-2xl">person</span>
          <span>Login</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
const authStore = useAuthStore()
</script>
