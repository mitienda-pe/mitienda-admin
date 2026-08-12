// Tipos de pedidos
export interface Order {
  id: number
  order_number: string
  customer: Customer
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  shipping_cost?: number
  tax: number
  total: number
  rounding_amount?: number // Monto del redondeo aplicado (puede ser positivo o negativo)
  total_after_rounding?: number // Total después de aplicar el redondeo
  status: OrderStatus
  payment_method: string
  payment_status: string
  payment_gateway?: string
  payments?: OrderPayment[] // For POS sales with multiple payment methods
  gateway_code?: string
  gateway_error_user?: string
  gateway_error_store?: string
  shipping_address?: Address | string
  shipping_details?: ShippingDetails
  billing_address?: Address
  notes?: string
  store_notes?: string
  /** Estado de despacho vigente. Solo viene en el listado de pedidos. */
  dispatch_state?: { id: number; name: string | null } | null
  tiendaventa_estado_notif_erp?: number // 0 = success, 1 = error
  tiendaventa_mensaje_notif_erp?: string
  tiendaventa_payload_notif_erp?: string // Request payload sent to NetSuite
  erp_sync?: ErpSync
  fulfillment?: {
    status: 'not_sent' | 'sent' | 'error' | 'processing' | 'unknown'
    status_code: number
    tracking_code: string | null
    message: string | null
    provider: string | null
  }
  billing_document?: BillingDocument
  promotions?: OrderPromotion[] // Applied promotions (2x1, discounts, etc.)
  promotions_discount?: number // Total discount from promotions
  coupon_discount?: number // Total discount from coupon
  coupon_code?: string | null // Coupon code used
  coupon_value?: number // Coupon value (percentage or fixed amount)
  coupon_type?: 'percentage' | 'fixed' // Coupon discount type
  referrer_code?: string | null // Referrer/affiliate code
  shipping_history?: ShippingHistoryEvent[] // Eventos de despacho (tiendasestadosdespacho)
  payment_comments_count?: number // Comentarios del seller sobre el pago (anotaciones manuales)
  created_at: string
  /** Fecha real de confirmación del pago (`date_payment` del backend). Null si aún no se pagó. */
  paid_at?: string | null
  updated_at: string
}

export interface OrderPaymentComment {
  id: number
  order_id: number
  text: string
  author: {
    id: number
    name: string | null
    email: string | null
  }
  created_at: string
  updated_at: string | null
  can_edit: boolean
  can_delete: boolean
}

export interface OrderPromotion {
  name: string
  code?: string
  discount_amount: number
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  order_item_id?: number | null // Links promotion to specific order item (null = order-level)
  product_id?: number | null
}

// --- Notificaciones de orden (Confirmación de Venta/Pedido) ---------------
// Estado y reenvío manual del webhook v2 + email al vendedor.

export interface OrderWebhookDelivery {
  id: number
  subscription_id: number
  url: string
  status: 'success' | 'failed' | 'pending'
  response_code: number | null
  response_body: string | null
  attempt: number
  max_attempts: number
  duration_ms: number | null
  event_type: string
  created_at: string
}

export interface OrderNotificationsStatus {
  order_id: number
  is_paid: boolean
  webhook: {
    active_subscriptions: number
    // Suscripciones activas que además escuchan `order.paid`. Puede ser 0 con
    // active_subscriptions > 0 (p.ej. una tienda suscrita solo a product.updated),
    // y en ese caso el comercio NO recibe la venta. Opcional: las APIs previas
    // a este campo no lo devuelven.
    subscribed_to_order_paid?: number
    last_status: 'success' | 'failed' | 'pending' | null
    last_response_code: number | null
    last_delivered_at: string | null
    deliveries: OrderWebhookDelivery[]
  }
  seller_email: {
    sent: boolean
    is_paid: boolean
    /**
     * Fecha del último aviso al vendedor (automático o reenvío manual).
     * `null` en órdenes notificadas antes de que existiera el timestamp.
     */
    last_sent_at?: string | null
    /**
     * Segundos transcurridos desde el último envío, calculados en el servidor:
     * la cuenta regresiva no puede salir de `last_sent_at` porque el navegador
     * puede estar en otro huso horario.
     */
    seconds_since_last_sent?: number | null
    /** Ventana en la que el API rechaza un segundo reenvío del mismo correo. */
    cooldown_seconds?: number
  }
}

export type ResendNotificationChannel = 'webhook' | 'email' | 'both'

