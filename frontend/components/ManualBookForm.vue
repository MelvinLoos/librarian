<template>
  <div class="rounded-[2rem] bg-gray-950/70 p-8 shadow-[0_20px_40px_rgba(15,23,42,0.35)] backdrop-blur-xl">
    <h2 class="text-2xl font-serif font-semibold text-white">Quick add a book</h2>
    <p class="mt-2 text-sm text-gray-400">Add a book manually while ingestion completes in the background.</p>

    <form @submit.prevent="submitBook" class="mt-6 space-y-5">
      <label class="block text-sm text-gray-300">
        Title
        <input
          v-model="title"
          type="text"
          required
          class="mt-3 w-full rounded-[2rem] bg-gray-900/55 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none transition focus:bg-gray-900/80 focus:ring-2 focus:ring-violet-500/20"
        />
      </label>

      <label class="block text-sm text-gray-300">
        Author
        <input
          v-model="author"
          type="text"
          required
          class="mt-3 w-full rounded-[2rem] bg-gray-900/55 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none transition focus:bg-gray-900/80 focus:ring-2 focus:ring-violet-500/20"
        />
      </label>

      <button
        type="submit"
        class="inline-flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#bd9dff] via-[#a77bff] to-[#8a4cfc] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
      >
        Add book
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useApiFetch } from '~/composables/useApiFetch';

const title = ref('')
const author = ref('')
const apiBase = useApiBase()

const submitBook = async () => {
  const response = await useApiFetch(`/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title.value, author: author.value }),
  })

  if (!response.ok) {
    toast.error('Unable to add book. Please try again.')
    return
  }

  toast.success('Book added successfully')
  title.value = ''
  author.value = ''
}
</script>
