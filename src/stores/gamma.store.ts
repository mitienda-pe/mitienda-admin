import { defineStore } from 'pinia'
import { ref } from 'vue'
import { gammaApi } from '@/api/gamma.api'
import type { Gamma, GammaCreateRequest, GammaUpdateRequest } from '@/types/gamma.types'

export const useGammaStore = defineStore('gamma', () => {
  // State
  const gammas = ref<Gamma[]>([])
  const currentGamma = ref<Gamma | null>(null)
  const gammasByBrand = ref<Gamma[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchAll(marcaId?: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await gammaApi.getAll(marcaId)

      if (response.success && response.data) {
        gammas.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar gammas'
      console.error('Error al cargar gammas:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchByBrand(marcaId: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await gammaApi.getByBrand(marcaId)

      if (response.success && response.data) {
        gammasByBrand.value = response.data
      }
      return response.data || []
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar gammas de la marca'
      console.error('Error al cargar gammas de la marca:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchById(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await gammaApi.getById(id)

      if (response.success && response.data) {
        currentGamma.value = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar gamma'
      console.error('Error al cargar gamma:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function create(data: GammaCreateRequest) {
    try {
      isLoading.value = true
      error.value = null

      const response = await gammaApi.create(data)

      if (response.success && response.data) {
        // Refresh the list
        await fetchAll()
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear gamma'
      console.error('Error al crear gamma:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function update(id: number, data: GammaUpdateRequest) {
    try {
      isLoading.value = true
      error.value = null

      const response = await gammaApi.update(id, data)

      if (response.success && response.data) {
        // Refresh the list
        await fetchAll()
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar gamma'
      console.error('Error al actualizar gamma:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(id: number) {
    try {
      isLoading.value = true
      error.value = null

      await gammaApi.delete(id)

      // Refresh the list
      await fetchAll()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar gamma'
      console.error('Error al eliminar gamma:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function uploadImage(id: number, file: File, imageType: string): Promise<Gamma> {
    const response = await gammaApi.uploadImage(id, file, imageType)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Error al subir imagen de gamma')
  }

  async function deleteImage(id: number, imageType: string): Promise<Gamma> {
    const response = await gammaApi.deleteImage(id, imageType)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('Error al eliminar imagen de gamma')
  }

  function clearCurrentGamma() {
    currentGamma.value = null
  }

  function clearGammasByBrand() {
    gammasByBrand.value = []
  }

  return {
    // State
    gammas,
    currentGamma,
    gammasByBrand,
    isLoading,
    error,
    // Actions
    fetchAll,
    fetchByBrand,
    fetchById,
    create,
    update,
    remove,
    uploadImage,
    deleteImage,
    clearCurrentGamma,
    clearGammasByBrand
  }
})
