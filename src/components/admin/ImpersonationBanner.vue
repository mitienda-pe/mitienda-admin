<template>
  <div v-if="show" class="impersonation-banner bg-purple-600 text-white py-3 px-4 shadow-lg">
    <div class="container mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-xl"></i>
        <div>
          <p class="font-semibold">Modo Super-Administrador</p>
          <p class="text-sm opacity-90">
            Estás accediendo como super-admin a
            <span class="font-medium">{{ storeName }}</span>
          </p>
        </div>
      </div>

      <button
        @click="$emit('exit')"
        :disabled="loading"
        class="px-4 py-2 bg-white text-purple-600 rounded-md hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
      >
        <i class="pi pi-sign-out"></i>
        <span>Salir de Impersonación</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  storeName?: string
  loading?: boolean
}

interface Emits {
  (e: 'exit'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.impersonation-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}
</style>
