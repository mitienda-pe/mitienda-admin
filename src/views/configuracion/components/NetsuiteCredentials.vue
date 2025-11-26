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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

        <!-- Locations Section -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="text-base font-semibold text-secondary-800">Sucursales (Branches)</h4>
              <p class="text-sm text-secondary-600">Asigna NetSuite Location IDs a tus sucursales</p>
            </div>
          </div>

          <!-- Info Message -->
          <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex gap-2">
              <i class="pi pi-info-circle text-blue-600 mt-0.5"></i>
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">El mismo Location ID se usa para:</p>
                <ul class="list-disc list-inside ml-2 space-y-1">
                  <li>Inventory location (ubicación de inventario)</li>
                  <li>Invoice series location (ubicación para serie de facturación)</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingLocations" class="flex justify-center items-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-secondary-400"></i>
            <span class="ml-2 text-secondary-600">Cargando sucursales...</span>
          </div>

          <!-- Branches Table -->
          <div v-else-if="locations.length > 0" class="border border-secondary-200 rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-secondary-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Sucursal</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Dirección</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">NetSuite Location ID</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold text-secondary-700 w-20">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-secondary-200">
                <tr v-for="(location, index) in locations" :key="location.tiendadireccion_id" class="hover:bg-secondary-50">
                  <td class="px-4 py-3 text-sm font-medium text-secondary-800">{{ location.branch_name }}</td>
                  <td class="px-4 py-3 text-sm text-secondary-600">{{ location.branch_address || '-' }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span v-if="location.netsuite_location_id" class="inline-flex items-center px-2.5 py-1 rounded-md bg-green-100 text-green-800 font-mono text-xs">
                      {{ location.netsuite_location_id }}
                    </span>
                    <span v-else class="text-secondary-400 italic text-xs">Sin asignar</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Button
                        icon="pi pi-pencil"
                        size="small"
                        text
                        severity="secondary"
                        @click="openLocationDialog(index)"
                        v-tooltip.top="'Editar Location ID'"
                      />
                      <Button
                        v-if="location.netsuite_location_id"
                        icon="pi pi-times"
                        size="small"
                        text
                        severity="danger"
                        @click="clearLocationId(index)"
                        v-tooltip.top="'Limpiar Location ID'"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="p-6 text-center border-2 border-dashed border-secondary-300 rounded-lg">
            <i class="pi pi-map-marker text-3xl text-secondary-400 mb-2"></i>
            <p class="text-secondary-600">No hay sucursales disponibles</p>
            <p class="text-sm text-secondary-500 mt-1">Las sucursales se gestionan desde el módulo de Branches</p>
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

    <!-- Location Dialog -->
    <Dialog
      v-model:visible="locationDialogVisible"
      header="Asignar NetSuite Location ID"
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4 py-4">
        <!-- Branch Info (Read-only) -->
        <div class="p-4 bg-secondary-50 rounded-lg">
          <div class="text-sm">
            <p class="font-medium text-secondary-800 mb-1">Sucursal</p>
            <p class="text-secondary-700">{{ locationForm.branch_name }}</p>
            <p class="text-xs text-secondary-600 mt-1">{{ locationForm.branch_address }}</p>
          </div>
        </div>

        <!-- NetSuite Location ID Input -->
        <div>
          <label for="dialog_location_id" class="block text-sm font-medium text-secondary-700 mb-2">
            NetSuite Location ID <span class="text-red-500">*</span>
          </label>
          <InputText
            id="dialog_location_id"
            v-model="locationForm.netsuite_location_id"
            placeholder="323"
            class="w-full"
            :class="{ 'p-invalid': locationErrors.netsuite_location_id }"
          />
          <small v-if="locationErrors.netsuite_location_id" class="text-red-500">{{ locationErrors.netsuite_location_id }}</small>
          <small v-else class="text-secondary-600 mt-1 block">
            Este ID se usará tanto para inventario como para facturación electrónica
          </small>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            @click="closeLocationDialog"
          />
          <Button
            label="Guardar"
            :loading="isSavingLocation"
            @click="saveLocationId"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useNetsuite } from '@/composables/useNetsuite'
import { netsuiteApi } from '@/api/netsuite.api'
import type { SaveNetsuiteCredentialsRequest, NetsuiteLocation } from '@/types/netsuite.types'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import InputSwitch from 'primevue/inputswitch'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'

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
  location_id: '323', // Deprecated - kept for backward compatibility
  ubicacion_serie_id: '323',
  autosync_enabled: false,
  estado: 1
})

