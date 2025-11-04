<template>
  <div class="space-y-6">
    <!-- Información -->
    <Message severity="info" :closable="false">
      <div class="flex items-start gap-2">
        <i class="pi pi-info-circle text-lg"></i>
        <div>
          <p class="font-semibold">Probar Conexión con NetSuite</p>
          <p class="text-sm mt-1">
            Verifica que las credenciales configuradas sean válidas y que puedas conectarte correctamente a NetSuite.
          </p>
        </div>
      </div>
    </Message>

    <!-- Estado de credenciales -->
    <Card>
      <template #content>
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800">Estado de Credenciales</h3>
              <p class="text-sm text-secondary-600 mt-1">Información de las credenciales configuradas</p>
            </div>
            <Tag
              v-if="credentials"
              :value="Number(credentials.tiendacredencialerp_estado) === 1 ? 'Activo' : 'Inactivo'"
              :severity="Number(credentials.tiendacredencialerp_estado) === 1 ? 'success' : 'danger'"
            />
          </div>

          <!-- Sin credenciales -->
          <div v-if="!credentials" class="text-center py-8">
            <i class="pi pi-exclamation-circle text-4xl text-yellow-500 mb-3"></i>
            <p class="text-secondary-600">No hay credenciales configuradas para esta tienda</p>
            <p class="text-sm text-secondary-500 mt-2">Configure las credenciales en la pestaña "Credenciales" primero</p>
          </div>

          <!-- Con credenciales -->
          <div v-else class="space-y-3">
            <div class="flex items-center justify-between py-2">
              <span class="text-sm font-medium text-secondary-700">Account ID:</span>
              <span class="text-sm text-secondary-900 font-mono">{{ credentials.tiendacredencialerp_account_id }}</span>
            </div>

            <Divider />

            <div class="flex items-center justify-between py-2">
              <span class="text-sm font-medium text-secondary-700">Consumer Key:</span>
              <span class="text-sm text-secondary-900 font-mono">{{ maskString(credentials.tiendacredencialerp_consumer_key) }}</span>
            </div>

            <Divider />

            <div class="flex items-center justify-between py-2">
              <span class="text-sm font-medium text-secondary-700">Consumer Secret:</span>
              <span class="text-sm text-secondary-900 font-mono">{{ credentials.tiendacredencialerp_consumer_secret_masked }}</span>
            </div>

            <Divider />

            <div class="flex items-center justify-between py-2">
              <span class="text-sm font-medium text-secondary-700">Token ID:</span>
              <span class="text-sm text-secondary-900 font-mono">{{ maskString(credentials.tiendacredencialerp_token_id) }}</span>
            </div>

            <Divider />

            <div class="flex items-center justify-between py-2">
              <span class="text-sm font-medium text-secondary-700">Token Secret:</span>
              <span class="text-sm text-secondary-900 font-mono">{{ credentials.tiendacredencialerp_token_secret_masked }}</span>
            </div>

            <Divider />

            <div class="flex items-center justify-between py-2">
              <span class="text-sm font-medium text-secondary-700">Subsidiary ID:</span>
              <span class="text-sm text-secondary-900 font-mono">{{ credentials.tiendacredencialerp_subsidiary_id || 'No configurado' }}</span>
            </div>

            <Divider />

            <div class="flex items-center justify-between py-2">
              <span class="text-sm font-medium text-secondary-700">Location ID:</span>
              <span class="text-sm text-secondary-900 font-mono">{{ credentials.tiendacredencialerp_location_id || 'No configurado' }}</span>
            </div>

            <Divider />

            <div class="flex items-center justify-between py-2">
              <span class="text-sm font-medium text-secondary-700">Sincronización Automática:</span>
              <Tag
                :value="Number(credentials.tiendacredencialerp_autosync_enabled) === 1 ? 'Habilitado' : 'Deshabilitado'"
                :severity="Number(credentials.tiendacredencialerp_autosync_enabled) === 1 ? 'success' : 'secondary'"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Prueba de conexión -->
    <Card v-if="credentials">
      <template #content>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-secondary-800">Probar Conexión</h3>
            <p class="text-sm text-secondary-600 mt-1">
              Realiza una prueba de conexión para validar que las credenciales funcionan correctamente
            </p>
          </div>

          <!-- Resultado de la prueba -->
          <div v-if="testResult" class="p-4 rounded-lg border" :class="testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
            <div class="flex items-start gap-3">
              <i :class="testResult.success ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-red-600'" class="text-2xl"></i>
              <div class="flex-1">
                <h4 class="font-semibold" :class="testResult.success ? 'text-green-800' : 'text-red-800'">
                  {{ testResult.success ? 'Conexión Exitosa' : 'Error de Conexión' }}
                </h4>
                <p class="text-sm mt-2" :class="testResult.success ? 'text-green-700' : 'text-red-700'">
                  {{ testResult.message }}
                </p>
                <div v-if="testResult.success && testResult.data" class="mt-3 p-3 bg-white rounded border border-green-200">
                  <div class="flex items-center gap-2 text-sm">
                    <i class="pi pi-info-circle text-secondary-600"></i>
                    <span class="text-secondary-700">Account ID:</span>
                    <span class="font-mono font-semibold text-secondary-900">{{ testResult.data.account_id }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <Message v-if="error" severity="error" :closable="false">
            {{ error }}
          </Message>

          <!-- Botón de prueba -->
          <Button
            label="Probar Conexión"
            icon="pi pi-bolt"
            size="large"
            :loading="isTesting"
            @click="handleTest"
            class="w-full"
          />
        </div>
      </template>
    </Card>

    <!-- Ayuda -->
    <Card>
      <template #content>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-secondary-800">
            <i class="pi pi-question-circle text-lg"></i>
            <h3 class="text-lg font-semibold">¿Problemas con la conexión?</h3>
          </div>

          <div class="space-y-3 text-sm text-secondary-600">
            <div class="flex items-start gap-2">
              <i class="pi pi-check text-green-600 mt-0.5"></i>
              <p>Verifica que las credenciales OAuth 1.0 sean correctas</p>
            </div>
            <div class="flex items-start gap-2">
              <i class="pi pi-check text-green-600 mt-0.5"></i>
              <p>Asegúrate de que el Account ID tenga el formato correcto (ej: 6460294_SB1 para sandbox)</p>
            </div>
            <div class="flex items-start gap-2">
              <i class="pi pi-check text-green-600 mt-0.5"></i>
              <p>Confirma que los tokens no hayan expirado en tu cuenta de NetSuite</p>
            </div>
            <div class="flex items-start gap-2">
              <i class="pi pi-check text-green-600 mt-0.5"></i>
              <p>Revisa los permisos de la integración en NetSuite</p>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNetsuite } from '@/composables/useNetsuite'
