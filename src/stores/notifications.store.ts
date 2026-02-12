import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { notificationsApi } from '@/api/notifications.api'
import type {
  NotificationsData,
  OneSignalSubscription
} from '@/types/notifications.types'

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const data = ref<NotificationsData | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Getters
  const emailNotifications = computed(() => data.value?.emails || [])
  const onesignalSubscriptions = computed(() => data.value?.onesignal || [])

  // Actions
  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  async function fetchNotifications() {
    isLoading.value = true
    error.value = null

    try {
      const result = await notificationsApi.getAll()
      if (result.success && result.data) {
        data.value = result.data
      } else {
        error.value = result.message || 'Error al cargar las notificaciones'
      }
    } catch (err) {
      error.value = 'Error de conexión al cargar las notificaciones'
      console.error('Error fetching notifications:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function addEmail(email: string) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await notificationsApi.saveEmail({ email })
      if (result.success && result.data) {
        if (data.value) {
          data.value.emails = [...data.value.emails, result.data]
        }
        successMessage.value = result.message || 'Email agregado correctamente'
        return { success: true }
      } else {
        error.value = result.message || 'Error al agregar el email'
        return { success: false }
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Error de conexión al agregar el email'
      console.error('Error adding email:', err)
      return { success: false }
    } finally {
      isSaving.value = false
    }
  }

  async function removeEmail(id: number) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await notificationsApi.deleteNotification(id)
      if (result.success) {
        if (data.value) {
          data.value.emails = data.value.emails.filter(e => e.id !== id)
        }
        successMessage.value = 'Email eliminado correctamente'
        return { success: true }
      } else {
        error.value = result.message || 'Error al eliminar el email'
        return { success: false }
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Error de conexión al eliminar el email'
      console.error('Error removing email:', err)
      return { success: false }
    } finally {
      isSaving.value = false
    }
  }

  async function subscribeOneSignal(playerId: string, browser: string) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await notificationsApi.onesignalSubscribe({
        player_id: playerId,
        browser
      })
      if (result.success && result.data) {
        const sub: OneSignalSubscription = {
          id: result.data.id,
          player_id: result.data.player_id,
          browser: result.data.browser,
          verified: true
        }
        if (data.value) {
          const exists = data.value.onesignal.some(s => s.player_id === playerId)
          if (!exists) {
            data.value.onesignal = [...data.value.onesignal, sub]
          }
        }
        successMessage.value = 'Notificaciones push activadas'
        return { success: true }
      } else {
        error.value = result.message || 'Error al activar notificaciones push'
        return { success: false }
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Error de conexión al activar push'
      console.error('Error subscribing OneSignal:', err)
      return { success: false }
    } finally {
      isSaving.value = false
    }
  }

  async function unsubscribeOneSignal(playerId: string) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await notificationsApi.onesignalUnsubscribe({
        player_id: playerId
      })
      if (result.success) {
        if (data.value) {
          data.value.onesignal = data.value.onesignal.filter(
            s => s.player_id !== playerId
          )
        }
        successMessage.value = 'Notificaciones push desactivadas'
        return { success: true }
      } else {
        error.value = result.message || 'Error al desactivar push'
        return { success: false }
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Error de conexión al desactivar push'
      console.error('Error unsubscribing OneSignal:', err)
      return { success: false }
    } finally {
      isSaving.value = false
    }
  }

  async function checkOneSignalStatus(playerId: string) {
    try {
      const result = await notificationsApi.onesignalStatus(playerId)
      if (result.success && result.data) {
        return result.data
      }
      return { subscribed: false }
    } catch (err) {
      console.error('Error checking OneSignal status:', err)
      return { subscribed: false }
    }
  }

  return {
    // State
    data,
    isLoading,
    isSaving,
    error,
    successMessage,

    // Getters
    emailNotifications,
    onesignalSubscriptions,

    // Actions
    clearMessages,
    fetchNotifications,
    addEmail,
    removeEmail,
    subscribeOneSignal,
    unsubscribeOneSignal,
    checkOneSignalStatus
  }
})
