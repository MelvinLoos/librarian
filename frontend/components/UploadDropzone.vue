<template>
  <div
    data-test="upload-dropzone"
    :class="dropzoneClasses"
    role="button"
    tabindex="0"
    aria-label="Upload files: drag and drop or press Enter to browse"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @keydown.enter.prevent="openFileBrowser()"
    @keydown.space.prevent="openFileBrowser()"
    @click="openFileBrowser($event)"
  >
    <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/10 text-secondary">
      <span class="material-symbols-outlined text-4xl">cloud_upload</span>
    </div>

    <p class="text-lg font-serif font-semibold text-on-surface">Drag and drop files here</p>
    <p class="mt-2 text-sm text-on-surface-variant">Upload EPUB, PDF, MOBI, AZW3 or TXT files.</p>

    <div v-if="entries.length > 1" data-test="file-filter" class="mt-4">
      <UiInput
        :model-value="filter"
        placeholder="Filter files…"
        aria-label="Filter queued files by name"
        @update:model-value="filter = $event"
      />
    </div>

    <div v-if="filteredEntries.length > 0" class="mt-6 space-y-3">
      <div
        v-for="entry in filteredEntries"
        :key="entry.id"
        data-test="upload-row"
        class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-variant/10 px-4 py-3"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span class="material-symbols-outlined text-on-surface-variant">description</span>
          <span class="truncate text-sm font-medium">{{ entry.file.name }}</span>
        </div>

        <span data-test="upload-status" :class="badgeVariants({ state: entry.state })">
          {{ statusLabel(entry) }}
        </span>

        <div
          v-if="entry.state === 'converting'"
          data-test="upload-progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="entry.progress"
          class="h-1.5 w-24 overflow-hidden rounded-full bg-surface-variant/30"
        >
          <div class="h-full rounded-full bg-primary" :style="{ width: `${entry.progress}%` }" />
        </div>

        <div v-if="entry.state === 'queued' && entry.targets.length > 0" data-test="conversion-target" class="min-w-40">
          <UiSelect
            :model-value="entry.targetFormat"
            :options="entry.targets"
            :aria-label="'Conversion target for ' + entry.file.name"
            @update:model-value="setTarget(entry, $event)"
          />
        </div>

        <div class="flex items-center gap-2">
          <UiButton
            v-if="entry.state === 'queued'"
            data-test="remove-file"
            tone="ghost"
            size="sm"
            @click="removeEntry(entry.id)"
          >
            Remove
          </UiButton>
          <UiButton
            v-if="entry.state === 'error'"
            data-test="row-details"
            tone="ghost"
            size="sm"
            @click="openDetails(entry)"
          >
            Details
          </UiButton>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      class="hidden"
      aria-hidden="true"
      accept=".epub,.pdf,.mobi,.azw3,.txt"
      @change="handleFileInput"
    />

    <div class="mt-8 flex flex-wrap items-center gap-3">
      <UiButton data-test="browse-files" @click="openFileBrowser">Browse Files</UiButton>
      <UiButton
        v-if="entries.length > 0"
        data-test="start-upload"
        tone="secondary"
        :disabled="busy"
        @click="startUpload"
      >
        {{ busy ? 'Processing…' : 'Start Upload' }}
      </UiButton>
    </div>
  </div>

  <UiDialog
    data-test="upload-error-dialog"
    :open="detailsOpen"
    :title="detailsTitle"
    @close="detailsOpen = false"
  >
    <p class="text-sm text-error">{{ detailsMessage }}</p>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, ref, withDefaults } from 'vue'
import { tv } from 'tailwind-variants'
import { useAuthStore } from '~/stores/auth'
export type UploadEntryState = 'queued' | 'uploading' | 'converting' | 'done' | 'error'

interface UploadTarget {
  value: string
  label: string
}

interface UploadEntry {
  id: number
  file: File
  state: UploadEntryState
  progress: number
  errorMessage?: string
  assetId?: string
  bookId?: number
  jobId?: string
  targetFormat?: string
  targets: UploadTarget[]
}

const props = withDefaults(
  defineProps<{
    pollIntervalMs?: number
    maxStatusPolls?: number
  }>(),
  {
    pollIntervalMs: 500,
    maxStatusPolls: 8,
  },
)

const auth = useAuthStore()

const ALLOWED_EXTENSIONS = /\.(epub|pdf|mobi|azw3|txt)$/i

/** Mirrors backend FormatRegistry source -> target matrix (Storage Bounded Context). */
const CONVERSION_MATRIX: Record<string, string[]> = {
  epub: ['PDF', 'MOBI', 'TXT'],
  mobi: ['EPUB'],
  pdf: ['EPUB'],
  azw3: ['EPUB'],
  txt: ['EPUB'],
}

const badgeVariants = tv({
  variants: {
    state: {
      queued: 'bg-surface-variant/20 text-on-surface-variant',
      uploading: 'bg-primary-container/30 text-primary',
      converting: 'bg-primary-container/30 text-primary',
      done: 'bg-secondary-container/30 text-on-secondary-container',
      error: 'bg-error-container text-on-error-container',
    },
  },
  defaultVariants: { state: 'queued' },
})

const isDragging = ref(false)
const isUploading = ref(false)
const filter = ref('')
const detailsOpen = ref(false)
const detailsMessage = ref('')
const detailsTitle = ref('Upload failed')
const fileInput = ref<HTMLInputElement | null>(null)

let nextId = 1
const entries = ref<UploadEntry[]>([])

const authHeaders = () => (auth.token ? { Authorization: 'Bearer ' + auth.token } : {})

const busy = computed(() => entries.value.some((e) => e.state === 'uploading' || e.state === 'converting'))

