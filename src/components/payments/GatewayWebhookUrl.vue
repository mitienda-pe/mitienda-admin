<template>
  <!-- Sin URL no hay nada que registrar: la pasarela no tiene webhook
       (offline o confirmación síncrona) o aún no se guardan credenciales. -->
  <template v-if="webhookUrl">
    <!-- Bloque dentro del formulario de credenciales -->
    <div v-if="variant === 'section'">
      <h3 class="text-lg font-semibold text-secondary-800 mb-4">{{ title }}</h3>
      <div class="bg-gray-100 p-4 rounded-lg">
        <p class="text-sm text-secondary-700 mb-2">{{ description }}</p>
        <div class="flex items-center gap-2">
          <code class="text-xs bg-white px-3 py-2 rounded border flex-1 break-all select-all">{{ webhookUrl }}</code>
          <Button icon="pi pi-copy" text size="small" v-tooltip="'Copiar'" @click="copy" />
        </div>
        <p v-if="hint" class="text-xs text-secondary-500 mt-2">{{ hint }}</p>
      </div>
    </div>

    <!-- Tarjeta aparte, para las vistas que muestran el webhook fuera del form -->
    <Card v-else class="mt-4">
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-link"></i>
          <span>{{ title }}</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-3 text-sm">
          <p class="text-secondary-600">{{ description }}</p>
          <div class="flex items-center gap-2">
            <InputText :modelValue="webhookUrl" readonly class="w-full text-xs" />
            <Button icon="pi pi-copy" severity="secondary" outlined v-tooltip.top="'Copiar'" @click="copy" />
          </div>
          <p v-if="hint" class="text-xs text-secondary-500">{{ hint }}</p>
        </div>
      </template>
    </Card>
  </template>
</template>

<script setup lang="ts">
/**
 * URL del webhook de confirmación de pago de la pasarela, para que el comercio
 * la registre a mano en el panel de la pasarela.
 *
 * La URL la arma el API (lleva un hash por tienda) y llega en
 * `GET /payment-gateways/{code}` → `webhook_url`; el API devuelve null en las
 * pasarelas sin webhook, así que basta con montar el componente.
 */
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'

const props = withDefaults(defineProps<{
  /** Nombre de la pasarela, para el texto por defecto ("...en tu panel de Culqi"). */
  provider: string
  /** Layout: dentro del formulario (`section`) o como tarjeta aparte (`card`). */
  variant?: 'section' | 'card'
  /** URL explícita. Por defecto, la que devuelve el API para la pasarela abierta. */
  url?: string | null
  title?: string
  description?: string
  /** Nota opcional bajo la URL (ej. qué eventos activar en el panel). */
  hint?: string
}>(), {
  variant: 'section',
  url: undefined,
  title: 'Configuración de webhook',
  description: undefined,
  hint: undefined,
})

const toast = useToast()
const store = usePaymentGatewaysStore()

const webhookUrl = computed(() => props.url !== undefined
  ? props.url
  : store.currentConfig?.webhook_url ?? null)

const description = computed(() => props.description
  ?? `Registra esta URL en tu panel de ${props.provider} para que los pagos se confirmen automáticamente:`)

function copy() {
  if (!webhookUrl.value) return
  navigator.clipboard.writeText(webhookUrl.value)
  toast.add({ severity: 'success', summary: 'URL copiada al portapapeles', life: 2000 })
}
</script>
