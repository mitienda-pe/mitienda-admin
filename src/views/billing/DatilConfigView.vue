<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Main Form -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Status -->
      <div
        class="flex items-center gap-3 p-4 rounded-lg"
        :class="isConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'"
      >
        <i
          class="pi text-xl"
          :class="isConfigured ? 'pi-check-circle text-green-600' : 'pi-exclamation-circle text-yellow-600'"
        />
        <div>
          <span class="font-medium" :class="isConfigured ? 'text-green-800' : 'text-yellow-800'">
            {{ isConfigured ? 'Dátil configurado' : 'Dátil no configurado' }}
          </span>
          <p class="text-sm" :class="isConfigured ? 'text-green-600' : 'text-yellow-600'">
            {{ isConfigured ? 'Las credenciales están guardadas correctamente' : 'Ingresa tus credenciales para comenzar a facturar' }}
          </p>
        </div>
      </div>

      <!-- Messages -->
      <Message v-if="billingStore.error" severity="error" :closable="true" @close="billingStore.clearMessages()">
        {{ billingStore.error }}
      </Message>
      <Message v-if="billingStore.successMessage" severity="success" :closable="true" @close="billingStore.clearMessages()">
        {{ billingStore.successMessage }}
      </Message>

      <!-- Credentials -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-key text-primary"></i>
            <span>Credenciales de Dátil</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div>
              <label for="api_key" class="block text-sm font-medium text-gray-700 mb-1">API Key (X-Key) *</label>
              <Password
                id="api_key"
                v-model="formData.api_key"
                class="w-full"
                placeholder="Tu API Key de Dátil"
                :feedback="false"
                toggleMask
              />
            </div>
            <div>
              <label for="certificate_password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña del certificado (.p12) *</label>
              <Password
                id="certificate_password"
                v-model="formData.certificate_password"
                class="w-full"
                :feedback="false"
                toggleMask
                placeholder="Contraseña de tu firma electrónica"
              />
              <small class="text-gray-500">La contraseña de tu certificado digital (.p12) del BCE o Security Data</small>
            </div>
          </div>
        </template>
      </Card>

      <!-- Emisor Info -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-building text-primary"></i>
            <span>Datos del emisor</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="ruc_emisor" class="block text-sm font-medium text-gray-700 mb-1">RUC del emisor *</label>
                <InputText
                  id="ruc_emisor"
                  v-model="formData.ruc_emisor"
                  class="w-full"
                  placeholder="0910000000001"
                  maxlength="13"
                />
              </div>
              <div>
                <label for="razon_social" class="block text-sm font-medium text-gray-700 mb-1">Razón social *</label>
                <InputText
                  id="razon_social"
                  v-model="formData.razon_social"
                  class="w-full"
                  placeholder="Mi Empresa S.A."
                />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="nombre_comercial" class="block text-sm font-medium text-gray-700 mb-1">Nombre comercial</label>
                <InputText
                  id="nombre_comercial"
                  v-model="formData.nombre_comercial"
                  class="w-full"
                  placeholder="Mi Tienda"
                />
              </div>
              <div>
                <label for="direccion_emisor" class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <InputText
                  id="direccion_emisor"
                  v-model="formData.direccion_emisor"
                  class="w-full"
                  placeholder="Av. Principal 123, Quito"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                id="obligado_contabilidad"
                v-model="formData.obligado_contabilidad"
                :binary="true"
              />
              <label for="obligado_contabilidad" class="text-sm text-gray-700 cursor-pointer">Obligado a llevar contabilidad</label>
            </div>
          </div>
        </template>
      </Card>

      <!-- Series & Environment -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-hashtag text-primary"></i>
            <span>Establecimiento y secuencial</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="establecimiento_codigo" class="block text-sm font-medium text-gray-700 mb-1">Código establecimiento</label>
                <InputText
                  id="establecimiento_codigo"
                  v-model="formData.establecimiento_codigo"
                  class="w-full"
                  placeholder="001"
                  maxlength="3"
                />
              </div>
              <div>
                <label for="punto_emision" class="block text-sm font-medium text-gray-700 mb-1">Punto de emisión</label>
                <InputText
                  id="punto_emision"
                  v-model="formData.punto_emision"
                  class="w-full"
                  placeholder="001"
                  maxlength="3"
                />
              </div>
              <div>
                <label for="secuencial" class="block text-sm font-medium text-gray-700 mb-1">Secuencial inicial</label>
                <InputNumber
                  id="secuencial"
                  v-model="formData.secuencial"
                  class="w-full"
                  :min="1"
                />
              </div>
            </div>

            <Divider />

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ambiente</label>
              <div class="flex gap-4">
                <div class="flex items-center gap-2">
                  <RadioButton id="env_test" v-model="formData.environment" value="1" />
                  <label for="env_test" class="cursor-pointer">Pruebas</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton id="env_prod" v-model="formData.environment" value="2" />
                  <label for="env_prod" class="cursor-pointer">Producción</label>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Auto-emission toggle -->
      <div>
        <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
          <div>
            <label for="auto_emission" class="font-medium text-secondary-800 cursor-pointer">
              Emisión automática de comprobantes
            </label>
            <p class="text-sm text-secondary-600 mt-1">
              Emitir facturas automáticamente al aprobar pagos.
            </p>
          </div>
          <InputSwitch
            id="auto_emission"
            v-model="autoEmissionEnabled"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <Button
          :label="isConfigured ? 'Actualizar credenciales' : 'Guardar credenciales'"
          :icon="isConfigured ? 'pi pi-refresh' : 'pi pi-save'"
          :loading="billingStore.isSaving"
          @click="saveCredentials"
        />
        <Button
          v-if="isConfigured"
          label="Probar conexión"
          icon="pi pi-bolt"
          severity="info"
          outlined
          :loading="billingStore.isTesting"
          @click="testConnection"
        />
        <Button
          v-if="isConfigured"
          label="Eliminar"
          icon="pi pi-trash"
          severity="danger"
          text
          @click="confirmDelete"
        />
      </div>
    </div>

    <!-- Sidebar Info -->
    <div class="space-y-6">
      <Card class="bg-primary/5 border border-primary/20">
        <template #content>
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-primary text-xl"></i>
              <h3 class="font-semibold text-secondary-700">¿Qué es Dátil?</h3>
            </div>
            <p class="text-sm text-primary">
              Dátil es un servicio de facturación electrónica para Ecuador que permite emitir comprobantes
              autorizados por el SRI (Servicio de Rentas Internas) de forma automática.
            </p>
            <div class="space-y-2">
              <h4 class="font-medium text-secondary-700 text-sm">Para obtener credenciales:</h4>
              <ol class="text-sm text-primary space-y-1 list-decimal list-inside">
                <li>Crea una cuenta en <strong>datil.com</strong></li>
                <li>Sube tu certificado de firma electrónica (.p12)</li>
                <li>Obtén tu API Key desde Configuración → API</li>
                <li>Copia la contraseña de tu certificado</li>
              </ol>
            </div>
            <div class="space-y-2">
              <h4 class="font-medium text-secondary-700 text-sm">Documentos soportados:</h4>
              <ul class="text-sm text-primary space-y-1">
                <li>• Facturas</li>
                <li>• Notas de crédito</li>
                <li>• Notas de débito</li>
                <li>• Retenciones</li>
                <li>• Guías de remisión</li>
              </ul>
            </div>
            <a
              href="https://datil.com"
              target="_blank"
              class="inline-flex items-center gap-2 text-sm text-primary hover:text-secondary-700 font-medium"
            >
              <i class="pi pi-external-link"></i>
              Ir a Dátil
            </a>
          </div>
        </template>
      </Card>

      <Card class="bg-amber-50 border border-amber-200">
        <template #content>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-amber-600"></i>
              <h3 class="font-semibold text-amber-900 text-sm">Importante</h3>
            </div>
            <ul class="text-sm text-amber-800 space-y-1">
              <li>• Ecuador usa dólar estadounidense (USD)</li>
              <li>• IVA actual: 15%</li>
              <li>• No existe "Boleta" en Ecuador, todo es Factura</li>
              <li>• Necesitas un certificado digital vigente del BCE o Security Data</li>
            </ul>
          </div>
        </template>
      </Card>
    </div>
  </div>

  <!-- Delete Confirmation -->
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useBillingStore } from '@/stores/billing.store'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import ConfirmDialog from 'primevue/confirmdialog'
import Divider from 'primevue/divider'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import RadioButton from 'primevue/radiobutton'