// Locations management
const locations = ref<NetsuiteLocation[]>([])
const locationDialogVisible = ref(false)
const editingLocationIndex = ref<number | null>(null)

const locationForm = reactive({
  tiendadireccion_id: 0,
  branch_name: '',
  branch_address: '',
  netsuite_location_id: ''
})

const locationErrors = reactive({
  netsuite_location_id: ''
})

const isSavingLocation = ref(false)

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

  // Load locations from new API
  await loadLocations(tiendaId)
}, { immediate: true })

// Load branches with their NetSuite location IDs
const isLoadingLocations = ref(false)
async function loadLocations(tiendaId: number) {
  if (!tiendaId) return

  try {
    isLoadingLocations.value = true
    console.log('[NetsuiteCredentials] Loading branches from API for tienda:', tiendaId)
    const response = await netsuiteApi.getLocations(tiendaId)

    if (response.success && response.data) {
      locations.value = response.data
      console.log('[NetsuiteCredentials] Loaded branches:', locations.value)
    } else {
      locations.value = []
    }
  } catch (error: any) {
    console.error('[NetsuiteCredentials] Error loading branches:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las sucursales',
      life: 3000
    })
    locations.value = []
  } finally {
    isLoadingLocations.value = false
  }
}

// Location dialog functions
function openLocationDialog(index: number) {
  editingLocationIndex.value = index
  const branch = locations.value[index]

  Object.assign(locationForm, {
    tiendadireccion_id: branch.tiendadireccion_id,
    branch_name: branch.branch_name,
    branch_address: branch.branch_address,
    netsuite_location_id: branch.netsuite_location_id || ''
  })

  // Clear errors
  locationErrors.netsuite_location_id = ''
  locationDialogVisible.value = true
}

function closeLocationDialog() {
  locationDialogVisible.value = false
  editingLocationIndex.value = null
}

function validateLocationForm(): boolean {
  locationErrors.netsuite_location_id = ''

  if (!locationForm.netsuite_location_id.trim()) {
    locationErrors.netsuite_location_id = 'NetSuite Location ID es obligatorio'
    return false
  }

  return true
}

async function saveLocationId() {
  if (!validateLocationForm()) return

  try {
    isSavingLocation.value = true

    const response = await netsuiteApi.updateBranchLocation(
      locationForm.tiendadireccion_id,
      {
        netsuite_location_id: locationForm.netsuite_location_id.trim()
      }
    )

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Location ID actualizado correctamente',
        life: 3000
      })

      // Update local state
      if (editingLocationIndex.value !== null) {
        locations.value[editingLocationIndex.value].netsuite_location_id = locationForm.netsuite_location_id.trim()
      }

      closeLocationDialog()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: response.message || 'No se pudo actualizar el Location ID',
        life: 3000
      })
    }
  } catch (error: any) {
    console.error('[NetsuiteCredentials] Error updating location ID:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al actualizar el Location ID',
      life: 3000
    })
  } finally {
    isSavingLocation.value = false
  }
}

async function clearLocationId(index: number) {
  const branch = locations.value[index]

  confirm.require({
    message: `¿Limpiar el Location ID de la sucursal "${branch.branch_name}"?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, limpiar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        const response = await netsuiteApi.clearBranchLocation(branch.tiendadireccion_id)

        if (response.success) {
          toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Location ID eliminado correctamente',
            life: 3000
          })

          // Update local state
          locations.value[index].netsuite_location_id = null
        } else {
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo limpiar el Location ID',
            life: 3000
          })
        }
      } catch (error: any) {
        console.error('[NetsuiteCredentials] Error clearing location ID:', error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al limpiar el Location ID',
          life: 3000
        })
      }
    }
  })
}

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

  // Get default location_id for backward compatibility
  const defaultLocation = locations.value.find(loc => loc.is_default)
  const legacyLocationId = defaultLocation?.location_id || formData.location_id

  // Preparar payload
  const payload: SaveNetsuiteCredentialsRequest = {
    tienda_id: props.tiendaId,
    account_id: formData.account_id!,
    consumer_key: formData.consumer_key!,
    token_id: formData.token_id!,
    subsidiary_id: formData.subsidiary_id,
    location_id: legacyLocationId, // Deprecated - for backward compatibility
    ubicacion_serie_id: formData.ubicacion_serie_id,
    autosync_enabled: formData.autosync_enabled || false,
    estado: formData.estado || 1,
    locations: locations.value.length > 0 ? locations.value : undefined
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
        locations.value = []
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
