<script setup lang="ts">
import { computed, withDefaults } from 'vue'
import { tv } from 'tailwind-variants'

export type UiButtonTone = 'primary' | 'secondary' | 'error' | 'ghost'
export type UiButtonSize = 'sm' | 'md' | 'lg'
export type UiButtonType = 'button' | 'submit' | 'reset'

const props = withDefaults(
  defineProps<{
    tone?: UiButtonTone
    size?: UiButtonSize
    type?: UiButtonType
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    tone: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
  },
)

const emit = defineEmits<{ click: [] }>()

const buttonVariants = tv({
  base: 'inline-flex items-center justify-center rounded-full font-semibold transition hover:opacity-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
  variants: {
    tone: {
      primary: 'bg-primary-gradient text-on-primary shadow-lg shadow-primary/20',
      secondary: 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20',
      error: 'bg-error text-on-error',
      ghost: 'text-on-surface-variant hover:bg-surface-variant/10',
    },
    size: {
      sm: 'px-4 py-1.5 text-sm',
      md: 'px-6 py-2 text-sm',
      lg: 'px-8 py-3 text-base',
    },
  },
  defaultVariants: { tone: 'primary', size: 'md' },
})

const classes = computed(() => buttonVariants({ tone: props.tone, size: props.size }))
const isDisabled = computed(() => props.disabled || props.loading)

const onClick = () => {
  if (!isDisabled.value) {
    emit('click')
  }
}
</script>

<template>
  <button
    data-test="ui-button"
    :class="classes"
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading ? 'true' : undefined"
    @click="onClick"
  >
    <!-- @slot Default slot renders the button label. -->
    <slot />
  </button>
</template>