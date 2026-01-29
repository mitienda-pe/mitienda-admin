import apiClient from './axios'
import {
  ExportFormat,
  type ReportFilters,
  type ReportPreviewResponse,
  type OrderReportRow,
  type PaymentGateway,
  type ProductSalesReportRow,
  type ProductSalesPreviewResponse,
  type ProductCatalogFilters,
  type ProductCatalogRow,
  type ProductCatalogPreviewResponse,
  type PromotionsFilters,
  type PromotionReportRow,
  type PromotionsPreviewResponse
} from '@/types/report.types'

export const reportsApi = {
  /**
   * Get preview of orders report (first 100 rows)
   */
  async getOrdersReportPreview(filters: ReportFilters): Promise<ReportPreviewResponse> {
    const params = new URLSearchParams()

    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.payment_status !== undefined) {
      params.append('payment_status', filters.payment_status.toString())
    }
    if (filters.payment_gateway_id !== undefined) {
      params.append('payment_gateway_id', filters.payment_gateway_id.toString())
    }

    const response = await apiClient.get<{
      success: boolean
      data: OrderReportRow[]
      total_count: number
      has_more: boolean
      filters_applied: ReportFilters
    }>(`/reports/orders/preview?${params.toString()}`)

    if (!response.data.success) {
      throw new Error('Failed to fetch report preview')
    }

    return {
      data: response.data.data,
      total_count: response.data.total_count,
      has_more: response.data.has_more,
      filters_applied: response.data.filters_applied
    }
  },

  /**
   * Export orders report to file (CSV or XLSX)
   */
  async exportOrdersReport(
    filters: ReportFilters,
    format: ExportFormat = ExportFormat.CSV
  ): Promise<Blob> {
    const params = new URLSearchParams()

    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.payment_status !== undefined) {
      params.append('payment_status', filters.payment_status.toString())
    }
    if (filters.payment_gateway_id !== undefined) {
      params.append('payment_gateway_id', filters.payment_gateway_id.toString())
    }
    params.append('format', format)

    const response = await apiClient.get(`/reports/orders/export?${params.toString()}`, {
      responseType: 'blob'
    })

    return response.data
  },

  /**
   * Get list of available payment gateways for filtering
   */
  async getPaymentGateways(): Promise<PaymentGateway[]> {
    const response = await apiClient.get<{
      success: boolean
      data: PaymentGateway[]
    }>('/reports/payment-gateways')

    if (!response.data.success) {
      throw new Error('Failed to fetch payment gateways')
    }

    return response.data.data
  },

  /**
   * Get preview of product sales report (first 100 rows)
   */
  async getProductSalesReportPreview(
    filters: ReportFilters
  ): Promise<ProductSalesPreviewResponse> {
    const params = new URLSearchParams()

    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.payment_status !== undefined) {
      params.append('payment_status', filters.payment_status.toString())
    }
    if (filters.payment_gateway_id !== undefined) {
      params.append('payment_gateway_id', filters.payment_gateway_id.toString())
    }

    const response = await apiClient.get<{
      success: boolean
      data: ProductSalesReportRow[]
      total_count: number
      has_more: boolean
      filters_applied: ReportFilters
    }>(`/reports/product-sales/preview?${params.toString()}`)

    if (!response.data.success) {
      throw new Error('Failed to fetch product sales report preview')
    }

    return {
      data: response.data.data,
      total_count: response.data.total_count,
      has_more: response.data.has_more,
      filters_applied: response.data.filters_applied
    }
  },

  /**
   * Export product sales report to file (CSV or XLSX)
   */
  async exportProductSalesReport(
    filters: ReportFilters,
    format: ExportFormat = ExportFormat.CSV
  ): Promise<Blob> {
    const params = new URLSearchParams()

    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.payment_status !== undefined) {
      params.append('payment_status', filters.payment_status.toString())
    }
    if (filters.payment_gateway_id !== undefined) {
      params.append('payment_gateway_id', filters.payment_gateway_id.toString())
    }
    params.append('format', format)

    const response = await apiClient.get(`/reports/product-sales/export?${params.toString()}`, {
      responseType: 'blob'
    })

    return response.data
  },

  /**
   * Get preview of product catalog report (first 100 rows)
   */
  async getProductCatalogPreview(
    filters: ProductCatalogFilters
  ): Promise<ProductCatalogPreviewResponse> {
    const params = new URLSearchParams()

    if (filters.search) params.append('search', filters.search)
    if (filters.published !== undefined && filters.published !== '')
      params.append('published', filters.published)
    if (filters.stock_status && filters.stock_status !== 'all')
      params.append('stock_status', filters.stock_status)
    if (filters.category_id) params.append('category_id', filters.category_id.toString())
    if (filters.brand_id) params.append('brand_id', filters.brand_id.toString())

    const response = await apiClient.get<{
      success: boolean
      data: ProductCatalogRow[]
      total_count: number
      has_more: boolean
      filters_applied: ProductCatalogFilters
    }>(`/reports/product-catalog/preview?${params.toString()}`)

    if (!response.data.success) {
      throw new Error('Failed to fetch product catalog preview')
    }

    return {
      data: response.data.data,
      total_count: response.data.total_count,
      has_more: response.data.has_more,
      filters_applied: response.data.filters_applied
    }
  },

  /**
   * Export product catalog report to file (CSV or XLSX)
   */
  async exportProductCatalog(
    filters: ProductCatalogFilters,
    format: ExportFormat = ExportFormat.CSV
  ): Promise<Blob> {
    const params = new URLSearchParams()

    if (filters.search) params.append('search', filters.search)
    if (filters.published !== undefined && filters.published !== '')
      params.append('published', filters.published)
    if (filters.stock_status && filters.stock_status !== 'all')
      params.append('stock_status', filters.stock_status)
    if (filters.category_id) params.append('category_id', filters.category_id.toString())
    if (filters.brand_id) params.append('brand_id', filters.brand_id.toString())
    params.append('format', format)

    const response = await apiClient.get(`/reports/product-catalog/export?${params.toString()}`, {
      responseType: 'blob'
    })

    return response.data
  },

  /**
   * Get preview of promotions report (first 100 rows)
   */
  async getPromotionsPreview(
    filters: PromotionsFilters
  ): Promise<PromotionsPreviewResponse> {
    const params = new URLSearchParams()

    if (filters.search) params.append('search', filters.search)
    if (filters.estado && filters.estado !== 'all')
      params.append('estado', filters.estado)
    if (filters.tipo_descuento && filters.tipo_descuento !== 'all')
      params.append('tipo_descuento', filters.tipo_descuento)
    if (filters.origen && filters.origen !== 'all')
      params.append('origen', filters.origen)

    const response = await apiClient.get<{
      success: boolean
      data: PromotionReportRow[]
      total_count: number
      has_more: boolean
      filters_applied: PromotionsFilters
    }>(`/reports/promotions/preview?${params.toString()}`)

    if (!response.data.success) {
      throw new Error('Failed to fetch promotions report preview')
    }

    return {
      data: response.data.data,
      total_count: response.data.total_count,
      has_more: response.data.has_more,
      filters_applied: response.data.filters_applied
    }
  },

  /**
   * Export promotions report to file (CSV or XLSX)
   */
  async exportPromotions(
    filters: PromotionsFilters,
    format: ExportFormat = ExportFormat.CSV,
    exportLevel: 'summary' | 'detailed' = 'summary'
  ): Promise<Blob> {
    const params = new URLSearchParams()

    if (filters.search) params.append('search', filters.search)
    if (filters.estado && filters.estado !== 'all')
      params.append('estado', filters.estado)
    if (filters.tipo_descuento && filters.tipo_descuento !== 'all')
      params.append('tipo_descuento', filters.tipo_descuento)
    if (filters.origen && filters.origen !== 'all')
      params.append('origen', filters.origen)
    params.append('format', format)
    params.append('export_level', exportLevel)

    const response = await apiClient.get(`/reports/promotions/export?${params.toString()}`, {
      responseType: 'blob'
    })

    return response.data
  },

  /**
   * Helper to download blob as file
   */
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export default reportsApi
