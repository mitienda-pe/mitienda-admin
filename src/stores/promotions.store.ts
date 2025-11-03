import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
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
  type Promotion,
  type PromotionType,
  type PromotionProduct,
  type BonificationProduct,
  type CreatePromotionData,
  type UpdatePromotionData,
  type PaginationParams,
} from '@/api/promotions.api'

export const usePromotionsStore = defineStore('promotions', () => {
  // State
  const promotions = ref<Promotion[]>([])
  const currentPromotion = ref<Promotion | null>(null)
  const promotionTypes = ref<PromotionType[]>([])
  const promotionProducts = ref<PromotionProduct[]>([])
  const bonificationProducts = ref<BonificationProduct[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  })

  const filters = ref({
    search: '',
    estado: undefined as number | undefined,
    promocion_id: undefined as number | undefined,
    active_only: false,
  })

  // Getters
  const hasPromotions = computed(() => promotions.value.length > 0)
  const activePromotions = computed(() => promotions.value.filter((p) => p.tiendapromocion_estado === 1))
  const inactivePromotions = computed(() => promotions.value.filter((p) => p.tiendapromocion_estado === 0))

  // Actions

  /**
   * Fetch promotions with pagination and filters
   */
  async function fetchPromotions(params?: PaginationParams) {
    try {
      isLoading.value = true
      error.value = null

      const queryParams: PaginationParams = {
        page: params?.page ?? pagination.value.page,
        limit: params?.limit ?? pagination.value.limit,
        search: params?.search ?? (filters.value.search || undefined),
        estado: params?.estado ?? filters.value.estado,
        promocion_id: params?.promocion_id ?? filters.value.promocion_id,
        active_only: params?.active_only ?? filters.value.active_only,
      }

      const response = await getPromotions(queryParams)

      if (response.status === 'success') {
        promotions.value = response.data
        pagination.value = response.pagination
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar promociones'
      console.error('Error fetching promotions:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a specific promotion by ID
   */
  async function fetchPromotion(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await getPromotion(id)

      if (response.status === 'success') {
        currentPromotion.value = response.data

        // Also load related products and bonifications
        if (response.data.productos) {
          promotionProducts.value = response.data.productos as unknown as PromotionProduct[]
        }

        if (response.data.productos_bonificacion) {
          bonificationProducts.value = response.data.productos_bonificacion as unknown as BonificationProduct[]
        }
      }

      return currentPromotion.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar la promoción'
      console.error('Error fetching promotion:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new promotion
   */
  async function addPromotion(data: CreatePromotionData) {
    try {
      isLoading.value = true
      error.value = null

      const response = await createPromotion(data)

      if (response.status === 'success') {
        // Refresh the list
        await fetchPromotions()
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear la promoción'
      console.error('Error creating promotion:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update a promotion
   */
  async function modifyPromotion(id: number, data: UpdatePromotionData) {
    try {
      isLoading.value = true
      error.value = null

      const response = await updatePromotion(id, data)

      if (response.status === 'success') {
        // Update in the list
        const index = promotions.value.findIndex((p) => p.tiendapromocion_id === id)
        if (index !== -1) {
          promotions.value[index] = response.data
        }

        // Update current if it's the same
        if (currentPromotion.value?.tiendapromocion_id === id) {
          currentPromotion.value = response.data
        }

        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar la promoción'
      console.error('Error updating promotion:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a promotion
   */
  async function removePromotion(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await deletePromotion(id)

      if (response.status === 'success') {
        // Remove from the list
        promotions.value = promotions.value.filter((p) => p.tiendapromocion_id !== id)

        // Clear current if it's the same
        if (currentPromotion.value?.tiendapromocion_id === id) {
          currentPromotion.value = null
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar la promoción'
      console.error('Error deleting promotion:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch promotion types
   */
  async function fetchPromotionTypes() {
    try {
      const response = await getPromotionTypes()

      if (response.status === 'success') {
        promotionTypes.value = response.data
      }
    } catch (err: any) {
      console.error('Error fetching promotion types:', err)
      throw err
    }
  }

  /**
   * Fetch products linked to a promotion
   */
  async function fetchPromotionProducts(promotionId: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await getPromotionProducts(promotionId)

      if (response.status === 'success') {
        promotionProducts.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar productos de la promoción'
      console.error('Error fetching promotion products:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Link products to a promotion
   */
  async function linkProducts(
    promotionId: number,
    products: Array<{ producto_id: number; descuento?: number; tipodescuento?: number; cantidad?: number }>
  ) {
    try {
      isLoading.value = true
      error.value = null

      const response = await linkProductsToPromotion(promotionId, { productos: products })

      if (response.status === 'success') {
        // Refresh products list
        await fetchPromotionProducts(promotionId)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al vincular productos'
      console.error('Error linking products:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Unlink a product from a promotion
   */
  async function unlinkProduct(promotionId: number, productId: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await unlinkProductFromPromotion(promotionId, productId)

      if (response.status === 'success') {
        // Remove from local list
        promotionProducts.value = promotionProducts.value.filter((p) => p.producto_id !== productId)
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al desvincular producto'
      console.error('Error unlinking product:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch bonification products linked to a promotion
   */
  async function fetchBonificationProducts(promotionId: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await getPromotionBonifications(promotionId)

      if (response.status === 'success') {
        bonificationProducts.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar productos de bonificación'
      console.error('Error fetching bonification products:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Link bonification products to a promotion
   */
  async function linkBonifications(
    promotionId: number,
    products: Array<{ producto_id: number; atributo_id?: number }>
  ) {
    try {
      isLoading.value = true
      error.value = null

      const response = await linkBonificationsToPromotion(promotionId, { productos: products })

      if (response.status === 'success') {
        // Refresh bonification products list
        await fetchBonificationProducts(promotionId)
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al vincular productos de bonificación'
      console.error('Error linking bonifications:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update filters
   */
  function updateFilters(newFilters: Partial<typeof filters.value>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * Reset filters
   */
  function resetFilters() {
    filters.value = {
      search: '',
      estado: undefined,
      promocion_id: undefined,
      active_only: false,
    }
  }

  /**
   * Go to next page
   */
  async function nextPage() {
    if (pagination.value.page < pagination.value.pages) {
      pagination.value.page++
      await fetchPromotions()
    }
  }

  /**
   * Go to previous page
   */
  async function previousPage() {
    if (pagination.value.page > 1) {
      pagination.value.page--
      await fetchPromotions()
    }
  }

  /**
   * Clear current promotion
   */
  function clearCurrentPromotion() {
    currentPromotion.value = null
    promotionProducts.value = []
    bonificationProducts.value = []
  }

  return {
    // State
    promotions,
    currentPromotion,
    promotionTypes,
    promotionProducts,
    bonificationProducts,
    isLoading,
    error,
    pagination,
    filters,

    // Getters
    hasPromotions,
    activePromotions,
    inactivePromotions,

    // Actions
    fetchPromotions,
    fetchPromotion,
    addPromotion,
    modifyPromotion,
    removePromotion,
    fetchPromotionTypes,
    fetchPromotionProducts,
    linkProducts,
    unlinkProduct,
    fetchBonificationProducts,
    linkBonifications,
    updateFilters,
    resetFilters,
    nextPage,
    previousPage,
    clearCurrentPromotion,
  }
})
