import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'

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

export const fraudAnalysisApi = {
  /**
   * Get fraud analysis for an order
   */
  async getAnalysis(orderId: number): Promise<ApiResponse<FraudAnalysis>> {
    const response = await apiClient.get<ApiResponse<FraudAnalysis>>(
      `/fraud-analysis/${orderId}`
    )
    return response.data
  },

  /**
   * Refresh fraud analysis (bypass cache)
   */
  async refreshAnalysis(orderId: number): Promise<ApiResponse<FraudAnalysis>> {
    const response = await apiClient.post<ApiResponse<FraudAnalysis>>(
      `/fraud-analysis/${orderId}/refresh`
    )
    return response.data
  },
}
