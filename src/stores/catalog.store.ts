import { defineStore } from 'pinia'
import { ref } from 'vue'
import { brandApi } from '@/api/brand.api'
import { categoryApi } from '@/api/category.api'
import type { Category, Brand, CategoryFormData, BrandFormData } from '@/types/product.types'

export const useCatalogStore = defineStore('catalog', () => {
  // State
  const categories = ref<Category[]>([])
  const flatCategories = ref<Category[]>([])
  const brands = ref<Brand[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Helper to flatten categories
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = []
    const flatten = (items: Category[]) => {
      for (const item of items) {
        result.push(item)
        if (item.sub && item.sub.length > 0) {
          flatten(item.sub)
        }
      }
    }
    flatten(cats)
    return result
  }

  // === Categories Actions ===

  async function fetchCategories() {
    try {
      isLoading.value = true
      error.value = null

      const response = await categoryApi.getAll()

      if (response.success && response.data) {
        categories.value = response.data
        flatCategories.value = flattenCategories(response.data)
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar categorías'
      console.error('Error al cargar categorías:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCategoryById(id: number): Promise<Category | null> {
    try {
      const response = await categoryApi.getById(id)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (err: any) {
      console.error('Error al cargar categoría:', err)
      throw err
    }
  }

  async function createCategory(data: CategoryFormData): Promise<Category> {
    try {
      const response = await categoryApi.create(data)
      if (response.success && response.data) {
        await fetchCategories() // Refresh list
        return response.data
      }
      throw new Error('Error al crear categoría')
    } catch (err: any) {
      console.error('Error al crear categoría:', err)
      throw err
    }
  }

  async function updateCategory(id: number, data: CategoryFormData): Promise<Category> {
    try {
      const response = await categoryApi.update(id, data)
      if (response.success && response.data) {
        await fetchCategories() // Refresh list
        return response.data
      }
      throw new Error('Error al actualizar categoría')
    } catch (err: any) {
      console.error('Error al actualizar categoría:', err)
      throw err
    }
  }

  async function deleteCategory(id: number): Promise<void> {
    try {
      await categoryApi.delete(id)
      await fetchCategories() // Refresh list
    } catch (err: any) {
      console.error('Error al eliminar categoría:', err)
      throw err
    }
  }

  // === Brands Actions ===

  async function fetchBrands() {
    try {
      isLoading.value = true
      error.value = null

      const response = await brandApi.getAll()

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

  async function fetchBrandById(id: number): Promise<Brand | null> {
    try {
      const response = await brandApi.getById(id)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (err: any) {
      console.error('Error al cargar marca:', err)
      throw err
    }
  }

  async function createBrand(data: BrandFormData): Promise<Brand> {
    try {
      const response = await brandApi.create(data)
      if (response.success && response.data) {
        await fetchBrands() // Refresh list
        return response.data
      }
      throw new Error('Error al crear marca')
    } catch (err: any) {
      console.error('Error al crear marca:', err)
      throw err
    }
  }

  async function updateBrand(id: number, data: BrandFormData): Promise<Brand> {
    try {
      const response = await brandApi.update(id, data)
      if (response.success && response.data) {
        await fetchBrands() // Refresh list
        return response.data
      }
      throw new Error('Error al actualizar marca')
    } catch (err: any) {
      console.error('Error al actualizar marca:', err)
      throw err
    }
  }

  async function deleteBrand(id: number): Promise<void> {
    try {
      await brandApi.delete(id)
      await fetchBrands() // Refresh list
    } catch (err: any) {
      console.error('Error al eliminar marca:', err)
      throw err
    }
  }

  // === Combined Actions ===

  async function fetchAll() {
    await Promise.all([fetchCategories(), fetchBrands()])
  }

  return {
    // State
    categories,
    flatCategories,
    brands,
    isLoading,
    error,
    // Category Actions
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    // Brand Actions
    fetchBrands,
    fetchBrandById,
    createBrand,
    updateBrand,
    deleteBrand,
    // Combined
    fetchAll
  }
})
