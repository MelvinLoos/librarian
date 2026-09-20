<script setup lang="ts">
import { withDefaults } from 'vue'
import { tv } from 'tailwind-variants'

const props = withDefaults(
  defineProps<{
    label?: string | undefined
    variant?: 'default' | 'primary' | 'outlined'
    tag?: string
  }>(),
  {
    label: undefined,
    variant: 'default',
    tag: 'span',
  },
)

const badgeVariants = tv({
  base: 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
  variants: {
    variant: {
      default: 'bg-primary/10 text-primary',
      primary: 'bg-primary text-on-primary',
      outlined: 'border border-outline-variant/30 text-on-surface-variant',
    },
  },
  defaultVariants: { variant: 'default' },
})

const classes = badgeVariants({ variant: props.variant })
</script>

<template>
  <component
    :is="tag"
    data-test="ui-badge"
    :data-variant="variant"
    :class="classes"
  >
    <slot>{{ label }}</slot>
  </component>
</template>