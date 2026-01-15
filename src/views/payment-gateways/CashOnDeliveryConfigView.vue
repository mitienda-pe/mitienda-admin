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
                  {{ isConfigured ? 'Contra Entrega configurado' : 'Contra Entrega no configurado' }}
                </h3>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-secondary-800 mb-4">Configuración</h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Instrucciones de entrega <span class="text-red-500">*</span>
                  </label>
                  <Textarea
                    v-model="formData.instructions"
                    placeholder="Para coordinar la entrega puedes llamar al {telefono} o escríbenos a {email}"
                    rows="4"
                    class="w-full"
                  />
                  <small class="text-secondary-600">
                    Este mensaje se mostrará en el carrito, confirmación y email al cliente.
                    Puedes usar {telefono} y {email} para insertar los datos de contacto.
                  </small>
                </div>

                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Texto adicional (opcional)
                  </label>
                  <Textarea
                    v-model="formData.optional_text"
                    placeholder="Texto opcional que aparece al seleccionar este método..."
                    rows="2"
                    class="w-full"
                  />
                </div>
              </div>
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
              Permite a tus clientes pagar en efectivo al momento de recibir su pedido.
            </p>
            <Divider />
            <div>
              <h4 class="font-semibold mb-2">Consideraciones</h4>
              <ul class="list-disc list-inside text-secondary-600 space-y-1">
                <li>El courier debe estar preparado para cobrar</li>
                <li>Mayor riesgo de devoluciones</li>
                <li>Considerar límites de monto</li>
              </ul>
            </div>
            <Divider />
            <div class="bg-blue-50 p-3 rounded-lg">
              <p class="text-blue-800 text-xs">
                <i class="pi pi-lightbulb mr-1"></i>
                Tip: Configura un monto máximo para reducir riesgos.
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
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const toast = useToast()
const confirm = useConfirm()
const store = usePaymentGatewaysStore()
const GATEWAY_CODE = 'cash-on-delivery'

const formData = reactive({
  instructions: 'Para coordinar la entrega puedes llamar al {telefono} o escríbenos a {email}',
  optional_text: ''
})

const isConfigured = computed(() => store.currentConfig?.gateway?.configured || false)
onMounted(() => { store.clearMessages() })

async function handleSubmit() {
  if (!formData.instructions) {
    toast.add({ severity: 'warn', summary: 'Las instrucciones son requeridas', life: 3000 })
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
