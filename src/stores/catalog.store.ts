import { defineStore } from 'pinia'
import { ref } from 'vue'
import { catalogApi } from '@/api/catalog.api'
import type { Category, Brand } from '@/types/product.types'

export const useCatalogStore = defineStore('catalog', () => {
  // State
  const categories = ref<Category[]>([])
  const brands = ref<Brand[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchCategories() {
    try {
      isLoading.value = true
      error.value = null

      const response = await catalogApi.getCategories()

      if (response.success && response.data) {
        categories.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar categorías'
      console.error('Error al cargar categorías:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchBrands() {
    try {
      isLoading.value = true
      error.value = null

      const response = await catalogApi.getBrands()

      if (response.success && response.data) {
        brands.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar marcas'
      console.error('Error al cargar marcas:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAll() {
    await Promise.all([fetchCategories(), fetchBrands()])
  }

  return {
    // State
    categories,
    brands,
    isLoading,
    error,
    // Actions
    fetchCategories,
    fetchBrands,
    fetchAll
  }
})
