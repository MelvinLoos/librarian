<template>
  <div class="min-h-screen bg-[#080e1a] px-4 py-16 text-gray-200">
    <div class="mx-auto max-w-3xl space-y-8">
      <div class="rounded-[2.5rem] bg-gray-950/65 p-8 shadow-[0_20px_40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div class="mb-8">
          <h1 class="text-4xl font-serif font-semibold text-white">Settings</h1>
          <p class="text-sm text-gray-400">Manage your profile and OPDS access.</p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="rounded-[2rem] bg-gray-900/55 p-6">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-lg font-semibold text-white">Profile</h2>
              <button
                type="button"
                @click="handleLogout"
                class="rounded-full border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-500/20"
              >
                Logout
              </button>
            </div>

            <div class="mt-4 space-y-3 text-sm text-gray-300">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-gray-500">Email</p>
                <p class="mt-2 text-base text-gray-100">{{ email }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-gray-500">Role</p>
                <p class="mt-2 text-base text-violet-300">{{ role }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-[2rem] bg-gray-900/55 p-6">
            <h2 class="text-lg font-semibold text-white">Personal OPDS Feed</h2>
            <p class="mt-4 text-sm text-gray-300">Your personal feed URL is available here once your account is configured.</p>
            <div class="mt-6 rounded-[2rem] bg-gray-950/70 p-4 text-sm text-gray-300">
              <p class="break-all">{{ feedUrl }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const email = computed(() => authStore.user?.email ?? '')
const role = computed(() => authStore.user?.role ?? '')
const feedUrl = computed(() => {
  const origin = process.client ? window.location.origin : 'https://your.librarian.instance'
  return authStore.user?.id
    ? `${origin}/api/opds/feed/${authStore.user.id}`
    : `${origin}/api/opds/feed/local`
})

const handleLogout = () => {
  authStore.logout()
}
</script>
