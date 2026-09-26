import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  ModuleLevel,
  StoreBranch,
  StoreUser,
  StoreUserDetail,
  UserModule,
  InviteUserData,
  InviteResult
} from '@/types/store-users.types'

export const storeUsersApi = {
  async getUsers(): Promise<ApiResponse<StoreUser[]>> {
    const response = await apiClient.get('/store-users')
    return response.data
  },

  async getUser(id: number): Promise<ApiResponse<StoreUserDetail>> {
    const response = await apiClient.get(`/store-users/${id}`)
    return response.data
  },

  async getAvailableModules(): Promise<ApiResponse<UserModule[]>> {
    const response = await apiClient.get('/store-users/modules')
    return response.data
  },

  /** Sucursales de la tienda, para el selector de alcance al invitar. */
  async getStoreBranches(): Promise<ApiResponse<StoreBranch[]>> {
    const response = await apiClient.get('/store-users/branches')
    return response.data
  },

  async inviteUser(data: InviteUserData): Promise<ApiResponse<InviteResult>> {
    const response = await apiClient.post('/store-users/invite', data)
    return response.data
  },

  async updateModules(
    userId: number,
    moduleIds: number[],
    moduleLevels: Record<number, ModuleLevel> = {}
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.put(`/store-users/${userId}/modules`, {
      module_ids: moduleIds,
      module_levels: moduleLevels
    })
    return response.data
  },

  /**
   * Alcance por sucursal. Lista vacía = le devuelve todas las sucursales, que
   * es la única forma de quitar la restricción.
   */
  async updateBranches(
    userId: number,
    branchIds: number[]
  ): Promise<ApiResponse<{ branches: StoreBranch[] }>> {
    const response = await apiClient.put(`/store-users/${userId}/branches`, {
      branch_ids: branchIds
    })
    return response.data
  },

  async updateRole(userId: number, tipoId: number): Promise<ApiResponse<void>> {
    const response = await apiClient.put(`/store-users/${userId}/role`, {
      tipo_id: tipoId
    })
    return response.data
  },

  async deleteUser(userId: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/store-users/${userId}`)
    return response.data
  }
}
