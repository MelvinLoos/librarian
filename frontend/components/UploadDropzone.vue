<template>
  <div
    class="rounded-[2rem] bg-surface-container-high/70 p-12 text-center text-on-surface shadow-[0_20px_40px_rgba(0,0,0,0.15)] backdrop-blur-xl transition duration-200 hover:bg-surface-variant/10 border-2 border-dashed border-outline-variant/20 hover:border-primary/40"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/10 text-secondary">
      <span class="material-symbols-outlined text-4xl">cloud_upload</span>
    </div>
    
    <p class="text-lg font-serif font-semibold text-on-surface">Drag and drop files here</p>
    <p class="mt-2 text-sm text-on-surface-variant">Upload EPUB, PDF, or MOBI files up to 100MB.</p>

    <div v-if="files.length > 0" class="mt-8 space-y-3">
      <div v-for="file in files" :key="file.name" class="flex items-center justify-between rounded-2xl bg-surface-variant/10 px-4 py-3">
        <div class="flex items-center gap-3 overflow-hidden">
          <span class="material-symbols-outlined text-on-surface-variant">description</span>
          <span class="truncate text-sm font-medium">{{ file.name }}</span>
        </div>
        <button @click="removeFile(file)" class="text-on-surface-variant hover:text-error transition-colors">
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>

    <input
      type="file"
      ref="fileInput"
      multiple
      class="hidden"
      accept=".epub,.pdf,.mobi"
      @change="handleFileInput"
    />

    <button
      @click="fileInput?.click()"
      class="mt-8 inline-flex items-center justify-center rounded-[2rem] bg-primary-gradient px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-95"
    >
      Browse Files
    </button>

    <button
      v-if="files.length > 0"
      @click="handleUpload"
      :disabled="isUploading"
      class="ml-3 mt-8 inline-flex items-center justify-center rounded-[2rem] bg-secondary px-6 py-3 text-sm font-semibold text-on-secondary shadow-lg shadow-secondary/20 transition hover:opacity-95 disabled:opacity-50"
    >
      {{ isUploading ? 'Uploading...' : 'Start Upload' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { useApiBase } from '~/composables/useApiBase'

const isDragging = ref(false)
const isUploading = ref(false)
const files = ref<File[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const apiBase = useApiBase()

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const droppedFiles = Array.from(e.dataTransfer?.files || [])
  addFiles(droppedFiles)
}

const handleFileInput = (e: Event) => {
  const selectedFiles = Array.from((e.target as HTMLInputElement).files || [])
  addFiles(selectedFiles)
}

const addFiles = (newFiles: File[]) => {
  const validFiles = newFiles.filter(f => f.name.match(/\.(epub|pdf|mobi)$/i))
  files.value = [...files.value, ...validFiles]
}

const removeFile = (file: File) => {
  files.value = files.value.filter(f => f !== file)
}

const handleUpload = async () => {
  if (files.value.length === 0) return
  
  isUploading.value = true
  const formData = new FormData()
  files.value.forEach(file => formData.append('files', file))

  try {
    const response = await fetch('/api/books/upload', {
      method: 'POST',
      body: formData,
    })
    toast.success('Files uploaded successfully. Processing started.')
    files.value = []
  } catch (error) {
    console.error(error)
    toast.error('Failed to upload files.')
  } finally {
    isUploading.value = false
  }
}
</script>
