<template>
  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="translate-y-20 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-500 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-20 opacity-0"
  >
    <div
      v-if="isOffline"
      class="fixed bottom-28 left-1/2 z-[60] -translate-x-1/2"
    >
      <div class="flex items-center gap-3 rounded-full border border-error/20 bg-error/10 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-error shadow-xl backdrop-blur-md">
        <span class="material-symbols-outlined text-lg">wifi_off</span>
        <span>Offline Mode</span>
        <div class="h-1.5 w-1.5 rounded-full bg-error animate-pulse"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useOnlineStatus } from '~/composables/useOnlineStatus'
const { isOffline } = useOnlineStatus()
</script>
