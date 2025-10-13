import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AnnouncementBar, AnnouncementBarFormData } from '@/types/announcement-bar.types'
import { announcementBarsApi } from '@/api/announcement-bars.api'

export const useAnnouncementBarsStore = defineStore('announcementBars', () => {
  // State
  const bars = ref<AnnouncementBar[]>([])
  const currentBar = ref<AnnouncementBar | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getActiveBars = () => bars.value.filter(bar => bar.activo)
  const getBarById = (id: number) => bars.value.find(bar => bar.id === id)

  // Actions
  async function fetchBars() {
    loading.value = true
    error.value = null
    try {
      bars.value = await announcementBarsApi.getAll()
    } catch (e: any) {
      error.value = e.message || 'Error al cargar las barras de anuncio'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchBar(id: number) {
    loading.value = true
    error.value = null
    try {
      currentBar.value = await announcementBarsApi.getById(id)
      return currentBar.value
    } catch (e: any) {
      error.value = e.message || 'Error al cargar la barra de anuncio'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createBar(data: AnnouncementBarFormData) {
    loading.value = true
    error.value = null
    try {
      const newBar = await announcementBarsApi.create(data)
      bars.value.unshift(newBar)
      return newBar
    } catch (e: any) {
      error.value = e.message || 'Error al crear la barra de anuncio'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateBar(id: number, data: AnnouncementBarFormData) {
    loading.value = true
    error.value = null
    try {
      const updatedBar = await announcementBarsApi.update(id, data)
      const index = bars.value.findIndex(bar => bar.id === id)
      if (index !== -1) {
        bars.value[index] = updatedBar
      }
      if (currentBar.value?.id === id) {
        currentBar.value = updatedBar
      }
      return updatedBar
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar la barra de anuncio'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteBar(id: number) {
    loading.value = true
    error.value = null
    try {
      await announcementBarsApi.delete(id)
      bars.value = bars.value.filter(bar => bar.id !== id)
      if (currentBar.value?.id === id) {
        currentBar.value = null
      }
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar la barra de anuncio'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    bars,
    currentBar,
    loading,
    error,

    // Getters
    getActiveBars,
    getBarById,

    // Actions
    fetchBars,
    fetchBar,
    createBar,
    updateBar,
    deleteBar
  }
})
