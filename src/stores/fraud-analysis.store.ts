import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fraudAnalysisApi, type FraudAnalysis, type FraudMetric } from '@/api/fraud-analysis.api'

// Re-export types for convenience
export type { FraudAnalysis, FraudMetric }

export const useFraudAnalysisStore = defineStore('fraud-analysis', () => {
  // State
  const analysis = ref<FraudAnalysis | null>(null)
  const isLoading = ref(false)
  const lastVerifiedAt = ref<string | null>(null)

  // Getters
  const riskLevel = computed(() => {
    if (!analysis.value) return 'low'
    const score = analysis.value.overall_risk_score
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  })

  const hasHighRiskMetrics = computed(() => {
    if (!analysis.value) return false
    return analysis.value.metrics.some((m) => m.risk_level === 'high')
  })

  const highRiskMetricsCount = computed(() => {
    if (!analysis.value) return 0
    return analysis.value.metrics.filter((m) => m.risk_level === 'high').length
  })

  // Actions
  async function fetchAnalysis(orderId: number): Promise<void> {
    isLoading.value = true

    try {
      const response = await fraudAnalysisApi.getAnalysis(orderId)

      if (response.success && response.data) {
        analysis.value = response.data
      } else {
        throw new Error(response.message || 'Error al obtener análisis de fraude')
      }
    } catch (error: any) {
      console.error('Error fetching fraud analysis:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function refreshAnalysis(orderId: number): Promise<void> {
    isLoading.value = true

    try {
      const response = await fraudAnalysisApi.refreshAnalysis(orderId)

      if (response.success && response.data) {
        analysis.value = response.data
      } else {
        throw new Error(response.message || 'Error al actualizar análisis de fraude')
      }
    } catch (error: any) {
      console.error('Error refreshing fraud analysis:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  function reset(): void {
    analysis.value = null
    isLoading.value = false
    lastVerifiedAt.value = null
  }

  return {
    // State
    analysis,
    isLoading,
    lastVerifiedAt,

    // Getters
    riskLevel,
    hasHighRiskMetrics,
    highRiskMetricsCount,

    // Actions
    fetchAnalysis,
    refreshAnalysis,
    reset,
  }
})
