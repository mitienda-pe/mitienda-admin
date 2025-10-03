import apiClient from './axios'
import type { Order, OrderStatus } from '@/types/order.types'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'

export interface OrdersFilters {
  page?: number
  limit?: number
  search?: string
  status?: OrderStatus | 'all'
  date_from?: string
  date_to?: string
}

export interface OrderStats {
  total: number
  pending: number
  paid: number
  shipped: number
  delivered: number
  cancelled: number
}

export const ordersApi = {
  /**
   * Obtener lista de pedidos con filtros y paginación
   */
  async getOrders(filters: OrdersFilters = {}): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)

    const response = await apiClient.get(`/orders?${params.toString()}`)
    return response.data
  },

  /**
   * Obtener detalle de un pedido
   */
  async getOrder(id: number): Promise<ApiResponse<Order>> {
    const response = await apiClient.get(`/orders/${id}`)
    return response.data
  },

  /**
   * Crear un nuevo pedido
   */
  async createOrder(orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    const response = await apiClient.post('/orders', orderData)
    return response.data
  },

  /**
   * Actualizar un pedido
   */
  async updateOrder(id: number, orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    const response = await apiClient.put(`/orders/${id}`, orderData)
    return response.data
  },

  /**
   * Actualizar estado de un pedido
   */
  async updateOrderStatus(id: number, status: OrderStatus): Promise<ApiResponse<Order>> {
    const response = await apiClient.put(`/orders/${id}`, { status })
    return response.data
  },

  /**
   * Obtener estadísticas de pedidos
   */
  async getStats(): Promise<ApiResponse<OrderStats>> {
    const response = await apiClient.get('/orders/stats')
    return response.data
  }
}
