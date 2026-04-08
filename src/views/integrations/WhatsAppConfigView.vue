<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { AppButton, AppBadge } from '@/components/ui'
import apiClient from '@/api/axios'

const router = useRouter()
const toast = useToast()

// State
const isLoading = ref(true)
const isConnecting = ref(false)
const isDisconnecting = ref(false)
const isTesting = ref(false)
const connected = ref(false)
const enabled = ref(false)
const phone = ref('')
const verifiedName = ref('')
const connectedAt = ref<string | null>(null)
const testResult = ref<{ success: boolean; message: string } | null>(null)

const FB_APP_ID = import.meta.env.VITE_WHATSAPP_APP_ID || ''
const FB_CONFIG_ID = import.meta.env.VITE_WHATSAPP_CONFIG_ID || ''

onMounted(async () => {
  await loadStatus()
  loadFacebookSDK()
})

async function loadStatus() {
  isLoading.value = true
  try {
    const { data } = await apiClient.get('/whatsapp/status')
    connected.value = data.data?.connected ?? false
    enabled.value = data.data?.enabled ?? false
    phone.value = data.data?.phone ?? ''
    verifiedName.value = data.data?.verified_name ?? ''
    connectedAt.value = data.data?.connected_at ?? null
  } catch {
    // Not connected
    connected.value = false
  } finally {
    isLoading.value = false
  }
}

function loadFacebookSDK() {
  if (document.getElementById('facebook-jssdk')) return

  const script = document.createElement('script')
  script.id = 'facebook-jssdk'
  script.src = 'https://connect.facebook.net/en_US/sdk.js'
  script.async = true
  script.defer = true
  script.crossOrigin = 'anonymous'
  script.onload = () => {
    (window as any).FB?.init({
      appId: FB_APP_ID,
      autoLogAppEvents: true,
      xfbml: true,
      version: 'v21.0'
    })
  }
  document.head.appendChild(script)
}

function connectWhatsApp() {
  const FB = (window as any).FB
  if (!FB) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Facebook SDK no cargado. Intenta recargar la página.',
      life: 5000
    })
    return
  }

  if (!FB_APP_ID || !FB_CONFIG_ID) {
    toast.add({
      severity: 'error',
      summary: 'Error de configuración',
      detail: 'WhatsApp App ID o Config ID no configurado. Contacta al administrador.',
      life: 5000
    })
    return
  }

  isConnecting.value = true

  FB.login(
    (response: any) => {
      if (response.authResponse?.code) {
        exchangeCode(response.authResponse.code)
      } else {
        isConnecting.value = false
        toast.add({
          severity: 'warn',
          summary: 'Cancelado',
          detail: 'No se completó la conexión con WhatsApp',
          life: 3000
        })
      }
    },
    {
      config_id: FB_CONFIG_ID,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: '',
        sessionInfoVersion: 2
      }
    }
  )
}

async function exchangeCode(code: string) {
  try {
    const { data } = await apiClient.post('/whatsapp/connect', { code })

    if (data.error === 0) {
      toast.add({
        severity: 'success',
        summary: 'WhatsApp conectado',
        detail: `Número: ${data.data?.phone || 'conectado'}`,
        life: 5000
      })
      await loadStatus()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: data.message || 'No se pudo conectar WhatsApp',
        life: 5000
      })
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al conectar WhatsApp',
      life: 5000
    })
  } finally {
    isConnecting.value = false
  }
}

async function handleDisconnect() {
  if (!confirm('¿Estás seguro de desconectar WhatsApp? Tus clientes ya no podrán interactuar por este canal.')) {
    return
  }

  isDisconnecting.value = true
  try {
    await apiClient.delete('/whatsapp/disconnect')
    toast.add({
      severity: 'success',
      summary: 'Desconectado',
      detail: 'WhatsApp ha sido desconectado',
      life: 3000
    })
    connected.value = false
    phone.value = ''
    verifiedName.value = ''
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo desconectar WhatsApp',
      life: 5000
    })
  } finally {
    isDisconnecting.value = false
  }
}

