<script setup lang="ts">
import { computed } from 'vue'
import CakePreview from './CakePreview.vue'
import type { CakeRender } from './types'

/**
 * Torta vendida con el armador (plugin `cake-builder`) en el detalle del
 * pedido. Se arma desde el snapshot congelado en la orden, no desde la config
 * actual: si la tienda cambia precios o imágenes, el pedido sigue mostrando lo
 * que se vendió.
 *
 * Las tortas vendidas por el builder del panel legacy llegan con
 * `legacy: true` (el API adapta su JSON) y en vez de capas traen la captura
 * que se guardó al comprar (`snapshot.previewUrl`).
 */
interface Snapshot {
  labels?: Record<string, string | null | undefined>
  colors?: { key: string; label: string; index: number; hex: string | null }[]
  prices?: { size?: number; addon?: number }
  render?: CakeRender | null
  previewUrl?: string | null
}

interface Props {
  pluginData?: {
    legacy?: boolean
    values?: {
      dedication?: string
      photoUrl?: string
      snapshot?: Snapshot
    } | null
    summary?: string | null
  } | null
  pluginSummary?: string | null
}

const props = defineProps<Props>()

const values = computed(() => props.pluginData?.values ?? {})
const snapshot = computed<Snapshot>(() => values.value.snapshot ?? {})
const labels = computed(() => snapshot.value.labels ?? {})
const render = computed(() => snapshot.value.render ?? null)
const previewUrl = computed(() => snapshot.value.previewUrl ?? null)
const photoUrl = computed(() => values.value.photoUrl || '')
const dedication = computed(() => (values.value.dedication ?? '').trim())

const rows = computed(() => {
  const l = labels.value
  const size = [l.size, l.sizeDetail].filter(Boolean).join(' · ')
  return [
    { label: 'Tamaño', value: size },
    { label: 'Porciones', value: l.portions },
    { label: 'Sabor', value: l.flavor },
    { label: 'Relleno', value: l.filling },
    { label: 'Base', value: l.base },
    { label: 'Complemento', value: l.addon },
  ].filter((r) => r.value)
})
</script>

<template>
  <div class="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="w-full shrink-0 sm:w-44">
        <CakePreview v-if="render" :render="render" />
        <a v-else-if="previewUrl" :href="previewUrl" target="_blank" rel="noopener">
          <img :src="previewUrl" alt="Torta armada por el cliente" class="w-full rounded">
        </a>
      </div>

      <div class="min-w-0 flex-1 space-y-2">
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <template v-for="row in rows" :key="row.label">
            <dt class="text-gray-500">{{ row.label }}</dt>
            <dd class="font-medium text-gray-900">{{ row.value }}</dd>
          </template>
        </dl>

        <ul v-if="snapshot.colors?.length" class="flex flex-wrap gap-x-4 gap-y-1">
          <li v-for="color in snapshot.colors" :key="color.key" class="flex items-center gap-1.5">
            <span
              v-if="color.hex"
              class="inline-block h-3.5 w-3.5 rounded-full ring-1 ring-black/15"
              :style="{ backgroundColor: color.hex }"
            />
            <span class="text-gray-500">{{ color.label }}:</span>
            <span class="font-medium text-gray-900">{{ color.index }}</span>
          </li>
        </ul>

        <p v-if="dedication" class="rounded bg-white px-2 py-1 text-sm text-gray-900">
          <span class="text-xs text-gray-500">Dedicatoria:</span> «{{ dedication }}»
        </p>

        <a
          v-if="photoUrl"
          :href="photoUrl"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <i class="pi pi-download text-xs" />
          Descargar foto para imprimir
        </a>

        <p v-if="pluginData?.legacy" class="text-gray-400">Pedido del armador anterior.</p>
      </div>
    </div>
  </div>
</template>
