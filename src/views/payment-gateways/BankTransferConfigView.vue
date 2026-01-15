<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <Card>
        <template #content>
          <div v-if="store.currentConfig?.gateway" class="mb-6 p-4 rounded-lg" :class="isConfigured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
            <div class="flex items-start gap-3">
              <i :class="isConfigured ? 'pi pi-check-circle text-green-600' : 'pi pi-exclamation-triangle text-yellow-600'" class="text-xl"></i>
              <div>
                <h3 class="font-semibold" :class="isConfigured ? 'text-green-800' : 'text-yellow-800'">
                  {{ isConfigured ? 'Transferencia Bancaria configurada' : 'Transferencia Bancaria no configurada' }}
                </h3>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Datos del Titular</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Nombre del titular <span class="text-red-500">*</span></label>
                  <InputText v-model="formData.holder_name" placeholder="Nombre completo o Razón Social" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Tipo de documento</label>
                  <Dropdown
                    v-model="formData.document_type"
                    :options="documentTypes"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Número de documento</label>
                  <InputText v-model="formData.document_number" placeholder="12345678901" class="w-full" />
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Datos Bancarios</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Banco <span class="text-red-500">*</span></label>
                  <Dropdown
                    v-model="formData.bank"
                    :options="banks"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar banco"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Tipo de cuenta</label>
                  <Dropdown
                    v-model="formData.account_type"
                    :options="accountTypes"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Número de cuenta <span class="text-red-500">*</span></label>
                  <InputText v-model="formData.account_number" placeholder="Número de cuenta" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">CCI (opcional)</label>
                  <InputText v-model="formData.cci" placeholder="Código Interbancario" class="w-full" />
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Instrucciones para el cliente</label>
              <Textarea
                v-model="formData.instructions"
                placeholder="Instrucciones adicionales para el cliente..."
                rows="3"
                class="w-full"
              />
            </div>

            <Message v-if="store.error" severity="error" :closable="false">{{ store.error }}</Message>

            <div class="flex gap-3 pt-4">
              <Button type="submit" :label="isConfigured ? 'Actualizar' : 'Guardar'" icon="pi pi-save" :loading="store.isSaving" />
              <Button v-if="isConfigured" type="button" label="Eliminar" icon="pi pi-trash" severity="danger" outlined @click="handleDelete" />
            </div>
          </form>
        </template>
      </Card>
    </div>

    <div>
      <Card>
        <template #title><div class="flex items-center gap-2"><i class="pi pi-info-circle"></i><span>Información</span></div></template>
        <template #content>
          <div class="space-y-4 text-sm">
            <p class="text-secondary-600">
              Permite a tus clientes pagar mediante depósito o transferencia bancaria.
            </p>
            <Divider />
            <div class="bg-yellow-50 p-3 rounded-lg">
              <p class="text-yellow-800 text-xs">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                Los pagos por transferencia requieren confirmación manual.
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'bank-transfer'

const documentTypes = [
  { label: 'RUC', value: 'RUC' },
  { label: 'DNI', value: 'DNI' },
  { label: 'CE', value: 'CE' }
]

const banks = [
  { label: 'BCP', value: 'BCP' },
  { label: 'BBVA', value: 'BBVA' },
  { label: 'Interbank', value: 'Interbank' },
  { label: 'Scotiabank', value: 'Scotiabank' },
  { label: 'BanBif', value: 'BanBif' },
  { label: 'Banco de la Nación', value: 'BN' },
  { label: 'Otro', value: 'Otro' }
]

const accountTypes = [
  { label: 'Cuenta Corriente', value: 'Corriente' },
  { label: 'Cuenta de Ahorros', value: 'Ahorros' }
]

const formData = reactive({
  holder_name: '',
  document_type: 'RUC',
  document_number: '',
  bank: '',
  account_type: 'Corriente',
  account_number: '',
  cci: '',
  instructions: ''
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)
onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (!formData.holder_name || !formData.bank || !formData.account_number) {
    toast.add({ severity: 'warn', summary: 'Completa los campos requeridos', life: 3000 })
    return
  }
  const result = isConfigured.value
    ? await store.updateCredentials(GATEWAY_CODE, { credentials: formData, environment: 'produccion', enabled: true })
    : await store.saveCredentials(GATEWAY_CODE, { credentials: formData, environment: 'produccion', enabled: true })
  toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Éxito' : 'Error', life: 3000 })
}

function handleDelete() {
  confirm.require({
    message: '¿Eliminar configuración?', header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const result = await store.deleteCredentials(GATEWAY_CODE)
      toast.add({ severity: result.success ? 'success' : 'error', summary: result.success ? 'Eliminadas' : 'Error', life: 3000 })
    }
  })
}
</script>
