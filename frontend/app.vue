<template>
  <VitePwaManifest />
  <Toaster :theme="theme" position="top-right" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import { useTheme } from '~/composables/useTheme'

const { theme } = useTheme()
</script>
