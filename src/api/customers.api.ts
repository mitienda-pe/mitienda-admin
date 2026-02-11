import apiClient from './axios'
import type { Customer, CustomerDetail, CustomerStats } from '@/types/customer.types'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'

export interface CustomersFilters {
  page?: number
  limit?: number
  search?: string
  verified?: boolean
  blocked?: boolean
  date_from?: string
  date_to?: string
  has_orders?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export const customersApi = {
  /**
   * Obtener lista de clientes con filtros y paginación
   */
  async getCustomers(filters: CustomersFilters = {}): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.verified !== undefined) params.append('verified', filters.verified ? '1' : '0')
    if (filters.blocked !== undefined) params.append('blocked', filters.blocked ? '1' : '0')
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.has_orders !== undefined) params.append('has_orders', filters.has_orders ? '1' : '0')
    if (filters.sort) params.append('sort', filters.sort)
    if (filters.order) params.append('order', filters.order)

    const response = await apiClient.get(`/customers?${params.toString()}`)

    // La API devuelve { data: [...], pagination: {...} }
    const rawData = response.data

    if (rawData.data) {
      return {
        success: true,
        data: rawData.data.map((customer: any) => ({
          id: parseInt(customer.id),
          name: customer.name,
          email: customer.email,
          phone: customer.phone || '',
          address: customer.address || '',
          document_type: customer.document_type,
          document_number: customer.document_number,
          birthdate: customer.birthdate,
          created_at: customer.created_at,
          verified: customer.verified || false,
          blocked: customer.blocked || false,
          total_orders: customer.total_orders || 0,
          total_spent: customer.total_spent || 0,
          last_order_date: customer.last_order_date || null
        })),
        meta: {
          page: rawData.pagination?.current_page || filters.page || 1,
          limit: rawData.pagination?.per_page || filters.limit || 20,
          total: rawData.pagination?.total || rawData.data.length,
          totalPages: rawData.pagination?.total_pages || 1,
          hasMore: rawData.pagination?.has_next || false
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
   * Obtener detalle de un cliente
   */
  async getCustomer(id: number): Promise<ApiResponse<CustomerDetail>> {
    const response = await apiClient.get(`/customers/${id}`)

    // Después del interceptor: response.data = { success, data: customerObj }
    const normalized = response.data
    if (!normalized?.success || !normalized?.data) {
      console.error('getCustomer: respuesta inesperada', response.data)
      return { success: false, data: undefined }
    }

    const rawData = normalized.data
    const recentOrders = rawData.recent_orders || rawData.orders || []

    const customer: CustomerDetail = {
      id: parseInt(rawData.id),
      name: rawData.name,
      email: rawData.email,
      phone: rawData.phone || '',
      address: rawData.address || '',
      document_type: rawData.document_type,
      document_number: rawData.document_number,
      birthdate: rawData.birthdate,
      created_at: rawData.created_at,
      verified: rawData.verified || false,
      blocked: rawData.blocked || false,
      total_orders: rawData.total_orders || 0,
      total_spent: parseFloat(rawData.total_spent || '0'),
      recent_orders: recentOrders,
      orders: recentOrders,
      stats: rawData.stats || {
        total_orders: rawData.total_orders || 0,
        total_spent: parseFloat(rawData.total_spent || '0'),
        average_order_value: 0,
        last_order_date: rawData.last_order_date || null
      }
    }

    return {
      success: true,
      data: customer
    }
  },

  /**
   * Crear un nuevo cliente
   */
  async createCustomer(customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const response = await apiClient.post('/customers', customerData)
    return response.data
  },

  /**
   * Actualizar un cliente
   */
  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    const response = await apiClient.put(`/customers/${id}`, customerData)
    return response.data
  },

  /**
   * Bloquear/Desbloquear cliente
   */
  async toggleBlockCustomer(id: number, blocked: boolean): Promise<ApiResponse<Customer>> {
    const response = await apiClient.put(`/customers/${id}`, { blocked })
    return response.data
  },

  /**
   * Obtener estadísticas de clientes
   */
  async getStats(): Promise<ApiResponse<CustomerStats>> {
    const response = await apiClient.get('/customers/stats')
    return response.data
  }
}
