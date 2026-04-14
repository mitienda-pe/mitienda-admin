<template>
  <Transition name="slide-down">
    <div
      v-if="newVersionAvailable"
      class="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 bg-primary px-4 py-2.5 text-white text-sm shadow-lg"
    >
      <i class="pi pi-refresh text-base" />
      <span>Hay una nueva version disponible.</span>
      <button
        class="rounded-md bg-white/20 px-3 py-1 text-white font-medium hover:bg-white/30 transition-colors"
        @click="reload"
      >
        Actualizar ahora
      </button>
      <button
        class="ml-1 text-white/70 hover:text-white transition-colors"
        aria-label="Cerrar"
        @click="dismiss"
      >
        <i class="pi pi-times text-sm" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useVersionCheck } from '@/composables/useVersionCheck'

const { newVersionAvailable, reload, dismiss } = useVersionCheck()
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
