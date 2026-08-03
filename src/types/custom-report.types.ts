// Reportes personalizados por tienda.
//
// A diferencia del resto de reportes, las columnas NO están hardcodeadas en el
// frontend: vienen del backend junto con el reporte, porque cada tienda tiene su
// propio layout heredado del panel legacy.

/** Filtros que un reporte declara soportar. */
export type CustomReportFilter = 'date_range' | 'payment_status' | 'payment_gateway'

/** Cómo renderizar/serializar una columna. `text` fuerza cadena en Excel. */
export type CustomReportColumnType = 'string' | 'text' | 'number' | 'money' | 'date'

export interface CustomReportColumn {
  key: string
  label: string
  type: CustomReportColumnType
  width?: number
}

export interface CustomReport {
  slug: string
  name: string
  description: string | null
  filters: CustomReportFilter[]
  columns: CustomReportColumn[]
}

/** Una fila es un mapa key-de-columna → valor ya formateado por el backend. */
export type CustomReportRow = Record<string, string | number | null>

export interface CustomReportPreviewResponse {
  name: string
  columns: CustomReportColumn[]
  data: CustomReportRow[]
  total_count: number
  has_more: boolean
}
