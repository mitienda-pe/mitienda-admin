import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { UserPermissions } from '@/types/permissions.types'

export const permissionsApi = {
  async getMyPermissions(): Promise<ApiResponse<UserPermissions>> {
    const response = await apiClient.get('/user/permissions')
    return response.data
  }
}
