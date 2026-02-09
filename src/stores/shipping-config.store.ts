import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { shippingApi } from '@/api/shipping.api'
import type { ShippingConfig } from '@/types/shipping.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_CONFIG: ShippingConfig = {
  swEntregaADomicilio: false,
  swRecojoEnTienda: false,
  swRepartoGratis: false,
  montoRepartoGratis: 0,
  zonaRepartoGratis: null,
  swHabilitarEstadoEnvio: false,
  envioporProducto: 0,
  swMostrarHorarioEnvio: false,
  horarioEnvio: null,
  tipoMostrarFecha: 1,
  swRepartoHoy: 0,
  diasBloqueados: [],
  swMostrarHorarioRecojoTienda: false,
  horarioRecojoTienda: null,
  tipoMostrarFechaRecojoTienda: 1,
  swRecojoTiendaHoy: 0,
  plazoMaximoRecojoTienda: 30
}

export const useShippingConfigStore = defineStore('shipping-config', () => {
  const savedConfig = ref<ShippingConfig>(deepClone(DEFAULT_CONFIG))
  const draftConfig = ref<ShippingConfig>(deepClone(DEFAULT_CONFIG))

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const isLoaded = ref(false)

  const hasChanges = computed(() => {
    return JSON.stringify(draftConfig.value) !== JSON.stringify(savedConfig.value)
  })

  async function fetchConfig() {
    isLoading.value = true
    error.value = null
    try {
      const response = await shippingApi.getConfig()
      if (response.success && response.data) {
        savedConfig.value = response.data
        draftConfig.value = deepClone(response.data)
      }
      isLoaded.value = true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar la configuración de envío'
      error.value = message
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(): Promise<boolean> {
    isSaving.value = true
    error.value = null
    successMessage.value = null
    try {
      const response = await shippingApi.updateConfig(draftConfig.value)
      if (response.success && response.data) {
        savedConfig.value = response.data
        draftConfig.value = deepClone(response.data)
        successMessage.value = response.message || 'Configuración guardada correctamente'
      } else {
        savedConfig.value = deepClone(draftConfig.value)
        successMessage.value = 'Configuración guardada correctamente'
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al guardar la configuración'
      error.value = message
      return false
    } finally {
      isSaving.value = false
    }
  }

  function updateField<K extends keyof ShippingConfig>(field: K, value: ShippingConfig[K]) {
    ;(draftConfig.value as Record<string, unknown>)[field] = value
  }

  function resetConfig() {
    draftConfig.value = deepClone(savedConfig.value)
  }

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  return {
    savedConfig,
    draftConfig,
    isLoading,
    isSaving,
    error,
    successMessage,
    isLoaded,
    hasChanges,
    fetchConfig,
    saveConfig,
    updateField,
    resetConfig,
    clearMessages
  }
})
