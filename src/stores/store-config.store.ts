import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storeApi } from '@/api/store.api'
import type { StoreConfig, StoreConfigUpdate, Currency, Country } from '@/types/store.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_CONFIG: StoreConfig = {
  tiendageneral_idioma: 'spanish',
  moneda_id: 1,
  moneda_nombre: 'Sol peruano',
  moneda_simbolo: 'S/',
  moneda_iso: 'PEN',
  tiendageneral_paisorigen: 2055,
  tiendageneral_montominimo: null,
  tiendageneral_montomaximo: 100000,
  sw_tienda_visible: 1,
  tiendageneral_banner_desactivado_url: null,
  tiendageneral_texto_desactivado: null,
  tiendageneral_sw_horarioActivo: 0,
  tiendageneral_json_horarioActivo: null,
  sw_logincliente: 0
}

export const useStoreConfigStore = defineStore('store-config', () => {
  const savedConfig = ref<StoreConfig>(deepClone(DEFAULT_CONFIG))
  const draftConfig = ref<StoreConfig>(deepClone(DEFAULT_CONFIG))
  const currencies = ref<Currency[]>([])
  const countries = ref<Country[]>([])

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isUploadingBanner = ref(false)
  const error = ref<string | null>(null)
  const isLoaded = ref(false)

  const hasChanges = computed(() => {
    return JSON.stringify(draftConfig.value) !== JSON.stringify(savedConfig.value)
  })

  const currentCurrencySymbol = computed(() => {
    const c = currencies.value.find(c => c.moneda_id === draftConfig.value.moneda_id)
    return c?.moneda_simbolo || 'S/'
  })

  async function fetchConfig() {
    isLoading.value = true
    error.value = null
    try {
      const response = await storeApi.getConfig()
      if (response.success && response.data) {
        savedConfig.value = response.data
        draftConfig.value = deepClone(response.data)
      }
      isLoaded.value = true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar la configuración'
      error.value = message
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const update: StoreConfigUpdate = {
        tiendageneral_idioma: draftConfig.value.tiendageneral_idioma,
        moneda_id: draftConfig.value.moneda_id,
        tiendageneral_paisorigen: draftConfig.value.tiendageneral_paisorigen,
        tiendageneral_montominimo: draftConfig.value.tiendageneral_montominimo,
        tiendageneral_montomaximo: draftConfig.value.tiendageneral_montomaximo,
        sw_tienda_visible: draftConfig.value.sw_tienda_visible,
        tiendageneral_sw_horarioActivo: draftConfig.value.tiendageneral_sw_horarioActivo,
        tiendageneral_json_horarioActivo: draftConfig.value.tiendageneral_json_horarioActivo,
        sw_logincliente: draftConfig.value.sw_logincliente
      }
      const response = await storeApi.updateConfig(update)
      if (response.success && response.data) {
        savedConfig.value = response.data
        draftConfig.value = deepClone(response.data)
      } else {
        savedConfig.value = deepClone(draftConfig.value)
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

  async function fetchCurrencies() {
    try {
      const response = await storeApi.getCurrencies()
      if (response.success && response.data) {
        currencies.value = response.data
      }
    } catch {
      // Non-critical, currencies will be empty
    }
  }

  async function fetchCountries() {
    try {
      const response = await storeApi.getCountries()
      if (response.success && response.data) {
        countries.value = response.data
      }
    } catch {
      // Non-critical, countries will be empty
    }
  }

  async function uploadBanner(file: File): Promise<boolean> {
    isUploadingBanner.value = true
    error.value = null
    try {
      const response = await storeApi.uploadConfigBanner(file)
      if (response.success && response.data) {
        savedConfig.value.tiendageneral_banner_desactivado_url = response.data.banner_url
        draftConfig.value.tiendageneral_banner_desactivado_url = response.data.banner_url
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al subir el banner'
      error.value = message
      return false
    } finally {
      isUploadingBanner.value = false
    }
  }

  async function deleteBanner(): Promise<boolean> {
    error.value = null
    try {
      const response = await storeApi.deleteConfigBanner()
      if (response.success) {
        savedConfig.value.tiendageneral_banner_desactivado_url = null
        draftConfig.value.tiendageneral_banner_desactivado_url = null
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al eliminar el banner'
      error.value = message
      return false
    }
  }

  function updateField<K extends keyof StoreConfig>(field: K, value: StoreConfig[K]) {
    ;(draftConfig.value as Record<string, unknown>)[field] = value
  }

  function resetConfig() {
    draftConfig.value = deepClone(savedConfig.value)
  }

  return {
    savedConfig,
    draftConfig,
    currencies,
    countries,
    isLoading,
    isSaving,
    isUploadingBanner,
    error,
    isLoaded,
    hasChanges,
    currentCurrencySymbol,
    fetchConfig,
    saveConfig,
    fetchCurrencies,
    fetchCountries,
    uploadBanner,
    deleteBanner,
    updateField,
    resetConfig
  }
})
