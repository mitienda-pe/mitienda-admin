// Billing Provider Types

export interface BillingProvider {
  id: number
  name: string
  description: string
  logo: string
}

export type BillingEnvironment = 'produccion' | 'prueba'
export type PdfFormat = 'A4' | 'TICKET' | '80MM'

// Series por sucursal (emisión SUNAT, fuera de NetSuite)

export type SerieTipoDocumento = 'BOLETA' | 'FACTURA'

export interface BranchSerie {
  tiendaseriefact_id: number
  tienda_id: number
  tiendadireccion_id: number | null // null = serie default de la tienda
  tiendaseriefact_tipo_documento: SerieTipoDocumento
  tiendaseriefact_serie: string
  tiendaseriefact_correlativo: number // último correlativo emitido
  tiendaseriefact_estado: number
}

export interface BranchSerieSucursal {
  tiendadireccion_id: number
  nombre: string
  numero_cajas: number
}

export interface BranchSeriesResponse {
  series: BranchSerie[]
  sucursales: BranchSerieSucursal[]
  feature_applicable: boolean // true si la tienda tiene ≥2 sucursales con POS
}

export interface SaveBranchSerieRequest {
  tiendadireccion_id: number | null
  tipo_documento: SerieTipoDocumento
  serie: string
  correlativo_inicial?: number
}

// Nubefact Types

export interface NubefactCredentials {
  nubefact_url: string
  api_token: string
  serie_factura?: string
  numero_factura?: string | number
  serie_boleta?: string
  numero_boleta?: string | number
  environment: BillingEnvironment
  pdf_format?: PdfFormat
}

export interface NubefactConfig {
  configured: boolean
  provider: string
  blocked?: boolean
  credentials: NubefactCredentials | null
}

export interface NubefactConfigResponse {
  provider: BillingProvider
  configured: boolean
  blocked?: boolean
  credentials: NubefactCredentials | null
}

export interface SaveNubefactCredentialsRequest {
  nubefact_url: string
  api_token: string
  serie_factura?: string
  numero_factura?: string | number
  serie_boleta?: string
  numero_boleta?: string | number
  environment?: BillingEnvironment
  pdf_format?: PdfFormat
  blocked?: boolean
}

export interface TestConnectionResponse {
  connected: boolean
  environment: BillingEnvironment
  message?: string
}

// Bizlinks Types (Peru)
// Modos: 'shared' (facturación incluida en el plan, credenciales compartidas de MiTienda),
// 'rest' (PSE REST nativo con credenciales propias), 'proxy' (SOAP via mtbilling, legacy),
// 'direct' (XML PUT legacy, deprecado). shared/rest/proxy comparten el layout de emisor.
export type BizlinksMode = 'shared' | 'rest' | 'proxy' | 'direct'
// En modos rest/proxy el ambiente usa development/production; en direct usa produccion/prueba
export type BizlinksEnvironment = BillingEnvironment | 'development' | 'production'

export interface BizlinksCredentials {
  mode?: BizlinksMode
  // Direct (REST)
  api_url?: string
  puerto?: string
  // Proxy (SOAP via mtbilling)
  bizlinks_user?: string
  bizlinks_password?: string
  // Comunes
  ruc_emisor: string
  razon_social: string
  serie_factura?: string
  numero_factura?: string | number
  serie_boleta?: string
  numero_boleta?: string | number
  direccion?: string
  ubigeo?: string
  environment: BizlinksEnvironment
  email?: string
  nombre_comercial?: string
  pdf_format?: PdfFormat
}

export interface BizlinksConfigResponse {
  provider: BillingProvider
  configured: boolean
  blocked?: boolean
  mode?: BizlinksMode
  credentials: BizlinksCredentials | null
}

export interface SaveBizlinksCredentialsRequest {
  mode?: BizlinksMode
  // Direct (REST)
  api_url?: string
  puerto?: string
  // Proxy (SOAP via mtbilling)
  bizlinks_user?: string
  bizlinks_password?: string
  // Comunes
  ruc_emisor: string
  razon_social: string
  serie_factura?: string
  numero_factura?: string | number
  serie_boleta?: string
  numero_boleta?: string | number
  direccion?: string
  ubigeo?: string
  environment?: BizlinksEnvironment
  email?: string
  nombre_comercial?: string
  pdf_format?: PdfFormat
  blocked?: boolean
}