async function handleTest() {
  isTesting.value = true
  testResult.value = null
  try {
    const { data } = await apiClient.post('/integration-providers/whatsapp/test')
    testResult.value = data.data
  } catch {
    testResult.value = { success: false, message: 'Error de conexión' }
  } finally {
    isTesting.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Back button -->
    <div class="mb-4">
      <AppButton variant="text" @click="router.push('/integrations/providers')">
        <i class="pi pi-arrow-left mr-2" />
        Volver a proveedores
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <i class="pi pi-whatsapp text-2xl text-green-600" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800">WhatsApp Business</h1>
            <p class="text-sm text-gray-500">Asistente de Compras IA por WhatsApp</p>
          </div>
          <AppBadge v-if="connected" :variant="enabled ? 'success' : 'warning'">
            {{ enabled ? 'Conectado' : 'Pausado' }}
          </AppBadge>
        </div>
      </div>

      <!-- Not connected state -->
      <div v-if="!connected" class="space-y-6">
        <div class="bg-white rounded-lg shadow p-8 text-center">
          <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-whatsapp text-4xl text-green-500" />
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">
            Conecta tu WhatsApp Business
          </h2>
          <p class="text-gray-500 mb-6 max-w-lg mx-auto">
            Permite que tu Asistente de Compras IA atienda a tus clientes por WhatsApp.
            Busca productos, responde consultas y hace seguimiento de pedidos automáticamente.
          </p>

          <AppButton
            variant="primary"
            size="large"
            @click="connectWhatsApp"
            :loading="isConnecting"
          >
            <i class="pi pi-whatsapp mr-2" />
            Conectar WhatsApp
          </AppButton>

          <p class="text-xs text-gray-400 mt-4">
            Se abrirá un popup de Facebook para vincular tu número de WhatsApp Business.
          </p>
        </div>

        <!-- How it works -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-700 mb-4">¿Cómo funciona?</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4">
              <div class="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-primary font-bold">1</span>
              </div>
              <h4 class="font-medium text-gray-700 mb-1">Conecta tu número</h4>
              <p class="text-sm text-gray-500">Vincula tu número de WhatsApp Business en menos de 3 minutos</p>
            </div>
            <div class="text-center p-4">
              <div class="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-primary font-bold">2</span>
              </div>
              <h4 class="font-medium text-gray-700 mb-1">IA atiende automáticamente</h4>
              <p class="text-sm text-gray-500">El asistente busca productos, muestra precios y recomienda</p>
            </div>
            <div class="text-center p-4">
              <div class="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-primary font-bold">3</span>
              </div>
              <h4 class="font-medium text-gray-700 mb-1">Más ventas</h4>
              <p class="text-sm text-gray-500">Tus clientes compran directo desde WhatsApp, 24/7</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Connected state -->
      <div v-else class="space-y-6">
        <!-- Connection info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-700 mb-4">Conexión activa</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-500 mb-1">Número de WhatsApp</label>
              <p class="text-lg font-medium text-gray-800">{{ phone || 'No disponible' }}</p>
            </div>
            <div>
              <label class="block text-sm text-gray-500 mb-1">Nombre verificado</label>
              <p class="text-lg font-medium text-gray-800">{{ verifiedName || 'No disponible' }}</p>
            </div>
            <div v-if="connectedAt">
              <label class="block text-sm text-gray-500 mb-1">Conectado desde</label>
              <p class="text-sm text-gray-700">{{ new Date(connectedAt).toLocaleString('es-PE') }}</p>
            </div>
          </div>
        </div>

        <!-- Features info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="font-semibold text-gray-700 mb-4">Funcionalidades activas</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <i class="pi pi-check-circle text-green-500" />
              <span class="text-sm text-gray-700">Búsqueda de productos por IA</span>
            </div>
            <div class="flex items-center gap-3">
              <i class="pi pi-check-circle text-green-500" />
              <span class="text-sm text-gray-700">Tarjetas de productos con botón de compra</span>
            </div>
            <div class="flex items-center gap-3">
              <i class="pi pi-check-circle text-green-500" />
              <span class="text-sm text-gray-700">Seguimiento de pedidos</span>
            </div>
            <div class="flex items-center gap-3">
              <i class="pi pi-check-circle text-green-500" />
              <span class="text-sm text-gray-700">Respuestas en español, 24/7</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between">
          <AppButton
            variant="secondary"
            @click="handleTest"
            :loading="isTesting"
          >
            <i class="pi pi-bolt mr-2" />
            Probar conexión
          </AppButton>

          <AppButton
            variant="danger"
            @click="handleDisconnect"
            :loading="isDisconnecting"
          >
            <i class="pi pi-times mr-2" />
            Desconectar WhatsApp
          </AppButton>
        </div>

        <!-- Test result -->
        <div
          v-if="testResult"
          class="rounded-lg p-4"
          :class="testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'"
        >
          <div class="flex items-center gap-2">
            <i
              :class="testResult.success ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-red-600'"
            />
            <span
              class="text-sm font-medium"
              :class="testResult.success ? 'text-green-700' : 'text-red-700'"
            >
              {{ testResult.message }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
