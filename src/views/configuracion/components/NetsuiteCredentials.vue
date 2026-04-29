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

          <div>
            <label for="generic_customer_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Generic Customer ID
            </label>
            <InputText
              id="generic_customer_id"
              v-model="formData.generic_customer_id"
              placeholder="32797"
              class="w-full"
            />
            <small class="text-secondary-600 mt-1 block">Cliente genérico para ventas &lt;700 soles sin DNI</small>
          </div>

          <div>
            <label for="bonification_item_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Bonification Item ID
            </label>
            <InputText
              id="bonification_item_id"
              v-model="formData.bonification_item_id"
              placeholder="536"
              class="w-full"
            />
            <small class="text-secondary-600 mt-1 block">Item para productos bonificados (gratis)</small>
          </div>

          <div>
            <label for="price_level_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Price Level ID
            </label>
            <InputNumber
              id="price_level_id"
              v-model="formData.price_level_id"
              placeholder="4"
              class="w-full"
              :min="1"
            />
            <small class="text-secondary-600 mt-1 block">Nivel de precio en NetSuite (ej: 4 = Tiendas / Ecommerce)</small>
          </div>

          <div>
            <label for="customer_category_id" class="block text-sm font-medium text-secondary-700 mb-2">
              Customer Category ID
            </label>
            <InputText
              id="customer_category_id"
              v-model="formData.customer_category_id"
              placeholder="4"
              class="w-full"
            />
            <small class="text-secondary-600 mt-1 block">Categoría de cliente en NetSuite para filtrar promociones (ej: 4 = TIENDAS)</small>
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
          <div class="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div class="flex gap-2">
              <i class="pi pi-info-circle text-primary mt-0.5"></i>
              <div class="text-sm text-primary">
                <p class="font-medium mb-1">Configuración por sucursal:</p>
                <ul class="list-disc list-inside ml-2 space-y-1">
                  <li><strong>Location ID</strong>: ubicación NetSuite (inventario + facturación)</li>
                  <li><strong>Series</strong> y <strong>Generic Customer</strong>: opcionales, sobrescriben el default de tienda</li>
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
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Location ID</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Serie Boleta</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Serie Factura</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-secondary-700">Generic Customer</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold text-secondary-700 w-20">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-secondary-200">
                <tr v-for="(location, index) in locations" :key="location.tiendadireccion_id" class="hover:bg-secondary-50">
                  <td class="px-4 py-3 text-sm font-medium text-secondary-800">
                    <div>{{ location.branch_name }}</div>
                    <div class="text-xs text-secondary-500">{{ location.branch_address || '-' }}</div>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span v-if="location.netsuite_location_id" class="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 font-mono text-xs">
                      {{ location.netsuite_location_id }}
                    </span>
                    <span v-else class="text-secondary-400 italic text-xs">Sin asignar</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <template v-if="getBranchConfig(location.tiendadireccion_id)?.serie_boleta_is_override">
                      <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-xs">
                        {{ getBranchConfig(location.tiendadireccion_id)?.serie_boleta_netsuite_id }}
                      </span>
                      <div class="text-xs text-secondary-500 mt-0.5">override</div>
                    </template>
                    <template v-else-if="branchesDefaults.serie_boleta_netsuite_id">
                      <span class="font-mono text-xs text-secondary-500">{{ branchesDefaults.serie_boleta_netsuite_id }}</span>
                      <div class="text-xs text-secondary-400">de tienda</div>
                    </template>
                    <span v-else class="text-secondary-400 italic text-xs">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <template v-if="getBranchConfig(location.tiendadireccion_id)?.serie_factura_is_override">
                      <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-xs">
                        {{ getBranchConfig(location.tiendadireccion_id)?.serie_factura_netsuite_id }}
                      </span>
                      <div class="text-xs text-secondary-500 mt-0.5">override</div>
                    </template>
                    <template v-else-if="branchesDefaults.serie_factura_netsuite_id">
                      <span class="font-mono text-xs text-secondary-500">{{ branchesDefaults.serie_factura_netsuite_id }}</span>
                      <div class="text-xs text-secondary-400">de tienda</div>
                    </template>
                    <span v-else class="text-secondary-400 italic text-xs">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <template v-if="getBranchConfig(location.tiendadireccion_id)?.generic_customer_is_override">
                      <span class="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-mono text-xs">
                        {{ getBranchConfig(location.tiendadireccion_id)?.generic_customer_id }}
                      </span>
                      <div class="text-xs text-secondary-500 mt-0.5">override</div>
                    </template>
                    <template v-else-if="branchesDefaults.generic_customer_id">
                      <span class="font-mono text-xs text-secondary-500">{{ branchesDefaults.generic_customer_id }}</span>
                      <div class="text-xs text-secondary-400">de tienda</div>
                    </template>
                    <span v-else class="text-secondary-400 italic text-xs">—</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <Button
                      icon="pi pi-pencil"
                      size="small"
                      text
                      severity="secondary"
                      @click="openLocationDialog(index)"
                      v-tooltip.top="'Editar configuración'"
                    />
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
              <label for="delegate_billing" class="font-medium text-secondary-800 cursor-pointer">
                Delegar Facturación a NetSuite
              </label>
              <p class="text-sm text-secondary-600 mt-1">
                NetSuite emite los comprobantes. No se usa Nubefact para facturación automática.
              </p>
            </div>
            <InputSwitch
              id="delegate_billing"
              v-model="formData.delegate_billing"
            />
          </div>

          <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <label for="stock_validation" class="font-medium text-secondary-800 cursor-pointer">
                Validación de Stock en NetSuite
              </label>
              <p class="text-sm text-secondary-600 mt-1">
                Validar disponibilidad de stock en NetSuite antes de confirmar ventas
              </p>
            </div>
            <InputSwitch
              id="stock_validation"
              v-model="stockValidationEnabled"
              :disabled="isTogglingStockValidation"
              @change="handleStockValidationToggle"
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
      header="Configuración NetSuite por sucursal"
      :modal="true"
      :closable="true"
      :style="{ width: '600px' }"
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

        <!-- NetSuite Location ID -->
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
            Inventario + ubicación para serie de facturación
          </small>
        </div>

        <Divider />
        <p class="text-xs text-secondary-600 -mt-2">
          Los siguientes campos son opcionales. Si los dejas vacíos, esta sucursal usa la configuración general de la tienda.
        </p>

        <!-- Serie Boleta override -->
        <div>
          <label for="dialog_serie_boleta" class="block text-sm font-medium text-secondary-700 mb-2">
            Serie Boleta (NetSuite ID)
          </label>
          <InputText
            id="dialog_serie_boleta"
            v-model="locationForm.serie_boleta_netsuite_id"
            :placeholder="branchesDefaults.serie_boleta_netsuite_id ? `Default: ${branchesDefaults.serie_boleta_netsuite_id}` : 'Sin default de tienda'"
            class="w-full"
          />
          <small class="text-secondary-600 mt-1 block">
            Override de la serie boleta para esta sucursal. Vacío = usa la de la tienda.
          </small>
        </div>

        <!-- Serie Factura override -->
        <div>
          <label for="dialog_serie_factura" class="block text-sm font-medium text-secondary-700 mb-2">
            Serie Factura (NetSuite ID)
          </label>
          <InputText
            id="dialog_serie_factura"
            v-model="locationForm.serie_factura_netsuite_id"
            :placeholder="branchesDefaults.serie_factura_netsuite_id ? `Default: ${branchesDefaults.serie_factura_netsuite_id}` : 'Sin default de tienda'"
            class="w-full"
          />
          <small class="text-secondary-600 mt-1 block">
            Override de la serie factura para esta sucursal. Vacío = usa la de la tienda.
          </small>
        </div>

        <!-- Generic Customer override -->
        <div>
          <label for="dialog_generic_customer" class="block text-sm font-medium text-secondary-700 mb-2">
            Generic Customer ID
          </label>
          <InputText
            id="dialog_generic_customer"
            v-model="locationForm.generic_customer_id"
            :placeholder="branchesDefaults.generic_customer_id ? `Default: ${branchesDefaults.generic_customer_id}` : 'Sin default de tienda'"
            class="w-full"
          />
          <small class="text-secondary-600 mt-1 block">
            Cliente genérico para ventas &lt; 700 sin DNI. Vacío = usa el de la tienda.
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
import InputNumber from 'primevue/inputnumber'
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

