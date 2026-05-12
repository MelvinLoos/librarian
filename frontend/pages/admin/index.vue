<template>
  <div class="min-h-screen bg-surface px-4 py-16 text-on-surface">
    <div class="mx-auto max-w-5xl space-y-8">
      <div class="rounded-[2.5rem] bg-surface-container-high/65 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <h1 class="text-4xl font-serif font-semibold text-on-surface">Admin dashboard</h1>
        <p class="mt-2 text-on-surface-variant">Secure tools for library ingestion and book metadata management.</p>
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <UploadDropzone />
        <ManualBookForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UploadDropzone from '~/components/UploadDropzone.vue'
import ManualBookForm from '~/components/ManualBookForm.vue'

definePageMeta({ middleware: ['admin'] })
</script>
