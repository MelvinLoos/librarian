<script setup lang="ts">
import { withDefaults } from 'vue'
import { tv } from 'tailwind-variants'

const props = withDefaults(
  defineProps<{
    modelValue?: string | undefined
    placeholder?: string | undefined
    disabled?: boolean
    rows?: number
  }>(),
  {
    modelValue: undefined,
    placeholder: undefined,
    disabled: false,
    rows: 4,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const textareaVariants = tv({
  base: 'w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface resize-y appearance-none transition focus:ring-2 focus:ring-primary/40 focus:ring-offset-1',
})

const classes = textareaVariants()

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    data-test="ui-textarea"
    :class="classes"
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    :disabled="disabled"
    @input="onInput"
  />
</template>