/**
 * Links de pago — cobros compartibles por WhatsApp que terminan en una venta real.
 *
 * Reemplazan al módulo `mod_link_pago` del panel legacy, que cobraba sin generar
 * venta, sin descontar inventario y sin emitir comprobante.
 */

/** Estado guardado del link. Ojo: puede estar desfasado — ver `bloqueo`. */
export type PaymentLinkEstado = 'activo' | 'pausado' | 'agotado' | 'vencido' | 'anulado'

/**
 * Motivo por el que un link NO se puede cobrar ahora mismo, calculado por el
 * backend en cada respuesta. Es distinto de `estado`: entre dos corridas del
 * cron de expiración un link vencido sigue guardado como `activo`, así que para
 * mostrarle la verdad al comerciante manda este campo.
 */
export type PaymentLinkBloqueo =
  | 'vencido'
  | 'agotado'
  | 'pausado'
  | 'anulado'
  | 'aun_no_vigente'
  | 'no_disponible'
  | null

export interface PaymentLinkTotales {
  subtotal: number
  tax: number
  icbper: number
  total: number
}

export interface PaymentLinkItem {
  tipo: 'producto'
  product_id: number
  productoatributo_id: number | string | null
  sku: string
  nombre: string
  cantidad: number
  precio: number
}

export interface PaymentLinkCliente {
  nombres: string | null
  apellidos: string | null
  razon_social: string | null
  tipo_documento: string | null
  documento: string | null
  correo: string | null
  telefono: string | null
}

export interface PaymentLink {
  id: number
  codigo: string
  /** URL pública lista para compartir. La arma el backend, que sabe el dominio. */
  url: string
  tipo: 'catalogo' | 'libre' | 'mixto'
  estado: PaymentLinkEstado
  bloqueo: PaymentLinkBloqueo
  origen: 'backoffice' | 'pos' | 'api'
  moneda_id: number
  pasarela_id: number | null
  totales: PaymentLinkTotales
  requiere_envio: boolean
  /** v1 siempre false: el checkout cobra el precio del catálogo, no el del snapshot. */
  precio_bloqueado: boolean
  documento_id_facturacion: number | null
  /** null = ilimitado. Es el cupo del LINK, no inventario. */
  max_usos: number | null
  usos: number
  valido_desde: string | null
  valido_hasta: string | null
  mensaje: string | null
  created_at: string | null
  // Solo en el detalle
  items?: PaymentLinkItem[]
  cliente?: PaymentLinkCliente
  observacion?: string | null
}

/**
 * La clave del ítem es `product_id`. El API acepta también `producto_id`, pero
 * conviene mandar la canónica.
 */
export interface PaymentLinkItemPayload {
  product_id: number
  quantity: number
}

export interface CreatePaymentLinkPayload {
  items: PaymentLinkItemPayload[]
  cliente?: Partial<{
    nombres: string
    apellidos: string
    razon_social: string
    tipo_documento: string
    documento: string
    correo: string
    telefono: string
  }>
  /** `YYYY-MM-DD` se extiende hasta el final de ese día. */
  valido_hasta?: string
  /** null u omitido = ilimitado. */
  max_usos?: number | null
  pasarela_id?: number | null
  requiere_envio?: boolean
  documento_id_facturacion?: number | null
  mensaje?: string
  observacion?: string
}

export interface PaymentLinkOrder {
  tiendaventa_id: number
  created_at: string | null
}
