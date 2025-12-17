import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface FraudMetric {
  metric: string
  risk_level: 'low' | 'medium' | 'high'
  suspicious_count: number
  total_compared: number
  description: string
}

export interface FraudAnalysis {
  order_id: number
  overall_risk_score: number
  is_confirmed_fraud: boolean
  confirmed_fraud_details: {
    fraud_type: string | null
    verified_at: string | null
    gateway_fraud_score: number | null
  } | null
  metrics: FraudMetric[]
  analyzed_at: string
  cached: boolean
}

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
      const response = await api.get(`/api/v1/fraud-analysis/${orderId}`)

      if (response.data.success) {
        analysis.value = response.data.data
      } else {
        throw new Error(response.data.message || 'Error al obtener análisis de fraude')
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
      const response = await api.post(`/api/v1/fraud-analysis/${orderId}/refresh`)

      if (response.data.success) {
        analysis.value = response.data.data
      } else {
        throw new Error(response.data.message || 'Error al actualizar análisis de fraude')
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
