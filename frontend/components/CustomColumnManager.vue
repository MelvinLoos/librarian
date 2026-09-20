<template>
  <div
    class="rounded-[2.5rem] bg-surface-container-high/65 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl"
    data-test="custom-column-manager"
  >
    <h2 class="text-2xl font-serif font-semibold text-on-surface">Custom Columns</h2>
    <p class="mt-1 text-sm text-on-surface-variant">Define library-wide metadata columns (e.g. #read_status).</p>

    <form class="mt-6 grid gap-3 sm:grid-cols-2" @submit.prevent="addColumn">
      <div class="flex flex-col gap-1" data-test="column-name">
        <UiInput
          :model-value="name"
          :invalid="Boolean(nameError)"
          aria-label="Column name"
          placeholder="#read_status"
          @update:model-value="onNameInput"
        />
        <p
          v-if="nameError"
          data-test="column-error"
          class="text-xs text-error"
          role="alert"
        >{{ nameError }}</p>
      </div>

      <div data-test="column-datatype">
        <UiSelect
          :model-value="dataType"
          :options="datatypeOptions"
          aria-label="Column data type"
          @update:model-value="dataType = $event"
        />
      </div>

      <div class="flex items-center gap-2" data-test="column-multiple">
        <UiCheckbox
          :model-value="isMultiple"
          label="Multiple values"
          @update:model-value="isMultiple = $event"
        />
      </div>

      <UiButton
        data-test="add-column"
        type="submit"
        tone="primary"
        size="sm"
        :disabled="isSubmitting"
        class="justify-self-end"
      >
        Add column
      </UiButton>
    </form>

    <ul v-if="columns.length" class="mt-6 space-y-2">
      <li
        v-for="column in columns"
        :key="column.id"
        data-test="custom-column-row"
        class="flex items-center justify-between rounded-xl bg-surface-variant/10 px-4 py-2 text-on-surface"
      >
        <span>
          {{ column.displayLabel || column.name }}
          <span class="text-on-surface-variant">({{ column.dataType }})</span>
        </span>
        <UiButton data-test="delete-column" tone="error" size="sm" @click="removeColumn(column.id)">
          Delete
        </UiButton>
      </li>
    </ul>
    <p v-else class="mt-6 text-sm text-on-surface-variant">No custom columns yet.</p>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import { CatalogApi } from '~/infrastructure/api/CatalogApi'
import type { CustomColumn, CustomColumnDataType } from '~/domain/catalog/Catalog.types'

const datatypes: CustomColumnDataType[] = ['text', 'series', 'number', 'rating', 'date', 'boolean']
const datatypeOptions = datatypes.map((type) => ({ value: type, label: type }))

const columns = ref<CustomColumn[]>([])
const name = ref('')
const dataType = ref<CustomColumnDataType>('text')
const isMultiple = ref(false)
const nameError = ref<string | null>(null)
const isSubmitting = ref(false)

const load = async () => {
  columns.value = await CatalogApi.getCustomColumns()
}

const onNameInput = (value: string | number) => {
  name.value = String(value)
  if (nameError.value) {
    nameError.value = null
  }
}

const addColumn = async () => {
  const trimmed = name.value.trim()

  if (!trimmed) {
    nameError.value = 'Name is required'
    return
  }
  if (columns.value.some((column) => column.name.toLowerCase() === trimmed.toLowerCase())) {
    nameError.value = `A column named "${trimmed}" already exists`
    return
  }

  isSubmitting.value = true
  try {
    await CatalogApi.upsertCustomColumn({
      name: trimmed,
      dataType: dataType.value,
      displayLabel: undefined,
      isMultiple: isMultiple.value,
    })
    name.value = ''
    dataType.value = 'text'
    isMultiple.value = false
    await load()
  } finally {
    isSubmitting.value = false
  }
}

const removeColumn = async (id: string) => {
  await CatalogApi.deleteCustomColumn(id)
  await load()
}

onMounted(load)
</script>