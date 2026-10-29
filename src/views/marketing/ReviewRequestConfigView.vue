<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import InputSwitch from 'primevue/inputswitch'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import {
  reviewRequestsApi,
  type ReviewRequestConfig,
  type ReviewRequestStats
} from '@/api/review-requests.api'

const toast = useToast()

const isLoading = ref(true)
const isSaving = ref(false)

const config = ref<ReviewRequestConfig>({
  enabled: false,
  dias_espera: 3,
  recordatorio: true,
  dias_recordatorio: 7
})
const stats = ref<ReviewRequestStats | null>(null)
const entregados30d = ref<number | null>(null)

// Sin pedidos marcados como Entregado no se envía nada: es lo que dispara el correo.
const showNoDeliveriesWarning = computed(() => config.value.enabled && entregados30d.value === 0)

const responseRate = computed(() => {
  if (!stats.value || stats.value.enviadas === 0) return null
  return Math.round((stats.value.respondidas / stats.value.enviadas) * 100)
})

function applyData(data: { config: ReviewRequestConfig; stats?: ReviewRequestStats; entregados_30d?: number }) {
  config.value = data.config
  if (data.stats) stats.value = data.stats
  if (data.entregados_30d !== undefined) entregados30d.value = data.entregados_30d
}

async function fetchConfig() {
  isLoading.value = true
  try {
    const response = await reviewRequestsApi.getConfig()
    if (response.success && response.data) {
      applyData(response.data)
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo cargar la configuración',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

async function saveConfig() {
  isSaving.value = true
  try {
    const response = await reviewRequestsApi.saveConfig(config.value)
    if (response.success && response.data) {
      applyData(response.data)
      toast.add({
        severity: 'success',
        summary: 'Configuración guardada',
        detail: config.value.enabled
          ? 'La solicitud de opiniones está activa'
          : 'La solicitud de opiniones está desactivada',
        life: 3000
      })
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo guardar la configuración',
      life: 3000
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(fetchConfig)
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Solicitud de opiniones</h1>
      <p class="text-secondary-500 mt-1">
        Envía un email a tus clientes unos días después de recibir su pedido, para que califiquen
        los productos que compraron. No necesitan iniciar sesión: el enlace del correo los lleva
        directo a calificar.
      </p>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
    </div>

    <template v-else>
      <!-- Activación -->
      <div class="bg-white rounded-lg border border-secondary-200 p-6 mb-4">
        <div class="flex items-center justify-between">
          <div class="pr-6">
            <h2 class="font-semibold text-secondary-900">Pedir opinión por email</h2>
            <p class="text-sm text-secondary-500 mt-1">
              Se envía cuando el pedido pasa a <strong>Entregado</strong> en Despacho. Las opiniones
              llegan a <router-link to="/reviews" class="text-primary underline">Opiniones</router-link>
              y se publican cuando las apruebas. Los emails incluyen siempre un enlace de baja.
            </p>
          </div>
          <InputSwitch v-model="config.enabled" />
        </div>

        <Message v-if="showNoDeliveriesWarning" severity="warn" :closable="false" class="mt-4">
          En los últimos 30 días no marcaste ningún pedido como <strong>Entregado</strong>, así que
          no se enviará ningún email. Puedes marcar las entregas desde
          <router-link to="/dispatch" class="underline font-medium">Despacho</router-link>.
        </Message>
      </div>

      <!-- Tiempos -->
      <div v-if="config.enabled" class="bg-white rounded-lg border border-secondary-200 p-6 mb-4">
        <h2 class="font-semibold text-secondary-900 mb-1">Cuándo enviar</h2>
        <p class="text-sm text-secondary-500 mb-4">
          Dale tiempo al cliente para probar el producto antes de preguntarle. Si ya calificó todo lo
          que compró, no recibe nada más.
        </p>

        <div class="space-y-3">
          <div class="flex items-center gap-4 p-3 rounded-lg border border-primary-200 bg-primary-50/30">
            <div class="flex-1">
              <p class="text-sm font-medium text-secondary-900">Primer email</p>
            </div>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model="config.dias_espera"
                :min="0"
                :max="30"
                show-buttons
                input-class="w-20 text-center"
              />
              <span class="text-sm text-secondary-500">días después de la entrega</span>
            </div>
          </div>

          <div
            class="flex items-center gap-4 p-3 rounded-lg border"
            :class="config.recordatorio ? 'border-primary-200 bg-primary-50/30' : 'border-secondary-100 bg-secondary-50 opacity-60'"
          >
            <InputSwitch v-model="config.recordatorio" />
            <div class="flex-1">
              <p class="text-sm font-medium text-secondary-900">Recordatorio</p>
              <p class="text-xs text-secondary-500">Solo si no abrió el primer email</p>
            </div>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model="config.dias_recordatorio"
                :min="1"
                :max="30"
                :disabled="!config.recordatorio"
                show-buttons
                input-class="w-20 text-center"
              />
              <span class="text-sm text-secondary-500">días después</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resultados -->
      <div v-if="stats && (stats.enviadas > 0 || stats.en_cola > 0)" class="bg-white rounded-lg border border-secondary-200 p-6 mb-4">
        <h2 class="font-semibold text-secondary-900 mb-4">Últimos 90 días</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-secondary-500">Enviados</p>
            <p class="text-2xl font-bold text-secondary-900">{{ stats.enviadas }}</p>
          </div>
          <div>
            <p class="text-sm text-secondary-500">Abiertos</p>
            <p class="text-2xl font-bold text-secondary-900">{{ stats.abiertas }}</p>
          </div>
          <div>
            <p class="text-sm text-secondary-500">Con opinión</p>
            <p class="text-2xl font-bold text-primary">
              {{ stats.respondidas }}
              <span v-if="responseRate !== null" class="text-sm font-normal text-secondary-500">({{ responseRate }}%)</span>
            </p>
          </div>
          <div>
            <p class="text-sm text-secondary-500">Por enviar</p>
            <p class="text-2xl font-bold text-secondary-900">{{ stats.en_cola }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          label="Guardar cambios"
          icon="pi pi-check"
          :loading="isSaving"
          @click="saveConfig"
        />
      </div>
    </template>
  </div>
</template>
