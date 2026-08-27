import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  BillingGatewayConfig,
  BillingPaymentMethod,
  BillingSubscription
} from '@/types/billing-subscription.types'

/**
 * Suscripción del comercio y su medio de pago (motor billing_*).
 */
export const billingSubscriptionApi = {
  async getConfig(): Promise<ApiResponse<BillingGatewayConfig>> {
    const response = await apiClient.get('/billing/config')
    return response.data
  },

  async getSubscription(): Promise<ApiResponse<BillingSubscription | null>> {
    const response = await apiClient.get('/billing/subscription')
    return response.data
  },

  async getPaymentMethods(): Promise<ApiResponse<BillingPaymentMethod[]>> {
    const response = await apiClient.get('/billing/payment-methods')
    return response.data
  },

  /** El token lo genera el SDK de MercadoPago en el navegador del titular. */
  async addPaymentMethod(cardToken: string): Promise<ApiResponse<BillingPaymentMethod>> {
    const response = await apiClient.post('/billing/payment-methods', { card_token: cardToken })
    return response.data
  },

  async removePaymentMethod(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete(`/billing/payment-methods/${id}`)
    return response.data
  },

  async setDefaultPaymentMethod(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.put(`/billing/payment-methods/${id}/default`)
    return response.data
  }
}
