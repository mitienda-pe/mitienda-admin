import apiClient from './axios'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type {
  ProductPriceItem,
  ProductStockItem,
  ProductOrderItem,
  BatchPriceUpdate,
  BatchStockUpdate,
  BatchOrderUpdate,
  CsvImportPreview,
  ProductCreatePayload,
  ProductManagementFilters,
} from '@/types/product.types'

function buildParams(filters: ProductManagementFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.sort_field) params.append('sort_field', filters.sort_field)
  if (filters.sort_order) params.append('sort_order', filters.sort_order)
  return params
}

export const productManagementApi = {
  // ── Lightweight listings ──

  async listPrices(
    filters: ProductManagementFilters = {}
  ): Promise<PaginatedResponse<ProductPriceItem>> {
    const params = buildParams(filters)
    const response = await apiClient.get(`/products/list-prices?${params.toString()}`)
    const apiResponse = response.data
    return {
      success: true,
      data: apiResponse.data || [],
      meta: apiResponse.pagination || {
        page: 1,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    }
  },

  async listStock(
    filters: ProductManagementFilters = {}
  ): Promise<PaginatedResponse<ProductStockItem>> {
    const params = buildParams(filters)
    const response = await apiClient.get(`/products/list-stock?${params.toString()}`)
    const apiResponse = response.data
    return {
      success: true,
      data: apiResponse.data || [],
      meta: apiResponse.pagination || {
        page: 1,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    }
  },

  async listOrder(
    filters: ProductManagementFilters = {}
  ): Promise<PaginatedResponse<ProductOrderItem>> {
    const params = buildParams(filters)
    const response = await apiClient.get(`/products/list-order?${params.toString()}`)
    const apiResponse = response.data
    return {
      success: true,
      data: apiResponse.data || [],
      meta: apiResponse.pagination || {
        page: 1,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    }
  },

  // ── Batch updates ──

  async batchUpdatePrices(
    items: BatchPriceUpdate[]
  ): Promise<ApiResponse<{ updated_products: number; updated_variants: number }>> {
    const response = await apiClient.put('/products/batch-prices', { items })
    return response.data
  },

  async batchUpdateStock(
    items: BatchStockUpdate[]
  ): Promise<ApiResponse<{ updated_products: number; updated_variants: number }>> {
    const response = await apiClient.put('/products/batch-stock', { items })
    return response.data
  },

  async batchUpdateOrder(
    items: BatchOrderUpdate[]
  ): Promise<ApiResponse<{ updated_products: number }>> {
    const response = await apiClient.put('/products/batch-order', { items })
    return response.data
  },

  // ── CSV Export ──

  async exportPrices(): Promise<Blob> {
    const response = await apiClient.get('/products/export-prices', {
      responseType: 'blob',
    })
    return response.data
  },

  async exportStock(): Promise<Blob> {
    const response = await apiClient.get('/products/export-stock', {
      responseType: 'blob',
    })
    return response.data
  },

  async exportOrder(): Promise<Blob> {
    const response = await apiClient.get('/products/export-order', {
      responseType: 'blob',
    })
    return response.data
  },

  // ── CSV Import ──

  async importPricesPreview(file: File): Promise<ApiResponse<CsvImportPreview>> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/products/import-prices', formData)
    return response.data
  },

  async importPricesConfirm(
    file: File
  ): Promise<ApiResponse<{ processed: number; updated: number }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('confirm', '1')
    const response = await apiClient.post('/products/import-prices', formData)
    return response.data
  },

  async importStockPreview(file: File): Promise<ApiResponse<CsvImportPreview>> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/products/import-stock', formData)
    return response.data
  },

  async importStockConfirm(
    file: File
  ): Promise<ApiResponse<{ processed: number; updated: number }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('confirm', '1')
    const response = await apiClient.post('/products/import-stock', formData)
    return response.data
  },

  // ── Calculate missing prices ──

  async calculateMissingPrices(): Promise<
    ApiResponse<{ updated: number; without_tax_calculated: number; with_tax_calculated: number }>
  > {
    const response = await apiClient.post('/products/calculate-missing-prices')
    return response.data
  },

  // ── Bulk export ──

  async exportBulk(columns: string[]): Promise<Blob> {
    const response = await apiClient.get('/products/export-bulk', {
      params: { columns: columns.join(',') },
      responseType: 'blob',
    })
    return response.data
  },

  // ── Product creation ──

  async createProduct(data: ProductCreatePayload): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/products', data)
    return response.data
  },
}
