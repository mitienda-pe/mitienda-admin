<template>
  <div
    v-if="store.currentConfig?.courier.configured"
    class="bg-white rounded-lg shadow p-6 mt-6"
  >
    <h3 class="text-lg font-semibold text-secondary-700 mb-1">Modo de despacho</h3>
    <p class="text-sm text-secondary-400 mb-4">
      Controla cuándo se crea el envío en el courier para una venta pagada.
    </p>

    <div class="space-y-3">
      <label
        class="flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors"
        :class="
          mode === 'manual'
            ? 'border-primary bg-primary/5'
            : 'border-secondary-200 hover:border-secondary-300'
        "
      >
        <RadioButton v-model="mode" inputId="mode-manual" name="mode" value="manual" />
        <div class="flex-1">
          <span class="block font-medium text-secondary-700">Manual</span>
          <span class="block text-sm text-secondary-500">
            El operador crea el envío desde el panel de despacho. Útil para
            validar pedidos antes de comprometer la guía. Default recomendado.
          </span>
        </div>
      </label>

      <label
        class="flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors"
        :class="
          mode === 'auto'
            ? 'border-primary bg-primary/5'
            : 'border-secondary-200 hover:border-secondary-300'
        "
      >
        <RadioButton v-model="mode" inputId="mode-auto" name="mode" value="auto" />
        <div class="flex-1">
          <span class="block font-medium text-secondary-700">Automático</span>
          <span class="block text-sm text-secondary-500">
            Tras confirmar el pago, el envío se crea solo en el courier. Recomendado
            cuando el flujo end-to-end ya está validado.
          </span>
        </div>
      </label>
    </div>

    <div class="flex justify-end mt-4">
      <Button
        label="Guardar modo"
        icon="pi pi-check"
        :loading="isSaving"
        :disabled="!hasChanges"
        @click="save"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import { useCourierProvidersStore } from '@/stores/courier-providers.store'
import type { CourierDispatchMode } from '@/types/courier-provider.types'

const store = useCourierProvidersStore()
const toast = useToast()

const mode = ref<CourierDispatchMode>('manual')
const initialMode = ref<CourierDispatchMode>('manual')
const isSaving = ref(false)

const hasChanges = computed(() => mode.value !== initialMode.value)

watch(
  () => store.currentConfig,
  (config) => {
    const m = (config?.courier.dispatch_mode ?? 'manual') as CourierDispatchMode
    mode.value = m
    initialMode.value = m
  },
  { immediate: true }
)

async function save() {
  const code = store.currentConfig?.courier.code
  if (!code) return

  isSaving.value = true
  try {
    const credentials = store.currentConfig?.credentials ?? {}
    await store.updateConfig(code, {
      credentials,
      dispatch_mode: mode.value,
    })
    initialMode.value = mode.value
    toast.add({
      severity: 'success',
      summary: 'Modo actualizado',
      detail: mode.value === 'auto' ? 'Despacho automático activado' : 'Despacho manual activado',
      life: 3000,
    })
  } catch (err: unknown) {
    const detail =
      (err as { response?: { data?: { messages?: { error?: string } } } })?.response?.data
        ?.messages?.error ?? 'No se pudo actualizar el modo'
    toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 })
  } finally {
    isSaving.value = false
  }
}
</script>
