import apiClient from './axios'
import { ExportFormat, type ReportFilters } from '@/types/report.types'
import type {
  CustomReport,
  CustomReportPreviewResponse,
  CustomReportRow,
  CustomReportColumn
} from '@/types/custom-report.types'

/**
 * Serializa solo los filtros presentes. El backend cae a "últimos 30 días"
 * cuando falta el rango, así que mandar claves vacías cambiaría el resultado.
 */
const buildParams = (filters: ReportFilters): URLSearchParams => {
  const params = new URLSearchParams()

  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.payment_status !== undefined) {
    params.append('payment_status', filters.payment_status.toString())
  }
  if (filters.payment_gateway_id !== undefined) {
    params.append('payment_gateway_id', filters.payment_gateway_id.toString())
  }

  return params
}

export const customReportsApi = {
  /**
   * Reportes personalizados habilitados para la tienda activa.
   * Devuelve [] si la tienda no tiene ninguno: es el caso normal.
   */
  async list(): Promise<CustomReport[]> {
    const response = await apiClient.get<{ error: number; data: CustomReport[] }>(
      '/custom-reports'
    )

    return response.data.data ?? []
  },

  async preview(slug: string, filters: ReportFilters): Promise<CustomReportPreviewResponse> {
    const response = await apiClient.get<{
      name: string
      columns: CustomReportColumn[]
      data: CustomReportRow[]
      total_count: number
      has_more: boolean
    }>(`/custom-reports/${slug}/preview?${buildParams(filters).toString()}`)

    return {
      name: response.data.name,
      columns: response.data.columns,
      data: response.data.data,
      total_count: response.data.total_count,
      has_more: response.data.has_more
    }
  },

  async export(
    slug: string,
    filters: ReportFilters,
    format: ExportFormat = ExportFormat.XLSX
  ): Promise<Blob> {
    const params = buildParams(filters)
    params.append('format', format)

    const response = await apiClient.get(
      `/custom-reports/${slug}/export?${params.toString()}`,
      { responseType: 'blob' }
    )

    return response.data
  },

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

export default customReportsApi
