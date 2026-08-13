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

        // Recargar la config de la tienda impersonada: de ahí sale la moneda con
        // la que los formatters muestran los montos. Impersonar no pasa por
        // `selectStore()` y /admin usa el mismo DashboardLayout, así que el
        // layout no se remonta y su fetchConfig() de onMounted no vuelve a
        // correr: sin esto la tienda se vería con la moneda del super-admin.
        const { useStoreConfigStore } = await import('./store-config.store')
        const configStore = useStoreConfigStore()
        configStore.clearConfig()
        await Promise.all([configStore.fetchConfig(), configStore.fetchCountryConfig()])

        // Los permisos por usuario son por tienda y quedan cacheados en
        // localStorage: sin refrescarlos, el superadmin entraría a la tienda
        // con los permisos de la anterior. Por el mismo motivo que la config
        // de arriba, impersonar no pasa por `selectStore()`.
        const { usePermissionsStore } = await import('./permissions.store')
        const permissionsStore = usePermissionsStore()
        permissionsStore.clearPermissions()
        await permissionsStore.fetchPermissions()

        return true
      }

      error.value = response.message || 'Error al acceder a la tienda'
      return false
    } catch (err: any) {
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

        // Descartar la config y los permisos de la tienda impersonada (ver nota
        // en impersonate). Se limpian sin volver a pedirlos: el superadmin sale
        // a su propia consola, y al entrar a otra tienda se cargan de nuevo.
        const { useStoreConfigStore } = await import('./store-config.store')
        useStoreConfigStore().clearConfig()

        const { usePermissionsStore } = await import('./permissions.store')
        usePermissionsStore().clearPermissions()

        return true
      }

      error.value = response.message || 'Error al salir de impersonación'
      return false
    } catch (err: any) {
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
        // Corrupted localStorage entry
      }
    }

    // Restaurar contexto de impersonación
    const savedImpersonationContext = localStorage.getItem('impersonation_context')
    if (savedImpersonationContext) {
      try {
        impersonationContext.value = JSON.parse(savedImpersonationContext)
      } catch (err) {
        // Corrupted localStorage entry
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
