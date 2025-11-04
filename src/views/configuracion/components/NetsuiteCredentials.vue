<template>
  <div>
    <!-- Estado actual -->
    <div v-if="credentials" class="mb-6 p-4 rounded-lg" :class="Number(credentials.tiendacredencialerp_estado) === 1 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
      <div class="flex items-start gap-3">
        <i :class="Number(credentials.tiendacredencialerp_estado) === 1 ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-yellow-600'" class="text-xl"></i>
        <div>
          <h3 class="font-semibold" :class="Number(credentials.tiendacredencialerp_estado) === 1 ? 'text-green-800' : 'text-yellow-800'">
            {{ Number(credentials.tiendacredencialerp_estado) === 1 ? 'NetSuite configurado' : 'NetSuite inactivo' }}
          </h3>
          <p class="text-sm mt-1" :class="Number(credentials.tiendacredencialerp_estado) === 1 ? 'text-green-700' : 'text-yellow-700'">
            {{ Number(credentials.tiendacredencialerp_estado) === 1
              ? 'Tus credenciales están guardadas. Puedes actualizarlas o probar la conexión.'
              : 'Las credenciales están configuradas pero desactivadas.'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Credenciales OAuth -->
      <div>
        <h3 class="text-lg font-semibold text-secondary-800 mb-4">Credenciales OAuth 1.0</h3>

        <div class="space-y-4">
          <div>
            <label for="account_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Account ID <span class="text-red-500">*</span>
            </label>
            <InputText
              id="account_id"
              v-model="formData.account_id"
              placeholder="6460294_SB1"
              class="w-full"
              :class="{ 'p-invalid': errors.account_id }"
            />
            <small v-if="errors.account_id" class="text-red-500">{{ errors.account_id }}</small>
            <small class="text-secondary-600 mt-1 block">
              Formato: XXXXXXX_SB1 (sandbox) o XXXXXXX (producción)
            </small>
          </div>

          <div>
            <label for="consumer_key" class="block text-sm font-medium text-secondary-700 mb-2">
              Consumer Key <span class="text-red-500">*</span>
            </label>
            <InputText
              id="consumer_key"
              v-model="formData.consumer_key"
              placeholder="Consumer Key de NetSuite"
              class="w-full"
              :class="{ 'p-invalid': errors.consumer_key }"
            />
            <small v-if="errors.consumer_key" class="text-red-500">{{ errors.consumer_key }}</small>
          </div>

          <div>
            <label for="consumer_secret" class="block text-sm font-medium text-secondary-700 mb-2">
              Consumer Secret {{ isEdit ? '' : '*' }}
            </label>
            <Password
              id="consumer_secret"
              v-model="formData.consumer_secret"
              :placeholder="isEdit ? 'Dejar vacío para mantener actual' : 'Consumer Secret de NetSuite'"
              class="w-full"
              :class="{ 'p-invalid': errors.consumer_secret }"
              :feedback="false"
              toggleMask
            />
            <small v-if="errors.consumer_secret" class="text-red-500">{{ errors.consumer_secret }}</small>
            <div v-if="isEdit" class="mt-2">
              <div v-if="hasConsumerSecret" class="flex items-center gap-2 text-sm">
                <i class="pi pi-check-circle text-green-600"></i>
                <span class="text-green-700">Secret guardado: {{ credentials?.tiendacredencialerp_consumer_secret_masked || '***' }}</span>
              </div>
              <div v-else class="flex items-center gap-2 text-sm p-2 bg-red-50 border border-red-200 rounded">
                <i class="pi pi-exclamation-triangle text-red-600"></i>
                <span class="text-red-700 font-medium">No hay secret guardado. Debes proporcionar uno para probar la conexión.</span>
              </div>
            </div>
          </div>

          <div>
            <label for="token_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Token ID <span class="text-red-500">*</span>
            </label>
            <InputText
              id="token_id"
              v-model="formData.token_id"
              placeholder="Token ID de NetSuite"
              class="w-full"
              :class="{ 'p-invalid': errors.token_id }"
            />
            <small v-if="errors.token_id" class="text-red-500">{{ errors.token_id }}</small>
          </div>

          <div>
            <label for="token_secret" class="block text-sm font-medium text-secondary-700 mb-2">
              Token Secret {{ isEdit ? '' : '*' }}
            </label>
            <Password
              id="token_secret"
              v-model="formData.token_secret"
              :placeholder="isEdit ? 'Dejar vacío para mantener actual' : 'Token Secret de NetSuite'"
              class="w-full"
              :class="{ 'p-invalid': errors.token_secret }"
              :feedback="false"
              toggleMask
            />
            <small v-if="errors.token_secret" class="text-red-500">{{ errors.token_secret }}</small>
            <div v-if="isEdit" class="mt-2">
              <div v-if="hasTokenSecret" class="flex items-center gap-2 text-sm">
                <i class="pi pi-check-circle text-green-600"></i>
                <span class="text-green-700">Secret guardado: {{ credentials?.tiendacredencialerp_token_secret_masked || '***' }}</span>
              </div>
              <div v-else class="flex items-center gap-2 text-sm p-2 bg-red-50 border border-red-200 rounded">
                <i class="pi pi-exclamation-triangle text-red-600"></i>
                <span class="text-red-700 font-medium">No hay secret guardado. Debes proporcionar uno para probar la conexión.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Configuración NetSuite -->
      <div>
        <h3 class="text-lg font-semibold text-secondary-800 mb-4">Configuración de NetSuite</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="subsidiary_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Subsidiary ID
            </label>
            <InputText
              id="subsidiary_id"
              v-model="formData.subsidiary_id"
              placeholder="3"
              class="w-full"
            />
            <small class="text-secondary-600 mt-1 block">ID de la subsidiaria en NetSuite</small>
          </div>

          <div>
            <label for="location_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Location ID
            </label>
            <InputText
              id="location_id"
              v-model="formData.location_id"
              placeholder="323"
              class="w-full"
            />
            <small class="text-secondary-600 mt-1 block">ID de ubicación por defecto</small>
          </div>

          <div>
            <label for="ubicacion_serie_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Ubicación Serie ID
            </label>
            <InputText
              id="ubicacion_serie_id"
              v-model="formData.ubicacion_serie_id"
              placeholder="323"
              class="w-full"
            />
            <small class="text-secondary-600 mt-1 block">Para custbody_pe_ubicacion_para_serie</small>
          </div>
        </div>
      </div>

      <Divider />

      <!-- Opciones -->
      <div>
        <h3 class="text-lg font-semibold text-secondary-800 mb-4">Opciones</h3>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <label for="autosync_enabled" class="font-medium text-secondary-800 cursor-pointer">
                Sincronización Automática
              </label>
              <p class="text-sm text-secondary-600 mt-1">
                Sincronizar automáticamente al cambiar orden a estado PAGADO
              </p>
            </div>
            <InputSwitch
              id="autosync_enabled"
              v-model="formData.autosync_enabled"
            />
          </div>

          <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <label for="estado" class="font-medium text-secondary-800 cursor-pointer">
                Estado
              </label>
              <p class="text-sm text-secondary-600 mt-1">
                Activar o desactivar las credenciales de NetSuite
              </p>
            </div>
            <InputSwitch
              id="estado"
              v-model="estadoBoolean"
            />
          </div>
        </div>
      </div>

      <!-- Mensajes de error -->
      <Message v-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <!-- Botones de acción -->
      <div class="flex gap-3 pt-4">
        <Button
          type="submit"
          :label="isEdit ? 'Actualizar credenciales' : 'Guardar credenciales'"
          icon="pi pi-save"
          :loading="isSaving"
          size="large"
        />
        <Button
          v-if="isEdit"
          type="button"
          label="Probar conexión"
          icon="pi pi-bolt"
          severity="info"
          outlined
          :loading="isTesting"
          @click="handleTest"
          size="large"
        />
        <Button
          v-if="isEdit && credentials"
          type="button"
          label="Eliminar"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="handleDelete"
          size="large"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useNetsuite } from '@/composables/useNetsuite'
import type { SaveNetsuiteCredentialsRequest } from '@/types/netsuite.types'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import InputSwitch from 'primevue/inputswitch'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const props = defineProps<{
  tiendaId: number | null
}>()

const emit = defineEmits<{
  (e: 'credentials-saved'): void
}>()

const toast = useToast()
const confirm = useConfirm()

const {
  isSaving,
  isTesting,
  error,
  credentials,
  getCredentials,
  saveCredentials,
  testConnection,
  deleteCredentials,
  clearError
} = useNetsuite()

const isEdit = ref(false)

const formData = reactive<Partial<SaveNetsuiteCredentialsRequest>>({
  tienda_id: props.tiendaId || 0,
  account_id: '',
  consumer_key: '',
  consumer_secret: '',
  token_id: '',
  token_secret: '',
  subsidiary_id: '3',
  location_id: '323',
  ubicacion_serie_id: '323',
  autosync_enabled: false,
  estado: 1
})

const errors = reactive({
  account_id: '',
  consumer_key: '',
  consumer_secret: '',
  token_id: '',
  token_secret: ''
})

// Computed properties para convertir entre boolean y number
const estadoBoolean = computed({
  get: () => formData.estado === 1,
  set: (val: boolean) => { formData.estado = val ? 1 : 0 }
})

// Computed para verificar si existen secrets guardados
const hasConsumerSecret = computed(() => {
  return credentials.value?.tiendacredencialerp_consumer_secret_masked !== null &&
         credentials.value?.tiendacredencialerp_consumer_secret_masked !== undefined &&
         credentials.value?.tiendacredencialerp_consumer_secret_masked !== ''
})

const hasTokenSecret = computed(() => {
  return credentials.value?.tiendacredencialerp_token_secret_masked !== null &&
         credentials.value?.tiendacredencialerp_token_secret_masked !== undefined &&
         credentials.value?.tiendacredencialerp_token_secret_masked !== ''
})

// Watch tiendaId changes and load credentials
watch(() => props.tiendaId, async (tiendaId) => {
  if (!tiendaId) return

  console.log('[NetsuiteCredentials] watch tiendaId:', tiendaId)
  clearError()
  const creds = await getCredentials(tiendaId)

  console.log('[NetsuiteCredentials] received credentials:', creds)

  if (creds) {
    isEdit.value = true

    console.log('[NetsuiteCredentials] Loading credentials into form:')
    console.log('  - estado (raw):', creds.tiendacredencialerp_estado, typeof creds.tiendacredencialerp_estado)
    console.log('  - autosync (raw):', creds.tiendacredencialerp_autosync_enabled, typeof creds.tiendacredencialerp_autosync_enabled)

    Object.assign(formData, {
      tienda_id: tiendaId,
      account_id: creds.tiendacredencialerp_account_id,
      consumer_key: creds.tiendacredencialerp_consumer_key,
      consumer_secret: '', // No cargar secrets
      token_id: creds.tiendacredencialerp_token_id,
      token_secret: '',
      subsidiary_id: creds.tiendacredencialerp_subsidiary_id || '3',
      location_id: creds.tiendacredencialerp_location_id || '323',
      ubicacion_serie_id: creds.tiendacredencialerp_ubicacion_serie_id || '323',
      autosync_enabled: Number(creds.tiendacredencialerp_autosync_enabled) === 1,
      estado: Number(creds.tiendacredencialerp_estado)
    })

    console.log('[NetsuiteCredentials] formData after assign:')
    console.log('  - estado:', formData.estado, typeof formData.estado)
    console.log('  - autosync_enabled:', formData.autosync_enabled, typeof formData.autosync_enabled)
    console.log('  - estadoBoolean computed:', estadoBoolean.value)
  } else {
    console.log('[NetsuiteCredentials] No credentials found, resetting form')
    isEdit.value = false
    // Reset form
    Object.assign(formData, {
      tienda_id: tiendaId,
      account_id: '',
      consumer_key: '',
      consumer_secret: '',
      token_id: '',
      token_secret: '',
      subsidiary_id: '3',
      location_id: '323',
      ubicacion_serie_id: '323',
      autosync_enabled: false,
      estado: 1
    })
  }
}, { immediate: true })

function validateForm(): boolean {
  // Clear previous errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let valid = true

  if (!formData.account_id?.trim()) {
    errors.account_id = 'Account ID es obligatorio'
    valid = false
  }

  if (!formData.consumer_key?.trim()) {
    errors.consumer_key = 'Consumer Key es obligatorio'
    valid = false
  }

  if (!isEdit.value && !formData.consumer_secret?.trim()) {
    errors.consumer_secret = 'Consumer Secret es obligatorio'
    valid = false
  }

  if (!formData.token_id?.trim()) {
    errors.token_id = 'Token ID es obligatorio'
    valid = false
  }

  if (!isEdit.value && !formData.token_secret?.trim()) {
    errors.token_secret = 'Token Secret es obligatorio'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return
  if (!props.tiendaId) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Seleccione una tienda',
      life: 3000
    })
    return
  }

  clearError()

  console.log('[NetsuiteCredentials] handleSubmit - formData before payload:')
  console.log('  - estado:', formData.estado, typeof formData.estado)
  console.log('  - autosync_enabled:', formData.autosync_enabled, typeof formData.autosync_enabled)

  // Preparar payload
  const payload: SaveNetsuiteCredentialsRequest = {
    tienda_id: props.tiendaId,
    account_id: formData.account_id!,
    consumer_key: formData.consumer_key!,
    token_id: formData.token_id!,
    subsidiary_id: formData.subsidiary_id,
    location_id: formData.location_id,
    ubicacion_serie_id: formData.ubicacion_serie_id,
    autosync_enabled: formData.autosync_enabled || false,
    estado: formData.estado || 1
  }

  // Solo incluir secrets si se proporcionaron
  if (formData.consumer_secret?.trim()) {
    payload.consumer_secret = formData.consumer_secret
    console.log('[NetsuiteCredentials] Including consumer_secret in payload (length:', formData.consumer_secret.length, ')')
  } else {
    console.log('[NetsuiteCredentials] NOT including consumer_secret (empty or whitespace)')
  }
  if (formData.token_secret?.trim()) {
    payload.token_secret = formData.token_secret
    console.log('[NetsuiteCredentials] Including token_secret in payload (length:', formData.token_secret.length, ')')
  } else {
    console.log('[NetsuiteCredentials] NOT including token_secret (empty or whitespace)')
  }

  console.log('[NetsuiteCredentials] handleSubmit - final payload:')
  console.log('  - estado:', payload.estado, typeof payload.estado)
  console.log('  - autosync_enabled:', payload.autosync_enabled, typeof payload.autosync_enabled)
  console.log('  - has consumer_secret:', !!payload.consumer_secret)
  console.log('  - has token_secret:', !!payload.token_secret)

  const result = await saveCredentials(payload)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: isEdit.value ? 'Credenciales actualizadas' : 'Credenciales guardadas',
      life: 3000
    })
    emit('credentials-saved')
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error || 'No se pudieron guardar las credenciales',
      life: 5000
    })
  }
}

