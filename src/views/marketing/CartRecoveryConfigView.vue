<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import InputSwitch from 'primevue/inputswitch'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Message from 'primevue/message'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import {
  cartRecoveryApi,
  type CartRecoveryConfig,
  type EspConflict
} from '@/api/cart-recovery.api'

const toast = useToast()

const isLoading = ref(true)
const isSaving = ref(false)

const config = ref<CartRecoveryConfig>({
  enabled: false,
  toques: 1,
  delays_h: [1, 24, 72],
  cupon: { activo: false, tipo: 'porcentaje', valor: 10, vigencia_h: 48 }
})

const couponTypes = [
  { label: 'Porcentaje', value: 'porcentaje' },
  { label: 'Monto fijo', value: 'monto' }
]

const lastToqueLabel = computed(() => toqueLabels[config.value.toques - 1]?.toLowerCase() ?? 'último recordatorio')
const espConflicts = ref<EspConflict[]>([])

const toqueLabels = ['Primer recordatorio', 'Segundo recordatorio', 'Último recordatorio']

const showEspWarning = computed(() => config.value.enabled && espConflicts.value.length > 0)
const espNames = computed(() => espConflicts.value.map((c) => c.name).join(', '))

async function fetchConfig() {
  isLoading.value = true
  try {
    const response = await cartRecoveryApi.getConfig()
    if (response.success && response.data) {
      config.value = response.data.config
      espConflicts.value = response.data.esp_conflicts
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo cargar la configuración',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

async function saveConfig() {
  isSaving.value = true
  try {
    const response = await cartRecoveryApi.saveConfig({
      enabled: config.value.enabled,
      toques: config.value.toques,
      delays_h: config.value.delays_h,
      cupon: config.value.cupon
    })
    if (response.success && response.data) {
      config.value = response.data.config
      espConflicts.value = response.data.esp_conflicts
      toast.add({
        severity: 'success',
        summary: 'Configuración guardada',
        detail: config.value.enabled
          ? 'La recuperación de carritos está activa'
          : 'La recuperación de carritos está desactivada',
        life: 3000
      })
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo guardar la configuración',
      life: 3000
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(fetchConfig)
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Recuperación de carritos</h1>
      <p class="text-secondary-500 mt-1">
        Envía recordatorios automáticos por email a los clientes que dejaron productos en su carrito,
        con un enlace para retomar la compra donde la dejaron.
      </p>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
    </div>

    <template v-else>
      <!-- Activación -->
      <div class="bg-white rounded-lg border border-secondary-200 p-6 mb-4">
        <div class="flex items-center justify-between">
          <div class="pr-6">
            <h2 class="font-semibold text-secondary-900">Recordatorios automáticos</h2>
            <p class="text-sm text-secondary-500 mt-1">
              Al desactivar, se detienen de inmediato los recordatorios pendientes.
              Los emails incluyen siempre un enlace de baja para el cliente.
            </p>
          </div>
          <InputSwitch v-model="config.enabled" />
        </div>

        <!-- Aviso anti-duplicado ESP -->
        <Message v-if="showEspWarning" severity="warn" :closable="false" class="mt-4">
          Ya envías el evento de carrito abandonado a <strong>{{ espNames }}</strong>.
          Si además tienes un flujo de recuperación armado ahí, tus clientes podrían recibir
          correos duplicados. Puedes desactivar ese evento en
          <router-link to="/integrations" class="underline font-medium">Integraciones</router-link>.
        </Message>
      </div>

      <!-- Secuencia -->
      <div v-if="config.enabled" class="bg-white rounded-lg border border-secondary-200 p-6 mb-4">
        <h2 class="font-semibold text-secondary-900 mb-1">Secuencia de recordatorios</h2>
        <p class="text-sm text-secondary-500 mb-4">
          Hasta 3 recordatorios por carrito. Cada uno se envía pasadas las horas indicadas desde el
          abandono. La secuencia se cancela sola si el cliente compra o se da de baja.
        </p>

        <div class="space-y-3">
          <div
            v-for="n in 3"
            :key="n"
            class="flex items-center gap-4 p-3 rounded-lg border"
            :class="n <= config.toques ? 'border-primary-200 bg-primary-50/30' : 'border-secondary-100 bg-secondary-50 opacity-60'"
          >
            <InputSwitch
              :model-value="n <= config.toques"
              :disabled="n === 1"
              @update:model-value="(val: boolean) => (config.toques = val ? n : n - 1)"
            />
            <div class="flex-1">
              <p class="text-sm font-medium text-secondary-900">{{ toqueLabels[n - 1] }}</p>
            </div>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model="config.delays_h[n - 1]"
                :min="1"
                :max="336"
                :disabled="n > config.toques"
                show-buttons
                input-class="w-20 text-center"
              />
              <span class="text-sm text-secondary-500">horas después</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Cupón del último recordatorio -->
      <div v-if="config.enabled" class="bg-white rounded-lg border border-secondary-200 p-6 mb-4">
        <div class="flex items-center justify-between">
          <div class="pr-6">
            <h2 class="font-semibold text-secondary-900">Cupón en el último recordatorio</h2>
            <p class="text-sm text-secondary-500 mt-1">
              Cada cliente recibe un código propio, de un solo uso, en el {{ lastToqueLabel }}.
              El enlace del correo lo deja aplicado en el checkout.
            </p>
          </div>
          <InputSwitch v-model="config.cupon.activo" />
        </div>

        <div v-if="config.cupon.activo" class="mt-5 space-y-4">
          <div class="flex flex-wrap items-center gap-4">
            <SelectButton
              v-model="config.cupon.tipo"
              :options="couponTypes"
              option-label="label"
              option-value="value"
              :allow-empty="false"
            />
            <div class="flex items-center gap-2">
              <InputNumber
                v-model="config.cupon.valor"
                :min="1"
                :max="config.cupon.tipo === 'porcentaje' ? 100 : 100000"
                :max-fraction-digits="2"
                input-class="w-24 text-center"
              />
              <span class="text-sm text-secondary-500">
                {{ config.cupon.tipo === 'porcentaje' ? '% de descuento' : 'de descuento' }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-secondary-700">Válido por</span>
            <InputNumber
              v-model="config.cupon.vigencia_h"
              :min="12"
              :max="168"
              show-buttons
              input-class="w-20 text-center"
            />
            <span class="text-sm text-secondary-500">horas desde el envío</span>
          </div>

          <p class="text-xs text-secondary-400">
            <i class="pi pi-info-circle mr-1"></i>
            Los códigos cuelgan de la promoción «[Automático] Recuperación de carrito», que se crea
            sola en Promociones. Si la pausas, se desactivan los códigos que aún no se usaron.
            El cupón no se suma a otras promociones del carrito: se aplica el mayor descuento.
          </p>
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          label="Guardar cambios"
          icon="pi pi-check"
          :loading="isSaving"
          @click="saveConfig"
        />
      </div>
    </template>
  </div>
</template>
