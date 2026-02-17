import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productManagementApi } from '@/api/product-management.api'
import type {
  ProductPriceItem,
  ProductStockItem,
  ProductOrderItem,
  BatchPriceUpdate,
  BatchStockUpdate,
  BatchOrderUpdate,
  ProductManagementFilters,
} from '@/types/product.types'

export const useProductManagementStore = defineStore('productManagement', () => {
  // ── Price view state ──
  const priceItems = ref<ProductPriceItem[]>([])
  const pricePagination = ref({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const priceLoading = ref(false)
  const priceError = ref<string | null>(null)
  const dirtyPriceItems = ref<Map<number, BatchPriceUpdate>>(new Map())

  // ── Stock view state ──
  const stockItems = ref<ProductStockItem[]>([])
  const stockPagination = ref({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const stockLoading = ref(false)
  const stockError = ref<string | null>(null)
  const dirtyStockItems = ref<Map<number, BatchStockUpdate>>(new Map())

  // ── Order view state ──
  const orderItems = ref<ProductOrderItem[]>([])
  const orderPagination = ref({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const orderLoading = ref(false)
  const orderError = ref<string | null>(null)
  const dirtyOrderItems = ref<Map<number, BatchOrderUpdate>>(new Map())

  // ── Computed ──
  const dirtyPriceCount = computed(() => dirtyPriceItems.value.size)
  const dirtyStockCount = computed(() => dirtyStockItems.value.size)
  const dirtyOrderCount = computed(() => dirtyOrderItems.value.size)

  // ── Price actions ──

  async function fetchPrices(filters: ProductManagementFilters = {}) {
    try {
      priceLoading.value = true
      priceError.value = null
      const response = await productManagementApi.listPrices({
        page: pricePagination.value.page,
        limit: pricePagination.value.limit,
        ...filters,
      })
      if (response.success && response.data) {
        priceItems.value = response.data
        if (response.meta) {
          pricePagination.value = {
            page: response.meta.page || 1,
            limit: response.meta.perPage || response.meta.limit || 50,
            total: response.meta.total || 0,
            totalPages: response.meta.totalPages || 0,
          }
        }
      }
    } catch (err: any) {
      priceError.value = err.response?.data?.message || 'Error al cargar precios'
    } finally {
      priceLoading.value = false
    }
  }

  function updateLocalPrice(
    productId: number,
    field: 'price' | 'price_without_tax',
    value: number
  ) {
    const item = priceItems.value.find(p => p.id === productId)
    if (!item) return

    const igvMultiplier = 1 + item.igv_percent / 100
    const isExempt = item.tax_affectation === 2 || item.tax_affectation === 3

    if (field === 'price') {
      item.price = value
      item.price_without_tax = isExempt ? value : value / igvMultiplier
    } else {
      item.price_without_tax = value
      item.price = isExempt ? value : Math.round(value * igvMultiplier * 100) / 100
    }

    const dirty = dirtyPriceItems.value.get(productId) || { id: productId }
    dirty.price = item.price
    dirty.price_without_tax = item.price_without_tax ?? undefined
    dirtyPriceItems.value.set(productId, dirty)
  }

  function updateLocalVariantPrice(
    productId: number,
    variantId: number,
    field: 'price' | 'price_without_tax',
    value: number
  ) {
    const product = priceItems.value.find(p => p.id === productId)
    if (!product) return
    const variant = product.variants.find(v => v.id === variantId)
    if (!variant) return

    if (field === 'price') {
      variant.price = value
    } else {
      variant.price_without_tax = value
    }

    const dirty = dirtyPriceItems.value.get(productId) || { id: productId }
    if (!dirty.variants) dirty.variants = []
    const dirtyVariant = dirty.variants.find(v => v.id === variantId)
    if (dirtyVariant) {
      dirtyVariant.price = variant.price
    } else {
      dirty.variants.push({ id: variantId, price: variant.price })
    }
    dirtyPriceItems.value.set(productId, dirty)
  }

  async function savePriceChanges(): Promise<boolean> {
    if (dirtyPriceItems.value.size === 0) return true
    try {
      priceLoading.value = true
      const items = Array.from(dirtyPriceItems.value.values())
      const response = await productManagementApi.batchUpdatePrices(items)
      if (response.data) {
        dirtyPriceItems.value.clear()
        return true
      }
      return false
    } catch (err: any) {
      priceError.value = err.response?.data?.message || 'Error al guardar precios'
      return false
    } finally {
      priceLoading.value = false
    }
  }

  // ── Stock actions ──

  async function fetchStock(filters: ProductManagementFilters = {}) {
    try {
      stockLoading.value = true
      stockError.value = null
      const response = await productManagementApi.listStock({
        page: stockPagination.value.page,
        limit: stockPagination.value.limit,
        ...filters,
      })
      if (response.success && response.data) {
        stockItems.value = response.data
        if (response.meta) {
          stockPagination.value = {
            page: response.meta.page || 1,
            limit: response.meta.perPage || response.meta.limit || 50,
            total: response.meta.total || 0,
            totalPages: response.meta.totalPages || 0,
          }
        }
      }
    } catch (err: any) {
      stockError.value = err.response?.data?.message || 'Error al cargar stock'
    } finally {
      stockLoading.value = false
    }
  }

  function updateLocalStock(
    productId: number,
    field: 'stock' | 'unlimited_stock',
    value: number | boolean
  ) {
    const item = stockItems.value.find(p => p.id === productId)
    if (!item) return

    if (field === 'stock') {
      item.stock = value as number
    } else {
      item.unlimited_stock = value as boolean
    }

    const dirty = dirtyStockItems.value.get(productId) || { id: productId }
    if (field === 'stock') dirty.stock = value as number
    if (field === 'unlimited_stock') dirty.unlimited_stock = value as boolean
    dirtyStockItems.value.set(productId, dirty)
  }

  function updateLocalVariantStock(
    productId: number,
    variantId: number,
    field: 'stock' | 'unlimited_stock',
    value: number | boolean
  ) {
    const product = stockItems.value.find(p => p.id === productId)
    if (!product) return
    const variant = product.variants.find(v => v.id === variantId)
    if (!variant) return

    if (field === 'stock') variant.stock = value as number
    else variant.unlimited_stock = value as boolean

    const dirty = dirtyStockItems.value.get(productId) || { id: productId }
    if (!dirty.variants) dirty.variants = []
    const dirtyVariant = dirty.variants.find(v => v.id === variantId)
    if (dirtyVariant) {
      if (field === 'stock') dirtyVariant.stock = value as number
      else dirtyVariant.unlimited_stock = value as boolean
    } else {
      dirty.variants.push({
        id: variantId,
        ...(field === 'stock' ? { stock: value as number } : { unlimited_stock: value as boolean }),
      })
    }
    dirtyStockItems.value.set(productId, dirty)
  }

  async function saveStockChanges(): Promise<boolean> {
    if (dirtyStockItems.value.size === 0) return true
    try {
      stockLoading.value = true
      const items = Array.from(dirtyStockItems.value.values())
      const response = await productManagementApi.batchUpdateStock(items)
      if (response.data) {
        dirtyStockItems.value.clear()
        return true
      }
      return false
    } catch (err: any) {
      stockError.value = err.response?.data?.message || 'Error al guardar stock'
      return false
    } finally {
      stockLoading.value = false
    }
  }

  // ── Order actions ──

  async function fetchOrder(filters: ProductManagementFilters = {}) {
    try {
      orderLoading.value = true
      orderError.value = null
      const response = await productManagementApi.listOrder({
        page: orderPagination.value.page,
        limit: orderPagination.value.limit,
        ...filters,
      })
      if (response.success && response.data) {
        orderItems.value = response.data
        if (response.meta) {
          orderPagination.value = {
            page: response.meta.page || 1,
            limit: response.meta.perPage || response.meta.limit || 50,
            total: response.meta.total || 0,
            totalPages: response.meta.totalPages || 0,
          }
        }
      }
    } catch (err: any) {
      orderError.value = err.response?.data?.message || 'Error al cargar orden'
    } finally {
      orderLoading.value = false
    }
  }

  function updateLocalOrder(productId: number, order: number) {
    const item = orderItems.value.find(p => p.id === productId)
    if (!item) return
    item.order = order
    dirtyOrderItems.value.set(productId, { id: productId, order })
  }

  function reorderItems(reorderedItems: ProductOrderItem[]) {
    orderItems.value = reorderedItems
    reorderedItems.forEach((item, index) => {
      const newOrder =
        (orderPagination.value.page - 1) * orderPagination.value.limit + index + 1
      if (item.order !== newOrder) {
        item.order = newOrder
        dirtyOrderItems.value.set(item.id, { id: item.id, order: newOrder })
      }
    })
  }

  async function saveOrderChanges(): Promise<boolean> {
    if (dirtyOrderItems.value.size === 0) return true
    try {
      orderLoading.value = true
      const items = Array.from(dirtyOrderItems.value.values())
      const response = await productManagementApi.batchUpdateOrder(items)
      if (response.data) {
        dirtyOrderItems.value.clear()
        return true
      }
      return false
    } catch (err: any) {
      orderError.value = err.response?.data?.message || 'Error al guardar orden'
      return false
    } finally {
      orderLoading.value = false
    }
  }

  // ── Reset ──

  function resetPriceDirty() {
    dirtyPriceItems.value.clear()
  }

  function resetStockDirty() {
    dirtyStockItems.value.clear()
  }

  function resetOrderDirty() {
    dirtyOrderItems.value.clear()
  }

  return {
    // Price
    priceItems,
    pricePagination,
    priceLoading,
    priceError,
    dirtyPriceCount,
    fetchPrices,
    updateLocalPrice,
    updateLocalVariantPrice,
    savePriceChanges,
    resetPriceDirty,
    // Stock
    stockItems,
    stockPagination,
    stockLoading,
    stockError,
    dirtyStockCount,
    fetchStock,
    updateLocalStock,
    updateLocalVariantStock,
    saveStockChanges,
    resetStockDirty,
    // Order
    orderItems,
    orderPagination,
    orderLoading,
    orderError,
    dirtyOrderCount,
    fetchOrder,
    updateLocalOrder,
    reorderItems,
    saveOrderChanges,
    resetOrderDirty,
  }
})
