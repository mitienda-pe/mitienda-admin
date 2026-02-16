import { defineStore } from 'pinia'
import { ref } from 'vue'
import { componentsApi } from '@/api/components.api'
import type { StoreComponent, ComponentUpdateData } from '@/types/component.types'
import type { PaginationMeta } from '@/types/api.types'

export const useComponentsStore = defineStore('components', () => {
  const components = ref<StoreComponent[]>([])
  const currentComponent = ref<StoreComponent | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationMeta>({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1,
    hasMore: false,
  })

  async function fetchComponents(params?: {
    page?: number
    limit?: number
    sort?: string
    order?: string
  }) {
    try {
      isLoading.value = true
      error.value = null
      const response = await componentsApi.getAll(params)
      if (response.success) {
        components.value = response.data
        pagination.value = response.meta
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.messages?.error ||
        err.response?.data?.message ||
        'Error al cargar componentes'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchComponentById(id: number): Promise<StoreComponent | null> {
    try {
      isLoading.value = true
      error.value = null
      const response = await componentsApi.getById(id)
      if (response.success && response.data) {
        currentComponent.value = response.data
        return response.data
      }
      return null
    } catch (err: any) {
      error.value =
        err.response?.data?.messages?.error || 'Error al cargar el componente'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateComponent(
    id: number,
    data: ComponentUpdateData
  ): Promise<StoreComponent> {
    try {
      const response = await componentsApi.update(id, data)
      if (response.success && response.data) {
        currentComponent.value = response.data
        const index = components.value.findIndex(c => c.id === id)
        if (index !== -1) {
          components.value[index] = response.data
        }
        return response.data
      }
      throw new Error(response.message || 'Error al actualizar el componente')
    } catch (err: any) {
      throw err
    }
  }

  async function toggleActive(id: number): Promise<void> {
    try {
      const response = await componentsApi.toggleActive(id)
      if (response.success && response.data) {
        const index = components.value.findIndex(c => c.id === id)
        if (index !== -1) {
          components.value[index] = response.data
        }
        if (currentComponent.value?.id === id) {
          currentComponent.value = response.data
        }
      }
    } catch (err: any) {
      throw err
    }
  }

  return {
    components,
    currentComponent,
    isLoading,
    error,
    pagination,
    fetchComponents,
    fetchComponentById,
    updateComponent,
    toggleActive,
  }
})
