<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <!-- La tienda no está habilitada: se llegó por URL directa. El backend
           rechaza igual la escritura; esto solo evita un formulario que no
           serviría de nada. -->
      <Message v-if="loaded && !isAvailable" severity="warn" :closable="false">
        La Facturación MiTienda todavía no está habilitada para esta tienda.
        Escríbenos si quieres activarla.
      </Message>

      <template v-if="!loaded || isAvailable">
      <!-- Estado -->
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
            {{ isConfigured ? 'Facturación MiTienda activa' : 'Facturación MiTienda sin configurar' }}
          </span>
          <p class="text-sm" :class="isConfigured ? 'text-green-600' : 'text-yellow-600'">
            {{ isConfigured
              ? 'Tu empresa está registrada y puede emitir comprobantes.'
              : 'Completa los tres pasos para empezar a emitir.' }}
          </p>
        </div>
      </div>

      <Message v-if="billingStore.error" severity="error" :closable="true" @close="billingStore.clearMessages()">
        {{ billingStore.error }}
      </Message>
      <Message v-if="billingStore.successMessage" severity="success" :closable="true" @close="billingStore.clearMessages()">
        {{ billingStore.successMessage }}
      </Message>

      <!-- Aviso de certificado por vencer -->
      <Message v-if="certWarning" severity="warn" :closable="false">
        {{ certWarning }}
      </Message>

      <Steps :model="pasos" :activeStep="paso - 1" class="mb-2" />

      <!-- Paso 1: datos fiscales -->
      <Card v-show="paso === 1">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-building text-primary"></i>
            <span>Datos de tu empresa</span>
          </div>
        </template>
        <template #content>
          <p class="text-sm text-gray-600 mb-4">
            Tienen que coincidir exactamente con lo que figura en tu ficha RUC de SUNAT.
          </p>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
              <InputText v-model="form.ruc_emisor" class="w-full" placeholder="20123456789" maxlength="11" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Razón social *</label>
              <InputText v-model="form.razon_social" class="w-full" placeholder="MI EMPRESA S.A.C." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre comercial</label>
              <InputText v-model="form.nombre_comercial" class="w-full" placeholder="Mi Tienda" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Domicilio fiscal *</label>
              <InputText v-model="form.direccion" class="w-full" placeholder="AV. LIMA 100" />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ubigeo *</label>
                <InputText v-model="form.ubigeo" class="w-full" placeholder="150101" maxlength="6" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <InputText v-model="form.departamento" class="w-full" placeholder="LIMA" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <InputText v-model="form.provincia" class="w-full" placeholder="LIMA" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
                <InputText v-model="form.distrito" class="w-full" placeholder="MIRAFLORES" />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Paso 2: SOL y certificado -->
      <Card v-show="paso === 2">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-key text-primary"></i>
            <span>Clave SOL y certificado digital</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              Usa un <strong>usuario SOL secundario</strong> con el permiso de facturación
              electrónica, no tu clave principal. El certificado es el archivo
              <strong>.pfx</strong> o <strong>.p12</strong> que descargas de SUNAT.
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Usuario SOL *</label>
                <InputText v-model="form.sol_user" class="w-full" placeholder="MODDATOS" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Clave SOL *</label>
                <Password v-model="form.sol_pass" class="w-full" :feedback="false" toggleMask />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Certificado (.pfx o .p12) *</label>
              <input
                type="file"
                accept=".pfx,.p12"
                class="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white hover:file:opacity-90"
                @change="onCertificateSelected"
              />
              <small v-if="certFileName" class="text-gray-500">{{ certFileName }}</small>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña del certificado</label>
              <Password v-model="form.cert_password" class="w-full" :feedback="false" toggleMask />
            </div>

            <div class="flex items-center gap-3">
              <Button
                label="Verificar certificado"
                icon="pi pi-search"
                outlined
                :disabled="!form.certificado || inspecting"
                :loading="inspecting"
                @click="inspectCertificate"
              />
              <span v-if="certInfo" class="text-sm text-green-700">
                <i class="pi pi-check-circle"></i>
                {{ certInfo.subject }} · vence {{ formatDate(certInfo.valido_hasta) }}
              </span>
            </div>
            <small class="text-gray-500 block">
              Verificarlo acá evita descubrir que está vencido o que la contraseña
              no es la correcta recién al emitir tu primera venta.
            </small>
          </div>
        </template>
      </Card>

      <!-- Paso 3: series y ambiente -->
      <Card v-show="paso === 3">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-hashtag text-primary"></i>
            <span>Series y ambiente</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Serie de factura</label>
                <InputText v-model="form.serie_factura" class="w-full" placeholder="F001" maxlength="4" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Serie de boleta</label>
                <InputText v-model="form.serie_boleta" class="w-full" placeholder="B001" maxlength="4" />
              </div>
            </div>
            <small class="text-gray-500 block">
              La numeración de cada serie la lleva el servicio de emisión, así que no
              tienes que escribir el correlativo ni mantenerlo al día.
            </small>

            <Divider />

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ambiente</label>
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2">
                  <RadioButton v-model="form.environment" inputId="amb-beta" value="beta" />
                  <label for="amb-beta" class="text-sm">Pruebas (beta)</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton v-model="form.environment" inputId="amb-prod" value="produccion" />
                  <label for="amb-prod" class="text-sm">Producción</label>
                </div>
              </div>
              <small class="text-gray-500 block mt-1">
                En pruebas los comprobantes no tienen validez tributaria. Cambia a
                producción cuando hayas verificado que todo sale bien.
              </small>
            </div>

            <Divider />

            <div class="flex items-center gap-3">
              <InputSwitch v-model="autoEmission" inputId="auto" />
              <label for="auto" class="text-sm">Emitir automáticamente al confirmarse el pago</label>
            </div>
          </div>
        </template>
      </Card>

      <!-- Navegación -->
      <div class="flex items-center justify-between">
        <Button label="Atrás" icon="pi pi-arrow-left" text :disabled="paso === 1" @click="paso--" />
        <div class="flex items-center gap-2">
          <Button v-if="paso < 3" label="Siguiente" icon="pi pi-arrow-right" iconPos="right" @click="siguiente" />
          <Button
            v-else
            :label="isConfigured ? 'Guardar cambios' : 'Activar facturación'"
            icon="pi pi-check"
            :loading="billingStore.isSaving"
            @click="save"
          />
        </div>
      </div>
      </template>
    </div>

    <!-- Panel lateral -->
    <div v-if="!loaded || isAvailable" class="space-y-6">
      <Card>
        <template #title>Cómo funciona</template>
        <template #content>
          <p class="text-sm text-gray-600">
            Emites directo a SUNAT, sin contratar un proveedor externo. Está pensado
            para empresas que facturan menos de <strong>S/ 1 260 000</strong> al año,
            que es hasta donde SUNAT permite usar el certificado digital gratuito.
          </p>
          <p class="text-sm text-gray-600 mt-3">
            Tu clave SOL y tu certificado se guardan cifrados en el servicio de
            emisión. MiTienda no los almacena.
          </p>
        </template>
      </Card>

      <Card v-if="isConfigured">
        <template #title>Estado</template>
        <template #content>
          <dl class="text-sm space-y-2">
            <div class="flex justify-between">
              <dt class="text-gray-500">RUC</dt>
              <dd class="font-medium">{{ credentials?.ruc_emisor || '—' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Ambiente</dt>
              <dd class="font-medium">{{ credentials?.environment === 'produccion' ? 'Producción' : 'Pruebas' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Certificado vence</dt>
              <dd class="font-medium">{{ formatDate(credentials?.cert_expires_at) }}</dd>
            </div>
          </dl>
          <Divider />
          <div class="flex flex-col gap-2">
            <Button
              label="Probar conexión"
              icon="pi pi-bolt"
              outlined
              :loading="billingStore.isTesting"
              @click="testConnection"
            />
            <Button label="Eliminar configuración" icon="pi pi-trash" severity="danger" text @click="confirmDelete" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useBillingStore } from '@/stores/billing.store'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import RadioButton from 'primevue/radiobutton'
import Steps from 'primevue/steps'

const billingStore = useBillingStore()
const confirm = useConfirm()

const paso = ref(1)
const pasos = [
  { label: 'Empresa' },
  { label: 'SOL y certificado' },
  { label: 'Series' },
]

const inspecting = ref(false)
const certInfo = ref<any>(null)
const certFileName = ref('')

const form = reactive({
  ruc_emisor: '',
  razon_social: '',
  nombre_comercial: '',
  direccion: '',
  ubigeo: '150101',
  departamento: '',
  provincia: '',
  distrito: '',
  sol_user: '',
  sol_pass: '',
  certificado: '',
  cert_password: '',
  serie_factura: 'F001',
  serie_boleta: 'B001',
  environment: 'beta',
  blocked: true, // blocked = true significa auto-emisión APAGADA
})

const loaded = ref(false)
const isAvailable = computed(() => billingStore.sunatConfig?.available !== false)
const isConfigured = computed(() => billingStore.sunatConfig?.configured || false)
const credentials = computed(() => billingStore.sunatConfig?.credentials || null)

const autoEmission = computed({
  get: () => !form.blocked,
  set: (v: boolean) => { form.blocked = !v },
})

/** Avisa antes de que el CDT caduque: dura un año y al vencer deja de emitir. */
const certWarning = computed(() => {
  const vence = credentials.value?.cert_expires_at
  if (!vence) return ''
  const dias = Math.ceil((new Date(vence).getTime() - Date.now()) / 86_400_000)
  if (dias < 0) return 'Tu certificado digital venció. No podrás emitir hasta renovarlo en SUNAT y volver a cargarlo acá.'
  if (dias <= 30) return `Tu certificado digital vence en ${dias} día${dias === 1 ? '' : 's'}. Renuévalo en SUNAT y vuelve a cargarlo para no quedarte sin emitir.`
  return ''
})

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE')
}

onMounted(async () => {
  await billingStore.fetchSunatConfig()
  loaded.value = true
  const creds = billingStore.sunatConfig?.credentials
  if (creds) {
    form.ruc_emisor = creds.ruc_emisor || ''
    form.serie_factura = creds.serie_factura || 'F001'
    form.serie_boleta = creds.serie_boleta || 'B001'
    form.environment = creds.environment || 'beta'
    form.blocked = billingStore.sunatConfig?.blocked ?? true
  }
})

function onCertificateSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  certFileName.value = file.name
  certInfo.value = null

  const reader = new FileReader()
  reader.onload = () => {
    // El resultado viene como data URL; al backend va solo el base64.
    const result = String(reader.result || '')
    form.certificado = result.includes(',') ? result.split(',')[1] : result
  }
  reader.onerror = () => {
    billingStore.error = 'No se pudo leer el archivo del certificado'
  }
  reader.readAsDataURL(file)
}

async function inspectCertificate() {
  inspecting.value = true
  certInfo.value = null
  const result = await billingStore.inspectSunatCertificate(form.certificado, form.cert_password)
  inspecting.value = false
  if (result.success) {
    certInfo.value = result.data
  }
}

function siguiente() {
  if (paso.value === 1) {
    if (!/^\d{11}$/.test(form.ruc_emisor)) {
      billingStore.error = 'El RUC debe tener 11 dígitos'
      return
    }
    if (!form.razon_social.trim()) {
      billingStore.error = 'La razón social es obligatoria'
      return
    }
  }
  if (paso.value === 2) {
    if (!form.sol_user || !form.sol_pass) {
      billingStore.error = 'El usuario y la clave SOL son obligatorios'
      return
    }
    if (!form.certificado && !isConfigured.value) {
      billingStore.error = 'Carga tu certificado digital'
      return
    }
  }
  billingStore.clearMessages()
  paso.value++
}

async function save() {
  const result = await billingStore.saveSunatCompany({ ...form }, isConfigured.value)
  if (result.success) {
    paso.value = 3
  }
}

async function testConnection() {
  const result = await billingStore.testSunatConnection()
  if (result.success) {
    const amb = result.data?.environment === 'produccion' ? 'producción' : 'pruebas'
    billingStore.successMessage = `Conexión correcta. ${result.data?.razon_social || ''} en ${amb}.`
  }
}

function confirmDelete() {
  confirm.require({
    message: 'Se eliminará la configuración de esta tienda. Los comprobantes ya emitidos se conservan.',
    header: 'Eliminar configuración',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await billingStore.deleteSunatConfig()
    },
  })
}
</script>
