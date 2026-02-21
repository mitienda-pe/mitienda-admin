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

const BASE = '/promotions-v2'

// =========================================================================
// PROMOTION CRUD
// =========================================================================

export async function getPromotionsV2(
  params?: PromotionV2PaginationParams
): Promise<PaginatedResponse<PromotionV2>> {
  const response = await apiClient.get(BASE, { params })
  return response.data
}

export async function getPromotionV2(id: number): Promise<ApiResponse<PromotionV2>> {
  const response = await apiClient.get(`${BASE}/${id}`)
  return response.data
}

export async function createPromotionV2(
  data: CreatePromotionV2Data
): Promise<ApiResponse<PromotionV2>> {
  const response = await apiClient.post(BASE, data)
  return response.data
}

export async function updatePromotionV2(
  id: number,
  data: UpdatePromotionV2Data
): Promise<ApiResponse<PromotionV2>> {
  const response = await apiClient.put(`${BASE}/${id}`, data)
  return response.data
}

export async function deletePromotionV2(id: number): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`${BASE}/${id}`)
  return response.data
}

export async function updatePromotionV2Status(
  id: number,
  status: string
): Promise<ApiResponse<{ status: string }>> {
  const response = await apiClient.put(`${BASE}/${id}/status`, { status })
  return response.data
}

// =========================================================================
// ACTIVATIONS
// =========================================================================

export async function addActivation(
  promotionId: number,
  data: CreateRuleData
): Promise<ApiResponse<PromotionV2Activation>> {
  const response = await apiClient.post(`${BASE}/${promotionId}/activations`, data)
  return response.data
}

export async function updateActivation(
  promotionId: number,
  activationId: number,
  data: CreateRuleData
): Promise<ApiResponse<PromotionV2Activation>> {
  const response = await apiClient.put(`${BASE}/${promotionId}/activations/${activationId}`, data)
  return response.data
}

export async function deleteActivation(
  promotionId: number,
  activationId: number
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`${BASE}/${promotionId}/activations/${activationId}`)
  return response.data
}

// =========================================================================
// CONDITIONS
// =========================================================================

export async function addCondition(
  promotionId: number,
  data: CreateRuleData
): Promise<ApiResponse<PromotionV2Condition>> {
  const response = await apiClient.post(`${BASE}/${promotionId}/conditions`, data)
  return response.data
}

export async function updateCondition(
  promotionId: number,
  conditionId: number,
  data: CreateRuleData
): Promise<ApiResponse<PromotionV2Condition>> {
  const response = await apiClient.put(`${BASE}/${promotionId}/conditions/${conditionId}`, data)
  return response.data
}

export async function deleteCondition(
  promotionId: number,
  conditionId: number
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`${BASE}/${promotionId}/conditions/${conditionId}`)
  return response.data
}

// =========================================================================
// EFFECTS
// =========================================================================

export async function addEffect(
  promotionId: number,
  data: CreateRuleData
): Promise<ApiResponse<PromotionV2Effect>> {
  const response = await apiClient.post(`${BASE}/${promotionId}/effects`, data)
  return response.data
}

export async function updateEffect(
  promotionId: number,
  effectId: number,
  data: CreateRuleData
): Promise<ApiResponse<PromotionV2Effect>> {
  const response = await apiClient.put(`${BASE}/${promotionId}/effects/${effectId}`, data)
  return response.data
}

export async function deleteEffect(
  promotionId: number,
  effectId: number
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`${BASE}/${promotionId}/effects/${effectId}`)
  return response.data
}

// =========================================================================
// CONSTRAINTS
// =========================================================================

export async function addConstraint(
  promotionId: number,
  data: CreateRuleData
): Promise<ApiResponse<PromotionV2Constraint>> {
  const response = await apiClient.post(`${BASE}/${promotionId}/constraints`, data)
  return response.data
}

export async function updateConstraint(
  promotionId: number,
  constraintId: number,
  data: CreateRuleData
): Promise<ApiResponse<PromotionV2Constraint>> {
  const response = await apiClient.put(`${BASE}/${promotionId}/constraints/${constraintId}`, data)
  return response.data
}

export async function deleteConstraint(
  promotionId: number,
  constraintId: number
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`${BASE}/${promotionId}/constraints/${constraintId}`)
  return response.data
}

// =========================================================================
// COUPONS
// =========================================================================

export async function getCoupons(
  promotionId: number
): Promise<ApiResponse<PromotionV2Coupon[]>> {
  const response = await apiClient.get(`${BASE}/${promotionId}/coupons`)
  return response.data
}

export async function addCoupon(
  promotionId: number,
  data: CreateCouponData | { coupons: CreateCouponData[] }
): Promise<ApiResponse<{ created: PromotionV2Coupon[]; errors: string[] }>> {
  const response = await apiClient.post(`${BASE}/${promotionId}/coupons`, data)
  return response.data
}

export async function deleteCoupon(
  promotionId: number,
  couponId: number
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`${BASE}/${promotionId}/coupons/${couponId}`)
  return response.data
}

export default {
  getPromotionsV2,
  getPromotionV2,
  createPromotionV2,
  updatePromotionV2,
  deletePromotionV2,
  updatePromotionV2Status,
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
