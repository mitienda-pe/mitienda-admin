import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storeUsersApi } from '@/api/store-users.api'
import type {
  StoreUser,
  StoreUserDetail,
  InviteUserData,
  InviteResult
} from '@/types/store-users.types'

export const useStoreUsersStore = defineStore('storeUsers', () => {
  const users = ref<StoreUser[]>([])
  const currentUser = ref<StoreUserDetail | null>(null)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers() {
    isLoading.value = true
    error.value = null
    try {
      const response = await storeUsersApi.getUsers()
      if (response.success && response.data) {
        users.value = response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar usuarios'
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
    isLoading,
    isDetailLoading,
    error,
    fetchUsers,
    fetchUser,
    inviteUser,
    updateModules,
    deleteUser
  }
})
