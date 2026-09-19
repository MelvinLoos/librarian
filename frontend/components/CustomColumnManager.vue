<template>
  <div class="rounded-[2.5rem] bg-surface-container-high/65 p-8 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-xl" data-test="custom-column-manager">
    <h2 class="text-2xl font-serif font-semibold text-on-surface">Custom Columns</h2>
    <p class="mt-1 text-sm text-on-surface-variant">Define library-wide metadata columns (e.g. #read_status).</p>

    <form class="mt-6 grid gap-3 sm:grid-cols-2" @submit.prevent="addColumn">
      <input v-model="name" data-test="column-name" placeholder="#read_status" class="rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface" />
      <select v-model="dataType" data-test="column-datatype" class="rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface">
        <option v-for="type in datatypes" :key="type" :value="type">{{ type }}</option>
      </select>
      <label class="flex items-center gap-2 text-sm text-on-surface-variant">
        <input v-model="isMultiple" type="checkbox" class="rounded" /> Multiple values
      </label>
      <button data-test="add-column" type="submit" class="justify-self-end rounded-full bg-primary-gradient px-6 py-2 text-sm font-semibold text-on-primary">
        Add column
      </button>
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
        <button data-test="delete-column" class="text-sm text-error" @click="removeColumn(column.id)">Delete</button>
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

const columns = ref<CustomColumn[]>([])
const name = ref('')
const dataType = ref<CustomColumnDataType>('text')
const isMultiple = ref(false)

const load = async () => {
  columns.value = await CatalogApi.getCustomColumns()
}

const addColumn = async () => {
  if (!name.value.trim()) return
  await CatalogApi.upsertCustomColumn({
    name: name.value.trim(),
    dataType: dataType.value,
    displayLabel: undefined,
    isMultiple: isMultiple.value,
  })
  name.value = ''
  dataType.value = 'text'
  isMultiple.value = false
  await load()
}

const removeColumn = async (id: string) => {
  await CatalogApi.deleteCustomColumn(id)
  await load()
}

onMounted(load)
</script>