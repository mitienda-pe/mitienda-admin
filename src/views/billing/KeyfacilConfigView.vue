<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
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
            {{ isConfigured ? 'KeyFácil configurado' : 'KeyFácil sin configurar' }}
          </span>
          <p class="text-sm" :class="isConfigured ? 'text-green-600' : 'text-yellow-600'">
            {{ isConfigured
              ? 'Tu tienda puede emitir comprobantes con KeyFácil.'
              : 'Ingresa el token de tu empresa para empezar a emitir.' }}
          </p>
        </div>
      </div>

      <Message v-if="billingStore.error" severity="error" :closable="true" @close="billingStore.clearMessages()">
        {{ billingStore.error }}
      </Message>
      <Message v-if="billingStore.successMessage" severity="success" :closable="true" @close="billingStore.clearMessages()">
        {{ billingStore.successMessage }}
      </Message>

      <!-- Token -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-key text-primary"></i>
            <span>Token de acceso</span>
          </div>
        </template>
        <template #content>
          <label for="api_token" class="block text-sm font-medium text-gray-700 mb-1">
            Token de tu empresa {{ isConfigured ? '' : '*' }}
          </label>
          <Password
            id="api_token"
            v-model="formData.api_token"
            class="w-full"
            inputClass="w-full"
            :placeholder="isConfigured ? 'Guardado. Déjalo vacío para conservarlo' : 'Pega aquí el token que te entregó KeyFácil'"
            :feedback="false"
            toggleMask
          />
          <small class="text-gray-500">
            Lo verificamos con KeyFácil al guardar. El mismo campo sirve para el token de pruebas
            y para el de producción: KeyFácil decide el ambiente según el token.
          </small>
        </template>
      </Card>

      <!-- Series -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-hashtag text-primary"></i>
            <span>Series y formato</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="serie_factura" class="block text-sm font-medium text-gray-700 mb-1">Serie de factura</label>
                <InputText
                  id="serie_factura"
                  v-model="formData.serie_factura"
                  class="w-full uppercase"
                  placeholder="F001"
                  maxlength="4"
                />
                <small v-if="lastFactura" class="text-gray-500">Último número emitido: {{ lastFactura }}</small>
              </div>
              <div>
                <label for="serie_boleta" class="block text-sm font-medium text-gray-700 mb-1">Serie de boleta</label>
                <InputText
                  id="serie_boleta"
                  v-model="formData.serie_boleta"
                  class="w-full uppercase"
                  placeholder="B001"
                  maxlength="4"
                />
                <small v-if="lastBoleta" class="text-gray-500">Último número emitido: {{ lastBoleta }}</small>
              </div>
            </div>
            <p class="text-sm text-gray-600">
              Usa las mismas series que tienes en KeyFácil. El número de cada comprobante lo asigna
              KeyFácil, así que puedes seguir emitiendo también desde su panel sin que se crucen.
            </p>

            <Divider />

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Formato del PDF</label>
              <div class="flex gap-4">
                <div class="flex items-center gap-2">
                  <RadioButton id="pdf_a4" v-model="formData.pdf_format" value="A4" />
                  <label for="pdf_a4" class="cursor-pointer">A4</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton id="pdf_ticket" v-model="formData.pdf_format" value="80MM" />
                  <label for="pdf_ticket" class="cursor-pointer">Ticket 80 mm</label>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Emisión automática -->
      <div class="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
        <div>
          <label for="auto_emission" class="font-medium text-secondary-800 cursor-pointer">
            Emisión automática de comprobantes
          </label>
          <p class="text-sm text-secondary-600 mt-1">
            Emite la boleta o factura apenas se aprueba el pago.
          </p>
        </div>
        <InputSwitch id="auto_emission" v-model="autoEmissionEnabled" />
      </div>

      <div class="flex items-center gap-3">
        <Button
          :label="isConfigured ? 'Guardar cambios' : 'Guardar'"
          icon="pi pi-save"
          :loading="billingStore.isSaving"
          @click="save"
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

    <!-- Ayuda -->
    <div class="space-y-6">
      <Card class="bg-primary/5 border border-primary/20">
        <template #content>
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-primary text-xl"></i>
              <h3 class="font-semibold text-secondary-700">¿Cómo consigo el token?</h3>
            </div>
            <p class="text-sm text-primary">
              Necesitas una cuenta en KeyFácil. El token de integración se pide por correo a
              <strong>soporte@keyfacil.com</strong>, indicando el RUC de tu empresa.
            </p>
          </div>
        </template>
      </Card>

      <Card class="bg-amber-50 border border-amber-200">
        <template #content>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <i class="pi pi-exclamation-triangle text-amber-600"></i>
              <h3 class="font-semibold text-amber-900 text-sm">Ten en cuenta</h3>
            </div>
            <ul class="text-sm text-amber-800 space-y-1">
              <li>• Un comprobante recién emitido aparece como "pendiente de SUNAT" unos minutos, hasta que SUNAT confirma.</li>
              <li>• Las ventas con bolsas plásticas (ICBPER) o productos con ISC no se pueden emitir desde aquí: emítelas en el panel de KeyFácil.</li>
            </ul>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
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

const billingStore = useBillingStore()
const confirm = useConfirm()

const formData = reactive({
  api_token: '',
  serie_factura: 'F001',
  serie_boleta: 'B001',
  pdf_format: 'A4',
  blocked: true, // blocked = true significa emisión automática APAGADA
})

const isConfigured = computed(() => billingStore.keyfacilConfig?.configured || false)

const lastFactura = computed(() => Number(billingStore.keyfacilConfig?.credentials?.numero_factura) || 0)
const lastBoleta = computed(() => Number(billingStore.keyfacilConfig?.credentials?.numero_boleta) || 0)

const autoEmissionEnabled = computed({
  get: () => !formData.blocked,
  set: (val: boolean) => { formData.blocked = !val }
})

onMounted(async () => {
  billingStore.clearMessages()
  await billingStore.fetchKeyfacilConfig()
  const config = billingStore.keyfacilConfig
  if (config?.credentials) {
    formData.serie_factura = config.credentials.serie_factura || 'F001'
    formData.serie_boleta = config.credentials.serie_boleta || 'B001'
    // TICKET y 80MM salen igual en KeyFácil; el formulario solo ofrece uno.
    formData.pdf_format = config.credentials.pdf_format === 'A4' ? 'A4' : '80MM'
    formData.blocked = config.blocked ?? true
  }
})

async function save() {
  if (!isConfigured.value && !formData.api_token.trim()) {
    billingStore.error = 'Ingresa el token de tu empresa'
    return
  }

  const result = await billingStore.saveKeyfacilCredentials({
    ...formData,
    api_token: formData.api_token.trim(),
    serie_factura: formData.serie_factura.trim().toUpperCase(),
    serie_boleta: formData.serie_boleta.trim().toUpperCase(),
  }, isConfigured.value)

  if (result.success) {
    formData.api_token = ''
  }
}

async function testConnection() {
  const result = await billingStore.testKeyfacilConnection()
  if (result.success) {
    billingStore.successMessage = 'Conexión correcta: KeyFácil aceptó el token'
  }
}

function confirmDelete() {
  confirm.require({
    message: '¿Seguro que quieres eliminar la configuración de KeyFácil? Los comprobantes ya emitidos se conservan.',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await billingStore.deleteKeyfacilCredentials()
    }
  })
}
</script>