async function handleTest() {
  if (!props.tiendaId) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Seleccione una tienda',
      life: 3000
    })
    return
  }

  clearError()

  const result = await testConnection(props.tiendaId)

  if (result.success && result.data) {
    toast.add({
      severity: 'success',
      summary: 'Conexión exitosa',
      detail: `Conectado a cuenta ${result.data.account_id}`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error de conexión',
      detail: result.error || 'No se pudo conectar con NetSuite',
      life: 5000
    })
  }
}

function handleDelete() {
  if (!credentials.value) return

  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de NetSuite?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await deleteCredentials(credentials.value!.tiendacredencialerp_id)

      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Eliminadas',
          detail: 'Credenciales eliminadas exitosamente',
          life: 3000
        })
        isEdit.value = false
        // Reset form
        Object.assign(formData, {
          account_id: '',
          consumer_key: '',
          consumer_secret: '',
          token_id: '',
          token_secret: '',
          subsidiary_id: '3',
          location_id: '323',
          ubicacion_serie_id: '323',
          autosync_enabled: false,
          estado: 1
        })
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'No se pudieron eliminar las credenciales',
          life: 5000
        })
      }
    }
  })
}
</script>

<style scoped>
:deep(.p-inputtext),
:deep(.p-password input) {
  border: 1px solid #d1d5db !important;
}
</style>
