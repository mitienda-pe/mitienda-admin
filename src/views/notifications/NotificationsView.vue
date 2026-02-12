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
            Ingresa los correos electrónicos donde quieres recibir avisos cuando llegue un nuevo
            pedido.
          </p>

          <!-- Email pills -->
          <div
            v-if="store.emailNotifications.length > 0"
            class="flex flex-wrap gap-2 mb-4"
          >
            <span
              v-for="item in store.emailNotifications"
              :key="item.id"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm"
            >
              <i class="pi pi-envelope text-xs"></i>
              {{ item.email }}
              <button
                type="button"
                class="ml-1 hover:text-red-600 transition-colors"
                :disabled="store.isSaving"
                @click="handleRemoveEmail(item.id)"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </span>
          </div>

          <!-- Add email form -->
          <form @submit.prevent="handleAddEmail" class="flex gap-3">
            <InputText
              id="notifEmail"
              v-model="emailForm"
              type="email"
              class="flex-1"
              placeholder="ventas@tutienda.com"
              :disabled="store.isSaving"
              @keydown.enter.prevent="handleAddEmail"
            />
            <Button
              type="submit"
              label="Agregar"
              icon="pi pi-plus"
              :loading="store.isSaving"
              :disabled="!emailForm.trim()"
            />
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
import { useOneSignal } from '@/composables/useOneSignal'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const store = useNotificationsStore()
const {
  isSubscribed,
  pushSupported,
  pushPermission,
  subscribing,
  promptSubscribe,
  unsubscribe
} = useOneSignal()

// Email form
const emailForm = ref('')

onMounted(async () => {
  await store.fetchNotifications()
})

async function handleAddEmail() {
  const email = emailForm.value.trim()
  if (!email) return

  // Basic validation
  if (!email.includes('@')) {
    store.error = 'Ingresa un correo electrónico válido'
    return
  }

  // Check if already in list
  if (store.emailNotifications.some(e => e.email === email)) {
    store.error = 'Este correo ya está registrado'
    return
  }

  const result = await store.addEmail(email)
  if (result?.success) {
    emailForm.value = ''
  }
}

async function handleRemoveEmail(id: number) {
  await store.removeEmail(id)
}

async function handleSubscribe() {
  await promptSubscribe()
  // Refresh store to update subscriptions list
  await store.fetchNotifications()
}

async function handleUnsubscribe() {
  await unsubscribe()
  // Refresh store to update subscriptions list
  await store.fetchNotifications()
}
</script>
