import { ref } from 'vue'
import { defineStore } from 'pinia'
import { webhookSubscriptionsApi } from '@/api/webhook-subscriptions.api'
import type {
  WebhookSubscription,
  WebhookDelivery,
  AvailableEvent,
  CreateWebhookPayload,
  UpdateWebhookPayload,
  DomainEvent,
  EventStats,
  DashboardData
} from '@/types/webhook-subscriptions.types'

export const useWebhookSubscriptionsStore = defineStore('webhookSubscriptions', () => {
  // State
  const subscriptions = ref<WebhookSubscription[]>([])
  const availableEvents = ref<AvailableEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Events state
  const events = ref<DomainEvent[]>([])
  const eventStats = ref<EventStats | null>(null)
  const eventsLoading = ref(false)
  const eventsMeta = ref<{ page: number; total: number; totalPages: number } | null>(null)

  // Dashboard state
  const dashboardData = ref<DashboardData | null>(null)
  const dashboardLoading = ref(false)

  // Actions - Subscriptions
  async function fetchSubscriptions() {
    loading.value = true
    error.value = null
    try {
      const response = await webhookSubscriptionsApi.getAll()
      if (response.success && response.data) {
        subscriptions.value = response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar suscripciones'
    } finally {
      loading.value = false
    }
  }

  async function fetchAvailableEvents() {
    try {
      const response = await webhookSubscriptionsApi.getAvailableEvents()
      if (response.success && response.data) {
        availableEvents.value = response.data
      }
    } catch (e: any) {
      console.error('Error loading available events:', e)
    }
  }

  async function createSubscription(data: CreateWebhookPayload): Promise<WebhookSubscription | null> {
    try {
      const response = await webhookSubscriptionsApi.create(data)
      if (response.success && response.data) {
        await fetchSubscriptions()
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Error al crear suscripción'
      return null
    }
  }

  async function updateSubscription(id: number, data: UpdateWebhookPayload): Promise<boolean> {
    try {
      const response = await webhookSubscriptionsApi.update(id, data)
      if (response.success) {
        await fetchSubscriptions()
        return true
      }
      return false
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar suscripción'
      return false
    }
  }

  async function deleteSubscription(id: number): Promise<boolean> {
    try {
      const response = await webhookSubscriptionsApi.remove(id)
      if (response.success) {
        subscriptions.value = subscriptions.value.filter(s => s.id !== id)
        return true
      }
      return false
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar suscripción'
      return false
    }
  }

  async function regenerateSecret(id: number): Promise<string | null> {
    try {
      const response = await webhookSubscriptionsApi.regenerateSecret(id)
      if (response.success && response.data) {
        await fetchSubscriptions()
        return response.data.secret
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Error al regenerar secret'
      return null
    }
  }

  async function testWebhook(id: number): Promise<{ delivered: boolean; response_code?: number; error?: string } | null> {
    try {
      const response = await webhookSubscriptionsApi.test(id)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Error al probar webhook'
      return null
    }
  }

  async function fetchDeliveries(id: number, page = 1): Promise<WebhookDelivery[]> {
    try {
      const response = await webhookSubscriptionsApi.getDeliveries(id, page)
      if (response.success && response.data) {
        return response.data
      }
      return []
    } catch (e: any) {
      console.error('Error loading deliveries:', e)
      return []
    }
  }

  // Actions - Events
  async function fetchEvents(params: { page?: number; status?: string; event_type?: string } = {}) {
    eventsLoading.value = true
    try {
      const response = await webhookSubscriptionsApi.getEvents({ limit: 20, ...params })
      if (response.success && response.data) {
        events.value = response.data
        if (response.meta) {
          eventsMeta.value = response.meta
        }
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar eventos'
    } finally {
      eventsLoading.value = false
    }
  }

  async function fetchEventStats() {
    try {
      const response = await webhookSubscriptionsApi.getEventStats()
      if (response.success && response.data) {
        eventStats.value = response.data
      }
    } catch (e: any) {
      console.error('Error loading event stats:', e)
    }
  }

  async function retryEvent(id: number): Promise<boolean> {
    try {
      const response = await webhookSubscriptionsApi.retryEvent(id)
      if (response.success) {
        await fetchEvents()
        return true
      }
      return false
    } catch (e: any) {
      error.value = e.message || 'Error al reintentar evento'
      return false
    }
  }

  // Actions - Dashboard
  async function fetchDashboard() {
    dashboardLoading.value = true
    try {
      const response = await webhookSubscriptionsApi.getDashboard()
      if (response.success && response.data) {
        dashboardData.value = response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar dashboard'
    } finally {
      dashboardLoading.value = false
    }
  }

  return {
    // State
    subscriptions,
    availableEvents,
    loading,
    error,
    events,
    eventStats,
    eventsLoading,
    eventsMeta,
    dashboardData,
    dashboardLoading,
    // Actions
    fetchSubscriptions,
    fetchAvailableEvents,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    regenerateSecret,
    testWebhook,
    fetchDeliveries,
    fetchEvents,
    fetchEventStats,
    retryEvent,
    fetchDashboard
  }
})
