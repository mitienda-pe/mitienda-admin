import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storeApi } from '@/api/store.api'
import type { StoreConfig, StoreConfigUpdate, Currency, Country, CountryConfig } from '@/types/store.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// Defaults usados sólo mientras el store carga (skeleton de UI). El valor real
// viene del backend vía fetchConfig() / fetchCountryConfig().
const DEFAULT_CONFIG: StoreConfig = {
  tiendageneral_idioma: 'spanish',
  moneda_id: 1,
  moneda_nombre: '',
  moneda_simbolo: '',
  moneda_iso: '',
  tiendageneral_paisorigen: 0,
  tiendageneral_montominimo: null,
  tiendageneral_montomaximo: 100000,
  sw_tienda_visible: 1,
  tiendageneral_banner_desactivado_url: null,
  tiendageneral_texto_desactivado: null,
  tiendageneral_sw_horarioActivo: 0,
  tiendageneral_json_horarioActivo: null,
  sw_logincliente: 0,
  tiendageneral_sw_solo_boleta: 0,
  tiendageneral_sw_verificacion_edad: 0,
  tiendageneral_edad_minima: 18,
  tiendageneral_texto_verificacion_edad: null,
  sw_notif_incluir_email_tienda: 1,
  tiendageneral_sw_lotes: 0,
  tiendageneral_lote_estrategia: 'fefo',
  has_legacy_webhooks: false
}

export const useStoreConfigStore = defineStore('store-config', () => {
  const savedConfig = ref<StoreConfig>(deepClone(DEFAULT_CONFIG))
  const draftConfig = ref<StoreConfig>(deepClone(DEFAULT_CONFIG))
  const currencies = ref<Currency[]>([])
  const countries = ref<Country[]>([])
  const countryConfig = ref<CountryConfig | null>(null)

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
    return c?.moneda_simbolo || countryConfig.value?.moneda_simbolo || ''
  })

  const currentCurrencyIso = computed(() => {
    const c = currencies.value.find(c => c.moneda_id === draftConfig.value.moneda_id)
    return c?.moneda_iso || countryConfig.value?.moneda_iso || ''
  })

  const currentDecimales = computed(() => countryConfig.value?.decimales ?? 2)

  const territoryLabels = computed(() => countryConfig.value?.labels ?? {
    dpto: 'Departamento',
    prov: 'Provincia',
    dist: 'Distrito'
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
        sw_logincliente: draftConfig.value.sw_logincliente,
        tiendageneral_sw_solo_boleta: draftConfig.value.tiendageneral_sw_solo_boleta,
        tiendageneral_sw_verificacion_edad: draftConfig.value.tiendageneral_sw_verificacion_edad,
        tiendageneral_edad_minima: draftConfig.value.tiendageneral_edad_minima,
        tiendageneral_texto_verificacion_edad: draftConfig.value.tiendageneral_texto_verificacion_edad,
        sw_notif_incluir_email_tienda: draftConfig.value.sw_notif_incluir_email_tienda,
        tiendageneral_sw_lotes: draftConfig.value.tiendageneral_sw_lotes,
        tiendageneral_lote_estrategia: draftConfig.value.tiendageneral_lote_estrategia
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

  async function fetchCountryConfig() {
    try {
      const response = await storeApi.getCountryConfig()
      if (response.success && response.data) {
        countryConfig.value = response.data
      }
    } catch {
      // Non-critical, formatters fall back to '' / defaults
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
    countryConfig,
    isLoading,
    isSaving,
    isUploadingBanner,
    error,
    isLoaded,
    hasChanges,
    currentCurrencySymbol,
    currentCurrencyIso,
    currentDecimales,
    territoryLabels,
    fetchConfig,
    saveConfig,
    fetchCurrencies,
    fetchCountries,
    fetchCountryConfig,
    uploadBanner,
    deleteBanner,
    updateField,
    resetConfig
  }
})