// Stock validation toggle
const stockValidationEnabled = ref(false)
const isTogglingStockValidation = ref(false)

const formData = reactive<Partial<SaveNetsuiteCredentialsRequest>>({
  tienda_id: props.tiendaId || 0,
  account_id: '',
  consumer_key: '',
  consumer_secret: '',
  token_id: '',
  token_secret: '',
  subsidiary_id: '',
  location_id: '', // Deprecated - kept for backward compatibility
  ubicacion_serie_id: '',
  generic_customer_id: '',
  bonification_item_id: '',
  price_level_id: undefined,
  customer_category_id: '',
  autosync_enabled: false,
  delegate_billing: false,
  estado: 1
})

// Locations management
const locations = ref<NetsuiteLocation[]>([])
const locationDialogVisible = ref(false)
const editingLocationIndex = ref<number | null>(null)

// Branch-level overrides (series + generic customer per sucursal)
interface BranchConfig {
  tiendadireccion_id: number
  branch_name: string
  branch_address: string
  netsuite_location_id: string | null
  generic_customer_id: string | null
  generic_customer_is_override: boolean
  serie_boleta_netsuite_id: string | null
  serie_boleta_is_override: boolean
  serie_factura_netsuite_id: string | null
  serie_factura_is_override: boolean
}
const branchesConfig = ref<BranchConfig[]>([])
const branchesDefaults = reactive({
  generic_customer_id: null as string | null,
  serie_boleta_netsuite_id: null as string | null,
  serie_factura_netsuite_id: null as string | null,
})

