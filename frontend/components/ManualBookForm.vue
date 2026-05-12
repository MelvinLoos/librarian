<template>
  <div class="rounded-[2rem] bg-surface-container-high/70 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl">
    <h2 class="text-2xl font-serif font-semibold text-on-surface">Quick add a book</h2>
    <p class="mt-2 text-sm text-on-surface-variant">Add a book manually while ingestion completes in the background.</p>

    <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
      <label class="block text-sm text-on-surface-variant leading-relaxed">
        <span class="font-bold uppercase tracking-wider text-[10px]">Title</span>
        <input
          v-model="form.title"
          required
          type="text"
          placeholder="The Great Gatsby"
          class="mt-3 w-full rounded-[2rem] bg-surface-variant/20 px-4 py-3 text-on-surface placeholder:text-on-surface-variant outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <label class="block text-sm text-on-surface-variant leading-relaxed">
        <span class="font-bold uppercase tracking-wider text-[10px]">Author</span>
        <input
          v-model="form.author"
          required
          type="text"
          placeholder="F. Scott Fitzgerald"
          class="mt-3 w-full rounded-[2rem] bg-surface-variant/20 px-4 py-3 text-on-surface placeholder:text-on-surface-variant outline-none transition focus:bg-surface-variant/30 focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <button
        type="submit"
        :disabled="isLoading"
        class="inline-flex items-center justify-center rounded-[2rem] bg-primary-gradient px-6 py-3 text-sm font-semibold text-on-primary transition hover:opacity-95 shadow-lg shadow-primary/20"
      >
        <span v-if="isLoading">Adding…</span>
        <span v-else>Finish ingestion</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useApiBase } from '~/composables/useApiBase'

const apiBase = useApiBase()
const isLoading = ref(false)

const form = ref({
  title: '',
  author: '',
})

const handleSubmit = async () => {
  isLoading.value = true
  try {
    await useApiFetch('/books/manual', {
      baseURL: apiBase,
      method: 'POST',
      body: form.value,
    })
    toast.success('Book information added successfully!')
    form.value = { title: '', author: '' }
  } catch (error) {
    console.error(error)
    toast.error('Failed to add book information.')
  } finally {
    isLoading.value = false
  }
}
</script>
