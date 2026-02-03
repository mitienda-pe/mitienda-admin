import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productListApi } from '@/api/product-list.api'
import type { ProductList, ProductListCreateRequest, ProductListUpdateRequest } from '@/types/product-list.types'

export const useProductListStore = defineStore('productList', () => {
  // State
  const lists = ref<ProductList[]>([])
  const currentList = ref<ProductList | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchAll() {
    try {
      isLoading.value = true
      error.value = null

      const response = await productListApi.getAll()

      if (response.success && response.data) {
        lists.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar listas de productos'
      console.error('Error al cargar listas de productos:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchById(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await productListApi.getById(id)

      if (response.success && response.data) {
        currentList.value = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar lista'
      console.error('Error al cargar lista:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function create(data: ProductListCreateRequest) {
    try {
      isLoading.value = true
      error.value = null

      const response = await productListApi.create(data)

      if (response.success && response.data) {
        await fetchAll()
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear lista'
      console.error('Error al crear lista:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function update(id: number, data: ProductListUpdateRequest) {
    try {
      isLoading.value = true
      error.value = null

      const response = await productListApi.update(id, data)

      if (response.success && response.data) {
        await fetchAll()
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar lista'
      console.error('Error al actualizar lista:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(id: number) {
    try {
      isLoading.value = true
      error.value = null

      await productListApi.delete(id)

      await fetchAll()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar lista'
      console.error('Error al eliminar lista:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearCurrentList() {
    currentList.value = null
  }

  return {
    // State
    lists,
    currentList,
    isLoading,
    error,
    // Actions
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    clearCurrentList
  }
})
