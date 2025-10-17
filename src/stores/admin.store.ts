import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminApi } from '@/api/admin.api'
import type {
  SuperAdminInfo,
  AdminStore,
  AdminStoresFilters,
  AdminStoresPagination,
  ImpersonationContext
} from '@/types/admin.types'

export const useAdminStore = defineStore('admin', () => {
  // State
  const superAdminInfo = ref<SuperAdminInfo | null>(null)
  const stores = ref<AdminStore[]>([])
  const pagination = ref<AdminStoresPagination | null>(null)
  const filters = ref<AdminStoresFilters>({
    status: '',
    plan: '',
    search: '',
    page: 1
  })
  const impersonationContext = ref<ImpersonationContext | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isSuperAdmin = computed(() => superAdminInfo.value?.is_superadmin || false)
  const isImpersonating = computed(() => !!impersonationContext.value)
  const impersonatedStore = computed(() => {
    if (!impersonationContext.value) return null
    return stores.value.find(s => s.id === impersonationContext.value?.target_store_id)
  })

  // Actions
  async function checkSuperAdmin() {
    try {
      isLoading.value = true
      error.value = null

      const response = await adminApi.checkSuperAdmin()

      if (response.success && response.data) {
        superAdminInfo.value = response.data

        // Guardar en localStorage
        localStorage.setItem('superadmin_info', JSON.stringify(response.data))

        return response.data.is_superadmin
      }

      return false
    } catch (err: any) {
      console.error('Error al verificar superadmin:', err)
      error.value = err.response?.data?.message || 'Error al verificar permisos'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStores(newFilters?: Partial<AdminStoresFilters>) {
    try {
      isLoading.value = true
      error.value = null

      // Actualizar filtros si se proporcionan
      if (newFilters) {
        filters.value = { ...filters.value, ...newFilters }
      }

      const response = await adminApi.getStores(filters.value)

      if (response.success && response.data) {
        stores.value = response.data.stores
        pagination.value = response.data.pagination
        return true
      }

      return false
    } catch (err: any) {
      console.error('Error al obtener tiendas:', err)
      error.value = err.response?.data?.message || 'Error al cargar tiendas'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function impersonate(storeId: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await adminApi.impersonate(storeId)

      if (response.success && response.data) {
        // Guardar contexto de impersonación
        impersonationContext.value = response.data.impersonation_context

        // Guardar en localStorage
        localStorage.setItem('impersonation_context', JSON.stringify(response.data.impersonation_context))

        // Actualizar token actual
        localStorage.setItem('access_token', response.data.access_token)

        // IMPORTANTE: Crear un objeto Store falso para que el router no redirija a store-selection
        // Buscar la tienda en la lista
        const targetStore = stores.value.find(s => s.id === storeId)
        if (targetStore) {
          const fakeStore = {
            id: targetStore.id,
            name: targetStore.name,
            slug: targetStore.slug,
            logo: undefined,
            url: targetStore.url,
            plan: targetStore.plan.name,
            status: targetStore.plan.status
          }

          // Guardar en localStorage como si fuera una tienda seleccionada normalmente
          localStorage.setItem('selected_store', JSON.stringify(fakeStore))

          // También actualizar el authStore para que tenga selectedStore
          const { useAuthStore } = await import('./auth.store')
          const authStore = useAuthStore()
          authStore.selectedStore = fakeStore
        }

        console.log('✅ Impersonación iniciada para tienda:', storeId)
        return true
      }

      error.value = response.message || 'Error al acceder a la tienda'
      return false
    } catch (err: any) {
      console.error('Error al impersonar tienda:', err)
      error.value = err.response?.data?.message || 'Error al acceder a la tienda'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function exitImpersonation() {
    try {
      isLoading.value = true
      error.value = null

      if (!impersonationContext.value) {
        error.value = 'No hay impersonación activa'
        return false
      }

      const response = await adminApi.exitImpersonation(impersonationContext.value.original_token)

      if (response.success && response.data) {
        // Restaurar token original
        localStorage.setItem('access_token', response.data.access_token)

        // Limpiar contexto de impersonación
        impersonationContext.value = null
        localStorage.removeItem('impersonation_context')

        console.log('✅ Impersonación finalizada')
        return true
      }

      error.value = response.message || 'Error al salir de impersonación'
      return false
    } catch (err: any) {
      console.error('Error al salir de impersonación:', err)
      error.value = err.response?.data?.message || 'Error al salir de impersonación'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function restoreSession() {
    // Restaurar información de superadmin
    const savedSuperAdminInfo = localStorage.getItem('superadmin_info')
    if (savedSuperAdminInfo) {
      try {
        superAdminInfo.value = JSON.parse(savedSuperAdminInfo)
      } catch (err) {
        console.error('Error al parsear superadmin_info:', err)
      }
    }

    // Restaurar contexto de impersonación
    const savedImpersonationContext = localStorage.getItem('impersonation_context')
    if (savedImpersonationContext) {
      try {
        impersonationContext.value = JSON.parse(savedImpersonationContext)
      } catch (err) {
        console.error('Error al parsear impersonation_context:', err)
      }
    }
  }

  function clearFilters() {
    filters.value = {
      status: '',
      plan: '',
      search: '',
      page: 1
    }
  }

  function setPage(page: number) {
    filters.value.page = page
    fetchStores()
  }

  return {
    // State
    superAdminInfo,
    stores,
    pagination,
    filters,
    impersonationContext,
    isLoading,
    error,
    // Getters
    isSuperAdmin,
    isImpersonating,
    impersonatedStore,
    // Actions
    checkSuperAdmin,
    fetchStores,
    impersonate,
    exitImpersonation,
    restoreSession,
    clearFilters,
    setPage
  }
})
