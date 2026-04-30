<template>
  <Transition name="unsaved-bar">
    <div
      v-if="dirty"
      class="unsaved-bar fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
    >
      <div class="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-2 text-sm text-secondary-700">
          <i class="pi pi-info-circle text-primary"></i>
          <span>{{ message }}</span>
        </div>
        <div class="flex items-center gap-2">
          <AppButton
            v-if="showDiscard"
            label="Descartar"
            variant="text"
            :disabled="loading"
            @click="$emit('discard')"
          />
          <AppButton
            :label="saveLabel"
            icon="pi pi-save"
            variant="primary"
            :loading="loading"
            :disabled="saveDisabled"
            @click="$emit('save')"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import AppButton from './AppButton.vue'

withDefaults(
  defineProps<{
    dirty: boolean
    loading?: boolean
    saveDisabled?: boolean
    saveLabel?: string
    showDiscard?: boolean
    message?: string
  }>(),
  {
    loading: false,
    saveDisabled: false,
    saveLabel: 'Guardar cambios',
    showDiscard: false,
    message: 'Tienes cambios sin guardar'
  }
)

defineEmits<{
  (e: 'save'): void
  (e: 'discard'): void
}>()
</script>

<style scoped>
.unsaved-bar-enter-active,
.unsaved-bar-leave-active {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}
.unsaved-bar-enter-from,
.unsaved-bar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
