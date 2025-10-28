<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-secondary-800">Credenciales API</h1>
      <p class="text-secondary-600 mt-1">
        Gestiona el token de acceso para la API REST de tu tienda
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="apiCredentialsStore.isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main column: Token display and actions -->
      <div class="lg:col-span-2">
        <Card>
          <template #content>
            <!-- Status -->
            <div
              v-if="hasToken"
              class="mb-6 p-4 rounded-lg bg-green-50 border border-green-200"
            >
              <div class="flex items-start gap-3">
                <i class="pi pi-check-circle text-green-600 text-xl"></i>
                <div>
                  <h3 class="font-semibold text-green-800">Token API Activo</h3>
                  <p class="text-sm mt-1 text-green-700">
                    Tu tienda tiene un token de acceso activo para usar la API.
                  </p>
                  <p v-if="apiCredentialsStore.tokenCreatedAt" class="text-sm mt-1 text-green-600">
                    Creado el: {{ formatDate(apiCredentialsStore.tokenCreatedAt) }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-else
              class="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200"
            >
              <div class="flex items-start gap-3">
                <i class="pi pi-exclamation-triangle text-yellow-600 text-xl"></i>
                <div>
                  <h3 class="font-semibold text-yellow-800">Sin Token API</h3>
                  <p class="text-sm mt-1 text-yellow-700">
                    Crea un token para poder acceder a la API de tu tienda.
                  </p>
                </div>
              </div>
            </div>

            <!-- Token Display -->
            <div v-if="hasToken" class="mb-6">
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Tu Token de Acceso</h3>
              <div class="space-y-3">
                <div class="flex gap-2">
                  <InputText
                    v-model="displayToken"
                    readonly
                    class="flex-1 font-mono text-sm"
                    :type="showToken ? 'text' : 'password'"
                  />
                  <Button
                    :icon="showToken ? 'pi pi-eye-slash' : 'pi pi-eye'"
                    severity="secondary"
                    outlined
                    @click="showToken = !showToken"
                    v-tooltip.top="showToken ? 'Ocultar' : 'Mostrar'"
                  />
                  <Button
                    icon="pi pi-copy"
                    severity="secondary"
                    outlined
                    @click="copyToken"
                    v-tooltip.top="'Copiar'"
                  />
                </div>
                <small class="text-secondary-600 block">
                  Este token debe incluirse en el header Authorization de tus peticiones HTTP
                </small>
              </div>
            </div>

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

            <!-- Actions -->
            <div class="flex gap-3 pt-4">
              <Button
                v-if="!hasToken"
                label="Crear Token"
                icon="pi pi-plus"
                :loading="apiCredentialsStore.isCreatingToken"
                @click="handleCreateToken"
                size="large"
              />

              <template v-else>
                <Button
                  label="Renovar Token"
                  icon="pi pi-refresh"
                  severity="info"
                  outlined
                  :loading="apiCredentialsStore.isRenewingToken"
                  @click="handleRenewToken"
                  size="large"
                />
                <Button
                  label="Eliminar Token"
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  @click="handleDeleteToken"
                  size="large"
                />
              </template>
            </div>

            <!-- Example usage -->
            <div v-if="hasToken" class="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 class="font-semibold text-secondary-800 mb-2 flex items-center gap-2">
                <i class="pi pi-code"></i>
                Ejemplo de uso
              </h4>
              <pre class="text-xs overflow-x-auto"><code>curl -X GET "{{ apiBaseUrl }}/api/v1/products" \
  -H "Authorization: Bearer {{ displayToken }}"</code></pre>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar: Documentation -->
      <div>
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-book text-lg"></i>
              <span>Documentación</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4 text-sm">
              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es el Token API?</h4>
                <p class="text-secondary-600">
                  El token API es una credencial que permite acceder a los datos de tu tienda
                  de forma programática mediante nuestra API REST.
                </p>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">¿Cómo usar el token?</h4>
                <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                  <li>Copia tu token de acceso</li>
                  <li>Inclúyelo en el header Authorization</li>
                  <li>Usa el formato: Bearer [tu-token]</li>
                  <li>Realiza peticiones a los endpoints disponibles</li>
                </ol>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">Seguridad</h4>
                <ul class="space-y-1 text-secondary-600">
                  <li>✓ No compartas tu token</li>
                  <li>✓ Usa HTTPS en producción</li>
                  <li>✓ Renueva el token periódicamente</li>
                  <li>✓ Elimina tokens no utilizados</li>
                </ul>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">Recursos API</h4>
                <ul class="space-y-1 text-secondary-600">
                  <li>• Productos</li>
                  <li>• Pedidos</li>
                  <li>• Clientes</li>
                  <li>• Categorías</li>
                </ul>
              </div>

              <Divider />

              <div>
                <Button
                  label="Ver Documentación"
                  icon="pi pi-external-link"
                  link
                  class="w-full"
                  @click="openDocs"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useApiCredentialsStore } from '@/stores/apiCredentials.store'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()
const apiCredentialsStore = useApiCredentialsStore()

const showToken = ref(false)

const hasToken = computed(() => !!apiCredentialsStore.token)
const displayToken = computed(() => apiCredentialsStore.token || '')
const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL || 'https://api2.mitienda.pe')

onMounted(async () => {
  apiCredentialsStore.clearMessages()
  await apiCredentialsStore.fetchCredentials()
})

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const copyToken = async () => {
  if (!apiCredentialsStore.token) return

  try {
    await navigator.clipboard.writeText(apiCredentialsStore.token)
    toast.add({
      severity: 'success',
      summary: 'Copiado',
      detail: 'Token copiado al portapapeles',
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo copiar el token',
      life: 3000
    })
  }
}

const handleCreateToken = async () => {
  apiCredentialsStore.clearMessages()
  const result = await apiCredentialsStore.createToken()

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Token Creado',
      detail: 'El token ha sido creado exitosamente',
      life: 3000
    })
    showToken.value = true
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'No se pudo crear el token',
      life: 5000
    })
  }
}

const handleRenewToken = () => {
  confirm.require({
    message: '¿Estás seguro de renovar el token? El token actual dejará de funcionar.',
    header: 'Confirmar Renovación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, renovar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      apiCredentialsStore.clearMessages()
      const result = await apiCredentialsStore.renewToken()

      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Token Renovado',
          detail: 'El token ha sido renovado exitosamente',
          life: 3000
        })
        showToken.value = true
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'No se pudo renovar el token',
          life: 5000
        })
      }
    }
  })
}

const handleDeleteToken = () => {
  confirm.require({
    message: '¿Estás seguro de eliminar el token? Esta acción no se puede deshacer.',
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      apiCredentialsStore.clearMessages()
      const result = await apiCredentialsStore.deleteToken()

      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Token Eliminado',
          detail: 'El token ha sido eliminado exitosamente',
          life: 3000
        })
        showToken.value = false
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'No se pudo eliminar el token',
          life: 5000
        })
      }
    }
  })
}

const openDocs = () => {
  // TODO: Update with actual documentation URL
  window.open('https://docs.mitienda.pe/api', '_blank')
}
</script>