const dropzoneClasses = computed(() => {
  const base =
    'rounded-[2rem] p-12 text-center text-on-surface shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition duration-200 border-2 border-dashed'
  return isDragging.value
    ? base + ' border-primary/50 bg-primary-container/20'
    : base + ' border-outline-variant/20 bg-surface-container-high/70 hover:bg-surface-variant/10 hover:border-primary/40'
})

const filteredEntries = computed(() => {
  const needle = filter.value.trim().toLowerCase()
  if (!needle) return entries.value
  return entries.value.filter((e) => e.file.name.toLowerCase().includes(needle))
})

const statusLabel = (entry: UploadEntry) => {
  switch (entry.state) {
    case 'queued':
      return 'Queued'
    case 'uploading':
      return 'Uploading'
    case 'converting':
      return 'Converting'
    case 'done':
      return 'Done'
    case 'error':
      return 'Error'
  }
}

const targetsFor = (fileName: string): UploadTarget[] => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)
  const ext = match ? match[1] : ''
  return (CONVERSION_MATRIX[ext] ?? []).map((format) => ({ value: format, label: format }))
}

const addFiles = (newFiles: File[]) => {
  const valid = newFiles.filter((file) => ALLOWED_EXTENSIONS.test(file.name))
  for (const file of valid) {
    entries.value.push({
      id: nextId++,
      file,
      state: 'queued',
      progress: 0,
      targets: targetsFor(file.name),
    })
  }
  entries.value = [...entries.value]
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  addFiles(Array.from(event.dataTransfer?.files || []))
}

const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  addFiles(Array.from(input.files || []))
  input.value = ''
}

const openFileBrowser = (event?: Event) => {
  if (event) {
    // Ignore clicks that bubbled up from interactive children (button/select/input).
    const target = (event.target as HTMLElement | null)
    if (target && target.closest('button, input, select, a, label')) return
  }
  try {
    fileInput.value?.click()
  } catch {
    // Some environments fail to synthesize a click on a hidden file input.
  }
}

const removeEntry = (id: number) => {
  entries.value = entries.value.filter((e) => e.id !== id)
}

const setTarget = (entry: UploadEntry, format: string) => {
  entry.targetFormat = format
}

const openDetails = (entry: UploadEntry) => {
  detailsMessage.value = entry.errorMessage ?? 'Unknown upload error'
  detailsTitle.value = entry.file.name + ' failed'
  detailsOpen.value = true
}
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const safeJson = async (res: Response) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const convert = async (entry: UploadEntry) => {
  entry.state = 'converting'
  try {
    const res = await fetch('/api/assets/books/' + entry.bookId + '/convert', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetFormat: entry.targetFormat }),
    })
    const data = res.ok ? await safeJson(res) : null
    if (!data?.jobId) {
      entry.state = 'error'
      entry.errorMessage = 'Conversion request rejected'
      return
    }
    entry.jobId = data.jobId
    await trackJob(entry)
  } catch {
    entry.state = 'error'
    entry.errorMessage = 'Conversion request failed'
  }
}

const trackJob = async (entry: UploadEntry) => {
  for (let attempt = 1; attempt <= props.maxStatusPolls; attempt++) {
    await delay(props.pollIntervalMs)
    try {
      const res = await fetch('/api/assets/conversions/' + entry.jobId, {
        headers: authHeaders(),
      })
      const data = res.ok ? await safeJson(res) : null
      if (!data) continue
      entry.progress = typeof data.progress === 'number' ? data.progress : entry.progress
      if (data.status === 'completed') {
        entry.state = 'done'
        entry.progress = 100
        return
      }
      if (data.status === 'failed' || data.status === 'cancelled') {
        entry.state = 'error'
        entry.errorMessage = data.errorMessage ?? 'Conversion ' + data.status
        return
      }
    } catch {
      // transient poll failure — keep polling until the budget is exhausted
    }
  }
  entry.state = 'error'
  entry.errorMessage = 'Timed out waiting for conversion'
}

const waitForBook = async (entry: UploadEntry) => {
  for (let attempt = 1; attempt <= props.maxStatusPolls; attempt++) {
    await delay(props.pollIntervalMs)
    try {
      const res = await fetch('/api/assets/' + entry.assetId + '/status', { headers: authHeaders() })
      const data = res.ok ? await safeJson(res) : null
      if (!data) continue
      if (data.state === 'FAILED') {
        entry.state = 'error'
        entry.errorMessage = 'Ingestion failed'
        return
      }
      if (typeof data.bookId === 'number') {
        entry.bookId = data.bookId
        if (entry.targetFormat && entry.targets.length > 0) {
          await convert(entry)
        } else {
          entry.state = 'done'
        }
        return
      }
    } catch {
      // transient poll failure — keep polling until the budget is exhausted
    }
  }
  entry.state = 'error'
  entry.errorMessage = 'Timed out waiting for ingestion'
}

const uploadOne = async (entry: UploadEntry) => {
  entry.state = 'uploading'
  isUploading.value = true
  const formData = new FormData()
  formData.append('file', entry.file)
  try {
    const res = await fetch('/api/assets/upload', {
      method: 'POST',
      body: formData,
      headers: authHeaders(),
    })
    const data = res.ok ? await safeJson(res) : null
    if (!res.ok || !data?.id) {
      entry.state = 'error'
      entry.errorMessage = data?.message ?? 'Upload failed'
      return
    }
    entry.assetId = data.id
    await waitForBook(entry)
  } catch (error) {
    entry.state = 'error'
    entry.errorMessage = error instanceof Error ? error.message : 'Upload failed'
  } finally {
    isUploading.value = false
  }
}

const startUpload = async () => {
  const queued = entries.value.filter((e) => e.state === 'queued')
  if (queued.length === 0) return
  for (const entry of queued) {
    await uploadOne(entry)
  }
}
</script>