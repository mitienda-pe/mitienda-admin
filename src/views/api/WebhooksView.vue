<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-secondary-800">Webhooks</h1>
      <p class="text-secondary-600 mt-1">
        Configura webhooks para recibir notificaciones en tiempo real de eventos en tu tienda
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="apiCredentialsStore.isLoading && !loaded" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main column: Webhook configuration -->
      <div class="lg:col-span-2">
        <Card>
          <template #content>
            <!-- Messages -->
            <Message
              v-if="apiCredentialsStore.error"
              severity="error"
              @close="apiCredentialsStore.clearMessages()"
              class="mb-4"
            >
              {{ apiCredentialsStore.error }}
            </Message>

            <Message
              v-if="apiCredentialsStore.successMessage"
              severity="success"
              @close="apiCredentialsStore.clearMessages()"
              class="mb-4"
            >
              {{ apiCredentialsStore.successMessage }}
            </Message>

            <!-- Webhook Configuration Form -->
            <form @submit.prevent="handleSave" class="space-y-6">
              <!-- Order Confirmation Webhook -->
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-start gap-3 mb-3">
                  <i class="pi pi-shopping-cart text-primary text-xl mt-1"></i>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-secondary-800">
                      Confirmación de Venta/Pedido
                    </h3>
                    <p class="text-sm text-secondary-600 mt-1">
                      Notificación cuando se confirma un nuevo pedido en tu tienda
                    </p>
                  </div>
                </div>
                <InputText
                  v-model="formData.webhook1.url"
                  placeholder="https://tu-servidor.com/webhook/pedidos"
                  class="w-full"
                  :class="{ 'p-invalid': errors.webhook1 }"
                />
                <small v-if="errors.webhook1" class="text-red-500">{{ errors.webhook1 }}</small>
                <small v-else class="text-secondary-600 block mt-1">
                  Se enviará una petición POST con los datos del pedido cuando se confirme
                </small>
              </div>

              <!-- Customer Registration Webhook -->
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-start gap-3 mb-3">
                  <i class="pi pi-users text-primary text-xl mt-1"></i>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-secondary-800">
                      Registro de Cliente
                    </h3>
                    <p class="text-sm text-secondary-600 mt-1">
                      Notificación cuando se registra un nuevo cliente
                    </p>
                  </div>
                </div>
                <InputText
                  v-model="formData.webhook2.url"
                  placeholder="https://tu-servidor.com/webhook/clientes"
                  class="w-full"
                  :class="{ 'p-invalid': errors.webhook2 }"
                />
                <small v-if="errors.webhook2" class="text-red-500">{{ errors.webhook2 }}</small>
                <small v-else class="text-secondary-600 block mt-1">
                  Se enviará una petición POST con los datos del cliente cuando se registre
                </small>
              </div>

              <!-- Product Update Webhook -->
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-start gap-3 mb-3">
                  <i class="pi pi-box text-primary text-xl mt-1"></i>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-secondary-800">
                      Actualización de Producto
                    </h3>
                    <p class="text-sm text-secondary-600 mt-1">
                      Notificación cuando se actualiza un producto (stock, precio, etc.)
                    </p>
                  </div>
                </div>
                <InputText
                  v-model="formData.webhook3.url"
                  placeholder="https://tu-servidor.com/webhook/productos"
                  class="w-full"
                  :class="{ 'p-invalid': errors.webhook3 }"
                />
                <small v-if="errors.webhook3" class="text-red-500">{{ errors.webhook3 }}</small>
                <small v-else class="text-secondary-600 block mt-1">
                  Se enviará una petición POST con los datos del producto cuando se actualice
                </small>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-4">
                <Button
                  type="submit"
                  label="Guardar Webhooks"
                  icon="pi pi-save"
                  :loading="apiCredentialsStore.isSavingWebhooks"
                  size="large"
                />
                <Button
                  type="button"
                  label="Limpiar Todo"
                  icon="pi pi-times"
                  severity="secondary"
                  outlined
                  @click="handleClearAll"
                  size="large"
                />
              </div>
            </form>

            <!-- Payload Example -->
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-secondary-800 mb-2 flex items-center gap-2">
                <i class="pi pi-code"></i>
                Ejemplo de Payload (Pedido)
              </h4>
              <pre class="text-xs overflow-x-auto"><code>{
  "event": "order.confirmed",
  "data": {
    "order_id": 12345,
    "order_code": "PED-2024-001",
    "customer": {
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    "total": 150.00,
    "items": [...],
    "created_at": "2024-10-28T10:30:00Z"
  }
}</code></pre>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar: Documentation and current webhooks -->
      <div class="space-y-6">
        <!-- Current Webhooks -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-link text-lg"></i>
              <span>Webhooks Activos</span>
            </div>
          </template>
          <template #content>
            <div v-if="activeWebhooks.length > 0" class="space-y-3">
              <div
                v-for="webhook in activeWebhooks"
                :key="webhook.tiendawebhook_id"
                class="p-3 bg-green-50 border border-green-200 rounded"
              >
                <div class="flex items-start gap-2">
                  <i class="pi pi-check-circle text-green-600 text-sm mt-0.5"></i>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-green-800">
                      {{ getWebhookTypeName(webhook.tiendawebhook_tipo) }}
                    </p>
                    <p class="text-xs text-green-700 truncate mt-1" :title="webhook.tiendawebhook_url">
                      {{ webhook.tiendawebhook_url }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-secondary-500 py-4">
              <i class="pi pi-inbox text-3xl mb-2"></i>
              <p class="text-sm">No hay webhooks configurados</p>
            </div>
          </template>
        </Card>

        <!-- Documentation -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-lg"></i>
              <span>Información</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4 text-sm">
              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">¿Qué son los Webhooks?</h4>
                <p class="text-secondary-600">
                  Los webhooks son notificaciones HTTP automáticas que se envían a tu servidor
                  cuando ocurren eventos específicos en tu tienda.
                </p>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo funcionan?</h4>
                <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                  <li>Configura la URL de tu servidor</li>
                  <li>Ocurre un evento en tu tienda</li>
                  <li>Se envía POST a tu URL</li>
                  <li>Tu servidor procesa la información</li>
                </ol>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">Requisitos</h4>
                <ul class="space-y-1 text-secondary-600">
                  <li>✓ URL pública accesible</li>
                  <li>✓ Endpoint que acepte POST</li>
                  <li>✓ Responder con código 200</li>
                  <li>✓ Usar HTTPS en producción</li>
                </ul>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">Eventos Disponibles</h4>
                <ul class="space-y-1 text-secondary-600 text-xs">
                  <li>• order.confirmed</li>
                  <li>• customer.registered</li>
                  <li>• product.updated</li>
                </ul>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useApiCredentialsStore } from '@/stores/apiCredentials.store'
import { WebhookType } from '@/types/api-credentials.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()
const apiCredentialsStore = useApiCredentialsStore()

const loaded = ref(false)

interface WebhookFormData {
  id?: number
  url: string
  tipo: WebhookType
}

const formData = reactive<{
  webhook1: WebhookFormData
  webhook2: WebhookFormData
  webhook3: WebhookFormData
}>({
  webhook1: { url: '', tipo: WebhookType.ORDER_CONFIRMATION },
  webhook2: { url: '', tipo: WebhookType.CUSTOMER_REGISTRATION },
  webhook3: { url: '', tipo: WebhookType.PRODUCT_UPDATE }
})

const errors = reactive({
  webhook1: '',
  webhook2: '',
  webhook3: ''
})

const activeWebhooks = computed(() => apiCredentialsStore.webhooks)

onMounted(async () => {
  apiCredentialsStore.clearMessages()
  await apiCredentialsStore.fetchWebhooks()
  loaded.value = true

  // Load existing webhooks into form
  const webhooks = apiCredentialsStore.webhooks
  webhooks.forEach((webhook) => {
    if (webhook.tiendawebhook_tipo === WebhookType.ORDER_CONFIRMATION) {
      formData.webhook1.id = webhook.tiendawebhook_id
      formData.webhook1.url = webhook.tiendawebhook_url
    } else if (webhook.tiendawebhook_tipo === WebhookType.CUSTOMER_REGISTRATION) {
      formData.webhook2.id = webhook.tiendawebhook_id
      formData.webhook2.url = webhook.tiendawebhook_url
    } else if (webhook.tiendawebhook_tipo === WebhookType.PRODUCT_UPDATE) {
      formData.webhook3.id = webhook.tiendawebhook_id
      formData.webhook3.url = webhook.tiendawebhook_url
    }
  })
})

const getWebhookTypeName = (type: WebhookType): string => {
  const names = {
    [WebhookType.ORDER_CONFIRMATION]: 'Confirmación de Pedido',
    [WebhookType.CUSTOMER_REGISTRATION]: 'Registro de Cliente',
    [WebhookType.PRODUCT_UPDATE]: 'Actualización de Producto'
  }
  return names[type] || 'Desconocido'
}

const validateForm = (): boolean => {
  errors.webhook1 = ''
  errors.webhook2 = ''
  errors.webhook3 = ''

  let valid = true

  // Validate URLs if provided
  const urlPattern = /^https?:\/\/.+/

  if (formData.webhook1.url && !urlPattern.test(formData.webhook1.url)) {
    errors.webhook1 = 'URL inválida. Debe comenzar con http:// o https://'
    valid = false
  }

  if (formData.webhook2.url && !urlPattern.test(formData.webhook2.url)) {
    errors.webhook2 = 'URL inválida. Debe comenzar con http:// o https://'
    valid = false
  }

  if (formData.webhook3.url && !urlPattern.test(formData.webhook3.url)) {
    errors.webhook3 = 'URL inválida. Debe comenzar con http:// o https://'
    valid = false
  }

  return valid
}

const handleSave = async () => {
  if (!validateForm()) return

  apiCredentialsStore.clearMessages()

  const webhooksToSync = [
    {
      tiendawebhook_id: formData.webhook1.id,
      tiendawebhook_tipo: formData.webhook1.tipo,
      tiendawebhook_url: formData.webhook1.url
    },
    {
      tiendawebhook_id: formData.webhook2.id,
      tiendawebhook_tipo: formData.webhook2.tipo,
      tiendawebhook_url: formData.webhook2.url
    },
    {
      tiendawebhook_id: formData.webhook3.id,
      tiendawebhook_tipo: formData.webhook3.tipo,
      tiendawebhook_url: formData.webhook3.url
    }
  ]

  const result = await apiCredentialsStore.syncWebhooks({ webhooks: webhooksToSync })

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Webhooks actualizados exitosamente',
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'No se pudieron guardar los webhooks',
      life: 5000
    })
  }
}

const handleClearAll = () => {
  confirm.require({
    message: '¿Estás seguro de eliminar todos los webhooks configurados?',
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar todo',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => {
      formData.webhook1.url = ''
      formData.webhook2.url = ''
      formData.webhook3.url = ''
      handleSave()
    }
  })
}
</script>
