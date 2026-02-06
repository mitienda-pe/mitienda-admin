import apiClient from './axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  Review,
  ReviewStats,
  ProductRating,
  ProductReview,
  OrderItemReview,
} from '@/types/review.types'

export interface ReviewsFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  rating?: number | null
  product_id?: number | null
  sort?: string
  order?: 'asc' | 'desc'
}

export const reviewsApi = {
  async getReviews(filters: ReviewsFilters = {}): Promise<PaginatedResponse<Review>> {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.rating) params.append('rating', filters.rating.toString())
    if (filters.product_id) params.append('product_id', filters.product_id.toString())
    if (filters.sort) params.append('sort', filters.sort)
    if (filters.order) params.append('order', filters.order)

    const response = await apiClient.get(`/reviews?${params.toString()}`)
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

  async getReview(id: number): Promise<ApiResponse<Review>> {
    const response = await apiClient.get(`/reviews/${id}`)
    return { success: true, data: response.data?.data || response.data }
  },

  async moderate(id: number, status: 'approved' | 'rejected'): Promise<ApiResponse<void>> {
    const response = await apiClient.put(`/reviews/${id}/moderate`, { status })
    return { success: true, message: response.data?.message }
  },

  async bulkModerate(
    ids: number[],
    status: 'approved' | 'rejected',
  ): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.post('/reviews/bulk-moderate', { ids, status })
    return { success: true, data: { count: response.data?.count || ids.length } }
  },

  async deleteReview(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/reviews/${id}`)
    return { success: true }
  },

  async getStats(): Promise<ApiResponse<ReviewStats>> {
    const response = await apiClient.get('/reviews/stats')
    return { success: true, data: response.data?.data || response.data }
  },

  async getProductReviews(
    productId: number,
    limit = 5,
  ): Promise<ApiResponse<ProductReview[]>> {
    const response = await apiClient.get(`/products/${productId}/reviews?limit=${limit}`)
    return { success: true, data: response.data?.data || [] }
  },

  async getProductRating(productId: number): Promise<ApiResponse<ProductRating>> {
    const response = await apiClient.get(`/products/${productId}/rating`)
    return { success: true, data: response.data?.data || response.data }
  },

  async getOrderReviews(orderId: number): Promise<ApiResponse<OrderItemReview[]>> {
    const response = await apiClient.get(`/orders/${orderId}/reviews`)
    return { success: true, data: response.data?.data || [] }
  },
}