export interface ResendNotificationsResult {
  webhook?: {
    ok: boolean
    /** Suscripciones que escuchan el evento (las que realmente reciben el reenvío). */
    subscriptions?: number
    /** Todas las suscripciones activas de la tienda, escuchen o no el evento. */
    subscriptions_total?: number
    delivered?: number
    failed?: number
    error?: string | null
    deliveries?: Array<{
      subscription_id: number
      url: string
      status: 'success' | 'failed' | 'pending'
      response_code: number | null
      response_body: string | null
      duration_ms: number | null
    }>
  }
  email?: {
    ok: boolean
    recipients?: string[]
    sent?: string[]
    failed?: string[]
    /** `'no_recipients_configured'` | `'throttled'` | mensaje de error. */
    error?: string | null
    last_sent_at?: string | null
    /** Solo con `error === 'throttled'`: segundos que faltan para poder reenviar. */
    retry_after_seconds?: number
  }
}

export interface OrderPayment {
  method: string
  method_name: string
  amount: string
  reference?: string | null
  authorization_number?: string | null
  payment_date?: string | null
}

export interface BillingDocument {
  id: number
  status: number // 0 = no emitido, 1 = emitido
  source?: 'nubefact' | 'netsuite' | null // Fuente de emisión
  billing_date: string | null
  serie: string
  correlative: string
  document_type?: string // factura, boleta
  pdf_url?: string
  xml_url?: string
  netsuite_invoice_id?: string | null // ID interno del invoice en NetSuite (solo si source = netsuite)
  sunat_pending?: boolean // emitido pero aún no aceptado por SUNAT (estado 2, resumen diario boletas)
}

export interface ErpSync {
  status: 'synced' | 'error' | 'not_synced'
  netsuite_invoice_id?: string | null
  netsuite_document_number?: string | null
  error_message?: string | null
}

export interface ShippingDetails {
  /** True si la orden es "Recojo en tienda" (no delivery a domicilio). */
  is_pickup?: boolean
  /** Sucursal de recojo cuando is_pickup = true. */
  pickup_branch?: {
    name?: string
    address?: string
    district?: string
    province?: string
    department?: string
    phone?: string
    reference?: string
  } | null
  cost: string
  address: string
  address_line2?: string
  country?: string
  department?: string
  province?: string
  district?: string
  ubigeo_code?: string
  zip_code?: string
  latitude?: string
  longitude?: string
  reference?: string
  courier?: string
  courier_id?: number
  courier_error?: string | null
  /** Tarifa elegida por el comprador (Express, Mismo día, etc.). Null si la tienda no usa tipos de servicio. */
  service_type?: {
    id: number | null
    code: string | null
    name: string
    icon?: string | null
  } | null
  tracking_code?: string
  tracking_url?: string
  delivery_proof_url?: string | null
  recipient_name?: string
  recipient_phone?: string
  // Documento del receptor del envío. Cuando el comprador pidió Factura (a nombre
  // de un RUC), aquí queda su DNI real preservado, para no perderlo (venta 871467).
  doc_id?: number
  doc_type?: string
  doc_number?: string
  date_delivered?: string | null
}

export interface ShippingHistoryEvent {
  tiendaestado_id: number
  status: string
  modulo: string
  observacion: string | null
  date: string
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  product_variant?: string | null
  variant_sku?: string | null
  product_image?: string
  quantity: number
  price: number
  original_price?: number // Precio original antes de descuento
  igv_percent?: number
  // Afectación tributaria de la línea: 1=Gravado, 2=Exonerado, 3=Inafecto.
  tax_affectation?: number
  tax_exempt?: boolean
  subtotal: number
  product?: {
    id: number
    sku: string
    images?: Array<{ url: string }>
  }
  plugin_slug?: string | null
  plugin_summary?: string | null
  plugin_data?: Record<string, any> | null
}

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  doc_id?: number // tipo de doc del receptor: 1=DNI, 2=RUC, 3=CIM, 4=Pasaporte, 5=CE (2=RUC => Factura)
  document_type?: string
  document_number?: string
  business_name?: string
  billing_address?: {
    address_line?: string
    district?: string
    province?: string
    department?: string
  }
  created_at: string
}

export interface Address {
  street: string
  city: string
  state: string
  zip_code: string
  country: string
  reference?: string
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'voided' | 'chargeback' | 'refunded'

export interface OrderFilters {
  search: string
  status: OrderStatus | null
  dateFrom: string | null
  dateTo: string | null
}

export interface OrdersState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  filters: OrderFilters
}
