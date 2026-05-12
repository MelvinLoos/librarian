<template>
  <div class="min-h-screen bg-surface px-4 py-16 text-on-surface">
    <div class="mx-auto max-w-md rounded-[2.5rem] bg-surface-container-high/65 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl">
      <h1 class="text-4xl font-serif font-semibold text-on-surface">Sign in</h1>
      <p class="mt-3 text-sm text-on-surface-variant">Access your library and discover your next read.</p>

      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <label class="block text-sm text-on-surface-variant leading-relaxed">
          <span class="font-bold uppercase tracking-wider text-[10px]">Email</span>
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            class="mt-3 w-full rounded-[2rem] bg-surface-variant/20 px-4 py-3 text-on-surface placeholder:text-on-surface-variant outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label class="block text-sm text-on-surface-variant leading-relaxed">
          <span class="font-bold uppercase tracking-wider text-[10px]">Password</span>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="mt-3 w-full rounded-[2rem] bg-surface-variant/20 px-4 py-3 text-on-surface placeholder:text-on-surface-variant outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div v-if="errorMessage" class="rounded-[2rem] bg-error-container/20 px-4 py-3 text-sm text-error">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full rounded-[2rem] bg-primary-gradient px-5 py-3 text-sm font-semibold text-on-primary transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-primary/20"
        >
          <span v-if="isLoading">Signing in…</span>
          <span v-else>Sign in</span>
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-on-surface-variant">
        New here? <NuxtLink to="/register" class="text-primary transition hover:text-primary-dim">Create account</NuxtLink>
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
