import apiClient from './axios'
import type {
  PromotionV2,
  PromotionV2Activation,
  PromotionV2Condition,
  PromotionV2Effect,
  PromotionV2Constraint,
  PromotionV2Coupon,
  CreatePromotionV2Data,
  UpdatePromotionV2Data,
  CreateRuleData,
  CreateCouponData,
  PromotionV2PaginationParams,
} from '@/types/promotion-v2.types'

interface ApiResponse<T> {
  status: string
  message?: string
  data: T
  /** Set when the API rejected an action because the store's plan doesn't include a module. */
  blocked_by_plan?: string
}

interface PaginatedResponse<T> {
  status: string
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

/**
 * UI mode determining which API prefix to use:
 *  - 'promotion' → /api/v1/promotions-v2/* (gated to mod_promociones_v2)
 *  - 'coupon'    → /api/v1/coupons/* (gated to mod_cupones, Small+)
 *
 * Both prefixes proxy to PromotionV2Controller; the coupon prefix wraps it in
 * CouponV2Controller which forces activation_type=coupon on list/create.
 */
export type PromotionApiMode = 'promotion' | 'coupon'

function baseFor(mode: PromotionApiMode): string {
  return mode === 'coupon' ? '/coupons' : '/promotions-v2'
}

/**
 * The coupon subset uses /codes for the coupon-code resource (instead of
 * /coupons, which would collide with the parent prefix).
 */
function couponCodesPath(mode: PromotionApiMode, promotionId: number): string {
  return mode === 'coupon'
    ? `${baseFor(mode)}/${promotionId}/codes`
    : `${baseFor(mode)}/${promotionId}/coupons`
}

// =========================================================================
// PROMOTION CRUD
// =========================================================================

export async function getPromotionsV2(
  params?: PromotionV2PaginationParams,
  mode: PromotionApiMode = 'promotion'
): Promise<PaginatedResponse<PromotionV2>> {
  const response = await apiClient.get(baseFor(mode), { params })
  return response.data
}

export async function getPromotionV2(
  id: number,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2>> {
  const response = await apiClient.get(`${baseFor(mode)}/${id}`)
  return response.data
}

export async function createPromotionV2(
  data: CreatePromotionV2Data,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2>> {
  const response = await apiClient.post(baseFor(mode), data)
  return response.data
}

export async function updatePromotionV2(
  id: number,
  data: UpdatePromotionV2Data,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2>> {
  const response = await apiClient.put(`${baseFor(mode)}/${id}`, data)
  return response.data
}

export async function deletePromotionV2(
  id: number,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`${baseFor(mode)}/${id}`)
  return response.data
}

export async function updatePromotionV2Status(
  id: number,
  status: string,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<{ status: string }>> {
  const response = await apiClient.put(`${baseFor(mode)}/${id}/status`, { status })
  return response.data
}

/**
 * Simplified coupon creation — only available under the /coupons prefix.
 * Wraps `POST /coupons` which the backend resolves into promotion + activation
 * coupon + effect + coupon code in a single transaction.
 */
export interface CreateSimpleCouponPayload {
  code: string
  name?: string
  description?: string
  discount_type:
    | 'percentage_discount_cart'
    | 'fixed_discount_cart'
    | 'free_shipping'
    | 'percentage_discount_product'
    | 'percentage_discount_category'
    | 'percentage_discount_brand'
    | 'percentage_discount_shipping'
  discount_value?: number
  discount_config?: Record<string, unknown>
  starts_at: string
  ends_at?: string | null
  max_uses?: number | null
  max_uses_per_user?: number | null
  status?: string
  priority?: number
  stackable?: 0 | 1
  metadata?: Record<string, unknown>
}

export async function createSimpleCoupon(
  payload: CreateSimpleCouponPayload
): Promise<ApiResponse<PromotionV2>> {
  const response = await apiClient.post('/coupons', payload)
  return response.data
}

// =========================================================================
// ACTIVATIONS
// =========================================================================

export async function addActivation(
  promotionId: number,
  data: CreateRuleData,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Activation>> {
  const response = await apiClient.post(`${baseFor(mode)}/${promotionId}/activations`, data)
  return response.data
}

export async function updateActivation(
  promotionId: number,
  activationId: number,
  data: CreateRuleData,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Activation>> {
  const response = await apiClient.put(
    `${baseFor(mode)}/${promotionId}/activations/${activationId}`,
    data
  )
  return response.data
}

export async function deleteActivation(
  promotionId: number,
  activationId: number,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(
    `${baseFor(mode)}/${promotionId}/activations/${activationId}`
  )
  return response.data
}

// =========================================================================
// CONDITIONS
// =========================================================================

export async function addCondition(
  promotionId: number,
  data: CreateRuleData,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Condition>> {
  const response = await apiClient.post(`${baseFor(mode)}/${promotionId}/conditions`, data)
  return response.data
}

export async function updateCondition(
  promotionId: number,
  conditionId: number,
  data: CreateRuleData,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Condition>> {
  const response = await apiClient.put(
    `${baseFor(mode)}/${promotionId}/conditions/${conditionId}`,
    data
  )
  return response.data
}

export async function deleteCondition(
  promotionId: number,
  conditionId: number,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(
    `${baseFor(mode)}/${promotionId}/conditions/${conditionId}`
  )
  return response.data
}

// =========================================================================
// EFFECTS
// =========================================================================

export async function addEffect(
  promotionId: number,
  data: CreateRuleData,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Effect>> {
  const response = await apiClient.post(`${baseFor(mode)}/${promotionId}/effects`, data)
  return response.data
}

export async function updateEffect(
  promotionId: number,
  effectId: number,
  data: CreateRuleData,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Effect>> {
  const response = await apiClient.put(
    `${baseFor(mode)}/${promotionId}/effects/${effectId}`,
    data
  )
  return response.data
}

export async function deleteEffect(
  promotionId: number,
  effectId: number,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(
    `${baseFor(mode)}/${promotionId}/effects/${effectId}`
  )
  return response.data
}

// =========================================================================
// CONSTRAINTS
// =========================================================================

export async function addConstraint(
  promotionId: number,
  data: CreateRuleData,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Constraint>> {
  const response = await apiClient.post(`${baseFor(mode)}/${promotionId}/constraints`, data)
  return response.data
}

export async function updateConstraint(
  promotionId: number,
  constraintId: number,
  data: CreateRuleData,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Constraint>> {
  const response = await apiClient.put(
    `${baseFor(mode)}/${promotionId}/constraints/${constraintId}`,
    data
  )
  return response.data
}

export async function deleteConstraint(
  promotionId: number,
  constraintId: number,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(
    `${baseFor(mode)}/${promotionId}/constraints/${constraintId}`
  )
  return response.data
}

// =========================================================================
// COUPONS (los códigos de cupón asociados a una promoción)
// =========================================================================

export async function getCoupons(
  promotionId: number,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<PromotionV2Coupon[]>> {
  const response = await apiClient.get(couponCodesPath(mode, promotionId))
  return response.data
}

export async function addCoupon(
  promotionId: number,
  data: CreateCouponData | { coupons: CreateCouponData[] },
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<{ created: PromotionV2Coupon[]; errors: string[] }>> {
  const response = await apiClient.post(couponCodesPath(mode, promotionId), data)
  return response.data
}

export async function deleteCoupon(
  promotionId: number,
  couponId: number,
  mode: PromotionApiMode = 'promotion'
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`${couponCodesPath(mode, promotionId)}/${couponId}`)
  return response.data
}

export default {
  getPromotionsV2,
  getPromotionV2,
  createPromotionV2,
  updatePromotionV2,
  deletePromotionV2,
  updatePromotionV2Status,
  createSimpleCoupon,
  addActivation,
  updateActivation,
  deleteActivation,
  addCondition,
  updateCondition,
  deleteCondition,
  addEffect,
  updateEffect,
  deleteEffect,
  addConstraint,
  updateConstraint,
  deleteConstraint,
  getCoupons,
  addCoupon,
  deleteCoupon,
}
