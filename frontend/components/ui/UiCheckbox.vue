<script setup lang="ts">
import { withDefaults } from 'vue'
import { tv } from 'tailwind-variants'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean | undefined
    label?: string | undefined
    disabled?: boolean
    inputAriaLabel?: string | undefined
  }>(),
  {
    modelValue: undefined,
    label: undefined,
    disabled: false,
    inputAriaLabel: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const checkboxVariants = tv({
  base: 'flex items-center gap-2 cursor-pointer select-none',
})

const classes = checkboxVariants()

const onChange = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <label :class="classes">
    <input
      data-test="ui-checkbox"
      type="checkbox"
      class="h-4 w-4 rounded accent-primary"
      :checked="modelValue === true"
      :disabled="disabled"
      :aria-label="inputAriaLabel"
      @change="onChange"
    />
    <span v-if="label" class="text-sm text-on-surface-variant">{{ label }}</span>
  </label>
</template>