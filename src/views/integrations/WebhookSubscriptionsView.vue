<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWebhookSubscriptionsStore } from '@/stores/webhookSubscriptions.store'
import { useToast } from 'primevue/usetoast'
import { AppButton, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import type {
  WebhookSubscription,
  WebhookDelivery
} from '@/types/webhook-subscriptions.types'

const store = useWebhookSubscriptionsStore()
const toast = useToast()

// Dialog state
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const formUrl = ref('')
const formEvents = ref<string[]>([])
const saving = ref(false)

// Delivery log state
const showDeliveryDialog = ref(false)
const deliverySubId = ref<number | null>(null)
const deliveries = ref<WebhookDelivery[]>([])
const deliveriesLoading = ref(false)

// Secret display
const showSecretDialog = ref(false)
const displayedSecret = ref('')

onMounted(async () => {
  await Promise.all([store.fetchSubscriptions(), store.fetchAvailableEvents()])
})

function openCreateDialog() {
  editingId.value = null
  formUrl.value = ''
  formEvents.value = []
  showDialog.value = true
}

function openEditDialog(sub: WebhookSubscription) {
  editingId.value = sub.id
  formUrl.value = sub.url
  formEvents.value = [...sub.events]
  showDialog.value = true
}

async function saveSubscription() {
  if (!formUrl.value || formEvents.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'URL y al menos un evento son requeridos', life: 3000 })
    return
  }

  saving.value = true
  try {
    if (editingId.value) {
      const ok = await store.updateSubscription(editingId.value, {
        url: formUrl.value,
        events: formEvents.value
      })
      if (ok) {
        toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Suscripción actualizada', life: 3000 })
        showDialog.value = false
      }
    } else {
      const result = await store.createSubscription({
        url: formUrl.value,
        events: formEvents.value
      })
      if (result) {
        toast.add({ severity: 'success', summary: 'Creado', detail: 'Suscripción creada exitosamente', life: 3000 })
        showDialog.value = false
        // Show secret on creation
        displayedSecret.value = result.secret
        showSecretDialog.value = true
      }
    }
  } finally {
    saving.value = false
  }
}

async function deleteSubscription(sub: WebhookSubscription) {
  if (!confirm('¿Eliminar esta suscripción de webhook?')) return
  const ok = await store.deleteSubscription(sub.id)
  if (ok) {
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Suscripción eliminada', life: 3000 })
  }
}

async function toggleStatus(sub: WebhookSubscription) {
  const newStatus = sub.status === 'active' ? 'paused' : 'active'
  const ok = await store.updateSubscription(sub.id, { status: newStatus })
  if (ok) {
    toast.add({ severity: 'success', summary: 'Actualizado', detail: `Webhook ${newStatus === 'active' ? 'activado' : 'pausado'}`, life: 3000 })
  }
}

async function handleRegenerate(sub: WebhookSubscription) {
  if (!confirm('¿Regenerar el secret? Las verificaciones existentes dejarán de funcionar.')) return
  const secret = await store.regenerateSecret(sub.id)
  if (secret) {
    displayedSecret.value = secret
    showSecretDialog.value = true
  }
}

async function handleTest(sub: WebhookSubscription) {
  toast.add({ severity: 'info', summary: 'Enviando...', detail: 'Enviando evento de prueba', life: 2000 })
  const result = await store.testWebhook(sub.id)
  if (result) {
    if (result.delivered) {
      toast.add({ severity: 'success', summary: 'Entregado', detail: `HTTP ${result.response_code}`, life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: 'Fallo', detail: result.error || 'No se pudo entregar', life: 5000 })
    }
  }
}

async function openDeliveryLog(sub: WebhookSubscription) {
  deliverySubId.value = sub.id
  deliveriesLoading.value = true
  showDeliveryDialog.value = true
  deliveries.value = await store.fetchDeliveries(sub.id)
  deliveriesLoading.value = false
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    paused: 'warning',
    disabled: 'danger'
  }
  return map[status] || 'neutral'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    active: 'Activo',
    paused: 'Pausado',
    disabled: 'Deshabilitado'
  }
  return map[status] || status
}

function getDeliveryVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    success: 'success',
    failed: 'danger',
    pending: 'warning'
  }
  return map[status] || 'neutral'
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.add({ severity: 'success', summary: 'Copiado', detail: 'Secret copiado al portapapeles', life: 2000 })
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Webhook Subscriptions</h1>
        <p class="text-gray-500 mt-1">Configura endpoints para recibir eventos de tu tienda en tiempo real</p>
      </div>
      <AppButton variant="primary" @click="openCreateDialog">
        <i class="pi pi-plus mr-2" />
        Nueva suscripción
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="store.error" :message="store.error" @retry="store.fetchSubscriptions" />

    <!-- Empty -->
    <AppEmptyState
      v-else-if="!store.subscriptions.length"
      title="Sin suscripciones"
      description="Crea una suscripción para recibir eventos vía webhook"
    />

    <!-- Table -->
    <DataTable v-else :value="store.subscriptions" class="mt-4" stripedRows>
      <Column header="URL" field="url">
        <template #body="{ data }">
          <div class="max-w-xs truncate font-mono text-sm">{{ data.url }}</div>
        </template>
      </Column>
      <Column header="Eventos">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="evt in data.events"
              :key="evt"
              class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded"
            >
              {{ evt }}
            </span>
          </div>
        </template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <AppBadge :variant="getStatusVariant(data.status)">
            {{ getStatusLabel(data.status) }}
          </AppBadge>
        </template>
      </Column>
      <Column header="Fallos" field="failure_count">
        <template #body="{ data }">
          <span :class="data.failure_count > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'">
            {{ data.failure_count }}
          </span>
        </template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-1">
            <AppButton variant="text" size="small" @click="handleTest(data)" title="Probar">
              <i class="pi pi-send" />
            </AppButton>
            <AppButton variant="text" size="small" @click="openDeliveryLog(data)" title="Ver entregas">
              <i class="pi pi-list" />
            </AppButton>
            <AppButton variant="text" size="small" @click="handleRegenerate(data)" title="Regenerar secret">
              <i class="pi pi-refresh" />
            </AppButton>
            <AppButton variant="text" size="small" @click="toggleStatus(data)" :title="data.status === 'active' ? 'Pausar' : 'Activar'">
              <i :class="data.status === 'active' ? 'pi pi-pause' : 'pi pi-play'" />
            </AppButton>
            <AppButton variant="text" size="small" @click="openEditDialog(data)" title="Editar">
              <i class="pi pi-pencil" />
            </AppButton>
            <AppButton variant="text" size="small" @click="deleteSubscription(data)" title="Eliminar">
              <i class="pi pi-trash text-red-500" />
            </AppButton>
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- HMAC Documentation -->
    <div class="mt-8 bg-gray-50 border rounded-lg p-6">
      <h3 class="font-semibold text-gray-700 mb-2">Verificación de firma HMAC</h3>
      <p class="text-sm text-gray-600 mb-3">
        Cada webhook incluye el header <code class="bg-gray-200 px-1 rounded">X-MiTienda-Signature</code>
        con una firma HMAC-SHA256 del body usando tu secret.
      </p>
      <pre class="bg-gray-800 text-green-400 text-xs p-4 rounded overflow-x-auto">// Node.js
const crypto = require('crypto')
const signature = req.headers['x-mitienda-signature']
const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))</pre>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :header="editingId ? 'Editar suscripción' : 'Nueva suscripción'"
      :style="{ width: '500px' }"
      modal
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">URL del endpoint</label>
          <InputText
            v-model="formUrl"
            class="w-full"
            placeholder="https://tu-servidor.com/webhook"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Eventos</label>
          <div class="space-y-2">
            <div v-for="evt in store.availableEvents" :key="evt.type" class="flex items-start gap-2">
              <Checkbox v-model="formEvents" :value="evt.type" :inputId="evt.type" />
              <label :for="evt.type" class="cursor-pointer">
                <div class="text-sm font-medium">{{ evt.label }}</div>
                <div class="text-xs text-gray-500">{{ evt.description }}</div>
              </label>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDialog = false">Cancelar</AppButton>
        <AppButton variant="primary" @click="saveSubscription" :loading="saving">
          {{ editingId ? 'Guardar' : 'Crear' }}
        </AppButton>
      </template>
    </Dialog>

    <!-- Secret Display Dialog -->
    <Dialog
      v-model:visible="showSecretDialog"
      header="Secret de firma HMAC"
      :style="{ width: '500px' }"
      modal
    >
      <div class="space-y-3">
        <p class="text-sm text-gray-600">
          Guarda este secret de forma segura. Lo necesitarás para verificar las firmas de los webhooks.
          <strong>No se mostrará de nuevo.</strong>
        </p>
        <div class="flex items-center gap-2 bg-gray-100 p-3 rounded font-mono text-sm break-all">
          <span class="flex-1">{{ displayedSecret }}</span>
          <AppButton variant="text" size="small" @click="copyToClipboard(displayedSecret)">
            <i class="pi pi-copy" />
          </AppButton>
        </div>
      </div>
      <template #footer>
        <AppButton variant="primary" @click="showSecretDialog = false">Entendido</AppButton>
      </template>
    </Dialog>

    <!-- Delivery Log Dialog -->
    <Dialog
      v-model:visible="showDeliveryDialog"
      header="Historial de entregas"
      :style="{ width: '700px' }"
      modal
    >
      <div v-if="deliveriesLoading" class="flex justify-center py-8">
        <i class="pi pi-spinner pi-spin text-2xl text-primary" />
      </div>
      <div v-else-if="!deliveries.length" class="text-center py-8 text-gray-500">
        Sin entregas registradas
      </div>
      <DataTable v-else :value="deliveries" :rows="10" class="text-sm">
        <Column header="Evento" field="event_type">
          <template #body="{ data }">
            <span class="font-mono text-xs">{{ data.event_type }}</span>
          </template>
        </Column>
        <Column header="Estado">
          <template #body="{ data }">
            <AppBadge :variant="getDeliveryVariant(data.status)">
              {{ data.status }}
            </AppBadge>
          </template>
        </Column>
        <Column header="HTTP">
          <template #body="{ data }">
            <span :class="data.response_code && data.response_code < 300 ? 'text-green-600' : 'text-red-600'">
              {{ data.response_code || '-' }}
            </span>
          </template>
        </Column>
        <Column header="Tiempo">
          <template #body="{ data }">
            {{ data.duration_ms ? `${data.duration_ms}ms` : '-' }}
          </template>
        </Column>
        <Column header="Fecha">
          <template #body="{ data }">
            {{ new Date(data.created_at).toLocaleString('es-PE') }}
          </template>
        </Column>
      </DataTable>
    </Dialog>
  </div>
</template>
