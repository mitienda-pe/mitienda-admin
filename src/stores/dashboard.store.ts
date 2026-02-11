import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardApi } from '@/api/dashboard.api'
import type {
  DashboardMetrics,
  DashboardPeriod,
  DashboardAnalytics,
  DashboardFilters
} from '@/types/dashboard.types'

export const useDashboardStore = defineStore('dashboard', () => {
  // ── Legacy state ──
  const metrics = ref<DashboardMetrics | null>(null)
  const period = ref<DashboardPeriod>('today')

  // ── Analytics state ──
  const analytics = ref<DashboardAnalytics | null>(null)
  const filters = ref<DashboardFilters>(getDefaultFilters())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function getDefaultFilters(): DashboardFilters {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 29)
    return {
      dateFrom: formatDate(thirtyDaysAgo),
      dateTo: formatDate(now),
      compare: true
    }
  }

  function formatDate(d: Date): string {
    return d.toISOString().split('T')[0]
  }

  // ── Legacy actions ──
  async function fetchMetrics(newPeriod?: DashboardPeriod) {
    try {
      isLoading.value = true
      error.value = null

      if (newPeriod) {
        period.value = newPeriod
      }

      const response = await dashboardApi.getMetrics(period.value)

      if (response.success && response.data) {
        metrics.value = response.data
      } else {
        error.value = response.message || 'Error al cargar métricas'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar métricas:', err)
    } finally {
      isLoading.value = false
    }
  }

  function setPeriod(newPeriod: DashboardPeriod) {
    period.value = newPeriod
    fetchMetrics()
  }

  // ── Analytics actions ──
  async function fetchAnalytics() {
    try {
      isLoading.value = true
      error.value = null

      const response = await dashboardApi.getAnalytics(filters.value)

      if (response.success && response.data) {
        analytics.value = response.data
      } else {
        error.value = 'Error al cargar analíticas del dashboard'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar analíticas:', err)
    } finally {
      isLoading.value = false
    }
  }

  function setDateRange(dateFrom: string, dateTo: string) {
    filters.value.dateFrom = dateFrom
    filters.value.dateTo = dateTo
    fetchAnalytics()
  }

  function toggleCompare() {
    filters.value.compare = !filters.value.compare
    fetchAnalytics()
  }

  function setFilters(newFilters: Partial<DashboardFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    fetchAnalytics()
  }

  // ── Computed helpers ──
  const scorecards = computed(() => analytics.value?.scorecards ?? null)
  const trends = computed(() => analytics.value?.trends ?? null)
  const distributions = computed(() => analytics.value?.distributions ?? null)
  const topProducts = computed(() => analytics.value?.top_products ?? [])
  const topCustomers = computed(() => analytics.value?.top_customers ?? [])
  const hasData = computed(() => analytics.value !== null)

  return {
    // Legacy
    metrics,
    period,
    fetchMetrics,
    setPeriod,
    // Analytics
    analytics,
    filters,
    isLoading,
    error,
    fetchAnalytics,
    setDateRange,
    toggleCompare,
    setFilters,
    // Computed
    scorecards,
    trends,
    distributions,
    topProducts,
    topCustomers,
    hasData
  }
})
