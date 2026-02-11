import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { badgeCountsApi, type BadgeCounts } from '@/api/badge-counts.api'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes

export const useBadgeCountsStore = defineStore('badge-counts', () => {
  // State
  const counts = ref<BadgeCounts>({
    orders: 0,
    reviews: 0,
    complaints: 0,
    abandoned_carts: 0
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let pollTimer: ReturnType<typeof setInterval> | null = null

  // Getters
  const ordersCount = computed(() => counts.value.orders)
  const reviewsCount = computed(() => counts.value.reviews)
  const complaintsCount = computed(() => counts.value.complaints)
  const abandonedCartsCount = computed(() => counts.value.abandoned_carts)
  const totalSalesCount = computed(
    () =>
      counts.value.orders +
      counts.value.reviews +
      counts.value.complaints +
      counts.value.abandoned_carts
  )

  // Actions
  async function fetchCounts() {
    try {
      isLoading.value = true
      error.value = null
      const response = await badgeCountsApi.getCounts()
      if (response.success && response.data) {
        counts.value = response.data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar contadores'
      console.error('Error fetching badge counts:', err)
    } finally {
      isLoading.value = false
    }
  }

  function startPolling() {
    fetchCounts()
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(fetchCounts, POLL_INTERVAL)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function resetCounts() {
    counts.value = {
      orders: 0,
      reviews: 0,
      complaints: 0,
      abandoned_carts: 0
    }
    stopPolling()
  }

  return {
    counts,
    isLoading,
    error,
    ordersCount,
    reviewsCount,
    complaintsCount,
    abandonedCartsCount,
    totalSalesCount,
    fetchCounts,
    startPolling,
    stopPolling,
    resetCounts
  }
})
