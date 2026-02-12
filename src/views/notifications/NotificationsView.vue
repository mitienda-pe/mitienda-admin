<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary">Notificaciones</h1>
      <p class="text-secondary-500">Configura cómo recibir avisos de nuevos pedidos</p>
    </div>

    <!-- Mensajes -->
    <Message
      v-if="store.error"
      severity="error"
      :closable="true"
      @close="store.clearMessages"
      class="mb-4"
    >
      {{ store.error }}
    </Message>
    <Message
      v-if="store.successMessage"
      severity="success"
      :closable="true"
      @close="store.clearMessages"
      class="mb-4"
    >
      {{ store.successMessage }}
    </Message>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
    </div>

    <div v-else class="space-y-6">
      <!-- Card 1: Email Notifications -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-envelope text-primary"></i>
            <span>Notificaciones por Email</span>
          </div>
        </template>
        <template #content>
          <p class="text-secondary-500 mb-4">
            Ingresa el correo electrónico donde quieres recibir avisos cuando llegue un nuevo
            pedido.
          </p>
          <form @submit.prevent="handleSaveEmail" class="space-y-4">
            <div>
              <label for="notifEmail" class="block text-sm font-medium text-secondary-700 mb-2">
                Correo electrónico
              </label>
              <div class="flex gap-3">
                <InputText
                  id="notifEmail"
                  v-model="emailForm"
                  type="email"
                  class="flex-1"
                  placeholder="ventas@tutienda.com"
                  :disabled="store.isSaving"
                />
                <Button
                  type="submit"
                  label="Guardar"
                  icon="pi pi-check"
                  :loading="store.isSaving"
                  :disabled="!emailForm.trim()"
                />
              </div>
            </div>
            <div
              v-if="store.emailNotification"
              class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle text-green-600"></i>
                <span class="text-green-700">{{ store.emailNotification.email }}</span>
              </div>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                @click="handleDeleteEmail"
                :loading="store.isSaving"
              />
            </div>
          </form>
        </template>
      </Card>

      <!-- Card 2: Web Push Notifications (OneSignal) -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-bell text-primary"></i>
            <span>Notificaciones Push en el Navegador</span>
          </div>
        </template>
        <template #content>
          <p class="text-secondary-500 mb-4">
            Recibe notificaciones push directamente en tu navegador cuando llegue un nuevo pedido.
          </p>

          <!-- Not supported -->
          <div
            v-if="!pushSupported"
            class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-yellow-600"></i>
              <span class="text-yellow-700"
                >Tu navegador no soporta notificaciones push.</span
              >
            </div>
          </div>

          <!-- Permission denied -->
          <div
            v-else-if="pushPermission === 'denied'"
            class="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <i class="pi pi-times-circle text-red-600 mt-0.5"></i>
              <div>
                <span class="text-red-700 font-medium"
                  >Las notificaciones están bloqueadas.</span
                >
                <p class="text-red-600 text-sm mt-1">
                  Para habilitarlas, haz clic en el ícono de candado en la barra de direcciones
                  y permite las notificaciones.
                </p>
              </div>
            </div>
          </div>

          <!-- Subscribed -->
          <div v-else-if="isSubscribed" class="space-y-4">
            <div
              class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle text-green-600"></i>
                <span class="text-green-700 font-medium"
                  >Notificaciones push activas en este navegador</span
                >
              </div>
              <Button
                label="Desactivar"
                icon="pi pi-bell-slash"
                severity="danger"
                text
                @click="handleUnsubscribe"
                :loading="store.isSaving"
              />
            </div>

            <div v-if="store.onesignalSubscriptions.length > 0">
              <h4 class="text-sm font-medium text-secondary-700 mb-2">
                Navegadores suscritos:
              </h4>
              <div class="space-y-2">
                <div
                  v-for="sub in store.onesignalSubscriptions"
                  :key="sub.id"
                  class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div class="flex items-center gap-2">
                    <i class="pi pi-desktop text-secondary-400"></i>
                    <span>{{ sub.browser || 'Navegador desconocido' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Not subscribed -->
          <div v-else>
            <Button
              label="Activar notificaciones push"
              icon="pi pi-bell"
              @click="handleSubscribe"
              :loading="subscribing"
            />
          </div>
        </template>
      </Card>

      <!-- Card 3: Mobile App -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-mobile text-primary"></i>
            <span>App Móvil</span>
          </div>
        </template>
        <template #content>
          <p class="text-secondary-500 mb-4">
            Descarga la app de MiTienda Vendedor para gestionar tu tienda desde tu celular y
            recibir notificaciones de pedidos al instante.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Google Play -->
            <a
              href="https://play.google.com/store/apps/details?id=pe.mitienda.seller&utm_source=mitienda%20newsletter&utm_medium=sendy&utm_campaign=mitienda%20email_marketing"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-3 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <i class="pi pi-android text-2xl"></i>
              <div>
                <div class="text-xs opacity-75">Disponible en</div>
                <div class="font-semibold">Google Play</div>
              </div>
            </a>
            <!-- App Store -->
            <a
              href="https://apps.apple.com/pe/app/mitienda-vendedor/id6752581287"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-3 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <i class="pi pi-apple text-2xl"></i>
              <div>
                <div class="text-xs opacity-75">Descárgalo en</div>
                <div class="font-semibold">App Store</div>
              </div>
            </a>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications.store'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string

const store = useNotificationsStore()

// Email form
const emailForm = ref('')

// Push state
const pushSupported = ref(true)
const pushPermission = ref<NotificationPermission>('default')
const isSubscribed = ref(false)
const subscribing = ref(false)
const currentPlayerId = ref<string | null>(null)

onMounted(async () => {
  await store.fetchNotifications()

  // Pre-fill email form if exists
  if (store.emailNotification) {
    emailForm.value = store.emailNotification.email
  }

  // Initialize OneSignal
  await initOneSignal()
})

async function initOneSignal() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    pushSupported.value = false
    return
  }

  if (!ONESIGNAL_APP_ID) {
    pushSupported.value = false
    return
  }

  pushPermission.value = Notification.permission

  // Load OneSignal SDK if not already loaded
  if (!window.OneSignalDeferred) {
    window.OneSignalDeferred = []
    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.defer = true
    document.head.appendChild(script)
  }

  window.OneSignalDeferred.push(async function (OneSignal: any) {
    await OneSignal.init({ appId: ONESIGNAL_APP_ID })

    // Check current subscription state
    const subscription = OneSignal.User?.PushSubscription
    if (subscription?.id) {
      currentPlayerId.value = subscription.id
      const status = await store.checkOneSignalStatus(subscription.id)
      isSubscribed.value = status.subscribed
    }

    // Update permission state after init
    pushPermission.value = Notification.permission
  })
}

