import { defineStore } from 'pinia'
import { ref } from 'vue'
import { upsaleApi } from '@/api/upsale.api'
import type {
  Upsale,
  UpsaleCreateRequest,
  UpsaleUpdateRequest
} from '@/types/upsale.types'

export const useUpsaleStore = defineStore('upsale', () => {
  // State
  const upsales = ref<Upsale[]>([])
  const currentUpsale = ref<Upsale | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const pagination = ref({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0
  })

  // Actions
  async function fetchUpsales(params: {
    page?: number
    search?: string
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
  } = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await upsaleApi.getAll({
        page: params.page || pagination.value.page,
        per_page: pagination.value.perPage,
        search: params.search,
        sort_by: params.sortBy,
        sort_order: params.sortOrder
      })

      upsales.value = response.data
      pagination.value = {
        page: response.meta.page,
        perPage: response.meta.per_page,
        total: response.meta.total,
        totalPages: response.meta.total_pages
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar los upsales'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUpsale(id: number): Promise<Upsale | null> {
    isLoading.value = true
    error.value = null

    try {
      const upsale = await upsaleApi.getById(id)
      currentUpsale.value = upsale
      return upsale
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar el upsale'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createUpsale(data: UpsaleCreateRequest): Promise<Upsale> {
    isSaving.value = true
    error.value = null

    try {
      const upsale = await upsaleApi.create(data)
      upsales.value.unshift(upsale)
      pagination.value.total++
      return upsale
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear el upsale'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateUpsale(id: number, data: UpsaleUpdateRequest): Promise<Upsale> {
    isSaving.value = true
    error.value = null

    try {
      const upsale = await upsaleApi.update(id, data)
      const index = upsales.value.findIndex(u => u.tiendaupsale_id === id)
      if (index !== -1) {
        upsales.value[index] = upsale
      }
      if (currentUpsale.value?.tiendaupsale_id === id) {
        currentUpsale.value = upsale
      }
      return upsale
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar el upsale'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteUpsale(id: number): Promise<void> {
    isSaving.value = true
    error.value = null

    try {
      await upsaleApi.delete(id)
      upsales.value = upsales.value.filter(u => u.tiendaupsale_id !== id)
      pagination.value.total--
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar el upsale'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function toggleUpsale(id: number): Promise<Upsale> {
    try {
      const upsale = await upsaleApi.toggle(id)
      const index = upsales.value.findIndex(u => u.tiendaupsale_id === id)
      if (index !== -1) {
        upsales.value[index] = upsale
      }
      return upsale
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cambiar el estado'
      throw err
    }
  }

  function clearCurrentUpsale() {
    currentUpsale.value = null
  }

  return {
    // State
    upsales,
    currentUpsale,
    isLoading,
    isSaving,
    error,
    pagination,

    // Actions
    fetchUpsales,
    fetchUpsale,
    createUpsale,
    updateUpsale,
    deleteUpsale,
    toggleUpsale,
    clearCurrentUpsale
  }
})
