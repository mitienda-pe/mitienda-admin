import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storeUsersApi } from '@/api/store-users.api'
import type { ApiResponse } from '@/types/api.types'
import type {
  StoreUser,
  StoreUserDetail,
  UserModule,
  InviteUserData,
  InviteResult
} from '@/types/store-users.types'

export const useStoreUsersStore = defineStore('storeUsers', () => {
  const users = ref<StoreUser[]>([])
  const currentUser = ref<StoreUserDetail | null>(null)
  const isOwner = ref(false)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const error = ref<string | null>(null)
  /**
   * La API responde 403 cuando quien pregunta no es el dueño de la tienda: el
   * listado expone los correos y los permisos de todo el equipo. No es un error
   * recuperable, así que la vista muestra un aviso en vez de "Reintentar".
   */
  const isForbidden = ref(false)

  async function fetchUsers() {
    isLoading.value = true
    error.value = null
    isForbidden.value = false
    try {
      const response = await storeUsersApi.getUsers()
      if (response.success && response.data) {
        users.value = response.data
        isOwner.value = !!(response as ApiResponse<StoreUser[]> & { is_owner?: boolean }).is_owner
      }
    } catch (e: any) {
      if (e.response?.status === 403) {
        isForbidden.value = true
        isOwner.value = false
      } else {
        error.value = e.message || 'Error al cargar usuarios'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUser(id: number) {
    isDetailLoading.value = true
    error.value = null
    try {
      const response = await storeUsersApi.getUser(id)
      if (response.success && response.data) {
        currentUser.value = response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar detalle del usuario'
    } finally {
      isDetailLoading.value = false
    }
  }

  async function fetchAvailableModules(): Promise<UserModule[]> {
    const response = await storeUsersApi.getAvailableModules()
    if (response.success && response.data) {
      return response.data
    }
    return []
  }

  async function inviteUser(data: InviteUserData): Promise<InviteResult | null> {
    const response = await storeUsersApi.inviteUser(data)
    if (response.success && response.data) {
      await fetchUsers()
      return response.data
    }
    return null
  }

  async function updateModules(userId: number, moduleIds: number[]) {
    const response = await storeUsersApi.updateModules(userId, moduleIds)
    if (response.success) {
      await fetchUser(userId)
    }
    return response
  }

  async function deleteUser(userId: number) {
    const response = await storeUsersApi.deleteUser(userId)
    if (response.success) {
      await fetchUsers()
    }
    return response
  }

  return {
    users,
    currentUser,
    isOwner,
    isLoading,
    isDetailLoading,
    error,
    isForbidden,
    fetchUsers,
    fetchUser,
    fetchAvailableModules,
    inviteUser,
    updateModules,
    deleteUser
  }
})
