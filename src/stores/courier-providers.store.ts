import { ref } from 'vue'
import { defineStore } from 'pinia'
import { courierProvidersApi } from '@/api/courier-providers.api'
import type {
  CourierProvider,
  CourierProviderConfig,
  SaveCourierConfigRequest,
  CalculatePriceRequest,
  CreateOrderRequest,
} from '@/types/courier-provider.types'

export const useCourierProvidersStore = defineStore('courier-providers', () => {
  const providers = ref<CourierProvider[]>([])
  const currentConfig = ref<CourierProviderConfig | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  async function fetchProviders() {
    try {
      isLoading.value = true
      error.value = null
      providers.value = await courierProvidersApi.getAll()
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar proveedores'
      console.error('Failed to fetch courier providers:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchConfig(code: string) {
    try {
      isLoading.value = true
      error.value = null
      currentConfig.value = await courierProvidersApi.getConfig(code)
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar configuración'
      console.error('Failed to fetch courier config:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(code: string, data: SaveCourierConfigRequest) {
    isSaving.value = true
    try {
      await courierProvidersApi.saveConfig(code, data)
      await fetchConfig(code)
      await fetchProviders()
    } finally {
      isSaving.value = false
    }
  }

  async function updateConfig(code: string, data: SaveCourierConfigRequest) {
    isSaving.value = true
    try {
      await courierProvidersApi.updateConfig(code, data)
      await fetchConfig(code)
      await fetchProviders()
    } finally {
      isSaving.value = false
    }
  }

  async function deleteConfig(code: string) {
    isSaving.value = true
    try {
      await courierProvidersApi.deleteConfig(code)
      currentConfig.value = null
      await fetchProviders()
    } finally {
      isSaving.value = false
    }
  }

  async function calculatePrice(code: string, data: CalculatePriceRequest) {
    return await courierProvidersApi.calculatePrice(code, data)
  }

  async function createOrder(code: string, data: CreateOrderRequest) {
    return await courierProvidersApi.createOrder(code, data)
  }

  return {
    providers,
    currentConfig,
    isLoading,
    isSaving,
    error,
    fetchProviders,
    fetchConfig,
    saveConfig,
    updateConfig,
    deleteConfig,
    calculatePrice,
    createOrder,
  }
})
