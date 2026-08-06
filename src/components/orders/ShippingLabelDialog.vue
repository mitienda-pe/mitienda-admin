<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { useOrderDownloads, type PrintableOrder } from '@/composables/useOrderDownloads'
import type { SenderInfo } from '@/types/store.types'

/**
 * Paso previo a imprimir la etiqueta: deja escribir indicaciones que no viven en
 * la orden (agencia de destino del transportista, número de guía de remisión,
 * quién más puede recoger) y que hasta ahora se agregaban a mano sobre el papel.
 *
 * El cuadro arranca precargado con la nota que dejó el comprador, porque ahí es
 * donde suele venir justamente esa información.
 */
const props = defineProps<{
  visible: boolean
  order: PrintableOrder | null
  senderInfo?: SenderInfo
}>()

const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const { downloadShippingLabel } = useOrderDownloads()

const MAX_LENGTH = 300
const instructions = ref('')

const isOpen = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

// Cada apertura recarga la nota del comprador: si el operador la editó y volvió
// a abrir para otra orden, no debe arrastrarse el texto anterior.
watch(
  () => [props.visible, props.order?.orderNumber],
  ([visible]) => {
    if (visible) instructions.value = props.order?.customerNote?.trim() ?? ''
  }
)

function print() {
  if (!props.order) return
  downloadShippingLabel(props.order, props.senderInfo, instructions.value)
  isOpen.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    header="Imprimir etiqueta de envío"
    :style="{ width: '32rem' }"
    :breakpoints="{ '640px': '95vw' }"
  >
    <div class="space-y-3">
      <p class="text-sm text-gray-600">
        Lo que escribas acá se imprime en la etiqueta, debajo de las coordenadas.
      </p>

      <div>
        <label for="label-instructions" class="text-sm font-medium text-gray-700 block mb-1">
          Indicaciones para el transportista
        </label>
        <Textarea
          id="label-instructions"
          v-model="instructions"
          rows="5"
          class="w-full"
          :maxlength="MAX_LENGTH"
          placeholder="Ej: Entregar en agencia Shalom Av. Abraham Valdelomar, Pisco. Guía 000123. También puede recoger: Carlos Villalobos García, DNI 08237575."
        />
        <p class="text-xs text-gray-400 mt-1 text-right">
          {{ instructions.length }} / {{ MAX_LENGTH }}
        </p>
      </div>

      <p v-if="order?.customerNote" class="text-xs text-gray-500">
        <i class="pi pi-info-circle mr-1"></i>
        Precargamos la nota que dejó el cliente en su pedido. Puedes editarla antes de imprimir.
      </p>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="isOpen = false" />
      <Button label="Imprimir etiqueta" icon="pi pi-print" @click="print" />
    </template>
  </Dialog>
</template>
