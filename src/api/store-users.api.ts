import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
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

  async inviteUser(data: InviteUserData): Promise<ApiResponse<InviteResult>> {
    const response = await apiClient.post('/store-users/invite', data)
    return response.data
  },

  async updateModules(
    userId: number,
    moduleIds: number[]
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.put(`/store-users/${userId}/modules`, {
      module_ids: moduleIds
    })
    return response.data
  },

  async deleteUser(userId: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/store-users/${userId}`)
    return response.data
  }
}