async function handleSaveEmail() {
  if (!emailForm.value.trim()) return
  const result = await store.saveEmail(emailForm.value.trim())
  if (result?.success && store.emailNotification) {
    emailForm.value = store.emailNotification.email
  }
}

async function handleDeleteEmail() {
  await store.deleteEmail()
  emailForm.value = ''
}

async function handleSubscribe() {
  subscribing.value = true

  try {
    window.OneSignalDeferred?.push(async function (OneSignal: any) {
      try {
        await OneSignal.Slidedown.promptPush()

        // Wait a moment for subscription to register
        await new Promise(resolve => setTimeout(resolve, 1000))

        const playerId = OneSignal.User?.PushSubscription?.id
        if (playerId) {
          const browser = detectBrowser()
          await store.subscribeOneSignal(playerId, browser)
          currentPlayerId.value = playerId
          isSubscribed.value = true
        }
      } catch (err) {
        console.error('OneSignal subscribe error:', err)
      } finally {
        subscribing.value = false
      }
    })
  } catch {
    subscribing.value = false
  }
}

async function handleUnsubscribe() {
  if (!currentPlayerId.value) return
  const result = await store.unsubscribeOneSignal(currentPlayerId.value)
  if (result?.success) {
    isSubscribed.value = false
  }
}

function detectBrowser(): string {
  const ua = navigator.userAgent
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  return 'Otro'
}
</script>
