import { defineStore } from 'pinia'
import { ref } from 'vue'
import { attributesApi } from '@/api/attributes.api'
import type {
  StoreAttribute,
  CreateAttributePayload,
  UpdateAttributePayload,
} from '@/types/attribute.types'

export const useAttributesStore = defineStore('attributes', () => {
  // State
  const attributes = ref<StoreAttribute[]>([])
  const currentAttribute = ref<StoreAttribute | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchAttributes() {
    isLoading.value = true
    error.value = null
    try {
      const response = await attributesApi.getAll()
      if (response.success && response.data) {
        attributes.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar los atributos'
      console.error('Error fetching attributes:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAttribute(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const response = await attributesApi.getById(id)
      if (response.success && response.data) {
        currentAttribute.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar el atributo'
      console.error('Error fetching attribute:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createAttribute(payload: CreateAttributePayload): Promise<number | null> {
    isLoading.value = true
    error.value = null
    try {
      const response = await attributesApi.create(payload)
      if (response.success && response.data) {
        attributes.value.push(response.data)
        return response.data.id
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al crear el atributo'
      console.error('Error creating attribute:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateAttribute(id: number, payload: UpdateAttributePayload): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await attributesApi.update(id, payload)
      if (response.success) {
        // Refresh the current attribute
        await fetchAttribute(id)
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al actualizar el atributo'
      console.error('Error updating attribute:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function deleteAttribute(id: number): Promise<boolean> {
    isLoading.value = true
    error.value = null
    try {
      const response = await attributesApi.remove(id)
      if (response.success) {
        attributes.value = attributes.value.filter(a => a.id !== id)
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al eliminar el atributo'
      console.error('Error deleting attribute:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function addOption(attributeId: number, text: string): Promise<boolean> {
    error.value = null
    try {
      const response = await attributesApi.addOption(attributeId, text)
      if (response.success && response.data) {
        if (currentAttribute.value && currentAttribute.value.id === attributeId) {
          if (!currentAttribute.value.options) {
            currentAttribute.value.options = []
          }
          currentAttribute.value.options.push(response.data)
          currentAttribute.value.option_count = currentAttribute.value.options.length
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al agregar la opción'
      console.error('Error adding option:', err)
      return false
    }
  }

  async function updateOption(
    attributeId: number,
    optionId: number,
    text: string
  ): Promise<boolean> {
    error.value = null
    try {
      const response = await attributesApi.updateOption(attributeId, optionId, text)
      if (response.success) {
        if (currentAttribute.value?.options) {
          const option = currentAttribute.value.options.find(o => o.id === optionId)
          if (option) {
            option.text = text
          }
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al actualizar la opción'
      console.error('Error updating option:', err)
      return false
    }
  }

  async function removeOption(attributeId: number, optionId: number): Promise<boolean> {
    error.value = null
    try {
      const response = await attributesApi.removeOption(attributeId, optionId)
      if (response.success) {
        if (currentAttribute.value?.options) {
          currentAttribute.value.options = currentAttribute.value.options.filter(
            o => o.id !== optionId
          )
          currentAttribute.value.option_count = currentAttribute.value.options.length
        }
        return true
      }
      return false
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al eliminar la opción'
      console.error('Error removing option:', err)
      return false
    }
  }

  function getAttributeById(id: number): StoreAttribute | undefined {
    return attributes.value.find(a => a.id === id)
  }

  return {
    // State
    attributes,
    currentAttribute,
    isLoading,
    error,

    // Actions
    fetchAttributes,
    fetchAttribute,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    addOption,
    updateOption,
    removeOption,

    // Getters
    getAttributeById,
  }
})