function getBranchConfig(branchId: number | string): BranchConfig | undefined {
  const id = Number(branchId)
  return branchesConfig.value.find(b => Number(b.tiendadireccion_id) === id)
}

const locationForm = reactive({
  tiendadireccion_id: 0,
  branch_name: '',
  branch_address: '',
  netsuite_location_id: '',
  serie_boleta_netsuite_id: '',
  serie_factura_netsuite_id: '',
  generic_customer_id: ''
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

  clearError()
  const creds = await getCredentials(tiendaId)

  if (creds) {
    isEdit.value = true

    Object.assign(formData, {
      tienda_id: tiendaId,
      account_id: creds.tiendacredencialerp_account_id,
      consumer_key: creds.tiendacredencialerp_consumer_key,
      consumer_secret: '', // No cargar secrets
      token_id: creds.tiendacredencialerp_token_id,
      token_secret: '',
      subsidiary_id: creds.tiendacredencialerp_subsidiary_id || '',
      location_id: creds.tiendacredencialerp_location_id || '',
      ubicacion_serie_id: creds.tiendacredencialerp_ubicacion_serie_id || '',
      generic_customer_id: creds.tiendacredencialerp_generic_customer_id || '',
      bonification_item_id: creds.tiendacredencialerp_bonification_item_id || '',
      price_level_id: creds.tiendacredencialerp_price_level_id ?? undefined,
      customer_category_id: creds.tiendacredencialerp_customer_category_id || '',
      autosync_enabled: Number(creds.tiendacredencialerp_autosync_enabled) === 1,
      delegate_billing: Number(creds.tiendacredencialerp_delegate_billing) === 1,
      estado: Number(creds.tiendacredencialerp_estado)
    })

    // Load stock validation status
    stockValidationEnabled.value = !!creds.stock_validation_enabled
  } else {
    isEdit.value = false
    // Reset form
    Object.assign(formData, {
      tienda_id: tiendaId,
      account_id: '',
      consumer_key: '',
      consumer_secret: '',
      token_id: '',
      token_secret: '',
      subsidiary_id: '',
      location_id: '',
      ubicacion_serie_id: '',
      generic_customer_id: '',
      bonification_item_id: '',
      price_level_id: undefined,
      customer_category_id: '',
      autosync_enabled: false,
      delegate_billing: false,
      estado: 1
    })
  }

  // Load locations from new API
  await loadLocations(tiendaId)
  await loadBranchesConfig(tiendaId)
}, { immediate: true })

async function loadBranchesConfig(tiendaId: number) {
  try {
    const response = await netsuiteApi.getBranchesConfig(tiendaId) as any
    if (response.success && response.data) {
      branchesConfig.value = response.data
      const d = response.defaults || {}
      branchesDefaults.generic_customer_id = d.generic_customer_id ?? null
      branchesDefaults.serie_boleta_netsuite_id = d.serie_boleta_netsuite_id ?? null
      branchesDefaults.serie_factura_netsuite_id = d.serie_factura_netsuite_id ?? null
    } else {
      branchesConfig.value = []
    }
  } catch (error) {
    console.error('[NetsuiteCredentials] Error loading branches config:', error)
    branchesConfig.value = []
  }
}

