import apiClient from './axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Complaint, ComplaintStats } from '@/types/complaint.types'

export interface ComplaintsFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export const complaintsApi = {
  async getComplaints(filters: ComplaintsFilters = {}): Promise<PaginatedResponse<Complaint>> {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.type) params.append('type', filters.type)
    if (filters.sort) params.append('sort', filters.sort)
    if (filters.order) params.append('order', filters.order)

    const response = await apiClient.get(`/complaints?${params.toString()}`)
    const rawData = response.data

    if (rawData.data) {
      return {
        success: true,
        data: rawData.data,
        meta: {
          page: rawData.pagination?.page || filters.page || 1,
          perPage: rawData.pagination?.perPage || filters.limit || 20,
          total: rawData.pagination?.total || 0,
          totalPages: rawData.pagination?.totalPages || 1,
          hasMore: rawData.pagination?.hasMore || false,
        },
      }
    }

    return {
      success: false,
      data: [],
      meta: { page: 1, perPage: 20, total: 0, totalPages: 0, hasMore: false },
    }
  },

  async getComplaint(id: number): Promise<ApiResponse<Complaint>> {
    const response = await apiClient.get(`/complaints/${id}`)
    return { success: true, data: response.data?.data || response.data }
  },

  async respond(id: number, responseText: string): Promise<ApiResponse<void>> {
    const response = await apiClient.put(`/complaints/${id}/respond`, {
      response: responseText,
    })
    return { success: true, message: response.data?.message }
  },

  async getStats(): Promise<ApiResponse<ComplaintStats>> {
    const response = await apiClient.get('/complaints/stats')
    return { success: true, data: response.data?.data || response.data }
  },
}
