<script setup lang="ts">
interface Props {
  title?: string
  message: string
  icon?: string
  retryLabel?: string
  showRetry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Error',
  icon: 'pi-exclamation-circle',
  retryLabel: 'Reintentar',
  showRetry: true
})

defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <!-- Icon -->
    <i :class="['pi', icon, 'text-4xl text-red-500 mb-2']"></i>

    <!-- Title -->
    <h3 class="text-lg font-semibold text-red-800 mb-1">
      {{ title }}
    </h3>

    <!-- Message -->
    <p class="text-red-700 mb-4">
      {{ message }}
    </p>

    <!-- Slot for custom content -->
    <div v-if="$slots.default">
      <slot />
    </div>

    <!-- Retry button -->
    <button
      v-if="showRetry"
      class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
      @click="$emit('retry')"
    >
      <i class="pi pi-refresh"></i>
      {{ retryLabel }}
    </button>

    <!-- Slot for custom actions -->
    <div v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos si necesitas override */
</style>
