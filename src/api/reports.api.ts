import apiClient from './axios'
import type {
  ReportFilters,
  ReportPreviewResponse,
  OrderReportRow,
  PaymentGateway,
  ExportFormat,
  ProductSalesReportRow,
  ProductSalesPreviewResponse
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
