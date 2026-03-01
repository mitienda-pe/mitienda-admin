<template>
  <Sidebar
    v-model:visible="isOpen"
    position="right"
    :style="{ width: '540px' }"
    class="help-drawer"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-question-circle text-primary text-xl"></i>
        <span class="font-semibold text-lg">Ayuda</span>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20 text-gray-500">
      <i class="pi pi-exclamation-triangle text-3xl mb-3 block"></i>
      <p>No se pudo cargar la ayuda.</p>
      <button
        class="mt-3 text-primary hover:underline text-sm"
        @click="fetchDoc"
      >
        Reintentar
      </button>
    </div>

    <!-- Content -->
    <div
      v-else
      class="prose prose-sm max-w-none
             prose-headings:text-gray-800
             prose-a:text-primary
             prose-img:rounded-lg"
      v-html="html"
    />
  </Sidebar>
</template>

<script setup lang="ts">
import Sidebar from 'primevue/sidebar'
import { useHelpDocs } from '@/composables/useHelpDocs'

const { html, loading, error, isOpen, fetchDoc } = useHelpDocs()
</script>

<style scoped>
.help-drawer :deep(.p-sidebar-content) {
  padding: 1rem 1.5rem;
}
</style>
