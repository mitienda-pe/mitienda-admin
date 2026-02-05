import { defineStore } from 'pinia'
import { ref } from 'vue'
import { comboApi } from '@/api/combo.api'
import type {
  Combo,
  ComboCreateRequest,
  ComboUpdateRequest
} from '@/types/combo.types'

export const useComboStore = defineStore('combo', () => {
  // State
  const combos = ref<Combo[]>([])
  const currentCombo = ref<Combo | null>(null)
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
  async function fetchCombos(params: {
    page?: number
    search?: string
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
  } = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await comboApi.getAll({
        page: params.page || pagination.value.page,
        per_page: pagination.value.perPage,
        search: params.search,
        sort_by: params.sortBy,
        sort_order: params.sortOrder
      })

      combos.value = response.data
      pagination.value = {
        page: response.meta.page,
        perPage: response.meta.per_page,
        total: response.meta.total,
        totalPages: response.meta.total_pages
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar los combos'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCombo(id: number): Promise<Combo | null> {
    isLoading.value = true
    error.value = null

    try {
      const combo = await comboApi.getById(id)
      currentCombo.value = combo
      return combo
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar el combo'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createCombo(data: ComboCreateRequest): Promise<Combo> {
    isSaving.value = true
    error.value = null

    try {
      const combo = await comboApi.create(data)
      combos.value.unshift(combo)
      pagination.value.total++
      return combo
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear el combo'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateCombo(id: number, data: ComboUpdateRequest): Promise<Combo> {
    isSaving.value = true
    error.value = null

    try {
      const combo = await comboApi.update(id, data)
      const index = combos.value.findIndex(c => c.tiendacombo_id === id)
      if (index !== -1) {
        combos.value[index] = combo
      }
      if (currentCombo.value?.tiendacombo_id === id) {
        currentCombo.value = combo
      }
      return combo
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar el combo'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteCombo(id: number): Promise<void> {
    isSaving.value = true
    error.value = null

    try {
      await comboApi.delete(id)
      combos.value = combos.value.filter(c => c.tiendacombo_id !== id)
      pagination.value.total--
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar el combo'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function toggleCombo(id: number): Promise<Combo> {
    try {
      const combo = await comboApi.toggle(id)
      const index = combos.value.findIndex(c => c.tiendacombo_id === id)
      if (index !== -1) {
        combos.value[index] = combo
      }
      return combo
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cambiar el estado'
      throw err
    }
  }

  async function uploadImage(id: number, file: File): Promise<string> {
    isSaving.value = true
    error.value = null

    try {
      const imagePath = await comboApi.uploadImage(id, file)
      // Update the combo in the list
      const index = combos.value.findIndex(c => c.tiendacombo_id === id)
      if (index !== -1) {
        combos.value[index].tiendacombo_imagen = imagePath
      }
      if (currentCombo.value?.tiendacombo_id === id) {
        currentCombo.value.tiendacombo_imagen = imagePath
      }
      return imagePath
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al subir la imagen'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  function clearCurrentCombo() {
    currentCombo.value = null
  }

  return {
    // State
    combos,
    currentCombo,
    isLoading,
    isSaving,
    error,
    pagination,

    // Actions
    fetchCombos,
    fetchCombo,
    createCombo,
    updateCombo,
    deleteCombo,
    toggleCombo,
    uploadImage,
    clearCurrentCombo
  }
})
