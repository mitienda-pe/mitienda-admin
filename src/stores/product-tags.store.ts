import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productTagsApi } from '@/api/product-tags.api'
import type { ProductTag, ProductTagFormData } from '@/types/product-tag.types'

export const useProductTagsStore = defineStore('productTags', () => {
  // State
  const tags = ref<ProductTag[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchTags() {
    isLoading.value = true
    error.value = null
    try {
      const response = await productTagsApi.getTags()
      if (response.success && response.data) {
        tags.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar las etiquetas'
      console.error('Error fetching tags:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createTag(data: ProductTagFormData): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await productTagsApi.createTag(data)
      if (response.success && response.data) {
        tags.value.push(response.data)
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear la etiqueta'
      console.error('Error creating tag:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function updateTag(id: number, data: Partial<ProductTagFormData>): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await productTagsApi.updateTag(id, data)
      if (response.success && response.data) {
        const index = tags.value.findIndex(t => t.id === id)
        if (index !== -1) {
          tags.value[index] = response.data
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar la etiqueta'
      console.error('Error updating tag:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function deleteTag(id: number): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await productTagsApi.deleteTag(id)
      if (response.success) {
        tags.value = tags.value.filter(t => t.id !== id)
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar la etiqueta'
      console.error('Error deleting tag:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  function getActiveTags(): ProductTag[] {
    return tags.value.filter(tag => tag.activo)
  }

  function getTagById(id: number): ProductTag | undefined {
    return tags.value.find(tag => tag.id === id)
  }

  return {
    // State
    tags,
    isLoading,
    error,

    // Actions
    fetchTags,
    createTag,
    updateTag,
    deleteTag,

    // Getters
    getActiveTags,
    getTagById
  }
})
