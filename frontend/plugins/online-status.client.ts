import { useOnlineStatus } from '~/composables/useOnlineStatus';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('onlineStatus', useOnlineStatus());
});