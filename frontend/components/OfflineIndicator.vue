<template>
  <div
    v-if="!isOnline && !isReadRoute"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
           rounded-full border border-gray-600/50 bg-gray-900/50
           px-5 py-2 text-sm font-semibold uppercase tracking-wider text-white
           shadow-lg backdrop-blur-[12px]"
  >
    Offline Mode
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const { $onlineStatus } = useNuxtApp();
const { isOnline } = $onlineStatus;
const route = useRoute();

const isReadRoute = computed(() => route.path.startsWith('/read/'));
</script>
