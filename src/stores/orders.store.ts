import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ordersApi, type OrdersFilters, type OrderStats } from '@/api/orders.api'
import type { Order, OrderStatus } from '@/types/order.types'

export interface OrderFilters {
  search: string
  status: OrderStatus | 'all'
  dateFrom: string | null
  dateTo: string | null
}

export const useOrdersStore = defineStore('orders', () => {
  // State
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<OrderStats | null>(null)

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  })

  const filters = ref<OrderFilters>({
    search: '',
    status: 'all',
    dateFrom: null,
    dateTo: null
  })

  // Getters
  const hasOrders = computed(() => orders.value.length > 0)

  const ordersCount = computed(() => orders.value.length)

  const filteredOrders = computed(() => {
    let filtered = orders.value

    // El filtrado real se hace en el backend, pero podemos tener filtros locales adicionales
    return filtered
  })

  // Actions
  async function fetchOrders(loadMore: boolean = false) {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      const apiFilters: OrdersFilters = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: filters.value.search || undefined,
        status: filters.value.status !== 'all' ? filters.value.status : undefined,
        date_from: filters.value.dateFrom || undefined,
        date_to: filters.value.dateTo || undefined
      }

      const response = await ordersApi.getOrders(apiFilters)

      console.log('🔍 Orders Store - Response success:', response.success)
      console.log('🔍 Orders Store - Response meta:', response.meta)
      console.log('🔍 Orders Store - Data count:', response.data?.length)

      if (response.success && response.data) {
        if (loadMore) {
          // Agregar a la lista existente (scroll infinito)
          orders.value = [...orders.value, ...response.data]
          console.log('🔍 Orders Store - Load more, total orders now:', orders.value.length)
        } else {
          // Reemplazar la lista (nueva búsqueda/filtros)
          orders.value = response.data
          console.log('🔍 Orders Store - Fresh load, orders:', orders.value.length)
        }

        // Actualizar paginación
        pagination.value.total = response.meta?.total || 0
        pagination.value.hasMore = response.meta?.hasMore || false
        console.log('🔍 Orders Store - Pagination updated:', {
          page: pagination.value.page,
          total: pagination.value.total,
          hasMore: pagination.value.hasMore
        })
      } else {
        throw new Error('Error al cargar pedidos')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching orders:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOrder(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await ordersApi.getOrder(id)

      if (response.success && response.data) {
        currentOrder.value = response.data
      } else {
        throw new Error(response.message || 'Error al cargar pedido')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching order:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStats() {
    try {
      const response = await ordersApi.getStats()

      if (response.success && response.data) {
        stats.value = response.data
      }
    } catch (err) {
      console.error('Error fetching order stats:', err)
    }
  }

  async function updateOrderStatus(id: number, status: OrderStatus) {
    try {
      isLoading.value = true
      error.value = null

      const response = await ordersApi.updateOrderStatus(id, status)

      if (response.success && response.data) {
        // Actualizar en la lista
        const index = orders.value.findIndex((o) => o.id === id)
        if (index !== -1) {
          orders.value[index] = response.data
        }

        // Actualizar pedido actual si es el mismo
        if (currentOrder.value?.id === id) {
          currentOrder.value = response.data
        }

        return response.data
      } else {
        throw new Error(response.message || 'Error al actualizar estado')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error updating order status:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function setFilters(newFilters: Partial<OrderFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
    fetchOrders()
  }

  function setSearch(query: string) {
    filters.value.search = query
    pagination.value.page = 1
    fetchOrders()
  }

  function setStatus(status: OrderStatus | 'all') {
    filters.value.status = status
    pagination.value.page = 1
    fetchOrders()
  }

  function setDateRange(dateFrom: string | null, dateTo: string | null) {
    filters.value.dateFrom = dateFrom
    filters.value.dateTo = dateTo
    pagination.value.page = 1
    fetchOrders()
  }

  function resetFilters() {
    filters.value = {
      search: '',
      status: 'all',
      dateFrom: null,
      dateTo: null
    }
    pagination.value.page = 1
    fetchOrders()
  }

  function loadMore() {
    console.log('🔍 Orders Store - loadMore called:', {
      hasMore: pagination.value.hasMore,
      isLoading: isLoading.value,
      currentPage: pagination.value.page
    })
    if (pagination.value.hasMore && !isLoading.value) {
      pagination.value.page++
      console.log('🔍 Orders Store - Loading page:', pagination.value.page)
      fetchOrders(true)
    } else {
      console.log('🔍 Orders Store - NOT loading more (no more pages or already loading)')
    }
  }

  function clearCurrentOrder() {
    currentOrder.value = null
  }

  async function resendInvoiceEmail(orderId: number) {
    try {
      const response = await ordersApi.resendInvoiceEmail(orderId)

      if (!response.success) {
        throw new Error(response.message || 'Error al enviar el email')
      }

      return response.data
    } catch (err) {
      console.error('Error resending invoice email:', err)
      throw err
    }
  }

  return {
    // State
    orders,
    currentOrder,
    isLoading,
    error,
    pagination,
    filters,
    stats,

    // Getters
    hasOrders,
    ordersCount,
    filteredOrders,

    // Actions
    fetchOrders,
    fetchOrder,
    fetchStats,
    updateOrderStatus,
    setFilters,
    setSearch,
    setStatus,
    setDateRange,
    resetFilters,
    loadMore,
    clearCurrentOrder,
    resendInvoiceEmail
  }
})
