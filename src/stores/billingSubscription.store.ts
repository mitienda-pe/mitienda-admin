import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { billingSubscriptionApi } from '@/api/billing-subscription.api'
import type {
  BillingGatewayConfig,
  BillingPaymentMethod,
  BillingSubscription
} from '@/types/billing-subscription.types'

/**
 * Suscripción del comercio a MiTienda y su medio de pago.
 *
 * El motor todavía convive con el sistema legacy: una tienda sin suscripción
 * migrada devuelve `subscription: null` y lista de tarjetas vacía, y eso no es
 * un error — es el estado normal hoy.
 */
export const useBillingSubscriptionStore = defineStore('billingSubscription', () => {
  const config = ref<BillingGatewayConfig | null>(null)
  const paymentMethods = ref<BillingPaymentMethod[]>([])
  const subscription = ref<BillingSubscription | null>(null)

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const defaultMethod = computed(
    () => paymentMethods.value.find(m => m.is_default === 1) ?? paymentMethods.value[0] ?? null
  )

  const hasPaymentMethod = computed(() => paymentMethods.value.length > 0)

  /** La plataforma aún no cargó las credenciales de la pasarela. */
  const gatewayUnavailable = computed(() => config.value !== null && !config.value.configured)

  function messageFrom(err: unknown, fallback: string): string {
    const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    return apiMessage || (err instanceof Error ? err.message : fallback)
  }

  async function load(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const [configRes, methodsRes, subRes] = await Promise.all([
        billingSubscriptionApi.getConfig(),
        billingSubscriptionApi.getPaymentMethods(),
        billingSubscriptionApi.getSubscription()
      ])

      config.value = configRes.data ?? null
      paymentMethods.value = methodsRes.data ?? []
      subscription.value = subRes.data ?? null
    } catch (err) {
      error.value = messageFrom(err, 'No se pudo cargar la información de pago')
    } finally {
      isLoading.value = false
    }
  }

  async function addCard(cardToken: string): Promise<void> {
    isSaving.value = true
    try {
      await billingSubscriptionApi.addPaymentMethod(cardToken)
      const methodsRes = await billingSubscriptionApi.getPaymentMethods()
      paymentMethods.value = methodsRes.data ?? []
    } catch (err) {
      throw new Error(messageFrom(err, 'No se pudo guardar la tarjeta'))
    } finally {
      isSaving.value = false
    }
  }

  async function removeCard(id: number): Promise<void> {
    isSaving.value = true
    try {
      await billingSubscriptionApi.removePaymentMethod(id)
      paymentMethods.value = paymentMethods.value.filter(m => m.id !== id)
    } catch (err) {
      throw new Error(messageFrom(err, 'No se pudo eliminar la tarjeta'))
    } finally {
      isSaving.value = false
    }
  }

  async function setDefaultCard(id: number): Promise<void> {
    isSaving.value = true
    try {
      await billingSubscriptionApi.setDefaultPaymentMethod(id)
      paymentMethods.value = paymentMethods.value.map(m => ({
        ...m,
        is_default: m.id === id ? 1 : 0
      }))
    } catch (err) {
      throw new Error(messageFrom(err, 'No se pudo cambiar la tarjeta principal'))
    } finally {
      isSaving.value = false
    }
  }

  return {
    config,
    paymentMethods,
    subscription,
    isLoading,
    isSaving,
    error,
    defaultMethod,
    hasPaymentMethod,
    gatewayUnavailable,
    load,
    addCard,
    removeCard,
    setDefaultCard
  }
})
