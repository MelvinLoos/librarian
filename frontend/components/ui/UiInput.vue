<script setup lang="ts">
import { computed, withDefaults } from 'vue'
import { tv } from 'tailwind-variants'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | undefined
    type?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    maxlength?: number | undefined
  }>(),
  {
    modelValue: undefined,
    type: 'text',
    placeholder: undefined,
    disabled: false,
    required: false,
    invalid: false,
    maxlength: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const inputVariants = tv({
  base: 'w-full rounded-xl bg-surface-variant/10 px-3 py-2 text-on-surface appearance-none transition focus:ring-2 focus:ring-primary/40 focus:ring-offset-1',
  variants: {
    invalid: {
      true: 'outline outline-error/60',
      false: '',
    },
  },
  defaultVariants: { invalid: false },
})

const classes = computed(() => inputVariants({ invalid: props.invalid }))

const onInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
}
</script>

<template>
  <input
    data-test="ui-input"
    :class="classes"
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="maxlength"
    :aria-required="required ? 'true' : undefined"
    :aria-invalid="invalid ? 'true' : undefined"
    @input="onInput"
  />
</template>