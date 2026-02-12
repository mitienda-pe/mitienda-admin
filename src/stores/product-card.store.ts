import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import productCardApi from '@/api/product-card.api'
import type { ProductCardConfig } from '@/types/product-card.types'
import { DEFAULT_PRODUCT_CARD_CONFIG } from '@/types/product-card.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export const useProductCardStore = defineStore('product-card', () => {
  const savedConfig = ref<ProductCardConfig>(deepClone(DEFAULT_PRODUCT_CARD_CONFIG))
  const draftConfig = ref<ProductCardConfig>(deepClone(DEFAULT_PRODUCT_CARD_CONFIG))
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const isLoaded = ref(false)

  const hasUnsavedChanges = computed(() => {
    return JSON.stringify(draftConfig.value) !== JSON.stringify(savedConfig.value)
  })

  async function fetchConfig() {
    isLoading.value = true
    error.value = null
    try {
      const response = await productCardApi.getConfig()
      if (response.success && response.data) {
        savedConfig.value = response.data
        draftConfig.value = deepClone(response.data)
      }
      isLoaded.value = true
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Error al cargar configuración de viñeta'
      error.value = message
    } finally {
      isLoading.value = false
    }
  }

  async function saveConfig(): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const response = await productCardApi.updateConfig(draftConfig.value)
      if (response.success && response.data) {
        savedConfig.value = response.data
        draftConfig.value = deepClone(response.data)
      } else {
        savedConfig.value = deepClone(draftConfig.value)
      }
      return true
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Error al guardar configuración de viñeta'
      error.value = message
      return false
    } finally {
      isSaving.value = false
    }
  }

  function updateField<K extends keyof ProductCardConfig>(
    field: K,
    value: ProductCardConfig[K]
  ) {
    draftConfig.value[field] = value
  }

  function resetToSaved() {
    draftConfig.value = deepClone(savedConfig.value)
  }

  return {
    savedConfig,
    draftConfig,
    isLoading,
    isSaving,
    error,
    isLoaded,
    hasUnsavedChanges,
    fetchConfig,
    saveConfig,
    updateField,
    resetToSaved
  }
})
