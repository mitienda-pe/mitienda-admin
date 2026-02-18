<script setup lang="ts">
import { onMounted } from 'vue'
import { useShippingConfigStore } from '@/stores/shipping-config.store'
import { storeToRefs } from 'pinia'
import InputSwitch from 'primevue/inputswitch'
import InputNumber from 'primevue/inputnumber'
import RadioButton from 'primevue/radiobutton'
import Dropdown from 'primevue/dropdown'
import { AppButton, AppErrorState } from '@/components/ui'
import ShippingScheduleEditor from '@/components/shipping/ShippingScheduleEditor.vue'
import BlockedDatesEditor from '@/components/shipping/BlockedDatesEditor.vue'
import { useToast } from 'primevue/usetoast'

const store = useShippingConfigStore()
const { draftConfig, isLoading, isSaving, error, hasChanges } = storeToRefs(store)
const toast = useToast()

const daysOptions = Array.from({ length: 11 }, (_, i) => ({
  label: i === 0 ? 'Mismo día (hoy)' : i === 1 ? '1 día' : `${i} días`,
  value: i
}))

async function handleSave() {
  const ok = await store.saveConfig()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Configuración de envío actualizada',
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar',
      life: 5000
    })
  }
}

onMounted(() => {
  if (!store.isLoaded) {
    store.fetchConfig()
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Configuración de Envío</h1>
        <p class="text-sm text-gray-500 mt-1">
          Configura los métodos de entrega, horarios y opciones de envío
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="error && !store.isLoaded" :message="error" @retry="store.fetchConfig" />

    <!-- Content -->
    <template v-else>
      <!-- Card 1: Métodos de Entrega -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Métodos de Entrega</h2>

        <div class="space-y-4">
          <!-- Envío a domicilio -->
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="font-medium text-gray-900">Envío a domicilio</p>
              <p class="text-sm text-gray-500">
                Permite a tus clientes recibir pedidos en su dirección
              </p>
            </div>
            <InputSwitch
              v-model="draftConfig.swEntregaADomicilio"
            />
          </div>

          <!-- Recojo en tienda -->
          <div class="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p class="font-medium text-gray-900">Recojo en tienda</p>
              <p class="text-sm text-gray-500">
                Permite a tus clientes recoger pedidos en tu local
              </p>
            </div>
            <InputSwitch
              v-model="draftConfig.swRecojoEnTienda"
            />
          </div>

          <!-- Pago en destino (placeholder) -->
          <div class="flex items-center justify-between py-2 border-t border-gray-100 opacity-50">
            <div>
              <p class="font-medium text-gray-900">
                <i class="pi pi-lock text-sm mr-1" />
                Pago en destino (próximamente)
              </p>
              <p class="text-sm text-gray-500">
                Permite a tus clientes pagar al recibir el pedido
              </p>
            </div>
            <InputSwitch :modelValue="false" disabled />
          </div>
        </div>
      </div>

      <!-- Card 2: Configuración de Envío a Domicilio -->
      <div
        v-if="draftConfig.swEntregaADomicilio"
        class="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
      >
        <h2 class="text-lg font-semibold text-gray-900">Configuración de Envío a Domicilio</h2>

        <!-- Habilitar despacho -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900">Habilitar despacho</p>
            <p class="text-sm text-gray-500">
              Activa la gestión de estados de envío para los pedidos
            </p>
          </div>
          <InputSwitch v-model="draftConfig.swHabilitarEstadoEnvio" />
        </div>

        <!-- Reparto gratis -->
        <div class="border-t border-gray-100 pt-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">Reparto gratis</p>
              <p class="text-sm text-gray-500">
                Ofrece envío gratuito para compras superiores a un monto
              </p>
            </div>
            <InputSwitch v-model="draftConfig.swRepartoGratis" />
          </div>
          <div v-if="draftConfig.swRepartoGratis" class="mt-3 ml-4 max-w-xs">
            <label class="block text-sm text-secondary-700 mb-1">Monto mínimo para envío gratis</label>
            <InputNumber
              v-model="draftConfig.montoRepartoGratis"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              :minFractionDigits="2"
              :min="0"
              class="w-full"
            />
          </div>
        </div>

        <!-- Cálculo de costo de envío -->
        <div class="border-t border-gray-100 pt-4">
          <p class="font-medium text-gray-900 mb-1">Como aplicar el precio de envío</p>
          <p class="text-sm text-gray-500 mb-3">
            Determina como se calcula el costo de envío cuando el carrito tiene varios productos
          </p>
          <div class="space-y-3 ml-4">
            <div class="flex items-start gap-2">
              <RadioButton
                v-model="draftConfig.envioporProducto"
                :value="0"
                inputId="envio-single"
                class="mt-0.5"
              />
              <div>
                <label for="envio-single" class="text-sm font-medium cursor-pointer">Precio único por destino</label>
                <p class="text-xs text-gray-500">
                  Se aplica la tarifa de envío del destino seleccionado, sin importar cuántos productos tenga el carrito
                </p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <RadioButton
                v-model="draftConfig.envioporProducto"
                :value="1"
                inputId="envio-highest"
                class="mt-0.5"
              />
              <div>
                <label for="envio-highest" class="text-sm font-medium cursor-pointer">Calcular precio mayor</label>
                <p class="text-xs text-gray-500">
                  Cada producto tiene un factor de envío distinto y se aplica la tarifa más alta del carrito
                </p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <RadioButton
                v-model="draftConfig.envioporProducto"
                :value="2"
                inputId="envio-sum"
                class="mt-0.5"
              />
              <div>
                <label for="envio-sum" class="text-sm font-medium cursor-pointer">Calcular sumatoria por productos</label>
                <p class="text-xs text-gray-500">
                  Cada producto tiene un factor de envío distinto y se suman las tarifas de todos los productos en el carrito
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Horario de envío -->
        <div class="border-t border-gray-100 pt-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">Mostrar horario de envío</p>
              <p class="text-sm text-gray-500">
                Muestra los días y horarios disponibles para entrega
              </p>
            </div>
            <InputSwitch v-model="draftConfig.swMostrarHorarioEnvio" />
          </div>
          <div v-if="draftConfig.swMostrarHorarioEnvio" class="mt-4 ml-4">
            <ShippingScheduleEditor
              :modelValue="draftConfig.horarioEnvio"
              @update:modelValue="store.updateField('horarioEnvio', $event)"
            />
          </div>
        </div>

        <!-- Formato de fecha -->
        <div class="border-t border-gray-100 pt-4">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">
                Formato de selección de fecha
              </label>
              <Dropdown
                v-model="draftConfig.tipoMostrarFecha"
                :options="[
                  { label: 'Desplegable (lista)', value: 1 },
                  { label: 'Calendario', value: 2 }
                ]"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">
                Días mínimos de anticipación
              </label>
              <Dropdown
                v-model="draftConfig.swRepartoHoy"
                :options="daysOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Días bloqueados -->
        <div class="border-t border-gray-100 pt-4">
          <p class="font-medium text-gray-900 mb-1">Días bloqueados</p>
          <p class="text-sm text-gray-500 mb-3">
            Fechas en las que no se realizan entregas
          </p>
          <BlockedDatesEditor
            :modelValue="draftConfig.diasBloqueados"
            @update:modelValue="store.updateField('diasBloqueados', $event)"
          />
        </div>
      </div>

      <!-- Card 3: Configuración de Recojo en Tienda -->
      <div
        v-if="draftConfig.swRecojoEnTienda"
        class="bg-white rounded-lg border border-gray-200 p-6 space-y-6"
      >
        <h2 class="text-lg font-semibold text-gray-900">Configuración de Recojo en Tienda</h2>

        <!-- Horario de recojo -->
        <div>
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">Mostrar horario de recojo</p>
              <p class="text-sm text-gray-500">
                Muestra los días y horarios disponibles para recojo
              </p>
            </div>
            <InputSwitch v-model="draftConfig.swMostrarHorarioRecojoTienda" />
          </div>
          <div v-if="draftConfig.swMostrarHorarioRecojoTienda" class="mt-4 ml-4">
            <ShippingScheduleEditor
              :modelValue="draftConfig.horarioRecojoTienda"
              @update:modelValue="store.updateField('horarioRecojoTienda', $event)"
            />
          </div>
        </div>

        <!-- Formato de fecha y días -->
        <div class="border-t border-gray-100 pt-4">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">
                Formato de selección de fecha
              </label>
              <Dropdown
                v-model="draftConfig.tipoMostrarFechaRecojoTienda"
                :options="[
                  { label: 'Desplegable (lista)', value: 1 },
                  { label: 'Calendario', value: 2 }
                ]"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-1">
                Días mínimos de anticipación
              </label>
              <Dropdown
                v-model="draftConfig.swRecojoTiendaHoy"
                :options="daysOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- Plazo máximo -->
        <div class="border-t border-gray-100 pt-4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">
            Plazo máximo para recojo (días)
          </label>
          <p class="text-sm text-gray-500 mb-2">
            Número de días que el cliente tiene para recoger su pedido
          </p>
          <InputNumber
            v-model="draftConfig.plazoMaximoRecojoTienda"
            :min="1"
            :max="90"
            suffix=" días"
            class="w-40"
          />
        </div>
      </div>

      <!-- Save button -->
      <div class="flex justify-end pt-2">
        <AppButton
          variant="primary"
          :disabled="!hasChanges || isSaving"
          @click="handleSave"
        >
          <i v-if="isSaving" class="pi pi-spinner pi-spin mr-2" />
          <i v-else class="pi pi-save mr-2" />
          Guardar configuración
        </AppButton>
      </div>
    </template>
  </div>
</template>
