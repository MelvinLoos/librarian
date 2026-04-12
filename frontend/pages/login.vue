<template>
  <div class="min-h-screen bg-[#080e1a] px-4 py-16 text-gray-200">
    <div class="mx-auto max-w-md rounded-[2.5rem] bg-gray-950/65 p-8 shadow-[0_20px_40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <h1 class="text-4xl font-serif font-semibold text-white">Sign in</h1>
      <p class="mt-3 text-sm text-gray-400">Access your library and discover your next read.</p>

      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <label class="block text-sm text-gray-300">
          <span>Email</span>
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            class="mt-3 w-full rounded-[2rem] bg-gray-900/55 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none transition focus:bg-gray-900/80 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>

        <label class="block text-sm text-gray-300">
          <span>Password</span>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="mt-3 w-full rounded-[2rem] bg-gray-900/55 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none transition focus:bg-gray-900/80 focus:ring-2 focus:ring-violet-500/20"
          />
        </label>

        <div v-if="errorMessage" class="rounded-[2rem] bg-red-950/70 px-4 py-3 text-sm text-red-300">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full rounded-[2rem] bg-gradient-to-br from-[#bd9dff] via-[#a77bff] to-[#8a4cfc] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span v-if="isLoading">Signing in…</span>
          <span v-else>Sign in</span>
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-400">
        New here? <NuxtLink to="/register" class="text-violet-400 transition hover:text-violet-300">Create account</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    })

    toast.success('Welcome back!')
    return router.replace('/')
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Invalid email or password.'
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}
</script>
