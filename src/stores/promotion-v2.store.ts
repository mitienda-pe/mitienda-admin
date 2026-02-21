import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
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
} from '@/api/promotion-v2.api'
import type {
  PromotionV2,
  PromotionV2Status,
  CreatePromotionV2Data,
  UpdatePromotionV2Data,
  CreateRuleData,
  CreateCouponData,
  PromotionV2PaginationParams,
} from '@/types/promotion-v2.types'

export const usePromotionV2Store = defineStore('promotion-v2', () => {
  // State
  const promotions = ref<PromotionV2[]>([])
  const currentPromotion = ref<PromotionV2 | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  })

  const filters = ref<PromotionV2PaginationParams>({
    search: '',
    status: undefined,
    active_only: false,
  })

  // Getters
  const hasPromotions = computed(() => promotions.value.length > 0)

  // =========================================================================
  // PROMOTION CRUD
  // =========================================================================

  async function fetchPromotions(params?: PromotionV2PaginationParams) {
    try {
      isLoading.value = true
      error.value = null

      const queryParams: PromotionV2PaginationParams = {
        page: params?.page ?? pagination.value.page,
        limit: params?.limit ?? pagination.value.limit,
        search: params?.search ?? (filters.value.search || undefined),
        status: params?.status ?? filters.value.status,
        active_only: params?.active_only ?? filters.value.active_only,
      }

      const response = await getPromotionsV2(queryParams)

      if (response.status === 'success') {
        promotions.value = response.data
        pagination.value = response.pagination
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar promociones'
      console.error('Error fetching promotions v2:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPromotion(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await getPromotionV2(id)

      if (response.status === 'success') {
        currentPromotion.value = response.data
      }

      return currentPromotion.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar la promoción'
      console.error('Error fetching promotion v2:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function addPromotion(data: CreatePromotionV2Data) {
    try {
      isLoading.value = true
      error.value = null

      const response = await createPromotionV2(data)

      if (response.status === 'success') {
        await fetchPromotions()
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear la promoción'
      console.error('Error creating promotion v2:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function modifyPromotion(id: number, data: UpdatePromotionV2Data) {
    try {
      isLoading.value = true
      error.value = null

      const response = await updatePromotionV2(id, data)

      if (response.status === 'success') {
        if (currentPromotion.value?.promotions_v2_id === id) {
          await fetchPromotion(id)
        }
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar la promoción'
      console.error('Error updating promotion v2:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removePromotion(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await deletePromotionV2(id)

      if (response.status === 'success') {
        promotions.value = promotions.value.filter(p => p.promotions_v2_id !== id)
        if (currentPromotion.value?.promotions_v2_id === id) {
          currentPromotion.value = null
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar la promoción'
      console.error('Error deleting promotion v2:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function changeStatus(id: number, status: PromotionV2Status) {
    try {
      error.value = null

      const response = await updatePromotionV2Status(id, status)

      if (response.status === 'success') {
        // Update in list
        const idx = promotions.value.findIndex(p => p.promotions_v2_id === id)
        if (idx !== -1) {
          promotions.value[idx].status = status
        }
        // Update current
        if (currentPromotion.value?.promotions_v2_id === id) {
          currentPromotion.value.status = status
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cambiar el estado'
      console.error('Error updating status:', err)
      throw err
    }
  }

  // =========================================================================
  // SUB-RESOURCE CRUD (activations, conditions, effects, constraints)
  // =========================================================================

  async function addRule(
    promotionId: number,
    ruleType: 'activations' | 'conditions' | 'effects' | 'constraints',
    data: CreateRuleData
  ) {
    try {
      error.value = null

      const fns = {
        activations: addActivation,
        conditions: addCondition,
        effects: addEffect,
        constraints: addConstraint,
      }

      const response = await fns[ruleType](promotionId, data)

      if (response.status === 'success') {
        await fetchPromotion(promotionId)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al agregar regla'
      throw err
    }
  }

  async function editRule(
    promotionId: number,
    ruleType: 'activations' | 'conditions' | 'effects' | 'constraints',
    ruleId: number,
    data: CreateRuleData
  ) {
    try {
      error.value = null

      const fns = {
        activations: updateActivation,
        conditions: updateCondition,
        effects: updateEffect,
        constraints: updateConstraint,
      }

      const response = await fns[ruleType](promotionId, ruleId, data)

      if (response.status === 'success') {
        await fetchPromotion(promotionId)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar regla'
      throw err
    }
  }

  async function removeRule(
    promotionId: number,
    ruleType: 'activations' | 'conditions' | 'effects' | 'constraints',
    ruleId: number
  ) {
    try {
      error.value = null

      const fns = {
        activations: deleteActivation,
        conditions: deleteCondition,
        effects: deleteEffect,
        constraints: deleteConstraint,
      }

      const response = await fns[ruleType](promotionId, ruleId)

      if (response.status === 'success') {
        await fetchPromotion(promotionId)
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar regla'
      throw err
    }
  }

  // =========================================================================
  // COUPONS
  // =========================================================================

  async function fetchCoupons(promotionId: number) {
    try {
      error.value = null
      const response = await getCoupons(promotionId)

      if (response.status === 'success' && currentPromotion.value) {
        currentPromotion.value.coupons = response.data
      }

      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar cupones'
      throw err
    }
  }

  async function createCoupon(promotionId: number, data: CreateCouponData) {
    try {
      error.value = null
      const response = await addCoupon(promotionId, data)

      if (response.status === 'success') {
        await fetchCoupons(promotionId)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear cupón'
      throw err
    }
  }

  async function removeCoupon(promotionId: number, couponId: number) {
    try {
      error.value = null
      const response = await deleteCoupon(promotionId, couponId)

      if (response.status === 'success') {
        await fetchCoupons(promotionId)
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar cupón'
      throw err
    }
  }

  // =========================================================================
  // FILTERS & PAGINATION
  // =========================================================================

  function updateFilters(newFilters: Partial<PromotionV2PaginationParams>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      search: '',
      status: undefined,
      active_only: false,
    }
  }

  async function nextPage() {
    if (pagination.value.page < pagination.value.pages) {
      pagination.value.page++
      await fetchPromotions()
    }
  }

  async function previousPage() {
    if (pagination.value.page > 1) {
      pagination.value.page--
      await fetchPromotions()
    }
  }

  function clearCurrentPromotion() {
    currentPromotion.value = null
  }

  return {
    // State
    promotions,
    currentPromotion,
    isLoading,
    error,
    pagination,
    filters,

    // Getters
    hasPromotions,

    // Promotion CRUD
    fetchPromotions,
    fetchPromotion,
    addPromotion,
    modifyPromotion,
    removePromotion,
    changeStatus,

    // Sub-resource CRUD
    addRule,
    editRule,
    removeRule,

    // Coupons
    fetchCoupons,
    createCoupon,
    removeCoupon,

    // Filters & Pagination
    updateFilters,
    resetFilters,
    nextPage,
    previousPage,
    clearCurrentPromotion,
  }
})
