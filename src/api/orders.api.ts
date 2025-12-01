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

// Helper para mapear el estado del pago a OrderStatus
// tiendaventa_pagado: '0' = rechazado, '1' = confirmado/pagado, '2' = pendiente
function mapPaymentToOrderStatus(pagado: string | number): OrderStatus {
  const statusStr = String(pagado)
  if (statusStr === '1') return 'paid'      // confirmado
  if (statusStr === '0') return 'cancelled' // rechazado
  return 'pending' // '2' = pendiente
}

// Helper para mapear el estado del pago a texto
function mapPaymentStatusText(pagado: string | number): string {
  const statusStr = String(pagado)
  if (statusStr === '1') return 'confirmado'
  if (statusStr === '0') return 'rechazado'
  return 'pendiente'
}

// Helper para convertir OrderStatus del frontend a código de pago del backend
function statusToPaymentCode(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    cancelled: '0',   // rechazado
    paid: '1',        // confirmado/pagado
    pending: '2',     // pendiente
    processing: '1',  // procesando = ya está pagado
    shipped: '1',     // enviado = ya está pagado
    delivered: '1'    // entregado = ya está pagado
  }
  return statusMap[status] || '2'
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
    if (filters.status && filters.status !== 'all') {
      // Convertir el status del frontend al código de pago del backend
      params.append('status', statusToPaymentCode(filters.status))
    }
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)

    // Use new paginated endpoint that returns: { error: 0, data: [...], pagination: {...} }
    const response = await apiClient.get(`/orders/paginated?${params.toString()}`)

    const rawData = response.data
    const orders = rawData.data || []

    if (orders) {
      return {
        success: true,
        data: orders.map((order: any) => {
          // La API puede devolver formato transformado O formato directo de BD
          // Detectar cuál formato es basándonos en la presencia de campos clave
          const isTransformed = 'billing_info' in order

          if (isTransformed) {
            // Formato OrderTransformer (con billing_info, shipping, etc.)
            const billingInfo = order.billing_info || {}
            const shipping = order.shipping || {}
            const discount = order.discount || {}

            return {
              id: order.id,
              order_number: order.code || '',
              customer: {
                id: 0,
                name: `${billingInfo.name || ''} ${billingInfo.last_name || ''}`.trim(),
                email: billingInfo.email || '',
                phone: billingInfo.phone_number || '',
                document_type: billingInfo.doc_type || '',
                document_number: billingInfo.doc_number || '',
                created_at: order.date_created || ''
              },
              items: order.order_items || [],
              subtotal: 0,
              discount: parseFloat(discount.discount_amount || '0'),
              shipping: parseFloat(shipping.cost || '0'),
              tax: 0,
              total: parseFloat(order.total_amount || '0'),
              status: mapPaymentToOrderStatus(order.status),
              payment_method: order.payment_method || 'No especificado',
              payment_status: mapPaymentStatusText(order.status),
              shipping_address: shipping.receiver_address?.address_line || '',
              created_at: order.date_created || '',
              updated_at: order.date_created || '',
              notes: shipping.receiver_address?.comment || undefined
            }
          } else {
            // Formato directo de BD (campos en español)
            const shipping = parseFloat(order.tiendaventa_montoenvio || '0')
            const discount = parseFloat(order.tiendaventa_cuponvalor || '0')

            return {
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
              items: [],
              subtotal: 0,
              discount,
              shipping,
              tax: 0,
              total: parseFloat(order.tiendaventa_totalpagar || '0'), // Corregido: es totalpagar
              status: mapPaymentToOrderStatus(order.tiendaventa_pagado),
              payment_method: order.tiendaventa_nombrecodigopago || 'No especificado',
              payment_status: mapPaymentStatusText(order.tiendaventa_pagado),
              shipping_address: order.tiendaventa_direccion_envio || order.tiendaventa_direccion,
              created_at: order.tiendaventa_fecha,
              updated_at: order.tiendaventa_fecha,
              notes: order.tiendaventa_mensaje || undefined
            }
          }
        }),
        meta: {
          page: rawData.pagination?.page || filters.page || 1,
          limit: rawData.pagination?.perPage || filters.limit || 20,
          total: rawData.pagination?.total || 0,
          totalPages: rawData.pagination?.totalPages || 0,
          hasMore: rawData.pagination?.hasMore || false
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
   * Usa la estructura que devuelve el OrderTransformer del backend
   */
  async getOrder(id: number): Promise<ApiResponse<Order>> {
    const response = await apiClient.get(`/orders/${id}`)

    // La API devuelve un objeto transformado con campos en inglés
    const rawData = response.data

    if (rawData) {
      // La API usa OrderTransformer - ver app/Libraries/OrderTransformer.php
      const billingInfo = rawData.billing_info || {}
      const shipping = rawData.shipping || {}
      const receiverAddress = shipping.receiver_address || {}

      const order: Order = {
        id: rawData.id,
        order_number: rawData.code || '',
        customer: {
          id: 0,
          name: `${billingInfo.name || ''} ${billingInfo.last_name || ''}`.trim(),
          email: billingInfo.email || '',
          phone: billingInfo.phone_number || '',
          document_type: billingInfo.doc_type || '',
          document_number: billingInfo.doc_number || '',
          created_at: rawData.date_created || ''
        },
        items: (rawData.order_items || []).map((item: any) => ({
          id: item.id,
          product_id: 0,
          product_name: item.tittle || '', // Nota: API usa 'tittle' (typo)
          product_sku: item.sku || '',
          quantity: item.quantity || 0,
          price: parseFloat(item.price || '0'),
          subtotal: parseFloat(item.total || '0')
        })),
        subtotal: 0, // Se calcula del total
        discount: parseFloat(rawData.discount?.discount_amount || '0'),
        shipping: parseFloat(shipping.cost || '0'),
        tax: 0,
        total: parseFloat(rawData.total_amount || '0'),
        rounding_amount: rawData.rounding_amount !== undefined && rawData.rounding_amount !== null
          ? parseFloat(rawData.rounding_amount)
          : undefined,
        total_after_rounding: rawData.total_after_rounding !== undefined && rawData.total_after_rounding !== null
          ? parseFloat(rawData.total_after_rounding)
          : undefined,
        status: mapPaymentToOrderStatus(rawData.status), // Estado basado en el pago
        payment_method: rawData.payment_method || 'unknown',
        payment_gateway: rawData.payment_gateway || 'No especificado',
        payments: rawData.payments || [], // POS sales may have multiple payments
        gateway_code: rawData.gateway_code || undefined,
        gateway_message: rawData.gateway_message || undefined,
        payment_status: mapPaymentStatusText(rawData.status), // Texto del estado de pago
        shipping_address: receiverAddress.address_line || '',
        shipping_details: {
          cost: shipping.cost || '0.00',
          address: receiverAddress.address_line || '',
          address_line2: receiverAddress.address_line2 || undefined,
          city: receiverAddress.city?.name || undefined,
          state: receiverAddress.state?.name || undefined,
          district: receiverAddress.distric?.name || undefined,
          zip_code: receiverAddress.zip_code || undefined,
          latitude: receiverAddress.latitude || undefined,
          longitude: receiverAddress.longitud || undefined,
          reference: receiverAddress.comment || undefined,
          courier: shipping.courrier?.name || undefined,
          tracking_url: shipping.url_traking || undefined
        },
        created_at: rawData.date_created || '',
        updated_at: rawData.date_created || '',
        notes: receiverAddress.comment || undefined,
        // ERP Sync fields - intentar varios nombres posibles del backend
        tiendaventa_estado_notif_erp: rawData.tiendaventa_estado_notif_erp ??
                                       rawData.erp_sync_status ??
                                       rawData.erp_status ??
                                       undefined,
        tiendaventa_mensaje_notif_erp: rawData.tiendaventa_mensaje_notif_erp ??
                                        rawData.erp_sync_message ??
                                        rawData.erp_message ??
                                        undefined,
        tiendaventa_payload_notif_erp: rawData.tiendaventa_payload_notif_erp ?? undefined,
        // Billing document info
        billing_document: billingInfo['e-billing'] ? {
          id: billingInfo['e-billing'].id || 0,
          status: billingInfo['e-billing'].status || 0,
          billing_date: billingInfo['e-billing'].billing_date || null,
          serie: billingInfo['e-billing'].serie || '',
          correlative: billingInfo['e-billing'].correlative || '',
          pdf_url: billingInfo['e-billing'].url_pdf || undefined,
          xml_url: billingInfo['e-billing'].url_xml || undefined
        } : undefined
      }

      return {
        success: true,
        data: order
      }
    }

    return {
      success: false,
      data: undefined
    }
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
  },

  /**
   * Reenviar email de factura al cliente
   */
  async resendInvoiceEmail(orderId: number): Promise<ApiResponse<{
    order_id: number
    email_sent_to: string
    document: string
  }>> {
    const response = await apiClient.post(`/orders/${orderId}/resend-invoice-email`)
    return response.data
  }
}