// Load branches with their NetSuite location IDs
const isLoadingLocations = ref(false)
async function loadLocations(tiendaId: number) {
  if (!tiendaId) return

  try {
    isLoadingLocations.value = true
    const response = await netsuiteApi.getLocations(tiendaId)

    if (response.success && response.data) {
      locations.value = response.data
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
  const config = getBranchConfig(branch.tiendadireccion_id)

  Object.assign(locationForm, {
    tiendadireccion_id: branch.tiendadireccion_id,
    branch_name: branch.branch_name,
    branch_address: branch.branch_address,
    netsuite_location_id: branch.netsuite_location_id || '',
    serie_boleta_netsuite_id: config?.serie_boleta_is_override ? (config.serie_boleta_netsuite_id || '') : '',
    serie_factura_netsuite_id: config?.serie_factura_is_override ? (config.serie_factura_netsuite_id || '') : '',
    generic_customer_id: config?.generic_customer_is_override ? (config.generic_customer_id || '') : ''
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
  if (!props.tiendaId) return

  try {
    isSavingLocation.value = true

    // 1. Location ID (siempre actualiza)
    const locResponse = await netsuiteApi.updateBranchLocation(
      locationForm.tiendadireccion_id,
      { netsuite_location_id: locationForm.netsuite_location_id.trim() }
    )

    if (!locResponse.success) {
      throw new Error(locResponse.message || 'No se pudo actualizar el Location ID')
    }

    // 2. Overrides (series + generic customer). Cadena vacía => null borra el override.
    const cfgResponse = await netsuiteApi.updateBranchConfig(
      props.tiendaId,
      locationForm.tiendadireccion_id,
      {
        serie_boleta_netsuite_id: locationForm.serie_boleta_netsuite_id.trim() || null,
        serie_factura_netsuite_id: locationForm.serie_factura_netsuite_id.trim() || null,
        generic_customer_id: locationForm.generic_customer_id.trim() || null,
      }
    )

    if (!cfgResponse.success) {
      throw new Error('No se pudieron guardar los overrides de la sucursal')
    }

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Configuración de sucursal guardada',
      life: 3000
    })

    // Update local state
    if (editingLocationIndex.value !== null) {
      locations.value[editingLocationIndex.value].netsuite_location_id = locationForm.netsuite_location_id.trim()
    }
    await loadBranchesConfig(props.tiendaId)

    closeLocationDialog()
  } catch (error: any) {
    console.error('[NetsuiteCredentials] Error saving branch config:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || error.message || 'Error al guardar la configuración',
      life: 3000
    })
  } finally {
    isSavingLocation.value = false
  }
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

  // Get default location_id for backward compatibility
  const defaultLocation = locations.value.find(loc => loc.is_default)
  const legacyLocationId = defaultLocation?.netsuite_location_id || formData.location_id

  // Preparar payload
  const payload: SaveNetsuiteCredentialsRequest = {
    tienda_id: props.tiendaId,
    account_id: formData.account_id!,
    consumer_key: formData.consumer_key!,
    token_id: formData.token_id!,
    subsidiary_id: formData.subsidiary_id,
    location_id: legacyLocationId, // Deprecated - for backward compatibility
    ubicacion_serie_id: formData.ubicacion_serie_id,
    generic_customer_id: formData.generic_customer_id,
    bonification_item_id: formData.bonification_item_id,
    price_level_id: formData.price_level_id ?? 4,
    customer_category_id: formData.customer_category_id || undefined,
    autosync_enabled: formData.autosync_enabled || false,
    estado: formData.estado || 1,
    locations: locations.value.length > 0 ? locations.value : undefined
  }

  // Solo incluir secrets si se proporcionaron
  if (formData.consumer_secret?.trim()) {
    payload.consumer_secret = formData.consumer_secret
  }
  if (formData.token_secret?.trim()) {
    payload.token_secret = formData.token_secret
  }

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

async function handleStockValidationToggle() {
  if (!props.tiendaId) return

  try {
    isTogglingStockValidation.value = true
    const response = await netsuiteApi.updateStockValidation(props.tiendaId, stockValidationEnabled.value)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: stockValidationEnabled.value
          ? 'Validación de stock NetSuite habilitada'
          : 'Validación de stock NetSuite deshabilitada',
        life: 3000
      })
    } else {
      // Revert toggle on error
      stockValidationEnabled.value = !stockValidationEnabled.value
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la configuración',
        life: 3000
      })
    }
  } catch (error: any) {
    // Revert toggle on error
    stockValidationEnabled.value = !stockValidationEnabled.value
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al actualizar configuración',
      life: 3000
    })
  } finally {
    isTogglingStockValidation.value = false
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
          subsidiary_id: '',
          location_id: '',
          ubicacion_serie_id: '',
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