import type { TestNetsuiteConnectionResponse } from '@/types/netsuite.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

const props = defineProps<{
  tiendaId: number | null
}>()

const {
  isTesting,
  error,
  credentials,
  getCredentials,
  testConnection,
  clearError
} = useNetsuite()

const testResult = ref<{
  success: boolean
  message: string
  data?: TestNetsuiteConnectionResponse
} | null>(null)

// Watch tiendaId changes and load credentials
watch(() => props.tiendaId, async (tiendaId) => {
  if (!tiendaId) return

  clearError()
  testResult.value = null
  await getCredentials(tiendaId)
}, { immediate: true })

async function handleTest() {
  if (!props.tiendaId) return

  clearError()
  testResult.value = null

  const result = await testConnection(props.tiendaId)

  if (result.success && result.data) {
    testResult.value = {
      success: true,
      message: 'La conexión con NetSuite se estableció correctamente. Las credenciales son válidas.',
      data: result.data
    }
  } else {
    testResult.value = {
      success: false,
      message: result.error || 'No se pudo establecer conexión con NetSuite. Verifica las credenciales e intenta nuevamente.'
    }
  }
}

function maskString(str: string | undefined, visibleChars: number = 8): string {
  if (!str) return '***'
  if (str.length <= visibleChars) return str

  const visible = str.substring(0, visibleChars)
  return `${visible}...`
}
</script>

<style scoped>
:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}
</style>
