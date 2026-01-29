import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pagesApi } from '@/api/pages.api'
import type { Page, PageFormData } from '@/types/page.types'

export const usePagesStore = defineStore('pages', () => {
  // State
  const pages = ref<Page[]>([])
  const currentPage = ref<Page | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchPages() {
    try {
      isLoading.value = true
      error.value = null

      const response = await pagesApi.getAll()

      if (response.success && response.data) {
        pages.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || err.response?.data?.message || 'Error al cargar páginas'
      console.error('Error al cargar páginas:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPageById(id: number): Promise<Page | null> {
    try {
      isLoading.value = true
      error.value = null

      const response = await pagesApi.getById(id)

      if (response.success && response.data) {
        currentPage.value = response.data
        return response.data
      }

      return null
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar la página'
      console.error('Error al cargar página:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createPage(data: PageFormData): Promise<Page> {
    try {
      const response = await pagesApi.create(data)

      if (response.success && response.data) {
        await fetchPages()
        return response.data
      }

      throw new Error(response.message || 'Error al crear la página')
    } catch (err: any) {
      console.error('Error al crear página:', err)
      throw err
    }
  }

  async function updatePage(id: number, data: Partial<PageFormData>): Promise<Page> {
    try {
      const response = await pagesApi.update(id, data)

      if (response.success && response.data) {
        currentPage.value = response.data
        // Update in list if present
        const index = pages.value.findIndex(p => p.id === id)
        if (index !== -1) {
          pages.value[index] = response.data
        }
        return response.data
      }

      throw new Error(response.message || 'Error al actualizar la página')
    } catch (err: any) {
      console.error('Error al actualizar página:', err)
      throw err
    }
  }

  async function deletePage(id: number): Promise<void> {
    try {
      await pagesApi.delete(id)
      await fetchPages()
    } catch (err: any) {
      console.error('Error al eliminar página:', err)
      throw err
    }
  }

  async function togglePublished(id: number): Promise<void> {
    try {
      const response = await pagesApi.togglePublished(id)

      if (response.success && response.data) {
        // Update in list
        const index = pages.value.findIndex(p => p.id === id)
        if (index !== -1) {
          pages.value[index] = response.data
        }
        if (currentPage.value?.id === id) {
          currentPage.value = response.data
        }
      }
    } catch (err: any) {
      console.error('Error al cambiar estado de publicación:', err)
      throw err
    }
  }

  return {
    // State
    pages,
    currentPage,
    isLoading,
    error,
    // Actions
    fetchPages,
    fetchPageById,
    createPage,
    updatePage,
    deletePage,
    togglePublished,
  }
})
