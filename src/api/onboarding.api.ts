import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { OnboardingEventKey, OnboardingProgress } from '@/types/onboarding.types'

export const onboardingApi = {
  /** Progreso calculado desde los datos reales de la tienda del token. */
  async getProgress(): Promise<ApiResponse<OnboardingProgress>> {
    const response = await apiClient.get('/onboarding/progress')
    return response.data
  },

  /** Registra un evento que no se puede deducir de los datos (idempotente). */
  async recordEvent(event: OnboardingEventKey): Promise<ApiResponse<{ event: string }>> {
    const response = await apiClient.post('/onboarding/events', { event })
    return response.data
  }
}