// Document Types

export type DocumentType = 1 | 2 // 1=Factura, 2=Boleta

export interface BillingDocument {
  id: number
  order_code: string
  document_type: string // 'Factura' | 'Boleta'
  serie: string
  correlative: string
  customer_name: string
  customer_document: string
  total: number
  emission_date: string
  provider_id: number
  files: BillingDocumentFiles
}

export interface BillingDocumentFiles {
  pdf?: string
  xml?: string
  cdr?: string
  qr?: string
}

// Filtros opcionales de la lista de comprobantes (GET /billing/documents).
export interface BillingDocumentFilters {
  date_from?: string       // YYYY-MM-DD
  date_to?: string         // YYYY-MM-DD
  document_type?: 'factura' | 'boleta' | ''
  search?: string
}

export interface BillingDocumentDetail extends BillingDocument {
  customer_document_type: number
  hash: string | null
  full_response: any
}

export interface EmitDocumentRequest {
  order_id: number
  document_type: DocumentType
}

export interface EmitDocumentResponse {
  order_id: number
  document_type: DocumentType
  serie: string
  correlative: string
  files: BillingDocumentFiles
}

// Modo de facturación electrónica de la tienda (GET /billing/status).
// Decide el estado del botón "Emitir Comprobante".
export interface BillingStatus {
  provider_configured: boolean
  provider_id: number | null
  provider_name: string | null
  auto_emission: boolean // emite automáticamente al pagar (= !sw_bloqueado)
  delegated: boolean      // facturación delegada al ERP (NetSuite)
}

// Manual Billing Types

export type ManualDocumentType = 1 | 2 | 3 // 1=Factura, 2=Boleta, 3=Nota de Crédito
export type ClientDocumentType = 0 | 1 | 2 // 0=Sin doc, 1=DNI, 2=RUC

export interface ManualDocumentClient {
  document_type: ClientDocumentType
  document_number: string
  names?: string
  last_names?: string
  business_name?: string // For RUC
  address?: string
  email?: string
  ubigeo?: string
}

export interface ManualDocumentItem {
  id?: string // Frontend temp ID for tracking
  product_id?: number
  code: string
  description: string
  unit: string
  quantity: number
  unit_price: number // WITH IGV
  unit_price_without_igv?: number // Calculated
  affectation_type: number
  subtotal?: number // Calculated
  igv?: number // Calculated
  total?: number // Calculated
}

export interface ReferenceDocument {
  type: ManualDocumentType
  serie: string
  correlativo: number
}

export interface ManualEmitRequest {
  document_type: ManualDocumentType
  client: ManualDocumentClient
  items: Omit<ManualDocumentItem, 'id' | 'unit_price_without_igv' | 'subtotal' | 'igv' | 'total'>[]
  pdf_format?: PdfFormat
  notes?: string
  // Credit note fields
  reference_document?: ReferenceDocument
  credit_note_type?: string
  reason?: string
}

export interface ManualEmitResponse {
  id: number
  document_type: ManualDocumentType
  serie: string
  correlative: number
  total: number
  files: BillingDocumentFiles
}

export interface ManualDocument extends Omit<BillingDocument, 'order_code'> {
  origin: 'manual' | 'order'
  order_code: string | null
  document_type_code: ManualDocumentType
  subtotal: number
  igv: number
  customer_document_type: ClientDocumentType
  notes: string | null
  items?: ManualDocumentItem[]
  // Credit note fields
  reference?: ReferenceDocument | null
  credit_note_type?: string | null
  credit_note_reason?: string | null
}

// DeColecta Lookup Types

export interface DniLookupResult {
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  fullName: string
}

export interface RucLookupResult {
  razonSocial: string
  estado: string
  condicion: string
  direccion: string
  ubigeo?: string
  departamento?: string
  provincia?: string
  distrito?: string
}

export type DocumentLookupResult = DniLookupResult | RucLookupResult

// Credit Note Types

export const CREDIT_NOTE_TYPES = [
  { code: '01', label: 'Anulación de la operación' },
  { code: '02', label: 'Anulación por error en RUC' },
  { code: '03', label: 'Corrección por error en descripción' },
  { code: '04', label: 'Descuento global' },
  { code: '05', label: 'Descuento por ítem' },
  { code: '06', label: 'Devolución total' },
  { code: '07', label: 'Devolución parcial' },
] as const
