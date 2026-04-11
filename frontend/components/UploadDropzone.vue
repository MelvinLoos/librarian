<template>
  <div
    class="rounded-[2rem] bg-gray-950/70 p-12 text-center text-gray-200 shadow-[0_20px_40px_rgba(15,23,42,0.35)] transition duration-200 hover:bg-gray-900/80"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
  >
    <p class="text-lg font-semibold text-white">Drag and drop files here</p>
    <p class="mt-2 text-sm text-gray-400">Upload EPUB, PDF, or MOBI files to ingest new books.</p>
    <input ref="fileInput" type="file" class="sr-only" multiple @change="onFileChange" />
    <button
      type="button"
      class="mt-6 inline-flex items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#bd9dff] via-[#a77bff] to-[#8a4cfc] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-95"
      @click="triggerFileInput"
    >
      Select files
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useApiBase } from '~/composables/useApiBase'

const fileInput = ref<HTMLInputElement | null>(null)
const apiBase = useApiBase()

const triggerFileInput = () => {
  fileInput.value?.click()
}

const uploadFiles = async (files: FileList | File[]) => {
  if (!files || files.length === 0) {
    toast.info('No file selected.')
    return
  }

  const formData = new FormData()
  Array.from(files).forEach((file) => formData.append('files', file))

  const uploadPromise = fetch(`${apiBase}/assets`, {
    method: 'POST',
    body: formData,
  }).then(async (response) => {
    if (!response.ok) {
      const body = await response.text()
      throw new Error(body || 'Upload failed')
    }
    return response.json()
  })

  toast.promise(uploadPromise, {
    loading: 'Uploading files...',
    success: 'Files uploaded successfully. Metadata extraction started.',
    error: 'Upload failed. Please try again.',
  })
}

const onDragOver = () => {
  /* intentionally empty to enable drop */
}

const onDrop = (event: DragEvent) => {
  if (!event.dataTransfer?.files.length) {
    toast.info('No files were dropped.')
    return
  }
  uploadFiles(event.dataTransfer.files)
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    uploadFiles(target.files)
  }
}
</script>