const billingStore = useBillingStore()
const confirm = useConfirm()

const formData = reactive({
  api_key: '',
  certificate_password: '',
  ruc_emisor: '',
  razon_social: '',
  nombre_comercial: '',
  direccion_emisor: '',
  obligado_contabilidad: false,
  establecimiento_codigo: '001',
  punto_emision: '001',
  secuencial: 1,
  environment: '1',
  blocked: true, // blocked = true means auto-emission OFF
})

const isConfigured = computed(() => billingStore.datilConfig?.configured || false)

const autoEmissionEnabled = computed({
  get: () => !formData.blocked,
  set: (val: boolean) => { formData.blocked = !val }
})

onMounted(async () => {
  await billingStore.fetchDatilConfig()
  if (billingStore.datilConfig?.credentials) {
    const creds = billingStore.datilConfig.credentials
    formData.api_key = creds.api_key || ''
    formData.certificate_password = creds.certificate_password || ''
    formData.ruc_emisor = creds.ruc_emisor || ''
    formData.razon_social = creds.razon_social || ''
    formData.nombre_comercial = creds.nombre_comercial || ''
    formData.direccion_emisor = creds.direccion_emisor || ''
    formData.obligado_contabilidad = creds.obligado_contabilidad || false
    formData.establecimiento_codigo = creds.establecimiento_codigo || '001'
    formData.punto_emision = creds.punto_emision || '001'
    formData.secuencial = creds.secuencial || 1
    formData.environment = creds.environment || '1'
    formData.blocked = billingStore.datilConfig.blocked ?? true
  }
})

async function saveCredentials() {
  // Basic validation
  if (!formData.api_key || !formData.certificate_password || !formData.ruc_emisor || !formData.razon_social) {
    billingStore.error = 'Completa todos los campos obligatorios (*)'
    return
  }
  if (formData.ruc_emisor.length !== 13) {
    billingStore.error = 'El RUC debe tener exactamente 13 dígitos'
    return
  }

  const data = { ...formData }

  if (isConfigured.value) {
    await billingStore.updateDatilCredentials(data)
  } else {
    await billingStore.saveDatilCredentials(data)
  }
}

async function testConnection() {
  const result = await billingStore.testDatilConnection()
  if (result.success) {
    billingStore.successMessage = `Conexión exitosa. Ambiente: ${result.data?.environment || 'N/A'}`
  }
}

function confirmDelete() {
  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de Dátil?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await billingStore.deleteDatilCredentials()
    }
  })
}
</script>
