import apiClient from './axios'
import type { Benefit, BenefitClickAction, BenefitClickSource } from '@/types/benefit.types'

export const benefitsApi = {
  list: async (): Promise<Benefit[]> => {
    const res = await apiClient.get<{ success: boolean; data: Benefit[] }>('/benefits')
    return res.data.data || []
  },

  click: async (id: number, slot: BenefitClickSource, action: BenefitClickAction): Promise<void> => {
    await apiClient.post(`/benefits/${id}/click`, { slot, action })
  }
}
