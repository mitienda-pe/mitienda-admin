import apiClient from './axios'

export interface Promotion {
  tiendapromocion_id: number
  promocion_id: number
  tiendapromocion_nombre: string
  tiendapromocion_codigo?: string
  tiendapromocion_tipodescuento: number // 1=%, 2=monto
  tiendapromocion_valor: number
  tiendapromocion_ilimitado: number
  tiendapromocion_cantidad: number
  tiendapromocion_estado: number
  tiendapromocion_swopciones: number
  tiendapromocion_opciones?: any
  tiendapromocion_tipobonificacion?: number
  tiendapromocion_montobonificacion?: number
  tiendapromocion_bon_formagrupos?: number
  tiendapromocion_fechacreacion: string
  tiendapromocion_fechainicio: string
  tiendapromocion_fechacaducidad: string
  promocion_nombre?: string
  promocion_tipo?: string | number
  is_active_period?: number
  days_until_expiry?: number
  num_productos?: number
  num_productos_bonificacion?: number
  productos?: any[]
  productos_bonificacion?: any[]
}

export interface PromotionType {
  promocion_id: number
  promocion_nombre: string
  promocion_tipo: string | number
  promocion_denominacion: string
}

export interface PromotionProduct {
  productopromocion_id: number
  tiendapromocion_id: number
  producto_id: number
  producto_titulo: string
  producto_sku: string
  producto_precio: number
  producto_stock: number
  producto_stockilimitado: number
  producto_sw_preciofijo: number
  producto_publicado: number
  producto_imagen?: string
  productopromocion_descuento?: number
  productopromocion_tipodescuento?: number
  productopromocion_cantidadproducto?: number
}

export interface BonificationProduct {
  productopromobonificacion_id: number
  tiendapromocion_id: number
  producto_id: number
  productoatributo_id: number
  producto_titulo: string
  producto_sku: string
  producto_precio: number
  producto_sw_preciofijo: number
  producto_publicado: number
  producto_atributo_nombre?: string
  producto_imagen?: string
  productopromobonificacion_cantidad?: number
}

export interface CreatePromotionData {
  promocion_id: number
  tiendapromocion_nombre: string
  tiendapromocion_codigo?: string
  tiendapromocion_tipodescuento?: number
  tiendapromocion_valor?: number
  tiendapromocion_ilimitado?: number
  tiendapromocion_cantidad?: number
  tiendapromocion_fechainicio: string
  tiendapromocion_fechacaducidad: string
  tiendapromocion_estado?: number
  tiendapromocion_swopciones?: number
  tiendapromocion_opciones?: any
  tiendapromocion_tipobonificacion?: number
  tiendapromocion_montobonificacion?: number
  tiendapromocion_bon_formagrupos?: number
}

export interface UpdatePromotionData {
  tiendapromocion_nombre?: string
  tiendapromocion_codigo?: string
  tiendapromocion_tipodescuento?: number
  tiendapromocion_valor?: number
  tiendapromocion_ilimitado?: number
  tiendapromocion_cantidad?: number
  tiendapromocion_fechainicio?: string
  tiendapromocion_fechacaducidad?: string
  tiendapromocion_estado?: number
  tiendapromocion_swopciones?: number
  tiendapromocion_opciones?: any
  tiendapromocion_tipobonificacion?: number
  tiendapromocion_montobonificacion?: number
  tiendapromocion_bon_formagrupos?: number
}

export interface LinkProductsData {
  productos: Array<{
    producto_id: number
    descuento?: number
    tipodescuento?: number
    cantidad?: number
  }>
}

export interface LinkBonificationsData {
  productos: Array<{
    producto_id: number
    atributo_id?: number
  }>
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  estado?: number
  promocion_id?: number
  active_only?: boolean
}

export interface PaginatedResponse<T> {
  status: string
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface ApiResponse<T> {
  status: string
  message?: string
  data: T
}

/**
 * Get all promotions with pagination and filters
 */
export async function getPromotions(params?: PaginationParams): Promise<PaginatedResponse<Promotion>> {
  const response = await apiClient.get('/promotions', { params })
  return response.data
}

/**
 * Get a specific promotion by ID
 */
export async function getPromotion(id: number): Promise<ApiResponse<Promotion>> {
  const response = await apiClient.get(`/promotions/${id}`)
  return response.data
}

/**
 * Create a new promotion
 */
export async function createPromotion(data: CreatePromotionData): Promise<ApiResponse<Promotion>> {
  const response = await apiClient.post('/promotions', data)
  return response.data
}

/**
 * Update a promotion
 */
export async function updatePromotion(id: number, data: UpdatePromotionData): Promise<ApiResponse<Promotion>> {
  const response = await apiClient.put(`/promotions/${id}`, data)
  return response.data
}

/**
 * Delete a promotion
 */
export async function deletePromotion(id: number): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`/promotions/${id}`)
  return response.data
}

/**
 * Get promotion types
 */
export async function getPromotionTypes(): Promise<ApiResponse<PromotionType[]>> {
  const response = await apiClient.get('/promotions/types')
  return response.data
}

/**
 * Get products linked to a promotion
 */
export async function getPromotionProducts(promotionId: number): Promise<ApiResponse<PromotionProduct[]>> {
  const response = await apiClient.get(`/promotions/${promotionId}/products`)
  return response.data
}

/**
 * Link products to a promotion
 */
export async function linkProductsToPromotion(
  promotionId: number,
  data: LinkProductsData
): Promise<ApiResponse<{ linked_count: number; errors: string[] }>> {
  const response = await apiClient.post(`/promotions/${promotionId}/products`, data)
  return response.data
}

/**
 * Unlink a product from a promotion
 */
export async function unlinkProductFromPromotion(promotionId: number, productId: number): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`/promotions/${promotionId}/products/${productId}`)
  return response.data
}

/**
 * Get bonification products linked to a promotion
 */
export async function getPromotionBonifications(promotionId: number): Promise<ApiResponse<BonificationProduct[]>> {
  const response = await apiClient.get(`/promotions/${promotionId}/bonifications`)
  return response.data
}

/**
 * Link bonification products to a promotion
 */
export async function linkBonificationsToPromotion(
  promotionId: number,
  data: LinkBonificationsData
): Promise<ApiResponse<{ linked_count: number; errors: string[] }>> {
  const response = await apiClient.post(`/promotions/${promotionId}/bonifications`, data)
  return response.data
}

export default {
  getPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionTypes,
  getPromotionProducts,
  linkProductsToPromotion,
  unlinkProductFromPromotion,
  getPromotionBonifications,
  linkBonificationsToPromotion,
}
