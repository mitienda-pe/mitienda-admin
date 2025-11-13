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
              <h4 class="text-base font-semibold text-secondary-800">Locations</h4>
              <p class="text-sm text-secondary-600">Ubicaciones de NetSuite</p>
            </div>
            <Button
              type="button"
              label="Agregar Location"
              icon="pi pi-plus"
              size="small"
              outlined
              @click="openLocationDialog()"
            />
          </div>

          <!-- Locations Table -->
          <div v-if="locations.length > 0" class="border border-secondary-200 rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-secondary-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Location ID</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Nombre</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Sucursal</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold text-secondary-700">Por Defecto</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold text-secondary-700 w-20">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-secondary-200">
                <tr v-for="(location, index) in locations" :key="index" class="hover:bg-secondary-50">
                  <td class="px-4 py-3 text-sm text-secondary-800">{{ location.location_id }}</td>
                  <td class="px-4 py-3 text-sm text-secondary-800">{{ location.location_name }}</td>
                  <td class="px-4 py-3 text-sm text-secondary-600">{{ location.branch_address || '-' }}</td>
                  <td class="px-4 py-3 text-center">
                    <i v-if="location.is_default" class="pi pi-check-circle text-green-600"></i>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <Button
                        icon="pi pi-pencil"
                        size="small"
                        text
                        severity="secondary"
                        @click="openLocationDialog(index)"
                      />
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        text
                        severity="danger"
                        @click="deleteLocation(index)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="p-6 text-center border-2 border-dashed border-secondary-300 rounded-lg">
            <i class="pi pi-map-marker text-3xl text-secondary-400 mb-2"></i>
            <p class="text-secondary-600">No hay locations configuradas</p>
            <p class="text-sm text-secondary-500 mt-1">Agrega al menos una location para NetSuite</p>
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
      :header="editingLocationIndex !== null ? 'Editar Location' : 'Agregar Location'"
      :modal="true"
      :closable="true"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4 py-4">
        <div>
          <label for="dialog_location_id" class="block text-sm font-medium text-secondary-700 mb-2">
            Location ID <span class="text-red-500">*</span>
          </label>
          <InputText
            id="dialog_location_id"
            v-model="locationForm.location_id"
            placeholder="323"
            class="w-full"
            :class="{ 'p-invalid': locationErrors.location_id }"
          />
          <small v-if="locationErrors.location_id" class="text-red-500">{{ locationErrors.location_id }}</small>
        </div>

        <div>
          <label for="dialog_location_name" class="block text-sm font-medium text-secondary-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            id="dialog_location_name"
            v-model="locationForm.location_name"
            placeholder="LAVICTORIA"
            class="w-full"
            :class="{ 'p-invalid': locationErrors.location_name }"
          />
          <small v-if="locationErrors.location_name" class="text-red-500">{{ locationErrors.location_name }}</small>
        </div>

        <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
          <div>
            <label for="dialog_is_default" class="font-medium text-secondary-800 cursor-pointer">
              Location por defecto
            </label>
            <p class="text-sm text-secondary-600 mt-1">
              Usar esta location como predeterminada
            </p>
          </div>
          <InputSwitch
            id="dialog_is_default"
            v-model="locationForm.is_default"
          />
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
            :label="editingLocationIndex !== null ? 'Actualizar' : 'Agregar'"
            @click="saveLocation"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
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

const locationForm = reactive<NetsuiteLocation>({
  location_id: '',
  location_name: '',
  is_default: false
})

const locationErrors = reactive({
  location_id: '',
  location_name: ''
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

  // Load locations from new API
  await loadLocations(tiendaId)
}, { immediate: true })

// Load locations from new sj_netsuite_locations table
const isLoadingLocations = ref(false)
async function loadLocations(tiendaId: number) {
  if (!tiendaId) return

  try {
    isLoadingLocations.value = true
    console.log('[NetsuiteCredentials] Loading locations from API for tienda:', tiendaId)
    const response = await netsuiteApi.getLocations(tiendaId)

    if (response.success && response.data) {
      // Transform API response to match component format
      locations.value = response.data.map((loc: any) => ({
        id: loc.id,
        tiendadireccion_id: loc.tiendadireccion_id,
        location_id: loc.netsuite_location_id,
        location_name: loc.netsuite_location_name,
        branch_address: loc.branch_address,
        is_default: Boolean(loc.is_default)
      }))
      console.log('[NetsuiteCredentials] Loaded locations:', locations.value)
    } else {
      locations.value = []
    }
  } catch (error: any) {
    console.error('[NetsuiteCredentials] Error loading locations:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las locations',
      life: 3000
    })
    locations.value = []
  } finally {
    isLoadingLocations.value = false
  }
}

// Location dialog functions
function openLocationDialog(index?: number) {
  if (index !== undefined) {
    // Edit mode
    editingLocationIndex.value = index
    const loc = locations.value[index]
    Object.assign(locationForm, {
      location_id: loc.location_id,
      location_name: loc.location_name,
      is_default: loc.is_default
    })
  } else {
    // Add mode
    editingLocationIndex.value = null
    Object.assign(locationForm, {
      location_id: '',
      location_name: '',
      is_default: locations.value.length === 0 // First location is default by default
    })
  }

  // Clear errors
  locationErrors.location_id = ''
  locationErrors.location_name = ''

  locationDialogVisible.value = true
}

function closeLocationDialog() {
  locationDialogVisible.value = false
  editingLocationIndex.value = null
}

function validateLocationForm(): boolean {
  locationErrors.location_id = ''
  locationErrors.location_name = ''

  let valid = true

  if (!locationForm.location_id.trim()) {
    locationErrors.location_id = 'Location ID es obligatorio'
    valid = false
  }

  if (!locationForm.location_name.trim()) {
    locationErrors.location_name = 'Nombre es obligatorio'
    valid = false
  }

  // Check for duplicate location_id (only if not editing the same location)
  const duplicateIndex = locations.value.findIndex(loc => loc.location_id === locationForm.location_id)
  if (duplicateIndex !== -1 && duplicateIndex !== editingLocationIndex.value) {
    locationErrors.location_id = 'Este Location ID ya existe'
    valid = false
  }

  return valid
}

function saveLocation() {
  if (!validateLocationForm()) return

  const newLocation: NetsuiteLocation = {
    location_id: locationForm.location_id.trim(),
    location_name: locationForm.location_name.trim(),
    is_default: locationForm.is_default
  }

  // If this is set as default, unset others
  if (newLocation.is_default) {
    locations.value.forEach(loc => {
      loc.is_default = false
    })
  }

  if (editingLocationIndex.value !== null) {
    // Update existing
    locations.value[editingLocationIndex.value] = newLocation
  } else {
    // Add new
    locations.value.push(newLocation)
  }

  closeLocationDialog()
}

function deleteLocation(index: number) {
  const location = locations.value[index]

  confirm.require({
    message: `¿Eliminar la location "${location.location_name}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: () => {
      const wasDefault = location.is_default
      locations.value.splice(index, 1)

      // If deleted location was default, set first remaining as default
      if (wasDefault && locations.value.length > 0) {
        locations.value[0].is_default = true
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
