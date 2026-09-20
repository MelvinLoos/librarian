<script setup lang="ts">
import { withDefaults } from 'vue'
import { tv } from 'tailwind-variants'

const props = withDefaults(
  defineProps<{
    open?: boolean
    title?: string | undefined
  }>(),
  {
    open: false,
    title: undefined,
  },
)

const emit = defineEmits<{ close: [] }>()

const overlayVariants = tv({
  base: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
})

const panelVariants = tv({
  base: 'w-full max-w-lg rounded-[2.5rem] bg-surface-container-high/80 p-6 shadow-2xl backdrop-blur-xl m-4',
})

const classes = {
  overlay: overlayVariants(),
  panel: panelVariants(),
}

const onBackdropClick = () => {
  emit('close')
}
</script>

<template>
  <div
    v-if="open"
    data-test="ui-dialog"
    :class="classes.overlay"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
    @click.self="onBackdropClick"
    @keydown.esc="onBackdropClick"
  >
    <div data-test="ui-dialog-panel" :class="classes.panel">
      <div class="flex items-center justify-between">
        <h2 class="font-serif text-2xl font-semibold text-on-surface">{{ title }}</h2>
        <button
          data-test="ui-dialog-close"
          type="button"
          aria-label="Close dialog"
          class="rounded-full px-3 py-1 text-on-surface-variant hover:bg-surface-variant/10"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>
      <!-- @slot Default slot renders the dialog body content. -->
      <slot />
    </div>
  </div>
</template>