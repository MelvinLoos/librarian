<template>
  <div class="min-h-screen bg-[#080e1a] px-4 py-16 text-gray-200">
    <div class="mx-auto max-w-md rounded-[2.5rem] bg-gray-950/65 p-8 shadow-[0_20px_40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <h1 class="text-4xl font-serif font-semibold text-white">Create account</h1>
      <p class="mt-3 text-sm text-gray-400">Register and start building your personal book collection.</p>

      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
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

        <button
          type="submit"
          class="w-full rounded-[2rem] bg-gradient-to-br from-[#bd9dff] via-[#a77bff] to-[#8a4cfc] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
        >
          Register
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-400">
        Already have an account? <NuxtLink to="/login" class="text-violet-400 transition hover:text-violet-300">Sign in</NuxtLink>
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

const handleRegister = () => {
  const role = email.value.includes('admin') ? 'ADMIN' : 'READER'
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  authStore.register({ id, email: email.value, role })
  toast.success('Account created successfully')
  router.push('/')
}
</script>
