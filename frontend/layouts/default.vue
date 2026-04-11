<template>
  <div class="min-h-screen bg-[#080e1a] text-gray-200">
    <header class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#080e1a]/95 backdrop-blur-xl">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <NuxtLink to="/" class="flex items-center gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-300 text-lg font-semibold">L</span>
          <div>
            <p class="text-base font-semibold text-white">Librarian</p>
            <p class="text-[11px] uppercase tracking-[0.35em] text-gray-400">Your digital book vault</p>
          </div>
        </NuxtLink>

        <div class="hidden md:flex flex-1 max-w-xl">
          <input
            type="search"
            placeholder="Search your library"
            class="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-100 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>
    </header>

    <main class="pt-24 pb-24">
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
        <NuxtLink to="/login" class="flex flex-col items-center justify-center gap-1 text-xs text-gray-300 transition hover:text-violet-300">
          <span class="material-symbols-outlined text-2xl">person</span>
          <span>Account</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts"></script>
