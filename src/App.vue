<template>
  <AppUpdateBanner />
  <router-view />
  <Toast />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppUpdateBanner from '@/components/AppUpdateBanner.vue'
</script>

<style scoped>
</style>
