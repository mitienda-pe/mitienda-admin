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

// Helper para mapear el estado del pedido
function mapOrderStatus(pagado: string): OrderStatus {
  // tiendaventa_pagado: '0' = pendiente, '1' = pagado
  if (pagado === '1') return 'paid'
  return 'pending'
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

    // La API devuelve { orders: [...], pager: {...} }
    // Necesitamos transformarlo al formato esperado
    const rawData = response.data

    if (rawData.orders) {
      return {
        success: true,
        data: rawData.orders.map((order: any) => ({
          id: parseInt(order.tiendaventa_id),
          order_number: order.tiendaventa_codigoreferencia,
          customer: {
            id: parseInt(order.tiendacliente_id || '0'),
            name: `${order.tiendaventa_nombres} ${order.tiendaventa_apellidos}`.trim(),
            email: order.tiendaventa_correoelectronico,
            phone: order.tiendaventa_telefono,
            document_type: order.documento_id_facturacion,
            document_number: order.tiendaventa_numerodocumento,
            created_at: order.tiendaventa_fecha
          },
          items: [], // No se incluyen items en la lista
          subtotal: 0,
          discount: parseFloat(order.tiendaventa_cuponvalor || '0'),
          shipping: parseFloat(order.tiendaventa_montoenvio || '0'),
          tax: 0,
          total: 0, // Se calculará en el detalle
          status: mapOrderStatus(order.tiendaventa_pagado),
          payment_method: 'No especificado',
          payment_status: order.tiendaventa_pagado === '1' ? 'paid' : 'pending',
          shipping_address: order.tiendaventa_direccion_envio || order.tiendaventa_direccion,
          created_at: order.tiendaventa_fecha,
          updated_at: order.tiendaventa_fecha
        })),
        meta: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: rawData.pager?.total_items || rawData.orders.length,
          totalPages: rawData.pager?.total_pages || 1,
          hasMore: rawData.pager?.has_next || false
        }
      }
    }

    return {
      success: false,
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    }
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
