<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-secondary-800">Configuración de Bizlinks</h1>
      <p class="text-secondary-600 mt-1">Configura tus credenciales de facturación electrónica con Bizlinks</p>
    </div>

    <!-- Loading state -->
    <div v-if="billingStore.isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna principal: Formulario -->
      <div class="lg:col-span-2">
        <Card>
          <template #content>
            <!-- Estado actual -->
            <div v-if="config" class="mb-6 p-4 rounded-lg" :class="config.configured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
              <div class="flex items-start gap-3">
                <i :class="config.configured ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-yellow-600'" class="text-xl"></i>
                <div>
                  <h3 class="font-semibold" :class="config.configured ? 'text-green-800' : 'text-yellow-800'">
                    {{ config.configured ? 'Bizlinks configurado' : 'Bizlinks no configurado' }}
                  </h3>
                  <p class="text-sm mt-1" :class="config.configured ? 'text-green-700' : 'text-yellow-700'">
                    {{ config.configured
                      ? 'Tus credenciales están guardadas. Puedes actualizarlas o probar la conexión.'
                      : 'Configura tus credenciales de Bizlinks para empezar a emitir comprobantes electrónicos.'
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Mensajes -->
            <Message v-if="billingStore.error" severity="error" :closable="true" @close="billingStore.clearMessages()" class="mb-4">
              {{ billingStore.error }}
            </Message>
            <Message v-if="billingStore.successMessage" severity="success" :closable="true" @close="billingStore.clearMessages()" class="mb-4">
              {{ billingStore.successMessage }}
            </Message>

            <!-- Formulario -->
            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Modo de conexión -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Modo de conexión</h3>
                <div class="flex items-center gap-6">
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="formData.mode" inputId="mode_rest" value="rest" />
                    <label for="mode_rest" class="cursor-pointer">REST nativo (PSE) — recomendado</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="formData.mode" inputId="mode_proxy" value="proxy" />
                    <label for="mode_proxy" class="cursor-pointer">Proxy (SOAP vía mtbilling)</label>
                  </div>
                </div>
                <small class="text-secondary-600 mt-2 block">
                  REST nativo: emite directo contra el PSE de Bizlinks (sin mtbilling). Proxy: emite por el servicio mtbilling (SOAP). Ambos usan usuario y contraseña.
                </small>
              </div>

              <Divider />

              <!-- Conexión al servidor -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Conexión al servidor Bizlinks</h3>

                <!-- REST/PROXY: usuario y contraseña (mismo layout) -->
                <div v-if="isProxyLayout" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="bizlinks_user" class="block text-sm font-medium text-secondary-700 mb-2">
                      Usuario Bizlinks <span class="text-red-500">*</span>
                    </label>
                    <InputText
                      id="bizlinks_user"
                      v-model="formData.bizlinks_user"
                      placeholder="usuario"
                      class="w-full"
                      :class="{ 'p-invalid': errors.bizlinks_user }"
                    />
                    <small v-if="errors.bizlinks_user" class="text-red-500">{{ errors.bizlinks_user }}</small>
                  </div>
                  <div>
                    <label for="bizlinks_password" class="block text-sm font-medium text-secondary-700 mb-2">
                      Contraseña Bizlinks <span v-if="!config?.configured" class="text-red-500">*</span>
                    </label>
                    <InputText
                      id="bizlinks_password"
                      v-model="formData.bizlinks_password"
                      type="password"
                      placeholder="••••••••"
                      class="w-full"
                      :class="{ 'p-invalid': errors.bizlinks_password }"
                    />
                    <small v-if="errors.bizlinks_password" class="text-red-500">{{ errors.bizlinks_password }}</small>
                    <small class="text-secondary-600 mt-1 block">
                      Se guarda cifrada. Al editar, déjala vacía para conservar la guardada.
                    </small>
                  </div>
                </div>

                <!-- DIRECT: URL y puerto -->
                <div v-else class="space-y-4">
                  <div>
                    <label for="api_url" class="block text-sm font-medium text-secondary-700 mb-2">
                      URL del servidor <span class="text-red-500">*</span>
                    </label>
                    <InputText
                      id="api_url"
                      v-model="formData.api_url"
                      placeholder="https://servidor-bizlinks.empresa.com"
                      class="w-full"
                      :class="{ 'p-invalid': errors.api_url }"
                    />
                    <small v-if="errors.api_url" class="text-red-500">{{ errors.api_url }}</small>
                    <small class="text-secondary-600 mt-1 block">
                      URL base del servidor Bizlinks asignado a tu empresa
                    </small>
                  </div>

                  <div>
                    <label for="puerto" class="block text-sm font-medium text-secondary-700 mb-2">
                      Puerto (opcional)
                    </label>
                    <InputText
                      id="puerto"
                      v-model="formData.puerto"
                      placeholder="8080"
                      class="w-full"
                    />
                    <small class="text-secondary-600 mt-1 block">
                      Solo si tu servidor Bizlinks usa un puerto distinto al estándar
                    </small>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Datos del emisor -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Datos del emisor</h3>

                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="ruc_emisor" class="block text-sm font-medium text-secondary-700 mb-2">
                        RUC <span class="text-red-500">*</span>
                      </label>
                      <InputText
                        id="ruc_emisor"
                        v-model="formData.ruc_emisor"
                        placeholder="20123456789"
                        maxlength="11"
                        class="w-full"
                        :class="{ 'p-invalid': errors.ruc_emisor }"
                      />
                      <small v-if="errors.ruc_emisor" class="text-red-500">{{ errors.ruc_emisor }}</small>
                    </div>

                    <div>
                      <label for="razon_social" class="block text-sm font-medium text-secondary-700 mb-2">
                        Razón social <span class="text-red-500">*</span>
                      </label>
                      <InputText
                        id="razon_social"
                        v-model="formData.razon_social"
                        placeholder="Mi Empresa S.A.C."
                        class="w-full"
                        :class="{ 'p-invalid': errors.razon_social }"
                      />
                      <small v-if="errors.razon_social" class="text-red-500">{{ errors.razon_social }}</small>
                    </div>
                  </div>

                  <div>
                    <label for="nombre_comercial" class="block text-sm font-medium text-secondary-700 mb-2">
                      Nombre comercial
                    </label>
                    <InputText
                      id="nombre_comercial"
                      v-model="formData.nombre_comercial"
                      placeholder="Mi Tienda"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label for="direccion" class="block text-sm font-medium text-secondary-700 mb-2">
                      Dirección fiscal
                    </label>
                    <InputText
                      id="direccion"
                      v-model="formData.direccion"
                      placeholder="Av. Principal 123, Lima"
                      class="w-full"
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="ubigeo" class="block text-sm font-medium text-secondary-700 mb-2">
                        Ubigeo
                      </label>
                      <InputText
                        id="ubigeo"
                        v-model="formData.ubigeo"
                        placeholder="150101"
                        maxlength="6"
                        class="w-full"
                      />
                      <small class="text-secondary-600 mt-1 block">
                        Código INEI de 6 dígitos del distrito
                      </small>
                    </div>

                    <div>
                      <label for="email" class="block text-sm font-medium text-secondary-700 mb-2">
                        Email del emisor
                      </label>
                      <InputText
                        id="email"
                        v-model="formData.email"
                        placeholder="facturacion@empresa.com"
                        class="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Series de documentos -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Series de documentos</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="serie_factura" class="block text-sm font-medium text-secondary-700 mb-2">
                      Serie de factura
                    </label>
                    <InputText
                      id="serie_factura"
                      v-model="formData.serie_factura"
                      placeholder="F001"
                      maxlength="4"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label for="numero_factura" class="block text-sm font-medium text-secondary-700 mb-2">
                      Correlativo factura
                    </label>
                    <InputNumber
                      id="numero_factura"
                      v-model="formData.numero_factura as number | null"
                      placeholder="1"
                      :min="1"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label for="serie_boleta" class="block text-sm font-medium text-secondary-700 mb-2">
                      Serie de boleta
                    </label>
                    <InputText
                      id="serie_boleta"
                      v-model="formData.serie_boleta"
                      placeholder="B001"
                      maxlength="4"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label for="numero_boleta" class="block text-sm font-medium text-secondary-700 mb-2">
                      Correlativo boleta
                    </label>
                    <InputNumber
                      id="numero_boleta"
                      v-model="formData.numero_boleta as number | null"
                      placeholder="1"
                      :min="1"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Ambiente -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Ambiente de facturación</h3>

                <!-- REST/Proxy usan development/production; Directo (legacy) usa produccion/prueba -->
                <div v-if="isProxyLayout" class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="formData.environment" inputId="env_prod_p" value="production" />
                    <label for="env_prod_p" class="cursor-pointer">Producción</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="formData.environment" inputId="env_dev_p" value="development" />
                    <label for="env_dev_p" class="cursor-pointer">Desarrollo (prueba)</label>
                  </div>
                </div>
                <div v-else class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="formData.environment" inputId="env_prod" value="produccion" />
                    <label for="env_prod" class="cursor-pointer">Producción</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="formData.environment" inputId="env_test" value="prueba" />
                    <label for="env_test" class="cursor-pointer">Prueba</label>
                  </div>
                </div>
                <small class="text-secondary-600 mt-2 block">
                  Usa el ambiente de prueba para validar antes de emitir comprobantes reales ante SUNAT
                </small>
              </div>

              <Divider />

              <!-- Formato PDF -->
              <div>
                <h3 class="text-lg font-semibold text-secondary-800 mb-4">Formato de impresión</h3>

                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <RadioButton
                      v-model="formData.pdf_format"
                      inputId="format_a4"
                      value="A4"
                    />
                    <label for="format_a4" class="cursor-pointer">A4 (Estándar)</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton
                      v-model="formData.pdf_format"
                      inputId="format_ticket"
                      value="TICKET"
                    />
                    <label for="format_ticket" class="cursor-pointer">Ticket (80mm)</label>
                  </div>
                </div>
              </div>

              <Divider />

              <!-- Auto-emisión -->
              <div>
                <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <label for="auto_emission" class="font-medium text-secondary-800 cursor-pointer">
                      Emisión automática de comprobantes
                    </label>
                    <p class="text-sm text-secondary-600 mt-1">
                      Emitir comprobantes automáticamente al aprobar pagos.
                    </p>
                  </div>
                  <InputSwitch
                    id="auto_emission"
                    v-model="autoEmissionEnabled"
                  />
                </div>
              </div>

              <!-- Botones de acción -->
              <div class="flex gap-3 pt-4">
                <Button
                  type="submit"
                  :label="config?.configured ? 'Actualizar credenciales' : 'Guardar credenciales'"
                  icon="pi pi-save"
                  :loading="billingStore.isSaving"
                  size="large"
                />
                <Button
                  v-if="config?.configured && !isProxyLayout"
                  type="button"
                  label="Probar conexión"
                  icon="pi pi-bolt"
                  severity="info"
                  outlined
                  :loading="billingStore.isTesting"
                  @click="handleTest"
                  size="large"
                />
                <Button
                  v-if="config?.configured"
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
          </template>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <Card class="bg-primary/5 border border-primary/20">
          <template #content>
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <i class="pi pi-info-circle text-primary text-xl"></i>
                <h3 class="font-semibold text-secondary-700">¿Qué es Bizlinks?</h3>
              </div>
              <p class="text-sm text-primary">
                Bizlinks es una solución empresarial de facturación electrónica certificada como OSE
                (Operador de Servicios Electrónicos) ante SUNAT.
              </p>
              <div class="space-y-2">
                <h4 class="font-medium text-secondary-700 text-sm">Para obtener credenciales:</h4>
                <ol class="text-sm text-primary space-y-1 list-decimal list-inside">
                  <li>Contacta a tu ejecutivo de Bizlinks</li>
                  <li>Solicita la URL del servidor asignado a tu empresa</li>
                  <li>Confirma el ambiente (prueba o producción)</li>
                  <li>Verifica las series autorizadas en SUNAT</li>
                </ol>
              </div>
              <div class="space-y-2">
                <h4 class="font-medium text-secondary-700 text-sm">Documentos soportados:</h4>
                <ul class="text-sm text-primary space-y-1">
                  <li>✓ Facturas</li>
                  <li>✓ Boletas de venta</li>
                  <li>✓ Notas de crédito</li>
                  <li>✓ Notas de débito</li>
                </ul>
              </div>
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
                <li>• El RUC debe tener exactamente 11 dígitos</li>
                <li>• Usa siempre prueba antes de producción</li>
                <li>• Las series deben estar dadas de alta en SUNAT</li>
                <li>• Solo puedes tener un proveedor de facturación activo</li>
              </ul>
            </div>
          </template>
        </Card>
      </div>
    </div>
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import ConfirmDialog from 'primevue/confirmdialog'
import { useBillingStore } from '@/stores/billing.store'
import type { SaveBizlinksCredentialsRequest } from '@/types/billing.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import RadioButton from 'primevue/radiobutton'
import InputSwitch from 'primevue/inputswitch'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()
const billingStore = useBillingStore()

const config = ref(billingStore.bizlinksConfig)

const formData = reactive<SaveBizlinksCredentialsRequest>({
  mode: 'rest',
  api_url: '',
  puerto: '',
  bizlinks_user: '',
  bizlinks_password: '',
  ruc_emisor: '',
  razon_social: '',
  serie_factura: '',
  numero_factura: null as any,
  serie_boleta: '',
  numero_boleta: null as any,
  direccion: '',
  ubigeo: '',
  environment: 'development',
  email: '',
  nombre_comercial: '',
  pdf_format: 'A4',
  blocked: true
})

const autoEmissionEnabled = computed({
  get: () => !formData.blocked,
  set: (val: boolean) => { formData.blocked = !val }
})

// 'rest' (PSE nativo) y 'proxy' (mtbilling) comparten el mismo layout: usuario/contraseña + emisor.
const isProxyLayout = computed(() => formData.mode === 'rest' || formData.mode === 'proxy')

const errors = reactive({
  api_url: '',
  bizlinks_user: '',
  bizlinks_password: '',
  ruc_emisor: '',
  razon_social: ''
})

onMounted(async () => {
  billingStore.clearMessages()
  await billingStore.fetchBizlinksConfig()
  config.value = billingStore.bizlinksConfig

  if (config.value?.configured && config.value.credentials) {
    const creds = config.value.credentials
    const mode = (config.value.mode || creds.mode || 'rest')
    Object.assign(formData, {
      mode,
      // Direct
      api_url: creds.api_url || '',
      puerto: creds.puerto || '',
      // Proxy (la contraseña va cifrada en el backend; no se precarga, se re-ingresa)
      bizlinks_user: creds.bizlinks_user || '',
      bizlinks_password: '',
      // Comunes
      ruc_emisor: creds.ruc_emisor || '',
      razon_social: creds.razon_social || '',
      serie_factura: creds.serie_factura || '',
      numero_factura: creds.numero_factura ? parseInt(String(creds.numero_factura)) : undefined,
      serie_boleta: creds.serie_boleta || '',
      numero_boleta: creds.numero_boleta ? parseInt(String(creds.numero_boleta)) : undefined,
      direccion: creds.direccion || '',
      ubigeo: creds.ubigeo || '',
      environment: creds.environment || ((mode === 'proxy' || mode === 'rest') ? 'development' : 'prueba'),
      email: creds.email || '',
      nombre_comercial: creds.nombre_comercial || '',
      pdf_format: creds.pdf_format || 'A4',
      blocked: config.value.blocked ?? true
    })
  }
})

function validateForm(): boolean {
  errors.api_url = ''
  errors.bizlinks_user = ''
  errors.bizlinks_password = ''
  errors.ruc_emisor = ''
  errors.razon_social = ''

  let valid = true

  if (isProxyLayout.value) {
    if (!formData.bizlinks_user?.trim()) {
      errors.bizlinks_user = 'El usuario de Bizlinks es requerido'
      valid = false
    }
    // Password requerida solo al crear; al editar, si va vacía se conserva la guardada
    if (!formData.bizlinks_password?.trim() && !config.value?.configured) {
      errors.bizlinks_password = 'La contraseña de Bizlinks es requerida'
      valid = false
    }
  } else {
    if (!formData.api_url?.trim()) {
      errors.api_url = 'La URL del servidor es requerida'
      valid = false
    } else if (!formData.api_url.startsWith('http')) {
      errors.api_url = 'La URL debe comenzar con http:// o https://'
      valid = false
    }
  }

  if (!formData.ruc_emisor?.trim()) {
    errors.ruc_emisor = 'El RUC es requerido'
    valid = false
  } else if (!/^\d{11}$/.test(formData.ruc_emisor)) {
    errors.ruc_emisor = 'El RUC debe tener exactamente 11 dígitos numéricos'
    valid = false
  }

  if (!formData.razon_social?.trim()) {
    errors.razon_social = 'La razón social es requerida'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return

  billingStore.clearMessages()

  const cleanedData: any = {
    mode: formData.mode,
    ruc_emisor: formData.ruc_emisor,
    razon_social: formData.razon_social,
    environment: formData.environment,
    pdf_format: formData.pdf_format,
    blocked: formData.blocked
  }

  if (isProxyLayout.value) {
    cleanedData.bizlinks_user = formData.bizlinks_user
    // Solo enviar la password si se ingresó una nueva (al editar puede ir vacía)
    if (formData.bizlinks_password) cleanedData.bizlinks_password = formData.bizlinks_password
  } else {
    cleanedData.api_url = formData.api_url
    if (formData.puerto) cleanedData.puerto = formData.puerto
  }

  if (formData.serie_factura) cleanedData.serie_factura = formData.serie_factura
  if (formData.numero_factura) cleanedData.numero_factura = formData.numero_factura
  if (formData.serie_boleta) cleanedData.serie_boleta = formData.serie_boleta
  if (formData.numero_boleta) cleanedData.numero_boleta = formData.numero_boleta
  if (formData.direccion) cleanedData.direccion = formData.direccion
  if (formData.ubigeo) cleanedData.ubigeo = formData.ubigeo
  if (formData.email) cleanedData.email = formData.email
  if (formData.nombre_comercial) cleanedData.nombre_comercial = formData.nombre_comercial

  const result = config.value?.configured
    ? await billingStore.updateBizlinksCredentials(cleanedData)
    : await billingStore.saveBizlinksCredentials(cleanedData)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: config.value?.configured ? 'Credenciales actualizadas' : 'Credenciales guardadas',
      life: 3000
    })
    config.value = billingStore.bizlinksConfig
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
  billingStore.clearMessages()
  const result = await billingStore.testBizlinksConnection()

  if (result.success && result.data) {
    toast.add({
      severity: 'success',
      summary: 'Conexión exitosa',
      detail: `Conectado al ambiente de ${result.data.environment}`,
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error de conexión',
      detail: result.error || 'No se pudo conectar con Bizlinks',
      life: 5000
    })
  }
}

function handleDelete() {
  confirm.require({
    message: '¿Estás seguro de eliminar las credenciales de Bizlinks?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await billingStore.deleteBizlinksCredentials()

      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Eliminadas',
          detail: 'Credenciales eliminadas exitosamente',
          life: 3000
        })
        config.value = null
        Object.assign(formData, {
          mode: 'rest',
          api_url: '',
          puerto: '',
          bizlinks_user: '',
          bizlinks_password: '',
          ruc_emisor: '',
          razon_social: '',
          serie_factura: '',
          numero_factura: undefined,
          serie_boleta: '',
          numero_boleta: undefined,
          direccion: '',
          ubigeo: '',
          environment: 'development',
          email: '',
          nombre_comercial: '',
          pdf_format: 'A4',
          blocked: true
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
:deep(.p-inputtext) {
  border: 1px solid #d1d5db !important;
}
</style>
