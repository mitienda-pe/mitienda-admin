import axios from './axios'
import type {
  ReferralCode,
  ReferralCodeCreateRequest,
  ReferralCodeUpdateRequest,
  ReferralCodeListResponse,
  ReferralCodeResponse,
  GenerateCodeResponse
} from '@/types/referral.types'

interface ListParams {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_order?: 'ASC' | 'DESC'
}

export const referralApi = {
  /**
   * Get all referral codes for the store
   */
  async getAll(params: ListParams = {}): Promise<ReferralCodeListResponse> {
    const response = await axios.get('/referral-codes', { params })
    return response.data
  },

  /**
   * Get a single referral code by ID
   */
  async getById(id: number): Promise<ReferralCode> {
    const response = await axios.get<ReferralCodeResponse>(`/referral-codes/${id}`)
    return response.data.data
  },

  /**
   * Create a new referral code
   */
  async create(data: ReferralCodeCreateRequest): Promise<ReferralCode> {
    const response = await axios.post<ReferralCodeResponse>('/referral-codes', data)
    return response.data.data
  },

  /**
   * Update a referral code
   */
  async update(id: number, data: ReferralCodeUpdateRequest): Promise<ReferralCode> {
    const response = await axios.put<ReferralCodeResponse>(`/referral-codes/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a referral code (soft delete)
   */
  async delete(id: number): Promise<void> {
    await axios.delete(`/referral-codes/${id}`)
  },

  /**
   * Generate a unique referral code
   */
  async generateCode(length: number = 10): Promise<string> {
    const response = await axios.get<GenerateCodeResponse>('/referral-codes/generate', {
      params: { length }
    })
    return response.data.data.code
  },

  /**
   * Toggle active status
   */
  async toggle(id: number): Promise<ReferralCode> {
    const response = await axios.patch<ReferralCodeResponse>(`/referral-codes/${id}/toggle`)
    return response.data.data
  }
}
