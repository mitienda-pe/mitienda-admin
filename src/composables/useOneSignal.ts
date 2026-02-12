import { ref } from 'vue'
import { notificationsApi } from '@/api/notifications.api'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string

// Singleton state (shared across all components using this composable)
const isInitialized = ref(false)
const isSubscribed = ref(false)
const pushSupported = ref(true)
const pushPermission = ref<NotificationPermission>('default')
const currentPlayerId = ref<string | null>(null)
const subscribing = ref(false)

let initPromise: Promise<void> | null = null

function detectBrowser(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  return 'Otro'
}

function loadSdk(): void {
  if (window.OneSignalDeferred) return
  window.OneSignalDeferred = []
  const script = document.createElement('script')
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
  script.defer = true
  document.head.appendChild(script)
}

async function initOneSignal(options?: { autoPrompt?: boolean }): Promise<void> {
  // Return existing promise if already initializing/initialized
  if (initPromise) return initPromise

  initPromise = doInit(options)
  return initPromise
}

async function doInit(options?: { autoPrompt?: boolean }): Promise<void> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    pushSupported.value = false
    return
  }

  if (!ONESIGNAL_APP_ID) {
    pushSupported.value = false
    return
  }

  pushPermission.value = Notification.permission

  loadSdk()

  window.OneSignalDeferred!.push(async (OneSignal: any) => {
    await OneSignal.init({ appId: ONESIGNAL_APP_ID })
    isInitialized.value = true

    // Check current subscription
    const subscription = OneSignal.User?.PushSubscription
    if (subscription?.id) {
      currentPlayerId.value = subscription.id
      try {
        const res = await notificationsApi.onesignalStatus(subscription.id)
        if (res.success && res.data) {
          isSubscribed.value = res.data.subscribed
        }
      } catch {
        // Silently fail — non-critical
      }
    }

    pushPermission.value = Notification.permission

    // Auto-prompt if permission hasn't been asked yet
    if (options?.autoPrompt && Notification.permission === 'default') {
      setTimeout(() => {
        promptSubscribe()
      }, 3000)
    }
  })
}

async function promptSubscribe(): Promise<void> {
  if (subscribing.value) return
  subscribing.value = true

  try {
    window.OneSignalDeferred?.push(async (OneSignal: any) => {
      try {
        await OneSignal.Slidedown.promptPush()

        // Wait for subscription to register
        await new Promise(resolve => setTimeout(resolve, 1000))

        const playerId = OneSignal.User?.PushSubscription?.id
        if (playerId) {
          const browser = detectBrowser()
          await notificationsApi.onesignalSubscribe({ player_id: playerId, browser })
          currentPlayerId.value = playerId
          isSubscribed.value = true
        }
      } catch (err) {
        console.error('OneSignal subscribe error:', err)
      } finally {
        subscribing.value = false
        pushPermission.value = Notification.permission
      }
    })
  } catch {
    subscribing.value = false
  }
}

async function unsubscribe(): Promise<void> {
  if (!currentPlayerId.value) return

  try {
    const res = await notificationsApi.onesignalUnsubscribe({
      player_id: currentPlayerId.value
    })
    if (res.success) {
      isSubscribed.value = false
    }
  } catch (err) {
    console.error('OneSignal unsubscribe error:', err)
  }
}

export function useOneSignal() {
  return {
    // State
    isInitialized,
    isSubscribed,
    pushSupported,
    pushPermission,
    currentPlayerId,
    subscribing,
    // Methods
    initOneSignal,
    promptSubscribe,
    unsubscribe
  }
}
