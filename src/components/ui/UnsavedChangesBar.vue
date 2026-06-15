<template>
  <!-- Spacer in normal flow so the fixed bar never covers page content -->
  <div
    v-if="dirty"
    aria-hidden="true"
    :style="{ height: barHeight + 'px' }"
  ></div>
  <Transition name="unsaved-bar">
    <div
      v-if="dirty"
      ref="barEl"
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
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppButton from './AppButton.vue'

const props = withDefaults(
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

// Keep the in-flow spacer in sync with the fixed bar's real height so the
// bottom of any page that uses this bar is never hidden behind it.
const barEl = ref<HTMLElement | null>(null)
const barHeight = ref(64)
let resizeObserver: ResizeObserver | null = null

function measure() {
  if (barEl.value) {
    barHeight.value = barEl.value.offsetHeight
  }
}

watch(
  () => props.dirty,
  async (isDirty) => {
    if (isDirty) {
      await nextTick()
      measure()
      if (typeof ResizeObserver !== 'undefined' && barEl.value) {
        resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(barEl.value)
      }
    } else {
      resizeObserver?.disconnect()
      resizeObserver = null
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

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
