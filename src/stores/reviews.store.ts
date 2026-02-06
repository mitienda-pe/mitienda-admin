import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { reviewsApi } from '@/api/reviews.api'
import type { Review, ReviewFilters, ReviewStats } from '@/types/review.types'

export const useReviewsStore = defineStore('reviews', () => {
  // State
  const reviews = ref<Review[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<ReviewStats | null>(null)
  const selectedIds = ref<number[]>([])

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })

  const sorting = ref({
    field: 'created_at',
    order: 'desc' as 'asc' | 'desc',
  })

  const filters = ref<ReviewFilters>({
    search: '',
    status: 'pending',
    rating: null,
    product_id: null,
  })

  // Getters
  const hasReviews = computed(() => reviews.value.length > 0)
  const pendingCount = computed(() => stats.value?.pending ?? 0)
  const hasSelection = computed(() => selectedIds.value.length > 0)
  const selectionCount = computed(() => selectedIds.value.length)

  // Actions
  async function fetchReviews() {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      const response = await reviewsApi.getReviews({
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: filters.value.search || undefined,
        status: filters.value.status || undefined,
        rating: filters.value.rating || undefined,
        product_id: filters.value.product_id || undefined,
        sort: sorting.value.field,
        order: sorting.value.order,
      })

      if (response.success && response.data) {
        reviews.value = response.data
        pagination.value.total = response.meta?.total || 0
        pagination.value.totalPages = response.meta?.totalPages || 1
        pagination.value.hasMore = response.meta?.hasMore || false
      } else {
        throw new Error('Error al cargar opiniones')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching reviews:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStats() {
    try {
      const response = await reviewsApi.getStats()
      if (response.success && response.data) {
        stats.value = response.data
      }
    } catch (err) {
      console.error('Error fetching review stats:', err)
    }
  }

  async function moderate(id: number, status: 'approved' | 'rejected') {
    try {
      const response = await reviewsApi.moderate(id, status)
      if (response.success) {
        // Update local state
        const review = reviews.value.find((r) => r.id === id)
        if (review) {
          review.status = status
          review.moderated_at = new Date().toISOString()
        }
        await fetchStats()
        return true
      }
    } catch (err) {
      console.error('Error moderating review:', err)
      throw err
    }
    return false
  }

  async function bulkModerate(status: 'approved' | 'rejected') {
    if (selectedIds.value.length === 0) return

    try {
      const response = await reviewsApi.bulkModerate(selectedIds.value, status)
      if (response.success) {
        selectedIds.value = []
        await Promise.all([fetchReviews(), fetchStats()])
        return true
      }
    } catch (err) {
      console.error('Error bulk moderating reviews:', err)
      throw err
    }
    return false
  }

  async function deleteReview(id: number) {
    try {
      const response = await reviewsApi.deleteReview(id)
      if (response.success) {
        reviews.value = reviews.value.filter((r) => r.id !== id)
        pagination.value.total--
        await fetchStats()
        return true
      }
    } catch (err) {
      console.error('Error deleting review:', err)
      throw err
    }
    return false
  }

  function setPage(page: number) {
    pagination.value.page = page
    fetchReviews()
  }

  function setSort(field: string, order: 'asc' | 'desc') {
    sorting.value.field = field
    sorting.value.order = order
    pagination.value.page = 1
    fetchReviews()
  }

  function setStatusFilter(status: ReviewFilters['status']) {
    filters.value.status = status
    pagination.value.page = 1
    fetchReviews()
  }

  function setSearch(query: string) {
    filters.value.search = query
    pagination.value.page = 1
    fetchReviews()
  }

  function setRatingFilter(rating: number | null) {
    filters.value.rating = rating
    pagination.value.page = 1
    fetchReviews()
  }

  function setProductFilter(productId: number | null) {
    filters.value.product_id = productId
    pagination.value.page = 1
    fetchReviews()
  }

  function resetFilters() {
    filters.value = {
      search: '',
      status: 'pending',
      rating: null,
      product_id: null,
    }
    pagination.value.page = 1
    fetchReviews()
  }

  function toggleSelection(id: number) {
    const idx = selectedIds.value.indexOf(id)
    if (idx === -1) {
      selectedIds.value.push(id)
    } else {
      selectedIds.value.splice(idx, 1)
    }
  }

  function selectAll() {
    selectedIds.value = reviews.value.map((r) => r.id)
  }

  function clearSelection() {
    selectedIds.value = []
  }

  return {
    // State
    reviews,
    isLoading,
    error,
    stats,
    pagination,
    sorting,
    filters,
    selectedIds,

    // Getters
    hasReviews,
    pendingCount,
    hasSelection,
    selectionCount,

    // Actions
    fetchReviews,
    fetchStats,
    moderate,
    bulkModerate,
    deleteReview,
    setPage,
    setSort,
    setStatusFilter,
    setSearch,
    setRatingFilter,
    setProductFilter,
    resetFilters,
    toggleSelection,
    selectAll,
    clearSelection,
  }
})
