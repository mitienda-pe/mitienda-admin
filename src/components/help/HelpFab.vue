<template>
  <button
    data-tour="help-fab"
    class="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary
           text-white shadow-lg hover:shadow-xl transition-all duration-200
           flex items-center justify-center hover:scale-105"
    title="Ayuda"
    @click="open"
  >
    <i class="pi pi-question text-xl"></i>
  </button>
</template>

<script setup lang="ts">
import { useHelpDocs } from '@/composables/useHelpDocs'

const { open } = useHelpDocs()
</script>
