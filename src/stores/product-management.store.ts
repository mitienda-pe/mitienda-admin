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

    const igvMultiplier = 1 + (product.igv_percent || 18) / 100
    const isExempt = product.tax_affectation === 2 || product.tax_affectation === 3

    if (field === 'price') {
      variant.price = value
      variant.price_without_tax = isExempt ? value : value / igvMultiplier
    } else {
      variant.price_without_tax = value
      variant.price = isExempt ? value : Math.round(value * igvMultiplier * 100) / 100
    }

    const dirty = dirtyPriceItems.value.get(productId) || { id: productId }
    if (!dirty.variants) dirty.variants = []
    const dirtyVariant = dirty.variants.find(v => v.id === variantId)
    if (dirtyVariant) {
      dirtyVariant.price = variant.price
      dirtyVariant.price_without_tax = variant.price_without_tax
    } else {
      dirty.variants.push({ id: variantId, price: variant.price, price_without_tax: variant.price_without_tax })
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

  // Load the ENTIRE catalog in one request so drag-reorder operates over all
  // products at once (the order is global, not per-page). Without this, the
  // user could only reorder the visible page/search subset, leaving the rest
  // at order 0 — which then sort ahead and look like the order "reverted".
  async function fetchAllOrder() {
    try {
      orderLoading.value = true
      orderError.value = null
      const response = await productManagementApi.listOrder({
        page: 1,
        limit: 5000,
        sort_field: 'order',
        sort_order: 'ASC',
      })
      if (response.success && response.data) {
        orderItems.value = response.data
        dirtyOrderItems.value.clear()
        orderPagination.value = {
          page: 1,
          limit: response.data.length || 1,
          total: response.meta?.total || response.data.length,
          totalPages: 1,
        }
      }
    } catch (err: any) {
      orderError.value = err.response?.data?.message || 'Error al cargar orden'
    } finally {
      orderLoading.value = false
    }
  }

  // Renumber every item by its current array position and mark as dirty when it
  // changed. Keeps `producto_orden` contiguous (1..N) and global.
  function renumberOrder() {
    orderItems.value.forEach((item, index) => {
      const newOrder = index + 1
      if (item.order !== newOrder) {
        item.order = newOrder
        dirtyOrderItems.value.set(item.id, { id: item.id, order: newOrder })
      }
    })
  }

  function updateLocalOrder(productId: number, order: number) {
    const item = orderItems.value.find(p => p.id === productId)
    if (!item) return
    item.order = order
    dirtyOrderItems.value.set(productId, { id: productId, order })
  }

  // Move a product to an absolute 1-based position within the full list and
  // renumber everything so positions stay contiguous (used by inline edit).
  function moveToPosition(productId: number, position: number) {
    const arr = orderItems.value
    const from = arr.findIndex(p => p.id === productId)
    if (from === -1) return
    const to = Math.max(0, Math.min(arr.length - 1, position - 1))
    if (from === to) return
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    renumberOrder()
  }

  function reorderItems(reorderedItems: ProductOrderItem[]) {
    orderItems.value = reorderedItems
    renumberOrder()
  }

  async function saveOrderChanges(): Promise<boolean> {
    if (dirtyOrderItems.value.size === 0) return true
    try {
      orderLoading.value = true
      // Commit the ENTIRE current order (contiguous 1..N), not just the dirty
      // items. This wipes stale duplicates / zeros from older per-page saves.
      const allItems = orderItems.value.map((item, index) => ({
        id: item.id,
        order: index + 1,
      }))
      // Backend caps each batch at 100 items.
      const CHUNK = 100
      for (let i = 0; i < allItems.length; i += CHUNK) {
        await productManagementApi.batchUpdateOrder(allItems.slice(i, i + CHUNK))
      }
      orderItems.value.forEach((item, index) => {
        item.order = index + 1
      })
      dirtyOrderItems.value.clear()
      return true
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
    fetchAllOrder,
    updateLocalOrder,
    moveToPosition,
    reorderItems,
    saveOrderChanges,
    resetOrderDirty,
  }
})
