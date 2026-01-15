import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { shippingApi } from '@/api/shipping.api'
import type {
  CountryCode,
  Country,
  Location,
  RateTreeNode,
  SaveShippingRateRequest,
  UpdateShippingRateRequest
} from '@/types/shipping.types'

export const useShippingStore = defineStore('shipping', () => {
  // State
  const enabledCountries = ref<Country[]>([])
  const rates = ref<Record<CountryCode, RateTreeNode[]>>({
    PE: [],
    EC: [],
    CO: []
  })
  const locations = ref<Location[]>([])
  const currentCountry = ref<CountryCode>('PE')

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isLoadingLocations = ref(false)

  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Getters
  const currentRates = computed(() => rates.value[currentCountry.value] || [])

  const currentCountryInfo = computed(() =>
    enabledCountries.value.find(c => c.code === currentCountry.value)
  )

  const hasRates = computed(() => currentRates.value.length > 0)

  const hasEnabledCountries = computed(() => enabledCountries.value.length > 0)

  // Actions
  function setCurrentCountry(code: CountryCode) {
    currentCountry.value = code
  }

  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  async function fetchEnabledCountries() {
    isLoading.value = true
    error.value = null

    try {
      const result = await shippingApi.getEnabledCountries()
      if (result.success && result.data) {
        enabledCountries.value = result.data
        // Set current country to first enabled if current is not enabled
        if (result.data.length > 0) {
          const currentEnabled = result.data.find(c => c.code === currentCountry.value)
          if (!currentEnabled) {
            currentCountry.value = result.data[0].code
          }
        }
      } else {
        error.value = result.message || 'Error al cargar países'
      }
    } catch (err) {
      error.value = 'Error de conexión al cargar países'
      console.error('Error fetching enabled countries:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRates(countryCode?: CountryCode) {
    const country = countryCode || currentCountry.value
    isLoading.value = true
    error.value = null

    try {
      const result = await shippingApi.getRates(country)
      if (result.success && result.data) {
        rates.value[country] = result.data
      } else {
        error.value = result.message || 'Error al cargar tarifas'
      }
    } catch (err) {
      error.value = 'Error de conexión al cargar tarifas'
      console.error('Error fetching shipping rates:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchLocations(countryCode: CountryCode, parentCode?: string) {
    isLoadingLocations.value = true

    try {
      const result = await shippingApi.getLocations(countryCode, parentCode)
      if (result.success && result.data) {
        locations.value = result.data
        return result.data
      }
      return []
    } catch (err) {
      console.error('Error fetching locations:', err)
      return []
    } finally {
      isLoadingLocations.value = false
    }
  }

  async function createRate(data: SaveShippingRateRequest) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await shippingApi.createRate(data)
      if (result.success) {
        successMessage.value = result.message || 'Tarifa creada exitosamente'
        // Recargar tarifas del país
        await fetchRates(data.countryCode)
        return { success: true }
      } else {
        error.value = result.message || 'Error al crear tarifa'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = 'Error de conexión al crear tarifa'
      console.error('Error creating shipping rate:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function updateRate(id: number, data: UpdateShippingRateRequest, countryCode?: CountryCode) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await shippingApi.updateRate(id, data)
      if (result.success) {
        successMessage.value = result.message || 'Tarifa actualizada exitosamente'
        // Recargar tarifas del país
        await fetchRates(countryCode || currentCountry.value)
        return { success: true }
      } else {
        error.value = result.message || 'Error al actualizar tarifa'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = 'Error de conexión al actualizar tarifa'
      console.error('Error updating shipping rate:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteRate(id: number, countryCode?: CountryCode) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await shippingApi.deleteRate(id)
      if (result.success) {
        successMessage.value = result.message || 'Tarifa eliminada exitosamente'
        // Recargar tarifas del país
        await fetchRates(countryCode || currentCountry.value)
        return { success: true }
      } else {
        error.value = result.message || 'Error al eliminar tarifa'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = 'Error de conexión al eliminar tarifa'
      console.error('Error deleting shipping rate:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function toggleRate(id: number, enabled: boolean, countryCode?: CountryCode) {
    error.value = null

    try {
      const result = await shippingApi.toggleRate(id, enabled)
      if (result.success) {
        // Recargar tarifas del país
        await fetchRates(countryCode || currentCountry.value)
        return { success: true }
      } else {
        error.value = result.message || 'Error al cambiar estado'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = 'Error de conexión'
      console.error('Error toggling shipping rate:', err)
      return { success: false, error: error.value }
    }
  }

  // Helper para encontrar y actualizar un nodo en el árbol (para actualizaciones locales)
  function findNodeByKey(nodes: RateTreeNode[], key: string): RateTreeNode | null {
    for (const node of nodes) {
      if (node.key === key) {
        return node
      }
      if (node.children) {
        const found = findNodeByKey(node.children, key)
        if (found) return found
      }
    }
    return null
  }

  // Actualizar nodo localmente (para respuesta inmediata en UI)
  function updateNodeLocally(key: string, updates: Partial<RateTreeNode['data']>) {
    const node = findNodeByKey(rates.value[currentCountry.value], key)
    if (node) {
      Object.assign(node.data, updates)
    }
  }

  return {
    // State
    enabledCountries,
    rates,
    locations,
    currentCountry,
    isLoading,
    isSaving,
    isLoadingLocations,
    error,
    successMessage,

    // Getters
    currentRates,
    currentCountryInfo,
    hasRates,
    hasEnabledCountries,

    // Actions
    setCurrentCountry,
    clearMessages,
    fetchEnabledCountries,
    fetchRates,
    fetchLocations,
    createRate,
    updateRate,
    deleteRate,
    toggleRate,
    findNodeByKey,
    updateNodeLocally
  }
})
