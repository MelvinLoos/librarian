<template>
  <div class="min-h-screen bg-surface px-4 py-16 text-on-surface">
    <div class="mx-auto max-w-md rounded-[2.5rem] bg-surface-container-high/65 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl">
      <h1 class="text-4xl font-serif font-semibold text-on-surface">Create account</h1>
      <p class="mt-3 text-sm text-on-surface-variant">Register and start building your personal book collection.</p>

      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
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

        <label class="block text-sm text-on-surface-variant leading-relaxed">
          <span class="font-bold uppercase tracking-wider text-[10px]">Confirm Password</span>
          <input
            v-model="confirmPassword"
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
          <span v-if="isLoading">Creating account…</span>
          <span v-else>Register</span>
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-on-surface-variant">
        Already have an account? <NuxtLink to="/login" class="text-primary transition hover:text-primary-dim">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    toast.error(errorMessage.value)
    return
  }

  if (password.value.length < 8 || !/[0-9\W]/.test(password.value)) {
    errorMessage.value = 'Password must be at least 8 characters long and include a number or special character.'
    toast.error(errorMessage.value)
    return
  }

  isLoading.value = true

  try {
    await authStore.register({
      email: email.value,
      password: password.value,
    })

    toast.success('Welcome to Librarian!')
    return navigateTo('/')
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Unable to register. Please try again.'
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}
</script>
