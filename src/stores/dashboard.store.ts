import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/api/dashboard.api'
import type { DashboardMetrics, DashboardPeriod } from '@/types/dashboard.types'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const metrics = ref<DashboardMetrics | null>(null)
  const period = ref<DashboardPeriod>('today')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
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

  return {
    // State
    metrics,
    period,
    isLoading,
    error,
    // Actions
    fetchMetrics,
    setPeriod
  }
})
