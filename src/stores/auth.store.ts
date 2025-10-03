import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import type { User, Store, LoginCredentials } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const stores = ref<Store[]>([])
  const selectedStore = ref<Store | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const hasMultipleStores = computed(() => stores.value.length > 1)

  // Actions
  async function login(credentials: LoginCredentials) {
    try {
      isLoading.value = true
      error.value = null

      const response = await authApi.login(credentials)

      if (response.success && response.data) {
        // Guardar tokens
        accessToken.value = response.data.access_token
        refreshToken.value = response.data.refresh_token
        user.value = response.data.user

        // Guardar en localStorage
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('refresh_token', response.data.refresh_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // Obtener tiendas del usuario
        await fetchStores()

        return true
      } else {
        error.value = response.message || 'Error al iniciar sesión'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStores() {
    try {
      const response = await authApi.getStores()

      if (response.success && response.data) {
        stores.value = response.data

        // Si solo hay una tienda, seleccionarla automáticamente
        if (response.data.length === 1) {
          await selectStore(response.data[0])
        } else {
          // Intentar restaurar tienda seleccionada del localStorage
          const savedStore = localStorage.getItem('selected_store')
          if (savedStore) {
            const store = JSON.parse(savedStore)
            const foundStore = response.data.find(s => s.id === store.id)
            if (foundStore) {
              selectedStore.value = foundStore
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error al obtener tiendas:', err)
      error.value = err.response?.data?.message || 'Error al cargar tiendas'
    }
  }

  async function selectStore(store: Store) {
    try {
      isLoading.value = true
      error.value = null

      const response = await authApi.selectStore(store.id)

      if (response.success) {
        selectedStore.value = store
        localStorage.setItem('selected_store', JSON.stringify(store))
        return true
      } else {
        error.value = response.message || 'Error al seleccionar tienda'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al seleccionar tienda'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    } finally {
      // Limpiar estado
      user.value = null
      stores.value = []
      selectedStore.value = null
      accessToken.value = null
      refreshToken.value = null
      error.value = null

      // Limpiar localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('selected_store')
    }
  }

  function restoreSession() {
    // Restaurar sesión desde localStorage
    const token = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    const savedUser = localStorage.getItem('user')
    const savedStore = localStorage.getItem('selected_store')

    if (token && savedUser) {
      accessToken.value = token
      refreshToken.value = refresh
      user.value = JSON.parse(savedUser)

      if (savedStore) {
        selectedStore.value = JSON.parse(savedStore)
      }

      // Obtener tiendas actualizadas
      fetchStores()
    }
  }

  return {
    // State
    user,
    stores,
    selectedStore,
    accessToken,
    refreshToken,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    hasMultipleStores,
    // Actions
    login,
    fetchStores,
    selectStore,
    logout,
    restoreSession
  }
})
