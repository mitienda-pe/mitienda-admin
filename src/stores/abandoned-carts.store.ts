import { defineStore } from 'pinia'
import { abandonedCartsApi } from '@/api/abandoned-carts.api'
import type {
  AbandonedCart,
  AbandonedCartDetail,
  AbandonedCartsFilters,
  CartStatus,
  CustomerType,
  RecoveryChannel,
  CartSortBy,
  SortOrder
} from '@/types/abandoned-cart.types'

interface AbandonedCartsState {
  carts: AbandonedCart[]
  currentCart: AbandonedCartDetail | null
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  filters: {
    from: string
    to: string
    customer_type: CustomerType
    status: CartStatus
    channel: RecoveryChannel
    search: string
    sort_by: CartSortBy
    sort_order: SortOrder
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export const useAbandonedCartsStore = defineStore('abandoned-carts', {
  state: (): AbandonedCartsState => ({
    carts: [],
    currentCart: null,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    filters: {
      from: '',
      to: '',
      customer_type: 'all',
      status: 'all',
      channel: 'all',
      search: '',
      sort_by: 'date',
      sort_order: 'desc'
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasMore: false
    }
  }),

  getters: {
    hasCarts: (state) => state.carts.length > 0,
    totalCarts: (state) => state.pagination.total,
    canLoadMore: (state) => state.pagination.hasMore && !state.isLoading && !state.isLoadingMore
  },

  actions: {
    async fetchCarts() {
      this.isLoading = true
      this.error = null
      this.pagination.page = 1

      try {
        const apiFilters: AbandonedCartsFilters = {
          ...this.filters,
          page: 1,
          per_page: this.pagination.limit
        }

        const response = await abandonedCartsApi.getCarts(apiFilters)

        if (response.success) {
          this.carts = response.data
          this.pagination = {
            page: response.meta.page ?? 1,
            limit: response.meta.limit ?? 20,
            total: response.meta.total ?? 0,
            totalPages: response.meta.totalPages ?? 0,
            hasMore: response.meta.hasMore ?? false
          }
        }
      } catch (error: any) {
        this.error = error.message || 'Error al cargar los carritos abandonados'
        console.error('Error fetching abandoned carts:', error)
      } finally {
        this.isLoading = false
      }
    },

    async loadMore() {
      if (!this.canLoadMore) return

      this.isLoadingMore = true
      this.error = null

      try {
        const nextPage = this.pagination.page + 1
        const apiFilters: AbandonedCartsFilters = {
          ...this.filters,
          page: nextPage,
          per_page: this.pagination.limit
        }

        const response = await abandonedCartsApi.getCarts(apiFilters)

        if (response.success) {
          this.carts.push(...response.data)
          this.pagination = {
            page: response.meta.page ?? 1,
            limit: response.meta.limit ?? 20,
            total: response.meta.total ?? 0,
            totalPages: response.meta.totalPages ?? 0,
            hasMore: response.meta.hasMore ?? false
          }
        }
      } catch (error: any) {
        this.error = error.message || 'Error al cargar más carritos'
        console.error('Error loading more carts:', error)
      } finally {
        this.isLoadingMore = false
      }
    },

    async fetchCart(id: number) {
      this.isLoading = true
      this.error = null
      this.currentCart = null

      try {
        const response = await abandonedCartsApi.getCart(id)

        if (response.success && response.data) {
          this.currentCart = response.data
        }
      } catch (error: any) {
        this.error = error.message || 'Error al cargar el carrito'
        console.error('Error fetching cart:', error)
      } finally {
        this.isLoading = false
      }
    },

    setFilters(filters: Partial<AbandonedCartsState['filters']>) {
      this.filters = { ...this.filters, ...filters }
      this.fetchCarts()
    },

    setSearch(search: string) {
      this.filters.search = search
      this.fetchCarts()
    },

    setDateRange(from: string, to: string) {
      this.filters.from = from
      this.filters.to = to
      this.fetchCarts()
    },

    setSorting(sortBy: CartSortBy, sortOrder: SortOrder) {
      this.filters.sort_by = sortBy
      this.filters.sort_order = sortOrder
      this.fetchCarts()
    },

    resetFilters() {
      this.filters = {
        from: '',
        to: '',
        customer_type: 'all',
        status: 'all',
        channel: 'all',
        search: '',
        sort_by: 'date',
        sort_order: 'desc'
      }
      this.fetchCarts()
    },

    async exportToExcel() {
      try {
        const blob = await abandonedCartsApi.exportToExcel(this.filters)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `carritos-abandonados-${new Date().toISOString().split('T')[0]}.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)
      } catch (error: any) {
        this.error = error.message || 'Error al exportar los carritos'
        console.error('Error exporting carts:', error)
      }
    }
  }
})
