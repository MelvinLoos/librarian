<script setup lang="ts">
import { withDefaults } from 'vue'
import { tv } from 'tailwind-variants'

export interface UiSelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | undefined
    options?: UiSelectOption[]
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    disabled: false,
    placeholder: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const selectVariants = tv({
  base: 'w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface appearance-none transition focus:ring-2 focus:ring-primary/40 focus:ring-offset-1',
})

const classes = selectVariants()

const onChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <select
    data-test="ui-select"
    :class="classes"
    :value="modelValue"
    :disabled="disabled"
    @change="onChange"
  >
    <option v-if="placeholder" value="" hidden>{{ placeholder }}</option>
    <option v-for="option in options" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>